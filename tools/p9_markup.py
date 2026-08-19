# -*- coding: utf-8 -*-
"""Markup pass: the Qualification switch, the Conferences two-column
head, the Stats page, and the Calendar page.
"""
import io, os, re
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')

def close_div(h, start):
    i = h.index('>', start) + 1
    depth = 1
    while depth:
        a = h.find('<div', i); b = h.find('</div>', i)
        if b == -1: raise ValueError('unbalanced')
        if a != -1 and a < b: depth += 1; i = a + 4
        else: depth -= 1; i = b + 6
    return i

def grab(src, opentag, frm=0):
    s = src.index(opentag, frm)
    return src[s:close_div(src, s)]

def sub_titled(src, title):
    i = src.index('>' + title + '<')
    s = src.rindex('<div class="tpl-sub">', 0, i)
    return src[s:close_div(src, s)], s, close_div(src, s)

EL02 = ('<div class="el-02-GenderSwitch--men el02 el02-s">'
        '<div class="el02-seg cut cut-s el02-on cut-out"><div class="cutfill"></div><span class="lbl">Men</span></div>'
        '<div class="el02-seg cut cut-s cut-out"><div class="cutfill"></div><span class="lbl">Women</span></div>'
        '</div>')
CHEV = ('<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" '
        'xmlns="http://www.w3.org/2000/svg"><path d="M686-450H160v-60h526L438-758l42-42 320 320-320 '
        '320-42-42 248-248Z"></path></svg>')
log = []

