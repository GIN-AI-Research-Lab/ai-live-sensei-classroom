# tao-full.py <ra.json> <refdir> <seed> <keys> <ids...> - job cho nhieu nhan vat
import json, sys
src = open(__file__.replace('tao-full.py', 'tao-jobs.py'), encoding='utf-8').read().split('a = sys.argv[1:]')[0]
ns = {}; exec(src, ns)
out, rd, seed, keys = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4].split(',')
jobs = [{'ten': '%s__%s' % (i, k), 'ref': '%s/%s.png' % (rd, i), 'prompt': ns['COMMON'] + ns['EXPR'][k], 'seed': seed} for i in sys.argv[5:] for k in keys]
json.dump(jobs, open(out, 'w', encoding='utf-8'), indent=1); print(len(jobs))
