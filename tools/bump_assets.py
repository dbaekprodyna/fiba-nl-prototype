#!/usr/bin/env python3
"""Stamp every asset link with a content hash.

GitHub Pages serves CSS and JS with a cache lifetime, so a browser can keep
showing yesterday's stylesheet after a push — which looks exactly like "you
didn't fix it". A ?v=<hash> that changes when the file changes ends that.

Run after any edit to assets/, before committing.
"""
import os, re, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = ["index.html", "system/index.html"] + \
          ["system/_check/" + f for f in sorted(os.listdir(os.path.join(ROOT, "system", "_check")))
           if f.endswith(".html")]

def digest(path):
    try:
        return hashlib.sha1(open(path, "rb").read()).hexdigest()[:8]
    except OSError:
        return None

changed = 0
for t in TARGETS:
    p = os.path.join(ROOT, t)
    if not os.path.exists(p):
        continue
    html = open(p, encoding="utf-8").read()
    base = os.path.dirname(p)

    def stamp(m):
        global changed
        attr, url = m.group(1), m.group(2)
        clean = url.split("?")[0]
        if not clean.endswith((".css", ".js")) or clean.startswith(("http", "//")):
            return m.group(0)
        d = digest(os.path.normpath(os.path.join(base, clean)))
        if not d:
            return m.group(0)
        changed += 1
        return '%s="%s?v=%s"' % (attr, clean, d)

    out = re.sub(r'(href|src)="([^"]+)"', stamp, html)
    if out != html:
        open(p, "w").write(out)
print("asset links stamped:", changed)
