from django.urls import path
from . import views

urlpatterns = [
    path('', views.GastoListCreateView.as_view(), name='gasto-list'),
    path('resumen/', views.GastoResumenView.as_view(), name='gasto-resumen'),
    path('<int:pk>/', views.GastoDetailView.as_view(), name='gasto-detail'),
]