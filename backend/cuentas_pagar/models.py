from django.db import models
from inventario.models import Bodega
from django.conf import settings


class CuentaPorPagar(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('parcial', 'Parcial'),
        ('pagado', 'Pagado'),
    ]

    caficultor = models.ForeignKey(
        'terceros.Tercero',
        on_delete=models.PROTECT,
        related_name='cuentas_por_pagar'
    )
    compra = models.ForeignKey(
        'compras.Compra',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='cuentas_por_pagar'
    )
    bodega = models.ForeignKey(
        Bodega,
        on_delete=models.PROTECT,
        related_name='cuentas_por_pagar'
    )
    descripcion = models.CharField(max_length=255)
    valor_total = models.DecimalField(max_digits=14, decimal_places=2)
    valor_pagado = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha = models.DateField()
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cuentas_por_pagar'
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    @property
    def saldo(self):
        return self.valor_total - self.valor_pagado

    def actualizar_estado(self):
        if self.valor_pagado <= 0:
            self.estado = 'pendiente'
        elif self.valor_pagado >= self.valor_total:
            self.estado = 'pagado'
        else:
            self.estado = 'parcial'
        self.save()

    def __str__(self):
        return f"{self.caficultor.nombre} — ${self.valor_total} — {self.estado}"

    class Meta:
        verbose_name = 'Cuenta por Pagar'
        verbose_name_plural = 'Cuentas por Pagar'
        ordering = ['-fecha', '-creado_en']


class AbonoCuentaPorPagar(models.Model):
    MEDIO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
    ]

    cuenta = models.ForeignKey(
        CuentaPorPagar,
        on_delete=models.PROTECT,
        related_name='abonos'
    )
    valor = models.DecimalField(max_digits=14, decimal_places=2)
    medio_pago = models.CharField(max_length=15, choices=MEDIO_PAGO_CHOICES)
    nota = models.CharField(max_length=255, blank=True)
    fecha = models.DateField()
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='abonos_cuentas_pagar'
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        es_nuevo = self.pk is None
        super().save(*args, **kwargs)
        if es_nuevo:
            # Actualiza valor_pagado y estado de la cuenta
            self.cuenta.valor_pagado += self.valor
            self.cuenta.actualizar_estado()

    def __str__(self):
        return f"Abono ${self.valor} → {self.cuenta.caficultor.nombre}"

    class Meta:
        verbose_name = 'Abono'
        verbose_name_plural = 'Abonos'
        ordering = ['-fecha', '-creado_en']