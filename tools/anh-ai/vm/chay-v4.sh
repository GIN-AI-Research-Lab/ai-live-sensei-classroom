#!/bin/bash
# chay-v4.sh - probe v4: 12 muc seed 11, base 20 buoc, CFG 4. Tu tat sau 25 phut neu mat lien lac.
sudo shutdown -h +25 "probe v4 het gio" || true
source ~/venv-qi/bin/activate; cd ~/p
python ~/gen.py --items ~/p/probe-items-v4.json --out ~/anh/probe/base20-v4 --mode base --steps 20 --cfg 4 --seeds 11 > ~/anh/run-v4.log 2>&1
echo TAT_CA_XONG >> ~/anh/run-v4.log
