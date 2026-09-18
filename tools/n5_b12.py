# -*- coding: utf-8 -*-
"""N5 — Bài 12: So sánh hơn/nhất, どちら, quá khứ tính từ.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 12
pool = Pool("n5")

VOCAB = [
    v(1,  "より", "", "", "yori", "particle", "Hơn (so với)", "N2 より N1 の ほうが A です = N1 A hơn N2.", L),
    v(2,  "ほう", "方", "ほう", "hou", "noun", "Phía, bên (dùng trong so sánh)", "Aの ほうが = phía A thì.", L),
    v(3,  "いちばん", "一番", "いちばん", "ichiban", "noun", "Nhất, số một", "Đứng trước tính từ để so sánh NHẤT trong một tập hợp.", L),
    v(4,  "どちら", "", "", "dochira", "noun", "Cái nào, bên nào (chọn giữa HAI)", "Đã gặp bài 3 — nay dùng trong câu so sánh 2 vật.", L),
    v(5,  "なか", "中", "なか", "naka", "noun", "Trong (một tập hợp)", "この 中で = trong số này.", L),
    v(6,  "きせつ", "季節", "きせつ", "kisetsu", "noun", "Mùa", "四季 = bốn mùa.", L),
    v(7,  "はる", "春", "はる", "haru", "noun", "Mùa xuân", "", L),
    v(8,  "なつ", "夏", "なつ", "natsu", "noun", "Mùa hè", "", L),
    v(9,  "あき", "秋", "あき", "aki", "noun", "Mùa thu", "", L),
    v(10, "ふゆ", "冬", "ふゆ", "fuyu", "noun", "Mùa đông", "", L),
    v(11, "くに", "国", "くに", "kuni", "noun", "Đất nước", "Đã gặp bài 3 — nay dùng làm đối tượng so sánh.", L),
    v(12, "まち", "町", "まち", "machi", "noun", "Thị trấn, phố", "", L),
    v(13, "どうぶつ", "動物", "どうぶつ", "doubutsu", "noun", "Động vật", "動物の 中で 一番 好きです = thích nhất trong các loài động vật.", L),
    v(14, "くだもの", "果物", "くだもの", "kudamono", "noun", "Trái cây", "Đã gặp bài 6.", L),
    v(15, "がいこく", "外国", "がいこく", "gaikoku", "noun", "Nước ngoài", "", L),
    v(16, "せかい", "世界", "せかい", "sekai", "noun", "Thế giới", "世界で 一番 = nhất thế giới.", L),
    v(17, "なつやすみ", "夏休み", "なつやすみ", "natsuyasumi", "noun", "Kỳ nghỉ hè", "Đã gặp bài 4 (休み) — nay ghép cụ thể theo mùa.", L),
    v(18, "たかい", "高い", "たかい", "takai", "adjective", "Cao, đắt", "Đã gặp bài 8 — nay dùng làm ví dụ so sánh và chia quá khứ.", L),
    v(19, "やすい", "安い", "やすい", "yasui", "adjective", "Rẻ", "Đã gặp bài 8.", L),
    v(20, "おおきい", "大きい", "おおきい", "ookii", "adjective", "To, lớn", "Đã gặp bài 8.", L),
]

KANJI = [
    k(1, "春", "XUÂN", 9, ["シュン (shun)"], ["はる"], "Mùa xuân.",
      [("春", "はる", "Mùa xuân"), ("春休み", "はるやすみ", "Kỳ nghỉ xuân"), ("青春", "せいしゅん", "Tuổi trẻ")], L),
    k(2, "夏", "HẠ", 10, ["カ (ka)"], ["なつ"], "Mùa hè.",
      [("夏", "なつ", "Mùa hè"), ("夏休み", "なつやすみ", "Nghỉ hè"), ("初夏", "しょか", "Đầu hè")], L),
    k(3, "秋", "THU", 9, ["シュウ (shuu)"], ["あき"], "Mùa thu.",
      [("秋", "あき", "Mùa thu"), ("秋分", "しゅうぶん", "Thu phân"), ("読書の秋", "どくしょのあき", "Mùa thu đọc sách")], L),
    k(4, "冬", "ĐÔNG", 5, ["トウ (tou)"], ["ふゆ"], "Mùa đông.",
      [("冬", "ふゆ", "Mùa đông"), ("冬休み", "ふゆやすみ", "Nghỉ đông"), ("真冬", "まふゆ", "Giữa mùa đông")], L),
    k(5, "番", "PHIÊN", 12, ["バン (ban)"], [], "Số thứ tự, lượt, phiên trực.",
      [("一番", "いちばん", "Số một"), ("番号", "ばんごう", "Số hiệu"), ("交番", "こうばん", "Đồn công an")], L),
]

SLIDES = [
    slide(L, 1,
        "1. So sánh hơn: N2 より N1 の ほうが A です",
        "N1 は N2 より A です   =   N2 より N1 の ほうが A です",
        "Hai cách nói tương đương: cách 1 đơn giản, cách 2 (dùng ほう) nhấn mạnh và tự nhiên hơn khi "
        "trả lời câu hỏi chọn lựa. より đánh dấu vật ĐEM RA SO SÁNH, đứng sau vật bị so sánh kém hơn.",
        [
            ex(L, 1, 1, [t("t-l12s1-1", "にほん", "日本", "にほん"), t("t-l12s1-2", "は"),
                         t("t-l12s1-3", "ベトナム"), t("t-l12s1-4", "より", key=True),
                         t("t-l12s1-5", "さむい", "寒い", "さむい", key=True), t("t-l12s1-6", "です")],
               "Nhật Bản lạnh hơn Việt Nam."),
            ex(L, 1, 2, [t("t-l12s1-7", "ベトナム"), t("t-l12s1-8", "より", key=True),
                         t("t-l12s1-9", "にほん", "日本", "にほん"), t("t-l12s1-10", "の"),
                         t("t-l12s1-11", "ほう", "方", "ほう", key=True), t("t-l12s1-12", "が"),
                         t("t-l12s1-13", "さむい", "寒い", "さむい"), t("t-l12s1-14", "です")],
               "So với Việt Nam thì Nhật Bản lạnh hơn."),
        ],
        tips="ほう nghĩa đen là 'phía, bên' — câu dùng ほう nghe tự nhiên hơn khi đang so sánh chọn lựa giữa hai thứ.",
        culture="Nói xấu/so sánh hạ thấp quê hương người khác bị coi là bất lịch sự — nên dùng câu so sánh trung tính, tránh chê bai."),

    slide(L, 2,
        "2. Chọn giữa hai vật: A と B と、どちらが 〜ですか",
        "A と B と、どちら が [tính từ] ですか",
        "Khi chỉ có HAI lựa chọn, dùng どちら (không dùng 何 hay だれ). Trả lời bằng cấu trúc ほう "
        "đã học ở slide 1, hoặc nói thẳng tên vật kèm ほうが.",
        [
            ex(L, 2, 1, [t("t-l12s2-1", "はる", "春", "はる"), t("t-l12s2-2", "と"), t("t-l12s2-3", "あき", "秋", "あき"),
                         t("t-l12s2-4", "と"), t("t-l12s2-5", "、"), t("t-l12s2-6", "どちら", key=True),
                         t("t-l12s2-7", "が"), t("t-l12s2-8", "すき", "好き", "すき"), t("t-l12s2-9", "ですか")],
               "Giữa mùa xuân và mùa thu, anh thích cái nào hơn?"),
            ex(L, 2, 2, [t("t-l12s2-10", "あき", "秋", "あき"), t("t-l12s2-11", "の"),
                         t("t-l12s2-12", "ほう", "方", "ほう", key=True), t("t-l12s2-13", "が"),
                         t("t-l12s2-14", "すき", "好き", "すき"), t("t-l12s2-15", "です")],
               "Tôi thích mùa thu hơn."),
        ],
        tips="Trả lời câu hỏi どちら bắt buộc phải dùng ほう — không được lược bỏ như câu so sánh thường ở slide 1.",
        culture="Câu hỏi どちらが好きですか rất phổ biến trong giao tiếp xã giao Nhật để mở đầu chuyện trò."),

    slide(L, 3,
        "3. So sánh nhất: N の 中で N が いちばん A です",
        "[Tập hợp] の 中で + [vật] が + いちばん + [tính từ] + です",
        "いちばん (nhất) đứng ngay trước tính từ, không cần trợ từ nối. Tập hợp so sánh đánh dấu "
        "bằng の中で (trong số...) — khác cấu trúc hơn ở slide 1-2 vốn chỉ so sánh hai vật.",
        [
            ex(L, 3, 1, [t("t-l12s3-1", "きせつ", "季節", "きせつ"), t("t-l12s3-2", "の"),
                         t("t-l12s3-3", "なか", "中", "なか", key=True), t("t-l12s3-4", "で", key=True),
                         t("t-l12s3-5", "なつ", "夏", "なつ"), t("t-l12s3-6", "が"),
                         t("t-l12s3-7", "いちばん", "一番", "いちばん", key=True), t("t-l12s3-8", "すき", "好き", "すき"), t("t-l12s3-9", "です")],
               "Trong các mùa, tôi thích mùa hè nhất."),
            ex(L, 3, 2, [t("t-l12s3-10", "せかい", "世界", "せかい"), t("t-l12s3-11", "で", key=True),
                         t("t-l12s3-12", "どの"), t("t-l12s3-13", "くに", "国", "くに"), t("t-l12s3-14", "が"),
                         t("t-l12s3-15", "いちばん", "一番", "いちばん", key=True), t("t-l12s3-16", "おおきい", "大きい", "おおきい"),
                         t("t-l12s3-17", "ですか")],
               "Nước nào lớn nhất thế giới?"),
        ],
        tips="Phân biệt rõ の中で (trong một tập hợp cụ thể) và で trơn (phạm vi rộng như 世界で) — cả hai đều đi với いちばん.",
        culture="Hỏi 「どの国が一番好きですか」 là câu hỏi xã giao phổ biến khi gặp người nước ngoài lần đầu."),

    slide(L, 4,
        "4. Quá khứ của tính từ",
        "A-い → A-かった / A-な・N → A-でした   (phủ định: A-くなかった / A-じゃ ありませんでした)",
        "Tính từ い chia quá khứ bằng cách đổi い → かった. Tính từ な/danh từ chia như です → でした. "
        "Hai quy tắc HOÀN TOÀN KHÁC NHAU — không được áp dụng chéo.",
        [
            ex(L, 4, 1, [t("t-l12s4-1", "きのう", "昨日", "きのう"), t("t-l12s4-2", "は"),
                         t("t-l12s4-3", "あつかった", "暑かった", "あつかった", key=True), t("t-l12s4-4", "です")],
               "Hôm qua trời nóng. (暑い → 暑かった)"),
            ex(L, 4, 2, [t("t-l12s4-5", "せんしゅう", "先週", "せんしゅう"), t("t-l12s4-6", "は"),
                         t("t-l12s4-7", "しずか", "静か", "しずか"), t("t-l12s4-8", "でした", key=True)],
               "Tuần trước yên tĩnh. (静か là tính từ な → でした)"),
            ex(L, 4, 3, [t("t-l12s4-9", "テスト"), t("t-l12s4-10", "は"),
                         t("t-l12s4-11", "むずかしくなかった", "難しくなかった", "むずかしくなかった", key=True), t("t-l12s4-12", "です")],
               "Bài kiểm tra đã không khó. (phủ định quá khứ tính từ い)"),
        ],
        tips="Mẹo nhớ: TÍNH TỪ い tự chia đuôi (かった), TÍNH TỪ な mượn です/でした như danh từ — không bao giờ trộn lẫn.",
        culture="いい (tốt) là ngoại lệ: quá khứ phải quay về gốc よい rồi mới chia → よかった, không nói いかった."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d-l12-1", "サントスさん"), t("d-l12-2", "は"), t("d-l12-3", "はる", "春", "はる"),
          t("d-l12-4", "と"), t("d-l12-5", "あき", "秋", "あき"), t("d-l12-6", "と"), t("d-l12-7", "、"),
          t("d-l12-8", "どちら", "どちら", "どちら", key=True), t("d-l12-9", "が"), t("d-l12-10", "すき", "好き", "すき"), t("d-l12-11", "ですか")],
         "Anh Santos thích mùa xuân hay mùa thu hơn?"),
    line(L, 2, "サントス", "Sinh viên",
         [t("d-l12-12", "あき", "秋", "あき"), t("d-l12-13", "の"), t("d-l12-14", "ほう", "方", "ほう", key=True),
          t("d-l12-15", "が"), t("d-l12-16", "すき", "好き", "すき"), t("d-l12-17", "です")],
         "Tôi thích mùa thu hơn."),
    line(L, 3, "ワン", "Sinh viên",
         [t("d-l12-18", "どうして", "どうして", "どうして"), t("d-l12-19", "ですか")],
         "Vì sao vậy?"),
    line(L, 4, "サントス", "Sinh viên",
         [t("d-l12-20", "なつ", "夏", "なつ"), t("d-l12-21", "より", key=True), t("d-l12-22", "あき", "秋", "あき"),
          t("d-l12-23", "の"), t("d-l12-24", "ほう", "方", "ほう"), t("d-l12-25", "が"),
          t("d-l12-26", "すずしい", "涼しい", "すずしい"), t("d-l12-27", "です"), t("d-l12-28", "から")],
         "Vì mùa thu mát hơn mùa hè."),
    line(L, 5, "ワン", "Sinh viên",
         [t("d-l12-29", "きせつ", "季節", "きせつ", key=True), t("d-l12-30", "の"), t("d-l12-31", "なか", "中", "なか", key=True),
          t("d-l12-32", "で", key=True), t("d-l12-33", "いちばん", "一番", "いちばん", key=True), t("d-l12-34", "なに", "何", "なに"),
          t("d-l12-35", "が"), t("d-l12-36", "すき", "好き", "すき"), t("d-l12-37", "ですか")],
         "Trong các mùa, anh thích mùa nào nhất?"),
    line(L, 6, "サントス", "Sinh viên",
         [t("d-l12-38", "あき", "秋", "あき"), t("d-l12-39", "が"), t("d-l12-40", "いちばん", "一番", "いちばん", key=True),
          t("d-l12-41", "すき", "好き", "すき"), t("d-l12-42", "です")],
         "Mùa thu là thích nhất."),
    line(L, 7, "ワン", "Sinh viên",
         [t("d-l12-43", "きょねん", "去年", "きょねん"), t("d-l12-44", "の"), t("d-l12-45", "なつ", "夏", "なつ"),
          t("d-l12-46", "は"), t("d-l12-47", "どうでしたか")],
         "Mùa hè năm ngoái thế nào?"),
    line(L, 8, "サントス", "Sinh viên",
         [t("d-l12-48", "とても"), t("d-l12-49", "あつかった", "暑かった", "あつかった", key=True), t("d-l12-50", "です")],
         "Nóng lắm."),
    line(L, 9, "ワン", "Sinh viên",
         [t("d-l12-51", "そうですか"), t("d-l12-52", "。"), t("d-l12-53", "ベトナム"), t("d-l12-54", "の"),
          t("d-l12-55", "なつ", "夏", "なつ"), t("d-l12-56", "は"), t("d-l12-57", "にほん", "日本", "にほん"),
          t("d-l12-58", "より", key=True), t("d-l12-59", "あつい", "暑い", "あつい", key=True), t("d-l12-60", "ですか")],
         "Vậy à. Mùa hè Việt Nam nóng hơn Nhật Bản à?"),
    line(L, 10, "サントス", "Sinh viên",
         [t("d-l12-61", "はい"), t("d-l12-62", "、"), t("d-l12-63", "ベトナム"), t("d-l12-64", "の"),
          t("d-l12-65", "ほう", "方", "ほう", key=True), t("d-l12-66", "が"), t("d-l12-67", "もっと"),
          t("d-l12-68", "あつい", "暑い", "あつい"), t("d-l12-69", "です")],
         "Vâng, Việt Nam nóng hơn nhiều."),
]

EXERCISES = [
    q(L, 1, "「日本は ベトナムより 寒いです」 — より có vai trò gì?",
      ["Đánh dấu vật đem ra so sánh (Việt Nam)", "Đánh dấu chủ ngữ",
       "Đánh dấu tân ngữ", "Đánh dấu nơi chốn"], 0,
      "より đứng sau vật bị so sánh (Việt Nam) và trước tính từ so sánh (寒い) — đây là 'điểm chuẩn' để so sánh.",
      "Xem vị trí より trong câu."),
    q(L, 2, "Câu hỏi chọn giữa HAI vật dùng từ để hỏi nào?",
      ["どちら", "何", "だれ", "どの"], 0,
      "どちら chuyên dùng khi chỉ có HAI lựa chọn. Từ ba lựa chọn trở lên mới dùng いちばん/何/どの.",
      "Đây là quy tắc riêng cho trường hợp hai lựa chọn."),
    q(L, 3, "「季節の中で 夏が 一番 好きです」 — cấu trúc の中で dùng khi:",
      ["So sánh NHẤT trong một tập hợp từ ba vật trở lên",
       "So sánh giữa hai vật", "Chỉ dùng cho câu phủ định",
       "Chỉ dùng cho câu hỏi"], 0,
      "の中で + いちばん là cấu trúc so sánh NHẤT, khác với より (so sánh hơn, hai vật) đã học ở slide 1.",
      "So sánh với cấu trúc より ở đầu bài."),
    q(L, 4, "Quá khứ của 暑い (nóng) là:",
      ["暑かった", "暑でした", "暑いでした", "暑くでした"], 0,
      "Tính từ đuôi い chia quá khứ bằng cách bỏ い, thêm かった: 暑い → 暑かった.",
      "Đây là quy tắc riêng của tính từ い."),
    q(L, 5, "Quá khứ của 静か (yên tĩnh, tính từ な) là:",
      ["静かでした", "静かかった", "静かくでした", "静かじゃかった"], 0,
      "Tính từ な chia quá khứ như danh từ: bỏ な, thêm でした. KHÁC HOÀN TOÀN quy tắc かった của tính từ い.",
      "So sánh với câu 4 để thấy sự khác biệt."),
    q(L, 6, "Quá khứ của いい (tốt) là:",
      ["よかった", "いかった", "いいかった", "よいでした"], 0,
      "いい là ngoại lệ: phải quay về gốc よい rồi mới chia quá khứ → よかった.",
      "Giống ngoại lệ đã học ở bài 8 khi chia phủ định."),
    q(L, 7, "Trả lời câu hỏi 「AとBと、どちらが好きですか」 nên dùng cấu trúc nào?",
      ["Aの ほうが 好きです", "Aが 一番 好きです",
       "Aは 好きです", "Aより 好きです"], 0,
      "Câu hỏi dùng どちら thì câu trả lời PHẢI dùng ほうが để tương ứng — đây là cặp cố định.",
      "Xem lại slide 2."),
    q(L, 8, "「ベトナムの夏は 日本より 暑いです」 nghĩa là:",
      ["Mùa hè Việt Nam nóng hơn Nhật Bản", "Mùa hè Nhật Bản nóng hơn Việt Nam",
       "Mùa hè hai nước nóng như nhau", "Mùa hè Việt Nam không nóng"], 0,
      "N1は N2より A です: chủ ngữ (mùa hè Việt Nam) có tính chất A (nóng) HƠN so với N2 (Nhật Bản).",
      "Xem chủ ngữ đứng đầu câu."),
    q(L, 9, "もっと trong 「ベトナムの方が もっと 暑いです」 có nghĩa gần với:",
      ["Hơn nữa, càng thêm (nhấn mạnh mức độ so sánh)", "Ít hơn",
       "Bằng nhau", "Đối lập hoàn toàn"], 0,
      "もっと nhấn mạnh thêm mức độ so sánh hơn, giống 'hơn nhiều' trong tiếng Việt.",
      "Xem ngữ cảnh câu cuối hội thoại."),
    q(L, 10, "Trong hội thoại, Santos thích mùa nào nhất?",
      ["Mùa thu", "Mùa hè", "Mùa xuân", "Mùa đông"], 0,
      "Santos trả lời 秋が一番好きです ở giữa hội thoại.",
      "Xem lại câu thoại thứ 6."),
]

LESSON = lesson(
    L,
    "Bài 12: So sánh (N1 は N2 より A です / どちら / いちばん)",
    "Cấu trúc so sánh hơn với より và ほう, cách hỏi-đáp chọn giữa hai vật bằng どちら, so sánh "
    "nhất trong một tập hợp bằng の中で…いちばん, và hai quy tắc chia quá khứ khác nhau của "
    "tính từ い (かった) và tính từ な/danh từ (でした).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
