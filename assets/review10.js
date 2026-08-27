/* ============================================================
   FIBA 3x3 Nations League — review10.js
   Round ten (2026-08-27, Daniel's seventh mark-up).

   Two things that cannot be said in a stylesheet.

     1  How many columns a table pins on a phone. It is a
        different answer per table and the width to pin the
        second one at is a measurement, not a constant.
     2  Where the day strip is scrolled to when it arrives.

   Loads after review7.js. Everything here is phone-only and
   guarded: on a desktop it measures nothing and moves nothing.
   ============================================================ */
(function () {
  'use strict';

  var D = document;
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function phone() { return window.matchMedia('(max-width: 767px)').matches; }


  /* ---------- 1  the pinned columns, per table ---------------
     Three shapes, and the shape is readable off the first cell
     rather than off the page it is on.

       0  a game list, a season journey, a game log — read one
          row at a time, left to right, nothing to hold on to
       1  a matrix, a plain federation table — the federation is
          the row, and it is the first column
       2  a ranking — the position is the first column and it is
          30px wide, so it and the federation together are still
          less than a third of the screen

     The second pin has to know how wide the first column is and
     that is a different number on every table, so it is measured
     and written onto the table as --stick1. mobile5.js does the
     same for the tables it knows about; this one covers the two
     it does not — Stats > Players and the game log are rows in
     an unclassed div, which is why neither of them ever got a
     scroller either.                                          */
  function count(root) {
    if (root.classList.contains('games-tbl')) return 0;   /* Games, Results */
    if (root.classList.contains('s10')) return 0;         /* Season journey */
    /* E-06 and E-07 — the season table and the game log on a player
       page. Both are read a row at a time and neither leads with a
       column worth holding: E-06's is the stop's own name, which is
       the widest thing in the table. */
    if ($(':scope > .e07-row', root) || $(':scope > .e06-row', root)) return 0;
    if (root.classList.contains('s11')) return 1;         /* Stop by stop */
    var row = $(':scope > .thead', root) || $(':scope > .trow', root);
    var first = row && row.children[0];
    if (!first) return 1;
    /* A ranking leads with the position; a federation table leads
       with the federation. */
    return /\b(c-pos|r05-rank)\b/.test(first.className) ? 2 : 1;
  }

  function tables() {
    var roots = [], seen = [];
    $$('.thead, .e06-h').forEach(function (h) {
      var r = h.parentElement;
      if (!r || seen.indexOf(r) > -1) return;
      seen.push(r);
      roots.push(r);
    });
    return roots;
  }

  function stick() {
    if (!phone()) return;
    tables().forEach(function (root) {
      var n = count(root);
      root.classList.add('mtbl');
      root.classList.remove('mstick-0', 'mstick-1', 'mstick-2');
      root.classList.add('mstick-' + n);
      if (n < 2) return;
      var row = $(':scope > .thead', root) || $(':scope > .trow', root);
      var first = row && row.children[0];
      if (!first) return;
      var w = Math.round(first.getBoundingClientRect().width);
      if (w > 0) root.style.setProperty('--stick1', w + 'px');
    });
  }


  /* ---------- 2  the conference column, shortened ------------
     "Asia Central/East U23" in an 84px column is three lines, and
     the federation beside it is one, so a standings table came out
     as a stack of rows of four different heights.

     Only the region word is touched, and only on a phone: the
     conference's own name — East, North, SEA, -1, -2 — is what
     tells two of them apart and stays as it is. The pass is
     idempotent by construction: none of the replacements produces
     a string that any of the patterns still matches.             */
  var SHORT = [
    [/\bCentral\/East\b/, 'C/E'],
    [/\bWest\/Pacific\b/, 'W/PAC'],
    [/\bAmericas\b/, 'AMER'],
    [/\bAfrica\b/, 'AFR'],
    [/\bEurope\b/, 'EUR'],
    [/\bPacific\b/, 'PAC']
  ];
  function shorten() {
    if (!phone()) return;
    $$('.trow > .c-conf, .trow > .cell.c-conf, .e07-row > .e07-conf').forEach(function (cell) {
      var t = cell.querySelector('.t-body-s') || cell;
      var was = t.textContent, now = was;
      SHORT.forEach(function (r) { now = now.replace(r[0], r[1]); });
      if (now !== was) t.textContent = now;
    });
  }


  /* ---------- 3  the strip arrives on today -----------------
     el-30 is eight days wide and a phone shows three of them.
     The module's whole subject is what is being played now, and
     now was the fourth cell — off the right of the screen, with
     the two paging arrows that would have moved it hidden by
     mobile10.css because a rail does not need them.

     So the rail is scrolled to it instead. .s03-on is the day
     the page has selected; on the Calendar nothing is selected
     until you pick one, and there .s03-live — today — is the
     one to open on. Centred rather than flush left, so the day
     before is visible and it reads as a position in a run of
     days rather than as the start of one.                     */
  function centre() {
    if (!phone()) return false;
    var strip = $('.s03');
    if (!strip) return false;
    guard(strip);
    /* Once the reader has put a finger on it, the position is
       theirs and nothing here moves it again. */
    if (strip._hands) return true;
    var cell = $('.s03-on', strip) || $('.s03-live', strip);
    if (!cell) return false;
    var c = cell.getBoundingClientRect(), s = strip.getBoundingClientRect();
    if (!c.width || !s.width) return false;
    var to = strip.scrollLeft + (c.left - s.left) - (s.width - c.width) / 2;
    to = Math.max(0, Math.min(Math.round(to), strip.scrollWidth - strip.clientWidth));
    if (Math.abs(to - strip.scrollLeft) > 1) strip.scrollLeft = to;
    return true;
  }

  /* The Calendar repaints its strip after the first frame that has
     one — the region filter and the gender switch both redraw it —
     so a single pass on arrival left the scroll position measured
     against a strip that no longer existed. It is corrected until
     the reader touches it instead of once. */
  function guard(strip) {
    if (strip._g) return;
    strip._g = 1;
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (t) {
      strip.addEventListener(t, function () { strip._hands = 1; }, { passive: true });
    });
  }


  /* ---------- 4  E-08 PlayerCard, without a pointer ----------
     The card tips towards the pointer and a specular band crosses
     it. On a phone there is no pointer, so the whole effect was
     simply absent — the one module on the site whose behaviour IS
     the module.

     Two inputs, in order of preference.

     The gyroscope. `deviceorientation` gives gamma (tipped left
     and right) and beta (tipped towards and away). Held at a
     normal reading angle beta is around 45, so 45 is the rest
     position and the card answers to how far off it you are.
     Android and desktop Chrome fire it on a secure origin with no
     asking. iOS 13 and later will not: DeviceOrientationEvent
     .requestPermission() has to be called from inside a user
     gesture, and a tap on a card is a tap on a link, so there is
     no gesture here to hang it on. We do not prompt — an
     unexplained "allow motion" dialog on arrival is worse than no
     tilt — and iOS falls through to the second input.

     Where the card is on the screen. The rails are swiped and the
     grids are scrolled, so a card is always moving: it tips away
     from the middle of the screen in proportion to how far off it
     is, and turns back to square as it arrives. That works
     everywhere, including on iOS, and it needs no permission and
     no sensor.

     Either way the card nearest the middle is the one that is
     lifted, which gives a rail a subject the way hover did.     */
  var gyro = { on: false, x: 0, y: 0 };
  function clamp(v) { return v < -1 ? -1 : v > 1 ? 1 : v; }

  function listenGyro() {
    if (!window.DeviceOrientationEvent) return;
    /* iOS: needs a gesture-bound permission call. Not prompted. */
    if (typeof window.DeviceOrientationEvent.requestPermission === 'function') return;
    window.addEventListener('deviceorientation', function (e) {
      if (e.beta == null && e.gamma == null) return;
      gyro.on = true;
      gyro.x = clamp(((e.beta || 0) - 45) / 45);
      gyro.y = clamp((e.gamma || 0) / 45);
      schedule();
    }, { passive: true });
  }

  var pending = 0;
  function schedule() { if (!pending) pending = requestAnimationFrame(paint); }

  function paint() {
    pending = 0;
    if (!phone()) return;
    var vx = window.innerWidth / 2, vy = window.innerHeight / 2;
    var vis = [], best = null, near = 1e9;
    $$('.pcard-sh').forEach(function (sh) {
      var r = sh.getBoundingClientRect();
      if (r.bottom < 8 || r.top > window.innerHeight - 8 ||
          r.right < 8 || r.left > window.innerWidth - 8) {
        sh.classList.remove('pcard-on');
        return;
      }
      var dx = r.left + r.width / 2 - vx;
      var dy = r.top + r.height / 2 - vy;
      /* A rail is swiped sideways and a grid is scrolled down, so
         both distances count — sideways rather more, because that
         is the axis a rail moves on. */
      var d = Math.abs(dx) + Math.abs(dy) * 0.6;
      vis.push({ sh: sh, dx: dx, dy: dy });
      if (d < near) { near = d; best = sh; }
    });
    vis.forEach(function (o) {
      o.sh.classList.toggle('pcard-on', o.sh === best);
      var card = $('.pcard', o.sh);
      if (!card) return;
      var x = gyro.on ? gyro.y : clamp(o.dx / vx);
      var y = gyro.on ? gyro.x : clamp(o.dy / vy);
      card.style.setProperty('--tilt-y', (x * 10).toFixed(2) + 'deg');
      card.style.setProperty('--tilt-x', (-y * 7).toFixed(2) + 'deg');
      var band = $('.pcard-shine', card);
      if (band) {
        band.style.setProperty('--shine-p', (30 + (x * 0.5 + 0.5) * 40).toFixed(0) + '%');
        band.style.setProperty('--shine-a', (100 + y * 30).toFixed(0) + 'deg');
      }
    });
  }


  /* ---------- when ------------------------------------------
     site.js paints from a fetch, so nothing here exists at
     DOMContentLoaded. Rather than guess a delay, both jobs are
     retried on animation frames until the thing they need is
     on the page, and then again after anything that repaints a
     table — a gender switch, a tab, an accordion. A click is
     what opens all three of those, so a debounced pass behind
     every click is the net.                                    */
  var frames = 0, hits = 0;
  function poll() {
    stick();
    shorten();
    if (centre()) hits++;
    schedule();
    /* Sixty frames past the first success, so a repaint that lands
       just after the strip appears is caught too. */
    if (++frames < 240 && hits < 60) requestAnimationFrame(poll);
  }

  function later() {
    clearTimeout(later._t);
    later._t = setTimeout(function () {
      stick();
      shorten();
      centre();
      schedule();
    }, 90);
  }

  function start() {
    requestAnimationFrame(poll);
    listenGyro();
    /* A rail scrolls inside itself, so the listener is on the
       document in capture — scroll does not bubble. */
    D.addEventListener('scroll', schedule, true);
    D.addEventListener('click', later, true);
    D.addEventListener('keyup', later, true);
    window.addEventListener('resize', later);
    window.addEventListener('orientationchange', later);
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start);
  else start();
})();
