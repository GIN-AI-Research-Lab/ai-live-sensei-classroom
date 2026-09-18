# -*- coding: utf-8 -*-
"""N4 — Bai 37: The bi dong (受身形).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 37
pool = Pool("n4")

VOCAB = [
    v(1,  "しかられます", "叱られます", "しかられます", "shikararemasu", "verb", "Bị mắng (thể bị động của 叱る)", "叱る (nhóm 1) → 叱られる: đổi đuôi う→あ, thêm れる.", L),
    v(2,  "ほめられます", "褒められます", "ほめられます", "homeraremasu", "verb", "Được khen (thể bị động của 褒める)", "褒める (nhóm 2) → 褒められる: bỏ る, thêm られる.", L),
    v(3,  "ぬすまれます", "盗まれます", "ぬすまれます", "nusumaremasu", "verb", "Bị trộm mất (thể bị động của 盗む)", "盗む → 盗まれる.", L),
    v(4,  "ふまれます", "踏まれます", "ふまれます", "fumaremasu", "verb", "Bị giẫm phải (thể bị động của 踏む)", "踏む → 踏まれる.", L),
    v(5,  "なかれます", "泣かれます", "なかれます", "nakaremasu", "verb", "Bị (ai đó) khóc (bị động PHIỀN TOÁI)", "泣く → 泣かれる. Câu 'bị làm phiền' kiểu Nhật đặc trưng, không có tương đương trực tiếp trong tiếng Việt.", L),
    v(6,  "おどろかれます", "驚かれます", "おどろかれます", "odorokaremasu", "verb", "Khiến ai đó ngạc nhiên (bị động)", "驚く → 驚かれる.", L),
    v(7,  "たてられます", "建てられます", "たてられます", "tateraremasu", "verb", "Được xây dựng (thể bị động của 建てる)", "建てる → 建てられる. Bị động TRUNG TÍNH, chỉ nói về sự kiện khách quan.", L),
    v(8,  "しょうたいされます", "招待されます", "しょうたいされます", "shoutai saremasu", "verb", "Được mời", "招待する → 招待される. される: thể bị động của する.", L),
    v(9,  "つくられます", "作られます", "つくられます", "tsukuraremasu", "verb", "Được làm ra, được chế tạo", "作る → 作られる.", L),
    v(10, "よばれます", "呼ばれます", "よばれます", "yobaremasu", "verb", "Được gọi là", "呼ぶ → 呼ばれる. 富士山と 呼ばれています = được gọi là núi Phú Sĩ.", L),
    v(11, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "先生に 叱られました = tôi đã bị thầy giáo mắng.", L),
    v(12, "どろぼう", "泥棒", "どろぼう", "dorobou", "noun", "Kẻ trộm", "泥棒に 財布を 盗まれました = tôi bị kẻ trộm lấy mất ví.", L),
    v(13, "さいふ", "財布", "さいふ", "saifu", "noun", "Ví tiền", "Đã gặp N5 bài 13.", L),
    v(14, "あめ", "雨", "あめ", "ame", "noun", "Mưa", "雨に 降られました = tôi bị (dính) mưa (bị động phiền toái).", L),
    v(15, "でんしゃ", "電車", "でんしゃ", "densha", "noun", "Tàu điện", "電車の中で 足を 踏まれました = tôi bị giẫm chân trong tàu điện.", L),
    v(16, "あし", "足", "あし", "ashi", "noun", "Chân, bàn chân", "Đã gặp N5 bài 16.", L),
    v(17, "パーティー", "", "", "paatii", "noun", "Bữa tiệc", "パーティーに 招待されました = tôi đã được mời dự tiệc.", L),
    v(18, "せかいじゅう", "世界中", "せかいじゅう", "sekaijuu", "noun", "Khắp thế giới", "世界中で 知られています = được biết đến khắp thế giới.", L),
    v(19, "ゆうめい", "有名", "ゆうめい", "yuumei", "adjective", "Nổi tiếng", "Đã gặp N5 bài 8.", L),
    v(20, "こうじょう", "工場", "こうじょう", "koujou", "noun", "Nhà máy", "この 車は 日本の 工場で 作られました = xe này được sản xuất ở nhà máy Nhật Bản.", L),
]

KANJI = [
    k(1, "受", "THỤ", 8, ["ジュ (ju)"], ["う(ける)"], "Nhận, tiếp nhận.",
      [("受身", "うけみ", "Thể bị động"), ("受けます", "うけます", "Nhận, chịu"), ("受付", "うけつけ", "Quầy lễ tân")], L),
    k(2, "身", "THÂN", 7, ["シン (shin)"], ["み"], "Thân thể, bản thân.",
      [("受身", "うけみ", "Thể bị động"), ("身分", "みぶん", "Thân phận"), ("出身", "しゅっしん", "Xuất thân")], L),
    k(3, "叱", "SỈ", 5, ["シツ (shitsu)"], ["しか(る)"], "Mắng, quở trách.",
      [("叱ります", "しかります", "Mắng"), ("叱られます", "しかられます", "Bị mắng")], L),
    k(4, "招", "CHIÊU", 8, ["ショウ (shou)"], ["まね(く)"], "Mời gọi, chiêu đãi.",
      [("招待", "しょうたい", "Sự mời"), ("招きます", "まねきます", "Mời, vẫy gọi")], L),
    k(5, "泥", "NÊ", 8, ["デイ (dei)"], ["どろ"], "Bùn đất (chỉ ghép trong 泥棒).",
      [("泥棒", "どろぼう", "Kẻ trộm"), ("泥", "どろ", "Bùn")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chia thể bị động",
        "Nhóm 1: う→あ+れる (叱る→叱られる) 　Nhóm 2: bỏ る+られる (褒める→褒められる) 　する→される 　来る→来られる",
        "Chú ý: nhóm 1 chia thể bị động GIỐNG HỆT thể ない (bài 17) về phần đổi âm, chỉ khác đuôi "
        "cuối (ない vs られる) — nếu đã thuộc thể ない thì học thể bị động rất nhanh.",
        [
            ex(L, 1, 1, [t("t-l37s1-1", "せんせい", "先生", "せんせい"), t("t-l37s1-2", "に"),
                         t("t-l37s1-3", "しかられました", "叱られました", "しかられました", key=True)],
               "Tôi đã bị thầy giáo mắng."),
            ex(L, 1, 2, [t("t-l37s1-4", "せんせい", "先生", "せんせい"), t("t-l37s1-5", "に"),
                         t("t-l37s1-6", "ほめられました", "褒められました", "ほめられました", key=True)],
               "Tôi đã được thầy giáo khen."),
        ],
        tips="に đánh dấu người GÂY RA hành động trong câu bị động (先生に = bởi thầy giáo) — khác は/が đánh dấu chủ ngữ chịu tác động.",
        culture="叱られました/褒められました là hai câu học sinh Nhật hay dùng để kể chuyện ở trường với cha mẹ, gia đình."),

    slide(L, 2,
        "2. Bị động PHIỀN TOÁI (迷惑の受身): việc KHÔNG MONG MUỐN xảy ra",
        "N が [thể bị động]   (diễn tả cảm giác BỊ ẢNH HƯỞNG, dù người/vật gây ra không cố ý)",
        "Đây là điểm ĐẶC TRƯNG của tiếng Nhật, KHÔNG có tương đương trực tiếp trong tiếng Việt: "
        "dùng bị động để than phiền một việc xảy ra làm mình khó chịu, dù chủ thể gây ra vô tình.",
        [
            ex(L, 2, 1, [t("t-l37s2-1", "あめ", "雨", "あめ", key=True), t("t-l37s2-2", "に"),
                         t("t-l37s2-3", "ふられました", "降られました", "ふられました", key=True)],
               "Tôi bị dính mưa (không mang ô, khó chịu vì trời mưa)."),
            ex(L, 2, 2, [t("t-l37s2-4", "でんしゃ", "電車", "でんしゃ", key=True), t("t-l37s2-5", "の"),
                         t("t-l37s2-6", "なか", "中", "なか"), t("t-l37s2-7", "で"), t("t-l37s2-8", "あし", "足", "あし", key=True),
                         t("t-l37s2-9", "を"), t("t-l37s2-10", "ふまれました", "踏まれました", "ふまれました", key=True)],
               "Trong tàu điện, tôi bị giẫm chân (dù người giẫm không cố ý)."),
            ex(L, 2, 3, [t("t-l37s2-11", "こども", "子供", "こども"), t("t-l37s2-12", "に"),
                         t("t-l37s2-13", "なかれました", "泣かれました", "なかれました", key=True)],
               "Tôi bị (đứa trẻ) khóc (làm phiền tôi) — 泣く vốn là động từ tự thân, nhưng chia bị động vẫn được."),
        ],
        tips="泣かれる là ví dụ kinh điển: 泣く (khóc) không có tân ngữ, nhưng người Nhật vẫn 'bị động hóa' để diễn tả CẢM GIÁC BỊ LÀM PHIỀN bởi việc đó.",
        culture="Bị động phiền toái phản ánh não trạng ngôn ngữ Nhật: ngay cả hiện tượng tự nhiên (mưa) cũng có thể 'làm phiền' mình một cách chủ động về ngữ pháp."),

    slide(L, 3,
        "3. Bị động mất mát: N を [thể bị động]",
        "N は N2に N3を [thể bị động]   (mất/tổn thất một VẬT CỤ THỂ, giữ を cho vật bị lấy)",
        "Khi CÓ MỘT VẬT CỤ THỂ bị lấy đi/tác động, câu bị động vẫn giữ を cho vật đó — khác câu bị "
        "động phiền toái ở slide 2 (không có vật cụ thể, chỉ có が cho chủ ngữ).",
        [
            ex(L, 3, 1, [t("t-l37s3-1", "わたし", "私", "わたし"), t("t-l37s3-2", "は"),
                         t("t-l37s3-3", "どろぼう", "泥棒", "どろぼう", key=True), t("t-l37s3-4", "に"),
                         t("t-l37s3-5", "さいふ", "財布", "さいふ"), t("t-l37s3-6", "を"),
                         t("t-l37s3-7", "ぬすまれました", "盗まれました", "ぬすまれました", key=True)],
               "Tôi bị kẻ trộm lấy mất ví. (giữ を cho 財布, vật cụ thể bị lấy)"),
        ],
        tips="Cấu trúc は…に…を…られる là khung CHUẨN cho việc mất mát tài sản — と đặc biệt phổ biến khi khai báo với cảnh sát/bảo hiểm.",
        culture="Câu 財布を盗まれました là mẫu câu thực tế đầu tiên người nước ngoài học để trình báo mất cắp tại đồn cảnh sát Nhật."),

    slide(L, 4,
        "4. Bị động TRUNG TÍNH: sự kiện/vật thể khách quan",
        "N は [thể bị động]   (không mang cảm xúc phiền toái, chỉ miêu tả sự việc khách quan)",
        "Khác hai loại bị động ở slide 2-3 (mang cảm xúc), bị động TRUNG TÍNH chỉ miêu tả sự thật "
        "khách quan — vật do ai làm ra, sự kiện diễn ra như thế nào, thường thấy trong văn viết/tin tức.",
        [
            ex(L, 4, 1, [t("t-l37s4-1", "この"), t("t-l37s4-2", "くるま", "車", "くるま"), t("t-l37s4-3", "は"),
                         t("t-l37s4-4", "にほん", "日本", "にほん"), t("t-l37s4-5", "の"), t("t-l37s4-6", "こうじょう", "工場", "こうじょう", key=True),
                         t("t-l37s4-7", "で"), t("t-l37s4-8", "つくられました", "作られました", "つくられました", key=True)],
               "Chiếc xe này được sản xuất ở nhà máy Nhật Bản."),
            ex(L, 4, 2, [t("t-l37s4-9", "ふじさん", "富士山", "ふじさん"), t("t-l37s4-10", "は"),
                         t("t-l37s4-11", "せかいじゅう", "世界中", "せかいじゅう", key=True), t("t-l37s4-12", "で"),
                         t("t-l37s4-13", "しられて", "知られて", "しられて"), t("t-l37s4-14", "います", "居ます", "います")],
               "Núi Phú Sĩ được biết đến khắp thế giới."),
        ],
        tips="Loại bị động này không có chủ thể gây ra cụ thể (hoặc không quan trọng ai làm) — nhấn mạnh vào VẬT/SỰ KIỆN chứ không phải người gây ra.",
        culture="Tin tức, sách giáo khoa Nhật dùng bị động trung tính rất nhiều để giữ giọng văn khách quan, tránh nêu đích danh chủ thể không cần thiết."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d-l37-1", "山田さん"), t("d-l37-2", "、"), t("d-l37-3", "げんき", "元気", "げんき"),
          t("d-l37-4", "が"), t("d-l37-5", "ないです"), t("d-l37-6", "ね")],
         "Anh Yamada, trông không có tinh thần nhỉ."),
    line(L, 2, "山田", "Nhân viên công ty",
         [t("d-l37-7", "じつは", "実は", "じつは"), t("d-l37-8", "、"), t("d-l37-9", "けさ", "今朝", "けさ"),
          t("d-l37-10", "でんしゃ", "電車", "でんしゃ", key=True), t("d-l37-11", "の"), t("d-l37-12", "なか", "中", "なか"),
          t("d-l37-13", "で"), t("d-l37-14", "あし", "足", "あし", key=True), t("d-l37-15", "を"),
          t("d-l37-16", "ふまれました", "踏まれました", "ふまれました", key=True)],
         "Thật ra là, sáng nay trong tàu điện tôi bị giẫm chân."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d-l37-17", "それ"), t("d-l37-18", "は"), t("d-l37-19", "たいへん", "大変", "たいへん"),
          t("d-l37-20", "でした"), t("d-l37-21", "ね")],
         "Vất vả thật đấy nhỉ."),
    line(L, 4, "山田", "Nhân viên công ty",
         [t("d-l37-22", "そして"), t("d-l37-23", "、"), t("d-l37-24", "かいしゃ", "会社", "かいしゃ"),
          t("d-l37-25", "に"), t("d-l37-26", "つく", "着く", "つく"), t("d-l37-27", "まえに", key=True),
          t("d-l37-28", "、"), t("d-l37-29", "あめ", "雨", "あめ", key=True), t("d-l37-30", "に"),
          t("d-l37-31", "ふられました", "降られました", "ふられました", key=True)],
         "Rồi trước khi đến công ty, tôi còn bị dính mưa nữa."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d-l37-32", "ついていません"), t("d-l37-33", "ね"), t("d-l37-34", "。"), t("d-l37-35", "でも"),
          t("d-l37-36", "、"), t("d-l37-37", "けいかく", "計画", "けいかく"), t("d-l37-38", "は"),
          t("d-l37-39", "せんせい", "先生", "せんせい", key=True), t("d-l37-40", "に"), t("d-l37-41", "ほめられました", "褒められました", "ほめられました", key=True),
          t("d-l37-42", "でしょう")],
         "Không may quá nhỉ. Nhưng chắc kế hoạch được thầy khen phải không?"),
    line(L, 6, "山田", "Nhân viên công ty",
         [t("d-l37-43", "いいえ"), t("d-l37-44", "、"), t("d-l37-45", "ぎゃくに", "逆に", "ぎゃくに"),
          t("d-l37-46", "、"), t("d-l37-47", "しかられました", "叱られました", "しかられました", key=True)],
         "Không, ngược lại tôi còn bị mắng nữa."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d-l37-48", "そうですか"), t("d-l37-49", "。"), t("d-l37-50", "だいじょうぶ", "大丈夫", "だいじょうぶ"),
          t("d-l37-51", "ですか")],
         "Vậy à. Anh ổn không?"),
    line(L, 8, "山田", "Nhân viên công ty",
         [t("d-l37-52", "はい"), t("d-l37-53", "、"), t("d-l37-54", "だいじょうぶ", "大丈夫", "だいじょうぶ"),
          t("d-l37-55", "です"), t("d-l37-56", "。"), t("d-l37-57", "あ"), t("d-l37-58", "、"),
          t("d-l37-59", "そういえば"), t("d-l37-60", "、"), t("d-l37-61", "きのう", "昨日", "きのう"),
          t("d-l37-62", "パーティー", "パーティー", "パーティー", key=True), t("d-l37-63", "に"),
          t("d-l37-64", "しょうたいされました", "招待されました", "しょうたいされました", key=True)],
         "Vâng, tôi ổn. À, nói mới nhớ, hôm qua tôi đã được mời dự tiệc."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d-l37-65", "いいですね"), t("d-l37-66", "。"), t("d-l37-67", "だれ", "誰", "だれ"),
          t("d-l37-68", "の"), t("d-l37-69", "パーティー"), t("d-l37-70", "でした"), t("d-l37-71", "か")],
         "Hay đó. Tiệc của ai vậy?"),
    line(L, 10, "山田", "Nhân viên công ty",
         [t("d-l37-72", "ゆうめい", "有名", "ゆうめい", key=True), t("d-l37-73", "な"), t("d-l37-74", "かいしゃ", "会社", "かいしゃ"),
          t("d-l37-75", "の"), t("d-l37-76", "パーティー"), t("d-l37-77", "でした")],
         "Là tiệc của một công ty nổi tiếng."),
]

EXERCISES = [
    q(L, 1, "Thể bị động của 叱る (nhóm 1) là:",
      ["叱られる", "叱ける", "叱いれる", "叱るれる"], 0,
      "Nhóm 1 đổi âm cuối gốc từ điển sang hàng あ, thêm れる: 叱る → 叱られる.",
      "Áp dụng quy tắc chia thể bị động nhóm 1."),
    q(L, 2, "「電車の中で足を踏まれました」 — trợ từ を dùng ở đây vì:",
      ["Có VẬT CỤ THỂ (足) bị tác động, giữ を dù cả câu ở thể bị động",
       "を là lỗi, phải sửa thành が", "を chỉ dùng cho câu hỏi",
       "Đây là câu chủ động, không phải bị động"], 0,
      "Khi có vật cụ thể bị lấy/tác động, câu bị động vẫn giữ を cho vật đó — khác câu bị động phiền toái không có vật cụ thể.",
      "So sánh với 雨に降られました (không có を) ở slide 2."),
    q(L, 3, "「雨に降られました」 diễn tả điều gì đặc trưng của tiếng Nhật?",
      ["Bị động PHIỀN TOÁI: cảm giác bị ảnh hưởng bởi một việc, dù không ai cố ý gây ra",
       "Bị mưa tấn công trực tiếp", "Trời không mưa", "Mưa đã tạnh"], 0,
      "Đây là 迷惑の受身 (bị động phiền toái) — nét đặc trưng của tiếng Nhật không có tương đương trực tiếp trong tiếng Việt.",
      "Xem giải thích đặc biệt ở slide 2."),
    q(L, 4, "「子供に泣かれました」 — vì sao 泣く (khóc, không có tân ngữ) vẫn chia được bị động?",
      ["Bị động phiền toái áp dụng được cả với động từ TỰ THÂN để diễn tả cảm giác bị làm phiền",
       "Đây là câu sai ngữ pháp", "泣く phải luôn có tân ngữ",
       "Chỉ áp dụng được với động từ có tân ngữ"], 0,
      "Bị động phiền toái (迷惑の受身) là điểm đặc biệt: ngay cả động từ tự thân cũng chia được để diễn tả 'bị làm phiền bởi việc đó'.",
      "Đây là ví dụ điển hình nhất của bị động phiền toái."),
    q(L, 5, "「財布を盗まれました」 và 「雨に降られました」 khác nhau ở:",
      ["Câu đầu có VẬT CỤ THỂ bị mất (giữ を), câu sau không có vật cụ thể (chỉ có が cho chủ ngữ)",
       "Hoàn toàn giống nhau về cấu trúc", "Câu đầu không phải bị động",
       "Câu sau mới là bị động thật sự"], 0,
      "Đây là hai loại bị động khác nhau: mất mát vật cụ thể (giữ を) và phiền toái chung (không có vật cụ thể).",
      "So sánh cấu trúc ở slide 2 và 3."),
    q(L, 6, "「この車は日本の工場で作られました」 thuộc loại bị động nào?",
      ["Bị động TRUNG TÍNH (miêu tả sự thật khách quan, không cảm xúc)",
       "Bị động phiền toái", "Bị động mất mát",
       "Không phải câu bị động"], 0,
      "Câu này chỉ miêu tả sự thật khách quan (xe được sản xuất ở đâu), không mang cảm xúc phiền toái hay mất mát.",
      "Xem loại bị động thứ ba ở slide 4."),
    q(L, 7, "「富士山は世界中で知られています」 — trợ từ で ở đây có vai trò gì?",
      ["Đánh dấu PHẠM VI mà sự việc được biết đến (khắp thế giới)",
       "Đánh dấu phương tiện di chuyển", "Đánh dấu công cụ",
       "Đánh dấu nơi hành động xảy ra thông thường"], 0,
      "で ở đây đánh dấu phạm vi RỘNG mà sự việc/danh tiếng lan tỏa tới — một cách dùng mở rộng của で.",
      "So sánh với các chức năng で đã học trước đó."),
    q(L, 8, "する chia thể bị động là:",
      ["される", "しられる", "すれる", "しれる"], 0,
      "する là động từ bất quy tắc, chia thể bị động thành される.",
      "Đây là trường hợp bất quy tắc cần học thuộc."),
    q(L, 9, "Trong hội thoại, Yamada gặp những chuyện không may nào trong ngày?",
      ["Bị giẫm chân trên tàu điện, bị dính mưa, và bị thầy mắng",
       "Chỉ bị dính mưa", "Không gặp chuyện gì không may",
       "Bị mất ví"], 0,
      "Yamada kể lần lượt: 「足を踏まれました」「雨に降られました」「叱られました」.",
      "Xem các câu thoại đầu của Yamada."),
    q(L, 10, "Cuối hội thoại, Yamada được mời dự tiệc của ai?",
      ["Một công ty nổi tiếng", "Bạn thân", "Gia đình", "Trường học cũ"], 0,
      "Yamada nói 「有名な会社のパーティーでした」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 37: Thể bị động (受身形)",
    "Chia thể bị động (nhóm 1: う→あ+れる giống thể ない bài 17, nhóm 2: bỏ る+られる, する→さ"
    "れる), và ba loại bị động: PHIỀN TOÁI (迷惑の受身: 雨に降られる, 泣かれる — đặc trưng tiếng "
    "Nhật, không có tương đương tiếng Việt), MẤT MÁT (giữ を cho vật cụ thể bị lấy: 財布を盗まれ"
    "る), và TRUNG TÍNH (miêu tả sự thật khách quan: 車は工場で作られる).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
