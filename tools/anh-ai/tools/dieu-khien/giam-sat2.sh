#!/bin/bash
# giam-sat2.sh - giam sat VM spot: vong chinh (chay-full.sh) roi cac dot tao lai (chay-tao-lai.sh, ~/p/tl/dot-*.json).
# Moi ~5 phut: gia han hen gio tat +90, bat lai + chay lai khi bi thu hoi (stockout: thu moi 3 phut toi 60 phut),
# tai PNG moi ~40 phut (full -> anh/png, tao-lai -> anh/tao-lai), dung khi vuot tran chi phi.
# Ket thuc khi: vong chinh xong + het dot tao lai + (co ~/p/KET_THUC hoac ranh qua 40 phut). LUON tat VM khi thoat.
. "$(dirname "$0")/vm-lib.sh"
GS=$S/log/giam-sat.log
TONG=${TONG:-1267}; GIA=2.20; TRAN=${TRAN:-30}; T0=${T0:-0}
say() { echo "$(date '+%F %T') $*" >> $GS; }
tat_het() { say "TAT VM (thoat giam-sat2)"; st=$(tat); say "sau khi tat: $st"; timeout 90 gcloud compute instances list --format="table(name,status)" >> $GS 2>&1; }
trap tat_het EXIT
keo1() {  # $1 = thu muc con tren VM (full | tao-lai), $2 = dich local
  mkdir -p "$2" $S/anh/goi
  n=$(T=300 ssh_ "~/goi-moi.sh $1" | tail -1)
  [ -z "$n" ] && { say "keo $1: ssh loi"; return 1; }
  [ "$n" = "0" ] && { say "keo $1: khong co tep moi"; return 0; }
  f=$S/anh/goi/goi-$1-$(date +%Y%m%d-%H%M%S).tar
  T=900 scp_len $V:$H/anh/goi/moi-$1.tar "$f" || { say "keo $1: scp loi"; rm -f "$f"; return 1; }
  m=$(tar -tf "$f" 2>/dev/null | wc -l)
  if [ "$m" = "$n" ]; then
    tar -xf "$f" -C "$2" && ssh_ "~/goi-moi.sh $1 --xac-nhan" > /dev/null && rm -f "$f"
    say "keo $1: $n tep ok (png $(find $S/anh/png -name '*.png' | wc -l), tao-lai $(find $S/anh/tao-lai -name '*.png' 2>/dev/null | wc -l))"
  else say "keo $1: tar thieu ($m/$n)"; rm -f "$f"; fi
}
keo() { keo1 full $S/anh/png; keo1 tao-lai $S/anh/tao-lai; }
BI_THU_HOI=${BI_THU_HOI:-0}; lan_keo=$(date +%s); ranh_tu=0
# chay-full.sh cho ~/p/DI; chay-tao-lai.sh doc ~/p/tl
chay_viec() { ssh_ "bash ~/khoi-dong.sh"; }   # script tren VM (tranh pgrep khop chinh lenh ssh)
while true; do
  st=$(trang_thai); [ -z "$st" ] && { sleep 30; st=$(trang_thai); }
  if [ "$st" != "RUNNING" ]; then
    ghi "CHET st=$st"; BI_THU_HOI=$((BI_THU_HOI+1)); say "VM $st -> bi thu hoi lan $BI_THU_HOI, bat lai"
    bat || { say "HET 60 PHUT KHONG BAT DUOC -> dung"; say "BI_THU_HOI=$BI_THU_HOI"; exit 3; }
    for i in $(seq 1 12); do [ "$(ssh_ 'echo ok')" = "ok" ] && break; sleep 10; done
    say "chay lai: $(chay_viec)"
  fi
  r=$(ssh_ "sudo shutdown -h +90 >/dev/null 2>&1; grep -c TAT_CA_XONG ~/anh/run-full.log 2>/dev/null; find ~/anh/full -name '*.png' ! -name '*.tmp.png' | wc -l; if pgrep -f 'chay-full[.]sh' >/dev/null || pgrep -f 'chay-tao-lai[.]sh' >/dev/null; then echo chay; else echo dung; fi; n=\$(ls ~/p/tl/dot-*.json 2>/dev/null | wc -l); x=\$(ls ~/p/tl/dot-*.xong 2>/dev/null | wc -l); echo \$((n-x)); ls ~/p/tl/*.json 2>/dev/null | grep -c dot- ; [ -f ~/p/KET_THUC ] && echo KT || echo _; grep -hE '\] .*seed=' ~/anh/run-full.log ~/anh/run-tao-lai.log 2>/dev/null | tail -1")
  if [ -z "$r" ]; then say "ssh khong tra loi"; sleep 60; continue; fi
  ghi "SONG"
  xong=$(echo "$r" | sed -n 1p); co=$(echo "$r" | sed -n 2p); ch=$(echo "$r" | sed -n 3p); cho=$(echo "$r" | sed -n 4p); kt=$(echo "$r" | sed -n 6p); cuoi=$(echo "$r" | sed -n 7p)
  ph=$(python "$KHO/tools/dieu-khien/phut-vm.py" $SO $T0)
  tl_con=$(python -c "import json,glob;print(sum(len(json.load(open(f,encoding='utf-8'))['items']) for f in glob.glob(r'$P/tl/dot-*.json')))" 2>/dev/null); tl_con=${tl_con:-0}
  [ "$cho" = "0" ] && tl_con=0
  du=$(python -c "print('%.2f' % ($ph/60*$GIA + (max(0,$TONG-$co)*20.5 + $tl_con*41)/3600*$GIA))")
  say "anh $co/$TONG | $ch | xong=$xong | dot cho $cho | VM ${ph} phut = \$$(python -c "print('%.2f'%($ph/60*$GIA))") | du kien \$$du | thu hoi $BI_THU_HOI | $cuoi"
  if python -c "import sys; sys.exit(0 if $du > $TRAN else 1)"; then say "DU KIEN VUOT TRAN \$$TRAN -> keo ve roi dung"; keo; exit 4; fi
  if [ "$ch" = "dung" ]; then
    v=$(chay_viec)
    if [ -n "$v" ]; then say "khoi dong: $v"; ranh_tu=0
    elif [ "$xong" = "1" ] && [ "$cho" = "0" ]; then
      [ $ranh_tu = 0 ] && { ranh_tu=$(date +%s); say "VONG CHINH + TAO LAI XONG -> keo, cho dot moi hoac KET_THUC"; keo; lan_keo=$(date +%s); }
      if [ "$kt" = "KT" ] || [ $(( $(date +%s) - ranh_tu )) -gt 2400 ]; then say "KET THUC ($kt) -> keo lan cuoi"; keo; keo; say "HOAN_TAT BI_THU_HOI=$BI_THU_HOI"; exit 0; fi
    fi
  fi
  if [ $(( $(date +%s) - lan_keo )) -gt 2400 ]; then keo; lan_keo=$(date +%s); fi
  sleep 300
done
