#!/bin/bash
# xu-ly.sh - lam nen cac PNG moi: nen/ (co go khung) va nen-goc/ (khong go khung, de so sanh). Log noi tiep.
# ---- PATHS: Q = thu muc lam viec cuc bo ($ANH_AI_WORK, mac dinh ~/anh-ai-work; chua anh/png, anh/nen, ...); LN = lam-nen.py trong kho ----
KHO=$(cd "$(dirname "$0")/../.." && pwd)
Q=${ANH_AI_WORK:-$HOME/anh-ai-work}
LN=$KHO/vm/lam-nen.py
mkdir -p "$Q/anh/nen" "$Q/anh/nen-goc"
for L in n5 canh n4 n3 n2n1; do
  [ -d $Q/anh/png/$L ] || continue
  python $LN $Q/anh/png/$L $Q/anh/nen/$L --khung --moi >> $Q/anh/nen/$L.log
  python $LN $Q/anh/png/$L $Q/anh/nen-goc/$L --moi >> $Q/anh/nen-goc/$L.log
done
