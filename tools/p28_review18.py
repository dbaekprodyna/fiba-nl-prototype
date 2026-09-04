#!/usr/bin/env python3
"""Eighteenth round — 2026-09-03.

  A  assets  review18.css after review17.css, review18.js after
             review17.js, on every page.

Everything else this round is a change to assets/site.js itself:
the season table is decomposed to team sites, search matches on
category and gender, the World Tour column set is one builder, and
seeding is read through one helper. Those are corrections to the
site's own logic rather than a layer over it, so they live in the
file that owns them.

Idempotent:
    python3 tools/p28_review18.py && python3 tools/bump_assets.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def P(*a):
    return os.path.join(ROOT, *a)


PAGES = [f for f in sorted(os.listdir(ROOT)) if f.endswith('.html')]
log = []

for f in PAGES:
    p = P(f)
    s = open(p, encoding='utf-8').read()
    o = s

    if 'assets/review18.css' not in s:
        s = re.sub(
            r'(<link rel="stylesheet" href="assets/review17\.css\?v=[^"]*">)',
            r'\1\n<link rel="stylesheet" href="assets/review18.css?v=1">',
            s, count=1)

    if 'assets/review18.js' not in s:
        s = re.sub(
            r'(<script defer src="assets/review17\.js\?v=[^"]*"></script>)',
            r'\1\n<script defer src="assets/review18.js?v=1"></script>',
            s, count=1)

    if s != o:
        open(p, 'w', encoding='utf-8').write(s)
        log.append(f)

print('review18 linked into:', ', '.join(log) if log else '(already linked)')
