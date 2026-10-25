#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
java -Dfile.encoding=UTF-8 -cp "build/test-classes:dist/raizvolt-web.jar:lib/*" co.raizvolt.pruebas.PruebasIntegracion
java -Dfile.encoding=UTF-8 -cp "build/test-classes:dist/raizvolt-web.jar:lib/*" co.raizvolt.pruebas.PruebasWeb
