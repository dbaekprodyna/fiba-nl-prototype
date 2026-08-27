#!/usr/bin/env python3
"""Player photographs, from the snapshot we already have.

The live site's own team roster carries three sizes of every player's
FIBA profile picture:

    imageTinyUrl    profile.80x80.png
    imageSmallUrl   profile.160x160.png
    imageMediumUrl  profile.480x480.png

They are on assets.fiba3x3.com, public, and addressed by the player's
FIBA *member* id — which is not the roster id, so the URL cannot be
derived from anything in players.json. It does not have to be: it is
sitting in the snapshot beside the name, and this walks it across.

442 of the 711 players in the 2026 season have one. Nothing is
downloaded — the four PNGs already in assets/players are kept as local
overrides and everyone else points at FIBA's CDN, which is what the
real site does.

    python3 tools/fill_portraits.py            # write players.json
    python3 tools/fill_portraits.py --dry      # count only
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNAP = os.path.join(os.path.dirname(ROOT), 'fiba-nl-2026-snapshot-2.json')
PLAYERS = os.path.join(ROOT, 'assets', 'data', 'players.json')

snap = json.load(open(SNAP, encoding='utf-8'))
players = json.load(open(PLAYERS, encoding='utf-8'))

shot = {}
for team in (snap.get('teams') or {}).values():
    for m in (team.get('teamMembers') or []):
        url = m.get('imageMediumUrl') or m.get('imageSmallUrl')
        if m.get('id') and url:
            shot.setdefault(m['id'], url)

local = os.path.join(ROOT, 'assets', 'players')
have_local = set(os.listdir(local)) if os.path.isdir(local) else set()

n = kept = 0
for p in players:
    file = (p.get('portrait') or '').split('/')[-1]
    if file and file in have_local:
        kept += 1
        continue
    url = shot.get(p.get('id'))
    if url:
        p['portrait'] = url
        n += 1

print('players           : %d' % len(players))
print('local files kept  : %d' % kept)
print('CDN photos added  : %d' % n)
print('still without one : %d' % sum(1 for p in players if not p.get('portrait')))

if '--dry' not in sys.argv:
    with open(PLAYERS, 'w', encoding='utf-8') as f:
        json.dump(players, f, ensure_ascii=False, indent=1)
    print('written', PLAYERS)
