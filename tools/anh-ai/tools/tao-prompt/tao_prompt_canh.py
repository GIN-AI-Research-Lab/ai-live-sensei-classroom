# Tao prompt-canh.json: 1 canh mo dau / bai co hoi thoai (100 bai) + bang nhan vat
# Nguon su that: curriculum/{lv}/{N}.json -> dialogue[] (doc truc tiep de kiem tra so bai, nguoi noi)
import json, glob, os, re, collections

# ---- PATHS (sua o day neu doi cho dat) ----
# REPO = goc repo ai-live-sensei-classroom (mac dinh: 4 cap tren tools/anh-ai/tools/tao-prompt/; doi bang SENSEI_REPO)
# RA   = noi ghi tep prompt moi tao (mac dinh: $ANH_AI_WORK/goc, KHONG ghi de len prompts/ da luu tru)
import os as _os
_QH = _os.path.dirname(_os.path.abspath(__file__))
REPO = _os.environ.get('SENSEI_REPO') or _os.path.abspath(_os.path.join(_QH, '..', '..', '..', '..'))
WORK = _os.environ.get('ANH_AI_WORK') or _os.path.join(_os.path.expanduser('~'), 'anh-ai-work')
RA_DIR = _os.path.join(WORK, 'goc'); _os.makedirs(RA_DIR, exist_ok=True)
# ---- het PATHS ----
GOC = os.path.join(REPO, "curriculum")
RA = os.path.join(RA_DIR, "prompt-canh.json")

STYLE = ("flat minimal vector illustration, soft rounded shapes, warm muted palette of terracotta orange, "
         "sage green, muted mustard gold and warm cream, thin deep charcoal-brown ink outlines, gentle two-to-three "
         "tone shading, plain light warm-cream paper background, single clear focal composition, friendly simple "
         "character faces, consistent storybook style, square 1:1 composition, no text, no letters, "
         "no numbers, no watermark")

NEG_BASE = ("text, letters, words, numbers, digits, kanji, hiragana, captions, speech bubbles with writing, readable signs, "
            "logos, watermark, signature, photorealistic, 3d render, anime cel shading, harsh shadows, neon colours, "
            "dark gloomy palette, busy cluttered background, extra fingers, deformed hands, distorted faces, extra limbs, "
            "cropped heads, blurry")

# ---- Bang nhan vat: mo ta ngan dung lai trong prompt canh (giu nhat quan) ----
# key: (id, ten, ten goc tieng Nhat, mo ta chen vao canh, prompt chan dung, cac bien the ten trong du lieu)
NV = collections.OrderedDict()
def nv(key, goc, mota, chandung, bien=()):
    NV[key] = dict(goc=goc, mota=mota, chandung=chandung, bien=list(bien))

nv("santos", "サントス", "a Brazilian man in his early thirties with curly dark-brown hair, warm tan skin and a short beard wearing a terracotta jacket",
   "Half-body character portrait of a friendly Brazilian man in his early thirties with curly dark-brown hair, warm tan skin and a short trimmed beard, wearing a terracotta-orange jacket over a cream shirt, smiling warmly in three-quarter view.")
nv("wang", "ワン", "a young Chinese man in his early twenties with straight black hair, a fringe and round glasses wearing a sage-green hoodie",
   "Half-body character portrait of a young Chinese man in his early twenties with straight black hair, a neat fringe and round glasses, wearing a sage-green hoodie, with a curious gentle smile in three-quarter view.")
nv("tanaka", "田中", "a Japanese woman in her early thirties with a short black bob wearing a deep-teal cardigan",
   "Half-body character portrait of a Japanese woman in her early thirties with a short straight black bob, wearing a deep-teal cardigan over a white blouse, with a calm attentive smile in three-quarter view.")
nv("yamada", "山田", "a Japanese man in his late thirties with short neat black hair wearing a navy-blue suit",
   "Half-body character portrait of a Japanese man in his late thirties with short neat black hair and a kind face, wearing a navy-blue suit, white shirt and simple tie, with a polite smile in three-quarter view.",
   bien=("山田一郎", "山田 (Yamada)"))
nv("miller", "ミラー", "a sandy-haired American man in his late twenties wearing a mustard-yellow sweater",
   "Half-body character portrait of a cheerful American man in his late twenties with short sandy-blond hair and light freckles, wearing a mustard-yellow sweater over a collared shirt, smiling in three-quarter view.",
   bien=("ミラー (Miller)",))
nv("sato", "佐藤", "a Japanese woman around thirty with black hair in a low ponytail wearing a sky-blue blouse",
   "Half-body character portrait of a Japanese woman around thirty with black hair tied in a low ponytail, wearing a soft sky-blue blouse and a small ID lanyard, with a gentle polite smile in three-quarter view.",
   bien=("佐藤 (Satou)",))
nv("gupta", "グプタ", "an Indian man in his mid-thirties with short black hair and a neat moustache wearing a burgundy shirt",
   "Half-body character portrait of an Indian man in his mid-thirties with short black hair, warm brown skin and a neat moustache, wearing a burgundy button shirt, with a relaxed friendly smile in three-quarter view.")
nv("karina", "カリナ", "a young Indonesian woman around twenty in a lavender hijab",
   "Half-body character portrait of a young Indonesian woman around twenty wearing a soft lavender hijab and a cream long-sleeved top, with a bright cheerful smile in three-quarter view.")
nv("maria", "マリア", "a Brazilian woman around thirty with long wavy dark-brown hair wearing a coral dress",
   "Half-body character portrait of a Brazilian woman around thirty with long wavy dark-brown hair and warm tan skin, wearing a coral-pink dress and a small shoulder bag, smiling warmly in three-quarter view.")
