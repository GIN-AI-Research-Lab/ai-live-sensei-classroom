# -*- coding: utf-8 -*-
"""N4 — Bai 32: Loi khuyen ほうがいい, du doan でしょう/かもしれません.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 32
pool = Pool("n4")

VOCAB = [
    v(1,  "やめます", "止めます", "やめます", "yamemasu", "verb", "Dừng hẳn, từ bỏ (thói quen)", "Đã gặp bài 29. たばこを やめた ほうが いいです = anh nên bỏ thuốc lá.", L),
    v(2,  "ふとります", "太ります", "ふとります", "futorimasu", "verb", "Tăng cân, béo lên", "食べすぎると 太りますよ = ăn nhiều quá thì sẽ béo lên đấy.", L),
    v(3,  "やせます", "痩せます", "やせます", "yasemasu", "verb", "Giảm cân, gầy đi", "運動すれば 痩せられるでしょう = tập thể dục thì chắc sẽ giảm cân được.", L),
    v(4,  "なおします", "治します", "なおします", "naoshimasu", "verb", "Chữa trị (tha động từ)", "病気を 治します = chữa bệnh. Khác 治る (tự khỏi, N4 bài 26).", L),
    v(5,  "きをつけます", "気を付けます", "きをつけます", "ki o tsukemasu", "verb", "Cẩn thận, lưu ý", "健康に 気を付けた ほうが いいです = anh nên chú ý sức khỏe.", L),
    v(6,  "はいしゃ", "歯医者", "はいしゃ", "haisha", "noun", "Nha sĩ, phòng khám răng", "歯医者に 行った ほうが いいですよ = anh nên đi khám răng đấy.", L),
    v(7,  "いしゃ", "医者", "いしゃ", "isha", "noun", "Bác sĩ", "Đã gặp N5 bài 1.", L),
    v(8,  "びょうき", "病気", "びょうき", "byouki", "noun", "Bệnh, ốm", "Đã gặp bài 17 (N5).", L),
    v(9,  "けんこう", "健康", "けんこう", "kenkou", "adjective", "Sức khỏe, khỏe mạnh", "Tính từ な/danh từ. 健康に 悪いです = có hại cho sức khỏe.", L),
    v(10, "たいじゅう", "体重", "たいじゅう", "taijuu", "noun", "Cân nặng", "体重が 増えました = cân nặng đã tăng lên.", L),
    v(11, "しゅうかん", "習慣", "しゅうかん", "shuukan", "noun", "Thói quen", "Đã gặp bài 28.", L),
    v(12, "だいたい", "大体", "だいたい", "daitai", "adverb", "Đại khái, khoảng chừng", "だいたい わかりました = tôi hiểu đại khái rồi.", L),
    v(13, "たぶん", "多分", "たぶん", "tabun", "adverb", "Có lẽ, chắc là", "Đã gặp N5 bài 21.", L),
    v(14, "もしかしたら", "", "", "moshikashitara", "adverb", "Biết đâu, có thể là", "もしかしたら 病気かもしれません = biết đâu là bị bệnh cũng nên.", L),
    v(15, "ぜったい", "絶対", "ぜったい", "zettai", "adverb", "Tuyệt đối, chắc chắn", "絶対に 行った ほうが いいです = anh nhất định nên đi.", L),
    v(16, "ねつ", "熱", "ねつ", "netsu", "noun", "Sốt", "Đã gặp bài 26.", L),
    v(17, "くすり", "薬", "くすり", "kusuri", "noun", "Thuốc", "Đã gặp N5 bài 17.", L),
    v(18, "びょういん", "病院", "びょういん", "byouin", "noun", "Bệnh viện", "Đã gặp N5 bài 3.", L),
    v(19, "うんどう", "運動", "うんどう", "undou", "noun", "Vận động, thể dục", "Đã gặp bài 27.", L),
    v(20, "たばこ", "煙草", "たばこ", "tabako", "noun", "Thuốc lá", "Đã gặp N5 bài 3.", L),
]

KANJI = [
    k(1, "太", "THÁI", 4, ["タイ (tai)"], ["ふと(る)"], "To béo, lớn.",
      [("太ります", "ふとります", "Tăng cân"), ("太い", "ふとい", "To, mập"), ("太陽", "たいよう", "Mặt trời")], L),
    k(2, "健", "KIỆN", 11, ["ケン (ken)"], ["すこ(やか)"], "Khỏe mạnh, cường tráng.",
      [("健康", "けんこう", "Sức khỏe"), ("健康的", "けんこうてき", "Có tính lành mạnh")], L),
    k(3, "康", "KHANG", 11, ["コウ (kou)"], [], "An khang, khỏe mạnh (chỉ ghép trong 健康).",
      [("健康", "けんこう", "Sức khỏe")], L),
    k(4, "絶", "TUYỆT", 12, ["ゼツ (zetsu)"], ["た(える)"], "Tuyệt đối, đoạn tuyệt.",
      [("絶対", "ぜったい", "Tuyệt đối"), ("絶対に", "ぜったいに", "Nhất định"), ("絶望", "ぜつぼう", "Tuyệt vọng")], L),
    k(5, "重", "TRỌNG", 9, ["ジュウ (juu)"], ["おも(い)", "かさ(なる)"], "Nặng, quan trọng. Đã gặp N5 bài 24.",
      [("体重", "たいじゅう", "Cân nặng"), ("重い", "おもい", "Nặng"), ("重要", "じゅうよう", "Quan trọng")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Lời khuyên: [Thể た/ない] ほうが いいです",
        "V(た形) + ほうが いいです  (nên làm)　　V(ない形) + ほうが いいです  (không nên làm)",
        "Khuyên NÊN làm gì dùng THỂ QUÁ KHỨ (た形) dù đang nói về tương lai — đây là điểm ngữ pháp "
        "dễ nhầm nhất của cấu trúc này. Khuyên KHÔNG NÊN làm thì dùng thể ない bình thường.",
        [
            ex(L, 1, 1, [t("t-l32s1-1", "はいしゃ", "歯医者", "はいしゃ", key=True), t("t-l32s1-2", "に"),
                         t("t-l32s1-3", "いった", "行った", "いった", key=True), t("t-l32s1-4", "ほうが", key=True),
                         t("t-l32s1-5", "いいです", key=True), t("t-l32s1-6", "よ")],
               "Anh nên đi khám nha sĩ đấy. (行った: thể た, dù chưa xảy ra)"),
            ex(L, 1, 2, [t("t-l32s1-7", "たばこ", "煙草", "たばこ"), t("t-l32s1-8", "を"),
                         t("t-l32s1-9", "すわない", "吸わない", "すわない"), t("t-l32s1-10", "ほうが", key=True),
                         t("t-l32s1-11", "いいです", key=True)],
               "Anh không nên hút thuốc."),
        ],
        tips="Ghi nhớ: khuyên LÀM dùng た (hành った), khuyên KHÔNG LÀM dùng ない (吸わない) — không dùng thể từ điển cho vế khẳng định.",
        culture="よ ở cuối câu khuyên (行ったほうがいいですよ) thêm sắc thái quan tâm, nhấn mạnh — bỏ よ nghe khô khan hơn."),

    slide(L, 2,
        "2. Dự đoán có căn cứ: [Thể thông thường] でしょう",
        "[Thể thông thường] + でしょう   (đã học ở N5 bài 21, nay dùng nhiều hơn trong ngữ cảnh N4)",
        "Ôn lại và mở rộng でしょう: dự đoán dựa trên CĂN CỨ/suy luận logic, mức độ tin cậy khá cao "
        "— khác hẳn かもしれません (slide 3) chỉ là khả năng mơ hồ.",
        [
            ex(L, 2, 1, [t("t-l32s2-1", "たいじゅう", "体重", "たいじゅう", key=True), t("t-l32s2-2", "が"),
                         t("t-l32s2-3", "ふえた", "増えた", "ふえた"), t("t-l32s2-4", "から"), t("t-l32s2-5", "、"),
                         t("t-l32s2-6", "ふとった", "太った", "ふとった", key=True), t("t-l32s2-7", "でしょう", key=True)],
               "Vì cân nặng tăng lên nên chắc là đã béo lên rồi."),
        ],
        tips="でしょう thường đi kèm một LÝ DO rõ ràng (から) đứng trước — thể hiện đây là suy luận có căn cứ, không phải đoán mò.",
        culture="Bác sĩ, chuyên gia ở Nhật hay dùng でしょう khi đưa ra chẩn đoán/dự báo mang tính chuyên môn, thể hiện sự thận trọng khoa học."),

    slide(L, 3,
        "3. Khả năng mơ hồ: [Thể thông thường] かもしれません",
        "[Thể thông thường, bỏ だ nếu là danh từ/な-adj] + かもしれません",
        "かもしれません diễn tả khả năng THẤP HƠN でしょう nhiều — 'biết đâu', 'có thể là', không "
        "có căn cứ chắc chắn. Là dạng lịch sự của かもしれない.",
        [
            ex(L, 3, 1, [t("t-l32s3-1", "もしかしたら", key=True), t("t-l32s3-2", "、"),
                         t("t-l32s3-3", "びょうき", "病気", "びょうき"), t("t-l32s3-4", "かもしれません", key=True)],
               "Biết đâu là bị bệnh cũng nên."),
            ex(L, 3, 2, [t("t-l32s3-5", "あした"), t("t-l32s3-6", "は"), t("t-l32s3-7", "あめ", "雨", "あめ"),
                         t("t-l32s3-8", "かもしれません", key=True)],
               "Ngày mai có thể sẽ mưa. (không chắc chắn, chỉ là dự đoán mơ hồ)"),
        ],
        tips="Thang mức độ chắc chắn: きっと (chắc chắn, N5 b21) > たぶん…でしょう (khá chắc) > もしかしたら…かもしれません (mơ hồ nhất).",
        culture="もしかしたら thường mở đầu câu có かもしれません, giống たぶん hay mở đầu câu có でしょう — cặp phó từ đi kèm cố định."),

    slide(L, 4,
        "4. So sánh でしょう và かもしれません",
        "でしょう: MỨC ĐỘ TIN CẬY CAO (có căn cứ)　vs　かもしれません: MỨC ĐỘ TIN CẬY THẤP (chỉ là khả năng)",
        "Chọn sai giữa hai cấu trúc này khiến câu nói SAI LỆCH mức độ chắc chắn muốn truyền đạt — "
        "quan trọng khi đưa lời khuyên y tế, dự báo thời tiết, hay nhận định về ai đó.",
        [
            ex(L, 4, 1, [t("t-l32s4-1", "くすり", "薬", "くすり"), t("t-l32s4-2", "を"),
                         t("t-l32s4-3", "のんだ", "飲んだ", "のんだ"), t("t-l32s4-4", "ほうが", key=True),
                         t("t-l32s4-5", "いい", key=True), t("t-l32s4-6", "でしょう", key=True)],
               "Chắc là nên uống thuốc thì hơn. (khuyên + suy luận có căn cứ)"),
            ex(L, 4, 2, [t("t-l32s4-7", "びょういん", "病院", "びょういん"), t("t-l32s4-8", "に"),
                         t("t-l32s4-9", "いった", "行った", "いった"), t("t-l32s4-10", "ほうが", key=True),
                         t("t-l32s4-11", "いい", key=True), t("t-l32s4-12", "かもしれません", key=True)],
               "Biết đâu nên đi bệnh viện cũng nên. (khuyên nhẹ, dè dặt hơn nhiều)"),
        ],
        tips="Ghép ほうがいい với でしょう/かもしれません tạo ra lời khuyên có SẮC THÁI khác nhau: một chắc chắn hơn, một dè dặt, gợi ý nhẹ nhàng.",
        culture="Bạn bè khuyên nhau thường dùng ほうがいいかもしれません để giữ sự tế nhị, tránh áp đặt ý kiến quá mạnh."),
]

DIALOGUE = [
    line(L, 1, "山田", "Đồng nghiệp",
         [t("d-l32-1", "田中さん"), t("d-l32-2", "、"), t("d-l32-3", "かお", "顔", "かお"), t("d-l32-4", "いろ", "色", "いろ"),
          t("d-l32-5", "が"), t("d-l32-6", "わるい", "悪い", "わるい"), t("d-l32-7", "です"), t("d-l32-8", "ね")],
         "Chị Tanaka, sắc mặt chị không tốt nhỉ."),
    line(L, 2, "田中", "Nhân viên công ty",
         [t("d-l32-9", "はい"), t("d-l32-10", "、"), t("d-l32-11", "きのう", "昨日", "きのう"), t("d-l32-12", "から"),
          t("d-l32-13", "ねつ", "熱", "ねつ", key=True), t("d-l32-14", "が"), t("d-l32-15", "あるんです", key=True)],
         "Vâng, từ hôm qua tôi bị sốt."),
    line(L, 3, "山田", "Đồng nghiệp",
         [t("d-l32-16", "びょういん", "病院", "びょういん", key=True), t("d-l32-17", "に"), t("d-l32-18", "いった", "行った", "いった", key=True),
          t("d-l32-19", "ほうが", key=True), t("d-l32-20", "いいです", key=True), t("d-l32-21", "よ")],
         "Chị nên đi bệnh viện đấy."),
    line(L, 4, "田中", "Nhân viên công ty",
         [t("d-l32-22", "はい"), t("d-l32-23", "、"), t("d-l32-24", "そう"), t("d-l32-25", "します")],
         "Vâng, tôi sẽ làm vậy."),
    line(L, 5, "山田", "Đồng nghiệp",
         [t("d-l32-26", "もしかしたら", key=True), t("d-l32-27", "、"), t("d-l32-28", "かぜ", "風邪", "かぜ"),
          t("d-l32-29", "かもしれません", key=True), t("d-l32-30", "が"), t("d-l32-31", "、"), t("d-l32-32", "きをつけて", "気を付けて", "きをつけて", key=True),
          t("d-l32-33", "ください")],
         "Biết đâu chỉ là cảm cúm thôi, nhưng chị hãy giữ gìn sức khỏe nhé."),
    line(L, 6, "田中", "Nhân viên công ty",
         [t("d-l32-34", "ありがとう"), t("d-l32-35", "ございます"), t("d-l32-36", "。"), t("d-l32-37", "さいきん"),
          t("d-l32-38", "、"), t("d-l32-39", "たいじゅう", "体重", "たいじゅう", key=True), t("d-l32-40", "も"),
          t("d-l32-41", "ふえた", "増えた", "ふえた"), t("d-l32-42", "んです", key=True)],
         "Cảm ơn anh nhiều. Gần đây cân nặng tôi cũng tăng lên nữa."),
    line(L, 7, "山田", "Đồng nghiệp",
         [t("d-l32-43", "うんどう", "運動", "うんどう", key=True), t("d-l32-44", "した", "した", "した"),
          t("d-l32-45", "ほうが", key=True), t("d-l32-46", "いい", key=True), t("d-l32-47", "でしょう", key=True)],
         "Chắc là chị nên tập thể dục thì hơn."),
    line(L, 8, "田中", "Nhân viên công ty",
         [t("d-l32-48", "そうですね"), t("d-l32-49", "。"), t("d-l32-50", "でも"), t("d-l32-51", "、"),
          t("d-l32-52", "しごと", "仕事", "しごと"), t("d-l32-53", "が"), t("d-l32-54", "いそがしくて", "忙しくて", "いそがしくて"),
          t("d-l32-55", "、"), t("d-l32-56", "じかん", "時間", "じかん"), t("d-l32-57", "が"), t("d-l32-58", "ないんです", key=True)],
         "Đúng vậy nhỉ. Nhưng công việc bận quá, không có thời gian."),
    line(L, 9, "山田", "Đồng nghiệp",
         [t("d-l32-59", "だいたい", "大体", "だいたい", key=True), t("d-l32-60", "、"), t("d-l32-61", "じかん", "時間", "じかん"),
          t("d-l32-62", "を"), t("d-l32-63", "つくった", "作った", "つくった"), t("d-l32-64", "ほうが", key=True),
          t("d-l32-65", "いいです", key=True), t("d-l32-66", "よ"), t("d-l32-67", "。"), t("d-l32-68", "けんこう", "健康", "けんこう", key=True),
          t("d-l32-69", "が"), t("d-l32-70", "いちばん", "一番", "いちばん"), t("d-l32-71", "たいせつ", "大切", "たいせつ"), t("d-l32-72", "です")],
         "Nói chung là chị nên sắp xếp thời gian ra thì hơn. Sức khỏe là quan trọng nhất mà."),
    line(L, 10, "田中", "Nhân viên công ty",
         [t("d-l32-73", "そうですね"), t("d-l32-74", "。"), t("d-l32-75", "ぜったい", "絶対", "ぜったい", key=True),
          t("d-l32-76", "に"), t("d-l32-77", "うんどう", "運動", "うんどう"), t("d-l32-78", "の"), t("d-l32-79", "しゅうかん", "習慣", "しゅうかん", key=True),
          t("d-l32-80", "を"), t("d-l32-81", "つくります", "作ります", "つくります")],
         "Đúng vậy nhỉ. Tôi nhất định sẽ tạo thói quen tập thể dục."),
]

EXERCISES = [
    q(L, 1, "「病院に行ったほうがいいです」 — vì sao 行った ở thể た dù nói về tương lai?",
      ["Đây là quy tắc cố định của ほうがいい khi khuyên NÊN làm gì",
       "行った là lỗi chính tả, phải sửa thành 行く", "た chỉ dùng cho câu phủ định",
       "Câu này thực ra nói về quá khứ"], 0,
      "Khuyên LÀM một việc luôn dùng thể た (dù việc đó chưa xảy ra) — đây là điểm ngữ pháp đặc thù cần nhớ.",
      "Xem quy tắc riêng đã nêu ở slide 1."),
    q(L, 2, "「たばこを吸わないほうがいいです」 dùng thể nào của động từ?",
      ["Thể ない (phủ định)", "Thể た (quá khứ)", "Thể từ điển", "Thể ます"], 0,
      "Khuyên KHÔNG NÊN làm gì dùng thể ない bình thường — khác vế khẳng định phải dùng た.",
      "So sánh với câu khuyên khẳng định ở câu 1."),
    q(L, 3, "でしょう và かもしれません khác nhau ở mức độ:",
      ["でしょう có căn cứ, tin cậy CAO hơn; かもしれません chỉ là khả năng mơ hồ, tin cậy THẤP",
       "Hoàn toàn giống nhau về mức độ chắc chắn", "でしょう chỉ dùng cho câu hỏi",
       "かもしれません mạnh hơn でしょう"], 0,
      "でしょう thường đi kèm lý do rõ ràng (suy luận logic); かもしれません chỉ là một khả năng chưa chắc chắn.",
      "Xem thang mức độ ở slide 4."),
    q(L, 4, "「もしかしたら、病気かもしれません」 — もしかしたら có vai trò gì?",
      ["Mở đầu câu, nhấn mạnh tính KHÔNG CHẮC CHẮN của điều sắp nói",
       "Phủ định câu sau đó", "Khẳng định chắc chắn 100%",
       "Chỉ dùng trong câu hỏi"], 0,
      "もしかしたら là phó từ mở đầu thường đi kèm cố định với かもしれません, giống たぶん đi với でしょう.",
      "So sánh cặp phó từ-kết cấu tương ứng."),
    q(L, 5, "「体重が増えたから、太ったでしょう」 nghĩa là:",
      ["Vì cân nặng tăng nên (suy luận) chắc là đã béo lên rồi",
       "Cân nặng chưa tăng nên chưa béo", "Không rõ có béo lên hay không",
       "Cân nặng giảm nên gầy đi"], 0,
      "でしょう ở đây dựa trên MỘT LÝ DO cụ thể (cân nặng tăng) để đưa ra suy luận có căn cứ.",
      "Xem cấu trúc から + でしょう ở slide 2."),
    q(L, 6, "Câu nào thể hiện lời khuyên NHẸ NHÀNG, DÈ DẶT nhất?",
      ["病院に行ったほうがいいかもしれません", "病院に行ったほうがいいでしょう",
       "病院に行ったほうがいいです", "病院に絶対行ってください"], 0,
      "Ghép ほうがいい với かもしれません tạo lời khuyên nhẹ nhàng, ít áp đặt nhất trong bốn câu.",
      "So sánh mức độ áp đặt của từng cách kết hợp."),
    q(L, 7, "Muốn nói 'anh không nên hút thuốc' (lời khuyên), câu nào ĐÚNG?",
      ["煙草を吸わないほうがいいです", "煙草を吸うほうがよくないです",
       "煙草を吸ったほうがよくないです", "煙草を吸わなかったほうがいいです"], 0,
      "Khuyên KHÔNG NÊN dùng đúng công thức: V(ない形)+ほうがいいです.",
      "Áp dụng công thức đã học ở slide 1."),
    q(L, 8, "健康 trong câu 「健康が一番大切です」 đóng vai trò từ loại nào?",
      ["Danh từ (sức khỏe)", "Tính từ い", "Động từ", "Trạng từ"], 0,
      "健康 vừa là danh từ (sức khỏe) vừa có thể dùng như tính từ な (khỏe mạnh) tùy ngữ cảnh — ở đây là danh từ làm chủ ngữ.",
      "Xem ngữ cảnh câu trong hội thoại."),
    q(L, 9, "Trong hội thoại, vì sao Tanaka không có thời gian tập thể dục?",
      ["Vì công việc bận rộn", "Vì không thích thể thao", "Vì đang bị bệnh nặng", "Vì trời mưa"], 0,
      "Tanaka nói 「仕事が忙しくて、時間がないんです」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Cuối hội thoại, Tanaka quyết tâm làm gì?",
      ["Nhất định tạo thói quen tập thể dục", "Nghỉ việc để có thời gian",
       "Không làm gì cả", "Chỉ đi khám bệnh"], 0,
      "Tanaka nói 「絶対に運動の習慣を作ります」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 32: Lời khuyên (〜ほうがいい) & Dự đoán (〜でしょう / かもしれません)",
    "Khuyên NÊN làm dùng thể た+ほうがいいです (dù chưa xảy ra), khuyên KHÔNG NÊN dùng thể ない, "
    "và phân biệt hai mức độ dự đoán: でしょう (có căn cứ, tin cậy cao, thường đi với から) và "
    "かもしれません (khả năng mơ hồ, thường đi với もしかしたら) — có thể kết hợp cả hai với "
    "ほうがいい để tạo lời khuyên ở nhiều mức độ chắc chắn khác nhau.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
