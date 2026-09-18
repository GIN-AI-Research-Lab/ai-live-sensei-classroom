# -*- coding: utf-8 -*-
"""N5 — Bài 20: The thong thuong (Plain Form) trong giao tiep than mat.

Bai tong ket 4 dang chia (khang dinh/phu dinh x hien tai/qua khu) cho ca
dong tu, tinh tu i, tinh tu na va danh tu. Tu vung minh hoa TU CHON tu
pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md), tap trung vao tu gia dinh
de minh hoa cap khiem ton/ton kinh.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 20
pool = Pool("n5")

VOCAB = [
    v(1,  "たべる", "食べる", "たべる", "taberu", "verb", "Ăn (thể thông thường của 食べます)", "Chính là thể từ điển đã học ở bài 18.", L),
    v(2,  "たべない", "食べない", "たべない", "tabenai", "verb", "Không ăn (thể thông thường)", "Chính là thể ない đã học ở bài 17.", L),
    v(3,  "たべた", "食べた", "たべた", "tabeta", "verb", "Đã ăn (thể thông thường)", "Chính là thể た đã học ở bài 19.", L),
    v(4,  "たべなかった", "食べなかった", "たべなかった", "tabenakatta", "verb", "Đã không ăn (thể thông thường)", "Thể ない chia quá khứ: bỏ い, thêm かった — giống tính từ い.", L),
    v(5,  "かぞく", "家族", "かぞく", "kazoku", "noun", "Gia đình", "家族は 何人ですか = gia đình anh có mấy người.", L),
    v(6,  "りょうしん", "両親", "りょうしん", "ryoushin", "noun", "Cha mẹ", "Từ khiêm tốn, dùng khi nói về cha mẹ MÌNH.", L),
    v(7,  "ちち", "父", "ちち", "chichi", "noun", "Cha (khiêm tốn)", "Nói với người ngoài về cha MÌNH.", L),
    v(8,  "はは", "母", "はは", "haha", "noun", "Mẹ (khiêm tốn)", "Nói với người ngoài về mẹ MÌNH.", L),
    v(9,  "おとうさん", "お父さん", "おとうさん", "otousan", "noun", "Cha (tôn kính)", "Dùng để GỌI cha mình hoặc nói về cha NGƯỜI KHÁC.", L),
    v(10, "おかあさん", "お母さん", "おかあさん", "okaasan", "noun", "Mẹ (tôn kính)", "Dùng để GỌI mẹ mình hoặc nói về mẹ NGƯỜI KHÁC.", L),
    v(11, "きょうだい", "兄弟", "きょうだい", "kyoudai", "noun", "Anh chị em", "Từ chung, không phân biệt trai/gái, khiêm tốn.", L),
    v(12, "あに", "兄", "あに", "ani", "noun", "Anh trai (khiêm tốn)", "Nói về anh trai MÌNH.", L),
    v(13, "あね", "姉", "あね", "ane", "noun", "Chị gái (khiêm tốn)", "Nói về chị gái MÌNH.", L),
    v(14, "おとうと", "弟", "おとうと", "otouto", "noun", "Em trai", "Không có dạng khiêm tốn/tôn kính riêng biệt như anh/chị.", L),
    v(15, "いもうと", "妹", "いもうと", "imouto", "noun", "Em gái", "Không có dạng khiêm tốn/tôn kính riêng biệt.", L),
    v(16, "おにいさん", "お兄さん", "おにいさん", "oniisan", "noun", "Anh trai (tôn kính)", "Dùng để GỌI anh mình hoặc nói về anh NGƯỜI KHÁC.", L),
    v(17, "おねえさん", "お姉さん", "おねえさん", "oneesan", "noun", "Chị gái (tôn kính)", "Dùng để GỌI chị mình hoặc nói về chị NGƯỜI KHÁC.", L),
    v(18, "ともだち", "友達", "ともだち", "tomodachi", "noun", "Bạn bè", "Đã gặp bài 5 — nay dùng làm đối tượng nói chuyện thân mật.", L),
    v(19, "げんき", "元気", "げんき", "genki", "adjective", "Khỏe mạnh", "Đã gặp bài 8 — nay dùng minh họa chia thể thông thường của tính từ な.", L),
    v(20, "いそがしい", "忙しい", "いそがしい", "isogashii", "adjective", "Bận rộn", "Đã gặp bài 9 — nay minh họa chia thể thông thường của tính từ い.", L),
]

KANJI = [
    k(1, "父", "PHỤ", 4, ["フ (fu)"], ["ちち", "とう"], "Cha.",
      [("父", "ちち", "Cha (khiêm tốn)"), ("お父さん", "おとうさん", "Cha (tôn kính)"), ("父親", "ちちおや", "Người cha")], L),
    k(2, "母", "MẪU", 5, ["ボ (bo)"], ["はは", "かあ"], "Mẹ.",
      [("母", "はは", "Mẹ (khiêm tốn)"), ("お母さん", "おかあさん", "Mẹ (tôn kính)"), ("母国", "ぼこく", "Tổ quốc")], L),
    k(3, "兄", "HUYNH", 5, ["キョウ (kyou)"], ["あに", "にい"], "Anh trai.",
      [("兄", "あに", "Anh trai (khiêm tốn)"), ("お兄さん", "おにいさん", "Anh trai (tôn kính)"), ("兄弟", "きょうだい", "Anh chị em")], L),
    k(4, "姉", "TỈ", 8, ["シ (shi)"], ["あね", "ねえ"], "Chị gái.",
      [("姉", "あね", "Chị gái (khiêm tốn)"), ("お姉さん", "おねえさん", "Chị gái (tôn kính)"), ("姉妹", "しまい", "Chị em gái")], L),
    k(5, "族", "TỘC", 11, ["ゾク (zoku)"], [], "Dòng họ, gia tộc.",
      [("家族", "かぞく", "Gia đình"), ("民族", "みんぞく", "Dân tộc"), ("親族", "しんぞく", "Thân tộc")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Thể thông thường của động từ — tổng kết 4 dạng",
        "食べる(hiện tại) / 食べない(phủ định) / 食べた(quá khứ) / 食べなかった(phủ định quá khứ)",
        "Đây chính là BỐN THỂ đã học rải rác: từ điển (bài 18), ない (bài 17), た (bài 19), và ghép "
        "ない+かった (phủ định quá khứ). Gộp cả bốn lại thành 'thể thông thường' dùng với bạn bè.",
        [
            ex(L, 1, 1, [t("t-l20s1-1", "きのう", "昨日", "きのう"), t("t-l20s1-2", "、"),
                         t("t-l20s1-3", "なに", "何", "なに", key=True), t("t-l20s1-4", "たべた", "食べた", "たべた", key=True),
                         t("t-l20s1-5", "？")],
               "Hôm qua ăn gì vậy? (thân mật, không có ですか)"),
            ex(L, 1, 2, [t("t-l20s1-6", "なにも"), t("t-l20s1-7", "たべなかった", "食べなかった", "たべなかった", key=True)],
               "Không ăn gì cả."),
        ],
        tips="Thể thông thường KHÔNG PHẢI ngữ pháp mới — chỉ là gọi tên và hệ thống lại 4 dạng chia đã học từ bài 14-19.",
        culture="Bạn thân, anh chị em, người cùng tuổi nói chuyện với nhau luôn dùng thể thông thường — dùng です/ます với bạn thân nghe xa cách, kỳ lạ."),

    slide(L, 2,
        "2. Thể thông thường của tính từ い và な",
        "い-adj: 忙しい／忙しくない／忙しかった／忙しくなかった　　な-adj: 元気だ／元気じゃない／元気だった／元気じゃなかった",
        "Tính từ い giữ nguyên 4 dạng đã học. Tính từ な đổi です → だ ở thể thông thường khẳng "
        "định hiện tại — đây là điểm khác duy nhất so với thể lịch sự.",
        [
            ex(L, 2, 1, [t("t-l20s2-1", "きょう", "今日", "きょう"), t("t-l20s2-2", "は"),
                         t("t-l20s2-3", "いそがしい", "忙しい", "いそがしい", key=True)],
               "Hôm nay bận. (giữ nguyên tính từ い, bỏ です)"),
            ex(L, 2, 2, [t("t-l20s2-4", "げんき", "元気", "げんき", key=True), t("t-l20s2-5", "だ", key=True),
                         t("t-l20s2-6", "？")],
               "Khỏe không? (元気です → 元気だ, đổi です thành だ)"),
        ],
        tips="Bẫy hay gặp: tính từ い KHÔNG có だ ở cuối (không nói 忙しいだ) — chỉ tính từ な và danh từ mới dùng だ.",
        culture="だ thường bị LƯỢC BỎ hoàn toàn trong câu hỏi thân mật: 元気？ nghe tự nhiên hơn cả 元気だ？"),

    slide(L, 3,
        "3. Thể thông thường của danh từ",
        "N-だ／N-じゃない／N-だった／N-じゃなかった",
        "Danh từ chia GIỐNG HỆT tính từ な — です→だ, じゃありません→じゃない, でした→だった. "
        "Đây là lý do tính từ な còn được gọi là 'tính từ giống danh từ'.",
        [
            ex(L, 3, 1, [t("t-l20s3-1", "あした"), t("t-l20s3-2", "は"), t("t-l20s3-3", "やすみ", "休み", "やすみ"),
                         t("t-l20s3-4", "だ", key=True)],
               "Ngày mai là ngày nghỉ."),
            ex(L, 3, 2, [t("t-l20s3-5", "きのう", "昨日", "きのう"), t("t-l20s3-6", "は"), t("t-l20s3-7", "やすみ", "休み", "やすみ"),
                         t("t-l20s3-8", "じゃなかった", key=True)],
               "Hôm qua không phải ngày nghỉ."),
        ],
        tips="So sánh song song: 元気(な-adj) và 休み(danh từ) chia HỆT nhau ở thể thông thường — cùng một bảng quy tắc.",
        culture="Ghi chú, tin nhắn ngắn giữa bạn bè ở Nhật gần như luôn dùng thể thông thường, kể cả với thầy cô ngoài giờ học chính thức."),

    slide(L, 4,
        "4. Xưng hô gia đình: khiêm tốn và tôn kính",
        "父／母／兄／姉 (nói về NHÀ MÌNH)　　お父さん／お母さん／お兄さん／お姉さん (GỌI hoặc nói về NHÀ NGƯỜI KHÁC)",
        "Đây là ví dụ rõ nhất của tính khiêm nhường trong tiếng Nhật: HẠ THẤP người nhà mình khi "
        "nói với người ngoài, nhưng NÂNG CAO khi nói về/gọi người nhà của người khác.",
        [
            ex(L, 4, 1, [t("t-l20s4-1", "わたし", "私", "わたし"), t("t-l20s4-2", "の"), t("t-l20s4-3", "ちち", "父", "ちち", key=True),
                         t("t-l20s4-4", "は"), t("t-l20s4-5", "いしゃ", "医者", "いしゃ"), t("t-l20s4-6", "だ", key=True)],
               "Cha tôi là bác sĩ."),
            ex(L, 4, 2, [t("t-l20s4-7", "やまださん", "山田さん", "やまださん"), t("t-l20s4-8", "の"),
                         t("t-l20s4-9", "おとうさん", "お父さん", "おとうさん", key=True), t("t-l20s4-10", "は"),
                         t("t-l20s4-11", "せんせい", "先生", "せんせい"), t("t-l20s4-12", "です")],
               "Cha của anh Yamada là giáo viên. (nói về nhà NGƯỜI KHÁC → dùng お父さん)"),
        ],
        tips="弟/妹 (em trai/em gái) KHÔNG có cặp khiêm tốn/tôn kính riêng — dùng chung một từ cho cả hai trường hợp.",
        culture="Nhầm お父さん/父 khi nói về đúng người dễ bị coi là thiếu lễ độ — đây là một trong những quy tắc kính ngữ đầu tiên người học tiếng Nhật cần nắm."),
]

DIALOGUE = [
    line(L, 1, "山田", "Bạn thân",
         [t("d-l20-1", "ねえ"), t("d-l20-2", "、"), t("d-l20-3", "きょう", "今日", "きょう"),
          t("d-l20-4", "いそがしい", "忙しい", "いそがしい", key=True), t("d-l20-5", "？")],
         "Này, hôm nay có bận không?"),
    line(L, 2, "サントス", "Bạn thân",
         [t("d-l20-6", "ううん"), t("d-l20-7", "、"), t("d-l20-8", "いそがしくない", "忙しくない", "いそがしくない", key=True),
          t("d-l20-9", "。"), t("d-l20-10", "どうしたの")],
         "Không, không bận. Có chuyện gì vậy?"),
    line(L, 3, "山田", "Bạn thân",
         [t("d-l20-11", "かぞく", "家族", "かぞく", key=True), t("d-l20-12", "の"), t("d-l20-13", "しゃしん", "写真", "しゃしん"),
          t("d-l20-14", "、"), t("d-l20-15", "みる", "見る", "みる"), t("d-l20-16", "？")],
         "Xem ảnh gia đình tớ không?"),
    line(L, 4, "サントス", "Bạn thân",
         [t("d-l20-17", "うん"), t("d-l20-18", "、"), t("d-l20-19", "みたい", "見たい", "みたい"),
          t("d-l20-20", "！")],
         "Ừ, muốn xem!"),
    line(L, 5, "山田", "Bạn thân",
         [t("d-l20-21", "これ"), t("d-l20-22", "、"), t("d-l20-23", "わたし", "私", "わたし"),
          t("d-l20-24", "の"), t("d-l20-25", "ちち", "父", "ちち", key=True), t("d-l20-26", "。"),
          t("d-l20-27", "いしゃ", "医者", "いしゃ"), t("d-l20-28", "だ", key=True)],
         "Đây là bố tớ. Bố tớ là bác sĩ."),
    line(L, 6, "サントス", "Bạn thân",
         [t("d-l20-29", "かっこいい", "格好いい", "かっこいい"), t("d-l20-30", "！"), t("d-l20-31", "おかあさん", "お母さん", "おかあさん", key=True),
          t("d-l20-32", "は")],
         "Ngầu quá! Còn mẹ cậu thì sao?"),
    line(L, 7, "山田", "Bạn thân",
         [t("d-l20-33", "はは", "母", "はは", key=True), t("d-l20-34", "は"), t("d-l20-35", "せんせい", "先生", "せんせい"),
          t("d-l20-36", "。"), t("d-l20-37", "あに", "兄", "あに", key=True), t("d-l20-38", "も"),
          t("d-l20-39", "いる", "居る", "いる")],
         "Mẹ tớ là giáo viên. Tớ còn có cả anh trai nữa."),
    line(L, 8, "サントス", "Bạn thân",
         [t("d-l20-40", "いいな"), t("d-l20-41", "。"), t("d-l20-42", "わたし", "私", "わたし"),
          t("d-l20-43", "は"), t("d-l20-44", "きょうだい", "兄弟", "きょうだい", key=True), t("d-l20-45", "が"),
          t("d-l20-46", "いない", key=True)],
         "Hay quá vậy. Tớ thì không có anh chị em."),
    line(L, 9, "山田", "Bạn thân",
         [t("d-l20-47", "そうなんだ"), t("d-l20-48", "。"), t("d-l20-49", "でも"), t("d-l20-50", "、"),
          t("d-l20-51", "ともだち", "友達", "ともだち", key=True), t("d-l20-52", "が"), t("d-l20-53", "いっぱい"),
          t("d-l20-54", "いる", "居る", "いる")],
         "Vậy à. Nhưng cậu có nhiều bạn bè mà."),
    line(L, 10, "サントス", "Bạn thân",
         [t("d-l20-55", "うん"), t("d-l20-56", "、"), t("d-l20-57", "そうだ", key=True), t("d-l20-58", "ね"),
          t("d-l20-59", "。"), t("d-l20-60", "ありがとう")],
         "Ừ, đúng vậy nhỉ. Cảm ơn cậu."),
]

EXERCISES = [
    q(L, 1, "Thể thông thường quá khứ phủ định của 食べます là:",
      ["食べなかった", "食べませんでした", "食べたない", "食べないでした"], 0,
      "食べません(でした) là thể lịch sự; thể thông thường tương ứng là 食べなかった (ない chia như tính từ い).",
      "So sánh thể lịch sự và thể thông thường."),
    q(L, 2, "「元気？」 tương ứng thể lịch sự nào?",
      ["元気ですか", "元気でした", "元気じゃない", "元気だ"], 0,
      "元気？ là câu hỏi thân mật, だ thường bị lược bỏ — tương ứng thể lịch sự đầy đủ là 元気ですか.",
      "Xem lại ghi chú văn hóa ở slide 2."),
    q(L, 3, "Thể thông thường khẳng định của tính từ な 元気 là:",
      ["元気だ", "元気だ です", "元気な", "元気い"], 0,
      "Tính từ な đổi です thành だ ở thể thông thường: 元気です → 元気だ.",
      "Đây là điểm khác duy nhất so với thể lịch sự cho tính từ な."),
    q(L, 4, "Danh từ chia thể thông thường GIỐNG loại tính từ nào?",
      ["Tính từ な", "Tính từ い", "Không giống loại nào", "Động từ"], 0,
      "Danh từ và tính từ な dùng chung một bảng chia: だ/じゃない/だった/じゃなかった.",
      "Xem lại slide 3."),
    q(L, 5, "Nói với người ngoài về CHA CỦA MÌNH, dùng từ nào?",
      ["父", "お父さん", "パパ", "おやじさん"], 0,
      "父 là từ KHIÊM TỐN dùng khi nói về cha mình với người ngoài. お父さん dùng để GỌI cha mình hoặc nói về cha người khác.",
      "Đây là quy tắc khiêm tốn/tôn kính."),
    q(L, 6, "Nói về CHA CỦA NGƯỜI KHÁC, dùng từ nào?",
      ["お父さん", "父", "ちちうえ", "おやじ"], 0,
      "お父さん (tôn kính) dùng khi nói về cha của người khác, thể hiện sự tôn trọng với gia đình họ.",
      "Ngược lại hoàn toàn với câu 5."),
    q(L, 7, "弟 và 妹 khác 兄/姉 ở điểm nào về xưng hô?",
      ["Không có cặp khiêm tốn/tôn kính riêng — dùng chung một từ",
       "Có tới ba cách gọi khác nhau", "Chỉ dùng cho con trai",
       "Luôn phải thêm さん phía sau"], 0,
      "兄/姉 có cặp khiêm tốn (兄/姉) và tôn kính (お兄さん/お姉さん) riêng biệt; 弟/妹 dùng chung không phân biệt.",
      "Đây là điểm bất đối xứng thú vị trong hệ thống xưng hô gia đình."),
    q(L, 8, "「今日は 休みだ」 và 「今日は 休みです」 khác nhau ở:",
      ["Mức độ trang trọng: だ thân mật, です lịch sự — nghĩa giống nhau",
       "Nghĩa hoàn toàn khác nhau", "だ là thì quá khứ", "です là câu hỏi"], 0,
      "Cùng một nghĩa (hôm nay là ngày nghỉ), chỉ khác mức độ trang trọng — だ dùng với bạn bè, です dùng lịch sự.",
      "Đây là điểm cốt lõi của bài học: chuyển đổi giữa hai mức trang trọng."),
    q(L, 9, "Trong hội thoại, cha của Yamada làm nghề gì?",
      ["Bác sĩ", "Giáo viên", "Kỹ sư", "Nhân viên ngân hàng"], 0,
      "Yamada nói 「これ、私の父。医者だ」.",
      "Xem câu thoại thứ 5."),
    q(L, 10, "Santos có anh chị em không?",
      ["Không có", "Có một anh trai", "Có một chị gái", "Có hai em"], 0,
      "Santos nói 「私は 兄弟が いない」.",
      "Xem câu thoại thứ 8."),
]

LESSON = lesson(
    L,
    "Bài 20: Thể thông thường / Thể ngắn (Plain Form)",
    "Tổng kết thể thông thường (普通形) dùng trong giao tiếp thân mật: bốn dạng chia của động từ "
    "(đã học ở bài 17-19), tính từ い giữ nguyên còn tính từ な/danh từ đổi です thành だ, và cặp "
    "từ xưng hô gia đình khiêm tốn (父/母/兄/姉, nói về nhà mình) đối lập tôn kính (お父さん/お母さ"
    "ん/お兄さん/お姉さん, nói về nhà người khác).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
