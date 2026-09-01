/* ============================================================
   FIBA 3x3 Nations League — season.js
   Round fourteen. The state the whole site is being shown in.

   This is the only file on the site that is NOT deferred: it has
   to run before site.js asks what day it is, because the answer
   is what every live badge, dot, counter and stream on the site
   is computed from.

   Three states, read off the hash:

     (none) / season=live   26 Aug 2026 — two conferences playing,
                            one of them streaming. The season the
                            prototype is meant to be demonstrated in.
     season=off             31 Aug 2026 — three days after the last
                            stop. Nothing is playing and the 2027
                            dates are not published.
     season=pre             31 Aug 2026, but the 2027 dates ARE
                            published — so the same day produces a
                            countdown instead of a holding line.

   Off and pre share a day on purpose: the difference between them
   is not the calendar, it is how much is known. That is the whole
   argument of the off-season concept — the page does not change,
   its state does.
   ============================================================ */
(function () {
  'use strict';

  /* The state has to survive a link. Every page carries the F-02
     switch, but `<a href="conferences.html">` drops the hash, so an
     off-season home used to land on a live Conferences page. The hash
     is still the authority when it says something: `season=` names the
     state outright, and a hash that carries `hero=` without a `season=`
     is the way back to live, because that is the hash the Hero / No
     hero links write. With no hash at all the last stated answer
     stands, for this tab only. */
  var HASH = location.hash || '';
  var M = /(?:^|[#&])season=(live|off|pre)\b/.exec(HASH);
  var stated = M ? M[1] : (/(?:^|[#&])hero=/.test(HASH) ? 'live' : null);
  var mode = stated;
  try {
    if (stated) sessionStorage.setItem('nl-season', stated);
    else mode = sessionStorage.getItem('nl-season');
  } catch (e) { /* private mode: the hash is the only state there is */ }
  if (mode !== 'off' && mode !== 'pre') mode = 'live';

  var PIN = {
    live: '2026-08-26T15:20:00',
    off:  '2026-08-31T11:00:00',
    pre:  '2026-08-31T11:00:00'
  };

  /* The 2027 milestones. In `off` only the first is known — which is
     exactly the case the headline ladder exists for. */
  var MILESTONES = [
    { d: '2026-11-02', t: 'Schedule announced' },
    { d: '2027-01-18', t: 'Host cities confirmed' },
    { d: '2027-03-15', t: 'Team entry deadline' },
    { d: '2027-06-04', t: 'Season opener' },
    { d: '2027-09-07', t: 'U23 World Cup' }
  ];

  var Real = window.Date;
  var t0 = new Real(PIN[mode] || PIN.live).getTime();

  /* A Proxy rather than a subclass: every static (parse, UTC), the
     prototype and `instanceof` keep working, and only the two things
     that mean "now" are answered from the pin. */
  try {
    window.Date = new Proxy(Real, {
      construct: function (T, args) {
        if (!args.length) return new T(t0);
        return new (Function.prototype.bind.apply(T, [null].concat(args)))();
      },
      apply: function () { return new Real(t0).toString(); },
      get: function (T, k) {
        if (k === 'now') return function () { return t0; };
        var v = T[k];
        return typeof v === 'function' ? v.bind(T) : v;
      }
    });
  } catch (e) { /* no Proxy — the site simply runs on the real day */ }

  function isoDay(t) {
    var d = new Real(t);
    return d.getFullYear() + '-' +
           ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
           ('0' + d.getDate()).slice(-2);
  }

  window.SEASON = {
    mode: mode,
    live: mode === 'live',
    off: mode !== 'live',
    today: isoDay(t0),
    now: t0,
    /* `off` knows the first milestone only; `pre` knows them all. */
    milestones: MILESTONES.map(function (m, i) {
      return { date: m.d, title: m.t, known: mode === 'pre' || i === 0 };
    }),
    opener: mode === 'pre' ? '2027-06-04' : null,
    nextYear: 2027
  };

  document.documentElement.classList.add('season-' + mode);
  if (mode !== 'live') document.documentElement.classList.add('season-nolive');
})();
