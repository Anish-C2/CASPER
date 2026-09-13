/* CASPER home — Wikipedia-style main page from live archive data. */
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
    return m.sh + '\u2013' + m.sa + (m.p ? ' (p)' : '');
  }
  function facts() {
    var f = { players: 0, clubs: 0, matches: 0, comps: 0 }, people = {}, clubs = {};
    sportsCfg().forEach(function (c) {
      var s = sportOf(c.id);
      f.matches += (s.matches || []).length;
      f.comps += (s.tournaments || []).filter(function (t) { return !isSeasonal(t); }).length;
      Object.values(s.players || {}).forEach(function (p) { if (p && p.name) people[String(p.name).toLowerCase()] = 1; });
      Object.values(s.teams || {}).forEach(function (t) { if (t && (t.abbr || t.name)) clubs[String(t.abbr || t.name).toLowerCase()] = 1; });
    });
    Object.keys(STATE.registry || {}).forEach(function (k) {
      if (String(k).charAt(0) === '_') return;
      people[String((STATE.registry[k] && STATE.registry[k].name) || k).toLowerCase()] = 1;
    });
    f.players = Object.keys(people).length; f.clubs = Object.keys(clubs).length; return f;
  }
  function newsItems() {
    if (typeof generateNews === 'function') { try { return generateNews(); } catch (e) {} }
    var items = [];
    sportsCfg().forEach(function (c) {
      (sportOf(c.id).matches || []).slice(-3).reverse().forEach(function (m) {
        var n = namesOf(m); items.push(c.name + ': ' + n.hn + ' ' + scoreOf(m) + ' ' + n.an);
      });
    });
    return items;
  }
  function recentMatches() {
    var out = [];
    sportsCfg().forEach(function (c) { (sportOf(c.id).matches || []).forEach(function (m) { out.push({ cfg: c, m: m }); }); });
    return out.slice(-8).reverse();
  }
  function leagueRows() {
    var rows = [];
    sportsCfg().some(function (c) {
      var teams = Object.values(sportOf(c.id).teams || {}).filter(function (t) { return t && (t.matches || t.pts); });
      if (!teams.length) return false;
      rows = teams.sort(function (a, b) { return (b.pts || 0) - (a.pts || 0); }).slice(0, 8);
      rows._title = c.name + ' table';
      return true;
    });
    return rows;
  }
  function isHome() {
    var h = (location.hash || '#home').slice(1).split('/')[0];
    return !h || h === 'home';
  }
  function html() {
    var f = facts();
    var sectorsN = (((STATE.sectorRegistry || {}).sectors) || []).length;
    var names = sportsCfg().map(function (c) { return c.name; });
    var matches = recentMatches();
    var league = leagueRows();
    var news = newsItems().slice(0, 8);
    var box = '<table class="infobox"><caption>CASPER</caption><tr><th colspan="2">Archive</th></tr>' +
      '<tr><th>Sports</th><td>' + sportsCfg().length + '</td></tr>' +
      '<tr><th>Sectors</th><td>' + sectorsN + '</td></tr>' +
      '<tr><th>Competitions</th><td>' + f.comps + '</td></tr>' +
      '<tr><th>Players</th><td>' + f.players + '</td></tr>' +
      '<tr><th>Clubs</th><td>' + f.clubs + '</td></tr>' +
      '<tr><th>Matches</th><td>' + f.matches + '</td></tr></table>';
    var toc = '<div id="toc" class="toc"><div id="toctitle"><h2>Contents</h2></div><ul>' +
      '<li><a href="#Overview">1 Overview</a></li><li><a href="#Sports">2 Sports</a></li>' +
      '<li><a href="#Recent_results">3 Recent results</a></li><li><a href="#Table">4 Table</a></li>' +
      '<li><a href="#Bulletin">5 Bulletin</a></li></ul></div>';
    var sportsList = '<ul>' + sportsCfg().map(function (c) {
      var s = sportOf(c.id);
      return '<li><a href="' + esc(pageOf(c)) + '">' + esc(c.name) + '</a> \u2014 ' +
        (s.matches || []).length + ' matches, ' +
        (s.tournaments || []).filter(function (t) { return !isSeasonal(t); }).length + ' competitions.</li>';
    }).join('') + '</ul>';
    var matchRows = matches.map(function (x) {
      var n = namesOf(x.m);
      return '<tr><td>' + esc(x.cfg.name) + '</td><td>' + esc(x.m.event || '') + '</td><td>' +
        esc(n.hn) + ' vs ' + esc(n.an) + '</td><td>' + esc(scoreOf(x.m)) + '</td></tr>';
    }).join('') || '<tr><td colspan="4">No matches loaded.</td></tr>';
    var tableRows = league.map(function (t, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(t.name || t.abbr) + '</td><td>' + (t.matches || t.p || 0) +
        '</td><td>' + (t.wins || 0) + '</td><td>' + (t.draws || 0) + '</td><td>' + (t.losses || 0) +
        '</td><td>' + (t.pts || 0) + '</td></tr>';
    }).join('');
    var newsList = news.length
      ? '<ul>' + news.map(function (n) { return '<li>' + esc(typeof n === 'string' ? n : (n.text || '')) + '</li>'; }).join('') + '</ul>'
      : '<p>The archive is online.</p>';
    return box +
      '<p><b>CASPER</b> (Competitive Athletics &amp; Sports Promotion) is a multi-sport archive covering ' +
      esc(names.join(', ') || 'the sports on file') +
      '. It records clubs, players, competitions and match results from CSN season files.</p>' + toc +
      '<h2 id="Overview">Overview</h2>' +
      '<p>CASPER is organised by <a href="sectors/index.html">sectors</a>. Each sector is a local operating area with its own clubs and competitions, still bound by the same <a href="governance/index.html">governance</a> rules. Players may belong to at most two sectors.</p>' +
      '<p>See also: <a href="#competitions">competition list</a>, <a href="join/index.html">how to join</a>, and the <a href="api/index.html">data API</a>.</p>' +
      '<h2 id="Sports">Sports</h2>' + sportsList +
      '<h2 id="Recent_results">Recent results</h2>' +
      '<table class="wikitable"><thead><tr><th>Sport</th><th>Competition</th><th>Fixture</th><th>Score</th></tr></thead><tbody>' + matchRows + '</tbody></table>' +
      '<h2 id="Table">Table</h2><p>' + esc(league._title || 'Standings') + '</p>' +
      '<table class="wikitable"><thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead><tbody>' + tableRows + '</tbody></table>' +
      '<h2 id="Bulletin">Bulletin</h2>' + newsList;
  }
  function paint() {
    if (typeof STATE === 'undefined' || !STATE.ready) return false;
    if ((window.CASPER_PAGE && window.CASPER_PAGE.mode) && window.CASPER_PAGE.mode !== 'hub') return false;
    if (!isHome()) return false;
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
