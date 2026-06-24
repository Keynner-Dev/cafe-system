from django.urls import path
from .views import PortalCaficultorView

# Rutas públicas, SIN autenticación de usuario interno. Separadas a
# propósito de terceros/urls.py (que usa el router del ViewSet protegido)
# para que sea evidente en el código cuál zona es pública y cuál no.
urlpatterns = [
    path('caficultor/', PortalCaficultorView.as_view(), name='portal-caficultor'),
]