// bo-cuc-noidung.mjs — tim NOI DUNG XAU NHAT that trong curriculum/*/N.json va dung "bai stress" cho do-bo-cuc.mjs --stress.
// Khong sua repo: bai stress duoc dua vao trang bang cach boc window.fetch (script chay truoc moi tai lieu), chi thay
// noi dung phan tu trong JSON cua N5-1 va KANA-5 luc tai bai (id cua cac muc dich giu nguyen, cue / khoa van khop).
import fs from 'node:fs';
import path from 'node:path';

const GOC = process.env.SENSEI_DU_AN || 'E:/ai-live-sensei-classroom';
const len = (s) => String(s == null ? '' : s).length;
const tokLen = (ts) => (ts || []).reduce((a, t) => a + len(t.text || t.kanji), 0);

function docBai(cap) {
  const dir = path.join(GOC, 'curriculum', cap);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).map((f) => {
    try { return { cap, so: +f.replace('.json', ''), j: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }; } catch (e) { return null; }
  }).filter(Boolean);
}

/** Quet moi bai (n1..n5 + kana). Tra ve cac muc XAU NHAT theo tung tieu chi + mo ta ngan (de in bao cao). */
export function quetNoiDungXau() {
  const bai = ['n5', 'n4', 'n3', 'n2', 'n1', 'kana'].flatMap(docBai);
  const best = {};
  const tot = (ten, diem, muc, nguon, mota) => { if (!best[ten] || diem > best[ten].diem) best[ten] = { diem, muc, nguon: `${nguon}`, mota }; };
  for (const { cap, so, j } of bai) {
    const nguon = `${cap}/${so}`;
    if (cap !== 'kana') {
      for (const v of j.vocabList || []) {
        tot('vocabNghia', len(v.meaningVi), v, nguon, `vocab ${v.word || v.kanji} meaningVi ${len(v.meaningVi)} ky tu`);
        tot('vocabTrongAm', len(v.accentNote), v, nguon, `vocab ${v.word || v.kanji} accentNote ${len(v.accentNote)} ky tu`);
      }
      for (const k of j.kanjiList || []) tot('kanji', (k.commonWords || []).length * 100 + len(k.meaningVi), k, nguon, `kanji ${k.character} ${(k.commonWords || []).length} commonWords`);
      for (const s of j.slides || []) {
        if (s.slideType && s.slideType !== 'grammar') continue;
        tot('slideDai', len(s.explanation) + len(s.teacherTips) + len(s.culturalNotes), s, nguon, `slide "${String(s.title).slice(0, 30)}" explanation+tips+cultural = ${len(s.explanation) + len(s.teacherTips) + len(s.culturalNotes)} ky tu`);
        tot('slideCongThuc', len(s.grammarFormula), s, nguon, `slide "${String(s.title).slice(0, 30)}" grammarFormula ${len(s.grammarFormula)} ky tu`);
        for (const ex of s.examples || []) {
          const n = (ex.tokens || []).length;
          tot('vidu', n * 1000 + tokLen(ex.tokens), ex, nguon, `example ${n} tokens, ${tokLen(ex.tokens)} ky tu Nhat, meaningVi ${len(ex.meaningVi)}`);
        }
      }
      for (const d of j.dialogue || []) tot('thoai', tokLen(d.tokens) * 10 + len(d.meaningVi), d, nguon, `dialogue ${d.id} ${tokLen(d.tokens)} ky tu Nhat, ${(d.tokens || []).length} tokens`);
      for (const q of j.exercises || []) {
        const ol = (q.options || []).reduce((a, o) => a + len(o), 0);
        const om = Math.max(0, ...(q.options || []).map(len));
        tot('quizCauHoi', len(q.question), q, nguon, `quiz question ${len(q.question)} ky tu`);
        tot('quizDapAn', ol * 10 + om, q, nguon, `quiz options tong ${ol} ky tu (dai nhat ${om})`);
      }
    } else {
      for (const k of j.kanjiList || []) tot('kana', len(k.meoNho) + len(k.sosanh) + len(k.meaningVi) + (k.commonWords || []).length * 30, k, nguon, `kana ${k.character} meoNho ${len(k.meoNho)} sosanh ${len(k.sosanh)}`);
    }
  }
  return best;
}

const copy = (x) => JSON.parse(JSON.stringify(x));

/**
 * Bai stress: doi noi dung (KHONG doi id cua muc dich) trong JSON cua bai goc.
 *   N5-1  : vocab[0] = nghia dai nhat; vocab[1] = trong am dai nhat; kanji[0] = nhieu tu ghep nhat;
 *           slides[0] = giang dai nhat, slides[1] = cong thuc dai nhat; slides[0].examples[0] = cau nhieu token nhat;
 *           dialogue[0] = loi thoai dai nhat; exercises[0] = cau hoi dai nhat, exercises[1] = dap an dai nhat.
 *   KANA-5: kanjiList[0] = chu kana nhieu chu nhat.
 * Tra ve { json, ghiChu[] }.
 */
