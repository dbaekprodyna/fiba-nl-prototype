#!/usr/bin/env python3
"""Split the specimen sheets into one fragment per component.

Reads system/_check/*.html, writes system/blocks/<group>/<slug>.html plus
system/nav.json. The sheets stay the source of truth; this is a derived
view, so re-run it after editing them.
"""
import os, re, json, unicodedata
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "system", "_check")
OUT  = os.path.join(ROOT, "system", "blocks")

SHEETS = [
    ("00-foundations", "Foundations", "01-foundations.html", ".fn-block", ".fn-block-title"),
    ("01-elements",    "Elements",    "02-elements.html",    "section.el-block", ".ds-name"),
    ("02-modules",     "Modules",     "03a-modules-frame.html",    "section.m-block", ".ds-name"),
    ("02-modules",     "Modules",     "03b-modules-ranking.html",  "section.m-block", ".ds-name"),
    ("02-modules",     "Modules",     "03c-modules-content.html",  "section.m-block", ".ds-name"),
    ("03-templates",   "Templates",   "04-templates.html",   "section.tpl-block", ".ds-name"),
]

def slug(text):
    t = unicodedata.normalize("NFKD", text)
    t = re.sub(r"[^\w\s-]", " ", t).strip().lower()
    return re.sub(r"[\s_]+", "-", t)[:60].strip("-")

nav, seen = [], set()
groups = {}
for gid, gname, fname, blocksel, titlesel in SHEETS:
    path = os.path.join(SRC, fname)
    if not os.path.exists(path):
        continue
    soup = BeautifulSoup(open(path, encoding="utf-8").read(), "lxml")
    for block in soup.select(blocksel):
        cls = blocksel.split(".")[-1]
        if any(cls in (p.get("class") or []) for p in block.parents):
            continue                      # a block nested inside another is a duplicate
        t = block.select_one(titlesel)
        title = t.get_text(" ", strip=True) if t else ""
        if not title:
            continue
        s = slug(title)
        base, i = s, 2
        while (gid, s) in seen:
            s = "%s-%d" % (base, i); i += 1
        seen.add((gid, s))

        purpose = block.select_one(".el-purpose, .fn-note")
        os.makedirs(os.path.join(OUT, gid), exist_ok=True)
        html = str(block)
        # restore camelCase SVG names lost to the HTML parser
        raw = open(path, encoding="utf-8").read()
        cam = set(re.findall(r"</?([a-zA-Z]*[A-Z][a-zA-Z]*)[\s/>]", raw)) | \
              set(re.findall(r"\s([a-zA-Z-]*[A-Z][a-zA-Z-]*)\s*=", raw))
        for c in sorted({c for c in cam if c.lower() != c}, key=len, reverse=True):
            lo = c.lower()
            html = re.sub(r"(?<=\s)%s(\s*=)" % lo, c + r"\1", html)
            html = re.sub(r"(</?)%s(?=[\s/>])" % lo, r"\1" + c, html)
        open(os.path.join(OUT, gid, s + ".html"), "w").write(html)

        groups.setdefault(gid, {"id": gid, "name": gname, "items": []})
        groups[gid]["items"].append({
            "slug": s, "title": title,
            "desc": (purpose.get_text(" ", strip=True)[:180] if purpose else ""),
            "source": fname,
        })

nav = [groups[k] for k in ("00-foundations", "01-elements", "02-modules", "03-templates") if k in groups]
json.dump(nav, open(os.path.join(ROOT, "system", "nav.json"), "w"), ensure_ascii=False, indent=1)
print("groups:", [(g["name"], len(g["items"])) for g in nav])
print("total blocks:", sum(len(g["items"]) for g in nav))
