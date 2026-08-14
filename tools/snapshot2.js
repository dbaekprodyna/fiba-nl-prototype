/* ============================================================
   FIBA Nations League — snapshot, pass 2
   Standings, teams and games live on each stop's own pages, so this
   walks them. Paste into the console on
   https://nationsleague.fiba3x3.com/2026 after typing `allow pasting`.

   STOPS is ordered: one stop per conference first, then the rest.
   Change LIMIT to control how long it runs — 18 covers every
   conference once (about 3 minutes), 108 covers the whole season
   (about 18 minutes).
   ============================================================ */
(async function () {
  const LIMIT = 18;
  const SEASON = '/2026';
  const SUB = ['/standings/men/pools', '/standings/women/pools', '/teams', '/games'];
  const STOPS = ["africa-east-stop-1","africa-north-stop-1","africa-south-stop-1","americas-north-stop-1","americas-south-stop-1","asia-central-east-stop-1","asia-sea-stop-1","asia-west-pacific-stop-1","europe-1-stop-1","europe-2-stop-1","europe-3-stop-1","europe-4-stop-1","pacific-stop-1","u21-asia-1-stop-1","u21-asia-2-stop-1","u21-europe-1-stop-1","u21-europe-2-stop-1","u21-europe-3-stop-1","africa-east-stop-2","africa-east-stop-3","africa-east-stop-4","africa-east-stop-5","africa-east-stop-6","africa-north-stop-2","africa-north-stop-3","africa-north-stop-4","africa-north-stop-5","africa-north-stop-6","africa-south-stop-2","africa-south-stop-3","africa-south-stop-4","africa-south-stop-5","africa-south-stop-6","americas-north-stop-2","americas-north-stop-3","americas-north-stop-4","americas-north-stop-5","americas-north-stop-6","americas-south-stop-2","americas-south-stop-3","americas-south-stop-4","americas-south-stop-5","americas-south-stop-6","asia-central-east-stop-2","asia-central-east-stop-3","asia-central-east-stop-4","asia-central-east-stop-5","asia-central-east-stop-6","asia-sea-stop-2","asia-sea-stop-3","asia-sea-stop-4","asia-sea-stop-5","asia-sea-stop-6","asia-west-pacific-stop-2","asia-west-pacific-stop-3","asia-west-pacific-stop-4","asia-west-pacific-stop-5","asia-west-pacific-stop-6","europe-1-stop-2","europe-1-stop-3","europe-1-stop-4","europe-1-stop-5","europe-1-stop-6","europe-2-stop-2","europe-2-stop-3","europe-2-stop-4","europe-2-stop-5","europe-2-stop-6","europe-3-stop-2","europe-3-stop-3","europe-3-stop-4","europe-3-stop-5","europe-3-stop-6","europe-4-stop-2","europe-4-stop-3","europe-4-stop-4","europe-4-stop-5","europe-4-stop-6","pacific-stop-2","pacific-stop-3","pacific-stop-4","pacific-stop-5","pacific-stop-6","u21-asia-1-stop-2","u21-asia-1-stop-3","u21-asia-1-stop-4","u21-asia-1-stop-5","u21-asia-1-stop-6","u21-asia-2-stop-2","u21-asia-2-stop-3","u21-asia-2-stop-4","u21-asia-2-stop-5","u21-asia-2-stop-6","u21-europe-1-stop-2","u21-europe-1-stop-3","u21-europe-1-stop-4","u21-europe-1-stop-5","u21-europe-1-stop-6","u21-europe-2-stop-2","u21-europe-2-stop-3","u21-europe-2-stop-4","u21-europe-2-stop-5","u21-europe-2-stop-6","u21-europe-3-stop-2","u21-europe-3-stop-3","u21-europe-3-stop-4","u21-europe-3-stop-5","u21-europe-3-stop-6"];

  const KEEP = ['teams','teamStats','teamRankings','tourTeams','tourTeamResults',
                'players','playerStats','topScorerStats','games','gameStats',
                'results','qualifications','conferences','events','eventActivities'];

  const merged = {}, log = [];
  function harvest(tag) {
    const raw = window.__fiba.services.store.getState();
    const st = typeof raw.toJS === 'function' ? raw.toJS() : raw;
    let added = 0;
    for (const k of KEEP) {
      const slice = st[k];
      if (!slice || typeof slice !== 'object') continue;
      merged[k] = merged[k] || {};
      for (const id of Object.keys(slice)) {
        if (id.startsWith('__')) continue;
        if (!(id in merged[k])) { merged[k][id] = slice[id]; added++; }
        else if (JSON.stringify(merged[k][id]).length < JSON.stringify(slice[id]).length) {
          merged[k][id] = slice[id];               /* keep the fuller copy */
        }
      }
    }
    if (added) log.push(tag + ': +' + added);
  }

  const h = window.__fiba.services.history;
  const stops = STOPS.slice(0, LIMIT);
  for (let i = 0; i < stops.length; i++) {
    for (const sub of SUB) {
      try {
        h.push(SEASON + '/' + stops[i] + sub);
        await new Promise(r => setTimeout(r, 2200));
        harvest(stops[i] + sub);
      } catch (e) { log.push(stops[i] + sub + ' ! ' + e.message); }
    }
    console.log((i + 1) + '/' + stops.length, stops[i]);
  }

  const seen = new WeakSet();
  const json = JSON.stringify(merged, function (k, v) {
    if (typeof v === 'function') return undefined;
    if (v && typeof v === 'object') { if (seen.has(v)) return undefined; seen.add(v); }
    return v;
  }, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = 'fiba-nl-2026-snapshot-2.json';
  a.click();
  console.log('size', (json.length / 1048576).toFixed(2), 'MB');
  console.log('slices', Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, Object.keys(v).length])));
  return { sizeMB: +(json.length / 1048576).toFixed(2), steps: log.length };
})();
