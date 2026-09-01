#!/usr/bin/env python3
"""Generate CASPER API JSON files from every CSN archive in data/."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = ROOT / "api" / "v1"
OUT.mkdir(parents=True, exist_ok=True)

BLOCK_RE = re.compile(r"\[\s*(.*?)\s*\]", re.S)
FIELD_RE = re.compile(r"(?:^|;)\s*([^=;\n]+)=([^;\n]+)")
MATCH_RE = re.compile(r"([A-Za-z0-9_]+)-([A-Za-z0-9_]+):([0-9]+)-([0-9]+)(?:\(([^)]*)\))?#([A-Za-z0-9]+)")
TEAM_RE = re.compile(r"([A-Za-z0-9_]+)=([^\[,\n]+)(?:\[([^\]]+)\])?")


def fields(block):
    out = {}
    for k, v in FIELD_RE.findall(block):
        out[k.strip()] = v.strip()
    return out


def parse_awards(text):
    m = re.search(r"\baw\(\s*(.*?)\s*\)", text, re.S)
    if not m:
        return {}
    out = {}
    for part in re.split(r"[;\n]+", m.group(1)):
        if "=" in part:
            k, v = part.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def parse_block(block):
    header = fields(block)
    comp = {
        "id": header.get("id"), "name": header.get("e"), "season": header.get("s"),
        "edition": int(header["ed"]) if header.get("ed", "").isdigit() else header.get("ed"),
        "format": header.get("fmt"), "teams": int(header["t"]) if header.get("t", "").isdigit() else header.get("t"),
        "status": header.get("sts"), "champion": None
    }
    n = re.search(r"\bn\(\s*(.*?)\s*\)", block, re.S)
    teams = []
    if n:
        for code, name, player in TEAM_RE.findall(n.group(1)):
            teams.append({"id": code, "name": name.strip(), "player": player})
    matches = []
    mm = re.search(r"\bm\(\s*(.*?)\s*\)", block, re.S)
    if mm:
        for i, raw in enumerate(mm.group(1).split(";"), 1):
            raw = raw.strip()
            if not raw or raw.startswith("#"):
                continue
            x = MATCH_RE.search(raw)
            if not x:
                continue
            home, away, hs, a_s, extra, rnd = x.groups()
            item = {"id": f"{comp['season']}-{comp['id']}-{i:03d}", "competition": comp["id"], "home_team": home, "away_team": away, "home_score": int(hs), "away_score": int(a_s), "round": rnd, "status": "completed"}
            if extra:
                p = re.search(r"p(\d+)-(\d+)", extra)
                if p: item["shootout"] = f"{p.group(1)}-{p.group(2)}"
            matches.append(item)
    awards = parse_awards(block)
    comp["champion"] = awards.get("ch")
    return comp, teams, matches, awards


def main():
    competitions, teams, players, matches, awards = [], {}, {}, [], {}
    season_ids = set()
    for path in sorted(DATA.glob("*.csn")):
        text = path.read_text(encoding="utf-8")
        for block in BLOCK_RE.findall(text):
            comp, ts, ms, aw = parse_block(block)
            if not comp["id"] or not comp["name"]: continue
            season = comp["season"] or path.stem
            season_ids.add(season)
            competitions.append(comp)
            for t in ts:
                t.update({"season": season, "matches": 0, "wins": 0, "draws": 0, "losses": 0, "goals_for": 0, "goals_against": 0, "title_count": 0, "titles": []})
                teams.setdefault(t["id"], t)
                if t.get("player"):
                    players.setdefault(t["player"].lower().replace(" ", "-"), {"id": t["player"].lower().replace(" ", "-"), "name": t["player"], "team": t["id"], "club": t["name"], "season": season})
            matches.extend(ms)
            awards[comp["id"]] = {k: v for k, v in aw.items()}
            if comp["champion"] and comp["champion"] in teams:
                teams[comp["champion"]]["title_count"] += 1
                teams[comp["champion"]]["titles"].append(comp["name"])
    for m in matches:
        h, a = teams.get(m["home_team"]), teams.get(m["away_team"])
        if not h or not a: continue
        h["matches"] += 1; a["matches"] += 1
        h["goals_for"] += m["home_score"]; h["goals_against"] += m["away_score"]
        a["goals_for"] += m["away_score"]; a["goals_against"] += m["home_score"]
        if m["home_score"] > m["away_score"]: h["wins"] += 1; a["losses"] += 1
        elif m["home_score"] < m["away_score"]: a["wins"] += 1; h["losses"] += 1
        else: h["draws"] += 1; a["draws"] += 1
    def dump(name, obj):
        (OUT / name).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    dump("seasons.json", {"seasons": [{"id": s, "name": s, "status": "completed"} for s in sorted(season_ids)]})
    dump("competitions.json", {"competitions": competitions})
    dump("teams.json", {"teams": list(teams.values())})
    dump("players.json", {"players": list(players.values())})
    dump("matches.json", {"count": len(matches), "matches": matches})
    dump("awards.json", {"competition_awards": awards})
    dump("stats.json", {"matches": len(matches), "competitions": len(competitions), "teams": len(teams), "players": len(players), "goals": sum(m["home_score"] + m["away_score"] for m in matches)})
    dump("index.json", {"name": "CASPER API", "version": "1.0.0", "data_source": "data/*.csn", "endpoints": {k: f"./{k}.json" for k in ["seasons", "competitions", "teams", "players", "matches", "awards", "stats"]}})

if __name__ == "__main__": main()
