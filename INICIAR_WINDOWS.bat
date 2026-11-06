@echo off
cd /d "%~dp0"
node --version
if errorlevel 1 (
 echo Instala Node.js 24.x y vuelve a intentarlo.
 pause
 exit /b 1
)
node dist/src/server.js
pause
