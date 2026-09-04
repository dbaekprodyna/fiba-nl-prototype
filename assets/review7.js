/* ============================================================
   FIBA 3x3 Nations League — review7.js
   Round seven. Two pieces of motion:

     1  Scroll reveal. Every section — and the sub-headline that
        names it — rises a little and fades in as it crosses into
        the window, the headline one beat ahead of its body. This
        is the apple.com/iphone arrival, and it is built the same
        way: one IntersectionObserver, a transform and an opacity,
        and a delay per sibling. No scroll handler.

     2  The home hero's parallax. The two corner elements, the
        court and the type each travel at their own rate while the
        band scrolls past, so the band has depth rather than being
        one flat picture that slides away.

   Safety: every rule in review7.css is behind .rv-on, which an
   inline script in <head> puts on <html> and which this file
   TAKES BACK OFF if it cannot do the work (no observer, reduced
   motion). A page whose script fails is the page it always was —
   there is no state in which content is left at opacity 0.
   ============================================================ */
(function () {
  'use strict';

  var D = document;
  var HTML = D.documentElement;
  /* Round nine: the beat between siblings widens with the run.
     800ms/90ms read as a flick; apple.com/iphone's arrival is a
     shade over a second with a wider beat, and the duration and
     the rise that go with these live in review9.css.          */
  var STEP = 130;                      /* ms between two siblings  */
  var MAXI = 4;                        /* nothing waits longer     */

  function off() { HTML.classList.remove('rv-on'); }

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { off(); return; }

  function qsa(root, sel) {
    return Array.prototype.slice.call((root || D).querySelectorAll(sel));
  }
  function kids(n) {
    return Array.prototype.filter.call(n.children, function (c) {
      var t = c.tagName;
      return t !== 'SCRIPT' && t !== 'STYLE' && t !== 'TEMPLATE';
    });
  }

  /* ---------- 1  the reveal ---------------------------------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      /* arrived */
      if (e.isIntersecting) { io.unobserve(e.target); show(e.target); return; }
      /* or gone by above the window without ever being seen — a
         module site.js painted late, behind the reader. It is not
         going to be animated at them; it is simply there. */
      if (e.boundingClientRect.bottom <= 0) { io.unobserve(e.target); show(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

  /* Anything absolutely placed, decorative, or already carrying a
     transform of its own must not be given one. */
  var NOMOVE = '.cutfill,.hnl-kv,.hnl-court,.hnl-bg,.f04-kv,.ad,.brandstroke';

  /* When it has arrived, every trace of the reveal comes off the
     element. It has to: .rv.is-in sets the whole `transition`
     shorthand, and an .acc or a .card that kept it would have lost
     the hover transition motion.css gives it. An arrived element is
     an ordinary element. */
  function clean(n) {
    n.classList.remove('rv', 'is-in', 'rv-f');
    n.style.removeProperty('--rv-d');
  }
  function show(n) {
    if (!n.classList.contains('rv')) return;
    n.classList.add('is-in');
    /* long enough to outlast the slowest arrival there is:
       1100ms of run behind 4 x 130ms of stagger. */
    setTimeout(function () { clean(n); }, 2200);
  }

  /* Nothing is put into the waiting state that the reader has
     already gone past. site.js repaints modules well after the
     first screen — a module repainted while it is behind the
     reader would otherwise go to opacity 0 and stay there until
     they scrolled back up to it. So: at the top of the page
     everything waits, and after that only what is still below the
     fold does. */
  function armed(n) {
    if ((window.pageYOffset || D.documentElement.scrollTop || 0) < 8) return true;
    var r = n.getBoundingClientRect();
    if (r.width + r.height === 0) return true;      /* not laid out yet */
    return r.top >= (window.innerHeight || 0) * 0.9;
  }

  /* What has been handled is remembered in a WeakSet and NOT in a
     class or a data attribute — because site.js builds several
     modules by cloning a node that is already on the page, and a
     clone carries whatever classes its original had. A clone of an
     element that was waiting arrives waiting: .rv, opacity 0, and
     never observed by anything. That was the Live now accordions
     staying blank on the phone. A WeakSet does not clone. */
  var seen = new WeakSet();

  function mark(n, i, fadeOnly) {
    if (!n || n.nodeType !== 1) return;
    if (seen.has(n)) return;
    seen.add(n);
    if (n.classList.contains('cutfill')) return;
    n.classList.remove('is-in');            /* a clone's stale state */
    if (!armed(n)) { clean(n); return; }
    n.classList.add('rv');
    if (fadeOnly || n.matches(NOMOVE)) n.classList.add('rv-f');
    if (i) n.style.setProperty('--rv-d', Math.min(i, MAXI) * STEP + 'ms');
    io.observe(n);
  }

  /* A section's children arrive in order: its el-01 header first,
     then whatever the section is made of. */
  function stagger(box, from) {
    var i = from || 0;
    kids(box).forEach(function (c) {
      if (c.classList.contains('cutfill')) return;
      mark(c, i);
      i += 1;
    });
  }

  function heroParts(root) {
    var hin = (root || D).querySelector('.hnl-in');
    if (!hin || seen.has(hin)) return;
    seen.add(hin);
    var lock = hin.querySelector('.hnl-lock');
    if (lock) {
      mark(lock.querySelector('.hnl-logo'), 0);
      mark(lock.querySelector('.hnl-s'), 1);
    }
    kids(hin).forEach(function (n) { if (n !== lock) mark(n, 2); });
    /* the corners and the court fade only — the parallax owns
       their transform and the reveal must not write to it */
    var band = D.querySelector('.hnl');
    if (band) {
      mark(band.querySelector('.hnl-bg'), 0, true);
      mark(band.querySelector('.hnl-court'), 0, true);
      mark(band.querySelector('.hnl-kv-l'), 1, true);
      mark(band.querySelector('.hnl-kv-r'), 2, true);
    }
  }

  function scan(root) {
    root = root || D;
    heroParts(root);
    qsa(root, '.f04').forEach(function (f) {
      if (seen.has(f)) return;
      seen.add(f);
      stagger(f);
    });
    /* Sections are NOT remembered: site.js repaints a section's
       children in place, and the new children have to be marked
       too. mark() is the thing that remembers, per element. */
    qsa(root, '.tpl-sub').forEach(stagger);
    /* Pages the builder never split into .tpl-sub blocks still
       arrive section by section: the content column's own blocks
       are the sections there. */
    qsa(root, '.tpl-content').forEach(function (c) {
      if (c.querySelector('.tpl-sub')) return;
      var i = 0;
      kids(c).forEach(function (n) {
        if (n.matches('.f04,.hnl,.hl,.f06')) return;
        mark(n, i);
        i += 1;
      });
    });
  }

  /* The net under all of it. Anything that has reached the window —
     or gone past it — and is still waiting is shown outright. Only
     what is still below the fold is left to the observer. An
     element that gains its layout while it is already behind the
     reader never changes its intersection ratio (0 to 0), so the
     observer is never called for it; this is what catches those. */
  function sweep() {
    var vh = window.innerHeight || 0;
    qsa(D, '.rv:not(.is-in)').forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.width + r.height === 0) return;      /* not laid out yet */
      if (r.top < vh) show(n);
    });
  }

  /* ---------- 2  the home hero's parallax -------------------- */
  var pq = window.matchMedia('(min-width: 901px)');
  var par = null;

  function buildParallax() {
    var band = D.querySelector('.hnl');
    if (!band) return null;
    var q = function (s) { return band.querySelector(s); };
    var L = [];
    /* [node, rate, mode] — rate is a share of the scrolled
       distance; a layer given +0.3 travels down at three tenths
       of the page's speed, so it reads as further away. The type
       is given a negative rate: it leaves a little early.
       mode 1 keeps the court's own translateX(-50%).            */
    /* Round nine: the top-left element's rate is 0. At 0.30 it
       travelled down three tenths of the scrolled distance while
       the band travelled up all of it, so a strip of flat blue
       opened between the top of the band and the top of the
       artwork — the corner came away from its own corner. It is
       drawn INTO that edge, so it has to hold it; the depth in
       the band comes from the other three.                     */
    /* Round twenty-one: the season plate. It is drawn at twice
       the band height and centred, so it has half a band of slack
       each way and not a pixel more — travel past that and the
       gradient ground appears at the band's edge. e[3] = 1 asks
       frame() to clamp the layer to that slack; the others have
       no such limit because they are drawn into their corners. */
    [[q('.hnl-kv-l'), 0.00, 0], [q('.hnl-kv-r'), 0.22, 0],
     [q('.hnl-bg'), 0.45, 0, 1],
     [q('.hnl-court'), 0.44, 1], [q('.hnl-in'), -0.16, 2]]
      .forEach(function (e) {
        if (!e[0]) return;
        e[0].classList.add(e[2] === 2 ? 'hnl-par-in' : 'hnl-par');
        L.push(e);
      });
    return L.length ? { band: band, layers: L, h: band.offsetHeight || 1 } : null;
  }

  var ticking = false;
  function frame() {
    ticking = false;
    if (!par) return;
    var s = window.pageYOffset || D.documentElement.scrollTop || 0;
    var p = Math.min(s, par.h * 1.5);
    par.layers.forEach(function (e) {
      var yv = p * e[1];
      /* a layer with a mask of its own may not leave it */
      if (e[3] === 1) {
        var cap = par.h / 2;
        if (yv > cap) yv = cap; else if (yv < -cap) yv = -cap;
      }
      /* At rest the inline transform comes off altogether. A
         translate3d(0,0,0) still promotes the layer it sits on,
         and the hero's strap re-rasterises when it does — the
         band at the top of an unscrolled page has to be the
         band it always was, to the pixel. */
      if (Math.abs(yv) < 0.05) {
        e[0].style.transform = '';
      } else {
        var y = yv.toFixed(1);
        e[0].style.transform = e[2] === 1
          ? 'translate(-50%,' + y + 'px)'
          : 'translate3d(0,' + y + 'px,0)';
      }
      if (e[2] === 2) {
        /* the type holds its own for the first third of the band
           and is gone by the time the band is. A fade that starts
           at the first pixel of scroll reads as a bug. */
        var t = (p / par.h - 0.34) / 0.66;
        var o = 1 - Math.min(1, Math.max(0, t));
        e[0].style.opacity = o > 0.999 ? '' : o.toFixed(3);
      }
    });
  }
  function onScroll() {
    if (ticking || !par) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }

  function clearParallax() {
    if (!par) return;
    par.layers.forEach(function (e) {
      e[0].style.transform = '';
      e[0].style.opacity = '';
      e[0].classList.remove('hnl-par', 'hnl-par-in');
    });
    par = null;
  }

  function syncParallax() {
    if (pq.matches) {
      if (!par) par = buildParallax();
      if (par) { par.h = par.band.offsetHeight || 1; frame(); }
    } else {
      clearParallax();
    }
  }

  /* ---------- boot ------------------------------------------- */
  function boot() {
    scan(D);
    syncParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { syncParallax(); sweep(); });

    /* Round nine. A pane behind a tab is display:none, so its
       blocks have no box — armed() lets them wait, the observer
       is never called for them (0 to 0), and sweep() skips them
       because a box of no size cannot be measured. Press the tab
       and the pane appears with its contents still at opacity 0,
       and nothing ever comes back for them. Conference > Stops
       opened onto an empty column because of it.

       A press is the only thing that opens a pane, so a press is
       what sends the sweep round again. Capture, so a handler
       that stops the event still gets swept after. */
    var ct = 0;
    function later() { clearTimeout(ct); ct = setTimeout(sweep, 80); }
    D.addEventListener('click', later, true);
    D.addEventListener('keyup', later, true);
    if (pq.addEventListener) pq.addEventListener('change', syncParallax);
    else if (pq.addListener) pq.addListener(syncParallax);

    /* site.js paints most of every page after this file runs, so
       the scan is repeated whenever the column gains children. */
    if ('MutationObserver' in window) {
      var t = 0;
      new MutationObserver(function () {
        clearTimeout(t);
        t = setTimeout(function () { scan(D); syncParallax(); sweep(); }, 120);
      }).observe(D.body, { childList: true, subtree: true });
    }
    [300, 900, 2000].forEach(function (ms) {
      setTimeout(function () { scan(D); sweep(); }, ms);
    });
    window.addEventListener('load', function () { setTimeout(sweep, 300); });
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
