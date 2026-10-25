#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build/classes dist
find src/main/java -name '*.java' | sort > build/fuentes.txt
javac -encoding UTF-8 --release 17 -Xlint:all -d build/classes @build/fuentes.txt
cp -R src/main/resources/. build/classes/
jar --create --file dist/raizvolt.jar --main-class co.raizvolt.App -C build/classes .
echo "Compilación correcta: dist/raizvolt.jar"
