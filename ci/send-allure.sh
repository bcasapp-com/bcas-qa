#!/usr/bin/env bash
set -euo pipefail
: "${ALLURE_URL:?}" "${ALLURE_PUBLIC_URL:?}" "${ALLURE_PROJECT:?}" "${ALLURE_USER:?}" "${ALLURE_PASS:?}"
API="$ALLURE_URL/allure-docker-service"
BATCH_SIZE=20

if [ ! -d allure-results ] || [ -z "$(ls -A allure-results)" ]; then
  echo "No hay allure-results, nada que enviar"; exit 0
fi

RESP=$(mktemp)
COOKIES=$(mktemp)
trap 'rm -f "$RESP" "$COOKIES"' EXIT

call() {
  local step="$1"; shift
  local code
  code=$(curl -sS -o "$RESP" -w '%{http_code}' "$@") || { echo "ERROR en '$step': no se pudo conectar a $API"; exit 1; }
  if [ "$code" -ge 400 ]; then
    echo "ERROR en '$step': HTTP $code"
    head -c 500 "$RESP"; echo
    exit 1
  fi
}

LOGIN_BODY=$(node -e 'console.log(JSON.stringify({username: process.env.ALLURE_USER, password: process.env.ALLURE_PASS}))')
call "login" -X POST "$API/login" -H 'Content-Type: application/json' -d "$LOGIN_BODY" -c "$COOKIES"
CSRF=$(awk '$6 == "csrf_access_token" {print $7}' "$COOKIES")
[ -n "$CSRF" ] || { echo "ERROR en 'login': Allure no devolvió la cookie csrf_access_token"; exit 1; }
AUTH=(-b "$COOKIES" -H "X-CSRF-TOKEN: $CSRF")

send_batch() {
  call "send-results" -X POST "$API/send-results?project_id=$ALLURE_PROJECT&force_project_creation=true" \
    "${AUTH[@]}" "$@"
}

FILES=()
TOTAL=0
for f in allure-results/*; do
  FILES+=(-F "files[]=@$f")
  TOTAL=$((TOTAL + 1))
  if [ $(( ${#FILES[@]} / 2 )) -ge "$BATCH_SIZE" ]; then
    send_batch "${FILES[@]}"
    FILES=()
  fi
done
[ ${#FILES[@]} -gt 0 ] && send_batch "${FILES[@]}"
echo "Enviados $TOTAL archivos a Allure"

# Generar reporte
call "generate-report" -G "$API/generate-report" "${AUTH[@]}" \
  --data-urlencode "project_id=$ALLURE_PROJECT" \
  --data-urlencode "execution_name=${JOB_NAME:-local} #${BUILD_NUMBER:-0}" \
  --data-urlencode "execution_from=${BUILD_URL:-}" \
  --data-urlencode "execution_type=jenkins"

echo "Reporte: $ALLURE_PUBLIC_URL/allure-docker-service/projects/$ALLURE_PROJECT/reports/latest/index.html"
