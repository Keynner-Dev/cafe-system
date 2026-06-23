from django.urls import path
from .views import (
    LetraCambioListCreateView,
    LetraCambioDetailView,
    AbonoLetraListCreateView,
)

urlpatterns = [
    path('', LetraCambioListCreateView.as_view()),
    path('<int:pk>/', LetraCambioDetailView.as_view()),
    path('<int:letra_id>/abonos/', AbonoLetraListCreateView.as_view()),
]