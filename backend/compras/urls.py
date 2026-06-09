from rest_framework.routers import DefaultRouter
from .views import CompraViewSet, LiquidacionDepositoViewSet

router = DefaultRouter()
router.register(r'compras', CompraViewSet, basename='compras')
router.register(r'liquidaciones', LiquidacionDepositoViewSet)

urlpatterns = router.urls