# -*- coding: utf-8 -*-
"""N5 — Bài 17: Thể ない (Vないでください / Vなければなりません / Vなくてもいいです).

Bai ban le thu hai: sau the て (bai 14), day la the phu dinh nen ngu phap
(ない形). Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 17
pool = Pool("n5")

VOCAB = [
    v(1,  "のみます", "飲みます", "のみます", "nomimasu", "verb", "Uống (thuốc, nước)", "Thể ない: 飲まない. Nhóm 1 đuôi む→まない.", L),
    v(2,  "かきます", "書きます", "かきます", "kakimasu", "verb", "Viết", "Thể ない: 書かない. Nhóm 1 đuôi く→かない.", L),
    v(3,  "たべます", "食べます", "たべます", "tabemasu", "verb", "Ăn", "Thể ない: 食べない. Nhóm 2: bỏ ます thêm ない.", L),
    v(4,  "きます", "来ます", "きます", "kimasu", "verb", "Đến", "Thể ない: 来ない (こない — đọc khác hẳn 来る). Nhóm 3 bất quy tắc.", L),
    v(5,  "します", "", "", "shimasu", "verb", "Làm", "Thể ない: しない. Nhóm 3 bất quy tắc.", L),
    v(6,  "わすれます", "忘れます", "わすれます", "wasuremasu", "verb", "Quên", "Thể ない: 忘れない. Nhóm 2.", L),
    v(7,  "はいります", "入ります", "はいります", "hairimasu", "verb", "Vào", "Đã gặp bài 15. Thể ない: 入らない (nhóm 1 dù trông giống nhóm 2).", L),
    v(8,  "すいます", "吸います", "すいます", "suimasu", "verb", "Hút thuốc", "Đã gặp bài 6. Thể ない: 吸わない (đuôi う→わない, KHÔNG phải あない).", L),
    v(9,  "くすり", "薬", "くすり", "kusuri", "noun", "Thuốc", "薬を 飲みます (uống thuốc, KHÔNG nói 食べます thuốc).", L),
    v(10, "びょうき", "病気", "びょうき", "byouki", "noun", "Bệnh, ốm", "病気に なります = bị bệnh.", L),
    v(11, "びょういん", "病院", "びょういん", "byouin", "noun", "Bệnh viện", "Đã gặp bài 3.", L),
    v(12, "いしゃ", "医者", "いしゃ", "isha", "noun", "Bác sĩ", "Đã gặp bài 1.", L),
    v(13, "しゅくだい", "宿題", "しゅくだい", "shukudai", "noun", "Bài tập về nhà", "Đã gặp bài 7 — nay dùng làm nghĩa vụ.", L),
    v(14, "かいぎ", "会議", "かいぎ", "kaigi", "noun", "Cuộc họp", "会議に 出ます = tham dự họp.", L),
    v(15, "パスポート", "", "", "pasupooto", "noun", "Hộ chiếu", "パスポートを 忘れないで ください = xin đừng quên hộ chiếu.", L),
    v(16, "うんてん", "運転", "うんてん", "unten", "noun", "Việc lái xe", "運転します = lái xe.", L),
    v(17, "めんきょ", "免許", "めんきょ", "menkyo", "noun", "Giấy phép, bằng lái", "運転免許 = bằng lái xe.", L),
    v(18, "テスト", "", "", "tesuto", "noun", "Bài kiểm tra", "Đã gặp bài 15.", L),
    v(19, "だいじょうぶ", "大丈夫", "だいじょうぶ", "daijoubu", "adjective", "Ổn, không sao", "Đã gặp bài 15.", L),
    v(20, "しんぱい", "心配", "しんぱい", "shinpai", "adjective", "Lo lắng", "Tính từ な. 心配しないで ください = xin đừng lo.", L),
]

KANJI = [
    k(1, "薬", "DƯỢC", 16, ["ヤク (yaku)"], ["くすり"], "Thuốc.",
      [("薬", "くすり", "Thuốc"), ("薬局", "やっきょく", "Hiệu thuốc"), ("薬品", "やくひん", "Dược phẩm")], L),
    k(2, "病", "BỆNH", 10, ["ビョウ (byou)"], ["やまい"], "Bệnh, ốm.",
      [("病気", "びょうき", "Bệnh"), ("病院", "びょういん", "Bệnh viện"), ("急病", "きゅうびょう", "Bệnh cấp tính")], L),
    k(3, "医", "Y", 7, ["イ (i)"], [], "Y học, chữa bệnh.",
      [("医者", "いしゃ", "Bác sĩ"), ("医学", "いがく", "Y học"), ("医院", "いいん", "Phòng khám")], L),
    k(4, "忘", "VONG", 7, ["ボウ (bou)"], ["わす(れる)"], "Quên. Bộ 心 (tâm) bên dưới — quên trong lòng.",
      [("忘れます", "わすれます", "Quên"), ("忘れ物", "わすれもの", "Đồ bỏ quên"), ("備忘録", "びぼうろく", "Sổ tay ghi nhớ")], L),
    k(5, "運", "VẬN", 12, ["ウン (un)"], ["はこ(ぶ)"], "Vận chuyển, vận may.",
      [("運転", "うんてん", "Lái xe"), ("運びます", "はこびます", "Vận chuyển"), ("運動", "うんどう", "Vận động")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chia thể ない (phủ định thông thường)",
        "Nhóm 1: đuôi う→わ, く→か, ぐ→が, す→さ, つ→た, ぬ→な, ぶ→ば, む→ま + ない　/　Nhóm 2: bỏ ます + ない",
        "Thể ない là dạng phủ định THÂN MẬT của động từ — nền tảng cho hàng loạt cấu trúc ngữ pháp "
        "ở bài này. Nhóm 1 đổi âm cuối của gốc từ điển sang HÀNG あ rồi thêm ない.",
        [
            ex(L, 1, 1, [t("t-l17s1-1", "のまない", "飲まない", "のまない", key=True), t("t-l17s1-2", "で"),
                         t("t-l17s1-3", "ください")],
               "Xin đừng uống. (飲む: む→まない)"),
            ex(L, 1, 2, [t("t-l17s1-4", "すわない", "吸わない", "すわない", key=True), t("t-l17s1-5", "で"),
                         t("t-l17s1-6", "ください")],
               "Xin đừng hút thuốc. (吸う: う→わない, KHÔNG phải あない)"),
            ex(L, 1, 3, [t("t-l17s1-7", "たべない", "食べない", "たべない", key=True), t("t-l17s1-8", "で"),
                         t("t-l17s1-9", "ください")],
               "Xin đừng ăn. (食べる nhóm 2: bỏ ます, thêm ない)"),
        ],
        tips="Đuôi う đặc biệt: đổi thành わ chứ không phải あ — 吸う → 吸わない, không phải 吸あない.",
        culture="来る và する chia thể ない hoàn toàn bất quy tắc: 来ない (こない, đọc khác hẳn) và しない — phải học thuộc riêng."),

    slide(L, 2,
        "2. Yêu cầu không làm: Vないで ください",
        "[Thể ない bỏ い] + で + ください",
        "Đối lập với Vてください (bài 14) — Vないでください yêu cầu người nghe ĐỪNG làm gì. "
        "Cấu trúc rất giống nhau về hình thức, chỉ khác ở thể khẳng định/phủ định của động từ.",
        [
            ex(L, 2, 1, [t("t-l17s2-1", "しんぱい", "心配", "しんぱい"), t("t-l17s2-2", "しないで", "しないで", "しないで", key=True),
                         t("t-l17s2-3", "ください")],
               "Xin đừng lo lắng."),
            ex(L, 2, 2, [t("t-l17s2-4", "パスポート"), t("t-l17s2-5", "を"), t("t-l17s2-6", "わすれないで", "忘れないで", "わすれないで", key=True),
                         t("t-l17s2-7", "ください")],
               "Xin đừng quên hộ chiếu."),
        ],
        tips="So sánh trực tiếp: Vて+ください (làm ơn HÃY làm) khác Vない+で+ください (làm ơn ĐỪNG làm) — chỉ khác đuôi động từ.",
        culture="Biển báo 「立ち入らないでください」 (xin đừng vào) thường thấy ở khu vực công trường, khu riêng tư tại Nhật."),

    slide(L, 3,
        "3. Nghĩa vụ bắt buộc: Vなければ なりません",
        "[Thể ない bỏ い] + ければ + なりません",
        "Diễn tả một việc BẮT BUỘC phải làm — nghĩa đen gần như 'nếu không làm thì không được'. "
        "Đây là cấu trúc N5 dài và khó nhớ nhất, nhưng cực kỳ thông dụng trong giao tiếp thực tế.",
        [
            ex(L, 3, 1, [t("t-l17s3-1", "くすり", "薬", "くすり"), t("t-l17s3-2", "を"),
                         t("t-l17s3-3", "のまなければ", "飲まなければ", "のまなければ", key=True), t("t-l17s3-4", "なりません", key=True)],
               "Tôi phải uống thuốc."),
            ex(L, 3, 2, [t("t-l17s3-5", "あした"), t("t-l17s3-6", "、"), t("t-l17s3-7", "かいぎ", "会議", "かいぎ"),
                         t("t-l17s3-8", "に"), t("t-l17s3-9", "でなければ", "出なければ", "でなければ", key=True),
                         t("t-l17s3-10", "なりません", key=True)],
               "Ngày mai tôi phải tham dự họp."),
        ],
        tips="Nói tắt trong giao tiếp thân mật: なければ → なきゃ (くすりを 飲まなきゃ) — sẽ gặp nhiều trong hội thoại tự nhiên.",
        culture="なければなりません nghe khá trang trọng — bạn bè thân thường dùng dạng rút gọn なきゃ cho tự nhiên hơn."),

    slide(L, 4,
        "4. Không bắt buộc: Vなくても いいです",
        "[Thể ない bỏ い] + くても + いいです",
        "Đối lập với Vなければなりません — báo rằng KHÔNG CẦN làm việc đó cũng không sao. "
        "So sánh với Vてもいいです (bài 15, xin phép LÀM) — đây là 'được phép KHÔNG làm'.",
        [
            ex(L, 4, 1, [t("t-l17s4-1", "きょう", "今日", "きょう"), t("t-l17s4-2", "は"),
                         t("t-l17s4-3", "しゅくだい", "宿題", "しゅくだい"), t("t-l17s4-4", "を"),
                         t("t-l17s4-5", "しなくても", "しなくても", "しなくても", key=True), t("t-l17s4-6", "いいです", key=True)],
               "Hôm nay không cần làm bài tập cũng được."),
            ex(L, 4, 2, [t("t-l17s4-7", "テスト"), t("t-l17s4-8", "は"), t("t-l17s4-9", "らいしゅう", "来週", "らいしゅう"),
                         t("t-l17s4-10", "です"), t("t-l17s4-11", "から"), t("t-l17s4-12", "、"),
                         t("t-l17s4-13", "きょう", "今日", "きょう"), t("t-l17s4-14", "べんきょう", "勉強", "べんきょう"),
                         t("t-l17s4-15", "しなくても", "しなくても", "しなくても", key=True), t("t-l17s4-16", "いいです", key=True)],
               "Vì kiểm tra tuần sau nên hôm nay không học cũng được."),
        ],
        tips="Bốn cấu trúc đối lập cần nhớ theo cặp: てもいい(được làm)⇄てはいけません(cấm), なければならない(phải làm)⇄なくてもいい(không cần làm).",
        culture="なくてもいいです thường dùng để TRẤN AN ai đó đang lo lắng về việc phải hoàn thành nghĩa vụ nào đó."),
]

DIALOGUE = [
    line(L, 1, "ミラー", "Bệnh nhân",
         [t("d-l17-1", "せんせい", "先生", "せんせい"), t("d-l17-2", "、"), t("d-l17-3", "びょうき", "病気", "びょうき", key=True),
          t("d-l17-4", "です"), t("d-l17-5", "か")],
         "Thưa bác sĩ, tôi bị bệnh à?"),
    line(L, 2, "医者", "Bác sĩ",
         [t("d-l17-6", "しんぱい", "心配", "しんぱい", key=True), t("d-l17-7", "しないで", "しないで", "しないで", key=True),
          t("d-l17-8", "ください"), t("d-l17-9", "。"), t("d-l17-10", "でも"), t("d-l17-11", "、"),
          t("d-l17-12", "くすり", "薬", "くすり", key=True), t("d-l17-13", "を"),
          t("d-l17-14", "のまなければ", "飲まなければ", "のまなければ", key=True), t("d-l17-15", "なりません", key=True)],
         "Xin đừng lo lắng. Nhưng anh phải uống thuốc."),
    line(L, 3, "ミラー", "Bệnh nhân",
         [t("d-l17-16", "はい"), t("d-l17-17", "、"), t("d-l17-18", "わかりました", "分かりました", "わかりました"),
          t("d-l17-19", "。"), t("d-l17-20", "しごと", "仕事", "しごと"), t("d-l17-21", "は"),
          t("d-l17-22", "どうですか")],
         "Vâng, tôi hiểu rồi. Còn công việc thì sao ạ?"),
    line(L, 4, "医者", "Bác sĩ",
         [t("d-l17-23", "きょう", "今日", "きょう"), t("d-l17-24", "は"), t("d-l17-25", "はたらかなくても", "働かなくても", "はたらかなくても", key=True),
          t("d-l17-26", "いいです", key=True), t("d-l17-27", "。"), t("d-l17-28", "うち", "家", "うち"),
          t("d-l17-29", "で"), t("d-l17-30", "やすんで", "休んで", "やすんで"), t("d-l17-31", "ください")],
         "Hôm nay không cần đi làm cũng được. Anh cứ nghỉ ngơi ở nhà."),
    line(L, 5, "ミラー", "Bệnh nhân",
         [t("d-l17-32", "あした"), t("d-l17-33", "、"), t("d-l17-34", "かいぎ", "会議", "かいぎ", key=True),
          t("d-l17-35", "が"), t("d-l17-36", "あります", "有ります", "あります"), t("d-l17-37", "。"),
          t("d-l17-38", "でなければ", "出なければ", "でなければ", key=True), t("d-l17-39", "なりません", key=True), t("d-l17-40", "か")],
         "Ngày mai tôi có cuộc họp. Tôi có phải tham dự không ạ?"),
    line(L, 6, "医者", "Bác sĩ",
         [t("d-l17-41", "あした"), t("d-l17-42", "も"), t("d-l17-43", "でなくても", "出なくても", "でなくても", key=True),
          t("d-l17-44", "いいです", key=True), t("d-l17-45", "。"), t("d-l17-46", "ゆっくり"),
          t("d-l17-47", "やすんで", "休んで", "やすんで"), t("d-l17-48", "ください")],
         "Ngày mai không cần tham dự cũng được. Anh cứ nghỉ ngơi cho khỏe."),
    line(L, 7, "ミラー", "Bệnh nhân",
         [t("d-l17-49", "わかりました", "分かりました", "わかりました"), t("d-l17-50", "。"), t("d-l17-51", "くすり", "薬", "くすり"),
          t("d-l17-52", "は"), t("d-l17-53", "いつ"), t("d-l17-54", "のみますか", "飲みますか", "のみますか")],
         "Tôi hiểu rồi ạ. Vậy khi nào tôi uống thuốc?"),
    line(L, 8, "医者", "Bác sĩ",
         [t("d-l17-55", "しょくじ", "食事", "しょくじ"), t("d-l17-56", "の"), t("d-l17-57", "あと"),
          t("d-l17-58", "、"), t("d-l17-59", "のんで", "飲んで", "のんで", key=True), t("d-l17-60", "ください"),
          t("d-l17-61", "。"), t("d-l17-62", "おさけ", "お酒", "おさけ"), t("d-l17-63", "は"),
          t("d-l17-64", "のまないで", "飲まないで", "のまないで", key=True), t("d-l17-65", "ください")],
         "Sau bữa ăn thì uống. Và xin đừng uống rượu nhé."),
    line(L, 9, "ミラー", "Bệnh nhân",
         [t("d-l17-66", "はい"), t("d-l17-67", "、"), t("d-l17-68", "わかりました", "分かりました", "わかりました")],
         "Vâng, tôi hiểu rồi ạ."),
    line(L, 10, "医者", "Bác sĩ",
         [t("d-l17-69", "だいじょうぶ", "大丈夫", "だいじょうぶ", key=True), t("d-l17-70", "です"), t("d-l17-71", "よ"),
          t("d-l17-72", "。"), t("d-l17-73", "すぐ"), t("d-l17-74", "よく"), t("d-l17-75", "なります", "成ります", "なります")],
         "Không sao đâu. Anh sẽ khỏe lại nhanh thôi."),
]

EXERCISES = [
    q(L, 1, "Thể ない của 飲みます (nhóm 1, đuôi む) là:",
      ["飲まない", "飲みない", "飲まらない", "飲むない"], 0,
      "Nhóm 1 đổi đuôi む thành まない: 飲む → 飲まない.",
      "Chuyển âm cuối gốc từ điển sang hàng あ."),
    q(L, 2, "Thể ない của 吸います (nhóm 1, đuôi う) là:",
      ["吸わない", "吸あない", "吸いない", "吸うない"], 0,
      "Đuôi う là trường hợp đặc biệt: đổi thành わ chứ không phải あ. 吸う → 吸わない.",
      "Đây là ngoại lệ hay gây nhầm nhất."),
    q(L, 3, "Thể ない của 来ます (nhóm 3) là:",
      ["来ない (こない)", "来ます thêm ない", "来らない", "きます thêm ない, giữ nguyên cách đọc"], 0,
      "来る chia bất quy tắc hoàn toàn ở thể ない: 来ない đọc là こない, khác hẳn cách đọc thông thường.",
      "Đây là động từ bất quy tắc, học thuộc riêng."),
    q(L, 4, "「たばこを 吸わないで ください」 nghĩa là:",
      ["Xin đừng hút thuốc", "Xin hãy hút thuốc",
       "Đã hút thuốc rồi", "Có thể hút thuốc"], 0,
      "Vないでください là cấu trúc yêu cầu KHÔNG làm gì — đối lập với Vてください (yêu cầu làm) đã học ở bài 14.",
      "So sánh với Vてください."),
    q(L, 5, "「薬を 飲まなければ なりません」 nghĩa là:",
      ["Tôi phải uống thuốc (bắt buộc)", "Tôi không cần uống thuốc",
       "Tôi không được uống thuốc", "Tôi đã uống thuốc rồi"], 0,
      "Vなければなりません diễn tả NGHĨA VỤ bắt buộc phải làm.",
      "Đây là cấu trúc nghĩa vụ, không phải cấm đoán hay lựa chọn."),
    q(L, 6, "「今日は 働かなくても いいです」 nghĩa là:",
      ["Hôm nay không cần đi làm cũng được", "Hôm nay bắt buộc phải đi làm",
       "Hôm nay cấm đi làm", "Hôm nay đã đi làm rồi"], 0,
      "Vなくてもいいです báo rằng việc đó KHÔNG BẮT BUỘC, làm hay không đều được.",
      "Đối lập với なければなりません ở câu 5."),
    q(L, 7, "Bốn cấu trúc nào đối lập theo cặp đúng?",
      ["てもいい⇄てはいけません, なければならない⇄なくてもいい",
       "てもいい⇄なくてもいい, てはいけません⇄なければならない",
       "Tất cả bốn cấu trúc đều đồng nghĩa", "Không có cặp đối lập nào"], 0,
      "てもいい (được làm) đối lập てはいけません (cấm); なければならない (phải làm) đối lập なくてもいい (không cần làm).",
      "Xem lại ghi chú tổng kết ở slide 4."),
    q(L, 8, "Dạng nói tắt thân mật của なければなりません trong hội thoại là:",
      ["なきゃ", "なくちゃ、なけば", "ないと、なる", "なさい"], 0,
      "なければ rút gọn thành なきゃ trong giao tiếp thân mật, thông dụng hơn dạng đầy đủ trong hội thoại hằng ngày.",
      "Xem ghi chú văn hóa ở slide 3."),
    q(L, 9, "薬を 飲みます — vì sao dùng 飲みます (uống) mà không dùng 食べます (ăn)?",
      ["Tiếng Nhật coi 'uống thuốc' như một hành động uống, dù thuốc có thể là viên",
       "Đây là lỗi ngữ pháp phổ biến", "食べます cũng đúng như nhau",
       "Chỉ dùng 食べます cho thuốc dạng viên"], 0,
      "Tiếng Nhật quy ước 薬を飲みます cho MỌI loại thuốc (viên, nước, bột) — khác thói quen 'uống/ăn thuốc' linh hoạt trong tiếng Việt.",
      "Đây là quy ước cố định, không tùy dạng thuốc."),
    q(L, 10, "Trong hội thoại, bác sĩ dặn bệnh nhân điều gì về rượu?",
      ["Đừng uống rượu", "Uống rượu thoải mái", "Chỉ uống rượu vang", "Không nhắc tới rượu"], 0,
      "Bác sĩ dặn 「お酒は 飲まないで ください」 ở gần cuối hội thoại.",
      "Xem câu thoại thứ 8 của bác sĩ."),
]

LESSON = lesson(
    L,
    "Bài 17: Thể ない (Vないでください / Vなければなりません / Vなくてもいいです)",
    "Chia động từ sang thể ない (phủ định thân mật, nền tảng cho nhiều cấu trúc), yêu cầu không "
    "làm bằng Vないでください, nghĩa vụ bắt buộc bằng Vなければなりません, và việc không bắt "
    "buộc bằng Vなくてもいいです — bốn cấu trúc てもいい/てはいけません/なければならない/なくて"
    "もいい tạo thành hai cặp đối lập cần nhớ cùng nhau.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
