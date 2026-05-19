from rest_framework import viewsets
from .models import Tercero
from .serializers import TerceroSerializer

class TerceroViewSet(viewsets.ModelViewSet):
    queryset = Tercero.objects.all()
    serializer_class = TerceroSerializer

    def get_queryset(self):
        queryset = Tercero.objects.all()
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo__in=[tipo, 'ambos'])
        return queryset