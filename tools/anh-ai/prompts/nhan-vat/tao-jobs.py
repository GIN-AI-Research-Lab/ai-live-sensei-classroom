# tao-jobs.py <ra.json> <ten1=ref1> <ten2=ref2> ... [--keys a,b,c] [--v N] - tao danh sach job bieu cam
import json, sys
KEYS = ['binh_thuong', 'vui', 'hoi', 'gian', 'ngac_nhien', 'hao_hung', 'buon']
COMMON = ("Change only the facial expression of this flat vector cartoon character. Everything else stays identical: the same hair, the same skin colour, "
          "the same clothes and accessories, the same pose, the same size and position in the frame, the same thin dark outline, and the same plain cream background with no border and no sticker outline. "
          "Clean flat colours with perfectly smooth skin and smooth clothes. The lips stay closed: the mouth is one simple thin line or curve at the same place as the original mouth. ")
EXPR = {
 'binh_thuong': "Calm neutral face: level relaxed eyebrows, simple small dot eyes, the mouth a short gentle closed line.",
 'vui': "Happy warm face: the eyes are cheerful smiling arcs curving upward, relaxed slightly raised eyebrows, the mouth a soft closed smile curve.",
 'hoi': "Curious questioning face: the head stays perfectly upright and level, not tilted and not turned, in exactly the same position as the original. One eyebrow is raised high and arched while the other eyebrow stays low and level, one eye slightly wider than the other, simple dot eyes glancing slightly upward, the mouth a small closed slightly crooked line.",
 'gian': "Angry face: eyebrows pulled low, squeezed together and slanted sharply downward toward the nose, narrowed glaring dot eyes, the mouth a tight short closed frowning line curving downward.",
 'ngac_nhien': "Surprised face: dark eyebrows lifted very high above the eyes in tall round arches, the two eyebrows symmetrical and not slanted, the eyes are larger round dots with thin white rings around them, the mouth is a short thin flat closed line, lips pressed together.",
 'hao_hung': "Very enthusiastic interested face: dark eyebrows raised high, very large round eyes with big white highlights, the mouth a closed smile drawn as one curved line, with the corners turned up high and the lips together.",
 'buon': "Sad apologetic face: eyebrows tilted with the inner ends high and the outer ends low in a worried shape, slightly lowered drooping eyes, the mouth a small closed curve turned downward.",
}
a = sys.argv[1:]
out = a[0]; keys = KEYS; seed = 7; pares = []
i = 1
while i < len(a):
    if a[i] == '--keys': keys = a[i + 1].split(','); i += 2
    elif a[i] == '--seed': seed = int(a[i + 1]); i += 2
    else: pares.append(a[i].split('=', 1)); i += 1
jobs = [{'ten': n + '__' + k, 'ref': r, 'prompt': COMMON + EXPR[k], 'seed': seed} for n, r in pares for k in keys]
json.dump(jobs, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(jobs), 'jobs')
