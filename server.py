#!/usr/bin/env python3
"""
AI Live Sensei Classroom - Local Development Server
Phục vụ các tệp tĩnh (HTML, CSS, JS, JSON) trên localhost để đảm bảo quyền Microphone và Web Audio API.
"""

import http.server
import io
import json
import socketserver
import os
import sys
import threading
import ssl

PORT = 3000
HTTPS_PORT = 3443
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Sinh env.js tu .env de trinh duyet doc duoc key ma khong phai nhap tay
        if self.path.split('?')[0] in ('/env.js', '/js/env.js'):
            env = read_env()
            body = (
                '/* Sinh tu .env boi server.py — dung sua tay, dung commit. */\n'
                'window.SENSEI_ENV = {\n'
                '  key1: %s,\n'
                '  key2: %s,\n'
                '};\n'
            ) % (json.dumps(env.get('GEMINI_KEY1', '')),
                 json.dumps(env.get('GEMINI_KEY2', '')))
            data = body.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        # Chan truy cap truc tiep .env va moi tep an khac
        name = os.path.basename(self.path.split('?')[0])
        if name.startswith('.'):
            self.send_error(404, 'Not Found')
            return

        return super().do_GET()

    def end_headers(self):
        # Thiết lập CORS và Cache-Control cho development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
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

def start_https_server():
    cert_path = os.path.join(DIRECTORY, 'cert.pem')
    key_path = os.path.join(DIRECTORY, 'key.pem')
    if not (os.path.exists(cert_path) and os.path.exists(key_path)):
        return

    try:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile=cert_path, keyfile=key_path)
        socketserver.TCPServer.allow_reuse_address = True
        httpsd = socketserver.ThreadingTCPServer(("", HTTPS_PORT), CORSAndMimeHandler)
        httpsd.socket = context.wrap_socket(httpsd.socket, server_side=True)
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
            httpd = socketserver.ThreadingTCPServer(("", port), handler)
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
