# CSN 2.0 Specification

## 1. Document model

A CSN 2.0 document consists of one or more bracketed datasets:

```text
CSN 2.0
[
  ...dataset...
]
[
  ...another dataset...
]
```

A dataset is the authoritative record for one `sport + sector + season` context. A collection may contain many such datasets.

### Required dataset metadata

```text
id=...
sport=football
sector=s1
season=2026A
```

Canonical names are `sport`, `sector`, and `season`. Legacy aliases may be accepted by readers during migration, but writers should emit the canonical names.

### Optional metadata

```text
name=...
org=CASPER
status=Completed
version=2.0
format=...
venue=...
start=...
end=...
```

Unknown metadata keys must be preserved by readers so future CSN versions can add fields without destroying information.

## 2. Multi-sport support

`sport` identifies the ruleset used by the dataset. A collection can contain any number of sports:

```text
[
id=fb-s1-2026a
sport=football
sector=s1
season=2026A
...
]

[
id=fs-s1-2026a
sport=futsal
sector=s1
season=2026A
...
]

[
id=cr-s2-2026a
sport=cricket
sector=s2
season=2026A
...
]
```

The core entities (`player`, `team`, `competition`, `match`, `award`) are shared. Sport-specific match/event fields live in extensions rather than forcing football concepts onto cricket.

A future collection-level header may declare all included sports, but a dataset's `sport` remains authoritative.

## 3. Sector support

`sector` identifies the CASPER sector to which a dataset belongs:

```text
sector=s1
```

Sector IDs are opaque identifiers. `s1` means Sector 1 by CASPER convention; the format does not require sectors to be numeric.

A dataset may be explicitly global:

```text
sector=global
```

Cross-sector competitions should use an explicit scope rather than pretending they belong to one sector:

```text
scope=cross-sector
sectors=s1,s2,s3
```

## 4. Seasons

`season` identifies the playing period and is separate from the competition. A season can contain many competitions:

```text
season=2026A
```

A competition must reference its season context and may additionally specify dates or phases.

## 5. Competition model

Competitions are first-class records. The canonical competition metadata is:

```text
competition(
  id=...
  name=...
  type=league|cup|tournament|supercup|special
  format=round_robin|knockout|groups_then_knockout|series|custom
)
```

The exact compact syntax may evolve, but the semantic distinction is mandatory:

- **league** — standings and scheduled league fixtures are primary.
- **cup** — elimination/bracket structure is primary.
- **tournament** — groups, stages, or mixed structures.
- **supercup** — usually a single or short champion-vs-champion event.
- **special** — awards, exhibitions, or formats that do not fit the normal competition types.

A competition is not a season, and a season is not a competition.

## 6. Stable entities

Entities should be defined once and referenced by stable IDs.

```text
players
teams
competitions
matches
```

For example:

```text
team_id=bbu
player_id=p014
competition_id=pl26a
match_id=m0007
```

Display names are metadata and may change; IDs should not be casually reused.

## 7. Matches and events

A match references teams and its competition:

```text
match(
  id=m0007
  competition=pl26a
  home=bbu
  away=ssc
  status=completed
)
```

The match result is only the summary. Detailed actions belong in events.

```text
event(
  id=e00031
  match=m0007
  type=goal
  player=p014
  minute=37
)
```

Sport extensions may add fields such as cricket deliveries, football assists, futsal cards, etc.

## 8. Raw vs derived data

CSN distinguishes authoritative raw data from values calculated from it.

```text
raw events
    ↓
match results
    ↓
standings / player statistics / rankings
```

Derived data may be stored for performance, but consumers must be able to identify it as derived and, where practical, reproduce it from authoritative data.

Suggested metadata:

```text
source=derived
from=events
algorithm=casper-statistics-1
```

## 9. Column-oriented design principles

CSN remains human-readable, but its logical model should be column-friendly. Repeated entities should be normalized into records and referenced by IDs instead of embedding the same team/player object inside every match.

Conceptually:

```text
TEAMS       PLAYERS       MATCHES       EVENTS
team_id     player_id     match_id      event_id
name        name          competition   match_id
sector      team          home          type
...         ...           away          player
                            ...          ...
```

This allows a CSN dataset to be converted efficiently into columnar storage such as Parquet for large statistical queries.

## 10. Compatibility

CSN 2.0 readers should initially support CSN 1.x archives through a migration/normalization layer. The migration layer maps legacy fields such as:

```text
s   → season
prd → sector (where `prd` is being used as the sector marker)
e   → competition name (legacy)
```

No legacy field should be discarded until its meaning has been confirmed.

## 11. Validation goals

A valid CSN 2.0 implementation should be able to validate:

- required dataset metadata;
- unique IDs within their entity namespace;
- valid sport and sector references;
- valid competition references from matches;
- valid team/player references;
- legal competition formats;
- stage references;
- duplicate match/event IDs;
- whether derived statistics declare their source.
