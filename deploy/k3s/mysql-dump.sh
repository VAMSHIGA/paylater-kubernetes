#!/usr/bin/env bash
# Dump all 6 PayLater databases from the Kind cluster (read-only on source).
# Does NOT delete or modify Kind data.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${1:-$SCRIPT_DIR/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_FILE="$OUTPUT_DIR/paylater-mysql-${TIMESTAMP}.sql"
NAMESPACE="${KIND_NAMESPACE:-paylater-dev}"
CONTEXT="${KIND_CONTEXT:-kind-cluster-2}"

mkdir -p "$OUTPUT_DIR"

echo "Dumping MySQL from context=$CONTEXT namespace=$NAMESPACE"
echo "Output: $DUMP_FILE"

MYSQL_PW="$(kubectl --context "$CONTEXT" get secret mysql-secret -n "$NAMESPACE" \
  -o jsonpath='{.data.MYSQL_ROOT_PASSWORD}' | base64 -d)"

kubectl --context "$CONTEXT" exec -n "$NAMESPACE" deploy/mysql -- \
  mysqldump -uroot -p"$MYSQL_PW" \
  --single-transaction --routines --triggers \
  --databases identity_db customer_db merchant_db transaction_db payback_db report_db \
  > "$DUMP_FILE"

echo "Dump complete ($(wc -c < "$DUMP_FILE") bytes)"
echo "$DUMP_FILE"
