/* CASPER home — dense sports almanac front page. */
(function () {
  'use strict';
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function sportsCfg() { return ((typeof STATE !== 'undefined' && STATE.sportsCfg && STATE.sportsCfg.sports) || []); }
  function sportOf(id) { return (STATE.sports && STATE.sports[id]) || { matches: [], tournaments: [], players: {}, teams: {} }; }
  function isSeasonal(t) { return t && t.meta && (t.meta.e === 'Seasonal Awards' || t.meta.typ === 'seasonal'); }
  function pageOf(cfg) { return (cfg && cfg.page) || ('sports/' + cfg.id + '.html'); }
  function namesOf(m) {
    return { hn: m.names && m.names[m.home] ? m.names[m.home].name : m.home, an: m.names && m.names[m.away] ? m.names[m.away].name : m.away };
  }
  function scoreOf(m) {
    if (!m) return '\u2014';
    if (m.kind === 'cricket') return m.sh + '/' + m.hw + ' \u2013 ' + m.sa + '/' + m.aw;
    return m.sh + '\u2013' + m.sa + (m.p ? ' (p ' + m.p[0] + '\u2013' + m.p[1] + ')' : '');
  }
  function allMatches() {
    var out = [];
    sportsCfg().forEach(function (c) { (sportOf(c.id).matches || []).forEach(function (m) { out.push({ cfg: c, m: m }); }); });
    return out;
  }
  function facts() {
    var f = { players: 0, clubs: 0, matches: 0, comps: 0, goals: 0, cleanSheets: 0, draws: 0, decisive: 0 }, people = {}, clubs = {};
    sportsCfg().forEach(function (c) {
      var s = sportOf(c.id);
      f.matches += (s.matches || []).length;
      f.comps += (s.tournaments || []).filter(function (t) { return !isSeasonal(t); }).length;
      Object.values(s.players || {}).forEach(function (p) { if (p && p.name) people[String(p.name).toLowerCase()] = 1; });
      Object.values(s.teams || {}).forEach(function (t) { if (t && (t.abbr || t.name)) clubs[String(t.abbr || t.name).toLowerCase()] = 1; });
    });
    allMatches().forEach(function (x) {
      var m = x.m;
      if (m.kind !== 'cricket') f.goals += (Number(m.sh) || 0) + (Number(m.sa) || 0);
      if (m.sh === m.sa) f.draws++; else f.decisive++;
    });
    Object.keys(STATE.registry || {}).forEach(function (k) {
      if (String(k).charAt(0) === '_') return;
      people[String((STATE.registry[k] && STATE.registry[k].name) || k).toLowerCase()] = 1;
    });
    sportsCfg().forEach(function (c) {
      Object.values(sportOf(c.id).teams || {}).forEach(function (t) { f.cleanSheets += Number(t.cleanSheets) || 0; });
    });
    f.players = Object.keys(people).length; f.clubs = Object.keys(clubs).length;
    return f;
  }
  function allPlayers() {
    var out = {};
    sportsCfg().forEach(function (c) {
      Object.values(sportOf(c.id).players || {}).forEach(function (p) {
        if (!p || !p.name) return;
        var k = String(p.name).toLowerCase();
        if (!out[k]) out[k] = { name: p.name, matches: 0, goals: 0, assists: 0, runs: 0, titles: 0, hatTricks: 0, conceded: 0, teams: new Set(), sports: new Set() };
        var x = out[k];
        x.matches += Number(p.matches) || 0;
        x.goals += Number(p.goals) || 0;
        x.assists += Number(p.assists) || 0;
        x.runs += Number(p.runs) || (c.scoring === 'cricket' ? Number(p.goals) || 0 : 0);
        x.titles += Number(p.titles) || 0;
        x.hatTricks += Number(p.hatTricks) || 0;
        x.conceded += Number(p.conceded) || 0;
        x.sports.add(c.name);
        (p.teams instanceof Set ? Array.from(p.teams) : (p.teams || [])).forEach(function (t) { x.teams.add(t); });
      });
    });
    return Object.values(out);
  }
  function topScorers() {
    return allPlayers().filter(function (p) { return p.goals > 0; }).sort(function (a, b) { return b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name); }).slice(0, 7);
  }
  function topAssists() {
    return allPlayers().filter(function (p) { return p.assists > 0; }).sort(function (a, b) { return b.assists - a.assists || b.goals - a.goals; }).slice(0, 5);
  }
  function topTeams() {
    var out = [];
    sportsCfg().forEach(function (c) {
      Object.values(sportOf(c.id).teams || {}).forEach(function (t) {
        if (!t || !t.matches) return;
        out.push({ cfg: c, team: t });
      });
    });
    return out.sort(function (a, b) { return (b.team.pts || 0) - (a.team.pts || 0) || (b.team.wins || 0) - (a.team.wins || 0); }).slice(0, 8);
  }
  function recentMatches() { return allMatches().slice(-10).reverse(); }
  function newsItems() {
    var items = [];
    sportsCfg().forEach(function (c) {
      var s = sportOf(c.id);
      (s.tournaments || []).filter(function (t) { return !isSeasonal(t); }).slice(-3).reverse().forEach(function (t) {
        var ch = t.aw && (t.aw.ch || t.aw.champion || t.aw.winner);
        if (ch) items.push({ tag: 'TITLE', text: c.name + ' — ' + (t.meta && (t.meta.name || t.meta.id) || 'Competition') + ' crowned ' + ch });
      });
    });
    recentMatches().slice(0, 5).forEach(function (x) {
      var n = namesOf(x.m);
      items.push({ tag: x.cfg.name.toUpperCase(), text: n.hn + ' ' + scoreOf(x.m) + ' ' + n.an });
    });
    return items.slice(0, 10);
  }
  function statStrip(f) {
    return '<div class="desktop-stats home-stat-strip">' +
      '<div class="desktop-stat"><b>' + f.matches + '</b><span>Matches logged</span></div>' +
      '<div class="desktop-stat"><b>' + f.comps + '</b><span>Competitions</span></div>' +
      '<div class="desktop-stat"><b>' + f.players + '</b><span>Players</span></div>' +
      '<div class="desktop-stat"><b>' + f.clubs + '</b><span>Clubs</span></div>' +
      '<div class="desktop-stat"><b>' + f.goals + '</b><span>Goals logged</span></div>' +
      '<div class="desktop-stat"><b>' + f.cleanSheets + '</b><span>Clean sheets</span></div>' +
      '<div class="desktop-stat"><b>' + f.draws + '</b><span>Draws</span></div>' +
      '</div>';
  }
  function sportCards() {
    return '<div class="desktop-grid3">' + sportsCfg().map(function (c) {
      var s = sportOf(c.id), ms = s.matches || [], ts = (s.tournaments || []).filter(function (t) { return !isSeasonal(t); }), ps = Object.values(s.players || {}), teams = Object.values(s.teams || {});
      var goals = ms.filter(function (m) { return m.kind !== 'cricket'; }).reduce(function (n, m) { return n + (+m.sh || 0) + (+m.sa || 0); }, 0);
      return '<div class="desktop-card sport-card"><div class="desktop-kicker">' + esc(c.id) + '</div><h3>' + esc(c.name) + '</h3>' +
        '<div class="desktop-row"><span>Matches</span><b>' + ms.length + '</b></div>' +
        '<div class="desktop-row"><span>Competitions</span><b>' + ts.length + '</b></div>' +
        '<div class="desktop-row"><span>Clubs</span><b>' + teams.length + '</b></div>' +
        '<div class="desktop-row"><span>Players</span><b>' + ps.length + '</b></div>' +
        '<div class="desktop-row"><span>' + (c.scoring === 'cricket' ? 'Runs' : 'Goals') + ' logged</span><b>' + (c.scoring === 'cricket' ? ms.reduce(function (n,m){ return n + (+m.sh || 0) + (+m.sa || 0); },0) : goals) + '</b></div>' +
        '<div class="desktop-actions"><a href="' + esc(pageOf(c)) + '">Open ' + esc(c.name) + ' →</a></div></div>';
    }).join('') + '</div>';
  }
  function resultTable() {
    var rows = recentMatches().map(function (x) {
      var n = namesOf(x.m), stage = x.m.stageLabel || x.m.stage || '', event = x.m.event || x.m.competition || '';
      return '<tr><td><b>' + esc(x.cfg.name) + '</b></td><td>' + esc(event || 'Archive') + '</td><td>' + esc(n.hn) + '<br><span class="desktop-muted">vs ' + esc(n.an) + '</span></td><td><b>' + esc(scoreOf(x.m)) + '</b></td><td>' + esc(stage || '\u2014') + '</td></tr>';
    }).join('');
    return '<table class="wikitable home-results"><thead><tr><th>Sport</th><th>Competition</th><th>Fixture</th><th>Result</th><th>Stage</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">No results loaded.</td></tr>') + '</tbody></table>';
  }
  function leaderTable() {
    var rows = topScorers().map(function (p, i) {
      return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(p.name) + '</b></td><td>' + p.goals + '</td><td>' + p.assists + '</td><td>' + p.matches + '</td><td>' + Array.from(p.sports).join(', ') + '</td></tr>';
    }).join('');
    return '<table class="wikitable"><thead><tr><th>#</th><th>Player</th><th>G</th><th>A</th><th>MP</th><th>Sport</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6">No scoring leaders yet.</td></tr>') + '</tbody></table>';
  }
  function teamTable() {
    var rows = topTeams().map(function (x, i) {
      var t = x.team;
      return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(t.name || t.abbr) + '</b><br><span class="desktop-muted">' + esc(x.cfg.name) + '</span></td><td>' + (t.matches || 0) + '</td><td>' + (t.wins || 0) + '</td><td>' + (t.draws || 0) + '</td><td>' + (t.losses || 0) + '</td><td>' + (t.gf || 0) + '–' + (t.ga || 0) + '</td><td><b>' + (t.pts || 0) + '</b></td></tr>';
    }).join('');
    return '<table class="wikitable"><thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>' + (rows || '<tr><td colspan="8">No table data loaded.</td></tr>') + '</tbody></table>';
  }
  function bulletin() {
    var items = newsItems();
    return '<div class="bulletin-grid">' + items.map(function (x, i) {
      return '<div class="bulletin-item"><span>' + esc(x.tag || ('0' + (i + 1)).slice(-2)) + '</span><p>' + esc(x.text) + '</p></div>';
    }).join('') + '</div>';
  }
  function html() {
    var f = facts(), players = allPlayers(), scorers = topScorers(), assists = topAssists();
    var seasons = Object.keys(STATE.seasonsIndex || {}).length;
    var sectorsN = (((STATE.sectorRegistry || {}).sectors) || []).length;
    var names = sportsCfg().map(function (c) { return c.name; });
    var assistLine = assists.length ? '<b>' + esc(assists[0].name) + '</b> leads assists with <b>' + assists[0].assists + '</b>.' : 'Assist data is building as the archive grows.';
    var scoreLine = scorers.length ? '<b>' + esc(scorers[0].name) + '</b> leads the scoring chart with <b>' + scorers[0].goals + '</b>.' : 'Scoring leaders will appear here as match data is added.';
    return '<div class="desktop-page home-page">' +
      '<div class="desktop-hero home-hero"><div class="desktop-kicker">CASPER / LIVE ARCHIVE LEDGER</div><h2>Competitive Athletics &amp; Sports Promotion</h2>' +
      '<p>A packed statistical desk for ' + esc(names.join(', ') || 'CASPER') + '. Results, competitions, clubs, players, records and seasons are assembled directly from the CASPER archive.</p>' +
      '<div class="desktop-actions"><a href="#statistics">Statistics</a> <a href="#results">Latest results</a> <a href="#players">Player index</a> <a href="#archive">Archive</a></div></div>' +
      statStrip(f) +
      '<div class="desktop-grid3 home-mini-grid">' +
        '<div class="desktop-card"><h3>Archive pulse</h3>' +
          '<div class="desktop-row"><span>Sports active</span><b>' + sportsCfg().length + '</b></div>' +
          '<div class="desktop-row"><span>Sectors</span><b>' + sectorsN + '</b></div>' +
          '<div class="desktop-row"><span>Seasons indexed</span><b>' + seasons + '</b></div>' +
          '<div class="desktop-row"><span>Decisive results</span><b>' + f.decisive + '</b></div>' +
        '</div>' +
        '<div class="desktop-card"><h3>Scoring desk</h3><p>' + scoreLine + '</p><p class="desktop-muted">Across the current loaded archive.</p></div>' +
        '<div class="desktop-card"><h3>Creative desk</h3><p>' + assistLine + '</p><p class="desktop-muted">Top-line player production from the data engine.</p></div>' +
      '</div>' +
      '<h2 id="sports">Sports desk</h2>' + sportCards() +
      '<div class="desktop-grid2 home-main-grid">' +
        '<div><h2 id="results">Recent results</h2>' + resultTable() + '</div>' +
        '<div><h2 id="players">Scoring leaders</h2>' + leaderTable() + '</div>' +
      '</div>' +
      '<h2 id="tables">Club performance</h2>' + teamTable() +
      '<div class="desktop-grid2 home-main-grid">' +
        '<div><h2 id="news">Bulletin</h2>' + bulletin() + '</div>' +
        '<div><h2 id="records">At a glance</h2>' +
          '<div class="desktop-card"><div class="desktop-row"><span>Total player records</span><b>' + players.length + '</b></div>' +
          '<div class="desktop-row"><span>Goals / runs tracked</span><b>' + (f.goals + sportsCfg().filter(function(c){return c.scoring === 'cricket';}).reduce(function(n,c){return n + (sportOf(c.id).matches||[]).reduce(function(a,m){return a + (+m.sh||0) + (+m.sa||0);},0);},0)) + '</b></div>' +
          '<div class="desktop-row"><span>Clean sheets</span><b>' + f.cleanSheets + '</b></div>' +
          '<div class="desktop-row"><span>Draw rate</span><b>' + (f.matches ? Math.round(f.draws / f.matches * 100) : 0) + '%</b></div></div>' +
        '</div>' +
      '</div>' +
      '<h2 id="competitions">Explore the archive</h2>' +
      '<div class="desktop-grid3"><div class="desktop-card"><h3>Competitions</h3><p>Browse tournament histories, stages, finalists and title records.</p><a href="#competitions">Open competition index →</a></div>' +
      '<div class="desktop-card"><h3>Statistics</h3><p>Compare player and club output across the loaded sports.</p><a href="#statistics">Open statistics desk →</a></div>' +
      '<div class="desktop-card"><h3>Records</h3><p>Big wins, clean sheets, scoring charts and archive milestones.</p><a href="#records">Open records desk →</a></div></div>' +
      '</div>';
  }
  function isHome() {
    var h = (location.hash || '#home').slice(1).split('/')[0];
    return !h || h === 'home';
  }
  function paint() {
    if (typeof STATE === 'undefined' || !STATE.ready || !isHome()) return false;
    if ((window.CASPER_PAGE && window.CASPER_PAGE.mode) && window.CASPER_PAGE.mode !== 'hub') return false;
    var app = document.getElementById('app'); if (!app) return false;
    app.innerHTML = html();
    var h = document.getElementById('firstHeading'); if (h) h.textContent = 'CASPER';
    return true;
  }
  function wrap() {
    if (window.__CASPER_HOME_WRAP__) return true;
    var prev = window.CASPER_DESKTOP_RENDER;
    if (typeof prev !== 'function') return false;
    window.CASPER_DESKTOP_RENDER = function () { prev.apply(this, arguments); paint(); };
    window.__CASPER_HOME_WRAP__ = true;
    return true;
  }
  var n = 0, timer = setInterval(function () {
    n += 1; wrap();
    if ((typeof STATE !== 'undefined' && STATE.ready && paint()) || n > 120) clearInterval(timer);
  }, 40);
  window.addEventListener('hashchange', function () { setTimeout(paint, 0); });
})();
