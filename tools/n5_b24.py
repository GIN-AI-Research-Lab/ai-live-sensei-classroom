# -*- coding: utf-8 -*-
"""N5 — Bài 24: Cho-nhan hanh dong Vてくれます/Vてもらいます/Vてあげます.

Mo rong tu bai 7 (cho-nhan DO VAT: agemasu/moraimasu) sang cho-nhan HANH
DONG GIUP DO. Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 24
pool = Pool("n5")

VOCAB = [
    v(1,  "くれます", "呉れます", "くれます", "kuremasu", "verb", "Cho (người khác làm gì đó CHO MÌNH)", "Chủ ngữ luôn là NGƯỜI KHÁC, người nhận ơn luôn là người nói/phe người nói.", L),
    v(2,  "もらいます", "", "", "moraimasu", "verb", "Nhận, được (nhờ ai làm gì đó)", "Đã gặp bài 7 (nhận đồ vật) — nay mở rộng sang nhận HÀNH ĐỘNG giúp đỡ.", L),
    v(3,  "あげます", "上げます", "あげます", "agemasu", "verb", "Cho, làm gì đó CHO người khác", "Đã gặp bài 7 — nay mở rộng sang làm HÀNH ĐỘNG giúp đỡ cho người khác.", L),
    v(4,  "おしえます", "教えます", "おしえます", "oshiemasu", "verb", "Dạy, chỉ bảo", "Đã gặp bài 7. 道を 教えて くれました = đã chỉ đường giúp tôi.", L),
    v(5,  "かします", "貸します", "かします", "kashimasu", "verb", "Cho mượn", "Đã gặp bài 7.", L),
    v(6,  "もちます", "持ちます", "もちます", "mochimasu", "verb", "Cầm, mang, xách", "Đã gặp bài 14. 荷物を 持って くれました = đã cầm hành lý giúp tôi.", L),
    v(7,  "あらいます", "洗います", "あらいます", "araimasu", "verb", "Rửa, giặt", "Thể từ điển: 洗う. Nhóm 1.", L),
    v(8,  "つくります", "作ります", "つくります", "tsukurimasu", "verb", "Làm, nấu", "Đã gặp bài 6. 料理を 作って あげました = đã nấu ăn giúp.", L),
    v(9,  "かいます", "買います", "かいます", "kaimasu", "verb", "Mua", "Đã gặp bài 6. 買って きて くれました = đã mua giúp mang tới.", L),
    v(10, "にもつ", "荷物", "にもつ", "nimotsu", "noun", "Hành lý, đồ đạc", "重い 荷物 = hành lý nặng.", L),
    v(11, "おもい", "重い", "おもい", "omoi", "adjective", "Nặng", "Tính từ い. Trái nghĩa: 軽い (nhẹ, chưa học).", L),
    v(12, "ちず", "地図", "ちず", "chizu", "noun", "Bản đồ", "Đã gặp bài 7.", L),
    v(13, "えき", "駅", "えき", "eki", "noun", "Nhà ga", "Đã gặp bài 5.", L),
    v(14, "みち", "道", "みち", "michi", "noun", "Đường, con đường", "道を 教えます = chỉ đường.", L),
    v(15, "じしょ", "辞書", "じしょ", "jisho", "noun", "Từ điển", "Đã gặp bài 2.", L),
    v(16, "しゃしん", "写真", "しゃしん", "shashin", "noun", "Bức ảnh", "Đã gặp bài 6.", L),
    v(17, "たんじょうび", "誕生日", "たんじょうび", "tanjoubi", "noun", "Sinh nhật", "Đã gặp bài 5.", L),
    v(18, "しんせつ", "親切", "しんせつ", "shinsetsu", "adjective", "Tốt bụng, ân cần", "Đã gặp bài 16 — nay dùng để khen người giúp đỡ.", L),
    v(19, "たすかります", "助かります", "たすかります", "tasukarimasu", "verb", "Được giúp đỡ, đỡ vất vả hơn", "助かりました = anh giúp tôi nhiều quá (câu cảm ơn sau khi nhận giúp đỡ).", L),
    v(20, "ほんとうに", "本当に", "ほんとうに", "hontou ni", "adverb", "Thật sự, thực lòng", "本当に ありがとう = thật lòng cảm ơn.", L),
]

KANJI = [
    k(1, "呉", "NGÔ", 7, ["ゴ (go)"], ["くれる"], "Cho (chỉ dùng trong 呉れる — thường viết hiragana くれる).",
      [("くれます", "くれます", "Cho (mình)"), ("呉服", "ごふく", "Vải vóc (từ cổ)")], L),
    k(2, "重", "TRỌNG", 9, ["ジュウ (juu)"], ["おも(い)", "かさ(なる)"], "Nặng; quan trọng; chồng lên.",
      [("重い", "おもい", "Nặng"), ("重要", "じゅうよう", "Quan trọng"), ("体重", "たいじゅう", "Cân nặng cơ thể")], L),
    k(3, "道", "ĐẠO", 12, ["ドウ (dou)"], ["みち"], "Con đường; đạo lý.",
      [("道", "みち", "Con đường"), ("道具", "どうぐ", "Dụng cụ"), ("柔道", "じゅうどう", "Judo")], L),
    k(4, "洗", "TẨY", 9, ["セン (sen)"], ["あら(う)"], "Rửa, giặt.",
      [("洗います", "あらいます", "Rửa"), ("洗濯", "せんたく", "Giặt giũ"), ("洗面所", "せんめんじょ", "Nhà vệ sinh/rửa mặt")], L),
    k(5, "助", "TRỢ", 7, ["ジョ (jo)"], ["たす(かる)", "たす(ける)"], "Giúp đỡ, trợ giúp.",
      [("助かります", "たすかります", "Được giúp đỡ"), ("助けます", "たすけます", "Giúp đỡ"), ("助手", "じょしゅ", "Trợ lý")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Người khác làm cho mình: [Người khác] は [mình] に Vて くれます",
        "[Người khác] は (私に) + Vて + くれます",
        "くれます dùng khi NGƯỜI KHÁC chủ động làm gì đó CHO MÌNH (hoặc phe mình) — chủ ngữ luôn là "
        "người khác, người nhận ơn (thường lược bỏ vì hiểu ngầm là 'tôi') đánh dấu bằng に nếu nói rõ.",
        [
            ex(L, 1, 1, [t("t-l24s1-1", "やまださん", "山田さん", "やまださん"), t("t-l24s1-2", "は"),
                         t("t-l24s1-3", "みち", "道", "みち"), t("t-l24s1-4", "を"),
                         t("t-l24s1-5", "おしえて", "教えて", "おしえて", key=True), t("t-l24s1-6", "くれました", key=True)],
               "Anh Yamada đã chỉ đường giúp tôi."),
            ex(L, 1, 2, [t("t-l24s1-7", "ともだち", "友達", "ともだち"), t("t-l24s1-8", "が"),
                         t("t-l24s1-9", "にもつ", "荷物", "にもつ"), t("t-l24s1-10", "を"),
                         t("t-l24s1-11", "もって", "持って", "もって", key=True), t("t-l24s1-12", "くれました", key=True)],
               "Bạn tôi đã cầm hành lý giúp tôi."),
        ],
        tips="くれます LUÔN hàm ý người nói BIẾT ƠN — không dùng khi nói về việc người khác làm cho một người thứ ba không liên quan tới mình.",
        culture="道を教えてくれました là câu cảm ơn tự nhiên khi kể lại chuyện được người lạ giúp chỉ đường ở Nhật."),

    slide(L, 2,
        "2. Mình nhờ/được giúp: [Mình] は [người khác] に Vて もらいます",
        "[Mình] は [người giúp] に + Vて + もらいます",
        "もらいます (đã gặp bài 7 với đồ vật) nay mở rộng sang HÀNH ĐỘNG — chủ ngữ là NGƯỜI NHẬN "
        "ơn (mình), người giúp đánh dấu bằng に. Cùng một sự việc, khác góc nhìn so với くれます.",
        [
            ex(L, 2, 1, [t("t-l24s2-1", "わたし", "私", "わたし"), t("t-l24s2-2", "は"),
                         t("t-l24s2-3", "やまださん", "山田さん", "やまださん"), t("t-l24s2-4", "に", key=True),
                         t("t-l24s2-5", "みち", "道", "みち"), t("t-l24s2-6", "を"),
                         t("t-l24s2-7", "おしえて", "教えて", "おしえて", key=True), t("t-l24s2-8", "もらいました", key=True)],
               "Tôi đã nhờ anh Yamada chỉ đường giúp. (cùng sự việc với slide 1, đổi góc nhìn)"),
            ex(L, 2, 2, [t("t-l24s2-9", "せんせい", "先生", "せんせい"), t("t-l24s2-10", "に", key=True),
                         t("t-l24s2-11", "にほんご", "日本語", "にほんご"), t("t-l24s2-12", "を"),
                         t("t-l24s2-13", "おしえて", "教えて", "おしえて", key=True), t("t-l24s2-14", "もらいました", key=True)],
               "Tôi đã được thầy giáo dạy tiếng Nhật giúp."),
        ],
        tips="くれます và もらいます thường tả CÙNG một sự việc — khác nhau ở việc AI làm chủ ngữ (người giúp hay người được giúp).",
        culture="もらいました nhấn mạnh sự CHỦ ĐỘNG nhờ vả nhẹ nhàng hơn — dùng khi muốn khiêm tốn về việc mình đã xin giúp đỡ."),

    slide(L, 3,
        "3. Mình làm cho người khác: [Mình] は [người khác] に Vて あげます",
        "[Mình] は [người nhận] に + Vて + あげます",
        "あげます (đã gặp bài 7) mở rộng sang HÀNH ĐỘNG — mình chủ động làm gì đó CHO người khác. "
        "Cẩn trọng: nói あげます trực tiếp với người trên dễ nghe như ban ơn, kẻ cả.",
        [
            ex(L, 3, 1, [t("t-l24s3-1", "わたし", "私", "わたし"), t("t-l24s3-2", "は"),
                         t("t-l24s3-3", "ともだち", "友達", "ともだち"), t("t-l24s3-4", "に", key=True),
                         t("t-l24s3-5", "じしょ", "辞書", "じしょ"), t("t-l24s3-6", "を"),
                         t("t-l24s3-7", "かして", "貸して", "かして", key=True), t("t-l24s3-8", "あげました", key=True)],
               "Tôi đã cho bạn mượn từ điển."),
            ex(L, 3, 2, [t("t-l24s3-9", "たんじょうび", "誕生日", "たんじょうび"), t("t-l24s3-10", "に"),
                         t("t-l24s3-11", "りょうり", "料理", "りょうり"), t("t-l24s3-12", "を"),
                         t("t-l24s3-13", "つくって", "作って", "つくって", key=True), t("t-l24s3-14", "あげました", key=True)],
               "Nhân sinh nhật, tôi đã nấu ăn cho (bạn)."),
        ],
        tips="Khi làm gì cho người TRÊN (thầy cô, cấp trên), nên tránh nói thẳng あげます — dễ nghe kẻ cả; có cách nói khiêm tốn hơn ở trình độ cao hơn.",
        culture="あげます thường tự nhiên nhất khi nói về việc làm cho BẠN BÈ, EM, hoặc THÚ CƯNG — ít dùng trực tiếp với người lớn tuổi hơn."),

    slide(L, 4,
        "4. Ba góc nhìn của cùng một sự việc",
        "山田さんが 教えてくれました = 私が 山田さんに 教えてもらいました",
        "So sánh trực tiếp くれます/もらいます tả CÙNG một hành động từ hai phía; あげます tả chiều "
        "NGƯỢC LẠI (mình → người khác). Chọn từ nào phụ thuộc ai là NGƯỜI NÓI muốn làm chủ ngữ.",
        [
            ex(L, 4, 1, [t("t-l24s4-1", "ともだち", "友達", "ともだち"), t("t-l24s4-2", "が"),
                         t("t-l24s4-3", "しゃしん", "写真", "しゃしん"), t("t-l24s4-4", "を"),
                         t("t-l24s4-5", "とって", "撮って", "とって", key=True), t("t-l24s4-6", "くれました", key=True)],
               "Bạn tôi đã chụp ảnh giúp tôi. (くれます: bạn là chủ ngữ)"),
            ex(L, 4, 2, [t("t-l24s4-7", "わたし", "私", "わたし"), t("t-l24s4-8", "は"),
                         t("t-l24s4-9", "ともだち", "友達", "ともだち"), t("t-l24s4-10", "に", key=True),
                         t("t-l24s4-11", "しゃしん", "写真", "しゃしん"), t("t-l24s4-12", "を"),
                         t("t-l24s4-13", "とって", "撮って", "とって", key=True), t("t-l24s4-14", "もらいました", key=True)],
               "Tôi đã nhờ bạn chụp ảnh giúp. (もらいます: tôi là chủ ngữ, cùng sự việc trên)"),
        ],
        tips="Ba động từ này thường bị nhầm hướng — luôn tự hỏi 'AI là người thực hiện hành động, AI là người hưởng lợi' trước khi chọn từ.",
        culture="助かりました (anh giúp tôi nhiều quá) là câu cảm ơn kèm theo rất tự nhiên sau khi dùng くれました/もらいました."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d-l24-1", "にもつ", "荷物", "にもつ", key=True), t("d-l24-2", "が"), t("d-l24-3", "おもい", "重い", "おもい", key=True),
          t("d-l24-4", "です"), t("d-l24-5", "ね")],
         "Hành lý nặng thật nhỉ."),
    line(L, 2, "サントス", "Sinh viên",
         [t("d-l24-6", "てつだいましょうか", "手伝いましょうか", "てつだいましょうか")],
         "Để tớ giúp cậu nhé?"),
    line(L, 3, "ワン", "Sinh viên",
         [t("d-l24-7", "ありがとう"), t("d-l24-8", "ございます"), t("d-l24-9", "。"), t("d-l24-10", "サントスさん"),
          t("d-l24-11", "が"), t("d-l24-12", "もって", "持って", "もって", key=True), t("d-l24-13", "くれる", key=True),
          t("d-l24-14", "と"), t("d-l24-15", "、"), t("d-l24-16", "たすかります", "助かります", "たすかります", key=True)],
         "Cảm ơn cậu. Nếu cậu cầm giúp thì đỡ vất vả hơn nhiều đấy."),
    line(L, 4, "サントス", "Sinh viên",
         [t("d-l24-17", "どういたしまして"), t("d-l24-18", "。"), t("d-l24-19", "えき", "駅", "えき", key=True),
          t("d-l24-20", "は"), t("d-l24-21", "どこ", key=True), t("d-l24-22", "ですか")],
         "Không có gì. Nhà ga ở đâu vậy?"),
    line(L, 5, "ワン", "Sinh viên",
         [t("d-l24-23", "わたし", "私", "わたし"), t("d-l24-24", "も"), t("d-l24-25", "しりません", "知りません", "しりません"),
          t("d-l24-26", "。"), t("d-l24-27", "あの"), t("d-l24-28", "ひと", "人", "ひと"),
          t("d-l24-29", "に"), t("d-l24-30", "みち", "道", "みち", key=True), t("d-l24-31", "を"),
          t("d-l24-32", "きいて", "聞いて", "きいて"), t("d-l24-33", "みましょう")],
         "Tớ cũng không biết. Thử hỏi đường người kia xem sao."),
    line(L, 6, "通行人", "Người qua đường",
         [t("d-l24-34", "はい"), t("d-l24-35", "、"), t("d-l24-36", "この"), t("d-l24-37", "ちず", "地図", "ちず", key=True),
          t("d-l24-38", "を"), t("d-l24-39", "みて", "見て", "みて"), t("d-l24-40", "ください")],
         "Vâng, mời xem bản đồ này."),
    line(L, 7, "ワン", "Sinh viên",
         [t("d-l24-41", "しんせつ", "親切", "しんせつ", key=True), t("d-l24-42", "に"), t("d-l24-43", "おしえて", "教えて", "おしえて", key=True),
          t("d-l24-44", "くれて", key=True), t("d-l24-45", "、"), t("d-l24-46", "ありがとう"),
          t("d-l24-47", "ございます")],
         "Cảm ơn ông/bà đã tốt bụng chỉ giúp."),
    line(L, 8, "通行人", "Người qua đường",
         [t("d-l24-48", "いいえ"), t("d-l24-49", "、"), t("d-l24-50", "どういたしまして")],
         "Không có gì đâu."),
    line(L, 9, "サントス", "Sinh viên",
         [t("d-l24-51", "ワンさん"), t("d-l24-52", "、"), t("d-l24-53", "あの"), t("d-l24-54", "ひと", "人", "ひと"),
          t("d-l24-55", "に"), t("d-l24-56", "みち", "道", "みち", key=True), t("d-l24-57", "を"),
          t("d-l24-58", "おしえて", "教えて", "おしえて", key=True), t("d-l24-59", "もらいました", key=True), t("d-l24-60", "ね")],
         "Wang này, chúng ta đã được người đó chỉ đường giúp nhỉ."),
    line(L, 10, "ワン", "Sinh viên",
         [t("d-l24-61", "はい"), t("d-l24-62", "、"), t("d-l24-63", "ほんとうに", "本当に", "ほんとうに", key=True),
          t("d-l24-64", "たすかりました", "助かりました", "たすかりました", key=True)],
         "Vâng, thật sự được giúp đỡ nhiều quá."),
]

EXERCISES = [
    q(L, 1, "「山田さんが 道を 教えて くれました」 — chủ ngữ của くれました là:",
      ["山田さん (người thực hiện hành động giúp đỡ)", "Người nói (tôi)",
       "Không có chủ ngữ", "Cả hai đều là chủ ngữ"], 0,
      "くれます LUÔN lấy NGƯỜI THỰC HIỆN hành động giúp đỡ làm chủ ngữ.",
      "Xem cấu trúc của くれます ở slide 1."),
    q(L, 2, "「私は 山田さんに 教えて もらいました」 — chủ ngữ ở đây là:",
      ["私 (người NHẬN được giúp đỡ)", "山田さん", "Không xác định", "Cả câu không có chủ ngữ"], 0,
      "もらいます LUÔN lấy NGƯỜI ĐƯỢC GIÚP làm chủ ngữ — ngược với くれます.",
      "So sánh trực tiếp với câu 1: cùng sự việc, khác chủ ngữ."),
    q(L, 3, "Hai câu 「山田さんが教えてくれました」 và 「私は山田さんに教えてもらいました」 có quan hệ:",
      ["Mô tả CÙNG một sự việc từ hai góc nhìn khác nhau",
       "Hai sự việc hoàn toàn khác nhau", "Câu thứ hai sai ngữ pháp",
       "Không có liên quan gì tới nhau"], 0,
      "Đây là hai cách nói tương đương của cùng một sự thật: chọn ai làm chủ ngữ tùy người nói muốn nhấn mạnh góc nhìn nào.",
      "Xem slide 4 để thấy sự tương đương."),
    q(L, 4, "「私は 友達に 辞書を 貸して あげました」 nghĩa là:",
      ["Tôi đã cho bạn mượn từ điển", "Tôi đã mượn từ điển của bạn",
       "Bạn tôi đã cho tôi mượn từ điển", "Tôi không cho bạn mượn từ điển"], 0,
      "あげます: CHỦ NGỮ (tôi) làm điều gì đó CHO người khác (bạn) — ở đây là cho mượn từ điển.",
      "Xem cấu trúc あげます ở slide 3."),
    q(L, 5, "Vì sao nên tránh nói あげます trực tiếp khi làm gì đó cho người TRÊN mình?",
      ["Nghe như ban ơn, kẻ cả với người trên", "Vì あげます sai ngữ pháp với người trên",
       "あげます chỉ dùng được với động vật", "Không có lý do gì đặc biệt"], 0,
      "あげます mang sắc thái 'tôi ban cho' — dùng trực tiếp với người trên (thầy cô, cấp trên) nghe thiếu tôn trọng.",
      "Đây là điểm tế nhị về văn hóa đã nêu ở slide 3."),
    q(L, 6, "「荷物を 持って くれると、助かります」 nghĩa là:",
      ["Nếu (ai đó) cầm giúp hành lý thì đỡ vất vả hơn", "Hành lý đã được cầm giúp rồi",
       "Không ai cầm giúp hành lý", "Hành lý quá nặng không cầm được"], 0,
      "Vてくれる kết hợp と (điều kiện, bài 23) diễn tả: NẾU có người giúp thì kết quả sẽ nhẹ nhõm hơn.",
      "Áp dụng kiến thức về と đã học ở bài 23."),
    q(L, 7, "助かりました dùng để làm gì?",
      ["Cảm ơn sau khi được ai đó giúp đỡ", "Xin lỗi vì đã làm phiền",
       "Từ chối lời đề nghị giúp đỡ", "Yêu cầu được giúp đỡ"], 0,
      "助かりました là câu cảm ơn ĐI KÈM sau khi nhận được sự giúp đỡ, nhấn mạnh cảm giác 'đỡ vất vả hơn nhờ có sự giúp đỡ đó'.",
      "Xem ngữ cảnh sử dụng ở phần từ vựng và hội thoại."),
    q(L, 8, "Câu nào ĐÚNG khi nói 'tôi đã nấu ăn cho bạn nhân sinh nhật'?",
      ["誕生日に 料理を 作って あげました", "誕生日に 料理を 作って くれました",
       "誕生日に 料理を 作って もらいました", "誕生日に 料理が 作って あげました"], 0,
      "Chủ ngữ là 'tôi' làm việc CHO người khác (bạn) → dùng あげます, và を đánh dấu tân ngữ料理 đúng ngữ pháp.",
      "Xác định ai làm hành động, ai nhận lợi ích."),
    q(L, 9, "Trong hội thoại, ai đã chỉ đường cho Wang và Santos?",
      ["Một người qua đường lạ", "Anh Yamada", "Thầy giáo", "Nhân viên nhà ga"], 0,
      "Hai bạn hỏi 「あの人に道を聞いてみましょう」 rồi một 通行人 (người qua đường) đã giúp chỉ đường.",
      "Xem nhân vật xuất hiện trong hội thoại."),
    q(L, 10, "Cuối hội thoại, Wang cảm thấy thế nào về sự giúp đỡ nhận được?",
      ["Thật sự được giúp đỡ nhiều (助かりました)", "Không cần thiết",
       "Hơi phiền phức", "Không hài lòng"], 0,
      "Wang nói 「本当に 助かりました」 để cảm ơn.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 24: Cho và nhận hành động (Vてくれます / Vてもらいます / Vてあげます)",
    "Mở rộng cấu trúc cho-nhận đồ vật (bài 7) sang cho-nhận HÀNH ĐỘNG giúp đỡ: người khác chủ động "
    "giúp mình bằng Vてくれます, mình nhờ/được giúp bằng Vてもらいます (cùng sự việc, khác chủ ngữ "
    "so với くれます), và mình chủ động giúp người khác bằng Vてあげます (cẩn trọng khi dùng với "
    "người trên).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
