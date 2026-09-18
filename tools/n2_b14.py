# -*- coding: utf-8 -*-
"""N2 — Bai 14: Kho long ma lam duoc がたい (khach quan, nhan thuc/cam xuc) va on lai かねる (N2 b3).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n2.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n2_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 14
pool = Pool("n2")

VOCAB = [
    v(1,  "ゆるします", "許します", "ゆるします", "yurushimasu", "verb", "Tha thứ", "失敗を 許します = tha thứ cho thất bại.", L),
    v(2,  "りかいします", "理解します", "りかいします", "rikai shimasu", "verb", "Hiểu, thấu hiểu", "気持ちを 理解します = thấu hiểu cảm xúc.", L),
    v(3,  "がまんします", "我慢します", "がまんします", "gaman shimasu", "verb", "Nhịn, chịu đựng", "痛みを 我慢します = chịu đựng cơn đau.", L),
    v(4,  "みとめます", "認めます", "みとめます", "mitomemasu", "verb", "Công nhận", "誤りを 認めます = công nhận sai lầm.", L),
    v(5,  "しんじます", "信じます", "しんじます", "shinjimasu", "verb", "Tin tưởng", "Đã gặp N5 bài 21.", L),
    v(6,  "わすれます", "忘れます", "わすれます", "wasuremasu", "verb", "Quên", "Đã gặp N4 bài 38.", L),
    v(7,  "かねます", "かねます", "かねます", "kanemasu", "expression", "Khó có thể (từ chối lịch sự)", "Đã gặp N2 bài 3.", L),
    v(8,  "ようきゅう", "要求", "ようきゅう", "youkyuu", "noun", "Yêu cầu", "Đã gặp N2 bài 3.", L),
    v(9,  "せつめいします", "説明します", "せつめいします", "setsumei shimasu", "verb", "Giải thích", "Đã gặp N4 bài 26.", L),
    v(10, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N5 bài 22.", L),
    v(11, "じじつ", "事実", "じじつ", "jijitsu", "noun", "Sự thật", "Đã gặp N2 bài 10.", L),
    v(12, "けいけん", "経験", "けいけん", "keiken", "noun", "Kinh nghiệm", "Đã gặp N4 bài 26.", L),
    v(13, "たいど", "態度", "たいど", "taido", "noun", "Thái độ", "Đã gặp N3 bài 5.", L),
    v(14, "しんぱい", "心配", "しんぱい", "shinpai", "noun", "Sự lo lắng", "Đã gặp N4 bài 26.", L),
    v(15, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N4 bài 26.", L),
    v(16, "きゃく", "客", "きゃく", "kyaku", "noun", "Khách hàng", "Đã gặp N4 bài 41.", L),
    v(17, "しっぱいします", "失敗します", "しっぱいします", "shippai shimasu", "verb", "Thất bại", "Đã gặp N4 bài 43.", L),
    v(18, "じこ", "事故", "じこ", "jiko", "noun", "Tai nạn", "Đã gặp N4 bài 34.", L),
    v(19, "けっか", "結果", "けっか", "kekka", "noun", "Kết quả", "Đã gặp N4 bài 39.", L),
    v(20, "こと", "事", "こと", "koto", "noun", "Việc, sự việc", "Đã gặp N4 bài 26.", L),
]

KANJI = [
    k(1, "許", "HỨA", 11, ["キョ (kyo)"], ["ゆる(す)"], "Cho phép, tha thứ.",
      [("許します", "ゆるします", "Tha thứ"), ("許可", "きょか", "Cho phép")], L),
    k(2, "慢", "MẠN", 14, ["マン (man)"], [], "Kiêu mạn, chậm chạp.",
      [("我慢", "がまん", "Nhịn, chịu đựng"), ("自慢", "じまん", "Tự hào, khoe khoang")], L),
    k(3, "我", "NGÃ", 7, ["ガ (ga)"], ["われ"], "Ta, bản ngã.",
      [("我慢", "がまん", "Chịu đựng"), ("我々", "われわれ", "Chúng ta")], L),
    k(4, "認", "NHẬN", 14, ["ニン (nin)"], ["みと(める)"], "Nhận biết, công nhận.",
      [("認めます", "みとめます", "Công nhận"), ("確認", "かくにん", "Xác nhận")], L),
    k(5, "忘", "VONG", 7, ["ボウ (bou)"], ["わす(れる)"], "Quên.",
      [("忘れます", "わすれます", "Quên"), ("忘れ物", "わすれもの", "Đồ bỏ quên")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Khó lòng làm được (khách quan, nhận thức/cảm xúc): V-stem + がたい",
        "V-ます-stem + がたい",
        "がたい gắn sau V-stem diễn tả việc KHÓ LÒNG mà thực hiện được hành động đó — mang tính "
        "KHÁCH QUAN về độ khó (không phải do năng lực cá nhân), thường đi với động từ CẢM XÚC/NHẬN THỨC (信じる, 理解する, 許す, 忘れる).",
        [
            ex(L, 1, 1, [t("t-l14s1-1", "その"), t("t-l14s1-2", "はなし", "話", "はなし"), t("t-l14s1-3", "は"),
                         t("t-l14s1-4", "しんじ", "信じ", "しんじ", key=True), t("t-l14s1-5", "がたい", key=True),
                         t("t-l14s1-6", "です")],
               "Câu chuyện đó khó mà tin được."),
            ex(L, 1, 2, [t("t-l14s1-7", "かれ", "彼", "かれ"), t("t-l14s1-8", "の"), t("t-l14s1-9", "たいど", "態度", "たいど", key=True),
                         t("t-l14s1-10", "は"), t("t-l14s1-11", "りかい", "理解", "りかい", key=True), t("t-l14s1-12", "し"),
                         t("t-l14s1-13", "がたい", key=True), t("t-l14s1-14", "です")],
               "Thái độ của anh ấy khó mà hiểu được."),
        ],
        tips="がたい KHÔNG dùng cho hành động vật lý thông thường (không nói '持ちがたい' - khó cầm) — chỉ dùng cho động từ CẢM XÚC/NHẬN THỨC.",
        culture="Câu cảm thán quen thuộc trong tiếng Nhật: '信じがたいことが起きた' (một điều khó tin đã xảy ra) — hay dùng khi kể về tin tức bất ngờ."),

    slide(L, 2,
        "2. Ôn lại: かねる (đã học N2 bài 3) — từ chối lịch sự một hành động cụ thể",
        "V-ます-stem + かねる",
        "かねる (đã học ở bài 3) diễn tả 'KHÓ CÓ THỂ' làm gì đó — TRANG TRỌNG, LỊCH SỰ, thường "
        "dùng để TỪ CHỐI một YÊU CẦU/HÀNH ĐỘNG CỤ THỂ trong công việc, dịch vụ khách hàng.",
        [
            ex(L, 2, 1, [t("t-l14s2-1", "その"), t("t-l14s2-2", "ようきゅう", "要求", "ようきゅう", key=True), t("t-l14s2-3", "には"),
                         t("t-l14s2-4", "こたえ", "答え", "こたえ", key=True), t("t-l14s2-5", "かねます", key=True)],
               "Chúng tôi khó có thể đáp lại yêu cầu đó."),
            ex(L, 2, 2, [t("t-l14s2-6", "わたし", "私", "わたし"), t("t-l14s2-7", "には"), t("t-l14s2-8", "みとめ", "認め", "みとめ", key=True),
                         t("t-l14s2-9", "かねます", key=True)],
               "Tôi khó có thể công nhận điều đó."),
        ],
        tips="かねる luôn gắn với một HÀNH ĐỘNG CỤ THỂ mà người nói CHỦ ĐỘNG từ chối thực hiện — khác がたい là cảm nhận KHÁCH QUAN về độ khó của nhận thức.",
        culture="Nhân viên dịch vụ khách hàng Nhật hay dùng: 'そのご要求にはお応えしかねます' (chúng tôi khó có thể đáp ứng yêu cầu đó của quý khách)."),

    slide(L, 3,
        "3. So sánh がたい và かねる",
        "がたい: KHÁCH QUAN, độ khó của việc TIN/HIỂU/CẢM NHẬN　vs　かねる: CHỦ QUAN, từ chối một HÀNH ĐỘNG cụ thể",
        "がたい dùng cho ĐỘ KHÓ KHÁCH QUAN của việc CẢM NHẬN/TIN TƯỞNG/HIỂU một điều gì đó (không "
        "phải hành động thực hiện được hay không); かねる dùng khi người nói CHỦ ĐỘNG từ chối thực "
        "hiện một HÀNH ĐỘNG/YÊU CẦU cụ thể một cách lịch sự.",
        [
            ex(L, 3, 1, [t("t-l14s3-1", "その"), t("t-l14s3-2", "じじつ", "事実", "じじつ", key=True), t("t-l14s3-3", "は"),
                         t("t-l14s3-4", "しんじ", "信じ", "しんじ", key=True), t("t-l14s3-5", "がたい", key=True),
                         t("t-l14s3-6", "です")],
               "Sự thật đó khó mà tin được. (về nhận thức, khách quan)"),
            ex(L, 3, 2, [t("t-l14s3-7", "その"), t("t-l14s3-8", "ようきゅう", "要求", "ようきゅう", key=True), t("t-l14s3-9", "には"),
                         t("t-l14s3-10", "こたえ", "答え", "こたえ", key=True), t("t-l14s3-11", "かねます", key=True)],
               "Chúng tôi khó có thể đáp lại yêu cầu đó. (từ chối hành động, chủ động)"),
        ],
        tips="Mẹo: nếu câu nói về việc TIN/HIỂU/CHẤP NHẬN một điều trừu tượng → がたい; nếu câu TỪ CHỐI làm một việc cụ thể theo yêu cầu → かねる.",
        culture="Cả hai đều là ngữ pháp N2 trọng điểm — nhầm lẫn giữa chúng là lỗi phổ biến của người học vì cùng dịch là 'khó có thể'."),

    slide(L, 4,
        "4. Cụm từ cố định phổ biến với がたい",
        "信じがたい／許しがたい／理解しがたい／忘れがたい",
        "がたい tạo thành nhiều CỤM TỪ CỐ ĐỊNH cực kỳ thông dụng trong văn viết và hội thoại trang "
        "trọng: 信じがたい (khó tin), 許しがたい (khó tha thứ), 理解しがたい (khó hiểu), 忘れがたい (khó quên).",
        [
            ex(L, 4, 1, [t("t-l14s4-1", "かれ", "彼", "かれ"), t("t-l14s4-2", "の"), t("t-l14s4-3", "しっぱい", "失敗", "しっぱい", key=True),
                         t("t-l14s4-4", "は"), t("t-l14s4-5", "ゆるし", "許し", "ゆるし", key=True), t("t-l14s4-6", "がたい", key=True),
                         t("t-l14s4-7", "です")],
               "Thất bại của anh ấy khó mà tha thứ được."),
            ex(L, 4, 2, [t("t-l14s4-8", "あの"), t("t-l14s4-9", "けいけん", "経験", "けいけん", key=True), t("t-l14s4-10", "は"),
                         t("t-l14s4-11", "わすれ", "忘れ", "わすれ", key=True), t("t-l14s4-12", "がたい", key=True),
                         t("t-l14s4-13", "です")],
               "Kinh nghiệm đó khó mà quên được."),
        ],
        tips="Bốn cụm từ này (信じがたい/許しがたい/理解しがたい/忘れがたい) nên học THUỘC LÒNG như một khối, vì chúng xuất hiện rất thường xuyên trong đề thi N2.",
        culture="Bài phát biểu cảm ơn ở Nhật hay kết thúc bằng: '皆様のご支援は忘れがたいものです' (sự hỗ trợ của quý vị là điều khó mà quên được)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d14-1", "あの"), t("d14-2", "じこ", "事故", "じこ", key=True), t("d14-3", "の"), t("d14-4", "はなし", "話", "はなし"),
          t("d14-5", "を"), t("d14-6", "ききました", "聞きました", "ききました"), t("d14-7", "か")],
         "Bạn có nghe chuyện về tai nạn đó chưa?"),
    line(L, 2, "サントス", "Đồng nghiệp",
         [t("d14-8", "はい"), t("d14-9", "。"), t("d14-10", "その"), t("d14-11", "けっか", "結果", "けっか", key=True),
          t("d14-12", "は"), t("d14-13", "しんじ", "信じ", "しんじ", key=True), t("d14-14", "がたい", key=True),
          t("d14-15", "です")],
         "Vâng. Kết quả đó khó mà tin được."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d14-16", "きゃく", "客", "きゃく", key=True), t("d14-17", "の"), t("d14-18", "ようきゅう", "要求", "ようきゅう", key=True),
          t("d14-19", "は"), t("d14-20", "どうでしたか")],
         "Yêu cầu của khách hàng thế nào?"),
    line(L, 4, "サントス", "Đồng nghiệp",
         [t("d14-21", "その"), t("d14-22", "ようきゅう", "要求", "ようきゅう", key=True), t("d14-23", "には"),
          t("d14-24", "こたえ", "答え", "こたえ", key=True), t("d14-25", "かねます", key=True)],
         "Chúng tôi khó có thể đáp lại yêu cầu đó."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d14-26", "かれ", "彼", "かれ"), t("d14-27", "の"), t("d14-28", "たいど", "態度", "たいど", key=True), t("d14-29", "は"),
          t("d14-30", "りかい", "理解", "りかい", key=True), t("d14-31", "し"), t("d14-32", "がたい", key=True),
          t("d14-33", "です", "です", "です"), t("d14-34", "ね")],
         "Thái độ của anh ấy khó mà hiểu được nhỉ."),
    line(L, 6, "サントス", "Đồng nghiệp",
         [t("d14-35", "はい"), t("d14-36", "。"), t("d14-37", "かれ", "彼", "かれ"), t("d14-38", "の"),
          t("d14-39", "しっぱい", "失敗", "しっぱい", key=True), t("d14-40", "は"), t("d14-41", "ゆるし", "許し", "ゆるし", key=True),
          t("d14-42", "がたい", key=True), t("d14-43", "です")],
         "Vâng. Thất bại của anh ấy khó mà tha thứ được."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d14-44", "でも"), t("d14-45", "、"), t("d14-46", "もんだい", "問題", "もんだい", key=True), t("d14-47", "を"),
          t("d14-48", "みとめました", "認めました", "みとめました"), t("d14-49", "か")],
         "Nhưng, anh ấy đã công nhận vấn đề chưa?"),
    line(L, 8, "サントス", "Đồng nghiệp",
         [t("d14-50", "はい"), t("d14-51", "。"), t("d14-52", "せつめい", "説明", "せつめい", key=True), t("d14-53", "して", key=True),
          t("d14-54", "、"), t("d14-55", "もんだい", "問題", "もんだい", key=True), t("d14-56", "を"),
          t("d14-57", "みとめました", "認めました", "みとめました")],
         "Vâng. Đã giải thích và công nhận vấn đề."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d14-58", "しんぱい", "心配", "しんぱい", key=True), t("d14-59", "しない", key=True), t("d14-60", "で", key=True),
          t("d14-61", "。"), t("d14-62", "がまん", "我慢", "がまん", key=True), t("d14-63", "して", key=True),
          t("d14-64", "ください")],
         "Đừng lo lắng. Hãy cố nhịn nhé."),
    line(L, 10, "サントス", "Đồng nghiệp",
         [t("d14-65", "はい"), t("d14-66", "。"), t("d14-67", "あの"), t("d14-68", "けいけん", "経験", "けいけん", key=True),
          t("d14-69", "は"), t("d14-70", "わすれ", "忘れ", "わすれ", key=True), t("d14-71", "がたい", key=True),
          t("d14-72", "です", "です", "です"), t("d14-73", "が"), t("d14-74", "、"), t("d14-75", "がんばります", "頑張ります", "がんばります")],
         "Vâng. Kinh nghiệm đó khó mà quên được, nhưng tôi sẽ cố gắng."),
]

EXERCISES = [
    q(L, 1, "「その話は信じがたいです」 — がたい diễn tả điều gì?",
      ["Độ khó khách quan của việc tin/hiểu/cảm nhận một điều gì đó",
       "Sự từ chối lịch sự một hành động cụ thể", "Sự khẳng định chắc chắn",
       "Sự cho phép làm việc gì đó"], 0,
      "がたい diễn tả độ khó KHÁCH QUAN của việc tin tưởng/hiểu/chấp nhận, không liên quan đến năng lực hành động.",
      "Xem cấu trúc がたい ở slide 1."),
    q(L, 2, "「その要求には答えかねます」 — かねる (đã học bài 3) khác がたい ở điểm nào?",
      ["かねる là sự từ chối CHỦ ĐỘNG một hành động/yêu cầu cụ thể; がたい là độ khó KHÁCH QUAN của nhận thức",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "かねる chỉ dùng cho câu hỏi", "がたい chỉ dùng cho phủ định"], 0,
      "かねる gắn với hành động cụ thể mà người nói chủ động từ chối; がたい gắn với cảm nhận/nhận thức khách quan.",
      "Xem so sánh ở slide 3."),
    q(L, 3, "がたい thường đi với loại động từ nào?",
      ["Động từ CẢM XÚC/NHẬN THỨC (信じる, 理解する, 許す, 忘れる)",
       "Động từ hành động vật lý thông thường (持つ, 歩く)", "Chỉ động từ chuyển động",
       "Chỉ động từ ăn uống"], 0,
      "がたい thường gắn với động từ chỉ CẢM XÚC/NHẬN THỨC, không dùng cho hành động vật lý thông thường.",
      "Xem lưu ý ngữ pháp ở slide 1."),
    q(L, 4, "「彼の失敗は許しがたいです」 nghĩa là:",
      ["Thất bại của anh ấy khó mà tha thứ được", "Thất bại của anh ấy đã được tha thứ hoàn toàn",
       "Anh ấy chưa từng thất bại", "Anh ấy đã tha thứ cho người khác"], 0,
      "許しがたい là cụm cố định nghĩa 'khó mà tha thứ được' — がたい gắn sau V-stem của 許す.",
      "Áp dụng cấu trúc がたい cho động từ 許す."),
    q(L, 5, "Bốn cụm từ cố định phổ biến với がたい là gì?",
      ["信じがたい, 許しがたい, 理解しがたい, 忘れがたい", "食べがたい, 飲みがたい, 歩きがたい, 走りがたい",
       "高いがたい, 安いがたい, 大きいがたい, 小さいがたい", "行きがたい, 来がたい, 帰りがたい, 出がたい"], 0,
      "Bốn cụm từ 信じがたい/許しがたい/理解しがたい/忘れがたい là những cụm cố định phổ biến nhất với がたい.",
      "Xem danh sách cụm từ ở slide 4."),
    q(L, 6, "「彼の態度は理解しがたいです」 nghĩa là:",
      ["Thái độ của anh ấy khó mà hiểu được", "Thái độ của anh ấy rất dễ hiểu",
       "Anh ấy không có thái độ gì đặc biệt", "Mọi người đều hiểu thái độ của anh ấy"], 0,
      "理解しがたい là cụm cố định nghĩa 'khó mà hiểu được' — がたい gắn sau V-stem của 理解する.",
      "Áp dụng cấu trúc がたい cho động từ 理解する."),
    q(L, 7, "Có thể nói '荷物を持ちがたいです' (khó mà cầm hành lý được) một cách tự nhiên không?",
      ["Không tự nhiên, vì がたい không dùng cho hành động vật lý thông thường như 持つ",
       "Có, hoàn toàn tự nhiên và đúng ngữ pháp", "Chỉ đúng trong văn viết trang trọng",
       "Chỉ đúng khi nói về hành lý nặng"], 0,
      "がたい giới hạn ở động từ CẢM XÚC/NHẬN THỨC — dùng cho hành động vật lý như 持つ nghe không tự nhiên.",
      "Xem lưu ý quan trọng ở slide 1."),
    q(L, 8, "Theo hội thoại, Santos nghĩ gì về kết quả của tai nạn?",
      ["Khó mà tin được (信じがたいです)", "Rất dễ tin", "Không có ý kiến gì",
       "Đã biết trước kết quả đó"], 0,
      "Santos nói 「その結果は信じがたいです」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Santos có đáp ứng được yêu cầu của khách hàng không?",
      ["Không, khó có thể đáp lại (その要求には答えかねます)", "Có, đáp ứng ngay lập tức",
       "Chưa xác định được", "Không được đề cập trong hội thoại"], 0,
      "Santos nói 「その要求には答えかねます」.",
      "Xem câu thoại thứ 4."),
    q(L, 10, "田中 khuyên Santos điều gì ở cuối hội thoại?",
      ["Đừng lo lắng, hãy cố nhịn (心配しないで。我慢してください)",
       "Nên từ bỏ công việc", "Nên phàn nàn với cấp trên", "Không đưa ra lời khuyên nào"], 0,
      "田中 nói 「心配しないで。我慢してください」.",
      "Xem câu thoại thứ 9."),
]

LESSON = lesson(
    L,
    "Bài 14: Khó lòng mà làm được (がたい & かねる)",
    "がたい gắn sau V-stem diễn tả độ khó KHÁCH QUAN của việc TIN/HIỂU/CHẤP NHẬN một điều gì đó "
    "(thường đi với động từ cảm xúc/nhận thức: 信じる, 理解する, 許す, 忘れる); ôn lại かねる (đã "
    "học bài 3) là sự từ chối CHỦ ĐỘNG, lịch sự một hành động/yêu cầu cụ thể; bốn cụm cố định cần "
    "nhớ: 信じがたい/許しがたい/理解しがたい/忘れがたい.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
