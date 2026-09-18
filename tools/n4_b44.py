# -*- coding: utf-8 -*-
"""N4 — Bai 44: Qua muc すぎます, De/kho lam やすい/にくい.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 44
pool = Pool("n4")

VOCAB = [
    v(1,  "たべます", "食べます", "たべます", "tabemasu", "verb", "Ăn", "Đã gặp N5 bài 6 — nay dùng làm ví dụ すぎます.", L),
    v(2,  "のみます", "飲みます", "のみます", "nomimasu", "verb", "Uống", "Đã gặp N5 bài 6.", L),
    v(3,  "はたらきます", "働きます", "はたらきます", "hatarakimasu", "verb", "Làm việc, đi làm", "Đã gặp N5 bài 4.", L),
    v(4,  "つかいます", "使います", "つかいます", "tsukaimasu", "verb", "Sử dụng, dùng", "Đã gặp N5 bài 15.", L),
    v(5,  "あるきます", "歩きます", "あるきます", "arukimasu", "verb", "Đi bộ", "Đã gặp N5 bài 16.", L),
    v(6,  "よみます", "読みます", "よみます", "yomimasu", "verb", "Đọc", "Đã gặp N5 bài 6 — nay dùng làm ví dụ やすい/にくい.", L),
    v(7,  "かきます", "書きます", "かきます", "kakimasu", "verb", "Viết", "Đã gặp N5 bài 6.", L),
    v(8,  "うんてんします", "運転します", "うんてんします", "unten shimasu", "verb", "Lái xe", "Đã gặp bài 27.", L),
    v(9,  "ふとります", "太ります", "ふとります", "futorimasu", "verb", "Tăng cân, béo lên", "Đã gặp bài 32.", L),
    v(10, "せつめいします", "説明します", "せつめいします", "setsumei shimasu", "verb", "Giải thích", "Đã gặp bài 34.", L),
    v(11, "たかい", "高い", "たかい", "takai", "adjective", "Cao, đắt", "Đã gặp N5 bài 8. 高すぎます = đắt quá mức.", L),
    v(12, "やすい", "安い", "やすい", "yasui", "adjective", "Rẻ", "Đã gặp N5 bài 8. Chú ý: 安い là TÍNH TỪ, khác やすい hậu tố (dễ làm) tuy đọc giống nhau.", L),
    v(13, "おおきい", "大きい", "おおきい", "ookii", "adjective", "To, lớn", "Đã gặp N5 bài 8.", L),
    v(14, "むずかしい", "難しい", "むずかしい", "muzukashii", "adjective", "Khó", "Đã gặp N5 bài 8.", L),
    v(15, "げんき", "元気", "げんき", "genki", "adjective", "Khỏe mạnh", "Đã gặp N5 bài 8.", L),
    v(16, "しずか", "静か", "しずか", "shizuka", "adjective", "Yên tĩnh", "Đã gặp N5 bài 8. 静かすぎます = yên tĩnh quá mức (đến mức khó chịu).", L),
    v(17, "くつ", "靴", "くつ", "kutsu", "noun", "Giày", "この 靴は 歩きやすいです = đôi giày này đi dễ chịu.", L),
    v(18, "じ", "字", "じ", "ji", "noun", "Chữ viết", "この 字は 読みにくいです = chữ này khó đọc.", L),
    v(19, "せつめいしょ", "説明書", "せつめいしょ", "setsumeisho", "noun", "Sách hướng dẫn sử dụng", "Đã gặp bài 34. 分かりやすい 説明書 = sách hướng dẫn dễ hiểu.", L),
    v(20, "びょうき", "病気", "びょうき", "byouki", "noun", "Bệnh, ốm", "食べすぎて、病気に なりました = ăn quá nhiều nên bị ốm.", L),
]

KANJI = [
    k(1, "過", "QUÁ", 12, ["カ (ka)"], ["す(ぎる)", "す(ごす)"], "Vượt quá, đi qua.",
      [("過ぎます", "すぎます", "Vượt quá"), ("過去", "かこ", "Quá khứ"), ("過ごします", "すごします", "Trải qua thời gian")], L),
    k(2, "易", "DỊ", 8, ["イ (i)", "エキ (eki)"], ["やさ(しい)"], "Dễ dàng. Đã gặp N5 bài 2 (易しい).",
      [("易しい", "やさしい", "Dễ"), ("容易", "ようい", "Dễ dàng (Hán Việt)")], L),
    k(3, "難", "NAN", 18, ["ナン (nan)"], ["むずか(しい)"], "Khó khăn. Đã gặp N5 bài 8.",
      [("難しい", "むずかしい", "Khó"), ("困難", "こんなん", "Khó khăn")], L),
    k(4, "字", "TỰ", 6, ["ジ (ji)"], [], "Chữ viết. Đã gặp N4 bài 36 (trong 漢字).",
      [("字", "じ", "Chữ"), ("漢字", "かんじ", "Chữ Hán"), ("数字", "すうじ", "Chữ số")], L),
    k(5, "運", "VẬN", 12, ["ウン (un)"], ["はこ(ぶ)"], "Vận chuyển, vận may. Đã gặp bài 18.",
      [("運転", "うんてん", "Lái xe"), ("運動", "うんどう", "Vận động")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Quá mức: V(ます bỏ ます)／A(い/な bỏ đuôi) + すぎます",
        "V(gốc ます) + すぎます 　A-い (bỏ い) + すぎます 　A-な (bỏ な) + すぎます",
        "すぎます (vốn nghĩa 'vượt quá') ghép sau động từ/tính từ để diễn tả một mức độ THÁI QUÁ, "
        "thường mang HÀM Ý TIÊU CỰC — làm/là gì đó NHIỀU/CAO hơn mức bình thường, gây hậu quả không hay.",
        [
            ex(L, 1, 1, [t("t-l44s1-1", "たべすぎました", "食べすぎました", "たべすぎました", key=True), t("t-l44s1-2", "。"),
                         t("t-l44s1-3", "おなか", "お腹", "おなか"), t("t-l44s1-4", "が"), t("t-l44s1-5", "いたい", "痛い", "いたい"),
                         t("t-l44s1-6", "です")],
               "Tôi đã ăn quá nhiều. Đau bụng quá."),
            ex(L, 1, 2, [t("t-l44s1-7", "この"), t("t-l44s1-8", "みせ", "店", "みせ"), t("t-l44s1-9", "は"),
                         t("t-l44s1-10", "たかすぎます", "高すぎます", "たかすぎます", key=True)],
               "Cửa hàng này đắt quá mức."),
        ],
        tips="すぎます hầu như luôn mang sắc thái TIÊU CỰC (quá nhiều thành hại) — hiếm khi dùng để khen ai đó 'giỏi quá mức' theo nghĩa tích cực thuần túy.",
        culture="食べすぎました。お腹が痛いです là câu than thở rất phổ biến sau các bữa tiệc/buffet ở Nhật."),

    slide(L, 2,
        "2. Dễ làm: V(ます bỏ ます) + やすい",
        "V(gốc ます) + やすい   (chia như TÍNH TỪ い: やすい→やすくない→やすかった)",
        "やすい ghép sau gốc động từ diễn tả hành động đó DỄ THỰC HIỆN — chính bản thân やすい trở "
        "thành một TÍNH TỪ MỚI, chia đầy đủ theo quy tắc tính từ い đã học.",
        [
            ex(L, 2, 1, [t("t-l44s2-1", "この"), t("t-l44s2-2", "くつ", "靴", "くつ", key=True), t("t-l44s2-3", "は"),
                         t("t-l44s2-4", "あるきやすい", "歩きやすい", "あるきやすい", key=True), t("t-l44s2-5", "です")],
               "Đôi giày này đi (bộ) dễ chịu."),
            ex(L, 2, 2, [t("t-l44s2-6", "この"), t("t-l44s2-7", "せつめいしょ", "説明書", "せつめいしょ"), t("t-l44s2-8", "は"),
                         t("t-l44s2-9", "わかりやすい", "分かりやすい", "わかりやすい", key=True), t("t-l44s2-10", "です")],
               "Sách hướng dẫn này dễ hiểu."),
        ],
        tips="安い (rẻ, tính từ độc lập) và やすい (hậu tố 'dễ') phát âm GIỐNG NHAU nhưng chữ Hán và ý nghĩa hoàn toàn khác — phân biệt qua ngữ cảnh và có động từ đứng trước hay không.",
        culture="分かりやすい説明 (giải thích dễ hiểu) là lời khen phổ biến nhất dành cho giáo viên, người thuyết trình giỏi ở Nhật."),

    slide(L, 3,
        "3. Khó làm: V(ます bỏ ます) + にくい",
        "V(gốc ます) + にくい   (đối lập trực tiếp với やすい, cùng chia như tính từ い)",
        "にくい là cặp ĐỐI LẬP của やすい — diễn tả hành động KHÓ THỰC HIỆN, thường vì đặc điểm vật "
        "lý hoặc điều kiện khách quan của đối tượng.",
        [
            ex(L, 3, 1, [t("t-l44s3-1", "この"), t("t-l44s3-2", "じ", "字", "じ", key=True), t("t-l44s3-3", "は"),
                         t("t-l44s3-4", "よみにくい", "読みにくい", "よみにくい", key=True), t("t-l44s3-5", "です")],
               "Chữ này khó đọc."),
            ex(L, 3, 2, [t("t-l44s3-6", "この"), t("t-l44s3-7", "くつ", "靴", "くつ"), t("t-l44s3-8", "は"),
                         t("t-l44s3-9", "あるきにくい", "歩きにくい", "あるきにくい", key=True), t("t-l44s3-10", "です")],
               "Đôi giày này đi khó chịu. (đối lập trực tiếp với ví dụ slide 2)"),
        ],
        tips="やすい/にくい luôn nói về ĐẶC ĐIỂM KHÁCH QUAN của vật/hành động — khác できる (khả năng, bài 27) nói về NĂNG LỰC của người.",
        culture="使いにくい (khó dùng) là lời phàn nàn phổ biến về thiết kế sản phẩm, thường thấy trong đánh giá (レビュー) mua sắm online."),

    slide(L, 4,
        "4. Kết hợp すぎます với やすい/にくい",
        "[Vやすい/にくい] + すぎます   (chính TÍNH TỪ MỚI やすい/にくい cũng chia được すぎます)",
        "Vì やすい/にくい đã TRỞ THÀNH tính từ い hoàn chỉnh (slide 2-3), chúng có thể tiếp tục ghép "
        "すぎます để nói 'quá dễ' hoặc 'quá khó' — một tầng ngữ pháp chồng lên tầng khác.",
        [
            ex(L, 4, 1, [t("t-l44s4-1", "この"), t("t-l44s4-2", "しごと", "仕事", "しごと"), t("t-l44s4-3", "は"),
                         t("t-l44s4-4", "むずかしすぎて", "難しすぎて", "むずかしすぎて", key=True), t("t-l44s4-5", "、"),
                         t("t-l44s4-6", "できません", key=True)],
               "Việc này khó quá mức nên tôi không làm được."),
            ex(L, 4, 2, [t("t-l44s4-7", "この"), t("t-l44s4-8", "アプリ"), t("t-l44s4-9", "は"),
                         t("t-l44s4-10", "つかいやすすぎて", "使いやすすぎて", "つかいやすすぎて", key=True), t("t-l44s4-11", "、"),
                         t("t-l44s4-12", "こどもでも", "子供でも", "こどもでも"), t("t-l44s4-13", "つかえます", "使えます", "つかえます")],
               "Ứng dụng này dễ dùng đến mức trẻ con cũng dùng được. (やすい bỏ い, thêm すぎる: やすすぎる)"),
        ],
        tips="Khi chồng tầng, やすい bỏ い thành やす trước khi ghép すぎる (やすすぎる) — cùng quy tắc chia tính từ い bình thường.",
        culture="使いやすすぎて子供でも使えます là câu quảng cáo sản phẩm công nghệ rất thường gặp, nhấn mạnh tính đơn giản, thân thiện người dùng."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d-l44-1", "山田さん"), t("d-l44-2", "、"), t("d-l44-3", "だいじょうぶ", "大丈夫", "だいじょうぶ"),
          t("d-l44-4", "ですか")],
         "Anh Yamada, anh ổn không?"),
    line(L, 2, "山田", "Nhân viên công ty",
         [t("d-l44-5", "きのう", "昨日", "きのう"), t("d-l44-6", "、"), t("d-l44-7", "のみすぎました", "飲みすぎました", "のみすぎました", key=True),
          t("d-l44-8", "。"), t("d-l44-9", "あたま", "頭", "あたま"), t("d-l44-10", "が"), t("d-l44-11", "いたい", "痛い", "いたい"),
          t("d-l44-12", "です")],
         "Hôm qua tôi đã uống quá nhiều. Đầu tôi đau quá."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d-l44-13", "たいへんでした", "大変でした", "たいへんでした"), t("d-l44-14", "ね"), t("d-l44-15", "。"),
          t("d-l44-16", "この"), t("d-l44-17", "くすり", "薬", "くすり"), t("d-l44-18", "を"),
          t("d-l44-19", "のんで", "飲んで", "のんで"), t("d-l44-20", "みて", "みて", "みて"), t("d-l44-21", "ください")],
         "Vất vả thật đấy nhỉ. Thử uống viên thuốc này xem."),
    line(L, 4, "山田", "Nhân viên công ty",
         [t("d-l44-22", "ありがとう"), t("d-l44-23", "ございます"), t("d-l44-24", "。"), t("d-l44-25", "この"),
          t("d-l44-26", "せつめいしょ", "説明書", "せつめいしょ", key=True), t("d-l44-27", "は"),
          t("d-l44-28", "わかりやすい", "分かりやすい", "わかりやすい", key=True), t("d-l44-29", "です"), t("d-l44-30", "ね")],
         "Cảm ơn chị. Sách hướng dẫn này dễ hiểu nhỉ."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d-l44-31", "はい"), t("d-l44-32", "。"), t("d-l44-33", "ところで"), t("d-l44-34", "、"),
          t("d-l44-35", "さいきん", "最近", "さいきん"), t("d-l44-36", "はたらきすぎて", "働きすぎて", "はたらきすぎて", key=True),
          t("d-l44-37", "いません", "居ません", "いません"), t("d-l44-38", "か")],
         "Vâng. À mà, gần đây anh không làm việc quá sức chứ?"),
    line(L, 6, "山田", "Nhân viên công ty",
         [t("d-l44-39", "すこし"), t("d-l44-40", "はたらきすぎて", "働きすぎて", "はたらきすぎて", key=True), t("d-l44-41", "います", "居ます", "います"),
          t("d-l44-42", "。"), t("d-l44-43", "でも"), t("d-l44-44", "、"), t("d-l44-45", "この"),
          t("d-l44-46", "しごと", "仕事", "しごと"), t("d-l44-47", "は"), t("d-l44-48", "たのしくて"),
          t("d-l44-49", "、"), t("d-l44-50", "やすい", "易い", "やすい"), t("d-l44-51", "です")],
         "Tôi có làm việc hơi quá sức thật. Nhưng công việc này vui và dễ làm."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d-l44-52", "それ"), t("d-l44-53", "は"), t("d-l44-54", "いいです", key=True), t("d-l44-55", "ね"),
          t("d-l44-56", "。"), t("d-l44-57", "でも"), t("d-l44-58", "、"), t("d-l44-59", "けんこう", "健康", "けんこう"),
          t("d-l44-60", "も"), t("d-l44-61", "たいせつ", "大切", "たいせつ"), t("d-l44-62", "です"), t("d-l44-63", "よ")],
         "Thế thì tốt nhỉ. Nhưng sức khỏe cũng quan trọng lắm."),
    line(L, 8, "山田", "Nhân viên công ty",
         [t("d-l44-64", "はい"), t("d-l44-65", "、"), t("d-l44-66", "きをつけます", "気を付けます", "きをつけます")],
         "Vâng, tôi sẽ cẩn thận."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d-l44-67", "この"), t("d-l44-68", "くつ", "靴", "くつ", key=True), t("d-l44-69", "、"),
          t("d-l44-70", "あるきにくくない", "歩きにくくない", "あるきにくくない", key=True), t("d-l44-71", "ですか")],
         "Đôi giày này, không khó đi à?"),
    line(L, 10, "山田", "Nhân viên công ty",
         [t("d-l44-72", "いいえ"), t("d-l44-73", "、"), t("d-l44-74", "あるきやすい", "歩きやすい", "あるきやすい", key=True),
          t("d-l44-75", "です"), t("d-l44-76", "よ")],
         "Không, đi dễ chịu lắm đấy."),
]

EXERCISES = [
    q(L, 1, "「食べすぎました」 — すぎます ghép vào phần nào của 食べます?",
      ["Gốc ます (bỏ ます, giữ 食べ)", "Thể từ điển (食べる)",
       "Thể た (食べた)", "Thể て (食べて)"], 0,
      "すぎます ghép vào GỐC MASU của động từ (giống V-そう ở bài 43): 食べます → 食べすぎます.",
      "Áp dụng quy tắc chia すぎます."),
    q(L, 2, "「高すぎます」 mang sắc thái:",
      ["Tiêu cực — đắt đến mức gây khó chịu/vấn đề", "Tích cực — đắt là tốt",
       "Trung tính, không cảm xúc", "Chỉ dùng cho câu hỏi"], 0,
      "すぎます hầu như luôn mang hàm ý TIÊU CỰC — một mức độ vượt quá bình thường, gây hậu quả không hay.",
      "Xem sắc thái đã nêu ở slide 1."),
    q(L, 3, "「歩きやすい」 chia phủ định như thế nào?",
      ["歩きやすくない (chia như tính từ い)", "歩きやすじゃない",
       "歩きやすいじゃない", "Không chia được phủ định"], 0,
      "やすい đã TRỞ THÀNH tính từ い hoàn chỉnh, chia phủ định theo đúng quy tắc: bỏ い, thêm くない.",
      "Xem ghi chú về やすい là tính từ mới ở slide 2."),
    q(L, 4, "安い (rẻ) và やすい (hậu tố, dễ làm) khác nhau ở:",
      ["安い là tính từ độc lập; やすい luôn ghép sau một động từ khác",
       "Hoàn toàn giống nhau về nghĩa và cách dùng", "安い chỉ dùng cho câu hỏi",
       "やすい chỉ dùng cho phủ định"], 0,
      "安い đứng ĐỘC LẬP làm tính từ (rẻ); やすい luôn PHẢI ghép sau gốc động từ khác để tạo nghĩa 'dễ làm gì'.",
      "Phân biệt qua việc có động từ đứng trước hay không."),
    q(L, 5, "「読みにくい」 nghĩa là:",
      ["Khó đọc", "Dễ đọc", "Không muốn đọc", "Đã đọc xong"], 0,
      "にくい ghép sau gốc động từ diễn tả hành động đó KHÓ THỰC HIỆN — đối lập với やすい.",
      "Áp dụng đúng nghĩa của にくい."),
    q(L, 6, "やすい/にくい khác できる (thể khả năng, bài 27) ở chỗ:",
      ["やすい/にくい nói về ĐẶC ĐIỂM KHÁCH QUAN của vật/hành động; できる nói về NĂNG LỰC của người",
       "Hoàn toàn giống nhau", "やすい/にくい chỉ dùng cho câu hỏi",
       "できる chỉ dùng cho phủ định"], 0,
      "やすい/にくい miêu tả tính chất của VẬT (giày dễ/khó đi); できる miêu tả NĂNG LỰC làm được của một NGƯỜI cụ thể.",
      "So sánh hai khái niệm dễ nhầm này."),
    q(L, 7, "「使いやすすぎて、子供でも使えます」 — やすすぎて được chia như thế nào?",
      ["やすい bỏ い, thêm すぎる (chồng tầng ngữ pháp): やすい→やす→やすすぎる",
       "Đây là lỗi chính tả, phải sửa lại", "やすすぎて không tồn tại trong tiếng Nhật",
       "すぎて chỉ ghép được với động từ gốc"], 0,
      "Vì やすい đã là tính từ い hoàn chỉnh, nó tiếp tục chia được với すぎる theo đúng quy tắc: bỏ い, thêm すぎる.",
      "Xem ví dụ chồng tầng ngữ pháp ở slide 4."),
    q(L, 8, "「難しすぎて、できません」 nghĩa là:",
      ["Khó quá mức nên không làm được", "Dễ quá nên làm được ngay",
       "Không khó chút nào", "Đã làm xong rồi"], 0,
      "難しすぎて (khó quá mức) + できません (không làm được) diễn tả hậu quả của mức độ khó thái quá.",
      "Kết hợp すぎます với できる (bài 27)."),
    q(L, 9, "Trong hội thoại, vì sao Yamada bị đau đầu?",
      ["Vì uống quá nhiều rượu hôm qua", "Vì thức khuya làm việc",
       "Vì bị cảm cúm", "Không có lý do cụ thể"], 0,
      "Yamada nói 「昨日、飲みすぎました。頭が痛いです」.",
      "Xem câu thoại thứ 2."),
    q(L, 10, "Đôi giày của Yamada có dễ đi không?",
      ["Có, dễ đi (歩きやすい)", "Không, khó đi", "Không được nhắc tới", "Giày bị hỏng"], 0,
      "Yamada trả lời 「歩きやすいですよ」 khi Tanaka hỏi.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 44: Quá mức (〜すぎます) & Dễ/Khó làm (〜やすい / 〜にくい)",
    "Ghép すぎます vào gốc ます của động từ hoặc tính từ (bỏ đuôi い/な) để diễn tả mức độ THÁI "
    "QUÁ, thường mang hàm ý tiêu cực; ghép やすい/にくい vào gốc ます để tạo TÍNH TỪ MỚI diễn tả "
    "đặc điểm khách quan dễ/khó thực hiện (khác できる — năng lực người, bài 27); và cách chồng "
    "tầng すぎます lên chính やすい/にくい.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
