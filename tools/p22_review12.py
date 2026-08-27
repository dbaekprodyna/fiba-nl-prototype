#!/usr/bin/env python3
"""Twelfth round — 2026-08-27 (Daniel's ninth mark-up, "Mobile Feedbacks 2").

  A  assets   mobile12.css / review12.js linked on every page.

Everything else this round is CSS in assets/mobile12.css and behaviour
in assets/review12.js; no page mark-up changes.

Idempotent:
    python3 tools/p22_review12.py && python3 tools/bump_assets.py
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
    """mobile12.css must be the last stylesheet on the page and
    review12.js the last script: both are override layers and both
    read what the layers before them produced."""
    for f in PAGES:
        s = read(f)
        o = s
        if 'assets/mobile12.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/mobile11\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/mobile12.css?v=1">',
                s, count=1)
        if 'assets/review12.js' not in s:
            s = re.sub(
                r'(<script defer src="assets/review11\.js\?v=[^"]*"></script>)',
                r'\1\n<script defer src="assets/review12.js?v=1"></script>',
                s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review12 / mobile12 linked')


for fn in (a_assets,):
    fn()

print('\n'.join(log) if log else 'nothing to do')
