# tao-probe-v3.py - 16 muc probe cu (prompt da sua) + 6 muc bieu tuong (dat/re seed 22, hieu, kho, nong, ban-ron)
import json, os, sys
# ---- PATHS: chay trong prompts/ cua kho; sua-prompt.py nam o tools/tao-prompt/ ----
KHO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
os.chdir(os.path.join(KHO, 'prompts'))
sys.path.insert(0, os.path.join(KHO, 'tools', 'tao-prompt'))
import importlib.util
sp = importlib.util.spec_from_file_location('sp', os.path.join(KHO, 'tools', 'tao-prompt', 'sua-prompt.py'))
cu = json.load(open('probe/probe-items.json', encoding='utf-8'))['items']
tep = {f: json.load(open(f, encoding='utf-8')) for f in ['prompt-n5.json', 'prompt-n3.json', 'prompt-canh.json']}
def tim(f, ten):
    for x in tep[f]['items']:
        if x['ten'] == ten and not x.get('dungLai'):
            return x
    raise KeyError(ten)
chung = json.load(open('style-chung.json', encoding='utf-8'))
CANH_T = ' ' + chung['canh']['hauTo']
ds = []
for c in cu:
    t = c['ten']
    if t.startswith('nv-'):
        x = tim('prompt-canh.json', t); ds.append(dict(ten=t, nghia=c['nghia'], prompt=x['prompt'], negative=x['negative']))
    elif t == 'han-hanh':
        ds.append(dict(ten=t, nghia=c['nghia'], prompt=c['prompt'] + ' Only these two people.', negative='crowd, extra people'))
    elif t == 'dai-hoc':
        ds.append(dict(ten=t, nghia=c['nghia'], prompt=c['prompt'], negative='clock face, students'))
    elif t == 'canh-san-ga-buoi-sang':
        p = c['prompt'].replace('American man in his late twenties', 'American man in his early thirties').replace(' and a few commuters waiting in line', '')
        ds.append(dict(ten=t, nghia=c['nghia'], prompt=p.rstrip() + CANH_T, negative='destination boards with writing, station name signs, ' + chung['canh']['negative']))
    else:
        x = tim('prompt-n5.json', t); ds.append(dict(ten=t, nghia=c['nghia'], prompt=x['prompt'], negative=x['negative']))
json.dump({'styleRef': 'style-chung.json', 'items': ds}, open('probe/probe-items-v3.json', 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
them = []
for t, ng in [('dat', 'takai - dat (seed 22)'), ('re', 'yasui - re (seed 22)')]:
    x = tim('prompt-n5.json', t); them.append(dict(ten=t + '-s22', seed=22, nghia=ng, prompt=x['prompt'], negative=x['negative']))
for f, t, ng in [('prompt-n3.json', 'understand', 'wakaru - hieu'), ('prompt-n5.json', 'kho', 'muzukashii - kho'),
                 ('prompt-n5.json', 'nong', 'atsui - nong'), ('prompt-n5.json', 'ban-ron', 'isogashii - ban ron')]:
    x = tim(f, t); them.append(dict(ten=t, nghia=ng, prompt=x['prompt'], negative=x.get('negative', '')))
json.dump({'styleRef': 'style-chung.json', 'items': them}, open('probe/probe-them-v3.json', 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
print(len(ds), len(them))
