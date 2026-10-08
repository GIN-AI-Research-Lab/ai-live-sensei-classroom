#!/bin/bash
# chay-v3b.sh - doi chay-v3 xong roi thu lai 7 muc bi "the/khung" voi style sua (base 20 buoc)
source ~/venv-qi/bin/activate; cd ~
until grep -q TAT_CA_XONG ~/anh/run-v3.log; do sleep 10; done
python gen.py --items probe-items-v3b.json --out ~/anh/probe/base20-v3b --mode base --steps 20 --cfg 4 --seeds 11 > ~/anh/run-v3b.log 2>&1
echo TAT_CA_XONG >> ~/anh/run-v3b.log
