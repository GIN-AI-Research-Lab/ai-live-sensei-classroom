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
    # hyoronka: kinh + khan quang; binh_thuong do mat bi dinh vao gong kinh (r lon) nen chop mat tat. Dung toa do con nguoi do tren binh_thuong_kin.
    'hyoronka': {'eyes': [{'x': 0.415, 'y': 0.374, 'r': 0.0156}, {'x': 0.570, 'y': 0.374, 'r': 0.0156}]},
    # gupta: ria mep trum len net mieng (tu dong chon nham ria). Mieng that la duong cong dam nam duoi ria (y ~ 257 / 512).
    # clipTop: lop mieng khong duoc ve len tren muc nay (ria nam tren); skinAt: lay mau da quanh mieng tai diem nay.
    'gupta': {'mouth': {'x': 0.500, 'y': 0.502, 'w': 0.085, 'h': 0.010, 'rot': 0.0, 'curve': 0.012, 'clipTop': 0.489},
              'skinAt': [0.500, 0.520]},
    # gupta: hinh net mieng duoi ria khac nhau theo bieu cam (do tay tren anh phong 5x, luoi 0.01)
    'assets/minh-hoa/nv/gupta/vui.webp': {'mouth': {'y': 0.503, 'w': 0.100, 'curve': 0.022}},
    'assets/minh-hoa/nv/gupta/hoi.webp': {'mouth': {'y': 0.503, 'w': 0.100, 'curve': 0.016}},
    'assets/minh-hoa/nv/gupta/gian.webp': {'mouth': {'y': 0.507, 'w': 0.109, 'curve': -0.046}},
    'assets/minh-hoa/nv/gupta/buon.webp': {'mouth': {'y': 0.507, 'w': 0.109, 'curve': -0.046}},
    'assets/minh-hoa/nv/gupta/ngac_nhien.webp': {'mouth': {'y': 0.510, 'w': 0.051, 'curve': -0.006}},
    'assets/minh-hoa/nv/gupta/hao_hung.webp': {'mouth': {'y': 0.503, 'w': 0.110, 'curve': 0.030}},
    # santos: ria + rau dinh net mieng 'hoi' (mieng nhech mot ben, do tay)
    'assets/minh-hoa/nv/santos/hoi.webp': {'mouth': {'x': 0.505, 'y': 0.502, 'w': 0.105, 'h': 0.02, 'rot': 0.0, 'curve': 0.024}},
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


def vung_mat(im, da_cho=None):
    """Vung khuon mat (da + lo mat/mieng/kinh) va mau da. Tra ve dict lab, da, d (khoang cach mau toi da), vung."""
    h, w = im.shape[:2]
    lab = lab_cua(im)
    # mau da = trung vi vung tran / ma (phia tren giua; net mat nho nen trung vi van la da)
    da = np.median(lab[int(.30 * h):int(.44 * h), int(.40 * w):int(.60 * w)].reshape(-1, 3), axis=0)
    if da_cho is not None:   # anh bieu cam: toc mai / long may che tran lam trung vi sai (lech > 9 so voi anh trung tinh) -> dung mau da cua anh trung tinh
        goc_da = np.array(da_cho, np.float32)
        if np.sqrt((((da - goc_da) ** 2) * np.array([0.35, 1, 1], np.float32)).sum()) > 9:
            da = goc_da
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


