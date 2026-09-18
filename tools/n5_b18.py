# -*- coding: utf-8 -*-
"""N5 — Bài 18: Thể từ điển, khả năng ことができる, sở thích 趣味は Vこと, Vるまえに.

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n5.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 18
pool = Pool("n5")

VOCAB = [
    v(1,  "うたいます", "歌います", "うたいます", "utaimasu", "verb", "Hát", "Thể từ điển: 歌う. Nhóm 1.", L),
    v(2,  "およぎます", "泳ぎます", "およぎます", "oyogimasu", "verb", "Bơi", "Thể từ điển: 泳ぐ. Đã gặp bài 13.", L),
    v(3,  "ひきます", "弾きます", "ひきます", "hikimasu", "verb", "Chơi (đàn dây, piano)", "Thể từ điển: 弾く. Nhóm 1. ピアノを 弾きます = chơi piano.", L),
    v(4,  "よみます", "読みます", "よみます", "yomimasu", "verb", "Đọc", "Thể từ điển: 読む. Đã gặp bài 6.", L),
    v(5,  "かきます", "書きます", "かきます", "kakimasu", "verb", "Viết", "Thể từ điển: 書く. Đã gặp bài 6.", L),
    v(6,  "うんてんします", "運転します", "うんてんします", "untenshimasu", "verb", "Lái xe", "Thể từ điển: 運転する. Nhóm 3.", L),
    v(7,  "さんぽします", "散歩します", "さんぽします", "sanposhimasu", "verb", "Đi dạo", "Thể từ điển: 散歩する. Nhóm 3.", L),
    v(8,  "ねます", "寝ます", "ねます", "nemasu", "verb", "Đi ngủ", "Thể từ điển: 寝る. Đã gặp bài 4.", L),
    v(9,  "はいります", "入ります", "はいります", "hairimasu", "verb", "Vào, tắm (bồn)", "Thể từ điển: 入る. お風呂に 入ります = tắm bồn.", L),
    v(10, "しゅみ", "趣味", "しゅみ", "shumi", "noun", "Sở thích", "趣味は 〜ことです = sở thích của tôi là ~.", L),
    v(11, "ピアノ", "", "", "piano", "noun", "Đàn piano", "", L),
    v(12, "ギター", "", "", "gitaa", "noun", "Đàn guitar", "Đã gặp bài 9.", L),
    v(13, "うた", "歌", "うた", "uta", "noun", "Bài hát", "Đã gặp bài 9.", L),
    v(14, "え", "絵", "え", "e", "noun", "Tranh, hình vẽ", "Đã gặp bài 9.", L),
    v(15, "おふろ", "お風呂", "おふろ", "ofuro", "noun", "Bồn tắm", "お風呂に 入ります = tắm bồn.", L),
    v(16, "さんぽ", "散歩", "さんぽ", "sanpo", "noun", "Việc đi dạo", "散歩を します = đi dạo.", L),
    v(17, "うんてん", "運転", "うんてん", "unten", "noun", "Việc lái xe", "Đã gặp bài 17.", L),
    v(18, "めんきょ", "免許", "めんきょ", "menkyo", "noun", "Bằng lái, giấy phép", "Đã gặp bài 17. 運転免許 = bằng lái xe.", L),
    v(19, "にほんご", "日本語", "にほんご", "nihongo", "noun", "Tiếng Nhật", "Đã gặp bài 2 — nay dùng làm đối tượng khả năng.", L),
    v(20, "すこし", "少し", "すこし", "sukoshi", "adverb", "Một chút, một ít", "少し できます = làm được một chút.", L),
]

KANJI = [
    k(1, "歌", "CA", 14, ["カ (ka)"], ["うた", "うた(う)"], "Bài hát, ca hát.",
      [("歌います", "うたいます", "Hát"), ("歌", "うた", "Bài hát"), ("歌手", "かしゅ", "Ca sĩ")], L),
    k(2, "弾", "ĐÀN", 12, ["ダン (dan)"], ["ひ(く)", "たま"], "Đàn, gảy đàn; viên đạn.",
      [("弾きます", "ひきます", "Chơi đàn"), ("爆弾", "ばくだん", "Bom"), ("弾力", "だんりょく", "Tính đàn hồi")], L),
    k(3, "運", "VẬN", 12, ["ウン (un)"], ["はこ(ぶ)"], "Vận chuyển, vận may. Đã gặp bài 17.",
      [("運転", "うんてん", "Lái xe"), ("運動", "うんどう", "Vận động"), ("幸運", "こううん", "May mắn")], L),
    k(4, "転", "CHUYỂN", 11, ["テン (ten)"], ["ころ(がる)"], "Chuyển động, xoay.",
      [("運転", "うんてん", "Lái xe"), ("転びます", "ころびます", "Té ngã"), ("自転車", "じてんしゃ", "Xe đạp")], L),
    k(5, "趣", "THÚ", 15, ["シュ (shu)"], ["おもむき"], "Thú vui, sở thích.",
      [("趣味", "しゅみ", "Sở thích"), ("趣旨", "しゅし", "Chủ ý"), ("興趣", "きょうしゅ", "Hứng thú")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Thể từ điển (辞書形)",
        "Vます → thể từ điển: 飲みます→飲む、食べます→食べる、来ます→来る、します→する",
        "Thể từ điển là dạng NGUYÊN MẪU của động từ, dùng làm tên gọi tra từ điển và làm gốc cho "
        "nhiều cấu trúc ngữ pháp cao hơn thể ます. Quy tắc chuyển đổi tương ứng với 3 nhóm đã học.",
        [
            ex(L, 1, 1, [t("t-l18s1-1", "およぎます", "泳ぎます", "およぎます"), t("t-l18s1-2", "→"),
                         t("t-l18s1-3", "およぐ", "泳ぐ", "およぐ", key=True)],
               "泳ぎます → 泳ぐ (nhóm 1: đổi đuôi ます thành âu tương ứng)"),
            ex(L, 1, 2, [t("t-l18s1-4", "たべます", "食べます", "たべます"), t("t-l18s1-5", "→"),
                         t("t-l18s1-6", "たべる", "食べる", "たべる", key=True)],
               "食べます → 食べる (nhóm 2: bỏ ます, thêm る)"),
        ],
        tips="Thể từ điển KHÔNG phải là 'thể suồng sã' như học sinh hay nhầm — nó chỉ là dạng gốc dùng để tra từ điển và ghép ngữ pháp.",
        culture="Sách ngữ pháp và từ điển Nhật LUÔN liệt kê động từ ở thể từ điển, không bao giờ ở thể ます."),

    slide(L, 2,
        "2. Khả năng: [Thể từ điển] + ことが できます",
        "V(từ điển) + こと + が + できます",
        "こと biến động từ thành DANH TỪ hóa hành động ('việc làm ~'), rồi ghép できます (làm được) "
        "để diễn tả KHẢ NĂNG. が đánh dấu 'việc làm được đó' — giống nhóm が đã học ở bài 9.",
        [
            ex(L, 2, 1, [t("t-l18s2-1", "わたし", "私", "わたし"), t("t-l18s2-2", "は"),
                         t("t-l18s2-3", "ピアノ"), t("t-l18s2-4", "を"), t("t-l18s2-5", "ひく", "弾く", "ひく"),
                         t("t-l18s2-6", "こと", key=True), t("t-l18s2-7", "が"),
                         t("t-l18s2-8", "できます", key=True)],
               "Tôi chơi piano được."),
            ex(L, 2, 2, [t("t-l18s2-9", "うんてん", "運転", "うんてん"), t("t-l18s2-10", "する", key=True),
                         t("t-l18s2-11", "こと", key=True), t("t-l18s2-12", "が"),
                         t("t-l18s2-13", "できますか", key=True)],
               "Anh lái xe được không?"),
        ],
        tips="ことができます trang trọng, đủ vế — trong hội thoại thân mật thường rút ngắn bằng thể khả năng riêng (sẽ học ở trình độ cao hơn).",
        culture="運転免許 (bằng lái) là điều kiện bắt buộc để nói 運転することができます một cách hợp pháp ở Nhật."),

    slide(L, 3,
        "3. Sở thích: 趣味は [Thể từ điển] こと です",
        "趣味 + は + V(từ điển) + こと + です",
        "Cùng cách DANH TỪ HÓA bằng こと như slide 2, nhưng dùng để GIỚI THIỆU sở thích thay vì "
        "hỏi khả năng — câu trúc rất phổ biến khi tự giới thiệu bản thân.",
        [
            ex(L, 3, 1, [t("t-l18s3-1", "わたし", "私", "わたし"), t("t-l18s3-2", "の"),
                         t("t-l18s3-3", "しゅみ", "趣味", "しゅみ", key=True), t("t-l18s3-4", "は"),
                         t("t-l18s3-5", "うた", "歌", "うた"), t("t-l18s3-6", "を"),
                         t("t-l18s3-7", "うたう", "歌う", "うたう"), t("t-l18s3-8", "こと", key=True),
                         t("t-l18s3-9", "です")],
               "Sở thích của tôi là hát."),
            ex(L, 3, 2, [t("t-l18s3-10", "しゅみ", "趣味", "しゅみ", key=True), t("t-l18s3-11", "は"),
                         t("t-l18s3-12", "なん", "何", "なん"), t("t-l18s3-13", "ですか")],
               "Sở thích của anh là gì vậy?"),
        ],
        tips="Trả lời câu hỏi 趣味は何ですか luôn kết bằng こと nếu đáp bằng một hành động (không cần こと nếu đáp bằng danh từ đơn giản như 音楽).",
        culture="Câu hỏi về sở thích là chủ đề an toàn, phổ biến để mở đầu trò chuyện xã giao ở Nhật."),

    slide(L, 4,
        "4. Trước khi làm gì: [Thể từ điển] + まえに、V",
        "V(từ điển) + まえに、[hành động khác]",
        "まえに (trước khi) LUÔN đi với THỂ TỪ ĐIỂN, không bao giờ chia theo thì của câu — dù cả "
        "câu ở quá khứ hay tương lai, vế trước まえに vẫn giữ nguyên thể từ điển.",
        [
            ex(L, 4, 1, [t("t-l18s4-1", "ねる", "寝る", "ねる", key=True), t("t-l18s4-2", "まえに", key=True),
                         t("t-l18s4-3", "、"), t("t-l18s4-4", "ほん", "本", "ほん"), t("t-l18s4-5", "を"),
                         t("t-l18s4-6", "よみます", "読みます", "よみます")],
               "Trước khi ngủ tôi đọc sách."),
            ex(L, 4, 2, [t("t-l18s4-7", "おふろ", "お風呂", "おふろ"), t("t-l18s4-8", "に"),
                         t("t-l18s4-9", "はいる", "入る", "はいる", key=True), t("t-l18s4-10", "まえに", key=True),
                         t("t-l18s4-11", "、"), t("t-l18s4-12", "さんぽ", "散歩", "さんぽ"),
                         t("t-l18s4-13", "しました", "しました", "しました")],
               "Trước khi tắm bồn, tôi đã đi dạo. (まえに vẫn ở thể từ điển dù câu ở quá khứ)"),
        ],
        tips="Lỗi hay gặp: chia まえに theo thì quá khứ (寝たまえに) — SAI, まえに luôn cố định ở thể từ điển.",
        culture="お風呂に入るまえに 散歩します phản ánh thói quen Nhật: tắm bồn thường vào buổi tối, sau các hoạt động khác trong ngày."),
]

DIALOGUE = [
    line(L, 1, "ワン", "Sinh viên",
         [t("d-l18-1", "サントスさん"), t("d-l18-2", "の"), t("d-l18-3", "しゅみ", "趣味", "しゅみ", key=True),
          t("d-l18-4", "は"), t("d-l18-5", "なん", "何", "なん"), t("d-l18-6", "ですか")],
         "Sở thích của anh Santos là gì vậy?"),
    line(L, 2, "サントス", "Sinh viên",
         [t("d-l18-7", "わたし", "私", "わたし"), t("d-l18-8", "の"), t("d-l18-9", "しゅみ", "趣味", "しゅみ"),
          t("d-l18-10", "は"), t("d-l18-11", "ギター"), t("d-l18-12", "を"), t("d-l18-13", "ひく", "弾く", "ひく", key=True),
          t("d-l18-14", "こと", key=True), t("d-l18-15", "です")],
         "Sở thích của tôi là chơi guitar."),
    line(L, 3, "ワン", "Sinh viên",
         [t("d-l18-16", "ピアノ"), t("d-l18-17", "も"), t("d-l18-18", "ひく", "弾く", "ひく"),
          t("d-l18-19", "こと", key=True), t("d-l18-20", "が"), t("d-l18-21", "できますか", key=True)],
         "Anh chơi được piano không?"),
    line(L, 4, "サントス", "Sinh viên",
         [t("d-l18-22", "すこし", "少し", "すこし", key=True), t("d-l18-23", "できます", key=True),
          t("d-l18-24", "。"), t("d-l18-25", "でも"), t("d-l18-26", "、"), t("d-l18-27", "うんてん", "運転", "うんてん", key=True),
          t("d-l18-28", "する"), t("d-l18-29", "こと", key=True), t("d-l18-30", "は"),
          t("d-l18-31", "できません", key=True)],
         "Tôi biết chơi một chút. Nhưng lái xe thì tôi không biết."),
    line(L, 5, "ワン", "Sinh viên",
         [t("d-l18-32", "めんきょ", "免許", "めんきょ"), t("d-l18-33", "が"), t("d-l18-34", "ありません", "有りません", "ありません"),
          t("d-l18-35", "か")],
         "Anh không có bằng lái à?"),
    line(L, 6, "サントス", "Sinh viên",
         [t("d-l18-36", "はい"), t("d-l18-37", "、"), t("d-l18-38", "ありません", "有りません", "ありません"),
          t("d-l18-39", "。"), t("d-l18-40", "ワンさん"), t("d-l18-41", "は"), t("d-l18-42", "しゅみ", "趣味", "しゅみ", key=True),
          t("d-l18-43", "が"), t("d-l18-44", "なん", "何", "なん"), t("d-l18-45", "ですか")],
         "Vâng, không có ạ. Còn sở thích của Wang là gì?"),
    line(L, 7, "ワン", "Sinh viên",
         [t("d-l18-46", "わたし", "私", "わたし"), t("d-l18-47", "は"), t("d-l18-48", "まいばん", "毎晩", "まいばん"),
          t("d-l18-49", "ねる", "寝る", "ねる", key=True), t("d-l18-50", "まえに", key=True), t("d-l18-51", "、"),
          t("d-l18-52", "ほん", "本", "ほん"), t("d-l18-53", "を"), t("d-l18-54", "よみます", "読みます", "よみます")],
         "Mỗi tối trước khi ngủ, tôi đọc sách."),
    line(L, 8, "サントス", "Sinh viên",
         [t("d-l18-55", "いいですね"), t("d-l18-56", "。"), t("d-l18-57", "にほんご", "日本語", "にほんご", key=True),
          t("d-l18-58", "の"), t("d-l18-59", "ほん", "本", "ほん"), t("d-l18-60", "を"),
          t("d-l18-61", "よむ", "読む", "よむ"), t("d-l18-62", "こと", key=True), t("d-l18-63", "が"),
          t("d-l18-64", "できますか", key=True)],
         "Hay đó. Cậu đọc sách tiếng Nhật được rồi à?"),
    line(L, 9, "ワン", "Sinh viên",
         [t("d-l18-65", "まだ"), t("d-l18-66", "すこし", "少し", "すこし", key=True), t("d-l18-67", "だけ"),
          t("d-l18-68", "です"), t("d-l18-69", "。"), t("d-l18-70", "でも"), t("d-l18-71", "、"),
          t("d-l18-72", "まいにち", "毎日", "まいにち"), t("d-l18-73", "れんしゅう", "練習", "れんしゅう"), t("d-l18-74", "します")],
         "Vẫn còn đọc được một chút thôi. Nhưng tôi luyện mỗi ngày."),
    line(L, 10, "サントス", "Sinh viên",
         [t("d-l18-75", "すごい"), t("d-l18-76", "ですね"), t("d-l18-77", "。"), t("d-l18-78", "がんばって"),
          t("d-l18-79", "ください")],
         "Giỏi quá. Cố lên nhé."),
]

EXERCISES = [
    q(L, 1, "Thể từ điển của 飲みます là:",
      ["飲む", "飲みる", "飲うます", "飲み"], 0,
      "Nhóm 1: đổi đuôi ます (i-âm) thành đuôi う tương ứng ở gốc từ điển. 飲みます → 飲む.",
      "Áp dụng quy tắc chuyển đổi nhóm 1."),
    q(L, 2, "Thể từ điển của 食べます là:",
      ["食べる", "食べます bỏ chữ ま", "食ぶ", "食べ"], 0,
      "Nhóm 2: bỏ ます, thêm る. 食べます → 食べる.",
      "Đây là quy tắc dễ nhất trong ba nhóm."),
    q(L, 3, "「ピアノを 弾く ことが できます」 — こと có vai trò gì?",
      ["Danh từ hóa hành động, biến động từ thành 'việc làm ~'",
       "Là trợ từ chỉ nơi chốn", "Là động từ", "Không có nghĩa gì"], 0,
      "こと biến cụm động từ thành danh từ trừu tượng ('việc chơi piano') để làm chủ ngữ cho できます.",
      "Xem chức năng danh từ hóa của こと."),
    q(L, 4, "Câu nào ĐÚNG khi hỏi khả năng lái xe?",
      ["運転する ことが できますか", "運転を できますか",
       "運転ます ことが できますか", "運転した ことが できますか"], 0,
      "Cấu trúc chuẩn là [thể từ điển]+ことが+できます — 運転する (thể từ điển của 運転します).",
      "Kiểm tra động từ có ở đúng thể từ điển chưa."),
    q(L, 5, "「趣味は 歌を 歌う ことです」 nghĩa là:",
      ["Sở thích của tôi là hát", "Tôi không thích hát",
       "Tôi đã từng hát", "Tôi sẽ hát"], 0,
      "趣味は…ことです là cấu trúc giới thiệu sở thích, dùng こと để danh từ hóa hành động.",
      "Đây là cấu trúc giới thiệu, không phải quá khứ hay tương lai."),
    q(L, 6, "「寝る まえに、本を 読みます」 — vì sao 寝る giữ nguyên thể từ điển dù nói về THÓI QUEN?",
      ["まえに luôn đi với thể từ điển, không chia theo thì của câu",
       "Đây là lỗi ngữ pháp", "まえに chỉ dùng thể ます",
       "寝る phải chia thành 寝た"], 0,
      "まえに là một trong số ít cấu trúc CỐ ĐỊNH dùng thể từ điển bất kể thì của câu chính.",
      "Xem quy tắc riêng đã nêu ở slide 4."),
    q(L, 7, "「お風呂に 入る まえに、散歩しました」 — câu này đúng nghĩa là:",
      ["Trước khi tắm bồn, tôi đã đi dạo (đi dạo xảy ra TRƯỚC)",
       "Sau khi tắm bồn, tôi đi dạo", "Trong khi tắm bồn, tôi đi dạo",
       "Tôi tắm bồn trong lúc đi dạo"], 0,
      "Vế có まえに luôn là hành động xảy ra SAU trong thực tế — 'trước khi X thì Y' nghĩa là Y xảy ra trước X.",
      "Đọc kỹ trật tự thời gian thực tế của hai hành động."),
    q(L, 8, "Muốn nói phủ định khả năng ('không lái xe được'), câu nào ĐÚNG?",
      ["運転する ことが できません", "運転しない ことが できます",
       "運転する ことは ありません", "運転が できないことです"], 0,
      "Phủ định できます thành できません, giữ nguyên cấu trúc còn lại.",
      "Chỉ cần phủ định できます."),
    q(L, 9, "Trong hội thoại, Santos có bằng lái xe không?",
      ["Không có", "Có, mới lấy tuần trước", "Có nhưng đã hết hạn", "Không được nhắc tới"], 0,
      "Santos trả lời rõ 「はい、ありません」 khi được hỏi về bằng lái.",
      "Xem câu thoại thứ 6."),
    q(L, 10, "Wang có thói quen gì trước khi ngủ mỗi tối?",
      ["Đọc sách", "Nghe nhạc", "Chơi đàn", "Đi dạo"], 0,
      "Wang nói 「毎晩 寝るまえに、本を読みます」.",
      "Xem câu thoại thứ 7."),
]

LESSON = lesson(
    L,
    "Bài 18: Thể từ điển & Khả năng (辞書形 + ことができる / 趣味は Vこと / Vるまえに)",
    "Chuyển động từ sang thể từ điển (dạng nguyên mẫu), dùng こと để danh từ hóa hành động cho "
    "cấu trúc khả năng ことができます và giới thiệu sở thích 趣味は…ことです, và cấu trúc cố định "
    "Vるまえに (luôn giữ thể từ điển bất kể thì của câu).",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
