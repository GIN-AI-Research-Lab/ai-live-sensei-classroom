#!/usr/bin/env python3
"""
AI Live Sensei Classroom - Local Development Server
Phục vụ các tệp tĩnh (HTML, CSS, JS, JSON) trên localhost để đảm bảo quyền Microphone và Web Audio API.
"""

import datetime
import email.utils
import gzip
import http.server
import io
import ipaddress
import json
import re
import socketserver
import os
import sys
import threading
import ssl
import urllib.parse

PORT = 3000
HTTPS_PORT = 3443
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
GOC_THAT = os.path.normcase(os.path.realpath(DIRECTORY))

ENV_PATHS = ('/env.js', '/js/env.js')

# Duoi tep bi mat (khoa TLS, chung chi) — khong bao gio phuc vu
DUOI_BI_MAT = ('.pem', '.key', '.p12', '.pfx')
# Ten thiet bi cua Windows: mo "CON", "NUL.txt"... la mo thiet bi chu khong phai tep
TEN_THIET_BI = ({'con', 'prn', 'aux', 'nul'} | {'com%d' % i for i in range(1, 10)}
                | {'lpt%d' % i for i in range(1, 10)})

# Kieu van ban dang nen gzip (anh/glb/mp4/woff2 da nen san, nen them chi ton CPU)
LOAI_NEN = {'application/javascript', 'application/json', 'image/svg+xml',
            'application/manifest+json', 'application/xml'}
NEN_TOI_DA = 8 * 1024 * 1024
_BO_NEN = {}  # (duong dan, mtime_ns, size) -> bytes da nen

# Ten mien noi bo duoc lay env.js. Ten mien la (DNS rebinding: evil.com tro ve
# 127.0.0.1) bi chan. Them ten khac (ngrok, DDNS...) qua ALLOWED_HOSTS trong .env,
# cach nhau dau phay; '*' = tat kiem tra.
# KHONG co '.ts.net': Tailscale Funnel dung chinh ten .ts.net de mo ra INTERNET CONG KHAI
# (proxy vao 127.0.0.1) — tung de lo ca 4 key. Chi dung Tailscale Serve (noi bo) thi tu
# them ten may vao ALLOWED_HOSTS.
DUOI_NOI_BO = ('.localhost', '.local', '.lan', '.home', '.home.arpa', '.internal',
               '.localdomain')

# CHI phuc vu nhung gi app can (danh sach cho phep, mac dinh cam). Truoc day phuc vu ca
# thu muc du an: tai lieu ca nhan, tools/*.py, server.py... deu tai duoc.
TEP_GOC_CHO_PHEP = {'index.html', 'favicon.ico'}
THU_MUC_CHO_PHEP = {'css', 'js', 'curriculum', 'vendor', 'assets', 'tools'}
DUOI_CAM = ('.py', '.pyc', '.pyo', '.bat', '.cmd', '.ps1', '.sh', '.md', '.txt', '.csv',
            '.doc', '.docx', '.xls', '.xlsx', '.pdf', '.zip', '.log', '.ini', '.cfg')

# Mac dinh chi nghe tren may nay. Can dien thoai trong mang LAN (mic qua HTTPS :3443)
# thi chay: python server.py --lan   (hoac SERVE_LAN=1 trong .env)
MO_LAN = '--lan' in sys.argv[1:]


def _phan_bi_chan(ten):
    """Mot thanh phan duong dan co bi chan khong: tep/thu muc an, bi mat, thiet bi, ADS."""
    if ten.startswith('.') or ':' in ten or '\0' in ten:
        return True
    # Windows bo qua hoa/thuong va dau cham/khoang trang cuoi: 'KEY.PEM.' == 'key.pem'
    n = ten.rstrip(' .').lower()
    return n.endswith(DUOI_BI_MAT) or n.split('.')[0] in TEN_THIET_BI


