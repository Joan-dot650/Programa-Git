#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/ejecutable"
echo 'Abre http://localhost:8080/raizvolt/react/index.html'
exec java -jar raizvolt-react.jar
