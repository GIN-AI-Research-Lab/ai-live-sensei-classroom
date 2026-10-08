#!/bin/bash
# chay-base.sh - sinh anh goc 11 nhan vat (3 seed, base 20 buoc cfg 4)
source ~/venv-qi/bin/activate; cd ~/nv
python gen.py --items base-items.json --out ~/nv/base --mode base --steps 20 --cfg 4 --seeds 11,22,33 > ~/nv/run-base.log 2>&1
echo TAT_CA_XONG >> ~/nv/run-base.log
