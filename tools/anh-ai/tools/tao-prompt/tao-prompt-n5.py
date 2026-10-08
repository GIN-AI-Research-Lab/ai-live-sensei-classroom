# -*- coding: utf-8 -*-
# Sinh prompt-n5.json: prompt tieng Anh cho anh tu vung N5 (Qwen-Image-2512).
# Doc truc tiep curriculum/n5/{1..25}.json (chi doc), ghi ra thu muc qwen-anh.
# Moi muc tu vung -> 1 "ten" (slug anh). Cung nghia -> cung ten -> dung lai 1 anh (dungLai).
# Tu chuc nang / truu tuong -> "skipped" kem ly do (app giu SVG).
import json, os, re, sys

sys.stdout.reconfigure(encoding='utf-8')
# ---- PATHS (sua o day neu doi cho dat) ----
# REPO = goc repo ai-live-sensei-classroom (mac dinh: 4 cap tren tools/anh-ai/tools/tao-prompt/; doi bang SENSEI_REPO)
# RA   = noi ghi tep prompt moi tao (mac dinh: $ANH_AI_WORK/goc, KHONG ghi de len prompts/ da luu tru)
import os as _os
_QH = _os.path.dirname(_os.path.abspath(__file__))
REPO = _os.environ.get('SENSEI_REPO') or _os.path.abspath(_os.path.join(_QH, '..', '..', '..', '..'))
WORK = _os.environ.get('ANH_AI_WORK') or _os.path.join(_os.path.expanduser('~'), 'anh-ai-work')
RA_DIR = _os.path.join(WORK, 'goc'); _os.makedirs(RA_DIR, exist_ok=True)
# ---- het PATHS ----
GOC = os.path.join(REPO, 'curriculum', 'n5')
RA = RA_DIR

# ---- phong cach co dinh (ghi 1 lan o dau file JSON) ----
STYLE = ("flat minimal vector illustration, soft rounded shapes, warm muted palette of terracotta #c96442, "
         "sage green #6b8a5e, muted gold and cream, thin dark ink #1f1d19 outlines, gentle two-to-three tone shading, "
         "people drawn as friendly simple characters with round faces and dot eyes, "
         "single clear centered subject, plain light warm off-white background #f0ebe1, generous empty margin, "
         "no text, no letters, no numbers, no watermark, square 1:1 composition")
NEG_CHUNG = ("text, letters, words, numbers, digits, captions, labels, writing on signs, kanji, hiragana, katakana, "
             "latin alphabet, watermark, signature, logo, photorealistic, photo, 3d render, glossy plastic, harsh shadows, "
             "dark background, busy patterned background, cluttered scene, multiple panels, comic panel borders, frame border, "
             "neon colors, oversaturated, blurry, low quality, jpeg artifacts, deformed hands, extra fingers, extra limbs, distorted face")

# ---- them vao negative theo nhom ----
N_NGUOI1 = "crowd, extra people"
N_CHU = "printed headlines, readable text, title lettering"
N_DEM = "wrong number of objects, extra objects, cut-off objects"
N_SO = "numerals on clock face, numbers on dial"

# ---- ly do bo qua (skipped) ----
LY_DO = {
    'hauto': 'hau to / tro tu ngu phap (xung ho, quoc tich...) - khong co hinh the, anh se day sai nghia',
    'nghivan': 'tu nghi van - anh tinh khong day duoc nghia "hoi"',
    'chao': 'cau chao hoi / nghi thuc giao tiep - nghia nam o ngu canh loi noi, khong ve duoc',
    'dap': 'tu dem / cau dap trong hoi thoai (xac nhan, do du, vay thi...) - chuc nang dien ngon',
    'tgtd': 'moc thoi gian tuong doi (hom nay/ngay mai/tuan sau/bay gio...) - can lich co so, anh cam chu so',
    'thu': 'thu trong tuan - chi phan biet duoc bang chu/so tren lich; hinh mat trang/lua se day sai nghia',
    'tanso': 'tan suat (moi sang/moi toi/moi ngay) - anh tinh khong the hien lap lai',
    'so': 'con so / gio phut / ngay thang - bat buoc hien chu so ma anh cam chu so',
    'dem': 'dem so luong lon (9, 10) - mo hinh dem khong chinh xac, SVG giu so dung',
    'ngu': 'ten ngon ngu / chu viet - muon day phai hien chu, anh cam chu',
    'photu': 'pho tu muc do / thoi thai / phong doan - truu tuong, khong co hinh the',
    'trodt': 'tro dong tu / dong tu ngu phap (muon lam ~, ton tai, "lam" van nang) - khong co mot hanh dong cu the',
    'the': 'dang chia dong tu (phu dinh / qua khu) - khac biet ngu phap, anh tinh khong day duoc',
    'rieng': 'ten rieng mot ga tau cu the - anh ga chung chung se day nghia "nha ga"',
    'truutuong': 'danh tu truu tuong (kinh nghiem, mot lan, tat ca...) - khong co hinh the ro rang',
    'sosanh': 'tu so sanh / tap hop (hon, phia, trong so) - quan he ngu phap, khong co hinh the',
}

# ---- kho anh: ten -> (loai, kho, prompt, negative them) ----
# loai: vocab = do vat don le, canh = khung canh/noi chon/thoi tiet, nhanvat = nguoi/hanh dong/tinh cach
# kho: 1 = de, 2 = can bo cuc cu the / rui ro chu, 3 = quan he / truu tuong, can thu nhieu lan
T = {}
def t(ten, loai, kho, prompt, neg=''):
    assert ten not in T, ten
    T[ten] = (loai, kho, prompt, neg)

