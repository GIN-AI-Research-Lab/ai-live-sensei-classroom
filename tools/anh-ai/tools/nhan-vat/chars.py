# chars.py - contact sheet theo nhom nhan vat: python chars.py <thu-muc-expr> <ra.png> <id...>
# cot: goc(ref), kin(binh_thuong sua), vui, hoi, gian, ngac_nhien, hao_hung, buon. Uu tien file trong thu muc regen (expr/r*) neu co.
import sys, os, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheet import sheet
# PATHS: chay trong thu muc lam viec nhan vat $ANH_AI_WORK/nv (co refs28/, expr/...)
_NV = os.path.join(os.environ.get('ANH_AI_WORK') or os.path.join(os.path.expanduser('~'), 'anh-ai-work'), 'nv'); os.makedirs(_NV, exist_ok=True); os.chdir(_NV)
K = ['ref', 'binh_thuong', 'vui', 'hoi', 'gian', 'ngac_nhien', 'hao_hung', 'buon']
d, out = sys.argv[1], sys.argv[2]; ids = sys.argv[3:]
def tim(i, k):
    if k == 'ref': return 'refs28/%s.png' % i
    for r in sorted(glob.glob('expr/rsel'), reverse=True):
        p = '%s/%s__%s.png' % (r, i, k)
        if os.path.exists(p): return p
    if k == 'hoi': return 'expr/hoi-final/%s__hoi.png' % i
    return '%s/%s__%s.png' % (d, i, k)
fs = [tim(i, k) for i in ids for k in K]
ls = ['%s %s' % (i, 'base' if k == 'ref' else ('kin' if k == 'binh_thuong' else k)) for i in ids for k in K]
sheet(fs, ls, out, cols=8, cell=200)
