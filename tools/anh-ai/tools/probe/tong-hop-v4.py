# tong-hop-v4.py - bang so sanh probe v3 vs v4 (12 muc thu lai). python tong-hop-v4.py <thu-muc-probe> <ra.jpg> [o] [thu-muc-v4]
import sys, os, json
from PIL import Image, ImageDraw, ImageFont
goc, ra = sys.argv[1], sys.argv[2]
O = int(sys.argv[3]) if len(sys.argv) > 3 else 200
V4 = sys.argv[4] if len(sys.argv) > 4 else 'base20-v4-nen'
VM = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'prompts', 'probe')   # PATHS: noi chua probe-items-*.json
items = json.load(open(os.path.join(VM, 'probe-items-v4.json'), encoding='utf-8'))['items']
THEM = {'understand', 'nong', 'ban-ron', 'kho'}
def v3(t):
    return os.path.join(goc, 'base20-them' if t in THEM else 'base20', t + '.png')
HANG = [('v3 (base20)', v3), ('v3b', lambda t: os.path.join(goc, 'base20-v3b', t + '.png')), ('v4 + lam nen', lambda t: os.path.join(goc, V4, t + '.png'))]
if not os.path.isdir(os.path.join(goc, 'base20-v3b')):
    HANG.pop(1)
def font(sz, dam=False):
    for f in (['C:/Windows/Fonts/segoeuib.ttf'] if dam else []) + ['C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf']:
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()
f_nhan, f_nho, f_hang, f_tieu = font(15, True), font(12), font(16, True), font(22, True)
TRAI, DAU, NH = 120, 44, 40
W = TRAI + O * len(items); H = DAU + NH + len(HANG) * (O + 6) + 10
sheet = Image.new('RGB', (W, H), (255, 255, 255)); d = ImageDraw.Draw(sheet)
d.text((10, 8), 'Probe v4 - base 20, CFG 4, seed 11 - da tu nhien + toc, khong the/khung, khong chu hieu ung (nen trang = de thay khung)', fill=(31, 29, 25), font=f_tieu)
y = DAU
for j, it in enumerate(items):
    x = TRAI + j * O
    d.text((x + 3, y), it['ten'][:22], fill=(31, 29, 25), font=f_nhan)
    d.text((x + 3, y + 19), it['nghia'][:28], fill=(110, 90, 70), font=f_nho)
y += NH
for nhan, fn in HANG:
    d.text((6, y + O // 2 - 10), nhan, fill=(31, 29, 25), font=f_hang)
    for j, it in enumerate(items):
        p = fn(it['ten']); x = TRAI + j * O
        if os.path.exists(p):
            sheet.paste(Image.open(p).convert('RGB').resize((O - 6, O - 6), Image.LANCZOS), (x + 3, y + 3))
        else:
            d.rectangle([x + 3, y + 3, x + O - 4, y + O - 4], outline=(180, 60, 60), width=2); d.text((x + 10, y + O // 2), 'thieu', fill=(180, 60, 60), font=f_nhan)
    y += O + 6
sheet.save(ra, quality=90); print(ra, sheet.size)
