from rest_framework import viewsets, permissions, filters as drf_filters
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Sum, F, Case, When, DecimalField, Value, OuterRef, Subquery
from .models import Compra, DetalleCompra, LiquidacionDeposito
from .serializers import CompraSerializer, LiquidacionDepositoSerializer
from .filters import CompraFilter  # ← NUEVO (ítem 17)
from inventario.models import MovimientoInventario
from django.db.models.signals import post_save
from django.dispatch import receiver


class CompraViewSet(viewsets.ModelViewSet):
    serializer_class = CompraSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ── NUEVO (ítem 17): filtros combinables (caficultor, búsqueda por
    # nombre, rango de fechas, bodega, tipo de café) + ordenamiento.
    # La paginación se aplica sola porque DEFAULT_PAGINATION_CLASS ya
    # quedó configurada globalmente en settings.py. ──
    filterset_class = CompraFilter
    filter_backends = [
        'django_filters.rest_framework.DjangoFilterBackend',
        drf_filters.OrderingFilter,
    ]
    # Campos permitidos para ?ordering=campo o ?ordering=-campo.
    # 'total_anotado' en vez de 'total' porque Compra.total es una
    # @property de Python -- SQL no puede ordenar por eso directamente.
    # Ver anotación en get_queryset() más abajo.
    ordering_fields = ['id', 'fecha', 'caficultor__nombre', 'total_anotado']
    ordering = ['-fecha']  # orden por defecto, igual al que ya tenía la tabla

    def get_queryset(self):
        usuario = self.request.user
        qs = Compra.objects.prefetch_related('cuentas_por_pagar', 'detalles').all()

        # Administrador solo ve compras que involucran su bodega
        # (filtro de SEGURIDAD, se mantiene tal cual estaba — no se toca
        # ni se reemplaza por el filtro de "bodega" combinable de arriba,
        # que es el que el USUARIO elige libremente en la tabla. Ambos
        # se aplican: este restringe lo que puede VER el administrador,
        # el de CompraFilter es el que el usuario elige para acotar
        # SU PROPIA vista dentro de lo que ya tiene permitido).
        if usuario.rol == 'administrador':
            qs = qs.filter(detalles__bodega=usuario.bodega).distinct()

        # ── NUEVO (ítem 17): anotación para poder ordenar por "total"
        # desde el backend.
        #
        # ADVERTENCIA TÉCNICA QUE QUEDA REGISTRADA A PROPÓSITO:
        # Anotar con .annotate(Sum(...)) directamente sobre 'detalles'
        # mientras el queryset YA tiene un .filter(detalles__bodega=...)
        # + .distinct() (caso administrador) es un patrón de Django/SQL
        # con riesgo conocido de inflar o alterar la suma, porque el
        # JOIN de 'detalles__bodega' y el JOIN de la agregación pueden
        # no generar el GROUP BY que uno espera.
        #
        # Por eso aquí se usa una SUBQUERY independiente (Subquery +
        # OuterRef) en vez de un annotate+join directo: la subconsulta
        # calcula el total de cada compra de forma aislada, sin verse
        # afectada por los joins/filtros que ya tiene el queryset
        # principal. Esto es el patrón que recomienda la documentación
        # de Django para "agregación + filtro sobre relación inversa"
        # cuando coexisten en el mismo queryset.
        #
        # No se pudo ejecutar esta consulta contra una base de datos real
        # para verificarla empíricamente en este entorno (sin acceso a
        # red para levantar Django/Postgres de prueba) -- se aplicó el
        # patrón documentado por precaución, pero se recomienda
        # verificar manualmente con un par de compras de varias líneas
        # antes de confiar en el ordenamiento por total en producción. ──
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

    def get_serializer_context(self):
        # Necesario para que CompraSerializer.validate() sepa el rol del usuario
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creado_por=user)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        # get_object() ya usa get_queryset() filtrado por bodega
        compra = self.get_object()
        MovimientoInventario.objects.filter(
            referencia=f'compra-{compra.id}'
        ).delete()
        compra.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_serializer_context(self):
        # Necesario para que CompraSerializer.validate() sepa el rol del usuario
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creado_por=user)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        # get_object() ya usa get_queryset() filtrado por bodega
        compra = self.get_object()
        MovimientoInventario.objects.filter(
            referencia=f'compra-{compra.id}'
        ).delete()
        compra.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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