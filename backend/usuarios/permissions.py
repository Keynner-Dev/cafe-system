from rest_framework.permissions import BasePermission


class SoloJefe(BasePermission):
    """
    Permiso que solo permite acceso al rol 'jefe'.
    Se usa en los endpoints de gestión de usuarios.
    """
    message = 'Solo el jefe puede realizar esta acción.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'jefe'
        )