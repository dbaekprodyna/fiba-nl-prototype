#!/usr/bin/env python3
"""Fold the second snapshot (teams, rosters, standings, venues) into
assets/data/. Run after tools/build_data.py.
"""
import json, os, re, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.dirname(ROOT)
OUT  = os.path.join(ROOT, "assets", "data")

snap = json.load(open(os.path.join(BASE, "fiba-nl-2026-snapshot-2.json"), encoding="utf-8"))
events = json.load(open(os.path.join(OUT, "events.json"), encoding="utf-8"))
by_id = {e["id"]: e for e in events}

# ---------- category → event + gender ----------
cat = {}
for t in snap.get("teams", {}).values():
    m = (t.get("teamMembers") or [{}])[0]
    g = (m.get("gender") or "").lower()
    cat.setdefault(t["categoryId"], {
        "categoryId": t["categoryId"],
        "eventId": t.get("eventId"),
        "gender": "women" if g == "female" else "men" if g == "male" else "",
    })

# ---------- teams and rosters ----------
teams, players, seen = [], {}, set()
for t in snap.get("teams", {}).values():
    ev = by_id.get(t.get("eventId"))
    c = cat.get(t["categoryId"], {})
    roster = []
    for m in (t.get("teamMembers") or []):
        pid = m.get("id")
        if pid and pid not in seen:
            seen.add(pid)
            players[pid] = {
                "id": pid,
                "first": m.get("firstName"),
                "last": m.get("lastName"),
                "name": " ".join(x for x in (m.get("firstName"), m.get("lastName")) if x),
                "ioc": m.get("nationality"),
                "country": m.get("homeCountry"),
                "city": m.get("homeCity"),
                "age": m.get("age"),
                "gender": (m.get("gender") or "").lower(),
                "rankingPoints": m.get("rankingPoints"),
            }
        roster.append({"id": pid, "captain": bool(m.get("isCaptain"))})
    teams.append({
        "id": t.get("id"),
        "name": t.get("name"),
        "ioc": t.get("nationality"),
        "status": t.get("status"),
        "eventId": t.get("eventId"),
        "stop": ev["slug"] if ev else None,
        "conference": ev["conference"] if ev else None,
        "gender": c.get("gender"),
        "roster": roster,
    })

# ---------- standings ----------
standings = []
for r in snap.get("results", {}).values():
    c = cat.get(r.get("categoryId"), {})
    ev = by_id.get(c.get("eventId"))
    rows = []
    for s in (r.get("standings") or []):
        rows.append({
            "rank": s.get("teamRank"),
            "seed": s.get("teamSeed"),
            "teamId": s.get("teamId"),
            "team": s.get("teamName"),
            "ioc": s.get("teamNationality"),
            "played": s.get("gamesPlayed"),
            "won": s.get("gamesWon"),
            "winRatio": s.get("winRatio"),
            "points": s.get("totalPoints"),
            "avg": round(s.get("averagePoints") or 0, 1),
            "seedingPoints": s.get("seedingPoints"),
        })
    rows.sort(key=lambda x: x["rank"] or 99)
    standings.append({
        "categoryId": r.get("categoryId"),
        "eventId": c.get("eventId"),
        "stop": ev["slug"] if ev else None,
        "conference": ev["conference"] if ev else None,
        "gender": c.get("gender"),
        "rows": rows,
    })

# ---------- venue detail onto the stop ----------
enriched = 0
for e in snap.get("events", {}).values():
    data = e.get("data") or {}
    ev = by_id.get(data.get("id"))
    if not ev:
        continue
    ev["venue"] = data.get("addressLine1")
    ev["location"] = data.get("location")
    ev["lat"] = data.get("latitude")
    ev["lon"] = data.get("longitude")
    ev["teamsRegistered"] = data.get("teamsRegisteredCount")
    ev["status"] = data.get("eventStatus")
    ev["courts"] = [c.get("name") for c in (data.get("courts") or [])]
    enriched += 1

def write(name, obj):
    p = os.path.join(OUT, name)
    json.dump(obj, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("  %-20s %5d records  %6.0f KB" % (name, len(obj), os.path.getsize(p) / 1024))

write("teams.json", teams)
write("players.json", list(players.values()))
write("standings.json", standings)
write("events.json", events)
print("\nstops enriched with venue detail:", enriched)
print("stops with standings:", len({s['stop'] for s in standings if s['stop']}))
