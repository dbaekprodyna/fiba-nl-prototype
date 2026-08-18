#!/usr/bin/env python3
"""Self-contained copies of figma-export/, one file per element.

html.to.design's File tab takes a single .html, but its own docs warn that
externally linked resources "may not always be successful" — a stylesheet at
../assets/elements.css is exactly that case, and a silently unstyled import
looks like a plugin bug rather than a missing file.

These copies carry tokens/base/elements/modules inlined at build time, so the
file that lands in Figma renders with the CSS that was on disk when it was
built. Drag one into the plugin's File tab: no local server, no CORS, nothing
left to resolve. motion.css is deliberately left out — its keyframes would be
captured at whatever frame the import happens to hit.

Run after tools/build_figma_export.py.
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "figma-export")
OUT  = os.path.join(SRC, "inline")
CSS  = ["tokens.css", "base.css", "elements.css", "modules.css"]

blob = "<style>\n" + "\n".join(
    "/* ===== %s ===== */\n%s" % (n, open(os.path.join(ROOT, "assets", n), encoding="utf-8").read())
    for n in CSS) + "\n</style>"

link_re = re.compile(r'\s*<link\b[^>]*\.\./assets/[^>]*\.css[^>]*>', re.I)

os.makedirs(OUT, exist_ok=True)
made = []
for f in sorted(os.listdir(SRC)):
    if not f.endswith(".html"):
        continue
    html = open(os.path.join(SRC, f), encoding="utf-8").read()
    n = len(link_re.findall(html))
    html = link_re.sub("", html)
    html = html.replace("</head>", blob + "\n</head>", 1)
    open(os.path.join(OUT, f), "w", encoding="utf-8").write(html)
    made.append((f, len(html), n))

for f, n, k in made:
    print("  %-34s %6.0f KB   (%d sheets inlined)" % (f, n / 1024, k))
print("files:", len(made))
