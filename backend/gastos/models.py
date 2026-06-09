from django.db import models
from inventario.models import Bodega
from django.conf import settings


class Gasto(models.Model):
    MEDIO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
    ]

    bodega = models.ForeignKey(
        Bodega,
        on_delete=models.PROTECT,
        related_name='gastos'
    )
    categoria = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=255)
    valor = models.DecimalField(max_digits=14, decimal_places=2)
    medio_pago = models.CharField(max_length=15, choices=MEDIO_PAGO_CHOICES)
    fecha = models.DateField()
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='gastos'
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.categoria} — ${self.valor} — {self.bodega.nombre}"

    class Meta:
        verbose_name = 'Gasto'
        verbose_name_plural = 'Gastos'
        ordering = ['-fecha', '-creado_en']