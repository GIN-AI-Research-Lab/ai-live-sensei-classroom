import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheet import sheet
# PATHS: chay trong thu muc lam viec nhan vat $ANH_AI_WORK/nv (co refs28/, expr/...)
_NV = os.path.join(os.environ.get('ANH_AI_WORK') or os.path.join(os.path.expanduser('~'), 'anh-ai-work'), 'nv'); os.makedirs(_NV, exist_ok=True); os.chdir(_NV)
d=sys.argv[1]; out=sys.argv[2]; names=sys.argv[3:]
K=['binh_thuong','vui','hoi','gian','ngac_nhien','hao_hung','buon']
sheet([f'expr/{d}/{n}__{k}.png' for n in names for k in K],[n+' '+k for n in names for k in K],out,cols=7,cell=256)
