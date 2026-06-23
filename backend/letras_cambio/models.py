from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


class LetraCambio(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('parcial', 'Parcial'),
        ('pagado', 'Pagado'),
    ]

    caficultor = models.ForeignKey(
        'terceros.Tercero',
        on_delete=models.PROTECT,
        related_name='letras_cambio',
        limit_choices_to={'tipo__in': ['caficultor', 'ambos']},
    )
    bodega = models.ForeignKey(
        'inventario.Bodega',
        on_delete=models.PROTECT,
        related_name='letras_cambio',
    )
    valor_total = models.DecimalField(max_digits=14, decimal_places=2)
    valor_abonado = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    notas = models.TextField(blank=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='letras_creadas',
    )

    class Meta:
        verbose_name = 'Letra de cambio'
        verbose_name_plural = 'Letras de cambio'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Letra {self.caficultor} — ${self.valor_total}"

    @property
    def saldo(self):
        return self.valor_total - self.valor_abonado

    def actualizar_estado(self):
        if self.valor_abonado <= 0:
            self.estado = 'pendiente'
        elif self.valor_abonado >= self.valor_total:
            self.estado = 'pagado'
        else:
            self.estado = 'parcial'


class AbonoLetra(models.Model):
    letra = models.ForeignKey(
        LetraCambio,
        on_delete=models.CASCADE,
        related_name='abonos',
    )
    valor = models.DecimalField(max_digits=14, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    notas = models.TextField(blank=True)
    # Si el abono viene automáticamente de una compra, queda la referencia
    compra = models.ForeignKey(
        'compras.Compra',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='abonos_letra',
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='abonos_letra_creados',
    )

    class Meta:
        verbose_name = 'Abono a letra'
        verbose_name_plural = 'Abonos a letras'
        ordering = ['-fecha']

    def __str__(self):
        return f"Abono ${self.valor} → {self.letra}"


# ─── Señales: actualizan caja automáticamente ──────────────────────────────

@receiver(post_save, sender=LetraCambio)
def egreso_caja_al_crear_letra(sender, instance, created, **kwargs):
    """Al crear una letra (préstamo al caficultor), sale dinero de la caja."""
    if created:
        from caja.models import Caja, MovimientoCaja
        caja = Caja.objects.get(bodega=instance.bodega)
        MovimientoCaja.objects.create(
            caja=caja,
            tipo='egreso',
            valor=instance.valor_total,
            descripcion=f'Letra de cambio — adelanto a {instance.caficultor.nombre}',
            creado_por=instance.creado_por,
        )


@receiver(post_save, sender=AbonoLetra)
def ingreso_caja_al_abonar_letra(sender, instance, created, **kwargs):
    """Al abonar una letra, entra dinero a la caja (el caficultor devuelve parte del préstamo)."""
    if created:
        from caja.models import Caja, MovimientoCaja
        letra = instance.letra
        caja = Caja.objects.get(bodega=letra.bodega)
        MovimientoCaja.objects.create(
            caja=caja,
            tipo='ingreso',
            valor=instance.valor,
            descripcion=f'Abono letra — {letra.caficultor.nombre}',
            creado_por=instance.creado_por,
        )
        # Actualiza el saldo de la letra
        letra.valor_abonado += instance.valor
        letra.actualizar_estado()
        letra.save()