nv("yamamoto", "山本", "a grey-haired Japanese man in his mid-fifties with rectangular glasses wearing a slate-grey suit",
   "Half-body character portrait of a thoughtful Japanese man in his mid-fifties with short grey hair and rectangular glasses, wearing a slate-grey suit, with a serious composed expression in three-quarter view.")
nv("suzuki", "鈴木", "an elderly white-haired Japanese teacher in an olive-green jacket",
   "Half-body character portrait of a kind elderly Japanese male teacher in his sixties with neat white hair and soft wrinkles, wearing an olive-green jacket over a cream sweater, with a warm fatherly smile in three-quarter view.")
nv("sensei", "先生", "a tall Japanese male teacher in his forties with big friendly eyes wearing a camel-brown cardigan",
   "Half-body character portrait of a tall Japanese male teacher in his forties with short black hair and big friendly eyes, wearing a camel-brown cardigan over a light shirt, with a kind encouraging smile in three-quarter view.")
nv("tenin", "店員", "a young female shop clerk in a forest-green apron over a white blouse",
   "Half-body character portrait of a young Japanese female shop clerk in her mid-twenties with black hair in a neat bun, wearing a forest-green apron over a white blouse, bowing slightly with a welcoming smile.")
nv("uketsuke", "受付", "a receptionist in a dusty-rose uniform jacket with a small neck scarf",
   "Half-body character portrait of a Japanese female receptionist in her late twenties with shoulder-length black hair, wearing a dusty-rose uniform jacket and a small neck scarf, with a polite service smile in three-quarter view.")
nv("shacho", "社長", "a silver-haired Japanese company president in his sixties wearing a black suit with a crimson tie",
   "Half-body character portrait of a dignified Japanese company president in his sixties with swept-back silver hair, wearing a black suit and a crimson tie, with a composed serious expression in three-quarter view.")
nv("kyoju", "教授", "a white-haired professor in his sixties with round spectacles wearing a charcoal cardigan and a gold bow tie",
   "Half-body character portrait of a white-haired Japanese professor in his sixties with round spectacles, wearing a charcoal cardigan and a muted-gold bow tie, with a wise gentle expression in three-quarter view.")
nv("senshu", "選手", "a young athlete with short black hair in a white-and-cobalt track uniform",
   "Half-body character portrait of a young Japanese athlete around twenty with short black hair and an energetic look, wearing a white-and-cobalt-blue track uniform, with a determined bright smile in three-quarter view.")

# Vai chi xuat hien 1 bai: khong can chan dung rieng, mo ta truc tiep trong prompt canh
VAI_LE = {"医者": "n5-17", "秘書": "n4-49", "上司": "n4-39", "コーチ": "n4-33", "通行人": "n5-24",
          "弁護士": "n1-11", "評論家": "n1-13", "学生": "n1-14", "司会": "n1-15", "記者": "n1-9"}

# Santos o N2/N1 la giam doc: giu toc/rau + mau terracotta nhung mac vest
SANTOS_EXEC = "a Brazilian man with curly dark-brown hair and a short beard wearing a dark suit and a terracotta tie"
TANAKA_HAKAMA = "a Japanese woman with a short black bob in a deep-teal graduation hakama"

def M(k):
    return NV[k]["mota"]

# ---- Canh: (bai, ten slug, prompt co {santos} ..., kho, negative rieng, tom tat VN, dungLai) ----
C = []
def canh(bai, slug, prompt, kho, neg="", tomtat="", dungLai=None):
    C.append(dict(bai=bai, slug=slug, prompt=prompt, kho=kho, neg=neg, tomtat=tomtat, dungLai=dungLai))

F = dict((k, v["mota"]) for k, v in NV.items())
F["santos_exec"] = SANTOS_EXEC
F["tanaka_hakama"] = TANAKA_HAKAMA

# ================= N5 =================
canh("n5-1", "gioi-thieu-dong-nghiep-moi", "In a bright Japanese office, {yamada} introduces {miller}, who bows politely to {sato}, all three smiling at their first meeting.", 2,
     "name tags with writing, business cards with text", "Gioi thieu ban than o cong ty, lan dau gap mat")
canh("n5-2", "tang-qua-hang-xom", "At the doorway of a Japanese apartment, {santos} offers a small wrapped gift bag of coffee to {yamada}, who looks delighted and holds a briefcase, with a small car parked behind.", 2,
     "brand labels", "Chao hang xom moi, tang qua ca phe Brazil, cai cap, chiec xe")
canh("n5-3", "mua-ruou-vang-bach-hoa", "In a department-store wine corner, {tenin} presents a bottle of red wine to {maria}, shelves of wine bottles and an escalator in the soft background.", 2,
     "price tags, bottle labels with writing, floor numbers", "Hoi quay ruou vang, thang cuon, gia tien o bach hoa")
canh("n5-4", "hoi-gio-o-ngan-hang", "In a bank lobby, {miller} asks {uketsuke} at the counter while glancing at a simple round wall clock with plain tick marks, {gupta} waiting nearby.", 2,
     "numerals on clock face, digital clock digits", "Hoi gio va gio mo cua ngan hang, gio thuc day")
canh("n5-5", "di-hoc-bang-tau-va-xe-dap", "On a sunny street near a small station, {wang} on foot and {santos} walking a bicycle chat and point toward a leafy park, a green-striped commuter train passing on the bridge behind them.", 2,
     "station name signs, train destination display", "Di hoc bang gi: tau dien, di bo; hen di cong vien bang xe dap")
canh("n5-6", "an-trua-o-can-tin", "In a company cafeteria, {yamada} and {karina} sit at a table with a bowl of beef rice and a bread roll on trays, cherry blossoms visible through the window.", 1,
     "menu boards", "Ru an trua o can tin: com bo, banh mi; sau do chup anh hoa")
