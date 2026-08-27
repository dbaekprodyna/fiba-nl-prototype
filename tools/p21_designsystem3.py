#!/usr/bin/env python3
"""Round eleven, the design-system half — 2026-08-27.

The prototype has had eight rounds of mark-up since the design system
was last touched, and the two had drifted apart in one specific way:
system/index.html and the six _check sheets load review3.css and
review4.css and stop there. Every decision taken in rounds five to
eleven — the corner-cut outline button, the shared video frame, the
scroll reveal, the player card's key visual coming forward, the new
avatar bed — is in review5.css … review11.css, so the specimens were
showing the components as they were three weeks ago while the live
pages showed them as they are.

  A  every design-system page loads the same stylesheets as a page
     of the prototype does, in the same order.
  B  E-08 PlayerCard's anatomy is re-labelled: the key visual is a
     layer over the portrait, not part of the background.
  C  S-13 Countdown is added to Modules · Frame & Schedule.

Idempotent.
    python3 tools/p21_designsystem3.py && python3 tools/bump_assets.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def P(*a):
    return os.path.join(ROOT, *a)


def read(p):
    return open(P(p), encoding='utf-8').read()


def write(p, s):
    open(P(p), 'w', encoding='utf-8').write(s)


ROUNDS = ['review5', 'review6', 'review7', 'review8', 'review9',
          'review10', 'review11']

log = []


# ---------------------------------------------------------------- A
def a_stylesheets():
    """review5 … review11, after review4, everywhere the system renders.

    Only the desktop sheets. mobile*.css is written against the
    prototype's own page frame — a fixed tab bar, a hero band, a
    content column with no documentation shell around it — and the
    system's shell is none of those things. The specimens are read at
    desktop width; that is the width they are documented at.
    """
    targets = [('system/index.html', '../assets/')]
    for f in sorted(os.listdir(P('system/_check'))):
        if f.endswith('.html'):
            targets.append(('system/_check/' + f, '../../assets/'))

    for path, pre in targets:
        s = read(path)
        o = s
        for i, r in enumerate(ROUNDS):
            if pre + r + '.css' in s:
                continue
            prev = ROUNDS[i - 1] if i else 'review4'
            pat = re.compile(
                r'(<link[^>]*href="' + re.escape(pre + prev) +
                r'\.css\?v=[^"]*"[^>]*>)')
            m = pat.search(s)
            if not m:
                log.append(path + ': ' + prev + ' link not found — ' + r + ' skipped')
                continue
            s = (s[:m.end()] +
                 '\n<link rel="stylesheet" href="' + pre + r + '.css?v=1">' +
                 s[m.end():])
        if s != o:
            write(path, s)
            log.append(path + ': review5-11 linked')

    # review11.js drives the S-13 specimen's clock and nothing else on
    # these pages, so it rides with app.js.
    for path, pre in targets:
        s = read(path)
        if pre + 'review11.js' in s:
            continue
        m = re.search(r'<script[^>]*src="' + re.escape(pre) +
                      r'app\.js\?v=[^"]*"[^>]*></script>', s)
        if not m:
            log.append(path + ': app.js not found — review11.js skipped')
            continue
        s = (s[:m.end()] +
             '\n<script defer src="' + pre + 'review11.js?v=1"></script>' +
             s[m.end():])
        write(path, s)
        log.append(path + ': review11.js linked')


def _move_kv(s):
    """Cut .pcard-kv out of anatomy card 1 and paste it into card 2."""
    i = s.find('1 \u00b7 Background')
    if i < 0:
        return s
    j = s.find('2 \u00b7 Cut-out portrait', i)
    if j < 0:
        return s
    k = s.find('3 \u00b7 Stat column', j)
    if k < 0:
        k = len(s)
    if s.count('<div class="pcard-kv">', j, k):
        return s                              # already moved
    a = s.find('<div class="pcard-kv">', i, j)
    if a < 0:
        return s
    b = s.find('</svg></div></div>', a)
    if b < 0:
        return s
    b += len('</svg></div></div>')
    kv = s[a:b]
    s = s[:a] + s[b:]
    # indices after a shorter string
    j = s.find('2 \u00b7 Cut-out portrait')
    shot = s.find('<div class="pcard-shot"', j)
    if shot < 0:
        return s
    end = s.find('</div></div></div>', shot)
    if end < 0:
        return s
    end += len('</div></div>')          # close .pcard-silhouette and .pcard-shot
    return s[:end] + kv + s[end:]


# ---------------------------------------------------------------- B
def b_playercard_anatomy():
    """The card's anatomy diagram, re-labelled and re-stacked.

    Layer 1 was "the gradient, the Union mark, then the key-visual
    element over both". The key visual is not in the background any
    more — it is drawn over the portrait — so the diagram says the
    background is the gradient and the Union mark, and the portrait
    layer carries the key visual on top of the cut-out.
    """
    old_copy = ('Gradient #253C97 to #253AFF, the Union mark top right at 50%, '
                'then the key-visual element over both at full colour. '
                'Replaceable with any image.')
    new_copy = ('Gradient #253C97 to #253AFF with the Union mark top right at '
                '50%. The key-visual element is no longer part of this layer. '
                'Replaceable with any image.')
    old_shot = ('The photograph, or the silhouette where the feed has none, '
                'bottom aligned')
    for f in ('system/pages/modules-2.html', 'system/_check/03b-modules-ranking.html'):
        if not os.path.exists(P(f)):
            continue
        s = read(f)
        o = s
        s = s.replace(old_copy, new_copy)
        # The diagram is four cards, each showing one layer. The key
        # visual is drawn in card 1; it has to be cut out of it and
        # dropped into card 2, on top of the cut-out, which is where
        # it is on the real card now.
        s = _move_kv(s)
        if '2 \u00b7 Cut-out portrait</div>' in s:
            s = s.replace('2 \u00b7 Cut-out portrait</div>',
                          '2 \u00b7 Cut-out portrait <span class="pcard-anat-kv">'
                          '+ key visual</span></div>')
        s = s.replace(
            'Torso with the background removed, produced automatically from '
            'the supplied headshot.',
            'Torso with the background removed, produced automatically from '
            'the supplied headshot \u2014 and the key-visual element over it, '
            'crossing the shoulder. Behind the portrait the mark was never '
            'seen: the cut-out is widest exactly where it is drawn.')
        if s != o:
            write(f, s)
            log.append(f + ': E-08 anatomy re-labelled')


# ---------------------------------------------------------------- C
S13_SPEC = '''<section class="anchor" id="s-13-countdown" data-anchor="s-13-countdown"><section class="el-block">
<div class="el-head"><div class="ds-name">S-13 Countdown</div><div class="t-body-s el-purpose">The block for a page with nothing to report yet: the league between seasons, or a sibling competition — World Tour, Women&#39;s Series — whose next stop is the whole story of the page. Four counters, each in its own cut surface, in Barlow Condensed with tabular figures so the seconds do not shuffle the row as they tick. There is no colon between them: the counters carry the corner cut, which is a clip-path, and a clip-path clips whatever a child paints outside its own box \u2014 which is exactly where a separator would have to sit. Four labelled surfaces in a row read as a clock without one. At zero the counters are replaced by the live badge every other surface on the site uses — a countdown that has run out is not a row of noughts.</div></div>
<div class="el-states-col">
<div class="el-state"><div class="t-caption el-state-label">variant = default — on the page surface, between seasons</div><div class="S-13-Countdown--default s13 cut cut-l"><div class="s13-head"><div class="s13-eyebrow"><span>Season 2027</span></div><div class="s13-t">Nations League returns</div><div class="s13-sub">Conference 1 opens in Manila &middot; 12 June 2027</div></div><div class="s13-units"><div class="s13-u cut cut-s"><span class="s13-v">288</span><span class="s13-k">Days</span></div><div class="s13-u cut cut-s"><span class="s13-v">14</span><span class="s13-k">Hours</span></div><div class="s13-u cut cut-s"><span class="s13-v">06</span><span class="s13-k">Minutes</span></div><div class="s13-u cut cut-s"><span class="s13-v">52</span><span class="s13-k">Seconds</span></div></div><div class="s13-live"><div class="el-05-StatusBadge--live badge badge-live cut cut-s"><span class="badge-dot"></span><span class="lbl">Live</span></div><span class="t-body-m">Conference 1 is being played now</span></div><div class="s13-foot"><a class="nav-a" href="#"><div class="ctl-02-Link--default lnk"><span class="lbl">Full season calendar</span><svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z"></path></svg></div></a><a class="nav-a" href="#"><div class="ctl-02-Link--default lnk"><span class="lbl">How qualification works</span><svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z"></path></svg></div></a></div></div></div>
<div class="el-state"><div class="t-caption el-state-label">variant = brand — on the NL gradient, for a hero band</div><div class="S-13-Countdown--brand s13 s13-brand cut cut-l"><div class="s13-head"><div class="s13-eyebrow"><span>FIBA 3x3 World Tour 2026</span></div><div class="s13-t">Next stop &middot; Debrecen</div><div class="s13-sub">Debrecen, Hungary &middot; 5&ndash;6 September 2026</div></div><div class="s13-units"><div class="s13-u cut cut-s"><span class="s13-v">9</span><span class="s13-k">Days</span></div><div class="s13-u cut cut-s"><span class="s13-v">03</span><span class="s13-k">Hours</span></div><div class="s13-u cut cut-s"><span class="s13-v">41</span><span class="s13-k">Minutes</span></div><div class="s13-u cut cut-s"><span class="s13-v">18</span><span class="s13-k">Seconds</span></div></div><div class="s13-live"><div class="el-05-StatusBadge--live badge badge-live cut cut-s"><span class="badge-dot"></span><span class="lbl">Live</span></div><span class="t-body-m">Debrecen is being played now</span></div><div class="s13-foot"><a class="nav-a" href="#"><div class="ctl-02-Link--default lnk"><span class="lbl">Event page</span><svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z"></path></svg></div></a></div></div></div>
<div class="el-state"><div class="t-caption el-state-label">variant = compact — a strip inside a card, e.g. Women&#39;s Series</div><div class="S-13-Countdown--compact s13 s13-compact cut cut-m"><div class="s13-head"><div class="s13-t">Women&#39;s Series &middot; Quito</div><div class="s13-sub">18 September 2026</div></div><div class="s13-units"><div class="s13-u cut cut-s"><span class="s13-v">22</span><span class="s13-k">D</span></div><div class="s13-u cut cut-s"><span class="s13-v">07</span><span class="s13-k">H</span></div><div class="s13-u cut cut-s"><span class="s13-v">14</span><span class="s13-k">M</span></div><div class="s13-u cut cut-s"><span class="s13-v">03</span><span class="s13-k">S</span></div></div><div class="s13-live"><div class="el-05-StatusBadge--live badge badge-live cut cut-s"><span class="badge-dot"></span><span class="lbl">Live</span></div></div></div></div>
<div class="el-state"><div class="t-caption el-state-label">state = reached zero — the counters go, the badge takes over</div><div class="S-13-Countdown--live s13 s13-on cut cut-l"><div class="s13-head"><div class="s13-eyebrow"><span>FIBA 3x3 World Tour 2026</span></div><div class="s13-t">Debrecen</div><div class="s13-sub">Debrecen, Hungary &middot; 5&ndash;6 September 2026</div></div><div class="s13-units"><div class="s13-u cut cut-s"><span class="s13-v">0</span><span class="s13-k">Days</span></div><div class="s13-u cut cut-s"><span class="s13-v">00</span><span class="s13-k">Hours</span></div><div class="s13-u cut cut-s"><span class="s13-v">00</span><span class="s13-k">Minutes</span></div><div class="s13-u cut cut-s"><span class="s13-v">00</span><span class="s13-k">Seconds</span></div></div><div class="s13-live"><div class="el-05-StatusBadge--live badge badge-live cut cut-s"><span class="badge-dot"></span><span class="lbl">Live</span></div><span class="t-body-m">Debrecen is being played now</span></div><div class="s13-foot"><a class="nav-a" href="#"><div class="ctl-02-Link--default lnk"><span class="lbl">Watch the stream</span><svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z"></path></svg></div></a></div></div></div>
</div>
<div class="live-demo"><div class="t-caption live-demo-label">Live demo — this one is counting. data-until carries the target in ISO; review11.js ticks every countdown on the page.</div><div class="live live-stage"><div class="S-13-Countdown--default s13 cut cut-l" data-until="2027-06-12T10:00:00Z"><div class="s13-head"><div class="s13-eyebrow"><span>Season 2027</span></div><div class="s13-t">Nations League returns</div><div class="s13-sub">Conference 1 opens in Manila &middot; 12 June 2027</div></div><div class="s13-units"><div class="s13-u cut cut-s"><span class="s13-v">&mdash;</span><span class="s13-k">Days</span></div><div class="s13-u cut cut-s"><span class="s13-v">&mdash;</span><span class="s13-k">Hours</span></div><div class="s13-u cut cut-s"><span class="s13-v">&mdash;</span><span class="s13-k">Minutes</span></div><div class="s13-u cut cut-s"><span class="s13-v">&mdash;</span><span class="s13-k">Seconds</span></div></div><div class="s13-live"><div class="el-05-StatusBadge--live badge badge-live cut cut-s"><span class="badge-dot"></span><span class="lbl">Live</span></div><span class="t-body-m">Conference 1 is being played now</span></div><div class="s13-foot"><a class="nav-a" href="#"><div class="ctl-02-Link--default lnk"><span class="lbl">Full season calendar</span><svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z"></path></svg></div></a></div></div></div></div>
</section></section>
'''

S13_NAV = {
    "slug": "s-13-countdown",
    "title": "S-13 Countdown",
    "desc": ("The block for a page with nothing to report yet — the league "
             "between seasons, or a World Tour / Women's Series stop that "
             "has not started. Four counters, a brand variant for a hero "
             "band, a compact strip, and a zero state that hands over to "
             "the live badge.")
}


def c_countdown():
    page = 'system/pages/modules-1.html'
    s = read(page)
    if 's-13-countdown' not in s:
        write(page, s.rstrip('\n') + '\n' + S13_SPEC)
        log.append(page + ': S-13 Countdown specimen added')

    chk = 'system/_check/03a-modules-frame.html'
    if os.path.exists(P(chk)):
        s = read(chk)
        if 's-13-countdown' not in s:
            i = s.rfind('</body>')
            if i > 0:
                s = s[:i] + S13_SPEC + s[i:]
                write(chk, s)
                log.append(chk + ': S-13 Countdown specimen added')

    nav = json.load(open(P('system/nav.json'), encoding='utf-8'))
    for g in nav:
        if g['id'] != 'modules-1':
            continue
        if any(i['slug'] == S13_NAV['slug'] for i in g['items']):
            break
        g['items'].append(S13_NAV)
        with open(P('system/nav.json'), 'w', encoding='utf-8') as fh:
            json.dump(nav, fh, indent=1, ensure_ascii=False)
            fh.write('\n')
        log.append('system/nav.json: S-13 Countdown listed')
        break


for fn in (a_stylesheets, b_playercard_anatomy, c_countdown):
    fn()

print('\n'.join(log) if log else 'nothing to do')
