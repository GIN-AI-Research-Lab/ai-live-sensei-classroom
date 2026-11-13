/**
 * Cau hinh Tailwind cho ban BIEN DICH TINH (P0-2a).
 *
 * Truoc day cau hinh nay nam inline trong index.html va duoc Tailwind Play
 * (vendor/tailwind.js) doc luc chay — Play vua bien dich CSS tren main thread
 * vua gan MutationObserver quet lai DOM moi lan app doi innerHTML.
 * Nay cau hinh chuyen nguyen ven (bang mau "giay be" + font) sang file nay,
 * build bang: npm run build:css  ->  css/tailwind-built.css
 *
 * Y nghia bang mau giu nguyen nhu ban inline cu:
 *   Giao dien goc la dark theme, nen thang do slate duoc DAO NGUOC:
 *     slate-950/900 -> giay sang (nen trang, mat the)
 *     slate-100/200 -> muc dam (chu)
 *   Cac mau nhan giu nguyen quy uoc: 100-400 = chu dam,
 *   500-700 = nen dac (chu trang), 800-950 = nen nhat.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  // Kiem chung do phu khi build P0-2a: trich token class tu index.html + js/**/*.js,
  // 195/195 token dung cu phap utility Tailwind deu co trong css/tailwind-built.css
  // (token con lai la class tu dinh nghia cua app / FontAwesome / moc JS khong co style).
  // Khong tim thay mau ghep chuoi class dong -> safelist de trong.
  safelist: [],
  theme: {
    extend: {
      colors: {
        ink: '#1f1d19',
        paper: '#f0ebe1',

        /* Cau truc: giay & muc */
        slate: {
          50:  '#14120f', 100: '#1f1d19', 200: '#2e2a24', 300: '#453e34',
          400: '#6b6355', 500: '#70675a', 600: '#b3a794', 700: '#d3c5af',
          800: '#e5dbcb', 900: '#faf7f2', 950: '#f0ebe1',
        },
        /* Nhan chinh: terracotta */
        indigo: {
          50:  '#fdf9f7', 100: '#5f2715', 200: '#7a331c', 300: '#964126',
          400: '#a9492b', 500: '#c96442', 600: '#b4543a', 700: '#9b4530',
          800: '#f2e0d7', 900: '#f6e7df', 950: '#fbf2ec',
        },
        /* Dung / thanh cong: xanh reu */
        emerald: {
          50:  '#f7faf5', 100: '#1e2b18', 200: '#2a3b22', 300: '#3e5c35',
          400: '#4c7040', 500: '#6b8a5e', 600: '#4f6d45', 700: '#3e5836',
          800: '#e3ecdd', 900: '#eaf0e5', 950: '#f3f7ef',
        },
        /* Sai / canh bao: dat nung */
        rose: {
          50:  '#fdf7f5', 100: '#3a1713', 200: '#4a1e18', 300: '#8b3628',
          400: '#a54331', 500: '#c25a4c', 600: '#ac4739', 700: '#913a2e',
          800: '#f3ddd7', 900: '#f7e5e0', 950: '#fcf3f0',
        },
        red: {
          50:  '#fdf7f5', 100: '#3a1713', 200: '#4a1e18', 300: '#8b3628',
          400: '#a54331', 500: '#c2503f', 600: '#ac4739', 700: '#913a2e',
          800: '#f3ddd7', 900: '#f7e5e0', 950: '#fcf3f0',
        },
        /* Luu y: vang nghe */
        amber: {
          50:  '#fdfaf2', 100: '#332510', 200: '#42300f', 300: '#7a5a18',
          400: '#8f6a1c', 500: '#c0952f', 600: '#9a7726', 700: '#7e611f',
          800: '#f2ecda', 900: '#f6eedc', 950: '#fbf6eb',
        },
        purple: {
          50:  '#fbf7fb', 100: '#3a2840', 200: '#4a3450', 300: '#5e3f63',
          400: '#6f4a74', 500: '#8a5e90', 600: '#744e79', 700: '#5e3f63',
          800: '#ece2ee', 900: '#f2eaf3', 950: '#f8f4f9',
        },
        /* Nhan tu loai trong the tu vung */
        blue:   { 300: '#33507a', 400: '#3d5c8a', 500: '#4a6fa5', 600: '#3d5c8a' },
        cyan:   { 300: '#1f5c5c', 400: '#24706e', 500: '#2f8a87' },
        teal:   { 300: '#1f5c5c', 400: '#24706e', 500: '#2f8a87' },
        pink:   { 300: '#8a3a5c', 400: '#9c4368', 500: '#b05078' },
        orange: { 300: '#8a4a1c', 400: '#a25a20', 500: '#c07a32' },
      },
      fontFamily: {
        sans:  ['Inter', 'Noto Sans JP', 'system-ui', 'Segoe UI', 'sans-serif'],
        serif: ['Noto Serif JP', 'Yu Mincho', 'Georgia', 'serif'],
      },
    }
  }
}
