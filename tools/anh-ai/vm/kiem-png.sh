#!/bin/bash
# kiem-png.sh - tim va xoa PNG hong (0 byte / khong doc duoc, do VM bi thu hoi luc dang ghi) trong ~/anh/full va ~/anh/tao-lai; bo khoi danh sach da gui
source ~/venv-qi/bin/activate
python - <<'PY'
import os, glob
from PIL import Image
hong = []
for p in glob.glob(os.path.expanduser('~/anh/full/*/*.png')) + glob.glob(os.path.expanduser('~/anh/tao-lai/*/*/*.png')):
    if p.endswith('.tmp.png'):
        os.remove(p); continue
    try:
        with Image.open(p) as im:
            im.load()
    except Exception:
        hong.append(p)
for p in hong:
    os.remove(p)
for ds, goc in [('~/anh/da-gui.txt', '~/anh/full/'), ('~/anh/da-gui-tao-lai.txt', '~/anh/tao-lai/')]:
    ds = os.path.expanduser(ds); goc = os.path.expanduser(goc)
    if os.path.exists(ds):
        bo = set(os.path.relpath(p, goc).replace(os.sep, '/') for p in hong if p.startswith(goc))
        l = [x for x in open(ds).read().split('\n') if x and x not in bo]
        open(ds, 'w').write('\n'.join(l) + '\n')
print('PNG_HONG', len(hong), ' '.join(os.path.basename(p) for p in hong))
PY
