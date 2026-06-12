from django.urls import path
from .views import (
    CuentaPorCobrarListCreateView,
    CuentaPorCobrarDetailView,
    AbonoCobranzaListCreateView,
)

urlpatterns = [
    path('',                        CuentaPorCobrarListCreateView.as_view()),
    path('<int:pk>/',               CuentaPorCobrarDetailView.as_view()),
    path('<int:cuenta_id>/abonos/', AbonoCobranzaListCreateView.as_view()),
]