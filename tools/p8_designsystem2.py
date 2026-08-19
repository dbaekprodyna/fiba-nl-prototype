# -*- coding: utf-8 -*-
"""Design system, second pass: two new modules, four new states, and the
purposes that changed with them.
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

log = []
team = io.open('team.html', encoding='utf-8').read()
cnf  = io.open('conference.html', encoding='utf-8').read()

S10 = grab(team, '<div class="s10 tbl">')
CARD = grab(cnf, '<div class="sh sh-e1 pcard-sh">')

# a static 6-stop matrix for the specimen — the page builds it from data
def mrow(ioc, name, places, tour):
    cells = ''.join(
        ('<div class="cell-mstop cell c-mstop cell-num"><span class="t-data-m">—</span></div>'
         if p is None else
         '<div class="cell-mstop cell c-mstop cell-num"><span class="t-data-m%s">%s</span>'
         '<span class="t-caption s11-pts">%d pts</span></div>' % (' s11-first' if p == 1 else '', ordinal(p), pts(p)))
        for p in places)
    return ('<div class="el-04-TeamRow trow s11-row">'
      '<div class="cell-federation cell c-fed">'
      '<div class="el-13-FederationTag--m-both-plain ftag ftag-m cut cut-s ftag-plain">'
      '<div class="flag flag-ring"></div><div class="ftag-txt">'
      '<span class="ftag-code">%s</span><span class="ftag-name">%s</span></div></div></div>'
      '%s<div class="cell-points cell c-pts cell-num"><span class="t-data-m">%s</span></div>'
      '</div>') % (ioc, name, cells, tour)

def ordinal(n):
    return '%d%s' % (n, {1: 'st', 2: 'nd', 3: 'rd'}.get(n if n < 20 else n % 10, 'th'))
def pts(n):
    return [100, 80, 70, 60, 50, 40][n - 1] if n <= 6 else 10

S11 = ('<div class="s11 tbl"><div class="el-08-TableHeaderRow cut cut-s thead">'
 '<div class="cell-federation cell c-fed"><span class="t-caption" style="color:inherit">Federation</span></div>'
 + ''.join('<div class="cell-mstop cell c-mstop cell-num"><span class="t-caption" style="color:inherit">Stop %d</span></div>' % i for i in range(1, 7))
 + '<div class="cell-points cell c-pts cell-num"><span class="t-caption" style="color:inherit">Tour Points</span></div></div>'
 + mrow('CRO', 'Croatia', [4, 1, 1, 2, 3, 3], 480)
 + mrow('LTU', 'Lithuania', [1, 5, 6, 4, 1, 1], 450)
 + mrow('GER', 'Germany', [2, 6, 4, 3, None, None], 250)
 + '</div>')

def module(anchor, name, purpose, states, note):
    body = ''.join(
      '<div class="m-state"><div class="t-caption el-state-label">%s</div>'
      '<div class="%s m-frame live">%s</div></div>' % (lbl, cls, mk)
      for lbl, cls, mk in states)
    return ('<section class="anchor" id="%s" data-anchor="%s"><section class="m-block">'
      '<div class="m-head"><div class="ds-name">%s</div>'
      '<div class="t-body-s el-purpose">%s</div></div>'
      '<div class="m-states">%s</div>'
      '<div class="el-note cut cut-s"><div class="t-label">Note</div>'
      '<div class="t-body-s">%s</div></div>'
      '</section></section>\n') % (anchor, anchor, name, purpose, body, note)

S10_SEC = module('s-10-seasonjourney', 'S-10 SeasonJourney',
 'A federation’s conference read stop by stop: where it finished, what that was worth, '
 'and whether the stop has been played. It sits above the roster on a team page and answers '
 'the question the results list cannot — how the season has gone — which is what the '
 'wireframe called Season Journey.',
 [('all six stops · one played', 'S-10-SeasonJourney--default', S10)],
 'Built from the same el-08 / el-04 table pair as every other table in the system, so it '
 'inherits row height, hover and rules rather than introducing a fourth list style. Stops '
 'with no result are dimmed instead of hidden — a federation’s season has a shape '
 'even before it is played.')

S11_SEC = module('s-11-stopmatrix', 'S-11 StopMatrix',
 'One row per federation, one column per stop, the placement over what it was worth. '
 'Johannes’ original, and the only view that shows a federation’s trajectory through a '
 'conference at a glance — Alex asked for exactly this on slide 9 of the written '
 'feedback: <b>“Good, but show six stops”</b>. It lives on the Stops tab of a conference '
 'page; the Overview tab keeps the standings columns agreed on 3 August.',
 [('six stops · three played', 'S-11-StopMatrix--default', S11)],
 'The column count follows the conference rather than being drawn at six, so a conference '
 'with a different number of stops needs no new component. First place is set in bold — '
 'the stop winner is the only value in the grid that changes who qualifies.')

def bare(sec):
    '''system/_check/ has no anchor wrapper around each module block.'''
    return re.sub(r'^<section class="anchor"[^>]*>', '', sec).replace('</section></section>\n', '</section>\n')

for f in ('system/_check/03a-modules-frame.html', 'system/pages/modules-1.html'):
    h = io.open(f, encoding='utf-8').read()
    if 'S-10 SeasonJourney' in h: continue
    i = h.index('S-09 Overview')
    nxt = h.find('<section class="anchor"', i)
    if nxt == -1: nxt = h.find('<section class="m-block">', i)
    if nxt == -1: nxt = len(h)
    add = (S10_SEC + S11_SEC) if 'pages/' in f else (bare(S10_SEC) + bare(S11_SEC))
    h = h[:nxt] + add + h[nxt:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append(f + ' — S-10 SeasonJourney and S-11 StopMatrix added')

# ── purposes that changed ---------------------------------------------
EDITS = [
 ('E-03 ConferenceGrid',
  'Regional group cards instead of a world map.',
  'One card per conference, grouped under a region caption. It was one card per region with '
  'the conferences listed inside and a View region link that went nowhere the card did not '
  'already go; a conference is the thing people look for, so it gets the card, and the '
  'federations in it are named with el-13 FederationTag at size S. The U21 conferences sit '
  'inside their region with the rest — the feed files them all under a "U21" region, which '
  'would otherwise collect them into a group of their own.'),
 ('E-09 FederationDirectory',
  'The Teams index: every federation in the competition, jumpable by letter.',
  'The Teams index: every federation in the competition, filtered by region. The A–Z jump '
  'bar came off — with 67 federations the letter is rarely what anyone knows and the region '
  'is — so el-25 AlphaIndex gave way to a row of el-14 Chip at size S under the search '
  'field, and the count moved under the chips because it describes what the filter left.'),
 ('el-25 AlphaIndex',
  'The A to Z jump bar above the federation directory.',
  'The A to Z jump bar. No longer used on the Teams page, where the region filter replaced '
  'it — kept in the system for any future index long enough to need a letter jump.'),
]
for f in ('system/_check/03b-modules-ranking.html', 'system/_check/02-elements.html',
          'system/pages/modules-2.html', 'system/pages/elements.html'):
    h = io.open(f, encoding='utf-8').read()
    src = h
    for name, old, new in EDITS:
        if name in h and old in h:
            h = h.replace(old, new, 1)
    if h != src:
        io.open(f, 'w', encoding='utf-8').write(h)
        log.append(f + ' — purposes updated')

# ── el-09 Legend specimen gains N -------------------------------------
N_ITEM = ('<div class="legend-item"><div class="el-05-StatusBadge--marker-n marker marker-n cut cut-s">'
          '<span class="lbl">N</span></div><span class="t-body-s">Not qualified</span></div>')
for f in ('system/_check/02-elements.html', 'system/pages/elements.html'):
    h = io.open(f, encoding='utf-8').read()
    if 'Not qualified</span></div>' in h: continue
    key = 'In the race</span></div>'
    if key not in h: continue
    i = h.index(key) + len(key)
    h = h[:i] + N_ITEM + h[i:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append(f + ' — el-09 Legend gained the N marker')

print('\n'.join(log) or 'nothing to do')