canh("n5-7", "muon-tu-dien", "In a quiet study room, {gupta} hands a thick dictionary across a desk to {miller}, notebooks and pencils scattered on the table.", 1,
     "writing on book cover", "Muon tu dien, nhan qua tu thay giao, hoc chu Han")
canh("n5-8", "dao-pho-nho-yen-tinh", "On a quiet, pretty small-town street lined with potted plants, {wang} and {santos} stand outside a cosy diner with a plain indigo noren curtain, a tiny corner supermarket nearby.", 2,
     "writing on noren curtain, shop signs", "Thi tran yen tinh dep, sieu thi nho, quan an re ma ngon")
canh("n5-9", "so-thich-choi-guitar", "In a cosy living room, {gupta} happily strums an acoustic guitar while {miller} listens and claps along.", 1,
     "", "So thich am nhac, choi guitar, dau bep do")
canh("n5-10", "con-cho-trong-cong-vien", "In a small park beside a library and a bank building, {wang} points at a dog lying under a tree with little birds on the branches while {santos} looks on.", 2,
     "building signs", "Hoi thu vien o dau; co cho duoi goc cay, co chim, khong co meo")
canh("n5-11", "mua-tem-buu-dien", "At a Japanese post office counter, a postal clerk in a forest-green apron hands a sheet of stamps, an envelope and a small stack of paper to {miller}, who holds out a banknote.", 2,
     "numbers on stamps, denominations on banknote, postal logo", "Mua tem, phong bi, giay o buu dien, tong cong 1000 yen")
canh("n5-12", "mua-xuan-va-mua-thu", "{wang} and {santos} sit on a park bench under a tree whose left half blooms with pink cherry blossoms and whose right half glows with red-orange autumn maple leaves, the bearded man pointing happily at the autumn side.", 2,
     "", "So sanh thich mua xuan hay mua thu, mua he nong")
canh("n5-13", "len-ke-hoach-nghi-he", "In a shopping mall, {karina} holds up a bright swimsuit while {yamada} carries a beach ball, a small daydream of a sunny beach and a bowl of ramen floating above them.", 2,
     "store signs", "Muon di bien boi, mua do boi o trung tam thuong mai, an ramen")
canh("n5-14", "giup-be-thung-do", "In an apartment hallway beside an open window, {miller} helps carry a cardboard box for {gupta}, who is loaded with bags.", 1,
     "writing on the box", "Nho mo cua so, dang song o Tokyo, giup cam do")
canh("n5-15", "xin-phep-trong-gio-kiem-tra", "In a Japanese classroom during a quiz, {wang} raises a hand to ask {sensei}, who stands by an open window, a closed dictionary set aside on the desk.", 2,
     "writing on blackboard, writing on papers", "Xin phep dung tu dien, mo cua so, co phai coi giay khong")
canh("n5-16", "buoi-sang-danh-rang", "In a bright apartment in the morning, {santos} brushes his teeth at the bathroom sink with a towel over his shoulder, a breakfast plate of toast and eggs waiting on the table behind.", 1,
     "", "Moi sang: thuc day, danh rang, tam, an sang roi ra ngoai")
canh("n5-17", "kham-benh-uong-thuoc", "In a clinic examination room, a kind doctor in a white coat with a stethoscope hands a packet of medicine to {miller}, who sits looking worried.", 1,
     "writing on medicine packet, red cross logo", "Kham bac si, phai uong thuoc sau bua an, khong can di lam")
canh("n5-18", "choi-dan-va-doc-sach", "In a cosy shared room at night, {santos} plays a guitar on the sofa while {wang} reads a book beside a warm bedside lamp.", 2,
     "writing on book pages", "So thich choi guitar, piano, doc sach truoc khi ngu")
canh("n5-19", "ke-chuyen-leo-nui-phu-si", "In a classroom, {sensei} listens with interest as {wang} and {santos} share travel memories, photos of Mount Fuji and a Kyoto pagoda pinned on the board behind them.", 2,
     "writing on photos or board", "Kinh nghiem leo nui Phu Si, tham chua o Kyoto")
canh("n5-20", "xem-anh-gia-dinh", "In a casual living room, {yamada} shows a framed family photo of a father in a white doctor's coat, a mother and an older brother to {santos}, who leans in curiously.", 2,
     "", "Xem anh gia dinh: bo la bac si, me la giao vien, co anh trai")
canh("n5-21", "bao-sap-toi", "{wang} and {santos} look out a window at dark swirling clouds and a rain-bent tree, blank grid-lined practice notebooks open on the table in front of them.", 2,
     "writing in notebooks, weather map labels", "Du doan ngay mai mua bao, truong nghi, hoc chu Han o nha")
canh("n5-22", "thay-giao-doi-mu", "On a street near a station, {wang} and {santos} glance at {sensei}, who wears a brimmed hat and walks past a small restaurant.", 2,
     "shop signs", "Nguoi doi mu kia la thay giao moi; nha hang gan ga")
canh("n5-23", "chi-duong-den-ngan-hang", "At a street crossing, {santos} points past a traffic light toward a bank building on the right while {wang} holds a passport and nods.", 2,
     "bank sign writing, passport cover writing", "Hoi duong den ngan hang: qua den giao thong la thay ben phai; mang ho chieu")
canh("n5-24", "hoi-duong-nguoi-qua-duong", "On a busy sidewalk, {santos} carries a heavy suitcase for {wang} while a friendly elderly passer-by shows them a simple paper map.", 2,
     "labels on the map", "Hanh ly nang, giup cam; hoi duong den ga, nguoi qua duong chi ban do")
canh("n5-25", "mua-may-anh-moi", "In a camera shop, {santos} admires a shiny new camera while {wang} yawns tiredly beside him, holding a folded umbrella.", 2,
     "price tags", "Neu troi dep thi di du lich, du mua van di mua sam, muon mua may anh moi")
