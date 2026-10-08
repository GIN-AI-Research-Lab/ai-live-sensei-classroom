# sua-prompt.py (v7: style rieng cho do vat; v6: bo mat kawaii tren do vat; v5: vat khong co mat nguoi, nen co lap; v4: da tu nhien + toc, khong the/khung, khong chu hieu ung) - sua prompt: style chung, chan dung nhan vat, canh vignette, dat/re, bieu tuong manga
# Luon doc tu ban .bak (ban goc) nen chay lai bao nhieu lan cung ra cung ket qua.
import json, os, re, sys

# ---- PATHS: lam viec trong $ANH_AI_WORK/goc (mac dinh ~/anh-ai-work/goc). Can dat <ten>.json.bak = ban goc (ket qua cua builder) truoc khi chay ----
os.chdir(os.path.join(os.environ.get('ANH_AI_WORK') or os.path.join(os.path.expanduser('~'), 'anh-ai-work'), 'goc'))
FILES = ['prompt-n5.json', 'prompt-n4.json', 'prompt-n3.json', 'prompt-n2n1.json', 'prompt-canh.json']

# ---------------- 1) style chung ----------------
STYLE = ('flat minimal vector illustration of an isolated subject on a plain flat light warm cream background, soft rounded shapes, '
         'thin dark charcoal-ink outlines, gentle two-to-three tone flat shading, low detail, warm muted palette of terracotta orange-red, '
         'sage green, muted mustard gold and warm cream. A single clear centered subject with generous empty cream margin on all sides; '
         'the background is one uniform cream colour right up to all four edges of the square, with at most a small soft shadow under the subject '
         'and no backdrop shape behind it. Objects, tools, food, buildings and vehicles are inanimate and look like simple real everyday things, '
         'with nobody drawn on them unless people are described. When people appear they are simple friendly cartoon characters with natural light peach skin tone '
         '(unless another skin tone is described) and simple solid hair shapes (dark brown or black unless another hair colour is described), '
         'small solid black dot eyes and a tiny curved line mouth, no realistic facial detail; terracotta is used on clothing and objects, never on skin. '
         'No text, no letters, no numbers, no sound-effect lettering, no signs or screens with writing, no watermark, square 1:1 composition')
NEG = ('text, letters, words, numbers, digits, captions, labels, writing on signs, kanji, hiragana, katakana, latin alphabet, '
       'sound effect lettering, onomatopoeia, comic sound effects, '
       'watermark, signature, logo, photorealistic, photo, 3d render, semi-realistic, realistic skin shading, detailed realistic eyes, '
       'eyelashes, teeth, freckles, realistic nose, wrinkles, glossy plastic, harsh shadows, dark background, cool grey tones, '
       'blue-grey background, busy patterned background, cluttered scene, full-bleed background, edge-to-edge scene, multiple panels, '
       'comic panel borders, frame border, card, tile, inset panel, rounded rectangle, rounded square backdrop, white box, sticker border, picture frame, '
       'terracotta skin, orange skin, red skin, bald head, hairless head, featureless ball head, face on object, anthropomorphic object, cute face on object, kawaii face, eyes on object, smiling object, mascot object, '
       'person drawn inside an object, portrait printed on an object, backdrop shape, background tile, vignette, '
       'neon colors, oversaturated, blurry, low quality, jpeg artifacts, deformed hands, '
       'extra fingers, extra limbs, distorted face')

