from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import CuentaPorPagar, AbonoCuentaPorPagar
from .serializers import CuentaPorPagarSerializer, AbonoCuentaPorPagarSerializer


class CuentaPorPagarListCreateView(generics.ListCreateAPIView):
    serializer_class = CuentaPorPagarSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        qs = CuentaPorPagar.objects.select_related(
            'caficultor', 'bodega', 'creado_por'
        )

        if usuario.rol == 'administrador':
            qs = qs.filter(bodega=usuario.bodega)

        estado = self.request.query_params.get('estado')
        bodega_id = self.request.query_params.get('bodega')
        caficultor_id = self.request.query_params.get('caficultor')

        if estado:
            qs = qs.filter(estado=estado)
        if bodega_id and usuario.rol == 'jefe':
            qs = qs.filter(bodega_id=bodega_id)
        if caficultor_id:
            qs = qs.filter(caficultor_id=caficultor_id)

        return qs

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