# ================= N4 =================
canh("n4-26", "dong-nghiep-bi-sot", "In an office, {tanaka} looks with concern at {yamada}, who sits pale and feverish at his desk holding his forehead.", 1,
     "", "Sac mat khong tot, bi sot tu hom qua, xin ve som")
canh("n4-27", "boi-gioi-o-ho-boi", "At an indoor swimming pool, {santos} swims confidently in the water while {wang} cheers from the poolside.", 1,
     "lane numbers", "Kha nang: khong lai xe duoc, boi duoc, noi tieng Anh")
canh("n4-28", "di-dao-ngay-mua", "On a rainy morning path, {yamada} walks under an umbrella wearing earphones, while {tanaka} watches admiringly from a shop awning.", 2,
     "", "Moi sang di dao vua nghe nhac, ca ngay mua cung di")
canh("n4-29", "den-tat-cua-so-mo", "In a dim living room, {wang} points at a switched-off ceiling lamp and an open window while {santos} holds a TV remote, a movie just starting on the screen.", 2,
     "writing on the TV screen", "Den dang tat, cua so dang mo, phim sap bat dau")
canh("n4-30", "chuan-bi-bua-tiec", "In a restaurant set up for a party, {yamada} arranges a vase of flowers on a long table while {tanaka} checks a clipboard beside bottles of drinks.", 2,
     "writing on clipboard, bottle labels", "Chuan bi tiec: da dat nha hang, mua do uong, bay hoa")
canh("n4-31", "uoc-mo-du-hoc", "{wang}, holding a suitcase and a diploma tube, imagines himself teaching in front of a blackboard in a small daydream cloud, as {tanaka} gives him an encouraging thumbs-up.", 2,
     "writing on the blackboard", "Sau tot nghiep du hoc Nhat, uoc mo thanh giao vien")
canh("n4-32", "khuyen-di-benh-vien", "In an office, {yamada} gently advises {tanaka}, who looks pale and feverish, wrapped in a scarf and holding a thermometer.", 1,
     "numbers on thermometer", "Nen di benh vien, nen tap the duc; suc khoe quan trong nhat")
canh("n4-33", "huan-luyen-vien-ra-lenh", "On a sports field, a coach in a tracksuit blows a whistle and shouts encouragement as {senshu} sprints past, a red warning barrier cordoning off a danger zone at the edge of the field.", 3,
     "writing on the warning sign", "The menh lenh: chay di, nhanh len; cam vao cho nguy hiem")
canh("n4-34", "doc-sach-huong-dan", "In a kitchen, {wang} frowns at a new coffee machine while {santos} holds open an instruction booklet with simple picture diagrams.", 2,
     "writing in the booklet", "Khong biet cach dung may, lam dung theo sach huong dan")
canh("n4-35", "que-hay-thanh-pho", "{wang} and {santos} stand on a path that splits into a quiet green countryside with a farmhouse and a small car on one side and a busy city skyline on the other, each pointing to his favourite.", 2,
     "", "Song o que hay thanh pho: yen tinh vs tien loi")
canh("n4-36", "doc-bao-noi-to", "In an office break room, {yamada} proudly reads a newspaper aloud while {tanaka} leans in, cupping a hand to her ear to hear him better.", 2,
     "readable newspaper text", "Tap the duc moi sang, doc duoc bao, noi to hon")
canh("n4-37", "buoi-sang-xui-xeo", "At the office entrance, {yamada} stands gloomy and rain-soaked with a muddy footprint on his shoe while {tanaka} looks at him sympathetically.", 2,
     "", "Bi dam chan tren tau, bi mua uot, bi mang")
canh("n4-38", "hat-karaoke", "In a karaoke room, {santos} sings joyfully into a microphone while {wang} watches with a smile, a smartphone lying on the table.", 1,
     "lyrics on screen", "So thich hat, nhay kem, quen lien lac voi thay")
canh("n4-39", "den-muon-vi-tau-dung", "In an office, a calm middle-aged boss at his desk reassures {yamada}, who has just rushed in late, breathless and apologetic, with his briefcase.", 2,
     "", "Xin nghi vi co viec, den muon vi tau dien ngung chay do tai nan")
canh("n4-40", "thu-mon-an-moi", "At a small restaurant table, {santos} tastes an unfamiliar dish with a delighted face while {wang}, holding an exam textbook, watches curiously.", 2,
     "writing on the textbook", "Lo thi do hay khong; thu an mon moi xem vi the nao")
canh("n4-41", "qua-sinh-nhat-duoi-hoa-anh-dao", "Under blooming cherry trees, {wang} hands a wrapped birthday present to {santos}, who beams with delight.", 1,
     "", "Tang qua sinh nhat, thay tang sach, di ngam hoa anh dao")
canh("n4-42", "hoc-tu-va-tiet-kiem", "At a shared desk, {yamada} studies with a ring of blank flashcards while {tanaka} drops a coin into a piggy bank.", 2,
     "writing on flashcards", "Hoc de di du hoc; dung cu nho tu vung; de danh tien cho con")
canh("n4-43", "troi-sap-mua", "Outside a food stall under heavy grey clouds, {wang} offers an umbrella to {santos}, who yawns sleepily next to a wobbly cracked chair.", 2,
     "stall signs", "Troi co ve sap mua, trong buon ngu, mon an co ve ngon, ghe sap hong")
canh("n4-44", "dau-dau-vi-uong-qua-nhieu", "In an office, {yamada} clutches his aching head at his desk while {tanaka} offers him a pill and a glass of water.", 1,
     "", "Uong qua nhieu nen dau dau, lam viec qua suc, giay de di")
canh("n4-45", "dien-tap-dong-dat", "In a school corridor during an earthquake drill, {sensei} guides {wang} and {santos} toward the staircase instead of the closed elevator.", 2,
     "exit sign writing, floor numbers", "Truong hop dong dat thi dung cau thang bo, khong dung thang may")
