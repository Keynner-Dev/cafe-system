from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Venta
from .serializers import VentaSerializer
from inventario.models import MovimientoInventario


class VentaViewSet(viewsets.ModelViewSet):
    serializer_class = VentaSerializer

    def get_queryset(self):
        usuario = self.request.user
        qs = Venta.objects.all().prefetch_related('detalles')

        # Administrador solo ve remisiones que involucran su bodega
        if usuario.rol == 'administrador':
            qs = qs.filter(detalles__bodega=usuario.bodega).distinct()

        return qs

    def get_serializer_context(self):
        # Necesario para que VentaSerializer sepa quién está consultando
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creado_por=user)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        # get_object() ya usa get_queryset() filtrado — un admin no puede
        # eliminar remisiones de otra bodega (le devuelve 404, no 403)
        venta = self.get_object()

        MovimientoInventario.objects.filter(
            referencia=f'venta-{venta.id}'
        ).delete()

        venta.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)