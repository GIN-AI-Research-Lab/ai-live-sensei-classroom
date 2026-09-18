# -*- coding: utf-8 -*-
"""N1 — Bai 9: Bat buoc tu luong tam — Vずにはおかない (tac dong KHACH QUAN tat
yeu, mot su viec/loi noi CHAC CHAN se khien nguoi khac phai phan ung) va
Vないではすまない (NGHIA VU dao duc/xa hoi, khong [V] thi khong xong).

Tu vung minh hoa TU CHON tu pool mo data/jlpt-vocab/n1.csv (xem NOTICE.md).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from n1_lib import v, k, t, ex, slide, line, q, lesson, merge
from jlpt_pool import Pool

L = 9
pool = Pool("n1")

VOCAB = [
    v(1,  "あやまります", "謝ります", "あやまります", "ayamarimasu", "verb", "Xin lỗi", "謝らないでは すまない = bắt buộc phải xin lỗi.", L),
    v(2,  "なっとくします", "納得します", "なっとくします", "nattoku shimasu", "verb", "Đồng tình, chấp nhận, hiểu ra", "納得させずには おかない = chắc chắn sẽ khiến đồng tình.", L),
    v(3,  "きしゃ", "記者", "きしゃ", "kisha", "noun", "Phóng viên, nhà báo", "記者が 質問します = phóng viên đặt câu hỏi.", L),
    v(4,  "とります", "取ります", "とります", "torimasu", "verb", "Lấy, chịu (trách nhiệm)", "責任を 取ります = chịu trách nhiệm.", L),
    v(5,  "かいけん", "会見", "かいけん", "kaiken", "noun", "Cuộc họp báo, buổi phỏng vấn chính thức", "記者会見 = buổi họp báo.", L),
    v(6,  "こたえます", "答えます", "こたえます", "kotaemasu", "verb", "Trả lời", "質問に 答えます = trả lời câu hỏi.", L),
    v(7,  "かんどうします", "感動します", "かんどうします", "kandou shimasu", "verb", "Cảm động", "Đã gặp N3 bài 11.", L),
    v(8,  "せつめいします", "説明します", "せつめいします", "setsumei shimasu", "verb", "Giải thích", "Đã gặp N4 bài 34.", L),
    v(9,  "せきにん", "責任", "せきにん", "sekinin", "noun", "Trách nhiệm", "Đã gặp N3 bài 19.", L),
    v(10, "えいが", "映画", "えいが", "eiga", "noun", "Phim, điện ảnh", "Đã gặp N5 bài 4.", L),
    v(11, "しつもん", "質問", "しつもん", "shitsumon", "noun", "Câu hỏi", "Đã gặp N5 bài 11.", L),
    v(12, "しゃちょう", "社長", "しゃちょう", "shachou", "noun", "Giám đốc", "Đã gặp N4 bài 41.", L),
    v(13, "かいしゃ", "会社", "かいしゃ", "kaisha", "noun", "Công ty", "Đã gặp N5 bài 3.", L),
    v(14, "もんだい", "問題", "もんだい", "mondai", "noun", "Vấn đề", "Đã gặp N3 bài 13.", L),
    v(15, "じたい", "事態", "じたい", "jitai", "noun", "Tình thế, tình huống", "Đã gặp N1 bài 5.", L),
    v(16, "とうさん", "倒産", "とうさん", "tousan", "noun", "Phá sản", "Đã gặp N1 bài 5.", L),
    v(17, "ふせい", "不正", "ふせい", "fusei", "noun", "Sự bất chính, gian lận", "Đã gặp N1 bài 6.", L),
    v(18, "ぎいん", "議員", "ぎいん", "giin", "noun", "Nghị sĩ", "Đã gặp N1 bài 6.", L),
    v(19, "しんじます", "信じます", "しんじます", "shinjimasu", "verb", "Tin tưởng", "Đã gặp N3 bài 1.", L),
    v(20, "しんらい", "信頼", "しんらい", "shinrai", "noun", "Sự tin cậy", "Đã gặp N1 bài 6.", L),
]

KANJI = [
    k(1, "記", "KÝ", 10, ["キ (ki)"], ["しる(す)"], "Ghi chép.",
      [("記者", "きしゃ", "Phóng viên"), ("日記", "にっき", "Nhật ký")], L),
    k(2, "者", "GIẢ", 8, ["シャ (sha)"], ["もの"], "Người (hậu tố chỉ người).",
      [("記者", "きしゃ", "Phóng viên"), ("学者", "がくしゃ", "Học giả")], L),
    k(3, "納", "NẠP", 10, ["ノウ (nou)", "ナッ (na)"], ["おさ(める)"], "Nộp, chấp nhận.",
      [("納得", "なっとく", "Đồng tình, hiểu ra"), ("納品", "のうひん", "Giao hàng")], L),
    k(4, "得", "ĐẮC", 11, ["トク (toku)"], ["え(る)"], "Đạt được.",
      [("納得", "なっとく", "Đồng tình"), ("得意", "とくい", "Sở trường")], L),
    k(5, "任", "NHIỆM", 6, ["ニン (nin)"], ["まか(せる)"], "Nhiệm vụ, trách nhiệm.",
      [("責任", "せきにん", "Trách nhiệm"), ("任せます", "まかせます", "Giao phó, ủy thác")], L),
]

SLIDES = [
    slide(L, 1,
        "1. Chắc chắn sẽ khiến... không thể không... (tác động khách quan tất yếu): V(させる)ずにはおかない",
        "V(thể sai khiến/未然形) + ずにはおかない (する→せずにはおかない)",
        "ずにはおかない diễn tả một SỰ VIỆC/TÁC ĐỘNG KHÁCH QUAN (phim, lời nói, sự kiện) CHẮC CHẮN sẽ "
        "khiến người khác PHẢI phản ứng theo một cách nào đó một cách TỰ NHIÊN, không thể kiềm chế "
        "được — chủ thể ngữ pháp thường là SỰ VIỆC, không phải người quyết định làm.",
        [
            ex(L, 1, 1, [t("t-l9s1-1", "この"), t("t-l9s1-2", "えいが", "映画", "えいが", key=True), t("t-l9s1-3", "は"),
                         t("t-l9s1-4", "ひと", "人", "ひと"), t("t-l9s1-5", "を"), t("t-l9s1-6", "かんどうさせず", "感動させず", "かんどうさせず", key=True),
                         t("t-l9s1-7", "には"), t("t-l9s1-8", "おかない", key=True)],
               "Bộ phim này chắc chắn sẽ khiến người xem cảm động."),
            ex(L, 1, 2, [t("t-l9s1-9", "かれ", "彼", "かれ"), t("t-l9s1-10", "の"), t("t-l9s1-11", "せつめい", "説明", "せつめい", key=True),
                         t("t-l9s1-12", "は"), t("t-l9s1-13", "、"), t("t-l9s1-14", "きしゃ", "記者", "きしゃ", key=True),
                         t("t-l9s1-15", "を"), t("t-l9s1-16", "なっとくさせず", "納得させず", "なっとくさせず", key=True),
                         t("t-l9s1-17", "には"), t("t-l9s1-18", "おかない", key=True)],
               "Lời giải thích của anh ấy chắc chắn sẽ khiến các phóng viên đồng tình."),
        ],
        tips="する chuyển thành せずにはおかない (không phải しずには) — đây là điểm bất quy tắc cần nhớ kỹ.",
        culture="Lời quảng cáo phim/sách ở Nhật hay dùng '読む者を感動させずにはおかない' (chắc chắn sẽ khiến người đọc cảm động) để nhấn mạnh sức ảnh hưởng mãnh liệt của tác phẩm."),

    slide(L, 2,
        "2. Không [V] thì không xong / bắt buộc phải [V] (nghĩa vụ đạo đức, xã hội): Vない + ではすまない",
        "V(ない形) + ではすまない",
        "ないではすまない diễn tả rằng nếu KHÔNG làm một việc gì đó thì sẽ KHÔNG ỔN/KHÔNG ĐƯỢC XÃ HỘI "
        "CHẤP NHẬN — nhấn mạnh NGHĨA VỤ ĐẠO ĐỨC/TRÁCH NHIỆM bắt buộc phải thực hiện, khác với ずにはお"
        "かない (chủ thể là SỰ VIỆC gây tác động khách quan).",
        [
            ex(L, 2, 1, [t("t-l9s2-1", "あやまらない", "謝らない", "あやまらない", key=True), t("t-l9s2-2", "では"),
                         t("t-l9s2-3", "すまない", key=True)],
               "Không xin lỗi thì không xong. (bắt buộc phải xin lỗi)"),
            ex(L, 2, 2, [t("t-l9s2-4", "せきにん", "責任", "せきにん", key=True), t("t-l9s2-5", "を"),
                         t("t-l9s2-6", "とらない", "取らない", "とらない", key=True), t("t-l9s2-7", "では"),
                         t("t-l9s2-8", "すまない", key=True)],
               "Không chịu trách nhiệm thì không xong. (bắt buộc phải chịu trách nhiệm)"),
        ],
        tips="Dạng lịch sự là 〜ではすみません — hay dùng khi tự nhắc nhở bản thân về nghĩa vụ đạo đức trong hoàn cảnh trang trọng.",
        culture="ないではすまない hay xuất hiện trong lời tự kiểm điểm của quan chức/lãnh đạo Nhật: '謝らないでは済まない事態だ' (đây là tình huống mà không xin lỗi thì không xong)."),

    slide(L, 3,
        "3. So sánh ずにはおかない và ないではすまない",
        "ずにはおかない: TÁC ĐỘNG KHÁCH QUAN (sự việc khiến người KHÁC phản ứng)　vs　ないではすまない: NGHĨA VỤ ĐẠO ĐỨC (chủ thể tự phải làm)",
        "ずにはおかない dùng khi CHỦ NGỮ là một SỰ VIỆC/TÁC PHẨM có sức ảnh hưởng khiến NGƯỜI KHÁC "
        "phản ứng; ないではすまない dùng khi CHỦ THỂ (thường là chính người nói/nhân vật) cảm thấy có "
        "NGHĨA VỤ phải tự mình thực hiện một hành động, nếu không sẽ không ổn về mặt đạo đức/xã hội.",
        [
            ex(L, 3, 1, [t("t-l9s3-1", "きしゃ", "記者", "きしゃ", key=True), t("t-l9s3-2", "は"),
                         t("t-l9s3-3", "、"), t("t-l9s3-4", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l9s3-5", "に"),
                         t("t-l9s3-6", "しつもん", "質問", "しつもん", key=True), t("t-l9s3-7", "しない"), t("t-l9s3-8", "では"),
                         t("t-l9s3-9", "すまない", key=True)],
               "Phóng viên không thể không đặt câu hỏi cho giám đốc. (nghĩa vụ nghề nghiệp)"),
            ex(L, 3, 2, [t("t-l9s3-10", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l9s3-11", "は"),
                         t("t-l9s3-12", "、"), t("t-l9s3-13", "しつもん", "質問", "しつもん", key=True), t("t-l9s3-14", "に"),
                         t("t-l9s3-15", "こたえない", "答えない", "こたえない", key=True), t("t-l9s3-16", "では"),
                         t("t-l9s3-17", "すまなかった", key=True)],
               "Giám đốc không thể không trả lời câu hỏi. (nghĩa vụ, thì quá khứ)"),
        ],
        tips="Mẹo: chủ ngữ là 'vật/sự việc gây tác động' → ずにはおかない; chủ ngữ là 'người có nghĩa vụ tự làm' → ないではすまない.",
        culture="Cả hai cấu trúc đều rất trang trọng, thường thấy trong bài xã luận hoặc lời tự bạch mang tính đạo đức/trách nhiệm cao."),

    slide(L, 4,
        "4. Kết hợp trong một buổi họp báo hoàn chỉnh",
        "記者は質問しないではすまない (nghĩa vụ hỏi) + 説明は記者を納得させずにはおかない (tác động khách quan của câu trả lời)",
        "Trong một buổi họp báo (記者会見), phóng viên CẢM THẤY CÓ NGHĨA VỤ phải đặt câu hỏi "
        "(ないではすまない), còn một lời giải thích THUYẾT PHỤC thì CHẮC CHẮN sẽ khiến mọi người đồng "
        "tình (ずにはおかない) — hai cấu trúc bổ sung cho nhau để mô tả đầy đủ động lực của cả hai phía.",
        [
            ex(L, 4, 1, [t("t-l9s4-1", "きしゃ", "記者", "きしゃ", key=True), t("t-l9s4-2", "は"),
                         t("t-l9s4-3", "、"), t("t-l9s4-4", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l9s4-5", "に"),
                         t("t-l9s4-6", "しつもん", "質問", "しつもん", key=True), t("t-l9s4-7", "しない"), t("t-l9s4-8", "では"),
                         t("t-l9s4-9", "すまない", key=True)],
               "Phóng viên không thể không đặt câu hỏi cho giám đốc."),
            ex(L, 4, 2, [t("t-l9s4-10", "しゃちょう", "社長", "しゃちょう", key=True), t("t-l9s4-11", "の"),
                         t("t-l9s4-12", "せつめい", "説明", "せつめい", key=True), t("t-l9s4-13", "は"),
                         t("t-l9s4-14", "、"), t("t-l9s4-15", "きしゃ", "記者", "きしゃ", key=True), t("t-l9s4-16", "を"),
                         t("t-l9s4-17", "なっとくさせず", "納得させず", "なっとくさせず", key=True), t("t-l9s4-18", "には"),
                         t("t-l9s4-19", "おかない", key=True)],
               "Lời giải thích của giám đốc chắc chắn sẽ khiến các phóng viên đồng tình."),
        ],
        tips="Dạng lịch sự trong hội thoại trang trọng: ずにはおきません / ではすみません.",
        culture="Buổi họp báo xin lỗi (謝罪会見) ở Nhật thường được đánh giá thành công hay không dựa trên việc lời giải thích có '記者を納得させずにはおかない' hay không."),
]

DIALOGUE = [
    line(L, 1, "記者", "Phóng viên",
         [t("d9-1", "きょう", "今日", "きょう"), t("d9-2", "は"), t("d9-3", "きしゃ", "記者", "きしゃ", key=True),
          t("d9-4", "かいけん", "会見", "かいけん", key=True), t("d9-5", "です")],
         "Hôm nay là buổi họp báo."),
    line(L, 2, "社長", "Giám đốc",
         [t("d9-6", "はい"), t("d9-7", "。"), t("d9-8", "しつもん", "質問", "しつもん", key=True), t("d9-9", "を"),
          t("d9-10", "どうぞ")],
         "Vâng. Xin mời đặt câu hỏi."),
    line(L, 3, "記者", "Phóng viên",
         [t("d9-11", "しゃちょう", "社長", "しゃちょう", key=True), t("d9-12", "は"), t("d9-13", "あやまらない", "謝らない", "あやまらない", key=True),
          t("d9-14", "では"), t("d9-15", "すみません", key=True)],
         "Giám đốc bắt buộc phải xin lỗi."),
    line(L, 4, "社長", "Giám đốc",
         [t("d9-16", "はい"), t("d9-17", "。"), t("d9-18", "すみません")],
         "Vâng. Xin lỗi."),
    line(L, 5, "記者", "Phóng viên",
         [t("d9-19", "せきにん", "責任", "せきにん", key=True), t("d9-20", "を"), t("d9-21", "とらない", "取らない", "とらない", key=True),
          t("d9-22", "では"), t("d9-23", "すみません", key=True)],
         "Ông bắt buộc phải chịu trách nhiệm."),
    line(L, 6, "社長", "Giám đốc",
         [t("d9-24", "はい"), t("d9-25", "、"), t("d9-26", "せきにん", "責任", "せきにん", key=True), t("d9-27", "を"),
          t("d9-28", "とります", "取ります", "とります", key=True)],
         "Vâng, tôi sẽ chịu trách nhiệm."),
    line(L, 7, "記者", "Phóng viên",
         [t("d9-29", "この"), t("d9-30", "せつめい", "説明", "せつめい", key=True), t("d9-31", "で"),
          t("d9-32", "、"), t("d9-33", "みんな"), t("d9-34", "なっとくします", "納得します", "なっとくします", key=True), t("d9-35", "か")],
         "Với lời giải thích này, mọi người sẽ đồng tình chứ?"),
    line(L, 8, "社長", "Giám đốc",
         [t("d9-36", "わたし", "私", "わたし"), t("d9-37", "の"), t("d9-38", "せつめい", "説明", "せつめい", key=True),
          t("d9-39", "は"), t("d9-40", "、"), t("d9-41", "きしゃ", "記者", "きしゃ", key=True), t("d9-42", "を"),
          t("d9-43", "なっとくさせず", "納得させず", "なっとくさせず", key=True), t("d9-44", "には"), t("d9-45", "おきません", key=True)],
         "Lời giải thích của tôi chắc chắn sẽ khiến các phóng viên đồng tình."),
    line(L, 9, "記者", "Phóng viên",
         [t("d9-46", "しゃいん", "社員", "しゃいん"), t("d9-47", "は"), t("d9-48", "どう"), t("d9-49", "おもいますか", "思いますか", "おもいますか")],
         "Nhân viên nghĩ sao?"),
    line(L, 10, "社長", "Giám đốc",
         [t("d9-50", "これから"), t("d9-51", "は"), t("d9-52", "、"), t("d9-53", "まじめに", "真面目に", "まじめに"),
          t("d9-54", "はなさない", "話さない", "はなさない", key=True), t("d9-55", "では"), t("d9-56", "すみません", key=True)],
         "Từ giờ, tôi bắt buộc phải nói thật nghiêm túc."),
]

EXERCISES = [
    q(L, 1, "「この映画は人を感動させずにはおかない」 — ずにはおかない diễn tả điều gì?",
      ["Một sự việc/tác phẩm CHẮC CHẮN sẽ khiến người khác phản ứng theo một cách tự nhiên",
       "Nghĩa vụ đạo đức mà chính người nói phải thực hiện", "Sự cho phép làm việc gì đó",
       "Một quá trình dẫn đến kết quả"], 0,
      "ずにはおかない diễn tả tác động khách quan: sự việc/tác phẩm chắc chắn sẽ khiến người khác phản ứng.",
      "Xem cấu trúc ずにはおかない ở slide 1."),
    q(L, 2, "「責任を取らないではすまない」 — ないではすまない dùng để làm gì?",
      ["Nhấn mạnh NGHĨA VỤ đạo đức/xã hội — nếu không làm thì không ổn",
       "Diễn tả tác động khách quan của một sự việc", "Xin phép làm việc gì đó",
       "Đưa ra lời khuyên nhẹ nhàng"], 0,
      "ないではすまない nhấn mạnh nghĩa vụ bắt buộc phải làm, nếu không sẽ không được chấp nhận về mặt đạo đức/xã hội.",
      "Xem cấu trúc ないではすまない ở slide 2."),
    q(L, 3, "Sự khác biệt cốt lõi giữa ずにはおかない và ないではすまない là gì?",
      ["ずにはおかない: chủ ngữ là SỰ VIỆC tác động lên người khác; ないではすまない: chủ thể tự thấy có NGHĨA VỤ",
       "Hoàn toàn giống nhau, dùng thay thế được cho nhau",
       "ずにはおかない chỉ dùng cho câu hỏi", "ないではすまない chỉ dùng cho câu khẳng định"], 0,
      "ずにはおかない có chủ ngữ là sự việc/tác phẩm; ないではすまない có chủ thể là người cảm thấy nghĩa vụ đạo đức.",
      "Xem bảng so sánh ở slide 3."),
    q(L, 4, "する chuyển thành dạng nào khi dùng với ずにはおかない?",
      ["せずにはおかない (bất quy tắc, không phải しずには)", "しずにはおかない",
       "するずにはおかない", "しますずにはおかない"], 0,
      "する là động từ bất quy tắc, chuyển thành せずにはおかない khi dùng với cấu trúc này.",
      "Xem lưu ý ngữ pháp ở slide 1."),
    q(L, 5, "「彼の説明は、記者を納得させずにはおかない」 nghĩa là:",
      ["Lời giải thích của anh ấy chắc chắn sẽ khiến các phóng viên đồng tình",
       "Lời giải thích của anh ấy chắc chắn sẽ khiến các phóng viên nghi ngờ",
       "Không ai quan tâm đến lời giải thích", "Lời giải thích chưa được đưa ra"], 0,
      "させずにはおかない ở đây khẳng định tác động tất yếu: chắc chắn sẽ khiến đồng tình.",
      "Áp dụng cấu trúc ずにはおかない cho ngữ cảnh giải thích."),
    q(L, 6, "Tại sao ずにはおかない và ないではすまない thường xuất hiện CÙNG NHAU trong một buổi họp báo?",
      ["Để mô tả nghĩa vụ của phóng viên (đặt câu hỏi) và tác động tất yếu của lời giải thích thuyết phục",
       "Vì chúng có nghĩa giống hệt nhau nên dùng thay phiên", "Không có lý do đặc biệt",
       "Vì quy tắc ngữ pháp bắt buộc phải dùng chung"], 0,
      "ないではすまない mô tả nghĩa vụ của phóng viên; ずにはおかない mô tả tác động tất yếu của một lời giải thích tốt.",
      "Xem cấu trúc buổi họp báo hoàn chỉnh ở slide 4."),
    q(L, 7, "「記者は、社長に質問しないではすまない」 nghĩa là:",
      ["Phóng viên không thể không đặt câu hỏi cho giám đốc (nghĩa vụ nghề nghiệp)",
       "Phóng viên được phép không đặt câu hỏi nếu muốn", "Phóng viên không quan tâm đến câu hỏi",
       "Giám đốc cấm phóng viên đặt câu hỏi"], 0,
      "ないではすまない ở đây nhấn mạnh nghĩa vụ nghề nghiệp: phóng viên bắt buộc phải hỏi.",
      "Áp dụng cấu trúc ないではすまない cho ngữ cảnh nghề nghiệp."),
    q(L, 8, "Theo hội thoại, giám đốc đã hứa sẽ làm gì với trách nhiệm?",
      ["Chịu trách nhiệm (責任を取ります)", "Từ chối chịu trách nhiệm", "Không nhắc đến trách nhiệm",
       "Đổ lỗi cho người khác"], 0,
      "Giám đốc nói 「はい、責任を取ります」.",
      "Xem câu thoại thứ 6."),
    q(L, 9, "Theo hội thoại, giám đốc tin rằng lời giải thích của mình sẽ có tác dụng gì?",
      ["Chắc chắn sẽ khiến các phóng viên đồng tình (記者を納得させずにはおきません)",
       "Sẽ khiến các phóng viên tức giận hơn", "Sẽ không ai tin", "Không có tác dụng gì"], 0,
      "Giám đốc nói 「私の説明は、記者を納得させずにはおきません」.",
      "Xem câu thoại thứ 8."),
    q(L, 10, "Theo hội thoại, giám đốc cam kết điều gì cho tương lai?",
      ["Nói chuyện nghiêm túc, trung thực (真面目に話さないではすみません)",
       "Sẽ tiếp tục che giấu sự thật", "Sẽ từ chức ngay lập tức", "Không cam kết gì cả"], 0,
      "Giám đốc nói 「これからは、真面目に話さないではすみません」.",
      "Xem câu thoại thứ 10."),
]

LESSON = lesson(
    L,
    "Bài 9: Bắt buộc từ lương tâm (ずにはおかない & ないではすまない)",
    "Vずにはおかない (せずにはおかない cho する) diễn tả một sự việc/tác phẩm CHẮC CHẮN sẽ khiến người "
    "khác phản ứng theo cách tự nhiên, không thể kiềm chế; Vないではすまない nhấn mạnh NGHĨA VỤ đạo "
    "đức/xã hội — nếu không làm thì sẽ không ổn. Cả hai đều là văn phong trang trọng, thường kết hợp "
    "trong bối cảnh họp báo hoặc lời tự kiểm điểm để mô tả cả nghĩa vụ phải hành động lẫn tác động tất yếu của hành động đó.",
    VOCAB, KANJI, SLIDES, DIALOGUE, EXERCISES,
)

if __name__ == "__main__":
    pool.mark_used([w["word"] for w in VOCAB if w["word"]], lesson=L)
    merge([LESSON])
