#!/usr/bin/env python3
"""Fourth round — 2026-08-26 (Daniel's mark-up on the prototype).

  A  home        the hero headline becomes the supplied wordmark, the
                 strap-line is sized to it and set Light, and the two
                 key visuals become the full brand elements.
                 "How it works" keeps its colour on hover.
                 Live now closes with "All conferences" on the left.
  B  schedule    the caption moves above the frame; the frame shows the
                 stream's own still with a play button instead of a
                 black embed; the seven-day strip becomes a period
                 filter with the day stated in the header; Schedule and
                 Results become two expandable blocks (Mota D3); the
                 "Full calendar" link goes (nobody asked for it).
  C  conferences the Overview container takes the plain grey rule and
                 the card grid opens on Live first.
  D  standings   no rule between the search row and the toggle.
  E  teams       the federation cells sit on the twelve-column grid.

The look of all of it is in assets/review4.css. This script only moves
markup, data and behaviour.

Idempotent: every step is guarded, so a second run is a no-op.
    python3 tools/p13_review4.py && python3 tools/bump_assets.py
"""
import glob
import json
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.dirname(ROOT)          # ~/Documents/FIBA-2026


def P(*a):
    return os.path.join(ROOT, *a)


def read(p):
    return open(P(p), encoding='utf-8').read()


def write(p, s):
    open(P(p), 'w', encoding='utf-8').write(s)


PAGES = [f for f in sorted(os.listdir(ROOT))
         if f.endswith('.html') and f not in ('qualification.html',)]

log = []


# ---------------------------------------------------------------- A0 assets
ASSETS = [
    ('NationsLeague2026-Logo-White.svg', 'assets/logo-nl-hero.svg'),
    ('NL2026-Keyvisuals-Elements/Brand-element-1.svg', 'assets/kv-brand-1.svg'),
    ('NL2026-Keyvisuals-Elements/Brand-element-2.svg', 'assets/kv-brand-2.svg'),
]


def copy_assets():
    n = 0
    for src, dst in ASSETS:
        s = os.path.join(SRC, src)
        if not os.path.exists(s):
            log.append('%-22s MISSING %s' % ('assets', src))
            continue
        d = P(dst)
        if os.path.exists(d) and open(d, 'rb').read() == open(s, 'rb').read():
            continue
        shutil.copyfile(s, d)
        n += 1
    log.append('%-22s %d file(s) copied in' % ('assets/', n))


def svg_box(path):
    """width, height of an SVG so the <img> can be written with both."""
    s = open(P(path), encoding='utf-8').read(400)
    w = re.search(r'width="(\d+(?:\.\d+)?)"', s)
    h = re.search(r'height="(\d+(?:\.\d+)?)"', s)
    return (w.group(1) if w else ''), (h.group(1) if h else '')


# ---------------------------------------------------------------- A1 css link
def link_css():
    n = 0
    for f in PAGES:
        s = read(f)
        if 'review4.css' in s:
            continue
        m = re.search(r'<link[^>]*assets/review3\.css[^>]*>', s)
        if not m:
            continue
        write(f, s[:m.end()] +
              '\n<link rel="stylesheet" href="assets/review4.css?v=1">' + s[m.end():])
        n += 1
    for path in ['system/index.html'] + \
                sorted(glob.glob(os.path.join(ROOT, 'system/_check/*.html'))):
        rel = path if path.startswith('system') else os.path.relpath(path, ROOT)
        if not os.path.exists(P(rel)):
            continue
        s = read(rel)
        if 'review4.css' in s:
            continue
        m = re.search(r'<link[^>]*assets/review3\.css[^>]*>', s)
        if not m:
            continue
        up = '../../' if '_check' in rel else '../'
        write(rel, s[:m.end()] +
              '\n<link rel="stylesheet" href="%sassets/review4.css?v=1">' % up + s[m.end():])
        n += 1
    log.append('%-22s %d page(s) link the sheet' % ('review4.css', n))


