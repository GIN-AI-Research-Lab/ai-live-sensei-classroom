# -*- coding: utf-8 -*-
"""N2 — Bai 3: Tuyet doi khong the っこない (than mat, khang dinh), かねる (trang trong, tu choi),
ようがない (thieu phuong phap/phuong tien).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n2.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n2_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 3
pool = Pool("n2")

VOCAB = [
    v(1,  "しかたがない", "仕方がない", "しかたがない", "shikata ga nai", "expression", "Không có cách nào khác, đành chịu", "仕方がないですね = đành chịu vậy thôi nhỉ.", L),
    v(2,  "かいとう", "解答", "かいとう", "kaitou", "noun", "Đáp án, lời giải", "問題の 解答 = đáp án của bài toán.", L),
    v(3,  "かいせつ", "解説", "かいせつ", "kaisetsu", "noun", "Giải thích chi tiết, chú giải", "詳しい 解説 = giải thích chi tiết.", L),
    v(4,  "しんだん", "診断", "しんだん", "shindan", "noun", "Chẩn đoán", "医者の 診断 = chẩn đoán của bác sĩ.", L),
    v(5,  "たのもしい", "頼もしい", "たのもしい", "tanomoshii", "adjective", "Đáng tin cậy, đáng dựa vào", "頼もしい 人 = người đáng tin cậy.", L),
    v(6,  "おうじます", "応じます", "おうじます", "oujimasu", "verb", "Đáp ứng, hưởng ứng", "要求に 応じます = đáp ứng yêu cầu.", L),
    v(7,  "ようきゅう", "要求", "ようきゅう", "youkyuu", "noun", "Yêu cầu", "客の 要求 = yêu cầu của khách hàng.", L),
    v(8,  "かいけつします", "解決します", "かいけつします", "kaiketsu shimasu", "verb", "Giải quyết", "問題を 解決します = giải quyết vấn đề.", L),
    v(9,  "なおします", "直します", "なおします", "naoshimasu", "verb", "Sửa chữa", "機械を 直します = sửa máy móc.", L),
    v(10, "ほうほう", "方法", "ほうほう", "houhou", "noun", "Phương pháp", "解決の 方法 = phương pháp giải quyết.", L),
    v(11, "せつめいします", "説明します", "せつめいします", "setsumei shimasu", "verb", "Giải thích", "Đã gặp N4 bài 26.", L),
    v(12, "しんじます", "信じます", "しんじます", "shinjimasu", "verb", "Tin tưởng", "Đã gặp N5 bài 21.", L),
    v(13, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N5 bài 22.", L),
    v(14, "きます", "来ます", "きます", "kimasu", "verb", "Đến", "Đã gặp N4 bài 26.", L),
    v(15, "かれ", "彼", "かれ", "kare", "noun", "Anh ấy", "Đã gặp N3 bài 3.", L),
    v(16, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N4 bài 26.", L),
    v(17, "きゃく", "客", "きゃく", "kyaku", "noun", "Khách hàng", "Đã gặp N4 bài 41.", L),
    v(18, "わかります", "分かります", "わかります", "wakarimasu", "verb", "Hiểu, biết", "Đã gặp N4 bài 38.", L),
    v(19, "できません", "出来ません", "できません", "dekimasen", "verb", "Không thể làm được", "Đã gặp N5 bài 18.", L),
    v(20, "れんらくします", "連絡します", "れんらくします", "renraku shimasu", "verb", "Liên lạc", "Đã gặp N4 bài 41.", L),
]

KANJI = [
    k(1, "解", "GIẢI", 13, ["カイ (kai)"], ["と(く)"], "Giải thích, tháo gỡ.",
      [("解答", "かいとう", "Đáp án"), ("解決", "かいけつ", "Giải quyết")], L),
    k(2, "診", "CHẨN", 12, ["シン (shin)"], [], "Khám bệnh, chẩn đoán.",
      [("診断", "しんだん", "Chẩn đoán"), ("診察", "しんさつ", "Khám bệnh")], L),
    k(3, "頼", "LẠI", 16, ["ライ (rai)"], ["たの(む)", "たの(もしい)"], "Nhờ cậy, tin cậy.",
      [("頼もしい", "たのもしい", "Đáng tin cậy"), ("依頼", "いらい", "Ủy thác, nhờ cậy")], L),
    k(4, "応", "ỨNG", 7, ["オウ (ou)"], [], "Đáp ứng, hưởng ứng.",
      [("応じます", "おうじます", "Đáp ứng"), ("対応", "たいおう", "Đối ứng, ứng phó")], L),
    k(5, "求", "CẦU", 7, ["キュウ (kyuu)"], ["もと(める)"], "Yêu cầu, tìm kiếm.",
      [("要求", "ようきゅう", "Yêu cầu"), ("求める", "もとめる", "Tìm kiếm, yêu cầu")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Tuyệt đối không thể (thân mật, khẳng định chắc chắn): V-stem + っこない",
        "V-ます-stem + っこない",
        "っこない diễn tả 'TUYỆT ĐỐI KHÔNG THỂ' xảy ra — mang tính KHẲNG ĐỊNH CHẮC CHẮN của "
        "người nói, dùng nhiều trong hội thoại THÂN MẬT, KHÔNG dùng trong văn viết/ngữ cảnh trang trọng.",
        [
            ex(L, 1, 1, [t("t-l3s1-1", "こんな"), t("t-l3s1-2", "もんだい", "問題", "もんだい", key=True),
                         t("t-l3s1-3", "、"), t("t-l3s1-4", "とけ", "解け", "とけ"), t("t-l3s1-5", "っこない", key=True)],
               "Bài toán như thế này, tuyệt đối không giải được đâu."),
            ex(L, 1, 2, [t("t-l3s1-6", "かれ", "彼", "かれ", key=True), t("t-l3s1-7", "が"),
                         t("t-l3s1-8", "しんじ", "信じ", "しんじ", key=True), t("t-l3s1-9", "っこない", key=True)],
               "Anh ta tuyệt đối sẽ không tin đâu."),
        ],
        tips="っこない chỉ dùng được với V-stem (không dùng với い/な-adjective) — và luôn mang giọng điệu THÂN MẬT, hơi cảm thán.",
        culture="Bạn bè Nhật hay nói với nhau: '彼が来っこないよ' (nó tuyệt đối không đến đâu) khi chắc chắn về một dự đoán."),

    slide(L, 2,
        "2. Khó có thể (trang trọng, từ chối lịch sự): V-stem + かねる",
        "V-ます-stem + かねる",
        "かねる diễn tả 'KHÓ CÓ THỂ' làm gì đó — TRANG TRỌNG, LỊCH SỰ, thường dùng khi TỪ CHỐI "
        "một yêu cầu trong ngữ cảnh dịch vụ khách hàng, công việc (mềm mỏng hơn nói thẳng できません).",
        [
            ex(L, 2, 1, [t("t-l3s2-1", "その"), t("t-l3s2-2", "ようきゅう", "要求", "ようきゅう", key=True),
                         t("t-l3s2-3", "には"), t("t-l3s2-4", "おうじ", "応じ", "おうじ", key=True), t("t-l3s2-5", "かねます", key=True)],
               "Chúng tôi khó có thể đáp ứng yêu cầu đó."),
            ex(L, 2, 2, [t("t-l3s2-6", "わたし", "私", "わたし"), t("t-l3s2-7", "には"),
                         t("t-l3s2-8", "せつめい", "説明", "せつめい", key=True), t("t-l3s2-9", "し"),
                         t("t-l3s2-10", "かねます", key=True)],
               "Tôi khó có thể giải thích được điều đó."),
        ],
        tips="かねる là mẫu câu TỪ CHỐI LỊCH SỰ chuẩn mực trong công sở Nhật — tránh nói thẳng できません, mềm mỏng và tôn trọng hơn.",
        culture="Nhân viên dịch vụ khách hàng Nhật hay dùng: 'そのご要望にはお応えしかねます' (chúng tôi khó có thể đáp ứng nguyện vọng đó của quý khách)."),

    slide(L, 3,
        "3. Không có cách nào để... (thiếu phương pháp/phương tiện): V-stem + ようがない",
        "V-ます-stem + ようがない",
        "ようがない diễn tả 'KHÔNG CÓ CÁCH NÀO' để làm gì đó vì THIẾU PHƯƠNG TIỆN/PHƯƠNG PHÁP cụ "
        "thể — khác với っこない (khẳng định chắc chắn) hay かねる (từ chối lịch sự vì lý do chủ quan).",
        [
            ex(L, 3, 1, [t("t-l3s3-1", "これ"), t("t-l3s3-2", "は"), t("t-l3s3-3", "なおし", "直し", "なおし", key=True),
                         t("t-l3s3-4", "ようが", key=True), t("t-l3s3-5", "ない", key=True)],
               "Cái này không có cách nào để sửa được."),
            ex(L, 3, 2, [t("t-l3s3-6", "れんらく", "連絡", "れんらく", key=True), t("t-l3s3-7", "の"),
                         t("t-l3s3-8", "し", key=True), t("t-l3s3-9", "ようが", key=True), t("t-l3s3-10", "ない", key=True)],
               "Không có cách nào để liên lạc được."),
        ],
        tips="ようがない thường xuất hiện khi PHƯƠNG TIỆN không tồn tại (mất số điện thoại, hỏng hoàn toàn) chứ không phải vì không muốn làm.",
        culture="Câu than thở khi đồ vật hỏng nặng: 'これは古すぎて直しようがない' (cái này cũ quá, không có cách nào sửa được)."),

    slide(L, 4,
        "4. So sánh っこない, かねる, ようがない",
        "っこない: KHẲNG ĐỊNH chắc chắn (thân mật)　vs　かねる: TỪ CHỐI lịch sự (trang trọng)　vs　ようがない: THIẾU PHƯƠNG TIỆN/phương pháp",
        "Ba cấu trúc đều nói về 'không thể' nhưng LÝ DO khác nhau: っこない vì người nói TIN CHẮC "
        "điều đó không xảy ra; かねる vì lý do CHỦ QUAN (khó xử, không tiện) nên từ chối lịch sự; "
        "ようがない vì THIẾU PHƯƠNG TIỆN/CÁCH THỨC khách quan để thực hiện.",
        [
            ex(L, 4, 1, [t("t-l3s4-1", "かいけつ", "解決", "かいけつ", key=True), t("t-l3s4-2", "でき", key=True),
                         t("t-l3s4-3", "っこない", key=True), t("t-l3s4-4", "です", "です", "です")],
               "Tuyệt đối không thể giải quyết được đâu. (khẳng định chắc chắn)"),
            ex(L, 4, 2, [t("t-l3s4-5", "かいとう", "解答", "かいとう", key=True), t("t-l3s4-6", "を"),
                         t("t-l3s4-7", "しめし", "示し", "しめし"), t("t-l3s4-8", "かねます", key=True)],
               "Chúng tôi khó có thể chỉ ra đáp án. (từ chối lịch sự)"),
        ],
        tips="Mẹo: hội thoại đời thường, tự tin dự đoán → っこない; công việc/dịch vụ, từ chối khéo → かねる; đồ vật/tình huống hết cách → ようがない.",
        culture="Ba cấu trúc này thường bị nhầm lẫn trong đề thi JLPT N2 vì đều dịch là 'không thể' — cần dựa vào NGỮ CẢNH (thân mật/trang trọng/thiếu phương tiện) để chọn đúng."),
]

DIALOGUE = [
    line(L, 1, "田中", "Nhân viên tiếp tân",
         [t("d3-1", "きゃく", "客", "きゃく", key=True), t("d3-2", "から"), t("d3-3", "の"),
          t("d3-4", "ようきゅう", "要求", "ようきゅう", key=True), t("d3-5", "は"), t("d3-6", "どうでしたか")],
         "Yêu cầu từ khách hàng thế nào rồi?"),
    line(L, 2, "サントス", "Nhân viên tiếp tân",
         [t("d3-7", "その"), t("d3-8", "ようきゅう", "要求", "ようきゅう", key=True), t("d3-9", "には"),
          t("d3-10", "おうじ", "応じ", "おうじ", key=True), t("d3-11", "かねます", key=True)],
         "Chúng tôi khó có thể đáp ứng yêu cầu đó."),
    line(L, 3, "田中", "Nhân viên tiếp tân",
         [t("d3-12", "きかい", "機械", "きかい"), t("d3-13", "は"), t("d3-14", "なおします", "直します", "なおします", key=True),
          t("d3-15", "か")],
         "Cái máy có sửa được không?"),
    line(L, 4, "サントス", "Nhân viên tiếp tân",
         [t("d3-16", "いいえ"), t("d3-17", "、"), t("d3-18", "これ"), t("d3-19", "は"),
          t("d3-20", "なおし", "直し", "なおし", key=True), t("d3-21", "ようが", key=True), t("d3-22", "ない", key=True),
          t("d3-23", "です")],
         "Không, cái này không có cách nào để sửa được."),
    line(L, 5, "田中", "Nhân viên tiếp tân",
         [t("d3-24", "きゃく", "客", "きゃく", key=True), t("d3-25", "は"), t("d3-26", "しんじます", "信じます", "しんじます", key=True),
          t("d3-27", "か")],
         "Khách hàng có tin không?"),
    line(L, 6, "サントス", "Nhân viên tiếp tân",
         [t("d3-28", "しんじ", "信じ", "しんじ", key=True), t("d3-29", "っこない", key=True), t("d3-30", "です", "です", "です"), t("d3-31", "ね")],
         "Chắc chắn khách hàng sẽ không tin đâu nhỉ."),
    line(L, 7, "田中", "Nhân viên tiếp tân",
         [t("d3-32", "かいけつ", "解決", "かいけつ", key=True), t("d3-33", "の"), t("d3-34", "ほうほう", "方法", "ほうほう", key=True),
          t("d3-35", "は"), t("d3-36", "ありますか")],
         "Có phương pháp giải quyết nào không?"),
    line(L, 8, "サントス", "Nhân viên tiếp tân",
         [t("d3-37", "しんだん", "診断", "しんだん", key=True), t("d3-38", "の"), t("d3-39", "かいせつ", "解説", "かいせつ", key=True),
          t("d3-40", "を"), t("d3-41", "せつめい", "説明", "せつめい", key=True), t("d3-42", "します")],
         "Tôi sẽ giải thích phần chú giải chẩn đoán."),
    line(L, 9, "田中", "Nhân viên tiếp tân",
         [t("d3-43", "たのもしい", "頼もしい", "たのもしい", key=True), t("d3-44", "です", "です", "です"), t("d3-45", "ね")],
         "Bạn thật đáng tin cậy nhỉ."),
    line(L, 10, "サントス", "Nhân viên tiếp tân",
         [t("d3-46", "しかたがない", "仕方がない", "しかたがない", key=True), t("d3-47", "です", "です", "です"), t("d3-48", "。"),
          t("d3-49", "わかりました", "分かりました", "わかりました"), t("d3-50", "。"), t("d3-51", "れんらく", "連絡", "れんらく", key=True),
          t("d3-52", "します")],
         "Đành chịu vậy thôi. Đã hiểu rồi. Tôi sẽ liên lạc."),
]

EXERCISES = [
    q(L, 1, "「こんな問題、解けっこない」 — っこない diễn tả điều gì?",
      ["Khẳng định chắc chắn tuyệt đối không thể xảy ra (thân mật)",
       "Từ chối lịch sự một yêu cầu", "Không có phương pháp thực hiện",
       "Sự cho phép làm việc gì đó"], 0,
      "っこない diễn tả sự KHẲNG ĐỊNH CHẮC CHẮN của người nói rằng điều đó tuyệt đối không thể xảy ra, dùng trong hội thoại thân mật.",
      "Xem cấu trúc っこない ở slide 1."),
    q(L, 2, "「その要求には応じかねます」 — かねる khác っこない ở điểm nào?",
      ["かねる trang trọng, dùng để TỪ CHỐI LỊCH SỰ; っこない thân mật, khẳng định chắc chắn",
       "Hoàn toàn giống nhau, không khác gì cả", "かねる chỉ dùng cho câu hỏi",
       "っこない chỉ dùng cho phủ định"], 0,
      "かねる mềm mỏng, lịch sự, dùng để từ chối yêu cầu trong công việc; っこない thân mật, mang tính khẳng định chắc chắn.",
      "Xem giải thích かねる ở slide 2."),
    q(L, 3, "「これは直しようがない」 — ようがない diễn tả điều gì?",
      ["Không có cách nào/phương tiện để thực hiện (khách quan, thiếu phương pháp)",
       "Từ chối vì lý do chủ quan", "Khẳng định chắc chắn về tương lai",
       "Sự đồng ý miễn cưỡng"], 0,
      "ようがない diễn tả việc THIẾU PHƯƠNG TIỆN/PHƯƠNG PHÁP khách quan để thực hiện, không liên quan đến ý muốn chủ quan.",
      "Xem cấu trúc ようがない ở slide 3."),
    q(L, 4, "っこない chỉ dùng được với loại từ nào?",
      ["V-stem (không dùng với tính từ)", "Chỉ dùng với tính từ い",
       "Chỉ dùng với tính từ な", "Dùng được với mọi loại từ"], 0,
      "っこない chỉ gắn được sau V-stem, không dùng trực tiếp với tính từ.",
      "Xem ghi chú ngữ pháp ở slide 1."),
    q(L, 5, "Trong ngữ cảnh nào nên dùng かねる thay vì できません?",
      ["Khi cần từ chối một yêu cầu một cách LỊCH SỰ, MỀM MỎNG trong công việc/dịch vụ",
       "Khi nói chuyện thân mật với bạn bè", "Khi ra lệnh cho cấp dưới",
       "Không có sự khác biệt nào"], 0,
      "かねる lịch sự, mềm mỏng hơn できません, phù hợp trong ngữ cảnh công sở, dịch vụ khách hàng.",
      "Xem văn hóa sử dụng かねる ở slide 2."),
    q(L, 6, "「連絡のしようがない」 nghĩa là:",
      ["Không có cách nào để liên lạc được (thiếu phương tiện liên lạc)",
       "Không muốn liên lạc", "Đã liên lạc thành công", "Từ chối liên lạc vì lý do cá nhân"], 0,
      "ようがない ở đây nhấn việc THIẾU PHƯƠNG TIỆN (không có cách/kênh) để liên lạc được.",
      "Áp dụng cấu trúc V-stemようがない cho 連絡します."),
    q(L, 7, "Ba cấu trúc っこない/かねる/ようがない khác nhau chủ yếu về:",
      ["Lý do 'không thể' (khẳng định chắc chắn/từ chối lịch sự/thiếu phương tiện) và mức độ trang trọng",
       "Không có gì khác nhau, hoàn toàn thay thế được cho nhau",
       "Chỉ khác nhau về thì quá khứ/hiện tại", "Chỉ dùng được cho câu phủ định"], 0,
      "っこない=khẳng định chắc chắn (thân mật); かねる=từ chối lịch sự (trang trọng); ようがない=thiếu phương tiện (khách quan).",
      "Xem bảng so sánh ở slide 4."),
    q(L, 8, "Theo hội thoại, cái máy có sửa được không?",
      ["Không, không có cách nào để sửa được (直しようがないです)",
       "Có, sửa được dễ dàng", "Chưa xác định được", "Không được đề cập trong hội thoại"], 0,
      "Santos trả lời 「これは直しようがないです」.",
      "Xem câu thoại thứ 4."),
    q(L, 9, "Santos nghĩ khách hàng có tin vào việc máy không sửa được không?",
      ["Chắc chắn khách hàng sẽ không tin (信じっこないです)",
       "Chắc chắn khách hàng sẽ tin ngay", "Không có ý kiến gì",
       "Khách hàng đã tin rồi"], 0,
      "Santos nói 「信じっこないですね」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Santos sẽ làm gì để giải quyết tình huống với khách hàng?",
      ["Giải thích phần chú giải chẩn đoán rồi liên lạc (診断の解説を説明して、連絡します)",
       "Không làm gì cả", "Từ chối gặp khách hàng", "Sửa máy ngay lập tức"], 0,
      "Santos nói 「診断の解説を説明します」và cuối cùng 「連絡します」.",
      "Xem câu thoại thứ 8 và 10."),
]

LESSON = lesson(
    L,
    "Bài 3: Tuyệt đối không thể (っこない & かねる & ようがない)",
    "っこない diễn tả sự KHẲNG ĐỊNH CHẮC CHẮN tuyệt đối không thể xảy ra (thân mật, hội thoại đời "
    "thường); かねる diễn tả việc TỪ CHỐI LỊCH SỰ một yêu cầu (trang trọng, dùng trong công "
    "việc/dịch vụ); ようがない diễn tả việc THIẾU PHƯƠNG TIỆN/PHƯƠNG PHÁP khách quan để thực hiện "
    "— ba cách diễn đạt 'không thể' khác nhau về lý do và mức độ trang trọng.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
