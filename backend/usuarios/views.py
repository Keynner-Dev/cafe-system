from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Usuario
from .serializers import LoginSerializer, UsuarioSerializer, UsuarioCreateSerializer
from .permissions import SoloJefe


class LoginView(APIView):
    """
    POST /api/auth/login/
    Recibe username y password, devuelve token + datos del usuario.
    Este endpoint es público (no requiere token).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        # get_or_create: si ya tiene token lo devuelve, si no lo crea
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'usuario': {
                'id': user.id,
                'username': user.username,
                'nombre': user.get_full_name() or user.username,
                'rol': user.rol,
                'bodega_id': user.bodega_id,
                'bodega_nombre': user.bodega.nombre if user.bodega else None,
            }
        })


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Elimina el token del usuario (cierra sesión).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'mensaje': 'Sesión cerrada correctamente.'})


class MeView(APIView):
    """
    GET /api/auth/me/
    Devuelve los datos del usuario autenticado.
    Útil para que el frontend verifique si el token sigue siendo válido.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'nombre': user.get_full_name() or user.username,
            'rol': user.rol,
            'bodega_id': user.bodega_id,
            'bodega_nombre': user.bodega.nombre if user.bodega else None,
        })


class UsuarioListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/usuarios/       → lista todos los usuarios (solo jefe)
    POST /api/usuarios/       → crea un nuevo usuario (solo jefe)

    ── NOTA (ítem 17): pagination_class = None a propósito. Esta tabla
    la ve únicamente el jefe (permiso SoloJefe) y lista las cuentas de
    acceso al sistema (administradores de bodega + el jefe) -- un
    conjunto que en la práctica nunca crece más allá de un puñado de
    registros, a diferencia de Compras/Ventas/Gastos/Letras que
    acumulan un registro por cada transacción del negocio. Paginar
    aquí agregaría controles de página que nunca tendrían uso real.
    Sin esta línea, este endpoint heredaría la paginación global
    (DEFAULT_PAGINATION_CLASS en settings.py) igual que cualquier otro
    ListCreateAPIView del proyecto. ──
    """
    permission_classes = [IsAuthenticated, SoloJefe]
    queryset = Usuario.objects.all().select_related('bodega').order_by('id')
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UsuarioCreateSerializer
        return UsuarioSerializer


class UsuarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/usuarios/{id}/  → detalle de un usuario (solo jefe)
    PUT    /api/usuarios/{id}/  → editar usuario (solo jefe)
    DELETE /api/usuarios/{id}/  → eliminar usuario (solo jefe)
    """
    permission_classes = [IsAuthenticated, SoloJefe]
    queryset = Usuario.objects.all().select_related('bodega')
    serializer_class = UsuarioSerializer