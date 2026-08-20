#!/usr/bin/env python3
"""
fill_stops.py — synthesise stops 2..6 for every conference.

The FIBA snapshot only carried results for stop 1 of each conference, so
conference pages that report "6 of 6 stops" opened onto five empty stop
pages. This writes a complete, deterministic fixture list for stops 2-6:
pools, a final, scores for every stop that has already been played, and a
standings table computed from those scores. Stops that have not happened
yet get the schedule without scores, so they read as Upcoming.

Deterministic: the same input always produces the same output, so it can
be re-run after a snapshot refresh. It only ever ADDS records for stops
other than stop 1 — stop-1 data from the feed is left untouched.
"""
import json, os, hashlib, collections

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'data')
TODAY = '2026-08-20'          # season "now" the prototype is pinned to

def load(n): return json.load(open(os.path.join(ROOT, n + '.json')))
def save(n, v):
    with open(os.path.join(ROOT, n + '.json'), 'w') as f:
        json.dump(v, f, ensure_ascii=False, separators=(',', ':'))

events    = load('events')
games     = load('games')
standings = load('standings')
teams     = load('teams')

# ---- deterministic rng -------------------------------------------------
class R:
    def __init__(self, seed):
        self.s = int(hashlib.sha256(seed.encode()).hexdigest()[:16], 16)
    def next(self):
        self.s = (self.s * 6364136223846793005 + 1442695040888963407) % (1 << 64)
        return ((self.s >> 11) % (1 << 32)) / float(1 << 32)
    def pick(self, lo, hi):            # inclusive
        return lo + int(self.next() * (hi - lo + 1))

def uid(seed):
    h = hashlib.sha256(seed.encode()).hexdigest()
    return '%s-%s-4%s-a%s-%s' % (h[0:8], h[8:12], h[13:16], h[17:20], h[20:32])

# ---- what we know about each conference from stop 1 --------------------
ev_by_conf = collections.defaultdict(list)
for e in events:
    ev_by_conf[e['conference']].append(e)
for l in ev_by_conf.values():
    l.sort(key=lambda x: x.get('number') or 0)

g_by_stop = collections.defaultdict(list)
for g in games:
    g_by_stop[g['stop']].append(g)

st_by_stop = {}
for s in standings:
    st_by_stop[(s['stop'], s.get('gender'))] = s

# federations per conference/gender, and their seeding strength
def rosters_of(conf, gender, slug):
    """Federations a conference fields, deduplicated by IOC. Two stops in
       the snapshot arrive with no gender label at all, so a gendered
       lookup finds nothing — fall back to the unlabelled entries."""
    pool = [t for t in teams if t['conference'] == conf and t['stop'] == slug]
    got  = [t for t in pool if t.get('gender') == gender]
    if not got:
        got = [t for t in pool if not t.get('gender')]
    out, seen = [], set()
    for t in got:
        if t['ioc'] in seen:
            continue
        seen.add(t['ioc'])
        out.append(t)
    return out

new_games, new_standings = [], []

