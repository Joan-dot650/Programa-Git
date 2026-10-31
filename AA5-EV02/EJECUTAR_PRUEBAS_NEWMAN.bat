@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24 o superior desde https://nodejs.org/en/download
  pause
  exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 24 ? 0 : 1)"
if errorlevel 1 (
  echo Se requiere Node.js 24 o superior. Node.js 26 esta permitido.
  pause
  exit /b 1
)
if not exist node_modules\newman\package.json (
  echo Instalando Newman para ejecutar la coleccion de Postman. Requiere internet.
  call npm.cmd ci --ignore-scripts --no-fund --no-audit
  if errorlevel 1 (
    echo No se pudo instalar Newman. Revisa tu conexion e intenta otra vez.
    pause
    exit /b 1
  )
)
call npm.cmd run test:postman
set "TEST_RESULT=%ERRORLEVEL%"
echo.
echo Resultado guardado en resultados\EJECUCION_LOCAL.json
pause
exit /b %TEST_RESULT%
