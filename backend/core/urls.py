from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('usuarios.urls')),
    path('api/terceros/', include('terceros.urls')),
    path('api/inventario/', include('inventario.urls')),
    path('api/precios/', include('precios.urls')),
    path('api/compras/', include('compras.urls')),
    path('api/ventas/', include('ventas.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/caja/', include('caja.urls')),
    path('api/gastos/', include('gastos.urls')),
    path('api/cuentas-pagar/', include('cuentas_pagar.urls')),
]