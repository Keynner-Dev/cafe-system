from rest_framework import serializers
from .models import Venta, DetalleVenta
from inventario.models import MovimientoInventario

class DetalleVentaSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tipo_cafe_nombre = serializers.CharField(source='tipo_cafe.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)

    class Meta:
        model = DetalleVenta
        fields = '__all__'


class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)

    class Meta:
        model = Venta
        fields = '__all__'

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')

        venta = Venta.objects.create(**validated_data)

        for detalle_data in detalles_data:
            detalle = DetalleVenta.objects.create(venta=venta, **detalle_data)

            # Cada venta genera una SALIDA de inventario
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