# -- Bai 1: nguoi, nghe nghiep
t('toi', 'nhanvat', 2, 'A friendly young person smiling and pointing a finger at their own chest to indicate themselves.', N_NGUOI1)
t('chung-toi', 'nhanvat', 2, 'A group of three friends standing close together, the one in the middle sweeping an open hand around the whole group including herself.')
t('ban-anh-chi', 'nhanvat', 3, 'A friendly person facing the viewer and politely pointing an open hand straight out toward the viewer.', N_NGUOI1)
t('nguoi-kia', 'nhanvat', 3, 'Two friends in the foreground, one discreetly gesturing with an open hand toward a third person standing further away who wears terracotta clothing.')
t('moi-nguoi', 'nhanvat', 2, 'A speaker standing in front of a small seated audience, opening both arms wide toward the whole group.')
t('giao-vien', 'nhanvat', 1, 'A kind teacher standing in front of a green chalkboard covered only with simple shapes, holding a pointer and smiling.', N_CHU)
t('hoc-sinh', 'nhanvat', 1, 'A cheerful student in a Japanese school uniform wearing a backpack and holding a textbook.', N_NGUOI1)
t('nhan-vien-cong-ty', 'nhanvat', 1, 'A Japanese office worker in a dark business suit and tie holding a briefcase in front of an office building.', N_NGUOI1)
t('nhan-vien-ngan-hang', 'nhanvat', 2, 'A bank teller in a neat uniform behind a counter handing coins to a customer, a sturdy safe in the background.')
t('bac-si', 'nhanvat', 1, 'A doctor in a white coat with a stethoscope around the neck holding a clipboard and smiling.', N_NGUOI1)
t('nha-nghien-cuu', 'nhanvat', 1, 'A researcher in a white lab coat and safety glasses looking into a microscope beside glass flasks and test tubes.', N_NGUOI1)
t('ky-su', 'nhanvat', 2, 'An engineer in a hard hat and work vest studying a blueprint drawing of gears spread on a table beside a laptop and a wrench.', N_CHU)
t('dai-hoc', 'canh', 2, 'A large university campus with a stately brick main building behind a wide gate, golden ginkgo trees and students walking in.', N_CHU)
t('benh-vien', 'canh', 2, 'A clean white hospital building with a red cross emblem above the entrance and an ambulance parked in front.', N_CHU)
t('den-dien', 'vocab', 1, 'A glowing light bulb hanging from a ceiling cord, radiating warm light with a tiny electric spark inside.')
t('vang-dong-y', 'nhanvat', 2, 'A smiling person nodding while making a big circle shape above their head with both arms, the Japanese gesture for yes.', N_NGUOI1)
t('khong-phu-dinh', 'nhanvat', 2, 'A person politely waving one open hand side to side in front of their face, the Japanese gesture for no.', N_NGUOI1)
# -- Bai 2: chi thi, do vat
t('cai-nay', 'nhanvat', 3, 'Two people facing each other, the speaker on the left holding a terracotta book in her own hands and pointing at it.')
t('cai-do', 'nhanvat', 3, 'Two people facing each other, the speaker on the left pointing at a terracotta book held in the hands of the listener on the right.')
t('cai-kia', 'nhanvat', 3, 'Two people standing side by side, the speaker pointing at a terracotta tower far away in the distance while both look at it.')
t('sach', 'vocab', 1, 'A single hardcover book with a plain cover standing slightly open to show its pages.', N_CHU)
t('tu-dien', 'vocab', 2, 'A very thick heavy dictionary with a plain cover, hundreds of thin pages and small colorful index tabs along its edge.', N_CHU)
t('tap-chi', 'vocab', 2, 'A glossy thin magazine with a colorful photo cover of a smiling model, slightly curled, with no title printed.', N_CHU)
t('to-bao', 'vocab', 2, 'A folded newspaper whose columns are shown only as grey blocky lines and small photo blocks.', N_CHU)
t('quyen-vo', 'vocab', 1, 'A spiral-bound notebook lying open with blank ruled pages.', N_CHU)
t('so-tay', 'vocab', 1, 'A small pocket planner with a leather cover and an elastic band lying open on blank grid pages with a ribbon bookmark.', N_CHU)
t('danh-thiep', 'nhanvat', 2, 'Two hands politely offering a small blank white business card held by both corners, in Japanese business etiquette.', N_CHU)
t('the', 'vocab', 1, 'A single plain plastic card with rounded corners and a small gold chip, completely blank.', N_CHU)
t('but-chi', 'vocab', 1, 'A yellow wooden pencil with a sharpened graphite tip and a pink eraser on the end.')
t('but-bi', 'vocab', 1, 'A click ballpoint pen with a pocket clip lying at an angle.')
t('but-chi-kim', 'vocab', 2, 'A slim mechanical pencil with a metal tip and a thin lead, beside a small tube of spare leads.', 'wooden pencil, eraser')
t('chia-khoa', 'vocab', 1, 'A metal key and a padlock hanging together on a small key ring.')
t('dong-ho', 'vocab', 2, 'A round wall clock with only simple tick marks and two hands.', N_SO)
t('cai-o', 'vocab', 1, 'An open umbrella with a curved wooden handle.')
t('cap-tui', 'vocab', 1, 'A leather bag with a top handle and a shoulder strap.')
t('dia-cd', 'vocab', 1, 'A shiny compact disc sliding out of its clear plastic case, reflecting rainbow light.', N_CHU)
t('tivi', 'vocab', 1, 'A flat-screen television on a low stand, the screen showing a simple landscape.')
t('radio', 'vocab', 1, 'A retro portable radio with a round speaker grille, a tuning dial and an extended antenna.', N_SO)
t('may-anh', 'vocab', 1, 'A compact camera with a large lens and a neck strap.')
t('may-tinh', 'vocab', 1, 'A desktop computer with a monitor, keyboard and mouse on a desk.', N_CHU)
t('o-to', 'vocab', 1, 'A small rounded family car seen from the side.', 'license plate numbers')
t('ban', 'vocab', 1, 'A wooden study desk with a drawer and a small lamp on top.')
t('ghe', 'vocab', 1, 'A simple wooden chair with a backrest.')
t('socola', 'vocab', 1, 'A bar of chocolate partly unwrapped from its foil with a few squares broken off.', N_CHU)
t('ca-phe', 'vocab', 1, 'A cup of hot black coffee on a saucer with steam rising.')
t('qua-luu-niem', 'vocab', 2, 'A neatly wrapped box of local sweets tied in a furoshiki cloth, brought back as a souvenir, resting on a small travel suitcase.', N_CHU)
# -- Bai 3: noi chon
t('cho-nay', 'nhanvat', 3, 'Two people talking, the speaker pointing down at the ground by her own feet where a terracotta circle marks the spot she stands on.')
t('cho-do', 'nhanvat', 3, 'Two people talking, the speaker pointing at the ground by the listener\'s feet where a terracotta circle marks the spot the listener stands on.')
t('cho-kia', 'nhanvat', 3, 'Two people standing together, the speaker pointing at a spot far across a plaza that is marked by a terracotta circle.')
t('phia-nay', 'nhanvat', 3, 'A polite receptionist in uniform bowing slightly and gesturing with an open palm toward the area right beside herself to guide a guest.')
t('phia-do', 'nhanvat', 3, 'A polite receptionist gesturing with an open palm toward the guest\'s side, the area around the guest softly tinted terracotta.')
t('phia-kia', 'nhanvat', 3, 'A polite receptionist gesturing with an open palm down a long corridor toward a far doorway while a guest looks that way.')
t('phong-hoc', 'canh', 1, 'A bright classroom with rows of desks and chairs facing a green chalkboard.', N_CHU)
t('nha-an', 'canh', 1, 'A school cafeteria with long tables, trays of food and a serving counter.', N_CHU)
t('van-phong', 'canh', 1, 'An office room with several desks, computers, potted plants and filing cabinets.', N_CHU)
t('phong-hop', 'canh', 1, 'An empty meeting room with a long table surrounded by chairs and a blank projector screen on the wall.')
t('quay-le-tan', 'canh', 1, 'A reception desk in a company lobby with a smiling receptionist behind the counter and a small service bell on top.', N_CHU)
t('can-phong', 'canh', 1, 'A cozy small bedroom with a bed, a window with curtains and a little desk.')
t('nha-ve-sinh', 'vocab', 1, 'A restroom door with a simple man-and-woman pictogram sign, a clean white toilet visible inside.', N_CHU)
t('cau-thang', 'vocab', 1, 'A staircase of wide steps with a handrail going up.')
t('thang-may', 'vocab', 2, 'An elevator with its metal doors open, the call buttons shown only as up and down arrows.', N_SO)
t('thang-cuon', 'vocab', 1, 'An escalator with moving steps and black handrails in a shopping mall.')
t('dat-nuoc', 'canh', 3, 'A hand pinning a small marker onto one country on a colorful globe to show a homeland.', 'national flags, country names')
t('cong-ty', 'canh', 1, 'A modern office building with glass windows and employees in suits walking through the entrance.', N_CHU)
t('nha', 'canh', 1, 'A cozy small Japanese house with a tiled roof, a little garden and warm lights in the windows.')
t('dien-thoai', 'vocab', 1, 'A classic desk telephone with a coiled cord and a handset.', N_SO)
t('doi-giay', 'vocab', 1, 'A pair of polished leather shoes.')
t('ca-vat', 'vocab', 1, 'A striped necktie tied in a neat knot.')
t('ruou-vang', 'vocab', 1, 'A bottle of red wine beside a half-filled wine glass.', N_CHU)
t('quay-ban-hang', 'canh', 2, 'A department store sales floor section with shelves neatly lined with shoes and a shop clerk standing by.', N_CHU)
t('tang-ham', 'canh', 3, 'A cross-section of a building showing the street level and an underground basement floor beneath it highlighted in terracotta with shoppers inside.', N_SO)
t('tang-lau', 'canh', 3, 'A cross-section of a multi-story department store with one upper floor highlighted in terracotta and people inside it.', N_SO)
t('sanh', 'canh', 1, 'A spacious hotel lobby with sofas, a chandelier and tall potted plants.')
t('nuoc-y', 'canh', 2, 'The Leaning Tower of Pisa in Italy under a clear sky with cypress trees.', 'national flags')
t('thuy-si', 'canh', 2, 'The snowy Matterhorn peak in Switzerland above green meadows with a wooden chalet and a grazing cow.', 'national flags')
t('dong-yen', 'vocab', 2, 'A small pile of plain gold and silver Japanese coins, some with a round hole in the center, without any markings.', 'numbers on coins, engraved text')
t('thuoc-la', 'vocab', 1, 'A pack of cigarettes with one cigarette sticking out.', N_CHU)
# -- Bai 4: thoi gian, sinh hoat
t('mot-nua', 'vocab', 2, 'A red apple cut exactly into two equal halves, one half set slightly apart from the other.')
t('buoi-sang', 'canh', 2, 'Early morning with the sun rising over rooftops while a person opens the curtains and stretches by the window.')
t('buoi-chieu', 'canh', 3, 'A warm afternoon with the sun sinking in the western sky, long shadows and children walking home from school.')
t('ngan-hang', 'canh', 1, 'A bank building with stone columns and a large coin emblem above the entrance.', N_CHU)
t('thu-vien', 'canh', 1, 'A quiet library with tall shelves full of books and a person reading at a table.', N_CHU)
t('phim', 'vocab', 1, 'A film reel, a movie clapperboard and a striped bucket of popcorn together.', N_CHU)
t('nghi-ngoi', 'nhanvat', 1, 'A person relaxing on a sofa with eyes closed and feet up, holding a cup of tea.', N_NGUOI1)
t('thuc-day', 'nhanvat', 1, 'A person sitting up in bed stretching and yawning as a ringing alarm clock sits on the bedside table in morning light.', N_SO)
t('di-ngu', 'nhanvat', 1, 'A person sleeping peacefully in a futon at night with the moon visible through the window.')
t('lam-viec', 'nhanvat', 1, 'An office worker busily typing on a laptop at a desk with documents and a cup of coffee.', N_CHU)
t('hoc', 'nhanvat', 1, 'A student studying at a desk under a lamp, reading a textbook and taking notes.', N_CHU)
t('ket-thuc', 'canh', 3, 'Red stage curtains closing at the end of a show while the audience applauds.')
# -- Bai 5: di chuyen
t('di', 'nhanvat', 3, 'A person with a bag walking away from the viewer along a path toward a distant train station, a soft arrow on the path pointing away.')
t('den', 'nhanvat', 3, 'A person walking toward the viewer and waving hello as they arrive, a soft arrow on the path pointing toward the viewer.')
t('ve-nha', 'nhanvat', 2, 'A person arriving home in the evening, opening the front door of a cozy house as a family member welcomes them in the warm light.')
t('len-xe', 'nhanvat', 2, 'A person stepping from the platform up into a train through its open doors.', N_CHU)
t('xuong-xe', 'nhanvat', 2, 'A person stepping down off a bus onto the sidewalk through the open front door.', N_CHU)
t('nha-ga', 'canh', 1, 'A Japanese train station platform with a roof, a waiting commuter train and passengers.', N_CHU)
t('tau-dien', 'vocab', 1, 'A green-and-silver Japanese commuter train running on elevated tracks.', N_CHU)
t('xe-dap', 'vocab', 1, 'A city bicycle with a front basket.')
t('xe-buyt', 'vocab', 1, 'A city bus seen from the side.', N_CHU)
t('taxi', 'vocab', 1, 'A Japanese taxi with a small roof light.', N_CHU)
t('may-bay', 'vocab', 1, 'A passenger airplane flying among white clouds.', N_CHU)
t('ban-be', 'nhanvat', 1, 'Two friends laughing together with their arms over each other\'s shoulders.')
t('cung-nhau', 'nhanvat', 2, 'Two friends walking side by side in step, sharing one large umbrella.')
t('mot-minh', 'nhanvat', 2, 'A single person sitting alone at one end of a long park bench.', N_NGUOI1)
t('sinh-nhat', 'vocab', 1, 'A birthday cake with lit candles and a party hat beside it.', N_SO)
t('du-lich', 'nhanvat', 1, 'A traveler with a rolling suitcase, a camera around the neck and an open map.', N_CHU)
# -- Bai 6: tha dong tu, do an
t('an', 'nhanvat', 1, 'A person eating a bowl of rice with chopsticks.', N_NGUOI1)
t('uong', 'nhanvat', 1, 'A person drinking a glass of water.', N_NGUOI1)
t('nhin', 'nhanvat', 1, 'A person looking attentively through a pair of binoculars.', N_NGUOI1)
t('nghe', 'nhanvat', 2, 'A person listening to music on headphones with eyes closed and a cupped hand behind one ear.', N_NGUOI1)
t('doc', 'nhanvat', 1, 'A person sitting and reading an open book.', N_CHU)
t('viet', 'nhanvat', 1, 'A person writing a letter with a pen at a desk, the page filled only with wavy lines.', N_CHU)
t('mua-hang', 'nhanvat', 2, 'A customer at a shop counter handing coins to a clerk and receiving a shopping bag.', N_CHU)
t('chup-anh', 'nhanvat', 1, 'A person taking a photo, holding a camera up to their eye.', N_NGUOI1)
t('lam-che-tao', 'nhanvat', 2, 'A person in a kitchen shaping a rice ball with both hands, several finished rice balls on a plate beside them.', N_NGUOI1)
t('gap', 'nhanvat', 2, 'Two friends meeting in front of a station, waving and walking toward each other happily.', N_CHU)
t('hut-thuoc', 'nhanvat', 2, 'A man smoking a cigarette in an outdoor smoking area, a wisp of smoke rising.', N_CHU)
t('banh-mi', 'vocab', 1, 'A loaf of bread with one slice cut off beside it.')
t('thit', 'vocab', 1, 'A raw red steak of meat on a wooden cutting board.')
t('ca', 'vocab', 1, 'A whole fresh fish lying on a plate.')
t('rau', 'vocab', 1, 'Fresh vegetables together: a cabbage, carrots and a green leek.')
t('trai-cay', 'vocab', 1, 'A basket of assorted fruits: an apple, bananas, grapes and an orange.')
t('la-thu', 'vocab', 1, 'A folded letter covered in wavy handwriting lines being pulled out of an envelope with a heart seal.', N_CHU)
t('buc-anh', 'vocab', 1, 'A printed photograph with a white border showing a family by the sea, lying on a table.')
t('am-nhac', 'vocab', 1, 'Colorful musical notes and a treble clef swirling out of a record player.')
t('hoa', 'vocab', 1, 'A bouquet of colorful flowers.')
t('cong-vien', 'canh', 1, 'A park with green trees, a bench, a winding path and a small pond.')
t('quan-ca-phe', 'canh', 2, 'A retro Japanese kissaten coffee shop interior with a wooden counter, a siphon coffee maker and a glass of cream soda.', N_CHU)
t('nha-bep', 'canh', 1, 'A tidy home kitchen with a stove, a pot, a sink and hanging utensils.')
# -- Bai 7: cho nhan
t('tang-qua', 'nhanvat', 2, 'A person in terracotta clothing handing a wrapped gift box to a friend.')
t('nhan-qua', 'nhanvat', 2, 'A person in terracotta clothing happily receiving a wrapped gift box with both hands from a friend.')
t('cho-muon', 'nhanvat', 3, 'A person in terracotta clothing holding out an umbrella to lend it to a friend caught in the rain.')
t('muon', 'nhanvat', 3, 'A person in terracotta clothing borrowing a book, taking it from a librarian across the library counter.', N_CHU)
t('day', 'nhanvat', 2, 'An adult teaching a child to ride a bicycle, holding the back of the seat and giving advice.')
t('hoc-ky-nang', 'nhanvat', 2, 'A student learning to play the piano while a teacher sitting beside her guides her hands.', N_CHU)
t('noi-chuyen', 'nhanvat', 1, 'Two people chatting happily at a cafe table, one talking with expressive hand gestures.')
t('cho-xem', 'nhanvat', 2, 'A child proudly holding up her drawing to show it to her mother.')
t('but', 'vocab', 1, 'Several different pens together: a fountain pen, a ballpoint pen and a marker.')
t('ban-do', 'vocab', 2, 'A folded paper map with roads, rivers and a red location pin, without any labels.', N_CHU)
t('bai-tap-ve-nha', 'nhanvat', 2, 'A child at a desk at home in the evening doing homework in an open workbook with a pencil.', N_CHU)
# -- Bai 8: tinh tu
t('to-lon', 'vocab', 2, 'A huge round watermelon towering beside a tiny strawberry, the watermelon dominating the frame.')
t('nho-be', 'vocab', 2, 'A tiny kitten sitting inside an ordinary teacup, emphasizing how small it is.')
t('moi', 'vocab', 2, 'A pair of brand-new sneakers sparkling in an open shoebox.', N_CHU)
t('cu', 'vocab', 2, 'A pair of old worn-out sneakers with holes, frayed laces and faded patches.')
t('tot', 'nhanvat', 2, 'A smiling person giving an enthusiastic thumbs up.', N_NGUOI1)
t('xau-te', 'nhanvat', 2, 'A frowning person giving a thumbs down.', N_NGUOI1)
t('nong', 'nhanvat', 1, 'A person sweating under a blazing summer sun, fanning themselves with a round paper fan.', N_NGUOI1)
t('lanh', 'nhanvat', 1, 'A person shivering in a thick coat and scarf as snow falls, their breath visible.', N_NGUOI1)
t('kho', 'nhanvat', 2, 'A student scratching their head in confusion in front of a huge tangled maze puzzle.')
t('de', 'nhanvat', 2, 'A student smiling confidently while finishing a very simple jigsaw puzzle of just three big pieces.')
t('cao', 'vocab', 2, 'A very tall skyscraper towering over a small low house beside it, the tall building emphasized.')
t('re', 'nhanvat', 2, 'A delighted shopper paying a single small coin for a big bag overflowing with vegetables.')
t('dat', 'nhanvat', 2, 'A shocked shopper gasping at a tiny diamond ring on display next to an enormous pile of gold coins.', 'numbers on price tags')
t('thu-vi', 'nhanvat', 1, 'A person laughing out loud while reading a comic book.', N_CHU)
t('vui-ve', 'nhanvat', 1, 'Children laughing and playing together at a party with balloons.')
t('ban-ron', 'nhanvat', 1, 'An office worker juggling a ringing phone, a stack of papers and a laptop all at once, looking hurried.', N_CHU)
t('ngon', 'nhanvat', 1, 'A person eating a bowl of ramen with a delighted face and one hand on their cheek.', N_NGUOI1)
t('dep-sach', 'canh', 2, 'A sparkling clean and tidy room with a vase of fresh flowers on the table and little sparkles in the air.')
t('khoe-manh', 'nhanvat', 1, 'An energetic person jumping high with both arms raised, full of vitality.', N_NGUOI1)
t('yen-tinh', 'nhanvat', 2, 'A person in a calm library holding a finger to their lips to ask for silence.', N_CHU)
t('noi-tieng', 'nhanvat', 2, 'A famous star waving on a red carpet while photographers flash cameras and fans cheer.')
t('tien-loi', 'vocab', 2, 'A folding multi-tool with many handy tools fanned out: a knife, scissors, a screwdriver and a bottle opener.')
# -- Bai 9: so thich, nang luc
t('thich', 'nhanvat', 2, 'A person happily hugging a cute puppy with a few small hearts floating around them.')
t('rat-thich', 'nhanvat', 2, 'A person with sparkling eyes spreading both arms wide in front of a big strawberry cake, many hearts bursting around.')
t('ghet', 'nhanvat', 2, 'A child pushing away a plate of green peppers with a disgusted face.')
t('gioi', 'nhanvat', 2, 'A person proudly presenting a beautiful detailed painting on an easel, a gold medal ribbon pinned beside it.')
t('kem', 'nhanvat', 2, 'A person embarrassedly holding up a messy lopsided scribbled drawing.')
t('the-thao', 'vocab', 1, 'Sports equipment grouped together: a soccer ball, a baseball glove, a tennis racket and a basketball.')
t('bai-hat', 'nhanvat', 2, 'A person singing joyfully into a microphone with musical notes floating from their mouth.', N_NGUOI1)
t('buc-tranh', 'vocab', 1, 'A framed landscape painting on a wooden easel with brushes and a color palette.')
t('mon-an', 'vocab', 2, 'A table with several colorful home-cooked dishes and a frying pan of sizzling food beside them.')
t('dan-guitar', 'vocab', 1, 'An acoustic guitar.')
t('ruou-sake', 'vocab', 1, 'A ceramic sake bottle with two small sake cups on a wooden tray.', N_CHU)
t('tra-xanh', 'vocab', 1, 'Green tea in a Japanese yunomi cup next to a small ceramic teapot.')
# -- Bai 10: vi tri (meo/cho mau dat nung = vat can chu y)
t('tren', 'vocab', 3, 'A small terracotta-orange cat sitting on top of a wooden box.')
t('duoi', 'vocab', 3, 'A small terracotta-orange cat hiding under a wooden table.')
t('truoc', 'vocab', 3, 'A small terracotta-orange dog sitting in front of a little house, facing the viewer.')
t('sau', 'vocab', 3, 'A child in terracotta clothing peeking out from behind a large tree trunk.')
t('trong', 'vocab', 3, 'A small terracotta-orange cat sitting inside an open cardboard box with only its head showing.')
t('ngoai', 'vocab', 3, 'A small terracotta-orange dog waiting outside the closed front door of a house.')
t('ben-canh', 'vocab', 3, 'A small terracotta-orange cat sitting right next to a sage-green dog, shoulder to shoulder.')
t('gan', 'canh', 3, 'A small house standing just a few steps from a train station, joined by a very short dotted path.', N_CHU)
t('giua', 'vocab', 3, 'A small terracotta-orange cat sitting between two identical wooden boxes.')
t('hop', 'vocab', 1, 'A closed cardboard box.', N_CHU)
t('binh-hoa', 'vocab', 1, 'A ceramic vase holding a few flowers.')
t('cay', 'vocab', 1, 'A single leafy green tree.')
t('con-cho', 'vocab', 1, 'A friendly shiba inu dog sitting.')
t('con-meo', 'vocab', 1, 'A cat sitting and looking at the viewer.')
t('con-chim', 'vocab', 1, 'A small bird perched on a branch.')
# -- Bai 11: so dem, luong tu
t('mot-cai', 'vocab', 2, 'Exactly one red apple alone in the center.', N_DEM)
t('hai-cai', 'vocab', 2, 'Exactly two red apples side by side.', N_DEM)
t('nam-cai', 'vocab', 3, 'Exactly five red apples in one neat row.', N_DEM)
t('luong-tu-vat-tron', 'vocab', 3, 'A group of small round objects together: apples, eggs, round candies and marbles.')
t('luong-tu-vat-mong', 'vocab', 3, 'A group of thin flat objects together: a few sheets of paper, a stack of plates, a postcard and a folded T-shirt.', N_CHU)
t('luong-tu-may-moc', 'vocab', 3, 'A group of machines and vehicles together: a car, a bicycle, a television and a washing machine.')
t('luong-tu-sach', 'vocab', 3, 'A neat stack of bound books and notebooks.', N_CHU)
t('luong-tu-nguoi', 'nhanvat', 3, 'A small row of different people standing side by side, counted as a group.')
t('to-giay', 'vocab', 1, 'A neat stack of blank white paper sheets.')
t('tem-thu', 'vocab', 2, 'A postage stamp with perforated edges showing a small picture of Mount Fuji.', 'numbers on stamp, denomination')
t('phong-bi', 'vocab', 1, 'A plain sealed envelope.', N_CHU)
t('ve-tau', 'vocab', 2, 'A small blank paper train ticket being inserted into an automatic ticket gate.', N_CHU)
t('cai-dia', 'vocab', 1, 'An empty round ceramic plate.')
t('qua-trung', 'vocab', 1, 'A few eggs, one cracked open to show the yolk.')
t('nguoi-nuoc-ngoai', 'nhanvat', 3, 'A foreign tourist with a backpack and a map asking a Japanese local for directions on a street.', N_CHU)
t('nguoi-lon', 'nhanvat', 2, 'A tall adult in terracotta clothing standing beside a small child.')
t('cau-hoi', 'nhanvat', 2, 'A student raising a hand in class with a large question mark symbol floating above.')
# -- Bai 12: so sanh, mua
t('so-mot', 'vocab', 2, 'A shining gold trophy on the top step of a winner\'s podium with confetti falling.', N_SO)
t('mua-trong-nam', 'canh', 2, 'A single tree split into four quarters showing spring blossoms, green summer leaves, red autumn leaves and winter snow.')
t('mua-xuan', 'canh', 1, 'Cherry blossom trees in full bloom with pink petals drifting.')
t('mua-he', 'canh', 1, 'A bright summer scene with sunflowers, a blue sky, big white clouds and a glass wind chime.')
t('mua-thu', 'canh', 1, 'Red and orange maple trees with leaves falling.')
t('mua-dong', 'canh', 1, 'A snowy winter landscape with a snowman and bare trees.')
t('thi-tran', 'canh', 1, 'A small Japanese town street with shops, houses and overhead power lines.', N_CHU)
t('dong-vat', 'vocab', 1, 'A group of animals together: a dog, a cat, a rabbit, an elephant and a giraffe.')
t('nuoc-ngoai', 'canh', 3, 'A traveler with a suitcase at an airport window gazing at an unfamiliar foreign city skyline across the sea.', N_CHU)
t('the-gioi', 'vocab', 1, 'The Earth globe showing continents and oceans with a few small clouds drifting around it.', 'country names, labels')
t('nghi-he', 'canh', 2, 'Children in straw hats with a bug-catching net and slices of watermelon at the seaside on summer vacation.')
# -- Bai 13: mong muon, noi choi
t('muon-co', 'nhanvat', 2, 'A child pressing their face against a shop window, staring longingly at a toy robot.', N_CHU)
t('mua-sam', 'nhanvat', 1, 'A happy person walking with several shopping bags in both hands.', N_CHU)
t('choi', 'nhanvat', 1, 'Children playing on a playground slide and swings.')
t('boi', 'nhanvat', 1, 'A person swimming freestyle in clear blue water.', N_NGUOI1)
t('bien', 'canh', 1, 'A calm blue sea with gentle waves, a sandy beach and a distant horizon.')
t('nui', 'canh', 1, 'A green mountain range with one tall peak.')
t('ho-boi', 'canh', 1, 'An outdoor swimming pool with lane ropes and a metal ladder.', N_SO)
t('rap-chieu-phim', 'canh', 1, 'A movie theater with rows of red seats facing a large glowing screen, audience silhouettes watching.', N_CHU)
t('vi-tien', 'vocab', 1, 'A leather wallet with a few coins spilling out.')
t('nhieu', 'vocab', 2, 'A huge heap of many apples overflowing a basket.')
t('shinkansen', 'vocab', 1, 'A sleek white Japanese bullet train with a long pointed nose speeding along.', N_CHU)
t('suoi-nuoc-nong', 'canh', 1, 'An outdoor Japanese hot spring with steaming water surrounded by rocks and snowy trees.')
# -- Bai 14: the te
t('cho-doi', 'nhanvat', 1, 'A person waiting at a bus stop and glancing at their wristwatch.', N_CHU)
t('chet', 'vocab', 2, 'A wilted drooping flower in a pot with its petals fallen around it.')
t('song-cu-tru', 'canh', 2, 'A family living in a cozy apartment, waving from their balcony full of potted plants and hanging laundry.')
t('voi', 'nhanvat', 1, 'A person running late, rushing along with a piece of toast in their mouth and a bag, glancing at a watch.', N_NGUOI1)
t('dung-day', 'nhanvat', 2, 'A person rising up from a chair mid-motion, knees straightening.', N_NGUOI1)
t('ngoi-xuong', 'nhanvat', 2, 'A person lowering themselves onto a chair mid-motion to sit down.', N_NGUOI1)
t('cam-mang', 'nhanvat', 1, 'A person walking while carrying a bag in one hand.', N_NGUOI1)
t('biet', 'nhanvat', 3, 'A person smiling with sudden understanding as a bright light bulb appears above their head.', N_NGUOI1)
t('mo', 'nhanvat', 2, 'A person opening a window wide as fresh air blows in.', N_NGUOI1)
t('dong', 'nhanvat', 2, 'A person pushing a door shut to close it.', N_NGUOI1)
t('tat', 'nhanvat', 2, 'A person switching off a lamp as the room turns dim.', N_NGUOI1)
t('giup-do', 'nhanvat', 2, 'A child helping his mother hang the laundry, handing her a shirt.')
t('ket-hon', 'nhanvat', 1, 'A smiling bride in a white dress and a groom in a suit holding hands at their wedding.')
# -- Bai 15: cho phep, cam doan
t('su-dung', 'nhanvat', 2, 'A person using a pair of scissors to cut a sheet of paper.', N_NGUOI1)
t('vao', 'nhanvat', 3, 'A person seen from behind stepping through an open doorway into a bright room.', N_NGUOI1)
t('ra', 'nhanvat', 3, 'A person stepping out of a building doorway onto the street, facing the viewer.', N_NGUOI1)
t('coi', 'nhanvat', 2, 'A person taking off their shoes at the entrance of a Japanese home, other shoes neatly lined on the genkan step.')
t('dung-do-xe', 'nhanvat', 2, 'A car pulling neatly into a parking space and stopping.', 'license plate numbers, parking numbers')
t('cua-so', 'vocab', 1, 'A window with curtains drawn open showing a blue sky.')
t('bai-kiem-tra', 'vocab', 2, 'An exam sheet with rows of blank answer boxes and a big red circle mark, a pencil and an eraser beside it.', N_CHU + ', score numbers')
t('on-khong-sao', 'nhanvat', 2, 'A child who has just tumbled getting back up with a smile and making an OK sign with one hand.')
# -- Bai 16: co the, ngoai hinh
t('danh-rang', 'nhanvat', 1, 'A person brushing their teeth in front of a mirror with a little foam.', N_NGUOI1)
t('tam-voi-sen', 'nhanvat', 1, 'A person taking a shower, shown from the shoulders up, water streaming from the showerhead.', 'nudity')
t('ra-ngoai', 'nhanvat', 2, 'A person stepping out of their front door with a bag, waving goodbye to family inside.')
t('khuon-mat', 'vocab', 1, 'A smiling friendly face shown front-on, the whole face outlined in terracotta.')
t('mat', 'vocab', 2, 'A friendly face with both eyes highlighted in terracotta.')
t('tai', 'vocab', 2, 'A friendly face in three-quarter view with the ear highlighted in terracotta.')
t('mieng', 'vocab', 2, 'A friendly face with the smiling mouth highlighted in terracotta.')
t('ban-tay', 'vocab', 1, 'An open hand with the palm facing forward and fingers spread.', 'six fingers, extra fingers')
t('chan', 'vocab', 2, 'A standing person with the legs and feet highlighted in terracotta.', N_NGUOI1)
t('dau', 'vocab', 2, 'A standing person with the head highlighted in terracotta.', N_NGUOI1)
t('co-the', 'nhanvat', 2, 'A healthy person stretching their whole body with arms raised in a morning exercise pose.', N_NGUOI1)
t('chieu-cao', 'nhanvat', 2, 'A child standing straight against a wall while a parent measures her height with a hand flat on her head.', 'ruler numbers')
t('toc', 'nhanvat', 1, 'A woman with long flowing glossy hair combing it with a brush.', N_NGUOI1)
t('vui-ve-coi-mo', 'nhanvat', 2, 'A cheerful open person with a big bright smile waving warmly, sunshine behind them.', N_NGUOI1)
t('tot-bung', 'nhanvat', 2, 'A young person kindly carrying an elderly woman\'s bag and helping her across the street.')
t('diu-dang', 'nhanvat', 2, 'A gentle mother softly stroking her child\'s head with a warm smile.')
t('bo-vest', 'vocab', 1, 'A men\'s business suit jacket and trousers on a hanger.')
t('loi-vao', 'canh', 2, 'The open entrance of a building with a welcome mat and a floor arrow pointing inside.', N_CHU)
# -- Bai 17: suc khoe, giay to
t('quen', 'nhanvat', 2, 'A person outside a closed door slapping their forehead, realizing they left their umbrella behind inside.')
t('thuoc', 'vocab', 1, 'A few pills and capsules beside a small medicine bottle.', N_CHU)
t('benh-om', 'nhanvat', 1, 'A sick person lying in bed with a thermometer in the mouth and a cooling pad on the forehead.', N_SO)
t('cuoc-hop', 'canh', 1, 'Several colleagues in a meeting around a table discussing a bar chart shown on a screen.', N_CHU)
t('ho-chieu', 'vocab', 2, 'A passport booklet with a plain dark red cover and a simple golden emblem.', N_CHU)
t('lai-xe', 'nhanvat', 1, 'A person driving a car with both hands on the steering wheel, seen through the side window.', 'license plate numbers')
t('bang-lai', 'vocab', 2, 'A driver\'s license card with a small portrait photo and blank lines, next to a set of car keys.', N_CHU + ', id numbers')
t('lo-lang', 'nhanvat', 1, 'A worried person biting their nails with a furrowed brow.', N_NGUOI1)
# -- Bai 18: so thich, kha nang
t('choi-dan', 'nhanvat', 1, 'A person playing the piano with both hands on the keys.', N_NGUOI1)
t('di-dao', 'nhanvat', 1, 'A person taking a leisurely stroll with a dog along a park path.')
t('vao-bon-tam', 'nhanvat', 2, 'A person soaking happily up to the shoulders in a steaming Japanese bathtub.', 'nudity')
t('so-thich', 'nhanvat', 3, 'A smiling person surrounded by their hobby items: a guitar, a camera, paintbrushes and a soccer ball.')
t('piano', 'vocab', 1, 'A black upright piano.')
t('bon-tam', 'vocab', 1, 'A deep Japanese bathtub filled with steaming water, a small wooden stool and bucket beside it.')
t('mot-chut', 'vocab', 2, 'A small spoon holding just a tiny pinch of sugar above a cup.')
# -- Bai 19: kinh nghiem, dia danh
t('leo-nui', 'nhanvat', 1, 'A hiker with a backpack and trekking pole climbing a steep mountain trail.', N_NGUOI1)
t('tro-thanh', 'vocab', 3, 'A small seedling, a young sapling and a tall grown tree standing in a row, showing growth over time.')
t('du-hoc-sinh', 'nhanvat', 2, 'A young international student with a suitcase and backpack standing in front of a Japanese university gate.', N_CHU)
t('nui-phu-si', 'canh', 1, 'Mount Fuji with its snowy cap above a calm lake.')
t('kyoto', 'canh', 2, 'The Golden Pavilion temple of Kyoto reflected in a calm pond, surrounded by pine trees.')
t('ngoi-chua', 'canh', 1, 'A traditional Japanese Buddhist temple hall with a curved tiled roof and a large incense burner in front.', N_CHU)
# -- Bai 20: gia dinh (nguoi duoc noi toi mac do dat nung)
t('gia-dinh', 'nhanvat', 1, 'A happy family of a father, a mother and two children standing together.')
t('cha-me', 'nhanvat', 2, 'A father and a mother standing side by side smiling warmly, both in terracotta clothing, with their small child hugging them.')
t('bo', 'nhanvat', 1, 'A father in terracotta clothing carrying his young child on his shoulders.')
t('me', 'nhanvat', 1, 'A mother in terracotta clothing lovingly holding her small child\'s hand.')
t('anh-chi-em', 'nhanvat', 1, 'Three siblings of different ages, brothers and sisters, standing together in a row by height.')
t('anh-trai', 'nhanvat', 2, 'An older teenage brother in terracotta clothing with his arm around his little sibling.')
t('chi-gai', 'nhanvat', 2, 'An older teenage sister in terracotta clothing holding her little sibling\'s hand.')
t('em-trai', 'nhanvat', 2, 'A little boy in terracotta clothing standing beside his older sister, who pats his head.')
t('em-gai', 'nhanvat', 2, 'A little girl in terracotta clothing standing beside her older brother, who pats her head.')
# -- Bai 21: y kien, thoi tiet
t('nghi-rang', 'nhanvat', 3, 'A person with a hand on the chin and a thought bubble showing a rain cloud, forming an opinion.', N_NGUOI1)
t('noi', 'nhanvat', 2, 'A person speaking with one hand raised beside the mouth and an empty speech bubble with no writing.', N_CHU)
t('suy-nghi', 'nhanvat', 3, 'A person deep in thought with eyes closed and arms crossed, turning gears floating in a thought bubble above.', N_NGUOI1)
t('thoi-tiet', 'vocab', 2, 'Weather symbols grouped together: a sun, a cloud, a rain cloud with drops and a snowflake.', N_SO)
t('mua-roi', 'canh', 1, 'Rain falling on a street where a person walks under an umbrella past puddles.')
t('tuyet', 'canh', 1, 'Snow falling softly on rooftops, the ground covered in white snow.')
t('bao-to', 'canh', 2, 'A typhoon with swirling wind and heavy rain bending palm trees, a person\'s umbrella blown inside out.')
t('tin-tuc', 'nhanvat', 2, 'A news anchor at a desk shown on a television screen with a world map graphic behind.', N_CHU + ', news ticker')
t('quan-trong', 'nhanvat', 3, 'A person carefully holding a small treasure box close to their chest with both hands.', N_NGUOI1)
t('vat-va', 'nhanvat', 2, 'A person struggling to push a cart piled with a huge stack of boxes up a steep hill, sweating.')
# -- Bai 22: trang phuc, cong trinh
t('mac-ao', 'nhanvat', 2, 'A person putting on a jacket, one arm sliding into the sleeve.', N_NGUOI1)
t('deo-kinh', 'nhanvat', 2, 'A person putting on a pair of glasses with both hands.', N_NGUOI1)
t('doi-mu', 'nhanvat', 2, 'A person placing a hat onto their head with both hands.', N_NGUOI1)
t('xay-dung', 'canh', 2, 'Construction workers in hard hats building the wooden frame of a house beside a crane.', N_CHU)
t('kinh-mat', 'vocab', 1, 'A pair of round eyeglasses.')
t('mu', 'vocab', 1, 'A wide-brimmed straw hat with a ribbon band.')
t('quan-ao', 'vocab', 1, 'A neat pile of folded clothes: a shirt, trousers and a sweater.', N_CHU)
t('do-tay', 'vocab', 2, 'Western-style clothes on a clothing rack: a dress, a blouse and a blazer.', 'kimono, ' + N_CHU)
t('toa-nha', 'canh', 1, 'A tall multi-story building.', N_CHU)
t('cua-hang', 'canh', 1, 'A small Japanese shop front with a plain cloth noren curtain over the entrance and goods displayed outside.', N_CHU)
t('nha-hang', 'canh', 1, 'A restaurant interior with tables set with white tablecloths, plates and wine glasses while a waiter serves.', N_CHU)
t('nguoi', 'nhanvat', 1, 'A single ordinary person standing in a relaxed neutral pose.', N_NGUOI1)
# -- Bai 23: giao thong
t('an-nhan', 'nhanvat', 2, 'A finger pressing a big round button on a pedestrian crossing signal box.', N_CHU)
t('bang-qua', 'nhanvat', 1, 'People crossing a street at a zebra crosswalk.')
t('re-queo', 'canh', 2, 'A car turning at a street corner with a curved arrow showing the turn.', N_CHU)
t('mo-tu-dong', 'canh', 3, 'Glass automatic doors sliding open by themselves at a shop entrance with no one touching them.', N_CHU)
t('cai-nut', 'vocab', 1, 'A single large round push button on a small panel.', N_CHU)
t('ben-phai', 'nhanvat', 3, 'A person seen from behind raising their right hand, the right hand and the right side of the path highlighted in terracotta.', 'mirrored pose')
t('ben-trai', 'nhanvat', 3, 'A person seen from behind raising their left hand, the left hand and the left side of the path highlighted in terracotta.', 'mirrored pose')
t('den-giao-thong', 'vocab', 1, 'A Japanese horizontal traffic light with green, yellow and red lamps.', N_CHU)
t('tre-con', 'nhanvat', 1, 'A small child playing with colorful building blocks.', N_CHU)
t('ranh-roi', 'nhanvat', 2, 'A bored person lying on the floor idly staring at the ceiling with nothing to do.', N_NGUOI1)
# -- Bai 24: cho nhan hanh dong
t('cho-toi', 'nhanvat', 3, 'A first-person view of a smiling friend reaching toward the viewer to hand over a wrapped gift, the viewer\'s own hands receiving it at the bottom of the frame.')
t('rua', 'nhanvat', 1, 'A person washing dishes at a kitchen sink with soap bubbles.', N_NGUOI1)
t('hanh-ly', 'vocab', 1, 'A pile of luggage: suitcases, bags and wrapped parcels.', N_CHU)
t('nang', 'nhanvat', 2, 'A person straining with great effort to lift a very heavy box.', N_NGUOI1)
t('con-duong', 'canh', 1, 'A road winding through green countryside toward the horizon.')
t('do-vat-va', 'nhanvat', 3, 'A relieved person smiling gratefully while a friend helps carry their heavy boxes.')
# -- Bai 25: dieu kien
t('met-moi', 'nhanvat', 1, 'An exhausted office worker slumped over a desk with half-closed eyes.', N_NGUOI1)
t('co-gang', 'nhanvat', 1, 'A determined person wearing a white hachimaki headband and clenching both fists.', N_CHU)
t('tien', 'vocab', 1, 'A pile of coins and plain paper banknotes without any markings.', 'numbers on money, portraits text')

