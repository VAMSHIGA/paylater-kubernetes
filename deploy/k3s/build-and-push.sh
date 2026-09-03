#!/usr/bin/env bash
# Build and push all 8 PayLater images with an immutable tag.
# Requires: docker login (galinkivamshi on Docker Hub)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=image-versions.env
source "$SCRIPT_DIR/image-versions.env"

echo "Building PayLater images: ${REGISTRY}/*:${IMAGE_TAG}"

build_push() {
  local name="$1" context="$2" dockerfile="${3:-Dockerfile}" extra_args="${4:-}"
  local image="${REGISTRY}/${name}:${IMAGE_TAG}"
  echo "==> ${image}"
  # shellcheck disable=SC2086
  docker build -f "$dockerfile" -t "$image" $extra_args "$context"
  docker push "$image"
}

build_push paylater-api-gateway "$REPO_ROOT" "$REPO_ROOT/Dockerfile"
build_push paylater-frontend "$REPO_ROOT/paylater-frontend" "$REPO_ROOT/paylater-frontend/Dockerfile" \
  "--build-arg VITE_API_BASE_URL="
build_push paylater-identity-service "$REPO_ROOT" "$REPO_ROOT/identity-service/Dockerfile"
build_push paylater-customer-service "$REPO_ROOT" "$REPO_ROOT/customer-service/Dockerfile"
build_push paylater-merchant-service "$REPO_ROOT" "$REPO_ROOT/merchant-service/Dockerfile"
build_push paylater-transaction-service "$REPO_ROOT" "$REPO_ROOT/transaction-service/Dockerfile"
build_push paylater-payback-service "$REPO_ROOT" "$REPO_ROOT/payback-service/Dockerfile"
build_push paylater-reporting-service "$REPO_ROOT" "$REPO_ROOT/reporting-service/Dockerfile"

echo "All images pushed with tag ${IMAGE_TAG}"
echo "For Kind parity, run: ./push-kind-images.sh (requires crane at /tmp/crane)"
