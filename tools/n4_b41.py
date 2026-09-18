# -*- coding: utf-8 -*-
"""N4 — Bai 41: Kinh ngu cho nhan (やる/あげる/さしあげる, いただく, くださる).

Mo rong tu bai 24 (N5: agemasu/moraimasu/kuremasu voi hanh dong) sang
kinh ngu day du. Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv.
くださる khong co trong pool (tu chuc nang ngu phap loi), dua vao thu cong.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 41
pool = Pool("n4")

VOCAB = [
    v(1,  "やります", "", "", "yarimasu", "verb", "Cho, tặng (cho vật/động thực vật, dưới mình)", "Bậc THẤP NHẤT của あげる — cho hoa/thú cưng ăn, hoặc nói với em nhỏ thân mật.", L),
    v(2,  "あげます", "上げます", "あげます", "agemasu", "verb", "Cho, tặng (ngang hàng)", "Đã gặp N5 bài 7, 24. Bậc TRUNG TÍNH.", L),
    v(3,  "さしあげます", "差し上げます", "さしあげます", "sashiagemasu", "verb", "Kính biếu, kính tặng (cho người trên)", "Bậc CAO NHẤT của あげる — dùng khi tặng thầy cô, cấp trên, khách hàng.", L),
    v(4,  "いただきます", "頂きます", "いただきます", "itadakimasu", "verb", "Được nhận (khiêm nhường, từ người trên)", "Khiêm nhường ngữ của もらいます — hạ mình khi nhận từ người trên.", L),
    v(5,  "くださいます", "下さいます", "くださいます", "kudasaimasu", "verb", "Được ban cho (tôn kính, từ người trên)", "Tôn kính ngữ của くれます — NÂNG người trên khi họ cho mình.", L),
    v(6,  "もらいます", "", "", "moraimasu", "verb", "Nhận, được (trung tính)", "Đã gặp N5 bài 7, 24.", L),
    v(7,  "くれます", "呉れます", "くれます", "kuremasu", "verb", "Cho (người khác làm cho mình, trung tính)", "Đã gặp N5 bài 24.", L),
    v(8,  "プレゼント", "", "", "purezento", "noun", "Món quà", "プレゼントを 頂きました = tôi đã được nhận quà (khiêm nhường).", L),
    v(9,  "はなみ", "花見", "はなみ", "hanami", "noun", "Ngắm hoa anh đào", "花見の チケットを 差し上げます = kính biếu vé xem hoa anh đào.", L),
    v(10, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "先生に 花を 差し上げました = tôi đã kính biếu hoa cho thầy giáo.", L),
    v(11, "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc công ty", "社長が 本を くださいました = giám đốc đã ban tặng cho tôi quyển sách.", L),
    v(12, "りょうしん", "両親", "りょうしん", "ryoushin", "noun", "Cha mẹ", "Đã gặp N5 bài 20.", L),
    v(13, "たんじょうび", "誕生日", "たんじょうび", "tanjoubi", "noun", "Sinh nhật", "Đã gặp N5 bài 5.", L),
    v(14, "はな", "花", "はな", "hana", "noun", "Hoa", "Đã gặp N5 bài 16.", L),
    v(15, "ほん", "本", "ほん", "hon", "noun", "Quyển sách", "Đã gặp N5 bài 2.", L),
    v(16, "いぬ", "犬", "いぬ", "inu", "noun", "Con chó", "Đã gặp N5 bài 10 — nay dùng làm ví dụ やります.", L),
    v(17, "みず", "水", "みず", "mizu", "noun", "Nước", "犬に 水を やります = cho chó uống nước.", L),
    v(18, "しゃいん", "社員", "しゃいん", "shain", "noun", "Nhân viên công ty", "Đã gặp N5 bài 1.", L),
    v(19, "おきゃくさん", "お客さん", "おきゃくさん", "okyakusan", "noun", "Vị khách", "お客さんに お茶を 差し上げます = kính mời khách dùng trà.", L),
    v(20, "ありがたい", "有難い", "ありがたい", "arigatai", "adjective", "Đáng quý, biết ơn", "先生に 教えて いただき、ありがたいです = được thầy dạy cho, thật đáng quý.", L),
]

KANJI = [
    k(1, "差", "SAI", 10, ["サ (sa)"], ["さ(す)"], "Sự khác biệt; dâng lên (trong 差し上げる).",
      [("差し上げます", "さしあげます", "Kính biếu"), ("差", "さ", "Sự khác biệt")], L),
    k(2, "頂", "ĐẢNH", 11, ["チョウ (chou)"], ["いただ(く)"], "Đỉnh đầu; nhận lấy một cách khiêm nhường.",
      [("頂きます", "いただきます", "Được nhận (khiêm nhường)"), ("頂上", "ちょうじょう", "Đỉnh núi")], L),
    k(3, "客", "KHÁCH", 9, ["キャク (kyaku)"], [], "Khách.",
      [("お客さん", "おきゃくさん", "Vị khách"), ("観光客", "かんこうきゃく", "Khách du lịch")], L),
    k(4, "社", "XÃ", 7, ["シャ (sha)"], ["やしろ"], "Công ty, đoàn thể. Đã gặp N5 bài 3.",
      [("社長", "しゃちょう", "Giám đốc"), ("社員", "しゃいん", "Nhân viên"), ("会社", "かいしゃ", "Công ty")], L),
    k(5, "長", "TRƯỞNG", 8, ["チョウ (chou)"], ["なが(い)"], "Trưởng, đứng đầu; dài.",
      [("社長", "しゃちょう", "Giám đốc"), ("長い", "ながい", "Dài"), ("校長", "こうちょう", "Hiệu trưởng")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Ba bậc của あげる: やる／あげる／差し上げる",
        "やる (dưới mình: cây, thú cưng, em nhỏ) < あげる (ngang hàng) < 差し上げる (kính biếu người trên)",
        "Đây là MỘT động từ 'cho' được chia thành BA BẬC LỊCH SỰ tùy đối tượng nhận — càng nhận từ "
        "người CÀNG CAO thì càng dùng từ trang trọng hơn.",
        [
            ex(L, 1, 1, [t("t-l41s1-1", "いぬ", "犬", "いぬ", key=True), t("t-l41s1-2", "に"),
                         t("t-l41s1-3", "みず", "水", "みず"), t("t-l41s1-4", "を"),
                         t("t-l41s1-5", "やります", key=True)],
               "Tôi cho chó uống nước."),
            ex(L, 1, 2, [t("t-l41s1-6", "せんせい", "先生", "せんせい", key=True), t("t-l41s1-7", "に"),
                         t("t-l41s1-8", "はな", "花", "はな"), t("t-l41s1-9", "を"),
                         t("t-l41s1-10", "さしあげました", "差し上げました", "さしあげました", key=True)],
               "Tôi đã kính biếu hoa cho thầy giáo."),
        ],
        tips="Tuyệt đối không dùng やる cho người — kể cả nói về em nhỏ trong gia đình cũng nên dùng あげる để lịch sự hơn trong đa số ngữ cảnh hiện đại.",
        culture="差し上げます nghe khá trang trọng, dùng phổ biến trong môi trường kinh doanh khi biếu quà đối tác, khách hàng."),

    slide(L, 2,
        "2. Khiêm nhường khi NHẬN: いただきます (khiêm nhường ngữ của もらいます)",
        "[Người nói] は [người trên] に + いただきます",
        "いただきます HẠ THẤP bản thân người nói khi nhận ơn/vật từ người trên — cùng bản chất với "
        "もらいます (N5 bài 7, 24) nhưng thêm sắc thái khiêm tốn rõ rệt.",
        [
            ex(L, 2, 1, [t("t-l41s2-1", "せんせい", "先生", "せんせい", key=True), t("t-l41s2-2", "に"),
                         t("t-l41s2-3", "ほん", "本", "ほん"), t("t-l41s2-4", "を"),
                         t("t-l41s2-5", "いただきました", "頂きました", "いただきました", key=True)],
               "Tôi đã được thầy giáo ban tặng cho quyển sách."),
            ex(L, 2, 2, [t("t-l41s2-6", "せんせい", "先生", "せんせい"), t("t-l41s2-7", "に"),
                         t("t-l41s2-8", "にほんご", "日本語", "にほんご"), t("t-l41s2-9", "を"),
                         t("t-l41s2-10", "おしえて", "教えて", "おしえて"), t("t-l41s2-11", "いただきました", "頂きました", "いただきました", key=True)],
               "Tôi đã được thầy giáo dạy cho tiếng Nhật. (Vて+いただきます, mở rộng từ もらいます)"),
        ],
        tips="いただきます cũng chính là câu nói trước bữa ăn ('xin phép được nhận') — cùng gốc ý nghĩa khiêm nhường khi tiếp nhận điều gì đó.",
        culture="教えていただき、ありがとうございます là câu cảm ơn trang trọng chuẩn mực khi viết thư/email cho giáo viên, cấp trên."),

    slide(L, 3,
        "3. Tôn kính khi được CHO: くださいます (tôn kính ngữ của くれます)",
        "[Người trên] は [tôi] に + くださいます",
        "くださいます NÂNG CAO người trên khi họ chủ động cho/làm gì đó cho mình — đối lập vai trò "
        "với いただきます (khiêm nhường HẠ MÌNH). Cùng một sự việc, chọn theo ai làm CHỦ NGỮ.",
        [
            ex(L, 3, 1, [t("t-l41s3-1", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l41s3-2", "が"),
                         t("t-l41s3-3", "ほん", "本", "ほん"), t("t-l41s3-4", "を"),
                         t("t-l41s3-5", "くださいました", "下さいました", "くださいました", key=True)],
               "Giám đốc đã ban tặng cho tôi quyển sách."),
            ex(L, 3, 2, [t("t-l41s3-6", "せんせい", "先生", "せんせい"), t("t-l41s3-7", "が"),
                         t("t-l41s3-8", "にほんご", "日本語", "にほんご"), t("t-l41s3-9", "を"),
                         t("t-l41s3-10", "おしえて", "教えて", "おしえて"), t("t-l41s3-11", "くださいました", "下さいました", "くださいました", key=True)],
               "Thầy giáo đã dạy cho tôi tiếng Nhật. (kính ngữ, chủ ngữ là thầy giáo)"),
        ],
        tips="くださいました (thầy LÀM cho tôi) và いただきました (tôi ĐƯỢC NHẬN từ thầy) tả CÙNG một sự việc — như くれる/もらう ở N5 bài 24, chỉ khác đây là bản kính ngữ.",
        culture="Thư cảm ơn trang trọng ở Nhật thường viết cả hai dạng tùy vào việc muốn nhấn mạnh HÀNH ĐỘNG của người trên hay TRẢI NGHIỆM của bản thân."),

    slide(L, 4,
        "4. Bảng tổng hợp ba cặp kính ngữ cho-nhận",
        "あげる系: やる<あげる<差し上げる 　もらう系: もらう→いただく (khiêm nhường) 　くれる系: くれる→くださる (tôn kính)",
        "Ba nhóm động từ cho-nhận (N5 bài 7, 24) đều có PHIÊN BẢN KÍNH NGỮ riêng — đây là nền tảng "
        "quan trọng trước khi học kính ngữ tổng quát (尊敬語/謙譲語) ở bài 49-50.",
        [
            ex(L, 4, 1, [t("t-l41s4-1", "りょうしん", "両親", "りょうしん", key=True), t("t-l41s4-2", "に"),
                         t("t-l41s4-3", "プレゼント"), t("t-l41s4-4", "を"), t("t-l41s4-5", "あげました", key=True)],
               "Tôi đã tặng quà cho cha mẹ. (あげる, trung tính vì cha mẹ không cần kính ngữ tuyệt đối)"),
            ex(L, 4, 2, [t("t-l41s4-6", "おきゃくさん", "お客さん", "おきゃくさん", key=True), t("t-l41s4-7", "に"),
                         t("t-l41s4-8", "おちゃ", "お茶", "おちゃ"), t("t-l41s4-9", "を"),
                         t("t-l41s4-10", "さしあげました", "差し上げました", "さしあげました", key=True)],
               "Tôi đã kính mời khách dùng trà."),
        ],
        tips="Ghi nhớ theo cặp: あげる/もらう/くれる (N5) → 差し上げる/いただく/くださる (kính ngữ, N4) — cùng cấu trúc câu, chỉ thay động từ.",
        culture="ご両親に教えていただき、ありがたいです là mẫu câu cảm ơn kính trọng phổ biến khi nói về việc học hỏi từ cha mẹ người khác."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d-l41-1", "サントスさん"), t("d-l41-2", "、"), t("d-l41-3", "たんじょうび", "誕生日", "たんじょうび", key=True),
          t("d-l41-4", "おめでとう"), t("d-l41-5", "ございます"), t("d-l41-6", "。"), t("d-l41-7", "これ"),
          t("d-l41-8", "、"), t("d-l41-9", "プレゼント", "プレゼント", "プレゼント", key=True), t("d-l41-10", "です")],
         "Anh Santos, chúc mừng sinh nhật. Đây, quà tặng anh."),
    line(L, 2, "サントス", "Sinh viên",
         [t("d-l41-11", "ありがとう"), t("d-l41-12", "ございます"), t("d-l41-13", "。"), t("d-l41-14", "うれしい", "嬉しい", "うれしい"),
          t("d-l41-15", "です"), t("d-l41-16", "！")],
         "Cảm ơn nhiều. Vui quá!"),
    line(L, 3, "ワン", "Sinh viên",
         [t("d-l41-17", "せんせい", "先生", "せんせい", key=True), t("d-l41-18", "から"), t("d-l41-19", "も"),
          t("d-l41-20", "プレゼント", "プレゼント", "プレゼント"), t("d-l41-21", "を"), t("d-l41-22", "いただきました", "頂きました", "いただきました", key=True),
          t("d-l41-23", "か")],
         "Anh cũng được thầy giáo tặng quà à?"),
    line(L, 4, "サントス", "Sinh viên",
         [t("d-l41-24", "はい"), t("d-l41-25", "。"), t("d-l41-26", "せんせい", "先生", "せんせい"),
          t("d-l41-27", "が"), t("d-l41-28", "ほん", "本", "ほん", key=True), t("d-l41-29", "を"),
          t("d-l41-30", "くださいました", "下さいました", "くださいました", key=True)],
         "Vâng. Thầy giáo đã ban tặng cho tôi một quyển sách."),
    line(L, 5, "ワン", "Sinh viên",
         [t("d-l41-31", "いいですね"), t("d-l41-32", "。"), t("d-l41-33", "わたし", "私", "わたし"),
          t("d-l41-34", "は"), t("d-l41-35", "りょうしん", "両親", "りょうしん", key=True), t("d-l41-36", "に"),
          t("d-l41-37", "でんわ", "電話", "でんわ"), t("d-l41-38", "して", key=True), t("d-l41-39", "もらいました", key=True)],
         "Hay đó. Tôi thì được cha mẹ gọi điện chúc mừng."),
    line(L, 6, "サントス", "Sinh viên",
         [t("d-l41-40", "それ"), t("d-l41-41", "も"), t("d-l41-42", "うれしい", "嬉しい", "うれしい"),
          t("d-l41-43", "です"), t("d-l41-44", "ね")],
         "Vậy cũng vui đấy nhỉ."),
    line(L, 7, "ワン", "Sinh viên",
         [t("d-l41-45", "らいしゅう", "来週", "らいしゅう"), t("d-l41-46", "、"), t("d-l41-47", "はなみ", "花見", "はなみ", key=True),
          t("d-l41-48", "に"), t("d-l41-49", "いきませんか", "行きませんか", "いきませんか")],
         "Tuần sau, mình đi ngắm hoa anh đào không?"),
    line(L, 8, "サントス", "Sinh viên",
         [t("d-l41-50", "いいですね"), t("d-l41-51", "。"), t("d-l41-52", "せんせい", "先生", "せんせい", key=True),
          t("d-l41-53", "にも"), t("d-l41-54", "チケット"), t("d-l41-55", "を"), t("d-l41-56", "さしあげましょう", "差し上げましょう", "さしあげましょう", key=True)],
         "Hay đó. Cũng kính biếu vé cho thầy giáo luôn nhé."),
    line(L, 9, "ワン", "Sinh viên",
         [t("d-l41-57", "いい"), t("d-l41-58", "かんがえ", "考え", "かんがえ"), t("d-l41-59", "です"), t("d-l41-60", "。"),
          t("d-l41-61", "せんせい", "先生", "せんせい"), t("d-l41-62", "も"), t("d-l41-63", "きっと"),
          t("d-l41-64", "よろこびます", "喜びます", "よろこびます")],
         "Ý hay đấy. Thầy giáo chắc chắn sẽ vui đấy."),
    line(L, 10, "サントス", "Sinh viên",
         [t("d-l41-65", "いつも"), t("d-l41-66", "せんせい", "先生", "せんせい"), t("d-l41-67", "に"),
          t("d-l41-68", "おしえて", "教えて", "おしえて"), t("d-l41-69", "いただいて", "頂いて", "いただいて", key=True),
          t("d-l41-70", "、"), t("d-l41-71", "ありがたい", "有難い", "ありがたい", key=True), t("d-l41-72", "です")],
         "Được thầy dạy cho mãi, thật đáng quý."),
]

EXERCISES = [
    q(L, 1, "Ba bậc của あげる theo thứ tự TĂNG DẦN mức độ lịch sự là:",
      ["やる → あげる → 差し上げる", "差し上げる → あげる → やる",
       "あげる → やる → 差し上げる", "Cả ba đều ngang nhau"], 0,
      "やる (dưới mình) < あげる (ngang hàng) < 差し上げる (kính biếu người trên) — thang tăng dần theo địa vị người nhận.",
      "Xem thang bậc ở slide 1."),
    q(L, 2, "いただきます là khiêm nhường ngữ của động từ nào?",
      ["もらいます", "あげます", "くれます", "やります"], 0,
      "いただきます hạ thấp bản thân người nói khi NHẬN — cùng bản chất với もらいます nhưng thêm sắc thái khiêm tốn.",
      "Xem cặp tương ứng ở slide 2."),
    q(L, 3, "くださいます là tôn kính ngữ của động từ nào?",
      ["くれます", "もらいます", "あげます", "さしあげます"], 0,
      "くださいます nâng cao người trên khi HỌ cho mình — tương ứng với くれます (N5 bài 24) ở dạng kính ngữ.",
      "Xem cặp tương ứng ở slide 3."),
    q(L, 4, "「先生が本をくださいました」 và 「私は先生に本をいただきました」 có quan hệ:",
      ["Mô tả CÙNG một sự việc từ hai góc nhìn (giống くれる/もらう ở N5 bài 24)",
       "Hai sự việc hoàn toàn khác nhau", "Câu thứ hai sai ngữ pháp",
       "Chỉ câu đầu đúng"], 0,
      "Đây là cặp tương đương kính ngữ của くれる/もらう đã học ở N5 bài 24 — chọn chủ ngữ khác nhau tùy góc nhìn.",
      "So sánh với cấu trúc くれる/もらう ở N5."),
    q(L, 5, "「犬に水をやります」 — vì sao dùng やります chứ không phải あげます?",
      ["やる dùng cho đối tượng THẤP HƠN mình: động vật, cây cối, không phải người",
       "やる và あげる hoàn toàn giống nhau", "あげる chỉ dùng cho câu hỏi",
       "やる là lỗi, phải sửa thành あげる"], 0,
      "やる là bậc THẤP NHẤT của あげる, dùng cho vật/con vật/cây cối — không dùng cho người trong giao tiếp lịch sự hiện đại.",
      "Xem giới hạn sử dụng やる ở slide 1."),
    q(L, 6, "「先生に日本語を教えていただきました」 — cấu trúc Vていただきます mở rộng từ đâu?",
      ["Vてもらいます (N5 bài 24, mở rộng cho-nhận HÀNH ĐỘNG)",
       "Vてあげます", "Vてくれます", "Không liên quan tới cấu trúc nào đã học"], 0,
      "Giống Vてもらいます (N5 bài 24), Vていただきます áp dụng cho HÀNH ĐỘNG được nhận (không chỉ vật), thêm sắc thái khiêm nhường.",
      "Kết nối với kiến thức N5 bài 24."),
    q(L, 7, "Câu nào phù hợp khi biếu quà cho GIÁM ĐỐC (người có địa vị cao)?",
      ["社長に お土産を 差し上げました", "社長に お土産を やりました",
       "社長に お土産を あげました (không sai nhưng chưa đủ trang trọng)", "社長に お土産を くれました"], 0,
      "差し上げます là bậc kính ngữ CAO NHẤT, phù hợp nhất khi biếu tặng người có địa vị cao như giám đốc.",
      "Áp dụng đúng thang bậc đã học ở slide 1."),
    q(L, 8, "ありがたい trong 「教えていただき、ありがたいです」 có nghĩa:",
      ["Đáng quý, đáng biết ơn", "Khó khăn, vất vả", "Bình thường, không đặc biệt", "Đáng tiếc"], 0,
      "ありがたい diễn tả cảm giác biết ơn sâu sắc, thường đi kèm cấu trúc いただく để nhấn mạnh lòng biết ơn.",
      "Xem nghĩa của từ này ở phần từ vựng."),
    q(L, 9, "Trong hội thoại, Santos được thầy giáo tặng gì nhân sinh nhật?",
      ["Một quyển sách", "Một bó hoa", "Tiền mặt", "Không được tặng gì"], 0,
      "Santos nói 「先生が本をくださいました」.",
      "Xem câu thoại thứ 4."),
    q(L, 10, "Cuối hội thoại, hai người định làm gì cho thầy giáo?",
      ["Kính biếu vé xem hoa anh đào", "Mời thầy đi ăn", "Tặng sách", "Không làm gì cả"], 0,
      "Santos đề nghị 「先生にもチケットを差し上げましょう」.",
      "Xem câu thoại thứ 8."),
]

LESSON = lesson(
    L,
    "Bài 41: Kính ngữ cho nhận (やる / あげる / さしあげる, いただく, くださる)",
    "Mở rộng bộ ba cho-nhận (N5 bài 7, 24) sang kính ngữ: ba bậc của あげる (やる<あげる<差し上げ"
    "る tùy địa vị người nhận), いただきます (khiêm nhường ngữ của もらいます, hạ mình khi nhận), "
    "và くださいます (tôn kính ngữ của くれます, nâng người trên khi họ cho mình) — nền tảng cho "
    "尊敬語/謙譲語 sẽ học đầy đủ ở bài 49-50.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
