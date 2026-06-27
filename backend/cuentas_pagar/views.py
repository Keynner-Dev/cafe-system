from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import CuentaPorPagar, AbonoCuentaPorPagar
from .serializers import CuentaPorPagarSerializer, AbonoCuentaPorPagarSerializer


def _queryset_cuentas_filtrado(request):
    """
    Construye el queryset de CuentaPorPagar con las mismas reglas de
    seguridad y filtros que ya usa CuentaPorPagarListCreateView.get_queryset()
    -- extraído a su propia función para que tanto el listado paginado
    como el nuevo endpoint de resumen (ítem 17) apliquen EXACTAMENTE
    las mismas reglas, sin duplicar lógica.
    """
    usuario = request.user
    qs = CuentaPorPagar.objects.select_related('caficultor', 'bodega', 'creado_por')

    if usuario.rol == 'administrador':
        qs = qs.filter(bodega=usuario.bodega)

    estado = request.query_params.get('estado')
    bodega_id = request.query_params.get('bodega')
    caficultor_id = request.query_params.get('caficultor')

    if estado:
        qs = qs.filter(estado=estado)
    if bodega_id and usuario.rol == 'jefe':
        qs = qs.filter(bodega_id=bodega_id)
    if caficultor_id:
        qs = qs.filter(caficultor_id=caficultor_id)

    return qs


class CuentaPorPagarListCreateView(generics.ListCreateAPIView):
    serializer_class = CuentaPorPagarSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return _queryset_cuentas_filtrado(self.request)

    def perform_create(self, serializer):
        usuario = self.request.user
        if usuario.rol == 'administrador':
            serializer.save(creado_por=usuario, bodega=usuario.bodega)
        else:
            if not serializer.validated_data.get('bodega'):
                raise ValidationError({'bodega': 'Este campo es requerido.'})
            serializer.save(creado_por=usuario)


class CuentaPorPagarDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CuentaPorPagarSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        if usuario.rol == 'administrador':
            return CuentaPorPagar.objects.filter(bodega=usuario.bodega)
        return CuentaPorPagar.objects.all()


class AbonoListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_cuenta(self, pk, usuario):
        try:
            cuenta = CuentaPorPagar.objects.get(pk=pk)
        except CuentaPorPagar.DoesNotExist:
            raise ValidationError('Cuenta no encontrada.')
        if usuario.rol == 'administrador' and cuenta.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a esta cuenta.')
        return cuenta

    def get(self, request, pk):
        cuenta = self.get_cuenta(pk, request.user)
        abonos = AbonoCuentaPorPagar.objects.filter(cuenta=cuenta)
        serializer = AbonoCuentaPorPagarSerializer(abonos, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        cuenta = self.get_cuenta(pk, request.user)

        if cuenta.estado == 'pagado':
            raise ValidationError('Esta cuenta ya está completamente pagada.')

        serializer = AbonoCuentaPorPagarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        valor_abono = serializer.validated_data['valor']
        if valor_abono > cuenta.saldo:
            raise ValidationError(
                f'El abono (${valor_abono}) supera el saldo pendiente (${cuenta.saldo}).'
            )

        serializer.save(creado_por=request.user, cuenta=cuenta)
        # Devuelve la cuenta actualizada
        cuenta_serializer = CuentaPorPagarSerializer(cuenta)
        return Response({
            'abono': serializer.data,
            'cuenta': cuenta_serializer.data
        })


class CuentaPorPagarResumenView(APIView):
    """
    ── NUEVO (ítem 17) ──
    Devuelve los totales agregados (saldo pendiente total, y conteos
    por estado) sobre TODAS las cuentas que cumplen el filtro --
    calculado en SQL, sin paginar y sin traer los registros completos.

    Antes de que se activara la paginación global, CuentasPagarPage.jsx
    calculaba 'totalPendiente' y los conteos por estado sumando/filtrando
    en el frontend sobre 'cuentas' (que traía TODO sin límite). Ahora que
    el listado pagina de 10 en 10, esos cálculos quedarían incompletos si
    hay más de 10 cuentas en el filtro -- por eso este endpoint separado.

    Nota sobre 'saldo': igual que en letras_cambio, CuentaPorPagar.saldo
    es una @property (valor_total - valor_pagado), no una columna real
    -- no se puede hacer Sum('saldo') en SQL directamente. Se suman
    valor_total y valor_pagado por separado y se resta en Python,
    matemáticamente equivalente a sumar los saldos individuales.

    GET /api/cuentas-pagar/resumen/?estado=pendiente&bodega=3
    → {
        "saldo_pendiente_total": ...,
        "cantidad_pendiente": ...,
        "cantidad_parcial": ...,
        "cantidad_pagado": ...,
        "cantidad_total": ...,
      }
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = _queryset_cuentas_filtrado(request)

        # Saldo total SOLO de las cuentas no pagadas (pendiente + parcial),
        # igual que hacía el frontend con
        # cuentas.filter(c => c.estado !== 'pagado').reduce(...)
        no_pagadas = qs.exclude(estado='pagado')
        agregado_saldo = no_pagadas.aggregate(
            total_valor=Sum('valor_total'),
            total_pagado=Sum('valor_pagado'),
        )
        total_valor = float(agregado_saldo['total_valor'] or 0)
        total_pagado = float(agregado_saldo['total_pagado'] or 0)

        return Response({
            'saldo_pendiente_total': total_valor - total_pagado,
            'cantidad_pendiente': qs.filter(estado='pendiente').count(),
            'cantidad_parcial': qs.filter(estado='parcial').count(),
            'cantidad_pagado': qs.filter(estado='pagado').count(),
            'cantidad_total': qs.count(),
        })