# tong-quan.py - to tong quan: mau tat dinh (moi anh thu 13) trong cac anh da duyet (trangThai ok), tu anh/webp. Ra anh/tong-quan.jpg
import os, sys, json
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chung import ANH, FONT_DIR
cm = json.load(open(os.path.join(ANH, 'chi-muc.json'), encoding='utf-8'))['muc']
tep = []
for k, e in cm.items():
    if e['trangThai'] == 'ok' and e['webp'] not in [t for t, _ in tep]:
        tep.append((e['webp'], e['cap'] + '/' + e['ten']))
mau = tep[6::13][:96]
C, O, NH = 12, 200, 20
R = (len(mau) + C - 1) // C
sheet = Image.new('RGB', (C * (O + 6) + 6, 36 + R * (O + NH + 6)), (255, 255, 255)); d = ImageDraw.Draw(sheet)
f = ImageFont.truetype(FONT_DIR + '/segoeui.ttf', 12); fb = ImageFont.truetype(FONT_DIR + '/segoeuib.ttf', 16)
d.text((8, 8), 'Tong quan: %d / %d anh da duyet (moi anh thu 13) - Qwen-Image-2512, base 20 buoc, CFG 4' % (len(mau), len(tep)), fill=(0, 0, 0), font=fb)
for i, (w, k) in enumerate(mau):
    x = 6 + (i % C) * (O + 6); y = 36 + (i // C) * (O + NH + 6)
    sheet.paste(Image.open(os.path.join(ANH, 'webp', w)).convert('RGB').resize((O, O), Image.LANCZOS), (x, y))
    d.text((x, y + O + 2), k[:32], fill=(60, 60, 60), font=f)
sheet.save(os.path.join(ANH, 'tong-quan.jpg'), quality=88)
print(len(mau), sheet.size)
