#!/usr/bin/env bash
# Restore PayLater MySQL dump onto a K3s cluster after MySQL pod is running.
# Usage: ./mysql-restore.sh <dump-file.sql>
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <dump-file.sql>" >&2
  exit 1
fi

DUMP_FILE="$1"
NAMESPACE="${K3S_NAMESPACE:-paylater-dev}"
CONTEXT="${K3S_CONTEXT:-}"

KUBECTL=(kubectl)
if [[ -n "$CONTEXT" ]]; then
  KUBECTL+=(--context "$CONTEXT")
fi

echo "Waiting for MySQL pod in namespace=$NAMESPACE..."
"${KUBECTL[@]}" wait -n "$NAMESPACE" --for=condition=ready pod -l app=mysql --timeout=300s

MYSQL_PW="$("${KUBECTL[@]}" get secret mysql-secret -n "$NAMESPACE" \
  -o jsonpath='{.data.MYSQL_ROOT_PASSWORD}' | base64 -d)"

echo "Restoring from $DUMP_FILE"
"${KUBECTL[@]}" exec -i -n "$NAMESPACE" deploy/mysql -- \
  mysql -uroot -p"$MYSQL_PW" < "$DUMP_FILE"

echo "Restore complete"
