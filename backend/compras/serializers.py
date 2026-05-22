from rest_framework import serializers
from django.db import transaction
from .models import Compra, DetalleCompra, LiquidacionDeposito
from inventario.models import MovimientoInventario

class LiquidacionDepositoSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = LiquidacionDeposito
        fields = '__all__'

    def create(self, validated_data):
        liquidacion = LiquidacionDeposito.objects.create(**validated_data)
        detalle = liquidacion.detalle_compra

        # Marcar como liquidado si ya no quedan kilos pendientes
        if detalle.kilos_pendientes_liquidar <= 0:
            detalle.liquidado = True
            detalle.save()

        return liquidacion


class DetalleCompraSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    kilos_liquidados = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    kilos_pendientes_liquidar = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tipo_cafe_nombre = serializers.CharField(source='tipo_cafe.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    liquidaciones = LiquidacionDepositoSerializer(many=True, read_only=True)

    class Meta:
        model = DetalleCompra
        fields = '__all__'
        extra_kwargs = {
            'compra': {'required': False}
        }


class CompraSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraSerializer(many=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_deposito_pendiente = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)

    class Meta:
        model = Compra
        fields = '__all__'

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        compra = Compra.objects.create(**validated_data)

        for detalle_data in detalles_data:
            detalle = DetalleCompra.objects.create(compra=compra, **detalle_data)

            # El café siempre entra físicamente a la bodega
            # sin importar si es depósito o no
            MovimientoInventario.objects.create(
                tipo='entrada',
                tipo_cafe=detalle.tipo_cafe,
                bodega=detalle.bodega,
                kilos=detalle.kilos,
                precio_kilo=detalle.precio_kilo,
                referencia=f'compra-{compra.id}',
                nota=f'{"[DEPÓSITO] " if detalle.es_deposito else ""}Entrada por compra #{compra.id}'
            )

        return compra