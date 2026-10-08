// bo-cuc-may.mjs — may chu http rieng cho do-bo-cuc.mjs: CHI dung cong 9750-9799 (cdp-lib.moServer chon 3900-3999).
// PID cua python duoc giet bang taskkill theo PID (khong bao gio giet theo ten).
import { spawn } from 'node:child_process';
import net from 'node:net';

const TAM = 'E:/sensei-tam/tmp';
const ENV = Object.assign({}, process.env, { TEMP: TAM.replace(/\//g, '\\'), TMP: TAM.replace(/\//g, '\\') });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PID = [];

async function congTrong(a, b) {
  for (let i = 0; i < 80; i++) {
    const p = a + Math.floor(Math.random() * (b - a + 1));
    const ok = await new Promise((r) => { const s = net.createServer(); s.once('error', () => r(false)); s.listen(p, '127.0.0.1', () => s.close(() => r(true))); });
    if (ok) return p;
  }
  throw new Error('khong con cong trong 9750-9799');
}

/** http.server rieng tu thu muc goc; tra ve goc URL. */
export async function moServer(thuMuc = 'E:/ai-live-sensei-classroom') {
  const port = await congTrong(9750, 9799);
  // http.server mac dinh chi xep hang 5 ket noi -> 2 Chrome song song (1440 + 390) bi ERR_CONNECTION_REFUSED: ThreadingHTTPServer hang doi 256
  const PY = ['import functools, http.server as h, sys',
    'class S(h.ThreadingHTTPServer):',
    '  request_queue_size = 256',
    '  daemon_threads = True',
    'S(("127.0.0.1", int(sys.argv[1])), functools.partial(h.SimpleHTTPRequestHandler, directory=".")).serve_forever()'].join('\n');
  const p = spawn('python', ['-c', PY, String(port)], { cwd: thuMuc, stdio: 'ignore', windowsHide: true, env: ENV });
  PID.push(p.pid);
  const goc = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) { try { const r = await fetch(goc + '/'); if (r.ok) return goc; } catch {} await sleep(200); }
  throw new Error('server khong len: ' + thuMuc);
}

/** Giet cac server da mo (theo PID, ca cay tien trinh). */
export async function donServer() {
  for (const pid of PID.splice(0)) {
    await new Promise((r) => {
      if (process.platform === 'win32') spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }).on('close', () => r());
      else { try { process.kill(pid, 'SIGKILL'); } catch {} r(); }
    });
  }
}