# ---------------- quy uoc bieu tuong (manga) ----------------
KET = ' These are simple flat cartoon icons in the same style; there are no letters, words, numbers or sound-effect lettering anywhere.'
SYM = {
    'hieu': ('hieu, biet, hieu ra', "Above the person's head floats a single bright glowing yellow lightbulb with short radiating lines, the cartoon symbol for understanding."),
    'nhan-ra': ('chot nhan ra, quen', "Above the person's head pops a single bold exclamation mark with short burst lines, the cartoon symbol for a sudden realisation; the only symbol is that one exclamation mark."),
    'khong-hieu': ('khong biet, boi roi, hieu lam', "Above the person's head floats a single large question mark, the cartoon symbol for not knowing; the only symbol is that one question mark."),
    'boi-roi': ('kho xu, gap rac roi', "A single large question mark and one big sweat drop float above the troubled person's head; the only symbol is that one question mark."),
    'kho': ('kho', "Big blue sweat drops fly off the person's head and a single large question mark floats above it, cartoon symbols for something hard; the only symbol besides the sweat drops is that one question mark."),
    'de': ('de', "Small bright sparkles and a little musical note float around the relaxed person, cartoon symbols for something easy and effortless."),
    'ban-ron': ('ban ron', "Several big blue sweat drops fly off the person's head and curved motion lines swirl around the busy hands, cartoon symbols for being very busy; a ringing phone shows only small curved vibration arcs."),
    'vat-va': ('vat va, nang nhoc', "Big blue sweat drops fly off the person's head and short strain lines surround the load, cartoon symbols for hard effort."),
    'met': ('met moi', "Vertical gloomy blue shading lines hang above the person's head and a small sigh puff drifts from the mouth, cartoon symbols for exhaustion."),
    'nong': ('nong', "A huge blazing sun with wavy heat-haze lines fills the space above and big sweat drops fly off the person, cartoon symbols for hot weather."),
    'lanh': ('lanh', "A large snowflake icon floats above and short zigzag shivering lines surround the person's body, cartoon symbols for cold."),
    'moi': ('moi, sach', "Bright four-point sparkle stars twinkle around the new clean object, the cartoon symbol for brand new and clean."),
    'cu': ('cu', "Little grey dust puffs and a small cobweb cling to the old object, symbols for old and worn."),
    'thich': ('thich, yeu', "A few small red hearts float around the person, the cartoon symbol for liking and love."),
    'ghet': ('ghet', "A small cracked broken heart and a tiny dark scribble cloud float above the person's head, symbols for dislike."),
    'buon': ('buon, dau kho', "A small grey storm cloud with rain drops hangs over the person's head, the cartoon symbol for sadness."),
    'vui': ('vui, hanh phuc, thu vi', "Small musical notes, sparkles and tiny flowers float around, cartoon symbols for joy and fun."),
    'gian': ('gian, bat man', "A red cross-shaped anger vein mark pops beside the person's head and little puffs of steam rise from it, cartoon symbols for anger."),
    'kho-chiu': ('kho chiu, bi lam phien', "A single sweat drop and a small grey scribble cloud float above the bothered person's head, symbols for annoyance."),
    'so': ('so hai', "Short zigzag shivering lines surround the person and vertical blue gloom lines fall over the face, cartoon symbols for fear."),
    'lo': ('lo lang, trang tro', "A tangled scribble cloud floats above the person's head with one sweat drop on the brow, cartoon symbols for worry."),
    'nghi': ('nghi, nho lai', "The idea is shown inside a round thought bubble made of small circles rising from the person's head, as a simple picture."),
    'tot': ('tot, tuyet', "A big thumbs-up and bright sparkle stars make the good judgement obvious."),
    'xau': ('xau, te', "A thumbs-down and a tiny dark scribble cloud make the bad judgement obvious."),
    'to': ('to lon', "The two are drawn side by side for an obvious size contrast, the big one highlighted in terracotta with a bold upward arrow beside it."),
    'nho': ('nho be', "The tiny subject sits next to a familiar object for an obvious size contrast, with a small downward arrow pointing at it."),
    'cao': ('cao', "A bold upward arrow beside the tall subject stresses its height."),
    'dai': ('dai', "A simple double-headed arrow along the long object stresses its length."),
    'nang': ('nang', "Heavy downward pressure lines press on the load and big sweat drops fly off the person, symbols for heavy weight."),
    'ngon': ('ngon', "Small hearts and sparkles float around the food and a rosy blush glows on the cheeks, cartoon symbols for delicious."),
    'dang': ('dang (vi)', "Wavy queasy lines rise from the cup and the face turns slightly green, cartoon symbols for a bitter taste."),
    'tiec': ('tiec, that vong', "Vertical gloomy blue lines hang over the person and a small sigh puff drifts from the mouth, cartoon symbols for disappointment."),
    'ranh': ('ranh, chan', "A thought bubble above the head shows only a plain clock face with no numbers, and a small sigh puff drifts from the mouth, symbols for having nothing to do."),
    'buon-ngu': ('buon ngu', "A small crescent moon with two tiny stars floats above the person's drooping head, the cartoon symbol for sleepiness."),
    'nguy-hiem': ('nguy hiem', "A plain yellow warning triangle containing a single exclamation mark floats nearby; the only symbol is that one exclamation mark."),
    'an-toan': ('an toan', "A small round sage-green shield icon with a sparkle floats nearby, the symbol for safety."),
    'tien-loi': ('tien loi', "Bright sparkles and a thumbs-up make it obvious that this is handy and convenient."),
    'bat-tien': ('bat tien', "Big sweat drops fly off the person and a long dotted path line shows the tiring distance, symbols for inconvenience."),
    'noi-tieng': ('noi tieng', "Star-shaped sparkles and camera-flash bursts surround the person, symbols for fame."),
    'gioi': ('gioi', "Sparkle stars and a small gold star badge shine around the person's work, symbols for being skilled."),
    'kem': ('kem, vung', "A single sweat drop on the brow and wobbly shaky lines around the result, symbols for being unskilled."),
    'dep': ('dep, hoan hao', "Soft sparkle stars twinkle around the subject, the cartoon symbol for beautiful and perfect."),
    'muon': ('muon co', "A round thought bubble from the person's head shows the wanted object with a small heart, the symbol for wanting it."),
    'quan-trong': ('quan trong, quy', "A soft glow and a small heart shine around the treasured object, symbols for something precious."),
    'on': ('on, khong sao', "A few small sparkles around the smiling person show that everything is fine."),
    'tu-tin': ('tu tin', "Sparkle stars and a small bright starburst shine around the person, symbols for confidence."),
    'ngac-nhien': ('ngac nhien', "A single bold exclamation mark with burst lines pops above the person's head, the cartoon symbol for surprise; the only symbol is that one exclamation mark."),
    'tinh-co': ('tinh co', "A single exclamation mark pops above each of the two heads, the cartoon symbol for a surprise meeting; the only symbols are those exclamation marks."),
    'xau-ho': ('xau ho', "Pink blush lines cover the cheeks and one sweat drop slides down the head, cartoon symbols for embarrassment."),
    'tin': ('tin tuong', "A small warm heart floats between the two people, the symbol for trust."),
    'nghi-ngo': ('nghi ngo', "A single question mark floats above the suspicious person's head; the only symbol is that one question mark."),
    'biet-on': ('biet on, tot bung', "Small hearts and tiny flowers float between them, symbols for gratitude and kindness."),
    'cam-dong': ('cam dong', "Small hearts and sparkles float around the teary person, symbols for being deeply moved."),
    'thau-hieu': ('thau hieu', "A small warm heart and a soft glowing lightbulb float between them, symbols for understanding someone's feelings."),
    'ghen': ('ghen ti', "A thought bubble from the envious person shows the thing they want, with a small green scribble cloud above the head."),
    'cay-cu': ('cay cu', "A small dark storm cloud hangs over the person's head and a red anger vein mark pops beside it, symbols for bitter frustration."),
    'ngheo': ('ngheo', "A thought bubble shows an empty wallet with a small moth flying out of it, the symbol for having no money."),
    'xuat-sac': ('xuat sac', "Gold star sparkles shine around the person, the symbol for excellence."),
    'manh': ('manh', "Bold power lines and a small starburst radiate around the person, symbols for strength."),
    'vo-le': ('vo le', "A red anger vein mark pops beside the offended person's head, the cartoon symbol for being offended by rudeness."),
    'co-chap': ('co chap', "Little puffs of steam and a red anger vein mark pop above the stubborn person's head."),
    'can-than': ('can than, ti mi', "A single sweat drop and short focus lines around the careful hands show careful concentration."),
    'nghiem': ('nghiem tuc', "Short focus lines around the person's head show serious concentration."),
    'bi-tham': ('bi tham', "A dark grey storm cloud with rain hangs overhead, the cartoon symbol for tragedy and sadness."),
    'tao-bao': ('tao bao', "Bold speed lines and a small starburst trail the leaping person, symbols for daring."),
    'cam-chiu': ('danh chiu', "A small grey rain cloud and a sigh puff hang over the resigned person."),
    'dang-tin': ('dang tin cay', "A small sage-green shield icon glows above the reliable person, the symbol for someone to rely on."),
    'tre': ('tre, nang dong', "Bright sparkles and bouncy motion lines surround the young energetic person, symbols for youth and energy."),
    'giong': ('giong nhau', "A small matching sparkle above each one and a dotted line linking them stress that they are identical."),
    'khoe': ('khoe manh', "Sparkles and a small red heart float around the person, symbols for health."),
    'yen-tinh': ('yen tinh', "Soft still air with a single small floating feather shows complete silence, with no sound lines."),
}

