from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Isso avisa o projeto para ler as URLs que acabamos de criar no app_planilhas
    path('', include('app_planilhas.urls')), 
]