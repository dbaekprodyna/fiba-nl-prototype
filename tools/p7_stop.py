# -*- coding: utf-8 -*-
"""Stop page: the stops are selectable and the page follows the
selection, and the link back to the conference table sits at the foot.

Bracket placement: it was already in the right place — Stop result,
Pools, Bracket, Games, which is the order Alex asked for on slide 14
(final on top, third place under it). It read as missing because
nothing filled it; the snapshot holds pool games and finals only, so
the rounds it has no games for now hide instead of showing specimen
scores.
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

cnf = io.open('conference.html', encoding='utf-8').read()
s = cnf.index('<div class="cnf-stopnav"')
NAV = cnf[s:close_div(cnf, s)].replace(' data-pane="stops"', '')

BACK = ('<div class="cnf-back"><a class="nav-a" href="conference.html">'
 '<div class="ctl-02-Link--default lnk"><span class="lbl">See updated conference table</span>'
 '<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" xmlns="http://www.w3.org/2000/svg">'
 '<path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z"></path></svg>'
 '</div></a></div>')

f = 'stop.html'
h = io.open(f, encoding='utf-8').read()
if 'cnf-stopnav' not in h:
    s = h.index('<div class="f04 f04-96"')
    e = close_div(h, s)
    h = h[:e] + NAV + h[e:]
if 'cnf-back' not in h:
    h = h[:h.rindex('</div></div>')] + BACK + h[h.rindex('</div></div>'):]
io.open(f, 'w', encoding='utf-8').write(h)
print('stop.html — stop selector added under the header, conference-table link at the foot')
