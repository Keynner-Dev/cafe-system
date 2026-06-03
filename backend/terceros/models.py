from django.db import models


class Tercero(models.Model):
    TIPO_CHOICES = [
        ('empresa', 'Empresa'),
        ('caficultor', 'Caficultor'),
        ('ambos', 'Ambos'),
    ]

    nombre = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)

    # Cédula — importante para búsqueda y portal del caficultor
    cedula = models.CharField(max_length=20, blank=True, null=True)

    telefono = models.CharField(max_length=20, blank=True, null=True)

    # Número de WhatsApp para envío de comprobantes (puede ser diferente al teléfono)
    # Formato: solo números con código de país, ej: 573001234567
    telefono_whatsapp = models.CharField(max_length=20, blank=True, null=True)

    direccion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Tercero'
        verbose_name_plural = 'Terceros'
        ordering = ['nombre']