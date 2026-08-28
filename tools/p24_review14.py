#!/usr/bin/env python3
"""Fourteenth round — 2026-08-28 (Daniel's eleventh mark-up).

  A  assets   review14.css / mobile14.css linked on every page.
  B  site.js  the Stops tab of a conference opens on the live stop.
  C  system   the design system links rounds thirteen and fourteen.

Five items this round:

  * the hero's two brand elements go back to the round-five
    sizing, at seven tenths of it (assets/review14.css);
  * an unselected tab label is black, not grey — ctl-03 Tab and
    el-02's segmented switch (assets/review14.css);
  * the player portrait is twice the size, on both layouts
    (assets/review14.css + assets/mobile14.css);
  * "Open stop page" wears the outline control the phone got in
    round twelve, pushed to the right edge (assets/review14.css);
  * conference.html opens the Stops tab on the stop being played,
    or on the last one that has taken place (assets/site.js).

review14.css goes after review13.css and before hero.css, so the
mobile layers still override it on a phone. mobile14.css goes last
of all, after mobile13.css.

Idempotent:
    python3 tools/p24_review14.py && python3 tools/bump_assets.py
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
        if 'assets/review14.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review13\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review14.css?v=1">',
                s, count=1)
        if 'assets/mobile14.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/mobile13\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/mobile14.css?v=1">',
                s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review14 / mobile14 linked')


def b_stopdefault():
    """conference.html chose its stop once, at load, and chose the
    newest one with results. The Stops tab is where you go to find
    out what is on, so it reads the day instead: the live stop
    while one is being played, the last stop that has taken place
    once it is over, and the first stop before a conference opens.

    Played is a calendar fact, not a snapshot fact — a stop whose
    results have not been ingested has still happened — so this
    counts stopPlayed() and not standingsFor()."""
    s = read('assets/site.js')
    o = s

    old = ("    var gender = 'men';\n"
           "    var sel = Math.max(0, played.length - 1);"
           "   /* the newest stop with results */\n")
    new = """    var gender = 'men';

    /* Review 14 — the Stops tab opens on what is being played.
       A conference is read to find out where it is right now, so
       the tab lands on the live stop while one is on, and on the
       last stop that has taken place once the day is over.
       Played is a calendar fact, not a snapshot fact — a stop
       whose results have not been ingested has still happened,
       which is why this counts stopPlayed() and not standings. */
    function defaultStop() {
      var live = -1, last = -1;
      stops.forEach(function (e, i) {
        if (stopLive(e, today)) live = i;
        if (stopPlayed(e, today)) last = i;
      });
      if (live > -1) return live;
      if (last > -1) return last;
      return 0;   /* nothing has been played yet: the first stop is next */
    }
    var sel = defaultStop();
"""
    if 'function defaultStop()' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: stop selector not found as expected')
        s = s.replace(old, new)

    old2 = ("    genderSwitch(function (g) { gender = g; draw(); });\n"
            "    tabPanes(document, '.cnf-tabs');\n")
    new2 = """    genderSwitch(function (g) { gender = g; draw(); });
    tabPanes(document, '.cnf-tabs');

    /* Pressing Stops re-reads the day: the tab is an entry point,
       not a place you are kept, so it always opens on the live
       stop (or the last played one) however far you browsed
       before leaving it. Inside the tab the dots still rule. */
    $$('.cnf-tabs .tab').forEach(function (t) {
      if (t.dataset.tab !== 'stops') return;
      t.addEventListener('click', function () {
        sel = defaultStop();
        drawStopNav(); drawStop(); drawGames();
      });
    });
"""
    if "t.dataset.tab !== 'stops'" not in s:
        if s.count(old2) != 1:
            raise SystemExit('site.js: conference tab setup not found')
        s = s.replace(old2, new2)

    if s != o:
        write('assets/site.js', s)
        log.append('assets/site.js: Stops opens on the live stop')


def c_system():
    """The design system shell was still linking up to review11.css —
    rounds twelve and thirteen never reached it, so the specimens
    were a fortnight behind the pages. Thirteen and fourteen are
    added here. mobile*.css stays out on purpose: the shell is not
    the prototype frame and the specimens are read at desktop
    width."""
    targets = [('system/index.html', '../assets/')]
    cdir = P('system', '_check')
    if os.path.isdir(cdir):
        for f in sorted(os.listdir(cdir)):
            if f.endswith('.html'):
                targets.append(('system/_check/' + f, '../../assets/'))

    for f, pre in targets:
        s = read(f)
        o = s
        for after, n in (('review11', 'review13'), ('review13', 'review14')):
            if pre + n + '.css' in s:
                continue
            s = re.sub(
                r'(<link rel="stylesheet" href="' + re.escape(pre + after) +
                r'\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="' + pre + n + '.css?v=1">',
                s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review13 / review14 linked')


for fn in (a_assets, b_stopdefault, c_system):
    fn()

print('\n'.join(log) if log else 'nothing to do')
