#!/usr/bin/env python3
"""Eleventh round — 2026-08-27 (Daniel's eighth mark-up).

  A  assets       review11.css / mobile11.css / review11.js on every page.
  B  site.js      the gender you chose follows you off the page.
  C  site.js      el-24 Avatar takes the player's photograph.
  D  site.js      today's live stop always has a stream to play.
  E  app.js       a paused carousel fills the bar it is standing on.
  F  standings    the Full standings button goes.

Idempotent: every step is guarded.
    python3 tools/p20_review11.py && python3 tools/bump_assets.py
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


# ---------------------------------------------------------------- A
def a_assets():
    for f in PAGES:
        s = read(f)
        o = s
        if 'assets/review11.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review10\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review11.css?v=1">',
                s, count=1)
        if 'assets/mobile11.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/mobile10\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/mobile11.css?v=1">',
                s, count=1)
        if 'assets/review11.js' not in s:
            s = re.sub(
                r'(<script defer src="assets/review10\.js\?v=[^"]*"></script>)',
                r'\1\n<script defer src="assets/review11.js?v=1"></script>',
                s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review11 / mobile11 linked')


# ---------------------------------------------------------------- B
def b_gender():
    """Pick Women on Home, open a team, and you were reading the men.

    Every top-level page carries an el-02 GenderSwitch and every one of
    them started on Men, because that is the segment the specimen markup
    marks as selected. The choice was a local variable inside one page
    renderer, so following any link threw it away — and a team page,
    which builds its own switch out of the team sites a federation
    actually fields, opened on whichever of them came first.

    The choice becomes the reader's, for the visit: genderSwitch writes
    it down and every switch on the site opens on it. categorySwitch —
    the four-segment version on a team page — reads it too, and prefers
    U23 when a federation is in both, which is what Daniel asked for.

    sessionStorage and not localStorage: it is a reading position, not
    a preference, and it should not still be there in a week.
    """
    s = read('assets/site.js')
    if 'NL_SEX' in s:
        log.append('site.js: gender memory already in')
        return

    helper = """
  /* Review 11: the gender is the reader's, not the page's.
     Written by whichever switch they touch, read by every switch
     that opens after it — including the four-segment one on a team
     page. sessionStorage, because it is a reading position and not
     a preference: a new visit starts where the site starts. */
  var NL_SEX = 'nl.gender';
  function sexGet() {
    try {
      var v = window.sessionStorage.getItem(NL_SEX);
      return v === 'women' || v === 'men' ? v : '';
    } catch (e) { return ''; }
  }
  function sexSet(v) {
    try { window.sessionStorage.setItem(NL_SEX, v); } catch (e) {}
  }

