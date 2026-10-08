# webp-chi-muc.py - tao anh/webp/<ten>.webp (512x512, q82) tu anh da lam nen + anh/chi-muc.json cho moi muc (ke ca dungLai)
# Nguon anh: anh/nen (seed 11) hoac anh/tao-lai-nen/<s22|s33> theo qa.json 'nguon'.
# Ten trung giua cac tep (khac prompt): tep dau tien theo thu tu n5, canh, n4, n3, n2n1 giu <ten>.webp, cac tep sau la <ten>-<cap>.webp
import os, sys, json
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chung import ANH, CAP, doc
qa = json.load(open(os.path.join(ANH, 'qa.json'), encoding='utf-8'))
os.makedirs(os.path.join(ANH, 'webp'), exist_ok=True)
ten_tep, da_dung = {}, set()
for c in CAP:
    for it in doc(c):
        k = (c, it['ten'])
        if k in ten_tep:
            continue
        f = it['ten'] + '.webp'
        if f in da_dung:
            f = '%s-%s.webp' % (it['ten'], c)
        da_dung.add(f); ten_tep[k] = f
chi_muc, dem = {}, {'ok': 0, 'giu-svg': 0}
lam = 0
for c in CAP:
    for it in doc(c):
        k = (c, it['ten']); q = qa['muc'].get(c + '/' + it['ten'], {})
        st = 'giu-svg' if q.get('trangThai') == 'giu-svg' else 'ok'
        ng = q.get('nguon', 's11')
        src = os.path.join(ANH, 'nen', c, it['ten'] + '.png') if ng == 's11' else os.path.join(ANH, 'tao-lai-nen', ng, c, it['ten'] + '.png')
        if st == 'ok' and not os.path.exists(src):
            st = 'giu-svg'
        e = {'ten': it['ten'], 'cap': c, 'webp': ten_tep[k] if st == 'ok' else None, 'trangThai': st}
        if st == 'ok':
            e['nguon'] = ng
        if it.get('dungLai'):
            e['dungLai'] = it['dungLai']
        if it['id'] in chi_muc and chi_muc[it['id']] != e:
            print('ID TRUNG', it['id'])
        chi_muc[it['id']] = e; dem[st] += 1
        dst = os.path.join(ANH, 'webp', ten_tep[k])
        if st == 'ok' and not os.path.exists(dst):
            Image.open(src).convert('RGB').resize((512, 512), Image.LANCZOS).save(dst, 'WEBP', quality=82, method=6); lam += 1
json.dump({'ghiChu': 'id muc -> ten anh, cap (tep prompt), tep webp trong anh/webp/, trangThai ok | giu-svg (giu SVG cu, webp=null)',
           'soMuc': len(chi_muc), 'dem': dem, 'muc': chi_muc},
          open(os.path.join(ANH, 'chi-muc.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('muc', len(chi_muc), dem, 'webp moi', lam, 'tong webp', len(os.listdir(os.path.join(ANH, 'webp'))))
