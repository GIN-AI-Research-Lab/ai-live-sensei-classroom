# -*- coding: utf-8 -*-
"""N4 — Bai 50 (bai chot N4): Khiem nhuong ngu (謙譲語 - Kenjougo).

Doi lap voi 尊敬語 (bai 49): HA THAP hanh dong cua CHINH MINH khi noi
voi/ve nguoi tren. Cac dong tu khiem nhuong dac biet la tu chuc nang
ngu phap loi, dua vao thu cong (giong cach da lam voi itadaku o bai 41).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 50
pool = Pool("n4")

VOCAB = [
    v(1,  "まいります", "参ります", "まいります", "mairimasu", "verb", "Đi/đến (khiêm nhường của 行きます/来ます)", "明日、そちらへ 参ります = ngày mai tôi sẽ đến chỗ ngài ạ.", L),
    v(2,  "もうします", "申します", "もうします", "moushimasu", "verb", "Tên là, nói (khiêm nhường của 言います, dùng khi tự giới thiệu)", "田中と 申します = tôi tên là Tanaka ạ.", L),
    v(3,  "もうしあげます", "申し上げます", "もうしあげます", "moushiagemasu", "verb", "Kính thưa, xin nói (khiêm nhường trang trọng hơn của 言います)", "お礼を 申し上げます = tôi xin gửi lời cảm ơn.", L),
    v(4,  "いたします", "致します", "いたします", "itashimasu", "verb", "Làm (khiêm nhường của します)", "私が ご案内 いたします = để tôi hướng dẫn quý vị ạ.", L),
    v(5,  "いただきます", "頂きます", "いただきます", "itadakimasu", "verb", "Nhận/ăn/uống (khiêm nhường của もらいます/食べます/飲みます)", "Đã gặp bài 41 (nghĩa nhận). Nay mở rộng thêm nghĩa ăn/uống.", L),
    v(6,  "はいけんします", "拝見します", "はいけんします", "haiken shimasu", "verb", "Xem (khiêm nhường của 見ます)", "お手紙を 拝見しました = tôi đã xem thư của ngài ạ.", L),
    v(7,  "ぞんじます", "存じます", "ぞんじます", "zonjimasu", "verb", "Biết/nghĩ (khiêm nhường của 知っています/思います)", "存じております = tôi có biết ạ (rất trang trọng).", L),
    v(8,  "おります", "居ります", "おります", "orimasu", "verb", "Có/ở (khiêm nhường của います)", "会議室に おります = tôi đang ở phòng họp ạ.", L),
    v(9,  "ごあんないいたします", "ご案内いたします", "ごあんないいたします", "go-annai itashimasu", "phrase", "Để tôi hướng dẫn (お/ご+gốc+いたします)", "お/ご + gốc danh từ hành động + いたします: mẫu khiêm nhường tổng quát.", L),
    v(10, "あんない", "案内", "あんない", "annai", "noun", "Sự hướng dẫn, chỉ dẫn", "ご案内します = để tôi hướng dẫn ạ.", L),
    v(11, "かいぎしつ", "会議室", "かいぎしつ", "kaigishitsu", "noun", "Phòng họp", "Đã gặp N5 bài 3.", L),
    v(12, "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc công ty", "Đã gặp bài 41.", L),
    v(13, "おきゃくさま", "お客様", "おきゃくさま", "okyakusama", "noun", "Quý khách (trang trọng hơn お客さん)", "お客様、こちらへ どうぞ = quý khách, xin mời lối này.", L),
    v(14, "てがみ", "手紙", "てがみ", "tegami", "noun", "Lá thư", "Đã gặp N5 bài 24.", L),
    v(15, "おれい", "お礼", "おれい", "orei", "noun", "Lời cảm ơn, lễ vật cảm ơn", "お礼を 申し上げます = tôi xin gửi lời cảm ơn.", L),
    v(16, "しつもん", "質問", "しつもん", "shitsumon", "noun", "Câu hỏi", "Đã gặp N5 bài 11.", L),
    v(17, "せつめい", "説明", "せつめい", "setsumei", "noun", "Lời giải thích", "Đã gặp bài 34.", L),
    v(18, "でんわ", "電話", "でんわ", "denwa", "noun", "Điện thoại, cuộc gọi", "Đã gặp N5 bài 2.", L),
    v(19, "しりょう", "資料", "しりょう", "shiryou", "noun", "Tài liệu", "資料を 拝見しました = tôi đã xem tài liệu ạ.", L),
    v(20, "なまえ", "名前", "なまえ", "namae", "noun", "Tên", "Đã gặp N5 bài 14 (お名前は？).", L),
]

KANJI = [
    k(1, "謙", "KHIÊM", 17, ["ケン (ken)"], [], "Khiêm tốn, nhún nhường.",
      [("謙譲語", "けんじょうご", "Khiêm nhường ngữ"), ("謙虚", "けんきょ", "Khiêm tốn")], L),
    k(2, "譲", "NHƯỢNG", 20, ["ジョウ (jou)"], ["ゆず(る)"], "Nhường lại, chuyển giao.",
      [("謙譲語", "けんじょうご", "Khiêm nhường ngữ"), ("譲ります", "ゆずります", "Nhường")], L),
    k(3, "拝", "BÁI", 8, ["ハイ (hai)"], ["おが(む)"], "Bái lạy, cung kính xem.",
      [("拝見します", "はいけんします", "Xem (khiêm nhường)"), ("拝借", "はいしゃく", "Mượn (khiêm nhường)")], L),
    k(4, "案", "ÁN", 10, ["アン (an)"], [], "Đề án, hướng dẫn.",
      [("案内", "あんない", "Hướng dẫn"), ("案", "あん", "Ý tưởng, đề án")], L),
    k(5, "礼", "LỄ", 5, ["レイ (rei)"], [], "Lễ nghĩa, cảm ơn.",
      [("お礼", "おれい", "Lời cảm ơn"), ("失礼", "しつれい", "Thất lễ"), ("礼儀", "れいぎ", "Lễ nghi")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Vì sao cần Kenjougo (謙譲語)?",
        "Dùng cho HÀNH ĐỘNG của CHÍNH MÌNH khi nói với/về NGƯỜI TRÊN — ĐỐI LẬP với 尊敬語 (bài 49)",
        "謙譲語 (khiêm nhường ngữ) HẠ THẤP hành động của bản thân người nói để GIÁN TIẾP nâng cao "
        "vị thế người nghe — cùng mục đích thể hiện tôn trọng với 尊敬語 nhưng NGƯỢC HƯỚNG chủ ngữ.",
        [
            ex(L, 1, 1, [t("t-l50s1-1", "たなか", "田中", "たなか"), t("t-l50s1-2", "と"),
                         t("t-l50s1-3", "もうします", "申します", "もうします", key=True)],
               "Tôi tên là Tanaka ạ. (tự giới thiệu, khiêm nhường)"),
            ex(L, 1, 2, [t("t-l50s1-4", "あした"), t("t-l50s1-5", "、"), t("t-l50s1-6", "そちら"),
                         t("t-l50s1-7", "へ"), t("t-l50s1-8", "まいります", "参ります", "まいります", key=True)],
               "Ngày mai tôi sẽ đến chỗ ngài ạ."),
        ],
        tips="Quy tắc SỐNG CÒN đối lập với bài 49: 謙譲語 chỉ dùng cho HÀNH ĐỘNG CỦA CHÍNH NGƯỜI NÓI — không bao giờ dùng để nói về hành động người khác.",
        culture="田中と申します là câu tự giới thiệu chuẩn mực nhất trong môi trường công sở Nhật, khiêm tốn hơn nhiều so với 田中です."),

    slide(L, 2,
        "2. Các động từ khiêm nhường ĐẶC BIỆT",
        "参ります (行く/来る) 　申します/申し上げます (言う) 　いたします (する) 　頂きます (もらう/食べる/飲む, bài 41) 　拝見します (見る) 　存じます (知る/思う) 　おります (いる)",
        "Giống 5 động từ tôn kính đặc biệt (bài 49), đây là các từ được THAY THẾ HOÀN TOÀN — phải "
        "học thuộc riêng, không suy luận được từ quy tắc chung.",
        [
            ex(L, 2, 1, [t("t-l50s2-1", "しりょう", "資料", "しりょう", key=True), t("t-l50s2-2", "を"),
                         t("t-l50s2-3", "はいけんしました", "拝見しました", "はいけんしました", key=True)],
               "Tôi đã xem tài liệu ạ."),
            ex(L, 2, 2, [t("t-l50s2-4", "かいぎしつ", "会議室", "かいぎしつ", key=True), t("t-l50s2-5", "に"),
                         t("t-l50s2-6", "おります", "居ります", "おります", key=True)],
               "Tôi đang ở phòng họp ạ."),
        ],
        tips="申します (khiêm nhường, dùng khi tự XƯNG TÊN) khác 申し上げます (trang trọng hơn, dùng khi PHÁT BIỂU/gửi lời) — cả hai đều thay cho 言います.",
        culture="拝見します thường dùng khi xem tài liệu, thư từ của cấp trên/khách hàng — thể hiện sự cẩn trọng, tôn trọng khi tiếp nhận thông tin quan trọng."),

    slide(L, 3,
        "3. Mẫu khiêm nhường TỔNG QUÁT: お/ご + [gốc] + します／いたします",
        "お + V(gốc ます) + します／いたします   　ご + [danh từ Hán Việt] + します／いたします",
        "Với động từ KHÔNG có dạng đặc biệt, dùng công thức chung này — お cho động từ thuần Nhật, "
        "ご cho từ gốc Hán Việt (như 案内, 説明) — いたします trang trọng hơn します.",
        [
            ex(L, 3, 1, [t("t-l50s3-1", "わたし", "私", "わたし"), t("t-l50s3-2", "が"),
                         t("t-l50s3-3", "ごあんない", "ご案内", "ごあんない", key=True), t("t-l50s3-4", "いたします", key=True)],
               "Để tôi hướng dẫn quý vị ạ. (ご + danh từ Hán 案内 + いたします)"),
            ex(L, 3, 2, [t("t-l50s3-5", "わたし", "私", "わたし"), t("t-l50s3-6", "が"),
                         t("t-l50s3-7", "おつたえ", "お伝え", "おつたえ", key=True), t("t-l50s3-8", "します", key=True)],
               "Để tôi truyền đạt lại ạ. (お + gốc thuần Nhật 伝え + します)"),
        ],
        tips="Mẹo phân biệt お/ご: từ THUẦN NHẬT (訓読み) dùng お; từ gốc HÁN VIỆT (音読み, thường 2 chữ Hán) dùng ご — 案内・説明・連絡 đều dùng ご.",
        culture="私がご案内いたします là câu nhân viên lễ tân/hướng dẫn viên Nhật nói ngay khi đón khách, thể hiện sự chuyên nghiệp, chu đáo."),

    slide(L, 4,
        "4. Tổng kết: Sonkeigo (bài 49) vs Kenjougo (bài 50)",
        "尊敬語: NÂNG hành động NGƯỜI KHÁC (いらっしゃる/召し上がる/お〜になります)　vs　謙譲語: HẠ hành động CHÍNH MÌNH (参る/頂く/お〜します)",
        "Hai hệ thống kính ngữ luôn ĐI CÙNG NHAU trong giao tiếp trang trọng: dùng 尊敬語 khi nói "
        "VỀ người trên, dùng 謙譲語 khi nói VỀ chính mình — không bao giờ đảo ngược.",
        [
            ex(L, 4, 1, [t("t-l50s4-1", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l50s4-2", "は"),
                         t("t-l50s4-3", "もう"), t("t-l50s4-4", "しりょう", "資料", "しりょう"), t("t-l50s4-5", "を"),
                         t("t-l50s4-6", "ごらんに", "ご覧に", "ごらんに"), t("t-l50s4-7", "なりました", key=True), t("t-l50s4-8", "か")],
               "Giám đốc đã xem tài liệu chưa ạ? (尊敬語 — nói VỀ giám đốc)"),
            ex(L, 4, 2, [t("t-l50s4-9", "はい"), t("t-l50s4-10", "、"), t("t-l50s4-11", "わたし", "私", "わたし"),
                         t("t-l50s4-12", "も"), t("t-l50s4-13", "もう"), t("t-l50s4-14", "はいけん", "拝見", "はいけん"),
                         t("t-l50s4-15", "いたしました", key=True)],
               "Vâng, tôi cũng đã xem rồi ạ. (謙譲語 — nói VỀ chính mình)"),
        ],
        tips="Lỗi nghiêm trọng nhất người mới học hay mắc: dùng 尊敬語 cho CHÍNH MÌNH (nghe như tự nâng mình lên) hoặc 謙譲語 cho NGƯỜI KHÁC (nghe như hạ thấp họ) — luôn kiểm tra chủ ngữ trước khi chọn.",
        culture="Đây là hai trụ cột của kính ngữ tiếng Nhật (敬語), cùng với 丁寧語 (lịch sự thông thường, です/ます) tạo thành hệ thống ba tầng hoàn chỉnh — nắm vững cả 49-50 là bước chuyển quan trọng để hoàn thành N4 và bước vào N3."),
]

DIALOGUE = [
    line(L, 1, "田中", "Nhân viên mới",
         [t("d-l50-1", "はじめまして", "初めまして", "はじめまして"), t("d-l50-2", "。"), t("d-l50-3", "たなか", "田中", "たなか", key=True),
          t("d-l50-4", "と"), t("d-l50-5", "もうします", "申します", "もうします", key=True), t("d-l50-6", "。"),
          t("d-l50-7", "どうぞ"), t("d-l50-8", "よろしく"), t("d-l50-9", "おねがいします", "お願いします", "おねがいします")],
         "Rất hân hạnh. Tôi tên là Tanaka ạ. Mong được giúp đỡ."),
    line(L, 2, "山田", "Trưởng phòng",
         [t("d-l50-10", "こちらこそ"), t("d-l50-11", "。"), t("d-l50-12", "わたし", "私", "わたし"),
          t("d-l50-13", "が"), t("d-l50-14", "かいしゃ", "会社", "かいしゃ"), t("d-l50-15", "を"),
          t("d-l50-16", "ごあんない", "ご案内", "ごあんない", key=True), t("d-l50-17", "いたします", key=True)],
         "Tôi mới phải nói vậy. Để tôi hướng dẫn anh đi tham quan công ty nhé."),
    line(L, 3, "田中", "Nhân viên mới",
         [t("d-l50-18", "ありがとう"), t("d-l50-19", "ございます"), t("d-l50-20", "。"), t("d-l50-21", "しゃちょう", "社長", "しゃちょう", key=True),
          t("d-l50-22", "は"), t("d-l50-23", "いらっしゃいます", key=True), t("d-l50-24", "か")],
         "Cảm ơn anh nhiều. Giám đốc có ở đây không ạ?"),
    line(L, 4, "山田", "Trưởng phòng",
         [t("d-l50-25", "はい"), t("d-l50-26", "、"), t("d-l50-27", "かいぎしつ", "会議室", "かいぎしつ", key=True),
          t("d-l50-28", "に"), t("d-l50-29", "いらっしゃいます", key=True)],
         "Vâng, ngài đang ở phòng họp."),
    line(L, 5, "田中", "Nhân viên mới",
         [t("d-l50-30", "しりょう", "資料", "しりょう", key=True), t("d-l50-31", "は"), t("d-l50-32", "もう"),
          t("d-l50-33", "ごらんに", "ご覧に", "ごらんに"), t("d-l50-34", "なりました", key=True), t("d-l50-35", "か")],
         "Giám đốc đã xem tài liệu chưa ạ?"),
    line(L, 6, "山田", "Trưởng phòng",
         [t("d-l50-36", "はい"), t("d-l50-37", "、"), t("d-l50-38", "もう"), t("d-l50-39", "ごらんに", "ご覧に", "ごらんに"),
          t("d-l50-40", "なりました", key=True), t("d-l50-41", "。"), t("d-l50-42", "わたし", "私", "わたし"),
          t("d-l50-43", "も"), t("d-l50-44", "はいけん", "拝見", "はいけん", key=True), t("d-l50-45", "いたしました", key=True)],
         "Vâng, ngài đã xem rồi. Tôi cũng đã xem rồi ạ."),
    line(L, 7, "田中", "Nhân viên mới",
         [t("d-l50-46", "わたし", "私", "わたし"), t("d-l50-47", "も"), t("d-l50-48", "あとで"),
          t("d-l50-49", "はいけん", "拝見", "はいけん", key=True), t("d-l50-50", "いたします", key=True)],
         "Tôi cũng sẽ xem sau ạ."),
    line(L, 8, "山田", "Trưởng phòng",
         [t("d-l50-51", "しつもん", "質問", "しつもん", key=True), t("d-l50-52", "が"), t("d-l50-53", "あったら", key=True),
          t("d-l50-54", "、"), t("d-l50-55", "わたし", "私", "わたし"), t("d-l50-56", "に"),
          t("d-l50-57", "でんわ", "電話", "でんわ", key=True), t("d-l50-58", "して", key=True), t("d-l50-59", "ください")],
         "Nếu có câu hỏi gì, hãy gọi điện cho tôi nhé."),
    line(L, 9, "田中", "Nhân viên mới",
         [t("d-l50-60", "はい"), t("d-l50-61", "、"), t("d-l50-62", "わかりました", "分かりました", "わかりました"),
          t("d-l50-63", "。"), t("d-l50-64", "いろいろ"), t("d-l50-65", "おしえて", "教えて", "おしえて"),
          t("d-l50-66", "いただき", "頂き", "いただき", key=True), t("d-l50-67", "、"), t("d-l50-68", "ありがとう"),
          t("d-l50-69", "ございます")],
         "Vâng, tôi hiểu rồi. Được anh chỉ dạy nhiều điều, cảm ơn anh nhiều ạ."),
    line(L, 10, "山田", "Trưởng phòng",
         [t("d-l50-70", "どういたしまして"), t("d-l50-71", "。"), t("d-l50-72", "いっしょに", "一緒に", "いっしょに"),
          t("d-l50-73", "がんばりましょう", "頑張りましょう", "がんばりましょう")],
         "Không có gì. Chúng ta cùng cố gắng nhé."),
]

EXERCISES = [
    q(L, 1, "謙譲語 dùng để hạ thấp hành động của ai?",
      ["CHÍNH NGƯỜI NÓI (không bao giờ dùng cho người khác)", "Người nghe",
       "Bất kỳ ai", "Chỉ dùng cho động vật"], 0,
      "謙譲語 luôn hạ thấp hành động CỦA CHÍNH MÌNH để gián tiếp thể hiện tôn trọng người nghe/người trên.",
      "Đây là quy tắc đối lập với 尊敬語 (bài 49)."),
    q(L, 2, "参ります là khiêm nhường ngữ của động từ nào?",
      ["行きます／来ます", "食べます", "見ます", "します"], 0,
      "参ります thay thế cho cả 行きます và 来ります khi nói về hành động di chuyển của chính mình.",
      "Xem danh sách động từ đặc biệt ở slide 2."),
    q(L, 3, "申します khác 申し上げます ở mức độ:",
      ["申します dùng khi TỰ GIỚI THIỆU tên; 申し上げます trang trọng hơn, dùng khi PHÁT BIỂU/gửi lời",
       "Hoàn toàn giống nhau", "申します trang trọng hơn",
       "Chỉ申し上げます mới đúng ngữ pháp"], 0,
      "Cả hai đều thay cho 言います, nhưng 申し上げます mang tính trang trọng cao hơn, thường dùng khi phát biểu chính thức.",
      "Xem phân biệt ở slide 2."),
    q(L, 4, "「私がご案内いたします」 dùng công thức nào?",
      ["ご + danh từ Hán Việt (案内) + いたします", "お + gốc động từ + します",
       "Động từ đặc biệt riêng", "Thể bị động"], 0,
      "案内 là danh từ gốc Hán Việt (2 chữ Hán), nên dùng ご thay vì お trong công thức khiêm nhường tổng quát.",
      "Xem mẹo phân biệt お/ご ở slide 3."),
    q(L, 5, "Vì sao 案内 dùng ご mà không dùng お?",
      ["Vì 案内 là từ gốc Hán Việt (âm đọc theo kiểu Trung Hoa, thường 2 chữ Hán)",
       "Vì 案内 là từ thuần Nhật", "Cả お và ご đều sai với 案内",
       "Không có quy tắc nào, tùy ý chọn"], 0,
      "Quy tắc chung: お cho từ thuần Nhật (訓読み), ご cho từ gốc Hán Việt (音読み) — 案内 thuộc nhóm sau.",
      "Áp dụng đúng mẹo phân biệt đã học."),
    q(L, 6, "「資料を拝見しました」 nghĩa là:",
      ["Tôi đã xem tài liệu (khiêm nhường, nói về hành động của mình)",
       "Ngài đã xem tài liệu (tôn kính, nói về người khác)", "Tài liệu chưa được xem",
       "Tài liệu bị mất"], 0,
      "拝見します là khiêm nhường ngữ của 見ます — CHỦ NGỮ luôn là chính người nói, không phải người khác.",
      "Phân biệt với ご覧になります (tôn kính, bài 49) nói về người khác xem."),
    q(L, 7, "Lỗi nghiêm trọng nào người mới học kính ngữ hay mắc phải?",
      ["Dùng 尊敬語 cho hành động của chính mình, hoặc 謙譲語 cho hành động người khác",
       "Dùng quá nhiều です/ます", "Nói quá nhanh",
       "Không dùng kính ngữ chút nào"], 0,
      "Đây là lỗi ĐẢO NGƯỢC vai trò hai hệ thống kính ngữ — nghe như tự nâng mình lên hoặc hạ thấp người khác, rất phản cảm.",
      "Xem cảnh báo quan trọng ở slide 4."),
    q(L, 8, "「社長はご覧になりましたか」 「はい、私も拝見いたしました」 — hai câu này dùng đúng vì:",
      ["Câu hỏi dùng 尊敬語 (nói về giám đốc), câu trả lời dùng 謙譲語 (nói về chính mình)",
       "Cả hai đều dùng chung một loại kính ngữ", "Câu trả lời phải dùng 尊敬語",
       "Câu hỏi phải dùng 謙譲語"], 0,
      "Đây là ví dụ điển hình phối hợp đúng: 尊敬語 khi hỏi VỀ người trên, 謙譲語 khi trả lời VỀ chính mình.",
      "Xem ví dụ tổng kết ở slide 4."),
    q(L, 9, "Trong hội thoại, ai sẽ hướng dẫn Tanaka tham quan công ty?",
      ["Trưởng phòng Yamada", "Giám đốc", "Không ai cả", "Một nhân viên khác"], 0,
      "Yamada nói 「私が会社をご案内いたします」.",
      "Xem câu thoại thứ 2."),
    q(L, 10, "Cuối hội thoại, Tanaka cảm ơn Yamada vì điều gì?",
      ["Vì đã chỉ dạy nhiều điều", "Vì đã tặng quà", "Vì đã mời ăn trưa", "Không có lý do cụ thể"], 0,
      "Tanaka nói 「いろいろ教えていただき、ありがとうございます」, kết hợp kiến thức いただく đã học ở bài 41.",
      "Xem câu thoại thứ 9, đây cũng là câu tổng kết cả khóa N4."),
]

LESSON = lesson(
    L,
    "Bài 50: Khiêm nhường ngữ (謙譲語 - Kenjougo)",
    "Bài chốt N4: 謙譲語 hạ thấp hành động của CHÍNH NGƯỜI NÓI (đối lập 尊敬語 bài 49) qua các "
    "động từ đặc biệt 参る/申す・申し上げる/いたす/頂く (bài 41)/拝見する/存じる/おる, và công thức "
    "tổng quát お/ご+gốc+します／いたします (お cho từ thuần Nhật, ご cho từ Hán Việt) — tổng kết "
    "cách phối hợp 尊敬語 (nói về người khác) và 謙譲語 (nói về mình) hoàn chỉnh hệ thống kính ngữ "
    "N4, sẵn sàng bước vào N3.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
