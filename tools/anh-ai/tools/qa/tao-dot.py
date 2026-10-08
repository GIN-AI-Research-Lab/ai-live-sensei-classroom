# tao-dot.py - tao dot tao lai moi (vm/tl/dot-NN.json) tu qa/co-tay.json: cac muc co co ma chua nam trong dot nao.
# promptMoi (neu co) thay prompt goc; them negativeThem (neu co). In ten tep dot moi.
import os, sys, json, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chung import PROMPTS, QD, muc_duy_nhat
TL = os.path.join(PROMPTS, 'tl')
# cau them cho anh bi o/khung ma khong co prompt moi: bo tuong/cua so/phong/phong canh phia sau
KHONG_NEN = ('Show only the people and the one or two key objects of the action, standing on a small soft shadow, '
             'with no walls, no windows, no room, no backdrop and no landscape behind them; the plain cream background stays empty all around.')
KHONG_NEN_VAT = ('Show only the key object or objects, standing on a small soft shadow, with no walls, no windows, no room, no backdrop and no '
                 'landscape behind them; the plain cream background stays empty all around.')
NEG_KHUNG = 'room interior, wall, window frame, backdrop panel, scenery card, framed scene'
tay = json.load(open(os.path.join(QD, 'co-tay.json'), encoding='utf-8'))
da = set()
for f in glob.glob(os.path.join(TL, 'dot-*.json')):
    da |= set(i['cap'] + '/' + i['ten'] for i in json.load(open(f, encoding='utf-8'))['items'])
chi = set(sys.argv[1].split(',')) if len(sys.argv) > 1 else None   # tuy chon: chi cac cap nay
ds = []
for c, t, it in muc_duy_nhat():
    k = c + '/' + t
    if k not in tay or k in da or (chi and c not in chi):
        continue
    e = tay[k]
    pr = e.get('promptMoi') or it['prompt']
    ld = e['lyDo'].lower()
    la_vat = bool((it.get('vat') or e.get('vat')) and not e.get('khongVat'))
    if not e.get('promptMoi') and any(w in ld for w in ('khung', 'tile', 'o vuong', 'tam nen')):
        pr = pr.rstrip() + ' ' + (KHONG_NEN_VAT if la_vat else KHONG_NEN)
    x = dict(cap=c, ten=t, prompt=pr, negative=', '.join(v for v in [it.get('negative', ''), e.get('negativeThem', ''), NEG_KHUNG if (KHONG_NEN in pr or KHONG_NEN_VAT in pr) else ''] if v))
    if la_vat:
        x['vat'] = True
    ds.append(x)
if not ds:
    print('khong co muc moi'); sys.exit(0)
n = len(glob.glob(os.path.join(TL, 'dot-*.json'))) + 1
p = os.path.join(TL, 'dot-%02d.json' % n)
json.dump({'styleRef': '../style-chung.json', 'items': ds}, open(p, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
print(p, len(ds))
