@echo off
setlocal
cd /d "%~dp0"
java -Dfile.encoding=UTF-8 herramientas\DescargarDependencias.java
if errorlevel 1 (
  echo No se pudieron preparar las dependencias. Revisa Java 17 y tu conexion a Internet.
  exit /b 1
)
