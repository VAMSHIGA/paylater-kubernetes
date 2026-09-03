#!/usr/bin/env bash
# Export required secrets from Kind cluster to a local gitignored file.
# Preserves JWT secret so authentication continues working after migration.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${1:-$SCRIPT_DIR/secrets.env}"
NAMESPACE="${KIND_NAMESPACE:-paylater-dev}"
CONTEXT="${KIND_CONTEXT:-kind-cluster-2}"

MYSQL_PW="$(kubectl --context "$CONTEXT" get secret mysql-secret -n "$NAMESPACE" \
  -o jsonpath='{.data.MYSQL_ROOT_PASSWORD}' | base64 -d)"
JWT_SECRET="$(kubectl --context "$CONTEXT" get secret identity-secret -n "$NAMESPACE" \
  -o jsonpath='{.data.JWT_SECRET}' | base64 -d)"

umask 077
cat > "$OUTPUT_FILE" <<EOF
# Exported from Kind cluster — DO NOT COMMIT
MYSQL_ROOT_PASSWORD=${MYSQL_PW}
JWT_SECRET=${JWT_SECRET}
EOF

echo "Secrets exported to $OUTPUT_FILE (not printed)"
