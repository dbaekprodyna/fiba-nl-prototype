#!/usr/bin/env python3
"""Regenerate assets/interactions.css from the specimen modifier classes.

Every `.live X:hover` rule copies the declarations of its matching
`-hover` / `-focus` / `-active` modifier verbatim, so what the
documentation shows and what the mouse does cannot drift apart.

Edit the modifier in elements.css / modules.css, then re-run this.
Hand-written behaviour lives in assets/behaviour.css and is untouched.
"""
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
css = "".join(open(os.path.join(ROOT, "assets", f)).read() for f in ("elements.css", "modules.css"))
RULES = {" ".join(s.split()): " ".join(b.split())
         for s, b in re.findall(r"(?m)^([^{}\n][^{}]*?)\{([^{}]*?)\}", css, re.S)}

MAP = [
 (".btn-primary-hover", ".btn-primary:hover"), (".btn-primary-active", ".btn-primary:active"),
 (".btn-primary-focus", ".btn-primary:focus-visible"),
 (".btn-outline-hover", ".btn-outline:hover"), (".btn-outline-active", ".btn-outline:active"),
 (".btn-outline-focus", ".btn-outline:focus-visible"),
 (".btn-ghost-hover", ".btn-ghost:hover"), (".btn-ghost-active", ".btn-ghost:active"),
 (".btn-ghost-focus", ".btn-ghost:focus-visible"),
 (".lnk-hover", ".lnk:hover"), (".lnk-focus", ".lnk:focus-visible"),
 (".tab-hover", ".tab:not(.tab-active):hover"), (".tab-focus", ".tab:focus-visible"),
 (".fld-hover", ".fld:hover"), (".fld-focus-ring", ".fld:focus-within"),
 (".search-hover", ".search:hover"), (".search-focus", ".search:focus-within"),
 (".chk-box-hover", ".chk:hover .chk-box:not(.chk-box-on)"),
 (".chk-box-focus", ".chk:focus-within .chk-box"),
 (".el02-hover", ".el02-seg:not(.el02-on):hover"), (".el02-focus", ".el02-seg:focus-visible"),
 (".chip-hover", ".chip:not(.chip-on):hover"), (".chip-focus", ".chip:focus-visible"),
 (".ftag-hover", ".ftag:not(.ftag-plain):hover"), (".ftag-focus", ".ftag:focus-visible"),
 (".pag-hover", ".pag-i:not(.pag-cur):not(.pag-dis):hover"), (".pag-focus", ".pag-i:focus-visible"),
 (".trow-hover", ".trow:hover"), (".trow-focus", ".trow:focus-visible"),
 (".acm-row-hover", ".acm-row:hover"), (".acm-row-focus", ".acm-row:focus-visible"),
 (".ac-row-hover", ".ac-row:hover"), (".acc-head-hover", ".acc-head:hover"),
 (".ntab-hover", ".ntab:not(.ntab-on):hover"), (".ntab-focus", ".ntab:focus-visible"),
 (".alpha-i.alpha-hover", ".alpha-i:not(.alpha-on):not(.alpha-dis):hover"),
 (".card-hover", ".card-int:hover"), (".card-focus", ".card-int:focus-visible"),
 (".dsel-hover", ".dsel:hover"), (".dsel-focus", ".dsel:focus-visible"),
 (".dsel-item-hover", ".dsel-item:hover"),
 (".crumb-hover", ".crumb:not(.crumb-cur):hover"), (".shm-i-hover", ".shm-i:hover"),
 (".dotb-hover", ".dotb:not(.dotb-sel):hover"), (".dotb-focus", ".dotb:focus-visible"),
 (".dotb-active", ".dotb:active"),
 (".wl-hover", ".wl:hover"), (".wl-focus-live", ".wl-live:focus-visible"),
 (".wl-focus-dark", ".wl-dark:focus-visible"), (".wl-focus-ghost", ".wl-ghost:focus-visible"),
 (".f03-i.f03-hover", ".f03-i:not(.f03-dis):hover"), (".e09-cell-hover", ".e09-cell:hover"),
 (".mm-l-hover", ".mm-l:hover"),
 (".s03-hover", ".s03-d:not(.s03-on):not(.s03-off):hover"), (".s03-focus", ".s03-d:focus-visible"),
]

out = ["""/* ============================================================
   FIBA 3x3 Nations League — interactions.css   GENERATED FILE
   Produced by tools/gen_states.py. Do not hand-edit.

   Each rule copies the declarations of its specimen modifier
   class verbatim, so the documented state and the live state
   cannot drift apart. Change the modifier, then regenerate.
   Hand-written behaviour lives in assets/behaviour.css.
   ============================================================ */
"""]
missing = []
for mod, target in MAP:
    body = RULES.get(mod)
    if body is None:
        missing.append(mod); continue
    decls = "".join("  %s;\n" % d.strip() for d in body.split(";") if d.strip())
    out.append("/* from %s */\n.live %s {\n%s}\n" % (mod, target, decls))

open(os.path.join(ROOT, "assets", "interactions.css"), "w").write("\n".join(out))
print("wrote %d rules" % (len(out) - 1))
if missing:
    print("no specimen class for:", ", ".join(missing)); sys.exit(1)
