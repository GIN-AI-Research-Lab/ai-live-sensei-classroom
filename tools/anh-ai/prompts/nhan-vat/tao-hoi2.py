# tao-hoi2.py <ra.json> <seed> <H7|H8> ids... : job hoi cuoi cung (ten = <id>__hoi)  [luu y: khong co tham so hau-to]
import json, os, sys
src = open(__file__.replace('tao-hoi2.py', 'tao-jobs.py'), encoding='utf-8').read().split('a = sys.argv[1:]')[0]
ns = {}; exec(src, ns)
T = {
 'H7': "Calm face with a single strongly raised eyebrow: the head stays perfectly upright and level, exactly in the original position. Only ONE eyebrow moves: it is lifted very high above the eye in a strong arch, clearly much higher than the other eyebrow. The other eyebrow stays relaxed and level. Wide open simple dot eyes looking up and to the side. The mouth is a small closed line that is straight, neither smiling nor frowning.",
 'H8': "Calm face with a single strongly raised eyebrow: the head stays perfectly upright and level, exactly in the original position. One eyebrow is lifted very high above the eye in a strong arch, the other eyebrow is relaxed and level. Wide open simple dot eyes looking up and to the side. The mouth is a small closed line with a slight upward curve, a faint smile.",
}
out, seed, v = sys.argv[1], int(sys.argv[2]), sys.argv[3]
jobs = [{'ten': '%s__hoi' % i, 'ref': os.path.expanduser('~/nv/refs28/%s.png') % i, 'prompt': ns['COMMON'] + T[v], 'seed': seed} for i in sys.argv[4:]]
json.dump(jobs, open(out, 'w'), indent=1); print(len(jobs))
