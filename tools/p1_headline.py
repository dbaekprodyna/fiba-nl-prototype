# -*- coding: utf-8 -*-
"""F-04 gains a control slot on the right; the page's context line moves
under the H1 on the left. The Men / Women switch lives in that slot on
every page that has one, so it never moves between screens.
"""
import io, os, glob, re
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

def cut(h, opentag, frm=0):
    s = h.find(opentag, frm)
    if s == -1: return h, None
    e = close_div(h, s)
    return h[:s] + h[e:], h[s:e]

log = []
for f in sorted(glob.glob('*.html')):
    h = src = io.open(f, encoding='utf-8').read()
    note = []

    # the switch, wherever it currently is
    ctl = None
    if f != 'index.html':
        h, ctl = cut(h, '<div class="el-02-GenderSwitch')
        h, bar = cut(h, '<div class="pgbar">')          # the empty bar left behind
        if bar and not ctl:
            m = re.search(r'<div class="el-02-GenderSwitch[\s\S]*', bar)
            ctl = m.group(0)[:-6] if m else None
        if ctl: note.append('switch:moved')

    # F-04: identity column on the left, control slot on the right
    s = h.find('<div class="f04-row">')
    if s != -1:
        e = close_div(h, s)
        o = h.index('>', s) + 1
        inner = h[o:e-6]
        if 'f04-idl' not in inner:
            new = ('<div class="f04-row"><div class="f04-idl">' + inner + '</div>'
                   + ('<div class="f04-ctl">' + ctl + '</div>' if ctl else '')
                   + '</div>')
            h = h[:s] + new + h[e:]
            note.append('f04-row')
        ctl = None

    if ctl:      # no F-04 on this page (search.html) — put it back
        h = h[:h.index('</body>')] + h[h.index('</body>'):]
        note.append('switch:no-f04-kept-out')

    if h != src:
        io.open(f, 'w', encoding='utf-8').write(h)
        log.append('%-20s %s' % (f, ' '.join(note)))
print('\n'.join(log))
