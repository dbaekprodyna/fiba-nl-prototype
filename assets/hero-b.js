/* ============================================================
   FIBA 3x3 Nations League — hero-b.js
   Hero B: cut-out chevrons gathered over the photo, spreading
   left and right to open it, holding while the paint runs, then
   closing back over the centre as the next photo swaps in.

   The chevrons are built here rather than imported from
   Hero B.svg. The drawn file was hand-traced, so every ribbon
   ended somewhere inside the 256px band — and a white ribbon
   that stops on top of a blue one leaves a slice of blue
   showing where the stroke simply gives up. Built as ribbons
   along a shared zigzag spine they run past both edges, nest
   exactly, and — the reason that matters most — the innermost
   white ribbon's own edge can be handed to the photo as a clip,
   so the photo ends on the zigzag instead of on a square cut.

   Nothing runs until hero-switch.js broadcasts hero:change with
   mode "b".
   ============================================================ */
(function () {
  'use strict';

  var CFG = {
    photoW:  455,     /* the window the artwork is built around —
                         nothing is scaled, so this is fixed at
                         every viewport                            */
    spread:  1.80,    /* s — pieces travel out, photo opens        */
    hold:    5.00,    /* s — photo held, paint runs                */
    gather:  0.50,    /* s — pieces close back over the centre     */
    pause:   0.12,    /* s — covered; the photo swaps here         */
    speed:   1.00,
    drift:   3.0,     /* px of slow sway during the hold           */
    boil:    1.9,     /* px each piece is re-placed by, every frame */
    tilt:    0.85,    /* deg each piece is re-angled by, every frame */
    fps:     10,      /* THE WHOLE CLOCK runs at this rate. Travel,
                         the reveal and the paint all advance in
                         whole frames — nothing is interpolated,
                         which is the only way it reads as stop
                         motion rather than as a tween.            */
    zoomFrom: 1.08,   /* Ken Burns: a real push in across the hold */
    zoomTo:   1.22,
    panX:     11,
    panY:      5
  };

  var PHOTOS = [
    'assets/hero-b/hero-b-1.jpg?v=1', 'assets/hero-b/hero-b-2.jpg?v=1',
    'assets/hero-b/hero-b-3.jpg?v=1', 'assets/hero-b/hero-b-4.jpg?v=1',
    'assets/hero-b/hero-b-5.jpg?v=1', 'assets/hero-b/hero-b-6.jpg?v=1',
    'assets/hero-b/hero-b-7.jpg?v=1'
  ];

  /* ---- the zigzag ---------------------------------------------
     One spine, shared. Every ribbon turns at the same heights, so
     the cluster nests instead of tangling, and the arrowheads line
     up into the single motif the concept reads as. The run starts
     well above the band and ends well below it: no ribbon may show
     an end inside 0–256. */
  var TURNS = [-82, -16, 50, 116, 182, 248, 314];
  var SIDE  = [  1,  -1,  1,  -1,   1,  -1,   1];  /* +1 = rightmost */
  /* The swing widens outward, so a cluster fans rather than reading
     as one rigid comb. Small step, so the gaps between neighbours
     stay open at the turns. */
  var AMP_IN = 24, AMP_OUT = 31;

  /* Colour keys: b blue, w white, y yellow, r red.
     Three yellow lines and two red ones across both clusters,
     always thin — they are highlights, not a third brand colour.
     `gap` is the white space to the next ribbon outward. */
  var LEFT = [                       /* innermost first, going out */
    { c: 'w', w: 34, gap:  0 },      /* the one the photo ends on  */
    { c: 'b', w: 34, gap:  5 },      /* thick blue hugging it      */
    { c: 'w', w: 10, gap:  4 },
    { c: 'y', w:  5, gap:  4 },
    { c: 'r', w:  4, gap:  3 },
    { c: 'b', w:  8, gap:  5 },
    { c: 'w', w: 20, gap:  4 },
    { c: 'b', w:  5, gap: 16 },
    { c: 'b', w: 26, gap: 30 }       /* the outermost, across a gap */
  ];
  var RIGHT = [
    { c: 'w', w: 34, gap:  0 },      /* the one the photo ends on  */
    { c: 'b', w: 32, gap:  5 },
    { c: 'r', w:  4, gap:  5 },
    { c: 'y', w:  5, gap:  3 },
    { c: 'w', w: 16, gap:  4 },
    { c: 'b', w:  8, gap:  5 },
    { c: 'w', w: 22, gap:  4 },
    { c: 'b', w: 36, gap:  8 },
    { c: 'y', w:  5, gap:  6 },
    { c: 'b', w: 10, gap:  8 },
    { c: 'b', w: 46, gap: 22 }
  ];
  var BASE_L = 22;    /* spine centre of the innermost left ribbon  */
  var BASE_R = 437;   /* …and of the innermost right one            */

  /* Paint runs. i is the piece they hang off, so they travel with
     it; x is where they leave it, len how far they get. */
  /* Paint runs.
     Paint leaves a downward-facing edge, and on a near-vertical
     zigzag the only downward-facing edges are the outer sides of
     the arms descending from each point. `turn` picks the point
     (2 and 4 point right inside the band, 3 points left) and `s` is
     how far down that arm the paint left — 0 is the point itself.

     They are placed where there is somewhere to run TO: off the two
     innermost ribbons, where the photo is open underneath, and off
     the outer edge of each cluster, where nothing is. Dropped into
     one of the 4–6px channels between two ribbons the paint would
     hit the next arm within a few pixels and read as a stub. `c`
     overrides the colour where the ribbon it leaves is white and the
     run would otherwise vanish — blue and yellow over the photo, as
     the concept has it. */
  var DRIPS = [
    /* over the photo, off the two ribbons that frame it */
    { side: 'L', i:  0, turn: 2, s: 0.08, len: 48, w: 7, c: 'b' },
    { side: 'L', i:  0, turn: 2, s: 0.30, len: 26, w: 5, c: 'b' },
    { side: 'L', i:  0, turn: 4, s: 0.12, len: 40, w: 6, c: 'y' },
    { side: 'R', i:  0, turn: 3, s: 0.08, len: 44, w: 7, c: 'b' },
    { side: 'R', i:  0, turn: 3, s: 0.30, len: 24, w: 5, c: 'b' },
    { side: 'R', i:  0, turn: 5, s: 0.14, len: 30, w: 5, c: 'y' },
    /* off the outer edge of each cluster, into open white */
    { side: 'L', i:  8, turn: 3, s: 0.08, len: 46, w: 7 },
    { side: 'L', i:  8, turn: 3, s: 0.34, len: 26, w: 5 },
    { side: 'L', i:  8, turn: 1, s: 0.18, len: 34, w: 6 },
    { side: 'L', i:  7, turn: 3, s: 0.10, len: 32, w: 5 },
    { side: 'R', i: 10, turn: 2, s: 0.10, len: 44, w: 7 },
    { side: 'R', i: 10, turn: 2, s: 0.38, len: 24, w: 5 },
    { side: 'R', i: 10, turn: 4, s: 0.16, len: 36, w: 6 },
    { side: 'R', i:  9, turn: 2, s: 0.12, len: 26, w: 5 }
  ];

  /* Where the composition sits. The photo's left edge is pinned to
     53.5% across the 1440 content column — the proportion in the
     concept — but never so far left that the chevrons reach the
     headline, which is 445px wide. */
  var PHOTO_AT = 0.5354;
  var CLEAR_OF_LOGO = 682;
  var STAG = 0.35;           /* share of the spread the stagger eats */
  var OVERHANG = 40;         /* how far past the window the gathered
                                pack reaches, each side              */
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- helpers ------------------------------------------------ */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  /* Deterministic noise per (piece, frame). Every frame each piece is
     laid down again a hair off where it was — the hand-placed wobble
     that separates cut-out from a tween. Not a sine: a sine is smooth
     motion sampled coarsely, this is a new position each frame. */
  function boil(i, f) {
    var t = Math.sin(i * 127.1 + f * 311.7) * 43758.5453;
    return t - Math.floor(t) - 0.5;
  }
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  /* ---- DOM — owned by hero-switch.js --------------------------- */
  var HERO = window.HERO;
  if (!HERO) return;
  var hl = HERO.band, cv = HERO.canvas;
  var ctx = cv.getContext('2d');

  /* ---- photos ------------------------------------------------- */
  var photos = null;
  function loadPhotos() {
    if (photos) return;
    photos = PHOTOS.map(function (src) { var im = new Image(); im.src = src; return im; });
  }

  /* ---- build the pieces --------------------------------------- */
  var built = false, H = 256, PIECES = [], edgeL = null, edgeR = null;

  function ribbon(base, w, AMP) {
    /* Offset horizontally rather than perpendicular: it keeps every
       turn at the same height as the spine's, which is what gives
       the chevron its sharp point on the outside and its clean
       notch on the inside. */
    var p = new Path2D(), i, x;
    for (i = 0; i < TURNS.length; i++) {
      x = base + AMP * SIDE[i] - w / 2;
      if (i === 0) p.moveTo(x, TURNS[i]); else p.lineTo(x, TURNS[i]);
    }
    for (i = TURNS.length - 1; i >= 0; i--) {
      p.lineTo(base + AMP * SIDE[i] + w / 2, TURNS[i]);
    }
    p.closePath();
    return p;
  }
  function edge(base, w, sign, AMP) {
    /* One side of a ribbon as a polyline — the photo's boundary. */
    return TURNS.map(function (y, i) {
      return { x: base + AMP * SIDE[i] + sign * w / 2, y: y };
    });
  }

  function prep() {
    if (built) return;
    built = true;
    var col = {
      b: cssVar('--hero-blue', '#253AFF'),
      y: cssVar('--hero-yellow', '#E8B33D'),
      r: cssVar('--hero-red', '#C32440'),
      w: '#FFFFFF'
    };

    function cluster(list, base0, dir) {
      var out = [], base = base0, prev = null, n = list.length;
      list.forEach(function (d, k) {
        if (k > 0) base += dir * ((prev.w + d.w) / 2 + d.gap);
        prev = d;
        var amp = AMP_IN + (AMP_OUT - AMP_IN) * (k / (n - 1));
        out.push({
          k: k, c: d.c, w: d.w, base: base, amp: amp, fill: col[d.c],
          path: ribbon(base, d.w, amp),
          x0: base - amp - d.w / 2,
          x1: base + amp + d.w / 2
        });
      });
      return out;
    }
    var left = cluster(LEFT, BASE_L, -1);
    var right = cluster(RIGHT, BASE_R, 1);

    /* The photo stops on the inner white ribbon's outer edge, so the
       ribbon lies on the photo and the picture ends on a zigzag. It
       also means nothing can leak: right of that line the ribbon
       covers the photo completely, left of it there is no photo. */
    edgeL = { piece: left[0], pts: edge(left[0].base, left[0].w, -1, left[0].amp) };
    edgeR = { piece: right[0], pts: edge(right[0].base, right[0].w, +1, right[0].amp) };

    PIECES = left.concat(right);
    PIECES.forEach(function (p, i) {
      p.i = i;
      p.cx = (p.x0 + p.x1) / 2;
      p.ph = (i * 2.399) % 6.283;
      p.amp = 0.45 + ((i * 7919) % 100) / 100 * 0.8;
    });

    /* Left and right gather into their own half of the window, in
       order, so every piece travels straight out and none cross. */
    function tile(list, from, to) {
      var span = to - from;
      list.forEach(function (p, k) {
        p.gx = from + (k + 0.5) / list.length * span - p.cx;
      });
    }
    tile(left.slice().reverse(), -OVERHANG, CFG.photoW / 2);
    tile(right, CFG.photoW / 2, CFG.photoW + OVERHANG);

    var far = 1;
    PIECES.forEach(function (p) { far = Math.max(far, Math.abs(p.cx - CFG.photoW / 2)); });
    PIECES.forEach(function (p) { p.rank = Math.abs(p.cx - CFG.photoW / 2) / far; });

    DRIPS.forEach(function (d, i) {
      var pc = (d.side === 'L' ? left : right)[d.i];
      var dir = SIDE[d.turn];
      var run = TURNS[d.turn + 1] - TURNS[d.turn];
      d.piece = pc;
      d.fill = d.c ? col[d.c] : pc.fill;
      /* walk from the outer corner of the point down along the arm */
      d.x = pc.base + dir * (pc.amp + pc.w / 2) - dir * 2 * pc.amp * d.s;
      /* and start 4px inside the ink, so the run grows out of the
         shape rather than butting against its edge */
      d.y = TURNS[d.turn] + run * d.s - 4;
      d.seed = i * 0.37;

      /* How far it can actually get. Below a point the space is a
         wedge: the next ribbon over runs its own arm underneath and
         would swallow the rest of the paint. Rather than tune every
         length by hand against the tables, each run is cut where
         that arm crosses it — so retuning a gap above cannot leave a
         drip buried. */
      var room = 1e9;
      (d.side === 'L' ? left : right).concat(d.side === 'L' ? right : left)
        .forEach(function (q) {
          if (q === pc) return;
          var Xq = q.base + dir * (q.amp + q.w / 2);
          var t = ((Xq - d.x) * dir) / (2 * q.amp);
          if (t <= 0 || t > 1) return;
          room = Math.min(room, TURNS[d.turn] + run * t - d.y);
        });
      d.len = Math.max(10, Math.min(d.len, room - 3));
    });
  }

  /* ---- geometry ----------------------------------------------- */
  var geo = null;
  function layout() {
    var m = HERO.measure();
    H = m.h;
    var want = m.cx + m.cw * PHOTO_AT;
    geo = { vw: m.w, px: Math.max(want, m.cx + CLEAR_OF_LOGO) };
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var m = HERO.measure();
    cv.width = Math.max(1, Math.round(m.w * dpr));
    cv.height = Math.max(1, Math.round(m.h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  /* ---- loop --------------------------------------------------- */
  var raf = 0, t0 = 0, on = false, visible = true;

  function place(p) {                 /* a piece's own frame */
    ctx.translate(p.cx + p.dx, H / 2 + p.dy);
    ctx.rotate(p.rot);
    ctx.translate(-p.cx, -H / 2);
  }
  /* A run of paint: a little wider where it left the shape than
     where it stopped, with the bead of paint that gathers at the
     end. A plain round-capped line reads as a rule, not as paint. */
  function runPaint(x, y, len, w, fill) {
    var wEnd = w * 0.55, y1 = y + len;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + wEnd / 2, y1);
    ctx.lineTo(x - wEnd / 2, y1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y1, wEnd * 0.95, 0, 6.2832);
    ctx.fill();
  }
  function halfPlane(e, sign) {       /* everything to one side of an edge */
    var far = sign * 4000;
    ctx.beginPath();
    ctx.moveTo(e.pts[0].x, e.pts[0].y - 200);
    e.pts.forEach(function (q) { ctx.lineTo(q.x, q.y); });
    ctx.lineTo(e.pts[e.pts.length - 1].x, e.pts[e.pts.length - 1].y + 200);
    ctx.lineTo(far, e.pts[e.pts.length - 1].y + 200);
    ctx.lineTo(far, e.pts[0].y - 200);
    ctx.closePath();
  }

  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (!geo || !photos) return;

    var raw = (now - t0) / 1000 * CFG.speed;
    /* Quantise once, here. Everything below reads `el`, so the piece
       advances in tenths of a second and never between them. The
       photo's own push-in is the exception — a camera move is not a
       paper cut-out, and stepping it only looks like dropped frames. */
    var fr = Math.floor(raw * CFG.fps);
    var el = fr / CFG.fps;
    var cyc = CFG.spread + CFG.hold + CFG.gather + CFG.pause;
    if (REDUCED) { el = CFG.spread + CFG.hold * 0.5; raw = el; fr = 0; }
    var tt = el % cyc;
    var idx = Math.floor(el / cyc) % photos.length;

    var p, mode, th = 0;
    if (tt < CFG.spread) { p = tt / CFG.spread; mode = 0; }
    else if (tt < CFG.spread + CFG.hold) { p = 1; mode = 1; th = tt - CFG.spread; }
    else if (tt < CFG.spread + CFG.hold + CFG.gather) {
      p = 1 - (tt - CFG.spread - CFG.hold) / CFG.gather; mode = 2; th = CFG.hold;
    } else { p = 0; mode = 3; }

    ctx.clearRect(0, 0, geo.vw, H);

    /* ---- where every piece is this frame ------------------------ */
    var i, pc, pi;
    for (i = 0; i < PIECES.length; i++) {
      pc = PIECES[i];
      pi = clamp((p - pc.rank * STAG) / (1 - STAG), 0, 1);
      pi = mode === 2 ? smooth(pi) : easeOutQuart(pi);
      var dxs = pc.gx * (1 - pi);
      if (mode === 0 || mode === 1) {
        dxs += Math.sin(el * 1.15 + pc.ph) * pc.amp * CFG.drift * pi;
      }
      pc.dx = dxs + boil(i, fr) * CFG.boil;
      pc.dy = boil(i + 41, fr) * CFG.boil * 0.55;
      pc.rot = boil(i + 97, fr) * CFG.tilt * (Math.PI / 180);
      pc.pi = pi;
    }

    var base = ctx.getTransform ? ctx.getTransform() : null;
    ctx.save();
    ctx.translate(geo.px, 0);   /* 0,0 is now the photo window's top-left */
    var world = ctx.getTransform ? ctx.getTransform() : null;

    /* ---- photo -------------------------------------------------
       Three clips, intersected: the two zigzag edges — each taken in
       its own ribbon's frame, so it wobbles with the ribbon and the
       seam never opens — and the curtain, which is what actually
       animates the reveal outward from the centre. */
    var img = photos[idx];
    if (img && img.complete && img.naturalWidth && world) {
      var rp = clamp((p - 0.12) / 0.78, 0, 1);
      rp = mode === 2 ? smooth(rp) : easeOutCubic(rp);
      if (rp > 0.002) {
        ctx.save();
        ctx.save(); place(edgeL.piece); halfPlane(edgeL, 1); ctx.restore(); ctx.clip();
        ctx.save(); place(edgeR.piece); halfPlane(edgeR, -1); ctx.restore(); ctx.clip();
        var mid = CFG.photoW / 2, half = 300 * rp;
        ctx.beginPath(); ctx.rect(mid - half, 0, half * 2, H); ctx.clip();

        var u = (raw % cyc) / cyc;                     /* smooth, not stepped */
        var zoom = CFG.zoomFrom + (CFG.zoomTo - CFG.zoomFrom) * u;
        var dw = CFG.photoW * zoom, dh = H * zoom;
        var kbx = (u - 0.5) * 2 * CFG.panX, kby = (u - 0.5) * 2 * CFG.panY;
        var dx = -(dw - CFG.photoW) / 2 + kbx, dy = -(dh - H) / 2 + kby;
        var sA = img.naturalWidth / img.naturalHeight, dA = dw / dh, sw, sh, sx, sy;
        if (sA > dA) { sh = img.naturalHeight; sw = sh * dA; sx = (img.naturalWidth - sw) / 2; sy = 0; }
        else { sw = img.naturalWidth; sh = sw / dA; sx = 0; sy = (img.naturalHeight - sh) / 2; }
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.restore();
      }
    }

    /* ---- chevrons ----------------------------------------------- */
    for (i = 0; i < PIECES.length; i++) {
      pc = PIECES[i];
      ctx.save();
      place(pc);
      ctx.fillStyle = pc.fill;
      ctx.fill(pc.path);
      ctx.restore();
    }

    /* ---- paint runs --------------------------------------------
       Last, over everything. Paint that ran did so after the shapes
       were down, and drawn underneath they were simply covered by
       the ribbon they were supposed to be leaving. Each starts at a
       different point in the hold and eases out, so it slows as it
       goes. Only the translation of its ribbon is followed, not the
       rotation — paint runs down, whatever the paper is doing. */
    if (mode === 1 || mode === 2) {
      ctx.globalAlpha = mode === 2 ? clamp(p * 2, 0, 1) : 1;
      for (i = 0; i < DRIPS.length; i++) {
        var d = DRIPS[i];
        var delay = ((d.seed + idx * 0.13) % 1) * 0.30 * CFG.hold;
        var dp = clamp((th - delay) / (0.45 * CFG.hold), 0, 1);
        if (dp <= 0.05) continue;
        runPaint(d.x + d.piece.dx, d.y + d.piece.dy,
                 d.len * easeOutQuart(dp), d.w, d.fill);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function start() { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(draw); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  /* ---- on/off -------------------------------------------------- */
  function apply(mode) {
    on = (mode === 'b');
    if (on) { prep(); loadPhotos(); resize(); if (visible) start(); }
    else stop();
  }
  document.addEventListener('hero:change', function (e) { apply(e.detail.mode); });

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

  apply(HERO.mode());
})();
