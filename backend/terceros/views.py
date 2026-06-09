from rest_framework import viewsets
from rest_framework.response import Response
from .models import Tercero
from .serializers import TerceroSerializer


class TerceroViewSet(viewsets.ModelViewSet):
    queryset = Tercero.objects.all()
    serializer_class = TerceroSerializer

    def get_queryset(self):
        queryset = Tercero.objects.all()

        tipo = self.request.query_params.get('tipo')
        buscar = (
            self.request.query_params.get('search')
            or self.request.query_params.get('buscar')
        )
        todos = self.request.query_params.get('todos')

        if tipo:
            queryset = queryset.filter(tipo__in=[tipo, 'ambos'])

        if buscar:
            queryset = (
                queryset.filter(nombre__icontains=buscar)
                | queryset.filter(cedula__icontains=buscar)
            )
            return queryset.distinct()

        if not todos:
            return Tercero.objects.none()

        return queryset