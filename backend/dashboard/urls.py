from django.urls import path
from .views import dashboard_data, depositos_pendientes_detalle 

urlpatterns = [
    path('', dashboard_data),
    path('depositos-pendientes/', depositos_pendientes_detalle), 
]