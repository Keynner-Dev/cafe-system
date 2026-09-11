from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    TipoCafeViewSet, BodegaViewSet, MovimientoInventarioViewSet,
    AjusteStockViewSet, trasladar,
)

router = DefaultRouter()
router.register(r'tipos-cafe', TipoCafeViewSet)
router.register(r'bodegas', BodegaViewSet)
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimientoinventario')
router.register(r'ajustes-stock', AjusteStockViewSet, basename='ajustestock')  # ítem 26

urlpatterns = router.urls + [
    path('trasladar/', trasladar),
]