# ── 1 · Home: R-01 carries its own switch, under the title -------------
f = 'index.html'
h = io.open(f, encoding='utf-8').read()
if h.count('el-02-GenderSwitch') < 2:
    i = h.index('<div class="r01 r01-compact">')
    h = h[:i] + '<div class="r01-ctl">' + EL02 + '</div>' + h[i:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append('index.html — R-01 QualificationBoard has its own Men / Women switch again (LP-13)')

# ── 2 · Conferences: finder and Overview side by side ------------------
f = 'conferences.html'
h = io.open(f, encoding='utf-8').read()
if 'cnf-head' not in h:
    finder, fs, fe = sub_titled(h, 'Find a team')
    h = h[:fs] + h[fe:]
    ov, os_, oe = sub_titled(h, 'Overview')
    h = h[:os_] + h[oe:]
    split = ('<div class="tpl-split cnf-head">'
             '<div class="tpl-colL">' + finder + '</div>'
             '<div class="tpl-colR">' + ov + '</div>'
             '</div>')
    i = h.index('<div class="e03">')
    h = h[:i] + split + h[i:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append('conferences.html — find a team and Overview sit in two columns')

# ── 3 · Stats page -----------------------------------------------------
team = io.open('team.html', encoding='utf-8').read()
STATSROW = grab(team, '<div class="e04-stats">')          # the team-page stat row
conf_html = io.open('conference.html', encoding='utf-8').read()
KPIS = grab(conf_html, '<div class="cnf-kpis">')

f = 'stats.html'
h = io.open(f, encoding='utf-8').read()
players, ps, pe = sub_titled(h, 'Advertising') if False else (None, None, None)

# the players block is the tpl-sub that holds the r05 table
i = h.index('<div class="rowsplit">')
psub = h.rindex('<div class="tpl-sub">', 0, i)
pend = close_div(h, psub)
players = h[psub:pend]
h = h[:psub] + h[pend:]

# drop the metric chips row and add a Team column
players = players.replace(grab(players, '<div class="rowsplit">'), '', 1)
players = players.replace(
  '<div class="cell c-conf"><span class="t-caption">Conference</span></div>',
  '<div class="cell r05-team"><span class="t-caption">Team</span></div>'
  '<div class="cell c-conf"><span class="t-caption">Conference</span></div>', 1)
players = re.sub(
  r'<div class="cell c-conf"><span class="t-body-s">',
  '<div class="cell r05-team">'
  '<div class="el-13-FederationTag--s-code ftag ftag-s cut cut-s ftag-plain">'
  '<div class="flag flag-s flag-ring"></div>'
  '<div class="ftag-txt"><span class="ftag-code">IOC</span></div></div></div>'
  '<div class="cell c-conf"><span class="t-body-s">', players)

def section(title, inner, pane, link=None):
    head = ('<div class="el-01-SectionHeader--default el01-wrap"><div class="el01">'
            '<div class="el01-left"><h2 class="t-h2">' + title + '</h2></div>'
            + (('<a class="nav-a" href="' + link[1] + '"><div class="ctl-02-Link--default lnk">'
                '<span class="lbl">' + link[0] + '</span>' + CHEV + '</div></a>') if link else '')
            + '</div></div>')
    return '<div class="tpl-sub" data-pane="' + pane + '">' + head + inner + '</div>'

TABS = ('<div class="ctl-03-Tab--default tabs st-tabs">'
        '<div class="tab tab-active" data-tab="teams">Teams</div>'
        '<div class="tab" data-tab="players">Players</div></div>')

SPOT = section('Top scores', '<div class="st-spot"><div class="st-spot-name">—</div>'
               '<div class="t-body-s st-spot-sub">—</div></div>', 'teams')
TSTATS = section('Team stats spotlight', STATSROW, 'teams')
OVERVIEW = section('Overview', KPIS, 'teams')
CFILTER = ('<div class="tpl-sub" data-pane="teams">'
           '<div class="el-03-FilterChips--default el03 st-conf">'
           '<div class="el-14-Chip--s-on chip chip-s cut cut-s cut-out chip-on">'
           '<div class="cutfill"></div><span class="lbl">All conferences</span></div>'
           '</div></div>')

def tbl(cols, pane, cls):
    head = ''.join('<div class="cell %s%s"><span class="t-caption" style="color:inherit">%s</span></div>'
                   % (c[1], ' cell-num' if c[2] else '', c[0]) for c in cols)
    row = ''.join(
      ('<div class="cell %s"><div class="el-13-FederationTag--m-both-plain ftag ftag-m cut cut-s ftag-plain">'
       '<div class="flag flag-ring"></div><div class="ftag-txt"><span class="ftag-code">IOC</span>'
       '<span class="ftag-name">Federation</span></div></div></div>' % c[1])
      if c[1] == 'c-fed' else
      ('<div class="cell %s%s"><span class="%s">—</span></div>'
       % (c[1], ' cell-num' if c[2] else '', 't-data-m' if c[2] else 't-body-s'))
      for c in cols)
    return ('<div class="tbl ' + cls + '">'
            '<div class="el-08-TableHeaderRow cut cut-s thead">' + head + '</div>'
            '<div class="el-04-TeamRow trow">' + row + '</div></div>')

PERF = section('Team performance', tbl([
    ('#', 'c-pos', 0), ('Federation', 'c-fed', 0), ('Conference', 'c-conf', 0),
    ('GP', 'c-ep', 1), ('W–L', 'c-wr', 1), ('Win %', 'c-wr', 1), ('Tour Points', 'c-pts', 1)
], 'teams', 'st-perf'), 'teams')
SCORING = section('Team scoring', tbl([
    ('#', 'c-pos', 0), ('Federation', 'c-fed', 0), ('Conference', 'c-conf', 0),
    ('Points', 'c-pts', 1), ('PPG', 'c-pa', 1), ('Best game', 'c-pa', 1)
], 'teams', 'st-scoring'), 'teams')

players = players.replace('<div class="tpl-sub">', '<div class="tpl-sub" data-pane="players">', 1)

i = h.index('<div class="f04 f04-96"')
e = close_div(h, i)
h = h[:e] + TABS + SPOT + TSTATS + OVERVIEW + CFILTER + PERF + SCORING + players + h[e:]
io.open(f, 'w', encoding='utf-8').write(h)
log.append('stats.html — Teams | Players tabs, spotlight, overview, conference filter, two team tables; '
           'players lost the metric chips and gained a Team column')

# ── 4 · Calendar: the landing page's Live now module -------------------
idx = io.open('index.html', encoding='utf-8').read()
LIVE, _, _ = sub_titled(idx, 'Live now')
f = 'calendar.html'
h = io.open(f, encoding='utf-8').read()
if 's03wrap' not in h:
    i = h.index('<div class="tpl-sub">')
    e = close_div(h, i)
    h = h[:i] + LIVE + h[e:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append('calendar.html — S-03 + S-01 replace the month list and the dividers')

print('\n'.join(log))
