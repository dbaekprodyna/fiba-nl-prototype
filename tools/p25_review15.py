#!/usr/bin/env python3
"""Fifteenth round — 2026-08-28 (Alex's "NL more comments", group A).

  A  assets    review15.css / mobile15.css linked on every page.
  B  markup    the ten changes group A asks for.
  C  site.js   the behaviour behind them.
  D  system    the design system carries the same specimens.

The ten:

  * win ratio is a percentage everywhere, not 0.83;
  * S-01's caption drops "Stop 5 of 6" — the dots beside it already
    say that — and the table inside gains a caption naming itself;
  * the live conference shows six federations, not four;
  * S-09 Overview gains a Teams line: team sites and nations;
  * Standings gains its missing rank column;
  * Standings gains a Zone filter (Europe / Americas / AsiaPacific /
    Africa / Oceania);
  * Find a team labels U21 as U21 and shows Q / S / R on every site;
  * Stats > Teams gains PPG and a status marker, and sorts;
  * Stats > Players gains total points, real games and PPG, and sorts;
  * Conference highlights comes off.

Idempotent:
    python3 tools/p25_review15.py && python3 tools/bump_assets.py
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


# ---------------------------------------------------------------
# a tag matcher. The pages are one very long line, so nothing here
# may be done with line-oriented tools: given the index of a "<div"
# this walks forward counting opens and closes and returns the
# index just past the matching "</div>".
# ---------------------------------------------------------------
TAG = re.compile(r'<(/?)div\b', re.I)


def end_of(s, i):
    depth = 0
    for m in TAG.finditer(s, i):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return s.index('>', m.end()) + 1
    raise ValueError('unclosed div at %d' % i)


def open_tag_end(s, i):
    return s.index('>', i) + 1


SORT_SVG = ('<svg fill="currentColor" height="16" viewBox="0 -960 960 960" '
            'width="16" xmlns="http://www.w3.org/2000/svg"><path d="M480-120 '
            '300-300l44-44 136 136 136-136 44 44-180 180ZM344-612l-44-44 '
            '180-180 180 180-44 44-136-136-136 136Z"></path></svg>')


def th(cls, label, sortable=True):
    c = cls + (' cell-sortable' if sortable else '')
    attrs = ' role="button" tabindex="0"' if sortable else ''
    return ('<div class="' + c + '"' + attrs + '>'
            '<span class="t-caption" style="color:inherit">' + label + '</span>' +
            (SORT_SVG if sortable else '') + '</div>')


def td(cls, inner):
    return '<div class="' + cls + '">' + inner + '</div>'


DASH_M = '<span class="t-data-m">—</span>'
DASH_S = '<span class="t-body-s">—</span>'


# ---------------------------------------------------------------
def a_assets():
    for f in PAGES:
        s = read(f)
        o = s
        if 'assets/review15.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review14\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review15.css?v=1">',
                s, count=1)
        if 'assets/mobile15.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/mobile14\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/mobile15.css?v=1">',
                s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review15 / mobile15 linked')


# ---------------------------------------------------------------
S09_TEAMS = (
    '<div class="s09-line s09-line-teams">'
    '<span class="s09-lab">Teams</span>'
    '<div class="s09-brk">'
    '<div class="s09-k"><span class="s09-kv s09-kv-sites">0</span>'
    '<span class="s09-kl">team sites</span></div>'
    '<div class="s09-k"><span class="s09-kv s09-kv-nations">0</span>'
    '<span class="s09-kl">nations</span></div>'
    '</div></div>')


def b_overview_teams():
    """S-09 gains a third line. Alex asked for the number of teams and
    the number of countries in the overview on both the landing page
    and Conferences; the figures are the two the Find a team header
    already prints, so the block states them in its own grammar
    (label, then value + unit) rather than borrowing a caption."""
    targets = ['index.html', 'conferences.html',
               'system/pages/modules-1.html',
               'system/_check/03a-modules-frame.html',
               'system/_check/04-templates.html']
    # a specimen states figures; only the prototype's own copy is
    # painted from the data, so the design system carries the real
    # ones written out.
    def line_for(f):
        if not f.startswith('system/'):
            return S09_TEAMS
        return (S09_TEAMS.replace('s09-kv-sites">0', 's09-kv-sites">202')
                         .replace('s09-kv-nations">0', 's09-kv-nations">68'))
    for f in targets:
        if not os.path.exists(P(f)):
            continue
        s = read(f)
        if 's09-line-teams' in s:
            continue
        o = s
        out, i, n = [], 0, 0
        while True:
            j = s.find('<div class="s09-lines">', i)
            if j < 0:
                break
            k = end_of(s, j)
            out.append(s[i:k - len('</div>')])
            out.append(line_for(f))
            out.append('</div>')
            i = k
            n += 1
        out.append(s[i:])
        s = ''.join(out)
        if s != o:
            write(f, s)
            log.append(f + ': S-09 Teams line x%d' % n)


# ---------------------------------------------------------------
ACC_CAP = '<div class="t-caption acc-cap"></div>'


def b_acc_caption():
    """Alex, on the live conference: "Not clear that this is. Looks like
    the conference standings, that is ok." It is, and it now says so —
    a caption over the table naming it and the stop it stands after.
    That caption is also where "Stop 5 of 6" goes when it comes off the
    head, where the el-06 dots beside it were already saying it."""
    for f in ['index.html', 'calendar.html',
              'system/pages/modules-1.html', 'system/pages/modules-2.html',
              'system/_check/03a-modules-frame.html',
              'system/_check/03b-modules-ranking.html',
              'system/_check/03c-modules-content.html',
              'system/_check/04-templates.html']:
        if not os.path.exists(P(f)):
            continue
        s = read(f)
        if 'acc-cap' in s:
            continue
        o, out, i, n = s, [], 0, 0
        ds = f.startswith('system/')
        while True:
            j = s.find('<div class="acc-body', i)
            if j < 0:
                break
            e = open_tag_end(s, j)
            out.append(s[i:e])
            # A design system specimen is static, so it carries the
            # sentence the page paints. Read the stop off the el-06
            # caption in this accordion's own head.
            cap = ''
            if ds:
                m = None
                for m in re.finditer(r'<span class="t-caption">(Stop \d+ of \d+)</span>',
                                     s[:j]):
                    pass
                cap = ('Conference standings \u00b7 after ' +
                       m.group(1)[0].lower() + m.group(1)[1:]) if m else ''
            out.append(ACC_CAP.replace('></div>', '>' + cap + '</div>'))
            i = e
            n += 1
        out.append(s[i:])
        # The head said the place and then repeated the stop the dots
        # beside it were already printing.
        s = re.sub(r'(<span class="t-body-s">)([^<]*?) \u00b7 Stop \d+ of \d+',
                   r'\1\2', ''.join(out))
        if s != o:
            write(f, s)
            log.append(f + ': S-01 table caption x%d' % n)


# ---------------------------------------------------------------
def b_standings_rank():
    """The global table opened on Federation: it had no rank column at
    all, while the conference table beside it does. The painter has
    always written `.cell-position`, so only the column was missing."""
    s = read('standings.html')
    if 'cell-position' in s:
        return
    o = s
    s = s.replace(
        '<div class="el-08-TableHeaderRow cut cut-s thead">'
        '<div class="cell-federation cell c-fed cell-sortable"',
        '<div class="el-08-TableHeaderRow cut cut-s thead">' +
        th('cell-position cell c-pos', 'Pos', False).replace(
            'cell-position cell c-pos"',
            'cell-position cell c-pos cell-sortable" role="button" tabindex="0"') +
        '<div class="cell-federation cell c-fed cell-sortable"')
    s = s.replace(
        '<div class="el-04-TeamRow trow"><div class="cell-federation cell c-fed">',
        '<div class="el-04-TeamRow trow">' +
        td('cell-position cell c-pos', DASH_M) +
        '<div class="cell-federation cell c-fed">')
    if s != o:
        write('standings.html', s)
        log.append('standings.html: rank column')


ZONE_SELECT = (
    '<div class="selwrap selwrap-zone" data-select="zone">'
    '<div aria-expanded="false" aria-haspopup="listbox" '
    'class="ctl-04-Field--default fld sel cut cut-m cut-out" role="button" tabindex="0">'
    '<div class="cutfill"></div><div class="sel-lbl">All zones</div>'
    '<svg fill="currentColor" height="20" viewBox="0 -960 960 960" width="20" '
    'xmlns="http://www.w3.org/2000/svg"><path d="M480-344 240-584l43-43 197 197 '
    '197-197 43 43-240 240Z"></path></svg></div>'
    '<div class="sel-menu" hidden></div></div>')


def b_standings_zone():
    """Alex: "The search per conference is good, we may need one by
    Zone." The five zones already exist in the code — regionOf() built
    them for the landing page filter — so this is one more ctl-04 on
    the same row, to the left of the conference field because it is the
    wider of the two filters."""
    s = read('standings.html')
    if 'data-select="zone"' in s:
        return
    key = '<div class="selwrap" data-select="conference">'
    if key not in s:
        raise SystemExit('standings.html: conference select not found')
    write('standings.html', s.replace(key, ZONE_SELECT + key, 1))
    log.append('standings.html: zone filter')


# ---------------------------------------------------------------
def b_drop_highlights():
    """"The highlights down in page are meaningless, either you have
    good reason to come up with or take out." Games, best win ratio,
    federations and average points are all read off the table directly
    above them, so there is no reason to come up with. Out."""
    s = read('conference.html')
    if 'cnf-kpis' not in s:
        return
    j = s.find('cnf-kpis')
    start = s.rfind('<div class="tpl-sub"', 0, j)
    if start < 0:
        raise SystemExit('conference.html: highlights block not found')
    end = end_of(s, start)
    block = s[start:end]
    if 'Conference highlights' not in block:
        raise SystemExit('conference.html: highlights block mismatched')
    write('conference.html', s[:start] + s[end:])
    log.append('conference.html: Conference highlights removed')


# ---------------------------------------------------------------
FTAG_CELL = ('<div class="el-13-FederationTag--m-both-plain ftag ftag-m cut cut-s '
             'ftag-plain"><div class="flag flag-ring"></div><div class="ftag-txt">'
             '<span class="ftag-code">IOC</span>'
             '<span class="ftag-name">Federation</span></div></div>')
MARKER_CELL = ('<div class="el-05-StatusBadge--marker-r marker marker-r cut cut-s">'
               '<span class="lbl">R</span></div>')

PERF_HEAD = ('<div class="el-08-TableHeaderRow cut cut-s thead">' +
             th('cell-position cell c-pos', '#', False) +
             th('cell-federation cell c-fed', 'Federation') +
             th('cell-conference cell c-conf', 'Conference') +
             th('cell-gp cell c-ep cell-num', 'GP') +
             th('cell-wl cell c-wl cell-num', 'W–L') +
             th('cell-winratio cell c-wr cell-num', 'Win %') +
             th('cell-ppg cell c-ppg cell-num', 'PPG') +
             th('cell-points cell c-pts cell-num cell-sorted', 'Tour Points') +
             th('cell-status cell c-st', 'Status') +
             '</div>')

PERF_ROW = ('<div class="el-04-TeamRow trow">' +
            td('cell-position cell c-pos', DASH_S) +
            td('cell-federation cell c-fed', FTAG_CELL) +
            td('cell-conference cell c-conf', DASH_S) +
            td('cell-gp cell c-ep cell-num', DASH_M) +
            td('cell-wl cell c-wl cell-num', DASH_M) +
            td('cell-winratio cell c-wr cell-num', DASH_M) +
            td('cell-ppg cell c-ppg cell-num', DASH_M) +
            td('cell-points cell c-pts cell-num', DASH_M) +
            td('cell-status cell c-st', MARKER_CELL) +
            '</div>')


def b_stats_teams():
    """Alex on Stats > Teams: "I would do like players just the table.
    Include PPG. Sortable. We can include if team is q, s or r."
    The two columns and the sorting are here; whether the spotlight and
    the overview strip above the table survive is a question for the
    call, not something to decide in a patch."""
    s = read('stats.html')
    if 'cell-ppg' in s:
        return
    j = s.find('st-perf')
    if j < 0:
        raise SystemExit('stats.html: st-perf not found')
    start = s.rfind('<div class="', 0, j)
    end = end_of(s, start)
    block = s[start:end]
    head0 = block.find('<div class="el-08-TableHeaderRow')
    head1 = end_of(block, head0)
    body = block[head1:]
    # every .trow in the block is replaced by one prototype row
    rows0 = body.find('<div class="el-04-TeamRow trow">')
    tail_from = rows0
    while True:
        nxt = body.find('<div class="el-04-TeamRow trow">', tail_from)
        if nxt < 0:
            break
        tail_from = end_of(body, nxt)
    newblock = (block[:head0] + PERF_HEAD + PERF_ROW + body[tail_from:])
    write('stats.html', s[:start] + newblock + s[end:])
    log.append('stats.html: Teams table gains PPG + status, sorts')


PL_HEAD = ('<div class="el-08-TableHeaderRow cut cut-s thead">' +
           th('cell-position cell r05-rank', '#', False) +
           th('cell-player cell r05-pl', 'Player') +
           th('cell-team cell r05-team', 'Team') +
           th('cell-conference cell c-conf', 'Conference') +
           th('cell-games cell r05-num cell-num', 'Games') +
           th('cell-points cell r05-num cell-num cell-sorted', 'Points') +
           th('cell-ppg cell r05-num cell-num', 'PPG') +
           th('cell-ranking cell r05-num cell-num', 'Ranking pts') +
           '</div>')

PL_ROW = ('<div class="el-04-TeamRow trow">' +
          td('cell-position cell r05-rank', DASH_M) +
          '<div class="cell-player cell r05-pl" style="gap:12px">'
          '<div class="el-24-Avatar--s-initials av av-s cut cut-s">'
          '<div class="av-init">—</div></div>'
          '<span class="team-name" style="font-size:17px">Player</span></div>' +
          td('cell-team cell r05-team',
             '<div class="el-13-FederationTag--s-code ftag ftag-s cut cut-s ftag-plain">'
             '<div class="flag flag-s flag-ring"></div><div class="ftag-txt">'
             '<span class="ftag-code">IOC</span></div></div>') +
          td('cell-conference cell c-conf', DASH_S) +
          td('cell-games cell r05-num cell-num', DASH_M) +
          td('cell-points cell r05-num cell-num', DASH_M) +
          td('cell-ppg cell r05-num cell-num', DASH_M) +
          td('cell-ranking cell r05-num cell-num', DASH_M) +
          '</div>')


def b_stats_players():
    """"Players missing maybe total scored points." The column is added
    and the three that were printing an em dash are filled: the box
    score is derived from the final score, which is what the player
    page has been summing all along."""
    s = read('stats.html')
    if 'cell-ranking' in s:
        return
    j = s.find('data-pane="players"')
    if j < 0:
        raise SystemExit('stats.html: players pane not found')
    start = s.rfind('<div class="', 0, j)
    end = end_of(s, start)
    block = s[start:end]
    head0 = block.find('<div class="el-08-TableHeaderRow')
    head1 = end_of(block, head0)
    body = block[head1:]
    rows0 = body.find('<div class="el-04-TeamRow trow">')
    tail_from = rows0
    while True:
        nxt = body.find('<div class="el-04-TeamRow trow">', tail_from)
        if nxt < 0:
            break
        tail_from = end_of(body, nxt)
    newblock = block[:head0] + PL_HEAD + PL_ROW + body[tail_from:]
    write('stats.html', s[:start] + newblock + s[end:])
    log.append('stats.html: Players table gains Points, sorts')


# ---------------------------------------------------------------
def c_sitejs():
    s = read('assets/site.js')
    o = s

    # 1 · win ratio is a percentage -------------------------------
    if 'function pctRatio' not in s:
        anchor = '  function cmp(key, dir) {'
        s = s.replace(anchor,
                      '''  /* Review 15 — the World Tour states a win ratio as a
     percentage and Alex asked the league to read the same way.
     One formatter, so the figure is identical on every page. */
  function pctRatio(v) {
    return (v == null || isNaN(v)) ? '\\u2014' : Math.round(v * 100) + '%';
  }
''' + anchor, 1)
    for old, new in [
        ("text(row, '.cell-winratio .t-data-m', r.winRatio.toFixed(2));",
         "text(row, '.cell-winratio .t-data-m', pctRatio(r.winRatio));"),
        ("text(row, '.cell-winratio .t-data-m', t.winRatio.toFixed(2));",
         "text(row, '.cell-winratio .t-data-m', pctRatio(t.winRatio));"),
        ("if (ev[1]) ev[1].textContent = me.winRatio.toFixed(2);",
         "if (ev[1]) ev[1].textContent = pctRatio(me.winRatio);"),
        ("['Win ratio', head.winRatio == null ? '—' : head.winRatio.toFixed(2)]",
         "['Win ratio', pctRatio(head.winRatio)]"),
        ("['Win ratio',       tot.winRatio == null ? '—' : tot.winRatio.toFixed(2)],",
         "['Win ratio',       pctRatio(tot.winRatio)],"),
        ("['Win ratio', t.winRatio == null ? '—' : t.winRatio.toFixed(2)]];",
         "['Win ratio', pctRatio(t.winRatio)]];"),
        ("text(f, '.finder-ratio', tot.played ? (tot.won / tot.played).toFixed(2) : '\\u2014');",
         "text(f, '.finder-ratio', pctRatio(tot.played ? tot.won / tot.played : null));"),
    ]:
        if old in s:
            s = s.replace(old, new)

    # 2 · S-01: caption off the head, onto the table --------------
    old = """        text(node, '.t-h3', confName(c));
        var meta = $$('.acc-head .t-body-s', node)[0];
        if (meta) meta.textContent = e.city + ' · Stop ' + e.number +
                                     ' of ' + (c.stopCount || all.length);"""
    new = """        text(node, '.t-h3', confName(c));
        var meta = $$('.acc-head .t-body-s', node)[0];
        /* Review 15 — the head said "Kigali · Stop 5 of 6" with the
           el-06 dots printing "Stop 5 of 6" an inch to its right. The
           head keeps the place; the stop is stated once, by the dots,
           and once more by the caption over the table below. */
        if (meta) meta.textContent = e.city;
        accCaption(node, c, e, all);"""
    if 'accCaption(node, c, e, all)' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: index accordion head not found')
        s = s.replace(old, new)

    old = """        text(node, '.t-h3', confName(c));
        var meta = $$('.acc-head .t-body-s', node)[0];
        if (meta) meta.textContent = cityOf(e) + ' · Stop ' + e.number +
          ' of ' + (c.stopCount || all.length) + ' · ' +
          fmtDate(e.start, { day: 'numeric', month: 'short' });"""
    new = """        text(node, '.t-h3', confName(c));
        var meta = $$('.acc-head .t-body-s', node)[0];
        if (meta) meta.textContent = cityOf(e) + ' · ' +
          fmtDate(e.start, { day: 'numeric', month: 'short' });
        accCaption(node, c, e, all);"""
    if s.count(old) == 1:
        s = s.replace(old, new)

    if 'function accCaption' not in s:
        anchor = '  function soloAccordions(host) {'
        s = s.replace(anchor, """  /* Review 15 — Alex, of the table inside the live conference:
     "Not clear that this is. Look like the conference standings,
     that is ok." It is, so it says so. The caption also carries
     the stop the table stands after, which is what the head used
     to repeat next to the dots. */
  function accCaption(node, c, e, all) {
    var cap = $('.acc-cap', node);
    if (!cap) return;
    var of = c.stopCount || (all || []).length;
    cap.textContent = 'Conference standings' +
      (e && e.number ? ' \\u00b7 after stop ' + e.number + ' of ' + of : '');
  }

