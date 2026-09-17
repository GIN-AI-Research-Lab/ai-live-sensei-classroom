/**
 * Bảng phấn — Sensei viết, vẽ và khoanh đỏ lên màn hình
 *
 * NGUYÊN TẮC: model KHÔNG vẽ, model chỉ NÓI CẦN VẼ GÌ.
 * Cho model xuất toạ độ pixel là hỏng — nó không nhìn thấy màn hình, mà layout
 * thì co giãn theo cỡ chữ, theo cuộn trang, theo điện thoại hay desktop. Nét
 * khoanh sẽ lệch khỏi chữ ngay lần cuộn đầu tiên.
 * Thay vào đó model gọi tên mục (target_id) — y như highlight_element đã làm
 * — còn việc đo vị trí và vẽ là của tệp này. Cuộn hay đổi cỡ màn hình thì nét
 * vẽ tự bám theo.
 *
 * Ba việc:
 *   1. veLen()      — khoanh tròn / gạch chân / gạch xoá / đóng khung / mũi tên
 *   2. vietChuHan() — viết chữ Hán theo đúng thứ tự nét (dữ liệu KanjiVG)
 *   3. vietBang()   — bảng phấn tự do, Sensei viết gì lên cũng được
 */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // Net ve song lai mot chut cho ra dang viet tay. Lech qua thi nhin ban,
  // it qua thi nhin nhu hinh may ve — 1.5px la vua.
  const RUNG = 1.5;
  const rung = () => (Math.random() - 0.5) * 2 * RUNG;

  /** Ghi chu song mot lat roi tu tan, de khong phu kin man hinh */
  const HAN_GHI_CHU = 22000;
  const TOI_DA_GHI_CHU = 3;

  class SenseiBoard {
    constructor() {
      this.lop = null;          // lop SVG phu kin man hinh
      this.ghiChu = [];         // [{ id, targetId, toId, kieu, g }]
      this.bang = null;         // khung bang phan
      this.demId = 0;
      this._daGanSuKien = false;
    }

    // ====================================================== lop ve
    layLop() {
      if (this.lop) return this.lop;

      const svg = document.createElementNS(NS, 'svg');
      svg.id = 'bangVeLop';
      svg.setAttribute('class', 'bang-ve-lop');
      document.body.appendChild(svg);
      this.lop = svg;

      if (!this._daGanSuKien) {
        this._daGanSuKien = true;
        // Cuon hay doi co man hinh thi net ve phai bam theo phan tu that.
        // Dung rAF de khong tinh lai toa do tren tung su kien cuon.
        let cho = false;
        const veLai = () => {
          if (cho) return;
          cho = true;
          requestAnimationFrame(() => { cho = false; this.veLaiTatCa(); });
        };
        window.addEventListener('scroll', veLai, true);
        window.addEventListener('resize', veLai);
      }
      return svg;
    }

    /** Tim phan tu tren man hinh theo id, dung lai cach tim cua slide-engine */
    timPhanTu(targetId) {
      if (!targetId) return null;
      const eng = window.__slideEngine;
      if (eng && typeof eng.resolveElement === 'function') {
        const el = eng.resolveElement(targetId);
        if (el) return el;
      }
      return document.getElementById(targetId);
    }

    // ================================================ 1. khoanh / gach / mui ten
    /**
     * @param {string} targetId  id cua muc can danh dau
     * @param {string} kieu      khoanh | gach_chan | gach_xoa | khung | mui_ten
     * @param {object} opts      { toId } khi ve mui ten noi hai muc
     */
    veLen(targetId, kieu = 'khoanh', opts = {}) {
      const el = this.timPhanTu(targetId);
      if (!el) return false;

      const toEl = opts.toId ? this.timPhanTu(opts.toId) : null;
      if (kieu === 'mui_ten' && !toEl) kieu = 'khoanh';

      const svg = this.layLop();
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'bang-net bang-net-' + kieu);
      svg.appendChild(g);

      const ghi = { id: ++this.demId, targetId, toId: opts.toId || null, kieu, g };
      this.ghiChu.push(ghi);

      // Giu toi da vai net, cai cu nhat tu rut lui
      while (this.ghiChu.length > TOI_DA_GHI_CHU) this.xoaMot(this.ghiChu[0]);

      this.veMot(ghi);
      // Cho hieu ung chay xong roi moi dem gio — khong thi net dai bi cat ngang
      ghi.hen = setTimeout(() => this.xoaMot(ghi), HAN_GHI_CHU);

      // Chi cuon khi that su khuat. Dang nhin thay ma van cuon thi chi lam
      // trang giat, va tao them mot cu cuon de net ve chay dua.
      const r0 = el.getBoundingClientRect();
      const khuat = r0.top < 70 || r0.bottom > window.innerHeight - 90;
      if (khuat) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Do lai vai lan trong mot giay: cuon muot chay xong luc nao khong biet,
      // ma su kien scroll cua container long nhau khong phai luc nao cung bat duoc.
      [120, 350, 700, 1100].forEach(ms => setTimeout(() => {
        if (this.ghiChu.includes(ghi)) this.veMotKhongChay(ghi);
      }, ms));
      return true;
    }

    veMot(ghi) {
      const el = this.timPhanTu(ghi.targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;

      ghi.g.innerHTML = '';
      let d = '';

      if (ghi.kieu === 'gach_chan') {
        d = this.netThang(r.left - 2, r.bottom + 2, r.right + 2, r.bottom + 2);
      } else if (ghi.kieu === 'gach_xoa') {
        d = this.netThang(r.left - 2, r.top + r.height / 2, r.right + 2, r.top + r.height / 2);
      } else if (ghi.kieu === 'khung') {
        d = this.netKhung(r);
      } else if (ghi.kieu === 'mui_ten') {
        const toEl = this.timPhanTu(ghi.toId);
        if (!toEl) return;
        d = this.netMuiTen(r, toEl.getBoundingClientRect(), ghi.g);
      } else {
        d = this.netKhoanh(r);
      }

      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', 'bang-duong');
      ghi.g.insertBefore(p, ghi.g.firstChild);

      // Chay net dan ra nhu dang duoc viet, thay vi hien bup mot cai
      const dai = p.getTotalLength();
      p.style.strokeDasharray = dai;
      p.style.strokeDashoffset = dai;
      p.style.animation = `bangVeRa ${Math.min(1.1, 0.25 + dai / 900)}s ease-out forwards`;
    }

    /** Net thang co song tay */
    netThang(x1, y1, x2, y2) {
      const giua = (x1 + x2) / 2;
      return `M${x1 + rung()},${y1 + rung()} Q${giua},${(y1 + y2) / 2 + rung() * 2.5} ${x2 + rung()},${y2 + rung()}`;
    }

    /**
     * Vong khoanh: bon cung Bezier, moi diem lech mot chut, va ve QUA diem dau
     * mot doan — giong het nguoi that khoanh bang but, khong khep kin hoan hao.
     */
    netKhoanh(r) {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const rx = r.width / 2 + 10;
      const ry = r.height / 2 + 7;
      const k = 0.5523;   // he so xap xi cung tron bang Bezier
      const P = (gx, gy) => `${gx + rung()},${gy + rung()}`;

      return `M${P(cx, cy - ry)}`
        + ` C${P(cx + rx * k, cy - ry)} ${P(cx + rx, cy - ry * k)} ${P(cx + rx, cy)}`
        + ` C${P(cx + rx, cy + ry * k)} ${P(cx + rx * k, cy + ry)} ${P(cx, cy + ry)}`
        + ` C${P(cx - rx * k, cy + ry)} ${P(cx - rx, cy + ry * k)} ${P(cx - rx, cy)}`
        + ` C${P(cx - rx, cy - ry * k)} ${P(cx - rx * k, cy - ry)} ${P(cx, cy - ry)}`
        + ` C${P(cx + rx * 0.4, cy - ry)} ${P(cx + rx * 0.72, cy - ry * 0.82)} ${P(cx + rx * 0.62, cy - ry * 0.55)}`;
    }

    netKhung(r) {
      const x1 = r.left - 6, y1 = r.top - 5, x2 = r.right + 6, y2 = r.bottom + 5;
      const P = (gx, gy) => `${gx + rung()},${gy + rung()}`;
      return `M${P(x1, y1)} L${P(x2, y1)} L${P(x2, y2)} L${P(x1, y2)} L${P(x1, y1)} L${P(x2 * 0.2 + x1 * 0.8, y1)}`;
    }

    /** Mui ten noi hai muc, cong nhe cho ra net tay */
    netMuiTen(tu, den, g) {
      const x1 = tu.left + tu.width / 2;
      const y1 = tu.bottom + 4;
      const x2 = den.left + den.width / 2;
      const y2 = den.top - 8;
      const cx = (x1 + x2) / 2 + (y2 - y1) * 0.18;
      const cy = (y1 + y2) / 2;

      // Dau mui ten: hai net ngan o dau cuoi, ve rieng de khong dinh vao
      // hieu ung chay net cua than mui ten
      const goc = Math.atan2(y2 - cy, x2 - cx);
      const L = 11;
      for (const lech of [2.5, -2.5]) {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', `M${x2},${y2} L${x2 - L * Math.cos(goc - lech * 0.22)},${y2 - L * Math.sin(goc - lech * 0.22)}`);
        p.setAttribute('class', 'bang-duong bang-duong-dau');
        g.appendChild(p);
      }
      return `M${x1 + rung()},${y1 + rung()} Q${cx},${cy} ${x2 + rung()},${y2 + rung()}`;
    }

    veLaiTatCa() {
      this.ghiChu.forEach(ghi => {
        const el = this.timPhanTu(ghi.targetId);
        if (!el) return;
        const r = el.getBoundingClientRect();
        // Cuon khuat khoi man hinh thi an di cho do roi mat
        ghi.g.style.opacity = (r.bottom < 0 || r.top > window.innerHeight) ? '0' : '';
        this.veMotKhongChay(ghi);
      });
    }

    /** Ve lai vi tri nhung KHONG chay lai hieu ung — dung khi cuon trang */
    veMotKhongChay(ghi) {
      const p = ghi.g.querySelector('.bang-duong:not(.bang-duong-dau)');
      if (!p) return;
      const el = this.timPhanTu(ghi.targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2) return;

      let d;
      if (ghi.kieu === 'gach_chan') d = this.netThang(r.left - 2, r.bottom + 2, r.right + 2, r.bottom + 2);
      else if (ghi.kieu === 'gach_xoa') d = this.netThang(r.left - 2, r.top + r.height / 2, r.right + 2, r.top + r.height / 2);
      else if (ghi.kieu === 'khung') d = this.netKhung(r);
      else if (ghi.kieu === 'mui_ten') return this.veMot(ghi);
      else d = this.netKhoanh(r);

      p.setAttribute('d', d);
      p.style.strokeDasharray = '';
      p.style.strokeDashoffset = '';
      p.style.animation = '';
    }

    xoaMot(ghi) {
      const i = this.ghiChu.indexOf(ghi);
      if (i >= 0) this.ghiChu.splice(i, 1);
      clearTimeout(ghi.hen);
      if (ghi.g && ghi.g.parentNode) {
        ghi.g.style.transition = 'opacity .4s ease';
        ghi.g.style.opacity = '0';
        setTimeout(() => ghi.g.remove(), 420);
      }
    }

    xoaHetGhiChu() {
      [...this.ghiChu].forEach(g => this.xoaMot(g));
    }

    // ============================================ 2. viet chu Han theo net
    /**
     * Ve mot chu Han, tung net mot, theo dung thu tu viet chuan.
     * @param {string} ch      chu Han
     * @param {object} opts    { noi: phan tu chua, tocDo: giay moi net, hienSo }
     */
    vietChuHan(ch, opts = {}) {
      const net = window.SenseiStrokes ? window.SenseiStrokes.get(ch) : null;
      if (!net) return false;

      // Co cho ve san (vi du trong spotlight) thi ve vao do va KHONG mo bang phan.
      // Khong thi mo bang spotlight chu Han la bang bat len theo, che man hinh
      // ma chang viet gi len do.
      const veVaoBang = !opts.noi;
      const noi = opts.noi || this.moBang().than;
      const khung = window.SenseiStrokes.KHUNG || 109;
      const tocDo = opts.tocDo || 0.55;

      const hop = document.createElement('div');
      hop.className = 'bang-kanji';
      hop.innerHTML = `
        <div class="bang-kanji-o">
          <svg viewBox="0 0 ${khung} ${khung}" class="bang-kanji-svg">
            <g class="bang-kanji-ke">
              <line x1="${khung / 2}" y1="0" x2="${khung / 2}" y2="${khung}"/>
              <line x1="0" y1="${khung / 2}" x2="${khung}" y2="${khung / 2}"/>
              <line x1="0" y1="0" x2="${khung}" y2="${khung}"/>
              <line x1="${khung}" y1="0" x2="0" y2="${khung}"/>
            </g>
            <g class="bang-kanji-net"></g>
            <g class="bang-kanji-so"></g>
          </svg>
        </div>
        <div class="bang-kanji-chan">
          <span class="bang-kanji-ten">${ch} — ${net.length} nét</span>
          <button type="button" class="bang-kanji-lai" title="Viết lại từ đầu">
            <i class="fa-solid fa-rotate-left"></i><span>Viết lại</span>
          </button>
        </div>`;
      noi.appendChild(hop);

      const gNet = hop.querySelector('.bang-kanji-net');
      const gSo = hop.querySelector('.bang-kanji-so');

      const chay = () => {
        gNet.innerHTML = '';
        gSo.innerHTML = '';
        net.forEach((d, i) => {
          const p = document.createElementNS(NS, 'path');
          p.setAttribute('d', d);
          p.setAttribute('class', 'bang-kanji-duong');
          gNet.appendChild(p);

          const dai = p.getTotalLength();
          p.style.strokeDasharray = dai;
          p.style.strokeDashoffset = dai;
          p.style.animation = `bangVeRa ${tocDo}s ease-out ${i * tocDo}s forwards`;

          // So thu tu net, hien ngay truoc khi net do duoc viet
          if (opts.hienSo !== false) {
            try {
              const d0 = p.getPointAtLength(0);
              const t = document.createElementNS(NS, 'text');
              t.setAttribute('x', d0.x);
              t.setAttribute('y', d0.y);
              t.setAttribute('class', 'bang-kanji-chiso');
              t.textContent = String(i + 1);
              t.style.animation = `bangHienSo .25s ease-out ${i * tocDo}s forwards`;
              gSo.appendChild(t);
            } catch (e) { /* trinh duyet cu khong do duoc diem dau net */ }
          }
        });
      };

      chay();
      hop.querySelector('.bang-kanji-lai').addEventListener('click', chay);
      if (veVaoBang) {
        this.moBang();
        noi.scrollTop = noi.scrollHeight;
      }
      return true;
    }

    // ==================================================== 3. bang phan tu do
    moBang() {
      if (this.bang) {
        this.bang.khung.classList.remove('hidden');
        document.body.classList.add('co-bang');
        return this.bang;
      }
      const khung = document.createElement('aside');
      khung.id = 'bangPhan';
      khung.className = 'bang-phan';
      khung.innerHTML = `
        <header class="bang-phan-dau">
          <span><i class="fa-solid fa-chalkboard"></i> Bảng của Sensei</span>
          <div class="bang-phan-nut">
            <button type="button" data-bang="xoa" title="Xoá bảng"><i class="fa-solid fa-eraser"></i></button>
            <button type="button" data-bang="dong" title="Cất bảng đi"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </header>
        <div class="bang-phan-than"></div>`;
      document.body.appendChild(khung);

      khung.querySelector('[data-bang="xoa"]').addEventListener('click', () => this.xoaBang());
      khung.querySelector('[data-bang="dong"]').addEventListener('click', () => {
        khung.classList.add('hidden');
        document.body.classList.remove('co-bang');
      });

      this.bang = { khung, than: khung.querySelector('.bang-phan-than') };
      document.body.classList.add('co-bang');
      return this.bang;
    }

    /** Viet mot dong len bang. kieu: thuong | dam | nhat */
    vietBang(text, kieu = 'thuong') {
      if (!text) return false;
      const b = this.moBang();
      const dong = document.createElement('div');
      dong.className = 'bang-dong bang-dong-' + kieu;
      dong.textContent = String(text);
      b.than.appendChild(dong);
      b.than.scrollTop = b.than.scrollHeight;

      // Bang day qua thi bo bot dong cu nhat, giu bang con doc duoc
      while (b.than.children.length > 14) b.than.removeChild(b.than.firstChild);
      return true;
    }

    xoaBang() {
      if (this.bang) this.bang.than.innerHTML = '';
      this.xoaHetGhiChu();
    }

    /** Cat bang di, giu nguyen noi dung da viet */
    dongBang() {
      if (!this.bang) return;
      this.bang.khung.classList.add('hidden');
      document.body.classList.remove('co-bang');
    }

    /** Doi bai / doi chuong thi lau bang di */
    lauSach() {
      this.xoaHetGhiChu();
      if (this.bang) {
        this.bang.than.innerHTML = '';
        this.bang.khung.classList.add('hidden');
      }
      document.body.classList.remove('co-bang');
    }

    trangThai() {
      return {
        soNetDangVe: this.ghiChu.length,
        bangDangMo: !!(this.bang && !this.bang.khung.classList.contains('hidden')),
        soDongTrenBang: this.bang ? this.bang.than.children.length : 0,
        soChuHanCoNet: window.SenseiStrokes ? window.SenseiStrokes.size() : 0,
      };
    }
  }

  window.SenseiBoard = new SenseiBoard();
})();
