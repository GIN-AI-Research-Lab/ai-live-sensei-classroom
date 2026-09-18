# -*- coding: utf-8 -*-
"""N4 — Bai 46: Thoi diem chinh xac V-ところ, vua moi 〜たばかり.

Tu vung minh hoa TU CHON tu pool mo (chudo tu N5 pool chua dung toi,
着く them thu cong vi la dong tu loi can thiet cho bai), ket hop dong tu
da hoc o N5 lam vi du chia sang cau truc moi.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 46
pool = Pool("n4")

VOCAB = [
    v(1,  "たべます", "食べます", "たべます", "tabemasu", "verb", "Ăn", "食べる ところです = sắp/đang ăn. Đã gặp N5 bài 6.", L),
    v(2,  "でかけます", "出かけます", "でかけます", "dekakemasu", "verb", "Ra ngoài, đi ra", "出かける ところです = sắp ra ngoài. Đã gặp N5 bài 16.", L),
    v(3,  "はじまります", "始まります", "はじまります", "hajimarimasu", "verb", "Bắt đầu (tự động từ)", "始まった ばかりです = vừa mới bắt đầu. Đã gặp bài 29.", L),
    v(4,  "おわります", "終わります", "おわります", "owarimasu", "verb", "Kết thúc, xong", "終わった ばかりです = vừa mới xong. Đã gặp N5 bài 4.", L),
    v(5,  "きます", "来ます", "きます", "kimasu", "verb", "Đến", "来た ばかりです = vừa mới đến. Đã gặp N5 bài 5.", L),
    v(6,  "かえります", "帰ります", "かえります", "kaerimasu", "verb", "Về nhà", "帰った ばかりです = vừa mới về. Đã gặp N5 bài 5.", L),
    v(7,  "つきます", "着きます", "つきます", "tsukimasu", "verb", "Đến nơi, tới nơi", "駅に 着いた ところです = vừa mới tới ga.", L),
    v(8,  "おきます", "起きます", "おきます", "okimasu", "verb", "Thức dậy", "起きた ばかりです = vừa mới thức dậy. Đã gặp N5 bài 4.", L),
    v(9,  "べんきょうします", "勉強します", "べんきょうします", "benkyou shimasu", "verb", "Học, học tập", "勉強している ところです = đang trong lúc học bài.", L),
    v(10, "でんわします", "電話します", "でんわします", "denwa shimasu", "verb", "Gọi điện thoại", "電話している ところです = đang trong lúc gọi điện.", L),
    v(11, "ちょうど", "丁度", "ちょうど", "choudo", "adverb", "Vừa đúng, vừa vặn", "ちょうど 今、食べる ところです = đúng lúc bây giờ tôi sắp ăn.", L),
    v(12, "いま", "今", "いま", "ima", "noun", "Bây giờ", "Đã gặp N5 bài 4.", L),
    v(13, "えき", "駅", "えき", "eki", "noun", "Nhà ga", "Đã gặp N5 bài 5.", L),
    v(14, "かいぎ", "会議", "かいぎ", "kaigi", "noun", "Cuộc họp", "Đã gặp N5 bài 7.", L),
    v(15, "じゅぎょう", "授業", "じゅぎょう", "jugyou", "noun", "Buổi học, tiết học", "Đã gặp bài 34.", L),
    v(16, "しごと", "仕事", "しごと", "shigoto", "noun", "Công việc", "Đã gặp N5 bài 9.", L),
    v(17, "えいが", "映画", "えいが", "eiga", "noun", "Phim, điện ảnh", "Đã gặp N5 bài 6.", L),
    v(18, "しゃしん", "写真", "しゃしん", "shashin", "noun", "Bức ảnh", "Đã gặp N5 bài 6.", L),
    v(19, "でんしゃ", "電車", "でんしゃ", "densha", "noun", "Tàu điện", "Đã gặp N5 bài 5.", L),
    v(20, "たんじょうび", "誕生日", "たんじょうび", "tanjoubi", "noun", "Sinh nhật", "Đã gặp N5 bài 5.", L),
]

KANJI = [
    k(1, "丁", "ĐINH", 2, ["チョウ (chou)", "テイ (tei)"], [], "Ngay ngắn, chính xác (chỉ ghép trong 丁度).",
      [("丁度", "ちょうど", "Vừa đúng"), ("丁寧", "ていねい", "Lịch sự, cẩn thận")], L),
    k(2, "着", "TRƯỚC", 12, ["チャク (chaku)"], ["つ(く)", "き(る)"], "Đến nơi; mặc (áo). Đã gặp bài 22.",
      [("着きます", "つきます", "Đến nơi"), ("着ます", "きます", "Mặc"), ("到着", "とうちゃく", "Sự đến nơi")], L),
    k(3, "始", "THỦY", 8, ["シ (shi)"], ["はじ(まる)", "はじ(める)"], "Bắt đầu. Đã gặp bài 29.",
      [("始まります", "はじまります", "Bắt đầu"), ("始めます", "はじめます", "Bắt đầu (tha)")], L),
    k(4, "終", "CHUNG", 11, ["シュウ (shuu)"], ["お(わる)"], "Kết thúc.",
      [("終わります", "おわります", "Kết thúc"), ("終電", "しゅうでん", "Chuyến tàu cuối")], L),
    k(5, "度", "ĐỘ", 9, ["ド (do)"], ["たび"], "Mức độ, lần.",
      [("丁度", "ちょうど", "Vừa đúng"), ("今度", "こんど", "Lần này"), ("何度", "なんど", "Mấy lần")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Sắp làm: V(từ điển) + ところです",
        "V(từ điển) + ところです   (thời điểm NGAY TRƯỚC khi hành động bắt đầu)",
        "ところ (nguyên nghĩa 'nơi chốn/thời điểm') ghép sau thể từ điển để định vị chính xác "
        "MỘT KHOẢNH KHẮC — ở đây là khoảnh khắc NGAY TRƯỚC khi hành động xảy ra.",
        [
            ex(L, 1, 1, [t("t-l46s1-1", "いま", "今", "いま"), t("t-l46s1-2", "、"),
                         t("t-l46s1-3", "でかける", "出かける", "でかける", key=True), t("t-l46s1-4", "ところ", key=True),
                         t("t-l46s1-5", "です")],
               "Bây giờ tôi sắp ra ngoài."),
            ex(L, 1, 2, [t("t-l46s1-6", "でんしゃ", "電車", "でんしゃ"), t("t-l46s1-7", "は"),
                         t("t-l46s1-8", "いま", "今", "いま"), t("t-l46s1-9", "、"), t("t-l46s1-10", "えき", "駅", "えき"),
                         t("t-l46s1-11", "に"), t("t-l46s1-12", "つく", "着く", "つく", key=True), t("t-l46s1-13", "ところ", key=True),
                         t("t-l46s1-14", "です")],
               "Tàu điện bây giờ sắp đến ga."),
        ],
        tips="ところです luôn cần từ 今 hoặc ngữ cảnh THỜI ĐIỂM HIỆN TẠI đi kèm — nó định vị một khoảnh khắc rất hẹp, không dùng cho kế hoạch xa.",
        culture="今、出かけるところです là câu trả lời điện thoại rất tự nhiên khi ai đó gọi đúng lúc bạn chuẩn bị ra khỏi nhà."),

    slide(L, 2,
        "2. Đang làm: V(ている) + ところです",
        "V(ている) + ところです   (khoảnh khắc NGAY GIỮA lúc hành động diễn ra)",
        "Ghép ところ vào SAU thể ています (đã học N5 bài 14) để nhấn TÍNH TỨC THỜI của hành động "
        "đang diễn ra — nhấn mạnh hơn hẳn chỉ nói ています đơn thuần.",
        [
            ex(L, 2, 1, [t("t-l46s2-1", "いま", "今", "いま"), t("t-l46s2-2", "、"), t("t-l46s2-3", "べんきょう", "勉強", "べんきょう"),
                         t("t-l46s2-4", "して", key=True), t("t-l46s2-5", "いる", key=True), t("t-l46s2-6", "ところ", key=True),
                         t("t-l46s2-7", "です")],
               "Bây giờ tôi đang trong lúc học bài."),
            ex(L, 2, 2, [t("t-l46s2-8", "かいぎ", "会議", "かいぎ"), t("t-l46s2-9", "は"), t("t-l46s2-10", "まだ"),
                         t("t-l46s2-11", "して", key=True), t("t-l46s2-12", "いる", key=True), t("t-l46s2-13", "ところ", key=True),
                         t("t-l46s2-14", "です")],
               "Cuộc họp vẫn đang trong lúc diễn ra."),
        ],
        tips="Vているところ nhấn mạnh 'ĐANG GIỮA CHỪNG' hơn Vています thông thường — hợp khi muốn nói 'đừng làm phiền, tôi đang bận việc này'.",
        culture="今、しているところです là câu trả lời phổ biến khi bị hỏi 'làm xong chưa' trong lúc đang dở tay việc gì đó."),

    slide(L, 3,
        "3. Vừa mới xong: V(た) + ところです／ばかりです",
        "V(た) + ところです (NGAY SAU khi xong, còn rất mới) 　V(た) + ばかりです (mới xảy ra, có thể lâu hơn một chút)",
        "Hai cấu trúc gần giống nhau nhưng SẮC THÁI THỜI GIAN khác: たところ nhấn khoảnh khắc VỪA "
        "DỨT (giây/phút trước); たばかり nới rộng hơn (có thể vài phút/giờ trước) và mang cảm giác "
        "chủ quan 'còn mới' hơn là khách quan về thời gian.",
        [
            ex(L, 3, 1, [t("t-l46s3-1", "ちょうど", "丁度", "ちょうど", key=True), t("t-l46s3-2", "、"),
                         t("t-l46s3-3", "たべた", "食べた", "たべた", key=True), t("t-l46s3-4", "ところ", key=True),
                         t("t-l46s3-5", "です")],
               "Tôi vừa mới ăn xong (ngay lúc này)."),
            ex(L, 3, 2, [t("t-l46s3-6", "きた", "来た", "きた", key=True), t("t-l46s3-7", "ばかり", key=True),
                         t("t-l46s3-8", "です")],
               "Tôi vừa mới đến (có thể vài phút trước)."),
        ],
        tips="たところ nghe 'mới hơn' たばかり một chút — nếu sự việc xảy ra cách đây vài giờ, たばかり tự nhiên hơn たところ nhiều.",
        culture="日本に来たばかりです (tôi vừa mới đến Nhật) là câu tự giới thiệu rất phổ biến của người nước ngoài mới nhập cư, xin việc, hoặc làm quen."),

    slide(L, 4,
        "4. So sánh V-そう (bài 43), V-ところ, V-たばかり trên trục thời gian",
        "V-そう: SẮP xảy ra (chưa xảy ra) → Vるところ: NGAY TRƯỚC lúc bắt đầu → Vているところ: ĐANG diễn ra → V-たところ/ばかり: VỪA xong",
        "Bốn điểm này tạo thành một TRỤC THỜI GIAN liên tục quanh một hành động — giúp diễn đạt "
        "chính xác GIAI ĐOẠN nào của hành động đang được nói tới.",
        [
            ex(L, 4, 1, [t("t-l46s4-1", "えいが", "映画", "えいが"), t("t-l46s4-2", "が"),
                         t("t-l46s4-3", "はじまりそう", "始まりそう", "はじまりそう", key=True), t("t-l46s4-4", "です")],
               "Phim có vẻ sắp bắt đầu. (そう — dấu hiệu, chưa chắc chắn hoàn toàn)"),
            ex(L, 4, 2, [t("t-l46s4-5", "えいが", "映画", "えいが"), t("t-l46s4-6", "が"),
                         t("t-l46s4-7", "はじまった", "始まった", "はじまった", key=True), t("t-l46s4-8", "ばかり", key=True),
                         t("t-l46s4-9", "です")],
               "Phim vừa mới bắt đầu. (たばかり — đã bắt đầu, còn rất mới)"),
        ],
        tips="Khi kể một câu chuyện có mốc thời gian, việc chọn đúng bốn cấu trúc này giúp người nghe hình dung chính xác TIẾN ĐỘ của sự việc.",
        culture="Người dẫn chương trình sự kiện Nhật hay dùng đủ cả bốn giai đoạn này để thông báo tiến độ chương trình cho khán giả."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d-l46-1", "もしもし"), t("d-l46-2", "、"), t("d-l46-3", "いま", "今", "いま"), t("d-l46-4", "、"),
          t("d-l46-5", "はなせます", "話せます", "はなせます"), t("d-l46-6", "か")],
         "Alô, bây giờ nói chuyện được không?"),
    line(L, 2, "山田", "Nhân viên công ty",
         [t("d-l46-7", "すみません"), t("d-l46-8", "、"), t("d-l46-9", "いま", "今", "いま"), t("d-l46-10", "、"),
          t("d-l46-11", "でかける", "出かける", "でかける", key=True), t("d-l46-12", "ところ", key=True), t("d-l46-13", "です")],
         "Xin lỗi, bây giờ tôi sắp ra ngoài."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d-l46-14", "そうですか"), t("d-l46-15", "。"), t("d-l46-16", "かいぎ", "会議", "かいぎ", key=True),
          t("d-l46-17", "は"), t("d-l46-18", "もう"), t("d-l46-19", "はじまりました", "始まりました", "はじまりました"),
          t("d-l46-20", "か")],
         "Vậy à. Cuộc họp đã bắt đầu chưa?"),
    line(L, 4, "山田", "Nhân viên công ty",
         [t("d-l46-21", "いいえ"), t("d-l46-22", "、"), t("d-l46-23", "まだ"), t("d-l46-24", "です"),
          t("d-l46-25", "。"), t("d-l46-26", "ちょうど", "丁度", "ちょうど", key=True), t("d-l46-27", "、"),
          t("d-l46-28", "はじまる", "始まる", "はじまる", key=True), t("d-l46-29", "ところ", key=True), t("d-l46-30", "です")],
         "Không, chưa đâu. Vừa đúng lúc sắp bắt đầu đấy."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d-l46-31", "わかりました", "分かりました", "わかりました"), t("d-l46-32", "。"), t("d-l46-33", "あとで"),
          t("d-l46-34", "でんわします", "電話します", "でんわします")],
         "Tôi hiểu rồi. Lát nữa tôi gọi lại."),
    line(L, 6, "山田", "Nhân viên công ty",
         [t("d-l46-35", "はい"), t("d-l46-36", "、"), t("d-l46-37", "おねがいします", "お願いします", "おねがいします")],
         "Vâng, phiền chị nhé."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d-l46-38", "（あとで）")],
         "(Lát sau)"),
    line(L, 8, "田中", "Đồng nghiệp",
         [t("d-l46-39", "もしもし"), t("d-l46-40", "、"), t("d-l46-41", "かいぎ", "会議", "かいぎ", key=True),
          t("d-l46-42", "は"), t("d-l46-43", "どうでしたか")],
         "Alô, cuộc họp thế nào rồi?"),
    line(L, 9, "山田", "Nhân viên công ty",
         [t("d-l46-44", "たった", "たった", "たった"), t("d-l46-45", "いま", "今", "いま"), t("d-l46-46", "、"),
          t("d-l46-47", "おわった", "終わった", "おわった", key=True), t("d-l46-48", "ばかり", key=True), t("d-l46-49", "です")],
         "Vừa mới xong ngay bây giờ đây."),
    line(L, 10, "田中", "Đồng nghiệp",
         [t("d-l46-50", "おつかれさま", "お疲れ様", "おつかれさま"), t("d-l46-51", "でした"), t("d-l46-52", "。"),
          t("d-l46-53", "けっか", "結果", "けっか"), t("d-l46-54", "は"), t("d-l46-55", "どうでしたか")],
         "Vất vả rồi. Kết quả thế nào?"),
]

EXERCISES = [
    q(L, 1, "「今、出かけるところです」 — ところです diễn tả:",
      ["Thời điểm NGAY TRƯỚC khi hành động bắt đầu (sắp làm)",
       "Hành động đang diễn ra giữa chừng", "Hành động vừa mới xong",
       "Hành động đã xong từ lâu"], 0,
      "V(từ điển)+ところです định vị khoảnh khắc NGAY TRƯỚC khi hành động bắt đầu.",
      "Xem cấu trúc ở slide 1."),
    q(L, 2, "「今、会議をしているところです」 khác 「今、会議をしています」 ở:",
      ["ところです nhấn mạnh TÍNH TỨC THỜI, đang giữa chừng hơn ています thông thường",
       "Hoàn toàn giống nhau", "ところです là thì quá khứ",
       "ています mới đúng, ところです sai"], 0,
      "Thêm ところ vào sau ている nhấn mạnh hành động đang ở NGAY GIỮA quá trình, không phải chỉ đơn thuần đang diễn ra.",
      "Xem sắc thái bổ sung ở slide 2."),
    q(L, 3, "たところ và たばかり khác nhau chủ yếu ở:",
      ["たところ nhấn khoảnh khắc VỪA DỨT (rất mới); たばかり nới rộng thời gian hơn một chút, mang cảm giác chủ quan 'còn mới'",
       "Hoàn toàn giống nhau về mọi mặt", "たところ chỉ dùng cho câu hỏi",
       "たばかり chỉ dùng cho phủ định"], 0,
      "たところ hẹp hơn về thời gian (vừa mới dứt); たばかり linh hoạt hơn, có thể chỉ việc xảy ra vài phút/giờ trước nhưng người nói vẫn thấy 'mới'.",
      "Xem so sánh chi tiết ở slide 3."),
    q(L, 4, "「日本に来たばかりです」 nghĩa là:",
      ["Tôi vừa mới đến Nhật (chưa lâu)", "Tôi sắp đến Nhật",
       "Tôi đã ở Nhật lâu rồi", "Tôi chưa từng đến Nhật"], 0,
      "たばかり diễn tả một sự việc mới xảy ra gần đây, người nói còn cảm giác 'mới'.",
      "Áp dụng đúng nghĩa たばかり."),
    q(L, 5, "Sắp xếp bốn giai đoạn theo TRỤC THỜI GIAN đúng thứ tự:",
      ["V-そう → Vるところ → Vているところ → V-たところ/ばかり",
       "V-たばかり → Vそう → Vるところ → Vているところ",
       "Vているところ → V-そう → Vるところ → V-たばかり",
       "Không có thứ tự cố định"], 0,
      "Đúng trục thời gian: dấu hiệu sắp xảy ra (そう) → ngay trước khi bắt đầu (るところ) → đang diễn ra (ているところ) → vừa xong (たところ/ばかり).",
      "Xem tổng kết trục thời gian ở slide 4."),
    q(L, 6, "「駅に着くところです」 và 「駅に着いたばかりです」 khác nhau ở:",
      ["Câu đầu là SẮP đến ga (chưa tới); câu sau là ĐÃ đến ga (vừa xong)",
       "Hoàn toàn giống nhau về thời điểm", "Câu đầu là quá khứ",
       "Câu sau là tương lai"], 0,
      "着くところ (thể từ điển) là sắp tới; 着いたばかり (thể た) là đã tới, vừa xong — khác nhau về thì của động từ gốc.",
      "So sánh thể từ điển và thể た đi với các cấu trúc này."),
    q(L, 7, "ちょうど thường đi kèm với cấu trúc nào để nhấn mạnh tính chính xác về thời điểm?",
      ["ところです", "ています", "でしょう", "かもしれません"], 0,
      "ちょうど (vừa đúng) thường ghép cùng ところです để nhấn mạnh khoảnh khắc CHÍNH XÁC đang nói tới.",
      "Xem ví dụ ở slide 3."),
    q(L, 8, "Câu nào ĐÚNG khi nói 'cuộc họp vẫn đang diễn ra'?",
      ["会議はまだしているところです", "会議はまだするところです",
       "会議はまだしたところです", "会議はまだするばかりです"], 0,
      "'Đang diễn ra' cần thể ている + ところです — không dùng thể từ điển (sắp) hay thể た (đã xong).",
      "Chọn đúng thì động từ tương ứng với 'đang diễn ra'."),
    q(L, 9, "Trong hội thoại, vì sao Yamada không nói chuyện điện thoại được lúc đầu?",
      ["Vì sắp ra ngoài / cuộc họp sắp bắt đầu", "Vì đang ngủ",
       "Vì điện thoại hết pin", "Vì không muốn nói chuyện"], 0,
      "Yamada nói 「今、出かけるところです」 rồi giải thích 「丁度、始まるところです」.",
      "Xem câu thoại thứ 2 và 4."),
    q(L, 10, "Khi Tanaka gọi lại, cuộc họp đã thế nào?",
      ["Vừa mới kết thúc", "Vẫn đang diễn ra", "Chưa bắt đầu", "Bị hủy"], 0,
      "Yamada nói 「たった今、終わったばかりです」.",
      "Xem câu thoại thứ 9."),
]

LESSON = lesson(
    L,
    "Bài 46: Thời điểm chính xác (V-ところ) & Vừa mới (〜たばかり)",
    "Định vị chính xác GIAI ĐOẠN của một hành động: Vるところです (sắp làm), Vているところです "
    "(đang giữa chừng, nhấn mạnh hơn ています), V-たところです/たばかりです (vừa xong, たところ "
    "hẹp hơn về thời gian so với たばかり) — kết hợp với V-そう (bài 43) tạo thành trục thời gian "
    "đầy đủ quanh một hành động.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
