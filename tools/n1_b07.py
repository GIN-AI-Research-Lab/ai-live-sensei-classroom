# -*- coding: utf-8 -*-
"""N1 — Bai 7: Khang dinh danh thep — に相違ない (chac chan la... — suy doan chac
chan dua tren bang chung, trang trong hon にちがいない) va にほかならない (chinh
la..., khong gi khac ngoai... — khang dinh BAN CHAT/NGUYEN NHAN that su).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 7
pool = Pool("n1")

VOCAB = [
    v(1,  "どうき", "動機", "どうき", "douki", "noun", "Động cơ (gây án, hành động)", "動機に 相違ない = chắc chắn là động cơ.", L),
    v(2,  "しょうこ", "証拠", "しょうこ", "shouko", "noun", "Chứng cứ, bằng chứng", "証拠に ほかならない = chính là chứng cứ.", L),
    v(3,  "すいり", "推理", "すいり", "suiri", "noun", "Suy luận, suy lý", "推理の 結果 = kết quả của sự suy luận.", L),
    v(4,  "たいほします", "逮捕します", "たいほします", "taiho shimasu", "verb", "Bắt giữ", "犯人を 逮捕します = bắt giữ thủ phạm.", L),
    v(5,  "うたがいます", "疑います", "うたがいます", "utagaimasu", "verb", "Nghi ngờ", "彼を 疑います = nghi ngờ anh ta.", L),
    v(6,  "りゆう", "理由", "りゆう", "riyuu", "noun", "Lý do", "Đã gặp N4 bài 26.", L),
    v(7,  "はんにん", "犯人", "はんにん", "hannin", "noun", "Thủ phạm, kẻ phạm tội", "Đã gặp N3 bài 12.", L),
    v(8,  "げんば", "現場", "げんば", "genba", "noun", "Hiện trường", "Đã gặp N3 bài 12.", L),
    v(9,  "かんがえます", "考えます", "かんがえます", "kangaemasu", "verb", "Suy nghĩ", "Đã gặp N5 bài 21.", L),
    v(10, "どりょく", "努力", "どりょく", "doryoku", "noun", "Nỗ lực", "Đã gặp N3 bài 2.", L),
    v(11, "けっか", "結果", "けっか", "kekka", "noun", "Kết quả", "Đã gặp N3 bài 1.", L),
    v(12, "しんじます", "信じます", "しんじます", "shinjimasu", "verb", "Tin tưởng", "Đã gặp N3 bài 1.", L),
    v(13, "ぎいん", "議員", "ぎいん", "giin", "noun", "Nghị sĩ", "Đã gặp N1 bài 6.", L),
    v(14, "ふせい", "不正", "ふせい", "fusei", "noun", "Sự bất chính, gian lận", "Đã gặp N1 bài 6.", L),
    v(15, "はんざい", "犯罪", "はんざい", "hanzai", "noun", "Tội ác, tội phạm", "Đã gặp N1 bài 6.", L),
    v(16, "せいじか", "政治家", "せいじか", "seijika", "noun", "Chính trị gia", "Đã gặp N1 bài 3.", L),
    v(17, "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc", "Đã gặp N4 bài 41.", L),
    v(18, "とうさん", "倒産", "とうさん", "tousan", "noun", "Phá sản", "Đã gặp N1 bài 5.", L),
    v(19, "じたい", "事態", "じたい", "jitai", "noun", "Tình thế, tình huống", "Đã gặp N1 bài 5.", L),
    v(20, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N5 bài 3.", L),
    v(21, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N3 bài 13.", L),
]

KANJI = [
    k(1, "相", "TƯƠNG", 9, ["ソウ (sou)", "ショウ (shou)"], ["あい"], "Lẫn nhau, cùng.",
      [("相違", "そうい", "Sai lệch, khác biệt"), ("相談", "そうだん", "Bàn bạc")], L),
    k(2, "違", "VI", 13, ["イ (i)"], ["ちが(う)"], "Khác biệt, sai.",
      [("相違", "そうい", "Sai lệch"), ("違います", "ちがいます", "Khác, sai")], L),
    k(3, "証", "CHỨNG", 12, ["ショウ (shou)"], [], "Chứng cứ, chứng minh.",
      [("証拠", "しょうこ", "Chứng cứ"), ("証明", "しょうめい", "Chứng minh")], L),
    k(4, "拠", "CỨ", 8, ["キョ (kyo)", "コ (ko)"], ["よ(る)"], "Căn cứ, dựa vào.",
      [("証拠", "しょうこ", "Chứng cứ"), ("根拠", "こんきょ", "Căn cứ")], L),
    k(5, "捕", "BỘ", 10, ["ホ (ho)"], ["と(らえる)", "つか(まえる)"], "Bắt, tóm giữ.",
      [("逮捕", "たいほ", "Bắt giữ"), ("捕まえます", "つかまえます", "Bắt, tóm được")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chắc chắn là... (suy đoán chắc chắn dựa trên bằng chứng): N/普通形 + に相違ない",
        "N/Vる/Aい/Aな + に相違ない (lịch sự: 〜に相違ありません)",
        "に相違ない giống にちがいない (N4/N3) nhưng TRANG TRỌNG HƠN NHIỀU — dùng để SUY ĐOÁN một "
        "cách CHẮC CHẮN dựa trên CHỨNG CỨ/LÝ LUẬN rõ ràng, hay gặp trong văn phong điều tra, báo cáo, tòa án.",
        [
            ex(L, 1, 1, [t("t-l7s1-1", "げんば", "現場", "げんば", key=True), t("t-l7s1-2", "の"),
                         t("t-l7s1-3", "しょうこ", "証拠", "しょうこ", key=True), t("t-l7s1-4", "から"),
                         t("t-l7s1-5", "、"), t("t-l7s1-6", "かれ", "彼", "かれ"), t("t-l7s1-7", "が"),
                         t("t-l7s1-8", "はんにん", "犯人", "はんにん", key=True), t("t-l7s1-9", "に"),
                         t("t-l7s1-10", "そういない", "相違ない", "そういない", key=True)],
               "Từ chứng cứ tại hiện trường, chắc chắn anh ta là thủ phạm."),
            ex(L, 1, 2, [t("t-l7s1-11", "これ"), t("t-l7s1-12", "は"), t("t-l7s1-13", "かれ", "彼", "かれ"),
                         t("t-l7s1-14", "の"), t("t-l7s1-15", "どうき", "動機", "どうき", key=True), t("t-l7s1-16", "に"),
                         t("t-l7s1-17", "そういない", "相違ない", "そういない", key=True)],
               "Đây chắc chắn là động cơ của anh ta."),
        ],
        tips="Dạng lịch sự là 〜に相違ありません (thay vì 〜に相違ないです) — hay dùng trong báo cáo cảnh sát, phát biểu chính thức.",
        culture="に相違ない là từ ngữ ĐIỀU TRA kinh điển trong tiểu thuyết/phim trinh thám Nhật (推理小説) — thám tử dùng khi công bố kết luận sau khi phân tích đầy đủ chứng cứ."),

    slide(L, 2,
        "2. Chính là..., không gì khác ngoài... (khẳng định bản chất/nguyên nhân): N/普通形 + にほかならない",
        "N + にほかならない (lịch sự: 〜にほかなりません)",
        "にほかならない dùng để KHẲNG ĐỊNH MẠNH rằng một điều gì đó CHÍNH LÀ bản chất/nguyên nhân "
        "THỰC SỰ của sự việc — 'không gì khác ngoài N', loại trừ mọi khả năng khác. Khác に相違ない "
        "(suy đoán về một SỰ THẬT chưa xác nhận), にほかならない dùng để giải thích BẢN CHẤT của một điều đã biết.",
        [
            ex(L, 2, 1, [t("t-l7s2-1", "かれ", "彼", "かれ"), t("t-l7s2-2", "が"), t("t-l7s2-3", "せいこうした", "成功した", "せいこうした"),
                         t("t-l7s2-4", "の"), t("t-l7s2-5", "は"), t("t-l7s2-6", "、"), t("t-l7s2-7", "どりょく", "努力", "どりょく", key=True),
                         t("t-l7s2-8", "の"), t("t-l7s2-9", "けっか", "結果", "けっか", key=True), t("t-l7s2-10", "に"),
                         t("t-l7s2-11", "ほかならない", key=True)],
               "Anh ấy thành công chính là kết quả của nỗ lực, không gì khác."),
            ex(L, 2, 2, [t("t-l7s2-12", "これ"), t("t-l7s2-13", "は"), t("t-l7s2-14", "すいり", "推理", "すいり", key=True),
                         t("t-l7s2-15", "の"), t("t-l7s2-16", "けっか", "結果", "けっか", key=True), t("t-l7s2-17", "に"),
                         t("t-l7s2-18", "ほかならない", key=True)],
               "Đây chính là kết quả của sự suy luận, không gì khác."),
        ],
        tips="にほかならない KHÔNG dùng để suy đoán sự việc chưa biết — nó dùng để KHẲNG ĐỊNH nguyên nhân/bản chất của một sự việc ĐÃ XẢY RA.",
        culture="Diễn văn cảm ơn ở Nhật hay dùng '〜のは、皆様のおかげにほかなりません' (điều đó chính là nhờ ơn của mọi người, không gì khác) để bày tỏ lòng biết ơn một cách trang trọng."),

    slide(L, 3,
        "3. So sánh に相違ない và にほかならない",
        "に相違ない: SUY ĐOÁN chắc chắn (sự thật CHƯA xác nhận)　vs　にほかならない: KHẲNG ĐỊNH bản chất (sự việc ĐÃ biết)",
        "に相違ない dùng khi NGƯỜI NÓI đang SUY LUẬN để đi đến một kết luận về điều CHƯA được xác "
        "nhận chắc chắn (ai là thủ phạm?); にほかならない dùng khi GIẢI THÍCH bản chất/nguyên nhân của "
        "một sự việc ĐÃ RÕ RÀNG xảy ra (tại sao anh ấy lại thành công?).",
        [
            ex(L, 3, 1, [t("t-l7s3-1", "しょうこ", "証拠", "しょうこ", key=True), t("t-l7s3-2", "が"),
                         t("t-l7s3-3", "なければ", "無ければ", "なければ"), t("t-l7s3-4", "、"), t("t-l7s3-5", "はんにん", "犯人", "はんにん", key=True),
                         t("t-l7s3-6", "に"), t("t-l7s3-7", "そういない", "相違ない", "そういない", key=True), t("t-l7s3-8", "とは"),
                         t("t-l7s3-9", "いえません", "言えません", "いえません")],
               "Nếu không có chứng cứ, thì không thể nói chắc chắn là thủ phạm. (suy đoán về điều chưa xác nhận)"),
            ex(L, 3, 2, [t("t-l7s3-10", "たいほ", "逮捕", "たいほ", key=True), t("t-l7s3-11", "の"),
                         t("t-l7s3-12", "りゆう", "理由", "りゆう", key=True), t("t-l7s3-13", "は"), t("t-l7s3-14", "、"),
                         t("t-l7s3-15", "しょうこ", "証拠", "しょうこ", key=True), t("t-l7s3-16", "に"),
                         t("t-l7s3-17", "ほかならない", key=True)],
               "Lý do bắt giữ chính là chứng cứ, không gì khác. (khẳng định bản chất đã rõ)"),
        ],
        tips="Mẹo: câu hỏi 'liệu có đúng không?' → dùng に相違ない; câu hỏi 'vì sao/bản chất là gì?' → dùng にほかならない.",
        culture="Cả hai đều là văn phong VIẾT/TRANG TRỌNG — báo cáo điều tra dùng に相違ない khi CHƯA bắt được thủ phạm, và にほかならない khi giải thích lý do SAU KHI đã có kết luận."),

    slide(L, 4,
        "4. Kết hợp trong một đoạn suy luận điều tra hoàn chỉnh",
        "証拠から〜に相違ない (suy đoán ai là thủ phạm) → 逮捕の理由は〜にほかならない (khẳng định lý do)",
        "Trong một bài suy luận điều tra hoàn chỉnh, thường dùng に相違ない để CÔNG BỐ kết luận về "
        "thủ phạm dựa trên chứng cứ, rồi dùng にほかならない để KHẲNG ĐỊNH rõ lý do/căn cứ của quyết định đó.",
        [
            ex(L, 4, 1, [t("t-l7s4-1", "しょうこ", "証拠", "しょうこ", key=True), t("t-l7s4-2", "から"),
                         t("t-l7s4-3", "、"), t("t-l7s4-4", "かれ", "彼", "かれ"), t("t-l7s4-5", "が"),
                         t("t-l7s4-6", "はんにん", "犯人", "はんにん", key=True), t("t-l7s4-7", "に"),
                         t("t-l7s4-8", "そういありません", "相違ありません", "そういありません", key=True)],
               "Từ chứng cứ, chắc chắn anh ta là thủ phạm."),
            ex(L, 4, 2, [t("t-l7s4-9", "たいほ", "逮捕", "たいほ", key=True), t("t-l7s4-10", "の"),
                         t("t-l7s4-11", "りゆう", "理由", "りゆう", key=True), t("t-l7s4-12", "は"), t("t-l7s4-13", "、"),
                         t("t-l7s4-14", "しょうこ", "証拠", "しょうこ", key=True), t("t-l7s4-15", "に"),
                         t("t-l7s4-16", "ほかなりません", key=True)],
               "Lý do bắt giữ chính là chứng cứ, không gì khác."),
        ],
        tips="Trong hội thoại trang trọng (phỏng vấn, báo cáo), luôn ưu tiên dạng lịch sự 〜に相違ありません / 〜にほかなりません.",
        culture="Cấu trúc suy luận kinh điển của thám tử trong tiểu thuyết trinh thám Nhật: nêu chứng cứ → kết luận chắc chắn (に相違ない) → giải thích căn cứ (にほかならない)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Người dẫn chương trình",
         [t("d7-1", "げんば", "現場", "げんば", key=True), t("d7-2", "で"), t("d7-3", "なに", "何", "なに"),
          t("d7-4", "が"), t("d7-5", "ありましたか")],
         "Ở hiện trường đã có gì?"),
    line(L, 2, "山本", "Thám tử",
         [t("d7-6", "しょうこ", "証拠", "しょうこ", key=True), t("d7-7", "が"), t("d7-8", "たくさん", "沢山", "たくさん"),
          t("d7-9", "ありました")],
         "Có rất nhiều chứng cứ."),
    line(L, 3, "田中", "Người dẫn chương trình",
         [t("d7-10", "はんにん", "犯人", "はんにん", key=True), t("d7-11", "は"), t("d7-12", "だれ", "誰", "だれ"),
          t("d7-13", "ですか")],
         "Thủ phạm là ai?"),
    line(L, 4, "山本", "Thám tử",
         [t("d7-14", "しょうこ", "証拠", "しょうこ", key=True), t("d7-15", "から"), t("d7-16", "、"),
          t("d7-17", "かれ", "彼", "かれ"), t("d7-18", "が"), t("d7-19", "はんにん", "犯人", "はんにん", key=True),
          t("d7-20", "に"), t("d7-21", "そういありません", "相違ありません", "そういありません", key=True)],
         "Từ chứng cứ, chắc chắn anh ta là thủ phạm."),
    line(L, 5, "田中", "Người dẫn chương trình",
         [t("d7-22", "どうき", "動機", "どうき", key=True), t("d7-23", "は"), t("d7-24", "なん", "何", "なん"),
          t("d7-25", "ですか")],
         "Động cơ là gì?"),
    line(L, 6, "山本", "Thám tử",
         [t("d7-26", "どうき", "動機", "どうき", key=True), t("d7-27", "は"), t("d7-28", "おかね", "お金", "おかね"),
          t("d7-29", "の"), t("d7-30", "もんだい", "問題", "もんだい", key=True), t("d7-31", "に"),
          t("d7-32", "そういありません", "相違ありません", "そういありません", key=True)],
         "Động cơ chắc chắn là vấn đề tiền bạc."),
    line(L, 7, "田中", "Người dẫn chương trình",
         [t("d7-33", "なぜ"), t("d7-34", "うたがいましたか", "疑いましたか", "うたがいましたか")],
         "Tại sao đã nghi ngờ [anh ta]?"),
    line(L, 8, "山本", "Thám tử",
         [t("d7-35", "すいり", "推理", "すいり", key=True), t("d7-36", "の"), t("d7-37", "けっか", "結果", "けっか", key=True),
          t("d7-38", "に"), t("d7-39", "ほかなりません", key=True)],
         "Đó chính là kết quả của sự suy luận, không gì khác."),
    line(L, 9, "田中", "Người dẫn chương trình",
         [t("d7-40", "いつ"), t("d7-41", "たいほします", "逮捕します", "たいほします", key=True), t("d7-42", "か")],
         "Khi nào sẽ bắt giữ?"),
    line(L, 10, "山本", "Thám tử",
         [t("d7-43", "たいほ", "逮捕", "たいほ", key=True), t("d7-44", "の"), t("d7-45", "りゆう", "理由", "りゆう", key=True),
          t("d7-46", "は"), t("d7-47", "、"), t("d7-48", "しょうこ", "証拠", "しょうこ", key=True), t("d7-49", "に"),
          t("d7-50", "ほかなりません", key=True)],
         "Lý do bắt giữ chính là chứng cứ, không gì khác."),
]

EXERCISES = [
    q(L, 1, "「彼が犯人に相違ない」 — に相違ない diễn tả điều gì?",
      ["Suy đoán CHẮC CHẮN dựa trên bằng chứng — trang trọng hơn にちがいない",
       "Khẳng định bản chất/nguyên nhân của một sự việc đã rõ", "Sự cho phép làm việc gì đó",
       "Lời khuyên nhẹ nhàng"], 0,
      "に相違ない giống にちがいない nhưng trang trọng hơn, dùng khi suy đoán chắc chắn dựa trên chứng cứ/lý luận.",
      "Xem cấu trúc に相違ない ở slide 1."),
    q(L, 2, "「努力の結果にほかならない」 — にほかならない dùng để làm gì?",
      ["Khẳng định mạnh rằng đó CHÍNH LÀ bản chất/nguyên nhân thực sự, không gì khác",
       "Suy đoán về một sự việc chưa xác nhận", "Xin phép làm việc gì đó", "Đưa ra lời khuyên"], 0,
      "にほかならない dùng để khẳng định bản chất/nguyên nhân THỰC SỰ của một sự việc đã biết, loại trừ mọi khả năng khác.",
      "Xem cấu trúc にほかならない ở slide 2."),
    q(L, 3, "Sự khác biệt cốt lõi giữa に相違ない và にほかならない là gì?",
      ["に相違ない là SUY ĐOÁN về điều chưa xác nhận; にほかならない là KHẲNG ĐỊNH bản chất của điều đã biết",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "に相違ない chỉ dùng cho câu hỏi", "にほかならない chỉ dùng cho phủ định"], 0,
      "に相違ない suy đoán một sự thật chưa rõ; にほかならない khẳng định bản chất/nguyên nhân của một sự việc đã xảy ra.",
      "Xem bảng so sánh ở slide 3."),
    q(L, 4, "Dạng lịch sự của に相違ない và にほかならない là gì?",
      ["に相違ありません và にほかなりません", "に相違でした và にほかならなかった",
       "に相違ますです và にほかなりです", "Không có dạng lịch sự"], 0,
      "Cả hai đều chuyển đuôi ない thành ありません/なりません để thành dạng lịch sự trang trọng.",
      "Xem lưu ý ngữ pháp ở slide 1 và 4."),
    q(L, 5, "「証拠がなければ、犯人に相違ないとは言えません」 nghĩa là:",
      ["Nếu không có chứng cứ, thì không thể nói chắc chắn là thủ phạm",
       "Dù không có chứng cứ vẫn chắc chắn là thủ phạm", "Chứng cứ không quan trọng",
       "Thủ phạm đã tự thú nhận"], 0,
      "Câu này nhấn mạnh に相違ない cần dựa trên CHỨNG CỨ mới có thể kết luận chắc chắn.",
      "Áp dụng cấu trúc に相違ない cho ngữ cảnh thiếu chứng cứ."),
    q(L, 6, "Tại sao に相違ない và にほかならない thường xuất hiện CÙNG NHAU trong một bài suy luận điều tra?",
      ["Để công bố kết luận về thủ phạm (に相違ない) rồi khẳng định rõ căn cứ của kết luận đó (にほかならない)",
       "Vì chúng có nghĩa giống hệt nhau nên dùng thay phiên", "Không có lý do đặc biệt",
       "Vì quy tắc ngữ pháp bắt buộc phải dùng chung"], 0,
      "に相違ない dùng để kết luận ai là thủ phạm; にほかならない dùng để khẳng định rõ căn cứ/lý do của kết luận ấy.",
      "Xem kỹ thuật suy luận ở slide 4."),
    q(L, 7, "「これは推理の結果にほかならない」 nghĩa là:",
      ["Đây chính là kết quả của sự suy luận, không gì khác",
       "Đây có thể là kết quả của sự may mắn", "Đây không liên quan gì đến suy luận",
       "Đây là một sự việc chưa được xác nhận"], 0,
      "にほかならない ở đây khẳng định BẢN CHẤT của kết quả: chính là suy luận, không phải điều gì khác.",
      "Áp dụng cấu trúc にほかならない cho ngữ cảnh suy luận."),
    q(L, 8, "Theo hội thoại, động cơ gây án được thám tử kết luận là gì?",
      ["Vấn đề tiền bạc (お金の問題に相違ありません)", "Sự thù hận cá nhân",
       "Không có động cơ nào cả", "Không được đề cập trong hội thoại"], 0,
      "Thám tử nói 「動機はお金の問題に相違ありません」.",
      "Xem câu thoại thứ 6."),
    q(L, 9, "Theo hội thoại, tại sao thám tử đã nghi ngờ nghi phạm?",
      ["Đó chính là kết quả của sự suy luận (推理の結果にほかなりません)",
       "Vì nghi phạm đã tự thú", "Vì có người mách bảo", "Không được đề cập trong hội thoại"], 0,
      "Thám tử nói 「推理の結果にほかなりません」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Theo hội thoại, lý do bắt giữ nghi phạm là gì?",
      ["Chính là chứng cứ (証拠にほかなりません)", "Vì áp lực từ dư luận",
       "Vì nghi phạm đã bỏ trốn", "Không được đề cập trong hội thoại"], 0,
      "Thám tử kết luận 「逮捕の理由は、証拠にほかなりません」.",
      "Xem câu thoại thứ 10."),
]

LESSON = lesson(
    L,
    "Bài 7: Khẳng định đanh thép (にほかならない & に相違ない)",
    "に相違ない (trang trọng hơn にちがいない) dùng để SUY ĐOÁN CHẮC CHẮN một sự thật CHƯA xác nhận "
    "dựa trên chứng cứ/lý luận; にほかならない dùng để KHẲNG ĐỊNH MẠNH bản chất/nguyên nhân THỰC SỰ "
    "của một sự việc ĐÃ RÕ RÀNG, loại trừ mọi khả năng khác — cả hai đều là văn phong trang trọng, "
    "thường kết hợp trong một bài suy luận điều tra: kết luận ai là thủ phạm rồi khẳng định căn cứ của kết luận đó.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
