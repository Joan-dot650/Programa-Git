#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
bash compilar.sh
bash descargar_dependencias.sh
mkdir -p build/tests
find src/test/java -name '*.java' | sort > build/pruebas.txt
javac -encoding UTF-8 --release 17 -Xlint:all -cp 'build/classes' -d build/tests @build/pruebas.txt
java -Djava.awt.headless=true -Dfile.encoding=UTF-8 -cp 'build/classes:build/tests:lib/*' co.raizvolt.pruebas.PruebasIntegracion
java -Djava.awt.headless=true -Dfile.encoding=UTF-8 -cp 'build/classes:build/tests:lib/*' co.raizvolt.pruebas.PruebasInterfaz
