# -*- coding: utf-8 -*-
"""N1 — Bai 14: Xu huong tieu cuc thuong thay — V(tu dien)/Nの + きらいがある
(co xu huong... -- dien ta mot xu huong TIEU CUC/khong tot hay lap lai von co
trong TINH CACH/THOI QUEN cua mot nguoi, hoac trong ban chat su vat/hien
tuong -- mang tinh NHAN XET KHACH QUAN, DIEM TINH, khac han cac cau truc phe
phan gay gat da hoc nhu まじき, ともあろう者が). Slide phu: dieu chinh muc do
bang やや/少し va もっとも, so sanh voi がち (da hoc N2/N3) de lam ro sac thai
trang trong/hoc thuat cua きらいがある.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 14
pool = Pool("n1")

VOCAB = [
    v(1,  "りろん", "理論", "りろん", "riron", "noun", "Lý thuyết", "理論より 実践が 大切です = thực tiễn quan trọng hơn lý thuyết.", L),
    v(2,  "じっせん", "実践", "じっせん", "jissen", "noun", "Thực hành, thực tiễn", "理論を 実践します = đưa lý thuyết vào thực hành.", L),
    v(3,  "がんこ", "頑固", "がんこ", "ganko", "adjective", "Cố chấp, ngoan cố, cứng đầu", "頑固な 性格です = tính cách cố chấp.", L),
    v(4,  "きちょうめん", "几帳面", "きちょうめん", "kichoumen", "adjective", "Tỉ mỉ, cẩn thận (đến mức cứng nhắc)", "几帳面すぎる 性格です = tính cách tỉ mỉ quá mức.", L),
    v(5,  "しんちょう", "慎重", "しんちょう", "shinchou", "adjective", "Thận trọng, cẩn thận", "慎重に 考えます = suy nghĩ một cách thận trọng.", L),
    v(6,  "けってん", "欠点", "けってん", "ketten", "noun", "Khuyết điểm, nhược điểm", "欠点を 直します = sửa khuyết điểm.", L),
    v(7,  "ろんぶん", "論文", "ろんぶん", "ronbun", "noun", "Luận văn, luận án", "論文を 書きます = viết luận văn.", L),
    v(8,  "きょうじゅ", "教授", "きょうじゅ", "kyouju", "noun", "Giáo sư", "教授に 相談します = tham khảo ý kiến giáo sư.", L),
    v(9,  "きゃっかんてき", "客観的", "きゃっかんてき", "kyakkanteki", "adjective", "Khách quan", "客観的に 見ます = nhìn nhận một cách khách quan.", L),
    v(10, "けいこう", "傾向", "けいこう", "keikou", "noun", "Xu hướng, khuynh hướng", "Đã gặp N3 bài 9.", L),
    v(11, "せいかく", "性格", "せいかく", "seikaku", "noun", "Tính cách", "Đã gặp N3 bài 1.", L),
    v(12, "かんぺき", "完璧", "かんぺき", "kanpeki", "adjective", "Hoàn hảo", "Đã gặp N1 bài 3.", L),
    v(13, "どりょく", "努力", "どりょく", "doryoku", "noun", "Nỗ lực", "Đã gặp N3 bài 2.", L),
    v(14, "じじつ", "事実", "じじつ", "jijitsu", "noun", "Sự thật", "Đã gặp N2 bài 10.", L),
    v(15, "しんらい", "信頼", "しんらい", "shinrai", "noun", "Sự tin cậy", "Đã gặp N1 bài 6.", L),
    v(16, "かんがえます", "考えます", "かんがえます", "kangaemasu", "verb", "Suy nghĩ, cân nhắc", "Đã gặp N5 bài 21.", L),
    v(17, "せつめいします", "説明します", "せつめいします", "setsumei shimasu", "verb", "Giải thích", "Đã gặp N4 bài 34.", L),
    v(18, "みとめます", "認めます", "みとめます", "mitomemasu", "verb", "Công nhận", "Đã gặp N2 bài 14.", L),
    v(19, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N3 bài 13.", L),
    v(20, "せきにん", "責任", "せきにん", "sekinin", "noun", "Trách nhiệm", "Đã gặp N1 bài 5.", L),
]

KANJI = [
    k(1, "固", "CỐ", 8, ["コ (ko)"], ["かた(い)"], "Cứng, kiên cố.",
      [("頑固", "がんこ", "Cố chấp"), ("固い", "かたい", "Cứng, kiên định")], L),
    k(2, "践", "TIỄN", 13, ["セン (sen)"], [], "Thực hành, giẫm lên.",
      [("実践", "じっせん", "Thực hành"), ("実践的", "じっせんてき", "Có tính thực tiễn")], L),
    k(3, "慎", "THẬN", 13, ["シン (shin)"], ["つつし(む)"], "Thận trọng, cẩn thận.",
      [("慎重", "しんちょう", "Thận trọng"), ("慎む", "つつしむ", "Giữ gìn, kiêng dè")], L),
    k(4, "点", "ĐIỂM", 9, ["テン (ten)"], [], "Điểm, chấm.",
      [("欠点", "けってん", "Khuyết điểm"), ("点数", "てんすう", "Điểm số")], L),
    k(5, "観", "QUAN", 18, ["カン (kan)"], [], "Quan sát, cái nhìn, quan điểm.",
      [("客観的", "きゃっかんてき", "Khách quan"), ("主観的", "しゅかんてき", "Chủ quan")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Có xu hướng... (nhận xét khách quan, điềm tĩnh): V(từ điển)/Nの + きらいがある",
        "V(thể từ điển)/Nの + きらいがある",
        "きらいがある diễn tả một XU HƯỚNG TIÊU CỰC/không tốt hay LẶP LẠI vốn có trong TÍNH CÁCH/THÓI "
        "QUEN của một người, hoặc trong BẢN CHẤT của sự vật/hiện tượng — mang tính NHẬN XÉT KHÁCH "
        "QUAN, ĐIỀM TĨNH, KHÔNG PHẢI lời chỉ trích gay gắt (khác hẳn まじき, ともあろう者が đã học).",
        [
            ex(L, 1, 1, [t("t-l14s1-1", "かれ", "彼", "かれ"), t("t-l14s1-2", "は"),
                         t("t-l14s1-3", "りろん", "理論", "りろん", key=True), t("t-l14s1-4", "に"),
                         t("t-l14s1-5", "はしる", "走る", "はしる"), t("t-l14s1-6", "きらいがある", key=True)],
               "Anh ta có xu hướng chạy theo lý thuyết suông."),
            ex(L, 1, 2, [t("t-l14s1-7", "この"), t("t-l14s1-8", "ろんぶん", "論文", "ろんぶん", key=True),
                         t("t-l14s1-9", "は"), t("t-l14s1-10", "、"), t("t-l14s1-11", "じっせん", "実践", "じっせん", key=True),
                         t("t-l14s1-12", "を"), t("t-l14s1-13", "けいしする", "軽視する", "けいしする"),
                         t("t-l14s1-14", "きらいがある", key=True)],
               "Luận văn này có xu hướng xem nhẹ tính thực tiễn."),
        ],
        tips="きらいがある chỉ dùng cho xu hướng TIÊU CỰC — không dùng để khen ngợi một xu hướng tích cực (không nói '頑張るきらいがある').",
        culture="きらいがある là văn phong VIẾT/học thuật trang trọng, thường thấy trong bài phê bình sách, nhận xét luận văn, báo cáo đánh giá — hiếm khi dùng trong hội thoại thân mật hằng ngày."),

    slide(L, 2,
        "2. Làm dịu hoặc bổ sung nhận xét: やや/少し + きらいがある、もっとも〜",
        "やや/少し + V/Nの + きらいがある。もっとも、[ý bổ sung làm cân bằng nhận xét]",
        "Thêm やや/少し (hơi, một chút) trước きらいがある giúp làm DỊU mức độ nhận xét, khiến câu văn "
        "KHÁCH QUAN và LỊCH SỰ hơn. Sau khi nêu xu hướng tiêu cực, người nói thường thêm câu bắt đầu "
        "bằng もっとも (tuy vậy, dù vậy) để CÂN BẰNG lại nhận xét, chỉ ra rằng xu hướng đó cũng có mặt tích cực hoặc không hoàn toàn đáng lo.",
        [
            ex(L, 2, 1, [t("t-l14s2-1", "かれ", "彼", "かれ"), t("t-l14s2-2", "は"), t("t-l14s2-3", "やや", key=True),
                         t("t-l14s2-4", "がんこな", "頑固な", "がんこな", key=True), t("t-l14s2-5", "きらいがある", key=True),
                         t("t-l14s2-6", "。"), t("t-l14s2-7", "もっとも", key=True), t("t-l14s2-8", "、"),
                         t("t-l14s2-9", "それ"), t("t-l14s2-10", "は"), t("t-l14s2-11", "かれ", "彼", "かれ"),
                         t("t-l14s2-12", "の"), t("t-l14s2-13", "しんちょうさ", "慎重さ", "しんちょうさ", key=True),
                         t("t-l14s2-14", "の"), t("t-l14s2-15", "あらわれ", "表れ", "あらわれ"), t("t-l14s2-16", "でもある")],
               "Anh ta hơi có xu hướng cố chấp. Tuy vậy, đó cũng là biểu hiện của sự thận trọng nơi anh ấy."),
            ex(L, 2, 2, [t("t-l14s2-17", "この"), t("t-l14s2-18", "がくせい", "学生", "がくせい"), t("t-l14s2-19", "は"),
                         t("t-l14s2-20", "すこし", "少し", "すこし", key=True), t("t-l14s2-21", "きちょうめんすぎる", "几帳面すぎる", "きちょうめんすぎる", key=True),
                         t("t-l14s2-22", "きらいがある", key=True), t("t-l14s2-23", "。"), t("t-l14s2-24", "もっとも", key=True),
                         t("t-l14s2-25", "、"), t("t-l14s2-26", "ろんぶん", "論文", "ろんぶん", key=True), t("t-l14s2-27", "の"),
                         t("t-l14s2-28", "しつ", "質", "しつ"), t("t-l14s2-29", "は"), t("t-l14s2-30", "たかい", "高い", "たかい")],
               "Sinh viên này hơi có xu hướng tỉ mỉ quá mức. Tuy vậy, chất lượng luận văn thì cao."),
        ],
        tips="もっとも trong cách dùng này KHÁC もっとも nghĩa 'nhất' (một cái もっとも khác) — đây là liên từ đặt đầu câu, nghĩa 'tuy vậy, dù vậy', chuyên dùng để bổ sung ý cân bằng sau một nhận xét.",
        culture="Trong thư giới thiệu (推薦状) hay đánh giá nhân sự ở Nhật, mẫu câu 'やや〜きらいがあるが、もっとも〜' rất phổ biến để nhận xét thẳng thắn nhưng vẫn giữ thiện chí."),

    slide(L, 3,
        "3. So sánh きらいがある và がち (đã học ở cấp thấp hơn)",
        "きらいがある: TÍNH CÁCH/BẢN CHẤT cố hữu, văn phong TRANG TRỌNG/học thuật　vs　がち: TẦN SUẤT xảy ra thường xuyên, văn phong THÔNG THƯỜNG",
        "きらいがある nhấn mạnh một xu hướng bắt nguồn từ TÍNH CÁCH/BẢN CHẤT sâu xa, thường dùng trong "
        "văn viết/nhận xét học thuật TRANG TRỌNG (luận văn, phê bình, báo cáo); がち chỉ đơn giản nhấn "
        "mạnh một việc gì đó THƯỜNG XUYÊN xảy ra (tần suất), văn phong THÔNG THƯỜNG hơn, dùng được cả "
        "trong hội thoại hằng ngày. Cùng diễn tả 'hay...', nhưng きらいがある sâu sắc và trang trọng hơn hẳn.",
        [
            ex(L, 3, 1, [t("t-l14s3-1", "かれ", "彼", "かれ"), t("t-l14s3-2", "は"), t("t-l14s3-3", "びょうき", "病気", "びょうき"),
                         t("t-l14s3-4", "がち", key=True), t("t-l14s3-5", "だ")],
               "Anh ấy hay bị ốm."),
            ex(L, 3, 2, [t("t-l14s3-6", "かれ", "彼", "かれ"), t("t-l14s3-7", "は"),
                         t("t-l14s3-8", "がんこすぎる", "頑固すぎる", "がんこすぎる", key=True), t("t-l14s3-9", "きらいがある", key=True)],
               "Anh ta có xu hướng quá cố chấp."),
        ],
        tips="Mẹo: nếu đang nói về TẦN SUẤT một việc lặp lại (ốm, đi trễ, quên) → がち; nếu đang NHẬN XÉT sâu về bản chất/tính cách trong văn viết trang trọng → きらいがある.",
        culture="がち xuất hiện tự nhiên trong hội thoại đời thường ('遅刻しがちです'), còn きらいがある gần như chỉ xuất hiện trong văn viết/phát biểu chính thức — đây là dấu hiệu rõ để phân biệt trình độ N1 với N2/N3."),

    slide(L, 4,
        "4. Kết hợp trong một buổi nhận xét luận văn hoàn chỉnh",
        "この論文は理論に走るきらいがある。もっとも、教授は長所も認める。(nhận xét khách quan + bổ sung công nhận điểm mạnh)",
        "Khi một GIÁO SƯ nhận xét luận văn của học trò, thường dùng きらいがある để chỉ ra xu hướng CẦN "
        "CẢI THIỆN một cách KHÁCH QUAN, ĐIỀM TĨNH (không gay gắt như các cấu trúc phê phán đã học ở "
        "bài 6/13), rồi thêm もっとも để CÔNG NHẬN điểm tích cực — đây chính là phong cách phản biện "
        "học thuật CHUẨN MỰC, vừa thẳng thắn vừa tôn trọng.",
        [
            ex(L, 4, 1, [t("t-l14s4-1", "この"), t("t-l14s4-2", "ろんぶん", "論文", "ろんぶん", key=True),
                         t("t-l14s4-3", "は"), t("t-l14s4-4", "、"), t("t-l14s4-5", "じっせん", "実践", "じっせん", key=True),
                         t("t-l14s4-6", "を"), t("t-l14s4-7", "けいしし", "軽視し", "けいしし"), t("t-l14s4-8", "、"),
                         t("t-l14s4-9", "りろん", "理論", "りろん", key=True), t("t-l14s4-10", "に"),
                         t("t-l14s4-11", "かたよる", "偏る", "かたよる"), t("t-l14s4-12", "きらいがある", key=True)],
               "Luận văn này có xu hướng xem nhẹ thực tiễn và thiên lệch về lý thuyết."),
            ex(L, 4, 2, [t("t-l14s4-13", "もっとも", key=True), t("t-l14s4-14", "、"),
                         t("t-l14s4-15", "しんちょうに", "慎重に", "しんちょうに", key=True), t("t-l14s4-16", "かかれており", "書かれており", "かかれており"),
                         t("t-l14s4-17", "、"), t("t-l14s4-18", "けってん", "欠点", "けってん", key=True), t("t-l14s4-19", "は"),
                         t("t-l14s4-20", "すくない", "少ない", "すくない"), t("t-l14s4-21", "と"),
                         t("t-l14s4-22", "きょうじゅ", "教授", "きょうじゅ", key=True), t("t-l14s4-23", "は"),
                         t("t-l14s4-24", "みとめた", "認めた", "みとめた", key=True)],
               "Tuy vậy, giáo sư đã công nhận rằng luận văn được viết một cách thận trọng và có ít khuyết điểm."),
        ],
        tips="Khung phản biện học thuật chuẩn: nêu xu hướng cần cải thiện (きらいがある, khách quan) → bổ sung cân bằng (もっとも) → công nhận điểm mạnh cụ thể.",
        culture="Đây chính là phong cách 'phê bình mang tính xây dựng' (建設的な批判) rất được coi trọng trong môi trường học thuật Nhật Bản — phê bình thẳng thắn nhưng luôn đi kèm sự công nhận, tôn trọng."),
]

DIALOGUE = [
    line(L, 1, "学生", "Nghiên cứu sinh",
         [t("d14-1", "せんせい", "先生", "せんせい"), t("d14-2", "、"), t("d14-3", "ろんぶん", "論文", "ろんぶん", key=True),
          t("d14-4", "について"), t("d14-5", "ご"), t("d14-6", "いけん", "意見", "いけん"), t("d14-7", "を"),
          t("d14-8", "おきかせください", "お聞かせください", "おきかせください")],
         "Thưa thầy, xin thầy cho em biết ý kiến về luận văn."),
    line(L, 2, "教授", "Giáo sư",
         [t("d14-9", "そうですね"), t("d14-10", "。"), t("d14-11", "この"), t("d14-12", "ろんぶん", "論文", "ろんぶん", key=True),
          t("d14-13", "は"), t("d14-14", "、"), t("d14-15", "りろん", "理論", "りろん", key=True), t("d14-16", "に"),
          t("d14-17", "はしる", "走る", "はしる"), t("d14-18", "きらいがあります", key=True)],
         "Để xem nào. Luận văn này có xu hướng chạy theo lý thuyết suông."),
    line(L, 3, "学生", "Nghiên cứu sinh",
         [t("d14-19", "じっせん", "実践", "じっせん", key=True), t("d14-20", "が"), t("d14-21", "たりない", "足りない", "たりない"),
          t("d14-22", "という"), t("d14-23", "こと"), t("d14-24", "でしょう"), t("d14-25", "か")],
         "Có phải ý thầy là thiếu tính thực tiễn không ạ?"),
    line(L, 4, "教授", "Giáo sư",
         [t("d14-26", "ええ"), t("d14-27", "。"), t("d14-28", "もっとも", key=True), t("d14-29", "、"),
          t("d14-30", "あなた"), t("d14-31", "の"), t("d14-32", "しんちょうな", "慎重な", "しんちょうな", key=True),
          t("d14-33", "しせい", "姿勢", "しせい"), t("d14-34", "は"), t("d14-35", "ちょうしょ", "長所", "ちょうしょ"),
          t("d14-36", "だ"), t("d14-37", "と"), t("d14-38", "おもいます", "思います", "おもいます")],
         "Đúng vậy. Tuy nhiên, thầy nghĩ thái độ thận trọng của em là một điểm mạnh."),
    line(L, 5, "学生", "Nghiên cứu sinh",
         [t("d14-39", "ほかに", "他に", "ほかに"), t("d14-40", "きをつける", "気をつける", "きをつける"),
          t("d14-41", "てん", "点", "てん"), t("d14-42", "は"), t("d14-43", "ありますか")],
         "Còn điểm nào khác cần lưu ý không ạ?"),
    line(L, 6, "教授", "Giáo sư",
         [t("d14-44", "あなた"), t("d14-45", "は"), t("d14-46", "やや", key=True), t("d14-47", "がんこな", "頑固な", "がんこな", key=True),
          t("d14-48", "きらいがあります", key=True), t("d14-49", "。"), t("d14-50", "もっとも", key=True), t("d14-51", "、"),
          t("d14-52", "それ"), t("d14-53", "も"), t("d14-54", "けんきゅうしゃ", "研究者", "けんきゅうしゃ"), t("d14-55", "には"),
          t("d14-56", "ひつような", "必要な", "ひつような"), t("d14-57", "せいかく", "性格", "せいかく", key=True), t("d14-58", "です")],
         "Em hơi có xu hướng cố chấp. Tuy nhiên, đó cũng là tính cách cần thiết đối với một nhà nghiên cứu."),
    line(L, 7, "学生", "Nghiên cứu sinh",
         [t("d14-59", "けってん", "欠点", "けってん", key=True), t("d14-60", "は"), t("d14-61", "どこ"),
          t("d14-62", "です"), t("d14-63", "か")],
         "Khuyết điểm nằm ở đâu ạ?"),
    line(L, 8, "教授", "Giáo sư",
         [t("d14-64", "きちょうめんすぎる", "几帳面すぎる", "きちょうめんすぎる", key=True), t("d14-65", "きらいがあって", key=True),
          t("d14-66", "、"), t("d14-67", "ときどき", "時々", "ときどき"), t("d14-68", "、"),
          t("d14-69", "たいせつな", "大切な", "たいせつな"), t("d14-70", "けつろん", "結論", "けつろん"), t("d14-71", "を"),
          t("d14-72", "みうしないます", "見失います", "みうしないます")],
         "Em có xu hướng tỉ mỉ quá mức, nên đôi khi bị lạc mất kết luận quan trọng."),
    line(L, 9, "学生", "Nghiên cứu sinh",
         [t("d14-73", "わかりました", "分かりました", "わかりました"), t("d14-74", "。"), t("d14-75", "けいこう", "傾向", "けいこう", key=True),
          t("d14-76", "として"), t("d14-77", "なおします", "直します", "なおします")],
         "Em hiểu rồi ạ. Em sẽ sửa cái xu hướng đó."),
    line(L, 10, "教授", "Giáo sư",
         [t("d14-78", "がんばってください", "頑張ってください", "がんばってください"), t("d14-79", "。"), t("d14-80", "もっとも", key=True),
          t("d14-81", "、"), t("d14-82", "この"), t("d14-83", "ろんぶん", "論文", "ろんぶん", key=True), t("d14-84", "の"),
          t("d14-85", "ちょうしょ", "長所", "ちょうしょ"), t("d14-86", "も"), t("d14-87", "じゅうぶんに", "十分に", "じゅうぶんに"),
          t("d14-88", "みとめていますよ", "認めていますよ", "みとめていますよ", key=True)],
         "Cố lên nhé. Tuy nhiên, thầy cũng công nhận đầy đủ những điểm mạnh của luận văn này đấy."),
]

EXERCISES = [
    q(L, 1, "「彼は理論に走るきらいがある」 — きらいがある diễn tả điều gì?",
      ["Một xu hướng TIÊU CỰC/không tốt vốn có trong TÍNH CÁCH/THÓI QUEN, mang tính nhận xét KHÁCH QUAN, ĐIỀM TĨNH",
       "Một lời khen ngợi mạnh mẽ về tính cách", "Một mệnh lệnh bắt buộc phải làm gì đó",
       "Một sự việc chỉ xảy ra một lần duy nhất"], 0,
      "きらいがある diễn tả một xu hướng tiêu cực vốn có trong tính cách/thói quen, mang tính nhận xét khách quan, điềm tĩnh.",
      "Xem cấu trúc きらいがある ở slide 1."),
    q(L, 2, "Vì sao きらいがある được coi là cách NHẬN XÉT NHẸ NHÀNG hơn so với まじき hay ともあろう者が đã học ở các bài trước?",
      ["Vì きらいがある chỉ mang tính NHẬN XÉT KHÁCH QUAN về một xu hướng, không phải lời CHỈ TRÍCH GAY GẮT như hai cấu trúc kia",
       "Vì きらいがある không có nghĩa tiêu cực nào cả", "Vì きらいがある chỉ dùng được trong hội thoại thân mật",
       "Vì きらいがある mạnh mẽ và gay gắt hơn nhiều"], 0,
      "きらいがある là nhận xét khách quan, điềm tĩnh về một xu hướng — nhẹ nhàng hơn nhiều so với các lời chỉ trích mạnh mẽ như まじき, ともあろう者が.",
      "Xem giải thích ở slide 1."),
    q(L, 3, "Sự khác biệt giữa きらいがある và がち (đã học ở cấp thấp hơn) là gì?",
      ["きらいがある nhấn TÍNH CÁCH/BẢN CHẤT sâu xa, văn phong trang trọng/học thuật; がち nhấn TẦN SUẤT xảy ra, văn phong thông thường",
       "Hoàn toàn giống nhau về ý nghĩa và cách dùng", "がち trang trọng hơn hẳn きらいがある",
       "きらいがある chỉ dùng cho sự vật, không dùng cho người"], 0,
      "きらいがある là nhận xét sâu về bản chất/tính cách, văn phong học thuật trang trọng; がち chỉ đơn thuần nhấn tần suất, văn phong thông thường.",
      "Xem bảng so sánh ở slide 3."),
    q(L, 4, "「この論文は、実践を軽視するきらいがある」 nghĩa là:",
      ["Luận văn này có xu hướng xem nhẹ tính thực tiễn", "Luận văn này hoàn toàn không có lý thuyết",
       "Luận văn này đã bị từ chối", "Luận văn này rất coi trọng thực tiễn"], 0,
      "きらいがある ở đây chỉ ra xu hướng của luận văn là xem nhẹ tính thực tiễn.",
      "Áp dụng cấu trúc きらいがある cho ngữ cảnh học thuật."),
    q(L, 5, "「彼はやや頑固なきらいがある。もっとも、それは彼の慎重さの表れでもある」 — vai trò của もっとも ở đây là gì?",
      ["Bổ sung một ý CÂN BẰNG lại nhận xét vừa nêu, chỉ ra mặt tích cực của xu hướng đó",
       "Phủ định hoàn toàn nhận xét vừa nêu", "Nhấn mạnh nhận xét vừa nêu là hoàn toàn đúng, không thể bàn cãi",
       "Đặt ra một câu hỏi mới"], 0,
      "もっとも ở đây đóng vai trò bổ sung, cân bằng lại nhận xét tiêu cực vừa nêu bằng một điểm tích cực.",
      "Xem cấu trúc もっとも ở slide 2."),
    q(L, 6, "Tại sao trong nhận xét học thuật (như phản biện luận văn), giáo sư thường dùng きらいがある rồi thêm もっとも?",
      ["Để chỉ ra xu hướng cần cải thiện một cách khách quan, điềm tĩnh, rồi công nhận điểm tích cực — đúng phong cách phản biện học thuật chuẩn mực",
       "Để phủ nhận hoàn toàn công sức của học trò", "Vì quy tắc bắt buộc phải dùng hai cấu trúc này cùng nhau",
       "Không có lý do đặc biệt nào"], 0,
      "Kết hợp きらいがある và もっとも tạo nên phong cách phản biện vừa thẳng thắn vừa tôn trọng, chuẩn mực trong học thuật.",
      "Xem cấu trúc buổi nhận xét hoàn chỉnh ở slide 4."),
    q(L, 7, "Câu nào sau đây phù hợp hơn khi MIÊU TẢ TẦN SUẤT một người thường xuyên bị cảm cúm (không phải bàn về tính cách)?",
      ["彼は風邪をひきがちだ (dùng がち)", "彼は風邪をひくきらいがある (dùng きらいがある)",
       "Cả hai đều sai ngữ pháp", "Không thể diễn tả ý này bằng tiếng Nhật"], 0,
      "がち phù hợp hơn khi chỉ đơn thuần miêu tả tần suất xảy ra thường xuyên, không cần hàm ý về bản chất tính cách.",
      "Xem so sánh きらいがある và がち ở slide 3."),
    q(L, 8, "Theo hội thoại, giáo sư nhận xét gì đầu tiên về luận văn?",
      ["Có xu hướng chạy theo lý thuyết suông (理論に走るきらいがあります)", "Hoàn toàn xuất sắc, không có gì cần sửa",
       "Không đọc được luận văn", "Luận văn quá ngắn"], 0,
      "Giáo sư nói 「この論文は、理論に走るきらいがあります」.",
      "Xem câu thoại thứ 2."),
    q(L, 9, "Theo hội thoại, khuyết điểm khác của học sinh là gì?",
      ["Có xu hướng tỉ mỉ quá mức, đôi khi làm lạc mất kết luận quan trọng (几帳面すぎるきらいがあって、大切な結論を見失います)",
       "Quá lười biếng, không chịu nghiên cứu", "Không có khuyết điểm nào khác", "Thường xuyên nghỉ học"], 0,
      "Giáo sư nói 「几帳面すぎるきらいがあって、時々、大切な結論を見失います」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Theo hội thoại, giáo sư kết thúc buổi nhận xét bằng thái độ như thế nào?",
      ["Động viên học sinh cố gắng, đồng thời công nhận đầy đủ điểm mạnh của luận văn (もっとも、この論文の長所も十分に認めていますよ)",
       "Từ chối nhận xét thêm bất cứ điều gì", "Yêu cầu viết lại hoàn toàn luận văn", "Không hài lòng chút nào với luận văn"], 0,
      "Giáo sư nói 「頑張ってください。もっとも、この論文の長所も十分に認めていますよ」.",
      "Xem câu thoại thứ 10."),
]

LESSON = lesson(
    L,
    "Bài 14: Xu hướng tiêu cực thường thấy (きらいがある)",
    "きらいがある diễn tả một XU HƯỚNG TIÊU CỰC/không tốt hay LẶP LẠI vốn có trong TÍNH CÁCH/THÓI "
    "QUEN của một người, hoặc trong BẢN CHẤT của sự vật/hiện tượng — mang tính NHẬN XÉT KHÁCH QUAN, "
    "ĐIỀM TĨNH, khác hẳn các cấu trúc phê phán gay gắt đã học (まじき, ともあろう者が). Có thể làm dịu "
    "bằng やや/少し, và thường đi kèm もっとも để bổ sung ý cân bằng; so với がち (đã học ở cấp thấp) "
    "vốn chỉ nhấn TẦN SUẤT, きらいがある trang trọng và sâu sắc hơn hẳn, thường dùng trong nhận xét "
    "học thuật. Hội thoại: một giáo sư nhận xét luận văn của học trò, thể hiện đúng phong cách phản biện học thuật vừa thẳng thắn vừa tôn trọng.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