canh("n4-46", "goi-dien-luc-sap-ra-ngoai", "At the office door, {yamada}, already in his coat with a bag on his shoulder, answers a phone call, colleagues gathering in a glass meeting room behind him.", 2,
     "", "Goi dien luc sap ra ngoai; cuoc hop sap bat dau / vua xong")
canh("n4-47", "tin-don-dam-cuoi", "In an office break room, {tanaka} teasingly questions {yamada}, who blushes happily, a small heart and a wedding ring floating between them.", 2,
     "", "Nghe noi thang sau ket hon; du bao co bao; trong co ve met")
canh("n4-48", "bat-con-an-rau", "At a home dining table, {yamada} encourages his reluctant little son to eat a plate of green vegetables, a homework notebook lying nearby.", 1,
     "writing in the notebook", "Bat con an rau, cho con hoc bai; con bi om")
canh("n4-49", "le-tan-va-thu-ky", "At the reception desk of a company lobby, {uketsuke} bows politely as a secretary in a grey suit serves a cup of green tea on a tray.", 2,
     "company logo, name plates", "Kinh ngu: giam doc da den, hieu truong dien thuyet, dung tra")
canh("n4-50", "tham-quan-cong-ty-ngay-dau", "{yamada} guides {tanaka}, bowing politely on her first day, on a tour through a company office, gesturing toward a glass-walled meeting room.", 2,
     "name plates, door signs", "Khiem nhuong ngu: ngay dau, huong dan tham quan cong ty, giam doc o phong hop")
# ================= N3 =================
canh("n3-1", "pha-ky-luc-bat-ngo", "In an office, {tanaka} shows {santos} a tablet photo of a runner in a navy tracksuit breaking the finish-line tape, and he looks astonished.", 2,
     "writing on the screen", "Nghe noi anh Yamada pha ky luc; khong the thang VDV chuyen nghiep")
canh("n3-2", "thoi-quen-song-khoe", "In a sunny park, {yamada}, looking fit and energetic, stretches after a morning jog holding a salad box, while {tanaka} listens attentively.", 2,
     "", "Co gang tap the duc, an rau, ngu som vi suc khoe")
canh("n3-3", "quy-dinh-truong-dai-hoc", "On a university campus, {wang} and {santos} in casual clothes walk past a plain notice board, other students around them also in everyday clothes rather than uniforms.", 2,
     "writing on notice board", "Dai hoc khong bat buoc dong phuc, hop moi thu Hai, quyet di du hoc")
canh("n3-4", "den-muon-vi-ket-xe", "{yamada} arrives late at the office, pointing back at a traffic jam through the window, holding an exam paper marked with a big red circle as {tanaka} smiles.", 2,
     "writing on the exam paper, scores", "Den muon vi ket xe; nho thay giao ma do; bi mang vi quen bai tap")
canh("n3-5", "vat-gia-tang", "In a supermarket aisle, {tanaka} and {santos} frown at a small shopping basket beside a tall stack of coins, city towers visible through the window.", 3,
     "price tags, numbers", "Vat gia tang so voi truoc; thanh thi dat hon nong thon; moi truong, dan so")
canh("n3-6", "san-pham-cho-noi-tro", "In a bright product showroom, {santos} presents a new compact kitchen appliance to {tanaka}, with a small factory and a globe drawn on the wall display.", 2,
     "product labels, writing on the display", "San pham danh cho noi tro, ban ra nuoc ngoai, lam o nha may")
canh("n3-7", "dai-hoi-ngay-mua", "At an outdoor nationwide festival in the rain, {tanaka} and {santos} stand under umbrellas beside festival tents and colourful bunting.", 2,
     "banner writing", "Dai hoi to chuc khap ca nuoc 3 ngay; dung ngay dai hoi thi mua")
canh("n3-8", "gia-su-trung-xo-so", "At a café table, {santos} holds a lottery ticket and daydreams of a Japanese university and a suitcase in a small thought cloud, as {tanaka} smiles.", 2,
     "numbers on the ticket", "Chi can co tien thi di du hoc; gia su trung xo so")
canh("n3-9", "thieu-ngu-met-moi", "At an office desk, {santos}, sleepy with dark circles under his eyes, yawns beside a half-eaten piece of bread while {tanaka} looks at him with concern.", 1,
     "", "Hoi met, thieu ngu, hay di tre, banh mi an do")
canh("n3-10", "bat-man-luong-thap", "In an office break room, {santos} complains in frustration over a nearly empty wallet while {tanaka} sighs, rain streaking down the window.", 3,
     "", "Mac du mua van tham gia; co tai ma khong co gang; ban ma luong thap")
canh("n3-11", "nong-khong-chiu-noi", "On a scorching summer day, {santos}, sweating, fans himself while holding a family photo, and {tanaka} wipes her brow beside an electric fan.", 2,
     "", "Nong khong chiu noi, nho gia dinh, tiec vi thua tran")
canh("n3-12", "dieu-tra-vu-mat-vi", "In a room marked off as a crime scene, {tanaka} examines an empty wallet with a magnifying glass while {santos} points at a dog sitting beside a dropped key.", 2,
     "police tape writing", "Ai lay vi tien; co con cho o hien truong; chac chan la thu pham")
canh("n3-13", "an-toan-nha-may", "In a factory, {tanaka} and {santos} in hard hats inspect a large machine with a flashing warning light, safety cones around a slippery wet patch on the floor.", 2,
     "warning sign writing", "Trong tinh huong nguy hiem tai nan co the xay ra; may moc gay van de")
canh("n3-14", "xu-huong-xa-hoi", "In a meeting room, {tanaka} and {santos} study a wall chart of plain rising and falling arrows beside simple icons of a robot, a shopping cart and a small family.", 3,
     "axis labels, numbers on the chart", "Dan so ngay cang giam, cong nghe ngay cang tien bo, vat gia ngay cang tang")
