# CASPER

Static archive site for Futsal, Football (4v4) and Cricket.

Live site: https://anish-c2.github.io/CASPER/

The public pages use a classic Wikipedia-style layout (Vector 2010): left sidebar, serif headings, blue links, infoboxes and wikitables. Scores and tables still come from CSN files, not typed-in copy.

## Layout

```
CASPER/
├── index.html                 Main page
├── sports/                    One page per sport
├── sectors/                   Sector directory + sector.html?id=
├── join/                      How to join
├── governance/                Laws and governance
├── api/v1/                    Public static data client
├── assets/
│   ├── css/wiki.css           Only stylesheet
│   └── js/
│       ├── core.js            CSN parser + STATE + rankings
│       ├── engine.js          Catalog / manifest loader
│       ├── chrome.js          Sidebar, search, tabs
│       ├── app.js             Archive views (players, clubs, comps…)
│       ├── home.js            Main-page article
│       ├── tables.js          League tables
│       ├── boot.js            Load data, then render
│       ├── sectors.js         Sector directory
│       └── sector-page.js     One sector archive
├── data/                      CSN files + manifests
├── sports.json
├── sectors.json
├── seasons.json
├── config.json
├── misc.json
└── player-registry.json
```

`index.html` stays at the repo root so GitHub Pages keeps working. Catalog JSON stays at the root because the public API advertises those paths.

Sport, sector, join, governance and API pages live one folder down. Each sets `CASPER_PAGE.root = '../'` so scripts still load JSON and CSN from the repository root.

## Data pipeline

1. `sports.json` + `sectors.json` + `seasons.json` describe the catalog.
2. Each sport or sector points at a `manifest.json` of CSN files.
3. `assets/js/engine.js` resolves those files and `assets/js/core.js` parses CSN.
4. Sport pages load the engine. The public API (`api/v1/casper-api.js`) reads the same catalogs.

## API client

```html
<script src="assets/js/core.js"></script>
<script src="api/v1/casper-api.js"></script>
```
