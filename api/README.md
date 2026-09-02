# CASPER Data API v1

CASPER now exposes a static data API layer for consumers such as CASPER-Exp, dashboards, bots and future apps.

## Canonical source

CSN remains the source of truth. Raw files are available under `data/`, `data/football/` and `data/cricket/`.

## API client

Load the core parser first, then the API client:

```html
<script src="assets/casper-core.js"></script>
<script src="api/v1/casper-api.js"></script>
```

The client exposes:

- `rawCSN(sport, season)` — original CSN text
- `filterCSN(filters)` — filtered CSN blocks
- `parsed(filters)` — parsed tournament objects
- `competitions(filters)`
- `matches(filters)`
- `players(filters)`
- `teams(filters)`
- `awards(filters)`
- `rankings(filters)`
- `all(filters)` — complete data bundle

Supported filters: `sport`, `season`, `competition`, `competitionId`, `player`, `team`, `stage`.

Example:

```js
const matches = await CASPER_API.matches({
  sport: 'football',
  season: '2026A',
  team: 'bbu'
});
```

This is deliberately static-host compatible. Arbitrary HTTP query execution is not claimed: filtered views are computed by the client from the canonical CSN source.
