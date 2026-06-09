from django.contrib import admin
from .models import Gasto

@admin.register(Gasto)
class GastoAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'categoria', 'descripcion', 'valor', 'medio_pago', 'bodega', 'creado_por']
    list_filter = ['bodega', 'medio_pago', 'fecha']
    search_fields = ['categoria', 'descripcion']