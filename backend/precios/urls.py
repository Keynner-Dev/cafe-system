from rest_framework.routers import DefaultRouter
from .views import PrecioDiarioViewSet

router = DefaultRouter()
router.register(r'precio-diario', PrecioDiarioViewSet)

urlpatterns = router.urls