from django.db import models
from inventario.models import Bodega
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.exceptions import ValidationError
from django.db import transaction


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
    abierta = models.BooleanField(default=True)

    def __str__(self):
        return f"Caja — {self.bodega.nombre}"

    class Meta:
        verbose_name = 'Caja'
        verbose_name_plural = 'Cajas'


class CierreCaja(models.Model):
    caja = models.ForeignKey(
        Caja,
        on_delete=models.PROTECT,
        related_name='cierres'
    )
    fecha = models.DateField(auto_now_add=True)
    saldo_teorico = models.DecimalField(max_digits=14, decimal_places=2)
    saldo_fisico = models.DecimalField(max_digits=14, decimal_places=2)
    diferencia = models.DecimalField(max_digits=14, decimal_places=2)
    nota = models.CharField(max_length=255, blank=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cierres_caja'
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cierre {self.fecha} — {self.caja.bodega.nombre}"

    class Meta:
        verbose_name = 'Cierre de Caja'
        verbose_name_plural = 'Cierres de Caja'
        ordering = ['-fecha']


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
        es_nuevo = self.pk is None
        if es_nuevo and not self.caja.abierta:
            raise ValidationError(
                'La caja está cerrada. Debes abrirla antes de registrar movimientos.'
            )
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


class TrasladoDinero(models.Model):
    caja_origen  = models.ForeignKey(
        Caja, on_delete=models.PROTECT,
        related_name='traslados_salida'
    )
    caja_destino = models.ForeignKey(
        Caja, on_delete=models.PROTECT,
        related_name='traslados_entrada'
    )
    valor = models.DecimalField(max_digits=14, decimal_places=2)
    nota  = models.CharField(max_length=255, blank=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='traslados_dinero'
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (f"Traslado ${self.valor} "
                f"{self.caja_origen.bodega.nombre} -> {self.caja_destino.bodega.nombre}")

    class Meta:
        verbose_name = 'Traslado de Dinero'
        verbose_name_plural = 'Traslados de Dinero'
        ordering = ['-creado_en']


@receiver(post_save, sender='inventario.Bodega')
def crear_caja_automatica(sender, instance, created, **kwargs):
    if created:
        Caja.objects.get_or_create(bodega=instance)