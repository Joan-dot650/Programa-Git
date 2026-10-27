@echo off
setlocal
cd /d "%~dp0"
call mvnw.cmd -B -ntp clean verify
if errorlevel 1 (
  echo La compilacion fallo. Revisa los mensajes anteriores.
  exit /b 1
)
if not exist dist mkdir dist
copy /Y "target\raizvolt-spring.jar" "dist\raizvolt-spring.jar" >nul
echo Compilacion y pruebas completadas.
