from rest_framework import serializers
from .models import Caja, MovimientoCaja, CierreCaja, TrasladoDinero


class MovimientoCajaSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = MovimientoCaja
        fields = [
            'id', 'caja', 'tipo', 'valor', 'descripcion',
            'creado_por', 'creado_por_nombre', 'fecha'
        ]
        read_only_fields = ['creado_por', 'fecha']


class CierreCajaSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = CierreCaja
        fields = [
            'id', 'caja', 'fecha', 'saldo_teorico', 'saldo_fisico',
            'diferencia', 'nota', 'creado_por', 'creado_por_nombre', 'creado_en'
        ]
        read_only_fields = ['creado_por', 'fecha', 'creado_en', 'saldo_teorico', 'diferencia']


class TrasladoDineroSerializer(serializers.ModelSerializer):
    caja_origen_nombre  = serializers.CharField(source='caja_origen.bodega.nombre',  read_only=True)
    caja_destino_nombre = serializers.CharField(source='caja_destino.bodega.nombre', read_only=True)
    creado_por_nombre   = serializers.CharField(source='creado_por.get_full_name',   read_only=True)

    class Meta:
        model = TrasladoDinero
        fields = [
            'id', 'caja_origen', 'caja_origen_nombre',
            'caja_destino', 'caja_destino_nombre',
            'valor', 'nota', 'creado_por', 'creado_por_nombre', 'creado_en'
        ]
        read_only_fields = ['creado_por', 'creado_en']


class CajaDestinoSerializer(serializers.ModelSerializer):
    """Serializer liviano para poblar selectores de traslado.
    No expone saldo_actual: el administrador no debe ver el saldo
    de cajas de otras bodegas, solo elegir a cuál trasladar."""
    bodega_nombre = serializers.CharField(
        source='bodega.nombre',
        read_only=True
    )

    class Meta:
        model = Caja
        fields = ['id', 'bodega', 'bodega_nombre']


class CajaSerializer(serializers.ModelSerializer):
    bodega_nombre = serializers.CharField(
        source='bodega.nombre',
        read_only=True
    )
    ultimo_cierre = serializers.SerializerMethodField()

    class Meta:
        model = Caja
        fields = ['id', 'bodega', 'bodega_nombre', 'saldo_actual', 'abierta', 'ultimo_cierre']
        read_only_fields = ['saldo_actual', 'abierta']

    def get_ultimo_cierre(self, obj):
        cierre = obj.cierres.first()
        if not cierre:
            return None
        return {
            'id': cierre.id,
            'fecha': cierre.fecha,
            'saldo_teorico': float(cierre.saldo_teorico),
            'saldo_fisico': float(cierre.saldo_fisico),
            'diferencia': float(cierre.diferencia),
            'nota': cierre.nota,
        }