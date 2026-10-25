@echo off
setlocal
cd /d "%~dp0"
call compilar.bat
if errorlevel 1 exit /b 1
call descargar_dependencias.bat
if errorlevel 1 exit /b 1
if not exist build\tests mkdir build\tests
(for /r src\test\java %%f in (*.java) do @echo "%%f") > build\pruebas.txt
javac -encoding UTF-8 --release 17 -Xlint:all -cp "build\classes" -d build\tests @build\pruebas.txt
if errorlevel 1 exit /b 1
java -Djava.awt.headless=true -Dfile.encoding=UTF-8 -cp "build\classes;build\tests;lib\*" co.raizvolt.pruebas.PruebasIntegracion
if errorlevel 1 exit /b 1
java -Djava.awt.headless=true -Dfile.encoding=UTF-8 -cp "build\classes;build\tests;lib\*" co.raizvolt.pruebas.PruebasInterfaz
if errorlevel 1 exit /b 1
echo Todas las pruebas finalizaron correctamente.
pause
