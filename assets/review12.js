/* ============================================================
   FIBA 3x3 Nations League — review12.js
   Twelfth round, the behaviour — 2026-08-27.

     1  stop.html   a way back to the conference's Stops tab
     2  conference  #stops in the URL opens that tab
     3  player.html the category chip says which team site it is
     4  stats       every row in the ranking carries an avatar

   Loaded after site.js, which renders on data. Everything here
   waits for body[data-rendered] rather than for DOMContentLoaded.
   ============================================================ */
(function () {
  'use strict';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  var page = (document.body && document.body.dataset.page) || '';

  /* site.js stamps body[data-rendered] when the page has been drawn
     from the feed. Some blocks are drawn again after that (a tab, a
     gender switch), so the callback runs once on ready and then on
     every mutation of the block it cares about. */
  function ready(fn) {
    if (document.body.dataset.rendered) { fn(); return; }
    var t = setInterval(function () {
      if (!document.body.dataset.rendered) return;
      clearInterval(t);
      fn();
    }, 60);
    setTimeout(function () { clearInterval(t); }, 8000);
  }

  var ARROW_LEFT =
    '<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" ' +
    'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M274-450l248 248-42 42-320-320 320-320 42 42-248 248h526v60H274Z"></path></svg>';


  /* ---------- 1  back to the stops overview -------------------
     A stop page is reached from the Stops tab of its conference
     and had nothing to go back with. The control belongs on the
     el-06 StopDots row — that row is the list this page came out
     of — so the rail and the control are wrapped in one flex row
     and the control is pushed to the far end.

     The wrapper is inserted around .stopnav rather than inside
     it: site.js repeats .stopnav-i children to match the number
     of stops, and anything else in that box would be swept up. */
  function backLink() {
    var rail = $('.cnf-stopnav > .stopnav');
    if (!rail || $('.snback')) return;

    var row = document.createElement('div');
    row.className = 'snrow';
    rail.parentNode.insertBefore(row, rail);
    row.appendChild(rail);

    var a = document.createElement('a');
    a.className = 'snback';
    a.innerHTML = ARROW_LEFT + '<span class="snback-l">Back to stops overview</span>';
    row.appendChild(a);

    /* site.js has already pointed "See updated conference table"
       at this stop's conference; the same id, with the tab named. */
    function target() {
      var b = $('.cnf-back a');
      var href = (b && b.getAttribute('href')) || 'conferences.html';
      return href.indexOf('#') > -1 ? href : href + '#stops';
    }
    a.setAttribute('href', target());
    a.addEventListener('click', function () { a.setAttribute('href', target()); });
  }


  /* ---------- 2  open on the tab the URL names ----------------
     conference.html renders its tabs from the mark-up and opens
     on whichever carries tab-active. A link that means to land
     on the Stops tab says so in the fragment, and the tab is
     pressed once the tabs exist. */
  function openTab() {
    var want = (location.hash || '').replace('#', '') ||
               (new URLSearchParams(location.search)).get('tab') || '';
    if (!want) return;
    var tries = 0;
    var t = setInterval(function () {
      var tab = $$('.cnf-tabs .tab').filter(function (x) { return x.dataset.tab === want; })[0];
      if (tab) {
        clearInterval(t);
        if (!tab.classList.contains('tab-active')) tab.click();
        return;
      }
      if (++tries > 60) clearInterval(t);
    }, 60);
  }


  /* ---------- 3  the category chip on a player page -----------
     E-05 ships with "U23 Men" written into the specimen and
     nothing ever replaced it, so every player on the site — the
     women included — was labelled as a men's U23 player.

     The label is a fact about the TEAM SITE the player is on,
     not about the player: a federation can field U23 and U21,
     men and women, and the roster the player appears in is the
     one that names both. Gender falls back to the player's own
     field where no roster carries them.                       */
  function playerCategory() {
    var id = (new URLSearchParams(location.search)).get('id');
    var chip = $('.e05-id .t-body-m') || $('.e05 .t-body-m');
    if (!chip) return;

    Promise.all(['players', 'teams', 'conferences'].map(function (f) {
      return fetch('assets/data/' + f + '.json').then(function (r) { return r.json(); });
    })).then(function (res) {
      var players = res[0], teams = res[1], confs = res[2];
      var p = players.filter(function (x) { return x.id === id; })[0] || players[0];
      if (!p) return;

      var site = teams.filter(function (t) {
        return (t.roster || []).some(function (r) { return r.id === p.id; });
      })[0];

      var c = site && confs.filter(function (x) { return x.id === site.conference; })[0];
      var cat = c && /^U21\b/.test(c.name || '') ? 'U21' : 'U23';
      var g = (site && site.gender) || (p.gender === 'female' ? 'women' : 'men');
      chip.textContent = cat + ' ' + (g === 'women' ? 'Women' : 'Men');
    }).catch(function (e) { console.error('player category', e); });
  }


  /* ---------- 4  every ranking row has a chip -----------------
     el-24 falls back to the player's initials, and the element
     draws them on its own surface — but the rows the page
     builder wrote without a bed class came out as two letters
     on the page itself. The bed is put back wherever there is
     no photograph, so the column is one column.               */
  function avatarBeds(root) {
    $$('.r05-pl .av', root || document).forEach(function (av) {
      if (av.classList.contains('av-photo-bed')) return;
      if (!$('.av-init', av)) return;
      av.classList.remove('av-check-bed');
      av.classList.add('av-sil-bed');
    });
  }


  ready(function () {
    try {
      if (page === 'stop.html') backLink();
      if (page === 'conference.html') openTab();
      if (page === 'player.html') playerCategory();
      avatarBeds();
    } catch (e) { console.error('review12', e); }

    /* Stats redraws its ranking on every filter, and stop.html
       redraws its rail when the gender changes. */
    var host = document.querySelector('.tpl-content') || document.body;
    var mo = new MutationObserver(function () {
      try {
        avatarBeds();
        if (page === 'stop.html') backLink();
      } catch (e) { /* never let the observer throw */ }
    });
    mo.observe(host, { childList: true, subtree: true });
  });
})();