# ---------------- dat / re viet lai ----------------
DAT_P = ('Only one person in the picture: a single shopper in front of a shop counter recoils backwards in shock with both hands raised '
         'and wide eyes, a single bold exclamation mark popping above the head. On the counter sits one small gold luxury wristwatch on a '
         'velvet cushion with an enormous blank price tag hanging from it, the empty tag far bigger than the watch. A round thought bubble '
         'from the shopper\'s head shows a towering pile of banknotes and gold coins, meaning it costs a huge amount. The only symbol is that '
         'one exclamation mark; the price tag, banknotes and coins carry no numbers, letters or words.')
DAT_N = 'second person, two people, shop assistant, seller, numbers on price tag, currency symbols, digits'
RE_P = ('Only one person in the picture: a single happy shopper at a market stall holds a big overflowing bag of fresh vegetables in one arm '
        'and with the other hand hands over one single tiny coin, beaming with a relaxed smile. A tiny blank price tag hangs on the bag. '
        'A round thought bubble from the shopper\'s head shows one small coin with sparkles and a thumbs-up, meaning it costs almost nothing. '
        'No seller is visible; there are no numbers, letters or words anywhere.')
RE_N = 'second person, two people, seller, shopkeeper, numbers on price tag, currency symbols, digits'
VIET_LAI = {'dat': (DAT_P, DAT_N), 're': (RE_P, RE_N), 'cheap': (RE_P, RE_N)}

