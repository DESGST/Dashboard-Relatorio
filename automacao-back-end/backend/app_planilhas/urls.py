from django.urls import path
from . import views

urlpatterns = [
    path('api/relatorio/', views.relatorio_api, name='relatorio_api'),
    path('api/historico/', views.historico_api, name='historico_api'),
]