# ---------------------------------------------------------------- A2 hero
def patch_hero():
    s = read('index.html')
    if 'hnl-logo' in s:
        log.append('%-22s already in place' % 'hero')
        return
    lw, lh = svg_box('assets/logo-nl-hero.svg')

    # The headline is artwork; the sr-only text keeps the H1 readable.
    s = s.replace(
        '<span class="hnl-t">Nations League 2026</span>',
        '<img alt="Nations League 2026" class="hnl-logo" src="assets/logo-nl-hero.svg" '
        'width="%s" height="%s"/>' % (lw, lh), 1)

    # The two corners are the full brand elements now — same artwork as
    # the cropped files, with the paint drips restored. They are drawn at
    # the footprint the approved hero already had, so the band does not
    # move: 95 and 96 high, widths to match each file's own ratio.
    def fit(path, h):
        w0, h0 = svg_box(path)
        return str(round(float(w0) * h / float(h0))), str(h)

    w1, h1 = fit('assets/kv-brand-1.svg', 95)
    w2, h2 = fit('assets/kv-brand-2.svg', 96)
    s = s.replace(
        '<img alt="" class="hnl-kv hnl-kv-l" height="95" src="assets/kv-hero-left.svg" width="241"/>',
        '<img alt="" class="hnl-kv hnl-kv-l" height="%s" src="assets/kv-brand-1.svg" width="%s"/>'
        % (h1, w1), 1)
    s = s.replace(
        '<img alt="" class="hnl-kv hnl-kv-r" height="96" src="assets/kv-hero-right.svg" width="337"/>',
        '<img alt="" class="hnl-kv hnl-kv-r" height="%s" src="assets/kv-brand-2.svg" width="%s"/>'
        % (h2, w2), 1)
    write('index.html', s)
    log.append('%-22s wordmark + brand elements 1 / 2' % 'hero')


# ---------------------------------------------------------------- A3 fonts
def patch_fonts():
    """Barlow Condensed was requested at 600/700/800 only.

    The hero strap-line is Light, and a weight the sheet never loaded is
    not lighter — the browser serves the nearest one it has, which is
    600. Ask for 300 and 400 as well.
    """
    old = 'family=Barlow+Condensed:wght@600;700;800'
    new = 'family=Barlow+Condensed:wght@300;400;600;700;800'
    n = 0
    for path in [P(f) for f in PAGES] + \
                [P('system/index.html')] + \
                sorted(glob.glob(os.path.join(ROOT, 'system/_check/*.html'))):
        if not os.path.exists(path):
            continue
        s = open(path, encoding='utf-8').read()
        if old not in s:
            continue
        open(path, 'w', encoding='utf-8').write(s.replace(old, new))
        n += 1
    log.append('%-22s %d page(s) load Condensed 300 / 400' % ('fonts', n))


# ---------------------------------------------------------------- B0 poster
POSTER = ('https://i.ytimg.com/vi/bN9Z4Cf7YMQ/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qp'
          'AxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLAk0GbpdKZ6KXSyxK9zg-b88On6kA')


def patch_events():
    """A stop can name the still its stream should show.

    In production this field is what a scheduled job fills from the
    YouTube Data API; in the prototype it is typed in, so the page never
    depends on a live call to render.
    """
    p = P('assets/data/events.json')
    d = json.load(open(p, encoding='utf-8'))
    n = 0
    for e in d:
        if e.get('slug') == 'asia-west-pacific-stop-6' and not e.get('poster'):
            e['poster'] = POSTER
            n += 1
    if n:
        json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    log.append('%-22s %d stop(s) carry a poster' % ('events.json', n))


