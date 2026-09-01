#!/usr/bin/env python3
"""Seventeenth round — 2026-09-01 (Daniel's mark on the two
off-calendar states).

  A  assets    review17.css after review16.css, review17.js after
               review16.js, on every page.
  B  template  index.html gets the E-08 PlayerCard specimen inside a
               <template id="nl-pcard">, lifted verbatim from
               conference.html. A <template> keeps its contents out of
               every selector site.js runs across the document, which a
               hidden <div> would not.
  C  site.js   exports the player-card painter. The card's three
               figures are derived from the box scores inside site.js;
               a review layer cannot reach them, and a second
               implementation would drift.
  D  review16  stands down from building the off-season home when
               review17 is present.

Idempotent:
    python3 tools/p27_review17.py && python3 tools/bump_assets.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def P(*a):
    return os.path.join(ROOT, *a)


def read(p):
    return open(P(p), encoding='utf-8').read()


def write(p, s):
    open(P(p), 'w', encoding='utf-8').write(s)


PAGES = [f for f in sorted(os.listdir(ROOT)) if f.endswith('.html')]
log = []


def a_assets():
    for f in PAGES:
        s = read(f)
        o = s

        if 'assets/review17.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review16\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review17.css?v=1">',
                s, count=1)

        if 'assets/review17.js' not in s:
            s = re.sub(
                r'(<script defer src="assets/review16\.js\?v=[^"]*"></script>)',
                r'\1\n<script defer src="assets/review17.js?v=1"></script>',
                s, count=1)

        if s != o:
            write(f, s)
            log.append(f + ': review17 linked')


def pcard_fragment():
    """The <div class="sh sh-e1 pcard-sh"> ... </div> from conference.html,
    balanced by counting div tags."""
    s = read('conference.html')
    i = s.find('pcard-sh')
    if i < 0:
        return None
    start = s.rfind('<div', 0, i)
    depth = 0
    for m in re.finditer(r'<(/?)div\b[^>]*>', s[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return s[start:start + m.end()]
    return None


def b_template():
    s = read('index.html')
    if 'id="nl-pcard"' in s:
        return
    frag = pcard_fragment()
    if not frag:
        log.append('index.html: NO pcard fragment found in conference.html')
        return
    tpl = '<template id="nl-pcard">' + frag + '</template>'
    anchor = '<div class="tpl-content">'
    if anchor not in s:
        log.append('index.html: NO .tpl-content anchor')
        return
    s = s.replace(anchor, anchor + tpl, 1)
    write('index.html', s)
    log.append('index.html: E-08 PlayerCard template added (%d bytes)' % len(frag))


SITE_EXPORT = """
  /* Review 17 — the off-calendar layers build E-08 cards of their own,
     and the card's three figures are derived in here from the box
     scores. One export rather than a second implementation that would
     drift from this one. */
  window.NL = window.NL || {};
  window.NL.paintPlayerCard = function (card, p) {
    paintPlayerCard(card, p, playerCardStats(p));
  };

  /* ---------- boot ------------------------------------------ */"""


def c_site_export():
    s = read('assets/site.js')
    if 'window.NL.paintPlayerCard' in s:
        return
    anchor = "\n  /* ---------- boot ------------------------------------------ */"
    if anchor not in s:
        log.append('site.js: NO boot anchor')
        return
    s = s.replace(anchor, SITE_EXPORT, 1)
    write('assets/site.js', s)
    log.append('site.js: window.NL.paintPlayerCard exported')


def d_review16_standdown():
    s = read('assets/review16.js')
    if 'window.NL17' in s:
        return
    old = "      if (S.live) liveStopLinks(d.events);\n      else buildOffSeason(d);"
    new = ("      if (S.live) liveStopLinks(d.events);\n"
           "      /* Round seventeen rebuilt both off-calendar pages and takes\n"
           "         them over whole; this builder stays as the record of how\n"
           "         they were first argued. */\n"
           "      else if (!window.NL17) buildOffSeason(d);")
    if old not in s:
        log.append('review16.js: NO buildOffSeason call site')
        return
    write('assets/review16.js', s.replace(old, new, 1))
    log.append('review16.js: stands down when review17 is present')


for fn in (a_assets, b_template, c_site_export, d_review16_standdown):
    fn()

print('\n'.join(log) if log else 'nothing to do')