def _ngoai_danh_sach(phan):
    """Duong dan (cac thanh phan, tinh tu goc du an) khong nam trong danh sach cho phep."""
    phan = [p for p in phan if p not in ('', '.')]
    if not phan:
        return False                                   # '/' -> index.html
    if phan[-1].rstrip(' .').lower().endswith(DUOI_CAM):
        return True
    dau = phan[0].lower()
    if len(phan) == 1:
        return dau not in TEP_GOC_CHO_PHEP and dau not in THU_MUC_CHO_PHEP
    if dau not in THU_MUC_CHO_PHEP:
        return True
    # tools/ chi cho trang so sanh (.html); cac script sinh giao trinh thi khong
    return dau == 'tools' and not phan[-1].lower().endswith('.html')


def duong_dan_bi_chan(fs):
    """fs: duong dan da giai ma %xx va chuan hoa (ket qua translate_path goc)."""
    phan = os.path.relpath(fs, DIRECTORY).replace('\\', '/').split('/')
    if any(_phan_bi_chan(p) for p in phan if p not in ('', '.')) or _ngoai_danh_sach(phan):
        return True
    # Ten that tren dia cung phai qua: ten ngan 8.3 (GIT~1 -> .git), lien ket...
    try:
        that = os.path.normcase(os.path.realpath(fs))
    except (OSError, ValueError):
        return True
    if that == GOC_THAT:
        return False
    goc = os.path.join(GOC_THAT, '')
    if not that.startswith(goc):
        return True                                    # lien ket tro ra ngoai du an
    phan = that[len(goc):].split(os.sep)
    return any(_phan_bi_chan(p) for p in phan if p) or _ngoai_danh_sach(phan)


def host_hop_le(host, env):
    """Host cua yeu cau env.js co phai may nay / mang noi bo khong."""
    if not host:
        return True
    host = host.strip().lower()
    h = host[1:].split(']', 1)[0] if host.startswith('[') else host.split(':', 1)[0]
    h = h.rstrip('.')
    them = {x.strip().lower() for x in env.get('ALLOWED_HOSTS', '').split(',') if x.strip()}
    if '*' in them or h in them:
        return True
    try:
        # Xet IP TRUOC: IPv6 khong co dau cham nen truoc day lot qua nhanh 'ten khong dau cham'.
        # IP noi bo (127.x, 192.168.x, 10.x, ::1, 100.64/10 cua Tailscale...) thi duoc, IP cong khai thi khong
        return not ipaddress.ip_address(h).is_global
    except ValueError:
        pass
    return h == 'localhost' or '.' not in h or h.endswith(DUOI_NOI_BO)


class _DoanTep(object):
    """Doc dung n byte tu vi tri start — than cua phan hoi 206."""

    def __init__(self, f, start, n):
        f.seek(start)
        self.f = f
        self.con = n

    def read(self, size=-1):
        if self.con <= 0:
            return b''
        if size is None or size < 0 or size > self.con:
            size = self.con
        b = self.f.read(size)
        self.con -= len(b)
        return b

    def close(self):
        self.f.close()


def read_env():
    """Doc .env thanh dict. Khong dung thu vien ngoai cho nhe."""
    path = os.path.join(DIRECTORY, '.env')
    out = {}
    if not os.path.exists(path):
        return out
    with io.open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


