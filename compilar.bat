@echo off
cd /d "%~dp0"
node scripts/compilar.mjs
if errorlevel 1 pause
