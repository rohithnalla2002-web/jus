#!/usr/bin/env sh
# Render / production start (avoids broken dashboard commands like 'npm start`')
cd "$(dirname "$0")"
exec node src/index.js
