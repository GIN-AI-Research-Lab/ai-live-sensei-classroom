#!/bin/bash
# khoi-dong.sh - (xoa PNG hong truoc) khoi dong viec con dang do: vong chinh neu chua xong, roi cac dot tao lai. In ten viec da khoi dong (hoac rong).
bash ~/kiem-png.sh 1>&2
if ! pgrep -f 'chay-full[.]sh' >/dev/null && ! grep -q TAT_CA_XONG ~/anh/run-full.log 2>/dev/null; then
  touch ~/p/DI; nohup ~/chay-full.sh > ~/chay-full.out 2>&1 < /dev/null & echo CHAY_CHINH
elif grep -q TAT_CA_XONG ~/anh/run-full.log && ! pgrep -f 'chay-tao-lai[.]sh' >/dev/null && ls ~/p/tl/dot-*.json >/dev/null 2>&1 && [ $(ls ~/p/tl/dot-*.json | wc -l) -gt $(ls ~/p/tl/dot-*.xong 2>/dev/null | wc -l) ]; then
  nohup ~/chay-tao-lai.sh > ~/chay-tao-lai.out 2>&1 < /dev/null & echo CHAY_TAO_LAI
fi
