# -*- coding: utf-8 -*-
"""Markup pass: the real player card on the conference page, the finder
count in the section header, the qualification link, the players table,
and the About page's default section with a video placeholder.
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
SHINE = '<div class="pcard-shine"></div>'

# ── 1 · the specular layer belongs to every E-08 card -----------------
for f in ('team.html', 'system/_check/03b-modules-ranking.html', 'system/pages/modules-2.html'):
    h = io.open(f, encoding='utf-8').read()
    if 'pcard-shine' in h: continue
    n = h.count('<div class="cutfill"></div><div class="pcard-union">')
    h = h.replace('<div class="cutfill"></div><div class="pcard-union">',
                  '<div class="cutfill"></div>' + SHINE + '<div class="pcard-union">')
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append('%s — %d player cards gained the specular layer' % (f, n))

# ── 2 · conference page uses the real card ----------------------------
team = io.open('team.html', encoding='utf-8').read()
CARD = grab(team, '<div class="sh sh-e1 pcard-sh">')
CARD = CARD.replace(' style="width:340px"', '')          # the grid sizes it

f = 'conference.html'
h = io.open(f, encoding='utf-8').read()
if 'pcard-union' not in h:
    s = h.index('<div class="e10 e10-scorers">')
    e = close_div(h, s)
    h = h[:s] + '<div class="e10 e10-scorers">' + CARD + '</div>' + h[e:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append('conference.html — leading scorers use the real E-08 card')

# ── 3 · the finder / directory count moves into the section header ----
COUNT = ('<div class="finder-count"><span class="finder-nations">0</span>'
         '<span> nations</span><span class="finder-dot">·</span>'
         '<span class="finder-sites">0</span><span> team sites</span></div>')

for f in ('index.html', 'conferences.html'):
    h = io.open(f, encoding='utf-8').read()
    if '.el01 .finder-count' in h or 'el01-count' in h: continue
    i = h.index('>Find a team<')
    j = h.index('</div></div></div>', i)            # end of the el01 header
    if 'finder-count' not in h[i:j]:
        h = h[:j] + COUNT + h[j:]
        io.open(f, 'w', encoding='utf-8').write(h)
        log.append(f + ' — the nations / team-sites count sits with the headline')

# Teams page: the same treatment for E-09's count
f = 'teams.html'
h = io.open(f, encoding='utf-8').read()
if 'e09-count' in h and 'f04-idl' in h:
    cnt = grab(h, '<div class="e09-count')
    h = h.replace(cnt, '', 1)
    s = h.index('<div class="f04-idl">')
    e = close_div(h, s)
    h = h[:e] + '<div class="f04-ctl e09-count-slot">' + cnt + '</div>' + h[e:]
    # F-04 already has a control slot for the switch; keep one row
    h = h.replace('<div class="f04-ctl e09-count-slot">' + cnt + '</div><div class="f04-ctl">',
                  '<div class="f04-ctl">' + cnt, 1)
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append('teams.html — the federation count sits in F-04 beside the switch')

# ── 4 · Qualification tables is a link, not a button ------------------
f = 'conferences.html'
h = io.open(f, encoding='utf-8').read()
if 'btn-ghost' in h:
    old = grab(h, '<div class="ctl-01-Button--ghost')
    new = ('<div class="ctl-02-Link--default lnk"><span class="lbl">Qualification tables</span>'
           '<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" '
           'xmlns="http://www.w3.org/2000/svg"><path d="M686-450H160v-60h526L438-758l42-42 320 320'
           '-320 320-42-42 248-248Z"></path></svg></div>')
    h = h.replace(old, new, 1)
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append('conferences.html — Qualification tables is a ctl-02 Link, like Or browse all nations')

# ── 5 · players table: no flag beside the name, no podium rule --------
f = 'stats.html'
h = io.open(f, encoding='utf-8').read()
src = h
h = re.sub(r'(<div class="cell r05-pl"[^>]*>\s*<div class="el-24-Avatar[\s\S]*?</div>)\s*<div class="flag flag-ring">[\s\S]*?</div>\s*(<span class="team-name")',
           r'\1\2', h)
h = h.replace(' trow r05-pod"', ' trow"')
if h != src:
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append('stats.html — the player cell drops the flag beside the name; no podium rule')

# ── 6 · About: first section is the default, with a video placeholder --
f = 'about.html'
h = io.open(f, encoding='utf-8').read()
if 'c06-video' not in h:
    h = h.replace('<div class="c06-toc-i">What the Nations League is</div>'
                  '<div class="c06-toc-i c06-toc-on">How qualification works</div>',
                  '<div class="c06-toc-i c06-toc-on">What the Nations League is</div>'
                  '<div class="c06-toc-i">How qualification works</div>', 1)
    INTRO = ('<div class="c05-h2">What the Nations League is</div>'
      '<div class="c06-video cut cut-m">'
        '<button class="c06-play" type="button" aria-label="Play">'
          '<svg viewBox="0 -960 960 960" width="34" height="34" fill="currentColor" aria-hidden="true">'
          '<path d="M320-200v-560l440 280-440 280Z"></path></svg>'
        '</button>'
        '<span class="t-caption c06-vcap">Video · 16:9 placeholder</span>'
      '</div>'
      '<div class="c05-p">A development competition for players aged 19 to 23, played in '
      'conferences of six federations. Every federation that enters does so in both genders, '
      'and the season decides who reaches the FIBA 3x3 U23 World Cup.</div>')
    i = h.index('<div class="c06-main">') + len('<div class="c06-main">')
    h = h[:i] + INTRO + h[i:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append('about.html — What the Nations League is is the default section, with a video placeholder')

print('\n'.join(log))
