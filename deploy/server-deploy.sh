#!/usr/bin/env bash
# server-deploy.sh — chay TREN VPS, trong thu muc app (deploy/ la thu muc con).
# Duoc GitHub Actions goi qua SSH moi khi main co code moi (xem .github/workflows/deploy.yml),
# cung co the chay tay:  bash deploy/server-deploy.sh
#
# Cau hinh that tren VPS (da kiem chung ngay 2026-11-13 — DUNG sua ve gia tri mac dinh cu):
#   thu muc app  /home/ubuntu/sensei   (git clone cua main, nhanh main)
#   web          sensei-web.service    (server.py, 127.0.0.1:3000)
#   proxy        gl-proxy.service      (gl_proxy.py, chay bang ~/sensei/.venv, 127.0.0.1:3001)
#   .env va .venv nam TRONG thu muc app, khong co trong git, script khong bao gio dung vao.
#   Site cong khai: https://sensei.gin.info.vn qua Cloudflare Tunnel.
#
# Viec lam: pull main -> (setup vendor neu thieu) -> (build CSS neu co node)
#           -> restart CHI service nao co code thay doi -> health check ca hai.
#           Health check that bai thi TU ROLLBACK ve commit truoc va exit 1.
# Quy uoc restart nay khop thuc te deploy tay truoc gio: doi chi js/css (PR #5, PR #6)
# thi chi can git pull, khong can restart service nao.
set -euo pipefail

# Ve goc repo duoc goi tu dau (script nam trong deploy/)
cd "$(dirname "$0")/.."

WEB="sensei-web"
PROXY="gl-proxy"
HEALTH_WEB="http://127.0.0.1:3000/"

echo "==> [deploy] Thu muc: $(pwd)"

# --- 0. Ghi lai commit hien tai de rollback ---------------------------------
PREV="$(git rev-parse HEAD)"
echo "==> [deploy] Commit hien tai (rollback point): $PREV"

# --- 1. Cap nhat code tu main -------------------------------------------------
echo "==> [deploy] Pull main..."
git fetch origin main
git checkout main
git pull --ff-only origin main
NEW="$(git rev-parse HEAD)"
echo "==> [deploy] Commit moi: $NEW"

CHANGED="$(git diff --name-only "$PREV" "$NEW" || true)"
echo "==> [deploy] File thay doi:"
echo "$CHANGED" | sed 's/^/    /'

# --- 2. Vendor (tai 1 lan, cac lan sau bo qua) --------------------------------
if [ ! -d vendor ]; then
  echo "==> [deploy] Chua co vendor/ — chay tools/setup_vendor.py..."
  python3 tools/setup_vendor.py
fi

# --- 3. Build CSS (neu VPS co node/npm) ---------------------------------------
# css/tailwind-built.css DA duoc commit san trong repo nen khong co node
# thi site van chay; build lai chi de cap nhat khi class thay doi.
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  echo "==> [deploy] Build CSS (npm run build:css)..."
  if ! npm run build:css; then
    echo "!!  [deploy] CANH BAO: build:css that bai — dung ban CSS da commit trong repo."
  fi
else
  echo "!!  [deploy] CANH BAO: khong co node/npm tren VPS — bo qua build CSS, dung ban da commit."
fi

# --- 4. .env (file rieng tren VPS, KHONG nam trong git, TUYET DOI khong dung vao)
if [ ! -f .env ]; then
  echo "!!  [deploy] CANH BAO: chua co file .env tren VPS — tinh nang Live se khong co API key."
  echo "!!           Tao bang: cp .env.example .env  roi dien GEMINI_KEY1..4 (xem deploy/README.md)."
fi

# --- 5. Chi restart service nao co code thay doi -------------------------------
# Chi doi js/css/html: khong restart gi ca.
# server.py doi -> restart sensei-web. gl_proxy.py doi -> restart gl-proxy.
# File .py khac doi -> restart ca hai cho an toan.
restart_web=0
restart_proxy=0
if echo "$CHANGED" | grep -qE '\.py$'; then
  restart_web=1
  restart_proxy=1
  if [ "$(echo "$CHANGED" | grep -E '\.py$')" = "server.py" ]; then
    restart_proxy=0
  fi
  if [ "$(echo "$CHANGED" | grep -E '\.py$')" = "gl_proxy.py" ]; then
    restart_web=0
  fi
fi

rollback() {
  echo "!!  [deploy] HEALTH CHECK THAT BAI — rollback ve $PREV ..."
  git reset --hard "$PREV"
  if [ "$restart_web" -eq 1 ]; then sudo systemctl restart "$WEB" || true; fi
  if [ "$restart_proxy" -eq 1 ]; then sudo systemctl restart "$PROXY" || true; fi
  echo "!!  [deploy] Da rollback va restart lai ban cu. Kiem tra: systemctl status $WEB $PROXY"
  exit 1
}

if [ "$restart_web" -eq 1 ]; then
  echo "==> [deploy] Restart service $WEB..."
  sudo systemctl restart "$WEB"
fi
if [ "$restart_proxy" -eq 1 ]; then
  echo "==> [deploy] Restart service $PROXY..."
  sudo systemctl restart "$PROXY"
fi
if [ "$restart_web" -eq 0 ] && [ "$restart_proxy" -eq 0 ]; then
  echo "==> [deploy] Khong can restart service (chi doi file tinh)."
fi

# --- 6. Health check ca hai dich vu -------------------------------------------
echo "==> [deploy] Cho web song (${HEALTH_WEB})..."
ok=0
for i in $(seq 1 15); do
  if curl -fsS "$HEALTH_WEB" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 1
done

if [ "$ok" -ne 1 ]; then
  rollback
fi

# Proxy khong co endpoint GET de kiem tra suc khoe (/gl can POST kem key),
# nen chi can no tra ve BATT CU ma HTTP nao (404/405... deu chung to no dang nghe)
# va unit dang active.
proxy_code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://127.0.0.1:3001/" || echo 000)"
if [ "$proxy_code" = "000" ]; then
  echo "!!  [deploy] Khong co gi tra loi o 127.0.0.1:3001."
  rollback
fi
if ! systemctl is-active --quiet "$PROXY"; then
  echo "!!  [deploy] $PROXY khong active."
  rollback
fi
echo "==> [deploy] Proxy tra ma HTTP $proxy_code, unit $PROXY active."

echo "==> [deploy] OK — dang chay commit $NEW"
