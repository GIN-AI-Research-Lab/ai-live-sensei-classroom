# -*- coding: utf-8 -*-
"""N1 — Bai 4: Coi nhe / huong chi はおろか (nhan manh muc do te hai qua so sanh) va on lai
をものともせず (N2 bai 9, bat chap kho khan).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 4
pool = Pool("n1")

VOCAB = [
    v(1,  "ひんこん", "貧困", "ひんこん", "hinkon", "noun", "Nghèo đói, khốn cùng", "貧困を ものともせず = bất chấp nghèo đói.", L),
    v(2,  "こどく", "孤独", "こどく", "kodoku", "noun", "Cô độc, cô đơn", "孤独な じんせい = cuộc đời cô độc.", L),
    v(3,  "ひらがな", "ひらがな", "ひらがな", "hiragana", "noun", "Chữ hiragana", "ひらがなさえ かけません = ngay cả hiragana cũng không viết được.", L),
    v(4,  "じんせい", "人生", "じんせい", "jinsei", "noun", "Đời người, cuộc đời", "きびしい じんせい = cuộc đời khắc nghiệt.", L),
    v(5,  "かんじ", "漢字", "かんじ", "kanji", "noun", "Chữ Hán", "Đã gặp N4 bài 26.", L),
    v(6,  "かきます", "書きます", "かきます", "kakimasu", "verb", "Viết", "Đã gặp N4 bài 26.", L),
    v(7,  "かけます", "書けます", "かけます", "kakemasu", "verb", "Có thể viết", "Đã gặp N4 bài 27.", L),
    v(8,  "まずしい", "貧しい", "まずしい", "mazushii", "adjective", "Nghèo", "Đã gặp N3 bài 4.", L),
    v(9,  "けいけん", "経験", "けいけん", "keiken", "noun", "Kinh nghiệm", "Đã gặp N4 bài 26.", L),
    v(10, "どりょく", "努力", "どりょく", "doryoku", "noun", "Nỗ lực", "Đã gặp N3 bài 8.", L),
    v(11, "せいかつ", "生活", "せいかつ", "seikatsu", "noun", "Cuộc sống", "Đã gặp N4 bài 28.", L),
    v(12, "しょくじ", "食事", "しょくじ", "shokuji", "noun", "Bữa ăn", "Đã gặp N4 bài 26.", L),
    v(13, "おかね", "お金", "おかね", "okane", "noun", "Tiền", "Đã gặp N4 bài 26.", L),
    v(14, "ほん", "本", "ほん", "hon", "noun", "Sách", "Đã gặp N4 bài 26.", L),
    v(15, "なまえ", "名前", "なまえ", "namae", "noun", "Tên", "Đã gặp N4 bài 26.", L),
    v(16, "ものともせず", "ものともせず", "ものともせず", "mono to mo sezu", "expression", "Bất chấp (khó khăn)", "Đã gặp N2 bài 9.", L),
    v(17, "きけん", "危険", "きけん", "kiken", "adjective", "Nguy hiểm", "Đã gặp N4 bài 34.", L),
    v(18, "しっぱいします", "失敗します", "しっぱいします", "shippai shimasu", "verb", "Thất bại", "Đã gặp N4 bài 43.", L),
    v(19, "せいこうします", "成功します", "せいこうします", "seikou shimasu", "verb", "Thành công", "Đã gặp N3 bài 8.", L),
    v(20, "がんばります", "頑張ります", "がんばります", "ganbarimasu", "verb", "Cố gắng", "Đã gặp N4 bài 32.", L),
]

KANJI = [
    k(1, "困", "KHỐN", 7, ["コン (kon)"], ["こま(る)"], "Khốn khó, khó khăn.",
      [("貧困", "ひんこん", "Nghèo đói"), ("困ります", "こまります", "Khó xử, gặp khó khăn")], L),
    k(2, "孤", "CÔ", 9, ["コ (ko)"], [], "Cô đơn, lẻ loi.",
      [("孤独", "こどく", "Cô độc"), ("孤児", "こじ", "Trẻ mồ côi")], L),
    k(3, "独", "ĐỘC", 9, ["ドク (doku)"], ["ひと(り)"], "Một mình, độc lập.",
      [("孤独", "こどく", "Cô độc"), ("独身", "どくしん", "Độc thân")], L),
    k(4, "貧", "BẦN", 11, ["ヒン (hin)"], ["まず(しい)"], "Nghèo, bần cùng.",
      [("貧困", "ひんこん", "Nghèo đói"), ("貧しい", "まずしい", "Nghèo")], L),
    k(5, "書", "THƯ", 10, ["ショ (sho)"], ["か(く)"], "Viết, sách vở.",
      [("書きます", "かきます", "Viết"), ("辞書", "じしょ", "Từ điển")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chưa nói đến... huống chi... (nhấn mạnh mức độ nghiêm trọng): N1はおろか、N2さえ",
        "N1(khó/nhiều hơn) + はおろか、N2(dễ/ít hơn) + さえ/も + [phủ định]",
        "はおろか diễn tả 'CHƯA NÓI ĐẾN N1 (đương nhiên không làm được), NGAY CẢ N2 (điều CƠ BẢN "
        "hơn) CŨNG KHÔNG...' — luôn đi kèm PHỦ ĐỊNH, nhấn mạnh mức độ NGHIÊM TRỌNG bằng cách so sánh với một tiêu chuẩn thấp hơn hẳn.",
        [
            ex(L, 1, 1, [t("t-l4s1-1", "かんじ", "漢字", "かんじ", key=True), t("t-l4s1-2", "は"),
                         t("t-l4s1-3", "おろか", key=True), t("t-l4s1-4", "、"), t("t-l4s1-5", "ひらがな", "ひらがな", "ひらがな", key=True),
                         t("t-l4s1-6", "さえ", key=True), t("t-l4s1-7", "かけません", "書けません", "かけません")],
               "Chưa nói đến chữ Hán, ngay cả hiragana cũng không viết được."),
            ex(L, 1, 2, [t("t-l4s1-8", "せいかつ", "生活", "せいかつ"), t("t-l4s1-9", "ひ", "費", "ひ"),
                         t("t-l4s1-10", "は"), t("t-l4s1-11", "おろか", key=True), t("t-l4s1-12", "、"),
                         t("t-l4s1-13", "しょくじ", "食事", "しょくじ", key=True), t("t-l4s1-14", "だい", "代", "だい"),
                         t("t-l4s1-15", "さえ", key=True), t("t-l4s1-16", "ありません", "有りません", "ありません")],
               "Chưa nói đến chi phí sinh hoạt, ngay cả tiền ăn cũng không có."),
        ],
        tips="はおろか BẮT BUỘC đi kèm phủ định ở cuối câu — không dùng cho câu khẳng định thông thường.",
        culture="Câu chuyện vượt khó trên báo Nhật hay mở đầu bằng: '彼は貧困の中、漢字はおろか、ひらがなさえ書けなかった' (giữa cảnh nghèo đói, anh ấy từng không biết viết cả hiragana, chưa nói đến chữ Hán)."),

    slide(L, 2,
        "2. Ôn lại: をものともせず (đã học N2 bài 9) — bất chấp khó khăn khách quan",
        "N(khó khăn/trở ngại) + をものともせず、[hành động vượt qua]",
        "をものともせず (đã học ở N2 bài 9) diễn tả 'BẤT CHẤP' một khó khăn/trở ngại KHÁCH QUAN "
        "(nghèo đói, cô độc, bệnh tật) để tiếp tục hành động — mang tính CA NGỢI sự KIÊN CƯỜNG.",
        [
            ex(L, 2, 1, [t("t-l4s2-1", "ひんこん", "貧困", "ひんこん", key=True), t("t-l4s2-2", "を"),
                         t("t-l4s2-3", "ものともせず", key=True), t("t-l4s2-4", "、"), t("t-l4s2-5", "どりょく", "努力", "どりょく", key=True),
                         t("t-l4s2-6", "しました")],
               "Bất chấp nghèo đói, đã nỗ lực."),
            ex(L, 2, 2, [t("t-l4s2-7", "こどく", "孤独", "こどく", key=True), t("t-l4s2-8", "を"),
                         t("t-l4s2-9", "ものともせず", key=True), t("t-l4s2-10", "、"), t("t-l4s2-11", "がんばりました", "頑張りました", "がんばりました")],
               "Bất chấp cô độc, đã cố gắng."),
        ],
        tips="Ôn nhanh: をものともせず luôn mang sắc thái TÍCH CỰC, CA NGỢI — khác をよそに (cũng học N2 bài 9) mang sắc thái PHÊ PHÁN.",
        culture="Tiểu sử nhân vật thành công ở Nhật thường dùng をものともせず để mô tả nghị lực vượt qua hoàn cảnh xuất phát điểm khó khăn."),

    slide(L, 3,
        "3. So sánh はおろか và をものともせず",
        "はおろか: NHẤN MẠNH mức độ tệ hại (so sánh 2 tiêu chuẩn, luôn phủ định)　vs　をものともせず: CA NGỢI sự vượt qua (khẳng định, kiên cường)",
        "はおろか dùng để MIÊU TẢ một tình trạng TỆ HẠI đến mức nào (bằng cách so sánh với tiêu "
        "chuẩn thấp hơn); をものともせず dùng để CA NGỢI việc VƯỢT QUA khó khăn đó để đạt thành tựu "
        "— hai cấu trúc thường xuất hiện CÙNG NHAU trong một câu chuyện vượt khó hoàn chỉnh.",
        [
            ex(L, 3, 1, [t("t-l4s3-1", "なまえ", "名前", "なまえ", key=True), t("t-l4s3-2", "は"),
                         t("t-l4s3-3", "おろか", key=True), t("t-l4s3-4", "、"), t("t-l4s3-5", "じぶんの"),
                         t("t-l4s3-6", "ねんれい", "年齢", "ねんれい"), t("t-l4s3-7", "さえ", key=True),
                         t("t-l4s3-8", "しりません", "知りません", "しりません")],
               "Chưa nói đến tên, ngay cả tuổi của bản thân cũng không biết. (miêu tả mức độ tệ hại)"),
            ex(L, 3, 2, [t("t-l4s3-9", "そんな"), t("t-l4s3-10", "じょうきょう", "状況", "じょうきょう"), t("t-l4s3-11", "を"),
                         t("t-l4s3-12", "ものともせず", key=True), t("t-l4s3-13", "、"), t("t-l4s3-14", "せいこう", "成功", "せいこう", key=True),
                         t("t-l4s3-15", "しました")],
               "Bất chấp tình huống như vậy, đã thành công. (ca ngợi sự vượt qua)"),
        ],
        tips="Mẹo: câu MIÊU TẢ độ tệ (kèm phủ định) → はおろか; câu CA NGỢI hành động vượt qua (kèm khẳng định) → をものともせず.",
        culture="Cả hai đều là ngữ pháp N1 mang văn phong TRANG TRỌNG, thường xuất hiện trong tiểu sử, bài phát biểu truyền cảm hứng."),

    slide(L, 4,
        "4. Kết hợp trong câu chuyện vượt khó hoàn chỉnh",
        "[Khó khăn]をものともせず、努力しました。[Trước đây]はおろか、[cơ bản hơn]さえ〜なかったが、今は〜。",
        "Trong một câu chuyện VƯỢT KHÓ hoàn chỉnh, thường dùng をものともせず để mở đầu (bất chấp "
        "hoàn cảnh), rồi はおろか để nhấn XUẤT PHÁT ĐIỂM tệ hại đến mức nào, tạo nên sự tương phản "
        "mạnh mẽ với KẾT QUẢ đạt được sau này.",
        [
            ex(L, 4, 1, [t("t-l4s4-1", "ひんこん", "貧困", "ひんこん", key=True), t("t-l4s4-2", "を"),
                         t("t-l4s4-3", "ものともせず", key=True), t("t-l4s4-4", "、"), t("t-l4s4-5", "どりょく", "努力", "どりょく", key=True),
                         t("t-l4s4-6", "しました")],
               "Bất chấp nghèo đói, đã nỗ lực."),
            ex(L, 4, 2, [t("t-l4s4-7", "かんじ", "漢字", "かんじ", key=True), t("t-l4s4-8", "は"),
                         t("t-l4s4-9", "おろか", key=True), t("t-l4s4-10", "、"), t("t-l4s4-11", "ひらがな", "ひらがな", "ひらがな", key=True),
                         t("t-l4s4-12", "さえ", key=True), t("t-l4s4-13", "かけません", "書けません", "かけません"),
                         t("t-l4s4-14", "でした", "でした", "でした"), t("t-l4s4-15", "が"), t("t-l4s4-16", "、"),
                         t("t-l4s4-17", "いま", "今", "いま"), t("t-l4s4-18", "は"), t("t-l4s4-19", "ほん", "本", "ほん", key=True),
                         t("t-l4s4-20", "が"), t("t-l4s4-21", "かけます", "書けます", "かけます", key=True)],
               "Chưa nói đến chữ Hán, ngay cả hiragana cũng từng không viết được, nhưng giờ đã có thể viết sách."),
        ],
        tips="Sự TƯƠNG PHẢN giữa はおろか (quá khứ tệ hại) và kết quả hiện tại (thành công) là kỹ thuật kể chuyện kinh điển trong diễn văn truyền cảm hứng.",
        culture="Diễn văn tự truyện ở Nhật thường theo khung: nêu khó khăn (ものともせず) → nêu xuất phát điểm tệ (はおろか) → nêu thành quả hiện tại, tạo hiệu ứng cảm động mạnh cho người nghe."),
]

DIALOGUE = [
    line(L, 1, "田中", "Người dẫn chương trình",
         [t("d4-1", "あなた", "貴方", "あなた"), t("d4-2", "の"), t("d4-3", "じんせい", "人生", "じんせい", key=True),
          t("d4-4", "を"), t("d4-5", "おしえて", "教えて", "おしえて"), t("d4-6", "ください")],
         "Xin hãy kể về cuộc đời của bạn."),
    line(L, 2, "サントス", "Diễn giả",
         [t("d4-7", "こどく", "孤独", "こどく", key=True), t("d4-8", "を"), t("d4-9", "ものともせず", key=True),
          t("d4-10", "、"), t("d4-11", "どりょく", "努力", "どりょく", key=True), t("d4-12", "しました")],
         "Bất chấp cô độc, tôi đã nỗ lực."),
    line(L, 3, "田中", "Người dẫn chương trình",
         [t("d4-13", "むかし", "昔", "むかし"), t("d4-14", "は"), t("d4-15", "どんな"), t("d4-16", "せいかつ", "生活", "せいかつ", key=True),
          t("d4-17", "でしたか")],
         "Ngày xưa cuộc sống thế nào?"),
    line(L, 4, "サントス", "Diễn giả",
         [t("d4-18", "ひんこん", "貧困", "ひんこん", key=True), t("d4-19", "で"), t("d4-20", "、"),
          t("d4-21", "しょくじ", "食事", "しょくじ", key=True), t("d4-22", "だい", "代", "だい"), t("d4-23", "さえ", key=True),
          t("d4-24", "ありません", "有りません", "ありません"), t("d4-25", "でした")],
         "Vì nghèo đói, ngay cả tiền ăn cũng không có."),
    line(L, 5, "田中", "Người dẫn chương trình",
         [t("d4-26", "べんきょう", "勉強", "べんきょう"), t("d4-27", "は"), t("d4-28", "どうでしたか")],
         "Chuyện học hành thì sao?"),
    line(L, 6, "サントス", "Diễn giả",
         [t("d4-29", "かんじ", "漢字", "かんじ", key=True), t("d4-30", "は"), t("d4-31", "おろか", key=True),
          t("d4-32", "、"), t("d4-33", "ひらがな", "ひらがな", "ひらがな", key=True), t("d4-34", "さえ", key=True),
          t("d4-35", "かけません", "書けません", "かけません"), t("d4-36", "でした")],
         "Chưa nói đến chữ Hán, ngay cả hiragana cũng không viết được."),
    line(L, 7, "田中", "Người dẫn chương trình",
         [t("d4-37", "いま", "今", "いま"), t("d4-38", "は"), t("d4-39", "どうですか")],
         "Bây giờ thì thế nào?"),
    line(L, 8, "サントス", "Diễn giả",
         [t("d4-40", "きけん", "危険", "きけん", key=True), t("d4-41", "な"), t("d4-42", "けいけん", "経験", "けいけん", key=True),
          t("d4-43", "を"), t("d4-44", "ものともせず", key=True), t("d4-45", "、"), t("d4-46", "せいこう", "成功", "せいこう", key=True),
          t("d4-47", "しました")],
         "Bất chấp những kinh nghiệm nguy hiểm, tôi đã thành công."),
    line(L, 9, "田中", "Người dẫn chương trình",
         [t("d4-48", "いま", "今", "いま"), t("d4-49", "は"), t("d4-50", "ほん", "本", "ほん", key=True),
          t("d4-51", "を"), t("d4-52", "かけます", "書けます", "かけます", key=True), t("d4-53", "か")],
         "Bây giờ bạn có thể viết sách chứ?"),
    line(L, 10, "サントス", "Diễn giả",
         [t("d4-54", "はい"), t("d4-55", "。"), t("d4-56", "しっぱい", "失敗", "しっぱい", key=True), t("d4-57", "を"),
          t("d4-58", "ものともせず", key=True), t("d4-59", "、"), t("d4-60", "がんばりました", "頑張りました", "がんばりました")],
         "Vâng. Bất chấp thất bại, tôi đã cố gắng."),
]

EXERCISES = [
    q(L, 1, "「漢字はおろか、ひらがなさえ書けません」 — はおろか diễn tả điều gì?",
      ["Chưa nói đến điều khó hơn, ngay cả điều cơ bản hơn cũng không làm được (luôn kèm phủ định)",
       "Ca ngợi sự vượt qua khó khăn", "Sự khẳng định chắc chắn",
       "Sự cho phép làm việc gì đó"], 0,
      "はおろか nhấn mạnh mức độ nghiêm trọng bằng cách so sánh với một tiêu chuẩn THẤP HƠN, luôn kèm phủ định.",
      "Xem cấu trúc はおろか ở slide 1."),
    q(L, 2, "「貧困をものともせず、努力しました」 — をものともせず (đã học N2) mang sắc thái gì?",
      ["Ca ngợi sự kiên cường khi vượt qua khó khăn khách quan",
       "Phê phán việc phớt lờ khó khăn", "Sự từ chối lịch sự",
       "Sự nghi ngờ về khả năng"], 0,
      "をものともせず luôn mang sắc thái TÍCH CỰC, ca ngợi việc vượt qua khó khăn khách quan.",
      "Xem ôn tập をものともせず ở slide 2."),
    q(L, 3, "はおろか luôn đi kèm với loại câu nào?",
      ["Câu PHỦ ĐỊNH (không làm được/không có)", "Câu khẳng định thông thường",
       "Chỉ câu hỏi", "Chỉ câu mệnh lệnh"], 0,
      "はおろか BẮT BUỘC đi kèm phủ định ở cuối câu để nhấn mạnh mức độ không thể/không có.",
      "Xem lưu ý ngữ pháp ở slide 1."),
    q(L, 4, "Sự khác biệt cốt lõi giữa はおろか và をものともせず là gì?",
      ["はおろか MIÊU TẢ mức độ tệ hại (phủ định); をものともせず CA NGỢI sự vượt qua (khẳng định)",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "はおろか chỉ dùng cho câu hỏi", "をものともせず chỉ dùng cho phủ định"], 0,
      "はおろか miêu tả mức độ tệ (phủ định); をものともせず ca ngợi hành động vượt qua (khẳng định) — hai chức năng khác hẳn nhau.",
      "Xem bảng so sánh ở slide 3."),
    q(L, 5, "「名前はおろか、自分の年齢さえ知りません」 nghĩa là:",
      ["Chưa nói đến tên, ngay cả tuổi của bản thân cũng không biết",
       "Biết rất rõ tên và tuổi của mình", "Chỉ biết tên, không biết tuổi",
       "Chỉ biết tuổi, không biết tên"], 0,
      "はおろか ở đây nhấn mạnh việc KHÔNG BIẾT cả hai thứ, với tuổi (cơ bản hơn) làm chuẩn so sánh.",
      "Áp dụng cấu trúc N1はおろか、N2さえ."),
    q(L, 6, "Tại sao hai cấu trúc はおろか và をものともせず thường xuất hiện CÙNG NHAU trong một câu chuyện?",
      ["Để tạo sự TƯƠNG PHẢN mạnh giữa xuất phát điểm tệ hại và thành quả đạt được sau khi vượt khó",
       "Vì chúng có nghĩa giống hệt nhau nên dùng thay phiên", "Không có lý do đặc biệt",
       "Vì quy tắc ngữ pháp bắt buộc phải dùng chung"], 0,
      "Kết hợp cả hai tạo hiệu ứng KỂ CHUYỆN: nêu khó khăn đã vượt qua (ものともせず) và mức độ tệ hại ban đầu (はおろか) để làm nổi bật thành quả.",
      "Xem kỹ thuật kể chuyện ở slide 4."),
    q(L, 7, "「生活費はおろか、食事代さえありません」 nghĩa là:",
      ["Chưa nói đến chi phí sinh hoạt, ngay cả tiền ăn cũng không có",
       "Có đủ tiền cho cả sinh hoạt và ăn uống", "Chỉ có tiền ăn, không có tiền sinh hoạt",
       "Chỉ có tiền sinh hoạt, không có tiền ăn"], 0,
      "はおろか ở đây nhấn mạnh việc thiếu thốn nghiêm trọng: không có cả sinh hoạt phí lẫn tiền ăn (cơ bản hơn).",
      "Áp dụng cấu trúc はおろか cho ngữ cảnh tài chính."),
    q(L, 8, "Theo hội thoại, Santos đã vượt qua điều gì để nỗ lực?",
      ["Sự cô độc (孤独をものともせず)", "Sự giàu có", "Sự thành công có sẵn",
       "Không có khó khăn nào"], 0,
      "Santos nói 「孤独をものともせず、努力しました」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Trước đây Santos có viết được hiragana không?",
      ["Không, ngay cả hiragana cũng không viết được (ひらがなさえ書けませんでした)",
       "Có, viết rất giỏi", "Chỉ viết được một phần", "Không được đề cập trong hội thoại"], 0,
      "Santos nói 「漢字はおろか、ひらがなさえ書けませんでした」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Santos hiện tại có thể làm gì?",
      ["Viết sách (本を書けます)", "Không làm được gì cả", "Chỉ đọc được, không viết được",
       "Vẫn không biết chữ"], 0,
      "Santos xác nhận có thể viết sách khi được hỏi 「今は本を書けますか」.",
      "Xem câu thoại thứ 9-10."),
]

LESSON = lesson(
    L,
    "Bài 4: Coi nhẹ & Huống chi (はおろか & をものともせず)",
    "はおろか diễn tả 'CHƯA NÓI ĐẾN N1 (khó/nhiều hơn), NGAY CẢ N2 (cơ bản hơn) CŨNG KHÔNG...' — "
    "luôn kèm phủ định, dùng để MIÊU TẢ mức độ nghiêm trọng qua so sánh; ôn lại をものともせず (N2 "
    "bài 9) dùng để CA NGỢI sự vượt qua khó khăn — hai cấu trúc thường kết hợp trong câu chuyện "
    "vượt khó để tạo sự tương phản giữa xuất phát điểm tệ hại và thành quả đạt được.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
