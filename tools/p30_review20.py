#!/usr/bin/env python3
"""Twentieth round — 2026-09-03.

  A  assets  review20.css after review19.css, on every page.

Everything else this round is a change to assets/site.js,
assets/hero-switch.js, index.html and stop.html themselves.

Idempotent:
    python3 tools/p30_review20.py && python3 tools/bump_assets.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = [f for f in sorted(os.listdir(ROOT)) if f.endswith('.html')]
log = []

for f in PAGES:
    p = os.path.join(ROOT, f)
    s = open(p, encoding='utf-8').read()
    o = s
    if 'assets/review20.css' not in s:
        s = re.sub(
            r'(<link rel="stylesheet" href="assets/review19\.css\?v=[^"]*">)',
            r'\1\n<link rel="stylesheet" href="assets/review20.css?v=1">',
            s, count=1)
    if s != o:
        open(p, 'w', encoding='utf-8').write(s)
        log.append(f)

print('review20 linked into:', ', '.join(log) if log else '(already linked)')
