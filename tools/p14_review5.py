#!/usr/bin/env python3
"""Fifth round — 2026-08-26 (Daniel's second mark-up + the mobile list).

  A  assets      review5.css / mobile5.css / mobile5.js on every page,
                 and Court.svg copied in as assets/court.svg
  B  home        the hero lock is centred, the court sits behind it,
                 Photos loses the link that went nowhere, the advert
                 states a mobile size, and the split is named so the
                 phone can re-order it (Mota LP-09)
  C  chrome      the phone header carries the 3x3 mark and More is
                 three dots
  D  conferences the gender switch goes to the page head, the live
                 conference names itself over "city · stop · day",
                 and the section header drops the red dot
  E  calendar    All + today on arrival, with a Clear filter chip

The look of all of it is in assets/review5.css and assets/mobile5.css;
the phone behaviour is assets/mobile5.js. This script moves markup and
patches the two behaviour files.

Idempotent: every step is guarded.
    python3 tools/p14_review5.py && python3 tools/bump_assets.py
"""
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.dirname(ROOT)


def P(*a):
    return os.path.join(ROOT, *a)


def read(p):
    return open(P(p), encoding='utf-8').read()


def write(p, s):
    open(P(p), 'w', encoding='utf-8').write(s)


PAGES = [f for f in sorted(os.listdir(ROOT))
         if f.endswith('.html') and f not in ('qualification.html',)]

log = []


