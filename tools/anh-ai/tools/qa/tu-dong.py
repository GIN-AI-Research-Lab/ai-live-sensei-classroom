# tu-dong.py - kiem tra tu dong moi anh da lam nen: mo duoc, nen da phang, khong trong (>97% nen), khong vung toi lon, nghi co the/khung
# python tu-dong.py [--chi cap/ten,...]  -> ghi anh/qa-tu-dong.json
import os, sys, json, re
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chung import ANH, muc_duy_nhat
NEN = np.array([240, 235, 225], dtype=np.int16)
# doc log lam-nen: ten -> BO QUA?
bo_qua = {}
for f in os.listdir(os.path.join(ANH, 'nen')):
    if f.endswith('.log'):
        c = f[:-4]
        for l in open(os.path.join(ANH, 'nen', f), encoding='utf-8', errors='replace'):
            m = re.match(r'(\S+)\.png\s', l)
            if m:
                bo_qua[(c, m.group(1))] = ('BO QUA' in l, l.strip())
ra = {}
for c, t, it in muc_duy_nhat():
    k = c + '/' + t
    p = os.path.join(ANH, 'nen', c, t + '.png')
    co = []
    if not os.path.exists(os.path.join(ANH, 'png', c, t + '.png')):
        ra[k] = {'thieu': True, 'co': ['thieu-anh']}; continue
    try:
        im = np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
    except Exception as e:
        ra[k] = {'co': ['khong-mo-duoc: %s' % e]}; continue
    bq = bo_qua.get((c, t))
    if bq and 'GO_KHUNG' in bq[1]:
        co.append('da-go-khung ' + bq[1].split('GO_KHUNG')[-1].strip())
    if bq is None or bq[0]:
        co.append('nen-chua-phang' + (' (%s)' % bq[1].split('nen goc')[-1].strip() if bq else ''))
    dm = np.abs(im - NEN).max(-1)
    tl_nen = float((dm <= 3).mean())
    if tl_nen > 0.97:
        co.append('gan-nhu-trong (%.1f%% nen)' % (tl_nen * 100))
    lum = im @ np.array([299, 587, 114]) / 1000
    toi = ndi.binary_opening(lum < 35, structure=np.ones((9, 9)))
    lb, n = ndi.label(toi)
    lon = float(ndi.sum(np.ones_like(lum), lb, range(1, n + 1)).max() / lum.size) if n else 0.0
    if lon > 0.04:
        co.append('vung-toi-lon (%.1f%%)' % (lon * 100))
    # nghi the/khung: vung sang, gan mau nen nhung khong phai nen da phang, lien thong lon
    sang = (dm > 3) & (dm <= 22) & (lum > 200)
    sang = ndi.binary_opening(sang, structure=np.ones((5, 5)))
    lb, n = ndi.label(sang)
    kl = float(ndi.sum(np.ones_like(lum), lb, range(1, n + 1)).max() / lum.size) if n else 0.0
    if kl > 0.18:
        co.append('nghi-the-khung (vung sang %.0f%%)' % (kl * 100))
    # khung chu nhat: bbox cua phan khong phai nen co >= 3 canh gan nhu lien (the/tranh in co vien thang)
    kn = dm > 6
    kn = ndi.binary_opening(kn, iterations=2)
    ys, xs = np.where(kn)
    canh = 0
    if len(ys):
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        if (y1 - y0) > 200 and (x1 - x0) > 200:
            bands = [kn[y0:y0 + 3, x0:x1 + 1], kn[y1 - 2:y1 + 1, x0:x1 + 1], kn[y0:y1 + 1, x0:x0 + 3], kn[y0:y1 + 1, x1 - 2:x1 + 1]]
            cv = [b.any(axis=0 if b.shape[0] <= 3 else 1).mean() for b in bands]   # tren, duoi, trai, phai
            canh = sum(1 for v in cv if v > 0.75)
            goc = any(cv[i] > 0.9 and cv[j] > 0.9 for i in (0, 1) for j in (2, 3))
            if goc and canh < 3:
                canh = 3
    # o vuong dac: thanh phan khong-nen lon nhat lap day gan het bbox cua no (tranh o vuong/the dan nen)
    lb2, n2 = ndi.label(kn)
    if n2:
        sz2 = ndi.sum(np.ones_like(lum), lb2, range(1, n2 + 1)); i2 = int(np.argmax(sz2)) + 1
        c2 = lb2 == i2; yy, xx = np.where(c2)
        fill = c2.sum() / ((yy.max() - yy.min() + 1) * (xx.max() - xx.min() + 1))
        if fill > 0.9 and sz2.max() / lum.size > 0.15:
            co.append('nghi-o-vuong (lap %.0f%% bbox)' % (fill * 100))
    if canh >= 3:
        co.append('nghi-khung-chu-nhat (%d canh thang)' % canh)
    ra[k] = {'canhThang': canh, 'tiLeNen': round(tl_nen, 3), 'vungToi': round(lon, 3), 'vungSang': round(kl, 3), 'co': co}
json.dump(ra, open(os.path.join(ANH, 'qa-tu-dong.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
n = sum(1 for v in ra.values() if v['co'])
from collections import Counter
print('tong', len(ra), 'co co', n, Counter(x.split(' ')[0] for v in ra.values() for x in v['co']))
