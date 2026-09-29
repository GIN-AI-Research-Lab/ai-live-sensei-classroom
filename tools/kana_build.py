# -*- coding: utf-8 -*-
"""
Dung lai curriculum/kana/index.json (cap Nhap mon — bang chu kana) tu cac
file bai hoc curriculum/kana/<so>.json.

Chay:  python tools/kana_build.py            # ghi lai index.json
       python tools/kana_build.py --check    # chi kiem tra index.json co khop khong

Khac voi n5_lib.merge(): script nay KHONG ghi lai cac file bai hoc, chi doc
chung de tinh so luong. Dinh dang index giong het curriculum/n5/index.json:
  [{lessonNumber, level, title, description,
    vocabCount, kanjiCount, slideCount, dialogueCount, exerciseCount}, ...]
"""
from __future__ import print_function
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KANA_DIR = os.path.join(ROOT, "curriculum", "kana")
LEVEL = "KANA"

# khoa bat buoc cua mot bai (giong n5_lib.lesson())
LESSON_KEYS = ["level", "lessonNumber", "title", "description",
               "vocabList", "kanjiList", "slides", "dialogue", "exercises"]


def load_lessons(dir_path=KANA_DIR):
    """Doc moi file <so>.json (bo qua index.json), tra ve dict so_bai -> bai."""
    by_num = {}
    for fname in os.listdir(dir_path):
        if not fname.endswith(".json") or fname == "index.json":
            continue
        with io.open(os.path.join(dir_path, fname), encoding="utf-8") as f:
            les = json.load(f)
        missing = [k for k in LESSON_KEYS if k not in les]
        if missing:
            raise SystemExit("[LOI] %s thieu khoa: %s" % (fname, ", ".join(missing)))
        if les["level"] != LEVEL:
            raise SystemExit("[LOI] %s co level='%s', can '%s'" % (fname, les["level"], LEVEL))
        if fname != "%d.json" % les["lessonNumber"]:
            raise SystemExit("[LOI] %s nhung lessonNumber=%s" % (fname, les["lessonNumber"]))
        by_num[les["lessonNumber"]] = les
    return by_num


def build_index(by_num):
    """Tao danh sach index nhe, sap theo so bai."""
    index = []
    for n in sorted(by_num):
        les = by_num[n]
        index.append({
            "lessonNumber": les["lessonNumber"],
            "level": les["level"],
            "title": les["title"],
            "description": les.get("description", ""),
            "vocabCount": len(les.get("vocabList") or []),
            "kanjiCount": len(les.get("kanjiList") or []),
            "slideCount": len(les.get("slides") or []),
            "dialogueCount": len(les.get("dialogue") or []),
            "exerciseCount": len(les.get("exercises") or []),
        })
    return index


def main():
    check_only = "--check" in sys.argv[1:]
    by_num = load_lessons()
    if not by_num:
        raise SystemExit("[LOI] khong co bai nao trong curriculum/kana")
    index = build_index(by_num)
    path = os.path.join(KANA_DIR, "index.json")

    if check_only:
        try:
            with io.open(path, encoding="utf-8") as f:
                current = json.load(f)
        except (IOError, OSError, ValueError):
            current = None
        if current != index:
            print("[LOI] curriculum/kana/index.json chua khop cac file bai hoc — chay lai kana_build.py")
            return 1
        print("[OK] curriculum/kana/index.json khop %d bai" % len(index))
        return 0

    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print("[OK] curriculum/kana: %d bai -> index.json" % len(index))
    for row in index:
        print("   B%02d  tu vung=%2d  kana=%2d  slide=%d  thoai=%d  bai tap=%2d  | %s"
              % (row["lessonNumber"], row["vocabCount"], row["kanjiCount"], row["slideCount"],
                 row["dialogueCount"], row["exerciseCount"], row["title"][:48]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
