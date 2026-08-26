#!/usr/bin/env python3
"""Ninth round — 2026-08-26 (Daniel's sixth mark-up).

  A  assets   review9.css / mobile9.css on every page.

Everything else this round is CSS in those two files, plus three
constants in assets/review7.js (the stagger, the tidy-up delay and
the top-left key visual's parallax rate).

Idempotent: every step is guarded.
    python3 tools/p18_review9.py && python3 tools/bump_assets.py
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


PAGES = [f for f in sorted(os.listdir(ROOT))
         if f.endswith('.html') and f not in ('qualification.html',)]

log = []


# ---------------------------------------------------------------- A
def a_assets():
    for f in PAGES:
        s = read(f)
        o = s
        if 'assets/review9.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review8\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review9.css?v=1">',
                s, count=1)
        if 'assets/mobile9.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/mobile8\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/mobile9.css?v=1">',
                s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review9 / mobile9 linked')


if __name__ == '__main__':
    a_assets()
    print('\n'.join(log) if log else 'nothing to do')
