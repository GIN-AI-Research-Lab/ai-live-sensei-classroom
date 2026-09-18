# -*- coding: utf-8 -*-
"""N4 — Bai 29: Tu dong tu & Tha dong tu, trang thai V-ています.

Day la mot trong nhung diem ngu phap quan trong nhat N4. Cac cap dong tu
CHINH (開く/開ける, 消える/消す, 始まる/始める) la kien thuc ngu phap loi,
khong nam du trong pool JLPT (mot so da hoc o N5, mot so la tro tu ngu
phap can thiet), nen dua vao thu cong nhu da lam voi agemasu/omoimasu.
Tu vung phu tro con lai TU CHON tu pool mo data/jlpt-vocab/n4.csv.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 29
pool = Pool("n4")

VOCAB = [
    v(1,  "あきます", "開きます", "あきます", "akimasu", "verb", "Mở ra (tự động từ)", "Đã gặp N5 bài 23. 自動詞: cửa TỰ mở, không cần ai tác động.", L),
    v(2,  "あけます", "開けます", "あけます", "akemasu", "verb", "Mở (tha động từ)", "Đã gặp N5 bài 14. 他動詞: CÓ NGƯỜI mở cửa.", L),
    v(3,  "しまります", "閉まります", "しまります", "shimarimasu", "verb", "Đóng lại (tự động từ)", "ドアが 閉まりました = cửa tự đóng lại.", L),
    v(4,  "しめます", "閉めます", "しめます", "shimemasu", "verb", "Đóng (tha động từ)", "Đã gặp N5 bài 14. だれかが 閉めました = ai đó đã đóng cửa.", L),
    v(5,  "きえます", "消えます", "きえます", "kiemasu", "verb", "Tắt đi, biến mất (tự động từ)", "電気が 消えました = đèn tự tắt (mất điện...).", L),
    v(6,  "けします", "消します", "けします", "keshimasu", "verb", "Tắt, xóa (tha động từ)", "Đã gặp N5 bài 15. だれかが 消しました = ai đó đã tắt đèn.", L),
    v(7,  "はじまります", "始まります", "はじまります", "hajimarimasu", "verb", "Bắt đầu (tự động từ)", "映画が 始まりました = phim tự bắt đầu (đến giờ chiếu).", L),
    v(8,  "はじめます", "始めます", "はじめます", "hajimemasu", "verb", "Bắt đầu (tha động từ)", "だれかが 始めました = ai đó bắt đầu việc gì.", L),
    v(9,  "つきます", "点きます", "つきます", "tsukimasu", "verb", "Được bật lên, sáng lên (tự động từ)", "電気が 点きました = đèn tự sáng lên (đến giờ hẹn...).", L),
    v(10, "こわれます", "壊れます", "こわれます", "kowaremasu", "verb", "Bị hỏng (tự động từ)", "Đã gặp bài 26.", L),
    v(11, "こわします", "壊します", "こわします", "kowashimasu", "verb", "Làm hỏng (tha động từ)", "だれかが 壊しました = ai đó làm hỏng.", L),
    v(12, "とめます", "止めます", "とめます", "tomemasu", "verb", "Dừng lại, đỗ (tha động từ)", "Đã gặp N5 bài 15. 車を 止めます = đỗ xe (có người điều khiển).", L),
    v(13, "やめます", "止めます／辞めます", "やめます", "yamemasu", "verb", "Dừng hẳn, từ bỏ (thói quen/công việc)", "たばこを やめます = bỏ thuốc lá. 仕事を やめます = nghỉ việc.", L),
    v(14, "でんき", "電気", "でんき", "denki", "noun", "Điện, đèn điện", "Đã gặp N5 bài 15.", L),
    v(15, "まど", "窓", "まど", "mado", "noun", "Cửa sổ", "Đã gặp N5 bài 14.", L),
    v(16, "ドア", "", "", "doa", "noun", "Cửa (kiểu phương Tây)", "", L),
    v(17, "えいが", "映画", "えいが", "eiga", "noun", "Phim, điện ảnh", "Đã gặp N5 bài 6.", L),
    v(18, "うつくしい", "美しい", "うつくしい", "utsukushii", "adjective", "Đẹp, tráng lệ", "Tính từ い, trang trọng hơn きれい.", L),
    v(19, "おもいだします", "思い出します", "おもいだします", "omoidashimasu", "verb", "Nhớ lại, hồi tưởng", "急に 思い出しました = bỗng nhớ lại.", L),
    v(20, "きゅうに", "急に", "きゅうに", "kyuu ni", "adverb", "Đột ngột, bỗng nhiên", "急に 電気が 消えました = đèn bỗng nhiên tắt.", L),
]

KANJI = [
    k(1, "開", "KHAI", 12, ["カイ (kai)"], ["あ(く)", "あ(ける)"], "Mở. Đã gặp N5 bài 14.",
      [("開きます", "あきます", "Mở ra (tự)"), ("開けます", "あけます", "Mở (tha)"), ("開発", "かいはつ", "Phát triển")], L),
    k(2, "閉", "BẾ", 11, ["ヘイ (hei)"], ["し(まる)", "し(める)"], "Đóng. Đã gặp N5 bài 14.",
      [("閉まります", "しまります", "Đóng lại (tự)"), ("閉めます", "しめます", "Đóng (tha)"), ("閉店", "へいてん", "Đóng cửa hàng")], L),
    k(3, "消", "TIÊU", 10, ["ショウ (shou)"], ["き(える)", "け(す)"], "Tắt, biến mất, tiêu hao.",
      [("消えます", "きえます", "Tắt (tự)"), ("消します", "けします", "Tắt (tha)"), ("消防車", "しょうぼうしゃ", "Xe cứu hỏa")], L),
    k(4, "始", "THỦY", 8, ["シ (shi)"], ["はじ(まる)", "はじ(める)"], "Bắt đầu, khởi đầu.",
      [("始まります", "はじまります", "Bắt đầu (tự)"), ("始めます", "はじめます", "Bắt đầu (tha)"), ("開始", "かいし", "Sự khởi đầu")], L),
    k(5, "美", "MỸ", 9, ["ビ (bi)"], ["うつく(しい)"], "Đẹp.",
      [("美しい", "うつくしい", "Đẹp"), ("美術", "びじゅつ", "Mỹ thuật"), ("美人", "びじん", "Người đẹp")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Cặp tự động từ (自動詞) & tha động từ (他動詞)",
        "開く(tự)/開ける(tha)　閉まる(tự)/閉める(tha)　消える(tự)/消す(tha)　始まる(tự)/始める(tha)",
        "Tự động từ: chủ ngữ TỰ trải qua thay đổi, KHÔNG có ai tác động (thường đi với が). "
        "Tha động từ: CÓ người/vật tác động lên đối tượng để gây ra thay đổi đó (đi với を).",
        [
            ex(L, 1, 1, [t("t-l29s1-1", "ドア"), t("t-l29s1-2", "が"), t("t-l29s1-3", "あきました", "開きました", "あきました", key=True)],
               "Cửa tự mở ra. (không rõ/không cần biết ai mở — có thể do gió)"),
            ex(L, 1, 2, [t("t-l29s1-4", "わたし", "私", "わたし"), t("t-l29s1-5", "は"),
                         t("t-l29s1-6", "ドア"), t("t-l29s1-7", "を"), t("t-l29s1-8", "あけました", "開けました", "あけました", key=True)],
               "Tôi đã mở cửa. (rõ ràng CÓ người chủ động mở)"),
        ],
        tips="Mẹo nhận diện nhanh: câu có chủ ngữ RÕ RÀNG là người + を → tha động từ; chủ ngữ là VẬT + が, không nói ai làm → tự động từ.",
        culture="Biển báo tự động ở cửa hàng Nhật thường dùng tự động từ: 自動ドア (cửa tự động) khi 開きます mà không cần ai đẩy."),

    slide(L, 2,
        "2. Trạng thái với tự động từ: Nが V(tự)ています",
        "N が [tự động từ]ています   (miêu tả TRẠNG THÁI hiện tại của vật, không rõ/không quan tâm ai gây ra)",
        "Đây là điểm khác biệt N4 so với N5: với tự động từ, Vています diễn tả TRẠNG THÁI HIỆN TẠI "
        "của vật (kết quả để lại), khác với tha động từ +てあります sẽ học ở bài 30.",
        [
            ex(L, 2, 1, [t("t-l29s2-1", "まど", "窓", "まど"), t("t-l29s2-2", "が"),
                         t("t-l29s2-3", "あいて", "開いて", "あいて", key=True), t("t-l29s2-4", "います", "居ます", "います")],
               "Cửa sổ đang mở. (miêu tả trạng thái, không cần biết ai mở)"),
            ex(L, 2, 2, [t("t-l29s2-5", "でんき", "電気", "でんき"), t("t-l29s2-6", "が"),
                         t("t-l29s2-7", "きえて", "消えて", "きえて", key=True), t("t-l29s2-8", "います", "居ます", "います")],
               "Đèn đang tắt."),
        ],
        tips="窓が開いています (trạng thái) khác 窓を開けています (ai đó ĐANG THỰC HIỆN hành động mở, tức thời) — chọn đúng động từ quyết định nghĩa.",
        culture="Mô tả hiện trường/tình huống trong tiếng Nhật ưu tiên tự động từ+ています khi không cần chỉ rõ ai là người gây ra thay đổi."),

    slide(L, 3,
        "3. Bắt đầu/kết thúc: 始まります/始めます",
        "N が 始まります (自: tự đến giờ)　　N を 始めます (他: ai đó chủ động bắt đầu)",
        "Sự kiện có LỊCH TRÌNH cố định (phim, buổi họp) thường dùng tự động từ 始まります vì nó "
        "'tự' đến giờ mà bắt đầu. Việc CHỦ ĐỘNG khởi xướng thì dùng tha động từ 始めます.",
        [
            ex(L, 3, 1, [t("t-l29s3-1", "えいが", "映画", "えいが"), t("t-l29s3-2", "が"),
                         t("t-l29s3-3", "はじまりました", "始まりました", "はじまりました", key=True)],
               "Phim đã bắt đầu. (đến giờ chiếu tự nhiên)"),
            ex(L, 3, 2, [t("t-l29s3-4", "かいぎ", "会議", "かいぎ"), t("t-l29s3-5", "を"),
                         t("t-l29s3-6", "はじめましょう", "始めましょう", "はじめましょう", key=True)],
               "Chúng ta bắt đầu cuộc họp thôi. (chủ động khởi xướng)"),
        ],
        tips="Vましょう (rủ rê, N5 bài 6) chỉ ghép được với THA động từ vì cần một chủ thể chủ động thực hiện — không nói 始まりましょう.",
        culture="Người dẫn chương trình/chủ trì cuộc họp ở Nhật luôn dùng 始めます (tha động từ) để mở đầu, thể hiện họ là người chủ động điều khiển."),

    slide(L, 4,
        "4. Dừng lại/từ bỏ: 止めます vs やめます",
        "止めます (dừng một HÀNH ĐỘNG/chuyển động cụ thể)　　やめます (từ bỏ HẲN một thói quen/công việc)",
        "Hai từ đọc GIỐNG NHAU (cùng chữ 止める đọc とめる/やめる tùy nghĩa, hoặc viết riêng 辞める "
        "cho việc nghỉ làm) nhưng phạm vi khác nhau — 止める tạm dừng, やめる bỏ luôn không làm nữa.",
        [
            ex(L, 4, 1, [t("t-l29s4-1", "くるま", "車", "くるま"), t("t-l29s4-2", "を"),
                         t("t-l29s4-3", "とめました", "止めました", "とめました", key=True)],
               "Tôi đã dừng/đỗ xe lại. (tạm dừng chuyển động)"),
            ex(L, 4, 2, [t("t-l29s4-4", "たばこ", "煙草", "たばこ"), t("t-l29s4-5", "を"),
                         t("t-l29s4-6", "やめました", "止めました", "やめました", key=True)],
               "Tôi đã bỏ thuốc lá. (từ bỏ hẳn thói quen)"),
        ],
        tips="仕事を やめます (nghỉ việc HẲN, thường viết 辞めます) khác 仕事を 休みます (nghỉ TẠM, N5 bài 17) — đừng nhầm hai từ này.",
        culture="たばこをやめました là câu tự hào phổ biến của người Nhật đã cai thuốc thành công, thường được khen ngợi khi chia sẻ."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên năm 3",
         [t("d-l29-1", "あれ"), t("d-l29-2", "、"), t("d-l29-3", "でんき", "電気", "でんき", key=True),
          t("d-l29-4", "が"), t("d-l29-5", "きえて", "消えて", "きえて", key=True), t("d-l29-6", "います", "居ます", "います")],
         "Ơ, đèn đang tắt kìa."),
    line(L, 2, "サントス", "Sinh viên năm 3",
         [t("d-l29-7", "きゅうに", "急に", "きゅうに", key=True), t("d-l29-8", "きえました", "消えました", "きえました"),
          t("d-l29-9", "。"), t("d-l29-10", "だれ", "誰", "だれ"), t("d-l29-11", "も"), t("d-l29-12", "けしません", "消しません", "けしません"),
          t("d-l29-13", "でした")],
         "Nó tự nhiên tắt vậy đấy. Không ai tắt cả."),
    line(L, 3, "ワン", "Sinh viên năm 3",
         [t("d-l29-14", "まど", "窓", "まど", key=True), t("d-l29-15", "も"), t("d-l29-16", "あいて", "開いて", "あいて", key=True),
          t("d-l29-17", "います", "居ます", "居ます")],
         "Cửa sổ cũng đang mở nữa."),
    line(L, 4, "サントス", "Sinh viên năm 3",
         [t("d-l29-18", "だれ", "誰", "だれ"), t("d-l29-19", "が"), t("d-l29-20", "あけました", "開けました", "あけました", key=True),
          t("d-l29-21", "か")],
         "Ai đã mở nó vậy nhỉ?"),
    line(L, 5, "ワン", "Sinh viên năm 3",
         [t("d-l29-22", "わかりません", "分かりません", "わかりません"), t("d-l29-23", "。"), t("d-l29-24", "あ"), t("d-l29-25", "、"),
          t("d-l29-26", "えいが", "映画", "えいが", key=True), t("d-l29-27", "が"), t("d-l29-28", "はじまります", "始まります", "はじまります", key=True),
          t("d-l29-29", "よ")],
         "Không biết nữa. À, phim sắp bắt đầu rồi kìa."),
    line(L, 6, "サントス", "Sinh viên năm 3",
         [t("d-l29-30", "じゃ"), t("d-l29-31", "、"), t("d-l29-32", "まど", "窓", "まど"), t("d-l29-33", "を"),
          t("d-l29-34", "しめましょう", "閉めましょう", "しめましょう", key=True)],
         "Vậy đóng cửa sổ lại thôi."),
    line(L, 7, "ワン", "Sinh viên năm 3",
         [t("d-l29-35", "はい"), t("d-l29-36", "。"), t("d-l29-37", "でんき", "電気", "でんき", key=True),
          t("d-l29-38", "も"), t("d-l29-39", "つけましょう", "点けましょう", "つけましょう")],
         "Vâng. Bật đèn lên luôn nhé."),
    line(L, 8, "サントス", "Sinh viên năm 3",
         [t("d-l29-40", "あ"), t("d-l29-41", "、"), t("d-l29-42", "おもいだしました", "思い出しました", "おもいだしました", key=True),
          t("d-l29-43", "。"), t("d-l29-44", "でんき", "電気", "でんき"), t("d-l29-45", "が"),
          t("d-l29-46", "こわれて", "壊れて", "こわれて", key=True), t("d-l29-47", "います", "居ます", "います")],
         "À, tôi nhớ ra rồi. Đèn đang bị hỏng đấy."),
    line(L, 9, "ワン", "Sinh viên năm 3",
         [t("d-l29-48", "だれ", "誰", "だれ"), t("d-l29-49", "が"), t("d-l29-50", "こわしました", "壊しました", "こわしました", key=True),
          t("d-l29-51", "か")],
         "Ai làm hỏng vậy?"),
    line(L, 10, "サントス", "Sinh viên năm 3",
         [t("d-l29-52", "わかりません", "分かりません", "わかりません"), t("d-l29-53", "。"), t("d-l29-54", "でも"),
          t("d-l29-55", "、"), t("d-l29-56", "えいが", "映画", "えいが", key=True), t("d-l29-57", "が"),
          t("d-l29-58", "はじまりました", "始まりました", "はじまりました", key=True), t("d-l29-59", "から"),
          t("d-l29-60", "、"), t("d-l29-61", "あとで"), t("d-l29-62", "しらべましょう", "調べましょう", "しらべましょう")],
         "Không biết nữa. Nhưng phim bắt đầu rồi nên lát nữa kiểm tra sau nhé."),
]

EXERCISES = [
    q(L, 1, "「ドアが開きました」 và 「ドアを開けました」 khác nhau ở:",
      ["Câu đầu là tự động từ (không rõ ai mở), câu sau là tha động từ (có người chủ động mở)",
       "Hoàn toàn giống nhau", "Câu đầu sai ngữ pháp",
       "Câu sau chỉ dùng cho cửa sổ"], 0,
      "開く (tự) dùng が, không cần chủ thể; 開ける (tha) dùng を, cần người/vật tác động.",
      "So sánh trợ từ が và を đi kèm."),
    q(L, 2, "「窓が開いています」 diễn tả điều gì?",
      ["Trạng thái HIỆN TẠI của cửa sổ (đang mở), không quan tâm ai mở",
       "Ai đó đang trong quá trình mở cửa sổ", "Cửa sổ sắp mở",
       "Cửa sổ đã đóng lại rồi"], 0,
      "Tự động từ + ています diễn tả TRẠNG THÁI đang tồn tại của vật — điểm ngữ pháp N4 mới so với N5.",
      "Đây là điểm khác biệt N4 nêu ở slide 2."),
    q(L, 3, "「映画が始まりました」 vì sao dùng tự động từ 始まる?",
      ["Phim có lịch chiếu cố định, tự đến giờ mà bắt đầu, không cần nhấn mạnh ai bắt đầu",
       "始める là từ sai, phải sửa lại", "始まる chỉ dùng cho câu hỏi",
       "Không có lý do gì đặc biệt"], 0,
      "Sự kiện có LỊCH TRÌNH cố định thường dùng tự động từ vì nó 'tự' đến giờ mà xảy ra.",
      "So sánh với 会議を始めましょう (chủ động khởi xướng) ở slide 3."),
    q(L, 4, "Câu nào KHÔNG được phép nói (vì thiếu chủ thể chủ động)?",
      ["会議が 始まりましょう", "会議を 始めましょう",
       "映画が 始まりました", "電気が 消えました"], 0,
      "Vましょう (rủ rê) cần một chủ thể CHỦ ĐỘNG hành động, nên chỉ ghép được với THA động từ (始める), không ghép được với tự động từ (始まる).",
      "Xem ghi chú về Vましょう ở slide 3."),
    q(L, 5, "止めます và やめます khác nhau ở:",
      ["止める là dừng một hành động/chuyển động cụ thể; やめる là từ bỏ hẳn thói quen/công việc",
       "Hoàn toàn giống nhau", "止める chỉ dùng cho xe cộ",
       "やめる chỉ dùng cho thuốc lá"], 0,
      "止める (đỗ xe, dừng tạm) khác hẳn phạm vi với やめる (bỏ hẳn một thói quen/nghề nghiệp lâu dài).",
      "So sánh hai ví dụ ở slide 4."),
    q(L, 6, "「仕事を やめます」 khác 「仕事を 休みます」 (N5 bài 17) ở:",
      ["やめます là nghỉ việc HẲN (từ chức); 休みます là nghỉ TẠM THỜI (nghỉ phép)",
       "Hoàn toàn giống nhau", "やめます là nghỉ một ngày",
       "休みます là nghỉ việc vĩnh viễn"], 0,
      "やめる (thường viết 辞める cho nghỉ việc) mang tính VĨNH VIỄN; 休む chỉ là tạm nghỉ, sẽ quay lại làm tiếp.",
      "Đây là cặp từ dễ nhầm đã nêu ở slide 4."),
    q(L, 7, "電気が 壊れています — 壊れる là loại động từ nào?",
      ["Tự động từ (đã gặp ở bài 26, đèn TỰ hỏng)", "Tha động từ",
       "Động từ nhóm 3", "Tính từ"], 0,
      "壊れる đã học ở bài 26 là tự động từ — vật TỰ trải qua trạng thái hỏng, không cần nói rõ ai làm hỏng.",
      "Nhớ lại kiến thức đã học ở bài 26."),
    q(L, 8, "「誰が壊しましたか」 dùng động từ nào và vì sao?",
      ["壊しました (tha động từ) vì đang hỏi AI là người gây ra hành động",
       "壊れました (tự động từ) vì không cần biết ai làm", "Cả hai đều đúng như nhau",
       "Câu này sai ngữ pháp"], 0,
      "Khi hỏi 'AI đã làm gì', phải dùng THA động từ vì câu hỏi cần một chủ thể hành động rõ ràng.",
      "So sánh với câu hỏi không cần chủ thể ở các câu khác."),
    q(L, 9, "Trong hội thoại, vì sao đèn trong phòng chiếu bị tắt?",
      ["Tự nhiên tắt, không rõ ai tắt (rồi phát hiện ra đèn bị hỏng)",
       "Sinh viên tự tắt để xem phim", "Nhân viên rạp tắt",
       "Không được nhắc tới lý do"], 0,
      "サントス nói 「急に消えました。誰も消しませんでした」, sau đó nhớ ra 「電気が壊れています」.",
      "Xem toàn bộ diễn biến hội thoại."),
    q(L, 10, "Cuối hội thoại, hai người quyết định làm gì với vấn đề đèn hỏng?",
      ["Kiểm tra sau khi phim kết thúc", "Kiểm tra ngay lập tức",
       "Bỏ qua không quan tâm", "Gọi nhân viên ngay"], 0,
      "サントス nói 「映画が始まりましたから、あとで調べましょう」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 29: Tự động từ & Tha động từ, Trạng thái (V-ています)",
    "Phân biệt cặp tự động từ (自動詞: 開く/閉まる/消える/始まる, chủ ngữ tự trải qua thay đổi, đi "
    "với が) và tha động từ (他動詞: 開ける/閉める/消す/始める, có chủ thể tác động, đi với を), "
    "mở rộng Vています sang trạng thái với tự động từ, và phân biệt 止める (dừng tạm) với やめる "
    "(từ bỏ hẳn).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
