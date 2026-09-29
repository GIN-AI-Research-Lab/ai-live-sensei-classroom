# -*- coding: utf-8 -*-
"""
Kiem tra tinh toan ven giao trinh Nhap mon (KANA) va N5-N1 truoc khi commit.

Chay:  python tools/validate_curriculum.py
       python tools/validate_curriculum.py --level n5
       python tools/validate_curriculum.py --level kana   # cap Nhap mon (bang chu kana)
       python tools/validate_curriculum.py --thin      # chi liet ke bai chua soan du

Kiem tra:
  1. Schema: du 9 khoa bat buoc cua mot lesson.
  2. ID trung lap trong toan bo mot cap (voc-*, kan-*, ex-*, dia-*, t-*, slide).
  3. Bai tap: correctIndex tro dung vao options, khong co dap an trung chu.
  4. Ruby: token co kanji thi phai co furigana.
  5. Do day: doi chieu voi nguong cua bai mau (30 tu / 8 kanji / 6 slide / 10 thoai / 10 bai tap).
     Cap KANA co nguong rieng (FULL_BY_LEVEL) va bai 10 duoc phep kanjiList rong.
  6. Rieng KANA: kanjiList chua chu kana (loai/bangChu/romaji/strokeCount...), so net
     khop js/kana-strokes.js, bai tap dung 4 lua chon, emotion hop le, bai 1-3 chi dung
     chu da hoc.
"""
from __future__ import print_function
import io
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEVELS = ["kana", "n5", "n4", "n3", "n2", "n1"]

LESSON_KEYS = ["level", "lessonNumber", "title", "description",
               "vocabList", "kanjiList", "slides", "dialogue", "exercises"]

# Nguong "da soan du", lay theo bai 1 N5
FULL = {"vocabList": 20, "kanjiList": 5, "slides": 4, "dialogue": 6, "exercises": 8}

# Nguong rieng tung cap (cap nao khong co thi dung FULL)
FULL_BY_LEVEL = {
    "kana": {"vocabList": 10, "kanjiList": 1, "slides": 2, "dialogue": 4, "exercises": 10},
}
# Cap KANA: bai 10 (chao hoi, so dem) khong day chu moi nen kanjiList duoc rong
EMPTY_KANJI_OK = {"kana": {10}}
# Cap KANA: moi bai dung 10 bai tap
EXACT = {"kana": {"exercises": 10}}

KANA_ITEM_KEYS = ["id", "character", "loai", "bangChu", "romaji", "hanViet", "strokeCount",
                  "onyomi", "kunyomi", "meaningVi", "meoNho", "commonWords"]
KANA_VOCAB_KEYS = ["id", "word", "kanji", "furigana", "romaji", "wordType", "meaningVi",
                   "accentNote", "emotion"]
EMOTIONS = {"vui", "de_biu", "that_vong", "ngac_nhien", "buon", "gian", "suy_nghi",
            "xau_ho", "chao", "cui_chao"}
SMALL_KANA = set(u"ゃゅょャュョァィゥェォぁぃぅぇぉ")
PUNCT = set(u"、。・…！？!? 　「」〜ー")
# So dem 1 chu (bai 10 bat buoc co) duoc phep la tu vung mot chu kana
ONE_KANA_OK = set([u"に", u"ご", u"し", u"く"])


def full_for(lvl):
    return FULL_BY_LEVEL.get(lvl, FULL)


def load_kana_strokes():
    """So net tung chu kana lay tu js/kana-strokes.js (KanjiVG). Khong co file -> {}."""
    path = os.path.join(ROOT, "js", "kana-strokes.js")
    if not os.path.isfile(path):
        return {}
    src = io.open(path, encoding="utf-8").read()
    out = {}
    for m in re.finditer(r"['\"](.)['\"]\s*:\s*\[(.*?)\]", src, re.S):
        out[m.group(1)] = len(re.findall(r"['\"]M", m.group(2)))
    return out


def is_kana(ch):
    return u"ぁ" <= ch <= u"ヿ"


