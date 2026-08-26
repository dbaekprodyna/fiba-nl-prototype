#!/usr/bin/env python3
"""Sixth round — 2026-08-26 (Daniel's third mark-up).

  A  assets      review6.css / mobile6.css / mobile6.js on every page
  B  system      the three changes that belong to the design system
                 rather than to this round: ctl-03 Tab's gutter,
                 F-03m's elevation and left-aligned word mark, and
                 the cut outline a <button> can carry
  C  site.js     one video frame shared by the schedule module and
                 the two stop views; Schedule and Results as one
                 control with two positions; the period select on
                 the conference's own meta line; Clear filter that
                 leaves when there is nothing to clear; a live
                 conference marking its Stops tab; and the Photos
                 block no longer forcing itself out of a hidden pane
  D  mobile.js   the More sheet: About Nations League is a link and
                 the external mark is an icon

Idempotent: every step is guarded.
    python3 tools/p15_review6.py && python3 tools/bump_assets.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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
    for f in PAGES:
        s = read(f)
        o = s
        if 'assets/review6.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review5\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review6.css?v=1">', s, count=1)
        if 'assets/mobile6.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/mobile5\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/mobile6.css?v=1">', s, count=1)
        if 'assets/mobile6.js' not in s:
            s = re.sub(
                r'(<script defer src="assets/mobile5\.js\?v=[^"]*"></script>)',
                r'\1\n<script defer src="assets/mobile6.js?v=1"></script>', s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review6 / mobile6 linked')


# ---------------------------------------------------------------- B  system
def b_system():
    """The three lines of this round that are the system's, not the round's.

    They go into the generated core files so the spec sheet in
    system/_check shows what the pages show — a change parked in a
    review layer is a change the design system does not know about.
    """
    s = read('assets/elements.css')
    if '/* Review 6: ctl-03 Tab' not in s:
        s = s.replace(
            ".tab {\n  display:flex;\n  align-items:center;\n  height:44px;\n  padding:0 20px;",
            "/* Review 6: ctl-03 Tab carries a 72px gutter — three times the 24\n"
            "   review 3 gave it. Two or three tabs with a label's width of\n"
            "   padding read as a row of pills; the strip is a navigation band\n"
            "   and it is sized like one. The phone keeps a narrow gutter, where\n"
            "   the tabs share the width between them instead. */\n"
            ".tab {\n  display:flex;\n  align-items:center;\n  height:44px;\n  padding:0 72px;", 1)
        write('assets/elements.css', s)
        log.append('elements.css: ctl-03 Tab gutter 20 -> 72')

    m = read('assets/modules.css')
    if '/* Review 6: F-03m' not in m:
        m = m.replace(
            ".f03m {\n  display:flex;\n  flex-direction:row;\n  align-items:center;\n"
            "  justify-content:space-between;",
            "/* Review 6: F-03m reads from the left, the way F-03 does — the\n"
            "   mark, then the word mark beside it, and the search at the far\n"
            "   end. And the bar is fixed over the page, so it carries e1. */\n"
            ".f03m {\n  display:flex;\n  flex-direction:row;\n  align-items:center;\n"
            "  justify-content:flex-start;\n"
            "  box-shadow:0 1px 2px rgba(0,0,0,.15);", 1)
        m = m.replace(
            ".f03m-l {",
            ".f03m > .f03m-search { margin-left:auto; }\n.f03m-l {", 1)
        write('assets/modules.css', m)
        log.append('modules.css: F-03m left-aligned + e1')

    b = read('assets/base.css')
    if '.cutbtn' not in b:
        b += """

/* A cut control that cannot hold a .cutfill child -----------------
   clip-path removes the corner from the border along with the rest
   of the box, so a 1px outline drawn with `border` shows nothing on
   the two 45 degree edges. Everywhere the mark-up allows it the
   system solves this with el-00 CutSurface: the outline is the
   element's own background and a .cutfill layer covers all of it
   except the ring. A <button> built by script has no room for that
   child, so the same construction is offered as one class with the
   fill on ::before.

   --cutic is the inner cut: --cutc minus 0.586 x the border, the
   figure .cut-out derives for every cut-out in the system.       */
