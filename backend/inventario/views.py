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

    @action(detail=False, methods=['get'], url_path='stock-detallado')
    def stock_detallado(self, request):
        """Devuelve el stock desglosado por bodega y tipo de café en
        una sola consulta, en vez de un único total agregado.

        Jefe: puede ver todas las bodegas o filtrar por una con ?bodega=.
        Administrador: siempre forzado a su propia bodega, sin importar
        qué llegue en ?bodega= (misma regla de seguridad que en `stock`).

        ?tipo_cafe= sigue funcionando igual para ambos roles.
        """
        usuario = request.user
        bodega_id = request.query_params.get('bodega')
        tipo_cafe_id = request.query_params.get('tipo_cafe')

        if usuario.rol == 'administrador':
            if bodega_id and str(bodega_id) != str(usuario.bodega_id):
                raise PermissionDenied('No tienes acceso a esta bodega.')
            bodega_id = usuario.bodega_id

        bodegas = Bodega.objects.filter(activo=True)
        if bodega_id:
            bodegas = bodegas.filter(id=bodega_id)

        tipos = TipoCafe.objects.filter(activo=True)
        if tipo_cafe_id:
            tipos = tipos.filter(id=tipo_cafe_id)

        movimientos_base = MovimientoInventario.objects.filter(
            bodega__in=bodegas, tipo_cafe__in=tipos
        )

        # Una sola consulta agregada por (bodega, tipo_cafe, tipo de
        # movimiento), en vez de N consultas (una por combinación) como
        # haría iterar con get_stock(). Se procesa el resultado en
        # memoria para armar el desglose.
        agregados = movimientos_base.values(
            'bodega_id', 'bodega__nombre', 'tipo_cafe_id', 'tipo_cafe__nombre', 'tipo'
        ).annotate(total_kilos=Sum('kilos'))

        # claves: (bodega_id, tipo_cafe_id) -> {entradas, salidas, nombres}
        filas = {}
        for fila in agregados:
            clave = (fila['bodega_id'], fila['tipo_cafe_id'])
            if clave not in filas:
                filas[clave] = {
                    'bodega_id': fila['bodega_id'],
                    'bodega_nombre': fila['bodega__nombre'],
                    'tipo_cafe_id': fila['tipo_cafe_id'],
                    'tipo_cafe_nombre': fila['tipo_cafe__nombre'],
                    'entradas': Decimal('0'),
                    'salidas': Decimal('0'),
                }
            if fila['tipo'] in ('entrada', 'traslado_entrada'):
                filas[clave]['entradas'] += fila['total_kilos'] or Decimal('0')
            else:
                filas[clave]['salidas'] += fila['total_kilos'] or Decimal('0')

        # Asegura que también aparezcan combinaciones bodega × tipo sin
        # ningún movimiento todavía (stock 0), para que el jefe vea de
        # un vistazo qué bodegas no tienen cierto tipo de café.
        for bodega in bodegas:
            for tipo in tipos:
                clave = (bodega.id, tipo.id)
                if clave not in filas:
                    filas[clave] = {
                        'bodega_id': bodega.id,
                        'bodega_nombre': bodega.nombre,
                        'tipo_cafe_id': tipo.id,
                        'tipo_cafe_nombre': tipo.nombre,
                        'entradas': Decimal('0'),
                        'salidas': Decimal('0'),
                    }

        resultado = []
        total_entradas = Decimal('0')
        total_salidas = Decimal('0')
        for fila in filas.values():
            stock_actual = fila['entradas'] - fila['salidas']
            total_entradas += fila['entradas']
            total_salidas += fila['salidas']
            resultado.append({
                'bodega_id': fila['bodega_id'],
                'bodega_nombre': fila['bodega_nombre'],
                'tipo_cafe_id': fila['tipo_cafe_id'],
                'tipo_cafe_nombre': fila['tipo_cafe_nombre'],
                'entradas': float(fila['entradas']),
                'salidas': float(fila['salidas']),
                'stock_actual': float(stock_actual),
            })

        resultado.sort(key=lambda r: (r['bodega_nombre'], r['tipo_cafe_nombre']))

        return Response({
            'filas': resultado,
            'totales': {
                'entradas': float(total_entradas),
                'salidas': float(total_salidas),
                'stock_actual': float(total_entradas - total_salidas),
            }
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