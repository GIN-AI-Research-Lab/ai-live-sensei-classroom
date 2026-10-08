# tao-base.py - tao probe-base.json cho 11 nhan vat chua co anh (prompt theo mau nhanVat trong style-chung.json)
import json, sys
# ---- PATHS: style-chung.json trong prompts/ cua kho (1 cap tren thu muc nay) ----
import os
SP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "style-chung.json")
st = json.load(open(SP, encoding='utf-8'))['nhanVat']
M_SMILE = "a small curved line smile with the mouth closed"
M_CALM = "a small calm short line mouth"
ds = {
 'coach': ("a fit, cheerful Japanese male sports coach in his early forties with very short black hair and a strong jaw, wearing a terracotta-red zip track jacket with a high collar and a silver whistle hanging on a thin cord around his neck, energetic and encouraging", M_SMILE),
 'bengoshi': ("a sharp Japanese male lawyer in his early fifties with neat side-parted black hair and a little grey at the temples, wearing a dark charcoal suit, white shirt, a deep burgundy tie and a small round gold lapel pin on the jacket, serious and composed", M_CALM),
 'hisho': ("a tidy young Japanese male secretary around thirty with neat short black hair combed to the side, wearing a light-grey waistcoat over a white shirt with a slate-blue tie, neat and dependable", M_SMILE),
 'nguyen': ("a friendly young Vietnamese woman around twenty-two with long straight black hair parted at the side, light warm peach skin, wearing a casual pale-blue short-sleeved collared button-up shirt, bright and open", M_SMILE),
 'joshi': ("a composed Japanese female manager in her mid-forties with a sleek black shoulder-length bob with a few fine silver strands and a mature elegant look, wearing a deep plum blazer over a cream blouse and a small pearl necklace, confident", M_SMILE),
 'hyoronka': ("a sharp-minded Japanese woman critic in her fifties with a short silver-grey bob and large dark-rimmed cat-eye glasses, wearing a thick sage-green knit scarf wrapped around her neck over a charcoal coat, intellectual and observant", M_CALM),
 'isha': ("a kind Japanese female doctor in her mid-thirties with short neat black hair tucked behind her ears, wearing a white doctor's coat over teal scrubs with a stethoscope draped around her neck, reassuring", M_SMILE),
 'tsukonin': ("a casual young Japanese woman in her mid-twenties passing by, with wavy shoulder-length dark-brown hair, wearing a mustard-yellow zip-up casual jacket over a plain white t-shirt, relaxed", M_SMILE),
 'gakusei': ("a young Japanese female graduate student around twenty-five with black hair in a high ponytail and a straight fringe, wearing a navy cardigan over a white collared shirt with the straps of a backpack over her shoulders, earnest and studious", M_SMILE),
 'shikai': ("a poised Japanese female TV host and event presenter in her mid-thirties with smooth chestnut-brown shoulder-length hair with a side sweep, wearing a smart terracotta blazer over a white top with a tiny black clip-on microphone on the lapel, polished and warm", M_SMILE),
 'kisha': ("a keen young Japanese female news reporter in her late twenties with black shoulder-length hair tucked behind one ear, wearing a beige jacket, a red lanyard cord with a blank press pass card hanging on her chest, and holding a small blank notebook and pen against her chest, alert and curious", M_SMILE),
}
items = []
for k, (d, m) in ds.items():
    items.append({'ten': 'nv-' + k, 'prompt': st['mau'].replace('{d}', d).replace('{m}', m), 'negative': st['negative']})
json.dump({'styleRef': 'style-chung.json', 'items': items}, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(items), 'items')
