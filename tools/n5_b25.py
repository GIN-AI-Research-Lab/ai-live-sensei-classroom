# -*- coding: utf-8 -*-
"""N5 — Bai 25 (bai chot N5): The gia dinh たら va nhuong bo ても.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 25
pool = Pool("n5")

VOCAB = [
    v(1,  "つかれます", "疲れます", "つかれます", "tsukaremasu", "verb", "Mệt, mệt mỏi", "疲れたら、休みます = nếu mệt thì nghỉ ngơi.", L),
    v(2,  "やすみます", "休みます", "やすみます", "yasumimasu", "verb", "Nghỉ ngơi, nghỉ (làm/học)", "Đã gặp bài 4.", L),
    v(3,  "かいものします", "買い物します", "かいものします", "kaimonoshimasu", "verb", "Mua sắm", "Đã gặp bài 19.", L),
    v(4,  "りょこうします", "旅行します", "りょこうします", "ryokoushimasu", "verb", "Đi du lịch", "お金が あったら、旅行します = nếu có tiền thì đi du lịch.", L),
    v(5,  "がんばります", "頑張ります", "がんばります", "ganbarimasu", "verb", "Cố gắng, nỗ lực", "頑張っても、できません = dù cố gắng thế nào cũng không làm được.", L),
    v(6,  "おかね", "お金", "おかね", "okane", "noun", "Tiền", "お金が あったら = nếu có tiền.", L),
    v(7,  "やすみ", "休み", "やすみ", "yasumi", "noun", "Ngày nghỉ, kỳ nghỉ", "Đã gặp bài 4.", L),
    v(8,  "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp bài 3.", L),
    v(9,  "しごと", "仕事", "しごと", "shigoto", "noun", "Công việc", "Đã gặp bài 9.", L),
    v(10, "てんき", "天気", "てんき", "tenki", "noun", "Thời tiết", "Đã gặp bài 21.", L),
    v(11, "あめ", "雨", "あめ", "ame", "noun", "Mưa", "Đã gặp bài 21.", L),
    v(12, "いそがしい", "忙しい", "いそがしい", "isogashii", "adjective", "Bận rộn", "Đã gặp bài 9.", L),
    v(13, "たかい", "高い", "たかい", "takai", "adjective", "Đắt, cao", "Đã gặp bài 8.", L),
    v(14, "やすい", "安い", "やすい", "yasui", "adjective", "Rẻ", "Đã gặp bài 8.", L),
    v(15, "げんき", "元気", "げんき", "genki", "adjective", "Khỏe mạnh", "Đã gặp bài 8.", L),
    v(16, "たいせつ", "大切", "たいせつ", "taisetsu", "adjective", "Quan trọng, quý giá", "Đã gặp bài 21.", L),
    v(17, "らいしゅう", "来週", "らいしゅう", "raishuu", "noun", "Tuần sau", "Đã gặp bài 4.", L),
    v(18, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "Đã gặp bài 1.", L),
    v(19, "しつもん", "質問", "しつもん", "shitsumon", "noun", "Câu hỏi", "Đã gặp bài 11.", L),
    v(20, "ぜんぶ", "全部", "ぜんぶ", "zenbu", "noun", "Tất cả, toàn bộ", "ぜんぶ 頑張っても = dù cố gắng hết sức.", L),
]

KANJI = [
    k(1, "疲", "BÌ", 10, ["ヒ (hi)"], ["つか(れる)"], "Mệt mỏi.",
      [("疲れます", "つかれます", "Mệt"), ("疲労", "ひろう", "Sự mệt mỏi (Hán Việt)")], L),
    k(2, "金", "KIM", 8, ["キン (kin)"], ["かね"], "Tiền, vàng, kim loại.",
      [("お金", "おかね", "Tiền"), ("金曜日", "きんようび", "Thứ Sáu"), ("料金", "りょうきん", "Cước phí")], L),
    k(3, "頑", "NGOAN", 13, ["ガン (gan)"], [], "Ngoan cường, cố chấp (chỉ dùng trong 頑張る).",
      [("頑張ります", "がんばります", "Cố gắng"), ("頑張って", "がんばって", "Cố lên")], L),
    k(4, "全", "TOÀN", 6, ["ゼン (zen)"], ["まった(く)"], "Toàn bộ, hoàn toàn.",
      [("全部", "ぜんぶ", "Tất cả"), ("全然", "ぜんぜん", "Hoàn toàn (không)"), ("安全", "あんぜん", "An toàn")], L),
    k(5, "問", "VẤN", 11, ["モン (mon)"], ["と(う)"], "Hỏi, vấn đề.",
      [("質問", "しつもん", "Câu hỏi"), ("問題", "もんだい", "Vấn đề"), ("訪問", "ほうもん", "Thăm hỏi")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chia thể たら (giống hệt quy tắc thể た, thêm ら)",
        "[Thể た] + ら",
        "たら chia hệt thể た đã học ở bài 19 — chỉ thêm ら vào cuối. Nếu đã thuộc thể た thì "
        "たら gần như không cần học lại quy tắc chia từ đầu.",
        [
            ex(L, 1, 1, [t("t-l25s1-1", "つかれたら", "疲れたら", "つかれたら", key=True), t("t-l25s1-2", "、"),
                         t("t-l25s1-3", "やすみます", "休みます", "やすみます")],
               "Nếu mệt thì nghỉ ngơi. (疲れた → 疲れたら)"),
            ex(L, 1, 2, [t("t-l25s1-4", "あめ", "雨", "あめ"), t("t-l25s1-5", "だったら", key=True),
                         t("t-l25s1-6", "、"), t("t-l25s1-7", "いきません", "行きません", "いきません")],
               "Nếu trời mưa thì tôi không đi. (danh từ+だ → だったら)"),
        ],
        tips="Quy tắc chia たら = quy tắc chia た (bài 19) + ら — không có kiểu biến âm mới nào phải học thêm.",
        culture="たら là cấu trúc điều kiện DỄ DÙNG NHẤT trong tiếng Nhật vì áp dụng được cho MỌI từ loại theo cùng một cách."),

    slide(L, 2,
        "2. Giả định 'nếu': たら cho điều kiện CHƯA CHẮC xảy ra",
        "[Điều kiện]たら、[kết quả]",
        "Khi vế điều kiện là việc CHƯA CHẮC XẢY RA (giả định), たら dịch là 'NẾU'. Khác と (bài 23) "
        "vốn chỉ dùng cho quy luật LUÔN đúng — たら linh hoạt hơn, dùng được cho mọi mối quan hệ.",
        [
            ex(L, 2, 1, [t("t-l25s2-1", "おかね", "お金", "おかね"), t("t-l25s2-2", "が"),
                         t("t-l25s2-3", "あったら", "有ったら", "あったら", key=True), t("t-l25s2-4", "、"),
                         t("t-l25s2-5", "りょこう", "旅行", "りょこう"), t("t-l25s2-6", "します")],
               "Nếu có tiền, tôi sẽ đi du lịch."),
            ex(L, 2, 2, [t("t-l25s2-7", "わからなかったら", "分からなかったら", "わからなかったら", key=True), t("t-l25s2-8", "、"),
                         t("t-l25s2-9", "せんせい", "先生", "せんせい"), t("t-l25s2-10", "に"),
                         t("t-l25s2-11", "しつもん", "質問", "しつもん"), t("t-l25s2-12", "して"),
                         t("t-l25s2-13", "ください")],
               "Nếu không hiểu, xin hãy hỏi thầy giáo."),
        ],
        tips="Vế sau たら CÓ THỂ là mệnh lệnh, lời mời, ý chí cá nhân — khác hẳn と (bài 23) vốn cấm những dạng câu này.",
        culture="So sánh với と đã học ở bài 23: と cho quy luật tự nhiên luôn đúng, たら cho mọi tình huống giả định, kể cả một lần duy nhất."),

    slide(L, 3,
        "3. Sau khi: たら cho trình tự thời gian",
        "[Hành động 1]たら、[hành động 2]   (hành động 1 CHẮC CHẮN sẽ/đã xảy ra)",
        "たら còn dùng khi vế đầu là việc CHẮC CHẮN xảy ra theo thời gian (không phải giả định) — "
        "khi đó dịch gần với 'SAU KHI' hơn là 'nếu'. Phân biệt bằng ngữ cảnh.",
        [
            ex(L, 3, 1, [t("t-l25s3-1", "かいしゃ", "会社", "かいしゃ"), t("t-l25s3-2", "が"),
                         t("t-l25s3-3", "おわったら", "終わったら", "おわったら", key=True), t("t-l25s3-4", "、"),
                         t("t-l25s3-5", "かいものします", "買い物します", "かいものします")],
               "Sau khi (tan) làm xong, tôi sẽ đi mua sắm."),
            ex(L, 3, 2, [t("t-l25s3-6", "うち", "家", "うち"), t("t-l25s3-7", "に"),
                         t("t-l25s3-8", "かえったら", "帰ったら", "かえったら", key=True), t("t-l25s3-9", "、"),
                         t("t-l25s3-10", "でんわ", "電話", "でんわ"), t("t-l25s3-11", "して",),
                         t("t-l25s3-12", "ください")],
               "Sau khi về đến nhà, xin hãy gọi điện cho tôi."),
        ],
        tips="会社が終わる (tan làm) gần như CHẮC CHẮN xảy ra mỗi ngày — nên たら ở đây nghiêng nghĩa 'sau khi' hơn là 'nếu'.",
        culture="家に帰ったら、電話してください là câu dặn dò thường gặp giữa gia đình, bạn bè Nhật để báo an toàn khi về đến nhà."),

    slide(L, 4,
        "4. Nhượng bộ: [Thể て]も、[kết quả trái ngược mong đợi]",
        "Vても／Aくても／Aでも／Nでも + 、[kết quả KHÔNG như mong đợi]",
        "ても (dù...) diễn tả: dù điều kiện A xảy ra, kết quả VẪN KHÔNG đổi theo hướng mong đợi — "
        "hoàn toàn khác も đơn thuần (cũng, bài 2). Ghép vào thể て đã học từ bài 14.",
        [
            ex(L, 4, 1, [t("t-l25s4-1", "がんばっても", "頑張っても", "がんばっても", key=True), t("t-l25s4-2", "、"),
                         t("t-l25s4-3", "できません", key=True)],
               "Dù cố gắng thế nào cũng không làm được."),
            ex(L, 4, 2, [t("t-l25s4-11", "たかくても", "高くても", "たかくても", key=True), t("t-l25s4-12", "、"),
                         t("t-l25s4-13", "かいます", "買います", "かいます")],
               "Dù đắt tôi vẫn mua."),
            ex(L, 4, 3, [t("t-l25s4-14", "あめ", "雨", "あめ"), t("t-l25s4-15", "でも", key=True),
                         t("t-l25s4-16", "、"), t("t-l25s4-17", "いきます", "行きます", "いきます")],
               "Dù trời mưa tôi vẫn đi. (danh từ + でも)"),
        ],
        tips="ても LUÔN kèm kết quả TRÁI VỚI KỲ VỌNG thông thường của điều kiện đó — nếu kết quả xuôi theo lẽ tự nhiên thì không dùng ても.",
        culture="頑張っても できません là câu than thở phổ biến khi diễn tả sự bất lực dù đã nỗ lực hết sức — rất thường gặp trong hội thoại đời sống."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên năm cuối",
         [t("d-l25-1", "サントスさん"), t("d-l25-2", "、"), t("d-l25-3", "らいしゅう", "来週", "らいしゅう", key=True),
          t("d-l25-4", "の"), t("d-l25-5", "やすみ", "休み", "やすみ", key=True), t("d-l25-6", "、"),
          t("d-l25-7", "なに", "何", "なに"), t("d-l25-8", "を"), t("d-l25-9", "しますか")],
         "Anh Santos, kỳ nghỉ tuần sau anh định làm gì?"),
    line(L, 2, "サントス", "Sinh viên năm cuối",
         [t("d-l25-10", "てんき", "天気", "てんき", key=True), t("d-l25-11", "が"), t("d-l25-12", "よかったら", key=True),
          t("d-l25-13", "、"), t("d-l25-14", "りょこう", "旅行", "りょこう"), t("d-l25-15", "します")],
         "Nếu thời tiết tốt, tôi sẽ đi du lịch."),
    line(L, 3, "ワン", "Sinh viên năm cuối",
         [t("d-l25-16", "あめ", "雨", "あめ", key=True), t("d-l25-17", "だったら", key=True), t("d-l25-18", "、"),
          t("d-l25-19", "どうしますか")],
         "Nếu trời mưa thì sao?"),
    line(L, 4, "サントス", "Sinh viên năm cuối",
         [t("d-l25-20", "あめ", "雨", "あめ"), t("d-l25-21", "でも", key=True), t("d-l25-22", "、"),
          t("d-l25-23", "かいものします", "買い物します", "かいものします", key=True)],
         "Dù trời mưa, tôi vẫn đi mua sắm."),
    line(L, 5, "ワン", "Sinh viên năm cuối",
         [t("d-l25-24", "いいですね"), t("d-l25-25", "。"), t("d-l25-26", "おかね", "お金", "おかね", key=True),
          t("d-l25-27", "が"), t("d-l25-28", "たくさん"), t("d-l25-29", "あったら", key=True),
          t("d-l25-30", "、"), t("d-l25-31", "なに", "何", "なに"), t("d-l25-32", "を"),
          t("d-l25-33", "かいたい", "買いたい", "かいたい"), t("d-l25-34", "ですか")],
         "Hay đó. Nếu có nhiều tiền, anh muốn mua gì?"),
    line(L, 6, "サントス", "Sinh viên năm cuối",
         [t("d-l25-35", "あたらしい", "新しい", "あたらしい"), t("d-l25-36", "カメラ"), t("d-l25-37", "を"),
          t("d-l25-38", "かいたい", "買いたい", "かいたい"), t("d-l25-39", "です"), t("d-l25-40", "。"),
          t("d-l25-41", "たかくても", "高くても", "たかくても", key=True), t("d-l25-42", "、"),
          t("d-l25-43", "かいます", "買います", "かいます")],
         "Tôi muốn mua máy ảnh mới. Dù đắt tôi vẫn mua."),
    line(L, 7, "ワン", "Sinh viên năm cuối",
         [t("d-l25-44", "わたし", "私", "わたし"), t("d-l25-45", "は"), t("d-l25-46", "しごと", "仕事", "しごと", key=True),
          t("d-l25-47", "が"), t("d-l25-48", "おわったら", "終わったら", "おわったら", key=True), t("d-l25-49", "、"),
          t("d-l25-50", "うち", "家", "うち"), t("d-l25-51", "で"), t("d-l25-52", "やすみたい", "休みたい", "やすみたい"),
          t("d-l25-53", "です")],
         "Còn tớ thì sau khi làm xong việc, chỉ muốn nghỉ ở nhà thôi."),
    line(L, 8, "サントス", "Sinh viên năm cuối",
         [t("d-l25-54", "つかれて", "疲れて", "つかれて"), t("d-l25-55", "いますか")],
         "Cậu đang mệt à?"),
    line(L, 9, "ワン", "Sinh viên năm cuối",
         [t("d-l25-56", "はい"), t("d-l25-57", "、"), t("d-l25-58", "でも"), t("d-l25-59", "、"),
          t("d-l25-60", "つかれても", "疲れても", "つかれても", key=True), t("d-l25-61", "、"),
          t("d-l25-62", "べんきょう", "勉強", "べんきょう"), t("d-l25-63", "を"), t("d-l25-64", "がんばります", "頑張ります", "がんばります", key=True)],
         "Ừ, nhưng dù mệt tớ vẫn sẽ cố gắng học."),
    line(L, 10, "サントス", "Sinh viên năm cuối",
         [t("d-l25-65", "がんばって", "頑張って", "がんばって"), t("d-l25-66", "ください"), t("d-l25-67", "。"),
          t("d-l25-68", "げんき", "元気", "げんき", key=True), t("d-l25-69", "で"), t("d-l25-70", "！")],
         "Cố lên nhé. Giữ sức khỏe nha!"),
]

EXERCISES = [
    q(L, 1, "Thể たら của 疲れた (thể た) là:",
      ["疲れたら", "疲れったら", "疲れらた", "疲れるたら"], 0,
      "たら chia hệt thể た, chỉ thêm ら: 疲れた → 疲れたら.",
      "Áp dụng đúng quy tắc た + ら."),
    q(L, 2, "「お金が あったら、旅行します」 nghĩa là:",
      ["Nếu có tiền, tôi sẽ đi du lịch (giả định chưa chắc)",
       "Tôi đã có tiền và đã đi du lịch", "Tôi không có tiền nên không đi du lịch",
       "Sau khi có tiền xong thì thôi không đi du lịch nữa"], 0,
      "たら cho điều kiện GIẢ ĐỊNH (chưa chắc xảy ra) dịch là 'nếu' — 'có tiền' ở đây chưa chắc chắn.",
      "Xem slide 2 về nghĩa 'nếu'."),
    q(L, 3, "「家に帰ったら、電話してください」 — たら ở đây nghiêng về nghĩa nào?",
      ["Sau khi (về nhà là việc chắc chắn sẽ xảy ra)", "Nếu (việc chưa chắc xảy ra)",
       "Dù (nhượng bộ)", "Trong khi"], 0,
      "Về đến nhà là việc CHẮC CHẮN sẽ xảy ra (không phải giả định) — nên たら ở đây gần nghĩa 'sau khi' hơn.",
      "So sánh với câu 2, nơi điều kiện chưa chắc xảy ra."),
    q(L, 4, "So sánh と (bài 23) và たら, khác biệt chính là:",
      ["と chỉ dùng cho quy luật LUÔN đúng, たら dùng được cho mọi giả định kể cả một lần",
       "Hoàn toàn giống nhau", "と chỉ dùng cho câu hỏi",
       "たら không chia được với tính từ"], 0,
      "と giới hạn ở quy luật tất yếu (vế sau không được là mệnh lệnh/lời mời), たら linh hoạt hơn nhiều, cho phép mọi loại vế sau.",
      "Đây là điểm khác biệt cốt lõi đã nêu ở slide 2."),
    q(L, 5, "「高くても、買います」 nghĩa là:",
      ["Dù đắt tôi vẫn mua", "Vì đắt nên tôi mua", "Nếu đắt thì tôi mua",
       "Đắt nên tôi không mua"], 0,
      "ても diễn tả nhượng bộ: dù điều kiện (đắt) có xảy ra, kết quả vẫn KHÔNG đổi (vẫn mua) — trái ngược lẽ thường.",
      "So sánh với vì/nếu (から, たら) đã học."),
    q(L, 6, "「雨でも、行きます」 — vì sao dùng でも thay vì ても?",
      ["雨 là danh từ, danh từ ghép ても phải thành でも",
       "でも là lỗi chính tả của ても", "でも chỉ dùng cho câu hỏi",
       "Không có khác biệt gì, dùng cái nào cũng được"], 0,
      "Danh từ/tính từ な ghép với ても sẽ biến thành でも (giống で trong で ございます), còn tính từ い/động từ giữ nguyên ても.",
      "Xem lại bảng chia ở slide 4."),
    q(L, 7, "「頑張っても、できません」 nghĩa là:",
      ["Dù cố gắng thế nào cũng không làm được", "Vì cố gắng nên đã làm được",
       "Nếu cố gắng thì sẽ làm được", "Không cần cố gắng cũng làm được"], 0,
      "ても khẳng định: dù có nỗ lực (điều kiện), kết quả vẫn KHÔNG như mong muốn (trái ngược kỳ vọng).",
      "Đây là câu than thở điển hình dùng ても."),
    q(L, 8, "Câu nào có vế sau KHÔNG được phép nếu dùng と (bài 23) nhưng ĐƯỢC PHÉP nếu dùng たら?",
      ["疲れたら、休んでください (mệnh lệnh)", "春になると、花が咲きます (quy luật)",
       "右に曲がると、銀行があります (quy luật)", "ボタンを押すと、開きます (quy luật)"], 0,
      "たら cho phép vế sau là mệnh lệnh/lời mời/ý chí cá nhân (休んでください); と thì cấm điều này, chỉ cho kết quả tất yếu khách quan.",
      "Nhớ lại giới hạn của と đã học ở bài 23."),
    q(L, 9, "Trong hội thoại, nếu trời mưa Santos sẽ làm gì?",
      ["Đi mua sắm", "Ở nhà cả ngày", "Hủy hết kế hoạch", "Không được nhắc tới"], 0,
      "Santos nói 「雨でも、買い物します」.",
      "Xem câu thoại thứ 4."),
    q(L, 10, "Cuối hội thoại, Wang quyết tâm làm gì dù đang mệt?",
      ["Cố gắng học bài", "Đi ngủ sớm", "Đi du lịch cùng Santos", "Nghỉ hẳn việc học"], 0,
      "Wang nói 「疲れても、勉強を頑張ります」.",
      "Xem câu thoại thứ 9, câu chốt cả khóa N5."),
]

LESSON = lesson(
    L,
    "Bài 25: Thể điều kiện giả định (〜たら / 〜ても)",
    "Bài chốt N5: chia thể たら (giống quy tắc thể た, chỉ thêm ら), dùng cho cả giả định 'nếu' "
    "(điều kiện chưa chắc, vế sau được là mệnh lệnh/lời mời — linh hoạt hơn と ở bài 23) và trình "
    "tự 'sau khi' (điều kiện chắc chắn xảy ra); và thể nhượng bộ ても/でも diễn tả 'dù...vẫn...', "
    "kết quả trái ngược kỳ vọng của điều kiện.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
