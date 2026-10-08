# liet ke ung vien (tinh tu / cam xuc / nhan thuc) trong cac tep prompt
import json, os, re
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')   # PATHS
def loai_tu():
    t = {}
    for ln in open(os.path.join(DATA, 'n4-dump.txt'), encoding='utf-8'):
        p = ln.rstrip('\n').split('|')
        if len(p) > 4 and p[0].startswith('voc-'):
            t[p[0]] = (p[3], p[1], p[2], p[4])
    for x in json.load(open(os.path.join(DATA, 'n3-vocab-flat.json'), encoding='utf-8')):
        t[x['id']] = (x['t'], x['w'], x['k'], x['m'])
    return t
LT = loai_tu()
DONG_TU = r'分か|知|考え|忘れ|思い出|思|困|心配|喜|悲|怒|驚|迷|悩|疲|困|安心|緊張|びっくり|がっかり|ほっと|楽しみ|感じ|気がつ|気づ|覚え|理解|誤解|勘違|信じ|疑|諦め|後悔|恥|泣|笑|怖|嫌|好|愛|恋|憧|羨|慌|焦|照|飽き|我慢|期待|満足|反省|感動|感謝|退屈|混乱|困惑|惚|憎|嘆|悔|恨'
def ung_vien(f):
    d = json.load(open(f, encoding='utf-8'))
    ra = []
    for x in d['items']:
        wt = x.get('wordType') or LT.get(x['id'], ('?',))[0]
        w = (x.get('kanji') or '') + ' ' + (x.get('word') or LT.get(x['id'], ('', '', '', ''))[2] or '') + ' ' + LT.get(x['id'], ('', '', '', ''))[1]
        m = x.get('nghia') or x.get('meaningVi') or LT.get(x['id'], ('', '', '', ''))[3]
        ok = wt == 'adjective' or (wt in ('verb', 'noun', 'expression') and re.search(DONG_TU, w))
        if ok:
            ra.append((x['ten'], wt, w.strip(), m, x.get('dungLai'), x['prompt']))
    return ra
if __name__ == '__main__':
    import sys
    for f in sys.argv[1:]:
        r = ung_vien(f)
        print('=====', f, len(r), 'unique ten', len(set(a[0] for a in r if not a[4])))
        for a in r:
            if not a[4]:
                print('%s\t%s\t%s\t%s\t%s' % (a[0], a[1], a[2], a[3], a[5][:150]))
