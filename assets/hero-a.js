/* ============================================================
   FIBA 3x3 Nations League — hero-a.js
   Hero A: slats tilted 76.5° sweep right-to-left to open a
   photo window cut at the same angle, hold, then gather back
   to the right while the next photo swaps in.

   Nothing runs until the F-02 switch turns Hero A on. "No hero"
   is the default and leaves the existing headline alone.

   Settings below are the values dialled in on the tuner
   (fiba-hero-slats.html, 2026-08-20).
   ============================================================ */
(function () {
  'use strict';

  var CFG = {
    angle:    76.5,   /* degrees from horizontal                 */
    split:    0.40,   /* slat region starts here across 1440     */
    photoW:   0.60,   /* photo window, share of the region       */
    photoPos: 0.20,   /* its left edge, share of the region      */
    density:  0.50,   /* gap multiplier — lower is sparser       */
    pWhite:   0.49,   /* share of slats left white               */
    /* Accents are counted, not sampled: a probability gave a
       different number of yellow and red lines on every layout.
       [min, max] lines actually drawn, picked once per build. */
    yellow:   [2, 3],
    red:      [1, 2],
    drift:    10.0,   /* px of idle movement during the hold     */
    spread:   2.00,   /* s  — 3.00 / 1.5                         */
    hold:     6.00,   /* s                                       */
    gather:   0.40,   /* s  — 0.60 / 1.5                         */
    pause:    0.10,   /* s, fully gathered — the photo swaps here */
    speed:    1.15,
    tone:     true,   /* 2-step shade variation on the dominant  */
    partial:  true,   /* some thin slats run part height         */
    seed:     7
  };

  /* Cropped 2.238:1 — the photo window's ratio at a 1440 viewport,
     the desktop reference width. ?v= is a cache-buster: the files are
     re-cropped in place when the selection or the ratio changes. */
  var PHOTOS = [
    'assets/hero-a/hero-a-1.jpg?v=3', 'assets/hero-a/hero-a-2.jpg?v=3',
    'assets/hero-a/hero-a-3.jpg?v=3', 'assets/hero-a/hero-a-4.jpg?v=3',
    'assets/hero-a/hero-a-5.jpg?v=3', 'assets/hero-a/hero-a-6.jpg?v=3',
    'assets/hero-a/hero-a-7.jpg?v=3'
  ];

  var STAG = 0.55;        /* how much of the spread the stagger eats   */
  /* The two widest buckets are cut to 40% of their drawn width, so the
     band reads as lines rather than planes. Raise to 0.60 for a heavier
     composition — it is the only number that controls this. */
  var BIG = 0.40;
  /* Gathered pack width, as a share of the region. Tightened from 0.40
     when the wide slats were cut to BIG — thinner bars spread over the
     old width left the gathered moment reading as a blank band. */
  var COMPRESS = 0.28;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- helpers ------------------------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    r = Math.round(clamp(r + 255 * amt, 0, 255));
    g = Math.round(clamp(g + 255 * amt, 0, 255));
    b = Math.round(clamp(b + 255 * amt, 0, 255));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  /* ---- DOM ---------------------------------------------------- */
  var hl = document.querySelector('.tpl-content > .hl');
  if (!hl) return;

  var inner = hl.querySelector('.hl-inner');
  if (!inner) {
    inner = document.createElement('div');
    inner.className = 'hl-inner';
    while (hl.firstChild) inner.appendChild(hl.firstChild);
    hl.appendChild(inner);
  }
  var cv = hl.querySelector('.hl-canvas');
  if (!cv) {
    cv = document.createElement('canvas');
    cv.className = 'hl-canvas';
    cv.setAttribute('aria-hidden', 'true');
    hl.insertBefore(cv, hl.firstChild);
  }
  var ctx = cv.getContext('2d');

  /* ---- photos ------------------------------------------------- */
  var photos = null;
  function loadPhotos() {
    if (photos) return;
    photos = PHOTOS.map(function (src) { var im = new Image(); im.src = src; return im; });
  }

  /* ---- geometry ----------------------------------------------- */
  var H = 256, K = 0, geo = null, slats = [];

  function measure() {
    var band = hl.getBoundingClientRect();
    var ir = inner.getBoundingClientRect();
    var cs = getComputedStyle(inner);
    var padL = parseFloat(cs.paddingLeft) || 0;
    var padR = parseFloat(cs.paddingRight) || 0;
    var cx = (ir.left - band.left) + padL;      /* content box, canvas space */
    var cw = Math.max(320, ir.width - padL - padR);
    return { w: band.width, h: band.height, cx: cx, cw: cw };
  }

  function layout() {
    var m = measure();
    H = m.h;
    K = 1 / Math.tan(CFG.angle * Math.PI / 180);
    var x0 = m.cx + m.cw * CFG.split;
    var rw = Math.max(160, m.w - x0);
    geo = {
      vw: m.w, x0: x0, rw: rw, anchor: m.w - 10,
      pl: x0 + rw * CFG.photoPos,
      pr: x0 + rw * CFG.photoPos + rw * CFG.photoW
    };
    build();
  }

  function build() {
    var rnd = mulberry32(CFG.seed >>> 0);
    var dom = cssVar('--hero-a-blue', '#253AFF');
    var a1 = cssVar('--hero-a-yellow', '#E8B33D');
    var a2 = cssVar('--hero-a-red', '#C32440');
    slats = [];
    var x = geo.x0 - 34, guard = 0;

    while (x < geo.vw + 110 && guard++ < 500) {
      var over = x > geo.pl - 40 && x < geo.pr + 6;
      var r = rnd(), w;
      if (r < 0.50)      w = 2 + rnd() * 10;
      else if (r < 0.82) w = 13 + rnd() * 16;
      else if (r < 0.95) w = (30 + rnd() * 34) * BIG;
      else               w = (68 + rnd() * 58) * BIG;
      var g = (4 + rnd() * 22) / CFG.density;
      if (over) { w *= 0.58; g *= 1.22; }
      if (x < geo.x0 + 180) g *= 0.68;

      var cr = rnd(), col;
      if (cr < CFG.pWhite) col = '#FFFFFF';
      else col = (CFG.tone && rnd() < 0.26) ? shade(dom, -0.16) : dom;
      if (x < geo.x0 + 150) w *= 0.45;

      /* Part-height only on thin slats: a wide one reads as a
         notch rather than a shorter bar. */
      var y0 = 0, y1 = H;
      if (CFG.partial && w < 18) {
        var hr = rnd();
        if (hr < 0.16) { y0 = 0; y1 = H * (0.34 + rnd() * 0.42); }
        else if (hr < 0.32) { y1 = H; y0 = H * (0.26 + rnd() * 0.40); }
      }

      var d = clamp((x - (geo.x0 - 34)) / 96, 0, 1);
      slats.push({
        x: x, w: w, y0: y0, y1: y1, col: col,
        alpha: 0.30 + 0.70 * d,
        rank: clamp((geo.anchor - (x + w / 2)) / (geo.anchor - geo.x0), 0, 1),
        ph: rnd() * 6.28, amp: 0.35 + rnd() * 0.9
      });
      x += w + g;
    }
    /* the solid block that closes the right edge */
    slats.push({ x: geo.vw - 52, w: 120 * BIG, y0: 0, y1: H,
                 col: cssVar('--hero-a-blue', '#253AFF'), alpha: 1, rank: 0, ph: 0, amp: 0.2 });

    /* Accent lines. Always thin and always full height — a wide or
       part-height yellow reads as a second brand colour rather than
       a highlight. Candidates skip the left dissolve and the right
       block; the band is then split into as many segments as there
       are lines and one slat is taken from each, so two reds never
       land side by side. */
    var cand = [];
    for (var ci = 0; ci < slats.length - 1; ci++) {
      if (slats[ci].x > geo.x0 + 60 && slats[ci].x < geo.vw - 30) cand.push(ci);
    }
    function paint(range, colour) {
      var n = range[0] + Math.floor(rnd() * (range[1] - range[0] + 1));
      n = Math.min(n, cand.length);
      var seg = cand.length / n, taken = [];
      for (var k = 0; k < n; k++) {
        var lo = Math.floor(k * seg), hi = Math.max(lo, Math.floor((k + 1) * seg) - 1);
        var pick = lo + Math.floor(rnd() * (hi - lo + 1));
        var idx = cand[pick];
        var sl = slats[idx];
        sl.col = colour;
        sl.w = 2 + rnd() * 6;
        sl.y0 = 0; sl.y1 = H;
        sl.alpha = 1;
        sl.rank = clamp((geo.anchor - (sl.x + sl.w / 2)) / (geo.anchor - geo.x0), 0, 1);
        taken.push(idx);
      }
      cand = cand.filter(function (i) { return taken.indexOf(i) < 0; });
    }
    paint(CFG.red, a2);      /* the scarcer colour picks first */
    paint(CFG.yellow, a1);
  }

  /* A slat is a parallelogram, not a rotated rect: top and bottom
     stay square to the band, only the sides lean. Built as an
     explicit path so the photo can share it as a clip without the
     image itself being sheared. */
  function slatPath(x, y0, y1, w) {
    ctx.beginPath();
    ctx.moveTo(x + (H - y0) * K, y0);
    ctx.lineTo(x + w + (H - y0) * K, y0);
    ctx.lineTo(x + w + (H - y1) * K, y1);
    ctx.lineTo(x + (H - y1) * K, y1);
    ctx.closePath();
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var m = measure();
    cv.width = Math.max(1, Math.round(m.w * dpr));
    cv.height = Math.max(1, Math.round(m.h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  /* ---- loop --------------------------------------------------- */
  var raf = 0, t0 = 0, on = false, visible = true;

  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (!geo) return;

    var el = (now - t0) / 1000 * CFG.speed;
    var cyc = CFG.spread + CFG.hold + CFG.gather + CFG.pause;
    if (REDUCED) el = CFG.spread + CFG.hold * 0.5;
    var tt = el % cyc;
    var idx = Math.floor(el / cyc) % photos.length;

    var p, mode;
    if (tt < CFG.spread) { p = tt / CFG.spread; mode = 0; }
    else if (tt < CFG.spread + CFG.hold) { p = 1; mode = 1; }
    else if (tt < CFG.spread + CFG.hold + CFG.gather) {
      p = 1 - (tt - CFG.spread - CFG.hold) / CFG.gather; mode = 2;
    } else { p = 0; mode = 3; }

    ctx.clearRect(0, 0, geo.vw, H);

    /* photo — left edge wipes open, right edge is fixed, so the
       image never moves while it is being revealed */
    var img = photos[idx];
    if (img && img.complete && img.naturalWidth) {
      var pf = clamp((p - 0.10) / 0.75, 0, 1);
      pf = mode === 2 ? smooth(pf) : easeOutCubic(pf);
      var pl = geo.anchor - (geo.anchor - geo.pl) * pf;
      if (geo.pr - pl > 1) {
        var u = tt / cyc;
        var baseW = (geo.pr + H * K) - geo.pl;
        var zoom = 1.09 + 0.045 * u;
        var dw = baseW * zoom, dh = H * zoom;
        var kbx = (u - 0.5) * 2 * (CFG.drift * 1.6), kby = (u - 0.5) * 2 * 3;
        var dx = geo.pl - (dw - baseW) / 2 + kbx, dy = -(dh - H) / 2 + kby;
        var sA = img.naturalWidth / img.naturalHeight, dA = dw / dh, sw, sh, sx, sy;
        if (sA > dA) { sh = img.naturalHeight; sw = sh * dA; sx = (img.naturalWidth - sw) / 2; sy = 0; }
        else { sw = img.naturalWidth; sh = sw / dA; sx = 0; sy = (img.naturalHeight - sh) / 2; }
        ctx.save();
        slatPath(pl, 0, H, geo.pr - pl);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.restore();
      }
    }

    /* slats */
    for (var i = 0; i < slats.length; i++) {
      var s = slats[i];
      var pi = clamp((p - s.rank * STAG) / (1 - STAG), 0, 1);
      pi = mode === 2 ? smooth(pi) : easeOutQuint(pi);
      var xg = geo.anchor - (geo.anchor - s.x) * COMPRESS;
      var xs = xg + (s.x - xg) * pi;
      if (mode === 0 || mode === 1) xs += Math.sin(el * 0.62 + s.ph) * s.amp * CFG.drift * pi;
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.col;
      slatPath(xs, s.y0, s.y1, s.w * (0.72 + 0.28 * pi));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function start() {
    if (raf) return;
    t0 = performance.now();
    raf = requestAnimationFrame(draw);
  }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  /* ---- switch -------------------------------------------------- */
  function apply(mode, push) {
    on = (mode === 'a');
    document.body.classList.toggle('hero-a', on);
    var links = document.querySelectorAll('.f02-fam [data-hero]');
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('is-on', links[i].getAttribute('data-hero') === (on ? 'a' : 'none'));
      links[i].setAttribute('aria-current', links[i].classList.contains('is-on') ? 'true' : 'false');
    }
    if (on) {
      loadPhotos();
      resize();
      if (visible) start();
    } else {
      stop();
    }
    if (push) {
      /* hash, not a query — history.replaceState is blocked on file:// */
      if (history.replaceState) history.replaceState(null, '', on ? '#hero=a' : '#hero=none');
      else location.hash = on ? 'hero=a' : 'hero=none';
    }
  }

  function fromHash() { return /(?:^|[#&])hero=a\b/.test(location.hash) ? 'a' : 'none'; }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('.f02-fam [data-hero]') : null;
    if (!a) return;
    e.preventDefault();
    apply(a.getAttribute('data-hero'), true);
  });
  window.addEventListener('hashchange', function () { apply(fromHash(), false); });

  /* Repaint on resize; idle while the band is off screen or the
     tab is in the background. */
  var rt = 0;
  window.addEventListener('resize', function () {
    if (!on) return;
    clearTimeout(rt);
    rt = setTimeout(resize, 120);
  });
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    if (on && visible) start(); else stop();
  });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      var seen = es[0].isIntersecting;
      if (on && seen && visible) start();
      else if (!seen) stop();
    }, { threshold: 0 }).observe(hl);
  }

  apply(fromHash(), false);
})();
