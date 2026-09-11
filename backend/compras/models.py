from django.db import models
from django.conf import settings
from decimal import Decimal
from terceros.models import Tercero
from inventario.models import TipoCafe, Bodega


class Compra(models.Model):
    # ── ÍTEM 24: estado de la compra. 'anulada' reemplaza al borrado
    # físico -- conserva el registro completo para auditoría y deja de
    # contar para inventario/caja/WAC hacia adelante (ver
    # _anular_compra() en views.py). No se agrega ningún filtro
    # automático por estado en el manager: las vistas que listan
    # compras deben decidir explícitamente si excluyen las anuladas. ──
    ESTADO_CHOICES = [
        ('activa', 'Activa'),
        ('anulada', 'Anulada'),
    ]
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activa')

    # Renombramos proveedor → caficultor para mayor claridad
    caficultor = models.ForeignKey(
        Tercero,
        on_delete=models.PROTECT,
        related_name='compras',
    )
    fecha = models.DateField()
    nota = models.TextField(blank=True, null=True)

    # Usuario que registró la compra
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='compras_registradas',
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    @property
    def total(self):
        total = Decimal('0')
        for d in self.detalles.all():
            if not d.es_deposito:
                total += d.kilos * (d.precio_kilo or Decimal('0'))
            else:
                for l in d.liquidaciones.all():
                    total += l.kilos * (l.precio_kilo or Decimal('0'))
        return total

    @property
    def total_deposito_pendiente(self):
        total = Decimal('0')
        for d in self.detalles.filter(es_deposito=True, liquidado=False):
            if d.liquidaciones.exists():
                total += d.kilos_pendientes_liquidar * d.liquidaciones.last().precio_kilo
        return total

    def __str__(self):
        return f"Compra #{self.id} - {self.caficultor} - {self.fecha}"

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
        null=True, blank=True,
    )
    es_deposito = models.BooleanField(default=False)
    liquidado = models.BooleanField(default=False)

    @property
    def kilos_liquidados(self):
        return sum(
            (l.kilos for l in self.liquidaciones.all()),
            Decimal('0')
        )

    @property
    def kilos_pendientes_liquidar(self):
        return self.kilos - self.kilos_liquidados

    @property
    def subtotal(self):
        return self.kilos * (self.precio_kilo or Decimal('0'))

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
        related_name='liquidaciones',
    )
    kilos = models.DecimalField(max_digits=10, decimal_places=2)
    precio_kilo = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateField()
    nota = models.TextField(blank=True, null=True)

    # Usuario que registró la liquidación
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='liquidaciones_registradas',
    )
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


# ── ÍTEM 24: aprobación de eliminación de compras ──
class SolicitudEliminacionCompra(models.Model):
    """
    Un administrador de bodega no puede eliminar una compra directamente
    -- solo puede solicitarlo, con un motivo obligatorio. Solo el jefe
    puede aprobar (anula la compra, ver _anular_compra() en views.py) o
    rechazar la solicitud.

    Es un ForeignKey a Compra (no OneToOne) a propósito: si Jimmi rechaza
    una solicitud, el administrador puede volver a solicitarla después
    con otro motivo, y queda el historial completo de ambos intentos.
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
    ]

    compra = models.ForeignKey(
        Compra, on_delete=models.CASCADE, related_name='solicitudes_eliminacion'
    )
    solicitado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='+'
    )
    motivo = models.TextField()
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)

    respondido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )
    fecha_respuesta = models.DateTimeField(null=True, blank=True)
    motivo_rechazo = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Solicitud #{self.id} — Compra #{self.compra_id} ({self.estado})"

    class Meta:
        verbose_name = 'Solicitud de Eliminación de Compra'
        verbose_name_plural = 'Solicitudes de Eliminación de Compra'
        ordering = ['-fecha_solicitud']