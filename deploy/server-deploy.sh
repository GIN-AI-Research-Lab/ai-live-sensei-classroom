#!/usr/bin/env bash
# server-deploy.sh — chay TREN VPS, trong thu muc app (deploy/ la thu muc con).
# Duoc GitHub Actions goi qua SSH moi khi main co code moi (xem .github/workflows/deploy.yml),
# cung co the chay tay:  bash deploy/server-deploy.sh
#
# Viec lam: pull main -> (setup vendor neu thieu) -> (build CSS neu co node)
#           -> restart service -> health check. Health check that bai thi
#           TU ROLLBACK ve commit truoc va exit 1.
set -euo pipefail

# Ve goc repo duoc goi tu dau (script nam trong deploy/)
cd "$(dirname "$0")/.."

SERVICE="sensei"
HEALTH_URL="http://127.0.0.1:3000/"

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
  echo "!!           Tao bang: cp .env.example .env  roi dien GEMINI_KEY (xem deploy/README.md)."
fi

# --- 5. Restart + health check + rollback -------------------------------------
rollback() {
  echo "!!  [deploy] HEALTH CHECK THAT BAI — rollback ve $PREV ..."
  git reset --hard "$PREV"
  sudo systemctl restart "$SERVICE" || true
  echo "!!  [deploy] Da rollback va restart lai ban cu. Kiem tra: systemctl status $SERVICE"
  exit 1
}

echo "==> [deploy] Restart service $SERVICE..."
sudo systemctl restart "$SERVICE"

echo "==> [deploy] Cho server song (${HEALTH_URL})..."
ok=0
for i in $(seq 1 15); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 1
done

if [ "$ok" -ne 1 ]; then
  rollback
fi

echo "==> [deploy] OK — dang chay commit $NEW"
