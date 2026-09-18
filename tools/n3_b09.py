# -*- coding: utf-8 -*-
"""N3 — Bai 9: Xu huong tieu cuc 〜がち, dau hieu nhe 〜気味, hanh dong dang do 〜かける.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n3.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n3_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 9
pool = Pool("n3")

VOCAB = [
    v(1,  "がち", "〜がち", "がち", "gachi", "expression", "Hay có xu hướng, thường xuyên (thường mang sắc thái tiêu cực)", "遅刻がちです = hay đi trễ.", L),
    v(2,  "ぎみ", "気味", "ぎみ", "gimi", "expression", "Có vẻ hơi, dấu hiệu nhẹ của (chủ quan)", "疲れ気味です = có vẻ hơi mệt.", L),
    v(3,  "かけます", "掛けます", "かけます", "kakemasu", "verb", "Bắt đầu làm dở, chưa hoàn thành (gắn sau V-stem)", "食べかけの パン = bánh mì ăn dở.", L),
    v(4,  "けっせきします", "欠席します", "けっせきします", "kesseki shimasu", "verb", "Vắng mặt, nghỉ (học/họp)", "学校を 欠席します = nghỉ học.", L),
    v(5,  "けんこう", "健康", "けんこう", "kenkou", "noun", "Sức khỏe", "健康の ために = vì mục đích sức khỏe.", L),
    v(6,  "ちこくします", "遅刻します", "ちこくします", "chikoku shimasu", "verb", "Đi trễ, đến muộn", "会社に 遅刻します = đi trễ đến công ty.", L),
    v(7,  "つかれ", "疲れ", "つかれ", "tsukare", "noun", "Sự mệt mỏi", "疲れが たまります = tích tụ mệt mỏi.", L),
    v(8,  "けいこう", "傾向", "けいこう", "keikou", "noun", "Xu hướng, khuynh hướng", "太る 傾向が あります = có xu hướng béo lên.", L),
    v(9,  "ふそく", "不足", "ふそく", "fusoku", "noun", "Sự thiếu hụt, thiếu", "睡眠 不足 = thiếu ngủ.", L),
    v(10, "すいみん", "睡眠", "すいみん", "suimin", "noun", "Giấc ngủ", "睡眠 時間 = thời gian ngủ.", L),
    v(11, "あきます", "飽きます", "あきます", "akimasu", "verb", "Chán, mất hứng thú", "仕事に 飽きます = chán công việc.", L),
    v(12, "えいよう", "栄養", "えいよう", "eiyou", "noun", "Dinh dưỡng", "栄養が 足りません = thiếu dinh dưỡng.", L),
    v(13, "やすみます", "休みます", "やすみます", "yasumimasu", "verb", "Nghỉ", "Đã gặp N5 bài 1.", L),
    v(14, "わすれます", "忘れます", "わすれます", "wasuremasu", "verb", "Quên", "Đã gặp N4 bài 38.", L),
    v(15, "いそがしい", "忙しい", "いそがしい", "isogashii", "adjective", "Bận rộn", "Đã gặp N4 bài 26.", L),
    v(16, "たべます", "食べます", "たべます", "tabemasu", "verb", "Ăn", "Đã gặp N5 bài 1.", L),
    v(17, "いいます", "言います", "いいます", "iimasu", "verb", "Nói", "Đã gặp N5 bài 6.", L),
    v(18, "やめます", "止めます", "やめます", "yamemasu", "verb", "Dừng lại, từ bỏ", "Đã gặp N4 bài 33.", L),
    v(19, "さいきん", "最近", "さいきん", "saikin", "noun", "Gần đây", "Đã gặp N4 bài 26.", L),
    v(20, "びょうき", "病気", "びょうき", "byouki", "noun", "Bệnh, ốm", "Đã gặp N4 bài 26.", L),
]

KANJI = [
    k(1, "傾", "KHUYNH", 13, ["ケイ (kei)"], ["かたむ(く)"], "Nghiêng, có xu hướng.",
      [("傾向", "けいこう", "Xu hướng"), ("傾く", "かたむく", "Nghiêng")], L),
    k(2, "疲", "BÌ", 10, ["ヒ (hi)"], ["つか(れる)"], "Mệt mỏi.",
      [("疲れ", "つかれ", "Sự mệt mỏi"), ("疲れます", "つかれます", "Mệt mỏi")], L),
    k(3, "欠", "KHIẾM", 4, ["ケツ (ketsu)"], ["か(ける)", "か(く)"], "Thiếu, vắng mặt.",
      [("欠席", "けっせき", "Vắng mặt"), ("欠点", "けってん", "Khuyết điểm")], L),
    k(4, "康", "KHANG", 11, ["コウ (kou)"], [], "Khỏe mạnh, an khang.",
      [("健康", "けんこう", "Sức khỏe")], L),
    k(5, "睡", "THỤY", 13, ["スイ (sui)"], [], "Ngủ.",
      [("睡眠", "すいみん", "Giấc ngủ")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Xu hướng thường xuyên (tiêu cực): V-stem/N + がち",
        "V-stem/N + がち、[trạng thái]",
        "がち diễn tả một XU HƯỚNG THƯỜNG XUYÊN xảy ra, thường mang sắc thái TIÊU CỰC hoặc không "
        "mong muốn — nhấn mạnh tần suất cao của một việc không tốt (đi trễ, nghỉ học, quên...).",
        [
            ex(L, 1, 1, [t("t-l9s1-1", "さいきん", "最近", "さいきん", key=True), t("t-l9s1-2", "、"),
                         t("t-l9s1-3", "ちこく", "遅刻", "ちこく", key=True), t("t-l9s1-4", "がち", key=True),
                         t("t-l9s1-5", "です")],
               "Gần đây, tôi hay đi trễ."),
            ex(L, 1, 2, [t("t-l9s1-6", "いそがしい", "忙しい", "いそがしい"), t("t-l9s1-7", "とき", "時", "とき"),
                         t("t-l9s1-8", "は"), t("t-l9s1-9", "しょくじ", "食事", "しょくじ"), t("t-l9s1-10", "を"),
                         t("t-l9s1-11", "わすれ", "忘れ", "わすれ", key=True), t("t-l9s1-12", "がち", key=True),
                         t("t-l9s1-13", "です")],
               "Lúc bận rộn, tôi hay quên ăn."),
        ],
        tips="がち thường đi với các từ tiêu cực: 病気がち (hay ốm), 休みがち (hay nghỉ), 忘れがち (hay quên).",
        culture="Bác sĩ Nhật hay hỏi bệnh nhân: '最近、疲れがちですか' (gần đây bạn có hay mệt mỏi không)."),

    slide(L, 2,
        "2. Dấu hiệu nhẹ, cảm nhận chủ quan: N/V-stem + 気味",
        "N/V-stem + 気味、[trạng thái]",
        "気味 diễn tả CÓ CHÚT dấu hiệu/cảm giác của một trạng thái nào đó — nhẹ hơn hẳn がち, "
        "thiên về CẢM NHẬN CHỦ QUAN của người nói về cơ thể/tâm trạng của chính mình.",
        [
            ex(L, 2, 1, [t("t-l9s2-1", "さいきん", "最近", "さいきん", key=True), t("t-l9s2-2", "、"),
                         t("t-l9s2-3", "つかれ", "疲れ", "つかれ", key=True), t("t-l9s2-4", "ぎみ", "気味", "ぎみ", key=True),
                         t("t-l9s2-5", "です")],
               "Gần đây, tôi có cảm giác hơi mệt."),
            ex(L, 2, 2, [t("t-l9s2-6", "すいみん", "睡眠", "すいみん", key=True), t("t-l9s2-7", "ふそく", "不足", "ふそく", key=True),
                         t("t-l9s2-8", "ぎみ", "気味", "ぎみ", key=True), t("t-l9s2-9", "です")],
               "Có vẻ tôi hơi thiếu ngủ."),
        ],
        tips="気味 nhấn CẢM GIÁC HIỆN TẠI của bản thân (nhẹ, chủ quan); がち nhấn TẦN SUẤT LẶP LẠI theo thời gian (khách quan hơn).",
        culture="Ở phòng khám Nhật, phiếu khai bệnh hay có mục 'かぜ気味' (có vẻ hơi bị cảm) để mô tả triệu chứng nhẹ."),

    slide(L, 3,
        "3. Hành động dang dở: V-stem + かける",
        "V-stem + かける/かけの/かけだ   (hành động BẮT ĐẦU nhưng CHƯA HOÀN THÀNH)",
        "かける gắn sau V-stem diễn tả một HÀNH ĐỘNG ĐÃ BẮT ĐẦU nhưng bị GIÁN ĐOẠN GIỮA CHỪNG, "
        "chưa hoàn thành — khác hẳn がち/気味 (nói về xu hướng/cảm giác lặp lại theo thời gian).",
        [
            ex(L, 3, 1, [t("t-l9s3-1", "たべ", "食べ", "たべ", key=True), t("t-l9s3-2", "かけ", "掛け", "かけ", key=True),
                         t("t-l9s3-3", "の"), t("t-l9s3-4", "パン", "パン", "パン"), t("t-l9s3-5", "が"),
                         t("t-l9s3-6", "あります", "有ります", "あります")],
               "Có bánh mì ăn dở."),
            ex(L, 3, 2, [t("t-l9s3-7", "いい", "言い", "いい", key=True), t("t-l9s3-8", "かけて", "掛けて", "かけて", key=True),
                         t("t-l9s3-9", "、"), t("t-l9s3-10", "やめました", "止めました", "やめました")],
               "Tôi định nói (nhưng nói dở) rồi đã dừng lại."),
        ],
        tips="V-stem+かけの+N (dạng bổ nghĩa danh từ): 食べかけのパン (bánh mì ăn dở), 読みかけの本 (sách đọc dở).",
        culture="Câu 'ゲームをやりかけたまま寝てしまった' (chơi game dở rồi ngủ quên mất) rất phổ biến trong hội thoại đời thường Nhật."),

    slide(L, 4,
        "4. So sánh がち, 気味, かける",
        "がち: xu hướng LẶP LẠI (khách quan, tiêu cực)　vs　気味: CẢM GIÁC nhẹ (chủ quan)　vs　かける: hành động DANG DỞ (một lần cụ thể)",
        "Ba cấu trúc dễ nhầm vì đều mô tả trạng thái 'chưa trọn vẹn', nhưng khác nhau về BẢN CHẤT: "
        "がち là XU HƯỚNG lặp đi lặp lại theo thời gian; 気味 là CẢM GIÁC hiện tại về cơ thể/tâm "
        "trạng; かける là HÀNH ĐỘNG cụ thể bị bỏ dở giữa chừng, không lặp lại.",
        [
            ex(L, 4, 1, [t("t-l9s4-1", "さいきん", "最近", "さいきん"), t("t-l9s4-2", "、"),
                         t("t-l9s4-3", "つかれ", "疲れ", "つかれ", key=True), t("t-l9s4-4", "ぎみ", "気味", "ぎみ", key=True),
                         t("t-l9s4-5", "で"), t("t-l9s4-6", "、"), t("t-l9s4-7", "しごと", "仕事", "しごと"),
                         t("t-l9s4-8", "を"), t("t-l9s4-9", "やすみ", "休み", "やすみ", key=True), t("t-l9s4-10", "がち", key=True),
                         t("t-l9s4-11", "です")],
               "Gần đây tôi hơi mệt (気味), nên hay nghỉ làm (がち)."),
            ex(L, 4, 2, [t("t-l9s4-12", "えいよう", "栄養", "えいよう", key=True), t("t-l9s4-13", "ふそく", "不足", "ふそく", key=True),
                         t("t-l9s4-14", "で"), t("t-l9s4-15", "、"), t("t-l9s4-16", "けんこう", "健康", "けんこう", key=True),
                         t("t-l9s4-17", "を"), t("t-l9s4-18", "くずし", "崩し", "くずし"), t("t-l9s4-19", "がち", key=True),
                         t("t-l9s4-20", "です")],
               "Vì thiếu dinh dưỡng nên tôi hay bị suy yếu sức khỏe."),
        ],
        tips="Mẹo phân biệt: 気味 trả lời 'CẢM THẤY thế nào'; がち trả lời 'THƯỜNG hay làm gì'; かける trả lời 'LÀM DỞ việc gì'.",
        culture="Cả ba đều là điểm ngữ pháp N3 phổ biến trong đề đọc hiểu về sức khỏe, thói quen sinh hoạt."),
]

DIALOGUE = [
    line(L, 1, "田中", "Đồng nghiệp",
         [t("d9-1", "さいきん", "最近", "さいきん", key=True), t("d9-2", "、"), t("d9-3", "つかれ", "疲れ", "つかれ", key=True),
          t("d9-4", "ぎみ", "気味", "ぎみ", key=True), t("d9-5", "です", "です", "です"), t("d9-6", "ね")],
         "Gần đây, có vẻ bạn hơi mệt nhỉ."),
    line(L, 2, "サントス", "Đồng nghiệp",
         [t("d9-7", "はい"), t("d9-8", "、"), t("d9-9", "すいみん", "睡眠", "すいみん", key=True), t("d9-10", "ふそく", "不足", "ふそく", key=True),
          t("d9-11", "ぎみ", "気味", "ぎみ", key=True), t("d9-12", "です")],
         "Vâng, có vẻ tôi hơi thiếu ngủ."),
    line(L, 3, "田中", "Đồng nghiệp",
         [t("d9-13", "さいきん", "最近", "さいきん"), t("d9-14", "、"), t("d9-15", "ちこく", "遅刻", "ちこく", key=True),
          t("d9-16", "がち", key=True), t("d9-17", "です", "です", "です"), t("d9-18", "ね")],
         "Gần đây, bạn hay đi trễ nhỉ."),
    line(L, 4, "サントス", "Đồng nghiệp",
         [t("d9-19", "すみません"), t("d9-20", "。"), t("d9-21", "しょくじ", "食事", "しょくじ"), t("d9-22", "も"),
          t("d9-23", "わすれ", "忘れ", "わすれ", key=True), t("d9-24", "がち", key=True), t("d9-25", "です")],
         "Xin lỗi. Tôi cũng hay quên ăn nữa."),
    line(L, 5, "田中", "Đồng nghiệp",
         [t("d9-26", "けんこう", "健康", "けんこう", key=True), t("d9-27", "の"), t("d9-28", "ために"),
          t("d9-29", "えいよう", "栄養", "えいよう", key=True), t("d9-30", "を"), t("d9-31", "とった", "取った", "とった"),
          t("d9-32", "ほうが"), t("d9-33", "いいです")],
         "Vì sức khỏe, bạn nên bổ sung dinh dưỡng đầy đủ."),
    line(L, 6, "サントス", "Đồng nghiệp",
         [t("d9-34", "たべ", "食べ", "たべ", key=True), t("d9-35", "かけ", "掛け", "かけ", key=True), t("d9-36", "の"),
          t("d9-37", "パン", "パン", "パン"), t("d9-38", "が"), t("d9-39", "つくえ", "机", "つくえ"), t("d9-40", "に"),
          t("d9-41", "あります", "有ります", "あります")],
         "Có bánh mì tôi ăn dở trên bàn."),
    line(L, 7, "田中", "Đồng nghiệp",
         [t("d9-42", "しごと", "仕事", "しごと"), t("d9-43", "に"), t("d9-44", "あき", "飽き", "あき", key=True),
          t("d9-45", "ました", "ました", "ました"), t("d9-46", "か")],
         "Bạn có chán công việc không?"),
    line(L, 8, "サントス", "Đồng nghiệp",
         [t("d9-47", "いいえ"), t("d9-48", "、"), t("d9-49", "けいこう", "傾向", "けいこう", key=True),
          t("d9-50", "として"), t("d9-51", "、"), t("d9-52", "しごと", "仕事", "しごと"), t("d9-53", "を"),
          t("d9-54", "けっせき", "欠席", "けっせき", key=True), t("d9-55", "する"), t("d9-56", "こと", "事", "こと"),
          t("d9-57", "が"), t("d9-58", "おおい", "多い", "おおい"), t("d9-59", "だけです")],
         "Không, chỉ là có xu hướng hay nghỉ làm thôi."),
    line(L, 9, "田中", "Đồng nghiệp",
         [t("d9-60", "びょうき", "病気", "びょうき", key=True), t("d9-61", "に"), t("d9-62", "なる"),
          t("d9-63", "まえ", "前", "まえ"), t("d9-64", "に"), t("d9-65", "やすみます", "休みます", "やすみます")],
         "Hãy nghỉ ngơi trước khi bị ốm nhé."),
    line(L, 10, "サントス", "Đồng nghiệp",
         [t("d9-66", "はい"), t("d9-67", "、"), t("d9-68", "ありがとうございます", "ありがとうございます", "ありがとうございます"),
          t("d9-69", "。"), t("d9-70", "きをつけます", "気を付けます", "きをつけます")],
         "Vâng, cảm ơn bạn. Tôi sẽ cẩn thận hơn."),
]

EXERCISES = [
    q(L, 1, "「最近、遅刻がちです」 — がち diễn tả điều gì?",
      ["Xu hướng thường xuyên xảy ra, mang sắc thái tiêu cực (hay đi trễ)",
       "Chỉ xảy ra một lần duy nhất", "Sự việc đã hoàn thành", "Cảm giác nhẹ chủ quan"], 0,
      "がち nhấn TẦN SUẤT CAO của một việc không mong muốn lặp đi lặp lại — ở đây là hay đi trễ.",
      "Xem cấu trúc V-stem/Nがち ở slide 1."),
    q(L, 2, "「最近、疲れ気味です」 — 気味 khác がち ở điểm nào?",
      ["気味 diễn tả CẢM GIÁC nhẹ, chủ quan hiện tại; がち diễn tả XU HƯỚNG lặp lại theo thời gian",
       "Hoàn toàn giống nhau", "気味 chỉ dùng cho câu hỏi", "がち chỉ dùng cho phủ định"], 0,
      "気味 nhấn CẢM NHẬN CHỦ QUAN hiện tại (hơi mệt); がち nhấn TẦN SUẤT lặp lại theo thời gian (hay bị/hay làm).",
      "Xem so sánh がち và 気味 ở slide 2."),
    q(L, 3, "「食べかけのパンがあります」 — かけ diễn tả điều gì?",
      ["Hành động ăn đã bắt đầu nhưng chưa hoàn thành (ăn dở)",
       "Đã ăn xong hoàn toàn", "Chưa từng ăn", "Sẽ ăn trong tương lai"], 0,
      "V-stem+かけ (食べかけ) diễn tả hành động đã bắt đầu nhưng bị gián đoạn, chưa hoàn thành.",
      "Xem cấu trúc V-stemかける ở slide 3."),
    q(L, 4, "「言いかけて、止めました」 nghĩa là:",
      ["Định nói (nói dở) nhưng đã dừng lại giữa chừng", "Đã nói xong hoàn toàn",
       "Chưa từng định nói gì cả", "Sẽ nói vào lúc khác"], 0,
      "言いかけて diễn tả hành động nói đã bắt đầu (dở dang) rồi bị dừng lại (止めました).",
      "Áp dụng cấu trúc V-stemかける cho động từ 言う."),
    q(L, 5, "Cả ba cấu trúc がち, 気味, かける đều mô tả trạng thái gì chung?",
      ["Trạng thái 'chưa trọn vẹn' nhưng khác nhau về bản chất (xu hướng/cảm giác/hành động dang dở)",
       "Đều diễn tả sự hoàn thành trọn vẹn", "Đều chỉ dùng cho phủ định",
       "Đều chỉ dùng cho câu hỏi"], 0,
      "Cả ba đều liên quan đến trạng thái chưa trọn vẹn, nhưng がち=xu hướng lặp lại, 気味=cảm giác chủ quan, かける=hành động dang dở một lần.",
      "Xem bảng so sánh tổng hợp ở slide 4."),
    q(L, 6, "「栄養不足で、健康を崩しがちです」 nghĩa là:",
      ["Vì thiếu dinh dưỡng nên hay bị suy yếu sức khỏe", "Vì đủ dinh dưỡng nên rất khỏe mạnh",
       "Không liên quan gì đến sức khỏe", "Đã khỏi bệnh hoàn toàn"], 0,
      "栄養不足で (vì thiếu dinh dưỡng) + 健康を崩しがちです (hay bị suy yếu sức khỏe) diễn tả nguyên nhân-kết quả tiêu cực lặp lại.",
      "Xem ví dụ kết hợp ở slide 4."),
    q(L, 7, "「睡眠不足気味です」 mang sắc thái gì so với 「いつも寝不足です」?",
      ["気味 nhẹ nhàng hơn, mang tính cảm nhận chủ quan hiện tại, không khẳng định tuyệt đối",
       "気味 mạnh mẽ, khẳng định chắc chắn hơn", "Hoàn toàn giống nhau về sắc thái",
       "気味 chỉ dùng trong văn viết trang trọng"], 0,
      "気味 luôn mang sắc thái NHẸ, CHỦ QUAN — 'có vẻ hơi...' chứ không khẳng định chắc chắn như いつも (luôn luôn).",
      "So sánh sắc thái của 気味 với các cách diễn đạt khác."),
    q(L, 8, "Theo hội thoại, Santos gần đây cảm thấy thế nào?",
      ["Có vẻ hơi mệt và thiếu ngủ (疲れ気味、睡眠不足気味)",
       "Rất khỏe mạnh, tràn đầy năng lượng", "Không có vấn đề gì về sức khỏe",
       "Đã khỏi hoàn toàn mệt mỏi"], 0,
      "Santos nói 「睡眠不足気味です」 sau khi Tanaka nhận xét 「疲れ気味ですね」.",
      "Xem câu thoại thứ 1-2."),
    q(L, 9, "Santos giải thích lý do hay nghỉ làm là gì?",
      ["Có xu hướng hay nghỉ làm (欠席することが多いだけ), không phải chán việc",
       "Vì chán ghét công việc hoàn toàn", "Vì đã nghỉ việc", "Không đưa ra lý do nào"], 0,
      "Santos trả lời 「傾向として、仕事を欠席することが多いだけです」ngay sau khi được hỏi có chán việc không.",
      "Xem câu thoại thứ 7-8."),
    q(L, 10, "田中 khuyên Santos điều gì ở cuối hội thoại?",
      ["Nên nghỉ ngơi trước khi bị ốm (病気になる前に休みます)",
       "Nên làm việc nhiều hơn", "Nên bỏ việc ngay", "Không đưa ra lời khuyên nào"], 0,
      "田中 nói 「病気になる前に休みます」.",
      "Xem câu thoại thứ 9."),
]

LESSON = lesson(
    L,
    "Bài 9: Xu hướng & Khởi đầu (〜かける & 〜がち & 〜気味)",
    "がち diễn tả XU HƯỚNG thường xuyên xảy ra, mang sắc thái tiêu cực (hay đi trễ, hay quên); "
    "気味 diễn tả CẢM GIÁC nhẹ, chủ quan về một trạng thái hiện tại (hơi mệt, hơi thiếu ngủ); "
    "かける gắn sau V-stem diễn tả một hành động ĐÃ BẮT ĐẦU nhưng CHƯA HOÀN THÀNH, bị gián đoạn giữa chừng.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
