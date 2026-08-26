#!/usr/bin/env python3
"""Third design review — 2026-08-21 (Mota's notes + Daniel's mark-up).

Applies, across every screen:

  A  global    H1 unified at 40 on all sub pages, ctl-03 Tab label at 16
               with a black rule, a search that is not full width on
               6/12 columns, off-grid container widths snapped to the
               nearest column, and the NL key-visual strip in F-04.
  B  home      the new hero band (full bleed, key visuals on the window
               edges, type on the 1440 column) as the default, with
               HERO / NO HERO in the top bar. Overview to Live now = 40.
  C  standings ctl-04 Select on the search's row, right edge, listing
               every conference in the table A-Z.
  D  conference pages   Schedule module (live stream, games, results),
               the two-column head, the flat card grid, the legend on
               the section header's line, the count with the chips.

The type, colour and layout of all of it live in assets/review3.css.
This script only puts the markup and the behaviour in place.

Idempotent: every step is guarded, so a second run is a no-op.
    python3 tools/p12_review3.py
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def P(*a): return os.path.join(ROOT, *a)
def read(p): return open(P(p), encoding='utf-8').read()
def write(p, s): open(P(p), 'w', encoding='utf-8').write(s)

PAGES = [f for f in sorted(os.listdir(ROOT))
         if f.endswith('.html') and f not in ('qualification.html',)]

log = []


# ---------------------------------------------------------------- helpers
def close_div(s, start):
    """Index just past the </div> that closes the <div at `start`."""
    i, depth = start, 0
    pat = re.compile(r'<(/?)div\b', re.I)
    while i < len(s):
        m = pat.search(s, i)
        if not m: return -1
        if m.group(1):
            depth -= 1
            if depth == 0:
                return s.index('>', m.end()) + 1
        else:
            depth += 1
        i = m.end()
    return -1


# ---------------------------------------------------------------- 1  CSS
def snap_widths():
    """Container widths that were not on the twelve-column grid.

    The grid is 12 x 98 with 24px gutters inside 1440, so a span of n
    columns is n*98 + (n-1)*24: 342, 464, 708, 952, 1074. Values fixed
    by something outside this design are left alone — 390 is the phone
    specimen's frame, 300 / 728 / 970 are IAB ad slots.
    """
    fixes = {
        'assets/elements.css': [
            ('.search',      'max-width:660px',  'max-width:708px'),
            ('.ac',          'max-width:660px',  'max-width:708px'),
            ('.acm',         'max-width:660px',  'max-width:708px'),
            ('.empty',       'max-width:660px',  'max-width:708px'),
            ('.empty-body',  'max-width:420px',  'max-width:464px'),
            ('.card',        'width:432px',      'width:464px'),
            ('.toast',       'width:432px',      'width:464px'),
            ('.fld',         'width:318px',      'width:342px'),
        ],
        'assets/modules.css': [
            ('.s06-game',    'width:432px',      'width:464px'),
            ('.mm-feat',     'width:432px',      'width:464px'),
            ('.mm-featimg',  'width:432px',      'width:464px'),
            ('.car-slide',   'width:474px',      'width:464px'),
            ('.lb-tile',     'width:343px',      'width:342px'),
            ('.lb-img',      'max-width:1104px', 'max-width:1074px'),
            ('.c06-toc',     'width:318px',      'width:342px'),
        ],
    }
    for rel, items in fixes.items():
        css = read(rel)
        n = 0
        for sel, old, new in items:
            pat = re.compile(r'(?m)^(' + re.escape(sel) + r')\s*\{([^{}]*)\}')
            def sub(m, old=old, new=new):
                if old not in m.group(2): return m.group(0)
                return m.group(1) + ' {' + m.group(2).replace(old, new, 1) + '}'
            css2 = pat.sub(sub, css, count=1)
            if css2 != css: n += 1
            css = css2
        write(rel, css)
        log.append('%-22s %d widths snapped to the grid' % (rel.split('/')[-1], n))


# ---------------------------------------------------------------- 2  HTML
LINK = '<link href="assets/review3.css?v=1" rel="stylesheet"/>'
KV = '<div class="f04-kv"><img alt="" height="4" src="assets/kv-subheader.svg" width="1440"/></div>'

TITLES = {
    'Nations League Standings':   'Standings',
    'Nations League Conferences': 'Conferences',
    'Nations League Teams':       'Teams',
    'Nations League Calendar':    'Calendar',
    'Nations League News':        'News',
    'Nations League Stats':       'Stats',
    'About the Nations League':   'About',
}

ARROW = ('<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" '
         'xmlns="http://www.w3.org/2000/svg"><path d="M686-450H160v-60h526L438-758l42-42 320 '
         '320-320 320-42-42 248-248Z"></path></svg>')
CARET = ('<svg fill="currentColor" height="20" viewBox="0 -960 960 960" width="20" '
         'xmlns="http://www.w3.org/2000/svg"><path d="M480-344 240-584l43-43 197 197 197-197 '
         '43 43-240 240Z"></path></svg>')


def select_markup(name, label):
    return ('<div class="selwrap" data-select="%s">'
            '<div aria-expanded="false" aria-haspopup="listbox" '
            'class="ctl-04-Field--default fld sel cut cut-m cut-out" role="button" tabindex="0">'
            '<div class="cutfill"></div><div class="sel-lbl">%s</div>%s</div>'
            '<div class="sel-menu" hidden></div></div>' % (name, label, CARET))


HERO = (
 '<div class="hnl">'
 '<img alt="" class="hnl-kv hnl-kv-l" height="95" src="assets/kv-hero-left.svg" width="241"/>'
 '<img alt="" class="hnl-kv hnl-kv-r" height="96" src="assets/kv-hero-right.svg" width="337"/>'
 '<div class="hnl-in">'
 '<h1 class="hnl-lock"><span class="hnl-t">Nations League 2026</span>'
 '<span class="hnl-s">The road to the U23 World Cup</span></h1>'
 '<a class="nav-a" href="about.html"><div class="ctl-02-Link--default lnk">'
 '<span class="lbl">How it works</span>' + ARROW + '</div></a>'
 '</div></div>')

FAM = ('<div class="f02-fam">'
       '<a class="f02-famlink" data-hero="nl" href="#hero=nl">Hero</a>'
       '<a class="f02-famlink" data-hero="none" href="#hero=none">No hero</a></div>')


def patch_pages():
    for f in PAGES:
        s = read(f)
        before = s

        # 1  the stylesheet, last of the shared sheets
        if 'review3.css' not in s:
            m = re.search(r'<link href="assets/site\.css[^>]*>', s)
            if m:
                s = s[:m.end()] + '\n' + LINK + s[m.end():]
            else:
                s = s.replace('</head>', LINK + '\n</head>', 1)

        # 2  the key-visual strip, between breadcrumb and H1
        if 'f04-kv' not in s:
            m = re.search(r'<div class="[^"]*\bcrumbs\b[^"]*">', s)
            if m:
                end = close_div(s, m.start())
                if end > 0:
                    s = s[:end] + KV + s[end:]

        # 3  one H1 class per page, and the page's own name in it.
        #    On the player page E-05 carries the name in the identity
        #    block, so the H1 stays in the markup for search and screen
        #    readers but not on screen — it was an empty div before.
        h1 = 'f04-h1 sr-only' if f == 'player.html' else 'f04-h1'
        s = s.replace('class="f04-h1-m gm-head"', 'class="f04-h1 gm-head"')
        for old in ('class="f04-h1-m"', 'class="f04-h1-s"', 'class="f04-h1-l"'):
            s = s.replace(old, 'class="%s"' % h1)
        for a, b in TITLES.items():
            s = s.replace('>' + a + '<', '>' + b + '<')

        if s != before:
            write(f, s)
    log.append('%-22s %d pages: stylesheet, key visual, one H1' % ('*.html', len(PAGES)))


def patch_index():
    s = read('index.html')
    if 'class="hnl"' not in s:
        i = s.find('<div class="hl">')
        if i < 0:
            print('!! index.html: .hl not found'); return
        s = s[:i] + HERO + s[i:]
    s = re.sub(r'<div class="f02-fam">.*?</div>\s*(?=</div>)', FAM, s, count=1, flags=re.S)
    write('index.html', s)
    log.append('%-22s new hero band + HERO / NO HERO' % 'index.html')


def patch_standings():
    s = read('standings.html')
    if 'data-select="conference"' in s:
        return
    m = re.search(r'<div class="rowsplit">', s)
    if not m:
        print('!! standings.html: .rowsplit not found'); return
    end = close_div(s, m.start())
    cut = end - len('</div>')
    s = s[:cut] + select_markup('conference', 'All conferences') + s[cut:]
    write('standings.html', s)
    log.append('%-22s ctl-04 Select on the search row' % 'standings.html')


# ---------------------------------------------------------------- 3  JS
def patch_hero_switch():
    js = read('assets/hero-switch.js')
    if 'nl: 1' in js:
        return
    js = js.replace("var MODES = { none: 1, a: 1, b: 1 };",
                    "var MODES = { none: 1, a: 1, b: 1, nl: 1 };")
    js = js.replace("var current = 'none';", "var current = 'nl';")
    js = js.replace("/(?:^|[#&])hero=(a|b|none)\\b/", "/(?:^|[#&])hero=(a|b|nl|none)\\b/")
    js = js.replace("return m ? m[1] : 'none';", "return m ? m[1] : 'nl';")
    js = js.replace("if (!MODES[mode]) mode = 'none';", "if (!MODES[mode]) mode = 'nl';")
    js = js.replace("document.body.classList.toggle('hero-a', mode === 'a');",
                    "document.body.classList.toggle('hero-nl', mode === 'nl');\n"
                    "    document.body.classList.toggle('hero-a', mode === 'a');")
    write('assets/hero-switch.js', js)
    log.append('%-22s the new hero is the default mode' % 'hero-switch.js')


REVIEW_JS = r"""
  /* ============================================================
     Review 3 — 2026-08-21. Everything the third review added is
     in this one block so the diff reads as one change.
     ============================================================ */

  /* FIBA's own channel. A conference that is playing shows its
     stream in place; when nothing is on air the frame says so
     rather than holding an empty player. */
  var YT_CHANNEL = 'UC7LpyJP5fupiJu2CdzRQheg';
  var YT_STREAMS = 'https://www.youtube.com/@FIBA3x3/streams';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  var SELECT_HTML =
    '<div aria-expanded="false" aria-haspopup="listbox" ' +
    'class="ctl-04-Field--default fld sel cut cut-m cut-out" role="button" tabindex="0">' +
    '<div class="cutfill"></div><div class="sel-lbl">__LABEL__</div>' +
    '<svg fill="currentColor" height="20" viewBox="0 -960 960 960" width="20" ' +
    'xmlns="http://www.w3.org/2000/svg"><path d="M480-344 240-584l43-43 197 197 197-197 43 ' +
    '43-240 240Z"></path></svg></div><div class="sel-menu" hidden></div>';

  /* ---------- ctl-04 Select ----------------------------------
     The field is the trigger; the menu is a sibling, so the field
     keeps its cut corners. One item is always on. */
  function selectControl(wrap, items, onPick, allLabel) {
    if (!wrap || wrap._wired) return;
    wrap._wired = 1;
    var fld = wrap.querySelector('.fld');
    var menu = wrap.querySelector('.sel-menu');
    var lbl = wrap.querySelector('.sel-lbl');
    if (!fld || !menu || !lbl) return;

    function close() {
      menu.hidden = true;
      wrap.classList.remove('is-open');
      fld.setAttribute('aria-expanded', 'false');
    }
    function open() {
      menu.hidden = false;
      wrap.classList.add('is-open');
      fld.setAttribute('aria-expanded', 'true');
    }

    menu.innerHTML = '';
    [{ v: '', t: allLabel }].concat(items.map(function (t) {
      return typeof t === 'string' ? { v: t, t: t } : t;
    })).forEach(function (o, i) {
      var it = el('div', 'sel-item' + (i === 0 ? ' is-on' : ''), o.t);
      it.setAttribute('role', 'option');
      it.addEventListener('click', function () {
        $$('.sel-item', menu).forEach(function (x) { x.classList.remove('is-on'); });
        it.classList.add('is-on');
        lbl.textContent = o.t;
        close();
        onPick(o.v);
      });
      menu.appendChild(it);
    });
    lbl.textContent = allLabel;

    fld.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (menu.hidden) open(); else close();
    });
    fld.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault(); if (menu.hidden) open(); else close();
      }
      if (ev.key === 'Escape') close();
    });
    document.addEventListener('click', function (ev) {
      if (!wrap.contains(ev.target)) close();
    });
    close();
  }

  /* ---------- el-14 Chip row ---------------------------------- */
  function chipRow(labels, onPick) {
    var row = el('div', 'el-03-FilterChips--default el03 el03-s');
    labels.forEach(function (t, i) {
      var c = el('div',
        'el-14-Chip--s-default chip chip-s cut cut-s cut-out' + (i ? '' : ' chip-on'),
        '<div class="cutfill"></div><span class="lbl">' + t + '</span>');
      c.addEventListener('click', function () {
        $$('.chip', row).forEach(function (x) { x.classList.remove('chip-on'); });
        c.classList.add('chip-on');
        onPick(i ? t : '');
      });
      row.appendChild(c);
    });
    return row;
  }

  /* ---------- S-12 Schedule ----------------------------------
     Mota, third review: "when you go into a conference we need to
     show the games in the overview — the schedule, a list of the
     games, the results", and the live stream belongs at conference
     level. One module carries all four. The stream takes eight of
     twelve columns, the day's games the other four, and Schedule /
     Results are ctl-03 tabs over the same list.                  */
  function dayGames(dayISO, confId, gender) {
    return D.games.filter(function (g) {
      if (confId && g.conference !== confId) return false;
      if (gender && g.gender !== gender) return false;
      return (g.start || '').slice(0, 10) === dayISO;
    }).sort(function (a, b) { return (a.start || '') < (b.start || '') ? -1 : 1; });
  }

  function stopOn(dayISO, confId) {
    var hit = null;
    D.events.forEach(function (e) {
      if (hit || (confId && e.conference !== confId)) return;
      if (stopLive(e, dayISO)) hit = e;
    });
    return hit;
  }

  function scheduleModule(host, confId) {
    var today = isoDay(new Date());
    var wrap = el('div', 'tpl-sub sched');

    wrap.appendChild(el('div', 'el-01-SectionHeader--default el01-wrap',
      '<div class="el01"><div class="el01-left"><h2 class="t-h2">Schedule</h2></div>' +
      '<div class="el01-right">' +
      '<div class="el-02-GenderSwitch--men el02 el02-s sched-gender">' +
      '<div class="el02-seg cut cut-s el02-on cut-out"><div class="cutfill"></div>' +
      '<span class="lbl">Men</span></div>' +
      '<div class="el02-seg cut cut-s cut-out"><div class="cutfill"></div>' +
      '<span class="lbl">Women</span></div></div>' +
      '<a class="ctl-02-Link--default lnk" href="calendar.html">' +
      '<span class="lbl">Full calendar</span></a></div></div>'));

    var days = [];
    for (var i = -3; i <= 3; i++) days.push(shiftDay(today, i));
    var pick = today;
    var sex = 'men';
    var mode = 'all';

    var strip = el('div', 'el-30-CalendarStrip--live s03wrap');
    var rail = el('div', 's03');
    strip.appendChild(rail);
    wrap.appendChild(strip);

    var split = el('div', 'sched-split');
    var vid = el('div', 'sched-video');
    var side = el('div', 'sched-side');
    split.appendChild(vid);
    split.appendChild(side);
    wrap.appendChild(split);

    var tabs = el('div', 'ctl-03-Tab--default tabs',
      '<div class="tab tab-active" data-sched="all" role="tab" tabindex="0">Schedule</div>' +
      '<div class="tab" data-sched="done" role="tab" tabindex="0">Results</div>');
    var list = el('div', 'sched-list');
    side.appendChild(tabs);
    side.appendChild(list);

    $$('.tab', tabs).forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.tab', tabs).forEach(function (x) { x.classList.remove('tab-active'); });
        t.classList.add('tab-active');
        mode = t.dataset.sched;
        paintList();
      });
    });

    function paintDays() {
      rail.innerHTML = '';
      days.forEach(function (d) {
        var dt = new Date(d + 'T12:00:00');
        var has = dayGames(d, confId, sex).length;
        var box = el('div',
          's03-d cut cut-s cut-out' + (d === pick ? ' s03-on' : '') + (has ? '' : ' s03-off'),
          '<div class="cutfill"></div><div class="s03-num">' + dt.getDate() + '</div>' +
          '<div class="s03-dm"><div class="s03-dow">' +
          ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()] + '</div>' +
          '<div class="s03-mon">' +
          ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
           'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()] +
          '</div></div><div class="s03-tail">' +
          (d === today && stopOn(d, confId) ? '<div class="s03-livedot"></div>' : '') +
          '</div>');
        box.addEventListener('click', function () {
          pick = d; paintDays(); paintVideo(); paintList();
        });
        rail.appendChild(box);
      });
    }

    function paintVideo() {
      var ev = stopOn(pick, confId);
      var isLive = !!ev && pick === today;
      vid.innerHTML = '';
      var frame = el('div', 'sched-frame');
      if (isLive) {
        frame.innerHTML =
          '<iframe allow="accelerometer; autoplay; encrypted-media; picture-in-picture" ' +
          'allowfullscreen loading="lazy" ' +
          'src="https://www.youtube.com/embed/live_stream?channel=' + YT_CHANNEL + '" ' +
          'title="FIBA 3x3 Nations League — live"></iframe>';
      } else {
        frame.appendChild(el('div', 'sched-off',
          '<div class="t-h3">No game on air</div>' +
          '<div class="t-body-s">The stream opens here when a conference is playing.</div>' +
          '<a class="ctl-02-Link--default lnk" href="' + YT_STREAMS + '" ' +
          'rel="noopener" target="_blank"><span class="lbl">All streams on YouTube</span></a>'));
      }
      vid.appendChild(frame);

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
        cap.innerHTML = '<span class="t-body-s sched-capmeta">Nothing scheduled on this day</span>';
      }
      vid.appendChild(cap);
    }

    function paintList() {
      var games = dayGames(pick, confId, sex);
      if (mode === 'done') games = games.filter(function (g) { return g.home.score != null; });
      list.innerHTML = '';
      if (!games.length) {
        list.appendChild(el('div', 'sched-empty',
          mode === 'done' ? 'No results on this day yet.' : 'No games on this day.'));
        return;
      }
      games.slice(0, 40).forEach(function (g) {
        var done = g.home.score != null && g.away.score != null;
        var homeWon = done && g.home.score >= g.away.score;
        function line(t, lost) {
          return '<div class="sched-side-row' + (lost ? ' is-lost' : '') + '">' +
                 '<span class="sched-ioc">' + (t.ioc || 'TBD') + '</span>' +
                 '<span class="sched-sc">' + (t.score != null ? t.score : '–') +
                 '</span></div>';
        }
        var row = el('div', 'sched-row',
          '<span class="sched-time">' + (g.start || '').slice(11, 16) + '</span>' +
          '<div class="sched-teams">' +
          line(g.home, done && !homeWon) + line(g.away, done && homeWon) + '</div>' +
          '<div class="sched-badge">' +
          '<div class="el-05-StatusBadge--up badge badge-up cut cut-s"><span class="lbl">' +
          (g.pool || g.round || '') + '</span></div></div>');
        row.addEventListener('click', function () { location.href = 'game.html?id=' + g.id; });
        list.appendChild(row);
      });
    }

    paintDays(); paintVideo(); paintList();
    host.insertBefore(wrap, host.children[1] || null);
    genderSwitch(function (g) { sex = g; paintDays(); paintList(); }, $('.sched-gender', wrap));
  }

  /* ---------- Conferences: head split, flat grid, chips -------- */
  function reshapeConferences() {
    var content = $('.tpl-content');
    if (!content || content._r3) return;
    content._r3 = 1;

    /* Find a team and Overview stand side by side, six and six. */
    var subs = $$(':scope > .tpl-sub', content);
    if (subs.length >= 2) {
      var split = el('div', 'tpl-split cnf-head');
      var L = el('div', 'tpl-colL'), R = el('div', 'tpl-colR');
      content.insertBefore(split, subs[0]);
      L.appendChild(subs[0]); R.appendChild(subs[1]);
      split.appendChild(L); split.appendChild(R);
    }

    /* One grid of cards; the region is a chip now, not a heading. */
    var e03 = $('.e03');
    if (e03) {
      var grid = el('div', 'cnf-grid');
      $$('.e03-group', e03).forEach(function (g) {
        var region = (($('.e03-region', g) || {}).textContent || '').trim();
        $$('.e03-sh', g).forEach(function (card) {
          card.dataset.region = region;
          grid.appendChild(card);
        });
        g.remove();
      });
      e03.appendChild(grid);

      var region = '', order = '';
      function apply() {
        var cards = $$('.e03-sh', grid);
        cards.forEach(function (c) {
          c.hidden = !!region &&
            (c.dataset.region || '').toLowerCase() !== region.toLowerCase();
        });
        if (!order) return;
        function name(x) { return (($('.e03-name', x) || {}).textContent || '').trim(); }
        function live(x) { var b = $('.badge', x); return b && !b.hidden ? 0 : 1; }
        function prog(x) { return -($$('.dot-done', x).length); }
        cards.sort(function (a, b) {
          if (order === 'live') return live(a) - live(b) || name(a).localeCompare(name(b));
          if (order === 'prog') return prog(a) - prog(b) || name(a).localeCompare(name(b));
          return name(a).localeCompare(name(b));
        }).forEach(function (c) { grid.appendChild(c); });
      }

      var bar = el('div', 'cnf-bar');
      bar.appendChild(chipRow(['All', 'Europe', 'Americas', 'Africa', 'Oceania', 'AsiaPacific'],
        function (v) { region = v; apply(); }));
      var sel = el('div', 'selwrap');
      sel.innerHTML = SELECT_HTML.replace('__LABEL__', 'Sort by');
      bar.appendChild(sel);
      e03.parentNode.insertBefore(bar, e03);

      selectControl(sel, [{ v: 'az', t: 'Name A–Z' },
                          { v: 'live', t: 'Live first' },
                          { v: 'prog', t: 'Stops played' }],
                    function (v) { order = v; apply(); }, 'Sort by');
    }

    scheduleModule(content, null);
  }

  /* ---------- the pages this review touches ------------------- */
  (function () {
    var prevConfs = PAGES['conferences.html'];
    PAGES['conferences.html'] = function () {
      if (prevConfs) prevConfs();
      try { reshapeConferences(); } catch (e) { console.error('conferences reshape', e); }
    };

    /* Conference detail: the legend sits on the section header's
       line rather than on a row of its own under it. */
    var prevConf = PAGES['conference.html'];
    PAGES['conference.html'] = function () {
      if (prevConf) prevConf();
      try {
        var lg = $('.legend');
        if (lg) {
          var head = $$('.el01').filter(function (h) {
            return /standings/i.test(h.textContent || '');
          })[0];
          if (head) {
            var right = $('.el01-right', head);
            if (!right) { right = el('div', 'el01-right'); head.appendChild(right); }
            right.appendChild(lg);
          }
        }
      } catch (e) { console.error('conference legend', e); }
    };

    /* Teams: the count belongs with the chips that change it. */
    var prevTeams = PAGES['teams.html'];
    PAGES['teams.html'] = function () {
      if (prevTeams) prevTeams();
      try {
        var chips = $('.tpl-sub > .el03'), count = $('.e09-count');
        if (chips && count && !chips.parentNode.classList.contains('teams-bar')) {
          var bar = el('div', 'teams-bar');
          chips.parentNode.insertBefore(bar, chips);
          bar.appendChild(chips);
          bar.appendChild(count);
        }
      } catch (e) { console.error('teams bar', e); }
    };
  })();

