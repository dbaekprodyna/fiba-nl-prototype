#!/usr/bin/env python3
"""Sixteenth round — 2026-08-31 (Daniel's mark, four items).

  A  assets   season.js, review16.css and review16.js on every page.

season.js is the one script on the site that is NOT deferred. It has
to run before site.js asks what day it is, because the answer is what
every live badge, dot, counter, table and stream is computed from. It
goes at the top of the head, before the first stylesheet.

review16.css goes after review15.css and before hero.css.
review16.js goes last, after review12.js.

Idempotent:
    python3 tools/p26_review16.py && python3 tools/bump_assets.py
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

        if 'assets/season.js' not in s:
            s = re.sub(
                r'(<link[^>]*href="https://fonts\.googleapis\.com"[^>]*>)',
                '<script src="assets/season.js?v=1"></script>\n\\1',
                s, count=1)

        if 'assets/review16.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review15\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review16.css?v=1">',
                s, count=1)

        if 'assets/review16.js' not in s:
            s = re.sub(
                r'(<script defer src="assets/review12\.js\?v=[^"]*"></script>)',
                r'\1\n<script defer src="assets/review16.js?v=1"></script>',
                s, count=1)

        if s != o:
            write(f, s)
            log.append(f + ': season / review16 linked')


for fn in (a_assets,):
    fn()

print('\n'.join(log) if log else 'nothing to do')
