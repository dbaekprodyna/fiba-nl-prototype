#!/usr/bin/env python3
"""Turn the approved templates into the prototype's pages.

Each T · block in system/_check/04-templates.html is already a complete
page — corporate strip, competition nav, content, footer. This lifts each
one out, wires the navigation, and marks it `.live` so every interaction
the design system documents actually works.

Content is filled from assets/data/*.json at runtime by assets/site.js;
the markup here is the design, untouched.
"""
import os, re
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "system", "_check", "04-templates.html")

PAGES = {
    "T · Home": ("index.html", "Nations League 2026"),
    "T · Conferences": ("conferences.html", "Conferences"),
    "T · Conference": ("conference.html", "Conference"),
    "T · Stop": ("stop.html", "Stop"),
    "T · Standings": ("standings.html", "Standings"),
    "T · Teams": ("teams.html", "Teams"),
    "T · Team": ("team.html", "Team"),
    "T · Player": ("player.html", "Player"),
    "T · Stats": ("stats.html", "Stats"),
    "T · Calendar": ("calendar.html", "Calendar"),
    "T · News": ("news.html", "News"),
    "T · Article": ("article.html", "Article"),
    "T · About": ("about.html", "About"),
    "T · Search": ("search.html", "Search"),
}

NAV = {
    "conferences": "conferences.html", "standings": "standings.html",
    "teams": "teams.html", "stats": "stats.html", "calendar": "calendar.html",
    "news": "news.html", "about": "about.html", "home": "index.html",
    "find a team": "teams.html", "full standings": "standings.html",
    "all conferences": "conferences.html", "all news": "news.html",
    "all galleries": "index.html", "full schedule": "calendar.html",
}

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
<title>%s — FIBA 3x3 Nations League</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/elements.css">
<link rel="stylesheet" href="assets/modules.css">
<link rel="stylesheet" href="assets/motion.css">
<link rel="stylesheet" href="assets/interactions.css">
<link rel="stylesheet" href="assets/behaviour.css">
<link rel="stylesheet" href="assets/site.css">
</head>
<body class="live" data-page="%s">
"""
TAIL = """
<script src="assets/app.js" defer></script>
<script src="assets/site.js" defer></script>
</body>
</html>
"""


def restore_case(html, raw):
    cam = set(re.findall(r"</?([a-zA-Z]*[A-Z][a-zA-Z]*)[\s/>]", raw)) | \
          set(re.findall(r"\s([a-zA-Z-]*[A-Z][a-zA-Z-]*)\s*=", raw))
    for c in sorted({c for c in cam if c.lower() != c}, key=len, reverse=True):
        lo = c.lower()
        html = re.sub(r"(?<=\s)%s(\s*=)" % lo, c + r"\1", html)
        html = re.sub(r"(</?)%s(?=[\s/>])" % lo, r"\1" + c, html)
    return html


raw = open(SRC, encoding="utf-8").read()
soup = BeautifulSoup(raw, "lxml")
made = []

for sec in soup.select("section.tpl-block"):
    nm = sec.select_one(".ds-name")
    if not nm:
        continue
    key = nm.get_text(" ", strip=True)
    if key not in PAGES:
        continue
    fname, title = PAGES[key]
    tpl = sec.select_one(".tpl")
    if tpl is None:
        continue

    page = BeautifulSoup(str(tpl), "lxml")
    root = page.select_one(".tpl")
    root["data-page"] = fname

    # link the navigation
    for el in root.select(".f03-i, .f06-link, .lnk, .crumb, .mm-l, .ntab"):
        label = el.get_text(" ", strip=True).lower().strip()
        href = NAV.get(label)
        if not href:
            continue
        a = page.new_tag("a"); a["href"] = href; a["class"] = ["nav-a"]
        el.insert_before(a); a.append(el.extract())
    # the wordmark goes home
    for mark in root.select(".f03-mark, .f03-word"):
        a = page.new_tag("a"); a["href"] = "index.html"; a["class"] = ["nav-a"]
        mark.insert_before(a); a.append(mark.extract())
    # the search icon opens the search page
    for s in root.select(".f03-search"):
        a = page.new_tag("a"); a["href"] = "search.html"; a["class"] = ["nav-a"]
        s.insert_before(a); a.append(s.extract())

    html = HEAD % (title, fname) + str(root) + TAIL
    html = restore_case(html, raw)
    open(os.path.join(ROOT, fname), "w", encoding="utf-8").write(html)
    made.append((fname, len(html) // 1024))

for f, k in made:
    print("  %-20s %4d KB" % (f, k))
print("pages:", len(made))
