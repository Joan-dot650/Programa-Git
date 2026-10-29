@echo off
cd /d "%~dp0ejecutable"
echo RaizVolt - catalogo React
echo Abre http://localhost:8080/raizvolt/react/index.html
echo Conserva esta ventana abierta. Para detener: Ctrl+C.
java -jar raizvolt-react.jar
if errorlevel 1 pause
