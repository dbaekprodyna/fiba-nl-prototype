#!/usr/bin/env python3
"""Build the guideline site's pages and menu from the specimen sheets.

Reads  system/_check/*.html
Writes system/pages/<group>.html   — one long page per group, every block
                                     wrapped in an anchor target
       system/nav.json             — sidebar structure

The sheets stay the source of truth; this is a derived view, so re-run
after editing them. Templates are deliberately excluded: they are shown
as the working prototype, not as documentation.
"""
import os, re, json, unicodedata
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "system", "_check")
OUT  = os.path.join(ROOT, "system", "pages")

GROUPS = [
    ("foundations", "Foundations",
     [("01-foundations.html", ".fn-block", ".fn-block-title")]),
    ("elements", "Elements",
     [("02-elements.html", "section.el-block", ".ds-name")]),
    ("modules-1", "Modules · Frame & Schedule",
     [("03a-modules-frame.html", "section.m-block", ".ds-name")]),
    ("modules-2", "Modules · Ranking, Entity & Content",
     [("03b-modules-ranking.html", "section.m-block", ".ds-name"),
      ("03c-modules-content.html", "section.m-block", ".ds-name")]),
]


def slug(text):
    t = unicodedata.normalize("NFKD", text)
    t = re.sub(r"[^\w\s-]", " ", t).strip().lower()
    return re.sub(r"[\s_]+", "-", t)[:60].strip("-")


def restore_case(html, raw):
    """HTML parsers lowercase attribute names; SVG is case-sensitive."""
    cam = set(re.findall(r"</?([a-zA-Z]*[A-Z][a-zA-Z]*)[\s/>]", raw)) | \
          set(re.findall(r"\s([a-zA-Z-]*[A-Z][a-zA-Z-]*)\s*=", raw))
    for c in sorted({c for c in cam if c.lower() != c}, key=len, reverse=True):
        lo = c.lower()
        html = re.sub(r"(?<=\s)%s(\s*=)" % lo, c + r"\1", html)
        html = re.sub(r"(</?)%s(?=[\s/>])" % lo, r"\1" + c, html)
    return html


os.makedirs(OUT, exist_ok=True)
nav = []

for gid, gname, sheets in GROUPS:
    items, parts, seen = [], [], set()
    for fname, blocksel, titlesel in sheets:
        path = os.path.join(SRC, fname)
        if not os.path.exists(path):
            continue
        raw = open(path, encoding="utf-8").read()
        soup = BeautifulSoup(raw, "lxml")
        cls = blocksel.split(".")[-1]
        for block in soup.select(blocksel):
            if any(cls in (p.get("class") or []) for p in block.parents):
                continue                      # nested block is a duplicate
            t = block.select_one(titlesel)
            title = t.get_text(" ", strip=True) if t else ""
            if not title:
                continue
            s, base, i = slug(title), slug(title), 2
            while s in seen:
                s = "%s-%d" % (base, i); i += 1
            seen.add(s)

            purpose = block.select_one(".el-purpose, .fn-note")
            html = restore_case(str(block), raw)
            parts.append(
                '<section class="anchor" id="%s" data-anchor="%s">%s</section>'
                % (s, s, html))
            items.append({
                "slug": s,
                "title": title,
                "desc": (purpose.get_text(" ", strip=True)[:180] if purpose else ""),
            })

    open(os.path.join(OUT, gid + ".html"), "w").write("\n".join(parts))
    nav.append({"id": gid, "name": gname, "items": items})

json.dump(nav, open(os.path.join(ROOT, "system", "nav.json"), "w"),
          ensure_ascii=False, indent=1)

for g in nav:
    size = os.path.getsize(os.path.join(OUT, g["id"] + ".html"))
    print("%-38s %3d blocks  %6.0f KB" % (g["name"], len(g["items"]), size / 1024))
print("total blocks:", sum(len(g["items"]) for g in nav))
