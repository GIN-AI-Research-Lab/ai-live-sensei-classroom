# -*- coding: utf-8 -*-
"""N2 — Bai 11: Dac trung rieng biet ならではの (doc dao, khong the tim o noi khac) va にふさわしい
(xung dang, phu hop tieu chuan).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n2.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n2_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 11
pool = Pool("n2")

VOCAB = [
    v(1,  "めいぶつ", "名物", "めいぶつ", "meibutsu", "noun", "Đặc sản nổi tiếng", "この町の 名物 = đặc sản của thị trấn này.", L),
    v(2,  "とくしょく", "特色", "とくしょく", "tokushoku", "noun", "Đặc điểm, đặc sắc", "地元の 特色 = đặc điểm của địa phương.", L),
    v(3,  "でんとう", "伝統", "でんとう", "dentou", "noun", "Truyền thống", "伝統的な 料理 = món ăn truyền thống.", L),
    v(4,  "じもと", "地元", "じもと", "jimoto", "noun", "Địa phương, quê nhà", "地元の 人 = người địa phương.", L),
    v(5,  "かんこう", "観光", "かんこう", "kankou", "noun", "Du lịch, tham quan", "Đã gặp N4 bài 26.", L),
    v(6,  "しかく", "資格", "しかく", "shikaku", "noun", "Chứng chỉ, tư cách", "Đã gặp N3 bài 8.", L),
    v(7,  "のうりょく", "能力", "のうりょく", "nouryoku", "noun", "Năng lực", "Đã gặp N3 bài 15.", L),
    v(8,  "ぶんか", "文化", "ぶんか", "bunka", "noun", "Văn hóa", "Đã gặp N3 bài 17.", L),
    v(9,  "まち", "町", "まち", "machi", "noun", "Thị trấn", "Đã gặp N5 bài 1.", L),
    v(10, "しごと", "仕事", "しごと", "shigoto", "noun", "Công việc", "Đã gặp N4 bài 26.", L),
    v(11, "たいど", "態度", "たいど", "taido", "noun", "Thái độ", "Đã gặp N3 bài 5.", L),
    v(12, "せんせい", "先生", "せんせい", "sensei", "noun", "Giáo viên", "Đã gặp N5 bài 1.", L),
    v(13, "にほん", "日本", "にほん", "nihon", "noun", "Nhật Bản", "Đã gặp N4 bài 26.", L),
    v(14, "りょうり", "料理", "りょうり", "ryouri", "noun", "Món ăn", "Đã gặp N3 bài 15.", L),
    v(15, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N4 bài 26.", L),
    v(16, "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc", "Đã gặp N4 bài 41.", L),
    v(17, "けいけん", "経験", "けいけん", "keiken", "noun", "Kinh nghiệm", "Đã gặp N4 bài 26.", L),
    v(18, "じょうず", "上手", "じょうず", "jouzu", "adjective", "Giỏi", "Đã gặp N4 bài 26.", L),
    v(19, "せいかく", "性格", "せいかく", "seikaku", "noun", "Tính cách", "Đã gặp N3 bài 15.", L),
    v(20, "たかい", "高い", "たかい", "takai", "adjective", "Cao", "Đã gặp N4 bài 34.", L),
]

KANJI = [
    k(1, "名", "DANH", 6, ["メイ (mei)"], ["な"], "Tên, nổi tiếng.",
      [("名物", "めいぶつ", "Đặc sản nổi tiếng"), ("有名", "ゆうめい", "Nổi tiếng")], L),
    k(2, "伝", "TRUYỀN", 6, ["デン (den)"], ["つた(える)"], "Truyền đạt, lưu truyền.",
      [("伝統", "でんとう", "Truyền thống"), ("伝えます", "つたえます", "Truyền đạt")], L),
    k(3, "特", "ĐẶC", 10, ["トク (toku)"], [], "Đặc biệt, đặc trưng.",
      [("特色", "とくしょく", "Đặc điểm"), ("特別", "とくべつ", "Đặc biệt")], L),
    k(4, "色", "SẮC", 6, ["ショク (shoku)"], ["いろ"], "Màu sắc, đặc sắc.",
      [("特色", "とくしょく", "Đặc điểm"), ("景色", "けしき", "Phong cảnh")], L),
    k(5, "元", "NGUYÊN", 4, ["ゲン (gen)"], ["もと"], "Nguồn gốc, ban đầu.",
      [("地元", "じもと", "Địa phương"), ("元気", "げんき", "Khỏe mạnh")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Đặc trưng độc đáo (chỉ có ở...): N + ならではの + N2",
        "N(địa phương/người/tổ chức) + ならではの + N2",
        "ならではの diễn tả một điều ĐẶC TRƯNG, ĐỘC ĐÁO CHỈ CÓ Ở N mà KHÔNG THỂ TÌM THẤY ở nơi/"
        "người khác — luôn mang tính CA NGỢI sự độc đáo, đặc sắc, không thể thay thế.",
        [
            ex(L, 1, 1, [t("t-l11s1-1", "この"), t("t-l11s1-2", "まち", "町", "まち", key=True), t("t-l11s1-3", "ならではの", key=True),
                         t("t-l11s1-4", "めいぶつ", "名物", "めいぶつ", key=True), t("t-l11s1-5", "です")],
               "Đây là đặc sản chỉ có ở thị trấn này mới có."),
            ex(L, 1, 2, [t("t-l11s1-6", "にほん", "日本", "にほん", key=True), t("t-l11s1-7", "ならではの", key=True),
                         t("t-l11s1-8", "ぶんか", "文化", "ぶんか", key=True), t("t-l11s1-9", "です")],
               "Đây là văn hóa chỉ có ở Nhật Bản mới có."),
        ],
        tips="ならではの luôn mang nghĩa TÍCH CỰC, KHEN NGỢI — không dùng cho đặc điểm tiêu cực hay tầm thường.",
        culture="Biển quảng cáo du lịch Nhật hay dùng: '地元ならではの味を楽しんでください' (xin hãy thưởng thức hương vị chỉ có ở địa phương này)."),

    slide(L, 2,
        "2. Xứng đáng, phù hợp (đánh giá tiêu chuẩn): N + にふさわしい + N2",
        "N(vai trò/địa vị/hoàn cảnh) + にふさわしい + N2",
        "にふさわしい diễn tả sự PHÙ HỢP/XỨNG ĐÁNG về mặt PHẨM CHẤT, TIÊU CHUẨN giữa một vai trò/"
        "địa vị/hoàn cảnh (N) và điều được đánh giá (N2) — mang tính ĐÁNH GIÁ KHÁCH QUAN, không nhất thiết là độc đáo.",
        [
            ex(L, 2, 1, [t("t-l11s2-1", "この"), t("t-l11s2-2", "しごと", "仕事", "しごと", key=True), t("t-l11s2-3", "に"),
                         t("t-l11s2-4", "ふさわしい", key=True), t("t-l11s2-5", "のうりょく", "能力", "のうりょく", key=True),
                         t("t-l11s2-6", "が"), t("t-l11s2-7", "あります", "有ります", "あります")],
               "Có năng lực xứng đáng với công việc này."),
            ex(L, 2, 2, [t("t-l11s2-8", "せんせい", "先生", "せんせい", key=True), t("t-l11s2-9", "に"),
                         t("t-l11s2-10", "ふさわしい", key=True), t("t-l11s2-11", "たいど", "態度", "たいど", key=True),
                         t("t-l11s2-12", "です")],
               "Đây là thái độ xứng đáng với một giáo viên."),
        ],
        tips="にふさわしい dùng để ĐÁNH GIÁ mức độ TƯƠNG XỨNG — thường thấy trong nhận xét, phỏng vấn tuyển dụng, tiêu chí lựa chọn.",
        culture="Trong đánh giá nhân sự Nhật: '彼は社長にふさわしい人物だ' (anh ấy là người xứng đáng với vị trí giám đốc)."),

    slide(L, 3,
        "3. So sánh ならではの và にふさわしい",
        "ならではの: ĐỘC ĐÁO, không thể thay thế (đặc trưng riêng)　vs　にふさわしい: PHÙ HỢP, xứng đáng (đánh giá theo tiêu chuẩn)",
        "ならではの nhấn TÍNH DUY NHẤT — điều đó CHỈ TỒN TẠI ở N và không nơi nào khác có; にふさ"
        "わしい nhấn SỰ TƯƠNG XỨNG — điều đó có thể tồn tại ở nhiều nơi, nhưng ĐÁP ỨNG ĐÚNG TIÊU CHUẨN của N.",
        [
            ex(L, 3, 1, [t("t-l11s3-1", "この"), t("t-l11s3-2", "まち", "町", "まち", key=True), t("t-l11s3-3", "ならではの", key=True),
                         t("t-l11s3-4", "でんとう", "伝統", "でんとう", key=True), t("t-l11s3-5", "てきな"),
                         t("t-l11s3-6", "りょうり", "料理", "りょうり", key=True), t("t-l11s3-7", "です")],
               "Đây là món ăn truyền thống chỉ có ở thị trấn này. (độc đáo)"),
            ex(L, 3, 2, [t("t-l11s3-8", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l11s3-9", "に"),
                         t("t-l11s3-10", "ふさわしい", key=True), t("t-l11s3-11", "せいかく", "性格", "せいかく", key=True),
                         t("t-l11s3-12", "です")],
               "Đây là tính cách xứng đáng với một giám đốc. (phù hợp tiêu chuẩn, không nhất thiết độc đáo)"),
        ],
        tips="Mẹo: nếu nhấn 'CHỈ Ở ĐÂY MỚI CÓ' → ならではの; nếu nhấn 'ĐÁP ỨNG ĐÚNG TIÊU CHUẨN' → にふさわしい.",
        culture="Cả hai đều là ngữ pháp N2 trọng điểm, thường xuất hiện trong bài đọc hiểu về du lịch, văn hóa địa phương, đánh giá nhân sự."),

    slide(L, 4,
        "4. Kết hợp trong văn phong du lịch và tuyển dụng",
        "この特色は地元ならではのものです。　　N は N2にふさわしいサービス/人物です。",
        "Trong thực tế, tài liệu QUẢNG BÁ DU LỊCH hay dùng ならではの để khen ngợi đặc sản địa "
        "phương; tài liệu TUYỂN DỤNG/đánh giá hay dùng にふさわしい để mô tả người/dịch vụ đáp ứng đúng tiêu chuẩn.",
        [
            ex(L, 4, 1, [t("t-l11s4-1", "この"), t("t-l11s4-2", "とくしょく", "特色", "とくしょく", key=True), t("t-l11s4-3", "は"),
                         t("t-l11s4-4", "じもと", "地元", "じもと", key=True), t("t-l11s4-5", "ならではの", key=True),
                         t("t-l11s4-6", "もの", "物", "もの"), t("t-l11s4-7", "です")],
               "Đặc điểm này là thứ chỉ có ở địa phương mới có."),
            ex(L, 4, 2, [t("t-l11s4-8", "かんこうきゃく", "観光客", "かんこうきゃく", key=True), t("t-l11s4-9", "に"),
                         t("t-l11s4-10", "ふさわしい", key=True), t("t-l11s4-11", "サービス", "サービス", "サービス"),
                         t("t-l11s4-12", "が"), t("t-l11s4-13", "あります", "有ります", "あります")],
               "Có dịch vụ xứng đáng/phù hợp với khách du lịch."),
        ],
        tips="Ghi nhớ ngữ cảnh: quảng bá đặc sản/văn hóa → ならではの; đánh giá con người/dịch vụ theo tiêu chuẩn → にふさわしい.",
        culture="Tờ rơi du lịch Nhật thường kết hợp cả hai: '地元ならではの名物と、観光客にふさわしいおもてなし' (đặc sản chỉ có ở địa phương, và sự tiếp đãi xứng đáng với du khách)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Hướng dẫn viên du lịch",
         [t("d11-1", "これ"), t("d11-2", "は"), t("d11-3", "この"), t("d11-4", "まち", "町", "まち", key=True),
          t("d11-5", "ならではの", key=True), t("d11-6", "めいぶつ", "名物", "めいぶつ", key=True), t("d11-7", "です")],
         "Đây là đặc sản chỉ có ở thị trấn này mới có."),
    line(L, 2, "サントス", "Du khách",
         [t("d11-8", "おいしい"), t("d11-9", "です", "です", "です"), t("d11-10", "ね"), t("d11-11", "。"),
          t("d11-12", "でんとう", "伝統", "でんとう", key=True), t("d11-13", "てきな"), t("d11-14", "りょうり", "料理", "りょうり", key=True),
          t("d11-15", "です", "です", "です"), t("d11-16", "か")],
         "Ngon nhỉ. Đây có phải món ăn truyền thống không?"),
    line(L, 3, "田中", "Hướng dẫn viên du lịch",
         [t("d11-17", "はい"), t("d11-18", "。"), t("d11-19", "じもと", "地元", "じもと", key=True), t("d11-20", "の"),
          t("d11-21", "とくしょく", "特色", "とくしょく", key=True), t("d11-22", "です")],
         "Vâng. Là đặc điểm của địa phương."),
    line(L, 4, "サントス", "Du khách",
         [t("d11-23", "ぶんか", "文化", "ぶんか", key=True), t("d11-24", "も"), t("d11-25", "たいせつ", "大切", "たいせつ"),
          t("d11-26", "です", "です", "です"), t("d11-27", "ね")],
         "Văn hóa cũng quan trọng nhỉ."),
    line(L, 5, "田中", "Hướng dẫn viên du lịch",
         [t("d11-28", "かんこうきゃく", "観光客", "かんこうきゃく", key=True), t("d11-29", "に"), t("d11-30", "ふさわしい", key=True),
          t("d11-31", "サービス", "サービス", "サービス"), t("d11-32", "を"), t("d11-33", "つくって", "作って", "つくって"),
          t("d11-34", "います", "居ます", "います")],
         "Chúng tôi đang tạo ra dịch vụ xứng đáng với khách du lịch."),
    line(L, 6, "サントス", "Du khách",
         [t("d11-35", "しごと", "仕事", "しごと", key=True), t("d11-36", "に"), t("d11-37", "ふさわしい", key=True),
          t("d11-38", "のうりょく", "能力", "のうりょく", key=True), t("d11-39", "が"), t("d11-40", "ひつよう", "必要", "ひつよう"),
          t("d11-41", "です", "です", "です"), t("d11-42", "ね")],
         "Cần có năng lực xứng đáng với công việc nhỉ."),
    line(L, 7, "田中", "Hướng dẫn viên du lịch",
         [t("d11-43", "はい"), t("d11-44", "。"), t("d11-45", "しかく", "資格", "しかく", key=True), t("d11-46", "も"),
          t("d11-47", "ひつよう", "必要", "ひつよう"), t("d11-48", "です")],
         "Vâng. Chứng chỉ cũng cần thiết."),
    line(L, 8, "サントス", "Du khách",
         [t("d11-49", "せんせい", "先生", "せんせい", key=True), t("d11-50", "に"), t("d11-51", "ふさわしい", key=True),
          t("d11-52", "たいど", "態度", "たいど", key=True), t("d11-53", "も"), t("d11-54", "だいじ", "大事", "だいじ"),
          t("d11-55", "です", "です", "です"), t("d11-56", "ね")],
         "Thái độ xứng đáng với một giáo viên cũng quan trọng nhỉ."),
    line(L, 9, "田中", "Hướng dẫn viên du lịch",
         [t("d11-57", "しゃちょう", "社長", "しゃちょう", key=True), t("d11-58", "に"), t("d11-59", "ふさわしい", key=True),
          t("d11-60", "せいかく", "性格", "せいかく", key=True), t("d11-61", "も"), t("d11-62", "ひつよう", "必要", "ひつよう"),
          t("d11-63", "です")],
         "Tính cách xứng đáng với một giám đốc cũng cần thiết."),
    line(L, 10, "サントス", "Du khách",
         [t("d11-64", "にほん", "日本", "にほん", key=True), t("d11-65", "ならではの", key=True), t("d11-66", "けいけん", "経験", "けいけん", key=True),
          t("d11-67", "です", "です", "です"), t("d11-68", "ね")],
         "Đây là kinh nghiệm chỉ có ở Nhật Bản mới có nhỉ."),
]

EXERCISES = [
    q(L, 1, "「この町ならではの名物です」 — ならではの diễn tả điều gì?",
      ["Đặc trưng độc đáo, chỉ có ở nơi/người/tổ chức đó mới có, mang tính ca ngợi",
       "Sự phù hợp về tiêu chuẩn", "Sự phủ định hoàn toàn",
       "Sự khẳng định chắc chắn"], 0,
      "ならではの diễn tả một điều ĐỘC ĐÁO, CHỈ CÓ Ở nơi/người/tổ chức đó, không thể tìm thấy ở nơi khác.",
      "Xem cấu trúc ならではの ở slide 1."),
    q(L, 2, "「この仕事にふさわしい能力があります」 — にふさわしい khác ならではの ở điểm nào?",
      ["にふさわしい nhấn sự PHÙ HỢP/xứng đáng theo tiêu chuẩn, không nhất thiết độc đáo",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "にふさわしい chỉ dùng cho câu hỏi", "ならではの chỉ dùng cho phủ định"], 0,
      "にふさわしい đánh giá sự TƯƠNG XỨNG về tiêu chuẩn, khác ならではの nhấn tính DUY NHẤT/độc đáo.",
      "Xem giải thích にふさわしい ở slide 2."),
    q(L, 3, "ならではの có thể dùng cho một đặc điểm TIÊU CỰC/tầm thường không?",
      ["Không, ならではの luôn mang nghĩa TÍCH CỰC, ca ngợi sự độc đáo",
       "Có, dùng được cho cả tích cực lẫn tiêu cực", "Chỉ dùng được cho tiêu cực",
       "Không có quy tắc nào về việc này"], 0,
      "ならではの luôn mang tính KHEN NGỢI — không dùng cho đặc điểm tiêu cực hay tầm thường.",
      "Xem lưu ý ngữ pháp ở slide 1."),
    q(L, 4, "「社長にふさわしい性格です」 nghĩa là:",
      ["Đây là tính cách xứng đáng/phù hợp với vị trí giám đốc",
       "Đây là tính cách chỉ có ở giám đốc mới có (độc nhất)",
       "Giám đốc không có tính cách nào cả", "Tính cách này không phù hợp với ai"], 0,
      "にふさわしい ở đây đánh giá sự TƯƠNG XỨNG giữa tính cách và vị trí giám đốc theo tiêu chuẩn.",
      "Áp dụng cấu trúc Nにふさわしい cho ngữ cảnh câu."),
    q(L, 5, "Trong tài liệu quảng bá du lịch, cấu trúc nào thường được dùng để khen ngợi đặc sản địa phương?",
      ["ならではの", "にふさわしい", "べきだ", "としたら"], 0,
      "ならではの phù hợp để khen ngợi đặc sản/văn hóa ĐỘC ĐÁO của một địa phương cụ thể.",
      "Xem văn hóa sử dụng ở slide 1."),
    q(L, 6, "Trong đánh giá nhân sự/tuyển dụng, cấu trúc nào thường được dùng?",
      ["にふさわしい", "ならではの", "ばかりだ", "one方だ"], 0,
      "にふさわしい phù hợp để đánh giá mức độ TƯƠNG XỨNG của một người với vị trí/vai trò công việc.",
      "Xem văn hóa sử dụng ở slide 2."),
    q(L, 7, "「日本ならではの文化です」 và 「観光客にふさわしいサービス」 khác nhau ở đâu?",
      ["Câu đầu nhấn TÍNH ĐỘC ĐÁO (chỉ Nhật Bản có); câu sau nhấn SỰ PHÙ HỢP (đáp ứng tiêu chuẩn khách du lịch)",
       "Không có gì khác nhau cả", "Câu đầu là quá khứ, câu sau là hiện tại",
       "Câu sau là phủ định của câu đầu"], 0,
      "ならではの nhấn tính DUY NHẤT của văn hóa Nhật; にふさわしい nhấn sự PHÙ HỢP của dịch vụ với khách du lịch.",
      "So sánh hai câu ở slide 3."),
    q(L, 8, "Theo hội thoại, món ăn được giới thiệu có phải đặc sản của thị trấn không?",
      ["Có, là đặc sản chỉ có ở thị trấn này (この町ならではの名物です)",
       "Không, là món ăn phổ biến khắp nơi", "Không được đề cập trong hội thoại",
       "Là món ăn nhập khẩu từ nước ngoài"], 0,
      "田中 nói 「これはこの町ならではの名物です」.",
      "Xem câu thoại thứ 1."),
    q(L, 9, "田中 đang tạo ra điều gì cho khách du lịch?",
      ["Dịch vụ xứng đáng với khách du lịch (観光客にふさわしいサービス)",
       "Không tạo ra gì cả", "Chỉ tạo ra đặc sản, không có dịch vụ",
       "Dịch vụ dành cho người địa phương"], 0,
      "田中 nói 「観光客にふさわしいサービスを作っています」.",
      "Xem câu thoại thứ 5."),
    q(L, 10, "Santos nhận xét gì về kinh nghiệm của mình ở cuối hội thoại?",
      ["Đây là kinh nghiệm chỉ có ở Nhật Bản mới có (日本ならではの経験ですね)",
       "Đây là kinh nghiệm bình thường, không đặc biệt", "Không có kinh nghiệm gì đáng nhớ",
       "Kinh nghiệm này có thể có ở bất cứ đâu"], 0,
      "Santos nói 「日本ならではの経験ですね」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 11: Đặc trưng riêng biệt (ならではの & にふさわしい)",
    "ならではの diễn tả một điều ĐẶC TRƯNG, ĐỘC ĐÁO CHỈ CÓ Ở một địa phương/người/tổ chức cụ thể, "
    "không thể tìm thấy ở nơi khác — luôn mang tính CA NGỢI; にふさわしい diễn tả sự PHÙ HỢP/XỨNG "
    "ĐÁNG về mặt PHẨM CHẤT, TIÊU CHUẨN giữa một vai trò/địa vị và điều được đánh giá — mang tính "
    "ĐÁNH GIÁ KHÁCH QUAN, thường dùng trong quảng bá du lịch (ならではの) và đánh giá nhân sự (にふさわしい).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
