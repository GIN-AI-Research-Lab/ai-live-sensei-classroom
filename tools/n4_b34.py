# -*- coding: utf-8 -*-
"""N4 — Bai 34: Lam theo mau 〜とおりに, sau khi 〜あとで.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md),
ket hop dong tu da hoc o N5 (nau an, day hoc) lam vi du cho とおりに.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 34
pool = Pool("n4")

VOCAB = [
    v(1,  "せつめいします", "説明します", "せつめいします", "setsumei shimasu", "verb", "Giải thích", "説明した とおりに = đúng như đã giải thích.", L),
    v(2,  "やります", "", "", "yarimasu", "verb", "Làm (thân mật hơn します)", "先生の やり方 = cách làm của thầy giáo.", L),
    v(3,  "つくります", "作ります", "つくります", "tsukurimasu", "verb", "Làm, nấu", "Đã gặp N5 bài 6 — nay dùng làm ví dụ とおりに.", L),
    v(4,  "おしえます", "教えます", "おしえます", "oshiemasu", "verb", "Dạy, chỉ bảo", "Đã gặp N5 bài 7.", L),
    v(5,  "かきます", "書きます", "かきます", "kakimasu", "verb", "Viết", "Đã gặp N5 bài 6.", L),
    v(6,  "みます", "見ます", "みます", "mimasu", "verb", "Xem, nhìn", "Đã gặp N5 bài 6 — nay dùng làm mốc thời gian あとで.", L),
    v(7,  "せつめい", "説明", "せつめい", "setsumei", "noun", "Lời giải thích", "説明書 = sách hướng dẫn.", L),
    v(8,  "せつめいしょ", "説明書", "せつめいしょ", "setsumeisho", "noun", "Sách hướng dẫn sử dụng", "説明書の とおりに 使って ください = xin hãy dùng đúng như sách hướng dẫn.", L),
    v(9,  "やりかた", "やり方", "やりかた", "yarikata", "noun", "Cách làm", "やり方が 分かりません = tôi không hiểu cách làm.", L),
    v(10, "つくりかた", "作り方", "つくりかた", "tsukurikata", "noun", "Cách làm/nấu", "料理の 作り方 = cách nấu món ăn.", L),
    v(11, "りょうり", "料理", "りょうり", "ryouri", "noun", "Món ăn, nấu ăn", "Đã gặp N5 bài 9.", L),
    v(12, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "Đã gặp N5 bài 1.", L),
    v(13, "しあい", "試合", "しあい", "shiai", "noun", "Trận đấu", "Đã gặp bài 33.", L),
    v(14, "かいぎ", "会議", "かいぎ", "kaigi", "noun", "Cuộc họp", "Đã gặp N5 bài 7.", L),
    v(15, "じゅぎょう", "授業", "じゅぎょう", "jugyou", "noun", "Buổi học, tiết học", "授業の あとで = sau tiết học.", L),
    v(16, "しょくじ", "食事", "しょくじ", "shokuji", "noun", "Bữa ăn", "食事の あとで = sau bữa ăn.", L),
    v(17, "べんきょう", "勉強", "べんきょう", "benkyou", "noun", "Việc học", "Đã gặp N5 bài 4.", L),
    v(18, "テレビ", "", "", "terebi", "noun", "Ti vi", "テレビを 見た あとで = sau khi xem ti vi.", L),
    v(19, "しゅくだい", "宿題", "しゅくだい", "shukudai", "noun", "Bài tập về nhà", "Đã gặp N5 bài 7.", L),
    v(20, "とおり", "通り", "とおり", "toori", "noun", "Đúng như, giống như (danh từ hình thức)", "先生の 言った とおりに = đúng như thầy giáo đã nói.", L),
]

KANJI = [
    k(1, "説", "THUYẾT", 14, ["セツ (setsu)"], ["と(く)"], "Giải thích, thuyết trình.",
      [("説明", "せつめい", "Giải thích"), ("小説", "しょうせつ", "Tiểu thuyết"), ("説明書", "せつめいしょ", "Sách hướng dẫn")], L),
    k(2, "通", "THÔNG", 10, ["ツウ (tsuu)"], ["とお(る)", "かよ(う)"], "Đi qua, thông suốt. Đã gặp と qua 通います (bài 28).",
      [("通り", "とおり", "Đúng như"), ("交通", "こうつう", "Giao thông"), ("通じます", "つうじます", "Thông hiểu")], L),
    k(3, "授", "THỤ", 11, ["ジュ (ju)"], ["さず(ける)"], "Truyền dạy, trao cho.",
      [("授業", "じゅぎょう", "Tiết học"), ("教授", "きょうじゅ", "Giáo sư")], L),
    k(4, "業", "NGHIỆP", 13, ["ギョウ (gyou)"], ["わざ"], "Nghề nghiệp, sự nghiệp.",
      [("授業", "じゅぎょう", "Tiết học"), ("卒業", "そつぎょう", "Tốt nghiệp"), ("営業", "えいぎょう", "Kinh doanh")], L),
    k(5, "食", "THỰC", 9, ["ショク (shoku)"], ["た(べる)"], "Ăn, thức ăn. Đã gặp N5 bài 6.",
      [("食事", "しょくじ", "Bữa ăn"), ("食べます", "たべます", "Ăn"), ("朝食", "ちょうしょく", "Bữa sáng")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Làm theo mẫu: [N の／Vた] とおりに、V",
        "N + の + とおりに   /   V(た形) + とおりに",
        "とおりに diễn tả 'ĐÚNG NHƯ, GIỐNG HỆT' một mẫu/hướng dẫn có sẵn — hành động sau đó phải "
        "khớp CHÍNH XÁC với mẫu đó, không sáng tạo thêm.",
        [
            ex(L, 1, 1, [t("t-l34s1-1", "せつめいしょ", "説明書", "せつめいしょ", key=True), t("t-l34s1-2", "の"),
                         t("t-l34s1-3", "とおりに", key=True), t("t-l34s1-4", "、"), t("t-l34s1-5", "つかって", "使って", "つかって"),
                         t("t-l34s1-6", "ください")],
               "Xin hãy dùng đúng như trong sách hướng dẫn."),
            ex(L, 1, 2, [t("t-l34s1-7", "せんせい", "先生", "せんせい"), t("t-l34s1-8", "が"),
                         t("t-l34s1-9", "いった", "言った", "いった", key=True), t("t-l34s1-10", "とおりに", key=True),
                         t("t-l34s1-11", "、"), t("t-l34s1-12", "かきました", "書きました", "かきました")],
               "Tôi đã viết đúng như những gì thầy giáo đã nói."),
        ],
        tips="N + の + とおりに (danh từ) khác V + た + とおりに (động từ) — cùng ý nghĩa nhưng khác cách ghép theo từ loại đứng trước.",
        culture="Người Nhật rất coi trọng làm ĐÚNG THEO hướng dẫn/khuôn mẫu (説明書のとおりに) — đây là nét văn hóa tỉ mỉ, chính xác nổi tiếng."),

    slide(L, 2,
        "2. Cách làm cụ thể: N の やり方／作り方",
        "[Danh từ] + の + やり方／作り方",
        "やり方 (cách làm nói chung) và 作り方 (cách làm/nấu cụ thể) là DANH TỪ ghép từ động từ + "
        "方 (cách thức) — thường đi kèm とおりに để nói 'làm đúng theo cách này'.",
        [
            ex(L, 2, 1, [t("t-l34s2-1", "りょうり", "料理", "りょうり"), t("t-l34s2-2", "の"),
                         t("t-l34s2-3", "つくりかた", "作り方", "つくりかた", key=True), t("t-l34s2-4", "を"),
                         t("t-l34s2-5", "おしえて", "教えて", "おしえて"), t("t-l34s2-6", "ください")],
               "Xin hãy chỉ cho tôi cách nấu món này."),
            ex(L, 2, 2, [t("t-l34s2-7", "せんせい", "先生", "せんせい"), t("t-l34s2-8", "の"),
                         t("t-l34s2-9", "やりかた", "やり方", "やりかた", key=True), t("t-l34s2-10", "の"),
                         t("t-l34s2-11", "とおりに", key=True), t("t-l34s2-12", "、"), t("t-l34s2-13", "やって"),
                         t("t-l34s2-14", "みます")],
               "Tôi sẽ thử làm đúng như cách thầy giáo làm."),
        ],
        tips="Mẫu N+の+作り方 rất hữu ích khi xin công thức nấu ăn, hướng dẫn thủ công — cấu trúc chuẩn, lịch sự.",
        culture="Video hướng dẫn nấu ăn (料理動画) tiếng Nhật hầu như luôn có phụ đề ghi rõ 作り方 ngay từ đầu video."),

    slide(L, 3,
        "3. Sau khi: N の あとで／V(た形) あとで",
        "N + の + あとで   /   V(た形) + あとで",
        "あとで (sau khi) đã manh nha xuất hiện ở N5 (もう, bài 7) nhưng nay CHÍNH THỨC học cấu "
        "trúc: danh từ ghép の, động từ dùng THỂ QUÁ KHỨ た — khác hẳn まえに (N5 bài 18) dùng thể "
        "từ điển.",
        [
            ex(L, 3, 1, [t("t-l34s3-1", "しょくじ", "食事", "しょくじ", key=True), t("t-l34s3-2", "の"),
                         t("t-l34s3-3", "あとで", key=True), t("t-l34s3-4", "、"), t("t-l34s3-5", "くすり", "薬", "くすり"),
                         t("t-l34s3-6", "を"), t("t-l34s3-7", "のみます", "飲みます", "のみます")],
               "Sau bữa ăn, tôi uống thuốc."),
            ex(L, 3, 2, [t("t-l34s3-8", "テレビ"), t("t-l34s3-9", "を"), t("t-l34s3-10", "みた", "見た", "みた", key=True),
                         t("t-l34s3-11", "あとで", key=True), t("t-l34s3-12", "、"), t("t-l34s3-13", "しゅくだい", "宿題", "しゅくだい"),
                         t("t-l34s3-14", "を"), t("t-l34s3-15", "します")],
               "Sau khi xem ti vi, tôi làm bài tập."),
        ],
        tips="Mẹo nhớ: まえに (trước khi, N5 b18) dùng THỂ TỪ ĐIỂN; あとで (sau khi) dùng THỂ た — hai mốc đối lập, hai thể khác nhau.",
        culture="食事のあとで薬を飲みます là hướng dẫn dùng thuốc phổ biến nhất trên bao bì thuốc tại Nhật."),

    slide(L, 4,
        "4. So sánh まえに/あとで/てから",
        "まえに (trước, thể từ điển, N5 b18) / あとで (sau, thể た) / てから (sau khi, nhấn thứ tự bắt buộc, N5 b15)",
        "Ba cấu trúc chỉ trình tự thời gian dễ gây nhầm lẫn: まえに định vị mốc TRƯỚC; あとで định "
        "vị mốc SAU; てから (đã học N5) nhấn TÍNH BẮT BUỘC của thứ tự hơn là chỉ định vị thời gian.",
        [
            ex(L, 4, 1, [t("t-l34s4-1", "じゅぎょう", "授業", "じゅぎょう", key=True), t("t-l34s4-2", "の"),
                         t("t-l34s4-3", "まえに", key=True), t("t-l34s4-4", "、"), t("t-l34s4-5", "べんきょう", "勉強", "べんきょう"),
                         t("t-l34s4-6", "します")],
               "Trước tiết học, tôi học bài. (まえに: mốc TRƯỚC)"),
            ex(L, 4, 2, [t("t-l34s4-7", "じゅぎょう", "授業", "じゅぎょう", key=True), t("t-l34s4-8", "の"),
                         t("t-l34s4-9", "あとで", key=True), t("t-l34s4-10", "、"), t("t-l34s4-11", "しあい", "試合", "しあい"),
                         t("t-l34s4-12", "が"), t("t-l34s4-13", "あります", "有ります", "あります")],
               "Sau tiết học, có trận đấu. (あとで: mốc SAU)"),
        ],
        tips="Cả ba cấu trúc đều dùng được với danh từ (thêm の) — riêng động từ thì まえに cần thể từ điển, còn あとで/てから cần thể た/て.",
        culture="Lịch trình sự kiện Nhật (chương trình đám cưới, hội nghị) hay ghi rõ 〜のあとで、〜のまえに để hướng dẫn khách tham dự."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d-l34-1", "この"), t("d-l34-2", "きかい", "機械", "きかい"), t("d-l34-3", "の"),
          t("d-l34-4", "つかいかた", "使い方", "つかいかた"), t("d-l34-5", "が"), t("d-l34-6", "わかりません", "分かりません", "わかりません")],
         "Tôi không hiểu cách dùng cái máy này."),
    line(L, 2, "サントス", "Sinh viên",
         [t("d-l34-7", "せつめいしょ", "説明書", "せつめいしょ", key=True), t("d-l34-8", "が"),
          t("d-l34-9", "あります", "有ります", "あります"), t("d-l34-10", "よ")],
         "Có sách hướng dẫn đấy."),
    line(L, 3, "ワン", "Sinh viên",
         [t("d-l34-11", "ありがとう"), t("d-l34-12", "ございます"), t("d-l34-13", "。"), t("d-l34-14", "この"),
          t("d-l34-15", "とおりに", "通りに", "とおりに", key=True), t("d-l34-16", "やって"),
          t("d-l34-17", "みます")],
         "Cảm ơn. Tôi sẽ thử làm đúng theo đây."),
    line(L, 4, "サントス", "Sinh viên",
         [t("d-l34-18", "せつめい", "説明", "せつめい", key=True), t("d-l34-19", "の"), t("d-l34-20", "とおりに", key=True),
          t("d-l34-21", "やれば", key=True), t("d-l34-22", "、"), t("d-l34-23", "だいじょうぶ", "大丈夫", "だいじょうぶ"),
          t("d-l34-24", "です"), t("d-l34-25", "よ")],
         "Nếu làm đúng theo hướng dẫn thì sẽ ổn thôi."),
    line(L, 5, "ワン", "Sinh viên",
         [t("d-l34-26", "ところで"), t("d-l34-27", "、"), t("d-l34-28", "じゅぎょう", "授業", "じゅぎょう", key=True),
          t("d-l34-29", "の"), t("d-l34-30", "あとで", key=True), t("d-l34-31", "、"), t("d-l34-32", "なに", "何", "なに"),
          t("d-l34-33", "を"), t("d-l34-34", "しますか")],
         "À mà, sau tiết học cậu định làm gì?"),
    line(L, 6, "サントス", "Sinh viên",
         [t("d-l34-35", "しょくじ", "食事", "しょくじ", key=True), t("d-l34-36", "の"), t("d-l34-37", "あとで", key=True),
          t("d-l34-38", "、"), t("d-l34-39", "りょうり", "料理", "りょうり", key=True), t("d-l34-40", "の"),
          t("d-l34-41", "つくりかた", "作り方", "つくりかた", key=True), t("d-l34-42", "を"), t("d-l34-43", "ならいます", "習います", "ならいます")],
         "Sau bữa ăn, tớ sẽ học cách nấu ăn."),
    line(L, 7, "ワン", "Sinh viên",
         [t("d-l34-44", "だれ", "誰", "だれ"), t("d-l34-45", "に"), t("d-l34-46", "ならいます", "習います", "ならいます", key=True),
          t("d-l34-47", "か")],
         "Cậu học từ ai vậy?"),
    line(L, 8, "サントス", "Sinh viên",
         [t("d-l34-48", "せんせい", "先生", "せんせい", key=True), t("d-l34-49", "に"), t("d-l34-50", "せつめいして", "説明して", "せつめいして", key=True),
          t("d-l34-51", "もらいます", key=True)],
         "Tớ nhờ thầy giáo giải thích giúp."),
    line(L, 9, "ワン", "Sinh viên",
         [t("d-l34-52", "いいですね"), t("d-l34-53", "。"), t("d-l34-54", "わたし", "私", "わたし"),
          t("d-l34-55", "も"), t("d-l34-56", "みても", "見ても", "みても"), t("d-l34-57", "いいですか")],
         "Hay đó. Tớ xem cùng được không?"),
    line(L, 10, "サントス", "Sinh viên",
         [t("d-l34-58", "もちろん"), t("d-l34-59", "です"), t("d-l34-60", "。"), t("d-l34-61", "いっしょに", "一緒に", "いっしょに"),
          t("d-l34-62", "やりましょう")],
         "Tất nhiên rồi. Cùng làm nhé."),
]

EXERCISES = [
    q(L, 1, "「説明書のとおりに、使ってください」 nghĩa là:",
      ["Xin hãy dùng đúng như trong sách hướng dẫn", "Xin hãy vứt sách hướng dẫn đi",
       "Sách hướng dẫn bị sai", "Không cần đọc sách hướng dẫn"], 0,
      "とおりに diễn tả làm ĐÚNG THEO một mẫu/hướng dẫn có sẵn, không sáng tạo thêm.",
      "Xem nghĩa của とおりに ở slide 1."),
    q(L, 2, "「先生が言ったとおりに、書きました」 — vì sao trước とおりに là 言った (thể た)?",
      ["Khi đứng sau ĐỘNG TỪ, とおりに cần thể た (quá khứ)",
       "言った là lỗi, phải sửa thành 言う", "とおりに chỉ ghép được với danh từ",
       "Thể た ở đây không có ý nghĩa gì đặc biệt"], 0,
      "Cấu trúc V(た形)+とおりに áp dụng khi mẫu là một ĐỘNG TỪ (điều đã được nói/làm trước đó).",
      "So sánh với N+の+とおりに khi đứng sau danh từ."),
    q(L, 3, "料理の作り方 nghĩa là:",
      ["Cách nấu món ăn", "Nguyên liệu nấu ăn", "Nhà hàng nấu ăn ngon", "Người đầu bếp"], 0,
      "作り方 = 作る (làm) + 方 (cách thức) — danh từ ghép chỉ CÁCH LÀM một việc cụ thể.",
      "Xem cấu trúc danh từ ghép ở slide 2."),
    q(L, 4, "「食事のあとで、薬を飲みます」 — あとで đứng sau danh từ cần thêm gì?",
      ["の (食事の あとで)", "を", "が", "Không cần thêm gì"], 0,
      "Khi あとで đứng sau DANH TỪ, cần thêm の để nối: [danh từ]+の+あとで.",
      "So sánh với V(た形)+あとで không cần trợ từ nối."),
    q(L, 5, "「テレビを見たあとで、宿題をします」 — 見た ở thể nào?",
      ["Thể た (quá khứ)", "Thể từ điển", "Thể ます", "Thể ない"], 0,
      "あとで đứng sau ĐỘNG TỪ luôn dùng THỂ QUÁ KHỨ (た) — khác まえに (N5 bài 18) dùng thể từ điển.",
      "Đây là điểm khác biệt cốt lõi giữa まえに và あとで."),
    q(L, 6, "まえに và あとで khác nhau về thể động từ đi kèm như thế nào?",
      ["まえに dùng thể từ điển; あとで dùng thể た", "Cả hai đều dùng thể từ điển",
       "Cả hai đều dùng thể た", "まえに dùng thể た; あとで dùng thể từ điển"], 0,
      "まえに (trước khi, N5 b18) luôn giữ thể từ điển bất kể thì câu; あとで (sau khi) luôn dùng thể た.",
      "Xem bảng so sánh ở slide 4."),
    q(L, 7, "てから (N5 bài 15) khác あとで ở điểm nào?",
      ["てから nhấn mạnh tính BẮT BUỘC của thứ tự; あとで chỉ đơn thuần ĐỊNH VỊ mốc thời gian sau",
       "Hoàn toàn giống nhau, dùng thay thế nhau tự do", "てから chỉ dùng cho câu phủ định",
       "あとで chỉ dùng cho câu hỏi"], 0,
      "てから (N5 b15) nhấn thứ tự PHẢI xảy ra trước-sau; あとで chỉ nói mốc thời gian, ít nhấn mạnh tính bắt buộc.",
      "So sánh ba cấu trúc trình tự thời gian ở slide 4."),
    q(L, 8, "Câu nào ĐÚNG khi nói 'tôi sẽ thử làm đúng theo cách thầy giáo dạy'?",
      ["先生のやり方のとおりに、やってみます", "先生のやり方が、やってみます",
       "先生のやり方を、やってみるとおり", "先生のやり方は、とおりにやってみます"], 0,
      "N+の+とおりに là cấu trúc chuẩn khi mẫu là một danh từ (cách làm của thầy giáo).",
      "Áp dụng đúng cấu trúc đã học ở slide 1-2."),
    q(L, 9, "Trong hội thoại, Wang gặp khó khăn gì?",
      ["Không hiểu cách dùng một cái máy", "Không tìm được sách hướng dẫn",
       "Máy bị hỏng", "Không có ai giúp đỡ"], 0,
      "Wang nói 「この機械の使い方が分かりません」.",
      "Xem câu thoại đầu tiên."),
    q(L, 10, "Sau bữa ăn, Santos định làm gì?",
      ["Học cách nấu ăn từ thầy giáo", "Xem ti vi", "Làm bài tập", "Đi ngủ sớm"], 0,
      "Santos nói 「食事のあとで、料理の作り方を習います」.",
      "Xem câu thoại thứ 6."),
]

LESSON = lesson(
    L,
    "Bài 34: Làm theo mẫu (〜とおりに) & Sau khi (〜あとで)",
    "Diễn tả làm ĐÚNG THEO một mẫu/hướng dẫn bằng とおりに (N+の hoặc V+た), danh từ ghép cách "
    "làm やり方/作り方, và cấu trúc あとで (sau khi, N+の hoặc V+た) — so sánh với まえに (N5 b18, "
    "thể từ điển) và てから (N5 b15, nhấn thứ tự bắt buộc) để nắm trọn bộ ba cấu trúc trình tự "
    "thời gian.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
