from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from .models import Tercero
from .serializers import TerceroSerializer


def armar_perfil_tercero(tercero):
    """Construye el diccionario completo de perfil (compras, vales, letras,
    resumen) para un Tercero dado. Se extrajo del TerceroViewSet.perfil()
    original para que tanto el endpoint interno (autenticado, usado por
    administradores/jefe) como el endpoint público del portal caficultor
    (sin autenticación, solo por cédula) compartan exactamente la misma
    lógica de negocio — si algo cambia aquí, cambia para ambos a la vez."""

    from compras.models import Compra
    compras_qs = Compra.objects.filter(caficultor=tercero).prefetch_related('detalles').order_by('-fecha')
    compras = []
    for c in compras_qs:
        compras.append({
            'id': c.id,
            'fecha': c.fecha,
            'total': float(c.total),
            'tiene_deposito_pendiente': c.detalles.filter(es_deposito=True, liquidado=False).exists(),
            'detalles': [
                {
                    'tipo_cafe': d.tipo_cafe.nombre,
                    'kilos': float(d.kilos),
                    'precio_kilo': float(d.precio_kilo) if d.precio_kilo else None,
                    'es_deposito': d.es_deposito,
                    'liquidado': d.liquidado,
                }
                for d in c.detalles.all()
            ],
        })

    cuentas = []
    try:
        from cuentas_pagar.models import CuentaPorPagar
        cuentas_qs = CuentaPorPagar.objects.filter(caficultor=tercero).order_by('-creado_en')
        for cp in cuentas_qs:
            cuentas.append({
                'id': cp.id,
                'valor_total': float(cp.valor_total),
                'valor_pagado': float(cp.valor_pagado),
                'saldo': float(cp.saldo),
                'estado': cp.estado,
                'creado_en': cp.creado_en,
            })
    except Exception:
        pass

    letras = []
    try:
        from letras_cambio.models import LetraCambio
        letras_qs = LetraCambio.objects.filter(caficultor=tercero).order_by('-creado_en')
        for l in letras_qs:
            letras.append({
                'id': l.id,
                'valor_total': float(l.valor_total),
                'valor_abonado': float(l.valor_abonado),
                'saldo': float(l.saldo),
                'estado': l.estado,
                'notas': l.notas,
                'creado_en': l.creado_en,
            })
    except Exception:
        pass

    return {
        'tercero': TerceroSerializer(tercero).data,
        'compras': compras,
        'cuentas_por_pagar': cuentas,
        'letras_cambio': letras,
        'resumen': {
            'total_compras': len(compras),
            'total_comprado': sum(c['total'] for c in compras),
            'saldo_vales': sum(c['saldo'] for c in cuentas),
            'saldo_letras': sum(l['saldo'] for l in letras),
        }
    }


class TerceroViewSet(viewsets.ModelViewSet):
    queryset = Tercero.objects.all()
    serializer_class = TerceroSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Para acciones de detalle, siempre devolver todos
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'perfil']:
            return Tercero.objects.all()

        queryset = Tercero.objects.all()

        tipo = self.request.query_params.get('tipo')
        buscar = (
            self.request.query_params.get('search')
            or self.request.query_params.get('buscar')
        )
        todos = self.request.query_params.get('todos')

        if tipo:
            queryset = queryset.filter(tipo__in=[tipo, 'ambos'])

        if buscar:
            queryset = (
                queryset.filter(nombre__icontains=buscar)
                | queryset.filter(cedula__icontains=buscar)
            )
            return queryset.distinct()

        if not todos:
            return Tercero.objects.none()

        return queryset

    @action(detail=True, methods=['get'], url_path='perfil')
    def perfil(self, request, pk=None):
        tercero = self.get_object()
        return Response(armar_perfil_tercero(tercero))


class PortalCaficultorView(APIView):
    """Endpoint público del portal caficultor. No requiere autenticación
    de usuario interno — el caficultor consulta su propia información
    solo con su número de cédula.

    Decisión consciente de producto: no hay segundo factor de verificación
    por ahora (acordado con el cliente). El único control de acceso es el
    rate limiting por IP, que evita enumeración masiva automatizada de
    cédulas pero NO evita que alguien con la cédula correcta de un tercero
    vea su información financiera. Si el cliente lo pide más adelante, se
    puede sumar un segundo dato (ej. últimos 4 dígitos del teléfono
    registrado) sin tener que rediseñar este endpoint."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'portal_caficultor'

    def get(self, request):
        cedula = request.query_params.get('cedula', '').strip()

        if not cedula:
            return Response({'detail': 'Debes ingresar tu número de cédula.'}, status=400)

        tercero = Tercero.objects.filter(
            cedula=cedula,
            activo=True,
            tipo__in=['caficultor', 'ambos'],
        ).first()

        if not tercero:
            # Mensaje genérico a propósito: no confirma ni niega si la
            # cédula existe en el sistema para no facilitar enumeración.
            return Response(
                {'detail': 'No encontramos información con esa cédula. Verifica que esté bien escrita.'},
                status=404,
            )

        return Response(armar_perfil_tercero(tercero))