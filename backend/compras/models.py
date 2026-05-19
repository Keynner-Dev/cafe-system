from django.db import models
from terceros.models import Tercero
from inventario.models import TipoCafe, Bodega

class Compra(models.Model):
    proveedor = models.ForeignKey(Tercero, on_delete=models.PROTECT)
    fecha = models.DateField()
    nota = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    @property
    def total(self):
        # Solo suma los detalles ya liquidados o no depósito
        return sum(
            d.subtotal for d in self.detalles.all()
            if not d.es_deposito or d.liquidado
        )

    @property
    def total_deposito_pendiente(self):
        return sum(
            d.kilos_pendientes_liquidar * (d.precio_kilo or 0)
            for d in self.detalles.filter(es_deposito=True, liquidado=False)
        )

    def __str__(self):
        return f"Compra #{self.id} - {self.proveedor} - {self.fecha}"

    class Meta:
        verbose_name = 'Compra'
        verbose_name_plural = 'Compras'
        ordering = ['-fecha']


class DetalleCompra(models.Model):
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='detalles')
    tipo_cafe = models.ForeignKey(TipoCafe, on_delete=models.PROTECT)
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT)
    kilos = models.DecimalField(max_digits=10, decimal_places=2)
    precio_kilo = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True  # puede ser null si es depósito sin precio aún
    )
    es_deposito = models.BooleanField(default=False)
    liquidado = models.BooleanField(default=False)  # True cuando todos los kilos están liquidados

    @property
    def kilos_liquidados(self):
        return sum(l.kilos for l in self.liquidaciones.all())

    @property
    def kilos_pendientes_liquidar(self):
        return self.kilos - self.kilos_liquidados

    @property
    def subtotal(self):
        if self.precio_kilo:
            return self.kilos * self.precio_kilo
        return 0

    def __str__(self):
        estado = ' [DEPÓSITO]' if self.es_deposito else ''
        return f"{self.tipo_cafe} - {self.kilos}kg{estado}"

    class Meta:
        verbose_name = 'Detalle de Compra'
        verbose_name_plural = 'Detalles de Compra'


class LiquidacionDeposito(models.Model):
    detalle_compra = models.ForeignKey(
        DetalleCompra,
        on_delete=models.PROTECT,
        related_name='liquidaciones'
    )
    kilos = models.DecimalField(max_digits=10, decimal_places=2)
    precio_kilo = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateField()
    nota = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    @property
    def subtotal(self):
        return self.kilos * self.precio_kilo

    def __str__(self):
        return f"Liquidación #{self.id} - {self.kilos}kg @ ${self.precio_kilo}"

    class Meta:
        verbose_name = 'Liquidación de Depósito'
        verbose_name_plural = 'Liquidaciones de Depósito'
        ordering = ['-fecha']