def check_kana_lesson(les, tag, taught, strokes, errors, warnings):
    """Kiem tra rieng cho mot bai cap KANA. `taught` = tap chu da hoc toi bai nay."""
    num = les.get("lessonNumber")
    for it in les.get("kanjiList") or []:
        iid = it.get("id")
        for key in KANA_ITEM_KEYS:
            if key not in it:
                errors.append("%s: chu '%s' thieu truong '%s'" % (tag, iid, key))
        if it.get("loai") != "kana":
            errors.append("%s: chu '%s' co loai=%r, can 'kana'" % (tag, iid, it.get("loai")))
        if it.get("bangChu") not in ("hiragana", "katakana"):
            errors.append("%s: chu '%s' co bangChu=%r" % (tag, iid, it.get("bangChu")))
        if it.get("hanViet") != "" or it.get("onyomi") != [] or it.get("kunyomi") != []:
            errors.append("%s: chu '%s' phai co hanViet='' va onyomi/kunyomi rong" % (tag, iid))
        ch = it.get("character") or ""
        sc = it.get("strokeCount")
        if not isinstance(sc, int):
            errors.append("%s: chu '%s' strokeCount=%r khong phai so nguyen" % (tag, iid, sc))
        elif len(ch) == 1 and ch in strokes and strokes[ch] != sc:
            errors.append("%s: chu '%s' (%s) strokeCount=%d nhung KanjiVG co %d net"
                          % (tag, iid, ch, sc, strokes[ch]))
        elif len(ch) > 1 and any(c in SMALL_KANA for c in ch) and sc != 0:
            errors.append("%s: am ghep '%s' (%s) phai co strokeCount=0" % (tag, iid, ch))
        if not it.get("commonWords"):
            warnings.append("%s: chu '%s' chua co commonWords" % (tag, iid))
    for v in les.get("vocabList") or []:
        for key in KANA_VOCAB_KEYS:
            if key not in v:
                errors.append("%s: tu '%s' thieu truong '%s'" % (tag, v.get("id"), key))
        if v.get("emotion") not in EMOTIONS:
            errors.append("%s: tu '%s' emotion=%r khong hop le" % (tag, v.get("id"), v.get("emotion")))
        word = v.get("word") or ""
        if word not in ONE_KANA_OK and len([c for c in word if is_kana(c) and c not in SMALL_KANA]) < 2:
            warnings.append("%s: tu '%s' (%s) chi co mot chu kana" % (tag, v.get("id"), word))
        if isinstance(num, int) and num <= 3:
            extra = sorted(set(c for c in word if c not in taught and c not in PUNCT))
            if extra:
                errors.append("%s: tu '%s' (%s) dung chu chua hoc: %s"
                              % (tag, v.get("id"), word, "".join(extra)))
    for d in les.get("dialogue") or []:
        if d.get("emotion") not in EMOTIONS:
            errors.append("%s: cau thoai '%s' emotion=%r khong hop le" % (tag, d.get("id"), d.get("emotion")))
        if d.get("speakerRole") not in ("personA", "personB"):
            errors.append("%s: cau thoai '%s' speakerRole=%r" % (tag, d.get("id"), d.get("speakerRole")))
    longest = 0
    for s in les.get("slides") or []:
        for e in s.get("examples") or []:
            toks = e.get("tokens") or []
            text = "".join(t.get("text", "") for t in toks)
            longest = max(longest, len([c for c in text if is_kana(c)]))
            if not any(t.get("isKeyGrammar") for t in toks):
                warnings.append("%s: vi du '%s' khong co token isKeyGrammar" % (tag, e.get("id")))
    if longest < 4:
        warnings.append("%s: khong co vi du nao dai tu 4 chu kana (thieu chat lieu luyen phat am)" % tag)
    for qz in les.get("exercises") or []:
        if len(qz.get("options") or []) != 4:
            errors.append("%s: bai tap '%s' co %d lua chon, can 4"
                          % (tag, qz.get("id"), len(qz.get("options") or [])))


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
    dir_path = os.path.join(ROOT, "curriculum", lvl)
    if not os.path.isdir(dir_path):
        errors.append("%s: khong tim thay thu muc curriculum/%s" % (lvl, lvl))
        return
    data = []
    for fname in sorted(os.listdir(dir_path)):
        if not fname.endswith(".json") or fname == "index.json":
            continue
        data.append(json.load(io.open(os.path.join(dir_path, fname), encoding="utf-8")))
    if not data:
        errors.append("%s: thu muc curriculum/%s rong" % (lvl, lvl))
        return

    seen_ids = Counter()
    seen_lessons = Counter()
    full = full_for(lvl)
    strokes = load_kana_strokes() if lvl == "kana" else {}
    taught = set()
    data.sort(key=lambda l: l.get("lessonNumber") if isinstance(l.get("lessonNumber"), int) else 0)

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

        if lvl == "kana":
            for it in les.get("kanjiList") or []:
                taught.update(it.get("character") or "")
            check_kana_lesson(les, tag, taught, strokes, errors, warnings)
        for k, n in EXACT.get(lvl, {}).items():
            if len(les.get(k) or []) != n:
                errors.append("%s: %s co %d muc, can dung %d" % (tag, k, len(les.get(k) or []), n))

        need = dict(full)
        if num in EMPTY_KANJI_OK.get(lvl, ()):
            need["kanjiList"] = 0
        missing = {k: len(les.get(k) or []) for k in need if len(les.get(k) or []) < need[k]}
        if missing:
            thin_rows.append((tag, les.get("title", "")[:46], missing, need))

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
    for tag, title, missing, need in thin_rows:
        gap = " ".join("%s=%d/%d" % (k, v, need[k]) for k, v in sorted(missing.items()))
        print("   %-8s %-46s %s" % (tag, title, gap))

    print("")
    print("Tong: %d loi, %d canh bao, %d bai chua day" % (len(errors), len(warnings), len(thin_rows)))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
