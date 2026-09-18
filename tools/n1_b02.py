# -*- coding: utf-8 -*-
"""N1 — Bai 2: Cam xuc khong the kim nen にたえない (thuong cam/xuc dong, hoac "khong no" voi
dong tu) va を禁じ得ない (phan no/kinh ngac).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 2
pool = Pool("n1")

VOCAB = [
    v(1,  "しょうげき", "衝撃", "しょうげき", "shougeki", "noun", "Chấn động, cú sốc", "衝撃を 禁じ得ません = không thể kìm nén được cú sốc.", L),
    v(2,  "どうじょう", "同情", "どうじょう", "doujou", "noun", "Đồng cảm, thương cảm", "同情に たえません = không kìm được sự thương cảm.", L),
    v(3,  "ふはい", "腐敗", "ふはい", "fuhai", "noun", "Thối nát, tham nhũng", "政治の 腐敗 = sự tham nhũng chính trị.", L),
    v(4,  "ひめい", "悲鳴", "ひめい", "himei", "noun", "Tiếng thét, tiếng kêu la", "悲鳴を あげます = thét lên.", L),
    v(5,  "かんげき", "感激", "かんげき", "kangeki", "noun", "Sự xúc động mạnh", "感激に たえません = không kìm được sự xúc động.", L),
    v(6,  "おどろき", "驚き", "おどろき", "odoroki", "noun", "Sự ngạc nhiên", "驚きを 禁じ得ません = không thể kìm nén được sự ngạc nhiên.", L),
    v(7,  "かなしみ", "悲しみ", "かなしみ", "kanashimi", "noun", "Nỗi buồn", "悲しみに たえません = không kìm được nỗi buồn.", L),
    v(8,  "じけん", "事件", "じけん", "jiken", "noun", "Vụ việc, sự kiện", "衝撃的な 事件 = vụ việc gây chấn động.", L),
    v(9,  "いかり", "怒り", "いかり", "ikari", "noun", "Sự giận dữ", "Đã gặp N3 bài 20.", L),
    v(10, "なみだ", "涙", "なみだ", "namida", "noun", "Nước mắt", "Đã gặp N3 bài 11.", L),
    v(11, "よろこび", "喜び", "よろこび", "yorokobi", "noun", "Niềm vui", "Đã gặp N4 bài 26.", L),
    v(12, "にゅうす", "ニュース", "にゅうす", "nyuusu", "noun", "Tin tức", "Đã gặp N4 bài 26.", L),
    v(13, "じょうきょう", "状況", "じょうきょう", "joukyou", "noun", "Tình huống", "Đã gặp N3 bài 13.", L),
    v(14, "ひさん", "悲惨", "ひさん", "hisan", "adjective", "Bi thảm", "Đã gặp N1 bài 1.", L),
    v(15, "できごと", "出来事", "できごと", "dekigoto", "noun", "Sự việc", "Đã gặp N2 bài 6.", L),
    v(16, "ひと", "人", "ひと", "hito", "noun", "Người", "Đã gặp N5 bài 1.", L),
    v(17, "みます", "見ます", "みます", "mimasu", "verb", "Xem, nhìn", "Đã gặp N4 bài 26.", L),
    v(18, "ききます", "聞きます", "ききます", "kikimasu", "verb", "Nghe", "Đã gặp N4 bài 26.", L),
    v(19, "ようす", "様子", "ようす", "yousu", "noun", "Dáng vẻ, tình trạng", "Đã gặp N4 bài 26.", L),
    v(20, "しゃかい", "社会", "しゃかい", "shakai", "noun", "Xã hội", "Đã gặp N3 bài 5.", L),
]

KANJI = [
    k(1, "衝", "XUNG", 15, ["ショウ (shou)"], [], "Va chạm, xung đột.",
      [("衝撃", "しょうげき", "Chấn động"), ("衝突", "しょうとつ", "Va chạm")], L),
    k(2, "撃", "KÍCH", 15, ["ゲキ (geki)"], ["う(つ)"], "Đánh, tấn công.",
      [("衝撃", "しょうげき", "Chấn động"), ("攻撃", "こうげき", "Tấn công")], L),
    k(3, "腐", "HỦ", 14, ["フ (fu)"], ["くさ(る)"], "Thối rữa, hư hỏng.",
      [("腐敗", "ふはい", "Tham nhũng, thối nát"), ("腐る", "くさる", "Thối rữa")], L),
    k(4, "敗", "BẠI", 11, ["ハイ (hai)"], ["やぶ(れる)"], "Thất bại, hư hỏng.",
      [("腐敗", "ふはい", "Tham nhũng"), ("失敗", "しっぱい", "Thất bại")], L),
    k(5, "鳴", "MINH", 14, ["メイ (mei)"], ["な(く)"], "Kêu, vang.",
      [("悲鳴", "ひめい", "Tiếng thét"), ("鳴きます", "なきます", "Kêu (động vật)")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Không kìm được (thương cảm, xúc động): N(cảm xúc) + にたえない",
        "N(cảm xúc) + にたえない",
        "にたえない gắn sau DANH TỪ CHỈ CẢM XÚC (感激, 同情, 悲しみ) diễn tả 'KHÔNG KÌM ĐƯỢC' cảm "
        "xúc đó — thường dùng cho cảm xúc THƯƠNG CẢM, XÚC ĐỘNG dâng trào mạnh mẽ, văn phong trang trọng.",
        [
            ex(L, 1, 1, [t("t-l2s1-1", "この"), t("t-l2s1-2", "にゅうす", "ニュース", "にゅうす"), t("t-l2s1-3", "を"),
                         t("t-l2s1-4", "きいて", "聞いて", "きいて"), t("t-l2s1-5", "、"), t("t-l2s1-6", "どうじょう", "同情", "どうじょう", key=True),
                         t("t-l2s1-7", "に"), t("t-l2s1-8", "たえません", "堪えません", "たえません", key=True)],
               "Nghe tin này, tôi không kìm được sự thương cảm."),
            ex(L, 1, 2, [t("t-l2s1-9", "かんげき", "感激", "かんげき", key=True), t("t-l2s1-10", "に"),
                         t("t-l2s1-11", "たえない", "堪えない", "たえない", key=True), t("t-l2s1-12", "ようす", "様子", "ようす", key=True),
                         t("t-l2s1-13", "でした")],
               "Trông có vẻ không kìm được sự xúc động."),
        ],
        tips="にたえない theo nghĩa này CHỈ đi với một số danh từ cảm xúc cố định: 感激, 同情, 悲しみ — không tự do ghép với mọi danh từ.",
        culture="Thư cảm ơn trang trọng của người Nhật hay viết: '皆様のご支援、感激にたえません' (sự hỗ trợ của quý vị khiến tôi không kìm được xúc động)."),

    slide(L, 2,
        "2. Không thể kìm nén (phẫn nộ, kinh ngạc): N(cảm xúc mạnh) + を禁じ得ない",
        "N(cảm xúc mạnh) + を禁じ得ない",
        "を禁じ得ない (từ 禁じる 'cấm' + 得ない 'không thể') diễn tả 'KHÔNG THỂ KÌM NÉN' được — "
        "thường dùng cho cảm xúc PHẪN NỘ, KINH NGẠC, ĐAU BUỒN bộc phát mạnh mẽ trước một sự việc TỒI TỆ.",
        [
            ex(L, 2, 1, [t("t-l2s2-1", "その"), t("t-l2s2-2", "ふはい", "腐敗", "ふはい", key=True), t("t-l2s2-3", "に"),
                         t("t-l2s2-4", "いかり", "怒り", "いかり", key=True), t("t-l2s2-5", "を"), t("t-l2s2-6", "きんじ", "禁じ", "きんじ", key=True),
                         t("t-l2s2-7", "えません", "得ません", "えません", key=True)],
               "Trước sự tham nhũng đó, tôi không thể kìm nén được sự phẫn nộ."),
            ex(L, 2, 2, [t("t-l2s2-8", "しょうげき", "衝撃", "しょうげき", key=True), t("t-l2s2-9", "を"),
                         t("t-l2s2-10", "きんじ", "禁じ", "きんじ", key=True), t("t-l2s2-11", "えない", "得ない", "えない", key=True),
                         t("t-l2s2-12", "じけん", "事件", "じけん", key=True), t("t-l2s2-13", "でした")],
               "Đó là một vụ việc không thể kìm nén được cú sốc."),
        ],
        tips="を禁じ得ない mang văn phong RẤT TRANG TRỌNG, chủ yếu xuất hiện trong bài xã luận, phát biểu chính thức khi lên án một sự việc.",
        culture="Xã luận báo Nhật hay viết: '今回の腐敗事件に、国民は怒りを禁じ得ない' (trước vụ tham nhũng lần này, người dân không thể kìm nén được sự phẫn nộ)."),

    slide(L, 3,
        "3. So sánh にたえない (thương cảm) và を禁じ得ない (phẫn nộ)",
        "にたえない: THƯƠNG CẢM, XÚC ĐỘNG (cảm xúc ấm áp)　vs　を禁じ得ない: PHẪN NỘ, KINH NGẠC (cảm xúc dữ dội, tiêu cực)",
        "Cả hai đều diễn tả cảm xúc KHÔNG THỂ KÌM NÉN, nhưng LOẠI CẢM XÚC khác nhau: にたえない "
        "thiên về cảm xúc ẤM ÁP như đồng cảm, xúc động; を禁じ得ない thiên về cảm xúc DỮ DỘI như phẫn nộ, kinh ngạc, đau buồn trước điều xấu.",
        [
            ex(L, 3, 1, [t("t-l2s3-1", "ひさん", "悲惨", "ひさん", key=True), t("t-l2s3-2", "な"), t("t-l2s3-3", "じょうきょう", "状況", "じょうきょう", key=True),
                         t("t-l2s3-4", "を"), t("t-l2s3-5", "みて"), t("t-l2s3-6", "、"), t("t-l2s3-7", "どうじょう", "同情", "どうじょう", key=True),
                         t("t-l2s3-8", "に"), t("t-l2s3-9", "たえません", "堪えません", "たえません", key=True)],
               "Nhìn tình huống bi thảm này, tôi không kìm được sự thương cảm. (ấm áp)"),
            ex(L, 3, 2, [t("t-l2s3-10", "その"), t("t-l2s3-11", "じけん", "事件", "じけん", key=True), t("t-l2s3-12", "に"),
                         t("t-l2s3-13", "おどろき", "驚き", "おどろき", key=True), t("t-l2s3-14", "を"), t("t-l2s3-15", "きんじ", "禁じ", "きんじ", key=True),
                         t("t-l2s3-16", "えません", "得ません", "えません", key=True)],
               "Trước vụ việc đó, tôi không thể kìm nén được sự kinh ngạc. (dữ dội)"),
        ],
        tips="Mẹo: nếu cảm xúc là ĐỒNG CẢM/XÚC ĐỘNG → にたえない; nếu cảm xúc là GIẬN DỮ/KINH NGẠC/ĐAU BUỒN dữ dội → を禁じ得ない.",
        culture="Cả hai đều là ngữ pháp N1 mang văn phong xã luận, phát biểu chính thức — hiếm khi dùng trong hội thoại đời thường."),

    slide(L, 4,
        "4. Nghĩa khác của にたえない: 'không đáng/không nỡ' (V từ điển + にたえない)",
        "V(thể từ điển) + にたえない",
        "Khi gắn sau ĐỘNG TỪ THỂ TỪ ĐIỂN (thay vì danh từ cảm xúc), にたえない mang NGHĨA KHÁC "
        "hẳn: 'KHÔNG ĐÁNG/KHÔNG NỠ' làm hành động đó (thường 見る, 聞く) vì sự việc quá TỆ/THẢM.",
        [
            ex(L, 4, 1, [t("t-l2s4-1", "この"), t("t-l2s4-2", "ひさん", "悲惨", "ひさん", key=True), t("t-l2s4-3", "な"),
                         t("t-l2s4-4", "じょうきょう", "状況", "じょうきょう", key=True), t("t-l2s4-5", "は"),
                         t("t-l2s4-6", "みる", "見る", "みる", key=True), t("t-l2s4-7", "に"), t("t-l2s4-8", "たえない", "堪えない", "たえない", key=True)],
               "Tình huống bi thảm này không nỡ nhìn."),
            ex(L, 4, 2, [t("t-l2s4-9", "かれ", "彼", "かれ"), t("t-l2s4-10", "の"), t("t-l2s4-11", "ひめい", "悲鳴", "ひめい", key=True),
                         t("t-l2s4-12", "は"), t("t-l2s4-13", "きく", "聞く", "きく", key=True), t("t-l2s4-14", "に"),
                         t("t-l2s4-15", "たえなかった", "堪えなかった", "たえなかった", key=True)],
               "Tiếng thét của anh ta không nỡ nghe."),
        ],
        tips="Phân biệt bằng LOẠI TỪ đứng trước にたえない: DANH TỪ CẢM XÚC → 'không kìm được'; ĐỘNG TỪ TỪ ĐIỂN → 'không đáng/không nỡ'.",
        culture="Phóng viên chiến trường Nhật hay viết: 'この光景は見るに堪えない' (cảnh tượng này không nỡ nhìn) khi mô tả hậu quả thảm khốc."),
]

DIALOGUE = [
    line(L, 1, "田中", "Phóng viên",
         [t("d2-1", "きのう", "昨日", "きのう"), t("d2-2", "の"), t("d2-3", "じけん", "事件", "じけん", key=True),
          t("d2-4", "を"), t("d2-5", "きき", "聞き", "きき"), t("d2-6", "ました", "ました", "ました"), t("d2-7", "か")],
         "Bạn có nghe vụ việc hôm qua không?"),
    line(L, 2, "サントス", "Phóng viên",
         [t("d2-8", "はい"), t("d2-9", "。"), t("d2-10", "しょうげき", "衝撃", "しょうげき", key=True), t("d2-11", "を"),
          t("d2-12", "きんじ", "禁じ", "きんじ", key=True), t("d2-13", "えません", "得ません", "えません", key=True)],
         "Vâng. Tôi không thể kìm nén được cú sốc."),
    line(L, 3, "田中", "Phóng viên",
         [t("d2-14", "ひがいしゃ", "被害者", "ひがいしゃ"), t("d2-15", "の"), t("d2-16", "じょうきょう", "状況", "じょうきょう", key=True),
          t("d2-17", "は"), t("d2-18", "どうでしたか")],
         "Tình trạng của nạn nhân thế nào?"),
    line(L, 4, "サントス", "Phóng viên",
         [t("d2-19", "ひさん", "悲惨", "ひさん", key=True), t("d2-20", "で"), t("d2-21", "、"),
          t("d2-22", "どうじょう", "同情", "どうじょう", key=True), t("d2-23", "に"), t("d2-24", "たえません", "堪えません", "たえません", key=True)],
         "Bi thảm lắm, tôi không kìm được sự thương cảm."),
    line(L, 5, "田中", "Phóng viên",
         [t("d2-25", "ふはい", "腐敗", "ふはい", key=True), t("d2-26", "が"), t("d2-27", "げんいん", "原因", "げんいん"),
          t("d2-28", "でした", "でした", "でした"), t("d2-29", "ね")],
         "Nguyên nhân là do tham nhũng nhỉ."),
    line(L, 6, "サントス", "Phóng viên",
         [t("d2-30", "はい"), t("d2-31", "。"), t("d2-32", "しゃかい", "社会", "しゃかい", key=True), t("d2-33", "の"),
          t("d2-34", "いかり", "怒り", "いかり", key=True), t("d2-35", "を"), t("d2-36", "きんじ", "禁じ", "きんじ", key=True),
          t("d2-37", "えない"), t("d2-38", "できごと", "出来事", "できごと", key=True), t("d2-39", "です")],
         "Vâng. Đó là sự việc khiến xã hội không thể kìm nén được sự phẫn nộ."),
    line(L, 7, "田中", "Phóng viên",
         [t("d2-40", "げんば", "現場", "げんば"), t("d2-41", "は"), t("d2-42", "みる", "見る", "みる", key=True),
          t("d2-43", "に"), t("d2-44", "たえません", "堪えません", "たえません", key=True), t("d2-45", "でした", "でした", "でした"), t("d2-46", "か")],
         "Hiện trường có nỡ nhìn không?"),
    line(L, 8, "サントス", "Phóng viên",
         [t("d2-47", "はい"), t("d2-48", "。"), t("d2-49", "ひめい", "悲鳴", "ひめい", key=True), t("d2-50", "も"),
          t("d2-51", "きく", "聞く", "きく", key=True), t("d2-52", "に"), t("d2-53", "たえない", "堪えない", "たえない", key=True),
          t("d2-54", "でした")],
         "Vâng. Tiếng thét cũng không nỡ nghe."),
    line(L, 9, "田中", "Phóng viên",
         [t("d2-55", "ひとびと", "人々", "ひとびと"), t("d2-56", "は"), t("d2-57", "どんな"), t("d2-58", "ようす", "様子", "ようす", key=True),
          t("d2-59", "でしたか")],
         "Mọi người trông có vẻ như thế nào?"),
    line(L, 10, "サントス", "Phóng viên",
         [t("d2-60", "かんげき", "感激", "かんげき", key=True), t("d2-61", "より"), t("d2-62", "も"), t("d2-63", "かなしみ", "悲しみ", "かなしみ", key=True),
          t("d2-64", "に"), t("d2-65", "たえない", "堪えない", "たえない", key=True), t("d2-66", "ようす", "様子", "ようす"),
          t("d2-67", "でした")],
         "Trông có vẻ không kìm được nỗi buồn hơn là sự xúc động."),
]

EXERCISES = [
    q(L, 1, "「同情にたえません」 — にたえない ở đây diễn tả điều gì?",
      ["Không kìm được cảm xúc thương cảm/xúc động (gắn sau danh từ cảm xúc)",
       "Không đáng/không nỡ làm hành động gì đó", "Sự khẳng định chắc chắn",
       "Sự từ chối lịch sự"], 0,
      "にたえない gắn sau danh từ cảm xúc (同情) diễn tả 'không kìm được' cảm xúc đó.",
      "Xem cấu trúc にたえない ở slide 1."),
    q(L, 2, "「怒りを禁じ得ません」 — を禁じ得ない khác にたえない (nghĩa 1) ở điểm nào?",
      ["を禁じ得ない thường đi với cảm xúc DỮ DỘI như phẫn nộ, kinh ngạc; にたえない thiên về cảm xúc ẤM ÁP như thương cảm",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "を禁じ得ない chỉ dùng cho câu hỏi", "にたえない chỉ dùng cho phủ định"], 0,
      "を禁じ得ない thiên về cảm xúc dữ dội (phẫn nộ, kinh ngạc); にたえない (nghĩa 1) thiên về cảm xúc ấm áp (thương cảm, xúc động).",
      "Xem so sánh ở slide 3."),
    q(L, 3, "「この悲惨な状況は見るに堪えない」 — にたえない ở đây mang nghĩa gì?",
      ["Không đáng/không nỡ làm hành động đó (gắn sau động từ thể từ điển)",
       "Không kìm được cảm xúc", "Sự khẳng định chắc chắn",
       "Sự cho phép làm việc gì đó"], 0,
      "Khi gắn sau V(từ điển) như 見る, にたえない mang nghĩa khác: 'không đáng/không nỡ' vì sự việc quá tệ.",
      "Xem nghĩa thứ hai ở slide 4."),
    q(L, 4, "にたえない có mấy nghĩa chính, phân biệt bằng cách nào?",
      ["Hai nghĩa, phân biệt bằng loại từ đứng trước (danh từ cảm xúc / động từ thể từ điển)",
       "Chỉ có một nghĩa duy nhất", "Ba nghĩa, phân biệt bằng thì",
       "Không có quy tắc phân biệt nào"], 0,
      "にたえない có 2 nghĩa: sau DANH TỪ CẢM XÚC = 'không kìm được'; sau ĐỘNG TỪ TỪ ĐIỂN = 'không đáng/không nỡ'.",
      "Xem tổng kết ở slide 4."),
    q(L, 5, "「衝撃を禁じ得ない事件でした」 nghĩa là:",
      ["Đó là một vụ việc không thể kìm nén được cú sốc", "Vụ việc đó hoàn toàn bình thường",
       "Không có cú sốc nào cả", "Vụ việc đã được giải quyết ổn thỏa"], 0,
      "を禁じ得ない ở đây bổ nghĩa cho 事件, nghĩa là vụ việc gây ra cảm giác không thể kìm nén cú sốc.",
      "Áp dụng cấu trúc Nを禁じ得ない."),
    q(L, 6, "を禁じ得ない thường xuất hiện trong văn phong nào?",
      ["Xã luận báo chí, phát biểu chính thức khi lên án một sự việc",
       "Hội thoại thân mật giữa bạn bè", "Tin nhắn ngắn hàng ngày",
       "Không bao giờ được sử dụng"], 0,
      "を禁じ得ない mang văn phong RẤT TRANG TRỌNG, chủ yếu trong xã luận, phát biểu chính thức.",
      "Xem văn hóa sử dụng ở slide 2."),
    q(L, 7, "「彼の悲鳴は聞くに堪えなかった」 nghĩa là:",
      ["Tiếng thét của anh ta không nỡ nghe (quá thảm để nghe)",
       "Tiếng thét của anh ta rất dễ nghe", "Anh ta không hề thét lên",
       "Mọi người đều thích nghe tiếng thét đó"], 0,
      "聞くに堪えない (nghĩa 'không đáng/không nỡ') diễn tả tiếng thét quá thảm khốc để có thể nghe được.",
      "Áp dụng cấu trúc V(từ điển)+にたえない cho 聞く."),
    q(L, 8, "Theo hội thoại, nguyên nhân của vụ việc là gì?",
      ["Tham nhũng (腐敗が原因でした)", "Thiên tai", "Tai nạn giao thông",
       "Không được đề cập trong hội thoại"], 0,
      "田中 nói 「腐敗が原因でしたね」và Santos xác nhận.",
      "Xem câu thoại thứ 5."),
    q(L, 9, "Hiện trường vụ việc có nỡ nhìn không theo hội thoại?",
      ["Không, không nỡ nhìn (見るに堪えませんでした)", "Có, rất bình thường để nhìn",
       "Không được đề cập trong hội thoại", "Hiện trường đã được dọn dẹp sạch sẽ"], 0,
      "Santos xác nhận 「はい。悲鳴も聞くに堪えないでした」sau câu hỏi của田中.",
      "Xem câu thoại thứ 7-8."),
    q(L, 10, "Mọi người cảm thấy thế nào theo hội thoại cuối cùng?",
      ["Không kìm được nỗi buồn hơn là sự xúc động (悲しみに堪えない様子でした)",
       "Rất vui mừng", "Không có cảm xúc gì đặc biệt",
       "Cảm thấy tức giận với nạn nhân"], 0,
      "Santos nói 「感激よりも悲しみに堪えない様子でした」.",
      "Xem câu thoại cuối cùng."),
]

LESSON = lesson(
    L,
    "Bài 2: Cảm xúc không thể kìm nén (にたえない & を禁じ得ない)",
    "にたえない gắn sau DANH TỪ CẢM XÚC (感激, 同情, 悲しみ) diễn tả 'không kìm được' — thiên về "
    "cảm xúc ẤM ÁP (thương cảm, xúc động); を禁じ得ない diễn tả 'không thể kìm nén' — thiên về cảm "
    "xúc DỮ DỘI (phẫn nộ, kinh ngạc), văn phong xã luận; にたえない còn có nghĩa KHÁC 'không đáng/"
    "không nỡ' khi gắn sau ĐỘNG TỪ THỂ TỪ ĐIỂN (見るに堪えない).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
