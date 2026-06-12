from rest_framework import generics, status
from rest_framework.response import Response
from .models import CuentaPorCobrar, AbonoCobranza
from .serializers import CuentaPorCobrarSerializer, AbonoCobranzaSerializer
from usuarios.permissions import SoloJefe


class CuentaPorCobrarListCreateView(generics.ListCreateAPIView):
    serializer_class = CuentaPorCobrarSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = CuentaPorCobrar.objects.select_related(
            'empresa', 'bodega', 'creado_por'
        )
        # Administrador solo ve su bodega
        if user.rol == 'administrador':
            qs = qs.filter(bodega=user.bodega)

        # Filtros opcionales
        estado   = self.request.query_params.get('estado')
        bodega   = self.request.query_params.get('bodega')
        empresa  = self.request.query_params.get('empresa')
        if estado:
            qs = qs.filter(estado=estado)
        if bodega:
            qs = qs.filter(bodega_id=bodega)
        if empresa:
            qs = qs.filter(empresa_id=empresa)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        bodega = user.bodega if user.rol == 'administrador' else None
        serializer.save(creado_por=user, bodega=bodega or serializer.validated_data.get('bodega'))


class CuentaPorCobrarDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CuentaPorCobrarSerializer
    queryset = CuentaPorCobrar.objects.all()

    def get_queryset(self):
        user = self.request.user
        qs   = CuentaPorCobrar.objects.select_related('empresa', 'bodega')
        if user.rol == 'administrador':
            qs = qs.filter(bodega=user.bodega)
        return qs


class AbonoCobranzaListCreateView(generics.ListCreateAPIView):
    serializer_class = AbonoCobranzaSerializer

    def get_queryset(self):
        cuenta_id = self.kwargs.get('cuenta_id')
        return AbonoCobranza.objects.filter(cuenta_id=cuenta_id).select_related('creado_por')

    def perform_create(self, serializer):
        cuenta_id = self.kwargs.get('cuenta_id')
        cuenta    = CuentaPorCobrar.objects.get(pk=cuenta_id)

        # Validar que el abono no supere el saldo
        valor = serializer.validated_data['valor']
        if valor > cuenta.saldo:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                f"El abono (${valor}) supera el saldo pendiente (${cuenta.saldo})."
            )
        serializer.save(cuenta=cuenta, creado_por=self.request.user)