""" + anchor, 1)

    # 3 · six federations, not four -------------------------------
    s = s.replace("repeat(node, '.trow', rows.slice(0, 4), function (row, r) {",
                  "repeat(node, '.trow', rows.slice(0, 6), function (row, r) {")

    # 4 · S-09 gains a Teams line ---------------------------------
    old = """    var lines = $$('.s09-line', host);
    function fill(line, vals) {"""
    new = """    /* Review 15 — the Teams line is filled by name, and the two
       counted lines are addressed without it: adding a third line
       to the landing page would otherwise have handed it the stop
       figures, which belong to the Conferences page. */
    var lines = $$('.s09-line', host).filter(function (l) {
      return !l.classList.contains('s09-line-teams');
    });
    var seenIoc = {};
    D.teams.forEach(function (t) { if (t.ioc) seenIoc[t.ioc] = 1; });
    text(host, '.s09-kv-sites', D.teams.length);
    text(host, '.s09-kv-nations', Object.keys(seenIoc).length);
    function fill(line, vals) {"""
    if 's09-kv-sites' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: paintOverview lines not found')
        s = s.replace(old, new)

    # 5 · Standings zone filter -----------------------------------
    old = "    var gender = 'men', query = '', confPick = '';"
    new = "    var gender = 'men', query = '', confPick = '', zonePick = '';"
    if 'zonePick' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: standings state not found')
        s = s.replace(old, new)

    old = """      var list = pool.filter(function (t) {
        if (confPick && t.confname !== confPick) return false;
        return !query || (t.team + ' ' + t.ioc).toLowerCase().indexOf(query) > -1;
      });"""
    new = """      var list = pool.filter(function (t) {
        if (confPick && t.confname !== confPick) return false;
        if (zonePick && t.zone !== zonePick) return false;
        return !query || (t.team + ' ' + t.ioc).toLowerCase().indexOf(query) > -1;
      });"""
    if 't.zone !== zonePick' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: standings filter not found')
        s = s.replace(old, new)

    old = """      t.confname = confName(conf(t.conference));
    });"""
    new = """      t.confname = confName(conf(t.conference));
      /* Review 15 — the zone the Standings filter offers. regionOf()
         already folds Europe-1..4 and the U21 conferences back into
         the five zones, so nothing new is derived here. */
      t.zone = regionOf(conf(t.conference));
    });"""
    if 't.zone = regionOf' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: federationTable tail not found')
        s = s.replace(old, new)

    old = """      selectControl($('.selwrap[data-select="conference"]'), names,
                    function (v) { confPick = v; draw(); }, 'All conferences');
    })();"""
    new = """      selectControl($('.selwrap[data-select="conference"]'), names,
                    function (v) { confPick = v; draw(); }, 'All conferences');
      selectControl($('.selwrap[data-select="zone"]'), REGIONS.slice(),
                    function (v) { zonePick = v; draw(); }, 'All zones');
    })();"""
    if 'data-select="zone"' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: standings select block not found')
        s = s.replace(old, new)

    # 6 · Find a team: U21 is U21, and every site shows its status
    old = """      var sites = D.teams.filter(function (x) { return x.ioc === t.ioc; });
      var byCat = {};
      sites.forEach(function (x) {
        var label = 'U23 ' + (x.gender === 'women' ? 'Women' : 'Men');
        byCat[label] = byCat[label] || x;
      });"""
    new = """      var sites = D.teams.filter(function (x) { return x.ioc === t.ioc; });
      /* Review 15 — the label was hard-coded to U23, so a federation
         that fields U21 as well was offered the same two buttons
         twice and told its U21 side was U23. The age category lives
         in the conference and nowhere else. */
      var byCat = {};
      sites.forEach(function (x) {
        var label = shortCat(conf(x.conference)) + ' ' +
                    (x.gender === 'women' ? 'Women' : 'Men');
        byCat[label] = byCat[label] || x;
      });"""
    if 'shortCat(conf(x.conference))' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: finder choose not found')
        s = s.replace(old, new)

    old = """        b.querySelector('.lbl').textContent = label;
        b.addEventListener('click', function () { result(byCat[label], label); });"""
    new = """        b.querySelector('.lbl').textContent = label;
        /* Alex: "then also if Q, S or R". The marker is on the button,
           so the answer is there before a site is even chosen. */
        var mk = siteStatus(byCat[label]);
        if (mk) {
          var m = document.createElement('div');
          m.className = 'el-05-StatusBadge--marker-' + mk +
                        ' marker marker-' + mk + ' cut cut-s finder-mk';
          m.innerHTML = '<span class="lbl">' + mk.toUpperCase() + '</span>';
          b.appendChild(m);
        }
        b.addEventListener('click', function () { result(byCat[label], label); });"""
    if 'finder-mk' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: finder button not found')
        s = s.replace(old, new)

    # U23 is the road to the World Cup, so it is offered first, and
    # men before women — the same order el-02 builds its switch in.
    old = "      Object.keys(byCat).forEach(function (label) {"
    new = ("      var ORDER = ['U23 Men', 'U23 Women', 'U21 Men', 'U21 Women'];\n"
           "      Object.keys(byCat).sort(function (a, b) {\n"
           "        var i = ORDER.indexOf(a), j = ORDER.indexOf(b);\n"
           "        return (i < 0 ? 9 : i) - (j < 0 ? 9 : j);\n"
           "      }).forEach(function (label) {")
    if 'ORDER.indexOf(a)' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: finder category loop not found')
        s = s.replace(old, new)

    old = """      text(f, '.finder-team', team.ioc + ' U23');"""
    new = """      text(f, '.finder-team', team.ioc + ' ' + shortCat(c));
      (function () {
        var box = $('.finder-team', f) || $('.finder-card-head', f);
        var old2 = $('.finder-result-mk', f);
        if (old2) old2.remove();
        var mk = siteStatus(team);
        if (!mk || !box) return;
        var m = document.createElement('div');
        m.className = 'el-05-StatusBadge--marker-' + mk +
                      ' marker marker-' + mk + ' cut cut-s finder-result-mk';
        m.innerHTML = '<span class="lbl">' + mk.toUpperCase() + '</span>';
        box.appendChild(m);
      })();"""
    if 'finder-result-mk' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: finder result label not found')
        s = s.replace(old, new)

    if 'function siteStatus' not in s:
        anchor = '  /* ---------- E-01 TeamFinder --------------------------------'
        s = s.replace(anchor, """  /* Review 15 — Q / S / R for one team site, read off the same
     season table the Standings page ranks with, so the letter a
     federation is given here is the letter it is given there.
     (conferences.html has a statusOf() of its own about a whole
     conference; this one is about one team site, hence the name.) */
  var STATUS_CACHE = {};
  function siteStatus(team) {
    if (!team || !team.ioc) return '';
    var g = team.gender || 'men';
    var k = g + '|' + team.ioc;
    if (STATUS_CACHE[k] != null) return STATUS_CACHE[k];
    var row = federationTable(g).filter(function (t) {
      return t.ioc === team.ioc;
    })[0];
    return (STATUS_CACHE[k] = (row && row.status) || '');
  }

