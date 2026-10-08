#!/bin/bash
# chay-full.sh - sinh tat ca anh duy nhat (moi tep, moi ten 1 lan), base 20 buoc, CFG 4, seed 11.
# Thu tu: n5 -> canh -> n4 -> n3 -> n2n1. Chay lai an toan: anh da co thi bo qua (gen.py).
# Sau khi VM spot bi thu hoi: bat lai VM roi chay lai script nay (nohup).
# Chi chay khi co tep ~/p/DI (tam dung de thu style moi).
while [ ! -f ~/p/DI ]; do sleep 20; done
source ~/venv-qi/bin/activate; cd ~/p
echo "$(date '+%F %T') BAT_DAU lan chay" >> ~/anh/run-full.log
for L in n5 canh n4 n3 n2n1; do
  python ~/gen.py --items ~/p/prompt-$L.json --out ~/anh/full/$L --mode base --steps 20 --cfg 4 --seeds 11 >> ~/anh/run-full.log 2>&1
  echo "$(date '+%F %T') XONG_TEP $L" >> ~/anh/run-full.log
done
echo "$(date '+%F %T') TAT_CA_XONG" >> ~/anh/run-full.log
