# -*- coding: utf-8 -*-
"""N1 — Bai 8: Nguyen cau tha thiet — Vてやまない (mai khong nguoi, cam xuc manh
liet keo dai khong ngung — chi dung voi dong tu chi CAM XUC) va 願ってやまない
(tha thiet cau mong rang... — cum co dinh hay dat cuoi bai phat bieu trang trong).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 8
pool = Pool("n1")

VOCAB = [
    v(1,  "かんしゃします", "感謝します", "かんしゃします", "kansha shimasu", "verb", "Cảm ơn, biết ơn", "感謝してやまない = biết ơn mãi không thôi.", L),
    v(2,  "そんけいします", "尊敬します", "そんけいします", "sonkei shimasu", "verb", "Kính trọng", "尊敬してやまない = kính trọng mãi không thôi.", L),
    v(3,  "あいします", "愛します", "あいします", "ai shimasu", "verb", "Yêu, yêu quý", "愛してやまない = yêu mãi không thôi.", L),
    v(4,  "ねがいます", "願います", "ねがいます", "negaimasu", "verb", "Cầu mong, nguyện cầu", "願ってやまない = tha thiết cầu mong.", L),
    v(5,  "そつぎょう", "卒業", "そつぎょう", "sotsugyou", "noun", "Tốt nghiệp", "卒業しても = dù đã tốt nghiệp.", L),
    v(6,  "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "Đã gặp N5 bài 1.", L),
    v(7,  "おしえます", "教えます", "おしえます", "oshiemasu", "verb", "Dạy", "Đã gặp N5 bài 7.", L),
    v(8,  "けんこう", "健康", "けんこう", "kenkou", "noun", "Sức khỏe", "Đã gặp N4 bài 32.", L),
    v(9,  "しあわせ", "幸せ", "しあわせ", "shiawase", "noun", "Hạnh phúc", "Đã gặp N4 bài 47.", L),
    v(10, "たいしょく", "退職", "たいしょく", "taishoku", "noun", "Nghỉ hưu, thôi việc", "Đã gặp N3 bài 3.", L),
    v(11, "わすれます", "忘れます", "わすれます", "wasuremasu", "verb", "Quên", "Đã gặp N5 bài 17.", L),
    v(12, "がんばります", "頑張ります", "がんばります", "ganbarimasu", "verb", "Cố gắng", "Đã gặp N5 bài 25.", L),
    v(13, "みなさん", "皆さん", "みなさん", "minasan", "noun", "Mọi người, các bạn", "Đã gặp N5 bài 1.", L),
    v(14, "だいがく", "大学", "だいがく", "daigaku", "noun", "Đại học", "Đã gặp N5 bài 1.", L),
    v(15, "がくせい", "学生", "がくせい", "gakusei", "noun", "Học sinh, sinh viên", "Đã gặp N5 bài 1.", L),
    v(16, "しょうらい", "将来", "しょうらい", "shourai", "noun", "Tương lai", "Đã gặp N4 bài 31.", L),
    v(17, "じかん", "時間", "じかん", "jikan", "noun", "Thời gian", "Đã gặp N4 bài 35.", L),
    v(18, "いそがしい", "忙しい", "いそがしい", "isogashii", "adjective", "Bận rộn", "Đã gặp N5 bài 8.", L),
    v(19, "ゆめ", "夢", "ゆめ", "yume", "noun", "Ước mơ, giấc mơ", "Đã gặp N4 bài 31.", L),
    v(20, "ともだち", "友達", "ともだち", "tomodachi", "noun", "Bạn bè", "Đã gặp N5 bài 5.", L),
]

KANJI = [
    k(1, "感", "CẢM", 13, ["カン (kan)"], [], "Cảm nhận, cảm động.",
      [("感謝", "かんしゃ", "Biết ơn"), ("感動", "かんどう", "Cảm động")], L),
    k(2, "謝", "TẠ", 17, ["シャ (sha)"], ["あやま(る)"], "Cảm tạ, xin lỗi.",
      [("感謝", "かんしゃ", "Biết ơn"), ("謝ります", "あやまります", "Xin lỗi")], L),
    k(3, "尊", "TÔN", 12, ["ソン (son)"], ["とうと(い)"], "Tôn trọng, cao quý.",
      [("尊敬", "そんけい", "Kính trọng"), ("尊重", "そんちょう", "Tôn trọng")], L),
    k(4, "敬", "KÍNH", 12, ["ケイ (kei)"], ["うやま(う)"], "Kính trọng.",
      [("尊敬", "そんけい", "Kính trọng"), ("敬語", "けいご", "Kính ngữ")], L),
    k(5, "願", "NGUYỆN", 19, ["ガン (gan)"], ["ねが(う)"], "Cầu mong, nguyện vọng.",
      [("願います", "ねがいます", "Cầu mong"), ("願い", "ねがい", "Nguyện vọng, mong ước")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Mãi không nguôi... (cảm xúc mãnh liệt kéo dài không ngừng): Vて + やまない",
        "V(て form, CHỈ dùng với động từ CẢM XÚC) + やまない",
        "Vてやまない diễn tả một CẢM XÚC MÃNH LIỆT, KHÔNG BAO GIỜ NGUÔI, tiếp diễn liên tục theo thời "
        "gian — CHỈ dùng với động từ chỉ CẢM XÚC (愛する、尊敬する、感謝する、望む…), KHÔNG dùng với hành "
        "động thông thường. Văn phong CỰC KỲ TRANG TRỌNG, hay ở văn viết/diễn văn.",
        [
            ex(L, 1, 1, [t("t-l8s1-1", "せんせい", "先生", "せんせい", key=True), t("t-l8s1-2", "を"),
                         t("t-l8s1-3", "そんけいして", "尊敬して", "そんけいして", key=True), t("t-l8s1-4", "やまない", key=True)],
               "Kính trọng thầy/cô mãi không thôi."),
            ex(L, 1, 2, [t("t-l8s1-5", "みなさん", "皆さん", "みなさん", key=True), t("t-l8s1-6", "に"),
                         t("t-l8s1-7", "かんしゃして", "感謝して", "かんしゃして", key=True), t("t-l8s1-8", "やまない", key=True)],
               "Biết ơn tất cả mọi người mãi không thôi."),
        ],
        tips="Vてやまない chỉ tự nhiên với động từ diễn tả CẢM XÚC — không nói '食べてやまない' (ăn mãi không thôi) vì 食べる không phải cảm xúc.",
        culture="Lời tựa sách hoặc bài diễn văn tri ân ở Nhật hay mở đầu bằng '〜氏を尊敬してやまない' (kính trọng ngài... mãi không thôi) để bày tỏ sự ngưỡng mộ sâu sắc, lâu dài."),

    slide(L, 2,
        "2. Tha thiết cầu mong rằng... (cụm cố định kết thúc diễn văn): 〜ことを + 願ってやまない",
        "[điều mong muốn]ことを + 願ってやまない",
        "願ってやまない là trường hợp ĐẶC BIỆT của Vてやまない áp dụng cho 願う (mong cầu) — đã trở "
        "thành CỤM CỐ ĐỊNH, RẤT PHỔ BIẾN ở CUỐI các bài diễn văn/lời chúc trang trọng (tốt nghiệp, "
        "kỷ niệm, tri ân) để bày tỏ MONG MUỐN THA THIẾT, chân thành.",
        [
            ex(L, 2, 1, [t("t-l8s2-1", "みなさん", "皆さん", "みなさん", key=True), t("t-l8s2-2", "の"),
                         t("t-l8s2-3", "けんこう", "健康", "けんこう", key=True), t("t-l8s2-4", "を"),
                         t("t-l8s2-5", "ねがって", "願って", "ねがって", key=True), t("t-l8s2-6", "やまない", key=True)],
               "Tha thiết cầu mong sức khỏe của mọi người."),
            ex(L, 2, 2, [t("t-l8s2-7", "みなさん", "皆さん", "みなさん", key=True), t("t-l8s2-8", "の"),
                         t("t-l8s2-9", "しあわせ", "幸せ", "しあわせ", key=True), t("t-l8s2-10", "を"),
                         t("t-l8s2-11", "ねがって", "願って", "ねがって", key=True), t("t-l8s2-12", "やまない", key=True)],
               "Tha thiết cầu mong hạnh phúc của mọi người."),
        ],
        tips="願ってやまない gần như LUÔN xuất hiện ở câu CUỐI CÙNG của một bài phát biểu — ghi nhớ như một 'câu kết mẫu' cho văn phong trang trọng.",
        culture="Diễn văn tốt nghiệp, diễn văn nghỉ hưu ở Nhật hầu như luôn kết bằng '〜ことを願ってやまない' — coi đây là dấu hiệu bài phát biểu sắp kết thúc."),

    slide(L, 3,
        "3. Lưu ý: Vてやまない chỉ dùng với động từ CẢM XÚC, không dùng với hành động thường",
        "Đúng: 愛する/尊敬する/感謝する/願う + てやまない　|　Sai: 食べる/行く/勉強する + てやまない",
        "Vì Vてやまない diễn tả một TRẠNG THÁI CẢM XÚC kéo dài bên trong (không phải một hành động lặp "
        "đi lặp lại), nó CHỈ tự nhiên với nhóm ĐỘNG TỪ CẢM XÚC/MONG MUỐN nhỏ, cố định — học thuộc nhóm "
        "này thay vì áp dụng tùy tiện cho mọi động từ.",
        [
            ex(L, 3, 1, [t("t-l8s3-1", "せんせい", "先生", "せんせい", key=True), t("t-l8s3-2", "を"),
                         t("t-l8s3-3", "あいして", "愛して", "あいして", key=True), t("t-l8s3-4", "やまない", key=True)],
               "Yêu quý thầy/cô mãi không thôi."),
            ex(L, 3, 2, [t("t-l8s3-5", "そつぎょう", "卒業", "そつぎょう", key=True), t("t-l8s3-6", "しても"),
                         t("t-l8s3-7", "、"), t("t-l8s3-8", "せんせい", "先生", "せんせい", key=True), t("t-l8s3-9", "に"),
                         t("t-l8s3-10", "かんしゃして", "感謝して", "かんしゃして", key=True), t("t-l8s3-11", "やまない", key=True)],
               "Dù đã tốt nghiệp, vẫn biết ơn thầy/cô mãi không thôi."),
        ],
        tips="Nhóm động từ hay đi với てやまない: 愛する、尊敬する、感謝する、望む、願う、期待する — ghi nhớ như một danh sách cố định.",
        culture="Học sinh Nhật viết thư cảm ơn giáo viên chủ nhiệm khi tốt nghiệp thường dùng đúng mẫu câu '先生に感謝してやみません' (dạng lịch sự của やまない)."),

    slide(L, 4,
        "4. Kết hợp trong một bài phát biểu tri ân hoàn chỉnh",
        "先生を尊敬してやまない (bày tỏ cảm xúc) + 皆様の健康と幸せを願ってやまない (câu kết diễn văn)",
        "Trong một bài phát biểu chia tay/tri ân hoàn chỉnh, thường dùng Vてやまない để bày tỏ CẢM XÚC "
        "sâu sắc (kính trọng, biết ơn) trước, rồi KẾT THÚC bài phát biểu bằng 願ってやまない để gửi lời "
        "chúc tha thiết đến người nghe.",
        [
            ex(L, 4, 1, [t("t-l8s4-1", "せんせい", "先生", "せんせい", key=True), t("t-l8s4-2", "を"),
                         t("t-l8s4-3", "そんけいして", "尊敬して", "そんけいして", key=True), t("t-l8s4-4", "やまない", key=True)],
               "Kính trọng thầy/cô mãi không thôi."),
            ex(L, 4, 2, [t("t-l8s4-5", "みなさま", "皆様", "みなさま"), t("t-l8s4-6", "の"),
                         t("t-l8s4-7", "けんこう", "健康", "けんこう", key=True), t("t-l8s4-8", "と"),
                         t("t-l8s4-9", "しあわせ", "幸せ", "しあわせ", key=True), t("t-l8s4-10", "を"),
                         t("t-l8s4-11", "ねがって", "願って", "ねがって", key=True), t("t-l8s4-12", "やまない", key=True)],
               "Tha thiết cầu mong sức khỏe và hạnh phúc của mọi người."),
        ],
        tips="Trong hội thoại/thư trang trọng, dùng dạng lịch sự やみません thay vì やまない.",
        culture="Cấu trúc diễn văn kinh điển ở Nhật: mở đầu bằng lời cảm ơn thông thường → bày tỏ cảm xúc sâu sắc (Vてやまない) → kết bằng lời chúc tha thiết (願ってやまない)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Học sinh đại diện",
         [t("d8-1", "きょう", "今日", "きょう"), t("d8-2", "は"), t("d8-3", "そつぎょう", "卒業", "そつぎょう", key=True),
          t("d8-4", "しき", "式", "しき"), t("d8-5", "です")],
         "Hôm nay là lễ tốt nghiệp."),
    line(L, 2, "鈴木", "Giáo viên sắp nghỉ hưu",
         [t("d8-6", "おめでとう")],
         "Chúc mừng em."),
    line(L, 3, "田中", "Học sinh đại diện",
         [t("d8-7", "せんせい", "先生", "せんせい", key=True), t("d8-8", "を"), t("d8-9", "そんけいして", "尊敬して", "そんけいして", key=True),
          t("d8-10", "やみません", key=True)],
         "Em kính trọng thầy mãi không thôi."),
    line(L, 4, "鈴木", "Giáo viên sắp nghỉ hưu",
         [t("d8-11", "ありがとう")],
         "Cảm ơn em."),
    line(L, 5, "田中", "Học sinh đại diện",
         [t("d8-12", "せんせい", "先生", "せんせい", key=True), t("d8-13", "に"), t("d8-14", "かんしゃして", "感謝して", "かんしゃして", key=True),
          t("d8-15", "やみません", key=True)],
         "Em biết ơn thầy mãi không thôi."),
    line(L, 6, "鈴木", "Giáo viên sắp nghỉ hưu",
         [t("d8-16", "そつぎょう", "卒業", "そつぎょう", key=True), t("d8-17", "しても"), t("d8-18", "、"),
          t("d8-19", "がんばって", "頑張って", "がんばって"), t("d8-20", "ください")],
         "Dù đã tốt nghiệp, hãy cố gắng nhé."),
    line(L, 7, "田中", "Học sinh đại diện",
         [t("d8-21", "はい"), t("d8-22", "。"), t("d8-23", "せんせい", "先生", "せんせい", key=True), t("d8-24", "を"),
          t("d8-25", "あいして", "愛して", "あいして", key=True), t("d8-26", "やみません", key=True)],
         "Vâng. Em yêu quý thầy mãi không thôi."),
    line(L, 8, "鈴木", "Giáo viên sắp nghỉ hưu",
         [t("d8-27", "みなさん", "皆さん", "みなさん", key=True), t("d8-28", "の"), t("d8-29", "しあわせ", "幸せ", "しあわせ", key=True),
          t("d8-30", "を"), t("d8-31", "ねがって", "願って", "ねがって", key=True), t("d8-32", "やみません", key=True)],
         "Thầy tha thiết cầu mong hạnh phúc của các em."),
    line(L, 9, "田中", "Học sinh đại diện",
         [t("d8-33", "せんせい", "先生", "せんせい", key=True), t("d8-34", "の"), t("d8-35", "けんこう", "健康", "けんこう", key=True),
          t("d8-36", "も"), t("d8-37", "ねがって", "願って", "ねがって", key=True), t("d8-38", "やみません", key=True)],
         "Em cũng tha thiết cầu mong sức khỏe của thầy."),
    line(L, 10, "鈴木", "Giáo viên sắp nghỉ hưu",
         [t("d8-39", "ありがとう"), t("d8-40", "。"), t("d8-41", "わすれません", "忘れません", "わすれません", key=True)],
         "Cảm ơn em. Thầy sẽ không quên."),
]

EXERCISES = [
    q(L, 1, "「先生を尊敬してやまない」 — Vてやまない diễn tả điều gì?",
      ["Một cảm xúc MÃNH LIỆT, KHÔNG BAO GIỜ NGUÔI, tiếp diễn liên tục",
       "Một hành động lặp đi lặp lại nhiều lần", "Sự cho phép làm việc gì đó",
       "Một quá trình dẫn đến kết quả"], 0,
      "Vてやまない diễn tả cảm xúc mãnh liệt, không bao giờ nguôi — chỉ dùng với động từ chỉ cảm xúc.",
      "Xem cấu trúc Vてやまない ở slide 1."),
    q(L, 2, "「皆様の健康と幸せを願ってやまない」 — 願ってやまない thường xuất hiện ở đâu?",
      ["Ở CUỐI các bài diễn văn/lời chúc trang trọng, để bày tỏ mong muốn tha thiết",
       "Ở đầu bài diễn văn, để chào hỏi", "Chỉ dùng trong hội thoại đời thường",
       "Chỉ dùng để đặt câu hỏi"], 0,
      "願ってやまない là cụm cố định hay xuất hiện ở câu kết của diễn văn trang trọng.",
      "Xem cấu trúc 願ってやまない ở slide 2."),
    q(L, 3, "Động từ nào KHÔNG THỂ dùng tự nhiên với てやまない?",
      ["食べます (ăn) — không phải động từ chỉ cảm xúc",
       "尊敬します (kính trọng) — động từ chỉ cảm xúc",
       "感謝します (biết ơn) — động từ chỉ cảm xúc",
       "願います (cầu mong) — động từ chỉ cảm xúc"], 0,
      "Vてやまない chỉ dùng tự nhiên với động từ CẢM XÚC/MONG MUỐN — 食べます là hành động thường, không phù hợp.",
      "Xem lưu ý ở slide 3."),
    q(L, 4, "Dạng lịch sự của Vてやまない trong hội thoại trang trọng là gì?",
      ["Vてやみません", "Vてやまなかった", "Vてやまますです", "Không có dạng lịch sự"], 0,
      "やまない chuyển thành やみません để trở thành dạng lịch sự, hay dùng trong hội thoại/thư trang trọng.",
      "Xem hội thoại minh họa — học sinh dùng やみません khi nói chuyện với giáo viên."),
    q(L, 5, "「卒業しても、先生に感謝してやまない」 nghĩa là:",
      ["Dù đã tốt nghiệp, vẫn biết ơn thầy/cô mãi không thôi",
       "Sau khi tốt nghiệp thì hết biết ơn thầy/cô", "Chưa tốt nghiệp nên chưa biết ơn",
       "Biết ơn chỉ trong thời gian đi học"], 0,
      "てやまない nhấn mạnh cảm xúc TIẾP DIỄN theo thời gian, kể cả sau khi hoàn cảnh đã thay đổi (đã tốt nghiệp).",
      "Áp dụng cấu trúc てやまない cho ngữ cảnh sau khi tốt nghiệp."),
    q(L, 6, "Tại sao Vてやまない và 願ってやまない thường xuất hiện CÙNG NHAU trong một bài phát biểu tri ân?",
      ["Để bày tỏ cảm xúc sâu sắc trước (Vてやまない) rồi kết thúc bằng lời chúc tha thiết (願ってやまない)",
       "Vì chúng có nghĩa giống hệt nhau nên dùng thay phiên", "Không có lý do đặc biệt",
       "Vì quy tắc ngữ pháp bắt buộc phải dùng chung"], 0,
      "Vてやまない bày tỏ cảm xúc (kính trọng, biết ơn); 願ってやまない kết thúc bài phát biểu bằng lời chúc tha thiết.",
      "Xem cấu trúc diễn văn hoàn chỉnh ở slide 4."),
    q(L, 7, "「先生を愛してやまない」 nghĩa là:",
      ["Yêu quý thầy/cô mãi không thôi", "Không còn yêu quý thầy/cô nữa",
       "Chỉ yêu quý thầy/cô trong một thời gian ngắn", "Nghi ngờ tình cảm dành cho thầy/cô"], 0,
      "てやまない diễn tả tình cảm mãnh liệt, kéo dài không ngừng.",
      "Áp dụng cấu trúc てやまない cho ngữ cảnh tình cảm."),
    q(L, 8, "Theo hội thoại, học sinh đã bày tỏ cảm xúc gì với giáo viên?",
      ["Kính trọng, biết ơn và yêu quý (尊敬して/感謝して/愛してやみません)",
       "Chỉ có sự tức giận", "Không bày tỏ cảm xúc gì", "Chỉ có sự nghi ngờ"], 0,
      "Học sinh lần lượt nói 「尊敬してやみません」「感謝してやみません」「愛してやみません」.",
      "Xem câu thoại thứ 3, 5, 7."),
    q(L, 9, "Theo hội thoại, giáo viên đã tha thiết cầu mong điều gì cho học sinh?",
      ["Hạnh phúc của các em (皆さんの幸せを願ってやみません)", "Sự giàu có",
       "Không cầu mong điều gì", "Sự nổi tiếng"], 0,
      "Giáo viên nói 「皆さんの幸せを願ってやみません」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Theo hội thoại, học sinh đã tha thiết cầu mong điều gì cho giáo viên?",
      ["Sức khỏe của thầy (先生の健康も願ってやみません)", "Sự giàu có",
       "Không cầu mong điều gì", "Kỳ nghỉ dài"], 0,
      "Học sinh nói 「先生の健康も願ってやみません」.",
      "Xem câu thoại thứ 9."),
]

LESSON = lesson(
    L,
    "Bài 8: Nguyện cầu tha thiết (てやまない & 願ってやまない)",
    "Vてやまない diễn tả một CẢM XÚC MÃNH LIỆT, KHÔNG BAO GIỜ NGUÔI — chỉ dùng với động từ chỉ CẢM "
    "XÚC (愛する、尊敬する、感謝する…); 願ってやまない là trường hợp đặc biệt đã trở thành CỤM CỐ ĐỊNH, "
    "thường xuất hiện ở CUỐI các bài diễn văn/lời chúc trang trọng để bày tỏ mong muốn tha thiết, chân thành.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
