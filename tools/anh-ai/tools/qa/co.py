# co.py - ghi co tay vao qa/co-tay.json. Dung: python co.py cap/ten "ly do" ["promptMoi"] ; python co.py --xem cap/ten ; python co.py --bo cap/ten
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chung import muc_duy_nhat
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'co-tay.json')
d = json.load(open(P, encoding='utf-8'))
if sys.argv[1] == '--xem':
    for k in sys.argv[2:]:
        c, t = k.split('/')
        it = next(i for cc, tt, i in muc_duy_nhat() if cc == c and tt == t)
        print(k, '|', it['prompt'], '| vat' if it.get('vat') else '')
    sys.exit()
if sys.argv[1] == '--bo':
    d.pop(sys.argv[2], None)
else:
    k = sys.argv[1]
    assert any(c + '/' + t == k for c, t, _ in muc_duy_nhat()), k
    e = {'lyDo': sys.argv[2]}
    if len(sys.argv) > 3 and sys.argv[3]:
        e['promptMoi'] = sys.argv[3]
    d[k] = e
json.dump(d, open(P, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
print(len(d), 'co')
