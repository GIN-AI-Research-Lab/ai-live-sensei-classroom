# -*- coding: utf-8 -*-
"""N2 — Bai 12: Ket cuc sau qua trinh dai 末に (trung tinh/tich cuc) va あげく (tieu cuc, che trach).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n2.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n2_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 12
pool = Pool("n2")

VOCAB = [
    v(1,  "なやみます", "悩みます", "なやみます", "nayamimasu", "verb", "Băn khoăn, trăn trở", "長い間 悩みます = trăn trở suốt thời gian dài.", L),
    v(2,  "そうだんします", "相談します", "そうだんします", "soudan shimasu", "verb", "Bàn bạc, tư vấn", "友達に 相談します = bàn bạc với bạn bè.", L),
    v(3,  "やりなおします", "やり直します", "やりなおします", "yarinaoshimasu", "verb", "Làm lại", "何度も やり直します = làm lại nhiều lần.", L),
    v(4,  "なんども", "何度も", "なんども", "nandomo", "adverb", "Nhiều lần", "何度も 考えます = suy nghĩ nhiều lần.", L),
    v(5,  "かんがえます", "考えます", "かんがえます", "kangaemasu", "verb", "Suy nghĩ", "Đã gặp N4 bài 26.", L),
    v(6,  "きめます", "決めます", "きめます", "kimemasu", "verb", "Quyết định", "Đã gặp N4 bài 33.", L),
    v(7,  "つかれます", "疲れます", "つかれます", "tsukaremasu", "verb", "Mệt mỏi", "Đã gặp N4 bài 26.", L),
    v(8,  "ながい", "長い", "ながい", "nagai", "adjective", "Dài", "Đã gặp N4 bài 26.", L),
    v(9,  "じかん", "時間", "じかん", "jikan", "noun", "Thời gian", "Đã gặp N4 bài 26.", L),
    v(10, "あいだ", "間", "あいだ", "aida", "noun", "Khoảng, giữa", "Đã gặp N4 bài 26.", L),
    v(11, "かいけつします", "解決します", "かいけつします", "kaiketsu shimasu", "verb", "Giải quyết", "Đã gặp N3 bài 13.", L),
    v(12, "しっぱいします", "失敗します", "しっぱいします", "shippai shimasu", "verb", "Thất bại", "Đã gặp N4 bài 43.", L),
    v(13, "あきらめます", "諦めます", "あきらめます", "akiramemasu", "verb", "Từ bỏ", "Đã gặp N3 bài 4.", L),
    v(14, "せいこうします", "成功します", "せいこうします", "seikou shimasu", "verb", "Thành công", "Đã gặp N3 bài 8.", L),
    v(15, "けっか", "結果", "けっか", "kekka", "noun", "Kết quả", "Đã gặp N4 bài 39.", L),
    v(16, "けっていします", "決定します", "けっていします", "kettei shimasu", "verb", "Quyết định", "Đã gặp N3 bài 18.", L),
    v(17, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N5 bài 22.", L),
    v(18, "かいぎ", "会議", "かいぎ", "kaigi", "noun", "Cuộc họp", "Đã gặp N4 bài 30.", L),
    v(19, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N4 bài 26.", L),
    v(20, "けっこん", "結婚", "けっこん", "kekkon", "noun", "Kết hôn", "Đã gặp N4 bài 26.", L),
]

KANJI = [
    k(1, "末", "MẠT", 5, ["マツ (matsu)"], ["すえ"], "Cuối, ngọn.",
      [("末に", "すえに", "Cuối cùng, sau..."), ("週末", "しゅうまつ", "Cuối tuần")], L),
    k(2, "挙", "CỬ", 10, ["キョ (kyo)"], ["あ(げる)"], "Đưa lên, cử hành.",
      [("挙句", "あげく", "Rốt cuộc, cuối cùng"), ("選挙", "せんきょ", "Bầu cử")], L),
    k(3, "悩", "NÃO", 10, ["ノウ (nou)"], ["なや(む)"], "Phiền não, trăn trở.",
      [("悩みます", "なやみます", "Băn khoăn, trăn trở"), ("苦悩", "くのう", "Khổ não")], L),
    k(4, "相", "TƯƠNG", 9, ["ソウ (sou)"], ["あい"], "Lẫn nhau, tương hỗ.",
      [("相談", "そうだん", "Bàn bạc, tư vấn"), ("相手", "あいて", "Đối phương")], L),
    k(5, "直", "TRỰC", 8, ["チョク (choku)"], ["なお(す)"], "Thẳng, sửa lại.",
      [("やり直します", "やりなおします", "Làm lại"), ("直します", "なおします", "Sửa chữa")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Cuối cùng, sau quá trình dài (trung tính/tích cực): V(た形)/N+の + 末に",
        "V(thể た) / N + の + 末に、[kết quả]",
        "末に diễn tả 'CUỐI CÙNG, SAU' một quá trình dài đắn đo/nỗ lực — kết quả thường TRUNG "
        "TÍNH hoặc TÍCH CỰC, mang văn phong TRANG TRỌNG, thường dùng khi tường thuật một quyết định quan trọng.",
        [
            ex(L, 1, 1, [t("t-l12s1-1", "ながい", "長い", "ながい", key=True), t("t-l12s1-2", "あいだ", "間", "あいだ", key=True),
                         t("t-l12s1-3", "なやんだ", "悩んだ", "なやんだ", key=True), t("t-l12s1-4", "すえに", "末に", "すえに", key=True),
                         t("t-l12s1-5", "、"), t("t-l12s1-6", "けってい", "決定", "けってい", key=True), t("t-l12s1-7", "しました")],
               "Sau một thời gian dài trăn trở, đã quyết định."),
            ex(L, 1, 2, [t("t-l12s1-8", "なんども", "何度も", "なんども", key=True), t("t-l12s1-9", "そうだん", "相談", "そうだん", key=True),
                         t("t-l12s1-10", "した"), t("t-l12s1-11", "すえに", "末に", "すえに", key=True), t("t-l12s1-12", "、"),
                         t("t-l12s1-13", "かいけつ", "解決", "かいけつ", key=True), t("t-l12s1-14", "しました")],
               "Sau nhiều lần bàn bạc, đã giải quyết được."),
        ],
        tips="末に thường đi với các động từ chỉ sự SUY NGHĨ/NỖ LỰC kéo dài: 悩む, 考える, 検討する, 相談する.",
        culture="Tiểu sử doanh nhân Nhật hay viết: '長年の苦労の末に、会社を成功させた' (sau nhiều năm vất vả, đã đưa công ty đến thành công)."),

    slide(L, 2,
        "2. Rốt cuộc (tiêu cực, chê trách): V(た形)/N+の + あげく",
        "V(thể た) / N + の + あげく、[kết quả tiêu cực]",
        "あげく cũng diễn tả 'CUỐI CÙNG, SAU' một quá trình dài, nhưng kết quả THƯỜNG TIÊU CỰC, "
        "THẤT VỌNG — mang sắc thái CHÊ TRÁCH/mỉa mai về việc bao công sức bỏ ra cuối cùng vô ích.",
        [
            ex(L, 2, 1, [t("t-l12s2-1", "ながい", "長い", "ながい", key=True), t("t-l12s2-2", "あいだ", "間", "あいだ", key=True),
                         t("t-l12s2-3", "かんがえた", "考えた", "かんがえた", key=True), t("t-l12s2-4", "あげく", key=True),
                         t("t-l12s2-5", "、"), t("t-l12s2-6", "しっぱい", "失敗", "しっぱい", key=True), t("t-l12s2-7", "しました")],
               "Sau khi suy nghĩ rất lâu, rốt cuộc đã thất bại."),
            ex(L, 2, 2, [t("t-l12s2-8", "なんども", "何度も", "なんども", key=True), t("t-l12s2-9", "やりなおした", "やり直した", "やりなおした", key=True),
                         t("t-l12s2-10", "あげく", key=True), t("t-l12s2-11", "、"), t("t-l12s2-12", "あきらめました", "諦めました", "あきらめました")],
               "Sau nhiều lần làm lại, rốt cuộc đã từ bỏ."),
        ],
        tips="あげく hầu như CHỈ dùng cho kết quả XẤU/THẤT VỌNG — hiếm khi thấy あげく đi với kết quả tốt (nếu có, mang sắc thái mỉa mai kiểu 'cuối cùng cũng...').",
        culture="Câu than phiền quen thuộc của người Nhật: '何時間も悩んだあげく、結局何も決められなかった' (trăn trở mấy tiếng đồng hồ, rốt cuộc chẳng quyết định được gì)."),

    slide(L, 3,
        "3. So sánh 末に và あげく",
        "末に: TRUNG TÍNH/TÍCH CỰC, trang trọng　vs　あげく: TIÊU CỰC, mang sắc thái chê trách/mỉa mai",
        "Cả hai đều nghĩa 'cuối cùng, sau một quá trình dài', nhưng 末に có thể dẫn đến kết quả "
        "TỐT hoặc trung tính; あげく hầu như LUÔN dẫn đến kết quả XẤU, và luôn ẩn chứa cảm xúc THẤT VỌNG của người nói.",
        [
            ex(L, 3, 1, [t("t-l12s3-1", "けんとう", "検討", "けんとう"), t("t-l12s3-2", "した"), t("t-l12s3-3", "すえに", "末に", "すえに", key=True),
                         t("t-l12s3-4", "、"), t("t-l12s3-5", "けっこん", "結婚", "けっこん", key=True), t("t-l12s3-6", "しました")],
               "Sau khi cân nhắc, đã kết hôn. (kết quả tích cực)"),
            ex(L, 3, 2, [t("t-l12s3-7", "けんとう", "検討", "けんとう"), t("t-l12s3-8", "した"), t("t-l12s3-9", "あげく", key=True),
                         t("t-l12s3-10", "、"), t("t-l12s3-11", "けっこん", "結婚", "けっこん", key=True), t("t-l12s3-12", "を"),
                         t("t-l12s3-13", "やめました", "止めました", "やめました")],
               "Sau khi cân nhắc, rốt cuộc đã hủy hôn. (kết quả tiêu cực)"),
        ],
        tips="Mẹo: nếu kết quả TỐT/trung tính → 末に; nếu kết quả XẤU/đáng tiếc, hoặc muốn THAN PHIỀN → あげく.",
        culture="Cả hai đều là ngữ pháp N2 trọng điểm — đọc đúng SẮC THÁI (tích cực/tiêu cực) giúp hiểu được thái độ của người viết trong đề đọc hiểu."),

    slide(L, 4,
        "4. Dạng danh từ: N + の + 末に / あげく",
        "N + の + 末に、[kết quả]　　N + の + あげく、[kết quả tiêu cực]",
        "Khi vế trước là DANH TỪ (thay vì động từ thể た), cả hai đều dùng dạng N+の+末に/あげく "
        "— cấu trúc ngắn gọn hơn, thường thấy trong tiêu đề báo, văn viết súc tích.",
        [
            ex(L, 4, 1, [t("t-l12s4-1", "ながい"), t("t-l12s4-2", "かいぎ", "会議", "かいぎ", key=True), t("t-l12s4-3", "の"),
                         t("t-l12s4-4", "すえに", "末に", "すえに", key=True), t("t-l12s4-5", "、"), t("t-l12s4-6", "けってい", "決定", "けってい", key=True),
                         t("t-l12s4-7", "しました")],
               "Sau cuộc họp dài, đã đưa ra quyết định."),
            ex(L, 4, 2, [t("t-l12s4-8", "なんかい"), t("t-l12s4-9", "もの"), t("t-l12s4-10", "しっぱい", "失敗", "しっぱい", key=True),
                         t("t-l12s4-11", "の"), t("t-l12s4-12", "あげく", key=True), t("t-l12s4-13", "、"), t("t-l12s4-14", "かいしゃ", "会社", "かいしゃ", key=True),
                         t("t-l12s4-15", "を"), t("t-l12s4-16", "やめました", "止めました", "やめました")],
               "Sau nhiều lần thất bại, rốt cuộc đã bỏ việc ở công ty."),
        ],
        tips="N+の+末に/あげく thường thấy trong TIÊU ĐỀ BÁO ngắn gọn: '長時間の議論の末に、可決された' (sau cuộc tranh luận kéo dài, đã được thông qua).",
        culture="Đây là cách viết SÚC TÍCH ưa thích của báo chí Nhật khi tường thuật một quyết định hoặc kết cục sau một quá trình dài."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d12-1", "けっこん", "結婚", "けっこん", key=True), t("d12-2", "を"), t("d12-3", "きめました", "決めました", "きめました"),
          t("d12-4", "か")],
         "Bạn đã quyết định kết hôn chưa?"),
    line(L, 2, "サントス", "Đồng nghiệp",
         [t("d12-5", "はい"), t("d12-6", "。"), t("d12-7", "ながい", "長い", "ながい", key=True), t("d12-8", "あいだ", "間", "あいだ", key=True),
          t("d12-9", "なやんだ", "悩んだ", "なやんだ", key=True), t("d12-10", "すえに", "末に", "すえに", key=True), t("d12-11", "、"),
          t("d12-12", "けっていしました", "決定しました", "けっていしました")],
         "Vâng. Sau một thời gian dài trăn trở, đã quyết định."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d12-13", "かいしゃ", "会社", "かいしゃ", key=True), t("d12-14", "の"), t("d12-15", "もんだい", "問題", "もんだい", key=True),
          t("d12-16", "は"), t("d12-17", "どうなりました", "どう成りました", "どうなりました"), t("d12-18", "か")],
         "Vấn đề của công ty thì thế nào rồi?"),
    line(L, 4, "サントス", "Đồng nghiệp",
         [t("d12-19", "なんども", "何度も", "なんども", key=True), t("d12-20", "そうだん", "相談", "そうだん", key=True), t("d12-21", "した"),
          t("d12-22", "すえに", "末に", "すえに", key=True), t("d12-23", "、"), t("d12-24", "かいけつ", "解決", "かいけつ", key=True),
          t("d12-25", "しました")],
         "Sau nhiều lần bàn bạc, đã giải quyết được."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d12-26", "よかった"), t("d12-27", "です", "です", "です"), t("d12-28", "ね"), t("d12-29", "。"),
          t("d12-30", "でも"), t("d12-31", "ほかの"), t("d12-32", "プロジェクト", "プロジェクト", "プロジェクト"),
          t("d12-33", "は"), t("d12-34", "しっぱい", "失敗", "しっぱい", key=True), t("d12-35", "しました", "為ました", "しました"),
          t("d12-36", "ね")],
         "Tốt quá nhỉ. Nhưng dự án khác thì đã thất bại nhỉ."),
    line(L, 6, "サントス", "Đồng nghiệp",
         [t("d12-37", "はい"), t("d12-38", "。"), t("d12-39", "なんども", "何度も", "なんども", key=True), t("d12-40", "やりなおした", "やり直した", "やりなおした", key=True),
          t("d12-41", "あげく", key=True), t("d12-42", "、"), t("d12-43", "あきらめました", "諦めました", "あきらめました")],
         "Vâng. Sau nhiều lần làm lại, rốt cuộc đã từ bỏ."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d12-44", "つかれました", "疲れました", "つかれました", key=True), t("d12-45", "ね")],
         "Chắc mệt lắm nhỉ."),
    line(L, 8, "サントス", "Đồng nghiệp",
         [t("d12-46", "はい"), t("d12-47", "。"), t("d12-48", "でも"), t("d12-49", "けっこん", "結婚", "けっこん", key=True),
          t("d12-50", "は"), t("d12-51", "せいこう", "成功", "せいこう", key=True), t("d12-52", "しました")],
         "Vâng. Nhưng chuyện kết hôn thì đã thành công."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d12-53", "ながい", "長い", "ながい", key=True), t("d12-54", "かいぎ", "会議", "かいぎ", key=True), t("d12-55", "の"),
          t("d12-56", "すえに", "末に", "すえに", key=True), t("d12-57", "、"), t("d12-58", "けってい", "決定", "けってい", key=True),
          t("d12-59", "しました", "為ました", "しました"), t("d12-60", "か")],
         "Sau cuộc họp dài, đã đưa ra quyết định chưa?"),
    line(L, 10, "サントス", "Đồng nghiệp",
         [t("d12-61", "はい"), t("d12-62", "。"), t("d12-63", "けっか", "結果", "けっか", key=True), t("d12-64", "は"),
          t("d12-65", "よかった", "良かった", "よかった"), t("d12-66", "です", "です", "です")],
         "Vâng. Kết quả tốt."),
]

EXERCISES = [
    q(L, 1, "「長い間悩んだ末に、決定しました」 — 末に diễn tả điều gì?",
      ["Cuối cùng, sau một quá trình dài đắn đo/nỗ lực, kết quả trung tính/tích cực",
       "Kết quả luôn tiêu cực, thất vọng", "Sự khẳng định chắc chắn tuyệt đối",
       "Sự phủ định hoàn toàn"], 0,
      "末に diễn tả kết quả CUỐI CÙNG sau quá trình dài, thường trung tính hoặc tích cực.",
      "Xem cấu trúc 末に ở slide 1."),
    q(L, 2, "「何度もやり直したあげく、諦めました」 — あげく mang sắc thái gì?",
      ["Tiêu cực, thất vọng, mang sắc thái chê trách/mỉa mai",
       "Tích cực, vui mừng", "Trung tính, không cảm xúc",
       "Nghi ngờ về tính chính xác"], 0,
      "あげく luôn mang sắc thái TIÊU CỰC — kết quả thất vọng sau bao công sức bỏ ra.",
      "Xem giải thích あげく ở slide 2."),
    q(L, 3, "あげく có thể dùng cho kết quả TÍCH CỰC một cách tự nhiên không?",
      ["Hầu như không, あげく gần như CHỈ dùng cho kết quả tiêu cực/thất vọng",
       "Có, dùng thoải mái cho cả hai loại kết quả", "Chỉ dùng được cho kết quả tích cực",
       "Không có quy tắc nào về việc này"], 0,
      "あげく hầu như CHỈ tự nhiên khi đi với kết quả XẤU — nếu dùng với kết quả tốt sẽ mang sắc thái mỉa mai kỳ lạ.",
      "Xem lưu ý ngữ pháp ở slide 2."),
    q(L, 4, "「検討した末に、結婚しました」 và 「検討したあげく、結婚をやめました」 khác nhau ở đâu?",
      ["Câu đầu kết quả TÍCH CỰC (kết hôn); câu sau kết quả TIÊU CỰC (hủy hôn)",
       "Không có gì khác nhau cả", "Câu đầu là quá khứ, câu sau là hiện tại",
       "Câu sau là phủ định của câu đầu"], 0,
      "Cùng vế trước (検討した) nhưng đổi 末に/あげく sẽ đổi hẳn sắc thái kết quả (tích cực/tiêu cực).",
      "So sánh hai câu ở slide 3."),
    q(L, 5, "Dạng danh từ của cả hai cấu trúc là gì?",
      ["N + の + 末に / N + の + あげく", "N + が + 末に / N + が + あげく",
       "N + を + 末に / N + を + あげく", "Không có dạng danh từ"], 0,
      "Khi vế trước là danh từ, cả hai dùng dạng N+の+末に/あげく: 長い会議の末に.",
      "Xem quy tắc ở slide 4."),
    q(L, 6, "「何度も相談した末に、解決しました」 nghĩa là:",
      ["Sau nhiều lần bàn bạc, đã giải quyết được (kết quả tích cực)",
       "Sau nhiều lần bàn bạc, vẫn chưa giải quyết được", "Không bàn bạc gì cả",
       "Vấn đề trở nên tồi tệ hơn"], 0,
      "末に ở đây dẫn đến kết quả TÍCH CỰC: giải quyết được vấn đề sau nhiều lần bàn bạc.",
      "Áp dụng cấu trúc V-た+末に."),
    q(L, 7, "「長時間の議論の末に、可決された」 thường xuất hiện ở đâu?",
      ["Tiêu đề báo, văn viết súc tích tường thuật quyết định quan trọng",
       "Chỉ trong thơ ca", "Chỉ trong tin nhắn thân mật", "Không bao giờ được sử dụng"], 0,
      "N+の+末に là cách viết súc tích ưa thích của báo chí Nhật khi tường thuật kết cục sau một quá trình dài.",
      "Xem văn hóa sử dụng ở slide 4."),
    q(L, 8, "Theo hội thoại, Santos đã quyết định kết hôn như thế nào?",
      ["Sau một thời gian dài trăn trở (長い間悩んだ末に、決定しました)",
       "Quyết định ngay lập tức, không suy nghĩ", "Chưa quyết định gì cả",
       "Đã hủy bỏ việc kết hôn"], 0,
      "Santos nói 「長い間悩んだ末に、決定しました」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Dự án khác của Santos kết thúc như thế nào?",
      ["Sau nhiều lần làm lại, rốt cuộc đã từ bỏ (何度もやり直したあげく、諦めました)",
       "Đã thành công rực rỡ", "Vẫn đang tiếp tục", "Không được đề cập trong hội thoại"], 0,
      "Santos nói 「何度もやり直したあげく、諦めました」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Kết quả của cuộc họp dài trong hội thoại là gì?",
      ["Tốt (結果はよかったです)", "Xấu, đáng thất vọng", "Không có kết quả nào",
       "Cuộc họp vẫn đang tiếp diễn"], 0,
      "Santos nói 「結果はよかったです」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 12: Kết cục sau quá trình dài (末に & あげく)",
    "末に diễn tả 'cuối cùng, sau' một quá trình dài đắn đo/nỗ lực với kết quả THƯỜNG TRUNG TÍNH "
    "hoặc TÍCH CỰC, văn phong trang trọng; あげく cũng nghĩa tương tự nhưng kết quả hầu như LUÔN "
    "TIÊU CỰC, mang sắc thái CHÊ TRÁCH/thất vọng về công sức bỏ ra vô ích; cả hai đều có dạng danh "
    "từ N+の+末に/あげく thường thấy trong tiêu đề báo.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
