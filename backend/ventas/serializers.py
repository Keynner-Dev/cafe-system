from rest_framework import serializers
from django.db import transaction
from django.db.models import Sum
from decimal import Decimal
from .models import Venta, DetalleVenta
from inventario.models import MovimientoInventario, CostoInventario, Bodega


def get_stock_disponible(tipo_cafe_id, bodega_id):
    movimientos = MovimientoInventario.objects.filter(
        tipo_cafe_id=tipo_cafe_id,
        bodega_id=bodega_id,
    )
    entradas = movimientos.filter(
        tipo__in=['entrada', 'traslado_entrada']
    ).aggregate(total=Sum('kilos'))['total'] or Decimal('0')

    salidas = movimientos.filter(
        tipo__in=['salida', 'traslado_salida']
    ).aggregate(total=Sum('kilos'))['total'] or Decimal('0')

    return entradas - salidas


class DetalleVentaSerializer(serializers.ModelSerializer):
    tipo_cafe_nombre = serializers.CharField(source='tipo_cafe.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)

    class Meta:
        model = DetalleVenta
        fields = '__all__'
        read_only_fields = ['costo_promedio']
        extra_kwargs = {
            'venta': {'required': False}
        }


class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    flete_caja_bodega = serializers.SerializerMethodField()
    numero_remision = serializers.CharField(read_only=True)
    total_kilos = serializers.SerializerMethodField()
    total_bultos = serializers.SerializerMethodField()
    utilidad_total = serializers.SerializerMethodField()
    creado_por = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Venta
        fields = '__all__'
        read_only_fields = [
            'creado_por', 'creado_en',
            'flete_caja', 'flete_descontado',  # 100% automático
        ]

    # ── Seguridad: precio_kilo_jefe solo lo escribe el jefe ──
    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        usuario = getattr(request, 'user', None)

        if usuario and usuario.is_authenticated and usuario.rol != 'jefe':
            if 'precio_kilo_jefe' in fields:
                fields['precio_kilo_jefe'].read_only = True

        return fields

    def to_representation(self, instance):
        """Oculta precio_kilo_jefe y utilidad_total si quien consulta no es jefe."""
        data = super().to_representation(instance)
        request = self.context.get('request')
        usuario = getattr(request, 'user', None)

        if usuario and usuario.is_authenticated and usuario.rol != 'jefe':
            data.pop('precio_kilo_jefe', None)
            data.pop('utilidad_total', None)

        return data

    def get_total_kilos(self, obj):
        try:
            return float(obj.total_kilos)
        except Exception:
            return 0.0

    def get_total_bultos(self, obj):
        try:
            return int(obj.total_bultos)
        except Exception:
            return 0

    def get_utilidad_total(self, obj):
        utilidad = obj.utilidad_total
        return float(utilidad) if utilidad is not None else None

    def get_flete_caja_bodega(self, obj):
        return obj.flete_caja.bodega.nombre if obj.flete_caja else None

    def validate(self, data):
        detalles = data.get('detalles', [])
        errores = []

        for i, detalle in enumerate(detalles):
            tipo_cafe = detalle.get('tipo_cafe')
            bodega = detalle.get('bodega')
            kilos = detalle.get('kilos', Decimal('0'))

            stock = get_stock_disponible(tipo_cafe.id, bodega.id)

            if kilos > stock:
                errores.append(
                    f"Línea {i+1} — {tipo_cafe.nombre} en {bodega.nombre}: "
                    f"stock disponible {stock} kg, intentas vender {kilos} kg."
                )

        if errores:
            raise serializers.ValidationError({'stock': errores})

        return data

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        request = self.context.get('request')
        usuario = getattr(request, 'user', None)

        venta = Venta.objects.create(**validated_data)

        for detalle_data in detalles_data:
            detalle = DetalleVenta.objects.create(venta=venta, **detalle_data)

            # Captura el costo promedio (WAC) ANTES de descontar el inventario
            try:
                costo_inv = CostoInventario.objects.get(
                    bodega=detalle.bodega, tipo_cafe=detalle.tipo_cafe
                )
                costo_actual = costo_inv.costo_promedio
            except CostoInventario.DoesNotExist:
                costo_actual = Decimal('0')

            detalle.costo_promedio = costo_actual
            detalle.save(update_fields=['costo_promedio'])

            MovimientoInventario.objects.create(
                tipo='salida',
                tipo_cafe=detalle.tipo_cafe,
                bodega=detalle.bodega,
                kilos=detalle.kilos,
                referencia=f'venta-{venta.id}',
                nota=f'Salida por remisión {venta.numero_remision}'
            )

        # ── Caja del flete: la bodega que HACE la remisión ──
        if venta.flete_valor and venta.flete_valor > 0:
            from caja.models import Caja
            bodega_responsable = None

            if usuario and getattr(usuario, 'is_authenticated', False) and usuario.rol == 'administrador':
                # Caso normal: la bodega del administrador que crea la remisión
                bodega_responsable = usuario.bodega
            else:
                # Jefe creando directamente: respaldo = bodega con más kilos en el detalle
                primera = venta.detalles.values('bodega').annotate(
                    total_kilos=Sum('kilos')
                ).order_by('-total_kilos').first()
                if primera:
                    bodega_responsable = Bodega.objects.get(pk=primera['bodega'])

            if bodega_responsable:
                try:
                    caja = Caja.objects.get(bodega=bodega_responsable)
                    venta.flete_caja = caja
                    venta.save()  # dispara la señal egreso_caja_flete
                except Caja.DoesNotExist:
                    pass

        return venta