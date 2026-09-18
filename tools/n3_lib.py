# -*- coding: utf-8 -*-
"""
Thu vien dung chung de soan giao trinh N3 (bai 1-20).

Giu DUNG schema ma slide-engine.js dang doc:
  lesson = {level, lessonNumber, title, description,
            vocabList[], kanjiList[], slides[], dialogue[], exercises[]}

Moi token trong cau vi du / cau thoai deu co id rieng de Sensei goi
highlight_element(target_id) tro dung tung tu tren man hinh.

Giong het n5_lib.py, chi doi LEVEL va tien to id "n3".
"""
import io
import json
import os

LEVEL = "N3"


# ---------------------------------------------------------------- tu vung
def v(n, word, kanji, furigana, romaji, wtype, meaning, accent="", lesson=1):
    """Mot muc tu vung."""
    return {
        "id": "voc-n3-%d-%d" % (lesson, n),
        "word": word,
        "kanji": kanji,
        "furigana": furigana,
        "romaji": romaji,
        "wordType": wtype,
        "meaningVi": meaning,
        "accentNote": accent,
    }


# ---------------------------------------------------------------- kanji
def k(n, char, han_viet, strokes, on, kun, meaning, words, lesson=1):
    """Mot chu Han. `words` la list (tu, furigana, nghia)."""
    return {
        "id": "kan-n3-%d-%d" % (lesson, n),
        "character": char,
        "hanViet": han_viet,
        "strokeCount": strokes,
        "onyomi": on,
        "kunyomi": kun,
        "meaningVi": meaning,
        "commonWords": [
            {"word": w, "furigana": f, "meaningVi": m} for (w, f, m) in words
        ],
    }


# ---------------------------------------------------------------- vi du
def t(tid, text, kanji="", furigana="", key=False):
    """Mot token trong cau. kanji+furigana -> hien ruby tren slide."""
    tok = {"id": tid, "text": text, "isKeyGrammar": key}
    if kanji:
        tok["kanji"] = kanji
        tok["furigana"] = furigana or text
    return tok


def ex(lesson, slide, n, tokens, meaning):
    """Mot cau vi du cua slide ngu phap."""
    return {
        "id": "ex-n3-l%d-s%d-%d" % (lesson, slide, n),
        "tokens": tokens,
        "meaningVi": meaning,
    }


def slide(lesson, n, title, formula, explanation, examples, tips="", culture=""):
    return {
        "slideId": "n3-l%d-s%d" % (lesson, n),
        "slideType": "grammar",
        "title": title,
        "grammarFormula": formula,
        "explanation": explanation,
        "teacherTips": tips,
        "culturalNotes": culture,
        "examples": examples,
    }


# ---------------------------------------------------------------- hoi thoai
def line(lesson, n, speaker, role, tokens, meaning):
    return {
        "id": "dia-n3-%d-%d" % (lesson, n),
        "speaker": speaker,
        "speakerRole": role,
        "tokens": tokens,
        "meaningVi": meaning,
    }


# ---------------------------------------------------------------- bai tap
def q(lesson, n, question, options, correct, explanation, hint=""):
    return {
        "id": "ex-q-n3-%d-%d" % (lesson, n),
        "question": question,
        "options": options,
        "correctIndex": correct,
        "explanation": explanation,
        "hint": hint,
    }


def lesson(number, title, description, vocab, kanji, slides, dialogue, exercises):
    return {
        "level": LEVEL,
        "lessonNumber": number,
        "title": title,
        "description": description,
        "vocabList": vocab,
        "kanjiList": kanji,
        "slides": slides,
        "dialogue": dialogue,
        "exercises": exercises,
    }


# ---------------------------------------------------------------- ghi file
def merge(new_lessons, path="curriculum/n3"):
    """Ghi moi bai ra MOT FILE RIENG (curriculum/n3/<so>.json) + mot file
    index.json nhe (khong keo theo vocabList/kanjiList/slides/dialogue/
    exercises). Trang chon bai chi doc index.json (nhanh), con chi tiet
    tung bai chi duoc tai khi hoc vien thuc su bam mo bai do — xem
    CurriculumLoader.ensureLessonLoaded() ben js/curriculum-loader.js.
    """
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dir_path = os.path.join(root, path)
    os.makedirs(dir_path, exist_ok=True)

    by_num = {}
    for fname in os.listdir(dir_path):
        if fname.endswith(".json") and fname != "index.json":
            with io.open(os.path.join(dir_path, fname), encoding="utf-8") as f:
                lesson = json.load(f)
                by_num[lesson["lessonNumber"]] = lesson
    for l in new_lessons:
        by_num[l["lessonNumber"]] = l

    for n, l in by_num.items():
        with io.open(os.path.join(dir_path, "%d.json" % n), "w", encoding="utf-8") as f:
            json.dump(l, f, ensure_ascii=False, indent=2)

    index = []
    for n in sorted(by_num):
        l = by_num[n]
        index.append({
            "lessonNumber": l["lessonNumber"],
            "level": l["level"],
            "title": l["title"],
            "description": l.get("description", ""),
            "vocabCount": len(l.get("vocabList") or []),
            "kanjiCount": len(l.get("kanjiList") or []),
            "slideCount": len(l.get("slides") or []),
            "dialogueCount": len(l.get("dialogue") or []),
            "exerciseCount": len(l.get("exercises") or []),
        })
    with io.open(os.path.join(dir_path, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print("[OK] %s: %d bai" % (path, len(by_num)))
    for l in new_lessons:
        print("   B%02d  tu vung=%2d  kanji=%d  slide=%d  thoai=%d  bai tap=%d  | %s"
              % (l["lessonNumber"], len(l["vocabList"]), len(l["kanjiList"]),
                 len(l["slides"]), len(l["dialogue"]), len(l["exercises"]),
                 l["title"][:52]))
