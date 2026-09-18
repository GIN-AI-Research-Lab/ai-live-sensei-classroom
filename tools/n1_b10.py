# -*- coding: utf-8 -*-
"""N1 — Bai 10: Khoi dau & Cot moc lich su — を皮切りにして (bat dau tu... lam
diem khoi dau cho mot chuoi su kien lan rong tiep theo) va を限りに (ke tu
[moc thoi gian] nay se cham dut/khong con... — tuyen bo quyet tam manh me).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 10
pool = Pool("n1")

VOCAB = [
    v(1,  "かわきり", "皮切り", "かわきり", "kawakiri", "noun", "Điểm khởi đầu, mốc mở đầu", "東京を 皮切りにして = bắt đầu từ Tokyo.", L),
    v(2,  "かぎり", "限り", "かぎり", "kagiri", "noun", "Giới hạn, mốc (dùng làm điểm chấm dứt)", "今日を 限りに = kể từ hôm nay trở đi.", L),
    v(3,  "ひろがります", "広がります", "ひろがります", "hirogarimasu", "verb", "Lan rộng, mở rộng", "支店が 広がりました = chi nhánh đã lan rộng.", L),
    v(4,  "やめます", "辞めます", "やめます", "yamemasu", "verb", "Từ chức, thôi việc", "社長を 辞めます = từ chức giám đốc.", L),
    v(5,  "してん", "支店", "してん", "shiten", "noun", "Chi nhánh", "Đã gặp N2 bài 6.", L),
    v(6,  "ぜんこく", "全国", "ぜんこく", "zenkoku", "noun", "Toàn quốc, cả nước", "Đã gặp N3 bài 7.", L),
    v(7,  "かくだいします", "拡大します", "かくだいします", "kakudai shimasu", "verb", "Mở rộng, phóng to", "Đã gặp N2 bài 7.", L),
    v(8,  "みせ", "店", "みせ", "mise", "noun", "Cửa hàng", "Đã gặp N5 bài 22.", L),
    v(9,  "たいしょく", "退職", "たいしょく", "taishoku", "noun", "Nghỉ hưu, thôi việc", "Đã gặp N3 bài 3.", L),
    v(10, "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc", "Đã gặp N4 bài 41.", L),
    v(11, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N5 bài 3.", L),
    v(12, "せいこう", "成功", "せいこう", "seikou", "noun", "Thành công", "Đã gặp N3 bài 4.", L),
    v(13, "きしゃ", "記者", "きしゃ", "kisha", "noun", "Phóng viên", "Đã gặp N1 bài 9.", L),
    v(14, "かいけん", "会見", "かいけん", "kaiken", "noun", "Cuộc họp báo, phỏng vấn chính thức", "Đã gặp N1 bài 9.", L),
    v(15, "せきにん", "責任", "せきにん", "sekinin", "noun", "Trách nhiệm", "Đã gặp N3 bài 19.", L),
    v(16, "とります", "取ります", "とります", "torimasu", "verb", "Lấy, chịu (trách nhiệm)", "Đã gặp N1 bài 9.", L),
    v(17, "あやまります", "謝ります", "あやまります", "ayamarimasu", "verb", "Xin lỗi", "Đã gặp N1 bài 9.", L),
    v(18, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N3 bài 13.", L),
    v(19, "じたい", "事態", "じたい", "jitai", "noun", "Tình thế, tình huống", "Đã gặp N1 bài 5.", L),
    v(20, "しんらい", "信頼", "しんらい", "shinrai", "noun", "Sự tin cậy", "Đã gặp N1 bài 6.", L),
]

KANJI = [
    k(1, "皮", "BÌ", 5, ["ヒ (hi)"], ["かわ"], "Da, vỏ.",
      [("皮切り", "かわきり", "Điểm khởi đầu"), ("皮膚", "ひふ", "Da")], L),
    k(2, "切", "THIẾT", 4, ["セツ (setsu)"], ["き(る)"], "Cắt.",
      [("皮切り", "かわきり", "Điểm khởi đầu"), ("切ります", "きります", "Cắt")], L),
    k(3, "限", "HẠN", 9, ["ゲン (gen)"], ["かぎ(る)"], "Giới hạn.",
      [("限り", "かぎり", "Giới hạn"), ("制限", "せいげん", "Sự hạn chế")], L),
    k(4, "拡", "KHUẾCH", 8, ["カク (kaku)"], [], "Mở rộng.",
      [("拡大", "かくだい", "Mở rộng"), ("拡張", "かくちょう", "Mở rộng, khuếch trương")], L),
    k(5, "退", "THOÁI", 9, ["タイ (tai)"], ["しりぞ(く)"], "Lui, rút lui.",
      [("退職", "たいしょく", "Nghỉ hưu"), ("退院", "たいいん", "Xuất viện")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Bắt đầu từ... (lấy làm điểm khởi đầu cho một chuỗi lan rộng): N + を皮切りにして",
        "N(sự kiện khởi đầu) + を皮切りにして、[chuỗi sự kiện tiếp theo lan rộng]",
        "を皮切りにして dùng khi một sự kiện/địa điểm là ĐIỂM KHỞI ĐẦU cho một LOẠT sự kiện TƯƠNG TỰ "
        "diễn ra SAU ĐÓ theo trình tự mở rộng — thường dùng cho việc mở rộng kinh doanh, chuỗi sự kiện lan tỏa.",
        [
            ex(L, 1, 1, [t("t-l10s1-1", "とうきょう", "東京", "とうきょう", key=True), t("t-l10s1-2", "を"),
                         t("t-l10s1-3", "かわきりにして", "皮切りにして", "かわきりにして", key=True), t("t-l10s1-4", "、"),
                         t("t-l10s1-5", "ぜんこく", "全国", "ぜんこく", key=True), t("t-l10s1-6", "に"),
                         t("t-l10s1-7", "してん", "支店", "してん", key=True), t("t-l10s1-8", "が"),
                         t("t-l10s1-9", "ひろがりました", "広がりました", "ひろがりました")],
               "Bắt đầu từ Tokyo, các chi nhánh đã lan rộng ra toàn quốc."),
            ex(L, 1, 2, [t("t-l10s1-10", "この"), t("t-l10s1-11", "せいこう", "成功", "せいこう", key=True),
                         t("t-l10s1-12", "を"), t("t-l10s1-13", "かわきりにして", "皮切りにして", "かわきりにして", key=True),
                         t("t-l10s1-14", "、"), t("t-l10s1-15", "かいしゃ", "会社", "かいしゃ", key=True), t("t-l10s1-16", "は"),
                         t("t-l10s1-17", "かくだいしました", "拡大しました", "かくだいしました")],
               "Bắt đầu từ thành công này, công ty đã mở rộng."),
        ],
        tips="を皮切りにして luôn kéo theo một chuỗi sự kiện LAN RỘNG/MỞ RỘNG ở vế sau — không dùng cho một sự kiện đơn lẻ, không có tiếp diễn.",
        culture="Lịch sử công ty Nhật hay được kể theo mẫu: '〜を皮切りにして、全国に展開した' (bắt đầu từ..., đã mở rộng ra toàn quốc) — một mô-típ tường thuật thành công kinh điển."),

    slide(L, 2,
        "2. Kể từ [mốc] này sẽ chấm dứt/không còn... (tuyên bố quyết tâm mạnh mẽ): N(thời điểm) + を限りに",
        "N(thời điểm/mốc) + を限りに、[chấm dứt việc gì]",
        "を限りに dùng để TUYÊN BỐ CHẤM DỨT một việc gì đó KỂ TỪ một mốc thời gian cụ thể — mang tính "
        "QUYẾT TÂM, DỨT KHOÁT, thường dùng trong lời tuyên bố chính thức (từ chức, giải nghệ, từ bỏ thói quen).",
        [
            ex(L, 2, 1, [t("t-l10s2-1", "きょう", "今日", "きょう", key=True), t("t-l10s2-2", "を"),
                         t("t-l10s2-3", "かぎりに", "限りに", "かぎりに", key=True), t("t-l10s2-4", "、"),
                         t("t-l10s2-5", "たいしょく", "退職", "たいしょく", key=True), t("t-l10s2-6", "します")],
               "Kể từ hôm nay, tôi sẽ nghỉ hưu."),
            ex(L, 2, 2, [t("t-l10s2-7", "きょう", "今日", "きょう", key=True), t("t-l10s2-8", "を"),
                         t("t-l10s2-9", "かぎりに", "限りに", "かぎりに", key=True), t("t-l10s2-10", "、"),
                         t("t-l10s2-11", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l10s2-12", "を"),
                         t("t-l10s2-13", "やめます", "辞めます", "やめます", key=True)],
               "Kể từ hôm nay, tôi sẽ từ chức giám đốc."),
        ],
        tips="を限りに hay đi kèm 今日/本日 (hôm nay) trong các lễ chia tay, tuyên bố từ chức — tạo cảm giác một MỐC THỜI GIAN rõ ràng, dứt khoát.",
        culture="Lời phát biểu từ chức của lãnh đạo doanh nghiệp/chính trị gia Nhật gần như luôn mở đầu bằng '本日を限りに' (kể từ ngày hôm nay) để đánh dấu một cột mốc lịch sử rõ ràng."),

    slide(L, 3,
        "3. So sánh を皮切りにして và を限りに",
        "を皮切りにして: KHỞI ĐẦU một chuỗi MỞ RỘNG　vs　を限りに: CHẤM DỨT dứt khoát kể từ một mốc",
        "を皮切りにして đánh dấu ĐIỂM BẮT ĐẦU của một quá trình PHÁT TRIỂN/LAN RỘNG (hướng về tương "
        "lai, mở ra); を限りに đánh dấu MỐC KẾT THÚC dứt khoát của một việc gì đó (hướng về việc chấm "
        "dứt, khép lại) — hai cấu trúc mang ý nghĩa TRÁI NGƯỢC nhau về mặt thời gian.",
        [
            ex(L, 3, 1, [t("t-l10s3-1", "かいしゃ", "会社", "かいしゃ", key=True), t("t-l10s3-2", "は"),
                         t("t-l10s3-3", "この"), t("t-l10s3-4", "みせ", "店", "みせ", key=True), t("t-l10s3-5", "を"),
                         t("t-l10s3-6", "かわきりにして", "皮切りにして", "かわきりにして", key=True), t("t-l10s3-7", "、"),
                         t("t-l10s3-8", "せいこう", "成功", "せいこう", key=True), t("t-l10s3-9", "しました")],
               "Công ty bắt đầu từ cửa hàng này, đã thành công. (mở đầu, hướng tới tương lai)"),
            ex(L, 3, 2, [t("t-l10s3-10", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l10s3-11", "は"),
                         t("t-l10s3-12", "きょう", "今日", "きょう", key=True), t("t-l10s3-13", "を"),
                         t("t-l10s3-14", "かぎりに", "限りに", "かぎりに", key=True), t("t-l10s3-15", "、"),
                         t("t-l10s3-16", "せきにん", "責任", "せきにん", key=True), t("t-l10s3-17", "を"),
                         t("t-l10s3-18", "とりました", "取りました", "とりました")],
               "Giám đốc, kể từ hôm nay trở đi, đã chịu trách nhiệm [và từ chức]. (kết thúc, khép lại)"),
        ],
        tips="Mẹo ghi nhớ: 皮切り (lát cắt đầu tiên) → BẮT ĐẦU; 限り (giới hạn) → KẾT THÚC.",
        culture="Trong một bài viết lịch sử công ty, hai cấu trúc thường xuất hiện ở hai ĐẦU của bài: を皮切りにして ở phần mở đầu (kể về khởi nghiệp), を限りに ở phần kết (kể về việc người sáng lập nghỉ hưu)."),

    slide(L, 4,
        "4. Kết hợp trong một bài tường thuật lịch sử công ty hoàn chỉnh",
        "東京を皮切りにして、全国に拡大した (mở đầu lịch sử) + 今日を限りに、社長を辞める (kết thúc một kỷ nguyên)",
        "Một bài viết về LỊCH SỬ CÔNG TY hoàn chỉnh thường mở đầu bằng を皮切りにして để kể về sự "
        "KHỞI ĐẦU và MỞ RỘNG, rồi kết thúc bằng を限りに khi người sáng lập/giám đốc TUYÊN BỐ RÚT LUI, "
        "khép lại một kỷ nguyên để mở ra một chương mới.",
        [
            ex(L, 4, 1, [t("t-l10s4-1", "とうきょう", "東京", "とうきょう", key=True), t("t-l10s4-2", "を"),
                         t("t-l10s4-3", "かわきりにして", "皮切りにして", "かわきりにして", key=True), t("t-l10s4-4", "、"),
                         t("t-l10s4-5", "ぜんこく", "全国", "ぜんこく", key=True), t("t-l10s4-6", "に"),
                         t("t-l10s4-7", "してん", "支店", "してん", key=True), t("t-l10s4-8", "が"),
                         t("t-l10s4-9", "ひろがりました", "広がりました", "ひろがりました")],
               "Bắt đầu từ Tokyo, các chi nhánh đã lan rộng ra toàn quốc."),
            ex(L, 4, 2, [t("t-l10s4-10", "きょう", "今日", "きょう", key=True), t("t-l10s4-11", "を"),
                         t("t-l10s4-12", "かぎりに", "限りに", "かぎりに", key=True), t("t-l10s4-13", "、"),
                         t("t-l10s4-14", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l10s4-15", "を"),
                         t("t-l10s4-16", "やめます", "辞めます", "やめます", key=True)],
               "Kể từ hôm nay, tôi sẽ từ chức giám đốc."),
        ],
        tips="を皮切りにして luôn cần một VẾ SAU thể hiện sự lan rộng; を限りに luôn cần một VẾ SAU thể hiện sự chấm dứt — không đảo ngược được ý nghĩa hai cấu trúc.",
        culture="Bài phát biểu chia tay của người sáng lập công ty Nhật thường theo khung: nhắc lại điểm khởi đầu (を皮切りにして) → thành tựu đạt được → tuyên bố rút lui trang trọng (を限りに)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Phóng viên",
         [t("d10-1", "さいしょ", "最初", "さいしょ"), t("d10-2", "の"), t("d10-3", "みせ", "店", "みせ", key=True),
          t("d10-4", "は"), t("d10-5", "どこ"), t("d10-6", "でしたか")],
         "Cửa hàng đầu tiên ở đâu?"),
    line(L, 2, "社長", "Giám đốc sáng lập",
         [t("d10-7", "とうきょう", "東京", "とうきょう", key=True), t("d10-8", "でした")],
         "Là ở Tokyo."),
    line(L, 3, "田中", "Phóng viên",
         [t("d10-9", "それから"), t("d10-10", "どう"), t("d10-11", "なりましたか")],
         "Sau đó thì sao?"),
    line(L, 4, "社長", "Giám đốc sáng lập",
         [t("d10-12", "とうきょう", "東京", "とうきょう", key=True), t("d10-13", "を"),
          t("d10-14", "かわきりにして", "皮切りにして", "かわきりにして", key=True), t("d10-15", "、"),
          t("d10-16", "ぜんこく", "全国", "ぜんこく", key=True), t("d10-17", "に"), t("d10-18", "してん", "支店", "してん", key=True),
          t("d10-19", "が"), t("d10-20", "ひろがりました", "広がりました", "ひろがりました")],
         "Bắt đầu từ Tokyo, các chi nhánh đã lan rộng ra toàn quốc."),
    line(L, 5, "田中", "Phóng viên",
         [t("d10-21", "かいしゃ", "会社", "かいしゃ", key=True), t("d10-22", "は"), t("d10-23", "かくだいしました", "拡大しました", "かくだいしました"),
          t("d10-24", "か")],
         "Công ty đã mở rộng chưa?"),
    line(L, 6, "社長", "Giám đốc sáng lập",
         [t("d10-25", "はい"), t("d10-26", "。"), t("d10-27", "この"), t("d10-28", "せいこう", "成功", "せいこう", key=True),
          t("d10-29", "を"), t("d10-30", "かわきりにして", "皮切りにして", "かわきりにして", key=True), t("d10-31", "、"),
          t("d10-32", "かいしゃ", "会社", "かいしゃ", key=True), t("d10-33", "は"), t("d10-34", "かくだいしました", "拡大しました", "かくだいしました")],
         "Vâng. Bắt đầu từ thành công này, công ty đã mở rộng."),
    line(L, 7, "田中", "Phóng viên",
         [t("d10-35", "しゃちょう", "社長", "しゃちょう", key=True), t("d10-36", "は"), t("d10-37", "いつ"),
          t("d10-38", "たいしょく", "退職", "たいしょく", key=True), t("d10-39", "しますか")],
         "Khi nào giám đốc sẽ nghỉ hưu?"),
    line(L, 8, "社長", "Giám đốc sáng lập",
         [t("d10-40", "きょう", "今日", "きょう", key=True), t("d10-41", "を"), t("d10-42", "かぎりに", "限りに", "かぎりに", key=True),
          t("d10-43", "、"), t("d10-44", "たいしょく", "退職", "たいしょく", key=True), t("d10-45", "します")],
         "Kể từ hôm nay, tôi sẽ nghỉ hưu."),
    line(L, 9, "田中", "Phóng viên",
         [t("d10-46", "しゃちょう", "社長", "しゃちょう", key=True), t("d10-47", "を"), t("d10-48", "やめる", "辞める", "やめる", key=True),
          t("d10-49", "ん"), t("d10-50", "です"), t("d10-51", "か")],
         "Ông sẽ từ chức giám đốc à?"),
    line(L, 10, "社長", "Giám đốc sáng lập",
         [t("d10-52", "はい"), t("d10-53", "。"), t("d10-54", "きょう", "今日", "きょう", key=True), t("d10-55", "を"),
          t("d10-56", "かぎりに", "限りに", "かぎりに", key=True), t("d10-57", "、"), t("d10-58", "しゃちょう", "社長", "しゃちょう", key=True),
          t("d10-59", "を"), t("d10-60", "やめます", "辞めます", "やめます", key=True)],
         "Vâng. Kể từ hôm nay, tôi sẽ từ chức giám đốc."),
]

EXERCISES = [
    q(L, 1, "「東京を皮切りにして、全国に支店が広がりました」 — を皮切りにして diễn tả điều gì?",
      ["Một sự kiện là ĐIỂM KHỞI ĐẦU cho một chuỗi sự kiện tương tự LAN RỘNG sau đó",
       "Một mốc thời gian chấm dứt hoàn toàn một việc gì đó", "Sự cho phép làm việc gì đó",
       "Một quyết định đơn lẻ, không có tiếp diễn"], 0,
      "を皮切りにして đánh dấu điểm khởi đầu cho một chuỗi sự kiện mở rộng, lan tỏa sau đó.",
      "Xem cấu trúc を皮切りにして ở slide 1."),
    q(L, 2, "「今日を限りに、退職します」 — を限りに dùng để làm gì?",
      ["Tuyên bố CHẤM DỨT một việc gì đó một cách dứt khoát kể từ một mốc thời gian",
       "Đánh dấu điểm khởi đầu cho một chuỗi sự kiện mở rộng", "Xin phép làm việc gì đó",
       "Đưa ra lời khuyên nhẹ nhàng"], 0,
      "を限りに dùng để tuyên bố chấm dứt dứt khoát một việc gì đó kể từ một mốc thời gian cụ thể.",
      "Xem cấu trúc を限りに ở slide 2."),
    q(L, 3, "Sự khác biệt cốt lõi giữa を皮切りにして và を限りに là gì?",
      ["を皮切りにして là KHỞI ĐẦU một chuỗi mở rộng; を限りに là CHẤM DỨT dứt khoát kể từ một mốc",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "を皮切りにして chỉ dùng cho câu hỏi", "を限りに chỉ dùng cho câu mở đầu"], 0,
      "Hai cấu trúc mang ý nghĩa trái ngược: một cái mở ra một chuỗi tương lai, một cái khép lại dứt khoát.",
      "Xem bảng so sánh ở slide 3."),
    q(L, 4, "「この成功を皮切りにして、会社は拡大しました」 nghĩa là:",
      ["Bắt đầu từ thành công này, công ty đã mở rộng",
       "Sau thành công này, công ty đã phá sản", "Thành công này là sự kiện cuối cùng của công ty",
       "Công ty chưa từng thành công"], 0,
      "を皮切りにして ở đây đánh dấu thành công này là điểm khởi đầu cho việc mở rộng tiếp theo.",
      "Áp dụng cấu trúc を皮切りにして cho ngữ cảnh mở rộng kinh doanh."),
    q(L, 5, "Từ nào thường đi kèm を限りに trong các lễ chia tay/tuyên bố từ chức?",
      ["今日 (hôm nay) / 本日 (ngày hôm nay)", "来年 (năm sau)", "いつか (một lúc nào đó)", "たまに (thỉnh thoảng)"], 0,
      "を限りに hay đi kèm mốc thời gian rõ ràng như 今日/本日 để tạo cảm giác dứt khoát, trang trọng.",
      "Xem lưu ý ngữ pháp ở slide 2."),
    q(L, 6, "Tại sao を皮切りにして và を限りに thường xuất hiện CÙNG NHAU trong một bài tường thuật lịch sử công ty?",
      ["Để kể về sự khởi đầu/mở rộng (を皮切りにして) rồi kết thúc bằng tuyên bố rút lui trang trọng (を限りに)",
       "Vì chúng có nghĩa giống hệt nhau nên dùng thay phiên", "Không có lý do đặc biệt",
       "Vì quy tắc ngữ pháp bắt buộc phải dùng chung"], 0,
      "を皮切りにして mở đầu câu chuyện về sự phát triển; を限りに khép lại bằng một tuyên bố rút lui dứt khoát.",
      "Xem cấu trúc bài tường thuật hoàn chỉnh ở slide 4."),
    q(L, 7, "「社長は今日を限りに、社長を辞めます」 nghĩa là:",
      ["Kể từ hôm nay, giám đốc sẽ từ chức", "Giám đốc sẽ tiếp tục làm việc mãi mãi",
       "Giám đốc mới bắt đầu công việc từ hôm nay", "Không có gì thay đổi"], 0,
      "を限りに ở đây đánh dấu hôm nay là mốc chấm dứt vai trò giám đốc.",
      "Áp dụng cấu trúc を限りに cho ngữ cảnh từ chức."),
    q(L, 8, "Theo hội thoại, công ty bắt đầu mở chi nhánh từ đâu?",
      ["Tokyo (東京を皮切りにして)", "Osaka", "Không được đề cập trong hội thoại", "Nước ngoài"], 0,
      "Giám đốc nói 「東京を皮切りにして、全国に支店が広がりました」.",
      "Xem câu thoại thứ 4."),
    q(L, 9, "Theo hội thoại, khi nào giám đốc sẽ nghỉ hưu?",
      ["Kể từ hôm nay (今日を限りに、退職します)", "Năm sau", "Không bao giờ nghỉ hưu",
       "Không được đề cập trong hội thoại"], 0,
      "Giám đốc nói 「今日を限りに、退職します」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Theo hội thoại, giám đốc xác nhận điều gì ở cuối cuộc phỏng vấn?",
      ["Sẽ từ chức giám đốc kể từ hôm nay (今日を限りに、社長を辞めます)",
       "Sẽ tiếp tục làm giám đốc thêm nhiều năm", "Sẽ mở thêm chi nhánh mới",
       "Không xác nhận điều gì cả"], 0,
      "Giám đốc xác nhận 「はい。今日を限りに、社長を辞めます」.",
      "Xem câu thoại thứ 10."),
]

LESSON = lesson(
    L,
    "Bài 10: Khởi đầu & Cột mốc lịch sử (を皮切りにして & を限りに)",
    "を皮切りにして đánh dấu một sự kiện là ĐIỂM KHỞI ĐẦU cho một chuỗi sự kiện tương tự LAN RỘNG sau "
    "đó (mở rộng kinh doanh, chuỗi sự kiện lan tỏa); を限りに dùng để TUYÊN BỐ CHẤM DỨT dứt khoát một "
    "việc gì đó kể từ một mốc thời gian cụ thể — hai cấu trúc mang ý nghĩa trái ngược, thường kết hợp "
    "trong một bài tường thuật lịch sử công ty: kể về sự khởi đầu/mở rộng rồi khép lại bằng một tuyên bố rút lui trang trọng.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
