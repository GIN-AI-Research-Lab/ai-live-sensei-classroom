# -*- coding: utf-8 -*-
"""N3 — Bai 4: Nguyen nhan ly do おかげで (tich cuc) / せいで (tieu cuc)
/ ばかりに (tieu cuc, hau qua nang ne hon ca se de).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n3.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n3_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 4
pool = Pool("n3")

VOCAB = [
    v(1,  "たすかります", "助かります", "たすかります", "tasukarimasu", "verb", "Được giúp đỡ, đỡ vất vả hơn", "Đã gặp N5 bài 24. 先生の おかげで 助かりました = nhờ có thầy giáo mà tôi đỡ vất vả hơn.", L),
    v(2,  "せいこうします", "成功します", "せいこうします", "seikou shimasu", "verb", "Thành công", "努力の おかげで 成功しました = nhờ nỗ lực mà đã thành công.", L),
    v(3,  "しっぱいします", "失敗します", "しっぱいします", "shippai shimasu", "verb", "Thất bại, mắc lỗi", "Đã gặp bài 45 (N4).", L),
    v(4,  "ちこくします", "遅刻します", "ちこくします", "chikoku shimasu", "verb", "Đến muộn, trễ giờ", "渋滞の せいで 遅刻しました = tại vì kẹt xe nên tôi đến muộn.", L),
    v(5,  "わすれます", "忘れます", "わすれます", "wasuremasu", "verb", "Quên", "Đã gặp bài 26 (N4). うっかり 忘れた ばかりに、大変な ことに なりました = chỉ vì lỡ quên mà thành chuyện lớn.", L),
    v(6,  "たすけます", "助けます", "たすけます", "tasukemasu", "verb", "Giúp đỡ, cứu giúp", "先生が 助けて くださった おかげで = nhờ thầy giáo giúp đỡ mà.", L),
    v(7,  "おかげ", "お陰", "おかげ", "okage", "noun", "Nhờ có, nhờ ơn (nguyên nhân TÍCH CỰC)", "あなたの おかげです = đều nhờ có bạn cả.", L),
    v(8,  "せい", "所為", "せい", "sei", "noun", "Tại vì, lỗi tại (nguyên nhân TIÊU CỰC, đổ lỗi)", "天気の せいで = tại vì thời tiết.", L),
    v(9,  "せいこう", "成功", "せいこう", "seikou", "noun", "Sự thành công", "Đã có ở động từ phía trên.", L),
    v(10, "しっぱい", "失敗", "しっぱい", "shippai", "noun", "Sự thất bại, sai lầm", "", L),
    v(11, "じゅうたい", "渋滞", "じゅうたい", "juutai", "noun", "Kẹt xe, ùn tắc giao thông", "道が 渋滞して いました = đường bị kẹt xe.", L),
    v(12, "ちこく", "遅刻", "ちこく", "chikoku", "noun", "Sự đến muộn, sự trễ giờ", "", L),
    v(13, "うっかり", "", "", "ukkari", "adverb", "Lỡ, vô ý, bất cẩn", "うっかり 忘れました = tôi đã lỡ quên mất.", L),
    v(14, "どりょく", "努力", "どりょく", "doryoku", "noun", "Sự nỗ lực, sự cố gắng", "Đã gặp bài 2.", L),
    v(15, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "Đã gặp N5 bài 1.", L),
    v(16, "てんき", "天気", "てんき", "tenki", "noun", "Thời tiết", "Đã gặp N5 bài 21.", L),
    v(17, "しけん", "試験", "しけん", "shiken", "noun", "Kỳ thi", "Đã gặp bài 40 (N4).", L),
    v(18, "じこ", "事故", "じこ", "jiko", "noun", "Tai nạn", "Đã gặp bài 26 (N4).", L),
    v(19, "でんしゃ", "電車", "でんしゃ", "densha", "noun", "Tàu điện", "Đã gặp N5 bài 5.", L),
    v(20, "たいへん", "大変", "たいへん", "taihen", "adjective", "Vất vả, nghiêm trọng", "Đã gặp N5 bài 21.", L),
]

KANJI = [
    k(1, "陰", "ÂM", 11, ["イン (in)"], ["かげ"], "Bóng râm; nhờ ơn (chỉ ghép trong お陰).",
      [("お陰", "おかげ", "Nhờ có"), ("陰", "かげ", "Cái bóng")], L),
    k(2, "所", "SỞ", 8, ["ショ (sho)"], ["ところ"], "Nơi chốn; lý do (chỉ ghép trong 所為).",
      [("所為", "せい", "Tại vì (lỗi)"), ("場所", "ばしょ", "Địa điểm"), ("台所", "だいどころ", "Nhà bếp")], L),
    k(3, "成", "THÀNH", 6, ["セイ (sei)"], ["な(る)"], "Thành công, hoàn thành.",
      [("成功", "せいこう", "Thành công"), ("成ります", "なります", "Trở thành")], L),
    k(4, "刻", "KHẮC", 8, ["コク (koku)"], ["きざ(む)"], "Khắc giờ, thời khắc.",
      [("遅刻", "ちこく", "Trễ giờ"), ("時刻", "じこく", "Thời khắc, giờ giấc")], L),
    k(5, "渋", "SÁP", 11, ["ジュウ (juu)"], ["しぶ(い)"], "Ùn tắc, ngưng trệ; chát (vị).",
      [("渋滞", "じゅうたい", "Kẹt xe"), ("渋い", "しぶい", "Chát")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Nguyên nhân TÍCH CỰC: [Thể thông thường/N の] おかげで、[kết quả TỐT]",
        "N + の + おかげで　　V(た形) + おかげで、[kết quả tốt]",
        "おかげで (nhờ có/nhờ ơn) chỉ dùng khi KẾT QUẢ LÀ TỐT — mang ơn ai đó/điều gì đó đã giúp "
        "mình đạt được thành công. KHÔNG dùng cho kết quả xấu.",
        [
            ex(L, 1, 1, [t("t-l4s1-1", "せんせい", "先生", "せんせい", key=True), t("t-l4s1-2", "の", key=True),
                         t("t-l4s1-3", "おかげで", "お陰で", "おかげで", key=True), t("t-l4s1-4", "、"),
                         t("t-l4s1-5", "しけん", "試験", "しけん"), t("t-l4s1-6", "に"), t("t-l4s1-7", "ごうかく", "合格", "ごうかく"),
                         t("t-l4s1-8", "しました")],
               "Nhờ có thầy giáo mà tôi đã đậu kỳ thi."),
            ex(L, 1, 2, [t("t-l4s1-9", "どりょく", "努力", "どりょく", key=True), t("t-l4s1-10", "した", "した", "した"),
                         t("t-l4s1-11", "おかげで", "お陰で", "おかげで", key=True), t("t-l4s1-12", "、"),
                         t("t-l4s1-13", "せいこう", "成功", "せいこう", key=True), t("t-l4s1-14", "しました")],
               "Nhờ đã nỗ lực mà tôi đã thành công."),
        ],
        tips="おかげさまで (thêm さま kính ngữ) là câu cảm ơn xã giao rất phổ biến khi được hỏi thăm tình hình — 'nhờ trời/nhờ mọi người mà tôi ổn'.",
        culture="おかげさまで元気です (nhờ trời tôi khỏe) là câu đáp lễ phổ biến khi ai đó hỏi thăm sức khỏe — thể hiện sự khiêm tốn, biết ơn."),

    slide(L, 2,
        "2. Nguyên nhân TIÊU CỰC (đổ lỗi): [Thể thông thường/N の] せいで、[kết quả XẤU]",
        "N + の + せいで　　V(た形) + せいで、[kết quả xấu]",
        "せいで (tại vì/lỗi tại) chỉ dùng khi KẾT QUẢ LÀ XẤU — đổ lỗi cho một nguyên nhân cụ thể. "
        "Đối lập trực tiếp với おかげで về mặt SẮC THÁI kết quả.",
        [
            ex(L, 2, 1, [t("t-l4s2-1", "じゅうたい", "渋滞", "じゅうたい", key=True), t("t-l4s2-2", "の", key=True),
                         t("t-l4s2-3", "せいで", "所為で", "せいで", key=True), t("t-l4s2-4", "、"),
                         t("t-l4s2-5", "ちこく", "遅刻", "ちこく", key=True), t("t-l4s2-6", "しました")],
               "Tại vì kẹt xe nên tôi đã đến muộn."),
            ex(L, 2, 2, [t("t-l4s2-7", "てんき", "天気", "てんき", key=True), t("t-l4s2-8", "が"),
                         t("t-l4s2-9", "わるかった", "悪かった", "わるかった"), t("t-l4s2-10", "せいで", "所為で", "せいで", key=True),
                         t("t-l4s2-11", "、"), t("t-l4s2-12", "しあい", "試合", "しあい"), t("t-l4s2-13", "が"),
                         t("t-l4s2-14", "ちゅうし", "中止", "ちゅうし"), t("t-l4s2-15", "に"), t("t-l4s2-16", "なりました", key=True)],
               "Tại vì thời tiết xấu nên trận đấu đã bị hủy."),
        ],
        tips="せいにする (đổ lỗi cho...) là cách dùng mở rộng: 天気のせいにする = đổ lỗi cho thời tiết — mang hàm ý người nói đang TRÁCH MÓC.",
        culture="Dùng せいで trực tiếp với NGƯỜI (山田さんのせいで) nghe khá nặng nề, dễ gây mất lòng — nên cẩn trọng khi áp dụng cho lỗi của một cá nhân cụ thể."),

    slide(L, 3,
        "3. Hậu quả đáng tiếc vì một việc nhỏ: [Thể た] ばかりに、[hậu quả NẶNG NỀ]",
        "V(た形) + ばかりに、[hậu quả nghiêm trọng, thường ngoài dự tính]",
        "ばかりに mạnh hơn せいで nhiều — nhấn CHỈ VÌ một việc NHỎ/TƯỞNG KHÔNG QUAN TRỌNG mà dẫn đến "
        "hậu quả LỚN, THƯỜNG NGOÀI DỰ TÍNH — mang sắc thái tiếc nuối sâu sắc hơn せいで.",
        [
            ex(L, 3, 1, [t("t-l4s3-1", "うっかり", key=True), t("t-l4s3-2", "わすれた", "忘れた", "わすれた"),
                         t("t-l4s3-3", "ばかりに", key=True), t("t-l4s3-4", "、"), t("t-l4s3-5", "たいへん", "大変", "たいへん", key=True),
                         t("t-l4s3-6", "な"), t("t-l4s3-7", "こと", "事", "こと"), t("t-l4s3-8", "に"),
                         t("t-l4s3-9", "なりました", key=True)],
               "Chỉ vì lỡ quên (một việc nhỏ) mà đã thành chuyện lớn."),
            ex(L, 3, 2, [t("t-l4s3-10", "ひとこと", "一言", "ひとこと"), t("t-l4s3-11", "いった", "言った", "いった"),
                         t("t-l4s3-12", "ばかりに", key=True), t("t-l4s3-13", "、"), t("t-l4s3-14", "しっぱい", "失敗", "しっぱい", key=True),
                         t("t-l4s3-15", "しました")],
               "Chỉ vì nói một câu (nhỏ nhặt) mà đã thất bại."),
        ],
        tips="ばかりに luôn hàm ý NGUYÊN NHÂN NHỎ nhưng HẬU QUẢ LỚN — nếu nguyên nhân và hậu quả tương xứng về mức độ, dùng せいで tự nhiên hơn.",
        culture="ばかりに thường xuất hiện trong lời kể có tính TIẾC NUỐI SÂU SẮC — như 'giá mà tôi đã không...' trong tiếng Việt."),

    slide(L, 4,
        "4. Tổng kết ba cấu trúc nguyên nhân-kết quả có SẮC THÁI",
        "おかげで (KẾT QUẢ TỐT, biết ơn) / せいで (KẾT QUẢ XẤU, đổ lỗi) / ばかりに (KẾT QUẢ XẤU NẶNG NỀ so với nguyên nhân NHỎ)",
        "Ba cấu trúc này KHÁC HẲN から/ので (N4 bài 39, chỉ nêu lý do TRUNG TÍNH) — chúng LUÔN mang "
        "theo ĐÁNH GIÁ CẢM XÚC của người nói về kết quả.",
        [
            ex(L, 4, 1, [t("t-l4s4-1", "でんしゃ", "電車", "でんしゃ", key=True), t("t-l4s4-2", "が"),
                         t("t-l4s4-3", "とまった", "止まった", "とまった"), t("t-l4s4-4", "せいで", "所為で", "せいで", key=True),
                         t("t-l4s4-5", "、"), t("t-l4s4-6", "しけん", "試験", "しけん"), t("t-l4s4-7", "に"),
                         t("t-l4s4-8", "まにあいませんでした", "間に合いませんでした", "まにあいませんでした")],
               "Tại vì tàu điện ngừng chạy nên tôi đã không kịp giờ thi."),
            ex(L, 4, 2, [t("t-l4s4-9", "せんせい", "先生", "せんせい"), t("t-l4s4-10", "が"),
                         t("t-l4s4-11", "たすけて", "助けて", "たすけて"), t("t-l4s4-12", "くださった"),
                         t("t-l4s4-13", "おかげで", "お陰で", "おかげで", key=True), t("t-l4s4-14", "、"),
                         t("t-l4s4-15", "たすかりました", "助かりました", "たすかりました")],
               "Nhờ thầy giáo đã giúp đỡ mà tôi đỡ vất vả hơn nhiều."),
        ],
        tips="Kiểm tra nhanh: kết quả TỐT → おかげで; kết quả XẤU thông thường → せいで; kết quả XẤU RẤT NẶNG so với nguyên nhân nhỏ → ばかりに.",
        culture="Ba cấu trúc này thể hiện rõ nét văn hóa Nhật: luôn tìm NGUYÊN NHÂN cụ thể (dù là may mắn hay xui xẻo) thay vì chỉ nói chung chung."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d4-1", "山田さん"), t("d4-2", "、"), t("d4-3", "きょう", "今日", "きょう"), t("d4-4", "は"),
          t("d4-5", "ちこく", "遅刻", "ちこく", key=True), t("d4-6", "しました", "しました", "しました"), t("d4-7", "ね")],
         "Anh Yamada, hôm nay anh đến muộn nhỉ."),
    line(L, 2, "山田", "Nhân viên công ty",
         [t("d4-8", "はい"), t("d4-9", "、"), t("d4-10", "すみません"), t("d4-11", "。"),
          t("d4-12", "じゅうたい", "渋滞", "じゅうたい", key=True), t("d4-13", "の", key=True), t("d4-14", "せいで", "所為で", "せいで", key=True),
          t("d4-15", "、"), t("d4-16", "ちこく", "遅刻", "ちこく"), t("d4-17", "して", key=True), t("d4-18", "しまいました")],
         "Vâng, xin lỗi. Tại vì kẹt xe nên tôi đã đến muộn."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d4-19", "たいへんでした", "大変でした", "たいへんでした"), t("d4-20", "ね"), t("d4-21", "。"),
          t("d4-22", "しけん", "試験", "しけん", key=True), t("d4-23", "は"), t("d4-24", "どうでしたか")],
         "Vất vả thật đấy nhỉ. Kỳ thi thế nào rồi?"),
    line(L, 4, "山田", "Nhân viên công ty",
         [t("d4-25", "せんせい", "先生", "せんせい", key=True), t("d4-26", "の", key=True), t("d4-27", "おかげで", "お陰で", "おかげで", key=True),
          t("d4-28", "、"), t("d4-29", "ごうかく", "合格", "ごうかく"), t("d4-30", "しました")],
         "Nhờ có thầy giáo mà tôi đã đậu."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d4-31", "よかったです", "良かったです", "よかったです"), t("d4-32", "ね"), t("d4-33", "。"),
          t("d4-34", "どりょく", "努力", "どりょく", key=True), t("d4-35", "の", key=True), t("d4-36", "おかげ", "お陰", "おかげ", key=True),
          t("d4-37", "でも"), t("d4-38", "あります"), t("d4-39", "よ")],
         "Hay quá nhỉ. Cũng nhờ có nỗ lực của anh nữa đấy."),
    line(L, 6, "山田", "Nhân viên công ty",
         [t("d4-40", "ありがとう"), t("d4-41", "ございます"), t("d4-42", "。"), t("d4-43", "でも"),
          t("d4-44", "、"), t("d4-45", "きのう", "昨日", "きのう"), t("d4-46", "は"),
          t("d4-47", "うっかり", key=True), t("d4-48", "しゅくだい", "宿題", "しゅくだい"), t("d4-49", "を"),
          t("d4-50", "わすれた", "忘れた", "わすれた"), t("d4-51", "ばかりに", key=True), t("d4-52", "、"),
          t("d4-53", "せんせい", "先生", "せんせい"), t("d4-54", "に"), t("d4-55", "しかられました", "叱られました", "しかられました")],
         "Cảm ơn chị. Nhưng hôm qua, chỉ vì lỡ quên bài tập mà tôi bị thầy giáo mắng."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d4-56", "それ"), t("d4-57", "は"), t("d4-58", "ざんねん", "残念", "ざんねん"), t("d4-59", "でした"),
          t("d4-60", "ね")],
         "Đáng tiếc thật đấy nhỉ."),
    line(L, 8, "山田", "Nhân viên công ty",
         [t("d4-61", "はい"), t("d4-62", "。"), t("d4-63", "でも"), t("d4-64", "、"),
          t("d4-65", "そのあと", "その後", "そのあと"), t("d4-66", "、"), t("d4-67", "がんばって", "頑張って", "がんばって"),
          t("d4-68", "べんきょう", "勉強", "べんきょう"), t("d4-69", "した"), t("d4-70", "おかげで", "お陰で", "おかげで", key=True),
          t("d4-71", "、"), t("d4-72", "しけん", "試験", "しけん"), t("d4-73", "に"), t("d4-74", "ごうかく", "合格", "ごうかく"),
          t("d4-75", "しました")],
         "Vâng. Nhưng sau đó, nhờ đã cố gắng học bài mà tôi đã đậu kỳ thi."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d4-76", "よかったです", "良かったです", "よかったです"), t("d4-77", "ね"), t("d4-78", "。"),
          t("d4-79", "しっぱい", "失敗", "しっぱい", key=True), t("d4-80", "は"), t("d4-81", "せいこう", "成功", "せいこう", key=True),
          t("d4-82", "の"), t("d4-83", "もと", "元", "もと")],
         "Hay quá nhỉ. Thất bại là mẹ thành công mà."),
    line(L, 10, "山田", "Nhân viên công ty",
         [t("d4-84", "はい"), t("d4-85", "、"), t("d4-86", "そう"), t("d4-87", "おもいます", "思います", "おもいます")],
         "Vâng, tôi cũng nghĩ vậy."),
]

EXERCISES = [
    q(L, 1, "「先生のおかげで、試験に合格しました」 — おかげで dùng vì:",
      ["Kết quả là TỐT (đậu kỳ thi), thể hiện sự biết ơn", "Kết quả là XẤU",
       "Câu này không có kết quả rõ ràng", "おかげで chỉ dùng cho câu hỏi"], 0,
      "おかげで chỉ dùng khi kết quả TỐT — thể hiện lòng biết ơn đối với nguyên nhân đã giúp đỡ.",
      "Xem điều kiện sử dụng おかげで ở slide 1."),
    q(L, 2, "「渋滞のせいで、遅刻しました」 — せいで dùng vì:",
      ["Kết quả là XẤU (đến muộn), mang tính đổ lỗi", "Kết quả là TỐT",
       "Câu này thể hiện sự biết ơn", "せいで chỉ dùng cho câu hỏi"], 0,
      "せいで chỉ dùng khi kết quả XẤU — đổ lỗi cho một nguyên nhân cụ thể.",
      "Đối lập trực tiếp với おかげで."),
    q(L, 3, "おかげで và せいで khác nhau chủ yếu ở:",
      ["Sắc thái KẾT QUẢ: おかげで cho kết quả TỐT, せいで cho kết quả XẤU",
       "Hoàn toàn giống nhau", "おかげで chỉ dùng cho quá khứ",
       "せいで chỉ dùng cho câu phủ định"], 0,
      "Đây là điểm khác biệt cốt lõi — cùng cấu trúc ngữ pháp nhưng đối lập về đánh giá kết quả.",
      "Xem so sánh trực tiếp ở slide 4."),
    q(L, 4, "「うっかり忘れたばかりに、大変なことになりました」 — ばかりに nhấn mạnh điều gì?",
      ["Nguyên nhân NHỎ (lỡ quên) dẫn đến hậu quả LỚN, ngoài dự tính",
       "Nguyên nhân lớn dẫn đến hậu quả nhỏ", "Không có sự chênh lệch nào giữa nguyên nhân và hậu quả",
       "Kết quả là tích cực"], 0,
      "ばかりに mạnh hơn せいで, nhấn mạnh sự CHÊNH LỆCH giữa nguyên nhân nhỏ và hậu quả nghiêm trọng.",
      "Xem đặc điểm ばかりに ở slide 3."),
    q(L, 5, "ばかりに khác せいで ở mức độ:",
      ["ばかりに mạnh hơn, nhấn mạnh sự tiếc nuối sâu sắc và chênh lệch nguyên nhân-hậu quả",
       "Hoàn toàn giống nhau về mức độ", "ばかりに nhẹ hơn せいで",
       "せいで chỉ dùng được với danh từ"], 0,
      "ばかりに mang sắc thái TIẾC NUỐI SÂU SẮC hơn — thường dùng khi nguyên nhân có vẻ nhỏ nhặt nhưng hậu quả rất nặng nề.",
      "So sánh mức độ giữa hai cấu trúc tiêu cực."),
    q(L, 6, "おかげさまで trong câu chào hỏi xã giao có nghĩa gần với:",
      ["Nhờ trời/nhờ mọi người mà (tôi vẫn ổn)", "Tại vì lỗi của tôi mà",
       "Không liên quan gì đến ai cả", "Tôi tự làm được, không nhờ ai"], 0,
      "おかげさまで thêm kính ngữ さま, là câu đáp lễ khiêm tốn phổ biến khi được hỏi thăm sức khỏe/tình hình.",
      "Xem ghi chú văn hóa ở slide 1."),
    q(L, 7, "Dùng せいで trực tiếp cho một NGƯỜI CỤ THỂ (như 山田さんのせいで) có thể gây ra điều gì?",
      ["Nghe nặng nề, dễ gây mất lòng vì mang tính đổ lỗi trực diện",
       "Hoàn toàn bình thường, không có vấn đề gì", "Đây là cách nói lịch sự nhất",
       "Không thể dùng せいで với người"], 0,
      "せいで mang tính đổ lỗi khá mạnh — dùng trực tiếp cho một cá nhân cụ thể nên cẩn trọng để tránh mất lòng.",
      "Xem cảnh báo văn hóa ở slide 2."),
    q(L, 8, "So với から/ので (N4 bài 39, trung tính), ba cấu trúc おかげで/せいで/ばかりに có điểm gì khác?",
      ["Luôn mang theo ĐÁNH GIÁ CẢM XÚC của người nói về kết quả (tốt/xấu/rất xấu)",
       "Hoàn toàn giống から/ので về sắc thái", "Chỉ dùng được trong văn viết",
       "Không có khác biệt gì đáng kể"], 0,
      "から/ので chỉ nêu lý do trung tính; おかげで/せいで/ばかりに luôn có ĐÁNH GIÁ về mức độ tốt/xấu của kết quả.",
      "Xem tổng kết so sánh ở slide 4."),
    q(L, 9, "Trong hội thoại, vì sao Yamada đến muộn?",
      ["Vì kẹt xe", "Vì ngủ quên", "Vì tàu điện hỏng", "Không có lý do cụ thể"], 0,
      "Yamada nói 「渋滞のせいで、遅刻してしまいました」.",
      "Xem câu thoại thứ 2."),
    q(L, 10, "Vì sao Yamada bị thầy giáo mắng hôm qua?",
      ["Vì lỡ quên bài tập", "Vì đến muộn", "Vì nói chuyện trong lớp", "Không có lý do cụ thể"], 0,
      "Yamada nói 「うっかり宿題を忘れたばかりに、先生に叱られました」.",
      "Xem câu thoại thứ 6."),
]

LESSON = lesson(
    L,
    "Bài 4: Nguyên nhân lý do (おかげで & せいで & ばかりに)",
    "Ba cấu trúc nguyên nhân-kết quả mang SẮC THÁI CẢM XÚC (khác から/ので trung tính, N4 bài 39): "
    "おかげで cho kết quả TỐT (biết ơn), せいで cho kết quả XẤU (đổ lỗi), và ばかりに cho kết quả "
    "XẤU NẶNG NỀ so với một nguyên nhân nhỏ nhặt (tiếc nuối sâu sắc) — cùng câu おかげさまで dùng "
    "trong chào hỏi xã giao.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
