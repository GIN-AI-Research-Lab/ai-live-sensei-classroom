# -*- coding: utf-8 -*-
"""N3 — Bai 17: Ve van de について (pho bien, than mat) va に関して (trang trong, hoc thuat).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n3.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n3_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 17
pool = Pool("n3")

VOCAB = [
    v(1,  "ぎろんします", "議論します", "ぎろんします", "giron shimasu", "verb", "Tranh luận, thảo luận", "せいじを 議論します = tranh luận về chính trị.", L),
    v(2,  "はっぴょうします", "発表します", "はっぴょうします", "happyou shimasu", "verb", "Phát biểu, công bố", "けんきゅうを 発表します = công bố nghiên cứu.", L),
    v(3,  "ほうこくします", "報告します", "ほうこくします", "houkoku shimasu", "verb", "Báo cáo", "けっかを 報告します = báo cáo kết quả.", L),
    v(4,  "ぶんか", "文化", "ぶんか", "bunka", "noun", "Văn hóa", "日本の 文化 = văn hóa Nhật Bản.", L),
    v(5,  "れきし", "歴史", "れきし", "rekishi", "noun", "Lịch sử", "日本の 歴史 = lịch sử Nhật Bản.", L),
    v(6,  "ちょうさ", "調査", "ちょうさ", "chousa", "noun", "Khảo sát, điều tra", "Đã gặp N3 bài 7.", L),
    v(7,  "いけん", "意見", "いけん", "iken", "noun", "Ý kiến", "Đã gặp N4 bài 26.", L),
    v(8,  "せいじ", "政治", "せいじ", "seiji", "noun", "Chính trị", "Đã gặp N4 bài 40.", L),
    v(9,  "けいざい", "経済", "けいざい", "keizai", "noun", "Kinh tế", "Đã gặp N3 bài 14.", L),
    v(10, "かんきょう", "環境", "かんきょう", "kankyou", "noun", "Môi trường", "Đã gặp N3 bài 5.", L),
    v(11, "かいぎ", "会議", "かいぎ", "kaigi", "noun", "Cuộc họp", "Đã gặp N4 bài 30.", L),
    v(12, "しつもん", "質問", "しつもん", "shitsumon", "noun", "Câu hỏi", "Đã gặp N4 bài 26.", L),
    v(13, "にほん", "日本", "にほん", "nihon", "noun", "Nhật Bản", "Đã gặp N5 bài 1.", L),
    v(14, "しゃかい", "社会", "しゃかい", "shakai", "noun", "Xã hội", "Đã gặp N3 bài 5.", L),
    v(15, "だいがく", "大学", "だいがく", "daigaku", "noun", "Đại học", "Đã gặp N4 bài 26.", L),
    v(16, "がくせい", "学生", "がくせい", "gakusei", "noun", "Học sinh, sinh viên", "Đã gặp N4 bài 26.", L),
    v(17, "せんせい", "先生", "せんせい", "sensei", "noun", "Giáo viên", "Đã gặp N5 bài 1.", L),
    v(18, "はなします", "話します", "はなします", "hanashimasu", "verb", "Nói chuyện", "Đã gặp N4 bài 26.", L),
    v(19, "ききます", "聞きます", "ききます", "kikimasu", "verb", "Nghe, hỏi", "Đã gặp N4 bài 26.", L),
    v(20, "かきます", "書きます", "かきます", "kakimasu", "verb", "Viết", "Đã gặp N4 bài 26.", L),
]

KANJI = [
    k(1, "議", "NGHỊ", 20, ["ギ (gi)"], [], "Bàn bạc, nghị luận.",
      [("議論", "ぎろん", "Tranh luận"), ("会議", "かいぎ", "Cuộc họp")], L),
    k(2, "論", "LUẬN", 15, ["ロン (ron)"], [], "Luận bàn, lý luận.",
      [("議論", "ぎろん", "Tranh luận"), ("論文", "ろんぶん", "Luận văn")], L),
    k(3, "発", "PHÁT", 9, ["ハツ (hatsu)"], [], "Phát ra, khởi phát.",
      [("発表", "はっぴょう", "Phát biểu, công bố"), ("出発", "しゅっぱつ", "Xuất phát")], L),
    k(4, "報", "BÁO", 12, ["ホウ (hou)"], [], "Báo cáo, thông tin.",
      [("報告", "ほうこく", "Báo cáo"), ("情報", "じょうほう", "Thông tin")], L),
    k(5, "史", "SỬ", 5, ["シ (shi)"], [], "Lịch sử.",
      [("歴史", "れきし", "Lịch sử"), ("史料", "しりょう", "Tư liệu lịch sử")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Về, liên quan đến (phổ biến): N + について",
        "N + について、[nội dung liên quan]",
        "について diễn tả 'VỀ, liên quan đến' một chủ đề — dùng RẤT PHỔ BIẾN trong cả hội thoại "
        "lẫn văn viết, mang tính TRUNG TÍNH, thân thiện, không đòi hỏi văn phong học thuật.",
        [
            ex(L, 1, 1, [t("t-l17s1-1", "にほん", "日本", "にほん"), t("t-l17s1-2", "の"),
                         t("t-l17s1-3", "ぶんか", "文化", "ぶんか", key=True), t("t-l17s1-4", "に"),
                         t("t-l17s1-5", "ついて", key=True), t("t-l17s1-6", "、"), t("t-l17s1-7", "はなします", "話します", "はなします")],
               "Tôi sẽ nói về văn hóa Nhật Bản."),
            ex(L, 1, 2, [t("t-l17s1-8", "この"), t("t-l17s1-9", "もんだい", "問題", "もんだい"), t("t-l17s1-10", "に"),
                         t("t-l17s1-11", "ついて", key=True), t("t-l17s1-12", "、"), t("t-l17s1-13", "いけん", "意見", "いけん", key=True),
                         t("t-l17s1-14", "を"), t("t-l17s1-15", "ください")],
               "Xin cho tôi ý kiến về vấn đề này."),
        ],
        tips="について dùng được với bất kỳ chủ đề nào, cả nghiêm túc lẫn đời thường: 趣味について (về sở thích), 天気について (về thời tiết).",
        culture="Câu hỏi phỏng vấn phổ biến ở Nhật: '将来についてどう考えていますか' (bạn nghĩ thế nào về tương lai)."),

    slide(L, 2,
        "2. Về, liên quan đến (trang trọng, học thuật): N + に関して",
        "N + に関して、[nội dung liên quan]",
        "に関して cũng nghĩa 'về, liên quan đến' nhưng TRANG TRỌNG HƠN について, thường dùng "
        "trong văn viết học thuật, báo cáo, phát biểu chính thức — ít tự nhiên trong hội thoại thân mật.",
        [
            ex(L, 2, 1, [t("t-l17s2-1", "れきし", "歴史", "れきし", key=True), t("t-l17s2-2", "に"),
                         t("t-l17s2-3", "かんして", "関して", "かんして", key=True), t("t-l17s2-4", "、"),
                         t("t-l17s2-5", "ちょうさ", "調査", "ちょうさ", key=True), t("t-l17s2-6", "します")],
               "Tôi sẽ khảo sát về lịch sử."),
            ex(L, 2, 2, [t("t-l17s2-7", "せいじ", "政治", "せいじ", key=True), t("t-l17s2-8", "に"),
                         t("t-l17s2-9", "かんして", "関して", "かんして", key=True), t("t-l17s2-10", "、"),
                         t("t-l17s2-11", "ぎろん", "議論", "ぎろん", key=True), t("t-l17s2-12", "します")],
               "Tranh luận về chính trị."),
        ],
        tips="に関して thường xuất hiện trong tiêu đề bài phát biểu, luận văn: 'AIに関する研究' (nghiên cứu về AI).",
        culture="Trong hội nghị, báo cáo công ty Nhật, に関して luôn được ưu tiên hơn について để thể hiện tính trang trọng."),

    slide(L, 3,
        "3. So sánh について và に関して",
        "について: PHỔ BIẾN, thân mật, dùng mọi ngữ cảnh　vs　に関して: TRANG TRỌNG, học thuật/báo cáo",
        "Về cơ bản hai cấu trúc có thể thay thế cho nhau, nhưng について tự nhiên trong HỘI THOẠI "
        "ĐỜI THƯỜNG (chủ đề bất kỳ, kể cả nhẹ nhàng); に関して chỉ tự nhiên trong văn phong TRANG "
        "TRỌNG, học thuật, báo cáo — dùng に関して cho chủ đề đời thường sẽ nghe hơi cứng nhắc.",
        [
            ex(L, 3, 1, [t("t-l17s3-1", "しゅみ", "趣味", "しゅみ"), t("t-l17s3-2", "に"),
                         t("t-l17s3-3", "ついて", key=True), t("t-l17s3-4", "、"), t("t-l17s3-5", "はなしましょう", "話しましょう", "はなしましょう")],
               "Hãy nói chuyện về sở thích. (đời thường, tự nhiên với について)"),
            ex(L, 3, 2, [t("t-l17s3-6", "けいざい", "経済", "けいざい", key=True), t("t-l17s3-7", "に"),
                         t("t-l17s3-8", "かんして", "関して", "かんして", key=True), t("t-l17s3-9", "、"),
                         t("t-l17s3-10", "がくせい", "学生", "がくせい", key=True), t("t-l17s3-11", "が"),
                         t("t-l17s3-12", "はっぴょう", "発表", "はっぴょう", key=True), t("t-l17s3-13", "します")],
               "Sinh viên sẽ phát biểu về kinh tế. (học thuật, tự nhiên với に関して)"),
        ],
        tips="Mẹo chọn: nói chuyện phiếm, hội thoại đời thường → について; bài phát biểu, báo cáo, luận văn → に関して.",
        culture="Cả hai đều là điểm ngữ pháp N3 trọng điểm, hay xuất hiện trong đề đọc hiểu về nhiều chủ đề khác nhau."),

    slide(L, 4,
        "4. Dạng bổ nghĩa danh từ: についての / に関する",
        "N1+についての+N2　　N1+に関する+N2 (KHÔNG phải に関しての)",
        "Khi đứng trước một DANH TỪ (thay vì cuối câu), について đổi thành についての, còn "
        "に関して đổi thành に関する (lưu ý: không phải に関しての, đây là lỗi thường gặp).",
        [
            ex(L, 4, 1, [t("t-l17s4-1", "にほん", "日本", "にほん"), t("t-l17s4-2", "の"),
                         t("t-l17s4-3", "ぶんか", "文化", "ぶんか", key=True), t("t-l17s4-4", "に"),
                         t("t-l17s4-5", "ついての", key=True), t("t-l17s4-6", "ほん", "本", "ほん")],
               "Sách về văn hóa Nhật Bản."),
            ex(L, 4, 2, [t("t-l17s4-7", "せいじ", "政治", "せいじ", key=True), t("t-l17s4-8", "に"),
                         t("t-l17s4-9", "かんする", "関する", "かんする", key=True), t("t-l17s4-10", "ぎろん", "議論", "ぎろん", key=True)],
               "Cuộc tranh luận về chính trị."),
        ],
        tips="Ghi nhớ: について→についての (thêm の); に関して→に関する (đổi hẳn thành する, KHÔNG thêm の).",
        culture="Tựa đề sách, báo cáo nghiên cứu ở Nhật thường dùng に関する: '環境問題に関する報告書' (báo cáo về vấn đề môi trường)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Giáo viên hướng dẫn",
         [t("d17-1", "こんど", "今度", "こんど"), t("d17-2", "の"), t("d17-3", "かいぎ", "会議", "かいぎ", key=True),
          t("d17-4", "は"), t("d17-5", "なに", "何", "なに"), t("d17-6", "に"), t("d17-7", "ついて", key=True),
          t("d17-8", "です", "です", "です"), t("d17-9", "か")],
         "Cuộc họp lần này là về vấn đề gì?"),
    line(L, 2, "サントス", "Sinh viên",
         [t("d17-10", "にほん", "日本", "にほん"), t("d17-11", "の"), t("d17-12", "ぶんか", "文化", "ぶんか", key=True),
          t("d17-13", "に"), t("d17-14", "ついて", key=True), t("d17-15", "です")],
         "Là về văn hóa Nhật Bản ạ."),
    line(L, 3, "田中", "Giáo viên hướng dẫn",
         [t("d17-16", "れきし", "歴史", "れきし", key=True), t("d17-17", "に"), t("d17-18", "かんして", "関して", "かんして", key=True),
          t("d17-19", "も"), t("d17-20", "しらべます", "調べます", "しらべます"), t("d17-21", "か")],
         "Có khảo sát cả về lịch sử không?"),
    line(L, 4, "サントス", "Sinh viên",
         [t("d17-22", "はい"), t("d17-23", "、"), t("d17-24", "れきし", "歴史", "れきし", key=True), t("d17-25", "に"),
          t("d17-26", "かんして", "関して", "かんして", key=True), t("d17-27", "ちょうさ", "調査", "ちょうさ", key=True),
          t("d17-28", "します")],
         "Vâng, tôi sẽ khảo sát về lịch sử."),
    line(L, 5, "田中", "Giáo viên hướng dẫn",
         [t("d17-29", "せいじ", "政治", "せいじ", key=True), t("d17-30", "に", key=True), t("d17-31", "ついても", key=True),
          t("d17-32", "はなしますか")],
         "Cũng sẽ nói về chính trị chứ?"),
    line(L, 6, "サントス", "Sinh viên",
         [t("d17-33", "いいえ"), t("d17-34", "、"), t("d17-35", "せいじ", "政治", "せいじ", key=True), t("d17-36", "に"),
          t("d17-37", "ついては", key=True), t("d17-38", "はなしません")],
         "Không, tôi sẽ không nói về chính trị."),
    line(L, 7, "田中", "Giáo viên hướng dẫn",
         [t("d17-39", "けっか", "結果", "けっか"), t("d17-40", "を"), t("d17-41", "だいがく", "大学", "だいがく", key=True),
          t("d17-42", "で"), t("d17-43", "ほうこく", "報告", "ほうこく", key=True), t("d17-44", "します", "為ます", "します"),
          t("d17-45", "か")],
         "Bạn sẽ báo cáo kết quả ở trường đại học chứ?"),
    line(L, 8, "サントス", "Sinh viên",
         [t("d17-46", "はい"), t("d17-47", "、"), t("d17-48", "せんせい", "先生", "せんせい", key=True), t("d17-49", "に"),
          t("d17-50", "ほうこく", "報告", "ほうこく", key=True), t("d17-51", "して"), t("d17-52", "、"),
          t("d17-53", "がくせい", "学生", "がくせい", key=True), t("d17-54", "たち", "達", "たち"), t("d17-55", "に"),
          t("d17-56", "はっぴょう", "発表", "はっぴょう", key=True), t("d17-57", "します")],
         "Vâng, tôi sẽ báo cáo với giáo viên rồi phát biểu trước các sinh viên."),
    line(L, 9, "田中", "Giáo viên hướng dẫn",
         [t("d17-58", "しつもん", "質問", "しつもん", key=True), t("d17-59", "が"), t("d17-60", "あれば", "有れば", "あれば"),
          t("d17-61", "、"), t("d17-62", "きいて", "聞いて", "きいて"), t("d17-63", "ください")],
         "Nếu có câu hỏi gì, hãy hỏi nhé."),
    line(L, 10, "サントス", "Sinh viên",
         [t("d17-64", "はい"), t("d17-65", "、"), t("d17-66", "ありがとうございます", "ありがとうございます", "ありがとうございます"),
          t("d17-67", "。"), t("d17-68", "しゃかい", "社会", "しゃかい", key=True), t("d17-69", "に"),
          t("d17-70", "かんする", "関する", "かんする", key=True), t("d17-71", "ほん", "本", "ほん"), t("d17-72", "も"),
          t("d17-73", "かきます", "書きます", "かきます")],
         "Vâng, cảm ơn thầy. Tôi cũng sẽ viết một cuốn sách về xã hội."),
]

EXERCISES = [
    q(L, 1, "「日本の文化について、話します」 — について diễn tả điều gì?",
      ["Về, liên quan đến một chủ đề, dùng phổ biến trong hội thoại và văn viết",
       "So sánh hai nền văn hóa", "Phủ định việc nói chuyện", "Chỉ dùng cho câu hỏi"], 0,
      "について diễn tả 'về/liên quan đến' một chủ đề, dùng rất phổ biến, trung tính.",
      "Xem cấu trúc について ở slide 1."),
    q(L, 2, "「歴史に関して、調査します」 — に関して khác について ở điểm nào?",
      ["に関して trang trọng hơn, thường dùng trong văn viết học thuật/báo cáo",
       "Hoàn toàn giống nhau, không khác gì cả", "に関して chỉ dùng cho câu hỏi",
       "について chỉ dùng trong văn viết trang trọng"], 0,
      "に関して trang trọng hơn について, phù hợp với văn phong học thuật, báo cáo, phát biểu chính thức.",
      "Xem giải thích に関して ở slide 2."),
    q(L, 3, "Dùng に関して để nói về chủ đề đời thường (như sở thích) trong hội thoại thân mật có tự nhiên không?",
      ["Không tự nhiên lắm, について phù hợp hơn cho ngữ cảnh đời thường",
       "Rất tự nhiên, không có vấn đề gì", "に関して chỉ dùng được cho chủ đề chính trị",
       "について không thể dùng cho chủ đề đời thường"], 0,
      "に関して mang tính trang trọng, dùng cho chủ đề đời thường sẽ nghe hơi cứng nhắc — について tự nhiên hơn.",
      "Xem mẹo chọn ở slide 3."),
    q(L, 4, "Dạng bổ nghĩa danh từ của について là gì?",
      ["についての (thêm の)", "につく (bỏ いて)", "についてな (thêm な)", "Không có dạng bổ nghĩa danh từ"], 0,
      "について khi đứng trước danh từ đổi thành についての: 文化についての本 (sách về văn hóa).",
      "Xem quy tắc ở slide 4."),
    q(L, 5, "Dạng bổ nghĩa danh từ của に関して là gì?",
      ["に関する (đổi hẳn thành する, KHÔNG phải に関しての)", "に関しての (thêm の)",
       "に関してな (thêm な)", "Không có dạng bổ nghĩa danh từ"], 0,
      "に関して khi đứng trước danh từ đổi thành に関する — đây là điểm dễ nhầm với について.",
      "Xem lưu ý quan trọng ở slide 4."),
    q(L, 6, "「政治に関する議論」 nghĩa là:",
      ["Cuộc tranh luận về chính trị", "Cuộc tranh luận không liên quan đến chính trị",
       "Chính trị đã kết thúc", "Không có cuộc tranh luận nào"], 0,
      "に関する ở đây bổ nghĩa cho danh từ 議論 (tranh luận), nghĩa là 'cuộc tranh luận VỀ chính trị'.",
      "Áp dụng cấu trúc Nに関する+N2."),
    q(L, 7, "「趣味について、話しましょう」 phù hợp với ngữ cảnh nào hơn?",
      ["Hội thoại đời thường, thân mật", "Báo cáo học thuật trang trọng",
       "Văn bản pháp lý", "Luận văn nghiên cứu"], 0,
      "について tự nhiên trong hội thoại đời thường, phù hợp với chủ đề nhẹ nhàng như sở thích (趣味).",
      "Xem ví dụ ở slide 3."),
    q(L, 8, "Theo hội thoại, Santos sẽ khảo sát về vấn đề gì?",
      ["Lịch sử (歴史に関して調査します)", "Chính trị", "Kinh tế", "Không khảo sát gì cả"], 0,
      "Santos nói 「歴史に関して調査します」.",
      "Xem câu thoại thứ 4."),
    q(L, 9, "Santos có nói về chính trị không?",
      ["Không (政治については話しません)", "Có, nói rất nhiều", "Chỉ nói một chút",
       "Không được đề cập trong hội thoại"], 0,
      "Santos trả lời 「政治については話しません」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Santos sẽ viết sách về chủ đề gì ở cuối hội thoại?",
      ["Xã hội (社会に関する本を書きます)", "Chính trị", "Kinh tế", "Không viết sách nào cả"], 0,
      "Santos nói 「社会に関する本も書きます」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 17: Về vấn đề (に関して & について)",
    "について diễn tả 'về, liên quan đến' một chủ đề — dùng PHỔ BIẾN, trung tính, tự nhiên trong "
    "cả hội thoại đời thường lẫn văn viết; に関して cũng nghĩa tương tự nhưng TRANG TRỌNG HƠN, "
    "phù hợp văn phong học thuật/báo cáo; dạng bổ nghĩa danh từ: についての vs に関する (không phải に関しての).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
