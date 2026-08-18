# -*- coding: utf-8 -*-
"""P0 fixes agreed for the 2026-08-21 review.

 1. LP-01      explicit Home entry in the main navigation
 2. SEO/WCAG   real <h1> per page, <h2> for section titles (Mota, 2026-08-03)
 3. CF-01      Men / Women switch in the conference header
 4. Alex s.12  the switch sits in the same place on every page
"""
import io, os, sys, glob

ROOT = os.path.dirname(os.path.abspath(__file__)) + '/..'
os.chdir(ROOT)

EL02 = ('<div class="el-02-GenderSwitch--men el02 el02-s">'
        '<div class="el02-seg cut cut-s el02-on cut-out"><div class="cutfill"></div><span class="lbl">Men</span></div>'
        '<div class="el02-seg cut cut-s cut-out"><div class="cutfill"></div><span class="lbl">Women</span></div>'
        '</div>')
PGBAR = '<div class="pgbar">' + EL02 + '</div>'

def close_div(h, start):
    """index just past the </div> that closes the <div> opening at `start`."""
    i = h.index('>', start) + 1
    depth = 1
    while depth:
        a = h.find('<div', i)
        b = h.find('</div>', i)
        if b == -1:
            raise ValueError('unbalanced div at %d' % start)
        if a != -1 and a < b:
            depth += 1; i = a + 4
        else:
            depth -= 1; i = b + 6
    return i

def retag(h, opentag, tag, prefix=''):
    """<div class="x">…</div>  ->  <tag class="x">prefix…</tag>"""
    n = 0
    while True:
        s = h.find(opentag)
        if s == -1:
            break
        e = close_div(h, s)
        o = h.index('>', s) + 1
        inner = h[o:e-6]
        h = h[:s] + '<' + tag + h[s+4:o] + prefix + inner + '</' + tag + '>' + h[e:]
        n += 1
        # opentag no longer matches this occurrence, loop finds the next one
    return h, n

def cut_block(h, opentag):
    s = h.find(opentag)
    if s == -1:
        return h, None
    e = close_div(h, s)
    return h[:s] + h[e:], h[s:e]

def after_f04(h):
    s = h.find('<div class="f04 ')
    if s == -1:
        return None
    return close_div(h, s)

log = []
for f in sorted(glob.glob('*.html')):
    h = src = io.open(f, encoding='utf-8').read()
    note = []

    # ---- 1. Home in the navigation -------------------------------------
    if '<div class="f03-list">' in h and '>Home<' not in h.split('<div class="f03-list">')[1][:200]:
        on = ' f03-on' if f == 'index.html' else ''
        h = h.replace('<div class="f03-list">',
                      '<div class="f03-list"><a class="nav-a" href="index.html">'
                      '<div class="f03-i%s">Home</div></a>' % on, 1)
        note.append('nav:Home')

    # ---- 2. headings ----------------------------------------------------
    for cls in ('f04-h1-m', 'f04-h1-s'):
        h, n = retag(h, '<div class="%s">' % cls, 'h1')
        if n: note.append('h1x%d' % n)
    if f == 'index.html':
        h, n = retag(h, '<div class="hl-logo">', 'h1',
                     '<span class="sr-only">FIBA 3x3 Nations League 2026</span>')
        if n: note.append('h1:home')
    h, n = retag(h, '<div class="t-h2">', 'h2')
    if n: note.append('h2x%d' % n)

    # ---- 3 + 4. one Men / Women switch, same place on every page --------
    if f in ('standings.html', 'qualification.html', 'stats.html',
             'teams.html', 'conference.html', 'stop.html'):
        h, _ = cut_block(h, '<div class="el-02-GenderSwitch')
        p = after_f04(h)
        if p is not None:
            h = h[:p] + PGBAR + h[p:]
            note.append('pgbar')

    if h != src:
        io.open(f, 'w', encoding='utf-8').write(h)
        log.append('%-20s %s' % (f, ' '.join(note)))

print('\n'.join(log))
