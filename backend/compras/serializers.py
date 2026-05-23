from rest_framework import serializers
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

    def create(self, validated_data):
        liquidacion = LiquidacionDeposito.objects.create(**validated_data)
        detalle = liquidacion.detalle_compra

        # Marcar como liquidado si ya no quedan kilos pendientes
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
        extra_kwargs = {
            'compra': {'required': False}
        }

    def get_subtotal(self, obj):
        return float(obj.subtotal or 0)

    def get_kilos_liquidados(self, obj):
        return float(obj.kilos_liquidados or 0)

    def get_kilos_pendientes_liquidar(self, obj):
        return float(obj.kilos_pendientes_liquidar or 0)


class CompraSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraSerializer(many=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    total = serializers.SerializerMethodField()
    total_deposito_pendiente = serializers.SerializerMethodField()
    kilos_deposito_pendiente = serializers.SerializerMethodField()
    tiene_deposito_pendiente = serializers.SerializerMethodField()

    class Meta:
        model = Compra
        fields = '__all__'

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

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
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

        return compra