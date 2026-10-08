# sheet.py - ghep contact sheet co nhan
import sys, os
from PIL import Image, ImageDraw
def sheet(files, labels, out, cols=6, cell=256):
    rows=(len(files)+cols-1)//cols
    W=cols*cell; H=rows*(cell+18)
    im=Image.new('RGB',(W,H),(240,235,225)); d=ImageDraw.Draw(im)
    for i,(f,l) in enumerate(zip(files,labels)):
        x=(i%cols)*cell; y=(i//cols)*(cell+18)
        try:
            t=Image.open(f).convert('RGB').resize((cell,cell),Image.LANCZOS); im.paste(t,(x,y+18))
        except Exception as e: d.text((x+4,y+40),'ERR',fill=(200,0,0))
        d.rectangle([x,y,x+cell,y+17],fill=(30,30,30)); d.text((x+4,y+3),l,fill=(255,255,255))
    im.save(out)
if __name__=='__main__':
    import glob
    # PATHS: SENSEI_REPO = goc repo (mac dinh 4 cap tren tep nay)
    _R = os.environ.get('SENSEI_REPO') or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
    fs=sorted(glob.glob(os.path.join(_R, 'assets', 'minh-hoa', 'nv-*.webp')))
    sheet(fs,[os.path.basename(f) for f in fs],sys.argv[1],cols=6,cell=256)
