# -*- coding: utf-8 -*-
"""Conferences page rebuilt: find a team, then Overview, then the
qualification-tables link, then one card per conference with the
federations that are in it. Region becomes a caption over a group of
cards rather than a card of its own, and the U21 conferences sit inside
their region with everything else.
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

idx = io.open('index.html', encoding='utf-8').read()

def sub_with(title, src=None):
    src = src if src is not None else idx
    i = src.index('>' + title + '<')
    s = src.rindex('<div class="tpl-sub">', 0, i)
    return src[s:close_div(src, s)]

FINDER = sub_with('Find a team')
# S-09, both lines — the shape the Conferences page carries
S09_FULL = ('<div class="tpl-sub"><div class="el-01-SectionHeader--default el01-wrap">'
 '<div class="el01"><div class="el01-left"><h2 class="t-h2">Overview</h2></div></div></div>'
 '<div class="s09 brandstroke cut cut-m cut-out brandstroke-spin"><div class="cutfill"></div>'
 '<div class="s09-lines">'
 '<div class="s09-line"><span class="s09-lab">Conferences</span><div class="s09-brk">'
 '<div class="s09-k"><span class="s09-kv">18</span><span class="s09-kl">total</span></div>'
 '<div class="s09-k"><span class="s09-kv">0</span><span class="s09-kl">finished</span></div>'
 '<div class="s09-k"><span class="s09-kv">18</span><span class="s09-kl">to go</span></div>'
 '<div class="s09-k s09-k-live"><span class="s09-kv s09-kv-live">0</span><span class="s09-kl">live</span></div>'
 '</div></div>'
 '<div class="s09-line"><span class="s09-lab">Stops worldwide</span><div class="s09-brk">'
 '<div class="s09-k"><span class="s09-kv">108</span><span class="s09-kl">total</span></div>'
 '<div class="s09-k"><span class="s09-kv">18</span><span class="s09-kl">finished</span></div>'
 '<div class="s09-k"><span class="s09-kv">90</span><span class="s09-kl">to go</span></div>'
 '<div class="s09-k s09-k-live2"><span class="s09-kv s09-kv-live">0</span><span class="s09-kl">live</span></div>'
 '</div></div></div>'
 '<div class="s09-right"><span class="t-caption">Season progress</span>'
 '<div class="s09-bar"><div class="s09-track cut cut-s"></div>'
 '<div class="s09-fill" style="width:16.7%"><div class="s09-done cut cut-s" style="flex:1"></div></div>'
 '</div></div></div>'
 '<div class="e03-qual"><a class="nav-a" href="stats.html">'
 '<div class="ctl-01-Button--ghost btn btn-ghost cut cut-s">'
 '<span class="lbl">Qualification tables</span>'
 '<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" xmlns="http://www.w3.org/2000/svg">'
 '<path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z"></path></svg>'
 '</div></a></div>'
 '</div>')

DOTS = ''.join('<div class="dot"></div>' for _ in range(6))
TAG = ('<div class="el-13-FederationTag--s-code ftag ftag-s cut cut-s ftag-plain">'
       '<div class="flag flag-s"></div>'
       '<div class="ftag-txt"><span class="ftag-code">GER</span></div></div>')

E03 = ('<div class="e03">'
 '<div class="e03-group">'
   '<div class="e03-region">Europe</div>'
   '<div class="e03-grid">'
     '<div class="e03-card cut cut-m cut-out"><div class="cutfill"></div>'
       '<div class="e03-top">'
         '<span class="e03-name">Europe-1 U23</span>'
         '<div class="el-05-StatusBadge--live badge badge-live cut cut-s"><span class="badge-dot"></span><span class="lbl">Live</span></div>'
       '</div>'
       '<div class="e03-meta">'
         '<div class="el-06-StopDots--live dots-wrap"><div class="dots">' + DOTS + '</div></div>'
         '<span class="t-caption e03-prog">0 of 6 stops</span>'
       '</div>'
       '<div class="e03-feds">' + TAG + '</div>'
     '</div>'
   '</div>'
 '</div>'
 '</div>')

f = 'conferences.html'
h = io.open(f, encoding='utf-8').read()
s = h.index('<div class="e03">')
e = close_div(h, s)
h = h[:s] + FINDER + S09_FULL + E03 + h[e:]
io.open(f, 'w', encoding='utf-8').write(h)
print('conferences.html rebuilt: finder + Overview + qualification link + per-conference cards')
