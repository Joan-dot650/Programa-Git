@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24.x desde https://nodejs.org/en/download y vuelve a abrir este archivo.
  pause
  exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) === 24 ? 0 : 1)"
if errorlevel 1 (
  echo Este proyecto se entrega para Node.js 24.x. Comprueba tu version con node --version.
  pause
  exit /b 1
)
echo Iniciando servicio. Cuando aparezca Servicio disponible, abre la URL indicada.
node src/server.js
pause

