# -*- coding: utf-8 -*-
"""N4 — Bai 36: Muc dich 〜ように, bien doi 〜ようになる.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 36
pool = Pool("n4")

VOCAB = [
    v(1,  "きこえます", "聞こえます", "きこえます", "kikoemasu", "verb", "Nghe được, nghe thấy (tự nhiên, không chủ ý)", "自動詞: âm thanh TỰ lọt vào tai, khác 聞きます (chủ động lắng nghe).", L),
    v(2,  "みえます", "見えます", "みえます", "miemasu", "verb", "Nhìn thấy được, trông thấy (tự nhiên)", "自動詞: hình ảnh TỰ lọt vào mắt, khác 見ます (chủ động nhìn) và 見られます (khả năng, bài 27).", L),
    v(3,  "わすれます", "忘れます", "わすれます", "wasuremasu", "verb", "Quên", "Đã gặp bài 26. 忘れないように = để không quên.", L),
    v(4,  "つづけます", "続けます", "つづけます", "tsuzukemasu", "verb", "Tiếp tục, duy trì", "Đã gặp bài 28.", L),
    v(5,  "はなします", "話します", "はなします", "hanashimasu", "verb", "Nói, trò chuyện", "Đã gặp N5 bài 7 — nay dùng làm ví dụ mục đích.", L),
    v(6,  "うんどうします", "運動します", "うんどうします", "undou shimasu", "verb", "Vận động, tập thể dục", "Đã gặp bài 27.", L),
    v(8,  "せつめいします", "説明します", "せつめいします", "setsumei shimasu", "verb", "Giải thích", "Đã gặp bài 34.", L),
    v(9,  "れんしゅうします", "練習します", "れんしゅうします", "renshuu shimasu", "verb", "Luyện tập", "Đã gặp N5 bài 7 (danh từ) — nay dùng đầy đủ động từ.", L),
    v(10, "めがね", "眼鏡", "めがね", "megane", "noun", "Kính mắt", "眼鏡を かければ、見えます = nếu đeo kính thì sẽ nhìn thấy được.", L),
    v(11, "みみ", "耳", "みみ", "mimi", "noun", "Tai", "Đã gặp N5 bài 16.", L),
    v(12, "め", "目", "め", "me", "noun", "Mắt", "Đã gặp N5 bài 16.", L),
    v(13, "こえ", "声", "こえ", "koe", "noun", "Giọng nói, âm thanh", "大きい声で 話して ください = xin hãy nói to lên.", L),
    v(14, "かんじ", "漢字", "かんじ", "kanji", "noun", "Chữ Hán", "Đã gặp N5 bài 7.", L),
    v(15, "にほんご", "日本語", "にほんご", "nihongo", "noun", "Tiếng Nhật", "Đã gặp N5 bài 2.", L),
    v(16, "まじめ", "真面目", "まじめ", "majime", "adjective", "Chăm chỉ, nghiêm túc", "Tính từ な. 真面目に 練習すれば、上手に なります = chăm chỉ luyện tập thì sẽ giỏi.", L),
    v(17, "じょうず", "上手", "じょうず", "jouzu", "adjective", "Giỏi", "Đã gặp N5 bài 9 — nay dùng làm kết quả biến đổi ようになる.", L),
    v(18, "しんぶん", "新聞", "しんぶん", "shinbun", "noun", "Báo, tờ báo", "Đã gặp N5 bài 2.", L),
    v(19, "びょうき", "病気", "びょうき", "byouki", "noun", "Bệnh, ốm", "Đã gặp bài 17 (N5).", L),
    v(20, "けんこう", "健康", "けんこう", "kenkou", "adjective", "Sức khỏe, khỏe mạnh", "Đã gặp bài 32.", L),
    v(21, "しゅうかん", "習慣", "しゅうかん", "shuukan", "noun", "Thói quen", "Đã gặp bài 28. 運動する ように なりました = đã hình thành thói quen tập thể dục.", L),
]

KANJI = [
    k(1, "聞", "VĂN", 14, ["ブン (bun)"], ["き(く)", "き(こえる)"], "Nghe.",
      [("聞こえます", "きこえます", "Nghe thấy"), ("聞きます", "ききます", "Nghe (chủ động)"), ("新聞", "しんぶん", "Báo")], L),
    k(2, "見", "KIẾN", 7, ["ケン (ken)"], ["み(える)", "み(る)"], "Nhìn, thấy. Đã gặp N5 bài 6.",
      [("見えます", "みえます", "Nhìn thấy"), ("見ます", "みます", "Xem (chủ động)"), ("意見", "いけん", "Ý kiến")], L),
    k(3, "声", "THANH", 7, ["セイ (sei)"], ["こえ"], "Giọng nói, âm thanh.",
      [("声", "こえ", "Giọng nói"), ("大声", "おおごえ", "Giọng to"), ("音声", "おんせい", "Âm thanh")], L),
    k(4, "続", "TỤC", 13, ["ゾク (zoku)"], ["つづ(ける)"], "Tiếp tục. Đã gặp bài 28.",
      [("続けます", "つづけます", "Tiếp tục"), ("続きます", "つづきます", "Kéo dài"), ("連続", "れんぞく", "Liên tục")], L),
    k(5, "練", "LUYỆN", 14, ["レン (ren)"], [], "Luyện tập, rèn giũa.",
      [("練習", "れんしゅう", "Luyện tập"), ("訓練", "くんれん", "Huấn luyện")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Mục đích với động từ VÔ Ý CHÍ: [Thể từ điển/ない] ように、V",
        "V(từ điển/ない) + ように、[hành động]   (dùng với động từ KHÔNG kiểm soát được: 聞こえる, 見える, 分かる, 忘れる)",
        "ように diễn tả MỤC ĐÍCH khi động từ chính không thể tự chủ động quyết định làm hay không "
        "(nghe thấy, nhìn thấy, hiểu, quên) — khác ために (mục đích với động từ Ý CHÍ, học ở N3).",
        [
            ex(L, 1, 1, [t("t-l36s1-1", "きこえる", "聞こえる", "きこえる", key=True), t("t-l36s1-2", "ように", key=True),
                         t("t-l36s1-3", "、"), t("t-l36s1-4", "おおきい", "大きい", "おおきい"), t("t-l36s1-5", "こえ", "声", "こえ"),
                         t("t-l36s1-6", "で"), t("t-l36s1-7", "はなします", "話します", "はなします")],
               "Để (mọi người) nghe được rõ, tôi nói to lên."),
            ex(L, 1, 2, [t("t-l36s1-8", "わすれない", "忘れない", "わすれない", key=True), t("t-l36s1-9", "ように", key=True),
                         t("t-l36s1-10", "、"), t("t-l36s1-11", "かきました", "書きました", "かきました")],
               "Để khỏi quên, tôi đã ghi lại."),
        ],
        tips="聞く (chủ động nghe) tự mình quyết định được nên KHÔNG ghép ように; 聞こえる (tự nhiên nghe thấy) không tự chủ được nên PHẢI ghép ように.",
        culture="忘れないように書いておきます (ghi lại để khỏi quên) là thói quen phổ biến của người Nhật khi note lại việc cần làm (メモ)."),

    slide(L, 2,
        "2. Biến đổi khả năng: [Thể khả năng/từ điển] ように なります",
        "V(khả năng, bài 27) + ように なります   (TỪ KHÔNG LÀM ĐƯỢC sang LÀM ĐƯỢC, dần dần theo thời gian)",
        "ようになります diễn tả sự THAY ĐỔI NĂNG LỰC/TRẠNG THÁI theo thời gian — khác なります đơn "
        "thuần (N5 bài 19, thay đổi tức thời của tính từ/danh từ).",
        [
            ex(L, 2, 1, [t("t-l36s2-1", "かんじ", "漢字", "かんじ", key=True), t("t-l36s2-2", "が"),
                         t("t-l36s2-3", "よめる", "読める", "よめる"), t("t-l36s2-4", "ように", key=True),
                         t("t-l36s2-5", "なりました", key=True)],
               "Tôi đã (dần dần) đọc được chữ Hán."),
            ex(L, 2, 2, [t("t-l36s2-6", "にほんご", "日本語", "にほんご", key=True), t("t-l36s2-7", "が"),
                         t("t-l36s2-8", "はなせる", "話せる", "はなせる"), t("t-l36s2-9", "ように", key=True),
                         t("t-l36s2-10", "なりたい", key=True), t("t-l36s2-11", "です")],
               "Tôi muốn (dần dần) nói được tiếng Nhật."),
        ],
        tips="ようになりました nhấn mạnh QUÁ TRÌNH tích lũy (luyện tập lâu dài); られるようになる ghép thể khả năng (bài 27) + ようになる rất phổ biến.",
        culture="真面目に練習すれば、上手になります (chăm chỉ luyện tập thì sẽ giỏi) là câu động viên phổ biến của giáo viên Nhật với học sinh."),

    slide(L, 3,
        "3. Ngừng làm được: [Thể ない] ように なります",
        "V(ない形) + ように なります   (TỪ LÀM ĐƯỢC sang KHÔNG LÀM ĐƯỢC nữa)",
        "Chiều ngược lại của slide 2 — diễn tả mất dần một khả năng/thói quen theo thời gian, "
        "thường do bệnh tật, tuổi tác, hoặc thay đổi hoàn cảnh.",
        [
            ex(L, 3, 1, [t("t-l36s3-1", "びょうき", "病気", "びょうき", key=True), t("t-l36s3-2", "で"),
                         t("t-l36s3-3", "はしれない", "走れない", "はしれない"), t("t-l36s3-4", "ように", key=True),
                         t("t-l36s3-5", "なりました", key=True)],
               "Vì bệnh nên tôi (dần) không chạy được nữa."),
        ],
        tips="Cấu trúc đối lập: できるようになる (dần làm được) ⇄ できなくなる (mất dần khả năng, thường rút gọn bỏ よう khi ghép với động từ khả năng).",
        culture="年を取ると、〜ようになります/なくなります là cách người Nhật cao tuổi mô tả những thay đổi cơ thể theo tuổi tác một cách nhẹ nhàng."),

    slide(L, 4,
        "4. So sánh なります (N5 b19) và ようになります",
        "なります: thay đổi TỨC THỜI của trạng thái (暑くなりました)　vs　ようになります: thay đổi DẦN DẦN về NĂNG LỰC/THÓI QUEN",
        "Cả hai đều là 'biến đổi' nhưng khác về BẢN CHẤT: なります cho tính từ/trạng thái đơn "
        "giản; ようになります chuyên cho NĂNG LỰC (có thể làm được) hình thành qua quá trình.",
        [
            ex(L, 4, 1, [t("t-l36s4-1", "けんこう", "健康", "けんこう", key=True), t("t-l36s4-2", "に"),
                         t("t-l36s4-3", "なりました", key=True)],
               "Tôi đã trở nên khỏe mạnh. (なります: trạng thái, N5 bài 19)"),
            ex(L, 4, 2, [t("t-l36s4-4", "まいにち", "毎日", "まいにち"), t("t-l36s4-5", "うんどう", "運動", "うんどう", key=True),
                         t("t-l36s4-6", "する", key=True), t("t-l36s4-7", "ように", key=True), t("t-l36s4-8", "なりました", key=True)],
               "Tôi đã (dần) hình thành thói quen tập thể dục mỗi ngày. (ようになります: thói quen/hành vi)"),
        ],
        tips="ようになります còn ghép được với ĐỘNG TỪ THƯỜNG (không chỉ thể khả năng) để nói về THÓI QUEN mới hình thành — như ví dụ 2.",
        culture="運動するようになりました là câu chia sẻ phổ biến về thay đổi lối sống tích cực, thường thấy trong mạng xã hội Nhật."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d-l36-1", "山田さん"), t("d-l36-2", "は"), t("d-l36-3", "さいきん", "最近", "さいきん"),
          t("d-l36-4", "、"), t("d-l36-5", "まいあさ", "毎朝", "まいあさ"), t("d-l36-6", "うんどう", "運動", "うんどう", key=True),
          t("d-l36-7", "する", key=True), t("d-l36-8", "ように", key=True), t("d-l36-9", "なりました", key=True),
          t("d-l36-10", "ね")],
         "Gần đây anh Yamada đã có thói quen tập thể dục mỗi sáng nhỉ."),
    line(L, 2, "山田", "Nhân viên công ty",
         [t("d-l36-11", "はい"), t("d-l36-12", "。"), t("d-l36-13", "けんこう", "健康", "けんこう", key=True),
          t("d-l36-14", "に"), t("d-l36-15", "なりたい", "成りたい", "なりたい"), t("d-l36-16", "ですから", key=True)],
         "Vâng. Vì tôi muốn khỏe mạnh hơn ạ."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d-l36-17", "にほんご", "日本語", "にほんご", key=True), t("d-l36-18", "の"), t("d-l36-19", "べんきょう", "勉強", "べんきょう"),
          t("d-l36-20", "は"), t("d-l36-21", "どうですか")],
         "Còn việc học tiếng Nhật của anh thì sao?"),
    line(L, 4, "山田", "Nhân viên công ty",
         [t("d-l36-22", "さいきん", "最近", "さいきん"), t("d-l36-23", "、"), t("d-l36-24", "しんぶん", "新聞", "しんぶん", key=True),
          t("d-l36-25", "が"), t("d-l36-26", "すこし"), t("d-l36-27", "よめる", "読める", "よめる"),
          t("d-l36-28", "ように", key=True), t("d-l36-29", "なりました", key=True)],
         "Gần đây tôi đã đọc được một chút báo rồi."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d-l36-30", "すごい"), t("d-l36-31", "ですね"), t("d-l36-32", "。"), t("d-l36-33", "かんじ", "漢字", "かんじ", key=True),
          t("d-l36-34", "を"), t("d-l36-35", "たくさん"), t("d-l36-36", "べんきょう", "勉強", "べんきょう"),
          t("d-l36-37", "しました", "しました", "しました"), t("d-l36-38", "か")],
         "Giỏi thật đấy. Anh đã học nhiều chữ Hán à?"),
    line(L, 6, "山田", "Nhân viên công ty",
         [t("d-l36-39", "はい"), t("d-l36-40", "。"), t("d-l36-41", "わすれない", "忘れない", "わすれない", key=True),
          t("d-l36-42", "ように", key=True), t("d-l36-43", "、"), t("d-l36-44", "まいにち", "毎日", "まいにち"),
          t("d-l36-45", "れんしゅう", "練習", "れんしゅう", key=True), t("d-l36-46", "しています", key=True)],
         "Vâng. Để khỏi quên, tôi luyện tập mỗi ngày."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d-l36-47", "まじめ", "真面目", "まじめ", key=True), t("d-l36-48", "です"), t("d-l36-49", "ね"),
          t("d-l36-50", "。"), t("d-l36-51", "わたし", "私", "わたし"), t("d-l36-52", "も"), t("d-l36-53", "がんばりたい", "頑張りたい", "がんばりたい")],
         "Chăm chỉ thật đấy. Tôi cũng muốn cố gắng như vậy."),
    line(L, 8, "山田", "Nhân viên công ty",
         [t("d-l36-54", "いっしょに", "一緒に", "いっしょに"), t("d-l36-55", "がんばりましょう", "頑張りましょう", "がんばりましょう")],
         "Cùng cố gắng nhé."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d-l36-56", "ところで"), t("d-l36-57", "、"), t("d-l36-58", "もう"), t("d-l36-59", "すこし", "少し", "すこし"),
          t("d-l36-60", "おおきい", "大きい", "おおきい"), t("d-l36-61", "こえ", "声", "こえ", key=True), t("d-l36-62", "で"),
          t("d-l36-63", "はなして", "話して", "はなして"), t("d-l36-64", "もらえますか")],
         "À mà, anh có thể nói to hơn một chút được không?"),
    line(L, 10, "山田", "Nhân viên công ty",
         [t("d-l36-65", "すみません"), t("d-l36-66", "。"), t("d-l36-67", "きこえる", "聞こえる", "きこえる", key=True),
          t("d-l36-68", "ように", key=True), t("d-l36-69", "、"), t("d-l36-70", "もっと"), t("d-l36-71", "おおきい", "大きい", "おおきい"),
          t("d-l36-72", "こえ", "声", "こえ"), t("d-l36-73", "で"), t("d-l36-74", "はなします", "話します", "はなします")],
         "Xin lỗi. Để chị nghe được rõ, tôi sẽ nói to hơn nữa."),
]

EXERCISES = [
    q(L, 1, "「大きい声で話します」 nối với ように khi động từ chính là:",
      ["聞こえる (nghe thấy, tự nhiên, không tự chủ được)", "聞く (chủ động nghe, tự quyết định được)",
       "話す (nói, tự chủ động)", "書く (viết, tự chủ động)"], 0,
      "ように chỉ ghép với động từ KHÔNG TỰ CHỦ được kết quả (聞こえる, 見える, 分かる, 忘れる) — người nghe không tự quyết định 'có nghe thấy hay không'.",
      "Xem điều kiện sử dụng ように ở slide 1."),
    q(L, 2, "「忘れないように、書きました」 nghĩa là:",
      ["Để khỏi quên, tôi đã ghi lại", "Để nhớ lại, tôi đã xóa đi",
       "Tôi đã quên viết", "Tôi không muốn ghi lại"], 0,
      "V(ない)+ように diễn tả mục đích PHỦ ĐỊNH: làm gì đó để KHÔNG xảy ra điều gì.",
      "Xem ví dụ 2 ở slide 1."),
    q(L, 3, "「漢字が読めるようになりました」 nghĩa là:",
      ["Tôi đã (dần) đọc được chữ Hán (trước đây không đọc được)",
       "Tôi đã đọc xong hết chữ Hán", "Tôi không đọc được chữ Hán nữa",
       "Tôi sắp học chữ Hán"], 0,
      "V(khả năng)+ようになりました diễn tả một NĂNG LỰC mới hình thành theo thời gian, từ không làm được sang làm được.",
      "Xem cấu trúc ở slide 2."),
    q(L, 4, "「病気で走れないようになりました」 diễn tả:",
      ["Mất dần khả năng chạy (trước đây chạy được, giờ thì không)",
       "Chưa bao giờ chạy được", "Sắp có thể chạy được",
       "Đang chạy rất giỏi"], 0,
      "V(ない)+ようになりました là chiều NGƯỢC LẠI của slide 2 — mất dần một khả năng đã từng có.",
      "So sánh với chiều thuận ở slide 2."),
    q(L, 5, "なります (N5 bài 19) khác ようになります ở chỗ:",
      ["なります cho thay đổi trạng thái/tính từ tức thời; ようになります cho NĂNG LỰC/THÓI QUEN hình thành dần dần",
       "Hoàn toàn giống nhau", "なります chỉ dùng cho câu phủ định",
       "ようになります chỉ dùng cho quá khứ"], 0,
      "Đây là điểm khác biệt bản chất giữa hai cấu trúc 'biến đổi' đã học.",
      "Xem so sánh trực tiếp ở slide 4."),
    q(L, 6, "「毎日運動するようになりました」 — động từ 運動する ở đây không phải thể khả năng, vậy ようになります áp dụng cho:",
      ["Sự hình thành một THÓI QUEN mới (không chỉ giới hạn ở khả năng)",
       "Chỉ áp dụng được với thể khả năng", "Đây là câu sai ngữ pháp",
       "Chỉ dùng được với động từ phủ định"], 0,
      "ようになります cũng ghép được với ĐỘNG TỪ THƯỜNG để diễn tả THÓI QUEN/HÀNH VI mới hình thành, không chỉ riêng năng lực.",
      "Xem ví dụ 2 ở slide 4."),
    q(L, 7, "聞こえます khác 聞きます ở chỗ:",
      ["聞こえます là tự nhiên nghe thấy (không chủ ý); 聞きます là chủ động lắng nghe/hỏi",
       "Hoàn toàn giống nhau", "聞こえます chỉ dùng cho câu hỏi",
       "聞きます là thì quá khứ của 聞こえます"], 0,
      "聞こえる là tự động từ dạng đặc biệt (âm thanh TỰ lọt vào tai); 聞く là hành động CHỦ ĐỘNG lắng nghe hoặc hỏi.",
      "Xem phân biệt ở phần từ vựng và slide 1."),
    q(L, 8, "見えます khác 見られます (thể khả năng, bài 27) ở chỗ:",
      ["見えます là tự nhiên nhìn thấy (không cần cố gắng); 見られます là CÓ KHẢ NĂNG xem (ví dụ được phép, có điều kiện)",
       "Hoàn toàn giống nhau", "見えます chỉ dùng cho câu phủ định",
       "見られます là thì quá khứ"], 0,
      "見える là hiện tượng thị giác tự nhiên (VD: núi hiện ra trước mắt); 見られる là khả năng/được phép xem một thứ cụ thể.",
      "So sánh hai khái niệm gần giống nhau này."),
    q(L, 9, "Trong hội thoại, Yamada gần đây có thói quen gì mới?",
      ["Tập thể dục mỗi sáng", "Đọc sách mỗi tối", "Nấu ăn mỗi ngày", "Không có thói quen mới"], 0,
      "Tanaka nhận xét 「毎朝運動するようになりましたね」 và Yamada xác nhận.",
      "Xem câu thoại đầu tiên."),
    q(L, 10, "Cuối hội thoại, vì sao Yamada nói to hơn?",
      ["Để Tanaka nghe được rõ", "Vì đang tức giận", "Vì phòng ồn ào", "Không có lý do cụ thể"], 0,
      "Yamada nói 「聞こえるように、もっと大きい声で話します」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 36: Mục đích (〜ように) & Biến đổi (〜ようになる)",
    "Diễn tả mục đích với động từ VÔ Ý CHÍ (聞こえる, 見える, 分かる, 忘れない) bằng ように, sự "
    "hình thành NĂNG LỰC/THÓI QUEN dần dần theo thời gian bằng ようになります (cả chiều thuận và "
    "chiều mất dần khả năng), và so sánh với なります (N5 bài 19, biến đổi trạng thái tức thời).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
