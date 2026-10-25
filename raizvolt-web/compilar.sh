#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
java -Dfile.encoding=UTF-8 herramientas/Compilar.java
