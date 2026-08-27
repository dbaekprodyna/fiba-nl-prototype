#!/usr/bin/env python3
"""Thirteenth round — 2026-08-27 (Daniel's tenth mark-up).

  A  assets   review13.css / mobile13.css linked on every page.

Two items this round, both pure CSS:

  * the hero's two brand elements get a size of their own —
    128px and 104px wide, ratio kept (assets/review13.css);
  * the phone tab bar gains four pixels at the top and four at
    the bottom, and the Conferences live dot stops being clipped
    by the tab's own corner-cut (assets/mobile13.css).

review13.css goes after review11.css and before hero.css, so the
mobile layers still override it on a phone. mobile13.css goes last
of all, after mobile12.css.

Idempotent:
    python3 tools/p23_review13.py && python3 tools/bump_assets.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def P(*a):
    return os.path.join(ROOT, *a)


def read(p):
    return open(P(p), encoding='utf-8').read()


def write(p, s):
    open(P(p), 'w', encoding='utf-8').write(s)


PAGES = [f for f in sorted(os.listdir(ROOT)) if f.endswith('.html')]

log = []


def a_assets():
    for f in PAGES:
        s = read(f)
        o = s
        if 'assets/review13.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review11\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review13.css?v=1">',
                s, count=1)
        if 'assets/mobile13.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/mobile12\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/mobile13.css?v=1">',
                s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review13 / mobile13 linked')


for fn in (a_assets,):
    fn()

print('\n'.join(log) if log else 'nothing to do')
