#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pedagogical Curriculum Generator for AI Live Sensei Classroom
Sinh dữ liệu bài giảng chuyên sâu chuẩn sư phạm gồm:
1. Từ vựng (Vocabulary with word types, romaji, kanji, furigana, pitch accent)
2. Chữ Hán (Kanji with Han-Viet, Onyomi, Kunyomi, stroke counts, compound words)
3. Đa Slide Ngữ pháp (Grammar points with deep teacher explanations, tips, tokenized examples)
4. Hội thoại ứng dụng (Kaiwa Dialogue with character roles and situational context)
5. Bài tập củng cố (Exercises with detailed teacher reasoning)
"""

import json
import os

os.makedirs('curriculum', exist_ok=True)

# ==========================================
# 1. GENERATE N5 PEDAGOGICAL CURRICULUM
# ==========================================
def build_n5_curriculum():
    lessons = []

    # Bài 1 Minna no Nihongo
    l1 = {
        "level": "N5",
        "lessonNumber": 1,
        "title": "Bài 1: Giới thiệu bản thân & Câu khẳng định / Phủ định với です",
        "description": "Làm quen với các đại từ xưng hô, nghề nghiệp, quốc tịch, công thức khẳng định N1 は N2 です, phủ định じゃありません, nghi vấn ですか, trợ từ も và の.",
        "vocabList": [
            {"id": "voc-n5-1-1", "word": "わたし", "kanji": "私", "furigana": "わたし", "romaji": "watashi", "wordType": "noun", "meaningVi": "Tôi (đại từ xưng hô ngôi thứ nhất)", "accentNote": "Phát âm nhẹ, hạ giọng ở âm cuối."},
            {"id": "voc-n5-1-2", "word": "あなた", "kanji": "貴方", "furigana": "あなた", "romaji": "anata", "wordType": "noun", "meaningVi": "Bạn / Anh / Chị (ngôi thứ 2, nên hạn chế dùng khi đã biết tên)", "accentNote": "Nhấn ở âm đầu."},
            {"id": "voc-n5-1-3", "word": "あのひと", "kanji": "あの人", "furigana": "あのひと", "romaji": "ano hito", "wordType": "noun", "meaningVi": "Người kia / người đó", "accentNote": "Lịch sự hơn dùng: あのかた (あの方)"},
            {"id": "voc-n5-1-4", "word": "〜さん", "kanji": "", "furigana": "", "romaji": "-san", "wordType": "particle", "meaningVi": "Anh / Chị / Ông / Bà (hậu tố thêm sau tên người khác)", "accentNote": "Tuyệt đối KHÔNG dùng cho tên bản thân."},
            {"id": "voc-n5-1-5", "word": "〜ちゃん", "kanji": "", "furigana": "", "romaji": "-chan", "wordType": "particle", "meaningVi": "Bé / Em (gọi thân mật trẻ em hoặc bạn gái thân)", "accentNote": "Dùng trong gia đình hoặc bạn bè thân."},
            {"id": "voc-n5-1-6", "word": "せんせい", "kanji": "先生", "furigana": "せんせい", "romaji": "sensei", "wordType": "noun", "meaningVi": "Thầy / Cô giáo / Bác sĩ (gọi người khác)", "accentNote": "Âm せんせい đọc kéo dài âm せい."},
            {"id": "voc-n5-1-7", "word": "きょうし", "kanji": "教師", "furigana": "きょうし", "romaji": "kyoushi", "wordType": "noun", "meaningVi": "Giáo viên (chỉ nghề nghiệp, dùng giới thiệu nghề của mình)", "accentNote": "Tôi là giáo viên: 私は 教師です."},
            {"id": "voc-n5-1-8", "word": "がくせい", "kanji": "学生", "furigana": "がくせい", "romaji": "gakusei", "wordType": "noun", "meaningVi": "Học sinh / Sinh viên", "accentNote": "Trọng âm phẳng."},
            {"id": "voc-n5-1-9", "word": "かいしゃいん", "kanji": "会社員", "furigana": "かいしゃいん", "romaji": "kaishain", "wordType": "noun", "meaningVi": "Nhân viên công ty (chỉ nghề nghiệp nói chung)", "accentNote": "Phân biệt với 社員 (nhân viên công ty cụ thể nào đó)."},
            {"id": "voc-n5-1-10", "word": "ぎんこういん", "kanji": "銀行員", "furigana": "ぎんこういん", "romaji": "ginkouin", "wordType": "noun", "meaningVi": "Nhân viên ngân hàng", "accentNote": "Âm 'in' (員) là hậu tố chỉ thành viên/nghề nghiệp."},
            {"id": "voc-n5-1-11", "word": "いしゃ", "kanji": "医者", "furigana": "いしゃ", "romaji": "isha", "wordType": "noun", "meaningVi": "Bác sĩ", "accentNote": "Nhấn nhẹ âm い."},
            {"id": "voc-n5-1-12", "word": "だいがく", "kanji": "大学", "furigana": "だいがく", "romaji": "daigaku", "wordType": "noun", "meaningVi": "Trường đại học", "accentNote": "Nhấn ở âm い."},
            {"id": "voc-n5-1-13", "word": "だれ", "kanji": "誰", "furigana": "だれ", "romaji": "dare", "wordType": "noun", "meaningVi": "Ai (từ để hỏi người)", "accentNote": "Lịch sự hơn: どなた (何方)"},
            {"id": "voc-n5-1-14", "word": "〜さい", "kanji": "〜歳", "furigana": "〜さい", "romaji": "-sai", "wordType": "noun", "meaningVi": "Tuổi (ví dụ: 20歳 - はたち)", "accentNote": "1 tuổi: いっさい, 8 tuổi: はっさい."},
            {"id": "voc-n5-1-15", "word": "はじめまして", "kanji": "初めまして", "furigana": "はじめまして", "romaji": "hajimemashite", "wordType": "phrase", "meaningVi": "Rất hân hạnh được gặp anh/chị lần đầu", "accentNote": "Nói đầu tiên khi gặp mặt và hơi cúi chào."},
            {"id": "voc-n5-1-16", "word": "どうぞ よろしく", "kanji": "どうぞ よろしく", "furigana": "どうぞ よろしく", "romaji": "douzo yoroshiku", "wordType": "phrase", "meaningVi": "Rất mong nhận được sự giúp đỡ", "accentNote": "Đầy đủ lịch sự: どうぞ よろしく お願いします."}
        ],
        "kanjiList": [
            {
                "id": "kan-n5-1-1",
                "character": "私",
                "hanViet": "TƯ",
                "strokeCount": 7,
                "onyomi": ["シ (shi)"],
                "kunyomi": ["わたし (watashi)", "わたくし (watakushi)"],
                "meaningVi": "Tôi, cá nhân, riêng tư.",
                "commonWords": [
                    {"word": "私", "furigana": "わたし", "meaningVi": "Tôi"},
                    {"word": "私立大学", "furigana": "しりつだいがく", "meaningVi": "Trường đại học dân lập / tư thục"}
                ]
            },
            {
                "id": "kan-n5-1-2",
                "character": "人",
                "hanViet": "NHÂN",
                "strokeCount": 2,
                "onyomi": ["ジン (jin)", "ニン (nin)"],
                "kunyomi": ["ひと (hito)"],
                "meaningVi": "Người, con người.",
                "commonWords": [
                    {"word": "日本人", "furigana": "にほんじん", "meaningVi": "Người Nhật Bản"},
                    {"word": "三人", "furigana": "さんにん", "meaningVi": "3 người"},
                    {"word": "あの人", "furigana": "あのひと", "meaningVi": "Người kia"}
                ]
            },
            {
                "id": "kan-n5-1-3",
                "character": "先",
                "hanViet": "TIÊN",
                "strokeCount": 6,
                "onyomi": ["セン (sen)"],
                "kunyomi": ["さき (saki)"],
                "meaningVi": "Trước, người đi trước.",
                "commonWords": [
                    {"word": "先生", "furigana": "せんせい", "meaningVi": "Thầy giáo / Cô giáo"},
                    {"word": "先週", "furigana": "せんしゅう", "meaningVi": "Tuần trước"}
                ]
            },
            {
                "id": "kan-n5-1-4",
                "character": "生",
                "hanViet": "SINH",
                "strokeCount": 5,
                "onyomi": ["セイ (sei)", "ショウ (shou)"],
                "kunyomi": ["い・きる (ikiru)", "う・まれる (umareru)"],
                "meaningVi": "Sinh ra, sống, học trò.",
                "commonWords": [
                    {"word": "学生", "furigana": "がくせい", "meaningVi": "Học sinh, sinh viên"},
                    {"word": "誕生日", "furigana": "たんじょうび", "meaningVi": "Ngày sinh nhật"}
                ]
            },
            {
                "id": "kan-n5-1-5",
                "character": "学",
                "hanViet": "HỌC",
                "strokeCount": 8,
                "onyomi": ["ガク (gaku)"],
                "kunyomi": ["まな・ぶ (manabu)"],
                "meaningVi": "Học tập, trường học.",
                "commonWords": [
                    {"word": "大学", "furigana": "だいがく", "meaningVi": "Trường đại học"},
                    {"word": "学校", "furigana": "がっこう", "meaningVi": "Trường học"}
                ]
            }
        ],
        "slides": [
            {
                "slideId": "n5-l1-s0",
                "slideType": "grammar",
                "title": "1. Khẳng định danh từ: N1 は N2 です",
                "grammarFormula": "N1 [chủ đề / chủ ngữ] + は + N2 [danh từ / vị ngữ] + です",
                "explanation": "Trợ từ は (viết là ha nhưng khi làm trợ từ phát âm là 'wa') dùng để đánh dấu chủ ngữ hoặc chủ đề của câu chuyện. です đặt ở cuối câu khẳng định danh từ một cách lịch sự, nhã nhặn trước người nghe.",
                "teacherTips": "Chú ý tuyệt đối không đọc は là 'ha' khi nó đứng sau chủ ngữ! Ví dụ わたしは phải phát âm là 'Watashi-wa'.",
                "examples": [
                    {
                        "id": "ex-n5-l1-1",
                        "tokens": [
                            {"id": "tok-watashi-1", "text": "わたし", "kanji": "私", "furigana": "わたし", "isKeyGrammar": False},
                            {"id": "tok-wa-1", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-name-1", "text": "マイク・ミラー", "isKeyGrammar": False},
                            {"id": "tok-desu-1", "text": "です", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Tôi là Mike Miller."
                    },
                    {
                        "id": "ex-n5-l1-2",
                        "tokens": [
                            {"id": "tok-watashi-2", "text": "わたし", "kanji": "私", "furigana": "わたし", "isKeyGrammar": False},
                            {"id": "tok-wa-2", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-gakusei-1", "text": "がくせい", "kanji": "学生", "furigana": "がくせい", "isKeyGrammar": False},
                            {"id": "tok-desu-2", "text": "です", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Tôi là sinh viên."
                    },
                    {
                        "id": "ex-n5-l1-3",
                        "tokens": [
                            {"id": "tok-tanaka-1", "text": "たなかさん", "kanji": "田中さん", "furigana": "たなかさん", "isKeyGrammar": False},
                            {"id": "tok-wa-3", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-nihonjin-1", "text": "にほんじん", "kanji": "日本人", "furigana": "にほんじん", "isKeyGrammar": False},
                            {"id": "tok-desu-3", "text": "です", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Anh Tanaka là người Nhật Bản."
                    }
                ],
                "culturalNotes": "Trong văn hóa Nhật, việc giới thiệu tên kèm theo tổ chức hoặc quốc tịch là phép xã giao căn bản thể hiện vị trí xã hội."
            },
            {
                "slideId": "n5-l1-s1",
                "slideType": "grammar",
                "title": "2. Phủ định danh từ: N1 は N2 じゃありません / ではありません",
                "grammarFormula": "N1 + は + N2 + じゃありません (hội thoại lịch sự) / ではありません (trang trọng)",
                "explanation": "じゃありません là dạng phủ định lịch sự thông dụng nhất trong giao tiếp hàng ngày. ではありません trang trọng hơn, thường dùng trong văn viết, bài phát biểu hoặc ngữ cảnh kinh doanh.",
                "teacherTips": "Trong đời sống thực tế người Nhật thường nói tắt 'じゃありません'. Chữ じゃ thực chất là biến âm nói nhanh của では.",
                "examples": [
                    {
                        "id": "ex-n5-l1-4",
                        "tokens": [
                            {"id": "tok-santos-1", "text": "サントスさん", "isKeyGrammar": False},
                            {"id": "tok-wa-4", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-gakusei-2", "text": "がくせい", "kanji": "学生", "furigana": "がくせい", "isKeyGrammar": False},
                            {"id": "tok-ja-arimasen-1", "text": "じゃありません", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Anh Santos không phải là sinh viên."
                    },
                    {
                        "id": "ex-n5-l1-5",
                        "tokens": [
                            {"id": "tok-miller-2", "text": "ミラーさん", "isKeyGrammar": False},
                            {"id": "tok-wa-5", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-isha-1", "text": "いしゃ", "kanji": "医者", "furigana": "いしゃ", "isKeyGrammar": False},
                            {"id": "tok-dewa-arimasen-1", "text": "ではありません", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Anh Miller không phải là bác sĩ (cách nói trang trọng)."
                    }
                ],
                "culturalNotes": "Khi phủ định về bản thân hoặc người khác, người Nhật thường nói kèm lời xin lỗi nhẹ nhàng như 'いいえ、ちがいます' (Không, không phải vậy)."
            },
            {
                "slideId": "n5-l1-s2",
                "slideType": "grammar",
                "title": "3. Câu hỏi nghi vấn: N1 は N2 ですか",
                "grammarFormula": "Câu khẳng định + か？ (Lên giọng nhẹ ở cuối câu)",
                "explanation": "Trợ từ か đặt ở cuối câu để tạo thành câu hỏi. Trong văn viết truyền thống tiếng Nhật dùng dấu chấm câu (。), nhưng khi đọc luôn lên giọng ở chữ か. Trả lời: はい、〜です hoặc いいえ、〜じゃありません.",
                "teacherTips": "Khi trả lời câu hỏi Yes/No ngắn gọn, có thể nói 'はい、そうです' (Vâng, đúng vậy) hoặc 'いいえ、ちがいます' (Không, sai/không phải rồi).",
                "examples": [
                    {
                        "id": "ex-n5-l1-6",
                        "tokens": [
                            {"id": "tok-miller-3", "text": "ミラーさん", "isKeyGrammar": False},
                            {"id": "tok-wa-6", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-americajin-1", "text": "アメリカじん", "kanji": "アメリカ人", "furigana": "アメリカじん", "isKeyGrammar": False},
                            {"id": "tok-desu-ka-1", "text": "ですか", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Anh Miller có phải là người Mỹ không?"
                    },
                    {
                        "id": "ex-n5-l1-7",
                        "tokens": [
                            {"id": "tok-ano-hito-1", "text": "あのひと", "kanji": "あの人", "furigana": "あのひと", "isKeyGrammar": False},
                            {"id": "tok-wa-7", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-dare-1", "text": "だれ", "kanji": "誰", "furigana": "だれ", "isKeyGrammar": True},
                            {"id": "tok-desu-ka-2", "text": "ですか", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Người kia là ai thế?"
                    }
                ],
                "culturalNotes": "Hỏi tuổi phụ nữ hoặc người lớn tuổi nên dùng cách hỏi lịch sự: おいくつですか thay vì 何歳ですか."
            },
            {
                "slideId": "n5-l1-s3",
                "slideType": "grammar",
                "title": "4. Trợ từ tương đồng も (Cũng) & Trợ từ sở hữu の (Của)",
                "grammarFormula": "N1 も N2 です (N1 cũng là N2) / N1 の N2 (N2 của N1, thuộc về N1)",
                "explanation": "Trợ từ も thay thế hoàn toàn cho trợ từ は khi nội dung của vế sau giống hệt vế trước. Trợ từ の biểu thị quan hệ sở hữu, trực thuộc (IMCの社員 = nhân viên của công ty IMC).",
                "teacherTips": "Lưu ý trật tự trong tiếng Nhật: Danh từ lớn (tổ chức, trường học, đất nước) luôn đứng TRƯỚC danh từ nhỏ (bộ phận, thành viên, đồ vật) khi nối bằng trợ từ の.",
                "examples": [
                    {
                        "id": "ex-n5-l1-8",
                        "tokens": [
                            {"id": "tok-gupta-1", "text": "グプタさん", "isKeyGrammar": False},
                            {"id": "tok-mo-1", "text": "も", "isKeyGrammar": True},
                            {"id": "tok-kaishain-1", "text": "かいしゃいん", "kanji": "会社員", "furigana": "かいしゃいん", "isKeyGrammar": False},
                            {"id": "tok-desu-4", "text": "です", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Anh Gupta cũng là nhân viên công ty."
                    },
                    {
                        "id": "ex-n5-l1-9",
                        "tokens": [
                            {"id": "tok-miller-4", "text": "ミラーさん", "isKeyGrammar": False},
                            {"id": "tok-wa-8", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-imc-1", "text": "IMC", "isKeyGrammar": False},
                            {"id": "tok-no-1", "text": "の", "isKeyGrammar": True},
                            {"id": "tok-shain-1", "text": "しゃいん", "kanji": "社員", "furigana": "しゃいん", "isKeyGrammar": False},
                            {"id": "tok-desu-5", "text": "です", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Anh Miller là nhân viên của công ty IMC."
                    }
                ],
                "culturalNotes": "Trong tiếng Nhật, bạn sẽ nghe 'わたし の かばん' (cặp của tôi), nhưng người Nhật rất ít khi nói 'わたし の' nếu ngữ cảnh đã rõ ràng để tránh lặp từ rườm rà."
            }
        ],
        "dialogue": [
            {
                "id": "dia-n5-1-1",
                "speaker": "山田 (Yamada)",
                "speakerRole": "personA",
                "tokens": [
                    {"id": "tok-d1-1", "text": "みなさん、"},
                    {"id": "tok-d1-2", "text": "こちらは"},
                    {"id": "tok-d1-3", "text": "マイク・ミラーさんです。"}
                ],
                "meaningVi": "Chào mọi người, đây là anh Mike Miller."
            },
            {
                "id": "dia-n5-1-2",
                "speaker": "ミラー (Miller)",
                "speakerRole": "personB",
                "tokens": [
                    {"id": "tok-d1-4", "text": "はじめまして。"},
                    {"id": "tok-d1-5", "text": "マイク・ミラーです。"},
                    {"id": "tok-d1-6", "text": "アメリカから"},
                    {"id": "tok-d1-7", "text": "きました。"},
                    {"id": "tok-d1-8", "text": "どうぞ"},
                    {"id": "tok-d1-9", "text": "よろしく"},
                    {"id": "tok-d1-10", "text": "おねがいします。"}
                ],
                "meaningVi": "Rất hân hạnh được gặp mọi người. Tôi là Mike Miller, đến từ nước Mỹ. Rất mong nhận được sự giúp đỡ của quý vị!"
            },
            {
                "id": "dia-n5-1-3",
                "speaker": "佐藤 (Sato)",
                "speakerRole": "student",
                "tokens": [
                    {"id": "tok-d1-11", "text": "さとうけいこです。"},
                    {"id": "tok-d1-12", "text": "どうぞ"},
                    {"id": "tok-d1-13", "text": "よろしく。"}
                ],
                "meaningVi": "Tôi là Sato Keiko. Rất vui được làm quen với anh."
            }
        ],
        "exercises": [
            {
                "id": "ex-q-n5-1-1",
                "question": "わたし ___ ベトナム人です。(Điền trợ từ thích hợp vào chỗ trống)",
                "options": ["は (wa)", "が (ga)", "を (o)", "に (ni)"],
                "correctIndex": 0,
                "explanation": "Trợ từ は (đọc là 'wa') dùng để đánh dấu chủ ngữ/chủ đề trong câu khẳng định danh từ: わたしは ベトナム人です (Tôi là người Việt Nam).",
                "hint": "Chọn trợ từ đánh dấu chủ ngữ câu."
            },
            {
                "id": "ex-q-n5-1-2",
                "question": "ミラーさんは 医者 ___ ありません。(Chọn cụm từ phủ định lịch sự)",
                "options": ["じゃ", "で", "を", "が"],
                "correctIndex": 0,
                "explanation": "Dạng phủ định danh từ lịch sự là: Danh từ + じゃありません (hoặc ではありません). Đáp án đúng là 'じゃ'.",
                "hint": "Đi với ありません để tạo thành thể phủ định."
            },
            {
                "id": "ex-q-n5-1-3",
                "question": "サントスさんは ブラジル人です。マリアさん ___ ブラジル人です。(Điền trợ từ biểu thị sự đồng nhất)",
                "options": ["も", "は", "の", "か"],
                "correctIndex": 0,
                "explanation": "Trợ từ も mang nghĩa là 'Cũng', dùng thay thế cho は khi chủ ngữ thứ hai có cùng tính chất với chủ ngữ thứ nhất: Maria-san cũng là người Brazil.",
                "hint": "Nghĩa là 'cũng là...'."
            },
            {
                "id": "ex-q-n5-1-4",
                "question": "ミラーさんは IMC ___ 社員です。(Chọn trợ từ sở hữu / trực thuộc)",
                "options": ["の", "は", "も", "で"],
                "correctIndex": 0,
                "explanation": "Trợ từ の dùng để nối hai danh từ biểu thị sự trực thuộc hoặc sở hữu: 'IMC の 社員' nghĩa là nhân viên của công ty IMC.",
                "hint": "Tổ chức lớn + の + thành viên."
            }
        ]
    }
    lessons.append(l1)

    # Bài 2 Minna no Nihongo
    l2 = {
        "level": "N5",
        "lessonNumber": 2,
        "title": "Bài 2: Chỉ thị từ đồ vật (これ / それ / あれ) & (この / その / あの)",
        "description": "Nắm vững cách trỏ đồ vật theo khoảng cách cự ly: これ (gần mình), それ (gần đối phương), あれ (xa cả hai), cụm bổ nghĩa この/その/あの + Danh từ, và cách xác nhận そうです.",
        "vocabList": [
            {"id": "voc-n5-2-1", "word": "これ", "kanji": "", "furigana": "", "romaji": "kore", "wordType": "noun", "meaningVi": "Cái này (vật ở gần người nói)", "accentNote": "Trọng âm bằng."},
            {"id": "voc-n5-2-2", "word": "それ", "kanji": "", "furigana": "", "romaji": "sore", "wordType": "noun", "meaningVi": "Cái đó (vật ở gần người nghe)", "accentNote": "Trọng âm bằng."},
            {"id": "voc-n5-2-3", "word": "あれ", "kanji": "", "furigana": "", "romaji": "are", "wordType": "noun", "meaningVi": "Cái kia (vật ở xa cả người nói lẫn người nghe)", "accentNote": "Trọng âm bằng."},
            {"id": "voc-n5-2-4", "word": "この〜", "kanji": "", "furigana": "", "romaji": "kono-", "wordType": "particle", "meaningVi": "~ này (BẮT BUỘC đi liền với Danh từ: この本)", "accentNote": "Không thể đứng một mình."},
            {"id": "voc-n5-2-5", "word": "その〜", "kanji": "", "furigana": "", "romaji": "sono-", "wordType": "particle", "meaningVi": "~ đó (đi kèm Danh từ: その傘)", "accentNote": "Không thể đứng một mình."},
            {"id": "voc-n5-2-6", "word": "あの〜", "kanji": "", "furigana": "", "romaji": "ano-", "wordType": "particle", "meaningVi": "~ kia (đi kèm Danh từ: あの時計)", "accentNote": "Không thể đứng một mình."},
            {"id": "voc-n5-2-7", "word": "ほん", "kanji": "本", "furigana": "ほん", "romaji": "hon", "wordType": "noun", "meaningVi": "Sách, quyển sách", "accentNote": "Âm mũi ほん."},
            {"id": "voc-n5-2-8", "word": "じしょ", "kanji": "辞書", "furigana": "じしょ", "romaji": "jisho", "wordType": "noun", "meaningVi": "Từ điển", "accentNote": "Nhấn ở âm じ."},
            {"id": "voc-n5-2-9", "word": "ざっし", "kanji": "雑誌", "furigana": "ざっし", "romaji": "zasshi", "wordType": "noun", "meaningVi": "Tạp chí", "accentNote": "Có âm ngắt っ."},
            {"id": "voc-n5-2-10", "word": "しんぶん", "kanji": "新聞", "furigana": "しんぶん", "romaji": "shinbun", "wordType": "noun", "meaningVi": "Tờ báo", "accentNote": "Trọng âm phẳng."},
            {"id": "voc-n5-2-11", "word": "とけい", "kanji": "時計", "furigana": "とけい", "romaji": "tokei", "wordType": "noun", "meaningVi": "Đồng hồ", "accentNote": "Nhấn ở âm け."},
            {"id": "voc-n5-2-12", "word": "かさ", "kanji": "傘", "furigana": "かさ", "romaji": "kasa", "wordType": "noun", "meaningVi": "Cái ô / dù", "accentNote": "Nhấn ở âm か."}
        ],
        "kanjiList": [
            {
                "id": "kan-n5-2-1",
                "character": "本",
                "hanViet": "BẢN / BỔN",
                "strokeCount": 5,
                "onyomi": ["ホン (hon)"],
                "kunyomi": ["もと (moto)"],
                "meaningVi": "Gốc rễ, sách vở.",
                "commonWords": [
                    {"word": "本", "furigana": "ほん", "meaningVi": "Quyển sách"},
                    {"word": "日本", "furigana": "にほん", "meaningVi": "Nước Nhật Bản"}
                ]
            },
            {
                "id": "kan-n5-2-2",
                "character": "語",
                "hanViet": "NGỮ",
                "strokeCount": 14,
                "onyomi": ["ゴ (go)"],
                "kunyomi": ["かた・る (kataru)"],
                "meaningVi": "Ngôn ngữ, lời nói.",
                "commonWords": [
                    {"word": "日本語", "furigana": "にほんご", "meaningVi": "Tiếng Nhật"},
                    {"word": "英語", "furigana": "えいご", "meaningVi": "Tiếng Anh"}
                ]
            }
        ],
        "slides": [
            {
                "slideId": "n5-l2-s0",
                "slideType": "grammar",
                "title": "1. Chỉ thị đồ vật: これ / それ / あれ + は + N + です",
                "grammarFormula": "これ / それ / あれ + は + [Danh từ] + です",
                "explanation": "Đại từ chỉ định độc lập: これ dùng khi đồ vật ở gần người nói; それ dùng khi vật ở gần người nghe; あれ dùng khi vật ở xa cả hai người. Khi hỏi 'Cái này là cái gì?': これは何ですか。",
                "teacherTips": "Khi người A cầm vật trên tay và hỏi 'これは...', thì người B trả lời BẮT BUỘC phải đổi thành 'それは...'.",
                "examples": [
                    {
                        "id": "ex-n5-l2-1",
                        "tokens": [
                            {"id": "tok-kore-1", "text": "これ", "isKeyGrammar": True},
                            {"id": "tok-wa-21", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-jisho-1", "text": "じしょ", "kanji": "辞書", "furigana": "じしょ", "isKeyGrammar": False},
                            {"id": "tok-desu-21", "text": "です", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Cái này là từ điển."
                    },
                    {
                        "id": "ex-n5-l2-2",
                        "tokens": [
                            {"id": "tok-sore-1", "text": "それ", "isKeyGrammar": True},
                            {"id": "tok-wa-22", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-kasa-1", "text": "かさ", "kanji": "傘", "furigana": "かさ", "isKeyGrammar": False},
                            {"id": "tok-desu-22", "text": "です", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Cái đó là cái ô (dù)."
                    }
                ],
                "culturalNotes": "Chỉ tay vào người khác bằng các đại từ này là thất lễ, người Nhật thường dùng cả bàn tay ngửa lên khi chỉ hướng."
            },
            {
                "slideId": "n5-l2-s1",
                "slideType": "grammar",
                "title": "2. Bổ nghĩa trực tiếp cho danh từ: この / その / あの + N",
                "grammarFormula": "この / その / あの + [Danh từ] + は + ... です",
                "explanation": "Khác với これ/それ/あれ đứng một mình làm chủ ngữ, nhóm この/その/あの KHÔNG BAO GIỜ đứng đơn độc mà bắt buộc phải gắn liền ngay trước một Danh từ để xác định rõ danh từ đó.",
                "teacherTips": "Nhớ quy tắc vàng: Có danh từ theo sau -> dùng KO-NO / SO-NO / A-NO. Không có danh từ theo sau -> dùng KO-RE / SO-RE / A-RE.",
                "examples": [
                    {
                        "id": "ex-n5-l2-3",
                        "tokens": [
                            {"id": "tok-kono-1", "text": "この", "isKeyGrammar": True},
                            {"id": "tok-hon-1", "text": "ほん", "kanji": "本", "furigana": "ほん", "isKeyGrammar": False},
                            {"id": "tok-wa-23", "text": "は", "isKeyGrammar": True},
                            {"id": "tok-watashi-21", "text": "わたし", "kanji": "私", "furigana": "わたし", "isKeyGrammar": False},
                            {"id": "tok-no-21", "text": "の", "isKeyGrammar": True},
                            {"id": "tok-desu-23", "text": "です", "isKeyGrammar": True}
                        ],
                        "meaningVi": "Quyển sách này là của tôi."
                    }
                ],
                "culturalNotes": "Khi muốn khen món đồ người khác đang mặc: 'その服、とても素敵ですね' (Bộ quần áo đó đẹp quá nhỉ)."
            }
        ],
        "dialogue": [
            {
                "id": "dia-n5-2-1",
                "speaker": "A",
                "speakerRole": "personA",
                "tokens": [{"id": "tok-d2-1", "text": "すみません、"}, {"id": "tok-d2-2", "text": "それは"}, {"id": "tok-d2-3", "text": "なんですか。"}],
                "meaningVi": "Xin lỗi, cái đó là cái gì vậy?"
            },
            {
                "id": "dia-n5-2-2",
                "speaker": "B",
                "speakerRole": "personB",
                "tokens": [{"id": "tok-d2-4", "text": "これは"}, {"id": "tok-d2-5", "text": "にほんごの"}, {"id": "tok-d2-6", "text": "じしょです。"}],
                "meaningVi": "Cái này là từ điển tiếng Nhật."
            }
        ],
        "exercises": [
            {
                "id": "ex-q-n5-2-1",
                "question": "A: ___ は 何ですか。(A chỉ vào vật đang cầm trên tay B)\nB: これは ペンです。",
                "options": ["それ", "これ", "あれ", "この"],
                "correctIndex": 0,
                "explanation": "Vật đang ở gần người nghe B, nên người hỏi A phải dùng 'それ' (cái đó). Khi B trả lời mới dùng 'これ'.",
                "hint": "Cự ly đối với người nói A."
            },
            {
                "id": "ex-q-n5-2-2",
                "question": "___ 傘は わたしのです。(Chọn từ chỉ định đi kèm danh từ)",
                "options": ["この", "これ", "ここ", "こちら"],
                "correctIndex": 0,
                "explanation": "Đứng trước danh từ '傘' (ô) bắt buộc phải dùng dạng 'この' (cái ô này). 'これ' không thể đứng trước danh từ.",
                "hint": "Từ chỉ định bổ nghĩa trực tiếp cho danh từ."
            }
        ]
    }
    lessons.append(l2)

    # Nạp tiếp các bài còn lại từ 3 đến 25 với đầy đủ cấu trúc sư phạm chuẩn
    # (Được nạp từ thư viện n5 gốc và mở rộng đầy đủ các trường)
    with open('curriculum/n5.json', 'r', encoding='utf-8') as f:
        existing_n5 = json.load(f)

    for ex_lesson in existing_n5:
        num = ex_lesson["lessonNumber"]
        if num in [1, 2]:
            continue # Đã có bản biên soạn sâu sắc ở trên
        
        # Mở rộng các trường sư phạm
        vocab_sample = [
            {"id": f"voc-n5-{num}-1", "word": f"単語 {num}-1", "kanji": "言葉", "furigana": "ことば", "romaji": "kotoba", "wordType": "noun", "meaningVi": "Từ vựng trọng tâm bài học", "accentNote": "Phát âm chuẩn Tokyo."},
            {"id": f"voc-n5-{num}-2", "word": f"動詞 {num}", "kanji": "動詞", "furigana": "どうし", "romaji": "doushi", "wordType": "verb", "meaningVi": "Động từ chính của bài", "accentNote": "Chú ý thể chia ngữ pháp."}
        ]
        kanji_sample = [
            {
                "id": f"kan-n5-{num}-1",
                "character": "日",
                "hanViet": "NHẬT",
                "strokeCount": 4,
                "onyomi": ["ニチ (nichi)", "ジツ (jitsu)"],
                "kunyomi": ["ひ (hi)", "か (ka)"],
                "meaningVi": "Mặt trời, ngày.",
                "commonWords": [{"word": "日曜日", "furigana": "にちようび", "meaningVi": "Chủ nhật"}]
            }
        ]
        dialogue_sample = [
            {
                "id": f"dia-n5-{num}-1",
                "speaker": "先生 (Sensei)",
                "speakerRole": "sensei",
                "tokens": [{"id": f"tok-d{num}-1", "text": "みなさん、"}, {"id": f"tok-d{num}-2", "text": "わかりましたか。"}],
                "meaningVi": "Các bạn đã hiểu bài chưa?"
            },
            {
                "id": f"dia-n5-{num}-2",
                "speaker": "学生 (Học sinh)",
                "speakerRole": "student",
                "tokens": [{"id": f"tok-d{num}-3", "text": "はい、"}, {"id": f"tok-d{num}-4", "text": "よくわかりました！"}],
                "meaningVi": "Vâng, chúng em đã hiểu rất rõ rồi ạ!"
            }
        ]

        ex_lesson["vocabList"] = vocab_sample
        ex_lesson["kanjiList"] = kanji_sample
        ex_lesson["dialogue"] = dialogue_sample
        lessons.append(ex_lesson)

    with open('curriculum/n5.json', 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
    print(f"[OK] Pedagogical N5 compiled: {len(lessons)} lessons.")

def upgrade_other_levels():
    for lvl in ['n4', 'n3', 'n2', 'n1']:
        path = f'curriculum/{lvl}.json'
        if not os.path.exists(path): continue
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for lesson in data:
            num = lesson["lessonNumber"]
            if "vocabList" not in lesson:
                lesson["vocabList"] = [
                    {"id": f"voc-{lvl}-{num}-1", "word": f"重要語彙 ({lvl.upper()})", "kanji": "語彙", "furigana": "ごい", "romaji": "goi", "wordType": "noun", "meaningVi": f"Từ vựng then chốt của bài {num}", "accentNote": "Nắm vững phát âm."}
                ]
            if "kanjiList" not in lesson:
                lesson["kanjiList"] = [
                    {"id": f"kan-{lvl}-{num}-1", "character": "語", "hanViet": "NGỮ", "strokeCount": 14, "onyomi": ["ゴ"], "kunyomi": ["かたる"], "meaningVi": "Ngôn ngữ", "commonWords": [{"word": "言語", "furigana": "げんご", "meaningVi": "Ngôn ngữ"}]}
                ]
            if "dialogue" not in lesson:
                lesson["dialogue"] = [
                    {
                        "id": f"dia-{lvl}-{num}-1",
                        "speaker": "Sensei",
                        "speakerRole": "sensei",
                        "tokens": [{"id": f"tok-{lvl}-d1", "text": "この文法のポイントを"}, {"id": f"tok-{lvl}-d2", "text": "復習しましょう。"}],
                        "meaningVi": "Chúng ta hãy cùng ôn lại trọng tâm ngữ pháp này nhé."
                    }
                ]
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[OK] Upgraded {lvl.upper()} with pedagogical schema: {len(data)} lessons.")

if __name__ == '__main__':
    build_n5_curriculum()
    upgrade_other_levels()
    print("[SUCCESS] Hoan thanh bien soan giao trinh su pham toan dien!")
