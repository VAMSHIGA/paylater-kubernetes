#!/usr/bin/env bash
# Install ingress-nginx on K3s (run AFTER K3s is installed on EC2).
# K3s must be installed with Traefik disabled:
#   curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -
set -euo pipefail

KUBECTL="${KUBECTL:-kubectl}"
if [[ -n "${K3S_CONTEXT:-}" ]]; then
  KUBECTL="kubectl --context ${K3S_CONTEXT}"
fi

echo "Installing ingress-nginx controller..."
$KUBECTL apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/cloud/deploy.yaml

echo "Waiting for ingress-nginx namespace..."
$KUBECTL wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

echo "ingress-nginx ready. PayLater Ingress uses ingressClassName: nginx"
echo "NetworkPolicy paylater-api-gateway-network-policy is compatible (ingress-nginx namespace label exists)"
