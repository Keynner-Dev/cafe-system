from django.db import models

class Tercero(models.Model):
    TIPO_CHOICES = [
        ('cliente', 'Cliente'),
        ('proveedor', 'Proveedor'),
        ('ambos', 'Ambos'),
    ]

    nombre = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Tercero'
        verbose_name_plural = 'Terceros'
        ordering = ['nombre']