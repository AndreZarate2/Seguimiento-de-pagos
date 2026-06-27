@echo off
setlocal
cd /d "%~dp0"
echo Plataforma de pagos Andre
echo.
echo En esta PC:
echo http://127.0.0.1:8080
echo.
echo Desde tu celular usa la IP IPv4 de tu WiFi con el puerto 8080.
echo Ejemplo: http://192.168.1.20:8080
echo.
ipconfig | findstr /i "IPv4"
echo.
echo Abriendo en esta PC...
start "" "http://127.0.0.1:8080"
py -m http.server 8080 --bind 0.0.0.0
if errorlevel 1 (
  python -m http.server 8080 --bind 0.0.0.0
)
