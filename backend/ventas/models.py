from django.db import models
from django.conf import settings
from decimal import Decimal
from terceros.models import Tercero
from inventario.models import TipoCafe, Bodega


class Venta(models.Model):
    fecha = models.DateField()
    empresa = models.ForeignKey(
        Tercero, on_delete=models.PROTECT, related_name='ventas',
    )
    cuenta = models.CharField(max_length=100, blank=True, null=True)

    conductor_nombre    = models.CharField(max_length=200)
    conductor_cedula    = models.CharField(max_length=50)
    conductor_direccion = models.CharField(max_length=300, blank=True, null=True)
    conductor_telefono  = models.CharField(max_length=50, blank=True, null=True)

    vehiculo_clase  = models.CharField(max_length=100, blank=True, null=True)
    vehiculo_placas = models.CharField(max_length=20)
    vehiculo_marca  = models.CharField(max_length=100, blank=True, null=True)
    vehiculo_color  = models.CharField(max_length=50, blank=True, null=True)
    vehiculo_modelo = models.CharField(max_length=50, blank=True, null=True)

    flete_valor        = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    flete_pagadero_por  = models.CharField(max_length=200, blank=True, null=True)

    # Asignación 100% automática: la bodega que HACE la remisión
    # (bodega del administrador que la crea; si la crea el jefe, se usa
    # como respaldo la bodega con más kilos en el detalle)
    flete_caja = models.ForeignKey(
        'caja.Caja',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='fletes_venta',
    )
    flete_descontado = models.BooleanField(default=False)

    # Solo lo ve y lo asigna el jefe
    precio_kilo_jefe = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
    )

    nota = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='ventas_registradas',
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    @property
    def numero_remision(self):
        return f"REM-{str(self.id).zfill(4)}"

    @property
    def total_kilos(self):
        return sum((d.kilos for d in self.detalles.all()), Decimal('0'))

    @property
    def total_bultos(self):
        return sum(d.bultos for d in self.detalles.all())

    @property
    def total(self):
        return self.flete_valor

    @property
    def utilidad_total(self):
        """precio_kilo_jefe - costo_promedio (WAC capturado al vender) por línea, sumado.
        Devuelve None si el jefe aún no ha asignado precio."""
        if self.precio_kilo_jefe is None:
            return None
        total = Decimal('0')
        for d in self.detalles.all():
            costo = d.costo_promedio or Decimal('0')
            total += (self.precio_kilo_jefe - costo) * d.kilos
        return total

    def __str__(self):
        return f"Remisión {self.numero_remision} - {self.empresa} - {self.fecha}"

    class Meta:
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
        ordering = ['-fecha']


class DetalleVenta(models.Model):
    venta     = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    tipo_cafe = models.ForeignKey(TipoCafe, on_delete=models.PROTECT)
    bodega    = models.ForeignKey(Bodega, on_delete=models.PROTECT)
    bultos    = models.PositiveIntegerField(default=0)
    kilos     = models.DecimalField(max_digits=10, decimal_places=2)

    # ── Campos opcionales de calidad (por línea) ──
    muestra  = models.CharField(max_length=50, blank=True, null=True)
    factor   = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    humedad  = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pasilla  = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # ── Costo promedio (WAC) capturado al momento de la venta — para utilidad ──
    costo_promedio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.tipo_cafe} - {self.bultos} bultos - {self.kilos}kg"

    class Meta:
        verbose_name = 'Detalle de Venta'
        verbose_name_plural = 'Detalles de Venta'


# ── Señal: cuando se asigna flete_caja (automático en create), se descuenta ──
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=Venta)
def egreso_caja_flete(sender, instance, created, **kwargs):
    """Descuenta el flete de la caja asignada, solo una vez."""
    if not instance.flete_caja:
        return
    if instance.flete_descontado:
        return
    if not instance.flete_valor or instance.flete_valor <= 0:
        return

    from caja.models import MovimientoCaja

    MovimientoCaja.objects.create(
        caja=instance.flete_caja,
        tipo='egreso',
        valor=instance.flete_valor,
        descripcion=f'Flete remisión {instance.numero_remision} — {instance.empresa.nombre}',
        creado_por=instance.creado_por,
    )
    Venta.objects.filter(pk=instance.pk).update(flete_descontado=True)