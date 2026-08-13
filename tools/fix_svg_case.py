#!/usr/bin/env python3
"""Restore camelCase SVG names in system/_check/*.html.

HTML parsers lowercase tag and attribute names. SVG is case-sensitive, so a
round-trip through BeautifulSoup turns viewBox into viewbox and every icon,
flag and logo silently breaks. Run this after ANY script that rewrites those
pages with a parser.

Truth comes from design-system/*.html, which is never parsed.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(os.path.dirname(ROOT), "design-system")
CHK  = os.path.join(ROOT, "system", "_check")

cam = set()
for f in os.listdir(SRC):
    if not f.endswith(".html"): continue
    t = open(os.path.join(SRC, f), encoding="utf-8").read()
    cam |= set(re.findall(r"</?([a-zA-Z]*[A-Z][a-zA-Z]*)[\s/>]", t))
    cam |= set(re.findall(r"\s([a-zA-Z-]*[A-Z][a-zA-Z-]*)\s*=", t))
cam = sorted({c for c in cam if c.lower() != c}, key=len, reverse=True)

total = 0
for f in sorted(os.listdir(CHK)):
    if not f.endswith(".html"): continue
    p = os.path.join(CHK, f)
    t = open(p, encoding="utf-8").read()
    n = 0
    for c in cam:
        lo = c.lower()
        t, a = re.subn(rf"(?<=\s){lo}(\s*=)", c + r"\1", t)
        t, b = re.subn(rf"(</?){lo}(?=[\s/>])", r"\1" + c, t)
        n += a + b
    open(p, "w").write(t)
    total += n
    print(f"  {f:28} {n:6} restored")
print(f"total {total}")
sys.exit(0)
