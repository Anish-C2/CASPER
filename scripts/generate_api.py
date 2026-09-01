#!/usr/bin/env python3
"""Generate CASPER API JSON files from every CSN archive in data/."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = ROOT / "api" / "v1"
OUT.mkdir(parents=True, exist_ok=True)

MATCH_RE = re.compile(r"([A-Za-z0-9_]+)-([A-Za-z0-9_]+):([0-9]+)-([0-9]+)(?:\(([^)]*)\))?#([A-Za-z0-9]+)")
TEAM_RE = re.compile(r"([A-Za-z0-9_]+)=([^,\n]+?)(?:\[([^\]]+)\])?(?=,|\n|$)")


def balanced_blocks(text):
    """Return top-level [ ... ] CSN blocks, correctly handling team [player] brackets."""
    blocks, start, depth = [], None, 0
    for i, ch in enumerate(text):
        if ch == "[":
            if depth == 0:
                start = i + 1
            depth += 1
        elif ch == "]" and depth:
            depth -= 1
            if depth == 0 and start is not None:
                blocks.append(text[start:i])
                start = None
    return blocks


def section(text, name):
    m = re.search(r"\b" + re.escape(name) + r"\(", text)
    if not m:
        return None
    start = m.end()
    depth = 1
    for i in range(start, len(text)):
        if text[i] == "(": depth += 1
        elif text[i] == ")":
            depth -= 1
            if depth == 0:
                return text[start:i]
    return None


def header_fields(block):
    header = block.split("n(", 1)[0]
    result = {}
    for line in header.splitlines():
        line = line.strip().rstrip(";")
        if "=" in line:
            k, v = line.split("=", 1)
            result[k.strip()] = v.strip()
    return result


def parse_awards(block):
    body = section(block, "aw")
    if body is None:
        return {}
    out = {}
    for part in body.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def parse_block(block):
    h = header_fields(block)
    comp = {
        "id": h.get("id"),
        "name": h.get("e"),
        "season": h.get("s"),
        "edition": int(h["ed"]) if h.get("ed", "").isdigit() else h.get("ed"),
        "format": h.get("fmt"),
        "teams": int(h["t"]) if h.get("t", "").isdigit() else h.get("t"),
        "status": h.get("sts"),
        "champion": None,
    }
    teams, matches = [], []
    n = section(block, "n")
    if n:
        for code, raw_name, player in TEAM_RE.findall(n):
            name = raw_name.strip()
            teams.append({"id": code, "name": name, "player": player or None})
    mbody = section(block, "m")
    if mbody:
        seq = 0
        for raw in mbody.split(";"):
            raw = raw.strip()
            x = MATCH_RE.search(raw)
            if not x:
                continue
            seq += 1
            home, away, hs, a_s, extra, rnd = x.groups()
            item = {
                "id": f"{comp['season']}-{comp['id']}-{seq:03d}",
                "competition": comp["id"],
                "home_team": home,
                "away_team": away,
                "home_score": int(hs),
                "away_score": int(a_s),
                "round": rnd,
                "status": "completed",
            }
            if extra:
                p = re.search(r"p(\d+)-(\d+)", extra)
                if p:
                    item["shootout"] = f"{p.group(1)}-{p.group(2)}"
                y = re.search(r"y(\d+)-(\d+)", extra)
                if y:
                    item["yellow_card_score"] = f"{y.group(1)}-{y.group(2)}"
            matches.append(item)
    awards = parse_awards(block)
    comp["champion"] = awards.get("ch")
    return comp, teams, matches, awards


def main():
    competitions, teams, players, matches, awards = [], {}, {}, [], {}
    season_ids = set()

    for path in sorted(DATA.glob("*.csn")):
        text = path.read_text(encoding="utf-8")
        for block in balanced_blocks(text):
            comp, ts, ms, aw = parse_block(block)
            if not comp["id"] or not comp["name"]:
                continue
            season = comp["season"] or path.stem
            season_ids.add(season)
            competitions.append(comp)
            for t in ts:
                if t["id"] not in teams:
                    teams[t["id"]] = {
                        **t, "season": season, "matches": 0, "wins": 0,
                        "draws": 0, "losses": 0, "goals_for": 0,
                        "goals_against": 0, "title_count": 0, "titles": []
                    }
                if t.get("player"):
                    pid = re.sub(r"[^a-z0-9]+", "-", t["player"].lower()).strip("-")
                    players.setdefault(pid, {"id": pid, "name": t["player"], "team": t["id"], "club": t["name"], "season": season})
            matches.extend(ms)
            awards[comp["id"]] = aw
            if comp["champion"] and comp["champion"] in teams:
                teams[comp["champion"]]["title_count"] += 1
                teams[comp["champion"]]["titles"].append(comp["name"])

    for m in matches:
        h, a = teams.get(m["home_team"]), teams.get(m["away_team"])
        if not h or not a:
            continue
        h["matches"] += 1; a["matches"] += 1
        h["goals_for"] += m["home_score"]; h["goals_against"] += m["away_score"]
        a["goals_for"] += m["away_score"]; a["goals_against"] += m["home_score"]
        if m["home_score"] > m["away_score"]:
            h["wins"] += 1; a["losses"] += 1
        elif m["home_score"] < m["away_score"]:
            a["wins"] += 1; h["losses"] += 1
        else:
            h["draws"] += 1; a["draws"] += 1

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


if __name__ == "__main__":
    main()
