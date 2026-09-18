# -*- coding: utf-8 -*-
"""N2 — Bai 9: Bat chap gian kho をものともせずに (ca ngoi kien cuong) va をよそに (phe phan pho lo).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n2.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n2_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 9
pool = Pool("n2")

VOCAB = [
    v(1,  "くしん", "苦心", "くしん", "kushin", "noun", "Khổ tâm, nỗ lực vất vả", "苦心して 完成します = khổ công hoàn thành.", L),
    v(2,  "くじょう", "苦情", "くじょう", "kujou", "noun", "Lời phàn nàn, khiếu nại", "苦情を 言います = phàn nàn.", L),
    v(3,  "すすめます", "進めます", "すすめます", "susumemasu", "verb", "Tiến hành, xúc tiến", "計画を 進めます = tiến hành kế hoạch.", L),
    v(4,  "まわり", "周り", "まわり", "mawari", "noun", "Xung quanh, mọi người xung quanh", "周りの 意見 = ý kiến của mọi người xung quanh.", L),
    v(5,  "ひはん", "批判", "ひはん", "hihan", "noun", "Phê bình, chỉ trích", "批判を 受けます = bị phê bình.", L),
    v(6,  "がんばります", "頑張ります", "がんばります", "ganbarimasu", "verb", "Cố gắng, nỗ lực", "Đã gặp N4 bài 32.", L),
    v(7,  "つづけます", "続けます", "つづけます", "tsuzukemasu", "verb", "Tiếp tục", "Đã gặp N4 bài 28.", L),
    v(8,  "びょうき", "病気", "びょうき", "byouki", "noun", "Bệnh, ốm", "Đã gặp N4 bài 26.", L),
    v(9,  "はんたい", "反対", "はんたい", "hantai", "noun", "Phản đối", "Đã gặp N3 bài 20.", L),
    v(10, "しっぱいします", "失敗します", "しっぱいします", "shippai shimasu", "verb", "Thất bại", "Đã gặp N4 bài 43.", L),
    v(11, "れんしゅうします", "練習します", "れんしゅうします", "renshuu shimasu", "verb", "Luyện tập", "Đã gặp N4 bài 26.", L),
    v(12, "けいかく", "計画", "けいかく", "keikaku", "noun", "Kế hoạch", "Đã gặp N4 bài 26.", L),
    v(13, "せいこうします", "成功します", "せいこうします", "seikou shimasu", "verb", "Thành công", "Đã gặp N3 bài 8.", L),
    v(14, "しんぱい", "心配", "しんぱい", "shinpai", "noun", "Sự lo lắng", "Đã gặp N4 bài 26.", L),
    v(15, "じこ", "事故", "じこ", "jiko", "noun", "Tai nạn", "Đã gặp N4 bài 34.", L),
    v(16, "かぞく", "家族", "かぞく", "kazoku", "noun", "Gia đình", "Đã gặp N5 bài 1.", L),
    v(17, "せんしゅ", "選手", "せんしゅ", "senshu", "noun", "Vận động viên", "Đã gặp N4 bài 26.", L),
    v(18, "たいかい", "大会", "たいかい", "taikai", "noun", "Đại hội", "Đã gặp N3 bài 7.", L),
    v(19, "ゆうしょうします", "優勝します", "ゆうしょうします", "yuushou shimasu", "verb", "Vô địch", "Đã gặp N3 bài 8.", L),
    v(20, "どりょく", "努力", "どりょく", "doryoku", "noun", "Nỗ lực", "Đã gặp N3 bài 8.", L),
]

KANJI = [
    k(1, "苦", "KHỔ", 8, ["ク (ku)"], ["くる(しい)", "にが(い)"], "Khổ sở, đắng.",
      [("苦心", "くしん", "Khổ tâm, nỗ lực vất vả"), ("苦情", "くじょう", "Lời phàn nàn")], L),
    k(2, "情", "TÌNH", 11, ["ジョウ (jou)"], [], "Tình cảm, tình huống.",
      [("苦情", "くじょう", "Lời phàn nàn"), ("事情", "じじょう", "Hoàn cảnh")], L),
    k(3, "批", "PHÊ", 7, ["ヒ (hi)"], [], "Phê bình, phê phán.",
      [("批判", "ひはん", "Phê bình, chỉ trích"), ("批評", "ひひょう", "Bình luận")], L),
    k(4, "判", "PHÁN", 7, ["ハン (han)"], [], "Phán đoán, phán xét.",
      [("批判", "ひはん", "Phê bình"), ("判断", "はんだん", "Phán đoán")], L),
    k(5, "周", "CHU", 8, ["シュウ (shuu)"], ["まわ(り)"], "Xung quanh, chu vi.",
      [("周り", "まわり", "Xung quanh"), ("周辺", "しゅうへん", "Khu vực lân cận")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Bất chấp khó khăn (ca ngợi kiên cường): N + をものともせずに",
        "N(khó khăn/trở ngại) + をものともせずに、[hành động vượt qua]",
        "をものともせずに diễn tả 'BẤT CHẤP' một khó khăn/trở ngại, KHÔNG coi đó là vấn đề gì để "
        "tiếp tục hành động — mang tính CA NGỢI sự DŨNG CẢM/KIÊN CƯỜNG của chủ thể khi vượt qua nghịch cảnh.",
        [
            ex(L, 1, 1, [t("t-l9s1-1", "びょうき", "病気", "びょうき", key=True), t("t-l9s1-2", "を"),
                         t("t-l9s1-3", "ものともせずに", key=True), t("t-l9s1-4", "、"), t("t-l9s1-5", "れんしゅう", "練習", "れんしゅう", key=True),
                         t("t-l9s1-6", "を"), t("t-l9s1-7", "つづけました", "続けました", "つづけました")],
               "Bất chấp bệnh tật, đã tiếp tục luyện tập."),
            ex(L, 1, 2, [t("t-l9s1-8", "しっぱい", "失敗", "しっぱい", key=True), t("t-l9s1-9", "を"),
                         t("t-l9s1-10", "ものともせずに", key=True), t("t-l9s1-11", "、"), t("t-l9s1-12", "どりょく", "努力", "どりょく", key=True),
                         t("t-l9s1-13", "しました")],
               "Bất chấp thất bại, đã nỗ lực."),
        ],
        tips="をものともせずに luôn mang sắc thái TÍCH CỰC — dùng để KHEN NGỢI ai đó đã vượt qua khó khăn khách quan (bệnh tật, thất bại, chấn thương).",
        culture="Bản tin thể thao Nhật hay dùng: '選手はけがをものともせずに、大会で優勝しました' (vận động viên bất chấp chấn thương, đã vô địch tại đại hội)."),

    slide(L, 2,
        "2. Bất chấp, mặc kệ (phê phán phớt lờ): N + をよそに",
        "N(sự lo lắng/cảnh báo/phản đối của người khác) + をよそに、[hành động phớt lờ]",
        "をよそに diễn tả việc PHỚT LỜ/MẶC KỆ một điều đáng lẽ phải quan tâm (thường là sự lo "
        "lắng, cảnh báo, phản đối của NGƯỜI KHÁC) — mang sắc thái PHÊ PHÁN nhẹ về hành động thiếu quan tâm đó.",
        [
            ex(L, 2, 1, [t("t-l9s2-1", "かぞく", "家族", "かぞく", key=True), t("t-l9s2-2", "の"),
                         t("t-l9s2-3", "しんぱい", "心配", "しんぱい", key=True), t("t-l9s2-4", "を"),
                         t("t-l9s2-5", "よそに", key=True), t("t-l9s2-6", "、"), t("t-l9s2-7", "きけんな", "危険な", "きけんな"),
                         t("t-l9s2-8", "しごと", "仕事", "しごと"), t("t-l9s2-9", "を"), t("t-l9s2-10", "つづけました", "続けました", "つづけました")],
               "Mặc kệ sự lo lắng của gia đình, đã tiếp tục công việc nguy hiểm."),
            ex(L, 2, 2, [t("t-l9s2-11", "まわり", "周り", "まわり", key=True), t("t-l9s2-12", "の"),
                         t("t-l9s2-13", "はんたい", "反対", "はんたい", key=True), t("t-l9s2-14", "を"),
                         t("t-l9s2-15", "よそに", key=True), t("t-l9s2-16", "、"), t("t-l9s2-17", "けいかく", "計画", "けいかく", key=True),
                         t("t-l9s2-18", "を"), t("t-l9s2-19", "すすめました", "進めました", "すすめました", key=True)],
               "Mặc kệ sự phản đối xung quanh, đã tiến hành kế hoạch."),
        ],
        tips="をよそに luôn mang sắc thái TIÊU CỰC nhẹ — ngụ ý chủ thể đã KHÔNG QUAN TÂM đến ý kiến/cảm xúc của người khác một cách đáng ra nên quan tâm.",
        culture="Bản tin xã hội Nhật hay phê bình: '住民の苦情をよそに、工事が続けられている' (mặc kệ những lời phàn nàn của cư dân, công trình vẫn được tiếp tục)."),

    slide(L, 3,
        "3. So sánh をものともせずに (ca ngợi) và をよそに (phê phán)",
        "をものともせずに: TÍCH CỰC, ca ngợi vượt khó KHÁCH QUAN　vs　をよそに: TIÊU CỰC, phê phán phớt lờ Ý KIẾN người khác",
        "をものともせずに luôn CA NGỢI việc vượt qua một trở ngại KHÁCH QUAN (bệnh tật, chấn "
        "thương, thất bại) để đạt thành tựu; をよそに luôn PHÊ PHÁN việc phớt lờ Ý KIẾN/CẢM XÚC "
        "của người khác (lo lắng, phản đối, phàn nàn) một cách vô trách nhiệm.",
        [
            ex(L, 3, 1, [t("t-l9s3-1", "せんしゅ", "選手", "せんしゅ", key=True), t("t-l9s3-2", "は"),
                         t("t-l9s3-3", "けが", "怪我", "けが"), t("t-l9s3-4", "を"), t("t-l9s3-5", "ものともせずに", key=True),
                         t("t-l9s3-6", "、"), t("t-l9s3-7", "たいかい", "大会", "たいかい", key=True), t("t-l9s3-8", "で"),
                         t("t-l9s3-9", "ゆうしょう", "優勝", "ゆうしょう", key=True), t("t-l9s3-10", "しました")],
               "Vận động viên bất chấp chấn thương, đã vô địch tại đại hội. (ca ngợi)"),
            ex(L, 3, 2, [t("t-l9s3-11", "くじょう", "苦情", "くじょう", key=True), t("t-l9s3-12", "を"),
                         t("t-l9s3-13", "よそに", key=True), t("t-l9s3-14", "、"), t("t-l9s3-15", "かいしゃ", "会社", "かいしゃ"),
                         t("t-l9s3-16", "は"), t("t-l9s3-17", "けいかく", "計画", "けいかく", key=True), t("t-l9s3-18", "を"),
                         t("t-l9s3-19", "すすめました", "進めました", "すすめました", key=True)],
               "Mặc kệ những lời phàn nàn, công ty đã tiến hành kế hoạch. (phê phán)"),
        ],
        tips="Mẹo: nếu câu CA NGỢI sự kiên cường → をものともせずに; nếu câu ngụ ý CHỈ TRÍCH sự vô tâm → をよそに.",
        culture="Đây là điểm ngữ pháp N2 dễ nhầm nhất vì cả hai đều dịch là 'bất chấp' — cần dựa vào SẮC THÁI CẢM XÚC (khen/chê) để chọn đúng."),

    slide(L, 4,
        "4. Kết hợp trong tường thuật thể thao và tin tức",
        "[Khó khăn khách quan]をものともせずに、[thành tựu]。　　[Ý kiến người khác]をよそに、[hành động đơn phương]。",
        "Hai cấu trúc thường xuất hiện SONG SONG trong bài báo: をものともせずに để CA NGỢI nhân "
        "vật chính, をよそに để PHÊ PHÁN một bên khác (tổ chức, đối thủ) đã phớt lờ dư luận.",
        [
            ex(L, 4, 1, [t("t-l9s4-1", "くしん", "苦心", "くしん", key=True), t("t-l9s4-2", "を"),
                         t("t-l9s4-3", "ものともせずに", key=True), t("t-l9s4-4", "、"), t("t-l9s4-5", "せんしゅ", "選手", "せんしゅ", key=True),
                         t("t-l9s4-6", "は"), t("t-l9s4-7", "がんばりました", "頑張りました", "がんばりました")],
               "Bất chấp khổ tâm nỗ lực, vận động viên đã cố gắng."),
            ex(L, 4, 2, [t("t-l9s4-8", "ひはん", "批判", "ひはん", key=True), t("t-l9s4-9", "を"),
                         t("t-l9s4-10", "よそに", key=True), t("t-l9s4-11", "、"), t("t-l9s4-12", "けいかく", "計画", "けいかく", key=True),
                         t("t-l9s4-13", "は"), t("t-l9s4-14", "すすめられました", "進められました", "すすめられました")],
               "Mặc kệ những lời chỉ trích, kế hoạch đã được tiến hành."),
        ],
        tips="Trong một bài báo, việc dùng をものともせずに cho phe A và をよそに cho phe B thể hiện rõ LẬP TRƯỜNG của người viết (ủng hộ A, phê bình B).",
        culture="Đây là kỹ thuật viết báo tinh tế của phóng viên Nhật để thể hiện quan điểm mà không cần nói thẳng."),
]

DIALOGUE = [
    line(L, 1, "田中", "Bình luận viên thể thao",
         [t("d9-1", "あの"), t("d9-2", "せんしゅ", "選手", "せんしゅ", key=True), t("d9-3", "は"),
          t("d9-4", "びょうき", "病気", "びょうき", key=True), t("d9-5", "を"), t("d9-6", "ものともせずに", key=True),
          t("d9-7", "、"), t("d9-8", "れんしゅう", "練習", "れんしゅう", key=True), t("d9-9", "を"),
          t("d9-10", "つづけました", "続けました", "つづけました")],
         "Vận động viên đó bất chấp bệnh tật, đã tiếp tục luyện tập."),
    line(L, 2, "サントス", "Bình luận viên thể thao",
         [t("d9-11", "すごい"), t("d9-12", "です", "です", "です"), t("d9-13", "ね"), t("d9-14", "。"),
          t("d9-15", "たいかい", "大会", "たいかい", key=True), t("d9-16", "で"), t("d9-17", "ゆうしょう", "優勝", "ゆうしょう", key=True),
          t("d9-18", "しました", "為ました", "しました"), t("d9-19", "か")],
         "Tuyệt vời quá nhỉ. Có vô địch tại đại hội không?"),
    line(L, 3, "田中", "Bình luận viên thể thao",
         [t("d9-20", "はい"), t("d9-21", "。"), t("d9-22", "どりょく", "努力", "どりょく", key=True), t("d9-23", "が"),
          t("d9-24", "せいこう", "成功", "せいこう", key=True), t("d9-25", "しました")],
         "Vâng. Sự nỗ lực đã thành công."),
    line(L, 4, "サントス", "Bình luận viên thể thao",
         [t("d9-26", "かぞく", "家族", "かぞく", key=True), t("d9-27", "は"), t("d9-28", "しんぱい", "心配", "しんぱい", key=True),
          t("d9-29", "しました", "為ました", "しました"), t("d9-30", "か")],
         "Gia đình có lo lắng không?"),
    line(L, 5, "田中", "Bình luận viên thể thao",
         [t("d9-31", "はい"), t("d9-32", "。"), t("d9-33", "でも"), t("d9-34", "かぞく", "家族", "かぞく", key=True),
          t("d9-35", "の"), t("d9-36", "しんぱい", "心配", "しんぱい", key=True), t("d9-37", "を"),
          t("d9-38", "よそに", key=True), t("d9-39", "、"), t("d9-40", "がんばりました", "頑張りました", "がんばりました")],
         "Vâng. Nhưng mặc kệ sự lo lắng của gia đình, anh ấy đã cố gắng."),
    line(L, 6, "サントス", "Bình luận viên thể thao",
         [t("d9-41", "べつの"), t("d9-42", "はなし", "話", "はなし"), t("d9-43", "です", "です", "です"), t("d9-44", "が"),
          t("d9-45", "、"), t("d9-46", "かいしゃ", "会社", "かいしゃ"), t("d9-47", "の"), t("d9-48", "けいかく", "計画", "けいかく", key=True),
          t("d9-49", "は"), t("d9-50", "どうですか")],
         "Chuyện khác, kế hoạch của công ty thì sao?"),
    line(L, 7, "田中", "Bình luận viên thể thao",
         [t("d9-51", "まわり", "周り", "まわり", key=True), t("d9-52", "の"), t("d9-53", "はんたい", "反対", "はんたい", key=True),
          t("d9-54", "を"), t("d9-55", "よそに", key=True), t("d9-56", "、"), t("d9-57", "けいかく", "計画", "けいかく", key=True),
          t("d9-58", "を"), t("d9-59", "すすめました", "進めました", "すすめました", key=True)],
         "Mặc kệ sự phản đối xung quanh, đã tiến hành kế hoạch."),
    line(L, 8, "サントス", "Bình luận viên thể thao",
         [t("d9-60", "くじょう", "苦情", "くじょう", key=True), t("d9-61", "は"), t("d9-62", "ありました", "有りました", "ありました"),
          t("d9-63", "か")],
         "Có lời phàn nàn nào không?"),
    line(L, 9, "田中", "Bình luận viên thể thao",
         [t("d9-64", "はい"), t("d9-65", "。"), t("d9-66", "でも"), t("d9-67", "ひはん", "批判", "ひはん", key=True),
          t("d9-68", "を"), t("d9-69", "よそに", key=True), t("d9-70", "、"), t("d9-71", "けいかく", "計画", "けいかく", key=True),
          t("d9-72", "は"), t("d9-73", "つづいて", "続いて", "つづいて"), t("d9-74", "います", "居ます", "います")],
         "Vâng. Nhưng mặc kệ những lời chỉ trích, kế hoạch vẫn đang tiếp diễn."),
    line(L, 10, "サントス", "Bình luận viên thể thao",
         [t("d9-75", "くしん", "苦心", "くしん", key=True), t("d9-76", "が"), t("d9-77", "おおかった", "多かった", "おおかった"),
          t("d9-78", "です", "です", "です"), t("d9-79", "ね")],
         "Đã có nhiều khổ tâm nỗ lực nhỉ."),
]

EXERCISES = [
    q(L, 1, "「病気をものともせずに、練習を続けました」 — をものともせずに diễn tả điều gì?",
      ["Bất chấp một khó khăn/trở ngại khách quan để tiếp tục hành động, mang tính CA NGỢI",
       "Phớt lờ ý kiến của người khác một cách vô trách nhiệm", "Sự từ chối lịch sự",
       "Sự khẳng định chắc chắn"], 0,
      "をものともせずに mang tính CA NGỢI sự kiên cường khi vượt qua khó khăn khách quan (bệnh tật).",
      "Xem cấu trúc をものともせずに ở slide 1."),
    q(L, 2, "「家族の心配をよそに、危険な仕事を続けました」 — をよそに khác をものともせずに ở điểm nào?",
      ["をよそに mang sắc thái PHÊ PHÁN việc phớt lờ ý kiến/cảm xúc của người khác",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "をよそに chỉ dùng cho câu hỏi", "をものともせずに chỉ dùng cho phủ định"], 0,
      "をよそに luôn mang sắc thái TIÊU CỰC, phê phán việc phớt lờ sự lo lắng/ý kiến của người khác.",
      "Xem giải thích をよそに ở slide 2."),
    q(L, 3, "をものともせずに thường dùng cho loại trở ngại nào?",
      ["Trở ngại KHÁCH QUAN như bệnh tật, chấn thương, thất bại",
       "Ý kiến/cảm xúc của người khác", "Chỉ dùng cho trở ngại về tiền bạc",
       "Chỉ dùng cho trở ngại về thời gian"], 0,
      "をものともせずに dùng cho trở ngại KHÁCH QUAN (bệnh tật, chấn thương) mà chủ thể tự mình vượt qua.",
      "Xem ví dụ ở slide 1."),
    q(L, 4, "をよそに thường dùng cho loại đối tượng nào bị phớt lờ?",
      ["Ý kiến/cảm xúc của NGƯỜI KHÁC (lo lắng, phản đối, phàn nàn)",
       "Trở ngại vật lý như bệnh tật", "Thời tiết xấu", "Vấn đề tài chính cá nhân"], 0,
      "をよそに dùng khi chủ thể phớt lờ Ý KIẾN/CẢM XÚC của người khác một cách đáng chê trách.",
      "Xem ví dụ ở slide 2."),
    q(L, 5, "「選手はけがをものともせずに、大会で優勝しました」 mang sắc thái gì?",
      ["Ca ngợi sự kiên cường của vận động viên", "Phê phán vận động viên",
       "Trung tính, không có cảm xúc", "Nghi ngờ về khả năng của vận động viên"], 0,
      "をものともせずに luôn mang sắc thái CA NGỢI khi ai đó vượt qua khó khăn khách quan để đạt thành tựu.",
      "Xem văn hóa sử dụng ở slide 1."),
    q(L, 6, "「苦情をよそに、工事が続けられている」 mang sắc thái gì?",
      ["Phê phán việc phớt lờ những lời phàn nàn của người dân",
       "Ca ngợi công trình xây dựng", "Trung tính, không có cảm xúc",
       "Đồng tình với việc tiếp tục công trình"], 0,
      "をよそに ở đây mang sắc thái PHÊ PHÁN việc công trình phớt lờ những lời phàn nàn của cư dân.",
      "Xem ví dụ văn hóa ở slide 2."),
    q(L, 7, "Trong một bài báo, khi nào phóng viên dùng をものともせずに và khi nào dùng をよそに?",
      ["をものともせずに để ca ngợi nhân vật chính; をよそに để phê bình bên bị chỉ trích",
       "Cả hai đều dùng để ca ngợi như nhau", "Cả hai đều dùng để phê bình như nhau",
       "Không có quy tắc nào để lựa chọn"], 0,
      "Cách dùng khác nhau giữa hai cấu trúc thể hiện LẬP TRƯỜNG của người viết mà không cần nói thẳng.",
      "Xem kỹ thuật viết báo ở slide 4."),
    q(L, 8, "Theo hội thoại, vận động viên đã bất chấp điều gì để tiếp tục luyện tập?",
      ["Bệnh tật (病気をものともせずに)", "Thời tiết xấu", "Sự phản đối của huấn luyện viên",
       "Không được đề cập trong hội thoại"], 0,
      "田中 nói 「あの選手は病気をものともせずに、練習を続けました」.",
      "Xem câu thoại thứ 1."),
    q(L, 9, "Công ty đã mặc kệ điều gì để tiến hành kế hoạch?",
      ["Sự phản đối xung quanh (周りの反対をよそに)", "Sự ủng hộ của mọi người",
       "Không có ai phản đối cả", "Chỉ thị của giám đốc"], 0,
      "田中 nói 「周りの反対をよそに、計画を進めました」.",
      "Xem câu thoại thứ 7."),
    q(L, 10, "Kế hoạch của công ty có tiếp tục diễn ra dù bị chỉ trích không?",
      ["Có, vẫn đang tiếp diễn (批判をよそに、計画は続いています)",
       "Không, đã bị hủy bỏ hoàn toàn", "Đã tạm dừng", "Không được đề cập trong hội thoại"], 0,
      "田中 nói 「批判をよそに、計画は続いています」.",
      "Xem câu thoại thứ 9."),
]

LESSON = lesson(
    L,
    "Bài 9: Bất chấp gian khó (をものともせずに & をよそに)",
    "をものともせずに diễn tả việc BẤT CHẤP một khó khăn/trở ngại KHÁCH QUAN (bệnh tật, chấn "
    "thương, thất bại) để tiếp tục hành động — mang tính CA NGỢI sự kiên cường; をよそに diễn tả "
    "việc PHỚT LỜ/MẶC KỆ ý kiến, cảm xúc của NGƯỜI KHÁC (lo lắng, phản đối, phàn nàn) — mang sắc "
    "thái PHÊ PHÁN sự vô tâm; hai cấu trúc thường dùng song song để thể hiện lập trường trong tường thuật.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
