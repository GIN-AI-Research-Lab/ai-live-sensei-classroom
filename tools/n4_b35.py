# -*- coding: utf-8 -*-
"""N4 — Bai 35: The dieu kien ば/なら.

Bai bien le thu tu ve dieu kien, sau と (N5 b23), たら (N5 b25).
Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 35
pool = Pool("n4")

VOCAB = [
    v(1,  "いけば", "行けば", "いけば", "ikeba", "verb", "Nếu đi (thể ば của 行きます)", "行く (nhóm 1) → 行けば: đổi đuôi く→けば.", L),
    v(2,  "たべれば", "食べれば", "たべれば", "tabereba", "verb", "Nếu ăn (thể ば của 食べます)", "食べる (nhóm 2) → 食べれば: bỏ る, thêm れば.", L),
    v(3,  "すれば", "", "", "sureba", "verb", "Nếu làm (thể ば của します)", "する → すれば (bất quy tắc).", L),
    v(4,  "くれば", "来れば", "くれば", "kureba", "verb", "Nếu đến (thể ば của 来ます)", "来る → 来れば (bất quy tắc, đọc くれば).", L),
    v(5,  "やすければ", "安ければ", "やすければ", "yasukereba", "adjective", "Nếu rẻ (thể ば của tính từ い)", "安い bỏ い, thêm ければ.", L),
    v(6,  "げんきなら", "元気なら", "げんきなら", "genki nara", "adjective", "Nếu khỏe (thể なら của tính từ な)", "Tính từ な/danh từ + なら, không cần です.", L),
    v(7,  "いなか", "田舎", "いなか", "inaka", "noun", "Vùng quê, nông thôn", "田舎に 住むなら、静かな ところが いいです = nếu sống ở quê thì nên chọn nơi yên tĩnh.", L),
    v(8,  "とかい", "都会", "とかい", "tokai", "noun", "Thành thị, đô thị", "都会に 住めば、便利です = nếu sống ở thành thị thì tiện lợi.", L),
    v(9,  "じんこう", "人口", "じんこう", "jinkou", "noun", "Dân số", "人口が 多ければ = nếu dân số đông.", L),
    v(10, "ふべん", "不便", "ふべん", "fuben", "adjective", "Bất tiện", "Tính từ な. 田舎は 不便かもしれません = ở quê có thể bất tiện.", L),
    v(11, "べんり", "便利", "べんり", "benri", "adjective", "Tiện lợi", "Đã gặp N5 bài 8.", L),
    v(12, "しずか", "静か", "しずか", "shizuka", "adjective", "Yên tĩnh", "Đã gặp N5 bài 8.", L),
    v(13, "てんき", "天気", "てんき", "tenki", "noun", "Thời tiết", "Đã gặp N5 bài 21.", L),
    v(14, "おかね", "お金", "おかね", "okane", "noun", "Tiền", "Đã gặp N5 bài 25.", L),
    v(15, "じかん", "時間", "じかん", "jikan", "noun", "Thời gian", "時間が あれば = nếu có thời gian.", L),
    v(16, "りょこう", "旅行", "りょこう", "ryokou", "noun", "Du lịch", "Đã gặp N5 bài 5.", L),
    v(17, "しごと", "仕事", "しごと", "shigoto", "noun", "Công việc", "仕事なら、まかせて ください = nếu là công việc thì cứ giao cho tôi.", L),
    v(18, "にほんご", "日本語", "にほんご", "nihongo", "noun", "Tiếng Nhật", "日本語なら、少し 話せます = nếu là tiếng Nhật thì tôi nói được một chút.", L),
    v(19, "わかりません", "分かりません", "わかりません", "wakarimasen", "phrase", "Không hiểu, không biết", "分からなければ = nếu không hiểu.", L),
    v(20, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "先生に 聞けば = nếu hỏi thầy giáo.", L),
]

KANJI = [
    k(1, "田", "ĐIỀN", 5, ["デン (den)"], ["た"], "Ruộng đồng.",
      [("田舎", "いなか", "Vùng quê"), ("田んぼ", "たんぼ", "Ruộng lúa"), ("水田", "すいでん", "Ruộng nước")], L),
    k(2, "舎", "XÁ", 8, ["シャ (sha)"], [], "Nhà ở, chốn quê mùa (chỉ ghép trong 田舎).",
      [("田舎", "いなか", "Vùng quê"), ("校舎", "こうしゃ", "Tòa nhà trường học")], L),
    k(3, "都", "ĐÔ", 11, ["ト (to)"], ["みやこ"], "Kinh đô, đô thị. Đã gặp N5 bài 19.",
      [("都会", "とかい", "Thành thị"), ("京都", "きょうと", "Kyoto"), ("都市", "とし", "Đô thị")], L),
    k(4, "口", "KHẨU", 3, ["コウ (kou)"], ["くち"], "Miệng, cửa ra vào, đầu mối.",
      [("人口", "じんこう", "Dân số"), ("入口", "いりぐち", "Lối vào"), ("口", "くち", "Miệng")], L),
    k(5, "便", "TIỆN", 9, ["ベン (ben)", "ビン (bin)"], ["たよ(り)"], "Tiện lợi, thư từ.",
      [("便利", "べんり", "Tiện lợi"), ("不便", "ふべん", "Bất tiện"), ("郵便", "ゆうびん", "Bưu điện")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chia thể ば",
        "Nhóm 1: う→え+ば (行く→行けば) 　Nhóm 2: bỏ る+れば (食べる→食べれば) 　い-adj: bỏ い+ければ",
        "ば là thể điều kiện GIẢ ĐỊNH thuần túy, nhấn mạnh QUAN HỆ NHÂN QUẢ giữa điều kiện và kết "
        "quả hơn たら (N5 bài 25) — thường dùng cho quy luật chung, lời khuyên, hoặc giả định trừu tượng.",
        [
            ex(L, 1, 1, [t("t-l35s1-1", "はやく"), t("t-l35s1-2", "いけば", "行けば", "いけば", key=True),
                         t("t-l35s1-3", "、"), t("t-l35s1-4", "まにあいます", "間に合います", "まにあいます")],
               "Nếu đi sớm thì sẽ kịp giờ."),
            ex(L, 1, 2, [t("t-l35s1-5", "やすければ", "安ければ", "やすければ", key=True), t("t-l35s1-6", "、"),
                         t("t-l35s1-7", "かいます", "買います", "かいます")],
               "Nếu rẻ thì tôi mua."),
        ],
        tips="ば nhấn QUAN HỆ NHÂN QUẢ khách quan (nếu A thì tất yếu/thường B) hơn たら — たら linh hoạt hơn cho tình huống cụ thể một lần.",
        culture="安ければ買います là câu trả lời điển hình về thói quen mua sắm, nhấn mạnh giá cả là YẾU TỐ QUYẾT ĐỊNH."),

    slide(L, 2,
        "2. なら: điều kiện về CHỦ ĐỀ đang bàn tới",
        "N/な-adj (bỏ です) + なら 　hoặc　[Câu thể thông thường] + なら",
        "なら khác hẳn ば/たら/と: nó không diễn tả 'nếu SỰ VIỆC xảy ra' mà diễn tả 'NẾU ĐANG NÓI "
        "VỀ chủ đề này thì...' — thường dùng để phản hồi trực tiếp điều người khác vừa nhắc tới.",
        [
            ex(L, 2, 1, [t("t-l35s2-1", "にほんご", "日本語", "にほんご"), t("t-l35s2-2", "なら", key=True),
                         t("t-l35s2-3", "、"), t("t-l35s2-4", "すこし", "少し", "すこし"),
                         t("t-l35s2-5", "はなせます", "話せます", "はなせます")],
               "Nếu là (nói về) tiếng Nhật thì tôi nói được một chút."),
            ex(L, 2, 2, [t("t-l35s2-6", "しごと", "仕事", "しごと"), t("t-l35s2-7", "なら", key=True),
                         t("t-l35s2-8", "、"), t("t-l35s2-9", "まかせて", "任せて", "まかせて"),
                         t("t-l35s2-10", "ください")],
               "Nếu là (chuyện) công việc thì cứ giao cho tôi."),
        ],
        tips="なら PHẢN HỒI lại một chủ đề đã được nhắc tới — khác ba cấu trúc kia luôn ĐẶT RA một điều kiện giả định mới.",
        culture="なら rất tự nhiên khi ai đó vừa hỏi/nói điều gì, mình đáp lại ngay bằng đúng chủ đề đó: 「田舎ですか。田舎なら、静かなところがいいですよ」."),

    slide(L, 3,
        "3. So sánh bốn thể điều kiện: と／たら／ば／なら",
        "と (quy luật tất yếu, N5 b23) / たら (giả định linh hoạt, N5 b25) / ば (nhân quả khách quan) / なら (phản hồi chủ đề)",
        "Bốn cấu trúc đều dịch gần giống 'nếu' nhưng SẮC THÁI khác nhau rõ rệt — chọn đúng cấu "
        "trúc giúp câu nói tự nhiên, đúng ý hơn nhiều so với chỉ ghi nhớ một công thức chung.",
        [
            ex(L, 3, 1, [t("t-l35s3-1", "みぎ", "右", "みぎ"), t("t-l35s3-2", "に"), t("t-l35s3-3", "まがると", "曲がると", "まがると", key=True),
                         t("t-l35s3-4", "、"), t("t-l35s3-5", "ぎんこう", "銀行", "ぎんこう"), t("t-l35s3-6", "が"),
                         t("t-l35s3-7", "あります", "有ります", "あります")],
               "Hễ rẽ phải là có ngân hàng. (と: quy luật tất yếu — N5 bài 23)"),
            ex(L, 3, 2, [t("t-l35s3-8", "でんわ", "電話", "でんわ"), t("t-l35s3-9", "が"),
                         t("t-l35s3-10", "あれば", "有れば", "あれば", key=True), t("t-l35s3-11", "、"),
                         t("t-l35s3-12", "でんわします", "電話します", "でんわします")],
               "Nếu có điện thoại thì tôi sẽ gọi. (ば: điều kiện khách quan)"),
        ],
        tips="Mẹo chọn nhanh: hỏi đường/quy luật → と; kể chuyện/dự định cụ thể → たら; điều kiện chung/lời khuyên → ば; phản hồi chủ đề đã nhắc → なら.",
        culture="Người bản xứ dùng bốn thể này gần như theo bản năng — với người học, chọn たら trong hầu hết tình huống vẫn AN TOÀN nhất vì linh hoạt nhất."),

    slide(L, 4,
        "4. なら với câu tư vấn: đưa lời khuyên theo chủ đề",
        "N なら、[lời khuyên]",
        "Cấu trúc なら + lời khuyên (thường kèm ほうがいい, N4 bài 32) rất phổ biến khi TƯ VẤN, "
        "PHẢN HỒI câu hỏi/tình huống ai đó vừa đưa ra.",
        [
            ex(L, 4, 1, [t("t-l35s4-1", "いなか", "田舎", "いなか", key=True), t("t-l35s4-2", "に"),
                         t("t-l35s4-3", "すむ", "住む", "すむ"), t("t-l35s4-4", "なら", key=True),
                         t("t-l35s4-5", "、"), t("t-l35s4-6", "しずか", "静か", "しずか"), t("t-l35s4-7", "な"),
                         t("t-l35s4-8", "ところ", "所", "ところ"), t("t-l35s4-9", "が"), t("t-l35s4-10", "いいです", key=True)],
               "Nếu định sống ở quê thì nên chọn nơi yên tĩnh."),
            ex(L, 4, 2, [t("t-l35s4-11", "とかい", "都会", "とかい", key=True), t("t-l35s4-12", "は"),
                         t("t-l35s4-13", "べんり", "便利", "べんり"), t("t-l35s4-14", "です"), t("t-l35s4-15", "が"),
                         t("t-l35s4-16", "、"), t("t-l35s4-17", "じんこう", "人口", "じんこう", key=True),
                         t("t-l35s4-18", "が"), t("t-l35s4-19", "おおくて", "多くて", "おおくて"),
                         t("t-l35s4-20", "うるさい", "煩い", "うるさい"), t("t-l35s4-21", "かもしれません")],
               "Thành thị thì tiện lợi, nhưng dân số đông nên có thể ồn ào."),
        ],
        tips="Câu tư vấn theo mẫu 'N なら、ほうがいいですよ' rất chuẩn, lịch sự — dùng nhiều khi bạn bè hỏi ý kiến về lựa chọn cuộc sống.",
        culture="Người Nhật hay so sánh 田舎 (yên tĩnh, bất tiện) và 都会 (tiện lợi, ồn ào, đông đúc) khi bàn về việc chọn nơi sinh sống."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên năm cuối",
         [t("d-l35-1", "そつぎょう", "卒業", "そつぎょう"), t("d-l35-2", "したら"), t("d-l35-3", "、"),
          t("d-l35-4", "いなか", "田舎", "いなか", key=True), t("d-l35-5", "に"), t("d-l35-6", "すもう", "住もう", "すもう"),
          t("d-l35-7", "と"), t("d-l35-8", "おもって", "思って", "おもって"), t("d-l35-9", "います", "居ます", "います")],
         "Sau khi tốt nghiệp, tớ định sống ở vùng quê."),
    line(L, 2, "サントス", "Sinh viên năm cuối",
         [t("d-l35-10", "いなか", "田舎", "いなか", key=True), t("d-l35-11", "なら", key=True), t("d-l35-12", "、"),
          t("d-l35-13", "しずか", "静か", "しずか"), t("d-l35-14", "な"), t("d-l35-15", "ところ", "所", "ところ"),
          t("d-l35-16", "が"), t("d-l35-17", "いいです", key=True), t("d-l35-18", "よ")],
         "Nếu là vùng quê thì cậu nên chọn nơi yên tĩnh đấy."),
    line(L, 3, "ワン", "Sinh viên năm cuối",
         [t("d-l35-19", "でも"), t("d-l35-20", "、"), t("d-l35-21", "いなか", "田舎", "いなか"),
          t("d-l35-22", "は"), t("d-l35-23", "ふべん", "不便", "ふべん", key=True), t("d-l35-24", "じゃ ありません",),
          t("d-l35-25", "か")],
         "Nhưng vùng quê không bất tiện à?"),
    line(L, 4, "サントス", "Sinh viên năm cuối",
         [t("d-l35-26", "すこし"), t("d-l35-27", "ふべん", "不便", "ふべん", key=True), t("d-l35-28", "かもしれません"),
          t("d-l35-29", "。"), t("d-l35-30", "でも"), t("d-l35-31", "、"), t("d-l35-32", "くるま", "車", "くるま"),
          t("d-l35-33", "が"), t("d-l35-34", "あれば", "有れば", "あれば", key=True), t("d-l35-35", "、"),
          t("d-l35-36", "だいじょうぶ", "大丈夫", "だいじょうぶ"), t("d-l35-37", "でしょう")],
         "Có thể hơi bất tiện. Nhưng nếu có xe hơi thì chắc là ổn."),
    line(L, 5, "ワン", "Sinh viên năm cuối",
         [t("d-l35-38", "サントスさん"), t("d-l35-39", "は"), t("d-l35-40", "どうですか")],
         "Còn cậu Santos thì sao?"),
    line(L, 6, "サントス", "Sinh viên năm cuối",
         [t("d-l35-41", "わたし", "私", "わたし"), t("d-l35-42", "は"), t("d-l35-43", "とかい", "都会", "とかい", key=True),
          t("d-l35-44", "の"), t("d-l35-45", "ほう", "方", "ほう"), t("d-l35-46", "が"), t("d-l35-47", "すき", "好き", "すき"),
          t("d-l35-48", "です"), t("d-l35-49", "。"), t("d-l35-50", "とかい", "都会", "とかい"), t("d-l35-51", "なら", key=True),
          t("d-l35-52", "、"), t("d-l35-53", "しごと", "仕事", "しごと", key=True), t("d-l35-54", "を"),
          t("d-l35-55", "みつけやすい", "見つけやすい", "みつけやすい"), t("d-l35-56", "です")],
         "Tớ thích thành thị hơn. Nếu là thành thị thì dễ tìm việc làm."),
    line(L, 7, "ワン", "Sinh viên năm cuối",
         [t("d-l35-57", "たしかに", "確かに", "たしかに"), t("d-l35-58", "。"), t("d-l35-59", "でも"),
          t("d-l35-60", "、"), t("d-l35-61", "じんこう", "人口", "じんこう", key=True), t("d-l35-62", "が"),
          t("d-l35-63", "おおければ", "多ければ", "おおければ", key=True), t("d-l35-64", "、"),
          t("d-l35-65", "うるさい", "煩い", "うるさい"), t("d-l35-66", "でしょう")],
         "Đúng đấy. Nhưng nếu dân số đông thì chắc là ồn ào nhỉ."),
    line(L, 8, "サントス", "Sinh viên năm cuối",
         [t("d-l35-67", "そうですね"), t("d-l35-68", "。"), t("d-l35-69", "でも"), t("d-l35-70", "、"),
          t("d-l35-71", "べんり", "便利", "べんり", key=True), t("d-l35-72", "な"), t("d-l35-73", "ほう", "方", "ほう"),
          t("d-l35-74", "が"), t("d-l35-75", "いい", key=True), t("d-l35-76", "です")],
         "Đúng vậy. Nhưng tớ vẫn thích tiện lợi hơn."),
    line(L, 9, "ワン", "Sinh viên năm cuối",
         [t("d-l35-77", "にほんご", "日本語", "にほんご", key=True), t("d-l35-78", "なら", key=True), t("d-l35-79", "、"),
          t("d-l35-80", "だれ", "誰", "だれ"), t("d-l35-81", "に"), t("d-l35-82", "きけば", "聞けば", "きけば", key=True),
          t("d-l35-83", "いいです", key=True), t("d-l35-84", "か")],
         "Nếu là (thắc mắc về) tiếng Nhật thì nên hỏi ai vậy?"),
    line(L, 10, "サントス", "Sinh viên năm cuối",
         [t("d-l35-85", "せんせい", "先生", "せんせい", key=True), t("d-l35-86", "に"), t("d-l35-87", "きけば", "聞けば", "きけば", key=True),
          t("d-l35-88", "、"), t("d-l35-89", "すぐ"), t("d-l35-90", "わかります", "分かります", "わかります")],
         "Nếu hỏi thầy giáo thì sẽ hiểu ngay thôi."),
]

EXERCISES = [
    q(L, 1, "Thể ば của 行きます (nhóm 1, đuôi く) là:",
      ["行けば", "行くば", "行きば", "行いば"], 0,
      "Nhóm 1 đổi đuôi く thành けば: 行く → 行けば.",
      "Áp dụng quy tắc chia thể ば nhóm 1."),
    q(L, 2, "Thể ば của 安い (tính từ い) là:",
      ["安ければ", "安いば", "安くば", "安かれば"], 0,
      "Tính từ い bỏ い, thêm ければ: 安い → 安ければ.",
      "Áp dụng quy tắc chia thể ば cho tính từ い."),
    q(L, 3, "「日本語なら、少し話せます」 — なら ở đây có nghĩa:",
      ["Nếu đang nói về (chủ đề) tiếng Nhật thì...", "Nếu tiếng Nhật xảy ra thì...",
       "Sau khi học tiếng Nhật thì...", "Trong khi học tiếng Nhật thì..."], 0,
      "なら phản hồi lại CHỦ ĐỀ đã được nhắc tới, khác với と/たら/ば luôn đặt ra điều kiện giả định về sự việc.",
      "Xem đặc điểm riêng của なら ở slide 2."),
    q(L, 4, "So sánh と (N5 b23), たら (N5 b25), ば, なら — điểm khác biệt CHÍNH của なら là:",
      ["なら phản hồi CHỦ ĐỀ đang bàn, ba cái kia đặt điều kiện giả định về SỰ VIỆC",
       "Cả bốn hoàn toàn giống nhau", "なら chỉ dùng cho câu hỏi",
       "と/たら/ば chỉ dùng cho câu phủ định"], 0,
      "Đây là điểm khác biệt bản chất: なら không giả định 'nếu việc X xảy ra' mà là 'nếu đang nói về X'.",
      "Xem tổng kết bốn thể điều kiện ở slide 3."),
    q(L, 5, "「右に曲がると、銀行があります」 nên dùng thể điều kiện nào và tại sao?",
      ["と, vì đây là quy luật/chỉ đường tất yếu luôn đúng (N5 bài 23)",
       "なら, vì đang nói về chủ đề ngân hàng", "ば, vì là điều kiện khách quan chung",
       "Không cấu trúc nào phù hợp"], 0,
      "Chỉ đường là quy luật khách quan LUÔN đúng — と là lựa chọn phù hợp nhất (đã học ở N5 bài 23).",
      "Nhớ lại đặc điểm của と đã học ở N5."),
    q(L, 6, "「仕事なら、任せてください」 nghĩa là:",
      ["Nếu là (chuyện) công việc thì cứ giao cho tôi", "Nếu không có việc thì đừng giao cho tôi",
       "Công việc đã được giao xong rồi", "Tôi không muốn nhận công việc"], 0,
      "なら phản hồi trực tiếp chủ đề 'công việc' vừa được nhắc/ngụ ý trước đó.",
      "Áp dụng đúng nghĩa なら đã học."),
    q(L, 7, "「人口が多ければ、うるさいでしょう」 kết hợp hai cấu trúc nào?",
      ["ば (điều kiện) + でしょう (dự đoán có căn cứ, N4 bài 32)",
       "たら + かもしれません", "と + ほうがいい", "なら + ことにします"], 0,
      "Câu này ghép điều kiện ば với dự đoán でしョう để đưa ra suy luận có căn cứ dựa trên điều kiện giả định.",
      "Kết hợp kiến thức bài 32 và bài 35."),
    q(L, 8, "Trong bốn thể điều kiện, cấu trúc nào AN TOÀN NHẤT để dùng khi chưa chắc chọn đúng?",
      ["たら (N5 bài 25, linh hoạt nhất, dùng được cho hầu hết tình huống)",
       "と (giới hạn nhiều nhất)", "ば (trang trọng, ít linh hoạt hơn たら)",
       "なら (chỉ dùng được khi phản hồi chủ đề)"], 0,
      "たら linh hoạt nhất trong bốn cấu trúc, vế sau có thể là mệnh lệnh/lời mời/ý chí — an toàn cho người mới học.",
      "Xem mẹo chọn nhanh ở slide 3."),
    q(L, 9, "Trong hội thoại, Wang định sống ở đâu sau khi tốt nghiệp?",
      ["Vùng quê (田舎)", "Thành thị (都会)", "Nước ngoài", "Chưa quyết định"], 0,
      "Wang nói 「田舎に住もうと思っています」.",
      "Xem câu thoại đầu tiên."),
    q(L, 10, "Santos thích sống ở đâu và vì sao?",
      ["Thành thị, vì dễ tìm việc làm", "Vùng quê, vì yên tĩnh",
       "Không có ý kiến gì", "Nước ngoài, vì lương cao"], 0,
      "Santos nói 「都会の方が好きです。都会なら、仕事を見つけやすいです」.",
      "Xem câu thoại thứ 6."),
]

LESSON = lesson(
    L,
    "Bài 35: Thể điều kiện (〜ば / 〜なら)",
    "Chia thể ば (nhóm 1: う→えば, nhóm 2: bỏ る+れば, tính từ い: bỏ い+ければ) diễn tả quan hệ "
    "nhân quả khách quan, và なら phản hồi CHỦ ĐỀ đang được nhắc tới (khác hẳn と/たら/ば luôn đặt "
    "điều kiện giả định về sự việc) — tổng kết bốn thể điều kiện と/たら/ば/なら và cách chọn đúng "
    "theo ngữ cảnh.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
