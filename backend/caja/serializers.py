from rest_framework import serializers
from .models import Caja, MovimientoCaja


class MovimientoCajaSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = MovimientoCaja
        fields = [
            'id', 'tipo', 'valor', 'descripcion',
            'creado_por', 'creado_por_nombre', 'fecha'
        ]
        read_only_fields = ['creado_por', 'fecha']


class CajaSerializer(serializers.ModelSerializer):
    bodega_nombre = serializers.CharField(
        source='bodega.nombre',
        read_only=True
    )

    class Meta:
        model = Caja
        fields = ['id', 'bodega', 'bodega_nombre', 'saldo_actual']
        read_only_fields = ['saldo_actual']