# to-tao-lai.py - to so sanh anh tao lai: moi muc 3 o [s11 goc | s22 | s33] (anh da lam nen), 4 muc moi hang, 16 muc moi to.
# Ghi anh/to-tl/tl-NNN.jpg va anh/to-tl/chi-so.json (so thu tu -> cap/ten)
import os, sys, json, glob
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chung import ANH, PROMPTS, QD, FONT_DIR, muc_duy_nhat, nhan
ds = []
for f in sorted(glob.glob(os.path.join(PROMPTS, 'tl', 'dot-*.json'))):
    ds += [i['cap'] + '/' + i['ten'] for i in json.load(open(f, encoding='utf-8'))['items']]
tay = json.load(open(os.path.join(QD, 'co-tay.json'), encoding='utf-8'))
thu_tu = {c + '/' + t: (c, t, it) for c, t, it in muc_duy_nhat()}
ds = [k for k in ds if k in thu_tu]
out = os.path.join(ANH, 'to-tl'); os.makedirs(out, exist_ok=True)
F = lambda f, s: ImageFont.truetype(FONT_DIR + '/' + f, s)
fb, fv, fj = F('segoeuib.ttf', 15), F('segoeui.ttf', 13), F('meiryo.ttc', 13)
O, NH, MPR, RPS = 200, 50, 4, 4
W = MPR * (3 * O + 24) + 10
bang = {}
for s in range(0, len(ds), MPR * RPS):
    so = s // (MPR * RPS) + 1
    sheet = Image.new('RGB', (W, 34 + RPS * (O + NH + 14)), (255, 255, 255)); d = ImageDraw.Draw(sheet)
    d.text((10, 6), 'tl-%03d  tao lai: [s11 goc | s22 | s33] (muc %d-%d / %d)' % (so, s + 1, min(s + 16, len(ds)), len(ds)), fill=(0, 0, 0), font=fb)
    for j, k in enumerate(ds[s:s + MPR * RPS]):
        c, t, it = thu_tu[k]; idx = s + j + 1; bang[idx] = k
        x = 10 + (j % MPR) * (3 * O + 24); y = 34 + (j // MPR) * (O + NH + 14)
        for n, src in enumerate([os.path.join(ANH, 'nen', c, t + '.png'), os.path.join(ANH, 'tao-lai-nen', 's22', c, t + '.png'), os.path.join(ANH, 'tao-lai-nen', 's33', c, t + '.png')]):
            xx = x + n * (O + 4)
            if os.path.exists(src):
                sheet.paste(Image.open(src).convert('RGB').resize((O, O), Image.LANCZOS), (xx, y))
            else:
                d.rectangle([xx, y, xx + O, y + O], outline=(200, 0, 0), width=2); d.text((xx + 8, y + O // 2), 'THIEU', fill=(200, 0, 0), font=fb)
            d.text((xx + 3, y + 2), ['s11', 's22', 's33'][n], fill=(160, 40, 40), font=fb)
        d.text((x, y + O + 2), ('%d %s' % (idx, k))[:60], fill=(0, 0, 0), font=fb)
        w, ng = nhan(it)
        d.text((x, y + O + 20), ((ng or '') + ' | ' + tay.get(k, {}).get('lyDo', ''))[:95], fill=(120, 60, 20), font=fv)
    sheet.save(os.path.join(out, 'tl-%03d.jpg' % so), quality=85)
json.dump(bang, open(os.path.join(out, 'chi-so.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('so to', (len(ds) + 15) // 16, 'so muc', len(ds))
