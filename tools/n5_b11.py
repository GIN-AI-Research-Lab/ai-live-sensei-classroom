# -*- coding: utf-8 -*-
"""N5 — Bài 11: Lượng từ & số đếm thuần Nhật, tần suất hành động.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 11
pool = Pool("n5")

VOCAB = [
    v(1,  "ひとつ", "一つ", "ひとつ", "hitotsu", "noun", "Một cái (số đếm thuần Nhật)", "Dùng đếm vật chung chung, không cần lượng từ riêng.", L),
    v(2,  "ふたつ", "二つ", "ふたつ", "futatsu", "noun", "Hai cái", "", L),
    v(3,  "いつつ", "五つ", "いつつ", "itsutsu", "noun", "Năm cái", "", L),
    v(4,  "ここのつ", "九つ", "ここのつ", "kokonotsu", "noun", "Chín cái", "", L),
    v(5,  "とお", "十", "とお", "too", "noun", "Mười cái", "Từ 11 trở đi dùng số đếm thường + つ không còn áp dụng, chuyển sang lượng từ riêng.", L),
    v(6,  "いくつ", "", "", "ikutsu", "noun", "Mấy cái, bao nhiêu (hỏi số lượng)", "Khác いくら (hỏi giá tiền, đã học bài 3).", L),
    v(7,  "〜こ", "〜個", "〜こ", "-ko", "noun", "~ cái (lượng từ vật nhỏ, tròn)", "りんごが 三個 = ba quả táo.", L),
    v(8,  "〜まい", "〜枚", "〜まい", "-mai", "noun", "~ tờ, ~ tấm (lượng từ vật mỏng, phẳng)", "紙が 二枚 = hai tờ giấy.", L),
    v(9,  "〜だい", "〜台", "〜だい", "-dai", "noun", "~ chiếc (lượng từ máy móc, xe cộ)", "車が 一台 = một chiếc xe.", L),
    v(10, "〜さつ", "〜冊", "〜さつ", "-satsu", "noun", "~ quyển (lượng từ sách vở)", "本が 三冊 = ba quyển sách.", L),
    v(11, "〜じん", "〜人", "〜じん", "-jin", "noun", "~ người (đếm số người)", "1人 ひとり, 2人 ふたり là ngoại lệ, từ 3人 trở đi theo quy tắc さんにん.", L),
    v(12, "〜かい", "〜回", "〜かい", "-kai", "noun", "~ lần (đếm số lần xảy ra)", "一週間に 三回 = ba lần một tuần.", L),
    v(13, "かみ", "紙", "かみ", "kami", "noun", "Giấy", "紙を 二枚 ください = cho tôi hai tờ giấy.", L),
    v(14, "きって", "切手", "きって", "kitte", "noun", "Tem thư", "切手を 三枚 買います = mua ba con tem.", L),
    v(15, "ふうとう", "封筒", "ふうとう", "fuutou", "noun", "Phong bì", "", L),
    v(16, "きっぷ", "切符", "きっぷ", "kippu", "noun", "Vé (tàu, xe)", "切符を 一枚 買います = mua một vé.", L),
    v(17, "おさら", "お皿", "おさら", "osara", "noun", "Cái đĩa", "お皿が 五枚 あります = có năm cái đĩa.", L),
    v(18, "たまご", "卵", "たまご", "tamago", "noun", "Quả trứng", "卵を 六個 買います = mua sáu quả trứng.", L),
    v(19, "えんぴつ", "鉛筆", "えんぴつ", "enpitsu", "noun", "Bút chì", "Đã gặp bài 2 — nay dùng làm ví dụ đếm vật dài (thực ra đếm 本 nhưng ở đây dùng つ để đơn giản hoá).", L),
    v(20, "がいこくじん", "外国人", "がいこくじん", "gaikokujin", "noun", "Người nước ngoài", "外国人が 三人 います = có ba người nước ngoài.", L),
    v(21, "おとな", "大人", "おとな", "otona", "noun", "Người lớn", "大人が 二人 = hai người lớn.", L),
    v(22, "しつもん", "質問", "しつもん", "shitsumon", "noun", "Câu hỏi", "質問が 一つ あります = có một câu hỏi.", L),
    v(23, "いっしゅうかん", "一週間", "いっしゅうかん", "isshuukan", "noun", "Một tuần (khoảng thời gian)", "一週間に 三回 = ba lần trong một tuần.", L),
]

KANJI = [
    k(1, "回", "HỒI", 6, ["カイ (kai)"], ["まわ(る)"], "Vòng, lần. Hình chữ hồi (xoáy ốc).",
      [("一回", "いっかい", "Một lần"), ("回ります", "まわります", "Xoay vòng"), ("今回", "こんかい", "Lần này")], L),
    k(2, "枚", "MAI", 8, ["マイ (mai)"], [], "Lượng từ đếm vật mỏng, phẳng.",
      [("二枚", "にまい", "Hai tờ"), ("切符", "きっぷ", "Vé (từ ghép)"), ("紙", "かみ", "Giấy (từ ghép)")], L),
    k(3, "台", "ĐÀI", 5, ["ダイ (dai)"], [], "Bệ, đài; lượng từ đếm máy móc, xe cộ.",
      [("一台", "いちだい", "Một chiếc (máy/xe)"), ("台所", "だいどころ", "Nhà bếp"), ("台風", "たいふう", "Bão")], L),
    k(4, "個", "CÁ", 10, ["コ (ko)"], [], "Lượng từ đếm vật nhỏ, tròn nói chung.",
      [("三個", "さんこ", "Ba cái"), ("個人", "こじん", "Cá nhân"), ("一個", "いっこ", "Một cái")], L),
    k(5, "冊", "SÁCH", 5, ["サツ (satsu)"], [], "Lượng từ đếm sách vở.",
      [("三冊", "さんさつ", "Ba quyển"), ("一冊", "いっさつ", "Một quyển"), ("冊子", "さっし", "Tập sách nhỏ")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Số đếm thuần Nhật: ひとつ〜とお",
        "ひとつ、ふたつ、みっつ…ここのつ、とお",
        "Từ 1 đến 10 có một bộ số đếm THUẦN NHẬT riêng, dùng được cho HẦU HẾT mọi vật mà không cần "
        "nhớ lượng từ. Từ 11 trở đi PHẢI chuyển sang số Hán + lượng từ riêng theo loại vật.",
        [
            ex(L, 1, 1, [t("t-l11s1-1", "りんご", "林檎", "りんご"), t("t-l11s1-2", "を"),
                         t("t-l11s1-3", "みっつ", "三つ", "みっつ", key=True), t("t-l11s1-4", "ください")],
               "Cho tôi ba quả táo."),
            ex(L, 1, 2, [t("t-l11s1-5", "しつもん", "質問", "しつもん"), t("t-l11s1-6", "が"),
                         t("t-l11s1-7", "ひとつ", "一つ", "ひとつ", key=True), t("t-l11s1-8", "あります", "有ります", "あります")],
               "Tôi có một câu hỏi."),
            ex(L, 1, 3, [t("t-l11s1-9", "たまご", "卵", "たまご"), t("t-l11s1-10", "が"),
                         t("t-l11s1-11", "いくつ", key=True), t("t-l11s1-12", "ありますか", "有りますか", "ありますか")],
               "Có mấy quả trứng vậy?"),
        ],
        tips="Dùng số đếm thuần Nhật là cách AN TOÀN nhất khi chưa nhớ lượng từ riêng — áp dụng được với hầu hết đồ vật từ 1-10.",
        culture="いくつ còn dùng để hỏi TUỔI một cách thân mật: お子さんは おいくつですか (con anh mấy tuổi)."),

    slide(L, 2,
        "2. Lượng từ theo loại vật: [số Hán] + Lượng từ",
        "〜個 (vật nhỏ tròn) / 〜枚 (vật mỏng) / 〜台 (máy móc) / 〜冊 (sách) / 〜人 (người)",
        "Mỗi loại vật có LƯỢNG TỪ RIÊNG đi kèm số đếm Hán-Nhật (いち、に、さん…). Chọn sai lượng từ "
        "vẫn hiểu được nhưng nghe rất kỳ — đây là điểm cần luyện nhiều nhất ở bài này.",
        [
            ex(L, 2, 1, [t("t-l11s2-1", "かみ", "紙", "かみ"), t("t-l11s2-2", "を"),
                         t("t-l11s2-3", "にまい", "二枚", "にまい", key=True), t("t-l11s2-4", "ください")],
               "Cho tôi hai tờ giấy."),
            ex(L, 2, 2, [t("t-l11s2-5", "くるま", "車", "くるま"), t("t-l11s2-6", "が"),
                         t("t-l11s2-7", "いちだい", "一台", "いちだい", key=True), t("t-l11s2-8", "あります", "有ります", "あります")],
               "Có một chiếc xe."),
            ex(L, 2, 3, [t("t-l11s2-9", "ほん", "本", "ほん"), t("t-l11s2-10", "を"),
                         t("t-l11s2-11", "さんさつ", "三冊", "さんさつ", key=True), t("t-l11s2-12", "かいました", "買いました", "かいました")],
               "Tôi đã mua ba quyển sách."),
        ],
        tips="Nhớ biến âm: 一 + 枚/回 không biến âm nhưng 一 + 個/台 có biến âm nhẹ (いっこ、いちだい cần kiểm tra riêng từng cặp).",
        culture="外国人 học tiếng Nhật thường sợ nhất phần lượng từ vì tiếng Việt chỉ có MỘT từ 'cái' dùng chung cho mọi vật."),

    slide(L, 3,
        "3. Vị trí lượng từ trong câu",
        "N + が/を + [số + lượng từ] + V   (lượng từ đứng SAU trợ từ, KHÔNG đứng ngay sau danh từ)",
        "Khác tiếng Việt (ba quả táo — số đứng trước danh từ), tiếng Nhật đặt CỤM SỐ LƯỢNG sau trợ "
        "từ が/を, ngay trước động từ — không chen vào giữa danh từ và trợ từ.",
        [
            ex(L, 3, 1, [t("t-l11s3-1", "きって", "切手", "きって"), t("t-l11s3-2", "を"),
                         t("t-l11s3-3", "さんまい", "三枚", "さんまい", key=True), t("t-l11s3-4", "かいました", "買いました", "かいました")],
               "Tôi đã mua ba con tem. (KHÔNG nói 三枚の切手を)"),
            ex(L, 3, 2, [t("t-l11s3-5", "きょうしつ", "教室", "きょうしつ"), t("t-l11s3-6", "に"),
                         t("t-l11s3-7", "がくせい", "学生", "がくせい"), t("t-l11s3-8", "が"),
                         t("t-l11s3-9", "じゅうにん", "十人", "じゅうにん", key=True), t("t-l11s3-10", "います", "居ます", "います")],
               "Trong lớp học có mười học sinh."),
        ],
        tips="Lỗi hay gặp: 「三枚の切手を 買いました」 nghe không tự nhiên — chỉ dùng cấu trúc の khi muốn NHẤN MẠNH đặc biệt.",
        culture="Khi mua vé tàu, nhân viên ga thường xác nhận lại bằng cách lặp lại số lượng: 切符、二枚ですね."),

    slide(L, 4,
        "4. Tần suất: 一週間に〜回",
        "[khoảng thời gian] + に + [số] + 回",
        "に ở đây đóng vai trò 'trong mỗi', đánh dấu ĐƠN VỊ THỜI GIAN để tính tần suất — khác に chỉ "
        "thời điểm (bài 4) hay nơi tồn tại (bài 10), nhưng cùng một chữ.",
        [
            ex(L, 4, 1, [t("t-l11s4-1", "いっしゅうかん", "一週間", "いっしゅうかん"), t("t-l11s4-2", "に", key=True),
                         t("t-l11s4-3", "さんかい", "三回", "さんかい", key=True), t("t-l11s4-4", "べんきょう", "勉強", "べんきょう"),
                         t("t-l11s4-5", "します")],
               "Một tuần tôi học ba lần."),
            ex(L, 4, 2, [t("t-l11s4-6", "いっかげつ", "一か月", "いっかげつ"), t("t-l11s4-7", "に", key=True),
                         t("t-l11s4-8", "なんかい", "何回", "なんかい", key=True), t("t-l11s4-9", "えいが", "映画", "えいが"),
                         t("t-l11s4-10", "を"), t("t-l11s4-11", "みますか", "見ますか", "みますか")],
               "Một tháng anh xem phim mấy lần?"),
        ],
        tips="Thứ tự luôn là [khoảng thời gian]に[số回] — không đảo ngược, không thiếu に.",
        culture="Người Nhật hay hỏi tần suất tập thể dục/ăn ngoài như một câu xã giao thông thường: 週に何回 ジムに行きますか."),
]

DIALOGUE = [
    line(L, 1, "店員", "Nhân viên cửa hàng",
         [t("d-l11-1", "いらっしゃいませ"), t("d-l11-2", "。"), t("d-l11-3", "なに", "何", "なに", key=True),
          t("d-l11-4", "が"), t("d-l11-5", "ひつよう", "必要", "ひつよう"), t("d-l11-6", "ですか")],
         "Kính chào quý khách. Quý khách cần gì ạ?"),
    line(L, 2, "ミラー", "Khách hàng",
         [t("d-l11-7", "きって", "切手", "きって", key=True), t("d-l11-8", "を"), t("d-l11-9", "さんまい", "三枚", "さんまい", key=True),
          t("d-l11-10", "ください")],
         "Cho tôi ba con tem."),
    line(L, 3, "店員", "Nhân viên cửa hàng",
         [t("d-l11-11", "はい"), t("d-l11-12", "、"), t("d-l11-13", "どうぞ")],
         "Vâng, đây ạ."),
    line(L, 4, "ミラー", "Khách hàng",
         [t("d-l11-14", "ふうとう", "封筒", "ふうとう", key=True), t("d-l11-15", "も"), t("d-l11-16", "ひとつ", "一つ", "ひとつ", key=True),
          t("d-l11-17", "ください")],
         "Cho tôi thêm một cái phong bì nữa."),
    line(L, 5, "店員", "Nhân viên cửa hàng",
         [t("d-l11-18", "かしこまりました", "畏まりました", "かしこまりました"), t("d-l11-19", "。"),
          t("d-l11-20", "ほか", "他", "ほか"), t("d-l11-21", "に"), t("d-l11-22", "なにか", "何か", "なにか")],
         "Vâng, tôi hiểu ạ. Còn cần gì khác không ạ?"),
    line(L, 6, "ミラー", "Khách hàng",
         [t("d-l11-23", "かみ", "紙", "かみ", key=True), t("d-l11-24", "は"), t("d-l11-25", "ありますか", "有りますか", "ありますか")],
         "Ở đây có bán giấy không ạ?"),
    line(L, 7, "店員", "Nhân viên cửa hàng",
         [t("d-l11-26", "はい"), t("d-l11-27", "、"), t("d-l11-28", "あります", "有ります", "あります"), t("d-l11-29", "。"),
          t("d-l11-30", "なんまい", "何枚", "なんまい", key=True), t("d-l11-31", "ですか")],
         "Dạ có ạ. Quý khách muốn mấy tờ?"),
    line(L, 8, "ミラー", "Khách hàng",
         [t("d-l11-32", "じゅうまい", "十枚", "じゅうまい", key=True), t("d-l11-33", "おねがいします", "お願いします", "おねがいします")],
         "Cho tôi mười tờ."),
    line(L, 9, "店員", "Nhân viên cửa hàng",
         [t("d-l11-34", "かしこまりました", "畏まりました", "かしこまりました"), t("d-l11-35", "。"),
          t("d-l11-36", "ぜんぶ", "全部", "ぜんぶ"), t("d-l11-37", "で"), t("d-l11-38", "せんえん", "千円", "せんえん"),
          t("d-l11-39", "です")],
         "Vâng ạ. Tất cả là 1.000 yên ạ."),
    line(L, 10, "ミラー", "Khách hàng",
         [t("d-l11-40", "はい"), t("d-l11-41", "、"), t("d-l11-42", "どうぞ")],
         "Vâng, đây ạ."),
]

EXERCISES = [
    q(L, 1, "Đếm 'ba quả táo' theo số đếm thuần Nhật:",
      ["りんごを みっつ", "りんごを さんこ", "りんごを さんつ", "りんごを みっこ"], 0,
      "みっつ (ba cái) là số đếm thuần Nhật, dùng được cho vật chung chung như táo mà không cần lượng từ riêng.",
      "Đây thuộc bộ ひとつ〜とお."),
    q(L, 2, "Đếm sách dùng lượng từ nào?",
      ["〜冊", "〜枚", "〜個", "〜台"], 0,
      "〜冊 là lượng từ riêng cho sách, tạp chí, các ấn phẩm đóng thành tập.",
      "Xem bảng lượng từ theo loại vật."),
    q(L, 3, "Đếm xe hơi, máy tính dùng lượng từ nào?",
      ["〜台", "〜個", "〜枚", "〜人"], 0,
      "〜台 dùng cho máy móc và phương tiện: xe hơi, tivi, máy tính, xe đạp.",
      "Vật có động cơ hoặc là thiết bị."),
    q(L, 4, "Câu nào ĐÚNG trật tự từ?",
      ["切手を 三枚 買いました", "三枚の 切手を 買いました",
       "切手 三枚を 買いました", "三枚 切手を 買いました"], 0,
      "Cụm số lượng đứng SAU trợ từ を, ngay trước động từ — đây là trật tự tự nhiên nhất trong tiếng Nhật.",
      "So sánh với trật tự 'ba con tem' trong tiếng Việt."),
    q(L, 5, "「一週間に 三回」 nghĩa là:",
      ["Ba lần một tuần", "Tuần thứ ba", "Ba tuần một lần", "Lúc ba giờ trong tuần"], 0,
      "[khoảng thời gian] + に + [số + 回] diễn tả TẦN SUẤT trong một đơn vị thời gian.",
      "に ở đây có nghĩa 'trong mỗi'."),
    q(L, 6, "いくつ và いくら khác nhau ở chỗ:",
      ["いくつ hỏi SỐ LƯỢNG, いくら hỏi GIÁ TIỀN", "Cả hai đều hỏi giá",
       "Cả hai đều hỏi số lượng", "Không khác gì nhau"], 0,
      "いくつ (bao nhiêu CÁI) và いくら (bao nhiêu TIỀN, đã học ở bài 3) dễ nhầm vì phát âm gần giống.",
      "Xem lại bài 3 về いくら."),
    q(L, 7, "Đếm người theo cách đặc biệt (không theo quy tắc) ở số 1 và 2 là:",
      ["ひとり、ふたり", "いちじん、ににん", "ひとつじん、ふたつじん", "いちにん、ふたつ"], 0,
      "1人 và 2人 đọc đặc biệt là ひとり、ふたり — từ 3人 trở đi mới theo quy tắc さんにん、よにん…",
      "Đây là hai ngoại lệ phải học thuộc riêng."),
    q(L, 8, "Muốn hỏi 'có mấy quả trứng', câu nào ĐÚNG?",
      ["卵が いくつ ありますか", "卵が いくら ありますか",
       "卵が なんじ ありますか", "卵が どこ ありますか"], 0,
      "いくつ hỏi số lượng vật đếm được bằng bộ ひとつ〜とお hoặc lượng từ riêng.",
      "Không phải hỏi giá, giờ, hay nơi chốn."),
    q(L, 9, "Từ 11 trở đi, cách đếm vật thay đổi thế nào?",
      ["Chuyển sang số Hán (じゅういち…) + lượng từ riêng theo loại vật",
       "Vẫn dùng ひとつ〜とお như cũ", "Không đếm được nữa",
       "Chỉ dùng được với người"], 0,
      "Bộ ひとつ〜とお chỉ có đến 10. Từ 11 trở lên bắt buộc dùng số Hán-Nhật kết hợp lượng từ riêng.",
      "Đây là giới hạn của bộ số đếm thuần Nhật."),
    q(L, 10, "Trong hội thoại, khách hàng mua tổng cộng những gì?",
      ["3 con tem, 1 phong bì, 10 tờ giấy", "5 con tem, 2 phong bì",
       "10 con tem, 1 tờ giấy", "3 phong bì, 10 con tem"], 0,
      "Khách lần lượt mua 切手を三枚, 封筒も一つ, và 紙を十枚.",
      "Xem lại toàn bộ hội thoại theo thứ tự."),
]

LESSON = lesson(
    L,
    "Bài 11: Lượng từ & Số đếm (〜つ, 〜枚, 〜台, 〜人 & Tần suất)",
    "Số đếm thuần Nhật ひとつ〜とお dùng cho vật chung chung, lượng từ riêng theo loại vật "
    "(個/枚/台/冊/人) kết hợp số Hán, vị trí cụm số lượng đứng sau trợ từ が/を, và cách nói "
    "tần suất bằng [khoảng thời gian]に[số]回.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if not w["word"].startswith("〜")], lesson=L)
    merge([LESSON])
