from django.db import models
from inventario.models import Bodega
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


class Caja(models.Model):
    bodega = models.OneToOneField(
        Bodega,
        on_delete=models.PROTECT,
        related_name='caja'
    )
    saldo_actual = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0
    )

    def __str__(self):
        return f"Caja — {self.bodega.nombre}"

    class Meta:
        verbose_name = 'Caja'
        verbose_name_plural = 'Cajas'


class MovimientoCaja(models.Model):
    TIPO_CHOICES = [
        ('ingreso', 'Ingreso'),
        ('egreso', 'Egreso'),
    ]

    caja = models.ForeignKey(
        Caja,
        on_delete=models.PROTECT,
        related_name='movimientos'
    )
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    valor = models.DecimalField(max_digits=14, decimal_places=2)
    descripcion = models.CharField(max_length=255)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='movimientos_caja'
    )
    fecha = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Si es un movimiento nuevo (no edición), actualiza el saldo
        es_nuevo = self.pk is None
        super().save(*args, **kwargs)
        if es_nuevo:
            if self.tipo == 'ingreso':
                self.caja.saldo_actual += self.valor
            else:
                self.caja.saldo_actual -= self.valor
            self.caja.save()

    def __str__(self):
        return f"{self.tipo} ${self.valor} — {self.caja.bodega.nombre}"

    class Meta:
        verbose_name = 'Movimiento de Caja'
        verbose_name_plural = 'Movimientos de Caja'
        ordering = ['-fecha']
        
@receiver(post_save, sender='inventario.Bodega')
def crear_caja_automatica(sender, instance, created, **kwargs):
    if created:
        Caja.objects.get_or_create(bodega=instance)