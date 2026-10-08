# tao-var.py: thu nhieu cach viet cho 1 bieu cam. python tao-var.py ra.json key nhan1=ref1 ... ; bien the trong VARS
import json, sys, importlib.util
spec = importlib.util.spec_from_file_location('tj', __file__.replace('tao-var.py', 'tao-jobs.py'))
src = open(__file__.replace('tao-var.py', 'tao-jobs.py'), encoding='utf-8').read().split('a = sys.argv[1:]')[0]
ns = {}; exec(src, ns)
COMMON = ns['COMMON']
VARS = {
 'C': "Very enthusiastic interested face: dark eyebrows raised high, very large round eyes with big white highlights, the mouth a closed smile drawn as one curved line, with the corners turned up high and the lips together.",
 'D': "Thrilled fascinated face: dark eyebrows raised very high, huge round shiny eyes with big white highlights, the mouth a closed grin drawn as a single wide curved line, lips together, no teeth visible.",
 'E': "Thrilled fascinated face: dark eyebrows raised very high, huge round shiny eyes with big white highlights, and the same closed smile line as in the original picture, only slightly wider.",
}
out = sys.argv[1]; pares = [a.split('=', 1) for a in sys.argv[2:]]
jobs = []
for v, t in VARS.items():
    for seed in (7,):
        for n, r in pares:
            jobs.append({'ten': '%s__hao_%s_s%d' % (n, v, seed), 'ref': r, 'prompt': COMMON + t, 'seed': seed})
json.dump(jobs, open(out, 'w', encoding='utf-8'), indent=1)
print(len(jobs))
