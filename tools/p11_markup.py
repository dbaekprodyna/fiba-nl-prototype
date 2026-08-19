# -*- coding: utf-8 -*-
"""Conferences goes back to one column, and About becomes one page with
an anchor menu.
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

def grab(h, opentag, frm=0):
    s = h.index(opentag, frm)
    return h[s:close_div(h, s)], s, close_div(h, s)

log = []

# ── Conferences ───────────────────────────────────────────────────────
f = 'conferences.html'
h = io.open(f, encoding='utf-8').read()

# the headline carries no count line
h = h.replace('<div class="t-body-s">18 conferences · 108 stops</div>', '', 1)

# unwrap the two-column head: both blocks are full width, stacked
if 'cnf-head' in h:
    split, s, e = grab(h, '<div class="tpl-split cnf-head">')
    colL, _, _ = grab(split, '<div class="tpl-colL">')
    colR, _, _ = grab(split, '<div class="tpl-colR">')
    inner = lambda blk: blk[blk.index('>') + 1:-6]
    h = h[:s] + inner(colL) + inner(colR) + h[e:]
    log.append('conferences.html — Find a team and Overview are full-width blocks, stacked')
io.open(f, 'w', encoding='utf-8').write(h)

# ── About: one page, anchored ─────────────────────────────────────────
f = 'about.html'
h = io.open(f, encoding='utf-8').read()
if 'c06-sec' not in h:
    main, ms, me = grab(h, '<div class="c06-main">')
    body = main[main.index('>') + 1:-6]

    # split the body on its h2s — each becomes a section with an id
    parts = re.split(r'(?=<div class="c05-h2">)', body)
    lead = parts[0] if not parts[0].startswith('<div class="c05-h2">') else ''
    secs = [p for p in parts if p.startswith('<div class="c05-h2">')]

    def slug(t):
        return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')

    out, toc = [], []
    for p in secs:
        title = re.search(r'<div class="c05-h2">(.*?)</div>', p, re.S).group(1)
        sid = slug(re.sub(r'<[^>]+>', '', title))
        p = p.replace('<div class="c05-h2">', '<h2 class="c05-h2">', 1)
        p = p.replace('</div>', '</h2>', 1)
        out.append('<section class="c06-sec" id="%s">%s</section>' % (sid, p))
        toc.append((sid, re.sub(r'<[^>]+>', '', title)))

    h = h[:ms] + '<div class="c06-main">' + lead + ''.join(out) + '</div>' + h[me:]

    tocblk, ts, te = grab(h, '<div class="c06-toc">')
    items = ''.join(
        '<a class="c06-toc-i%s" href="#%s">%s</a>' % (' c06-toc-on' if i == 0 else '', sid, label)
        for i, (sid, label) in enumerate(toc))
    h = h[:ts] + '<nav class="c06-toc" aria-label="On this page">' + items + '</nav>' + h[te:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append('about.html — one page, %d anchored sections, the menu is a real anchor nav' % len(toc))

print('\n'.join(log))