# ten -> khai niem, theo tep
MAP = {
    'prompt-n5.json': dict(**{'to-lon': 'to', 'nho-be': 'nho', 'moi': 'moi', 'cu': 'cu', 'tot': 'tot', 'xau-te': 'xau', 'nong': 'nong',
        'lanh': 'lanh', 'kho': 'kho', 'de': 'de', 'cao': 'cao', 'thu-vi': 'vui', 'vui-ve': 'vui', 'ban-ron': 'ban-ron', 'ngon': 'ngon',
        'dep-sach': 'moi', 'khoe-manh': 'khoe', 'yen-tinh': 'yen-tinh', 'noi-tieng': 'noi-tieng', 'tien-loi': 'tien-loi', 'thich': 'thich',
        'rat-thich': 'thich', 'ghet': 'ghet', 'gioi': 'gioi', 'kem': 'kem', 'muon-co': 'muon', 'biet': 'hieu', 'on-khong-sao': 'on',
        'vui-ve-coi-mo': 'vui', 'tot-bung': 'biet-on', 'diu-dang': 'biet-on', 'quen': 'nhan-ra', 'lo-lang': 'lo', 'nghi-rang': 'nghi',
        'suy-nghi': 'nghi', 'quan-trong': 'quan-trong', 'vat-va': 'vat-va', 'ranh-roi': 'ranh', 'nang': 'nang', 'met-moi': 'met'}),
    'prompt-n4.json': {'its-okay': 'on', 'disappointing': 'tiec', 'beautiful': 'dep', 'recall': 'nghi', 'think': 'nghi', 'health': 'khoe',
        'dangerous': 'nguy-hiem', 'worry': 'lo', 'watch-out': 'nguy-hiem', 'inconvenient': 'bat-tien', 'convenient': 'tien-loi',
        'quiet': 'yen-tinh', 'forget': 'nhan-ra', 'serious-diligent': 'nghiem', 'skillful': 'gioi', 'cried-on': 'kho-chiu',
        'surprise-people': 'ngac-nhien', 'famous': 'noi-tieng', 'in-trouble': 'boi-roi', 'tough-hard': 'vat-va', 'grateful': 'biet-on',
        'cry': 'buon', 'tired': 'met', 'sleepy': 'buon-ngu', 'delicious': 'ngon', 'bitter': 'dang', 'fun': 'vui', 'busy': 'ban-ron',
        'energetic': 'tre', 'kind': 'biet-on', 'tall': 'cao', 'big': 'to', 'difficult': 'kho', 'happy': 'vui', 'dont-understand': 'khong-hieu'},
    'prompt-n3.json': {'trust': 'tin', 'misunderstand': 'khong-hieu', 'mistaken-identity': 'nhan-ra', 'knowledgeable': 'hieu', 'bad-at': 'kem',
        'coincidence': 'tinh-co', 'good-at': 'gioi', 'regret-pity': 'tiec', 'health': 'khoe', 'forget': 'nhan-ra', 'hard-tough': 'vat-va',
        'convenient': 'tien-loi', 'inconvenient': 'bat-tien', 'young': 'tre', 'new': 'moi', 'busy': 'ban-ron', 'fatigue': 'met',
        'bored': 'ranh', 'poor': 'ngheo', 'excellent': 'xuat-sac', 'envy': 'ghen', 'frustrated-loss': 'cay-cu', 'painful-hardship': 'buon',
        'frightening': 'so', 'moved': 'cam-dong', 'worry': 'lo', 'hot': 'nong', 'understand': 'hieu', 'danger': 'nguy-hiem',
        'safe': 'an-toan', 'bad': 'xau', 'skilful': 'gioi', 'tall-high': 'cao', 'good': 'tot', 'nuisance': 'kho-chiu', 'think': 'nghi',
        'reflect': 'tiec', 'confidence': 'tu-tin', 'discontent': 'gian', 'anxiety': 'lo'},
    'prompt-n2n1.json': {'danh-chiu': 'cam-chiu', 'ban-ron': 'ban-ron', 'dang-tin-cay': 'dang-tin', 'nguy-cap': 'nguy-hiem', 'hiem-tro': 'vat-va',
        'nguy-hiem': 'nguy-hiem', 'manh': 'manh', 'gioi': 'gioi', 'cao': 'cao', 'dai': 'dai', 'vo-le': 'vo-le', 'tao-bao': 'tao-bao',
        'bi-tham': 'bi-tham', 'that-le': 'vo-le', 'dang-tiec': 'tiec', 'dep': 'dep', 'hoan-hao': 'dep', 'tuyet-voi': 'tot', 'ngheo': 'ngheo',
        'giong-nhau': 'giong', 'nghiem-trong': 'nguy-hiem', 'nghiem-tuc': 'nghiem', 'xau': 'xau', 'co-chap': 'co-chap', 'ti-mi': 'can-than',
        'than-trong': 'can-than', 'hieu': 'hieu', 'lo-lang': 'lo', 'tu-tin': 'tu-tin', 'quen': 'khong-hieu', 'suy-nghi': 'nghi',
        'tran-tro': 'lo', 'met-moi': 'met', 'thau-hieu': 'thau-hieu', 'ngac-nhien': 'ngac-nhien', 'noi-buon': 'buon', 'gian-du': 'gian',
        'niem-vui': 'vui', 'nghi-ngo': 'nghi-ngo', 'biet-on': 'biet-on', 'yeu': 'thich', 'hanh-phuc': 'vui', 'dong-tinh-hieu-ra': 'hieu',
        'cam-dong': 'cam-dong', 'xau-ho': 'xau-ho', 'tin-tuong': 'tin', 'kho-tam': 'vat-va'},
    'prompt-canh.json': {},
}

