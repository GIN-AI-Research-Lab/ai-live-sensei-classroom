# -*- coding: utf-8 -*-
"""N4 — Bai 48: The sai khien (使役形: V-させる).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 48
pool = Pool("n4")

VOCAB = [
    v(1,  "いかせます", "行かせます", "いかせます", "ikasemasu", "verb", "Bắt/cho đi (thể sai khiến của 行きます)", "行く (nhóm 1) → 行かせる: đổi đuôi う→あ, thêm せる.", L),
    v(2,  "たべさせます", "食べさせます", "たべさせます", "tabesasemasu", "verb", "Bắt/cho ăn (thể sai khiến của 食べます)", "食べる (nhóm 2) → 食べさせる: bỏ る, thêm させる.", L),
    v(3,  "させます", "", "", "sasemasu", "verb", "Bắt/cho làm (thể sai khiến của します)", "する → させる (bất quy tắc).", L),
    v(4,  "こさせます", "来させます", "こさせます", "kosasemasu", "verb", "Bắt/cho đến (thể sai khiến của 来ます)", "来る → 来させる (bất quy tắc, đọc こさせる).", L),
    v(5,  "てつだわせます", "手伝わせます", "てつだわせます", "tetsudawasemasu", "verb", "Bắt/cho giúp đỡ", "手伝う → 手伝わせる.", L),
    v(6,  "かたづけさせます", "片付けさせます", "かたづけさせます", "katazukesasemasu", "verb", "Bắt/cho dọn dẹp", "片付ける → 片付けさせる.", L),
    v(7,  "やすませます", "休ませます", "やすませます", "yasumasemasu", "verb", "Cho phép nghỉ (thể sai khiến của 休みます)", "休む → 休ませる. Đã gặp N5 bài 4 (休みます).", L),
    v(8,  "べんきょうさせます", "勉強させます", "べんきょうさせます", "benkyou sasemasu", "verb", "Bắt/cho học", "勉強する → 勉強させる.", L),
    v(9,  "うんどうさせます", "運動させます", "うんどうさせます", "undou sasemasu", "verb", "Bắt/cho tập thể dục", "運動する → 運動させる. Đã gặp bài 27.", L),
    v(10, "こども", "子供", "こども", "kodomo", "noun", "Trẻ con, con cái", "子供に 野菜を 食べさせます = cho/bắt con ăn rau.", L),
    v(11, "おや", "親", "おや", "oya", "noun", "Cha mẹ, bố mẹ", "親は 子供に 勉強させます = cha mẹ bắt con học.", L),
    v(12, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "先生は 学生に 本を 読ませます = thầy giáo cho học sinh đọc sách.", L),
    v(13, "がくせい", "学生", "がくせい", "gakusei", "noun", "Học sinh, sinh viên", "Đã gặp N5 bài 1.", L),
    v(14, "やさい", "野菜", "やさい", "yasai", "noun", "Rau", "Đã gặp N5 bài 6.", L),
    v(15, "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc công ty", "Đã gặp bài 41. 社長は 社員を 休ませました = giám đốc cho nhân viên nghỉ.", L),
    v(16, "しゃいん", "社員", "しゃいん", "shain", "noun", "Nhân viên công ty", "Đã gặp N5 bài 1.", L),
    v(17, "びょうき", "病気", "びょうき", "byouki", "noun", "Bệnh, ốm", "Đã gặp bài 17 (N5).", L),
    v(18, "しゅくだい", "宿題", "しゅくだい", "shukudai", "noun", "Bài tập về nhà", "Đã gặp N5 bài 7.", L),
    v(19, "へや", "部屋", "へや", "heya", "noun", "Căn phòng", "Đã gặp N5 bài 3.", L),
    v(20, "きもち", "気持ち", "きもち", "kimochi", "noun", "Cảm giác, tâm trạng", "行かせて ください = xin hãy cho tôi đi (khiêm nhường, xin phép).", L),
]

KANJI = [
    k(1, "使", "SỬ", 8, ["シ (shi)"], ["つか(う)"], "Sử dụng, sai khiến. Đã gặp bài 15.",
      [("使役", "しえき", "Sai khiến"), ("使います", "つかいます", "Sử dụng")], L),
    k(2, "役", "DỊCH", 7, ["ヤク (yaku)"], [], "Vai trò, nhiệm vụ. Đã gặp bài 42.",
      [("使役", "しえき", "Sai khiến"), ("役に立ちます", "やくにたちます", "Có ích")], L),
    k(3, "親", "THÂN", 16, ["シン (shin)"], ["おや", "した(しい)"], "Cha mẹ; thân thiết.",
      [("親", "おや", "Cha mẹ"), ("両親", "りょうしん", "Cha mẹ (cả hai)"), ("親切", "しんせつ", "Tốt bụng")], L),
    k(4, "野", "DÃ", 11, ["ヤ (ya)"], ["の"], "Đồng ruộng, hoang dã.",
      [("野菜", "やさい", "Rau"), ("野球", "やきゅう", "Bóng chày")], L),
    k(5, "菜", "THÁI", 11, ["サイ (sai)"], ["な"], "Rau, món rau.",
      [("野菜", "やさい", "Rau"), ("菜食", "さいしょく", "Ăn chay")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chia thể sai khiến (使役形)",
        "Nhóm 1: う→あ+せる (行く→行かせる) 　Nhóm 2: bỏ る+させる (食べる→食べさせる) 　する→させる 　来る→来させる",
        "Chú ý: nhóm 1 chia thể sai khiến GIỐNG HỆT thể bị động (bài 37) về phần đổi âm, chỉ khác "
        "đuôi cuối (れる/せる) — nếu đã thuộc thể bị động thì học nhanh hơn nhiều.",
        [
            ex(L, 1, 1, [t("t-l48s1-1", "おや", "親", "おや", key=True), t("t-l48s1-2", "は"),
                         t("t-l48s1-3", "こども", "子供", "こども", key=True), t("t-l48s1-4", "に"),
                         t("t-l48s1-5", "やさい", "野菜", "やさい"), t("t-l48s1-6", "を"),
                         t("t-l48s1-7", "たべさせます", "食べさせます", "たべさせます", key=True)],
               "Cha mẹ bắt con ăn rau."),
            ex(L, 1, 2, [t("t-l48s1-8", "せんせい", "先生", "せんせい", key=True), t("t-l48s1-9", "は"),
                         t("t-l48s1-10", "がくせい", "学生", "がくせい"), t("t-l48s1-11", "に"),
                         t("t-l48s1-12", "ほん", "本", "ほん"), t("t-l48s1-13", "を"),
                         t("t-l48s1-14", "よませます", "読ませます", "よませます", key=True)],
               "Thầy giáo cho học sinh đọc sách."),
        ],
        tips="Người GÂY RA hành động (cha mẹ, thầy giáo) làm chủ ngữ với は/が; người BỊ SAI KHIẾN đánh dấu bằng に.",
        culture="親は子供に野菜を食べさせます phản ánh mối lo chung của phụ huynh Nhật về việc con cái kén ăn rau."),

    slide(L, 2,
        "2. Hai sắc thái của thể sai khiến: BẮT BUỘC và CHO PHÉP",
        "BẮT BUỘC (cưỡng ép, người dưới không muốn) 　vs　CHO PHÉP (cho làm gì đó người dưới MUỐN làm)",
        "Cùng MỘT hình thức chia nhưng ý nghĩa phụ thuộc NGỮ CẢNH: nếu hành động người dưới không "
        "thích thì là ép buộc; nếu hành động họ MUỐN làm thì là cho phép/tạo điều kiện.",
        [
            ex(L, 2, 1, [t("t-l48s2-1", "せんせい", "先生", "せんせい", key=True), t("t-l48s2-2", "は"),
                         t("t-l48s2-3", "がくせい", "学生", "がくせい"), t("t-l48s2-4", "に"),
                         t("t-l48s2-5", "しゅくだい", "宿題", "しゅくだい"), t("t-l48s2-6", "を"),
                         t("t-l48s2-7", "たくさん"), t("t-l48s2-8", "させました", key=True)],
               "Thầy giáo bắt học sinh làm rất nhiều bài tập. (BẮT BUỘC, học sinh không muốn)"),
            ex(L, 2, 2, [t("t-l48s2-9", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l48s2-10", "は"),
                         t("t-l48s2-11", "しゃいん", "社員", "しゃいん"), t("t-l48s2-12", "を"),
                         t("t-l48s2-13", "やすませました", "休ませました", "やすませました", key=True)],
               "Giám đốc cho nhân viên nghỉ. (CHO PHÉP, nhân viên muốn nghỉ)"),
        ],
        tips="Với động từ TỰ THÂN (đi, nghỉ, khóc), thường dùng を cho người bị tác động; với động từ CÓ TÂN NGỮ RIÊNG (ăn, đọc), dùng に để tránh trùng を.",
        culture="Nghỉ phép ở công ty Nhật cần được cấp trên CHO PHÉP (休ませてください: xin cho tôi nghỉ) — cấu trúc sai khiến kết hợp xin phép rất phổ biến."),

    slide(L, 3,
        "3. Xin phép bằng thể sai khiến: V(させて) + ください",
        "V(させて) + ください   (khiêm nhường xin ĐƯỢC LÀM gì đó, không phải xin người khác làm)",
        "Đây là cách dùng ĐẶC BIỆT: người nói dùng thể sai khiến CHO CHÍNH MÌNH để xin phép một "
        "cách khiêm nhường — 'xin hãy cho tôi làm ~' thay vì chỉ nói 'tôi muốn làm ~' (V たいです).",
        [
            ex(L, 3, 1, [t("t-l48s3-1", "きょう", "今日", "きょう"), t("t-l48s3-2", "、"),
                         t("t-l48s3-3", "やすませて", "休ませて", "やすませて", key=True), t("t-l48s3-4", "ください")],
               "Hôm nay, xin hãy cho tôi nghỉ."),
            ex(L, 3, 2, [t("t-l48s3-5", "わたし", "私", "わたし"), t("t-l48s3-6", "に"),
                         t("t-l48s3-7", "てつだわせて", "手伝わせて", "てつだわせて", key=True), t("t-l48s3-8", "ください")],
               "Xin hãy cho tôi giúp đỡ."),
        ],
        tips="Vさせてください lịch sự và khiêm nhường hơn hẳn Vたいです khi xin phép cấp trên/người lớn tuổi — thể hiện mình tôn trọng quyền quyết định của người nghe.",
        culture="休ませてください là câu xin nghỉ phép chuẩn mực nhất trong môi trường công sở Nhật, lịch sự hơn nhiều so với 休みたいです."),

    slide(L, 4,
        "4. So sánh thể sai khiến và thể bị động (bài 37)",
        "Sai khiến (させる): CHỦ NGỮ bắt/cho NGƯỜI KHÁC làm　vs　Bị động (られる): CHỦ NGỮ chịu tác động TỪ người khác",
        "Hai thể chia GẦN GIỐNG NHAU về âm (đặc biệt nhóm 1: せる/れる) nhưng vai trò NGƯỢC HẲN "
        "nhau — chủ động sai khiến người khác, hay bị động chịu ảnh hưởng từ người khác.",
        [
            ex(L, 4, 1, [t("t-l48s4-1", "おや", "親", "おや", key=True), t("t-l48s4-2", "は"),
                         t("t-l48s4-3", "こども", "子供", "こども"), t("t-l48s4-4", "を"),
                         t("t-l48s4-5", "べんきょうさせました", "勉強させました", "べんきょうさせました", key=True)],
               "Cha mẹ bắt con học bài. (sai khiến — cha mẹ là người CHỦ ĐỘNG bắt)"),
            ex(L, 4, 2, [t("t-l48s4-6", "こども", "子供", "こども", key=True), t("t-l48s4-7", "は"),
                         t("t-l48s4-8", "せんせい", "先生", "せんせい"), t("t-l48s4-9", "に"),
                         t("t-l48s4-10", "しかられました", "叱られました", "しかられました")],
               "Đứa trẻ bị thầy giáo mắng. (bị động, bài 37 — đứa trẻ là người CHỊU tác động)"),
        ],
        tips="Kiểm tra nhanh: chủ ngữ là người RA LỆNH/TẠO ĐIỀU KIỆN → sai khiến; chủ ngữ là người NHẬN tác động → bị động — không nhầm hai vai trò này.",
        culture="Cả hai thể đều xuất hiện rất nhiều trong kể chuyện về gia đình, trường học — nơi có quan hệ trên dưới rõ ràng (cha mẹ-con cái, thầy-trò)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d-l48-1", "山田さん"), t("d-l48-2", "の"), t("d-l48-3", "こども", "子供", "こども", key=True),
          t("d-l48-4", "は"), t("d-l48-5", "やさい", "野菜", "やさい", key=True), t("d-l48-6", "が"),
          t("d-l48-7", "すき", "好き", "すき"), t("d-l48-8", "ですか")],
         "Con anh Yamada có thích rau không?"),
    line(L, 2, "山田", "Nhân viên công ty",
         [t("d-l48-9", "いいえ"), t("d-l48-10", "、"), t("d-l48-11", "あまり"), t("d-l48-12", "すき", "好き", "すき"),
          t("d-l48-13", "じゃ ありません"), t("d-l48-14", "。"), t("d-l48-15", "でも"), t("d-l48-16", "、"),
          t("d-l48-17", "けんこう", "健康", "けんこう"), t("d-l48-18", "の"), t("d-l48-19", "ために"),
          t("d-l48-20", "、"), t("d-l48-21", "まいにち", "毎日", "まいにち"), t("d-l48-22", "たべさせて", "食べさせて", "たべさせて", key=True),
          t("d-l48-23", "います", "居ます", "います")],
         "Không, cháu không thích lắm. Nhưng vì sức khỏe, tôi bắt cháu ăn mỗi ngày."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d-l48-24", "たいへんですね", "大変ですね", "たいへんですね"), t("d-l48-25", "。"), t("d-l48-26", "しゅくだい", "宿題", "しゅくだい", key=True),
          t("d-l48-27", "も"), t("d-l48-28", "させて", key=True), t("d-l48-29", "います", "居ます", "います"),
          t("d-l48-30", "か")],
         "Vất vả thật đấy nhỉ. Anh cũng bắt cháu làm bài tập à?"),
    line(L, 4, "山田", "Nhân viên công ty",
         [t("d-l48-31", "はい"), t("d-l48-32", "、"), t("d-l48-33", "まいにち", "毎日", "まいにち"),
          t("d-l48-34", "すこし"), t("d-l48-35", "べんきょうさせて", "勉強させて", "べんきょうさせて", key=True), t("d-l48-36", "います", "居ます", "います")],
         "Vâng, mỗi ngày tôi cho cháu học một chút."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d-l48-37", "いい"), t("d-l48-38", "おやこ", "親子", "おやこ"), t("d-l48-39", "ですね"), t("d-l48-40", "。"),
          t("d-l48-41", "ところで"), t("d-l48-42", "、"), t("d-l48-43", "あした"), t("d-l48-44", "、"),
          t("d-l48-45", "やすませて", "休ませて", "やすませて", key=True), t("d-l48-46", "いただけません", key=True), t("d-l48-47", "か")],
         "Cha con tốt đấy nhỉ. À mà, ngày mai chị có thể cho tôi nghỉ được không?"),
    line(L, 6, "山田", "Nhân viên công ty",
         [t("d-l48-48", "だいじょうぶ", "大丈夫", "だいじょうぶ"), t("d-l48-49", "です", "です", "です"), t("d-l48-50", "よ"),
          t("d-l48-51", "。"), t("d-l48-52", "なにか"), t("d-l48-53", "ありました"), t("d-l48-54", "か")],
         "Được thôi. Có chuyện gì vậy?"),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d-l48-55", "こども", "子供", "こども", key=True), t("d-l48-56", "が"), t("d-l48-57", "びょうき", "病気", "びょうき", key=True),
          t("d-l48-58", "なんです", key=True), t("d-l48-59", "。"), t("d-l48-60", "びょういん", "病院", "びょういん"),
          t("d-l48-61", "に"), t("d-l48-62", "いかせたい", "行かせたい", "いかせたい", key=True), t("d-l48-63", "です")],
         "Con tôi bị ốm ạ. Tôi muốn cho cháu đi bệnh viện."),
    line(L, 8, "山田", "Nhân viên công ty",
         [t("d-l48-64", "それ"), t("d-l48-65", "は"), t("d-l48-66", "たいへんですね", "大変ですね", "たいへんですね"),
          t("d-l48-67", "。"), t("d-l48-68", "ゆっくり"), t("d-l48-69", "やすんで", "休んで", "やすんで"),
          t("d-l48-70", "ください")],
         "Vất vả quá nhỉ. Chị cứ nghỉ ngơi thoải mái đi."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d-l48-71", "ありがとう"), t("d-l48-72", "ございます"), t("d-l48-73", "。"), t("d-l48-74", "しごと", "仕事", "しごと"),
          t("d-l48-75", "は"), t("d-l48-76", "だれ", "誰", "だれ"), t("d-l48-77", "に"), t("d-l48-78", "てつだわせましょう", "手伝わせましょう", "てつだわせましょう", key=True),
          t("d-l48-79", "か")],
         "Cảm ơn anh nhiều. Việc thì để ai giúp đỡ ạ?"),
    line(L, 10, "山田", "Nhân viên công ty",
         [t("d-l48-80", "しんぱいしないで", "心配しないで", "しんぱいしないで"), t("d-l48-81", "ください"), t("d-l48-82", "。"),
          t("d-l48-83", "わたし", "私", "わたし"), t("d-l48-84", "が"), t("d-l48-85", "やります")],
         "Đừng lo. Để tôi lo cho."),
]

EXERCISES = [
    q(L, 1, "Thể sai khiến của 行く (nhóm 1, đuôi く) là:",
      ["行かせる", "行けせる", "行くさせる", "行させる"], 0,
      "Nhóm 1 đổi âm cuối gốc từ điển sang hàng あ, thêm せる: 行く → 行かせる.",
      "Áp dụng quy tắc chia thể sai khiến nhóm 1."),
    q(L, 2, "Thể sai khiến của 食べる (nhóm 2) là:",
      ["食べさせる", "食べせる", "食べいさせる", "食べるさせる"], 0,
      "Nhóm 2 bỏ る, thêm させる: 食べる → 食べさせる.",
      "Áp dụng quy tắc chia thể sai khiến nhóm 2."),
    q(L, 3, "「親は子供に野菜を食べさせます」 — trợ từ に đánh dấu:",
      ["Người BỊ SAI KHIẾN (con) thực hiện hành động", "Người RA LỆNH (cha mẹ)",
       "Vật bị ăn (rau)", "Nơi chốn xảy ra hành động"], 0,
      "に đánh dấu người CHỊU sự sai khiến — người đó thực hiện hành động theo yêu cầu của chủ ngữ.",
      "Xem cấu trúc は…に…を… ở slide 1."),
    q(L, 4, "「先生は学生に宿題をたくさんさせました」 mang sắc thái nào?",
      ["BẮT BUỘC (học sinh có thể không muốn làm nhiều bài tập)",
       "CHO PHÉP (học sinh muốn làm)", "Không có sắc thái gì đặc biệt",
       "Chỉ mang nghĩa cho phép, không bao giờ ép buộc"], 0,
      "Vì làm nhiều bài tập thường không phải điều học sinh mong muốn, câu này mang sắc thái BẮT BUỘC/ép buộc.",
      "Xem hai sắc thái của thể sai khiến ở slide 2."),
    q(L, 5, "「社長は社員を休ませました」 mang sắc thái nào?",
      ["CHO PHÉP (nhân viên muốn nghỉ, giám đốc tạo điều kiện)", "BẮT BUỘC (nhân viên không muốn nghỉ)",
       "Đe dọa nhân viên", "Sa thải nhân viên"], 0,
      "Nghỉ ngơi thường là điều nhân viên MONG MUỐN, nên câu này mang sắc thái CHO PHÉP/tạo điều kiện.",
      "So sánh với câu 4 để thấy hai sắc thái đối lập."),
    q(L, 6, "「休ませてください」 dùng để làm gì?",
      ["Khiêm nhường xin phép được nghỉ (cho CHÍNH MÌNH)", "Ra lệnh người khác nghỉ",
       "Cấm ai đó nghỉ", "Hỏi ai đã nghỉ chưa"], 0,
      "Vさせてください là cách dùng đặc biệt: người nói dùng thể sai khiến CHO CHÍNH MÌNH để xin phép khiêm nhường.",
      "Xem cách dùng đặc biệt này ở slide 3."),
    q(L, 7, "「休ませてください」 lịch sự hơn 「休みたいです」 vì:",
      ["Thể hiện sự tôn trọng quyền quyết định của người nghe (xin ĐƯỢC làm, không chỉ nói muốn làm)",
       "Hoàn toàn giống nhau về mức độ lịch sự", "休みたいです lịch sự hơn",
       "Không có khác biệt gì về sắc thái"], 0,
      "させてください nhấn mạnh việc XIN PHÉP, trong khi たいです chỉ đơn thuần bày tỏ mong muốn cá nhân.",
      "Xem so sánh mức độ lịch sự ở slide 3."),
    q(L, 8, "Thể sai khiến và thể bị động (bài 37) khác nhau ở vai trò CHỦ NGỮ:",
      ["Sai khiến: chủ ngữ CHỦ ĐỘNG bắt/cho người khác làm; Bị động: chủ ngữ CHỊU tác động từ người khác",
       "Hoàn toàn giống nhau", "Sai khiến chỉ dùng cho câu hỏi",
       "Bị động chỉ dùng cho câu phủ định"], 0,
      "Hai thể có vai trò NGƯỢC HẲN: sai khiến là chủ động điều khiển, bị động là chịu ảnh hưởng.",
      "So sánh trực tiếp ở slide 4."),
    q(L, 9, "Trong hội thoại, vì sao Yamada bắt con ăn rau?",
      ["Vì sức khỏe của con", "Vì con thích ăn rau", "Vì bác sĩ yêu cầu", "Không có lý do cụ thể"], 0,
      "Yamada nói 「健康のために、毎日食べさせています」.",
      "Xem câu thoại thứ 2."),
    q(L, 10, "Vì sao Tanaka xin nghỉ làm ngày mai?",
      ["Vì con bị ốm, cần đưa đi bệnh viện", "Vì cô ấy bị ốm",
       "Vì có việc riêng", "Không có lý do cụ thể"], 0,
      "Tanaka nói 「子供が病気なんです。病院に行かせたいです」.",
      "Xem câu thoại thứ 7."),
]

LESSON = lesson(
    L,
    "Bài 48: Thể sai khiến (使役形: V-させる)",
    "Chia thể sai khiến (nhóm 1: う→あ+せる giống thể bị động bài 37 về âm, nhóm 2: bỏ る+させる, "
    "する→させる, 来る→来させる), hai sắc thái BẮT BUỘC/CHO PHÉP tùy ngữ cảnh, cách xin phép khiêm "
    "nhường bằng Vさせてください (lịch sự hơn Vたいです), và so sánh vai trò chủ ngữ đối lập giữa "
    "sai khiến (chủ động điều khiển) và bị động (chịu tác động, bài 37).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
