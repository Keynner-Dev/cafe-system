import re
import django_filters
from django.db.models import Q
from .models import Venta


class VentaFilter(django_filters.FilterSet):

    buscar = django_filters.CharFilter(method='buscar_empresa_o_remision')
    fecha_desde = django_filters.DateFilter(field_name='fecha', lookup_expr='gte')
    fecha_hasta = django_filters.DateFilter(field_name='fecha', lookup_expr='lte')

    def buscar_empresa_o_remision(self, queryset, name, value):
        condiciones = Q(empresa__nombre__icontains=value)

        # Si el texto trae dígitos (ej. "7", "REM-0007", "rem 7"),
        # también intenta matchear por id exacto -- así "7" encuentra
        # tanto empresas que contengan "7" en el nombre COMO la
        # remisión #7, igual que el .includes() de antes hacía sobre
        # ambos campos a la vez.
        digitos = re.sub(r'\D', '', value)
        if digitos:
            condiciones |= Q(id=int(digitos))

        return queryset.filter(condiciones)

    class Meta:
        model = Venta
        fields = ['buscar', 'fecha_desde', 'fecha_hasta']