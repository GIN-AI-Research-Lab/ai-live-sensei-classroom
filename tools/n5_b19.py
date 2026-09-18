# -*- coding: utf-8 -*-
"""N5 — Bài 19: Thể た, kinh nghiệm ことがあります, liệt kê たりたりします, biến đổi なります.

Bai ban le thu ba: sau the te (bai 14) va the nai (bai 17), day la the qua
khu ngan (た形) -- nen tang cho rat nhieu ngu phap N4 tro len. Tu vung
minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 19
pool = Pool("n5")

VOCAB = [
    v(1,  "のります", "乗ります", "のります", "norimasu", "verb", "Lên, đi (phương tiện)", "Thể た: 乗った. Đã gặp bài 5.", L),
    v(2,  "のぼります", "登ります", "のぼります", "noborimasu", "verb", "Leo, trèo (núi)", "Thể た: 登った. 富士山に 登ります = leo núi Phú Sĩ.", L),
    v(3,  "なります", "成ります", "なります", "narimasu", "verb", "Trở nên, trở thành", "N/な-adj + に なります; い-adj bỏ い + く なります.", L),
    v(4,  "はなします", "話します", "はなします", "hanashimasu", "verb", "Nói, trò chuyện", "Đã gặp bài 7 — nay dùng ví dụ liệt kê たり.", L),
    v(5,  "およぎます", "泳ぎます", "およぎます", "oyogimasu", "verb", "Bơi", "Đã gặp bài 13.", L),
    v(6,  "かいものします", "買い物します", "かいものします", "kaimonoshimasu", "verb", "Mua sắm", "Đã gặp bài 13 (danh từ 買い物) — nay chia động từ đầy đủ.", L),
    v(7,  "がいこく", "外国", "がいこく", "gaikoku", "noun", "Nước ngoài", "外国へ 行った ことが あります = đã từng đi nước ngoài.", L),
    v(8,  "がいこくじん", "外国人", "がいこくじん", "gaikokujin", "noun", "Người nước ngoài", "Đã gặp bài 1.", L),
    v(9,  "りゅうがくせい", "留学生", "りゅうがくせい", "ryuugakusei", "noun", "Du học sinh", "", L),
    v(10, "ふじさん", "富士山", "ふじさん", "fujisan", "noun", "Núi Phú Sĩ", "Ngọn núi cao nhất Nhật Bản, biểu tượng quốc gia.", L),
    v(11, "きょうと", "京都", "きょうと", "kyouto", "noun", "Kyoto (cố đô Nhật Bản)", "Nổi tiếng với nhiều đền chùa cổ.", L),
    v(12, "おてら", "お寺", "おてら", "otera", "noun", "Ngôi chùa", "京都には お寺が たくさん あります.", L),
    v(13, "いちど", "一度", "いちど", "ichido", "noun", "Một lần", "〜た ことが 一度 あります = đã từng làm ~ một lần.", L),
    v(14, "ゆうめい", "有名", "ゆうめい", "yuumei", "adjective", "Nổi tiếng", "Đã gặp bài 8 — nay dùng làm ví dụ なります.", L),
    v(15, "げんき", "元気", "げんき", "genki", "adjective", "Khỏe mạnh", "Đã gặp bài 8.", L),
    v(16, "あつい", "暑い", "あつい", "atsui", "adjective", "Nóng", "暑く なります = trở nên nóng. Đã gặp bài 8.", L),
    v(17, "さむい", "寒い", "さむい", "samui", "adjective", "Lạnh", "寒く なります = trở nên lạnh. Đã gặp bài 8.", L),
    v(18, "じょうず", "上手", "じょうず", "jouzu", "adjective", "Giỏi", "上手に なります = trở nên giỏi. Đã gặp bài 9.", L),
    v(19, "いそがしい", "忙しい", "いそがしい", "isogashii", "adjective", "Bận rộn", "Đã gặp bài 9.", L),
    v(20, "けいけん", "経験", "けいけん", "keiken", "noun", "Kinh nghiệm, trải nghiệm", "いい 経験に なりました = đã trở thành một trải nghiệm tốt.", L),
]

KANJI = [
    k(1, "登", "ĐĂNG", 12, ["トウ (tou)"], ["のぼ(る)"], "Leo, trèo lên.",
      [("登ります", "のぼります", "Leo lên"), ("登山", "とざん", "Leo núi"), ("登録", "とうろく", "Đăng ký")], L),
    k(2, "経", "KINH", 11, ["ケイ (kei)"], ["へ(る)"], "Trải qua, kinh qua.",
      [("経験", "けいけん", "Kinh nghiệm"), ("経済", "けいざい", "Kinh tế"), ("経由", "けいゆ", "Quá cảnh, qua ngả")], L),
    k(3, "験", "NGHIỆM", 18, ["ケン (ken)"], [], "Kiểm nghiệm, thử nghiệm.",
      [("経験", "けいけん", "Kinh nghiệm"), ("試験", "しけん", "Kỳ thi"), ("実験", "じっけん", "Thí nghiệm")], L),
    k(4, "寺", "TỰ", 6, ["ジ (ji)"], ["てら"], "Chùa.",
      [("お寺", "おてら", "Ngôi chùa"), ("寺院", "じいん", "Tự viện"), ("金閣寺", "きんかくじ", "Chùa Vàng")], L),
    k(5, "都", "ĐÔ", 11, ["ト (to)"], ["みやこ"], "Kinh đô, đô thị.",
      [("京都", "きょうと", "Kyoto"), ("都市", "とし", "Đô thị"), ("東京都", "とうきょうと", "Đô Tokyo")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chia thể た (giống hệt quy tắc thể て, đổi て→た)",
        "Nhóm 1: 5 kiểu biến âm giống thể て / Nhóm 2: bỏ ます + た / Nhóm 3 bất quy tắc",
        "Thể た chia HỆT thể て đã học ở bài 14 — chỉ cần đổi て→た, で→だ ở mọi vị trí. "
        "Nếu đã thuộc thể て thì thể た gần như không cần học lại từ đầu.",
        [
            ex(L, 1, 1, [t("t-l19s1-1", "のった", "乗った", "のった", key=True), t("t-l19s1-2", "。")],
               "Đã lên (xe/tàu). (乗って → 乗った, giống hệt quy tắc thể て)"),
            ex(L, 1, 2, [t("t-l19s1-3", "のぼった", "登った", "のぼった", key=True), t("t-l19s1-4", "。")],
               "Đã leo lên. (登って → 登った)"),
        ],
        tips="Học thể た gần như MIỄN PHÍ nếu đã nắm chắc thể て ở bài 14 — chỉ đổi て/で thành た/だ.",
        culture="Thể た còn gọi là 'thể ngắn quá khứ' (普通形), dùng trong văn viết thân mật, nhật ký, và làm gốc cho rất nhiều ngữ pháp N4 trở lên."),

    slide(L, 2,
        "2. Kinh nghiệm: Vた ことが あります",
        "[Thể た] + ことが + あります",
        "Cùng khung こと danh từ hóa đã học ở bài 18 (ことができます — khả năng), nhưng ở đây ghép "
        "với あります để diễn tả ĐÃ TỪNG có trải nghiệm làm việc gì đó trong quá khứ.",
        [
            ex(L, 2, 1, [t("t-l19s2-1", "ふじさん", "富士山", "ふじさん"), t("t-l19s2-2", "に"),
                         t("t-l19s2-3", "のぼった", "登った", "のぼった", key=True), t("t-l19s2-4", "こと", key=True),
                         t("t-l19s2-5", "が"), t("t-l19s2-6", "あります", "有ります", "あります", key=True)],
               "Tôi đã từng leo núi Phú Sĩ."),
            ex(L, 2, 2, [t("t-l19s2-7", "きょうと", "京都", "きょうと"), t("t-l19s2-8", "へ"),
                         t("t-l19s2-9", "いった", "行った", "いった"), t("t-l19s2-10", "こと", key=True),
                         t("t-l19s2-11", "が"), t("t-l19s2-12", "ありますか", "有りますか", "ありますか")],
               "Anh đã từng đi Kyoto chưa?"),
        ],
        tips="Vたことがあります nói về TRẢI NGHIỆM đáng chú ý trong đời — khác もう〜ました (đã làm xong, bài 7) chỉ báo việc vừa hoàn tất gần đây.",
        culture="外国人が 富士山に 登ったことが あります là câu tự hào phổ biến của người nước ngoài từng leo núi Phú Sĩ — một trải nghiệm biểu tượng khi ở Nhật."),

    slide(L, 3,
        "3. Liệt kê hành động tượng trưng: Vたり、Vたり します",
        "V1た + り、V2た + り + します",
        "たり liệt kê MỘT VÀI hành động TIÊU BIỂU trong số nhiều việc đã/sẽ làm — khác V1て、V2て "
        "(bài 16) vốn liệt kê ĐẦY ĐỦ theo đúng thứ tự thời gian.",
        [
            ex(L, 3, 1, [t("t-l19s3-1", "しゅうまつ", "週末", "しゅうまつ"), t("t-l19s3-2", "は"),
                         t("t-l19s3-3", "およいだり", "泳いだり", "およいだり", key=True), t("t-l19s3-4", "、"),
                         t("t-l19s3-5", "ほん", "本", "ほん"), t("t-l19s3-6", "を"),
                         t("t-l19s3-7", "よんだり", "読んだり", "よんだり", key=True), t("t-l19s3-8", "します")],
               "Cuối tuần tôi thường bơi, đọc sách, đủ thứ như vậy."),
            ex(L, 3, 2, [t("t-l19s3-9", "きのう", "昨日", "きのう"), t("t-l19s3-10", "は"),
                         t("t-l19s3-11", "かいものしたり", "買い物したり", "かいものしたり", key=True), t("t-l19s3-12", "、"),
                         t("t-l19s3-13", "ともだち", "友達", "ともだち"), t("t-l19s3-14", "と"),
                         t("t-l19s3-15", "はなしたり", "話したり", "はなしたり", key=True), t("t-l19s3-16", "しました", "しました", "しました")],
               "Hôm qua tôi đã mua sắm, nói chuyện với bạn bè, đủ thứ như vậy."),
        ],
        tips="たり luôn có ít nhất HAI động từ, kết bằng します/しました — không dùng một mình một động từ たり.",
        culture="たり rất hữu ích khi tả một buổi cuối tuần bận rộn nhiều hoạt động mà không cần liệt kê hết theo thứ tự chính xác."),

    slide(L, 4,
        "4. Biến đổi trạng thái: A/N に／く なります",
        "い-adj (bỏ い) + く + なります　　　　な-adj/N + に + なります",
        "なります diễn tả sự THAY ĐỔI theo thời gian — khác です (trạng thái tĩnh, không đổi). "
        "Tính từ い đổi đuôi thành く, tính từ な/danh từ thêm に trước なります.",
        [
            ex(L, 4, 1, [t("t-l19s4-1", "あつく", "暑く", "あつく", key=True), t("t-l19s4-2", "なりました", key=True)],
               "Trời đã trở nên nóng. (暑い bỏ い, thêm く)"),
            ex(L, 4, 2, [t("t-l19s4-3", "にほんご", "日本語", "にほんご"), t("t-l19s4-4", "が"),
                         t("t-l19s4-5", "じょうずに", "上手に", "じょうずに", key=True), t("t-l19s4-6", "なりました", key=True)],
               "Tiếng Nhật của tôi đã trở nên giỏi hơn. (上手 là tính từ な, thêm に)"),
            ex(L, 4, 3, [t("t-l19s4-7", "らいねん", "来年", "らいねん"), t("t-l19s4-8", "、"),
                         t("t-l19s4-9", "せんせい", "先生", "せんせい"), t("t-l19s4-10", "に", key=True),
                         t("t-l19s4-11", "なります", key=True)],
               "Sang năm, tôi sẽ trở thành giáo viên. (danh từ + に)"),
        ],
        tips="Phân biệt です (trạng thái tĩnh: 暑いです = trời đang nóng) và なります (biến đổi: 暑くなりました = trời ĐÃ TRỞ NÊN nóng, trước đó không nóng).",
        culture="この経験は いい勉強に なりました là câu kết bài luận/chia sẻ trải nghiệm rất thường gặp trong văn viết tiếng Nhật."),
]

DIALOGUE = [
    line(L, 1, "先生", "Giáo viên",
         [t("d-l19-1", "みなさん", "皆さん", "みなさん"), t("d-l19-2", "は"), t("d-l19-3", "ふじさん", "富士山", "ふじさん", key=True),
          t("d-l19-4", "に"), t("d-l19-5", "のぼった", "登った", "のぼった", key=True), t("d-l19-6", "こと", key=True),
          t("d-l19-7", "が"), t("d-l19-8", "ありますか", "有りますか", "ありますか")],
         "Các em đã từng leo núi Phú Sĩ chưa?"),
    line(L, 2, "ワン", "Sinh viên",
         [t("d-l19-9", "はい"), t("d-l19-10", "、"), t("d-l19-11", "いちど", "一度", "いちど", key=True),
          t("d-l19-12", "あります", "有ります", "あります")],
         "Có ạ, em đã từng leo một lần."),
    line(L, 3, "先生", "Giáo viên",
         [t("d-l19-13", "どうでしたか")],
         "Thế nào rồi?"),
    line(L, 4, "ワン", "Sinh viên",
         [t("d-l19-14", "とても"), t("d-l19-15", "つかれました", "疲れました", "つかれました"), t("d-l19-16", "。"),
          t("d-l19-17", "でも"), t("d-l19-18", "、"), t("d-l19-19", "いい"), t("d-l19-20", "けいけん", "経験", "けいけん", key=True),
          t("d-l19-21", "に"), t("d-l19-22", "なりました", key=True)],
         "Rất mệt. Nhưng đã trở thành một trải nghiệm tốt."),
    line(L, 5, "先生", "Giáo viên",
         [t("d-l19-23", "サントスさん"), t("d-l19-24", "は"), t("d-l19-25", "どうですか")],
         "Còn Santos thì sao?"),
    line(L, 6, "サントス", "Sinh viên",
         [t("d-l19-26", "わたし", "私", "わたし"), t("d-l19-27", "は"), t("d-l19-28", "まだ"), t("d-l19-29", "です"),
          t("d-l19-30", "。"), t("d-l19-31", "でも"), t("d-l19-32", "、"), t("d-l19-33", "きょうと", "京都", "きょうと", key=True),
          t("d-l19-34", "の"), t("d-l19-35", "おてら", "お寺", "おてら", key=True), t("d-l19-36", "を"),
          t("d-l19-37", "たくさん"), t("d-l19-38", "みた", "見た", "みた"), t("d-l19-39", "こと", key=True),
          t("d-l19-40", "が"), t("d-l19-41", "あります", "有ります", "あります")],
         "Em thì chưa ạ. Nhưng em đã từng thăm nhiều ngôi chùa ở Kyoto rồi."),
    line(L, 7, "先生", "Giáo viên",
         [t("d-l19-42", "きょうと", "京都", "きょうと"), t("d-l19-43", "で"), t("d-l19-44", "なに", "何", "なに"),
          t("d-l19-45", "を"), t("d-l19-46", "しましたか")],
         "Ở Kyoto em đã làm gì?"),
    line(L, 8, "サントス", "Sinh viên",
         [t("d-l19-47", "おてら", "お寺", "おてら", key=True), t("d-l19-48", "を"), t("d-l19-49", "みたり", "見たり", "みたり", key=True),
          t("d-l19-50", "、"), t("d-l19-51", "しゃしん", "写真", "しゃしん"), t("d-l19-52", "を"),
          t("d-l19-53", "とったり", "撮ったり", "とったり", key=True), t("d-l19-54", "しました", "しました", "しました")],
         "Em đã đi xem chùa, chụp ảnh, đủ thứ như vậy."),
    line(L, 9, "先生", "Giáo viên",
         [t("d-l19-55", "たのしそう", "楽しそう", "たのしそう"), t("d-l19-56", "です"), t("d-l19-57", "ね"),
          t("d-l19-58", "。"), t("d-l19-59", "にほんご", "日本語", "にほんご", key=True), t("d-l19-60", "も"),
          t("d-l19-61", "じょうずに", "上手に", "じょうずに", key=True), t("d-l19-62", "なりました", key=True), t("d-l19-63", "ね")],
         "Nghe vui đấy nhỉ. Tiếng Nhật của em cũng đã giỏi hơn rồi đấy."),
    line(L, 10, "サントス", "Sinh viên",
         [t("d-l19-64", "ありがとう"), t("d-l19-65", "ございます"), t("d-l19-66", "。"),
          t("d-l19-67", "まいにち", "毎日", "まいにち"), t("d-l19-68", "れんしゅう", "練習", "れんしゅう"), t("d-l19-69", "しました")],
         "Cảm ơn thầy ạ. Em đã luyện tập mỗi ngày."),
]

EXERCISES = [
    q(L, 1, "Thể た của 乗って (thể て) là:",
      ["乗った", "乗た", "乗って đổi thành 乗いた", "乗んだ"], 0,
      "Thể た chia hệt thể て, chỉ đổi て→た: 乗って → 乗った.",
      "Áp dụng đúng phép đổi て→た, で→だ."),
    q(L, 2, "「富士山に 登った ことが あります」 nghĩa là:",
      ["Tôi đã từng leo núi Phú Sĩ (trải nghiệm)", "Tôi đang leo núi Phú Sĩ",
       "Tôi sẽ leo núi Phú Sĩ", "Tôi chưa từng leo núi Phú Sĩ"], 0,
      "Vたことがあります diễn tả TRẢI NGHIỆM đã từng có trong quá khứ, không giới hạn thời gian gần đây.",
      "So sánh với もう〜ました (đã làm xong gần đây, bài 7)."),
    q(L, 3, "「京都へ 行った ことが ありますか」 「いいえ、___」",
      ["ありません", "ないです", "しません", "できません"], 0,
      "Phủ định của あります (trong cấu trúc kinh nghiệm) là ありません, không phải ないです hay しません.",
      "Xem lại cách chia phủ định của あります."),
    q(L, 4, "「泳いだり、本を 読んだり します」 diễn tả điều gì?",
      ["Liệt kê một vài hành động tiêu biểu trong nhiều việc làm",
       "Liệt kê ĐẦY ĐỦ theo đúng thứ tự thời gian", "Chỉ một hành động duy nhất",
       "Việc chưa từng làm"], 0,
      "たり liệt kê MỘT SỐ hành động TIÊU BIỂU, không cần đầy đủ và không nhấn mạnh thứ tự — khác V1てV2て (bài 16).",
      "So sánh với V1てV2て đã học ở bài 16."),
    q(L, 5, "Biến đổi của 暑い (tính từ い) khi ghép với なります là:",
      ["暑く なります", "暑いに なります", "暑な なります", "暑さに なります"], 0,
      "Tính từ い bỏ い, thêm く trước なります: 暑い → 暑く なります.",
      "Áp dụng quy tắc chia của tính từ い."),
    q(L, 6, "Biến đổi của 上手 (tính từ な) khi ghép với なります là:",
      ["上手に なります", "上手く なります", "上手な なります", "上手だ なります"], 0,
      "Tính từ な và danh từ thêm に trước なります: 上手 → 上手に なります.",
      "So sánh với câu 5 để thấy khác biệt giữa hai loại tính từ."),
    q(L, 7, "です và なります khác nhau ở chỗ:",
      ["です là trạng thái tĩnh, なります là sự BIẾN ĐỔI theo thời gian",
       "Hoàn toàn giống nhau", "です chỉ dùng cho câu hỏi",
       "なります chỉ dùng cho quá khứ"], 0,
      "です miêu tả trạng thái hiện tại không đổi; なります nhấn mạnh sự CHUYỂN ĐỔI từ trạng thái này sang trạng thái khác.",
      "So sánh 暑いです (đang nóng) với 暑くなりました (đã trở nên nóng)."),
    q(L, 8, "「先生に なります」 nghĩa là:",
      ["Sẽ trở thành giáo viên", "Là giáo viên (đã lâu)",
       "Đã từng là giáo viên", "Không phải giáo viên"], 0,
      "Danh từ + に + なります diễn tả sự thay đổi TRỞ THÀNH một vai trò/trạng thái mới.",
      "Đây là câu nói về tương lai/thay đổi, không phải trạng thái đã ổn định."),
    q(L, 9, "Trong hội thoại, Wang đã từng leo núi Phú Sĩ mấy lần?",
      ["Một lần", "Hai lần", "Chưa từng leo", "Ba lần"], 0,
      "Wang trả lời 「はい、一度あります」.",
      "Xem câu thoại thứ 2."),
    q(L, 10, "Ở Kyoto, Santos đã làm những gì?",
      ["Xem chùa và chụp ảnh", "Chỉ leo núi", "Chỉ mua sắm", "Không làm gì cả"], 0,
      "Santos nói 「お寺を見たり、写真を撮ったり しました」.",
      "Xem câu thoại thứ 8."),
]

LESSON = lesson(
    L,
    "Bài 19: Thể た & Kinh nghiệm (Vたことがあります / Vたりたりします / なります)",
    "Chia thể た (giống quy tắc thể て, chỉ đổi て→た), diễn tả trải nghiệm quá khứ bằng "
    "Vたことがあります, liệt kê một vài hành động tiêu biểu bằng V1たりV2たりします, và sự biến "
    "đổi trạng thái theo thời gian bằng A/Nに／くなります.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
