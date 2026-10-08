#!/bin/bash
# phien-v4.sh - buoc 1: bat VM, day tep, tai base20-v3b (neu co), chay probe v4, tai ve. KHONG tat VM (de chay tiep hang loat neu dat).
. "$(dirname "$0")/vm-lib.sh"
bat || exit 1
echo "$(date '+%T') VM RUNNING"
# cho ssh san sang
for i in $(seq 1 12); do r=$(ssh_ "echo san-sang"); [ "$r" = "san-sang" ] && break; sleep 10; done
echo "$(date '+%T') ssh: $r"
ssh_ "mkdir -p ~/p ~/anh/full"
cd $VMDIR
scp_len gen.py chay-v4.sh chay-full.sh goi-moi.sh $V:$H/ && echo "$(date '+%T') day script ok"
cd $P
scp_len style-chung.json prompt-n5.json prompt-canh.json prompt-n4.json prompt-n3.json prompt-n2n1.json probe/probe-items-v4.json $V:$H/p/ && echo "$(date '+%T') day prompt ok"
ssh_ "chmod +x ~/*.sh; md5sum ~/gen.py ~/p/style-chung.json | cut -c1-12; nohup ~/chay-v4.sh > ~/chay-v4.out 2>&1 < /dev/null & sleep 2; ls ~/anh/probe/"
md5sum $VMDIR/gen.py $P/style-chung.json | cut -c1-12
# tai base20-v3b trong luc cho
mkdir -p $S/probe && (cd $S/probe && scp_len --recurse $V:$H/anh/probe/base20-v3b . ) && echo "$(date '+%T') tai base20-v3b ok: $(ls $S/probe/base20-v3b | wc -l) tep"
for i in $(seq 1 60); do
  r=$(ssh_ "grep -c TAT_CA_XONG ~/anh/run-v4.log; tail -1 ~/anh/run-v4.log")
  echo "$(date '+%T') $(echo $r | tr '\n' ' ')"
  [ "$(echo "$r" | sed -n 1p)" = "1" ] && break
  [ "$(trang_thai)" != "RUNNING" ] && { echo "VM khong con RUNNING"; ghi "MAT_VM"; exit 2; }
  sleep 30
done
(cd $S/probe && T=300 scp_len --recurse $V:$H/anh/probe/base20-v4 . ) && echo "$(date '+%T') tai base20-v4 ok: $(ls $S/probe/base20-v4 | wc -l) tep"
