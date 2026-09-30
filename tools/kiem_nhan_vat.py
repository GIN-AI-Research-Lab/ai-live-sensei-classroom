# -*- coding: utf-8 -*-
"""
Kiem tra bang nhan vat / giong: curriculum/nhan-vat.json <-> curriculum/**/*.json

Chay:  python tools/kiem_nhan_vat.py          (Python 3, khong can thu vien)
Ma thoat 0 = dat het, khac 0 = co loi (in ro tung loi).

Kiem:
  1. moi chuoi speaker trong hoi thoai cua curriculum/{kana,n5..n1}/*.json khop mot nhan vat
  2. khong hai nhan vat nao trung giong
  3. khong nhan vat nao dung giong Sensei (Charon)
  4. giong cua tung nhan vat thuoc kho cua gioi tinh do (nam 16 / nu 14 giong Gemini)
  5. cung mot bi danh (sau chuan hoa) luon ra cung mot nhan vat, khong nhan vat nao trung bi danh
  6. so nhan vat nam / nu lech nhau khong qua 2
  7. MOI dong thoai co avatarUrl == truong 'anh' cua nhan vat (thieu cung la loi); tep anh co that
  8. soLuot trong bang khop so lan thuc te
Chuan hoa ten PHAI giong js/voices.js (chuanHoa + HAU_TO).
"""
import glob
import json
import os
import re
import sys
import unicodedata
from collections import Counter, OrderedDict, defaultdict

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MALE = ['Puck', 'Charon', 'Fenrir', 'Orus', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Algenib',
        'Rasalgethi', 'Alnilam', 'Schedar', 'Achird', 'Zubenelgenubi', 'Sadachbia', 'Sadaltager']
FEMALE = ['Zephyr', 'Kore', 'Leda', 'Aoede', 'Callirrhoe', 'Autonoe', 'Despina', 'Erinome', 'Laomedeia',
          'Achernar', 'Gacrux', 'Pulcherrima', 'Vindemiatrix', 'Sulafat']
LEVELS = ['kana', 'n5', 'n4', 'n3', 'n2', 'n1']
HAU_TO = re.compile(r'(さん|くん|ちゃん|君|様|さま|氏|先生)$')


def chuan_hoa(s):
    t = unicodedata.normalize('NFKC', str(s if s is not None else ''))
    trong_ngoac = (re.search(r'\(([^)]*)\)', t) or [None, ''])[1]
    t = re.sub(r'\([^)]*\)', '', t)
    t = re.sub(r'[\s　]+', '', t).lower()
    if not t and trong_ngoac:
        t = re.sub(r'[\s　]+', '', trong_ngoac).lower()
    return t