# ---------------------------------------------------------------- A  assets
def a_assets():
    src = os.path.join(SRC, 'Court.svg')
    dst = P('assets', 'court.svg')
    if os.path.exists(src):
        if not os.path.exists(dst) or open(src, 'rb').read() != open(dst, 'rb').read():
            shutil.copyfile(src, dst)
            log.append('assets/court.svg <- Court.svg')

    for f in PAGES:
        s = read(f)
        o = s
        if 'assets/review5.css' not in s:
            s = s.replace(
                '<link rel="stylesheet" href="assets/review4.css?v=',
                '<link rel="stylesheet" href="assets/review5.css?v=1">\n'
                '<link rel="stylesheet" href="assets/review4.css?v=', 1)
            # review5 must load AFTER review4: put it back in the right order
            s = s.replace(
                '<link rel="stylesheet" href="assets/review5.css?v=1">\n'
                '<link rel="stylesheet" href="assets/review4.css?v=',
                '<link rel="stylesheet" href="assets/review4.css?v=', 1)
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review4\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review5.css?v=1">', s, count=1)
        if 'assets/mobile5.css' not in s:
            s = re.sub(
                r'(<link href="assets/mobile\.css\?v=[^"]*" rel="stylesheet"/?>)',
                r'\1\n<link rel="stylesheet" href="assets/mobile5.css?v=1">', s, count=1)
        if 'assets/mobile5.js' not in s:
            s = re.sub(
                r'(<script defer src="assets/mobile\.js\?v=[^"]*"></script>)',
                r'\1\n<script defer src="assets/mobile5.js?v=1"></script>', s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review5 / mobile5 linked')


# ---------------------------------------------------------------- B  home
COURT = ('<img alt="" class="hnl-court" src="assets/court.svg" '
         'width="324" height="216" aria-hidden="true"/>')


def b_home():
    for f in PAGES:
        s = read(f)
        o = s
        # the court sits behind the type, above the gradient
        if 'hnl-court' not in s and '<div class="hnl">' in s:
            s = s.replace('<div class="hnl-in">', COURT + '<div class="hnl-in">', 1)
        # the phone re-orders this split, so it is named
        if 'home-split' not in s and 'class="hnl"' in s:
            s = s.replace('<div class="tpl-split"><div class="tpl-colL">',
                          '<div class="tpl-split home-split"><div class="tpl-colL">', 1)
        # the advert states a mobile size on a phone
        if 'ad-dim" data-m=' not in s:
            s = s.replace('<span class="ad-dim">1440 x 160</span>',
                          '<span class="ad-dim" data-m="320 x 100">1440 x 160</span>')
        if s != o:
            write(f, s)
            log.append(f + ': hero court / split name / advert size')

    # Photos: "All galleries" goes nowhere, so it goes — on every
    # page that carries a Photos section, not only the home page.
    for f in PAGES:
        s = read(f)
        m = re.search(
            r'<h2 class="t-h2">Photos</h2></div>(<a class="nav-a" href="[^"]*">'
            r'<div class="ctl-02-Link--default lnk"><span class="lbl">All galleries</span>'
            r'.*?</div></a>)', s, re.S)
        if m:
            write(f, s.replace(m.group(1), '', 1))
            log.append(f + ': Photos — All galleries removed')


# ---------------------------------------------------------------- C  chrome
MARK = ('<a class="f03m-mark" href="index.html" aria-label="FIBA 3x3">'
        '<svg fill="none" height="24" viewBox="0 0 80 34" width="56" '
        'xmlns="http://www.w3.org/2000/svg">'
        '<path clip-rule="evenodd" fill-rule="evenodd" fill="black" d="M25.163 0L23.2917 '
        '7.95861H26.4343L43.2322 34H53.4538L55.3256 26.0398H52.1836L35.3845 0H25.163ZM63.9565 '
        '0.0484524L62.1089 7.91191H66.1382L65.023 12.4962H59.7968L57.8626 20.8728H63.1423L61.9392 '
        '25.9927H57.8486L55.9772 33.9514H67.0969L73.5479 29.039L75.4797 20.9058L72.0453 '
        '16.7773L77.2904 12.5637L79.0909 5.01178L74.9615 0.0484524H63.9565ZM11.993 '
        '0.0484524L5.54165 4.961L3.69073 12.6324L7.12519 16.7611L1.87971 20.9736L0 28.9878L4.12933 '
        '33.951H15.1338L16.981 26.0883H12.9513L14.1494 21.0415H19.3748L21.3088 12.6651H16.0279L17.1509 '
        '8.00726H20.7301L22.6003 0.0484524H11.993ZM51.2025 0.0970993L43.0008 7.38186L48.1111 '
        '15.3066L56.3824 7.95861H59.5779L61.4245 0.0970993H51.2025ZM22.2347 26.0398H19.4861L17.6387 '
        '33.9033H27.4146L35.5767 26.596L30.4645 18.6716L22.2347 26.0398Z"></path></svg></a>')

BURGER = 'M120-240v-60h720v60H120Zm0-210v-60h720v60H120Zm0-210v-60h720v60H120Z'
DOTS = ('M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 '
        '33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 '
        '56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 '
        '23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z')


def c_chrome():
    s = read('assets/mobile.js')
    o = s
    if 'f03m-mark' not in s:
        s = s.replace(
            "var HEADER = `<div class=\"f03m mnav-bar-top\">",
            "var HEADER = `<div class=\"f03m mnav-bar-top\">" + MARK, 1)
    if BURGER in s:
        s = s.replace(BURGER, DOTS, 1)
    if s != o:
        write('assets/mobile.js', s)
        log.append('assets/mobile.js: 3x3 mark in the header, More is three dots')


# ---------------------------------------------------------------- D/E  site.js
def d_site():
    s = read('assets/site.js')
    o = s

    if 'Review 5 — 2026-08-26' not in s:
        s = s.replace(
            "  var YT_CHANNEL = 'UC7LpyJP5fupiJu2CdzRQheg';",
            "  /* ============================================================\n"
            "     Review 5 — 2026-08-26. Daniel's second mark-up.\n"
            "     ============================================================ */\n"
            "  var YT_CHANNEL = 'UC7LpyJP5fupiJu2CdzRQheg';", 1)

    # -- D1 the day belongs with the conference, not with the header
    old = """    (function () {
      var dt = new Date(today + 'T12:00:00');
      todayTxt.textContent = 'Today · ' +
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()] + ' ' +
        dt.getDate() + ' ' +
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
         'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()];
    })();"""
    new = """    /* Review 5: the day is stated under the conference that is
       playing rather than beside the section title, so it reads as
       "Singapore · Stop 6 · Wed 26 Aug". */
    var dayLine = '';
    (function () {
      var dt = new Date(today + 'T12:00:00');
      dayLine =
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()] + ' ' +
        dt.getDate() + ' ' +
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
         'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()];
      todayTxt.textContent = 'Today · ' + dayLine;
    })();"""
    if old in s:
        s = s.replace(old, new, 1)
        log.append('site.js: the day moves to the caption')

    old = """        cap.innerHTML =
          (isLive ? '<div class="el-05-StatusBadge--live badge badge-live cut cut-s">' +
                    '<span class="badge-dot"></span><span class="lbl">Live</span></div>' : '') +
          '<span class="sched-capname">' + (c ? confName(c) : ev.conference) + '</span>' +
          '<span class="t-body-s sched-capmeta">' + (ev.city || '') +
          ' · Stop ' + (ev.number || 1) + '</span>';"""
    new = """        cap.innerHTML =
          '<span class="sched-caphead">' +
          (isLive ? '<div class="el-05-StatusBadge--live badge badge-live cut cut-s">' +
                    '<span class="badge-dot"></span><span class="lbl">Live</span></div>' : '') +
          '<span class="sched-capname">' + (c ? confName(c) : ev.conference) +
          '</span></span>' +
          '<span class="t-body-s sched-capmeta">' + (ev.city || '') +
          ' · Stop ' + (ev.number || 1) + ' · ' + dayLine + '</span>';"""
    if old in s:
        s = s.replace(old, new, 1)
        log.append('site.js: the caption is two lines')

    # -- D2 a named stream plays that stream; otherwise the channel's live one
    old = """            'allowfullscreen src="https://www.youtube.com/embed/live_stream?channel=' +
            YT_CHANNEL + '&autoplay=1" title="FIBA 3x3 Nations League — live"></iframe>';"""
    new = """            'allowfullscreen src="' +
            (ev && ev.video
               ? 'https://www.youtube.com/embed/' + ev.video + '?autoplay=1'
               : 'https://www.youtube.com/embed/live_stream?channel=' +
                 YT_CHANNEL + '&autoplay=1') +
            '" title="FIBA 3x3 Nations League — live"></iframe>';"""
    if old in s:
        s = s.replace(old, new, 1)
        log.append('site.js: a stop may name its own video')

    # -- D3 the gender switch goes up to the page's headline row
    old = """    genderSwitch(function (g) { sex = g; paintList(); }, $('.sched-gender', wrap));"""
    new = """    /* Review 5: every other sub page carries the switch at the right
       end of the headline row, so this one does too. */
    var gsw = $('.sched-gender', wrap);
    var pageCtl = $('.f04-ctl');
    if (!pageCtl) {
      var pageRow = $('.f04-row');
      if (pageRow) { pageCtl = el('div', 'f04-ctl'); pageRow.appendChild(pageCtl); }
    }
    if (gsw && pageCtl) pageCtl.appendChild(gsw);
    genderSwitch(function (g) { sex = g; paintList(); }, gsw || wrap);"""
    if old in s:
        s = s.replace(old, new, 1)
        log.append('site.js: the conferences switch moves to the page head')

    # -- E the calendar opens on today, and Clear filter is the way out
    old = """    days = dayList();
    clampWin();
    region = chipFilter(function (r) {"""
    new = """    days = dayList();
    clampWin();

    /* Review 5: the page opens on All and on today, as the prototype
       does, and Clear filter is what returns the whole season. */
    function openOnToday() {
      var i = days.indexOf(iso(new Date()));
      sel = i;
      if (i > -1 && days.length > SLOTS) {
        win = Math.max(0, Math.min(i - Math.floor(SLOTS / 2), days.length - SLOTS));
      }
      clampWin();
    }
    openOnToday();

    region = chipFilter(function (r) {"""
    if old in s:
        s = s.replace(old, new, 1)
        log.append('site.js: the calendar opens on today')

    old = """    searchField($('.cal-find') || document, 'Search a stop, city or federation',
                function (q) { query = q; drawList(); });
    drawStrip();
    drawList();"""
    new = """    var setQuery = searchField($('.cal-find') || document,
                'Search a stop, city or federation',
                function (q) { query = q; drawList(); });

    /* The chips and the reset share one row: chips from the left,
       Clear filter at the right end, both at the chips' height. */
    (function () {
      var chips = $('.el03');
      if (!chips || chips.closest('.cal-bar')) return;
      var bar = el('div', 'cal-bar');
      chips.parentNode.insertBefore(bar, chips);
      bar.appendChild(chips);
      var b = el('button', 'cal-clear',
        '<span>Clear filter</span>' +
        '<svg fill="currentColor" height="16" viewBox="0 -960 960 960" width="16" ' +
        'aria-hidden="true"><path d="m251-160-91-91 229-229-229-229 91-91 229 229 229-229 ' +
        '91 91-229 229 229 229-91 91-229-229Z"></path></svg>');
      b.type = 'button';
      b.setAttribute('aria-label', 'Clear every filter');
      b.addEventListener('click', function () {
        region = 'All';
        sel = -1;
        win = 0;
        query = '';
        days = dayList();
        clampWin();
        $$('.chip', chips).forEach(function (c, i) {
          c.classList.toggle('chip-on', i === 0);
        });
        var inp = $('.cal-find input') || $('.search input');
        if (inp && inp.value) {
          inp.value = '';
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        query = '';
        drawStrip();
        drawList();
      });
      bar.appendChild(b);
    })();

    drawStrip();
    drawList();"""
    if old in s:
        s = s.replace(old, new, 1)
        log.append('site.js: Clear filter on the calendar')

    if s != o:
        write('assets/site.js', s)


# ------------------------------------------------------- F  the stream
def f_video():
    """The live stop names the video its poster already came from.

    The production mechanism is the channel's own live embed —
    embed/live_stream?channel=UC7LpyJP5fupiJu2CdzRQheg — which
    resolves to whatever FIBA3x3 is broadcasting and needs no link
    from anyone. It renders nothing when the channel is off air,
    which on a prototype is every day, so the stop the demo calls
    live also names a video and site.js prefers it.
    """
    import json
    path = P('assets', 'data', 'events.json')
    d = json.load(open(path, encoding='utf-8'))
    hit = False
    for e in d:
        if e.get('poster') and not e.get('video'):
            m = re.search(r'/vi/([A-Za-z0-9_-]{6,})/', e['poster'])
            if m:
                e['video'] = m.group(1)
                hit = True
    if hit:
        json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False)
        log.append('assets/data/events.json: the live stop names its video')


a_assets()
b_home()
c_chrome()
d_site()
f_video()

print('\n'.join(log) if log else 'nothing to do — already applied')
