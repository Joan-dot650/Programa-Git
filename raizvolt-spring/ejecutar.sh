#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v java >/dev/null 2>&1; then
  echo 'Instala JDK 17 o superior antes de ejecutar.'
  exit 1
fi
if [ ! -f dist/raizvolt-spring.jar ]; then
  sh compilar.sh
fi
echo 'Abre http://localhost:8080/raizvolt/productos al finalizar el inicio.'
echo 'Para detener la aplicación: Ctrl+C.'
exec java -jar dist/raizvolt-spring.jar
