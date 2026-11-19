#!/usr/bin/env bash
set -euo pipefail
: "${ALLURE_URL:?}" "${ALLURE_PUBLIC_URL:?}" "${ALLURE_PROJECT:?}" "${ALLURE_USER:?}" "${ALLURE_PASS:?}"
API="$ALLURE_URL/allure-docker-service"
BATCH_SIZE=20

if [ ! -d allure-results ] || [ -z "$(ls -A allure-results)" ]; then
  echo "No hay allure-results, nada que enviar"; exit 0
fi

# Borrar cookies siempre al salir, aunque falle algo
trap 'rm -f cookies.txt' EXIT

# Login
curl -sSf -X POST "$API/login" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$ALLURE_USER\",\"password\":\"$ALLURE_PASS\"}" \
  -c cookies.txt -o /dev/null
CSRF=$(grep csrf_access_token cookies.txt | awk '{print $7}')

# Enviar resultados en tandas de $BATCH_SIZE archivos (evita el error 413)
send_batch() {
  curl -sSf -X POST "$API/send-results?project_id=$ALLURE_PROJECT&force_project_creation=true" \
    -b cookies.txt -H "X-CSRF-TOKEN: $CSRF" "$@" -o /dev/null
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
curl -sSf -G "$API/generate-report" -b cookies.txt -H "X-CSRF-TOKEN: $CSRF" \
  --data-urlencode "project_id=$ALLURE_PROJECT" \
  --data-urlencode "execution_name=${JOB_NAME:-local} #${BUILD_NUMBER:-0}" \
  --data-urlencode "execution_from=${BUILD_URL:-}" \
  --data-urlencode "execution_type=jenkins" -o /dev/null

echo "Reporte: $ALLURE_PUBLIC_URL/allure-docker-service/projects/$ALLURE_PROJECT/reports/latest/index.html"