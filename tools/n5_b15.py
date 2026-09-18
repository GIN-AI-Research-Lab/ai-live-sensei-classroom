# -*- coding: utf-8 -*-
"""N5 — Bài 15: Xin phép Vてもいいです, cấm đoán Vてはいけません, Vています trạng thái.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 15
pool = Pool("n5")

VOCAB = [
    v(1,  "つかいます", "使います", "つかいます", "tsukaimasu", "verb", "Sử dụng, dùng", "Thể từ điển: 使う. Nhóm I.", L),
    v(2,  "はいります", "入ります", "はいります", "hairimasu", "verb", "Vào, gia nhập", "Thể từ điển: 入る. Nhóm I (dù trông giống nhóm II).", L),
    v(3,  "でます", "出ます", "でます", "demasu", "verb", "Ra, rời khỏi, xuất hiện", "Thể từ điển: 出る. Nhóm II.", L),
    v(4,  "ぬぎます", "脱ぎます", "ぬぎます", "nugimasu", "verb", "Cởi (giày, áo)", "Thể từ điển: 脱ぐ. Nhóm I. Đuôi ぐ → いで.", L),
    v(5,  "すいます", "吸います", "すいます", "suimasu", "verb", "Hút (thuốc), hít vào", "Đã gặp bài 6 — nay dùng làm ví dụ điều cấm.", L),
    v(6,  "とめます", "止めます", "とめます", "tomemasu", "verb", "Dừng, đỗ (xe)", "Nhóm II. 駐車禁止 = cấm đỗ xe.", L),
    v(7,  "しゃしん", "写真", "しゃしん", "shashin", "noun", "Bức ảnh", "Đã gặp bài 6 — nay dùng làm đối tượng của điều cấm chụp ảnh.", L),
    v(8,  "でんき", "電気", "でんき", "denki", "noun", "Điện, đèn điện", "電気を 消します/つけます = tắt/bật đèn.", L),
    v(9,  "まど", "窓", "まど", "mado", "noun", "Cửa sổ", "Đã gặp bài 14.", L),
    v(10, "くつ", "靴", "くつ", "kutsu", "noun", "Giày", "靴を 脱いで ください = xin hãy cởi giày.", L),
    v(11, "としょかん", "図書館", "としょかん", "toshokan", "noun", "Thư viện", "Đã gặp bài 4 — nay dùng làm nơi có nội quy.", L),
    v(12, "きょうしつ", "教室", "きょうしつ", "kyoushitsu", "noun", "Phòng học", "Đã gặp bài 3.", L),
    v(13, "じしょ", "辞書", "じしょ", "jisho", "noun", "Từ điển", "Đã gặp bài 2 — nay dùng làm đối tượng xin phép sử dụng.", L),
    v(14, "テスト", "", "", "tesuto", "noun", "Bài kiểm tra", "テストの ときは… = trong lúc kiểm tra thì...", L),
    v(15, "おんがく", "音楽", "おんがく", "ongaku", "noun", "Âm nhạc", "Đã gặp bài 6 — nay dùng làm ví dụ điều cấm gây ồn.", L),
    v(16, "いま", "今", "いま", "ima", "noun", "Bây giờ", "Đã gặp bài 4.", L),
    v(17, "だいじょうぶ", "大丈夫", "だいじょうぶ", "daijoubu", "adjective", "Ổn, không sao", "Tính từ な. Đáp lại lời xin lỗi/đề nghị giúp đỡ.", L),
    v(18, "もちろん", "", "", "mochiron", "adverb", "Tất nhiên, dĩ nhiên", "Đáp đồng ý mạnh mẽ cho lời xin phép.", L),
    v(19, "けっこんします", "結婚します", "けっこんします", "kekkonshimasu", "verb", "Kết hôn", "Đã gặp bài 14 — nay ôn lại Vています trạng thái.", L),
    v(20, "しって", "知って", "しって", "shitte", "verb", "Biết (dạng て của 知ります)", "知っています = đã biết. Phủ định đặc biệt: 知りません (KHÔNG nói 知っていません).", L),
]

KANJI = [
    k(1, "使", "SỬ", 8, ["シ (shi)"], ["つか(う)"], "Sử dụng, sai khiến.",
      [("使います", "つかいます", "Sử dụng"), ("使用", "しよう", "Sử dụng (Hán Việt)"), ("大使館", "たいしかん", "Đại sứ quán")], L),
    k(2, "入", "NHẬP", 2, ["ニュウ (nyuu)"], ["はい(る)", "い(れる)"], "Vào, nhập.",
      [("入ります", "はいります", "Vào"), ("入学", "にゅうがく", "Nhập học"), ("輸入", "ゆにゅう", "Nhập khẩu")], L),
    k(3, "出", "XUẤT", 5, ["シュツ (shutsu)"], ["で(る)", "だ(す)"], "Ra, xuất.",
      [("出ます", "でます", "Ra, rời khỏi"), ("出口", "でぐち", "Lối ra"), ("輸出", "ゆしゅつ", "Xuất khẩu")], L),
    k(4, "電", "ĐIỆN", 13, ["デン (den)"], [], "Điện.",
      [("電気", "でんき", "Điện, đèn"), ("電話", "でんわ", "Điện thoại"), ("電車", "でんしゃ", "Tàu điện")], L),
    k(5, "写", "TẢ", 5, ["シャ (sha)"], ["うつ(す)"], "Sao chép, chụp.",
      [("写真", "しゃしん", "Bức ảnh"), ("写します", "うつします", "Sao chép/chụp"), ("複写", "ふくしゃ", "Bản sao")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Xin phép: Vて + も いいです",
        "Vて (bỏ bớt phần cuối để nối) + も + いいです",
        "Ghép も (cũng) vào ngay sau thể て để tạo nghĩa 'làm ~ cũng được' — cấu trúc xin phép "
        "chuẩn N5. Trả lời đồng ý: はい、いいです. Từ chối: すみません、ちょっと…",
        [
            ex(L, 1, 1, [t("t-l15s1-1", "ここ"), t("t-l15s1-2", "で"), t("t-l15s1-3", "しゃしん", "写真", "しゃしん"),
                         t("t-l15s1-4", "を"), t("t-l15s1-5", "とっても", "撮っても", "とっても", key=True),
                         t("t-l15s1-6", "いいです", key=True), t("t-l15s1-7", "か")],
               "Ở đây tôi chụp ảnh được không ạ?"),
            ex(L, 1, 2, [t("t-l15s1-8", "はい"), t("t-l15s1-9", "、"), t("t-l15s1-10", "いいです", key=True)],
               "Vâng, được ạ."),
            ex(L, 1, 3, [t("t-l15s1-11", "じしょ", "辞書", "じしょ"), t("t-l15s1-12", "を"),
                         t("t-l15s1-13", "つかっても", "使っても", "つかっても", key=True), t("t-l15s1-14", "いいですか")],
               "Tôi dùng từ điển được không ạ?"),
        ],
        tips="Đáp lại xin phép rất tự nhiên: もちろんです (tất nhiên rồi) hoặc どうぞ (mời anh cứ dùng).",
        culture="Ở thư viện/bảo tàng Nhật, 「写真を撮ってもいいですか」 gần như là câu bắt buộc hỏi trước khi giơ máy ảnh lên."),

    slide(L, 2,
        "2. Cấm đoán: Vては いけません",
        "Vて (bỏ bớt phần cuối để nối) + は + いけません",
        "は sau thể て nhấn mạnh sự CẤM ĐOÁN — nghĩa đen gần như 'làm ~ thì không được'. "
        "Mạnh hơn nhiều so với câu phủ định thông thường (Vません).",
        [
            ex(L, 2, 1, [t("t-l15s2-1", "としょかん", "図書館", "としょかん"), t("t-l15s2-2", "で"),
                         t("t-l15s2-3", "たばこ", "煙草", "たばこ"), t("t-l15s2-4", "を"),
                         t("t-l15s2-5", "すっては", "吸っては", "すっては", key=True), t("t-l15s2-6", "いけません", key=True)],
               "Không được hút thuốc trong thư viện."),
            ex(L, 2, 2, [t("t-l15s2-7", "テスト"), t("t-l15s2-8", "の"), t("t-l15s2-9", "とき"),
                         t("t-l15s2-10", "、"), t("t-l15s2-11", "じしょ", "辞書", "じしょ"), t("t-l15s2-12", "を"),
                         t("t-l15s2-13", "つかっては", "使っては", "つかっては", key=True), t("t-l15s2-14", "いけません", key=True)],
               "Lúc kiểm tra không được dùng từ điển."),
        ],
        tips="Vてはいけません khá mạnh — trong giao tiếp hằng ngày người Nhật hay nói giảm bằng ちょっと… thay vì cấm thẳng.",
        culture="Biển 駐車禁止 (cấm đỗ xe) và 撮影禁止 (cấm chụp ảnh) đều là cách viết TRANG TRỌNG của cùng ý nghĩa てはいけません."),

    slide(L, 3,
        "3. Yêu cầu trước khi vào: Vてから、V",
        "Vて + から、+ [hành động tiếp theo]",
        "から sau thể て nghĩa là 'sau khi làm xong ~'— khác hẳn から chỉ lý do đã học ở bài 9. "
        "Diễn tả thứ tự bắt buộc: phải làm xong việc A rồi mới đến việc B.",
        [
            ex(L, 3, 1, [t("t-l15s3-1", "くつ", "靴", "くつ"), t("t-l15s3-2", "を"),
                         t("t-l15s3-3", "ぬいで", "脱いで", "ぬいで", key=True), t("t-l15s3-4", "から", key=True),
                         t("t-l15s3-5", "、"), t("t-l15s3-6", "はいって", "入って", "はいって"),
                         t("t-l15s3-7", "ください")],
               "Xin hãy cởi giày ra rồi mới vào."),
            ex(L, 3, 2, [t("t-l15s3-8", "でんき", "電気", "でんき"), t("t-l15s3-9", "を"),
                         t("t-l15s3-10", "けして", "消して", "けして", key=True), t("t-l15s3-11", "から", key=True),
                         t("t-l15s3-12", "、"), t("t-l15s3-13", "でて", "出て", "でて"), t("t-l15s3-14", "ください")],
               "Xin hãy tắt đèn rồi mới ra ngoài."),
        ],
        tips="から sau て (thứ tự hành động) và から sau です/ます (lý do, bài 9) là HAI chức năng khác nhau — phân biệt bằng vị trí trong câu.",
        culture="Cởi giày trước khi vào nhà (靴を脱いでから 入ります) là quy tắc bất di bất dịch trong văn hóa Nhật."),

    slide(L, 4,
        "4. Vています — trạng thái kết quả và nghề nghiệp",
        "Vています   (không phải 'đang làm' mà là 'đã ở trạng thái đó')",
        "Ôn và mở rộng từ bài 14: với một số động từ, ています không diễn tả HÀNH ĐỘNG đang xảy ra "
        "mà diễn tả TRẠNG THÁI đã hình thành sau một sự kiện — biết, kết hôn, làm nghề gì.",
        [
            ex(L, 4, 1, [t("t-l15s4-1", "やまださん", "山田さん", "やまださん"), t("t-l15s4-2", "を"),
                         t("t-l15s4-3", "しって", "知って", "しって", key=True), t("t-l15s4-4", "います", "居ます", "います")],
               "Tôi biết anh Yamada."),
            ex(L, 4, 2, [t("t-l15s4-5", "やまださん", "山田さん", "やまださん"), t("t-l15s4-6", "を"),
                         t("t-l15s4-7", "しりません", "知りません", "しりません", key=True)],
               "Tôi không biết anh Yamada. (KHÔNG nói 知っていません — đây là ngoại lệ đặc biệt)"),
            ex(L, 4, 3, [t("t-l15s4-8", "いもうと", "妹", "いもうと"), t("t-l15s4-9", "は"),
                         t("t-l15s4-10", "ぎんこう", "銀行", "ぎんこう"), t("t-l15s4-11", "に"),
                         t("t-l15s4-12", "つとめて", "勤めて", "つとめて"), t("t-l15s4-13", "います", "居ます", "います")],
               "Em gái tôi làm việc ở ngân hàng."),
        ],
        tips="知る là ngoại lệ NGƯỢC: phủ định KHÔNG dùng 知っていません mà dùng thẳng 知りません.",
        culture="Câu hỏi xã giao ◯◯さんを知っていますか rất phổ biến để hỏi có quen biết ai đó không."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d-l15-1", "せんせい", "先生", "せんせい"), t("d-l15-2", "、"), t("d-l15-3", "テスト"),
          t("d-l15-4", "の"), t("d-l15-5", "とき"), t("d-l15-6", "、"), t("d-l15-7", "じしょ", "辞書", "じしょ", key=True),
          t("d-l15-8", "を"), t("d-l15-9", "つかっても", "使っても", "つかっても", key=True), t("d-l15-10", "いいですか")],
         "Thầy ơi, khi kiểm tra em dùng từ điển được không ạ?"),
    line(L, 2, "先生", "Giáo viên",
         [t("d-l15-11", "いいえ"), t("d-l15-12", "、"), t("d-l15-13", "つかっては", "使っては", "つかっては", key=True),
          t("d-l15-14", "いけません", key=True)],
         "Không, không được dùng."),
    line(L, 3, "ワン", "Sinh viên",
         [t("d-l15-15", "わかりました", "分かりました", "わかりました"), t("d-l15-16", "。"), t("d-l15-17", "でも"),
          t("d-l15-18", "、"), t("d-l15-19", "まど", "窓", "まど"), t("d-l15-20", "を"),
          t("d-l15-21", "あけても", "開けても", "あけても", key=True), t("d-l15-22", "いいですか")],
         "Em hiểu rồi ạ. Nhưng em mở cửa sổ được không ạ?"),
    line(L, 4, "先生", "Giáo viên",
         [t("d-l15-23", "ええ"), t("d-l15-24", "、"), t("d-l15-25", "いいです", key=True), t("d-l15-26", "よ")],
         "Ừ, được đấy."),
    line(L, 5, "ワン", "Sinh viên",
         [t("d-l15-27", "きょうしつ", "教室", "きょうしつ"), t("d-l15-28", "に"), t("d-l15-29", "はいる", "入る", "はいる"),
          t("d-l15-30", "とき"), t("d-l15-31", "、"), t("d-l15-32", "くつ", "靴", "くつ", key=True), t("d-l15-33", "を"),
          t("d-l15-34", "ぬいで", "脱いで", "ぬいで", key=True), t("d-l15-35", "から", key=True),
          t("d-l15-36", "、"), t("d-l15-37", "はいりますか", "入りますか", "はいりますか")],
         "Khi vào phòng học có phải cởi giày ra rồi mới vào không ạ?"),
    line(L, 6, "先生", "Giáo viên",
         [t("d-l15-38", "いいえ"), t("d-l15-39", "、"), t("d-l15-40", "だいじょうぶ", "大丈夫", "だいじょうぶ", key=True),
          t("d-l15-41", "です"), t("d-l15-42", "。"), t("d-l15-43", "くつ", "靴", "くつ"), t("d-l15-44", "の"),
          t("d-l15-45", "まま"), t("d-l15-46", "でも"), t("d-l15-47", "いいです", key=True)],
         "Không, không sao đâu. Cứ để nguyên giày cũng được."),
    line(L, 7, "ワン", "Sinh viên",
         [t("d-l15-48", "そうですか"), t("d-l15-49", "。"), t("d-l15-50", "せんせい", "先生", "せんせい"),
          t("d-l15-51", "は"), t("d-l15-52", "けっこん", "結婚", "けっこん", key=True), t("d-l15-53", "して", key=True),
          t("d-l15-54", "います", "居ます", "います"), t("d-l15-55", "か")],
         "Ra vậy. Thầy đã kết hôn chưa ạ?"),
    line(L, 8, "先生", "Giáo viên",
         [t("d-l15-56", "はい"), t("d-l15-57", "、"), t("d-l15-58", "けっこん", "結婚", "けっこん"),
          t("d-l15-59", "して", key=True), t("d-l15-60", "います", "居ます", "います")],
         "Rồi, thầy đã kết hôn rồi."),
    line(L, 9, "ワン", "Sinh viên",
         [t("d-l15-61", "おくさん", "奥さん", "おくさん"), t("d-l15-62", "を"), t("d-l15-63", "しって", "知って", "しって", key=True),
          t("d-l15-64", "います", "居ます", "居ます"), t("d-l15-65", "か")],
         "Em có biết vợ thầy không?"),
    line(L, 10, "先生", "Giáo viên",
         [t("d-l15-66", "いいえ"), t("d-l15-67", "、"), t("d-l15-68", "しりません", "知りません", "しりません", key=True),
          t("d-l15-69", "ね")],
         "Ơ, sao em lại hỏi thầy vậy nhỉ."),
]

EXERCISES = [
    q(L, 1, "「写真を 撮っても いいですか」 dùng để làm gì?",
      ["Xin phép chụp ảnh", "Ra lệnh chụp ảnh",
       "Cấm chụp ảnh", "Hỏi đã chụp ảnh chưa"], 0,
      "Vてもいいですか là cấu trúc XIN PHÉP — hỏi 'làm ~ có được không'.",
      "Xem cấu trúc てもいい."),
    q(L, 2, "「たばこを 吸っては いけません」 nghĩa là:",
      ["Không được hút thuốc", "Có thể hút thuốc",
       "Đã hút thuốc rồi", "Muốn hút thuốc"], 0,
      "Vてはいけません là cấu trúc CẤM ĐOÁN mạnh — 'làm ~ thì không được'.",
      "So sánh với てもいい (cho phép) ở câu 1."),
    q(L, 3, "「靴を 脱いでから、入ります」 — から ở đây có nghĩa gì?",
      ["Sau khi làm xong việc trước (thứ tự hành động)", "Vì, bởi vì (lý do)",
       "Từ (điểm bắt đầu không gian)", "Không có nghĩa gì đặc biệt"], 0,
      "から sau thể て diễn tả THỨ TỰ hành động ('sau khi'), khác hẳn から chỉ lý do đã học ở bài 9.",
      "So sánh với から chỉ lý do đã học ở bài 9."),
    q(L, 4, "Phủ định của 知っています (biết) là:",
      ["知りません", "知っていません", "知りませんでした", "知らないです"], 0,
      "知る là động từ ngoại lệ: phủ định trạng thái 'biết' dùng thẳng 知りません, KHÔNG chia từ ています.",
      "Đây là ngoại lệ đặc biệt đã nêu ở slide 4."),
    q(L, 5, "「結婚しています」 diễn tả điều gì?",
      ["Trạng thái ĐÃ kết hôn (hiện tại)", "Đang trong lễ cưới",
       "Sắp kết hôn", "Đã ly hôn"], 0,
      "結婚する là động từ tức thời — ています diễn tả TRẠNG THÁI đã hình thành sau khi hành động xảy ra, không phải hành động đang lặp lại.",
      "So sánh với Vています của hành động thường (đang ăn, đang đọc)."),
    q(L, 6, "Đáp lại lời xin phép một cách đồng ý mạnh mẽ, dùng từ nào?",
      ["もちろん", "だいじょうぶ", "いけません", "ちょっと"], 0,
      "もちろん (tất nhiên) là cách đáp đồng ý dứt khoát, mạnh hơn cả はい、いいです.",
      "Xem nghĩa của từ này ở phần từ vựng."),
    q(L, 7, "Câu nào ĐÚNG khi muốn nói 'ở đây không được hút thuốc'?",
      ["ここで 吸っては いけません", "ここで 吸っても いいです",
       "ここで 吸います", "ここで 吸いません でした"], 0,
      "Cấm đoán dùng cấu trúc てはいけません, không phải phủ định thường ません hay quá khứ.",
      "Xem lại cấu trúc cấm đoán ở slide 2."),
    q(L, 8, "「窓を 開けても いいですか」 「ええ、いいですよ」 — よ ở cuối câu đáp có vai trò gì?",
      ["Thêm sắc thái thân thiện, khẳng định nhẹ nhàng", "Biến câu thành câu hỏi",
       "Phủ định câu trước đó", "Bắt buộc phải có, thiếu thì sai ngữ pháp"], 0,
      "よ là trợ từ cuối câu thêm sắc thái, không bắt buộc về ngữ pháp — chỉ làm câu trả lời thân thiện hơn.",
      "So sánh câu có よ và không có よ."),
    q(L, 9, "Trong hội thoại, thầy giáo có cho học sinh dùng từ điển khi kiểm tra không?",
      ["Không, thầy cấm dùng từ điển", "Có, thầy cho dùng thoải mái",
       "Thầy không trả lời", "Chỉ cho dùng nửa thời gian"], 0,
      "Thầy trả lời rõ ràng 「使っては いけません」 ngay từ câu thoại thứ 2.",
      "Xem câu thoại đầu tiên của thầy giáo."),
    q(L, 10, "Trong hội thoại, học sinh có phải cởi giày khi vào lớp không?",
      ["Không, để nguyên giày cũng được", "Có, bắt buộc phải cởi giày",
       "Chỉ cởi một chiếc", "Thầy không trả lời câu này"], 0,
      "Thầy trả lời 「大丈夫です。靴のままでも いいです」.",
      "Xem câu thoại thứ 6 của thầy giáo."),
]

LESSON = lesson(
    L,
    "Bài 15: Xin phép & Cấm đoán (Vてもいいです / Vてはいけません / Vています)",
    "Xin phép bằng Vてもいいですか, cấm đoán bằng Vてはいけません, thứ tự hành động bằng Vてから "
    "(khác から chỉ lý do ở bài 9), và mở rộng Vています sang trạng thái kết quả/nghề nghiệp/hôn "
    "nhân, cùng ngoại lệ phủ định của 知る.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