# ---------------- chan dung nhan vat (prompt-canh) ----------------
NV = {
    'nv-santos': ('a friendly Brazilian man in his early thirties with curly dark-brown hair, warm tan skin and a short trimmed beard, wearing a terracotta-orange jacket over a cream shirt', 'smile'),
    'nv-wang': ('a young Chinese man in his early twenties with straight black hair, a neat fringe and round glasses, wearing a sage-green hoodie, looking curious', 'smile'),
    'nv-tanaka': ('a Japanese woman in her early thirties with a short straight black bob, wearing a deep-teal cardigan over a white blouse, calm and attentive', 'smile'),
    'nv-yamada': ('a Japanese man in his mid-forties with short neat black hair, a kind face and a mature grown-up look, wearing a navy-blue suit, white shirt and simple tie, polite', 'smile'),
    'nv-miller': ('a cheerful American man in his early thirties with short sandy-blond hair, wearing a mustard-yellow sweater over a collared shirt', 'smile'),
    'nv-sato': ('a Japanese woman around thirty with black hair tied in a low ponytail, wearing a soft sky-blue blouse and a small ID lanyard with a blank card, gentle and polite', 'smile'),
    'nv-gupta': ('an Indian man in his mid-thirties with short black hair, warm brown skin and a neat moustache, wearing a burgundy button shirt, relaxed and friendly', 'smile'),
    'nv-karina': ('a young Indonesian woman around twenty wearing a soft lavender hijab and a cream long-sleeved top, bright and cheerful', 'smile'),
    'nv-maria': ('a Brazilian woman around thirty with long wavy dark-brown hair and warm tan skin, wearing a coral-pink dress with a small shoulder bag strap', 'smile'),
    'nv-yamamoto': ('a thoughtful Japanese man in his mid-fifties with short grey hair and rectangular glasses, wearing a slate-grey suit, composed', 'flat'),
    'nv-suzuki': ('a kind elderly Japanese male teacher in his sixties with neat white hair, wearing an olive-green jacket over a cream sweater, warm and fatherly', 'smile'),
    'nv-sensei': ('a tall Japanese male teacher in his forties with short black hair, wearing a camel-brown cardigan over a light shirt, kind and encouraging', 'smile'),
    'nv-tenin': ('a young Japanese female shop clerk in her mid-twenties with black hair in a neat bun, wearing a forest-green apron over a white blouse, bowing slightly and welcoming', 'smile'),
    'nv-uketsuke': ('a Japanese female receptionist in her late twenties with shoulder-length black hair, wearing a dusty-rose uniform jacket and a small neck scarf', 'smile'),
    'nv-shacho': ('a dignified Japanese company president in his sixties with swept-back silver hair, wearing a black suit and a crimson tie', 'flat'),
    'nv-kyoju': ('a white-haired Japanese professor in his sixties with round spectacles, wearing a charcoal cardigan and a muted-gold bow tie, wise and gentle', 'smile'),
    'nv-senshu': ('a young Japanese athlete around twenty with short black hair, wearing a white-and-cobalt-blue track uniform, determined and bright', 'smile'),
}
MIENG = {'smile': 'a small curved line smile with the mouth closed', 'flat': 'a small calm short line mouth'}
NV_T = ('Head-and-shoulders bust of {d}, drawn as a simple flat cartoon character exactly like the vocabulary pictures: '
        'natural skin colour (light peach unless another skin tone is described), a full simple solid hair shape covering the top of the head, '
        'two small solid black dot eyes, {m}, no teeth, no freckles, no wrinkles, only a tiny simple nose or none, '
        'flat even skin colour with no skin shading. Only one person, facing front with a slight turn, '
        'drawn directly on the plain cream background, which stays completely empty and uniform right up to all four edges of the image.')
