/* ============================================================
   FIBA 3x3 Nations League — mobile.js
   The mobile site chrome (F-03m + el-18 NavTab bar + the "More"
   sheet) and the mobile footer (F-06m), injected into every page.

   The markup is lifted verbatim from the design-system specimen
   sheet (system/_check/03a-modules-frame.html), so the phone
   navigation on the live pages is the one that was designed, not
   a second interpretation of it. Only the destinations are added
   here — the specimen had none.

   Nothing in this file runs above 1100px: the chrome is injected
   once and mobile.css decides which of the two is on screen.
   ============================================================ */
(function () {
  'use strict';

  var HEADER = `<div class="f03m mnav-bar-top"><a class="f03m-l" href="index.html" aria-label="Nations League home"><div class="brandlogo"><svg fill="none" height="16" viewBox="0 0 81 18" width="72" xmlns="http://www.w3.org/2000/svg"> <path d="M76.3137 0L73.7917 14.326H80.3957L79.7717 17.94H68.4617L71.6337 0H76.3137Z" fill="white"></path> <path d="M50.6374 17.94L53.8094 0H58.8014L62.4674 10.894L64.4434 0H68.5774L65.4054 17.94H60.4654L56.7994 6.708L54.7714 17.94H50.6374Z" fill="white"></path> <path d="M35.5268 17.94L33.1348 15.548L33.7328 12.22H38.4388L38.0488 14.3L38.3868 14.664H43.4828L43.8988 14.248L44.4968 10.972L44.0288 10.504H37.3988L37.9968 7.176H44.7308L45.1988 6.708L45.7188 3.666L45.3288 3.25H40.2848L39.9468 3.614L39.5828 5.642H34.9028L35.4748 2.392L37.8668 0H48.2408L50.6328 2.392L49.9048 6.552L47.4608 8.996L49.2028 10.738L48.3448 15.548L45.9528 17.94H35.5268Z" fill="white"></path> <path d="M26.9177 17.94L25.0717 11.648L21.1717 17.94H15.8677L22.1857 8.632L19.5857 0H24.6557L26.0857 5.928L29.8557 0H34.9777L28.8417 8.658L31.8317 17.94H26.9177Z" fill="white"></path> <path d="M2.392 17.94L0 15.548L0.598 12.22H5.304L4.914 14.3L5.252 14.664H10.348L10.764 14.248L11.362 10.972L10.894 10.504H4.264L4.862 7.176H11.596L12.064 6.708L12.584 3.666L12.194 3.25H7.15L6.812 3.614L6.448 5.642H1.768L2.34 2.392L4.732 0H15.106L17.498 2.392L16.77 6.552L14.326 8.996L16.068 10.738L15.21 15.548L12.818 17.94H2.392Z" fill="white"></path> </svg></div></a><div class="f03m-l f03m-search f03-search" role="button" tabindex="0" aria-label="Search"><svg fill="currentColor" height="22" viewBox="0 -960 960 960" width="22" xmlns="http://www.w3.org/2000/svg"><path d="M796-121 533-384q-30 26-70 40.5T378-329q-108 0-183-75t-75-181q0-106 75-181t182-75q106 0 180.5 75T632-585q0 43-14 83t-42 75l264 262-44 44ZM377-389q81 0 138-57.5T572-585q0-81-57-138.5T377-781q-82 0-139.5 57.5T180-585q0 81 57.5 138.5T377-389Z"></path></svg></div></div>`;
  var TABBAR = `<div class="tabbar tabbar-dark mnav-bar"><a class="mnav-tab" href="index.html"><div data-tab="Home" class="ntab cut cut-s"><svg fill="currentColor" height="20" viewBox="0 -960 960 960" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M141-510h137q-7-48-28-90.5T198-674q-23 35-39 76t-18 88Zm541 0h137q-2-47-18-88t-39-76q-34 34-53.5 75T682-510ZM198-287q34-34 53.5-74.5T278-450H141q2 47 18 87.5t39 75.5Zm564 0q23-35 39-75.5t18-87.5H682q7 48 26.5 88.5T762-287ZM339-510h111v-309q-62 7-115.5 32T238-720q41 41 67 95t34 115Zm171 0h111q8-61 34.5-115t67.5-95q-43-42-97-67t-116-32v309Zm-60 369v-309H339q-8 61-34 114.5T238-241q43 42 94 67.5T450-141Zm60 0q67-7 118.5-32.5T723-241q-41-41-67.5-94.5T621-450H510v309Zm-30-334Zm0 395q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"></path></svg><div class="ntab-l">Home</div><div class="ntab-bar"></div></div></a><a class="mnav-tab" href="conferences.html"><div data-tab="Conferences" class="ntab cut cut-s"><svg fill="currentColor" height="20" viewBox="0 -960 960 960" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM437-141v-82q-35 0-59-26t-24-61v-44L149-559q-5 20-7 39.5t-2 39.5q0 130 84.5 227T437-141Zm294-108q44-48 66.5-107.5T820-480q0-106-58-192.5T607-799v18q0 35-24 61t-59 26h-87v87q0 17-13.5 28T393-568h-83v88h258q17 0 28 13t11 30v127h43q29 0 51 17t30 44Z"></path></svg><div class="ntab-l">Conferences</div><div class="ntab-bar"></div></div></a><a class="mnav-tab" href="calendar.html"><div data-tab="Calendar" class="ntab cut cut-s"><svg fill="currentColor" height="20" viewBox="0 -960 960 960" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M180-80q-24 0-42-18t-18-42v-620q0-24 18-42t42-18h65v-60h65v60h340v-60h65v60h65q24 0 42 18t18 42v620q0 24-18 42t-42 18H180Zm0-60h600v-430H180v430Zm0-490h600v-130H180v130Zm0 0v-130 130Zm300 230q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-188.5-11.5Q280-423 280-440t11.5-28.5Q303-480 320-480t28.5 11.5Q360-457 360-440t-11.5 28.5Q337-400 320-400t-28.5-11.5ZM640-400q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-188.5-11.5Q280-263 280-280t11.5-28.5Q303-320 320-320t28.5 11.5Q360-297 360-280t-11.5 28.5Q337-240 320-240t-28.5-11.5ZM640-240q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z"></path></svg><div class="ntab-l">Calendar</div><div class="ntab-bar"></div></div></a><a class="mnav-tab" href="teams.html"><div data-tab="Teams" class="ntab cut cut-s"><svg fill="currentColor" height="20" viewBox="0 -960 960 960" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M0-240v-53q0-38.57 41.5-62.78Q83-380 150.38-380q12.16 0 23.39.5t22.23 2.15q-8 17.35-12 35.17-4 17.81-4 37.18v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-19.86-3.5-37.43T765-377.27q11-1.73 22.17-2.23 11.17-.5 22.83-.5 67.5 0 108.75 23.77T960-293v53H780Zm-480-60h360v-6q0-37-50.5-60.5T480-390q-79 0-129.5 23.5T300-305v5ZM149.57-410q-28.57 0-49.07-20.56Q80-451.13 80-480q0-29 20.56-49.5Q121.13-550 150-550q29 0 49.5 20.5t20.5 49.93q0 28.57-20.5 49.07T149.57-410Zm660 0q-28.57 0-49.07-20.56Q740-451.13 740-480q0-29 20.56-49.5Q781.13-550 810-550q29 0 49.5 20.5t20.5 49.93q0 28.57-20.5 49.07T809.57-410ZM480-480q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm.35-60Q506-540 523-557.35t17-43Q540-626 522.85-643t-42.5-17q-25.35 0-42.85 17.15t-17.5 42.5q0 25.35 17.35 42.85t43 17.5ZM480-300Zm0-300Z"></path></svg><div class="ntab-l">Teams</div><div class="ntab-bar"></div></div></a><div class="mnav-tab mnav-more" role="button" tabindex="0"><div data-tab="More" class="ntab cut cut-s"><svg fill="currentColor" height="20" viewBox="0 -960 960 960" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M120-240v-60h720v60H120Zm0-210v-60h720v60H120Zm0-210v-60h720v60H120Z"></path></svg><div class="ntab-l">More</div><div class="ntab-bar"></div></div></div></div>`;
  var SHEET  = `<div class="f03m-sheet mnav-sheet" hidden=""> <div class="f03m-sheet-top" style="justify-content:flex-end"> <div class="f03m-close mnav-close" role="button" tabindex="0" style="display:flex;align-items:center;gap:6px;color:var(--chrome-text-muted)"> <span class="t-caption" style="color:inherit">Close</span> <svg fill="currentColor" height="20" viewBox="0 -960 960 960" width="20"><path d="m251-160-91-91 229-229-229-229 91-91 229 229 229-229 91 91-229 229 229 229-91 91-229-229-229 229Z"></path></svg> </div> </div> <div class="f03m-sheet-body"> <div class="f03m-grp"> <div class="f03m-grp-h">Nations League</div><a class="f03m-l" href="standings.html">Standings</a><a class="f03m-l" href="stats.html">Stats</a><a class="f03m-l" href="news.html">News</a> <a class="f03m-l" href="teams.html">Find a team</a> <div class="f03m-l" tabindex="0">Video hub</div> <div class="f03m-l" tabindex="0">History</div> <div class="f03m-l" tabindex="0">Alumni</div> </div> <div class="f03m-grp"> <div class="f03m-grp-h">Info</div> <div class="f03m-l" tabindex="0">About Nations League<span class="f03m-ext">↗</span></div> <a class="f03m-l" href="qualification.html">How qualification works</a> <div class="f03m-l" tabindex="0">FAQ</div> </div> <div class="f03m-grp"> <div class="f03m-grp-h">Competition family</div> <div class="f03m-l" tabindex="0">3x3 U23 World Cup<span class="f03m-ext">↗</span></div> <div class="f03m-l" tabindex="0">3x3 World Cup<span class="f03m-ext">↗</span></div> <div class="f03m-l" tabindex="0">3x3 World Tour<span class="f03m-ext">↗</span></div> <div class="f03m-l" tabindex="0">3x3 Women's Series<span class="f03m-ext">↗</span></div> </div> </div> </div>`;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function build() {
    var host = $('.tpl') || document.body;
    if ($('.mnav')) return;

    var nav = document.createElement('div');
    nav.className = 'mnav';
    nav.innerHTML = HEADER + SHEET + TABBAR;
    host.appendChild(nav);

    /* ---- current destination -------------------------------
       Four of the nine pages are on the bar. The other five are
       behind More, so More carries the mark when one of them is
       open — otherwise the bar reads as if nothing is selected. */
    var here = (document.body.dataset.page || 'index.html').split('?')[0];
    var onBar = false;
    $$('.mnav-tab', nav).forEach(function (t) {
      if (t.getAttribute('href') === here) {
        t.querySelector('.ntab').classList.add('ntab-on');
        onBar = true;
      }
    });
    if (!onBar) {
      var more = $('.mnav-more .ntab', nav);
      if (more) more.classList.add('ntab-on');
    }

    /* a conference is running: the same red dot F-03 carries */
    if (document.body.classList.contains('live')) {
      var conf = $('.ntab[data-tab="Conferences"]', nav);
      if (conf) conf.classList.add('ntab-live');
    }

    /* ---- the More sheet ------------------------------------ */
    var sheet = $('.mnav-sheet', nav);
    function openSheet(on) {
      if (!sheet) return;
      sheet.hidden = !on;
      document.documentElement.classList.toggle('mnav-locked', on);
      var more = $('.mnav-more .ntab', nav);
      if (more) more.classList.toggle('ntab-open', on);
    }
    function tap(el, fn) {
      if (!el) return;
      el.addEventListener('click', function (e) { e.preventDefault(); fn(); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
      });
    }
    tap($('.mnav-more', nav), function () { openSheet(sheet.hidden); });
    tap($('.mnav-close', nav), function () { openSheet(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') openSheet(false);
    });

    /* F-02 is hidden on a phone, and it is where the prototype's
       hero switch lives. Move it into the sheet so Hero A / Hero B
       can still be shown on a handset in a review. */
    var fam = $('.f02-fam');
    var body = $('.f03m-sheet-body', nav);
    if (fam && body) {
      var grp = document.createElement('div');
      grp.className = 'f03m-grp';
      grp.innerHTML = '<div class="f03m-grp-h">Prototype</div>';
      $$('.f02-famlink', fam).forEach(function (l) {
        var a = document.createElement('a');
        a.className = 'f03m-l';
        a.href = l.getAttribute('href');
        if (l.dataset.hero) a.dataset.hero = l.dataset.hero;
        a.textContent = l.textContent.trim();
        a.addEventListener('click', function () { openSheet(false); });
        grp.appendChild(a);
      });
      body.appendChild(grp);
    }

    /* The search icon carries .f03-search, so site.js wires it to
       the real E-11 overlay the same way it wires the desktop one.
       If that never resolves, the icon still has somewhere to go. */
    var s = $('.f03m-search', nav);
    if (s) setTimeout(function () {
      if ($('.ovl')) return;
      s.addEventListener('click', function () { location.href = 'search.html'; });
    }, 2500);
  }

  /* ---- F-06m: the footer columns become disclosure rows ------
     Five columns side by side is a desktop shape. On a phone the
     design system turns each one into an el-19 DisclosureRow, so
     the legal band is two thumb-flicks away instead of ten.     */
  function buildFooterAccordion() {
    var cols = $('.f06-cols');
    if (!cols || $('.f06m-cols')) return;

    var wrap = document.createElement('div');
    wrap.className = 'f06m-cols disc-dark';

    $$('.f06-col', cols).forEach(function (col, i) {
      var head = col.querySelector('.f06-colh');
      var links = $$('.f06-link', col);
      if (!head) return;

      var disc = document.createElement('div');
      disc.className = 'disc';
      var h = document.createElement('div');
      h.className = 'disc-head';
      h.setAttribute('role', 'button');
      h.setAttribute('tabindex', '0');
      h.innerHTML = '<span class="disc-t"></span>' +
        '<svg class="disc-chev" fill="currentColor" height="20" viewBox="0 -960 960 960" width="20">' +
        '<path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"></path></svg>';
      h.querySelector('.disc-t').textContent = head.textContent.trim();

      var body = document.createElement('div');
      body.className = 'disc-body';
      links.forEach(function (l) {
        var a = document.createElement(l.tagName === 'A' ? 'a' : 'span');
        a.className = 'disc-link';
        if (l.tagName === 'A') a.href = l.getAttribute('href');
        a.textContent = l.textContent.trim();
        body.appendChild(a);
      });
      disc.appendChild(h); disc.appendChild(body);
      wrap.appendChild(disc);
    });

    cols.parentNode.insertBefore(wrap, cols.nextSibling);

    /* el-19 open/close, the caret and the one-open-per-group rule
       all live in app.js. Hand it the new subtree rather than
       writing a second disclosure implementation here. */
    if (window.FIBA && window.FIBA.init) window.FIBA.init(wrap);
  }

  function init() { build(); buildFooterAccordion(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
