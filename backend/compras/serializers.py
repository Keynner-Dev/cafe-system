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
    total = serializers.SerializerMethodField()
    total_deposito_pendiente = serializers.SerializerMethodField()
    kilos_deposito_pendiente = serializers.SerializerMethodField()
    tiene_deposito_pendiente = serializers.SerializerMethodField()
    creado_por = serializers.StringRelatedField(read_only=True)
    cuenta_por_pagar = serializers.SerializerMethodField()

    # ← NUEVO: opcional, solo se usa en el create(), nunca se devuelve en la respuesta
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

        # ← Valida el abono a letra si viene en el payload
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
        abono_letra_data = validated_data.pop('abono_letra', None)  # ← extrae antes de crear

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

        # ← Si viene un abono a letra, se crea ligado a esta compra.
        # El AbonoLetra dispara su propia señal post_save que registra el ingreso en caja.
        if abono_letra_data:
            from letras_cambio.models import LetraCambio, AbonoLetra
            letra = LetraCambio.objects.get(pk=abono_letra_data['letra_id'])
            AbonoLetra.objects.create(
                letra=letra,
                valor=abono_letra_data['valor'],
                compra=compra,
                creado_por=compra.creado_por,
            )

        return compra