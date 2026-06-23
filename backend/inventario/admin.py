from django.contrib import admin
from .models import CostoInventario, TipoCafe, Bodega, MovimientoInventario
admin.site.register(TipoCafe)
admin.site.register(Bodega)
admin.site.register(MovimientoInventario)
admin.site.register(CostoInventario)