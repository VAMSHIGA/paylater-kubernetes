#!/usr/bin/env bash
# Export exact running images from Kind node and push to registry for parity.
# Uses crane to preserve the config digest Kubernetes reports as imageID.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=image-versions.env
source "$SCRIPT_DIR/image-versions.env"

NODE="${KIND_NODE:-cluster-2-control-plane}"
CRANE="${CRANE_BIN:-/tmp/crane}"
WORKDIR="${TMPDIR:-/tmp}/kind-export-$$"

if [[ ! -x "$CRANE" ]]; then
  echo "Downloading crane to $CRANE..."
  curl -fsSL "https://github.com/google/go-containerregistry/releases/download/v0.20.3/go-containerregistry_Linux_x86_64.tar.gz" \
    | tar -xz -C /tmp crane
fi

declare -A IMAGES=(
  ["docker.io/library/paylater-api-gateway:v3"]="paylater-api-gateway"
  ["docker.io/library/paylater-frontend:latest"]="paylater-frontend"
  ["docker.io/library/paylater-identity-service:latest"]="paylater-identity-service"
  ["docker.io/library/paylater-customer-service:latest"]="paylater-customer-service"
  ["docker.io/library/paylater-merchant-service:latest"]="paylater-merchant-service"
  ["docker.io/library/paylater-transaction-service:latest"]="paylater-transaction-service"
  ["docker.io/library/paylater-payback-service:latest"]="paylater-payback-service"
  ["docker.io/library/paylater-reporting-service:latest"]="paylater-reporting-service"
)

mkdir -p "$WORKDIR"
trap 'rm -rf "$WORKDIR"' EXIT

for src in "${!IMAGES[@]}"; do
  name="${IMAGES[$src]}"
  target="${REGISTRY}/${name}:${IMAGE_TAG}"
  digest="$(docker exec "$NODE" crictl inspecti "$src" | python3 -c "import json,sys; print(json.load(sys.stdin)['status']['id'])")"
  tar="${WORKDIR}/${name}.tar"

  echo "==> Exporting $name ($digest)"
  docker exec "$NODE" ctr -n k8s.io images export - "$digest" > "$tar"
  "$CRANE" push "$tar" "$target"
  echo "Pushed $target"
done

echo "Kind-node images pushed with tag ${IMAGE_TAG}"
