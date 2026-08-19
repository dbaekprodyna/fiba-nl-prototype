# -*- coding: utf-8 -*-
"""Conference page: headline and switch, then Overview | Stops tabs.

Overview keeps the standings columns agreed on 3 August, and gains the
leading scorers, the conference highlights and the photographs. Stops
carries the stop selector, the stop-by-stop matrix from the wireframe,
and the games of the selected stop.
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

def take(h, opentag, frm=0):
    s = h.index(opentag, frm)
    e = close_div(h, s)
    return h[s:e], s, e

f = 'conference.html'
h = io.open(f, encoding='utf-8').read()

# ── pull the pieces out ------------------------------------------------
stopnav, s1, e1 = take(h, '<div class="stopnav">')
h = h[:s1] + h[e1:]
s02, s2, e2 = take(h, '<div class="s02">')
h = h[:s2] + h[e2:]

def sub_titled(src, title):
    i = src.index('>' + title + '<')
    s = src.rindex('<div class="tpl-sub">', 0, i)
    e = close_div(src, s)
    return src[s:e], s, e

stand, ss, se = sub_titled(h, 'Conference standings')
h = h[:ss] + h[se:]
games, gs, ge = sub_titled(h, 'Games')
h = h[:gs] + h[ge:]
photos, ps, pe = sub_titled(h, 'Photos')
h = h[:ps] + h[pe:]

# ── new blocks ---------------------------------------------------------
TABS = ('<div class="ctl-03-Tab--default tabs cnf-tabs">'
        '<div class="tab tab-active" data-tab="overview">Overview</div>'
        '<div class="tab" data-tab="stops">Stops</div>'
        '</div>')

CARD = ('<div class="sh sh-e1 pcard-sh"><div class="E-08-PlayerCard--four-light pcard cut cut-l">'
  '<div class="cutfill"></div>'
  '<div class="pcard-bg"></div>'
  '<div class="pcard-shine"></div>'
  '<div class="pcard-stats">'
    '<div class="pcard-stat"><div class="pcard-k">PPG</div><div class="pcard-v">—</div></div>'
    '<div class="pcard-stat"><div class="pcard-k">GP</div><div class="pcard-v">—</div></div>'
    '<div class="pcard-stat"><div class="pcard-k">AGE</div><div class="pcard-v">—</div></div>'
    '<div class="pcard-stat"><div class="pcard-k">RANK</div><div class="pcard-v">—</div></div>'
  '</div>'
  '<div class="pcard-plate cut cut-m">'
    '<div class="pcard-flagbox"><div class="flag flag-ring"></div></div>'
    '<div class="pcard-nm"><div class="pcard-first">First</div><div class="pcard-last">Last</div></div>'
    '<div class="pcard-ioc">GER</div>'
  '</div>'
  '</div></div>')

SCORERS = ('<div class="tpl-sub" data-pane="overview">'
 '<div class="el-01-SectionHeader--default el01-wrap"><div class="el01">'
 '<div class="el01-left"><h2 class="t-h2">Leading scorers</h2></div>'
 '<a class="nav-a" href="stats.html"><div class="ctl-02-Link--default lnk">'
 '<span class="lbl">All stats</span></div></a></div></div>'
 '<div class="el-27-InlineBanner--info ban ban-scorers cut cut-m"><div class="ban-b">'
 '<div class="ban-t t-body-m">Box scores are not in the feed yet</div>'
 '<div class="ban-d t-body-s">Cards are ordered by FIBA 3x3 ranking points until they are, '
 'and points per game stays empty rather than guessing.</div></div></div>'
 '<div class="e10 e10-scorers">' + CARD + '</div></div>')

HIGHLIGHTS = ('<div class="tpl-sub" data-pane="overview">'
 '<div class="el-01-SectionHeader--default el01-wrap"><div class="el01">'
 '<div class="el01-left"><h2 class="t-h2">Conference highlights</h2></div></div></div>'
 '<div class="cnf-kpis">'
   '<div class="kpi cut cut-m cut-out"><div class="cutfill"></div><div class="t-caption">Games</div><div class="kpi-v">—</div></div>'
   '<div class="kpi cut cut-m cut-out"><div class="cutfill"></div><div class="t-caption">Best win %</div><div class="kpi-v">—</div></div>'
   '<div class="kpi cut cut-m cut-out"><div class="cutfill"></div><div class="t-caption">Federations</div><div class="kpi-v">—</div></div>'
   '<div class="kpi cut cut-m cut-out"><div class="cutfill"></div><div class="t-caption">Avg pts / game</div><div class="kpi-v">—</div></div>'
 '</div></div>')

MATRIX = ('<div class="tpl-sub" data-pane="stops">'
 '<div class="el-01-SectionHeader--default el01-wrap"><div class="el01">'
 '<div class="el01-left"><h2 class="t-h2">Stop by stop</h2></div></div></div>'
 '<div class="s11 tbl"><div class="el-08-TableHeaderRow cut cut-s thead">'
 '<div class="cell-federation cell c-fed"><span class="t-caption" style="color:inherit">Federation</span></div>'
 '<div class="cell-mstop cell c-mstop cell-num"><span class="t-caption" style="color:inherit">Stop</span></div>'
 '<div class="cell-points cell c-pts cell-num"><span class="t-caption" style="color:inherit">Tour Points</span></div>'
 '</div>'
 '<div class="el-04-TeamRow trow s11-row">'
 '<div class="cell-federation cell c-fed">'
   '<div class="el-13-FederationTag--m-both-plain ftag ftag-m cut cut-s ftag-plain">'
   '<div class="flag flag-ring"></div><div class="ftag-txt">'
   '<span class="ftag-code">GER</span><span class="ftag-name">Germany</span></div></div></div>'
 '<div class="cell-mstop cell c-mstop cell-num"><span class="t-data-m">—</span><span class="t-caption s11-pts">—</span></div>'
 '<div class="cell-points cell c-pts cell-num"><span class="t-data-m">—</span></div>'
 '</div></div></div>')

CONFLINK = ('<div class="cnf-back" data-pane="stops"><a class="nav-a" href="#stops">'
 '<div class="ctl-02-Link--default lnk"><span class="lbl">See updated conference table</span>'
 '<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" xmlns="http://www.w3.org/2000/svg">'
 '<path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z"></path></svg>'
 '</div></a></div>')

def pane(block, name):
    return block.replace('<div class="tpl-sub">', '<div class="tpl-sub" data-pane="%s">' % name, 1)

BODY = (TABS
        + pane(stand, 'overview') + SCORERS + HIGHLIGHTS + pane(photos, 'overview')
        + '<div class="cnf-stopnav" data-pane="stops">' + stopnav + s02 + '</div>'
        + MATRIX + pane(games, 'stops') + CONFLINK)

s = h.index('</div>', h.index('<div class="f04 f04-96"'))
# place the body right after the F-04 block
s = h.index('<div class="f04 f04-96"')
e = close_div(h, s)
h = h[:e] + BODY + h[e:]
io.open(f, 'w', encoding='utf-8').write(h)
print('conference.html: Overview | Stops tabs, leading scorers, highlights, stop matrix, conference-table link')
