# lam-nen.py - lam phang nen: loang (flood fill) tu vien anh qua vung nen gan dong mau,
# thay bang dung mau #f0ebe1 (240,235,225), chuyen tiep mem, khong dung vao chu the.
# Cach dung:
#   python lam-nen.py <thu-muc-vao> <thu-muc-ra> [--tol 2.5] [--chuyen 6] [--mem 14] [--mask]
# Nguyen tac (d = khoang cach mau Delta E trong Lab toi mau nen goc):
#   1) mau nen goc = trung vi dai vien ngoai 8 px (nen Qwen rat deu: Delta E p95 ~1.5)
#   2) VUNG NEN = diem co d < mem VA noi lien voi vien anh qua cac diem cung d < mem (loang tu vien).
#      Chu the co net muc bao quanh (ao blouse trang...) khong bi loang toi vi net muc chan lai.
#   3) Trong vung nen: out = anh + (#f0ebe1 - nen goc) * w(d) - (anh - nen goc) * z(d)
#        z = 1 khi d <= tol (xoa nhieu -> DUNG #f0ebe1), giam muot ve 0 o d = chuyen
#        w = 1 khi d <= chuyen, giam muot ve 0 o d = mem (quang sang bong den dich mau dan, khong co vien)
#      -> ham lien tuc theo d nen khong co bac/vien cung; do lech toi da voi anh goc = |#f0ebe1 - nen goc| (~Delta E 4)
#   0) Bo qua anh neu nen o vien lech #f0ebe1 > lech (Delta E) hoac vien khong dong mau (canh tran vien).
#   4) Lo nhieu nho (< lo px, d < tol+3) nam trong vung nen duoc lap. Tui nen kin (giua 2 tay) giu nguyen.
import os, glob, argparse
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

NEN = np.array([240, 235, 225], dtype=np.float32)

ap = argparse.ArgumentParser()
ap.add_argument('vao'); ap.add_argument('ra')
ap.add_argument('--tol', type=float, default=2.5)    # d <= tol: gan dung #f0ebe1
ap.add_argument('--chuyen', type=float, default=6.0) # tol..chuyen: tra dan sac do goc (nhieu/quang)
ap.add_argument('--mem', type=float, default=14.0)   # chuyen..mem: dich mau giam dan ve 0 (hep: khong quet vao the/ao trang khi nen be)
ap.add_argument('--lech', type=float, default=25.0)  # nen goc lech #f0ebe1 qua muc nay -> bo qua anh (nen Qwen dao dong trang..be)
ap.add_argument('--lo', type=int, default=900)       # lo nhieu nho hon so px nay trong loi nen thi lap
ap.add_argument('--khung', action='store_true')      # go the/khung sang (o nen) nam sau chu the, noi voi vien
ap.add_argument('--moi', action='store_true')        # chi xu ly anh chua co dau ra
ap.add_argument('--mask', action='store_true')       # ghi them anh trong so de kiem tra
a = ap.parse_args()


def srgb_lab(x):
    # RGB 0..255 -> CIE Lab (D65)
    c = x / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]], dtype=np.float32)
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883], dtype=np.float32)
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def noi_vien(mask):
    # giu cac thanh phan lien thong cua mask co cham vien anh
    nhan, n = ndi.label(mask)
    if not n:
        return mask
    cham = np.unique(np.concatenate([nhan[0], nhan[-1], nhan[:, 0], nhan[:, -1]]))
    return np.isin(nhan, cham[cham > 0])