class CORSAndMimeHandler(http.server.SimpleHTTPRequestHandler):
    # HTTP/1.1 de bat keep-alive: mot ket noi dung cho nhieu tep.
    # Mac dinh cua thu vien la HTTP/1.0 — tra xong mot tep la dong ket noi, nen
    # trang nay (~16 tep) phai mo 16 ket noi TCP. Qua localhost khong sao, nhung
    # qua duong ham thi moi ket noi la mot luong proxy rieng, rung mot cai la
    # mat mot tep JS — nang thi trang trong tron.
    protocol_version = "HTTP/1.1"

    # Keep-alive giu ket noi mo, moi ket noi giu mot luong. Khong dat thoi han
    # thi tab dong roi van de lai luong treo. 30 giay la du cho mot lan tai trang.
    timeout = 30

    # Khong khai phien ban Python ra header Server
    server_version = 'SenseiDev'
    sys_version = ''

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def list_directory(self, path):
        # Khong liet ke thu muc (truoc day /Image/, /tools/ hien ca danh sach tep)
        self.send_error(404, 'File not found')
        return None

    def do_GET(self):
        # Sinh env.js tu .env de trinh duyet doc duoc key ma khong phai nhap tay
        if self.path.split('?')[0] in ENV_PATHS:
            self._rieng = True  # end_headers: khong CORS, khong luu dia
            env = read_env()
            # Chi cung nguon. Sec-Fetch-Site chi co tren localhost/HTTPS — thieu thi cho
            # qua (HTTP qua LAN khong gui). Host la -> chan DNS rebinding.
            sfs = self.headers.get('Sec-Fetch-Site')
            host = self.headers.get('Host')
            if (sfs and sfs not in ('same-origin', 'none')) or not host_hop_le(host, env):
                self.log_message('Chan env.js: Host=%r Sec-Fetch-Site=%r — may cua ban thi them '
                                 'ten vao ALLOWED_HOSTS trong .env', host, sfs)
                self.send_error(403, 'Forbidden', 'env.js chi phuc vu cung nguon. Neu day la '
                                'may cua ban, them ten mien vao ALLOWED_HOSTS trong .env')
                return
            body = (
                '/* Sinh tu .env boi server.py — dung sua tay, dung commit. */\n'
                'window.SENSEI_ENV = {\n'
                '  key1: %s,\n'
                '  key2: %s,\n'
                '  key3: %s,\n'
                '  key4: %s,\n'
                '};\n'
            ) % (json.dumps(env.get('GEMINI_KEY1', '')),
                 json.dumps(env.get('GEMINI_KEY2', '')),
                 json.dumps(env.get('GEMINI_KEY3', '')),
                 json.dumps(env.get('GEMINI_KEY4', '')))
            data = body.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        # Tep an (.env, .git, .claude...) va bi mat bi chan trong translate_path
        return super().do_GET()

    def translate_path(self, path):
        fs = super().translate_path(path)
        # Kiem tra SAU khi thu vien da giai ma %xx va chuan hoa — truoc day xet
        # URL tho nen '/%2Eenv', '/.git/config' lot qua. Dung chung cho GET va HEAD.
        self._bi_chan = duong_dan_bi_chan(fs)
        return os.path.join(DIRECTORY, '<bi-chan>') if self._bi_chan else fs

    def send_head(self):
        path = self.translate_path(self.path)
        if self._bi_chan:
            self.send_error(404, 'File not found')
            return None
        if os.path.isdir(path):
            if not urllib.parse.urlsplit(self.path).path.endswith('/'):
                return super().send_head()  # chuyen huong them '/'
            for ten in ('index.html', 'index.htm'):
                if os.path.isfile(os.path.join(path, ten)):
                    path = os.path.join(path, ten)
                    break
            else:
                return super().send_head()  # liet ke thu muc
        if path.endswith('/') or not os.path.isfile(path):
            return super().send_head()  # 404 cua thu vien
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, 'File not found')
            return None
        try:
            return self._gui_tep(f, path)
        except BaseException:
            f.close()
            raise

    def _gui_tep(self, f, path):
        """Tra mot tep: ETag/Last-Modified -> 304, gzip cho van ban, Range -> 206."""
        fs = os.fstat(f.fileno())
        size = fs.st_size
        ctype = self.guess_type(path)
        nen = ((ctype.startswith('text/') or ctype.split(';')[0] in LOAI_NEN)
               and 256 <= size <= NEN_TOI_DA)
        rng = self.headers.get('Range')
        gz = nen and not rng and self._chap_nhan_gzip()
        etag = '"%x-%x%s"' % (fs.st_mtime_ns, size, '-gz' if gz else '')
        last_mod = self.date_time_string(fs.st_mtime)
        # vendor/ la thu vien tai ve, khong doi: cho giu 1 ngay khoi hoi lai.
        # KHONG ap cho assets/: glb/png bi ghi de cung ten khi lam mo hinh.
        if os.path.relpath(path, DIRECTORY).split(os.sep)[0].lower() == 'vendor':
            self._cc = 'public, max-age=86400'

        if self._khong_doi(etag, fs.st_mtime):
            f.close()
            self.send_response(304)
            self._gui_the(etag, last_mod, nen, False)
            self.end_headers()
            return None

        if rng and size > 0:
            ir = self.headers.get('If-Range')
            doan = self._doc_range(rng, size) if not ir or ir.strip() in (etag, last_mod) else None
            if doan is False:
                f.close()
                self.__dict__.pop('_cc', None)
                self.send_response(416)
                self.send_header('Content-Range', 'bytes */%d' % size)
                self.send_header('Content-Length', '0')
                self.end_headers()
                return None
            if doan:
                start, end = doan
                self.send_response(206)
                self.send_header('Content-Type', ctype)
                self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, size))
                self.send_header('Content-Length', str(end - start + 1))
                self._gui_the(etag, last_mod, nen, True)
                self.end_headers()
                return _DoanTep(f, start, end - start + 1)

        if gz:
            khoa = (path, fs.st_mtime_ns, size)
            data = _BO_NEN.get(khoa)
            if data is None:
                data = gzip.compress(f.read(), 6, mtime=0)
                if len(_BO_NEN) >= 256:
                    _BO_NEN.clear()
                _BO_NEN[khoa] = data
            f.close()
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Encoding', 'gzip')
            self.send_header('Content-Length', str(len(data)))
            self._gui_the(etag, last_mod, nen, False)
            self.end_headers()
            return io.BytesIO(data)

        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(size))
        self._gui_the(etag, last_mod, nen, True)
        self.end_headers()
        return f

    def _gui_the(self, etag, last_mod, nen, range_duoc):
        self.send_header('ETag', etag)
        self.send_header('Last-Modified', last_mod)
        if range_duoc:
            self.send_header('Accept-Ranges', 'bytes')
        if nen:
            self.send_header('Vary', 'Accept-Encoding')

    def _khong_doi(self, etag, mtime):
        """Yeu cau co dieu kien khop ban hien tai -> tra 304."""
        inm = self.headers.get('If-None-Match')
        if inm is not None:
            the = [t.strip() for t in inm.split(',')]
            return '*' in the or etag in [t[2:] if t.startswith('W/') else t for t in the]
        ims = self.headers.get('If-Modified-Since')
        if not ims:
            return False
        try:
            d = email.utils.parsedate_to_datetime(ims)
        except (TypeError, IndexError, OverflowError, ValueError):
            return False
        if d.tzinfo is None:
            d = d.replace(tzinfo=datetime.timezone.utc)
        return int(mtime) <= d.timestamp()

    def _chap_nhan_gzip(self):
        for phan in self.headers.get('Accept-Encoding', '').lower().split(','):
            ten, _, q = phan.partition(';')
            if ten.strip() in ('gzip', 'x-gzip', '*'):
                q = q.strip()
                try:
                    return float(q[2:]) > 0 if q.startswith('q=') else True
                except ValueError:
                    return True
        return False

    @staticmethod
    def _doc_range(rng, size):
        """'bytes=a-b' -> (a, b). None = bo qua (sai cu phap, nhieu doan) -> 200; False -> 416."""
        m = re.fullmatch(r'\s*bytes\s*=\s*(\d*)\s*-\s*(\d*)\s*', rng, re.ASCII | re.IGNORECASE)
        if not m or not (m.group(1) or m.group(2)):
            return None
        try:  # so qua dai (> gioi han 4300 chu so cua int) -> coi nhu sai cu phap
            a = int(m.group(1)) if m.group(1) else None
            b = int(m.group(2)) if m.group(2) else None
        except ValueError:
            return None
        if a is None:  # 'bytes=-n': n byte cuoi
            return (max(0, size - b), size - 1) if b > 0 else False
        if b is not None and b < a:
            return None
        if a >= size:
            return False
        return a, min(b, size - 1) if b is not None else size - 1

    def end_headers(self):
        cc = self.__dict__.pop('_cc', None)
        if self.__dict__.pop('_rieng', False):
            # env.js chua key API: khong CORS, chan <script src> tu trang khac, khong luu dia
            self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
            self.send_header('Cache-Control', 'no-store')
        else:
            # Khong con 'Access-Control-Allow-Origin: *': app cung nguon, CORS mo chi giup
            # trang la doc tep cua may nay. no-cache: trinh duyet van giu nhung hoi lai moi lan
            # (ETag -> 304), sua tep la thay ngay.
            self.send_header('Cache-Control', cc or 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'same-origin')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        super().end_headers()

    # Kieu MIME chuan cho tung loai tep. Thieu woff2 thi mot so trinh duyet
    # tu choi nap font -> mat sach icon, nhin nhu vo layout.
    EXTRA_TYPES = {
        '.json': 'application/json',
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
        '.ttf': 'font/ttf',
        '.webmanifest': 'application/manifest+json',
    }

    def guess_type(self, path):
        lowered = str(path).lower()
        for ext, mime in self.EXTRA_TYPES.items():
            if lowered.endswith(ext):
                return mime
        return super().guess_type(path)


