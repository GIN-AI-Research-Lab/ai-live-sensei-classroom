#!/bin/bash
# chay-v3.sh - probe v3: base 20 buoc (16 muc + 6 muc bieu tuong) roi base 28 buoc (16 muc). Tu tat may sau 35 phut de an toan.
sudo shutdown -h +35 "probe v3 het gio" || true
source ~/venv-qi/bin/activate; cd ~
mkdir -p ~/anh/probe
python gen.py --items probe-items-v3.json --out ~/anh/probe/base20 --mode base --steps 20 --cfg 4 --seeds 11 > ~/anh/run-v3.log 2>&1
python gen.py --items probe-them-v3.json --out ~/anh/probe/base20-them --mode base --steps 20 --cfg 4 --seeds 11 >> ~/anh/run-v3.log 2>&1
python gen.py --items probe-items-v3.json --out ~/anh/probe/base28 --mode base --steps 28 --cfg 4 --seeds 11 >> ~/anh/run-v3.log 2>&1
echo TAT_CA_XONG >> ~/anh/run-v3.log
