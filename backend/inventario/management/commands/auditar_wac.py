"""
Auditoría de WAC (costo promedio ponderado) — SOLO LECTURA.

Contexto (ver ítem 24): antes de que existiera SolicitudEliminacionCompra,
eliminar una compra borraba sus MovimientoInventario y luego la compra
misma. Pero inventario/models.py nunca tuvo (ni tiene) una señal
post_delete para MovimientoInventario -- solo post_save. Eso significa
que borrar un movimiento JAMÁS revirtió su efecto sobre CostoInventario
(kilos_actuales / valor_actual), sin importar si el borrado era de un
registro o de un queryset completo. Cualquier compra eliminada antes de
esta versión dejó "flotando" ese kilaje y ese valor en CostoInventario
para siempre, aunque el movimiento que los originó ya no exista.

Como los movimientos borrados ya no están en la base de datos, no se
puede reconstruir exactamente CUÁLES compras causaron el desfase. Lo
que SÍ se puede hacer es lo que hace este comando: recalcular, desde
cero, cuánto DEBERÍA tener cada CostoInventario según los movimientos
que SÍ siguen existiendo hoy (repitiendo la misma lógica que usan las
señales de models.py, en el mismo orden cronológico en que se crearon),
y compararlo contra lo que la base de datos tiene guardado ahora mismo.
Cualquier diferencia es candidata a venir de una eliminación vieja (o,
en teoría, de cualquier otra inconsistencia -- este comando no puede
distinguir la causa, solo detectar el síntoma).

NO escribe nada en la base de datos. Es seguro correrlo en producción
las veces que haga falta.

Uso:
    python manage.py auditar_wac
    python manage.py auditar_wac --bodega=1
    python manage.py auditar_wac --tolerancia=0.5   (kg de margen antes de reportar, default 0.01)
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from inventario.models import Bodega, TipoCafe, CostoInventario, MovimientoInventario
from compras.models import LiquidacionDeposito


class Command(BaseCommand):
    help = 'Recalcula el WAC desde el historial de movimientos actual y lo compara contra CostoInventario. Solo lectura.'

    def add_arguments(self, parser):
        parser.add_argument('--bodega', type=int, default=None, help='Filtrar por ID de bodega')
        parser.add_argument('--tolerancia', type=float, default=0.01,
                             help='Diferencia mínima en kg para reportar una fila (default 0.01)')

    def handle(self, *args, **options):
        bodega_id = options['bodega']
        tolerancia = Decimal(str(options['tolerancia']))

        costos = CostoInventario.objects.select_related('bodega', 'tipo_cafe').all()
        if bodega_id:
            costos = costos.filter(bodega_id=bodega_id)
        costos = costos.order_by('bodega__nombre', 'tipo_cafe__nombre')

        encontrados = 0
        revisados = 0

        for costo in costos:
            revisados += 1
            kilos_esperado, valor_esperado = self._recalcular(costo.bodega, costo.tipo_cafe)

            dif_kilos = costo.kilos_actuales - kilos_esperado
            dif_valor = costo.valor_actual - valor_esperado

            if abs(dif_kilos) < tolerancia and abs(dif_valor) < Decimal('1'):
                continue

            encontrados += 1
            promedio_bd = costo.costo_promedio
            promedio_esperado = (valor_esperado / kilos_esperado) if kilos_esperado > 0 else Decimal('0')

            self.stdout.write(self.style.WARNING(
                f"\n⚠ {costo.bodega.nombre} — {costo.tipo_cafe.nombre}"
            ))
            self.stdout.write(
                f"   Kilos   -> BD: {costo.kilos_actuales:>10} kg   "
                f"Recalculado: {kilos_esperado:>10} kg   Diferencia: {dif_kilos:>+10}"
            )
            self.stdout.write(
                f"   Valor   -> BD: ${costo.valor_actual:>14,.2f}   "
                f"Recalculado: ${valor_esperado:>14,.2f}   Diferencia: ${dif_valor:>+14,.2f}"
            )
            self.stdout.write(
                f"   Costo promedio -> BD: ${promedio_bd:,.2f}/kg   "
                f"Recalculado: ${promedio_esperado:,.2f}/kg"
            )

        self.stdout.write('')
        if encontrados == 0:
            self.stdout.write(self.style.SUCCESS(
                f"Revisadas {revisados} combinaciones bodega/tipo de café — ninguna diferencia relevante."
            ))
        else:
            self.stdout.write(self.style.ERROR(
                f"Revisadas {revisados} combinaciones — {encontrados} con diferencia. "
                f"Esto NO modificó nada; es solo un reporte. Revisar con Keynner antes de corregir a mano."
            ))

    def _recalcular(self, bodega, tipo_cafe):
        """Repite exactamente la lógica de actualizar_costo_por_movimiento()
        y actualizar_costo_por_liquidacion() en inventario/models.py, en el
        mismo orden en que se crearon los eventos (por fecha de creación),
        partiendo de kilos=0 / valor=0."""
        eventos = []

        movimientos = MovimientoInventario.objects.filter(
            bodega=bodega, tipo_cafe=tipo_cafe
        ).order_by('fecha', 'id')
        for m in movimientos:
            eventos.append((m.fecha, 0, 'movimiento', m))

        liquidaciones = LiquidacionDeposito.objects.filter(
            detalle_compra__bodega=bodega, detalle_compra__tipo_cafe=tipo_cafe
        ).order_by('creado_en', 'id')
        for l in liquidaciones:
            eventos.append((l.creado_en, 1, 'liquidacion', l))

        # 0/1 como segundo criterio de orden solo para desempatar si dos
        # eventos tuvieran EXACTAMENTE el mismo timestamp -- no tiene
        # ningún significado de negocio, es puro desempate determinista.
        eventos.sort(key=lambda e: (e[0], e[1]))

        kilos = Decimal('0')
        valor = Decimal('0')

        for _, _, tipo_evento, obj in eventos:
            if tipo_evento == 'movimiento':
                if obj.tipo in ('entrada', 'traslado_entrada'):
                    kilos += obj.kilos
                    if obj.precio_kilo:
                        valor += obj.kilos * obj.precio_kilo
                elif obj.tipo in ('salida', 'traslado_salida'):
                    promedio = (valor / kilos) if kilos > 0 else Decimal('0')
                    valor_salida = obj.kilos * promedio
                    valor = max(valor - valor_salida, Decimal('0'))
                    kilos = max(kilos - obj.kilos, Decimal('0'))
            else:  # liquidacion
                valor += obj.kilos * obj.precio_kilo

        return kilos, valor