def main():
    loi = []

    def bao(msg):
        loi.append(msg)

    with open(os.path.join(GOC, 'curriculum', 'nhan-vat.json'), encoding='utf-8') as f:
        bang = json.load(f)
    if bang.get('phienBan') != 1:
        bao('phienBan phai la 1')
    giong_sensei = bang.get('giongSensei')
    if giong_sensei != 'Charon':
        bao('giongSensei phai la Charon, dang la %r' % (giong_sensei,))
    ds = bang.get('nhanVat') or []

    # --- bang tra bi danh
    alias = {}
    ids = set()
    for n in ds:
        for k in ('id', 'ten', 'ten_ja', 'biDanh', 'gioiTinh', 'giong'):
            if k not in n:
                bao('%s thieu truong %s' % (n.get('id'), k))
        if n['id'] in ids:
            bao('trung id %s' % n['id'])
        ids.add(n['id'])
        if n['gioiTinh'] not in ('m', 'f'):
            bao('%s: gioiTinh phai la m hoac f' % n['id'])
        for a in [n.get('ten_ja', '')] + list(n.get('biDanh', [])):
            k = chuan_hoa(a)
            if not k:
                bao('%s: bi danh rong %r' % (n['id'], a))
                continue
            if k in alias and alias[k] != n['id']:
                bao('bi danh %r (%s) trung nhau giua %s va %s' % (a, k, alias[k], n['id']))
            alias.setdefault(k, n['id'])
    theo_id = {n['id']: n for n in ds}

    def tra(sp):
        k = chuan_hoa(sp)
        if k in alias:
            return alias[k]
        t = k
        for _ in range(2):
            m = HAU_TO.search(t)
            if not m or len(t) <= len(m.group(0)):
                break
            t = t[:-len(m.group(0))]
            if t in alias:
                return alias[t]
        return None

    # --- giong: duy nhat, khong Charon, dung kho gioi tinh
    dung = {}
    for n in ds:
        v = n['giong']
        if v in dung:
            bao('trung giong %s: %s va %s' % (v, dung[v], n['id']))
        dung[v] = n['id']
        if v == 'Charon' or v == giong_sensei:
            bao('%s dung giong cua Sensei (%s)' % (n['id'], v))
        kho = FEMALE if n['gioiTinh'] == 'f' else MALE
        if v not in kho:
            bao('%s: giong %s khong thuoc kho %s' % (n['id'], v, 'nu' if n['gioiTinh'] == 'f' else 'nam'))
        if n.get('anh') and not os.path.exists(os.path.join(GOC, n['anh'])):
            bao('%s: khong co tep anh %s' % (n['id'], n['anh']))

    nam = sum(1 for n in ds if n['gioiTinh'] == 'm')
    nu = len(ds) - nam
    if abs(nam - nu) > 2:
        bao('nam/nu lech qua 2: %d nam, %d nu' % (nam, nu))

    # --- quet giao trinh
    tong = 0
    cung_chuoi = defaultdict(set)         # chuoi speaker nguyen van -> {id}
    dem = Counter()
    theo_cap = defaultdict(Counter)
    cac_chuoi = Counter()
    anh_lech = Counter()
    for lvl in LEVELS:
        for f in sorted(glob.glob(os.path.join(GOC, 'curriculum', lvl, '*.json'))):
            if os.path.basename(f) == 'index.json':
                continue
            with open(f, encoding='utf-8') as fh:
                d = json.load(fh)
            for l in d.get('dialogue') or []:
                tong += 1
                sp = str(l.get('speaker', ''))
                cac_chuoi[sp] += 1
                i = tra(sp)
                if not i:
                    bao('%s/%s: speaker %r khong khop nhan vat nao' % (lvl, os.path.basename(f), sp))
                    continue
                cung_chuoi[sp].add(i)
                dem[i] += 1
                theo_cap[i][lvl] += 1
                av = l.get('avatarUrl')
                if av != (theo_id[i].get('anh') or None):   # thieu avatarUrl cung la loi: moi dong thoai phai mang chan dung cua nhan vat
                    anh_lech[(sp, av, theo_id[i].get('anh'))] += 1

    for sp, tap in cung_chuoi.items():
        if len(tap) > 1:
            bao('chuoi %r ra nhieu nhan vat: %s' % (sp, sorted(tap)))
    for (sp, av, anh), k in anh_lech.items():
        bao('avatarUrl %s cua %r (%d dong) khac anh trong bang (%s)' % (av, sp, k, anh))
    for n in ds:
        if n.get('soLuot') != dem.get(n['id'], 0):
            bao('%s: soLuot=%s nhung thuc te %d' % (n['id'], n.get('soLuot'), dem.get(n['id'], 0)))
        if dem.get(n['id'], 0) == 0:
            bao('%s khong xuat hien o dong thoai nao' % n['id'])

    # --- tong ket
    print('KIEM TRA NHAN VAT / GIONG')
    print('  giao trinh : %d dong thoai, %d chuoi speaker khac nhau -> %d nhan vat' % (tong, len(cac_chuoi), len(ds)))
    print('  gioi tinh  : %d nam, %d nu (lech %d)' % (nam, nu, abs(nam - nu)))
    print('  giong dung : %d / %d giong Gemini (nam %d, nu %d), Sensei giu %s' % (
        len(dung), len(MALE) + len(FEMALE), sum(1 for n in ds if n['gioiTinh'] == 'm'),
        sum(1 for n in ds if n['gioiTinh'] == 'f'), giong_sensei))
    print('  bi danh    : %d bi danh sau chuan hoa, khong trung' % len(alias) if not any('bi danh' in x for x in loi)
          else '  bi danh    : CO TRUNG')
    print()
    print('  %-10s %-2s %-14s %5s  %s' % ('id', 'gt', 'giong', 'luot', 'cap (luot)'))
    for n in ds:
        cap = ', '.join('%s %d' % (lv, theo_cap[n['id']][lv]) for lv in LEVELS if theo_cap[n['id']][lv])
        print('  %-10s %-2s %-14s %5d  %s' % (n['id'], n['gioiTinh'], n['giong'], dem.get(n['id'], 0), cap))
    print()
    if loi:
        print('THAT BAI - %d loi:' % len(loi))
        for x in loi:
            print('  - ' + x)
        return 1
    print('DAT: %d dong thoai, %d nhan vat, %d nam / %d nu, moi nhan vat mot giong rieng.' % (tong, len(ds), nam, nu))
    return 0


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