.cutbtn {
  position:relative;
  border:1px solid transparent;
  background:var(--cutline,var(--border-default));
  --cutc:8px;
  --cutic:7.414px;
  clip-path:polygon(var(--cutc) 0,100% 0,100% calc(100% - var(--cutc)),calc(100% - var(--cutc)) 100%,0 100%,0 var(--cutc));
}
.cutbtn::before {
  content:'';
  position:absolute;
  left:0;
  top:0;
  right:0;
  bottom:0;
  background:var(--cutfillc,var(--surface-page));
  clip-path:polygon(var(--cutic) 0,100% 0,100% calc(100% - var(--cutic)),calc(100% - var(--cutic)) 100%,0 100%,0 var(--cutic));
}
.cutbtn > * {
  position:relative;
}
"""
        write('assets/base.css', b)
        log.append('base.css: .cutbtn — the cut outline a button can carry')


# ---------------------------------------------------------------- C  site.js
def c_site():
    s = read('assets/site.js')
    o = s

    # -- C1  the Photos block stops forcing itself out of a hidden pane
    old = """  function paintPhotos(list) {
    var host = $('.car');
    var block = host && host.closest('.tpl-sub');"""
    new = """  function paintPhotos(list) {
    var host = $('.car');
    var block = host && host.closest('.tpl-sub');
    /* Review 6: the gallery is in the Overview pane. It used to set
       block.hidden = false on every repaint, so changing the gender
       while the Stops tab was open pulled Photos back out of the
       hidden pane — and being the pane's last block, it landed above
       everything the Stops tab was showing. A block only un-hides
       into the pane that is actually on. */
    if (block && block.dataset.pane) {
      var onTab = $('.tab.tab-active');
      if (onTab && onTab.dataset.tab !== block.dataset.pane) return;
    }"""
    if 'Review 6: the gallery is in the Overview pane' not in s:
        s = s.replace(old, new, 1)
        log.append('site.js: Photos stays inside its own tab pane')

    # -- C2  Schedule and Results are one control with two positions
    old = """      function toggle() {
        var on = b.classList.toggle('is-open');
        h.setAttribute('aria-expanded', on ? 'true' : 'false');
      }"""
    new = """      function toggle() {
        var on = b.classList.toggle('is-open');
        h.setAttribute('aria-expanded', on ? 'true' : 'false');
        /* Review 6: Schedule and Results answer the same question at
           two ends of the day. Opening one folds the other, so the
           column always shows one list rather than two or none. */
        if (on && b.parentNode) {
          $$('.sched-acc', b.parentNode).forEach(function (x) {
            if (x === b || !x.classList.contains('is-open')) return;
            x.classList.remove('is-open');
            var xh = $('.sched-acc-h', x);
            if (xh) xh.setAttribute('aria-expanded', 'false');
          });
        }
      }"""
    if 'Review 6: Schedule and Results answer' not in s:
        s = s.replace(old, new, 1)
        log.append('site.js: Schedule / Results open one at a time')

    # -- C3  the period select drops onto the conference's meta line
    old = """    split.appendChild(vid);
    split.appendChild(side);
    wrap.appendChild(split);"""
    new = """    split.appendChild(vid);
    split.appendChild(side);
    wrap.appendChild(split);

    /* Review 6: the period select sat beside the word "Schedule".
       What it filters is the conference named under it, so it moves
       into the split, where the grid drops it to the foot of the
       caption row — level with "Singapore · Stop 6 · Wed 26 Aug". */
    var per = $('.sched-period', wrap);
    if (per) split.appendChild(per);"""
    if 'Review 6: the period select sat beside' not in s:
        s = s.replace(old, new, 1)
        log.append('site.js: the period select moves onto the meta line')

    # -- C4  Clear filter leaves when there is nothing to clear
    old = """      bar.appendChild(b);
    })();"""
    new = """      /* Review 6: it is a switched-on control, so it is only there
         while something is switched on. Every redraw re-asks whether
         the page is still narrowed; clearing it puts the page back to
         All and to the whole season and the button goes with it. */
      function syncClear() {
        b.hidden = (!region || region === 'All') && sel < 0 && !query;
      }
      var _strip = drawStrip, _list = drawList;
      drawStrip = function () { _strip(); syncClear(); };
      drawList = function () { _list(); syncClear(); };
      syncClear();
      bar.appendChild(b);
    })();"""
    if 'Review 6: it is a switched-on control' not in s:
        s = s.replace(old, new, 1)
        log.append('site.js: Clear filter appears only while a filter is set')

    # -- C5  conference detail: the stop shows its stream
    old = """      var lnk = $('.cnf-stop-link');
      if (lnk) lnk.setAttribute('href', 'stop.html?id=' + e.slug);"""
    new = """      var lnk = $('.cnf-stop-link');
      if (lnk) lnk.setAttribute('href', 'stop.html?id=' + e.slug);
      /* Review 6: a stop that is being played, or has been, has a
         stream. It goes beside the podium rather than under it. */
      stopStream($('.cnf-stop'), e, today, '.cnf-stop-podium');"""
    if "stopStream($('.cnf-stop')" not in s:
        s = s.replace(old, new, 1)
        log.append('site.js: conference detail — the stop names its stream')

    # -- C6  conference detail: a live conference marks its Stops tab
    old = """    genderSwitch(function (g) { gender = g; draw(); });
    tabPanes(document, '.cnf-tabs');
    draw();"""
    new = """    /* Review 6: the site navigation puts a pulsing dot beside
       Conferences while something is being played. Inside a
       conference the same fact belongs on the tab that holds the
       stops, so the tab strip answers "is it on now" too. */
    function markLiveTab() {
      var t = $$('.cnf-tabs .tab').filter(function (x) {
        return x.dataset.tab === 'stops';
      })[0];
      if (!t) return;
      var live = stops.some(function (e) { return stopLive(e, today); });
      var dot = $('.f03-dot', t);
      if (live && !dot) t.appendChild(el('div', 'f03-dot'));
      if (!live && dot) dot.remove();
    }

    genderSwitch(function (g) { gender = g; draw(); });
    tabPanes(document, '.cnf-tabs');
    draw();
    markLiveTab();"""
    if 'Review 6: the site navigation puts a pulsing dot' not in s:
        s = s.replace(old, new, 1)
        log.append('site.js: conference detail — a live conference marks Stops')

    # -- C7  the stop page shows the stream beside what it is waiting for
    old = """      } else if (stub) {
        stub.hidden = true;
      }"""
    new = """      } else if (stub) {
        stub.hidden = true;
      }
      /* Review 6: the timeline says which stop; the stream says you
         can watch it. It sits under the timeline, on the left, with
         the block that is waiting for the results on the right. */
      stopStream($('.cnf-stopnav'), e, today, '.stop-stub', true);"""
    if "stopStream($('.cnf-stopnav')" not in s:
        s = s.replace(old, new, 1)
        log.append('site.js: stop page — the stream sits under the timeline')

    # -- C8  the shared frame
    if 'function videoFrame(' not in s:
        block = '''
  /* ---------- Review 6: one video frame -----------------------
     The schedule module built the poster-and-play facade inline.
     Two stop views want the same thing, so it is one function: the
     still, the shade, the button, and the embed that is only
     fetched once somebody asks for it.

     The production mechanism is the channel's own live embed,
     which resolves to whatever FIBA3x3 is broadcasting and needs
     no link from anyone. It renders nothing off air, which on a
     prototype is every day, so an event that names a video wins. */
  function videoFrame(ev) {
    var frame = el('div', 'sched-frame');
    frame.innerHTML =
      '<img alt="" class="sched-poster" src="' +
      ((ev && (ev.poster || ev.cover)) || NL_POSTER) + '"/>' +
      '<div class="sched-shade"></div>';
    var play = el('button', 'sched-play',
      '<svg fill="currentColor" viewBox="0 -960 960 960" ' +
      'xmlns="http://www.w3.org/2000/svg"><path d="M320-203v-560l440 280-440 280Z">' +
      '</path></svg>');
    play.type = 'button';
    play.setAttribute('aria-label', 'Play the stream');
    play.addEventListener('click', function () {
      frame.innerHTML =
        '<iframe allow="accelerometer; autoplay; encrypted-media; picture-in-picture" ' +
        'allowfullscreen src="' +
        (ev && ev.video
           ? 'https://www.youtube.com/embed/' + ev.video + '?autoplay=1'
           : 'https://www.youtube.com/embed/live_stream?channel=' +
             YT_CHANNEL + '&autoplay=1') +
        '" title="FIBA 3x3 Nations League"></iframe>';
    });
    frame.appendChild(play);
    return frame;
  }

  /* A stop has a stream if it is on air now or was on air once —
     which is exactly the stops the calendar says have started. */
  function hasStream(e, day) {
    return !!e && (!!e.video || stopLive(e, day) || stopPlayed(e, day));
  }

  /* The stream on the left, whatever the view was already showing
     on the right. No stream and nothing moves: the block keeps the
     single column it had, which is what an unplayed stop shows.  */
  function stopStream(anchor, e, day, sideSel, after) {
    if (!anchor || !e) return;
    var side = $(sideSel);
    if (!side) return;
    var home = after ? anchor.parentNode : anchor;
    var split = $('.vsplit', home) ||
                (after && anchor.nextElementSibling &&
                 anchor.nextElementSibling.classList.contains('vsplit')
                   ? anchor.nextElementSibling : null);

    if (!hasStream(e, day)) {
      if (split) {
        if (split.contains(side)) home.insertBefore(side, split);
        split.remove();
      }
      return;
    }
    if (!split) {
      split = el('div', 'vsplit');
      split.appendChild(el('div', 'vsplit-v'));
      split.appendChild(el('div', 'vsplit-r'));
      if (after) home.insertBefore(split, anchor.nextSibling);
      else home.appendChild(split);
    }
    var right = $('.vsplit-r', split);
    if (side.parentNode !== right) right.appendChild(side);
    var left = $('.vsplit-v', split);
    left.innerHTML = '';
    left.appendChild(videoFrame(e));
    /* Nothing to put beside it — a hidden stub on a played stop —
       and the frame takes the width back. */
    split.classList.toggle('vsplit-solo', !!side.hidden);
  }
'''
        # goes just above the schedule module, which is the first caller
        s = s.replace('\n  function scheduleModule(host, confId) {',
                      block + '\n  function scheduleModule(host, confId) {', 1)
        log.append('site.js: videoFrame / hasStream / stopStream')

    # -- C9  the schedule module uses the shared frame
    old = """      var frame = el('div', 'sched-frame');
      var poster = (ev && (ev.poster || ev.cover)) || NL_POSTER;
      frame.innerHTML = '<img alt="" class="sched-poster" src="' + poster + '"/>' +
                        '<div class="sched-shade"></div>';
      if (isLive) {
        var play = el('button', 'sched-play',
          '<svg fill="currentColor" viewBox="0 -960 960 960" ' +
          'xmlns="http://www.w3.org/2000/svg"><path d="M320-203v-560l440 280-440 280Z">' +
          '</path></svg>');
        play.type = 'button';
        play.setAttribute('aria-label', 'Play the live stream');
        play.addEventListener('click', function () {
          frame.innerHTML =
            '<iframe allow="accelerometer; autoplay; encrypted-media; picture-in-picture" ' +
            'allowfullscreen src="' +
            (ev && ev.video
               ? 'https://www.youtube.com/embed/' + ev.video + '?autoplay=1'
               : 'https://www.youtube.com/embed/live_stream?channel=' +
                 YT_CHANNEL + '&autoplay=1') +
            '" title="FIBA 3x3 Nations League — live"></iframe>';
        });
        frame.appendChild(play);
      } else {"""
    new = """      var frame = videoFrame(ev);
      if (!isLive) {
        var pl = $('.sched-play', frame);
        if (pl) pl.remove();"""
    if 'var frame = videoFrame(ev);' not in s:
        s = s.replace(old, new, 1)
        log.append('site.js: the schedule module reuses videoFrame')

    if s != o:
        write('assets/site.js', s)


# ---------------------------------------------------------------- D  mobile.js
def d_sheet():
    s = read('assets/mobile.js')
    o = s
    ext = ('<span class="f03m-ext"><svg fill="currentColor" viewBox="0 -960 960 960" '
           'aria-hidden="true"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 '
           '23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 '
           '372-372H560v-80h280v280h-80v-144L388-332Z"></path></svg></span>')

    # About Nations League is a page on this site, so it is a link
    if 'About Nations League<span class="f03m-ext">' in s:
        s = s.replace(
            '<div class="f03m-l" tabindex="0">About Nations League<span class="f03m-ext">↗</span></div>',
            '<a class="f03m-l" href="about.html">About Nations League</a>', 1)
        log.append('mobile.js: About Nations League is a link')

    # every remaining external mark is an icon, not a character
    if '↗' in s:
        s = s.replace('<span class="f03m-ext">↗</span>', ext)
        log.append('mobile.js: the external mark is an icon')

    if s != o:
        write('assets/mobile.js', s)


a_assets()
b_system()
c_site()
d_sheet()

print('\n'.join(log) if log else 'nothing to do — already applied')