# ---------------------------------------------------------------- B1 schedule
NEW_SCHED = r'''  function scheduleModule(host, confId) {
    var today = isoDay(new Date());
    var wrap = el('div', 'tpl-sub sched');

    /* The head states the day rather than offering seven boxes of
       them — third review, F1: the row of days becomes a filter. */
    wrap.appendChild(el('div', 'el-01-SectionHeader--default el01-wrap',
      '<div class="el01"><div class="el01-left">' +
      '<h2 class="t-h2">Schedule</h2>' +
      '<span class="sched-today"><span class="sched-livedot"></span>' +
      '<span class="sched-todaytxt"></span></span></div>' +
      '<div class="el01-right">' +
      '<div class="el-02-GenderSwitch--men el02 el02-s sched-gender">' +
      '<div class="el02-seg cut cut-s el02-on cut-out"><div class="cutfill"></div>' +
      '<span class="lbl">Men</span></div>' +
      '<div class="el02-seg cut cut-s cut-out"><div class="cutfill"></div>' +
      '<span class="lbl">Women</span></div></div>' +
      '<div class="selwrap sched-period"></div></div></div>'));

    var sex = 'men';
    var period = 'today';

    /* --- the day, stated ------------------------------------- */
    var todayBox = $('.sched-today', wrap);
    var todayTxt = $('.sched-todaytxt', wrap);
    (function () {
      var dt = new Date(today + 'T12:00:00');
      todayTxt.textContent = 'Today · ' +
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()] + ' ' +
        dt.getDate() + ' ' +
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
         'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()];
    })();

    /* --- the frame, with its caption above it ----------------- */
    var split = el('div', 'sched-split');
    var vid = el('div', 'sched-video');
    var side = el('div', 'sched-side');
    split.appendChild(vid);
    split.appendChild(side);
    wrap.appendChild(split);

    /* --- Schedule and Results expand; they are not tabs ------- */
    function accBlock(title, open) {
      var b = el('div', 'sched-acc' + (open ? ' is-open' : ''),
        '<div class="sched-acc-h" role="button" tabindex="0" aria-expanded="' +
        (open ? 'true' : 'false') + '">' +
        '<span class="sched-acc-t">' + title + '</span>' +
        '<span class="sched-acc-n"></span>' +
        '<svg class="sched-acc-i" fill="currentColor" height="20" viewBox="0 -960 960 960" ' +
        'width="20" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M480-344 240-584l43-43 197 197 197-197 43 43-240 240Z"></path></svg></div>' +
        '<div class="sched-acc-b"><div class="sched-list"></div></div>');
      var h = $('.sched-acc-h', b);
      function toggle() {
        var on = b.classList.toggle('is-open');
        h.setAttribute('aria-expanded', on ? 'true' : 'false');
      }
      h.addEventListener('click', toggle);
      h.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); }
      });
      return b;
    }
    var accUp = accBlock('Schedule', true);
    var accDone = accBlock('Results', false);
    side.appendChild(accUp);
    side.appendChild(accDone);

    /* --- which games the period covers ------------------------ */
    function months() {
      var seen = {};
      D.games.forEach(function (g) {
        if (confId && g.conference !== confId) return;
        var m = (g.start || '').slice(0, 7);
        if (m) seen[m] = 1;
      });
      return Object.keys(seen).sort();
    }
    function monthLabel(m) {
      var p = m.split('-');
      return ['January', 'February', 'March', 'April', 'May', 'June', 'July',
              'August', 'September', 'October', 'November', 'December'][+p[1] - 1] +
             ' ' + p[0];
    }
    function periodGames() {
      return D.games.filter(function (g) {
        if (confId && g.conference !== confId) return false;
        if (sex && g.gender !== sex) return false;
        var d = (g.start || '').slice(0, 10);
        if (period === 'today') return d === today;
        if (period === 'all') return true;
        if (period === 'eos') return d >= today;
        return d.slice(0, 7) === period;
      }).sort(function (a, b) { return (a.start || '') < (b.start || '') ? -1 : 1; });
    }

    /* --- painting --------------------------------------------- */
    function paintVideo() {
      var ev = stopOn(today, confId);
      var isLive = !!ev;
      vid.innerHTML = '';

      var cap = el('div', 'sched-cap');
      if (ev) {
        var c = conf(ev.conference);
        cap.innerHTML =
          (isLive ? '<div class="el-05-StatusBadge--live badge badge-live cut cut-s">' +
                    '<span class="badge-dot"></span><span class="lbl">Live</span></div>' : '') +
          '<span class="sched-capname">' + (c ? confName(c) : ev.conference) + '</span>' +
          '<span class="t-body-s sched-capmeta">' + (ev.city || '') +
          ' · Stop ' + (ev.number || 1) + '</span>';
        cap.style.cursor = 'pointer';
        cap.addEventListener('click', function () { location.href = 'stop.html?id=' + ev.slug; });
      } else {
        cap.innerHTML = '<span class="t-body-s sched-capmeta">No conference is playing today</span>';
      }
      vid.appendChild(cap);

      var frame = el('div', 'sched-frame');
      var poster = (ev && (ev.poster || ev.cover)) || NL_POSTER;
      frame.innerHTML = '<img alt="" class="sched-poster" src="' + poster + '"/>' +
                        '<div class="sched-shade"></div>';
      if (isLive) {
        var play = el('button', 'sched-play',
          '<svg fill="currentColor" viewBox="0 -960 960 960" ' +
          'xmlns="http://www.w3.org/2000/svg"><path d="M320-203v-560l440 280-440 280Z">' +
          '</path></svg>');
        play.type = 'button';
        play.setAttribute('aria-label', 'Play the live stream');
        play.addEventListener('click', function () {
          frame.innerHTML =
            '<iframe allow="accelerometer; autoplay; encrypted-media; picture-in-picture" ' +
            'allowfullscreen src="https://www.youtube.com/embed/live_stream?channel=' +
            YT_CHANNEL + '&autoplay=1" title="FIBA 3x3 Nations League — live"></iframe>';
        });
        frame.appendChild(play);
      } else {
        frame.appendChild(el('div', 'sched-off',
          '<div class="t-h3">No game on air</div>' +
          '<div class="t-body-s">The stream opens here when a conference is playing.</div>' +
          '<a class="ctl-02-Link--default lnk" href="' + YT_STREAMS + '" ' +
          'rel="noopener" target="_blank"><span class="lbl">All streams on YouTube</span></a>'));
      }
      vid.appendChild(frame);

      todayBox.classList.toggle('is-live', isLive);
    }

    function row(g) {
      var done = g.home.score != null && g.away.score != null;
      var homeWon = done && g.home.score >= g.away.score;
      function line(t, lost) {
        return '<div class="sched-side-row' + (lost ? ' is-lost' : '') + '">' +
               '<span class="sched-ioc">' + (t.ioc || 'TBD') + '</span>' +
               '<span class="sched-sc">' + (t.score != null ? t.score : '–') +
               '</span></div>';
      }
      var when = period === 'today'
        ? (g.start || '').slice(11, 16)
        : (g.start || '').slice(8, 10) + '/' + (g.start || '').slice(5, 7);
      var n = el('div', 'sched-row',
        '<span class="sched-time">' + when + '</span>' +
        '<div class="sched-teams">' +
        line(g.home, done && !homeWon) + line(g.away, done && homeWon) + '</div>' +
        '<div class="sched-badge">' +
        '<div class="el-05-StatusBadge--up badge badge-up cut cut-s"><span class="lbl">' +
        (g.pool || g.round || '') + '</span></div></div>');
      n.addEventListener('click', function () { location.href = 'game.html?id=' + g.id; });
      return n;
    }

    function fill(block, games, empty) {
      $('.sched-acc-n', block).textContent = games.length ? games.length : '';
      var list = $('.sched-list', block);
      list.innerHTML = '';
      if (!games.length) {
        list.appendChild(el('div', 'sched-empty', empty));
        return;
      }
      games.slice(0, 60).forEach(function (g) { list.appendChild(row(g)); });
    }

    function paintList() {
      var games = periodGames();
      fill(accUp, games.filter(function (g) { return g.home.score == null; }),
           'Nothing left to play in this period.');
      fill(accDone, games.filter(function (g) { return g.home.score != null; }),
           'No results in this period yet.');
    }

    /* --- the period filter ------------------------------------ */
    var sel = $('.sched-period', wrap);
    sel.innerHTML = SELECT_HTML.replace('__LABEL__', 'Today');
    var items = [{ v: 'eos', t: 'Rest of season' }]
      .concat(months().map(function (m) { return { v: m, t: monthLabel(m) }; }))
      .concat([{ v: 'all', t: 'Full season' }]);
    selectControl(sel, items, function (v) {
      period = v || 'today';
      paintList();
    }, 'Today');

    paintVideo();
    paintList();
    host.insertBefore(wrap, host.children[1] || null);
    genderSwitch(function (g) { sex = g; paintList(); }, $('.sched-gender', wrap));
  }

'''


