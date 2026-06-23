from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Tercero
from .serializers import TerceroSerializer


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

        return Response({
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
        })