canh("n3-15", "nhan-vien-moi-da-tai", "In an office, {santos} introduces a cheerful new female employee to {tanaka}, small floating icons of a globe, a frying pan and a broom around her showing her many skills.", 3,
     "", "Nguoi moi khong chi noi tieng Nhat ma ca tieng Anh; gioi nau an, viec nha")
canh("n3-16", "ky-thay-giam-doc", "In a meeting room, {santos} signs a document on behalf of an absent boss whose empty leather chair sits at the head of the table, {tanaka} watching.", 2,
     "writing on the document", "Truong phong du hop thay giam doc; ky ten thay nguoi dai dien")
canh("n3-17", "thuyet-trinh-van-hoa-nhat", "In a university seminar room, {santos} gives a presentation on Japanese culture to {tanaka} and a few students, the screen showing a torii gate, a pagoda and a kimono.", 2,
     "writing on the screen", "Cuoc hop ve van hoa, lich su Nhat Ban; bao cao truoc sinh vien")
canh("n3-18", "cuoc-hop-bi-hoan", "In an office, {tanaka} relays news of a postponed meeting to {santos}, who holds a phone, a blank wall calendar with a page flipping forward behind them.", 2,
     "dates or numbers on the calendar", "Nghe noi cuoc hop bi hoan; can phe duyet; lien lac bang dien thoai")
canh("n3-19", "tuan-thu-quy-tac-xa-hoi", "On a train platform, {tanaka} and {santos} wait politely in a neat queue, frowning at a man who litters and talks loudly on his phone.", 3,
     "platform signs", "Nen tuan thu quy tac xa hoi, khong nen gay phien ha, co trach nhiem")
canh("n3-20", "hop-tong-ket-du-an", "In a project review meeting, {tanaka} and {santos} stand at a whiteboard covered with blank sticky notes and a simple upward-trending line while teammates applaud.", 2,
     "writing on sticky notes or whiteboard", "Cuoc hop rut kinh nghiem du an, ket qua ngay cang tot, nam sau tiep tuc")
# ================= N2 =================
canh("n2-1", "le-khai-mac-nham-chuc", "At a formal opening ceremony, {santos_exec} speaks at a podium with a microphone while {tanaka}, as master of ceremonies, stands beside a red-and-white ribbon.", 2,
     "banner writing", "Nhan dip khai mac, giam doc moi nham chuc phat bieu")
canh("n2-2", "bat-dac-di-nhap-vien", "In a hospital room, {tanaka} lies in bed with a bandaged arm while {santos} visits with a bouquet of flowers, a typhoon storm lashing the window.", 2,
     "", "Bat dac di thu hep kinh doanh; vi bao huy hop; vi tai nan phai nhap vien")
canh("n2-3", "may-hong-khong-sua-duoc", "In a workshop office, {santos} shakes his head over a broken machine with springs popping out while {tanaka} holds a phone to a demanding client.", 2,
     "", "Kho dap ung yeu cau khach hang; may khong co cach nao sua duoc")
canh("n2-4", "duong-nui-sat-lo", "Seen through a car windshield on a stormy mountain road, {santos} drives cautiously past a crumbling cliff with falling rocks as {tanaka} in the passenger seat points at the danger.", 2,
     "road sign writing", "Do bao co nguy co sat lo; duong hiem nguy hiem; lai xe chu y")
canh("n2-5", "gio-manh-dan-khi-bao-den", "On a windy street, {santos} chats confidently with {tanaka} as autumn leaves swirl around them, a storm cloud gathering on the horizon.", 3,
     "", "Cang gioi len cang tu tin; bao den gan gio manh hon; mua thay doi")
canh("n2-6", "chi-nhanh-lan-tu-tokyo", "In an executive office, {santos_exec} points to a map of Japan with pins spreading outward from Tokyo while {tanaka} interviews him with a notepad.", 2,
     "place names on the map", "Lay du hoc lam dong luc lap cong ty; bat dau tu Tokyo lan ra toan quoc")
canh("n2-7", "cong-nghe-lan-khap-the-gioi", "In a modern meeting room, {tanaka} and {santos_exec} gaze at a large glowing globe with network lines spreading from Japan across every continent.", 2,
     "country labels", "Khong chi Nhat Ban ma pho bien khap the gioi; anh huong kinh te, moi truong")
canh("n2-8", "tranh-chap-dat-dai", "At a town hall meeting, {tanaka} and {santos} watch two groups of residents argue across a long table over a simple map of a land plot.", 3,
     "writing on the map", "Xoay quanh van de dat dai su doi lap van tiep dien; tan thanh va phan doi")
canh("n2-9", "van-dong-vien-bat-chap-benh", "In a living room, {tanaka} and {santos} applaud from the sofa as a TV shows a bandaged athlete lifting a gold trophy on a podium.", 2,
     "writing on the TV screen, podium numbers", "VDV bat chap benh tat van luyen tap va vo dich; mac ke phan doi")
canh("n2-10", "dua-tren-luat-va-so-lieu", "In a library, {santos_exec} opens a thick law book beside a stack of simple bar-chart reports while {tanaka} holds a novel and a film reel.", 3,
     "writing on book covers, chart labels", "Phan xet dua tren phap luat; ke hoach dua tren so lieu; tieu thuyet dua tren su that")
canh("n2-11", "dac-san-dia-phuong", "At a traditional local shop, {tanaka} offers {santos} a regional specialty sweet on a lacquer tray, a small torii gate and green mountains visible outside.", 2,
     "shop sign writing", "Dac san chi thi tran nay moi co; dich vu xung dang voi khach du lich")
