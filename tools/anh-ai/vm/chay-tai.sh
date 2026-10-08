#!/bin/bash
source ~/venv-qi/bin/activate
python ~/nv/tai-edit.py "$1" > ~/nv/tai-$2.log 2>&1
echo DONE >> ~/nv/tai-$2.log
