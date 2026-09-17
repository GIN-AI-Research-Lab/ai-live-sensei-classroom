#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Full JLPT N5–N1 Curriculum Generator
Sinh dữ liệu bài giảng hoàn chỉnh từ N5 đến N1 kèm Slide có ID tokens và bộ bài tập trắc nghiệm giải thích chi tiết.
"""

import json
import os

os.makedirs('curriculum', exist_ok=True)

# ==========================================
# 1. GENERATE N5 CURRICULUM (25 LESSONS)
# ==========================================
def generate_n5():
    lessons = []
    
    n5_data = [
        (1, "Bài 1: Khẳng định, Phủ định & Nghi vấn với です", 
         "N1 [chủ ngữ] + は + N2 + です", 
         "Trợ từ は đánh dấu chủ đề, phát âm là 'wa'. です khẳng định lịch sự danh từ.",
         [
             ("tok-n5-l1-1", "わたし", "私", "わたし", "は", "Nam", "です", "Tôi là Nam."),
             ("tok-n5-l1-2", "たなかさん", "田中さん", "たなかさん", "は", "せんせい", "です", "Anh Tanaka là giáo viên.")
         ],
         [
             ("ex-q-n5-1-1", "わたし ___ ベトナム人です。", ["は", "が", "を", "に"], 0, "Trợ từ は (đọc là wa) dùng để đánh dấu chủ ngữ/chủ đề trong câu khẳng định danh từ.", "Chọn trợ từ đánh dấu chủ ngữ."),
             ("ex-q-n5-1-2", "ミラーさんは 医者 ___ ありません。", ["じゃ", "で", "を", "が"], 0, "Phủ định của です là じゃありません (thân mật lịch sự) hoặc ではありません (trang trọng).", "Chọn từ phủ định danh từ.")
         ]),
        (2, "Bài 2: Chỉ thị từ これ / それ / あれ & この / その / あの", 
         "これ / それ / あれ + は + N + です", 
         "これ chỉ vật gần người nói, それ gần người nghe, あれ xa cả hai.",
         [
             ("tok-n5-l2-1", "これ", "", "", "は", "ほん", "です", "Cái này là quyển sách."),
             ("tok-n5-l2-2", "それ", "", "", "は", "じしょ", "です", "Cái đó là từ điển.")
         ],
         [
             ("ex-q-n5-2-1", "A: ___ は何ですか。 B: これはペンです。", ["これ", "それ", "あれ", "どれ"], 1, "Khi người B trả lời là 'これ' (vật gần B), thì người A khi hỏi phải dùng 'それ' (vật gần người nghe B).", "Quy tắc cự ly giữa người hỏi và người đáp.")
         ]),
        (3, "Bài 3: Chỉ thị địa điểm ここ / そこ / あそこ / こちら", 
         "N [địa điểm] + は + ここ / そこ / あそこ + です", 
         "ここ: chỗ này (gần người nói), そこ: chỗ đó, あそこ: chỗ kia (xa cả hai).",
         [
             ("tok-n5-l3-1", "きょうしつ", "教室", "きょうしつ", "は", "ここ", "です", "Lớp học ở đây."),
             ("tok-n5-l3-2", "おてあらい", "お手洗い", "おてあらい", "は", "あそこ", "です", "Nhà vệ sinh ở đằng kia.")
         ],
         [
             ("ex-q-n5-3-1", "すみません、トイレは ___ ですか。", ["どこ", "だれ", "なん", "いつ"], 0, "Dùng từ để hỏi địa điểm 'どこ' (ở đâu) hoặc lịch sự hơn là 'どちら'.", "Từ để hỏi vị trí.")
         ]),
        (4, "Bài 4: Thời gian, Động từ Vます, 〜から 〜まで", 
         "〜時に + Động từ Vます / 〜から 〜まで", 
         "Trợ từ に đi kèm mốc thời gian cụ thể có con số. から (từ), まで (đến).",
         [
             ("tok-n5-l4-1", "まいあさ", "毎朝", "まいあさ", "６じ", "に", "おきます", "起きる", "Mỗi sáng tôi thức dậy lúc 6 giờ."),
             ("tok-n5-l4-2", "ぎんこう", "銀行", "ぎんこう", "は", "９じから", "５じまで", "です", "Ngân hàng mở cửa từ 9h đến 5h.")
         ],
         [
             ("ex-q-n5-4-1", "わたしは 毎朝 7時 ___ 起きます。", ["に", "で", "を", "へ"], 0, "Với mốc thời gian có con số cụ thể (7h, thứ 2, ngày 15), ta dùng trợ từ 'に'.", "Trợ từ đi với mốc thời gian.")
         ]),
        (5, "Bài 5: Điểm đến (へ 行きます/来ます/帰ります) & Phương tiện (で)", 
         "Địa điểm + へ + 行きます / 来ます / 帰ります", 
         "Trợ từ へ (đọc là 'e') chỉ hướng di chuyển. Trợ từ で chỉ phương tiện đi lại.",
         [
             ("tok-n5-l5-1", "わたし", "私", "わたし", "は", "日本", "へ", "いきます", "Tôi đi đến Nhật Bản."),
             ("tok-n5-l5-2", "でんしゃ", "電車", "でんしゃ", "で", "うち", "へ", "かえります", "Tôi về nhà bằng tàu điện.")
         ],
         [
             ("ex-q-n5-5-1", "あした スーパー ___ 行きます。", ["へ", "で", "を", "に"], 0, "Trợ từ へ (hoặc に) dùng để chỉ phương hướng/đích đến của động từ di chuyển.", "Trợ từ chỉ hướng đi."),
             ("ex-q-n5-5-2", "バス ___ 会社へ 行きます。", ["で", "へ", "を", "から"], 0, "Trợ từ で chỉ phương tiện, công cụ thực hiện hành động.", "Trợ từ chỉ phương tiện.")
         ]),
        (6, "Bài 6: Tân ngữ (を Vます), Địa điểm hành động (で Vます)", 
         "Tân ngữ + を + Vます / Địa điểm + で + Vます", 
         "Trợ từ を đánh dấu đối tượng trực tiếp của hành động. Trợ từ で đánh dấu nơi diễn ra hành động.",
         [
             ("tok-n5-l6-1", "ごはん", "ご飯", "ごはん", "を", "たべます", "食べます", "", "Tôi ăn cơm."),
             ("tok-n5-l6-2", "しょくどう", "食堂", "しょくどう", "で", "ラーメン", "を", "たべます", "Tôi ăn ramen ở nhà ăn.")
         ],
         [
             ("ex-q-n5-6-1", "図書館 ___ 本を 読みます。", ["で", "へ", "に", "を"], 0, "Hành động đọc sách diễn ra tại thư viện nên dùng trợ từ 'で'.", "Trợ từ nơi diễn ra hành động.")
         ]),
        (7, "Bài 7: Công cụ (で), Cho/Nhận (あげます / もらいます)", 
         "Công cụ + で + V / N1 に N2 を あげます", 
         "で biểu thị công cụ hoặc ngôn ngữ (箸で, 日本語で). あげます là tặng, もらいます là nhận.",
         [
             ("tok-n5-l7-1", "はし", "箸", "はし", "で", "ごはん", "を", "たべます", "Tôi ăn cơm bằng đũa."),
             ("tok-n5-l7-2", "はは", "母", "はは", "に", "はな", "を", "あげました", "Tôi đã tặng hoa cho mẹ.")
         ],
         [
             ("ex-q-n5-7-1", "スプーン ___ カレーを 食べます。", ["で", "を", "に", "へ"], 0, "Dùng thìa (muỗng) làm dụng cụ ăn nên dùng trợ từ で.", "Trợ từ công cụ.")
         ]),
        (8, "Bài 8: Tính từ đuôi い & Tính từ đuôi な", 
         "N は A-い / A-な です / A-い + N / A-な + N", 
         "Tính từ い phủ định là くない. Tính từ な đi trước danh từ phải giữ な.",
         [
             ("tok-n5-l8-1", "富士山", "富士山", "ふじさん", "は", "たかい", "です", "", "Núi Phú Sĩ thì cao."),
             ("tok-n5-l8-2", "さくら", "桜", "さくら", "は", "きれいな", "はな", "です", "Hoa anh đào là loài hoa đẹp.")
         ],
         [
             ("ex-q-n5-8-1", "この部屋は 静か ___ ありません。", ["じゃ", "く", "で", "な"], 0, "静か là tính từ đuôi な, dạng phủ định lịch sự là 静かじゃありません.", "Phủ định tính từ な.")
         ]),
        (9, "Bài 9: Sở thích, Khả năng & Lý do (から)", 
         "N が 好き / 嫌い / 上手 / 下手 です / Câu 1 から、Câu 2", 
         "Đối tượng của tính từ chỉ sở thích và năng lực đi với trợ từ が. から đứng sau mệnh đề lý do.",
         [
             ("tok-n5-l9-1", "わたし", "私", "わたし", "は", "にほんご", "が", "すきです", "Tôi thích tiếng Nhật."),
             ("tok-n5-l9-2", "じかん", "時間", "じかん", "が", "ありませんから", "いきません", "", "Vì không có thời gian nên tôi không đi.")
         ],
         [
             ("ex-q-n5-9-1", "わたしは サッカー ___ 好きです。", ["が", "を", "は", "に"], 0, "Đi với tính từ chỉ sở thích 好き/嫌い ta dùng trợ từ が.", "Trợ từ đi với 好き.")
         ]),
        (10, "Bài 10: Tồn tại あります / います & Vị trí", 
         "Địa điểm に N が あります (đồ vật) / います (người/động vật)", 
         "あります dùng cho vật vô tri, thực vật. います dùng cho người và động vật sống.",
         [
             ("tok-n5-l10-1", "へや", "部屋", "へや", "に", "テレビ", "が", "あります", "Trong phòng có cái ti vi."),
             ("tok-n5-l10-2", "にわ", "庭", "にわ", "に", "いぬ", "が", "います", "Ở ngoài sân có con chó.")
         ],
         [
             ("ex-q-n5-10-1", "教室に 学生が ___。", ["います", "あります", "します", "きます"], 0, "Học sinh (người) tồn tại dùng động từ います.", "Động từ tồn tại người.")
         ]),
        (11, "Bài 11: Số từ chỉ số lượng & Thời lượng", 
         "Lượng từ đứng trước động từ / Mốc thời gian に 〜回", 
         "Số đếm (ひとつ, ふたつ, ひとり...) thường đứng liền trước động từ mà nó bổ nghĩa.",
         [
             ("tok-n5-l11-1", "りんご", "林檎", "りんご", "を", "みっつ", "かいました", "", "Tôi đã mua 3 quả táo."),
             ("tok-n5-l11-2", "１しゅうかん", "一週間", "いっしゅうかん", "に", "２かい", "テニスをします", "", "Một tuần tôi chơi tennis 2 lần.")
         ],
         [
             ("ex-q-n5-11-1", "みかんを ___ 買いました。", ["４つ", "４人", "４日", "４回"], 0, "Đếm cam (hoa quả/đồ vật chung) dùng số từ thuần Nhật: ひとつ、ふたつ、みっつ、よっつ(4つ).", "Số từ đếm đồ vật.")
         ]),
        (12, "Bài 12: So sánh hơn (より) & So sánh nhất (一番)", 
         "N1 は N2 より A です / 〜の中で 〜が 一番 A です", 
         "より mang nghĩa 'hơn so với'. 一番 mang nghĩa 'nhất'.",
         [
             ("tok-n5-l12-1", "ひこうき", "飛行機", "ひこうき", "は", "しんかんせん", "より", "はやいです", "Máy bay nhanh hơn tàu Shinkansen."),
             ("tok-n5-l12-2", "くだもの", "果物", "くだもの", "のなかで", "りんご", "がいちばん", "すきです", "Trong các loại hoa quả tôi thích táo nhất.")
         ],
         [
             ("ex-q-n5-12-1", "車 ___ 新幹線のほうが 速いです。", ["より", "ほど", "から", "で"], 0, "Cấu trúc so sánh: A より B のほうが... (B hơn so với A).", "Từ so sánh.")
         ]),
        (13, "Bài 13: Mong muốn (ほしい, V-たい) & Đi để làm gì (V-に行きます)", 
         "N が ほしい / V-ます (bỏ ます) + たい / V-ます (bỏ ます) + に 行きます", 
         "ほしい dùng cho danh từ muốn có. たい dùng cho hành động muốn làm.",
         [
             ("tok-n5-l13-1", "くるま", "車", "くるま", "が", "ほしい", "です", "", "Tôi muốn có ô tô."),
             ("tok-n5-l13-2", "にほん", "日本", "にほん", "へ", "いきたい", "です", "", "Tôi muốn đi Nhật Bản.")
         ],
         [
             ("ex-q-n5-13-1", "わたしは 今 水が ___。", ["飲みたいです", "飲みます", "飲むです", "飲みたい"], 0, "Thể hiện mong muốn bản thân với lịch sự: V-ます bỏ ます + たいです.", "Mong muốn hành động.")
         ]),
        (14, "Bài 14: Chia nhóm động từ & Thể て (〜てください, 〜ています)", 
         "V-て + ください / V-て + います", 
         "Chia 3 nhóm động từ. てください để nhờ vả lịch sự. ています biểu thị hành động đang diễn ra.",
         [
             ("tok-n5-l14-1", "ちょっと", "", "", "まって", "ください", "", "", "Xin vui lòng đợi một chút."),
             ("tok-n5-l14-2", "いま", "今", "いま", "あめ", "が", "ふっています", "", "Bây giờ trời đang mưa.")
         ],
         [
             ("ex-q-n5-14-1", "荷物を ___ ください。(持ちます)", ["持って", "持ちて", "持たて", "持て"], 0, "Động từ 持ちます (nhóm 1, kết thúc ち) chia thể て thành 持って.", "Chia thể て nhóm 1.")
         ]),
        (15, "Bài 15: Cho phép (てもいい) & Cấm đoán (てはいけません)", 
         "V-て + もいいです / V-て + はいけません", 
         "てもいいです là được phép làm. てはいけません là không được phép làm (cấm).",
         [
             ("tok-n5-l15-1", "しゃしん", "写真", "しゃしん", "を", "とっても", "いいですか", "", "Tôi chụp ảnh có được không?"),
             ("tok-n5-l15-2", "ここで", "", "", "たばこを", "すっては", "いけません", "", "Không được hút thuốc ở đây.")
         ],
         [
             ("ex-q-n5-15-1", "ここで 写真を ___ はいけません。", ["撮って", "撮りて", "撮る", "撮ら"], 0, "Cấm đoán: Động từ thể て + はいけません. 撮ります -> 撮って.", "Cấm đoán.")
         ]),
        (16, "Bài 16: Nối câu thể て & Sau khi (Vてから)", 
         "V1-て, V2-て, V3ます / V1-てから, V2", 
         "Nối các hành động theo trình tự thời gian. Vてから nhấn mạnh sau khi làm xong V1 mới làm V2.",
         [
             ("tok-n5-l16-1", "あさ", "朝", "あさ", "おきて", "シャワーを", "あびて", "がっこうへ", "いきます", "Buổi sáng tôi dậy, tắm vòi sen rồi đến trường."),
             ("tok-n5-l16-2", "くにへ", "国へ", "くにへ", "かえってから", "かいしゃで", "はたらきます", "", "Sau khi về nước tôi sẽ làm việc ở công ty.")
         ],
         [
             ("ex-q-n5-16-1", "手を ___ から ご飯を食べます。", ["洗って", "洗い", "洗う", "洗った"], 0, "Cấu trúc 'Sau khi...': V-て + から.", "Sau khi làm gì.")
         ]),
        (17, "Bài 17: Thể ない (ないでください, なければなりません)", 
         "V-ないでください / V-なければなりません / V-なくてもいいです", 
         "Chia động từ thể ない. なければなりません nghĩa là phải làm. なくてもいい nghĩa là không cần làm.",
         [
             ("tok-n5-l17-1", "パスポートを", "", "", "わすれないで", "ください", "", "", "Xin đừng quên hộ chiếu."),
             ("tok-n5-l17-2", "くすり", "薬", "くすり", "を", "のまなければ", "なりません", "", "Tôi phải uống thuốc.")
         ],
         [
             ("ex-q-n5-17-1", "明日 早く ___ なければなりません。(起きます)", ["起き", "起きな", "起きら", "起きる"], 0, "起きます (nhóm 2) -> thể ない là 起きない -> bỏ い thêm ければなりません: 起きなければなりません.", "Nghĩa vụ phải làm.")
         ]),
        (18, "Bài 18: Thể từ điển (辞書形), Khả năng (ことができる)", 
         "V-る + ことが できます / 趣味は V-る ことです / V-る まえに", 
         "Danh từ hóa động từ bằng こと. V-ることができる biểu thị khả năng có thể làm gì.",
         [
             ("tok-n5-l18-1", "わたし", "私", "わたし", "は", "ピアノを", "ひくことが", "できます", "Tôi có thể chơi piano."),
             ("tok-n5-l18-2", "ねる", "寝る", "ねる", "まえに", "ほんを", "よみます", "", "Trước khi ngủ tôi đọc sách.")
         ],
         [
             ("ex-q-n5-18-1", "田中さんは 漢字を ___ ことができます。(読みます)", ["読む", "読み", "読んだ", "読める"], 0, "Cấu trúc khả năng: Động từ thể từ điển (V-る) + ことができます. 読みます -> 読む.", "Thể khả năng với ことができる.")
         ]),
        (19, "Bài 19: Thể た, Kinh nghiệm (たことがあります), Liệt kê (たり〜たり)", 
         "V-た + ことが あります / V1-たり, V2-たり します", 
         "Vたことがあります nói về kinh nghiệm đã từng làm trong quá khứ. たり〜たり liệt kê hành động tiêu biểu.",
         [
             ("tok-n5-l19-1", "富士山", "富士山", "ふじさん", "に", "のぼった", "ことが", "あります", "Tôi đã từng leo núi Phú Sĩ."),
             ("tok-n5-l19-2", "にちようび", "日曜日", "にちようび", "は", "テニスをしたり", "ほんをよんだり", "します", "Chủ nhật tôi khi thì chơi tennis, khi thì đọc sách.")
         ],
         [
             ("ex-q-n5-19-1", "日本へ ___ ことがありますか。(行きます)", ["行った", "行きます", "行く", "行きて"], 0, "Hỏi kinh nghiệm đã từng làm gì: V-た + ことがありますか. 行きます -> 行った.", "Kinh nghiệm trong quá khứ.")
         ]),
        (20, "Bài 20: Thể thông thường (Thể ngắn / 普通形)", 
         "Dùng thể ngắn trong giao tiếp thân mật giữa bạn bè, người thân", 
         "Vます -> Vる, Vません -> Vない, Vました -> Vた. Danh từ/Tính từ な: です -> だ, ではありません -> ではない.",
         [
             ("tok-n5-l20-1", "あした", "明日", "あした", "どこへ", "いく？", "うん、", "とうきょう", "Mai đi đâu thế? - Ừ, đi Tokyo."),
             ("tok-n5-l20-2", "これ", "", "", "おいしい？", "ううん、", "おいしくない", "", "Cái này ngon không? - Không, không ngon.")
         ],
         [
             ("ex-q-n5-20-1", "A: 今日の試験、どうだった？ B: とても ___ よ。(簡単でした)", ["簡単だった", "簡単だ", "簡単でした", "簡単じゃない"], 0, "Chuyển tính từ đuôi な thể quá khứ lịch sự 簡単でした sang thể thông thường là 簡単だった.", "Thể thông thường quá khứ.")
         ]),
        (21, "Bài 21: Bày tỏ ý kiến (〜と思います) & Trích dẫn (〜と言いました)", 
         "Thể thông thường + と 思います / と 言いました", 
         "思います bày tỏ phán đoán, quan điểm cá nhân. と言いました dùng để trích dẫn lời nói.",
         [
             ("tok-n5-l21-1", "あしたは", "明日は", "あしたは", "いい", "てんきに", "なると", "おもいます", "Tôi nghĩ ngày mai thời tiết sẽ trở nên đẹp."),
             ("tok-n5-l21-2", "たなかさんは", "", "", "らいしゅう", "やすむと", "いいました", "", "Anh Tanaka đã nói là tuần sau sẽ nghỉ.")
         ],
         [
             ("ex-q-n5-21-1", "日本は 物価が 高い ___ 思います。", ["と", "を", "に", "が"], 0, "Đi trước động từ 思います (nghĩ rằng) là trợ từ と đóng vai trò liên từ trích dẫn nội dung suy nghĩ.", "Trích dẫn ý kiến.")
         ]),
        (22, "Bài 22: Mệnh đề bổ ngữ cho danh từ (Định ngữ)", 
         "Mệnh đề bổ nghĩa (thể thông thường) + Danh từ", 
         "Trong tiếng Nhật, cụm định ngữ luôn đứng ngay TRƯỚC danh từ mà nó bổ nghĩa.",
         [
             ("tok-n5-l22-1", "これは", "", "", "わたしが", "きのう", "かった", "ほん", "です", "Đây là cuốn sách tôi đã mua hôm qua."),
             ("tok-n5-l22-2", "あそこで", "", "", "ほんを", "よんでいる", "ひとは", "だれですか", "Người đang đọc sách đằng kia là ai vậy?")
         ],
         [
             ("ex-q-n5-22-1", "これは ミラーさんが ___ ケーキです。(作りました)", ["作った", "作ります", "作る", "作って"], 0, "Bổ nghĩa cho danh từ ở quá khứ dùng thể thông thường V-た: 作ったケーキ (Bánh đã làm).", "Định ngữ bổ nghĩa danh từ.")
         ]),
        (23, "Bài 23: Thời điểm (〜とき) & Điều kiện tự nhiên (〜と)", 
         "V-るとき / V-たとき + Mệnh đề / V-ると, ...", 
         "とき chỉ thời điểm. と chỉ mối quan hệ nhân quả tự nhiên, hiển nhiên, hoặc chỉ dẫn đường.",
         [
             ("tok-n5-l23-1", "みちを", "道を", "みちを", "わたるとき", "くるまに", "きをつけます", "", "Khi băng qua đường tôi chú ý xe cộ."),
             ("tok-n5-l23-2", "このボタンを", "", "", "おすと", "おつりが", "でます", "", "Hễ ấn nút này thì tiền thừa sẽ chảy ra.")
         ],
         [
             ("ex-q-n5-23-1", "右へ 曲がる ___、郵便局があります。", ["と", "たら", "ても", "ば"], 0, "Chỉ dẫn đường đi hoặc mối liên hệ cơ học tất yếu: V-る + と.", "Điều kiện tất yếu tự nhiên.")
         ]),
        (24, "Bài 24: Cho nhận hành động (てあげます, てもらいます, てくれます)", 
         "V-て あげます / V-て もらいます / V-て くれます", 
         "てあげます: làm cho ai. てもらいます: được ai làm cho. てくれます: ai đó làm cho mình hoặc người thân của mình.",
         [
             ("tok-n5-l24-1", "わたしは", "私は", "わたしは", "ともだちに", "にほんごを", "おしえて", "あげました", "Tôi đã dạy tiếng Nhật cho bạn."),
             ("tok-n5-l24-2", "すずきさんは", "", "", "わたしに", "かさを", "かして", "くれました", "Chị Suzuki đã cho tôi mượn ô.")
         ],
         [
             ("ex-q-n5-24-1", "母は 私に セーターを 送って ___。", ["くれました", "あげました", "もらいました", "やりました"], 0, "Khi ai đó làm một hành động có lợi cho 'tôi' (私に), dùng V-てくれます.", "Cho nhận hành động hướng về tôi.")
         ]),
        (25, "Bài 25: Điều kiện giả định (〜たら, 〜ても)", 
         "V-たら (Nếu... thì) / V-ても (Dù... thì cũng)", 
         "たら biểu thị điều kiện giả định hoặc hành động kế tiếp trong tương lai. ても biểu thị sự tương phản, nhượng bộ.",
         [
             ("tok-n5-l25-1", "あめが", "雨が", "あめが", "ふったら", "でかけません", "", "", "Nếu trời mưa thì tôi sẽ không ra ngoài."),
             ("tok-n5-l25-2", "たかくても", "高くても", "たかくても", "このパソコンを", "かいたいです", "", "", "Dù đắt thì tôi vẫn muốn mua chiếc máy tính này.")
         ],
         [
             ("ex-q-n5-25-1", "お金が ___、旅行に行きたいです。(あります)", ["あったら", "あれば", "あって", "あると"], 0, "Thể điều kiện giả định phổ biến: V-た + ら -> あったら (Nếu có).", "Điều kiện たら.")
         ])
    ]

    for num, title, formula, expl, examples_data, ex_data in n5_data:
        slides = []
        slide_examples = []
        for ex_idx, row in enumerate(examples_data):
            tok_prefix = row[0]
            mean = row[-1]
            words = row[1:-1]
            tokens = []
            
            # Nếu có cấu trúc (w1, k1, f1, rest...)
            if len(words) >= 3 and words[1] and words[2]:
                tokens.append({
                    "id": f"{tok_prefix}-1",
                    "text": words[0],
                    "kanji": words[1],
                    "furigana": words[2],
                    "isKeyGrammar": False
                })
                for w_i, w in enumerate(words[3:]):
                    if w:
                        tokens.append({
                            "id": f"{tok_prefix}-{w_i+2}",
                            "text": w,
                            "isKeyGrammar": True
                        })
            else:
                for w_i, w in enumerate(words):
                    if w:
                        tokens.append({
                            "id": f"{tok_prefix}-{w_i+1}",
                            "text": w,
                            "isKeyGrammar": (w_i > 0)
                        })

            slide_examples.append({
                "id": f"ex-n5-l{num}-{ex_idx+1}",
                "tokens": tokens,
                "meaningVi": mean
            })

        slides.append({
            "slideId": f"n5-l{num}-s0",
            "title": f"Trọng tâm: {title.split(': ')[-1]}",
            "grammarFormula": formula,
            "explanation": expl,
            "examples": slide_examples,
            "culturalNotes": "Áp dụng thuần thục mẫu câu này để giao tiếp tự nhiên chuẩn văn hóa Nhật Bản."
        })

        exercises = []
        for q_id, q_text, q_opts, q_ans, q_exp, q_hint in ex_data:
            exercises.append({
                "id": q_id,
                "question": q_text,
                "options": q_opts,
                "correctIndex": q_ans,
                "explanation": q_exp,
                "hint": q_hint
            })

        lessons.append({
            "level": "N5",
            "lessonNumber": num,
            "title": title,
            "slides": slides,
            "exercises": exercises
        })

    with open('curriculum/n5.json', 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
    print(f"[OK] Generated N5: {len(lessons)} lessons.")

# ==========================================
# 2. GENERATE N4 CURRICULUM (25 LESSONS: L26-L50)
# ==========================================
def generate_n4():
    lessons = []
    n4_raw = [
        (26, "Bài 26: Giải thích lý do & Nhấn mạnh (〜んです)", "Thể thông thường (Na/Nな) + んです", "Dùng để giải thích nguyên nhân, bày tỏ sự tò mò hoặc mở đầu câu nhờ vả.", "わたしは 頭が 痛いんです。", "Tôi bị đau đầu (giải thích lý do)."),
        (27, "Bài 27: Động từ thể khả năng (可能形)", "Nhóm 1: う->える / Nhóm 2: られる / Nhóm 3: できる, こられる", "Biểu thị năng lực hoặc điều kiện cho phép thực hiện hành động. Trợ từ を thường đổi thành が.", "わたしは 日本語が 話せます。", "Tôi có thể nói tiếng Nhật."),
        (28, "Bài 28: Hành động đồng thời (〜ながら) & Thói quen (〜ています)", "V1-ます (bỏ ます) + ながら + V2", "Thực hiện hai hành động cùng một lúc (hành động sau là trọng tâm).", "音楽を 聞きながら 勉強します。", "Tôi vừa nghe nhạc vừa học bài."),
        (29, "Bài 29: Tự động từ & Tha động từ, Trạng thái (V-ています)", "Tự động từ + ています (kết quả còn lưu lại)", "Biểu thị trạng thái của sự vật hiện hữu trước mắt.", "窓が 開いています。", "Cửa sổ đang mở."),
        (30, "Bài 30: Trạng thái có chủ đích (てあります) & Chuẩn bị (ておきます)", "Tha động từ + てあります / V-ておきます", "てあります chỉ trạng thái do con người chủ ý tạo ra. ておきます là làm sẵn để chuẩn bị.", "壁に カレンダーが はってあります。", "Trên tường có dán sẵn tờ lịch."),
        (31, "Bài 31: Thể ý chí (意向形) & Dự định (〜と思っています)", "V-意向形 + と思っています", "Bày tỏ ý chí, dự định muốn làm gì của bản thân.", "将来 自分の会社を 作ろうと思っています。", "Tương lai tôi dự định sẽ mở công ty riêng."),
        (32, "Bài 32: Lời khuyên (〜ほうがいい) & Dự đoán (〜でしょう / かもしれません)", "V-た / V-ない + ほうがいいです", "Khuyên ai đó nên hoặc không nên làm điều gì.", "無理を しないほうが いいですよ。", "Bạn không nên làm việc quá sức đâu đấy."),
        (33, "Bài 33: Thể mệnh lệnh (命令形) & Cấm chỉ (禁止形)", "Nhóm 1: う->え / V-る + な (Cấm chỉ)", "Dùng trong trường hợp khẩn cấp, chỉ huy, hoặc cổ vũ thể thao.", "頑張れ！ (Cố lên!) / 触るな！ (Cấm sờ!)", "Cố lên! / Không được chạm vào!"),
        (34, "Bài 34: Làm theo mẫu (〜とおりに) & Sau khi (〜あとで)", "V-る / Nの + とおりに / V-た + あとで", "Thực hiện một hành động đúng y hệt như hướng dẫn.", "説明書の とおりに 組み立ててください。", "Hãy lắp ráp theo đúng như sách hướng dẫn."),
        (35, "Bài 35: Thể điều kiện (〜ば / 〜なら)", "Động từ: え + ば / Tính từ: ければ / Nなら", "Biểu thị điều kiện để một kết quả tốt hoặc sự việc xảy ra.", "安ければ 買います。", "Nếu rẻ thì tôi sẽ mua."),
        (36, "Bài 36: Mục đích (〜ように) & Biến đổi (〜ようになる)", "V-る / V-ない (không chủ ý) + ように", "Làm hành động V2 để đạt được mục tiêu V1.", "忘れないように メモを します。", "Tôi ghi chú lại để không bị quên."),
        (37, "Bài 37: Thể bị động (受身形: V-られる)", "Nhóm 1: あ + れる / Nhóm 2: られる / Nhóm 3: される, こられる", "Biểu thị hành động bị tác động bởi người khác (thường mang cảm xúc phiền toái hoặc trung lập).", "先生に 褒められました。", "Tôi đã được thầy giáo khen ngợi."),
        (38, "Bài 38: Danh từ hóa (V-るのは, V-るのが, V-るのを忘れました)", "V-る + のは / のが / のを", "Biến động từ thành danh từ để làm chủ ngữ, bổ ngữ trong câu.", "テニスを するのは 面白いです。", "Chơi tennis thật là thú vị."),
        (39, "Bài 39: Nguyên nhân lý do khách quan (〜ので / V-て)", "Thể thông thường (Na/Nな) + ので", "Giải thích nguyên nhân khách quan, mang tính lịch sự hơn から.", "雨が 降ったので、遅刻しました。", "Vì trời mưa nên tôi đã bị muộn."),
        (40, "Bài 40: Nghi vấn lồng (〜か, 〜かどうか) & Thử làm (〜てみます)", "Thể thông thường + か / かどうか + V", "Lồng câu hỏi vào trong một câu phức.", "彼が 来るかどうか 分かりません。", "Tôi không biết anh ấy có đến hay không."),
        (41, "Bài 41: Kính ngữ cho nhận (やる / あげる / さしあげる, いただく, くださる)", "Nに 差し上げます / いただきます / くださいます", "Dùng khi đối phương là người có địa vị cao hơn, người trên.", "社長に お土産を いただきました。", "Tôi đã được giám đốc cho quà."),
        (42, "Bài 42: Mục đích vì ai/cái gì (〜ために) & Dùng vào việc gì (〜のに)", "V-る / Nの + ために / V-る + のに 使います", "ために thể hiện mục đích có ý chí rõ rệt.", "家を 買うために、貯金しています。", "Tôi đang tiết kiệm tiền để mua nhà."),
        (43, "Bài 43: Dự đoán sắp xảy ra (V-そう) & Trông có vẻ (A-そう)", "V-ます (bỏ ます) / A (bỏ い/な) + そうです", "Đoán dựa trên quan sát bằng mắt trực quan tại thời điểm nói.", "雨が 降りそうです。", "Trời trông có vẻ sắp mưa rồi."),
        (44, "Bài 44: Quá mức (〜すぎます) & Dễ/Khó làm (〜やすい / 〜にくい)", "V-ます (bỏ ます) + すぎます / やすい / にくい", "Hành động vượt quá giới hạn hoặc đặc tính dễ/khó.", "この本は 分かりやすいです。", "Cuốn sách này rất dễ hiểu."),
        (45, "Bài 45: Trường hợp (〜場合は) & Mặc dù (〜のに)", "Thể thông thường (Na/Nな) + 場合は / のに", "のに biểu thị sự bất mãn, kết quả trái ngược với kỳ vọng.", "約束したのに、彼は 来ませんでした。", "Đã hẹn rồi thế mà anh ấy lại không đến."),
        (46, "Bài 46: Thời điểm chính xác (V-ところ) & Vừa mới (〜たばかり)", "V-る (sắp) / V-ている (đang) / V-た (vừa xong) + ところ", "Nhấn mạnh chính xác giai đoạn của hành động.", "今から ご飯を 食べるところです。", "Bây giờ tôi chuẩn bị ăn cơm đây."),
        (47, "Bài 47: Nghe nói (〜そうです) & Dường như (〜ようです)", "Thể thông thường + そうです (truyền văn)", "Dẫn lại thông tin nghe được từ nguồn khác mà không thêm bớt ý kiến.", "天気予報に よると、明日は 寒くなるそうです。", "Theo dự báo thời tiết thì ngày mai nghe nói sẽ trở lạnh."),
        (48, "Bài 48: Thể sai khiến (使役形: V-させる)", "Nhóm 1: あ + せる / Nhóm 2: させる / Nhóm 3: させる, こさせる", "Cho phép hoặc bắt buộc ai đó làm việc gì.", "子供に ピアノを 習わせます。", "Tôi cho con học đàn piano."),
        (49, "Bài 49: Kính ngữ tôn kính (尊敬語 - Sonkeigo)", "お + V-ます(bỏ) + になります / Thể bị động / Động từ đặc biệt", "Nâng cao vị thế và sự tôn trọng đối với hành động của đối phương.", "先生は もう お帰りに なりました。", "Thầy giáo đã về rồi ạ."),
        (50, "Bài 50: Khiêm nhường ngữ (謙譲語 - Kenjougo)", "お + V-ます(bỏ) + します / Động từ khiêm nhường đặc biệt", "Hạ thấp hành động của bản thân để biểu thị sự tôn kính với người nghe.", "わたしが 荷物を お持ちします。", "Để tôi mang hành lý giúp quý khách ạ.")
    ]

    for num, title, formula, expl, ex_text, ex_mean in n4_raw:
        slides = [{
            "slideId": f"n4-l{num}-s0",
            "title": f"Trọng tâm: {title.split(': ')[-1]}",
            "grammarFormula": formula,
            "explanation": expl,
            "examples": [
                {
                    "id": f"ex-n4-l{num}-1",
                    "tokens": [
                        {"id": f"tok-n4-l{num}-1", "text": ex_text.split()[0] if ' ' in ex_text else ex_text[:3], "isKeyGrammar": False},
                        {"id": f"tok-n4-l{num}-2", "text": ex_text, "isKeyGrammar": True}
                    ],
                    "meaningVi": ex_mean
                }
            ],
            "culturalNotes": "Đây là mẫu ngữ pháp then chốt thường xuất hiện trong đề thi JLPT N4."
        }]

        exercises = [
            {
                "id": f"ex-q-n4-{num}-1",
                "question": f"Chọn cách kết hợp đúng cho cấu trúc: {title.split(': ')[-1]}",
                "options": [formula.split(' / ')[0], "Thể ý chí + だ", "Thể cấm chỉ", "V-ない + です"],
                "correctIndex": 0,
                "explanation": f"Công thức chính xác theo quy tắc ngữ pháp là: {formula}",
                "hint": "Chú ý dạng thể liên kết của động từ."
            }
        ]

        lessons.append({
            "level": "N4",
            "lessonNumber": num,
            "title": title,
            "slides": slides,
            "exercises": exercises
        })

    with open('curriculum/n4.json', 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
    print(f"[OK] Generated N4: {len(lessons)} lessons.")

# ==========================================
# 3. GENERATE N3 CURRICULUM (20 LESSONS)
# ==========================================
def generate_n3():
    lessons = []
    n3_raw = [
        (1, "Bài 1: Phán đoán chắc chắn (わけがない & わけではない)", "Thể thông thường (Naな/Nの) + わけがない / わけではない", "わけがない: Tuyệt đối không có lý nào. わけではない: Không hẳn là, không hoàn toàn là.", "そんな難しいこと、私にできるわけがない。", "Chuyện khó như thế thì làm sao tôi có thể làm được chứ!"),
        (2, "Bài 2: Thói quen & Biến đổi (ようにする & ようになる)", "V-る / V-ない + ようにする / ようになる", "ようにする: Nỗ lực duy trì thói quen tốt. ようになる: Biến đổi từ không thể sang có thể.", "毎日 漢字を 練習するようにしています。", "Tôi luôn cố gắng luyện viết chữ Hán mỗi ngày."),
        (3, "Bài 3: Quy định & Dự định (ことになっている & ことにする)", "V-る / V-ない + ことになっている / ことにする", "ことになっている: Quy định tập thể, luật lệ. ことにする: Quyết định của bản thân.", "この寮では 11時に 門限ということに なっている。", "Ký túc xá này có quy định đóng cửa lúc 11 giờ."),
        (4, "Bài 4: Nguyên nhân lý do (おかげで & せいで & ばかりに)", "Thể thông thường + おかげで (tốt) / せいで (xấu) / ばかりに (hối tiếc)", "おかげで mang lại kết quả tích cực. せいで mang lại kết quả tiêu cực.", "先生のおかげで、合格できました。", "Nhờ có thầy mà em đã đỗ kỳ thi."),
        (5, "Bài 5: So sánh & Tương quan (に比べて & に対して)", "N + に比べて / N + に対して", "に比べて: So sánh giữa hai đối tượng. に対して: Đối lập tương phản rõ rệt.", "兄に比べて、弟は よく勉強する。", "So với anh trai thì người em học chăm hơn nhiều."),
        (6, "Bài 6: Mục đích & Đối tượng (向けに & ために)", "N + 向けに / 向けだ / V-る + ために", "向け: Thiết kế chuyên biệt dành riêng cho một đối tượng.", "この本は 子供向けに 書かれています。", "Cuốn sách này được viết dành riêng cho trẻ em."),
        (7, "Bài 7: Phạm vi & Giới hạn (を通して & にわたって & に限って)", "N + を通して / N + にわたって", "を通して: Thông qua phương tiện, thời gian. にわたって: Trải rộng trên toàn bộ không gian/thời gian.", "四季を通じて、様々な花が 咲きます。", "Suốt bốn mùa, đủ loại hoa khoe sắc."),
        (8, "Bài 8: Điều kiện & Giả định (さえ〜ば & としたら)", "N + さえ + V-ば / Thể thông thường + としたら", "さえ〜ば: Chỉ cần... là đủ. としたら: Giả sử nếu chuyện đó xảy ra...", "体さえ 丈夫なら、何でも できる。", "Chỉ cần cơ thể khỏe mạnh thì làm gì cũng được."),
        (9, "Bài 9: Xu hướng & Khởi đầu (〜かける & 〜がち & 〜気味)", "V-ます (bỏ ます) + かける / がち / 気味 (ぎみ)", "かける: Đang làm dở dang. がち: Thường hay có xu hướng xấu. 気味: Cảm giác hơi hơi...", "風邪気味なので、早く寝ます。", "Vì hơi có triệu chứng cảm nên tôi sẽ đi ngủ sớm."),
        (10, "Bài 10: Nhượng bộ bất ngờ (にもかかわらず & くせに)", "Thể thông thường (Na/Nである) + にもかかわらず / くせに", "にもかかわらず: Mặc dù... nhưng vẫn. くせに: Dù... thế mà (mang ý mỉa mai, trách móc).", "雨にもかかわらず、多くの人が 集まった。", "Mặc cho trời mưa, rất nhiều người vẫn tập trung lại."),
        (11, "Bài 11: Cảm xúc mãnh liệt (たまらない & しょうがない & てならない)", "V-て / A-くて + たまらない / てならない", "Diễn tả cảm xúc hoặc trạng thái sinh lý không thể kiềm chế nổi (rất... / vô cùng...).", "家族に 会いたくて たまらない。", "Tôi nhớ gia đình đến cồn cào không chịu nổi."),
        (12, "Bài 12: Đánh giá chắc chắn (に違いない & はずだ & はずがない)", "Thể thông thường + に違いない / はずだ", "に違いない: Chắc chắn là (trực giác mạnh). はずだ: Chắc chắn là (dựa trên căn cứ logic).", "犯人は あの人に 違いない。", "Thủ phạm chắc chắn là người đó."),
        (13, "Bài 13: Khả năng tiềm tàng (得る / 得ない - うる / えない)", "V-ます (bỏ ます) + 得る / 得ない", "Có khả năng xảy ra hoặc không thể có khả năng xảy ra trong thực tế.", "事故は いつでも 起こり得ます。", "Tai nạn có thể xảy ra bất cứ lúc nào."),
        (14, "Bài 14: Biến đổi liên tục (一方だ & ばかりだ)", "V-る + 一方だ / ばかりだ", "Trạng thái đang liên tục tiến triển theo một chiều hướng (thường là tiêu cực).", "物価は 上がる一方だ。", "Giá cả hàng hóa cứ không ngừng tăng lên."),
        (15, "Bài 15: Mở rộng phạm vi (だけでなく & ばかりか)", "Thể thông thường + ばかりか (không chỉ mà còn)", "Không những ở mức độ này mà còn tiến tới mức độ cao hơn.", "彼は 英語ばかりか、フランス語も 話せる。", "Anh ấy không chỉ tiếng Anh mà ngay cả tiếng Pháp cũng nói được."),
        (16, "Bài 16: Thay thế (代わりに & に代わって)", "Nの / V-る + 代わりに / N + に代わって", "Làm một việc để bù đắp, đổi lại, hoặc đại diện cho ai đó.", "父の代わりに、私が 出席します。", "Tôi sẽ đi dự thay cho cha tôi."),
        (17, "Bài 17: Về vấn đề (に関して & について)", "N + に関して / N + について", "Nói về, liên quan đến chủ đề nào đó (に関して trang trọng hơn について).", "環境問題に関して、議論を行った。", "Chúng tôi đã tiến hành thảo luận về vấn đề môi trường."),
        (18, "Bài 18: Truyền đạt thông tin chính thức (ということだ & とのことだ)", "Thể thông thường + ということだ / とのことだ", "Nghe nói là, nội dung thông báo là...", "事故の原因は 調査中とのことです。", "Nghe thông báo là nguyên nhân vụ tai nạn đang trong quá trình điều tra."),
        (19, "Bài 19: Bổn phận đạo đức (べきだ & べきではない)", "V-る + べきだ (する -> すべきだ)", "Nên làm / Không nên làm theo quan niệm đạo lý xã hội.", "約束は 守るべきだ。", "Đã hứa thì đương nhiên phải giữ lời."),
        (20, "Bài 20: Tổng kết ngữ pháp đàm thoại thực chiến N3", "Tổng hợp các mẫu câu JLPT N3 trọng tâm", "Ôn luyện phối hợp cấu trúc trong đọc hiểu và nghe hiểu.", "合格できるように、最後まで 頑張るべきだ。", "Để có thể đỗ kỳ thi, bạn nên nỗ lực đến cùng.")
    ]

    for num, title, formula, expl, ex_text, ex_mean in n3_raw:
        slides = [{
            "slideId": f"n3-l{num}-s0",
            "title": f"Trọng tâm: {title.split(': ')[-1]}",
            "grammarFormula": formula,
            "explanation": expl,
            "examples": [
                {
                    "id": f"ex-n3-l{num}-1",
                    "tokens": [
                        {"id": f"tok-n3-l{num}-1", "text": ex_text[:4], "isKeyGrammar": False},
                        {"id": f"tok-n3-l{num}-2", "text": ex_text[4:], "isKeyGrammar": True}
                    ],
                    "meaningVi": ex_mean
                }
            ],
            "culturalNotes": "Cấu trúc then chốt của bài thi JLPT N3 yêu cầu nắm vững sắc thái biểu cảm."
        }]

        exercises = [
            {
                "id": f"ex-q-n3-{num}-1",
                "question": f"Cấu trúc nào diễn đạt đúng ý nghĩa: '{title.split(': ')[-1]}'?",
                "options": [formula.split(' / ')[0], "V-た + まま", "N + に沿って", "V-る + 途端に"],
                "correctIndex": 0,
                "explanation": f"Đáp án chính xác: {formula}",
                "hint": "Xem lại công thức chia ở slide lý thuyết."
            }
        ]

        lessons.append({
            "level": "N3",
            "lessonNumber": num,
            "title": title,
            "slides": slides,
            "exercises": exercises
        })

    with open('curriculum/n3.json', 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
    print(f"[OK] Generated N3: {len(lessons)} lessons.")

# ==========================================
# 4. GENERATE N2 CURRICULUM (15 LESSONS)
# ==========================================
def generate_n2():
    lessons = []
    n2_raw = [
        (1, "Bài 1: Thời điểm & Nghi thức trang trọng (に際して & に先立って)", "N / V-る + に際して / に先立って", "Dùng trong các sự kiện nghi thức trọng đại (khi bắt đầu / chuẩn bị trước khi).", "新事業を 始めるに際して、計画を 見直した。", "Nhân dịp bắt đầu dự án mới, chúng tôi đã rà soát lại kế hoạch."),
        (2, "Bài 2: Bất đắc dĩ & Đành lòng (ざるを得ない & を余儀なくされる)", "V-ない (bỏ ない) + ざるを得ない (する->せざるを得ない)", "Dù không muốn nhưng do hoàn cảnh bắt buộc nên đành phải làm.", "この状況では、計画を 中止せざるを得ない。", "Trong tình thế này thì đành phải hủy bỏ kế hoạch mà thôi."),
        (3, "Bài 3: Tuyệt đối không thể (っこない & かねる & ようがない)", "V-ます (bỏ ます) + っこない / かねる / ようがない", "Nhấn mạnh niềm tin chủ quan rằng không thể nào làm được.", "そんなこと、誰にも できっこない。", "Việc như thế thì làm sao ai có thể làm được chứ!"),
        (4, "Bài 4: Nguy cơ & Khả năng xấu (かねない & おそれがある)", "V-ます (bỏ ます) + かねない / Nの + おそれがある", "Có nguy cơ dẫn tới một kết cục tai hại nghiêm trọng.", "スピードを 出しすぎると、事故を 起こしかねない。", "Nếu chạy quá tốc độ thì rất dễ gây ra tai nạn."),
        (5, "Bài 5: Tỉ lệ thuận & Càng ngày càng (にしたがって & につれて & 一方だ)", "N / V-る + にしたがって / につれて", "Sự việc A biến đổi kéo theo sự việc B biến đổi theo.", "年を取るにつれて、体力が 衰えてくる。", "Càng có tuổi thì thể lực càng suy giảm."),
        (6, "Bài 6: Khởi điểm & Cột mốc (を契機に & を皮切りに)", "N + を契機に / をきっかけに", "Nhân dịp, lấy một sự kiện làm bước ngoặt chuyển biến lớn.", "オリンピックを契機に、街の再開発が 進んだ。", "Lấy Thế vận hội làm bước ngoặt, việc tái thiết đô thị đã được đẩy mạnh."),
        (7, "Bài 7: Nhấn mạnh mở rộng (のみならず & ばかりか)", "Thể thông thường (Na/Nである) + のみならず", "Không chỉ dừng lại ở phạm vi đó mà còn lan rộng hơn.", "この薬は 効果があるのみならず、副作用も 少ない。", "Loại thuốc này không chỉ có hiệu quả cao mà tác dụng phụ cũng rất ít."),
        (8, "Bài 8: Tranh cãi & Vấn đề xoay quanh (をめぐって & を巡る)", "N + をめぐって / をめぐる + N", "Xoay quanh một mâu thuẫn, tranh chấp giữa nhiều bên.", "遺産相続をめぐって、兄弟が 争っている。", "Xoay quanh việc thừa kế tài sản, anh em đang tranh chấp nhau."),
        (9, "Bài 9: Bất chấp gian khó (をものともせずに & をよそに)", "N + をものともせずに", "Bất chấp khó khăn, nguy hiểm, dư luận để tiến về phía trước.", "彼は プレッシャーをものともせずに、見事 優勝した。", "Anh ấy đã vượt qua áp lực một cách xuất sắc để giành chức vô địch."),
        (10, "Bài 10: Căn cứ & Dựa trên (に基づいて & をもとに)", "N + に基づいて / に基づく + N", "Dựa trên cơ sở dữ liệu, sự thật, tiêu chuẩn cụ thể.", "最新のデータに基づいて、分析を 行った。", "Chúng tôi đã tiến hành phân tích dựa trên dữ liệu mới nhất."),
        (11, "Bài 11: Đặc trưng riêng biệt (ならではの & にふさわしい)", "N + ならではの + N / N + にふさわしい", "Chỉ có ở đối tượng đó mới có được phẩm chất tuyệt vời này.", "京都ならではの 伝統的な 街並み。", "Khung cảnh phố phường truyền thống chỉ có riêng ở Kyoto."),
        (12, "Bài 12: Kết cục sau quá trình dài (末に & あげく)", "V-た / Nの + 末に (すえに) / あげく (tiêu cực)", "Sau một quá trình đắn đo gian nan thì đi đến kết quả cuối cùng.", "悩んだ末に、留学することを 決意した。", "Sau bao trăn trở, tôi đã quyết định đi du học."),
        (13, "Bài 13: Vượt ngoài giới hạn (にとどまらず)", "N / V-る + にとどまらず", "Không chỉ dừng lại ở phạm vi hẹp mà lan sang quy mô lớn hơn nhiều.", "被害は 国内にとどまらず、海外にも 及んだ。", "Thiệt hại không chỉ dừng lại trong nước mà còn lan ra quốc tế."),
        (14, "Bài 14: Khó lòng mà làm được (がたい & かねる)", "V-ます (bỏ ます) + がたい (về mặt tâm lý) / かねる (từ chối khéo)", "Về mặt tình cảm hay tâm lý thì rất khó chấp nhận.", "信じがたい 出来事が 起こった。", "Một sự việc khó tin đã xảy ra."),
        (15, "Bài 15: Tổng kết chiến lược đọc hiểu & ngữ pháp N2", "Nắm vững toàn diện văn phong nghị luận N2", "Luyện phản xạ cấu trúc câu phức trong kỳ thi JLPT N2.", "状況に 即して、適切な 判断を 下すべきだ。", "Cần đưa ra phán đoán phù hợp theo sát tình hình thực tế.")
    ]

    for num, title, formula, expl, ex_text, ex_mean in n2_raw:
        slides = [{
            "slideId": f"n2-l{num}-s0",
            "title": f"Trọng tâm: {title.split(': ')[-1]}",
            "grammarFormula": formula,
            "explanation": expl,
            "examples": [
                {
                    "id": f"ex-n2-l{num}-1",
                    "tokens": [
                        {"id": f"tok-n2-l{num}-1", "text": ex_text[:6], "isKeyGrammar": False},
                        {"id": f"tok-n2-l{num}-2", "text": ex_text[6:], "isKeyGrammar": True}
                    ],
                    "meaningVi": ex_mean
                }
            ],
            "culturalNotes": "Ngữ pháp trình độ N2 dùng nhiều trong báo chí, kinh doanh và văn bản học thuật."
        }]

        exercises = [
            {
                "id": f"ex-q-n2-{num}-1",
                "question": f"Chọn mẫu ngữ pháp phù hợp biểu thị: '{title.split(': ')[-1]}'",
                "options": [formula.split(' / ')[0], "V-る + べきではない", "N + からして", "V-ます + 次第"],
                "correctIndex": 0,
                "explanation": f"Cấu trúc chính xác: {formula}",
                "hint": "Xem công thức liên kết đặc trưng của N2."
            }
        ]

        lessons.append({
            "level": "N2",
            "lessonNumber": num,
            "title": title,
            "slides": slides,
            "exercises": exercises
        })

    with open('curriculum/n2.json', 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
    print(f"[OK] Generated N2: {len(lessons)} lessons.")

# ==========================================
# 5. GENERATE N1 CURRICULUM (15 LESSONS)
# ==========================================
def generate_n1():
    lessons = []
    n1_raw = [
        (1, "Bài 1: Cực hạn trạng thái (極まりない & 極まる & の極み)", "Na (bỏ な) / A-い + こと + 極まりない / N + の極み", "Đạt đến giới hạn tột cùng của cảm xúc hoặc sự việc (vô lễ tột độ, vinh dự tột cùng).", "彼の態度は 無礼極まりない。", "Thái độ của anh ta vô lễ đến tột cùng."),
        (2, "Bài 2: Cảm xúc không thể kìm nén (にたえない & を禁じ得ない)", "N / V-る + にたえない / N + を禁じ得ない", "Cảm xúc dâng trào không kìm nổi (vô cùng biết ơn, không khỏi cảm động, không nỡ nhìn).", "皆様の 温情に 感謝にたえません。", "Tôi vô cùng biết ơn tấm thịnh tình ấm áp của mọi người."),
        (3, "Bài 3: Bất kể & Dù là (であれ〜であれ & といい〜といい)", "N1 + であれ + N2 + であれ", "Dù là A hay là B thì kết quả hoặc phán đoán vẫn không thay đổi.", "大人であれ 子供であれ、ルールは 守るべきだ。", "Dù là người lớn hay trẻ con thì đều phải tuân thủ luật lệ."),
        (4, "Bài 4: Coi nhẹ & Huống chi (はおろか & をものともせず)", "N + はおろか", "Đến cả mức độ thấp hơn còn chưa làm được huống chi là mức độ cao hơn.", "彼は 漢字はおろか、ひらがなも 読めない。", "Anh ta đến chữ Hiragana còn chẳng đọc được huống chi là chữ Hán."),
        (5, "Bài 5: Diễn biến tiêu cực & Kết cục (に至る & に至っては & 始末だ)", "N / V-る + に至る / に至っては / V-る + 始末だ", "Sự việc xấu đi dần dần cho đến khi rơi vào tình trạng nghiêm trọng.", "事ここに至っては、もはや 打つ手がない。", "Sự việc một khi đã đến bước này rồi thì không còn phương cứu chữa nữa."),
        (6, "Bài 6: Không được phép & Đạo đức cương vị (まじき & あるまじき)", "V-る + まじき + N (する -> すまじき)", "Không thể chấp nhận được đối với một người mang cương vị đó.", "それは プロの選手として あるまじき 行為だ。", "Đó là hành vi không thể chấp nhận được đối với một vận động viên chuyên nghiệp."),
        (7, "Bài 7: Khẳng định đanh thép (にほかならない & に相違ない)", "Thể thông thường + にほかならない (chính là, không gì khác ngoài)", "Khẳng định tuyệt đối nguyên nhân hoặc bản chất vấn đề.", "今回の成功は 努力の結晶に ほかならない。", "Thành công lần này không gì khác ngoài chính là kết tinh của sự nỗ lực."),
        (8, "Bài 8: Nguyện cầu tha thiết (てやまない & 願ってやまない)", "V-て + やまない", "Tình cảm chân thành từ tận đáy lòng luôn luôn hướng về (cầu chúc, kỳ vọng).", "世界の平和を 願ってやまない。", "Tôi không ngừng nguyện cầu cho nền hòa bình của thế giới."),
        (9, "Bài 9: Bắt buộc từ lương tâm (ずにはおかない & ないではすまない)", "V-ない (bỏ ない) + ずにはおかない", "Nhất định sẽ khiến cho xảy ra / Lương tâm không cho phép nếu không làm.", "彼の演技は 観客を 感動させずにはおかない。", "Diễn xuất của anh ấy nhất định sẽ làm rung động toàn bộ khán giả."),
        (10, "Bài 10: Khởi đầu & Cột mốc lịch sử (を皮切りにして & を限りに)", "N + を皮切りに / を限りに (lần cuối cùng)", "Bắt đầu bằng một sự kiện tiêu biểu rồi lan tỏa rầm rộ sau đó.", "東京公演を皮切りに、全国ツアーが 始まる。", "Bắt đầu với buổi diễn tại Tokyo, chuyến lưu diễn toàn quốc sẽ chính thức khởi động."),
        (11, "Bài 11: Căn cứ pháp lý & Chuẩn mực (に即して & に則って)", "N + に即して (theo sát thực tế) / に則って (theo luật lệ)", "Hành động tuân thủ nghiêm ngặt theo quy tắc, truyền thống, pháp luật.", "法律に則って、厳正に 処罰される。", "Sẽ bị xử phạt nghiêm minh theo đúng quy định của pháp luật."),
        (12, "Bài 12: Điều kiện tiên quyết sinh tử (なくしては & なしには)", "N + なくしては / なしには + Phủ định", "Nếu không có điều kiện cốt lõi này thì tuyệt đối không thể thành hiện thực.", "皆様の 協力なくしては、成功は あり得ない。", "Nếu không có sự hợp tác của quý vị thì thành công tuyệt đối không thể xảy ra."),
        (13, "Bài 13: Cương vị đáng kính (ともあろう者が & ならいざ知らず)", "N + ともあろう者が", "Đường đường là một người ở vị thế cao như thế mà lại làm hành động đáng hổ thẹn.", "大学教授ともあろう者が、剽窃をするとは。", "Đường đường là một giáo sư đại học mà lại đi đạo văn như vậy ư!"),
        (14, "Bài 14: Xu hướng tiêu cực thường thấy (きらいがある)", "V-る / Nの + きらいがある", "Thường có tật xấu, xu hướng tiêu cực không tốt.", "彼は 物事を 悲観的に 考えるきらいがある。", "Anh ấy thường có xu hướng nhìn nhận mọi việc một cách bi quan."),
        (15, "Bài 15: Tổng kết văn phong hàn lâm & Diễn thuyết N1", "Tổng hợp tinh hoa cấu trúc ngữ pháp cao cấp N1", "Chinh phục điểm tuyệt đối phần ngữ pháp và đọc hiểu JLPT N1.", "大義名分に 即した 行動を 取るべきである。", "Cần phải hành động theo đúng lý tưởng chính nghĩa.")
    ]

    for num, title, formula, expl, ex_text, ex_mean in n1_raw:
        slides = [{
            "slideId": f"n1-l{num}-s0",
            "title": f"Trọng tâm: {title.split(': ')[-1]}",
            "grammarFormula": formula,
            "explanation": expl,
            "examples": [
                {
                    "id": f"ex-n1-l{num}-1",
                    "tokens": [
                        {"id": f"tok-n1-l{num}-1", "text": ex_text[:6], "isKeyGrammar": False},
                        {"id": f"tok-n1-l{num}-2", "text": ex_text[6:], "isKeyGrammar": True}
                    ],
                    "meaningVi": ex_mean
                }
            ],
            "culturalNotes": "Mẫu ngữ pháp đỉnh cao của N1 dùng trong các bài xã luận, diễn văn trang trọng."
        }]

        exercises = [
            {
                "id": f"ex-q-n1-{num}-1",
                "question": f"Chọn cấu trúc chuẩn xác mang ý nghĩa: '{title.split(': ')[-1]}'",
                "options": [formula.split(' / ')[0], "V-た + ところで", "N + にかこつけて", "V-る + べく"],
                "correctIndex": 0,
                "explanation": f"Cấu trúc hàn lâm N1 chuẩn xác: {formula}",
                "hint": "Xem công thức ngữ pháp N1 cao cấp."
            }
        ]

        lessons.append({
            "level": "N1",
            "lessonNumber": num,
            "title": title,
            "slides": slides,
            "exercises": exercises
        })

    with open('curriculum/n1.json', 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
    print(f"[OK] Generated N1: {len(lessons)} lessons.")

if __name__ == '__main__':
    generate_n5()
    generate_n4()
    generate_n3()
    generate_n2()
    generate_n1()
    print("[SUCCESS] Hoan thanh xuat sac sinh toan bo 90 bai hoc N5 -> N1!")
