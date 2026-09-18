# -*- coding: utf-8 -*-
"""N4 — Bai 47: Nghe noi (truyen van) 〜そうです, duong nhu 〜ようです.

QUAN TRONG: そうです o bai nay la NGHE NOI (truyen van, ghep sau THE
THONG THUONG DAY DU), khac han V/A-そう o bai 43 (du doan tu dau hieu,
ghep sau GOC hoac tinh tu bo duoi). Cung mot chu そう, hai cau truc
hoan toan khac nhau ve cach chia va y nghia.
Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n4.csv.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n4_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 47
pool = Pool("n4")

VOCAB = [
    v(1,  "ひっこします", "引っ越します", "ひっこします", "hikkoshimasu", "verb", "Chuyển nhà, dọn nhà", "来月 引っ越すそうです = nghe nói tháng sau (người đó) sẽ chuyển nhà.", L),
    v(2,  "けっこんします", "結婚します", "けっこんします", "kekkon shimasu", "verb", "Kết hôn", "Đã gặp N5 bài 14. 結婚するそうです = nghe nói sẽ kết hôn.", L),
    v(3,  "やめます", "止めます", "やめます", "yamemasu", "verb", "Nghỉ (việc), từ bỏ", "Đã gặp bài 29.", L),
    v(4,  "びょうきです", "病気です", "びょうきです", "byouki desu", "phrase", "Bị bệnh (thể thông thường: 病気だ)", "病気だ そうです = nghe nói bị bệnh.", L),
    v(5,  "ふります", "降ります", "ふります", "furimasu", "verb", "Rơi, đổ xuống (mưa, tuyết)", "Đã gặp bài 43. 雨が 降るそうです = nghe nói (dự báo) trời sẽ mưa.", L),
    v(6,  "つかれます", "疲れます", "つかれます", "tsukaremasu", "verb", "Mệt, mệt mỏi", "Đã gặp bài 32. 疲れているようです = có vẻ đang mệt (quan sát được).", L),
    v(7,  "げんきです", "元気です", "げんきです", "genki desu", "phrase", "Khỏe mạnh (thể thông thường: 元気だ)", "元気な ようです = có vẻ khỏe mạnh.", L),
    v(8,  "てんきよほう", "天気予報", "てんきよほう", "tenki yohou", "noun", "Dự báo thời tiết", "天気予報に よると、雨だ そうです = theo dự báo, nghe nói sẽ mưa.", L),
    v(9,  "うわさ", "噂", "うわさ", "uwasa", "noun", "Tin đồn", "噂に よると = theo tin đồn thì.", L),
    v(10, "にほんご", "日本語", "にほんご", "nihongo", "noun", "Tiếng Nhật", "日本語が 上手な ようです = có vẻ giỏi tiếng Nhật.", L),
    v(11, "せんせい", "先生", "せんせい", "sensei", "noun", "Thầy/cô giáo", "先生の 話に よると = theo lời thầy giáo thì.", L),
    v(12, "しんぶん", "新聞", "しんぶん", "shinbun", "noun", "Báo, tờ báo", "新聞に よると = theo báo thì.", L),
    v(13, "ニュース", "", "", "nyuusu", "noun", "Tin tức", "ニュースで 聞きました = tôi đã nghe được từ tin tức.", L),
    v(14, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N5 bài 3.", L),
    v(15, "びょういん", "病院", "びょういん", "byouin", "noun", "Bệnh viện", "Đã gặp N5 bài 3.", L),
    v(16, "たいふう", "台風", "たいふう", "taifuu", "noun", "Bão (bão nhiệt đới)", "Đã gặp N5 bài 21.", L),
    v(17, "らいしゅう", "来週", "らいしゅう", "raishuu", "noun", "Tuần sau", "Đã gặp N5 bài 4.", L),
    v(18, "らいげつ", "来月", "らいげつ", "raigetsu", "noun", "Tháng sau", "Đã gặp N5 bài 5.", L),
    v(19, "しあわせ", "幸せ", "しあわせ", "shiawase", "adjective", "Hạnh phúc", "幸せそう(な様子) = trông có vẻ hạnh phúc.", L),
    v(20, "ほんとう", "本当", "ほんとう", "hontou", "noun", "Sự thật, thật", "Đã gặp N5 bài 22.", L),
]

KANJI = [
    k(1, "越", "VIỆT", 12, ["エツ (etsu)"], ["こ(す)"], "Vượt qua (chỉ ghép trong 引っ越す).",
      [("引っ越します", "ひっこします", "Chuyển nhà"), ("引っ越し", "ひっこし", "Việc chuyển nhà")], L),
    k(2, "予", "DỰ", 4, ["ヨ (yo)"], [], "Dự đoán, trước.",
      [("予報", "よほう", "Dự báo"), ("予約", "よやく", "Đặt trước"), ("予定", "よてい", "Dự định")], L),
    k(3, "報", "BÁO", 12, ["ホウ (hou)"], [], "Báo cáo, thông báo.",
      [("予報", "よほう", "Dự báo"), ("報告", "ほうこく", "Báo cáo")], L),
    k(4, "噂", "TÔN", 15, ["ソン (son)"], ["うわさ"], "Tin đồn.",
      [("噂", "うわさ", "Tin đồn")], L),
    k(5, "幸", "HẠNH", 8, ["コウ (kou)"], ["しあわ(せ)", "さいわ(い)"], "May mắn, hạnh phúc.",
      [("幸せ", "しあわせ", "Hạnh phúc"), ("幸運", "こううん", "May mắn")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Nghe nói (truyền văn): [Thể thông thường ĐẦY ĐỦ] + そうです",
        "V/A-い (giữ nguyên) 　A-な/N + だ + そうです   (ghép sau THỂ THÔNG THƯỜNG, KHÁC HẲN V-そう bài 43)",
        "そうです ở đây (聞いたことを伝える — truyền đạt điều đã nghe) ghép sau THỂ THÔNG THƯỜNG ĐẦY "
        "ĐỦ (giữ nguyên だ với danh từ/tính từ な) — khác V-そう bài 43 phải bỏ đuôi trước khi ghép.",
        [
            ex(L, 1, 1, [t("t-l47s1-1", "やまださん", "山田さん", "やまださん"), t("t-l47s1-2", "は"),
                         t("t-l47s1-3", "らいげつ", "来月", "らいげつ"), t("t-l47s1-4", "、"),
                         t("t-l47s1-5", "けっこんする", "結婚する", "けっこんする"), t("t-l47s1-6", "そうです", key=True)],
               "Nghe nói anh Yamada tháng sau sẽ kết hôn."),
            ex(L, 1, 2, [t("t-l47s1-7", "やまださん", "山田さん", "やまださん"), t("t-l47s1-8", "は"),
                         t("t-l47s1-9", "びょうき", "病気", "びょうき"), t("t-l47s1-10", "だ", key=True),
                         t("t-l47s1-11", "そうです", key=True)],
               "Nghe nói anh Yamada bị bệnh. (danh từ GIỮ NGUYÊN だ, khác V-そう bài 43 phải bỏ)"),
        ],
        tips="So sánh trực tiếp: 病気そうです (bài 43: TRÔNG có vẻ bệnh, nhìn thấy) khác 病気だそうです (bài 47: NGHE NÓI bị bệnh, qua lời kể) — chỉ khác một chữ だ nhưng nghĩa khác hẳn.",
        culture="天気予報によると、明日は雨だそうです là cấu trúc chuẩn khi thuật lại thông tin từ báo đài, không phải tự mình quan sát."),

    slide(L, 2,
        "2. Nguồn tin: [Nguồn]によると、〜そうです",
        "[Nguồn tin] + に + よると、[nội dung] + そうです",
        "によると (theo như...) thường đứng ĐẦU câu để chỉ rõ NGUỒN GỐC thông tin trước khi thuật "
        "lại bằng そうです — làm câu nghe khách quan, có căn cứ rõ ràng hơn.",
        [
            ex(L, 2, 1, [t("t-l47s2-1", "てんきよほう", "天気予報", "てんきよほう", key=True), t("t-l47s2-2", "に"),
                         t("t-l47s2-3", "よると", key=True), t("t-l47s2-4", "、"), t("t-l47s2-5", "らいしゅう", "来週", "らいしゅう"),
                         t("t-l47s2-6", "、"), t("t-l47s2-7", "たいふう", "台風", "たいふう"), t("t-l47s2-8", "が"),
                         t("t-l47s2-9", "くる", "来る", "くる"), t("t-l47s2-10", "そうです", key=True)],
               "Theo dự báo thời tiết, nghe nói tuần sau sẽ có bão."),
            ex(L, 2, 2, [t("t-l47s2-11", "うわさ", "噂", "うわさ", key=True), t("t-l47s2-12", "に"),
                         t("t-l47s2-13", "よると", key=True), t("t-l47s2-14", "、"), t("t-l47s2-15", "かいしゃ", "会社", "かいしゃ"),
                         t("t-l47s2-16", "を"), t("t-l47s2-17", "やめる", "止める", "やめる"), t("t-l47s2-18", "そうです", key=True)],
               "Theo tin đồn, nghe nói (người đó) sẽ nghỉ việc."),
        ],
        tips="によると luôn kết hợp với そうです (nghe nói) chứ không phải でしょう (bài 32) — vì nguồn tin đã XÁC ĐỊNH, không phải suy đoán của người nói.",
        culture="ニュースによると／新聞によると là cách mở đầu tin tức chuẩn mực, thể hiện thông tin có nguồn xác thực, không phải lời đồn cá nhân."),

    slide(L, 3,
        "3. Dường như (dựa trên quan sát/suy luận): [Thể thông thường] + ようです",
        "V/A-い (giữ nguyên) 　A-な (bỏ だ) + な 　N + の + ようです",
        "ようです diễn tả NHẬN ĐỊNH của chính người nói, dựa trên những gì họ TỰ QUAN SÁT/CẢM NHẬN "
        "— khác そうです (nghe nói, thông tin từ NGƯỜI KHÁC).",
        [
            ex(L, 3, 1, [t("t-l47s3-1", "やまださん", "山田さん", "やまださん"), t("t-l47s3-2", "は"),
                         t("t-l47s3-3", "つかれて", "疲れて", "つかれて"), t("t-l47s3-4", "いる", key=True),
                         t("t-l47s3-5", "ようです", key=True)],
               "Anh Yamada có vẻ đang mệt. (tôi tự quan sát: mặt anh ấy mệt mỏi)"),
            ex(L, 3, 2, [t("t-l47s3-6", "あの"), t("t-l47s3-7", "ひと", "人", "ひと"), t("t-l47s3-8", "は"),
                         t("t-l47s3-9", "にほんご", "日本語", "にほんご"), t("t-l47s3-10", "が"),
                         t("t-l47s3-11", "じょうずな", "上手な", "じょうずな", key=True), t("t-l47s3-12", "ようです", key=True)],
               "Người kia có vẻ giỏi tiếng Nhật. (tính từ な bỏ だ, thêm な trước ようです)"),
        ],
        tips="ようです cần bằng chứng QUAN SÁT ĐƯỢC (nét mặt, hành vi) để đưa ra nhận định — không phải nghe ai kể lại như そうです.",
        culture="疲れているようですね là câu quan tâm tế nhị phổ biến ở Nhật — nhận xét dựa trên quan sát chứ không khẳng định chắc chắn, giữ ý tứ."),

    slide(L, 4,
        "4. So sánh そうです (nghe nói) và ようです (dường như)",
        "そうです: THÔNG TIN từ người khác/nguồn tin　vs　ようです: NHẬN ĐỊNH của chính mình qua quan sát",
        "Đây là hai NGUỒN THÔNG TIN khác nhau hoàn toàn — chọn sai sẽ khiến câu nói SAI SỰ THẬT về "
        "việc thông tin đến từ đâu, rất quan trọng khi tường thuật chính xác.",
        [
            ex(L, 4, 1, [t("t-l47s4-1", "やまださん", "山田さん", "やまださん"), t("t-l47s4-2", "は"),
                         t("t-l47s4-3", "しあわせ", "幸せ", "しあわせ", key=True), t("t-l47s4-4", "だ", key=True),
                         t("t-l47s4-5", "そうです", key=True)],
               "Nghe nói anh Yamada hạnh phúc. (ai đó KỂ cho tôi nghe)"),
            ex(L, 4, 2, [t("t-l47s4-6", "やまださん", "山田さん", "やまださん"), t("t-l47s4-7", "は"),
                         t("t-l47s4-8", "しあわせな", "幸せな", "しあわせな", key=True), t("t-l47s4-9", "ようです", key=True)],
               "Anh Yamada có vẻ hạnh phúc. (tôi TỰ NHÌN THẤY nụ cười, thái độ của anh ấy)"),
        ],
        tips="Kiểm tra nhanh: nếu thông tin đến từ LỜI KỂ/BÁO ĐÀI → そうです; nếu là NHẬN XÉT CỦA CHÍNH BẠN qua quan sát trực tiếp → ようです.",
        culture="Phóng viên, người viết báo cáo khách quan luôn phân biệt rõ ràng hai nguồn này — nhầm lẫn giữa 'nghe nói' và 'tôi thấy' bị coi là thiếu chuyên nghiệp."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d-l47-1", "やまださん"), t("d-l47-2", "、"), t("d-l47-3", "らいげつ", "来月", "らいげつ", key=True),
          t("d-l47-4", "けっこんする", "結婚する", "けっこんする"), t("d-l47-5", "そうです", key=True), t("d-l47-6", "ね")],
         "Nghe nói anh Yamada tháng sau kết hôn nhỉ."),
    line(L, 2, "山田", "Nhân viên công ty",
         [t("d-l47-7", "え"), t("d-l47-8", "！"), t("d-l47-9", "だれ", "誰", "だれ"), t("d-l47-10", "から"),
          t("d-l47-11", "きいた", "聞いた", "きいた"), t("d-l47-12", "んです", key=True), t("d-l47-13", "か")],
         "Ơ! Chị nghe từ ai vậy?"),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d-l47-14", "うわさ", "噂", "うわさ", key=True), t("d-l47-15", "に"), t("d-l47-16", "よると", key=True),
          t("d-l47-17", "、"), t("d-l47-18", "そう", key=True), t("d-l47-19", "です"), t("d-l47-20", "。"),
          t("d-l47-21", "ちがいます", "違います", "ちがいます"), t("d-l47-22", "か")],
         "Theo tin đồn thì vậy đấy. Không đúng à?"),
    line(L, 4, "山田", "Nhân viên công ty",
         [t("d-l47-23", "ちがいます", "違います", "ちがいます"), t("d-l47-24", "。"), t("d-l47-25", "まだ"),
          t("d-l47-26", "けっこん", "結婚", "けっこん"), t("d-l47-27", "しません"), t("d-l47-28", "。"),
          t("d-l47-29", "でも"), t("d-l47-30", "、"), t("d-l47-31", "らいねん", "来年", "らいねん"),
          t("d-l47-32", "けっこん", "結婚", "けっこん"), t("d-l47-33", "する", key=True), t("d-l47-34", "つもり", "つもり", "つもり"),
          t("d-l47-35", "です")],
         "Không đúng đâu. Tôi vẫn chưa kết hôn. Nhưng sang năm tôi định kết hôn."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d-l47-36", "そうですか"), t("d-l47-37", "。"), t("d-l47-38", "しあわせ", "幸せ", "しあわせ", key=True),
          t("d-l47-39", "そう", key=True), t("d-l47-40", "です", "です", "です"), t("d-l47-41", "ね")],
         "Vậy à. Trông anh có vẻ hạnh phúc lắm nhỉ."),
    line(L, 6, "山田", "Nhân viên công ty",
         [t("d-l47-42", "ありがとう"), t("d-l47-43", "ございます"), t("d-l47-44", "。"), t("d-l47-45", "ところで"),
          t("d-l47-46", "、"), t("d-l47-47", "てんきよほう", "天気予報", "てんきよほう", key=True), t("d-l47-48", "に"),
          t("d-l47-49", "よると", key=True), t("d-l47-50", "、"), t("d-l47-51", "らいしゅう", "来週", "らいしゅう"),
          t("d-l47-52", "たいふう", "台風", "たいふう", key=True), t("d-l47-53", "が"), t("d-l47-54", "くる", "来る", "くる"),
          t("d-l47-55", "そうです", key=True), t("d-l47-56", "ね")],
         "Cảm ơn chị. À mà, theo dự báo thời tiết, nghe nói tuần sau có bão nhỉ."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d-l47-57", "はい"), t("d-l47-58", "、"), t("d-l47-59", "きをつけましょう", "気を付けましょう", "きをつけましょう")],
         "Vâng, chúng ta cẩn thận nhé."),
    line(L, 8, "山田", "Nhân viên công ty",
         [t("d-l47-60", "あ"), t("d-l47-61", "、"), t("d-l47-62", "サントスさん", "サントスさん", "サントスさん"),
          t("d-l47-63", "は"), t("d-l47-64", "つかれて", "疲れて", "つかれて"), t("d-l47-65", "いる", key=True),
          t("d-l47-66", "ようです", key=True), t("d-l47-67", "ね")],
         "À, anh Santos trông có vẻ đang mệt nhỉ."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d-l47-68", "ほんとう", "本当", "ほんとう", key=True), t("d-l47-69", "です"), t("d-l47-70", "ね")],
         "Đúng thật nhỉ."),
    line(L, 10, "山田", "Nhân viên công ty",
         [t("d-l47-71", "だいじょうぶ", "大丈夫", "だいじょうぶ"), t("d-l47-72", "か"), t("d-l47-73", "、"),
          t("d-l47-74", "きいて", "聞いて", "きいて"), t("d-l47-75", "みましょう")],
         "Thử hỏi xem anh ấy có ổn không nhé."),
]

EXERCISES = [
    q(L, 1, "「山田さんは結婚するそうです」 — そうです ở đây có nghĩa:",
      ["Nghe nói/truyền đạt lại thông tin từ nguồn khác", "Trông có vẻ (dựa trên quan sát)",
       "Chắc chắn 100%", "Phủ định việc kết hôn"], 0,
      "そうです ở bài này (nghe nói) khác V-そう bài 43 (trông có vẻ, dựa trên dấu hiệu quan sát).",
      "Đây là cách dùng そうです thứ hai, phân biệt với bài 43."),
    q(L, 2, "「病気だそうです」 khác 「病気そうです」 (bài 43) ở chỗ:",
      ["病気だそうです = nghe nói bị bệnh (qua lời kể); 病気そうです = trông có vẻ bệnh (quan sát trực tiếp)",
       "Hoàn toàn giống nhau", "病気だそうです sai ngữ pháp",
       "病気そうです chỉ dùng cho câu hỏi"], 0,
      "Chỉ khác một chữ だ nhưng ý nghĩa hoàn toàn khác: nguồn thông tin từ ĐÂU (nghe kể hay tự quan sát).",
      "Đây là điểm nhầm lẫn quan trọng nhất của bài — so sánh kỹ ở slide 1."),
    q(L, 3, "「天気予報によると、雨だそうです」 — によると có vai trò gì?",
      ["Chỉ rõ NGUỒN GỐC thông tin trước khi thuật lại bằng そうです",
       "Phủ định thông tin theo sau", "Biến câu thành câu hỏi",
       "Không có vai trò gì đặc biệt"], 0,
      "によると (theo như...) đứng đầu câu, chỉ rõ nguồn tin, thường kết hợp với そうです để tăng tính khách quan.",
      "Xem cấu trúc ở slide 2."),
    q(L, 4, "「疲れているようです」 — ようです dựa trên điều gì?",
      ["Sự QUAN SÁT/CẢM NHẬN trực tiếp của người nói", "Lời kể từ người khác",
       "Tin tức trên báo đài", "Dự báo thời tiết"], 0,
      "ようです diễn tả nhận định của CHÍNH NGƯỜI NÓI dựa trên những gì họ tự thấy/cảm nhận — khác そうです (nghe từ người khác).",
      "Xem định nghĩa ようです ở slide 3."),
    q(L, 5, "「日本語が上手なようです」 — vì sao có な trước ようです?",
      ["上手 là tính từ な, cần bỏ だ và thêm な trước ようです",
       "な là lỗi thừa", "ようです luôn cần な bất kể từ loại nào",
       "上手 phải chia thành 上手だ trước"], 0,
      "Tính từ な khi ghép với ようです cần bỏ だ, thêm な: 上手だ → 上手な + ようです.",
      "Áp dụng quy tắc chia tính từ な trước ようです."),
    q(L, 6, "そうです (nghe nói) và ようです (dường như) khác nhau CHỦ YẾU ở:",
      ["Nguồn thông tin: そうです từ NGƯỜI KHÁC kể lại; ようです từ QUAN SÁT của chính mình",
       "Hoàn toàn giống nhau", "そうです chỉ dùng cho câu hỏi",
       "ようです chỉ dùng cho phủ định"], 0,
      "Đây là điểm khác biệt cốt lõi của cả bài: nguồn gốc thông tin đến từ đâu.",
      "Xem so sánh trực tiếp ở slide 4."),
    q(L, 7, "「山田さんは幸せだそうです」 và 「山田さんは幸せなようです」 khác nhau ở:",
      ["Câu đầu là NGHE NÓI (ai đó kể); câu sau là NHẬN ĐỊNH của người nói (tự quan sát nụ cười, thái độ)",
       "Hoàn toàn giống nhau về nguồn thông tin", "Câu đầu sai ngữ pháp",
       "Câu sau chỉ dùng cho phủ định"], 0,
      "Đây là ví dụ so sánh trực tiếp ở slide 4 — cùng nội dung nhưng nguồn thông tin khác nhau.",
      "Xem ví dụ song song ở slide 4."),
    q(L, 8, "噂によると thường đi kèm với cấu trúc nào?",
      ["そうです (nghe nói)", "ようです (dường như)", "でしょう (bài 32)", "かもしれません (bài 32)"], 0,
      "噂によると (theo tin đồn) chỉ rõ nguồn tin, nên kết hợp tự nhiên với そうです để thuật lại thông tin đã nghe.",
      "Xem ví dụ ở slide 2."),
    q(L, 9, "Trong hội thoại, Tanaka nghe tin Yamada kết hôn từ đâu?",
      ["Tin đồn (噂)", "Chính Yamada nói", "Báo chí", "Không có nguồn cụ thể"], 0,
      "Tanaka nói 「噂によると、そうです」.",
      "Xem câu thoại thứ 3."),
    q(L, 10, "Cuối hội thoại, Yamada nhận xét gì về Santos?",
      ["Trông có vẻ đang mệt", "Trông có vẻ vui vẻ", "Sắp nghỉ việc", "Không nhận xét gì"], 0,
      "Yamada nói 「サントスさんは疲れているようですね」.",
      "Xem câu thoại thứ 8."),
]

LESSON = lesson(
    L,
    "Bài 47: Nghe nói (〜そうです) & Dường như (〜ようです)",
    "Thuật lại thông tin NGHE ĐƯỢC từ nguồn khác bằng そうです (ghép sau thể thông thường ĐẦY ĐỦ, "
    "giữ だ với danh từ/tính từ な — khác hẳn V-そう bài 43 phải bỏ đuôi), thường kèm [nguồn]に"
    "よると; và diễn tả NHẬN ĐỊNH của chính người nói qua quan sát trực tiếp bằng ようです (tính "
    "từ な bỏ だ thêm な) — phân biệt rạch ròi hai nguồn thông tin: nghe kể vs tự quan sát.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
