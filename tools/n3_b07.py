# -*- coding: utf-8 -*-
"""N3 — Bai 7: Pham vi va gioi han を通して (suot/thong qua), にわたって (trai dai), に限って (chi rieng).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n3.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n3_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 7
pool = Pool("n3")

VOCAB = [
    v(1,  "とおして", "通して", "とおして", "tooshite", "expression", "Suốt (một khoảng thời gian), thông qua (một phương tiện)", "一年を 通して = suốt cả năm.", L),
    v(2,  "とおします", "通します", "とおします", "tooshimasu", "verb", "Cho đi qua, tiếp tục xuyên suốt", "話を 通します = truyền đạt câu chuyện.", L),
    v(3,  "わたって", "渡って", "わたって", "watatte", "expression", "Trải dài, kéo dài suốt (một phạm vi rộng)", "3年に わたって = trải dài suốt 3 năm.", L),
    v(4,  "かぎって", "限って", "かぎって", "kagitte", "expression", "Chỉ riêng, chỉ trong trường hợp (thường mang sắc thái trớ trêu)", "忙しい 時に 限って = đúng lúc bận rộn thì.", L),
    v(5,  "かぎります", "限ります", "かぎります", "kagirimasu", "verb", "Giới hạn, hạn chế", "時間を 限ります = giới hạn thời gian.", L),
    v(6,  "きかん", "期間", "きかん", "kikan", "noun", "Thời hạn, giai đoạn", "セールの 期間 = thời hạn giảm giá.", L),
    v(7,  "ぜんこく", "全国", "ぜんこく", "zenkoku", "noun", "Toàn quốc", "全国に わたって = trải dài khắp cả nước.", L),
    v(8,  "ぜんたい", "全体", "ぜんたい", "zentai", "noun", "Toàn thể, toàn bộ", "全体を 通して = xuyên suốt toàn bộ.", L),
    v(9,  "はんい", "範囲", "はんい", "han-i", "noun", "Phạm vi", "テストの 範囲 = phạm vi bài kiểm tra.", L),
    v(10, "すべて", "全て", "すべて", "subete", "adverb", "Tất cả, toàn bộ", "全て 終わりました = tất cả đã xong.", L),
    v(11, "ちいき", "地域", "ちいき", "chiiki", "noun", "Khu vực, vùng", "この 地域は = khu vực này.", L),
    v(12, "へいきん", "平均", "へいきん", "heikin", "noun", "Trung bình", "平均 気温 = nhiệt độ trung bình.", L),
    v(13, "たいかい", "大会", "たいかい", "taikai", "noun", "Đại hội, giải đấu lớn", "全国 大会 = đại hội toàn quốc.", L),
    v(14, "あめ", "雨", "あめ", "ame", "noun", "Mưa", "Đã gặp N5 bài 1.", L),
    v(15, "ともだち", "友達", "ともだち", "tomodachi", "noun", "Bạn bè", "Đã gặp N5 bài 1.", L),
    v(16, "いそがしい", "忙しい", "いそがしい", "isogashii", "adjective", "Bận rộn", "Đã gặp N4 bài 26.", L),
    v(17, "でんわ", "電話", "でんわ", "denwa", "noun", "Điện thoại", "Đã gặp N5 bài 1.", L),
    v(18, "じょうほう", "情報", "じょうほう", "jouhou", "noun", "Thông tin", "Đã gặp N4 bài 26.", L),
    v(19, "つづきます", "続きます", "つづきます", "tsuzukimasu", "verb", "Tiếp tục, kéo dài", "雨が 続きます = mưa tiếp tục kéo dài.", L),
    v(20, "おこなわれます", "行われます", "おこなわれます", "okonawaremasu", "verb", "Được tổ chức, được tiến hành", "大会が 行われます = đại hội được tổ chức.", L),
]

KANJI = [
    k(1, "限", "HẠN", 9, ["ゲン (gen)"], ["かぎ(る)"], "Giới hạn, hạn chế.",
      [("限る", "かぎる", "Giới hạn"), ("制限", "せいげん", "Hạn chế")], L),
    k(2, "通", "THÔNG", 10, ["ツウ (tsuu)"], ["とお(す)", "とお(る)"], "Thông qua, đi qua.",
      [("通す", "とおす", "Cho đi qua, tiếp tục xuyên suốt"), ("交通", "こうつう", "Giao thông")], L),
    k(3, "渡", "ĐỘ", 12, ["ト (to)"], ["わた(る)", "わた(す)"], "Vượt qua, trải qua.",
      [("渡る", "わたる", "Băng qua, trải dài"), ("渡します", "わたします", "Trao, đưa")], L),
    k(4, "域", "VỰC", 11, ["イキ (iki)"], [], "Khu vực, vùng.",
      [("地域", "ちいき", "Khu vực"), ("区域", "くいき", "Khu vực, vùng")], L),
    k(5, "囲", "VI", 7, ["イ (i)"], ["かこ(む)"], "Bao vây, phạm vi.",
      [("範囲", "はんい", "Phạm vi"), ("周囲", "しゅうい", "Xung quanh")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Suốt/thông qua: N を通して、[hành động liên tục]",
        "N(thời gian/phương tiện) + を通して、[hành động liên tục hoặc trạng thái kéo dài]",
        "を通して có hai nghĩa: (1) SUỐT một khoảng thời gian xác định (一年を通して = suốt cả "
        "năm), (2) THÔNG QUA một phương tiện/kênh trung gian (友達を通して = thông qua bạn bè).",
        [
            ex(L, 1, 1, [t("t-l7s1-1", "いちねん", "一年", "いちねん"), t("t-l7s1-2", "を"),
                         t("t-l7s1-3", "とおして", "通して", "とおして", key=True), t("t-l7s1-4", "、"),
                         t("t-l7s1-5", "あめ", "雨", "あめ", key=True), t("t-l7s1-6", "が"),
                         t("t-l7s1-7", "おおい", "多い", "おおい"), t("t-l7s1-8", "です")],
               "Suốt cả năm, mưa nhiều."),
            ex(L, 1, 2, [t("t-l7s1-9", "ともだち", "友達", "ともだち", key=True), t("t-l7s1-10", "を"),
                         t("t-l7s1-11", "とおして", "通して", "とおして", key=True), t("t-l7s1-12", "、"),
                         t("t-l7s1-13", "じょうほう", "情報", "じょうほう", key=True), t("t-l7s1-14", "を"),
                         t("t-l7s1-15", "しりました", "知りました", "しりました")],
               "Tôi biết thông tin đó thông qua bạn bè."),
        ],
        tips="Phân biệt bằng loại danh từ đứng trước を通して: danh từ THỜI GIAN → nghĩa 'suốt'; danh từ NGƯỜI/KÊNH → nghĩa 'thông qua'.",
        culture="友人を通して知り合った (quen biết thông qua bạn bè) là cách diễn đạt phổ biến khi kể về mối quan hệ tại Nhật."),

    slide(L, 2,
        "2. Trải dài trên phạm vi rộng: N にわたって、[sự việc kéo dài]",
        "N(khoảng thời gian dài/phạm vi rộng/số lần nhiều) + にわたって、[sự việc]",
        "にわたって nhấn mạnh PHẠM VI RỘNG LỚN mà sự việc trải dài qua — thường đi kèm SỐ TỪ cụ "
        "thể (3年にわたって, 5回にわたって, 全国にわたって) và mang văn phong trang trọng, báo cáo.",
        [
            ex(L, 2, 1, [t("t-l7s2-1", "この"), t("t-l7s2-2", "たいかい", "大会", "たいかい", key=True), t("t-l7s2-3", "は"),
                         t("t-l7s2-4", "ぜんこく", "全国", "ぜんこく", key=True), t("t-l7s2-5", "に", key=True),
                         t("t-l7s2-6", "わたって", "渡って", "わたって", key=True), t("t-l7s2-7", "おこなわれます", "行われます", "おこなわれます")],
               "Đại hội này được tổ chức trải dài khắp cả nước."),
            ex(L, 2, 2, [t("t-l7s2-8", "3ねんかん", "3年間", "さんねんかん"), t("t-l7s2-9", "に", key=True),
                         t("t-l7s2-10", "わたって", "渡って", "わたって", key=True), t("t-l7s2-11", "、"),
                         t("t-l7s2-12", "あめ", "雨", "あめ"), t("t-l7s2-13", "が"), t("t-l7s2-14", "つづきました", "続きました", "つづきました")],
               "Suốt 3 năm, mưa đã tiếp diễn."),
        ],
        tips="にわたって thường xuất hiện với số từ (期間/回数) — khác を通して không nhất thiết cần con số cụ thể.",
        culture="Tin tức thời tiết Nhật hay dùng: '全国にわたって雨が降るでしょう' (mưa sẽ rơi trên phạm vi toàn quốc)."),

    slide(L, 3,
        "3. Chỉ riêng trường hợp này (trớ trêu): N に限って、[điều không may]",
        "N(thời gian/đối tượng) + に限って、[điều bất ngờ/không may xảy ra]",
        "に限って diễn tả CHỈ RIÊNG trường hợp N, thường mang sắc thái TRỚ TRÊU — điều không mong "
        "muốn lại xảy ra đúng lúc/đúng đối tượng này, như một sự trùng hợp không may mắn.",
        [
            ex(L, 3, 1, [t("t-l7s3-1", "いそがしい", "忙しい", "いそがしい", key=True), t("t-l7s3-2", "とき", "時", "とき"),
                         t("t-l7s3-3", "に", key=True), t("t-l7s3-4", "かぎって", "限って", "かぎって", key=True),
                         t("t-l7s3-5", "、"), t("t-l7s3-6", "でんわ", "電話", "でんわ", key=True), t("t-l7s3-7", "が"),
                         t("t-l7s3-8", "かかって", "掛かって", "かかって"), t("t-l7s3-9", "きます", "来ます", "きます")],
               "Đúng lúc bận rộn thì điện thoại lại gọi đến."),
            ex(L, 3, 2, [t("t-l7s3-10", "たいかい", "大会", "たいかい"), t("t-l7s3-11", "の"), t("t-l7s3-12", "ひ", "日", "ひ"),
                         t("t-l7s3-13", "に", key=True), t("t-l7s3-14", "かぎって", "限って", "かぎって", key=True),
                         t("t-l7s3-15", "、"), t("t-l7s3-16", "あめ", "雨", "あめ", key=True), t("t-l7s3-17", "が"),
                         t("t-l7s3-18", "ふりました", "降りました", "ふりました")],
               "Đúng vào ngày diễn ra đại hội thì trời lại mưa."),
        ],
        tips="に限って khác với 限る thông thường (giới hạn khách quan) — に限って luôn kèm cảm xúc bất ngờ/khó chịu của người nói.",
        culture="Câu cảm thán quen thuộc của người Nhật: '今日に限って傘を忘れた' (đúng hôm nay lại quên mang ô)."),

    slide(L, 4,
        "4. So sánh を通して, にわたって, に限って",
        "を通して: suốt/qua một MỐC　vs　にわたって: trải rộng một PHẠM VI LỚN　vs　に限って: CHỈ RIÊNG một trường hợp (trớ trêu)",
        "Ba cấu trúc dễ nhầm vì đều đi với に/を + danh từ chỉ thời gian/phạm vi, nhưng mục đích "
        "khác nhau: を通して mô tả khung thời gian/phương tiện; にわたって nhấn ĐỘ RỘNG/DÀI của sự "
        "việc; に限って nhấn TÍNH TRỚ TRÊU của việc chỉ xảy ra ở một trường hợp cụ thể.",
        [
            ex(L, 4, 1, [t("t-l7s4-1", "はんい", "範囲", "はんい", key=True), t("t-l7s4-2", "は"),
                         t("t-l7s4-3", "ぜんたい", "全体", "ぜんたい", key=True), t("t-l7s4-4", "を"),
                         t("t-l7s4-5", "とおして", "通して", "とおして", key=True), t("t-l7s4-6", "、"),
                         t("t-l7s4-7", "すべて", "全て", "すべて", key=True), t("t-l7s4-8", "の"),
                         t("t-l7s4-9", "ちいき", "地域", "ちいき", key=True), t("t-l7s4-10", "を"),
                         t("t-l7s4-11", "ふくみます", "含みます", "ふくみます")],
               "Phạm vi bao gồm tất cả các khu vực, xuyên suốt toàn bộ."),
            ex(L, 4, 2, [t("t-l7s4-12", "きかん", "期間", "きかん", key=True), t("t-l7s4-13", "の"),
                         t("t-l7s4-14", "へいきん", "平均", "へいきん", key=True), t("t-l7s4-15", "きおん", "気温", "きおん"),
                         t("t-l7s4-16", "は"), t("t-l7s4-17", "20ど", "20度", "にじゅうど")],
               "Nhiệt độ trung bình trong thời hạn này là 20 độ."),
        ],
        tips="Mẹo ghi nhớ: を通して = 'suốt/qua', にわたって = 'trải dài', に限って = 'chỉ riêng (trớ trêu)'.",
        culture="Cả ba cấu trúc đều là ngữ pháp cấp N3 thường xuất hiện trong đề đọc hiểu và phần văn phạm của kỳ thi JLPT."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d7-1", "こんど", "今度", "こんど"), t("d7-2", "の"), t("d7-3", "たいかい", "大会", "たいかい", key=True),
          t("d7-4", "は"), t("d7-5", "いつ"), t("d7-6", "おこなわれます", "行われます", "おこなわれます", key=True), t("d7-7", "か")],
         "Đại hội lần này được tổ chức khi nào?"),
    line(L, 2, "サントス", "Đồng nghiệp",
         [t("d7-8", "らいしゅう", "来週", "らいしゅう"), t("d7-9", "、"), t("d7-10", "ぜんこく", "全国", "ぜんこく", key=True),
          t("d7-11", "に", key=True), t("d7-12", "わたって", "渡って", "わたって", key=True), t("d7-13", "おこなわれます", "行われます", "おこなわれます")],
         "Tuần sau, sẽ được tổ chức trải dài khắp cả nước."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d7-14", "きかん", "期間", "きかん", key=True), t("d7-15", "は"), t("d7-16", "どのくらい"),
          t("d7-17", "です", "です", "です"), t("d7-18", "か")],
         "Thời hạn khoảng bao lâu?"),
    line(L, 4, "サントス", "Đồng nghiệp",
         [t("d7-19", "3にちかん", "3日間", "みっかかん"), t("d7-20", "に", key=True), t("d7-21", "わたって", "渡って", "わたって", key=True),
          t("d7-22", "つづきます", "続きます", "つづきます", key=True)],
         "Sẽ tiếp diễn suốt 3 ngày."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d7-23", "その"), t("d7-24", "じょうほう", "情報", "じょうほう", key=True), t("d7-25", "は"),
          t("d7-26", "どこで"), t("d7-27", "しりました", "知りました", "しりました"), t("d7-28", "か")],
         "Anh biết thông tin đó ở đâu vậy?"),
    line(L, 6, "サントス", "Đồng nghiệp",
         [t("d7-29", "ともだち", "友達", "ともだち", key=True), t("d7-30", "を"), t("d7-31", "とおして", "通して", "とおして", key=True),
          t("d7-32", "しりました", "知りました", "しりました")],
         "Tôi biết thông qua bạn bè."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d7-33", "いそがしい", "忙しい", "いそがしい", key=True), t("d7-34", "とき", "時", "とき"), t("d7-35", "に", key=True),
          t("d7-36", "かぎって", "限って", "かぎって", key=True), t("d7-37", "、"), t("d7-38", "でんわ", "電話", "でんわ", key=True),
          t("d7-39", "が"), t("d7-40", "かかって", "掛かって", "かかって"), t("d7-41", "きます", "来ます", "きます"), t("d7-42", "ね")],
         "Đúng lúc bận rộn thì điện thoại lại gọi đến nhỉ."),
    line(L, 8, "サントス", "Đồng nghiệp",
         [t("d7-43", "そうです", "そうです", "そうです"), t("d7-44", "ね"), t("d7-45", "。"), t("d7-46", "たいかい", "大会", "たいかい"),
          t("d7-47", "の"), t("d7-48", "ひ", "日", "ひ"), t("d7-49", "に", key=True), t("d7-50", "かぎって", "限って", "かぎって", key=True),
          t("d7-51", "、"), t("d7-52", "あめ", "雨", "あめ", key=True), t("d7-53", "が"), t("d7-54", "ふります", "降ります", "ふります")],
         "Đúng vậy. Đúng vào ngày đại hội thì trời lại mưa."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d7-55", "へいきん", "平均", "へいきん", key=True), t("d7-56", "きおん", "気温", "きおん"), t("d7-57", "は"),
          t("d7-58", "なんど", "何度", "なんど"), t("d7-59", "です", "です", "です"), t("d7-60", "か")],
         "Nhiệt độ trung bình là bao nhiêu độ?"),
    line(L, 10, "サントス", "Đồng nghiệp",
         [t("d7-61", "この"), t("d7-62", "ちいき", "地域", "ちいき", key=True), t("d7-63", "は"),
          t("d7-64", "いちねん", "一年", "いちねん"), t("d7-65", "を"), t("d7-66", "とおして", "通して", "とおして", key=True),
          t("d7-67", "20ど", "20度", "にじゅうど"), t("d7-68", "ぐらい", "ぐらい", "ぐらい"), t("d7-69", "です")],
         "Khu vực này quanh năm khoảng 20 độ."),
]

EXERCISES = [
    q(L, 1, "「一年を通して、雨が多いです」 — を通して ở đây nghĩa là:",
      ["Suốt một khoảng thời gian xác định (cả năm)", "Thông qua một người trung gian",
       "So sánh với năm khác", "Phủ định việc mưa nhiều"], 0,
      "Khi danh từ trước を通して là thời gian (一年), nghĩa là 'suốt khoảng thời gian đó'.",
      "Xem nghĩa thứ nhất của を通して ở slide 1."),
    q(L, 2, "「友達を通して、情報を知りました」 — を通して ở đây nghĩa là:",
      ["Thông qua một người/kênh trung gian (bạn bè)", "Suốt một khoảng thời gian",
       "Giới hạn thông tin", "Phủ định việc biết thông tin"], 0,
      "Khi danh từ trước を通して là người (友達), nghĩa là 'thông qua người đó'.",
      "Xem nghĩa thứ hai của を通して ở slide 1."),
    q(L, 3, "「この大会は全国にわたって行われます」 — にわたって nhấn mạnh điều gì?",
      ["Phạm vi rộng lớn (khắp cả nước) mà sự việc trải dài qua",
       "Chỉ riêng một khu vực nhỏ", "Thời gian ngắn", "Phủ định việc tổ chức"], 0,
      "にわたって nhấn PHẠM VI RỘNG mà sự việc trải dài qua, ở đây là 全国 (toàn quốc).",
      "Xem cấu trúc NにわたってN ở slide 2."),
    q(L, 4, "にわたって thường đi kèm với loại từ nào?",
      ["Số từ cụ thể (thời gian, số lần, phạm vi) như 3年に, 5回に",
       "Chỉ đi với tính từ", "Chỉ đi với động từ phủ định", "Không đi kèm với từ nào cả"], 0,
      "にわたって thường xuất hiện cùng số từ cụ thể: 3年にわたって, 5回にわたって, 全国にわたって.",
      "Xem ghi chú ngữ pháp ở slide 2."),
    q(L, 5, "「忙しい時に限って、電話がかかってきます」 mang sắc thái gì?",
      ["Trớ trêu — điều không may xảy ra đúng lúc bận rộn",
       "Vui mừng vì có điện thoại", "Bình thường, không có sắc thái đặc biệt",
       "Yêu cầu ai đó gọi điện"], 0,
      "に限って luôn mang sắc thái TRỚ TRÊU — điều không mong muốn xảy ra đúng lúc/đúng trường hợp này.",
      "Xem giải thích に限って ở slide 3."),
    q(L, 6, "Điểm khác biệt cốt lõi giữa にわたって và に限って là gì?",
      ["にわたって nhấn PHẠM VI RỘNG kéo dài; に限って nhấn CHỈ RIÊNG một trường hợp (trớ trêu)",
       "Hoàn toàn giống nhau", "にわたって chỉ dùng cho phủ định",
       "に限って chỉ dùng cho câu hỏi"], 0,
      "にわたって nói về ĐỘ RỘNG/DÀI của sự việc; に限って nói về TÍNH GIỚI HẠN, chỉ đúng một trường hợp cụ thể.",
      "Xem bảng so sánh ở slide 4."),
    q(L, 7, "「大会の日に限って、雨が降りました」 nghĩa là:",
      ["Đúng vào ngày diễn ra đại hội (trớ trêu thay) thì trời lại mưa",
       "Ngày đại hội trời luôn nắng đẹp", "Đại hội bị hoãn vì mưa",
       "Mưa chỉ rơi ở khu vực đại hội"], 0,
      "に限って ở đây diễn tả sự trớ trêu: đúng ngày quan trọng (đại hội) thì trời lại mưa.",
      "Áp dụng nghĩa trớ trêu của に限って."),
    q(L, 8, "Santos biết thông tin về đại hội qua đâu?",
      ["Thông qua bạn bè (友達を通して)", "Qua báo chí", "Qua ti vi", "Không biết được thông tin đó"], 0,
      "Santos trả lời 「友達を通して知りました」.",
      "Xem câu thoại thứ 6."),
    q(L, 9, "Đại hội sẽ tiếp diễn trong bao lâu theo hội thoại?",
      ["Suốt 3 ngày (3日間にわたって)", "Suốt 1 tuần", "Chỉ trong 1 ngày", "Không được đề cập"], 0,
      "Santos trả lời 「3日間にわたって続きます」.",
      "Xem câu thoại thứ 4."),
    q(L, 10, "Nhiệt độ trung bình quanh năm ở khu vực trong hội thoại là bao nhiêu?",
      ["Khoảng 20 độ", "Khoảng 30 độ", "Khoảng 10 độ", "Không được đề cập"], 0,
      "Santos trả lời 「この地域は一年を通して20度ぐらいです」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 7: Phạm vi & Giới hạn (を通して & にわたって & に限って)",
    "を通して diễn tả SUỐT một khoảng thời gian hoặc THÔNG QUA một phương tiện/kênh trung gian; "
    "にわたって nhấn PHẠM VI RỘNG LỚN mà sự việc trải dài qua (thường kèm số từ cụ thể); に限って "
    "diễn tả CHỈ RIÊNG một trường hợp, thường mang sắc thái trớ trêu khi điều không may xảy ra đúng lúc.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
