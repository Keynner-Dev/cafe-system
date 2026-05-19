from django.db import models

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
    referencia = models.CharField(max_length=100, blank=True, null=True)  # ID de compra o venta
    nota = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo} - {self.tipo_cafe} - {self.kilos}kg"

    class Meta:
        verbose_name = 'Movimiento de Inventario'
        verbose_name_plural = 'Movimientos de Inventario'
        ordering = ['-fecha']