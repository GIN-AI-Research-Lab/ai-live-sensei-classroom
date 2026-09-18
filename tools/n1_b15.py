# -*- coding: utf-8 -*-
"""N1 — Bai 15 (chot): Tong ket van phong han lam & Dien thuyet N1 qua bai
dien thuyet ky niem nghi huu cua mot giao su - ket hop cac cau truc da hoc:
wo kawakiri ni shite + kiwamarinai (b10, b1), ni sokushite + ni nottotte +
ni hoka naranai (b11, b7), kirai ga aru + nara iza shirazu + tomo arou mono
ga (b14, b13), nakushite wa + wo kagiri ni + negatte yamanai (b12, b10, b8).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 15
pool = Pool("n1")

VOCAB = [
    v(1,  "たいかん", "退官", "たいかん", "taikan", "noun", "Nghỉ hưu, rời khỏi chức vụ (quan chức/học giả)", "大学を 退官します = nghỉ hưu khỏi trường đại học.", L),
    v(2,  "こうせき", "功績", "こうせき", "kouseki", "noun", "Công lao, thành tích", "功績を 称えます = ca ngợi công lao.", L),
    v(3,  "めいよ", "名誉", "めいよ", "meiyo", "noun", "Danh dự, vinh dự", "名誉を 守ります = bảo vệ danh dự.", L),
    v(4,  "はっけん", "発見", "はっけん", "hakken", "noun", "Phát hiện", "新しい 発見を します = có một phát hiện mới.", L),
    v(5,  "おんし", "恩師", "おんし", "onshi", "noun", "Người thầy đáng kính, ân sư", "恩師に 感謝します = biết ơn ân sư.", L),
    v(6,  "きょうだん", "教壇", "きょうだん", "kyoudan", "noun", "Bục giảng", "教壇に 立ちます = đứng trên bục giảng.", L),
    v(7,  "かわきり", "皮切り", "かわきり", "kawakiri", "noun", "Điểm khởi đầu, mốc mở đầu", "Đã gặp N2 bài 6.", L),
    v(8,  "かぎり", "限り", "かぎり", "kagiri", "noun", "Giới hạn, mốc (dùng làm điểm chấm dứt)", "Đã gặp N1 bài 10.", L),
    v(9,  "ぎわく", "疑惑", "ぎわく", "giwaku", "noun", "Sự nghi ngờ, mối nghi hoặc", "Đã gặp N1 bài 13.", L),
    v(10, "しんじん", "新人", "しんじん", "shinjin", "noun", "Người mới, tân binh", "Đã gặp N1 bài 13.", L),
    v(11, "けいこう", "傾向", "けいこう", "keikou", "noun", "Xu hướng, khuynh hướng", "Đã gặp N3 bài 9.", L),
    v(12, "こうえん", "講演", "こうえん", "kouen", "noun", "Bài diễn thuyết, buổi giảng", "Đã gặp N4 bài 49.", L),
    v(13, "りろん", "理論", "りろん", "riron", "noun", "Lý thuyết", "Đã gặp N1 bài 14.", L),
    v(14, "じっせん", "実践", "じっせん", "jissen", "noun", "Thực hành, thực tiễn", "Đã gặp N1 bài 14.", L),
    v(15, "はじ", "恥", "はじ", "haji", "noun", "Sự xấu hổ, nỗi nhục", "Đã gặp N1 bài 13.", L),
    v(16, "しんらい", "信頼", "しんらい", "shinrai", "noun", "Sự tin cậy", "Đã gặp N1 bài 6.", L),
    v(17, "どりょく", "努力", "どりょく", "doryoku", "noun", "Nỗ lực", "Đã gặp N3 bài 2.", L),
    v(18, "きょうじゅ", "教授", "きょうじゅ", "kyouju", "noun", "Giáo sư", "Đã gặp N1 bài 14.", L),
    v(19, "ろんぶん", "論文", "ろんぶん", "ronbun", "noun", "Luận văn, luận án", "Đã gặp N1 bài 14.", L),
    v(20, "がんこ", "頑固", "がんこ", "ganko", "adjective", "Cố chấp, ngoan cố", "Đã gặp N1 bài 14.", L),
]

KANJI = [
    k(1, "官", "QUAN", 8, ["カン (kan)"], [], "Quan chức, chức vụ nhà nước.",
      [("退官", "たいかん", "Nghỉ hưu (quan chức/học giả)"), ("官庁", "かんちょう", "Cơ quan nhà nước")], L),
    k(2, "壇", "ĐÀN", 16, ["ダン (dan)"], [], "Bục, đàn, đài.",
      [("教壇", "きょうだん", "Bục giảng"), ("壇上", "だんじょう", "Trên bục, trên lễ đài")], L),
    k(3, "誉", "DỰ", 13, ["ヨ (yo)"], ["ほま(れ)"], "Danh dự, khen ngợi.",
      [("名誉", "めいよ", "Danh dự"), ("誉れ", "ほまれ", "Niềm vinh dự")], L),
    k(4, "功", "CÔNG", 5, ["コウ (kou)"], [], "Công lao, thành tích.",
      [("功績", "こうせき", "Công lao, thành tích"), ("成功", "せいこう", "Thành công")], L),
    k(5, "師", "SƯ", 10, ["シ (shi)"], [], "Thầy, người thầy.",
      [("恩師", "おんし", "Ân sư"), ("師匠", "ししょう", "Sư phụ")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Mở đầu bài phát biểu: Khởi đầu sự nghiệp & Cảm xúc tột độ (を皮切りにして + 極まりない)",
        "N(điểm khởi đầu)を皮切りにして、[sự nghiệp phát triển]。感慨極まりないものがある。",
        "Mở đầu bài phát biểu chia tay, người nói thường dùng を皮切りにして (bài 10) để hồi tưởng lại "
        "ĐIỂM KHỞI ĐẦU của cả sự nghiệp, rồi bày tỏ cảm xúc dâng trào bằng 極まりない (bài 1 — cực "
        "điểm, vô cùng) để diễn tả cảm giác CỰC ĐỘ, khó kìm nén khi đứng trước cột mốc cuối cùng của hành trình đó.",
        [
            ex(L, 1, 1, [t("t-l15s1-1", "この"), t("t-l15s1-2", "ちいさな", "小さな", "ちいさな"),
                         t("t-l15s1-3", "はっけん", "発見", "はっけん", key=True), t("t-l15s1-4", "を"),
                         t("t-l15s1-5", "かわきりにして", "皮切りにして", "かわきりにして", key=True), t("t-l15s1-6", "、"),
                         t("t-l15s1-7", "よんじゅうねん", "40年", "よんじゅうねん"), t("t-l15s1-8", "に"),
                         t("t-l15s1-9", "および", "及ぶ", "および"), t("t-l15s1-10", "けんきゅう", "研究", "けんきゅう"),
                         t("t-l15s1-11", "じんせい", "人生", "じんせい"), t("t-l15s1-12", "が"),
                         t("t-l15s1-13", "はじまりました", "始まりました", "はじまりました")],
               "Bắt đầu từ phát hiện nhỏ bé này, sự nghiệp nghiên cứu kéo dài 40 năm đã bắt đầu."),
            ex(L, 1, 2, [t("t-l15s1-14", "こうして"), t("t-l15s1-15", "みなさま", "皆様", "みなさま"), t("t-l15s1-16", "の"),
                         t("t-l15s1-17", "まえ", "前", "まえ"), t("t-l15s1-18", "で"), t("t-l15s1-19", "さいご", "最後", "さいご"),
                         t("t-l15s1-20", "こうぎ", "講義", "こうぎ"), t("t-l15s1-21", "を"), t("t-l15s1-22", "する"),
                         t("t-l15s1-23", "こと"), t("t-l15s1-24", "が"), t("t-l15s1-25", "でき"), t("t-l15s1-26", "、"),
                         t("t-l15s1-27", "かんがい", "感慨", "かんがい", key=True), t("t-l15s1-28", "きわまりない", "極まりない", "きわまりない", key=True),
                         t("t-l15s1-29", "もの"), t("t-l15s1-30", "が"), t("t-l15s1-31", "あります")],
               "Có thể đứng trước quý vị để thực hiện bài giảng cuối cùng như thế này, tôi cảm thấy cảm khái vô cùng."),
        ],
        tips="を皮切りにして (bài 10) luôn kéo theo một chuỗi phát triển; 極まりない (bài 1) luôn diễn tả một cảm xúc CHỦ QUAN ở mức cực điểm — kết hợp tạo mở đầu vừa kể chuyện vừa giàu cảm xúc.",
        culture="Bài giảng kỷ niệm nghỉ hưu (退官記念講演) của giáo sư Nhật luôn mở đầu bằng việc hồi tưởng cột mốc khởi nghiệp nghiên cứu, kèm theo một câu cảm thán trang trọng như '感慨極まりないものがあります'."),

    slide(L, 2,
        "2. Lập luận học thuật: Dựa sát thực tế, tuân theo chuẩn mực & khẳng định (に即して + に則って + にほかならない)",
        "実態に即して分析すれば、〜にほかならない。伝統に則って進めることこそ、〜にほかならない。",
        "Trình bày quan điểm học thuật đòi hỏi vừa PHÂN TÍCH bám sát THỰC TẾ cụ thể (に即して — bài "
        "11), vừa TUÂN THEO chuẩn mực/truyền thống đã được thiết lập (に則って — bài 11), rồi KHẲNG "
        "ĐỊNH dứt khoát bản chất vấn đề bằng にほかならない (bài 7 — chính là, không gì khác) để tăng sức thuyết phục cho lập luận.",
        [
            ex(L, 2, 1, [t("t-l15s2-1", "ながねん", "長年", "ながねん"), t("t-l15s2-2", "の"), t("t-l15s2-3", "データ"),
                         t("t-l15s2-4", "に"), t("t-l15s2-5", "そくして", "即して", "そくして", key=True),
                         t("t-l15s2-6", "ぶんせきすれば", "分析すれば", "ぶんせきすれば"), t("t-l15s2-7", "、"),
                         t("t-l15s2-8", "この"), t("t-l15s2-9", "げんしょう", "現象", "げんしょう"), t("t-l15s2-10", "は"),
                         t("t-l15s2-11", "しぜん", "自然", "しぜん"), t("t-l15s2-12", "の"), t("t-l15s2-13", "ほうそく", "法則", "ほうそく"),
                         t("t-l15s2-14", "に"), t("t-l15s2-15", "ほかならない", key=True), t("t-l15s2-16", "の"), t("t-l15s2-17", "です")],
               "Nếu phân tích bám sát theo dữ liệu nhiều năm, thì hiện tượng này chính là quy luật tự nhiên, không gì khác."),
            ex(L, 2, 2, [t("t-l15s2-18", "がくもん", "学問", "がくもん"), t("t-l15s2-19", "の"), t("t-l15s2-20", "でんとう", "伝統", "でんとう"),
                         t("t-l15s2-21", "に"), t("t-l15s2-22", "のっとって", "則って", "のっとって", key=True),
                         t("t-l15s2-23", "けんきゅう", "研究", "けんきゅう"), t("t-l15s2-24", "を"), t("t-l15s2-25", "すすめる", "進める", "すすめる"),
                         t("t-l15s2-26", "こと"), t("t-l15s2-27", "こそ"), t("t-l15s2-28", "、"), t("t-l15s2-29", "しん", "真", "しん"),
                         t("t-l15s2-30", "の"), t("t-l15s2-31", "がくしゃ", "学者", "がくしゃ"), t("t-l15s2-32", "の"),
                         t("t-l15s2-33", "すがた", "姿", "すがた"), t("t-l15s2-34", "に"), t("t-l15s2-35", "ほかならない", key=True),
                         t("t-l15s2-36", "の"), t("t-l15s2-37", "です")],
               "Chính việc tiến hành nghiên cứu tuân theo truyền thống học thuật mới là dáng vẻ đích thực của một học giả chân chính, không gì khác."),
        ],
        tips="に即して căn cứ vào THỰC TẾ cụ thể (dữ liệu, hiện tượng); に則って căn cứ vào QUY TẮC/TRUYỀN THỐNG có sẵn — cả hai cùng dẫn tới một khẳng định dứt khoát bằng にほかならない.",
        culture="Diễn văn học thuật Nhật thường theo khung: nêu căn cứ (thực tế hoặc chuẩn mực) → khẳng định kết luận bằng にほかならない để tăng tính thuyết phục, đanh thép."),

    slide(L, 3,
        "3. Lời cảnh tỉnh dành cho học giả trẻ: Xu hướng cần lưu ý & Phê phán nghiêm khắc (きらいがある + ならいざ知らず + ともあろう者が)",
        "若手はNに走るきらいがある。新人ならいざ知らず、研究者ともあろう者が、〜とは。",
        "Khi cảnh tỉnh thế hệ học giả trẻ, giáo sư trước tiên NHẬN XÉT NHẸ NHÀNG một xu hướng còn "
        "thiếu sót bằng きらいがある (bài 14 — khách quan, điềm tĩnh), sau đó CHUYỂN SANG PHÊ PHÁN "
        "NGHIÊM KHẮC hơn đối với hành vi sai trái nghiêm trọng bằng cách kết hợp ならいざ知らず (bài "
        "13 — so sánh mức độ) và ともあろう者が (bài 13 — chỉ trích địa vị) — tạo ra hai TẦNG PHÊ "
        "PHÁN rõ rệt: nhẹ nhàng nhắc nhở và nghiêm khắc lên án.",
        [
            ex(L, 3, 1, [t("t-l15s3-1", "わかて", "若手", "わかて"), t("t-l15s3-2", "の"), t("t-l15s3-3", "けんきゅうしゃ", "研究者", "けんきゅうしゃ"),
                         t("t-l15s3-4", "は"), t("t-l15s3-5", "、"), t("t-l15s3-6", "りろん", "理論", "りろん", key=True),
                         t("t-l15s3-7", "に"), t("t-l15s3-8", "はしる", "走る", "はしる"), t("t-l15s3-9", "きらいがあります", key=True),
                         t("t-l15s3-10", "。"), t("t-l15s3-11", "じっせん", "実践", "じっせん", key=True), t("t-l15s3-12", "を"),
                         t("t-l15s3-13", "わすれないで", "忘れないで", "わすれないで"), t("t-l15s3-14", "ほしい"), t("t-l15s3-15", "の"), t("t-l15s3-16", "です")],
               "Các nhà nghiên cứu trẻ có xu hướng chạy theo lý thuyết suông. Tôi mong các bạn đừng quên tính thực tiễn."),
            ex(L, 3, 2, [t("t-l15s3-17", "しんじん", "新人", "しんじん", key=True), t("t-l15s3-18", "ならいざしらず", "ならいざ知らず", "ならいざしらず", key=True),
                         t("t-l15s3-19", "、"), t("t-l15s3-20", "けんきゅうしゃ", "研究者", "けんきゅうしゃ"),
                         t("t-l15s3-21", "ともあろうものが", "ともあろう者が", "ともあろうものが", key=True), t("t-l15s3-22", "、"),
                         t("t-l15s3-23", "データ"), t("t-l15s3-24", "を"), t("t-l15s3-25", "いつわる", "偽る", "いつわる"),
                         t("t-l15s3-26", "とは"), t("t-l15s3-27", "ゆるされない", "許されない", "ゆるされない"),
                         t("t-l15s3-28", "こと"), t("t-l15s3-29", "です")],
               "Nếu là người mới thì còn hiểu được, nhưng một người đã là nhà nghiên cứu mà lại làm giả dữ liệu thì đó là điều không thể tha thứ."),
        ],
        tips="きらいがある dùng cho xu hướng NHẸ, còn có thể sửa; ならいざ知らず + ともあろう者が dành cho hành vi NGHIÊM TRỌNG, không thể tha thứ — mức độ phê phán tăng dần rõ rệt.",
        culture="Bài giảng cuối của giáo sư Nhật thường có đoạn 'lời khuyên cho hậu bối' đi từ nhắc nhở nhẹ nhàng đến cảnh báo nghiêm khắc, thể hiện trách nhiệm dẫn dắt thế hệ sau."),

    slide(L, 4,
        "4. Lời tri ân & Tuyên bố khép lại: Điều kiện không thể thiếu & Nguyện cầu tha thiết (なくしては + を限りに + 願ってやまない)",
        "恩師や家族の支えなくしては、今日の私はない。本日を限りに教壇を去るが、〜を願ってやまない。",
        "Khép lại bài phát biểu, người nói bày tỏ lòng biết ơn bằng cách khẳng định sự hỗ trợ của "
        "mọi người là điều kiện KHÔNG THỂ THIẾU (なくしては — bài 12), rồi TUYÊN BỐ dứt khoát mốc kết "
        "thúc sự nghiệp bằng を限りに (bài 10 — hô ứng với を皮切りにして ở slide 1: một mở đầu, một "
        "khép lại), và cuối cùng gửi gắm NGUYỆN CẦU THA THIẾT cho tương lai bằng 願ってやまない (bài 8).",
        [
            ex(L, 4, 1, [t("t-l15s4-1", "おんし", "恩師", "おんし", key=True), t("t-l15s4-2", "や"), t("t-l15s4-3", "かぞく", "家族", "かぞく"),
                         t("t-l15s4-4", "の"), t("t-l15s4-5", "ささえ", "支え", "ささえ"), t("t-l15s4-6", "なくしては", key=True),
                         t("t-l15s4-7", "、"), t("t-l15s4-8", "きょう", "今日", "きょう"), t("t-l15s4-9", "の"),
                         t("t-l15s4-10", "わたし", "私", "わたし"), t("t-l15s4-11", "は"), t("t-l15s4-12", "なかった"), t("t-l15s4-13", "でしょう")],
               "Nếu không có sự nâng đỡ của ân sư và gia đình, thì đã không có tôi của ngày hôm nay."),
            ex(L, 4, 2, [t("t-l15s4-14", "ほんじつ", "本日", "ほんじつ"), t("t-l15s4-15", "を"), t("t-l15s4-16", "かぎりに", "限りに", "かぎりに", key=True),
                         t("t-l15s4-17", "きょうだん", "教壇", "きょうだん", key=True), t("t-l15s4-18", "を"),
                         t("t-l15s4-19", "さります", "去ります", "さります"), t("t-l15s4-20", "が"), t("t-l15s4-21", "、"),
                         t("t-l15s4-22", "みなさま", "皆様", "みなさま"), t("t-l15s4-23", "の"), t("t-l15s4-24", "こんご", "今後", "こんご"),
                         t("t-l15s4-25", "の"), t("t-l15s4-26", "ご"), t("t-l15s4-27", "かつやく", "活躍", "かつやく"), t("t-l15s4-28", "を"),
                         t("t-l15s4-29", "ねがってやみません", "願ってやみません", "ねがってやみません", key=True)],
               "Kể từ hôm nay tôi sẽ rời khỏi bục giảng này, nhưng tôi tha thiết nguyện cầu quý vị sẽ tiếp tục hoạt động rực rỡ trong tương lai."),
        ],
        tips="を皮切りにして (mở đầu, slide 1) và を限りに (kết thúc, slide 4) tạo hiệu ứng BOOKEND cho toàn bộ bài phát biểu — chính là cách hai cấu trúc này từng được dùng ngay trong bài 10.",
        culture="Một bài phát biểu chia tay hoàn chỉnh ở Nhật luôn khép lại bằng ba bước: tri ân (なくしては) → tuyên bố dứt khoát mốc kết thúc (を限りに) → gửi gắm nguyện cầu cho tương lai (願ってやまない)."),
]

DIALOGUE = [
    line(L, 1, "司会", "Người dẫn chương trình",
         [t("d15-1", "ほんじつ", "本日", "ほんじつ"), t("d15-2", "は"), t("d15-3", "、"),
          t("d15-4", "きょうじゅ", "教授", "きょうじゅ", key=True), t("d15-5", "の"), t("d15-6", "たいかん", "退官", "たいかん", key=True),
          t("d15-7", "きねん", "記念", "きねん"), t("d15-8", "こうえん", "講演", "こうえん", key=True), t("d15-9", "に"),
          t("d15-10", "おあつまりいただき", "お集まりいただき", "おあつまりいただき"), t("d15-11", "、"), t("d15-12", "ありがとうございます")],
         "Hôm nay, cảm ơn mọi người đã đến dự buổi giảng kỷ niệm nghỉ hưu của giáo sư."),
    line(L, 2, "教授", "Giáo sư",
         [t("d15-13", "この"), t("d15-14", "ちいさな", "小さな", "ちいさな"), t("d15-15", "はっけん", "発見", "はっけん", key=True),
          t("d15-16", "を"), t("d15-17", "かわきりにして", "皮切りにして", "かわきりにして", key=True), t("d15-18", "、"),
          t("d15-19", "よんじゅうねん", "40年", "よんじゅうねん"), t("d15-20", "に"), t("d15-21", "および", "及ぶ", "および"),
          t("d15-22", "けんきゅう", "研究", "けんきゅう"), t("d15-23", "じんせい", "人生", "じんせい"), t("d15-24", "が"),
          t("d15-25", "はじまりました", "始まりました", "はじまりました"), t("d15-26", "。"), t("d15-27", "かんがい", "感慨", "かんがい", key=True),
          t("d15-28", "きわまりない", "極まりない", "きわまりない", key=True), t("d15-29", "もの"), t("d15-30", "が"), t("d15-31", "あります")],
         "Bắt đầu từ phát hiện nhỏ bé này, sự nghiệp nghiên cứu kéo dài 40 năm đã bắt đầu. Tôi cảm thấy cảm khái vô cùng."),
    line(L, 3, "司会", "Người dẫn chương trình",
         [t("d15-32", "これまで"), t("d15-33", "の"), t("d15-34", "ご"), t("d15-35", "けんきゅう", "研究", "けんきゅう"),
          t("d15-36", "について"), t("d15-37", "、"), t("d15-38", "ひとこと", "一言", "ひとこと"),
          t("d15-39", "おねがいできますか", "お願いできますか", "おねがいできますか")],
         "Về nghiên cứu từ trước đến nay, xin giáo sư có thể nói đôi lời được không ạ?"),
    line(L, 4, "教授", "Giáo sư",
         [t("d15-40", "ながねん", "長年", "ながねん"), t("d15-41", "の"), t("d15-42", "データ"), t("d15-43", "に"),
          t("d15-44", "そくして", "即して", "そくして", key=True), t("d15-45", "ぶんせきすれば", "分析すれば", "ぶんせきすれば"),
          t("d15-46", "、"), t("d15-47", "この"), t("d15-48", "げんしょう", "現象", "げんしょう"), t("d15-49", "は"),
          t("d15-50", "しぜん", "自然", "しぜん"), t("d15-51", "の"), t("d15-52", "ほうそく", "法則", "ほうそく"), t("d15-53", "に"),
          t("d15-54", "ほかなりません", key=True), t("d15-55", "。"), t("d15-56", "でんとう", "伝統", "でんとう"), t("d15-57", "に"),
          t("d15-58", "のっとって", "則って", "のっとって", key=True), t("d15-59", "けんきゅう", "研究", "けんきゅう"), t("d15-60", "を"),
          t("d15-61", "すすめる", "進める", "すすめる"), t("d15-62", "こと"), t("d15-63", "こそ"), t("d15-64", "、"),
          t("d15-65", "しん", "真", "しん"), t("d15-66", "の"), t("d15-67", "がくしゃ", "学者", "がくしゃ"), t("d15-68", "の"),
          t("d15-69", "すがた", "姿", "すがた"), t("d15-70", "に"), t("d15-71", "ほかならない", key=True), t("d15-72", "の"), t("d15-73", "です")],
         "Nếu phân tích bám sát theo dữ liệu nhiều năm, thì hiện tượng này chính là quy luật tự nhiên. Chính việc tiến hành nghiên cứu tuân theo truyền thống học thuật mới là dáng vẻ đích thực của một học giả chân chính."),
    line(L, 5, "司会", "Người dẫn chương trình",
         [t("d15-74", "わかい", "若い", "わかい"), t("d15-75", "けんきゅうしゃ", "研究者", "けんきゅうしゃ"), t("d15-76", "たち"),
          t("d15-77", "へ"), t("d15-78", "、"), t("d15-79", "メッセージ"), t("d15-80", "は"), t("d15-81", "ありますか")],
         "Giáo sư có thông điệp nào dành cho các nhà nghiên cứu trẻ không ạ?"),
    line(L, 6, "教授", "Giáo sư",
         [t("d15-82", "わかて", "若手", "わかて"), t("d15-83", "の"), t("d15-84", "けんきゅうしゃ", "研究者", "けんきゅうしゃ"),
          t("d15-85", "は"), t("d15-86", "、"), t("d15-87", "りろん", "理論", "りろん", key=True), t("d15-88", "に"),
          t("d15-89", "はしる", "走る", "はしる"), t("d15-90", "きらいがあります", key=True), t("d15-91", "。"),
          t("d15-92", "じっせん", "実践", "じっせん", key=True), t("d15-93", "を"), t("d15-94", "わすれないで", "忘れないで", "わすれないで"),
          t("d15-95", "ほしい"), t("d15-96", "の"), t("d15-97", "です")],
         "Các nhà nghiên cứu trẻ có xu hướng chạy theo lý thuyết suông. Tôi mong các bạn đừng quên tính thực tiễn."),
    line(L, 7, "司会", "Người dẫn chương trình",
         [t("d15-98", "さいきん", "最近", "さいきん"), t("d15-99", "、"), t("d15-100", "データ"),
          t("d15-101", "ぎぞう", "偽造", "ぎぞう"), t("d15-102", "の"), t("d15-103", "ぎわく", "疑惑", "ぎわく", key=True),
          t("d15-104", "が"), t("d15-105", "ありました"), t("d15-106", "が")],
         "Gần đây có nghi vấn ngụy tạo dữ liệu..."),
    line(L, 8, "教授", "Giáo sư",
         [t("d15-107", "しんじん", "新人", "しんじん", key=True), t("d15-108", "ならいざしらず", "ならいざ知らず", "ならいざしらず", key=True),
          t("d15-109", "、"), t("d15-110", "けんきゅうしゃ", "研究者", "けんきゅうしゃ"),
          t("d15-111", "ともあろうものが", "ともあろう者が", "ともあろうものが", key=True), t("d15-112", "、"),
          t("d15-113", "データ"), t("d15-114", "を"), t("d15-115", "いつわる", "偽る", "いつわる"), t("d15-116", "とは"),
          t("d15-117", "ゆるされない", "許されない", "ゆるされない"), t("d15-118", "こと"), t("d15-119", "です")],
         "Nếu là người mới thì còn hiểu được, nhưng một người đã là nhà nghiên cứu mà lại làm giả dữ liệu thì đó là điều không thể tha thứ."),
    line(L, 9, "司会", "Người dẫn chương trình",
         [t("d15-120", "さいごに", "最後に", "さいごに"), t("d15-121", "、"), t("d15-122", "かんしゃ", "感謝", "かんしゃ"),
          t("d15-123", "の"), t("d15-124", "ことば", "言葉", "ことば"), t("d15-125", "を"),
          t("d15-126", "おねがいします", "お願いします", "おねがいします")],
         "Cuối cùng, xin giáo sư nói lời cảm ơn."),
    line(L, 10, "教授", "Giáo sư",
         [t("d15-127", "おんし", "恩師", "おんし", key=True), t("d15-128", "や"), t("d15-129", "かぞく", "家族", "かぞく"),
          t("d15-130", "の"), t("d15-131", "ささえ", "支え", "ささえ"), t("d15-132", "なくしては", key=True), t("d15-133", "、"),
          t("d15-134", "きょう", "今日", "きょう"), t("d15-135", "の"), t("d15-136", "わたし", "私", "わたし"),
          t("d15-137", "は"), t("d15-138", "ありませんでした"), t("d15-139", "。"), t("d15-140", "ほんじつ", "本日", "ほんじつ"),
          t("d15-141", "を"), t("d15-142", "かぎりに", "限りに", "かぎりに", key=True), t("d15-143", "この"),
          t("d15-144", "きょうだん", "教壇", "きょうだん", key=True), t("d15-145", "を"), t("d15-146", "さります", "去ります", "さります"),
          t("d15-147", "が"), t("d15-148", "、"), t("d15-149", "みなさま", "皆様", "みなさま"), t("d15-150", "の"),
          t("d15-151", "こんご", "今後", "こんご"), t("d15-152", "の"), t("d15-153", "ご"), t("d15-154", "かつやく", "活躍", "かつやく"),
          t("d15-155", "を"), t("d15-156", "ねがってやみません", "願ってやみません", "ねがってやみません", key=True)],
         "Nếu không có sự nâng đỡ của ân sư và gia đình, thì đã không có tôi của ngày hôm nay. Kể từ hôm nay tôi sẽ rời khỏi bục giảng này, nhưng tôi tha thiết nguyện cầu quý vị sẽ tiếp tục hoạt động rực rỡ trong tương lai."),
]

EXERCISES = [
    q(L, 1, "「この小さな発見を皮切りにして、40年に及ぶ研究人生が始まりました。感慨極まりないものがあります」 — kết hợp hai cấu trúc nào?",
      ["を皮切りにして (khởi đầu một chuỗi, bài 10) + 極まりない (cảm xúc tột độ, bài 1)",
       "なくしては + 願ってやまない", "に即して + に則って", "きらいがある + ならいざ知らず"], 0,
      "Câu này kết hợp を皮切りにして để hồi tưởng điểm khởi đầu sự nghiệp với 極まりない để diễn tả cảm xúc dâng trào cực độ.",
      "Xem slide 1 về を皮切りにして + 極まりない."),
    q(L, 2, "「長年のデータに即して分析すれば、この現象は自然の法則にほかなりません」 — に即して kết hợp với にほかならない để làm gì?",
      ["Phân tích bám sát THỰC TẾ cụ thể (bài 11) rồi KHẲNG ĐỊNH dứt khoát bản chất vấn đề (bài 7)",
       "So sánh hai trường hợp khác nhau", "Chỉ trích một người có địa vị cao", "Bày tỏ lòng biết ơn sâu sắc"], 0,
      "に即して nêu căn cứ là thực tế dữ liệu cụ thể; にほかならない khẳng định dứt khoát kết luận rút ra từ đó.",
      "Xem slide 2 về に即して + にほかならない."),
    q(L, 3, "「伝統に則って研究を進めることこそ、真の学者の姿にほかならない」 — に則って ở đây nhấn mạnh điều gì?",
      ["Tuân theo TRUYỀN THỐNG/chuẩn mực đã được thiết lập (bài 11), khác với に即して (thực tế cụ thể)",
       "Một thực tế thị trường đang thay đổi", "Một xu hướng tiêu cực trong tính cách",
       "Một điều kiện tiên quyết sống còn"], 0,
      "に則って ở đây nhấn mạnh việc tuân theo truyền thống học thuật đã được thiết lập, khác với に即して vốn dựa trên thực tế cụ thể.",
      "Xem slide 2 về に則って + にほかならない."),
    q(L, 4, "「若手の研究者は、理論に走るきらいがあります」 kết hợp với 「新人ならいざ知らず、研究者ともあろう者が、データを偽るとは許されない」 để tạo ra điều gì?",
      ["Hai TẦNG phê phán: nhận xét NHẸ NHÀNG về xu hướng (bài 14) rồi PHÊ PHÁN NGHIÊM KHẮC hành vi sai trái bằng cách so sánh mức độ và nhấn địa vị (bài 13)",
       "Hai lời khen ngợi liên tiếp", "Một sự mâu thuẫn logic không có ý nghĩa",
       "Một câu hỏi tu từ không cần trả lời"], 0,
      "きらいがある tạo tầng phê phán nhẹ (xu hướng cần cải thiện); ならいざ知らず + ともあろう者が tạo tầng phê phán nghiêm khắc (hành vi không thể chấp nhận).",
      "Xem slide 3 về きらいがある + ならいざ知らず + ともあろう者が."),
    q(L, 5, "「恩師や家族の支えなくしては、今日の私はありませんでした」 — なくしては (bài 12) ở đây diễn tả điều gì?",
      ["Ân sư và gia đình là ĐIỀU KIỆN TIÊN QUYẾT không thể thiếu cho thành công của người nói",
       "Người nói không cần ai giúp đỡ cả", "Ân sư và gia đình đã phản đối người nói",
       "Một xu hướng tiêu cực trong tính cách"], 0,
      "なくしては khẳng định sự nâng đỡ của ân sư và gia đình là điều kiện tiên quyết không thể thiếu.",
      "Xem slide 4 về なくしては + を限りに + 願ってやまない."),
    q(L, 6, "「本日を限りにこの教壇を去りますが、皆様の今後のご活躍を願ってやみません」 — kết hợp を限りに và 願ってやまない để làm gì?",
      ["TUYÊN BỐ dứt khoát mốc kết thúc sự nghiệp (bài 10) rồi gửi gắm NGUYỆN CẦU THA THIẾT cho tương lai người khác (bài 8)",
       "Chỉ trích mạnh mẽ một hành vi sai trái", "So sánh hai trường hợp để nhấn mạnh sự nghiêm trọng",
       "Yêu cầu người nghe phải làm gì đó ngay lập tức"], 0,
      "を限りに tuyên bố dứt khoát việc rời bục giảng kể từ hôm nay; 願ってやまない gửi gắm nguyện cầu tha thiết cho tương lai của người nghe.",
      "Xem slide 4 về を限りに + 願ってやまない."),
    q(L, 7, "Tại sao を皮切りにして (mở đầu bài phát biểu) và を限りに (kết thúc bài phát biểu) đều xuất hiện trong cùng một bài diễn thuyết ở bài 15?",
      ["Để tạo hiệu ứng BOOKEND — một mở đầu sự nghiệp, một khép lại sự nghiệp — giống hệt cách chúng được dùng trong chính bài 10",
       "Vì hai cấu trúc bắt buộc phải luôn đi cùng nhau trong mọi trường hợp", "Vì đó là lỗi lặp từ không cố ý",
       "Không có lý do đặc biệt nào"], 0,
      "を皮切りにして mở đầu hồi tưởng sự nghiệp, を限りに khép lại dứt khoát — tạo hiệu ứng bookend cho toàn bài phát biểu, giống cách dùng trong chính bài 10.",
      "Xem tips ở slide 4."),
    q(L, 8, "Theo hội thoại, sự nghiệp nghiên cứu của giáo sư đã bắt đầu như thế nào?",
      ["Bắt đầu từ một phát hiện nhỏ bé, kéo dài 40 năm (小さな発見を皮切りにして、40年に及ぶ研究人生が始まりました)",
       "Bắt đầu từ một giải thưởng lớn", "Không được đề cập trong hội thoại", "Bắt đầu từ khi còn là học sinh trung học"], 0,
      "Giáo sư nói 「この小さな発見を皮切りにして、40年に及ぶ研究人生が始まりました」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Theo hội thoại, giáo sư phản ứng thế nào trước vụ nghi vấn ngụy tạo dữ liệu?",
      ["Phê phán nghiêm khắc: nếu là người mới thì còn hiểu được, nhưng một nhà nghiên cứu mà làm vậy thì không thể tha thứ (新人ならいざ知らず、研究者ともあろう者が、データを偽るとは許されない)",
       "Hoàn toàn thông cảm và bỏ qua", "Từ chối bình luận về vụ việc", "Cho rằng đó là chuyện bình thường"], 0,
      "Giáo sư nói 「新人ならいざ知らず、研究者ともあろう者が、データを偽るとは許されないことです」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Theo hội thoại, giáo sư kết thúc bài phát biểu bằng điều gì?",
      ["Cảm ơn ân sư/gia đình, tuyên bố rời bục giảng, và nguyện cầu tha thiết cho tương lai của mọi người",
       "Yêu cầu mọi người vinh danh mình nhiều hơn", "Tuyên bố sẽ tiếp tục giảng dạy thêm nhiều năm nữa",
       "Không nói lời cảm ơn nào"], 0,
      "Giáo sư nói 「恩師や家族の支えなくしては、今日の私はありませんでした。本日を限りにこの教壇を去りますが、皆様の今後のご活躍を願ってやみません」.",
      "Xem câu thoại thứ 10."),
]

LESSON = lesson(
    L,
    "Bài 15: Tổng kết văn phong hàn lâm & Diễn thuyết N1",
    "Bài tổng kết N1 kết hợp các cấu trúc trọng điểm đã học qua một bài diễn thuyết kỷ niệm nghỉ "
    "hưu của một giáo sư: を皮切りにして + 極まりない (mở đầu hồi tưởng sự nghiệp → cảm xúc tột độ, "
    "bài 10+1), に即して + に則って + にほかならない (lập luận học thuật bám sát thực tế + tuân theo "
    "truyền thống → khẳng định dứt khoát, bài 11+7), きらいがある + ならいざ知らず + ともあろう者が "
    "(cảnh tỉnh nhẹ nhàng → phê phán nghiêm khắc, bài 14+13), và なくしては + を限りに + "
    "願ってやまない (tri ân → tuyên bố khép lại → nguyện cầu tha thiết, bài 12+10+8) — nắm vững cách "
    "KẾT HỢP các cấu trúc này quan trọng hơn học thuộc riêng lẻ, đúng như cách chúng xuất hiện trong "
    "văn phong diễn thuyết/học thuật N1 thực tế. Hoàn thành trọn vẹn 15/15 bài N1!",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
