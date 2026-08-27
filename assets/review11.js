/* ============================================================
   FIBA 3x3 Nations League — review11.js
   Round eleven. Three things a stylesheet cannot say.

     1  The season picker in the phone's More sheet.
     2  The hero band joins the scroll reveal on a phone.
     3  S-13 Countdown ticks.

   Loads after review10.js. Nothing here depends on site.js
   having finished, except where it says so.
   ============================================================ */
(function () {
  'use strict';

  var D = document;
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function phone() { return window.matchMedia('(max-width: 1100px)').matches; }


  /* ---------- 1  the season, in the More sheet ---------------
     F-03 puts the season beside the navigation on a desktop.
     The phone header is a mark, a wordmark and a search icon —
     there is no room for it there and it was simply missing, so
     a reader on a handset had no way of knowing which season
     they were looking at, let alone of leaving it.

     It goes into the sheet, level with "Nations League" and
     hard right: the group heading names the competition, and
     the control beside it names the edition of it. The years
     are read off F-03's own picker when the page carries one,
     so the list is stated once.                              */
  var YEARS = ['2026', '2025', '2024', '2023'];

  function seasonPicker() {
    if (!phone()) return;
    var sheet = $('.mnav-sheet');
    if (!sheet || $('.mnav-season', sheet)) return;
    var head = $('.f03m-grp .f03m-grp-h', sheet);
    if (!head) return;

    var now = ($('.f03-year') || {}).textContent;
    now = (now || YEARS[0]).trim();
    var years = YEARS.slice();
    if (years.indexOf(now) < 0) years.unshift(now);

    head.classList.add('f03m-grp-h-row');

    var box = D.createElement('div');
    box.className = 'mnav-seasonbox';

    var sel = D.createElement('select');
    sel.className = 'mnav-season cut cut-s';
    sel.setAttribute('aria-label', 'Season');
    years.forEach(function (y) {
      var o = D.createElement('option');
      o.value = y;
      o.textContent = y;
      if (y === now) o.selected = true;
      sel.appendChild(o);
    });
    /* The prototype holds one season of data. Changing the
       picker moves the year on the page rather than pretending
       to load an archive that is not in the snapshot. */
    sel.addEventListener('change', function () {
      $$('.f03-year').forEach(function (n) { n.textContent = sel.value; });
    });

    box.appendChild(sel);
    box.insertAdjacentHTML('beforeend',
      '<svg fill="currentColor" viewBox="0 -960 960 960" aria-hidden="true">' +
      '<path d="M480-345 240-585h480L480-345Z"></path></svg>');
    head.appendChild(box);
  }


  /* ---------- 2  the hero band arrives like a section --------
     review7.js reveals the hero's PARTS — the logo, the line
     under it, the two corner marks — and leaves the band they
     sit in where it is. On a desktop that is right: the band is
     the full width of the window and the parallax owns it.

     On a phone the band is a block the height of a headline,
     the first of a column of blocks, and every other block in
     that column rises and fades as it arrives. The hero was the
     one that did not, so the page began with a still picture
     and started moving at the second section.

     The band is marked as a section, and its parts are dropped
     to fade-only so the type does not travel twice.          */
  function heroReveal() {
    if (!phone()) return;
    if (!D.documentElement.classList.contains('rv-on')) return;
    var band = $('.hnl');
    if (!band || band._rv11) return;
    /* Only on a page that actually shows the NL band. */
    if (!D.body.classList.contains('hero-nl')) return;
    band._rv11 = true;

    band.classList.add('rv');
    $$('.hnl-logo, .hnl-s, .hnl-in .nav-a', band).forEach(function (n) {
      n.classList.add('rv-f');
    });
    /* review7.js owns the observer; it is not exported. The
       band is above the fold on arrival, so one frame of the
       waiting state and then the run is the whole animation —
       and the timer is the guarantee that it never stays at
       opacity 0 if the class is cleaned up elsewhere. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { band.classList.add('is-in'); });
    });
    setTimeout(function () {
      band.classList.remove('rv', 'is-in', 'rv-f');
      band.style.removeProperty('--rv-d');
    }, 2400);
  }


  /* ---------- 3  S-13 Countdown -----------------------------
     One tick for every countdown on the page. The target is on
     the block as data-until, in ISO; a block without one shows
     the figures it was written with, which is what the design
     system's static specimens want.                          */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function tick() {
    var live = $$('.s13[data-until]');
    if (!live.length) return;
    var now = Date.now();
    live.forEach(function (b) {
      var t = Date.parse(b.dataset.until);
      if (isNaN(t)) return;
      var s = Math.floor((t - now) / 1000);
      if (s <= 0) { b.classList.add('s13-on'); return; }
      b.classList.remove('s13-on');
      var v = $$('.s13-v', b);
      var d = Math.floor(s / 86400);
      var h = Math.floor(s % 86400 / 3600);
      var m = Math.floor(s % 3600 / 60);
      var sec = s % 60;
      if (v[0]) v[0].textContent = d;
      if (v[1]) v[1].textContent = pad(h);
      if (v[2]) v[2].textContent = pad(m);
      if (v[3]) v[3].textContent = pad(sec);
    });
  }

  var timer = null;
  function countdowns() {
    if (!$('.s13[data-until]')) return;
    tick();
    if (!timer) timer = setInterval(tick, 1000);
  }


  /* ---------- boot ------------------------------------------ */
  function init() {
    try { seasonPicker(); } catch (e) { console.error('season picker', e); }
    try { heroReveal(); }  catch (e) { console.error('hero reveal', e); }
    try { countdowns(); }  catch (e) { console.error('countdown', e); }
  }

  function boot() {
    init();
    /* mobile.js injects the chrome, site.js paints the page —
       both can land after this file runs. */
    requestAnimationFrame(init);
    setTimeout(init, 300);
    setTimeout(init, 1200);
    setTimeout(init, 2500);
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.addEventListener('resize', function () {
    clearTimeout(window._r11);
    window._r11 = setTimeout(function () { seasonPicker(); }, 200);
  });
})();
