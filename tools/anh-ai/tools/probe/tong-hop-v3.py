# tong-hop-v3.py - bang so sanh probe v3: 16 muc theo cot, moi hang 1 cau hinh; them 1 hang anh bieu tuong (o lon hon)
# python tong-hop-v3.py <thu-muc-probe> <ra.jpg> [o]
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

goc = sys.argv[1]
ra = sys.argv[2]
O = int(sys.argv[3]) if len(sys.argv) > 3 else 142
VM = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'prompts', 'probe')   # PATHS: noi chua probe-items-*.json
items = json.load(open(os.path.join(VM, 'probe-items-v3.json'), encoding='utf-8'))['items']
them = json.load(open(os.path.join(VM, 'probe-them-v3.json'), encoding='utf-8'))['items']
HANG = [('1. cu base50', 'base50'), ('2. moi base20', 'base20'), ('3. moi base28', 'base28'), ('4. base20 + lam nen', 'base20-nen')]


def font(sz, dam=False):
    for f in (['C:/Windows/Fonts/segoeuib.ttf'] if dam else []) + ['C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf',
                                                                   '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


f_nhan, f_nho, f_hang, f_tieu = font(13, True), font(11), font(15, True), font(20, True)
TRAI, DAU, NH = 118, 40, 34            # cot nhan hang, tieu de, nhan cot
O2 = 370                               # o hang bieu tuong
W = TRAI + O * len(items)
H = DAU + NH + len(HANG) * (O + 4) + 30 + NH + O2 + 40
sheet = Image.new('RGB', (W, H), (240, 235, 225))
d = ImageDraw.Draw(sheet)
d.text((10, 8), 'Probe v3 - Qwen-Image-2512 base, CFG 4, seed 11 - style-chung.json', fill=(31, 29, 25), font=f_tieu)


def o_anh(p, x, y, c):
    if os.path.exists(p):
        sheet.paste(Image.open(p).convert('RGB').resize((c - 4, c - 4), Image.LANCZOS), (x + 2, y + 2))
    else:
        d.rectangle([x + 2, y + 2, x + c - 3, y + c - 3], outline=(180, 60, 60), width=2)
        d.text((x + 8, y + c // 2 - 8), 'thieu', fill=(180, 60, 60), font=f_nhan)


y = DAU
for j, it in enumerate(items):
    x = TRAI + j * O
    d.text((x + 3, y), it['ten'][:20], fill=(31, 29, 25), font=f_nhan)
    d.text((x + 3, y + 16), it['nghia'][:24], fill=(110, 90, 70), font=f_nho)
y += NH
for nhan, thu_muc in HANG:
    d.text((6, y + O // 2 - 10), nhan, fill=(31, 29, 25), font=f_hang)
    for j, it in enumerate(items):
        o_anh(os.path.join(goc, thu_muc, it['ten'] + '.png'), TRAI + j * O, y, O)
    y += O + 4
y += 30
d.text((6, y - 26), '5. bieu tuong manga, base20 (dat/re seed 22; hieu, kho, nong, ban-ron seed 11)', fill=(31, 29, 25), font=f_hang)
for j, it in enumerate(them):
    x = TRAI + j * (O2 + 8)
    d.text((x + 3, y), it['ten'], fill=(31, 29, 25), font=f_nhan)
    d.text((x + 3, y + 16), it['nghia'], fill=(110, 90, 70), font=f_nho)
    o_anh(os.path.join(goc, 'base20-them', it['ten'] + '.png'), x, y + NH, O2)
sheet.save(ra, quality=90)
print(ra, sheet.size)
