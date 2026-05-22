from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from .models import Venta, DetalleVenta
from inventario.models import MovimientoInventario
from django.db.models import Sum


def get_stock_disponible(tipo_cafe_id, bodega_id):
    """Calcula el stock actual de un tipo de café en una bodega"""
    movimientos = MovimientoInventario.objects.filter(
        tipo_cafe_id=tipo_cafe_id,
        bodega_id=bodega_id
    )
    entradas = movimientos.filter(
        tipo__in=['entrada', 'traslado_entrada']
    ).aggregate(total=Sum('kilos'))['total'] or Decimal('0')

    salidas = movimientos.filter(
        tipo__in=['salida', 'traslado_salida']
    ).aggregate(total=Sum('kilos'))['total'] or Decimal('0')

    return entradas - salidas


class DetalleVentaSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
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
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)

    class Meta:
        model = Venta
        fields = '__all__'

    def validate(self, data):
        """Valida que haya stock suficiente para cada detalle"""
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
                precio_kilo=detalle.precio_kilo,
                referencia=f'venta-{venta.id}',
                nota=f'Salida por venta #{venta.id}'
            )

        return venta