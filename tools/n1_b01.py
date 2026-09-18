# -*- coding: utf-8 -*-
"""N1 — Bai 1: Cuc han trang thai 極まりない (vo cung, chu quan), 極まる (dang dong tu), va
の極み (dinh diem cua danh tu truu tuong).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 1
pool = Pool("n1")

VOCAB = [
    v(1,  "ひろう", "疲労", "ひろう", "hirou", "noun", "Mệt mỏi, mệt nhọc", "疲労の 極み = tột cùng của sự mệt mỏi.", L),
    v(2,  "ぶれい", "無礼", "ぶれい", "burei", "adjective", "Vô lễ, bất lịch sự", "無礼 極まりない = vô cùng vô lễ.", L),
    v(3,  "おろか", "愚か", "おろか", "oroka", "adjective", "Ngu ngốc, khờ dại", "愚か 極まる = ngu ngốc đến cực điểm.", L),
    v(4,  "だいたん", "大胆", "だいたん", "daitan", "adjective", "Táo bạo, cả gan", "大胆な 行動 = hành động táo bạo.", L),
    v(5,  "ひさん", "悲惨", "ひさん", "hisan", "adjective", "Bi thảm, thê thảm", "悲惨な 状況 = tình huống bi thảm.", L),
    v(6,  "こうえい", "光栄", "こうえい", "kouei", "noun", "Vinh dự", "光栄の 極み = vinh dự tột cùng.", L),
    v(7,  "こうどうします", "行動します", "こうどうします", "koudou shimasu", "verb", "Hành động", "大胆に 行動します = hành động táo bạo.", L),
    v(8,  "きけん", "危険", "きけん", "kiken", "adjective", "Nguy hiểm", "Đã gặp N4 bài 34.", L),
    v(9,  "しつれい", "失礼", "しつれい", "shitsurei", "adjective", "Thất lễ", "Đã gặp N4 bài 33.", L),
    v(10, "ざんねん", "残念", "ざんねん", "zannen", "adjective", "Đáng tiếc", "Đã gặp N4 bài 26.", L),
    v(11, "たいど", "態度", "たいど", "taido", "noun", "Thái độ", "Đã gặp N3 bài 5.", L),
    v(12, "けっか", "結果", "けっか", "kekka", "noun", "Kết quả", "Đã gặp N4 bài 39.", L),
    v(13, "ひと", "人", "ひと", "hito", "noun", "Người", "Đã gặp N5 bài 1.", L),
    v(14, "あの", "あの", "あの", "ano", "determiner", "Kia, đó", "Đã gặp N5 bài 1.", L),
    v(15, "かれ", "彼", "かれ", "kare", "noun", "Anh ấy", "Đã gặp N3 bài 3.", L),
    v(16, "しあい", "試合", "しあい", "shiai", "noun", "Trận đấu", "Đã gặp N4 bài 33.", L),
    v(17, "けしき", "景色", "けしき", "keshiki", "noun", "Phong cảnh", "Đã gặp N2 bài 11.", L),
    v(18, "うつくしい", "美しい", "うつくしい", "utsukushii", "adjective", "Đẹp", "Đã gặp N4 bài 34.", L),
    v(19, "たっします", "達します", "たっします", "tasshimasu", "verb", "Đạt đến", "Đã gặp N3 bài 8.", L),
    v(20, "じょうきょう", "状況", "じょうきょう", "joukyou", "noun", "Tình huống", "Đã gặp N3 bài 13.", L),
]

KANJI = [
    k(1, "極", "CỰC", 12, ["キョク (kyoku)"], ["きわ(まる)", "きわ(み)"], "Cực điểm, tột cùng.",
      [("極まりない", "きわまりない", "Vô cùng, cực kỳ"), ("積極的", "せっきょくてき", "Tích cực")], L),
    k(2, "労", "LAO", 7, ["ロウ (rou)"], [], "Lao động, mệt nhọc.",
      [("疲労", "ひろう", "Mệt mỏi"), ("苦労", "くろう", "Vất vả")], L),
    k(3, "愚", "NGU", 13, ["グ (gu)"], ["おろ(か)"], "Ngu ngốc, khờ dại.",
      [("愚か", "おろか", "Ngu ngốc"), ("愚痴", "ぐち", "Lời than vãn")], L),
    k(4, "胆", "ĐẢM", 9, ["タン (tan)"], [], "Mật, gan dạ.",
      [("大胆", "だいたん", "Táo bạo"), ("胆力", "たんりょく", "Sự gan dạ")], L),
    k(5, "惨", "THẢM", 11, ["サン (san)"], ["みじ(め)"], "Thảm khốc, bi thảm.",
      [("悲惨", "ひさん", "Bi thảm"), ("惨事", "さんじ", "Thảm họa")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Vô cùng, cực kỳ (chủ quan, cảm thán): Aな(bỏ な) + 極まりない",
        "Aな(bỏ な) + 極まりない",
        "極まりない gắn sau GỐC của tính từ đuôi な (bỏ な) để diễn tả mức độ 'VÔ CÙNG, CỰC KỲ' — "
        "mang tính CHỦ QUAN, CẢM THÁN MẠNH, thường dùng để PHÊ PHÁN/đánh giá gay gắt một hành động/thái độ TIÊU CỰC.",
        [
            ex(L, 1, 1, [t("t-l1s1-1", "きけん", "危険", "きけん", key=True), t("t-l1s1-2", "きわまりない", "極まりない", "きわまりない", key=True),
                         t("t-l1s1-3", "こうどう", "行動", "こうどう"), t("t-l1s1-4", "です")],
               "Đây là hành động vô cùng nguy hiểm."),
            ex(L, 1, 2, [t("t-l1s1-5", "しつれい", "失礼", "しつれい", key=True), t("t-l1s1-6", "きわまりない", "極まりない", "きわまりない", key=True),
                         t("t-l1s1-7", "たいど", "態度", "たいど", key=True), t("t-l1s1-8", "です")],
               "Đây là thái độ cực kỳ thất lễ."),
        ],
        tips="極まりない KHÔNG chia thì linh hoạt như tính từ thông thường — thường giữ nguyên dạng này để nhấn cảm thán mạnh.",
        culture="Trong văn viết phê bình, xã luận Nhật hay dùng: '彼の発言は無礼極まりない' (phát ngôn của anh ta vô cùng vô lễ) để thể hiện sự phẫn nộ mạnh mẽ."),

    slide(L, 2,
        "2. Đạt đến cực điểm (dạng động từ): Aな(bỏ な) + 極まる",
        "Aな(bỏ な) + 極まる",
        "極まる (động từ, nghĩa gốc 'đạt đến cực điểm') có thể THAY THẾ 極まりない trong nhiều "
        "trường hợp — ý nghĩa gần như GIỐNG HỆT, nhưng 極まる là ĐỘNG TỪ THỰC SỰ, có thể chia thì quá khứ, dùng trong mệnh đề phụ.",
        [
            ex(L, 2, 1, [t("t-l2s2-1", "かれ", "彼", "かれ", key=True), t("t-l2s2-2", "の"), t("t-l2s2-3", "たいど", "態度", "たいど", key=True),
                         t("t-l2s2-4", "は"), t("t-l2s2-5", "ぶれい", "無礼", "ぶれい", key=True), t("t-l2s2-6", "きわまる", "極まる", "きわまる", key=True)],
               "Thái độ của anh ta thất lễ đến cực điểm."),
            ex(L, 2, 2, [t("t-l2s2-7", "この"), t("t-l2s2-8", "けっか", "結果", "けっか", key=True), t("t-l2s2-9", "は"),
                         t("t-l2s2-10", "ざんねん", "残念", "ざんねん", key=True), t("t-l2s2-11", "きわまる", "極まる", "きわまる", key=True)],
               "Kết quả này đáng tiếc đến cực điểm."),
        ],
        tips="極まる có thể chia thành 極まった (quá khứ) để kể lại một trạng thái ĐÃ đạt đến cực điểm trong quá khứ.",
        culture="Tin tức Nhật hay tường thuật: '被害は悲惨極まるものだった' (thiệt hại đã thảm khốc đến cực điểm) khi mô tả hậu quả của thiên tai."),

    slide(L, 3,
        "3. So sánh 極まりない và 極まる",
        "極まりない: dạng CỐ ĐỊNH, cảm thán mạnh　vs　極まる: ĐỘNG TỪ thực sự, chia được thì",
        "Cả hai gần như ĐỒNG NGHĨA, có thể hoán đổi trong hầu hết trường hợp hiện tại. Khác biệt: "
        "極まりない thường giữ NGUYÊN DẠNG (ít chia thì); 極まる là ĐỘNG TỪ, có thể chia thành "
        "極まった (quá khứ) hoặc dùng trong mệnh đề phụ (極まる N).",
        [
            ex(L, 3, 1, [t("t-l3s3-1", "あの"), t("t-l3s3-2", "ひと", "人", "ひと", key=True), t("t-l3s3-3", "の"),
                         t("t-l3s3-4", "こうどう", "行動", "こうどう"), t("t-l3s3-5", "は"), t("t-l3s3-6", "おろか", "愚か", "おろか", key=True),
                         t("t-l3s3-7", "きわまりない", "極まりない", "きわまりない", key=True)],
               "Hành động của người đó ngu ngốc vô cùng. (hiện tại, cố định)"),
            ex(L, 3, 2, [t("t-l3s3-8", "あの"), t("t-l3s3-9", "ひと", "人", "ひと", key=True), t("t-l3s3-10", "の"),
                         t("t-l3s3-11", "こうどう", "行動", "こうどう"), t("t-l3s3-12", "は"), t("t-l3s3-13", "おろか", "愚か", "おろか", key=True),
                         t("t-l3s3-14", "きわまった", "極まった", "きわまった", key=True)],
               "Hành động của người đó đã đạt đến mức ngu ngốc cực điểm. (quá khứ, dùng 極まる)"),
        ],
        tips="Mẹo: muốn CẢM THÁN mạnh về hiện tại → 極まりない; muốn KỂ LẠI một trạng thái đã xảy ra trong quá khứ → 極まる (極まった).",
        culture="Cả hai đều là ngữ pháp N1 mang văn phong RẤT TRANG TRỌNG, hầu như chỉ xuất hiện trong văn viết học thuật, xã luận, không dùng trong hội thoại đời thường."),

    slide(L, 4,
        "4. Đỉnh điểm của... (danh từ trừu tượng): N + の極み",
        "N(trạng thái/cảm xúc trừu tượng) + の極み",
        "の極み gắn sau DANH TỪ TRỪU TƯỢNG (không phải tính từ) để diễn tả 'ĐỈNH ĐIỂM/TỘT CÙNG' "
        "của một trạng thái/cảm xúc — thường dùng trong văn viết trang trọng, diễn văn, thư từ cảm ơn.",
        [
            ex(L, 4, 1, [t("t-l4s4-1", "これ"), t("t-l4s4-2", "は"), t("t-l4s4-3", "こうえい", "光栄", "こうえい", key=True),
                         t("t-l4s4-4", "の"), t("t-l4s4-5", "きわみ", "極み", "きわみ", key=True), t("t-l4s4-6", "です")],
               "Đây là vinh dự tột cùng."),
            ex(L, 4, 2, [t("t-l4s4-7", "ひろう", "疲労", "ひろう", key=True), t("t-l4s4-8", "の"),
                         t("t-l4s4-9", "きわみ", "極み", "きわみ", key=True), t("t-l4s4-10", "に"), t("t-l4s4-11", "たっしました", "達しました", "たっしました")],
               "Đã đạt đến tột cùng của sự mệt mỏi."),
        ],
        tips="の極み KHÔNG gắn được sau tính từ — chỉ gắn sau DANH TỪ trừu tượng như 光栄, 疲労, 贅沢, 悲惨さ.",
        culture="Diễn văn nhận giải thưởng ở Nhật thường mở đầu bằng: 'このような賞をいただき、光栄の極みでございます' (nhận được giải thưởng như thế này là vinh dự tột cùng đối với tôi)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Bình luận viên",
         [t("d1-1", "あの"), t("d1-2", "せんしゅ", "選手", "せんしゅ"), t("d1-3", "の"), t("d1-4", "こうどう", "行動", "こうどう"),
          t("d1-5", "は"), t("d1-6", "きけん", "危険", "きけん", key=True), t("d1-7", "きわまりない", "極まりない", "きわまりない", key=True),
          t("d1-8", "です", "です", "です"), t("d1-9", "ね")],
         "Hành động của vận động viên đó vô cùng nguy hiểm nhỉ."),
    line(L, 2, "サントス", "Bình luận viên",
         [t("d1-10", "はい"), t("d1-11", "。"), t("d1-12", "しんぱん", "審判", "しんぱん"), t("d1-13", "への"),
          t("d1-14", "たいど", "態度", "たいど", key=True), t("d1-15", "も"), t("d1-16", "ぶれい", "無礼", "ぶれい", key=True),
          t("d1-17", "きわまる", "極まる", "きわまる", key=True)],
         "Vâng. Thái độ với trọng tài cũng thất lễ đến cực điểm."),
    line(L, 3, "田中", "Bình luận viên",
         [t("d1-18", "しあい", "試合", "しあい", key=True), t("d1-19", "の"), t("d1-20", "けっか", "結果", "けっか", key=True),
          t("d1-21", "は"), t("d1-22", "どうでしたか")],
         "Kết quả trận đấu thế nào?"),
    line(L, 4, "サントス", "Bình luận viên",
         [t("d1-23", "ざんねん", "残念", "ざんねん", key=True), t("d1-24", "きわまる", "極まる", "きわまる", key=True),
          t("d1-25", "けっか", "結果", "けっか", key=True), t("d1-26", "でした")],
         "Là kết quả đáng tiếc đến cực điểm."),
    line(L, 5, "田中", "Bình luận viên",
         [t("d1-27", "あの"), t("d1-28", "ひと", "人", "ひと", key=True), t("d1-29", "の"), t("d1-30", "はんだん", "判断", "はんだん"),
          t("d1-31", "は"), t("d1-32", "おろか", "愚か", "おろか", key=True), t("d1-33", "きわまりない", "極まりない", "きわまりない", key=True),
          t("d1-34", "でした")],
         "Sự phán đoán của người đó đã vô cùng ngu ngốc."),
    line(L, 6, "サントス", "Bình luận viên",
         [t("d1-35", "でも"), t("d1-36", "、"), t("d1-37", "だいたん", "大胆", "だいたん", key=True), t("d1-38", "な"),
          t("d1-39", "しんじょう", "新場", "しんじょう"), t("d1-40", "も"), t("d1-41", "ありました", "有りました", "ありました")],
         "Nhưng cũng có những tình huống mới táo bạo."),
    line(L, 7, "田中", "Bình luận viên",
         [t("d1-42", "じょうきょう", "状況", "じょうきょう", key=True), t("d1-43", "は"), t("d1-44", "ひさん", "悲惨", "ひさん", key=True),
          t("d1-45", "でした", "でした", "でした"), t("d1-46", "ね")],
         "Tình huống bi thảm nhỉ."),
    line(L, 8, "サントス", "Bình luận viên",
         [t("d1-47", "はい"), t("d1-48", "。"), t("d1-49", "せんしゅ", "選手", "せんしゅ"), t("d1-50", "は"),
          t("d1-51", "ひろう", "疲労", "ひろう", key=True), t("d1-52", "の"), t("d1-53", "きわみ", "極み", "きわみ", key=True),
          t("d1-54", "に"), t("d1-55", "たっしました", "達しました", "たっしました")],
         "Vâng. Vận động viên đã đạt đến tột cùng của sự mệt mỏi."),
    line(L, 9, "田中", "Bình luận viên",
         [t("d1-56", "けしき", "景色", "けしき", key=True), t("d1-57", "は"), t("d1-58", "うつくしかった", "美しかった", "うつくしかった"),
          t("d1-59", "です", "です", "です"), t("d1-60", "が"), t("d1-61", "ね")],
         "Nhưng phong cảnh thì đẹp nhỉ."),
    line(L, 10, "サントス", "Bình luận viên",
         [t("d1-62", "こんな"), t("d1-63", "たいかい", "大会", "たいかい"), t("d1-64", "を"), t("d1-65", "みられる", "見られる", "みられる"),
          t("d1-66", "の"), t("d1-67", "は"), t("d1-68", "こうえい", "光栄", "こうえい", key=True), t("d1-69", "の"),
          t("d1-70", "きわみ", "極み", "きわみ", key=True), t("d1-71", "です")],
         "Được xem một đại hội như thế này là vinh dự tột cùng."),
]

EXERCISES = [
    q(L, 1, "「危険極まりない行動です」 — 極まりない diễn tả điều gì?",
      ["Mức độ vô cùng, cực kỳ, mang tính chủ quan, cảm thán mạnh",
       "Đạt đến cực điểm trong quá khứ", "Sự khẳng định chắc chắn về tương lai",
       "Sự từ chối lịch sự"], 0,
      "極まりない diễn tả mức độ VÔ CÙNG/CỰC KỲ một cách chủ quan, thường dùng để phê phán gay gắt.",
      "Xem cấu trúc 極まりない ở slide 1."),
    q(L, 2, "「彼の態度は無礼極まる」 — 極まる khác 極まりない ở điểm nào?",
      ["極まる là ĐỘNG TỪ thực sự, có thể chia thì (極まった); 極まりない là dạng cố định",
       "Hoàn toàn khác nghĩa nhau", "極まる chỉ dùng cho câu hỏi",
       "極まりない chỉ dùng cho phủ định"], 0,
      "極まる là động từ có thể chia thì (極まった); 極まりない thường giữ nguyên dạng cố định.",
      "Xem giải thích 極まる ở slide 2."),
    q(L, 3, "「あの人の行動は愚か極まった」 — vì sao dùng 極まった (quá khứ)?",
      ["Vì muốn kể lại một trạng thái ĐÃ đạt đến cực điểm trong quá khứ, dùng dạng chia của 極まる",
       "Vì đây là lỗi ngữ pháp", "Vì 極まりない không tồn tại ở thì quá khứ",
       "Không có lý do đặc biệt"], 0,
      "極まった là dạng quá khứ của động từ 極まる, dùng khi muốn kể lại trạng thái đã xảy ra.",
      "Xem so sánh ở slide 3."),
    q(L, 4, "「これは光栄の極みです」 — の極み gắn sau loại từ nào?",
      ["Danh từ trừu tượng (光栄, 疲労, 悲惨さ)", "Tính từ đuôi い", "Tính từ đuôi な",
       "Động từ thể từ điển"], 0,
      "の極み chỉ gắn được sau DANH TỪ TRỪU TƯỢNG, không dùng trực tiếp với tính từ.",
      "Xem cấu trúc の極み ở slide 4."),
    q(L, 5, "「疲労の極みに達しました」 nghĩa là:",
      ["Đã đạt đến tột cùng của sự mệt mỏi", "Chưa từng cảm thấy mệt mỏi",
       "Đã hết mệt mỏi hoàn toàn", "Sẽ cảm thấy mệt mỏi trong tương lai"], 0,
      "の極みに達する nghĩa là 'đạt đến đỉnh điểm/tột cùng của' một trạng thái, ở đây là sự mệt mỏi.",
      "Áp dụng cấu trúc Nの極み cho ngữ cảnh câu."),
    q(L, 6, "Ba cấu trúc 極まりない/極まる/の極み đều mang văn phong nào?",
      ["Rất trang trọng, chủ yếu dùng trong văn viết học thuật, xã luận, diễn văn",
       "Rất thân mật, dùng nhiều trong hội thoại đời thường", "Chỉ dùng trong tin nhắn",
       "Chỉ dùng khi nói chuyện với trẻ em"], 0,
      "Cả ba cấu trúc đều mang văn phong RẤT TRANG TRỌNG, đặc trưng của ngữ pháp N1.",
      "Xem văn hóa sử dụng ở slide 3."),
    q(L, 7, "「この結果は残念極まる」 nghĩa là:",
      ["Kết quả này đáng tiếc đến cực điểm", "Kết quả này rất tốt",
       "Không có kết quả nào cả", "Kết quả này bình thường"], 0,
      "残念極まる là dạng của 極まる gắn sau tính từ 残念 (đáng tiếc), nhấn mức độ CỰC ĐIỂM của sự đáng tiếc.",
      "Áp dụng cấu trúc Aな+極まる."),
    q(L, 8, "Theo hội thoại, thái độ của vận động viên với trọng tài như thế nào?",
      ["Thất lễ đến cực điểm (審判への態度も無礼極まる)", "Rất lịch sự", "Bình thường",
       "Không được đề cập trong hội thoại"], 0,
      "Santos nói 「審判への態度も無礼極まる」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Vận động viên đã đạt đến trạng thái nào theo hội thoại?",
      ["Tột cùng của sự mệt mỏi (疲労の極みに達しました)", "Tràn đầy năng lượng",
       "Không mệt mỏi chút nào", "Đã nghỉ ngơi đầy đủ"], 0,
      "Santos nói 「選手は疲労の極みに達しました」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Santos cảm thấy thế nào khi được xem đại hội này?",
      ["Đó là vinh dự tột cùng (光栄の極みです)", "Không có cảm xúc gì đặc biệt",
       "Cảm thấy chán nản", "Hối tiếc vì đã đến xem"], 0,
      "Santos nói 「こんな大会を見られるのは光栄の極みです」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 1: Cực hạn trạng thái (極まりない & 極まる & の極み)",
    "極まりない gắn sau gốc tính từ đuôi な (bỏ な) diễn tả mức độ VÔ CÙNG/CỰC KỲ một cách chủ "
    "quan, cảm thán mạnh (dạng cố định); 極まる cùng nghĩa nhưng là ĐỘNG TỪ thực sự, có thể chia "
    "thì (極まった); の極み gắn sau DANH TỪ TRỪU TƯỢNG diễn tả ĐỈNH ĐIỂM/TỘT CÙNG của một trạng "
    "thái/cảm xúc — cả ba đều mang văn phong RẤT TRANG TRỌNG, đặc trưng N1.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
