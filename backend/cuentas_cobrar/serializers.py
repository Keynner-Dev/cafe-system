from rest_framework import serializers
from .models import CuentaPorCobrar, AbonoCobranza


class AbonoCobranzaSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name', read_only=True
    )

    class Meta:
        model  = AbonoCobranza
        fields = [
            'id', 'cuenta', 'valor', 'fecha',
            'notas', 'creado_por', 'creado_por_nombre',
        ]
        read_only_fields = ['fecha', 'creado_por']


class CuentaPorCobrarSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(
        source='empresa.nombre', read_only=True
    )
    bodega_nombre  = serializers.CharField(
        source='bodega.nombre', read_only=True
    )
    saldo = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name', read_only=True
    )

    class Meta:
        model  = CuentaPorCobrar
        fields = [
            'id', 'empresa', 'empresa_nombre',
            'venta', 'bodega', 'bodega_nombre',
            'valor_total', 'valor_cobrado', 'saldo', 'estado',
            'fecha_creacion', 'notas',
            'creado_por', 'creado_por_nombre',
        ]
        read_only_fields = [
            'valor_cobrado', 'estado', 'fecha_creacion', 'creado_por'
        ]