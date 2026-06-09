from django.urls import path
from .views import LoginView, LogoutView, MeView, UsuarioListCreateView, UsuarioDetailView

urlpatterns = [
    path('auth/login/',   LoginView.as_view(),  name='login'),
    path('auth/logout/',  LogoutView.as_view(),  name='logout'),
    path('auth/me/',      MeView.as_view(),      name='me'),
    path('usuarios/',     UsuarioListCreateView.as_view(), name='usuarios-list'),
    path('usuarios/<int:pk>/', UsuarioDetailView.as_view(), name='usuarios-detail'),
]