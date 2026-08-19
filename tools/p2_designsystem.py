# -*- coding: utf-8 -*-
"""Design system: S-09 becomes Overview and gains a type axis, F-04 gains
a control slot, E-04 gives the gender switch up to F-04.

Both copies are edited — system/_check/*.html is the specimen and
system/pages/*.html is the published page.
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

def block(h, opentag, frm=0):
    s = h.find(opentag, frm)
    if s == -1: return None, None, None
    e = close_div(h, s)
    return h[s:e], s, e

EL02 = ('<div class="el-02-GenderSwitch--men el02 el02-s">'
        '<div class="el02-seg cut cut-s el02-on cut-out"><div class="cutfill"></div><span class="lbl">Men</span></div>'
        '<div class="el02-seg cut cut-s cut-out"><div class="cutfill"></div><span class="lbl">Women</span></div>'
        '</div>')

S09_PURPOSE = ('Where the season stands, as the first block of a page. Two <b>types</b>: '
  '<b>conferences</b> alone, which is what the landing page carries, and '
  '<b>conferences and stops worldwide</b>, which belongs on the Conferences page. '
  'Each line is written as total then breakdown — <b>18 Conferences — 0 finished — 18 to go — 1 live</b> '
  '— with a progress bar beside it so the same figures can also be read as a proportion. '
  'Named <b>Season status</b> until 18 August 2026.')

S09_NOTE = ('<div class="el-note cut cut-s"><div class="t-label">Note</div><div class="t-body-s">'
  'Two axes, not one list: the <b>type</b> decides which lines are shown, the state '
  'decides what the figures say. The split exists because the review pulled in two '
  'directions — LP-10 asked for the 18 Conferences / 108 Stops block to come off the '
  'landing page, while slide 8 of the written feedback asks for exactly those counters. '
  'The conferences type answers the landing page, the full type answers the Conferences '
  'page, and both requests are met without a compromise in the middle.'
  '</div></div>')

F04_PURPOSE_ADD = (' Since 18 August 2026 the row is split: an identity column on the left — '
  'H1 with the page context under it — and a control slot on the right. One control lives '
  'there, el-02 GenderSwitch, on every page that scopes its content by gender, so the '
  'switch is at the same coordinates on every screen instead of travelling between filter '
  'rows.')

log = []

# ---------------------------------------------------------------- S-09
for f in ('system/_check/03a-modules-frame.html', 'system/pages/modules-1.html'):
    h = io.open(f, encoding='utf-8').read()
    src = h
    i = h.index('S-09 SeasonStatus')
    # the full-type markup, taken from the existing mid-season state
    full, _, _ = block(h, '<div class="s09 ', i)
    conf_only = re.sub(r'<div class="s09-line"><span class="s09-lab">Stops worldwide</span>.*?</div></div></div>',
                       '</div>', full, flags=re.S)
    conf_only = conf_only.replace('<div class="s09 ', '<div class="s09 s09-conf ', 1)
    if 's09-conf' not in conf_only or 'Stops worldwide' in conf_only:
        print('!! could not derive the conferences-only markup in', f); continue

    states = ('<div class="m-state"><div class="t-caption el-state-label">'
              'type = conferences — the landing page</div>'
              '<div class="S-09-Overview--type-conferences m-frame live">' + conf_only + '</div></div>'
              '<div class="m-state"><div class="t-caption el-state-label">'
              'type = conferences and stops — the Conferences page</div>'
              '<div class="S-09-Overview--type-conferences-and-stops m-frame live">' + full + '</div></div>')

    h = h.replace('S-09 SeasonStatus', 'S-09 Overview')
    h = h.replace('S-09-SeasonStatus--', 'S-09-Overview--')
    h = h.replace('s-09-seasonstatus', 's-09-overview')
    old_purpose = re.search(r'(<div class="ds-name">S-09 Overview</div><div class="t-body-s el-purpose">)(.*?)(</div>)', h, re.S)
    h = h[:old_purpose.start(2)] + S09_PURPOSE + h[old_purpose.end(2):]
    j = h.index('<div class="m-states">', h.index('S-09 Overview'))
    h = h[:j + len('<div class="m-states">')] + states + h[j + len('<div class="m-states">'):]
    # a note after the module's states
    k = h.index('</section>', h.index('S-09 Overview'))
    h = h[:k] + S09_NOTE + h[k:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append(f + ' — S-09 renamed to Overview, two types added')

# ---------------------------------------------------------------- F-04
for f in ('system/_check/02-elements.html', 'system/_check/03a-modules-frame.html', 'system/pages/elements.html', 'system/pages/modules-1.html'):
    h = io.open(f, encoding='utf-8').read()
    if 'F-04 SubHeader' not in h: continue
    i = h.index('F-04 SubHeader')
    # borrow the chevron from the existing breadcrumb
    crumbs, _, _ = block(h, '<div class="f04-crumbs">', i)
    if not crumbs: continue
    chev = re.search(r'<svg[\s\S]*?</svg>', crumbs)
    chev = chev.group(0) if chev else ''
    new = ('<div class="m-state"><div class="t-caption el-state-label">'
           'height 96 · with a control — every page that scopes by gender</div>'
           '<div class="F-04-SubHeader--height-96-control m-frame live">'
           '<div class="f04 f04-96"><div class="f04-crumbs">'
           '<span class="t-caption">Home</span>' + chev +
           '<span class="t-caption">Conferences</span>' + chev +
           '<span class="t-caption">Africa East U23</span></div>'
           '<div class="f04-row"><div class="f04-idl">'
           '<div class="f04-h1-m">Africa East U23</div>'
           '<div class="t-body-s">Mombasa · 1 Jul – 7 Jul</div></div>'
           '<div class="f04-ctl">' + EL02 + '</div></div></div>'
           '</div></div>')
    if 'F-04-SubHeader--height-96-control' not in h:
        j = h.index('<div class="m-states">', i)
        h = h[:j + len('<div class="m-states">')] + new + h[j + len('<div class="m-states">'):]
    p = re.search(r'(<div class="ds-name">F-04 SubHeader</div><div class="t-body-s el-purpose">)(.*?)(</div>)', h, re.S)
    if p and 'control slot' not in p.group(2):
        h = h[:p.end(2)] + F04_PURPOSE_ADD + h[p.end(2):]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append(f + ' — F-04 control-slot state added')

# ---------------------------------------------------------------- E-04
for f in ('system/_check/03b-modules-ranking.html', 'system/pages/modules-2.html'):
    h = io.open(f, encoding='utf-8').read()
    if 'E-04 TeamHeader' not in h: continue
    a = h.index('E-04 TeamHeader')
    b = h.index('E-05 PlayerHeader') if 'E-05 PlayerHeader' in h else len(h)
    seg = h[a:b]
    n = 0
    while '<div class="el-02-GenderSwitch' in seg:
        blk, s, e = block(seg, '<div class="el-02-GenderSwitch')
        seg = seg[:s] + seg[e:]; n += 1
    seg = seg.replace('The gender switch sits in the same place it occupies on every other page.',
        'The gender switch is not part of this module: it lives in F-04 SubHeader’s control '
        'slot, at the same coordinates as on every other page, so a team page and a standings '
        'page put it in exactly the same spot.')
    h = h[:a] + seg + h[b:]
    io.open(f, 'w', encoding='utf-8').write(h)
    log.append(f + ' — E-04 gave up %d gender switches to F-04' % n)

# ------------------------------------------------------- 04-templates
f = 'system/_check/04-templates.html'
h = io.open(f, encoding='utf-8').read()
h = h.replace('>Season status<', '>Overview<')
full, s, e = block(h, '<div class="s09 ')
if full:
    conf_only = re.sub(r'<div class="s09-line"><span class="s09-lab">Stops worldwide</span>.*?</div></div></div>',
                       '</div>', full, flags=re.S).replace('<div class="s09 ', '<div class="s09 s09-conf ', 1)
    h = h[:s] + conf_only + h[e:]
io.open(f, 'w', encoding='utf-8').write(h)
log.append(f + ' — template preview follows the landing page')

print('\n'.join(log))
