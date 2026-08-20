/* ============================================================
   FIBA 3x3 Nations League — app.js
   Behaviour for anything inside a `.live` container.

   No framework, no build. Everything is delegated from document
   level, so cloned or injected markup works without re-init.
   ============================================================ */
(function () {
  'use strict';

  var SLIDE_MS = 4000;

  function closestIn(el, sel, boundary) {
    var n = el;
    while (n && n !== boundary) {
      if (n.matches && n.matches(sel)) return n;
      n = n.parentElement;
    }
    return null;
  }
  function live(el) { return el && el.closest ? el.closest('.live') : null; }

  /* ---------- radio-style groups -----------------------------
     Clicking one item in a group moves the "on" class to it.    */
  var GROUPS = [
    ['.el02-seg',  '.el02',       'el02-on'],
    ['.tab',       '.tabs',       'tab-active'],
    ['.chip',      '.chips',      'chip-on'],
    ['.alpha-i',   '.alpha',      'alpha-on'],
    ['.s03-d',     '.s03, .s03wrap', 's03-on'],
    ['.ntab',      '.tabbar',     'ntab-on'],
    ['.f03-i',     '.f03-list',   'f03-on'],
    ['.pag-i',     '.pag',        'pag-cur'],
    ['.dsel-item', '.dsel-menu',  'dsel-item-sel'],
    ['.acm-row',   '.acm',        'acm-row-sel'],
    ['.stopnav-i', '.stopnav',    'stopnav-on'],
    ['.dotb',      '.dots-int',   'dotb-sel']
  ];

  document.addEventListener('click', function (ev) {
    var scope = live(ev.target);
    if (!scope) return;

    /* -- accordion / disclosure ------------------------------- */
    var head = closestIn(ev.target, '.acc-head, .disc-head', scope);
    if (head) { toggle(head.parentElement); return; }

    /* -- dismissible chip / federation tag -------------------- */
    var x = closestIn(ev.target, '.chip-x, .ftag-x', scope);
    if (x) {
      var host = x.closest('.chip, .ftag');
      if (host) { host.remove(); return; }
    }

    /* -- tooltip ---------------------------------------------- */
    var anchor = closestIn(ev.target, '.tip-anchor, .tip-anchor-t', scope);
    if (anchor && anchor._tip) {
      var show = anchor._tip.hidden;
      anchor._tip.hidden = !show;
      if (anchor._arrow) anchor._arrow.hidden = !show;
      return;
    }
    if (!closestIn(ev.target, '.tip', scope)) {
      [].forEach.call(scope.querySelectorAll('.tip-anchor, .tip-anchor-t'), function (a) {
        if (a._tip) { a._tip.hidden = true; if (a._arrow) a._arrow.hidden = true; }
      });
    }

    /* -- F-03m mobile chrome ---------------------------------- */
    var msearch = closestIn(ev.target, '.f03m-search', scope);
    if (msearch) {
      var mstage = msearch.closest('.f03m-stage') || msearch.parentElement.parentElement;
      var panel = mstage && (mstage.querySelector('.f03m-overlay') || mstage.querySelector('.f03m-searchbar'));
      if (panel) {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) { var mi = panel.querySelector('input'); if (mi) mi.focus(); }
        return;
      }
    }
    var more = closestIn(ev.target, '.ntab', scope);
    if (more && /more/i.test(more.textContent)) {
      var stage = more.closest('.f03m-stage');
      var sheet = stage && stage.querySelector('.f03m-sheet');
      if (sheet) {
        sheet.hidden = false;
        [].forEach.call(stage.querySelectorAll('.ntab'), function (t) { t.classList.remove('ntab-on'); });
        more.classList.add('ntab-on');
        return;
      }
    }
    if (closestIn(ev.target, '.f03m-close', scope)) {
      var sh = ev.target.closest('.f03m-sheet');
      if (sh) {
        sh.hidden = true;
        var st2 = sh.closest('.f03m-stage');
        if (st2) [].forEach.call(st2.querySelectorAll('.ntab'), function (t) {
          t.classList.toggle('ntab-on', /home/i.test(t.textContent));
        });
        return;
      }
    }

    /* -- el-11 clear the search field ------------------------- */
    var clr = closestIn(ev.target, '.search-clear', scope);
    if (clr) {
      var inp = clr.closest('.search').querySelector('.search-in, input');
      if (inp) { inp.value = ''; inp.focus(); }
      return;
    }

    /* -- ctl-08 toggle switch ---------------------------------- */
    /* A switch that carries data-toggle belongs to the page: site.js
       owns both its state and its class, and flipping it here as well
       cancelled the page's own flip. */
    var tgl = closestIn(ev.target, '.tgl', scope);
    if (tgl && tgl.hasAttribute('data-toggle')) tgl = null;
    if (tgl && !tgl.classList.contains('tgl-dis')) {
      var on = !tgl.classList.contains('tgl-on');
      tgl.classList.toggle('tgl-on', on);
      tgl.setAttribute('aria-checked', on ? 'true' : 'false');
      return;
    }

    /* -- checkbox --------------------------------------------- */
    var chk = closestIn(ev.target, '.chk', scope);
    if (chk && !chk.querySelector('.chk-box-off-dis, .chk-box-on-dis')) {
      var box = chk.querySelector('.chk-box');
      if (box) { box.classList.toggle('chk-box-on'); return; }
    }

    /* -- dark select ------------------------------------------ */
    var sel = closestIn(ev.target, '.dsel', scope);
    if (sel && sel._menu) {
      var so = !sel.classList.contains('dsel-open');
      sel.classList.toggle('dsel-open', so);
      sel._menu.hidden = !so;
      return;
    }
    var item = closestIn(ev.target, '.dsel-item', scope);
    if (item) {
      var menu = item.closest('.dsel-menu');
      [].forEach.call(menu.querySelectorAll('.dsel-item'), function (x) { x.classList.remove('dsel-item-on'); });
      item.classList.add('dsel-item-on');
      var trg = menu._trigger;
      if (trg) {
        var lbl = trg.querySelector('.lbl');
        if (lbl) lbl.textContent = item.textContent.trim();
        trg.classList.remove('dsel-open');
        menu.hidden = true;
      }
      return;
    }
    if (!closestIn(ev.target, '.dsel-menu', scope)) {
      [].forEach.call(scope.querySelectorAll('.dsel.dsel-open'), function (d) {
        d.classList.remove('dsel-open'); if (d._menu) d._menu.hidden = true;
      });
    }

    /* -- share menu ------------------------------------------- */
    var trig = closestIn(ev.target, '.shm-trig', scope);
    if (trig && trig._menu) {
      var open = trig.getAttribute('data-open') !== 'true';
      trig.setAttribute('data-open', open ? 'true' : 'false');
      trig._menu.hidden = !open;
      return;
    }
    if (!closestIn(ev.target, '.shm', scope)) {
      [].forEach.call(scope.querySelectorAll('.shm-trig[data-open="true"]'), function (t) {
        t.setAttribute('data-open', 'false'); if (t._menu) t._menu.hidden = true;
      });
    }

    /* -- carousel controls ------------------------------------ */
    var btn = closestIn(ev.target, '.car-btn', scope);
    if (btn && !btn.classList.contains('car-btn-dis')) {
      var car = btn.closest('.car');
      var act = btn.getAttribute('data-car');
      if (act === 'prev') step(car, -1);
      else if (act === 'next') step(car, 1);
      else playPause(car);
      return;
    }
    var dot = closestIn(ev.target, '.ind-d, .ind-prog', scope);
    if (dot && dot.closest('.car')) {
      var c = dot.closest('.car');
      go(c, [].indexOf.call(dot.parentElement.children, dot));
      return;
    }

    /* -- radio groups ----------------------------------------- */
    for (var i = 0; i < GROUPS.length; i++) {
      var g = GROUPS[i], pick = closestIn(ev.target, g[0], scope);
      if (!pick || pick.matches('.el02-dis, .s03-off, .alpha-dis, .pag-dis, .f03-dis, .ntab-dis, .tab-disabled')) continue;
      var box = pick.closest(g[1]) || pick.parentElement;
      [].forEach.call(box.querySelectorAll(g[0]), function (n) { n.classList.remove(g[2]); });
      pick.classList.add(g[2]);
      return;
    }
  });

  /* Enter / Space activate whatever has focus, like a real control. */
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var t = document.activeElement;
    if (!live(t) || !t.matches('[tabindex], button, a')) return;
    ev.preventDefault(); t.click();
  });

  /* ---------- accordion -------------------------------------
     The panel's height is animated rather than switched, so it reads
     as opening rather than appearing. Measure, animate to that
     height, then release to auto — a table that reflows afterwards
     must not end up clipped, and overflow goes back to visible so a
     tooltip near the bottom edge still shows. */
  function panelOf(acc) {
    var head = acc.querySelector(':scope > .acc-head, :scope > .disc-head');
    if (!head) return null;
    var p = head.nextElementSibling;
    while (p && p.classList.contains('cutfill')) p = p.nextElementSibling;
    return p;
  }

  function toggle(acc, force, instant) {
    var was = acc.getAttribute('data-open') === 'true';
    var open = force !== undefined ? force : !was;
    var p = panelOf(acc);
    /* Measured while still open: a closed panel has its padding zeroed
       by CSS, so measuring after the flip would lose 48px and the
       collapse would start with a jump. */
    var from = (p && was) ? p.getBoundingClientRect().height : 0;

    acc.setAttribute('data-open', open ? 'true' : 'false');
    var caret = acc.querySelector('.acc-head svg, .disc-head svg');
    if (caret) caret.style.transform = open ? 'rotate(180deg)' : '';

    if (!p) return;
    if (p._anim) { clearTimeout(p._anim); p._anim = null; }

    if (instant || open === was) {
      p.style.overflow = open ? '' : 'hidden';
      p.style.height = open ? 'auto' : '';     /* '' lets the CSS collapse it */
      return;
    }
    p.style.overflow = 'hidden';
    p.style.height = (open ? 0 : from) + 'px';
    void p.offsetHeight;                       /* commit the start value */
    p.style.height = (open ? p.scrollHeight : 0) + 'px';
    p._anim = setTimeout(function () {
      p._anim = null;
      if (acc.getAttribute('data-open') !== 'true') { p.style.height = ''; return; }
      p.style.height = 'auto';
      p.style.overflow = '';
    }, 400);
  }

  /* The caret comes from whichever specimen state was cloned, so it
     may already point up. Replace it with one known chevron-down and
     let rotation alone express the state. */
  var CHEVRON = '<path d="M480-345 240-585l43-43 197 197 197-197 43 43-240 240Z"/>';
  function normaliseCaret(head) {
    var svgs = head.querySelectorAll('svg');
    var ic = svgs[svgs.length - 1];
    if (!ic || ic._norm) return;
    ic.setAttribute('viewBox', '0 -960 960 960');
    ic.setAttribute('fill', 'currentColor');
    ic.innerHTML = CHEVRON;
    ic._norm = true;
  }

  function initAccordions(root) {
    var groups = [];
    [].forEach.call(root.querySelectorAll('.live .acc, .live .disc'), function (acc) {
      var head = acc.querySelector(':scope > .acc-head, :scope > .disc-head');
      if (!head) return;
      var panel = head.nextElementSibling;
      while (panel && panel.classList.contains('cutfill')) panel = panel.nextElementSibling;
      if (panel) panel.classList.add('acc-panel');
      normaliseCaret(head);
      head.setAttribute('tabindex', '0');
      head.setAttribute('role', 'button');
      if (groups.indexOf(acc.parentElement) === -1) groups.push(acc.parentElement);
      toggle(acc, false, true);
    });
    /* First accordion of each group opens on load, the rest stay closed. */
    groups.forEach(function (g) {
      var first = g.querySelector(':scope > .acc, :scope > .disc');
      if (first) toggle(first, true, true);
    });
  }

  /* ---------- carousel -------------------------------------- */
  function slidesOf(car) { return car.querySelectorAll('.car-stage > .car-slide'); }
  function dotsOf(car) { var ind = car.querySelector('.ind'); return ind ? ind.children : []; }

  function go(car, i) {
    var dots = dotsOf(car), n = dots.length || slidesOf(car).length;
    if (!n) return;
    i = ((i % n) + n) % n;
    car.dataset.i = i;
    var stage = car.querySelector('.car-stage');
    var slide = stage.querySelector('.car-slide');
    if (slide) {
      var gap = parseFloat(getComputedStyle(stage).gap) || 0;
      stage.style.transform = 'translateX(' + (-i * (slide.offsetWidth + gap)) + 'px)';
    }
    var ind = car.querySelector('.ind');
    if (ind) paintInd(ind, i, car.dataset.playing === 'true');
  }
  function step(car, d) { go(car, (parseInt(car.dataset.i, 10) || 0) + d); }

  function playPause(car, force) {
    var playing = force !== undefined ? force : car.dataset.playing !== 'true';
    car.dataset.playing = playing ? 'true' : 'false';
    clearInterval(car._t);
    if (playing) car._t = setInterval(function () { step(car, 1); }, SLIDE_MS);
    var btn = car.querySelector('.car-btn[data-car="playpause"]');
    if (btn) {
      btn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      btn.classList.toggle('car-playing', playing);
    }
    /* Pause holds the running bar at whatever it has reached; repainting
       would snap it back to empty, which reads as a glitch. */
    var running = car.querySelector('.ind .ind-filling');
    if (!playing && running) { running.classList.add('ind-hold'); return; }
    go(car, parseInt(car.dataset.i, 10) || 0);
  }

  function initCarousels(root) {
    [].forEach.call(root.querySelectorAll('.live .car'), function (car) {
      var stage = car.querySelector('.car-stage');
      if (!stage || car._init) return;
      car._init = true;

      /* the stage needs a clipping viewport to slide inside */
      var vp = document.createElement('div');
      vp.className = 'car-viewport';
      stage.parentNode.insertBefore(vp, stage);
      vp.appendChild(stage);

      /* pad the track out to the number of positions the indicator claims */
      var want = dotsOf(car).length, have = slidesOf(car).length;
      for (var k = 0; have && k < want - have; k++) {
        stage.appendChild(slidesOf(car)[k % have].cloneNode(true));
      }

      /* label the controls: one button = play/pause, two = prev/next.
         The specimen marks "previous" disabled at position 0; the live
         carousel wraps, so the control is enabled here. */
      var btns = car.querySelectorAll('.car-btn');
      if (btns.length === 1) {
        btns[0].setAttribute('data-car', 'playpause');
        var ico = btns[0].querySelector('svg');
        if (ico && !btns[0].querySelector('.car-ico-play')) {
          ico.classList.add('car-ico-pause');
          var play = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          play.setAttribute('viewBox', '0 -960 960 960');
          play.setAttribute('width', ico.getAttribute('width') || '24');
          play.setAttribute('height', ico.getAttribute('height') || '24');
          play.setAttribute('fill', 'currentColor');
          play.classList.add('car-ico-play');
          play.innerHTML = '<path d="M320-203v-560l440 280-440 280Z"/>';
          ico.parentNode.insertBefore(play, ico.nextSibling);
        }
      } else if (btns.length > 1) {
        btns[0].setAttribute('data-car', 'prev');
        btns[btns.length - 1].setAttribute('data-car', 'next');
      }
      [].forEach.call(btns, function (b) {
        b.classList.remove('car-btn-dis');
        b.setAttribute('tabindex', '0');
      });

      car.dataset.i = 0;
      playPause(car, btns.length === 1);
    });
  }

  /* ---------- share menu ------------------------------------ */
  function initShareMenus(root) {
    [].forEach.call(root.querySelectorAll('.live .shm-trig'), function (trig) {
      if (trig._menu) return;
      var menu = null, n = trig.nextElementSibling;
      while (n && !menu) {
        menu = n.matches('.shm, .sh') ? n : n.querySelector('.shm');
        n = n.nextElementSibling;
      }
      if (!menu) menu = trig.parentElement.querySelector('.sh, .shm');
      if (!menu || menu.contains(trig)) return;
      trig._menu = menu;
      menu.hidden = true;
      trig.setAttribute('data-open', 'false');
      trig.setAttribute('tabindex', '0');
    });
  }

  /* ---------- dark select ----------------------------------- */
  function initSelects(root) {
    [].forEach.call(root.querySelectorAll('.live .dsel'), function (sel) {
      if (sel._menu) return;
      var menu = sel.parentElement.querySelector('.dsel-menu');
      if (!menu) return;
      /* the dark select's focus ring is drawn by the cut-aware border,
         which needs the fill layer present in the markup */
      if (sel.classList.contains('cut') && !sel.querySelector(':scope > .cutfill')) {
        sel.classList.add('cut-out');
        var f = document.createElement('div');
        f.className = 'cutfill';
        sel.insertBefore(f, sel.firstChild);
      }
      sel._menu = menu; menu._trigger = sel;
      menu.hidden = !sel.classList.contains('dsel-open');
      sel.classList.remove('dsel-open');
      menu.hidden = true;
      sel.setAttribute('tabindex', '0');
    });
  }

  /* ---------- tooltip --------------------------------------- */
  function initTooltips(root) {
    [].forEach.call(root.querySelectorAll('.live .tipwrap'), function (w) {
      var anchor = w.querySelector('.tip-anchor, .tip-anchor-t');
      var tip = w.querySelector('.tip');
      if (!anchor || !tip || anchor._tip) return;
      anchor._tip = tip;
      anchor._arrow = w.querySelector('.tip-arrow');
      tip._anchored = true;
      tip.hidden = true;
      if (anchor._arrow) anchor._arrow.hidden = true;
      anchor.setAttribute('tabindex', '0');
      anchor.setAttribute('role', 'button');
    });
  }

  /* ---------- el-22 CarouselIndicator ------------------------
     One bar fills at a time. The bar for the slide on screen runs
     0 to 100% over that slide's own duration; every other bar sits
     empty, including the ones already seen. A row of bars that
     stays filled behind the playhead reads as a progress meter for
     the whole set, which is not what it measures.

     Every bar is a track with a fill layer, so the animation can
     move from one to the next rather than living on a single
     designated bar — which is what left the third bar permanently
     black once the carousel had passed it.                       */
  function indBars(ind) {
    return [].filter.call(ind.children, function (c) {
      return c.classList.contains('ind-d') || c.classList.contains('ind-prog');
    });
  }

  function indDots(ind) {
    return [].filter.call(ind.children, function (c) {
      return c.classList.contains('ind-dot');
    });
  }

  /* Give every bar a fill layer and clear the static states the
     specimen markup carries, so the live indicator starts clean. */
  function prepInd(ind) {
    if (ind._prepped) return;
    ind._prepped = true;
    indBars(ind).forEach(function (b) {
      b.classList.remove('ind-d-on');
      if (!b.querySelector('.ind-fill')) {
        var f = document.createElement('div');
        f.className = 'ind-fill';
        b.appendChild(f);
      }
      b.querySelector('.ind-fill').removeAttribute('style');
    });
  }

  function paintInd(ind, i, playing) {
    prepInd(ind);
    indBars(ind).forEach(function (b, k) {
      fillBar(b.querySelector('.ind-fill'), k === i, playing);
    });
    indDots(ind).forEach(function (d, k) {
      d.classList.toggle('ind-dot-on', k === i);
    });
  }

  /* Restart the fill by removing the class and forcing a reflow —
     re-triggering a transition depends on a style flush landing
     between two frames, which is why it sometimes jumped to full. */
  function fillBar(fill, active, playing) {
    if (!fill) return;
    fill.classList.remove('ind-filling', 'ind-hold');
    fill.style.width = '0%';
    if (!active) return;
    void fill.offsetWidth;
    fill.style.removeProperty('width');
    fill.style.setProperty('--ind-dur', SLIDE_MS + 'ms');
    fill.classList.add('ind-filling');
    if (!playing) fill.classList.add('ind-hold');
  }

  /* ---------- standalone indicator (el-22) -------------------
     A CarouselIndicator documented on its own still has to show
     what auto-advance looks like, so it runs its own loop.     */
  function initIndicators(root) {
    [].forEach.call(root.querySelectorAll('.live .ind'), function (ind) {
      if (ind.closest('.car') || ind._t) return;
      var n = indBars(ind).length || indDots(ind).length;
      if (!n) return;
      var i = 0;
      paintInd(ind, i, true);
      ind._t = setInterval(function () {
        i = (i + 1) % n;
        paintInd(ind, i, true);
      }, SLIDE_MS);
    });
  }

  /* ---------- scroll reveal --------------------------------- */
  function initReveal(root) {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    [].forEach.call(root.querySelectorAll('.reveal'), function (n) { io.observe(n); });
  }

  /* ---------- focusability ---------------------------------- */
  function initFocus(root) {
    var sel = '.live .btn, .live .lnk, .live .tab, .live .chip, .live .card-int,' +
              '.live .pag-i, .live .ntab, .live .alpha-i, .live .f03-i, .live .el02-seg,' +
              '.live .trow, .live .e09-cell, .live .acm-row, .live .s03-d, .live .ftag,' +
              '.live .f06-link, .live .f06-sponlogos > *, .live .f06-social > *,' +
              '.live .lb-act, .live .lb-tile, .live .crumb:not(.crumb-cur), .live .e10-row,' +
              '.live .s05-row, .live .s06-side, .live .r01-row, .live .c02-card, .live .c04-row,' +
              '.live .stopnav-i, .live .dotb, .live .el02-seg, .live .btn, .live .wl';
    [].forEach.call(root.querySelectorAll(sel), function (n) {
      if (!n.hasAttribute('tabindex')) n.setAttribute('tabindex', '0');
    });
  }

  function init(root) {
    root = root || document;
    initAccordions(root);
    initCarousels(root);
    initShareMenus(root);
    initSelects(root);
    initTooltips(root);
    initIndicators(root);
    initFocus(root);
    initReveal(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else { init(); }

  /* Pages that list many accordions want one open at a time; the shell
     itself stays neutral about that, so it exposes the close. */
  window.FIBA = {
    init: init,
    closeAccordion: function (acc) { toggle(acc, false); },
    openAccordion: function (acc) { toggle(acc, true); }
  };
})();
