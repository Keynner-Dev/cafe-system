from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from .models import Venta, DetalleVenta
from inventario.models import MovimientoInventario
from django.db.models import Sum


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
        extra_kwargs = {
            'venta': {'required': False}
        }


class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    numero_remision = serializers.CharField(read_only=True)
    total_kilos = serializers.SerializerMethodField()
    total_bultos = serializers.SerializerMethodField()
    creado_por = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Venta
        fields = '__all__'
        read_only_fields = ['creado_por', 'creado_en', 'flete_descontado']

    # ── Seguridad: campos exclusivos del jefe ──
    def get_fields(self):
        """Bloquea escritura de precio_kilo_jefe y flete_caja si no es jefe."""
        fields = super().get_fields()
        request = self.context.get('request')
        usuario = getattr(request, 'user', None)

        if usuario and usuario.is_authenticated and usuario.rol != 'jefe':
            if 'precio_kilo_jefe' in fields:
                fields['precio_kilo_jefe'].read_only = True
            if 'flete_caja' in fields:
                fields['flete_caja'].read_only = True

        return fields

    def to_representation(self, instance):
        """Oculta precio_kilo_jefe por completo si quien consulta no es jefe."""
        data = super().to_representation(instance)
        request = self.context.get('request')
        usuario = getattr(request, 'user', None)

        if usuario and usuario.is_authenticated and usuario.rol != 'jefe':
            data.pop('precio_kilo_jefe', None)

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
        venta = Venta.objects.create(**validated_data)

        for detalle_data in detalles_data:
            detalle = DetalleVenta.objects.create(venta=venta, **detalle_data)
            MovimientoInventario.objects.create(
                tipo='salida',
                tipo_cafe=detalle.tipo_cafe,
                bodega=detalle.bodega,
                kilos=detalle.kilos,
                referencia=f'venta-{venta.id}',
                nota=f'Salida por remisión {venta.numero_remision}'
            )

        return venta