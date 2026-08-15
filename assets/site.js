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
  function standingsFor(slug, gender) {
    return D.standings.filter(function (s) {
      return s.stop === slug && (!gender || s.gender === gender);
    })[0];
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

  /* ---------- page renderers -------------------------------- */
  var PAGES = {};

  PAGES['index.html'] = function () {
    /* Live now — one accordion per conference that has played */
    var byConf = {};
    playedStops().forEach(function (e) { (byConf[e.conference] = byConf[e.conference] || []).push(e); });
    var confs = Object.keys(byConf).slice(0, 6).map(function (id) {
      var c = conf(id), e = byConf[id][0];
      return { c: c, e: e, s: standingsFor(e.slug, 'men') };
    });
    $$('.acc').forEach(function (a) { a.dataset.keep = '1'; });
    repeat(document, '.acc', confs, function (node, rec) {
      text(node, '.t-h3', rec.c ? rec.c.name : '');
      var meta = $$('.acc-head .t-body-s', node)[0];
      if (meta) meta.textContent = rec.e.city + ' · Stop ' + rec.e.number + ' of ' + (conf(rec.e.conference) || {}).stopCount;
      if (rec.s) {
        repeat(node, '.trow', rec.s.rows.slice(0, 4), function (row, r) {
          fed(row, r.ioc, r.team);
          var cells = $$('.cell', row);
          if (cells[0]) cells[0].textContent = r.rank;
          var nums = $$('.cell-num, .t-data-m', row);
          if (nums.length >= 2) {
            nums[nums.length - 2].textContent = r.won + '–' + (r.played - r.won);
            nums[nums.length - 1].textContent = r.points;
          }
          link(row, 'team.html?ioc=' + r.ioc);
        });
      }
      /* The header only expands and collapses — the link out is the
         "View conference" action inside the panel. */
      var view = $$('.lnk, .btn', node).filter(function (l) {
        return /view conference|conference/i.test(l.textContent);
      })[0];
      if (view) link(view, 'conference.html?id=' + rec.e.conference);
    });

    /* Qualification board */
    var fedTable = federationTable();
    repeat(document, '.r01-row', fedTable.slice(0, 12), function (row, t) {
      text(row, '.r01-pos .t-data-m', t.rank);
      fed(row, t.ioc, t.team);
      text(row, '.r01-conf', (conf(t.conference) || {}).name || '');
      link(row, 'team.html?ioc=' + t.ioc);
    });

    /* News rail */
    repeat(document, '.c02-hcard, .c02-card', D.news, function (card, n) {
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

    /* Season status */
    var total = D.events.length, done = playedStops().length;
    $$('.s09-kv').forEach(function (kv, i) {
      if (i === 0) kv.textContent = total;
      if (i === 1) kv.textContent = done;
      if (i === 2) kv.textContent = total - done;
    });
  };

  PAGES['conferences.html'] = function () {
    var regions = {};
    D.conferences.forEach(function (c) { (regions[c.region] = regions[c.region] || []).push(c); });
    var list = Object.keys(regions).map(function (r) { return { region: r, items: regions[r] }; });
    repeat(document, '.e03-card', list, function (card, g) {
      text(card, '.e03-region', g.region);
      repeat(card, '.e03-conf', g.items, function (row, c) {
        text(row, '.e03-name', c.name);
        var n = $$('.t-caption, .t-body-s', row).pop();
        if (n) n.textContent = c.stopCount + ' stops';
        link(row, 'conference.html?id=' + c.id);
      });
    });
  };

  PAGES['conference.html'] = function () {
    var c = conf(qs.get('id')) || D.conferences[0];
    var stops = D.events.filter(function (e) { return e.conference === c.id; });
    var played = stops.filter(function (e) { return e.teamsRegistered; });
    var s = played.length ? standingsFor(played[0].slug, 'men') : null;

    $$('.t-h1, .e02-name, .f04-title').forEach(function (n) { n.textContent = c.name; });
    var crumbs = $$('.crumb');
    if (crumbs.length) crumbs[crumbs.length - 1].textContent = c.name;

    repeat(document, '.s02-stop, .s02-i', stops, function (node, e) {
      text(node, '.s02-city, .t-label', e.city);
      text(node, '.t-caption', fmtDate(e.start, { day: 'numeric', month: 'short' }));
      link(node, 'stop.html?id=' + e.slug);
    });

    /* The conference page carries two tables: standings, then games.
       Fill them separately rather than treating every .trow the same. */
    var tables = $$('.tbl');
    var standTbl = tables[0], gameTbl = tables[1];
    if (s && standTbl) {
      repeat(standTbl, '.trow', s.rows, function (row, r) {
        fed(row, r.ioc, r.team);
        var nums = $$('.t-data-m', row);
        if (nums[0]) nums[0].textContent = r.rank;
        if (nums.length > 2) {
          nums[nums.length - 3].textContent = (r.winRatio * 100).toFixed(0) + '%';
          nums[nums.length - 2].textContent = r.points;
          nums[nums.length - 1].textContent = r.avg;
        }
        link(row, 'team.html?ioc=' + r.ioc);
      });
    }
    var gl = played.length ? gamesFor(played[0].slug) : [];
    if (gameTbl && gl.length) repeat(gameTbl, '.trow', gl, paintGame);
    else if (gameTbl) $$('.trow', gameTbl).forEach(function (r) { r.classList.add('is-placeholder'); });
  };

  PAGES['stop.html'] = function () {
    var e = stop(qs.get('id')) || playedStops()[0];
    var men = standingsFor(e.slug, 'men');
    var women = standingsFor(e.slug, 'women');
    $$('.t-h1, .f04-title').forEach(function (n) { n.textContent = e.city + ' · Stop ' + e.number; });
    $$('.f04-crumbs .crumb').forEach(function (c, i, all) {
      if (i === all.length - 1) c.textContent = 'Stop ' + e.number;
    });
    var sub = $('.f04-sub, .el01-sub');
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
        text(row, '.cell-conference .t-body-s', (conf(t.conference) || {}).name || '');
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
    repeat(document, '.pcard', roster, function (card, p) {
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
        trigger(i.closest('a') || i, mm);
      });
      $$('.mm-close', mm).forEach(function (c) {
        c.addEventListener('click', function () { open(mm, false); });
      });

      /* the magnifier opens the search overlay */
      $$('.f03-search').forEach(function (sBtn) {
        var host2 = sBtn.closest('a') || sBtn;
        host2.style.cursor = 'pointer';
        host2.addEventListener('click', function (e) {
          e.preventDefault();
          open(ovl, true);
          var inp = ovl && ovl.querySelector('input');
          if (inp) setTimeout(function () { inp.focus(); }, 60);
        });
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
