from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import Gasto
from .serializers import GastoSerializer


class GastoListCreateView(generics.ListCreateAPIView):
    serializer_class = GastoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        qs = Gasto.objects.select_related('bodega', 'creado_por')

        if usuario.rol == 'administrador':
            qs = qs.filter(bodega=usuario.bodega)

        mes = self.request.query_params.get('mes')
        bodega_id = self.request.query_params.get('bodega')

        if mes:
            try:
                anio, mes_num = mes.split('-')
                qs = qs.filter(fecha__year=anio, fecha__month=mes_num)
            except ValueError:
                pass

        if bodega_id and usuario.rol == 'jefe':
            qs = qs.filter(bodega_id=bodega_id)

        return qs

    def perform_create(self, serializer):
        usuario = self.request.user

        if usuario.rol == 'administrador':
            # Ignora cualquier bodega enviada, siempre usa la del administrador
            serializer.save(creado_por=usuario, bodega=usuario.bodega)
        else:
            # Jefe debe enviar bodega
            if not serializer.validated_data.get('bodega'):
                raise ValidationError({'bodega': 'Este campo es requerido.'})
            serializer.save(creado_por=usuario)


class GastoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GastoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        if usuario.rol == 'administrador':
            return Gasto.objects.filter(bodega=usuario.bodega)
        return Gasto.objects.all()

    def perform_update(self, serializer):
        usuario = self.request.user
        gasto = self.get_object()
        if usuario.rol == 'administrador' and gasto.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a este gasto.')
        serializer.save()

    def perform_destroy(self, instance):
        usuario = self.request.user
        if usuario.rol == 'administrador' and instance.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a este gasto.')
        instance.delete()