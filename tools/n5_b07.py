# -*- coding: utf-8 -*-
"""N5 — Bài 7: Công cụ/phương tiện で, cho-nhận あげます/もらいます, もう Vました.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md).
あげます/もらいます la dong tu chuc nang ngu phap, khong nam trong danh sach
tu vung JLPT (giong は/が/を), nen duoc dua vao thu cong nhu cac tro tu khac.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 7
pool = Pool("n5")

VOCAB = [
    v(1,  "あげます", "上げます", "あげます", "agemasu", "verb", "Tặng, cho (người khác)", "Người nói/phe người nói TẶNG cho người khác.", L),
    v(2,  "もらいます", "", "", "moraimasu", "verb", "Nhận, được (từ ai đó)", "Người nói NHẬN từ người khác — người cho đánh dấu bằng に hoặc から.", L),
    v(3,  "かします", "貸します", "かします", "kashimasu", "verb", "Cho mượn", "Thể từ điển: 貸す. Khác 借ります (mượn) — hai chiều ngược nhau.", L),
    v(4,  "かります", "借ります", "かります", "karimasu", "verb", "Mượn, vay", "Thể từ điển: 借りる. Người MƯỢN dùng động từ này.", L),
    v(5,  "おしえます", "教えます", "おしえます", "oshiemasu", "verb", "Dạy, chỉ bảo, cho biết", "教えて ください = xin hãy chỉ giúp tôi.", L),
    v(6,  "ならいます", "習います", "ならいます", "naraimasu", "verb", "Học (một kỹ năng, từ ai đó)", "Khác 勉強します (học nói chung) — 習います nhấn mạnh HỌC TỪ AI.", L),
    v(7,  "はなします", "話します", "はなします", "hanashimasu", "verb", "Nói, trò chuyện", "日本語で 話します = nói bằng tiếng Nhật.", L),
    v(8,  "みせます", "見せます", "みせます", "misemasu", "verb", "Cho xem, trình bày", "Đã gặp dạng lịch sự 見せて ください ở bài 3.", L),
    v(9,  "ペン", "", "", "pen", "noun", "Cây bút (nói chung)", "ボールペン (bút bi) đã học ở bài 2 là một loại ペン.", L),
    v(10, "かんじ", "漢字", "かんじ", "kanji", "noun", "Chữ Hán", "漢字を 習います = học chữ Hán.", L),
    v(11, "でんわ", "電話", "でんわ", "denwa", "noun", "Điện thoại, cuộc gọi", "電話を 貸します = cho mượn điện thoại.", L),
    v(12, "たんじょうび", "誕生日", "たんじょうび", "tanjoubi", "noun", "Sinh nhật", "Đã gặp bài 5 — nay dùng làm dịp tặng quà.", L),
    v(13, "もう", "", "", "mou", "adverb", "Đã, rồi (việc đã hoàn tất)", "もう Vました = đã làm ~ rồi.", L),
    v(14, "まだ", "", "", "mada", "adverb", "Vẫn chưa, còn", "まだ Vていません = vẫn chưa làm ~.", L),
    v(15, "にほんご", "日本語", "にほんご", "nihongo", "noun", "Tiếng Nhật", "Đã gặp bài 2 — nay dùng làm ngôn ngữ để 話します/教えます.", L),
    v(16, "えいご", "英語", "えいご", "eigo", "noun", "Tiếng Anh", "Đã gặp bài 2.", L),
    v(17, "じしょ", "辞書", "じしょ", "jisho", "noun", "Từ điển", "Đã gặp bài 2 — nay dùng làm vật cho mượn.", L),
    v(18, "かさ", "傘", "かさ", "kasa", "noun", "Cái ô, cái dù", "Đã gặp bài 2 — nay dùng làm vật cho mượn khi trời mưa.", L),
    v(19, "ちず", "地図", "ちず", "chizu", "noun", "Bản đồ", "地図を 見せて ください = cho tôi xem bản đồ.", L),
    v(20, "しゅくだい", "宿題", "しゅくだい", "shukudai", "noun", "Bài tập về nhà", "宿題を します = làm bài tập.", L),
]

KANJI = [
    k(1, "教", "GIÁO", 11, ["キョウ (kyou)"], ["おし(える)", "おそ(わる)"], "Dạy, giáo dục.",
      [("教えます", "おしえます", "Dạy"), ("教室", "きょうしつ", "Phòng học"), ("教師", "きょうし", "Giáo viên")], L),
    k(2, "習", "TẬP", 11, ["シュウ (shuu)"], ["なら(う)"], "Học, luyện tập, thói quen.",
      [("習います", "ならいます", "Học"), ("習慣", "しゅうかん", "Thói quen"), ("練習", "れんしゅう", "Luyện tập")], L),
    k(3, "話", "THOẠI", 13, ["ワ (wa)"], ["はな(す)", "はなし"], "Nói, câu chuyện. Bộ 言 (lời nói).",
      [("話します", "はなします", "Nói"), ("電話", "でんわ", "Điện thoại"), ("会話", "かいわ", "Hội thoại")], L),
    k(4, "漢", "HÁN", 13, ["カン (kan)"], [], "Nhà Hán (Trung Quốc) — chỉ chữ Hán.",
      [("漢字", "かんじ", "Chữ Hán"), ("漢語", "かんご", "Từ Hán"), ("漢方", "かんぽう", "Đông y")], L),
    k(5, "字", "TỰ", 6, ["ジ (ji)"], [], "Chữ viết.",
      [("漢字", "かんじ", "Chữ Hán"), ("字", "じ", "Chữ"), ("数字", "すうじ", "Chữ số")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Công cụ/ngôn ngữ: N[công cụ] + で + V",
        "[Công cụ/ngôn ngữ] + で + Vます",
        "で đã học ở bài 5 (phương tiện) và bài 6 (nơi chốn) — nay thêm nghĩa thứ ba: CÔNG CỤ hoặc "
        "NGÔN NGỮ dùng để thực hiện hành động. Cùng một trợ từ, ba chức năng, phân biệt bằng ngữ cảnh.",
        [
            ex(L, 1, 1, [t("t-l7s1-1", "ペン"), t("t-l7s1-2", "で", key=True),
                         t("t-l7s1-3", "かきます", "書きます", "かきます")],
               "Tôi viết bằng bút."),
            ex(L, 1, 2, [t("t-l7s1-4", "にほんご", "日本語", "にほんご"), t("t-l7s1-5", "で", key=True),
                         t("t-l7s1-6", "はなします", "話します", "はなします", key=True)],
               "Tôi nói bằng tiếng Nhật."),
            ex(L, 1, 3, [t("t-l7s1-7", "なに", "何", "なに", key=True), t("t-l7s1-8", "で", key=True),
                         t("t-l7s1-9", "かきますか", "書きますか", "かきますか")],
               "Anh viết bằng gì vậy?"),
        ],
        tips="で đã có 3 nghĩa: phương tiện di chuyển (b5), nơi hành động (b6), công cụ/ngôn ngữ (b7) — luôn xét ngữ cảnh.",
        culture="Trong lớp học tiếng Nhật, 日本語で 話して ください (hãy nói bằng tiếng Nhật) là câu giáo viên nói nhiều nhất."),

    slide(L, 2,
        "2. Tặng: [người cho] は [người nhận] に N を あげます",
        "[Người cho] は [người nhận] に + N + を + あげます",
        "あげます dùng khi NGƯỜI NÓI (hoặc phe người nói) TẶNG cho người khác. "
        "Người nhận đánh dấu bằng に. Không dùng あげます khi người khác tặng CHO MÌNH.",
        [
            ex(L, 2, 1, [t("t-l7s2-1", "わたし", "私", "わたし"), t("t-l7s2-2", "は"),
                         t("t-l7s2-3", "やまださん", "山田さん", "やまださん"), t("t-l7s2-4", "に", key=True),
                         t("t-l7s2-5", "はな", "花", "はな"), t("t-l7s2-6", "を"),
                         t("t-l7s2-7", "あげます", "上げます", "あげます", key=True)],
               "Tôi tặng hoa cho anh Yamada."),
            ex(L, 2, 2, [t("t-l7s2-8", "たんじょうび", "誕生日", "たんじょうび"), t("t-l7s2-9", "に"),
                         t("t-l7s2-10", "なに", "何", "なに", key=True), t("t-l7s2-11", "を"),
                         t("t-l7s2-12", "あげますか", "上げますか", "あげますか")],
               "Anh định tặng gì nhân sinh nhật vậy?"),
        ],
        tips="Với người TRÊN mình (thầy cô, cấp trên) nên dùng 差し上げます thay あげます — sẽ học ở trình độ cao hơn.",
        culture="Văn hóa tặng quà Nhật rất coi trọng cách GÓI quà hơn cả giá trị món quà."),

    slide(L, 3,
        "3. Nhận: [người nhận] は [người cho] に N を もらいます",
        "[Người nhận] は [người cho] に/から + N + を + もらいます",
        "もらいます là mặt đối lập của あげます — NGƯỜI NÓI NHẬN từ người khác. "
        "Người cho đánh dấu bằng に (thường dùng với người) hoặc から (thường dùng với tổ chức/nơi).",
        [
            ex(L, 3, 1, [t("t-l7s3-1", "わたし", "私", "わたし"), t("t-l7s3-2", "は"),
                         t("t-l7s3-3", "やまださん", "山田さん", "やまださん"), t("t-l7s3-4", "に", key=True),
                         t("t-l7s3-5", "ほん", "本", "ほん"), t("t-l7s3-6", "を"),
                         t("t-l7s3-7", "もらいました", "もらいました", "もらいました", key=True)],
               "Tôi đã nhận được quyển sách từ anh Yamada."),
            ex(L, 3, 2, [t("t-l7s3-8", "だれ", "誰", "だれ"), t("t-l7s3-9", "に", key=True),
                         t("t-l7s3-10", "にほんご", "日本語", "にほんご"), t("t-l7s3-11", "を"),
                         t("t-l7s3-12", "ならいましたか", "習いましたか", "ならいましたか", key=True)],
               "Anh học tiếng Nhật từ ai vậy?"),
        ],
        tips="あげます/もらいます luôn LẤY NGƯỜI NÓI làm gốc — chủ ngữ luôn là phe của người nói, dù câu là hỏi hay kể.",
        culture="習います nhấn mạnh có người dạy trực tiếp — khác 勉強します (tự học hoặc học nói chung)."),

    slide(L, 4,
        "4. Đã xong: もう Vました / まだ Vていません",
        "もう + Vました (đã xong rồi)  /  まだ + Vていません (vẫn chưa xong)",
        "もう xác nhận việc ĐÃ HOÀN TẤT. まだ báo việc CHƯA XONG — khi trả lời phủ định cho câu hỏi "
        "có もう, phải đổi thành まだ, không lặp lại もう.",
        [
            ex(L, 4, 1, [t("t-l7s4-1", "もう", key=True), t("t-l7s4-2", "しゅくだい", "宿題", "しゅくだい"),
                         t("t-l7s4-3", "を"), t("t-l7s4-4", "しましたか", "しましたか", "しましたか")],
               "Anh làm bài tập chưa?"),
            ex(L, 4, 2, [t("t-l7s4-5", "はい"), t("t-l7s4-6", "、"), t("t-l7s4-7", "もう", key=True),
                         t("t-l7s4-8", "しました", "しました", "しました")],
               "Vâng, làm rồi."),
            ex(L, 4, 3, [t("t-l7s4-9", "いいえ"), t("t-l7s4-10", "、"), t("t-l7s4-11", "まだ", key=True),
                         t("t-l7s4-12", "です")],
               "Chưa, vẫn chưa ạ."),
        ],
        tips="Trả lời ngắn gọn 「まだです」 rất thông dụng — không cần lặp lại cả câu.",
        culture="Ở công sở Nhật, câu hỏi 「もう終わりましたか」 (xong chưa) được dùng thường xuyên để theo dõi tiến độ."),
]

DIALOGUE = [
    line(L, 1, "ミラー", "Nhân viên công ty",
         [t("d-l7-1", "グプタさん"), t("d-l7-2", "、"), t("d-l7-3", "その"), t("d-l7-4", "じしょ", "辞書", "じしょ", key=True),
          t("d-l7-5", "を"), t("d-l7-6", "かして", "貸して", "かして", key=True), t("d-l7-7", "ください")],
         "Anh Gupta, cho tôi mượn quyển từ điển đó với."),
    line(L, 2, "グプタ", "Đồng nghiệp",
         [t("d-l7-8", "ええ"), t("d-l7-9", "、"), t("d-l7-10", "どうぞ")],
         "Ừ, đây."),
    line(L, 3, "ミラー", "Nhân viên công ty",
         [t("d-l7-11", "この"), t("d-l7-12", "じしょ", "辞書", "じしょ"), t("d-l7-13", "は"),
          t("d-l7-14", "だれ", "誰", "だれ"), t("d-l7-15", "に", key=True), t("d-l7-16", "もらいましたか", "もらいましたか", "もらいましたか", key=True)],
         "Từ điển này anh nhận từ ai vậy?"),
    line(L, 4, "グプタ", "Đồng nghiệp",
         [t("d-l7-17", "せんせい", "先生", "せんせい"), t("d-l7-18", "に", key=True),
          t("d-l7-19", "もらいました", "もらいました", "もらいました")],
         "Tôi nhận từ thầy giáo."),
    line(L, 5, "ミラー", "Nhân viên công ty",
         [t("d-l7-20", "いいですね"), t("d-l7-21", "。"), t("d-l7-22", "たんじょうび", "誕生日", "たんじょうび", key=True),
          t("d-l7-23", "の"), t("d-l7-24", "プレゼント"), t("d-l7-25", "ですか")],
         "Hay quá. Quà sinh nhật à?"),
    line(L, 6, "グプタ", "Đồng nghiệp",
         [t("d-l7-26", "はい"), t("d-l7-27", "。"), t("d-l7-28", "せんせい", "先生", "せんせい"),
          t("d-l7-29", "に"), t("d-l7-30", "にほんご", "日本語", "にほんご"), t("d-l7-31", "も"),
          t("d-l7-32", "ならいました", "習いました", "ならいました", key=True)],
         "Vâng. Tôi cũng học tiếng Nhật từ thầy."),
    line(L, 7, "ミラー", "Nhân viên công ty",
         [t("d-l7-33", "そうですか"), t("d-l7-34", "。"), t("d-l7-35", "もう", key=True),
          t("d-l7-36", "かんじ", "漢字", "かんじ", key=True), t("d-l7-37", "を"),
          t("d-l7-38", "ならいましたか", "習いましたか", "ならいましたか")],
         "Vậy à. Anh học chữ Hán chưa?"),
    line(L, 8, "グプタ", "Đồng nghiệp",
         [t("d-l7-39", "いいえ"), t("d-l7-40", "、"), t("d-l7-41", "まだ", key=True), t("d-l7-42", "です")],
         "Chưa, vẫn chưa ạ."),
    line(L, 9, "ミラー", "Nhân viên công ty",
         [t("d-l7-43", "じゃ"), t("d-l7-44", "、"), t("d-l7-45", "わたし", "私", "わたし"),
          t("d-l7-46", "が"), t("d-l7-47", "おしえましょう", "教えましょう", "おしえましょう", key=True), t("d-l7-48", "か")],
         "Vậy để tôi dạy anh nhé?"),
    line(L, 10, "グプタ", "Đồng nghiệp",
         [t("d-l7-49", "ほんとうですか", "本当ですか", "ほんとうですか"), t("d-l7-50", "。"),
          t("d-l7-51", "ありがとう"), t("d-l7-52", "ございます")],
         "Thật vậy à? Cảm ơn anh nhiều lắm."),
]

EXERCISES = [
    q(L, 1, "「ペンで 書きます」 và 「電車で 行きます」, chữ で ở hai câu có cùng chức năng không?",
      ["Không — một là công cụ, một là phương tiện di chuyển",
       "Có, hoàn toàn giống nhau", "で đầu tiên sai ngữ pháp", "Chỉ dùng で với động vật"], 0,
      "で đa chức năng: phương tiện di chuyển (bài 5), nơi hành động (bài 6), công cụ/ngôn ngữ (bài 7) — cùng chữ nhưng khác vai trò theo ngữ cảnh.",
      "So sánh ba bài đã học."),
    q(L, 2, "Tôi tặng hoa cho anh Yamada — câu nào ĐÚNG?",
      ["私は 山田さんに 花を あげます", "私は 山田さんが 花を あげます",
       "山田さんは 私に 花を あげます", "私は 山田さんを 花に あげます"], 0,
      "あげます dùng khi CHỦ NGỮ (私) là người tặng, người nhận (山田さん) đánh dấu bằng に.",
      "Ai là người tặng trong câu tiếng Việt?"),
    q(L, 3, "Tôi nhận sách từ anh Yamada — câu nào ĐÚNG?",
      ["私は 山田さんに 本を もらいました", "私は 山田さんを 本に もらいました",
       "山田さんは 私を 本に もらいました", "私が 山田さんに 本を あげました"], 0,
      "もらいます dùng khi CHỦ NGỮ là người NHẬN, người cho đánh dấu bằng に.",
      "Chú ý chủ ngữ là người nhận, không phải người cho."),
    q(L, 4, "「もう 宿題を しましたか」 「いいえ、___」",
      ["まだです", "もうです", "もうしました", "まだしました"], 0,
      "Trả lời phủ định cho câu hỏi có もう phải dùng まだ, không lặp lại もう.",
      "もう và まだ đối lập nhau."),
    q(L, 5, "習います khác 勉強します ở chỗ nào?",
      ["習います nhấn mạnh học TỪ AI ĐÓ trực tiếp, 勉強します là học nói chung",
       "Hoàn toàn giống nhau", "習います chỉ dùng cho trẻ em",
       "勉強します chỉ dùng cho kỳ thi"], 0,
      "習います thường đi kèm 〜に (học từ ai), còn 勉強します là hành động học chung chung, có thể tự học.",
      "Xem lại câu ví dụ có 先生に 日本語を 習いました."),
    q(L, 6, "貸します và 借ります khác nhau ở chỗ:",
      ["貸します = cho mượn (từ mình), 借ります = mượn (về mình)",
       "Cả hai đều nghĩa là mượn", "貸します dùng cho tiền, 借ります dùng cho đồ vật",
       "Không có gì khác nhau"], 0,
      "Đây là cặp động từ ngược hướng: 貸す (cho ai mượn) và 借りる (mượn của ai) — như あげる/もらう.",
      "Xem hướng của hành động cho/nhận."),
    q(L, 7, "Từ điển này anh nhận từ ai vậy? — trợ từ đúng để hỏi người cho là:",
      ["に", "を", "で", "へ"], 0,
      "Người cho trong cấu trúc もらいます đánh dấu bằng に (hoặc から) — 誰に もらいましたか。",
      "Xem lại cấu trúc もらいます."),
    q(L, 8, "「日本語で 話して ください」 nghĩa là:",
      ["Xin hãy nói bằng tiếng Nhật", "Xin hãy học tiếng Nhật",
       "Xin hãy dạy tiếng Nhật", "Xin đừng nói tiếng Nhật"], 0,
      "で ở đây đánh dấu NGÔN NGỮ dùng để nói — 話して ください = xin hãy nói.",
      "話す nghĩa là nói/trò chuyện."),
    q(L, 9, "Cách trả lời ngắn gọn cho 'chưa làm xong' là:",
      ["まだです", "もうです", "はい、まだ", "いいえ、もう"], 0,
      "まだです là cách trả lời ngắn gọn, tự nhiên, rất thông dụng trong hội thoại hằng ngày.",
      "Không cần lặp lại cả câu đầy đủ."),
    q(L, 10, "Văn hóa Nhật coi trọng điều gì nhất khi tặng quà?",
      ["Cách gói quà", "Giá trị món quà", "Thương hiệu món quà", "Số lượng quà"], 0,
      "Người Nhật rất chú trọng hình thức và cách gói quà, đôi khi còn quan trọng hơn bản thân món quà.",
      "Đây là điểm khác biệt văn hóa đáng chú ý."),
]

LESSON = lesson(
    L,
    "Bài 7: Công cụ, Phương tiện で & Cho nhận (あげます / もらいます / もう Vました)",
    "Dùng で để chỉ công cụ hoặc ngôn ngữ thực hiện hành động, cấu trúc tặng あげます và nhận "
    "もらいます (luôn lấy người nói làm gốc), cặp 貸します/借ります, và cách nói việc đã xong "
    "bằng もう Vました / まだ Vていません.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if not w["word"].startswith("〜")], lesson=L)
    merge([LESSON])
