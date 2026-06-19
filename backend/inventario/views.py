from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import PermissionDenied
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


class SoloJefeEscritura(permissions.BasePermission):
    """Cualquier usuario autenticado puede leer (GET).
    Solo el jefe puede crear, editar o eliminar (datos maestros)."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.rol == 'jefe'


class TipoCafeViewSet(viewsets.ModelViewSet):
    queryset = TipoCafe.objects.all()
    serializer_class = TipoCafeSerializer
    permission_classes = [SoloJefeEscritura]


class BodegaViewSet(viewsets.ModelViewSet):
    queryset = Bodega.objects.all()
    serializer_class = BodegaSerializer
    permission_classes = [SoloJefeEscritura]


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        qs = MovimientoInventario.objects.all()

        # Administrador solo ve movimientos de su propia bodega
        if usuario.rol == 'administrador':
            qs = qs.filter(bodega=usuario.bodega)

        return qs

    @action(detail=False, methods=['get'])
    def stock(self, request):
        usuario = request.user
        bodega_id = request.query_params.get('bodega')
        tipo_cafe_id = request.query_params.get('tipo_cafe')

        # Administrador no puede consultar el stock de otra bodega
        if usuario.rol == 'administrador':
            if bodega_id and str(bodega_id) != str(usuario.bodega_id):
                raise PermissionDenied('No tienes acceso a esta bodega.')
            bodega_id = usuario.bodega_id

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
    usuario = request.user
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

    # Seguridad: administrador solo puede trasladar DESDE su propia bodega
    if usuario.rol == 'administrador' and str(bodega_origen_id) != str(usuario.bodega_id):
        return Response(
            {'error': 'Solo puedes trasladar café desde tu propia bodega.'},
            status=status.HTTP_403_FORBIDDEN
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