"""
    anchor = "  /* el-02 GenderSwitch → 'men' | 'women'. Scoped, because a page can"
    assert anchor in s, 'genderSwitch comment moved'
    s = s.replace(anchor, helper + anchor, 1)

    old = """    if (!seg.length) return 'men';
    var value = 'men';
    seg.forEach(function (s) {
      if (s.classList.contains('el02-on')) value = /women/i.test(s.textContent) ? 'women' : 'men';
      s.addEventListener('click', function () {
        seg.forEach(function (x) { x.classList.remove('el02-on'); });
        s.classList.add('el02-on');
        value = /women/i.test(s.textContent) ? 'women' : 'men';
        onChange(value);
      });
    });
    return value;
  }"""
    new = """    if (!seg.length) return 'men';
    var value = 'men';
    seg.forEach(function (s) {
      if (s.classList.contains('el02-on')) value = /women/i.test(s.textContent) ? 'women' : 'men';
      s.addEventListener('click', function () {
        seg.forEach(function (x) { x.classList.remove('el02-on'); });
        s.classList.add('el02-on');
        value = /women/i.test(s.textContent) ? 'women' : 'men';
        sexSet(value);
        onChange(value);
      });
    });
    /* Arriving with a choice already made: move the switch to it and
       hand the page that value, so the first paint is the right one
       and no repaint is needed. */
    var want = sexGet();
    if (want && want !== value) {
      var hit = seg.filter(function (s) {
        return (/women/i.test(s.textContent) ? 'women' : 'men') === want;
      })[0];
      if (hit) {
        seg.forEach(function (x) { x.classList.remove('el02-on'); });
        hit.classList.add('el02-on');
        value = want;
      }
    }
    return value;
  }"""
    assert old in s, 'genderSwitch body moved'
    s = s.replace(old, new, 1)

    # ---- categorySwitch: the default segment ----------------------
    old = """    if (!opts.length) return null;

    var proto = $('.el02-seg', el).cloneNode(true);
    el.innerHTML = '';
    var current = opts[0];"""
    new = """    if (!opts.length) return null;

    /* Which of the four opens. The reader's gender first, and U23
       ahead of U21 inside it, because U23 is the road to the World
       Cup and the one a federation is read by. A federation that
       fields no team in the gender they chose falls back to U23 in
       the one it does field, rather than to whatever came first. */
    var want = sexGet();
    function pick(list) { return list.length ? list[0] : null; }
    var current =
      pick(opts.filter(function (o) { return o.gender === want && o.cat === 'U23'; })) ||
      pick(opts.filter(function (o) { return o.gender === want; })) ||
      pick(opts.filter(function (o) { return o.cat === 'U23'; })) ||
      opts[0];

    var proto = $('.el02-seg', el).cloneNode(true);
    el.innerHTML = '';"""
    assert old in s, 'categorySwitch head moved'
    s = s.replace(old, new, 1)
    write('assets/site.js', s)
    log.append('site.js: gender remembered across pages, U23 preferred')


def b2_categoryswitch_write():
    """The four-segment switch writes the choice down as well."""
    s = read('assets/site.js')
    if 'sexSet(o.gender)' in s:
        return
    old = """      seg.onclick = function () {
        current = o;
        $$('.el02-seg', el).forEach(function (s) { s.classList.remove('el02-on'); });"""
    new = """      seg.onclick = function () {
        current = o;
        sexSet(o.gender);
        $$('.el02-seg', el).forEach(function (s) { s.classList.remove('el02-on'); });"""
    if old not in s:
        log.append('site.js: categorySwitch click handler not found — skipped')
        return
    s = s.replace(old, new, 1)
    write('assets/site.js', s)
    log.append('site.js: categorySwitch writes the gender down too')


# ---------------------------------------------------------------- C
def c_avatars():
    """el-24 Avatar takes the photograph when there is one.

    The player pages already did it. Stats > Players and the top scorer
    on a game page did not, because when they were written the snapshot
    was thought to hold no portraits — it holds 442 of them. Both take
    the same helper, and both keep the initials for the other 269.
    """
    s = read('assets/site.js')
    if 'function avatarOf' not in s:
        helper = """
  /* Review 11: el-24 Avatar, with a photograph where the feed has
     one. The element ships with two beds — a checker plate for the
     empty state and a flat surface for a silhouette — and a portrait
     wants the flat one, or the checker shows through the corners of
     a cut-out. Without a portrait nothing is touched: the initials
     the caller has already written stay exactly as they are. */
  function avatarOf(av, p) {
    if (!av || !p || !p.portrait) return false;
    if (av.dataset.portrait === p.portrait) return true;
    av.dataset.portrait = p.portrait;
    av.classList.remove('av-check-bed');
    av.classList.add('av-sil-bed', 'av-photo-bed');
    var img = $('.av-photo', av);
    if (!img) {
      img = document.createElement('img');
      img.className = 'av-photo';
      img.alt = '';
      av.appendChild(img);
    }
    /* A CDN that will not answer leaves the initials rather than a
       broken-image mark, so the row never loses the player's name. */
    img.onerror = function () {
      img.remove();
      av.classList.remove('av-photo-bed');
      av.removeAttribute('data-portrait');
    };
    img.src = p.portrait;
    return true;
  }

"""
        anchor = "  /* The name plate on E-08 PlayerCard is a fixed height"
        assert anchor in s, 'fitName comment moved'
        s = s.replace(anchor, helper + anchor, 1)

    # ---- R-05 StatLeaderboard on stats.html -----------------------
    old = """        var init = $('.r05-pl .av-init', row);
        if (init) init.textContent = ((p.first || ' ')[0] + (p.last || ' ')[0]).toUpperCase();"""
    new = """        var init = $('.r05-pl .av-init', row);
        if (init) init.textContent = ((p.first || ' ')[0] + (p.last || ' ')[0]).toUpperCase();
        avatarOf($('.r05-pl .av', row), p);"""
    if old in s and new not in s:
        s = s.replace(old, new, 1)
        log.append('site.js: stats leaderboard avatars')

    # ---- the top scorer on a game page ----------------------------
    old = """        /* el-24 Avatar. There are no portraits in the snapshot, so the
           initials fallback is the one that applies. */
        var init = $('.gm-top-av .av-init');
        if (init) init.textContent = ((top.first || top.name || '').charAt(0) +
                                      (top.last || '').charAt(0)).toUpperCase();"""
    new = """        /* el-24 Avatar. The box score is derived, so the squad row
           carries no portrait of its own — the player record does,
           for 442 of the 711, and the id is the way back to it. */
        var init = $('.gm-top-av .av-init');
        if (init) init.textContent = ((top.first || top.name || '').charAt(0) +
                                      (top.last || '').charAt(0)).toUpperCase();
        avatarOf($('.gm-top-av'), player(top.id) || top);"""
    if old in s:
        s = s.replace(old, new, 1)
        log.append('site.js: game top-scorer avatar')

    write('assets/site.js', s)


# ---------------------------------------------------------------- D
def d_livestream():
    """Press play on the conferences page and nothing happened.

    The frame falls back to the channel's own live embed when the stop
    it is showing names no video, and the channel embed renders nothing
    off air — which on a prototype is every day. Twenty-five of the
    season's stops carry no stream at all, and today's is one of them.

    A stop that is playing today and has no stream of its own is given
    one, once, as the data is loaded: everything downstream — the
    poster, hasStream, the embed — then works the way it already does
    for the forty-nine stops that do carry one.
    """
    s = read('assets/site.js')
    if 'LIVE_FALLBACK' in s:
        log.append('site.js: live stream fallback already in')
        return

    block = """
  /* Review 11: the stream on the live frame.
     A stop that is being played today and names no video of its own
     is given the league's current broadcast, so the play button on
     the conferences page opens a stream rather than an empty channel
     embed. The poster is that broadcast's own still. */
  var LIVE_FALLBACK = 'tYyPnWmBtKM';
  var LIVE_FALLBACK_POSTER =
    'https://i.ytimg.com/vi/tYyPnWmBtKM/hq720.jpg?v=6a89f088&sqp=-oaymwEnCNAFEJQ' +
    'DSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLAQpUbJhnJOdh5Z_O72TobA7v9CzA';

  function stampLiveStream() {
    var today = isoDay(new Date());
    (D.events || []).forEach(function (e) {
      if (!stopLive(e, today) || e.video) return;
      e.video = LIVE_FALLBACK;
      e.poster = LIVE_FALLBACK_POSTER;
    });
  }
"""
    anchor = "  function el(tag, cls, html) {"
    assert anchor in s, 'el() moved'
    s = s.replace(anchor, block + "\n" + anchor, 1)

    old = """    D.playersById = {};
    D.players.forEach(function (p) { D.playersById[p.id] = p; });
"""
    new = """    D.playersById = {};
    D.players.forEach(function (p) { D.playersById[p.id] = p; });
    try { stampLiveStream(); } catch (e) { console.error('live stream', e); }
"""
    assert old in s, 'boot moved'
    s = s.replace(old, new, 1)
    write('assets/site.js', s)
    log.append('site.js: the live stop always has a stream')


# ---------------------------------------------------------------- E
def e_indicator():
    """A paused carousel had no mark on the slide you were looking at.

    el-22's bar fills over the slide's own duration and empties when
    the carousel moves on, so the bar for the slide on screen is the
    one that is filling. Pause it and the fill freezes where it stands
    — right, while the pause happens mid-slide.

    A swipe pauses the carousel FIRST and then moves it, so the slide
    it lands on starts its fill from zero and holds there: an empty
    bar over the photograph you are looking at, and no black anywhere
    in the row. A stopped carousel has no duration to measure, so the
    bar for the slide on screen is simply full.
    """
    s = read('assets/app.js')
    if 'ind-still' in s:
        log.append('app.js: paused indicator already in')
        return
    old = """  function fillBar(fill, active, playing) {
    if (!fill) return;
    fill.classList.remove('ind-filling', 'ind-hold');
    fill.style.width = '0%';
    if (!active) return;
    void fill.offsetWidth;
    fill.style.removeProperty('width');
    fill.style.setProperty('--ind-dur', SLIDE_MS + 'ms');
    fill.classList.add('ind-filling');
    if (!playing) fill.classList.add('ind-hold');
  }"""
    new = """  function fillBar(fill, active, playing) {
    if (!fill) return;
    fill.classList.remove('ind-filling', 'ind-hold', 'ind-still');
    fill.style.width = '0%';
    if (!active) return;
    /* Review 11: stopped. Nothing is being measured, so the bar for
       the slide on screen is full — it marks the position rather than
       the time left on it. This is the state a swipe lands in. */
    if (!playing) {
      fill.classList.add('ind-still');
      fill.style.width = '100%';
      return;
    }
    void fill.offsetWidth;
    fill.style.removeProperty('width');
    fill.style.setProperty('--ind-dur', SLIDE_MS + 'ms');
    fill.classList.add('ind-filling');
  }"""
    assert old in s, 'fillBar moved'
    s = s.replace(old, new, 1)
    write('assets/app.js', s)
    log.append('app.js: a paused carousel marks the slide on screen')


# ---------------------------------------------------------------- F
def f_fullstandings():
    """The button under the standings table went to the page it was on."""
    s = read('standings.html')
    pat = re.compile(
        r'<div style="display:flex"><a class="nav-a" href="standings\.html">'
        r'<div class="ctl-02-Link--default lnk"><span class="lbl">Full standings</span>'
        r'.*?</a></div>', re.S)
    n = len(pat.findall(s))
    if not n:
        log.append('standings.html: Full standings button already gone')
        return
    s = pat.sub('', s, count=n)
    write('standings.html', s)
    log.append('standings.html: Full standings button removed (%d)' % n)


def b3_finder_gender():
    """Choosing a team site in E-01 TeamFinder chooses a gender too."""
    s = read('assets/site.js')
    if 'sexSet(team.gender' in s:
        return
    old = """    /* ---- 4 · result ---- */
    function result(team, label) {
      var st = D.standings.filter(function (s) {"""
    new = """    /* ---- 4 · result ---- */
    function result(team, label) {
      /* Review 11: picking a team site here is picking a gender, and
         the team page it links to opens on whatever was picked. */
      sexSet(team.gender || 'men');
      var st = D.standings.filter(function (s) {"""
    if old not in s:
        log.append('site.js: TeamFinder result() not found — skipped')
        return
    write('assets/site.js', s.replace(old, new, 1))
    log.append('site.js: TeamFinder writes the gender down')


def g_backlink():
    """The link out of a stop was sitting BELOW the site footer.

    p7 appended it to .tpl rather than to .tpl-content, so on stop.html
    and game.html "See updated conference table" was printed under the
    legal band, on the page surface, outside every margin the page
    keeps. It was hard to see on a desktop and invisible on a phone,
    where it landed inside the strip the tab bar reserves.

    It goes where every other section-closing link goes: the end of the
    content column, above the footer.
    """
    pat = re.compile(r'<div class="cnf-back">.*?</div></div>(?=</div>\s*(?:<script|$))', re.S)
    for f in ('stop.html', 'game.html'):
        s = read(f)
        at, foot = s.find('class="cnf-back"'), s.rfind('<div class="f06"')
        if 0 < at < foot:
            continue                       # already above the footer
        m = pat.search(s)
        if not m:
            continue
        block = m.group(0)
        s = s[:m.start()] + s[m.end():]
        i = s.rfind('<div class="f06">')
        if i < 0:
            log.append(f + ': no footer — back link left where it was')
            continue
        s = s[:i] + block + s[i:]
        write(f, s)
        log.append(f + ': stop back-link moved above the footer')


for fn in (a_assets, b_gender, b2_categoryswitch_write, b3_finder_gender, c_avatars,
           d_livestream, e_indicator, f_fullstandings, g_backlink):
    fn()

print('\n'.join(log) if log else 'nothing to do')
