@echo off
setlocal
cd /d "%~dp0"
call mvnw.cmd -B -ntp test
set "raizvolt_resultado=%errorlevel%"
pause
exit /b %raizvolt_resultado%
