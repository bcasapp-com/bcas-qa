#!/usr/bin/env bash
set -euo pipefail
: "${ALLURE_URL:?}" "${ALLURE_PROJECT:?}" "${ALLURE_USER:?}" "${ALLURE_PASS:?}"
API="$ALLURE_URL/allure-docker-service"

if [ ! -d allure-results ] || [ -z "$(ls -A allure-results)" ]; then
  echo "No hay allure-results, nada que enviar"; exit 0
fi

# Login 
curl -sSf -X POST "$API/login" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$ALLURE_USER\",\"password\":\"$ALLURE_PASS\"}" \
  -c cookies.txt -o /dev/null
CSRF=$(grep csrf_access_token cookies.txt | awk '{print $7}')

# Send all results, one by one, to avoid "413 Request Entity Too Large" error
FILES=()
for f in allure-results/*; do FILES+=(-F "files[]=@$f"); done
curl -sSf -X POST "$API/send-results?project_id=$ALLURE_PROJECT&force_project_creation=true" \
  -b cookies.txt -H "X-CSRF-TOKEN: $CSRF" "${FILES[@]}" -o /dev/null

# Generate report
curl -sSf -G "$API/generate-report" -b cookies.txt -H "X-CSRF-TOKEN: $CSRF" \
  --data-urlencode "project_id=$ALLURE_PROJECT" \
  --data-urlencode "execution_name=${JOB_NAME:-local} #${BUILD_NUMBER:-0}" \
  --data-urlencode "execution_from=${BUILD_URL:-}" \
  --data-urlencode "execution_type=jenkins" -o /dev/null

echo "Reporte: $ALLURE_PUBLIC_URL/allure-docker-service/projects/$ALLURE_PROJECT/reports/latest/index.html"
rm -f cookies.txt