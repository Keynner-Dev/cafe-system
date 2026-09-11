from django.conf import settings
from django.db import models
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver


class TipoCafe(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Tipo de Café'
        verbose_name_plural = 'Tipos de Café'


class Bodega(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    ubicacion = models.CharField(max_length=200, blank=True, null=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Bodega'
        verbose_name_plural = 'Bodegas'


class MovimientoInventario(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('traslado_salida', 'Traslado Salida'),
        ('traslado_entrada', 'Traslado Entrada'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    tipo_cafe = models.ForeignKey(TipoCafe, on_delete=models.PROTECT)
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='movimientos')
    bodega_destino = models.ForeignKey(
        Bodega,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='movimientos_entrada'
    )
    kilos = models.DecimalField(max_digits=10, decimal_places=2)
    precio_kilo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    referencia = models.CharField(max_length=100, blank=True, null=True)
    nota = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo} - {self.tipo_cafe} - {self.kilos}kg"

    class Meta:
        verbose_name = 'Movimiento de Inventario'
        verbose_name_plural = 'Movimientos de Inventario'
        ordering = ['-fecha']


class CostoInventario(models.Model):
    """
    'Cuenta corriente' de costo por bodega + tipo de café.
    costo_promedio = valor_actual / kilos_actuales (costo promedio ponderado — WAC).
    Se actualiza automáticamente vía señales con cada movimiento de inventario
    y cada liquidación de depósito.
    """
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='costos_inventario')
    tipo_cafe = models.ForeignKey(TipoCafe, on_delete=models.PROTECT, related_name='costos_inventario')
    kilos_actuales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    valor_actual = models.DecimalField(max_digits=16, decimal_places=2, default=0)

    @property
    def costo_promedio(self):
        if self.kilos_actuales <= 0:
            return Decimal('0')
        return self.valor_actual / self.kilos_actuales

    def __str__(self):
        return f"{self.bodega} — {self.tipo_cafe}: {self.kilos_actuales}kg @ ${self.costo_promedio}/kg"

    class Meta:
        verbose_name = 'Costo de Inventario'
        verbose_name_plural = 'Costos de Inventario'
        unique_together = ('bodega', 'tipo_cafe')


# ────────────────────────────────────────────────────────────
# Señales: mantienen CostoInventario actualizado automáticamente
# ────────────────────────────────────────────────────────────

@receiver(post_save, sender=MovimientoInventario)
def actualizar_costo_por_movimiento(sender, instance, created, **kwargs):
    if not created:
        return

    costo, _ = CostoInventario.objects.get_or_create(
        bodega=instance.bodega, tipo_cafe=instance.tipo_cafe
    )

    if instance.tipo in ('entrada', 'traslado_entrada'):
        costo.kilos_actuales += instance.kilos
        if instance.precio_kilo:
            costo.valor_actual += instance.kilos * instance.precio_kilo
        costo.save()

    elif instance.tipo in ('salida', 'traslado_salida'):
        promedio = costo.costo_promedio
        valor_salida = instance.kilos * promedio
        costo.valor_actual = max(costo.valor_actual - valor_salida, Decimal('0'))
        costo.kilos_actuales = max(costo.kilos_actuales - instance.kilos, Decimal('0'))
        costo.save()


# ── ÍTEM 26: ajuste manual de stock (solo Jimmi) ──
class AjusteStock(models.Model):
    """
    Corrección manual de kilos en una bodega + tipo de café (ej. café
    mojado que se secó, un conteo físico que no coincidía con el
    sistema). NO es una compra ni una venta: no hay dinero nuevo
    entrando ni saliendo del negocio.

    Para que esto no afecte el WAC (costo promedio ponderado) del tipo
    de café ajustado, el movimiento de inventario que se crea junto con
    este registro reutiliza los tipos normales 'entrada'/'salida' de
    MovimientoInventario (no se crean tipos nuevos, para no tener que
    tocar todos los cálculos de stock que ya filtran por esos dos) --
    igual que hace trasladar() en views.py, un incremento usa como
    precio_kilo el costo_promedio actual (así el costo promedio no se
    mueve, solo el kilaje) y un decremento no necesita precio_kilo
    porque la señal de salida siempre usa el promedio vigente.
    """
    bodega = models.ForeignKey(
        Bodega, on_delete=models.PROTECT, related_name='ajustes_stock'
    )
    tipo_cafe = models.ForeignKey(
        TipoCafe, on_delete=models.PROTECT, related_name='ajustes_stock'
    )
    kilos_antes = models.DecimalField(max_digits=10, decimal_places=2)
    kilos_despues = models.DecimalField(max_digits=10, decimal_places=2)
    # kilos_despues - kilos_antes; positivo = se sumó, negativo = se restó.
    kilos_ajuste = models.DecimalField(max_digits=10, decimal_places=2)
    motivo = models.TextField()
    realizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='ajustes_stock'
    )
    # El movimiento de inventario ('entrada' o 'salida') que efectivamente
    # movió el kilaje -- se guarda la referencia para trazabilidad, aunque
    # el registro de AjusteStock es la fuente de verdad legible para Jimmi.
    movimiento = models.ForeignKey(
        MovimientoInventario, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='ajuste_stock'
    )
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        signo = '+' if self.kilos_ajuste >= 0 else ''
        return f"{self.bodega} — {self.tipo_cafe}: {signo}{self.kilos_ajuste}kg"

    class Meta:
        verbose_name = 'Ajuste de Stock'
        verbose_name_plural = 'Ajustes de Stock'
        ordering = ['-fecha']


@receiver(post_save, sender='compras.LiquidacionDeposito')
def actualizar_costo_por_liquidacion(sender, instance, created, **kwargs):
    """Al liquidar un depósito, se asigna valor a kilos que ya estaban contados."""
    if not created:
        return

    detalle = instance.detalle_compra
    costo, _ = CostoInventario.objects.get_or_create(
        bodega=detalle.bodega, tipo_cafe=detalle.tipo_cafe
    )
    costo.valor_actual += instance.kilos * instance.precio_kilo
    costo.save()