# -*- coding: utf-8 -*-
"""
Gan anh minh hoa AI (Qwen-Image-2512, Apache 2.0; webp 512x512 nen kem #f0ebe1) vao giao trinh.

Nguon su that: tools/minh_hoa_chi_muc.json (chi muc cua dot sinh anh):
  muc[id] = {ten, cap, webp, trangThai: ok | giu-svg, ...}
  - voc-<cap>-<bai>-<so>  : tu vung (id trung id trong vocabList)
  - canh-<cap>-<bai>      : tranh tinh huong hoi thoai cua bai
  - nv-<ten>              : chan dung nhan vat hoi thoai
  trangThai giu-svg -> KHONG gan anh, app tu dung hinh ve SVG cu (js/illustrations*.js).

Script ghi vao tung bai curriculum/<cap>/<so>.json:
  vocabList[i].imageUrl / imageAlt   "assets/minh-hoa/<tep>.webp" / nghia tieng Viet
  dialogue[i].avatarUrl              chan dung nguoi noi (neu co)
  sceneImageUrl / sceneImageAlt      tranh tinh huong hoi thoai (ngay sau "description")
Cap KANA khong co anh rieng: tu vung dung lai anh cua tu cung cach doc + cung chu Han o N5..N1
(uu tien N5). kanjiList (chu cai kana) khong bao gio co anh.

Chay lai bao nhieu lan cung duoc (idempotent): chi ghi tep khi noi dung doi; giu nguyen dinh
dang tep (indent 2, ensure_ascii=False, kieu xuong dong va dong trong cuoi cua tung tep).
Cac script sinh bai (tools/n5_lib.py merge()...) ghi de ca bai -> chay lai script nay sau do.

  python tools/gan_anh.py                           # gan / cap nhat
  python tools/gan_anh.py --kiem                    # chi kiem, co thay doi thi thoat 1
  python tools/gan_anh.py --nguon-anh <thu muc webp> # chep anh "ok" vao assets/minh-hoa truoc
"""
from __future__ import print_function
import argparse
import glob
import io
import json
import os
import shutil
import sys
from collections import Counter, OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUR = os.path.join(ROOT, "curriculum")
ANH_DIR = os.path.join(ROOT, "assets", "minh-hoa")
URL_GOC = "assets/minh-hoa/"
CHI_MUC = os.path.join(ROOT, "tools", "minh_hoa_chi_muc.json")
CAP = ["kana", "n5", "n4", "n3", "n2", "n1"]
UU_TIEN_CAP = {"n5": 0, "n4": 1, "n3": 2, "n2": 3, "n1": 4}

# ---- Nguoi noi -> chan dung. Nhan vat co ten: moi bai co ten do. Vai chung (thay giao, nhan
# vien, le tan...) chi o dung nhung bai ma chan dung duoc ve cho (moi bai mot nguoi khac nhau).
NHAN_VAT = {
    u"田中": "nv-tanaka",
    u"サントス": "nv-santos",
    u"ワン": "nv-wang",
    u"山田": "nv-yamada", u"山田一郎": "nv-yamada", u"山田 (Yamada)": "nv-yamada",
    u"ミラー": "nv-miller", u"ミラー (Miller)": "nv-miller",
    u"佐藤 (Satou)": "nv-sato", u"さとう (Satou)": "nv-sato",
    u"グプタ": "nv-gupta",
    u"カリナ": "nv-karina",
    u"マリア": "nv-maria",
    u"山本": "nv-yamamoto",
    u"鈴木": "nv-suzuki",
}
VAI_CHUNG = {
    u"先生": "nv-sensei", u"せんせい (Sensei)": "nv-sensei",
    u"店員": "nv-tenin", u"てんいん (Nhân viên)": "nv-tenin",
    u"受付": "nv-uketsuke",
    u"社長": "nv-shacho",
    u"教授": "nv-kyoju",
    u"選手": "nv-senshu",
}
# Bai co ve vai chung (lay tu prompt canh: nhanVat cua tranh tinh huong tung bai)
BAI_VAI_CHUNG = {
    "nv-sensei": {"n5-15", "n5-19", "n4-45"},
    "nv-tenin": {"n5-3", "n5-11"},
    "nv-uketsuke": {"n5-4", "n4-49"},
    "nv-shacho": {"n1-9", "n1-10"},
    "nv-kyoju": {"n1-14", "n1-15"},
    "nv-senshu": {"n4-33", "n1-12"},
}

