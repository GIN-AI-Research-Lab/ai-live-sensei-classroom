# -*- coding: utf-8 -*-
"""N4 — Bai 45: Truong hop 場合は, tuong phan/nghich y のに.

QUAN TRONG: のに o bai nay MANG NGHIA KHAC HAN のに o bai 42 (の danh tu
hoa + に muc dich). Day la mot tro tu rieng biet nghia "mac du", trung
am voi のに kia nhung ban chat ngu phap khac nhau hoan toan.
Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 45
pool = Pool("n4")

VOCAB = [
    v(1,  "がんばります", "頑張ります", "がんばります", "ganbarimasu", "verb", "Cố gắng, nỗ lực", "頑張ったのに、失敗しました = dù đã cố gắng nhưng vẫn thất bại.", L),
    v(2,  "しっぱいします", "失敗します", "しっぱいします", "shippai shimasu", "verb", "Thất bại, mắc lỗi", "", L),
    v(3,  "ごうかくします", "合格します", "ごうかくします", "goukaku shimasu", "verb", "Đậu, đỗ (kỳ thi)", "Đã gặp bài 40.", L),
    v(4,  "でかけます", "出かけます", "でかけます", "dekakemasu", "verb", "Ra ngoài, đi ra", "地震の 場合は、外に 出かけないで ください = trong trường hợp động đất, xin đừng ra ngoài.", L),
    v(5,  "れんらくします", "連絡します", "れんらくします", "renraku shimasu", "verb", "Liên lạc", "Đã gặp bài 38.", L),
    v(6,  "ばあい", "場合", "ばあい", "baai", "noun", "Trường hợp", "〜場合は、〜: trong trường hợp ~ thì ~.", L),
    v(7,  "じしん", "地震", "じしん", "jishin", "noun", "Động đất", "地震の 場合は = trong trường hợp có động đất.", L),
    v(8,  "かじ", "火事", "かじ", "kaji", "noun", "Vụ hỏa hoạn, cháy nhà", "火事の 場合は、エレベーターを 使わないで ください = trong trường hợp cháy, xin đừng dùng thang máy.", L),
    v(9,  "たいふう", "台風", "たいふう", "taifuu", "noun", "Bão (bão nhiệt đới)", "Đã gặp N5 bài 21.", L),
    v(10, "いっしょうけんめい", "一生懸命", "いっしょうけんめい", "isshoukenmei", "adverb", "Hết mình, hết sức", "一生懸命 勉強したのに、合格しませんでした = học hành chăm chỉ hết mình nhưng vẫn không đậu.", L),
    v(11, "ざんねん", "残念", "ざんねん", "zannen", "adjective", "Đáng tiếc, tiếc nuối", "Đã gặp bài 27.", L),
    v(12, "しけん", "試験", "しけん", "shiken", "noun", "Kỳ thi", "Đã gặp bài 40.", L),
    v(13, "てんき", "天気", "てんき", "tenki", "noun", "Thời tiết", "Đã gặp N5 bài 21.", L),
    v(14, "あめ", "雨", "あめ", "ame", "noun", "Mưa", "晴れの 予報だったのに、雨が 降りました = dự báo nắng nhưng lại mưa.", L),
    v(15, "びょういん", "病院", "びょういん", "byouin", "noun", "Bệnh viện", "Đã gặp N5 bài 3.", L),
    v(16, "エレベーター", "", "", "erebeetaa", "noun", "Thang máy", "Đã gặp N5 bài 3.", L),
    v(17, "かいだん", "階段", "かいだん", "kaidan", "noun", "Cầu thang bộ", "Đã gặp N5 bài 3.", L),
    v(18, "でんわ", "電話", "でんわ", "denwa", "noun", "Điện thoại, cuộc gọi", "Đã gặp N5 bài 2.", L),
    v(19, "やくそく", "約束", "やくそく", "yakusoku", "noun", "Lời hứa, cuộc hẹn", "Đã gặp bài 38.", L),
    v(20, "しゅくだい", "宿題", "しゅくだい", "shukudai", "noun", "Bài tập về nhà", "Đã gặp N5 bài 7.", L),
]

KANJI = [
    k(1, "場", "TRƯỜNG", 12, ["ジョウ (jou)"], ["ば"], "Nơi chốn, trường hợp.",
      [("場合", "ばあい", "Trường hợp"), ("会場", "かいじょう", "Địa điểm sự kiện"), ("駐車場", "ちゅうしゃじょう", "Bãi đỗ xe")], L),
    k(2, "合", "HỢP", 6, ["ゴウ (gou)"], ["あ(う)"], "Phù hợp, gộp lại. Đã gặp N5 bài 22 (合います).",
      [("場合", "ばあい", "Trường hợp"), ("合格", "ごうかく", "Đậu (thi)"), ("合います", "あいます", "Vừa vặn")], L),
    k(3, "震", "CHẤN", 15, ["シン (shin)"], ["ふる(える)"], "Rung chuyển, chấn động.",
      [("地震", "じしん", "Động đất"), ("震えます", "ふるえます", "Run rẩy")], L),
    k(4, "失", "THẤT", 5, ["シツ (shitsu)"], ["うしな(う)"], "Mất đi, thất bại.",
      [("失敗", "しっぱい", "Thất bại"), ("失礼", "しつれい", "Thất lễ")], L),
    k(5, "敗", "BẠI", 11, ["ハイ (hai)"], ["やぶ(れる)"], "Thua, thất bại.",
      [("失敗", "しっぱい", "Thất bại"), ("敗北", "はいぼく", "Thất bại (trận đấu)")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Trường hợp: [Thể thông thường] 場合は、V",
        "V(từ điển/た)／A-い／A-な+な／N+の + 場合は、[hướng dẫn/kết quả]",
        "場合 (trường hợp) đứng sau một MỆNH ĐỀ GIẢ ĐỊNH để giới thiệu tình huống, rồi đưa ra "
        "hướng dẫn/kết quả tương ứng — trang trọng, khách quan hơn たら (N5 bài 25), thường dùng "
        "trong THÔNG BÁO, HƯỚNG DẪN AN TOÀN.",
        [
            ex(L, 1, 1, [t("t-l45s1-1", "じしん", "地震", "じしん", key=True), t("t-l45s1-2", "の", key=True),
                         t("t-l45s1-3", "ばあい", "場合", "ばあい", key=True), t("t-l45s1-4", "は", key=True),
                         t("t-l45s1-5", "、"), t("t-l45s1-6", "でかけないで", "出かけないで", "でかけないで"),
                         t("t-l45s1-7", "ください")],
               "Trong trường hợp có động đất, xin đừng ra ngoài."),
            ex(L, 1, 2, [t("t-l45s1-8", "かじ", "火事", "かじ", key=True), t("t-l45s1-9", "の", key=True),
                         t("t-l45s1-10", "ばあい", "場合", "ばあい", key=True), t("t-l45s1-11", "は", key=True),
                         t("t-l45s1-12", "、"), t("t-l45s1-13", "エレベーター"), t("t-l45s1-14", "を"),
                         t("t-l45s1-15", "つかわないで", "使わないで", "つかわないで"), t("t-l45s1-16", "ください")],
               "Trong trường hợp cháy, xin đừng dùng thang máy."),
        ],
        tips="場合は phổ biến trong biển báo tòa nhà, hướng dẫn sử dụng thiết bị — trang trọng, khách quan hơn hẳn たら thông thường.",
        culture="Hướng dẫn an toàn tại các tòa nhà Nhật (đặc biệt về động đất/hỏa hoạn) luôn dùng cấu trúc 〜場合は vì tính khách quan, rõ ràng, dễ hiểu khi khẩn cấp."),

    slide(L, 2,
        "2. Tương phản/nghịch ý: [Thể thông thường] のに、[kết quả TRÁI VỚI KỲ VỌNG]",
        "[Thể thông thường] + のに、[kết quả bất ngờ/thất vọng]",
        "のに ở đây mang nghĩa 'MẶC DÙ...NHƯNG...' — khác HOÀN TOÀN のに mục đích ở bài 42 (の+に). "
        "Luôn ẩn ý CẢM XÚC bất ngờ, thất vọng, hoặc không hài lòng về kết quả.",
        [
            ex(L, 2, 1, [t("t-l45s2-1", "いっしょうけんめい", "一生懸命", "いっしょうけんめい", key=True), t("t-l45s2-2", "べんきょう", "勉強", "べんきょう"),
                         t("t-l45s2-3", "した", "した", "した"), t("t-l45s2-4", "のに", key=True), t("t-l45s2-5", "、"),
                         t("t-l45s2-6", "しけん", "試験", "しけん"), t("t-l45s2-7", "に"), t("t-l45s2-8", "ごうかく", "合格", "ごうかく"),
                         t("t-l45s2-9", "しませんでした")],
               "Dù đã học hành chăm chỉ hết mình nhưng vẫn không đậu kỳ thi."),
            ex(L, 2, 2, [t("t-l45s2-10", "はれ", "晴れ", "はれ"), t("t-l45s2-11", "の", key=True), t("t-l45s2-12", "よほう", "予報", "よほう"),
                         t("t-l45s2-13", "だった", key=True), t("t-l45s2-14", "のに", key=True), t("t-l45s2-15", "、"),
                         t("t-l45s2-16", "あめ", "雨", "あめ"), t("t-l45s2-17", "が"), t("t-l45s2-18", "ふりました", "降りました", "ふりました")],
               "Dự báo nắng nhưng lại đổ mưa."),
        ],
        tips="のに (mặc dù) luôn hàm chứa THẤT VỌNG/BẤT NGỜ — khác hẳn ても (N5 bài 25, nhượng bộ trung tính, không nhất thiết mang cảm xúc tiêu cực).",
        culture="一生懸命勉強したのに、合格しませんでした là câu than thở rất chân thực, phổ biến của học sinh Nhật sau kỳ thi không như ý."),

    slide(L, 3,
        "3. Phân biệt hai のに (mục đích, bài 42) và (mặc dù, bài 45)",
        "のに (bài 42) = の (danh từ hóa) + に (mục đích): [Vật] は [Vる]のに 使います",
        "のに (bài 45) = trợ từ nghịch ý cố định: [Thể thông thường]のに、[kết quả bất ngờ]",
        [
            ex(L, 3, 1, [t("t-l45s3-1", "はさみ", "鋏", "はさみ"), t("t-l45s3-2", "は"), t("t-l45s3-3", "かみ", "紙", "かみ"),
                         t("t-l45s3-4", "を"), t("t-l45s3-5", "きる", "切る", "きる"), t("t-l45s3-6", "のに", key=True),
                         t("t-l45s3-7", "つかいます", "使います", "つかいます")],
               "Kéo dùng để cắt giấy. (のに MỤC ĐÍCH — bài 42, không mang cảm xúc)"),
            ex(L, 3, 2, [t("t-l45s3-8", "がんばった", "頑張った", "がんばった"), t("t-l45s3-9", "のに", key=True),
                         t("t-l45s3-10", "、"), t("t-l45s3-11", "しっぱいしました", "失敗しました", "しっぱいしました", key=True)],
               "Dù đã cố gắng nhưng vẫn thất bại. (のに MẶC DÙ — bài 45, mang cảm xúc thất vọng)"),
        ],
        tips="Cách phân biệt nhanh: のに MỤC ĐÍCH đứng sau danh từ chủ ngữ là VẬT (kéo, dụng cụ); のに MẶC DÙ đứng cuối một câu ĐẦY ĐỦ rồi mới tới kết quả trái ngược.",
        culture="Đây là một trong những cặp đồng âm dị nghĩa dễ gây nhầm lẫn nhất ở trình độ N4 — người học cần chú ý ngữ cảnh cả câu, không chỉ nhìn mặt chữ のに."),

    slide(L, 4,
        "4. So sánh のに (mặc dù) và ても (N5 bài 25)",
        "のに: kết quả THỰC TẾ đã xảy ra, mang cảm xúc bất ngờ/thất vọng　vs　ても: giả định chung, trung tính hơn",
        "ても diễn tả một quy luật/giả định CHUNG ('dù...vẫn...', không nhất thiết đã xảy ra); "
        "のに luôn nói về một SỰ VIỆC ĐÃ THỰC SỰ XẢY RA, khiến người nói ngạc nhiên/thất vọng.",
        [
            ex(L, 4, 1, [t("t-l45s4-1", "たかくても", "高くても", "たかくても", key=True), t("t-l45s4-2", "、"),
                         t("t-l45s4-3", "かいます", "買います", "かいます")],
               "Dù đắt tôi vẫn mua. (ても: giả định chung, chưa chắc đã mua)"),
            ex(L, 4, 2, [t("t-l45s4-4", "たかかった", "高かった", "たかかった", key=True), t("t-l45s4-5", "のに", key=True),
                         t("t-l45s4-6", "、"), t("t-l45s4-7", "かいました", "買いました", "かいました")],
               "Dù đắt nhưng tôi (vẫn) đã mua. (のに: sự việc ĐÃ xảy ra, có sắc thái)"),
        ],
        tips="のに thường dùng để KỂ LẠI một trải nghiệm đáng nhớ/đáng tiếc; ても hợp hơn khi nói về NGUYÊN TẮC/THÓI QUEN chung.",
        culture="Nhật ký, bài chia sẻ cảm xúc trên mạng xã hội Nhật dùng のに rất nhiều để diễn tả những khoảnh khắc 'đời không như mơ'."),
]

DIALOGUE = [
    line(L, 1, "先生", "Giáo viên",
         [t("d-l45-1", "みなさん", "皆さん", "みなさん"), t("d-l45-2", "、"), t("d-l45-3", "じしん", "地震", "じしん", key=True),
          t("d-l45-4", "の", key=True), t("d-l45-5", "ばあい", "場合", "ばあい", key=True), t("d-l45-6", "は", key=True),
          t("d-l45-7", "、"), t("d-l45-8", "かいだん", "階段", "かいだん", key=True), t("d-l45-9", "を"),
          t("d-l45-10", "つかって", "使って", "つかって"), t("d-l45-11", "ください")],
         "Các em, trong trường hợp có động đất, hãy dùng cầu thang bộ."),
    line(L, 2, "ワン", "Sinh viên",
         [t("d-l45-12", "エレベーター", "エレベーター", "エレベーター"), t("d-l45-13", "は"),
          t("d-l45-14", "つかっては", "使っては", "つかっては"), t("d-l45-15", "いけません", key=True),
          t("d-l45-16", "か")],
         "Không được dùng thang máy ạ?"),
    line(L, 3, "先生", "Giáo viên",
         [t("d-l45-17", "はい"), t("d-l45-18", "、"), t("d-l45-19", "かじ", "火事", "かじ", key=True),
          t("d-l45-20", "の", key=True), t("d-l45-21", "ばあい", "場合", "ばあい", key=True), t("d-l45-22", "も"),
          t("d-l45-23", "おなじ", "同じ", "おなじ"), t("d-l45-24", "です")],
         "Đúng, trường hợp cháy cũng vậy."),
    line(L, 4, "サントス", "Sinh viên",
         [t("d-l45-25", "せんせい", "先生", "せんせい"), t("d-l45-26", "、"), t("d-l45-27", "しけん", "試験", "しけん", key=True),
          t("d-l45-28", "は"), t("d-l45-29", "どうでしたか")],
         "Thầy ơi, kỳ thi thế nào ạ?"),
    line(L, 5, "先生", "Giáo viên",
         [t("d-l45-30", "ワンさん"), t("d-l45-31", "は"), t("d-l45-32", "いっしょうけんめい", "一生懸命", "いっしょうけんめい", key=True),
          t("d-l45-33", "べんきょう", "勉強", "べんきょう"), t("d-l45-34", "した", "した", "した"), t("d-l45-35", "のに", key=True),
          t("d-l45-36", "、"), t("d-l45-37", "ごうかく", "合格", "ごうかく"), t("d-l45-38", "しませんでした")],
         "Wang đã học hành hết sức chăm chỉ nhưng vẫn không đậu."),
    line(L, 6, "ワン", "Sinh viên",
         [t("d-l45-39", "ざんねん", "残念", "ざんねん", key=True), t("d-l45-40", "です", "です", "です")],
         "Đáng tiếc thật."),
    line(L, 7, "先生", "Giáo viên",
         [t("d-l45-41", "だいじょうぶ", "大丈夫", "だいじょうぶ"), t("d-l45-42", "です", "です", "です"), t("d-l45-43", "。"),
          t("d-l45-44", "らいげつ", "来月", "らいげつ"), t("d-l45-45", "、"), t("d-l45-46", "また"),
          t("d-l45-47", "うけられます", "受けられます", "うけられます")],
         "Không sao. Tháng sau, em thi lại được mà."),
    line(L, 8, "ワン", "Sinh viên",
         [t("d-l45-48", "はい"), t("d-l45-49", "、"), t("d-l45-50", "こんど", "今度", "こんど"), t("d-l45-51", "は"),
          t("d-l45-52", "ごうかく", "合格", "ごうかく"), t("d-l45-53", "したい", "したい", "したい"), t("d-l45-54", "です")],
         "Vâng, lần này em muốn đậu."),
    line(L, 9, "サントス", "Sinh viên",
         [t("d-l45-55", "がんばれ", "頑張れ", "がんばれ")],
         "Cố lên!"),
    line(L, 10, "ワン", "Sinh viên",
         [t("d-l45-56", "ありがとう"), t("d-l45-57", "。"), t("d-l45-58", "あめ", "雨", "あめ", key=True),
          t("d-l45-59", "の"), t("d-l45-60", "よほう", "予報", "よほう"), t("d-l45-61", "だった"),
          t("d-l45-62", "のに", key=True), t("d-l45-63", "、"), t("d-l45-64", "はれました", "晴れました", "はれました"),
          t("d-l45-65", "ね")],
         "Cảm ơn. Dự báo mưa nhưng lại nắng nhỉ."),
]

EXERCISES = [
    q(L, 1, "「地震の場合は、階段を使ってください」 — 場合は dùng để làm gì?",
      ["Giới thiệu một TÌNH HUỐNG rồi đưa ra hướng dẫn tương ứng",
       "Ra lệnh phải có động đất", "Hỏi có động đất không",
       "Phủ định việc dùng cầu thang"], 0,
      "場合は giới thiệu tình huống giả định (có động đất) rồi đưa hướng dẫn tương ứng — trang trọng, thường dùng trong biển báo/thông báo an toàn.",
      "Xem cấu trúc ở slide 1."),
    q(L, 2, "「一生懸命勉強したのに、合格しませんでした」 — のに ở đây mang nghĩa:",
      ["Mặc dù...nhưng... (kết quả trái với kỳ vọng, mang cảm xúc thất vọng)",
       "Mục đích (giống のに ở bài 42)", "Vì, bởi vì (giống ので/から)",
       "Nếu, giả sử (giống たら)"], 0,
      "のに ở bài này là trợ từ NGHỊCH Ý riêng biệt, nghĩa 'mặc dù' — khác hoàn toàn のに mục đích đã học ở bài 42.",
      "Đây là điểm dễ nhầm nhất của bài học."),
    q(L, 3, "「はさみは紙を切るのに使います」 và 「頑張ったのに、失敗しました」 — hai のに này:",
      ["Là hai cấu trúc HOÀN TOÀN KHÁC NHAU dù viết giống nhau (mục đích vs mặc dù)",
       "Là cùng một cấu trúc, nghĩa giống hệt nhau", "Câu đầu sai ngữ pháp",
       "Câu sau sai ngữ pháp"], 0,
      "Đây là cặp đồng âm dị nghĩa dễ gây nhầm lẫn nhất N4 — phân biệt bằng cấu trúc câu và ngữ cảnh, không chỉ nhìn mặt chữ.",
      "Xem so sánh trực tiếp ở slide 3."),
    q(L, 4, "のに (mặc dù) khác ても (N5 bài 25) ở chỗ:",
      ["のに nói về sự việc ĐÃ XẢY RA, mang cảm xúc; ても là giả định CHUNG, trung tính hơn",
       "Hoàn toàn giống nhau", "のに chỉ dùng cho câu hỏi",
       "ても chỉ dùng cho quá khứ"], 0,
      "のに luôn kể lại một sự việc THỰC TẾ đã xảy ra khiến người nói ngạc nhiên/thất vọng; ても là giả định/quy luật chung.",
      "Xem so sánh ở slide 4."),
    q(L, 5, "「晴れの予報だったのに、雨が降りました」 nghĩa là:",
      ["Dự báo nắng nhưng lại đổ mưa (trái với dự báo, gây bất ngờ)",
       "Dự báo mưa và đã mưa đúng như vậy", "Trời sẽ nắng vào ngày mai",
       "Không có dự báo thời tiết nào cả"], 0,
      "のに nhấn mạnh sự TRÁI NGƯỢC giữa dự báo (nắng) và thực tế (mưa) — một bất ngờ không như mong đợi.",
      "Áp dụng đúng nghĩa のに (mặc dù)."),
    q(L, 6, "Câu nào ĐÚNG khi nói 'trong trường hợp cháy, đừng dùng thang máy'?",
      ["火事の場合は、エレベーターを使わないでください", "火事のに、エレベーターを使わないでください",
       "火事ても、エレベーターを使わないでください", "火事から、エレベーターを使わないでください"], 0,
      "場合は là cấu trúc chuẩn cho hướng dẫn tình huống khẩn cấp — không dùng のに (mặc dù) hay から (lý do) ở đây.",
      "Chọn đúng cấu trúc phù hợp với ngữ cảnh thông báo an toàn."),
    q(L, 7, "残念 trong 「残念です」 có nghĩa:",
      ["Đáng tiếc, tiếc nuối", "Vui mừng", "Tức giận", "Ngạc nhiên"], 0,
      "残念 diễn tả cảm giác tiếc nuối, thường đi kèm với câu có のに để nhấn mạnh kết quả không như ý.",
      "Xem nghĩa từ vựng và ngữ cảnh sử dụng."),
    q(L, 8, "「高かったのに、買いました」 khác 「高くても、買います」 ở:",
      ["Câu đầu kể việc ĐÃ mua dù đắt (thực tế, quá khứ); câu sau là quyết tâm CHUNG (dù đắt sẽ vẫn mua)",
       "Hoàn toàn giống nhau về ý nghĩa và thì", "Câu đầu sai ngữ pháp",
       "Câu sau mới đúng"], 0,
      "のに thuật lại một hành động THỰC TẾ đã xảy ra trong quá khứ; ても diễn tả quyết tâm/nguyên tắc chung, có thể ở thì hiện tại/tương lai.",
      "So sánh trực tiếp hai câu ở slide 4."),
    q(L, 9, "Trong hội thoại, kết quả kỳ thi của Wang thế nào?",
      ["Không đậu dù đã học rất chăm chỉ", "Đậu với điểm cao", "Chưa thi", "Bỏ thi giữa chừng"], 0,
      "Giáo viên nói 「一生懸命勉強したのに、合格しませんでした」.",
      "Xem câu thoại thứ 5."),
    q(L, 10, "Cuối hội thoại, thời tiết hôm đó thế nào so với dự báo?",
      ["Dự báo mưa nhưng lại nắng", "Dự báo nắng và đúng như vậy",
       "Dự báo mưa và đúng như vậy", "Không có dự báo nào"], 0,
      "Wang nói 「雨の予報だったのに、晴れましたね」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 45: Trường hợp (〜場合は) & Mặc dù (〜のに)",
    "Giới thiệu tình huống giả định rồi đưa hướng dẫn/kết quả bằng 場合は (trang trọng, phổ biến "
    "trong thông báo an toàn), và diễn tả kết quả TRÁI VỚI KỲ VỌNG bằng のに (mặc dù — LƯU Ý: "
    "hoàn toàn khác のに mục đích ở bài 42, dù viết giống hệt) — so sánh のに với ても (N5 bài 25) "
    "để thấy rõ のに luôn kể một sự việc thực tế đã xảy ra, mang cảm xúc thất vọng/bất ngờ.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
