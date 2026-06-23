from rest_framework import serializers
from .models import LetraCambio, AbonoLetra


class AbonoLetraSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name', read_only=True
    )

    class Meta:
        model = AbonoLetra
        fields = [
            'id', 'letra', 'valor', 'fecha',
            'notas', 'compra', 'creado_por', 'creado_por_nombre',
        ]
        read_only_fields = ['fecha', 'creado_por']
        extra_kwargs = {
            'letra': {'required': False},  # se asigna desde la URL en la view
        }


class LetraCambioSerializer(serializers.ModelSerializer):
    caficultor_nombre = serializers.CharField(
        source='caficultor.nombre', read_only=True
    )
    bodega_nombre = serializers.CharField(
        source='bodega.nombre', read_only=True
    )
    saldo = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name', read_only=True
    )

    class Meta:
        model = LetraCambio
        fields = [
            'id', 'caficultor', 'caficultor_nombre',
            'bodega', 'bodega_nombre',
            'valor_total', 'valor_abonado', 'saldo', 'estado',
            'fecha_creacion', 'notas',
            'creado_por', 'creado_por_nombre',
        ]
        read_only_fields = [
            'valor_abonado', 'estado', 'fecha_creacion', 'creado_por'
        ]


class LetraCambioResumenSerializer(serializers.Serializer):
    """Resumen liviano para la notificación flotante en CompraModal."""
    id = serializers.IntegerField()
    valor_total = serializers.DecimalField(max_digits=14, decimal_places=2)
    valor_abonado = serializers.DecimalField(max_digits=14, decimal_places=2)
    saldo = serializers.DecimalField(max_digits=14, decimal_places=2)
    estado = serializers.CharField()
    fecha_creacion = serializers.DateTimeField()