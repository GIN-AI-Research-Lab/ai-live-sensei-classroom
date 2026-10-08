# tong-hop.py - ghep anh probe thanh 1 bang lien (contact sheet) co nhan ten + nghia
# python tong-hop.py <thu-muc-anh> <probe-items.json> <ra.jpg> [o_moi_hang] [co_anh]
import sys, os, json, glob, re
from PIL import Image, ImageDraw, ImageFont

thu_muc, items_p, ra = sys.argv[1], sys.argv[2], sys.argv[3]
cot = int(sys.argv[4]) if len(sys.argv) > 4 else 8
co = int(sys.argv[5]) if len(sys.argv) > 5 else 300
items = json.load(open(items_p, encoding='utf-8'))['items']
nghia = {x['ten']: x['nghia'] for x in items}
thu_tu = [x['ten'] for x in items]

tep = []
for p in sorted(glob.glob(os.path.join(thu_muc, '**', '*.png'), recursive=True)):
    b = os.path.basename(p)[:-4]
    if b.endswith('.tmp'):
        continue
    goc = re.sub(r'-s\d+$', '', b)  # bo hau to seed
    nhom = os.path.relpath(os.path.dirname(p), thu_muc)
    tep.append((nhom, thu_tu.index(goc) if goc in thu_tu else 999, b, goc, p))
tep.sort()

def font(sz):
    for f in ['C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()

f1, f2 = font(17), font(14)
nhan_h = 46
hang = (len(tep) + cot - 1) // cot
W, H = cot * co, hang * (co + nhan_h)
sheet = Image.new('RGB', (W, H), (240, 235, 225))
d = ImageDraw.Draw(sheet)
for i, (nhom, _, b, goc, p) in enumerate(tep):
    x, y = (i % cot) * co, (i // cot) * (co + nhan_h)
    im = Image.open(p).convert('RGB').resize((co - 6, co - 6), Image.LANCZOS)
    sheet.paste(im, (x + 3, y + 3))
    nhan = (nhom + '/' if nhom != '.' else '') + b
    d.text((x + 6, y + co), nhan, fill=(31, 29, 25), font=f1)
    d.text((x + 6, y + co + 22), nghia.get(goc, ''), fill=(110, 90, 70), font=f2)
sheet.save(ra, quality=88)
print(ra, len(tep), sheet.size)
