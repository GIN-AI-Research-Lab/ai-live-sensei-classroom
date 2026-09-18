# -*- coding: utf-8 -*-
"""N1 — Bai 6: Khong duoc phep & Dao duc cuong vi — Vる+まじき+N (hanh vi/loi noi
KHONG THE/KHONG DUOC PHEP [V]) va N(cuong vi)にあるまじき+N2 (N2 KHONG XUNG DANG
co o cuong vi N — phe phan manh me hanh vi trai dao duc nghe nghiep/dia vi).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 6
pool = Pool("n1")

VOCAB = [
    v(1,  "こうい", "行為", "こうい", "koui", "noun", "Hành vi, hành động", "許すまじき 行為 = hành vi không thể tha thứ.", L),
    v(2,  "はつげん", "発言", "はつげん", "hatsugen", "noun", "Phát ngôn, lời phát biểu", "あるまじき 発言 = phát ngôn không xứng đáng.", L),
    v(3,  "ぎいん", "議員", "ぎいん", "giin", "noun", "Nghị sĩ, đại biểu quốc hội", "議員に あるまじき = không xứng với [tư cách] nghị sĩ.", L),
    v(4,  "はんざい", "犯罪", "はんざい", "hanzai", "noun", "Tội ác, tội phạm", "許すまじき 犯罪 = tội ác không thể tha thứ.", L),
    v(5,  "ふせい", "不正", "ふせい", "fusei", "noun", "Sự bất chính, gian lận", "不正な 言動 = lời nói/hành động bất chính.", L),
    v(6,  "げんどう", "言動", "げんどう", "gendou", "noun", "Lời nói và hành động, ngôn hành", "不正な 言動 = ngôn hành bất chính.", L),
    v(7,  "しんらい", "信頼", "しんらい", "shinrai", "noun", "Sự tin cậy", "信頼を 失います = đánh mất lòng tin.", L),
    v(8,  "うしないます", "失います", "うしないます", "ushinaimasu", "verb", "Đánh mất", "信頼を 失います = đánh mất lòng tin.", L),
    v(9,  "きょうし", "教師", "きょうし", "kyoushi", "noun", "Giáo viên", "Đã gặp N5 bài 1.", L),
    v(10, "せいじか", "政治家", "せいじか", "seijika", "noun", "Chính trị gia", "Đã gặp N1 bài 3.", L),
    v(11, "ゆるします", "許します", "ゆるします", "yurushimasu", "verb", "Tha thứ, cho phép", "Đã gặp N2 bài 14.", L),
    v(12, "たちば", "立場", "たちば", "tachiba", "noun", "Lập trường, vị trí, cương vị", "Đã gặp N1 bài 3.", L),
    v(13, "じたい", "事態", "じたい", "jitai", "noun", "Tình thế, tình huống", "Đã gặp N1 bài 5.", L),
    v(14, "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc", "Đã gặp N4 bài 41.", L),
    v(15, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N3 bài 13.", L),
    v(16, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N5 bài 3.", L),
    v(17, "しんこく", "深刻", "しんこく", "shinkoku", "adjective", "Nghiêm trọng", "Đã gặp N1 bài 5.", L),
    v(18, "いいます", "言います", "いいます", "iimasu", "verb", "Nói", "Đã gặp N5 bài 21.", L),
    v(19, "しんじます", "信じます", "しんじます", "shinjimasu", "verb", "Tin tưởng", "Đã gặp N3 bài 1.", L),
    v(20, "しゃいん", "社員", "しゃいん", "shain", "noun", "Nhân viên", "Đã gặp N5 bài 1.", L),
]

KANJI = [
    k(1, "行", "HÀNH", 6, ["コウ (kou)", "ギョウ (gyou)"], ["い(く)", "おこな(う)"], "Đi, làm, thực hiện.",
      [("行為", "こうい", "Hành vi"), ("行きます", "いきます", "Đi")], L),
    k(2, "罪", "TỘI", 13, ["ザイ (zai)"], ["つみ"], "Tội lỗi.",
      [("犯罪", "はんざい", "Tội ác"), ("罪", "つみ", "Tội lỗi")], L),
    k(3, "信", "TÍN", 9, ["シン (shin)"], [], "Tin tưởng, tín nhiệm.",
      [("信頼", "しんらい", "Sự tin cậy"), ("信じます", "しんじます", "Tin tưởng")], L),
    k(4, "議", "NGHỊ", 20, ["ギ (gi)"], [], "Bàn luận, nghị sự.",
      [("議員", "ぎいん", "Nghị sĩ"), ("会議", "かいぎ", "Cuộc họp")], L),
    k(5, "失", "THẤT", 5, ["シツ (shitsu)"], ["うしな(う)"], "Mất, đánh mất.",
      [("失います", "うしないます", "Đánh mất"), ("失敗", "しっぱい", "Thất bại")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Không thể/không được phép [làm]... : Vる + まじき + N",
        "V(thể từ điển) + まじき + N",
        "まじき là dạng PHỦ ĐỊNH CỔ của べき (nên làm) — Vるまじき+N nghĩa là 'N (hành vi/lời nói/tội "
        "lỗi) mà KHÔNG THỂ/KHÔNG ĐƯỢC PHÉP [V]'. Văn phong CỰC KỲ TRANG TRỌNG, mang tính PHÊ PHÁN "
        "ĐẠO ĐỨC mạnh mẽ — chỉ dùng cho những việc bị coi là SAI TRÁI NGHIÊM TRỌNG.",
        [
            ex(L, 1, 1, [t("t-l6s1-1", "これ"), t("t-l6s1-2", "は"), t("t-l6s1-3", "ゆるす", "許す", "ゆるす"),
                         t("t-l6s1-4", "まじき", key=True), t("t-l6s1-5", "はんざい", "犯罪", "はんざい", key=True),
                         t("t-l6s1-6", "だ")],
               "Đây là một tội ác không thể tha thứ."),
            ex(L, 1, 2, [t("t-l6s1-7", "ぎいん", "議員", "ぎいん", key=True), t("t-l6s1-8", "は"),
                         t("t-l6s1-9", "いう", "言う", "いう"), t("t-l6s1-10", "まじき", key=True), t("t-l6s1-11", "こと"),
                         t("t-l6s1-12", "を"), t("t-l6s1-13", "いいました", "言いました", "いいました")],
               "Nghị sĩ đã nói điều không được phép nói."),
        ],
        tips="まじき chỉ đi sau ĐỘNG TỪ ở thể từ điển, và luôn đứng trước MỘT DANH TỪ (hành vi/lời nói/tội lỗi) — không dùng độc lập cuối câu.",
        culture="許すまじき hay xuất hiện trong tuyên bố chính thức lên án tội ác nghiêm trọng (khủng bố, tham nhũng) trên truyền thông Nhật, mang sắc thái trang trọng như một bản án đạo đức."),

    slide(L, 2,
        "2. Không xứng đáng có ở cương vị... : N(cương vị) + にあるまじき + N2",
        "N(cương vị/nghề nghiệp) + にあるまじき + N2(hành vi/phát ngôn)",
        "にあるまじき là cụm cố định (ある + まじき) đi sau MỘT CƯƠNG VỊ/NGHỀ NGHIỆP, nghĩa là 'N2 "
        "(hành vi/phát ngôn) mà KHÔNG XỨNG ĐÁNG/KHÔNG ĐƯỢC PHÉP TỒN TẠI ở [cương vị] N' — phê phán "
        "một người đã hành xử TRÁI với TƯ CÁCH/ĐẠO ĐỨC NGHỀ NGHIỆP của chính mình.",
        [
            ex(L, 2, 1, [t("t-l6s2-1", "それ"), t("t-l6s2-2", "は"), t("t-l6s2-3", "せいじか", "政治家", "せいじか", key=True),
                         t("t-l6s2-4", "に"), t("t-l6s2-5", "あるまじき", key=True), t("t-l6s2-6", "はつげん", "発言", "はつげん", key=True),
                         t("t-l6s2-7", "だ")],
               "Đó là phát ngôn không xứng với [tư cách] một chính trị gia."),
            ex(L, 2, 2, [t("t-l6s2-8", "きょうし", "教師", "きょうし", key=True), t("t-l6s2-9", "に"),
                         t("t-l6s2-10", "あるまじき", key=True), t("t-l6s2-11", "こうい", "行為", "こうい", key=True),
                         t("t-l6s2-12", "だ")],
               "Đó là hành vi không xứng với [tư cách] một giáo viên."),
        ],
        tips="Phân biệt: まじき đi sau ĐỘNG TỪ (hành động cụ thể); にあるまじき đi sau CƯƠNG VỊ/NGHỀ NGHIỆP (so sánh hành vi với tư cách của người đó).",
        culture="Cụm '議員にあるまじき発言' hay 'あるまじき行為' là câu cửa miệng của phát ngôn viên/nhà báo Nhật khi lên án hành vi của quan chức, giáo viên, cảnh sát... đi ngược lại đạo đức nghề nghiệp."),

    slide(L, 3,
        "3. Hậu quả của hành vi あるまじき: mất lòng tin",
        "不正な言動 + は、信頼を + 失います",
        "Khi một người có hành vi/phát ngôn bị coi là あるまじき (không xứng với cương vị), hậu quả "
        "thường được diễn tả bằng 信頼を失う (đánh mất lòng tin) — đây là cách nói TRANG TRỌNG, hay "
        "gặp trong tin tức khi tường thuật hậu quả của một vụ bê bối.",
        [
            ex(L, 3, 1, [t("t-l6s3-1", "ふせいな", "不正な", "ふせいな", key=True), t("t-l6s3-2", "げんどう", "言動", "げんどう", key=True),
                         t("t-l6s3-3", "は"), t("t-l6s3-4", "、"), t("t-l6s3-5", "しんらい", "信頼", "しんらい", key=True),
                         t("t-l6s3-6", "を"), t("t-l6s3-7", "うしないます", "失います", "うしないます", key=True)],
               "Lời nói và hành động bất chính sẽ đánh mất lòng tin."),
            ex(L, 3, 2, [t("t-l6s3-8", "せいじか", "政治家", "せいじか", key=True), t("t-l6s3-9", "に"),
                         t("t-l6s3-10", "あるまじき", key=True), t("t-l6s3-11", "ふせい", "不正", "ふせい", key=True),
                         t("t-l6s3-12", "だ")],
               "Đó là sự bất chính không xứng với [tư cách] một chính trị gia."),
        ],
        tips="信頼を失う là hệ quả THƯỜNG XUYÊN đi kèm あるまじき trong văn phong tường thuật — ghi nhớ cặp đôi này để viết bài phê phán tự nhiên hơn.",
        culture="Ở Nhật, mất 信頼 (lòng tin của công chúng) thường nghiêm trọng hơn cả hình phạt pháp lý đối với quan chức/chính trị gia — đây là lý do từ ngữ này xuất hiện dày đặc trên báo chí."),

    slide(L, 4,
        "4. Kết hợp まじき và にあるまじき trong một bài tường thuật hoàn chỉnh",
        "許すまじき + N (lên án hành vi) + N(cương vị)にあるまじき + N2 (chỉ rõ ai sai, sai ở đâu)",
        "Trong một bài tường thuật phê phán hoàn chỉnh, thường mở đầu bằng 許すまじき+N để LÊN ÁN "
        "mức độ nghiêm trọng của sự việc nói chung, sau đó dùng N(cương vị)にあるまじきN2 để CHỈ ĐÍCH "
        "DANH người vi phạm và nêu rõ hành vi/phát ngôn cụ thể trái với cương vị của họ.",
        [
            ex(L, 4, 1, [t("t-l6s4-1", "これ"), t("t-l6s4-2", "は"), t("t-l6s4-3", "ゆるす", "許す", "ゆるす"),
                         t("t-l6s4-4", "まじき", key=True), t("t-l6s4-5", "ふせい", "不正", "ふせい", key=True), t("t-l6s4-6", "だ")],
               "Đây là sự bất chính không thể tha thứ."),
            ex(L, 4, 2, [t("t-l6s4-7", "ぎいん", "議員", "ぎいん", key=True), t("t-l6s4-8", "に"),
                         t("t-l6s4-9", "あるまじき", key=True), t("t-l6s4-10", "げんどう", "言動", "げんどう", key=True),
                         t("t-l6s4-11", "で"), t("t-l6s4-12", "、"), t("t-l6s4-13", "しんらい", "信頼", "しんらい", key=True),
                         t("t-l6s4-14", "を"), t("t-l6s4-15", "うしないました", "失いました", "うしないました")],
               "Vì lời nói và hành động không xứng với [tư cách] nghị sĩ, đã đánh mất lòng tin."),
        ],
        tips="Cả まじき và にあるまじき đều là văn phong VIẾT/TRANG TRỌNG (xã luận, tuyên bố chính thức) — hiếm khi dùng trong hội thoại đời thường.",
        culture="Cấu trúc phê phán kinh điển trên báo Nhật: mở đầu bằng nhận định mức độ (許すまじき) → chỉ đích danh và hành vi cụ thể (にあるまじき) → nêu hậu quả (信頼を失う)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Người dẫn chương trình",
         [t("d6-1", "ぎいん", "議員", "ぎいん", key=True), t("d6-2", "の"), t("d6-3", "ふせい", "不正", "ふせい", key=True),
          t("d6-4", "について"), t("d6-5", "はなします", "話します", "はなします")],
         "Chúng ta nói về sự bất chính của nghị sĩ."),
    line(L, 2, "山本", "Chuyên gia kinh tế",
         [t("d6-6", "これ"), t("d6-7", "は"), t("d6-8", "ゆるす", "許す", "ゆるす"), t("d6-9", "まじき", key=True),
          t("d6-10", "はんざい", "犯罪", "はんざい", key=True), t("d6-11", "です")],
         "Đây là một tội ác không thể tha thứ."),
    line(L, 3, "田中", "Người dẫn chương trình",
         [t("d6-12", "ぎいん", "議員", "ぎいん", key=True), t("d6-13", "は"), t("d6-14", "なんと", "何と", "なんと"),
          t("d6-15", "いいましたか", "言いましたか", "いいましたか")],
         "Nghị sĩ đã nói gì?"),
    line(L, 4, "山本", "Chuyên gia kinh tế",
         [t("d6-16", "ぎいん", "議員", "ぎいん", key=True), t("d6-17", "に"), t("d6-18", "あるまじき", key=True),
          t("d6-19", "はつげん", "発言", "はつげん", key=True), t("d6-20", "を"), t("d6-21", "しました")],
         "Ông ấy đã có phát ngôn không xứng với [tư cách] nghị sĩ."),
    line(L, 5, "田中", "Người dẫn chương trình",
         [t("d6-22", "どんな"), t("d6-23", "はつげん", "発言", "はつげん", key=True), t("d6-24", "でしたか")],
         "Đó là phát ngôn thế nào?"),
    line(L, 6, "山本", "Chuyên gia kinh tế",
         [t("d6-25", "いう", "言う", "いう"), t("d6-26", "まじき", key=True), t("d6-27", "こと"),
          t("d6-28", "を"), t("d6-29", "いいました", "言いました", "いいました")],
         "Ông ấy đã nói điều không được phép nói."),
    line(L, 7, "田中", "Người dẫn chương trình",
         [t("d6-30", "しゃいん", "社員", "しゃいん", key=True), t("d6-31", "は"), t("d6-32", "どう"), t("d6-33", "おもいましたか", "思いましたか", "おもいましたか")],
         "Người dân nghĩ sao?"),
    line(L, 8, "山本", "Chuyên gia kinh tế",
         [t("d6-34", "ふせいな", "不正な", "ふせいな", key=True), t("d6-35", "げんどう", "言動", "げんどう", key=True),
          t("d6-36", "で"), t("d6-37", "、"), t("d6-38", "しんらい", "信頼", "しんらい", key=True), t("d6-39", "を"),
          t("d6-40", "うしないました", "失いました", "うしないました")],
         "Vì lời nói và hành động bất chính, đã đánh mất lòng tin."),
    line(L, 9, "田中", "Người dẫn chương trình",
         [t("d6-41", "ぎいん", "議員", "ぎいん", key=True), t("d6-42", "の"), t("d6-43", "たちば", "立場", "たちば", key=True),
          t("d6-44", "は"), t("d6-45", "どう"), t("d6-46", "なりますか")],
         "Vị trí của nghị sĩ rồi sẽ ra sao?"),
    line(L, 10, "山本", "Chuyên gia kinh tế",
         [t("d6-47", "ぎいん", "議員", "ぎいん", key=True), t("d6-48", "に"), t("d6-49", "あるまじき", key=True),
          t("d6-50", "こうい", "行為", "こうい", key=True), t("d6-51", "でした")],
         "Đó là hành vi không xứng với [tư cách] nghị sĩ."),
]

EXERCISES = [
    q(L, 1, "「これは許すまじき犯罪だ」 — まじき diễn tả điều gì?",
      ["Hành vi/tội lỗi mà KHÔNG THỂ/KHÔNG ĐƯỢC PHÉP làm — dạng phủ định cổ của べき",
       "Sự cho phép làm việc gì đó", "Lời khuyên nhẹ nhàng", "Sự nghi ngờ về khả năng"], 0,
      "まじき là dạng phủ định cổ của べき (nên làm), nghĩa là 'không được phép/không thể [V]'.",
      "Xem cấu trúc まじき ở slide 1."),
    q(L, 2, "「それは政治家にあるまじき発言だ」 — にあるまじき dùng để làm gì?",
      ["Chỉ ra hành vi/phát ngôn KHÔNG XỨNG ĐÁNG với một cương vị/nghề nghiệp cụ thể",
       "Diễn tả một quá trình dẫn đến kết quả", "Xin phép làm việc gì đó",
       "Đưa ra lời khuyên"], 0,
      "にあるまじき đi sau một CƯƠNG VỊ, nghĩa là hành vi/phát ngôn đó không xứng đáng tồn tại ở cương vị ấy.",
      "Xem cấu trúc にあるまじき ở slide 2."),
    q(L, 3, "Sự khác biệt cốt lõi giữa まじき và にあるまじき là gì?",
      ["まじき đi sau ĐỘNG TỪ (hành động cụ thể); にあるまじき đi sau CƯƠNG VỊ/NGHỀ NGHIỆP",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "まじき chỉ dùng cho câu hỏi", "にあるまじき chỉ dùng cho câu phủ định"], 0,
      "まじき gắn sau động từ thể từ điển; にあるまじき gắn sau một cương vị/nghề nghiệp để so sánh với hành vi thực tế.",
      "Xem bảng phân biệt ở slide 2."),
    q(L, 4, "「議員は言うまじきことを言いました」 nghĩa là:",
      ["Nghị sĩ đã nói điều không được phép nói",
       "Nghị sĩ đã im lặng không nói gì", "Nghị sĩ đã nói điều rất đúng đắn",
       "Nghị sĩ đã xin lỗi công khai"], 0,
      "言うまじきこと nghĩa là 'điều không được phép nói' — まじき phủ định hành động 言う (nói).",
      "Áp dụng cấu trúc まじき cho ngữ cảnh phát ngôn."),
    q(L, 5, "「不正な言動は、信頼を失います」 nghĩa là:",
      ["Lời nói và hành động bất chính sẽ đánh mất lòng tin",
       "Lời nói và hành động bất chính sẽ tăng thêm lòng tin", "Không ai quan tâm đến lời nói bất chính",
       "Lòng tin không liên quan đến lời nói và hành động"], 0,
      "信頼を失います (đánh mất lòng tin) là hậu quả thường đi kèm hành vi あるまじき.",
      "Xem cặp đôi あるまじき + 信頼を失う ở slide 3."),
    q(L, 6, "Tại sao まじき và にあるまじき thường xuất hiện CÙNG NHAU trong một bài tường thuật phê phán?",
      ["Để lên án mức độ nghiêm trọng chung (許すまじき) rồi chỉ đích danh người vi phạm cụ thể (にあるまじき)",
       "Vì chúng có nghĩa giống hệt nhau nên dùng thay phiên", "Không có lý do đặc biệt",
       "Vì quy tắc ngữ pháp bắt buộc phải dùng chung"], 0,
      "許すまじき lên án chung mức độ nghiêm trọng; にあるまじき chỉ rõ ai sai và sai ở đâu so với cương vị của họ.",
      "Xem kỹ thuật tường thuật ở slide 4."),
    q(L, 7, "「教師にあるまじき行為だ」 nghĩa là:",
      ["Đó là hành vi không xứng với [tư cách] một giáo viên",
       "Đó là hành vi rất xứng đáng với một giáo viên", "Giáo viên đã làm đúng quy định",
       "Không liên quan gì đến giáo viên"], 0,
      "にあるまじき ở đây so sánh hành vi với tư cách/đạo đức nghề nghiệp của một giáo viên.",
      "Áp dụng cấu trúc にあるまじき cho ngữ cảnh giáo viên."),
    q(L, 8, "Theo hội thoại, nghị sĩ đã có loại phát ngôn như thế nào?",
      ["Phát ngôn không xứng với [tư cách] nghị sĩ (議員にあるまじき発言)", "Phát ngôn rất chuẩn mực",
       "Không phát ngôn gì cả", "Phát ngôn được mọi người khen ngợi"], 0,
      "Chuyên gia nói 「議員にあるまじき発言をしました」.",
      "Xem câu thoại thứ 4."),
    q(L, 9, "Theo hội thoại, hậu quả của lời nói/hành động bất chính của nghị sĩ là gì?",
      ["Đánh mất lòng tin (信頼を失いました)", "Được tăng thêm uy tín",
       "Không có hậu quả gì", "Được bầu lại ngay lập tức"], 0,
      "Chuyên gia nói 「不正な言動で、信頼を失いました」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Theo hội thoại, hành vi của nghị sĩ được đánh giá thế nào so với cương vị của ông ấy?",
      ["Là hành vi không xứng với [tư cách] nghị sĩ (議員にあるまじき行為でした)",
       "Là hành vi hoàn toàn xứng đáng", "Không được đề cập trong hội thoại",
       "Là hành vi được pháp luật cho phép"], 0,
      "Chuyên gia kết luận 「議員にあるまじき行為でした」.",
      "Xem câu thoại thứ 10."),
]

LESSON = lesson(
    L,
    "Bài 6: Không được phép & Đạo đức cương vị (まじき & あるまじき)",
    "Vる+まじき+N diễn tả một hành vi/lời nói/tội lỗi mà KHÔNG THỂ/KHÔNG ĐƯỢC PHÉP [V] — dạng phủ "
    "định cổ của べき, mang tính phê phán đạo đức mạnh mẽ; N(cương vị)にあるまじき+N2 chỉ ra một hành "
    "vi/phát ngôn KHÔNG XỨNG ĐÁNG tồn tại ở một cương vị/nghề nghiệp cụ thể, thường đi kèm hậu quả "
    "信頼を失う (đánh mất lòng tin) — cả hai đều là văn phong trang trọng, hay gặp trong tường thuật phê phán trên báo chí.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
