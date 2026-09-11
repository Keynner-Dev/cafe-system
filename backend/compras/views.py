from rest_framework import viewsets, permissions, filters as drf_filters
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import Sum, F, Case, When, DecimalField, Value, OuterRef, Subquery
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import Compra, DetalleCompra, LiquidacionDeposito, SolicitudEliminacionCompra
from .serializers import (
    CompraSerializer, LiquidacionDepositoSerializer,
    SolicitudEliminacionCompraSerializer,  # ← NUEVO (ítem 24)
)
from .filters import CompraFilter  # ← NUEVO (ítem 17)
from inventario.models import MovimientoInventario
from django.db.models.signals import post_save
from django.dispatch import receiver


# ── ÍTEM 24 ──
# Anula una compra de forma segura: revierte inventario, caja y WAC.
# Reemplaza al borrado físico que había antes (Compra.delete()) --
# ese borrado tenía un bug preexistente y no relacionado con este
# ítem: MovimientoInventario.objects.filter(...).delete() es un
# .delete() masivo sobre queryset, que Django NO dispara como señal
# post_delete, así que el WAC en CostoInventario nunca se enteraba de
# que esos movimientos habían sido borrados y se quedaba con kilos y
# valor que ya no existían. Esta función corrige eso de una vez,
# usando la señal post_save de un movimiento 'salida' (que sí está
# conectada) para revertir el WAC correctamente.
#
# LIMITACIÓN CONOCIDA Y ACEPTADA: la reversa de WAC resta al costo
# promedio ACTUAL (costo.costo_promedio en el momento de anular), no
# al precio exacto que tenía esa compra en su momento. Si hubo compras
# o ventas de por medio que movieron el promedio, la reversa es una
# aproximación, no un deshacer perfecto -- es una limitación inherente
# a cualquier sistema de costo promedio ponderado (WAC), no algo que
# se pueda evitar sin rehacer el histórico completo de movimientos.
def _anular_compra(compra):
    from inventario.models import CostoInventario
    from caja.models import MovimientoCaja

    if compra.estado == 'anulada':
        raise ValidationError('Esta compra ya está anulada.')

    # ── Bloqueo 1: depósitos ya liquidados ──
    # Si algún detalle de esta compra ya tiene liquidaciones registradas,
    # anular dejaría esas liquidaciones (y el dinero/kilos que ya
    # movieron) sin una compra válida detrás. No se resuelve
    # automáticamente -- Jimmi debe resolverlo manualmente si esto pasa.
    tiene_liquidaciones = LiquidacionDeposito.objects.filter(
        detalle_compra__compra=compra
    ).exists()
    if tiene_liquidaciones:
        raise ValidationError(
            'No se puede anular: esta compra tiene depósitos que ya fueron '
            'liquidados. Anularla dejaría esas liquidaciones sin respaldo.'
        )

    # ── Bloqueo 2: abonos a letra registrados desde esta compra ──
    if compra.abonos_letra.exists():
        raise ValidationError(
            'No se puede anular: desde esta compra se registró un abono a '
            'una letra de cambio. Anularla dejaría ese abono sin respaldo.'
        )

    # ── Bloqueo 3: que no quede stock negativo ──
    # Si ya se vendió o trasladó parte del café que esta compra aportó,
    # anularla dejaría el stock de ese tipo de café/bodega en negativo.
    for detalle in compra.detalles.all():
        costo, _ = CostoInventario.objects.get_or_create(
            bodega=detalle.bodega, tipo_cafe=detalle.tipo_cafe
        )
        if costo.kilos_actuales < detalle.kilos:
            raise ValidationError(
                f'No se puede anular: ya se movió parte del stock de '
                f'{detalle.tipo_cafe} en {detalle.bodega} (quedan '
                f'{costo.kilos_actuales}kg en stock, esta compra aportó '
                f'{detalle.kilos}kg). Anularla dejaría el stock en negativo.'
            )

    # ── Reversa de inventario ──
    # Un movimiento 'salida' por cada detalle, con los mismos kilos que
    # entraron. Dispara la señal post_save de MovimientoInventario, que
    # sí actualiza CostoInventario correctamente (a diferencia del
    # .delete() masivo que tenía el código anterior).
    for detalle in compra.detalles.all():
        MovimientoInventario.objects.create(
            tipo='salida',
            tipo_cafe=detalle.tipo_cafe,
            bodega=detalle.bodega,
            kilos=detalle.kilos,
            referencia=f'anulacion-compra-{compra.id}',
            nota=f'Reverso por anulación de compra #{compra.id}',
        )

    # ── Reversa de caja ──
    # Un ingreso compensatorio por cada egreso que generó esta compra.
    # Se busca por descripción porque MovimientoCaja no tiene FK directa
    # a Compra (limitación existente del modelo, no introducida aquí).
    egresos = MovimientoCaja.objects.filter(
        descripcion__startswith=f'Compra #{compra.id} —'
    )
    for egreso in egresos:
        MovimientoCaja.objects.create(
            caja=egreso.caja,
            tipo='ingreso',
            valor=egreso.valor,
            descripcion=f'Reverso por anulación de compra #{compra.id}',
            creado_por=compra.creado_por,
        )

    compra.estado = 'anulada'
    compra.save()


