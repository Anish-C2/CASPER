# CASPER

Static archive for Futsal, Football (4v4) and Cricket.

Live: https://anish-c2.github.io/CASPER/

Dense old-web layout: grey page, white article, left nav, blue links, serif headings, compact tables. Data comes from CSN files.

## Layout

```
CASPER/
├── index.html
├── sports/                 one page per sport
├── sectors/                directory + sector.html?id=
├── join/
├── governance/
├── api/v1/
├── assets/css/wiki.css     only stylesheet
├── assets/casper-core.js   CSN parser
├── assets/js/
│   ├── casper-engine.js    catalog loader
│   ├── chrome.js           left nav + search
│   ├── casper-desktop-site.js  archive views
│   ├── home.js             main page
│   ├── casper-tables.js
│   ├── casper-sport-stats.js
│   ├── boot.js
│   └── sectors.js
├── data/                  CSN + manifests
├── sports.json
├── sectors.json
├── seasons.json
├── config.json
├── misc.json
└── player-registry.json
```

`index.html` stays at the root so GitHub Pages works. Catalog JSON stays at the root because the API advertises those paths.

## Data

1. `sports.json` + `sectors.json` + `seasons.json` describe the catalog.
2. Each sport or sector points at a `manifest.json` of CSN files.
3. `casper-engine.js` loads them; `casper-core.js` parses CSN.
