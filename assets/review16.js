/* ============================================================
   FIBA 3x3 Nations League — review16.js
   Round sixteen. Four things.

     1  F-02 carries the season state, not only the hero.
     2  Live now goes to the stop that is playing, by name.
     3  The Men / Women switch on Conferences goes back to the
        block it actually governs.
     4  The off-season home: seven blocks, built from the same
        data the in-season home is built from.

   season.js has already pinned the day before site.js asked
   what it was, so everything here reads window.SEASON and never
   the calendar.
   ============================================================ */
(function () {
  'use strict';

  var D = document;
  var S = window.SEASON || { mode: 'live', live: true, off: false,
                             today: '2026-08-26', milestones: [], opener: null };
  var PAGE = (D.body && D.body.dataset.page) || 'index.html';

  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function el(t, c, h) {
    var n = D.createElement(t);
    if (c) n.className = c;
    if (h != null) n.innerHTML = h;
    return n;
  }
  function ready(fn) {
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function dt(iso) { return new Date(iso + 'T12:00:00'); }
  function dayLabel(iso) {
    if (!iso) return '';
    var d = dt(iso);
    return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  }
  function longLabel(iso) {
    var d = dt(iso);
    return DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  }
  function daysBetween(a, b) { return Math.round((dt(b) - dt(a)) / 86400000); }
  var ARROW =
    '<svg fill="currentColor" height="18" viewBox="0 -960 960 960" width="18" ' +
    'xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M686-450H160v-60h526' +
    'L438-758l42-42 320 320-320 320-42-42 248-248Z"></path></svg>';


  /* ==========================================================
     1  F-02 — the season state lives beside the hero switch
     ==========================================================
     Hero / No hero answer "how is the band drawn". Off season /
     Pre season answer "what day is the site being shown on".
     Two questions, two groups, one rule between them.

     A change of day cannot be applied in place: every live badge,
     dot, counter, table and stream on the page was computed from
     it while the page was building. So the links set the hash and
     reload — which is also the honest demonstration, because that
     is what a real deployment does at midnight. */
  function seasonLinks() {
    var fam = $('.f02-fam');
    if (!fam || $('.f02-season', fam)) return;

    fam.appendChild(el('span', 'f02-sep'));
    [['off', 'Off season'], ['pre', 'Pre season']].forEach(function (p) {
      var a = el('a', 'f02-famlink f02-season', p[1]);
      a.setAttribute('data-season', p[0]);
      a.setAttribute('href', '#season=' + p[0]);
      fam.appendChild(a);
    });

    $$('.f02-season', fam).forEach(function (a) {
      var on = a.getAttribute('data-season') === S.mode;
      a.classList.toggle('is-on', on);
      a.setAttribute('aria-current', on ? 'true' : 'false');
    });
    /* In an off-season state the hero links still say which band is
       drawn, but neither of them is the state the page is in. */
    if (!S.live) {
      $$('[data-hero]', fam).forEach(function (a) {
        a.classList.remove('is-on');
        a.setAttribute('aria-current', 'false');
      });
    }

    /* Capture, and stop the event there: hero-switch.js listens on
       the document and would otherwise also act on the click. */
    fam.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-season], a[data-hero]');
      if (!a) return;
      var wantSeason = a.getAttribute('data-season') || 'live';
      if (wantSeason === S.mode) return;
      e.preventDefault();
      e.stopPropagation();
      var hero = a.getAttribute('data-hero') ||
                 (/(?:^|[#&])hero=(a|b|nl|none)\b/.exec(location.hash) || [, 'nl'])[1];
      location.hash = 'hero=' + hero +
                      (wantSeason === 'live' ? '' : '&season=' + wantSeason);
      location.reload();
    }, true);

    window.addEventListener('hashchange', function () {
      var m = /(?:^|[#&])season=(live|off|pre)\b/.exec(location.hash || '');
      if ((m ? m[1] : 'live') !== S.mode) location.reload();
    });
  }


  /* ==========================================================
     2  Live now — the link goes to the stop
     ==========================================================
     "View conference" landed on the conference page, one level
     above the thing the block is about: the accordion is open on
     a stop that is being played right now, and the reader has to
     find it again when they get there.

     The label states the destination and the state it is in —
     "Follow this stop" while it is being played, "See the last
     stop" once it is not. */
  function liveStopLinks(events) {
    var host = ($('.acc') || {}).parentElement;
    if (!host) return;

    function stopFor(confId) {
      var mine = events.filter(function (e) { return e.conference === confId; });
      var live = mine.filter(function (e) {
        return e.start <= S.today && (e.end || e.start) >= S.today;
      })[0];
      if (live) return { e: live, live: true };
      var past = mine.filter(function (e) { return e.start && e.start <= S.today; })
                     .sort(function (a, b) { return String(a.start).localeCompare(b.start); });
      var last = past[past.length - 1];
      return last ? { e: last, live: false } : null;
    }

    function paint() {
      $$('.acc', host).forEach(function (acc) {
        var lnk = $('.acc-actions .lnk', acc);
        if (!lnk) return;
        var seed = $('[data-href^="conference.html"]', acc);
        var href = (seed && seed.getAttribute('data-href')) ||
                   lnk.getAttribute('data-href') || '';
        var m = /conference\.html\?id=([^&"]+)/.exec(href);
        var confId = m ? decodeURIComponent(m[1]) : acc.getAttribute('data-conf');
        if (!confId) return;
        acc.setAttribute('data-conf', confId);

        var hit = stopFor(confId);
        if (!hit) return;
        var want = 'stop.html?id=' + hit.e.slug;
        var label = hit.live ? 'Follow this stop' : 'See the last stop';
        var lbl = $('.lbl', lnk) || lnk;
        if (lnk.getAttribute('data-stop-href') === want && lbl.textContent === label) return;
        lnk.setAttribute('data-stop-href', want);
        lbl.textContent = label;
      });
    }

    /* The site's own link() closed over the old href, so the click is
       taken here first and stopped before it reaches that listener. */
    host.addEventListener('click', function (e) {
      var l = e.target.closest && e.target.closest('.acc-actions .lnk');
      if (!l) return;
      var href = l.getAttribute('data-stop-href');
      if (!href) return;
      e.preventDefault();
      e.stopPropagation();
      location.href = href;
    }, true);

    paint();
    var mo = new MutationObserver(function () { try { paint(); } catch (x) {} });
    mo.observe(host, { childList: true, subtree: true });
  }


  /* ==========================================================
     3  Conferences — the switch goes back to what it governs
     ==========================================================
     Round five moved every Men / Women switch to the right end of
     the F-04 sub-header, because Alex asked for one position on
     every page. On Conferences that reading is wrong: the page is
     a grid of eighteen conference cards, their stop dots and their
     federations, and not one of those is a men's or a women's
     fact. The only gendered thing on the page is the Schedule
     block's list of games, half a screen down.

     So the switch is not deleted — deleting it would take the
     Men / Women games with it, which is the third review's D1 —
     it goes back onto the Schedule header, where its scope is
     what it appears to govern. The rule that survives is the
     stronger one: a control sits at the level it changes. */
  function confGenderHome() {
    var gsw = $('.f04-ctl .sched-gender');
    if (!gsw) return true;
    var right = $('.sched .el01-right');
    if (!right) return false;
    if (gsw.parentNode !== right) right.insertBefore(gsw, right.firstChild);
    var ctl = $('.f04-ctl');
    if (ctl && !ctl.children.length) ctl.remove();
    return true;
  }


  /* ==========================================================
     4  The off-season home
     ========================================================== */
  var TOUR = [100, 80, 70, 60, 50, 40, 30, 20, 10];
  function tourPoints(r) { return r ? (TOUR[r - 1] != null ? TOUR[r - 1] : 10) : 0; }

  function section(cls, title, rightHTML) {
    var s = el('div', 'tpl-sub os-sec ' + cls);
    s.appendChild(el('div', 'el-01-SectionHeader--default el01-wrap',
      '<div class="el01"><div class="el01-left"><h2 class="t-h2">' + esc(title) +
      '</h2></div><div class="el01-right">' + (rightHTML || '') + '</div></div>'));
    return s;
  }
  function flagImg(ioc) {
    return '<span class="flag flag-ring"><img alt="' + esc(ioc) +
           '" src="assets/flags/' + esc(ioc) + '.svg" width="24" height="24" ' +
           'style="width:100%;height:100%"></span>';
  }
  function go(node, href) {
    node.addEventListener('click', function () { location.href = href; });
  }

  function buildOffSeason(data) {
    var content = $('.tpl-content');
    if (!content || content._os) return;
    content._os = 1;

    var events = data.events, confs = data.conferences, standings = data.standings,
        games = data.games, players = data.players, photos = data.photos;

    var confById = {}, evById = {};
    confs.forEach(function (c) { confById[c.id] = c; });
    events.forEach(function (e) { evById[e.id] = e; });
    /* The feed writes "FIBA 3x3 Youth Nations League 2026 - Africa East"
       into `label` and the age category as a prefix on `name`. The site
       states it as "Africa East U23", and so does this. */
    function confName(c) {
      if (!c) return '';
      var m = /^U(\d\d)\s+(.+)$/.exec(c.name || '');
      return m ? m[2] + ' U' + m[1] : (c.name || '') + ' U23';
    }

    /* ---- what the in-season home is made of comes off --------
       Every one of those blocks answers "what is happening now",
       and the answer is nothing. Hidden rather than removed, so
       switching back to the live state is one reload. */
    var hl = $('.tpl-content > .hl');
    $$(':scope > .tpl-split, :scope > .tpl-sub', content).forEach(function (b) {
      var h2 = ($('h2', b) || {}).textContent || '';
      if (b.classList.contains('home-split') ||
          /Overview|Live now|Photos|News|Qualification/i.test(h2)) b.hidden = true;
    });

    var made = [];

    /* ---- 4.1  the hero strip: the ladder and the milestones ---
       The band above is the 2026 season and stays as it is. This
       states where the next one is, at the resolution that is
       actually known — which in `off` is "not yet", and that is a
       sentence, not an empty box. */
    (function () {
      var s = el('div', 'tpl-sub os-sec os-hero');
      var head, sub;
      if (S.opener) {
        var n = daysBetween(S.today, S.opener);
        head = n <= 7
          ? 'The Nations League returns next week'
          : '<span class="os-lad-n">' + n + '</span> days until the season opens';
        sub = 'Season opener · ' + longLabel(S.opener) + ' · 2027 schedule published';
      } else {
        head = 'The next generation is already training';
        sub = '2027 season · dates to be announced';
      }
      s.appendChild(el('div', 'os-lad',
        '<div class="os-lad-k">' + head + '</div>' +
        '<div class="os-lad-s t-body-m">' + esc(sub) + '</div>'));

      var ms = el('div', 'os-ms');
      var nextDone = false;
      (S.milestones || []).forEach(function (m) {
        var known = m.known;
        var next = known && !nextDone && m.date >= S.today;
        if (next) nextDone = true;
        ms.appendChild(el('div', 'os-ms-i' + (next ? ' os-ms-next' : '') +
                                 (known ? '' : ' os-ms-tba'),
          '<div class="os-ms-d">' + (known ? esc(dayLabel(m.date)) : 'To be announced') +
          '</div><div class="os-ms-t">' + esc(m.title) + '</div>'));
      });
      s.appendChild(ms);
      made.push(s);
    })();

    /* ---- 4.2  Winners ----------------------------------------
       The feed titles every gallery, and a hundred and forty-eight
       of the four hundred and one are called "Prize Ceremony".
       That is the whole section: no tagging, no editing, no
       selection — a filter on a string the feed already writes. */
    (function () {
      var list = photos.filter(function (g) { return /prize ceremony/i.test(g.title || ''); })
        .map(function (g) { return { g: g, e: evById[g.eventId] }; })
        .filter(function (x) { return !!x.e; });
      list.sort(function (a, b) { return String(b.e.start).localeCompare(String(a.e.start)); });
      if (!list.length) return;

      var SHOW = 18;
      var s = section('os-winners', 'Winners',
        '<span class="os-scope">' + list.length + ' prize ceremonies · 2026 season</span>');
      var grid = el('div', 'os-wingrid');
      list.forEach(function (x, i) {
        var e = x.e, c = confById[e.conference];
        var card = el('div', 'os-win-c cut cut-s',
          '<img alt="" loading="lazy" src="' + esc(x.g.image) + '">' +
          '<div class="os-win-cap"><span class="os-win-city">' + esc(e.city) +
          '</span><span class="os-win-meta">' + esc(confName(c)) + ' · Stop ' +
          e.number + ' · ' + esc(dayLabel(e.end || e.start)) + '</span></div>');
        if (i >= SHOW) card.hidden = true;
        var img = $('img', card);
        img.addEventListener('error', function () {
          if (img.src.indexOf('poster-nl') > -1) return;
          img.src = e.cover || 'assets/poster-nl.svg';
        });
        go(card, 'stop.html?id=' + e.slug);
        grid.appendChild(card);
      });
      s.appendChild(grid);

      if (list.length > SHOW) {
        var more = el('div', 'ctl-02-Link--default lnk',
          '<span class="lbl">Show all ' + list.length + ' ceremonies</span>' + ARROW);
        more.addEventListener('click', function () {
          var hidden = $$('.os-win-c[hidden]', grid);
          if (hidden.length) {
            hidden.forEach(function (c) { c.hidden = false; });
            $('.lbl', more).textContent = 'Show fewer';
          } else {
            $$('.os-win-c', grid).forEach(function (c, i) { c.hidden = i >= SHOW; });
            $('.lbl', more).textContent = 'Show all ' + list.length + ' ceremonies';
          }
        });
        s.appendChild(more);
      }
      made.push(s);
    })();

    /* ---- 4.3  2026 in numbers --------------------------------
       Every figure is counted here, in the browser, off the same
       files the tables are drawn from. Nothing to write and
       nothing to keep up to date — and the scope is stated, so a
       season figure is never read as an all-time one. */
    (function () {
      var played = games.filter(function (g) {
        return g.home && g.away && g.home.score != null && g.away.score != null;
      });
      var pts = played.reduce(function (a, g) { return a + g.home.score + g.away.score; }, 0);
      var iocs = {};
      data.teams.forEach(function (t) { if (t.ioc) iocs[t.ioc] = 1; });

      var s = section('os-numbers', '2026 in numbers',
        '<span class="os-scope">2026 season · men and women</span>');
      var grid = el('div', 'os-nums');
      [[confs.length, 'Conferences'],
       [events.length, 'Stops'],
       [games.length.toLocaleString('en-GB'), 'Games'],
       [Object.keys(iocs).length, 'Nations'],
       [pts.toLocaleString('en-GB'), 'Points scored']].forEach(function (n) {
        grid.appendChild(el('div', 'os-num',
          '<span class="os-num-v">' + n[0] + '</span>' +
          '<span class="os-num-l">' + n[1] + '</span>'));
      });
      s.appendChild(grid);
      made.push(s);
    })();

    /* ---- 4.4  Champions --------------------------------------
       Eighteen champions, not one — which is the shape of this
       competition and, out of season, eighteen cards of content.
       The table is the same aggregation the conference standings
       use: tour points over the conference's stops, win ratio to
       separate a tie. */
    (function () {
      function table(confId, gender) {
        var by = {};
        events.filter(function (e) { return e.conference === confId; }).forEach(function (e) {
          var st = standings.filter(function (x) {
            return x.stop === e.slug && x.gender === gender;
          })[0];
          if (!st) return;
          (st.rows || []).forEach(function (r) {
            if (!r.ioc) return;
            var t = by[r.ioc] = by[r.ioc] ||
              { ioc: r.ioc, team: r.team, played: 0, won: 0, tour: 0, wins: 0, stops: 0 };
            t.played += r.played || 0;
            t.won += r.won || 0;
            t.tour += tourPoints(r.rank);
            t.stops += 1;
            if (r.rank === 1) t.wins += 1;
          });
        });
        var list = Object.keys(by).map(function (k) { return by[k]; });
        list.forEach(function (t) { t.ratio = t.played ? t.won / t.played : 0; });
        list.sort(function (a, b) { return b.tour - a.tour || b.ratio - a.ratio; });
        return list;
      }

      var gender = 'men';
      var s = section('os-champions', 'Champions',
        '<div class="el-02-GenderSwitch--men el02 el02-s os-gsw">' +
        '<div class="el02-seg cut cut-s el02-on cut-out" data-g="men" tabindex="0">' +
        '<div class="cutfill"></div><span class="lbl">Men</span></div>' +
        '<div class="el02-seg cut cut-s cut-out" data-g="women" tabindex="0">' +
        '<div class="cutfill"></div><span class="lbl">Women</span></div></div>');
      var grid = el('div', 'os-champs');
      s.appendChild(grid);

      function draw() {
        grid.innerHTML = '';
        confs.forEach(function (c) {
          var top = table(c.id, gender)[0];
          var stops = events.filter(function (e) { return e.conference === c.id; });
          var host = stops.length ? stops[stops.length - 1].city : '';
          var head = '<span class="os-champ-c">' + esc(confName(c)) +
                     (host ? ' · ' + esc(host) : '') + '</span>';
          /* Eighteen conferences, eighteen cards. One of them has no
             standings in the snapshot, and a card that says so is worth
             more than a grid that quietly comes up seventeen. */
          var body = top
            ? '<div class="os-champ-w">' + flagImg(top.ioc) +
              '<span class="os-champ-n">' + esc(top.team) + '</span></div>' +
              '<div class="os-champ-f"><span>' + top.stops + ' stops</span><span>·</span>' +
              '<span>won <span class="os-champ-sc">' + top.wins + '</span></span>' +
              '<span>·</span><span><span class="os-champ-sc">' + top.tour +
              '</span> tour points</span></div>'
            : '<div class="os-champ-w"><span class="os-champ-n os-champ-none">' +
              'Not published</span></div>' +
              '<div class="os-champ-f"><span>Results for this conference have not ' +
              'reached the feed</span></div>';
          var card = el('div', 'os-champ cut cut-s' + (top ? '' : ' os-champ-empty'),
                        head + body);
          go(card, 'conference.html?id=' + c.id);
          grid.appendChild(card);
        });
      }
      $$('.os-gsw .el02-seg', s).forEach(function (seg) {
        seg.addEventListener('click', function () {
          $$('.os-gsw .el02-seg', s).forEach(function (x) { x.classList.remove('el02-on'); });
          seg.classList.add('el02-on');
          gender = seg.getAttribute('data-g');
          draw();
        });
      });
      draw();
      made.push(s);
    })();

    /* ---- 4.5  Watch 2026 again -------------------------------
       Forty-nine of the hundred and eight stops carry a stream and
       the poster is the stream's own thumbnail. There is no view
       count and no tag in the feed, so there is no honest "most
       watched" here — the order is the calendar, newest first, and
       that is stated rather than dressed up. */
    (function () {
      var vids = events.filter(function (e) { return !!e.video; })
        .sort(function (a, b) {
          return String(b.end || b.start).localeCompare(String(a.end || a.start));
        });
      if (!vids.length) return;
      var s = section('os-watch', 'Watch 2026 again',
        '<span class="os-scope">' + vids.length + ' full stop streams · newest first</span>');
      var rail = el('div', 'os-rail');
      vids.slice(0, 8).forEach(function (e) {
        var c = confById[e.conference];
        var poster = e.poster || ('https://i.ytimg.com/vi/' + e.video + '/hq720.jpg');
        var card = el('div', 'os-vid',
          '<div class="os-vid-f cut cut-s"><img alt="" loading="lazy" src="' + esc(poster) +
          '"><span class="os-vid-p cut cut-s"><svg fill="currentColor" viewBox="0 -960 960 960" ' +
          'xmlns="http://www.w3.org/2000/svg"><path d="M320-203v-560l440 280-440 280Z"></path>' +
          '</svg></span></div><span class="os-vid-t">' + esc(confName(c)) + ' · Stop ' +
          e.number + '</span><span class="os-vid-m">' + esc(e.city) + ' · ' +
          esc(dayLabel(e.end || e.start)) + '</span>');
        var img = $('img', card);
        img.addEventListener('error', function () {
          if (img.src.indexOf('poster-nl') > -1) return;
          img.src = 'assets/poster-nl.svg';
        });
        go(card, 'stop.html?id=' + e.slug);
        rail.appendChild(card);
      });
      s.appendChild(rail);
      made.push(s);
    })();

    /* ---- 4.6  Meet the next generation -----------------------
       Not a ranking anybody has to defend: the players the feed
       already ranks highest, with the road they are on drawn
       under them. The path is the reason this competition exists
       and it does not change from year to year. */
    (function () {
      var list = players.filter(function (p) { return !!p.portrait; })
        .sort(function (a, b) { return (b.rankingPoints || 0) - (a.rankingPoints || 0); })
        .slice(0, 5);
      if (!list.length) return;
      var s = section('os-nextgen', 'Meet the next generation',
        '<span class="os-scope">Top of the 2026 field · ' + players.length + ' players</span>');
      var grid = el('div', 'os-gen');
      list.forEach(function (p) {
        var card = el('div', 'os-pl',
          '<div class="os-pl-p cut cut-s"><img alt="" loading="lazy" src="' +
          esc(p.portrait) + '"></div><span class="os-pl-n">' + esc(p.name) +
          '</span><span class="os-pl-m">' + esc(p.country) +
          (p.age ? ' · ' + p.age : '') + '</span>');
        go(card, 'player.html?id=' + p.id);
        grid.appendChild(card);
      });
      s.appendChild(grid);
      s.appendChild(el('div', 'os-path',
        '<span class="os-path-s is-here">Nations League</span>' +
        '<span class="os-path-a">' + ARROW + '</span>' +
        '<span class="os-path-s">U23 World Cup</span>' +
        '<span class="os-path-a">' + ARROW + '</span>' +
        '<span class="os-path-s">World Tour / Women&rsquo;s Series</span>' +
        '<span class="os-path-a">' + ARROW + '</span>' +
        '<span class="os-path-s">Olympic Games</span>'));
      made.push(s);
    })();

    /* ---- 4.7  Get ready for 3x3 ------------------------------
       In season this block is at the foot of the home page. Out of
       season it comes up: the traffic in these months arrives from
       a search engine, and a first-time reader needs to know what
       the competition is before they are shown a replay. */
    (function () {
      var s = section('os-howsec', 'Get ready for 3x3');
      var g = el('div', 'os-how');
      [['How 3x3 works',
        'Ten minutes or twenty-one points, whichever comes first. One point and two point shots, a twelve second shot clock, one court.'],
       ['How the Nations League works',
        'Eighteen conferences, six stops each. Tour points at every stop decide the conference, and the conference decides the season.'],
       ['The road to the U23 World Cup',
        'Twenty places at the U23 World Cup. Nineteen are won through the league; one goes to the host federation.']
      ].forEach(function (c) {
        var card = el('div', 'os-how-c cut cut-s',
          '<span class="os-how-t">' + esc(c[0]) + '</span>' +
          '<span class="os-how-d">' + esc(c[1]) + '</span>');
        go(card, 'about.html');
        g.appendChild(card);
      });
      s.appendChild(g);
      made.push(s);
    })();

    /* ---- 4.8  Get the 2027 dates -----------------------------
       Not "subscribe to our newsletter" — there is no reason to.
       The offer is the one thing the reader came for and could
       not find: the date. */
    var cta = (function () {
      var s = el('div', 'tpl-sub os-sec os-ctasec');
      var band = el('div', 'os-cta cut cut-m',
        '<div><div class="os-cta-t">Be first to know</div>' +
        '<div class="os-cta-d">One message when the 2027 schedule, the host cities ' +
        'and the participating teams are announced. Nothing else.</div></div>' +
        '<form class="os-cta-form"><input class="os-cta-in cut cut-s" type="email" ' +
        'placeholder="you@example.com" aria-label="Email address">' +
        '<button class="os-cta-b cut cut-s" type="submit">Notify me</button></form>');
      $('form', band).addEventListener('submit', function (e) {
        e.preventDefault();
        $('.os-cta-form', band).innerHTML =
          '<span class="os-cta-d">Thank you — we will be in touch when the 2027 dates are set.</span>';
      });
      s.appendChild(band);
      return s;
    })();

    var anchor = hl ? hl.nextSibling : content.firstChild;
    made.forEach(function (s) { content.insertBefore(s, anchor); });
    content.appendChild(cta);

    if (window.FIBA && window.FIBA.init) {
      try { window.FIBA.init(content); } catch (e) {}
    }
  }


  /* ---------- go ------------------------------------------- */
  var FILES = ['conferences', 'events', 'standings', 'teams', 'players', 'photos', 'games'];
  function load() {
    return Promise.all(FILES.map(function (f) {
      return fetch('assets/data/' + f + '.json').then(function (r) { return r.json(); });
    })).then(function (res) {
      var d = {};
      FILES.forEach(function (f, i) { d[f] = res[i]; });
      return d;
    });
  }

  ready(function () {
    try { seasonLinks(); } catch (e) { console.error('review16 f02', e); }

    if (PAGE === 'conferences.html') {
      /* scheduleModule builds late; wait for it rather than guess. */
      var tries = 0;
      var t = setInterval(function () {
        var done = false;
        try { done = confGenderHome(); } catch (e) {}
        if (done || ++tries > 60) clearInterval(t);
      }, 100);
    }

    if (PAGE !== 'index.html') return;

    load().then(function (d) {
      if (S.live) liveStopLinks(d.events);
      /* Round seventeen rebuilt both off-calendar pages and takes
         them over whole; this builder stays as the record of how
         they were first argued. */
      else if (!window.NL17) buildOffSeason(d);
    }).catch(function (e) { console.error('review16 data', e); });
  });
})();
