#!/bin/bash
# chay-v5.sh - probe style v5 (18 muc, seed 11, base 20)
source ~/venv-qi/bin/activate; cd ~/p
python ~/gen.py --items ~/p/probe-items-v5.json --out ~/anh/probe/base20-v5 --mode base --steps 20 --cfg 4 --seeds 11 > ~/anh/run-v5.log 2>&1
echo TAT_CA_XONG >> ~/anh/run-v5.log
