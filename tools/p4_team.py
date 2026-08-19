# -*- coding: utf-8 -*-
"""Team page: one H1, a category-aware switch, Season Journey above the
roster, and Photos under the results. Also lifts the Photos block into
the conference and stop pages, which both asked for one.
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

def block_from(h, opentag, frm=0):
    s = h.find(opentag, frm)
    if s == -1: return None
    return h[s:close_div(h, s)]

log = []

# ── the Photos block, taken from the landing page so there is one of it
idx = io.open('index.html', encoding='utf-8').read()
i = idx.index('>Photos<')
s = idx.rindex('<div class="tpl-sub">', 0, i)
PHOTOS = idx[s:close_div(idx, s)]
PHOTOS = PHOTOS.replace('<a class="nav-a" href="index.html">', '<a class="nav-a" href="index.html">')

# ── S-10 SeasonJourney -------------------------------------------------
def journey_row(stop, host, date, place, pts, status, badge='marker-r'):
    return ('<div class="el-04-TeamRow trow s10-row">'
      '<div class="cell-jstop cell c-jstop"><span class="t-data-m">%s</span></div>'
      '<div class="cell-jhost cell c-jhost"><span class="t-body-s">%s</span></div>'
      '<div class="cell-jdate cell c-jdate"><span class="t-body-s">%s</span></div>'
      '<div class="cell-jplace cell c-jplace cell-num"><span class="t-data-m">%s</span></div>'
      '<div class="cell-jpts cell c-jpts cell-num"><span class="t-data-m">%s</span></div>'
      '<div class="cell-jstatus cell c-jstatus"><span class="t-body-s">%s</span></div>'
      '</div>') % (stop, host, date, place, pts, status)

JOURNEY = ('<div class="tpl-sub"><div class="el-01-SectionHeader--default el01-wrap">'
  '<div class="el01"><div class="el01-left"><h2 class="t-h2">Season journey</h2></div>'
  '<a class="nav-a" href="conferences.html"><div class="ctl-02-Link--default lnk">'
  '<span class="lbl">View conference</span></div></a></div></div>'
  '<div class="s10 tbl">'
  '<div class="el-08-TableHeaderRow cut cut-s thead">'
  '<div class="cell-jstop cell c-jstop"><span class="t-caption" style="color:inherit">Stop</span></div>'
  '<div class="cell-jhost cell c-jhost"><span class="t-caption" style="color:inherit">Host</span></div>'
  '<div class="cell-jdate cell c-jdate"><span class="t-caption" style="color:inherit">Date</span></div>'
  '<div class="cell-jplace cell c-jplace cell-num"><span class="t-caption" style="color:inherit">Placed</span></div>'
  '<div class="cell-jpts cell c-jpts cell-num"><span class="t-caption" style="color:inherit">Tour Pts</span></div>'
  '<div class="cell-jstatus cell c-jstatus"><span class="t-caption" style="color:inherit">Status</span></div>'
  '</div>'
  + journey_row(1, 'Vilnius, Lithuania', '12 Jun', '2nd', 80, 'Played')
  + '</div></div>')

# ── team.html ---------------------------------------------------------
f = 'team.html'
h = io.open(f, encoding='utf-8').read()

# 1 · F-04 keeps the breadcrumb and the control slot; the page title
#     moves to E-04, which is where the federation is actually named.
s = h.index('<div class="f04-idl">')
e = close_div(h, s)
h = h[:s] + h[e:]
h = h.replace('<div class="e04-name">Serbia</div>',
              '<h1 class="e04-name">Serbia</h1>', 1)
log.append('team.html — F-04 carries the breadcrumb and the switch; the H1 is now E-04’s federation name')

# 2 · Squad → Roster (FIBA's own term, and the module is E-10 RosterGrid)
h = h.replace('<h2 class="t-h2">Squad</h2>', '<h2 class="t-h2">Roster</h2>', 1)
log.append('team.html — Squad renamed Roster')

# 3 · Season journey goes above the roster
s = h.index('<h2 class="t-h2">Roster</h2>')
s = h.rindex('<div class="tpl-sub">', 0, s)
h = h[:s] + JOURNEY + h[s:]
log.append('team.html — S-10 SeasonJourney inserted above the roster')

# 4 · Photos under the results
s = h.index('<h2 class="t-h2">Results</h2>')
s = h.rindex('<div class="tpl-sub">', 0, s)
e = close_div(h, s)
h = h[:e] + PHOTOS + h[e:]
log.append('team.html — Photos added under Results')
io.open(f, 'w', encoding='utf-8').write(h)

# ── conference.html and stop.html get Photos too ----------------------
for f in ('conference.html', 'stop.html'):
    h = io.open(f, encoding='utf-8').read()
    if '>Photos<' in h: continue
    s = h.rindex('<div class="tpl-sub">')
    e = close_div(h, s)
    h = h[:e] + PHOTOS + h[e:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append(f + ' — Photos added at the foot of the page')

print('\n'.join(log))
