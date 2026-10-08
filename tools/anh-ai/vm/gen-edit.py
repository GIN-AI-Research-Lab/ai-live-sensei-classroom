# gen-edit.py - sinh bien the bieu cam bang Qwen-Image-Edit-2511 (Apache-2.0) + Lightning LoRA.
# Resume-safe: anh da co thi bo qua. jobs.json = [{"ten":"miller__vui","ref":"/path/base.png","prompt":"...","seed":7}]
# Bo nho: text encoder (16.6 GB) ma hoa het prompt truoc, bo di, roi transformer (luu fp8) len GPU.
import argparse, json, os, sys, time, math, gc
import torch
from PIL import Image

MODEL = os.path.expanduser('~/hf/Qwen-Image-Edit-2511')
LORA_DIR = os.path.expanduser('~/hf/Qwen-Image-Edit-2511-Lightning')

ap = argparse.ArgumentParser()
ap.add_argument('--jobs', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--steps', type=int, default=8)
ap.add_argument('--cfg', type=float, default=1.0)       # Lightning: 1.0 = khong negative
ap.add_argument('--lora', default='Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors')  # 'none' = khong LoRA
ap.add_argument('--size', type=int, default=1024)
ap.add_argument('--only', default='')
ap.add_argument('--neg', default='text, letters, symbols, sweat drops, anger veins, sparkles, hearts, question mark, exclamation mark, open mouth, teeth, tongue, blush marks, different clothes, different hair, extra people, background change')
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
LOG = open(os.path.join(a.out, 'log.txt'), 'a', encoding='utf-8')
def log(*s):
    m = time.strftime('%H:%M:%S ') + ' '.join(str(x) for x in s)
    print(m, flush=True); LOG.write(m + '\n'); LOG.flush()

jobs = json.load(open(a.jobs, encoding='utf-8'))
only = set(t for t in a.only.split(',') if t)
viec = []
for j in jobs:
    if only and j['ten'] not in only and j['ten'].split('__')[0] not in only:
        continue
    p = os.path.join(a.out, j['ten'] + '.png')
    if not os.path.exists(p):
        viec.append((j, p))
log('==== bat dau steps=%d cfg=%.1f lora=%s size=%d con %d anh' % (a.steps, a.cfg, a.lora, a.size, len(viec)))
if not viec:
    log('khong con gi de lam'); sys.exit(0)

from diffusers import QwenImageEditPlusPipeline, FlowMatchEulerDiscreteScheduler
t0 = time.time()
pipe = QwenImageEditPlusPipeline.from_pretrained(MODEL, torch_dtype=torch.bfloat16)
log('nap pipeline (CPU) %.1fs' % (time.time() - t0))
if a.lora != 'none':
    sc = {'base_image_seq_len': 256, 'base_shift': math.log(3), 'invert_sigmas': False, 'max_image_seq_len': 8192,
          'max_shift': math.log(3), 'num_train_timesteps': 1000, 'shift': 1.0, 'shift_terminal': None,
          'stochastic_sampling': False, 'time_shift_type': 'exponential', 'use_beta_sigmas': False,
          'use_dynamic_shifting': True, 'use_exponential_sigmas': False, 'use_karras_sigmas': False}
    pipe.scheduler = FlowMatchEulerDiscreteScheduler.from_config(sc)
    t1 = time.time()
    pipe.load_lora_weights(LORA_DIR, weight_name=a.lora, adapter_name='light')
    pipe.fuse_lora(lora_scale=1.0)
    pipe.unload_lora_weights()
    log('gop LoRA %s %.1fs' % (a.lora, time.time() - t1))

# 1) ma hoa prompt (kem anh dieu kien) bang text encoder tren GPU
t1 = time.time()
pipe.text_encoder.to('cuda')
imgs, emb = {}, {}
def nap(ref):
    if ref not in imgs:
        imgs[ref] = Image.open(ref).convert('RGB').resize((a.size, a.size), Image.LANCZOS)
    return imgs[ref]
CONDITION = 384 * 384
def cond_img(img):
    w, h = img.size
    r = w / h
    cw = round(math.sqrt(CONDITION * r) / 32) * 32; ch = round(CONDITION / cw / 32) * 32 if cw else 384
    return pipe.image_processor.resize(img, ch, cw)
@torch.no_grad()
def ma_hoa(img, txt):
    pe, pm = pipe.encode_prompt(prompt=[txt], image=[cond_img(img)], device=torch.device('cuda'), num_images_per_prompt=1)
    return pe.cpu(), (pm.cpu() if pm is not None else None)
for j, p in viec:
    img = nap(j['ref'])
    emb[j['ten']] = ma_hoa(img, j['prompt'])
    if a.cfg > 1:
        emb[j['ten'] + '#neg'] = ma_hoa(img, j.get('negative', a.neg))
log('ma hoa %d prompt %.1fs' % (len(viec), time.time() - t1))
pipe.text_encoder.to('cpu'); te = pipe.text_encoder; pipe.text_encoder = None; del te
gc.collect(); torch.cuda.empty_cache()

# 2) transformer (fp8 luu tru) + vae len GPU
t1 = time.time()
pipe.transformer.enable_layerwise_casting(storage_dtype=torch.float8_e4m3fn, compute_dtype=torch.bfloat16)
pipe.transformer.to('cuda'); pipe.vae.to('cuda'); pipe.vae.enable_tiling()
log('dua transformer(fp8)+vae len GPU %.1fs, VRAM %.1f GiB' % (time.time() - t1, torch.cuda.memory_allocated() / 2**30))

tong = []
for i, (j, p) in enumerate(viec):
    pe, pm = emb[j['ten']]
    kw = dict(image=[nap(j['ref'])], prompt_embeds=pe.cuda(), prompt_embeds_mask=(pm.cuda() if pm is not None else None),
              height=a.size, width=a.size, num_inference_steps=a.steps, true_cfg_scale=a.cfg,
              generator=torch.Generator('cuda').manual_seed(int(j.get('seed', 7))))
    if a.cfg > 1:
        ne, nm = emb[j['ten'] + '#neg']
        kw.update(negative_prompt_embeds=ne.cuda(), negative_prompt_embeds_mask=(nm.cuda() if nm is not None else None))
    torch.cuda.synchronize(); t1 = time.time()
    out = pipe(**kw).images[0]
    torch.cuda.synchronize(); dt = time.time() - t1
    out.save(p + '.tmp.png'); os.replace(p + '.tmp.png', p)
    tong.append(dt)
    log('[%d/%d] %s %.1fs peak=%.1fGiB' % (i + 1, len(viec), j['ten'], dt, torch.cuda.max_memory_allocated() / 2**30))
bo = tong[1:] if len(tong) > 1 else tong
log('==== xong %d anh, tb %.2fs/anh (bo anh dau %.2fs), tong %.1fs' % (len(tong), sum(tong) / len(tong), sum(bo) / len(bo), time.time() - t0))
