from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from .models import Caja, MovimientoCaja, CierreCaja, TrasladoDinero
from .serializers import (
    CajaSerializer, MovimientoCajaSerializer,
    CierreCajaSerializer, TrasladoDineroSerializer, CajaDestinoSerializer
)


class CajaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CajaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        if usuario.rol == 'jefe':
            return Caja.objects.select_related('bodega').all()
        return Caja.objects.select_related('bodega').filter(bodega=usuario.bodega)

    @action(detail=True, methods=['post'], url_path='cerrar')
    @transaction.atomic
    def cerrar(self, request, pk=None):
        # ── NUEVO (ítem 21) ──
        # self.get_object() ya filtra por permisos (administrador solo
        # ve su bodega), pero NO bloquea la fila. Se vuelve a leer la
        # caja con select_for_update() para que, si dos cierres llegan
        # casi al mismo tiempo para la MISMA caja, el segundo espere a
        # que el primero termine -- sin esto, ambos podían leer
        # `abierta=True`, ambos crear un CierreCaja, y ambos guardar
        # `abierta=False`, duplicando el registro de cierre con el
        # mismo saldo_teorico desactualizado en el segundo.
        usuario = request.user
        caja_pk = self.get_object().pk
        caja = Caja.objects.select_for_update().get(pk=caja_pk)

        if usuario.rol == 'administrador' and caja.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a esta caja.')
        if not caja.abierta:
            raise ValidationError('La caja ya está cerrada.')

        saldo_fisico = request.data.get('saldo_fisico')
        if saldo_fisico is None:
            raise ValidationError('Debes ingresar el saldo físico contado.')
        try:
            saldo_fisico = float(saldo_fisico)
        except (ValueError, TypeError):
            raise ValidationError('El saldo físico debe ser un número válido.')

        nota = request.data.get('nota', '')
        saldo_teorico = float(caja.saldo_actual)
        diferencia = saldo_fisico - saldo_teorico

        cierre = CierreCaja.objects.create(
            caja=caja,
            saldo_teorico=saldo_teorico,
            saldo_fisico=saldo_fisico,
            diferencia=diferencia,
            nota=nota,
            creado_por=usuario,
        )
        caja.abierta = False
        caja.save()

        return Response(CierreCajaSerializer(cierre).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='abrir')
    @transaction.atomic
    def abrir(self, request, pk=None):
        # ── NUEVO (ítem 21): mismo razonamiento que en cerrar() ──
        usuario = request.user
        caja_pk = self.get_object().pk
        caja = Caja.objects.select_for_update().get(pk=caja_pk)

        if usuario.rol == 'administrador' and caja.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a esta caja.')
        if caja.abierta:
            raise ValidationError('La caja ya está abierta.')

        caja.abierta = True
        caja.save()
        return Response(CajaSerializer(caja).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='destinos')
    def destinos(self, request):
        """Lista TODAS las cajas (sin saldo_actual) para poblar el
        selector de caja destino en traslados, sin importar el rol
        del usuario. El administrador necesita ver a dónde puede
        trasladar dinero aunque solo opere desde su propia caja como
        origen, sin que esto le exponga saldos de otras bodegas."""
        cajas = Caja.objects.select_related('bodega').all()
        serializer = CajaDestinoSerializer(cajas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MovimientoCajaViewSet(viewsets.ModelViewSet):
    serializer_class = MovimientoCajaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        caja_id = self.request.query_params.get('caja')
        # NUEVO (Sprint 6, ítem 32): filtro por fecha y por tipo
        # (ingreso/egreso), + paginación ya activa por default de DRF
        # (PAGE_SIZE=10) -- antes el frontend descartaba la info de
        # paginación y solo mostraba los primeros 10 movimientos sin
        # forma de ver más.
        fecha = self.request.query_params.get('fecha')
        tipo = self.request.query_params.get('tipo')
        qs = MovimientoCaja.objects.select_related('creado_por')

        if usuario.rol == 'administrador':
            qs = qs.filter(caja__bodega=usuario.bodega)
        if caja_id:
            qs = qs.filter(caja_id=caja_id)
        if fecha:
            qs = qs.filter(fecha__date=fecha)
        if tipo and tipo != 'todos':
            qs = qs.filter(tipo=tipo)
        return qs.order_by('-fecha')

    def perform_create(self, serializer):
        usuario = self.request.user
        caja = serializer.validated_data.get('caja')

        if not caja:
            raise ValidationError('Debes especificar la caja.')
        if usuario.rol == 'administrador' and caja and caja.bodega != usuario.bodega:
            raise PermissionDenied('No tienes acceso a esta caja.')
        if not caja.abierta:
            raise ValidationError('La caja está cerrada. Debes abrirla antes de registrar movimientos.')

        serializer.save(creado_por=usuario)

    @action(detail=False, methods=['get'], url_path='resumen-dia')
    def resumen_dia(self, request):
        """NUEVO (Sprint 6, ítem 33): totales de ingresos y egresos de HOY
        para la caja indicada, para poder cuadrar caja. Es independiente
        de la paginación/filtros de la lista de movimientos -- siempre es
        el total real del día, sin importar qué página esté viendo el
        usuario."""
        from django.utils import timezone
        from django.db.models import Sum

        usuario = request.user
        caja_id = request.query_params.get('caja')
        if not caja_id:
            raise ValidationError('Debes especificar la caja.')

        qs = MovimientoCaja.objects.filter(
            caja_id=caja_id, fecha__date=timezone.localdate()
        )
        if usuario.rol == 'administrador':
            qs = qs.filter(caja__bodega=usuario.bodega)

        ingresos = qs.filter(tipo='ingreso').aggregate(total=Sum('valor'))['total'] or 0
        egresos = qs.filter(tipo='egreso').aggregate(total=Sum('valor'))['total'] or 0

        return Response({
            'ingresos': float(ingresos),
            'egresos': float(egresos),
            'neto': float(ingresos) - float(egresos),
        })

    @action(detail=False, methods=['get'], url_path='exportar-dia')
    def exportar_dia(self, request):
        """NUEVO (Sprint 6, ítem 34): datos completos (sin paginar) de los
        movimientos de HOY para exportar en Excel/PDF desde el frontend.
        Se hace aparte del listado normal porque ese sí va paginado de a
        10 y para exportar hace falta el día completo.

        Cada movimiento se categoriza por "concepto" a partir del prefijo
        de su descripción (todo lo que va antes de " — "), ej. "Gasto",
        "Vale", "Abono vale", "Letra de cambio", "Flete remisión". No
        existe un campo de categoría en el modelo -- se deriva del patrón
        de texto que ya usan Gastos, Letras, Cuentas por pagar y Ventas al
        crear cada movimiento. Si el patrón de esos módulos cambia en el
        futuro, esta categorización hay que revisarla también.
        """
        from django.utils import timezone
        from django.db.models import Sum

        usuario = request.user
        caja_id = request.query_params.get('caja')
        if not caja_id:
            raise ValidationError('Debes especificar la caja.')

        qs = MovimientoCaja.objects.filter(
            caja_id=caja_id, fecha__date=timezone.localdate()
        ).select_related('creado_por').order_by('fecha')
        if usuario.rol == 'administrador':
            qs = qs.filter(caja__bodega=usuario.bodega)

        movimientos = []
        totales_por_concepto = {}
        for mov in qs:
            concepto = mov.descripcion.split(' — ')[0].strip() if ' — ' in mov.descripcion else mov.descripcion
            movimientos.append({
                'fecha': mov.fecha.isoformat(),
                'tipo': mov.tipo,
                'concepto': concepto,
                'descripcion': mov.descripcion,
                'valor': float(mov.valor),
                'registrado_por': mov.creado_por.username if mov.creado_por else '',
            })
            clave = f"{mov.tipo}:{concepto}"
            totales_por_concepto[clave] = totales_por_concepto.get(clave, 0) + float(mov.valor)

        return Response({
            'movimientos': movimientos,
            'totales_por_concepto': [
                {'tipo': clave.split(':')[0], 'concepto': clave.split(':')[1], 'total': total}
                for clave, total in totales_por_concepto.items()
            ],
        })


class CierreCajaViewSet(viewsets.ReadOnlyModelViewSet):
    """Historial de aperturas/cierres de caja.

    Jefe: ve los cierres de todas las bodegas (consolidado), con
    filtro opcional por bodega vía ?caja=<id>.
    Administrador: solo ve los cierres de la caja de su propia
    bodega, sin importar qué valor llegue en ?caja=.
    """
    serializer_class = CierreCajaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        caja_id = self.request.query_params.get('caja')
        qs = CierreCaja.objects.select_related('caja__bodega', 'creado_por')

        if usuario.rol == 'administrador':
            qs = qs.filter(caja__bodega=usuario.bodega)
        elif caja_id:
            qs = qs.filter(caja_id=caja_id)

        return qs.order_by('-fecha')


class TrasladoDineroViewSet(viewsets.ModelViewSet):
    serializer_class = TrasladoDineroSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        usuario = self.request.user
        qs = TrasladoDinero.objects.select_related(
            'caja_origen__bodega', 'caja_destino__bodega', 'creado_por'
        )
        if usuario.rol == 'administrador':
            qs = qs.filter(
                Q(caja_origen__bodega=usuario.bodega) |
                Q(caja_destino__bodega=usuario.bodega)
            )
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        usuario = self.request.user

        # ── Re-obtenemos caja_origen y caja_destino con select_for_update() ──
        # Esto bloquea esas filas en la base de datos hasta que termine esta
        # transacción completa. Si llega otra petición de traslado para la
        # MISMA caja mientras esta sigue en curso, esa otra petición tiene
        # que ESPERAR a que esta termine (commit o rollback) antes de poder
        # leer el saldo. Así evitamos que dos traslados simultáneos lean el
        # mismo saldo_actual "viejo" y ambos pasen la validación aunque,
        # juntos, superen el saldo real disponible (race condition).
        #
        # Ordenamos los IDs antes de bloquear para evitar deadlocks: si dos
        # traslados cruzados (A→B y B→A) bloquearan en orden distinto,
        # podrían quedar esperándose mutuamente para siempre. Bloqueando
        # siempre en el mismo orden (el ID menor primero), eso no puede pasar.
        caja_origen_id = serializer.validated_data.get('caja_origen').id
        caja_destino_id = serializer.validated_data.get('caja_destino').id

        ids_ordenados = sorted([caja_origen_id, caja_destino_id])
        cajas_bloqueadas = {
            c.id: c for c in
            Caja.objects.select_for_update().filter(id__in=ids_ordenados)
        }
        caja_origen = cajas_bloqueadas[caja_origen_id]
        caja_destino = cajas_bloqueadas[caja_destino_id]
        valor = serializer.validated_data.get('valor')

        if usuario.rol == 'administrador' and caja_origen.bodega != usuario.bodega:
            raise PermissionDenied('Solo puedes trasladar dinero desde tu propia caja.')
        if caja_origen.id == caja_destino.id:
            raise ValidationError('La caja origen y destino no pueden ser la misma.')
        if not caja_origen.abierta:
            raise ValidationError('La caja origen está cerrada.')
        if valor > caja_origen.saldo_actual:
            raise ValidationError(
                f'Saldo insuficiente. Disponible: ${caja_origen.saldo_actual:,.0f}'
            )

        traslado = serializer.save(creado_por=usuario)

        desc = (f'Traslado #{traslado.id} — '
                f'{caja_origen.bodega.nombre} → {caja_destino.bodega.nombre}')

        MovimientoCaja.objects.create(
            caja=caja_origen, tipo='egreso',
            valor=valor, descripcion=desc, creado_por=usuario,
        )
        MovimientoCaja.objects.create(
            caja=caja_destino, tipo='ingreso',
            valor=valor, descripcion=desc, creado_por=usuario,
        )