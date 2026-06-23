from django.contrib import admin
from .models import Caja, MovimientoCaja, CierreCaja, TrasladoDinero

@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    list_display = ['bodega', 'saldo_actual', 'abierta']
    fields = ['bodega', 'saldo_actual', 'abierta']  # saldo_actual editable

@admin.register(MovimientoCaja)
class MovimientoCajaAdmin(admin.ModelAdmin):
    list_display = ['caja', 'tipo', 'valor', 'descripcion', 'fecha']

@admin.register(CierreCaja)
class CierreCajaAdmin(admin.ModelAdmin):
    list_display = ['caja', 'fecha', 'saldo_teorico', 'saldo_fisico', 'diferencia']

@admin.register(TrasladoDinero)
class TrasladoDineroAdmin(admin.ModelAdmin):
    list_display = ['caja_origen', 'caja_destino', 'valor', 'creado_en']