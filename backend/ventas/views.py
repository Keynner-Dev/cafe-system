from rest_framework import viewsets, filters as drf_filters
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Venta
from .serializers import VentaSerializer
from .filters import VentaFilter  # ← NUEVO (ítem 17)
from inventario.models import MovimientoInventario


class VentaViewSet(viewsets.ModelViewSet):
    serializer_class = VentaSerializer
    filterset_class = VentaFilter
    filter_backends = [
        'django_filters.rest_framework.DjangoFilterBackend',
        drf_filters.OrderingFilter,
    ]
    # 'id' sirve para ordenar por remisión también, porque
    # numero_remision es una @property derivada directamente del id
    # (f"REM-{str(self.id).zfill(4)}") -- no hace falta ninguna
    # anotación ni Subquery como sí fue necesario en Compras para
    # ordenar por total (Venta.total = flete_valor, que SÍ es una
    # columna real de la base de datos, así que tampoco necesita truco
    # si en el futuro se quiere ordenar por ahí).
    ordering_fields = ['id', 'fecha']
    ordering = ['-fecha']  # mismo orden por defecto que ya tenía la tabla

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