# -*- coding: utf-8 -*-
"""N4 — Bai 33: The menh lenh (命令形) va cam chi (禁止形).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 33
pool = Pool("n4")

VOCAB = [
    v(1,  "はしれ", "走れ", "はしれ", "hashire", "verb", "Chạy đi! (thể mệnh lệnh của 走る)", "Nhóm I: đổi đuôi う→え. 走る → 走れ.", L),
    v(2,  "まて", "待て", "まて", "mate", "verb", "Đợi đã! (thể mệnh lệnh của 待つ)", "待つ → 待て.", L),
    v(3,  "いそげ", "急げ", "いそげ", "isoge", "verb", "Nhanh lên! (thể mệnh lệnh của 急ぐ)", "急ぐ → 急げ.", L),
    v(4,  "たべろ", "食べろ", "たべろ", "tabero", "verb", "Ăn đi! (thể mệnh lệnh của 食べる)", "Nhóm II: bỏ る, thêm ろ. 食べる → 食べろ.", L),
    v(5,  "こい", "来い", "こい", "koi", "verb", "Đến đây! (thể mệnh lệnh của 来る)", "来る → 来い (bất quy tắc hoàn toàn).", L),
    v(6,  "しろ", "", "", "shiro", "verb", "Làm đi! (thể mệnh lệnh của する)", "する → しろ (bất quy tắc).", L),
    v(7,  "はいるな", "入るな", "はいるな", "hairu na", "verb", "Cấm vào! (thể cấm chỉ của 入る)", "Thể từ điển + な = cấm chỉ, giọng mạnh, ra lệnh.", L),
    v(8,  "とまるな", "止まるな", "とまるな", "tomaru na", "verb", "Cấm dừng lại! (thể cấm chỉ)", "止まる + な.", L),
    v(9,  "きけん", "危険", "きけん", "kiken", "adjective", "Nguy hiểm", "危険！入るな！ = Nguy hiểm! Cấm vào!", L),
    v(10, "ちゅうい", "注意", "ちゅうい", "chuui", "noun", "Sự chú ý, cảnh báo", "注意して ください = xin hãy cẩn thận.", L),
    v(11, "しあい", "試合", "しあい", "shiai", "noun", "Trận đấu, cuộc thi đấu", "試合に 勝て！ = thắng trận đi!", L),
    v(12, "いそぎます", "急ぎます", "いそぎます", "isogimasu", "verb", "Vội, gấp", "Đã có ở thể mệnh lệnh 急げ phía trên.", L),
    v(13, "はしります", "走ります", "はしります", "hashirimasu", "verb", "Chạy", "Đã có ở thể mệnh lệnh 走れ phía trên.", L),
    v(14, "まんが", "漫画", "まんが", "manga", "noun", "Truyện tranh", "漫画を 読むな = cấm đọc truyện tranh (trong giờ học).", L),
    v(15, "べんきょう", "勉強", "べんきょう", "benkyou", "noun", "Việc học", "Đã gặp N5 bài 4.", L),
    v(16, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "Đã gặp N5 bài 1.", L),
    v(17, "こども", "子供", "こども", "kodomo", "noun", "Trẻ con", "Đã gặp N5 bài 23.", L),
    v(18, "しんぱいします", "心配します", "しんぱいします", "shinpai shimasu", "verb", "Lo lắng", "Đã gặp N5 bài 15 (dạng tính từ).", L),
    v(19, "がんばれ", "頑張れ", "がんばれ", "ganbare", "phrase", "Cố lên! (thể mệnh lệnh của 頑張る, dùng riêng làm câu cổ vũ)", "Câu hô cổ vũ phổ biến nhất tiếng Nhật.", L),
    v(20, "あぶない", "危ない", "あぶない", "abunai", "adjective", "Nguy hiểm, coi chừng!", "Tính từ い, cũng dùng độc lập như câu cảm thán 'Coi chừng!'.", L),
]

KANJI = [
    k(1, "命", "MỆNH", 8, ["メイ (mei)"], ["いのち"], "Mệnh lệnh, sinh mệnh.",
      [("命令", "めいれい", "Mệnh lệnh"), ("命", "いのち", "Sinh mạng"), ("運命", "うんめい", "Vận mệnh")], L),
    k(2, "禁", "CẤM", 13, ["キン (kin)"], [], "Cấm đoán.",
      [("禁止", "きんし", "Cấm chỉ"), ("禁煙", "きんえん", "Cấm hút thuốc")], L),
    k(3, "危", "NGUY", 6, ["キ (ki)"], ["あぶ(ない)", "あや(うい)"], "Nguy hiểm.",
      [("危険", "きけん", "Nguy hiểm"), ("危ない", "あぶない", "Nguy hiểm, coi chừng")], L),
    k(4, "険", "HIỂM", 11, ["ケン (ken)"], ["けわ(しい)"], "Hiểm trở, hiểm nguy.",
      [("危険", "きけん", "Nguy hiểm"), ("保険", "ほけん", "Bảo hiểm")], L),
    k(5, "注", "CHÚ", 8, ["チュウ (chuu)"], ["そそ(ぐ)"], "Chú ý, rót vào.",
      [("注意", "ちゅうい", "Chú ý"), ("注文", "ちゅうもん", "Đặt hàng"), ("注射", "ちゅうしゃ", "Tiêm")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chia thể mệnh lệnh (命令形)",
        "Nhóm I: đuôi う→え (走る→走れ)　Nhóm II: bỏ る+ろ (食べる→食べろ)　する→しろ 　来る→来い",
        "Thể mệnh lệnh là dạng RA LỆNH TRỰC TIẾP, RẤT MẠNH và CỘC — chỉ dùng trong tình huống khẩn "
        "cấp, giữa nam giới thân thiết, huấn luyện viên với vận động viên, hoặc trích trong biển báo/truyện.",
        [
            ex(L, 1, 1, [t("t-l33s1-1", "はしれ", "走れ", "はしれ", key=True), t("t-l33s1-2", "！")],
               "Chạy đi! (mệnh lệnh trực tiếp, rất mạnh)"),
            ex(L, 1, 2, [t("t-l33s1-3", "がんばれ", "頑張れ", "がんばれ", key=True), t("t-l33s1-4", "！")],
               "Cố lên! (câu cổ vũ dùng thể mệnh lệnh, KHÔNG mang nghĩa ra lệnh gay gắt)"),
        ],
        tips="頑張れ là ngoại lệ về SẮC THÁI: tuy là thể mệnh lệnh nhưng dùng làm câu CỔ VŨ thân thiện, không hề gay gắt.",
        culture="Thể mệnh lệnh KHÔNG dùng trực tiếp với người lạ/người trên trong giao tiếp thường ngày — sẽ bị coi là rất thô lỗ, mất lịch sự."),

    slide(L, 2,
        "2. Cấm chỉ (禁止形): [Thể từ điển] + な",
        "V(từ điển) + な   (đơn giản hơn menh lệnh — chỉ cần thêm な vào cuối)",
        "Thể cấm chỉ dùng THỂ TỪ ĐIỂN (không biến âm phức tạp như mệnh lệnh), chỉ cần thêm な — "
        "cũng mạnh và cộc tương đương thể mệnh lệnh, thường thấy trên biển cấm.",
        [
            ex(L, 2, 1, [t("t-l33s2-1", "はいるな", "入るな", "はいるな", key=True), t("t-l33s2-2", "！")],
               "Cấm vào!"),
            ex(L, 2, 2, [t("t-l33s2-3", "しんぱいするな", "心配するな", "しんぱいするな", key=True), t("t-l33s2-4", "！")],
               "Đừng lo lắng! (するな, ngay cả する cũng chỉ cần thêm な)"),
        ],
        tips="Cấm chỉ luôn dùng thể từ điển + な — ĐƠN GIẢN hơn nhiều so với năm kiểu biến âm của thể mệnh lệnh.",
        culture="危険！入るな！ là mẫu biển báo phổ biến ở công trường, khu vực nguy hiểm tại Nhật — ngắn gọn, dứt khoát, dễ đọc từ xa."),

    slide(L, 3,
        "3. Ngữ cảnh sử dụng: khi nào dùng mệnh lệnh/cấm chỉ",
        "Biển báo / Trích lời trong truyện, phim / HLV thể thao / Tình huống khẩn cấp",
        "Trong giao tiếp ĐỜI THƯỜNG, người Nhật hầu như không dùng trực tiếp hai thể này với nhau — "
        "thay vào đó dùng てください (yêu cầu) hoặc ないでください (N5 bài 17).",
        [
            ex(L, 3, 1, [t("t-l33s3-1", "きけん", "危険", "きけん", key=True), t("t-l33s3-2", "！"),
                         t("t-l33s3-3", "はいるな", "入るな", "はいるな", key=True), t("t-l33s3-4", "！")],
               "Nguy hiểm! Cấm vào! (biển báo)"),
            ex(L, 3, 2, [t("t-l33s3-5", "しあい", "試合", "しあい", key=True), t("t-l33s3-6", "、"),
                         t("t-l33s3-7", "がんばれ", "頑張れ", "がんばれ", key=True), t("t-l33s3-8", "！")],
               "Trận đấu, cố lên! (cổ vũ thể thao)"),
        ],
        tips="Nếu muốn cấm ai đó làm gì một cách LỊCH SỰ trong đời thường, dùng Vないでください (N5 bài 17) chứ không dùng thể cấm chỉ な.",
        culture="Truyện tranh (漫画) và phim hành động Nhật dùng thể mệnh lệnh/cấm chỉ RẤT NHIỀU trong lời thoại nhân vật để tạo kịch tính, khẩn cấp."),

    slide(L, 4,
        "4. So sánh mức độ mạnh: な (cấm chỉ) > ないでください (N5 b17) > ないほうがいい (N4 b32)",
        "Từ MẠNH NHẤT (ra lệnh) đến NHẸ NHẤT (gợi ý)",
        "Ba cách nói 'đừng làm gì' theo thang độ MẠNH-NHẸ giảm dần: な (cấm chỉ, ra lệnh) → "
        "ないでください (yêu cầu lịch sự) → ないほうがいい (chỉ là lời khuyên, gợi ý).",
        [
            ex(L, 4, 1, [t("t-l33s4-1", "まんが", "漫画", "まんが", key=True), t("t-l33s4-2", "を"),
                         t("t-l33s4-3", "よむな", "読むな", "よむな", key=True), t("t-l33s4-4", "！")],
               "Cấm đọc truyện tranh! (rất mạnh, như quát mắng)"),
            ex(L, 4, 2, [t("t-l33s4-5", "べんきょう", "勉強", "べんきょう"), t("t-l33s4-6", "の"),
                         t("t-l33s4-7", "とき"), t("t-l33s4-8", "、"), t("t-l33s4-9", "まんが", "漫画", "まんが"),
                         t("t-l33s4-10", "を"), t("t-l33s4-11", "よまない", "読まない", "よまない"),
                         t("t-l33s4-12", "ほうが", key=True), t("t-l33s4-13", "いいです", key=True)],
               "Lúc học bài thì không nên đọc truyện tranh. (nhẹ nhàng hơn nhiều)"),
        ],
        tips="Cha mẹ Nhật quát con thường dùng な (漫画を読むな！); nhưng khi khuyên nhẹ nhàng lại chuyển sang ほうがいい — cùng nội dung, khác sắc thái hoàn toàn.",
        culture="Ba mức độ này phản ánh rõ văn hóa phân tầng lịch sự trong tiếng Nhật — chọn sai mức có thể gây hiểu lầm nghiêm trọng về thái độ."),
]

DIALOGUE = [
    line(L, 1, "コーチ", "Huấn luyện viên",
         [t("d-l33-1", "みんな"), t("d-l33-2", "、"), t("d-l33-3", "はしれ", "走れ", "はしれ", key=True),
          t("d-l33-4", "！"), t("d-l33-5", "はしれ", "走れ", "はしれ", key=True), t("d-l33-6", "！")],
         "Mọi người, chạy đi! Chạy đi!"),
    line(L, 2, "選手", "Vận động viên",
         [t("d-l33-7", "はい", key=True), t("d-l33-8", "！")],
         "Vâng!"),
    line(L, 3, "コーチ", "Huấn luyện viên",
         [t("d-l33-9", "いそげ", "急げ", "いそげ", key=True), t("d-l33-10", "！"), t("d-l33-11", "しあい", "試合", "しあい", key=True),
          t("d-l33-12", "が"), t("d-l33-13", "はじまる", "始まる", "はじまる"), t("d-l33-14", "ぞ")],
         "Nhanh lên! Trận đấu sắp bắt đầu rồi đấy!"),
    line(L, 4, "選手", "Vận động viên",
         [t("d-l33-15", "わかりました", "分かりました", "わかりました"), t("d-l33-16", "！")],
         "Rõ ạ!"),
    line(L, 5, "コーチ", "Huấn luyện viên",
         [t("d-l33-17", "しあい", "試合", "しあい", key=True), t("d-l33-18", "の"), t("d-l33-19", "まえ", "前", "まえ"),
          t("d-l33-20", "は"), t("d-l33-21", "しんぱいするな", "心配するな", "しんぱいするな", key=True), t("d-l33-22", "！"),
          t("d-l33-23", "がんばれ", "頑張れ", "がんばれ", key=True), t("d-l33-24", "！")],
         "Trước trận đấu thì đừng lo lắng! Cố lên!"),
    line(L, 6, "選手", "Vận động viên",
         [t("d-l33-25", "はい"), t("d-l33-26", "！"), t("d-l33-27", "がんばります", "頑張ります", "がんばります")],
         "Vâng! Em sẽ cố gắng."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d-l33-28", "あ"), t("d-l33-29", "、"), t("d-l33-30", "あぶない", "危ない", "あぶない", key=True),
          t("d-l33-31", "！"), t("d-l33-32", "きをつけて", "気を付けて", "きをつけて"), t("d-l33-33", "ください")],
         "Ơ, nguy hiểm! Cẩn thận nhé!"),
    line(L, 8, "山田", "Đồng nghiệp",
         [t("d-l33-34", "すみません"), t("d-l33-35", "。"), t("d-l33-36", "あそこ"), t("d-l33-37", "に"),
          t("d-l33-38", "きけん", "危険", "きけん", key=True), t("d-l33-39", "！"), t("d-l33-40", "はいるな", "入るな", "はいるな", key=True),
          t("d-l33-41", "の"), t("d-l33-42", "かんばん", "看板", "かんばん"), t("d-l33-43", "が"), t("d-l33-44", "あります", "有ります", "あります")],
         "Xin lỗi. Ở kia có biển 'Nguy hiểm! Cấm vào!' kìa."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d-l33-45", "そうですね"), t("d-l33-46", "。"), t("d-l33-47", "ちゅうい", "注意", "ちゅうい", key=True),
          t("d-l33-48", "して", key=True), t("d-l33-49", "、"), t("d-l33-50", "こちら"), t("d-l33-51", "から"),
          t("d-l33-52", "いきましょう", "行きましょう", "いきましょう")],
         "Đúng vậy nhỉ. Chúng ta cẩn thận, đi lối này thôi."),
    line(L, 10, "山田", "Đồng nghiệp",
         [t("d-l33-53", "はい"), t("d-l33-54", "、"), t("d-l33-55", "そう"), t("d-l33-56", "しましょう")],
         "Vâng, làm vậy đi."),
]

EXERCISES = [
    q(L, 1, "Thể mệnh lệnh của 走る (nhóm I) là:",
      ["走れ", "走ろ", "走いれ", "走るえ"], 0,
      "Nhóm I đổi âm cuối gốc từ điển từ hàng う sang hàng え: 走る → 走れ.",
      "Áp dụng quy tắc chia thể mệnh lệnh nhóm I."),
    q(L, 2, "Thể mệnh lệnh của 食べる (nhóm II) là:",
      ["食べろ", "食べれ", "食べいろ", "食べるろ"], 0,
      "Nhóm II bỏ る, thêm ろ: 食べる → 食べろ.",
      "Áp dụng quy tắc chia thể mệnh lệnh nhóm II."),
    q(L, 3, "Thể cấm chỉ của 入る là:",
      ["入るな", "入らな", "入りな", "入れな"], 0,
      "Cấm chỉ chỉ cần dùng THỂ TỪ ĐIỂN + な, không biến âm phức tạp như mệnh lệnh: 入る → 入るな.",
      "Cấm chỉ đơn giản hơn mệnh lệnh nhiều."),
    q(L, 4, "頑張れ tuy là thể mệnh lệnh nhưng thường dùng với sắc thái nào?",
      ["Cổ vũ thân thiện, không hề gay gắt", "Ra lệnh nghiêm khắc",
       "Đe dọa", "Chỉ dùng trong quân đội"], 0,
      "頑張れ là ngoại lệ về sắc thái — dù là thể mệnh lệnh nhưng được dùng phổ biến như câu cổ vũ tích cực.",
      "Xem ghi chú văn hóa ở slide 1."),
    q(L, 5, "Trong giao tiếp đời thường, muốn yêu cầu ai đó ĐỪNG làm gì một cách LỊCH SỰ, nên dùng:",
      ["Vないでください (N5 bài 17)", "Thể cấm chỉ V+な",
       "Thể mệnh lệnh", "Cả ba cách đều lịch sự như nhau"], 0,
      "Thể cấm chỉ な quá mạnh/cộc cho giao tiếp lịch sự — Vないでください phù hợp hơn nhiều trong đời thường.",
      "Xem thang mức độ mạnh-nhẹ ở slide 4."),
    q(L, 6, "Xếp theo thứ tự MẠNH đến NHẸ: な / ないでください / ないほうがいい",
      ["な (mạnh nhất) → ないでください → ないほうがいい (nhẹ nhất)",
       "ないほうがいい → ないでください → な", "Cả ba đều mạnh như nhau",
       "な là nhẹ nhất"], 0,
      "な là ra lệnh cấm đoán trực tiếp (mạnh nhất); ないでください là yêu cầu lịch sự; ないほうがいい chỉ là lời khuyên nhẹ nhàng.",
      "Xem tổng kết thang độ mạnh ở slide 4."),
    q(L, 7, "Ai thường dùng thể mệnh lệnh/cấm chỉ trong giao tiếp thực tế?",
      ["Huấn luyện viên với vận động viên, biển báo, truyện/phim, tình huống khẩn cấp",
       "Nhân viên với khách hàng", "Học sinh với giáo viên",
       "Người quen mới gặp lần đầu"], 0,
      "Đây là những ngữ cảnh ĐẶC BIỆT cho phép dùng — ngoài các trường hợp này, dùng thể mệnh lệnh/cấm chỉ bị coi là bất lịch sự.",
      "Xem danh sách ngữ cảnh ở slide 3."),
    q(L, 8, "する chia thể mệnh lệnh là:",
      ["しろ", "すろ", "しれ", "すれ"], 0,
      "する là động từ bất quy tắc, chia thể mệnh lệnh thành しろ, không theo âm gốc.",
      "Đây là trường hợp bất quy tắc cần học thuộc."),
    q(L, 9, "Trong hội thoại, huấn luyện viên dặn vận động viên điều gì trước trận đấu?",
      ["Đừng lo lắng, cố lên", "Phải thắng bằng mọi giá", "Nghỉ ngơi thật nhiều", "Không dặn gì cả"], 0,
      "HLV nói 「試合の前は心配するな！頑張れ！」.",
      "Xem câu thoại thứ 5."),
    q(L, 10, "Trong hội thoại thứ hai, Yamada và Tanaka gặp biển báo gì?",
      ["Biển 'Nguy hiểm! Cấm vào!'", "Biển 'Cấm hút thuốc'",
       "Biển chỉ đường", "Không có biển báo nào"], 0,
      "Yamada nói 「あそこに危険！入るな！の看板があります」.",
      "Xem câu thoại thứ 8."),
]

LESSON = lesson(
    L,
    "Bài 33: Thể mệnh lệnh (命令形) & Cấm chỉ (禁止形)",
    "Chia thể mệnh lệnh (nhóm I: う→え, nhóm II: bỏ る+ろ, bất quy tắc する→しろ/来る→来い) và cấm "
    "chỉ (thể từ điển+な, đơn giản hơn), giới hạn ngữ cảnh sử dụng (biển báo, huấn luyện viên, "
    "truyện/phim, khẩn cấp — KHÔNG dùng trong giao tiếp lịch sự thường ngày), và thang mức độ "
    "mạnh-nhẹ khi nói 'đừng làm': な > ないでください (N5 b17) > ないほうがいい (N4 b32).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