class CompraViewSet(viewsets.ModelViewSet):
    serializer_class = CompraSerializer
    permission_classes = [permissions.IsAuthenticated]

    filterset_class = CompraFilter
    filter_backends = [
        DjangoFilterBackend,
        drf_filters.OrderingFilter,
    ]
    ordering_fields = ['id', 'fecha', 'caficultor__nombre', 'total_anotado']
    ordering = ['-fecha']

    LIMITE_POR_CAFICULTOR = 10

    def get_queryset(self):
        usuario = self.request.user
        qs = Compra.objects.prefetch_related('cuentas_por_pagar', 'detalles').all()

        if usuario.rol == 'administrador':
            qs = qs.filter(detalles__bodega=usuario.bodega).distinct()

        subtotal_normal = DetalleCompra.objects.filter(
            compra_id=OuterRef('pk'),
            es_deposito=False,
        ).order_by().values('compra_id').annotate(
            suma=Sum(F('kilos') * F('precio_kilo'))
        ).values('suma')

        qs = qs.annotate(
            total_anotado=Subquery(
                subtotal_normal,
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        )

        return qs

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if self.request.query_params.get('caficultor'):
            queryset = queryset[:self.LIMITE_POR_CAFICULTOR]
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creado_por=user)

    # ── ÍTEM 24 ──
    # DELETE /compras/{id}/ ya NO borra físicamente -- anula de forma
    # segura con _anular_compra(). Solo el jefe puede llegar aquí; un
    # administrador recibe 403 y debe usar solicitar_eliminacion()
    # en su lugar. perform_destroy() es el hook que DRF llama desde su
    # destroy() genérico -- no hace falta sobreescribir destroy() entero.
    def perform_destroy(self, instance):
        if self.request.user.rol != 'jefe':
            raise PermissionDenied(
                'Solo el jefe puede eliminar compras directamente. '
                'Usa "Solicitar eliminación" para pedir su aprobación.'
            )
        _anular_compra(instance)

    # ── ÍTEM 24: el administrador solicita, no elimina ──
    @action(detail=True, methods=['post'], url_path='solicitar-eliminacion')
    def solicitar_eliminacion(self, request, pk=None):
        compra = self.get_object()

        if compra.estado == 'anulada':
            return Response({'detail': 'Esta compra ya está anulada.'}, status=400)

        if compra.solicitudes_eliminacion.filter(estado='pendiente').exists():
            return Response(
                {'detail': 'Ya existe una solicitud de eliminación pendiente para esta compra.'},
                status=400,
            )

        motivo = (request.data.get('motivo') or '').strip()
        if not motivo:
            return Response({'motivo': 'El motivo es obligatorio.'}, status=400)

        solicitud = SolicitudEliminacionCompra.objects.create(
            compra=compra,
            solicitado_por=request.user,
            motivo=motivo,
        )
        return Response(
            SolicitudEliminacionCompraSerializer(solicitud).data,
            status=status.HTTP_201_CREATED,
        )


