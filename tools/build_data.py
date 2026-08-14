#!/usr/bin/env python3
"""Turn the browser snapshot into the prototype's data files.

Input : FIBA-2026/fiba-nl-2026-snapshot.json   (from tools/snapshot.js)
Output: assets/data/*.json                     (what the screens read)

Images are left as Cloudinary / ImageProxy URLs — they are public and the
size and crop can be changed in the URL, so no image folder is needed.
"""
import json, os, re, unicodedata, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNAP = os.path.join(os.path.dirname(ROOT), "fiba-nl-2026-snapshot.json")
OUT  = os.path.join(ROOT, "assets", "data")
os.makedirs(OUT, exist_ok=True)

snap = json.load(open(SNAP, encoding="utf-8"))

def slug(t):
    t = unicodedata.normalize("NFKD", t or "")
    t = re.sub(r"[^\w\s-]", " ", t).strip().lower()
    return re.sub(r"[\s_]+", "-", t).strip("-")

def img(url, w=960, ar="3:2"):
    """Cloudinary lets us ask for the crop and width we actually use."""
    if not url or "res.cloudinary.com" not in url:
        return url
    return re.sub(r"/ar_[^/]+/w_\d+,c_lfill/", "/ar_%s,c_lfill,g_auto/w_%d,c_lfill/" % (ar, w), url)

# ---------- conferences and stops ----------
raw = snap.get("nationsLeagueEvents", {}).get("2026", {}).get("data", [])
conferences, events = [], []
for c in raw:
    label = c.get("label") or ""
    name = re.sub(r"^FIBA 3x3 (Youth )?Nations League \d{4}\s*-\s*", "", label).strip()
    cid = slug(name) or c.get("conferenceId")
    stops = []
    for i, e in enumerate(c.get("events") or [], 1):
        sid = slug(re.sub(r"^.*-\s*", "", e.get("name") or "")) or e.get("id")
        stop = {
            "id": e.get("id"),
            "slug": "%s-%s" % (cid, sid),
            "conference": cid,
            "number": i,
            "name": e.get("name"),
            "city": e.get("eventCityName"),
            "country": e.get("eventCountryName"),
            "ioc": e.get("eventCountryIoc"),
            "iso2": e.get("eventCountryIso2"),
            "start": (e.get("startDate") or "")[:10],
            "end": (e.get("endDate") or "")[:10],
        }
        stops.append(stop["slug"])
        events.append(stop)
    conferences.append({
        "id": cid,
        "conferenceId": c.get("conferenceId"),
        "name": name,
        "label": label,
        "region": name.split()[0] if name else "",
        "stops": stops,
        "stopCount": len(stops),
    })

# ---------- news ----------
news = []
for k, v in (snap.get("news", {}).get("previews") or {}).items():
    news.append({
        "id": v.get("id"),
        "slug": v.get("slug") or k,
        "title": v.get("title"),
        "date": v.get("date"),
        "image": img(v.get("imageBaseUrl"), 1200, "16:9"),
        "thumb": img(v.get("imageBaseUrl"), 640, "3:2"),
    })
news.sort(key=lambda x: x.get("date") or "", reverse=True)

# ---------- photo galleries ----------
gal = (snap.get("media", {}).get("gallerypreviews", {}).get("tours", {}) or {}).get("NL2026", [])
by_event = collections.defaultdict(list)
photos = []
for g in gal:
    rec = {
        "title": g.get("title"),
        "eventId": g.get("eventId"),
        "galleryId": g.get("galleryId"),
        "image": g.get("imageUrl"),
        "count": g.get("total"),
    }
    photos.append(rec)
    if rec["eventId"]:
        by_event[rec["eventId"]].append(rec)

# attach the gallery count to each stop
for e in events:
    gs = by_event.get(e["id"], [])
    e["galleries"] = len(gs)
    e["photos"] = sum(x.get("count") or 0 for x in gs)
    e["cover"] = gs[0]["image"] if gs else None

def write(name, obj):
    p = os.path.join(OUT, name)
    json.dump(obj, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("  %-20s %5d records  %6.0f KB" % (name, len(obj), os.path.getsize(p) / 1024))

write("conferences.json", conferences)
write("events.json", events)
write("news.json", news)
write("photos.json", photos)

missing = [k for k in ("teams", "players", "games", "results", "teamStats",
                       "playerStats", "qualifications")
           if not any((snap.get(k) or {}).get(x) for x in (snap.get(k) or {}))]
print("\nempty in this snapshot (needs a second pass):", ", ".join(missing))