def ss(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def go_khung(im, vung, d):
    # 5) the/khung: trong vung nen (loang tu vien) co 1 mang lon mau dong deu nhung lech nen (the sang/toi hon nen)
    #    -> mang >= 12% anh, do lech d trung vi 3..14, do lech chuan d < 1.5 (dong deu, khong phai quang sang) -> dat ve dung nen.
    #    Vien bong mong cua the (nam ngoai vung) duoc gop neu mong <= 5 px va sang (L > 70).
    t = ndi.binary_opening(vung & (d > 3), iterations=3)
    lb, n = ndi.label(t)
    if not n:
        return vung, 0.0
    sz = ndi.sum(np.ones_like(d), lb, range(1, n + 1))
    k = np.zeros_like(vung)
    for i in np.where(sz >= 0.12 * d.size)[0] + 1:
        c = lb == i
        if d[c].std() < 1.5:
            k |= c
    if not k.any():
        return vung, 0.0
    k = ndi.binary_dilation(k, iterations=2) & vung
    L = srgb_lab(im)[..., 0]
    ngoai = ndi.binary_dilation(k, iterations=5) & ~vung & (L > 70)
    mong = ngoai & ~ndi.binary_opening(ngoai | ~ndi.binary_dilation(k, iterations=5), iterations=4)
    k |= mong
    d[k] = 0.0
    return vung | k, float(k.mean())


def xu_ly(p, q):
    im = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
    b = 8
    vien = np.concatenate([im[:b].reshape(-1, 3), im[-b:].reshape(-1, 3), im[:, :b].reshape(-1, 3), im[:, -b:].reshape(-1, 3)])
    nen_goc = np.median(vien, 0)
    lab_ng = srgb_lab(nen_goc[None, None, :])[0, 0]
    d = np.linalg.norm(srgb_lab(im) - lab_ng, axis=-1)
    # an toan: vien khong phai nen kem dong mau (canh tran vien, nen xam...) thi KHONG sua, chep nguyen
    lech = np.linalg.norm(lab_ng - srgb_lab(NEN[None, None, :])[0, 0])
    d_vien = np.linalg.norm(srgb_lab(vien[None]) - lab_ng, axis=-1)
    if lech > a.lech or np.percentile(d_vien, 60) > a.tol:
        Image.fromarray(im.astype(np.uint8)).save(q)
        return nen_goc, None, 'lech %.0f, vien p60 %.1f' % (lech, np.percentile(d_vien, 60)), 0.0
    vung = noi_vien(d < a.mem)
    khung = 0.0
    if a.khung:
        vung, khung = go_khung(im, vung, d)
    # lap lo nhieu nho trong vung nen
    lo_nhan, m = ndi.label(~vung)
    if m:
        kt = ndi.sum(np.ones_like(d), lo_nhan, index=np.arange(1, m + 1))
        vung |= np.isin(lo_nhan, np.where(kt < a.lo)[0] + 1) & (d < a.tol + 3)
    z = 1 - ss((d - a.tol) / (a.chuyen - a.tol))
    w = 1 - ss((d - a.chuyen) / (a.mem - a.chuyen))
    z[~vung] = 0; w[~vung] = 0
    out = im + (NEN - nen_goc)[None, None, :] * w[..., None] - (im - nen_goc[None, None, :]) * z[..., None]
    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(q)
    if a.mask:
        Image.fromarray((w * 255).astype(np.uint8)).save(q[:-4] + '.mask.png')
    return nen_goc, (z >= 0.999).mean(), ((w > 0) & (z < 0.999)).mean(), khung


os.makedirs(a.ra, exist_ok=True)
for p in sorted(glob.glob(os.path.join(a.vao, '*.png'))):
    if p.endswith('.tmp.png') or p.endswith('.mask.png'):
        continue
    if a.moi and os.path.exists(os.path.join(a.ra, os.path.basename(p))):
        continue
    ng, ti, tm, kh = xu_ly(p, os.path.join(a.ra, os.path.basename(p)))
    if ti is None:
        print('%-28s nen goc (%3d,%3d,%3d) %s -> BO QUA (chep nguyen)' % (os.path.basename(p), ng[0], ng[1], ng[2], tm))
        continue
    print('%-28s nen goc (%3d,%3d,%3d) -> #f0ebe1  dung-mau %.0f%%  chuyen-tiep %.1f%%%s' % (os.path.basename(p), ng[0], ng[1], ng[2], ti * 100, tm * 100, ('  GO_KHUNG %.0f%%' % (kh * 100)) if kh else ''))