NV_NEG = 'multiple people, card, tile, frame, rounded square backdrop, portrait frame, bald head, terracotta skin, orange skin, busy background, props, full-body scene, cropped face, realistic face, detailed eyes, eyelashes, teeth, open mouth, freckles, wrinkles, skin texture, realistic nose, anime'

CANH_T = (' Draw the scene small and compact in the middle: the characters and only a few simple props of the setting standing on a small '
          'soft patch of floor, drawn directly on the plain flat light warm cream background, which stays completely empty and uniform around the scene '
          'right up to all four edges of the image; the setting does not fill the image and nothing encloses it. Warm sunny tones of terracotta, sage and muted gold on clothing and props, no cool grey or blue-grey backdrop. '
          'Only the characters described appear, no crowd and no extra background people, all drawn as simple flat cartoon characters with natural skin tones, solid hair shapes and dot eyes.')
CANH_NEG = 'tile, framed window view, rounded square backdrop, crowd, background people, extra people, full-bleed background, edge-to-edge scene, card, rounded rectangle, framed picture, cool grey tones, blue-grey backdrop'
# bo dam dong trong canh
DAM_DONG = [
    (', colleagues gathering in a glass meeting room behind him', ''),
    (', other students around them also in everyday clothes rather than uniforms', ', both in everyday clothes rather than uniforms'),
    (' and a few students, the screen', ', the screen'),
    (' and guests raise their glasses', ' and raises a glass'),
    (', people of different ages and backgrounds waiting in a line behind', ''),
    (' and teammates and family cheer behind', ''),
    (' and the audience applauds', ''),
]
TUOI = [('American man in his late twenties', 'American man in his early thirties'),
        ('Japanese man in his late thirties', 'Japanese man in his mid-forties'),
        (' and light freckles', '')]


# style rieng cho muc chi co do vat / canh vat (prompt khong nhac toi nguoi hay con vat): KHONG mo ta mat cham/mieng
# (mo ta mat trong style chung lam model ve mat kawaii len do vat). gen.py dung styleVat khi item co "vat": true.
STYLE_VAT = ('flat minimal vector illustration of an isolated inanimate object on a plain flat light warm cream background, drawn like a clean simple '
             'product icon, soft rounded shapes, thin dark charcoal-ink outlines, gentle two-to-three tone flat shading, low detail, warm muted palette '
             'of terracotta orange-red, sage green, muted mustard gold and warm cream. A single clear centered subject with generous empty cream margin '
             'on all sides; the background is one uniform cream colour right up to all four edges of the square, with at most a small soft shadow under '
             'the subject and no backdrop shape behind it. The objects are lifeless everyday things exactly as they look in real life, without any '
             'decoration that looks like a character. No people and no animals. No text, no letters, no numbers, no signs or screens with writing, '
             'no watermark, square 1:1 composition')
