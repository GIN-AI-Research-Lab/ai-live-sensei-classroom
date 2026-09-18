# -*- coding: utf-8 -*-
"""
Tai cac thu vien frontend (Tailwind CSS, Font Awesome) ve vendor/.

VI SAO CAN SCRIPT NAY:
  index.html nap vendor/tailwind.js va vendor/fontawesome/all.min.css
  o dang LOCAL (khong qua CDN) de trang khong vo layout khi may chay
  qua mang cong ty/VPN chan CDN (xem chu thich dau index.html).

  Nhung vendor/ nam trong .gitignore (dung quy uoc: khong commit thu
  vien tai ve vao git). Hau qua: clone repo lan dau se KHONG co
  vendor/, Tailwind khong nap duoc -> giao dien vo layout hoan toan.

  Chay script nay MOT LAN sau khi clone de tai lai:
      python tools/setup_vendor.py

CHU Y DUONG DAN: file CSS cua Font Awesome tham chieu font bang duong
dan tuong doi "../webfonts/..." tinh tu vi tri cua no
(vendor/fontawesome/all.min.css), nen thu muc font phai nam o
vendor/webfonts/ (KHONG PHAI vendor/fontawesome/webfonts/).
"""
from __future__ import print_function
import io
import os
import sys

try:
    from urllib.request import urlopen, Request
except ImportError:  # Python 2 (khong ky vong dung nhung de phong)
    from urllib2 import urlopen, Request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENDOR = os.path.join(ROOT, "vendor")

TAILWIND_URL = "https://cdn.tailwindcss.com"
FA_VERSION = "6.5.1"
FA_BASE = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/%s" % FA_VERSION
FA_FONTS = [
    "fa-brands-400.woff2",
    "fa-regular-400.woff2",
    "fa-solid-900.woff2",
    "fa-v4compatibility.woff2",
]


def fetch(url):
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=30) as resp:
        return resp.read()


def save(path, data):
    d = os.path.dirname(path)
    if d and not os.path.exists(d):
        os.makedirs(d)
    with io.open(path, "wb") as f:
        f.write(data)
    print("[OK] %s (%d bytes)" % (os.path.relpath(path, ROOT), len(data)))


def main():
    print("Tai Tailwind CSS (Play CDN build)...")
    save(os.path.join(VENDOR, "tailwind.js"), fetch(TAILWIND_URL))

    print("Tai Font Awesome %s..." % FA_VERSION)
    save(os.path.join(VENDOR, "fontawesome", "all.min.css"),
         fetch("%s/css/all.min.css" % FA_BASE))

    for name in FA_FONTS:
        # QUAN TRONG: luu vao vendor/webfonts/, KHONG PHAI
        # vendor/fontawesome/webfonts/ -- xem chu thich dau file.
        save(os.path.join(VENDOR, "webfonts", name),
             fetch("%s/webfonts/%s" % (FA_BASE, name)))

    print("\nXong. Chay `python server.py` roi mo http://localhost:3000")
    return 0


if __name__ == "__main__":
    sys.exit(main())
