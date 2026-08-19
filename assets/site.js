/* ============================================================
   FIBA 3x3 Nations League — site.js
   Fills the approved templates with the real 2026 season.

   The markup is the design, untouched. This finds each module in
   the page and rewrites its rows from assets/data/*.json, so a
   change to the design system shows up here without edits.

   Routing is by query string: conference.html?id=africa-east,
   team.html?id=<uuid>, player.html?id=<uuid>.
   ============================================================ */
(function () {
  'use strict';

  var D = {};                                   /* the loaded data  */
  var qs = new URLSearchParams(location.search);

  /* ---------- small helpers -------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  function text(node, sel, value) {
    var el = sel ? $(sel, node) : node;
    if (el && value != null && value !== '') el.textContent = value;
    return el;
  }

  /* Repeat the first matching row once per record, then paint each. */
  function repeat(root, sel, records, paint) {
    var rows = $$(sel, root);
    if (!rows.length || !records || !records.length) return 0;
    var proto = rows[0].cloneNode(true);
    for (var i = 1; i < rows.length; i++) rows[i].remove();
    var frag = document.createDocumentFragment();
    records.forEach(function (rec, i) {
      var n = proto.cloneNode(true);
      paint(n, rec, i);
      frag.appendChild(n);
    });
    rows[0].replaceWith(frag);
    return records.length;
  }

  /* The specimen carries an inline SVG flag; swap in the real one. */
  function flag(node, ioc) {
    if (!ioc || !node) return;
    /* Never walk the whole document: a page-wide call would repaint every
       flag on the page with one country, which is what happened to the
       results table and the game log. */
    var targets = node.classList && node.classList.contains('flag')
      ? [node] : $$('.flag', node);
    targets.forEach(function (f) {
      f.innerHTML = '';
      var img = document.createElement('img');
      img.src = 'assets/flags/' + ioc + '.svg';
      img.alt = ioc;
      img.width = 24; img.height = 24;
      img.style.width = '100%'; img.style.height = '100%';
      img.onerror = function () { f.style.background = 'var(--surface-sunken-2)'; img.remove(); };
      f.appendChild(img);
    });
  }

  function fed(node, ioc, name) {
    flag(node, ioc);
    text(node, '.ftag-code', ioc);
    text(node, '.ftag-name', name);
  }

  function link(node, href) {
    if (!href) return;
    node.setAttribute('data-href', href);
    node.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      location.href = href;
    });
  }

  function fmtDate(iso, opts) {
    if (!iso) return '';
    var d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function img(url, w, ar) {
    if (!url) return url;
    if (url.indexOf('res.cloudinary.com') === -1) return url;
    return url.replace(/\/ar_[^/]+\/w_\d+,c_lfill\//,
                       '/ar_' + (ar || '3:2') + ',c_lfill,g_auto/w_' + (w || 960) + ',c_lfill/');
  }

  /* Paint a picture placeholder with a real photograph. */
  function photo(node, url) {
    if (!url) return;
    node.style.backgroundImage = 'url("' + url + '")';
    node.style.backgroundSize = 'cover';
    node.style.backgroundPosition = 'center';
    $$('.t-caption', node).forEach(function (c) { c.style.display = 'none'; });
  }

  /* ---------- lookups -------------------------------------- */
  function conf(id) { return D.conferences.filter(function (c) { return c.id === id; })[0]; }
  function stop(slug) { return D.events.filter(function (e) { return e.slug === slug; })[0]; }
  function playedStops() {
    return D.events.filter(function (e) { return e.teamsRegistered; });
  }
  /* Two stops in the snapshot arrive without a gender label — the
     feed's category name came through empty — so a gendered lookup
     found nothing and the conference table rendered blank. Prefer the
     labelled record, fall back to the unlabelled one. */
  function standingsFor(slug, gender) {
    var all = D.standings.filter(function (s) { return s.stop === slug; });
    if (!gender) return all[0];
    return all.filter(function (s) { return s.gender === gender; })[0] ||
           all.filter(function (s) { return !s.gender; })[0];
  }
  function teamsFor(slug, gender) {
    return D.teams.filter(function (t) {
      return t.stop === slug && (!gender || t.gender === gender);
    });
  }
  function player(id) { return D.playersById[id]; }
  function gamesFor(slug, gender) {
    return D.games.filter(function (g) {
      return g.stop === slug && (!gender || g.gender === gender);
    });
  }

  /* One game row: time, home, score, away, pool, status. */
  function paintGame(row, g) {
    var cells = $$('.cell', row);
    text(row, '.cell-time .t-data-m', (g.start || '').slice(11, 16));
    var home = $('.cell-home', row), away = $('.cell-away', row);
    if (home) fed(home, g.home.ioc, g.home.name);
    if (away) fed(away, g.away.ioc, g.away.name);
    var pts = $$('.gpts', row);
    if (pts[0]) pts[0].textContent = g.home.score != null ? g.home.score : '–';
    if (pts[1]) pts[1].textContent = g.away.score != null ? g.away.score : '–';
    if (pts.length === 2 && g.home.score != null && g.away.score != null) {
      pts[g.home.score >= g.away.score ? 1 : 0].classList.add('gdim');
      pts[g.home.score >= g.away.score ? 0 : 1].classList.remove('gdim');
    }
    text(row, '.cell-pool .t-body-s, .cell-pool .t-label', g.pool);
    var st = $('.cell-gamestatus .badge .lbl, .cell-gamestatus .t-caption', row);
    if (st) st.textContent = (g.home.score != null ? 'Final' : 'Upcoming');
    row.classList.remove('is-placeholder');
  }

  /* A season-wide federation table, built from every stop we have. */
  function federationTable(gender) {
    var by = {};
    D.standings.filter(function (s) { return !gender || s.gender === gender; }).forEach(function (s) {
      s.rows.forEach(function (r) {
        var k = r.ioc;
        if (!k) return;
        by[k] = by[k] || { ioc: k, team: r.team, played: 0, won: 0, points: 0, stops: 0, conference: s.conference };
        by[k].played += r.played || 0;
        by[k].won += r.won || 0;
        by[k].points += r.points || 0;
        by[k].stops += 1;
      });
    });
    var list = Object.keys(by).map(function (k) { return by[k]; });
    list.forEach(function (t) {
      t.winRatio = t.played ? t.won / t.played : 0;
      t.avg = t.played ? Math.round((t.points / t.played) * 10) / 10 : 0;
    });
    list.sort(function (a, b) { return b.points - a.points || b.winRatio - a.winRatio; });
    list.forEach(function (t, i) { t.rank = i + 1; });
    return list;
  }

  /* ---------- conference standings ---------------------------
     One implementation, used by the landing page accordion and by the
     conference page. Both were painting by column index, which put the
     win ratio under Pts Average and the points scored under Tour
     Points; every cell is now addressed by its own class.             */

  /* NM-01: the age category is part of the conference name and it goes
     after it. U23 is the default, so the feed names only the U21
     conferences and does it as a prefix — "U21 Europe-2" — which is
     moved to the end here. */
  function confName(c) {
    if (!c) return '';
    var m = /^U(\d\d)\s+(.+)$/.exec(c.name || '');
    return m ? m[2] + ' U' + m[1] : (c.name || '') + ' U23';
  }

  /* The feed carries the finishing order at each stop but no tour
     points, so the ladder is stated once, here, and nowhere else. */
  var TOUR = [100, 80, 70, 60, 50, 40, 30, 20, 10];
  function tourPoints(rank) {
    if (!rank) return 0;                     /* stop not finished yet */
    return TOUR[rank - 1] != null ? TOUR[rank - 1] : 10;
  }

  function conferenceTable(confId, gender, uptoISO) {
    var by = {};
    D.events.forEach(function (e) {
      if (e.conference !== confId) return;
      if (uptoISO && (!e.start || e.start > uptoISO)) return;
      var s = standingsFor(e.slug, gender);
      if (!s) return;
      s.rows.forEach(function (r) {
        if (!r.ioc) return;
        var t = by[r.ioc] = by[r.ioc] ||
          { ioc: r.ioc, team: r.team, played: 0, won: 0, pts: 0, tour: 0, stops: 0 };
        t.played += r.played || 0;
        t.won += r.won || 0;
        t.pts += r.points || 0;
        t.tour += tourPoints(r.rank);
        t.stops += 1;
      });
    });
    var list = Object.keys(by).map(function (k) { return by[k]; });
    list.forEach(function (t) {
      t.winRatio = t.played ? t.won / t.played : 0;
      t.avg = t.played ? Math.round((t.pts / t.played) * 10) / 10 : 0;
    });
    list.sort(function (a, b) { return b.tour - a.tour || b.winRatio - a.winRatio; });
    list.forEach(function (t, i) { t.rank = i + 1; });
    return list;
  }

  /* Q once the conference is over and this row won it — a conference
     winner qualifies. Everyone else is still in the race; S is a
     season-wide judgement and is set on the Standings page, not here. */
  function paintStandingRow(row, r, complete) {
    row.hidden = false;
    fed(row, r.ioc, r.team);
    text(row, '.cell-position .t-data-m', r.rank);
    text(row, '.cell-winratio .t-data-m', r.winRatio.toFixed(2));
    text(row, '.cell-ptsavg .t-data-m', r.avg.toFixed(1));
    text(row, '.cell-ep .t-data-m', r.stops);
    text(row, '.cell-points .t-data-m', r.tour);
    var mk = $('.cell-status .marker', row);
    if (mk) {
      var st = (complete && r.rank === 1) ? 'q' : 'r';
      mk.classList.remove('marker-q', 'marker-s', 'marker-r');
      mk.classList.add('marker-' + st);
      text(mk, '.lbl', st.toUpperCase());
    }
    link(row, 'team.html?ioc=' + r.ioc);
  }

  /* ---------- controls ---------------------------------------
     The design system supplies the controls; these give them the
     behaviour. Each returns the current value and calls back when
     it changes, so a page renderer stays a single render function. */

  /* el-02 GenderSwitch → 'men' | 'women' */
  function genderSwitch(onChange) {
    var seg = $$('.el02-seg');
    if (!seg.length) return 'men';
    var value = 'men';
    seg.forEach(function (s) {
      if (s.classList.contains('el02-on')) value = /women/i.test(s.textContent) ? 'women' : 'men';
      s.addEventListener('click', function () {
        seg.forEach(function (x) { x.classList.remove('el02-on'); });
        s.classList.add('el02-on');
        value = /women/i.test(s.textContent) ? 'women' : 'men';
        onChange(value);
      });
    });
    return value;
  }

  /* el-03 FilterChips → the label of the selected chip */
  function chipFilter(onChange) {
    var chips = $$('.chip');
    if (!chips.length) return null;
    var value = (chips.filter(function (c) { return c.classList.contains('chip-on'); })[0] || chips[0]).textContent.trim();
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.remove('chip-on'); });
        c.classList.add('chip-on');
        value = c.textContent.trim();
        onChange(value);
      });
    });
    return value;
  }

  /* el-11 SearchInput → live text, debounced by nothing; the sets
     here are small enough to filter on every keystroke. */
  function searchField(root, placeholder, onChange) {
    var box = $('.search', root || document);
    if (!box) return function () { return ''; };
    var txt = $('.search-txt, .search-txt-filled', box);
    var inp = $('input', box);
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'search-in';
      inp.setAttribute('autocomplete', 'off');
      inp.placeholder = placeholder || 'Search';
      if (txt) txt.replaceWith(inp); else box.appendChild(inp);
    }
    inp.addEventListener('input', function () { onChange(this.value.trim().toLowerCase()); });
    var clear = $('.search-clear', box);
    if (clear) clear.addEventListener('click', function () { inp.value = ''; onChange(''); });
    return function () { return inp.value.trim().toLowerCase(); };
  }

  /* el-10 EmptyState, at the width of the block it replaces. */
  function emptyState(host, title, body) {
    if (!host) return;
    var e = host.querySelector(':scope > .site-empty');
    if (!e) {
      e = document.createElement('div');
      e.className = 'site-empty empty cut cut-m';
      e.innerHTML = '<div class="empty-icon"></div>' +
                    '<div class="t-h3"></div><div class="t-body-s"></div>';
      host.appendChild(e);
    }
    e.querySelector('.t-h3').textContent = title;
    e.querySelector('.t-body-s').textContent = body || '';
    return e;
  }

  /* ---------- E-01 TeamFinder --------------------------------
     step 1 default · 2 filled in · 3 choose team site · 4 result   */
  function initFinder(f) {
    var seen = {}, feds = [];
    D.teams.forEach(function (t) {
      if (!t.ioc || seen[t.ioc]) return;
      seen[t.ioc] = 1;
      feds.push(t);
    });
    feds.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });

    text(f, '.finder-nations', feds.length);
    text(f, '.finder-sites', D.teams.length);
    $$('.finder-change, .finder-change-2', f).forEach(function (c) {
      c.style.cursor = 'pointer';
      c.addEventListener('click', function () { step(1); list(''); });
    });

    var parts = {
      search: $('[data-part="search"]', f),
      choose: $('[data-part="choose"]', f),
      result: $('[data-part="result"]', f)
    };
    function step(n) {
      f.dataset.step = n;
      parts.search.hidden = n !== 1 && n !== 2;
      parts.choose.hidden = n !== 3;
      parts.result.hidden = n !== 4;
    }

    /* ---- 2 · filled in ---- */
    var menu = $('.finder-menu', f);
    function list(q) {
      q = (q || '').trim().toLowerCase();
      [].slice.call(menu.querySelectorAll('.acm-row')).forEach(function (r) { r.remove(); });
      if (!q) { menu.hidden = true; return; }
      var hits = feds.filter(function (t) {
        return (t.name + ' ' + t.ioc).toLowerCase().indexOf(q) > -1;
      }).slice(0, 6);
      menu.hidden = false;
      if (!hits.length) {
        var none = document.createElement('div');
        none.className = 'acm-row';
        none.innerHTML = '<span class="t-body-s">No nation matches \u201c' + q + '\u201d.</span>';
        menu.appendChild(none);
        return;
      }
      hits.forEach(function (t) {
        var row = document.createElement('div');
        row.className = 'acm-row';
        row.innerHTML =
          '<div class="ftag ftag-m cut cut-s ftag-plain">' +
            '<div class="flag flag-ring"></div>' +
            '<div class="ftag-txt"><span class="ftag-name"></span></div></div>' +
          '<div class="t-caption acm-conf"></div>';
        flag(row, t.ioc);
        row.querySelector('.ftag-name').textContent = t.name;
        row.querySelector('.acm-conf').textContent = t.ioc;
        row.style.cursor = 'pointer';
        row.addEventListener('click', function () { choose(t); });
        menu.appendChild(row);
      });
    }
    searchField(f, 'Search your country\u2026', list);

    /* ---- 3 · choose a team site ---- */
    var picked = null;
    function choose(t) {
      picked = t;
      flag($('.finder-picked', f), t.ioc);
      text(f, '.finder-country', t.name);
      var sites = D.teams.filter(function (x) { return x.ioc === t.ioc; });
      var byCat = {};
      sites.forEach(function (x) {
        var label = 'U23 ' + (x.gender === 'women' ? 'Women' : 'Men');
        byCat[label] = byCat[label] || x;
      });
      var box = $('.finder-sites-list', f);
      box.innerHTML = '';
      Object.keys(byCat).forEach(function (label) {
        var b = document.createElement('div');
        b.className = 'btn btn-outline cut cut-s cut-out';
        b.innerHTML = '<div class="cutfill"></div><span class="lbl"></span>';
        b.querySelector('.lbl').textContent = label;
        b.addEventListener('click', function () { result(byCat[label], label); });
        box.appendChild(b);
      });
      step(3);
    }


    /* ---- 4 · result ---- */
    function result(team, label) {
      var st = D.standings.filter(function (s) {
        return s.stop === team.stop && s.gender === team.gender;
      })[0];
      var row = st && st.rows.filter(function (r) { return r.ioc === team.ioc; })[0];
      var c = conf(team.conference) || {};
      var played = D.events.filter(function (e) {
        return e.conference === team.conference && e.teamsRegistered;
      }).length;

      /* Season totals for this federation, the same four figures the
         team header carries. */
      var tot = { played: 0, won: 0, points: 0, stops: 0 };
      D.standings.forEach(function (s2) {
        if (s2.gender !== team.gender) return;
        s2.rows.forEach(function (r) {
          if (r.ioc !== team.ioc) return;
          tot.played += r.played || 0;
          tot.won += r.won || 0;
          tot.points += r.points || 0;
          tot.stops += 1;
        });
      });

      flag($('.finder-card-head', f), team.ioc);
      text(f, '.finder-cat', /women/i.test(label) ? 'Women' : 'Men');
      text(f, '.finder-team', team.ioc + ' U23');
      text(f, '.finder-pts', tot.points);
      text(f, '.finder-ratio', tot.played ? (tot.won / tot.played).toFixed(2) : '\u2014');
      text(f, '.finder-record', tot.played ? tot.won + '\u2013' + (tot.played - tot.won) : '\u2014');
      text(f, '.finder-played', tot.stops + ' of ' + (c.stopCount || 0));
      link($('.finder-goteam', f), 'team.html?ioc=' + team.ioc);
      link($('.finder-goconf', f), 'conference.html?id=' + team.conference);
      step(4);
    }

    var browse = $('.finder-browse', f);
    if (browse) link(browse, 'teams.html');
    step(1);
  }

  /* ---------- page renderers -------------------------------- */
  var PAGES = {};

  PAGES['index.html'] = function () {
    /* ---- Live now -------------------------------------------
       LP-17, and Johannes' note on the strip: only offer days that have
       something under them. The strip is built from the days that
       actually carry play, not from consecutive dates, so there is no
       empty day left to land on.

       Two independent pieces of state. `sel` is the day whose
       conferences are shown below; `win` is the first day visible in
       the strip. Clicking a day changes `sel` and nothing else, so the
       cell stays exactly where it was clicked. Prev and Next move
       `win` and leave `sel` alone — the strip travels, the selection
       does not. */
    var SLOTS = 8;
    var region = 'All';
    var days = [], sel = 0, win = 0, gender = {};

    function iso(d) { return d.toISOString().slice(0, 10); }

    function inRegion(e) {
      if (region === 'All') return true;
      var c = conf(e.conference);
      var want = region.toLowerCase().replace('asiapacific', 'asia');
      return !!c && c.name.toLowerCase().indexOf(want) === 0;
    }
    /* "Something under it" means results, not merely a row in the feed.
       Two stops arrive with a full standings record in which every team
       has played nothing — offering those days is exactly what the note
       asked us to stop doing. */
    function hasContent(e) {
      var s = standingsFor(e.slug);
      if (s && s.rows && s.rows.some(function (r) { return (r.played || 0) > 0; })) return true;
      return gamesFor(e.slug).some(function (g) {
        return g.home && g.home.score != null;
      });
    }
    function stopsOn(dateISO) {
      return D.events.filter(function (e) {
        return e.start && inRegion(e) && hasContent(e) &&
               e.start <= dateISO && (e.end || e.start) >= dateISO;
      });
    }
    function dayList() {
      var seen = {};
      D.events.forEach(function (e) {
        if (e.start && inRegion(e) && hasContent(e)) seen[e.start] = 1;
      });
      return Object.keys(seen).sort();
    }
    /* Open on the most recent day that had basketball rather than on an
       empty today. */
    function nearest(list) {
      var t = iso(new Date());
      for (var i = list.length - 1; i >= 0; i--) if (list[i] <= t) return i;
      return 0;
    }
    function clampWin() {
      win = days.length <= SLOTS ? 0
          : Math.max(0, Math.min(win, days.length - SLOTS));
    }
    function centre() {
      win = sel - Math.floor(SLOTS / 2) + 1;
      clampWin();
    }

    days = dayList();
    sel = nearest(days);
    centre();

    var strip = $('.s03, .s03wrap');
    var accHost = ($('.acc') || {}).parentElement;

    function drawStrip() {
      if (!strip) return;
      var view = days.slice(win, win + SLOTS);
      repeat(strip, '.s03-d', view, function (cell, dISO) {
        var d = new Date(dISO + 'T00:00:00');
        cell.classList.toggle('s03-on', dISO === days[sel]);
        cell.classList.remove('s03-off');
        cell.classList.add('s03-live');     /* every day in the strip has play */
        text(cell, '.s03-num', d.getDate());
        text(cell, '.s03-dow', d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase());
        text(cell, '.s03-mon', d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase());
        cell.onclick = function () { sel = days.indexOf(dISO); drawStrip(); drawLive(); };
      });
      $$('.s03nav', strip).forEach(function (b, i) {
        var back = i === 0;
        b.classList.toggle('s03nav-off',
          back ? win === 0 : win >= days.length - SLOTS);
        if (b._wired) return;
        b._wired = 1;
        b.addEventListener('click', function () { page(back ? -1 : 1); });
      });
    }

    /* The window slides a full page at a time and the movement is shown,
       so it is clear the strip travelled rather than the data changed. */
    function page(dir) {
      var was = win;
      win += dir * SLOTS;
      clampWin();
      if (win === was) return;
      drawStrip();
      var host = $('.s03', strip) || strip;
      host.classList.remove('s03-in-l', 's03-in-r');
      void host.offsetWidth;
      host.classList.add(dir > 0 ? 's03-in-r' : 's03-in-l');
    }

    function drawLive() {
      if (!accHost) return;
      var old = accHost.querySelector(':scope > .site-empty');
      if (old) old.remove();
      var dISO = days[sel];
      var evs = dISO ? stopsOn(dISO) : [];
      if (!evs.length) {
        $$('.acc', accHost).forEach(function (a) { a.hidden = true; });
        emptyState(accHost, 'Nothing on this day',
                   'Pick another date, or see every conference.');
        return;
      }
      $$('.acc', accHost).forEach(function (a) { a.hidden = false; });
      paintAccordions(evs.slice(0, 6), dISO);
      if (window.FIBA) window.FIBA.init(accHost);
    }

    function paintAccordions(evs, dISO) {
      var today = iso(new Date());
      repeat(accHost, '.acc', evs, function (node, e) {
        var c = conf(e.conference) || {};
        var g = gender[e.slug] || 'men';
        var all = D.events.filter(function (x) { return x.conference === c.id; });
        var played = all.filter(function (x) {
          return x.start && x.start <= dISO && standingsFor(x.slug);
        }).length;
        /* Live is a fact about today, not about the day being browsed. */
        var live = e.start <= today && (e.end || e.start) >= today;

        text(node, '.t-h3', confName(c));
        var meta = $$('.acc-head .t-body-s', node)[0];
        if (meta) meta.textContent = e.city + ' · Stop ' + e.number +
                                     ' of ' + (c.stopCount || all.length);
        var badge = $('.acc-head .badge', node);
        if (badge) badge.hidden = !live;
        text(node, '.acc-head .t-caption',
             'Stop ' + e.number + ' of ' + (c.stopCount || all.length));
        $$('.dot', node).forEach(function (d, i) {
          d.classList.toggle('dot-done', i < played);
          d.classList.toggle('dot-live', live && i === played - 1);
        });

        /* the switch inside the panel scopes this conference's table */
        var sw = $('.el02', node);
        if (sw) $$('.el02-seg', sw).forEach(function (seg) {
          var val = /women/i.test(seg.textContent) ? 'women' : 'men';
          seg.classList.toggle('el02-on', val === g);
          seg.onclick = function (ev) {
            ev.stopPropagation();
            gender[e.slug] = val;
            drawLive();
          };
        });

        var rows = conferenceTable(c.id, g, dISO);
        var complete = all.length && played >= all.length;
        if (!rows.length) {
          $$('.trow', node).forEach(function (r) { r.hidden = true; });
        } else {
          repeat(node, '.trow', rows.slice(0, 4), function (row, r) {
            paintStandingRow(row, r, complete);
          });
        }
        var view = $$('.lnk, .btn', node).filter(function (l) {
          return /conference/i.test(l.textContent);
        })[0];
        if (view) link(view, 'conference.html?id=' + e.conference);
      });
    }

    region = chipFilter(function (r) {
      region = r;
      var keep = days[sel];
      days = dayList();
      sel = days.indexOf(keep);
      if (sel < 0) sel = nearest(days);
      centre();
      drawStrip();
      drawLive();
    }) || 'All';

    drawStrip();
    drawLive();

    /* Qualification — LP-12: only the twenty that reach the U23 World
       Cup. Position, flag, country, and a Qualified or Shortlisted
       label. The host federation takes one of the twenty places, so
       nineteen come through the league.

       The feed carries no qualification flag yet, so the split is
       derived from tour points: the leading twelve read as Qualified,
       the next eight as Shortlisted. Swap the two lines below for the
       real field once the feed provides it. */
    var QUALIFIED = 12, FIELD = 20;
    (function () {
      var board = $('.r01');
      if (!board) return;
      var gender = 'men';

      function drawBoard() {
        var list = federationTable(gender).slice(0, FIELD);
        repeat(board, '.r01-row', list, function (row, t, i) {
          text(row, '.r01-pos .t-data-m', i + 1);
          fed(row, t.ioc, t.team);
          var confCell = $('.r01-conf', row);
          if (confCell) confCell.remove();          /* LP-12: no conference column */
          var badge = $('.badge, .marker', row);
          var qualified = i < QUALIFIED;
          if (badge) {
            badge.classList.remove('badge-q', 'badge-s', 'marker-q', 'marker-s');
            badge.classList.add(qualified ? 'badge-q' : 'badge-s');
            var lbl = $('.lbl', badge) || badge;
            lbl.textContent = qualified ? 'Qualified' : 'Shortlisted';
          }
          link(row, 'team.html?ioc=' + t.ioc);
        });
        var cut = $('.r01-cut', board);
        if (cut) {
          var note = $('.t-caption, .t-body-s', cut);
          if (note) note.textContent = 'Host federation + ' + (FIELD - 1) + ' qualifiers = ' + FIELD + ' teams';
        }
      }

      var col = board.closest('.tpl-colR');
      if (col) col.classList.add('col-3');          /* three of twelve */
      var more = col && $$('.lnk', col)[0];
      if (more) link(more, 'qualification.html');
      gender = genderSwitch(function (g) { gender = g; drawBoard(); });
      drawBoard();
    })();

    /* News — C-02 NewsRail, layout = feature: two across, the image
       over the headline and the date. Two is the layout, not a cap that
       happens to match the feed. */
    repeat(document, '.c02-hcard, .c02-card', D.news.slice(0, 2), function (card, n) {
      text(card, '.c02-title', n.title);
      var cap = $('.t-caption', card);
      if (cap) cap.textContent = fmtDate(n.date);
      photo($('.c02-himg, .c02-img', card), img(n.thumb, 900));
      link(card, 'article.html?id=' + n.slug);
    });

    /* Photos */
    var gal = D.photos.slice(0, 12);
    repeat(document, '.car-slide', gal, function (slide, g) {
      photo(slide, g.image);
      var cap = $('.t-caption', slide);
      if (cap) { cap.style.display = ''; cap.textContent = g.title; cap.style.color = '#fff'; }
    });

    /* Find a team — E-01 TeamFinder, four steps */
    (function () {
      var sub = $$('.tpl-sub').filter(function (x) {
        return /find a team/i.test((x.querySelector('.t-h2') || {}).textContent || '');
      })[0];
      if (!sub) return;
      var old = $('.search', sub);
      if (!old) return;

      fetch('partials/finder.html').then(function (r) { return r.text(); })
        .then(function (html) {
          var host = document.createElement('div');
          host.innerHTML = html;
          var f = host.querySelector('.finder');
          old.replaceWith(f);
          initFinder(f);
          if (window.FIBA) window.FIBA.init(sub);
        });
    })();

    /* Overview — S-09, type = conferences. The landing page answers
       "how far is the season" at conference level; Stops worldwide is
       the second line of the other type and belongs on the Conferences
       page. The figures were reading the event count into the
       conference line, which is why it said 108 conferences. */
    (function () {
      var host = $('.s09');
      if (!host) return;
      var today = new Date().toISOString().slice(0, 10);
      var stopsOfC = {};
      D.events.forEach(function (e) {
        (stopsOfC[e.conference] = stopsOfC[e.conference] || []).push(e);
      });
      var finished = 0, live = 0;
      D.conferences.forEach(function (c) {
        var evs = stopsOfC[c.id] || [];
        if (evs.length && evs.every(function (e) { return e.teamsRegistered; })) finished++;
        if (evs.some(function (e) {
          return e.start && e.start <= today && (e.end || e.start) >= today;
        })) live++;
      });
      var totalC = D.conferences.length;
      var kv = $$('.s09-kv', host);
      if (kv[0]) kv[0].textContent = totalC;
      if (kv[1]) kv[1].textContent = finished;
      if (kv[2]) kv[2].textContent = totalC - finished;
      if (kv[3]) kv[3].textContent = live;
      var lk = $('.s09-k-live', host);
      if (lk) lk.hidden = !live;

      /* The bar reads the season as stops played of stops scheduled —
         the finest measure we hold, whichever line is shown above it. */
      var stopsDone = playedStops().length, stopsAll = D.events.length;
      var pct = stopsAll ? (stopsDone / stopsAll) * 100 : 0;
      var fill = $('.s09-fill', host);
      if (fill) fill.style.width = pct.toFixed(1) + '%';
      var seg = $('.s09-done', host), segLive = $('.s09-live', host);
      if (seg) seg.style.flex = '1';
      if (segLive) segLive.hidden = true;
    })();
  };

  PAGES['conferences.html'] = function () {
    var today = new Date().toISOString().slice(0, 10);
    function statusOf(c) {
      var evs = D.events.filter(function (e) { return e.conference === c.id; });
      var played = evs.filter(function (e) { return e.teamsRegistered; }).length;
      var live = evs.some(function (e) {
        return e.start && e.start <= today && (e.end || e.start) >= today;
      });
      return { evs: evs, played: played, live: live, done: played >= evs.length && evs.length > 0 };
    }

    var regions = {};
    D.conferences.forEach(function (c) { (regions[c.region] = regions[c.region] || []).push(c); });
    var list = Object.keys(regions).map(function (r) { return { region: r, items: regions[r] }; });

    repeat(document, '.e03-card', list, function (card, g) {
      text(card, '.e03-region', g.region);

      /* the branded stroke marks a region that is playing right now */
      var anyLive = g.items.some(function (c) { return statusOf(c).live; });
      card.classList.toggle('brandstroke', anyLive);
      if (!anyLive) card.classList.remove('brandstroke-spin');

      /* ... and so does the region's own Live badge. It sits in the card
         header, not in a conference row, so the per-row pass below never
         reached it and every region read as live. */
      var regionBadge = $('.e03-top .badge', card);
      if (regionBadge) regionBadge.hidden = !anyLive;

      repeat(card, '.e03-conf', g.items, function (row, c) {
        var st = statusOf(c);
        text(row, '.e03-name', confName(c));
        var n = $$('.t-caption, .t-body-s', row).pop();
        if (n) n.textContent = st.played + ' of ' + st.evs.length + ' stops';

        /* E-03 carries one live signal, on the region card. A second
           badge inside the conference row is not in the spec — it was
           also being injected ahead of the name and broke the row. */
        var badge = $('.badge', row);
        if (badge) badge.hidden = !st.live;
        /* stops that have not happened are not solid black */
        $$('.dot', row).forEach(function (d, i) {
          d.classList.toggle('dot-done', i < st.played);
          d.classList.toggle('dot-live', st.live && i === st.played);
        });
        link(row, 'conference.html?id=' + c.id);
      });
    });
  };

  PAGES['conference.html'] = function () {
    var c = conf(qs.get('id')) || D.conferences[0];
    var stops = D.events.filter(function (e) { return e.conference === c.id; });
    var played = stops.filter(function (e) { return e.teamsRegistered; });
    var gender = 'men';

    /* The H1 is .f04-h1-m — it was not in this list, so the conference
       page kept whichever name the specimen was built with. */
    $$('.f04-h1-m, .f04-h1-s, .t-h1, .e02-name, .f04-title').forEach(function (n) {
      n.textContent = confName(c);
    });
    var crumbs = $$('.crumb');
    if (crumbs.length) crumbs[crumbs.length - 1].textContent = confName(c);

    /* Host city or cities, and the span the conference runs over. */
    var sub = $('.f04-idl .t-body-s');
    if (sub && stops.length) {
      var cities = [];
      stops.forEach(function (e) { if (cities.indexOf(e.city) === -1) cities.push(e.city); });
      var first = stops[0].start, last = stops[stops.length - 1].end || stops[stops.length - 1].start;
      sub.textContent = cities.slice(0, 2).join(' · ') +
        (cities.length > 2 ? ' +' + (cities.length - 2) : '') +
        ' · ' + fmtDate(first, { day: 'numeric', month: 'short' }) +
        ' – ' + fmtDate(last, { day: 'numeric', month: 'short' });
    }

    repeat(document, '.s02-stop, .s02-i', stops, function (node, e) {
      text(node, '.s02-city, .t-label', e.city);
      text(node, '.t-caption', fmtDate(e.start, { day: 'numeric', month: 'short' }));
      link(node, 'stop.html?id=' + e.slug);
    });

    /* The conference page carries two tables: standings, then games.
       Fill them separately rather than treating every .trow the same. */
    var tables = $$('.tbl');
    var standTbl = tables[0], gameTbl = tables[1];
    var complete = stops.length && played.length >= stops.length;
    function drawStandings() {
      if (!standTbl) return;
      var rows = conferenceTable(c.id, gender);
      if (!rows.length) {
        $$('.trow', standTbl).forEach(function (r) { r.hidden = true; });
        return;
      }
      repeat(standTbl, '.trow', rows, function (row, r) {
        paintStandingRow(row, r, complete);
        row.classList.toggle('trow-hi', complete && r.rank === 1);
      });
    }
    genderSwitch(function (g) { gender = g; drawStandings(); });
    drawStandings();
    var gl = played.length ? gamesFor(played[0].slug) : [];
    if (gameTbl && gl.length) repeat(gameTbl, '.trow', gl, paintGame);
    else if (gameTbl) $$('.trow', gameTbl).forEach(function (r) { r.classList.add('is-placeholder'); });
  };

  PAGES['stop.html'] = function () {
    var e = stop(qs.get('id')) || playedStops()[0];
    var men = standingsFor(e.slug, 'men');
    var women = standingsFor(e.slug, 'women');
    $$('.f04-h1-m, .f04-h1-s, .t-h1, .f04-title').forEach(function (n) {
      n.textContent = 'Stop ' + e.number + ' · ' + e.city;
    });
    var scr = $$('.crumb');
    if (scr.length >= 2) {
      scr[scr.length - 2].textContent = confName(conf(e.conference));
      link(scr[scr.length - 2].parentElement || scr[scr.length - 2],
           'conference.html?id=' + e.conference);
      scr[scr.length - 1].textContent = 'Stop ' + e.number;
    }
    var sub = $('.f04-idl .t-body-s, .f04-sub, .el01-sub');
    if (sub) sub.textContent = [e.venue, e.location, fmtDate(e.start)].filter(Boolean).join(' · ');

    var pool = men || women;
    if (pool) {
      repeat(document, '.s05-row', pool.rows, function (row, r) {
        text(row, '.s05-seed', r.seed);
        fed(row, r.ioc, r.team);
        var n = $$('.s05-n', row);
        if (n[0]) n[0].textContent = r.won + '–' + (r.played - r.won);
        if (n[1]) n[1].textContent = r.points;
        if (n[2]) n[2].textContent = r.avg;
        link(row, 'team.html?ioc=' + r.ioc);
      });
    }
    var gl = gamesFor(e.slug);
    if (gl.length) repeat(document, '.trow', gl, paintGame);
    else $$('.trow').forEach(function (r) { r.classList.add('is-placeholder'); });
  };

  PAGES['standings.html'] = function () {
    var tbl = $('.tbl');
    var gender = 'men', query = '';

    function draw() {
      var list = federationTable(gender).filter(function (t) {
        return !query || (t.team + ' ' + t.ioc).toLowerCase().indexOf(query) > -1;
      });
      if (!list.length) {
        $$('.trow', tbl).forEach(function (r) { r.hidden = true; });
        emptyState(tbl.parentElement, 'No federation matches', 'Try a different name or IOC code.');
        return;
      }
      var e = tbl.parentElement.querySelector(':scope > .site-empty');
      if (e) e.remove();
      repeat(tbl, '.trow', list, function (row, t) {
        row.hidden = false;
        fed(row, t.ioc, t.team);
        var nums = $$('.t-data-m', row);
        if (nums[0]) nums[0].textContent = t.rank;
        if (nums.length > 3) {
          nums[nums.length - 4].textContent = (t.winRatio * 100).toFixed(0) + '%';
          nums[nums.length - 3].textContent = t.points;
          nums[nums.length - 2].textContent = t.avg;
          nums[nums.length - 1].textContent = t.stops;
        }
        text(row, '.cell-conference .t-body-s', confName(conf(t.conference)));
        link(row, 'team.html?ioc=' + t.ioc);
      });
    }

    gender = genderSwitch(function (g) { gender = g; draw(); });
    searchField(document, 'Search a federation or IOC code', function (q) { query = q; draw(); });
    draw();
  };

  PAGES['teams.html'] = function () {
    var seen = {}, all = [];
    D.teams.forEach(function (t) {
      if (!t.ioc || seen[t.ioc]) return;
      seen[t.ioc] = 1;
      all.push(t);
    });
    all.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });

    var grid = $('.e09-grid') || $('.e09');
    var letter = '', query = '';

    var letters = {};
    all.forEach(function (t) { letters[(t.name || '?')[0].toUpperCase()] = 1; });
    $$('.alpha-i').forEach(function (a) {
      var ch = a.textContent.trim().toUpperCase();
      if (!letters[ch]) { a.classList.add('alpha-dis'); return; }
      a.addEventListener('click', function () {
        letter = (letter === ch) ? '' : ch;      /* click again to clear */
        $$('.alpha-i').forEach(function (x) { x.classList.remove('alpha-on'); });
        if (letter) a.classList.add('alpha-on');
        draw();
      });
    });

    function draw() {
      var list = all.filter(function (t) {
        var n = (t.name || '').toUpperCase();
        return (!letter || n[0] === letter) &&
               (!query || (t.name + ' ' + t.ioc).toLowerCase().indexOf(query) > -1);
      });
      var e = grid.parentElement.querySelector(':scope > .site-empty');
      if (e) e.remove();
      if (!list.length) {
        grid.hidden = true;
        emptyState(grid.parentElement, 'No federation matches',
                   'Try another letter, or clear the search.');
        return;
      }
      grid.hidden = false;
      repeat(grid, '.e09-cell', list, function (cell, t) {
        flag(cell, t.ioc);
        text(cell, '.e09-n', t.name);
        text(cell, '.e09-c', t.ioc);
        link(cell, 'team.html?ioc=' + t.ioc);
      });
    }

    searchField(document, 'Search for a federation or IOC code', function (q) { query = q; draw(); });
    draw();
  };

  PAGES['team.html'] = function () {
    var ioc = qs.get('ioc');
    var t = (ioc ? D.teams.filter(function (x) { return x.ioc === ioc; })[0] : null) || D.teams[0];
    var all = D.teams.filter(function (x) { return x.ioc === t.ioc; });
    $$('.t-h1, .e04-name, .f04-title').forEach(function (n) { n.textContent = t.name; });
    var head = $('.e04-top') || $('.e04');
    if (head) { flag(head, t.ioc); text(head, '.ftag-code', t.ioc); text(head, '.ftag-name', t.name); }

    /* A 3x3 squad is four players at one stop. Show the most recent squad
       rather than everyone the federation has fielded all season. */
    var squad = all.slice().sort(function (a, b) {
      var ea = stop(a.stop) || {}, eb = stop(b.stop) || {};
      return (eb.start || '').localeCompare(ea.start || '');
    })[0] || t;
    var roster = squad.roster.map(function (m) { return player(m.id); })
                             .filter(Boolean);
    /* the wrapper is the repeated unit: it carries the card's shadow */
    repeat(document, '.pcard-sh', roster, function (card, p) {
      text(card, '.pcard-first', p.first);
      text(card, '.pcard-last', p.last);
      text(card, '.pcard-ioc', p.ioc);
      flag(card, p.ioc);
      var v = $$('.pcard-v', card);
      if (v[0]) v[0].textContent = p.age != null ? p.age : '';
      if (v[1]) v[1].textContent = Math.round((p.rankingPoints || 0) / 1000) + 'k';
      link(card, 'player.html?id=' + p.id);
    });

    /* season totals across every stop this federation played */
    var rows = [];
    D.standings.forEach(function (s) {
      s.rows.forEach(function (r) { if (r.ioc === t.ioc) rows.push(r); });
    });
    var tot = rows.reduce(function (a, r) {
      a.played += r.played || 0; a.won += r.won || 0; a.points += r.points || 0; return a;
    }, { played: 0, won: 0, points: 0 });
    var ev = $$('.e04-v');
    if (ev[0]) ev[0].textContent = tot.points;
    if (ev[1]) ev[1].textContent = tot.played ? (tot.won / tot.played).toFixed(2) : '—';
    if (ev[2]) ev[2].textContent = tot.won + '–' + (tot.played - tot.won);
    if (ev[3]) ev[3].textContent = rows.length;
  };

  PAGES['player.html'] = function () {
    var p = player(qs.get('id')) || D.players[0];
    text(document, '.e05-first', p.first);
    text(document, '.e05-last', p.last);
    $$('.f04-title').forEach(function (n) { n.textContent = p.name; });
    var ph = $('.e05-id') || $('.e05');
    if (ph) { flag(ph, p.ioc); text(ph, '.ftag-code', p.ioc); text(ph, '.ftag-name', p.country); }
    var g = $$('.e05-gv');
    if (g[0]) g[0].textContent = p.age != null ? p.age : '';
    if (g[1]) g[1].textContent = (p.rankingPoints || 0).toLocaleString();
    if (g[2]) g[2].textContent = p.city || p.country || '';
    /* no per-game statistics in the snapshot yet */
    $$('.e06-row, .e07-row').forEach(function (r) { r.classList.add('is-placeholder'); });
  };

  PAGES['news.html'] = function () {
    repeat(document, '.c04-row', D.news, function (row, n) {
      text(row, '.c04-t', n.title);
      var cap = $('.t-caption', row);
      if (cap) cap.textContent = fmtDate(n.date);
      photo($('.c04-img', row), img(n.thumb, 600));
      link(row, 'article.html?id=' + n.slug);
    });
  };

  PAGES['article.html'] = function () {
    var id = qs.get('id');
    var n = D.news.filter(function (x) { return x.slug === id; })[0] || D.news[0];
    var body = $('.c05-body');
    var h = body && (body.querySelector('.t-h2') || body.querySelector('.c05-h2'));
    if (h) h.textContent = n.title;
    var cap = body && body.querySelector('.t-caption');
    if (cap) cap.textContent = fmtDate(n.date) + ' · 3 min read';
    photo($('.c05-hero'), img(n.image, 1600, '16:9'));
  };

  PAGES['calendar.html'] = function () {
    var host = $('.s07') || $('.tpl-content');
    var region = 'All';

    function draw() {
      var evs = D.events.filter(function (e) {
        if (region === 'All') return true;
        var c = conf(e.conference);
        return c && c.name.toLowerCase().indexOf(region.toLowerCase().replace('asiapacific', 'asia')) === 0;
      });
      var byMonth = {};
      evs.forEach(function (e) {
        var m = (e.start || '').slice(0, 7);
        if (m) (byMonth[m] = byMonth[m] || []).push(e);
      });
      var months = Object.keys(byMonth).sort();

      var e0 = host.parentElement && host.parentElement.querySelector(':scope > .site-empty');
      if (e0) e0.remove();
      if (!months.length) {
        emptyState(host.parentElement, 'No stops in this region',
                   'Pick another region to see its schedule.');
        return;
      }
      var made = repeat(host, '.s07-month, .s07-row, .trow', months, function (node, m) {
        text(node, '.t-label, .t-h3', fmtDate(m + '-01', { month: 'long', year: 'numeric' }));
        repeat(node, '.trow, .s07-i', byMonth[m], function (row, e) {
          text(row, '.t-label', e.city + ' · Stop ' + e.number);
          text(row, '.t-caption', fmtDate(e.start, { day: 'numeric', month: 'short' }));
          text(row, '.t-body-s', (conf(e.conference) || {}).name || '');
          link(row, 'stop.html?id=' + e.slug);
        });
      });
      if (!made) {
        /* the template has no month rows to clone — list the stops flat */
        repeat(host, '.trow', evs, function (row, e) {
          text(row, '.t-label', e.city + ' · Stop ' + e.number);
          text(row, '.t-caption', fmtDate(e.start));
          link(row, 'stop.html?id=' + e.slug);
        });
      }
    }

    region = chipFilter(function (r) { region = r; draw(); }) || 'All';
    draw();
  };

  PAGES['stats.html'] = function () {
    /* The squads tell us which federation a player belongs to. */
    var teamOf = {};
    D.teams.forEach(function (t) {
      t.roster.forEach(function (m) { if (m.id) teamOf[m.id] = t; });
    });

    var host = $('.r05') || $('.tbl') || document;
    var gender = 'men', metric = 'Points';

    function draw() {
      var list = D.players.filter(function (p) {
        return !gender || !p.gender || p.gender === (gender === 'women' ? 'female' : 'male');
      });
      list = list.slice().sort(function (a, b) {
        if (metric === 'Games played') return (teamOf[b.id] ? 1 : 0) - (teamOf[a.id] ? 1 : 0);
        return (b.rankingPoints || 0) - (a.rankingPoints || 0);
      }).slice(0, 30);

      var e = host.parentElement && host.parentElement.querySelector(':scope > .site-empty');
      if (e) e.remove();
      if (!list.length) {
        emptyState(host.parentElement, 'Nothing to rank yet',
                   'No player data for this category.');
        return;
      }
      repeat(host, '.trow', list, function (row, p, i) {
        text(row, '.r05-rank', i + 1);
        text(row, '.r05-pl', p.name);
        var t = teamOf[p.id];
        /* team is the third column, per the review */
        fed(row, p.ioc, (t && t.name) || p.country);
        var n = $$('.r05-num', row);
        if (n[0]) n[0].textContent = p.age != null ? p.age : '';
        if (n[1]) n[1].textContent = (p.rankingPoints || 0).toLocaleString();
        link(row, 'player.html?id=' + p.id);
      });
    }

    gender = genderSwitch(function (g) { gender = g; draw(); });
    metric = chipFilter(function (m) { metric = m; draw(); }) || metric;
    draw();
  };

  PAGES['qualification.html'] = function () {
    var QUALIFIED = 12, FIELD = 20;
    var host = $('.r01') || $('.tbl');
    var gender = 'men';
    function draw() {
      var list = federationTable(gender).slice(0, FIELD);
      repeat(host, '.r01-row, .trow', list, function (row, t, i) {
        text(row, '.r01-pos .t-data-m', i + 1);
        fed(row, t.ioc, t.team);
        var cc = $('.r01-conf', row);
        if (cc) cc.textContent = (conf(t.conference) || {}).name || '';
        var badge = $('.badge, .marker', row);
        if (badge) {
          var q = i < QUALIFIED;
          badge.classList.remove('badge-q', 'badge-s', 'marker-q', 'marker-s');
          badge.classList.add(q ? 'badge-q' : 'badge-s');
          ($('.lbl', badge) || badge).textContent = q ? 'Qualified' : 'Shortlisted';
        }
        link(row, 'team.html?ioc=' + t.ioc);
      });
    }
    gender = genderSwitch(function (g) { gender = g; draw(); });
    draw();
  };

  PAGES['search.html'] = function () {
    var pool = D.teams.filter(function (t, i, a) {
      return a.findIndex(function (x) { return x.ioc === t.ioc; }) === i;
    }).slice(0, 8);
    repeat(document, '.e11-row', pool, function (row, t) {
      fed(row, t.ioc, t.name);
      text(row, '.e11-t', t.name);
      text(row, '.e11-m', (conf(t.conference) || {}).name || '');
      link(row, 'team.html?ioc=' + t.ioc);
    });
  };

  /* ---------- site chrome: mega menu and search overlay -------
     Both are documented modules (F-05 and E-11). They live in
     partials/ so a change is one file, and they are injected into
     every page rather than duplicated into fourteen.            */
  function initChrome() {
    var host = $('.tpl') || document.body;

    /* The panel hangs below the chrome, so measure it rather than
       hard-coding 98px — the corporate strip can wrap. */
    function chromeHeight() {
      var f02 = $('.f02'), f03 = $('.f03');
      return (f02 ? f02.offsetHeight : 0) + (f03 ? f03.offsetHeight : 0);
    }
    function place(el) {
      if (el) el.style.setProperty('--chrome-h', chromeHeight() + 'px');
    }
    window.addEventListener('resize', function () { place(mm); place(ovl); });

    var openPanel = null, closeTimer = null;
    function open(el, on) {
      if (!el) return;
      clearTimeout(closeTimer);
      if (on) {
        if (openPanel && openPanel !== el) open(openPanel, false);
        place(el);
        el.hidden = false;
        /* one frame with the panel measured but still raised, so the
           transition has somewhere to come from */
        requestAnimationFrame(function () { el.classList.add('is-open'); });
        openPanel = el;
      } else {
        el.classList.remove('is-open');
        closeTimer = setTimeout(function () { el.hidden = true; }, 320);
        if (openPanel === el) openPanel = null;
      }
    }

    Promise.all([
      fetch('partials/megamenu.html').then(function (r) { return r.text(); }),
      fetch('partials/search.html').then(function (r) { return r.text(); })
    ]).then(function (parts) {
      var wrap = document.createElement('div');
      wrap.innerHTML = parts[0] + parts[1];
      var mm = wrap.querySelector('.mm');
      var ovl = wrap.querySelector('.ovl');
      if (mm) { mm.classList.add('site-mm'); host.appendChild(mm); }

      /* T · Search *is* the overlay, so use the one already on the page
         rather than stacking a second copy on top of it. */
      var onSearchPage = document.body.dataset.page === 'search.html';
      if (onSearchPage) {
        ovl = $('.ovl');
        if (ovl) ovl.hidden = false;
      } else if (ovl) {
        ovl.classList.add('site-ovl');
        host.appendChild(ovl);
      }

      /* Apple's pattern: hover opens on a mouse, tap opens on touch. */
      var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      function trigger(el, panel) {
        if (!el) return;
        el.style.cursor = 'pointer';
        el.addEventListener('click', function (e) { e.preventDefault(); open(panel, true); });
        if (!fine) return;
        el.addEventListener('mouseenter', function () { open(panel, true); });
      }
      if (fine) {
        /* leaving both the trigger and the panel closes it */
        [mm, ovl].forEach(function (p) {
          if (!p) return;
          p.addEventListener('mouseleave', function () { open(p, false); });
        });
      }

      $$('.f03-i').forEach(function (i) {
        if (!/^more$/i.test(i.textContent.trim())) return;
        i.classList.add('f03-more');
        trigger(i.closest('a') || i, mm);
      });
      $$('.mm-close', mm).forEach(function (c) {
        c.addEventListener('click', function () { open(mm, false); });
      });

      /* the magnifier opens the search overlay */
      $$('.f03-search').forEach(function (sBtn) {
        var host2 = sBtn.closest('a') || sBtn;
        host2.style.cursor = 'pointer';
        function show(e) {
          if (e) e.preventDefault();
          open(ovl, true);
          var inp = ovl && ovl.querySelector('input');
          if (inp) setTimeout(function () { inp.focus(); }, 60);
        }
        host2.addEventListener('click', show);
        /* With one panel already open, sliding across to the other
           trigger swaps them straight away rather than closing first. */
        if (fine) host2.addEventListener('mouseenter', function () { show(); });
      });
      $$('.ovl-close', ovl).forEach(function (c) {
        c.style.cursor = 'pointer';
        c.addEventListener('click', function () {
          if (onSearchPage) { history.length > 1 ? history.back() : (location.href = 'index.html'); }
          else open(ovl, false);
        });
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { open(mm, false); open(ovl, false); }
      });

      /* the overlay's field is a real input over real data */
      if (ovl) {
        var txt = ovl.querySelector('.search-txt, .search-txt-filled');
        if (txt) {
          var inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'search-in';
          inp.setAttribute('autocomplete', 'off');
          inp.placeholder = 'Search for a federation, player or article';
          txt.replaceWith(inp);
          inp.addEventListener('input', function () { searchOverlay(ovl, this.value); });
        }
        searchOverlay(ovl, '');       /* empty: every group hidden */
      }
      if (window.FIBA) window.FIBA.init(host);
    });
  }

  /* Federations, players and news, filtered live. */
  function searchOverlay(ovl, q) {
    q = (q || '').trim().toLowerCase();
    var scrim = $('.ovl-scrim', ovl);
    if (!q) {
      /* An empty field lists nothing — results appear as you type. */
      if (scrim) scrim.hidden = true;
      return;
    }
    if (scrim) scrim.hidden = false;

    var feds = [], seen = {};
    D.teams.forEach(function (t) {
      if (!t.ioc || seen[t.ioc]) return;
      seen[t.ioc] = 1;
      if ((t.name + ' ' + t.ioc).toLowerCase().indexOf(q) > -1) feds.push(t);
    });
    var players = D.players.filter(function (p) {
      return (p.name || '').toLowerCase().indexOf(q) > -1;
    }).slice(0, 6);
    var news = D.news.filter(function (n) {
      return (n.title || '').toLowerCase().indexOf(q) > -1;
    });

    var groups = $$('.e11-g', ovl);
    var sets = [
      { rows: feds.slice(0, 6), label: 'Federations',
        paint: function (row, t) {
          fed(row, t.ioc, t.name);
          text(row, '.e11-t', t.name);
          text(row, '.e11-m', (conf(t.conference) || {}).name || '');
          link(row, 'team.html?ioc=' + t.ioc);
        } },
      { rows: players, label: 'Players',
        paint: function (row, p) {
          fed(row, p.ioc, p.country);
          text(row, '.e11-t', p.name);
          text(row, '.e11-m', p.country || '');
          link(row, 'player.html?id=' + p.id);
        } },
      { rows: news, label: 'News',
        paint: function (row, n) {
          text(row, '.e11-t', n.title);
          text(row, '.e11-m', fmtDate(n.date));
          link(row, 'article.html?id=' + n.slug);
        } }
    ];
    groups.forEach(function (g, i) {
      var set = sets[i];
      if (!set) return;
      g.hidden = !set.rows.length;
      var h = $('.e11-gh', g);
      if (h) {
        text(h, '.t-h3', set.label);
        text(h, '.t-caption', set.rows.length + ' result' + (set.rows.length === 1 ? '' : 's'));
      }
      repeat(g, '.e11-row', set.rows, set.paint);
    });
  }

  /* ---------- boot ------------------------------------------ */
  var FILES = ['conferences', 'events', 'standings', 'teams', 'players', 'news', 'photos', 'games'];

  Promise.all(FILES.map(function (f) {
    return fetch('assets/data/' + f + '.json').then(function (r) { return r.json(); });
  })).then(function (res) {
    FILES.forEach(function (f, i) { D[f] = res[i]; });
    D.playersById = {};
    D.players.forEach(function (p) { D.playersById[p.id] = p; });

    var page = document.body.dataset.page || 'index.html';
    try {
      if (PAGES[page]) PAGES[page]();
    } catch (e) {
      console.error('render failed on', page, e);
    }
    try { initChrome(); } catch (e) { console.error('chrome failed', e); }
    document.body.dataset.rendered = page;
    if (window.FIBA) window.FIBA.init(document);
  }).catch(function (e) {
    console.error('data load failed', e);
  });
})();
