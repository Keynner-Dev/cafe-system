from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Compra, LiquidacionDeposito
from .serializers import CompraSerializer, LiquidacionDepositoSerializer
from inventario.models import MovimientoInventario


class CompraViewSet(viewsets.ModelViewSet):
    serializer_class = CompraSerializer

    def get_queryset(self):
        qs = Compra.objects.prefetch_related('cuentas_por_pagar').all()
        caficultor_id = self.request.query_params.get('caficultor')
        if caficultor_id:
            qs = qs.filter(caficultor_id=caficultor_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creado_por=user)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        compra = self.get_object()
        MovimientoInventario.objects.filter(
            referencia=f'compra-{compra.id}'
        ).delete()
        compra.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LiquidacionDepositoViewSet(viewsets.ModelViewSet):
    queryset = LiquidacionDeposito.objects.all()
    serializer_class = LiquidacionDepositoSerializer

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creado_por=user)