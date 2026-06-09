from django.urls import path
from . import views

urlpatterns = [
    path('', views.CuentaPorPagarListCreateView.as_view(), name='cuentas-pagar-list'),
    path('<int:pk>/', views.CuentaPorPagarDetailView.as_view(), name='cuentas-pagar-detail'),
    path('<int:pk>/abonos/', views.AbonoListCreateView.as_view(), name='abonos-list'),
]