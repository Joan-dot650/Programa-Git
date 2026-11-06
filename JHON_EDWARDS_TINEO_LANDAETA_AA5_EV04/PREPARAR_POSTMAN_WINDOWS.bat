@echo off
chcp 65001 > nul
cd /d "%~dp0API-PROYECTO"
node scripts/preparar-postman.js
pause
