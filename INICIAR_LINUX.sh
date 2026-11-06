#!/bin/sh
cd "$(dirname "$0")" || exit 1
exec node dist/src/server.js
