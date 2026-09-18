# -*- coding: utf-8 -*-
"""N5 — Bài 21: Y kien to思います, trich dan と言いました, phan doan でしょう.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md).
思います la dong tu chuc nang cot loi cua bai, khong co trong pool JLPT
(giong truong hop agemasu/moraimasu o bai 7), nen dua vao thu cong.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 21
pool = Pool("n5")

VOCAB = [
    v(1,  "おもいます", "思います", "おもいます", "omoimasu", "verb", "Nghĩ rằng, cho rằng", "と思います đứng sau cả câu (thể thông thường) để nêu ý kiến.", L),
    v(2,  "いいます", "言います", "いいます", "iimasu", "verb", "Nói", "と言いました để trích dẫn lời ai đó.", L),
    v(3,  "かんがえます", "考えます", "かんがえます", "kangaemasu", "verb", "Suy nghĩ, cân nhắc", "Khác 思います (ý kiến tức thời) — 考えます nhấn mạnh QUÁ TRÌNH suy nghĩ kỹ.", L),
    v(4,  "てんき", "天気", "てんき", "tenki", "noun", "Thời tiết", "天気予報 = dự báo thời tiết.", L),
    v(5,  "あめ", "雨", "あめ", "ame", "noun", "Mưa", "雨が 降ります = trời mưa.", L),
    v(6,  "ゆき", "雪", "ゆき", "yuki", "noun", "Tuyết", "雪が 降ります = trời có tuyết rơi.", L),
    v(7,  "たいふう", "台風", "たいふう", "taifuu", "noun", "Bão (bão nhiệt đới)", "台風が 来ます = bão sắp tới.", L),
    v(8,  "ニュース", "", "", "nyuusu", "noun", "Tin tức", "ニュースで 聞きました = tôi đã nghe được từ tin tức.", L),
    v(9,  "しんぶん", "新聞", "しんぶん", "shinbun", "noun", "Báo, tờ báo", "Đã gặp bài 2 — nay dùng làm nguồn trích dẫn.", L),
    v(10, "たいせつ", "大切", "たいせつ", "taisetsu", "adjective", "Quan trọng, quý giá", "Tính từ な.", L),
    v(11, "たいへん", "大変", "たいへん", "taihen", "adjective", "Vất vả, ghê gớm (cả nghĩa xấu và mức độ mạnh)", "Tính từ な. Cũng dùng làm cảm thán: 大変だ = gay rồi!", L),
    v(12, "べんり", "便利", "べんり", "benri", "adjective", "Tiện lợi", "Đã gặp bài 8.", L),
    v(13, "あした", "明日", "あした", "ashita", "noun", "Ngày mai", "Đã gặp bài 4 — nay dùng trong câu phán đoán thời tiết.", L),
    v(14, "らいねん", "来年", "らいねん", "rainen", "noun", "Năm sau", "Đã gặp bài 5.", L),
    v(15, "たぶん", "多分", "たぶん", "tabun", "adverb", "Có lẽ, chắc là", "Thường đi cùng でしょう để giảm nhẹ mức độ chắc chắn.", L),
    v(16, "きっと", "", "", "kitto", "adverb", "Chắc chắn, nhất định", "Mức độ chắc chắn cao hơn たぶん.", L),
    v(17, "でしょう", "", "", "deshou", "phrase", "Chắc là, phải không nào (phán đoán/xác nhận)", "Xuống giọng = phán đoán; lên giọng = xác nhận đồng tình.", L),
    v(18, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "Đã gặp bài 1 — nay dùng làm chủ thể của lời trích dẫn.", L),
    v(19, "がいこくじん", "外国人", "がいこくじん", "gaikokujin", "noun", "Người nước ngoài", "Đã gặp bài 1 — nay dùng làm chủ đề ý kiến.", L),
    v(20, "むずかしい", "難しい", "むずかしい", "muzukashii", "adjective", "Khó", "Đã gặp bài 8 — nay dùng làm nội dung ý kiến/trích dẫn.", L),
]

KANJI = [
    k(1, "思", "TƯ", 9, ["シ (shi)"], ["おも(う)"], "Suy nghĩ, cảm nghĩ. Bộ 心 (tâm) bên dưới.",
      [("思います", "おもいます", "Nghĩ rằng"), ("思い出", "おもいで", "Kỷ niệm"), ("意思", "いし", "Ý chí")], L),
    k(2, "言", "NGÔN", 7, ["ゲン (gen)", "ゴン (gon)"], ["い(う)", "こと"], "Lời nói.",
      [("言います", "いいます", "Nói"), ("言葉", "ことば", "Ngôn từ"), ("方言", "ほうげん", "Phương ngữ")], L),
    k(3, "考", "KHẢO", 6, ["コウ (kou)"], ["かんが(える)"], "Suy xét, cân nhắc.",
      [("考えます", "かんがえます", "Suy nghĩ"), ("考え方", "かんがえかた", "Cách suy nghĩ"), ("参考", "さんこう", "Tham khảo")], L),
    k(4, "天", "THIÊN", 4, ["テン (ten)"], ["あめ", "あま"], "Trời.",
      [("天気", "てんき", "Thời tiết"), ("天国", "てんごく", "Thiên đường"), ("天才", "てんさい", "Thiên tài")], L),
    k(5, "雨", "VŨ", 8, ["ウ (u)"], ["あめ"], "Mưa. Hình vẽ những giọt mưa rơi từ đám mây.",
      [("雨", "あめ", "Mưa"), ("大雨", "おおあめ", "Mưa to"), ("雨季", "うき", "Mùa mưa")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Nêu ý kiến: [Câu thể thông thường] と 思います",
        "[Câu ở thể thông thường] + と + 思います",
        "Toàn bộ câu TRƯỚC と phải chia ở THỂ THÔNG THƯỜNG (đã học ở bài 20) — kể cả khi diễn đạt "
        "cả câu nghe lịch sự nhờ 思います ở cuối. と đóng vai trò trích dẫn nội dung suy nghĩ.",
        [
            ex(L, 1, 1, [t("t-l21s1-1", "あした"), t("t-l21s1-2", "は"), t("t-l21s1-3", "あめ", "雨", "あめ"),
                         t("t-l21s1-4", "だ", key=True), t("t-l21s1-5", "と", key=True),
                         t("t-l21s1-6", "おもいます", "思います", "おもいます", key=True)],
               "Tôi nghĩ ngày mai sẽ mưa."),
            ex(L, 1, 2, [t("t-l21s1-7", "にほんご", "日本語", "にほんご"), t("t-l21s1-8", "は"),
                         t("t-l21s1-9", "むずかしい", "難しい", "むずかしい", key=True), t("t-l21s1-10", "と", key=True),
                         t("t-l21s1-11", "おもいます", "思います", "おもいます")],
               "Tôi nghĩ tiếng Nhật khó."),
        ],
        tips="Lỗi hay gặp: chia câu trước と ở thể lịch sự (雨ですと思います) — SAI, phải là thể thông thường (雨だと).",
        culture="Người Nhật hay mở đầu ý kiến bằng 「私は…と思います」 để giữ giọng khiêm tốn, tránh khẳng định tuyệt đối."),

    slide(L, 2,
        "2. Trích dẫn lời nói: [Câu thể thông thường] と 言いました",
        "[Câu ở thể thông thường] + と + 言いました",
        "Cùng khung と như 思います, nhưng dùng để THUẬT LẠI lời ai đó đã nói — と đóng vai trò "
        "trích dẫn trực tiếp nội dung lời nói.",
        [
            ex(L, 2, 1, [t("t-l21s2-1", "せんせい", "先生", "せんせい"), t("t-l21s2-2", "は"),
                         t("t-l21s2-3", "「"), t("t-l21s2-4", "あした"), t("t-l21s2-5", "テスト"),
                         t("t-l21s2-6", "が"), t("t-l21s2-7", "ある", key=True), t("t-l21s2-8", "」"),
                         t("t-l21s2-9", "と", key=True), t("t-l21s2-10", "いいました", "言いました", "いいました", key=True)],
               "Thầy giáo nói rằng ngày mai có kiểm tra."),
            ex(L, 2, 2, [t("t-l21s2-11", "てんきよほう", "天気予報", "てんきよほう"), t("t-l21s2-12", "は"),
                         t("t-l21s2-13", "たいふう", "台風", "たいふう"), t("t-l21s2-14", "が"),
                         t("t-l21s2-15", "くる", "来る", "くる"), t("t-l21s2-16", "と", key=True),
                         t("t-l21s2-17", "いっていました", "言っていました", "いっていました")],
               "Dự báo thời tiết nói rằng bão sắp tới."),
        ],
        tips="言っていました (thể ています của 言う) thường tự nhiên hơn 言いました khi trích dẫn nguồn tin đã nghe trước đó (báo, đài).",
        culture="ニュースで 聞きました hoặc 新聞で 読みました hay đi kèm câu trích dẫn để chỉ rõ nguồn thông tin."),

    slide(L, 3,
        "3. Phán đoán: [Câu thể thông thường, bỏ だ] + でしょう",
        "[Câu thể thông thường bỏ だ nếu có] + でしょう",
        "でしょう là dạng LỊCH SỰ của だろう, diễn tả PHÁN ĐOÁN không chắc chắn tuyệt đối. "
        "Xuống giọng = phán đoán một mình; lên giọng ở cuối = hỏi xác nhận, mong đối phương đồng tình.",
        [
            ex(L, 3, 1, [t("t-l21s3-1", "あした"), t("t-l21s3-2", "は"), t("t-l21s3-3", "たぶん", "多分", "たぶん", key=True),
                         t("t-l21s3-4", "あめ", "雨", "あめ"), t("t-l21s3-5", "でしょう", key=True)],
               "Ngày mai có lẽ sẽ mưa."),
            ex(L, 3, 2, [t("t-l21s3-6", "これ"), t("t-l21s3-7", "は"), t("t-l21s3-8", "べんり", "便利", "べんり"),
                         t("t-l21s3-9", "でしょう", key=True), t("t-l21s3-10", "？")],
               "Cái này tiện lợi đúng không nào? (lên giọng, mong đồng tình)"),
        ],
        tips="たぶん thường đi kèm でしょう để nhấn thêm sắc thái không chắc chắn — nói でしょう một mình vẫn đúng nhưng thiếu tự nhiên.",
        culture="Người dẫn chương trình dự báo thời tiết Nhật luôn dùng でしょう thay vì です để giữ tính khách quan, tránh khẳng định tuyệt đối về tương lai."),

    slide(L, 4,
        "4. So sánh 思います / 考えます / でしょう",
        "思います (ý kiến cá nhân) / 考えます (suy nghĩ kỹ, cân nhắc) / でしょう (phán đoán khách quan hơn)",
        "Ba cách diễn đạt gần nghĩa nhưng SẮC THÁI khác nhau: 思います chủ quan, tức thời; "
        "考えます nhấn mạnh quá trình cân nhắc; でしょう nghiêng về dự đoán dựa trên căn cứ.",
        [
            ex(L, 4, 1, [t("t-l21s4-1", "らいねん", "来年", "らいねん"), t("t-l21s4-2", "、"),
                         t("t-l21s4-3", "にほん", "日本", "にほん"), t("t-l21s4-4", "へ"),
                         t("t-l21s4-5", "いこう", "行こう", "いこう"), t("t-l21s4-6", "と"),
                         t("t-l21s4-7", "かんがえて", "考えて", "かんがえて", key=True), t("t-l21s4-8", "います", "居ます", "います")],
               "Tôi đang cân nhắc chuyện năm sau đi Nhật."),
            ex(L, 4, 2, [t("t-l21s4-9", "がいこくじん", "外国人", "がいこくじん", key=True), t("t-l21s4-10", "に"),
                         t("t-l21s4-11", "とって"), t("t-l21s4-12", "、"), t("t-l21s4-13", "かんじ", "漢字", "かんじ"),
                         t("t-l21s4-14", "は"), t("t-l21s4-15", "たいへん", "大変", "たいへん", key=True),
                         t("t-l21s4-16", "でしょう", key=True)],
               "Đối với người nước ngoài, chữ Hán chắc là vất vả."),
        ],
        tips="考えています (đang cân nhắc) khác 考えました (đã quyết định sau khi suy nghĩ) — chú ý thì của câu để chọn đúng.",
        culture="Trong họp hành công sở Nhật, 考えさせてください (cho tôi suy nghĩ thêm) là câu từ chối/hoãn quyết định lịch sự phổ biến."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d-l21-1", "あした"), t("d-l21-2", "の"), t("d-l21-3", "てんき", "天気", "てんき", key=True),
          t("d-l21-4", "、"), t("d-l21-5", "どう"), t("d-l21-6", "おもいますか", "思いますか", "おもいますか", key=True)],
         "Cậu nghĩ thời tiết ngày mai thế nào?"),
    line(L, 2, "サントス", "Sinh viên",
         [t("d-l21-7", "たぶん", "多分", "たぶん", key=True), t("d-l21-8", "あめ", "雨", "あめ"),
          t("d-l21-9", "でしょう", key=True), t("d-l21-10", "。"), t("d-l21-11", "ニュース"),
          t("d-l21-12", "で"), t("d-l21-13", "たいふう", "台風", "たいふう", key=True), t("d-l21-14", "が"),
          t("d-l21-15", "くる", "来る", "くる"), t("d-l21-16", "と", key=True),
          t("d-l21-17", "いっていました", "言っていました", "いっていました", key=True)],
         "Có lẽ sẽ mưa. Tin tức nói là bão sắp tới."),
    line(L, 3, "ワン", "Sinh viên",
         [t("d-l21-18", "ほんとうです", "本当ですか", "ほんとうですか"), t("d-l21-19", "か"), t("d-l21-20", "。"),
          t("d-l21-21", "たいへん", "大変", "たいへん", key=True), t("d-l21-22", "です"), t("d-l21-23", "ね")],
         "Vậy à. Vất vả thật đấy."),
    line(L, 4, "サントス", "Sinh viên",
         [t("d-l21-24", "せんせい", "先生", "せんせい", key=True), t("d-l21-25", "も"), t("d-l21-26", "「"),
          t("d-l21-27", "あした"), t("d-l21-28", "がっこう", "学校", "がっこう"), t("d-l21-29", "は"),
          t("d-l21-30", "やすみ", "休み", "やすみ"), t("d-l21-31", "だ", key=True), t("d-l21-32", "」"),
          t("d-l21-33", "と", key=True), t("d-l21-34", "いいました", "言いました", "いいました", key=True)],
         "Thầy giáo cũng nói là ngày mai trường nghỉ học."),
    line(L, 5, "ワン", "Sinh viên",
         [t("d-l21-35", "そうですか"), t("d-l21-36", "。"), t("d-l21-37", "じゃ"),
          t("d-l21-38", "、"), t("d-l21-39", "うち", "家", "うち"), t("d-l21-40", "で"),
          t("d-l21-41", "べんきょう", "勉強", "べんきょう"), t("d-l21-42", "しましょう")],
         "Vậy à. Vậy học ở nhà thôi."),
    line(L, 6, "サントス", "Sinh viên",
         [t("d-l21-43", "いい"), t("d-l21-44", "かんがえ", "考え", "かんがえ", key=True), t("d-l21-45", "です"),
          t("d-l21-46", "ね"), t("d-l21-47", "。"), t("d-l21-48", "かんじ", "漢字", "かんじ"),
          t("d-l21-49", "、"), t("d-l21-50", "むずかしい", "難しい", "むずかしい", key=True), t("d-l21-51", "です"),
          t("d-l21-52", "ね")],
         "Ý hay đấy. Chữ Hán khó thật nhỉ."),
    line(L, 7, "ワン", "Sinh viên",
         [t("d-l21-53", "はい"), t("d-l21-54", "。"), t("d-l21-55", "でも"), t("d-l21-56", "、"),
          t("d-l21-57", "がいこくじん", "外国人", "がいこくじん", key=True), t("d-l21-58", "に"),
          t("d-l21-59", "とって"), t("d-l21-60", "、"), t("d-l21-61", "たいせつ", "大切", "たいせつ", key=True),
          t("d-l21-62", "だ", key=True), t("d-l21-63", "と", key=True), t("d-l21-64", "おもいます", "思います", "おもいます", key=True)],
         "Vâng. Nhưng tớ nghĩ, với người nước ngoài thì việc học nó là quan trọng."),
    line(L, 8, "サントス", "Sinh viên",
         [t("d-l21-65", "そうですね"), t("d-l21-66", "。"), t("d-l21-67", "わたし", "私", "わたし"),
          t("d-l21-68", "も"), t("d-l21-69", "そう"), t("d-l21-70", "おもいます", "思います", "おもいます", key=True)],
         "Đúng vậy nhỉ. Tớ cũng nghĩ vậy."),
    line(L, 9, "ワン", "Sinh viên",
         [t("d-l21-71", "じゃ"), t("d-l21-72", "、"), t("d-l21-73", "きょう", "今日", "きょう"),
          t("d-l21-74", "から"), t("d-l21-75", "、"), t("d-l21-76", "まいにち", "毎日", "まいにち"),
          t("d-l21-77", "かんじ", "漢字", "かんじ"), t("d-l21-78", "を"), t("d-l21-79", "べんきょう", "勉強", "べんきょう"),
          t("d-l21-80", "しよう", "しよう", "しよう"), t("d-l21-81", "と", key=True),
          t("d-l21-82", "おもいます", "思います", "おもいます", key=True)],
         "Vậy thì, tớ nghĩ là từ hôm nay sẽ học chữ Hán mỗi ngày."),
    line(L, 10, "サントス", "Sinh viên",
         [t("d-l21-83", "いいですね"), t("d-l21-84", "。"), t("d-l21-85", "わたし", "私", "わたし"),
          t("d-l21-86", "も"), t("d-l21-87", "がんばります", "頑張ります", "がんばります")],
         "Hay đó. Tớ cũng sẽ cố gắng."),
]

EXERCISES = [
    q(L, 1, "「明日は 雨だと 思います」 — vì sao trước と là だ chứ không phải です?",
      ["Câu trước と phải chia ở thể thông thường", "だ là lỗi chính tả",
       "です mới đúng, だ sai", "だ chỉ dùng cho câu hỏi"], 0,
      "Nội dung trước と (nêu ý kiến/trích dẫn) luôn chia ở THỂ THÔNG THƯỜNG đã học ở bài 20.",
      "Xem lại quy tắc chia trước と."),
    q(L, 2, "「先生は 明日 テストが あると 言いました」 nghĩa là:",
      ["Thầy giáo nói rằng ngày mai có kiểm tra", "Thầy giáo hỏi có kiểm tra không",
       "Thầy giáo nghĩ có thể có kiểm tra", "Ngày mai không có kiểm tra"], 0,
      "と言いました dùng để THUẬT LẠI lời một ai đó đã nói ra.",
      "So sánh với と思います (ý kiến của người nói, câu 1)."),
    q(L, 3, "でしょう xuống giọng và でしょう lên giọng khác nhau ở:",
      ["Xuống giọng = phán đoán một mình, lên giọng = hỏi xác nhận đồng tình",
       "Hoàn toàn giống nhau", "Xuống giọng là câu hỏi",
       "Lên giọng là phủ định"], 0,
      "Cùng một từ nhưng ngữ điệu quyết định ý nghĩa: phán đoán khách quan hay mời đối phương đồng tình.",
      "Đây là điểm ngữ điệu quan trọng của でしょう."),
    q(L, 4, "たぶん thường đi kèm với từ nào cuối câu?",
      ["でしょう", "です", "ました", "ますか"], 0,
      "たぶん (có lẽ) và でしょう (phán đoán không chắc chắn) thường xuất hiện cùng nhau để nhấn mạnh mức độ không chắc chắn.",
      "Xem ví dụ ở slide 3."),
    q(L, 5, "考えます khác 思います ở chỗ:",
      ["考えます nhấn mạnh QUÁ TRÌNH suy nghĩ/cân nhắc kỹ, 思います là ý kiến tức thời",
       "Hoàn toàn giống nhau", "考えます chỉ dùng cho câu hỏi",
       "思います chỉ dùng cho quá khứ"], 0,
      "思います là phản ứng/quan điểm ngay lập tức; 考えます nhấn mạnh việc CÂN NHẮC có thời gian suy xét.",
      "So sánh sắc thái hai động từ ở slide 4."),
    q(L, 6, "「考えています」 khác 「考えました」 ở thì:",
      ["考えています = đang cân nhắc (chưa quyết định); 考えました = đã suy nghĩ xong (đã quyết định)",
       "Hoàn toàn giống nhau về nghĩa", "考えています là quá khứ",
       "考えました là hiện tại tiếp diễn"], 0,
      "ています diễn tả QUÁ TRÌNH đang diễn ra; ました báo đã HOÀN TẤT việc suy nghĩ và ra quyết định.",
      "Áp dụng kiến thức về Vています đã học ở bài 14-15."),
    q(L, 7, "「日本語は 難しいと 思います」 — câu này chia đúng vì:",
      ["難しい (tính từ い) không đổi ở thể thông thường, giữ nguyên trước と",
       "難しい phải đổi thành 難しいだ", "難しい phải đổi thành 難しく",
       "Câu này sai ngữ pháp"], 0,
      "Tính từ い giữ NGUYÊN dạng ở thể thông thường (không thêm だ như danh từ/tính từ な).",
      "So sánh với danh từ/tính từ な cần thêm だ trước と."),
    q(L, 8, "「外国人にとって、漢字は大変でしょう」 nghĩa là:",
      ["Đối với người nước ngoài, chữ Hán chắc là vất vả", "Người nước ngoài không thích chữ Hán",
       "Chữ Hán dễ đối với người nước ngoài", "Chữ Hán không liên quan tới người nước ngoài"], 0,
      "にとって (đối với) + でしょう (phán đoán) diễn tả nhận định có căn cứ về một nhóm đối tượng cụ thể.",
      "にとって đánh dấu góc nhìn/đối tượng được nhận định."),
    q(L, 9, "Trong hội thoại, tin tức nói gì về thời tiết ngày mai?",
      ["Bão sắp tới", "Trời sẽ nắng đẹp", "Sẽ có tuyết", "Không có tin gì đặc biệt"], 0,
      "サントス nói 「ニュースで 台風が来ると言っていました」.",
      "Xem câu thoại thứ 2."),
    q(L, 10, "Cuối hội thoại, hai người quyết định làm gì?",
      ["Học chữ Hán mỗi ngày từ hôm nay", "Đi chơi vì được nghỉ học",
       "Ngủ cả ngày", "Đi xem bão"], 0,
      "ワン nói 「今日から、毎日 漢字を勉強しようと思います」 và サントス đồng ý cố gắng cùng.",
      "Xem hai câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 21: Ý kiến, Phán đoán & Trích dẫn (〜と思います / 〜と言いました / でしょう)",
    "Nêu ý kiến cá nhân bằng [thể thông thường]と思います, trích dẫn lời người khác bằng "
    "[thể thông thường]と言いました, phán đoán không chắc chắn bằng でしょう (kèm たぶん/きっと), "
    "và so sánh sắc thái giữa 思います (ý kiến tức thời), 考えます (cân nhắc kỹ) và でしょう "
    "(phán đoán khách quan hơn).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
