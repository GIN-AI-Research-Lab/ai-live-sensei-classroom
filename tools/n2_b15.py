# -*- coding: utf-8 -*-
"""N2 — Bai 15 (chot): Tong ket ngu phap N2 qua bai phat bieu ky niem thanh lap cong ty - ket hop
cac cau truc da hoc: ni saishite/wo keiki ni (b1,b6), zaru wo enai/wo mono to mo sezu ni (b2,b9),
sue ni/ni shitagatte/ni todomarazu (b12,b5,b13), narade wa no/ni fusawashii/ni motozuite (b11,b10).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n2.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n2_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 15
pool = Pool("n2")

VOCAB = [
    v(1,  "きねん", "記念", "きねん", "kinen", "noun", "Kỷ niệm", "10周年 記念 = kỷ niệm 10 năm.", L),
    v(2,  "しゅうねん", "周年", "しゅうねん", "shuunen", "noun", "...năm kỷ niệm", "創立10周年 = kỷ niệm 10 năm thành lập.", L),
    v(3,  "いわいます", "祝います", "いわいます", "iwaimasu", "verb", "Chúc mừng", "記念日を 祝います = chúc mừng ngày kỷ niệm.", L),
    v(4,  "そうりつ", "創立", "そうりつ", "souritsu", "noun", "Sáng lập, thành lập", "会社の 創立 = sự thành lập công ty.", L),
    v(5,  "けいえい", "経営", "けいえい", "keiei", "noun", "Kinh doanh, quản lý", "会社を 経営します = kinh doanh công ty.", L),
    v(6,  "しゅうにん", "就任", "しゅうにん", "shuunin", "noun", "Nhậm chức", "Đã gặp N2 bài 1.", L),
    v(7,  "けいき", "契機", "けいき", "keiki", "noun", "Cơ hội, động lực", "Đã gặp N2 bài 6.", L),
    v(8,  "しゅくしょう", "縮小", "しゅくしょう", "shukushou", "noun", "Sự thu hẹp", "Đã gặp N2 bài 2.", L),
    v(9,  "やむをえない", "やむを得ない", "やむをえない", "yamu wo enai", "adjective", "Bất đắc dĩ", "Đã gặp N2 bài 2.", L),
    v(10, "どりょく", "努力", "どりょく", "doryoku", "noun", "Nỗ lực", "Đã gặp N3 bài 8.", L),
    v(11, "のうりょく", "能力", "のうりょく", "nouryoku", "noun", "Năng lực", "Đã gặp N2 bài 11.", L),
    v(12, "ぶんや", "分野", "ぶんや", "bun-ya", "noun", "Lĩnh vực", "Đã gặp N3 bài 6.", L),
    v(13, "えいきょう", "影響", "えいきょう", "eikyou", "noun", "Ảnh hưởng", "Đã gặp N2 bài 7.", L),
    v(14, "とくしょく", "特色", "とくしょく", "tokushoku", "noun", "Đặc điểm, đặc sắc", "Đã gặp N2 bài 11.", L),
    v(15, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N4 bài 26.", L),
    v(16, "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc", "Đã gặp N4 bài 41.", L),
    v(17, "せかいじゅう", "世界中", "せかいじゅう", "sekaijuu", "noun", "Khắp thế giới", "Đã gặp N4 bài 26.", L),
    v(18, "はってん", "発展", "はってん", "hatten", "noun", "Sự phát triển", "Đã gặp N3 bài 14.", L),
    v(19, "けっか", "結果", "けっか", "kekka", "noun", "Kết quả", "Đã gặp N4 bài 39.", L),
    v(20, "みなさま", "皆様", "みなさま", "minasama", "pronoun", "Quý vị", "Đã gặp N2 bài 1.", L),
]

KANJI = [
    k(1, "記", "KÝ", 10, ["キ (ki)"], ["しる(す)"], "Ghi chép, kỷ niệm.",
      [("記念", "きねん", "Kỷ niệm"), ("日記", "にっき", "Nhật ký")], L),
    k(2, "念", "NIỆM", 8, ["ネン (nen)"], [], "Ý niệm, tưởng nhớ.",
      [("記念", "きねん", "Kỷ niệm"), ("念のため", "ねんのため", "Để chắc chắn")], L),
    k(3, "祝", "CHÚC", 9, ["シュク (shuku)"], ["いわ(う)"], "Chúc mừng.",
      [("祝います", "いわいます", "Chúc mừng"), ("祝日", "しゅくじつ", "Ngày lễ")], L),
    k(4, "創", "SÁNG", 12, ["ソウ (sou)"], [], "Sáng lập, khởi đầu.",
      [("創立", "そうりつ", "Sáng lập, thành lập"), ("創業", "そうぎょう", "Khởi nghiệp")], L),
    k(5, "営", "DOANH", 12, ["エイ (ei)"], ["いとな(む)"], "Kinh doanh, vận hành.",
      [("経営", "けいえい", "Kinh doanh, quản lý"), ("営業", "えいぎょう", "Kinh doanh, bán hàng")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Ôn tập: Mở đầu diễn văn kỷ niệm (に際して + を契機に)",
        "N周年に際して、[phát biểu]。　　Nを契機に、[bước ngoặt khởi đầu]。",
        "Khi mở đầu bài phát biểu kỷ niệm, thường dùng に際して (bài 1 — nhân dịp) để chào hỏi "
        "trang trọng, rồi dùng を契機に (bài 6 — lấy làm cơ hội) để kể lại BƯỚC NGOẶT khởi đầu doanh nghiệp.",
        [
            ex(L, 1, 1, [t("t-l15s1-1", "そうりつ", "創立", "そうりつ", key=True), t("t-l15s1-2", "10"),
                         t("t-l15s1-3", "しゅうねん", "周年", "しゅうねん", key=True), t("t-l15s1-4", "に", key=True),
                         t("t-l15s1-5", "さいして", "際して", "さいして", key=True), t("t-l15s1-6", "、"),
                         t("t-l15s1-7", "ひとこと"), t("t-l15s1-8", "ご"), t("t-l15s1-9", "あいさつ", "挨拶", "あいさつ"),
                         t("t-l15s1-10", "もうしあげます", "申し上げます", "もうしあげます")],
               "Nhân dịp kỷ niệm 10 năm thành lập, tôi xin có đôi lời phát biểu."),
            ex(L, 1, 2, [t("t-l15s1-11", "かいがい", "海外", "かいがい"), t("t-l15s1-12", "りゅうがく", "留学", "りゅうがく"),
                         t("t-l15s1-13", "を"), t("t-l15s1-14", "けいき", "契機", "けいき", key=True), t("t-l15s1-15", "に"),
                         t("t-l15s1-16", "、"), t("t-l15s1-17", "かいしゃ", "会社", "かいしゃ", key=True), t("t-l15s1-18", "を"),
                         t("t-l15s1-19", "そうりつ", "創立", "そうりつ", key=True), t("t-l15s1-20", "しました")],
               "Lấy việc du học nước ngoài làm động lực, tôi đã thành lập công ty."),
        ],
        tips="Ôn nhanh: に際して=nhân dịp sự kiện đang diễn ra (bài 1); を契機に=lấy một sự kiện làm động lực chuyển hướng (bài 6).",
        culture="Diễn văn kỷ niệm thành lập công ty Nhật luôn theo khung: chào hỏi trang trọng (に際して) → kể lại bước ngoặt khởi nghiệp (を契機に)."),

    slide(L, 2,
        "2. Ôn tập: Vượt qua khó khăn (をものともせずに + ざるを得ない)",
        "[khó khăn]をものともせずに、[hành động kiên cường]。[Bất đắc dĩ]ざるを得なかったが、[đã vượt qua]。",
        "Khi kể về giai đoạn khó khăn, thường dùng をものともせずに (bài 9 — ca ngợi kiên cường) "
        "để khen ngợi tinh thần vượt khó, đồng thời thừa nhận đã CÓ LÚC ざるを得ない (bài 2 — bất đắc dĩ) phải thu hẹp quy mô.",
        [
            ex(L, 2, 1, [t("t-l15s2-1", "けいざい", "経済", "けいざい"), t("t-l15s2-2", "の"), t("t-l15s2-3", "もんだい", "問題", "もんだい"),
                         t("t-l15s2-4", "を"), t("t-l15s2-5", "ものともせずに", key=True), t("t-l15s2-6", "、"),
                         t("t-l15s2-7", "けいえい", "経営", "けいえい", key=True), t("t-l15s2-8", "を"),
                         t("t-l15s2-9", "つづけました", "続けました", "つづけました")],
               "Bất chấp vấn đề kinh tế, đã tiếp tục việc kinh doanh."),
            ex(L, 2, 2, [t("t-l15s2-10", "いちじ"), t("t-l15s2-11", "じぎょう", "事業", "じぎょう"), t("t-l15s2-12", "を"),
                         t("t-l15s2-13", "しゅくしょう", "縮小", "しゅくしょう", key=True), t("t-l15s2-14", "せざるを"),
                         t("t-l15s2-15", "えません", "得ません", "えません"), t("t-l15s2-16", "でした"), t("t-l15s2-17", "が"),
                         t("t-l15s2-18", "、"), t("t-l15s2-19", "どりょく", "努力", "どりょく", key=True), t("t-l15s2-20", "を"),
                         t("t-l15s2-21", "つづけました", "続けました", "つづけました")],
               "Có lúc bất đắc dĩ phải thu hẹp sự nghiệp, nhưng đã tiếp tục nỗ lực."),
        ],
        tips="Ôn nhanh: をものともせずに=CA NGỢI sự kiên cường (bài 9); ざるを得ない=thừa nhận sự MIỄN CƯỠNG chủ quan (bài 2) — kết hợp tạo câu chuyện thuyết phục về nghị lực vượt khó.",
        culture="Tiểu sử doanh nhân Nhật luôn có đoạn 'khó khăn' kể theo khung này để tăng tính thuyết phục và cảm động cho câu chuyện thành công."),

    slide(L, 3,
        "3. Ôn tập: Kết quả & xu hướng phát triển (末に + につれて + にとどまらず)",
        "長い努力の末に、[kết quả]。時間が経つにつれて、[xu hướng]は日本にとどまらず、[mở rộng]。",
        "Khi tường thuật KẾT QUẢ sau một hành trình dài, dùng 末に (bài 12 — cuối cùng, sau quá "
        "trình dài) rồi につれて/にしたがって (bài 5) để mô tả XU HƯỚNG PHÁT TRIỂN theo thời gian, "
        "kết thúc bằng にとどまらず (bài 13) để nhấn PHẠM VI mở rộng vượt xa ban đầu.",
        [
            ex(L, 3, 1, [t("t-l15s3-1", "ながい", "長い", "ながい"), t("t-l15s3-2", "どりょく", "努力", "どりょく", key=True),
                         t("t-l15s3-3", "の"), t("t-l15s3-4", "すえに", "末に", "すえに", key=True), t("t-l15s3-5", "、"),
                         t("t-l15s3-6", "かいしゃ", "会社", "かいしゃ", key=True), t("t-l15s3-7", "は"),
                         t("t-l15s3-8", "はってん", "発展", "はってん", key=True), t("t-l15s3-9", "しました")],
               "Sau nỗ lực dài lâu, công ty đã phát triển."),
            ex(L, 3, 2, [t("t-l15s3-10", "じかん", "時間", "じかん"), t("t-l15s3-11", "が"), t("t-l15s3-12", "たつ", "経つ", "たつ"),
                         t("t-l15s3-13", "に"), t("t-l15s3-14", "したがって", "従って", "したがって"), t("t-l15s3-15", "、"),
                         t("t-l15s3-16", "じぎょう", "事業", "じぎょう"), t("t-l15s3-17", "は"), t("t-l15s3-18", "にほん", "日本", "にほん"),
                         t("t-l15s3-19", "に"), t("t-l15s3-20", "とどまらず", key=True), t("t-l15s3-21", "、"),
                         t("t-l15s3-22", "せかいじゅう", "世界中", "せかいじゅう", key=True), t("t-l15s3-23", "に"),
                         t("t-l15s3-24", "はってん", "発展", "はってん", key=True), t("t-l15s3-25", "しました")],
               "Theo thời gian trôi qua, sự nghiệp kinh doanh không chỉ dừng lại ở Nhật Bản mà còn phát triển khắp thế giới."),
        ],
        tips="Ôn nhanh: 末に=kết quả cuối cùng (bài 12); につれて/にしたがって=xu hướng song song theo thời gian (bài 5); にとどまらず=nhấn phạm vi vượt xa ban đầu (bài 13).",
        culture="Đây là khung TƯỜNG THUẬT THÀNH CÔNG kinh điển: kết quả → xu hướng theo thời gian → phạm vi mở rộng, thường thấy trong báo cáo thường niên công ty Nhật."),

    slide(L, 4,
        "4. Ôn tập: Đặc trưng & căn cứ đánh giá (ならではの/にふさわしい + に基づいて)",
        "統計に基づいて、[đánh giá]。この会社ならではの特色は〜。社長にふさわしい能力です。",
        "Khi kết luận bài phát biểu, thường dùng に基づいて (bài 10 — dựa trên căn cứ khách quan) "
        "để đưa ra đánh giá đáng tin cậy, rồi khen ngợi ĐẶC TRƯNG riêng của công ty bằng ならでは"
        "の (bài 11) và năng lực xứng đáng bằng にふさわしい (bài 11).",
        [
            ex(L, 4, 1, [t("t-l15s4-1", "とうけい", "統計", "とうけい"), t("t-l15s4-2", "に"), t("t-l15s4-3", "もとづいて", "基づいて", "もとづいて"),
                         t("t-l15s4-4", "、"), t("t-l15s4-5", "けいえい", "経営", "けいえい", key=True), t("t-l15s4-6", "を"),
                         t("t-l15s4-7", "はんだん", "判断", "はんだん"), t("t-l15s4-8", "します")],
               "Phán đoán việc kinh doanh dựa trên số liệu thống kê."),
            ex(L, 4, 2, [t("t-l15s4-9", "この"), t("t-l15s4-10", "かいしゃ", "会社", "かいしゃ", key=True), t("t-l15s4-11", "ならではの", key=True),
                         t("t-l15s4-12", "とくしょく", "特色", "とくしょく", key=True), t("t-l15s4-13", "は"),
                         t("t-l15s4-14", "、"), t("t-l15s4-15", "しゃいん", "社員", "しゃいん"), t("t-l15s4-16", "の"),
                         t("t-l15s4-17", "どりょく", "努力", "どりょく", key=True), t("t-l15s4-18", "です")],
               "Đặc trưng riêng của công ty này là sự nỗ lực của nhân viên."),
        ],
        tips="Ôn nhanh: に基づいて=căn cứ khách quan chính xác (bài 10); ならではの=đặc trưng độc đáo (bài 11); にふさわしい=xứng đáng theo tiêu chuẩn (bài 11) — bộ ba khép lại một bài phát biểu thuyết phục.",
        culture="Đây là 4 nhóm ngữ pháp N2 cốt lõi thường xuất hiện lồng ghép trong đề đọc hiểu JLPT N2 — nắm vững cách KẾT HỢP chúng trong một bài diễn văn/bài viết hoàn chỉnh quan trọng hơn học thuộc riêng lẻ."),
]

DIALOGUE = [
    line(L, 1, "田中", "MC buổi lễ",
         [t("d15-1", "そうりつ", "創立", "そうりつ", key=True), t("d15-2", "10"), t("d15-3", "しゅうねん", "周年", "しゅうねん", key=True),
          t("d15-4", "に", key=True), t("d15-5", "さいしまして", "際しまして", "さいしまして"), t("d15-6", "、"),
          t("d15-7", "しゃちょう", "社長", "しゃちょう", key=True), t("d15-8", "から"), t("d15-9", "ひとこと")],
         "Nhân dịp kỷ niệm 10 năm thành lập, xin mời giám đốc phát biểu đôi lời."),
    line(L, 2, "サントス", "Giám đốc",
         [t("d15-10", "かいがい", "海外", "かいがい"), t("d15-11", "けいけん", "経験", "けいけん"), t("d15-12", "を"),
          t("d15-13", "けいき", "契機", "けいき", key=True), t("d15-14", "に"), t("d15-15", "、"),
          t("d15-16", "かいしゃ", "会社", "かいしゃ", key=True), t("d15-17", "を"), t("d15-18", "そうりつ", "創立", "そうりつ", key=True),
          t("d15-19", "しました")],
         "Lấy kinh nghiệm ở nước ngoài làm động lực, tôi đã thành lập công ty."),
    line(L, 3, "田中", "MC buổi lễ",
         [t("d15-20", "けいざい", "経済", "けいざい"), t("d15-21", "の"), t("d15-22", "もんだい", "問題", "もんだい"),
          t("d15-23", "を"), t("d15-24", "ものともせずに", key=True), t("d15-25", "、"), t("d15-26", "けいえい", "経営", "けいえい", key=True),
          t("d15-27", "を"), t("d15-28", "つづけました", "続けました", "つづけました"), t("d15-29", "か")],
         "Ông đã bất chấp vấn đề kinh tế để tiếp tục kinh doanh phải không?"),
    line(L, 4, "サントス", "Giám đốc",
         [t("d15-30", "はい"), t("d15-31", "。"), t("d15-32", "いちじ"), t("d15-33", "じぎょう", "事業", "じぎょう"),
          t("d15-34", "を"), t("d15-35", "しゅくしょう", "縮小", "しゅくしょう", key=True), t("d15-36", "せざるを"),
          t("d15-37", "えません", "得ません", "えません"), t("d15-38", "でした")],
         "Vâng. Có lúc bất đắc dĩ phải thu hẹp sự nghiệp."),
    line(L, 5, "田中", "MC buổi lễ",
         [t("d15-39", "ながい", "長い", "ながい"), t("d15-40", "どりょく", "努力", "どりょく", key=True), t("d15-41", "の"),
          t("d15-42", "すえに", "末に", "すえに"), t("d15-43", "、"), t("d15-44", "はってん", "発展", "はってん", key=True),
          t("d15-45", "しました", "為ました", "しました"), t("d15-46", "ね")],
         "Sau nỗ lực dài lâu, đã phát triển nhỉ."),
    line(L, 6, "サントス", "Giám đốc",
         [t("d15-47", "はい"), t("d15-48", "。"), t("d15-49", "じぎょう", "事業", "じぎょう"), t("d15-50", "は"),
          t("d15-51", "にほん", "日本", "にほん"), t("d15-52", "に"), t("d15-53", "とどまらず", key=True), t("d15-54", "、"),
          t("d15-55", "せかいじゅう", "世界中", "せかいじゅう", key=True), t("d15-56", "に"), t("d15-57", "はってん", "発展", "はってん", key=True),
          t("d15-58", "しました")],
         "Vâng. Sự nghiệp không chỉ dừng lại ở Nhật Bản mà còn phát triển khắp thế giới."),
    line(L, 7, "田中", "MC buổi lễ",
         [t("d15-59", "とうけい", "統計", "とうけい"), t("d15-60", "に"), t("d15-61", "もとづいて", "基づいて", "もとづいて"),
          t("d15-62", "、"), t("d15-63", "らいねん", "来年", "らいねん"), t("d15-64", "の"), t("d15-65", "けいかく", "計画", "けいかく"),
          t("d15-66", "は"), t("d15-67", "どうですか")],
         "Dựa trên số liệu thống kê, kế hoạch năm sau thế nào?"),
    line(L, 8, "サントス", "Giám đốc",
         [t("d15-68", "この"), t("d15-69", "かいしゃ", "会社", "かいしゃ", key=True), t("d15-70", "ならではの", key=True),
          t("d15-71", "とくしょく", "特色", "とくしょく", key=True), t("d15-72", "を"), t("d15-73", "いかして", "生かして", "いかして"),
          t("d15-74", "、"), t("d15-75", "あたらしい", "新しい", "あたらしい"), t("d15-76", "ぶんや", "分野", "ぶんや", key=True),
          t("d15-77", "に"), t("d15-78", "すすみます", "進みます", "すすみます")],
         "Sẽ tận dụng đặc trưng riêng của công ty này để tiến vào lĩnh vực mới."),
    line(L, 9, "田中", "MC buổi lễ",
         [t("d15-79", "しゃちょう", "社長", "しゃちょう", key=True), t("d15-80", "に"), t("d15-81", "ふさわしい", key=True),
          t("d15-82", "のうりょく", "能力", "のうりょく", key=True), t("d15-83", "です", "です", "です"), t("d15-84", "ね")],
         "Đó là năng lực xứng đáng với một giám đốc nhỉ."),
    line(L, 10, "サントス", "Giám đốc",
         [t("d15-85", "みなさま", "皆様", "みなさま", key=True), t("d15-86", "、"), t("d15-87", "きょう", "今日", "きょう"),
          t("d15-88", "は"), t("d15-89", "きねん", "記念", "きねん", key=True), t("d15-90", "を"),
          t("d15-91", "いわって", "祝って", "いわって"), t("d15-92", "くださって"), t("d15-93", "ありがとうございます", "ありがとうございます", "ありがとうございます")],
         "Kính thưa quý vị, hôm nay xin cảm ơn đã đến chúc mừng kỷ niệm."),
]

EXERCISES = [
    q(L, 1, "「創立10周年に際しまして、社長からひとこと」 — kết hợp cấu trúc nào để mở đầu diễn văn?",
      ["に際して (bài 1, nhân dịp sự kiện) để chào hỏi trang trọng",
       "ざるを得ない (bài 2)", "をものともせずに (bài 9)", "にとどまらず (bài 13)"], 0,
      "に際して (bài 1) dùng để mở đầu bài phát biểu nhân dịp một sự kiện quan trọng đang diễn ra.",
      "Xem slide 1 về に際して + を契機に."),
    q(L, 2, "「海外経験を契機に、会社を創立しました」 — を契機に diễn tả điều gì?",
      ["Lấy một sự kiện làm cơ hội/động lực để bắt đầu một bước ngoặt (bài 6)",
       "Bị buộc phải làm điều gì đó (bài 2)", "Không chỉ dừng lại ở một phạm vi (bài 13)",
       "Xứng đáng với một tiêu chuẩn (bài 11)"], 0,
      "を契機に (bài 6) diễn tả việc lấy kinh nghiệm nước ngoài làm động lực để thành lập công ty — một bước ngoặt cá nhân.",
      "Xem slide 1 về を契機に."),
    q(L, 3, "「経済の問題をものともせずに、経営を続けました」 kết hợp với「一時、縮小せざるを得ませんでした」 để làm gì?",
      ["Vừa CA NGỢI sự kiên cường (をものともせずに, bài 9), vừa thừa nhận khó khăn thực tế (ざるを得ない, bài 2)",
       "Chỉ để phủ định hoàn toàn câu chuyện", "Chỉ để so sánh hai công ty khác nhau",
       "Không có mục đích rõ ràng"], 0,
      "Kết hợp hai cấu trúc tạo câu chuyện THUYẾT PHỤC: vừa kiên cường vượt khó, vừa trung thực về khó khăn đã gặp phải.",
      "Xem slide 2 về をものともせずに + ざるを得ない."),
    q(L, 4, "「事業は日本にとどまらず、世界中に発展しました」 — にとどまらず (bài 13) nhấn mạnh điều gì trong ngữ cảnh này?",
      ["Phạm vi phát triển thực tế (thế giới) vượt xa phạm vi ban đầu (chỉ Nhật Bản)",
       "Sự nghiệp đã thất bại hoàn toàn", "Công ty chỉ hoạt động ở Nhật Bản",
       "Không có sự phát triển nào"], 0,
      "にとどまらず nhấn mạnh việc phạm vi phát triển đã VƯỢT XA giới hạn ban đầu (chỉ Nhật Bản) để lan ra toàn thế giới.",
      "Xem slide 3 về 末に + につれて + にとどまらず."),
    q(L, 5, "「統計に基づいて、経営を判断します」 — に基づいて (bài 10) yêu cầu điều gì về căn cứ?",
      ["Phải TUÂN THỦ CHÍNH XÁC nội dung của căn cứ (số liệu thống kê), không được tự ý thay đổi",
       "Có thể thay đổi tự do theo ý muốn", "Không cần căn cứ nào cả",
       "Chỉ cần cảm tính cá nhân"], 0,
      "に基づいて (bài 10) yêu cầu phán đoán phải PHÙ HỢP CHÍNH XÁC với căn cứ khách quan (số liệu thống kê).",
      "Xem slide 4 về に基づいて + ならではの + にふさわしい."),
    q(L, 6, "「この会社ならではの特色」 và 「社長にふさわしい能力」 khác nhau ở điểm nào?",
      ["ならではの (bài 11) nhấn tính ĐỘC ĐÁO chỉ công ty này có; にふさわしい (bài 11) nhấn sự PHÙ HỢP theo tiêu chuẩn",
       "Hoàn toàn giống nhau", "ならではの chỉ dùng cho phủ định",
       "にふさわしい chỉ dùng cho câu hỏi"], 0,
      "ならではの nhấn ĐẶC TRƯNG DUY NHẤT; にふさわしい nhấn SỰ TƯƠNG XỨNG với một tiêu chuẩn/vai trò — cả hai đã học ở bài 11.",
      "Ôn lại bài 11 về ならではの vs にふさわしい."),
    q(L, 7, "Theo hội thoại, Santos đã thành lập công ty nhờ động lực gì?",
      ["Kinh nghiệm ở nước ngoài (海外経験を契機に)", "Lời khuyên của bạn bè",
       "Yêu cầu của gia đình", "Không có động lực cụ thể"], 0,
      "Santos nói 「海外経験を契機に、会社を創立しました」.",
      "Xem câu thoại thứ 2."),
    q(L, 8, "Công ty của Santos đã từng gặp khó khăn gì?",
      ["Có lúc bất đắc dĩ phải thu hẹp sự nghiệp (一時、事業を縮小せざるを得ませんでした)",
       "Chưa từng gặp khó khăn nào", "Đã phá sản hoàn toàn",
       "Không được đề cập trong hội thoại"], 0,
      "Santos nói 「一時、事業を縮小せざるを得ませんでした」.",
      "Xem câu thoại thứ 4."),
    q(L, 9, "Phạm vi hoạt động hiện tại của công ty là gì?",
      ["Không chỉ Nhật Bản mà còn khắp thế giới (日本にとどまらず、世界中に発展しました)",
       "Chỉ trong nội địa Nhật Bản", "Chỉ ở một thành phố", "Đã ngừng hoạt động"], 0,
      "Santos nói 「事業は日本にとどまらず、世界中に発展しました」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Kế hoạch tương lai của công ty dựa trên điều gì?",
      ["Đặc trưng riêng của công ty (この会社ならではの特色を生かして)",
       "Chỉ dựa trên may mắn", "Không có kế hoạch nào", "Sao chép công ty khác"], 0,
      "Santos nói 「この会社ならではの特色を生かして、新しい分野に進みます」.",
      "Xem câu thoại thứ 8."),
]

LESSON = lesson(
    L,
    "Bài 15: Tổng kết chiến lược đọc hiểu & ngữ pháp N2",
    "Bài tổng kết N2 kết hợp các cấu trúc trọng điểm đã học qua một bài phát biểu kỷ niệm thành "
    "lập công ty thực tế: に際して + を契機に (mở đầu diễn văn → bước ngoặt khởi đầu), ざるを得ない "
    "+ をものともせずに (thừa nhận khó khăn → ca ngợi kiên cường), 末に + につれて + にとどまらず "
    "(kết quả → xu hướng theo thời gian → phạm vi mở rộng), và に基づいて + ならではの + "
    "にふさわしい (căn cứ khách quan → đặc trưng độc đáo → sự xứng đáng) — nắm vững cách KẾT HỢP "
    "các cấu trúc này quan trọng hơn học thuộc riêng lẻ, đúng như cách chúng xuất hiện trong đề "
    "thi JLPT N2 thực tế. Hoàn thành trọn vẹn 15/15 bài N2, khép lại toàn bộ hành trình N5→N2!",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
