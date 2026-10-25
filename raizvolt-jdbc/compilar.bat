@echo off
setlocal
cd /d "%~dp0"
where javac >nul 2>&1
if errorlevel 1 (
  echo No se encontro javac. Instala JDK 17 o superior y activa la opcion PATH.
  pause
  exit /b 1
)
if not exist build\classes mkdir build\classes
if not exist dist mkdir dist
(for /r src\main\java %%f in (*.java) do @echo "%%f") > build\fuentes.txt
javac -encoding UTF-8 --release 17 -Xlint:all -d build\classes @build\fuentes.txt
if errorlevel 1 exit /b 1
xcopy /E /I /Y src\main\resources build\classes >nul
if errorlevel 1 exit /b 1
jar --create --file dist\raizvolt.jar --main-class co.raizvolt.App -C build\classes .
if errorlevel 1 exit /b 1
echo Compilacion correcta: dist\raizvolt.jar
