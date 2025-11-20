#!/bin/bash

# Script para ejecutar pruebas evitando conflictos con PostCSS

# Renombrar temporalmente postcss.config.mjs
if [ -f "postcss.config.mjs" ]; then
  mv postcss.config.mjs postcss.config.mjs.bak
fi

# Ejecutar pruebas
./node_modules/.bin/vitest "$@"
exit_code=$?

# Restaurar postcss.config.mjs
if [ -f "postcss.config.mjs.bak" ]; then
  mv postcss.config.mjs.bak postcss.config.mjs
fi

exit $exit_code
