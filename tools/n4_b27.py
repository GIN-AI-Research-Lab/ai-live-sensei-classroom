# -*- coding: utf-8 -*-
"""N4 — Bai 27: The kha nang (可能形) — thay the "ことができます" (N5 bai 18)
bang mot dong tu rieng chia truc tiep tu goc.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md),
ket hop dong tu da hoc o N5 (chia sang the moi khong tinh la sao chep
tu vung -- day la BIEN DOI NGU PHAP tren nen dong tu cu).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 27
pool = Pool("n4")

VOCAB = [
    v(1,  "はなせます", "話せます", "はなせます", "hanasemasu", "verb", "Nói được (thể khả năng của 話します)", "話す (nhóm 1) → 話せる: đổi đuôi う→え, thêm る.", L),
    v(2,  "かけます", "書けます", "かけます", "kakemasu", "verb", "Viết được (thể khả năng của 書きます)", "書く → 書ける.", L),
    v(3,  "およげます", "泳げます", "およげます", "oyogemasu", "verb", "Bơi được", "泳ぐ → 泳げる.", L),
    v(4,  "のめます", "飲めます", "のめます", "nomemasu", "verb", "Uống được", "飲む → 飲める.", L),
    v(5,  "たべられます", "食べられます", "たべられます", "taberaremasu", "verb", "Ăn được (thể khả năng của 食べます)", "食べる (nhóm 2) → 食べられる: bỏ る, thêm られる.", L),
    v(6,  "みられます", "見られます", "みられます", "miraremasu", "verb", "Xem được, nhìn thấy được", "見る (nhóm 2) → 見られる.", L),
    v(7,  "こられます", "来られます", "こられます", "koraremasu", "verb", "Đến được", "来る → 来られる (bất quy tắc, đọc こられる).", L),
    v(8,  "できます", "", "", "dekimasu", "verb", "Làm được", "する → できる (bất quy tắc hoàn toàn, khác âm gốc).", L),
    v(9,  "うんてんします", "運転します", "うんてんします", "unten shimasu", "verb", "Lái xe", "運転できます = lái xe được. Đã gặp N5 bài 17.", L),
    v(10, "かいわ", "会話", "かいわ", "kaiwa", "noun", "Hội thoại, đàm thoại", "英語で 会話できます = có thể đàm thoại bằng tiếng Anh.", L),
    v(11, "すいえい", "水泳", "すいえい", "suiei", "noun", "Môn bơi lội", "水泳が できます = biết bơi (danh từ hành động + できます).", L),
    v(12, "うんどう", "運動", "うんどう", "undou", "noun", "Vận động, thể dục", "運動が できません = tôi không tập thể dục được.", L),
    v(13, "ピアノ", "", "", "piano", "noun", "Đàn piano", "Đã gặp N5 bài 18.", L),
    v(14, "うんてんしゅ", "運転手", "うんてんしゅ", "untenshu", "noun", "Tài xế (nghề)", "運転手に なりたいです = tôi muốn làm tài xế.", L),
    v(15, "だいがくせい", "大学生", "だいがくせい", "daigakusei", "noun", "Sinh viên đại học", "大学生に なったら = khi trở thành sinh viên đại học.", L),
    v(16, "にゅうがくします", "入学します", "にゅうがくします", "nyuugaku shimasu", "verb", "Nhập học", "大学に 入学できました = tôi đã đậu vào đại học (được nhập học).", L),
    v(17, "いじょう", "以上", "いじょう", "ijou", "noun", "Trên, từ ~ trở lên", "18歳 以上 = từ 18 tuổi trở lên (điều kiện để được cấp phép).", L),
    v(18, "いか", "以下", "いか", "ika", "noun", "Dưới, từ ~ trở xuống", "18歳 以下は できません = dưới 18 tuổi thì không làm được.", L),
    v(19, "めんきょ", "免許", "めんきょ", "menkyo", "noun", "Bằng lái, giấy phép", "Đã gặp N5 bài 17. 免許が あれば 運転できます = có bằng thì lái được.", L),
    v(20, "ざんねん", "残念", "ざんねん", "zannen", "adjective", "Tiếc, đáng tiếc", "Tính từ な. 残念ですが、できません = tiếc là tôi không làm được.", L),
]

KANJI = [
    k(1, "運", "VẬN", 12, ["ウン (un)"], ["はこ(ぶ)"], "Vận chuyển, vận may. Đã gặp N5 bài 18.",
      [("運転", "うんてん", "Lái xe"), ("運動", "うんどう", "Vận động"), ("運転手", "うんてんしゅ", "Tài xế")], L),
    k(2, "動", "ĐỘNG", 11, ["ドウ (dou)"], ["うご(く)"], "Chuyển động, hoạt động.",
      [("運動", "うんどう", "Vận động"), ("動きます", "うごきます", "Chuyển động"), ("自動車", "じどうしゃ", "Ô tô")], L),
    k(3, "泳", "VỊNH", 8, ["エイ (ei)"], ["およ(ぐ)"], "Bơi lội. Đã gặp N5 bài 13.",
      [("水泳", "すいえい", "Môn bơi lội"), ("泳げます", "およげます", "Bơi được"), ("平泳ぎ", "ひらおよぎ", "Bơi ếch")], L),
    k(4, "以", "DĨ", 5, ["イ (i)"], [], "Lấy làm mốc; từ (đó).",
      [("以上", "いじょう", "Trở lên"), ("以下", "いか", "Trở xuống"), ("以前", "いぜん", "Trước đây")], L),
    k(5, "残", "TÀN", 10, ["ザン (zan)"], ["のこ(る)"], "Còn lại, tiếc nuối.",
      [("残念", "ざんねん", "Đáng tiếc"), ("残ります", "のこります", "Còn lại"), ("残業", "ざんぎょう", "Làm thêm giờ")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chia thể khả năng — Nhóm 1: đuôi う → え + る",
        "話す→話せる　書く→書ける　泳ぐ→泳げる　飲む→飲める",
        "Nhóm 1 đổi âm cuối của gốc từ điển từ HÀNG う sang HÀNG え, rồi thêm る. Đây là cách gọn "
        "hơn nhiều so với ことができます (N5 bài 18) dù diễn tả cùng ý nghĩa khả năng.",
        [
            ex(L, 1, 1, [t("t-l27s1-1", "にほんご", "日本語", "にほんご"), t("t-l27s1-2", "が"),
                         t("t-l27s1-3", "はなせます", "話せます", "はなせます", key=True)],
               "Tôi nói được tiếng Nhật."),
            ex(L, 1, 2, [t("t-l27s1-4", "うみ", "海", "うみ"), t("t-l27s1-5", "で"),
                         t("t-l27s1-6", "およげます", "泳げます", "およげます", key=True), t("t-l27s1-7", "か")],
               "Anh bơi được ở biển không?"),
        ],
        tips="Đối tượng của động từ khả năng đánh dấu bằng が (không phải を) — giống nhóm 好き/上手 đã học ở N5 bài 9.",
        culture="話せます gọn và tự nhiên hơn 話すことができます rất nhiều trong giao tiếp hằng ngày — dạng ことができます nghe trang trọng, dùng nhiều trong văn viết."),

    slide(L, 2,
        "2. Chia thể khả năng — Nhóm 2 và Nhóm 3",
        "食べる→食べられる（bỏ る thêm られる）　　来る→来られる　　する→できる（bất quy tắc）",
        "Nhóm 2 chỉ cần bỏ る, thêm られる — không có biến âm phức tạp như nhóm 1. する chia HOÀN "
        "TOÀN KHÁC gốc thành できる, phải học thuộc riêng như một từ mới.",
        [
            ex(L, 2, 1, [t("t-l27s2-1", "さしみ", "刺身", "さしみ"), t("t-l27s2-2", "が"),
                         t("t-l27s2-3", "たべられません", "食べられません", "たべられません", key=True)],
               "Tôi không ăn được sashimi."),
            ex(L, 2, 2, [t("t-l27s2-4", "うんてん", "運転", "うんてん", key=True), t("t-l27s2-5", "が"),
                         t("t-l27s2-6", "できます", key=True), t("t-l27s2-7", "か")],
               "Anh lái xe được không?"),
        ],
        tips="できます còn ghép được với DANH TỪ HÀNH ĐỘNG trực tiếp (運転が できます) mà không cần chia động từ gốc — rất tiện lợi.",
        culture="食べられる cũng có dạng nói tắt ら抜き言葉 (食べれる, bỏ ら) rất phổ biến trong khẩu ngữ trẻ, tuy không chuẩn văn viết."),

    slide(L, 3,
        "3. So sánh thể khả năng và ことができます",
        "Vれる／られる (gọn, khẩu ngữ)　=　V(từ điển)ことができます (trang trọng, N5 bài 18)",
        "Hai cách diễn đạt TƯƠNG ĐƯƠNG về nghĩa. Thể khả năng ngắn gọn hơn, dùng nhiều trong nói "
        "chuyện; ことができます trang trọng hơn, thường gặp trong văn bản, hồ sơ, phỏng vấn.",
        [
            ex(L, 3, 1, [t("t-l27s3-1", "ピアノ"), t("t-l27s3-2", "が"), t("t-l27s3-3", "ひけます", "弾けます", "ひけます", key=True)],
               "Tôi chơi được piano. (gọn, thân mật)"),
            ex(L, 3, 2, [t("t-l27s3-4", "ピアノ"), t("t-l27s3-5", "を"), t("t-l27s3-6", "ひく", "弾く", "ひく"),
                         t("t-l27s3-7", "ことが"), t("t-l27s3-8", "できます", key=True)],
               "Tôi có khả năng chơi piano. (trang trọng, giống nghĩa câu trên)"),
        ],
        tips="Trong hồ sơ xin việc, phỏng vấn trang trọng nên ưu tiên ことができます; nói chuyện bạn bè thì thể khả năng ngắn tự nhiên hơn nhiều.",
        culture="免許があれば 運転できます (nếu có bằng thì lái được) — ghép điều kiện ば/たら (N5 bài 25) với thể khả năng rất phổ biến."),

    slide(L, 4,
        "4. Điều kiện độ tuổi: 〜歳以上／以下",
        "[số]歳 + 以上 (từ ~ trở lên) / 以下 (từ ~ trở xuống) + は + [khả năng/quy định]",
        "以上/以下 xác định một MỐC rồi bao gồm CẢ mốc đó — 18歳以上 nghĩa là tính TỪ 18 tuổi trở "
        "lên (bao gồm đúng 18 tuổi), khác 未満 (dưới, không bao gồm mốc — học ở trình độ cao hơn).",
        [
            ex(L, 4, 1, [t("t-l27s4-1", "じゅうはっさい", "18歳", "じゅうはっさい"), t("t-l27s4-2", "いじょう", "以上", "いじょう", key=True),
                         t("t-l27s4-3", "は"), t("t-l27s4-4", "うんてん", "運転", "うんてん"), t("t-l27s4-5", "できます", key=True)],
               "Từ 18 tuổi trở lên thì lái xe được."),
            ex(L, 4, 2, [t("t-l27s4-6", "だいがくせい", "大学生", "だいがくせい", key=True), t("t-l27s4-7", "いか", "以下", "いか", key=True),
                         t("t-l27s4-8", "は"), t("t-l27s4-9", "むりょう", "無料", "むりょう"), t("t-l27s4-10", "です")],
               "Từ sinh viên đại học trở xuống thì miễn phí."),
        ],
        tips="以上/以下 dùng nhiều trong quy định, biển báo, điều kiện tuyển dụng — cần đọc kỹ để biết mốc có được TÍNH VÀO hay không.",
        culture="Biển hiệu quán rượu Nhật luôn ghi 20歳以上 (từ 20 tuổi — độ tuổi hợp pháp uống rượu ở Nhật, khác 18 tuổi ở nhiều nước)."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên năm 2",
         [t("d-l27-1", "サントスさん"), t("d-l27-2", "は"), t("d-l27-3", "うんてん", "運転", "うんてん", key=True),
          t("d-l27-4", "が"), t("d-l27-5", "できます", key=True), t("d-l27-6", "か")],
         "Anh Santos lái xe được không?"),
    line(L, 2, "サントス", "Sinh viên năm 2",
         [t("d-l27-7", "いいえ"), t("d-l27-8", "、"), t("d-l27-9", "できません", key=True), t("d-l27-10", "。"),
          t("d-l27-11", "めんきょ", "免許", "めんきょ", key=True), t("d-l27-12", "が"), t("d-l27-13", "ありません", "有りません", "ありません")],
         "Không, tôi không lái được. Tôi không có bằng lái."),
    line(L, 3, "ワン", "Sinh viên năm 2",
         [t("d-l27-14", "そうですか"), t("d-l27-15", "。"), t("d-l27-16", "じゃ"), t("d-l27-17", "、"),
          t("d-l27-18", "うんどう", "運動", "うんどう", key=True), t("d-l27-19", "は"), t("d-l27-20", "どうですか")],
         "Vậy à. Còn thể thao thì sao?"),
    line(L, 4, "サントス", "Sinh viên năm 2",
         [t("d-l27-21", "すいえい", "水泳", "すいえい", key=True), t("d-l27-22", "が"), t("d-l27-23", "とくい", "得意", "とくい"),
          t("d-l27-24", "です"), t("d-l27-25", "。"), t("d-l27-26", "うみ", "海", "うみ"), t("d-l27-27", "でも"),
          t("d-l27-28", "プール"), t("d-l27-29", "でも"), t("d-l27-30", "およげます", "泳げます", "およげます", key=True)],
         "Bơi lội thì tôi giỏi. Cả biển lẫn hồ bơi tôi đều bơi được."),
    line(L, 5, "ワン", "Sinh viên năm 2",
         [t("d-l27-31", "すごい"), t("d-l27-32", "ですね"), t("d-l27-33", "。"), t("d-l27-34", "がいこくご", "外国語", "がいこくご"),
          t("d-l27-35", "は"), t("d-l27-36", "なに", "何", "なに"), t("d-l27-37", "が"), t("d-l27-38", "はなせます", "話せます", "はなせます", key=True),
          t("d-l27-39", "か")],
         "Giỏi thật đấy. Ngoại ngữ thì anh nói được tiếng gì?"),
    line(L, 6, "サントス", "Sinh viên năm 2",
         [t("d-l27-40", "えいご", "英語", "えいご"), t("d-l27-41", "と"), t("d-l27-42", "すこし", "少し", "すこし"),
          t("d-l27-43", "にほんご", "日本語", "にほんご"), t("d-l27-44", "が"), t("d-l27-45", "はなせます", "話せます", "はなせます")],
         "Tôi nói được tiếng Anh và một chút tiếng Nhật."),
    line(L, 7, "ワン", "Sinh viên năm 2",
         [t("d-l27-46", "ピアノ"), t("d-l27-47", "も"), t("d-l27-48", "ひけます", "弾けます", "ひけます", key=True), t("d-l27-49", "か")],
         "Anh chơi piano được không?"),
    line(L, 8, "サントス", "Sinh viên năm 2",
         [t("d-l27-50", "ざんねん", "残念", "ざんねん", key=True), t("d-l27-51", "です"), t("d-l27-52", "が"),
          t("d-l27-53", "、"), t("d-l27-54", "それ"), t("d-l27-55", "は"), t("d-l27-56", "できません", key=True)],
         "Tiếc là cái đó tôi không làm được."),
    line(L, 9, "ワン", "Sinh viên năm 2",
         [t("d-l27-57", "だいじょうぶ", "大丈夫", "だいじょうぶ"), t("d-l27-58", "です"), t("d-l27-59", "よ"), t("d-l27-60", "。"),
          t("d-l27-61", "だいがくせい", "大学生", "だいがくせい", key=True), t("d-l27-62", "に"), t("d-l27-63", "なったら", key=True),
          t("d-l27-64", "、"), t("d-l27-65", "ならう", "習う", "ならう"), t("d-l27-66", "こと"), t("d-l27-67", "が"),
          t("d-l27-68", "できますよ")],
         "Không sao đâu. Khi thành sinh viên đại học, anh học được mà."),
    line(L, 10, "サントス", "Sinh viên năm 2",
         [t("d-l27-69", "そうですね"), t("d-l27-70", "。"), t("d-l27-71", "がんばります", "頑張ります", "がんばります")],
         "Đúng vậy nhỉ. Tôi sẽ cố gắng."),
]

EXERCISES = [
    q(L, 1, "Thể khả năng của 話す (nhóm 1) là:",
      ["話せる", "話られる", "話できる", "話える"], 0,
      "Nhóm 1 đổi âm cuối gốc từ điển sang hàng え, thêm る: 話す → 話せる.",
      "Áp dụng quy tắc nhóm 1 ở slide 1."),
    q(L, 2, "Thể khả năng của 食べる (nhóm 2) là:",
      ["食べられる", "食べれる (chỉ dùng khẩu ngữ, không chuẩn)", "食べえる", "食べできる"], 0,
      "Nhóm 2 bỏ る, thêm られる: 食べる → 食べられる. Dạng 食べれる (bỏ ら) là khẩu ngữ, không phải chuẩn.",
      "Xem quy tắc nhóm 2 ở slide 2."),
    q(L, 3, "Thể khả năng của する là:",
      ["できる", "しれる", "すきる", "しできる"], 0,
      "する chia hoàn toàn bất quy tắc thành できる — không theo âm gốc する như các nhóm khác.",
      "Đây là trường hợp bất quy tắc phải học thuộc."),
    q(L, 4, "「日本語が話せます」 — vì sao dùng が chứ không phải を?",
      ["Động từ khả năng đánh dấu đối tượng bằng が, giống nhóm 好き/上手 (N5 bài 9)",
       "が là lỗi thừa, phải sửa thành を", "を chỉ dùng cho câu hỏi",
       "が chỉ dùng khi phủ định"], 0,
      "Cùng quy tắc với 好き/上手/欲しい đã học ở N5 — nhóm động từ/tính từ đặc biệt này luôn dùng が.",
      "Nhớ lại quy tắc が đã học ở N5 bài 9, 13."),
    q(L, 5, "話せます và 話すことができます khác nhau ở:",
      ["Nghĩa giống nhau, khác mức độ trang trọng (thể khả năng gọn/khẩu ngữ hơn)",
       "Nghĩa hoàn toàn khác nhau", "話せます sai ngữ pháp",
       "ことができます chỉ dùng cho phủ định"], 0,
      "Hai cách diễn đạt tương đương về nghĩa; thể khả năng ngắn gọn, dùng nhiều trong nói chuyện; ことができます trang trọng hơn.",
      "Xem so sánh ở slide 3."),
    q(L, 6, "「18歳以上は 運転できます」 — 以上 bao gồm cả 18 tuổi không?",
      ["Có, 以上 tính TỪ mốc đó trở lên, bao gồm cả mốc",
       "Không, 18 tuổi không được tính", "以上 chỉ tính trên 18 tuổi, không rõ có 18 không",
       "以上 không liên quan tới tuổi tác"], 0,
      "以上 (trở lên) LUÔN bao gồm chính mốc đó — khác 未満 (dưới, không bao gồm mốc, học ở trình độ cao hơn).",
      "Xem giải thích ở slide 4."),
    q(L, 7, "Câu nào dùng để nói 'tôi không lái xe được vì không có bằng'?",
      ["免許が ありませんから、運転できません", "免許が あります、運転できません",
       "免許が なければ、運転します", "免許が あっても、運転できません"], 0,
      "から (lý do, N5 bài 9) + できません (khả năng phủ định) diễn tả đúng quan hệ nhân quả: không có bằng nên không lái được.",
      "Kết hợp kiến thức から đã học ở N5."),
    q(L, 8, "残念ですが、それはできません — 残念 có nghĩa là:",
      ["Đáng tiếc, tiếc nuối", "Vui mừng", "Tức giận", "Bình thường"], 0,
      "残念 (tính từ な) diễn tả cảm giác tiếc nuối khi không thể đáp ứng được điều gì đó.",
      "Xem nghĩa từ vựng và ngữ cảnh sử dụng trong hội thoại."),
    q(L, 9, "Trong hội thoại, Santos giỏi môn thể thao nào?",
      ["Bơi lội", "Bóng đá", "Chạy bộ", "Không giỏi môn nào"], 0,
      "Santos nói 「水泳が得意です。海でもプールでも泳げます」.",
      "Xem câu thoại thứ 4."),
    q(L, 10, "Santos nói được những ngoại ngữ nào?",
      ["Tiếng Anh và một chút tiếng Nhật", "Chỉ tiếng Anh",
       "Tiếng Anh, Nhật và Pháp", "Không nói được ngoại ngữ nào"], 0,
      "Santos trả lời 「英語と 少し 日本語が話せます」.",
      "Xem câu thoại thứ 6."),
]

LESSON = lesson(
    L,
    "Bài 27: Động từ thể khả năng (可能形)",
    "Chia thể khả năng trực tiếp từ gốc động từ: nhóm 1 đổi đuôi う→え+る, nhóm 2 bỏ る thêm "
    "られる, する bất quy tắc thành できる — gọn hơn ことができます (N5 bài 18) dù tương đương về "
    "nghĩa, kèm điều kiện tuổi tác 〜歳以上／以下.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
