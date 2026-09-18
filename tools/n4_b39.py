# -*- coding: utf-8 -*-
"""N4 — Bai 39: Nguyen nhan ly do khach quan ので, va V-te chi ly do.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 39
pool = Pool("n4")

VOCAB = [
    v(1,  "やすみます", "休みます", "やすみます", "yasumimasu", "verb", "Nghỉ (làm/học)", "Đã gặp N5 bài 4 — nay dùng làm ví dụ ので.", L),
    v(2,  "おくれます", "遅れます", "おくれます", "okuremasu", "verb", "Đến muộn, trễ", "Đã gặp bài 26.", L),
    v(3,  "こまります", "困ります", "こまります", "komarimasu", "verb", "Khó xử, gặp khó khăn", "電車が 止まったので、困りました = tàu ngừng chạy nên tôi gặp khó khăn.", L),
    v(4,  "とまります", "止まります", "とまります", "tomarimasu", "verb", "Ngừng lại, dừng (tự động từ)", "電車が 止まりました = tàu điện ngừng chạy.", L),
    v(5,  "よういします", "用意します", "よういします", "youi shimasu", "verb", "Chuẩn bị", "Đã có ở N4 bài 30.", L),
    v(6,  "たいふう", "台風", "たいふう", "taifuu", "noun", "Bão (bão nhiệt đới)", "Đã gặp N5 bài 21.", L),
    v(7,  "ようじ", "用事", "ようじ", "youji", "noun", "Việc bận, việc riêng", "用事が あるので、休みます = vì có việc bận nên tôi xin nghỉ.", L),
    v(8,  "じこ", "事故", "じこ", "jiko", "noun", "Tai nạn", "Đã gặp bài 26.", L),
    v(9,  "こうつう", "交通", "こうつう", "koutsuu", "noun", "Giao thông", "交通が 込んでいるので = vì giao thông tắc nghẽn.", L),
    v(10, "でんしゃ", "電車", "でんしゃ", "densha", "noun", "Tàu điện", "Đã gặp N5 bài 5.", L),
    v(11, "びょうき", "病気", "びょうき", "byouki", "noun", "Bệnh, ốm", "Đã gặp bài 17 (N5).", L),
    v(12, "しごと", "仕事", "しごと", "shigoto", "noun", "Công việc", "Đã gặp N5 bài 9.", L),
    v(13, "がっこう", "学校", "がっこう", "gakkou", "noun", "Trường học", "Đã gặp bài 28.", L),
    v(14, "かいぎ", "会議", "かいぎ", "kaigi", "noun", "Cuộc họp", "Đã gặp N5 bài 7.", L),
    v(15, "もうしわけありません", "申し訳ありません", "もうしわけありません", "moushiwake arimasen", "phrase", "Thành thật xin lỗi (trang trọng)", "Trang trọng hơn すみません nhiều.", L),
    v(16, "しつれいします", "失礼します", "しつれいします", "shitsurei shimasu", "phrase", "Xin phép (khi rời đi/vào phòng)", "Đã gặp N5 bài 3 (失礼ですが).", L),
    v(17, "きゅうに", "急に", "きゅうに", "kyuu ni", "adverb", "Đột ngột, bỗng nhiên", "Đã gặp bài 29.", L),
    v(18, "たいへん", "大変", "たいへん", "taihen", "adjective", "Vất vả, khó khăn", "Đã gặp N5 bài 21.", L),
    v(19, "しんぱいします", "心配します", "しんぱいします", "shinpai shimasu", "verb", "Lo lắng", "Đã gặp N5 bài 15.", L),
    v(20, "だいじょうぶ", "大丈夫", "だいじょうぶ", "daijoubu", "adjective", "Ổn, không sao", "Đã gặp N5 bài 15.", L),
]

KANJI = [
    k(1, "困", "KHỐN", 7, ["コン (kon)"], ["こま(る)"], "Khó xử, khốn khó.",
      [("困ります", "こまります", "Khó xử"), ("困難", "こんなん", "Khó khăn")], L),
    k(2, "台", "ĐÀI", 5, ["ダイ (dai)", "タイ (tai)"], [], "Bệ, đài. Đã gặp N5 bài 11.",
      [("台風", "たいふう", "Bão"), ("一台", "いちだい", "Một chiếc (máy)")], L),
    k(3, "風", "PHONG", 9, ["フウ (fuu)"], ["かぜ"], "Gió; cảm cúm.",
      [("台風", "たいふう", "Bão"), ("風邪", "かぜ", "Cảm cúm"), ("風", "かぜ", "Gió")], L),
    k(4, "用", "DỤNG", 5, ["ヨウ (you)"], ["もち(いる)"], "Dùng, việc cần làm. Đã gặp bài 30.",
      [("用事", "ようじ", "Việc bận"), ("用意", "ようい", "Chuẩn bị"), ("使用", "しよう", "Sử dụng")], L),
    k(5, "交", "GIAO", 6, ["コウ (kou)"], ["まじ(わる)"], "Giao lưu, qua lại.",
      [("交通", "こうつう", "Giao thông"), ("交番", "こうばん", "Đồn công an"), ("交流", "こうりゅう", "Giao lưu")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Lý do khách quan, lịch sự: [Thể thông thường] ので",
        "[Thể thông thường, tính từ な/danh từ dùng な thay だ] + ので",
        "ので diễn tả lý do MANG TÍNH KHÁCH QUAN, LỊCH SỰ hơn から (N5 bài 9) — thường dùng khi xin "
        "phép, xin lỗi, giải thích với người trên/khách hàng. Không mang cảm giác biện minh cá nhân.",
        [
            ex(L, 1, 1, [t("t-l39s1-1", "びょうき", "病気", "びょうき"), t("t-l39s1-2", "な", key=True),
                         t("t-l39s1-3", "ので", key=True), t("t-l39s1-4", "、"), t("t-l39s1-5", "やすみます", "休みます", "やすみます")],
               "Vì bị bệnh nên tôi xin nghỉ. (danh từ + な + ので)"),
            ex(L, 1, 2, [t("t-l39s1-6", "ようじ", "用事", "ようじ", key=True), t("t-l39s1-7", "が"),
                         t("t-l39s1-8", "ある", key=True), t("t-l39s1-9", "ので", key=True), t("t-l39s1-10", "、"),
                         t("t-l39s1-11", "はやく", "早く", "はやく"), t("t-l39s1-12", "かえります", "帰ります", "かえります")],
               "Vì có việc bận nên tôi về sớm."),
        ],
        tips="Danh từ/tính từ な trước ので dùng な (không phải だ) — 病気なので (ĐÚNG), không nói 病気だので.",
        culture="Xin nghỉ phép với sếp ở công ty Nhật luôn dùng ので thay vì から để giữ giọng khách quan, tránh nghe như đang bào chữa."),

    slide(L, 2,
        "2. So sánh ので và から (N5 bài 9)",
        "ので: khách quan, lịch sự, dùng với người trên　vs　から: chủ quan hơn, thân mật, có thể dùng độc lập cuối câu",
        "から có thể đứng MỘT MÌNH ở cuối câu để nhấn mạnh lý do (đã học N5 bài 9: 「だから」), "
        "còn ので LUÔN cần vế sau — không dùng độc lập, và không hợp với câu ra lệnh/cấm đoán mạnh.",
        [
            ex(L, 2, 1, [t("t-l39s2-1", "あめ", "雨", "あめ"), t("t-l39s2-2", "な", key=True), t("t-l39s2-3", "ので", key=True),
                         t("t-l39s2-4", "、"), t("t-l39s2-5", "でかけません", "出かけません", "でかけません")],
               "Vì trời mưa nên tôi không ra ngoài. (ので lịch sự, khách quan)"),
            ex(L, 2, 2, [t("t-l39s2-6", "あめ", "雨", "あめ"), t("t-l39s2-7", "だ"), t("t-l39s2-8", "から", key=True),
                         t("t-l39s2-9", "、"), t("t-l39s2-10", "でかけません", "出かけません", "でかけません")],
               "Vì trời mưa nên tôi không ra ngoài. (から, thân mật/trung tính hơn)"),
        ],
        tips="ので không dùng được trong câu MỆNH LỆNH/CẤM ĐOÁN mạnh (không nói 危ないので入るな — nghe kỳ, hợp lý hơn là から+な).",
        culture="Thông báo công cộng (nhà ga, sân bay) hầu như luôn dùng ので thay vì から: 「電車が遅れておりますので、ご了承ください」."),

    slide(L, 3,
        "3. Lý do bằng thể て (Vて/A くて/N で)",
        "Vて／Aくて／Nで、[kết quả]   (nhẹ nhàng hơn cả ので, chỉ NGỤ Ý lý do qua ngữ cảnh)",
        "Thể て (đã học N5 bài 14) còn dùng để NGỤ Ý LÝ DO một cách rất nhẹ nhàng, không cần từ nối "
        "rõ ràng như から/ので — người nghe tự hiểu qua ngữ cảnh.",
        [
            ex(L, 3, 1, [t("t-l39s3-1", "でんしゃ", "電車", "でんしゃ", key=True), t("t-l39s3-2", "が"),
                         t("t-l39s3-3", "とまって", "止まって", "とまって", key=True), t("t-l39s3-4", "、"),
                         t("t-l39s3-5", "こまりました", "困りました", "こまりました", key=True)],
               "Vì tàu điện ngừng chạy nên tôi gặp khó khăn. (て ngụ ý lý do)"),
            ex(L, 3, 2, [t("t-l39s3-6", "びょうき", "病気", "びょうき"), t("t-l39s3-7", "で", key=True),
                         t("t-l39s3-8", "、"), t("t-l39s3-9", "がっこう", "学校", "がっこう"), t("t-l39s3-10", "を"),
                         t("t-l39s3-11", "やすみました", "休みました", "やすみました")],
               "Vì bị bệnh nên tôi đã nghỉ học. (danh từ + で ngụ ý lý do)"),
        ],
        tips="Thể て chỉ ngụ ý lý do NHẸ, không nhấn mạnh quan hệ nhân quả mạnh như から/ので — phù hợp cho tường thuật tự nhiên, không cần giải thích kỹ.",
        culture="病気で休みました ngắn gọn, tự nhiên hơn 病気なので休みました trong nhiều tình huống nói chuyện thường ngày."),

    slide(L, 4,
        "4. Tổng kết bốn cách nêu lý do",
        "から (N5 b9, chủ quan/thân mật) / ので (khách quan/lịch sự) / て (ngụ ý nhẹ) / から+độc lập (đã học N5)",
        "Xin lỗi/giải thích với người TRÊN, khách hàng → ưu tiên ので. Nói chuyện bạn bè, nhấn mạnh "
        "lý do cá nhân → から. Tường thuật ngắn gọn, tự nhiên → て.",
        [
            ex(L, 4, 1, [t("t-l39s4-1", "もうしわけありません", "申し訳ありません", "もうしわけありません", key=True),
                         t("t-l39s4-2", "。"), t("t-l39s4-3", "こうつう", "交通", "こうつう", key=True),
                         t("t-l39s4-4", "じこ", "事故", "じこ"), t("t-l39s4-5", "が"), t("t-l39s4-6", "あった", "有った", "あった"),
                         t("t-l39s4-7", "ので", key=True), t("t-l39s4-8", "、"), t("t-l39s4-9", "おくれました", "遅れました", "おくれました")],
               "Thành thật xin lỗi. Vì có tai nạn giao thông nên tôi đến muộn."),
        ],
        tips="申し訳ありません + ので là cặp mở đầu xin lỗi CHUẨN MỰC nhất trong môi trường công sở, dịch vụ khách hàng Nhật.",
        culture="Nhân viên Nhật khi trễ giờ hầu như luôn mở đầu bằng 申し訳ありません rồi mới giải thích lý do bằng ので, tuyệt đối tránh から nghe như đổ lỗi."),
]

DIALOGUE = [
    line(L, 1, "田中", "Nhân viên",
         [t("d-l39-1", "もしもし"), t("d-l39-2", "、"), t("d-l39-3", "たなか", "田中", "たなか"),
          t("d-l39-4", "です"), t("d-l39-5", "。"), t("d-l39-6", "きょう", "今日", "きょう"),
          t("d-l39-7", "は"), t("d-l39-8", "ようじ", "用事", "ようじ", key=True), t("d-l39-9", "が"),
          t("d-l39-10", "ある", key=True), t("d-l39-11", "ので", key=True), t("d-l39-12", "、"),
          t("d-l39-13", "やすみたい", "休みたい", "やすみたい"), t("d-l39-14", "です")],
         "Alô, tôi là Tanaka. Hôm nay vì có việc bận nên tôi muốn xin nghỉ ạ."),
    line(L, 2, "上司", "Cấp trên",
         [t("d-l39-15", "わかりました", "分かりました", "わかりました"), t("d-l39-16", "。"), t("d-l39-17", "だいじょうぶ", "大丈夫", "だいじょうぶ"),
          t("d-l39-18", "です"), t("d-l39-19", "よ")],
         "Tôi hiểu rồi. Không sao đâu."),
    line(L, 3, "田中", "Nhân viên",
         [t("d-l39-20", "ありがとう"), t("d-l39-21", "ございます"), t("d-l39-22", "。"), t("d-l39-23", "しつれいします", "失礼します", "しつれいします", key=True)],
         "Cảm ơn anh nhiều. Xin phép ạ."),
    line(L, 4, "山田", "Đồng nghiệp",
         [t("d-l39-24", "すみません"), t("d-l39-25", "、"), t("d-l39-26", "でんしゃ", "電車", "でんしゃ", key=True),
          t("d-l39-27", "が"), t("d-l39-28", "とまって", "止まって", "とまって", key=True), t("d-l39-29", "、"),
          t("d-l39-30", "おくれました", "遅れました", "おくれました")],
         "Xin lỗi, vì tàu điện ngừng chạy nên tôi đến muộn."),
    line(L, 5, "上司", "Cấp trên",
         [t("d-l39-31", "たいへん", "大変", "たいへん", key=True), t("d-l39-32", "でした"), t("d-l39-33", "ね"),
          t("d-l39-34", "。"), t("d-l39-35", "なにか", "何か", "なにか"), t("d-l39-36", "あった", "有った", "あった"),
          t("d-l39-37", "んです", key=True), t("d-l39-38", "か")],
         "Vất vả thật đấy nhỉ. Có chuyện gì xảy ra à?"),
    line(L, 6, "山田", "Đồng nghiệp",
         [t("d-l39-39", "こうつう", "交通", "こうつう", key=True), t("d-l39-40", "じこ", "事故", "じこ"),
          t("d-l39-41", "が"), t("d-l39-42", "あった", "有った", "あった"), t("d-l39-43", "ので", key=True),
          t("d-l39-44", "、"), t("d-l39-45", "でんしゃ", "電車", "でんしゃ"), t("d-l39-46", "が"),
          t("d-l39-47", "とまりました", "止まりました", "とまりました")],
         "Vì có tai nạn giao thông nên tàu điện đã ngừng chạy."),
    line(L, 7, "上司", "Cấp trên",
         [t("d-l39-48", "もうしわけありません", "申し訳ありません", "もうしわけありません"), t("d-l39-49", "は"),
          t("d-l39-50", "いいです", key=True), t("d-l39-51", "よ")],
         "Không cần xin lỗi vậy đâu."),
    line(L, 8, "山田", "Đồng nghiệp",
         [t("d-l39-52", "きゅうに", "急に", "きゅうに", key=True), t("d-l39-53", "とまった", "止まった", "とまった"),
          t("d-l39-54", "ので", key=True), t("d-l39-55", "、"), t("d-l39-56", "こまりました", "困りました", "こまりました", key=True)],
         "Vì đột nhiên ngừng chạy nên tôi cũng gặp khó khăn."),
    line(L, 9, "上司", "Cấp trên",
         [t("d-l39-57", "しんぱい", "心配", "しんぱい", key=True), t("d-l39-58", "しないで", "しないで", "しないで"),
          t("d-l39-59", "ください"), t("d-l39-60", "。"), t("d-l39-61", "かいぎ", "会議", "かいぎ", key=True),
          t("d-l39-62", "は"), t("d-l39-63", "まだ"), t("d-l39-64", "はじまって", "始まって", "はじまって"),
          t("d-l39-65", "いません")],
         "Đừng lo. Cuộc họp vẫn chưa bắt đầu đâu."),
    line(L, 10, "山田", "Đồng nghiệp",
         [t("d-l39-66", "よかった", "良かった", "よかった"), t("d-l39-67", "です"), t("d-l39-68", "。"),
          t("d-l39-69", "すぐ"), t("d-l39-70", "いきます", "行きます", "いきます")],
         "May quá. Tôi đến ngay đây."),
]

EXERCISES = [
    q(L, 1, "「病気なので、休みます」 — vì sao trước ので là な, không phải だ?",
      ["Danh từ/tính từ な trước ので dùng な, không dùng だ",
       "だ mới đúng, な là lỗi", "な chỉ dùng cho câu hỏi",
       "ので chỉ ghép được với động từ"], 0,
      "Khác thể thông thường bình thường (病気だ), trước ので danh từ/tính từ な dùng な: 病気なので.",
      "Đây là quy tắc riêng của ので, khác cách chia trước です/だ thông thường."),
    q(L, 2, "ので khác から (N5 bài 9) chủ yếu ở:",
      ["ので khách quan, lịch sự hơn; から chủ quan, thân mật hơn, có thể đứng độc lập",
       "Hoàn toàn giống nhau", "ので chỉ dùng cho câu hỏi",
       "から chỉ dùng được với tính từ"], 0,
      "ので tạo cảm giác lý do khách quan, phù hợp giao tiếp lịch sự/công sở; から thân mật, có thể dùng độc lập (だから).",
      "Xem so sánh chi tiết ở slide 2."),
    q(L, 3, "「危ないので、入るな」 nghe không tự nhiên vì:",
      ["ので không hợp với câu MỆNH LỆNH/CẤM ĐOÁN mạnh như 入るな",
       "危ない sai chính tả", "ので chỉ dùng cho câu hỏi",
       "入るな không phải mệnh lệnh"], 0,
      "ので mang tính khách quan, nhẹ nhàng — không hợp với câu mệnh lệnh/cấm đoán mạnh (thường dùng から thay thế).",
      "Xem giới hạn sử dụng ở slide 2."),
    q(L, 4, "「電車が止まって、困りました」 — thể て ở đây có vai trò gì?",
      ["Ngụ ý LÝ DO một cách nhẹ nhàng, không cần từ nối rõ ràng",
       "Chỉ nối hành động theo thứ tự (giống N5 bài 16), không liên quan tới lý do",
       "Ra lệnh dừng tàu điện", "Phủ định việc tàu điện dừng"], 0,
      "Thể て còn có chức năng ngụ ý lý do nhẹ nhàng — người nghe tự suy luận quan hệ nhân quả qua ngữ cảnh.",
      "Xem chức năng mới của thể て ở slide 3."),
    q(L, 5, "「病気で、学校を休みました」 — で ở đây có vai trò gì?",
      ["Ngụ ý lý do (danh từ + で = vì...)", "Đánh dấu nơi hành động (N5 bài 6)",
       "Đánh dấu phương tiện (N5 bài 5)", "Đánh dấu công cụ (N5 bài 7)"], 0,
      "で sau danh từ ở đây mang chức năng ngụ ý LÝ DO, khác các chức năng で đã học trước (nơi chốn, phương tiện, công cụ).",
      "Đây là chức năng thứ tư của で, thêm vào ba chức năng đã học ở N5."),
    q(L, 6, "Trong môi trường công sở, xin nghỉ phép nên ưu tiên dùng:",
      ["ので (khách quan, lịch sự)", "から (thân mật, có thể nghe như biện minh)",
       "て (quá ngắn gọn, thiếu trang trọng)", "Không cần nêu lý do gì cả"], 0,
      "ので giữ giọng khách quan, phù hợp môi trường trang trọng/công sở hơn từ から.",
      "Xem văn hóa công sở đã nêu ở slide 1 và 4."),
    q(L, 7, "「申し訳ありません」 khác 「すみません」 ở mức độ:",
      ["申し訳ありません trang trọng hơn nhiều, dùng khi lỗi nghiêm trọng/với cấp trên-khách hàng",
       "Hoàn toàn giống nhau", "申し訳ありません chỉ dùng cho câu hỏi",
       "すみません trang trọng hơn"], 0,
      "申し訳ありません là mức xin lỗi TRANG TRỌNG cao hơn すみません nhiều, phù hợp môi trường công sở, dịch vụ khách hàng.",
      "Xem ghi chú văn hóa và nghĩa từ ở phần từ vựng."),
    q(L, 8, "Câu nào ĐÚNG khi kết hợp thông báo trang trọng?",
      ["電車が遅れておりますので、ご了承ください", "電車が遅れておりますから、ご了承しろ",
       "電車が遅れて、ご了承しろ", "電車が遅れましたので、ご了承するな"], 0,
      "Thông báo công cộng trang trọng dùng ので kết hợp câu yêu cầu lịch sự, không dùng から hay câu mệnh lệnh cộc.",
      "Xem ví dụ thông báo công cộng ở slide 2."),
    q(L, 9, "Trong hội thoại, vì sao Yamada đến muộn?",
      ["Vì có tai nạn giao thông làm tàu điện ngừng chạy",
       "Vì ngủ quên", "Vì xe hỏng", "Không có lý do cụ thể"], 0,
      "Yamada giải thích 「交通事故があったので、電車が止まりました」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Cuối hội thoại, cấp trên trấn an Yamada điều gì?",
      ["Cuộc họp vẫn chưa bắt đầu", "Yamada bị phạt", "Không cần đến công ty nữa",
       "Sẽ hủy cuộc họp"], 0,
      "Cấp trên nói 「会議はまだ始まっていません」.",
      "Xem câu thoại thứ 9."),
]

LESSON = lesson(
    L,
    "Bài 39: Nguyên nhân lý do khách quan (〜ので / V-て)",
    "Nêu lý do khách quan, lịch sự bằng ので (danh từ/tính từ な dùng な, khác だ; không hợp câu "
    "mệnh lệnh mạnh — khác から N5 bài 9), và ngụ ý lý do nhẹ nhàng bằng thể て/で — tổng kết bốn "
    "cách nêu lý do trong tiếng Nhật theo mức độ trang trọng tăng dần: て → から → ので.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
