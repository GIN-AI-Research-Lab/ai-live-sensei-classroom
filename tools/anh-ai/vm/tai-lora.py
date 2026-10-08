import os
os.environ['HF_HUB_ENABLE_HF_TRANSFER'] = '1'
from huggingface_hub import hf_hub_download
for f in ['Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors', 'Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors']:
    hf_hub_download('lightx2v/Qwen-Image-Edit-2511-Lightning', f, revision=os.environ.get('HF_REV_LORA', 'd74eba145674fd7e31b949324e148e21e7118abd'), local_dir=os.path.expanduser('~/hf/Qwen-Image-Edit-2511-Lightning'))
print('LORA XONG')
