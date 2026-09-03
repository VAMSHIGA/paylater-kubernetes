#!/usr/bin/env bash
# Apply mysql-secret and identity-secret to a K3s cluster.
# Usage: ./secrets-apply.sh [secrets.env]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS_FILE="${1:-$SCRIPT_DIR/secrets.env}"
NAMESPACE="${K3S_NAMESPACE:-paylater-dev}"
CONTEXT="${K3S_CONTEXT:-}"

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Missing $SECRETS_FILE — run secrets-export.sh on Kind first, or copy secrets.env.example" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$SECRETS_FILE"

KUBECTL=(kubectl)
if [[ -n "$CONTEXT" ]]; then
  KUBECTL+=(--context "$CONTEXT")
fi

"${KUBECTL[@]}" create namespace "$NAMESPACE" --dry-run=client -o yaml | "${KUBECTL[@]}" apply -f -

"${KUBECTL[@]}" create secret generic mysql-secret \
  --namespace "$NAMESPACE" \
  --from-literal=MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
  --dry-run=client -o yaml | "${KUBECTL[@]}" apply -f -

"${KUBECTL[@]}" create secret generic identity-secret \
  --namespace "$NAMESPACE" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --dry-run=client -o yaml | "${KUBECTL[@]}" apply -f -

echo "Secrets applied to namespace $NAMESPACE (values not printed)"
