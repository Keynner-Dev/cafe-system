from django.db import models
from inventario.models import TipoCafe

class PrecioDiario(models.Model):
    tipo_cafe = models.ForeignKey(TipoCafe, on_delete=models.PROTECT)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateField()
    nota = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo_cafe} - ${self.precio} - {self.fecha}"

    class Meta:
        verbose_name = 'Precio Diario'
        verbose_name_plural = 'Precios Diarios'
        ordering = ['-fecha']
        unique_together = ['tipo_cafe', 'fecha']  # Un precio por tipo por día