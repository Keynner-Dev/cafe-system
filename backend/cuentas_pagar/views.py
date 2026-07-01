from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from .models import CuentaPorPagar, AbonoCuentaPorPagar
from .serializers import CuentaPorPagarSerializer, AbonoCuentaPorPagarSerializer
from django.db import transaction


def _queryset_cuentas_filtrado(request):
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

    # ── FIX: este método estaba definido fuera de la clase (a nivel de
    # módulo, sin indentación), por lo que DRF no lo reconocía como el
    # handler POST de AbonoListCreateView. Cualquier petición
    # POST /api/cuentas-pagar/<id>/abonos/ devolvía 405 Method Not
    # Allowed -- no se podían registrar abonos a vales. Se corrigió
    # únicamente la indentación (4 espacios, dentro de la clase); la
    # lógica interna no cambió. ──
    def post(self, request, pk):
        with transaction.atomic():
            try:
                cuenta = CuentaPorPagar.objects.select_for_update().get(pk=pk)
            except CuentaPorPagar.DoesNotExist:
                raise ValidationError('Cuenta no encontrada.')

            usuario = request.user
            if usuario.rol == 'administrador' and cuenta.bodega != usuario.bodega:
                raise PermissionDenied('No tienes acceso a esta cuenta.')

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
            cuenta_serializer = CuentaPorPagarSerializer(cuenta)
            return Response({
                'abono': serializer.data,
                'cuenta': cuenta_serializer.data
            })


class CuentaPorPagarResumenView(APIView):
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