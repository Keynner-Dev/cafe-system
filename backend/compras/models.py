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
        return sum(d.subtotal for d in self.detalles.all())

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
    precio_kilo = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        return self.kilos * self.precio_kilo

    def __str__(self):
        return f"{self.tipo_cafe} - {self.kilos}kg @ ${self.precio_kilo}"

    class Meta:
        verbose_name = 'Detalle de Compra'
        verbose_name_plural = 'Detalles de Compra'