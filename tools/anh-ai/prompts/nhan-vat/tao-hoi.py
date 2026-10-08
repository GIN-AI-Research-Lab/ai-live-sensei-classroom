import json, os, sys
src = open(__file__.replace('tao-hoi.py', 'tao-jobs.py'), encoding='utf-8').read().split('a = sys.argv[1:]')[0]
ns = {}; exec(src, ns)
V = {
 'H7': "Calm face with a single strongly raised eyebrow: the head stays perfectly upright and level, exactly in the original position. Only ONE eyebrow moves: it is lifted very high above the eye in a strong arch, clearly much higher than the other eyebrow. The other eyebrow stays relaxed and level. Wide open simple dot eyes looking up and to the side. The mouth is a small closed line that is straight, neither smiling nor frowning.",
 'H8': "Calm face with a single strongly raised eyebrow: the head stays perfectly upright and level, exactly in the original position. One eyebrow is lifted very high above the eye in a strong arch, the other eyebrow is relaxed and level. Wide open simple dot eyes looking up and to the side. The mouth is a small closed line with a slight upward curve, a faint smile.",
}
ids = sys.argv[2:]
jobs = [{'ten': '%s__hoi%s' % (i, v), 'ref': os.path.expanduser('~/nv/refs28/%s.png') % i, 'prompt': ns['COMMON'] + t, 'seed': 7} for v, t in V.items() for i in ids]
json.dump(jobs, open(sys.argv[1], 'w'), indent=1); print(len(jobs))
