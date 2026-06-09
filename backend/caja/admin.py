from django.contrib import admin
from .models import Caja, MovimientoCaja

@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    list_display = ['bodega', 'saldo_actual']
    readonly_fields = ['saldo_actual']

@admin.register(MovimientoCaja)
class MovimientoCajaAdmin(admin.ModelAdmin):
    list_display = ['caja', 'tipo', 'valor', 'descripcion', 'creado_por', 'fecha']
    readonly_fields = ['fecha']