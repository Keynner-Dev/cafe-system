from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import Gasto
from .serializers import GastoSerializer


def _queryset_base_filtrado(request):
    """
    Construye el queryset de Gasto con los mismos filtros de seguridad
    y de negocio que ya usaba GastoListCreateView.get_queryset() --
    extraído a una función propia para que tanto el listado paginado
    como el nuevo endpoint de resumen (ítem 17) apliquen EXACTAMENTE
    las mismas reglas de bodega/mes, sin duplicar la lógica y sin
    riesgo de que ambos endpoints queden desincronizados si algo
    cambia más adelante.
    """
    usuario = request.user
    qs = Gasto.objects.select_related('bodega', 'creado_por')

    if usuario.rol == 'administrador':
        qs = qs.filter(bodega=usuario.bodega)

    mes = request.query_params.get('mes')
    bodega_id = request.query_params.get('bodega')

    if mes:
        try:
            anio, mes_num = mes.split('-')
            qs = qs.filter(fecha__year=anio, fecha__month=mes_num)
        except ValueError:
            pass

    if bodega_id and usuario.rol == 'jefe':
        qs = qs.filter(bodega_id=bodega_id)

    return qs


class GastoListCreateView(generics.ListCreateAPIView):
    serializer_class = GastoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return _queryset_base_filtrado(self.request)

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


class GastoResumenView(APIView):
    """
    Devuelve el TOTAL agregado de gastos para los mismos filtros
    (mes, bodega) que usa el listado, pero calculado en SQL con
    Sum() directamente en la base de datos -- sin traer los registros
    completos ni verse afectado por la paginación.

    Antes de que se activara la paginación global, GastosPage.jsx
    sumaba en el frontend todos los gastos que llegaban en res.data.
    Eso funcionaba porque el endpoint de listado traía TODO sin
    límite. Ahora que el listado pagina de 10 en 10, esa suma en
    frontend quedaría incompleta si hay más de 10 gastos en el filtro
    -- por eso este endpoint separado, que siempre calcula sobre el
    conjunto COMPLETO que cumple el filtro, sin paginar nada.

    GET /api/gastos/resumen/?mes=2026-06&bodega=3
    → { "total": 1234567.89, "cantidad": 23 }
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = _queryset_base_filtrado(request)
        agregado = qs.aggregate(total=Sum('valor'))
        return Response({
            'total': float(agregado['total'] or 0),
            'cantidad': qs.count(),
        })