# ---- anh xa tung muc (id ngan) -> ten, hoac !ly_do ----
M = '''
1-1 toi|1-2 chung-toi|1-3 ban-anh-chi|1-4 nguoi-kia|1-5 moi-nguoi|1-6 !hauto|1-7 !hauto|1-8 !hauto|1-9 !hauto
1-10 giao-vien|1-11 giao-vien|1-12 hoc-sinh|1-13 nhan-vien-cong-ty|1-14 nhan-vien-cong-ty|1-15 nhan-vien-ngan-hang
1-16 bac-si|1-17 nha-nghien-cuu|1-18 ky-su|1-19 dai-hoc|1-20 benh-vien|1-21 den-dien|1-22 !nghivan|1-23 !nghivan
1-24 !so|1-25 !nghivan|1-26 vang-dong-y|1-27 khong-phu-dinh|1-28 !chao|1-29 !chao|1-30 !chao
2-1 cai-nay|2-2 cai-do|2-3 cai-kia|2-4 !nghivan|2-5 cai-nay|2-6 cai-do|2-7 cai-kia|2-8 !nghivan
2-9 sach|2-10 tu-dien|2-11 tap-chi|2-12 to-bao|2-13 quyen-vo|2-14 so-tay|2-15 danh-thiep|2-16 the|2-17 but-chi
2-18 but-bi|2-19 but-chi-kim|2-20 chia-khoa|2-21 dong-ho|2-22 cai-o|2-23 cap-tui|2-24 dia-cd|2-25 tivi|2-26 radio
2-27 may-anh|2-28 may-tinh|2-29 o-to|2-30 ban|2-31 ghe|2-32 socola|2-33 ca-phe|2-34 qua-luu-niem
2-35 !ngu|2-36 !ngu|2-37 !ngu|2-38 !nghivan|2-39 !dap|2-40 !dap|2-41 !dap|2-42 !dap|2-43 !chao|2-44 !chao
2-45 !chao|2-46 !chao|2-47 !chao|2-48 !chao
3-1 cho-nay|3-2 cho-do|3-3 cho-kia|3-4 !nghivan|3-5 phia-nay|3-6 phia-do|3-7 phia-kia|3-8 !nghivan
3-9 phong-hoc|3-10 nha-an|3-11 van-phong|3-12 phong-hop|3-13 quay-le-tan|3-14 can-phong|3-15 nha-ve-sinh
3-16 cau-thang|3-17 thang-may|3-18 thang-cuon|3-19 dat-nuoc|3-20 cong-ty|3-21 nha|3-22 dien-thoai|3-23 doi-giay
3-24 ca-vat|3-25 ruou-vang|3-26 quay-ban-hang|3-27 tang-ham|3-28 tang-lau|3-41 !nghivan|3-42 sanh|3-43 nuoc-y
3-44 thuy-si|3-45 !rieng|3-29 dong-yen|3-30 !nghivan|3-31 !so|3-32 !so|3-33 !so|3-34 !chao|3-35 !chao|3-36 !chao
3-37 !dap|3-38 !dap|3-39 nha-ve-sinh|3-40 thuoc-la
4-1 !tgtd|4-2 !so|4-3 !so|4-4 mot-nua|4-5 !so|4-6 !nghivan|4-7 buoi-sang|4-8 buoi-chieu|4-9 buoi-sang
4-10 !tgtd|4-11 !tgtd|4-12 !tgtd|4-13 !tgtd|4-14 !tgtd|4-15 !thu|4-16 !thu|4-17 !thu|4-18 !nghivan
4-19 !tanso|4-20 !tanso|4-21 !tanso|4-22 !tgtd|4-23 !tgtd|4-24 ngan-hang|4-25 thu-vien|4-26 phim|4-27 nghi-ngoi
4-28 !so|4-29 thuc-day|4-30 di-ngu|4-31 lam-viec|4-32 nghi-ngoi|4-33 hoc|4-34 ket-thuc
5-1 di|5-2 den|5-3 ve-nha|5-4 len-xe|5-5 xuong-xe|5-6 nha-ga|5-7 tau-dien|5-8 xe-dap|5-9 o-to|5-10 o-to
5-11 xe-buyt|5-12 taxi|5-13 may-bay|5-14 ban-be|5-15 cung-nhau|5-16 mot-minh|5-17 !nghivan|5-18 !photu
5-19 sinh-nhat|5-20 du-lich|5-21 !tgtd|5-22 !tgtd|5-23 !tgtd|5-24 !so|5-25 !so
6-1 an|6-2 uong|6-3 nhin|6-4 nghe|6-5 doc|6-6 viet|6-7 mua-hang|6-8 chup-anh|6-9 lam-che-tao|6-10 gap
6-11 hut-thuoc|6-12 !trodt|6-13 banh-mi|6-14 thit|6-15 ca|6-16 rau|6-17 trai-cay|6-18 to-bao|6-19 la-thu
6-20 buc-anh|6-21 am-nhac|6-22 hoa|6-23 cong-vien|6-24 quan-ca-phe|6-25 nha-an|6-26 nha-bep
7-1 tang-qua|7-2 nhan-qua|7-3 cho-muon|7-4 muon|7-5 day|7-6 hoc-ky-nang|7-7 noi-chuyen|7-8 cho-xem|7-9 but
7-10 !ngu|7-11 dien-thoai|7-12 sinh-nhat|7-13 !photu|7-14 !photu|7-15 !ngu|7-16 !ngu|7-17 tu-dien|7-18 cai-o
7-19 ban-do|7-20 bai-tap-ve-nha
8-1 to-lon|8-2 nho-be|8-3 moi|8-4 cu|8-5 tot|8-6 xau-te|8-7 nong|8-8 lanh|8-9 kho|8-10 de|8-11 cao|8-12 re
8-13 thu-vi|8-14 vui-ve|8-15 ban-ron|8-16 ngon|8-17 dep-sach|8-18 khoe-manh|8-19 yen-tinh|8-20 noi-tieng
8-21 tien-loi|8-22 !photu|8-23 !photu
9-1 thich|9-2 rat-thich|9-3 ghet|9-4 gioi|9-5 kem|9-6 the-thao|9-7 am-nhac|9-8 bai-hat|9-9 buc-tranh
9-10 mon-an|9-11 dan-guitar|9-12 ruou-sake|9-13 tra-xanh|9-14 !hauto|9-15 !nghivan|9-16 !ngu|9-17 hoc
9-18 lam-viec|9-19 khoe-manh|9-20 vui-ve
10-1 !trodt|10-2 !trodt|10-3 tren|10-4 duoi|10-5 truoc|10-6 sau|10-7 trong|10-8 ngoai|10-9 ben-canh|10-10 gan
10-11 giua|10-12 ban|10-13 ghe|10-14 hop|10-15 binh-hoa|10-16 cay|10-17 con-cho|10-18 con-meo|10-19 con-chim
10-20 ngan-hang|10-21 !nghivan|10-22 !nghivan
11-1 mot-cai|11-2 hai-cai|11-3 nam-cai|11-4 !dem|11-5 !dem|11-6 !nghivan|11-7 luong-tu-vat-tron
11-8 luong-tu-vat-mong|11-9 luong-tu-may-moc|11-10 luong-tu-sach|11-11 luong-tu-nguoi|11-12 !so|11-13 to-giay
11-14 tem-thu|11-15 phong-bi|11-16 ve-tau|11-17 cai-dia|11-18 qua-trung|11-19 but-chi|11-20 nguoi-nuoc-ngoai
11-21 nguoi-lon|11-22 cau-hoi|11-23 !so
12-1 !sosanh|12-2 !sosanh|12-3 so-mot|12-4 !nghivan|12-5 !sosanh|12-6 mua-trong-nam|12-7 mua-xuan|12-8 mua-he
12-9 mua-thu|12-10 mua-dong|12-11 dat-nuoc|12-12 thi-tran|12-13 dong-vat|12-14 trai-cay|12-15 nuoc-ngoai
12-16 the-gioi|12-17 nghi-he|12-18 cao|12-19 re|12-20 to-lon
13-1 muon-co|13-2 !trodt|13-3 mua-sam|13-4 du-lich|13-5 choi|13-6 boi|13-7 bien|13-8 nui|13-9 ho-boi
13-10 rap-chieu-phim|13-11 dong-ho|13-12 vi-tien|13-13 cap-tui|13-14 nhieu|13-15 !nghivan|13-16 !nghivan
13-17 shinkansen|13-18 suoi-nuoc-nong|13-19 !tgtd|13-20 !tgtd
14-1 mua-hang|14-2 cho-doi|14-3 chet|14-4 choi|14-5 song-cu-tru|14-6 noi-chuyen|14-7 voi|14-8 lam-che-tao
14-9 dung-day|14-10 ngoi-xuong|14-11 cam-mang|14-12 biet|14-13 mo|14-14 dong|14-15 tat|14-16 giup-do
14-17 ket-hon|14-18 den|14-19 !trodt|14-20 lam-viec
15-1 su-dung|15-2 vao|15-3 ra|15-4 coi|15-5 hut-thuoc|15-6 dung-do-xe|15-7 buc-anh|15-8 den-dien|15-9 cua-so
15-10 doi-giay|15-11 thu-vien|15-12 phong-hoc|15-13 tu-dien|15-14 bai-kiem-tra|15-15 am-nhac|15-16 !tgtd
15-17 on-khong-sao|15-18 !photu|15-19 ket-hon|15-20 biet
16-1 thuc-day|16-2 danh-rang|16-3 tam-voi-sen|16-4 ra-ngoai|16-5 ve-nha|16-6 khuon-mat|16-7 mat|16-8 tai
16-9 mieng|16-10 ban-tay|16-11 chan|16-12 dau|16-13 co-the|16-14 chieu-cao|16-15 toc|16-16 vui-ve-coi-mo
16-17 tot-bung|16-18 diu-dang|16-19 bo-vest|16-20 loi-vao
17-1 uong|17-2 viet|17-3 an|17-4 den|17-5 !trodt|17-6 quen|17-7 vao|17-8 hut-thuoc|17-9 thuoc|17-10 benh-om
17-11 benh-vien|17-12 bac-si|17-13 bai-tap-ve-nha|17-14 cuoc-hop|17-15 ho-chieu|17-16 lai-xe|17-17 bang-lai
17-18 bai-kiem-tra|17-19 on-khong-sao|17-20 lo-lang
18-1 bai-hat|18-2 boi|18-3 choi-dan|18-4 doc|18-5 viet|18-6 lai-xe|18-7 di-dao|18-8 di-ngu|18-9 vao-bon-tam
18-10 so-thich|18-11 piano|18-12 dan-guitar|18-13 bai-hat|18-14 buc-tranh|18-15 bon-tam|18-16 di-dao
18-17 lai-xe|18-18 bang-lai|18-19 !ngu|18-20 mot-chut
19-1 len-xe|19-2 leo-nui|19-3 tro-thanh|19-4 noi-chuyen|19-5 boi|19-6 mua-sam|19-7 nuoc-ngoai
19-8 nguoi-nuoc-ngoai|19-9 du-hoc-sinh|19-10 nui-phu-si|19-11 kyoto|19-12 ngoi-chua|19-13 !truutuong
19-14 noi-tieng|19-15 khoe-manh|19-16 nong|19-17 lanh|19-18 gioi|19-19 ban-ron|19-20 !truutuong
20-1 an|20-2 !the|20-3 !the|20-4 !the|20-5 gia-dinh|20-6 cha-me|20-7 bo|20-8 me|20-9 bo|20-10 me
20-11 anh-chi-em|20-12 anh-trai|20-13 chi-gai|20-14 em-trai|20-15 em-gai|20-16 anh-trai|20-17 chi-gai
20-18 ban-be|20-19 khoe-manh|20-20 ban-ron
21-1 nghi-rang|21-2 noi|21-3 suy-nghi|21-4 thoi-tiet|21-5 mua-roi|21-6 tuyet|21-7 bao-to|21-8 tin-tuc
21-9 to-bao|21-10 quan-trong|21-11 vat-va|21-12 tien-loi|21-13 !tgtd|21-14 !tgtd|21-15 !photu|21-16 !photu
21-17 !photu|21-18 giao-vien|21-19 nguoi-nuoc-ngoai|21-20 kho
22-1 mac-ao|22-2 deo-kinh|22-3 doi-mu|22-4 xay-dung|22-5 viet|22-6 lam-che-tao|22-7 kinh-mat|22-8 mu
22-9 quan-ao|22-10 do-tay|22-11 toa-nha|22-12 cua-hang|22-13 nha-hang|22-14 quan-ca-phe|22-15 phim|22-16 nguoi
22-17 ban|22-18 ghe|22-19 am-nhac|22-20 tot-bung
23-1 an-nhan|23-2 bang-qua|23-3 re-queo|23-4 mo-tu-dong|23-5 ra-ngoai|23-6 ve-nha|23-7 cai-nut|23-8 ben-phai
23-9 ben-trai|23-10 den-giao-thong|23-11 cua-so|23-12 den-dien|23-13 mua-xuan|23-14 mua-thu|23-15 nong
23-16 lanh|23-17 tre-con|23-18 hoc-sinh|23-19 ranh-roi|23-20 khoe-manh
24-1 cho-toi|24-2 nhan-qua|24-3 tang-qua|24-4 day|24-5 cho-muon|24-6 cam-mang|24-7 rua|24-8 lam-che-tao
24-9 mua-hang|24-10 hanh-ly|24-11 nang|24-12 ban-do|24-13 nha-ga|24-14 con-duong|24-15 tu-dien|24-16 buc-anh
24-17 sinh-nhat|24-18 tot-bung|24-19 do-vat-va|24-20 !photu
25-1 met-moi|25-2 nghi-ngoi|25-3 mua-sam|25-4 du-lich|25-5 co-gang|25-6 tien|25-7 nghi-ngoi|25-8 cong-ty
25-9 lam-viec|25-10 thoi-tiet|25-11 mua-roi|25-12 ban-ron|25-13 dat|25-14 re|25-15 khoe-manh|25-16 quan-trong
25-17 !tgtd|25-18 giao-vien|25-19 cau-hoi|25-20 !truutuong
'''
MAP = {}
for tok in re.split(r'[|\n]', M):
    tok = tok.strip()
    if not tok:
        continue
    k, v = tok.split(' ', 1)
    assert k not in MAP, 'trung id ' + k
    MAP[k] = v.strip()

