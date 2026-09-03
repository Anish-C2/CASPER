# CASPER

Static archive site for Futsal, Football (4v4) and Cricket.

Live site: https://anish-c2.github.io/CASPER/

## Folder structure

```
CASPER/
├── index.html                 Hub / multi-sport portal
├── sports/
│   ├── futsal.html
│   ├── football.html
│   └── cricket.html
├── sectors/
│   ├── index.html             Sector directory
│   └── sector.html            Single sector page
├── join/
│   └── index.html             How to Join / Sector Host application
├── sports.json                Sport list and data paths
├── config.json                Labels, theme, player notes
├── misc.json                  Extra archive marks
├── player-registry.json       Players and club ownership
├── sectors.json               Operating-area registry
├── assets/
│   ├── casper-core.js         CSN parser and rankings
│   ├── css/
│   └── js/
├── data/
│   ├── futsal/
│   ├── football/
│   ├── cricket/
│   └── sectors/
└── api/
    └── v1/
```

`index.html` stays at the repo root so GitHub Pages keeps working. Catalog JSON stays at the root because the public API advertises `/sports.json`, `/config.json`, and so on.

Sport, sector, and join pages live one folder down. Each of those pages sets `CASPER_PAGE.root = '../'` so scripts still load JSON and CSN from the repository root.

Nothing on the page is a typed-in score. Tables, news, cabinets and crests are produced from the archive files.
