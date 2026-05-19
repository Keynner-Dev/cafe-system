from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import TipoCafe, Bodega, MovimientoInventario
from .serializers import TipoCafeSerializer, BodegaSerializer, MovimientoInventarioSerializer

class TipoCafeViewSet(viewsets.ModelViewSet):
    queryset = TipoCafe.objects.all()
    serializer_class = TipoCafeSerializer

class BodegaViewSet(viewsets.ModelViewSet):
    queryset = Bodega.objects.all()
    serializer_class = BodegaSerializer

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer

    # Endpoint especial: /api/inventario/movimientos/stock/
    @action(detail=False, methods=['get'])
    def stock(self, request):
        """Calcula el stock actual por bodega y tipo de café"""
        bodega_id = request.query_params.get('bodega')
        tipo_cafe_id = request.query_params.get('tipo_cafe')

        movimientos = MovimientoInventario.objects.all()

        if bodega_id:
            movimientos = movimientos.filter(bodega_id=bodega_id)
        if tipo_cafe_id:
            movimientos = movimientos.filter(tipo_cafe_id=tipo_cafe_id)

        # Entradas
        entradas = movimientos.filter(
            tipo__in=['entrada', 'traslado_entrada']
        ).aggregate(total=Sum('kilos'))['total'] or 0

        # Salidas
        salidas = movimientos.filter(
            tipo__in=['salida', 'traslado_salida']
        ).aggregate(total=Sum('kilos'))['total'] or 0

        return Response({
            'entradas': entradas,
            'salidas': salidas,
            'stock_actual': entradas - salidas
        })