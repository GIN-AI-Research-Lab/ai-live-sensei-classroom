# -*- coding: utf-8 -*-
"""N3 — Bai 11: Cam xuc manh liet たまらない (than mat), しょうがない (danh chiu/cuc ky), てならない (trang trong).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n3.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n3_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 11
pool = Pool("n3")

VOCAB = [
    v(1,  "うらやましい", "羨ましい", "うらやましい", "urayamashii", "adjective", "Ghen tị, ao ước (thấy người khác có điều mình muốn)", "彼が 羨ましいです = tôi ghen tị với anh ấy.", L),
    v(2,  "くやしい", "悔しい", "くやしい", "kuyashii", "adjective", "Tiếc nuối, cay cú (vì thất bại/thua kém)", "試合に 負けて 悔しいです = thua trận đấu, tiếc nuối.", L),
    v(3,  "ふあん", "不安", "ふあん", "fuan", "noun", "Sự bất an, lo lắng", "将来が 不安です = tương lai khiến tôi bất an.", L),
    v(4,  "つらい", "辛い", "つらい", "tsurai", "adjective", "Đau khổ, vất vả", "仕事が 辛いです = công việc vất vả.", L),
    v(5,  "おそろしい", "恐ろしい", "おそろしい", "osoroshii", "adjective", "Đáng sợ, khủng khiếp", "恐ろしい 話 = câu chuyện đáng sợ.", L),
    v(6,  "かんどうします", "感動します", "かんどうします", "kandou shimasu", "verb", "Cảm động, xúc động", "映画に 感動します = cảm động vì bộ phim.", L),
    v(7,  "なみだ", "涙", "なみだ", "namida", "noun", "Nước mắt", "涙が 出ます = nước mắt trào ra.", L),
    v(8,  "きになります", "気になります", "きになります", "ki ni narimasu", "expression", "Bận tâm, để ý, thắc mắc", "彼のことが 気になります = tôi bận tâm đến người đó.", L),
    v(9,  "しんぱい", "心配", "しんぱい", "shinpai", "noun", "Sự lo lắng", "Đã gặp N4 bài 26.", L),
    v(10, "あいたい", "会いたい", "あいたい", "aitai", "expression", "Muốn gặp", "Đã gặp N5 bài 20.", L),
    v(11, "かぞく", "家族", "かぞく", "kazoku", "noun", "Gia đình", "Đã gặp N5 bài 1.", L),
    v(12, "あつい", "暑い", "あつい", "atsui", "adjective", "Nóng", "Đã gặp N5 bài 8.", L),
    v(13, "でんしゃ", "電車", "でんしゃ", "densha", "noun", "Tàu điện", "Đã gặp N4 bài 34.", L),
    v(14, "とまります", "止まります", "とまります", "tomarimasu", "verb", "Dừng lại", "Đã gặp N4 bài 34.", L),
    v(15, "しごと", "仕事", "しごと", "shigoto", "noun", "Công việc", "Đã gặp N4 bài 26.", L),
    v(16, "いそがしい", "忙しい", "いそがしい", "isogashii", "adjective", "Bận rộn", "Đã gặp N4 bài 26.", L),
    v(17, "しあい", "試合", "しあい", "shiai", "noun", "Trận đấu", "Đã gặp N4 bài 33.", L),
    v(18, "たべたい", "食べたい", "たべたい", "tabetai", "expression", "Muốn ăn", "Đã gặp N5 bài 13.", L),
    v(19, "ひと", "人", "ひと", "hito", "noun", "Người", "Đã gặp N5 bài 1.", L),
    v(20, "しょうらい", "将来", "しょうらい", "shourai", "noun", "Tương lai", "Đã gặp N3 bài 8.", L),
]

KANJI = [
    k(1, "羨", "TIỄN", 13, ["セン (sen)"], ["うらや(ましい)"], "Ghen tị, ao ước.",
      [("羨ましい", "うらやましい", "Ghen tị, ao ước")], L),
    k(2, "悔", "HỐI", 9, ["カイ (kai)"], ["くや(しい)", "く(いる)"], "Hối tiếc, ăn năn.",
      [("悔しい", "くやしい", "Tiếc nuối, cay cú"), ("後悔", "こうかい", "Hối hận")], L),
    k(3, "恐", "KHỦNG", 10, ["キョウ (kyou)"], ["おそ(ろしい)", "おそ(れる)"], "Sợ hãi, khủng khiếp.",
      [("恐ろしい", "おそろしい", "Đáng sợ"), ("恐怖", "きょうふ", "Nỗi sợ hãi")], L),
    k(4, "感", "CẢM", 13, ["カン (kan)"], [], "Cảm xúc, cảm động.",
      [("感動", "かんどう", "Cảm động"), ("感じ", "かんじ", "Cảm giác")], L),
    k(5, "涙", "LỆ", 10, ["ルイ (rui)"], ["なみだ"], "Nước mắt.",
      [("涙", "なみだ", "Nước mắt")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Không chịu nổi (thân mật): Aい(く)て/Aな(で)/V-たくて + たまらない",
        "[Tính từ thể て]/[V-たくて] + たまらない",
        "たまらない gắn sau tính từ (thể て) hoặc động từ thể たい để diễn tả CẢM GIÁC MÃNH LIỆT "
        "ĐẾN MỨC KHÔNG CHỊU NỔI — dùng phổ biến trong hội thoại, cho cả cảm xúc tích cực lẫn tiêu cực.",
        [
            ex(L, 1, 1, [t("t-l11s1-1", "あつくて", "暑くて", "あつくて", key=True), t("t-l11s1-2", "たまりません", key=True)],
               "Nóng không chịu nổi."),
            ex(L, 1, 2, [t("t-l11s1-3", "かぞく", "家族", "かぞく", key=True), t("t-l11s1-4", "に"),
                         t("t-l11s1-5", "あいたくて", "会いたくて", "あいたくて", key=True), t("t-l11s1-6", "たまりません", key=True)],
               "Nhớ gia đình muốn gặp không chịu nổi."),
        ],
        tips="たまらない (thể thông thường) / たまりません (thể lịch sự phủ định) — cả hai đều dùng để nhấn cảm giác mãnh liệt.",
        culture="Câu cảm thán quen thuộc mùa hè ở Nhật: '暑くてたまらない' (nóng không chịu nổi) — ai cũng hay than vãn câu này."),

    slide(L, 2,
        "2. Đành chịu / cực kỳ (thân mật): [thể thường] しょうがない",
        "[Thể thường] + しょうがない (đành chịu)　hoặc　Aい(く)て/V-たくて + しょうがない (cực kỳ, giống たまらない)",
        "しょうがない có 2 nghĩa: (1) diễn tả sự BẤT LỰC/CHẤP NHẬN một tình huống KHÔNG THỂ THAY "
        "ĐỔI ('đành chịu thôi'); (2) khi gắn sau Aくて/V-たくて, mang nghĩa CỰC KỲ giống たまらない nhưng thân mật hơn.",
        [
            ex(L, 2, 1, [t("t-l11s2-1", "でんしゃ", "電車", "でんしゃ", key=True), t("t-l11s2-2", "が"),
                         t("t-l11s2-3", "とまって", "止まって", "とまって", key=True), t("t-l11s2-4", "、"),
                         t("t-l11s2-5", "しょうがない", key=True)],
               "Tàu điện dừng lại, đành chịu vậy thôi."),
            ex(L, 2, 2, [t("t-l11s2-6", "しあい", "試合", "しあい", key=True), t("t-l11s2-7", "に"),
                         t("t-l11s2-8", "まけて"), t("t-l11s2-9", "、"), t("t-l11s2-10", "くやしくて", "悔しくて", "くやしくて", key=True),
                         t("t-l11s2-11", "しょうがない", key=True)],
               "Thua trận đấu, tiếc nuối không chịu nổi."),
        ],
        tips="しかたがない là dạng lịch sự/trang trọng hơn của しょうがない, nghĩa hoàn toàn giống nhau.",
        culture="'しょうがないね' (đành vậy thôi nhỉ) là câu cửa miệng người Nhật hay dùng khi chấp nhận một tình huống không thể thay đổi."),

    slide(L, 3,
        "3. Trào lên tự nhiên (trang trọng): V(tự phát)/Aい/Aな + てならない",
        "[Cảm giác/suy nghĩ] + てならない   (KHÔNG THỂ KIỀM CHẾ được cảm xúc/suy nghĩ tự nhiên trào lên)",
        "てならない diễn tả một CẢM XÚC/SUY NGHĨ TỰ NHIÊN TRÀO LÊN mà người nói KHÔNG THỂ KIỀM CHẾ "
        "được — trang trọng hơn たまらない, thường dùng trong văn viết, hay đi kèm 気になる/思われる.",
        [
            ex(L, 3, 1, [t("t-l11s3-1", "しょうらい", "将来", "しょうらい", key=True), t("t-l11s3-2", "が"),
                         t("t-l11s3-3", "ふあんで", "不安で", "ふあんで", key=True), t("t-l11s3-4", "ならない", key=True)],
               "Tương lai khiến tôi bất an không thể kìm được."),
            ex(L, 3, 2, [t("t-l11s3-5", "あの"), t("t-l11s3-6", "ひと", "人", "ひと", key=True), t("t-l11s3-7", "の"),
                         t("t-l11s3-8", "こと", "事", "こと"), t("t-l11s3-9", "が"), t("t-l11s3-10", "きになって", "気になって", "きになって", key=True),
                         t("t-l11s3-11", "ならない", key=True)],
               "Tôi không thể không bận tâm đến người đó."),
        ],
        tips="てならない thường không dùng cho hành động có Ý CHÍ (như 食べる, 行く) mà chỉ dùng cho CẢM GIÁC/SUY NGHĨ tự phát.",
        culture="Trong tiểu thuyết, báo chí Nhật hay thấy câu văn: '彼女のことが気になってならなかった' (tôi đã không thể không bận tâm đến cô ấy)."),

    slide(L, 4,
        "4. So sánh たまらない, しょうがない, てならない",
        "たまらない: thân mật, phổ biến nhất　vs　しょうがない: thân mật + thêm nghĩa 'đành chịu'　vs　てならない: trang trọng, văn viết",
        "Cả ba đều diễn tả cảm xúc MÃNH LIỆT, nhưng khác về VĂN PHONG và PHẠM VI: たまらない dùng "
        "rộng rãi trong hội thoại; しょうがない thêm nghĩa 'bất lực, đành chịu'; てならない trang "
        "trọng, chỉ dùng cho cảm xúc/suy nghĩ TỰ PHÁT, không chủ ý.",
        [
            ex(L, 4, 1, [t("t-l11s4-1", "かんどう", "感動", "かんどう", key=True), t("t-l11s4-2", "して"),
                         t("t-l11s4-3", "、"), t("t-l11s4-4", "なみだ", "涙", "なみだ", key=True), t("t-l11s4-5", "が"),
                         t("t-l11s4-6", "でて", "出て", "でて"), t("t-l11s4-7", "たまりません", key=True)],
               "Cảm động đến mức nước mắt cứ trào ra không ngừng."),
            ex(L, 4, 2, [t("t-l11s4-8", "しごと", "仕事", "しごと", key=True), t("t-l11s4-9", "が"),
                         t("t-l11s4-10", "いそがしすぎて", "忙しすぎて", "いそがしすぎて", key=True), t("t-l11s4-11", "、"),
                         t("t-l11s4-12", "つらくて", "辛くて", "つらくて", key=True), t("t-l11s4-13", "しょうがない", key=True)],
               "Công việc quá bận rộn đến mức vất vả không chịu nổi."),
        ],
        tips="Mẹo chọn: nói chuyện đời thường → たまらない/しょうがない; viết văn/diễn tả suy nghĩ nội tâm sâu sắc → てならない.",
        culture="Cả ba cấu trúc đều là điểm ngữ pháp N3 hay gặp trong đề đọc hiểu về cảm xúc, tâm trạng nhân vật."),
]

DIALOGUE = [
    line(L, 1, "田中", "Bạn thân",
         [t("d11-1", "きょう", "今日", "きょう"), t("d11-2", "は"), t("d11-3", "あつくて", "暑くて", "あつくて", key=True),
          t("d11-4", "たまりません", key=True), t("d11-5", "ね")],
         "Hôm nay nóng không chịu nổi nhỉ."),
    line(L, 2, "サントス", "Bạn thân",
         [t("d11-6", "そうですね"), t("d11-7", "。"), t("d11-8", "かぞく", "家族", "かぞく", key=True), t("d11-9", "に"),
          t("d11-10", "あいたくて", "会いたくて", "あいたくて", key=True), t("d11-11", "たまりません", key=True)],
         "Đúng vậy nhỉ. Với lại tôi nhớ gia đình muốn gặp không chịu nổi."),
    line(L, 3, "田中", "Bạn thân",
         [t("d11-12", "しあい", "試合", "しあい", key=True), t("d11-13", "は"), t("d11-14", "どうでしたか")],
         "Trận đấu thế nào rồi?"),
    line(L, 4, "サントス", "Bạn thân",
         [t("d11-15", "まけました", "負けました", "まけました"), t("d11-16", "。"), t("d11-17", "くやしくて", "悔しくて", "くやしくて", key=True),
          t("d11-18", "しょうがない", key=True), t("d11-19", "です")],
         "Đã thua rồi. Tiếc nuối không chịu nổi."),
    line(L, 5, "田中", "Bạn thân",
         [t("d11-20", "ゆうしょう", "優勝", "ゆうしょう"), t("d11-21", "した"), t("d11-22", "ひと", "人", "ひと", key=True),
          t("d11-23", "が"), t("d11-24", "うらやましい", "羨ましい", "うらやましい", key=True), t("d11-25", "です", "です", "です"), t("d11-26", "ね")],
         "Bạn ghen tị với người đã vô địch nhỉ."),
    line(L, 6, "サントス", "Bạn thân",
         [t("d11-27", "はい"), t("d11-28", "。"), t("d11-29", "でも"), t("d11-30", "しょうらい", "将来", "しょうらい", key=True),
          t("d11-31", "が"), t("d11-32", "ふあんで", "不安で", "ふあんで", key=True), t("d11-33", "ならない", key=True), t("d11-34", "です")],
         "Vâng. Nhưng tương lai khiến tôi bất an không thể kìm được."),
    line(L, 7, "田中", "Bạn thân",
         [t("d11-35", "どうしてですか")],
         "Tại sao vậy?"),
    line(L, 8, "サントス", "Bạn thân",
         [t("d11-36", "しごと", "仕事", "しごと", key=True), t("d11-37", "が"), t("d11-38", "いそがしすぎて", "忙しすぎて", "いそがしすぎて", key=True),
          t("d11-39", "、"), t("d11-40", "つらい", "辛い", "つらい", key=True), t("d11-41", "です", "です", "です")],
         "Công việc quá bận rộn, vất vả quá."),
    line(L, 9, "田中", "Bạn thân",
         [t("d11-42", "でんしゃ", "電車", "でんしゃ", key=True), t("d11-43", "が"), t("d11-44", "とまって", "止まって", "とまって", key=True),
          t("d11-45", "、"), t("d11-46", "しょうがない", key=True), t("d11-47", "こと", "事", "こと"), t("d11-48", "も"),
          t("d11-49", "おおい", "多い", "おおい"), t("d11-50", "です", "です", "です"), t("d11-51", "ね")],
         "Cũng hay có chuyện tàu điện dừng lại, đành chịu vậy thôi nhỉ."),
    line(L, 10, "サントス", "Bạn thân",
         [t("d11-52", "そうですね"), t("d11-53", "。"), t("d11-54", "きになって", "気になって", "きになって", key=True),
          t("d11-55", "ならない", key=True), t("d11-56", "こと", "事", "こと"), t("d11-57", "が"), t("d11-58", "おおい", "多い", "おおい"),
          t("d11-59", "です", "です", "です")],
         "Đúng vậy nhỉ. Có nhiều chuyện khiến tôi không thể không bận tâm."),
]

EXERCISES = [
    q(L, 1, "「暑くてたまりません」 — たまらない diễn tả điều gì?",
      ["Cảm giác mãnh liệt, không chịu nổi (thân mật, phổ biến)", "Sự chấp nhận, đành chịu",
       "Cảm xúc tự nhiên trào lên trong văn viết", "Phủ định việc nóng"], 0,
      "たまらない gắn sau tính từ thể て để diễn tả cảm giác mãnh liệt, không chịu nổi.",
      "Xem cấu trúc たまらない ở slide 1."),
    q(L, 2, "「電車が止まって、しょうがない」 — しょうがない ở đây mang nghĩa gì?",
      ["Đành chịu, không có cách nào khác (chấp nhận tình huống không thể thay đổi)",
       "Cực kỳ vui mừng", "Cảm xúc tự nhiên trào lên", "So sánh hai sự việc"], 0,
      "Đây là nghĩa thứ nhất của しょうがない: chấp nhận một tình huống bất lực, không thể thay đổi được.",
      "Xem nghĩa (1) của しょうがない ở slide 2."),
    q(L, 3, "「悔しくてしょうがない」 — しょうがない ở đây mang nghĩa gì?",
      ["Cực kỳ, không chịu nổi (giống たまらない, thân mật)", "Đành chịu, chấp nhận",
       "Sự vui mừng nhẹ nhàng", "Phủ định cảm xúc"], 0,
      "Khi gắn sau Aくて (悔しくて), しょうがない mang nghĩa CỰC KỲ giống たまらない, không phải nghĩa 'đành chịu'.",
      "Xem nghĩa (2) của しょうがない ở slide 2."),
    q(L, 4, "「将来が不安でならない」 — てならない khác たまらない ở điểm nào?",
      ["てならない trang trọng hơn, chỉ dùng cho cảm xúc/suy nghĩ TỰ PHÁT không chủ ý",
       "Hoàn toàn giống nhau, dùng thay thế được", "てならない chỉ dùng cho câu hỏi",
       "たまらない chỉ dùng trong văn viết"], 0,
      "てならない trang trọng hơn たまらない, và chỉ dùng cho cảm xúc/suy nghĩ tự nhiên trào lên, không phải hành động có ý chí.",
      "Xem giải thích てならない ở slide 3."),
    q(L, 5, "「あの人のことが気になってならない」 nghĩa là:",
      ["Tôi không thể không bận tâm đến người đó (cảm giác tự nhiên, không kiềm được)",
       "Tôi hoàn toàn không quan tâm đến người đó", "Tôi đã quên người đó rồi",
       "Người đó không bận tâm đến tôi"], 0,
      "気になってならない diễn tả cảm giác bận tâm tự nhiên trào lên, không thể kiềm chế được.",
      "Áp dụng cấu trúc てならない cho 気になる."),
    q(L, 6, "Có thể dùng てならない cho hành động có ý chí như 'ăn' hay 'đi' không?",
      ["Không, てならない chỉ dùng cho cảm giác/suy nghĩ tự phát, không dùng cho hành động có ý chí",
       "Có, dùng được cho mọi loại động từ", "Chỉ dùng được cho động từ chỉ hành động",
       "Chỉ dùng được trong câu phủ định"], 0,
      "てならない giới hạn ở cảm giác/suy nghĩ TỰ NHIÊN trào lên (不安, 気になる...), không dùng cho hành động có chủ ý.",
      "Xem ghi chú ngữ pháp ở slide 3."),
    q(L, 7, "Ba cấu trúc たまらない, しょうがない, てならない khác nhau chủ yếu về:",
      ["Văn phong (thân mật vs trang trọng) và phạm vi sử dụng (rộng rãi vs chỉ cảm xúc tự phát)",
       "Không có gì khác nhau, hoàn toàn thay thế được cho nhau",
       "Chỉ khác nhau về thì quá khứ/hiện tại", "Chỉ dùng được cho câu phủ định"], 0,
      "たまらない dùng rộng rãi; しょうがない thêm nghĩa đành chịu; てならない trang trọng, giới hạn cho cảm xúc tự phát.",
      "Xem bảng so sánh ở slide 4."),
    q(L, 8, "Theo hội thoại, Santos cảm thấy thế nào sau khi thua trận đấu?",
      ["Tiếc nuối không chịu nổi (悔しくてしょうがないです)", "Rất vui mừng", "Không có cảm xúc gì",
       "Ghen tị với chính mình"], 0,
      "Santos nói 「負けました。悔しくてしょうがないです」.",
      "Xem câu thoại thứ 4."),
    q(L, 9, "Vì sao Santos cảm thấy bất an về tương lai?",
      ["Vì công việc quá bận rộn, vất vả (仕事が忙しすぎて、辛いです)",
       "Vì đã thắng trận đấu", "Vì gia đình ở gần", "Không có lý do gì cả"], 0,
      "Santos giải thích 「仕事が忙しすぎて、辛いです」sau khi nói về sự bất an.",
      "Xem câu thoại thứ 6-8."),
    q(L, 10, "田中 nhận xét gì về việc tàu điện dừng lại?",
      ["Đó là chuyện hay xảy ra, đành chịu thôi (しょうがないことも多いです)",
       "Chuyện đó chưa từng xảy ra", "Rất vui khi tàu điện dừng lại",
       "Không được đề cập trong hội thoại"], 0,
      "田中 nói 「電車が止まって、しょうがないことも多いですね」.",
      "Xem câu thoại thứ 9."),
]

LESSON = lesson(
    L,
    "Bài 11: Cảm xúc mãnh liệt (たまらない & しょうがない & てならない)",
    "たまらない diễn tả cảm giác MÃNH LIỆT không chịu nổi (thân mật, phổ biến); しょうがない mang 2 "
    "nghĩa - đành chịu/bất lực, hoặc cực kỳ (giống たまらない, thân mật); てならない trang trọng hơn, "
    "chỉ dùng cho cảm xúc/suy nghĩ TỰ NHIÊN trào lên mà người nói không thể kiềm chế được.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
