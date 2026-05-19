from rest_framework import serializers
from .models import Compra, DetalleCompra
from inventario.models import MovimientoInventario

class DetalleCompraSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tipo_cafe_nombre = serializers.CharField(source='tipo_cafe.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)

    class Meta:
        model = DetalleCompra
        fields = '__all__'


class CompraSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraSerializer(many=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)

    class Meta:
        model = Compra
        fields = '__all__'

    def create(self, validated_data):
        # Extraemos los detalles del request
        detalles_data = validated_data.pop('detalles')

        # Creamos la compra
        compra = Compra.objects.create(**validated_data)

        # Por cada detalle, creamos el detalle Y el movimiento de inventario
        for detalle_data in detalles_data:
            detalle = DetalleCompra.objects.create(compra=compra, **detalle_data)

            # ← Aquí está la lógica clave: cada compra genera una ENTRADA
            MovimientoInventario.objects.create(
                tipo='entrada',
                tipo_cafe=detalle.tipo_cafe,
                bodega=detalle.bodega,
                kilos=detalle.kilos,
                precio_kilo=detalle.precio_kilo,
                referencia=f'compra-{compra.id}',
                nota=f'Entrada por compra #{compra.id}'
            )

        return compra