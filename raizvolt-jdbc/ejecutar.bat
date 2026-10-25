@echo off
setlocal
cd /d "%~dp0"
where java >nul 2>&1
if errorlevel 1 (
  echo No se encontro Java. Instala JDK 17 o superior y vuelve a abrir esta ventana.
  pause
  exit /b 1
)
if not exist "dist\raizvolt.jar" (
  call compilar.bat
  if errorlevel 1 exit /b 1
)
if not exist "lib\h2-2.5.250.jar" (
  call descargar_dependencias.bat
  if errorlevel 1 exit /b 1
)
java -Dfile.encoding=UTF-8 -cp "dist\raizvolt.jar;lib\*" co.raizvolt.App
if errorlevel 1 pause
