#!/usr/bin/env python3
"""Nineteenth round — 2026-09-03.

  A  assets  review19.css after review18.css, on every page.

Everything else this round is a change to assets/site.js,
assets/review16.js, assets/review18.js and stats.html itself.

Idempotent:
    python3 tools/p29_review19.py && python3 tools/bump_assets.py
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
    if 'assets/review19.css' not in s:
        s = re.sub(
            r'(<link rel="stylesheet" href="assets/review18\.css\?v=[^"]*">)',
            r'\1\n<link rel="stylesheet" href="assets/review19.css?v=1">',
            s, count=1)
    if s != o:
        open(p, 'w', encoding='utf-8').write(s)
        log.append(f)

print('review19 linked into:', ', '.join(log) if log else '(already linked)')
