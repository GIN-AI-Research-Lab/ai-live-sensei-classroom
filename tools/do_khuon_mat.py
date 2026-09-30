# -*- coding: utf-8 -*-
"""Do khuon mat chan dung nhan vat (tranh vector phang, dau tuong chinh giua) -> assets/minh-hoa/nv/rig.json

Moi anh: tim neo mieng (tam, rong, xoay), tam hai mat, dai long may, mau da quanh mieng, mau net ve.
Toa do chuan hoa 0-1 (x / rong anh, y / cao anh, w / rong anh).
Dung cho js/avatar-noi.js: lop mieng phu len anh, ve mieng theo nguyen am.

Chay:
  python tools/do_khuon_mat.py                  # quet nv-*.webp va nv/<id>/<cam xuc>.webp, ghi rig.json + tam sheet
  python tools/do_khuon_mat.py --tam            # chi in, khong ghi rig.json
  python tools/do_khuon_mat.py --sheet-dir DIR  # thu muc ghi tam sheet kiem tra (mac dinh E:/sensei-tam/tmp/av)
Ket qua:
  assets/minh-hoa/nv/rig.json  { "<duong dan anh>": { mouth:{x,y,w,h,rot,curve}, eyes:[{x,y,r},{x,y,r}], brow:{x,y,w,h},
                                 skin:"#rrggbb", line:"#rrggbb", eye:"#rrggbb", face:{x,y,w,h}, nguon:"tu-dong|ghi-de" } }
  <sheet-dir>/khuon-mat-kiem-tra.png   tam sheet: ve neo phat hien len MOI anh de nhin bang mat
Bang ghi de tay (GHI_DE) o phan dau tep: anh nao tu dong sai thi sua tai do, khong sua thuat toan.
"""
import argparse
import glob
import json
import math
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw

GOC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
THU_MUC_ANH = os.path.join(GOC, 'assets', 'minh-hoa')
RIG = os.path.join(THU_MUC_ANH, 'nv', 'rig.json')
CAM_XUC = ['binh_thuong', 'vui', 'hoi', 'gian', 'ngac_nhien', 'hao_hung', 'buon']

# Ghi de tay khi tu dong sai. Khoa = duong dan anh (tuong doi goc du an) HOAC id nhan vat ("gupta"); gia tri chi can
# cac truong muon sua, vd {'mouth': {'x': .5, 'y': .48, 'w': .09, 'rot': 0}} (toa do chuan hoa).
GHI_DE = {
    # gupta: ria mep trum len net mieng (tu dong chon nham ria). Mieng that la duong cong dam nam duoi ria (y ~ 257 / 512).
    # clipTop: lop mieng khong duoc ve len tren muc nay (ria nam tren); skinAt: lay mau da quanh mieng tai diem nay.
    'gupta': {'mouth': {'x': 0.500, 'y': 0.502, 'w': 0.085, 'h': 0.010, 'rot': 0.0, 'curve': 0.004, 'clipTop': 0.489},
              'skinAt': [0.500, 0.520]},
}


def hex_(rgb):
    return '#%02x%02x%02x' % tuple(int(round(max(0, min(255, v)))) for v in rgb)


def doc_anh(p):
    return np.array(Image.open(p).convert('RGB'))


def lab_cua(im):
    """Lab thuc (L 0-100, a, b) — khoang cach mau deu hon RGB."""
    lab = cv2.cvtColor(im, cv2.COLOR_RGB2LAB).astype(np.float32)
    lab[..., 0] *= 100 / 255
    lab[..., 1:] -= 128
    return lab


