from rest_framework import serializers
from .models import CuentaPorPagar, AbonoCuentaPorPagar


class AbonoCuentaPorPagarSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name', read_only=True
    )

    class Meta:
        model = AbonoCuentaPorPagar
        fields = [
            'id', 'valor', 'medio_pago', 'nota',
            'fecha', 'creado_por', 'creado_por_nombre', 'creado_en'
        ]
        read_only_fields = ['creado_por', 'creado_en']


class CuentaPorPagarSerializer(serializers.ModelSerializer):
    caficultor_nombre = serializers.CharField(
        source='caficultor.nombre', read_only=True
    )
    bodega_nombre = serializers.CharField(
        source='bodega.nombre', read_only=True
    )
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name', read_only=True
    )
    saldo = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = CuentaPorPagar
        fields = [
            'id', 'caficultor', 'caficultor_nombre',
            'compra', 'bodega', 'bodega_nombre',
            'descripcion', 'valor_total', 'valor_pagado', 'saldo',
            'estado', 'fecha', 'creado_por', 'creado_por_nombre', 'creado_en'
        ]
        read_only_fields = ['creado_por', 'creado_en', 'valor_pagado', 'estado']
        extra_kwargs = {
            'bodega': {'required': False}
        }