# CASPER

Static archive site for Futsal, Football (4v4) and Cricket.

Live site: https://anish-c2.github.io/CASPER/

## Folder structure

```
CASPER/
├── index.html              Hub / multi-sport portal
├── futsal.html             Sport desks
├── football.html
├── cricket.html
├── sectors.html            Sector directory
├── sector.html             Single sector page
├── sports.json             Sport list and data paths
├── config.json             Labels, theme, player notes
├── misc.json               Extra archive marks
├── player-registry.json    Players and club ownership
├── sectors.json            Operating-area registry
├── assets/
│   ├── css/                Active stylesheets
│   └── js/                 Active site scripts
├── data/
│   ├── futsal/             CSN seasons + manifest
│   ├── football/
│   ├── cricket/
│   └── sectors/            Per-sector manifests
└── api/
    └── v1/                 Static data API client
```

Pages and catalog JSON stay at the repo root so GitHub Pages and the public API URLs keep working.

## What lives where

- `assets/css/` — portal and desktop theme
- `assets/js/casper-core.js` — CSN parser and rankings
- `assets/js/casper-ui.js` — shared UI helpers
- `assets/js/casper-desktop-site.js` + `casper-desktop-boot.js` — desktop archive
- `assets/js/casper-sectors.js` — sector directory
- `data/<sport>/` — one folder per sport; each has `manifest.json` and `Season_*.csn`
- `api/v1/` — static API client over the same CSN files

Nothing on the page is a typed-in score. Tables, news, cabinets and crests are produced from those files.