# ghi chu cho muc da nghia / chon cach ve (khi can giai thich)
GHI_CHU = {
    '8-11': 'nghia kep cao/dat: anh ve nghia "cao"; nghia "dat" co anh rieng ten "dat" (25-13)',
    '12-18': 'nghia kep cao/dat: dung anh "cao"; anh "dat" o 25-13',
    '25-13': 'nghia kep dat/cao: bai 25 nhan manh nghia "dat" (tien)',
    '18-9': 'nghia "tam bon" (お風呂に入る) - khac anh "vao" chung',
    '24-1': 'goc nhin thu nhat: vat di ve phia NGUOI NOI (khac あげます)',
    '4-27': 'danh tu "ngay nghi" dung chung anh nghi ngoi voi 休みます',
    '20-1': 'the thong thuong cua 食べます - cung nghia nen dung lai anh "an"',
}

muc, bo, dung = [], [], {}
tong = 0
thay_id = set()
for bai in range(1, 26):
    d = json.load(open(f'{GOC}/{bai}.json', encoding='utf-8'))
    for v in d.get('vocabList', []):
        tong += 1
        ngan = v['id'].replace('voc-n5-', '')
        thay_id.add(ngan)
        assert ngan in MAP, 'thieu anh xa ' + ngan
        gt = MAP[ngan]
        if gt.startswith('!'):
            bo.append({'id': v['id'], 'word': v['word'], 'kanji': v.get('kanji', ''), 'nghia': v['meaningVi'],
                       'reason': LY_DO[gt[1:]]})
            continue
        assert gt in T, 'chua dinh nghia ten ' + gt
        loai, kho, prompt, neg = T[gt]
        o = {'id': v['id'], 'word': v['word'], 'kanji': v.get('kanji', ''), 'nghia': v['meaningVi'],
             'wordType': v.get('wordType', ''), 'ten': gt, 'prompt': prompt,
             'negative': NEG_CHUNG + (', ' + neg if neg else ''), 'loai': loai, 'kho': kho}
        if gt in dung:
            o['dungLai'] = gt
            o['dungLaiTu'] = dung[gt]
        else:
            dung[gt] = v['id']
        if ngan in GHI_CHU:
            o['ghiChu'] = GHI_CHU[ngan]
        muc.append(o)

