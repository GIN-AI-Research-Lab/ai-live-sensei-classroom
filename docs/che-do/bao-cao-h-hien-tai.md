# Bao cao che do H "Giay cat lop"

## 1. Files
- js/che-do/h.js (~160 KB, build tu src/h-*.js bang build.py), css/che-do/h.css (sinh tu src/h.src.css, don vi "Nu" = N*var(--hu))
- assets/che-do/h/: nhac-h.mp3 (581 KB, 58 s, lap), s-*.mp3 x13 (~100 KB) => 720 KB
- curriculum/che-do/h/: index.json + N5-1, N5-10, N4-30, N1-3, KANA-5 .json (ghi de theo bai)
- tools/tinh-chinh-che-do.mjs (do tung nhip, ghi ghi de; cong 9700-9749)
- Khong sua: che-do.js, motion.js, app.js, j.*; khong commit.

## 2. Giong ban mau
- Port diorama: 7 lop parallax (mat troi .015, may .07, nui .16/.28, doi .5/.72, co truoc 1.25) ve 1 lan bang canvas -> anh lap; may quay power2.inOut 1.0 s, troi +-16 px, crane 56->0 2.6 s power2.out; hang so tween giu nguyen: tha 0.95 power3.out + elastic.out(1,.32) 2.1 s; moGap dai .42 power3.out + lat rotationX -86 .78 back.out(1.25) (perspective 1300); lat .85 back.out(1.2); roi .6 back.out(1.7); dan .5 back.out(2.2); nay .14 power2.out + .5 back.out(2.4); rem 1.0 power3.inOut; vong khoanh .6 power2.inOut; hoa giay 24 manh.
- Da so sanh bang so-sanh.jpg (6 khoanh) + 4 vong sua: (1) sua RC() loi toa do, (2) co dinh lop nen do sai kich thuoc luc batDau, (3) bo cuc dien thoai/man hinh cao/sieu rong, (4) bo blend-mode.
- CHUA co bang do lech hinh chu nhat bang so (chi so sanh bang mat, so-sanh.jpg). Khong khang dinh <=10 % bang phep do.
- Bo phu de/bong thoai Sensei: khong co. Giu day du noi dung bai (them o tro: giai thich, luu y, van hoa, am on/kun, tu ghep, goi y...).

## 3. Quiz
The that nam trong o (khong clone). CSS an .qz-fb va chu "Dung roi!/Chua dung" cua chan the; chi con vong khoanh dap an dung, dau X, tam giay "Giai thich" + "Goi y" (tu data) -> quiz.mjs: fbHienThi=false, chanChuHienThi=false sau tra loi.

## 4. Test (so do duoc)
- node --check h.js, tinh-chinh-che-do.mjs: OK.
- kiem-che-do.mjs h all (ban sao cong 9700): kiem 14/14 dat, khong loi console; video demo-h.mp4 ~54 fps (screencast headless).
- smoke mac-dinh (T1 T3 T11 T13 T14 A2 A5 RB smoke): tat ca dat.
- kiem-man-hinh.mjs (10 co x 7 dang, ket-qua man-final.txt): xem chup/man-final.
- probe do-bo-cuc.mjs h (--bong .h-khong-bong) lan cuoi: 41 FAIL / 44 WARN  -> KHONG dat 0 FAIL. Lan --nhanh truoc do: 13 FAIL. Phan lon: BLANK-FLASH luc chuyen canh (~700 ms), vai CLIPPED/OVERLAP o bai tap stress tren 390 (dap an rat dai), the chuong/ket bai bi do vao luc khong on dinh. Chua sua het.
- Hieu nang (perf.mjs, 60 s, warm 8 s, headless SwiftShader): xem perf-final-*.json. Desktop 1x: p50 18.3 / p95 19.1 / p99 19.5 ms (may dang tai), khung >33 ms ~10/phut, max ~72 ms; mac-dinh: 0/phut. 4x CPU: p95 19.0, p99 ~72, >33 ms ~108-111/phut (mac-dinh 28/phut), longtask max ~480 ms. Muc tieu "khong khung >33 ms luc chuyen canh" KHONG dat.
  Da lam: dungNhip 85-170 ms -> 2-8 ms (do chu bang canvas measureText, khong forced layout, dung canh roi gan theo lo, cache khung bang ResizeObserver), bo background-blend-mode (van giay = lop den trong suot), lop nen do phan giai thap hon cho lop xa. Phan giat con lai o ranh gioi nhip nam o dao dien (dung canh mac dinh an duoi lop) va tinh lai style toan trang (~28 ms/lan, ~940 phan tu) -> Request.

## 5. Am thanh
nhac-h.mp3 (nhac-H.wav 62 s, noi vong crossfade 4 s, 80 kbps) + 13 SFX (whoosh, trans, tick, stamp, ding, step0-3, correct, wrong, sparkle, finale) tu bo SFX cua video. WebAudio, dung ctx cua __audioEngine neu co; nhac KHONG qua outBus (meo khong nhep theo nhac). Ha nhac theo getOutputLevel/isPlaying: attack 60 ms, giu 280 ms, nha 350 ms. Do: giong Sensei RMS ~0.10 (-20 dBFS); nhac RMS -26 dBFS goc: gain khi noi 0.19 (-40 dBFS = -20 dB so voi giong), khi im 0.46 (-32 dBFS). SFX gain 0.55. SFX bat dau trong callback GSAP cua chinh khung bat dau tween (lech am-hinh ~0 trong cung tick; do tre dau ra phan cung khong do). Dung o ketThuc (tam dung/doi che do), nut mute nho goc trai tren (luu localStorage sensei_che_do_h_am), mo khoa theo cu cham dau neu AudioContext suspended.

## 6. Ghi de theo bai
Loader: index.json (hash) -> N-x.json neu hash noi dung bai khop (hashBai FNV-1a), khong 404. fs/tre/pos theo nhip va man hinh (1440x900 / 390x844). Tool do tung nhip (het() + tua GSAP), ha co chu x0.9 toi 4 lan khi chong/cat/de len meo. Da tao 5 bai (con van: N5-1 390: 1; KANA-5: 3 / 7 nhip). Da kiem tra tai ghi de (N5-1, nhip 6 -> fs.phu=13). Nhip dau cua phien dung auto-fit (ghi de nap bat dong bo).

## 7. Mon con thieu / can tai nghe
- Probe chua 0 FAIL (xem tren). Man hinh ngang dien thoai (844x390): bo cuc co 4-17 van de, chu < 13 px: chua giai quyet.
- Man hinh cao (>=1.2 cao/rong) dung bo cuc dien thoai phong ra, can giua; sieu rong keo ngang toi da 1.38 lan.
- Nhan thinh: do to nhac (nen -20 dB so voi giong), SFX whoosh dinh 0.27 s sau khi bat dau.
## Requests
1. do-bo-cuc.mjs: them BAL_MAC_DINH.h = ['.h-khong-bong'] (che do H khong co bong thoai; h-dan bi nhan nham).
2. motion.js: khong dung canh mac dinh an duoi lop khi che do da dung nhip (nguyen nhan chinh khung >33 ms moi nhip).
