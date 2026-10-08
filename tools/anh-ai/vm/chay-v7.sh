#!/bin/bash
# chay-v7.sh - probe style rieng cho do vat (12 muc, seed 11, base 20)
source ~/venv-qi/bin/activate; cd ~/p
python ~/gen.py --items ~/p/probe-items-v7.json --out ~/anh/probe/base20-v7 --mode base --steps 20 --cfg 4 --seeds 11 > ~/anh/run-v7.log 2>&1
echo TAT_CA_XONG >> ~/anh/run-v7.log
