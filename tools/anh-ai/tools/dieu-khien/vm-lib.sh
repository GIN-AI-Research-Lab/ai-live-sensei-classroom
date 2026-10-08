#!/bin/bash
# vm-lib.sh - ham chung de dieu khien VM A100 spot tu may local (moi lenh gcloud deu boc timeout)
# Dung: . tools/anh-ai/tools/dieu-khien/vm-lib.sh   (cac script giam-sat*, keo-tay, phien-*, pull deu nap tep nay)
# ---- PATHS / CAU HINH (sua o day hoac dat bien moi truong) ----
# KHO  = thu muc tools/anh-ai (2 cap tren tep nay)
# S    = thu muc lam viec cuc bo (anh/png, anh/goi, log/...), mac dinh ~/anh-ai-work, doi bang ANH_AI_WORK
# P    = prompts/ trong kho (prompt-*.json, style-chung.json, tl/dot-*.json)
# VMDIR= vm/ trong kho (script chay tren VM)
# V/ZN = ten VM va zone; H = thu muc goc tren VM cho scp: "." = home cua nguoi dung SSH (pscp/scp hieu duong dan tuong doi, KHONG hieu ~)
# can: gcloud config set project <PROJECT_ID> 
KHO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
S=${ANH_AI_WORK:-$HOME/anh-ai-work}
P=$KHO/prompts; VMDIR=$KHO/vm
V=${VM_NAME:-a100-benchmark-runner}; ZN=${VM_ZONE:-us-central1-a}; Z="--zone $ZN"; H=${VM_HOME:-.}
mkdir -p "$S/log"
SO=$S/log/so-vm.log      # so ghi: BAT/TAT/TRANG_THAI theo thoi gian (de tinh phut VM)
ghi() { echo "$(date '+%F %T') $(date +%s) $*" >> $SO; }
ssh_() { timeout ${T:-120} gcloud compute ssh $V $Z --strict-host-key-checking=no --command "$1" < /dev/null 2>/dev/null; }
scp_len() { timeout ${T:-300} gcloud compute scp --strict-host-key-checking=no "$@" $Z < /dev/null > /dev/null 2>&1; }
trang_thai() { timeout 90 gcloud compute instances describe $V $Z --format='value(status)' 2>/dev/null; }
# bat VM: thu moi ~3 phut, toi da 60 phut. tra 0 neu RUNNING (spot co the het cho: STOCKOUT -> thu lai)
bat() {
  local t0=$(date +%s)
  while true; do
    st=$(trang_thai)
    if [ "$st" = "RUNNING" ]; then ghi "DANG_CHAY_SAN"; return 0; fi
    if [ "$st" = "TERMINATED" ] || [ "$st" = "STOPPED" ]; then
      timeout 300 gcloud compute instances start $V $Z < /dev/null >> $S/log/bat.log 2>&1
    fi
    st=$(trang_thai)
    if [ "$st" = "RUNNING" ]; then ghi "BAT"; return 0; fi
    ghi "BAT_THAT_BAI st=$st"
    [ $(( $(date +%s) - t0 )) -gt 3600 ] && { ghi "BO_CUOC_BAT"; return 1; }
    sleep 180
  done
}
tat() {
  timeout 300 gcloud compute instances stop $V $Z < /dev/null >> $S/log/bat.log 2>&1
  st=$(trang_thai); ghi "TAT st=$st"; echo "$st"
}
