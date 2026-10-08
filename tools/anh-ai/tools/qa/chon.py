# chon.py - ghi ket qua tao lai: python chon.py cap/ten=s22 cap/ten=s33 cap/ten=giu-svg[:ghi chu] ...
import sys, os, json
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tao-lai-kq.json')
d = json.load(open(P, encoding='utf-8')) if os.path.exists(P) else {}
for a in sys.argv[1:]:
    k, v = a.split('=', 1)
    ch, _, gc = v.partition(':')
    assert ch in ('s22', 's33', 'giu-svg'), a
    d[k] = {'chon': ch, 'ghiChu': gc} if gc else {'chon': ch}
json.dump(d, open(P, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
print(len(d), 'ket qua')