# ---- kiem tra ----
thua = set(MAP) - thay_id
assert not thua, 'id thua trong MAP: %s' % thua
khong_dung = set(T) - set(dung)
assert not khong_dung, 'ten khong dung: %s' % khong_dung
jp = re.compile(r'[\u3040-\u30ff\u4e00-\u9fff]')
for ten, (loai, kho, p, n) in T.items():
    assert not jp.search(p), 'prompt co chu Nhat: ' + ten
    assert p.endswith('.') and p.count('. ') == 0, 'prompt khong phai 1 cau: ' + ten
    assert loai in ('vocab', 'canh', 'nhanvat') and kho in (1, 2, 3)
assert tong == len(muc) + len(bo)

anh_rieng = len(dung)
thong_ke = {
    'tongMuc': tong, 'coPrompt': len(muc), 'boQua': len(bo),
    'tiLeBoQua': round(len(bo) / tong, 3), 'anhCanTao': anh_rieng, 'mucDungLai': len(muc) - anh_rieng,
    'theoLoai': {l: sum(1 for x in T.values() if x[0] == l) for l in ('vocab', 'canh', 'nhanvat')},
    'theoKho': {str(k): sum(1 for x in T.values() if x[1] == k) for k in (1, 2, 3)},
}
out = {
    'level': 'n5',
    'model': 'Qwen-Image-2512',
    'style': STYLE,
    'negativeChung': NEG_CHUNG,
    'cachGhep': 'promptDayDu = item.prompt + " " + style ; negative cua item da gom negativeChung + phan them rieng',
    'kichThuoc': '1:1 (vd 1328x1328 hoac 1024x1024)',
    'quyUoc': [
        'Vat/nguoi can chu y (dich cua tu) to mau dat nung terracotta, phan con lai sage/kem - dung cho tu vi tri, quan he, gia dinh, bo phan co the.',
        'Moi "ten" chi tao 1 anh; muc co "dungLai" dung lai anh cua muc "dungLaiTu".',
        'Khong yeu cau chu Nhat hay bat ky chu/so nao trong anh; dong ho, tien, bien so deu de trong.',
        'kho: 1 de (vat cu the), 2 can bo cuc cu the hoac co rui ro chu/so, 3 quan he/truu tuong - nen sinh nhieu seed va duyet.',
    ],
    'thongKe': thong_ke,
    'items': muc,
    'skipped': bo,
}
with open(os.path.join(RA, 'prompt-n5.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print(json.dumps(thong_ke, ensure_ascii=False))
