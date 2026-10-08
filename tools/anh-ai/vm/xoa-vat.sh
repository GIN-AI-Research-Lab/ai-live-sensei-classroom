#!/bin/bash
# xoa-vat.sh - xoa anh n5 cua cac muc do vat (sinh bang style cu, co mat kawaii) de vong chinh sinh lai bang styleVat; bo khoi da-gui
cd ~/anh/full/n5 || exit 0
n=0
while read t; do [ -f "$t.png" ] && { mkdir -p ~/anh/full-hong-v5/n5; mv "$t.png" ~/anh/full-hong-v5/n5/; n=$((n+1)); }; grep -vx "n5/$t.png" ~/anh/da-gui.txt > ~/anh/da-gui.tmp; mv ~/anh/da-gui.tmp ~/anh/da-gui.txt; done < ~/xoa-vat-n5.txt
echo "da chuyen $n anh vat"; ls ~/anh/full/n5 | wc -l
touch ~/p/DI; sudo shutdown -h +90 > /dev/null 2>&1; echo DI
