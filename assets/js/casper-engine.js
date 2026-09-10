/* CASPER Data Engine 2.0
   Unlimited sectors. Unlimited seasons.
   Catalog-driven load: sports.json + sectors.json + optional seasons.json
   + per-sport manifests + per-sector manifests/clubs. */
(function (root) {
  'use strict';
  var VERSION = '20260910engine';

  function fetchJson(url, fallback) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : fallback; }).catch(function () { return fallback; });
  }
  function fetchText(url) {
    return fetch(url).then(function (r) { return r.ok ? r.text() : ''; }).catch(function () { return ''; });
  }

  function seasonIdFromName(name) {
    var s = String(name || '');
    var m = s.match(/Season[_-]?([A-Za-z0-9]+)/i) || s.match(/([0-9]{4}[A-Za-z]?)/);
    if (m) return m[1];
    s = s.replace(/\.csn$/i, '').replace(/^.*\//, '');
    return s || null;
  }

  function sportOfPath(path) {
    var p = String(path || '').toLowerCase();
    if (p.indexOf('/futsal/') >= 0 || /(^|\/)futsal([\/._-]|$)/.test(p)) return 'futsal';
    if (p.indexOf('/football/') >= 0 || /(^|\/)football([\/._-]|$)/.test(p)) return 'football';
    if (p.indexOf('/cricket/') >= 0 || /(^|\/)cricket([\/._-]|$)/.test(p)) return 'cricket';
    return '';
  }

  function normalizeManifest(raw) {
    var out = { files: [], seasons: [], leagues: [], competitions: [], sources: {}, meta: raw && !Array.isArray(raw) ? raw : {} };
    if (raw == null) return out;
    function pushFile(f) {
      if (!f) return;
      if (typeof f === 'string') out.files.push(f);
      else if (f.file || f.path) out.files.push(f.file || f.path);
    }
    if (Array.isArray(raw)) {
      raw.forEach(pushFile);
    } else {
      (raw.files || raw.archives || []).forEach(pushFile);
      (raw.seasons || []).forEach(function (s) {
        if (typeof s === 'string') {
          if (/\.csn$/i.test(s)) { pushFile(s); out.seasons.push(seasonIdFromName(s)); }
          else out.seasons.push(s);
        } else if (s && s.id) {
          out.seasons.push(s.id);
          if (s.file) pushFile(s.file);
        }
      });
      out.leagues = raw.leagues || [];
      out.competitions = raw.competitions || [];
      out.sources = raw.sources || {};
      Object.keys(out.sources).forEach(function (k) {
        var v = out.sources[k];
        if (typeof v === 'string') pushFile(v);
        else if (Array.isArray(v)) v.forEach(pushFile);
      });
    }
    var seen = {};
    out.files = out.files.filter(function (f) {
      var k = String(f).replace(/\\/g, '/');
      if (!k || seen[k]) return false;
      seen[k] = 1;
      return true;
    });
    return out;
  }

  function resolveFile(baseDir, file) {
    file = String(file || '').replace(/\\/g, '/');
    if (!file) return '';
    if (/^https?:/i.test(file) || /^data\//.test(file)) return file;
    if (file.indexOf('../') === 0 || (baseDir && file.indexOf('../') >= 0)) {
      var parts = String(baseDir || '').split('/').concat(file.split('/'));
      var acc = [];
      parts.forEach(function (p) {
        if (!p || p === '.') return;
        if (p === '..') acc.pop();
        else acc.push(p);
      });
      return acc.join('/');
    }
    return (baseDir ? String(baseDir).replace(/\/$/, '') + '/' : '') + file.replace(/^\//, '');
  }

  function addSeason(state, id, extra) {
    if (!id || /\.csn$/i.test(id) && !seasonIdFromName(id)) return;
    if (/\.csn$/i.test(String(id))) id = seasonIdFromName(id);
    if (!id) return;
    if (!state.seasonsIndex) state.seasonsIndex = {};
    if (!state.seasonsIndex[id]) state.seasonsIndex[id] = { id: id, name: id, files: [], sports: [], sectors: [], status: 'active' };
    var rec = state.seasonsIndex[id];
    if (!extra) return;
    if (extra.file && rec.files.indexOf(extra.file) < 0) rec.files.push(extra.file);
    if (extra.sport && rec.sports.indexOf(extra.sport) < 0) rec.sports.push(extra.sport);
    if (extra.sector && rec.sectors.indexOf(extra.sector) < 0) rec.sectors.push(extra.sector);
    if (extra.status) rec.status = extra.status;
    if (extra.name) rec.name = extra.name;
    if (extra.started) rec.started = extra.started;
    if (extra.completed) rec.completed = extra.completed;
    if (extra.notes) rec.notes = extra.notes;
  }

  function clubMap(data) {
    if (!data) return {};
    if (data.clubs && typeof data.clubs === 'object' && !Array.isArray(data.clubs)) return data.clubs;
    return data;
  }

  function ownerMap(registry) {
    var owners = {};
    Object.keys(registry || {}).forEach(function (k) {
      if (String(k).charAt(0) === '_') return;
      var info = registry[k] || {}, name = info.name || k;
      (info.clubs || []).forEach(function (code, idx) {
        var key = String(code || '').toLowerCase();
        if (key && (!owners[key] || idx === 0)) owners[key] = name;
      });
    });
    return owners;
  }

  function findTeamKey(teams, code) {
    if (!teams) return null;
    if (teams[code]) return code;
    var low = String(code || '').toLowerCase(), keys = Object.keys(teams);
    for (var i = 0; i < keys.length; i++) if (String(keys[i]).toLowerCase() === low) return keys[i];
    return null;
  }

  function emptyRegisteredTeam(code, name, owner) {
    return { abbr: code, name: name || code, player: owner || '', matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0, titles: 0, runnerUps: 0, thirds: 0, cleanSheets: 0, biggestWin: 0, trophies: [], form: [], runsFor: 0, runsAg: 0, wktsLost: 0, wktsTook: 0, ballsFaced: 0, ballsBowled: 0, sportPts: 0, registered: true };
  }

  function applyClubRegistry(state) {
    var clubs = Object.assign({}, state.clubRegistry || {});
    var owners = ownerMap(state.registry);
    Object.keys(owners).forEach(function (code) { if (!clubs[code]) clubs[code] = String(code).toUpperCase(); });
    state.clubRegistry = clubs;
    Object.keys(state.sports || {}).forEach(function (sportId) {
      var sport = state.sports[sportId]; if (!sport) return; if (!sport.teams) sport.teams = {};
      function stamp(entry, code) {
        if (!entry) return;
        var key = String(code || '').toLowerCase();
        if (clubs[key]) entry.name = clubs[key];
        else if (clubs[code]) entry.name = clubs[code];
        if (owners[key]) entry.player = owners[key];
      }
      Object.keys(clubs).forEach(function (code) {
        var existing = findTeamKey(sport.teams, code);
        if (existing) { stamp(sport.teams[existing], existing); return; }
        sport.teams[code] = emptyRegisteredTeam(code, clubs[code], owners[String(code).toLowerCase()]);
      });
      Object.keys(sport.teams).forEach(function (code) { stamp(sport.teams[code], code); });
      (sport.tournaments || []).forEach(function (t) { Object.keys(t.n || {}).forEach(function (code) { stamp(t.n[code], code); }); });
      (sport.matches || []).forEach(function (m) { Object.keys(m.names || {}).forEach(function (code) { stamp(m.names[code], code); }); });
    });
  }

  function parseFiles(files, parseFn) {
    var toursBySport = {};
    var chain = Promise.resolve();
    (files || []).forEach(function (item) {
      chain = chain.then(function () {
        return fetchText(item.url).then(function (text) {
          if (!text || !parseFn) return;
          var parsed = parseFn(text) || [];
          var sport = item.sport || sportOfPath(item.path) || '';
          parsed.forEach(function (t) {
            t.__sourcePath = item.path;
            if (sport) t.__sourceSport = sport;
            if (item.sector) {
              t.__sector = item.sector;
              t.__sectors = t.__sectors || [];
              if (t.__sectors.indexOf(item.sector) < 0) t.__sectors.push(item.sector);
            }
            if (!t.meta) t.meta = {};
            if (!t.meta.s && item.season) t.meta.s = item.season;
            if (!sport && t.__sourceSport) sport = t.__sourceSport;
          });
          var bucket = sport || '_unknown';
          if (!toursBySport[bucket]) toursBySport[bucket] = [];
          toursBySport[bucket] = toursBySport[bucket].concat(parsed);
        });
      });
    });
    return chain.then(function () { return toursBySport; });
  }

  function loadAll(pageRoot, state) {
    pageRoot = pageRoot || '';
    var v = '?v=' + VERSION;
    state = state || (typeof STATE !== 'undefined' ? STATE : {});
    if (!state.sports) state.sports = {};
    return Promise.all([
      fetchJson(pageRoot + 'config.json' + v, {}),
      fetchJson(pageRoot + 'sports.json' + v, { sports: [] }),
      fetchJson(pageRoot + 'misc.json' + v, {}),
      fetchJson(pageRoot + 'player-registry.json' + v, {}),
      fetchJson(pageRoot + 'sectors.json' + v, { sectors: [] }),
      fetchJson(pageRoot + 'seasons.json' + v, { seasons: [] })
    ]).then(function (pack) {
      state.config = pack[0] || {};
      state.sportsCfg = pack[1] || { sports: [] };
      state.misc = pack[2] || {};
      state.registry = Object.assign({}, pack[3] || {}, state.config.playerRegistry || {});
      state.sectorRegistry = pack[4] || { sectors: [] };
      state.seasonCatalog = pack[5] || { seasons: [] };
      state.clubRegistry = {};
      state.sectorClubs = {};
      state.sectorManifests = {};
      state.seasonsIndex = {};
      state.archiveFiles = [];

      (state.seasonCatalog.seasons || []).forEach(function (s) {
        if (!s) return;
        if (typeof s === 'string') addSeason(state, s);
        else addSeason(state, s.id, s);
      });
      if (state.config.defaultSeason) addSeason(state, state.config.defaultSeason);

      var jobs = [];
      (state.sportsCfg.sports || []).forEach(function (cfg) {
        var manUrl = pageRoot + (cfg.manifest || ((cfg.dataDir || ('data/' + cfg.id)) + '/manifest.json')) + v;
        jobs.push(fetchJson(manUrl, []).then(function (raw) {
          normalizeManifest(raw).files.forEach(function (f) {
            var path = resolveFile(cfg.dataDir || ('data/' + cfg.id), f);
            var season = seasonIdFromName(f) || seasonIdFromName(path);
            addSeason(state, season, { file: path, sport: cfg.id });
            state.archiveFiles.push({ path: path, url: pageRoot + path + v, sport: cfg.id, season: season, sector: null });
          });
        }));
      });

      ((state.sectorRegistry && state.sectorRegistry.sectors) || []).forEach(function (sec) {
        var id = sec && sec.id;
        if (!id) return;
        var dataRoot = (sec.archive && sec.archive.dataRoot) || ('data/sectors/' + id);
        var manPath = (sec.archive && sec.archive.manifest) || (dataRoot + '/manifest.json');
        var clubsPath = (sec.archive && sec.archive.clubs) || (dataRoot + '/clubs.json');
        jobs.push(fetchJson(pageRoot + manPath + v, {}).then(function (raw) {
          var man = normalizeManifest(raw);
          state.sectorManifests[id] = man;
          (sec.seasons || man.seasons || []).forEach(function (s) {
            addSeason(state, typeof s === 'string' ? s : s && s.id, { sector: id });
          });
          man.files.forEach(function (f) {
            var path = resolveFile(dataRoot, f);
            var sport = sportOfPath(path) || sportOfPath(f) || ((sec.sports || [])[0]) || '';
            var season = seasonIdFromName(f) || seasonIdFromName(path);
            addSeason(state, season, { file: path, sport: sport, sector: id });
            state.archiveFiles.push({ path: path, url: pageRoot + path + v, sport: sport, season: season, sector: id });
          });
        }));
        jobs.push(fetchJson(pageRoot + clubsPath + v, { clubs: {} }).then(function (data) {
          var clubs = clubMap(data) || {};
          state.sectorClubs[id] = clubs;
          Object.keys(clubs).forEach(function (code) {
            if (!state.clubRegistry[code]) state.clubRegistry[code] = clubs[code];
          });
        }));
      });

      return Promise.all(jobs).then(function () {
        var seen = {};
        state.archiveFiles = state.archiveFiles.filter(function (f) {
          if (!f.path || seen[f.path]) return false;
          seen[f.path] = 1;
          return true;
        });
        return parseFiles(state.archiveFiles, typeof parseCSN === 'function' ? parseCSN : null);
      }).then(function (bySport) {
        (state.sportsCfg.sports || []).forEach(function (cfg) {
          var tours = bySport[cfg.id] || [];
          state.sports[cfg.id] = typeof buildSport === 'function' ? buildSport(cfg, tours) : { cfg: cfg, tournaments: tours, matches: [], players: {}, teams: {}, ranked: [] };
          tours.forEach(function (t) { addSeason(state, t.meta && t.meta.s, { sport: cfg.id, sector: t.__sector }); });
        });
        Object.keys(bySport).forEach(function (id) {
          if (id === '_unknown' || state.sports[id]) return;
          var cfg = { id: id, name: id, scoring: id === 'cricket' ? 'cricket' : 'goals', winPts: 3, drawPts: 1 };
          state.sports[id] = typeof buildSport === 'function' ? buildSport(cfg, bySport[id]) : { cfg: cfg, tournaments: bySport[id], matches: [], players: {}, teams: {}, ranked: [] };
        });
        applyClubRegistry(state);
        state.seasons = Object.keys(state.seasonsIndex).sort();
        state.ready = true;
        return state;
      });
    });
  }

  root.CASPER_ENGINE = {
    version: '2.0',
    VERSION: VERSION,
    loadAll: loadAll,
    normalizeManifest: normalizeManifest,
    seasonIdFromName: seasonIdFromName,
    sportOfPath: sportOfPath,
    resolveFile: resolveFile,
    applyClubRegistry: applyClubRegistry,
    listSectors: function (state) { return (((state || root.STATE || {}).sectorRegistry) || {}).sectors || []; },
    listSeasons: function (state) {
      state = state || root.STATE || {};
      return state.seasons || Object.keys(state.seasonsIndex || {});
    }
  };
})(window);
