@echo off
echo ==========================================
echo Iniciando o Servidor do Dashboard CET...
echo ==========================================

echo Mudando para a pasta atual...
cd /d "%~dp0"

echo 1. Ativando o ambiente virtual...
call venv\Scripts\activate.bat

echo 2. Ligando a API na rede...
python manage.py runserver 0.0.0.0:8000

pause