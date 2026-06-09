from rest_framework import serializers
from .models import Gasto


class GastoSerializer(serializers.ModelSerializer):
    bodega_nombre = serializers.CharField(source='bodega.nombre', read_only=True)
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name', read_only=True
    )

    class Meta:
        model = Gasto
        fields = [
            'id', 'bodega', 'bodega_nombre', 'categoria', 'descripcion',
            'valor', 'medio_pago', 'fecha', 'creado_por', 'creado_por_nombre',
            'creado_en'
        ]
        read_only_fields = ['creado_por', 'creado_en']
        extra_kwargs = {
            'bodega': {'required': False}
        }