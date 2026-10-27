@echo off
setlocal
cd /d "%~dp0"
where java >nul 2>&1
if errorlevel 1 (
  echo No se encontro Java. Instala JDK 17 o superior y vuelve a intentar.
  pause
  exit /b 1
)
if not exist "dist\raizvolt-spring.jar" (
  echo Falta el ejecutable. Se compilara el proyecto con Maven Wrapper.
  call compilar.bat
  if errorlevel 1 exit /b 1
)
echo Abre http://localhost:8080/raizvolt/productos cuando aparezca Started.
echo Para detener la aplicacion usa Ctrl+C. No cierres esta ventana mientras la usas.
java -jar "dist\raizvolt-spring.jar"
pause
