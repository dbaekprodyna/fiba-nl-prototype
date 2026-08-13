import re, os, json, collections
exec(open("merge.py").read().split("print(f\"merged rules")[0])

OUT="/sessions/awesome-zen-brown/mnt/FIBA-2026/fiba-nl-prototype"
os.makedirs(f"{OUT}/assets",exist_ok=True); os.makedirs(f"{OUT}/system/assets",exist_ok=True)

DOC_PREFIX = (".doc",".el-block",".el-head",".el-purpose",".el-states",".el-state",".el-note",
              ".ds-name",".m-block",".m-head",".m-states",".m-state",".m-frame",".m-family",
              ".tpl-block",".tpl-head",".tpl-frame",".fn-",".bs-box",".sw",".spec",".gridcol",".tok")
BASE_SEL = re.compile(r"^(\*|body|b|html|\.cut|\.cutfill|\.t-[a-z0-9-]+|\.lbl|\.focus-ring)$")
def bucket(head, key):
    h=head.split()[0].split(":")[0]
    if any(h.startswith(p) for p in DOC_PREFIX): return "docs"
    if BASE_SEL.match(h): return "base"
    return "elements" if key in el else "modules"

rules = merged + fnd_only
buckets = collections.defaultdict(list)
allheads = {h for c,h,d,k in rules}
for c,h,d,k in rules:
    if h==":root": continue
    buckets[bucket(h,(c,h))].append((c,h,d,k))

# ---- pseudo-class pairing -------------------------------------------------
PAIR = {"-hover":":hover", "-focus":":focus-visible", "-active":":active"}
paired=0
for b in ("elements","modules"):
    add=[]
    for c,h,d,k in buckets[b]:
        for suf,pc in PAIR.items():
            if h.endswith(suf) and " " not in h and h.count(".")==1:
                stem=h[:-len(suf)]
                if stem in allheads:
                    add.append((c, f"{stem}{pc}", d, False)); paired+=1
                break
    buckets[b]+=add

def fmt(c,h,d,k):
    if k: return f"{h} {{{d}}}\n"
    decls = [p.strip() for p in d.split(";") if p.strip()]
    body = "".join(f"  {p};\n" for p in decls)
    s = f"{h} {{\n{body}}}\n"
    if c: s = c+" {\n"+re.sub(r"^","  ",s,flags=re.M)+"}\n"
    return s

HDR = ("/* ============================================================\n"
       "   FIBA 3x3 Nations League — {name}\n"
       "   {desc}\n"
       "   Generated from design-system/*.html — edit here, not there.\n"
       "   ============================================================ */\n\n")

GROUPS = [("surface","Surfaces"),("border","Borders"),("text","Text"),("action","Actions"),
          ("status","Status"),("chrome","Site chrome (dark bars)")]
tok = HDR.format(name="tokens.css", desc="Single source of truth for colour, motion and layout values.")
tok += ":root {\n"
used=set()
for pre,label in GROUPS:
    ks=[k for k in allvars if k.startswith("--"+pre)]
    if not ks: continue
    tok += f"\n  /* {label} */\n"
    for k in ks: tok += f"  {k}: {allvars[k]};\n"; used.add(k)
rest=[k for k in allvars if k not in used]
if rest:
    tok += "\n  /* Other */\n" + "".join(f"  {k}: {allvars[k]};\n" for k in rest)
tok += """
  /* Motion — every transition in the system reads from these */
  --dur-fast: 120ms;
  --dur-base: 200ms;
  --dur-slow: 360ms;
  --dur-page: 480ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  /* Layout */
  --content-max: 1440px;
  --gutter: 240px;
}
"""
open(f"{OUT}/assets/tokens.css","w").write(tok)

for b,(name,desc,path) in {
  "base":("base.css","Reset, typography scale and the 45° cut treatment.",f"{OUT}/assets/base.css"),
  "elements":("elements.css","Element library — buttons, fields, chips, cards, tabs …",f"{OUT}/assets/elements.css"),
  "modules":("modules.css","Modules — F / S / R / E / C families.",f"{OUT}/assets/modules.css"),
  "docs":("docs.css","Specimen-sheet chrome. Used by the guideline site only.",f"{OUT}/system/assets/docs.css"),
}.items():
    open(path,"w").write(HDR.format(name=name,desc=desc) + "".join(fmt(*r) for r in buckets[b]))

open(f"{OUT}/assets/motion.css","w").write(HDR.format(name="motion.css",
  desc="Transitions and animations. Timings come from tokens.css.") + """@media (prefers-reduced-motion: no-preference) {
  .btn, .chip, .card, .tab, .lnk, .pag-i, .ntab, .fld, .search,
  .acc-row, .trow, .e09-cell, .s03-d, .car-btn, .lb-nav {
    transition:
      background-color var(--dur-fast) var(--ease-out),
      color            var(--dur-fast) var(--ease-out),
      border-color     var(--dur-fast) var(--ease-out),
      transform        var(--dur-fast) var(--ease-out);
  }
  .card-int:hover, .e09-cell:hover { transform: translateY(-2px); }
  .acc-body { transition: grid-template-rows var(--dur-base) var(--ease-in-out); }
}

/* Scroll reveal — applied by app.js via IntersectionObserver */
.reveal { opacity: 0; transform: translateY(16px); }
.reveal.is-in {
  opacity: 1; transform: none;
  transition: opacity var(--dur-slow) var(--ease-out),
              transform var(--dur-slow) var(--ease-out);
}

/* Cross-document page transitions (progressive enhancement) */
@view-transition { navigation: auto; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
  .reveal { opacity: 1; transform: none; }
}
""")

print(f"pseudo-class pairs generated : {paired}")
for b in buckets: print(f"  {b:10} {len(buckets[b]):5} rules")
for p in ["assets/tokens.css","assets/base.css","assets/elements.css","assets/modules.css",
          "assets/motion.css","system/assets/docs.css"]:
    print(f"  {p:28} {os.path.getsize(OUT+'/'+p):7,} bytes")
