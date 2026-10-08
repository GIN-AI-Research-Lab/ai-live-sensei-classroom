# lap-qa.py - gop kiem tra tu dong (anh/qa-tu-dong.json) + co tay (qa/co-tay.json) + ket qua tao lai (qa/tao-lai-kq.json) -> anh/qa.json
# co-tay.json: {"cap/ten": {"lyDo": "...", "promptMoi": "... (tuy chon)"}}
# tao-lai-kq.json: {"cap/ten": {"chon": "s22" | "s33" | "giu-svg", "ghiChu": "..."}}
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chung import ANH, muc_duy_nhat
QD = os.path.dirname(os.path.abspath(__file__))
def doc(p, mac=None):
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else (mac if mac is not None else {})
td = doc(os.path.join(ANH, 'qa-tu-dong.json'))
tay = doc(os.path.join(QD, 'co-tay.json'))
kq = doc(os.path.join(QD, 'tao-lai-kq.json'))
LOI_THAT = ('thieu-anh', 'khong-mo-duoc', 'gan-nhu-trong')
muc, dem = {}, {'ok': 0, 'tao-lai': 0, 'giu-svg': 0, 'ok-sau-tao-lai': 0}
for c, t, it in muc_duy_nhat():
    k = c + '/' + t
    a = td.get(k, {'co': ['chua-kiem-tra']})
    e = {'canhBaoTuDong': a.get('co', [])}
    loi = [x for x in e['canhBaoTuDong'] if x.startswith(LOI_THAT)]
    if k in tay:
        e['co'] = tay[k]['lyDo']
        if tay[k].get('promptMoi'):
            e['promptMoi'] = tay[k]['promptMoi']
    elif loi:
        e['co'] = '; '.join(loi)
    if 'co' in e:
        r = kq.get(k)
        if r is None:
            e['trangThai'] = 'tao-lai'
        elif r['chon'] == 'giu-svg':
            e['trangThai'] = 'giu-svg'
        else:
            e['trangThai'] = 'ok'; e['nguon'] = r['chon']; dem['ok-sau-tao-lai'] += 1
        if r and r.get('ghiChu'):
            e['ghiChuTaoLai'] = r['ghiChu']
    else:
        e['trangThai'] = 'ok'; e['nguon'] = 's11'
    dem[e['trangThai']] += 1
    muc[k] = e
json.dump({'ghiChu': 'QA anh Qwen: co = ly do bi gan co (xem tay + loi tu dong nang); canhBaoTuDong = canh bao tu dong (da xem tay tren to lien he); '
                     'trangThai ok | tao-lai | giu-svg; nguon = seed cua anh duoc dung (s11 goc, s22/s33 tao lai)',
           'dem': dem, 'muc': muc}, open(os.path.join(ANH, 'qa.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(dem)