def lab_sang_rgb(lab):
    v = np.array([[[lab[0] * 255 / 100, lab[1] + 128, lab[2] + 128]]], np.float32)
    return cv2.cvtColor(np.clip(v, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)[0, 0]


def thanh_phan(mask, toi_thieu=1):
    n, nhan, tk, tam = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    ds = [dict(id=i, x=int(tk[i, 0]), y=int(tk[i, 1]), w=int(tk[i, 2]), h=int(tk[i, 3]), dt=int(tk[i, 4]),
               cx=float(tam[i, 0]), cy=float(tam[i, 1])) for i in range(1, n) if tk[i, 4] >= toi_thieu]
    return ds, nhan


def lap_lo(mask):
    """Lap day cac lo (vung khong noi toi bien anh) trong mask nhi phan."""
    h, w = mask.shape
    inv = (1 - mask.astype(np.uint8)).copy()
    ff = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(inv, ff, (0, 0), 2)
    return (inv != 2).astype(np.uint8)


def vung_mat(im):
    """Vung khuon mat (da + lo mat/mieng/kinh) va mau da. Tra ve dict lab, da, d (khoang cach mau toi da), vung."""
    h, w = im.shape[:2]
    lab = lab_cua(im)
    # mau da = trung vi vung tran / ma (phia tren giua; net mat nho nen trung vi van la da)
    da = np.median(lab[int(.30 * h):int(.44 * h), int(.40 * w):int(.60 * w)].reshape(-1, 3), axis=0)
    d = np.sqrt(((lab - da) ** 2 * np.array([0.35, 1, 1], np.float32)).sum(axis=2))
    skin = (d < 13).astype(np.uint8)
    # dong khe nho (gong kinh ~4 px, net mat) de mat + kinh nam chung mot vung
    dong = cv2.morphologyEx(skin, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
    cs, nhan = thanh_phan(dong, 500)
    hat = nhan[int(.36 * h):int(.44 * h), int(.44 * w):int(.56 * w)]
    ids = [c for c in cs if (hat == c['id']).any()]
    chon = max(ids or cs, key=lambda c: c['dt'])
    vung = lap_lo((nhan == chon['id']).astype(np.uint8))
    return dict(lab=lab, da=da, d=d, vung=vung, skin=skin)


def tim_mat(dacTrung, w, h):
    """Hai mat: cap cham/vong toi, cung do cao, doi xung quanh truc dau, o nua tren khuon mat."""
    d, vung = dacTrung['d'], dacTrung['vung']
    lo = cv2.erode(vung, np.ones((9, 9), np.uint8))
    ft = ((d > 24) & (lo > 0)).astype(np.uint8)
    cs, nhan = thanh_phan(ft, 14)
    ys, xs = np.nonzero(vung)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    truc = (x0 + x1) / 2.0
    ung = []
    for c in cs:
        ti = c['w'] / max(1, c['h'])
        if c['dt'] > 900 or not (0.45 < ti < 2.4) or c['w'] > 60 or c['h'] > 45:
            continue
        if not (y0 + 0.08 * (y1 - y0) < c['cy'] < y0 + 0.62 * (y1 - y0)):
            continue
        ung.append(c)
    tot, diem_tot = None, 1e9
    for i, a in enumerate(ung):
        for b in ung[i + 1:]:
            if a['cx'] > b['cx']:
                a, b = b, a
            dx = b['cx'] - a['cx']
            if not (0.22 * w < dx < 0.36 * w if False else 30 < dx < 0.40 * w):
                continue
            dy = abs(a['cy'] - b['cy'])
            if dy > 0.03 * h:
                continue
            xung = abs((a['cx'] + b['cx']) / 2 - truc)
            dt = abs(a['dt'] - b['dt']) / max(a['dt'], b['dt'])
            # uu tien cap thap hon (mat, khong phai long may) va doi xung, kich thuoc giong nhau
            diem = xung * 1.0 + dy * 2.0 + dt * 12 - 0.05 * (a['cy'] + b['cy'])
            if diem < diem_tot:
                diem_tot, tot = diem, (a, b)
    if tot is None:
        return None
    return tot


def tim_may(dacTrung, mat, w, h):
    """Dai long may: net dam, dai, nam tren hai mat."""
    d, vung = dacTrung['d'], dacTrung['vung']
    ey = (mat[0]['cy'] + mat[1]['cy']) / 2
    E = mat[1]['cx'] - mat[0]['cx']
    ft = ((d > 24) & (vung > 0)).astype(np.uint8)
    cs, nhan = thanh_phan(ft, 25)
    kq = []
    for c in cs:
        if c['w'] < 0.25 * E or c['w'] > 0.9 * E or c['h'] > 0.3 * E:
            continue
        if not (ey - 0.75 * E < c['cy'] < ey - 0.12 * E):
            continue
        if not (mat[0]['cx'] - 0.5 * E < c['cx'] < mat[1]['cx'] + 0.5 * E):
            continue
        kq.append(c)
    if not kq:
        return None
    x0 = min(c['x'] for c in kq)
    x1 = max(c['x'] + c['w'] for c in kq)
    y0 = min(c['y'] for c in kq)
    y1 = max(c['y'] + c['h'] for c in kq)
    return dict(x=(x0 + x1) / 2, y=(y0 + y1) / 2, w=x1 - x0, h=y1 - y0)


def tim_mieng(dacTrung, mat, w, h):
    """Mieng: net cong mong (khac tien mui / ria) nam duoi hai mat, gan giua. Thu nguong net tu dam toi nhat;
    chon ung vien co do sau hop ly (~0.7-1.35 khoang cach hai mat) va gan truc giua. Tra ve (thanh phan, nhan) hoac None."""
    d = dacTrung['d']
    ex = (mat[0]['cx'] + mat[1]['cx']) / 2
    ey = (mat[0]['cy'] + mat[1]['cy']) / 2
    E = mat[1]['cx'] - mat[0]['cx']
    y_lo, y_hi = int(ey + 0.42 * E), int(ey + 1.75 * E)
    x_lo, x_hi = int(ex - 0.85 * E), int(ex + 0.85 * E)
    cua = np.zeros_like(dacTrung['vung'])
    cua[y_lo:y_hi, x_lo:x_hi] = 1
    tot = None
    for nguong in (20, 14, 10):
        ft = ((d > nguong) & (cua > 0)).astype(np.uint8)
        ft = cv2.morphologyEx(ft, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        cs, nhan = thanh_phan(ft, 14)
        for c in cs:
            ti = c['w'] / max(1, c['h'])
            if c['w'] < 0.3 * E or c['w'] > 1.3 * E:
                continue
            if ti < 2.2:
                continue
            sau = (c['cy'] - ey) / E
            # diem: gan do sau ky vong 0.95 E, gan truc giua, dai; dam hon (nguong cao) duoc uu tien nhe
            diem = abs(sau - 0.95) * 2.0 + abs(c['cx'] - ex) / E * 2.0 - 0.3 * c['w'] / E
            diem += {20: 0.0, 14: 0.15, 10: 0.3}[nguong]
            if tot is None or diem < tot[0]:
                tot = (diem, c, nhan)
        if tot is not None and tot[0] < 0.9:
            break
    return (tot[1], tot[2]) if tot else None


def do_mieng_chi_tiet(dacTrung, c, nhan):
    """Tu mot thanh phan mieng -> tam, rong, xoay (PCA), do cong, mau net."""
    ys, xs = np.nonzero(nhan == c['id'])
    pts = np.stack([xs, ys], 1).astype(np.float32)
    tam = pts.mean(0)
    u, s, vt = np.linalg.svd(pts - tam, full_matrices=False)
    goc = math.atan2(vt[0][1], vt[0][0])
    if goc > math.pi / 2:
        goc -= math.pi
    if goc < -math.pi / 2:
        goc += math.pi
    # toa do trong he quay
    cs_, sn_ = math.cos(goc), math.sin(goc)
    px = (pts[:, 0] - tam[0]) * cs_ + (pts[:, 1] - tam[1]) * sn_
    py = -(pts[:, 0] - tam[0]) * sn_ + (pts[:, 1] - tam[1]) * cs_
    rong = float(px.max() - px.min())
    # do cong: y trung binh o hai dau (20% ngoai cung) so voi giua
    ngoai = np.abs(px) > 0.3 * rong
    giua = np.abs(px) < 0.15 * rong
    cong = 0.0
    if ngoai.any() and giua.any():
        cong = float(py[giua].mean() - py[ngoai].mean())   # + : giua thap hon hai dau = cuoi (net cong xuong)
    return dict(tam=tam, goc=goc, rong=rong, cao=float(py.max() - py.min()), cong=cong)


def mau_da_quanh(dacTrung, cx, cy, r):
    """Mau da ngay quanh mieng: trung vi cac diem KHONG phai net ve trong vanh r..1.8r (Lab -> RGB)."""
    lab, d = dacTrung['lab'], dacTrung['d']
    h, w = d.shape
    yy, xx = np.mgrid[0:h, 0:w]
    kc = np.sqrt(((xx - cx) / 1.6) ** 2 + (yy - cy) ** 2)
    m = (kc > r * 0.45) & (kc < r * 1.25)
    tuong_doi = np.sqrt(((lab - np.median(lab[m], axis=0)) ** 2).sum(axis=2))
    m2 = m & (tuong_doi < 9)
    if m2.sum() < 30:
        m2 = m
    return lab_sang_rgb(np.median(lab[m2], axis=0))


def phan_tich(im):
    h, w = im.shape[:2]
    dt = vung_mat(im)
    mat = tim_mat(dt, w, h)
    if mat is None:
        return dict(loi='khong thay hai mat')
    may = tim_may(dt, mat, w, h)
    kq = dict()
    E = mat[1]['cx'] - mat[0]['cx']
    kq['eyes'] = [dict(x=a['cx'] / w, y=a['cy'] / h, r=max(a['w'], a['h']) / 2 / w) for a in mat]
    if may and may['w'] > 0.5 * E:
        kq['brow'] = dict(x=may['x'] / w, y=may['y'] / h, w=may['w'] / w, h=may['h'] / h)
    else:   # long may bi toc che: gia lap tren hai mat
        kq['brow'] = dict(x=(mat[0]['cx'] + mat[1]['cx']) / 2 / w, y=((mat[0]['cy'] + mat[1]['cy']) / 2 - 0.42 * E) / h, w=1.2 * E / w, h=0.12 * E / h)
        kq['browGiaLap'] = True
    ys, xs = np.nonzero(dt['vung'])
    kq['face'] = dict(x=(xs.min() + xs.max()) / 2 / w, y=(ys.min() + ys.max()) / 2 / h, w=(xs.max() - xs.min()) / w, h=(ys.max() - ys.min()) / h)
    kq['E'] = E / w
    m = tim_mieng(dt, mat, w, h)
    if m is None:
        kq['loi'] = 'khong thay mieng'
        return kq
    c, nhan = m
    ct = do_mieng_chi_tiet(dt, c, nhan)
    tam = ct['tam']
    kq['mouth'] = dict(x=float(tam[0]) / w, y=float(tam[1]) / h, w=ct['rong'] / w, h=ct['cao'] / h, rot=ct['goc'], curve=ct['cong'] / w)
    # mau
    pix = dt['lab'][nhan == c['id']]
    tt = np.argsort(pix[:, 0])[:max(5, len(pix) // 3)]
    kq['line'] = hex_(lab_sang_rgb(np.median(pix[tt], axis=0)))
    kq['skin'] = hex_(mau_da_quanh(dt, tam[0], tam[1], ct['rong']))
    ey = (mat[0]['cy'] + mat[1]['cy']) / 2
    eye_pix = []
    for a in mat:
        x0, y0 = int(a['cx'] - 3), int(a['cy'] - 3)
        eye_pix.append(dt['lab'][y0:y0 + 7, x0:x0 + 7].reshape(-1, 3))
    kq['eye'] = hex_(lab_sang_rgb(np.median(np.concatenate(eye_pix), axis=0)))
    kq['daMat'] = hex_(lab_sang_rgb(dt['da']))
    kq['bg'] = hex_(np.median(np.concatenate([im[:6, :6].reshape(-1, 3), im[:6, -6:].reshape(-1, 3), im[-6:, :6].reshape(-1, 3), im[-6:, -6:].reshape(-1, 3)]), axis=0))
    return kq


def ap_ghi_de(ket, duong_dan, id_):
    for khoa in (id_, duong_dan):
        g = GHI_DE.get(khoa)
        if not g:
            continue
        for k, v in g.items():
            if isinstance(v, dict) and isinstance(ket.get(k), dict):
                ket[k].update(v)
            else:
                ket[k] = v
        ket['nguon'] = 'ghi-de'
        ket.pop('loi', None)
    ket.setdefault('nguon', 'tu-dong')
    return ket


def ap_skin_at(ket, im):
    """skinAt (ghi de tay): lay mau da tai mot diem chuan hoa thay cho mau do tu dong."""
    p = ket.pop('skinAt', None)
    if p:
        h, w = im.shape[:2]
        x, y = int(p[0] * w), int(p[1] * h)
        ket['skin'] = hex_(np.median(im[y - 2:y + 3, x - 2:x + 3].reshape(-1, 3), axis=0))


def tim_anh(them=()):
    ds = []
    for f in sorted(glob.glob(os.path.join(THU_MUC_ANH, 'nv-*.webp'))):
        ds.append((f, os.path.basename(f)[3:-5]))
    for f in sorted(glob.glob(os.path.join(THU_MUC_ANH, 'nv', '*', '*.webp'))):
        ds.append((f, os.path.basename(os.path.dirname(f))))
    for d in them:   # thu muc them (kiem thu): <d>/<id>/<cam xuc>.webp
        for f in sorted(glob.glob(os.path.join(d, '*', '*.webp'))):
            ds.append((f, os.path.basename(os.path.dirname(f))))
    return ds


def anh_goc_cua(id_, ket_qua):
    """Khoa rig cua chan dung goc cua nhan vat (nv-<id>.webp hoac truong `anh` trong curriculum/nhan-vat.json)."""
    ung = ['assets/minh-hoa/nv-%s.webp' % id_, 'assets/minh-hoa/nv-%s.webp' % {'giao-vien': 'sensei'}.get(id_, id_)]
    try:
        with open(os.path.join(GOC, 'curriculum', 'nhan-vat.json'), encoding='utf-8') as fh:
            for n in json.load(fh).get('nhanVat', []):
                if n.get('id') == id_ and n.get('anh'):
                    ung.append(n['anh'].replace('\\', '/'))
    except Exception:
        pass
    for k in ung:
        if k in ket_qua and 'mouth' in ket_qua[k] and ket_qua[k].get('nguon') != 'theo-goc':
            return k
    return None


def doi_chieu_voi_goc(ket, goc):
    """Anh bieu cam: cung tu the, mieng phai trung chan dung goc (sai so <= 0.03 chuan hoa). Lech hoac thieu thi lay theo goc."""
    if not goc or 'mouth' not in goc:
        return ket
    ok = ('mouth' in ket and abs(ket['mouth']['x'] - goc['mouth']['x']) <= 0.03 and abs(ket['mouth']['y'] - goc['mouth']['y']) <= 0.03
          and abs(ket['mouth']['w'] - goc['mouth']['w']) <= 0.4 * goc['mouth']['w'])
    if ok:
        # mat: bieu cam co the doi hinh mat (cung cong, mat tron) - toa do mat lay theo goc cho chop mat on dinh
        for k in ('eyes', 'brow', 'face', 'E', 'bg'):
            if k in goc:
                ket[k] = goc[k]
        return ket
    moi = {k: v for k, v in goc.items() if k != 'nguon'}
    moi['nguon'] = 'theo-goc'
    if ket.get('line'):
        moi['line'] = ket['line']          # mau net cua chinh anh bieu cam
    return moi


def ve_kiem_tra(im, ket, ten, to=2):
    """Anh kiem tra: ve neo len ban phong to vung mat (crop quanh mat/mieng), kem nhan."""
    h, w = im.shape[:2]
    p = Image.fromarray(im).resize((w * to, h * to), Image.LANCZOS)
    g = ImageDraw.Draw(p)
    if 'eyes' in ket:
        for e in ket['eyes']:
            x, y, r = e['x'] * w * to, e['y'] * h * to, max(3, e['r'] * w * to)
            g.ellipse([x - r - 3, y - r - 3, x + r + 3, y + r + 3], outline=(255, 0, 0), width=2)
    if 'brow' in ket:
        b = ket['brow']
        g.rectangle([(b['x'] - b['w'] / 2) * w * to, (b['y'] - b['h'] / 2) * h * to, (b['x'] + b['w'] / 2) * w * to, (b['y'] + b['h'] / 2) * h * to], outline=(0, 160, 255), width=2)
    if 'mouth' in ket:
        m = ket['mouth']
        cx, cy, ww = m['x'] * w * to, m['y'] * h * to, m['w'] * w * to
        ca, sa = math.cos(m['rot']), math.sin(m['rot'])
        g.line([cx - ca * ww / 2, cy - sa * ww / 2, cx + ca * ww / 2, cy + sa * ww / 2], fill=(0, 200, 0), width=2)
        g.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], outline=(0, 200, 0), width=2)
        if 'skin' in ket:
            g.rectangle([cx - ww * 0.75, cy + ww * 0.65, cx - ww * 0.75 + 18, cy + ww * 0.65 + 18], fill=tuple(int(ket['skin'][i:i + 2], 16) for i in (1, 3, 5)), outline=(0, 0, 0))
    g.text((6, 4), ten + (' ' + ket.get('loi', '') if ket.get('loi') else '') + ' [' + ket.get('nguon', '') + ']', fill=(200, 0, 120))
    # cat quanh mat: tu 0.18 den 0.62 chieu cao, 0.22-0.78 ngang
    x0, x1, y0, y1 = int(.2 * w * to), int(.8 * w * to), int(.17 * h * to), int(.62 * h * to)
    return np.array(p.crop((x0, y0, x1, y1)))


def chay(tam_thoi, sheet_dir, them=()):
    ket_qua = {}
    tiles = []
    thieu = []
    ds = tim_anh(them)
    # chan dung goc truoc, anh bieu cam sau (de doi chieu voi goc)
    ds.sort(key=lambda t: (0 if os.path.basename(t[0]).startswith('nv-') else 1, t[0]))
    for f, id_ in ds:
        try:
            rel = os.path.relpath(f, GOC).replace('\\', '/')
        except ValueError:
            rel = f.replace('\\', '/')
        im = doc_anh(f)
        ket = phan_tich(im)
        ket = ap_ghi_de(ket, rel, id_)
        ap_skin_at(ket, im)
        if not os.path.basename(f).startswith('nv-'):
            gk = anh_goc_cua(id_, ket_qua)
            ket = doi_chieu_voi_goc(ket, ket_qua.get(gk) if gk else None)
        ket_qua[rel] = ket
        if 'mouth' not in ket:
            thieu.append(rel)
        tiles.append(ve_kiem_tra(im, ket, rel.replace('assets/minh-hoa/', '')))
    if tiles:
        th, tw = tiles[0].shape[:2]
        cot = 4
        hang = []
        for i in range(0, len(tiles), cot):
            r = tiles[i:i + cot]
            r += [np.full_like(tiles[0], 255)] * (cot - len(r))
            hang.append(np.hstack(r))
        os.makedirs(sheet_dir, exist_ok=True)
        Image.fromarray(np.vstack(hang)).save(os.path.join(sheet_dir, 'khuon-mat-kiem-tra.png'))
    print('anh:', len(ket_qua), ' khong du mieng:', len(thieu), thieu)
    if not tam_thoi:
        os.makedirs(os.path.dirname(RIG), exist_ok=True)
        with open(RIG, 'w', encoding='utf-8') as fh:
            json.dump(ket_qua, fh, ensure_ascii=False, indent=1, sort_keys=True)
        print('da ghi', RIG)
    return ket_qua


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--tam', action='store_true', help='chi in, khong ghi rig.json')
    ap.add_argument('--sheet-dir', default='E:/sensei-tam/tmp/av')
    ap.add_argument('--them', action='append', default=[], help='thu muc them <d>/<id>/<cam xuc>.webp (kiem thu)')
    a = ap.parse_args()
    chay(a.tam, a.sheet_dir, a.them)
