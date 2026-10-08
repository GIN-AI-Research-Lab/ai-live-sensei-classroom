# tao-probe-v5.py - thu style v5: do vat (khong duoc co mat nguoi), canh hay bi o/khung, nguoi (da + toc)
import json, os
# ---- PATHS: chay trong prompts/ cua kho; sua-prompt.py nam o tools/tao-prompt/ ----
KHO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
os.chdir(os.path.join(KHO, 'prompts'))
tep = {f: json.load(open('prompt-%s.json' % f, encoding='utf-8'))['items'] for f in ['n5', 'n3', 'canh', 'n4']}
chung = json.load(open('style-chung.json', encoding='utf-8'))
cu = {x['ten']: x for x in json.load(open('probe/probe-items.json', encoding='utf-8'))['items']}
DS = [('n5', 'but-bi'), ('n5', 'but-chi'), ('n5', 'sach'), ('n5', 'den-dien'), ('n5', 'the'), ('n5', 'tap-chi'), ('n5', 'quyen-vo'),
      ('n5', 'dai-hoc'), ('n5', 'khong-phu-dinh'), ('n5', 'nguoi-kia'), ('n5', 'nhan-vien-ngan-hang'), ('n5', 'tren'),
      ('n5', 'toi'), ('n5', 'ban-ron'), ('n3', 'understand'), ('canh', 'nv-sato'), ('canh', 'canh-gioi-thieu-dong-nghiep-moi'), ('n5', 'dau')]
ds = []
for f, t in DS:
    x = next(i for i in tep[f] if i['ten'] == t)
    ds.append(dict(ten=t, nghia=f, prompt=x['prompt'], negative=x.get('negative', '')))
json.dump({'styleRef': 'style-chung.json', 'items': ds}, open('probe/probe-items-v5.json', 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
print(len(ds))
