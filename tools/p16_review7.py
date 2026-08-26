#!/usr/bin/env python3
"""Seventh round — 2026-08-26 (Daniel's fourth mark-up).

  A  assets   review7.css / mobile7.css / review7.js on every page,
              plus the one inline line in <head> that arms the
              reveal before the first paint. Without that line the
              reveal rules never match and the page is unchanged —
              which is exactly what should happen if the script
              never arrives.

Idempotent: every step is guarded.
    python3 tools/p16_review7.py && python3 tools/bump_assets.py
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

ARM = ('<script>document.documentElement.className='
       'document.documentElement.className+" rv-on";</script>')

log = []


def a_assets():
    for f in PAGES:
        s = read(f)
        o = s
        if 'assets/review7.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review6\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review7.css?v=1">', s, count=1)
        if 'assets/mobile7.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/mobile6\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/mobile7.css?v=1">', s, count=1)
        if 'assets/review7.js' not in s:
            s = re.sub(
                r'(<script defer src="assets/mobile6\.js\?v=[^"]*"></script>)',
                r'\1\n<script defer src="assets/review7.js?v=1"></script>', s, count=1)
        # the arming line goes last in <head>, after every sheet, so
        # nothing can paint a section before the class is on <html>
        if 'rv-on' not in s:
            s = s.replace('</head>', ARM + '\n</head>', 1)
        if s != o:
            write(f, s)
            log.append(f + ': review7 / mobile7 linked')


a_assets()

print('\n'.join(log) if log else 'nothing to do — already applied')