class MayChuHttps(socketserver.ThreadingTCPServer):
    """Da luong; bat tay TLS chay tren luong cua tung ket noi (xem start_https_server)."""
    daemon_threads = True

    def handle_error(self, request, client_address):
        # Trinh duyet tu choi cert tu ky, may quet cong, ket noi im lang het han:
        # chuyen thuong, khong in traceback
        if isinstance(sys.exc_info()[1], (ssl.SSLError, ConnectionError, TimeoutError)):
            return
        super().handle_error(request, client_address)


def dia_chi_nghe():
    """'' = moi giao dien mang (LAN), '127.0.0.1' = chi may nay (mac dinh)."""
    return '' if (MO_LAN or read_env().get('SERVE_LAN', '').strip() in ('1', 'true', 'yes')) else '127.0.0.1'


def start_https_server():
    cert_path = os.path.join(DIRECTORY, 'cert.pem')
    key_path = os.path.join(DIRECTORY, 'key.pem')
    if not (os.path.exists(cert_path) and os.path.exists(key_path)):
        return

    try:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile=cert_path, keyfile=key_path)
        socketserver.TCPServer.allow_reuse_address = True
        httpsd = MayChuHttps((dia_chi_nghe(), HTTPS_PORT), CORSAndMimeHandler)
        # do_handshake_on_connect=False: accept() khong bat tay nua. Truoc day bat tay
        # chay ngay trong accept() cua luong chinh, khong han — mot ket noi im lang
        # (khong gui ClientHello) la treo ca may chu HTTPS. Gio bat tay dien ra o lan
        # doc dau tien, tren luong rieng cua ket noi, voi timeout 30 s cua handler.
        httpsd.socket = context.wrap_socket(httpsd.socket, server_side=True,
                                            do_handshake_on_connect=False)
        print(f"   HTTPS URL:  https://localhost:{HTTPS_PORT} (Supports Remote & Mobile Microphone)")
        httpsd.serve_forever()
    except Exception as e:
        print(f"[!] HTTPS server warning (port {HTTPS_PORT}): {repr(e)}")

