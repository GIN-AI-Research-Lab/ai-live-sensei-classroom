#!/bin/bash
# setup-edit.sh - cai them cho Qwen-Image-Edit-2511 (chay SAU setup.sh; can ~/hf/Qwen-Image-2512 da tai xong).
# LUU Y: tai dung theo ghi chep cac lenh da chay tay tren VM (khong phai script goc, chua chay nguyen van). Cac thanh phan khop voi VM cu:
#  - torchvision 0.21.0+cu124 (khop torch 2.6.0+cu124); thieu/khac phien ban thi processor cua Edit loi
#  - transformer Edit ~41 GB (5 tep) + processor/scheduler; text_encoder, tokenizer, vae dung LAI cua Qwen-Image-2512 qua symlink (sha256 trung khop)
#    => KHONG xoa ~/hf/Qwen-Image-2512/text_encoder|tokenizer|vae. Chi co the xoa ~/hf/Qwen-Image-2512/transformer (~41 GB) khi can cho trong.
#  - LoRA Lightning Edit-2511 (4 va 8 buoc); gen-edit2.py chi dung ban 8 buoc
# Truoc khi chay: chep vm/gen-edit2.py vm/tai-edit.py vm/tai-lora.py vm/gen.py vm/lam-nen.py vao ~/nv (xem README.md muc 5).
set -ex
source ~/venv-qi/bin/activate
pip install -q torchvision==0.21.0 --index-url https://download.pytorch.org/whl/cu124
df -h /       # can >= 45 GB trong cho transformer Edit
cd ~/nv
python tai-edit.py 1,2,3,4,5      # tham so = so thu tu cac shard transformer (1..5); co the chay 2 tien trinh song song voi "1,2" va "3,4,5"
python tai-lora.py
cd ~/hf/Qwen-Image-Edit-2511
ln -sfn ../Qwen-Image-2512/text_encoder text_encoder
ln -sfn ../Qwen-Image-2512/tokenizer tokenizer
ln -sfn ../Qwen-Image-2512/vae vae
ls -la ~/hf/Qwen-Image-Edit-2511
du -sh ~/hf/*
df -h /
echo SETUP_EDIT_DONE
