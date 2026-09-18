# -*- coding: utf-8 -*-
"""N2 — Bai 2: Bat dac di ざるを得ない (chu quan, mien cuong) va を余儀なくされる (khach quan, ngoai luc).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n2.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n2_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 2
pool = Pool("n2")

VOCAB = [
    v(1,  "しゅくしょうします", "縮小します", "しゅくしょうします", "shukushou shimasu", "verb", "Thu hẹp, thu nhỏ", "じぎょうを 縮小します = thu hẹp kinh doanh.", L),
    v(2,  "やむをえない", "やむを得ない", "やむをえない", "yamu wo enai", "adjective", "Bất đắc dĩ, không thể tránh khỏi", "やむを得ない 事情 = hoàn cảnh bất khả kháng.", L),
    v(3,  "よぎなくされる", "余儀なくされる", "よぎなくされる", "yoginaku sareru", "expression", "Bị buộc phải (do ngoại lực)", "中止を 余儀なくされました = đã bị buộc phải hủy bỏ.", L),
    v(4,  "じじょう", "事情", "じじょう", "jijou", "noun", "Hoàn cảnh, tình hình", "家庭の 事情 = hoàn cảnh gia đình.", L),
    v(5,  "にゅういんします", "入院します", "にゅういんします", "nyuuin shimasu", "verb", "Nhập viện", "びょういんに 入院します = nhập viện.", L),
    v(6,  "あきらめます", "諦めます", "あきらめます", "akiramemasu", "verb", "Từ bỏ", "Đã gặp N3 bài 4.", L),
    v(7,  "びょうき", "病気", "びょうき", "byouki", "noun", "Bệnh, ốm", "Đã gặp N4 bài 26.", L),
    v(8,  "じこ", "事故", "じこ", "jiko", "noun", "Tai nạn", "Đã gặp N4 bài 34.", L),
    v(9,  "りょこう", "旅行", "りょこう", "ryokou", "noun", "Du lịch", "Đã gặp N4 bài 26.", L),
    v(10, "たいふう", "台風", "たいふう", "taifuu", "noun", "Bão", "Đã gặp N4 bài 34.", L),
    v(11, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N4 bài 26.", L),
    v(12, "ちゅうしします", "中止します", "ちゅうしします", "chuushi shimasu", "verb", "Hủy bỏ", "Đã gặp N3 bài 10.", L),
    v(13, "やすみ", "休み", "やすみ", "yasumi", "noun", "Kỳ nghỉ", "Đã gặp N5 bài 1.", L),
    v(14, "いそがしい", "忙しい", "いそがしい", "isogashii", "adjective", "Bận rộn", "Đã gặp N4 bài 26.", L),
    v(15, "かいぎ", "会議", "かいぎ", "kaigi", "noun", "Cuộc họp", "Đã gặp N4 bài 30.", L),
    v(16, "なります", "成ります", "なります", "narimasu", "verb", "Trở thành", "Đã gặp N5 bài 8.", L),
    v(17, "けいざい", "経済", "けいざい", "keizai", "noun", "Kinh tế", "Đã gặp N3 bài 14.", L),
    v(18, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N5 bài 22.", L),
    v(19, "しごと", "仕事", "しごと", "shigoto", "noun", "Công việc", "Đã gặp N4 bài 26.", L),
    v(20, "かぞく", "家族", "かぞく", "kazoku", "noun", "Gia đình", "Đã gặp N5 bài 1.", L),
]

KANJI = [
    k(1, "余", "DƯ", 7, ["ヨ (yo)"], ["あま(る)"], "Dư thừa, ngoài ra.",
      [("余儀なく", "よぎなく", "Bị buộc phải"), ("余裕", "よゆう", "Dư dả")], L),
    k(2, "儀", "NGHI", 15, ["ギ (gi)"], [], "Nghi thức, cách thức.",
      [("余儀なく", "よぎなく", "Bị buộc phải"), ("儀式", "ぎしき", "Nghi lễ")], L),
    k(3, "縮", "SÚC", 17, ["シュク (shuku)"], ["ちぢ(む)"], "Co lại, thu nhỏ.",
      [("縮小", "しゅくしょう", "Thu hẹp"), ("短縮", "たんしゅく", "Rút ngắn")], L),
    k(4, "情", "TÌNH", 11, ["ジョウ (jou)"], [], "Tình cảm, tình huống.",
      [("事情", "じじょう", "Hoàn cảnh"), ("感情", "かんじょう", "Cảm xúc")], L),
    k(5, "院", "VIỆN", 10, ["イン (in)"], [], "Viện, cơ quan.",
      [("入院", "にゅういん", "Nhập viện"), ("病院", "びょういん", "Bệnh viện")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Bất đắc dĩ phải làm (chủ quan, miễn cưỡng): V(ない-form bỏ ない) + ざるを得ない",
        "V(ない-form, bỏ ない) + ざるを得ない   (する → せざるを得ない, ngoại lệ)",
        "ざるを得ない diễn tả 'BẤT ĐẮC DĨ PHẢI làm' một việc dù KHÔNG MUỐN — mang cảm xúc CHỦ "
        "QUAN của người nói, thường ngụ ý sự MIỄN CƯỠNG, tiếc nuối khi phải chấp nhận.",
        [
            ex(L, 1, 1, [t("t-l2s1-1", "びょうき", "病気", "びょうき", key=True), t("t-l2s1-2", "に"),
                         t("t-l2s1-3", "なった"), t("t-l2s1-4", "ので"), t("t-l2s1-5", "、"),
                         t("t-l2s1-6", "りょこう", "旅行", "りょこう", key=True), t("t-l2s1-7", "を"),
                         t("t-l2s1-8", "あきらめざるを", "諦めざるを", "あきらめざるを", key=True), t("t-l2s1-9", "えません", "得ません", "えません")],
               "Vì bị ốm nên bất đắc dĩ phải từ bỏ chuyến du lịch."),
            ex(L, 1, 2, [t("t-l2s1-10", "かいしゃ", "会社", "かいしゃ", key=True), t("t-l2s1-11", "は"),
                         t("t-l2s1-12", "しゅくしょう", "縮小", "しゅくしょう", key=True), t("t-l2s1-13", "せざるを", key=True),
                         t("t-l2s1-14", "えません", "得ません", "えません")],
               "Bất đắc dĩ phải thu hẹp quy mô kinh doanh của công ty."),
        ],
        tips="する không theo quy tắc thông thường: する→せざるを得ない (KHÔNG phải しざるを得ない).",
        culture="Câu than thở quen thuộc của người đi làm ở Nhật: '忙しくて、休みを諦めざるを得ない' (bận quá, bất đắc dĩ phải từ bỏ kỳ nghỉ)."),

    slide(L, 2,
        "2. Bị buộc phải (khách quan, ngoại lực): N + を余儀なくされる",
        "N + を余儀なくされる",
        "を余儀なくされる diễn tả 'BỊ BUỘC PHẢI' làm một điều gì đó do HOÀN CẢNH KHÁCH QUAN/ngoại "
        "lực (thiên tai, tai nạn, kinh tế) ép buộc — trang trọng hơn ざるを得ない, nhấn NGOẠI LỰC tác động, thường dùng trong tin tức, báo cáo.",
        [
            ex(L, 2, 1, [t("t-l2s2-1", "じこ", "事故", "じこ", key=True), t("t-l2s2-2", "の"),
                         t("t-l2s2-3", "ため"), t("t-l2s2-4", "、"), t("t-l2s2-5", "にゅういん", "入院", "にゅういん", key=True),
                         t("t-l2s2-6", "を"), t("t-l2s2-7", "よぎなく", "余儀なく", "よぎなく", key=True),
                         t("t-l2s2-8", "されました", key=True)],
               "Vì tai nạn, đã bị buộc phải nhập viện."),
            ex(L, 2, 2, [t("t-l2s2-9", "かいしゃ", "会社", "かいしゃ", key=True), t("t-l2s2-10", "は"),
                         t("t-l2s2-11", "しゅくしょう", "縮小", "しゅくしょう", key=True), t("t-l2s2-12", "を"),
                         t("t-l2s2-13", "よぎなく", "余儀なく", "よぎなく", key=True), t("t-l2s2-14", "されました", key=True)],
               "Công ty đã bị buộc phải thu hẹp quy mô kinh doanh."),
        ],
        tips="を余儀なくされる luôn ở dạng BỊ ĐỘNG (される), vì chủ thể là NGƯỜI/TỔ CHỨC BỊ TÁC ĐỘNG bởi hoàn cảnh, không chủ động chọn.",
        culture="Bản tin thời sự Nhật hay dùng: '台風のため、多くの便が欠航を余儀なくされた' (do bão, nhiều chuyến bay đã bị buộc phải hủy)."),

    slide(L, 3,
        "3. So sánh ざるを得ない và を余儀なくされる",
        "ざるを得ない: CHỦ QUAN, cảm xúc miễn cưỡng của người nói　vs　を余儀なくされる: KHÁCH QUAN, ngoại lực ép buộc, trang trọng",
        "ざるを得ない thường dùng khi NGƯỜI NÓI tự thuật lại cảm xúc miễn cưỡng của CHÍNH MÌNH; "
        "を余儀なくされる khách quan hơn, thường dùng ở NGÔI THỨ BA (công ty, tổ chức) và trong văn phong TRANG TRỌNG, tin tức.",
        [
            ex(L, 3, 1, [t("t-l2s3-1", "いそがしい", "忙しい", "いそがしい", key=True), t("t-l2s3-2", "ので"),
                         t("t-l2s3-3", "、"), t("t-l2s3-4", "やすみ", "休み", "やすみ", key=True), t("t-l2s3-5", "を"),
                         t("t-l2s3-6", "あきらめざるを", "諦めざるを", "あきらめざるを", key=True), t("t-l2s3-7", "えません")],
               "Vì bận nên bất đắc dĩ phải từ bỏ kỳ nghỉ. (cảm xúc cá nhân)"),
            ex(L, 3, 2, [t("t-l2s3-8", "たいふう", "台風", "たいふう", key=True), t("t-l2s3-9", "の"),
                         t("t-l2s3-10", "ため"), t("t-l2s3-11", "、"), t("t-l2s3-12", "りょこう", "旅行", "りょこう", key=True),
                         t("t-l2s3-13", "の"), t("t-l2s3-14", "ちゅうし", "中止", "ちゅうし", key=True), t("t-l2s3-15", "を"),
                         t("t-l2s3-16", "よぎなく", "余儀なく", "よぎなく", key=True), t("t-l2s3-17", "されました", key=True)],
               "Vì bão, chuyến du lịch đã bị buộc phải hủy. (ngoại lực khách quan, tin tức)"),
        ],
        tips="Mẹo: câu chuyện CÁ NHÂN, cảm xúc → ざるを得ない; báo cáo/tin tức về TỔ CHỨC, hoàn cảnh khách quan → を余儀なくされる.",
        culture="Cả hai đều là ngữ pháp N2 trọng điểm, hay xuất hiện trong đề đọc hiểu về kinh tế, thiên tai, quyết định kinh doanh."),

    slide(L, 4,
        "4. Nguồn gốc: やむを得ない (tính từ) và やむを得ず (trạng từ)",
        "やむを得ない + N   /   やむを得ず、[hành động]",
        "やむを得ない (nghĩa gốc: 'không thể tránh khỏi') là NGUỒN GỐC của cấu trúc ざるを得ない — "
        "dùng độc lập như TÍNH TỪ bổ nghĩa danh từ (やむを得ない事情), hoặc TRẠNG TỪ やむを得ず (bất đắc dĩ, một cách miễn cưỡng).",
        [
            ex(L, 4, 1, [t("t-l2s4-1", "やむをえない", "やむを得ない", "やむをえない", key=True), t("t-l2s4-2", "じじょう", "事情", "じじょう", key=True),
                         t("t-l2s4-3", "で"), t("t-l2s4-4", "、"), t("t-l2s4-5", "かいぎ", "会議", "かいぎ", key=True),
                         t("t-l2s4-6", "を"), t("t-l2s4-7", "ちゅうし", "中止", "ちゅうし", key=True), t("t-l2s4-8", "します")],
               "Vì hoàn cảnh bất khả kháng, chúng tôi hủy cuộc họp."),
            ex(L, 4, 2, [t("t-l2s4-9", "やむをえず", "やむを得ず", "やむをえず", key=True), t("t-l2s4-10", "、"),
                         t("t-l2s4-11", "りょこう", "旅行", "りょこう", key=True), t("t-l2s4-12", "を"),
                         t("t-l2s4-13", "あきらめました", "諦めました", "あきらめました")],
               "Bất đắc dĩ, tôi đã từ bỏ chuyến du lịch."),
        ],
        tips="やむを得ない事情 (hoàn cảnh bất khả kháng) là cụm từ CỐ ĐỊNH cực kỳ phổ biến trong đơn xin nghỉ, thư xin lỗi công sở Nhật.",
        culture="Đơn xin nghỉ phép ở Nhật thường viết: '家族のやむを得ない事情により、休暇をいただきたく存じます' (do hoàn cảnh gia đình bất khả kháng, tôi xin phép nghỉ)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d2-1", "かいしゃ", "会社", "かいしゃ", key=True), t("d2-2", "の"), t("d2-3", "けいざい", "経済", "けいざい", key=True),
          t("d2-4", "は"), t("d2-5", "どうですか")],
         "Tình hình kinh tế của công ty thế nào?"),
    line(L, 2, "サントス", "Đồng nghiệp",
         [t("d2-6", "じぎょう", "事業", "じぎょう"), t("d2-7", "を"), t("d2-8", "しゅくしょう", "縮小", "しゅくしょう", key=True),
          t("d2-9", "せざるを", key=True), t("d2-10", "えません", "得ません", "えません")],
         "Bất đắc dĩ phải thu hẹp quy mô kinh doanh."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d2-11", "たいふう", "台風", "たいふう", key=True), t("d2-12", "の"), t("d2-13", "ため"),
          t("d2-14", "、"), t("d2-15", "かいぎ", "会議", "かいぎ", key=True), t("d2-16", "も"),
          t("d2-17", "ちゅうし", "中止", "ちゅうし", key=True), t("d2-18", "を"), t("d2-19", "よぎなく", "余儀なく", "よぎなく", key=True),
          t("d2-20", "されました", key=True)],
         "Vì bão, cuộc họp cũng đã bị buộc phải hủy."),
    line(L, 4, "サントス", "Đồng nghiệp",
         [t("d2-21", "それは"), t("d2-22", "たいへん", "大変", "たいへん"), t("d2-23", "です", "です", "です"), t("d2-24", "ね")],
         "Vậy thì vất vả thật nhỉ."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d2-25", "じつは"), t("d2-26", "、"), t("d2-27", "じこ", "事故", "じこ", key=True), t("d2-28", "で"),
          t("d2-29", "にゅういん", "入院", "にゅういん", key=True), t("d2-30", "を"), t("d2-31", "よぎなく", "余儀なく", "よぎなく", key=True),
          t("d2-32", "されました", key=True)],
         "Thực ra, vì tai nạn tôi đã bị buộc phải nhập viện."),
    line(L, 6, "サントス", "Đồng nghiệp",
         [t("d2-33", "だいじょうぶ", "大丈夫", "だいじょうぶ"), t("d2-34", "です", "です", "です"), t("d2-35", "か")],
         "Anh ổn không?"),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d2-36", "はい"), t("d2-37", "。"), t("d2-38", "でも"), t("d2-39", "、"), t("d2-40", "びょうき", "病気", "びょうき", key=True),
          t("d2-41", "の"), t("d2-42", "ため"), t("d2-43", "、"), t("d2-44", "しごと", "仕事", "しごと", key=True),
          t("d2-45", "を"), t("d2-46", "やすまざるを", "休まざるを", "やすまざるを", key=True), t("d2-47", "えません", "得ません", "えません")],
         "Vâng. Nhưng vì bệnh, bất đắc dĩ phải nghỉ làm."),
    line(L, 8, "サントス", "Đồng nghiệp",
         [t("d2-48", "やむをえない", "やむを得ない", "やむをえない", key=True), t("d2-49", "じじょう", "事情", "じじょう", key=True),
          t("d2-50", "です", "です", "です"), t("d2-51", "ね")],
         "Đó là hoàn cảnh bất khả kháng nhỉ."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d2-52", "かぞく", "家族", "かぞく", key=True), t("d2-53", "との"), t("d2-54", "りょこう", "旅行", "りょこう", key=True),
          t("d2-55", "も"), t("d2-56", "やむをえず", "やむを得ず", "やむをえず", key=True), t("d2-57", "あきらめました", "諦めました", "あきらめました")],
         "Chuyến du lịch với gia đình cũng bất đắc dĩ đã phải từ bỏ."),
    line(L, 10, "サントス", "Đồng nghiệp",
         [t("d2-58", "はやく"), t("d2-59", "げんき", "元気", "げんき"), t("d2-60", "に"), t("d2-61", "なって", "成って", "なって"),
          t("d2-62", "ください")],
         "Mong anh sớm khỏe lại."),
]

EXERCISES = [
    q(L, 1, "「病気になったので、旅行を諦めざるを得ません」 — ざるを得ない diễn tả điều gì?",
      ["Bất đắc dĩ phải làm dù không muốn, mang cảm xúc chủ quan miễn cưỡng",
       "Bị buộc phải làm do ngoại lực khách quan", "Sự cho phép làm việc gì đó",
       "Phủ định hoàn toàn việc từ bỏ"], 0,
      "ざるを得ない diễn tả sự MIỄN CƯỠNG chủ quan của người nói khi bất đắc dĩ phải làm gì đó.",
      "Xem cấu trúc ざるを得ない ở slide 1."),
    q(L, 2, "「事故のため、入院を余儀なくされました」 — を余儀なくされる khác ざるを得ない ở điểm nào?",
      ["を余儀なくされる khách quan hơn, nhấn ngoại lực ép buộc, trang trọng hơn",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "を余儀なくされる chỉ dùng cho câu hỏi", "ざるを得ない chỉ dùng cho phủ định"], 0,
      "を余儀なくされる nhấn NGOẠI LỰC KHÁCH QUAN (tai nạn) ép buộc, khác ざるを得ない là cảm xúc chủ quan.",
      "Xem giải thích を余儀なくされる ở slide 2."),
    q(L, 3, "する chia theo cấu trúc ざるを得ない như thế nào?",
      ["せざるを得ない (ngoại lệ, không theo quy tắc thông thường)",
       "しざるを得ない", "するざるを得ない", "しませざるを得ない"], 0,
      "する là ngoại lệ đặc biệt: する→せざるを得ない, KHÔNG phải しざるを得ない.",
      "Xem lưu ý ngữ pháp ở slide 1."),
    q(L, 4, "を余儀なくされる luôn ở dạng nào?",
      ["Bị động (される)", "Chủ động (する)", "Mệnh lệnh", "Nghi vấn"], 0,
      "を余儀なくされる luôn ở dạng BỊ ĐỘNG vì chủ thể là người/tổ chức BỊ TÁC ĐỘNG bởi hoàn cảnh.",
      "Xem ghi chú ở slide 2."),
    q(L, 5, "やむを得ない là nguồn gốc của cấu trúc nào?",
      ["ざるを得ない", "を余儀なくされる", "べきだ", "としたら"], 0,
      "やむを得ない (không thể tránh khỏi) là nguồn gốc ngữ nghĩa của cấu trúc ざるを得ない.",
      "Xem giải thích ở slide 4."),
    q(L, 6, "「やむを得ない事情で、会議を中止します」 — やむを得ない ở đây đóng vai trò gì?",
      ["Tính từ bổ nghĩa cho danh từ 事情 (hoàn cảnh bất khả kháng)",
       "Động từ chính của câu", "Trạng từ bổ nghĩa cho động詞",
       "Không có vai trò ngữ pháp nào"], 0,
      "やむを得ない ở đây là TÍNH TỪ bổ nghĩa trực tiếp cho danh từ 事情 (hoàn cảnh).",
      "Xem cấu trúc やむを得ない+N ở slide 4."),
    q(L, 7, "Khi nào nên dùng ざるを得ない thay vì を余儀なくされる?",
      ["Khi kể chuyện cá nhân, thể hiện cảm xúc miễn cưỡng của chính người nói",
       "Khi viết báo cáo tin tức về tổ chức/công ty", "Khi ra lệnh cho người khác",
       "Không có sự khác biệt về ngữ cảnh sử dụng"], 0,
      "ざるを得ない phù hợp hơn khi người nói tự thuật cảm xúc miễn cưỡng của CHÍNH MÌNH.",
      "Xem mẹo chọn ở slide 3."),
    q(L, 8, "Theo hội thoại, vì sao công ty của Santos phải thu hẹp kinh doanh?",
      ["Không được nêu rõ nguyên nhân cụ thể trong câu (chỉ nói kết quả)",
       "Vì công ty phá sản hoàn toàn", "Vì có quá nhiều nhân viên",
       "Vì lợi nhuận quá cao"], 0,
      "Santos chỉ nói 「事業を縮小せざるを得ません」mà không nêu rõ nguyên nhân cụ thể trong hội thoại.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Vì sao田中 phải nhập viện?",
      ["Vì tai nạn (事故で入院を余儀なくされました)", "Vì bão", "Vì công việc quá nhiều",
       "Không được đề cập trong hội thoại"], 0,
      "田中 nói 「事故で入院を余儀なくされました」.",
      "Xem câu thoại thứ 5."),
    q(L, 10, "田中 đã phải từ bỏ điều gì theo hội thoại?",
      ["Chuyến du lịch với gia đình (家族との旅行も諦めました)",
       "Công việc ở công ty", "Cuộc họp quan trọng", "Không từ bỏ gì cả"], 0,
      "田中 nói 「家族との旅行もやむを得ず諦めました」.",
      "Xem câu thoại thứ 9."),
]

LESSON = lesson(
    L,
    "Bài 2: Bất đắc dĩ & Đành lòng (ざるを得ない & を余儀なくされる)",
    "ざるを得ない diễn tả 'bất đắc dĩ phải làm' dù không muốn — mang cảm xúc CHỦ QUAN, miễn "
    "cưỡng của người nói (する→せざるを得ない, ngoại lệ); を余儀なくされる diễn tả 'bị buộc phải' "
    "do hoàn cảnh KHÁCH QUAN/ngoại lực ép buộc — trang trọng hơn, luôn ở dạng bị động; cả hai đều "
    "bắt nguồn từ やむを得ない (không thể tránh khỏi).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