def tim_mieng(dacTrung, mat, w, h, truoc=None):
    """Mieng: net cong mong (khac tien mui / ria) nam duoi hai mat, gan giua. Thu nguong net tu dam toi nhat;
    chon ung vien co do sau hop ly (~0.7-1.35 khoang cach hai mat) va gan truc giua. Tra ve (thanh phan, nhan) hoac None."""
    d = dacTrung['d']
    ex = (mat[0]['cx'] + mat[1]['cx']) / 2
    ey = (mat[0]['cy'] + mat[1]['cy']) / 2
    E = mat[1]['cx'] - mat[0]['cx']
    y_lo, y_hi = int(ey + 0.42 * E), int(ey + 1.75 * E)
    x_lo, x_hi = int(ex - 0.85 * E), int(ex + 0.85 * E)
    if truoc:   # co mieng cua anh goc: chi tim trong cua so quanh do, chon thanh phan gan nhat
        y_lo, y_hi = max(0, int(truoc['y'] - 0.035 * h)), min(h, int(truoc['y'] + 0.035 * h))
        x_lo, x_hi = max(0, int(truoc['x'] - 0.09 * w)), min(w, int(truoc['x'] + 0.09 * w))
    cua = np.zeros_like(dacTrung['vung'])
    cua[y_lo:y_hi, x_lo:x_hi] = 1
    tot = None
    for nguong in ((20, 14, 10, 7) if truoc else (20, 14, 10)):
        ft = ((d > nguong) & (cua > 0)).astype(np.uint8)
        ft = cv2.morphologyEx(ft, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        cs, nhan = thanh_phan(ft, 14)
        for c in cs:
            ti = c['w'] / max(1, c['h'])
            if truoc:   # mieng bieu cam co the la net ngan (ngac nhien) hoac cuoi rong (hao hung)
                if c['w'] < 0.1 * E or c['w'] > 2.4 * E or ti < 1.2:
                    continue
            else:
                if c['w'] < 0.3 * E or c['w'] > 1.3 * E:
                    continue
                if ti < 2.2:
                    continue
            sau = (c['cy'] - ey) / E
            if truoc:
                diem = (abs(c['cx'] - truoc['x']) + 1.5 * abs(c['cy'] - truoc['y'])) / E
                if tot is None or diem < tot[0]:
                    tot = (diem, c, nhan)
                continue
            # diem: gan do sau ky vong 0.95 E, gan truc giua, dai; dam hon (nguong cao) duoc uu tien nhe
            diem = abs(sau - 0.95) * 2.0 + abs(c['cx'] - ex) / E * 2.0 - 0.3 * c['w'] / E
            diem += {20: 0.0, 14: 0.15, 10: 0.3}[nguong]
            if tot is None or diem < tot[0]:
                tot = (diem, c, nhan)
        if tot is not None and tot[0] < (0.6 if truoc else 0.9):
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
    # do cong = tham so `lift` cua veDuongNu (js/avatar-noi.js): tam thap hon hai dau (nu) = +, cao hon (mieu / gian) = -.
    # Khop parabol py = a + b*px + c*px^2 (tat ca diem net): chenh tam - hai dau D = -c*(rong/2)^2; quadratic cua veDuongNu co chenh = lift / 2 => lift = 2D.
    cong = 0.0
    if len(px) >= 12 and rong > 4:
        c2 = np.polyfit(px.astype(np.float64), py.astype(np.float64), 2)[0]
        cong = float(-c2 * (rong / 2.0) ** 2 * 2.0)
    return dict(tam=tam, goc=goc, rong=rong, cao=float(py.max() - py.min()), cong=cong)


def mau_da_quanh(dacTrung, cx, cy, r):
    """Mau da ngay quanh mieng: trung vi cac diem KHONG phai net ve trong vanh r..1.8r (Lab -> RGB)."""
    lab, d = dacTrung['lab'], dacTrung['d']
    h, w = d.shape
    yy, xx = np.mgrid[0:h, 0:w]
    kc = np.sqrt(((xx - cx) / 1.6) ** 2 + (yy - cy) ** 2)
    m = (kc > r * 0.45) & (kc < r * 1.25)
    da = m & (dacTrung['skin'] > 0)   # diem cung mau da mat (khong phai toc / vien / net): tranh lay nham toc khi mieng rong
    if da.sum() >= 150:
        m = da
    tuong_doi = np.sqrt(((lab - np.median(lab[m], axis=0)) ** 2).sum(axis=2))
    m2 = m & (tuong_doi < 9)
    if m2.sum() < 30:
        m2 = m
    return lab_sang_rgb(np.median(lab[m2], axis=0))


def kiem_mat_don(dacTrung, eyes, w, h, dt_goc=None):
    """Hai mat co phai la hai cham / vong toi don gian (khong diem sang, khong dinh long may / gong kinh) tai vi tri `eyes`?
    Chi khi do lop chop mat (phu mau da) moi an toan. Tra ve (ok, [dien tich], ly do)."""
    d = dacTrung['d']
    yy, xx = np.mgrid[0:h, 0:w]
    dts = []
    for i, e in enumerate(eyes):
        cx, cy = e['x'] * w, e['y'] * h
        R = max(4.0, e['r'] * w) * 1.7 + 2
        dia = (xx - cx) ** 2 + (yy - cy) ** 2 <= R * R
        ft = ((d > 24) & dia).astype(np.uint8)
        cs, nhan = thanh_phan(ft, 6)
        gan = [c for c in cs if abs(c['cx'] - cx) < 0.6 * R and abs(c['cy'] - cy) < 0.6 * R]
        if not gan:
            return False, dts, 'khong co cham toi'
        c = max(gan, key=lambda q: q['dt'])
        m = (nhan == c['id'])
        bien = dia & ~cv2.erode(dia.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        if (m & bien).any():
            return False, dts, 'cham cham bien (dinh gong kinh / long may)'
        ti = c['w'] / max(1, c['h'])
        if not (0.6 < ti < 1.7):
            return False, dts, 'khong tron (%.2f)' % ti
        holes = int(lap_lo(m.astype(np.uint8)).sum()) - c['dt']
        if holes > 0.04 * c['dt']:
            return False, dts, 'co diem sang'
        if abs(c['cx'] - cx) > 0.015 * w or abs(c['cy'] - cy) > 0.015 * h:
            return False, dts, 'lech vi tri'
        if dt_goc and not (0.5 < c['dt'] / dt_goc[i] < 1.8):
            return False, dts, 'dien tich khac goc (%.2f)' % (c['dt'] / dt_goc[i])
        dts.append(c['dt'])
    return True, dts, ''


def lech_mat(dacTrung, eyes, w, h):
    """Kiem mat anh bieu cam: voi moi mat cua neo, khoang cach (chuan hoa theo rong anh) toi net toi (con nguoi / vong / cung mi nham)
    gan nhat. Lon nhat trong hai mat. Net toi = diem khac mau da (d > 24) trong ban kinh 0.06 quanh neo."""
    d = dacTrung['d']
    ys, xs = np.nonzero(d > 24)
    kq = 0.0
    for e in eyes:
        cx, cy = e['x'] * w, e['y'] * h
        gan = (np.abs(xs - cx) < 0.06 * w) & (np.abs(ys - cy) < 0.06 * h)
        if not gan.any():
            return 1.0
        # tam cua cac comp toi trong cua so: lay diem gan nhat (xap xi bang tam khoi toi trong ban kinh 0.02)
        dd = np.sqrt((xs[gan] - cx) ** 2 + (ys[gan] - cy) ** 2) / w
        kq = max(kq, float(dd.min()) if dd.min() > 0.0 else 0.0)
        # khoi toi co tam lech: trung binh cac diem trong 0.02
        trong = dd < 0.02
        if trong.sum() >= 6:
            mx = (xs[gan][trong].mean() - cx) / w
            my = (ys[gan][trong].mean() - cy) / h
            kq = max(kq, math.hypot(mx, my))
    return kq


def phan_tich(im, goc=None, eyes_cuong=None):
    """goc = ket qua cua anh trung tinh cung nhan vat (None khi do chinh anh goc). Anh bieu cam: mat lay tu goc
    (tim mat rieng chi de doi chieu), mieng do lai tren chinh anh, uu tien vi tri tu do; neu lech goc qua 0.03 thi tim lai
    trong cua so quanh mieng goc va danh dau `rangBuoc`."""
    h, w = im.shape[:2]
    dt = vung_mat(im, (goc or {}).get('_daLab'))
    mat_rieng = tim_mat(dt, w, h)
    kq = dict()
    if eyes_cuong or (goc and goc.get('eyes')):
        nguon_mat = eyes_cuong or goc['eyes']
        mat = [dict(cx=e['x'] * w, cy=e['y'] * h, w=2 * e['r'] * w, h=2 * e['r'] * w, dt=1) for e in nguon_mat]
        kq['eyes'] = nguon_mat
        if goc and goc.get('eyes'):
            kq['matLech'] = round(lech_mat(dt, goc['eyes'], w, h), 4)
    else:
        mat = mat_rieng
        if mat is None:
            return dict(loi='khong thay hai mat')
        kq['eyes'] = [dict(x=a['cx'] / w, y=a['cy'] / h, r=max(a['w'], a['h']) / 2 / w) for a in mat]
    E = mat[1]['cx'] - mat[0]['cx']
    may = tim_may(dt, mat, w, h)
    if may and may['w'] > 0.5 * E:
        kq['brow'] = dict(x=may['x'] / w, y=may['y'] / h, w=may['w'] / w, h=may['h'] / h)
    else:   # long may bi toc che: gia lap tren hai mat
        kq['brow'] = dict(x=(mat[0]['cx'] + mat[1]['cx']) / 2 / w, y=((mat[0]['cy'] + mat[1]['cy']) / 2 - 0.42 * E) / h, w=1.2 * E / w, h=0.12 * E / h)
        kq['browGiaLap'] = True
    ys, xs = np.nonzero(dt['vung'])
    kq['face'] = dict(x=(xs.min() + xs.max()) / 2 / w, y=(ys.min() + ys.max()) / 2 / h, w=(xs.max() - xs.min()) / w, h=(ys.max() - ys.min()) / h)
    kq['E'] = E / w
    m = tim_mieng(dt, mat, w, h)
    truoc = None
    if goc and goc.get('mouth'):
        truoc = dict(x=goc['mouth']['x'] * w, y=goc['mouth']['y'] * h)
        if m is not None:
            ct0 = do_mieng_chi_tiet(dt, m[0], m[1])
            if abs(ct0['tam'][0] / w - goc['mouth']['x']) > 0.03 or abs(ct0['tam'][1] / h - goc['mouth']['y']) > 0.03:
                m = None
        if m is None:
            m = tim_mieng(dt, mat, w, h, truoc)
            if m is not None:
                kq['rangBuoc'] = True
    if m is None and goc and goc.get('mouth'):
        # khong do duoc net mieng: lay hinh hoc cua anh goc (can kiem tra bang mat)
        g = goc['mouth']
        kq['mouth'] = dict(g)
        kq['theoGoc'] = True
        kq['line'] = goc.get('line', '#6a3a30')
        kq['skin'] = hex_(mau_da_quanh(dt, g['x'] * w, g['y'] * h, g['w'] * w))
    elif m is None:
        kq['loi'] = 'khong thay mieng'
        return kq
    else:
        c, nhan = m
        ct = do_mieng_chi_tiet(dt, c, nhan)
        tam = ct['tam']
        kq['mouth'] = dict(x=float(tam[0]) / w, y=float(tam[1]) / h, w=ct['rong'] / w, h=ct['cao'] / h, rot=ct['goc'], curve=ct['cong'] / w)
        pix = dt['lab'][nhan == c['id']]
        tt = np.argsort(pix[:, 0])[:max(5, len(pix) // 3)]
        kq['line'] = hex_(lab_sang_rgb(np.median(pix[tt], axis=0)))
        kq['skin'] = hex_(mau_da_quanh(dt, tam[0], tam[1], ct['rong']))
    eye_pix = []
    for a in mat:
        x0, y0 = int(a['cx'] - 3), int(a['cy'] - 3)
        eye_pix.append(dt['lab'][y0:y0 + 7, x0:x0 + 7].reshape(-1, 3))
    kq['eye'] = hex_(lab_sang_rgb(np.median(np.concatenate(eye_pix), axis=0)))
    kq['daMat'] = hex_(lab_sang_rgb(dt['da']))
    kq['bg'] = hex_(np.median(np.concatenate([im[:6, :6].reshape(-1, 3), im[:6, -6:].reshape(-1, 3), im[-6:, :6].reshape(-1, 3), im[-6:, -6:].reshape(-1, 3)]), axis=0))
    # chop mat: chi khi mat la cham don gian
    ok, dts, ly_do = kiem_mat_don(dt, kq['eyes'], w, h, (goc or {}).get('_dtMat'))
    kq['blink'] = bool(ok)
    if not ok:
        kq['blinkLyDo'] = ly_do
    if not goc:
        kq['_daLab'] = [float(v) for v in dt['da']]
        if ok:
            kq['_dtMat'] = dts
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


DUNG_SAI = 0.03   # mieng / mat cua anh bieu cam so voi neo trung tinh (chuan hoa theo rong anh)


def so_voi_goc(ket, goc):
    """Do lech cua anh bieu cam so voi neo trung tinh: mieng (dx, dy, ti le rong), mat (dx, dy lon nhat)."""
    if not goc or 'mouth' not in ket or 'mouth' not in goc:
        return None
    m, g = ket['mouth'], goc['mouth']
    dm = (m['x'] - g['x'], m['y'] - g['y'], m['w'] / max(1e-6, g['w']) - 1)
    return dict(mieng=[round(v, 4) for v in dm], mat=ket.get('matLech'))


def ve_kiem_tra(im, ket, ten, to=1.25):
    """Anh kiem tra: ve neo len ban phong to vung mat (crop quanh mat/mieng), kem nhan."""
    h, w = im.shape[:2]
    p = Image.fromarray(im).resize((int(w * to), int(h * to)), Image.LANCZOS)
    g = ImageDraw.Draw(p)
    if 'eyes' in ket:
        for e in ket['eyes']:
            x, y, r = e['x'] * w * to, e['y'] * h * to, max(3, e['r'] * w * to)
            g.ellipse([x - r - 3, y - r - 3, x + r + 3, y + r + 3], outline=(0, 200, 0) if ket.get('blink') else (255, 0, 0), width=1)
    if 'mouth' in ket:
        m = ket['mouth']
        cx, cy, ww = m['x'] * w * to, m['y'] * h * to, m['w'] * w * to
        ca, sa = math.cos(m['rot']), math.sin(m['rot'])
        g.line([cx - ca * ww / 2, cy - sa * ww / 2, cx + ca * ww / 2, cy + sa * ww / 2], fill=(0, 120, 255), width=1)
        g.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], outline=(0, 120, 255), width=1)
        if m.get('clipTop') is not None:
            yy = m['clipTop'] * h * to
            g.line([cx - ww, yy, cx + ww, yy], fill=(255, 0, 255), width=1)
        if 'skin' in ket:
            g.rectangle([cx - ww * 0.9, cy + ww * 0.9, cx - ww * 0.9 + 14, cy + ww * 0.9 + 14], fill=tuple(int(ket['skin'][i:i + 2], 16) for i in (1, 3, 5)), outline=(0, 0, 0))
    x0, x1, y0, y1 = int(.2 * w * to), int(.8 * w * to), int(.2 * h * to), int(.64 * h * to)
    c = p.crop((x0, y0, x1, y1))
    gg = ImageDraw.Draw(c)
    dl = ket.get('lech')
    nhan = ten + ' [' + ket.get('nguon', '') + (',rb' if ket.get('rangBuoc') else '') + (',THEO-GOC' if ket.get('theoGoc') else '') + (',blink' if ket.get('blink') else '') + ']'
    if dl:
        nhan += ' m%+.3f,%+.3f' % (dl['mieng'][0], dl['mieng'][1])
    gg.rectangle([0, 0, c.size[0], 12], fill=(255, 255, 255))
    gg.text((3, 0), nhan, fill=(200, 0, 120))
    return np.array(c)


def lam_tron(v):
    if isinstance(v, float):
        return round(v, 4)
    if isinstance(v, dict):
        return {k: lam_tron(x) for k, x in v.items()}
    if isinstance(v, list):
        return [lam_tron(x) for x in v]
    return v


def gon_rig(k):
    """Ban ghi rig gui cho trinh duyet: bo truong chi de kiem tra (lech, matLech, blinkLyDo, brow), lam tron 4 chu so."""
    return lam_tron({a: b for a, b in k.items() if a not in ('lech', 'matLech', 'blinkLyDo', 'brow', 'browGiaLap')})


THU_TU_CX = ['binh_thuong', 'binh_thuong_kin'] + CAM_XUC[1:]
LAP_GOC = {'sensei': 'giao-vien'}


def chay(tam_thoi, sheet_dir, them=()):
    ket_qua = {}
    tiles = {}
    thieu = []
    ds = tim_anh(them)
    theo_nv = {}
    for f, id_ in ds:
        id_ = LAP_GOC.get(id_, id_)
        try:
            rel = os.path.relpath(f, GOC).replace('\\', '/')
        except ValueError:
            rel = f.replace('\\', '/')
        theo_nv.setdefault(id_, []).append((rel, f))
    bao_cao = []
    for id_ in sorted(theo_nv):
        tep = dict(theo_nv[id_])
        ung_goc = [r for r in tep if r.endswith('/%s/binh_thuong.webp' % id_)] + [r for r in tep if os.path.basename(r).startswith('nv-')] + list(tep)
        ds_anh = sorted(tep, key=lambda r: (THU_TU_CX.index(os.path.basename(r)[:-5]) if os.path.basename(r)[:-5] in THU_TU_CX else -1, r))
        goc = None
        goc_rel = ung_goc[0]
        im = doc_anh(tep[goc_rel])
        goc = phan_tich(im, eyes_cuong=(GHI_DE.get(id_) or {}).get('eyes') or (GHI_DE.get(goc_rel) or {}).get('eyes'))
        goc = ap_ghi_de(goc, goc_rel, id_)
        ap_skin_at(goc, im)
        if 'mouth' in goc:
            goc['mouth']['wGoc'] = goc['mouth']['w']
        ket_qua[goc_rel] = goc
        tiles.setdefault(id_, []).append((goc_rel, im))
        for rel in ds_anh:
            if rel == goc_rel:
                continue
            im = doc_anh(tep[rel])
            ket = phan_tich(im, goc if 'mouth' in goc else None)
            ket = ap_ghi_de(ket, rel, id_)
            ap_skin_at(ket, im)
            ket['lech'] = so_voi_goc(ket, goc)
            if 'mouth' in ket and 'mouth' in goc:
                ket['mouth']['wGoc'] = goc['mouth']['w']
            ket_qua[rel] = ket
            tiles[id_].append((rel, im))
    for rel, k in ket_qua.items():
        k.pop('_dtMat', None)
        k.pop('_daLab', None)
        if 'mouth' not in k:
            thieu.append(rel)
    # bao cao lech
    lech_nhieu = []
    for rel, k in sorted(ket_qua.items()):
        dl = k.get('lech')
        if dl and (max(abs(dl['mieng'][0]), abs(dl['mieng'][1])) > DUNG_SAI or (dl['mat'] is not None and dl['mat'] > DUNG_SAI)):
            lech_nhieu.append((rel, dl))
    # tam sheet: 2 nhan vat / sheet
    os.makedirs(sheet_dir, exist_ok=True)
    ids = sorted(tiles)
    for si in range(0, len(ids), 2):
        rows = []
        for id_ in ids[si:si + 2]:
            ts = sorted(tiles[id_], key=lambda t: (0 if os.path.basename(t[0]).startswith('nv-') else 1, THU_TU_CX.index(os.path.basename(t[0])[:-5]) if os.path.basename(t[0])[:-5] in THU_TU_CX else 9))
            arr = [ve_kiem_tra(im, ket_qua[rel], rel.replace('assets/minh-hoa/', '')) for rel, im in ts]
            cot = 5
            while len(arr) % cot:
                arr.append(np.full_like(arr[0], 255))
            for i in range(0, len(arr), cot):
                rows.append(np.hstack(arr[i:i + cot]))
        Image.fromarray(np.vstack(rows)).save(os.path.join(sheet_dir, 'khuon-mat-%02d.png' % (si // 2 + 1)))
    n_nv = sum(1 for r in ket_qua if '/nv/' in r)
    print('anh:', len(ket_qua), '(bieu cam %d, chan dung goc %d)' % (n_nv, len(ket_qua) - n_nv), ' khong du mieng:', len(thieu), thieu)
    print('ghi de tay:', sorted(r for r, k in ket_qua.items() if k.get('nguon') == 'ghi-de'))
    print('tim lai trong cua so (rangBuoc):', len([1 for k in ket_qua.values() if k.get('rangBuoc')]), ' theo hinh hoc goc:', sorted(r for r, k in ket_qua.items() if k.get('theoGoc')))
    print('chop mat (blink) bat:', sum(1 for k in ket_qua.values() if k.get('blink')), '/', len(ket_qua))
    print('lech > %.2f so voi neo: %d' % (DUNG_SAI, len(lech_nhieu)))
    for rel, dl in lech_nhieu:
        print('   ', rel, dl)
    with open(os.path.join(sheet_dir, 'rig-thu.json'), 'w', encoding='utf-8') as fh:
        json.dump(ket_qua, fh, ensure_ascii=False, indent=1, sort_keys=True)
    if not tam_thoi:
        os.makedirs(os.path.dirname(RIG), exist_ok=True)
        gon = {r: gon_rig(k) for r, k in ket_qua.items()}
        with open(RIG, 'w', encoding='utf-8') as fh:
            json.dump(gon, fh, ensure_ascii=False, indent=1, sort_keys=True)
        print('da ghi', RIG)
    return ket_qua


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--tam', action='store_true', help='chi in, khong ghi rig.json')
    ap.add_argument('--sheet-dir', default='E:/sensei-tam/tmp/av')
    ap.add_argument('--them', action='append', default=[], help='thu muc them <d>/<id>/<cam xuc>.webp (kiem thu)')
    a = ap.parse_args()
    chay(a.tam, a.sheet_dir, a.them)
