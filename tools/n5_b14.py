# -*- coding: utf-8 -*-
"""N5 — Bài 14: Ba nhóm động từ & thể て (Vてください / Vています / Vましょうか).

Bai ban le quan trong nhat N5. Tu vung minh hoa TU CHON tu pool mo
data/jlpt-vocab/n5.csv (xem NOTICE.md), chon co chu y de minh hoa DU
CA TAM DUOI cua nhom I (u, tsu, ru, mu, bu, nu, gu, su).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n5_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 14
pool = Pool("n5")

VOCAB = [
    v(1,  "かいます", "買います", "かいます", "kaimasu", "verb", "Mua", "Đuôi う → って. Nhóm I. Đã gặp bài 6.", L),
    v(2,  "まちます", "待ちます", "まちます", "machimasu", "verb", "Chờ, đợi", "Đuôi つ → って. Nhóm I.", L),
    v(3,  "しにます", "死にます", "しにます", "shinimasu", "verb", "Chết, mất", "Đuôi ぬ → んで. Nhóm I. Động từ DUY NHẤT có đuôi ぬ trong tiếng Nhật hiện đại.", L),
    v(4,  "あそびます", "遊びます", "あそびます", "asobimasu", "verb", "Chơi, đi chơi", "Đuôi ぶ → んで. Nhóm I. Đã gặp bài 13.", L),
    v(5,  "すみます", "住みます", "すみます", "sumimasu", "verb", "Sống, cư trú", "Đuôi む → んで. Nhóm I.", L),
    v(6,  "はなします", "話します", "はなします", "hanashimasu", "verb", "Nói, trò chuyện", "Đuôi す → して (KHÔNG âm tiện, ngoại lệ trong nhóm I). Đã gặp bài 7.", L),
    v(7,  "いそぎます", "急ぎます", "いそぎます", "isogimasu", "verb", "Vội, gấp", "Đuôi ぐ → いで. Nhóm I.", L),
    v(8,  "つくります", "作ります", "つくります", "tsukurimasu", "verb", "Làm, chế tạo, nấu", "Đuôi る (nhóm I) → って. Đã gặp bài 6.", L),
    v(9,  "たちます", "立ちます", "たちます", "tachimasu", "verb", "Đứng dậy", "Đuôi つ → って. Nhóm I.", L),
    v(10, "すわります", "座ります", "すわります", "suwarimasu", "verb", "Ngồi xuống", "Đuôi る (nhóm I) → って.", L),
    v(11, "もちます", "持ちます", "もちます", "mochimasu", "verb", "Cầm, mang, sở hữu", "Đuôi つ → って.", L),
    v(12, "しります", "知ります", "しります", "shirimasu", "verb", "Biết (bắt đầu biết)", "Đuôi る (nhóm I) → って. 知っています = đã biết (trạng thái).", L),
    v(13, "あけます", "開けます", "あけます", "akemasu", "verb", "Mở (tha động từ)", "Nhóm II: bỏ ます thêm て → 開けて.", L),
    v(14, "しめます", "閉めます", "しめます", "shimemasu", "verb", "Đóng (tha động từ)", "Nhóm II.", L),
    v(15, "けします", "消します", "けします", "keshimasu", "verb", "Tắt, xóa", "Đuôi す → して. Nhóm I.", L),
    v(16, "てつだいます", "手伝います", "てつだいます", "tetsudaimasu", "verb", "Giúp đỡ, phụ giúp", "Đuôi う → って. Nhóm I.", L),
    v(17, "けっこんします", "結婚します", "けっこんします", "kekkonshimasu", "verb", "Kết hôn", "Nhóm III (します). 結婚しています = đã kết hôn (trạng thái, không phải đang cưới).", L),
    v(18, "きます", "来ます", "きます", "kimasu", "verb", "Đến", "Nhóm II bất quy tắc: 来て. Đã gặp bài 5.", L),
    v(19, "します", "", "", "shimasu", "verb", "Làm", "Nhóm III bất quy tắc: して. Đã gặp bài 6.", L),
    v(20, "しごと", "仕事", "しごと", "shigoto", "noun", "Công việc", "Đã gặp bài 9 — nay dùng làm chủ đề của Vています (đang làm việc).", L),
]

KANJI = [
    k(1, "待", "ĐÃI", 9, ["タイ (tai)"], ["ま(つ)"], "Chờ đợi.",
      [("待ちます", "まちます", "Chờ"), ("待合室", "まちあいしつ", "Phòng chờ"), ("期待", "きたい", "Kỳ vọng")], L),
    k(2, "住", "TRÚ", 7, ["ジュウ (juu)"], ["す(む)"], "Ở, cư trú.",
      [("住みます", "すみます", "Sống"), ("住所", "じゅうしょ", "Địa chỉ"), ("住民", "じゅうみん", "Cư dân")], L),
    k(3, "知", "TRI", 8, ["チ (chi)"], ["し(る)"], "Biết.",
      [("知ります", "しります", "Biết"), ("知らせます", "しらせます", "Thông báo"), ("案内", "あんない", "Hướng dẫn (từ ghép khác)")], L),
    k(4, "開", "KHAI", 12, ["カイ (kai)"], ["あ(ける)", "ひら(く)"], "Mở.",
      [("開けます", "あけます", "Mở"), ("開きます", "ひらきます", "Mở (tự động)"), ("公開", "こうかい", "Công khai")], L),
    k(5, "閉", "BẾ", 11, ["ヘイ (hei)"], ["し(める)"], "Đóng.",
      [("閉めます", "しめます", "Đóng"), ("閉店", "へいてん", "Đóng cửa hàng"), ("閉じます", "とじます", "Khép lại")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Ba nhóm động từ tiếng Nhật",
        "Nhóm I (五段) / Nhóm II (一段) / Nhóm III (bất quy tắc: する, 来る)",
        "Nhóm I: gốc kết thúc bằng âm う (う/つ/る/む/ぶ/ぬ/ぐ/す). Nhóm II: gốc kết thúc bằng "
        "え/い + る (ăn, xem…). Nhóm III: chỉ có đúng 2 từ しますvà来ます, chia hoàn toàn riêng.",
        [
            ex(L, 1, 1, [t("t-l14s1-1", "かいます", "買います", "かいます", key=True), t("t-l14s1-2", "→"),
                         t("t-l14s1-3", "かう", "買う", "かう")],
               "買います (nhóm I) — gốc từ điển 買う kết thúc bằng う."),
            ex(L, 1, 2, [t("t-l14s1-4", "あけます", "開けます", "あけます", key=True), t("t-l14s1-5", "→"),
                         t("t-l14s1-6", "あける", "開ける", "あける")],
               "開けます (nhóm II) — gốc từ điển 開ける kết thúc bằng ける."),
            ex(L, 1, 3, [t("t-l14s1-7", "きます", "来ます", "きます", key=True), t("t-l14s1-8", "、"),
                         t("t-l14s1-9", "します", key=True)],
               "来ます, します — hai động từ nhóm III, chia hoàn toàn riêng, phải học thuộc."),
        ],
        tips="Nhận nhóm SAI sẽ chia thể て SAI hoàn toàn — đây là kỹ năng nền tảng của mọi ngữ pháp N5 còn lại.",
        culture="帰ります trông giống nhóm II (kết thúc ります) nhưng THỰC RA là nhóm I — một trong vài ngoại lệ hình thức cần nhớ riêng."),

    slide(L, 2,
        "2. Chia thể て — Nhóm I (5 kiểu biến âm)",
        "う/つ/る→って　　ぬ/ぶ/む→んで　　く→いて　　ぐ→いで　　す→して",
        "Nhóm I có NĂM kiểu biến âm theo âm cuối của gốc từ điển. Đây là phần khó nhớ nhất — "
        "phải luyện qua nhiều động từ mẫu để phản xạ tự nhiên, không suy nghĩ từng bước.",
        [
            ex(L, 2, 1, [t("t-l14s2-1", "まって", "待って", "まって", key=True), t("t-l14s2-2", "ください")],
               "Xin hãy chờ. (待つ: つ → って)"),
            ex(L, 2, 2, [t("t-l14s2-3", "あそんで", "遊んで", "あそんで", key=True), t("t-l14s2-4", "ください")],
               "Xin hãy chơi thoải mái. (遊ぶ: ぶ → んで)"),
            ex(L, 2, 3, [t("t-l14s2-5", "はなして", "話して", "はなして", key=True), t("t-l14s2-6", "ください")],
               "Xin hãy nói. (話す: す → して, KHÔNG biến âm như nhóm ぬぶむ)"),
        ],
        tips="死にます (chết) là động từ DUY NHẤT có đuôi ぬ trong tiếng Nhật — học nó cũng là học luôn quy tắc ぬ→んで.",
        culture="Nhóm す không bao giờ biến âm thành っ hay ん — đây là 'lối thoát' dễ nhớ nhất trong 5 kiểu biến âm."),

    slide(L, 3,
        "3. Chia thể て — Nhóm II và Nhóm III",
        "Nhóm II: bỏ ます, thêm て   /   します→して   /   来ます→来て",
        "Nhóm II ĐƠN GIẢN NHẤT: chỉ cần bỏ ます, thêm て — không có biến âm nào cả. "
        "Nhóm III chỉ có hai từ, chia riêng và phải học thuộc lòng.",
        [
            ex(L, 3, 1, [t("t-l14s3-1", "しめて", "閉めて", "しめて", key=True), t("t-l14s3-2", "ください")],
               "Xin hãy đóng lại. (閉めます nhóm II: bỏ ます, thêm て)"),
            ex(L, 3, 2, [t("t-l14s3-3", "けっこん", "結婚", "けっこん"), t("t-l14s3-4", "して", key=True),
                         t("t-l14s3-5", "います", "居ます", "います")],
               "Anh ấy đã kết hôn. (結婚します nhóm III: します → して)"),
        ],
        tips="Nhóm II dễ chia nhất — nếu nhận diện SAI một động từ nhóm I thành nhóm II, cả câu sẽ sai theo.",
        culture="Ghi nhớ ba từ nhóm I dễ nhầm với nhóm II vì đều kết thúc bằng ります: 帰ります、要ります、走ります."),

    slide(L, 4,
        "4. Ba cách dùng thể て đã học được",
        "Vて ください (yêu cầu) / Vて います (đang…) / Vましょうか (đề nghị giúp)",
        "Vて ください: yêu cầu lịch sự. Vて います: hành động ĐANG DIỄN RA, hoặc TRẠNG THÁI đã "
        "xác lập (結婚しています, 住んでいます — không dịch là 'đang', mà là 'đã'/'hiện đang là').",
        [
            ex(L, 4, 1, [t("t-l14s4-1", "ここ"), t("t-l14s4-2", "に"), t("t-l14s4-3", "すわって", "座って", "すわって", key=True),
                         t("t-l14s4-4", "ください")],
               "Xin mời ngồi ở đây."),
            ex(L, 4, 2, [t("t-l14s4-5", "いま"), t("t-l14s4-6", "しごと", "仕事", "しごと"), t("t-l14s4-7", "を"),
                         t("t-l14s4-8", "して", key=True), t("t-l14s4-9", "います", "居ます", "います")],
               "Bây giờ tôi đang làm việc."),
            ex(L, 4, 3, [t("t-l14s4-10", "にもつ", "荷物", "にもつ"), t("t-l14s4-11", "を"),
                         t("t-l14s4-12", "もちましょうか", "持ちましょうか", "もちましょうか", key=True)],
               "Để tôi cầm đồ giúp anh nhé?"),
        ],
        tips="Vています với động từ TRẠNG THÁI (住む, 結婚する, 知る) luôn dịch là 'đã/hiện' — KHÔNG dịch 'đang' như hành động thường.",
        culture="手伝いましょうか là câu đề nghị giúp đỡ xã giao rất thường gặp — từ chối lịch sự bằng いいえ、大丈夫です。"),
]

DIALOGUE = [
    line(L, 1, "ミラー", "Nhân viên công ty",
         [t("d-l14-1", "すみません"), t("d-l14-2", "、"), t("d-l14-3", "まど", "窓", "まど"),
          t("d-l14-4", "を"), t("d-l14-5", "あけて", "開けて", "あけて", key=True), t("d-l14-6", "ください")],
         "Xin lỗi, làm ơn mở cửa sổ giúp tôi."),
    line(L, 2, "グプタ", "Đồng nghiệp",
         [t("d-l14-7", "はい"), t("d-l14-8", "、"), t("d-l14-9", "わかりました", "分かりました", "わかりました")],
         "Vâng, tôi hiểu rồi."),
    line(L, 3, "ミラー", "Nhân viên công ty",
         [t("d-l14-10", "グプタさん"), t("d-l14-11", "は"), t("d-l14-12", "どこ", key=True),
          t("d-l14-13", "に"), t("d-l14-14", "すんで", "住んで", "すんで", key=True), t("d-l14-15", "いますか", "居ますか", "いますか")],
         "Anh Gupta hiện sống ở đâu vậy?"),
    line(L, 4, "グプタ", "Đồng nghiệp",
         [t("d-l14-16", "とうきょう", "東京", "とうきょう"), t("d-l14-17", "に"),
          t("d-l14-18", "すんで", "住んで", "すんで", key=True), t("d-l14-19", "います", "居ます", "います")],
         "Tôi đang sống ở Tokyo."),
    line(L, 5, "ミラー", "Nhân viên công ty",
         [t("d-l14-20", "けっこん", "結婚", "けっこん", key=True), t("d-l14-21", "して", key=True),
          t("d-l14-22", "いますか", "居ますか", "いますか")],
         "Anh đã kết hôn chưa?"),
    line(L, 6, "グプタ", "Đồng nghiệp",
         [t("d-l14-23", "はい"), t("d-l14-24", "、"), t("d-l14-25", "けっこん", "結婚", "けっこん"),
          t("d-l14-26", "して", key=True), t("d-l14-27", "います", "居ます", "います")],
         "Vâng, tôi đã kết hôn."),
    line(L, 7, "ミラー", "Nhân viên công ty",
         [t("d-l14-28", "そうですか"), t("d-l14-29", "。"), t("d-l14-30", "あ"), t("d-l14-31", "、"),
          t("d-l14-32", "にもつ", "荷物", "にもつ"), t("d-l14-33", "が"), t("d-l14-34", "おおい", "多い", "おおい"),
          t("d-l14-35", "です"), t("d-l14-36", "ね"), t("d-l14-37", "。"), t("d-l14-38", "てつだいましょうか", "手伝いましょうか", "てつだいましょうか", key=True)],
         "Vậy à. À, đồ đạc nhiều quá nhỉ. Để tôi giúp anh nhé?"),
    line(L, 8, "グプタ", "Đồng nghiệp",
         [t("d-l14-39", "ありがとう"), t("d-l14-40", "ございます"), t("d-l14-41", "。"),
          t("d-l14-42", "じゃ"), t("d-l14-43", "、"), t("d-l14-44", "この"), t("d-l14-45", "はこ", "箱", "はこ"),
          t("d-l14-46", "を"), t("d-l14-47", "もって", "持って", "もって", key=True), t("d-l14-48", "ください")],
         "Cảm ơn anh nhiều. Vậy thì, làm ơn cầm giúp cái hộp này."),
    line(L, 9, "ミラー", "Nhân viên công ty",
         [t("d-l14-49", "はい"), t("d-l14-50", "、"), t("d-l14-51", "わかりました", "分かりました", "わかりました"),
          t("d-l14-52", "。"), t("d-l14-53", "ここ"), t("d-l14-54", "で"), t("d-l14-55", "まって", "待って", "まって", key=True),
          t("d-l14-56", "いて", "いて", "いて"), t("d-l14-57", "ください")],
         "Vâng, tôi hiểu rồi. Anh đợi ở đây nhé."),
    line(L, 10, "グプタ", "Đồng nghiệp",
         [t("d-l14-58", "ありがとう"), t("d-l14-59", "ございます"), t("d-l14-60", "。"),
          t("d-l14-61", "たすかりました", "助かりました", "たすかりました")],
         "Cảm ơn anh nhiều. Anh giúp tôi nhiều quá."),
]

EXERCISES = [
    q(L, 1, "買います thuộc nhóm động từ nào?",
      ["Nhóm I (gốc 買う kết thúc bằng う)", "Nhóm II", "Nhóm III", "Không thuộc nhóm nào"], 0,
      "買う kết thúc bằng âm う, thuộc nhóm I (五段動詞).",
      "Xem đuôi của thể từ điển."),
    q(L, 2, "帰ります trông giống nhóm II nhưng thực ra là:",
      ["Nhóm I (ngoại lệ hình thức)", "Nhóm II thật sự",
       "Nhóm III", "Không phải động từ"], 0,
      "帰る là một trong vài động từ đặc biệt: hình thức giống nhóm II (kết thúc ります) nhưng chia theo quy tắc nhóm I.",
      "Đây là ngoại lệ cần nhớ riêng, đã nhắc ở slide 3."),
    q(L, 3, "Thể て của 待ちます (nhóm I, đuôi つ) là:",
      ["待って", "待んで", "待いて", "待して"], 0,
      "Nhóm I có đuôi う/つ/る đều biến thành って khi chia thể て.",
      "つ nằm trong nhóm biến âm って."),
    q(L, 4, "Thể て của 遊びます (nhóm I, đuôi ぶ) là:",
      ["遊んで", "遊って", "遊いて", "遊して"], 0,
      "Nhóm I có đuôi ぬ/ぶ/む đều biến thành んで.",
      "ぶ nằm trong nhóm biến âm んで."),
    q(L, 5, "Thể て của 話します (nhóm I, đuôi す) là:",
      ["話して", "話んで", "話って", "話いて"], 0,
      "Nhóm I có đuôi す biến thành して — KHÔNG biến âm っ hay ん như các đuôi khác.",
      "す là 'lối thoát' dễ nhớ nhất trong 5 kiểu biến âm."),
    q(L, 6, "Thể て của 閉めます (nhóm II) là:",
      ["閉めて", "閉めって", "閉めんで", "閉まって"], 0,
      "Nhóm II chỉ cần bỏ ます, thêm て — không có biến âm nào.",
      "Đây là nhóm dễ chia nhất."),
    q(L, 7, "「東京に 住んでいます」 dịch đúng là:",
      ["Tôi hiện đang sống ở Tokyo (trạng thái)", "Tôi đang đi đến Tokyo",
       "Tôi đã từng sống ở Tokyo nhưng giờ không còn", "Tôi sẽ sống ở Tokyo"], 0,
      "住んでいます với động từ TRẠNG THÁI (住む) diễn tả tình trạng HIỆN TẠI, không phải hành động đang xảy ra từng khoảnh khắc.",
      "So sánh với 食べています (đang ăn, hành động tức thời)."),
    q(L, 8, "「結婚しています」 khác 「結婚します」 ở chỗ:",
      ["結婚しています = đã kết hôn (trạng thái); 結婚します = sẽ kết hôn (hành động tương lai)",
       "Hoàn toàn giống nhau", "結婚しています sai ngữ pháp",
       "結婚します là quá khứ"], 0,
      "結婚する là động từ TỨC THỜI — làm xong là chuyển trạng thái ngay, nên ています diễn tả trạng thái ĐÃ kết hôn.",
      "Đây là điểm ngữ pháp tinh tế của nhóm động từ tức thời."),
    q(L, 9, "「手伝いましょうか」 dùng để làm gì?",
      ["Đề nghị giúp đỡ ai đó", "Ra lệnh ai đó giúp mình",
       "Hỏi ai đã giúp chưa", "Từ chối giúp đỡ"], 0,
      "Vましょうか là cấu trúc đề nghị chủ động giúp đỡ, khác Vませんか (mời làm cùng, bài 6).",
      "So sánh với Vませんか đã học ở bài 6."),
    q(L, 10, "死にます là động từ đặc biệt vì:",
      ["Là động từ DUY NHẤT có đuôi ぬ trong thể từ điển", "Không chia được thể て",
       "Thuộc nhóm II", "Không có nghĩa"], 0,
      "死ぬ là động từ duy nhất còn lại có đuôi ぬ trong tiếng Nhật hiện đại — học nó gắn liền với quy tắc ぬ→んで.",
      "Xem lại ghi chú từ vựng của từ này."),
]

LESSON = lesson(
    L,
    "Bài 14: Nhóm động từ & Thể て (Vてください / Vています / Vましょうか)",
    "Nhận diện ba nhóm động từ (I: 5 kiểu biến âm う/つ/る→って, ぬ/ぶ/む→んで, く→いて, ぐ→いで, "
    "す→して; II: bỏ ます thêm て; III bất quy tắc), và ba cách dùng thể て: yêu cầu Vてください, "
    "hành động/trạng thái đang diễn ra Vています, đề nghị giúp đỡ Vましょうか.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB], lesson=L)
    merge([LESSON])
