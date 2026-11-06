@echo off
cd /d "%~dp0"
node --version >nul 2>&1
if errorlevel 1 (
  echo Instala Node.js 24.x y vuelve a abrir este archivo.
  pause
  exit /b 1
)
node src/server.js
pause
