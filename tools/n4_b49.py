# -*- coding: utf-8 -*-
"""N4 — Bai 49: Kinh ngu ton kinh (尊敬語 - Sonkeigo).

Dung cho HANH DONG cua NGUOI TREN/NGUOI NGHE (khac han khiem nhuong ngu
ha thap HANH DONG CUA MINH se hoc o bai 50). Cac dong tu ton kinh dac
biet la tu chuc nang ngu phap loi, khong nam trong pool JLPT, dua vao
thu cong (giong cach da lam voi kudasaru o bai 41).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 49
pool = Pool("n4")

VOCAB = [
    v(1,  "いらっしゃいます", "", "", "irasshaimasu", "verb", "Là/có/đến/đi (tôn kính của です/います/来ます/行きます)", "Một từ DUY NHẤT thay cho BỐN động từ khác nhau khi nói về người trên.", L),
    v(2,  "おっしゃいます", "", "", "osshaimasu", "verb", "Nói (tôn kính của 言います)", "先生が おっしゃいました = thầy giáo đã nói.", L),
    v(3,  "なさいます", "", "", "nasaimasu", "verb", "Làm (tôn kính của します)", "社長は 何を なさいますか = giám đốc định làm gì ạ?", L),
    v(4,  "めしあがります", "召し上がります", "めしあがります", "meshiagarimasu", "verb", "Ăn/uống (tôn kính của 食べます/飲みます)", "どうぞ 召し上がって ください = xin mời quý vị dùng.", L),
    v(5,  "ごらんになります", "ご覧になります", "ごらんになります", "goran ni narimasu", "verb", "Xem (tôn kính của 見ます)", "この 写真を ご覧に なりましたか = ngài đã xem bức ảnh này chưa ạ?", L),
    v(6,  "くださいます", "下さいます", "くださいます", "kudasaimasu", "verb", "Ban cho (tôn kính của くれます)", "Đã gặp bài 41.", L),
    v(7,  "およみになります", "お読みになります", "およみになります", "oyomi ni narimasu", "verb", "Đọc (tôn kính, mẫu お+gốc+になります)", "お+gốc ます+になります: mẫu tôn kính TỔNG QUÁT cho mọi động từ.", L),
    v(8,  "おかきになります", "お書きになります", "おかきになります", "okaki ni narimasu", "verb", "Viết (tôn kính, mẫu お+gốc+になります)", "お書きに なりました = ngài đã viết.", L),
    v(9,  "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc công ty", "Đã gặp bài 41.", L),
    v(10, "ぶちょう", "部長", "ぶちょう", "buchou", "noun", "Trưởng phòng", "部長は もう いらっしゃいました = trưởng phòng đã đến rồi ạ.", L),
    v(11, "かちょう", "課長", "かちょう", "kachou", "noun", "Trưởng ban, tổ trưởng", "課長が おっしゃいました = tổ trưởng đã nói.", L),
    v(12, "こうちょう", "校長", "こうちょう", "kouchou", "noun", "Hiệu trưởng", "校長先生は お元気です = thầy hiệu trưởng khỏe mạnh.", L),
    v(13, "おきゃくさん", "お客さん", "おきゃくさん", "okyakusan", "noun", "Vị khách", "Đã gặp bài 41.", L),
    v(14, "おたく", "お宅", "おたく", "otaku", "noun", "Nhà (của người khác, tôn kính)", "お宅は どちらですか = nhà ngài ở đâu ạ?", L),
    v(15, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "Đã gặp N5 bài 1.", L),
    v(16, "しんぶん", "新聞", "しんぶん", "shinbun", "noun", "Báo, tờ báo", "新聞を お読みに なりますか = ngài có đọc báo không ạ?", L),
    v(17, "しゃしん", "写真", "しゃしん", "shashin", "noun", "Bức ảnh", "Đã gặp N5 bài 6.", L),
    v(18, "こうえん", "講演", "こうえん", "kouen", "noun", "Bài diễn thuyết", "校長先生が 講演を なさいます = thầy hiệu trưởng sẽ diễn thuyết.", L),
    v(19, "しょくじ", "食事", "しょくじ", "shokuji", "noun", "Bữa ăn", "Đã gặp bài 39.", L),
    v(20, "おちゃ", "お茶", "おちゃ", "ocha", "noun", "Trà (xanh)", "お茶を 召し上がって ください = xin mời quý vị dùng trà.", L),
]

KANJI = [
    k(1, "尊", "TÔN", 12, ["ソン (son)"], ["とうと(い)"], "Tôn kính, cao quý.",
      [("尊敬語", "そんけいご", "Kính ngữ tôn kính"), ("尊敬します", "そんけいします", "Tôn kính, ngưỡng mộ")], L),
    k(2, "敬", "KÍNH", 12, ["ケイ (kei)"], ["うやま(う)"], "Kính trọng.",
      [("尊敬", "そんけい", "Tôn kính"), ("敬語", "けいご", "Kính ngữ")], L),
    k(3, "部", "BỘ", 11, ["ブ (bu)"], [], "Bộ phận, phòng ban.",
      [("部長", "ぶちょう", "Trưởng phòng"), ("部屋", "へや", "Căn phòng"), ("全部", "ぜんぶ", "Tất cả")], L),
    k(4, "課", "KHÓA", 15, ["カ (ka)"], [], "Ban, tổ, bài học.",
      [("課長", "かちょう", "Trưởng ban"), ("課題", "かだい", "Bài tập, đề tài")], L),
    k(5, "校", "HIỆU", 10, ["コウ (kou)"], [], "Trường học.",
      [("校長", "こうちょう", "Hiệu trưởng"), ("学校", "がっこう", "Trường học")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Vì sao cần Sonkeigo (尊敬語)?",
        "Dùng cho HÀNH ĐỘNG của NGƯỜI TRÊN/NGƯỜI NGHE — KHÔNG BAO GIỜ dùng cho hành động của CHÍNH MÌNH",
        "尊敬語 (kính ngữ tôn kính) NÂNG CAO hành động của người khác (khách hàng, cấp trên, thầy "
        "cô) để thể hiện sự tôn trọng — khác hẳn 謙譲語 (khiêm nhường ngữ, bài 50) HẠ THẤP hành "
        "động của CHÍNH MÌNH.",
        [
            ex(L, 1, 1, [t("t-l49s1-1", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l49s1-2", "は"),
                         t("t-l49s1-3", "もう"), t("t-l49s1-4", "いらっしゃいました", key=True)],
               "Giám đốc đã đến rồi ạ."),
            ex(L, 1, 2, [t("t-l49s1-5", "せんせい", "先生", "せんせい", key=True), t("t-l49s1-6", "は"),
                         t("t-l49s1-7", "なにか", "何か", "なにか"), t("t-l49s1-8", "おっしゃいました", key=True), t("t-l49s1-9", "か")],
               "Thầy giáo đã nói gì đó ạ?"),
        ],
        tips="Quy tắc SỐNG CÒN: 尊敬語 chỉ dùng để nói về HÀNH ĐỘNG CỦA NGƯỜI KHÁC — dùng nhầm cho hành động của mình là lỗi kính ngữ nghiêm trọng.",
        culture="Nhân viên lễ tân, bán hàng Nhật bắt buộc phải thành thạo 尊敬語 để nói về khách hàng — đây là kỹ năng giao tiếp công sở cơ bản."),

    slide(L, 2,
        "2. Năm động từ tôn kính ĐẶC BIỆT (bất quy tắc hoàn toàn)",
        "いらっしゃいます (です/います/来ます/行きます) 　おっしゃいます (言います) 　なさいます (します) 　召し上がります (食べます/飲みます) 　ご覧になります (見ます)",
        "Đây là các động từ được THAY THẾ HOÀN TOÀN bằng một từ khác (không phải chia đuôi) — phải "
        "học thuộc riêng như từ vựng mới, không suy luận được từ quy tắc chung.",
        [
            ex(L, 2, 1, [t("t-l49s2-1", "おきゃくさん", "お客さん", "おきゃくさん", key=True), t("t-l49s2-2", "は"),
                         t("t-l49s2-3", "なに", "何", "なに"), t("t-l49s2-4", "を"),
                         t("t-l49s2-5", "めしあがります", "召し上がります", "めしあがります", key=True), t("t-l49s2-6", "か")],
               "Quý khách sẽ dùng gì ạ?"),
            ex(L, 2, 2, [t("t-l49s2-7", "こうちょう", "校長", "こうちょう", key=True), t("t-l49s2-8", "せんせい", "先生", "せんせい"),
                         t("t-l49s2-9", "が"), t("t-l49s2-10", "こうえん", "講演", "こうえん", key=True), t("t-l49s2-11", "を"),
                         t("t-l49s2-12", "なさいます", key=True)],
               "Thầy hiệu trưởng sẽ diễn thuyết."),
        ],
        tips="いらっしゃいます đặc biệt vì thay được TỚI BỐN động từ khác nhau (です/います/来ます/行きます) — phải xem ngữ cảnh để biết đang thay từ nào.",
        culture="どうぞ召し上がってください là câu mời ăn/uống trang trọng nhất, thường dùng khi tiếp đãi khách quý tại nhà hoặc dịp lễ."),

    slide(L, 3,
        "3. Mẫu tôn kính TỔNG QUÁT: お + [gốc ます] + になります",
        "お + V(gốc ます) + になります   (áp dụng được cho HẦU HẾT động từ không có dạng đặc biệt)",
        "Với động từ KHÔNG nằm trong 5 từ đặc biệt (slide 2), dùng công thức chung này để tạo "
        "kính ngữ — an toàn, áp dụng được rộng rãi hơn học thuộc từng từ riêng lẻ.",
        [
            ex(L, 3, 1, [t("t-l49s3-1", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l49s3-2", "は"),
                         t("t-l49s3-3", "しんぶん", "新聞", "しんぶん"), t("t-l49s3-4", "を"),
                         t("t-l49s3-5", "およみに", "お読みに", "およみに", key=True), t("t-l49s3-6", "なりました", key=True)],
               "Giám đốc đã đọc báo."),
            ex(L, 3, 2, [t("t-l49s3-7", "せんせい", "先生", "せんせい", key=True), t("t-l49s3-8", "は"),
                         t("t-l49s3-9", "もう"), t("t-l49s3-10", "おかきに", "お書きに", "おかきに", key=True), t("t-l49s3-11", "なりました", key=True),
                         t("t-l49s3-12", "か")],
               "Thầy giáo đã viết xong chưa ạ?"),
        ],
        tips="Công thức お〜になります KHÔNG áp dụng cho động từ đã có dạng đặc biệt (không nói お食べになります — phải dùng 召し上がります).",
        culture="お読みになりますか／お使いになりますか là mẫu câu hỏi lịch sự chuẩn mực của nhân viên phục vụ khi hỏi khách hàng."),

    slide(L, 4,
        "4. Ôn lại kudasaru (bài 41) trong hệ thống Sonkeigo",
        "くださいます (tôn kính của くれます, đã học bài 41) CŨNG LÀ một phần của 尊敬語",
        "Bài 41 đã học くださいます như một trường hợp riêng — giờ đặt nó vào ĐÚNG HỆ THỐNG: đây "
        "chính là MỘT trong các động từ 尊敬語 đặc biệt, cùng nhóm với いらっしゃる/おっしゃる.",
        [
            ex(L, 4, 1, [t("t-l49s4-1", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l49s4-2", "が"),
                         t("t-l49s4-3", "ほん", "本", "ほん"), t("t-l49s4-4", "を"),
                         t("t-l49s4-5", "くださいました", "下さいました", "くださいました", key=True)],
               "Giám đốc đã ban tặng cho tôi quyển sách. (ôn lại bài 41, cùng hệ thống 尊敬語)"),
        ],
        tips="Tổng cộng có 6 động từ tôn kính đặc biệt cần nhớ: いらっしゃる、おっしゃる、なさる、召し上がる、ご覧になる、くださる — còn lại dùng công thức お〜になる.",
        culture="Thư trang trọng, email công việc Nhật thường kết hợp cả 尊敬語 (nói về đối phương) và 謙譲語 (nói về mình, bài 50) trong cùng một đoạn văn."),
]

DIALOGUE = [
    line(L, 1, "受付", "Lễ tân",
         [t("d-l49-1", "しゃちょう", "社長", "しゃちょう", key=True), t("d-l49-2", "は"), t("d-l49-3", "もう"),
          t("d-l49-4", "いらっしゃいました", key=True), t("d-l49-5", "か")],
         "Giám đốc đã đến chưa ạ?"),
    line(L, 2, "秘書", "Thư ký",
         [t("d-l49-6", "はい"), t("d-l49-7", "、"), t("d-l49-8", "もう"), t("d-l49-9", "いらっしゃいます", key=True)],
         "Vâng, ngài đã đến rồi ạ."),
    line(L, 3, "受付", "Lễ tân",
         [t("d-l49-10", "こうちょう", "校長", "こうちょう", key=True), t("d-l49-11", "せんせい", "先生", "せんせい"),
          t("d-l49-12", "も"), t("d-l49-13", "いらっしゃいます", key=True), t("d-l49-14", "か")],
         "Thầy hiệu trưởng cũng đến ạ?"),
    line(L, 4, "秘書", "Thư ký",
         [t("d-l49-15", "はい"), t("d-l49-16", "、"), t("d-l49-17", "こうえん", "講演", "こうえん", key=True),
          t("d-l49-18", "を"), t("d-l49-19", "なさいます", key=True)],
         "Vâng, thầy sẽ diễn thuyết ạ."),
    line(L, 5, "受付", "Lễ tân",
         [t("d-l49-20", "おきゃくさん", "お客さん", "おきゃくさん", key=True), t("d-l49-21", "は"), t("d-l49-22", "なに", "何", "なに"),
          t("d-l49-23", "を"), t("d-l49-24", "めしあがります", "召し上がります", "めしあがります", key=True), t("d-l49-25", "か")],
         "Quý khách sẽ dùng gì ạ?"),
    line(L, 6, "秘書", "Thư ký",
         [t("d-l49-26", "おちゃ", "お茶", "おちゃ", key=True), t("d-l49-27", "を"), t("d-l49-28", "おねがいします", "お願いします", "おねがいします")],
         "Xin trà cho tôi."),
    line(L, 7, "受付", "Lễ tân",
         [t("d-l49-29", "かしこまりました", "畏まりました", "かしこまりました"), t("d-l49-30", "。"), t("d-l49-31", "しゃちょう", "社長", "しゃちょう", key=True),
          t("d-l49-32", "は"), t("d-l49-33", "この"), t("d-l49-34", "しんぶん", "新聞", "しんぶん", key=True),
          t("d-l49-35", "を"), t("d-l49-36", "およみに", "お読みに", "およみに", key=True), t("d-l49-37", "なりました", key=True),
          t("d-l49-38", "か")],
         "Vâng, tôi hiểu rồi ạ. Giám đốc đã đọc tờ báo này chưa ạ?"),
    line(L, 8, "秘書", "Thư ký",
         [t("d-l49-39", "はい"), t("d-l49-40", "、"), t("d-l49-41", "もう"), t("d-l49-42", "およみに", "お読みに", "およみに", key=True),
          t("d-l49-43", "なりました", key=True)],
         "Vâng, ngài đã đọc rồi ạ."),
    line(L, 9, "受付", "Lễ tân",
         [t("d-l49-44", "こうちょう", "校長", "こうちょう", key=True), t("d-l49-45", "せんせい", "先生", "せんせい"),
          t("d-l49-46", "の"), t("d-l49-47", "おたく", "お宅", "おたく", key=True), t("d-l49-48", "は"),
          t("d-l49-49", "どちら"), t("d-l49-50", "ですか")],
         "Nhà của thầy hiệu trưởng ở đâu ạ?"),
    line(L, 10, "秘書", "Thư ký",
         [t("d-l49-51", "とうきょう", "東京", "とうきょう"), t("d-l49-52", "だ"), t("d-l49-53", "そうです", key=True)],
         "Nghe nói ở Tokyo ạ."),
]

EXERCISES = [
    q(L, 1, "尊敬語 dùng để nâng cao hành động của ai?",
      ["Người TRÊN/người nghe (KHÔNG BAO GIỜ dùng cho hành động của chính mình)",
       "Chính người nói", "Bất kỳ ai, không phân biệt", "Chỉ dùng cho động vật"], 0,
      "尊敬語 luôn dùng để tôn trọng NGƯỜI KHÁC (cấp trên, khách hàng) — tuyệt đối không dùng cho hành động của bản thân.",
      "Đây là quy tắc nền tảng nhất của kính ngữ tôn kính."),
    q(L, 2, "いらっしゃいます có thể thay thế cho những động từ nào?",
      ["です／います／来ます／行きます (4 động từ)", "Chỉ thay được 行きます",
       "Chỉ thay được です", "Chỉ thay được います"], 0,
      "いらっしゃいます là động từ tôn kính đặc biệt, có thể thay thế TỚI BỐN động từ khác nhau tùy ngữ cảnh.",
      "Xem giải thích ở slide 2."),
    q(L, 3, "召し上がります là tôn kính ngữ của động từ nào?",
      ["食べます／飲みます (ăn/uống)", "見ます (xem)",
       "言います (nói)", "します (làm)"], 0,
      "召し上がります thay thế cho cả 食べます và 飲みます khi nói về hành động ăn/uống của người trên.",
      "Xem danh sách 5 động từ đặc biệt ở slide 2."),
    q(L, 4, "「新聞をお読みになりました」 dùng công thức nào?",
      ["お + gốc ます + になります (mẫu tôn kính tổng quát)", "Động từ đặc biệt riêng",
       "Thể bị động (bài 37)", "Thể sai khiến (bài 48)"], 0,
      "読みます không nằm trong 5 động từ đặc biệt, nên dùng công thức chung お+gốc+になります.",
      "Áp dụng công thức tổng quát ở slide 3."),
    q(L, 5, "Câu nào SAI vì dùng nhầm động từ đặc biệt cho việc KHÔNG có dạng riêng?",
      ["お食べになります (SAI, phải dùng 召し上がります)", "お読みになります (đúng)",
       "お書きになります (đúng)", "お使いになります (đúng)"], 0,
      "食べます đã có động từ đặc biệt riêng (召し上がります) nên KHÔNG dùng công thức chung お〜になります cho nó.",
      "Xem giới hạn của công thức tổng quát ở slide 3."),
    q(L, 6, "くださいます (đã học bài 41) thuộc nhóm nào trong hệ thống kính ngữ?",
      ["尊敬語 (tôn kính ngữ) — một trong các động từ đặc biệt",
       "謙譲語 (khiêm nhường ngữ)", "Không thuộc nhóm kính ngữ nào",
       "Chỉ là từ vựng thông thường"], 0,
      "くださいます là tôn kính ngữ của くれます, thuộc nhóm 尊敬語 cùng với いらっしゃる/おっしゃる/なさる/召し上がる/ご覧になる.",
      "Xem tổng kết ở slide 4."),
    q(L, 7, "「校長先生が講演をなさいます」 — なさいます là tôn kính ngữ của động từ nào?",
      ["します", "言います", "見ます", "食べます"], 0,
      "なさいます thay thế します khi nói về hành động của người trên.",
      "Xem danh sách động từ đặc biệt ở slide 2."),
    q(L, 8, "お宅 nghĩa là gì và dùng khi nào?",
      ["Nhà (của người khác, cách nói tôn kính) — không dùng cho nhà của chính mình",
       "Nhà (của chính mình)", "Công ty", "Trường học"], 0,
      "お宅 là cách nói lịch sự chỉ NHÀ CỦA NGƯỜI KHÁC, không dùng để nói về nhà của chính người nói.",
      "Xem ví dụ ở phần từ vựng."),
    q(L, 9, "Trong hội thoại, giám đốc đã đọc tờ báo chưa?",
      ["Đã đọc rồi", "Chưa đọc", "Không được nhắc tới", "Đang đọc dở"], 0,
      "Thư ký trả lời 「はい、もうお読みになりました」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Nhà của thầy hiệu trưởng ở đâu theo hội thoại?",
      ["Tokyo (nghe nói)", "Osaka", "Kyoto", "Không được nhắc tới"], 0,
      "Thư ký trả lời 「東京だそうです」.",
      "Xem câu thoại cuối cùng, kết hợp kiến thức そうです đã học ở bài 47."),
]

LESSON = lesson(
    L,
    "Bài 49: Kính ngữ tôn kính (尊敬語 - Sonkeigo)",
    "尊敬語 nâng cao hành động của NGƯỜI TRÊN/người nghe (không bao giờ dùng cho chính mình): năm "
    "động từ đặc biệt いらっしゃる/おっしゃる/なさる/召し上がる/ご覧になる (cùng nhóm với くださる "
    "đã học bài 41), và công thức tổng quát お+gốc ます+になります áp dụng cho các động từ còn lại "
    "— chuẩn bị nền tảng đối lập với 謙譲語 (khiêm nhường ngữ) sẽ học ở bài 50.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
