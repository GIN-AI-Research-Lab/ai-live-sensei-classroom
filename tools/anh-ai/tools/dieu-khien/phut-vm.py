# phut-vm.py - tinh phut VM tu so-vm.log (dong: ngay gio epoch SU_KIEN ...). Khoang sau su kien "song" duoc tinh tien.
import sys, time
SONG = {'BAT', 'DANG_CHAY_SAN', 'SONG'}
tu = int(sys.argv[2]) if len(sys.argv) > 2 else 0
dong = [l.split() for l in open(sys.argv[1], encoding='utf-8') if l.strip()]
ev = [(int(x[2]), x[3]) for x in dong if len(x) > 3 and int(x[2]) >= tu]
s = 0
for (t, e), (t2, _) in zip(ev, ev[1:]):
    if e in SONG:
        s += t2 - t
if ev and ev[-1][1] in SONG:
    s += int(time.time()) - ev[-1][0]
print('%.1f' % (s / 60))
