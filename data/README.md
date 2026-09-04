# data/

Canonical CSN archives, grouped by sport, plus sector-specific metadata.

```
data/
├── futsal/
│   ├── manifest.json
│   └── Season_2026A.csn
├── football/
│   ├── manifest.json
│   └── Season_2026A.csn
├── cricket/
│   ├── manifest.json
│   └── Season_2026A.csn
└── sectors/
    ├── sector-1/
    │   ├── manifest.json
    │   └── clubs.json
    └── sector-2/manifest.json
```

`manifest.json` lists the CSN files in that folder. Add a new season by dropping `Season_YYYYX.csn` in the sport folder and appending the filename to that sport's manifest.

`data/sectors/sector-1/clubs.json` is the authoritative Sector 1 club-code registry used to resolve the primary and secondary club codes stored in `player-registry.json`.

Catalog files (`sports.json`, `config.json`, `sectors.json`, `player-registry.json`, `misc.json`) stay at the repository root because the public API advertises them at `/sports.json`, `/config.json`, and so on.
