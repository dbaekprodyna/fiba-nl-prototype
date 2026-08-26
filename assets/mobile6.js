/* ============================================================
   FIBA 3x3 Nations League — mobile6.js
   Round six's phone behaviour. One thing the layer cannot do in
   CSS alone:

     1  el-20's panel holds the standings AND the link out to the
        conference. The panel is what scrolls sideways, so the
        link rode away with the table. The rows are wrapped in a
        scroller of their own and the actions are left behind.

   Nothing here runs above 767px, and the wrapper is only ever
   added inside .acc-body — no other module's DOM is touched.
   ============================================================ */
(function () {
  'use strict';

  var PHONE = window.matchMedia('(max-width: 767px)');
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- 1  the accordion's own scroller ---------------- */
  function railAccordions() {
    if (!PHONE.matches) return;
    $$('.acc-body').forEach(function (body) {
      if (body.querySelector(':scope > .mscroll')) return;
      var rows = Array.prototype.filter.call(body.children, function (n) {
        return n.classList.contains('thead') || n.classList.contains('trow') ||
               n.classList.contains('games-day');
      });
      if (rows.length < 2) return;
      var rail = document.createElement('div');
      rail.className = 'mscroll';
      body.insertBefore(rail, rows[0]);
      rows.forEach(function (r) { rail.appendChild(r); });
    });
  }

  /* The scroller changes what the first column is measured
     inside, so round five's --stick1 is re-read on the new
     parent. Only the first column pins now, so the value is only
     needed for tables round five already stamped. */
  function boot() {
    railAccordions();
    requestAnimationFrame(railAccordions);
    setTimeout(railAccordions, 600);
  }

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { whenRendered(boot); });
  } else {
    whenRendered(boot);
  }
  /* An accordion that is opened for the first time paints its rows
     then; the observer catches those without polling for ever. */
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest || !ev.target.closest('.acc-head')) return;
    setTimeout(railAccordions, 0);
    setTimeout(railAccordions, 350);
  }, true);
})();