"""


def patch_site_js():
    js = read('assets/site.js')
    if 'Review 3 — 2026-08-21' in js or 'Review 3 — 2026-08-21' in js:
        log.append('%-22s already carries the review block' % 'site.js')
        return
    anchor = "  /* ---------- boot ------------------------------------------ */"
    if anchor not in js:
        print('!! site.js: boot anchor not found'); sys.exit(1)
    js = js.replace(anchor, REVIEW_JS + anchor, 1)

    # the renderers address the H1 by class; teach them the unified one
    for old in ["$$('.f04-h1-m, .f04-h1-s, .t-h1, .e02-name, .f04-title')",
                "$$('.f04-h1-m, .f04-h1-s, .t-h1, .f04-title')",
                "$$('.e04-name, .t-h1, .f04-h1-m, .f04-h1-s')",
                "$$('.f04-h1-m, .f04-h1-s, .f04-title')"]:
        js = js.replace(old, old.replace("$$('", "$$('.f04-h1, "))

    # standings: the conference filter the new Select drives
    js = js.replace(
        "    var tbl = $('.tbl');\n    var gender = 'men', query = '';",
        "    var tbl = $('.tbl');\n    var gender = 'men', query = '', confPick = '';", 1)
    js = js.replace(
        "      var list = pool.filter(function (t) {\n"
        "        return !query || (t.team + ' ' + t.ioc).toLowerCase().indexOf(query) > -1;\n"
        "      });",
        "      var list = pool.filter(function (t) {\n"
        "        if (confPick && t.confname !== confPick) return false;\n"
        "        return !query || (t.team + ' ' + t.ioc).toLowerCase().indexOf(query) > -1;\n"
        "      });", 1)
    js = js.replace(
        "    sortable(tbl, COLS, state, draw);",
        "    sortable(tbl, COLS, state, draw);\n\n"
        "    /* ctl-04 Select, right edge of the search row: every\n"
        "       conference the table can show, in alphabetical order. */\n"
        "    (function () {\n"
        "      var seen = {};\n"
        "      federationTable('men').concat(federationTable('women')).forEach(function (t) {\n"
        "        if (t.confname) seen[t.confname] = 1;\n"
        "      });\n"
        "      var names = Object.keys(seen).sort(function (a, b) { return a.localeCompare(b); });\n"
        "      selectControl($('.selwrap[data-select=\"conference\"]'), names,\n"
        "                    function (v) { confPick = v; draw(); }, 'All conferences');\n"
        "    })();", 1)
    write('assets/site.js', js)
    log.append('%-22s review block, H1 selectors, conference filter' % 'site.js')


def patch_system():
    """The guideline site loads the same sheets as the prototype, so it
    has to load this one too — otherwise ctl-03 Tab and the H1 read one
    way in the documentation and another on the screens."""
    import glob
    n = 0
    for path in ['system/index.html'] + sorted(glob.glob(os.path.join(ROOT, 'system/_check/*.html'))):
        rel = path if path.startswith('system') else os.path.relpath(path, ROOT)
        s = read(rel)
        if 'review3.css' in s:
            continue
        m = list(re.finditer(r'<link[^>]*assets/(modules|behaviour)\.css[^>]*>', s))
        if not m:
            continue
        up = '../../' if '_check' in rel else '../'
        tag = '<link rel="stylesheet" href="%sassets/review3.css?v=1">' % up
        i = m[-1].end()
        write(rel, s[:i] + '\n' + tag + s[i:])
        n += 1
    log.append('%-22s %d guideline pages link the sheet' % ('system/', n))


# ---------------------------------------------------------------- run
if __name__ == '__main__':
    snap_widths()
    patch_pages()
    patch_system()
    patch_index()
    patch_standings()
    patch_hero_switch()
    patch_site_js()
    print('\n'.join('  ' + l for l in log))
