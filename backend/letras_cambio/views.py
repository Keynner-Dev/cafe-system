from rest_framework import generics
from rest_framework.exceptions import ValidationError
from .models import LetraCambio, AbonoLetra
from .serializers import LetraCambioSerializer, AbonoLetraSerializer


class LetraCambioListCreateView(generics.ListCreateAPIView):
    serializer_class = LetraCambioSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LetraCambio.objects.select_related('caficultor', 'bodega', 'creado_por')

        # Administrador solo ve su bodega
        if user.rol == 'administrador':
            qs = qs.filter(bodega=user.bodega)

        estado = self.request.query_params.get('estado')
        bodega = self.request.query_params.get('bodega')
        caficultor = self.request.query_params.get('caficultor')

        if estado:
            # Soporta múltiples estados separados por coma: ?estado=pendiente,parcial
            estados = estado.split(',')
            qs = qs.filter(estado__in=estados)
        if bodega and user.rol == 'jefe':
            qs = qs.filter(bodega_id=bodega)
        if caficultor:
            qs = qs.filter(caficultor_id=caficultor)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.rol == 'administrador':
            serializer.save(creado_por=user, bodega=user.bodega)
        else:
            if not serializer.validated_data.get('bodega'):
                raise ValidationError({'bodega': 'Este campo es requerido.'})
            serializer.save(creado_por=user)


class LetraCambioDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = LetraCambioSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LetraCambio.objects.select_related('caficultor', 'bodega')
        if user.rol == 'administrador':
            qs = qs.filter(bodega=user.bodega)
        return qs


class AbonoLetraListCreateView(generics.ListCreateAPIView):
    serializer_class = AbonoLetraSerializer

    def get_queryset(self):
        letra_id = self.kwargs.get('letra_id')
        return AbonoLetra.objects.filter(letra_id=letra_id).select_related('creado_por')

    def perform_create(self, serializer):
        letra_id = self.kwargs.get('letra_id')
        try:
            letra = LetraCambio.objects.get(pk=letra_id)
        except LetraCambio.DoesNotExist:
            raise ValidationError('Letra no encontrada.')

        valor = serializer.validated_data['valor']
        if valor > letra.saldo:
            raise ValidationError(
                f'El abono (${valor}) supera el saldo pendiente (${letra.saldo}).'
            )
        serializer.save(letra=letra, creado_por=self.request.user)