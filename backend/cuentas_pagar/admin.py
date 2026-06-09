from django.contrib import admin
from .models import CuentaPorPagar, AbonoCuentaPorPagar

@admin.register(CuentaPorPagar)
class CuentaPorPagarAdmin(admin.ModelAdmin):
    list_display = ['caficultor', 'valor_total', 'valor_pagado', 'estado', 'bodega', 'fecha']
    list_filter = ['estado', 'bodega']
    readonly_fields = ['valor_pagado', 'estado']

@admin.register(AbonoCuentaPorPagar)
class AbonoCuentaPorPagarAdmin(admin.ModelAdmin):
    list_display = ['cuenta', 'valor', 'medio_pago', 'fecha', 'creado_por']
    readonly_fields = ['creado_en']