export function taoBaiStress(cap, goc, xau) {
  const j = copy(goc);
  const ghi = [];
  const dat = (arr, i, muc, khoa) => {
    if (!arr || !arr[i] || !muc) return;
    const id = arr[i].id;
    const moi = copy(muc);
    if (id !== undefined) moi.id = id;
    if (khoa) for (const k of khoa) if (arr[i][k] !== undefined && moi[k] === undefined) moi[k] = arr[i][k];
    arr[i] = moi;
  };
  if (cap === 'KANA') {
    if (xau.kana) { dat(j.kanjiList, 0, xau.kana.muc, ['loai', 'bangChu', 'romaji']); ghi.push('kana[0] <- ' + xau.kana.mota + ' (' + xau.kana.nguon + ')'); }
    return { json: j, ghiChu: ghi };
  }
  if (xau.vocabNghia) { dat(j.vocabList, 0, xau.vocabNghia.muc); ghi.push('vocab[0] <- ' + xau.vocabNghia.mota + ' (' + xau.vocabNghia.nguon + ')'); }
  if (xau.vocabTrongAm) { dat(j.vocabList, 1, xau.vocabTrongAm.muc); ghi.push('vocab[1] <- ' + xau.vocabTrongAm.mota + ' (' + xau.vocabTrongAm.nguon + ')'); }
  if (xau.kanji) { dat(j.kanjiList, 0, xau.kanji.muc); ghi.push('kanji[0] <- ' + xau.kanji.mota + ' (' + xau.kanji.nguon + ')'); }
  const slideId = (i) => (j.slides && j.slides[i] ? { slideId: j.slides[i].slideId, examples: j.slides[i].examples } : null);
  const giu0 = slideId(0), giu1 = slideId(1);
  if (xau.slideDai && giu0) { j.slides[0] = Object.assign(copy(xau.slideDai.muc), { slideId: giu0.slideId, examples: giu0.examples }); ghi.push('slide[0] <- ' + xau.slideDai.mota + ' (' + xau.slideDai.nguon + ')'); }
  if (xau.slideCongThuc && giu1) { j.slides[1] = Object.assign(copy(xau.slideCongThuc.muc), { slideId: giu1.slideId, examples: giu1.examples }); ghi.push('slide[1] <- ' + xau.slideCongThuc.mota + ' (' + xau.slideCongThuc.nguon + ')'); }
  if (xau.vidu && j.slides && j.slides[0] && j.slides[0].examples && j.slides[0].examples[0]) {
    const moi = copy(xau.vidu.muc);
    moi.id = j.slides[0].examples[0].id;
    // id token: giu duy nhat trong bai (token cua muc dich co the trung id voi token khac)
    (moi.tokens || []).forEach((t, k) => { if (t.id) t.id = `${moi.id}-st${k}`; });
    j.slides[0].examples[0] = moi;
    ghi.push('slides[0].examples[0] <- ' + xau.vidu.mota + ' (' + xau.vidu.nguon + ')');
  }
  if (xau.thoai && j.dialogue && j.dialogue[0]) {
    const moi = copy(xau.thoai.muc);
    moi.id = j.dialogue[0].id;
    (moi.tokens || []).forEach((t, k) => { if (t.id) t.id = `${moi.id}-st${k}`; });
    moi.speaker = j.dialogue[0].speaker || moi.speaker; moi.speakerRole = j.dialogue[0].speakerRole || moi.speakerRole;
    j.dialogue[0] = moi;
    ghi.push('dialogue[0] <- ' + xau.thoai.mota + ' (' + xau.thoai.nguon + ')');
  }
  if (xau.quizCauHoi) { dat(j.exercises, 0, xau.quizCauHoi.muc); ghi.push('exercises[0] <- ' + xau.quizCauHoi.mota + ' (' + xau.quizCauHoi.nguon + ')'); }
  if (xau.quizDapAn) { dat(j.exercises, 1, xau.quizDapAn.muc); ghi.push('exercises[1] <- ' + xau.quizDapAn.mota + ' (' + xau.quizDapAn.nguon + ')'); }
  return { json: j, ghiChu: ghi };
}

/** Doc JSON goc cua mot bai tu dia (de vá) */
export function docBaiGoc(cap, so) {
  return JSON.parse(fs.readFileSync(path.join(GOC, 'curriculum', cap.toLowerCase(), `${so}.json`), 'utf8'));
}

/** Script chay truoc moi tai lieu: boc fetch de tra JSON da vá cho cac URL khop (khoa la duoi URL, vd 'curriculum/n5/1.json') */
export function scriptBocFetch(map) {
  return `(() => { const P = ${JSON.stringify(map)}; const of = window.fetch;
    window.fetch = function (u, o) { try { const url = String(typeof u === 'string' ? u : (u && u.url) || u); for (const k in P) if (url.split('?')[0].endsWith(k)) return Promise.resolve(new Response(JSON.stringify(P[k]), { status: 200, headers: { 'Content-Type': 'application/json' } })); } catch (e) {} return of.apply(this, arguments); }; })();`;
}
