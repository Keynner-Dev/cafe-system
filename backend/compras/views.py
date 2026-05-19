from rest_framework import viewsets
from .models import Compra, LiquidacionDeposito
from .serializers import CompraSerializer, LiquidacionDepositoSerializer

class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer

class LiquidacionDepositoViewSet(viewsets.ModelViewSet):
    queryset = LiquidacionDeposito.objects.all()
    serializer_class = LiquidacionDepositoSerializer