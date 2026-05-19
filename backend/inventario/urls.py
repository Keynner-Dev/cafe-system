from rest_framework.routers import DefaultRouter
from .views import TipoCafeViewSet, BodegaViewSet, MovimientoInventarioViewSet

router = DefaultRouter()
router.register(r'tipos-cafe', TipoCafeViewSet)
router.register(r'bodegas', BodegaViewSet)
router.register(r'movimientos', MovimientoInventarioViewSet)

urlpatterns = router.urls