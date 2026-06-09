from django.urls import path
from . import views

urlpatterns = [
    path('', views.CajaListView.as_view(), name='caja-list'),
    path('<int:caja_id>/movimientos/', views.MovimientoCajaListCreateView.as_view(), name='movimientos-list'),
]