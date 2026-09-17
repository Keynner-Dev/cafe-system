from rest_framework import viewsets, filters as drf_filters
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from .models import Venta, DetalleVenta
from .serializers import VentaSerializer
from .filters import VentaFilter  # ← NUEVO (ítem 17)
from inventario.models import MovimientoInventario


class VentaViewSet(viewsets.ModelViewSet):
    serializer_class = VentaSerializer
    filterset_class = VentaFilter
    # FIX: DjangoFilterBackend debe ser la CLASE importada, no un string.
    # DRF instancia cada elemento de filter_backends llamándolo como
    # backend() -- un string no es invocable, eso causaba el 500
    # ('str' object is not callable) en cualquier petición a este
    # endpoint, con o sin ordering/filtros en la URL. Mismo bug que
    # tenía CompraViewSet.
    filter_backends = [
        DjangoFilterBackend,
        drf_filters.OrderingFilter,
    ]
    # 'id' sirve para ordenar por remisión también, porque
    # numero_remision es una @property derivada directamente del id
    # (f"REM-{str(self.id).zfill(4)}") -- no hace falta ninguna
    # anotación ni Subquery como sí fue necesario en Compras para
    # ordenar por total (Venta.total = flete_valor, que SÍ es una
    # columna real de la base de datos, así que tampoco necesita truco
    # si en el futuro se quiere ordenar por ahí).
    ordering_fields = ['id', 'fecha']
    ordering = ['-fecha']  # mismo orden por defecto que ya tenía la tabla

    def get_queryset(self):
        usuario = self.request.user
        qs = Venta.objects.select_related(
            'empresa', 'flete_caja__bodega', 'creado_por'
        ).prefetch_related(
            Prefetch(
                'detalles',
                queryset=DetalleVenta.objects.select_related('tipo_cafe', 'bodega'),
            )
        )

        # Administrador solo ve remisiones que involucran su bodega
        if usuario.rol == 'administrador':
            qs = qs.filter(detalles__bodega=usuario.bodega).distinct()

        return qs

    def get_serializer_context(self):
        # Necesario para que VentaSerializer sepa quién está consultando
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creado_por=user)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        # get_object() ya usa get_queryset() filtrado — un admin no puede
        # eliminar remisiones de otra bodega (le devuelve 404, no 403)
        venta = self.get_object()

        # ── FIX: reversa correcta de inventario/WAC y de caja ──
        # Antes, esto solo hacía MovimientoInventario.filter(...).delete()
        # + venta.delete(). Como MovimientoInventario no tiene ninguna
        # señal post_delete, el WAC (CostoInventario) se quedaba con los
        # kilos y el valor restados PARA SIEMPRE, aunque la venta que los
        # descontó ya no existiera. Y el egreso de caja por el flete
        # (creado por señal, sin FK a Venta) tampoco se revertía nunca.
        # Mismo patrón de bug que ya se corrigió para Compras en la v26
        # -- aquí se replica la misma solución: movimientos compensatorios
        # que sí disparan las señales correctas, en vez de borrar/ignorar.
        from inventario.models import CostoInventario
        from caja.models import MovimientoCaja

        for detalle in venta.detalles.all():
            MovimientoInventario.objects.create(
                tipo='entrada',
                tipo_cafe=detalle.tipo_cafe,
                bodega=detalle.bodega,
                kilos=detalle.kilos,
                precio_kilo=detalle.costo_promedio,
                referencia=f'anulacion-venta-{venta.id}',
                nota=f'Reverso por eliminación de la remisión {venta.numero_remision}',
            )

        if venta.flete_caja and venta.flete_descontado:
            egresos_flete = MovimientoCaja.objects.filter(
                descripcion__startswith=f'Flete remisión {venta.numero_remision} —'
            )
            for egreso in egresos_flete:
                MovimientoCaja.objects.create(
                    caja=egreso.caja,
                    tipo='ingreso',
                    valor=egreso.valor,
                    descripcion=f'Reverso por eliminación de la remisión {venta.numero_remision}',
                    creado_por=venta.creado_por,
                )

        MovimientoInventario.objects.filter(
            referencia=f'venta-{venta.id}'
        ).delete()

        venta.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)