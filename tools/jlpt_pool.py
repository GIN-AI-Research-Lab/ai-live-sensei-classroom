# -*- coding: utf-8 -*-
"""
Doc pool tu vung mo (data/jlpt-vocab/*.csv, xem NOTICE.md) va cap phat cho
tung bai hoc, tranh trung tu giua cac bai da soan.

Dung trong tools/nN_bNN.py nhu sau:

    from jlpt_pool import Pool
    pool = Pool("n5")
    # Lay ung vien theo tu khoa chu de (khong bat buoc phai dung dung tu nay,
    # chi la goi y -- nguoi soan van tu chon va viet lai nghia/vi du)
    candidates = pool.search("時|曜日|朝|晩")
    pool.mark_used([w["expression"] for w in candidates[:15]], lesson=4)
"""
from __future__ import print_function
import csv
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data", "jlpt-vocab")
STATE_PATH = os.path.join(DATA_DIR, ".used_words.json")


class Pool(object):
    def __init__(self, level):
        self.level = level.lower()
        path = os.path.join(DATA_DIR, "%s.csv" % self.level)
        with io.open(path, encoding="utf-8") as f:
            self.words = list(csv.DictReader(f))
        self._used = self._load_state()

    def _load_state(self):
        if not os.path.exists(STATE_PATH):
            return {}
        with io.open(STATE_PATH, encoding="utf-8") as f:
            return json.load(f)

    def _save_state(self):
        with io.open(STATE_PATH, "w", encoding="utf-8") as f:
            json.dump(self._used, f, ensure_ascii=False, indent=2, sort_keys=True)

    def is_used(self, expression):
        return expression in self._used.get(self.level, {})

    def search(self, pattern, limit=None, exclude_used=True):
        """Tim ung vien theo regex tren expression+reading (khong phan biet hoa/thuong).
        Chi la GOI Y -- nguoi soan van phai tu doc nghia va viet lai cho phu hop bai."""
        rx = re.compile(pattern)
        out = []
        for w in self.words:
            if exclude_used and self.is_used(w["expression"]):
                continue
            if rx.search(w["expression"]) or rx.search(w["reading"]):
                out.append(w)
        return out[:limit] if limit else out

    def unused(self, limit=None):
        out = [w for w in self.words if not self.is_used(w["expression"])]
        return out[:limit] if limit else out

    def mark_used(self, expressions, lesson):
        bucket = self._used.setdefault(self.level, {})
        for e in expressions:
            bucket[e] = lesson
        self._save_state()

    def stats(self):
        used = sum(1 for w in self.words if self.is_used(w["expression"]))
        return {"total": len(self.words), "used": used, "remaining": len(self.words) - used}


if __name__ == "__main__":
    import sys
    lvl = sys.argv[1] if len(sys.argv) > 1 else "n5"
    p = Pool(lvl)
    print("%s: %s" % (lvl.upper(), p.stats()))