""" + anchor, 1)

    # 7 · Stats: the two tables get their columns and their sorting
    old = """      fillTable('.st-perf', list.slice(0, 12), function (row, t, i) {
        row.hidden = false;
        fed(row, t.ioc, t.team);
        var c = $$('.cell', row);
        text(c[0], '.t-data-m, .t-body-s', i + 1);
        text(c[2], '.t-body-s', t.confname);
        text(c[3], '.t-data-m', t.played);
        text(c[4], '.t-data-m', t.won + '–' + (t.played - t.won));
        text(c[5], '.t-data-m', (t.winRatio * 100).toFixed(0) + '%');
        text(c[6], '.t-data-m', t.tour);
        link(row, 'team.html?ioc=' + t.ioc);
      });"""
    new = """      /* Review 15 — addressed by class rather than by index: the
         table gained PPG and a status marker, and painting by
         position is how the win ratio ended up under Pts Average
         the last time a column moved. */
      var perf = list.slice().sort(cmp(perfSort.key, perfSort.dir));
      fillTable('.st-perf', perf.slice(0, 12), function (row, t, i) {
        row.hidden = false;
        fed(row, t.ioc, t.team);
        text(row, '.cell-position .t-data-m, .cell-position .t-body-s', i + 1);
        text(row, '.cell-conference .t-body-s', t.confname);
        text(row, '.cell-gp .t-data-m', t.played);
        text(row, '.cell-wl .t-data-m', t.won + '–' + (t.played - t.won));
        text(row, '.cell-winratio .t-data-m', pctRatio(t.winRatio));
        text(row, '.cell-ppg .t-data-m', t.avg != null ? t.avg.toFixed(1) : '—');
        text(row, '.cell-points .t-data-m', t.tour);
        marker(row, t.status || 'r');
        link(row, 'team.html?ioc=' + t.ioc);
      });"""
    if 'perfSort.key' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: st-perf painter not found')
        s = s.replace(old, new)

    old = """      }).slice().sort(function (a, b) {
        return (b.rankingPoints || 0) - (a.rankingPoints || 0);
      }).slice(0, 30);"""
    new = """      });
      /* Review 15 — the three numeric columns were printing an em
         dash on the grounds that the snapshot has no box scores.
         It has none, but the box score is derived from the final
         score — the player page has been summing exactly this all
         along, so the table can state it too. */
      list.forEach(function (p) {
        var tt = playerTotals(p.id);
        p.games = tt.games;
        p.points = tt.games ? tt.points : 0;
        p.ppg = tt.games ? tt.points / tt.games : 0;
        p.ranking = p.rankingPoints || 0;
        p.pname = ((p.last || '') + ' ' + (p.first || '')).trim() || p.name || '';
        p.teamioc = (teamOf[p.id] || {}).ioc || p.ioc || '';
        p.confname = confName(conf((teamOf[p.id] || {}).conference));
      });
      list = list.sort(cmp(playSort.key, playSort.dir)).slice(0, 30);"""
    if 'playSort.key' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: players list not found')
        s = s.replace(old, new)

    old = """        var n = $$('.r05-num', row);
        if (n[0]) n[0].textContent = '—';
        if (n[1]) n[1].textContent = (p.rankingPoints || 0).toLocaleString();
        if (n[2]) n[2].textContent = '—';"""
    new = """        text(row, '.cell-games .t-data-m', p.games || '—');
        text(row, '.cell-points .t-data-m', p.games ? p.points : '—');
        text(row, '.cell-ppg .t-data-m', p.games ? p.ppg.toFixed(1) : '—');
        text(row, '.cell-ranking .t-data-m', p.ranking.toLocaleString());"""
    if "'.cell-ranking .t-data-m'" not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: players numbers not found')
        s = s.replace(old, new)

    old = """    function draw() { drawTeams(); drawPlayers(); }

    gender = genderSwitch(function (g) { gender = g; draw(); });
    tabPanes(document, '.st-tabs');
    draw();"""
    new = """    function draw() { drawTeams(); drawPlayers(); }

    /* Review 15 — "I assume sorteable by PPG, and Team and name."
       Both tables use the same el-08 sorter the Standings page has;
       each opens on the column its ranking is about. */
    var PERF_COLS = {
      'cell-federation': { key: 'team', text: 1 },
      'cell-conference': { key: 'confname', text: 1 },
      'cell-gp':         { key: 'played' },
      'cell-wl':         { key: 'won' },
      'cell-winratio':   { key: 'winRatio' },
      'cell-ppg':        { key: 'avg' },
      'cell-points':     { key: 'tour' },
      'cell-status':     { key: 'statusRank' }
    };
    var PLAY_COLS = {
      'cell-player':     { key: 'pname', text: 1 },
      'cell-team':       { key: 'teamioc', text: 1 },
      'cell-conference': { key: 'confname', text: 1 },
      'cell-games':      { key: 'games' },
      'cell-points':     { key: 'points' },
      'cell-ppg':        { key: 'ppg' },
      'cell-ranking':    { key: 'ranking' }
    };

    gender = genderSwitch(function (g) { gender = g; draw(); });
    tabPanes(document, '.st-tabs');
    if ($('.st-perf')) sortable($('.st-perf'), PERF_COLS, perfSort, draw);
    var plTbl = $('[data-pane="players"] .thead');
    if (plTbl) sortable(plTbl.parentElement, PLAY_COLS, playSort, draw);
    draw();"""
    if 'PERF_COLS' not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: stats wiring not found')
        s = s.replace(old, new)

    old = "    function drawTeams() {"
    new = """    var perfSort = { key: 'tour', dir: -1 };
    var playSort = { key: 'points', dir: -1 };

    function drawTeams() {"""
    if "var perfSort = " not in s:
        if s.count(old) != 1:
            raise SystemExit('site.js: drawTeams not found')
        s = s.replace(old, new)

    if s != o:
        write('assets/site.js', s)
        log.append('assets/site.js: review 15 behaviour')


# ---------------------------------------------------------------
def d_system():
    targets = [('system/index.html', '../assets/')]
    cdir = P('system', '_check')
    if os.path.isdir(cdir):
        for f in sorted(os.listdir(cdir)):
            if f.endswith('.html'):
                targets.append(('system/_check/' + f, '../../assets/'))
    for f, pre in targets:
        s = read(f)
        if pre + 'review15.css' in s:
            continue
        o = s
        s = re.sub(
            r'(<link rel="stylesheet" href="' + re.escape(pre) +
            r'review14\.css\?v=[^"]*">)',
            r'\1\n<link rel="stylesheet" href="' + pre + 'review15.css?v=1">',
            s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review15 linked')

    # the S-09 note names the two types; it now names three lines
    f = 'system/pages/modules-1.html'
    s = read(f)
    old = ('Each line is written as total then breakdown — <b>18 Conferences '
           '— 0 finished — 18 to go — 1 live</b>')
    new = ('A third line, <b>Teams</b>, states the size of the field — '
           '<b>202 team sites — 68 nations</b> — and is carried by both '
           'types. Each line is written as total then breakdown — '
           '<b>18 Conferences — 0 finished — 18 to go — 1 live</b>')
    if old in s and 'A third line, <b>Teams</b>' not in s:
        write(f, s.replace(old, new, 1))
        log.append(f + ': S-09 note')


for fn in (a_assets, b_overview_teams, b_acc_caption, b_standings_rank,
           b_standings_zone, b_drop_highlights, b_stats_teams,
           b_stats_players, c_sitejs, d_system):
    fn()

print('\n'.join(log) if log else 'nothing to do')
