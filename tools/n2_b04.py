# -*- coding: utf-8 -*-
"""N2 — Bai 4: Nguy co かねない (xu huong ca nhan, canh bao chu quan) va おそれがある (nguy co
khach quan, du bao trang trong).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n2.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n2_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 4
pool = Pool("n2")

VOCAB = [
    v(1,  "あやうい", "危うい", "あやうい", "ayaui", "adjective", "Nguy hiểm, nguy cấp", "危うい 状況 = tình huống nguy cấp.", L),
    v(2,  "けわしい", "険しい", "けわしい", "kewashii", "adjective", "Dốc đứng, gay gắt, hiểm trở", "険しい 道 = con đường hiểm trở.", L),
    v(3,  "くずれます", "崩れます", "くずれます", "kuzuremasu", "verb", "Sụp đổ, sạt lở", "崖が 崩れます = vách núi sạt lở.", L),
    v(4,  "くずします", "崩します", "くずします", "kuzushimasu", "verb", "Phá vỡ, làm sụp đổ", "健康を 崩します = làm suy yếu sức khỏe.", L),
    v(5,  "むり", "無理", "むり", "muri", "noun", "Quá sức, miễn cưỡng", "無理を します = làm việc quá sức.", L),
    v(6,  "ちゅういします", "注意します", "ちゅういします", "chuui shimasu", "verb", "Chú ý, cẩn thận", "運転に 注意します = chú ý khi lái xe.", L),
    v(7,  "がけ", "崖", "がけ", "gake", "noun", "Vách núi, vách đá", "崖の 近く = gần vách núi.", L),
    v(8,  "きけん", "危険", "きけん", "kiken", "adjective", "Nguy hiểm", "Đã gặp N4 bài 34.", L),
    v(9,  "じこ", "事故", "じこ", "jiko", "noun", "Tai nạn", "Đã gặp N4 bài 34.", L),
    v(10, "しんぱい", "心配", "しんぱい", "shinpai", "noun", "Sự lo lắng", "Đã gặp N4 bài 26.", L),
    v(11, "たいふう", "台風", "たいふう", "taifuu", "noun", "Bão", "Đã gặp N4 bài 34.", L),
    v(12, "じしん", "地震", "じしん", "jishin", "noun", "Động đất", "Đã gặp N4 bài 34.", L),
    v(13, "びょうき", "病気", "びょうき", "byouki", "noun", "Bệnh, ốm", "Đã gặp N4 bài 26.", L),
    v(14, "うんてんします", "運転します", "うんてんします", "unten shimasu", "verb", "Lái xe", "Đã gặp N4 bài 26.", L),
    v(15, "みち", "道", "みち", "michi", "noun", "Con đường", "Đã gặp N4 bài 26.", L),
    v(16, "てんき", "天気", "てんき", "tenki", "noun", "Thời tiết", "Đã gặp N4 bài 26.", L),
    v(17, "きをつけます", "気を付けます", "きをつけます", "ki wo tsukemasu", "expression", "Cẩn thận, chú ý", "Đã gặp N4 bài 33.", L),
    v(18, "けいざい", "経済", "けいざい", "keizai", "noun", "Kinh tế", "Đã gặp N3 bài 14.", L),
    v(19, "みなさん", "皆さん", "みなさん", "minasan", "pronoun", "Mọi người", "Đã gặp N4 bài 26.", L),
    v(20, "ひと", "人", "ひと", "hito", "noun", "Người", "Đã gặp N5 bài 1.", L),
]

KANJI = [
    k(1, "危", "NGUY", 6, ["キ (ki)"], ["あぶ(ない)", "あや(うい)"], "Nguy hiểm.",
      [("危うい", "あやうい", "Nguy hiểm, nguy cấp"), ("危険", "きけん", "Nguy hiểm")], L),
    k(2, "険", "HIỂM", 11, ["ケン (ken)"], ["けわ(しい)"], "Hiểm trở, nguy hiểm.",
      [("険しい", "けわしい", "Dốc đứng, gay gắt"), ("危険", "きけん", "Nguy hiểm")], L),
    k(3, "崩", "BĂNG", 11, ["ホウ (hou)"], ["くず(れる)", "くず(す)"], "Sụp đổ.",
      [("崩れる", "くずれる", "Sụp đổ, sạt lở"), ("崩す", "くずす", "Phá vỡ")], L),
    k(4, "崖", "NHAI", 11, ["ガイ (gai)"], ["がけ"], "Vách núi, vách đá.",
      [("崖", "がけ", "Vách núi")], L),
    k(5, "無", "VÔ", 12, ["ム (mu)"], ["な(い)"], "Không, vô.",
      [("無理", "むり", "Quá sức, miễn cưỡng"), ("無料", "むりょう", "Miễn phí")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Có thể xảy ra điều xấu (xu hướng cá nhân): V-stem + かねない",
        "V-ます-stem + かねない",
        "かねない diễn tả 'CÓ THỂ XẢY RA' một điều KHÔNG TỐT/không mong muốn, dựa trên XU HƯỚNG "
        "hoặc TÍNH CÁCH của chủ thể (người/vật) — mang tính CẢNH BÁO chủ quan của người nói.",
        [
            ex(L, 1, 1, [t("t-l4s1-1", "あの"), t("t-l4s1-2", "ひと", "人", "ひと", key=True), t("t-l4s1-3", "なら"),
                         t("t-l4s1-4", "、"), t("t-l4s1-5", "あやうい", "危うい", "あやうい", key=True), t("t-l4s1-6", "こと", "事", "こと"),
                         t("t-l4s1-7", "も"), t("t-l4s1-8", "し", key=True), t("t-l4s1-9", "かねません", key=True)],
               "Nếu là người đó thì có thể làm cả điều nguy hiểm."),
            ex(L, 1, 2, [t("t-l4s1-10", "むり", "無理", "むり", key=True), t("t-l4s1-11", "を"),
                         t("t-l4s1-12", "すると"), t("t-l4s1-13", "、"), t("t-l4s1-14", "びょうき", "病気", "びょうき", key=True),
                         t("t-l4s1-15", "に"), t("t-l4s1-16", "なり", key=True), t("t-l4s1-17", "かねません", key=True)],
               "Nếu làm việc quá sức, có thể sẽ bị ốm."),
        ],
        tips="かねない chỉ dùng cho khả năng XẤU/KHÔNG MONG MUỐN — không dùng cho điều tốt (không nói '成功しかねない').",
        culture="Đồng nghiệp Nhật hay cảnh báo nhau: '無理をすると、体を崩しかねませんよ' (nếu làm việc quá sức, có thể sẽ làm hại sức khỏe đấy)."),

    slide(L, 2,
        "2. Có nguy cơ (khách quan, trang trọng): V(từ điển)/N + おそれがある",
        "V(thể từ điển)/N + おそれがある",
        "おそれがある diễn tả 'CÓ NGUY CƠ/KHẢ NĂNG' xảy ra một điều xấu — TRANG TRỌNG, thường "
        "dùng trong dự báo/cảnh báo CHÍNH THỨC (thời tiết, thiên tai, rủi ro khách quan có căn cứ).",
        [
            ex(L, 2, 1, [t("t-l4s2-1", "たいふう", "台風", "たいふう", key=True), t("t-l4s2-2", "で"),
                         t("t-l4s2-3", "がけ", "崖", "がけ", key=True), t("t-l4s2-4", "が"),
                         t("t-l4s2-5", "くずれる", "崩れる", "くずれる", key=True), t("t-l4s2-6", "おそれが", key=True),
                         t("t-l4s2-7", "あります", "有ります", "あります")],
               "Do bão, có nguy cơ vách núi sạt lở."),
            ex(L, 2, 2, [t("t-l4s2-8", "けいざい", "経済", "けいざい", key=True), t("t-l4s2-9", "が"),
                         t("t-l4s2-10", "あやうく", "危うく", "あやうく", key=True), t("t-l4s2-11", "なる"),
                         t("t-l4s2-12", "おそれが", key=True), t("t-l4s2-13", "あります", "有ります", "あります")],
               "Có nguy cơ tình hình kinh tế trở nên nguy cấp."),
        ],
        tips="おそれがある là mẫu câu CHUẨN trong bản tin thời tiết, cảnh báo thiên tai chính thức ở Nhật.",
        culture="Bản tin thời tiết Nhật: '大雨により、川が氾濫するおそれがあります' (do mưa lớn, có nguy cơ sông bị tràn)."),

    slide(L, 3,
        "3. So sánh かねない và おそれがある",
        "かねない: xu hướng/hành vi CÁ NHÂN (cảnh báo chủ quan)　vs　おそれがある: nguy cơ KHÁCH QUAN (thiên tai/sự kiện lớn, trang trọng)",
        "かねない thường dùng cho HÀNH VI của một NGƯỜI/VẬT CỤ THỂ dựa trên tính cách/xu hướng đã "
        "biết; おそれがある thường dùng cho SỰ KIỆN KHÁCH QUAN quy mô lớn (thiên tai, kinh tế, sức khỏe cộng đồng) với căn cứ khoa học/thống kê.",
        [
            ex(L, 3, 1, [t("t-l4s3-1", "かれ", "彼", "かれ"), t("t-l4s3-2", "は"), t("t-l4s3-3", "あやうい", "危うい", "あやうい", key=True),
                         t("t-l4s3-4", "こと", "事", "こと"), t("t-l4s3-5", "を"), t("t-l4s3-6", "し", key=True),
                         t("t-l4s3-7", "かねません", key=True)],
               "Anh ta có thể làm điều nguy hiểm. (tính cách cá nhân)"),
            ex(L, 3, 2, [t("t-l4s3-8", "じしん", "地震", "じしん", key=True), t("t-l4s3-9", "の"),
                         t("t-l4s3-10", "おそれが", key=True), t("t-l4s3-11", "あります", "有ります", "あります")],
               "Có nguy cơ xảy ra động đất. (dự báo khách quan, khoa học)"),
        ],
        tips="Mẹo: cảnh báo về NGƯỜI/HÀNH VI cụ thể → かねない; cảnh báo về THIÊN TAI/SỰ KIỆN lớn, chính thức → おそれがある.",
        culture="Cả hai đều là ngữ pháp N2 trọng điểm, thường lẫn lộn vì cùng dịch là 'có thể/có nguy cơ' — cần dựa vào chủ thể (cá nhân/sự kiện lớn) để chọn đúng."),

    slide(L, 4,
        "4. Kết hợp thực tế: cảnh báo toàn diện",
        "[Lý do]ので/なので、[hành vi cá nhân]かねません。[Lý do khách quan]おそれがあるので、[khuyến cáo]",
        "Trong thực tế, biển cảnh báo/thông báo an toàn thường kết hợp CẢ HAI: nêu NGUY CƠ KHÁCH "
        "QUAN (おそれがある) trước, rồi cảnh báo HÀNH VI CÁ NHÂN có thể gây hậu quả (かねない) sau.",
        [
            ex(L, 4, 1, [t("t-l4s4-1", "けわしい", "険しい", "けわしい", key=True), t("t-l4s4-2", "みち", "道", "みち", key=True),
                         t("t-l4s4-3", "なので"), t("t-l4s4-4", "、"), t("t-l4s4-5", "じこ", "事故", "じこ", key=True),
                         t("t-l4s4-6", "が"), t("t-l4s4-7", "おこり"), t("t-l4s4-8", "かねません", key=True), t("t-l4s4-9", "。"),
                         t("t-l4s4-10", "うんてん", "運転", "うんてん", key=True), t("t-l4s4-11", "には"),
                         t("t-l4s4-12", "じゅうぶん"), t("t-l4s4-13", "ちゅうい", "注意", "ちゅうい", key=True), t("t-l4s4-14", "して"),
                         t("t-l4s4-15", "ください")],
               "Vì đường hiểm trở, có thể xảy ra tai nạn. Xin hãy chú ý đầy đủ khi lái xe."),
            ex(L, 4, 2, [t("t-l4s4-16", "たいふう", "台風", "たいふう", key=True), t("t-l4s4-17", "の"),
                         t("t-l4s4-18", "ため"), t("t-l4s4-19", "、"), t("t-l4s4-20", "がけ", "崖", "がけ", key=True),
                         t("t-l4s4-21", "が"), t("t-l4s4-22", "くずれる", "崩れる", "くずれる", key=True), t("t-l4s4-23", "おそれが", key=True),
                         t("t-l4s4-24", "ある"), t("t-l4s4-25", "ので"), t("t-l4s4-26", "、"), t("t-l4s4-27", "みなさん", "皆さん", "みなさん", key=True),
                         t("t-l4s4-28", "きをつけて", "気を付けて", "きをつけて"), t("t-l4s4-29", "ください")],
               "Do bão, có nguy cơ sạt lở vách núi, xin mọi người hãy cẩn thận."),
        ],
        tips="Cấu trúc kết hợp này là mẫu câu chuẩn cho BIỂN BÁO AN TOÀN, THÔNG BÁO NỘI BỘ ở nơi làm việc, trường học Nhật.",
        culture="Biển cảnh báo trên đường núi ở Nhật thường viết cả hai: 'この先、崖崩れのおそれがあります。運転には十分注意してください'."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d4-1", "てんき", "天気", "てんき", key=True), t("d4-2", "が"), t("d4-3", "わるい"),
          t("d4-4", "です", "です", "です"), t("d4-5", "ね")],
         "Thời tiết xấu nhỉ."),
    line(L, 2, "サントス", "Đồng nghiệp",
         [t("d4-6", "はい"), t("d4-7", "。"), t("d4-8", "たいふう", "台風", "たいふう", key=True), t("d4-9", "で"),
          t("d4-10", "がけ", "崖", "がけ", key=True), t("d4-11", "が"), t("d4-12", "くずれる", "崩れる", "くずれる", key=True),
          t("d4-13", "おそれが", key=True), t("d4-14", "あります", "有ります", "あります")],
         "Vâng. Do bão, có nguy cơ vách núi sạt lở."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d4-15", "けわしい", "険しい", "けわしい", key=True), t("d4-16", "みち", "道", "みち", key=True), t("d4-17", "は"),
          t("d4-18", "きけん", "危険", "きけん", key=True), t("d4-19", "です", "です", "です"), t("d4-20", "ね")],
         "Đường hiểm trở thì nguy hiểm nhỉ."),
    line(L, 4, "サントス", "Đồng nghiệp",
         [t("d4-21", "はい"), t("d4-22", "。"), t("d4-23", "じこ", "事故", "じこ", key=True), t("d4-24", "が"),
          t("d4-25", "おこり"), t("d4-26", "かねません", key=True)],
         "Vâng. Có thể xảy ra tai nạn."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d4-27", "うんてん", "運転", "うんてん", key=True), t("d4-28", "する"), t("d4-29", "とき", "時", "とき"),
          t("d4-30", "は"), t("d4-31", "ちゅうい", "注意", "ちゅうい", key=True), t("d4-32", "して", key=True),
          t("d4-33", "ください")],
         "Khi lái xe, hãy chú ý nhé."),
    line(L, 6, "サントス", "Đồng nghiệp",
         [t("d4-34", "むり", "無理", "むり", key=True), t("d4-35", "を"), t("d4-36", "すると"), t("d4-37", "、"),
          t("d4-38", "からだ", "体", "からだ"), t("d4-39", "を"), t("d4-40", "くずし", "崩し", "くずし", key=True),
          t("d4-41", "かねません", key=True), t("d4-42", "ね")],
         "Nếu làm việc quá sức, có thể sẽ làm hại sức khỏe nhỉ."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d4-43", "けいざい", "経済", "けいざい", key=True), t("d4-44", "も"), t("d4-45", "あやうく", "危うく", "あやうく", key=True),
          t("d4-46", "なる"), t("d4-47", "おそれが", key=True), t("d4-48", "あります", "有ります", "あります")],
         "Kinh tế cũng có nguy cơ trở nên nguy cấp."),
    line(L, 8, "サントス", "Đồng nghiệp",
         [t("d4-49", "しんぱい", "心配", "しんぱい", key=True), t("d4-50", "です", "です", "です"), t("d4-51", "ね")],
         "Đáng lo thật nhỉ."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d4-52", "みなさん", "皆さん", "みなさん", key=True), t("d4-53", "、"), t("d4-54", "きをつけて", "気を付けて", "きをつけて"),
          t("d4-55", "ください")],
         "Mọi người, hãy cẩn thận nhé."),
    line(L, 10, "サントス", "Đồng nghiệp",
         [t("d4-56", "はい"), t("d4-57", "、"), t("d4-58", "わかりました", "分かりました", "わかりました")],
         "Vâng, đã hiểu rồi."),
]

EXERCISES = [
    q(L, 1, "「無理をすると、病気になりかねません」 — かねない diễn tả điều gì?",
      ["Có thể xảy ra điều xấu, dựa trên xu hướng/hành vi cụ thể (cảnh báo chủ quan)",
       "Có nguy cơ khách quan xảy ra thiên tai", "Sự khẳng định chắc chắn tuyệt đối",
       "Sự từ chối lịch sự"], 0,
      "かねない diễn tả khả năng xảy ra điều KHÔNG TỐT dựa trên hành vi/xu hướng cụ thể của chủ thể.",
      "Xem cấu trúc かねない ở slide 1."),
    q(L, 2, "「台風で崖が崩れるおそれがあります」 — おそれがある khác かねない ở điểm nào?",
      ["おそれがある khách quan, trang trọng, dùng cho thiên tai/sự kiện lớn",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "おそれがある chỉ dùng cho câu hỏi", "かねない chỉ dùng cho phủ định"], 0,
      "おそれがある dùng cho nguy cơ KHÁCH QUAN quy mô lớn (thiên tai), khác かねない là hành vi cá nhân.",
      "Xem giải thích おそれがある ở slide 2."),
    q(L, 3, "かねない có thể dùng cho khả năng TỐT (thành công) không?",
      ["Không, かねない chỉ dùng cho khả năng XẤU/không mong muốn",
       "Có, dùng được cho cả tốt lẫn xấu", "Chỉ dùng được cho khả năng tốt",
       "Chỉ dùng được trong câu phủ định"], 0,
      "かねない CHỈ dùng cho khả năng XẤU — không nói '成功しかねない' (có thể thành công).",
      "Xem lưu ý ngữ pháp ở slide 1."),
    q(L, 4, "「彼は危ういことをしかねません」 và 「地震のおそれがあります」 khác nhau ở đâu?",
      ["Câu đầu về HÀNH VI của một người cụ thể; câu sau về SỰ KIỆN khách quan quy mô lớn",
       "Không có gì khác nhau cả", "Câu đầu là quá khứ, câu sau là hiện tại",
       "Câu sau là phủ định của câu đầu"], 0,
      "かねない gắn với hành vi CÁ NHÂN; おそれがある gắn với sự kiện KHÁCH QUAN như động đất.",
      "So sánh hai câu ở slide 3."),
    q(L, 5, "Cấu trúc おそれがある thường xuất hiện ở đâu?",
      ["Bản tin thời tiết, cảnh báo thiên tai chính thức", "Chỉ trong thơ ca",
       "Chỉ trong tin nhắn thân mật giữa bạn bè", "Không bao giờ được sử dụng"], 0,
      "おそれがある là mẫu câu CHUẨN trong bản tin thời tiết, cảnh báo thiên tai chính thức ở Nhật.",
      "Xem ví dụ văn hóa ở slide 2."),
    q(L, 6, "「険しい道なので、事故が起こりかねません」 nghĩa là:",
      ["Vì đường hiểm trở, có thể xảy ra tai nạn (cảnh báo dựa trên tình huống cụ thể)",
       "Đường này hoàn toàn an toàn", "Tai nạn chắc chắn sẽ không xảy ra",
       "Đường này đã được sửa chữa"], 0,
      "かねません ở đây cảnh báo khả năng xảy ra tai nạn dựa trên đặc điểm cụ thể của con đường (hiểm trở).",
      "Áp dụng cấu trúc V-stemかねない cho ngữ cảnh câu."),
    q(L, 7, "Trong biển báo an toàn, thứ tự thường gặp của おそれがある và かねない là gì?",
      ["Nêu nguy cơ khách quan (おそれがある) trước, rồi cảnh báo hành vi cá nhân (かねない) sau",
       "Luôn dùng かねない trước, おそれがある sau", "Chỉ dùng một trong hai, không kết hợp",
       "Thứ tự không quan trọng"], 0,
      "Biển báo an toàn thường nêu nguy cơ khách quan trước (おそれがある), rồi cảnh báo hành vi cá nhân có thể gây hậu quả (かねない).",
      "Xem mẫu câu kết hợp ở slide 4."),
    q(L, 8, "Theo hội thoại, vì sao có nguy cơ vách núi sạt lở?",
      ["Do bão (台風で崖が崩れるおそれがあります)", "Do động đất", "Do con người phá hoại",
       "Không được đề cập trong hội thoại"], 0,
      "Santos nói 「台風で崖が崩れるおそれがあります」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Santos cảnh báo điều gì về việc làm việc quá sức?",
      ["Có thể sẽ làm hại sức khỏe (体を崩しかねません)", "Sẽ được tăng lương",
       "Không có ảnh hưởng gì", "Sẽ được nghỉ phép"], 0,
      "Santos nói 「無理をすると、体を崩しかねませんね」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "田中 nhận định gì về nền kinh tế?",
      ["Có nguy cơ trở nên nguy cấp (経済も危うくなるおそれがあります)",
       "Đang phát triển rất tốt", "Đã ổn định hoàn toàn",
       "Không được đề cập trong hội thoại"], 0,
      "田中 nói 「経済も危うくなるおそれがあります」.",
      "Xem câu thoại thứ 7."),
]

LESSON = lesson(
    L,
    "Bài 4: Nguy cơ & Khả năng xấu (かねない & おそれがある)",
    "かねない diễn tả 'có thể xảy ra' một điều KHÔNG TỐT dựa trên XU HƯỚNG/HÀNH VI của một "
    "người/vật cụ thể — cảnh báo chủ quan; おそれがある diễn tả 'có nguy cơ' xảy ra điều xấu một "
    "cách KHÁCH QUAN, TRANG TRỌNG — thường dùng cho thiên tai, sự kiện lớn có căn cứ; hai cấu trúc "
    "thường được kết hợp trong biển báo an toàn thực tế.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