NEG_VAT = 'cute face, kawaii, eyes, smiling mouth, cheeks, blush, character, mascot, anthropomorphic, face on object, person, people'
NGUOI = re.compile(r"\b(person|persons|people|man|men|woman|women|boy|boys|girl|girls|child|children|kid|kids|student|students|pupil|teacher|worker|workers|friend|friends|families|family(?! car)|mother|father|mom|dad|baby|someone|somebody|customer|customers|doctor|nurse|he|she|his|her|him|leg|legs|foot|feet|toe|toes|arm|arms|finger|fingers|ear|ears|eye|eyes|mouth|nose|lips|body|skin|shoulder|shoulders|knee|knees|belly|anchor|presenter|announcer|newscaster|hand|hands|couple|clerk|staff|shopper|traveler|traveller|tourist|tourists|audience|crowd|player|players|employee|employees|guest|guests|chef|cook|driver|passenger|passengers|character|figure|figures|head|face|faces|owner|seller|colleague|colleagues|boss|parent|parents|grandmother|grandfather|grandma|grandpa|brother|sister|son|daughter|husband|wife|athlete|runner|speaker(?! grille)|speakers|commuters|pedestrians|businessman|businessperson|salaryman|officer|police|policeman|farmer|artist|musician|singer|dancer|pilot|soldier|patient|elderly|adult|adults|teen|teenager|youth|human|humans|volunteer|volunteers|members|member|team|class|classmates|visitor|visitors|lady|gentleman|foreigner|mascot|lawyer|engineer|inspector|researcher|scientist|receptionist|teller|waiter|waitress|vendor|cashier|reporter|journalist|writer|author|designer|manager|president|professor|learner|applicant|candidate|judge|politician|mayor|minister|citizen|citizens|resident|residents|neighbor|neighbour|partner|fan|fans|spectators|viewer|viewers|reader|user|users|attendant|assistant|secretary|guide|mechanic|carpenter|barber|hairdresser|dentist|pharmacist|firefighter|astronaut|photographer|painter|programmer|accountant|banker|merchant|trader|shopkeeper|craftsman|artisan|monk|priest|bride|groom|king|queen|leader|chairman|director|executive|staffer|coworker|coworkers|runners|swimmer|climber|hiker|chefs|cooks|clerks|doctors|nurses|teachers|workers|someone|anyone|everyone|nobody|cat|cats|dog|dogs|bird|birds|animal|animals|fish|panda|monkey|rabbit|bear|horse|cow|pig|puppy|kitten|insect|butterfly|elephant|lion|tiger|mouse|frog|duck|chicken|owl|penguin|deer|fox)\b", re.I)

# ---------------- sua rieng tung muc (v4) ----------------
# bo phan co the: to mau terracotta len da -> doi thanh vien/mui ten terracotta, da giu mau tu nhien
BO_PHAN = re.compile(r'(highlighted|outlined) in terracotta')
BO_PHAN_TEN = {'prompt-n5.json': {'khuon-mat', 'mat', 'tai', 'mieng', 'chan', 'dau'}, 'prompt-n3.json': {'head'}}
BO_PHAN_THAY = 'marked by a bold terracotta outline glow and a small terracotta arrow pointing at it, while the skin itself stays natural light peach'
SUA_RIENG = {
    ('prompt-n5.json', 'kho'): ('in front of a huge tangled maze puzzle', 'in front of a tangled maze of loose floating winding paths with no outer border'),
}


def doi(s, cap):
    for a, b in cap:
        s = s.replace(a, b)
    return s


