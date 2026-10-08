#!/bin/bash
# pull.sh <remote-dir-name-under-~/nv> -> qwen-nv/expr/<name>
. "$(dirname "$0")/vm-lib.sh"
QN=$S/nv   # thu muc lam viec nhan vat cuc bo ($ANH_AI_WORK/nv)
N=$1
T=90 ssh_ "cd ~/nv/$N && tar -cf ../$N.tar *.png"
mkdir -p $QN/expr/$N; scp_len ${V}:nv/$N.tar $QN/expr/ && tar -xf $QN/expr/$N.tar -C $QN/expr/$N && ls $QN/expr/$N | wc -l
