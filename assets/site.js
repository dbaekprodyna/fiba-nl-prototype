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

  /* el-23 Breadcrumb. Pages that carry an entity in the trail were
     leaving the specimen's text in place, so a team page opened from any
     federation still read "Home / Teams / Serbia" and a stop page kept
     whichever conference the specimen was built with. Every page states
     its own trail now. */
  function crumbs(items) {
    var host = $('.crumbs') || $('.f04-crumbs');
    if (!host) return;
    var sep = $('.crumb-sep', host);
    var sepHTML = sep ? sep.outerHTML : ' / ';
    host.innerHTML = items.map(function (it, i) {
      var last = i === items.length - 1;
      var span = '<span class="crumb' + (last ? ' crumb-cur' : '') + '">' +
                 (it.label || '') + '</span>';
      return (!last && it.href)
        ? '<a class="nav-a" href="' + it.href + '">' + span + '</a>'
        : span;
    }).join(sepHTML);
  }

  function link(node, href) {
    if (!href) return;
    node.setAttribute('data-href', href);
    node.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      location.href = href;
    });
  }

  /* The snapshot repeats the city when the feed's city and region are
     the same string — "Riga, Riga". Collapse repeated segments once,
     here, rather than in every place a city is printed. */
  function cityOf(e) {
    var out = [];
    String((e && e.city) || '').split(',').forEach(function (s) {
      s = s.trim();
      if (s && out.indexOf(s) === -1) out.push(s);
    });
    return out.join(', ');
  }

  function ordinal(n) {
    if (!n) return '—';
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
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

  /* Twenty places at the U23 World Cup: the host takes one, nineteen
     come through the league. The feed carries no qualification flag, so
     the field is derived from tour points — the leading twelve read as
     Qualified, the next eight as Shortlisted, everyone else as Not
     qualified. Derived in one place so the landing page, the Standings
     table and the Qualification view cannot disagree. */
  var QUALIFIED = 12, FIELD = 20;

  /* A season-wide federation table, built from every stop we have.
     Tour points are the ranking measure — the column has always been
     labelled Tour Points, but it was being filled with the basketball
     points a team scored, which ranked the table by offence. */
  function federationTable(gender) {
    var by = {};
    D.standings.filter(function (s) {
      return !gender || !s.gender || s.gender === gender;
    }).forEach(function (s) {
      s.rows.forEach(function (r) {
        var k = r.ioc;
        if (!k) return;
        by[k] = by[k] || { ioc: k, team: r.team, played: 0, won: 0, scored: 0,
                           tour: 0, stops: 0, conference: s.conference };
        by[k].played += r.played || 0;
        by[k].won += r.won || 0;
        by[k].scored += r.points || 0;
        by[k].tour += tourPoints(r.rank);
        by[k].stops += 1;
      });
    });
    var list = Object.keys(by).map(function (k) { return by[k]; });
    list.forEach(function (t) {
      t.winRatio = t.played ? t.won / t.played : 0;
      t.avg = t.played ? Math.round((t.scored / t.played) * 10) / 10 : 0;
      t.confname = confName(conf(t.conference));
    });
    list.sort(function (a, b) { return b.tour - a.tour || b.winRatio - a.winRatio; });
    list.forEach(function (t, i) {
      t.rank = i + 1;
      t.status = i < QUALIFIED ? 'q' : (i < FIELD ? 's' : 'n');
      t.statusRank = { q: 0, s: 1, n: 2 }[t.status];
    });
    return list;
  }

  /* el-05 StatusBadge as a table marker. */
  function marker(row, code) {
    var mk = $('.cell-status .marker', row);
    if (!mk) return;
    ['q', 's', 'r', 'n'].forEach(function (c) {
      mk.classList.remove('marker-' + c, 'el-05-StatusBadge--marker-' + c);
    });
    mk.classList.add('marker-' + code, 'el-05-StatusBadge--marker-' + code);
    text(mk, '.lbl', code.toUpperCase());
  }

  /* el-08 TableHeaderRow: the sort arrow and the cell-sorted class were
     painted into the specimen but nothing was wired, so the header
     looked like a control and behaved like a label. */
  function cmp(key, dir) {
    return function (a, b) {
      var x = a[key], y = b[key];
      var r = (typeof x === 'string' || typeof y === 'string')
        ? String(x || '').localeCompare(String(y || ''))
        : (x || 0) - (y || 0);
      return r * dir;
    };
  }
  function sortable(tbl, cols, state, onSort) {
    $$('.thead .cell-sortable', tbl).forEach(function (cell) {
      var key = null, text0 = null;
      Object.keys(cols).forEach(function (c) {
        if (cell.classList.contains(c)) { key = cols[c].key; text0 = cols[c].text; }
      });
      if (!key) return;
      function paint() {
        $$('.thead .cell-sortable', tbl).forEach(function (c) {
          c.classList.remove('cell-sorted');
          var s = c.querySelector('svg');
          if (s) s.style.transform = '';
        });
        cell.classList.add('cell-sorted');
        var s = cell.querySelector('svg');
        if (s) s.style.transform = state.dir > 0 ? 'rotate(180deg)' : '';
      }
      cell.onclick = function () {
        var first = text0 ? 1 : -1;          /* names A→Z, numbers high first */
        state.dir = (state.key === key) ? -state.dir : first;
        state.key = key;
        paint();
        onSort();
      };
      if (state.key === key) paint();
    });
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

  /* The feed's region field is not a region: Europe arrives as four
     separate values (Europe-1 … Europe-4) and every U21 conference
     arrives as "U21", which would collect the U21 conferences into a
     group of their own. Region is derived from the conference instead,
     so U21 Europe-2 sits under Europe with the rest of Europe — the
     way the wireframe grouped them. */
  var REGIONS = ['Europe', 'Americas', 'Africa', 'Oceania', 'AsiaPacific'];
  function regionOf(c) {
    var id = (c && c.id) || '';
    if (id.indexOf('africa') > -1) return 'Africa';
    if (id.indexOf('americas') > -1) return 'Americas';
    if (id.indexOf('europe') > -1) return 'Europe';
    if (id.indexOf('asia') > -1) return 'AsiaPacific';
    if (id.indexOf('pacific') > -1) return 'Oceania';
    return 'Other';
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

  /* el-02 GenderSwitch → 'men' | 'women'. Scoped, because a page can
     carry more than one: the landing page has the switch in F-04's slot,
     one inside each live accordion and one on the qualification board,
     and a document-wide binding made them all move together. */
  function genderSwitch(onChange, root) {
    var host = root || $('.f04-ctl') || document;
    var seg = $$('.el02-seg', host);
    if (!seg.length && host !== document) seg = $$('.el02-seg', document);
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
    /* el-11 carries a clear control at the trailing edge. It was only
       in the search overlay's markup, so the field on Teams and
       Standings had no way back to the full list except selecting the
       text by hand. */
    var clear = $('.search-clear', box);
    if (!clear) {
      clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'search-clear';
      clear.setAttribute('aria-label', 'Clear search');
      clear.innerHTML = '<svg viewBox="0 -960 960 960" width="20" height="20" fill="currentColor" aria-hidden="true">' +
        '<path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>';
      box.appendChild(clear);
    }
    function toggleClear() { clear.hidden = !inp.value.length; }
    toggleClear();
    inp.addEventListener('input', function () {
      toggleClear();
      onChange(this.value.trim().toLowerCase());
    });
    clear.addEventListener('click', function () {
      inp.value = '';
      toggleClear();
      onChange('');
      inp.focus();
    });
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

  /* C-03 PhotoGallery, wherever it appears. The landing page painted
     its own carousel inline; the team, conference and stop pages carry
     the same block, so the painter is shared. */
  function paintPhotos(list) {
    if (!list || !list.length) {
      $$('.car').forEach(function (c) { c.hidden = true; });
      return;
    }
    repeat(document, '.car-slide', list, function (slide, g) {
      photo(slide, g.image);
      var cap = $('.t-caption', slide);
      if (cap) { cap.style.display = ''; cap.textContent = g.title; cap.style.color = '#fff'; }
    });
  }

  /* el-02 GenderSwitch, built from the team sites a federation actually
     fields. A federation may enter U23 only, U21 only, or both, and the
     switch has to say which — on a conference page the category is in
     the conference name, but a team page holds both categories at once.
     Two segments become four when it does. */
  function categorySwitch(host, sites, onChange) {
    var el = $('.el02', host || document);
    if (!el) return null;
    var have = {};
    sites.forEach(function (t) {
      var cat = /(^|-)u21(-|$)/.test(t.conference || '') ? 'U21' : 'U23';
      have[cat + '|' + (t.gender || 'men')] = t;
    });
    var cats = ['U23', 'U21'].filter(function (c) {
      return have[c + '|men'] || have[c + '|women'];
    });
    var both = cats.length > 1;
    var opts = [];
    cats.forEach(function (c) {
      ['men', 'women'].forEach(function (g) {
        if (!have[c + '|' + g]) return;
        opts.push({
          cat: c, gender: g,
          label: (both ? c + ' ' : '') + (g === 'men' ? 'Men' : 'Women')
        });
      });
    });
    if (!opts.length) return null;

    var proto = $('.el02-seg', el).cloneNode(true);
    el.innerHTML = '';
    var current = opts[0];
    opts.forEach(function (o) {
      var seg = proto.cloneNode(true);
      seg.classList.remove('el02-on');
      text(seg, '.lbl', o.label);
      seg.onclick = function () {
        current = o;
        $$('.el02-seg', el).forEach(function (s) { s.classList.remove('el02-on'); });
        seg.classList.add('el02-on');
        onChange(o);
      };
      el.appendChild(seg);
      if (o === current) seg.classList.add('el02-on');
    });
    el.classList.toggle('el02-quad', opts.length > 2);
    return current;
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
      return region === 'All' || regionOf(conf(e.conference)) === region;
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
        /* The red dot means live now. Every day in the strip has play,
           so marking them all made the whole season look live. */
        cell.classList.toggle('s03-live', dISO === iso(new Date()));
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
      gender = genderSwitch(function (g) { gender = g; drawBoard(); }, $('.r01-ctl'));
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
    mountFinder();

    paintOverview();

  };

  /* S-09 Overview, on whichever page carries it. The landing page shows
     the conferences line alone; the Conferences page shows both. The
     figures are the same either way, so the painter is one. */
  function paintOverview() {
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
    var stopsDone = playedStops().length, stopsAll = D.events.length;
    var stopsLive = D.events.filter(function (e) {
      return e.start && e.start <= today && (e.end || e.start) >= today;
    }).length;

    var lines = $$('.s09-line', host);
    function fill(line, vals) {
      if (!line) return;
      var kv = $$('.s09-kv', line);
      vals.forEach(function (v, i) { if (kv[i]) kv[i].textContent = v; });
      var lk = $('.s09-k-live, .s09-k-live2', line);
      if (lk) lk.hidden = !vals[3];
    }
    fill(lines[0], [totalC, finished, totalC - finished, live]);
    fill(lines[1], [stopsAll, stopsDone, stopsAll - stopsDone, stopsLive]);

    /* The bar is read in the same unit as the line above it: the
       landing page counts conferences, the Conferences page counts
       stops. Otherwise the line says "1 live" and the bar has nothing
       red in it, which is what it was doing. */
    var byConf = host.classList.contains('s09-conf');
    var total = byConf ? totalC : stopsAll;
    var done  = byConf ? finished : stopsDone;
    var now   = byConf ? live : stopsLive;
    var pctDone = total ? (done / total) * 100 : 0;
    var pctLive = total ? (now / total) * 100 : 0;

    var fillbar = $('.s09-fill', host);
    if (fillbar) fillbar.style.width = (pctDone + pctLive).toFixed(2) + '%';
    var seg = $('.s09-done', host), segLive = $('.s09-live', host);
    /* Flex shares rather than widths: the two segments divide whatever
       the fill is, so a live-only season still shows red. */
    if (seg) {
      seg.hidden = !done;
      seg.style.flex = String(Math.max(pctDone, 0.001));
    }
    if (segLive) {
      segLive.hidden = !now;
      segLive.style.flex = String(Math.max(pctLive, 0.001));
    }
  }

  /* E-01 TeamFinder replaces the plain search field in whichever block
     asks for it. */
  function mountFinder() {
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
  }

  PAGES['conferences.html'] = function () {
    mountFinder();
    paintOverview();

    var today = new Date().toISOString().slice(0, 10);
    function statusOf(c) {
      var evs = D.events.filter(function (e) { return e.conference === c.id; });
      var played = evs.filter(function (e) { return standingsFor(e.slug); }).length;
      var live = evs.some(function (e) {
        return e.start && e.start <= today && (e.end || e.start) >= today;
      });
      return { evs: evs, played: played, live: live,
               done: played >= evs.length && evs.length > 0 };
    }

    /* Federations in a conference: the same set in both genders, so one
       pass over the men's entries names them all. */
    function fedsOf(c) {
      var seen = {}, out = [];
      D.teams.forEach(function (t) {
        if (t.conference !== c.id || !t.ioc || seen[t.ioc]) return;
        seen[t.ioc] = 1;
        out.push(t);
      });
      out.sort(function (a, b) { return a.ioc.localeCompare(b.ioc); });
      return out;
    }

    var groups = REGIONS.map(function (r) {
      return { region: r, items: D.conferences.filter(function (c) { return regionOf(c) === r; }) };
    }).filter(function (g) { return g.items.length; });

    repeat($('.e03'), '.e03-group', groups, function (grp, g) {
      text(grp, '.e03-region', g.region);
      repeat(grp, '.e03-card', g.items, function (card, c) {
        var st = statusOf(c);
        text(card, '.e03-name', confName(c));
        var badge = $('.badge', card);
        if (badge) badge.hidden = !st.live;
        card.classList.toggle('brandstroke', st.live);
        text(card, '.e03-prog', st.played + ' of ' + st.evs.length + ' stops');
        $$('.dot', card).forEach(function (d, i) {
          d.classList.toggle('dot-done', i < st.played);
          d.classList.toggle('dot-live', st.live && i === st.played);
        });
        var feds = fedsOf(c);
        if (feds.length) {
          repeat(card, '.ftag', feds, function (tag, t) {
            flag(tag, t.ioc);
            text(tag, '.ftag-code', t.ioc);
            tag.title = t.name;
          });
        } else {
          var box = $('.e03-feds', card);
          if (box) box.hidden = true;
        }
        link(card, 'conference.html?id=' + c.id);
      });
    });
  };

  /* ctl-03 Tab as a pane switch. Panes are marked in the markup with
     data-pane, so adding a block to a tab is a markup change and not a
     JavaScript one. */
  function tabPanes(scope, tabsSel) {
    var tabs = $$(tabsSel + ' .tab', scope || document);
    if (!tabs.length) return;
    function show(name) {
      tabs.forEach(function (t) {
        t.classList.toggle('tab-active', t.dataset.tab === name);
      });
      $$('[data-pane]', scope || document).forEach(function (p) {
        p.hidden = p.dataset.pane !== name;
      });
    }
    tabs.forEach(function (t) { t.onclick = function () { show(t.dataset.tab); }; });
    show((tabs.filter(function (t) { return t.classList.contains('tab-active'); })[0] || tabs[0]).dataset.tab);
  }

  /* E-08 PlayerCard: tip towards the pointer. The angles are written as
     custom properties so the transform itself stays in motion.css. */
  function tiltCards(root) {
    $$('.pcard-sh', root || document).forEach(function (sh) {
      if (sh._tilt) return;
      sh._tilt = 1;
      var card = $('.pcard', sh), shine = $('.pcard-shine', sh);
      if (!card) return;
      sh.addEventListener('pointermove', function (ev) {
        var r = sh.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--tilt-y', (x * 12).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-x', (-y * 8).toFixed(2) + 'deg');
        if (shine) {
          shine.style.setProperty('--shine-p', (30 + (x + 0.5) * 40).toFixed(0) + '%');
          shine.style.setProperty('--shine-a', (100 + y * 30).toFixed(0) + 'deg');
        }
      });
      sh.addEventListener('pointerleave', function () {
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--tilt-x', '0deg');
      });
    });
  }

  PAGES['conference.html'] = function () {
    var c = conf(qs.get('id')) || D.conferences[0];
    var stops = D.events.filter(function (e) { return e.conference === c.id; })
                        .sort(function (a, b) { return (a.number || 0) - (b.number || 0); });
    var played = stops.filter(function (e) { return standingsFor(e.slug); });
    var gender = 'men';
    var sel = Math.max(0, played.length - 1);   /* the newest stop with results */

    $$('.f04-h1-m, .f04-h1-s, .t-h1, .e02-name, .f04-title').forEach(function (n) {
      n.textContent = confName(c);
    });
    crumbs([{ label: 'Home', href: 'index.html' },
            { label: 'Conferences', href: 'conferences.html' },
            { label: confName(c) }]);

    var sub = $('.f04-idl .t-body-s');
    if (sub && stops.length) {
      var cities = [];
      stops.forEach(function (e) { var n = cityOf(e); if (n && cities.indexOf(n) === -1) cities.push(n); });
      var first = stops[0].start, last = stops[stops.length - 1].end || stops[stops.length - 1].start;
      sub.textContent = cities.slice(0, 2).join(' · ') +
        (cities.length > 2 ? ' +' + (cities.length - 2) : '') +
        ' · ' + fmtDate(first, { day: 'numeric', month: 'short' }) +
        ' – ' + fmtDate(last, { day: 'numeric', month: 'short' });
    }

    var complete = stops.length && played.length >= stops.length;
    var today = new Date().toISOString().slice(0, 10);

    /* ---- Overview: the standings ---- */
    function drawStandings() {
      var tbl = $$('.tbl').filter(function (x) {
        return !x.classList.contains('s11') && !x.classList.contains('games-tbl');
      })[0];
      if (!tbl) return;
      var rows = conferenceTable(c.id, gender);
      if (!rows.length) {
        $$('.trow', tbl).forEach(function (r) { r.hidden = true; });
        return;
      }
      repeat(tbl, '.trow', rows, function (row, r) {
        paintStandingRow(row, r, complete);
        row.classList.toggle('trow-hi', complete && r.rank === 1);
      });
    }

    /* ---- Overview: leading scorers ---- */
    function drawScorers() {
      var host = $('.e10-scorers');
      if (!host) return;
      var ids = {};
      D.teams.filter(function (t) {
        return t.conference === c.id && (!t.gender || t.gender === gender);
      }).forEach(function (t) {
        (t.roster || []).forEach(function (m) { ids[m.id] = t; });
      });
      var list = Object.keys(ids).map(function (id) {
        var p = player(id);
        return p ? { p: p, team: ids[id] } : null;
      }).filter(Boolean);
      list.sort(function (a, b) { return (b.p.rankingPoints || 0) - (a.p.rankingPoints || 0); });
      list = list.slice(0, 4);
      if (!list.length) { host.hidden = true; return; }
      host.hidden = false;
      repeat(host, '.pcard-sh', list, function (card, rec) {
        var p = rec.p;
        text(card, '.pcard-first', p.first);
        text(card, '.pcard-last', p.last);
        text(card, '.pcard-ioc', p.ioc);
        flag(card, p.ioc);
        var k = $$('.pcard-k', card), v = $$('.pcard-v', card);
        [['PPG', '—'], ['GP', '—'],
         ['AGE', p.age != null ? p.age : '—'],
         ['RANK', p.rankingPoints ? Math.round(p.rankingPoints / 1000) + 'k' : '—']
        ].forEach(function (s, i) {
          if (k[i]) k[i].textContent = s[0];
          if (v[i]) v[i].textContent = s[1];
        });
        link(card, 'player.html?id=' + p.id);
      });
      tiltCards(host);
    }

    /* ---- Overview: highlights ---- */
    function drawHighlights() {
      var host = $('.cnf-kpis');
      if (!host) return;
      var games = [];
      stops.forEach(function (e) { games = games.concat(gamesFor(e.slug, gender)); });
      var scored = games.filter(function (g) { return g.home && g.home.score != null; });
      var pts = scored.reduce(function (a, g) { return a + g.home.score + g.away.score; }, 0);
      var table = conferenceTable(c.id, gender);
      var best = table.slice().sort(function (a, b) { return b.winRatio - a.winRatio; })[0];
      var v = $$('.kpi-v', host);
      if (v[0]) v[0].textContent = scored.length || '—';
      if (v[1]) v[1].textContent = best ? (best.winRatio * 100).toFixed(0) + '%' : '—';
      if (v[2]) v[2].textContent = table.length || '—';
      if (v[3]) v[3].textContent = scored.length ? (pts / scored.length).toFixed(1) : '—';
    }

    /* ---- Stops: the selector, the matrix, the games ---- */
    function drawStopNav() {
      repeat($('.stopnav') || document, '.stopnav-i', stops, function (node, e, i) {
        node.textContent = e.number;
        var has = !!standingsFor(e.slug);
        var live = e.start <= today && (e.end || e.start) >= today;
        node.classList.toggle('stopnav-done', has);
        node.classList.toggle('stopnav-live', live);
        node.classList.toggle('stopnav-on', i === sel);
        node.onclick = function () { sel = i; drawStopNav(); drawGames(); };
      });
      repeat($('.s02') || document, '.s02-stop, .s02-i', stops, function (node, e, i) {
        var has = !!standingsFor(e.slug);
        var live = e.start <= today && (e.end || e.start) >= today;
        node.classList.toggle('s02-done', has);
        node.classList.toggle('s02-live', live);
        node.classList.toggle('s02-on', i === sel);
        text(node, '.s02-city, .t-label', cityOf(e));
        text(node, '.t-caption', fmtDate(e.start, { day: 'numeric', month: 'short' }));
        node.onclick = function () { sel = i; drawStopNav(); drawGames(); };
        link(node, 'stop.html?id=' + e.slug);
      });
    }

    /* One row per federation, one column per stop — the wireframe's
       matrix, sized to however many stops this conference has. */
    function drawMatrix() {
      var host = $('.s11');
      if (!host) return;
      var rows = conferenceTable(c.id, gender);
      if (!rows.length) { host.hidden = true; return; }
      host.hidden = false;
      var head = '<div class="el-08-TableHeaderRow cut cut-s thead">' +
        '<div class="cell-federation cell c-fed"><span class="t-caption" style="color:inherit">Federation</span></div>' +
        stops.map(function (e) {
          return '<div class="cell-mstop cell c-mstop cell-num"><span class="t-caption" style="color:inherit">Stop ' +
                 e.number + '</span></div>';
        }).join('') +
        '<div class="cell-points cell c-pts cell-num"><span class="t-caption" style="color:inherit">Tour Points</span></div>' +
        '</div>';
      var body = rows.map(function (r) {
        var cells = stops.map(function (e) {
          var s = standingsFor(e.slug, gender);
          var mine = s && s.rows.filter(function (x) { return x.ioc === r.ioc; })[0];
          if (!mine || !mine.rank) {
            return '<div class="cell-mstop cell c-mstop cell-num"><span class="t-data-m">—</span></div>';
          }
          return '<div class="cell-mstop cell c-mstop cell-num">' +
                 '<span class="t-data-m' + (mine.rank === 1 ? ' s11-first' : '') + '">' +
                 ordinal(mine.rank) + '</span>' +
                 '<span class="t-caption s11-pts">' + tourPoints(mine.rank) + ' pts</span></div>';
        }).join('');
        return '<div class="el-04-TeamRow trow s11-row" data-href="team.html?ioc=' + r.ioc + '">' +
          '<div class="cell-federation cell c-fed">' +
            '<div class="el-13-FederationTag--m-both-plain ftag ftag-m cut cut-s ftag-plain">' +
            '<div class="flag flag-ring"></div><div class="ftag-txt">' +
            '<span class="ftag-code">' + r.ioc + '</span>' +
            '<span class="ftag-name">' + r.team + '</span></div></div></div>' +
          cells +
          '<div class="cell-points cell c-pts cell-num"><span class="t-data-m">' + r.tour + '</span></div>' +
          '</div>';
      }).join('');
      host.innerHTML = head + body;
      $$('.s11-row', host).forEach(function (row) {
        flag($('.flag', row), row.dataset.href.split('ioc=')[1]);
        link(row, row.dataset.href);
      });
    }

    function drawGames() {
      var e = played[sel] || stops[sel] || stops[0];
      var tbl = $('.games-tbl');
      if (!tbl || !e) return;
      var gl = gamesFor(e.slug, gender);
      var day = $('.games-day .t-caption', tbl);
      if (day) day.textContent = gl.length
        ? fmtDate(e.start, { weekday: 'long', day: 'numeric', month: 'long' })
        : 'No games in the feed for this stop yet';
      if (gl.length) {
        repeat(tbl, '.trow', gl, paintGame);
      } else {
        $$('.trow', tbl).forEach(function (r, i) {
          r.classList.add('is-placeholder');
          r.hidden = i > 2;
        });
      }
    }

    function draw() {
      drawStandings();
      drawScorers();
      drawHighlights();
      drawStopNav();
      drawMatrix();
      drawGames();
      paintPhotos(D.photos.filter(function (g) {
        return !g.stop || stops.some(function (e) { return e.slug === g.stop; });
      }).slice(0, 12));
      if (window.FIBA) window.FIBA.init(document);
    }

    genderSwitch(function (g) { gender = g; draw(); });
    tabPanes(document, '.cnf-tabs');
    draw();

    /* "See updated conference table" goes back to the standings, which
       is on the other tab. */
    var back = $$('.cnf-back .lnk')[0];
    if (back) back.onclick = function () {
      var t = $$('.cnf-tabs .tab').filter(function (x) { return x.dataset.tab === 'overview'; })[0];
      if (t) t.click();
      var tbl = $$('.tbl').filter(function (x) { return !x.classList.contains('s11'); })[0];
      if (tbl) tbl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  };

  PAGES['stop.html'] = function () {
    var first = stop(qs.get('id')) || playedStops()[0] || D.events[0];
    var c = conf(first.conference) || {};
    var stops = D.events.filter(function (e) { return e.conference === c.id; })
                        .sort(function (x, y) { return (x.number || 0) - (y.number || 0); });
    var sel = Math.max(0, stops.map(function (e) { return e.slug; }).indexOf(first.slug));
    var today = new Date().toISOString().slice(0, 10);

    function draw() {
      var e = stops[sel] || first;
      var men = standingsFor(e.slug, 'men'), women = standingsFor(e.slug, 'women');
      var pool = men || women;
      var gl = gamesFor(e.slug);

      $$('.f04-h1-m, .f04-h1-s, .t-h1, .f04-title').forEach(function (n) {
        n.textContent = 'Stop ' + e.number + ' · ' + cityOf(e);
      });
      crumbs([{ label: 'Home', href: 'index.html' },
              { label: 'Conferences', href: 'conferences.html' },
              { label: confName(c), href: 'conference.html?id=' + c.id },
              { label: 'Stop ' + e.number }]);
      var sub = $('.f04-idl .t-body-s, .f04-sub');
      if (sub) sub.textContent = [e.venue, cityOf(e), e.country, fmtDate(e.start)]
        .filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' · ');

      /* the selector */
      repeat($('.stopnav') || document, '.stopnav-i', stops, function (node, x, i) {
        node.textContent = x.number;
        node.classList.toggle('stopnav-done', !!standingsFor(x.slug));
        node.classList.toggle('stopnav-live', x.start <= today && (x.end || x.start) >= today);
        node.classList.toggle('stopnav-on', i === sel);
        node.onclick = function () { sel = i; draw(); };
      });
      repeat($('.s02') || document, '.s02-stop, .s02-i', stops, function (node, x, i) {
        node.classList.toggle('s02-done', !!standingsFor(x.slug));
        node.classList.toggle('s02-live', x.start <= today && (x.end || x.start) >= today);
        node.classList.toggle('s02-on', i === sel);
        text(node, '.s02-city, .t-label', cityOf(x));
        text(node, '.t-caption', fmtDate(x.start, { day: 'numeric', month: 'short' }));
        node.onclick = function () { sel = i; draw(); };
      });

      /* S-08 Podium — the stop result, which is the first thing on the
         page per Alex's slide 12 */
      var podium = $('.s08');
      if (podium) {
        var placed = (pool ? pool.rows : []).filter(function (r) { return r.rank; })
          .slice().sort(function (a, b) { return a.rank - b.rank; }).slice(0, 3);
        podium.hidden = !placed.length;
        /* The three plinths are in visual order — silver, gold, bronze —
           so each one is painted by its own place rather than repeated
           from the first, which put the same federation on all three. */
        placed.forEach(function (r) {
          var step = $('.s08-' + r.rank, podium);
          if (!step) return;
          flag(step, r.ioc);
          text(step, '.team-name', r.team);
          text(step, '.s08-pos', r.rank);
        });
      }

      /* S-05 Pools */
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

      /* S-06 Bracket — final on top, third place under it when it
         exists. The snapshot carries pool games and finals only, so a
         round with no games hides rather than showing specimen scores. */
      var finals = gl.filter(function (g) { return g.round === 'F'; });
      var rounds = $$('.s06-round');
      rounds.forEach(function (rd, i) {
        var label = ($('.s06-label', rd) || {}).textContent || '';
        var game = /final/i.test(label) && !/third/i.test(label) ? finals[0]
                 : /third/i.test(label) ? finals[1] : null;
        if (!game) { rd.hidden = true; return; }
        rd.hidden = false;
        var sides = $$('.s06-side', rd);
        [game.home, game.away].forEach(function (t, k) {
          if (!sides[k]) return;
          fed(sides[k], t.ioc, t.name);
          text(sides[k], '.s06-sc', t.score != null ? t.score : '–');
          sides[k].classList.toggle('s06-lose',
            game.home.score != null && t.score < Math.max(game.home.score, game.away.score));
        });
      });
      var s06 = $('.s06');
      if (s06) {
        var note = $('.t-body-s', s06);
        if (note) note.textContent = pool
          ? 'Two pools of three · top two from each pool cross into the semi-finals'
          : '';
        s06.hidden = !finals.length;
      }

      /* S-04 GameList */
      var gtbl = $('.games-tbl');
      if (gtbl) {
        var day = $('.games-day .t-caption', gtbl);
        if (day) day.textContent = gl.length
          ? fmtDate(e.start, { weekday: 'long', day: 'numeric', month: 'long' })
          : 'No games in the feed for this stop yet';
        if (gl.length) {
          repeat(gtbl, '.trow', gl, paintGame);
        } else {
          $$('.trow', gtbl).forEach(function (r, i) {
            r.classList.add('is-placeholder');
            r.hidden = i > 2;
          });
        }
      }

      paintPhotos(D.photos.filter(function (g) { return !g.stop || g.stop === e.slug; }).slice(0, 12));

      var back = $('.cnf-back a');
      if (back) back.setAttribute('href', 'conference.html?id=' + c.id);

      if (window.FIBA) window.FIBA.init(document);
    }

    draw();
  };

  /* Competition Standings — every registered federation, ranked on how
     it has played, sortable on any column. This is the "how is my team
     doing" table; the Qualification view next door answers "who is
     going", and until now both tabs rendered the same rows. */
  PAGES['standings.html'] = function () {
    var tbl = $('.tbl');
    var gender = 'men', query = '';
    var state = { key: 'tour', dir: -1 };
    var COLS = {
      'cell-position':   { key: 'rank' },
      'cell-federation': { key: 'team', text: 1 },
      'cell-conference': { key: 'confname', text: 1 },
      'cell-winratio':   { key: 'winRatio' },
      'cell-ptsavg':     { key: 'avg' },
      'cell-ep':         { key: 'stops' },
      'cell-points':     { key: 'tour' },
      'cell-status':     { key: 'statusRank' }
    };

    function draw() {
      var list = federationTable(gender).filter(function (t) {
        return !query || (t.team + ' ' + t.ioc).toLowerCase().indexOf(query) > -1;
      });
      var e = tbl.parentElement.querySelector(':scope > .site-empty');
      if (!list.length) {
        $$('.trow', tbl).forEach(function (r) { r.hidden = true; });
        emptyState(tbl.parentElement, 'No federation matches',
                   'Try a different name or IOC code.');
        return;
      }
      if (e) e.remove();
      list.sort(cmp(state.key, state.dir));
      repeat(tbl, '.trow', list, function (row, t) {
        row.hidden = false;
        fed(row, t.ioc, t.team);
        text(row, '.cell-position .t-data-m', t.rank);
        text(row, '.cell-conference .t-body-s', t.confname);
        text(row, '.cell-winratio .t-data-m', t.winRatio.toFixed(2));
        text(row, '.cell-ptsavg .t-data-m', t.avg.toFixed(1));
        text(row, '.cell-ep .t-data-m', t.stops);
        text(row, '.cell-points .t-data-m', t.tour);
        marker(row, t.status);
        link(row, 'team.html?ioc=' + t.ioc);
      });
    }

    gender = genderSwitch(function (g) { gender = g; draw(); });
    searchField(document, 'Search a federation or IOC code', function (q) { query = q; draw(); });
    sortable(tbl, COLS, state, draw);
    draw();
  };

  /* E-09 FederationDirectory. The A–Z jump bar came off: with 67
     federations the letter was rarely the thing anyone knew, and the
     region is — so the filter is a row of el-14 Chip under the search
     field, the same five regions the landing page and the wireframe
     use. The count sits under the chips because it describes what the
     filter left, not what the page is called. */
  PAGES['teams.html'] = function () {
    /* One entry per federation, but the de-duplication has to happen
       after the gender filter: a federation fields a team in both, and
       collapsing first meant whichever gender the feed listed first
       decided whether the federation appeared at all — 33 of 67. */
    var all = D.teams.filter(function (t) { return !!t.ioc; });
    all.forEach(function (t) { t.region = regionOf(conf(t.conference)); });
    all.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });

    var grid = $('.e09-grid') || $('.e09');
    var region = 'All', query = '', gender = 'men';

    function matches(t) {
      return (region === 'All' || t.region === region) &&
             (!query || (t.name + ' ' + t.ioc).toLowerCase().indexOf(query) > -1);
    }
    function pool() {
      var seen = {}, out = [];
      all.forEach(function (t) {
        if (t.gender && gender && t.gender !== gender) return;
        if (!matches(t) || seen[t.ioc]) return;
        seen[t.ioc] = 1;
        out.push(t);
      });
      return out;
    }

    function draw() {
      var list = pool();
      var e = grid.parentElement.querySelector(':scope > .site-empty');
      if (e) e.remove();
      var count = $('.e09-count');
      if (count) {
        count.textContent = list.length + (list.length === 1 ? ' federation' : ' federations') +
          ' · ' + all.filter(matches).length + ' teams';
      }
      if (!list.length) {
        grid.hidden = true;
        emptyState(grid.parentElement, 'No federation matches',
                   'Try another region, or clear the search.');
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

    region = chipFilter(function (r) { region = r; draw(); }) || 'All';
    gender = genderSwitch(function (g) { gender = g; draw(); });
    searchField(document, 'Search for a federation or IOC code', function (q) { query = q; draw(); });
    draw();
  };

  PAGES['team.html'] = function () {
    var ioc = qs.get('ioc');
    var sites = D.teams.filter(function (x) { return x.ioc === (ioc || (D.teams[0] || {}).ioc); });
    var t = sites[0] || D.teams[0];
    if (!sites.length) sites = [t];

    crumbs([{ label: 'Home', href: 'index.html' },
            { label: 'Teams', href: 'teams.html' },
            { label: t.name }]);

    var head = $('.e04-top') || $('.e04');
    if (head) { flag(head, t.ioc); text(head, '.ftag-code', t.ioc); text(head, '.ftag-name', t.name); }
    $$('.e04-name, .t-h1, .f04-h1-m, .f04-h1-s').forEach(function (n) { n.textContent = t.name; });

    /* One selection drives the whole page: which of this federation's
       team sites is being read. */
    function draw(sel) {
      var site = sites.filter(function (x) {
        var cat = /(^|-)u21(-|$)/.test(x.conference || '') ? 'U21' : 'U23';
        return cat === sel.cat && (x.gender || 'men') === sel.gender;
      })[0] || t;
      var c = conf(site.conference) || {};

      var sub = $('.e04-sub');
      if (sub) {
        var parts = $$('.t-body-m', sub);
        if (parts[0]) parts[0].textContent = sel.cat + ' ' + (sel.gender === 'men' ? 'Men' : 'Women');
        if (parts[1]) parts[1].textContent = confName(c);
      }

      /* season totals for this team site */
      var table = conferenceTable(c.id, site.gender || sel.gender);
      var me = table.filter(function (r) { return r.ioc === site.ioc; })[0];
      var season = federationTable(site.gender || sel.gender)
                     .filter(function (r) { return r.ioc === site.ioc; })[0];
      var ev = $$('.e04-v');
      if (me) {
        if (ev[0]) ev[0].textContent = me.tour;
        if (ev[1]) ev[1].textContent = me.winRatio.toFixed(2);
        if (ev[2]) ev[2].textContent = me.won + '–' + (me.played - me.won);
        if (ev[3]) ev[3].textContent = me.stops;
        if (ev[4]) ev[4].textContent = me.rank;
        if (ev[5]) ev[5].textContent = season ? season.rank : '—';
      }
      var badge = $('.e04-sub .badge');
      if (badge && season) {
        var lbl = { q: 'Qualified', s: 'Shortlisted', n: 'Not qualified' }[season.status];
        ['q', 's', 'n'].forEach(function (x) { badge.classList.remove('badge-' + x); });
        badge.classList.add('badge-' + season.status);
        text(badge, '.lbl', lbl);
      }
      /* The stream is a conference-level thing (first review): only
         offer it while this conference is actually playing. */
      var wl = $('.e04-act .wl');
      if (wl) {
        var today = new Date().toISOString().slice(0, 10);
        var live = D.events.some(function (e) {
          return e.conference === c.id && e.start &&
                 e.start <= today && (e.end || e.start) >= today;
        });
        wl.hidden = !live;
      }

      /* S-10 Season journey — this conference, stop by stop */
      var stops = D.events.filter(function (e) { return e.conference === c.id; })
                          .sort(function (x, y) { return (x.number || 0) - (y.number || 0); });
      var host = $('.s10');
      if (host) {
        repeat(host, '.s10-row', stops, function (row, e) {
          var s = standingsFor(e.slug, site.gender || sel.gender);
          var mine = s && s.rows.filter(function (r) { return r.ioc === site.ioc; })[0];
          var played = !!(mine && mine.rank);
          text(row, '.cell-jstop .t-data-m', e.number);
          text(row, '.cell-jhost .t-body-s', cityOf(e) + (e.country ? ', ' + e.country : ''));
          text(row, '.cell-jdate .t-body-s', fmtDate(e.start, { day: 'numeric', month: 'short' }));
          $('.cell-jplace .t-data-m', row).textContent = played ? ordinal(mine.rank) : '—';
          $('.cell-jpts .t-data-m', row).textContent = played ? tourPoints(mine.rank) : '—';
          $('.cell-jstatus .t-body-s', row).textContent = played ? 'Played' : 'Upcoming';
          row.classList.toggle('is-placeholder', !played);
          link(row, 'stop.html?id=' + e.slug);
        });
      }
      var jlink = $$('.lnk').filter(function (l) { return /view conference/i.test(l.textContent); })[0];
      if (jlink) link(jlink, 'conference.html?id=' + c.id);

      /* roster: a 3x3 squad is four players at one stop, so show the
         most recent one this team site fielded */
      var recent = sites.filter(function (x) { return x.conference === site.conference && x.gender === site.gender; })
                        .sort(function (x, y) {
                          return ((stop(y.stop) || {}).start || '').localeCompare((stop(x.stop) || {}).start || '');
                        })[0] || site;
      var roster = (recent.roster || []).map(function (m) { return player(m.id); }).filter(Boolean);
      if (roster.length) {
        repeat(document, '.pcard-sh', roster, function (card, p) {
          text(card, '.pcard-first', p.first);
          text(card, '.pcard-last', p.last);
          text(card, '.pcard-ioc', p.ioc);
          flag(card, p.ioc);
          /* The snapshot carries no per-game player statistics, so the
             card states age and 3x3 ranking points — what we do hold —
             rather than printing ranking points under a PPG label. */
          var k = $$('.pcard-k', card), v = $$('.pcard-v', card);
          var stats = [
            ['AGE', p.age != null ? p.age : '—'],
            ['RANK', p.rankingPoints ? Math.round(p.rankingPoints / 1000) + 'k' : '—'],
            ['PPG', '—'],
            ['GP', '—']
          ];
          stats.forEach(function (s, i) {
            if (k[i]) k[i].textContent = s[0];
            if (v[i]) v[i].textContent = s[1];
          });
          link(card, 'player.html?id=' + p.id);
        });
      }

      /* results for the most recent stop of this team site */
      var mineStops = stops.filter(function (e) { return gamesFor(e.slug, site.gender).length; });
      var last = mineStops[mineStops.length - 1];
      var gl = last ? gamesFor(last.slug, site.gender) : [];
      var gtbl = $('.games-tbl') ||
                 $$('.tbl').filter(function (x) { return !x.classList.contains('s10'); })[0];
      if (gtbl) {
        if (gl.length) repeat(gtbl, '.trow', gl, paintGame);
        else $$('.trow', gtbl).forEach(function (r) { r.classList.add('is-placeholder'); });
      }

      paintPhotos(D.photos.filter(function (g) {
        return !g.stop || stops.some(function (e) { return e.slug === g.stop; });
      }).slice(0, 12));

      if (window.FIBA) window.FIBA.init(document);
    }

    var start = categorySwitch($('.f04-ctl') || document, sites, draw) ||
                { cat: /(^|-)u21(-|$)/.test(t.conference || '') ? 'U21' : 'U23',
                  gender: t.gender || 'men' };
    draw(start);
  };

  PAGES['player.html'] = function () {
    var p = player(qs.get('id')) || D.players[0];
    text(document, '.e05-first', p.first);
    text(document, '.e05-last', p.last);
    $$('.f04-h1-m, .f04-h1-s, .f04-title').forEach(function (n) { n.textContent = p.name; });
    crumbs([{ label: 'Home', href: 'index.html' },
            { label: 'Teams', href: 'teams.html' },
            { label: p.country || '', href: 'team.html?ioc=' + p.ioc },
            { label: p.name }]);
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

  /* The Calendar page is the landing page's Live now module with the
     day selection released: nothing is preselected, so every stop that
     has something under it is listed as an S-01 accordion. Picking a day
     narrows the list to that day; picking it again clears it. The month
     headings and dividers are gone — the strip already carries the
     calendar. */
  PAGES['calendar.html'] = function () {
    var SLOTS = 8;
    var region = 'All', days = [], sel = -1, win = 0, gender = {};

    function iso(d) { return d.toISOString().slice(0, 10); }
    function inRegion(e) {
      return region === 'All' || regionOf(conf(e.conference)) === region;
    }
    function hasContent(e) {
      var s = standingsFor(e.slug);
      if (s && s.rows && s.rows.some(function (r) { return (r.played || 0) > 0; })) return true;
      return gamesFor(e.slug).some(function (g) { return g.home && g.home.score != null; });
    }
    function pool() {
      return D.events.filter(function (e) { return e.start && inRegion(e) && hasContent(e); })
                     .sort(function (a, b) { return a.start.localeCompare(b.start); });
    }
    function dayList() {
      var seen = {};
      pool().forEach(function (e) { seen[e.start] = 1; });
      return Object.keys(seen).sort();
    }
    function clampWin() {
      win = days.length <= SLOTS ? 0 : Math.max(0, Math.min(win, days.length - SLOTS));
    }

    var strip = $('.s03, .s03wrap');
    var accHost = ($('.acc') || {}).parentElement;

    function drawStrip() {
      if (!strip) return;
      var view = days.slice(win, win + SLOTS);
      repeat(strip, '.s03-d', view, function (cell, dISO) {
        var d = new Date(dISO + 'T00:00:00');
        cell.classList.toggle('s03-on', sel >= 0 && dISO === days[sel]);
        cell.classList.remove('s03-off');
        cell.classList.toggle('s03-live', dISO === iso(new Date()));
        text(cell, '.s03-num', d.getDate());
        text(cell, '.s03-dow', d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase());
        text(cell, '.s03-mon', d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase());
        cell.onclick = function () {
          var i = days.indexOf(dISO);
          sel = (sel === i) ? -1 : i;      /* click again to see the whole season */
          drawStrip(); drawList();
        };
      });
      $$('.s03nav', strip).forEach(function (b, i) {
        var back = i === 0;
        b.classList.toggle('s03nav-off', back ? win === 0 : win >= days.length - SLOTS);
        if (b._wired) return;
        b._wired = 1;
        b.addEventListener('click', function () {
          var was = win;
          win += (back ? -1 : 1) * SLOTS;
          clampWin();
          if (win === was) return;
          drawStrip();
          var hostEl = $('.s03', strip) || strip;
          hostEl.classList.remove('s03-in-l', 's03-in-r');
          void hostEl.offsetWidth;
          hostEl.classList.add(back ? 's03-in-l' : 's03-in-r');
        });
      });
    }

    function drawList() {
      if (!accHost) return;
      var old = accHost.querySelector(':scope > .site-empty');
      if (old) old.remove();
      var evs = pool().filter(function (e) {
        return sel < 0 || (e.start <= days[sel] && (e.end || e.start) >= days[sel]);
      });
      if (!evs.length) {
        $$('.acc', accHost).forEach(function (a) { a.hidden = true; });
        emptyState(accHost, 'Nothing in this region yet',
                   'Pick another region, or clear the day.');
        return;
      }
      $$('.acc', accHost).forEach(function (a) { a.hidden = false; });
      var today = iso(new Date());
      repeat(accHost, '.acc', evs, function (node, e) {
        var c = conf(e.conference) || {};
        var g = gender[e.slug] || 'men';
        var all = D.events.filter(function (x) { return x.conference === c.id; });
        var played = all.filter(function (x) {
          return x.start && x.start <= e.start && standingsFor(x.slug);
        }).length;
        var live = e.start <= today && (e.end || e.start) >= today;

        text(node, '.t-h3', confName(c));
        var meta = $$('.acc-head .t-body-s', node)[0];
        if (meta) meta.textContent = cityOf(e) + ' · Stop ' + e.number +
          ' of ' + (c.stopCount || all.length) + ' · ' +
          fmtDate(e.start, { day: 'numeric', month: 'short' });
        var badge = $('.acc-head .badge', node);
        if (badge) badge.hidden = !live;
        text(node, '.acc-head .t-caption', 'Stop ' + e.number + ' of ' + (c.stopCount || all.length));
        $$('.dot', node).forEach(function (d, i) {
          d.classList.toggle('dot-done', i < played);
          d.classList.toggle('dot-live', live && i === played - 1);
        });

        var sw = $('.el02', node);
        if (sw) $$('.el02-seg', sw).forEach(function (seg) {
          var val = /women/i.test(seg.textContent) ? 'women' : 'men';
          seg.classList.toggle('el02-on', val === g);
          seg.onclick = function (ev) { ev.stopPropagation(); gender[e.slug] = val; drawList(); };
        });

        var rows = conferenceTable(c.id, g, e.start);
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
      if (window.FIBA) window.FIBA.init(accHost);
    }

    days = dayList();
    clampWin();
    region = chipFilter(function (r) {
      region = r; days = dayList(); sel = -1; win = 0; clampWin();
      drawStrip(); drawList();
    }) || 'All';
    drawStrip();
    drawList();
  };

  PAGES['stats.html'] = function () {
    var gender = 'men', confId = 'All';

    /* Which federation a player belongs to — the squads tell us. */
    var teamOf = {};
    D.teams.forEach(function (t) {
      (t.roster || []).forEach(function (m) { if (m.id) teamOf[m.id] = t; });
    });

    /* the conference filter, built from the conferences themselves */
    (function () {
      var host = $('.st-conf');
      if (!host) return;
      var proto = $('.chip', host).cloneNode(true);
      host.innerHTML = '';
      var opts = [{ id: 'All', label: 'All conferences' }].concat(
        D.conferences.map(function (c) { return { id: c.id, label: confName(c) }; }));
      opts.forEach(function (o, i) {
        var chip = proto.cloneNode(true);
        chip.classList.toggle('chip-on', i === 0);
        text(chip, '.lbl', o.label);
        chip.onclick = function () {
          confId = o.id;
          $$('.chip', host).forEach(function (x) { x.classList.remove('chip-on'); });
          chip.classList.add('chip-on');
          draw();
        };
        host.appendChild(chip);
      });
    })();

    function scope() {
      return federationTable(gender).filter(function (t) {
        return confId === 'All' || t.conference === confId;
      });
    }

    function drawTeams() {
      var list = scope();

      /* Top scores — the federation scoring most per game */
      var best = list.slice().sort(function (a, b) { return b.avg - a.avg; })[0];
      text(document, '.st-spot-name', best ? best.team : '—');
      text(document, '.st-spot-sub', best
        ? best.confname + ' · ' + (gender === 'men' ? 'Men' : 'Women')
        : 'No results in scope');

      /* Team stats spotlight — the same six-figure row as a team page */
      var v = $$('.e04-stats .e04-v'), k = $$('.e04-stats .t-caption');
      var stats = best ? [
        ['Score points', best.scored],
        ['Events', best.stops],
        ['Games', best.played],
        ['Avg points', best.avg.toFixed(1)],
        ['PPG', best.avg.toFixed(1)],
        ['Tour points', best.tour]
      ] : [];
      stats.forEach(function (s, i) {
        if (k[i]) k[i].textContent = s[0];
        if (v[i]) v[i].textContent = s[1];
      });

      /* Overview */
      var games = [];
      D.events.forEach(function (e) {
        if (confId !== 'All' && e.conference !== confId) return;
        games = games.concat(gamesFor(e.slug, gender));
      });
      var finalGames = games.filter(function (g) { return g.home && g.home.score != null; });
      var pts = finalGames.reduce(function (a, g) { return a + g.home.score + g.away.score; }, 0);
      var withGames = {};
      finalGames.forEach(function (g) { withGames[g.home.ioc] = withGames[g.away.ioc] = 1; });
      var activeConf = {};
      D.events.forEach(function (e) {
        if (standingsFor(e.slug) && (confId === 'All' || e.conference === confId)) activeConf[e.conference] = 1;
      });
      var kv = $$('.cnf-kpis .kpi-v'), kk = $$('.cnf-kpis .t-caption');
      [['Final games', finalGames.length],
       ['Teams in scope', list.length],
       ['Teams with games', Object.keys(withGames).length],
       ['Active conferences', Object.keys(activeConf).length]
      ].forEach(function (s, i) {
        if (kk[i]) kk[i].textContent = s[0];
        if (kv[i]) kv[i].textContent = s[1];
      });
      /* the fifth figure does not fit a four-tile row, so it rides with
         the section rather than being dropped */
      var sub = $('.st-avg');
      if (!sub) {
        var box = $('.cnf-kpis');
        if (box) {
          sub = document.createElement('div');
          sub.className = 'st-avg t-body-s';
          box.parentElement.appendChild(sub);
        }
      }
      if (sub) sub.textContent = 'Avg pts / game · ' +
        (finalGames.length ? (pts / finalGames.length).toFixed(1) : '—');

      function fillTable(sel, rows, paint) {
        var tbl = $(sel);
        if (!tbl) return;
        if (!rows.length) { $$('.trow', tbl).forEach(function (r) { r.hidden = true; }); return; }
        repeat(tbl, '.trow', rows, paint);
      }

      fillTable('.st-perf', list.slice(0, 12), function (row, t, i) {
        row.hidden = false;
        fed(row, t.ioc, t.team);
        var c = $$('.cell', row);
        text(c[0], '.t-data-m, .t-body-s', i + 1);
        text(c[2], '.t-body-s', t.confname);
        text(c[3], '.t-data-m', t.played);
        text(c[4], '.t-data-m', t.won + '–' + (t.played - t.won));
        text(c[5], '.t-data-m', (t.winRatio * 100).toFixed(0) + '%');
        text(c[6], '.t-data-m', t.tour);
        link(row, 'team.html?ioc=' + t.ioc);
      });

      var byScore = list.slice().sort(function (a, b) { return b.scored - a.scored; });
      fillTable('.st-scoring', byScore.slice(0, 12), function (row, t, i) {
        row.hidden = false;
        fed(row, t.ioc, t.team);
        var c = $$('.cell', row);
        var mine = finalGames.filter(function (g) {
          return g.home.ioc === t.ioc || g.away.ioc === t.ioc;
        }).map(function (g) { return g.home.ioc === t.ioc ? g.home.score : g.away.score; });
        text(c[0], '.t-data-m, .t-body-s', i + 1);
        text(c[2], '.t-body-s', t.confname);
        text(c[3], '.t-data-m', t.scored);
        text(c[4], '.t-data-m', t.avg.toFixed(1));
        text(c[5], '.t-data-m', mine.length ? Math.max.apply(null, mine) : '—');
        link(row, 'team.html?ioc=' + t.ioc);
      });
    }

    function drawPlayers() {
      var host = $('[data-pane="players"] .tbl') ||
                 $$('[data-pane="players"] > div').filter(function (x) { return $('.trow', x); })[0];
      if (!host) return;
      var list = D.players.filter(function (p) {
        var t = teamOf[p.id];
        if (!t) return false;
        if (gender && t.gender && t.gender !== gender) return false;
        return confId === 'All' || t.conference === confId;
      }).slice().sort(function (a, b) {
        return (b.rankingPoints || 0) - (a.rankingPoints || 0);
      }).slice(0, 30);

      var old = host.parentElement.querySelector(':scope > .site-empty');
      if (!list.length) {
        $$('.trow', host).forEach(function (r) { r.hidden = true; });
        emptyState(host.parentElement, 'Nothing to rank yet',
                   'No player is in scope for this filter.');
        return;
      }
      if (old) old.remove();
      repeat(host, '.trow', list, function (row, p, i) {
        row.hidden = false;
        var t = teamOf[p.id] || {};
        text(row, '.r05-rank .t-data-m', i + 1);
        text(row, '.r05-rank', i + 1);
        var name = $('.r05-pl .team-name', row) || $('.r05-pl', row);
        if (name) name.textContent = p.name;
        var init = $('.r05-pl .av-init', row);
        if (init) init.textContent = ((p.first || ' ')[0] + (p.last || ' ')[0]).toUpperCase();
        flag($('.r05-pl .flag', row), p.ioc);
        /* Team, its own column: flag, IOC code, and the federation the
           player is fielded by. */
        var tc = $('.r05-team', row);
        if (tc) {
          flag($('.flag', tc), t.ioc || p.ioc);
          text(tc, '.ftag-code', t.ioc || p.ioc);
        }
        text(row, '.c-conf .t-body-s', confName(conf(t.conference)));
        /* Games and PPG stay empty: the snapshot has no box scores. The
           middle column is relabelled to the measure we do hold rather
           than printing ranking points under a Points heading. */
        var n = $$('.r05-num', row);
        if (n[0]) n[0].textContent = '—';
        if (n[1]) n[1].textContent = (p.rankingPoints || 0).toLocaleString();
        if (n[2]) n[2].textContent = '—';
        link(row, 'player.html?id=' + p.id);
      });
    }

    function draw() { drawTeams(); drawPlayers(); }

    gender = genderSwitch(function (g) { gender = g; draw(); });
    tabPanes(document, '.st-tabs');
    draw();
  };

  PAGES['qualification.html'] = function () {
    var tbl = $('.tbl');
    var gender = 'men', query = '';

    function routeOf(t) {
      var table = conferenceTable(t.conference, gender);
      var lead = table[0];
      if (lead && lead.ioc === t.ioc) {
        var all = D.events.filter(function (e) { return e.conference === t.conference; });
        var played = all.filter(function (e) { return standingsFor(e.slug); }).length;
        return (all.length && played >= all.length) ? 'Conference winner'
                                                    : 'Conference leader';
      }
      return 'Standings';
    }

    function draw() {
      /* The field is the top twenty; the search narrows what is shown of
         it and never changes who is in it, so the position column keeps
         the qualification place rather than the row number. */
      var field = federationTable(gender).slice(0, FIELD);
      field.forEach(function (t, i) { t.place = i + 1; });
      var list = field.filter(function (t) {
        return !query || (t.team + ' ' + t.ioc).toLowerCase().indexOf(query) > -1;
      });
      var old = tbl.parentElement.querySelector(':scope > .site-empty');
      if (!list.length) {
        $$('.trow', tbl).forEach(function (r) { r.hidden = true; });
        emptyState(tbl.parentElement, 'No federation matches',
                   'That federation is not in the field of twenty.');
        return;
      }
      if (old) old.remove();
      repeat(tbl, '.trow', list, function (row, t, i) {
        row.hidden = false;
        fed(row, t.ioc, t.team);
        text(row, '.cell-position .t-data-m', t.place);
        text(row, '.cell-conference .t-body-s', t.confname);
        text(row, '.cell-route .t-body-s', routeOf(t));
        text(row, '.cell-winratio .t-data-m', t.winRatio.toFixed(2));
        text(row, '.cell-points .t-data-m', t.tour);
        marker(row, t.status);
        link(row, 'team.html?ioc=' + t.ioc);
      });
      var note = $('.ban-t');
      if (note) note.textContent = 'Twenty places — the host federation and nineteen through the league';
      var body = $('.ban-d');
      if (body) body.textContent = 'Routes are provisional until a conference closes. ' +
        'Q qualified, S shortlisted, N not qualified.';
    }

    gender = genderSwitch(function (g) { gender = g; draw(); });
    searchField(document, 'Search for a federation or IOC code', function (q) { query = q; draw(); });
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
      if (mm) {
        mm.classList.add('site-mm');
        /* F-05 marks the current page the way F-03 does — white label
           with a white rule under it. The specimen had Standings marked
           with the gold accent, and being a partial it did that on
           every page in the site. */
        var here = (document.body.dataset.page || 'index.html').split('?')[0];
        $$('a.nav-a', mm).forEach(function (a) {
          if ((a.getAttribute('href') || '').split('?')[0] !== here) return;
          $$('.mm-l', a).forEach(function (l) { l.classList.add('mm-l-on'); });
        });
        host.appendChild(mm);
      }

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
