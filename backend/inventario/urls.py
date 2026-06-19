from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import TipoCafeViewSet, BodegaViewSet, MovimientoInventarioViewSet, trasladar

router = DefaultRouter()
router.register(r'tipos-cafe', TipoCafeViewSet)
router.register(r'bodegas', BodegaViewSet)
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimientoinventario')

urlpatterns = router.urls + [
    path('trasladar/', trasladar),
]