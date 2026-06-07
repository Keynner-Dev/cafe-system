from rest_framework import viewsets
from rest_framework.response import Response
from .models import Tercero
from .serializers import TerceroSerializer


class TerceroViewSet(viewsets.ModelViewSet):
    serializer_class = TerceroSerializer

    def get_queryset(self):
        queryset = Tercero.objects.all()

        # Filtro por tipo (caficultor, empresa, ambos)
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo__in=[tipo, 'ambos'])

        # Búsqueda por nombre o cédula
        # El frontend envía ?buscar=texto para buscar
        buscar = self.request.query_params.get('buscar')
        if buscar:
            queryset = queryset.filter(nombre__icontains=buscar) | \
                       queryset.filter(cedula__icontains=buscar)
            return queryset.distinct()

        # Si no hay parámetro de búsqueda ni tipo, no devolvemos nada
        # Esto implementa la carga "bajo demanda" que pidió el cliente:
        # la lista solo aparece cuando el usuario busca algo
        if not tipo:
            return Tercero.objects.none()

        return queryset