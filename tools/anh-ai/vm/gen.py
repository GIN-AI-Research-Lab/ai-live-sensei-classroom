# gen.py - sinh anh minh hoa bang Qwen-Image-2512 (diffusers)
# Chay lai an toan: anh da co thi bo qua. Ghi log vao <out>/log.txt
# Vi du:
#   nohup python gen.py --items probe-items.json --out ~/anh/probe-light --mode light --seeds 11,22 &
#   nohup python gen.py --items probe-items.json --out ~/anh/probe-base --mode base --steps 50 --cfg 4 --seeds 11 &
import argparse, json, os, sys, time, math, gc
import torch

MODEL = os.path.expanduser('~/hf/Qwen-Image-2512')
LORA_DIR = os.path.expanduser('~/hf/Qwen-Image-2512-Lightning')

ap = argparse.ArgumentParser()
ap.add_argument('--items', required=True)
ap.add_argument('--out', default=os.path.expanduser('~/anh'))
ap.add_argument('--mode', choices=['base', 'light'], default='light')
ap.add_argument('--steps', type=int, default=0)       # 0 = mac dinh theo mode
ap.add_argument('--cfg', type=float, default=-1)      # -1 = mac dinh theo mode
ap.add_argument('--seeds', default='11')
ap.add_argument('--size', type=int, default=1024)
ap.add_argument('--storage', choices=['bf16', 'fp8'], default='bf16')  # fp8 = luu trong so fp8, tinh bf16
ap.add_argument('--lora', default='Qwen-Image-2512-Lightning-8steps-V1.0-bf16.safetensors')
ap.add_argument('--only', default='')                 # loc theo ten, cach nhau dau phay
ap.add_argument('--style', default='')                # ghi de hau to phong cach (neu can thu)
ap.add_argument('--chunk', type=int, default=64)      # so prompt ma hoa moi dot
a = ap.parse_args()

if a.steps == 0:
    a.steps = 8 if a.mode == 'light' else 50
if a.cfg < 0:
    a.cfg = 1.0 if a.mode == 'light' else 4.0

os.makedirs(a.out, exist_ok=True)
LOG = open(os.path.join(a.out, 'log.txt'), 'a', encoding='utf-8')


def log(*s):
    msg = time.strftime('%H:%M:%S ') + ' '.join(str(x) for x in s)
    print(msg, flush=True)
    LOG.write(msg + '\n'); LOG.flush()


data = json.load(open(a.items, encoding='utf-8'))
# style chung: neu tep co "styleRef" thi doc style + negativeBase tu tep do (duong dan tuong doi theo tep items)
NEG_BASE = ''
STYLE_VAT, NEG_VAT = None, ''
if data.get('styleRef'):
    ref = json.load(open(os.path.join(os.path.dirname(os.path.abspath(a.items)), data['styleRef']), encoding='utf-8'))
    style = ref['style']
    NEG_BASE = ref.get('negativeBase', '')
    STYLE_VAT = ref.get('styleVat')          # style rieng cho muc chi co do vat (item "vat": true)
    NEG_VAT = ref.get('negativeVat', '')
else:
    style = data.get('style', '')
if a.style:
    style = a.style
seeds = [int(s) for s in a.seeds.split(',') if s.strip()]
only = set(t for t in a.only.split(',') if t)


def gop_neg(*ds):
    # hop cac cum tu negative, bo trung (khong phan biet hoa thuong), bo 'none extra'
    ra, thay = [], set()
    for s in ds:
        for t in (s or '').split(','):
            t = t.strip()
            if not t or t.lower() == 'none extra' or t.lower() in thay:
                continue
            thay.add(t.lower()); ra.append(t)
    return ', '.join(ra)


# danh sach viec con thieu (moi tep ra chi 1 lan: muc dungLai trung ten bi bo qua)
viec, da_co = [], set()
for it in data['items']:
    if only and it['ten'] not in only:
        continue
    for sd in ([int(it['seed'])] if it.get('seed') else seeds):  # muc co 'seed' rieng thi dung seed do
        ten_tep = it['ten'] + ('.png' if len(seeds) == 1 or it.get('seed') else '-s%d.png' % sd)
        p = os.path.join(a.out, ten_tep)
        if p in da_co:
            continue
        da_co.add(p)
        if not os.path.exists(p):
            viec.append((it, sd, p))
log('style: %s | negBase %d ky tu' % (style[:80], len(NEG_BASE)))
log('==== bat dau mode=%s steps=%d cfg=%.1f storage=%s size=%d con %d anh' % (a.mode, a.steps, a.cfg, a.storage, a.size, len(viec)))
if not viec:
    log('khong con gi de lam'); sys.exit(0)

