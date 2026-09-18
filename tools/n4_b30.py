# -*- coding: utf-8 -*-
"""N4 — Bai 30: Trang thai co chu dich てあります, chuan bi ておきます.

Noi tiep truc tiep bai 29 (tu dong tu/tha dong tu). Tu vung minh hoa
TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 30
pool = Pool("n4")

VOCAB = [
    v(1,  "じゅんびします", "準備します", "じゅんびします", "junbi shimasu", "verb", "Chuẩn bị", "準備しておきます = chuẩn bị sẵn từ trước.", L),
    v(2,  "ようい", "用意", "ようい", "youi", "noun", "Sự chuẩn bị", "用意が できています = đã chuẩn bị xong sẵn sàng.", L),
    v(3,  "かざります", "飾ります", "かざります", "kazarimasu", "verb", "Trang trí, bày biện", "花が 飾ってあります = hoa đã được bày sẵn (có chủ đích).", L),
    v(4,  "かたづけます", "片付けます", "かたづけます", "katazukemasu", "verb", "Dọn dẹp, sắp xếp", "Đã gặp bài 28.", L),
    v(5,  "あけます", "開けます", "あけます", "akemasu", "verb", "Mở (tha động từ)", "Đã gặp N5 bài 14 — nay dùng làm ví dụ てあります.", L),
    v(6,  "しめます", "閉めます", "しめます", "shimemasu", "verb", "Đóng (tha động từ)", "Đã gặp N5 bài 14.", L),
    v(7,  "かきます", "書きます", "かきます", "kakimasu", "verb", "Viết", "Đã gặp N5 bài 6 — nay dùng làm ví dụ てあります.", L),
    v(8,  "かいます", "買います", "かいます", "kaimasu", "verb", "Mua", "Đã gặp N5 bài 6 — nay dùng làm ví dụ chuẩn bị ておきます.", L),
    v(9,  "しらべます", "調べます", "しらべます", "shirabemasu", "verb", "Tra cứu, kiểm tra", "地図で 調べておきます = tra sẵn bản đồ trước.", L),
    v(10, "よやくします", "予約します", "よやくします", "yoyaku shimasu", "verb", "Đặt trước, đặt chỗ", "レストランを 予約しておきます = đặt bàn nhà hàng trước.", L),
    v(11, "パーティー", "", "", "paatii", "noun", "Bữa tiệc", "パーティーの 準備を します = chuẩn bị cho bữa tiệc.", L),
    v(12, "のみもの", "飲み物", "のみもの", "nomimono", "noun", "Đồ uống", "飲み物が 買ってあります = đồ uống đã được mua sẵn.", L),
    v(13, "たべもの", "食べ物", "たべもの", "tabemono", "noun", "Đồ ăn", "", L),
    v(14, "はな", "花", "はな", "hana", "noun", "Hoa", "Đã gặp N5 bài 16 — nay dùng làm ví dụ trang trí có chủ đích.", L),
    v(15, "しゃしん", "写真", "しゃしん", "shashin", "noun", "Bức ảnh", "Đã gặp N5 bài 6.", L),
    v(16, "かべ", "壁", "かべ", "kabe", "noun", "Bức tường", "壁に 写真が 貼ってあります = ảnh đã được dán sẵn trên tường.", L),
    v(17, "ちず", "地図", "ちず", "chizu", "noun", "Bản đồ", "Đã gặp N5 bài 7.", L),
    v(18, "レストラン", "", "", "resutoran", "noun", "Nhà hàng", "Đã gặp N5 bài 22.", L),
    v(19, "らいしゅう", "来週", "らいしゅう", "raishuu", "noun", "Tuần sau", "Đã gặp N5 bài 4.", L),
    v(20, "もう", "", "", "mou", "adverb", "Đã, rồi", "Đã gặp N5 bài 7 — nay dùng cùng てあります.", L),
]

KANJI = [
    k(1, "準", "CHUẨN", 13, ["ジュン (jun)"], [], "Chuẩn mực, chuẩn bị.",
      [("準備", "じゅんび", "Chuẩn bị"), ("標準", "ひょうじゅん", "Tiêu chuẩn"), ("準決勝", "じゅんけっしょう", "Bán kết")], L),
    k(2, "備", "BỊ", 12, ["ビ (bi)"], ["そな(える)"], "Trang bị, phòng bị.",
      [("準備", "じゅんび", "Chuẩn bị"), ("備品", "びひん", "Vật dụng trang bị"), ("設備", "せつび", "Thiết bị")], L),
    k(3, "用", "DỤNG", 5, ["ヨウ (you)"], ["もち(いる)"], "Dùng, việc cần làm.",
      [("用意", "ようい", "Sự chuẩn bị"), ("使用", "しよう", "Sử dụng"), ("用事", "ようじ", "Việc cần làm")], L),
    k(4, "飾", "SỨC", 13, ["ショク (shoku)"], ["かざ(る)"], "Trang trí, tô điểm.",
      [("飾ります", "かざります", "Trang trí"), ("装飾", "そうしょく", "Trang trí (Hán Việt)")], L),
    k(5, "調", "ĐIỀU", 15, ["チョウ (chou)"], ["しら(べる)"], "Tra cứu, điều chỉnh.",
      [("調べます", "しらべます", "Tra cứu"), ("調子", "ちょうし", "Tình trạng"), ("調味料", "ちょうみりょう", "Gia vị")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Trạng thái CÓ CHỦ ĐÍCH: N が Vてあります",
        "N + が + [Tha động từ thể て] + あります",
        "Khác Vています với tự động từ (bài 29, không rõ ai làm), てあります dùng THA ĐỘNG TỪ để "
        "nhấn mạnh: có NGƯỜI đã CHỦ ĐỘNG làm việc này VỚI MỤC ĐÍCH nào đó, kết quả còn lưu lại.",
        [
            ex(L, 1, 1, [t("t-l30s1-1", "はな", "花", "はな"), t("t-l30s1-2", "が"),
                         t("t-l30s1-3", "かざって", "飾って", "かざって", key=True), t("t-l30s1-4", "あります", key=True)],
               "Hoa đã được bày sẵn. (ai đó cố ý bày để đón khách/trang trí)"),
            ex(L, 1, 2, [t("t-l30s1-5", "かべ", "壁", "かべ"), t("t-l30s1-6", "に"),
                         t("t-l30s1-7", "しゃしん", "写真", "しゃしん"), t("t-l30s1-8", "が"),
                         t("t-l30s1-9", "かいて", "書いて", "かいて", key=True), t("t-l30s1-10", "あります", key=True)],
               "Trên tường có ghi/dán sẵn (chữ/ảnh)."),
        ],
        tips="てあります LUÔN ẩn ý có MỤC ĐÍCH phía sau — khác 開いています (chỉ đơn thuần TRẠNG THÁI, không quan tâm lý do, bài 29).",
        culture="花が飾ってあります gợi ý ngay rằng có người chuẩn bị tiếp đón khách — rất thường thấy khi miêu tả phòng khách Nhật Bản chỉn chu."),

    slide(L, 2,
        "2. So sánh てあります và ています (tự động từ)",
        "窓が開いています (tự động từ — TRẠNG THÁI, có thể do gió)　vs　窓が開けてあります (tha động từ — CÓ CHỦ ĐÍCH)",
        "Cùng miêu tả 'cửa đang mở' nhưng khác hẳn NGỤ Ý: ています chỉ nói sự thật khách quan; "
        "てあります khẳng định có AI ĐÓ cố ý mở ra vì một lý do nào đó (thông gió, đón khách...).",
        [
            ex(L, 2, 1, [t("t-l30s2-1", "まど", "窓", "まど"), t("t-l30s2-2", "が"),
                         t("t-l30s2-3", "あいて", "開いて", "あいて"), t("t-l30s2-4", "います", "居ます", "います")],
               "Cửa sổ đang mở. (có thể do gió, không rõ nguyên nhân)"),
            ex(L, 2, 2, [t("t-l30s2-5", "まど", "窓", "まど"), t("t-l30s2-6", "が"),
                         t("t-l30s2-7", "あけて", "開けて", "あけて", key=True), t("t-l30s2-8", "あります", key=True)],
               "Cửa sổ đã được mở sẵn. (ai đó cố ý mở, ví dụ để thông gió)"),
        ],
        tips="Nhìn động từ để phân biệt: tự động từ (開く) + ています = trạng thái khách quan; tha động từ (開ける) + てあります = có chủ đích.",
        culture="てあります thường xuất hiện trong miêu tả cảnh chuẩn bị chu đáo: bàn ăn, phòng khách, sự kiện — ngụ ý 'đã được lo liệu sẵn'."),

    slide(L, 3,
        "3. Chuẩn bị trước: V(て) + おきます",
        "[Tha động từ thể て] + おきます   (làm trước một việc ĐỂ chuẩn bị cho sau này)",
        "ておきます nhấn mạnh HÀNH ĐỘNG chuẩn bị (không phải trạng thái như てあります) — 'làm "
        "trước một việc gì đó để dùng/tiện lợi về sau'. Nói tắt trong khẩu ngữ: とく.",
        [
            ex(L, 3, 1, [t("t-l30s3-1", "パーティー"), t("t-l30s3-2", "の"), t("t-l30s3-3", "まえに", key=True),
                         t("t-l30s3-4", "、"), t("t-l30s3-5", "のみもの", "飲み物", "のみもの"), t("t-l30s3-6", "を"),
                         t("t-l30s3-7", "かって", "買って", "かって", key=True), t("t-l30s3-8", "おきます", key=True)],
               "Trước bữa tiệc, tôi sẽ mua đồ uống trước."),
            ex(L, 3, 2, [t("t-l30s3-9", "らいしゅう", "来週", "らいしゅう"), t("t-l30s3-10", "の"),
                         t("t-l30s3-11", "かいぎ", "会議", "かいぎ"), t("t-l30s3-12", "の"), t("t-l30s3-13", "まえに", key=True),
                         t("t-l30s3-14", "、"), t("t-l30s3-15", "しらべて", "調べて", "しらべて", key=True),
                         t("t-l30s3-16", "おきます", key=True)],
               "Trước cuộc họp tuần sau, tôi sẽ tra cứu trước."),
        ],
        tips="ておきます nhấn TƯƠNG LAI (sắp làm để chuẩn bị); てあります nhấn HIỆN TẠI (kết quả của việc chuẩn bị đã hoàn tất trước đó).",
        culture="レストランを 予約しておきます (đặt bàn trước) là thói quen phổ biến ở Nhật, đặc biệt vào dịp cuối tuần hay ngày lễ."),

    slide(L, 4,
        "4. Kết quả của ておきます chính là てあります",
        "Trước: レストランを 予約しておきます (sẽ làm)　→　Sau: レストランが 予約してあります (đã làm, kết quả còn đó)",
        "Hai cấu trúc này thường đi CHUNG một câu chuyện: ておきます mô tả HÀNH ĐỘNG chuẩn bị "
        "trước, てあります mô tả KẾT QUẢ của việc chuẩn bị đó khi đã hoàn tất.",
        [
            ex(L, 4, 1, [t("t-l30s4-1", "もう"), t("t-l30s4-2", "、"), t("t-l30s4-3", "パーティー"),
                         t("t-l30s4-4", "の"), t("t-l30s4-5", "じゅんび", "準備", "じゅんび", key=True),
                         t("t-l30s4-6", "が"), t("t-l30s4-7", "して", key=True), t("t-l30s4-8", "あります", key=True)],
               "Việc chuẩn bị cho bữa tiệc đã xong sẵn rồi."),
            ex(L, 4, 2, [t("t-l30s4-9", "たべもの", "食べ物", "たべもの"), t("t-l30s4-10", "も"),
                         t("t-l30s4-11", "かって", "買って", "かって"), t("t-l30s4-12", "おきました", key=True)],
               "Đồ ăn tôi cũng đã mua sẵn từ trước rồi."),
        ],
        tips="Câu chuyện tự nhiên: kể việc ĐÃ CHUẨN BỊ bằng ておきました (quá khứ), rồi miêu tả HIỆN TRẠNG bằng てあります.",
        culture="準備してあります (mọi thứ đã sẵn sàng) là câu trả lời tự tin, chu đáo khi có khách hỏi 'đã chuẩn bị xong chưa'."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d-l30-1", "らいしゅう", "来週", "らいしゅう", key=True), t("d-l30-2", "の"), t("d-l30-3", "パーティー"),
          t("d-l30-4", "の"), t("d-l30-5", "じゅんび", "準備", "じゅんび", key=True), t("d-l30-6", "は"),
          t("d-l30-7", "どうですか")],
         "Việc chuẩn bị cho bữa tiệc tuần sau thế nào rồi?"),
    line(L, 2, "山田", "Nhân viên công ty",
         [t("d-l30-8", "レストラン"), t("d-l30-9", "は"), t("d-l30-10", "もう"), t("d-l30-11", "よやく", "予約", "よやく"),
          t("d-l30-12", "して", key=True), t("d-l30-13", "あります", key=True)],
         "Nhà hàng thì đã đặt sẵn rồi."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d-l30-14", "のみもの", "飲み物", "のみもの", key=True), t("d-l30-15", "は"), t("d-l30-16", "どうですか")],
         "Còn đồ uống thì sao?"),
    line(L, 4, "山田", "Nhân viên công ty",
         [t("d-l30-17", "あした"), t("d-l30-18", "、"), t("d-l30-19", "かって", "買って", "かって", key=True),
          t("d-l30-20", "おきます", key=True)],
         "Ngày mai tôi sẽ mua trước."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d-l30-21", "はな", "花", "はな", key=True), t("d-l30-22", "も"), t("d-l30-23", "かざりましょう", "飾りましょう", "かざりましょう")],
         "Cũng bày hoa lên nữa nhé."),
    line(L, 6, "山田", "Nhân viên công ty",
         [t("d-l30-24", "いい"), t("d-l30-25", "アイデア"), t("d-l30-26", "です"), t("d-l30-27", "ね"), t("d-l30-28", "。"),
          t("d-l30-29", "パーティー"), t("d-l30-30", "の"), t("d-l30-31", "ひ", "日", "ひ"), t("d-l30-32", "、"),
          t("d-l30-33", "はな", "花", "はな"), t("d-l30-34", "が"), t("d-l30-35", "かざって", "飾って", "かざって", key=True),
          t("d-l30-36", "あったら", key=True), t("d-l30-37", "、"), t("d-l30-38", "きれい", "綺麗", "きれい"), t("d-l30-39", "ですね")],
         "Ý hay đấy nhỉ. Nếu hôm tiệc mà có hoa bày sẵn thì đẹp lắm nhỉ."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d-l30-40", "みち", "道", "みち"), t("d-l30-41", "は"), t("d-l30-42", "しらべて", "調べて", "しらべて", key=True),
          t("d-l30-43", "おきました", key=True), t("d-l30-44", "か")],
         "Đường đi thì anh tra sẵn chưa?"),
    line(L, 8, "山田", "Nhân viên công ty",
         [t("d-l30-45", "はい"), t("d-l30-46", "、"), t("d-l30-47", "ちず", "地図", "ちず", key=True), t("d-l30-48", "で"),
          t("d-l30-49", "しらべて", "調べて", "しらべて", key=True), t("d-l30-50", "おきました", key=True)],
         "Vâng, tôi đã tra bằng bản đồ trước rồi."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d-l30-51", "さすが", key=True), t("d-l30-52", "です"), t("d-l30-53", "ね"), t("d-l30-54", "。"),
          t("d-l30-55", "もう"), t("d-l30-56", "なにも"), t("d-l30-57", "しんぱい", "心配", "しんぱい"),
          t("d-l30-58", "いりません", "要りません", "いりません"), t("d-l30-59", "ね")],
         "Đúng là chu đáo thật đấy. Không cần lo gì nữa nhỉ."),
    line(L, 10, "山田", "Nhân viên công ty",
         [t("d-l30-60", "はい"), t("d-l30-61", "、"), t("d-l30-62", "じゅんび", "準備", "じゅんび", key=True),
          t("d-l30-63", "は"), t("d-l30-64", "ばっちり"), t("d-l30-65", "です"), t("d-l30-66", "！")],
         "Vâng, chuẩn bị hoàn hảo rồi ạ!"),
]

EXERCISES = [
    q(L, 1, "「花が 飾ってあります」 — vì sao dùng てあります chứ không phải ています?",
      ["てあります nhấn mạnh có người CHỦ ĐÍCH bày hoa, không phải trạng thái ngẫu nhiên",
       "Hoàn toàn giống nhau, dùng cái nào cũng được", "ています mới đúng, てあります sai",
       "てあります chỉ dùng cho hoa"], 0,
      "てあります dùng THA động từ, ngụ ý có người chủ động làm với mục đích — khác ています (tự động từ, trạng thái khách quan).",
      "Xem so sánh ở slide 2."),
    q(L, 2, "「窓が開いています」 và 「窓が開けてあります」 khác nhau ở:",
      ["Câu đầu là trạng thái khách quan (có thể do gió), câu sau ngụ ý có người cố ý mở",
       "Hoàn toàn giống nhau về ý nghĩa", "Câu đầu sai ngữ pháp",
       "Câu sau chỉ dùng cho câu hỏi"], 0,
      "Đây là ví dụ điển hình so sánh trực tiếp tự động từ+ています và tha động từ+てあります (bài 29 và 30).",
      "Đọc kỹ ví dụ song song ở slide 2."),
    q(L, 3, "「レストランを予約しておきます」 diễn tả điều gì?",
      ["Hành động CHUẨN BỊ trước cho tương lai (sẽ đặt bàn trước)",
       "Kết quả đã hoàn tất của việc đặt bàn", "Đang trong quá trình đặt bàn",
       "Đã hủy đặt bàn"], 0,
      "ておきます nhấn mạnh hành động LÀM TRƯỚC để chuẩn bị, hướng tới việc SẮP xảy ra.",
      "So sánh với てあります (kết quả hiện tại) ở slide 4."),
    q(L, 4, "「レストランが予約してあります」 khác 「レストランを予約しておきます」 ở thì:",
      ["てあります nói về KẾT QUẢ đã có sẵn; ておきます nói về HÀNH ĐỘNG chuẩn bị (thường ở tương lai/dự định)",
       "Hoàn toàn giống nhau", "てあります là tương lai",
       "ておきます là quá khứ hoàn thành"], 0,
      "Hai cấu trúc bổ sung cho nhau: ておきます là hành động chuẩn bị, てあります là trạng thái kết quả sau khi chuẩn bị xong.",
      "Xem mối quan hệ giữa hai cấu trúc ở slide 4."),
    q(L, 5, "Trợ từ nào đi cùng てあります (khác với てvà おきます đi với を)?",
      ["が (đối tượng của tha động từ trong てあります chuyển thành が)",
       "を (giữ nguyên như câu chủ động thường)", "に", "へ"], 0,
      "Điểm đặc biệt: てあります thường đổi trợ từ を của tha động từ thành が, dù động từ vẫn là tha động từ.",
      "So sánh trợ từ trong các câu ví dụ ở slide 1."),
    q(L, 6, "Dạng nói tắt của ておきます trong khẩu ngữ là:",
      ["とく (買っておきます → 買っとく)", "てある", "ています", "たら"], 0,
      "ておきます thường rút gọn thành とく trong hội thoại thân mật, thông dụng như くない→ん trong khẩu ngữ.",
      "Xem ghi chú ở slide 3."),
    q(L, 7, "「壁に写真が書いてあります」 nghĩa là:",
      ["Trên tường có ghi/dán sẵn (chữ hoặc ảnh, có chủ đích)",
       "Bức tường tự có ảnh xuất hiện", "Không có gì trên tường",
       "Ảnh sắp được dán lên tường"], 0,
      "てあります khẳng định có người đã CHỦ Ý làm việc này (dán/viết), để lại kết quả nhìn thấy được.",
      "Áp dụng đúng nghĩa てあります đã học ở slide 1."),
    q(L, 8, "Câu nào ĐÚNG khi nói 'trước cuộc họp, tôi sẽ tra cứu trước'?",
      ["会議の前に、調べておきます", "会議の前に、調べてあります",
       "会議の前に、調べています", "会議の前に、調べました"], 0,
      "'Trước cuộc họp... SẼ tra cứu' là hành động chuẩn bị hướng tới tương lai → dùng ておきます.",
      "Xác định đây là chuẩn bị (hành động) hay kết quả (trạng thái)."),
    q(L, 9, "Trong hội thoại, Yamada đã chuẩn bị được những gì cho bữa tiệc?",
      ["Đặt nhà hàng và tra đường đi sẵn", "Chỉ đặt nhà hàng",
       "Chưa chuẩn bị gì cả", "Mua hoa và đồ ăn"], 0,
      "Yamada nói đã 「レストランは もう予約してあります」 và 「地図で調べておきました」.",
      "Xem các câu thoại của Yamada."),
    q(L, 10, "Cuối hội thoại, Tanaka nhận xét thế nào về sự chuẩn bị của Yamada?",
      ["Khen là chu đáo (さすが)", "Chê là chưa đủ", "Không nhận xét gì", "Yêu cầu chuẩn bị thêm"], 0,
      "Tanaka nói 「さすがですね。もう何も心配いりませんね」.",
      "Xem câu thoại thứ 9."),
]

LESSON = lesson(
    L,
    "Bài 30: Trạng thái có chủ đích (てあります) & Chuẩn bị (ておきます)",
    "Nối tiếp cặp tự/tha động từ (bài 29): てあります dùng THA động từ để diễn tả trạng thái có "
    "CHỦ ĐÍCH (khác ています tự động từ chỉ nói sự thật khách quan), và ておきます diễn tả hành "
    "động CHUẨN BỊ TRƯỚC cho tương lai — hai cấu trúc thường xuất hiện nối tiếp trong một câu "
    "chuyện (chuẩn bị trước → kết quả còn lưu lại).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
