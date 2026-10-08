# xuat.py - chon anh cuoi (uu tien expr/r* neu co), lam phang nen, xuat webp 512 vao assets/minh-hoa/nv/<id>/<key>.webp
import json, os, glob, shutil, subprocess, sys
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
ids = json.load(open(os.path.join(KHO, 'prompts', 'nhan-vat', 'ids28.json')))
roster = {c['id']: c for c in json.load(open(R + 'curriculum/nhan-vat.json', encoding='utf-8'))['nhanVat']}
KEYS = ['vui', 'hoi', 'gian', 'ngac_nhien', 'hao_hung', 'buon']
os.makedirs('chon', exist_ok=True); os.makedirs('chon-flat', exist_ok=True)
def nguon(i, k):
    for r in sorted(glob.glob('expr/rsel'), reverse=True):
        p = '%s/%s__%s.png' % (r, i, k)
        if os.path.exists(p): return p
    if k == 'hoi': return 'expr/hoi-final/%s__hoi.png' % i
    return 'expr/f1/%s__%s.png' % (i, k)
for i in ids:
    for k in KEYS + ['binh_thuong']:
        shutil.copy(nguon(i, k), 'chon/%s__%s.png' % (i, 'kin' if k == 'binh_thuong' else k))
subprocess.run([sys.executable, os.path.join(KHO, 'vm', 'lam-nen.py'), 'chon', 'chon-flat', '--moi'], check=True, stdout=subprocess.DEVNULL)
chi_muc = {}
for i in ids:
    d = R + 'assets/minh-hoa/nv/%s' % i
    os.makedirs(d, exist_ok=True)
    m = {}
    # binh_thuong = anh goc
    if roster[i]['anh']:
        Image.open(R + roster[i]['anh']).convert('RGB').resize((512, 512), Image.LANCZOS).save(d + '/binh_thuong.webp', 'WEBP', quality=82, method=6)
    else:
        Image.open('base/flat/%s.png' % i).convert('RGB').resize((512, 512), Image.LANCZOS).save(d + '/binh_thuong.webp', 'WEBP', quality=82, method=6)
        Image.open('base/flat/%s.png' % i).convert('RGB').resize((512, 512), Image.LANCZOS).save(R + 'assets/minh-hoa/nv-%s.webp' % i, 'WEBP', quality=82, method=6)
    m['binh_thuong'] = 'assets/minh-hoa/nv/%s/binh_thuong.webp' % i
    for k, fn in [('binh_thuong_kin', 'kin')] + [(k, k) for k in KEYS]:
        Image.open('chon-flat/%s__%s.png' % (i, fn)).convert('RGB').resize((512, 512), Image.LANCZOS).save('%s/%s.webp' % (d, k), 'WEBP', quality=82, method=6)
        m[k] = 'assets/minh-hoa/nv/%s/%s.webp' % (i, k)
    chi_muc[i] = m
json.dump(chi_muc, open(R + 'assets/minh-hoa/nv/chi-muc.json', 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
print('xong', len(chi_muc))
