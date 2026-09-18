# -*- coding: utf-8 -*-
"""
Doi chieu danh muc tu vung trong curriculum/*.json voi bo du lieu MinnaNoDS.

Bo du lieu KHONG duoc nhung vao repo (xem ghi chu ban quyen o cuoi file).
Tai rieng roi tro duong dan vao:

    python tools/check_vocab.py --ds C:/path/minna-no-ds.yaml
    python tools/check_vocab.py --ds ... --lesson 3
    python tools/check_vocab.py --ds ... --edition 1

Mac dinh doi chieu theo BAN 2 (第2版).
"""
from __future__ import print_function
import argparse
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Bai 1-25 nam o n5.json, 26-50 nam o n4.json
def level_of(lesson_no):
    return "n5" if lesson_no <= 25 else "n4"


def _strip(s):
    """Bo ngoac vuong va moi dau cham cau / dau noi / khoang trang."""
    s = re.sub(r"[\[\]［］〜～~\-－・。、,\s]", "", s or "")
    return s.replace("シーディー", "CD")


def aliases(s):
    """Tra ve TAT CA cach goi cua mot muc tu vung.

    Nguon ghi "A（B）" nghia la mot muc co hai cach noi -- vi du
    "トイレ（おてあらい）" hay "だれ（どなた）" -- nen phai nhan ca hai,
    khong duoc vut ve trong ngoac di. Rieng "－かい（－がい）" chi la bien am
    nen ca hai deu tro ve cung mot muc.
    """
    s = s or ""
    inner = re.findall(r"[（(]([^）)]*)[）)]", s)
    outer = re.sub(r"[（(][^）)]*[）)]", "", s)

    # "［お］くに" y nghia la noi duoc ca "おくに" lan "くに", nen sinh ca hai ban
    forms = {outer, re.sub(r"[［\[][^］\]]*[］\]]", "", outer)}
    out = {_strip(x) for x in forms}
    out.update(_strip(x) for x in inner)
    return {x for x in out if x}


def norm(s):
    """Cach goi chinh cua mot muc (dung khi in ra man hinh)."""
    return _strip(re.sub(r"[（(][^）)]*[）)]", "", s or ""))


def load_dataset(path, edition):
    try:
        import yaml
    except ImportError:
        sys.exit("Thieu goi pyyaml. Chay: pip install pyyaml")
    with io.open(path, encoding="utf-8") as f:
        ds = yaml.safe_load(f)
    out = {}
    for n in range(1, 51):
        key = "lesson-%02d" % n
        if key not in ds:
            continue
        out[n] = [w for w in ds[key] if edition in (w.get("edition") or [])]
    return out


def load_repo_lessons():
    out = {}
    for lvl in ("n5", "n4"):
        p = os.path.join(ROOT, "curriculum", "%s.json" % lvl)
        if not os.path.exists(p):
            continue
        for les in json.load(io.open(p, encoding="utf-8")):
            out[les["lessonNumber"]] = les
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ds", required=True, help="duong dan toi minna-no-ds.yaml")
    ap.add_argument("--lesson", type=int, help="chi kiem mot bai")
    ap.add_argument("--edition", type=int, default=2, choices=(1, 2))
    args = ap.parse_args()

    src = load_dataset(args.ds, args.edition)
    repo = load_repo_lessons()

    lessons = [args.lesson] if args.lesson else sorted(repo)
    total_missing = total_extra = 0

    for n in lessons:
        if n not in src or n not in repo:
            continue
        les = repo[n]
        # Bai chi co 1 tu la stub chua soan -> bo qua cho do nhieu
        if len(les.get("vocabList") or []) <= 2 and not args.lesson:
            continue

        # Mot muc nguon co the co nhieu cach goi -> dang ky het vao bang tra
        smap, skeys = {}, {}
        for w in src[n]:
            key = norm(w["kana"])
            skeys[key] = w
            for a in aliases(w["kana"]):
                smap.setdefault(a, key)
        mine, mkeys = {}, {}
        for v in les["vocabList"]:
            key = norm(v["word"])
            mkeys[key] = v
            for a in aliases(v["word"]):
                mine.setdefault(a, key)

        hit = {smap[a] for a in smap if a in mine}
        missing = [k for k in skeys if k not in hit]
        matched_mine = {mine[a] for a in mine if a in smap}
        extra = [k for k in mkeys if k not in matched_mine]
        smap, mine = skeys, mkeys
        total_missing += len(missing)
        total_extra += len(extra)

        status = "OK" if not missing and not extra else "LECH"
        print("=== Bai %-2d (%s) === nguon(ban %d)=%d  repo=%d  [%s]"
              % (n, level_of(n).upper(), args.edition, len(smap), len(mine), status))

        if missing:
            print("  THIEU %d muc:" % len(missing))
            for k in sorted(missing):
                w = smap[k]
                kanji = (" / %s" % w["kanji"]) if w.get("kanji") else ""
                print("     %s%s  --  %s" % (w["kana"], kanji, w["meaning"]["en"]))
        if extra:
            print("  THUA  %d muc (khong co trong bai nay cua sach):" % len(extra))
            for k in sorted(extra):
                print("     %s  --  %s" % (mine[k]["word"], mine[k]["meaningVi"]))
        if missing or extra:
            print("")

    print("Tong: thieu %d, thua %d" % (total_missing, total_extra))
    return 1 if (total_missing or total_extra) else 0


if __name__ == "__main__":
    sys.exit(main())

# ---------------------------------------------------------------------------
# GHI CHU BAN QUYEN
#
# Bo du lieu MinnaNoDS (github.com/vitto4/MinnaNoDS) khong kem giay phep.
# Tac gia ghi ro trong file:
#   - Danh muc tu va ban dich thuoc so huu cua 3A Corporation.
#   - Chi duoc dung KEM sach, khong duoc dung THAY sach.
#   - KHONG duoc dung cho muc dich thuong mai.
#
# Vi vay file yaml KHONG duoc commit vao repo nay. Script chi doc no tu duong
# dan ben ngoai, dung de DOI CHIEU danh muc tu vung tu soan -- khong sao chep
# ban dich hay cau vi du cua sach.
# ---------------------------------------------------------------------------
