from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Compra, LiquidacionDeposito
from .serializers import CompraSerializer, LiquidacionDepositoSerializer
from inventario.models import MovimientoInventario


class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        compra = self.get_object()

        # Eliminar movimientos de inventario asociados
        MovimientoInventario.objects.filter(
            referencia=f'compra-{compra.id}'
        ).delete()

        compra.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LiquidacionDepositoViewSet(viewsets.ModelViewSet):
    queryset = LiquidacionDeposito.objects.all()
    serializer_class = LiquidacionDepositoSerializer