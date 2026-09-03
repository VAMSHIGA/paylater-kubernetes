#!/usr/bin/env bash
# Verify migration blocker fixes without starting EC2/K3s.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=image-versions.env
source "$SCRIPT_DIR/image-versions.env"

PASS=0
FAIL=0

check() {
  local name="$1" result="$2"
  if [[ "$result" == "ok" ]]; then
    echo "PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $name — $result"
    FAIL=$((FAIL + 1))
  fi
}

# 1. No imagePullPolicy: Never in PayLater deployments
set +o pipefail
never_count=$(grep -r "imagePullPolicy: Never" "$REPO_ROOT/paylater-frontend" "$REPO_ROOT/paylater-chart" 2>/dev/null | wc -l | tr -d '[:space:]')
set -o pipefail
check "No imagePullPolicy Never" "$([[ "$never_count" -eq 0 ]] && echo ok || echo "found $never_count")"

# 2. All deployments reference registry + immutable tag
declare -A IMAGE_NAMES=(
  [gateway]=paylater-api-gateway
  [frontend]=paylater-frontend
  [identity]=paylater-identity-service
  [customer]=paylater-customer-service
  [merchant]=paylater-merchant-service
  [transaction]=paylater-transaction-service
  [payback]=paylater-payback-service
  [reporting]=paylater-reporting-service
)
for dep in gateway frontend identity customer merchant transaction payback reporting; do
  image_name="${IMAGE_NAMES[$dep]}"
  if grep -q "galinkivamshi/${image_name}:${IMAGE_TAG}" "$REPO_ROOT/paylater-frontend"/*-deployment.yaml 2>/dev/null; then
    check "Manifest $dep image tag" ok
  else
    check "Manifest $dep image tag" "missing galinkivamshi/${image_name}:${IMAGE_TAG}"
  fi
done

# 3. All 8 images exist in registry
for img in paylater-api-gateway paylater-frontend paylater-identity-service paylater-customer-service \
           paylater-merchant-service paylater-transaction-service paylater-payback-service paylater-reporting-service; do
  if docker manifest inspect "${REGISTRY}/${img}:${IMAGE_TAG}" >/dev/null 2>&1; then
    check "Registry $img" ok
  else
    check "Registry $img" "manifest not found"
  fi
done

# 4. Registry parity with Kind running pods (config digest)
if kubectl config current-context 2>/dev/null | grep -q kind; then
  parity_file="$(mktemp)"
  kubectl get pods -n paylater-dev -o json 2>/dev/null > "$parity_file" || echo '{"items":[]}' > "$parity_file"
  parity_ok=true
  if grep -q MISMATCH <(REGISTRY="$REGISTRY" IMAGE_TAG="$IMAGE_TAG" python3 - "$parity_file" <<'PY'
import json, subprocess, os, sys
with open(sys.argv[1]) as f:
    pods = json.load(f)["items"]
tag = os.environ["IMAGE_TAG"]
reg = os.environ["REGISTRY"]
seen = set()
for p in pods:
    for c in p["status"].get("containerStatuses", []):
        img = c.get("image", "")
        if "paylater" not in img:
            continue
        name = img.split("/")[-1].split(":")[0]
        if name in seen:
            continue
        seen.add(name)
        pod_id = c.get("imageID", "").split(":")[-1]
        m = json.loads(subprocess.check_output(
            ["docker", "manifest", "inspect", f"{reg}/{name}:{tag}"], text=True))
        reg_id = (m.get("config") or {}).get("digest", "").split(":")[-1]
        print("MATCH" if pod_id == reg_id else "MISMATCH", name)
PY
); then
    parity_ok=false
  fi
  rm -f "$parity_file"
  if $parity_ok; then
    check "Registry Kind parity" ok
  else
    check "Registry Kind parity" "digest mismatch"
  fi
else
  check "Registry Kind parity" "skipped (no Kind context)"
fi

# 5. MySQL migration scripts exist
for f in mysql-dump.sh mysql-restore.sh mysql-pvc-k3s.yaml; do
  [[ -f "$SCRIPT_DIR/$f" ]] && check "MySQL $f" ok || check "MySQL $f" "missing"
done

# 6. Secrets scripts exist
for f in secrets-export.sh secrets-apply.sh secrets.env.example; do
  [[ -f "$SCRIPT_DIR/$f" ]] && check "Secrets $f" ok || check "Secrets $f" "missing"
done

# 7. Ingress-nginx install script exists
[[ -f "$SCRIPT_DIR/install-ingress-nginx.sh" ]] && check "ingress-nginx install script" ok || check "ingress-nginx install script" "missing"

# 8. NetworkPolicy still references ingress-nginx namespace
if grep -q 'kubernetes.io/metadata.name: ingress-nginx' "$REPO_ROOT/paylater-frontend/gateway-network-policy.yaml"; then
  check "NetworkPolicy ingress-nginx compatible" ok
else
  check "NetworkPolicy ingress-nginx compatible" "label mismatch"
fi

echo "---"
echo "Results: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]]
