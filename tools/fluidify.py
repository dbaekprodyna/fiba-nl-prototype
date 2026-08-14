#!/usr/bin/env python3
"""Turn hard-coded container widths into fluid ones.

The specimen sheets were drawn at a fixed 1920 / 1440, so every container
carries `width: 1440px`. Inside the guideline shell — and later inside a
browser window that is not 1920 wide — that is what pushes content past the
right edge.

Any `width: Npx` where N >= THRESHOLD becomes
    width: 100%; max-width: Npx;
so the container keeps its intended maximum but can shrink. Smaller values
are real component sizes (a 342 card, a 44 button) and are left alone.

Idempotent: a rule that already has max-width is skipped.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ["assets/modules.css", "assets/elements.css", "system/assets/docs.css"]
THRESHOLD = 640

changed_total = 0
for rel in FILES:
    p = os.path.join(ROOT, rel)
    css = open(p, encoding="utf-8").read()
    out, last, changed = [], 0, 0

    for m in re.finditer(r"(?m)^([^{}\n][^{}]*?)\{([^{}]*?)\}", css, re.S):
        sel, body = m.group(1), m.group(2)
        if "max-width" in body:
            continue
        new = body
        for w in re.finditer(r"(?<!max-)(?<!min-)\bwidth:\s*(\d+)px", body):
            n = int(w.group(1))
            if n < THRESHOLD:
                continue
            new = new.replace(w.group(0), "width:100%;\n  max-width:" + str(n) + "px", 1)
        if new != body:
            out.append(css[last:m.start(2)])
            out.append(new)
            last = m.end(2)
            changed += 1
    out.append(css[last:])
    if changed:
        open(p, "w", encoding="utf-8").write("".join(out))
    print("  %-28s %3d containers made fluid" % (rel, changed))
    changed_total += changed

print("total:", changed_total)
