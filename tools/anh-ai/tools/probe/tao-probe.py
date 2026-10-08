# Tao danh sach muc thu phong cach (probe) tu prompt-n5.json + prompt-canh.json
import json
n5 = json.load(open('prompt-n5.json', encoding='utf-8'))
canh = json.load(open('prompt-canh.json', encoding='utf-8'))
STYLE = n5['style']
NEG = n5['negativeChung']
theoTen = {}
for x in n5['items']:
    if not x.get('dungLai'):
        theoTen.setdefault(x['ten'], x)
for x in canh['items']:
    theoTen.setdefault(x['ten'], dict(x, negative=NEG + ', ' + x.get('negative', '')))

def lay(ten, nghia):
    x = theoTen[ten]
    return {'ten': ten, 'nghia': nghia, 'prompt': x['prompt'], 'negative': x['negative']}

def moi(ten, nghia, prompt, them=''):
    return {'ten': ten, 'nghia': nghia, 'prompt': prompt, 'negative': NEG + (', ' + them if them else '')}

ds = [
    lay('toi', 'watashi - toi'),
    lay('benh-vien', 'byouin - benh vien'),
    lay('bac-si', 'isha - bac si'),
    lay('an', 'tabemasu - an'),
    moi('dat', 'takai - dat (vs re)',
        'A shopper with wide surprised eyes comparing two wristwatches on a shop counter: on the left a big sparkling gold luxury watch on a velvet cushion with a tall stack of banknotes beside it, highlighted in terracotta; on the right a plain simple plastic watch with a single small coin beside it.',
        'price tags with numbers'),
    lay('nhan-vien-ngan-hang', 'ginkouin - nhan vien ngan hang'),
    lay('nha-nghien-cuu', 'kenkyuusha - nha nghien cuu'),
    moi('han-hanh', 'hajimemashite - lan dau gap',
        'Two office workers meeting for the first time, facing each other and bowing politely at the waist with warm smiles, one offering a blank business card with both hands.',
        'crowd, extra people'),
    lay('den-dien', 'denki - den dien'),
    moi('dai-hoc', 'daigaku - dai hoc',
        'A stately brick university main building with a tower behind a wide open gate and golden ginkgo trees, a large black graduation mortarboard cap with a gold tassel floating in the foreground.',
        'clock face'),
    moi('canh-san-ga-buoi-sang', 'canh: san ga buoi sang',
        'On a Japanese train station platform in soft early-morning light, a Japanese woman around thirty with black hair in a low ponytail wearing a sky-blue blouse and a cheerful American man in his late twenties with short sandy-blond hair wearing a mustard-yellow sweater greet each other with a small wave, a green-striped commuter train arriving behind them and a few commuters waiting in line.',
        'destination boards with writing, station name signs'),
    lay('nv-sato', 'Sato (nhan vat)'),
    lay('nv-miller', 'Miller (nhan vat)'),
    lay('nv-yamada', 'Yamada (nhan vat)'),
    lay('re', 'yasui - re'),
    lay('tren', 'ue - tren'),
]
for d in ds:
    d['style'] = STYLE
json.dump({'style': STYLE, 'items': ds}, open('probe/probe-items.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(ds))
