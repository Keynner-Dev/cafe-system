import django_filters
from .models import Compra


class CompraFilter(django_filters.FilterSet):
    """
    Filtros combinables para el endpoint de Compras (ítem 17).

    Uso desde el frontend, todos combinables entre sí vía query params:
      ?caficultor=5
      ?fecha_desde=2026-01-01&fecha_hasta=2026-01-31
      ?bodega=2
      ?tipo_cafe=3

    Nota importante: bodega y tipo_cafe viven en DetalleCompra (no en
    Compra directamente, porque una compra puede tener varias líneas con
    distintas bodegas/tipos). Por eso se filtran vía 'detalles__bodega' y
    'detalles__tipo_cafe'. Esto puede generar registros duplicados si una
    compra tiene varias líneas que matchean el filtro -- por eso el
    queryset base en CompraViewSet.get_queryset() SIEMPRE debe llevar
    .distinct() al final, igual que ya hace el filtro de bodega del
    administrador.
    """

    # Caficultor — ya existía como filtro manual en get_queryset(),
    # se mantiene aquí para que sea combinable con los demás vía
    # DjangoFilterBackend sin duplicar lógica.
    caficultor = django_filters.NumberFilter(field_name='caficultor_id')

    # ── NUEVO: búsqueda de texto parcial por nombre del caficultor.
    # Reemplaza el filtro .includes() que hacía ComprasPage.jsx en el
    # frontend sobre la lista completa -- ahora se hace en SQL, página
    # por página, vía ?buscar=texto ──
    buscar = django_filters.CharFilter(
        field_name='caficultor__nombre', lookup_expr='icontains'
    )

    # Rango de fechas de la compra (no de creación del registro)
    fecha_desde = django_filters.DateFilter(field_name='fecha', lookup_expr='gte')
    fecha_hasta = django_filters.DateFilter(field_name='fecha', lookup_expr='lte')

    # Bodega y tipo de café — viven en los detalles, no en la compra
    bodega = django_filters.NumberFilter(field_name='detalles__bodega_id')
    tipo_cafe = django_filters.NumberFilter(field_name='detalles__tipo_cafe_id')

    class Meta:
        model = Compra
        fields = ['caficultor', 'buscar', 'fecha_desde', 'fecha_hasta', 'bodega', 'tipo_cafe']