/* ============================================================
   FIBA 3x3 Nations League — mobile5.js
   Round five's phone behaviour. Four things the layer cannot do
   in CSS alone:

     1  Filter        every filter control on a page folds behind
                      one button, the gender switch excepted
     2  Sticky tables the width of each table's first column, so
                      the second one knows where to pin
     3  Qualification twelve rows, then More
     4  Photos        a thumb moves the carousel, and moving it
                      stops the slideshow

   Nothing here may change the desktop. The Filter wrapper is
   display:contents above 767px, so the controls stay direct
   children of the row they were in; the row cap and the swipe
   handlers are both gated on the media query.
   ============================================================ */
(function () {
  'use strict';

  var PHONE = window.matchMedia('(max-width: 767px)');
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function svg(path, cls) {
    return '<svg class="' + (cls || '') + '" fill="currentColor" height="20" ' +
           'viewBox="0 -960 960 960" width="20" aria-hidden="true"><path d="' + path + '"></path></svg>';
  }
  var I_FILTER = 'M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Z';
  var I_CHEV   = 'M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z';

  /* ---------- 1  the Filter button --------------------------
     The controls are not moved out of their row: they are wrapped
     where they stand, and the wrapper is transparent on a
     desktop. Anything that is the page's subject rather than a
     narrowing of it — the gender switch, a search field, a tab
     bar, a count — is left where it is. */
  function filters() {
    var host = $('.tpl-content');
    if (!host) return;
    var items = $$('.el03, .selwrap, .tblbar > .tgl', host).filter(function (n) {
      return !n.closest('.mfilt') && !n.closest('.mnav') && !n.closest('.site-ovl');
    });
    if (!items.length) return;

    /* One button to a section, not one to a row. Standings keeps the
       conference field in the search row and the qualification toggle
       in the table's own bar; two buttons stacked on each other read
       as a mistake, so the controls of one section share the first
       one and the rest of the wrappers carry a hidden button. */
    var sections = [];
    items.forEach(function (n) {
      var sec = n.closest('.tpl-sub') || n.closest('.tpl-content');
      var g = sections.filter(function (x) { return x.sec === sec; })[0];
      if (!g) { g = { sec: sec, parents: [] }; sections.push(g); }
      var p = g.parents.filter(function (x) { return x.parent === n.parentElement; })[0];
      if (!p) { p = { parent: n.parentElement, list: [] }; g.parents.push(p); }
      p.list.push(n);
    });

    sections.forEach(function (g) {
      var panels = [];
      var first = null;

      g.parents.forEach(function (p, i) {
        var wrap = document.createElement('div');
        wrap.className = 'mfilt';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mfilt-btn' + (i ? ' mfilt-btn-quiet' : '');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = svg(I_FILTER, 'mfilt-ico') +
                        '<span class="mfilt-l">Filter</span>' +
                        svg(I_CHEV, 'mfilt-chev');

        var panel = document.createElement('div');
        panel.className = 'mfilt-panel';

        p.parent.insertBefore(wrap, p.list[0]);
        wrap.appendChild(btn);
        wrap.appendChild(panel);
        p.list.forEach(function (n) { panel.appendChild(n); });

        panels.push(wrap);
        if (!first) first = btn;
      });

      /* Open and shut is a class on the wrapper, not the hidden
         attribute: the UA sheet's [hidden] carries !important, which
         beat the display:contents that keeps the desktop untouched. */
      first.addEventListener('click', function () {
        var open = !panels[0].classList.contains('is-open');
        panels.forEach(function (w) { w.classList.toggle('is-open', open); });
        first.classList.toggle('is-open', open);
        first.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* ---------- 2  where the second column pins ----------------
     Standings pins federation + conference, a game list pins time
     + home, the box score pins number + name. Each table's first
     column is a different width, so each one carries its own. */
  function stick() {
    $$('.tbl, .acc-body').forEach(function (t) {
      var row = t.querySelector(':scope > .thead') || t.querySelector(':scope > .trow');
      if (!row) return;
      var first = row.children[0];
      if (!first) return;
      var w = Math.round(first.getBoundingClientRect().width);
      if (w > 0) t.style.setProperty('--stick1', w + 'px');
    });
  }

  /* ---------- 3  twelve qualifiers, then More ---------------- */
  var CAP = 12;
  function qualification() {
    var list = $('.tpl-colR .r01') || $('.r01.r01-compact');
    if (!list || list._m5) return;
    if ($$(':scope > .r01-row', list).length <= CAP) return;
    list._m5 = true;

    /* The cap is a class on the list rather than the hidden attribute
       on twenty nodes: site.js repaints those rows whenever the gender
       switch moves, and a class survives that. The rule itself lives
       inside the phone's media query, so a desktop is never capped. */
    list.classList.add('is-capped');

    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'r01-more';
    more.innerHTML = '<span class="r01-more-l">More</span>' + svg(I_CHEV, '');
    list.parentNode.insertBefore(more, list.nextSibling);

    more.addEventListener('click', function () {
      var capped = list.classList.toggle('is-capped');
      more.classList.toggle('is-open', !capped);
      $('.r01-more-l', more).textContent = capped ? 'More' : 'Less';
    });
  }

  /* ---------- 4  a thumb moves the photos -------------------
     app.js slides the stage with translateX and keeps the el-22
     indicator in step, so the rail is not turned into a
     scroll-snap track here — a swipe is translated into the click
     the indicator already understands. Swiping also pauses: a
     picture you have just reached for should not slide away. */
  var MIN = 40;
  function carousels() {
    $$('.car').forEach(function (car) {
      var vp = $('.car-viewport', car);
      if (!vp || car._m5) return;
      car._m5 = true;

      var x0 = 0, y0 = 0, live = false;
      vp.addEventListener('touchstart', function (e) {
        if (!PHONE.matches || e.touches.length !== 1) return;
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; live = true;
      }, { passive: true });

      vp.addEventListener('touchend', function (e) {
        if (!live) return;
        live = false;
        var t = e.changedTouches[0];
        var dx = t.clientX - x0, dy = t.clientY - y0;
        if (Math.abs(dx) < MIN || Math.abs(dx) < Math.abs(dy)) return;

        /* stop the slideshow first, so the slide the swipe lands on
           is the one that stays on screen */
        var pp = $('.car-btn[data-car="playpause"]', car);
        if (pp && car.dataset.playing === 'true') pp.click();

        var ind = $('.ind', car);
        var stops = ind ? ind.children : [];
        if (!stops.length) return;
        var i = parseInt(car.dataset.i, 10) || 0;
        var n = stops.length;
        var next = ((i + (dx < 0 ? 1 : -1)) % n + n) % n;
        stops[next].click();
      }, { passive: true });
    });
  }

  function init() {
    filters();
    qualification();
    carousels();
    stick();
  }

  /* site.js loads eight JSON files before it renders a page and
     stamps body[data-rendered] when it is done. Wrapping a filter
     before that stamp lands would move a control site.js is still
     looking for by its parent — teams.html builds its count row from
     `.tpl-sub > .el03` — so this file waits for the stamp. */
  function whenRendered(fn) {
    if (document.body && document.body.dataset.rendered) { fn(); return; }
    var tries = 0;
    var t = setInterval(function () {
      if ((document.body && document.body.dataset.rendered) || ++tries > 120) {
        clearInterval(t);
        fn();
      }
    }, 50);
  }

  function boot() {
    whenRendered(function () {
      init();
      requestAnimationFrame(function () { init(); stick(); });
      setTimeout(init, 500);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('resize', function () {
    clearTimeout(window._m5r);
    window._m5r = setTimeout(stick, 150);
  });
})();
