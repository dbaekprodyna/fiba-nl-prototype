/* ============================================================
   FIBA 3x3 Nations League — hero-switch.js
   The three-way hero switch in F-02: No hero / Hero A / Hero B.
   It owns the shared DOM (the .hl-inner wrapper and the one
   canvas both variants paint on) and broadcasts the choice;
   hero-a.js and hero-b.js each listen and run only when named.

   Load order matters: this file first, then the variants. All
   three are deferred, so the opening broadcast on DOMContentLoaded
   reaches listeners that registered after this script ran.
   ============================================================ */
(function () {
  'use strict';

  var hl = document.querySelector('.tpl-content > .hl');
  if (!hl) return;

  /* One wrapper around the headline and the link. It is
     display:contents until a hero is on, so "No hero" renders
     the original .hl flex row untouched. */
  var inner = hl.querySelector('.hl-inner');
  if (!inner) {
    inner = document.createElement('div');
    inner.className = 'hl-inner';
    while (hl.firstChild) inner.appendChild(hl.firstChild);
    hl.appendChild(inner);
  }

  /* One canvas, shared. Only one variant animates at a time, so
     a second canvas would just be a second thing to keep in
     sync with the band's size. */
  var cv = hl.querySelector('.hl-canvas');
  if (!cv) {
    cv = document.createElement('canvas');
    cv.className = 'hl-canvas';
    cv.setAttribute('aria-hidden', 'true');
    hl.insertBefore(cv, hl.firstChild);
  }

  var MODES = { a: 1, b: 1, nl: 1 };
  var current = 'nl';

  window.HERO = {
    band: hl,
    inner: inner,
    canvas: cv,
    mode: function () { return current; },
    /* The content box the page uses, in canvas coordinates —
       both variants anchor their artwork to it. */
    /* True when mobile.css has stacked the band: the headline sits
       on white above and the canvas is its own strip below, rather
       than the two being layered. Driven from CSS so the layout
       decision stays in one place. */
    stacked: function () {
      return getComputedStyle(hl).getPropertyValue('--hero-stack').trim() === '1';
    },
    measure: function () {
      /* The canvas, not the band. On desktop the canvas is inset:0
         of the band and the two are identical; stacked, the canvas
         is the shorter strip and is what has to be measured. */
      var band = cv.getBoundingClientRect();
      var ir = inner.getBoundingClientRect();
      var cs = getComputedStyle(inner);
      var padL = parseFloat(cs.paddingLeft) || 0;
      var padR = parseFloat(cs.paddingRight) || 0;
      /* Stacked, there is no headline to clear: the artwork owns
         the full width of its strip. */
      if (window.HERO.stacked()) {
        return { w: band.width, h: band.height, cx: 0, cw: 0 };
      }
      return {
        w: band.width,
        h: band.height,
        cx: (ir.left - band.left) + padL,
        cw: Math.max(320, ir.width - padL - padR)
      };
    }
  };

  /* Review 20 — Daniel: the hero is not a setting any more. The two
     links that switched it off came out of the top bar, and with them
     the `none` state: a hash left over from before now resolves to the
     hero rather than to a page without one. Hero A and Hero B stay
     reachable by hash, because they are how the two treatments are
     shown side by side in a review. */
  function fromHash() {
    var m = /(?:^|[#&])hero=(a|b|nl)\b/.exec(location.hash);
    return m ? m[1] : 'nl';
  }

  function apply(mode, push) {
    if (!MODES[mode]) mode = 'nl';
    current = mode;

    document.body.classList.toggle('hero-nl', mode === 'nl');
    document.body.classList.toggle('hero-a', mode === 'a');
    document.body.classList.toggle('hero-b', mode === 'b');

    var links = document.querySelectorAll('.f02-fam [data-hero]');
    for (var i = 0; i < links.length; i++) {
      var on = links[i].getAttribute('data-hero') === mode;
      links[i].classList.toggle('is-on', on);
      links[i].setAttribute('aria-current', on ? 'true' : 'false');
    }

    /* Wipe whatever the previous variant left behind before the
       next one is told to start. */
    var ctx = cv.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, cv.width, cv.height);

    document.dispatchEvent(new CustomEvent('hero:change', { detail: { mode: mode } }));

    if (push) {
      /* hash, not a query — history.replaceState is blocked on file:// */
      var h = '#hero=' + mode;
      if (history.replaceState) history.replaceState(null, '', h);
      else location.hash = h.slice(1);
    }
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('.f02-fam [data-hero]') : null;
    if (!a) return;
    e.preventDefault();
    apply(a.getAttribute('data-hero'), true);
  });
  window.addEventListener('hashchange', function () { apply(fromHash(), false); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(fromHash(), false); });
  } else {
    setTimeout(function () { apply(fromHash(), false); }, 0);
  }
})();
