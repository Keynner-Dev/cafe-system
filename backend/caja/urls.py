from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CajaViewSet, MovimientoCajaViewSet, TrasladoDineroViewSet, CierreCajaViewSet,
)

router = DefaultRouter()
router.register(r'cajas',            CajaViewSet,           basename='caja')
router.register(r'movimientos',      MovimientoCajaViewSet, basename='movimiento')
router.register(r'traslados',        TrasladoDineroViewSet, basename='traslado-dinero')
router.register(r'historial-cierres', CierreCajaViewSet,    basename='cierre-caja')

urlpatterns = [
    path('', include(router.urls)),
]