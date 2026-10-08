#!/bin/bash
# xu-ly-tl.sh - lam nen anh tao lai (s22, s33) -> anh/tao-lai-nen/<seed>/<cap>/
# ---- PATHS: Q = thu muc lam viec cuc bo ($ANH_AI_WORK, mac dinh ~/anh-ai-work; chua anh/png, anh/nen, ...); LN = lam-nen.py trong kho ----
KHO=$(cd "$(dirname "$0")/../.." && pwd)
Q=${ANH_AI_WORK:-$HOME/anh-ai-work}
LN=$KHO/vm/lam-nen.py
for s in s22 s33; do for L in n5 canh n4 n3 n2n1; do
  [ -d $Q/anh/tao-lai/$s/$L ] || continue
  mkdir -p $Q/anh/tao-lai-nen/$s
  python $LN $Q/anh/tao-lai/$s/$L $Q/anh/tao-lai-nen/$s/$L --khung --moi >> $Q/anh/tao-lai-nen/$s/$L.log
done; done
