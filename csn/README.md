# CSN 2.0

**CASPER Sports Network Format**

CSN 2.0 is the canonical data model and interchange format for CASPER. It is designed to represent multiple sports, sectors, seasons, competitions, teams, players, matches, events, standings, awards and derived statistics without making the CASPER application responsible for guessing the structure of an archive.

## Design principles

- Human-readable and Git-friendly.
- Strong, explicit metadata and types.
- One common core for every sport.
- Sport-specific extensions where the rules genuinely differ.
- First-class sectors and seasons.
- First-class competitions rather than treating every competition as a generic tournament.
- Stable IDs and references instead of repeating entities.
- Forward-compatible schema evolution.
- Raw events remain authoritative; standings/statistics can be derived from them.
- The format may be serialized or converted to analytical formats such as Parquet without changing the CSN data model.

## Document hierarchy

```text
CSN document
└── dataset(s)
    ├── sport(s)
    ├── sector(s)
    ├── season(s)
    ├── people
    ├── teams
    ├── competitions
    ├── matches
    ├── events
    ├── standings
    ├── awards
    └── records / statistics
```

A CSN document may contain one dataset or a collection of datasets. A dataset is identified by the tuple:

```text
sport + sector + season
```

A collection can therefore contain Football, Futsal and Cricket data, including data from different sectors, without requiring separate parsers or formats.

## Versioning

The current specification is **CSN 2.0 draft**. Existing CSN 1.x archives remain legacy-compatible and should be migrated rather than silently reinterpreted.
