# assets/data

Real 2026 season data, pulled from the live Nations League site with
`tools/snapshot.js` and `tools/snapshot2.js`, reshaped by
`tools/build_data.py` and `tools/build_data2.py`.

| file | records | what it is |
|---|---|---|
| `conferences.json` | 18 | id, name, region, its stops |
| `events.json` | 108 | every stop — city, country, IOC, dates, venue, coordinates, teams registered, gallery and photo counts, cover image |
| `standings.json` | 36 | 18 stops × men/women — rank, seed, W/L, win ratio, points, average |
| `teams.json` | 202 | team per stop with its roster and captain |
| `players.json` | 711 | name, age, IOC, home city, ranking points |
| `news.json` | 3 | headline, date, image at two sizes |
| `photos.json` | 401 | gallery previews keyed to a stop |
| `games.json` | 226 | 17 stops — pool, round, court, tip-off, both teams with scores |

About 660 KB in total — small enough to load in one go.

## How it joins up

```
conference ──< event (stop) ──< standings (men | women)
                           └──< teams ──< players
                           └──< photos
```

`events[].slug` is the live site's own URL segment (`africa-east-stop-1`), so a
stop can always be traced back to the source page.

## Images

URLs, not files. Cloudinary and the FIBA ImageProxy serve them, and crop and
width are URL parameters — `ar_3:2,c_lfill,g_auto/w_960` returns exactly what a
card needs. Nothing is downloaded or committed.

## What is not here

**Per-player game statistics.** Points and rebounds per player per game sit
behind each game's box-score page, which neither pass visited. The player game
log therefore has real opponents and results but no individual line.

Game *results* are here: 226 games across 17 stops, with pool, round, court,
tip-off time and both scores.

18 of the 108 stops carry standings and rosters: `snapshot2.js` ran with
`LIMIT = 18`, one stop per conference. Raise the limit and re-run to cover more.
