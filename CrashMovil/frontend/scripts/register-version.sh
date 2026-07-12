#!/bin/bash
# ============================================================
# register-version.sh — Registra una nueva versión en la API
# después de un build exitoso con EAS.
#
# Uso:
#   ./scripts/register-version.sh <version> [--notes "texto"] [--mandatory]
#
# Ejemplo (ejecutar DESPUÉS de un build exitoso):
#   ./scripts/register-version.sh 1.2.0 --notes "Corrección de errores"
#
# También puede ejecutarse automáticamente con:
#   npm run build:android:register
# ============================================================

set -euo pipefail

API_BASE="${EXPO_PUBLIC_BACKEND_URL:-https://crashmovil-backend.onrender.com}"
VERSION="${1:-}"
NOTES=""
MANDATORY=false

if [ -z "$VERSION" ]; then
  echo "❌ Error: Debes proporcionar la versión"
  echo "   Uso: $0 <version> [--notes 'texto'] [--mandatory]"
  exit 1
fi

shift
while [ $# -gt 0 ]; do
  case "$1" in
    --notes) shift; NOTES="$1" ;;
    --mandatory) MANDATORY=true ;;
    *) echo "❌ Argumento desconocido: $1"; exit 1 ;;
  esac
  shift
done

if [ -z "$NOTES" ]; then
  NOTES="Build ${VERSION} - $(date +%Y-%m-%d)"
fi

echo "🚀 Registrando versión ${VERSION}..."
echo "   📡 API: ${API_BASE}/api/versions"
echo "   📝 Notas: ${NOTES}"
echo "   ⚠️  Obligatoria: ${MANDATORY}"

PAYLOAD=$(cat <<EOF
{
  "version": "${VERSION}",
  "platform": "android",
  "notes": "${NOTES}",
  "mandatory": ${MANDATORY},
  "published": true
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE}/api/versions" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "✅ Versión ${VERSION} registrada exitosamente"
  echo "   🆔 ID: $(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)"
else
  echo "❌ Error al registrar la versión (HTTP ${HTTP_CODE}):"
  echo "   ${BODY}"
  exit 1
fi
