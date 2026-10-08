#!/bin/bash
# chay-tiep.sh - chay lai sau khi VM spot bi thu hoi: v2 (4 anh te) roi base50 con thieu
source ~/venv-qi/bin/activate; cd ~
python gen.py --items probe-items-v2.json --out ~/anh/probe/light8-v2 --mode light --seeds 11,22 > ~/anh/run-v2.log 2>&1
python gen.py --items probe-items.json --out ~/anh/probe/base50 --mode base --steps 50 --cfg 4 --seeds 11 >> ~/anh/run-base.log 2>&1
echo TAT_CA_XONG >> ~/anh/run-base.log
