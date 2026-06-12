from django.db import models
from django.conf import settings


class CuentaPorCobrar(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('parcial',   'Parcial'),
        ('pagado',    'Pagado'),
    ]

    empresa  = models.ForeignKey(
        'terceros.Tercero',
        on_delete=models.PROTECT,
        related_name='cuentas_por_cobrar',
        limit_choices_to={'tipo__in': ['empresa', 'ambos']},
    )
    venta    = models.ForeignKey(
        'ventas.Venta',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='cuentas_por_cobrar',
    )
    bodega   = models.ForeignKey(
        'inventario.Bodega',
        on_delete=models.PROTECT,
        related_name='cuentas_por_cobrar',
    )
    valor_total   = models.DecimalField(max_digits=14, decimal_places=2)
    valor_cobrado = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    estado        = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    notas          = models.TextField(blank=True)
    creado_por     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='cuentas_cobrar_creadas',
    )

    class Meta:
        verbose_name = 'Cuenta por cobrar'
        verbose_name_plural = 'Cuentas por cobrar'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"CxC {self.empresa} – ${self.valor_total}"

    @property
    def saldo(self):
        return self.valor_total - self.valor_cobrado

    def _actualizar_estado(self):
        if self.valor_cobrado <= 0:
            self.estado = 'pendiente'
        elif self.valor_cobrado >= self.valor_total:
            self.estado = 'pagado'
        else:
            self.estado = 'parcial'


class AbonoCobranza(models.Model):
    cuenta    = models.ForeignKey(
        CuentaPorCobrar,
        on_delete=models.CASCADE,
        related_name='abonos',
    )
    valor     = models.DecimalField(max_digits=14, decimal_places=2)
    fecha     = models.DateTimeField(auto_now_add=True)
    notas     = models.TextField(blank=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='abonos_cobranza_creados',
    )

    class Meta:
        verbose_name = 'Abono de cobranza'
        verbose_name_plural = 'Abonos de cobranza'
        ordering = ['-fecha']

    def __str__(self):
        return f"Abono ${self.valor} → {self.cuenta}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalcular valor_cobrado sumando todos los abonos
        cuenta = self.cuenta
        total_abonado = cuenta.abonos.aggregate(
            total=models.Sum('valor')
        )['total'] or 0
        cuenta.valor_cobrado = total_abonado
        cuenta._actualizar_estado()
        cuenta.save()