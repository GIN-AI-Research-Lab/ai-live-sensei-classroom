#!/bin/bash
# chay-v3c.sh - sau khi bi thu hoi: chay tiep base28 (bo qua anh da co) roi 7 muc v3b. Tu tat sau 12 phut (giu tran chi phi).
sudo shutdown -h +12 "probe v3c het gio (tran 1.5 USD)" || true
source ~/venv-qi/bin/activate; cd ~
python gen.py --items probe-items-v3.json --out ~/anh/probe/base28 --mode base --steps 28 --cfg 4 --seeds 11 >> ~/anh/run-v3.log 2>&1
echo TAT_CA_XONG >> ~/anh/run-v3.log
python gen.py --items probe-items-v3b.json --out ~/anh/probe/base20-v3b --mode base --steps 20 --cfg 4 --seeds 11 > ~/anh/run-v3b.log 2>&1
echo TAT_CA_XONG >> ~/anh/run-v3b.log