def patch_schedule():
    s = read('assets/site.js')
    if 'sched-poster' in s:
        log.append('%-22s already rebuilt' % 'scheduleModule')
    else:
        a = s.index('  function scheduleModule(host, confId) {')
        b = s.index('  /* ---------- Conferences: head split, flat grid, chips -------- */')
        s = s[:a] + NEW_SCHED + s[b:]

    # The still the frame falls back to when a stop names none.
    if 'var NL_POSTER' not in s:
        s = s.replace(
            "  var YT_STREAMS = 'https://www.youtube.com/@FIBA3x3/streams';",
            "  var YT_STREAMS = 'https://www.youtube.com/@FIBA3x3/streams';\n"
            "  /* The still behind the play button when a stop names none of its\n"
            "     own. In production a job fills event.poster from the YouTube\n"
            "     Data API; the page itself never calls out to render. */\n"
            "  var NL_POSTER = '" + POSTER + "';", 1)

    # Conferences: the grid opens on Live first.
    s = s.replace("      var region = '', order = '';",
                  "      var region = '', order = 'live';", 1)
    s = s.replace("      sel.innerHTML = SELECT_HTML.replace('__LABEL__', 'Sort by');",
                  "      sel.innerHTML = SELECT_HTML.replace('__LABEL__', 'Live first');", 1)
    s = s.replace(
        "      selectControl(sel, [{ v: 'az', t: 'Name A–Z' },\n"
        "                          { v: 'live', t: 'Live first' },\n"
        "                          { v: 'prog', t: 'Stops played' }],\n"
        "                    function (v) { order = v; apply(); }, 'Sort by');",
        "      selectControl(sel, [{ v: 'az', t: 'Name A–Z' },\n"
        "                          { v: 'prog', t: 'Stops played' }],\n"
        "                    function (v) { order = v || 'live'; apply(); }, 'Live first');\n"
        "      apply();   /* live first on arrival, not only after a pick */", 1)

    # Home: "All conferences" closes the Live now block from the left.
    if 'Review 4 — 2026-08-26' not in s:
        s = s.replace(
            '  /* ---------- boot ------------------------------------------ */',
            REVIEW4_JS + '  /* ---------- boot ------------------------------------------ */', 1)

    write('assets/site.js', s)
    log.append('%-22s poster frame, period filter, accordions, live-first' % 'site.js')


