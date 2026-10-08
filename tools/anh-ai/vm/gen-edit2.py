# gen-edit2.py - may chu Qwen-Image-Edit-2511 (Apache-2.0) + Lightning: nap mot lan, nhan viec tu ~/nv/inbox/*.json
# Moi tep: {"out":"/duong/dan","steps":8,"cfg":1.0,"size":1024,"jobs":[{"ten","ref","prompt","seed"}]}. Resume-safe (anh co roi thi bo qua).
# Xong tep -> doi ten .json thanh .xong. Tep ten STOP trong inbox -> thoat.
import argparse, json, os, sys, time, math, gc, glob
import torch
from PIL import Image

MODEL = os.path.expanduser('~/hf/Qwen-Image-Edit-2511')
LORA_DIR = os.path.expanduser('~/hf/Qwen-Image-Edit-2511-Lightning')
INBOX = os.path.expanduser('~/nv/inbox')
ap = argparse.ArgumentParser()
ap.add_argument('--lora', default='Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors')
a = ap.parse_args()
os.makedirs(INBOX, exist_ok=True)
def log(*s):
    m = time.strftime('%H:%M:%S ') + ' '.join(str(x) for x in s)
    print(m, flush=True)

from diffusers import QwenImageEditPlusPipeline, FlowMatchEulerDiscreteScheduler
t0 = time.time()
pipe = QwenImageEditPlusPipeline.from_pretrained(MODEL, torch_dtype=torch.bfloat16)
sc = {'base_image_seq_len': 256, 'base_shift': math.log(3), 'invert_sigmas': False, 'max_image_seq_len': 8192,
      'max_shift': math.log(3), 'num_train_timesteps': 1000, 'shift': 1.0, 'shift_terminal': None,
      'stochastic_sampling': False, 'time_shift_type': 'exponential', 'use_beta_sigmas': False,
      'use_dynamic_shifting': True, 'use_exponential_sigmas': False, 'use_karras_sigmas': False}
pipe.scheduler = FlowMatchEulerDiscreteScheduler.from_config(sc)
pipe.load_lora_weights(LORA_DIR, weight_name=a.lora, adapter_name='light')
pipe.fuse_lora(lora_scale=1.0); pipe.unload_lora_weights()
log('nap+gop LoRA %.1fs' % (time.time() - t0))
pipe.transformer.enable_layerwise_casting(storage_dtype=torch.float8_e4m3fn, compute_dtype=torch.bfloat16)
pipe.transformer.to('cuda'); pipe.vae.to('cuda'); pipe.vae.enable_tiling(); pipe.text_encoder.to('cuda')
log('tat ca len GPU %.1fs VRAM %.1f GiB' % (time.time() - t0, torch.cuda.memory_allocated() / 2**30))
CONDITION = 384 * 384
def cond_img(img):
    w, h = img.size; r = w / h
    cw = round(math.sqrt(CONDITION * r) / 32) * 32; ch = round(CONDITION / cw / 32) * 32
    return pipe.image_processor.resize(img, ch, cw)
imgs = {}
def nap(ref, size):
    k = (ref, size)
    if k not in imgs:
        imgs[k] = Image.open(ref).convert('RGB').resize((size, size), Image.LANCZOS)
    return imgs[k]
log('san sang')
while True:
    fs = sorted(glob.glob(INBOX + '/*.json'), key=lambda x: (not os.path.basename(x).startswith('p-'), x))
    if os.path.exists(INBOX + '/STOP'):
        log('STOP'); break
    if not fs:
        time.sleep(3); continue
    f = fs[0]
    try:
        spec = json.load(open(f, encoding='utf-8'))
    except Exception:
        time.sleep(2); continue   # tep dang ghi do
    out = os.path.expanduser(spec['out']); os.makedirs(out, exist_ok=True)
    steps = spec.get('steps', 8); cfg = spec.get('cfg', 1.0); size = spec.get('size', 1024)
    neg = spec.get('negative', 'text, symbols, sweat drops, sparkles, open mouth, teeth, white dots, speckles, sticker outline, different clothes')
    viec = [(j, os.path.join(out, j['ten'] + '.png')) for j in spec['jobs']]
    viec = [(j, p) for j, p in viec if not os.path.exists(p)]
    log('tep %s: con %d anh steps=%d cfg=%.1f size=%d' % (os.path.basename(f), len(viec), steps, cfg, size))
    tong = []
    for i, (j, p) in enumerate(viec):
        if not os.path.basename(f).startswith('p-') and glob.glob(INBOX + '/p-*.json'):
            log('nhuong tep uu tien'); break
        img = nap(j['ref'], size)
        ci = cond_img(img)
        with torch.no_grad():
            pe, pm = pipe.encode_prompt(prompt=[j['prompt']], image=[ci], device=torch.device('cuda'), num_images_per_prompt=1)
            kw = dict(image=[img], prompt_embeds=pe, prompt_embeds_mask=pm, height=size, width=size, num_inference_steps=steps,
                      true_cfg_scale=cfg, generator=torch.Generator('cuda').manual_seed(int(j.get('seed', 7))))
            if cfg > 1:
                ne, nm = pipe.encode_prompt(prompt=[j.get('negative', neg)], image=[ci], device=torch.device('cuda'), num_images_per_prompt=1)
                kw.update(negative_prompt_embeds=ne, negative_prompt_embeds_mask=nm)
            torch.cuda.synchronize(); t1 = time.time()
            res = pipe(**kw).images[0]
            torch.cuda.synchronize(); dt = time.time() - t1
        res.save(p + '.tmp.png'); os.replace(p + '.tmp.png', p)
        tong.append(dt)
        log('[%d/%d] %s %.1fs peak=%.1fGiB' % (i + 1, len(viec), j['ten'], dt, torch.cuda.max_memory_allocated() / 2**30))
    if tong:
        log('xong tep %s: %d anh tb %.2fs/anh' % (os.path.basename(f), len(tong), sum(tong) / len(tong)))
    if len(tong) == len(viec):
        os.replace(f, f[:-5] + '.xong')
