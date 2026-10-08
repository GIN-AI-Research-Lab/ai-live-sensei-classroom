# ghep-tieng.py — tron WAV that (tao-tieng.mjs) vao video da quay (quay.mjs): dat tung dong dung luc phat that trong timeline-<che>.json
#   python tools/che-do/video/ghep-tieng.py --che s [--ra E:/sensei-tam/video/n5-1] [--hau ""] [--ra-file video-s.mp4]
# Tieng: Sensei (Charon) va nhan vat hoi thoai, 24 kHz mono -> 48 kHz; dinh -3 dBFS da chuan hoa tung dong, nen chung chuan hoa ~ -16 LUFS (xap xi theo RMS).
# Khong co nhac nen / SFX (chua lam). Mux: -c:v copy (khong ma hoa lai hinh).
import argparse, json, os, subprocess, sys, wave
import numpy as np
from scipy.signal import resample_poly

ap = argparse.ArgumentParser()
ap.add_argument('--che', required=True)
ap.add_argument('--ra', default='E:/sensei-tam/video/n5-1')
ap.add_argument('--hau', default='')
ap.add_argument('--ra-file', default=None)
a = ap.parse_args()

tl = json.load(open(f'{a.ra}/timeline-{a.che}{a.hau}.json', encoding='utf8'))
man = json.load(open(f'{a.ra}/tieng/manifest.json', encoding='utf8'))['lines']
SR = 48000
tong = tl['giayVideo']
buf = np.zeros(int((tong + 3) * SR), dtype=np.float32)

by_khoa = {}
for l in sorted((l for l in man.values() if l['loai'] == 'luot'), key=lambda l: l.get('phan') or 0):
    by_khoa.setdefault(l['khoaLuot'], []).append(l)
by_cau = {l['idCau']: l for l in man.values() if l['loai'] == 'thoai'}
cache = {}

def doc(id_):
    if id_ in cache:
        return cache[id_]
    with wave.open(f'{a.ra}/tieng/{id_}.wav', 'rb') as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768.0
    y = resample_poly(x, 2, 1).astype(np.float32)
    cache[id_] = y
    return y

n_dat, thieu, chong = 0, [], 0
cuoi = np.zeros_like(buf, dtype=bool)
for e in sorted(tl['ev'], key=lambda e: e['giay']):
    if e['loai'] == 'luot':
        ds_ = by_khoa.get(e.get('khoa'))
    else:
        l_ = by_cau.get(e.get('idCau'))
        ds_ = [l_] if l_ else None
    if not ds_:
        thieu.append(e.get('khoa') or e.get('idCau'))
        continue
    parts = []
    for i_, l in enumerate(ds_):
        if i_:
            parts.append(np.zeros(int(0.12 * SR), dtype=np.float32))
        parts.append(doc(l['id']))
    y = np.concatenate(parts) if len(parts) > 1 else parts[0]
    i0 = max(0, int(round(e['giay'] * SR)))
    i1 = min(len(buf), i0 + len(y))
    if i0 >= len(buf):
        continue
    if cuoi[i0:i1].any():
        chong += 1     # hai dong chong len nhau (hiem): cong don
    buf[i0:i1] += y[:i1 - i0]
    cuoi[i0:i1] = True
    n_dat += 1

# chuan hoa nen: RMS tren cac doan co tieng ~ -20 dBFS (xap xi -16 LUFS cho tieng noi), dinh <= -1 dBFS
co = np.abs(buf) > 1e-4
rms = float(np.sqrt(np.mean(buf[co] ** 2))) if co.any() else 1.0
g = 10 ** (-20 / 20) / rms
buf *= g
dinh = float(np.max(np.abs(buf)))
if dinh > 0.89:
    buf *= 0.89 / dinh
print(f'dat {n_dat} dong, thieu {len(thieu)} {thieu[:5]}, chong {chong}, RMS goc {20*np.log10(rms):.1f} dBFS, he so {20*np.log10(g):.1f} dB, dinh {20*np.log10(float(np.max(np.abs(buf)))):.1f} dBFS')

wav_ra = f'{a.ra}/tieng-{a.che}{a.hau}.wav'
with wave.open(wav_ra, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(buf, -1, 1) * 32767).astype('<i2').tobytes())

vao = f'{a.ra}/video-{a.che}{a.hau}.noaudio.mp4'
ra = a.ra_file or f'{a.ra}/video-{a.che}{a.hau}.mp4'
cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', vao, '-i', wav_ra, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', ra]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode:
    print('ffmpeg loi:', r.stderr[:500]); sys.exit(1)
print('xong:', ra, f'{os.path.getsize(ra)/1e6:.0f} MB')
