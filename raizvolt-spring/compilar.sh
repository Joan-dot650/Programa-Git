#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
sh mvnw -B -ntp clean verify
mkdir -p dist
cp target/raizvolt-spring.jar dist/raizvolt-spring.jar
echo 'Compilación y pruebas completadas.'
