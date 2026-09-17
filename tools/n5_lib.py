# -*- coding: utf-8 -*-
"""
Thu vien dung chung de soan giao trinh N5 (Minna no Nihongo I, bai 1-25).

Giu DUNG schema ma slide-engine.js dang doc:
  lesson = {level, lessonNumber, title, description,
            vocabList[], kanjiList[], slides[], dialogue[], exercises[]}

Moi token trong cau vi du / cau thoai deu co id rieng de Sensei goi
highlight_element(target_id) tro dung tung tu tren man hinh.
"""
import io
import json
import os

LEVEL = "N5"


# ---------------------------------------------------------------- tu vung
def v(n, word, kanji, furigana, romaji, wtype, meaning, accent="", lesson=1):
    """Mot muc tu vung."""
    return {
        "id": "voc-n5-%d-%d" % (lesson, n),
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
        "id": "kan-n5-%d-%d" % (lesson, n),
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
        "id": "ex-n5-l%d-s%d-%d" % (lesson, slide, n),
        "tokens": tokens,
        "meaningVi": meaning,
    }


def slide(lesson, n, title, formula, explanation, examples, tips="", culture=""):
    return {
        "slideId": "n5-l%d-s%d" % (lesson, n),
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
        "id": "dia-n5-%d-%d" % (lesson, n),
        "speaker": speaker,
        "speakerRole": role,
        "tokens": tokens,
        "meaningVi": meaning,
    }


# ---------------------------------------------------------------- bai tap
def q(lesson, n, question, options, correct, explanation, hint=""):
    return {
        "id": "ex-q-n5-%d-%d" % (lesson, n),
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
def merge(new_lessons, path="curriculum/n5.json"):
    """Thay the cac bai co cung lessonNumber, giu nguyen cac bai khac, sap xep lai."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full = os.path.join(root, path)
    data = json.load(io.open(full, encoding="utf-8")) if os.path.exists(full) else []

    by_num = {l["lessonNumber"]: l for l in data}
    for l in new_lessons:
        by_num[l["lessonNumber"]] = l

    out = [by_num[n] for n in sorted(by_num)]
    with io.open(full, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print("[OK] %s: %d bai" % (path, len(out)))
    for l in new_lessons:
        print("   B%02d  tu vung=%2d  kanji=%d  slide=%d  thoai=%d  bai tap=%d  | %s"
              % (l["lessonNumber"], len(l["vocabList"]), len(l["kanjiList"]),
                 len(l["slides"]), len(l["dialogue"]), len(l["exercises"]),
                 l["title"][:52]))
