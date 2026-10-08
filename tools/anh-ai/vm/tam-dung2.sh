#!/bin/bash
# tam-dung2.sh - dung vong chay chinh (truoc) roi gen, bat lai ban cho ~/p/DI; chay probe v6; xong probe thi tu dat DI de chay tiep
rm -f ~/p/DI
pkill -f 'chay-full[.]sh'
sleep 1
pkill -f "gen[.]py --items $HOME/p/prompt-"
sleep 3
echo "gen con: $(pgrep -fc 'gen[.]py')"
nohup ~/chay-full.sh > ~/chay-full.out 2>&1 < /dev/null &
source ~/venv-qi/bin/activate; cd ~/p
nohup bash -c "python ~/gen.py --items ~/p/probe-items-v6.json --out ~/anh/probe/base20-v6 --mode base --steps 20 --cfg 4 --seeds 11 > ~/anh/run-v6.log 2>&1; echo TAT_CA_XONG >> ~/anh/run-v6.log" > /dev/null 2>&1 < /dev/null &
sleep 1; echo "cho DI: $(pgrep -fc 'chay-full[.]sh') probe: $(pgrep -fc 'probe-items-v6')"
