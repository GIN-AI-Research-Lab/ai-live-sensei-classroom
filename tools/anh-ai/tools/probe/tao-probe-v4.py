# tao-probe-v4.py - 12 muc thu lai sau khi sua da/toc, the/khung, chu hieu ung (seed 11, base 20)
import json, os
# ---- PATHS: chay trong prompts/ cua kho; sua-prompt.py nam o tools/tao-prompt/ ----
KHO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
os.chdir(os.path.join(KHO, 'prompts'))
cu = {x['ten']: x for x in json.load(open('probe/probe-items.json', encoding='utf-8'))['items']}
tep = {f: json.load(open(f, encoding='utf-8')) for f in ['prompt-n5.json', 'prompt-n3.json', 'prompt-canh.json']}
chung = json.load(open('style-chung.json', encoding='utf-8'))
def tim(f, ten):
    for x in tep[f]['items']:
        if x['ten'] == ten and not x.get('dungLai'):
            return x
    raise KeyError(ten)
NGHIA = {'toi': 'watashi - toi', 'han-hanh': 'hajimemashite - lan dau', 'dat': 'takai - dat', 're': 'yasui - re',
         'nv-sato': 'Sato', 'nv-miller': 'Miller', 'nv-yamada': 'Yamada', 'canh-san-ga-buoi-sang': 'canh san ga',
         'understand': 'wakaru - hieu', 'nong': 'atsui - nong', 'ban-ron': 'isogashii - ban ron', 'kho': 'muzukashii - kho'}
ds = []
for t in NGHIA:
    if t == 'han-hanh':
        ds.append(dict(ten=t, prompt=cu[t]['prompt'] + ' Only these two people.', negative='crowd, extra people'))
    elif t == 'canh-san-ga-buoi-sang':
        p = cu[t]['prompt'].replace('American man in his late twenties', 'American man in his early thirties').replace(' and a few commuters waiting in line', '')
        ds.append(dict(ten=t, prompt=p.rstrip() + ' ' + chung['canh']['hauTo'], negative='destination boards with writing, station name signs, ' + chung['canh']['negative']))
    else:
        f = 'prompt-canh.json' if t.startswith('nv-') else ('prompt-n3.json' if t == 'understand' else 'prompt-n5.json')
        x = tim(f, t); ds.append(dict(ten=t, prompt=x['prompt'], negative=x.get('negative', '')))
    ds[-1]['nghia'] = NGHIA[t]
json.dump({'styleRef': 'style-chung.json', 'items': ds}, open('probe/probe-items-v4.json', 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
print(len(ds))
