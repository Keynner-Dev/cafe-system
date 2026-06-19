from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from .models import Compra, DetalleCompra, LiquidacionDeposito
from .serializers import CompraSerializer, LiquidacionDepositoSerializer
from inventario.models import MovimientoInventario
from django.db.models.signals import post_save
from django.dispatch import receiver


class CompraViewSet(viewsets.ModelViewSet):
    serializer_class = CompraSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        qs = Compra.objects.prefetch_related('cuentas_por_pagar', 'detalles').all()

        # Administrador solo ve compras que involucran su bodega
        if usuario.rol == 'administrador':
            qs = qs.filter(detalles__bodega=usuario.bodega).distinct()

        caficultor_id = self.request.query_params.get('caficultor')
        if caficultor_id:
            qs = qs.filter(caficultor_id=caficultor_id)
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