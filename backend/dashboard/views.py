from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count
from decimal import Decimal

from compras.models import Compra
from ventas.models import Venta
from inventario.models import MovimientoInventario, TipoCafe, Bodega


def calcular_stock(tipo_cafe_id=None, bodega_id=None):
    movimientos = MovimientoInventario.objects.all()
    if tipo_cafe_id:
        movimientos = movimientos.filter(tipo_cafe_id=tipo_cafe_id)
    if bodega_id:
        movimientos = movimientos.filter(bodega_id=bodega_id)

    entradas = movimientos.filter(
        tipo__in=['entrada', 'traslado_entrada']
    ).aggregate(total=Sum('kilos'))['total'] or Decimal('0')

    salidas = movimientos.filter(
        tipo__in=['salida', 'traslado_salida']
    ).aggregate(total=Sum('kilos'))['total'] or Decimal('0')

    return entradas - salidas


@api_view(['GET'])
def dashboard_data(request):
    hoy = timezone.now().date()

    # ── Compras de hoy ──
    compras_hoy = Compra.objects.filter(fecha=hoy)
    total_compras_hoy = sum(c.total for c in compras_hoy)
    cantidad_compras_hoy = compras_hoy.count()

    # ── Ventas de hoy ──
    ventas_hoy = Venta.objects.filter(fecha=hoy)
    total_ventas_hoy = sum(v.total for v in ventas_hoy)
    cantidad_ventas_hoy = ventas_hoy.count()

    # ── Stock total por bodega ──
    bodegas = Bodega.objects.filter(activo=True)
    stock_por_bodega = []
    for bodega in bodegas:
        stock = calcular_stock(bodega_id=bodega.id)
        stock_por_bodega.append({
            'bodega': bodega.nombre,
            'stock': stock
        })

    # ── Stock por tipo de café ──
    tipos = TipoCafe.objects.filter(activo=True)
    stock_por_tipo = []
    for tipo in tipos:
        stock = calcular_stock(tipo_cafe_id=tipo.id)
        if stock > 0:
            stock_por_tipo.append({
                'tipo': tipo.nombre,
                'stock': stock
            })

   # ── Depósitos pendientes ──
    from compras.models import DetalleCompra
    depositos_pendientes = DetalleCompra.objects.filter(
        es_deposito=True,
        liquidado=False
    )

    total_kilos_deposito = sum(
        d.kilos_pendientes_liquidar
        for d in depositos_pendientes
    ) or Decimal('0')

    cantidad_depositos = depositos_pendientes.count()

    # ── Últimas 5 compras ──
    ultimas_compras = []
    for c in Compra.objects.order_by('-creado_en')[:5]:
        ultimas_compras.append({
            'id': c.id,
            'fecha': c.fecha,
            'proveedor': c.proveedor.nombre,
            'total': c.total
        })

    # ── Últimas 5 ventas ──
    ultimas_ventas = []
    for v in Venta.objects.order_by('-creado_en')[:5]:
        ultimas_ventas.append({
            'id': v.id,
            'fecha': v.fecha,
            'cliente': v.cliente.nombre,
            'total': v.total
        })

    return Response({
        'hoy': str(hoy),
        'compras': {
            'total_hoy': total_compras_hoy,
            'cantidad_hoy': cantidad_compras_hoy,
        },
        'ventas': {
            'total_hoy': total_ventas_hoy,
            'cantidad_hoy': cantidad_ventas_hoy,
        },
        'stock': {
            'por_bodega': stock_por_bodega,
            'por_tipo': stock_por_tipo,
            'total_kilos': sum(s['stock'] for s in stock_por_bodega),
        },
        'depositos': {
            'kilos_pendientes': total_kilos_deposito,
            'cantidad': cantidad_depositos,
        },
        'ultimas_compras': ultimas_compras,
        'ultimas_ventas': ultimas_ventas,
    })