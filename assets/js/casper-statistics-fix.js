/* CASPER STATISTICS PATCH — fixes the statistics route without changing the archive engine. */
(function () {
  'use strict';
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pct(v) { return (Number(v || 0) * 100).toFixed(1) + '%'; }
  function row(a, b) { return '<div class="desktop-row"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function card(t, b) { return '<div class="desktop-card"><h3>' + t + '</h3>' + (b || '<div class="desktop-muted">No rows.</div>') + '</div>'; }
  function pLink(n) { return '<a class="desktop-link" href="#player/' + encodeURIComponent(n) + '">' + esc(n) + '</a>'; }
  function matches() {
    var out = [];
    (STATE.sportsCfg.sports || []).forEach(function (cfg) {
      var sp = STATE.sports[cfg.id];
      if (!sp) return;
      (sp.matches || []).forEach(function (m) { out.push({ cfg: cfg, sp: sp, m: m }); });
    });
    return out;
  }
  function players() {
    var map = {};
    function get(name) {
      var k = String(name || '').trim().toLowerCase();
      if (!k) return null;
      if (!map[k]) map[k] = { name: String(name).trim(), goals: 0, assists: 0, runs: 0, matches: 0, wins: 0, draws: 0, losses: 0, titles: 0, hats: 0 };
      return map[k];
    }
    (STATE.sportsCfg.sports || []).forEach(function (cfg) {
      var sp = STATE.sports[cfg.id];
      if (!sp) return;
      Object.keys(sp.players || {}).forEach(function (k) {
        var p = sp.players[k], x = get(p.name || k);
        if (!x) return;
        if (cfg.scoring === 'cricket') x.runs += Number(p.runs != null ? p.runs : (p.goals || 0));
        else { x.goals += Number(p.goals || 0); x.assists += Number(p.assists || 0); x.hats += Number(p.hatTricks || 0); }
        x.matches += Number(p.matches || 0); x.wins += Number(p.wins || 0); x.draws += Number(p.draws || 0); x.losses += Number(p.losses || 0); x.titles += Number(p.titles || 0);
      });
    });
    return Object.values(map);
  }
  function statisticsPageFixed() {
    var ps = players(), ms = matches(), goals = 0, runs = 0, pens = 0, clean = 0, hats = 0;
    ms.forEach(function (x) {
      var m = x.m;
      if (m.kind === 'cricket') runs += Number(m.sh || 0) + Number(m.sa || 0);
      else { goals += Number(m.sh || 0) + Number(m.sa || 0); if (m.sh === 0 || m.sa === 0) clean++; }
      if (m.p) pens++;
    });
    ps.forEach(function (p) { hats += p.hats; });
    var scorer = ps.filter(function (p) { return p.goals > 0; }).sort(function (a, b) { return b.goals - a.goals || b.assists - a.assists; }).slice(0, 10);
    var runner = ps.filter(function (p) { return p.matches >= 3; }).sort(function (a, b) {
      return (b.wins / b.matches) - (a.wins / a.matches) || b.wins - a.wins;
    }).slice(0, 10);
    var cricket = [];
    (STATE.sportsCfg.sports || []).forEach(function (cfg) {
      if (cfg.scoring !== 'cricket') return;
      var sp = STATE.sports[cfg.id]; if (!sp) return;
      Object.values(sp.teams || {}).forEach(function (t) {
        var w = Number(t.wins || 0), d = Number(t.draws || 0), l = Number(t.losses || 0);
        cricket.push({ name: t.name, w: w, d: d, l: l, gf: Number(t.gf || 0), ga: Number(t.ga || 0) });
      });
    });
    cricket.sort(function (a, b) { return b.w - a.w || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf; });
    var named = [];
    ms.forEach(function (x) {
      ['gh', 'ga'].forEach(function (field) { (x.m[field] || []).forEach(function (g) { named.push({ name: g.name, goals: Number(g.n || 0) }); }); });
    });
    var namedMap = {};
    named.forEach(function (g) { var k = String(g.name || '').toLowerCase(); if (!k) return; if (!namedMap[k]) namedMap[k] = { name: g.name, goals: 0 }; namedMap[k].goals += g.goals; });
    var logged = Object.values(namedMap).sort(function (a, b) { return b.goals - a.goals; }).slice(0, 10);
    return '<div class="desktop-page">' +
      '<div class="desktop-hero"><div class="desktop-kicker">ARCHIVE</div><h2>STATISTICS</h2><p>Cross-sport totals generated directly from the loaded CSN archive.</p></div>' +
      '<div class="desktop-stats">' +
        '<div class="desktop-stat"><b>' + ps.length + '</b><span>Players</span></div>' +
        '<div class="desktop-stat"><b>' + ms.length + '</b><span>Matches</span></div>' +
        '<div class="desktop-stat"><b>' + goals + '</b><span>Goals</span></div>' +
        '<div class="desktop-stat"><b>' + runs + '</b><span>Runs</span></div>' +
        '<div class="desktop-stat"><b>' + pens + '</b><span>Pen. shootouts</span></div>' +
        '<div class="desktop-stat"><b>' + clean + '</b><span>Clean sheets</span></div>' +
      '</div>' +
      '<div class="desktop-grid2">' +
        card('TOP SCORERS', scorer.map(function (p, i) { return row((i + 1) + '. ' + pLink(p.name), p.goals + ' G · ' + p.assists + ' A'); }).join('')) +
        card('WIN RATE · 3+ MATCHES', runner.map(function (p, i) { return row((i + 1) + '. ' + pLink(p.name), pct(p.wins / p.matches) + ' · ' + p.wins + '-' + p.draws + '-' + p.losses); }).join('')) +
      '</div>' +
      '<div class="desktop-grid2">' +
        card('LOGGED SCORERS', logged.map(function (p, i) { return row((i + 1) + '. ' + pLink(p.name), p.goals + ' G'); }).join('')) +
        card('CRICKET TABLE', cricket.map(function (t, i) { return row((i + 1) + '. ' + esc(t.name), t.w + '-' + t.d + '-' + t.l + ' · ' + t.gf + '/' + t.ga + ' · diff ' + (t.gf - t.ga)); }).join('')) +
      '</div>' +
      '<div class="desktop-grid2">' +
        card('ARCHIVE NOTES', row('Hat-tricks', hats) + row('Scoring metrics', 'Goals / runs separated by sport') + row('Win-rate minimum', '3 recorded matches') + row('Source', 'CSN season files')) +
        card('DATA INTEGRITY', row('Matches loaded', ms.length) + row('Player profiles', ps.length) + row('Named scorer lines', logged.length ? 'Available' : 'None') + row('Cricket records', cricket.length ? 'Available' : 'None')) +
      '</div></div>';
  }
  function install() {
    if (window.__CASPER_STATS_PATCHED) return;
    var oldRoute = window.route;
    if (typeof oldRoute !== 'function') {
      setTimeout(install, 50);
      return;
    }
    window.__CASPER_STATS_PATCHED = true;
    window.route = function () {
      var h = (location.hash || '#home').slice(1), v = h.split('/')[0] || 'home';
      if (v === 'statistics') {
        var app = document.getElementById('app');
        if (app) app.innerHTML = statisticsPageFixed();
        if (typeof window.setActive === 'function') window.setActive('statistics');
        document.querySelectorAll('nav.main a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-view') === 'statistics'); });
        return;
      }
      oldRoute();
    };
    if ((location.hash || '#home').slice(1).split('/')[0] === 'statistics') window.route();
  }
  install();
})();
