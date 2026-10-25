#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -f dist/raizvolt.jar ]; then
  bash compilar.sh
fi
if [ ! -f lib/h2-2.5.250.jar ]; then
  bash descargar_dependencias.sh
fi
exec java -Dfile.encoding=UTF-8 -cp 'dist/raizvolt.jar:lib/*' co.raizvolt.App
