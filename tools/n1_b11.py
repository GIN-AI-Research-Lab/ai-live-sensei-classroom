# -*- coding: utf-8 -*-
"""N1 — Bai 11: Can cu phap ly & Chuan muc — に即して (bam sat/dua sat theo mot
THUC TE CU THE dang dien ra -- tinh hinh, kinh nghiem, thuc trang vu viec -- de
dua ra hanh dong/nhan dinh) va に則って (tuan theo mot cach CHINH THUC, trang
trong mot QUY TAC/PHAP LUAT/TIEN LE/TRUYEN THONG da duoc thiet lap tu truoc).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 11
pool = Pool("n1")

VOCAB = [
    v(1,  "じったい", "実態", "じったい", "jittai", "noun", "Thực trạng, tình hình thực tế", "市場の 実態を 調べます = điều tra thực trạng thị trường.", L),
    v(2,  "かんしゅう", "慣習", "かんしゅう", "kanshuu", "noun", "Tập quán, thông lệ", "地域の 慣習に 従います = tuân theo tập quán địa phương.", L),
    v(3,  "ぜんれい", "前例", "ぜんれい", "zenrei", "noun", "Tiền lệ", "前例が ない = không có tiền lệ.", L),
    v(4,  "はんけつ", "判決", "はんけつ", "hanketsu", "noun", "Phán quyết, bản án", "判決を 下します = đưa ra phán quyết.", L),
    v(5,  "そしょう", "訴訟", "そしょう", "soshou", "noun", "Vụ kiện, việc kiện tụng", "訴訟を 起こします = khởi kiện.", L),
    v(6,  "そくします", "即します", "そくします", "sokushimasu", "verb", "Bám sát, phù hợp theo (thực tế)", "実態に 即した 対応 = cách ứng phó bám sát thực tế.", L),
    v(7,  "さいばん", "裁判", "さいばん", "saiban", "noun", "Phiên tòa, việc xét xử", "裁判で 争います = tranh chấp tại tòa án.", L),
    v(8,  "べんごし", "弁護士", "べんごし", "bengoshi", "noun", "Luật sư", "弁護士に 相談します = tham khảo ý kiến luật sư.", L),
    v(9,  "じじつ", "事実", "じじつ", "jijitsu", "noun", "Sự thật", "Đã gặp N2 bài 10.", L),
    v(10, "きそく", "規則", "きそく", "kisoku", "noun", "Quy tắc, nội quy", "Đã gặp N4 bài 28.", L),
    v(11, "ほうりつ", "法律", "ほうりつ", "houritsu", "noun", "Pháp luật", "Đã gặp N2 bài 10.", L),
    v(12, "でんとう", "伝統", "でんとう", "dentou", "noun", "Truyền thống", "Đã gặp N2 bài 11.", L),
    v(13, "ぎしき", "儀式", "ぎしき", "gishiki", "noun", "Nghi lễ, nghi thức", "Đã gặp N2 bài 1.", L),
    v(14, "きじゅん", "基準", "きじゅん", "kijun", "noun", "Tiêu chuẩn, căn cứ", "Đã gặp N2 bài 10.", L),
    v(15, "しょうこ", "証拠", "しょうこ", "shouko", "noun", "Chứng cứ, bằng chứng", "Đã gặp N1 bài 7.", L),
    v(16, "しゅうかん", "習慣", "しゅうかん", "shuukan", "noun", "Thói quen, tập quán", "Đã gặp N4 bài 28.", L),
    v(17, "とうけい", "統計", "とうけい", "toukei", "noun", "Thống kê", "Đã gặp N2 bài 10.", L),
    v(18, "きてい", "規定", "きてい", "kitei", "noun", "Quy định (chính thức, văn bản)", "Đã gặp N3 bài 3.", L),
    v(19, "じけん", "事件", "じけん", "jiken", "noun", "Vụ việc, sự kiện", "Đã gặp N1 bài 2.", L),
    v(20, "したがいます", "従います", "したがいます", "shitagaimasu", "verb", "Tuân theo, phục tùng", "Đã gặp N3 bài 19.", L),
]

KANJI = [
    k(1, "即", "TỨC", 7, ["ソク (soku)"], ["すなわ(ち)"], "Ngay lập tức, tức là.",
      [("即します", "そくします", "Bám sát theo, phù hợp với"), ("即座に", "そくざに", "Ngay lập tức")], L),
    k(2, "則", "TẮC", 9, ["ソク (soku)"], ["のっと(る)"], "Quy tắc, phép tắc.",
      [("規則", "きそく", "Quy tắc"), ("原則", "げんそく", "Nguyên tắc")], L),
    k(3, "態", "THÁI", 14, ["タイ (tai)"], [], "Trạng thái, dáng vẻ.",
      [("実態", "じったい", "Thực trạng"), ("状態", "じょうたい", "Trạng thái")], L),
    k(4, "慣", "QUÁN", 14, ["カン (kan)"], ["な(れる)"], "Quen thuộc, tập quán.",
      [("慣習", "かんしゅう", "Tập quán"), ("習慣", "しゅうかん", "Thói quen")], L),
    k(5, "判", "PHÁN", 7, ["ハン (han)"], [], "Phán đoán, phán quyết.",
      [("判決", "はんけつ", "Phán quyết"), ("裁判", "さいばん", "Phiên tòa")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Bám sát theo thực tế cụ thể: N(thực tế) + に即して",
        "N(thực tế/tình hình cụ thể) + に即して、[hành động/nhận định phù hợp]",
        "に即して dùng khi đưa ra một HÀNH ĐỘNG/NHẬN ĐỊNH bám sát/dựa sát theo một THỰC TẾ CỤ THỂ "
        "đang diễn ra (tình hình, kinh nghiệm, dữ liệu, thực trạng vụ việc) — N ở đây luôn là một "
        "THỰC TẾ CỤ THỂ, khác với に則って (slide 2) vốn dùng cho quy tắc/pháp luật trừu tượng.",
        [
            ex(L, 1, 1, [t("t-l11s1-1", "はんけつ", "判決", "はんけつ", key=True), t("t-l11s1-2", "は"),
                         t("t-l11s1-3", "、"), t("t-l11s1-4", "じけん", "事件", "じけん", key=True),
                         t("t-l11s1-5", "の"), t("t-l11s1-6", "じったい", "実態", "じったい", key=True),
                         t("t-l11s1-7", "に"), t("t-l11s1-8", "そくして", "即して", "そくして", key=True),
                         t("t-l11s1-9", "くだされた", "下された", "くだされた")],
               "Phán quyết đã được đưa ra bám sát theo thực trạng của vụ việc."),
            ex(L, 1, 2, [t("t-l11s1-10", "べんごし", "弁護士", "べんごし", key=True), t("t-l11s1-11", "は"),
                         t("t-l11s1-12", "、"), t("t-l11s1-13", "しょうこ", "証拠", "しょうこ", key=True),
                         t("t-l11s1-14", "の"), t("t-l11s1-15", "じったい", "実態", "じったい", key=True),
                         t("t-l11s1-16", "に"), t("t-l11s1-17", "そくして", "即して", "そくして", key=True),
                         t("t-l11s1-18", "しゅちょうした", "主張した", "しゅちょうした")],
               "Luật sư đã lập luận bám sát theo thực trạng của bằng chứng."),
        ],
        tips="に即して luôn đi sau một DANH TỪ chỉ THỰC TẾ/TÌNH HÌNH cụ thể (実態, 実情, 現状) — không dùng trực tiếp sau quy tắc/pháp luật trừu tượng như 法律, 規則 (những từ đó dùng với に則って).",
        culture="Trong văn bản phán quyết tòa án Nhật, cụm '事実に即して判断する' (phán đoán bám sát theo sự thật) là công thức mở đầu phần lập luận rất phổ biến."),

    slide(L, 2,
        "2. Tuân theo quy tắc/truyền thống chính thức: N(quy tắc) + に則って",
        "N(luật lệ/quy định/tiền lệ/truyền thống) + に則って、[hành động tuân theo]",
        "に則って dùng để diễn tả việc thực hiện một hành động TUÂN THEO một cách CHÍNH THỨC, TRANG "
        "TRỌNG một QUY TẮC/PHÁP LUẬT/TIỀN LỆ/TRUYỀN THỐNG đã được THIẾT LẬP TỪ TRƯỚC — N phải là "
        "điều gì đó mang tính QUY PHẠM có sẵn, không phải một tình huống thực tế đơn thuần.",
        [
            ex(L, 2, 1, [t("t-l11s2-1", "はんけつ", "判決", "はんけつ", key=True), t("t-l11s2-2", "は"),
                         t("t-l11s2-3", "、"), t("t-l11s2-4", "ほうりつ", "法律", "ほうりつ", key=True),
                         t("t-l11s2-5", "に"), t("t-l11s2-6", "のっとって", "則って", "のっとって", key=True),
                         t("t-l11s2-7", "くだされた", "下された", "くだされた")],
               "Phán quyết đã được đưa ra tuân theo pháp luật."),
            ex(L, 2, 2, [t("t-l11s2-8", "けっこんしき", "結婚式", "けっこんしき"), t("t-l11s2-9", "は"),
                         t("t-l11s2-10", "、"), t("t-l11s2-11", "むかし", "昔", "むかし"), t("t-l11s2-12", "から"),
                         t("t-l11s2-13", "の"), t("t-l11s2-14", "かんしゅう", "慣習", "かんしゅう", key=True),
                         t("t-l11s2-15", "に"), t("t-l11s2-16", "のっとって", "則って", "のっとって", key=True),
                         t("t-l11s2-17", "おこなわれた", "行われた", "おこなわれた")],
               "Lễ cưới đã được tổ chức tuân theo tập quán từ xưa."),
        ],
        tips="に則って hay đi sau 法律/規則/伝統/慣習/前例 (những danh từ chỉ QUY TẮC đã được thiết lập) — không dùng cho một tình huống thực tế nhất thời.",
        culture="Các nghi lễ truyền thống Nhật Bản (đám cưới, lễ hội, tang lễ) luôn được giới thiệu bằng cụm '伝統に則って/しきたりに則って' (tuân theo truyền thống/tục lệ) để nhấn mạnh tính trang trọng, đúng khuôn phép."),

    slide(L, 3,
        "3. So sánh に即して và に則って",
        "に即して: THỰC TẾ CỤ THỂ (tình hình, dữ liệu, kinh nghiệm)　vs　に則って: QUY TẮC/PHÁP LUẬT/TRUYỀN THỐNG (đã thiết lập, chính thức)",
        "に即して dùng khi căn cứ là một THỰC TẾ CỤ THỂ đang tồn tại (tình hình thị trường, thực "
        "trạng vụ việc) — nhấn mạnh sự PHÙ HỢP với hoàn cảnh thực; に則って dùng khi căn cứ là một "
        "QUY TẮC/PHÁP LUẬT/TRUYỀN THỐNG đã được thiết lập CHÍNH THỨC từ trước — nhấn mạnh sự TUÂN "
        "THỦ đúng khuôn khổ. Cùng một vụ việc thường cần cả hai để nhấn hai khía cạnh khác nhau.",
        [
            ex(L, 3, 1, [t("t-l11s3-1", "はんけつ", "判決", "はんけつ", key=True), t("t-l11s3-2", "は"),
                         t("t-l11s3-3", "、"), t("t-l11s3-4", "じけん", "事件", "じけん", key=True),
                         t("t-l11s3-5", "の"), t("t-l11s3-6", "じったい", "実態", "じったい", key=True),
                         t("t-l11s3-7", "に"), t("t-l11s3-8", "そくして", "即して", "そくして", key=True),
                         t("t-l11s3-9", "おこなわれる", "行われる", "おこなわれる"), t("t-l11s3-10", "べきだ", key=True)],
               "Phán quyết nên được đưa ra bám sát theo thực trạng vụ việc."),
            ex(L, 3, 2, [t("t-l11s3-11", "しかし"), t("t-l11s3-12", "どうじに", "同時に", "どうじに"),
                         t("t-l11s3-13", "、"), t("t-l11s3-14", "はんけつ", "判決", "はんけつ", key=True),
                         t("t-l11s3-15", "は"), t("t-l11s3-16", "ほうりつ", "法律", "ほうりつ", key=True),
                         t("t-l11s3-17", "に"), t("t-l11s3-18", "のっとって", "則って", "のっとって", key=True),
                         t("t-l11s3-19", "いなければならない")],
               "Nhưng đồng thời, phán quyết cũng phải tuân theo đúng pháp luật."),
        ],
        tips="Mẹo ghi nhớ: 実態・実情・現状 (thực tế) → dùng に即して; 法律・規則・伝統・前例 (quy tắc có sẵn) → dùng に則って.",
        culture="Trong tranh luận pháp lý, luật sư thường phải chứng minh cả hai điều: vụ việc PHÙ HỢP với thực tế nào (に即して) và QUY TẮC pháp luật nào đang được áp dụng (に則って)."),

    slide(L, 4,
        "4. Kết hợp trong một phiên tòa hoàn chỉnh",
        "事実に即して調べ、規則に則って処理する (điều tra bám sát sự thật, xử lý tuân theo quy định)",
        "Trong một PHIÊN TÒA, việc xét xử công bằng đòi hỏi vừa phải xem xét THỰC TẾ CỤ THỂ của vụ "
        "việc (に即して) để hiểu đúng bản chất sự việc, vừa phải TUÂN THỦ nghiêm ngặt PHÁP LUẬT/TIỀN "
        "LỆ (に則って) khi đưa ra phán quyết cuối cùng — thiếu một trong hai, phán quyết sẽ không được coi là công bằng.",
        [
            ex(L, 4, 1, [t("t-l11s4-1", "こんかい", "今回", "こんかい"), t("t-l11s4-2", "の"),
                         t("t-l11s4-3", "そしょう", "訴訟", "そしょう", key=True), t("t-l11s4-4", "も"),
                         t("t-l11s4-5", "、"), t("t-l11s4-6", "じったい", "実態", "じったい", key=True),
                         t("t-l11s4-7", "に"), t("t-l11s4-8", "そくして", "即して", "そくして", key=True),
                         t("t-l11s4-9", "しらべた", "調べた", "しらべた"), t("t-l11s4-10", "うえで"),
                         t("t-l11s4-11", "、"), t("t-l11s4-12", "きそく", "規則", "きそく", key=True),
                         t("t-l11s4-13", "に"), t("t-l11s4-14", "のっとって", "則って", "のっとって", key=True),
                         t("t-l11s4-15", "しょりされた", "処理された", "しょりされた")],
               "Vụ kiện lần này cũng đã được xử lý tuân theo quy định, sau khi điều tra bám sát theo thực trạng."),
            ex(L, 4, 2, [t("t-l11s4-16", "この"), t("t-l11s4-17", "はんけつ", "判決", "はんけつ", key=True),
                         t("t-l11s4-18", "は"), t("t-l11s4-19", "、"), t("t-l11s4-20", "ぜんれい", "前例", "ぜんれい", key=True),
                         t("t-l11s4-21", "に"), t("t-l11s4-22", "のっとって", "則って", "のっとって", key=True),
                         t("t-l11s4-23", "は"), t("t-l11s4-24", "いるが"), t("t-l11s4-25", "、"),
                         t("t-l11s4-26", "じけん", "事件", "じけん", key=True), t("t-l11s4-27", "の"),
                         t("t-l11s4-28", "じったい", "実態", "じったい", key=True), t("t-l11s4-29", "に"),
                         t("t-l11s4-30", "そくしている", "即している", "そくしている", key=True),
                         t("t-l11s4-31", "とは"), t("t-l11s4-32", "いえない", "言えない", "いえない")],
               "Phán quyết này tuy tuân theo tiền lệ, nhưng không thể nói là đã bám sát theo thực trạng vụ việc."),
        ],
        tips="Khi hai cấu trúc DƯỜNG NHƯ xung đột (tiền lệ cũ không còn phù hợp thực tế mới), đây chính là điểm tranh luận pháp lý kinh điển: nên ưu tiên に即して (thực tế) hay に則って (tiền lệ)?",
        culture="Đây là chủ đề tranh luận muôn thuở trong ngành luật Nhật Bản: liệu phán quyết nên linh hoạt theo thực tế xã hội thay đổi (に即して), hay phải tuân thủ nghiêm ngặt pháp luật/tiền lệ đã có (に則って)?"),
]

DIALOGUE = [
    line(L, 1, "田中", "Phóng viên",
         [t("d11-1", "きょう", "今日", "きょう"), t("d11-2", "の"), t("d11-3", "はんけつ", "判決", "はんけつ", key=True),
          t("d11-4", "について"), t("d11-5", "、"), t("d11-6", "おはなし", "お話", "おはなし"), t("d11-7", "を"),
          t("d11-8", "きかせてください", "聞かせてください", "きかせてください")],
         "Xin hãy chia sẻ về phán quyết hôm nay."),
    line(L, 2, "弁護士", "Luật sư",
         [t("d11-9", "はい"), t("d11-10", "。"), t("d11-11", "こんかい", "今回", "こんかい"), t("d11-12", "の"),
          t("d11-13", "はんけつ", "判決", "はんけつ", key=True), t("d11-14", "は"), t("d11-15", "、"),
          t("d11-16", "じけん", "事件", "じけん", key=True), t("d11-17", "の"), t("d11-18", "じったい", "実態", "じったい", key=True),
          t("d11-19", "に"), t("d11-20", "そくして", "即して", "そくして", key=True),
          t("d11-21", "くだされました", "下されました", "くだされました")],
         "Vâng. Phán quyết lần này đã được đưa ra bám sát theo thực trạng của vụ việc."),
    line(L, 3, "田中", "Phóng viên",
         [t("d11-22", "ほうりつ", "法律", "ほうりつ", key=True), t("d11-23", "の"), t("d11-24", "めん", "面", "めん"),
          t("d11-25", "では"), t("d11-26", "どう"), t("d11-27", "でした"), t("d11-28", "か")],
         "Về mặt pháp luật thì sao?"),
    line(L, 4, "弁護士", "Luật sư",
         [t("d11-29", "もちろん"), t("d11-30", "、"), t("d11-31", "ほうりつ", "法律", "ほうりつ", key=True),
          t("d11-32", "に"), t("d11-33", "のっとって", "則って", "のっとって", key=True),
          t("d11-34", "おこなわれました", "行われました", "おこなわれました")],
         "Dĩ nhiên, đã được tiến hành tuân theo pháp luật."),
    line(L, 5, "田中", "Phóng viên",
         [t("d11-35", "ぜんれい", "前例", "ぜんれい", key=True), t("d11-36", "は"), t("d11-37", "ありました"),
          t("d11-38", "か")],
         "Có tiền lệ nào không?"),
    line(L, 6, "弁護士", "Luật sư",
         [t("d11-39", "はい"), t("d11-40", "、"), t("d11-41", "むかし", "昔", "むかし"), t("d11-42", "から"),
          t("d11-43", "の"), t("d11-44", "かんしゅう", "慣習", "かんしゅう", key=True), t("d11-45", "にも"),
          t("d11-46", "のっとって", "則って", "のっとって", key=True), t("d11-47", "います")],
         "Có, cũng tuân theo cả tập quán từ xưa."),
    line(L, 7, "田中", "Phóng viên",
         [t("d11-48", "しょうこ", "証拠", "しょうこ", key=True), t("d11-49", "については"), t("d11-50", "、"),
          t("d11-51", "どう"), t("d11-52", "はんだんされました", "判断されました", "はんだんされました"), t("d11-53", "か")],
         "Còn về bằng chứng, đã được phán đoán thế nào?"),
    line(L, 8, "弁護士", "Luật sư",
         [t("d11-54", "しょうこ", "証拠", "しょうこ", key=True), t("d11-55", "の"), t("d11-56", "じったい", "実態", "じったい", key=True),
          t("d11-57", "に"), t("d11-58", "そくして", "即して", "そくして", key=True), t("d11-59", "、"),
          t("d11-60", "しんちょうに", "慎重に", "しんちょうに"), t("d11-61", "はんだんされました", "判断されました", "はんだんされました")],
         "Đã được phán đoán một cách thận trọng, bám sát theo thực trạng của bằng chứng."),
    line(L, 9, "田中", "Phóng viên",
         [t("d11-62", "この"), t("d11-63", "はんけつ", "判決", "はんけつ", key=True), t("d11-64", "は"),
          t("d11-65", "、"), t("d11-66", "こんご", "今後", "こんご"), t("d11-67", "の"),
          t("d11-68", "そしょう", "訴訟", "そしょう", key=True), t("d11-69", "にも"),
          t("d11-70", "えいきょうしますか", "影響しますか", "えいきょうしますか")],
         "Phán quyết này có ảnh hưởng đến các vụ kiện sau này không?"),
    line(L, 10, "弁護士", "Luật sư",
         [t("d11-71", "はい"), t("d11-72", "。"), t("d11-73", "この"), t("d11-74", "はんけつ", "判決", "はんけつ", key=True),
          t("d11-75", "は"), t("d11-76", "ぜんれい", "前例", "ぜんれい", key=True), t("d11-77", "になり"),
          t("d11-78", "、"), t("d11-79", "きそく", "規則", "きそく", key=True), t("d11-80", "に"),
          t("d11-81", "のっとって", "則って", "のっとって", key=True), t("d11-82", "かつようされる", "活用される", "かつようされる"),
          t("d11-83", "でしょう")],
         "Vâng. Phán quyết này sẽ trở thành tiền lệ, và sẽ được vận dụng tuân theo quy định."),
]

EXERCISES = [
    q(L, 1, "「判決は、事件の実態に即して下された」 — に即して diễn tả điều gì?",
      ["Đưa ra hành động/nhận định BÁM SÁT theo một THỰC TẾ CỤ THỂ đang diễn ra",
       "Tuân theo một cách chính thức một quy tắc/pháp luật đã thiết lập từ trước",
       "Sự cho phép làm việc gì đó", "Một quyết định hoàn toàn ngẫu nhiên"], 0,
      "に即して nhấn mạnh việc bám sát/dựa sát theo thực tế cụ thể (tình hình, dữ liệu, thực trạng), không phải theo quy tắc trừu tượng.",
      "Xem cấu trúc に即して ở slide 1."),
    q(L, 2, "「判決は、法律に則って下された」 — に則って dùng để làm gì?",
      ["Diễn tả một thực tế cụ thể đang diễn ra",
       "Tuân theo một cách CHÍNH THỨC, TRANG TRỌNG một quy tắc/pháp luật/truyền thống đã thiết lập từ trước",
       "Xin phép làm việc gì đó", "Đưa ra lời khuyên nhẹ nhàng"], 1,
      "に則って dùng để diễn tả việc tuân theo chính thức, trang trọng một quy tắc/pháp luật/truyền thống đã có sẵn.",
      "Xem cấu trúc に則って ở slide 2."),
    q(L, 3, "Sự khác biệt cốt lõi giữa に即して và に則って là gì?",
      ["に即して dùng cho THỰC TẾ CỤ THỂ; に則って dùng cho QUY TẮC/PHÁP LUẬT/TRUYỀN THỐNG đã thiết lập",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "に即して chỉ dùng cho câu hỏi", "に則って chỉ dùng cho câu phủ định"], 0,
      "に即して căn cứ vào thực tế cụ thể đang diễn ra; に則って căn cứ vào quy tắc/pháp luật/truyền thống đã được thiết lập chính thức.",
      "Xem bảng so sánh ở slide 3."),
    q(L, 4, "「弁護士は、証拠の実態に即して主張した」 nghĩa là:",
      ["Luật sư đã lập luận bám sát theo thực trạng của bằng chứng",
       "Luật sư đã phớt lờ hoàn toàn bằng chứng", "Luật sư đã tuân theo pháp luật một cách máy móc",
       "Không có bằng chứng nào được đưa ra"], 0,
      "に即して ở đây khẳng định lập luận của luật sư bám sát theo thực trạng cụ thể của bằng chứng.",
      "Áp dụng cấu trúc に即して cho ngữ cảnh pháp lý."),
    q(L, 5, "「結婚式は、昔からの慣習に則って行われた」 nghĩa là:",
      ["Lễ cưới đã được tổ chức tuân theo tập quán từ xưa", "Lễ cưới đã bị hủy bỏ",
       "Lễ cưới hoàn toàn không theo truyền thống nào",
       "Lễ cưới đã bám sát theo thực tế thị trường hiện tại"], 0,
      "に則って ở đây khẳng định lễ cưới được tổ chức tuân theo tập quán truyền thống từ xưa.",
      "Áp dụng cấu trúc に則って cho ngữ cảnh nghi lễ truyền thống."),
    q(L, 6, "Tại sao trong một phiên tòa, cần dùng CẢ に即して LẪN に則って?",
      ["Vì cần vừa xem xét thực tế cụ thể của vụ việc, vừa tuân thủ pháp luật/tiền lệ khi phán quyết",
       "Vì hai cấu trúc có nghĩa giống hệt nhau nên dùng thay phiên cho đa dạng",
       "Vì quy tắc ngữ pháp bắt buộc phải dùng chung", "Không có lý do đặc biệt nào"], 0,
      "Xét xử công bằng đòi hỏi vừa bám sát thực tế cụ thể (に即して) vừa tuân thủ pháp luật/tiền lệ (に則って).",
      "Xem cấu trúc phiên tòa hoàn chỉnh ở slide 4."),
    q(L, 7, "「この判決は、前例に則ってはいるが、事件の実態に即しているとは言えない」 hàm ý điều gì?",
      ["Phán quyết tuy đúng tiền lệ nhưng có thể chưa phù hợp với thực tế của vụ việc",
       "Phán quyết hoàn toàn sai cả về tiền lệ lẫn thực tế",
       "Phán quyết không liên quan gì đến tiền lệ hay thực tế", "Phán quyết chắc chắn đúng cả hai mặt"], 0,
      "Câu này nêu một mâu thuẫn có thể xảy ra: đúng tiền lệ (に則って) nhưng chưa chắc bám sát thực tế mới (に即して).",
      "Xem ví dụ nâng cao ở slide 4."),
    q(L, 8, "Theo hội thoại, phán quyết hôm nay được đưa ra dựa trên điều gì?",
      ["Thực trạng của vụ việc (事件の実態に即して下されました)", "Ý kiến cá nhân của thẩm phán",
       "Không có căn cứ rõ ràng", "Áp lực từ dư luận"], 0,
      "Luật sư nói 「今回の判決は、事件の実態に即して下されました」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Theo hội thoại, phán quyết có tuân theo tập quán nào không?",
      ["Có, tuân theo cả tập quán từ xưa (昔からの慣習にも則っています)", "Không, hoàn toàn bỏ qua tập quán",
       "Không được đề cập trong hội thoại", "Chỉ tuân theo luật nước ngoài"], 0,
      "Luật sư nói 「はい、昔からの慣習にも則っています」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Theo hội thoại, phán quyết này sẽ có ảnh hưởng gì trong tương lai?",
      ["Sẽ trở thành tiền lệ, được vận dụng tuân theo quy định (前例になり、規則に則って活用される)",
       "Sẽ bị lãng quên ngay lập tức", "Không có ảnh hưởng nào", "Sẽ bị hủy bỏ trong tương lai gần"], 0,
      "Luật sư nói 「この判決は前例になり、規則に則って活用されるでしょう」.",
      "Xem câu thoại thứ 10."),
]

LESSON = lesson(
    L,
    "Bài 11: Căn cứ pháp lý & Chuẩn mực (に即して & に則って)",
    "に即して dùng khi đưa ra một hành động/nhận định BÁM SÁT theo một THỰC TẾ CỤ THỂ đang diễn ra "
    "(thực trạng vụ việc, tình hình thị trường, bằng chứng) — N là một thực tế cụ thể, không phải "
    "quy tắc trừu tượng. に則って dùng để diễn tả việc tuân theo một cách CHÍNH THỨC, TRANG TRỌNG "
    "một QUY TẮC/PHÁP LUẬT/TIỀN LỆ/TRUYỀN THỐNG đã được thiết lập từ trước. Hai cấu trúc thường kết "
    "hợp trong bối cảnh phiên tòa/xét xử: vừa xem xét thực tế cụ thể của vụ việc, vừa tuân thủ nghiêm ngặt pháp luật và tiền lệ khi đưa ra phán quyết.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
