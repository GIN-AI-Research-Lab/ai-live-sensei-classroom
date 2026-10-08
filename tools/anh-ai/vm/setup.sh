#!/bin/bash
# setup.sh - cai moi truong + tai trong so Qwen-Image-2512 (chay nohup)
set -x
cd ~
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
df -h ~ /
free -g
PY=python3
if [ ! -d ~/venv-qi ]; then
  $PY -m venv ~/venv-qi || { sudo apt-get update -y && sudo apt-get install -y python3-venv && $PY -m venv ~/venv-qi; }
fi
source ~/venv-qi/bin/activate
pip install -q --upgrade pip
# torch cu124 (driver phai >= 550)
pip install -q torch --index-url https://download.pytorch.org/whl/cu124
pip install -q "diffusers>=0.36" transformers accelerate peft safetensors "huggingface_hub[hf_transfer]" sentencepiece pillow
python -c "import torch,diffusers,transformers;print('torch',torch.__version__,torch.cuda.is_available(),'diffusers',diffusers.__version__,'transformers',transformers.__version__)"
export HF_HUB_ENABLE_HF_TRANSFER=1
mkdir -p ~/hf
t0=$(date +%s)
python - <<'EOF'
from huggingface_hub import snapshot_download, hf_hub_download
import os
snapshot_download('Qwen/Qwen-Image-2512', revision='25468b98e3276ca6700de15c6628e51b7de54a26', local_dir=os.path.expanduser('~/hf/Qwen-Image-2512'))  # revision = commit da dung (ghi tu .cache/huggingface cua VM)
hf_hub_download('lightx2v/Qwen-Image-2512-Lightning', 'Qwen-Image-2512-Lightning-8steps-V1.0-bf16.safetensors', local_dir=os.path.expanduser('~/hf/Qwen-Image-2512-Lightning'))
print('TAI XONG')
EOF
echo "thoi gian tai: $(( $(date +%s) - t0 ))s"
du -sh ~/hf/*
df -h ~
echo SETUP_DONE
