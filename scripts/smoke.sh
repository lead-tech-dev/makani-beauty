#!/usr/bin/env bash
# Smoke test — vérifie qu'un déploiement (local ou staging) répond aux
# endpoints critiques. Sortie 0 = healthy, ≠ 0 = problème détecté.
#
# Usage :
#   scripts/smoke.sh                           # default http://localhost:3004
#   scripts/smoke.sh https://api.staging.com   # cible explicite
#
# Utilisable :
#   - manuellement avant de pousser un changement risqué
#   - dans le workflow deploy-staging.yml après le wait-for-health

set -euo pipefail

BASE_URL="${1:-${BASE_URL:-http://localhost:3004}}"
BASE_URL="${BASE_URL%/}" # strip trailing slash

# Couleurs (skippées en CI sans tty)
if [[ -t 1 ]]; then
  GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; RESET='\033[0m'
else
  GREEN=''; RED=''; YELLOW=''; RESET=''
fi

FAIL=0
check() {
  local label="$1" url="$2" expected="${3:-200}"
  local got
  got=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" || echo "000")
  if [[ "$got" == "$expected" ]]; then
    printf "  ${GREEN}\xe2\x9c\x93${RESET} %-30s [%s]\n" "$label" "$got"
  else
    printf "  ${RED}\xe2\x9c\x97${RESET} %-30s [%s, expected %s]\n" "$label" "$got" "$expected"
    FAIL=1
  fi
}

echo "Smoke test -> $BASE_URL"
echo

# 1. Liveness — must always be 200
check "GET /health"             "$BASE_URL/health"                200

# 2. Public catalogue endpoints — should respond without auth
check "GET /api/products"       "$BASE_URL/api/products"          200
check "GET /api/categories"     "$BASE_URL/api/categories"        200
check "GET /api/brands"         "$BASE_URL/api/brands"            200

# 3. SEO routes — served outside the /api prefix
check "GET /sitemap.xml"        "$BASE_URL/sitemap.xml"           200
check "GET /robots.txt"         "$BASE_URL/robots.txt"            200

# 4. Auth endpoints — should answer with 401/400, not 5xx (proves they're wired up)
check "GET /api/auth/me (401)"  "$BASE_URL/api/auth/me"           401

echo
if [[ $FAIL -eq 0 ]]; then
  printf "${GREEN}All smoke checks passed.${RESET}\n"
  exit 0
else
  printf "${RED}Smoke test failed — see x marks above.${RESET}\n"
  exit 1
fi
