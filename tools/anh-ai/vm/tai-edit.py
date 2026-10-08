# tai-edit.py - tai Qwen-Image-Edit-2511 (Apache-2.0): chi transformer + processor + cau hinh; text_encoder/vae/tokenizer dung lai cua 2512 (sha256 trung khop)
import os, sys, time
os.environ['HF_HUB_ENABLE_HF_TRANSFER'] = '1'
from huggingface_hub import snapshot_download
shards = [int(x) for x in sys.argv[1].split(',')]
pat = ['model_index.json', 'scheduler/*', 'processor/*', 'transformer/config.json', 'transformer/*.index.json', 'README.md']
pat += ['transformer/diffusion_pytorch_model-%05d-of-00005.safetensors' % i for i in shards]
t0 = time.time()
snapshot_download('Qwen/Qwen-Image-Edit-2511', revision=os.environ.get('HF_REV_EDIT', '6f3ccc0b56e431dc6a0c2b2039706d7d26f22cb9'), local_dir=os.path.expanduser('~/hf/Qwen-Image-Edit-2511'), allow_patterns=pat)
print('TAI XONG', shards, '%.0fs' % (time.time() - t0))
