#!/bin/bash
# chay-tao-lai.sh - tao lai anh bi gan co: moi dot ~/p/tl/dot-*.json (styleRef ../style-chung.json), seed 22 va 33.
# Ra ~/anh/tao-lai/s22/<cap>/<ten>.png va s33. Xong dot thi tao dot-*.xong. Chay lai an toan.
bash ~/kiem-png.sh >> ~/anh/run-tao-lai.log 2>&1
source ~/venv-qi/bin/activate
# bu anh seed 11 con thieu (anh hong da xoa sau khi bi thu hoi)
cd ~/p
for L in n5 canh n4 n3 n2n1; do
  python ~/gen.py --items ~/p/prompt-$L.json --out ~/anh/full/$L --mode base --steps 20 --cfg 4 --seeds 11 >> ~/anh/run-tao-lai.log 2>&1
done
cd ~/p/tl
for f in ~/p/tl/dot-*.json; do
  [ -f "$f" ] || continue
  [ -f "${f%.json}.xong" ] && continue
  for c in $(python -c "import json,sys;print(' '.join(sorted(set(i['cap'] for i in json.load(open(sys.argv[1]))['items']))))" "$f"); do
    python -c "import json,sys;d=json.load(open(sys.argv[1]));d['items']=[i for i in d['items'] if i['cap']==sys.argv[2]];json.dump(d,open(sys.argv[3],'w'))" "$f" $c ~/p/tl/_tam-$c.json
    for s in 22 33; do
      python ~/gen.py --items ~/p/tl/_tam-$c.json --out ~/anh/tao-lai/s$s/$c --mode base --steps 20 --cfg 4 --seeds $s >> ~/anh/run-tao-lai.log 2>&1
    done
  done
  touch "${f%.json}.xong"; echo "$(date '+%F %T') XONG_DOT $(basename $f)" >> ~/anh/run-tao-lai.log
done
echo "$(date '+%F %T') HET_DOT" >> ~/anh/run-tao-lai.log