from diffusers import QwenImagePipeline, FlowMatchEulerDiscreteScheduler

t0 = time.time()
pipe = QwenImagePipeline.from_pretrained(MODEL, torch_dtype=torch.bfloat16)
log('nap pipeline (CPU) %.1fs' % (time.time() - t0))

if a.mode == 'light':
    # cau hinh scheduler theo huong dan Qwen-Image-Lightning
    sc = {
        'base_image_seq_len': 256, 'base_shift': math.log(3), 'invert_sigmas': False,
        'max_image_seq_len': 8192, 'max_shift': math.log(3), 'num_train_timesteps': 1000,
        'shift': 1.0, 'shift_terminal': None, 'stochastic_sampling': False,
        'time_shift_type': 'exponential', 'use_beta_sigmas': False, 'use_dynamic_shifting': True,
        'use_exponential_sigmas': False, 'use_karras_sigmas': False,
    }
    pipe.scheduler = FlowMatchEulerDiscreteScheduler.from_config(sc)
    t1 = time.time()
    pipe.load_lora_weights(LORA_DIR, weight_name=a.lora, adapter_name='light')
    pipe.fuse_lora(lora_scale=1.0)
    pipe.unload_lora_weights()
    log('gop LoRA %s %.1fs' % (a.lora, time.time() - t1))

# 1) ma hoa prompt bang text encoder tren GPU, roi bo text encoder khoi GPU
t1 = time.time()
pipe.text_encoder.to('cuda')
emb = {}
NEG_DEFAULT = ' '


@torch.no_grad()
def ma_hoa(txt):
    pe, pm = pipe.encode_prompt(prompt=[txt], device=torch.device('cuda'), num_images_per_prompt=1)
    return pe.cpu(), (pm.cpu() if pm is not None else None)


for it, sd, p in viec:
    k = it['ten']
    if k in emb:
        continue
    vat = bool(it.get('vat')) and STYLE_VAT and not a.style
    full = it['prompt'].strip() + ' ' + (STYLE_VAT if vat else style)
    pos = ma_hoa(full)
    neg = ma_hoa(gop_neg(NEG_BASE, NEG_VAT if vat else '', it.get('negative')) or NEG_DEFAULT) if a.cfg > 1 else (None, None)
    emb[k] = (pos, neg)
log('ma hoa %d prompt %.1fs (vat: %d)' % (len(emb), time.time() - t1, sum(1 for it, _, _ in viec if it.get('vat')) if STYLE_VAT else 0))
pipe.text_encoder.to('cpu')
te = pipe.text_encoder
pipe.text_encoder = None
del te; gc.collect(); torch.cuda.empty_cache()

# 2) transformer + vae len GPU
t1 = time.time()
if a.storage == 'fp8':
    pipe.transformer.enable_layerwise_casting(storage_dtype=torch.float8_e4m3fn, compute_dtype=torch.bfloat16)
pipe.transformer.to('cuda')
pipe.vae.to('cuda')
pipe.vae.enable_tiling()
log('dua transformer+vae len GPU %.1fs, VRAM %.1f GiB' % (time.time() - t1, torch.cuda.memory_allocated() / 2**30))

tong = []
for i, (it, sd, p) in enumerate(viec):
    (pe, pm), (ne, nm) = emb[it['ten']]
    kw = dict(prompt_embeds=pe.cuda(), prompt_embeds_mask=(pm.cuda() if pm is not None else None),
              width=a.size, height=a.size, num_inference_steps=a.steps, true_cfg_scale=a.cfg,
              generator=torch.Generator('cuda').manual_seed(sd))
    if a.cfg > 1:
        kw.update(negative_prompt_embeds=ne.cuda(), negative_prompt_embeds_mask=(nm.cuda() if nm is not None else None))
    torch.cuda.synchronize(); t1 = time.time()
    img = pipe(**kw).images[0]
    torch.cuda.synchronize(); dt = time.time() - t1
    img.save(p + '.tmp.png'); os.replace(p + '.tmp.png', p)
    tong.append(dt)
    log('[%d/%d] %s seed=%d %.1fs peak=%.1fGiB' % (i + 1, len(viec), os.path.basename(p), sd, dt, torch.cuda.max_memory_allocated() / 2**30))

bo_dau = tong[1:] if len(tong) > 1 else tong
log('==== xong %d anh, trung binh %.2fs/anh (bo anh dau: %.2fs), tong %.1fs' % (
    len(tong), sum(tong) / len(tong), sum(bo_dau) / len(bo_dau), time.time() - t0))
