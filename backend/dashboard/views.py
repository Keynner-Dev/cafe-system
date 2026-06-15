from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, F, Q
from decimal import Decimal
from datetime import timedelta

from compras.models import Compra, DetalleCompra
from ventas.models import Venta
from inventario.models import MovimientoInventario, TipoCafe, Bodega, CostoInventario
from caja.models import Caja
from cuentas_pagar.models import CuentaPorPagar


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


def promedio_compra_periodo(fecha_inicio, fecha_fin, bodega_id=None):
    """Precio promedio ponderado por kilo de compras normales (no depósito) en un rango."""
    detalles = DetalleCompra.objects.filter(
        es_deposito=False,
        precio_kilo__isnull=False,
        compra__fecha__gte=fecha_inicio,
        compra__fecha__lte=fecha_fin,
    )
    if bodega_id:
        detalles = detalles.filter(bodega_id=bodega_id)

    total_kilos = detalles.aggregate(total=Sum('kilos'))['total'] or Decimal('0')
    if total_kilos == 0:
        return {'precio_promedio': 0, 'kilos': 0, 'cantidad_compras': 0}

    valor_total = sum(d.kilos * d.precio_kilo for d in detalles)
    cantidad_compras = detalles.values('compra_id').distinct().count()

    return {
        'precio_promedio': float(valor_total / total_kilos),
        'kilos': float(total_kilos),
        'cantidad_compras': cantidad_compras,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    usuario = request.user
    es_jefe = usuario.rol == 'jefe'
    bodega_id = None if es_jefe else usuario.bodega_id

    hoy = timezone.now().date()
    inicio_semana = hoy - timedelta(days=6)
    inicio_mes = hoy.replace(day=1)

    # ── Compras de hoy ──
    compras_hoy_qs = Compra.objects.filter(fecha=hoy)
    if bodega_id:
        compras_hoy_qs = compras_hoy_qs.filter(detalles__bodega_id=bodega_id).distinct()
    total_compras_hoy = sum(c.total for c in compras_hoy_qs)
    cantidad_compras_hoy = compras_hoy_qs.count()

    # ── Remisiones de hoy (kilos, sin valor $) ──
    ventas_hoy_qs = Venta.objects.filter(fecha=hoy)
    if bodega_id:
        ventas_hoy_qs = ventas_hoy_qs.filter(detalles__bodega_id=bodega_id).distinct()
    kilos_remisiones_hoy = sum(v.total_kilos for v in ventas_hoy_qs)
    cantidad_remisiones_hoy = ventas_hoy_qs.count()

    # ── Stock por bodega ──
    if es_jefe:
        bodegas = Bodega.objects.filter(activo=True)
    else:
        bodegas = Bodega.objects.filter(activo=True, id=bodega_id)

    stock_por_bodega = []
    for bodega in bodegas:
        stock = calcular_stock(bodega_id=bodega.id)
        stock_por_bodega.append({'bodega': bodega.nombre, 'stock': float(stock)})

    # ── Stock por tipo de café ──
    tipos = TipoCafe.objects.filter(activo=True)
    stock_por_tipo = []
    for tipo in tipos:
        stock = calcular_stock(tipo_cafe_id=tipo.id, bodega_id=bodega_id)
        if stock > 0:
            stock_por_tipo.append({'tipo': tipo.nombre, 'stock': float(stock)})

    total_kilos_stock = sum(s['stock'] for s in stock_por_bodega)

    # ── Depósitos pendientes ──
    depositos_pendientes = DetalleCompra.objects.filter(es_deposito=True, liquidado=False)
    if bodega_id:
        depositos_pendientes = depositos_pendientes.filter(bodega_id=bodega_id)
    total_kilos_deposito = sum(
        d.kilos_pendientes_liquidar for d in depositos_pendientes
    ) or Decimal('0')
    cantidad_depositos = depositos_pendientes.count()

    # ── Costo promedio del inventario (WAC) ──
    costos = CostoInventario.objects.select_related('bodega', 'tipo_cafe')
    if bodega_id:
        costos = costos.filter(bodega_id=bodega_id)
    costo_inventario = [{
        'bodega': c.bodega.nombre,
        'tipo_cafe': c.tipo_cafe.nombre,
        'kilos': float(c.kilos_actuales),
        'costo_promedio': float(c.costo_promedio),
    } for c in costos if c.kilos_actuales > 0]

    # ── Promedio de compra por periodo ──
    promedio_compra = {
        'dia': promedio_compra_periodo(hoy, hoy, bodega_id),
        'semana': promedio_compra_periodo(inicio_semana, hoy, bodega_id),
        'mes': promedio_compra_periodo(inicio_mes, hoy, bodega_id),
    }

    # ── Caja ──
    if es_jefe:
        cajas = Caja.objects.select_related('bodega').all()
        caja_info = {
            'consolidado': float(sum(c.saldo_actual for c in cajas)),
            'por_bodega': [
                {'bodega': c.bodega.nombre, 'saldo': float(c.saldo_actual)}
                for c in cajas
            ],
        }
    else:
        try:
            caja = Caja.objects.get(bodega_id=bodega_id)
            caja_info = {'saldo': float(caja.saldo_actual), 'bodega': caja.bodega.nombre}
        except Caja.DoesNotExist:
            caja_info = {'saldo': 0, 'bodega': usuario.bodega.nombre if usuario.bodega else None}

    # ── Cuentas por pagar pendientes (solo jefe) ──
    cuentas_por_pagar_info = None
    if es_jefe:
        pendientes_cxp = CuentaPorPagar.objects.exclude(estado='pagado')
        saldo_pendiente = pendientes_cxp.aggregate(
            total=Sum(F('valor_total') - F('valor_pagado'))
        )['total'] or Decimal('0')
        cuentas_por_pagar_info = {
            'saldo_pendiente': float(saldo_pendiente),
            'cantidad': pendientes_cxp.count(),
        }

    # ── Pendientes por gestionar (solo jefe) ──
    pendientes_gestion = []
    if es_jefe:
        ventas_pendientes = Venta.objects.filter(
            Q(precio_kilo_jefe__isnull=True) |
            (Q(flete_valor__gt=0) & Q(flete_descontado=False))
        ).distinct().order_by('-creado_en')[:10]

        for v in ventas_pendientes:
            falta = []
            if v.precio_kilo_jefe is None:
                falta.append('precio')
            if v.flete_valor > 0 and not v.flete_descontado:
                falta.append('flete')
            pendientes_gestion.append({
                'id': v.id,
                'numero_remision': v.numero_remision,
                'empresa': v.empresa.nombre,
                'fecha': v.fecha,
                'falta': falta,
            })

    # ── Últimas compras ──
    ultimas_compras_qs = Compra.objects.order_by('-creado_en')
    if bodega_id:
        ultimas_compras_qs = ultimas_compras_qs.filter(detalles__bodega_id=bodega_id).distinct()
    ultimas_compras = [{
        'id': c.id,
        'fecha': c.fecha,
        'caficultor': c.caficultor.nombre,
        'total': float(c.total),
    } for c in ultimas_compras_qs[:5]]

    # ── Últimas ventas (kilos, no $) ──
    ultimas_ventas_qs = Venta.objects.order_by('-creado_en')
    if bodega_id:
        ultimas_ventas_qs = ultimas_ventas_qs.filter(detalles__bodega_id=bodega_id).distinct()
    ultimas_ventas = [{
        'id': v.id,
        'numero_remision': v.numero_remision,
        'fecha': v.fecha,
        'empresa': v.empresa.nombre,
        'kilos': float(v.total_kilos),
    } for v in ultimas_ventas_qs[:5]]

    return Response({
        'hoy': str(hoy),
        'rol': usuario.rol,
        'bodega_nombre': usuario.bodega.nombre if not es_jefe and usuario.bodega else None,
        'compras': {
            'total_hoy': float(total_compras_hoy),
            'cantidad_hoy': cantidad_compras_hoy,
        },
        'remisiones': {
            'cantidad_hoy': cantidad_remisiones_hoy,
            'kilos_hoy': float(kilos_remisiones_hoy),
        },
        'stock': {
            'por_bodega': stock_por_bodega,
            'por_tipo': stock_por_tipo,
            'total_kilos': total_kilos_stock,
        },
        'depositos': {
            'kilos_pendientes': float(total_kilos_deposito),
            'cantidad': cantidad_depositos,
        },
        'costo_inventario': costo_inventario,
        'promedio_compra': promedio_compra,
        'caja': caja_info,
        'cuentas_por_pagar': cuentas_por_pagar_info,
        'pendientes_gestion': pendientes_gestion,
        'ultimas_compras': ultimas_compras,
        'ultimas_ventas': ultimas_ventas,
    })