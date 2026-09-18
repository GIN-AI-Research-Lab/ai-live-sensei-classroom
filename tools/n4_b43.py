# -*- coding: utf-8 -*-
"""N4 — Bai 43: Du doan sap xay ra V-そう, trong co ve A-そう.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 43
pool = Pool("n4")

VOCAB = [
    v(1,  "ふります", "降ります", "ふります", "furimasu", "verb", "Rơi, đổ xuống (mưa, tuyết)", "雨が 降りそうです = trời có vẻ sắp mưa.", L),
    v(2,  "たおれます", "倒れます", "たおれます", "taoremasu", "verb", "Ngã, sụp đổ", "木が 倒れそうです = cái cây có vẻ sắp đổ.", L),
    v(3,  "こわれます", "壊れます", "こわれます", "kowaremasu", "verb", "Bị hỏng, bị vỡ", "Đã gặp bài 26. 椅子が 壊れそうです = cái ghế có vẻ sắp hỏng.", L),
    v(4,  "なきます", "泣きます", "なきます", "nakimasu", "verb", "Khóc", "子供が 泣きそうです = đứa trẻ có vẻ sắp khóc.", L),
    v(5,  "おちます", "落ちます", "おちます", "ochimasu", "verb", "Rơi, rớt xuống", "本が 落ちそうです = quyển sách có vẻ sắp rơi.", L),
    v(6,  "つかれます", "疲れます", "つかれます", "tsukaremasu", "verb", "Mệt, mệt mỏi", "Đã gặp bài 32.", L),
    v(7,  "ねむい", "眠い", "ねむい", "nemui", "adjective", "Buồn ngủ", "Tính từ い. 眠そうです = trông có vẻ buồn ngủ (bỏ い, thêm そう).", L),
    v(8,  "おいしい", "美味しい", "おいしい", "oishii", "adjective", "Ngon", "Đã gặp N5 bài 8.", L),
    v(9,  "にがい", "苦い", "にがい", "nigai", "adjective", "Đắng", "この 薬は 苦そうです = thuốc này trông có vẻ đắng.", L),
    v(10, "たのしい", "楽しい", "たのしい", "tanoshii", "adjective", "Vui vẻ", "Đã gặp N5 bài 8.", L),
    v(11, "いそがしい", "忙しい", "いそがしい", "isogashii", "adjective", "Bận rộn", "Đã gặp N5 bài 9.", L),
    v(12, "げんき", "元気", "げんき", "genki", "adjective", "Khỏe mạnh", "Đã gặp N5 bài 8. 元気そうです = trông có vẻ khỏe.", L),
    v(13, "しんせつ", "親切", "しんせつ", "shinsetsu", "adjective", "Tốt bụng, ân cần", "Đã gặp N5 bài 16.", L),
    v(14, "あめ", "雨", "あめ", "ame", "noun", "Mưa", "Đã gặp N5 bài 21.", L),
    v(15, "くも", "雲", "くも", "kumo", "noun", "Mây", "黒い雲が あります = có đám mây đen.", L),
    v(16, "き", "木", "き", "ki", "noun", "Cây", "Đã gặp N5 bài 10.", L),
    v(17, "いす", "椅子", "いす", "isu", "noun", "Cái ghế", "Đã gặp N5 bài 2.", L),
    v(18, "こども", "子供", "こども", "kodomo", "noun", "Trẻ con", "Đã gặp N5 bài 23.", L),
    v(19, "くすり", "薬", "くすり", "kusuri", "noun", "Thuốc", "Đã gặp bài 17 (N5).", L),
    v(20, "てんき", "天気", "てんき", "tenki", "noun", "Thời tiết", "Đã gặp N5 bài 21.", L),
]

KANJI = [
    k(1, "降", "GIÁNG", 10, ["コウ (kou)"], ["ふ(る)", "お(りる)"], "Rơi xuống; xuống (xe).",
      [("降ります", "ふります", "Rơi (mưa)"), ("以降", "いこう", "Từ đó về sau")], L),
    k(2, "倒", "ĐẢO", 10, ["トウ (tou)"], ["たお(れる)"], "Đổ, ngã.",
      [("倒れます", "たおれます", "Đổ, ngã"), ("面倒", "めんどう", "Phiền phức")], L),
    k(3, "泣", "KHẤP", 8, ["キュウ (kyuu)"], ["な(く)"], "Khóc.",
      [("泣きます", "なきます", "Khóc"), ("泣き声", "なきごえ", "Tiếng khóc")], L),
    k(4, "落", "LẠC", 12, ["ラク (raku)"], ["お(ちる)"], "Rơi rụng.",
      [("落ちます", "おちます", "Rơi"), ("落語", "らくご", "Rakugo (kể chuyện hài)")], L),
    k(5, "眠", "MIÊN", 10, ["ミン (min)"], ["ねむ(い)", "ねむ(る)"], "Ngủ, buồn ngủ.",
      [("眠い", "ねむい", "Buồn ngủ"), ("睡眠", "すいみん", "Giấc ngủ")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Dự đoán sắp xảy ra: V(ます bỏ ます) + そうです",
        "V(gốc ます) + そうです   (dự đoán dựa trên DẤU HIỆU quan sát được NGAY LÚC NÀY)",
        "そう ghép sau GỐC MASU của động từ (không phải thể từ điển) để diễn tả điều gì đó SẮP xảy "
        "ra dựa trên dấu hiệu trước mắt — khác でしょう (N4 bài 32, suy luận từ lý do logic).",
        [
            ex(L, 1, 1, [t("t-l43s1-1", "あめ", "雨", "あめ", key=True), t("t-l43s1-2", "が"),
                         t("t-l43s1-3", "ふりそう", "降りそう", "ふりそう", key=True), t("t-l43s1-4", "です")],
               "Trời có vẻ sắp mưa. (nhìn mây đen, dấu hiệu ngay bây giờ)"),
            ex(L, 1, 2, [t("t-l43s1-5", "き", "木", "き"), t("t-l43s1-6", "が"),
                         t("t-l43s1-7", "たおれそう", "倒れそう", "たおれそう", key=True), t("t-l43s1-8", "です")],
               "Cái cây có vẻ sắp đổ."),
        ],
        tips="そう (dự đoán sắp xảy ra) đòi hỏi có DẤU HIỆU TRỰC QUAN ngay lúc nói — khác でしょう chỉ cần suy luận logic, không cần nhìn thấy dấu hiệu.",
        culture="雨が降りそうですね là câu mở đầu trò chuyện về thời tiết rất phổ biến khi nhìn bầu trời âm u ở Nhật."),

    slide(L, 2,
        "2. Trông có vẻ: A(い bỏ い) + そうです",
        "A-い (bỏ い) + そうです   (NGOẠI LỆ: いい → よさそう, ない → なさそう)",
        "Với TÍNH TỪ い, そう diễn tả ẤN TƯỢNG BỀ NGOÀI (nhìn có vẻ) chứ chưa chắc chắn (chưa thử/"
        "chưa kiểm chứng) — khác hẳn nói thẳng tính từ nếu đã CHẮC CHẮN.",
        [
            ex(L, 2, 1, [t("t-l43s2-1", "この"), t("t-l43s2-2", "りょうり", "料理", "りょうり"),
                         t("t-l43s2-3", "は"), t("t-l43s2-4", "おいしそう", "美味しそう", "おいしそう", key=True),
                         t("t-l43s2-5", "です")],
               "Món ăn này trông có vẻ ngon. (chưa ăn, chỉ nhìn thấy)"),
            ex(L, 2, 2, [t("t-l43s2-6", "こども", "子供", "こども", key=True), t("t-l43s2-7", "は"),
                         t("t-l43s2-8", "ねむそう", "眠そう", "ねむそう", key=True), t("t-l43s2-9", "です")],
               "Đứa trẻ trông có vẻ buồn ngủ."),
        ],
        tips="Ngoại lệ đặc biệt phải nhớ: いい (tốt) → よさそう (KHÔNG nói いいそう); ない (không có) → なさそう.",
        culture="美味しそうです là câu khen phổ biến nhất khi nhìn thấy món ăn được bày ra, trước khi nếm thử."),

    slide(L, 3,
        "3. Tính từ な và danh từ với そう",
        "な-adj (bỏ な) + そうです",
        "Tính từ な bỏ luôn phần đuôi な/だ trước khi ghép そう — không cần biến âm phức tạp như "
        "tính từ い, chỉ đơn giản nối trực tiếp vào gốc tính từ.",
        [
            ex(L, 3, 1, [t("t-l43s3-1", "せんせい", "先生", "せんせい"), t("t-l43s3-2", "は"),
                         t("t-l43s3-3", "げんきそう", "元気そう", "げんきそう", key=True), t("t-l43s3-4", "です")],
               "Thầy giáo trông có vẻ khỏe mạnh."),
            ex(L, 3, 2, [t("t-l43s3-5", "あの"), t("t-l43s3-6", "ひと", "人", "ひと"), t("t-l43s3-7", "は"),
                         t("t-l43s3-8", "しんせつそう", "親切そう", "しんせつそう", key=True), t("t-l43s3-9", "です")],
               "Người kia trông có vẻ tốt bụng."),
        ],
        tips="Tính từ な không có ngoại lệ như いい/ない ở tính từ い — luôn chỉ cần bỏ な/だ rồi ghép そう.",
        culture="元気そうですね là câu chào hỏi xã giao phổ biến khi lâu ngày gặp lại ai đó, nhận xét về vẻ ngoài khỏe mạnh của họ."),

    slide(L, 4,
        "4. So sánh V-そう và A-そう, và với でしょう (N4 bài 32)",
        "V-そう: dấu hiệu HÀNH ĐỘNG sắp xảy ra　A-そう: ẤN TƯỢNG bề ngoài chưa kiểm chứng　でしょう: suy luận LOGIC có căn cứ",
        "Ba cách dự đoán/nhận xét đều gần nghĩa nhưng khác NGUỒN GỐC thông tin: quan sát dấu hiệu "
        "trực tiếp (そう) hay suy luận gián tiếp qua lý do (でしょう).",
        [
            ex(L, 4, 1, [t("t-l43s4-1", "いす", "椅子", "いす", key=True), t("t-l43s4-2", "が"),
                         t("t-l43s4-3", "こわれそう", "壊れそう", "こわれそう", key=True), t("t-l43s4-4", "です"),
                         t("t-l43s4-5", "から"), t("t-l43s4-6", "、"), t("t-l43s4-7", "すわらないで", "座らないで", "すわらないで"),
                         t("t-l43s4-8", "ください")],
               "Vì cái ghế trông có vẻ sắp hỏng, xin đừng ngồi lên."),
            ex(L, 4, 2, [t("t-l43s4-9", "この"), t("t-l43s4-10", "くすり", "薬", "くすり", key=True), t("t-l43s4-11", "は"),
                         t("t-l43s4-12", "にがそう", "苦そう", "にがそう", key=True), t("t-l43s4-13", "です"),
                         t("t-l43s4-14", "が"), t("t-l43s4-15", "、"), t("t-l43s4-16", "のまなければ", "飲まなければ", "のまなければ"),
                         t("t-l43s4-17", "なりません")],
               "Thuốc này trông có vẻ đắng, nhưng vẫn phải uống."),
        ],
        tips="そう luôn cần một DẤU HIỆU CỤ THỂ nhìn/nghe/cảm nhận được ngay lúc nói — nếu chỉ suy luận từ lý do gián tiếp thì dùng でしょう (bài 32) thay thế.",
        culture="椅子が壊れそうです là câu cảnh báo thực tế phổ biến khi thấy đồ vật có dấu hiệu hỏng hóc, giúp người khác tránh tai nạn."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d-l43-1", "そら", "空", "そら"), t("d-l43-2", "を"), t("d-l43-3", "みて", "見て", "みて"),
          t("d-l43-4", "ください", key=True), t("d-l43-5", "。"), t("d-l43-6", "あめ", "雨", "あめ", key=True),
          t("d-l43-7", "が"), t("d-l43-8", "ふりそう", "降りそう", "ふりそう", key=True), t("d-l43-9", "です")],
         "Nhìn bầu trời xem. Trời có vẻ sắp mưa."),
    line(L, 2, "サントス", "Sinh viên",
         [t("d-l43-10", "ほんとう", "本当", "ほんとう"), t("d-l43-11", "ですね"), t("d-l43-12", "。"),
          t("d-l43-13", "かさ", "傘", "かさ"), t("d-l43-14", "を"), t("d-l43-15", "もって", "持って", "もって"),
          t("d-l43-16", "いきましょう", "行きましょう", "いきましょう")],
         "Thật đấy nhỉ. Mang ô theo đi."),
    line(L, 3, "ワン", "Sinh viên",
         [t("d-l43-17", "ところで"), t("d-l43-18", "、"), t("d-l43-19", "サントスさん"), t("d-l43-20", "、"),
          t("d-l43-21", "ねむそう", "眠そう", "ねむそう", key=True), t("d-l43-22", "です"), t("d-l43-23", "ね")],
         "À mà, cậu Santos trông có vẻ buồn ngủ nhỉ."),
    line(L, 4, "サントス", "Sinh viên",
         [t("d-l43-24", "はい"), t("d-l43-25", "、"), t("d-l43-26", "きのう", "昨日", "きのう"),
          t("d-l43-27", "べんきょう", "勉強", "べんきょう"), t("d-l43-28", "して", key=True), t("d-l43-29", "、"),
          t("d-l43-30", "つかれました", "疲れました", "つかれました")],
         "Vâng, hôm qua tớ học bài nên mệt lắm."),
    line(L, 5, "ワン", "Sinh viên",
         [t("d-l43-31", "だいじょうぶ", "大丈夫", "だいじょうぶ"), t("d-l43-32", "ですか")],
         "Cậu ổn không?"),
    line(L, 6, "サントス", "Sinh viên",
         [t("d-l43-33", "はい"), t("d-l43-34", "、"), t("d-l43-35", "だいじょうぶ", "大丈夫", "だいじょうぶ"),
          t("d-l43-36", "です"), t("d-l43-37", "。"), t("d-l43-38", "あ"), t("d-l43-39", "、"),
          t("d-l43-40", "あの"), t("d-l43-41", "みせ", "店", "みせ"), t("d-l43-42", "の"),
          t("d-l43-43", "りょうり", "料理", "りょうり"), t("d-l43-44", "、"), t("d-l43-45", "おいしそう", "美味しそう", "おいしそう", key=True),
          t("d-l43-46", "です"), t("d-l43-47", "ね")],
         "Vâng, ổn thôi. À, món ăn ở cửa hàng kia trông có vẻ ngon nhỉ."),
    line(L, 7, "ワン", "Sinh viên",
         [t("d-l43-48", "ほんとう", "本当", "ほんとう"), t("d-l43-49", "ですね"), t("d-l43-50", "。"),
          t("d-l43-51", "たべて", "食べて", "たべて"), t("d-l43-52", "みましょう", key=True)],
         "Đúng đấy nhỉ. Thử ăn xem sao."),
    line(L, 8, "サントス", "Sinh viên",
         [t("d-l43-53", "でも"), t("d-l43-54", "、"), t("d-l43-55", "あの"), t("d-l43-56", "いす", "椅子", "いす", key=True),
          t("d-l43-57", "、"), t("d-l43-58", "こわれそう", "壊れそう", "こわれそう", key=True), t("d-l43-59", "です"),
          t("d-l43-60", "ね")],
         "Nhưng cái ghế kia có vẻ sắp hỏng đấy nhỉ."),
    line(L, 9, "ワン", "Sinh viên",
         [t("d-l43-61", "たしかに", "確かに", "たしかに"), t("d-l43-62", "。"), t("d-l43-63", "べつの"),
          t("d-l43-64", "せき", "席", "せき"), t("d-l43-65", "に"), t("d-l43-66", "すわりましょう", "座りましょう", "すわりましょう")],
         "Đúng đấy. Ngồi chỗ khác đi."),
    line(L, 10, "サントス", "Sinh viên",
         [t("d-l43-67", "そう", key=True), t("d-l43-68", "しましょう")],
         "Làm vậy đi."),
]

EXERCISES = [
    q(L, 1, "「雨が降りそうです」 ghép そう vào phần nào của động từ 降ります?",
      ["Gốc ます (bỏ ます, giữ 降り)", "Thể từ điển (降る)",
       "Thể た (降った)", "Thể て (降って)"], 0,
      "V-そう (dự đoán sắp xảy ra) ghép vào GỐC MASU của động từ, không phải thể từ điển.",
      "Xem quy tắc chia ở slide 1."),
    q(L, 2, "「美味しそうです」 — vì sao bỏ い trước khi thêm そう?",
      ["Tính từ い bỏ đuôi い trước khi ghép そう", "い là lỗi thừa cần giữ lại",
       "そう chỉ ghép được với danh từ", "Đây là cách chia sai"], 0,
      "A-そう (trông có vẻ) yêu cầu bỏ い ở cuối tính từ trước khi ghép そう: 美味しい → 美味しそう.",
      "Áp dụng quy tắc chia tính từ い + そう."),
    q(L, 3, "「いい」 (tốt) chia với そう là ngoại lệ nào?",
      ["よさそう (KHÔNG nói いいそう)", "いいそう (đúng như quy tắc thường)",
       "いそう", "よいそう"], 0,
      "いい là ngoại lệ đặc biệt: phải quay về gốc よい rồi mới bỏ い, thêm そう → よさそう.",
      "Đây là ngoại lệ tương tự đã gặp ở nhiều bài trước (phủ định, quá khứ của いい)."),
    q(L, 4, "「元気そうです」 (tính từ な 元気) chia như thế nào?",
      ["Bỏ な/だ, ghép trực tiếp そう: 元気 + そう", "Giữ nguyên 元気だ + そう",
       "Cần biến âm như tính từ い", "Không ghép được với そう"], 0,
      "Tính từ な chỉ cần bỏ な/だ rồi ghép trực tiếp そう, không có biến âm phức tạp.",
      "So sánh với cách chia tính từ い ở câu 2-3."),
    q(L, 5, "V-そう khác でしょう (N4 bài 32) ở nguồn thông tin:",
      ["V-そう dựa trên DẤU HIỆU quan sát trực tiếp ngay lúc nói; でしょう dựa trên suy luận LOGIC/lý do",
       "Hoàn toàn giống nhau", "V-そう chỉ dùng cho câu hỏi",
       "でしょう chỉ dùng cho quá khứ"], 0,
      "そう cần một dấu hiệu trực quan (nhìn thấy mây đen); でしょう chỉ cần suy luận có căn cứ logic, không nhất thiết phải quan sát trực tiếp.",
      "Xem so sánh ở slide 4."),
    q(L, 6, "「木が倒れそうです」 nghĩa là:",
      ["Cái cây có vẻ sắp đổ (dựa trên dấu hiệu quan sát được)",
       "Cái cây đã đổ rồi", "Cái cây rất chắc chắn, không đổ được",
       "Cái cây sẽ không bao giờ đổ"], 0,
      "V-そう diễn tả điều gì đó CHUẨN BỊ xảy ra, dựa trên dấu hiệu (cây nghiêng, gió mạnh...) quan sát ngay lúc nói.",
      "Áp dụng đúng nghĩa V-そう."),
    q(L, 7, "「この薬は苦そうです」 — vì sao dùng そう mà không nói thẳng 「苦いです」?",
      ["Người nói CHƯA THỬ, chỉ dựa trên ấn tượng bề ngoài (nhìn màu, hình dạng thuốc)",
       "苦いです mới đúng, そう sai", "Cả hai câu hoàn toàn giống nhau",
       "そう chỉ dùng khi đã chắc chắn 100%"], 0,
      "そう ở tính từ diễn tả ẤN TƯỢNG BỀ NGOÀI chưa kiểm chứng — khác nói thẳng tính từ khi đã CHẮC CHẮN (đã nếm/đã thử).",
      "Xem giải thích ở slide 2."),
    q(L, 8, "「子供が泣きそうです」 — そう ở đây báo hiệu điều gì?",
      ["Đứa trẻ có dấu hiệu (mặt mếu, mắt đỏ) cho thấy sắp khóc",
       "Đứa trẻ đã khóc xong rồi", "Đứa trẻ sẽ không bao giờ khóc",
       "Đứa trẻ đang cười"], 0,
      "V-そう cho hành động 泣く (khóc) diễn tả dấu hiệu SẮP xảy ra, dựa trên biểu cảm quan sát được.",
      "Áp dụng đúng nghĩa V-そう cho động từ 泣く."),
    q(L, 9, "Trong hội thoại, vì sao Santos trông buồn ngủ?",
      ["Vì hôm qua học bài mệt", "Vì thức khuya xem phim", "Vì bị ốm", "Không có lý do cụ thể"], 0,
      "Santos nói 「昨日勉強して、疲れました」.",
      "Xem câu thoại thứ 4."),
    q(L, 10, "Cuối hội thoại, vì sao hai người quyết định đổi chỗ ngồi?",
      ["Vì cái ghế đó có vẻ sắp hỏng", "Vì chỗ đó quá nóng", "Vì chỗ đó ồn ào", "Không có lý do cụ thể"], 0,
      "Santos nói 「あの椅子、壊れそうですね」 và cả hai đồng ý đổi chỗ.",
      "Xem câu thoại thứ 8-9."),
]

LESSON = lesson(
    L,
    "Bài 43: Dự đoán sắp xảy ra (V-そう) & Trông có vẻ (A-そう)",
    "Ghép そう vào gốc ます của động từ để dự đoán điều SẮP xảy ra dựa trên dấu hiệu quan sát trực "
    "tiếp, ghép vào tính từ い (bỏ い, ngoại lệ いい→よさそう) hoặc tính từ な (bỏ な/だ) để diễn "
    "tả ấn tượng bề ngoài CHƯA kiểm chứng — phân biệt với でしょう (N4 bài 32, suy luận logic qua "
    "lý do, không cần dấu hiệu trực quan).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
