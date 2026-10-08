# -*- coding: utf-8 -*-
"""N4 — Bai 31: The y chi (意向形) & du dinh 〜と思っています.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 31
pool = Pool("n4")

VOCAB = [
    v(1,  "いこう", "行こう", "いこう", "ikou", "verb", "Sẽ đi, thôi đi thôi (thể ý chí của 行きます)", "行く (nhóm 1, đuôi く) → 行こう: đổi đuôi く→こう.", L),
    v(2,  "たべよう", "食べよう", "たべよう", "tabeyou", "verb", "Sẽ ăn (thể ý chí của 食べます)", "食べる (nhóm 2) → 食べよう: bỏ る, thêm よう.", L),
    v(3,  "しよう", "", "", "shiyou", "verb", "Sẽ làm (thể ý chí của します)", "する → しよう (bất quy tắc).", L),
    v(4,  "こよう", "来よう", "こよう", "koyou", "verb", "Sẽ đến (thể ý chí của 来ます)", "来る → 来よう (bất quy tắc, đọc こよう).", L),
    v(5,  "きめます", "決めます", "きめます", "kimemasu", "verb", "Quyết định", "将来を 決めます = quyết định tương lai.", L),
    v(6,  "かんがえます", "考えます", "かんがえます", "kangaemasu", "verb", "Suy nghĩ, cân nhắc", "Đã gặp N5 bài 21 — nay mở rộng dùng cùng と思っています.", L),
    v(7,  "けいかくします", "計画します", "けいかくします", "keikaku shimasu", "verb", "Lập kế hoạch", "旅行を 計画しています = đang lên kế hoạch du lịch.", L),
    v(8,  "しょうらい", "将来", "しょうらい", "shourai", "noun", "Tương lai", "将来、〜と思っています = trong tương lai, tôi định...", L),
    v(9,  "ゆめ", "夢", "ゆめ", "yume", "noun", "Giấc mơ, ước mơ", "夢を かなえたいです = tôi muốn thực hiện ước mơ.", L),
    v(10, "けいかく", "計画", "けいかく", "keikaku", "noun", "Kế hoạch", "計画を 立てます = lập kế hoạch.", L),
    v(11, "だいがく", "大学", "だいがく", "daigaku", "noun", "Trường đại học", "Đã gặp N5 bài 1.", L),
    v(12, "だいがくせい", "大学生", "だいがくせい", "daigakusei", "noun", "Sinh viên đại học", "Đã gặp bài 27.", L),
    v(13, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N5 bài 3.", L),
    v(14, "しごと", "仕事", "しごと", "shigoto", "noun", "Công việc", "Đã gặp N5 bài 9.", L),
    v(15, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "Đã gặp N5 bài 1.", L),
    v(16, "りょこう", "旅行", "りょこう", "ryokou", "noun", "Du lịch", "Đã gặp N5 bài 5.", L),
    v(17, "りゅうがく", "留学", "りゅうがく", "ryuugaku", "noun", "Du học", "留学しようと 思っています = tôi định đi du học.", L),
    v(18, "そつぎょうします", "卒業します", "そつぎょうします", "sotsugyou shimasu", "verb", "Tốt nghiệp", "大学を 卒業したら = sau khi tốt nghiệp đại học.", L),
    v(19, "はたらきます", "働きます", "はたらきます", "hatarakimasu", "verb", "Làm việc, đi làm", "Đã gặp N5 bài 4.", L),
    v(20, "がんばります", "頑張ります", "がんばります", "ganbarimasu", "verb", "Cố gắng, nỗ lực", "Đã gặp N5 bài 19.", L),
]

KANJI = [
    k(1, "将", "TƯỚNG", 10, ["ショウ (shou)"], [], "Sắp tới, tương lai.",
      [("将来", "しょうらい", "Tương lai"), ("将軍", "しょうぐん", "Tướng quân")], L),
    k(2, "夢", "MỘNG", 13, ["ム (mu)"], ["ゆめ"], "Giấc mơ, mộng tưởng.",
      [("夢", "ゆめ", "Giấc mơ"), ("夢中", "むちゅう", "Say mê"), ("初夢", "はつゆめ", "Giấc mơ đầu năm")], L),
    k(3, "計", "KẾ", 9, ["ケイ (kei)"], ["はか(る)"], "Tính toán, kế hoạch. Đã gặp N5 bài 2.",
      [("計画", "けいかく", "Kế hoạch"), ("時計", "とけい", "Đồng hồ"), ("合計", "ごうけい", "Tổng cộng")], L),
    k(4, "決", "QUYẾT", 7, ["ケツ (ketsu)"], ["き(める)"], "Quyết định.",
      [("決めます", "きめます", "Quyết định"), ("決心", "けっしん", "Quyết tâm"), ("解決", "かいけつ", "Giải quyết")], L),
    k(5, "卒", "TỐT", 8, ["ソツ (sotsu)"], [], "Hoàn tất, tốt nghiệp.",
      [("卒業", "そつぎょう", "Tốt nghiệp"), ("卒業生", "そつぎょうせい", "Học sinh tốt nghiệp")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chia thể ý chí (意向形)",
        "Nhóm 1: う→おう (行こう) 　Nhóm 2: bỏ る+よう (食べよう) 　する→しよう 　来る→来よう",
        "Thể ý chí diễn tả Ý ĐỊNH/QUYẾT TÂM của NGƯỜI NÓI — gần nghĩa với Vましょう (N5 bài 6) "
        "nhưng thân mật hơn, thường dùng khi tự nói với mình hoặc trong câu và思っています.",
        [
            ex(L, 1, 1, [t("t-l31s1-1", "いこう", "行こう", "いこう", key=True), t("t-l31s1-2", "！")],
               "Đi thôi! (thể ý chí đơn giản, thân mật)"),
            ex(L, 1, 2, [t("t-l31s1-3", "がんばろう", "頑張ろう", "がんばろう", key=True), t("t-l31s1-4", "！")],
               "Cố lên nào!"),
        ],
        tips="Thể ý chí thân mật hơn Vましょう rất nhiều — dùng với bạn thân, hoặc tự nhủ với bản thân, không dùng trực tiếp với người trên.",
        culture="頑張ろう！ là câu hô hào đồng đội rất phổ biến trong thể thao, câu lạc bộ học sinh Nhật trước một trận đấu/sự kiện."),

    slide(L, 2,
        "2. Diễn tả dự định: [Thể ý chí] と 思っています",
        "[Thể ý chí] + と + 思っています   (dự định đã có SẴN trong đầu một thời gian)",
        "Khác と思います (N5 bài 21, ý kiến/suy nghĩ TỨC THỜI), と思っています (thể ています) "
        "diễn tả một Ý ĐỊNH đã ấp ủ, cân nhắc từ trước, không phải nghĩ ra ngay lúc nói.",
        [
            ex(L, 2, 1, [t("t-l31s2-1", "らいねん", "来年", "らいねん"), t("t-l31s2-2", "、"),
                         t("t-l31s2-3", "りゅうがく", "留学", "りゅうがく", key=True), t("t-l31s2-4", "しよう", key=True),
                         t("t-l31s2-5", "と"), t("t-l31s2-6", "おもって", "思って", "おもって"),
                         t("t-l31s2-7", "います", "居ます", "います")],
               "Tôi đang định năm sau sẽ đi du học."),
            ex(L, 2, 2, [t("t-l31s2-8", "だいがく", "大学", "だいがく"), t("t-l31s2-9", "を"),
                         t("t-l31s2-10", "そつぎょう", "卒業", "そつぎょう"), t("t-l31s2-11", "したら"),
                         t("t-l31s2-12", "、"), t("t-l31s2-13", "せんせい", "先生", "せんせい"),
                         t("t-l31s2-14", "に"), t("t-l31s2-15", "なろう", "成ろう", "なろう", key=True),
                         t("t-l31s2-16", "と"), t("t-l31s2-17", "おもって", "思って", "おもって"),
                         t("t-l31s2-18", "います", "居ます", "います")],
               "Sau khi tốt nghiệp đại học, tôi định trở thành giáo viên."),
        ],
        tips="と思います (N5 b21) là ý kiến/nghĩ NGAY LÚC NÓI; と思っています là Ý ĐỊNH đã CÓ SẴN, ấp ủ từ trước — phân biệt bằng thời gian hình thành ý nghĩ.",
        culture="将来の夢は 先生に なろうと思っています là mẫu câu điển hình trong bài luận/phỏng vấn học sinh Nhật khi nói về ước mơ nghề nghiệp."),

    slide(L, 3,
        "3. Đã quyết định hẳn: [Thể từ điển/ない] ことに します",
        "[Thể từ điển] + ことに します   (QUYẾT ĐỊNH dứt khoát, khác với chỉ ĐỊNH HƯỚNG như と思っています)",
        "ことにします mạnh hơn と思っています — đây là QUYẾT ĐỊNH đã CHỐT, không còn phân vân. "
        "Danh từ hóa bằng こと (đã học N5 bài 18) ghép với します để 'biến nó thành quyết định'.",
        [
            ex(L, 3, 1, [t("t-l31s3-1", "らいげつ", "来月", "らいげつ"), t("t-l31s3-2", "、"),
                         t("t-l31s3-3", "かいしゃ", "会社", "かいしゃ"), t("t-l31s3-4", "を"),
                         t("t-l31s3-5", "やめる", "止める", "やめる"), t("t-l31s3-6", "ことに", key=True),
                         t("t-l31s3-7", "しました", key=True)],
               "Tôi đã quyết định tháng sau sẽ nghỉ việc."),
            ex(L, 3, 2, [t("t-l31s3-8", "たばこ", "煙草", "たばこ"), t("t-l31s3-9", "を"),
                         t("t-l31s3-10", "すわない", "吸わない", "すわない"), t("t-l31s3-11", "ことに", key=True),
                         t("t-l31s3-12", "しました", key=True)],
               "Tôi đã quyết định sẽ không hút thuốc nữa."),
        ],
        tips="と思っています (ý định, có thể còn thay đổi) khác hẳn mức độ dứt khoát so với ことにしました (đã CHỐT quyết định, xong rồi).",
        culture="ことにしました dùng phổ biến khi thông báo quyết định lớn (nghỉ việc, bỏ thói quen xấu) một cách chững chạc, có trách nhiệm."),

    slide(L, 4,
        "4. So sánh bốn cách nói dự định/quyết định",
        "Vましょう (rủ ai, N5 b6) / Vよう (ý chí, thân mật) / と思っています (ý định ấp ủ) / ことにします (quyết định chốt)",
        "Bốn cấu trúc theo mức độ TĂNG DẦN sự chắc chắn: rủ rê nhẹ nhàng → ý chí cá nhân → dự định "
        "đã cân nhắc → quyết định dứt khoát không đổi.",
        [
            ex(L, 4, 1, [t("t-l31s4-1", "しょうらい", "将来", "しょうらい", key=True), t("t-l31s4-2", "、"),
                         t("t-l31s4-3", "なに", "何", "なに"), t("t-l31s4-4", "を"),
                         t("t-l31s4-5", "しよう", key=True), t("t-l31s4-6", "と"),
                         t("t-l31s4-7", "かんがえて", "考えて", "かんがえて"), t("t-l31s4-8", "います", "居ます", "います"),
                         t("t-l31s4-9", "か")],
               "Trong tương lai, anh đang cân nhắc sẽ làm gì?"),
            ex(L, 4, 2, [t("t-l31s4-10", "けいかく", "計画", "けいかく", key=True), t("t-l31s4-11", "は"),
                         t("t-l31s4-12", "まだ"), t("t-l31s4-13", "きめて", "決めて", "きめて"),
                         t("t-l31s4-14", "いません")],
               "Kế hoạch thì tôi vẫn chưa quyết định."),
        ],
        tips="Khi viết CV/luận văn về ước mơ, kết hợp cả bốn cấu trúc theo trình tự sẽ tạo mạch văn tự nhiên: từ ý tưởng mơ hồ đến quyết tâm cụ thể.",
        culture="Học sinh Nhật cuối cấp thường được hỏi 将来何になろうと思っていますか trong các buổi tư vấn hướng nghiệp ở trường."),
]

DIALOGUE = [
    line(L, 1, "田中", "Sinh viên năm cuối",
         [t("d-l31-1", "ワンさん"), t("d-l31-2", "は"), t("d-l31-3", "だいがく", "大学", "だいがく", key=True),
          t("d-l31-4", "を"), t("d-l31-5", "そつぎょう", "卒業", "そつぎょう", key=True), t("d-l31-6", "したら"),
          t("d-l31-7", "、"), t("d-l31-8", "なに", "何", "なに"), t("d-l31-9", "を"), t("d-l31-10", "しよう", key=True),
          t("d-l31-11", "と"), t("d-l31-12", "おもって", "思って", "おもって"), t("d-l31-13", "います", "居ます", "います"),
          t("d-l31-14", "か")],
         "Wang à, sau khi tốt nghiệp đại học, cậu định làm gì?"),
    line(L, 2, "ワン", "Sinh viên năm cuối",
         [t("d-l31-15", "にほん", "日本", "にほん"), t("d-l31-16", "に"), t("d-l31-17", "りゅうがく", "留学", "りゅうがく", key=True),
          t("d-l31-18", "しよう", key=True), t("d-l31-19", "と"), t("d-l31-20", "おもって", "思って", "おもって"),
          t("d-l31-21", "います", "居ます", "います")],
         "Tớ định đi du học ở Nhật Bản."),
    line(L, 3, "田中", "Sinh viên năm cuối",
         [t("d-l31-22", "もう"), t("d-l31-23", "だいがく", "大学", "だいがく"), t("d-l31-24", "を"),
          t("d-l31-25", "きめました", "決めました", "きめました", key=True), t("d-l31-26", "か")],
         "Cậu đã quyết định trường đại học chưa?"),
    line(L, 4, "ワン", "Sinh viên năm cuối",
         [t("d-l31-27", "はい"), t("d-l31-28", "。"), t("d-l31-29", "とうきょう", "東京", "とうきょう"),
          t("d-l31-30", "の"), t("d-l31-31", "だいがく", "大学", "だいがく"), t("d-l31-32", "に"),
          t("d-l31-33", "いく", "行く", "いく"), t("d-l31-34", "ことに", key=True), t("d-l31-35", "しました", key=True)],
         "Rồi. Tớ đã quyết định sẽ đi trường đại học ở Tokyo."),
    line(L, 5, "田中", "Sinh viên năm cuối",
         [t("d-l31-36", "いいですね"), t("d-l31-37", "。"), t("d-l31-38", "しょうらい", "将来", "しょうらい", key=True),
          t("d-l31-39", "の"), t("d-l31-40", "ゆめ", "夢", "ゆめ", key=True), t("d-l31-41", "は"),
          t("d-l31-42", "なん", "何", "なん"), t("d-l31-43", "ですか")],
         "Hay quá. Ước mơ tương lai của cậu là gì?"),
    line(L, 6, "ワン", "Sinh viên năm cuối",
         [t("d-l31-44", "せんせい", "先生", "せんせい", key=True), t("d-l31-45", "に"), t("d-l31-46", "なろう", "成ろう", "なろう", key=True),
          t("d-l31-47", "と"), t("d-l31-48", "かんがえて", "考えて", "かんがえて"), t("d-l31-49", "います", "居ます", "います")],
         "Tớ đang cân nhắc sẽ trở thành giáo viên."),
    line(L, 7, "田中", "Sinh viên năm cuối",
         [t("d-l31-50", "けいかく", "計画", "けいかく", key=True), t("d-l31-51", "は"), t("d-l31-52", "もう"),
          t("d-l31-53", "たてました", "立てました", "たてました"), t("d-l31-54", "か")],
         "Kế hoạch cậu lập xong chưa?"),
    line(L, 8, "ワン", "Sinh viên năm cuối",
         [t("d-l31-55", "まだ"), t("d-l31-56", "です"), t("d-l31-57", "。"), t("d-l31-58", "でも"),
          t("d-l31-59", "、"), t("d-l31-60", "がんばろう", "頑張ろう", "がんばろう", key=True), t("d-l31-61", "と"),
          t("d-l31-62", "おもって", "思って", "おもって"), t("d-l31-63", "います", "居ます", "います")],
         "Vẫn chưa. Nhưng tớ đang định cố gắng hết mình."),
    line(L, 9, "田中", "Sinh viên năm cuối",
         [t("d-l31-64", "がんばって", "頑張って", "がんばって"), t("d-l31-65", "ください"), t("d-l31-66", "。"),
          t("d-l31-67", "おうえん", "応援", "おうえん"), t("d-l31-68", "して", key=True), t("d-l31-69", "います", "居ます", "います")],
         "Cố lên nhé. Tớ ủng hộ cậu đấy."),
    line(L, 10, "ワン", "Sinh viên năm cuối",
         [t("d-l31-70", "ありがとう"), t("d-l31-71", "ございます"), t("d-l31-72", "。"), t("d-l31-73", "ゆめ", "夢", "ゆめ", key=True),
          t("d-l31-74", "を"), t("d-l31-75", "かなえたい", "叶えたい", "かなえたい"), t("d-l31-76", "です")],
         "Cảm ơn cậu nhiều. Tớ muốn thực hiện ước mơ của mình."),
]

EXERCISES = [
    q(L, 1, "Thể ý chí của 行きます (nhóm 1, đuôi く) là:",
      ["行こう", "行よう", "行くう", "行いう"], 0,
      "Nhóm 1 đổi đuôi く thành こう: 行く → 行こう.",
      "Áp dụng quy tắc đổi hàng う→おう của nhóm 1."),
    q(L, 2, "Thể ý chí của 食べます (nhóm 2) là:",
      ["食べよう", "食べろう", "食べいよう", "食べるよう"], 0,
      "Nhóm 2 bỏ る, thêm よう: 食べる → 食べよう.",
      "Áp dụng quy tắc nhóm 2."),
    q(L, 3, "と思います (N5 bài 21) khác と思っています ở chỗ:",
      ["と思います là ý kiến/suy nghĩ TỨC THỜI; と思っています là dự định đã ẤP Ủ từ trước",
       "Hoàn toàn giống nhau", "と思っています chỉ dùng cho quá khứ",
       "と思います chỉ dùng cho câu hỏi"], 0,
      "Điểm khác biệt cốt lõi: thời gian hình thành ý nghĩ — tức thời (と思います) hay đã cân nhắc lâu (と思っています).",
      "Xem so sánh ở slide 2."),
    q(L, 4, "「大学を卒業したら、先生になろうと思っています」 nghĩa là:",
      ["Sau khi tốt nghiệp, tôi định trở thành giáo viên (dự định đã ấp ủ)",
       "Tôi đã là giáo viên rồi", "Tôi không muốn làm giáo viên",
       "Tôi chưa tốt nghiệp nên không thể làm giáo viên"], 0,
      "[Thể ý chí]と思っています diễn tả dự định về nghề nghiệp tương lai đã được cân nhắc.",
      "Kết hợp kiến thức たら (N5 bài 25) và と思っています."),
    q(L, 5, "「会社をやめることにしました」 khác 「会社をやめようと思っています」 ở mức độ:",
      ["ことにしました là QUYẾT ĐỊNH đã chốt; と思っています chỉ là Ý ĐỊNH, có thể còn đổi",
       "Hoàn toàn giống nhau về mức độ chắc chắn", "ことにしました là câu hỏi",
       "と思っています mạnh hơn ことにしました"], 0,
      "ことにします mạnh và dứt khoát hơn nhiều so với と思っています — đây là quyết định đã CHỐT, không còn phân vân.",
      "Xem thang mức độ ở slide 4."),
    q(L, 6, "「たばこを吸わないことにしました」 — vì sao trước ことに là 吸わない (thể ない)?",
      ["ことにします ghép được cả với thể từ điển VÀ thể ない để diễn tả quyết định KHÔNG làm gì",
       "吸わない là lỗi, phải sửa thành 吸う", "ことにします chỉ ghép được với thể ない",
       "Đây là câu sai ngữ pháp"], 0,
      "こと danh từ hóa cả động từ khẳng định lẫn phủ định — ことにします áp dụng được cho cả hai trường hợp.",
      "Xem ví dụ 2 ở slide 3."),
    q(L, 7, "Sắp xếp bốn cấu trúc theo mức độ TĂNG DẦN sự chắc chắn:",
      ["Vましょう → Vよう → と思っています → ことにします",
       "ことにします → と思っています → Vよう → Vましょう",
       "Cả bốn đều ngang mức độ chắc chắn như nhau",
       "と思っています → ことにします → Vよう → Vましょう"], 0,
      "Từ rủ rê nhẹ nhàng (ましょう), tới ý chí cá nhân (よう), tới dự định cân nhắc (と思っています), tới quyết định chốt (ことにします).",
      "Xem tổng kết ở slide 4."),
    q(L, 8, "来る (nhóm 3 bất quy tắc) chia thể ý chí là:",
      ["来よう (こよう)", "来る", "来おう", "来ろう"], 0,
      "来る chia bất quy tắc thành 来よう, đọc là こよう — khác âm gốc く hoàn toàn.",
      "Đây là động từ bất quy tắc cần học thuộc."),
    q(L, 9, "Trong hội thoại, Wang định làm gì sau khi tốt nghiệp đại học?",
      ["Đi du học ở Nhật Bản", "Đi làm ngay tại quê nhà",
       "Học tiếp lên thạc sĩ ở nước mình", "Chưa có kế hoạch gì"], 0,
      "Wang nói 「日本に留学しようと思っています」.",
      "Xem câu thoại thứ 2."),
    q(L, 10, "Ước mơ tương lai của Wang là gì?",
      ["Trở thành giáo viên", "Trở thành bác sĩ", "Trở thành kỹ sư", "Không có ước mơ cụ thể"], 0,
      "Wang trả lời 「先生になろうと考えています」.",
      "Xem câu thoại thứ 6."),
]

LESSON = lesson(
    L,
    "Bài 31: Thể ý chí (意向形) & Dự định (〜と思っています)",
    "Chia thể ý chí (nhóm 1: う→おう, nhóm 2: bỏ る+よう, bất quy tắc する→しよう/来る→来よう), "
    "phân biệt と思います (ý kiến tức thời, N5 bài 21) với と思っています (dự định đã ấp ủ), và "
    "so sánh bốn mức độ chắc chắn: Vましょう → Vよう → と思っています → ことにします (quyết định "
    "dứt khoát).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
