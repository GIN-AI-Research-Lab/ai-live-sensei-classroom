# -*- coding: utf-8 -*-
"""N5 — Bài 13: Mong muốn 欲しい/Vたい, mục đích Vに行きます.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 13
pool = Pool("n5")

VOCAB = [
    v(1,  "ほしい", "欲しい", "ほしい", "hoshii", "adjective", "Muốn có (đồ vật)", "Tính từ い. Đối tượng đánh dấu bằng が, KHÔNG dùng を.", L),
    v(2,  "〜たい", "", "", "-tai", "adjective", "Muốn làm ~ (hành động)", "Gốc Vます bỏ ます + たい. Chia như tính từ い.", L),
    v(3,  "かいもの", "買い物", "かいもの", "kaimono", "noun", "Việc mua sắm", "買い物します = đi mua sắm. 買い物に 行きます = đi mua sắm (mục đích).", L),
    v(4,  "りょこう", "旅行", "りょこう", "ryokou", "noun", "Du lịch, chuyến đi", "Đã gặp bài 5 — nay dùng làm mục đích di chuyển.", L),
    v(5,  "あそびます", "遊びます", "あそびます", "asobimasu", "verb", "Chơi, đi chơi", "Thể từ điển: 遊ぶ. Nhóm 1.", L),
    v(6,  "およぎます", "泳ぎます", "およぎます", "oyogimasu", "verb", "Bơi", "Thể từ điển: 泳ぐ. Nhóm 1.", L),
    v(7,  "うみ", "海", "うみ", "umi", "noun", "Biển", "海へ 泳ぎに 行きます = đi biển bơi.", L),
    v(8,  "やま", "山", "やま", "yama", "noun", "Núi", "", L),
    v(9,  "プール", "", "", "puuru", "noun", "Hồ bơi", "", L),
    v(10, "えいがかん", "映画館", "えいがかん", "eigakan", "noun", "Rạp chiếu phim", "Đã gặp bài 4 (映画) — nay dùng nơi chốn cụ thể.", L),
    v(11, "とけい", "時計", "とけい", "tokei", "noun", "Đồng hồ", "Đã gặp bài 2 — nay dùng làm vật muốn sở hữu.", L),
    v(12, "さいふ", "財布", "さいふ", "saifu", "noun", "Ví tiền", "", L),
    v(13, "かばん", "鞄", "かばん", "kaban", "noun", "Cặp, túi xách", "Đã gặp bài 2.", L),
    v(14, "たくさん", "沢山", "たくさん", "takusan", "adverb", "Nhiều", "友達が たくさん います = có nhiều bạn bè.", L),
    v(15, "なにか", "何か", "なにか", "nanika", "noun", "Cái gì đó", "何か 買いたいです = tôi muốn mua cái gì đó.", L),
    v(16, "どこか", "何処か", "どこか", "dokoka", "noun", "Ở đâu đó", "どこか 行きたいです = tôi muốn đi đâu đó.", L),
    v(17, "しんかんせん", "新幹線", "しんかんせん", "shinkansen", "noun", "Tàu Shinkansen", "新幹線に 乗りたいです = muốn đi tàu Shinkansen.", L),
    v(18, "おんせん", "温泉", "おんせん", "onsen", "noun", "Suối nước nóng, onsen", "温泉に 入りたいです = muốn ngâm onsen.", L),
    v(19, "きょう", "今日", "きょう", "kyou", "noun", "Hôm nay", "Đã gặp bài 4 — nay dùng trong câu hỏi mong muốn.", L),
    v(20, "らいしゅう", "来週", "らいしゅう", "raishuu", "noun", "Tuần sau", "Đã gặp bài 4.", L),
]

KANJI = [
    k(1, "欲", "DỤC", 11, ["ヨク (yoku)"], ["ほ(しい)"], "Mong muốn, ham muốn.",
      [("欲しい", "ほしい", "Muốn có"), ("欲望", "よくぼう", "Ham muốn"), ("食欲", "しょくよく", "Cảm giác thèm ăn")], L),
    k(2, "海", "HẢI", 9, ["カイ (kai)"], ["うみ"], "Biển.",
      [("海", "うみ", "Biển"), ("海外", "かいがい", "Nước ngoài (hải ngoại)"), ("海岸", "かいがん", "Bờ biển")], L),
    k(3, "山", "SƠN", 3, ["サン (san)"], ["やま"], "Núi. Hình vẽ ba đỉnh núi.",
      [("山", "やま", "Núi"), ("富士山", "ふじさん", "Núi Phú Sĩ"), ("火山", "かざん", "Núi lửa")], L),
    k(4, "旅", "LỮ", 10, ["リョ (ryo)"], ["たび"], "Du lịch, lữ hành.",
      [("旅行", "りょこう", "Du lịch"), ("旅館", "りょかん", "Nhà trọ kiểu Nhật"), ("一人旅", "ひとりたび", "Du lịch một mình")], L),
    k(5, "泳", "VỊNH", 8, ["エイ (ei)"], ["およ(ぐ)"], "Bơi lội.",
      [("泳ぎます", "およぎます", "Bơi"), ("水泳", "すいえい", "Môn bơi lội"), ("平泳ぎ", "ひらおよぎ", "Bơi ếch")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Muốn có đồ vật: N が 欲しい です",
        "[Đồ vật] + が + 欲しい + です",
        "欲しい là tính từ đuôi い, đối tượng mong muốn đánh dấu bằng が — cùng nhóm với 好き/上手 "
        "đã học ở bài 9. CHỈ dùng cho ĐỒ VẬT, không dùng cho hành động (dùng Vたい ở slide 2).",
        [
            ex(L, 1, 1, [t("t-l13s1-1", "わたし", "私", "わたし"), t("t-l13s1-2", "は"),
                         t("t-l13s1-3", "あたらしい", "新しい", "あたらしい"), t("t-l13s1-4", "とけい", "時計", "とけい"),
                         t("t-l13s1-5", "が", key=True), t("t-l13s1-6", "ほしい", "欲しい", "ほしい", key=True), t("t-l13s1-7", "です")],
               "Tôi muốn có một cái đồng hồ mới."),
            ex(L, 1, 2, [t("t-l13s1-8", "なにか", "何か", "なにか", key=True), t("t-l13s1-9", "ほしい", "欲しい", "ほしい", key=True),
                         t("t-l13s1-10", "もの", "物", "もの"), t("t-l13s1-11", "が"), t("t-l13s1-12", "ありますか")],
               "Anh có muốn cái gì không?"),
        ],
        tips="欲しい chỉ tự nhiên khi nói về MÌNH hoặc hỏi trực tiếp — nói về người thứ ba cần thêm cách diễn đạt gián tiếp (học ở trình độ cao hơn).",
        culture="Trẻ em Nhật trước Giáng Sinh/năm mới hay được hỏi 何が欲しい — quà thường được chọn theo đúng mong muốn."),

    slide(L, 2,
        "2. Muốn làm gì: V(ます bỏ ます) + たい です",
        "Vます → bỏ ます, thêm たい + です",
        "たい chia HỆT tính từ đuôi い (phủ định たくない, quá khứ たかった). Tân ngữ của động từ "
        "gốc có thể giữ を hoặc đổi thành が để nhấn mạnh mong muốn.",
        [
            ex(L, 2, 1, [t("t-l13s2-1", "うみ", "海", "うみ"), t("t-l13s2-2", "で"),
                         t("t-l13s2-3", "およぎたい", "泳ぎたい", "およぎたい", key=True), t("t-l13s2-4", "です")],
               "Tôi muốn bơi ở biển."),
            ex(L, 2, 2, [t("t-l13s2-5", "しんかんせん", "新幹線", "しんかんせん"), t("t-l13s2-6", "に"),
                         t("t-l13s2-7", "のりたい", "乗りたい", "のりたい", key=True), t("t-l13s2-8", "です")],
               "Tôi muốn đi tàu Shinkansen."),
            ex(L, 2, 3, [t("t-l13s2-9", "なにを", "何を", "なにを", key=True), t("t-l13s2-10", "たべたい", "食べたい", "たべたい", key=True),
                         t("t-l13s2-11", "ですか")],
               "Anh muốn ăn gì vậy?"),
        ],
        tips="たい CHỈ dùng để nói MONG MUỐN CỦA NGƯỜI NÓI (hoặc hỏi trực tiếp đối phương) — không dùng để đoán ý người thứ ba.",
        culture="欲しい (muốn CÓ vật) và たい (muốn LÀM việc) rất dễ nhầm — kiểm tra xem sau đó là danh từ hay động từ."),

    slide(L, 3,
        "3. Phủ định và quá khứ của たい",
        "Vたくない (không muốn) / Vたかった (đã muốn) / Vたくなかった (đã không muốn)",
        "Chia y hệt tính từ đuôi い đã học ở bài 8 và 12 — たい tự thân hoạt động như MỘT TÍNH TỪ, "
        "không chia theo quy tắc động từ.",
        [
            ex(L, 3, 1, [t("t-l13s3-1", "きょう", "今日", "きょう"), t("t-l13s3-2", "は"),
                         t("t-l13s3-3", "どこも"), t("t-l13s3-4", "いきたくない", "行きたくない", "いきたくない", key=True), t("t-l13s3-5", "です")],
               "Hôm nay tôi không muốn đi đâu cả."),
            ex(L, 3, 2, [t("t-l13s3-6", "きのう", "昨日", "きのう"), t("t-l13s3-7", "は"),
                         t("t-l13s3-8", "やま", "山", "やま"), t("t-l13s3-9", "に"),
                         t("t-l13s3-10", "いきたかった", "行きたかった", "いきたかった", key=True), t("t-l13s3-11", "です")],
               "Hôm qua tôi đã muốn đi núi."),
        ],
        tips="Cùng bảng chia với 暑い/暑くない/暑かった/暑くなかった đã học — たい chỉ là một tính từ đặc biệt gắn vào gốc động từ.",
        culture="Từ chối lời rủ bằng たくない nghe khá thẳng — thường thêm ちょっと… hoặc lý do để giảm nhẹ."),

    slide(L, 4,
        "4. Mục đích di chuyển: N へ V(ます bỏ ます) に 行きます/来ます/帰ります",
        "[Nơi chốn] + へ + [gốc Vます] + に + 行きます/来ます/帰ります",
        "に ở đây đánh dấu MỤC ĐÍCH của việc di chuyển — khác hẳn に chỉ thời điểm (bài 4) hay nơi "
        "tồn tại (bài 10). Chỉ dùng được với động từ CHUYỂN ĐỘNG (行く/来る/帰る).",
        [
            ex(L, 4, 1, [t("t-l13s4-1", "デパート"), t("t-l13s4-2", "へ"),
                         t("t-l13s4-3", "かいもの", "買い物", "かいもの"), t("t-l13s4-4", "に", key=True),
                         t("t-l13s4-5", "いきます", "行きます", "いきます")],
               "Tôi đi trung tâm thương mại để mua sắm."),
            ex(L, 4, 2, [t("t-l13s4-6", "プール"), t("t-l13s4-7", "へ"),
                         t("t-l13s4-8", "およぎ", "泳ぎ", "およぎ"), t("t-l13s4-9", "に", key=True),
                         t("t-l13s4-10", "いきませんか", "行きませんか", "いきませんか", key=True)],
               "Ra hồ bơi bơi lội không?"),
        ],
        tips="Nếu mục đích là danh từ hành động (旅行, 買い物, 見物…) thì bỏ luôn ます, chỉ giữ danh từ + に: 旅行に 行きます.",
        culture="Cấu trúc Vに行く rất tự nhiên khi rủ nhau: 「ご飯を 食べに 行きませんか」 = đi ăn cơm không?"),
]

DIALOGUE = [
    line(L, 1, "カリナ", "Sinh viên",
         [t("d-l13-1", "らいしゅう", "来週", "らいしゅう"), t("d-l13-2", "の"), t("d-l13-3", "なつやすみ", "夏休み", "なつやすみ"),
          t("d-l13-4", "、"), t("d-l13-5", "なに", "何", "なに"), t("d-l13-6", "を"),
          t("d-l13-7", "したい", "したい", "したい", key=True), t("d-l13-8", "ですか")],
         "Kỳ nghỉ hè tuần sau, cậu muốn làm gì?"),
    line(L, 2, "山田", "Sinh viên",
         [t("d-l13-9", "うみ", "海", "うみ", key=True), t("d-l13-10", "へ"), t("d-l13-11", "およぎ", "泳ぎ", "およぎ"),
          t("d-l13-12", "に", key=True), t("d-l13-13", "いきたい", "行きたい", "いきたい", key=True), t("d-l13-14", "です")],
         "Tớ muốn đi biển bơi."),
    line(L, 3, "カリナ", "Sinh viên",
         [t("d-l13-15", "いいですね"), t("d-l13-16", "。"), t("d-l13-17", "わたし", "私", "わたし"),
          t("d-l13-18", "も"), t("d-l13-19", "いきたい", "行きたい", "いきたい"), t("d-l13-20", "です")],
         "Hay đó. Tớ cũng muốn đi."),
    line(L, 4, "山田", "Sinh viên",
         [t("d-l13-21", "じゃ"), t("d-l13-22", "、"), t("d-l13-23", "いっしょに", "一緒に", "いっしょに"),
          t("d-l13-24", "いきましょう", "行きましょう", "いきましょう")],
         "Vậy đi cùng nhau đi."),
    line(L, 5, "カリナ", "Sinh viên",
         [t("d-l13-25", "その"), t("d-l13-26", "まえ", "前", "まえ"), t("d-l13-27", "に"),
          t("d-l13-28", "、"), t("d-l13-29", "みずぎ", "水着", "みずぎ"), t("d-l13-30", "が"),
          t("d-l13-31", "ほしい", "欲しい", "ほしい", key=True), t("d-l13-32", "です")],
         "Trước đó, tớ muốn mua đồ bơi."),
    line(L, 6, "山田", "Sinh viên",
         [t("d-l13-33", "じゃ"), t("d-l13-34", "、"), t("d-l13-35", "デパート"), t("d-l13-36", "へ"),
          t("d-l13-37", "かいもの", "買い物", "かいもの"), t("d-l13-38", "に", key=True),
          t("d-l13-39", "いきませんか", "行きませんか", "いきませんか", key=True)],
         "Vậy mình đi trung tâm thương mại mua sắm không?"),
    line(L, 7, "カリナ", "Sinh viên",
         [t("d-l13-40", "ええ"), t("d-l13-41", "、"), t("d-l13-42", "いきましょう", "行きましょう", "いきましょう"),
          t("d-l13-43", "。"), t("d-l13-44", "あたらしい", "新しい", "あたらしい"), t("d-l13-45", "かばん", "鞄", "かばん"),
          t("d-l13-46", "も"), t("d-l13-47", "ほしい", "欲しい", "ほしい", key=True), t("d-l13-48", "です")],
         "Ừ, đi thôi. Tớ cũng muốn có một cái cặp mới nữa."),
    line(L, 8, "山田", "Sinh viên",
         [t("d-l13-49", "わたし", "私", "わたし"), t("d-l13-50", "は"), t("d-l13-51", "きのう", "昨日", "きのう"),
          t("d-l13-52", "も"), t("d-l13-53", "デパート"), t("d-l13-54", "へ"),
          t("d-l13-55", "いきたかった", "行きたかった", "いきたかった", key=True), t("d-l13-56", "です"),
          t("d-l13-57", "が"), t("d-l13-58", "、"), t("d-l13-59", "じかん", "時間", "じかん"), t("d-l13-60", "が"),
          t("d-l13-61", "ありませんでした", "有りませんでした", "ありませんでした")],
         "Hôm qua tớ cũng đã muốn đi rồi, nhưng không có thời gian."),
    line(L, 9, "カリナ", "Sinh viên",
         [t("d-l13-62", "そうですか"), t("d-l13-63", "。"), t("d-l13-64", "デパート"), t("d-l13-65", "の"),
          t("d-l13-66", "あと"), t("d-l13-67", "、"), t("d-l13-68", "なにか", "何か", "なにか", key=True),
          t("d-l13-69", "たべたい", "食べたい", "たべたい", key=True), t("d-l13-70", "です")],
         "Ra vậy. Sau khi đi trung tâm thương mại, tớ muốn ăn cái gì đó."),
    line(L, 10, "山田", "Sinh viên",
         [t("d-l13-71", "いいですね"), t("d-l13-72", "。"), t("d-l13-73", "ラーメン"),
          t("d-l13-74", "を"), t("d-l13-75", "たべ", "食べ", "たべ"), t("d-l13-76", "に"),
          t("d-l13-77", "いきましょう", "行きましょう", "いきましょう")],
         "Hay đó. Đi ăn ramen nhé."),
]

EXERCISES = [
    q(L, 1, "「時計が 欲しいです」 — trợ từ が đúng vì:",
      ["欲しい cùng nhóm với 好き/上手, đánh dấu đối tượng bằng が",
       "が chỉ dùng cho câu hỏi", "Đây là lỗi, phải sửa thành を",
       "が chỉ dùng cho động từ"], 0,
      "欲しい là tính từ い đặc biệt, đánh dấu đối tượng mong muốn bằng が giống 好き/嫌い/上手/下手 đã học ở bài 9.",
      "So sánh với nhóm từ ở bài 9."),
    q(L, 2, "欲しい và たい khác nhau ở chỗ:",
      ["欲しい dùng cho ĐỒ VẬT, たい dùng cho HÀNH ĐỘNG (gắn vào động từ)",
       "Cả hai đều giống nhau hoàn toàn", "たい chỉ dùng cho danh từ",
       "欲しい chỉ dùng cho người"], 0,
      "欲しい là tính từ độc lập cho danh từ; たい gắn vào gốc động từ (bỏ ます) để diễn tả muốn LÀM gì.",
      "Xem từ loại đứng trước 欲しい và たい."),
    q(L, 3, "Muốn nói 'tôi muốn ăn ramen', câu nào ĐÚNG?",
      ["ラーメンが 食べたいです", "ラーメンが 欲しいです",
       "ラーメンを 食べですたい", "ラーメンが 食べますたい"], 0,
      "食べたい là gốc 食べます bỏ ます + たい. 欲しい chỉ dùng cho đồ vật, không dùng khi có động từ ăn.",
      "食べる là hành động, không phải đồ vật."),
    q(L, 4, "Phủ định của 行きたい là:",
      ["行きたくない", "行きませんたい", "行きたいじゃない", "行かないたい"], 0,
      "たい chia phủ định giống tính từ い: bỏ い cuối (たい), thêm くない → たくない.",
      "So sánh với cách chia phủ định tính từ い đã học ở bài 8."),
    q(L, 5, "「海へ 泳ぎに 行きます」 — に ở đây có vai trò gì?",
      ["Đánh dấu MỤC ĐÍCH của việc di chuyển", "Đánh dấu thời điểm",
       "Đánh dấu nơi tồn tại", "Đánh dấu phương tiện"], 0,
      "に sau gốc động từ (泳ぎ) trước 行きます đánh dấu mục đích — một chức năng khác nữa của に.",
      "So sánh với các chức năng に đã học ở bài 4, 10."),
    q(L, 6, "Cấu trúc Vに行きます chỉ dùng được với động từ nào theo sau?",
      ["Động từ chuyển động: 行く/来る/帰る", "Bất kỳ động từ nào",
       "Chỉ động từ ăn uống", "Chỉ động từ mua bán"], 0,
      "Cấu trúc mục đích [Vます-gốc]に + 行く/来る/帰る chỉ áp dụng với BA động từ chuyển động này.",
      "Xem lại các động từ đã học ở bài 5."),
    q(L, 7, "Nếu mục đích là danh từ hành động như 買い物, cấu trúc rút gọn là:",
      ["買い物に 行きます (bỏ luôn します)", "買い物しに 行きます (giữ nguyên します)",
       "買い物を 行きます", "買い物で 行きます"], 0,
      "Danh từ hành động (買い物, 旅行, 見物) có thể bỏ luôn します, chỉ cần Nに + 行く/来る/帰る.",
      "Xem cách rút gọn ở slide 4."),
    q(L, 8, "Quá khứ của 行きたい là:",
      ["行きたかった", "行きましたい", "行きたいでした", "行っただい"], 0,
      "たい chia quá khứ như tính từ い: bỏ い, thêm かった → たかった.",
      "Áp dụng đúng quy tắc chia của tính từ い đã học ở bài 12."),
    q(L, 9, "「今日は どこも 行きたくないです」 nghĩa là:",
      ["Hôm nay tôi không muốn đi đâu cả", "Hôm nay tôi muốn đi khắp nơi",
       "Hôm nay tôi đã đi nhiều nơi", "Hôm nay tôi không có nơi nào để đi"], 0,
      "どこも + phủ định = 'không đâu cả' (phủ định toàn bộ), kết hợp với 行きたくない (không muốn đi).",
      "も + phủ định tạo nghĩa phủ định toàn bộ."),
    q(L, 10, "Trong hội thoại, sau khi mua sắm ở trung tâm thương mại, hai người định làm gì?",
      ["Đi ăn ramen", "Đi bơi ngay", "Về nhà luôn", "Đi xem phim"], 0,
      "Cuối hội thoại, 山田 rủ 「ラーメンを 食べに 行きましょう」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 13: Mong muốn & Mục đích (欲しい / Vたい / N へ Vに行きます)",
    "Diễn đạt mong muốn sở hữu đồ vật bằng 欲しい (đi với が), mong muốn thực hiện hành động bằng "
    "Vたい (chia như tính từ い: たくない, たかった), và cách nói mục đích di chuyển bằng "
    "[gốc Vます]に + 行く/来る/帰る.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