canh("n2-12", "quyet-dinh-ket-hon", "At a café table, {santos} shows {tanaka} an open wedding-ring box with a relieved smile after long hesitation, crumpled papers from a failed project pushed aside.", 2,
     "", "Sau thoi gian dai tran tro da quyet dinh ket hon; du an khac that bai")
canh("n2-13", "cong-nghe-lan-khap-the-gioi", "In a modern meeting room, {tanaka} and {santos_exec} gaze at a large glowing globe with network lines spreading from Japan across every continent.", 2,
     "country labels", "Khong chi dung lai o Nhat Ban ma pho bien khap the gioi (cung canh voi n2-7)", dungLai="canh-cong-nghe-lan-khap-the-gioi")
canh("n2-14", "tin-tai-nan-kho-tin", "In an office, {santos} stares in disbelief at a newspaper photo of a car accident while {tanaka} places a comforting hand on his shoulder.", 2,
     "readable newspaper text", "Ket qua kho ma tin duoc; kho dap ung yeu cau; kho tha thu")
canh("n2-15", "ky-niem-thanh-lap-cong-ty", "At a company anniversary banquet, {santos_exec} gives a speech at a podium while {tanaka}, as host, stands beside a large celebration cake and guests raise their glasses.", 2,
     "numbers on the cake, banner writing", "Ky niem 10 nam thanh lap, giam doc phat bieu, phat trien khap the gioi")
# ================= N1 =================
canh("n1-1", "vdv-cai-trong-tai", "From a stadium commentary booth, {tanaka} and {santos}, wearing headsets, watch an athlete angrily confronting a referee on the field below, beautiful mountains beyond the stadium.", 3,
     "scoreboard numbers", "Hanh dong VDV vo cung nguy hiem, that le voi trong tai den cuc diem")
canh("n1-2", "tin-tham-kich-gay-soc", "In a living room, {tanaka} and {santos} watch a TV news report of a collapsed building with shocked, saddened faces, hands over their mouths.", 2,
     "news ticker text", "Khong kim nen duoc cu soc, thuong cam nan nhan, phan no vi tham nhung")
canh("n1-3", "san-pham-hoan-hao", "In a bright product-tasting studio, {santos_exec} holds up a sleek bottled drink with a satisfied thumbs-up while {tanaka} tastes a sample, people of different ages and backgrounds waiting in a line behind.", 3,
     "product labels", "Ca huong vi lan chat luong deu hoan hao; du giau hay ngheo ai cung dung duoc")
canh("n1-4", "cuoc-doi-vuot-kho", "In an interview room, {santos_exec}, now a successful author, signs a copy of his book while {tanaka} interviews him, a faded sketch of a humble childhood shack hanging on the wall.", 3,
     "writing on the book cover", "Bat chap co doc, ngheo doi, khong viet duoc hiragana, nay da thanh cong")
canh("n1-5", "cong-ty-pha-san", "In a TV panel studio, {yamamoto} explains to {tanaka} while pointing at a screen showing a shuttered factory and a steep downward arrow.", 3,
     "writing on the screen", "Kinh doanh xau di dan den pha san; giam doc cu bien minh, noi doi")
canh("n1-6", "be-boi-nghi-si", "In a news studio, {yamamoto} shakes his head at a screen showing a politician in a suit ranting at a podium, as {tanaka} listens gravely.", 3,
     "writing on the screen", "Su bat chinh cua nghi si; phat ngon khong xung voi tu cach")
canh("n1-7", "chung-cu-thu-pham", "At a police evidence table, {yamamoto}, as a detective, points to a fingerprint card, a muddy footprint cast and a bag of money while {tanaka} takes notes.", 2,
     "evidence labels", "Nhieu chung cu; chac chan anh ta la thu pham; dong co la tien bac")
canh("n1-8", "le-tot-nghiep-tri-an-thay", "At a graduation ceremony under cherry blossoms, {tanaka_hakama} bows deeply with a diploma tube to {suzuki}.", 1,
     "writing on diploma", "Le tot nghiep, kinh trong va biet on thay mai khong thoi")
canh("n1-9", "hop-bao-xin-loi", "At a press conference, {shacho} bows deeply in apology behind a table of microphones while reporters raise their hands and camera flashes pop.", 1,
     "backdrop logos, name plate writing", "Hop bao: giam doc bat buoc phai xin loi va chiu trach nhiem")
canh("n1-10", "giam-doc-nghi-huu", "In his office, {shacho} holds a farewell bouquet beside a map of Japan dotted with branch pins as {tanaka} interviews him.", 2,
     "place names on the map", "Cua hang dau tien o Tokyo, chi nhanh lan toan quoc; ke tu hom nay nghi huu")
canh("n1-11", "luat-su-tuyen-an", "Outside a courthouse, a composed lawyer in a dark suit speaks to {tanaka}, who holds out a microphone, a statue of a woman holding scales of justice behind them.", 2,
     "writing on the building", "Phan quyet bam sat thuc trang vu viec, tuan theo phap luat va tien le")
canh("n1-12", "phong-van-nha-vo-dich", "On a stadium field, {senshu} holds a gold trophy and bows gratefully while {tanaka} holds out a microphone and teammates and family cheer behind.", 2,
     "scoreboard numbers", "Neu khong co su co vu, gia dinh, dong doi thi khong co chuc vo dich")
canh("n1-13", "binh-luan-thanh-tra-bi-bat", "In a TV debate studio, a stern grey-bearded critic comments while {tanaka} listens, a screen behind them showing a police officer in handcuffs.", 3,
     "writing on the screen", "Mot nguoi la thanh tra ma lai dinh liu toi pham, khong the tha thu")
canh("n1-14", "gop-y-luan-van", "In a book-lined professor's office, {kyoju} reviews a thick thesis covered in red pen marks as a nervous young graduate student listens.", 1,
     "readable writing on the thesis", "Giao su nhan xet luan van: co xu huong chay theo ly thuyet suong")