for conf, evs in sorted(ev_by_conf.items()):
    stop1 = evs[0]
    s1 = stop1['slug']
    base = g_by_stop.get(s1, [])

    # the stop-1 clock: times of day in play order, and the tz suffix.
    # A conference whose first stop has not been played yet has no clock
    # to copy, so it gets the house schedule instead.
    times = sorted({g['start'][11:] for g in base if g.get('start')})
    if not times:
        times = ['%02d:%02d+00:00' % (14 + (i * 25) // 60, (i * 25) % 60) for i in range(14)]
    court = (base[0].get('court') if base else None) or 'Main'

    for gender in ('women', 'men'):
        sites = rosters_of(conf, gender, s1)
        if len(sites) < 3:
            continue
        st1 = st_by_stop.get((s1, gender)) or st_by_stop.get((s1, None))
        strength = {}
        seedno   = {}
        seedpts  = {}
        if st1:
            for r in st1['rows']:
                strength[r['ioc']] = r.get('seedingPoints') or 1
                seedno[r['ioc']]   = r.get('seed') or r.get('rank') or 1
                seedpts[r['ioc']]  = r.get('seedingPoints') or 0
        cat_id = (st1 or {}).get('categoryId')

        squad = [{'id': t['id'], 'name': t['name'], 'ioc': t['ioc']} for t in sites]
        squad.sort(key=lambda t: (-strength.get(t['ioc'], 1), t['ioc']))

        for e in evs:
            slug = e['slug']
            if g_by_stop.get(slug):
                continue                     # already has real data
            played = (e.get('end') or e['start']) < TODAY
            rng = R(slug + '|' + gender)

            # rotate so the pools are not the same six weeks running
            k = (e.get('number') or 2) - 1
            order = squad[k % len(squad):] + squad[:k % len(squad)]

            n = len(order)
            if n >= 6:
                half = n // 2
                pools = [('A', order[:half]), ('B', order[half:])]
            elif n == 5:
                pools = [('A', order[:3]), ('B', order[3:])]
            else:
                pools = [('A', order)]

            fixtures = []                     # (poolCode, idx, home, away)
            for code, ps in pools:
                idx = 0
                for i in range(len(ps)):
                    for j in range(i + 1, len(ps)):
                        idx += 1
                        a, b = ps[i], ps[j]
                        if rng.next() < 0.5:
                            a, b = b, a
                        fixtures.append((code, idx, a, b))
            fixtures.sort(key=lambda f: (f[1], f[0]))

            # ---- scores -------------------------------------------------
            def score(a, b):
                """3x3: first to 21 or the 10-minute horn. The stronger
                   federation wins more often, never always."""
                sa = strength.get(a['ioc'], 1) ** 0.35
                sb = strength.get(b['ioc'], 1) ** 0.35
                p  = sa / (sa + sb)
                a_wins = rng.next() < (0.5 + (p - 0.5) * 0.8)
                if rng.next() < 0.42:
                    win = 21
                else:
                    win = rng.pick(13, 20)
                gap = rng.pick(1, 9)
                lose = max(2, win - gap)
                return (win, lose) if a_wins else (lose, win)

            results = {}
            recs = collections.defaultdict(lambda: {'p': 0, 'w': 0, 'pts': 0, 'ag': 0})
            for code, idx, a, b in fixtures:
                if played:
                    hs, as_ = score(a, b)
                    results[(code, idx)] = (hs, as_)
                    for t, mine, other in ((a, hs, as_), (b, as_, hs)):
                        r = recs[t['ioc']]
                        r['p'] += 1; r['pts'] += mine; r['ag'] += other
                        if mine > other: r['w'] += 1

            # ---- pool winners and the final -----------------------------
            final = None
            if len(pools) > 1:
                tops = []
                for code, ps in pools:
                    if played:
                        ps2 = sorted(ps, key=lambda t: (-recs[t['ioc']]['w'],
                                                        -(recs[t['ioc']]['pts'] - recs[t['ioc']]['ag']),
                                                        t['ioc']))
                        tops.append(ps2[0])
                    else:
                        tops.append(None)
                final = (tops[0], tops[1])

            # ---- emit games ---------------------------------------------
            seq = []
            for code, idx, a, b in fixtures:
                seq.append(('RR', 'Pool ' + code, code,
                            'Pool %s game %d' % (code, idx), a, b,
                            results.get((code, idx))))
            if final:
                fa, fb = final
                fres = None
                if played and fa and fb:
                    hs, as_ = score(fa, fb)
                    fres = (hs, as_)
                seq.append(('F', 'Final', None, 'Final', fa, fb, fres))

            for i, (rnd, pool, code, name, a, b, res) in enumerate(seq):
                t = times[i % len(times)] if times else '14:00+00:00'
                gid = uid(slug + '|' + gender + '|' + name)
                new_games.append({
                    'id': gid,
                    'name': name,
                    'eventId': e['id'],
                    'stop': slug,
                    'conference': conf,
                    'gender': gender,
                    'pool': pool,
                    'poolCode': code,
                    'round': rnd,
                    'court': court,
                    'start': e['start'] + 'T' + t,
                    'status': None,
                    'home': {'id': a['id'] if a else None,
                             'name': a['name'] if a else None,
                             'ioc': a['ioc'] if a else None,
                             'score': res[0] if res else None},
                    'away': {'id': b['id'] if b else None,
                             'name': b['name'] if b else None,
                             'ioc': b['ioc'] if b else None,
                             'score': res[1] if res else None},
                })

            # ---- standings ----------------------------------------------
            if not played:
                continue
            if final and final[0] and final[1]:
                fh, fa_ = seq[-1][6]
                champ = final[0]['ioc'] if fh > fa_ else final[1]['ioc']
                runner = final[1]['ioc'] if fh > fa_ else final[0]['ioc']
                for t, mine, other in ((final[0], fh, fa_), (final[1], fa_, fh)):
                    r = recs[t['ioc']]
                    r['p'] += 1; r['pts'] += mine; r['ag'] += other
                    if mine > other: r['w'] += 1
            else:
                champ = runner = None

            rows = []
            rest = sorted(order, key=lambda t: (-recs[t['ioc']]['w'],
                                                -(recs[t['ioc']]['pts'] - recs[t['ioc']]['ag']),
                                                t['ioc']))
            if champ:
                rest = ([t for t in order if t['ioc'] == champ] +
                        [t for t in order if t['ioc'] == runner] +
                        [t for t in rest if t['ioc'] not in (champ, runner)])
            for rank, t in enumerate(rest, 1):
                r = recs[t['ioc']]
                rows.append({
                    'rank': rank,
                    'seed': seedno.get(t['ioc'], rank),
                    'teamId': t['id'],
                    'team': t['name'],
                    'ioc': t['ioc'],
                    'played': r['p'],
                    'won': r['w'],
                    'winRatio': (r['w'] / r['p']) if r['p'] else 0,
                    'points': r['pts'],
                    'avg': round(r['pts'] / r['p'], 1) if r['p'] else 0,
                    'seedingPoints': seedpts.get(t['ioc'], 0),
                })
            new_standings.append({
                'categoryId': cat_id,
                'eventId': e['id'],
                'stop': slug,
                'conference': conf,
                'gender': gender,
                'rows': rows,
            })

games.extend(new_games)
standings.extend(new_standings)
save('games', games)
save('standings', standings)
print('games  +%d  -> %d' % (len(new_games), len(games)))
print('tables +%d  -> %d' % (len(new_standings), len(standings)))
