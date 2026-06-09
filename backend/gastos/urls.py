from django.urls import path
from . import views

urlpatterns = [
    path('', views.GastoListCreateView.as_view(), name='gasto-list'),
    path('<int:pk>/', views.GastoDetailView.as_view(), name='gasto-detail'),
]