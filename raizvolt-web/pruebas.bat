@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where java >nul 2>&1
if errorlevel 1 (
  echo Instala Java JDK 17 o superior y vuelve a abrir esta ventana.
  pause
  exit /b 1
)
java -Dfile.encoding=UTF-8 -cp "build/test-classes;dist/raizvolt-web.jar;lib/*" co.raizvolt.pruebas.PruebasIntegracion
if errorlevel 1 goto fallo
java -Dfile.encoding=UTF-8 -cp "build/test-classes;dist/raizvolt-web.jar;lib/*" co.raizvolt.pruebas.PruebasWeb
if errorlevel 1 goto fallo
pause
exit /b 0
:fallo
echo No se completo la operacion. Revisa el mensaje anterior y la guia.
pause
exit /b 1
