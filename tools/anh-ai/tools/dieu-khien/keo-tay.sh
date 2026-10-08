#!/bin/bash
# keo-tay.sh - tai tay cac PNG moi tu VM (giong ham keo trong giam-sat.sh). Khong chay cung luc voi keo cua giam-sat.
. "$(dirname "$0")/vm-lib.sh"
mkdir -p $S/anh/png $S/anh/goi
n=$(T=300 ssh_ "~/goi-moi.sh full" | tail -1)
[ -z "$n" ] && { echo "ssh loi"; exit 1; }
[ "$n" = "0" ] && { echo "khong co tep moi"; exit 0; }
f=$S/anh/goi/goi-$(date +%Y%m%d-%H%M%S).tar
T=900 scp_len $V:$H/anh/goi/moi-full.tar "$f" || { echo "scp loi"; rm -f "$f"; exit 1; }
m=$(tar -tf "$f" 2>/dev/null | wc -l)
if [ "$m" = "$n" ]; then
  tar -xf "$f" -C $S/anh/png && ssh_ "~/goi-moi.sh full --xac-nhan" > /dev/null && rm -f "$f"
  echo "$(date '+%F %T') keo tay: $n tep ok (co $(find $S/anh/png -name '*.png' | wc -l))" | tee -a $S/log/giam-sat.log
else echo "tar thieu ($m/$n)"; rm -f "$f"; fi