# ── ÍTEM 24: solicitudes de eliminación -- ver, aprobar, rechazar ──
class SolicitudEliminacionCompraViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Solo lectura + dos acciones (aprobar/rechazar). No se expone create
    aquí a propósito -- se crea únicamente vía
    CompraViewSet.solicitar_eliminacion(), que ya valida que no exista
    otra pendiente para la misma compra.
    """
    serializer_class = SolicitudEliminacionCompraSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.rol != 'jefe':
            raise PermissionDenied('Solo el jefe puede ver las solicitudes de eliminación.')

        qs = SolicitudEliminacionCompra.objects.select_related(
            'compra', 'compra__caficultor', 'solicitado_por', 'respondido_por'
        ).order_by('-fecha_solicitud')

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        return qs

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.estado != 'pendiente':
            return Response({'detail': 'Esta solicitud ya fue resuelta.'}, status=400)

        try:
            _anular_compra(solicitud.compra)
        except ValidationError as e:
            # El mensaje de _anular_compra ya explica exactamente por
            # qué no se puede anular (liquidaciones, abonos, o stock) --
            # se devuelve tal cual para que el frontend lo muestre.
            return Response({'detail': str(e.detail[0]) if hasattr(e, 'detail') else str(e)}, status=400)

        solicitud.estado = 'aprobada'
        solicitud.respondido_por = request.user
        solicitud.fecha_respuesta = timezone.now()
        solicitud.save()
        return Response(SolicitudEliminacionCompraSerializer(solicitud).data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.estado != 'pendiente':
            return Response({'detail': 'Esta solicitud ya fue resuelta.'}, status=400)

        solicitud.estado = 'rechazada'
        solicitud.motivo_rechazo = (request.data.get('motivo_rechazo') or '').strip()
        solicitud.respondido_por = request.user
        solicitud.fecha_respuesta = timezone.now()
        solicitud.save()
        return Response(SolicitudEliminacionCompraSerializer(solicitud).data)


class LiquidacionDepositoViewSet(viewsets.ModelViewSet):
    serializer_class = LiquidacionDepositoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        qs = LiquidacionDeposito.objects.select_related('detalle_compra__bodega')

        if usuario.rol == 'administrador':
            qs = qs.filter(detalle_compra__bodega=usuario.bodega)

        return qs

    def perform_create(self, serializer):
        usuario = self.request.user
        detalle = serializer.validated_data.get('detalle_compra')

        if usuario.rol == 'administrador' and detalle and detalle.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a esta bodega.')

        serializer.save(creado_por=usuario)


@receiver(post_save, sender=DetalleCompra)
def egreso_caja_compra_normal(sender, instance, created, **kwargs):
    """Al crear un detalle de compra normal, descuenta de la caja de esa bodega."""
    if not created:
        return
    if instance.es_deposito:
        return
    if not instance.precio_kilo:
        return

    from caja.models import Caja, MovimientoCaja

    try:
        caja = Caja.objects.get(bodega=instance.bodega)
    except Caja.DoesNotExist:
        return

    valor = instance.kilos * instance.precio_kilo
    MovimientoCaja.objects.create(
        caja=caja,
        tipo='egreso',
        valor=valor,
        descripcion=f'Compra #{instance.compra.id} — {instance.tipo_cafe} '
                    f'{instance.kilos}kg @ ${instance.precio_kilo}/kg — '
                    f'{instance.compra.caficultor.nombre}',
        creado_por=instance.compra.creado_por,
    )


@receiver(post_save, sender=LiquidacionDeposito)
def egreso_caja_liquidacion_deposito(sender, instance, created, **kwargs):
    """Al liquidar un depósito, descuenta de la caja de esa bodega."""
    if not created:
        return

    from caja.models import Caja, MovimientoCaja

    bodega = instance.detalle_compra.bodega

    try:
        caja = Caja.objects.get(bodega=bodega)
    except Caja.DoesNotExist:
        return

    valor = instance.kilos * instance.precio_kilo
    detalle = instance.detalle_compra
    MovimientoCaja.objects.create(
        caja=caja,
        tipo='egreso',
        valor=valor,
        descripcion=f'Liquidación depósito #{detalle.compra.id} — '
                    f'{detalle.tipo_cafe} {instance.kilos}kg @ '
                    f'${instance.precio_kilo}/kg — '
                    f'{detalle.compra.caficultor.nombre}',
        creado_por=instance.creado_por,
    )