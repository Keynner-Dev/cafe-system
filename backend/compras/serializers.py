from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from .models import Compra, DetalleCompra, LiquidacionDeposito
from inventario.models import MovimientoInventario


class LiquidacionDepositoSerializer(serializers.ModelSerializer):
    subtotal = serializers.SerializerMethodField()

    def get_subtotal(self, obj):
        return float(obj.subtotal or 0)

    class Meta:
        model = LiquidacionDeposito
        fields = '__all__'
        read_only_fields = ['creado_por', 'creado_en']

    def create(self, validated_data):
        liquidacion = LiquidacionDeposito.objects.create(**validated_data)
        detalle = liquidacion.detalle_compra
        if detalle.kilos_pendientes_liquidar <= 0:
            detalle.liquidado = True
            detalle.save()
        return liquidacion


class DetalleCompraSerializer(serializers.ModelSerializer):
    subtotal = serializers.SerializerMethodField()
    kilos_liquidados = serializers.SerializerMethodField()
    kilos_pendientes_liquidar = serializers.SerializerMethodField()
    tipo_cafe_nombre = serializers.CharField(source='tipo_cafe.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    liquidaciones = LiquidacionDepositoSerializer(many=True, read_only=True)

    class Meta:
        model = DetalleCompra
        fields = '__all__'
        extra_kwargs = {'compra': {'required': False}}

    def get_subtotal(self, obj):
        return float(obj.subtotal or 0)

    def get_kilos_liquidados(self, obj):
        return float(obj.kilos_liquidados or 0)

    def get_kilos_pendientes_liquidar(self, obj):
        return float(obj.kilos_pendientes_liquidar or 0)


class CuentaPorPagarResumenSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    estado = serializers.CharField()
    valor_total = serializers.DecimalField(max_digits=14, decimal_places=2)
    valor_pagado = serializers.DecimalField(max_digits=14, decimal_places=2)
    saldo = serializers.DecimalField(max_digits=14, decimal_places=2)


class CompraSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraSerializer(many=True)
    caficultor_nombre = serializers.CharField(source='caficultor.nombre', read_only=True)

    # ── NUEVO (ítem 16): teléfono de WhatsApp del caficultor, para que
    # CompraDetalle.jsx pueda reenviar el comprobante por WhatsApp sin
    # tener que hacer una llamada aparte a /terceros/{id}. Solo lectura,
    # no se usa nunca en create() ni se puede mandar en el payload. ──
    caficultor_telefono_whatsapp = serializers.CharField(
        source='caficultor.telefono_whatsapp', read_only=True, allow_null=True
    )

    total = serializers.SerializerMethodField()
    total_deposito_pendiente = serializers.SerializerMethodField()
    kilos_deposito_pendiente = serializers.SerializerMethodField()
    tiene_deposito_pendiente = serializers.SerializerMethodField()
    creado_por = serializers.StringRelatedField(read_only=True)
    cuenta_por_pagar = serializers.SerializerMethodField()

    # ← NUEVO: lista de nombres de bodega únicos de los detalles de esta compra
    bodegas = serializers.SerializerMethodField()

    # ── NUEVO (ítem 16): abonos a letra que se hicieron desde esta compra
    # (AbonoLetra.compra es FK hacia Compra, related_name='abonos_letra').
    # Permite que CompraDetalle.jsx muestre el mismo desglose que ya se ve
    # en la pantalla de éxito de CompraModal.jsx, incluso después de cerrar
    # el modal y volver a abrir la compra desde la tabla. ──
    abonos_letra = serializers.SerializerMethodField()

    # opcional, solo se usa en el create(), nunca se devuelve en la respuesta
    abono_letra = serializers.DictField(write_only=True, required=False)

    class Meta:
        model = Compra
        fields = '__all__'
        read_only_fields = ['creado_por', 'creado_en']

    def get_total(self, obj):
        try:
            return float(obj.total)
        except Exception:
            return 0.0

    def get_total_deposito_pendiente(self, obj):
        try:
            return float(obj.total_deposito_pendiente)
        except Exception:
            return 0.0

    def get_kilos_deposito_pendiente(self, obj):
        try:
            total = sum(
                d.kilos_pendientes_liquidar
                for d in obj.detalles.filter(es_deposito=True, liquidado=False)
            )
            return float(total)
        except Exception:
            return 0.0

    def get_tiene_deposito_pendiente(self, obj):
        return obj.detalles.filter(es_deposito=True, liquidado=False).exists()

    def get_cuenta_por_pagar(self, obj):
        cuenta = obj.cuentas_por_pagar.first()
        if not cuenta:
            return None
        return {
            'id': cuenta.id,
            'estado': cuenta.estado,
            'valor_total': float(cuenta.valor_total),
            'valor_pagado': float(cuenta.valor_pagado),
            'saldo': float(cuenta.saldo),
        }

    # ← NUEVO: nombres únicos de bodega de todos los detalles de la compra
    def get_bodegas(self, obj):
        nombres = obj.detalles.values_list('bodega__nombre', flat=True).distinct()
        return list(nombres)

    # ── NUEVO (ítem 16) ──
    # Devuelve los abonos a letra registrados DESDE esta compra específica.
    # compra.total (arriba) nunca resta estos valores -- sigue siendo solo
    # el subtotal del café -- así que el frontend (CompraDetalle.jsx) debe
    # restar manualmente la suma de "valor" de esta lista para mostrar el
    # total real que se pagó en efectivo.
    #
    # 'saldo_letra_restante' es el saldo ACTUAL de la letra (propiedad
    # calculada en vivo: valor_total - valor_abonado). Si la letra recibió
    # abonos posteriores de otras compras, este número refleja el saldo de
    # HOY, no el saldo histórico exacto en el momento de este abono --
    # decisión tomada a propósito por simplicidad, confirmada con el cliente.
    def get_abonos_letra(self, obj):
        abonos = obj.abonos_letra.select_related('letra').all()
        resultado = []
        for abono in abonos:
            resultado.append({
                'id': abono.id,
                'letra_id': abono.letra_id,
                'valor': float(abono.valor),
                'fecha': abono.fecha.isoformat(),
                'letra_fecha_creacion': abono.letra.fecha_creacion.isoformat(),
                'saldo_letra_restante': float(abono.letra.saldo),
            })
        return resultado

    def validate(self, data):
        request = self.context.get('request')
        usuario = getattr(request, 'user', None)
        detalles = data.get('detalles', [])

        if usuario and usuario.is_authenticated and usuario.rol == 'administrador':
            for i, detalle in enumerate(detalles):
                bodega = detalle.get('bodega')
                if bodega and bodega != usuario.bodega:
                    raise serializers.ValidationError({
                        'detalles': f'Línea {i+1}: no tienes acceso a la bodega {bodega.nombre}.'
                    })

        # Valida el abono a letra si viene en el payload
        abono_letra = data.get('abono_letra')
        if abono_letra:
            from letras_cambio.models import LetraCambio
            try:
                letra = LetraCambio.objects.get(pk=abono_letra.get('letra_id'))
            except LetraCambio.DoesNotExist:
                raise serializers.ValidationError({'abono_letra': 'Letra no encontrada.'})

            valor = abono_letra.get('valor')
            if not valor or float(valor) <= 0:
                raise serializers.ValidationError({'abono_letra': 'El valor del abono debe ser mayor a cero.'})
            if float(valor) > float(letra.saldo):
                raise serializers.ValidationError({
                    'abono_letra': f'El abono (${valor}) supera el saldo de la letra (${letra.saldo}).'
                })
            if usuario and usuario.rol == 'administrador' and letra.bodega != usuario.bodega:
                raise serializers.ValidationError({'abono_letra': 'No tienes acceso a esta letra.'})

        return data

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        abono_letra_data = validated_data.pop('abono_letra', None)

        compra = Compra.objects.create(**validated_data)

        for detalle_data in detalles_data:
            detalle = DetalleCompra.objects.create(compra=compra, **detalle_data)
            MovimientoInventario.objects.create(
                tipo='entrada',
                tipo_cafe=detalle.tipo_cafe,
                bodega=detalle.bodega,
                kilos=detalle.kilos,
                precio_kilo=detalle.precio_kilo,
                referencia=f'compra-{compra.id}',
                nota=f'{"[DEPÓSITO] " if detalle.es_deposito else ""}Entrada por compra #{compra.id}'
            )
            # La señal post_save de DetalleCompra ya genera el egreso de caja automáticamente

        # Si viene un abono a letra, se crea ligado a esta compra.
        # El AbonoLetra dispara su propia señal post_save que registra el ingreso en caja.
        if abono_letra_data:
            from letras_cambio.models import LetraCambio, AbonoLetra
            # ── select_for_update() dentro del @transaction.atomic que ya
            # tiene este método — bloquea la letra para que otro abono
            # simultáneo espere antes de leer su saldo. ──
            letra = LetraCambio.objects.select_for_update().get(
                pk=abono_letra_data['letra_id']
            )
            AbonoLetra.objects.create(
                letra=letra,
                valor=abono_letra_data['valor'],
                compra=compra,
                creado_por=compra.creado_por,
            )

        return compra