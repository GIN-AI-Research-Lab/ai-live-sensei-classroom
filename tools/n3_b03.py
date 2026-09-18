# -*- coding: utf-8 -*-
"""N3 — Bai 3: Quy dinh ことになっている, quyet dinh chot ことにする
(on lai va doi lap voi ことにしました da hoc N4 bai 31).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n3.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n3_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 3
pool = Pool("n3")

VOCAB = [
    v(1,  "きまります", "決まります", "きまります", "kimarimasu", "verb", "Được quyết định, được ấn định (tự động từ)", "Đã gặp N4 bài 28. 規則で 決まっています = được quy định bởi nội quy.", L),
    v(2,  "きめます", "決めます", "きめます", "kimemasu", "verb", "Quyết định (tha động từ)", "Đã gặp N4 bài 31.", L),
    v(3,  "まもります", "守ります", "まもります", "mamorimasu", "verb", "Tuân thủ, giữ gìn", "規則を 守ります = tuân thủ quy định.", L),
    v(4,  "きんしします", "禁止します", "きんしします", "kinshi shimasu", "verb", "Cấm chỉ", "この 部屋では 撮影が 禁止されています = phòng này cấm chụp ảnh.", L),
    v(5,  "けっしんします", "決心します", "けっしんします", "kesshin shimasu", "verb", "Quyết tâm", "留学する ことに 決心しました = tôi đã quyết tâm đi du học.", L),
    v(6,  "そつぎょうします", "卒業します", "そつぎょうします", "sotsugyou shimasu", "verb", "Tốt nghiệp", "Đã gặp N4 bài 31.", L),
    v(7,  "きそく", "規則", "きそく", "kisoku", "noun", "Quy tắc, nội quy", "Đã gặp N4 bài 28.", L),
    v(8,  "きまり", "決まり", "きまり", "kimari", "noun", "Quy định, lệ thường", "会社の 決まりです = đây là quy định của công ty.", L),
    v(9,  "ぎむ", "義務", "ぎむ", "gimu", "noun", "Nghĩa vụ, trách nhiệm", "参加は 義務では ありません = tham gia không phải là nghĩa vụ.", L),
    v(10, "けっしん", "決心", "けっしん", "kesshin", "noun", "Quyết tâm", "決心が つきました = tôi đã có quyết tâm rồi.", L),
    v(11, "だいがく", "大学", "だいがく", "daigaku", "noun", "Trường đại học", "Đã gặp N5 bài 1.", L),
    v(12, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N5 bài 3.", L),
    v(13, "きてい", "規定", "きてい", "kitei", "noun", "Quy định (chính thức, văn bản)", "会社の 規定に よると = theo quy định của công ty thì.", L),
    v(14, "しゃいん", "社員", "しゃいん", "shain", "noun", "Nhân viên công ty", "Đã gặp N5 bài 1.", L),
    v(15, "がくせい", "学生", "がくせい", "gakusei", "noun", "Học sinh, sinh viên", "Đã gặp N5 bài 1.", L),
    v(16, "せいふく", "制服", "せいふく", "seifuku", "noun", "Đồng phục", "学校では 制服を 着る ことに なっています = ở trường quy định phải mặc đồng phục.", L),
    v(17, "かいぎ", "会議", "かいぎ", "kaigi", "noun", "Cuộc họp", "Đã gặp N5 bài 7.", L),
    v(18, "まいしゅう", "毎週", "まいしゅう", "maishuu", "adverb", "Mỗi tuần", "毎週 月曜日に 会議を する ことに なっています = quy định mỗi thứ Hai họp.", L),
    v(19, "りゅうがく", "留学", "りゅうがく", "ryuugaku", "noun", "Du học", "Đã gặp N5 bài 21.", L),
    v(20, "たいしょく", "退職", "たいしょく", "taishoku", "noun", "Nghỉ hưu, thôi việc", "会社を 退職する ことに しました = tôi đã quyết định thôi việc ở công ty.", L),
]

KANJI = [
    k(1, "守", "THỦ", 6, ["シュ (shu)"], ["まも(る)"], "Giữ gìn, bảo vệ, tuân thủ.",
      [("守ります", "まもります", "Tuân thủ"), ("留守", "るす", "Vắng nhà")], L),
    k(2, "義", "NGHĨA", 13, ["ギ (gi)"], [], "Đạo nghĩa, nghĩa vụ.",
      [("義務", "ぎむ", "Nghĩa vụ"), ("意義", "いぎ", "Ý nghĩa")], L),
    k(3, "務", "VỤ", 11, ["ム (mu)"], ["つと(める)"], "Nhiệm vụ, công việc.",
      [("義務", "ぎむ", "Nghĩa vụ"), ("務めます", "つとめます", "Đảm nhận (chức vụ)")], L),
    k(4, "決", "QUYẾT", 7, ["ケツ (ketsu)"], ["き(める)"], "Quyết định. Đã gặp N4 bài 31.",
      [("決心", "けっしん", "Quyết tâm"), ("決めます", "きめます", "Quyết định")], L),
    k(5, "制", "CHẾ", 8, ["セイ (sei)"], [], "Chế độ, quy chế.",
      [("制服", "せいふく", "Đồng phục"), ("制度", "せいど", "Chế độ")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Quy định có sẵn: [Thể từ điển/ない] ことに なっている",
        "V(từ điển/ない) + ことに なっている  (quy tắc/thông lệ ĐÃ TỒN TẠI SẴN, không phải do người nói tự đặt ra)",
        "ことになっている diễn tả một QUY ĐỊNH/THÔNG LỆ đã được thiết lập từ trước (luật, nội quy, "
        "phong tục) — khác hẳn ことにする (slide 2) là QUYẾT ĐỊNH CÁ NHÂN của người nói.",
        [
            ex(L, 1, 1, [t("t-l3s1-1", "がっこう", "学校", "がっこう"), t("t-l3s1-2", "では"),
                         t("t-l3s1-3", "せいふく", "制服", "せいふく", key=True), t("t-l3s1-4", "を"),
                         t("t-l3s1-5", "きる", "着る", "きる"), t("t-l3s1-6", "ことに", key=True),
                         t("t-l3s1-7", "なっています", key=True)],
               "Ở trường quy định phải mặc đồng phục."),
            ex(L, 1, 2, [t("t-l3s1-8", "まいしゅう", "毎週", "まいしゅう", key=True), t("t-l3s1-9", "げつようび", "月曜日", "げつようび"),
                         t("t-l3s1-10", "に"), t("t-l3s1-11", "かいぎ", "会議", "かいぎ", key=True), t("t-l3s1-12", "を"),
                         t("t-l3s1-13", "する", key=True), t("t-l3s1-14", "ことに", key=True), t("t-l3s1-15", "なっています", key=True)],
               "Theo quy định, mỗi thứ Hai có cuộc họp."),
        ],
        tips="ことになっている luôn hàm ý QUY TẮC KHÁCH QUAN, có sẵn từ trước — không phải người nói vừa quyết định. Kiểm tra: 'ai đặt ra quy tắc này' — nếu là tổ chức/pháp luật thì dùng cấu trúc này.",
        culture="学校では制服を着ることになっています phản ánh văn hóa đồng phục học đường rất phổ biến và nghiêm ngặt ở Nhật Bản."),

    slide(L, 2,
        "2. Ôn lại quyết định cá nhân: [Thể từ điển/ない] ことに する (N4 bài 31)",
        "V(từ điển/ない) + ことに する/した/しました  (QUYẾT ĐỊNH CỦA CHÍNH NGƯỜI NÓI, đã học N4 bài 31)",
        "So sánh trực tiếp với slide 1: ことにする là quyết định CÁ NHÂN, có thể thay đổi; "
        "ことになっている là quy định KHÁCH QUAN, không phải do một cá nhân tự đặt ra.",
        [
            ex(L, 2, 1, [t("t-l3s2-1", "かいしゃ", "会社", "かいしゃ", key=True), t("t-l3s2-2", "を"),
                         t("t-l3s2-3", "たいしょく", "退職", "たいしょく", key=True), t("t-l3s2-4", "する", key=True),
                         t("t-l3s2-5", "ことに", key=True), t("t-l3s2-6", "しました", key=True)],
               "Tôi đã quyết định thôi việc ở công ty. (QUYẾT ĐỊNH CÁ NHÂN — ôn N4 bài 31)"),
            ex(L, 2, 2, [t("t-l3s2-7", "りゅうがく", "留学", "りゅうがく", key=True), t("t-l3s2-8", "する", key=True),
                         t("t-l3s2-9", "ことに", key=True), t("t-l3s2-10", "けっしん", "決心", "けっしん", key=True),
                         t("t-l3s2-11", "しました", key=True)],
               "Tôi đã quyết tâm đi du học. (けっしんする nhấn mạnh hơn しました đơn thuần)"),
        ],
        tips="ことにしました có thể thay đổi ý định sau này; ことになっています mang tính RÀNG BUỘC hơn — vi phạm quy định có hậu quả, thay đổi quyết định cá nhân thì không.",
        culture="留学することに決心しました là câu thể hiện QUYẾT TÂM mạnh mẽ hơn nhiều so với chỉ nói 留学することにしました đơn thuần."),

    slide(L, 3,
        "3. Phân biệt chủ thể: TỔ CHỨC/QUY LUẬT vs CÁ NHÂN",
        "ことになっている: 学校が決めた、社会の習慣　vs　ことにする: 私が決めた",
        "Câu hỏi kiểm tra nhanh: 'AI là người đưa ra quyết định này?' — nếu là một CƠ QUAN/TỔ "
        "CHỨC/PHONG TỤC thì dùng ことになっている; nếu là CHÍNH BẢN THÂN người nói thì dùng ことにする.",
        [
            ex(L, 3, 1, [t("t-l3s3-1", "この"), t("t-l3s3-2", "きそく", "規則", "きそく", key=True), t("t-l3s3-3", "は"),
                         t("t-l3s3-4", "だれ", "誰", "だれ"), t("t-l3s3-5", "が"), t("t-l3s3-6", "きめました", "決めました", "きめました"),
                         t("t-l3s3-7", "か")],
               "Quy định này là do ai quyết định vậy?"),
            ex(L, 3, 2, [t("t-l3s3-8", "かいしゃ", "会社", "かいしゃ"), t("t-l3s3-9", "の"),
                         t("t-l3s3-10", "きてい", "規定", "きてい", key=True), t("t-l3s3-11", "で"),
                         t("t-l3s3-12", "きまっています", "決まっています", "きまっています", key=True)],
               "Được quy định bởi nội quy công ty."),
        ],
        tips="規則で決まっています (bị động, N4 bài 37) và ことになっています gần nghĩa nhau — cả hai đều nhấn tính KHÁCH QUAN, không phải ý muốn cá nhân.",
        culture="Khi bị hỏi lý do một quy tắc khó chịu, người Nhật hay đáp 「規則で決まっているので」 để tránh trách nhiệm cá nhân, giữ hòa khí."),

    slide(L, 4,
        "4. Phủ định của ことになっている",
        "V(ない形) + ことに なっている  (quy định là KHÔNG được làm gì)",
        "Ghép thể ない vào trước ことになっている để diễn tả quy định CẤM, khác hẳn 禁止されています "
        "(bị động, trang trọng hơn, thường dùng trong văn bản chính thức).",
        [
            ex(L, 4, 1, [t("t-l3s4-1", "かいぎしつ", "会議室", "かいぎしつ"), t("t-l3s4-2", "では"),
                         t("t-l3s4-3", "たばこ", "煙草", "たばこ"), t("t-l3s4-4", "を"),
                         t("t-l3s4-5", "すわない", "吸わない", "すわない"), t("t-l3s4-6", "ことに", key=True),
                         t("t-l3s4-7", "なっています", key=True)],
               "Ở phòng họp quy định là không được hút thuốc."),
            ex(L, 4, 2, [t("t-l3s4-8", "がくせい", "学生", "がくせい"), t("t-l3s4-9", "は"),
                         t("t-l3s4-10", "しけん", "試験", "しけん"), t("t-l3s4-11", "ちゅう", "中", "ちゅう"),
                         t("t-l3s4-12", "スマホ"), t("t-l3s4-13", "を"), t("t-l3s4-14", "つかわない", "使わない", "つかわない"),
                         t("t-l3s4-15", "ことに", key=True), t("t-l3s4-16", "なっています", key=True)],
               "Quy định học sinh không được dùng điện thoại trong lúc thi."),
        ],
        tips="ことになっていません (phủ định cả cụm) khác hẳn ないことになっています (phủ định động từ) — luôn phủ định ĐỘNG TỪ, không phủ định なっています.",
        culture="試験中スマホを使わないことになっています là quy định phổ biến tại mọi kỳ thi ở Nhật, được nhắc đi nhắc lại trước giờ thi."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d3-1", "この"), t("d3-2", "だいがく", "大学", "だいがく", key=True), t("d3-3", "では"),
          t("d3-4", "せいふく", "制服", "せいふく", key=True), t("d3-5", "を"), t("d3-6", "きる", "着る", "きる"),
          t("d3-7", "ことに", key=True), t("d3-8", "なっています", key=True), t("d3-9", "か")],
         "Trường đại học này có quy định phải mặc đồng phục không?"),
    line(L, 2, "サントス", "Sinh viên",
         [t("d3-10", "いいえ"), t("d3-11", "、"), t("d3-12", "だいがく", "大学", "だいがく"), t("d3-13", "では"),
          t("d3-14", "せいふく", "制服", "せいふく"), t("d3-15", "は"), t("d3-16", "ぎむ", "義務", "ぎむ", key=True),
          t("d3-17", "では", "では", "では"), t("d3-18", "ありません", "有りません", "ありません")],
         "Không, ở đại học đồng phục không phải là nghĩa vụ."),
    line(L, 3, "ワン", "Sinh viên",
         [t("d3-19", "そうですか"), t("d3-20", "。"), t("d3-21", "かいぎ", "会議", "かいぎ", key=True), t("d3-22", "は"),
          t("d3-23", "まいしゅう", "毎週", "まいしゅう", key=True), t("d3-24", "ありますか")],
         "Vậy à. Cuộc họp có mỗi tuần không?"),
    line(L, 4, "サントス", "Sinh viên",
         [t("d3-25", "はい"), t("d3-26", "、"), t("d3-27", "まいしゅう", "毎週", "まいしゅう"), t("d3-28", "げつようび", "月曜日", "げつようび"),
          t("d3-29", "に"), t("d3-30", "する", key=True), t("d3-31", "ことに", key=True), t("d3-32", "なっています", key=True)],
         "Vâng, quy định là mỗi thứ Hai đều họp."),
    line(L, 5, "ワン", "Sinh viên",
         [t("d3-33", "だれ", "誰", "だれ"), t("d3-34", "が"), t("d3-35", "きめました", "決めました", "きめました"),
          t("d3-36", "か")],
         "Do ai quyết định vậy?"),
    line(L, 6, "サントス", "Sinh viên",
         [t("d3-37", "だいがく", "大学", "だいがく"), t("d3-38", "の"), t("d3-39", "きてい", "規定", "きてい", key=True),
          t("d3-40", "で"), t("d3-41", "きまっています", "決まっています", "きまっています", key=True)],
         "Được quy định bởi nội quy của trường."),
    line(L, 7, "ワン", "Sinh viên",
         [t("d3-42", "ところで"), t("d3-43", "、"), t("d3-44", "サントスさん"), t("d3-45", "は"),
          t("d3-46", "そつぎょう", "卒業", "そつぎょう"), t("d3-47", "したら"), t("d3-48", "、"),
          t("d3-49", "なに", "何", "なに"), t("d3-50", "を"), t("d3-51", "しますか")],
         "À mà, sau khi tốt nghiệp cậu định làm gì?"),
    line(L, 8, "サントス", "Sinh viên",
         [t("d3-52", "りゅうがく", "留学", "りゅうがく", key=True), t("d3-53", "する", key=True), t("d3-54", "ことに", key=True),
          t("d3-55", "けっしん", "決心", "けっしん", key=True), t("d3-56", "しました", key=True)],
         "Tớ đã quyết tâm đi du học."),
    line(L, 9, "ワン", "Sinh viên",
         [t("d3-57", "すごい"), t("d3-58", "ですね"), t("d3-59", "。"), t("d3-60", "きそく", "規則", "きそく", key=True),
          t("d3-61", "を"), t("d3-62", "まもって", "守って", "まもって", key=True), t("d3-63", "、"),
          t("d3-64", "がんばって", "頑張って", "がんばって"), t("d3-65", "ください")],
         "Giỏi thật đấy. Nhớ tuân thủ quy định và cố gắng nhé."),
    line(L, 10, "サントス", "Sinh viên",
         [t("d3-66", "ありがとう"), t("d3-67", "ございます"), t("d3-68", "。"), t("d3-69", "がんばります", "頑張ります", "がんばります")],
         "Cảm ơn cậu. Tớ sẽ cố gắng."),
]

EXERCISES = [
    q(L, 1, "「学校では制服を着ることになっています」 — ことになっている dùng vì:",
      ["Đây là QUY ĐỊNH có sẵn của trường, không phải người nói tự đặt ra",
       "Đây là quyết định cá nhân của người nói", "Câu này diễn tả sở thích",
       "Câu này diễn tả kinh nghiệm cá nhân"], 0,
      "ことになっている dùng cho quy định/thông lệ đã được TỔ CHỨC/xã hội thiết lập từ trước.",
      "Xem đặc điểm của ことになっている ở slide 1."),
    q(L, 2, "ことになっている (bài 3) khác ことにする (N4 bài 31) ở CHỦ THỂ quyết định:",
      ["ことになっている: tổ chức/quy luật khách quan; ことにする: chính người nói (cá nhân)",
       "Hoàn toàn giống nhau", "ことになっている chỉ dùng cho câu hỏi",
       "ことにする chỉ dùng cho phủ định"], 0,
      "Đây là điểm khác biệt cốt lõi: AI là người đưa ra quyết định — tổ chức hay cá nhân.",
      "Xem so sánh trực tiếp ở slide 2-3."),
    q(L, 3, "「留学することに決心しました」 khác 「留学することにしました」 (N4 bài 31) ở:",
      ["決心しました nhấn mạnh QUYẾT TÂM mạnh mẽ hơn しました đơn thuần",
       "Hoàn toàn giống nhau", "決心しました là quy định của tổ chức",
       "しました mạnh hơn 決心しました"], 0,
      "決心する (quyết tâm) thêm sắc thái CẢM XÚC MẠNH MẼ vào cấu trúc quyết định cá nhân đã học ở N4.",
      "Xem mở rộng từ vựng ở slide 2."),
    q(L, 4, "Câu hỏi nào giúp phân biệt ことになっている và ことにする?",
      ["AI là người đưa ra quyết định này — tổ chức/quy luật hay chính bản thân?",
       "Câu này ở thì quá khứ hay hiện tại?", "Câu này là khẳng định hay phủ định?",
       "Có bao nhiêu người tham gia?"], 0,
      "Đây là mẹo kiểm tra nhanh đã nêu ở slide 3 — xác định chủ thể quyết định.",
      "Áp dụng mẹo phân biệt đã học."),
    q(L, 5, "「会議室ではたばこを吸わないことになっています」 nghĩa là:",
      ["Quy định là không được hút thuốc trong phòng họp", "Được phép hút thuốc trong phòng họp",
       "Không ai biết có được hút thuốc hay không", "Phòng họp không có quy định gì"], 0,
      "V(ない)+ことになっています diễn tả quy định CẤM một cách khách quan.",
      "Xem cấu trúc phủ định ở slide 4."),
    q(L, 6, "「会社の規定で決まっています」 gần nghĩa với cấu trúc nào đã học?",
      ["Câu bị động (N4 bài 37) kết hợp ý nghĩa của ことになっている",
       "Thể sai khiến (N4 bài 48)", "Thể khả năng (N4 bài 27)",
       "Thể ý chí (N4 bài 31)"], 0,
      "決まっています (bị động của 決める) và ことになっている đều nhấn tính KHÁCH QUAN, không phải ý cá nhân — hai cách diễn đạt bổ trợ nhau.",
      "Kết hợp kiến thức bị động đã học ở N4 bài 37."),
    q(L, 7, "義務 nghĩa là gì?",
      ["Nghĩa vụ, trách nhiệm bắt buộc", "Sở thích cá nhân", "Kinh nghiệm", "Quyết tâm"], 0,
      "義務 (nghĩa vụ) khác hẳn 決まり/規則 (quy định) — nhấn mạnh tính BẮT BUỘC về mặt trách nhiệm.",
      "Xem nghĩa từ vựng ở phần từ vựng."),
    q(L, 8, "Người Nhật hay dùng câu nào để tránh trách nhiệm cá nhân khi giải thích một quy tắc khó chịu?",
      ["規則で決まっているので (vì đây là quy định)", "私が決めたので (vì tôi quyết định)",
       "好きだから (vì tôi thích vậy)", "分かりません (tôi không biết)"], 0,
      "規則で決まっているので đặt trách nhiệm vào QUY TẮC khách quan, không phải cá nhân — giữ hòa khí trong giao tiếp.",
      "Xem ghi chú văn hóa ở slide 3."),
    q(L, 9, "Trong hội thoại, ai quyết định lịch họp mỗi tuần?",
      ["Nội quy của trường (quy định khách quan)", "Chính Santos quyết định",
       "Không ai quyết định cả", "Do Wang đề xuất"], 0,
      "Santos nói 「大学の規定で決まっています」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Santos đã quyết tâm làm gì sau khi tốt nghiệp?",
      ["Đi du học", "Đi làm ngay", "Học tiếp thạc sĩ ở trường cũ", "Chưa quyết định"], 0,
      "Santos nói 「留学することに決心しました」.",
      "Xem câu thoại thứ 8."),
]

LESSON = lesson(
    L,
    "Bài 3: Quy định & Dự định (ことになっている & ことにする)",
    "ことになっている diễn tả QUY ĐỊNH/THÔNG LỆ khách quan đã có sẵn từ tổ chức/xã hội (khác hẳn "
    "ことにする đã học N4 bài 31 — quyết định CÁ NHÂN của người nói), kiểm tra bằng câu hỏi 'ai là "
    "người quyết định', kết hợp với thể bị động 決まっています (N4 bài 37), và mở rộng cảm xúc "
    "quyết tâm bằng 決心する.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
