# tao-inbox.py <ra.json> <out> <steps> <cfg> <size> <jobs.json>  - boc danh sach job thanh tep inbox
import json, sys
o, out, steps, cfg, size, jf = sys.argv[1:7]
json.dump({'out': out, 'steps': int(steps), 'cfg': float(cfg), 'size': int(size), 'jobs': json.load(open(jf, encoding='utf-8'))}, open(o, 'w', encoding='utf-8'), ensure_ascii=False)
