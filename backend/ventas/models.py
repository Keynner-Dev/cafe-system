from django.db import models
from decimal import Decimal
from terceros.models import Tercero
from inventario.models import TipoCafe, Bodega


class Venta(models.Model):
    # Número de remisión automático (se genera con el id)
    fecha = models.DateField()
    cliente = models.ForeignKey(Tercero, on_delete=models.PROTECT)
    cuenta = models.CharField(max_length=100, blank=True, null=True)

    # Datos del conductor
    conductor_nombre = models.CharField(max_length=200)
    conductor_cedula = models.CharField(max_length=50)
    conductor_direccion = models.CharField(max_length=300, blank=True, null=True)
    conductor_telefono = models.CharField(max_length=50, blank=True, null=True)

    # Datos del vehículo
    vehiculo_clase = models.CharField(max_length=100, blank=True, null=True)
    vehiculo_placas = models.CharField(max_length=20)
    vehiculo_marca = models.CharField(max_length=100, blank=True, null=True)
    vehiculo_color = models.CharField(max_length=50, blank=True, null=True)
    vehiculo_modelo = models.CharField(max_length=50, blank=True, null=True)

    # Flete
    flete_valor = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    flete_pagadero_por = models.CharField(max_length=200, blank=True, null=True)

    nota = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    @property
    def numero_remision(self):
        return f"REM-{str(self.id).zfill(4)}"

    @property
    def total_kilos(self):
        return sum(
            (d.kilos for d in self.detalles.all()),
            Decimal('0')
        )

    @property
    def total_bultos(self):
        return sum(d.bultos for d in self.detalles.all())

    @property
    def total(self):
        return self.flete_valor

    def __str__(self):
        return f"Remisión {self.numero_remision} - {self.cliente} - {self.fecha}"

    class Meta:
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
        ordering = ['-fecha']


class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    tipo_cafe = models.ForeignKey(TipoCafe, on_delete=models.PROTECT)
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT)
    bultos = models.PositiveIntegerField(default=0)
    kilos = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.tipo_cafe} - {self.bultos} bultos - {self.kilos}kg"

    class Meta:
        verbose_name = 'Detalle de Venta'
        verbose_name_plural = 'Detalles de Venta'