# ---- KANA: ngoai le khi dung lai anh N5..N1
KANA_BO_QUA = {
    "voc-kana-10-8",   # いただきます (cau truoc bua an) != 頂きます N4 (nhan, khiem nhuong)
}
KANA_CHI_DINH = {
    "voc-kana-1-3": "voc-n5-3-21",   # いえ 家 (ngoi nha) = うち 家 N5: cung tranh ngoi nha
}


def doc_bai(path):
    """-> (bai, kieu xuong dong, co dong trong cuoi khong)"""
    raw = io.open(path, "rb").read()
    s = raw.decode("utf-8")
    eol = "\r\n" if "\r\n" in s else "\n"
    s = s.replace("\r\n", "\n")
    return json.loads(s, object_pairs_hook=OrderedDict), eol, s.endswith("\n")


def ghi_bai(path, bai, eol, cuoi):
    s = json.dumps(bai, ensure_ascii=False, indent=2)
    if cuoi:
        s += "\n"
    if eol != "\n":
        s = s.replace("\n", eol)
    data = s.encode("utf-8")
    if io.open(path, "rb").read() == data:
        return False
    io.open(path, "wb").write(data)
    return True


def cua_minh(url):
    return isinstance(url, str) and url.startswith(URL_GOC)


def dat_sau(bai, sau_khoa, cap):
    """Dat cac cap (khoa, gia tri) ma script quan ly ngay SAU `sau_khoa` cua mot doi tuong (bai,
    tu, cau thoai). `sau_khoa` khong bao gio la khoa cuoi -> dong truoc khong phai them dau phay,
    git diff chi co dong them. gia tri None -> xoa. Url do nguoi khac dien (ngoai assets/minh-hoa/)
    -> giu nguyen ca cap. -> (doi tuong moi, co doi khong)"""
    url_cu = bai.get(cap[0][0])
    if url_cu is not None and not cua_minh(url_cu):
        return bai, False
    quan_ly = [k for k, _ in cap]
    moi = OrderedDict()

    def chen():
        for kk, vv in cap:
            if vv is not None:
                moi[kk] = vv
    for k, v in bai.items():
        if k in quan_ly:
            continue
        moi[k] = v
        if k == sau_khoa:
            chen()
    if sau_khoa not in bai:
        chen()
    return moi, list(moi.items()) != list(bai.items())


