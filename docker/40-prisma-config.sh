#!/bin/sh
set -eu

escapar() {
  printf '%s' "$1" | sed -e 's/[\\"]/\\&/g'
}

url_api=$(escapar "${PRISMA_API_URL:-}")
versao=$(escapar "${PRISMA_VERSION:-}")
data_lancamento=$(escapar "${PRISMA_RELEASE_DATE:-}")

printf 'window.__PRISMA_CONFIG__ = { urlApi: "%s", versao: "%s", dataLancamento: "%s" };\n' \
  "$url_api" "$versao" "$data_lancamento" \
  > /usr/share/nginx/html/config.js

echo "Prisma: config.js gerado (versão ${PRISMA_VERSION:-sem versão}, API ${PRISMA_API_URL:-padrão do build})"
