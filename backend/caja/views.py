from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Caja, MovimientoCaja
from .serializers import CajaSerializer, MovimientoCajaSerializer


class CajaListView(generics.ListAPIView):
    serializer_class = CajaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        # Jefe ve todas las cajas, administrador solo la de su bodega
        if usuario.rol == 'jefe':
            return Caja.objects.all().select_related('bodega')
        return Caja.objects.filter(bodega=usuario.bodega).select_related('bodega')


class MovimientoCajaListCreateView(generics.ListCreateAPIView):
    serializer_class = MovimientoCajaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_caja(self):
        return Caja.objects.get(pk=self.kwargs['caja_id'])

    def get_queryset(self):
        return MovimientoCaja.objects.filter(
            caja_id=self.kwargs['caja_id']
        ).select_related('creado_por')

    def perform_create(self, serializer):
        usuario = self.request.user
        caja = self.get_caja()

        # Administrador solo puede registrar ingresos
        if usuario.rol == 'administrador' and serializer.validated_data['tipo'] == 'egreso':
            raise PermissionDenied('Los administradores solo pueden registrar ingresos.')

        # Administrador solo puede mover su propia caja
        if usuario.rol == 'administrador' and caja.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a esta caja.')

        serializer.save(creado_por=usuario, caja=caja)