REVIEW4_JS = r'''  /* ==========================================================
     Review 4 — 2026-08-26.
     ========================================================== */
  (function () {
    /* Home: the section header carried "All conferences" at its right.
       The review asked for it under the block, on the left, where the
       eye leaves the last row of the table. */
    function moveSectionLink(title) {
      var head = $$('.el01').filter(function (h) {
        var t = $('.t-h2', h);
        return t && t.textContent.trim().toLowerCase() === title;
      })[0];
      if (!head) return;
      var a = $('.nav-a', head);
      var sub = head.closest ? head.closest('.tpl-sub') : null;
      if (!a || !sub || sub._r4foot) return;
      sub._r4foot = 1;
      var foot = document.createElement('div');
      foot.className = 'sec-foot';
      foot.appendChild(a);
      sub.appendChild(foot);
    }

    var prev = PAGES['index.html'];
    PAGES['index.html'] = function () {
      if (prev) prev();
      try { moveSectionLink('live now'); } catch (e) { console.error('live now link', e); }
    };
  })();

'''


# ---------------------------------------------------------------- C conferences
def patch_conferences():
    s = read('conferences.html')
    if 's09-plain' in s:
        log.append('%-22s already plain' % 'conferences')
        return
    s = s.replace('class="s09 brandstroke cut cut-m cut-out brandstroke-spin"',
                  'class="s09 s09-plain cut cut-m cut-out"', 1)
    write('conferences.html', s)
    log.append('%-22s Overview takes the grey rule' % 'conferences')


# ---------------------------------------------------------------- run
if __name__ == '__main__':
    copy_assets()
    link_css()
    patch_hero()
    patch_fonts()
    patch_events()
    patch_schedule()
    patch_conferences()
    print('\n'.join('  ' + l for l in log))
