import json, os
from PIL import Image
# ---- PATHS (sua o day neu doi cho dat) ----
# R   = goc repo ai-live-sensei-classroom (mac dinh 4 cap tren tep nay; doi bang SENSEI_REPO)
# NV  = thu muc lam viec nhan vat cuc bo ($ANH_AI_WORK/nv): chua refs28/, base/flat/, expr/<thu-muc>/, chon/, chon-flat/
# KHO = tools/anh-ai (de goi vm/lam-nen.py)
_QH = os.path.dirname(os.path.abspath(__file__))
KHO = os.path.abspath(os.path.join(_QH, '..', '..'))
R = (os.environ.get('SENSEI_REPO') or os.path.abspath(os.path.join(KHO, '..', '..'))).replace(chr(92), '/').rstrip('/') + '/'
NV = os.path.join(os.environ.get('ANH_AI_WORK') or os.path.join(os.path.expanduser('~'), 'anh-ai-work'), 'nv')
os.makedirs(NV, exist_ok=True); os.chdir(NV)
# ---- het PATHS ----
os.makedirs('refs28', exist_ok=True); os.makedirs('base/flat', exist_ok=True)
d = json.load(open(R + 'curriculum/nhan-vat.json', encoding='utf-8'))['nhanVat']
ids = []
for c in d:
    i = c['id']; ids.append(i)
    p = (R + c['anh']) if c['anh'] else 'base/flat/%s.png' % i
    Image.open(p).convert('RGB').resize((1024, 1024), Image.LANCZOS).save('refs28/%s.png' % i)
json.dump(ids, open('ids28.json', 'w'))
print(len(ids), ' '.join(ids))
