# CASPER API v1

Public, static JSON API for CASPER Futsal.

## Base URL

```text
https://anish-c2.github.io/CASPER-Futsal/api/v1/
```

All endpoints are static JSON files and can be requested with normal HTTP `GET` requests. No authentication or API key is required.

## Quick start

JavaScript:

```js
const response = await fetch(
  "https://anish-c2.github.io/CASPER-Futsal/api/v1/teams.json"
);

const data = await response.json();
console.log(data.teams);
```

Python:

```python
import requests

url = "https://anish-c2.github.io/CASPER-Futsal/api/v1/teams.json"
data = requests.get(url).json()
print(data["teams"])
```

## Endpoints

| Endpoint | Description |
|---|---|
| [`index.json`](./index.json) | API metadata and endpoint directory |
| [`seasons.json`](./seasons.json) | CASPER seasons |
| [`competitions.json`](./competitions.json) | Competitions and editions |
| [`teams.json`](./teams.json) | Teams and aggregate team statistics |
| [`players.json`](./players.json) | Players associated with teams |
| [`matches.json`](./matches.json) | Recorded matches and scores |
| [`awards.json`](./awards.json) | Competition and seasonal awards |
| [`stats.json`](./stats.json) | Global API statistics |
| [`records.json`](./records.json) | Season records |

## Response formats

### `seasons.json`

```json
{
  "seasons": [
    {
      "id": "2026A",
      "name": "2026A",
      "status": "completed"
    }
  ]
}
```

### `competitions.json`

Each competition contains:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique competition ID |
| `name` | string | Competition name |
| `season` | string | Season ID |
| `edition` | number/null | Edition number |
| `format` | string/null | Competition format, such as `rr`, `ko`, or `rsk` |
| `teams` | number/null | Number of registered teams |
| `status` | string | Competition status |
| `champion` | string/null | Winning team ID when available |

### `teams.json`

The `teams` array contains one object per team.

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable team code used by match records |
| `name` | string | Team/club name |
| `player` | string/null | Player associated with the team |
| `season` | string | Season in which the team record was created |
| `matches` | number | Matches recorded by the generator |
| `wins` | number | Wins |
| `draws` | number | Draws |
| `losses` | number | Losses |
| `goals_for` | number | Goals scored |
| `goals_against` | number | Goals conceded |
| `title_count` | number | Titles detected from competition champion fields |
| `titles` | string[] | Competition names won |

Example:

```json
{
  "teams": [
    {
      "id": "bbu",
      "name": "Black Bird United",
      "player": "Anish",
      "season": "2026A",
      "matches": 0,
      "wins": 0,
      "draws": 0,
      "losses": 0,
      "goals_for": 0,
      "goals_against": 0,
      "title_count": 0,
      "titles": []
    }
  ]
}
```

### `players.json`

Each player object contains:

```json
{
  "id": "player-id",
  "name": "Player Name",
  "team": "team-id",
  "club": "Club Name",
  "season": "2026A"
}
```

Player IDs are generated as lowercase, hyphen-separated names.

### `matches.json`

```json
{
  "count": 1,
  "matches": [
    {
      "id": "2026A-pc26a-001",
      "competition": "pc26a",
      "home_team": "bbu",
      "away_team": "rsa",
      "home_score": 7,
      "away_score": 4,
      "round": "GA",
      "status": "completed"
    }
  ]
}
```

Optional fields may be present for special results, including `shootout` and `yellow_card_score`.

### `awards.json`

Awards are grouped by competition ID:

```json
{
  "competition_awards": {
    "sa26a": {
      "Tsar": "Anish",
      "The Wall": "Anshuman"
    }
  }
}
```

### `stats.json`

Contains aggregate counts:

```json
{
  "matches": 0,
  "competitions": 0,
  "teams": 0,
  "players": 0,
  "goals": 0
}
```

### `records.json`

Contains notable records for a season, including the record label, value, holder, and context.

## IDs and relationships

- `competition` in a match refers to a competition `id`.
- `home_team` and `away_team` in a match refer to team `id` values.
- `champion` refers to the winning team `id` when the source archive provides one.
- `season` refers to the season ID in `seasons.json`.

## Data source

The API is generated automatically from CSN archives in `data/*.csn`. The generator lives at `scripts/generate_api.py`.

When source CSN data or the generator changes, the GitHub Actions workflow regenerates the JSON files under `api/v1`.

## Version

Current API version: **1.0.0**

The API is currently read-only and static. Data changes are published by regenerating and committing the JSON files.
