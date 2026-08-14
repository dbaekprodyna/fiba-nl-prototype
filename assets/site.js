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

  /* A season-wide federation table, built from every stop we have. */
  function federationTable() {
    var by = {};
    D.standings.forEach(function (s) {
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
          link(row, 'conference.html?id=' + rec.e.conference);
        });
      }
      link($('.acc-head', node), 'conference.html?id=' + rec.e.conference);
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

    if (s) {
      repeat(document, '.trow', s.rows, function (row, r) {
        fed(row, r.ioc, r.team);
        var cells = $$('.cell', row);
        if (cells[0]) cells[0].textContent = r.rank;
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
    /* the game table has no real fixtures yet, so it is dimmed rather
       than left showing invented scores */
    $$('.trow').forEach(function (r) { r.classList.add('is-placeholder'); });
  };

  PAGES['standings.html'] = function () {
    var list = federationTable();
    repeat(document, '.trow', list, function (row, t) {
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
  };

  PAGES['teams.html'] = function () {
    var seen = {}, list = [];
    D.teams.forEach(function (t) {
      if (!t.ioc || seen[t.ioc]) return;
      seen[t.ioc] = 1;
      list.push(t);
    });
    list.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    repeat(document, '.e09-cell', list, function (cell, t) {
      flag(cell, t.ioc);
      text(cell, '.e09-n', t.name);
      text(cell, '.e09-c', t.ioc);
      link(cell, 'team.html?ioc=' + t.ioc);
    });
    var letters = {};
    list.forEach(function (t) { letters[(t.name || '?')[0].toUpperCase()] = 1; });
    $$('.alpha-i').forEach(function (a) {
      if (!letters[a.textContent.trim().toUpperCase()]) a.classList.add('alpha-dis');
    });
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
    var byMonth = {};
    D.events.forEach(function (e) {
      var m = (e.start || '').slice(0, 7);
      (byMonth[m] = byMonth[m] || []).push(e);
    });
    var months = Object.keys(byMonth).sort();
    repeat(document, '.s07-month, .s07-row', months, function (node, m) {
      text(node, '.t-label, .t-h3', fmtDate(m + '-01', { month: 'long', year: 'numeric' }));
      repeat(node, '.trow, .s07-i', byMonth[m], function (row, e) {
        text(row, '.t-label', e.city);
        text(row, '.t-caption', fmtDate(e.start, { day: 'numeric', month: 'short' }));
        link(row, 'stop.html?id=' + e.slug);
      });
    });
  };

  PAGES['stats.html'] = function () {
    var top = D.players.slice().sort(function (a, b) {
      return (b.rankingPoints || 0) - (a.rankingPoints || 0);
    }).slice(0, 30);
    repeat(document, '.trow', top, function (row, p, i) {
      text(row, '.r05-rank', i + 1);
      text(row, '.r05-pl', p.name);
      fed(row, p.ioc, p.country);
      var n = $$('.r05-num', row);
      if (n[0]) n[0].textContent = p.age != null ? p.age : '';
      if (n[1]) n[1].textContent = (p.rankingPoints || 0).toLocaleString();
      link(row, 'player.html?id=' + p.id);
    });
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

  /* ---------- boot ------------------------------------------ */
  var FILES = ['conferences', 'events', 'standings', 'teams', 'players', 'news', 'photos'];

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
    document.body.dataset.rendered = page;
    if (window.FIBA) window.FIBA.init(document);
  }).catch(function (e) {
    console.error('data load failed', e);
  });
})();
