from rest_framework.routers import DefaultRouter
from .views import TerceroViewSet

router = DefaultRouter()
router.register(r'terceros', TerceroViewSet)

urlpatterns = router.urls