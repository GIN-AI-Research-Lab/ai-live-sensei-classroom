# phong-to.py - xem to hon: python phong-to.py ra.jpg cap/ten ... -> moi muc 3 o [s11|s22|s33] 330px, 2 muc moi hang
import os, sys
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chung import ANH, FONT_DIR
ra, ks = sys.argv[1], sys.argv[2:]
O = 330; W = 2 * (3 * O + 30); f = ImageFont.truetype(FONT_DIR + '/segoeuib.ttf', 16)
R = (len(ks) + 1) // 2
s = Image.new('RGB', (W, R * (O + 26)), 'white'); d = ImageDraw.Draw(s)
for j, k in enumerate(ks):
    c, t = k.split('/'); x = (j % 2) * (3 * O + 30); y = (j // 2) * (O + 26)
    for n, p in enumerate([os.path.join(ANH, 'nen', c, t + '.png'), os.path.join(ANH, 'tao-lai-nen', 's22', c, t + '.png'), os.path.join(ANH, 'tao-lai-nen', 's33', c, t + '.png')]):
        if os.path.exists(p):
            s.paste(Image.open(p).convert('RGB').resize((O - 4, O - 4), Image.LANCZOS), (x + n * O, y))
    d.text((x, y + O - 2), k + '   [s11 | s22 | s33]', fill='black', font=f)
s.save(ra, quality=88); print(s.size)
