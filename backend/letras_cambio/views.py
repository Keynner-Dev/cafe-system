from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, F
from .models import LetraCambio, AbonoLetra
from .serializers import LetraCambioSerializer, AbonoLetraSerializer


def _queryset_letras_filtrado(request):
    """
    Construye el queryset de LetraCambio con las mismas reglas de
    seguridad y filtros que ya usa LetraCambioListCreateView.get_queryset()
    -- extraído a su propia función para que tanto el listado paginado
    como el nuevo endpoint de resumen (ítem 17) apliquen EXACTAMENTE
    las mismas reglas, sin duplicar lógica.
    """
    user = request.user
    qs = LetraCambio.objects.select_related('caficultor', 'bodega', 'creado_por')

    if user.rol == 'administrador':
        qs = qs.filter(bodega=user.bodega)

    estado = request.query_params.get('estado')
    bodega = request.query_params.get('bodega')
    caficultor = request.query_params.get('caficultor')

    if estado:
        estados = estado.split(',')
        qs = qs.filter(estado__in=estados)
    if bodega and user.rol == 'jefe':
        qs = qs.filter(bodega_id=bodega)
    if caficultor:
        qs = qs.filter(caficultor_id=caficultor)

    return qs


class LetraCambioListCreateView(generics.ListCreateAPIView):
    serializer_class = LetraCambioSerializer

    def get_queryset(self):
        return _queryset_letras_filtrado(self.request)

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


class LetraCambioResumenView(APIView):
  
    def get(self, request):
        qs = _queryset_letras_filtrado(request)
        agregado = qs.aggregate(
            total_adelantado=Sum('valor_total'),
            total_abonado=Sum('valor_abonado'),
        )
        total_adelantado = float(agregado['total_adelantado'] or 0)
        total_abonado = float(agregado['total_abonado'] or 0)

        return Response({
            'total_adelantado': total_adelantado,
            'total_abonado': total_abonado,
            'saldo_total': total_adelantado - total_abonado,
            'cantidad': qs.count(),
        })