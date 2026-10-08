# tao-regen.py <ra.json> <seed> id:key ... - job sinh lai (them cau nhac rieng cho tung nhan vat / bieu cam)
import json, os, sys
src = open(__file__.replace('tao-regen.py', 'tao-jobs.py'), encoding='utf-8').read().split('a = sys.argv[1:]')[0]
ns = {}; exec(src, ns)
EXTRA_ID = {
 'gupta': " Keep the thick dark moustache above the mouth exactly as in the original, and keep the same stubble shading around the mouth and chin.",
 'santos': " Keep the short dark beard exactly as in the original. No white outline or white border around the figure; the outline is the same thin dark line as the original.",
}
EXTRA_KEY = {
 'ngac_nhien': " The hair stays exactly as in the original hairstyle and is never drawn over the eyes; the raised eyebrows are drawn on the skin of the forehead, below the hair. The mouth is a flat closed line.",
}
seed = int(sys.argv[2]); jobs = []
for t in sys.argv[3:]:
    i, k = t.split(':')
    jobs.append({'ten': '%s__%s' % (i, k), 'ref': os.path.expanduser('~/nv/refs28/%s.png') % i,
                 'prompt': ns['COMMON'] + ns['EXPR'][k] + EXTRA_ID.get(i, '') + EXTRA_KEY.get(k, ''), 'seed': seed})
json.dump(jobs, open(sys.argv[1], 'w'), indent=1); print(len(jobs))
