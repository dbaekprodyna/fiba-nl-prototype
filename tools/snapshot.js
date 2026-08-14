/* ============================================================
   FIBA Nations League — data snapshot
   Paste into the browser console on https://nationsleague.fiba3x3.com/2026

   The live site is a Redux app: everything it has fetched sits in
   window.__fiba.services.store.getState(). This walks the site's own
   routes, collects each page's slice of that store, merges it, and
   downloads one JSON file. No API key needed — it only reads pages
   the browser has already been served.

   Output: fiba-nl-2026-snapshot.json  →  move it to
   fiba-nl-prototype/assets/data/ and tell me; I reshape it from there.
   ============================================================ */
(async function () {
  const ROUTES = [
    '/2026',
    '/2026/standings',
    '/2026/conferences',
    '/2026/teams',
    '/2026/stats',
    '/2026/calendar',
    '/2026/news',
    '/2026/about'
  ];

  /* Slices worth keeping. The rest is UI state, translations and router
     bookkeeping that the prototype has no use for. */
  const KEEP = [
    'conferences', 'events', 'nationsLeagueEvents', 'eventActivities',
    'games', 'gameStats', 'results', 'qualifications',
    'teams', 'teamStats', 'teamRankings', 'tourTeams', 'tourTeamResults',
    'players', 'playerStats', 'topScorerStats',
    'news', 'media', 'tours', 'categories', 'content'
  ];

  const merged = {};
  const log = [];

  /* The store is Immutable.js, so plain Object.keys() returns its
     internals (_root, __hash, size). toJS() gives the real records. */
  function harvest(tag) {
    const raw = window.__fiba && window.__fiba.services &&
                window.__fiba.services.store.getState();
    if (!raw) { log.push(tag + ': no store'); return; }
    const st = typeof raw.toJS === 'function' ? raw.toJS() : raw;
    let added = 0;
    for (const k of KEEP) {
      const slice = st[k];
      if (!slice || typeof slice !== 'object') continue;
      merged[k] = merged[k] || {};
      for (const id of Object.keys(slice)) {
        if (id.startsWith('__')) continue;          // __meta is request bookkeeping
        if (!(id in merged[k])) { merged[k][id] = slice[id]; added++; }
      }
    }
    log.push(tag + ': +' + added + ' records');
  }

  const history = window.__fiba.services.history;
  for (const r of ROUTES) {
    try {
      history.push(r);
      await new Promise(res => setTimeout(res, 2500));
      harvest(r);
    } catch (e) {
      log.push(r + ': ' + e.message);
    }
  }

  /* Strip circular references and functions before serialising. */
  const seen = new WeakSet();
  const json = JSON.stringify(merged, function (k, v) {
    if (typeof v === 'function') return undefined;
    if (v && typeof v === 'object') {
      if (seen.has(v)) return undefined;
      seen.add(v);
    }
    return v;
  }, 1);

  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fiba-nl-2026-snapshot.json';
  a.click();

  console.table(log.map(l => ({ step: l })));
  console.log('size:', (json.length / 1024 / 1024).toFixed(2), 'MB');
  console.log('slices:', Object.fromEntries(
    Object.entries(merged).map(([k, v]) => [k, Object.keys(v).length])));
  return { sizeMB: +(json.length / 1024 / 1024).toFixed(2), log };
})();
