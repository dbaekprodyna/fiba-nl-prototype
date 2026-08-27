#!/usr/bin/env python3
"""Tenth round — 2026-08-27 (Daniel's seventh mark-up).

  A  assets   review10.css / mobile10.css / review10.js on every page.
  B  site.js  the video frame always has a still.
  C  site.js  a player's federation is the one on his shirt.
  D  site.js  TeamFinder counts the stops of one conference.

Everything else this round is CSS in the two new sheets plus the
phone-only measurements in review10.js.

Idempotent: every step is guarded.
    python3 tools/p19_review10.py && python3 tools/bump_assets.py
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


PAGES = [f for f in sorted(os.listdir(ROOT))
         if f.endswith('.html') and f not in ('qualification.html',)]

log = []


# ---------------------------------------------------------------- A
def a_assets():
    for f in PAGES:
        s = read(f)
        o = s
        if 'assets/review10.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review9\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review10.css?v=1">',
                s, count=1)
        if 'assets/mobile10.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/mobile9\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/mobile10.css?v=1">',
                s, count=1)
        if 'assets/review10.js' not in s:
            s = re.sub(
                r'(<script defer src="assets/review7\.js\?v=[^"]*"></script>)',
                r'\1\n<script defer src="assets/review10.js?v=1"></script>',
                s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review10 / mobile10 linked')


# ---------------------------------------------------------------- B
def b_poster():
    """The frame on conferences.html was a flat grey box.

    posterOf walks poster -> the stream's own thumbnail -> the stop's
    gallery cover, and today's stop — U21 Europe-2, Debrecen — has
    none of the three: it is one of the fifty-nine stops with no
    stream mapped yet, and its gallery is empty, so `cover` is null.
    The chain ran out and returned '', videoFrame drew no <img> at
    all, and what was left was the shade and the play button on the
    frame's own background.

    Two more steps on the end. A stop with nothing of its own borrows
    the newest picture its conference has — it is the right event and
    the right teams, which is what the still is doing there — and
    below that there is a house still that is drawn, not fetched, so
    the frame can never be empty again and never depends on a network
    that might not answer.
    """
    s = read('assets/site.js')
    o = s

    if 'POSTER_FALLBACK' not in s:
        s = s.replace(
            "  var YT_STREAMS = 'https://www.youtube.com/@FIBA3x3/streams';",
            "  var YT_STREAMS = 'https://www.youtube.com/@FIBA3x3/streams';\n"
            "  /* Review 10: the last resort. A local file, so it cannot\n"
            "     fail to load, and it is the band's own gradient and court\n"
            "     rather than a photograph of somewhere else. */\n"
            "  var POSTER_FALLBACK = 'assets/poster-nl.svg';", 1)

    old = """  function posterOf(ev) {
    if (!ev) return '';
    if (ev.poster) return ev.poster;
    if (ev.video) return ytThumb(ev.video);
    return ev.cover || '';
  }"""
    new = """  function posterOf(ev) {
    if (!ev) return POSTER_FALLBACK;
    if (ev.poster) return ev.poster;
    if (ev.video) return ytThumb(ev.video);
    if (ev.cover) return ev.cover;
    /* Review 10: a stop with no stream and no gallery of its own —
       there are twenty-five of them — used to return nothing, and an
       empty string means videoFrame draws no image and the frame is
       a grey rectangle. The conference's own newest cover is the
       closest true picture of it. */
    var sib = null;
    if (ev.conference && D.events) {
      D.events.forEach(function (x) {
        if (x.conference !== ev.conference || !x.cover) return;
        if (!sib || (x.start || '') > (sib.start || '')) sib = x;
      });
    }
    return (sib && sib.cover) || POSTER_FALLBACK;
  }"""
    if old in s:
        s = s.replace(old, new, 1)
        log.append('site.js: posterOf falls back to the conference, then to the house still')

    old2 = """      if (ev && ev.video && pimg.src.indexOf('/hq720.jpg') > -1) {
        pimg.src = ytThumb(ev.video, 'mqdefault');
      } else {
        pimg.remove();
      }"""
    new2 = """      if (ev && ev.video && pimg.src.indexOf('/hq720.jpg') > -1) {
        pimg.src = ytThumb(ev.video, 'mqdefault');
      } else if (pimg.src.indexOf(POSTER_FALLBACK) < 0) {
        /* A cover that 404s, or a network that will not reach
           ytimg — the house still is local and always answers. */
        pimg.src = POSTER_FALLBACK;
      } else {
        pimg.remove();
      }"""
    if old2 in s:
        s = s.replace(old2, new2, 1)
        log.append('site.js: a still that fails to load falls back rather than vanishing')

    if s != o:
        write('assets/site.js', s)


# ---------------------------------------------------------------- C
def c_nation():
    """FRANCE over a player wearing ALG.

    players.json carries `country`, and in the federation's own feed
    that field is where the player lives, not who he plays for: 73 of
    the 711 players in the season are on one federation's roster and
    resident in another. The page was reading it as the federation —
    so Mehdi Bouhmama, ALG, had France in his breadcrumb and France
    beside his flag.

    The federation is the IOC code, which every one of them has and
    which the flag beside it is already drawn from. `country` stays as
    the fallback for a player with no code.
    """
    s = read('assets/site.js')
    o = s

    if 'function nationOf(' not in s:
        anchor = ("  function conf(id) { return D.conferences.filter("
                  "function (c) { return c.id === id; })[0]; }")
        if anchor in s:
            s = s.replace(anchor, anchor + """

  /* Review 10: the federation a player represents, from the code on
     his shirt. players.json's `country` is his residence and the two
     disagree for 73 players in the season. */
  function nationOf(ioc) {
    if (!ioc || !D.teams) return '';
    var t = D.teams.filter(function (x) { return x.ioc === ioc; })[0];
    return (t && t.name) || '';
  }""", 1)
            log.append('site.js: nationOf(ioc)')

    pairs = [
        ("            { label: p.country || '', href: 'team.html?ioc=' + p.ioc },",
         "            { label: nationOf(p.ioc) || p.country || '', "
         "href: 'team.html?ioc=' + p.ioc },"),
        ("if (ph) { flag(ph, p.ioc); text(ph, '.ftag-code', p.ioc); "
         "text(ph, '.ftag-name', p.country); }",
         "if (ph) { flag(ph, p.ioc); text(ph, '.ftag-code', p.ioc); "
         "text(ph, '.ftag-name', nationOf(p.ioc) || p.country); }"),
        ("          fed(row, p.ioc, p.country);",
         "          fed(row, p.ioc, nationOf(p.ioc) || p.country);"),
        ("          text(row, '.e11-m', p.country || '');",
         "          text(row, '.e11-m', nationOf(p.ioc) || p.country || '');"),
    ]
    for a, b in pairs:
        if a in s:
            s = s.replace(a, b, 1)
    if s != o:
        write('assets/site.js', s)
        log.append('site.js: the player carries his federation, not his address')


# ---------------------------------------------------------------- D
def d_finder():
    """"12 of 6" on the TeamFinder card.

    The four figures are totalled by walking every standings table in
    the season and taking every row with this IOC in it. A federation
    that enters both an U23 and an U21 conference appears in both, so
    Germany's twelve stops were six of its own and six of another
    conference's — against a stopCount that is one conference's.

    The walk is bounded to the stops of the conference the card is
    showing, which is also what the other three figures should have
    been: the card names one team site, not a federation's season.
    """
    s = read('assets/site.js')
    old = """      var tot = { played: 0, won: 0, points: 0, stops: 0 };
      D.standings.forEach(function (s2) {
        if (s2.gender !== team.gender) return;"""
    new = """      var tot = { played: 0, won: 0, points: 0, stops: 0 };
      /* Review 10: this conference's stops, not every stop in the
         season that this federation turned up at. */
      var mine = {};
      D.events.forEach(function (e2) {
        if (e2.conference === team.conference) mine[e2.slug] = 1;
      });
      D.standings.forEach(function (s2) {
        if (s2.gender !== team.gender || !mine[s2.stop]) return;"""
    if old in s:
        write('assets/site.js', s.replace(old, new, 1))
        log.append('site.js: TeamFinder counts one conference')


if __name__ == '__main__':
    a_assets()
    b_poster()
    c_nation()
    d_finder()
    print('\n'.join(log) if log else 'nothing to do')