canh("n1-15", "bai-giang-nghi-huu", "In a university lecture hall, {kyoju} gives his final retirement lecture at a podium holding a bouquet, while a host stands aside and the audience applauds.", 2,
     "writing on the screen or banner", "Buoi giang ky niem nghi huu cua giao su sau 40 nam nghien cuu")

# ---- Kiem tra voi du lieu that ----
def ds_bai():
    out = collections.OrderedDict()
    for L in ["n5", "n4", "n3", "n2", "n1"]:
        fs = [f for f in glob.glob(os.path.join(GOC, L, "*.json")) if not f.endswith("index.json")]
        for f in sorted(fs, key=lambda x: int(os.path.basename(x)[:-5])):
            d = json.load(open(f, encoding="utf-8"))
            if d.get("dialogue"):
                sp = []
                for x in d["dialogue"]:
                    if x["speaker"] not in sp: sp.append(x["speaker"])
                out["%s-%d" % (L, d["lessonNumber"])] = dict(title=d["title"], sp=sp)
    return out

BAI = ds_bai()
assert len(BAI) == 100, len(BAI)
assert [c["bai"] for c in C] == list(BAI.keys()), "thu tu / thieu bai"

tra = {}
for k, v in NV.items():
    tra[v["goc"]] = k
    for b in v["bien"]: tra[b] = k

JP = re.compile(r"[\u3040-\u30ff\u4e00-\u9fff]")
items, skipped = [], []

for k, v in NV.items():
    bai_co = [b for b, x in BAI.items() if any(tra.get(s) == k for s in x["sp"])]
    items.append(dict(id="nv-" + k, ten="nv-" + k, loai="nhanvat", kho=1,
                      prompt=v["chandung"],
                      negative="multiple people, busy background, props, full-body scene, cropped face",
                      nhanVat=v["goc"], moTaTrongCanh=v["mota"], xuatHien=bai_co))

for c in C:
    x = BAI[c["bai"]]
    # Santos tu N2 tro di la giam doc: luon mac vest
    p = c["prompt"].format(**dict(F, santos=SANTOS_EXEC) if c["bai"][:2] in ("n2", "n1") else F)
    p = p[0].upper() + p[1:]  # viet hoa chu dau cau
    # nhan vat co mat trong canh (theo nguoi noi trong du lieu)
    nvs = sorted(set(tra[s] for s in x["sp"] if s in tra))
    it = dict(id="canh-" + c["bai"], ten=c["dungLai"] or ("canh-" + c["slug"]), loai="canh", kho=c["kho"],
              prompt=p, negative=c["neg"] or "none extra", bai=c["bai"], tieuDe=x["title"],
              nguoiNoi=x["sp"], nhanVat=["nv-" + n for n in nvs], tomTat=c["tomtat"])
    if c["dungLai"]: it["dungLai"] = c["dungLai"]
    items.append(it)

for vai, bai in VAI_LE.items():
    skipped.append(dict(id="nv-" + vai, reason="Vai chi xuat hien 1 bai (%s): khong can chan dung rieng, da mo ta truc tiep trong prompt canh cua bai do" % bai))
for bien in ["山田一郎", "山田 (Yamada)", "ミラー (Miller)", "佐藤 (Satou)"]:
    skipped.append(dict(id="nv-" + bien, reason="Bien the ten cua nhan vat da co (%s) - gop vao chan dung chung" % ("nv-" + tra[bien])))

# kiem tra: 1 cau, khong chu Nhat, ket thuc bang dau cham, moi nguoi noi co ten deu duoc anh xa
for it in items:
    p = it["prompt"]
    assert not JP.search(p), it["id"]
    assert p.endswith(".") and p.count(". ") == 0, it["id"]
    assert "{" not in p, it["id"]
tatca = set(s for x in BAI.values() for s in x["sp"])
thieu = [s for s in tatca if s not in tra and s not in VAI_LE]
assert not thieu, thieu

ten_ds = collections.Counter(it["ten"] for it in items)
dup = [t for t, n in ten_ds.items() if n > 1]

doc = collections.OrderedDict()
doc["version"] = 1
doc["mo"] = "Prompt canh hoi thoai (1 canh mo dau/bai, 100 bai) + bang nhan vat cho Qwen-Image-2512"
doc["style"] = STYLE
doc["negativeBase"] = NEG_BASE
doc["cachGhep"] = "prompt_day_du = item.prompt + ' ' + style ; negative_day_du = negativeBase + ', ' + item.negative (bo qua neu 'none extra'). Anh 1:1 (vd 1328x1328). Item co dungLai: chi sinh 1 anh cho moi 'ten'."
doc["bangMau"] = {"nen": "#f0ebe1", "terracotta": "#c96442", "sage": "#6b8a5e", "mustard": "#c9a54a (goi y)", "ink": "#1f1d19"}
doc["ghiChuNhatQuan"] = ("Moi nhan vat co 1 mau chu dao va trang phuc co dinh; prompt canh chen nguyen van moTaTrongCanh. "
                         "Santos o N2/N1 la giam doc: giu toc xoan, rau ngan nhung mac vest toi + ca vat terracotta. "
                         "Tanaka bai n1-8 mac hakama tot nghiep mau xanh teal. Neu sau nay dung IP-Adapter/ref image, lay anh nv-* lam tham chieu.")
doc["thongKe"] = dict(nhanvat=len(NV), canh=len(C), canhDungLai=sum(1 for c in C if c["dungLai"]),
                      anhCanSinh=len(ten_ds), skipped=len(skipped), tenTrung=dup)
doc["items"] = items
doc["skipped"] = skipped
json.dump(doc, open(RA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", RA, len(items), "items;", len(ten_ds), "anh can sinh; dup ten:", dup)
