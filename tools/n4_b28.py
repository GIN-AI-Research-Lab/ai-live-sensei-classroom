# -*- coding: utf-8 -*-
"""N4 — Bai 28: Hanh dong dong thoi 〜ながら, thoi quen/lap lai 〜ています.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 28
pool = Pool("n4")

VOCAB = [
    v(1,  "つづけます", "続けます", "つづけます", "tsuzukemasu", "verb", "Tiếp tục, duy trì", "運動を 続けています = tôi vẫn đang duy trì tập thể dục.", L),
    v(2,  "つづきます", "続きます", "つづきます", "tsuzukimasu", "verb", "Kéo dài, tiếp diễn (tự động từ)", "雨が 続いています = trời vẫn đang mưa kéo dài.", L),
    v(3,  "かよいます", "通います", "かよいます", "kayoimasu", "verb", "Đi lại thường xuyên (đi làm, đi học)", "学校に 通っています = tôi đang đi học (đều đặn).", L),
    v(4,  "かたづけます", "片付けます", "かたづけます", "katazukemasu", "verb", "Dọn dẹp, sắp xếp", "部屋を 片付けながら = vừa dọn phòng vừa...", L),
    v(5,  "きまります", "決まります", "きまります", "kimarimasu", "verb", "Được quyết định, được ấn định", "時間が 決まっています = giờ giấc đã được ấn định.", L),
    v(6,  "せいかつします", "生活します", "せいかつします", "seikatsu shimasu", "verb", "Sinh sống, sinh hoạt", "一人で 生活しています = tôi sống một mình.", L),
    v(7,  "しゅみ", "趣味", "しゅみ", "shumi", "noun", "Sở thích", "Đã gặp N5 bài 18 (bổ sung thêm ở N4 pool) — nay dùng làm bối cảnh thói quen.", L),
    v(8,  "しゅうかん", "習慣", "しゅうかん", "shuukan", "noun", "Thói quen, tập quán", "毎朝 走る 習慣が あります = tôi có thói quen chạy bộ mỗi sáng.", L),
    v(9,  "きそく", "規則", "きそく", "kisoku", "noun", "Quy tắc, nội quy", "会社の 規則です = đây là nội quy công ty.", L),
    v(10, "せいかつ", "生活", "せいかつ", "seikatsu", "noun", "Cuộc sống, sinh hoạt", "毎日の 生活 = cuộc sống hằng ngày.", L),
    v(11, "うんどう", "運動", "うんどう", "undou", "noun", "Vận động, thể dục", "Đã gặp bài 27.", L),
    v(12, "さんぽ", "散歩", "さんぽ", "sanpo", "noun", "Việc đi dạo", "Đã gặp N5 bài 18.", L),
    v(13, "おんがく", "音楽", "おんがく", "ongaku", "noun", "Âm nhạc", "音楽を 聞きながら = vừa nghe nhạc vừa...", L),
    v(14, "しんぶん", "新聞", "しんぶん", "shinbun", "noun", "Báo, tờ báo", "新聞を 読みながら = vừa đọc báo vừa...", L),
    v(15, "コーヒー", "", "", "koohii", "noun", "Cà phê", "コーヒーを 飲みながら = vừa uống cà phê vừa...", L),
    v(16, "がっこう", "学校", "がっこう", "gakkou", "noun", "Trường học", "学校に 通っています = tôi đang đi học đều đặn.", L),
    v(17, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "会社に 通っています = tôi đang đi làm đều đặn.", L),
    v(18, "へや", "部屋", "へや", "heya", "noun", "Căn phòng", "部屋を 片付けます = dọn phòng.", L),
    v(19, "まいあさ", "毎朝", "まいあさ", "maiasa", "adverb", "Mỗi sáng", "毎朝 続けています = mỗi sáng đều duy trì.", L),
    v(20, "ひとりで", "一人で", "ひとりで", "hitori de", "adverb", "Một mình", "一人で 生活しています = tôi sống một mình.", L),
]

KANJI = [
    k(1, "続", "TỤC", 13, ["ゾク (zoku)"], ["つづ(ける)", "つづ(く)"], "Tiếp tục, liên tục.",
      [("続けます", "つづけます", "Tiếp tục"), ("続きます", "つづきます", "Kéo dài"), ("連続", "れんぞく", "Liên tục")], L),
    k(2, "習", "TẬP", 11, ["シュウ (shuu)"], ["なら(う)"], "Học, luyện tập, thói quen. Đã gặp N5 bài 7.",
      [("習慣", "しゅうかん", "Thói quen"), ("習います", "ならいます", "Học"), ("練習", "れんしゅう", "Luyện tập")], L),
    k(3, "慣", "QUÁN", 14, ["カン (kan)"], ["な(れる)"], "Quen thuộc, thành nếp.",
      [("習慣", "しゅうかん", "Thói quen"), ("慣れます", "なれます", "Quen với"), ("習慣的", "しゅうかんてき", "Có tính thói quen")], L),
    k(4, "規", "QUY", 11, ["キ (ki)"], [], "Quy tắc, khuôn phép.",
      [("規則", "きそく", "Quy tắc"), ("規定", "きてい", "Quy định"), ("新規", "しんき", "Mới, mới mẻ")], L),
    k(5, "活", "HOẠT", 9, ["カツ (katsu)"], [], "Sống, hoạt động.",
      [("生活", "せいかつ", "Cuộc sống"), ("活動", "かつどう", "Hoạt động"), ("活気", "かっき", "Sức sống")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Hai hành động đồng thời: V1(ます bỏ ます) + ながら、V2",
        "V1(gốc ます) + ながら + V2   (V2 là hành động CHÍNH)",
        "ながら nối hai hành động xảy ra CÙNG LÚC do MỘT chủ thể thực hiện — hành động gắn với "
        "ながら là hành động PHỤ, hành động ở cuối câu (V2) mới là hành động CHÍNH được nhấn mạnh.",
        [
            ex(L, 1, 1, [t("t-l28s1-1", "おんがく", "音楽", "おんがく"), t("t-l28s1-2", "を"),
                         t("t-l28s1-3", "ききながら", "聞きながら", "ききながら", key=True), t("t-l28s1-4", "、"),
                         t("t-l28s1-5", "べんきょう", "勉強", "べんきょう"), t("t-l28s1-6", "します")],
               "Tôi vừa nghe nhạc vừa học bài. (học bài là hành động chính)"),
            ex(L, 1, 2, [t("t-l28s1-7", "コーヒー"), t("t-l28s1-8", "を"), t("t-l28s1-9", "のみながら", "飲みながら", "のみながら", key=True),
                         t("t-l28s1-10", "、"), t("t-l28s1-11", "しんぶん", "新聞", "しんぶん"), t("t-l28s1-12", "を"),
                         t("t-l28s1-13", "よみます", "読みます", "よみます")],
               "Tôi vừa uống cà phê vừa đọc báo."),
        ],
        tips="ながら CHỈ dùng khi cùng MỘT người thực hiện cả hai hành động — khác V1てV2て (N5 bài 16) không có ràng buộc chủ thể phụ/chính.",
        culture="音楽を聞きながら勉強する là thói quen phổ biến của học sinh sinh viên Nhật, dù có tranh cãi về hiệu quả học tập."),

    slide(L, 2,
        "2. So sánh ながら và V1てV2て",
        "ながら: đồng thời, một chủ thể, có chính/phụ　　V1てV2て: tuần tự theo thời gian (N5 bài 16)",
        "V1てV2て (N5 bài 16) kể các hành động THEO THỨ TỰ THỜI GIAN, xảy ra lần lượt. ながら nhấn "
        "mạnh hai hành động diễn ra CÙNG MỘT LÚC, không có thứ tự trước sau.",
        [
            ex(L, 2, 1, [t("t-l28s2-1", "あるきながら", "歩きながら", "あるきながら", key=True), t("t-l28s2-2", "、"),
                         t("t-l28s2-3", "はなします", "話します", "はなします")],
               "Tôi vừa đi bộ vừa nói chuyện. (hai việc CÙNG lúc)"),
            ex(L, 2, 2, [t("t-l28s2-4", "あるいて", "歩いて", "あるいて"), t("t-l28s2-5", "、"),
                         t("t-l28s2-6", "はなしました", "話しました", "はなしました")],
               "Tôi đi bộ, rồi nói chuyện. (hai việc XẢY RA LẦN LƯỢT, nghĩa khác hẳn)"),
        ],
        tips="Đổi ながら thành て sẽ làm thay đổi nghĩa từ 'đồng thời' sang 'tuần tự' — hai câu nghe gần giống nhưng ý khác hẳn.",
        culture="Lưu ý an toàn: 歩きながらスマホを見る (vừa đi vừa xem điện thoại) là hành vi bị cảnh báo nhiều ở Nhật vì gây tai nạn."),

    slide(L, 3,
        "3. Thói quen lặp lại: Vています (mở rộng từ N5)",
        "[Tần suất] + Vています   (hành động lặp đi lặp lại đều đặn theo thời gian)",
        "Đã học ています cho hành động đang diễn ra và trạng thái kết quả (N5 bài 14-15). Nay thêm "
        "nghĩa thứ ba: THÓI QUEN — một hành động lặp lại đều đặn qua thời gian dài.",
        [
            ex(L, 3, 1, [t("t-l28s3-1", "まいあさ", "毎朝", "まいあさ", key=True), t("t-l28s3-2", "、"),
                         t("t-l28s3-3", "さんぽ", "散歩", "さんぽ"), t("t-l28s3-4", "して", key=True),
                         t("t-l28s3-5", "います", "居ます", "います")],
               "Mỗi sáng tôi đều đi dạo. (thói quen lặp lại)"),
            ex(L, 3, 2, [t("t-l28s3-6", "がっこう", "学校", "がっこう"), t("t-l28s3-7", "に"),
                         t("t-l28s3-8", "かよって", "通って", "かよって", key=True), t("t-l28s3-9", "います", "居ます", "います")],
               "Tôi đang đi học (đều đặn)."),
        ],
        tips="Ba nghĩa của ています cần phân biệt qua ngữ cảnh: hành động tức thời (N5 b14), trạng thái kết quả (N5 b15), và thói quen (N4 b28).",
        culture="毎朝散歩しています là câu trả lời phổ biến khi ai đó hỏi bí quyết giữ sức khỏe (健康の秘訣) ở người Nhật cao tuổi."),

    slide(L, 4,
        "4. Tự động từ tiếp diễn: 続いています",
        "N が 続いています   (tình trạng TỰ kéo dài, không cần ai duy trì)",
        "続きます (tự động từ) khác 続けます (tha động từ, tôi CHỦ ĐỘNG duy trì việc gì). "
        "続いています diễn tả một trạng thái/hiện tượng tự nó kéo dài theo thời gian.",
        [
            ex(L, 4, 1, [t("t-l28s4-1", "あめ", "雨", "あめ"), t("t-l28s4-2", "が"),
                         t("t-l28s4-3", "つづいて", "続いて", "つづいて", key=True), t("t-l28s4-4", "います", "居ます", "います")],
               "Trời vẫn đang mưa kéo dài."),
            ex(L, 4, 2, [t("t-l28s4-5", "わたし", "私", "わたし"), t("t-l28s4-6", "は"),
                         t("t-l28s4-7", "うんどう", "運動", "うんどう"), t("t-l28s4-8", "を"),
                         t("t-l28s4-9", "つづけて", "続けて", "つづけて", key=True), t("t-l28s4-10", "います", "居ます", "います")],
               "Tôi vẫn đang duy trì việc tập thể dục. (続けます: tôi CHỦ ĐỘNG)"),
        ],
        tips="Cặp 続く/続ける là ví dụ điển hình của tự động từ/tha động từ — chủ đề chính sẽ học kỹ ở bài 29.",
        culture="天気が悪い日が続いています (những ngày thời tiết xấu cứ kéo dài) là câu than phiền thời tiết rất tự nhiên trong trò chuyện xã giao Nhật."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d-l28-1", "山田さん"), t("d-l28-2", "は"), t("d-l28-3", "しゅみ", "趣味", "しゅみ", key=True),
          t("d-l28-4", "が"), t("d-l28-5", "ありますか", "有りますか", "ありますか")],
         "Anh Yamada có sở thích gì không?"),
    line(L, 2, "山田", "Nhân viên công ty",
         [t("d-l28-6", "まいあさ", "毎朝", "まいあさ", key=True), t("d-l28-7", "、"), t("d-l28-8", "さんぽ", "散歩", "さんぽ"),
          t("d-l28-9", "して", key=True), t("d-l28-10", "います", "居ます", "います"), t("d-l28-11", "。"),
          t("d-l28-12", "もう"), t("d-l28-13", "さんねん", "三年", "さんねん"), t("d-l28-14", "つづけて", "続けて", "つづけて", key=True),
          t("d-l28-15", "います", "居ます", "います")],
         "Tôi đi dạo mỗi sáng. Đã duy trì được ba năm rồi."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d-l28-16", "すごい"), t("d-l28-17", "ですね"), t("d-l28-18", "。"), t("d-l28-19", "さんぽ", "散歩", "さんぽ"),
          t("d-l28-20", "しながら", key=True), t("d-l28-21", "、"), t("d-l28-22", "なに", "何", "なに"),
          t("d-l28-23", "を"), t("d-l28-24", "しますか")],
         "Giỏi thật đấy. Vừa đi dạo anh vừa làm gì vậy?"),
    line(L, 4, "山田", "Nhân viên công ty",
         [t("d-l28-25", "おんがく", "音楽", "おんがく", key=True), t("d-l28-26", "を"), t("d-l28-27", "ききながら", "聞きながら", "ききながら", key=True),
          t("d-l28-28", "、"), t("d-l28-29", "あるきます", "歩きます", "あるきます")],
         "Tôi vừa nghe nhạc vừa đi bộ."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d-l28-30", "わたし", "私", "わたし"), t("d-l28-31", "も"), t("d-l28-32", "うんどう", "運動", "うんどう", key=True),
          t("d-l28-33", "の"), t("d-l28-34", "しゅうかん", "習慣", "しゅうかん", key=True), t("d-l28-35", "を"),
          t("d-l28-36", "つくりたい", "作りたい", "つくりたい"), t("d-l28-37", "です")],
         "Tôi cũng muốn tạo thói quen tập thể dục."),
    line(L, 6, "山田", "Nhân viên công ty",
         [t("d-l28-38", "がんばって", "頑張って", "がんばって"), t("d-l28-39", "ください"), t("d-l28-40", "。"), t("d-l28-41", "さいしょ", "最初", "さいしょ"),
          t("d-l28-42", "は"), t("d-l28-43", "たいへん", "大変", "たいへん"), t("d-l28-44", "でした")],
         "Cố lên nhé. Lúc đầu tôi cũng thấy vất vả lắm."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d-l28-45", "ところで"), t("d-l28-46", "、"), t("d-l28-47", "きょう", "今日", "きょう"), t("d-l28-48", "も"),
          t("d-l28-49", "あめ", "雨", "あめ", key=True), t("d-l28-50", "が"), t("d-l28-51", "つづいて", "続いて", "つづいて", key=True),
          t("d-l28-52", "います", "居ます", "います"), t("d-l28-53", "ね")],
         "À mà, hôm nay trời vẫn mưa kéo dài nhỉ."),
    line(L, 8, "山田", "Nhân viên công ty",
         [t("d-l28-54", "はい"), t("d-l28-55", "。"), t("d-l28-56", "でも"), t("d-l28-57", "、"),
          t("d-l28-58", "さんぽ", "散歩", "さんぽ", key=True), t("d-l28-59", "は"), t("d-l28-60", "つづけて", "続けて", "つづけて", key=True),
          t("d-l28-61", "います", "居ます", "います")],
         "Vâng. Nhưng tôi vẫn duy trì việc đi dạo đấy."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d-l28-62", "あめ", "雨", "あめ"), t("d-l28-63", "の"), t("d-l28-64", "ひ", "日", "ひ"),
          t("d-l28-65", "も"), t("d-l28-66", "さんぽ", "散歩", "さんぽ"), t("d-l28-67", "しますか")],
         "Ngay cả ngày mưa anh cũng đi dạo à?"),
    line(L, 10, "山田", "Nhân viên công ty",
         [t("d-l28-68", "はい"), t("d-l28-69", "。"), t("d-l28-70", "これ"), t("d-l28-71", "は"),
          t("d-l28-72", "わたし", "私", "わたし"), t("d-l28-73", "の"), t("d-l28-74", "きそく", "規則", "きそく", key=True),
          t("d-l28-75", "です"), t("d-l28-76", "から")],
         "Vâng. Vì đây là quy tắc của riêng tôi mà."),
]

EXERCISES = [
    q(L, 1, "「音楽を聞きながら、勉強します」 — hành động CHÍNH trong câu là:",
      ["勉強します (học bài)", "音楽を聞きます (nghe nhạc)",
       "Cả hai đều là hành động chính như nhau", "Không có hành động chính"], 0,
      "Hành động gắn với ながら (聞き) là hành động PHỤ; hành động ở CUỐI câu (勉強します) là hành động CHÍNH.",
      "Xem quy tắc chính/phụ ở slide 1."),
    q(L, 2, "ながら khác V1てV2て (N5 bài 16) ở chỗ:",
      ["ながら là đồng thời (cùng lúc), てV2て là tuần tự (lần lượt theo thời gian)",
       "Hoàn toàn giống nhau", "ながら chỉ dùng cho câu phủ định",
       "てV2て chỉ dùng cho quá khứ"], 0,
      "ながら nhấn mạnh HAI hành động XẢY RA CÙNG LÚC; V1てV2て kể các hành động THEO THỨ TỰ, xảy ra lần lượt.",
      "So sánh hai ví dụ tương phản ở slide 2."),
    q(L, 3, "「毎朝、散歩しています」 — ています ở đây diễn tả:",
      ["Thói quen lặp lại đều đặn", "Hành động đang xảy ra ngay lúc nói",
       "Trạng thái kết quả (đã kết hôn, đã biết...)", "Thì tương lai"], 0,
      "Đây là nghĩa THỨ BA của ています (thói quen) — khác hành động tức thời (N5 b14) và trạng thái kết quả (N5 b15).",
      "Nhớ lại ba nghĩa của ています đã tổng kết ở slide 3."),
    q(L, 4, "続きます và 続けます khác nhau ở:",
      ["続きます là tự động từ (tự kéo dài), 続けます là tha động từ (chủ động duy trì)",
       "Hoàn toàn giống nhau về nghĩa", "続きます chỉ dùng cho thời tiết",
       "続けます là thì quá khứ của 続きます"], 0,
      "Đây là cặp tự động từ/tha động từ: 続く không cần ai chủ động, 続ける cần người chủ động duy trì.",
      "Chủ đề này sẽ học kỹ hơn ở bài 29."),
    q(L, 5, "「雨が 続いています」 nghĩa là:",
      ["Trời vẫn đang mưa kéo dài", "Tôi đang duy trì việc đi dưới mưa",
       "Trời đã tạnh mưa", "Trời sắp mưa"], 0,
      "続いています (tự động từ) diễn tả hiện tượng thời tiết TỰ kéo dài, không có ai chủ động duy trì nó.",
      "So sánh với 続けています (tôi chủ động duy trì việc gì đó)."),
    q(L, 6, "Câu nào ĐÚNG khi nói 'tôi vừa đi bộ vừa nói chuyện điện thoại'?",
      ["歩きながら、電話で話します", "歩いて、電話で話します (nghĩa khác: lần lượt)",
       "歩きます、電話で話しながら", "歩きながらも、電話で話します"], 0,
      "Hai hành động xảy ra ĐỒNG THỜI nên dùng ながら, gắn vào hành động phụ (歩き), hành động chính (話します) ở cuối.",
      "Áp dụng đúng cấu trúc V1(gốc ます)ながら、V2."),
    q(L, 7, "「学校に 通っています」 nghĩa là:",
      ["Tôi đang đi học (một cách đều đặn, thường xuyên)",
       "Tôi đã tốt nghiệp trường đó rồi", "Tôi sắp vào học trường đó",
       "Tôi chỉ đến trường một lần duy nhất"], 0,
      "通っています diễn tả việc ĐI LẠI THƯỜNG XUYÊN, đều đặn — một dạng thói quen kéo dài theo thời gian.",
      "Xem nghĩa của động từ 通う ở phần từ vựng."),
    q(L, 8, "「会社の規則ですから」 — から ở đây có nghĩa:",
      ["Vì, bởi vì (chỉ lý do, giống N5 bài 9)", "Từ (điểm bắt đầu)",
       "Sau khi (thứ tự hành động, N5 bài 15)", "Trích dẫn lời nói"], 0,
      "から ở cuối câu, sau danh từ+です, đây là から chỉ LÝ DO đã học ở N5 bài 9 — không phải から sau thể て (N5 bài 15).",
      "Phân biệt các nghĩa của から đã học qua từng bài."),
    q(L, 9, "Trong hội thoại, Yamada đã duy trì thói quen đi dạo được bao lâu?",
      ["Ba năm", "Một năm", "Sáu tháng", "Mới bắt đầu tuần này"], 0,
      "Yamada nói 「もう三年 続けています」.",
      "Xem câu thoại thứ 2."),
    q(L, 10, "Vừa đi dạo, Yamada vừa làm gì?",
      ["Vừa nghe nhạc vừa đi bộ", "Vừa đọc báo vừa đi bộ",
       "Vừa gọi điện vừa đi bộ", "Không làm gì thêm"], 0,
      "Yamada trả lời 「音楽を聞きながら、歩きます」.",
      "Xem câu thoại thứ 4."),
]

LESSON = lesson(
    L,
    "Bài 28: Hành động đồng thời (〜ながら) & Thói quen (〜ています)",
    "Nối hai hành động cùng chủ thể xảy ra ĐỒNG THỜI bằng V(gốc ます)ながら (khác V1てV2て tuần "
    "tự, N5 bài 16), mở rộng ています sang nghĩa thứ ba là THÓI QUEN lặp lại, và giới thiệu cặp "
    "tự động từ/tha động từ 続く/続ける làm nền cho bài 29.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
