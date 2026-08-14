#!/usr/bin/env python3
"""One import-ready HTML file per element, for html.to.design.

The specimen sheets are 1920-wide documents full of page furniture; importing
one drags in hundreds of layers that have nothing to do with the component.
These files carry a single element, its states laid out in a labelled column,
and nothing else — so html.to.design produces a small, clean layer tree whose
names come straight from the class names.
"""
import os, re, copy
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "system", "_check", "02-elements.html")
OUT  = os.path.join(ROOT, "figma-export")

HEAD = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>%s</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/tokens.css">
<link rel="stylesheet" href="../assets/base.css">
<link rel="stylesheet" href="../assets/elements.css">
<link rel="stylesheet" href="../assets/modules.css">
<style>
  body { background:#FFFFFF; padding:48px; }
  .fx-set { display:flex; flex-direction:column; gap:32px; align-items:flex-start; }
  .fx-name { font:800 28px 'Barlow Condensed',sans-serif; text-transform:uppercase; letter-spacing:-0.2px; }
  .fx-state { display:flex; flex-direction:column; gap:8px; align-items:flex-start; }
  .fx-label { font:600 12px 'Barlow',sans-serif; letter-spacing:1px; text-transform:uppercase; color:#737373; }
</style></head><body>
"""
TAIL = "</body></html>\n"


def slug(t):
    t = re.sub(r"[^\w\s-]", " ", t).strip().lower()
    return re.sub(r"[\s_]+", "-", t)[:50].strip("-")


def restore_case(html, raw):
    cam = set(re.findall(r"</?([a-zA-Z]*[A-Z][a-zA-Z]*)[\s/>]", raw)) | \
          set(re.findall(r"\s([a-zA-Z-]*[A-Z][a-zA-Z-]*)\s*=", raw))
    for c in sorted({c for c in cam if c.lower() != c}, key=len, reverse=True):
        lo = c.lower()
        html = re.sub(r"(?<=\s)%s(\s*=)" % lo, c + r"\1", html)
        html = re.sub(r"(</?)%s(?=[\s/>])" % lo, r"\1" + c, html)
    return html


os.makedirs(OUT, exist_ok=True)
raw = open(SRC, encoding="utf-8").read()
soup = BeautifulSoup(raw, "lxml")
made = []

for sec in soup.select("section.el-block"):
    nm = sec.select_one(".ds-name")
    if not nm:
        continue
    title = nm.get_text(" ", strip=True)
    s = slug(title)

    doc = BeautifulSoup(HEAD % title + TAIL, "lxml")
    setw = doc.new_tag("div"); setw["class"] = ["fx-set"]
    h = doc.new_tag("div"); h["class"] = ["fx-name"]; h.string = title
    setw.append(h)

    for st in sec.select(".el-state"):
        if st.find_parent(class_="live-demo"):
            continue                       # the interactive copy is not for Figma
        lab = st.select_one(".el-state-label")
        comp = [c for c in st.find_all(recursive=False)
                if "el-state-label" not in (c.get("class") or [])]
        if not comp:
            continue
        wrap = doc.new_tag("div"); wrap["class"] = ["fx-state"]
        l = doc.new_tag("div"); l["class"] = ["fx-label"]
        l.string = lab.get_text(" ", strip=True) if lab else "state"
        wrap.append(l)
        for c in comp:
            wrap.append(copy.copy(c))
        setw.append(wrap)

    doc.body.append(setw)
    html = restore_case(str(doc), raw)
    open(os.path.join(OUT, s + ".html"), "w").write(html)
    made.append((s, len(html)))

for s, n in made:
    print("  %-34s %6.0f KB" % (s + ".html", n / 1024))
print("files:", len(made))
