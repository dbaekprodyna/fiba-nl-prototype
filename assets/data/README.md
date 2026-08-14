# assets/data

Real 2026 season data, pulled from the live Nations League site with
`tools/snapshot.js` and reshaped by `tools/build_data.py`.

| file | records | what it is |
|---|---|---|
| `conferences.json` | 18 | conference id, name, region, its stops |
| `events.json` | 108 | every stop: city, country, IOC code, dates, gallery counts, cover image |
| `news.json` | 3 | headline, date, Cloudinary image at two sizes |
| `photos.json` | 401 | gallery previews, keyed to an event |

**Images are URLs, not files.** They sit on Cloudinary and the ImageProxy, and
the crop and width are part of the URL — `ar_3:2,c_lfill,g_auto/w_960` returns
exactly what our cards need. Nothing has to be downloaded or committed.

## Still missing

Standings, teams, players and games are loaded per stop, so the first pass
never saw them. `tools/snapshot2.js` walks each stop's own pages
(`/standings/men/pools`, `/teams`, `/games`) and collects them.

Run it the same way — console on the live site, after typing `allow pasting`.
`LIMIT = 18` covers every conference once in about three minutes; raise it to
108 for the whole season, which takes around twenty. Save the download next to
the first one and I will fold it in.
