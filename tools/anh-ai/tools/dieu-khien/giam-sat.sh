#!/bin/bash
# giam-sat.sh - buoc 2: giam sat chay hang loat tren VM spot. Moi ~5 phut: kiem tra, gia han hen gio tat +90,
# bat lai + chay lai khi bi thu hoi, tai PNG moi ~40 phut, dung khi xong hoac vuot tran chi phi. LUON tat VM khi thoat.
. "$(dirname "$0")/vm-lib.sh"
GS=$S/log/giam-sat.log; mkdir -p $S/anh/png $S/anh/goi
TONG=${TONG:-1267}; GIA=2.20; TRAN=${TRAN:-30}
T0=${T0:-0}             # epoch bat dau tinh chi phi (toan bo nhiem vu)
say() { echo "$(date '+%F %T') $*" >> $GS; }
tat_het() { say "TAT VM (thoat giam sat)"; st=$(tat); say "sau khi tat: $st"; timeout 90 gcloud compute instances list --format="table(name,status)" >> $GS 2>&1; }
trap tat_het EXIT
chay_lai() { ssh_ "pgrep -f '[c]hay-full.sh' >/dev/null || { nohup ~/chay-full.sh > ~/chay-full.out 2>&1 < /dev/null & sleep 1; echo DA_CHAY_LAI; }"; }
keo() {   # tai goi PNG moi
  n=$(T=300 ssh_ "~/goi-moi.sh" | tail -1)
  [ -z "$n" ] && { say "keo: ssh loi"; return 1; }
  [ "$n" = "0" ] && { say "keo: khong co tep moi"; return 0; }
  f=$S/anh/goi/goi-$(date +%Y%m%d-%H%M%S).tar
  T=900 scp_len $V:$H/anh/goi/moi.tar "$f" || { say "keo: scp loi"; rm -f "$f"; return 1; }
  m=$(tar -tf "$f" 2>/dev/null | wc -l)
  if [ "$m" = "$n" ]; then
    tar -xf "$f" -C $S/anh/png && ssh_ "~/goi-moi.sh --xac-nhan" > /dev/null && rm -f "$f"
    say "keo: $n tep ok -> anh/png (co $(find $S/anh/png -name '*.png' | wc -l))"
  else say "keo: tar thieu ($m/$n), giu lai lan sau"; rm -f "$f"; fi
}
BI_THU_HOI=${BI_THU_HOI:-0}; lan_keo=$(date +%s)
while true; do
  st=$(trang_thai)
  if [ "$st" != "RUNNING" ]; then
    [ -z "$st" ] && { sleep 30; st=$(trang_thai); }
  fi
  if [ "$st" != "RUNNING" ]; then
    ghi "CHET st=$st"; BI_THU_HOI=$((BI_THU_HOI+1)); say "VM $st -> bi thu hoi lan $BI_THU_HOI, bat lai"
    bat || { say "HET 60 PHUT KHONG BAT DUOC -> dung"; echo "BI_THU_HOI=$BI_THU_HOI" >> $GS; exit 3; }
    for i in $(seq 1 12); do [ "$(ssh_ 'echo ok')" = "ok" ] && break; sleep 10; done
    say "chay lai: $(chay_lai)"
  fi
  r=$(ssh_ "sudo shutdown -h +90 >/dev/null 2>&1; grep -c TAT_CA_XONG ~/anh/run-full.log 2>/dev/null; find ~/anh/full -name '*.png' ! -name '*.tmp.png' | wc -l; pgrep -f '[c]hay-full.sh' >/dev/null && echo chay || echo dung; grep -E '\] .*seed=' ~/anh/run-full.log | tail -1")
  if [ -z "$r" ]; then say "ssh khong tra loi"; sleep 60; continue; fi
  ghi "SONG"
  xong=$(echo "$r" | sed -n 1p); co=$(echo "$r" | sed -n 2p); ch=$(echo "$r" | sed -n 3p); cuoi=$(echo "$r" | sed -n 4p)
  ph=$(python "$KHO/tools/dieu-khien/phut-vm.py" $SO $T0)
  du=$(python -c "print('%.2f' % ($ph/60*$GIA + max(0,$TONG-$co)*20.5/3600*$GIA))")
  say "anh $co/$TONG | $ch | xong=$xong | VM ${ph} phut = \$$(python -c "print('%.2f'%($ph/60*$GIA))") | du kien tong \$$du | thu hoi $BI_THU_HOI | $cuoi"
  if python -c "import sys; sys.exit(0 if $du > $TRAN else 1)"; then say "DU KIEN VUOT TRAN \$$TRAN -> keo ve roi dung"; keo; exit 4; fi
  if [ "$xong" = "1" ]; then say "TAT CA XONG -> keo lan cuoi"; keo; keo; say "HOAN_TAT BI_THU_HOI=$BI_THU_HOI"; exit 0; fi
  [ "$ch" = "dung" ] && say "script khong chay -> $(chay_lai)"
  if [ $(( $(date +%s) - lan_keo )) -gt 2400 ]; then keo; lan_keo=$(date +%s); fi
  sleep 300
done
