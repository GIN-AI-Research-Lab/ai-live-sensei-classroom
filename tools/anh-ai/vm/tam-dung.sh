#!/bin/bash
# tam-dung.sh - dung gen dang chay, thay script chay chinh bang ban co cho ~/p/DI, cat anh hong sang full-hong-v4
pkill -f "gen[.]py --items $HOME/p/prompt-"
sleep 3
mv ~/chay-full.sh.moi ~/chay-full.sh; chmod +x ~/chay-full.sh
rm -f ~/p/DI
mkdir -p ~/anh/full-hong-v4
[ -d ~/anh/full/n5 ] && mv ~/anh/full/n5 ~/anh/full-hong-v4/
echo "gen con: $(pgrep -fc 'gen[.]py')"; echo "anh hong: $(ls ~/anh/full-hong-v4/n5 | wc -l)"
nohup ~/chay-full.sh > ~/chay-full.out 2>&1 < /dev/null &
sleep 1; echo "cho DI: $(pgrep -fc 'chay-full[.]sh')"
