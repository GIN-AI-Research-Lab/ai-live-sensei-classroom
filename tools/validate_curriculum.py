# -*- coding: utf-8 -*-
"""
Kiem tra tinh toan ven giao trinh N5-N1 truoc khi commit.

Chay:  python tools/validate_curriculum.py
       python tools/validate_curriculum.py --level n5
       python tools/validate_curriculum.py --thin      # chi liet ke bai chua soan du

Kiem tra:
  1. Schema: du 9 khoa bat buoc cua mot lesson.
  2. ID trung lap trong toan bo mot cap (voc-*, kan-*, ex-*, dia-*, t-*, slide).
  3. Bai tap: correctIndex tro dung vao options, khong co dap an trung chu.
  4. Ruby: token co kanji thi phai co furigana.
  5. Do day: doi chieu voi nguong cua bai mau (30 tu / 8 kanji / 6 slide / 10 thoai / 10 bai tap).
"""
from __future__ import print_function
import io
import json
import os
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEVELS = ["n5", "n4", "n3", "n2", "n1"]

LESSON_KEYS = ["level", "lessonNumber", "title", "description",
               "vocabList", "kanjiList", "slides", "dialogue", "exercises"]

# Nguong "da soan du", lay theo bai 1 N5
FULL = {"vocabList": 20, "kanjiList": 5, "slides": 4, "dialogue": 6, "exercises": 8}


def tokens_of(lesson):
    """Tra ve (token_id, token) cho moi token trong slide va hoi thoai."""
    for s in lesson.get("slides") or []:
        for e in s.get("examples") or []:
            for tok in e.get("tokens") or []:
                yield tok
    for d in lesson.get("dialogue") or []:
        for tok in d.get("tokens") or []:
            yield tok


def check_level(lvl, errors, warnings, thin_rows):
    path = os.path.join(ROOT, "curriculum", "%s.json" % lvl)
    if not os.path.exists(path):
        errors.append("%s: khong tim thay file" % lvl)
        return
    data = json.load(io.open(path, encoding="utf-8"))

    seen_ids = Counter()
    seen_lessons = Counter()

    for les in data:
        num = les.get("lessonNumber", "?")
        tag = "%s b%s" % (lvl.upper(), num)
        seen_lessons[num] += 1

        for key in LESSON_KEYS:
            if key not in les:
                errors.append("%s: thieu khoa '%s'" % (tag, key))

        if les.get("level", "").lower() != lvl:
            errors.append("%s: truong level='%s' khong khop file" % (tag, les.get("level")))

        for item in (les.get("vocabList") or []):
            seen_ids[item.get("id")] += 1
        for item in (les.get("kanjiList") or []):
            seen_ids[item.get("id")] += 1
        for s in (les.get("slides") or []):
            seen_ids[s.get("slideId")] += 1
            for e in (s.get("examples") or []):
                seen_ids[e.get("id")] += 1
        for d in (les.get("dialogue") or []):
            seen_ids[d.get("id")] += 1
        for tok in tokens_of(les):
            seen_ids[tok.get("id")] += 1
            if tok.get("kanji") and not tok.get("furigana"):
                errors.append("%s: token '%s' co kanji nhung thieu furigana" % (tag, tok.get("id")))

        for qz in (les.get("exercises") or []):
            seen_ids[qz.get("id")] += 1
            opts = qz.get("options") or []
            ci = qz.get("correctIndex")
            if not isinstance(ci, int) or not (0 <= ci < len(opts)):
                errors.append("%s: bai tap '%s' correctIndex=%r nhung co %d lua chon"
                              % (tag, qz.get("id"), ci, len(opts)))
            if len(set(opts)) != len(opts):
                errors.append("%s: bai tap '%s' co lua chon trung chu" % (tag, qz.get("id")))
            if not (qz.get("explanation") or "").strip():
                warnings.append("%s: bai tap '%s' chua co giai thich" % (tag, qz.get("id")))

        missing = {k: len(les.get(k) or []) for k in FULL if len(les.get(k) or []) < FULL[k]}
        if missing:
            thin_rows.append((tag, les.get("title", "")[:46], missing))

    for num, n in seen_lessons.items():
        if n > 1:
            errors.append("%s: lessonNumber %s xuat hien %d lan" % (lvl.upper(), num, n))
    for _id, n in seen_ids.items():
        if n > 1:
            errors.append("%s: id '%s' bi trung %d lan" % (lvl.upper(), _id, n))
        if _id is None:
            errors.append("%s: co phan tu thieu 'id'" % lvl.upper())


def main():
    args = sys.argv[1:]
    only_thin = "--thin" in args
    levels = LEVELS
    if "--level" in args:
        levels = [args[args.index("--level") + 1].lower()]

    errors, warnings, thin_rows = [], [], []
    for lvl in levels:
        check_level(lvl, errors, warnings, thin_rows)

    if not only_thin:
        for e in errors:
            print("[LOI ] " + e)
        for w in warnings[:20]:
            print("[canh] " + w)
        if len(warnings) > 20:
            print("[canh] ... va %d canh bao khac" % (len(warnings) - 20))

    print("")
    print("Bai chua soan du: %d" % len(thin_rows))
    for tag, title, missing in thin_rows:
        gap = " ".join("%s=%d/%d" % (k, v, FULL[k]) for k, v in sorted(missing.items()))
        print("   %-8s %-46s %s" % (tag, title, gap))

    print("")
    print("Tong: %d loi, %d canh bao, %d bai chua day" % (len(errors), len(warnings), len(thin_rows)))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
