# to-lien-he.py - to lien he 48 o (8x6): so thu tu + ten + tu tieng Nhat + nghia. python to-lien-he.py [thu-muc-anh=nen] [ra=to] [--ds tep.json]
import os, sys, json
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chung import ANH, FONT_DIR, muc_duy_nhat, nhan
vao = sys.argv[1] if len(sys.argv) > 1 else 'nen'
ra = sys.argv[2] if len(sys.argv) > 2 else 'to'
ds = None
if '--ds' in sys.argv:
    ds = json.load(open(sys.argv[sys.argv.index('--ds') + 1], encoding='utf-8'))  # [ "cap/ten", ...]
chi_to = None
if '--to' in sys.argv:
    chi_to = set(int(x) for x in sys.argv[sys.argv.index('--to') + 1].split(','))
os.makedirs(os.path.join(ANH, ra), exist_ok=True)
def font(f, sz):
    return ImageFont.truetype(FONT_DIR + '/' + f, sz)
fv, fvb, fj = font('segoeui.ttf', 14), font('segoeuib.ttf', 15), font('meiryo.ttc', 14)
C, R, O, NH = 8, 6, 240, 58


def viet(d, xy, txt, f, mau, rong=O):
    # ve chu tron font: ky tu CJK dung Meiryo, con lai dung font Latin; cat theo do rong o
    x, y = xy
    for ch in txt:
        ff = fj if ord(ch) >= 0x2E80 else f
        w = d.textlength(ch, font=ff)
        if x + w > xy[0] + rong - 4:
            break
        d.text((x, y), ch, fill=mau, font=ff); x += w

tat = [(c, t, it) for c, t, it in muc_duy_nhat() if ds is None or (c + '/' + t) in ds]
bang = {}
for s in range(0, len(tat), C * R):
    so = s // (C * R) + 1
    if chi_to and so not in chi_to:
        for j, (c, t, it) in enumerate(tat[s:s + C * R]):
            bang[s + j + 1] = c + '/' + t
        continue
    sheet = Image.new('RGB', (C * (O + 10) + 10, R * (O + NH + 8) + 36), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    d.text((10, 6), '%s-%03d  (anh %d-%d / %d)' % (ra, so, s + 1, min(s + C * R, len(tat)), len(tat)), fill=(0, 0, 0), font=fvb)
    for j, (c, t, it) in enumerate(tat[s:s + C * R]):
        x = 10 + (j % C) * (O + 10); y = 34 + (j // C) * (O + NH + 8)
        p = os.path.join(ANH, vao, c, t + '.png')
        if os.path.exists(p):
            sheet.paste(Image.open(p).convert('RGB').resize((O, O), Image.LANCZOS), (x, y))
        else:
            d.rectangle([x, y, x + O, y + O], outline=(200, 0, 0), width=3); d.text((x + 10, y + O // 2), 'THIEU', fill=(200, 0, 0), font=fvb)
        w, ng = nhan(it)
        idx = s + j + 1
        viet(d, (x, y + O + 1), '%d %s/%s' % (idx, c, t), fvb, (0, 0, 0))
        viet(d, (x, y + O + 19), w or '', fj, (60, 60, 60))
        viet(d, (x, y + O + 38), ng, fv, (120, 60, 20))
        bang[idx] = c + '/' + t
    q = os.path.join(ANH, ra, '%s-%03d.jpg' % (ra, so))
    sheet.save(q, quality=85)
json.dump(bang, open(os.path.join(ANH, ra, 'chi-so.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('so to', (len(tat) + C * R - 1) // (C * R), 'so anh', len(tat))
