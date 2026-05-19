from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PrecioDiario
from .serializers import PrecioDiarioSerializer
from django.utils import timezone

class PrecioDiarioViewSet(viewsets.ModelViewSet):
    queryset = PrecioDiario.objects.all()
    serializer_class = PrecioDiarioSerializer

    # Endpoint: /api/precios/precio-diario/hoy/
    @action(detail=False, methods=['get'])
    def hoy(self, request):
        """Retorna los precios del día actual"""
        hoy = timezone.now().date()
        precios = PrecioDiario.objects.filter(fecha=hoy)
        serializer = self.get_serializer(precios, many=True)
        return Response(serializer.data)