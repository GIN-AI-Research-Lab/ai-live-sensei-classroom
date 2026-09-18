# -*- coding: utf-8 -*-
"""N5 — Bài 16: Chuỗi hành động V1て V2て, miêu tả bộ phận N1はN2がA.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 16
pool = Pool("n5")

VOCAB = [
    v(1,  "おきます", "起きます", "おきます", "okimasu", "verb", "Thức dậy", "Đã gặp bài 4 — nay dùng làm hành động đầu chuỗi.", L),
    v(2,  "はをみがきます", "歯を磨きます", "はをみがきます", "ha o migakimasu", "verb", "Đánh răng", "磨きます: nhóm I.", L),
    v(3,  "シャワーをあびます", "シャワーを浴びます", "シャワーをあびます", "shawaa o abimasu", "verb", "Tắm vòi sen", "浴びます: nhóm II.", L),
    v(4,  "でかけます", "出かけます", "でかけます", "dekakemasu", "verb", "Ra ngoài, đi ra", "Nhóm II. Khác 出ます (ra khỏi một nơi cụ thể).", L),
    v(5,  "かえります", "帰ります", "かえります", "kaerimasu", "verb", "Về nhà", "Đã gặp bài 5 — nay dùng làm hành động cuối chuỗi.", L),
    v(6,  "かお", "顔", "かお", "kao", "noun", "Khuôn mặt", "顔を 洗います = rửa mặt.", L),
    v(7,  "め", "目", "め", "me", "noun", "Mắt", "目が 大きいです = mắt to.", L),
    v(8,  "みみ", "耳", "みみ", "mimi", "noun", "Tai", "", L),
    v(9,  "くち", "口", "くち", "kuchi", "noun", "Miệng", "", L),
    v(10, "て", "手", "て", "te", "noun", "Bàn tay", "手が 大きいです = bàn tay to.", L),
    v(11, "あし", "足", "あし", "ashi", "noun", "Chân, bàn chân", "", L),
    v(12, "あたま", "頭", "あたま", "atama", "noun", "Đầu", "頭が いいです = đầu óc thông minh (thành ngữ khen trí tuệ).", L),
    v(13, "からだ", "体", "からだ", "karada", "noun", "Cơ thể, sức khỏe", "体が 丈夫です = cơ thể khỏe mạnh.", L),
    v(14, "せい", "背", "せい", "sei", "noun", "Chiều cao (dáng người)", "背が 高いです = dáng người cao.", L),
    v(15, "かみ", "髪", "かみ", "kami", "noun", "Tóc", "髪が 長いです = tóc dài.", L),
    v(16, "あかるい", "明るい", "あかるい", "akarui", "adjective", "Vui vẻ, cởi mở, sáng sủa", "Tính từ い. Miêu tả tính cách hoặc ánh sáng.", L),
    v(17, "しんせつ", "親切", "しんせつ", "shinsetsu", "adjective", "Tốt bụng, ân cần", "Tính từ な.", L),
    v(18, "やさしい", "優しい", "やさしい", "yasashii", "adjective", "Dịu dàng, hiền hậu", "Tính từ い. Đồng âm với 易しい (dễ, bài 2) nhưng chữ Hán khác.", L),
    v(19, "せびろ", "背広", "せびろ", "sebiro", "noun", "Bộ vest nam", "", L),
    v(20, "いりぐち", "入口", "いりぐち", "いりぐち", "noun", "Lối vào", "Trái nghĩa: 出口 (lối ra).", L),
]

KANJI = [
    k(1, "顔", "NHAN", 18, ["ガン (gan)"], ["かお"], "Khuôn mặt.",
      [("顔", "かお", "Khuôn mặt"), ("洗顔", "せんがん", "Rửa mặt"), ("笑顔", "えがお", "Nụ cười")], L),
    k(2, "目", "MỤC", 5, ["モク (moku)"], ["め"], "Mắt. Hình vẽ con mắt.",
      [("目", "め", "Mắt"), ("目的", "もくてき", "Mục đích"), ("科目", "かもく", "Môn học")], L),
    k(3, "手", "THỦ", 4, ["シュ (shu)"], ["て"], "Bàn tay. Đã gặp ở bài 9 (上手/下手).",
      [("手", "て", "Bàn tay"), ("上手", "じょうず", "Giỏi"), ("手紙", "てがみ", "Lá thư")], L),
    k(4, "足", "TÚC", 7, ["ソク (soku)"], ["あし", "た(りる)"], "Chân; đủ.",
      [("足", "あし", "Chân"), ("足ります", "たります", "Đủ"), ("満足", "まんぞく", "Mãn nguyện")], L),
    k(5, "頭", "ĐẦU", 16, ["トウ (tou)"], ["あたま"], "Đầu.",
      [("頭", "あたま", "Đầu"), ("頭痛", "ずつう", "Đau đầu"), ("先頭", "せんとう", "Hàng đầu")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Nối nhiều hành động: V1て、V2て、V3ます",
        "V1て + V2て + …+ V(cuối)ます   (chỉ chia ます ở ĐỘNG TỪ CUỐI CÙNG)",
        "Muốn kể một chuỗi hành động liên tiếp theo thời gian, chia TẤT CẢ động từ trước đó thành "
        "thể て, chỉ động từ CUỐI CÙNG mới chia ます để chốt thì của cả câu.",
        [
            ex(L, 1, 1, [t("t-l16s1-1", "あさ", "朝", "あさ"), t("t-l16s1-2", "おきて", "起きて", "おきて", key=True),
                         t("t-l16s1-3", "、"), t("t-l16s1-4", "はをみがいて", "歯を磨いて", "はをみがいて", key=True),
                         t("t-l16s1-5", "、"), t("t-l16s1-6", "かいしゃ", "会社", "かいしゃ"),
                         t("t-l16s1-7", "へ"), t("t-l16s1-8", "いきます", "行きます", "いきます")],
               "Buổi sáng tôi thức dậy, đánh răng, rồi đi làm."),
            ex(L, 1, 2, [t("t-l16s1-9", "シャワーを あびて", "シャワーを浴びて", "シャワーをあびて", key=True),
                         t("t-l16s1-10", "、"), t("t-l16s1-11", "でかけます", "出かけます", "でかけます")],
               "Tôi tắm vòi sen rồi ra ngoài."),
        ],
        tips="Nếu chia ます cho từng động từ (起きます、磨きます、行きます) thì thành ba câu rời rạc, mất chất tự nhiên của chuỗi hành động.",
        culture="Trật tự các hành động buổi sáng trong câu ví dụ phản ánh thói quen thường thấy của người Nhật: dậy → vệ sinh cá nhân → ra khỏi nhà."),

    slide(L, 2,
        "2. Ôn Vてから: bắt buộc đúng thứ tự",
        "V1てから、V2 (nhấn mạnh V1 PHẢI xong trước khi V2 bắt đầu)",
        "So với V1て、V2 ở slide 1 (chỉ kể tuần tự), Vてから nhấn mạnh tính BẮT BUỘC của thứ tự — "
        "nếu chưa xong V1 thì V2 không thể/không nên xảy ra.",
        [
            ex(L, 2, 1, [t("t-l16s2-1", "かお", "顔", "かお"), t("t-l16s2-2", "を"),
                         t("t-l16s2-3", "あらって", "洗って", "あらって", key=True), t("t-l16s2-4", "から", key=True),
                         t("t-l16s2-5", "、"), t("t-l16s2-6", "はをみがきます", "歯を磨きます", "はをみがきます")],
               "Rửa mặt xong rồi mới đánh răng."),
        ],
        tips="Cả V1て、V2 và V1てから、V2 đều đúng ngữ pháp — khác biệt chỉ ở mức độ NHẤN MẠNH thứ tự bắt buộc.",
        culture="Người Nhật rất coi trọng đúng trình tự các bước vệ sinh cá nhân, nấu ăn — đây là lý do てから xuất hiện nhiều trong hướng dẫn."),

    slide(L, 3,
        "3. Miêu tả bộ phận/đặc điểm: N1 は N2 が A です",
        "[Toàn thể] + は + [bộ phận/đặc điểm] + が + [tính từ] + です",
        "Cấu trúc HAI CHỦ NGỮ đặc trưng của tiếng Nhật: は đánh dấu chủ đề TOÀN THỂ (người/vật), "
        "が đánh dấu BỘ PHẬN CỤ THỂ được miêu tả — は giới thiệu, が miêu tả chi tiết.",
        [
            ex(L, 3, 1, [t("t-l16s3-1", "やまださん", "山田さん", "やまださん"), t("t-l16s3-2", "は"),
                         t("t-l16s3-3", "め", "目", "め", key=True), t("t-l16s3-4", "が", key=True),
                         t("t-l16s3-5", "おおきい", "大きい", "おおきい"), t("t-l16s3-6", "です")],
               "Anh Yamada có đôi mắt to."),
            ex(L, 3, 2, [t("t-l16s3-7", "ぞう", "象", "ぞう"), t("t-l16s3-8", "は"),
                         t("t-l16s3-9", "はな", "鼻", "はな", key=True), t("t-l16s3-10", "が", key=True),
                         t("t-l16s3-11", "ながい", "長い", "ながい"), t("t-l16s3-12", "です")],
               "Con voi có cái vòi dài."),
            ex(L, 3, 3, [t("t-l16s3-13", "サントスさん"), t("t-l16s3-14", "は"),
                         t("t-l16s3-15", "せい", "背", "せい", key=True), t("t-l16s3-16", "が", key=True),
                         t("t-l16s3-17", "たかい", "高い", "たかい"), t("t-l16s3-18", "です")],
               "Anh Santos có dáng người cao."),
        ],
        tips="Câu trúc này cũng dùng được cho TÍNH CÁCH: 「山田さんは 性格が 明るいです」= anh Yamada tính tình vui vẻ.",
        culture="Khen ngoại hình bằng cấu trúc này rất tự nhiên trong tiếng Nhật, nhưng cần chọn từ cẩn trọng để không mạo phạm."),

    slide(L, 4,
        "4. Miêu tả tính cách bằng N1はN2がA",
        "[Người] + は + [đặc điểm tính cách] + が + いい／親切／優しい",
        "Mở rộng cấu trúc slide 3 sang TÍNH CÁCH thay vì ngoại hình — vẫn giữ nguyên khung "
        "は…が…です, chỉ đổi loại đặc điểm được miêu tả.",
        [
            ex(L, 4, 1, [t("t-l16s4-1", "せんせい", "先生", "せんせい"), t("t-l16s4-2", "は"),
                         t("t-l16s4-3", "せいかく", "性格", "せいかく"), t("t-l16s4-4", "が", key=True),
                         t("t-l16s4-5", "あかるい", "明るい", "あかるい", key=True), t("t-l16s4-6", "です")],
               "Thầy giáo có tính cách vui vẻ."),
            ex(L, 4, 2, [t("t-l16s4-7", "やまださん", "山田さん", "やまださん"), t("t-l16s4-8", "は"),
                         t("t-l16s4-9", "ひと", "人", "ひと"), t("t-l16s4-10", "が", key=True),
                         t("t-l16s4-11", "しんせつ", "親切", "しんせつ", key=True), t("t-l16s4-12", "です")],
               "Anh Yamada là người tốt bụng."),
        ],
        tips="やさしい (優しい, dịu dàng) và やさしい (易しい, dễ, bài 2) đọc GIỐNG NHAU nhưng chữ Hán và nghĩa khác hẳn — phân biệt bằng ngữ cảnh.",
        culture="優しい là lời khen phổ biến nhất về tính cách trong tiếng Nhật, dùng được cho cả nam và nữ."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d-l16-1", "サントスさん"), t("d-l16-2", "は"), t("d-l16-3", "まいあさ", "毎朝", "まいあさ"),
          t("d-l16-4", "なに", "何", "なに"), t("d-l16-5", "を"), t("d-l16-6", "しますか")],
         "Anh Santos mỗi sáng làm gì vậy?"),
    line(L, 2, "サントス", "Sinh viên",
         [t("d-l16-7", "ろくじ", "6時", "ろくじ"), t("d-l16-8", "に"), t("d-l16-9", "おきて", "起きて", "おきて", key=True),
          t("d-l16-10", "、"), t("d-l16-11", "はをみがいて", "歯を磨いて", "はをみがいて", key=True),
          t("d-l16-12", "、"), t("d-l16-13", "シャワーを あびます", "シャワーを浴びます", "シャワーをあびます", key=True)],
         "6 giờ tôi thức dậy, đánh răng, rồi tắm vòi sen."),
    line(L, 3, "ワン", "Sinh viên",
         [t("d-l16-14", "そのあと"), t("d-l16-15", "、"), t("d-l16-16", "なに", "何", "なに"),
          t("d-l16-17", "を"), t("d-l16-18", "しますか")],
         "Sau đó anh làm gì tiếp?"),
    line(L, 4, "サントス", "Sinh viên",
         [t("d-l16-19", "あさごはん", "朝ご飯", "あさごはん"), t("d-l16-20", "を"), t("d-l16-21", "たべて", "食べて", "たべて"),
          t("d-l16-22", "から", key=True), t("d-l16-23", "、"), t("d-l16-24", "でかけます", "出かけます", "でかけます", key=True)],
         "Ăn sáng xong tôi mới ra ngoài."),
    line(L, 5, "ワン", "Sinh viên",
         [t("d-l16-25", "ところで"), t("d-l16-26", "、"), t("d-l16-27", "あたらしい", "新しい", "あたらしい"),
          t("d-l16-28", "せんせい", "先生", "せんせい"), t("d-l16-29", "は"), t("d-l16-30", "どんな"),
          t("d-l16-31", "ひと", "人", "ひと"), t("d-l16-32", "ですか")],
         "À mà, thầy giáo mới là người thế nào vậy?"),
    line(L, 6, "サントス", "Sinh viên",
         [t("d-l16-33", "せんせい", "先生", "せんせい"), t("d-l16-34", "は"), t("d-l16-35", "せい", "背", "せい", key=True),
          t("d-l16-36", "が", key=True), t("d-l16-37", "たかくて", "高くて", "たかくて"), t("d-l16-38", "、"),
          t("d-l16-39", "め", "目", "め", key=True), t("d-l16-40", "が", key=True), t("d-l16-41", "おおきい", "大きい", "おおきい"),
          t("d-l16-42", "です")],
         "Thầy dáng cao, mắt to."),
    line(L, 7, "ワン", "Sinh viên",
         [t("d-l16-43", "せいかく", "性格", "せいかく"), t("d-l16-44", "は"), t("d-l16-45", "どうですか")],
         "Tính cách thầy thế nào?"),
    line(L, 8, "サントス", "Sinh viên",
         [t("d-l16-46", "とても"), t("d-l16-47", "しんせつ", "親切", "しんせつ", key=True), t("d-l16-48", "です"),
          t("d-l16-49", "。"), t("d-l16-50", "ひと", "人", "ひと"), t("d-l16-51", "が", key=True),
          t("d-l16-52", "やさしい", "優しい", "やさしい", key=True), t("d-l16-53", "です")],
         "Thầy rất tốt bụng. Là người dịu dàng."),
    line(L, 9, "ワン", "Sinh viên",
         [t("d-l16-54", "そうですか"), t("d-l16-55", "。"), t("d-l16-56", "はやく"), t("d-l16-57", "あいたい", "会いたい", "あいたい", key=True),
          t("d-l16-58", "です")],
         "Vậy à. Tôi muốn gặp thầy sớm quá."),
    line(L, 10, "サントス", "Sinh viên",
         [t("d-l16-59", "らいしゅう", "来週", "らいしゅう"), t("d-l16-60", "、"), t("d-l16-61", "きょうしつ", "教室", "きょうしつ"),
          t("d-l16-62", "で"), t("d-l16-63", "あいましょう", "会いましょう", "あいましょう")],
         "Tuần sau gặp nhau ở phòng học nhé."),
]

EXERCISES = [
    q(L, 1, "「起きて、歯を磨いて、会社へ 行きます」 — hai động từ đầu chia thể gì?",
      ["Thể て (chỉ động từ cuối chia ます)", "Thể ます như bình thường",
       "Thể từ điển", "Thể quá khứ"], 0,
      "Khi nối nhiều hành động liên tiếp, chỉ động từ CUỐI CÙNG chia ます để chốt thì cả câu, các động từ trước chia thể て.",
      "Xem quy tắc nối chuỗi hành động."),
    q(L, 2, "V1てから、V2 khác V1て、V2 ở chỗ:",
      ["Nhấn mạnh V1 PHẢI xong trước khi V2 bắt đầu", "Không có gì khác nhau",
       "V1てから sai ngữ pháp", "V1て chỉ dùng cho câu phủ định"], 0,
      "Cả hai đều đúng ngữ pháp, nhưng てから nhấn mạnh tính BẮT BUỘC của thứ tự hơn て đơn thuần.",
      "So sánh mức độ nhấn mạnh."),
    q(L, 3, "「山田さんは 目が 大きいです」 — trợ từ は và が đóng vai trò gì?",
      ["は giới thiệu chủ đề toàn thể, が đánh dấu bộ phận được miêu tả",
       "Cả hai đều là chủ ngữ như nhau", "は là tân ngữ", "が là chủ đề"], 0,
      "Đây là cấu trúc HAI CHỦ NGỮ đặc trưng: は cho TOÀN THỂ (người), が cho BỘ PHẬN cụ thể (mắt).",
      "Đọc lại giải thích cấu trúc N1はN2が."),
    q(L, 4, "「象は 鼻が 長いです」 dịch đúng là:",
      ["Con voi có cái vòi dài", "Cái vòi có con voi dài",
       "Con voi dài", "Cái vòi ngắn"], 0,
      "は giới thiệu chủ đề (voi), が đánh dấu bộ phận cụ thể (vòi) có tính chất dài.",
      "Áp dụng đúng cấu trúc N1はN2がA."),
    q(L, 5, "優しい và 易しい khác nhau ở chỗ:",
      ["Đọc giống nhau (やさしい) nhưng nghĩa và chữ Hán khác nhau",
       "Đọc khác nhau hoàn toàn", "Chỉ là một từ duy nhất",
       "優しい chỉ dùng cho vật"], 0,
      "Đây là cặp từ đồng âm dị nghĩa: 優しい (dịu dàng, tính cách) và 易しい (dễ, đã học ở bài 2).",
      "Phân biệt bằng ngữ cảnh câu."),
    q(L, 6, "Cấu trúc N1はN2がA còn dùng để miêu tả điều gì ngoài ngoại hình?",
      ["Tính cách", "Chỉ dùng cho ngoại hình", "Chỉ dùng cho động vật", "Chỉ dùng cho câu hỏi"], 0,
      "Cấu trúc này mở rộng sang miêu tả TÍNH CÁCH: 性格が明るい, 人が親切.",
      "Xem slide 4 về mở rộng cấu trúc."),
    q(L, 7, "Muốn nói 'rửa mặt xong rồi mới đánh răng', câu nào ĐÚNG?",
      ["顔を 洗ってから、歯を 磨きます", "顔を 洗ってから、歯を 磨いてから",
       "顔を 洗って、歯を 磨いてから", "顔を 洗いてから、歯を 磨きます"], 0,
      "V1てから chỉ cần một lần て+から ở hành động ĐẦU, hành động sau chia ます bình thường để kết thúc câu.",
      "Chỉ hành động đầu tiên cần てから."),
    q(L, 8, "出かけます khác 出ます ở chỗ:",
      ["出かけます là ra ngoài nói chung (rời khỏi nhà), 出ます là ra khỏi MỘT nơi cụ thể",
       "Hoàn toàn giống nhau", "出かけます chỉ dùng cho xe cộ",
       "出ます là dạng lịch sự hơn"], 0,
      "出かけます mang nghĩa 'đi ra ngoài' tổng quát (thường từ nhà), còn 出ます cần chỉ rõ RA KHỎI nơi nào.",
      "Xem ghi chú từ vựng của hai từ này."),
    q(L, 9, "Trong hội thoại, thầy giáo mới có đặc điểm ngoại hình gì?",
      ["Dáng cao, mắt to", "Dáng thấp, mắt nhỏ",
       "Tóc dài", "Không được miêu tả"], 0,
      "サントス miêu tả 「先生は 背が高くて、目が大きいです」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Tính cách thầy giáo mới được miêu tả thế nào?",
      ["Tốt bụng và dịu dàng", "Nghiêm khắc", "Ít nói", "Không được nhắc tới"], 0,
      "サントス nói 「とても親切です。人が優しいです」.",
      "Xem câu thoại thứ 8."),
]

LESSON = lesson(
    L,
    "Bài 16: Chuỗi hành động liên tiếp (V1て V2て / Vてから / N1はN2がA)",
    "Nối nhiều hành động theo thứ tự bằng thể て (chỉ động từ cuối chia ます), nhấn mạnh thứ tự "
    "bắt buộc bằng Vてから, và cấu trúc hai chủ ngữ N1はN2がA để miêu tả bộ phận cơ thể, ngoại "
    "hình và tính cách.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
