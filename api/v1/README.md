# CASPER API v1

Public, static JSON API for CASPER Futsal. The API is generated from CASPER CSN archives and includes both source-style records and compact precomputed analytics.

## Base URL

```text
https://anish-c2.github.io/CASPER-Futsal/api/v1/
```

All endpoints are static JSON resources and use normal HTTP `GET` requests. No API key is required.

## Quick start

```js
const data = await fetch(
  "https://anish-c2.github.io/CASPER-Futsal/api/v1/analytics-teams.json"
).then(r => r.json());

console.log(data.rankings);
```

Python:

```python
import requests

data = requests.get(
    "https://anish-c2.github.io/CASPER-Futsal/api/v1/analytics-teams.json"
).json()
print(data["rankings"])
```

## Endpoints

| Endpoint | Description |
|---|---|
| `index.json` | API metadata and endpoint directory |
| `seasons.json` | CASPER seasons |
| `competitions.json` | Competition records |
| `teams.json` | Team records and aggregate statistics |
| `players.json` | Player records |
| `matches.json` | Historical match records |
| `awards.json` | Competition awards |
| `stats.json` | Global archive counts |
| `analytics.json` | Compact analytics overview |
| `analytics-teams.json` | Precomputed team rankings and metrics |
| `analytics-competitions.json` | Precomputed competition metrics |

## Analytics API

Analytics endpoints are intended for dashboards, leaderboards and applications that should **not need to download the complete match archive**.

### `analytics.json`

Returns archive-wide totals plus links to the specialized analytics resources.

```json
{
  "overview": {
    "seasons": 1,
    "competitions": 11,
    "teams": 12,
    "players": 12,
    "matches": 56,
    "goals": 217
  },
  "team_rankings": "./analytics-teams.json",
  "competition_rankings": "./analytics-competitions.json"
}
```

### `analytics-teams.json`

Teams are ranked using the generated analytics score order: win rate first, then goal difference, then titles.

Each ranking contains:

| Field | Description |
|---|---|
| `team` | Team ID |
| `name` | Team name |
| `matches` | Matches counted |
| `wins` | Wins |
| `draws` | Draws |
| `losses` | Losses |
| `win_rate` | Wins divided by matches, from `0` to `1` |
| `goals_for` | Goals scored |
| `goals_against` | Goals conceded |
| `goal_difference` | Goals for minus goals against |
| `titles` | Number of detected competition titles |

Example:

```json
{
  "rankings": [
    {
      "team": "bbu",
      "name": "Black Bird United",
      "matches": 20,
      "wins": 15,
      "draws": 2,
      "losses": 3,
      "win_rate": 0.75,
      "goals_for": 64,
      "goals_against": 31,
      "goal_difference": 33,
      "titles": 3
    }
  ]
}
```

### `analytics-competitions.json`

Each competition contains its season, format, champion, match count and total goals.

```json
{
  "competitions": [
    {
      "id": "competition-id",
      "name": "Competition Name",
      "season": "2026A",
      "format": "rr",
      "champion": "bbu",
      "matches": 12,
      "goals": 61
    }
  ]
}
```

## Core data endpoints

### `teams.json`

Team records include `id`, `name`, `player`, `season`, `matches`, `wins`, `draws`, `losses`, `goals_for`, `goals_against`, `goal_difference`, `win_rate`, `title_count`, and `titles`.

### `players.json`

```json
{
  "id": "player-id",
  "name": "Player Name",
  "team": "team-id",
  "club": "Club Name",
  "season": "2026A"
}
```

### `matches.json`

Match records contain the competition, teams, regulation score, round and completion status. Special results can additionally contain a `shootout` field.

```json
{
  "id": "2026A-competition-001",
  "competition": "competition",
  "home_team": "bbu",
  "away_team": "rsa",
  "home_score": 7,
  "away_score": 4,
  "round": "GA",
  "status": "completed"
}
```

## IDs and relationships

- Match `competition` values refer to competition IDs.
- Match `home_team` and `away_team` values refer to team IDs.
- Competition `champion` values refer to team IDs when available.
- `season` values refer to IDs in `seasons.json`.

## Static-query pattern

GitHub Pages cannot execute server-side query parameters. Instead, CASPER publishes purpose-built static resources for common queries and analytics.

For example:

```text
/analytics-teams.json
/analytics-competitions.json
```

are cheaper for a client to consume than downloading and processing the complete historical match dataset.

## Data pipeline

```text
CSN archives in data/*.csn
          ↓
 scripts/generate_api.py
          ↓
     api/v1/*.json
          ↓
       GitHub Pages
```

The generator automatically processes every `.csn` archive in `data/`. The GitHub Actions workflow regenerates the API whenever CSN data or the generator changes.

## Version

**CASPER API v1.0.0**

The API is currently public, read-only and static. Analytics are precomputed during generation.
