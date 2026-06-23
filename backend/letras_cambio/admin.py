from django.contrib import admin
from .models import LetraCambio, AbonoLetra


@admin.register(LetraCambio)
class LetraCambioAdmin(admin.ModelAdmin):
    list_display = ['caficultor', 'valor_total', 'valor_abonado', 'estado', 'bodega', 'fecha_creacion']
    list_filter = ['estado', 'bodega']
    readonly_fields = ['valor_abonado', 'estado']


@admin.register(AbonoLetra)
class AbonoLetraAdmin(admin.ModelAdmin):
    list_display = ['letra', 'valor', 'fecha', 'compra', 'creado_por']
    readonly_fields = ['fecha']