@echo off
cd /d "%~dp0"
node --test tests/api.test.js tests/coleccion.test.js
pause
