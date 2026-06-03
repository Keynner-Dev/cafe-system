from django.db import models
from django.contrib.auth.models import AbstractUser


class Usuario(AbstractUser):
    ROL_CHOICES = [
        ('jefe', 'Jefe'),
        ('administrador', 'Administrador'),
    ]

    rol = models.CharField(
        max_length=20,
        choices=ROL_CHOICES,
        default='administrador',
    )

    # El jefe no tiene bodega asignada (null=True)
    # El administrador siempre tiene una bodega
    bodega = models.ForeignKey(
        'inventario.Bodega',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='administradores',
    )

    @property
    def es_jefe(self):
        return self.rol == 'jefe'

    @property
    def es_administrador(self):
        return self.rol == 'administrador'

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_rol_display()})"

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'