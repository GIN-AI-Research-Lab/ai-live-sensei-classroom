# -*- coding: utf-8 -*-
"""N2 — Bai 10: Can cu に基づいて (khach quan/phap ly, khong doi noi dung) va をもとに (lam co so
sang tao, co the bien doi).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n2.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n2_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 10
pool = Pool("n2")

VOCAB = [
    v(1,  "とうけい", "統計", "とうけい", "toukei", "noun", "Thống kê", "統計に 基づいて = dựa trên số liệu thống kê.", L),
    v(2,  "きじゅん", "基準", "きじゅん", "kijun", "noun", "Tiêu chuẩn, căn cứ", "基準を つくります = tạo ra tiêu chuẩn.", L),
    v(3,  "しりょう", "資料", "しりょう", "shiryou", "noun", "Tài liệu", "資料を 見ます = xem tài liệu.", L),
    v(4,  "ほうりつ", "法律", "ほうりつ", "houritsu", "noun", "Pháp luật", "法律に 基づいて = dựa trên pháp luật.", L),
    v(5,  "じじつ", "事実", "じじつ", "jijitsu", "noun", "Sự thật", "事実を もとに = lấy sự thật làm cơ sở.", L),
    v(6,  "はんだんします", "判断します", "はんだんします", "handan shimasu", "verb", "Phán đoán, phán xét", "法律に 基づいて 判断します = phán xét dựa trên pháp luật.", L),
    v(7,  "けいけん", "経験", "けいけん", "keiken", "noun", "Kinh nghiệm", "Đã gặp N4 bài 26.", L),
    v(8,  "しょうせつ", "小説", "しょうせつ", "shousetsu", "noun", "Tiểu thuyết", "Đã gặp N4 bài 26.", L),
    v(9,  "じょうほう", "情報", "じょうほう", "jouhou", "noun", "Thông tin", "Đã gặp N3 bài 7.", L),
    v(10, "えいが", "映画", "えいが", "eiga", "noun", "Phim", "Đã gặp N4 bài 26.", L),
    v(11, "けいかく", "計画", "けいかく", "keikaku", "noun", "Kế hoạch", "Đã gặp N4 bài 26.", L),
    v(12, "たてます", "立てます", "たてます", "tatemasu", "verb", "Lập, dựng", "Đã gặp N4 bài 26.", L),
    v(13, "つくります", "作ります", "つくります", "tsukurimasu", "verb", "Làm, tạo ra", "Đã gặp N4 bài 26.", L),
    v(14, "かきます", "書きます", "かきます", "kakimasu", "verb", "Viết", "Đã gặp N4 bài 26.", L),
    v(15, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N4 bài 26.", L),
    v(16, "せいじ", "政治", "せいじ", "seiji", "noun", "Chính trị", "Đã gặp N4 bài 40.", L),
    v(17, "けいざい", "経済", "けいざい", "keizai", "noun", "Kinh tế", "Đã gặp N3 bài 14.", L),
    v(18, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N5 bài 22.", L),
    v(19, "かんがえます", "考えます", "かんがえます", "kangaemasu", "verb", "Suy nghĩ", "Đã gặp N4 bài 26.", L),
    v(20, "せんせい", "先生", "せんせい", "sensei", "noun", "Giáo viên", "Đã gặp N5 bài 1.", L),
]

KANJI = [
    k(1, "法", "PHÁP", 8, ["ホウ (hou)"], [], "Pháp luật, phương pháp.",
      [("法律", "ほうりつ", "Pháp luật"), ("方法", "ほうほう", "Phương pháp")], L),
    k(2, "律", "LUẬT", 9, ["リツ (ritsu)"], [], "Luật lệ, kỷ luật.",
      [("法律", "ほうりつ", "Pháp luật"), ("規律", "きりつ", "Kỷ luật")], L),
    k(3, "基", "CƠ", 11, ["キ (ki)"], ["もと(づく)"], "Nền tảng, cơ sở.",
      [("基づいて", "もとづいて", "Dựa trên"), ("基準", "きじゅん", "Tiêu chuẩn")], L),
    k(4, "準", "CHUẨN", 13, ["ジュン (jun)"], [], "Chuẩn mực, dựa theo.",
      [("基準", "きじゅん", "Tiêu chuẩn"), ("準備", "じゅんび", "Chuẩn bị")], L),
    k(5, "統", "THỐNG", 12, ["トウ (tou)"], [], "Thống kê, hệ thống.",
      [("統計", "とうけい", "Thống kê"), ("伝統", "でんとう", "Truyền thống")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Dựa trên căn cứ chính thức (khách quan): N + に基づいて",
        "N(căn cứ chính thức: luật, số liệu, quy tắc) + に基づいて、[hành động/quyết định]",
        "に基づいて diễn tả 'DỰA TRÊN' một CĂN CỨ CHÍNH THỨC/KHÁCH QUAN (luật pháp, số liệu thống "
        "kê, quy tắc) — trang trọng, nhấn TÍNH CHÍNH XÁC, KHÔNG được tự ý thay đổi nội dung của căn cứ đó.",
        [
            ex(L, 1, 1, [t("t-l10s1-1", "ほうりつ", "法律", "ほうりつ", key=True), t("t-l10s1-2", "に", key=True),
                         t("t-l10s1-3", "もとづいて", "基づいて", "もとづいて", key=True), t("t-l10s1-4", "、"),
                         t("t-l10s1-5", "はんだん", "判断", "はんだん", key=True), t("t-l10s1-6", "します")],
               "Phán xét dựa trên pháp luật."),
            ex(L, 1, 2, [t("t-l10s1-7", "とうけい", "統計", "とうけい", key=True), t("t-l10s1-8", "に", key=True),
                         t("t-l10s1-9", "もとづいて", "基づいて", "もとづいて", key=True), t("t-l10s1-10", "、"),
                         t("t-l10s1-11", "けいかく", "計画", "けいかく", key=True), t("t-l10s1-12", "を"),
                         t("t-l10s1-13", "たてます", "立てます", "たてます")],
               "Lập kế hoạch dựa trên số liệu thống kê."),
        ],
        tips="に基づいて thường dùng trong văn bản pháp lý, báo cáo chính thức — hàm ý phải TUÂN THỦ ĐÚNG nội dung của căn cứ, không sáng tạo thêm.",
        culture="Văn bản pháp luật Nhật hay ghi: '本法律に基づいて、規則を定める' (dựa trên luật này, quy định được ban hành)."),

    slide(L, 2,
        "2. Lấy làm cơ sở sáng tạo (có thể biến đổi): N + をもとに",
        "N(nguồn tham khảo: sự thật, kinh nghiệm, thông tin) + をもとに、[tạo ra điều mới]",
        "をもとに diễn tả việc LẤY một THÔNG TIN/Ý TƯỞNG/KINH NGHIỆM làm CƠ SỞ để TẠO RA điều gì "
        "đó MỚI — phạm vi rộng hơn に基づいて, cho phép THAY ĐỔI, BIẾN ĐỔI, sáng tạo dựa trên nguồn đó.",
        [
            ex(L, 2, 1, [t("t-l10s2-1", "じじつ", "事実", "じじつ", key=True), t("t-l10s2-2", "を"),
                         t("t-l10s2-3", "もとに", key=True), t("t-l10s2-4", "、"), t("t-l10s2-5", "しょうせつ", "小説", "しょうせつ", key=True),
                         t("t-l10s2-6", "を"), t("t-l10s2-7", "かきました", "書きました", "かきました")],
               "Dựa trên sự thật, đã viết tiểu thuyết."),
            ex(L, 2, 2, [t("t-l10s2-8", "けいけん", "経験", "けいけん", key=True), t("t-l10s2-9", "を"),
                         t("t-l10s2-10", "もとに", key=True), t("t-l10s2-11", "、"), t("t-l10s2-12", "ほん", "本", "ほん"),
                         t("t-l10s2-13", "を"), t("t-l10s2-14", "つくりました", "作りました", "つくりました")],
               "Dựa trên kinh nghiệm, đã làm sách."),
        ],
        tips="をもとに thường dùng cho tác phẩm SÁNG TẠO (tiểu thuyết, phim) 'dựa trên câu chuyện có thật' — nội dung có thể được HƯ CẤU thêm.",
        culture="Áp phích phim Nhật hay ghi: '実話をもとにした映画' (bộ phim dựa trên câu chuyện có thật) — hàm ý có thể đã được biên kịch sáng tạo thêm."),

    slide(L, 3,
        "3. So sánh に基づいて và をもとに",
        "に基づいて: căn cứ CHÍNH THỨC, KHÔNG đổi nội dung　vs　をもとに: nguồn THAM KHẢO, CÓ THỂ biến đổi/sáng tạo",
        "に基づいて yêu cầu TUÂN THỦ CHÍNH XÁC nội dung của căn cứ (luật, số liệu) — sai lệch là "
        "vi phạm; をもとに chỉ LẤY CẢM HỨNG/THÔNG TIN làm điểm khởi đầu, kết quả cuối có thể khác "
        "nhiều so với nguồn gốc (như tiểu thuyết hư cấu từ sự thật).",
        [
            ex(L, 3, 1, [t("t-l10s3-1", "きじゅん", "基準", "きじゅん", key=True), t("t-l10s3-2", "に", key=True),
                         t("t-l10s3-3", "もとづいて", "基づいて", "もとづいて", key=True), t("t-l10s3-4", "、"),
                         t("t-l10s3-5", "せいじ", "政治", "せいじ", key=True), t("t-l10s3-6", "の"),
                         t("t-l10s3-7", "もんだい", "問題", "もんだい", key=True), t("t-l10s3-8", "を"),
                         t("t-l10s3-9", "はんだん", "判断", "はんだん", key=True), t("t-l10s3-10", "します")],
               "Phán xét vấn đề chính trị dựa trên tiêu chuẩn (chính xác, không đổi)."),
            ex(L, 3, 2, [t("t-l10s3-11", "しりょう", "資料", "しりょう", key=True), t("t-l10s3-12", "を"),
                         t("t-l10s3-13", "もとに", key=True), t("t-l10s3-14", "、"), t("t-l10s3-15", "えいが", "映画", "えいが", key=True),
                         t("t-l10s3-16", "を"), t("t-l10s3-17", "つくりました", "作りました", "つくりました")],
               "Dựa trên tài liệu, đã làm phim (có thể sáng tạo thêm)."),
        ],
        tips="Mẹo: nếu KHÔNG ĐƯỢC sai lệch với căn cứ (luật, quy tắc, số liệu) → に基づいて; nếu là NGUỒN CẢM HỨNG cho sáng tạo → をもとに.",
        culture="Cả hai đều là ngữ pháp N2 trọng điểm — nhầm lẫn giữa chúng trong văn bản pháp lý có thể gây hiểu lầm nghiêm trọng về tính ràng buộc."),

    slide(L, 4,
        "4. Dạng bổ nghĩa danh từ: に基づく N / をもとにした N",
        "N1に基づくN2　　N1をもとにしたN2",
        "Khi cần bổ nghĩa TRỰC TIẾP cho một danh từ, に基づいて đổi thành に基づく; をもとに đổi "
        "thành をもとにした — cả hai đứng ngay trước danh từ mà chúng bổ nghĩa.",
        [
            ex(L, 4, 1, [t("t-l10s4-1", "じょうほう", "情報", "じょうほう", key=True), t("t-l10s4-2", "に"),
                         t("t-l10s4-3", "もとづく", "基づく", "もとづく", key=True), t("t-l10s4-4", "はんだん", "判断", "はんだん", key=True)],
               "Sự phán đoán dựa trên thông tin."),
            ex(L, 4, 2, [t("t-l10s4-5", "じじつ", "事実", "じじつ", key=True), t("t-l10s4-6", "を"),
                         t("t-l10s4-7", "もとに", key=True), t("t-l10s4-8", "した"), t("t-l10s4-9", "しょうせつ", "小説", "しょうせつ", key=True)],
               "Cuốn tiểu thuyết dựa trên sự thật."),
        ],
        tips="に基づく (không có した) khác をもとにした (luôn cần した) — đây là điểm dễ nhầm lẫn về mặt hình thái học.",
        culture="Tựa đề sách, phim ở Nhật thường ghi rõ: '実話に基づく物語' (câu chuyện dựa trên chuyện có thật, sát thực tế) khác với '実話をもとにした物語' (dựa trên chuyện có thật nhưng có hư cấu)."),
]

DIALOGUE = [
    line(L, 1, "田中", "Sinh viên luật",
         [t("d10-1", "この"), t("d10-2", "もんだい", "問題", "もんだい", key=True), t("d10-3", "は"),
          t("d10-4", "どう"), t("d10-5", "はんだん", "判断", "はんだん", key=True), t("d10-6", "しますか")],
         "Vấn đề này sẽ phán xét như thế nào?"),
    line(L, 2, "サントス", "Sinh viên luật",
         [t("d10-7", "ほうりつ", "法律", "ほうりつ", key=True), t("d10-8", "に", key=True),
          t("d10-9", "もとづいて", "基づいて", "もとづいて", key=True), t("d10-10", "、"), t("d10-11", "はんだん", "判断", "はんだん", key=True),
          t("d10-12", "します")],
         "Sẽ phán xét dựa trên pháp luật."),
    line(L, 3, "田中", "Sinh viên luật",
         [t("d10-13", "とうけい", "統計", "とうけい", key=True), t("d10-14", "の"), t("d10-15", "しりょう", "資料", "しりょう", key=True),
          t("d10-16", "も"), t("d10-17", "つかいます", "使います", "つかいます"), t("d10-18", "か")],
         "Có dùng cả tài liệu thống kê không?"),
    line(L, 4, "サントス", "Sinh viên luật",
         [t("d10-19", "はい"), t("d10-20", "。"), t("d10-21", "とうけい", "統計", "とうけい", key=True), t("d10-22", "に", key=True),
          t("d10-23", "もとづいて", "基づいて", "もとづいて", key=True), t("d10-24", "、"), t("d10-25", "けいかく", "計画", "けいかく", key=True),
          t("d10-26", "を"), t("d10-27", "たてます", "立てます", "たてます")],
         "Vâng. Sẽ lập kế hoạch dựa trên số liệu thống kê."),
    line(L, 5, "田中", "Sinh viên luật",
         [t("d10-28", "きじゅん", "基準", "きじゅん", key=True), t("d10-29", "は"), t("d10-30", "なん", "何", "なん"),
          t("d10-31", "です", "です", "です"), t("d10-32", "か")],
         "Tiêu chuẩn là gì?"),
    line(L, 6, "サントス", "Sinh viên luật",
         [t("d10-33", "けいざい", "経済", "けいざい", key=True), t("d10-34", "の"), t("d10-35", "きじゅん", "基準", "きじゅん", key=True),
          t("d10-36", "です")],
         "Là tiêu chuẩn kinh tế."),
    line(L, 7, "田中", "Sinh viên luật",
         [t("d10-37", "せんせい", "先生", "せんせい", key=True), t("d10-38", "は"), t("d10-39", "じじつ", "事実", "じじつ", key=True),
          t("d10-40", "を"), t("d10-41", "もとに", key=True), t("d10-42", "、"), t("d10-43", "しょうせつ", "小説", "しょうせつ", key=True),
          t("d10-44", "を"), t("d10-45", "かきました", "書きました", "かきました")],
         "Thầy giáo đã lấy sự thật làm cơ sở, viết tiểu thuyết."),
    line(L, 8, "サントス", "Sinh viên luật",
         [t("d10-46", "その"), t("d10-47", "しょうせつ", "小説", "しょうせつ", key=True), t("d10-48", "は"),
          t("d10-49", "えいが", "映画", "えいが", key=True), t("d10-50", "に"), t("d10-51", "なりました", "成りました", "なりました"),
          t("d10-52", "か")],
         "Tiểu thuyết đó có được chuyển thành phim không?"),
    line(L, 9, "田中", "Sinh viên luật",
         [t("d10-53", "はい"), t("d10-54", "。"), t("d10-55", "けいけん", "経験", "けいけん", key=True), t("d10-56", "を"),
          t("d10-57", "もとに", key=True), t("d10-58", "した"), t("d10-59", "えいが", "映画", "えいが", key=True),
          t("d10-60", "です")],
         "Vâng. Là bộ phim dựa trên kinh nghiệm."),
    line(L, 10, "サントス", "Sinh viên luật",
         [t("d10-61", "おもしろい"), t("d10-62", "です", "です", "です"), t("d10-63", "ね"), t("d10-64", "。"),
          t("d10-65", "かんがえて", "考えて", "かんがえて"), t("d10-66", "みます")],
         "Thú vị nhỉ. Tôi sẽ thử suy nghĩ về nó."),
]

EXERCISES = [
    q(L, 1, "「法律に基づいて、判断します」 — に基づいて diễn tả điều gì?",
      ["Dựa trên một căn cứ chính thức/khách quan, phải tuân thủ chính xác",
       "Lấy làm cơ sở để sáng tạo, có thể biến đổi", "Sự khẳng định chắc chắn",
       "Sự phủ định hoàn toàn"], 0,
      "に基づいて diễn tả việc dựa trên một CĂN CỨ CHÍNH THỨC (luật) và phải TUÂN THỦ CHÍNH XÁC nội dung đó.",
      "Xem cấu trúc に基づいて ở slide 1."),
    q(L, 2, "「事実をもとに、小説を書きました」 — をもとに khác に基づいて ở điểm nào?",
      ["をもとに cho phép BIẾN ĐỔI/sáng tạo dựa trên nguồn tham khảo, không cần chính xác tuyệt đối",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "をもとに chỉ dùng cho câu hỏi", "に基づいて chỉ dùng cho phủ định"], 0,
      "をもとに chỉ lấy nguồn làm CẢM HỨNG/điểm khởi đầu, kết quả có thể khác nhiều so với nguồn gốc (hư cấu).",
      "Xem giải thích をもとに ở slide 2."),
    q(L, 3, "Có thể thay đổi nội dung của căn cứ khi dùng に基づいて không?",
      ["Không, に基づいて yêu cầu TUÂN THỦ CHÍNH XÁC nội dung căn cứ",
       "Có, thay đổi thoải mái", "Chỉ được thay đổi một phần nhỏ",
       "Không có quy tắc nào về việc này"], 0,
      "に基づいて mang tính PHÁP LÝ/KHÁCH QUAN, không được tự ý thay đổi nội dung của căn cứ (luật, số liệu).",
      "Xem lưu ý ngữ pháp ở slide 1."),
    q(L, 4, "Dạng bổ nghĩa danh từ của に基づいて là gì?",
      ["に基づく (không có した)", "に基づいたした", "に基づいてな", "Không có dạng bổ nghĩa danh từ"], 0,
      "に基づいて khi bổ nghĩa danh từ đổi thành に基づく: 情報に基づく判断 (sự phán đoán dựa trên thông tin).",
      "Xem quy tắc ở slide 4."),
    q(L, 5, "Dạng bổ nghĩa danh từ của をもとに là gì?",
      ["をもとにした (luôn cần した)", "をもとにする", "をもとにて", "Không có dạng bổ nghĩa danh từ"], 0,
      "をもとに khi bổ nghĩa danh từ cần thêm した: 事実をもとにした小説 (tiểu thuyết dựa trên sự thật).",
      "Xem quy tắc ở slide 4."),
    q(L, 6, "「実話をもとにした映画」 nghĩa là:",
      ["Bộ phim dựa trên câu chuyện có thật (có thể đã được hư cấu thêm)",
       "Bộ phim hoàn toàn là sự thật, không có hư cấu", "Bộ phim không liên quan gì đến sự thật",
       "Bộ phim đã bị cấm chiếu"], 0,
      "をもとにした ngụ ý phim LẤY CẢM HỨNG từ câu chuyện thật nhưng có thể đã được biên kịch sáng tạo thêm.",
      "Xem văn hóa sử dụng ở slide 2."),
    q(L, 7, "「統計に基づいて、計画を立てます」 nghĩa là:",
      ["Lập kế hoạch dựa trên số liệu thống kê (chính xác, khách quan)",
       "Lập kế hoạch mà không cần căn cứ gì", "Số liệu thống kê không quan trọng",
       "Kế hoạch đã bị hủy bỏ"], 0,
      "に基づいて ở đây nhấn việc kế hoạch phải PHÙ HỢP CHÍNH XÁC với số liệu thống kê đã có.",
      "Áp dụng cấu trúc Nに基づいて cho ngữ cảnh câu."),
    q(L, 8, "Theo hội thoại, Santos sẽ phán xét vấn đề dựa trên gì?",
      ["Pháp luật (法律に基づいて、判断します)", "Cảm tính cá nhân", "Ý kiến của bạn bè",
       "Không có căn cứ nào"], 0,
      "Santos nói 「法律に基づいて、判断します」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Thầy giáo đã viết tiểu thuyết dựa trên điều gì?",
      ["Sự thật (事実をもとに、小説を書きました)", "Trí tưởng tượng hoàn toàn",
       "Không viết tiểu thuyết nào", "Dựa trên luật pháp"], 0,
      "田中 nói 「先生は事実をもとに、小説を書きました」.",
      "Xem câu thoại thứ 7."),
    q(L, 10, "Bộ phim được nhắc đến trong hội thoại dựa trên điều gì?",
      ["Kinh nghiệm (経験をもとにした映画です)", "Số liệu thống kê", "Luật pháp",
       "Không được chuyển thể thành phim"], 0,
      "田中 nói 「経験をもとにした映画です」.",
      "Xem câu thoại thứ 9."),
]

LESSON = lesson(
    L,
    "Bài 10: Căn cứ & Dựa trên (に基づいて & をもとに)",
    "に基づいて diễn tả việc dựa trên một CĂN CỨ CHÍNH THỨC/KHÁCH QUAN (luật pháp, số liệu, quy "
    "tắc) và phải TUÂN THỦ CHÍNH XÁC nội dung đó (dạng bổ nghĩa: に基づく); をもとに diễn tả việc "
    "lấy một THÔNG TIN/KINH NGHIỆM làm CƠ SỞ để TẠO RA điều mới, CÓ THỂ biến đổi/sáng tạo (dạng "
    "bổ nghĩa: をもとにした) — thường dùng cho tiểu thuyết, phim dựa trên chuyện có thật.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
