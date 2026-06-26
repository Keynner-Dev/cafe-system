from django.db import models
from inventario.models import Bodega
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.exceptions import ValidationError
from django.db import transaction
from django.db.models import F


class Caja(models.Model):
    bodega = models.OneToOneField(
        Bodega,
        on_delete=models.PROTECT,
        related_name='caja'
    )
    saldo_actual = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0
    )
    abierta = models.BooleanField(default=True)

    def __str__(self):
        return f"Caja — {self.bodega.nombre}"

    class Meta:
        verbose_name = 'Caja'
        verbose_name_plural = 'Cajas'


class CierreCaja(models.Model):
    caja = models.ForeignKey(
        Caja,
        on_delete=models.PROTECT,
        related_name='cierres'
    )
    fecha = models.DateField(auto_now_add=True)
    saldo_teorico = models.DecimalField(max_digits=14, decimal_places=2)
    saldo_fisico = models.DecimalField(max_digits=14, decimal_places=2)
    diferencia = models.DecimalField(max_digits=14, decimal_places=2)
    nota = models.CharField(max_length=255, blank=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cierres_caja'
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cierre {self.fecha} — {self.caja.bodega.nombre}"

    class Meta:
        verbose_name = 'Cierre de Caja'
        verbose_name_plural = 'Cierres de Caja'
        ordering = ['-fecha']


class MovimientoCaja(models.Model):
    TIPO_CHOICES = [
        ('ingreso', 'Ingreso'),
        ('egreso', 'Egreso'),
    ]

    caja = models.ForeignKey(
        Caja,
        on_delete=models.PROTECT,
        related_name='movimientos'
    )
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    valor = models.DecimalField(max_digits=14, decimal_places=2)
    descripcion = models.CharField(max_length=255)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='movimientos_caja'
    )
    fecha = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        es_nuevo = self.pk is None

        if es_nuevo:
            # ── NUEVO (ítem 21) ──
            # Antes de actualizar el saldo, se vuelve a leer `caja.abierta`
            # con select_for_update() para bloquear esa fila hasta que
            # termine esta transacción completa. Si dos movimientos para
            # la MISMA caja llegan casi al mismo tiempo, el segundo tiene
            # que ESPERAR a que el primero termine (no puede leer
            # `abierta` ni `saldo_actual` viejos mientras el primero está
            # a mitad de camino). Mismo patrón ya usado en
            # TrasladoDineroViewSet.perform_create().
            #
            # select_for_update() exige estar dentro de una transacción
            # atómica -- se envuelve todo el método en transaction.atomic()
            # para garantizarlo sin depender de que la vista que llama a
            # .save() ya esté en una.
            with transaction.atomic():
                caja_bloqueada = Caja.objects.select_for_update().get(pk=self.caja_id)

                if not caja_bloqueada.abierta:
                    raise ValidationError(
                        'La caja está cerrada. Debes abrirla antes de registrar movimientos.'
                    )

                super().save(*args, **kwargs)

                # ── NUEVO (ítem 21): actualización atómica con F() ──
                # Antes: self.caja.saldo_actual += self.valor; self.caja.save()
                # Eso carga el saldo en un objeto Python y lo vuelve a
                # escribir -- si dos movimientos llegaran casi al mismo
                # tiempo (incluso sin el bloqueo de arriba, por ejemplo
                # si alguna otra ruta de código futura llama a este save()
                # fuera de una request HTTP), el segundo `save()` podía
                # sobrescribir el incremento del primero ("lost update"),
                # dejando saldo_actual desincronizado del historial real
                # de movimientos.
                #
                # F('saldo_actual') le dice a la base de datos que haga
                # la suma/resta directamente en la fila (UPDATE caja SET
                # saldo_actual = saldo_actual + X), una operación atómica
                # a nivel de base de datos sin importar cuántas peticiones
                # concurrentes existan. Se combina con select_for_update()
                # de arriba como doble capa de protección: el bloqueo
                # serializa el orden de las operaciones, y F() garantiza
                # que el cálculo en sí nunca se basa en un valor leído
                # en memoria que pudo quedar desactualizado.
                if self.tipo == 'ingreso':
                    Caja.objects.filter(pk=self.caja_id).update(
                        saldo_actual=F('saldo_actual') + self.valor
                    )
                else:
                    Caja.objects.filter(pk=self.caja_id).update(
                        saldo_actual=F('saldo_actual') - self.valor
                    )
        else:
            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tipo} ${self.valor} — {self.caja.bodega.nombre}"

    class Meta:
        verbose_name = 'Movimiento de Caja'
        verbose_name_plural = 'Movimientos de Caja'
        ordering = ['-fecha']


class TrasladoDinero(models.Model):
    caja_origen  = models.ForeignKey(
        Caja, on_delete=models.PROTECT,
        related_name='traslados_salida'
    )
    caja_destino = models.ForeignKey(
        Caja, on_delete=models.PROTECT,
        related_name='traslados_entrada'
    )
    valor = models.DecimalField(max_digits=14, decimal_places=2)
    nota  = models.CharField(max_length=255, blank=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='traslados_dinero'
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (f"Traslado ${self.valor} "
                f"{self.caja_origen.bodega.nombre} -> {self.caja_destino.bodega.nombre}")

    class Meta:
        verbose_name = 'Traslado de Dinero'
        verbose_name_plural = 'Traslados de Dinero'
        ordering = ['-creado_en']


@receiver(post_save, sender='inventario.Bodega')
def crear_caja_automatica(sender, instance, created, **kwargs):
    if created:
        Caja.objects.get_or_create(bodega=instance)