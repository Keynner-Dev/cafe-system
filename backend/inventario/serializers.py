from rest_framework import serializers
from .models import TipoCafe, Bodega, MovimientoInventario, AjusteStock

class TipoCafeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoCafe
        fields = '__all__'


class BodegaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bodega
        fields = '__all__'


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    # Estos campos muestran el nombre en lugar del ID
    tipo_cafe_nombre = serializers.CharField(source='tipo_cafe.nombre', read_only=True)
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    bodega_destino_nombre = serializers.CharField(
        source='bodega_destino.nombre',
        read_only=True,
        default=None
    )

    class Meta:
        model = MovimientoInventario
        fields = '__all__'


# ── ÍTEM 26 ──
class AjusteStockSerializer(serializers.ModelSerializer):
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    tipo_cafe_nombre = serializers.CharField(source='tipo_cafe.nombre', read_only=True)
    realizado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = AjusteStock
        fields = '__all__'
        read_only_fields = [
            'kilos_antes', 'kilos_despues', 'kilos_ajuste',
            'realizado_por', 'movimiento', 'fecha',
        ]

    def get_realizado_por_nombre(self, obj):
        u = obj.realizado_por
        return (u.get_full_name() or u.username) if u else None