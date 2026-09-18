# -*- coding: utf-8 -*-
"""N4 — Bai 38: Danh tu hoa bang の (V-るのは, V-るのが, V-るのを忘れました).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 38
pool = Pool("n4")

VOCAB = [
    v(1,  "およぐ", "泳ぐ", "およぐ", "oyogu", "verb", "Bơi (thể từ điển)", "泳ぐのが 好きです = tôi thích (việc) bơi.", L),
    v(2,  "おどります", "踊ります", "おどります", "odorimasu", "verb", "Nhảy múa", "踊るのが 上手です = nhảy múa giỏi.", L),
    v(3,  "うたいます", "歌います", "うたいます", "utaimasu", "verb", "Hát", "Đã gặp N5 bài 18.", L),
    v(4,  "しめます", "閉めます", "しめます", "shimemasu", "verb", "Đóng (tha động từ)", "窓を 閉めるのを 忘れました = tôi đã quên đóng cửa sổ.", L),
    v(5,  "けします", "消します", "けします", "keshimasu", "verb", "Tắt, xóa", "Đã gặp N5 bài 15.", L),
    v(6,  "もってきます", "持って来ます", "もってきます", "motte kimasu", "verb", "Mang theo, đem đến", "傘を 持って来るのを 忘れました = tôi đã quên mang ô.", L),
    v(7,  "れんらくします", "連絡します", "れんらくします", "renraku shimasu", "verb", "Liên lạc", "連絡するのを 忘れないで ください = xin đừng quên liên lạc.", L),
    v(8,  "しゅみ", "趣味", "しゅみ", "shumi", "noun", "Sở thích", "私の趣味は、絵を 描くことです = sở thích của tôi là vẽ tranh (dùng こと, N5 bài 18).", L),
    v(9,  "すいえい", "水泳", "すいえい", "suiei", "noun", "Môn bơi lội", "Đã gặp bài 27.", L),
    v(10, "しゅうかん", "習慣", "しゅうかん", "shuukan", "noun", "Thói quen", "Đã gặp bài 28.", L),
    v(11, "え", "絵", "え", "e", "noun", "Tranh, hình vẽ", "Đã gặp N5 bài 9.", L),
    v(12, "うた", "歌", "うた", "uta", "noun", "Bài hát", "Đã gặp N5 bài 9.", L),
    v(13, "まど", "窓", "まど", "mado", "noun", "Cửa sổ", "Đã gặp N5 bài 14.", L),
    v(14, "かさ", "傘", "かさ", "kasa", "noun", "Cái ô, cái dù", "Đã gặp N5 bài 2.", L),
    v(15, "でんき", "電気", "でんき", "denki", "noun", "Điện, đèn điện", "Đã gặp N5 bài 15.", L),
    v(16, "やくそく", "約束", "やくそく", "yakusoku", "noun", "Lời hứa, cuộc hẹn", "約束するのを 忘れました = tôi đã quên mất lời hứa.", L),
    v(17, "しゅくだい", "宿題", "しゅくだい", "shukudai", "noun", "Bài tập về nhà", "Đã gặp N5 bài 7.", L),
    v(18, "きく", "聞く", "きく", "kiku", "verb", "Nghe (thể từ điển)", "音楽を 聞くのが 好きです = tôi thích nghe nhạc.", L),
    v(19, "みる", "見る", "みる", "miru", "verb", "Xem (thể từ điển)", "映画を 見るのが 好きです = tôi thích xem phim.", L),
    v(20, "はなす", "話す", "はなす", "hanasu", "verb", "Nói (thể từ điển)", "人と 話すのが 苦手です = tôi kém khoản nói chuyện với người khác.", L),
]

KANJI = [
    k(1, "泳", "VỊNH", 8, ["エイ (ei)"], ["およ(ぐ)"], "Bơi lội. Đã gặp N5 bài 13.",
      [("泳ぐ", "およぐ", "Bơi"), ("水泳", "すいえい", "Môn bơi lội")], L),
    k(2, "踊", "DŨNG", 14, ["ヨウ (you)"], ["おど(る)"], "Nhảy múa.",
      [("踊ります", "おどります", "Nhảy múa"), ("踊り", "おどり", "Điệu nhảy"), ("盆踊り", "ぼんおどり", "Múa Obon")], L),
    k(3, "絵", "HỘI", 12, ["カイ (kai)", "エ (e)"], [], "Tranh vẽ. Đã gặp N5 bài 9.",
      [("絵", "え", "Bức tranh"), ("絵本", "えほん", "Sách tranh")], L),
    k(4, "約", "ƯỚC", 9, ["ヤク (yaku)"], [], "Ước hẹn, giao ước.",
      [("約束", "やくそく", "Lời hứa"), ("予約", "よやく", "Đặt trước")], L),
    k(5, "束", "THÚC", 7, ["ソク (soku)"], ["たば"], "Bó lại, ràng buộc.",
      [("約束", "やくそく", "Lời hứa"), ("花束", "はなたば", "Bó hoa")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Danh từ hóa bằng の: [Thể từ điển] の は／が",
        "V(từ điển) + の + は/が/を   (の tương đương こと, N5 bài 18, nhưng dùng cho HÀNH ĐỘNG CỤ THỂ, GIÁC QUAN)",
        "の và こと (N5 bài 18) đều danh từ hóa động từ, nhưng の thiên về hành động CỤ THỂ, QUAN "
        "SÁT ĐƯỢC bằng giác quan (nhìn, nghe, thấy ai đang làm gì); こと thiên về khái niệm TRỪU TƯỢNG.",
        [
            ex(L, 1, 1, [t("t-l38s1-1", "およぐ", "泳ぐ", "およぐ", key=True), t("t-l38s1-2", "の", key=True),
                         t("t-l38s1-3", "が"), t("t-l38s1-4", "すき", "好き", "すき"), t("t-l38s1-5", "です")],
               "Tôi thích (việc) bơi. (の nhấn mạnh hành động cụ thể)"),
            ex(L, 1, 2, [t("t-l38s1-6", "ひと", "人", "ひと"), t("t-l38s1-7", "と"), t("t-l38s1-8", "はなす", "話す", "はなす"),
                         t("t-l38s1-9", "の", key=True), t("t-l38s1-10", "が"), t("t-l38s1-11", "にがて", "苦手", "にがて"),
                         t("t-l38s1-12", "です")],
               "Tôi kém khoản nói chuyện với người khác."),
        ],
        tips="Trong thực tế hai cách đều dùng được cho phần lớn câu — の tự nhiên hơn khi diễn tả hành động NHÌN THẤY/NGHE THẤY được ngay lúc đó.",
        culture="Mẫu câu 〜のが好きです/得意です/苦手です rất phổ biến trong tự giới thiệu bản thân (自己紹介) ở Nhật."),

    slide(L, 2,
        "2. Nhấn mạnh chủ đề: V(từ điển)の は、[nhận xét]",
        "V(từ điển) + の + は、[nhận xét/đánh giá]",
        "Đưa cả một HÀNH ĐỘNG lên làm CHỦ ĐỀ của câu (giống は đánh dấu chủ đề, N5 bài 1) rồi đưa "
        "ra nhận xét/đánh giá về hành động đó ở vế sau.",
        [
            ex(L, 2, 1, [t("t-l38s2-1", "まいにち", "毎日", "まいにち"), t("t-l38s2-2", "うんどう", "運動", "うんどう"),
                         t("t-l38s2-3", "する", key=True), t("t-l38s2-4", "の", key=True), t("t-l38s2-5", "は"),
                         t("t-l38s2-6", "たいせつ", "大切", "たいせつ"), t("t-l38s2-7", "です")],
               "Việc tập thể dục mỗi ngày là điều quan trọng."),
            ex(L, 2, 2, [t("t-l38s2-8", "にほんご", "日本語", "にほんご"), t("t-l38s2-9", "を"),
                         t("t-l38s2-10", "はなす", "話す", "はなす"), t("t-l38s2-11", "の", key=True), t("t-l38s2-12", "は"),
                         t("t-l38s2-13", "たのしい", "楽しい", "たのしい"), t("t-l38s2-14", "です")],
               "Việc nói tiếng Nhật rất vui."),
        ],
        tips="Cấu trúc Vのは〜 rất tiện khi ĐÁNH GIÁ một hoạt động chung chung, không nhắm tới một lần cụ thể nào.",
        culture="毎日運動するのは大切です là kiểu câu triết lý sống ngắn gọn thường thấy trong lời khuyên sức khỏe của người Nhật."),

    slide(L, 3,
        "3. Quên làm gì: V(từ điển)の を 忘れました",
        "V(từ điển) + の + を + 忘れました   (quên THỰC HIỆN một hành động)",
        "Khác 忘れます với DANH TỪ (かばんを忘れました = quên cái cặp — bỏ quên VẬT), cấu trúc này "
        "dùng の để nói QUÊN LÀM một việc gì đó — hai loại 'quên' hoàn toàn khác nhau.",
        [
            ex(L, 3, 1, [t("t-l38s3-1", "まど", "窓", "まど"), t("t-l38s3-2", "を"), t("t-l38s3-3", "しめる", "閉める", "しめる"),
                         t("t-l38s3-4", "の", key=True), t("t-l38s3-5", "を"), t("t-l38s3-6", "わすれました", "忘れました", "わすれました", key=True)],
               "Tôi đã quên đóng cửa sổ. (quên LÀM một hành động)"),
            ex(L, 3, 2, [t("t-l38s3-7", "かさ", "傘", "かさ"), t("t-l38s3-8", "を"), t("t-l38s3-9", "わすれました", "忘れました", "忘れました")],
               "Tôi đã quên (bỏ quên) cái ô. (quên một VẬT, không có の)"),
        ],
        tips="Phân biệt nhanh: có ĐỘNG TỪ trước を忘れました → quên LÀM; chỉ có DANH TỪ trước を忘れました → quên VẬT/bỏ quên đồ.",
        culture="連絡するのを忘れました là lời xin lỗi phổ biến khi quên liên lạc, nhắn tin cho ai đó trong công việc/hẹn hò."),

    slide(L, 4,
        "4. So sánh の và こと (N5 bài 18)",
        "の: hành động CỤ THỂ, giác quan (thấy/nghe/quên làm) 　こと: khái niệm TRỪU TƯỢNG, sở thích/mục tiêu chung",
        "Không phải lúc nào cũng hoán đổi được: の KHÔNG dùng được trước です trực tiếp làm câu "
        "định nghĩa (趣味は〜ことです chuẩn hơn 趣味は〜のです khi giới thiệu sở thích).",
        [
            ex(L, 4, 1, [t("t-l38s4-1", "わたし", "私", "わたし"), t("t-l38s4-2", "の"), t("t-l38s4-3", "しゅみ", "趣味", "しゅみ", key=True),
                         t("t-l38s4-4", "は"), t("t-l38s4-5", "え", "絵", "え"), t("t-l38s4-6", "を"),
                         t("t-l38s4-7", "かく", "描く", "かく"), t("t-l38s4-8", "こと", key=True), t("t-l38s4-9", "です")],
               "Sở thích của tôi là vẽ tranh. (giới thiệu sở thích: dùng こと, N5 bài 18)"),
            ex(L, 4, 2, [t("t-l38s4-10", "え", "絵", "え"), t("t-l38s4-11", "を"), t("t-l38s4-12", "かく", "描く", "かく"),
                         t("t-l38s4-13", "の", key=True), t("t-l38s4-14", "が"), t("t-l38s4-15", "すき", "好き", "すき"),
                         t("t-l38s4-16", "です")],
               "Tôi thích (việc) vẽ tranh. (nói về sở thích tức thời: dùng の)"),
        ],
        tips="Mẹo an toàn cho người mới: dùng こと khi GIỚI THIỆU/ĐỊNH NGHĨA (趣味は〜ことです); dùng の khi nói về THÍCH/GIỎI/QUÊN một hành động cụ thể.",
        culture="Cả hai cấu trúc đều xuất hiện rất nhiều trong bài luận tự giới thiệu (自己紹介文) học sinh, sinh viên Nhật hay viết."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d-l38-1", "サントスさん"), t("d-l38-2", "の"), t("d-l38-3", "しゅみ", "趣味", "しゅみ", key=True),
          t("d-l38-4", "は"), t("d-l38-5", "なん", "何", "なん"), t("d-l38-6", "ですか")],
         "Sở thích của anh Santos là gì vậy?"),
    line(L, 2, "サントス", "Sinh viên",
         [t("d-l38-7", "うた", "歌", "うた", key=True), t("d-l38-8", "を"), t("d-l38-9", "うたう", "歌う", "うたう"),
          t("d-l38-10", "こと", key=True), t("d-l38-11", "です"), t("d-l38-12", "。"), t("d-l38-13", "うたう", "歌う", "うたう"),
          t("d-l38-14", "の", key=True), t("d-l38-15", "が"), t("d-l38-16", "だいすき", "大好き", "だいすき"), t("d-l38-17", "です")],
         "Là hát. Tôi rất thích (việc) hát."),
    line(L, 3, "ワン", "Sinh viên",
         [t("d-l38-18", "おどる", "踊る", "おどる"), t("d-l38-19", "の", key=True), t("d-l38-20", "も"),
          t("d-l38-21", "じょうず", "上手", "じょうず"), t("d-l38-22", "ですか")],
         "Nhảy múa anh cũng giỏi không?"),
    line(L, 4, "サントス", "Sinh viên",
         [t("d-l38-23", "いいえ"), t("d-l38-24", "、"), t("d-l38-25", "おどる", "踊る", "おどる"),
          t("d-l38-26", "の", key=True), t("d-l38-27", "は"), t("d-l38-28", "にがて", "苦手", "にがて"),
          t("d-l38-29", "です")],
         "Không, khoản nhảy múa thì tôi kém."),
    line(L, 5, "ワン", "Sinh viên",
         [t("d-l38-30", "そうですか"), t("d-l38-31", "。"), t("d-l38-32", "ところで"), t("d-l38-33", "、"),
          t("d-l38-34", "きょう", "今日", "きょう"), t("d-l38-35", "、"), t("d-l38-36", "せんせい", "先生", "せんせい"),
          t("d-l38-37", "に"), t("d-l38-38", "れんらく", "連絡", "れんらく"), t("d-l38-39", "しました", "しました", "しました"), t("d-l38-40", "か")],
         "Vậy à. À mà, hôm nay cậu đã liên lạc với thầy giáo chưa?"),
    line(L, 6, "サントス", "Sinh viên",
         [t("d-l38-41", "あ"), t("d-l38-42", "！"), t("d-l38-43", "れんらく", "連絡", "れんらく", key=True),
          t("d-l38-44", "する", key=True), t("d-l38-45", "の", key=True), t("d-l38-46", "を"),
          t("d-l38-47", "わすれました", "忘れました", "わすれました", key=True)],
         "A! Tôi đã quên mất việc liên lạc rồi."),
    line(L, 7, "ワン", "Sinh viên",
         [t("d-l38-48", "はやく"), t("d-l38-49", "れんらく", "連絡", "れんらく"), t("d-l38-50", "した"),
          t("d-l38-51", "ほうが", key=True), t("d-l38-52", "いいです", key=True), t("d-l38-53", "よ")],
         "Cậu nên liên lạc sớm đi."),
    line(L, 8, "サントス", "Sinh viên",
         [t("d-l38-54", "はい"), t("d-l38-55", "、"), t("d-l38-56", "いま"), t("d-l38-57", "から"),
          t("d-l38-58", "れんらく", "連絡", "れんらく"), t("d-l38-59", "します")],
         "Vâng, bây giờ tôi liên lạc luôn."),
    line(L, 9, "ワン", "Sinh viên",
         [t("d-l38-60", "まいにち", "毎日", "まいにち"), t("d-l38-61", "の"), t("d-l38-62", "しゅうかん", "習慣", "しゅうかん", key=True),
          t("d-l38-63", "を"), t("d-l38-64", "つくる", "作る", "つくる"), t("d-l38-65", "の", key=True), t("d-l38-66", "は"),
          t("d-l38-67", "たいせつ", "大切", "たいせつ"), t("d-l38-68", "です")],
         "Tạo thói quen mỗi ngày là điều quan trọng đấy."),
    line(L, 10, "サントス", "Sinh viên",
         [t("d-l38-69", "そうですね"), t("d-l38-70", "。"), t("d-l38-71", "これから"), t("d-l38-72", "は"),
          t("d-l38-73", "わすれない", "忘れない", "わすれない"), t("d-l38-74", "ように", key=True),
          t("d-l38-75", "き", "気", "き"), t("d-l38-76", "を"), t("d-l38-77", "つけます", "付けます", "つけます")],
         "Đúng vậy nhỉ. Từ nay tôi sẽ cẩn thận để không quên nữa."),
]

EXERCISES = [
    q(L, 1, "「泳ぐのが好きです」 — の ở đây có vai trò gì?",
      ["Danh từ hóa động từ 泳ぐ thành 'việc bơi' để làm chủ ngữ",
       "Chỉ sở hữu, giống の ở bài 2", "Là trợ từ nối câu hỏi",
       "Không có nghĩa gì đặc biệt"], 0,
      "の biến động từ (泳ぐ) thành danh từ trừu tượng, giống chức năng こと (N5 bài 18) nhưng thiên về hành động cụ thể hơn.",
      "So sánh với chức năng の sở hữu đã học ở N5 bài 2."),
    q(L, 2, "の và こと khác nhau chủ yếu ở:",
      ["の thiên về hành động cụ thể/giác quan; こと thiên về khái niệm trừu tượng, định nghĩa",
       "Hoàn toàn giống nhau, hoán đổi tự do mọi lúc", "の chỉ dùng cho câu phủ định",
       "こと chỉ dùng cho câu hỏi"], 0,
      "Tuy phần lớn hoán đổi được, の tự nhiên hơn cho hành động CỤ THỂ (nhìn/nghe/quên làm), こと tự nhiên hơn cho ĐỊNH NGHĨA/GIỚI THIỆU.",
      "Xem so sánh chi tiết ở slide 4."),
    q(L, 3, "「窓を閉めるのを忘れました」 khác 「傘を忘れました」 ở chỗ:",
      ["Câu đầu là quên LÀM một hành động (có の); câu sau là quên/bỏ quên một VẬT (không có の)",
       "Hoàn toàn giống nhau về ý nghĩa", "Câu đầu sai ngữ pháp",
       "Câu sau mới đúng ngữ pháp"], 0,
      "Có ĐỘNG TỪ trước の hay không quyết định nghĩa: quên LÀM việc gì (có の+を) khác quên/bỏ mất một VẬT (chỉ danh từ+を).",
      "Xem phân biệt hai loại 'quên' ở slide 3."),
    q(L, 4, "「毎日運動するのは大切です」 — cấu trúc Vのは dùng để:",
      ["Đưa cả một hành động lên làm CHỦ ĐỀ rồi đánh giá/nhận xét về nó",
       "Hỏi ai đã làm hành động đó", "Ra lệnh thực hiện hành động",
       "Phủ định hành động đó"], 0,
      "Vのは đưa hành động thành chủ đề (giống は đánh dấu chủ đề, N5 bài 1), sau đó đưa ra nhận xét chung về nó.",
      "Xem cấu trúc ở slide 2."),
    q(L, 5, "「人と話すのが苦手です」 nghĩa là:",
      ["Tôi kém khoản nói chuyện với người khác", "Tôi giỏi nói chuyện với người khác",
       "Tôi thích nói chuyện với người khác", "Tôi không bao giờ nói chuyện với ai"], 0,
      "話すのが苦手です dùng cấu trúc の (danh từ hóa hành động 'nói chuyện') + 苦手 (kém, không giỏi).",
      "Xem nghĩa của 苦手 ở phần từ vựng."),
    q(L, 6, "Muốn giới thiệu sở thích một cách CHUẨN MỰC (như trong bài luận tự giới thiệu), nên dùng:",
      ["趣味は〜ことです (dùng こと)", "趣味は〜のです (dùng の)",
       "Cả hai đều sai", "趣味が〜のです"], 0,
      "こと phù hợp hơn khi GIỚI THIỆU/ĐỊNH NGHĨA sở thích một cách trang trọng, như trong bài luận tự giới thiệu.",
      "Xem mẹo chọn ở slide 4."),
    q(L, 7, "Câu nào ĐÚNG khi nói 'tôi đã quên liên lạc'?",
      ["連絡するのを忘れました", "連絡を忘れました (chỉ dùng được nếu 連絡 là vật cụ thể, ít tự nhiên hơn)",
       "連絡したのを忘れました", "連絡するのが忘れました"], 0,
      "連絡する (hành động liên lạc) + のを忘れました là cấu trúc tự nhiên nhất để nói 'quên LÀM việc liên lạc'.",
      "So sánh với cấu trúc quên vật đơn thuần."),
    q(L, 8, "「音楽を聞くのが好きです」 dịch đúng là:",
      ["Tôi thích nghe nhạc", "Tôi không thích nghe nhạc",
       "Tôi giỏi nghe nhạc", "Tôi đã nghe nhạc rồi"], 0,
      "V(từ điển)+のが好きです là cấu trúc chuẩn diễn tả sở thích với một hành động cụ thể.",
      "Áp dụng đúng cấu trúc đã học ở slide 1."),
    q(L, 9, "Trong hội thoại, Santos giỏi và kém những gì?",
      ["Giỏi hát, kém nhảy múa", "Giỏi cả hát và nhảy múa",
       "Kém cả hát và nhảy múa", "Không nhắc tới sở thích nào"], 0,
      "Santos nói 「歌うのが大好きです」 nhưng 「踊るのは苦手です」.",
      "Xem câu thoại thứ 2 và 4."),
    q(L, 10, "Santos đã quên làm việc gì?",
      ["Liên lạc với thầy giáo", "Làm bài tập", "Mang theo ô", "Đóng cửa sổ"], 0,
      "Santos nói 「連絡するのを忘れました」.",
      "Xem câu thoại thứ 6."),
]

LESSON = lesson(
    L,
    "Bài 38: Danh từ hóa (V-るのは, V-るのが, V-るのを忘れました)",
    "Danh từ hóa động từ bằng の (song song こと, N5 bài 18, nhưng thiên về hành động cụ thể/giác "
    "quan): Vのが好き/上手/苦手 để nói sở thích/năng lực, Vのは〜 để đưa hành động thành chủ đề "
    "nhận xét, và Vのを忘れました (quên LÀM việc gì) khác hẳn quên/bỏ mất một VẬT.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
