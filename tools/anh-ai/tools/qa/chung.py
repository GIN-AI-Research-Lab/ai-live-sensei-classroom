# chung.py - doc danh sach muc tu cac tep prompt: thu tu cap do, ten duy nhat moi tep, nhan hien thi
import json, os
# ---- PATHS (sua o day neu doi cho dat) ----
# KHO     = thu muc tools/anh-ai (2 cap tren tep nay)
# PROMPTS = prompts/ (5 tep prompt + tl/dot-*.json) trong kho
# WORK    = thu muc lam viec cuc bo (chua anh/png, anh/nen, anh/tao-lai..., khong dua vao git); doi bang bien moi truong ANH_AI_WORK
# QD      = thu muc tep nay (chua co-tay.json, tao-lai-kq.json)
# FONT_DIR = thu muc font Windows cho cac script ve to lien he (doi bang ANH_AI_FONTS neu chay Linux/Mac)
QD = os.path.dirname(os.path.abspath(__file__))
KHO = os.path.dirname(os.path.dirname(QD))
PROMPTS = os.path.join(KHO, 'prompts')
WORK = os.environ.get('ANH_AI_WORK') or os.path.join(os.path.expanduser('~'), 'anh-ai-work')
FONT_DIR = os.environ.get('ANH_AI_FONTS', 'C:/Windows/Fonts')
Q = PROMPTS   # ten cu: goc chua prompt-*.json va tl/
ANH = os.path.join(WORK, 'anh')
CAP = ['n5', 'canh', 'n4', 'n3', 'n2n1']
TEP = {c: os.path.join(PROMPTS, 'prompt-%s.json' % c) for c in CAP}


def doc(c):
    return json.load(open(TEP[c], encoding='utf-8'))['items']


def nhan(it):
    # (tu tieng Nhat, nghia tieng Viet)
    w = it.get('kanji') or it.get('word') or it.get('nhanVat') if not isinstance(it.get('nhanVat'), list) else ''
    if it.get('kanji') and it.get('word') and it['kanji'] != it['word']:
        w = '%s (%s)' % (it['kanji'], it['word'])
    nghia = it.get('nghia') or it.get('meaningVi') or it.get('tieuDe') or it.get('tomTat') or ''
    return w or '', nghia


def muc_duy_nhat():
    # [(cap, ten, item dau tien)] theo thu tu sinh
    ra = []
    for c in CAP:
        thay = set()
        for it in doc(c):
            if it['ten'] in thay:
                continue
            thay.add(it['ten']); ra.append((c, it['ten'], it))
    return ra
