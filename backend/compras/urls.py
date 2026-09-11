from rest_framework.routers import DefaultRouter
from .views import CompraViewSet, LiquidacionDepositoViewSet, SolicitudEliminacionCompraViewSet

router = DefaultRouter()
router.register(r'compras', CompraViewSet, basename='compras')
router.register(r'liquidaciones', LiquidacionDepositoViewSet, basename='liquidaciondeposito')
# ÍTEM 24
router.register(r'solicitudes-eliminacion', SolicitudEliminacionCompraViewSet, basename='solicitudeliminacioncompra')

urlpatterns = router.urls