dem = {}
for f in FILES:
    d = json.load(open(f + '.bak', encoding='utf-8'))
    c = dem.setdefault(f, {'bieuTuong': 0, 'bieuTuongTen': set(), 'datRe': 0, 'nhanvat': 0, 'canh': 0})
    d['styleCu'] = d.get('style')
    d['style'] = STYLE
    d['styleRef'] = 'style-chung.json'
    d['cachGhepMoi'] = 'gen.py doc styleRef: prompt = item.prompt + " " + style-chung.style ; negative = hop (khong trung) cua style-chung.negativeBase + item.negative'
    m = MAP[f]
    for x in d['items']:
        t = x['ten']
        if t in VIET_LAI:
            x['promptCu'] = x['prompt']
            x['prompt'], neg = VIET_LAI[t]
            x['negative'] = (x.get('negative', '') + ', ' + neg).strip(', ')
            x['bieuTuong'] = 'dat' if t == 'dat' else 're'
            c['datRe'] += 1
        elif t in m:
            k = m[t]
            x['promptCu'] = x['prompt']
            x['prompt'] = x['prompt'].rstrip() + ' ' + SYM[k][1] + KET
            x['bieuTuong'] = k
            c['bieuTuong'] += 1
            c['bieuTuongTen'].add(t)
        if t in BO_PHAN_TEN.get(f, ()) and BO_PHAN.search(x['prompt']):
            x.setdefault('promptCu', x['prompt'])
            x['prompt'] = BO_PHAN.sub(BO_PHAN_THAY, x['prompt'])
        if (f, t) in SUA_RIENG:
            a_, b_ = SUA_RIENG[(f, t)]
            assert a_ in x['prompt'], (f, t)
            x.setdefault('promptCu', x['prompt'])
            x['prompt'] = x['prompt'].replace(a_, b_)
        if f != 'prompt-canh.json' and not NGUOI.search(x['prompt']):
            x['vat'] = True
            c['vat'] = c.get('vat', 0) + 1
        if f == 'prompt-canh.json':
            if x['loai'] == 'nhanvat':
                dsc, mi = NV[t]
                x['promptCu'] = x['prompt']
                x['prompt'] = NV_T.format(d=dsc, m=MIENG[mi])
                if 'hijab' in dsc:
                    x['prompt'] = x['prompt'].replace('a full simple solid hair shape covering the top of the head', 'the hijab neatly covering the hair')
                x['negative'] = NV_NEG
                c['nhanvat'] += 1
            elif x['loai'] == 'canh':
                x['promptCu'] = x['prompt']
                x['prompt'] = doi(doi(x['prompt'], DAM_DONG), TUOI).rstrip() + CANH_T
                ng = x.get('negative', '')
                x['negative'] = CANH_NEG if (not ng or ng == 'none extra') else ng + ', ' + CANH_NEG
                c['canh'] += 1
            if x.get('moTaTrongCanh'):
                x['moTaTrongCanh'] = doi(x['moTaTrongCanh'], TUOI)
    # kiem tra: moi ten trong MAP phai ton tai
    thieu = [t for t in m if t not in set(x['ten'] for x in d['items'])]
    if thieu:
        print('THIEU', f, thieu); sys.exit(1)
    with open(f, 'w', encoding='utf-8', newline='\n') as w:
        json.dump(d, w, ensure_ascii=False, indent=1)

json.dump({
    'ghiChu': 'Style + negative chung cho moi tep prompt (styleRef). Khong dat ma hex trong prompt. Nen se duoc lam phang ve #f0ebe1 bang vm/lam-nen.py sau khi sinh.',
    'style': STYLE,
    'negativeBase': NEG,
    'styleVat': STYLE_VAT,
    'negativeVat': NEG_VAT,
    'mauNenSauXuLy': '#f0ebe1',
    'quyUocBieuTuong': {
        'moTa': ('Tu chi trang thai / cam xuc / danh gia / so sanh (tinh tu, dong tu cam xuc va nhan thuc) phai co 1 BIEU TUONG manga de hoc vien doc ngay: '
                 'bong suy nghi chua y tuong, "?" khi khong biet, "!" khi chot nhan ra, bong den khi hieu, giot mo hoi khi kho/ban, '
                 'mat troi + song nhiet khi nong, bong tuyet + vach run khi lanh, lap lanh khi moi/sach, bui + mang nhen khi cu, '
                 'tim khi thich, may mua khi buon, dao cu tuong phan (the gia to/nho khong so), mui ten len/xuong khi can. '
                 'Cho phep dau "?" va "!" (la bieu tuong, khong phai chu) nhung ghi ro trong prompt duong: "the only symbol is a single question mark". '
                 'Van cam chu cai, chu so, tu ngu.'),
        'cauKet': KET.strip(),
        'bieuTuong': {k: {'khaiNiem': v[0], 'en': v[1]} for k, v in SYM.items()},
        'datRe': {'dat': DAT_P, 're': RE_P},
    },
    'nhanVat': {'mau': NV_T, 'negative': NV_NEG},
    'canh': {'hauTo': CANH_T.strip(), 'negative': CANH_NEG},
}, open('style-chung.json', 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)

for f, c in dem.items():
    print('%-18s bieuTuong: %d muc (%d ten)  datRe: %d  nhanvat: %d  canh: %d  vat: %d' % (f, c['bieuTuong'], len(c['bieuTuongTen']), c['datRe'], c['nhanvat'], c['canh'], c.get('vat', 0)))