def run_server():
    port = PORT
    max_attempts = 10
    httpd = None

    socketserver.TCPServer.allow_reuse_address = True
    # Hang doi ket noi rong hon: luc mo trang, hang chuc yeu cau toi cung luc
    socketserver.ThreadingTCPServer.request_queue_size = 64
    socketserver.ThreadingTCPServer.daemon_threads = True
    for i in range(max_attempts):
        try:
            handler = CORSAndMimeHandler
            httpd = socketserver.ThreadingTCPServer((dia_chi_nghe(), port), handler)
            break
        except OSError:
            print(f"[!] Port {port} is busy, trying port {port + 1}...")
            port += 1

    if not httpd:
        print("[-] Could not bind to an available port.")
        sys.exit(1)

    # Khởi động HTTPS server song song trong luồng nền
    https_thread = threading.Thread(target=start_https_server, daemon=True)
    https_thread.start()

    url = f"http://localhost:{port}"
    print("=" * 65)
    print("   AI Live Sensei Classroom - Server is Running!")
    print(f"   HTTP URL:   {url}")
    print(f"   Root Dir:   {DIRECTORY}")
    if dia_chi_nghe() == '':
        print("   [!] Che do LAN: moi may trong mang doc duoc app VA env.js (key API).")
        print("       Chi bat tren mang tin cay; tuyet doi khong mo qua Tailscale Funnel / ngrok.")
    else:
        print("   Chi nghe tren may nay (127.0.0.1). Dien thoai trong LAN: python server.py --lan")
    print("   Press Ctrl + C to stop the server.")
    print("=" * 60)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[+] Server stopping...")
        httpd.server_close()
        print("[+] Server stopped successfully.")

if __name__ == '__main__':
    run_server()
