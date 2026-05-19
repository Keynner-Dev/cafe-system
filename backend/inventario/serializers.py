from rest_framework import serializers
from .models import TipoCafe, Bodega, MovimientoInventario

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