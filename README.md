# CASPER

Static archive site for Futsal, Football (4v4) and Cricket.

## Layout

- `index.html` — multi-sport portal
- `futsal.html` / `football.html` / `cricket.html` — sport desks
- `assets/css/casper.css` — portal theme
- `assets/js/casper-marks.js` — generated crests and jerseys
- `assets/js/casper-core.js` — CSN parser and rankings
- `assets/js/casper-ui.js` — pages
- `sports.json` — sport list, data paths, crown events
- `config.json` — labels and player notes
- `data/` — futsal CSN + `manifest.json`
- `data/football/` — football CSN
- `data/cricket/` — cricket CSN

Nothing on the page is a typed-in score. Tables, news, cabinets and crests are produced from those files.
