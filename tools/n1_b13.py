# -*- coding: utf-8 -*-
"""N1 — Bai 13: Cuong vi dang kinh — N(dia vi cao quy)ともあろう者が、〜 (mot
nguoi/to chuc o dia vi/tu cach CAO QUY nhu N ma lai co hanh vi KHONG XUNG
DANG -- chi trich manh, the hien su NGAC NHIEN + THAT VONG) va N1ならいざ知ら
ず、N2は〜 (neu la N1 thi con chap nhan duoc, nhung N2 thi khong the -- so
sanh hai truong hop, ngu y N2 nghiem trong hon han N1).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 13
pool = Pool("n1")

VOCAB = [
    v(1,  "ぎわく", "疑惑", "ぎわく", "giwaku", "noun", "Sự nghi ngờ, mối nghi hoặc", "疑惑が 持たれています = đang bị nghi hoặc.", L),
    v(2,  "しんじん", "新人", "しんじん", "shinjin", "noun", "Người mới, tân binh", "新人には 難しいです = khó đối với người mới.", L),
    v(3,  "はじ", "恥", "はじ", "haji", "noun", "Sự xấu hổ, nỗi nhục", "恥を 知ります = biết xấu hổ.", L),
    v(4,  "しんよう", "信用", "しんよう", "shinyou", "noun", "Sự tín nhiệm, uy tín", "信用を 失います = đánh mất sự tín nhiệm.", L),
    v(5,  "うらぎります", "裏切ります", "うらぎります", "uragirimasu", "verb", "Phản bội", "期待を 裏切ります = phản bội kỳ vọng.", L),
    v(6,  "きたい", "期待", "きたい", "kitai", "noun", "Sự kỳ vọng, mong đợi", "皆の 期待に 応えます = đáp lại kỳ vọng của mọi người.", L),
    v(7,  "けいじ", "刑事", "けいじ", "keiji", "noun", "Thanh tra hình sự, cảnh sát điều tra", "刑事が 事件を 調べます = thanh tra hình sự điều tra vụ việc.", L),
    v(8,  "たいほ", "逮捕", "たいほ", "taiho", "noun", "Sự bắt giữ", "犯人が 逮捕されました = phạm nhân đã bị bắt giữ.", L),
    v(9,  "はんざい", "犯罪", "はんざい", "hanzai", "noun", "Tội ác, tội phạm", "Đã gặp N1 bài 6.", L),
    v(10, "たちば", "立場", "たちば", "tachiba", "noun", "Lập trường, vị trí, cương vị", "Đã gặp N1 bài 3.", L),
    v(11, "しかく", "資格", "しかく", "shikaku", "noun", "Tư cách, chứng chỉ", "Đã gặp N3 bài 8.", L),
    v(12, "きしゃ", "記者", "きしゃ", "kisha", "noun", "Phóng viên", "Đã gặp N1 bài 9.", L),
    v(13, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N3 bài 13.", L),
    v(14, "せきにん", "責任", "せきにん", "sekinin", "noun", "Trách nhiệm", "Đã gặp N1 bài 5.", L),
    v(15, "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc", "Đã gặp N4 bài 41.", L),
    v(16, "ぎいん", "議員", "ぎいん", "giin", "noun", "Nghị sĩ", "Đã gặp N1 bài 6.", L),
    v(17, "ふせい", "不正", "ふせい", "fusei", "noun", "Sự bất chính, gian lận", "Đã gặp N1 bài 6.", L),
    v(18, "しんらい", "信頼", "しんらい", "shinrai", "noun", "Sự tin cậy", "Đã gặp N1 bài 6.", L),
    v(19, "あやまります", "謝ります", "あやまります", "ayamarimasu", "verb", "Xin lỗi", "Đã gặp N1 bài 9.", L),
    v(20, "じけん", "事件", "じけん", "jiken", "noun", "Vụ việc, sự kiện", "Đã gặp N1 bài 2.", L),
]

KANJI = [
    k(1, "疑", "NGHI", 14, ["ギ (gi)"], ["うたが(う)"], "Nghi ngờ.",
      [("疑惑", "ぎわく", "Nghi hoặc"), ("疑問", "ぎもん", "Nghi vấn, thắc mắc")], L),
    k(2, "惑", "HOẶC", 12, ["ワク (waku)"], ["まど(う)"], "Mê hoặc, hoang mang.",
      [("疑惑", "ぎわく", "Nghi hoặc"), ("迷惑", "めいわく", "Phiền toái, làm phiền")], L),
    k(3, "恥", "SỈ", 10, ["チ (chi)"], ["は(じる)"], "Xấu hổ, sỉ nhục.",
      [("恥", "はじ", "Sự xấu hổ"), ("恥ずかしい", "はずかしい", "Xấu hổ (tính từ)")], L),
    k(4, "裏", "LÝ", 13, ["リ (ri)"], ["うら"], "Mặt trái, đằng sau.",
      [("裏切ります", "うらぎります", "Phản bội"), ("裏側", "うらがわ", "Mặt sau, phía sau")], L),
    k(5, "逮", "ĐÃI", 11, ["タイ (tai)"], [], "Đuổi kịp, bắt giữ.",
      [("逮捕", "たいほ", "Bắt giữ"), ("逮捕状", "たいほじょう", "Lệnh bắt giữ")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Một người ở địa vị đáng kính như thế mà lại...: N(địa vị cao quý)ともあろう者が",
        "N(địa vị/tư cách cao quý, đáng kính) + ともあろう者が、[hành vi không xứng đáng]",
        "ともあろう者が dùng để CHỈ TRÍCH MẠNH một người/tổ chức ở ĐỊA VỊ/TƯ CÁCH CAO QUÝ, ĐÁNG KÍNH "
        "(N) mà lại có hành vi KHÔNG XỨNG ĐÁNG với địa vị đó — thể hiện rõ sự NGẠC NHIÊN kết hợp "
        "THẤT VỌNG sâu sắc của người nói.",
        [
            ex(L, 1, 1, [t("t-l13s1-1", "けいじ", "刑事", "けいじ", key=True), t("t-l13s1-2", "ともあろうものが", "ともあろう者が", "ともあろうものが", key=True),
                         t("t-l13s1-3", "、"), t("t-l13s1-4", "はんざい", "犯罪", "はんざい", key=True), t("t-l13s1-5", "を"),
                         t("t-l13s1-6", "おかす", "犯す", "おかす"), t("t-l13s1-7", "とは"), t("t-l13s1-8", "、"),
                         t("t-l13s1-9", "ゆるせない", "許せない", "ゆるせない")],
               "Một người là thanh tra hình sự mà lại phạm tội — thật không thể tha thứ."),
            ex(L, 1, 2, [t("t-l13s1-10", "きょうし", "教師", "きょうし"), t("t-l13s1-11", "ともあろうものが", "ともあろう者が", "ともあろうものが", key=True),
                         t("t-l13s1-12", "、"), t("t-l13s1-13", "そんな"), t("t-l13s1-14", "こと"), t("t-l13s1-15", "を"),
                         t("t-l13s1-16", "する"), t("t-l13s1-17", "とは"), t("t-l13s1-18", "しんじられない", "信じられない", "しんじられない")],
               "Một người là giáo viên mà lại làm chuyện như vậy — thật không thể tin được."),
        ],
        tips="ともあろう者が chỉ dùng cho N chỉ ĐỊA VỊ/NGHỀ NGHIỆP được xã hội TÔN TRỌNG (giáo viên, cảnh sát, bác sĩ, nghị sĩ) — không dùng cho người bình thường không có địa vị đặc biệt.",
        culture="Câu nói kinh điển trên báo Nhật khi đưa tin bê bối của người có chức vị: '〜ともあろう者が、こんな初歩的なミスをするとは' (một người ở địa vị như thế mà lại mắc lỗi sơ đẳng như vậy)."),

    slide(L, 2,
        "2. Nếu là... thì còn hiểu được, nhưng...: N1ならいざ知らず、N2は",
        "N1(trường hợp chấp nhận được) + ならいざ知らず、N2(trường hợp hiện tại) + は〜",
        "N1ならいざ知らず、N2は〜 dùng để SO SÁNH hai trường hợp: nếu là N1 thì CÒN CÓ THỂ hiểu/chấp "
        "nhận được, nhưng N2 (trường hợp đang bàn tới) thì KHÔNG THỂ chấp nhận — ngụ ý N2 nghiêm "
        "trọng/đáng trách hơn N1 rất nhiều.",
        [
            ex(L, 2, 1, [t("t-l13s2-1", "しんじん", "新人", "しんじん", key=True), t("t-l13s2-2", "ならいざしらず", "ならいざ知らず", "ならいざしらず", key=True),
                         t("t-l13s2-3", "、"), t("t-l13s2-4", "けいじ", "刑事", "けいじ", key=True), t("t-l13s2-5", "が"),
                         t("t-l13s2-6", "しみん", "市民", "しみん"), t("t-l13s2-7", "の"), t("t-l13s2-8", "きたい", "期待", "きたい", key=True),
                         t("t-l13s2-9", "を"), t("t-l13s2-10", "うらぎる", "裏切る", "うらぎる", key=True), t("t-l13s2-11", "とは")],
               "Nếu là lính mới thì còn hiểu được, nhưng một thanh tra hình sự lại phản bội kỳ vọng của người dân..."),
            ex(L, 2, 2, [t("t-l13s2-12", "こども", "子供", "こども"), t("t-l13s2-13", "ならいざしらず", "ならいざ知らず", "ならいざしらず", key=True),
                         t("t-l13s2-14", "、"), t("t-l13s2-15", "おとな", "大人", "おとな"), t("t-l13s2-16", "が"),
                         t("t-l13s2-17", "やくそく", "約束", "やくそく"), t("t-l13s2-18", "を"), t("t-l13s2-19", "まもらない", "守らない", "まもらない"),
                         t("t-l13s2-20", "とは"), t("t-l13s2-21", "はずかしい", "恥ずかしい", "はずかしい", key=True)],
               "Nếu là trẻ con thì còn hiểu được, nhưng người lớn mà không giữ lời hứa thì thật đáng xấu hổ."),
        ],
        tips="ならいざ知らず luôn cần HAI vế: N1 (trường hợp NHẸ hơn/còn hiểu được) và N2 (trường hợp THỰC TẾ đang bị phê phán) — thiếu vế N1 thì câu mất đi tính so sánh.",
        culture="ならいざ知らず là văn phong VIẾT/PHÁT BIỂU trang trọng, gần như không dùng trong hội thoại xuề xòa hằng ngày — thường thấy trong xã luận báo chí hoặc lời phê bình chính thức."),

    slide(L, 3,
        "3. So sánh ともあろう者が và ならいざ知らず",
        "ともあろう者が: chỉ trích TRỰC TIẾP một chủ thể duy nhất　vs　ならいざ知らず: SO SÁNH hai trường hợp (A và B)",
        "ともあろう者が chỉ nhắm vào MỘT chủ thể duy nhất, khẳng định địa vị của họ rồi chỉ trích hành "
        "vi không xứng — không cần vế so sánh. ならいざ知らず luôn cần HAI vế: nêu một trường hợp "
        "CHẤP NHẬN ĐƯỢC (A) trước, rồi mới chỉ ra trường hợp KHÔNG THỂ CHẤP NHẬN (B) — mang tính so "
        "sánh rõ rệt. Hai cấu trúc có thể kết hợp trong cùng một câu để tăng sức nặng phê phán.",
        [
            ex(L, 3, 1, [t("t-l13s3-1", "けいじ", "刑事", "けいじ", key=True), t("t-l13s3-2", "ともあろうものが", "ともあろう者が", "ともあろうものが", key=True),
                         t("t-l13s3-3", "、"), t("t-l13s3-4", "はんざい", "犯罪", "はんざい", key=True), t("t-l13s3-5", "に"),
                         t("t-l13s3-6", "かかわる", "関わる", "かかわる"), t("t-l13s3-7", "とは")],
               "Một người là thanh tra hình sự mà lại dính líu đến tội phạm..."),
            ex(L, 3, 2, [t("t-l13s3-8", "しんじん", "新人", "しんじん", key=True), t("t-l13s3-9", "ならいざしらず", "ならいざ知らず", "ならいざしらず", key=True),
                         t("t-l13s3-10", "、"), t("t-l13s3-11", "けいじ", "刑事", "けいじ", key=True), t("t-l13s3-12", "が"),
                         t("t-l13s3-13", "はんざい", "犯罪", "はんざい", key=True), t("t-l13s3-14", "を"),
                         t("t-l13s3-15", "みのがす", "見逃す", "みのがす"), t("t-l13s3-16", "とは"),
                         t("t-l13s3-17", "ゆるされない", "許されない", "ゆるされない")],
               "Nếu là lính mới thì còn hiểu được, nhưng một thanh tra hình sự mà lại bỏ qua tội phạm thì không thể tha thứ."),
        ],
        tips="Mẹo: câu chỉ có MỘT chủ thể + chỉ trích trực tiếp → ともあろう者が; câu có HAI trường hợp đối chiếu → ならいざ知らず.",
        culture="Trong xã luận phê phán một vụ bê bối, tác giả thường dùng ならいざ知らず để hạ thấp mức độ có thể tha thứ của trường hợp khác, rồi dùng ともあろう者が để dồn toàn bộ trách nhiệm lên đúng đối tượng."),

    slide(L, 4,
        "4. Kết hợp trong một bài bình luận vụ án hoàn chỉnh",
        "新人ならいざ知らず、刑事ともあろう者が、〜とは (kết hợp SO SÁNH + PHÊ PHÁN ĐỊA VỊ trong cùng một câu)",
        "Khi bình luận một vụ bê bối, người nói thường kết hợp CẢ HAI cấu trúc trong CÙNG một câu: "
        "dùng ならいざ知らず để nêu trường hợp có thể CHẤP NHẬN ĐƯỢC (làm phép so sánh), rồi dùng とも"
        "あろう者が để nhấn mạnh ĐỊA VỊ ĐÁNG LẼ PHẢI GƯƠNG MẪU của chủ thể thực sự — tạo hiệu ứng phê "
        "phán TẦNG TẦNG LỚP LỚP, rất mạnh mẽ. ならいざ知らず cũng có thể dùng để so sánh MỨC ĐỘ/SỐ LẦN.",
        [
            ex(L, 4, 1, [t("t-l13s4-1", "しんじん", "新人", "しんじん", key=True), t("t-l13s4-2", "ならいざしらず", "ならいざ知らず", "ならいざしらず", key=True),
                         t("t-l13s4-3", "、"), t("t-l13s4-4", "けいじ", "刑事", "けいじ", key=True), t("t-l13s4-5", "ともあろうものが", "ともあろう者が", "ともあろうものが", key=True),
                         t("t-l13s4-6", "、"), t("t-l13s4-7", "しみん", "市民", "しみん"), t("t-l13s4-8", "の"),
                         t("t-l13s4-9", "しんらい", "信頼", "しんらい", key=True), t("t-l13s4-10", "を"),
                         t("t-l13s4-11", "うらぎる", "裏切る", "うらぎる", key=True), t("t-l13s4-12", "とは"), t("t-l13s4-13", "、"),
                         t("t-l13s4-14", "はずべき", "恥ずべき", "はずべき", key=True), t("t-l13s4-15", "こと"), t("t-l13s4-16", "だ")],
               "Nếu là lính mới thì còn hiểu được, nhưng một người đã là thanh tra hình sự mà lại phản bội niềm tin của người dân — đó là điều đáng xấu hổ."),
            ex(L, 4, 2, [t("t-l13s4-17", "いちど", "一度", "いちど"), t("t-l13s4-18", "ならいざしらず", "ならいざ知らず", "ならいざしらず", key=True),
                         t("t-l13s4-19", "、"), t("t-l13s4-20", "にど", "二度", "にど"), t("t-l13s4-21", "も"),
                         t("t-l13s4-22", "おなじ", "同じ", "おなじ"), t("t-l13s4-23", "あやまち", "過ち", "あやまち"), t("t-l13s4-24", "を"),
                         t("t-l13s4-25", "おかす", "犯す", "おかす"), t("t-l13s4-26", "とは"), t("t-l13s4-27", "、"),
                         t("t-l13s4-28", "けいじ", "刑事", "けいじ", key=True), t("t-l13s4-29", "ともあろうものが", "ともあろう者が", "ともあろうものが", key=True),
                         t("t-l13s4-30", "なさけない", "情けない", "なさけない")],
               "Nếu một lần thì còn hiểu được, nhưng phạm cùng một sai lầm đến hai lần — một người là thanh tra hình sự như vậy thật đáng thất vọng."),
        ],
        tips="ならいざ知らず không chỉ so sánh GIỮA HAI CHỦ THỂ mà còn có thể so sánh MỨC ĐỘ/SỐ LẦN của cùng một chủ thể (一度ならいざ知らず、二度も〜 = một lần thì còn hiểu được, nhưng hai lần thì...).",
        culture="Cấu trúc phê phán tầng lớp này (so sánh nhẹ hơn → chỉ đích danh địa vị → kết luận đáng trách) là khung xã luận kinh điển của báo chí Nhật khi bình luận bê bối của người có chức vị."),
]

DIALOGUE = [
    line(L, 1, "田中", "Phóng viên",
         [t("d13-1", "こんかい", "今回", "こんかい"), t("d13-2", "の"), t("d13-3", "けいじ", "刑事", "けいじ", key=True),
          t("d13-4", "の"), t("d13-5", "たいほ", "逮捕", "たいほ", key=True), t("d13-6", "について"), t("d13-7", "、"),
          t("d13-8", "どう"), t("d13-9", "おもわれますか", "思われますか", "おもわれますか")],
         "Về việc thanh tra hình sự lần này bị bắt giữ, ông nghĩ sao?"),
    line(L, 2, "評論家", "Nhà bình luận",
         [t("d13-10", "けいじ", "刑事", "けいじ", key=True), t("d13-11", "ともあろうものが", "ともあろう者が", "ともあろうものが", key=True),
          t("d13-12", "、"), t("d13-13", "はんざい", "犯罪", "はんざい", key=True), t("d13-14", "に"),
          t("d13-15", "かかわる", "関わる", "かかわる"), t("d13-16", "とは"), t("d13-17", "、"),
          t("d13-18", "ゆるせない", "許せない", "ゆるせない"), t("d13-19", "ことです")],
         "Một người là thanh tra hình sự mà lại dính líu đến tội phạm — đó là điều không thể tha thứ."),
    line(L, 3, "田中", "Phóng viên",
         [t("d13-20", "ぎわく", "疑惑", "ぎわく", key=True), t("d13-21", "の"), t("d13-22", "ないよう", "内容", "ないよう"),
          t("d13-23", "は"), t("d13-24", "なん", "何", "なん"), t("d13-25", "です"), t("d13-26", "か")],
         "Nội dung nghi vấn là gì?"),
    line(L, 4, "評論家", "Nhà bình luận",
         [t("d13-27", "はんざい", "犯罪", "はんざい", key=True), t("d13-28", "の"), t("d13-29", "じょうほう", "情報", "じょうほう"),
          t("d13-30", "を"), t("d13-31", "もらしていた", "漏らしていた", "もらしていた"), t("d13-32", "という"),
          t("d13-33", "ぎわく", "疑惑", "ぎわく", key=True), t("d13-34", "です")],
         "Đó là nghi vấn đã làm rò rỉ thông tin tội phạm."),
    line(L, 5, "田中", "Phóng viên",
         [t("d13-35", "なぜ"), t("d13-36", "そんなに"), t("d13-37", "きびしく", "厳しく", "きびしく"),
          t("d13-38", "ひはんされている", "批判されている", "ひはんされている"), t("d13-39", "の"), t("d13-40", "です"), t("d13-41", "か")],
         "Tại sao lại bị chỉ trích gay gắt như vậy?"),
    line(L, 6, "評論家", "Nhà bình luận",
         [t("d13-42", "しんじん", "新人", "しんじん", key=True), t("d13-43", "ならいざしらず", "ならいざ知らず", "ならいざしらず", key=True),
          t("d13-44", "、"), t("d13-45", "けいじ", "刑事", "けいじ", key=True), t("d13-46", "が"),
          t("d13-47", "しみん", "市民", "しみん"), t("d13-48", "の"), t("d13-49", "きたい", "期待", "きたい", key=True),
          t("d13-50", "を"), t("d13-51", "うらぎった", "裏切った", "うらぎった", key=True), t("d13-52", "からです")],
         "Vì nếu là lính mới thì còn hiểu được, nhưng đây là một thanh tra hình sự đã phản bội kỳ vọng của người dân."),
    line(L, 7, "田中", "Phóng viên",
         [t("d13-53", "しんよう", "信用", "しんよう", key=True), t("d13-54", "は"), t("d13-55", "どう"),
          t("d13-56", "なりますか")],
         "Vậy uy tín sẽ ra sao?"),
    line(L, 8, "評論家", "Nhà bình luận",
         [t("d13-57", "しみん", "市民", "しみん"), t("d13-58", "の"), t("d13-59", "しんよう", "信用", "しんよう", key=True),
          t("d13-60", "を"), t("d13-61", "とりもどす", "取り戻す", "とりもどす"), t("d13-62", "の"), t("d13-63", "は"),
          t("d13-64", "かんたん", "簡単", "かんたん"), t("d13-65", "ではない"), t("d13-66", "でしょう")],
         "Việc lấy lại sự tín nhiệm của người dân sẽ không dễ dàng."),
    line(L, 9, "田中", "Phóng viên",
         [t("d13-67", "けいさつ", "警察", "けいさつ"), t("d13-68", "ぜんたい", "全体", "ぜんたい"), t("d13-69", "へ"),
          t("d13-70", "の"), t("d13-71", "えいきょう", "影響", "えいきょう"), t("d13-72", "も"), t("d13-73", "ある"),
          t("d13-74", "でしょう"), t("d13-75", "か")],
         "Cũng sẽ có ảnh hưởng đến toàn ngành cảnh sát chứ?"),
    line(L, 10, "評論家", "Nhà bình luận",
         [t("d13-76", "はい"), t("d13-77", "。"), t("d13-78", "しかも"), t("d13-79", "、"), t("d13-80", "これ"),
          t("d13-81", "が"), t("d13-82", "はじめて", "初めて", "はじめて"), t("d13-83", "ではない"), t("d13-84", "ようです"),
          t("d13-85", "。"), t("d13-86", "いちど", "一度", "いちど"), t("d13-87", "ならいざしらず", "ならいざ知らず", "ならいざしらず", key=True),
          t("d13-88", "、"), t("d13-89", "にど", "二度", "にど"), t("d13-90", "も"), t("d13-91", "おなじ", "同じ", "おなじ"),
          t("d13-92", "あやまち", "過ち", "あやまち"), t("d13-93", "を"), t("d13-94", "おかす", "犯す", "おかす"),
          t("d13-95", "とは"), t("d13-96", "、"), t("d13-97", "けいじ", "刑事", "けいじ", key=True),
          t("d13-98", "ともあろうものが", "ともあろう者が", "ともあろうものが", key=True), t("d13-99", "なさけない", "情けない", "なさけない"),
          t("d13-100", "です")],
         "Vâng. Hơn nữa, có vẻ đây không phải là lần đầu tiên. Nếu một lần thì còn hiểu được, nhưng phạm cùng sai lầm đến hai lần — một người là thanh tra hình sự như vậy thật đáng thất vọng."),
]

EXERCISES = [
    q(L, 1, "「刑事ともあろう者が、犯罪を犯すとは、許せない」 — ともあろう者が diễn tả điều gì?",
      ["Chỉ trích MẠNH một người ở ĐỊA VỊ/TƯ CÁCH CAO QUÝ mà lại có hành vi không xứng đáng — thể hiện ngạc nhiên + thất vọng",
       "Khen ngợi một người vì đã hoàn thành xuất sắc nhiệm vụ", "So sánh hai trường hợp khác nhau",
       "Đưa ra lời khuyên nhẹ nhàng"], 0,
      "ともあろう者が chỉ trích mạnh một người ở địa vị cao quý mà lại có hành vi không xứng đáng với địa vị đó.",
      "Xem cấu trúc ともあろう者が ở slide 1."),
    q(L, 2, "「新人ならいざ知らず、刑事が市民の期待を裏切るとは」 — ならいざ知らず dùng để làm gì?",
      ["Khẳng định một sự thật hiển nhiên",
       "SO SÁNH hai trường hợp: nếu là A thì còn chấp nhận được, nhưng B thì không thể chấp nhận",
       "Xin phép làm việc gì đó", "Diễn tả một hành động đang tiếp diễn"], 1,
      "ならいざ知らず dùng để so sánh: trường hợp A (nhẹ hơn) thì còn hiểu được, nhưng trường hợp B (đang bàn) thì không thể chấp nhận.",
      "Xem cấu trúc ならいざ知らず ở slide 2."),
    q(L, 3, "Sự khác biệt cấu trúc cốt lõi giữa ともあろう者が và ならいざ知らず là gì?",
      ["ともあろう者が chỉ nhắm vào MỘT chủ thể duy nhất; ならいざ知らず luôn cần HAI vế để SO SÁNH",
       "Hoàn toàn giống nhau về cấu trúc", "ともあろう者が cần hai vế so sánh; ならいざ知らず chỉ có một chủ thể",
       "Cả hai đều không thể dùng trong văn viết"], 0,
      "ともあろう者が chỉ có một chủ thể bị chỉ trích; ならいざ知らず luôn cần hai vế (A và B) để tạo phép so sánh.",
      "Xem bảng so sánh ở slide 3."),
    q(L, 4, "「教師ともあろう者が、そんなことをするとは信じられない」 nghĩa là:",
      ["Một người là giáo viên mà lại làm chuyện như vậy — thật không thể tin được",
       "Giáo viên đó đã làm rất tốt công việc", "Không ai tin rằng đó là một giáo viên",
       "Giáo viên hoàn toàn không liên quan"], 0,
      "ともあろう者が ở đây khẳng định địa vị giáo viên đáng kính rồi bày tỏ sự không thể tin nổi trước hành vi của người đó.",
      "Áp dụng cấu trúc ともあろう者が cho ngữ cảnh giáo dục."),
    q(L, 5, "「子供ならいざ知らず、大人が約束を守らないとは恥ずかしい」 nghĩa là:",
      ["Nếu là trẻ con thì còn hiểu được, nhưng người lớn mà không giữ lời hứa thì thật đáng xấu hổ",
       "Trẻ con cũng phải giữ lời hứa như người lớn", "Không ai cần giữ lời hứa cả",
       "Người lớn không bao giờ thất hứa"], 0,
      "ならいざ知らず ở đây so sánh: trẻ con (chấp nhận được) với người lớn (không thể chấp nhận) khi không giữ lời hứa.",
      "Áp dụng cấu trúc ならいざ知らず cho ngữ cảnh giữ lời hứa."),
    q(L, 6, "Tại sao khi bình luận một vụ bê bối, người nói thường kết hợp CẢ ならいざ知らず LẪN ともあろう者が trong cùng một câu?",
      ["Để vừa SO SÁNH với trường hợp nhẹ hơn, vừa NHẤN MẠNH địa vị đáng lẽ phải gương mẫu — tạo hiệu ứng phê phán tầng tầng lớp lớp",
       "Vì quy tắc ngữ pháp bắt buộc phải dùng chung cả hai", "Vì hai cấu trúc có nghĩa trái ngược nhau nên cần bổ sung",
       "Không có lý do đặc biệt nào"], 0,
      "Kết hợp cả hai giúp vừa so sánh mức độ nghiêm trọng, vừa nhấn mạnh địa vị đáng kính bị phản bội — tăng sức nặng phê phán.",
      "Xem cấu trúc bài bình luận hoàn chỉnh ở slide 4."),
    q(L, 7, "「一度ならいざ知らず、二度も同じ過ちを犯すとは」 — ならいざ知らず ở đây so sánh điều gì?",
      ["So sánh MỨC ĐỘ/SỐ LẦN: một lần thì còn chấp nhận được, nhưng hai lần thì không thể",
       "So sánh hai người khác nhau", "So sánh quá khứ và tương lai", "Không so sánh gì cả"], 0,
      "ならいざ知らず không chỉ so sánh giữa hai chủ thể mà còn có thể so sánh mức độ/số lần lặp lại của cùng một hành vi.",
      "Xem ví dụ nâng cao ở slide 4."),
    q(L, 8, "Theo hội thoại, thanh tra hình sự bị nghi ngờ về điều gì?",
      ["Đã làm rò rỉ thông tin tội phạm (犯罪の情報を漏らしていたという疑惑です)", "Đã nhận hối lộ từ nước ngoài",
       "Không có nghi vấn nào cả", "Đã nghỉ việc đột ngột"], 0,
      "Nhà bình luận nói 「犯罪の情報を漏らしていたという疑惑です」.",
      "Xem câu thoại thứ 4."),
    q(L, 9, "Theo hội thoại, tại sao thanh tra hình sự bị chỉ trích gay gắt?",
      ["Vì đã phản bội kỳ vọng của người dân, điều mà một lính mới thì còn có thể hiểu được (新人ならいざ知らず、刑事が市民の期待を裏切った)",
       "Vì tuổi tác còn quá trẻ", "Vì không được đào tạo bài bản", "Không có lý do rõ ràng"], 0,
      "Nhà bình luận nói 「新人ならいざ知らず、刑事が市民の期待を裏切ったからです」.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Theo hội thoại, điều gì khiến vụ việc càng đáng thất vọng hơn?",
      ["Đây không phải là lần đầu tiên xảy ra sai phạm tương tự (一度ならいざ知らず、二度も同じ過ちを犯す)",
       "Đây là lần đầu tiên nên có thể thông cảm", "Vụ việc đã được giải quyết ổn thỏa",
       "Không có gì đáng thất vọng thêm"], 0,
      "Nhà bình luận nói vụ việc không phải lần đầu: 「一度ならいざ知らず、二度も同じ過ちを犯すとは」.",
      "Xem câu thoại thứ 10."),
]

LESSON = lesson(
    L,
    "Bài 13: Cương vị đáng kính (ともあろう者が & ならいざ知らず)",
    "ともあろう者が chỉ trích MẠNH một người/tổ chức ở ĐỊA VỊ/TƯ CÁCH CAO QUÝ, ĐÁNG KÍNH mà lại có "
    "hành vi KHÔNG XỨNG ĐÁNG — thể hiện sự NGẠC NHIÊN kết hợp THẤT VỌNG sâu sắc. ならいざ知らず dùng "
    "để SO SÁNH hai trường hợp: nếu là A thì còn chấp nhận được, nhưng B (trường hợp đang bàn) thì "
    "không thể chấp nhận — ngụ ý B nghiêm trọng hơn A rất nhiều. Hội thoại: phóng viên phỏng vấn một "
    "nhà bình luận về vụ một thanh tra hình sự bị bắt giữ do nghi vấn phản bội niềm tin của người dân, kết hợp cả hai cấu trúc để phê phán nhiều tầng lớp.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
