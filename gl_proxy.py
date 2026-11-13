#!/usr/bin/env python3
"""
Proxy Gemini cho ban mo cong khai: key that CHI nam o .env tren may chu, trinh duyet chi
gui "o" (key=@1..@4). Proxy doi o -> key that roi chuyen tiep len Google.

  POST /gl/v1beta/models/<model>:generateContent?key=@N  ->  REST generateContent
  WS   /glws?key=@N                                       ->  Gemini Live (BidiGenerateContent)

Chay: python3 gl_proxy.py  (nghe 127.0.0.1:3001; cloudflared dinh tuyen /gl, /glws vao day)
Can: pip install aiohttp
Bien .env: GEMINI_KEY1..4, ALLOWED_ORIGINS (them, cach nhau dau phay), GL_PORT.
"""
import asyncio
import collections
import io
import os
import re
import time

import aiohttp
from aiohttp import web

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
UP_REST = 'https://generativelanguage.googleapis.com/'
UP_WS = ('wss://generativelanguage.googleapis.com/ws/'
         'google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent')
# Chi cho goi generateContent len model — khong cho liet ke model, tep, tuning, v.v.
REST_OK = re.compile(r'^v1beta/models/[A-Za-z0-9._-]+:generateContent$')

MAX_BODY = 4 * 1024 * 1024
WS_MAX_SECONDS = 30 * 60
WS_PER_IP = 3
LIMITS = {                       # (so yeu cau, cua so giay)
    'rest_ip': (40, 60), 'ws_ip': (8, 60),
    'rest_all': (240, 60), 'ws_all': (40, 60),
}
_lich_su = collections.defaultdict(collections.deque)
_ws_dang_mo = collections.Counter()


def doc_env():
    out = {}
    try:
        with io.open(os.path.join(DIRECTORY, '.env'), encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    out[k.strip()] = v.strip().strip('"').strip("'")
    except OSError:
        pass
    return out


def khoa_that(slot):
    m = re.fullmatch(r'@([1-4])', slot or '')
    return doc_env().get('GEMINI_KEY' + m.group(1), '') if m else ''


def nguon_cho_phep():
    them = {x.strip() for x in doc_env().get('ALLOWED_ORIGINS', '').split(',') if x.strip()}
    return them


def ip_khach(req):
    return req.headers.get('CF-Connecting-IP') or req.remote or '?'


def vuot_han(ten, ip=None):
    n, sec = LIMITS[ten]
    khoa = (ten, ip)
    q, now = _lich_su[khoa], time.monotonic()
    while q and now - q[0] > sec:
        q.popleft()
    if len(q) >= n:
        return True
    q.append(now)
    return False


def kiem_tra(req, loai):
    """None = hop le, nguoc lai tra web.Response loi."""
    origin = req.headers.get('Origin', '')
    host_ok = {'https://' + req.headers.get('Host', '')} | nguon_cho_phep()
    if origin not in host_ok:
        return web.Response(status=403, text='origin')
    ip = ip_khach(req)
    if vuot_han(loai + '_ip', ip) or vuot_han(loai + '_all'):
        return web.Response(status=429, text='too many requests')
    return None


def che_khoa(text, key):
    return text.replace(key, '***') if key else text


async def rest(req):
    tail = req.match_info['tail']
    if not REST_OK.match(tail):
        return web.Response(status=403, text='path')
    loi = kiem_tra(req, 'rest')
    if loi:
        return loi
    key = khoa_that(req.query.get('key'))
    if not key:
        return web.Response(status=400, text='slot')
    body = await req.read()
    try:
        async with req.app['http'].post(
                UP_REST + tail, data=body, headers={'Content-Type': 'application/json',
                                                    'x-goog-api-key': key},
                timeout=aiohttp.ClientTimeout(total=120)) as r:
            data = await r.read()
            text = che_khoa(data.decode('utf-8', 'replace'), key)
            return web.Response(status=r.status, text=text,
                                content_type='application/json', charset='utf-8')
    except (aiohttp.ClientError, asyncio.TimeoutError) as e:
        return web.Response(status=502, text='upstream: %s' % type(e).__name__)


async def ws_live(req):
    loi = kiem_tra(req, 'ws')
    if loi:
        return loi
    ip = ip_khach(req)
    if _ws_dang_mo[ip] >= WS_PER_IP:
        return web.Response(status=429, text='too many sessions')
    key = khoa_that(req.query.get('key'))
    if not key:
        return web.Response(status=400, text='slot')
    _ws_dang_mo[ip] += 1
    try:
        # Noi len Google TRUOC khi chap nhan ket noi cua trinh duyet: truong "setup" ma
        # trinh duyet gui ngay luc onopen khong bi mat, va loi handshake tra ve dung ma HTTP.
        try:
            up = await req.app['http'].ws_connect(UP_WS + '?key=' + key, max_msg_size=0,
                                                  heartbeat=20)
        except aiohttp.WSServerHandshakeError as e:
            return web.Response(status=e.status, text='upstream handshake')
        except (aiohttp.ClientError, asyncio.TimeoutError):
            return web.Response(status=502, text='upstream')
        ws = web.WebSocketResponse(max_msg_size=0, heartbeat=20)
        await ws.prepare(req)

        async def len_len():          # trinh duyet -> Google
            async for m in ws:
                if m.type == aiohttp.WSMsgType.TEXT:
                    await up.send_str(m.data)
                elif m.type == aiohttp.WSMsgType.BINARY:
                    await up.send_bytes(m.data)
                else:
                    break

        async def xuong():            # Google -> trinh duyet
            code, reason = 1000, ''
            async for m in up:
                if m.type == aiohttp.WSMsgType.TEXT:
                    await ws.send_str(m.data)
                elif m.type == aiohttp.WSMsgType.BINARY:
                    await ws.send_bytes(m.data)
                elif m.type == aiohttp.WSMsgType.CLOSE:
                    code, reason = m.data or 1000, m.extra or ''
                    break
            return code, reason

        t1, t2 = asyncio.ensure_future(len_len()), asyncio.ensure_future(xuong())
        done, pending = await asyncio.wait({t1, t2}, timeout=WS_MAX_SECONDS,
                                           return_when=asyncio.FIRST_COMPLETED)
        for t in pending:
            t.cancel()
        code, reason = 1000, ''
        if t2 in done and not t2.cancelled() and t2.exception() is None:
            code, reason = t2.result()
        if not ws.closed:
            await ws.close(code=code if 1000 <= code < 5000 and code not in (1005, 1006) else 1000,
                           message=che_khoa(str(reason), key).encode('utf-8')[:120])
        if not up.closed:
            await up.close()
        return ws
    finally:
        _ws_dang_mo[ip] -= 1
        if _ws_dang_mo[ip] <= 0:
            del _ws_dang_mo[ip]


async def khoi_dong(app):
    app['http'] = aiohttp.ClientSession()


async def dong(app):
    await app['http'].close()


def tao_app():
    app = web.Application(client_max_size=MAX_BODY)
    app.router.add_post('/gl/{tail:.+}', rest)
    app.router.add_get('/glws', ws_live)
    app.on_startup.append(khoi_dong)
    app.on_cleanup.append(dong)
    return app


if __name__ == '__main__':
    web.run_app(tao_app(), host='127.0.0.1', port=int(doc_env().get('GL_PORT', '3001')),
                access_log=None)