def main():
    ap = argparse.ArgumentParser(description="Gan anh minh hoa AI vao curriculum/*/N.json")
    ap.add_argument("--chi-muc", default=CHI_MUC)
    ap.add_argument("--nguon-anh", help="thu muc webp goc: chep cac tep 'ok' vao assets/minh-hoa")
    ap.add_argument("--kiem", action="store_true", help="khong ghi; co thay doi thi thoat 1")
    a = ap.parse_args()

    muc = json.load(io.open(a.chi_muc, encoding="utf-8"))["muc"]
    can = sorted({m["webp"] for m in muc.values() if m.get("trangThai") == "ok" and m.get("webp")})

    if a.nguon_anh:
        os.makedirs(ANH_DIR, exist_ok=True)
        chep = 0
        for ten in can:
            nguon, dich = os.path.join(a.nguon_anh, ten), os.path.join(ANH_DIR, ten)
            if not os.path.isfile(nguon):
                print("[CANH BAO] thieu tep nguon %s" % nguon)
                continue
            if os.path.isfile(dich) and io.open(dich, "rb").read() == io.open(nguon, "rb").read():
                continue
            if not a.kiem:
                shutil.copyfile(nguon, dich)
            chep += 1
        print("Chep anh: %d tep moi/doi (%d tep 'ok' trong chi muc)" % (chep, len(can)))

    co_tep = set(os.listdir(ANH_DIR)) if os.path.isdir(ANH_DIR) else set()
    thieu = [t for t in can if t not in co_tep]
    if thieu:
        print("[CANH BAO] %d tep anh chua co trong assets/minh-hoa (vd %s) -> bo qua muc do"
              % (len(thieu), ", ".join(thieu[:3])))

    def anh(id_):
        m = muc.get(id_)
        if not m or m.get("trangThai") != "ok" or not m.get("webp") or m["webp"] not in co_tep:
            return None
        return URL_GOC + m["webp"]

    # ---- doc moi bai
    bai_cua = {}   # (cap, so) -> [path, bai, eol, cuoi]
    for cap in CAP:
        for p in glob.glob(os.path.join(CUR, cap, "*.json")):
            if os.path.basename(p) == "index.json":
                continue
            bai, eol, cuoi = doc_bai(p)
            bai_cua[(cap, bai["lessonNumber"])] = [p, bai, eol, cuoi]

    # ---- chi muc dung lai cho KANA: (cach doc, chu Han) -> url, uu tien N5 -> N1, bai som truoc
    def han(v):
        k = (v.get("kanji") or "").strip()
        return "" if k == (v.get("word") or "").strip() else k

    ung_vien = {}
    for (cap, so), (_, bai, _, _) in sorted(bai_cua.items(), key=lambda x: (UU_TIEN_CAP.get(x[0][0], 9), x[0][1])):
        if cap == "kana":
            continue
        for v in bai.get("vocabList") or []:
            u = anh(v.get("id"))
            if u:
                ung_vien.setdefault(v.get("word"), []).append((han(v), u, v.get("id")))

    def anh_kana(v):
        if v["id"] in KANA_BO_QUA:
            return None
        if v["id"] in KANA_CHI_DINH:
            return anh(KANA_CHI_DINH[v["id"]])
        k = han(v)
        for kc, u, _ in ung_vien.get(v.get("word"), []):
            if not k or not kc or k == kc:
                return u
        return None

    dem = {c: Counter() for c in CAP}
    tep_doi = []
    for (cap, so), rec in sorted(bai_cua.items(), key=lambda x: (CAP.index(x[0][0]), x[0][1])):
        p, bai, eol, cuoi = rec
        doi = False
        # tu vung: anh ngay sau nghia (meaningVi)
        ds = bai.get("vocabList") or []
        for i, v in enumerate(ds):
            dem[cap]["tu"] += 1
            if v.get("imageUrl") and not cua_minh(v["imageUrl"]):
                dem[cap]["co-anh"] += 1        # anh do nguoi khac dien: giu nguyen
                continue
            u = anh_kana(v) if cap == "kana" else anh(v.get("id"))
            alt = ((v.get("meaningVi") or "").strip() or None) if u else None
            ds[i], d = dat_sau(v, "meaningVi", [("imageUrl", u), ("imageAlt", alt)])
            doi |= d
            dem[cap]["co-anh" if u else "khong-anh"] += 1
            if not u and muc.get(v.get("id"), {}).get("trangThai") == "giu-svg":
                dem[cap]["giu-svg"] += 1
        # chan dung nguoi noi: ngay sau speakerRole
        khoa_bai = "%s-%s" % (cap, so)
        ds = bai.get("dialogue") or []
        for i, l in enumerate(ds):
            ten = (l.get("speaker") or "").strip()
            nv = NHAN_VAT.get(ten)
            if not nv and ten in VAI_CHUNG and khoa_bai in BAI_VAI_CHUNG.get(VAI_CHUNG[ten], ()):
                nv = VAI_CHUNG[ten]
            u = anh(nv) if nv else None
            ds[i], d = dat_sau(l, "speakerRole", [("avatarUrl", u)])
            doi |= d
            dem[cap]["cau-thoai"] += 1
            if u:
                dem[cap]["co-chan-dung"] += 1
        # tranh tinh huong: ngay sau description
        u = anh("canh-%s-%s" % (cap, so))
        alt = None
        if u:
            alt = u"Tranh tình huống hội thoại — " + (bai.get("title") or "")
            dem[cap]["co-tranh-canh"] += 1
        moi, d = dat_sau(bai, "description", [("sceneImageUrl", u), ("sceneImageAlt", alt)])
        if d:
            rec[1] = bai = moi
            doi = True
        if doi:
            tep_doi.append(p)
            if not a.kiem:
                ghi_bai(p, bai, eol, cuoi)

    print("%-5s %6s %7s %9s %8s %10s %12s %10s" % ("cap", "tu", "co-anh", "khong-anh", "giu-svg",
                                                  "cau-thoai", "co-chan-dung", "tranh-canh"))
    for c in CAP:
        d = dem[c]
        print("%-5s %6d %7d %9d %8d %10d %12d %10d" % (c, d["tu"], d["co-anh"], d["khong-anh"],
              d["giu-svg"], d["cau-thoai"], d["co-chan-dung"], d["co-tranh-canh"]))
    print("%s %d tep bai" % ("Can cap nhat:" if a.kiem else "Da ghi:", len(tep_doi)))
    if a.kiem and tep_doi:
        sys.exit(1)


if __name__ == "__main__":
    main()
