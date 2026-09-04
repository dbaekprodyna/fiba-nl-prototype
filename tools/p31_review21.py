#!/usr/bin/env python3
"""Twenty-first round — 2026-09-04.

  A  assets   review21.css after review20.css, on every page.
  B  index    the hero band gets the season plate as its first
              layer, and loses the court line-drawing.

The World Tour build puts a supplied photograph in the hero band
under the corner elements; this is the same band with the Nations
League plate in it. The court drawing goes because the photograph
is already a court — two courts at two vanishing points.

The parallax layer for the plate is a change to assets/review7.js
(buildParallax + frame), not to this script.

Idempotent:
    python3 tools/p31_review21.py && python3 tools/bump_assets.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = [f for f in sorted(os.listdir(ROOT)) if f.endswith('.html')]
log = []

# ---- A  the stylesheet, everywhere ---------------------------------
for f in PAGES:
    p = os.path.join(ROOT, f)
    s = open(p, encoding='utf-8').read()
    o = s
    if 'assets/review21.css' not in s:
        s = re.sub(
            r'(<link rel="stylesheet" href="assets/review20\.css\?v=[^"]*">)',
            r'\1\n<link rel="stylesheet" href="assets/review21.css?v=1">',
            s, count=1)
    if s != o:
        open(p, 'w', encoding='utf-8').write(s)
        log.append(f)
print('review21 linked into:', ', '.join(log) if log else '(already linked)')

# ---- B  the hero band ----------------------------------------------
# The plate goes in as the band's FIRST child so that source order
# alone would stack it correctly even if the z-index rules were ever
# dropped. Width/height are the artwork's own CSS size (1728 x 384),
# which is what stops the band reflowing while the image loads.
PLATE = ('<img alt="" class="hnl-bg" src="assets/hero-bg.png" '
         'width="1728" height="384" aria-hidden="true"/>')

p = os.path.join(ROOT, 'index.html')
s = open(p, encoding='utf-8').read()
o = s

if 'class="hnl-bg"' not in s:
    s = s.replace('<div class="hnl">', '<div class="hnl">' + PLATE, 1)

# the court drawing comes out
s = re.sub(r'<img[^>]*class="hnl-court"[^>]*/?>', '', s, count=1)

if s != o:
    open(p, 'w', encoding='utf-8').write(s)
    print('index.html: plate in, court out')
else:
    print('index.html: (already done)')
