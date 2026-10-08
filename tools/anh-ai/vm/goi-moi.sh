#!/bin/bash
# goi-moi.sh [thu-muc-con=full] [--xac-nhan] - dong goi PNG moi (chua gui) trong ~/anh/<thu-muc-con> vao ~/anh/goi/moi-<tmc>.tar, in so tep.
# Danh sach da gui: ~/anh/da-gui[-<tmc>].txt (ghi sau khi may local tai xong: --xac-nhan)
T=${1:-full}; [ "$T" = "--xac-nhan" ] && { T=full; X=1; }; [ "$2" = "--xac-nhan" ] && X=1
DS=~/anh/da-gui.txt; [ "$T" != "full" ] && DS=~/anh/da-gui-$T.txt
mkdir -p ~/anh/goi; cd ~/anh/$T 2>/dev/null || { echo 0; exit 0; }
touch $DS
if [ "$X" = "1" ]; then cat ~/anh/goi/moi-$T.lst >> $DS; sort -u -o $DS $DS; rm -f ~/anh/goi/moi-$T.tar; echo ok; exit 0; fi
find . -name '*.png' ! -name '*.tmp.png' | sed 's|^\./||' | sort > ~/anh/goi/tat-ca-$T.lst
comm -23 ~/anh/goi/tat-ca-$T.lst $DS > ~/anh/goi/moi-$T.lst
n=$(wc -l < ~/anh/goi/moi-$T.lst)
rm -f ~/anh/goi/moi-$T.tar
[ "$n" -gt 0 ] && tar -cf ~/anh/goi/moi-$T.tar -T ~/anh/goi/moi-$T.lst
echo $n
