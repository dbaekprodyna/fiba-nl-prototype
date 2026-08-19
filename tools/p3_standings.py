# -*- coding: utf-8 -*-
"""Standings and Qualification stop being the same table.

Competition Standings — every registered federation, ranked on
performance, sortable.  Qualification — the twenty places to the U23
World Cup only, in qualification order, with the route each federation
is on.  ST-03 asked the page to answer two things; until now both tabs
answered the same one.
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

LEGEND = ('<div class="el-09-Legend--default legend legend-attached">'
 '<div class="legend-item"><div class="el-05-StatusBadge--marker-q marker marker-q cut cut-s"><span class="lbl">Q</span></div><span class="t-body-s">Qualified for the U23 World Cup</span></div>'
 '<div class="legend-item"><div class="el-05-StatusBadge--marker-s marker marker-s cut cut-s"><span class="lbl">S</span></div><span class="t-body-s">Shortlisted — still in the race</span></div>'
 '<div class="legend-item"><div class="el-05-StatusBadge--marker-r marker marker-r cut cut-s"><span class="lbl">R</span></div><span class="t-body-s">In the race</span></div>'
 '<div class="legend-item"><div class="el-05-StatusBadge--marker-n marker marker-n cut cut-s"><span class="lbl">N</span></div><span class="t-body-s">Not qualified</span></div>'
 '</div>')

N_ITEM = ('<div class="legend-item"><div class="el-05-StatusBadge--marker-n marker marker-n cut cut-s">'
          '<span class="lbl">N</span></div><span class="t-body-s">Not qualified</span></div>')

log = []

# 1 ─ the table is not 1440px wide, it is the width of the column it is in.
for f in ('standings.html', 'qualification.html', 'conference.html'):
    h = io.open(f, encoding='utf-8').read()
    if 'class="tbl" style="width:1440px"' in h:
        h = h.replace('class="tbl" style="width:1440px"', 'class="tbl"')
        io.open(f, 'w', encoding='utf-8').write(h)
        log.append(f + ' — table no longer overflows its column (Status was clipped)')

# 2 ─ N joins every existing legend
for f in ('conference.html',):
    h = io.open(f, encoding='utf-8').read()
    if 'marker-n' not in h and 'legend-attached' in h:
        i = h.index('legend-attached')
        e = close_div(h, h.rindex('<div', 0, i))
        h = h[:e - 6] + N_ITEM + h[e - 6:]
        io.open(f, 'w', encoding='utf-8').write(h)
        log.append(f + ' — legend gained N')

# 3 ─ Standings and Qualification get a legend under the table
for f in ('standings.html', 'qualification.html'):
    h = io.open(f, encoding='utf-8').read()
    if 'legend-attached' in h: continue
    s = h.index('<div class="tbl"')
    e = close_div(h, s)
    h = h[:e] + LEGEND + h[e:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append(f + ' — legend added under the table')

# 4 ─ Qualification swaps Pts Average and EP for the route
h = io.open('qualification.html', encoding='utf-8').read()
if 'cell-route' not in h:
    # header cells
    for cls, label in (('cell-ptsavg', 'Route'), ('cell-ep', None)):
        while True:
            s = h.find('<div class="' + cls)
            if s == -1: break
            e = close_div(h, s)
            inner = h[s:e]
            is_head = 't-caption' in inner
            if label and is_head:
                h = h[:s] + ('<div class="cell-route cell c-route">'
                             '<span class="t-caption" style="color:inherit">Route</span></div>') + h[e:]
            elif label:
                h = h[:s] + ('<div class="cell-route cell c-route">'
                             '<span class="t-body-s">Standings</span></div>') + h[e:]
            else:
                h = h[:s] + h[e:]
    io.open('qualification.html', 'w', encoding='utf-8').write(h)
    log.append('qualification.html — Pts Average and EP replaced by Route')

print('\n'.join(log))
