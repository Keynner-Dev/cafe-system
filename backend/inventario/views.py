from rest_framework import viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from django.db import transaction
from decimal import Decimal
from .models import TipoCafe, Bodega, MovimientoInventario
from .serializers import TipoCafeSerializer, BodegaSerializer, MovimientoInventarioSerializer


def get_stock(tipo_cafe_id, bodega_id):
    movimientos = MovimientoInventario.objects.filter(
        tipo_cafe_id=tipo_cafe_id,
        bodega_id=bodega_id
    )
    entradas = movimientos.filter(
        tipo__in=['entrada', 'traslado_entrada']
    ).aggregate(total=Sum('kilos'))['total'] or Decimal('0')

    salidas = movimientos.filter(
        tipo__in=['salida', 'traslado_salida']
    ).aggregate(total=Sum('kilos'))['total'] or Decimal('0')

    return entradas - salidas


class TipoCafeViewSet(viewsets.ModelViewSet):
    queryset = TipoCafe.objects.all()
    serializer_class = TipoCafeSerializer


class BodegaViewSet(viewsets.ModelViewSet):
    queryset = Bodega.objects.all()
    serializer_class = BodegaSerializer


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer

    @action(detail=False, methods=['get'])
    def stock(self, request):
        bodega_id = request.query_params.get('bodega')
        tipo_cafe_id = request.query_params.get('tipo_cafe')

        movimientos = MovimientoInventario.objects.all()
        if bodega_id:
            movimientos = movimientos.filter(bodega_id=bodega_id)
        if tipo_cafe_id:
            movimientos = movimientos.filter(tipo_cafe_id=tipo_cafe_id)

        entradas = movimientos.filter(
            tipo__in=['entrada', 'traslado_entrada']
        ).aggregate(total=Sum('kilos'))['total'] or Decimal('0')

        salidas = movimientos.filter(
            tipo__in=['salida', 'traslado_salida']
        ).aggregate(total=Sum('kilos'))['total'] or Decimal('0')

        return Response({
            'entradas': float(entradas),
            'salidas': float(salidas),
            'stock_actual': float(entradas - salidas)
        })


@api_view(['POST'])
def trasladar(request):
    tipo_cafe_id = request.data.get('tipo_cafe')
    bodega_origen_id = request.data.get('bodega_origen')
    bodega_destino_id = request.data.get('bodega_destino')
    kilos = request.data.get('kilos')
    nota = request.data.get('nota', '')

    if not all([tipo_cafe_id, bodega_origen_id, bodega_destino_id, kilos]):
        return Response(
            {'error': 'Todos los campos son requeridos.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if str(bodega_origen_id) == str(bodega_destino_id):
        return Response(
            {'error': 'La bodega origen y destino no pueden ser la misma.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    kilos = Decimal(str(kilos))

    if kilos <= 0:
        return Response(
            {'error': 'Los kilos deben ser mayor a 0.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    stock_disponible = get_stock(tipo_cafe_id, bodega_origen_id)

    if kilos > stock_disponible:
        tipo = TipoCafe.objects.get(id=tipo_cafe_id)
        bodega = Bodega.objects.get(id=bodega_origen_id)
        return Response(
            {
                'error': f'Stock insuficiente. {tipo.nombre} en {bodega.nombre}: '
                         f'disponible {stock_disponible} kg, intentas trasladar {kilos} kg.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            tipo_cafe = TipoCafe.objects.get(id=tipo_cafe_id)
            bodega_origen = Bodega.objects.get(id=bodega_origen_id)
            bodega_destino = Bodega.objects.get(id=bodega_destino_id)

            # Costo promedio actual del origen — se transfiere al destino
            from .models import CostoInventario
            try:
                costo_origen = CostoInventario.objects.get(
                    bodega=bodega_origen, tipo_cafe=tipo_cafe
                )
                precio_traslado = costo_origen.costo_promedio
            except CostoInventario.DoesNotExist:
                precio_traslado = None

            MovimientoInventario.objects.create(
                tipo='traslado_salida',
                tipo_cafe=tipo_cafe,
                bodega=bodega_origen,
                bodega_destino=bodega_destino,
                kilos=kilos,
                precio_kilo=precio_traslado,
                nota=nota or f'Traslado a {bodega_destino.nombre}'
            )

            MovimientoInventario.objects.create(
                tipo='traslado_entrada',
                tipo_cafe=tipo_cafe,
                bodega=bodega_destino,
                bodega_destino=None,
                kilos=kilos,
                precio_kilo=precio_traslado,
                nota=nota or f'Traslado desde {bodega_origen.nombre}'
            )

        return Response({
            'mensaje': f'Traslado exitoso: {kilos} kg de {tipo_cafe.nombre} '
                       f'de {bodega_origen.nombre} a {bodega_destino.nombre}.'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )