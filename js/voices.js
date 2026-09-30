/**
 * Giong nhan vat hoi thoai — NGUON DUY NHAT la bang nhan vat curriculum/nhan-vat.json
 *
 * Moi nhan vat (ke ca vai theo chuc danh: 店員, 先生, 受付, 社長 ...) co MOT
 * giong Gemini co dinh, khong nhan vat nao trung giong, va giong do khong doi
 * theo bai hay theo cap: Miller o N5 va o N1 la cung mot giong. Gioi tinh cung
 * lay tu bang nay (nam / nu chia deu), khong doan tu ten nua.
 *
 * Bang duoc nhung san ben duoi (EMBEDDED) de lan render dau khong phai cho
 * mang va van dung khi offline; sau do fetch curriculum/nhan-vat.json mot lan,
 * neu hop le thi thay bang do (chi khac khi chu bai sua tep JSON).
 *
 * Gemini Live chi cho MOT giong cho ca phien nen loi thoai (van ban co dinh)
 * duoc dung san bang cac phien dien vien (js/voice-actors.js), moi giong mot
 * phien; toi luot ai thi phat dung ban da dung cua giong nguoi do.
 *
 * Giong Sensei (Charon) KHONG bao gio cap cho nhan vat nao.
 */
(function () {
  'use strict';

  // Giong dung san cua Gemini, phan theo chat giong (theo tai lieu cong khai;
  // ?ngheGiong=1 cho phep tu kiem bang cach do cao do F0)
  const MALE = ['Puck', 'Charon', 'Fenrir', 'Orus', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba',
    'Algenib', 'Rasalgethi', 'Alnilam', 'Schedar', 'Achird', 'Zubenelgenubi', 'Sadachbia', 'Sadaltager'];
  const FEMALE = ['Zephyr', 'Kore', 'Leda', 'Aoede', 'Callirrhoe', 'Autonoe', 'Despina', 'Erinome',
    'Laomedeia', 'Achernar', 'Gacrux', 'Pulcherrima', 'Vindemiatrix', 'Sulafat'];

  const ROSTER_URL = 'curriculum/nhan-vat.json';

  // Ban nhung san, PHAI trung voi curriculum/nhan-vat.json (tools/kiem_nhan_vat.py va
  // tools/kiem_nhan_vat.test.mjs kiem tra hai ban khop nhau).
  const EMBEDDED = {
    phienBan: 1,
    giongSensei: 'Charon',
    nhanVat: [
    {"id": "miller", "ten": "Mike Miller", "ten_ja": "ミラー", "biDanh": ["ミラー", "ミラー (Miller)", "マイク・ミラー", "Miller", "ミラーさん"], "gioiTinh": "m", "giong": "Fenrir", "anh": "assets/minh-hoa/nv-miller.webp"},
    {"id": "sato", "ten": "Satou Keiko", "ten_ja": "佐藤", "biDanh": ["佐藤", "佐藤 (Satou)", "さとう", "さとう (Satou)", "佐藤けい子", "けい子", "Satou", "Sato"], "gioiTinh": "f", "giong": "Zephyr", "anh": "assets/minh-hoa/nv-sato.webp"},
    {"id": "yamada", "ten": "Yamada Ichirō", "ten_ja": "山田", "biDanh": ["山田", "山田 (Yamada)", "山田一郎", "山田 一郎", "Yamada"], "gioiTinh": "m", "giong": "Achird", "anh": "assets/minh-hoa/nv-yamada.webp"},
    {"id": "wang", "ten": "Wang", "ten_ja": "ワン", "biDanh": ["ワン", "Wang"], "gioiTinh": "m", "giong": "Puck", "anh": "assets/minh-hoa/nv-wang.webp"},
    {"id": "santos", "ten": "José Santos", "ten_ja": "サントス", "biDanh": ["サントス", "Santos"], "gioiTinh": "m", "giong": "Orus", "anh": "assets/minh-hoa/nv-santos.webp"},
    {"id": "tanaka", "ten": "Tanaka", "ten_ja": "田中", "biDanh": ["田中", "Tanaka"], "gioiTinh": "f", "giong": "Kore", "anh": "assets/minh-hoa/nv-tanaka.webp"},
    {"id": "gupta", "ten": "Gupta", "ten_ja": "グプタ", "biDanh": ["グプタ", "Gupta"], "gioiTinh": "m", "giong": "Sadaltager", "anh": "assets/minh-hoa/nv-gupta.webp"},
    {"id": "karina", "ten": "Karina", "ten_ja": "カリナ", "biDanh": ["カリナ", "Karina"], "gioiTinh": "f", "giong": "Leda", "anh": "assets/minh-hoa/nv-karina.webp"},
    {"id": "maria", "ten": "Maria", "ten_ja": "マリア", "biDanh": ["マリア", "Maria"], "gioiTinh": "f", "giong": "Aoede", "anh": "assets/minh-hoa/nv-maria.webp"},
    {"id": "yamamoto", "ten": "Yamamoto", "ten_ja": "山本", "biDanh": ["山本", "Yamamoto"], "gioiTinh": "m", "giong": "Schedar", "anh": "assets/minh-hoa/nv-yamamoto.webp"},
    {"id": "suzuki", "ten": "Suzuki", "ten_ja": "鈴木", "biDanh": ["鈴木", "Suzuki"], "gioiTinh": "m", "giong": "Umbriel", "anh": "assets/minh-hoa/nv-suzuki.webp"},
    {"id": "giao-vien", "ten": "Giáo viên", "ten_ja": "先生", "biDanh": ["先生", "せんせい", "せんせい (Sensei)", "先生 (Sensei)", "Sensei"], "gioiTinh": "m", "giong": "Algieba", "anh": "assets/minh-hoa/nv-sensei.webp"},
    {"id": "shacho", "ten": "Giám đốc", "ten_ja": "社長", "biDanh": ["社長"], "gioiTinh": "m", "giong": "Algenib", "anh": "assets/minh-hoa/nv-shacho.webp"},
    {"id": "kyoju", "ten": "Giáo sư", "ten_ja": "教授", "biDanh": ["教授"], "gioiTinh": "m", "giong": "Rasalgethi", "anh": "assets/minh-hoa/nv-kyoju.webp"},
    {"id": "senshu", "ten": "Vận động viên", "ten_ja": "選手", "biDanh": ["選手"], "gioiTinh": "m", "giong": "Sadachbia", "anh": "assets/minh-hoa/nv-senshu.webp"},
    {"id": "coach", "ten": "Huấn luyện viên", "ten_ja": "コーチ", "biDanh": ["コーチ"], "gioiTinh": "m", "giong": "Alnilam", "anh": null},
    {"id": "bengoshi", "ten": "Luật sư", "ten_ja": "弁護士", "biDanh": ["弁護士"], "gioiTinh": "m", "giong": "Iapetus", "anh": null},
    {"id": "hisho", "ten": "Thư ký", "ten_ja": "秘書", "biDanh": ["秘書"], "gioiTinh": "m", "giong": "Enceladus", "anh": null},
    {"id": "nguyen", "ten": "Nguyễn", "ten_ja": "グエン", "biDanh": ["グエン", "グエン (Nguyễn)", "Nguyễn", "Nguyen"], "gioiTinh": "f", "giong": "Laomedeia", "anh": null},
    {"id": "tenin", "ten": "Nhân viên cửa hàng", "ten_ja": "店員", "biDanh": ["店員", "てんいん", "てんいん (Nhân viên)"], "gioiTinh": "f", "giong": "Autonoe", "anh": "assets/minh-hoa/nv-tenin.webp"},
    {"id": "uketsuke", "ten": "Lễ tân", "ten_ja": "受付", "biDanh": ["受付"], "gioiTinh": "f", "giong": "Despina", "anh": "assets/minh-hoa/nv-uketsuke.webp"},
    {"id": "joshi", "ten": "Cấp trên", "ten_ja": "上司", "biDanh": ["上司"], "gioiTinh": "f", "giong": "Gacrux", "anh": null},
    {"id": "hyoronka", "ten": "Nhà bình luận", "ten_ja": "評論家", "biDanh": ["評論家"], "gioiTinh": "f", "giong": "Erinome", "anh": null},
    {"id": "isha", "ten": "Bác sĩ", "ten_ja": "医者", "biDanh": ["医者"], "gioiTinh": "f", "giong": "Vindemiatrix", "anh": null},
    {"id": "tsukonin", "ten": "Người qua đường", "ten_ja": "通行人", "biDanh": ["通行人"], "gioiTinh": "f", "giong": "Callirrhoe", "anh": null},
    {"id": "gakusei", "ten": "Nghiên cứu sinh", "ten_ja": "学生", "biDanh": ["学生"], "gioiTinh": "f", "giong": "Achernar", "anh": null},
    {"id": "shikai", "ten": "Người dẫn chương trình", "ten_ja": "司会", "biDanh": ["司会"], "gioiTinh": "f", "giong": "Sulafat", "anh": null},
    {"id": "kisha", "ten": "Phóng viên", "ten_ja": "記者", "biDanh": ["記者"], "gioiTinh": "f", "giong": "Pulcherrima", "anh": null},
    ],
  };

  /**
   * Giong cua Sensei — KHONG duoc cap cho nhan vat nao trong hoi thoai.
   * Do thuc te: nhan vat "B (Nguoi dap)" tung boc trung Charon, thanh ra
   * hoc vien nghe thay giao tu noi chuyen voi chinh minh.
   */
  let giongSensei = EMBEDDED.giongSensei;

  const overrides = {};        // nguoi dung ep giong cho nhan vat cu the (debug)
  const daCanhBao = new Set(); // moi ten la chi canh bao mot lan
  const ngoaiBang = new Map(); // ten la (chua co trong bang) -> giong da chon, de on dinh
  const nguoiNghe = [];        // ham goi lai khi bang doi giong / gioi tinh

  // ---------------------------------------------------------------- chuan hoa ten
  /** NFKC, bo phan phien am trong ngoac, bo moi khoang trang, ha chu thuong */
  function chuanHoa(s) {
    let t = String(s == null ? '' : s);
    try { t = t.normalize('NFKC'); } catch (e) {}
    const trongNgoac = (t.match(/\(([^)]*)\)/) || [])[1] || '';
    t = t.replace(/\([^)]*\)/g, '');
    t = t.replace(/[\s　]+/g, '').toLowerCase();
    // Chi con phan trong ngoac (vd "(Miller)") thi dung chinh no
    if (!t && trongNgoac) t = trongNgoac.replace(/[\s　]+/g, '').toLowerCase();
    return t;
  }

  /** Hau to kinh xung / chuc danh gan sau ten: 田中さん, ミラー君, 山田先生 ... */
  const HAU_TO = /(さん|くん|ちゃん|君|様|さま|氏|先生)$/;

  // ---------------------------------------------------------------- dung bang tra cuu
  function buocNhay(n) {
    // Buoc nguyen to cung nhau voi n, ~0.36n: hai nhan vat lien ke trong bang
    // rot xa nhau tren thang cao do (giong trinh duyet chi khac nhau o pitch)
    if (n <= 2) return 1;
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    for (let s = Math.max(2, Math.round(n * 0.36)); s < n; s++) if (gcd(s, n) === 1) return s;
    return 1;
  }

  let bang = null;   // { ds, theoAlias, theoId, giongDung, chuKy, chuKy2 }

  function dungBang(nguon) {
    const ds = [];
    const theoAlias = new Map();
    const theoId = new Map();
    (nguon.nhanVat || []).forEach((n) => {
      if (!n || !n.id || !n.giong) return;
      const nv = {
        id: String(n.id),
        ten: n.ten || n.ten_ja || n.id,
        tenJa: n.ten_ja || '',
        gioiTinh: n.gioiTinh === 'f' ? 'f' : 'm',
        giong: String(n.giong),
        anh: n.anh || null,
        biDanh: (n.biDanh || []).slice(),
        rank: 0, nGioi: 1, viTri: 0,
      };
      ds.push(nv);
      theoId.set(nv.id, nv);
      [nv.tenJa, nv.ten].concat(nv.biDanh).forEach((a) => {
        const k = chuanHoa(a);
        if (k && !theoAlias.has(k)) theoAlias.set(k, nv);
      });
    });
    // Thu hang trong tung gioi tinh -> vi tri cao do cho giong trinh duyet
    ['m', 'f'].forEach((g) => {
      const nhom = ds.filter(n => n.gioiTinh === g);
      const s = buocNhay(nhom.length);
      nhom.forEach((n, i) => { n.rank = i; n.nGioi = nhom.length; n.viTri = (i * s) % nhom.length; });
    });
    return {
      ds, theoAlias, theoId,
      giongDung: new Set(ds.map(n => n.giong)),
      chuKy: JSON.stringify(ds.map(n => [n.id, n.gioiTinh, n.giong])),
    };
  }

  /** Bang chi duoc nhan khi hop le: du dong, giong dung kho theo gioi, khong trung */
  function kiemBang(nguon) {
    const ds = (nguon && nguon.nhanVat) || [];
    if (ds.length < 10) return 'qua it nhan vat';
    const dung = new Set();
    for (const n of ds) {
      if (!n || !n.id || !n.giong) return 'thieu id/giong';
      const kho = n.gioiTinh === 'f' ? FEMALE : MALE;
      if (!kho.includes(n.giong)) return `giong ${n.giong} khong thuoc kho ${n.gioiTinh === 'f' ? 'nu' : 'nam'}`;
      if (dung.has(n.giong)) return `trung giong ${n.giong}`;
      dung.add(n.giong);
    }
    if (dung.has((nguon.giongSensei || giongSensei))) return 'nhan vat dung giong Sensei';
    return null;
  }

  bang = dungBang(EMBEDDED);

  // ---------------------------------------------------------------- tra cuu
  function tra(speaker) {
    const k = chuanHoa(speaker);
    if (!k) return null;
    let nv = bang.theoAlias.get(k);
    if (nv) return nv;
    let t = k;
    for (let i = 0; i < 2; i++) {
      const m = t.match(HAU_TO);
      if (!m || t.length <= m[0].length) break;
      t = t.slice(0, -m[0].length);
      nv = bang.theoAlias.get(t);
      if (nv) return nv;
    }
    return null;
  }

  // ---------------------------------------------------------------- du phong cho ten LA
  /** Hau to chi gioi tinh kha chac trong ten tieng Nhat */
  function guessByEnding(name) {
    if (/(子|美|香|奈|恵|絵|花|華)\s*$/.test(name)) return 'f';
    if (/(郎|夫|男|雄|太|樹|介|司)\s*$/.test(name)) return 'm';
    return null;
  }

  /** Bam ten thanh so de cung mot ten luon nhan dung mot giong */
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function canhBao(speaker) {
    const key = String(speaker == null ? '' : speaker).trim();
    if (daCanhBao.has(key)) return;
    daCanhBao.add(key);
    try {
      console.warn(`[giong] nhan vat "${key}" chua co trong curriculum/nhan-vat.json — tam bam ten de chon giong; hay them vao bang.`);
    } catch (e) {}
  }

  function khoGiong(gioiTinh) {
    const kho = (gioiTinh === 'f' ? FEMALE : MALE).filter(v => v !== giongSensei);
    return kho.length ? kho : (gioiTinh === 'f' ? FEMALE : MALE);
  }

  /** Ten la: gioi tinh + giong (uu tien giong chua ai dung trong bang) + vi tri cao do */
  function duPhong(speaker, explicit) {
    const key = String(speaker == null ? '' : speaker).trim();
    let r = ngoaiBang.get(key);
    if (r) return r;
    canhBao(key);
    const gender = (explicit === 'm' || explicit === 'f') ? explicit
      : (guessByEnding(key) || ((hash(key) % 2) ? 'f' : 'm'));
    const kho = khoGiong(gender);
    const chuaDung = kho.filter(v => !bang.giongDung.has(v));
    const pool = chuaDung.length ? chuaDung : kho;
    r = { gender, voice: pool[hash(key) % pool.length], viTri: hash(key) % 14, nGioi: 14, rank: hash(key) % 14 };
    ngoaiBang.set(key, r);
    return r;
  }

  /** { gender, voice, viTri, nGioi, rank, nv } cho mot ten bat ky */
  function giaiQuyet(speaker, explicit) {
    const key = String(speaker == null ? '' : speaker).trim();
    const nv = tra(key);
    const ep = overrides[nv ? nv.id : key];
    if (nv) {
      return { gender: nv.gioiTinh, voice: ep || nv.giong, viTri: nv.viTri, nGioi: nv.nGioi, rank: nv.rank, nv };
    }
    const r = duPhong(key, explicit);
    return { nv: null, gender: r.gender, voice: ep || r.voice, viTri: r.viTri, nGioi: r.nGioi, rank: r.rank };
  }

  // ---------------------------------------------------------------- nap bang tu tep JSON
  let daXong = false;
  let hoanTat = null;
  const ready = new Promise((resolve) => { hoanTat = resolve; });

  function xong(ok) { if (!daXong) { daXong = true; hoanTat(ok); } }

  function napTuTep() {
    if (typeof fetch !== 'function') return xong(false);
    const hen = setTimeout(() => xong(false), 2500);   // cho toi da 2,5 giay, sau do dung ban nhung
    fetch(ROSTER_URL, { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((j) => {
        clearTimeout(hen);
        const loi = kiemBang(j);
        if (loi) throw new Error(loi);
        const moi = dungBang(j);
        const doi = moi.chuKy !== bang.chuKy;
        bang = moi;
        if (j.giongSensei) giongSensei = String(j.giongSensei);
        xong(true);
        if (doi) nguoiNghe.slice().forEach((fn) => { try { fn(SenseiVoices); } catch (e) { console.warn(e); } });
      })
      .catch((e) => {
        clearTimeout(hen);
        try { console.warn('[giong] khong nap duoc ' + ROSTER_URL + ' (' + (e && e.message || e) + ') — dung bang nhung san.'); } catch (x) {}
        xong(false);
      });
  }

  // ---------------------------------------------------------------- API cong khai
  const SenseiVoices = {
    /** Promise: da nap xong bang tu tep (true) hoac dung ban nhung san (false). Toi da ~2,5 giay. */
    ready,

    /** 'm' | 'f' — gioi tinh cua nhan vat theo bang (explicit chi dung cho ten la) */
    genderOf(speaker, explicit) {
      return giaiQuyet(speaker, explicit).gender;
    },

    /**
     * Giong co dinh cua mot nhan vat, giong nhau o moi bai va moi cap.
     * Tham so thu ba (doan thoai) chi giu cho tuong thich: khong con xao tron giong.
     */
    voiceFor(speaker, explicitGender /*, dialogue */) {
      return giaiQuyet(speaker, explicitGender).voice;
    },

    /** Bao giong Sensei dang dung, de khong cap trung cho nhan vat nao */
    setSenseiVoice(v) {
      if (!v) return;
      giongSensei = String(v).trim();
      if (bang.giongDung.has(giongSensei)) {
        try { console.warn(`[giong] giong Sensei "${giongSensei}" dang duoc mot nhan vat dung — hay doi trong curriculum/nhan-vat.json.`); } catch (e) {}
      }
    },

    /** Ep giong cho mot nhan vat (chi de thu tay); voiceName rong = bo ep */
    setVoice(speaker, voiceName) {
      const nv = tra(speaker);
      const key = nv ? nv.id : String(speaker || '').trim();
      if (voiceName) overrides[key] = voiceName; else delete overrides[key];
    },

    /** Thong tin day du cua mot ten (dung cho cong cu kiem tra / nghe thu) */
    thongTin(speaker, explicit) {
      const r = giaiQuyet(speaker, explicit);
      return {
        id: r.nv ? r.nv.id : null,
        ten: r.nv ? r.nv.ten : String(speaker || '').trim(),
        tenJa: r.nv ? r.nv.tenJa : '',
        gender: r.gender,
        voice: r.voice,
        anh: r.nv ? r.nv.anh : null,
        coTrongBang: !!r.nv,
      };
    },

    /** Ban sao danh sach nhan vat hien hanh */
    danhSach() {
      return bang.ds.map(n => ({
        id: n.id, ten: n.ten, tenJa: n.tenJa, gioiTinh: n.gioiTinh, giong: n.giong, anh: n.anh, biDanh: n.biDanh.slice(),
      }));
    },

    /** Goi lai khi bang tu tep khac ban nhung san ve giong / gioi tinh */
    onRosterChange(fn) { if (typeof fn === 'function') nguoiNghe.push(fn); },

    /**
     * Dan nhan vat cua mot doan hoi thoai, theo thu tu xuat hien, moi nhan vat MOT dong
     * (山田 va 山田一郎 la cung mot nguoi thi chi tinh mot). Giong lay thang tu bang.
     */
    castOf(dialogue) {
      const seen = new Map();
      (dialogue || []).forEach((line) => {
        const name = String((line && line.speaker) || '').trim();
        if (!name) return;
        const r = giaiQuyet(name, line.speakerGender);
        const khoa = r.nv ? r.nv.id : 'ten:' + name;
        if (seen.has(khoa)) return;
        seen.set(khoa, {
          speaker: name,
          id: r.nv ? r.nv.id : null,
          ten: r.nv ? r.nv.ten : name,   // ten tieng Viet / la-tinh trong bang
          gender: r.gender,
          genderVi: r.gender === 'f' ? 'nữ' : 'nam',
          voice: r.voice,
          anh: r.nv ? r.nv.anh : null,
        });
      });
      return [...seen.values()];
    },

    /**
     * Lop do cuoi: giong tieng Nhat cua TRINH DUYET, phan theo gioi tinh.
     * Dung khi API khong long tieng duoc. Chat luong kem hon nhung van ra
     * chat giong khac nhau — van hon la mot nguoi doc het.
     *
     * May thuong chi cai 1-2 giong ja-JP, nen ngoai viec chon giong khac nhau
     * con chinh cao do (pitch) theo vi tri cua nhan vat trong bang (nhan vat
     * lien ke trong bang cach xa nhau tren thang cao do), nen moi nhan vat
     * van nghe khac nhau ke ca khi chi co mot giong may.
     */
    browserVoice(speaker, explicitGender /*, dialogue */) {
      const r = giaiQuyet(speaker, explicitGender);
      const gender = r.gender;
      const lech = r.nGioi > 1 ? (r.viTri / (r.nGioi - 1) - 0.5) * 0.36 : 0;
      let list = [];
      try {
        list = (window.speechSynthesis ? speechSynthesis.getVoices() : [])
          .filter(v => v.lang && v.lang.toLowerCase().startsWith('ja'));
      } catch (e) {}

      const maleHint = /ichiro|keita|male|otoya|男/i;
      const femaleHint = /ayumi|haruka|nanami|kyoko|sayaka|female|o-ren|女/i;
      const wanted = gender === 'f' ? femaleHint : maleHint;

      const hopGioi = list.filter(v => wanted.test(v.name));
      let voice = hopGioi.length ? hopGioi[r.rank % hopGioi.length] : null;
      if (!voice && list.length > 1) {
        // Khong doan duoc ten thi chia deu: nam lay giong dau, nu lay giong sau
        voice = gender === 'f' ? list[1] : list[0];
      }
      if (!voice) voice = list[0] || null;

      return {
        voice,
        pitch: Math.max(0.1, (gender === 'f' ? 1.28 : 0.78) + lech),
        rate: 0.92,
      };
    },

    MALE, FEMALE,
    /** Ban nhung san (de kiem thu khop voi tep JSON) */
    EMBEDDED,
    ROSTER_URL,
  };

  window.SenseiVoices = SenseiVoices;
  napTuTep();
})();
