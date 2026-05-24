from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Venta
from .serializers import VentaSerializer
from inventario.models import MovimientoInventario


class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all()
    serializer_class = VentaSerializer

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        venta = self.get_object()

        # Eliminar movimientos de inventario asociados
        MovimientoInventario.objects.filter(
            referencia=f'venta-{venta.id}'
        ).delete()

        venta.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)