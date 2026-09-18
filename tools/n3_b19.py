# -*- coding: utf-8 -*-
"""N3 — Bai 19: Bon phan dao duc べきだ (nen lam) va べきではない (khong nen lam).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n3.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n3_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 19
pool = Pool("n3")

VOCAB = [
    v(1,  "したがいます", "従います", "したがいます", "shitagaimasu", "verb", "Tuân theo, phục tùng", "きそくに 従います = tuân theo quy tắc.", L),
    v(2,  "せきにん", "責任", "せきにん", "sekinin", "noun", "Trách nhiệm", "責任を 持ちます = có trách nhiệm.", L),
    v(3,  "ぎむ", "義務", "ぎむ", "gimu", "noun", "Nghĩa vụ", "教育の 義務 = nghĩa vụ giáo dục.", L),
    v(4,  "けんり", "権利", "けんり", "kenri", "noun", "Quyền lợi", "権利を 守ります = bảo vệ quyền lợi.", L),
    v(5,  "まもります", "守ります", "まもります", "mamorimasu", "verb", "Bảo vệ, tuân thủ", "やくそくを 守ります = giữ lời hứa.", L),
    v(6,  "そんちょうします", "尊重します", "そんちょうします", "sonchou shimasu", "verb", "Tôn trọng", "ひとを 尊重します = tôn trọng người khác.", L),
    v(7,  "めいわく", "迷惑", "めいわく", "meiwaku", "noun", "Sự phiền hà, làm phiền", "迷惑を かけます = gây phiền hà.", L),
    v(8,  "ルール", "ルール", "ルール", "ruuru", "noun", "Quy tắc, luật lệ", "ルールを 守ります = tuân thủ quy tắc.", L),
    v(9,  "きそく", "規則", "きそく", "kisoku", "noun", "Quy tắc", "Đã gặp N4 bài 33.", L),
    v(10, "やくそく", "約束", "やくそく", "yakusoku", "noun", "Lời hứa", "Đã gặp N4 bài 33.", L),
    v(11, "かんがえます", "考えます", "かんがえます", "kangaemasu", "verb", "Suy nghĩ", "Đã gặp N4 bài 26.", L),
    v(12, "はやく", "早く", "はやく", "hayaku", "adverb", "Sớm", "Đã gặp N4 bài 26.", L),
    v(13, "けっていします", "決定します", "けっていします", "kettei shimasu", "verb", "Quyết định", "Đã gặp N3 bài 18.", L),
    v(14, "ひと", "人", "ひと", "hito", "noun", "Người", "Đã gặp N5 bài 1.", L),
    v(15, "わたし", "私", "わたし", "watashi", "pronoun", "Tôi", "Đã gặp N5 bài 1.", L),
    v(16, "みんな", "みんな", "みんな", "minna", "pronoun", "Mọi người", "Đã gặp N4 bài 26.", L),
    v(17, "しゃかい", "社会", "しゃかい", "shakai", "noun", "Xã hội", "Đã gặp N3 bài 5.", L),
    v(18, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N5 bài 22.", L),
    v(19, "します", "します", "します", "shimasu", "verb", "Làm", "Đã gặp N5 bài 1.", L),
    v(20, "かけます", "掛けます", "かけます", "kakemasu", "verb", "Gây ra, treo lên", "Đã gặp N3 bài 9.", L),
]

KANJI = [
    k(1, "責", "TRÁCH", 11, ["セキ (seki)"], ["せ(める)"], "Trách nhiệm, khiển trách.",
      [("責任", "せきにん", "Trách nhiệm"), ("自責", "じせき", "Tự trách")], L),
    k(2, "義", "NGHĨA", 13, ["ギ (gi)"], [], "Nghĩa vụ, đạo nghĩa.",
      [("義務", "ぎむ", "Nghĩa vụ"), ("正義", "せいぎ", "Chính nghĩa")], L),
    k(3, "務", "VỤ", 11, ["ム (mu)"], ["つと(める)"], "Nhiệm vụ, công việc.",
      [("義務", "ぎむ", "Nghĩa vụ"), ("事務", "じむ", "Sự vụ, văn phòng")], L),
    k(4, "権", "QUYỀN", 15, ["ケン (ken)"], [], "Quyền lực, quyền lợi.",
      [("権利", "けんり", "Quyền lợi"), ("人権", "じんけん", "Nhân quyền")], L),
    k(5, "尊", "TÔN", 12, ["ソン (son)"], ["とうと(い)"], "Tôn trọng, cao quý.",
      [("尊重", "そんちょう", "Tôn trọng"), ("尊敬", "そんけい", "Kính trọng")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Nên làm (bổn phận đạo đức): V(từ điển) + べきだ",
        "V(thể từ điển) + べきだ   (する + べきだ → すべきだ)",
        "べきだ diễn tả một điều NÊN LÀM theo lẽ đúng đắn, đạo đức, hoặc quan điểm cá nhân/xã hội "
        "về điều gì là ĐÚNG — mang tính CHỦ QUAN hơn なければならない (nghĩa vụ khách quan, bắt buộc).",
        [
            ex(L, 1, 1, [t("t-l19s1-1", "やくそく", "約束", "やくそく", key=True), t("t-l19s1-2", "は"),
                         t("t-l19s1-3", "まもる", "守る", "まもる", key=True), t("t-l19s1-4", "べき", key=True),
                         t("t-l19s1-5", "だ")],
               "Nên giữ lời hứa."),
            ex(L, 1, 2, [t("t-l19s1-6", "きそく", "規則", "きそく", key=True), t("t-l19s1-7", "に"),
                         t("t-l19s1-8", "したがう", "従う", "したがう", key=True), t("t-l19s1-9", "べき", key=True),
                         t("t-l19s1-10", "です")],
               "Nên tuân theo quy tắc."),
        ],
        tips="する+べきだ có thể rút gọn thành すべきだ — cả hai đều đúng ngữ pháp, すべきだ trang trọng hơn, hay dùng trong văn viết.",
        culture="Câu răn dạy quen thuộc ở Nhật: '人の権利を尊重するべきだ' (nên tôn trọng quyền lợi của người khác)."),

    slide(L, 2,
        "2. Không nên làm: V(từ điển) + べきではない",
        "V(thể từ điển) + べきではない",
        "べきではない là PHỦ ĐỊNH của べきだ, diễn tả điều KHÔNG NÊN làm vì đó là điều sai trái, "
        "thiếu đạo đức, hoặc gây ảnh hưởng xấu đến người khác/xã hội.",
        [
            ex(L, 2, 1, [t("t-l19s2-1", "ひと", "人", "ひと", key=True), t("t-l19s2-2", "に"),
                         t("t-l19s2-3", "めいわく", "迷惑", "めいわく", key=True), t("t-l19s2-4", "を"),
                         t("t-l19s2-5", "かける", "掛ける", "かける", key=True), t("t-l19s2-6", "べきでは", key=True),
                         t("t-l19s2-7", "ない", key=True)],
               "Không nên gây phiền hà cho người khác."),
            ex(L, 2, 2, [t("t-l19s2-8", "せきにん", "責任", "せきにん", key=True), t("t-l19s2-9", "を"),
                         t("t-l19s2-10", "わすれる", "忘れる", "わすれる"), t("t-l19s2-11", "べきでは", key=True),
                         t("t-l19s2-12", "ない", key=True), t("t-l19s2-13", "です")],
               "Không nên quên trách nhiệm."),
        ],
        tips="べきではない mạnh hơn なくてもいい (không cần làm cũng được) — べきではない mang ý PHÊ PHÁN, cấm đoán về mặt đạo đức.",
        culture="Quy tắc ứng xử nơi công cộng ở Nhật thường viết: 'ここでタバコを吸うべきではありません' (không nên hút thuốc ở đây)."),

    slide(L, 3,
        "3. So sánh べきだ (đạo đức, chủ quan) và なければならない (N4, nghĩa vụ khách quan)",
        "べきだ: NÊN làm (đạo đức, quan điểm cá nhân)　vs　なければならない: PHẢI làm (nghĩa vụ khách quan, bắt buộc)",
        "なければならない (đã học ở N4) diễn tả nghĩa vụ KHÁCH QUAN, bắt buộc theo quy định/hoàn "
        "cảnh (không làm sẽ có hậu quả cụ thể); べきだ diễn tả điều NÊN LÀM theo ĐẠO ĐỨC/quan điểm "
        "cá nhân — không làm không nhất thiết có hậu quả pháp lý, nhưng bị coi là sai về đạo đức.",
        [
            ex(L, 3, 1, [t("t-l19s3-1", "きそく", "規則", "きそく", key=True), t("t-l19s3-2", "に"),
                         t("t-l19s3-3", "したがわなければ", "従わなければ", "したがわなければ", key=True),
                         t("t-l19s3-4", "なりません", "成りません", "なりません")],
               "Phải tuân theo quy tắc. (nghĩa vụ khách quan, bắt buộc)"),
            ex(L, 3, 2, [t("t-l19s3-5", "ひと", "人", "ひと", key=True), t("t-l19s3-6", "を"),
                         t("t-l19s3-7", "そんちょう", "尊重", "そんちょう", key=True), t("t-l19s3-8", "する"),
                         t("t-l19s3-9", "べき", key=True), t("t-l19s3-10", "だ")],
               "Nên tôn trọng người khác. (đạo đức, chủ quan)"),
        ],
        tips="Mẹo phân biệt: quy định/luật lệ CÓ HẬU QUẢ nếu không làm → なければならない; điều ĐÚNG ĐẮN về đạo đức → べきだ.",
        culture="Ở Nhật, việc phân biệt 'phải làm vì luật' (なければならない) và 'nên làm vì đạo đức' (べきだ) rất quan trọng trong giáo dục công dân."),

    slide(L, 4,
        "4. Hối tiếc về quá khứ: V(từ điển) + べきだった",
        "V(thể từ điển) + べきだった   (lẽ ra NÊN làm nhưng đã KHÔNG làm)",
        "べきだった diễn tả một điều LẼ RA NÊN LÀM (nhưng thực tế đã không làm) — mang sắc thái "
        "HỐI TIẾC của người nói về một quyết định/hành động trong quá khứ.",
        [
            ex(L, 4, 1, [t("t-l19s4-1", "もっと"), t("t-l19s4-2", "はやく", "早く", "はやく", key=True),
                         t("t-l19s4-3", "けってい", "決定", "けってい", key=True), t("t-l19s4-4", "する"),
                         t("t-l19s4-5", "べき", key=True), t("t-l19s4-6", "だった", key=True)],
               "Lẽ ra nên quyết định sớm hơn."),
            ex(L, 4, 2, [t("t-l19s4-7", "せきにん", "責任", "せきにん", key=True), t("t-l19s4-8", "を"),
                         t("t-l19s4-9", "もっと"), t("t-l19s4-10", "かんがえる", "考える", "かんがえる", key=True),
                         t("t-l19s4-11", "べき", key=True), t("t-l19s4-12", "だった", key=True)],
               "Lẽ ra nên suy nghĩ kỹ hơn về trách nhiệm."),
        ],
        tips="べきだった luôn mang sắc thái HỐI TIẾC (giống ればよかった) — khác べきだ chỉ nêu quan điểm về hiện tại/tương lai.",
        culture="Câu tự trách quen thuộc trong nhật ký, hồi tưởng của người Nhật: 'あの時、もっと考えるべきだった' (lúc đó, lẽ ra nên suy nghĩ kỹ hơn)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Thảo luận nhóm",
         [t("d19-1", "しゃかい", "社会", "しゃかい", key=True), t("d19-2", "の"), t("d19-3", "ルール", "ルール", "ルール", key=True),
          t("d19-4", "は"), t("d19-5", "まもる", "守る", "まもる", key=True), t("d19-6", "べき", key=True),
          t("d19-7", "だ"), t("d19-8", "と"), t("d19-9", "おもいます", "思います", "おもいます")],
         "Tôi nghĩ nên tuân thủ quy tắc xã hội."),
    line(L, 2, "サントス", "Thảo luận nhóm",
         [t("d19-10", "はい"), t("d19-11", "、"), t("d19-12", "ひと", "人", "ひと", key=True), t("d19-13", "に"),
          t("d19-14", "めいわく", "迷惑", "めいわく", key=True), t("d19-15", "を"), t("d19-16", "かける", "掛ける", "かける", key=True),
          t("d19-17", "べきでは", key=True), t("d19-18", "ありません", key=True)],
         "Vâng, không nên gây phiền hà cho người khác."),
    line(L, 3, "田中", "Thảo luận nhóm",
         [t("d19-19", "けんり", "権利", "けんり", key=True), t("d19-20", "も"), t("d19-21", "ぎむ", "義務", "ぎむ", key=True),
          t("d19-22", "も"), t("d19-23", "たいせつ", "大切", "たいせつ"), t("d19-24", "です", "です", "です"), t("d19-25", "ね")],
         "Cả quyền lợi lẫn nghĩa vụ đều quan trọng nhỉ."),
    line(L, 4, "サントス", "Thảo luận nhóm",
         [t("d19-26", "みんな", "みんな", "みんな", key=True), t("d19-27", "の"), t("d19-28", "けんり", "権利", "けんり", key=True),
          t("d19-29", "を"), t("d19-30", "そんちょう", "尊重", "そんちょう", key=True), t("d19-31", "する"),
          t("d19-32", "べき", key=True), t("d19-33", "です")],
         "Nên tôn trọng quyền lợi của mọi người."),
    line(L, 5, "田中", "Thảo luận nhóm",
         [t("d19-34", "きそく", "規則", "きそく", key=True), t("d19-35", "に"), t("d19-36", "したがわなければ", "従わなければ", "したがわなければ", key=True),
          t("d19-37", "なりません", "成りません", "なりません")],
         "Phải tuân theo quy tắc."),
    line(L, 6, "サントス", "Thảo luận nhóm",
         [t("d19-38", "はい"), t("d19-39", "、"), t("d19-40", "せきにん", "責任", "せきにん", key=True), t("d19-41", "も"),
          t("d19-42", "もつ", "持つ", "もつ"), t("d19-43", "べき", key=True), t("d19-44", "です")],
         "Vâng, cũng nên có trách nhiệm."),
    line(L, 7, "田中", "Thảo luận nhóm",
         [t("d19-45", "まえ", "前", "まえ"), t("d19-46", "の"), t("d19-47", "もんだい", "問題", "もんだい", key=True),
          t("d19-48", "は"), t("d19-49", "どうでしたか")],
         "Vấn đề trước đó thì sao rồi?"),
    line(L, 8, "サントス", "Thảo luận nhóm",
         [t("d19-50", "もっと"), t("d19-51", "はやく", "早く", "はやく", key=True), t("d19-52", "けってい", "決定", "けってい", key=True),
          t("d19-53", "する"), t("d19-54", "べき", key=True), t("d19-55", "だった", key=True), t("d19-56", "です")],
         "Lẽ ra nên quyết định sớm hơn."),
    line(L, 9, "田中", "Thảo luận nhóm",
         [t("d19-57", "つぎ", "次", "つぎ"), t("d19-58", "は"), t("d19-59", "もっと"), t("d19-60", "かんがえる", "考える", "かんがえる", key=True),
          t("d19-61", "べき", key=True), t("d19-62", "です", "です", "です"), t("d19-63", "ね")],
         "Lần tới nên suy nghĩ kỹ hơn nhỉ."),
    line(L, 10, "サントス", "Thảo luận nhóm",
         [t("d19-64", "はい"), t("d19-65", "。"), t("d19-66", "わたし", "私", "わたし", key=True), t("d19-67", "たち", "達", "たち"),
          t("d19-68", "は"), t("d19-69", "せきにん", "責任", "せきにん", key=True), t("d19-70", "を"),
          t("d19-71", "わすれる", "忘れる", "わすれる"), t("d19-72", "べきでは", key=True), t("d19-73", "ありません", key=True)],
         "Vâng. Chúng ta không nên quên trách nhiệm."),
]

EXERCISES = [
    q(L, 1, "「約束は守るべきだ」 — べきだ diễn tả điều gì?",
      ["Điều nên làm theo lẽ đúng đắn, đạo đức (chủ quan)",
       "Nghĩa vụ bắt buộc theo pháp luật (khách quan)", "Sự hối tiếc về quá khứ",
       "Phủ định việc giữ lời hứa"], 0,
      "べきだ diễn tả điều NÊN LÀM theo quan điểm đạo đức/cá nhân, mang tính chủ quan.",
      "Xem cấu trúc べきだ ở slide 1."),
    q(L, 2, "「人に迷惑をかけるべきではない」 — べきではない diễn tả điều gì?",
      ["Điều KHÔNG NÊN làm vì sai trái/thiếu đạo đức (phủ định của べきだ)",
       "Điều bắt buộc phải làm", "Điều đã xảy ra trong quá khứ",
       "Sự cho phép làm việc gì đó"], 0,
      "べきではない là phủ định của べきだ, diễn tả điều không nên làm vì lý do đạo đức.",
      "Xem cấu trúc べきではない ở slide 2."),
    q(L, 3, "Sự khác biệt cốt lõi giữa べきだ và なければならない là gì?",
      ["べきだ là đạo đức/chủ quan; なければならない là nghĩa vụ khách quan, bắt buộc",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau", "べきだ chỉ dùng cho câu hỏi",
       "なければならない chỉ dùng cho phủ định"], 0,
      "べきだ nêu quan điểm về điều ĐÚNG ĐẮN (đạo đức); なければならない nêu nghĩa vụ có hậu quả cụ thể nếu không làm (khách quan).",
      "Xem bảng so sánh ở slide 3."),
    q(L, 4, "する + べきだ có thể rút gọn thành gì?",
      ["すべきだ", "しべきだ", "するべきではない", "Không thể rút gọn"], 0,
      "する+べきだ có thể rút gọn thành すべきだ, cả hai đều đúng ngữ pháp, すべきだ trang trọng hơn.",
      "Xem ghi chú ở slide 1."),
    q(L, 5, "「もっと早く決定するべきだった」 mang sắc thái gì?",
      ["Hối tiếc về một việc lẽ ra nên làm nhưng đã không làm trong quá khứ",
       "Niềm vui vì đã quyết định đúng lúc", "Dự đoán về tương lai",
       "Nghi ngờ về quyết định của người khác"], 0,
      "べきだった luôn mang sắc thái HỐI TIẾC về một điều lẽ ra nên làm nhưng thực tế đã không làm.",
      "Xem cấu trúc べきだった ở slide 4."),
    q(L, 6, "「規則に従わなければなりません」 và 「人を尊重するべきだ」 khác nhau ở đâu?",
      ["Câu đầu là nghĩa vụ khách quan (quy định); câu sau là quan điểm đạo đức (chủ quan)",
       "Không có gì khác nhau cả", "Câu đầu là quá khứ, câu sau là hiện tại",
       "Câu sau là phủ định của câu đầu"], 0,
      "従わなければなりません là nghĩa vụ bắt buộc theo quy định; 尊重するべきだ là quan điểm đạo đức về điều nên làm.",
      "So sánh hai câu ở slide 3."),
    q(L, 7, "「責任を忘れるべきではない」 nghĩa là:",
      ["Không nên quên trách nhiệm", "Nên quên trách nhiệm đi",
       "Đã quên trách nhiệm rồi", "Trách nhiệm không quan trọng"], 0,
      "べきではない phủ định việc quên trách nhiệm, nghĩa là 'không nên quên'.",
      "Áp dụng cấu trúc べきではない cho động từ 忘れる."),
    q(L, 8, "Theo hội thoại, Santos nghĩ gì về việc gây phiền hà cho người khác?",
      ["Không nên làm vậy (迷惑をかけるべきではありません)", "Nên làm thoải mái",
       "Không có ý kiến gì", "Đồng ý gây phiền hà nếu cần thiết"], 0,
      "Santos nói 「人に迷惑をかけるべきではありません」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Santos nhận xét gì về vấn đề trước đó (quyết định muộn)?",
      ["Lẽ ra nên quyết định sớm hơn (もっと早く決定するべきだった)",
       "Quyết định đúng lúc, không có gì phải tiếc", "Không nhớ vấn đề đó",
       "Vấn đề đó chưa được giải quyết"], 0,
      "Santos nói 「もっと早く決定するべきだったです」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Kết luận cuối cùng của hội thoại là gì?",
      ["Không nên quên trách nhiệm (責任を忘れるべきではありません)",
       "Nên quên hết mọi trách nhiệm", "Trách nhiệm không quan trọng nữa",
       "Cần thêm thời gian để quyết định"], 0,
      "Santos kết luận 「私たちは責任を忘れるべきではありません」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 19: Bổn phận đạo đức (べきだ & べきではない)",
    "べきだ diễn tả điều NÊN LÀM theo lẽ đúng đắn, đạo đức, hoặc quan điểm cá nhân/xã hội (chủ "
    "quan, khác なければならない là nghĩa vụ khách quan); べきではない là phủ định, diễn tả điều "
    "KHÔNG NÊN làm; べきだった mang sắc thái HỐI TIẾC về một việc lẽ ra nên làm trong quá khứ.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
