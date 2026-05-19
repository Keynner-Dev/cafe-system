from django.contrib import admin
from .models import Compra, DetalleCompra, LiquidacionDeposito
admin.site.register(Compra)
admin.site.register(DetalleCompra)
admin.site.register(LiquidacionDeposito)