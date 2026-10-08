#!/bin/bash
# chay-edit.sh <jobs.json> <outdir> [extra args]
source ~/venv-qi/bin/activate; cd ~/nv
J=$1; O=$2; shift 2
python gen-edit.py --jobs $J --out $O "$@" > $O.log 2>&1
echo TAT_CA_XONG >> $O.log
