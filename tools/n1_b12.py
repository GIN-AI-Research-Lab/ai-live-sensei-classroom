# -*- coding: utf-8 -*-
"""N1 — Bai 12: Dieu kien tien quyet sinh tu — Nなくしては、〜ない (neu KHONG
CO N thi khong the... N la dieu kien tien quyet TUYET DOI/song con, van phong
trang trong, hay tach vai sau bang dau phay) va Nなしには〜ない (gan nhu dong
nghia nhung gan sat hon vao ve phu dinh phia sau, sac thai tuong thuat hon).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 12
pool = Pool("n1")

VOCAB = [
    v(1,  "ぎせい", "犠牲", "ぎせい", "gisei", "noun", "Sự hy sinh", "多くの 犠牲を 払います = trả giá bằng nhiều sự hy sinh.", L),
    v(2,  "たすけ", "助け", "たすけ", "tasuke", "noun", "Sự giúp đỡ", "先生の 助けを 借ります = nhờ đến sự giúp đỡ của thầy cô.", L),
    v(3,  "おんけい", "恩恵", "おんけい", "onkei", "noun", "Ân huệ, hồng ân, lợi ích được ban cho", "自然の 恩恵を 受けます = nhận được ân huệ của thiên nhiên.", L),
    v(4,  "かんしゃ", "感謝", "かんしゃ", "kansha", "noun", "Lòng biết ơn, sự cảm tạ", "皆様に 感謝します = bày tỏ lòng biết ơn tới mọi người.", L),
    v(5,  "ささえます", "支えます", "ささえます", "sasaemasu", "verb", "Nâng đỡ, hỗ trợ, chống đỡ", "家族が 私を 支えます = gia đình nâng đỡ tôi.", L),
    v(6,  "そんざい", "存在", "そんざい", "sonzai", "noun", "Sự tồn tại, sự hiện diện", "仲間の 存在は 大きいです = sự hiện diện của đồng đội rất lớn lao.", L),
    v(7,  "なかま", "仲間", "なかま", "nakama", "noun", "Đồng đội, bạn bè cùng chí hướng", "仲間と 頑張ります = cố gắng cùng đồng đội.", L),
    v(8,  "ゆうしょう", "優勝", "ゆうしょう", "yuushou", "noun", "Chức vô địch, sự vô địch", "大会で 優勝しました = đã giành chức vô địch tại giải đấu.", L),
    v(9,  "おうえん", "応援", "おうえん", "ouen", "noun", "Sự cổ vũ, ủng hộ", "みんなが 応援します = mọi người cổ vũ.", L),
    v(10, "どりょく", "努力", "どりょく", "doryoku", "noun", "Nỗ lực", "Đã gặp N3 bài 2.", L),
    v(11, "せいこう", "成功", "せいこう", "seikou", "noun", "Thành công", "Đã gặp N3 bài 4.", L),
    v(12, "しんらい", "信頼", "しんらい", "shinrai", "noun", "Sự tin cậy, niềm tin", "Đã gặp N1 bài 6.", L),
    v(13, "かぞく", "家族", "かぞく", "kazoku", "noun", "Gia đình", "Đã gặp N5 bài 20.", L),
    v(14, "せんしゅ", "選手", "せんしゅ", "senshu", "noun", "Vận động viên, tuyển thủ", "Đã gặp N2 bài 9.", L),
    v(15, "たいかい", "大会", "たいかい", "taikai", "noun", "Đại hội, giải đấu lớn", "Đã gặp N3 bài 7.", L),
    v(16, "しあい", "試合", "しあい", "shiai", "noun", "Trận đấu", "Đã gặp N4 bài 33.", L),
    v(17, "きしゃ", "記者", "きしゃ", "kisha", "noun", "Phóng viên", "Đã gặp N1 bài 9.", L),
    v(18, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N3 bài 13.", L),
    v(19, "せきにん", "責任", "せきにん", "sekinin", "noun", "Trách nhiệm", "Đã gặp N1 bài 5.", L),
    v(20, "かんがえます", "考えます", "かんがえます", "kangaemasu", "verb", "Suy nghĩ, cân nhắc", "Đã gặp N5 bài 21.", L),
]

KANJI = [
    k(1, "犠", "HY", 17, ["ギ (gi)"], [], "Hy sinh, cống hiến.",
      [("犠牲", "ぎせい", "Sự hy sinh"), ("犠牲者", "ぎせいしゃ", "Nạn nhân")], L),
    k(2, "恩", "ÂN", 10, ["オン (on)"], [], "Ân huệ, ơn nghĩa.",
      [("恩恵", "おんけい", "Ân huệ, hồng ân"), ("恩人", "おんじん", "Ân nhân")], L),
    k(3, "存", "TỒN", 6, ["ソン (son)", "ゾン (zon)"], [], "Tồn tại, còn lại.",
      [("存在", "そんざい", "Sự tồn tại"), ("保存", "ほぞん", "Bảo tồn, bảo quản")], L),
    k(4, "仲", "TRỌNG", 6, ["チュウ (chuu)"], ["なか"], "Quan hệ, ở giữa.",
      [("仲間", "なかま", "Đồng đội, bạn bè"), ("仲良し", "なかよし", "Thân thiết")], L),
    k(5, "勝", "THẮNG", 12, ["ショウ (shou)"], ["か(つ)"], "Thắng, chiến thắng.",
      [("優勝", "ゆうしょう", "Vô địch"), ("勝ちます", "かちます", "Thắng")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Nếu không có... thì không thể... (điều kiện sống còn): N + なくしては、〜ない",
        "N(điều kiện tiên quyết) + なくしては、[vế sau luôn ở dạng PHỦ ĐỊNH]",
        "Nなくしては、〜ない diễn tả rằng N là một điều kiện TIÊN QUYẾT TUYỆT ĐỐI/SỐNG CÒN — nếu "
        "THIẾU N thì vế sau (luôn phủ định) KHÔNG THỂ xảy ra. Văn phong rất TRANG TRỌNG, thường "
        "tách N khỏi vế sau bằng dấu phẩy, hay dùng trong bài phát biểu cảm ơn/diễn văn trang trọng.",
        [
            ex(L, 1, 1, [t("t-l12s1-1", "みなさま", "皆様", "みなさま"), t("t-l12s1-2", "の"),
                         t("t-l12s1-3", "ささえ", "支え", "ささえ", key=True), t("t-l12s1-4", "なくしては", key=True),
                         t("t-l12s1-5", "、"), t("t-l12s1-6", "この"), t("t-l12s1-7", "ゆうしょう", "優勝", "ゆうしょう", key=True),
                         t("t-l12s1-8", "は"), t("t-l12s1-9", "ありませんでした")],
               "Nếu không có sự nâng đỡ của quý vị, thì đã không có chức vô địch này."),
            ex(L, 1, 2, [t("t-l12s1-10", "おおくの", "多くの", "おおくの"), t("t-l12s1-11", "ぎせい", "犠牲", "ぎせい", key=True),
                         t("t-l12s1-12", "なくしては", key=True), t("t-l12s1-13", "、"),
                         t("t-l12s1-14", "せいこう", "成功", "せいこう", key=True), t("t-l12s1-15", "は"),
                         t("t-l12s1-16", "えられなかっただろう", "得られなかっただろう", "えられなかっただろう")],
               "Nếu không có nhiều sự hy sinh, có lẽ đã không đạt được thành công."),
        ],
        tips="なくしては hay tách N ra khỏi vế sau bằng dấu phẩy để nhấn mạnh — vế sau LUÔN là hình thức phủ định (ない/なかった/ありません).",
        culture="Trong diễn văn nhậm giải/phát biểu cảm ơn ở Nhật, cụm '皆様のご支援なくしては' (nếu không có sự ủng hộ của quý vị) là câu mở đầu lời cảm ơn rất trang trọng, kinh điển."),

    slide(L, 2,
        "2. Không có... thì không... (gắn sát với vế phủ định): N + なしには〜ない",
        "N(điều kiện tiên quyết) + なしには、[vế sau PHỦ ĐỊNH]",
        "Nなしには〜ない cũng diễn tả 'không có N thì không thể...', gần như ĐỒNG NGHĨA với なくしては "
        "— nhưng gắn liền/sát hơn vào động từ phủ định phía sau, sắc thái hơi TRUNG TÍNH/tường thuật "
        "hơn (so với なくしては thiên về văn phong phát biểu cảm động). Hai cấu trúc phần lớn hoán đổi được cho nhau.",
        [
            ex(L, 2, 1, [t("t-l12s2-1", "かぞく", "家族", "かぞく", key=True), t("t-l12s2-2", "の"),
                         t("t-l12s2-3", "ささえ", "支え", "ささえ", key=True), t("t-l12s2-4", "なしには", key=True),
                         t("t-l12s2-5", "、"), t("t-l12s2-6", "この"), t("t-l12s2-7", "しあい", "試合", "しあい", key=True),
                         t("t-l12s2-8", "に"), t("t-l12s2-9", "かてなかった", "勝てなかった", "かてなかった")],
               "Không có sự nâng đỡ của gia đình, đã không thể thắng trận đấu này."),
            ex(L, 2, 2, [t("t-l12s2-10", "せんせい", "先生", "せんせい"), t("t-l12s2-11", "の"),
                         t("t-l12s2-12", "たすけ", "助け", "たすけ", key=True), t("t-l12s2-13", "なしには", key=True),
                         t("t-l12s2-14", "、"), t("t-l12s2-15", "ゆうしょう", "優勝", "ゆうしょう", key=True),
                         t("t-l12s2-16", "は"), t("t-l12s2-17", "ふかのうだっただろう", "不可能だっただろう", "ふかのうだっただろう")],
               "Không có sự giúp đỡ của thầy cô, chức vô địch có lẽ đã là bất khả thi."),
        ],
        tips="なしには gắn sát ngay vào cấu trúc câu, ít khi tách dấu phẩy dài như なくしては — hay gặp trong văn miêu tả/tường thuật khách quan hơn là lời phát biểu cảm động.",
        culture="なしには thường xuất hiện trong bài báo/bài phân tích khách quan: '専門家の協力なしには、この研究は完成しなかった' (không có sự hợp tác của chuyên gia, nghiên cứu này đã không hoàn thành)."),

    slide(L, 3,
        "3. So sánh なくしては và なしには",
        "なくしては: văn phong PHÁT BIỂU/cảm động, hay tách dấu phẩy　vs　なしには: văn phong TƯỜNG THUẬT/trung tính, gắn sát vế sau",
        "Hai cấu trúc gần như ĐỒNG NGHĨA và có thể hoán đổi trong hầu hết trường hợp — cả hai đều "
        "diễn tả N là điều kiện tiên quyết không thể thiếu. Khác biệt chỉ là sắc thái nhỏ: なくしては "
        "thường xuất hiện trong bài PHÁT BIỂU/lời cảm ơn trang trọng, tách N ra bằng dấu phẩy để nhấn "
        "mạnh; なしには mang tính TƯỜNG THUẬT/miêu tả khách quan hơn, gắn liền hơn vào cấu trúc câu.",
        [
            ex(L, 3, 1, [t("t-l12s3-1", "みなさま", "皆様", "みなさま"), t("t-l12s3-2", "の"),
                         t("t-l12s3-3", "おうえん", "応援", "おうえん", key=True), t("t-l12s3-4", "なくしては", key=True),
                         t("t-l12s3-5", "、"), t("t-l12s3-6", "きょう", "今日", "きょう"), t("t-l12s3-7", "の"),
                         t("t-l12s3-8", "わたし", "私", "わたし"), t("t-l12s3-9", "は"), t("t-l12s3-10", "ありません")],
               "Nếu không có sự cổ vũ của quý vị, thì không có tôi của ngày hôm nay."),
            ex(L, 3, 2, [t("t-l12s3-11", "なかま", "仲間", "なかま", key=True), t("t-l12s3-12", "の"),
                         t("t-l12s3-13", "そんざい", "存在", "そんざい", key=True), t("t-l12s3-14", "なしには", key=True),
                         t("t-l12s3-15", "、"), t("t-l12s3-16", "ここまで"),
                         t("t-l12s3-17", "こられなかった", "来られなかった", "こられなかった")],
               "Không có sự hiện diện của đồng đội, đã không thể đi đến đây."),
        ],
        tips="Mẹo: nếu đang viết một bài PHÁT BIỂU cảm động, ưu tiên なくしては; nếu đang TƯỜNG THUẬT/phân tích khách quan, ưu tiên なしには — nhưng đổi cho nhau vẫn đúng ngữ pháp.",
        culture="Cả hai cấu trúc đều là văn phong trang trọng bậc cao, gần như không xuất hiện trong hội thoại đời thường mà chỉ trong văn viết/phát biểu chính thức."),

    slide(L, 4,
        "4. Kết hợp trong một bài phát biểu cảm ơn hoàn chỉnh",
        "皆様の支えなくしては〜なかった。家族の信頼なしには〜なかった。(đan xen cả hai để nhấn mạnh lòng biết ơn nhiều tầng)",
        "Trong một bài phát biểu CẢM ƠN sau chiến thắng, người nói thường đan xen CẢ HAI cấu trúc để "
        "liệt kê NHIỀU điều kiện tiên quyết khác nhau (sự cổ vũ của khán giả, gia đình, đồng đội) — "
        "dùng linh hoạt cả hai giúp bài phát biểu không bị lặp từ, đồng thời thể hiện lòng biết ơn sâu sắc, nhiều tầng lớp.",
        [
            ex(L, 4, 1, [t("t-l12s4-1", "おうえんしてくださった", "応援してくださった", "おうえんしてくださった", key=True),
                         t("t-l12s4-2", "みなさま", "皆様", "みなさま"), t("t-l12s4-3", "の"),
                         t("t-l12s4-4", "ささえ", "支え", "ささえ", key=True), t("t-l12s4-5", "なくしては", key=True),
                         t("t-l12s4-6", "、"), t("t-l12s4-7", "こんかい", "今回", "こんかい"), t("t-l12s4-8", "の"),
                         t("t-l12s4-9", "ゆうしょう", "優勝", "ゆうしょう", key=True), t("t-l12s4-10", "は"),
                         t("t-l12s4-11", "ありえませんでした", "あり得ませんでした", "ありえませんでした")],
               "Nếu không có sự nâng đỡ của quý vị đã cổ vũ, thì chức vô địch lần này đã không thể có được."),
            ex(L, 4, 2, [t("t-l12s4-12", "そして"), t("t-l12s4-13", "、"), t("t-l12s4-14", "かぞく", "家族", "かぞく", key=True),
                         t("t-l12s4-15", "の"), t("t-l12s4-16", "しんらい", "信頼", "しんらい", key=True),
                         t("t-l12s4-17", "なしには", key=True), t("t-l12s4-18", "、"), t("t-l12s4-19", "ここまで"),
                         t("t-l12s4-20", "がんばることはできませんでした", "頑張ることはできませんでした", "がんばることはできませんでした")],
               "Và, không có niềm tin của gia đình, thì đã không thể cố gắng đến tận bây giờ."),
        ],
        tips="Trong một bài phát biểu dài, tránh lặp cùng một cấu trúc liên tục — luân phiên なくしては và なしには giúp câu văn trang trọng nhưng không đơn điệu.",
        culture="Diễn văn nhận giải của vận động viên/nghệ sĩ Nhật gần như luôn có đoạn liệt kê ơn nghĩa theo khung: khán giả → huấn luyện/thầy cô → gia đình → đồng đội, mỗi đối tượng một câu なくしては/なしには riêng."),
]

DIALOGUE = [
    line(L, 1, "田中", "Phóng viên",
         [t("d12-1", "ゆうしょう", "優勝", "ゆうしょう", key=True), t("d12-2", "おめでとうございます"), t("d12-3", "。"),
          t("d12-4", "いま", "今", "いま"), t("d12-5", "の"), t("d12-6", "おきもち", "お気持ち", "おきもち"),
          t("d12-7", "は"), t("d12-8", "いかが"), t("d12-9", "です"), t("d12-10", "か")],
         "Xin chúc mừng chức vô địch. Cảm xúc của bạn lúc này thế nào?"),
    line(L, 2, "選手", "Vận động viên",
         [t("d12-11", "ありがとうございます"), t("d12-12", "。"), t("d12-13", "みなさま", "皆様", "みなさま"),
          t("d12-14", "の"), t("d12-15", "おうえん", "応援", "おうえん", key=True), t("d12-16", "なくしては", key=True),
          t("d12-17", "、"), t("d12-18", "この"), t("d12-19", "ゆうしょう", "優勝", "ゆうしょう", key=True),
          t("d12-20", "は"), t("d12-21", "ありませんでした")],
         "Cảm ơn mọi người. Nếu không có sự cổ vũ của quý vị, thì đã không có chức vô địch này."),
    line(L, 3, "田中", "Phóng viên",
         [t("d12-22", "れんしゅう", "練習", "れんしゅう"), t("d12-23", "で"), t("d12-24", "たいへんだった", "大変だった", "たいへんだった"),
          t("d12-25", "こと"), t("d12-26", "は"), t("d12-27", "ありますか")],
         "Trong lúc luyện tập có gì vất vả không?"),
    line(L, 4, "選手", "Vận động viên",
         [t("d12-28", "はい"), t("d12-29", "。"), t("d12-30", "しどうしてくださった", "指導してくださった", "しどうしてくださった"),
          t("d12-31", "かたがた", "方々", "かたがた"), t("d12-32", "の"), t("d12-33", "たすけ", "助け", "たすけ", key=True),
          t("d12-34", "なしには", key=True), t("d12-35", "、"), t("d12-36", "この"), t("d12-37", "しあい", "試合", "しあい", key=True),
          t("d12-38", "に"), t("d12-39", "かてなかった", "勝てなかった", "かてなかった"), t("d12-40", "と"),
          t("d12-41", "おもいます", "思います", "おもいます")],
         "Vâng. Tôi nghĩ nếu không có sự giúp đỡ của những người đã chỉ dạy tôi, thì đã không thể thắng trận đấu này."),
    line(L, 5, "田中", "Phóng viên",
         [t("d12-42", "ご"), t("d12-43", "かぞく", "家族", "かぞく", key=True), t("d12-44", "の"),
          t("d12-45", "そんざい", "存在", "そんざい", key=True), t("d12-46", "も"),
          t("d12-47", "おおきかったでしょうね", "大きかったでしょうね", "おおきかったでしょうね")],
         "Sự hiện diện của gia đình chắc hẳn cũng rất lớn lao nhỉ."),
    line(L, 6, "選手", "Vận động viên",
         [t("d12-48", "そうですね"), t("d12-49", "。"), t("d12-50", "かぞく", "家族", "かぞく", key=True),
          t("d12-51", "の"), t("d12-52", "しんらい", "信頼", "しんらい", key=True), t("d12-53", "なしには", key=True),
          t("d12-54", "、"), t("d12-55", "ここまで"), t("d12-56", "がんばれませんでした", "頑張れませんでした", "がんばれませんでした")],
         "Đúng vậy. Không có niềm tin của gia đình, tôi đã không thể cố gắng đến tận bây giờ."),
    line(L, 7, "田中", "Phóng viên",
         [t("d12-57", "なかま", "仲間", "なかま", key=True), t("d12-58", "については"), t("d12-59", "どう"),
          t("d12-60", "おもいますか", "思いますか", "おもいますか")],
         "Còn về đồng đội thì bạn nghĩ sao?"),
    line(L, 8, "選手", "Vận động viên",
         [t("d12-61", "なかま", "仲間", "なかま", key=True), t("d12-62", "の"), t("d12-63", "そんざい", "存在", "そんざい", key=True),
          t("d12-64", "なくしては", key=True), t("d12-65", "、"), t("d12-66", "ゆうしょう", "優勝", "ゆうしょう", key=True),
          t("d12-67", "は"), t("d12-68", "かんがえられません", "考えられません", "かんがえられません")],
         "Nếu không có sự hiện diện của đồng đội, thì không thể nghĩ đến việc vô địch."),
    line(L, 9, "田中", "Phóng viên",
         [t("d12-69", "おおくの", "多くの", "おおくの"), t("d12-70", "ぎせい", "犠牲", "ぎせい", key=True),
          t("d12-71", "も"), t("d12-72", "あった"), t("d12-73", "と"), t("d12-74", "ききました", "聞きました", "ききました")],
         "Tôi nghe nói cũng đã có nhiều sự hy sinh."),
    line(L, 10, "選手", "Vận động viên",
         [t("d12-75", "はい"), t("d12-76", "。"), t("d12-77", "その"), t("d12-78", "ぎせい", "犠牲", "ぎせい", key=True),
          t("d12-79", "なしには", key=True), t("d12-80", "、"), t("d12-81", "せいこう", "成功", "せいこう", key=True),
          t("d12-82", "は"), t("d12-83", "なかった"), t("d12-84", "と"), t("d12-85", "おもいます", "思います", "おもいます"),
          t("d12-86", "。"), t("d12-87", "みなさま", "皆様", "みなさま"), t("d12-88", "に"),
          t("d12-89", "かんしゃしています", "感謝しています", "かんしゃしています", key=True)],
         "Vâng. Tôi nghĩ nếu không có sự hy sinh đó, thì đã không có thành công. Tôi rất biết ơn mọi người."),
]

EXERCISES = [
    q(L, 1, "「皆様の支えなくしては、この優勝はありませんでした」 — なくしては diễn tả điều gì?",
      ["N là điều kiện TIÊN QUYẾT tuyệt đối/sống còn — thiếu N thì vế sau (phủ định) không thể xảy ra",
       "N là một lựa chọn trong nhiều lựa chọn khác", "N là nguyên nhân dẫn đến kết quả tích cực",
       "N là điều kiện có thể bỏ qua nếu muốn"], 0,
      "なくしては nhấn mạnh N là điều kiện tiên quyết tuyệt đối; nếu thiếu N thì vế sau (luôn phủ định) không thể xảy ra.",
      "Xem cấu trúc なくしては ở slide 1."),
    q(L, 2, "「家族の支えなしには、この試合に勝てなかった」 — なしには khác なくしては ở điểm nào?",
      ["Hoàn toàn khác nghĩa, không liên quan",
       "Gần như đồng nghĩa nhưng gắn sát hơn vào vế phủ định phía sau, sắc thái trung tính/tường thuật hơn",
       "Chỉ dùng cho câu hỏi", "Chỉ dùng khi nói về quá khứ"], 1,
      "なしには gần như đồng nghĩa với なくしては nhưng gắn liền sát hơn vào vế sau, mang sắc thái tường thuật khách quan hơn.",
      "Xem cấu trúc なしには ở slide 2."),
    q(L, 3, "Sự khác biệt (nhỏ) giữa なくしては và なしには là gì?",
      ["なくしては thiên về văn phong PHÁT BIỂU/cảm động, hay tách dấu phẩy; なしには mang tính TƯỜNG THUẬT, gắn sát vế sau — nhưng phần lớn có thể hoán đổi",
       "なくしては chỉ dùng cho phủ định; なしには chỉ dùng cho khẳng định",
       "Hai cấu trúc hoàn toàn không liên quan đến nhau", "なしには là dạng cổ, không còn dùng trong tiếng Nhật hiện đại"], 0,
      "Hai cấu trúc gần như đồng nghĩa, khác biệt chỉ ở sắc thái văn phong: なくしては trang trọng/cảm động hơn, なしには tường thuật/khách quan hơn.",
      "Xem bảng so sánh ở slide 3."),
    q(L, 4, "「多くの犠牲なくしては、成功は得られなかっただろう」 nghĩa là:",
      ["Nếu không có nhiều sự hy sinh, có lẽ đã không đạt được thành công",
       "Thành công đã đạt được mà không cần hy sinh gì cả", "Sự hy sinh là điều không cần thiết",
       "Không ai phải hy sinh điều gì"], 0,
      "なくしては ở đây khẳng định sự hy sinh là điều kiện tiên quyết để có thành công.",
      "Áp dụng cấu trúc なくしては cho ngữ cảnh thành công/hy sinh."),
    q(L, 5, "「先生の助けなしには、優勝は不可能だっただろう」 nghĩa là:",
      ["Không có sự giúp đỡ của thầy cô, chức vô địch có lẽ đã là bất khả thi",
       "Thầy cô đã ngăn cản việc giành chức vô địch", "Chức vô địch không liên quan gì đến thầy cô",
       "Thầy cô đã từ chối giúp đỡ"], 0,
      "なしには ở đây khẳng định sự giúp đỡ của thầy cô là điều kiện tiên quyết cho chức vô địch.",
      "Áp dụng cấu trúc なしには cho ngữ cảnh giúp đỡ/thành tích."),
    q(L, 6, "Tại sao trong bài phát biểu cảm ơn sau chiến thắng, người nói thường dùng CẢ なくしては LẪN なしには?",
      ["Để liệt kê nhiều điều kiện tiên quyết khác nhau (khán giả, gia đình, đồng đội…) mà không bị lặp từ, thể hiện lòng biết ơn nhiều tầng",
       "Vì quy tắc ngữ pháp bắt buộc phải dùng chung cả hai", "Vì hai cấu trúc có nghĩa trái ngược nhau",
       "Không có lý do đặc biệt nào"], 0,
      "Luân phiên hai cấu trúc giúp bài phát biểu tránh lặp từ, đồng thời thể hiện lòng biết ơn với nhiều đối tượng khác nhau.",
      "Xem cấu trúc bài phát biểu hoàn chỉnh ở slide 4."),
    q(L, 7, "「仲間の存在なくしては、優勝は考えられません」 hàm ý điều gì?",
      ["Không thể nào nghĩ đến việc vô địch nếu thiếu sự hiện diện của đồng đội — đồng đội là điều kiện sống còn",
       "Đồng đội hoàn toàn không quan trọng", "Vô địch chỉ nhờ nỗ lực cá nhân",
       "Đồng đội đã cản trở việc vô địch"], 0,
      "なくしては ở đây nhấn mạnh sự hiện diện của đồng đội là điều kiện tiên quyết không thể thiếu cho chức vô địch.",
      "Xem câu thoại thứ 8 để đối chiếu."),
    q(L, 8, "Theo hội thoại, vận động viên nói điều gì là điều kiện tiên quyết cho chức vô địch?",
      ["Sự cổ vũ của khán giả (皆様の応援なくしては、この優勝はありませんでした)", "May mắn hoàn toàn",
       "Không có điều kiện gì đặc biệt", "Chỉ nhờ tài năng bẩm sinh"], 0,
      "Vận động viên nói 「皆様の応援なくしては、この優勝はありませんでした」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Theo hội thoại, gia đình đã đóng vai trò gì?",
      ["Niềm tin của gia đình là điều kiện để có thể cố gắng đến cùng (家族の信頼なしには、ここまで頑張れませんでした)",
       "Gia đình phản đối việc thi đấu", "Gia đình không được nhắc đến", "Gia đình chỉ đến xem một lần"], 0,
      "Vận động viên nói 「家族の信頼なしには、ここまで頑張れませんでした」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Theo hội thoại, vận động viên kết thúc buổi phỏng vấn bằng điều gì?",
      ["Bày tỏ lòng biết ơn tới mọi người sau khi nhắc đến sự hy sinh (その犠牲なしには、成功はなかった…皆様に感謝しています)",
       "Từ chối trả lời thêm câu hỏi nào", "Phủ nhận đã có bất kỳ khó khăn nào", "Tuyên bố sẽ giải nghệ"], 0,
      "Vận động viên nói 「その犠牲なしには、成功はなかったと思います。皆様に感謝しています」.",
      "Xem câu thoại thứ 10."),
]

LESSON = lesson(
    L,
    "Bài 12: Điều kiện tiên quyết sinh tử (なくしては & なしには)",
    "Nなくしては、〜ない và Nなしには〜ない đều diễn tả rằng N là một ĐIỀU KIỆN TIÊN QUYẾT TUYỆT ĐỐI/"
    "SỐNG CÒN — nếu thiếu N thì vế sau (luôn phủ định) không thể xảy ra; hai cấu trúc gần như đồng "
    "nghĩa, khác biệt nhỏ ở sắc thái: なくしては thiên về văn phong phát biểu/cảm động (hay tách dấu "
    "phẩy), なしには mang tính tường thuật/khách quan hơn (gắn sát vế sau). Hội thoại: một vận động "
    "viên vừa vô địch trả lời phỏng vấn, đan xen cả hai cấu trúc để bày tỏ lòng biết ơn nhiều tầng — đối với khán giả, thầy cô, gia đình và đồng đội.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
