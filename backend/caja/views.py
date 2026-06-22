from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from .models import Caja, MovimientoCaja, CierreCaja, TrasladoDinero
from .serializers import (
    CajaSerializer, MovimientoCajaSerializer,
    CierreCajaSerializer, TrasladoDineroSerializer
)


class CajaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CajaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        if usuario.rol == 'jefe':
            return Caja.objects.select_related('bodega').all()
        return Caja.objects.select_related('bodega').filter(bodega=usuario.bodega)

    @action(detail=True, methods=['post'], url_path='cerrar')
    def cerrar(self, request, pk=None):
        caja = self.get_object()
        usuario = request.user

        if usuario.rol == 'administrador' and caja.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a esta caja.')
        if not caja.abierta:
            raise ValidationError('La caja ya está cerrada.')

        saldo_fisico = request.data.get('saldo_fisico')
        if saldo_fisico is None:
            raise ValidationError('Debes ingresar el saldo físico contado.')
        try:
            saldo_fisico = float(saldo_fisico)
        except (ValueError, TypeError):
            raise ValidationError('El saldo físico debe ser un número válido.')

        nota = request.data.get('nota', '')
        saldo_teorico = float(caja.saldo_actual)
        diferencia = saldo_fisico - saldo_teorico

        cierre = CierreCaja.objects.create(
            caja=caja,
            saldo_teorico=saldo_teorico,
            saldo_fisico=saldo_fisico,
            diferencia=diferencia,
            nota=nota,
            creado_por=usuario,
        )
        caja.abierta = False
        caja.save()

        return Response(CierreCajaSerializer(cierre).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='abrir')
    def abrir(self, request, pk=None):
        caja = self.get_object()
        usuario = request.user

        if usuario.rol == 'administrador' and caja.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a esta caja.')
        if caja.abierta:
            raise ValidationError('La caja ya está abierta.')

        caja.abierta = True
        caja.save()
        return Response(CajaSerializer(caja).data, status=status.HTTP_200_OK)


class MovimientoCajaViewSet(viewsets.ModelViewSet):
    serializer_class = MovimientoCajaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        caja_id = self.request.query_params.get('caja')
        qs = MovimientoCaja.objects.select_related('creado_por')

        if usuario.rol == 'administrador':
            qs = qs.filter(caja__bodega=usuario.bodega)
        if caja_id:
            qs = qs.filter(caja_id=caja_id)
        return qs

    def perform_create(self, serializer):
        usuario = self.request.user
        caja = serializer.validated_data.get('caja')

        if usuario.rol == 'administrador' and caja and caja.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a esta caja.')
        if not caja.abierta:
            raise ValidationError('La caja está cerrada. Debes abrirla antes de registrar movimientos.')

        serializer.save(creado_por=usuario)


class TrasladoDineroViewSet(viewsets.ModelViewSet):
    serializer_class = TrasladoDineroSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        usuario = self.request.user
        qs = TrasladoDinero.objects.select_related(
            'caja_origen__bodega', 'caja_destino__bodega', 'creado_por'
        )
        if usuario.rol == 'administrador':
            qs = qs.filter(
                Q(caja_origen__bodega=usuario.bodega) |
                Q(caja_destino__bodega=usuario.bodega)
            )
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        usuario     = self.request.user
        caja_origen  = serializer.validated_data.get('caja_origen')
        caja_destino = serializer.validated_data.get('caja_destino')
        valor        = serializer.validated_data.get('valor')

        if usuario.rol == 'administrador' and caja_origen.bodega != usuario.bodega:
            raise PermissionDenied('Solo puedes trasladar dinero desde tu propia caja.')
        if caja_origen.id == caja_destino.id:
            raise ValidationError('La caja origen y destino no pueden ser la misma.')
        if not caja_origen.abierta:
            raise ValidationError('La caja origen está cerrada.')
        if valor > caja_origen.saldo_actual:
            raise ValidationError(
                f'Saldo insuficiente. Disponible: ${caja_origen.saldo_actual:,.0f}'
            )

        traslado = serializer.save(creado_por=usuario)

        desc = (f'Traslado #{traslado.id} — '
                f'{caja_origen.bodega.nombre} → {caja_destino.bodega.nombre}')

        MovimientoCaja.objects.create(
            caja=caja_origen, tipo='egreso',
            valor=valor, descripcion=desc, creado_por=usuario,
        )
        MovimientoCaja.objects.create(
            caja=caja_destino, tipo='ingreso',
            valor=valor, descripcion=desc, creado_por=usuario,
        )