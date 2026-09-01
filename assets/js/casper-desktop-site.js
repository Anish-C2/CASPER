/* CASPER DESKTOP SITE — hash-routed archive views. Never leave the loading banner in place. */
(function () {
  'use strict';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pageSport() {
    return (window.CASPER_PAGE && window.CASPER_PAGE.sport) || null;
  }

  function sports() {
    var list = (STATE.sportsCfg && STATE.sportsCfg.sports) || [];
    var only = pageSport();
    return only ? list.filter(function (c) { return c.id === only; }) : list;
  }

  function sp(id) {
    return STATE.sports[id] || { matches: [], tournaments: [], players: {}, teams: {}, ranked: [] };
  }

  function asArr(x) {
    if (!x) return [];
    if (Array.isArray(x)) return x;
    if (typeof x.forEach === 'function') {
      var out = [];
      x.forEach(function (v) { out.push(v); });
      return out;
    }
    return [];
  }

  function playerMap() {
    var out = {};
    sports().forEach(function (c) {
      Object.values(sp(c.id).players || {}).forEach(function (p) {
        var k = String(p.name || '').toLowerCase();
        if (!k) return;
        if (!out[k]) out[k] = { name: p.name, teams: new Set(), matches: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, runs: 0, titles: 0, awards: [], hatTricks: 0 };
        var x = out[k];
        x.matches += p.matches || 0;
        x.wins += p.wins || 0;
        x.draws += p.draws || 0;
        x.losses += p.losses || 0;
        if (c.scoring === 'cricket') x.runs += p.runs || p.goals || 0;
        else { x.goals += p.goals || 0; x.assists += p.assists || 0; }
        x.titles += p.titles || 0;
        x.hatTricks += p.hatTricks || 0;
        asArr(p.teams).forEach(function (t) { x.teams.add(t); });
        x.awards = x.awards.concat(p.awards || []);
      });
    });
    return out;
  }

  function players() {
    return Object.values(playerMap()).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  function teamMap() {
    var out = {};
    sports().forEach(function (c) {
      Object.values(sp(c.id).teams || {}).forEach(function (t) {
        var k = t.abbr || t.name;
        if (!k) return;
        if (!out[k]) out[k] = { abbr: t.abbr, name: t.name, matches: 0, wins: 0, draws: 0, losses: 0, titles: 0, gf: 0, ga: 0, trophies: [] };
        var x = out[k];
        x.name = t.name || x.name;
        x.matches += t.matches || 0;
        x.wins += t.wins || 0;
        x.draws += t.draws || 0;
        x.losses += t.losses || 0;
        x.titles += t.titles || 0;
        x.gf += t.gf || 0;
        x.ga += t.ga || 0;
        (t.trophies || []).forEach(function (z) { x.trophies.push(z); });
      });
    });
    return out;
  }

  function teams() { return Object.values(teamMap()); }

  function pLink(p) { return '<a class="desktop-link" href="#player/' + encodeURIComponent(p.name) + '">' + esc(p.name) + '</a>'; }
  function tLink(t) { return '<a class="desktop-link" href="#team/' + encodeURIComponent(t.abbr) + '">' + esc(t.name) + '</a>'; }
  function row(a, b) { return '<div class="desktop-row"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function card(title, body) { return '<div class="desktop-card"><h3>' + title + '</h3>' + body + '</div>'; }

  function facts() {
    var f = { players: players().length, clubs: teams().length, matches: 0, comps: 0, goals: 0, runs: 0 };
    sports().forEach(function (c) {
      var s = sp(c.id);
      f.matches += (s.matches || []).length;
      f.comps += (s.tournaments || []).filter(function (t) { return (t.meta && t.meta.e) !== 'Seasonal Awards'; }).length;
      Object.values(s.players || {}).forEach(function (p) {
        if (c.scoring === 'cricket') f.runs += p.runs || p.goals || 0;
        else f.goals += p.goals || 0;
      });
    });
    return f;
  }

  function leaders(c) {
    var field = c.scoring === 'cricket' ? 'runs' : 'goals';
    return Object.values(sp(c.id).players || {}).map(function (p) {
      return Object.assign({}, p, { runs: p.runs || (c.scoring === 'cricket' ? p.goals : 0) || 0 });
    }).sort(function (a, b) { return (b[field] || 0) - (a[field] || 0); }).slice(0, 8);
  }

  function tourneys() {
    var out = [];
    sports().forEach(function (c) {
      (sp(c.id).tournaments || []).forEach(function (t) {
        out.push({ cfg: c, t: t, sport: sp(c.id) });
      });
    });
    return out;
  }

  function champName(item) {
    var t = item.t;
    if (!t.aw || !t.aw.ch) return '\u2014';
    if (t.n && t.n[t.aw.ch] && t.n[t.aw.ch].name) return t.n[t.aw.ch].name;
    return t.aw.ch;
  }

  function scoreOf(m) {
    return m.kind === 'cricket' ? (m.sh + '/' + m.hw + ' \u2013 ' + m.sa + '/' + m.aw) : (m.sh + '\u2013' + m.sa);
  }

  function hero(kicker, title, text, actions) {
    return '<div class="desktop-hero"><div class="desktop-kicker">' + esc(kicker) + '</div><h2>' + esc(title) + '</h2><p>' + text + '</p>' +
      (actions ? '<div class="desktop-actions">' + actions + '</div>' : '') + '</div>';
  }

  function home() {
    var f = facts();
    var sport = sports().map(function (c) {
      var p = leaders(c)[0];
      var field = c.scoring === 'cricket' ? 'runs' : 'goals';
      return card(esc(c.name), '<div class="desktop-big">' + sp(c.id).matches.length + '</div><div class="desktop-muted">matches</div>' +
        row('Leader', p ? pLink(p) : '\u2014') + row(field === 'runs' ? 'Runs' : 'Goals', p ? (p[field] || 0) : 0));
    }).join('');
    var lead = sports().map(function (c) {
      var field = c.scoring === 'cricket' ? 'runs' : 'goals';
      return card(esc(c.name) + ' \u00b7 LEADERS', leaders(c).map(function (p, i) {
        return row((i + 1) + '. ' + pLink(p), p[field] || 0);
      }).join(''));
    }).join('');
    var recent = sports().map(function (c) {
      return card(esc(c.name) + ' \u00b7 RECENT', (sp(c.id).matches || []).slice(-6).reverse().map(function (m) {
        return row(esc(m.event || m.stageLabel || 'Match'), esc(scoreOf(m)));
      }).join('') || '<div class="desktop-muted">No matches yet.</div>');
    }).join('');
    return '<div class="desktop-page">' +
      hero('COMPETITIVE ATHLETICS & SPORTS PROMOTION', 'CASPER ARCHIVE',
        'The central desktop archive for football, futsal and cricket. Competition history, players, clubs, rankings, records and CSN documentation in one classic interface.',
        '<a href="#archive">BROWSE ARCHIVE</a><a href="#players">PLAYER ARCHIVE</a><a href="#teams">CLUB ARCHIVE</a><a href="#docs-csn">CSN DOCUMENTATION</a>') +
      '<div class="desktop-stats"><div class="desktop-stat"><b>' + f.players + '</b><span>Players</span></div><div class="desktop-stat"><b>' + f.clubs + '</b><span>Clubs</span></div><div class="desktop-stat"><b>' + f.matches + '</b><span>Matches</span></div><div class="desktop-stat"><b>' + f.comps + '</b><span>Competitions</span></div><div class="desktop-stat"><b>' + f.goals + '</b><span>Goals</span></div><div class="desktop-stat"><b>' + f.runs + '</b><span>Runs</span></div></div>' +
      '<div class="desktop-section"><div class="desktop-section-title">SPORT DESKS</div><div class="desktop-grid3">' + sport + '</div></div>' +
      '<div class="desktop-section"><div class="desktop-section-title">PLAYER LEADERS</div><div class="desktop-grid3">' + lead + '</div></div>' +
      '<div class="desktop-section"><div class="desktop-section-title">RECENT RESULTS</div><div class="desktop-grid3">' + recent + '</div></div></div>';
  }

  function archivePage() {
    var rows = tourneys().filter(function (x) { return (x.t.meta && x.t.meta.e) !== 'Seasonal Awards'; }).map(function (x) {
      var id = (x.t.meta && x.t.meta.id) || '';
      var name = (x.t.meta && x.t.meta.e) || id;
      return row('<a class="desktop-link" href="#competition/' + encodeURIComponent(id) + '">' + esc(x.cfg.name) + ' \u00b7 ' + esc(name) + '</a>',
        esc(champName(x)) + ' \u00b7 ' + (x.t.m || []).length + ' matches');
    }).join('') || '<div class="desktop-muted">No competitions in the loaded manifests.</div>';
    return '<div class="desktop-page">' +
      hero('ARCHIVE', 'COMPETITION ARCHIVE', 'Every recorded CASPER competition from the CSN season files.') +
      card('ALL COMPETITIONS', rows) + '</div>';
  }

  function competitionPage(id) {
    id = decodeURIComponent(id || '');
    var hit = tourneys().find(function (x) { return x.t.meta && x.t.meta.id === id; });
    if (!hit) return simple('COMPETITION', 'Competition not found in the desktop archive.');
    var t = hit.t;
    var matches = (t.m || []).map(function (m) {
      var hn = t.n && t.n[m.home] ? t.n[m.home].name : m.home;
      var an = t.n && t.n[m.away] ? t.n[m.away].name : m.away;
      return row(esc((m.stageLabel || m.stage || '') + ' \u00b7 ' + hn + ' vs ' + an), esc(scoreOf(m)));
    }).join('') || '<div class="desktop-muted">No matches recorded.</div>';
    var awards = Object.keys(t.aw || {}).map(function (code) {
      var holder = t.n && t.n[t.aw[code]] ? t.n[t.aw[code]].name : t.aw[code];
      var label = (STATE.config.awardLabels && STATE.config.awardLabels[code]) || code;
      return row(esc(label), esc(holder));
    }).join('') || '<div class="desktop-muted">No awards block.</div>';
    return '<div class="desktop-page">' +
      hero(hit.cfg.name.toUpperCase(), (t.meta.e || t.meta.id || 'COMPETITION').toUpperCase(),
        'Season ' + esc(t.meta.s || '\u2014') + (t.meta.sts ? ' \u00b7 ' + esc(t.meta.sts) : '')) +
      '<div class="desktop-grid2">' + card('MATCHES', matches) + card('AWARDS', awards) + '</div></div>';
  }

  function playersPage() {
    return '<div class="desktop-page">' +
      hero('PLAYER CENTRE', 'PLAYER ARCHIVE', 'Individual statistics and honours. Club trophies remain separate.') +
      '<div class="desktop-grid4">' + players().map(function (p) {
        return card(pLink(p), row('Goals', p.goals) + row('Assists', p.assists) + row('Runs', p.runs) + row('Titles', p.titles) + row('Honours', p.awards.length));
      }).join('') + '</div></div>';
  }

  function playerPage(name) {
    name = decodeURIComponent(name || '');
    var p = players().find(function (x) { return String(x.name).toLowerCase() === name.toLowerCase(); });
    if (!p) return simple('PLAYER RECORD', 'Player not found. Open the player archive.');
    return '<div class="desktop-page">' +
      hero('PLAYER RECORD', p.name.toUpperCase(), 'Archive totals across the loaded CASPER sports.') +
      '<div class="desktop-grid2">' +
      card('OUTPUT', row('Goals', p.goals) + row('Assists', p.assists) + row('Runs', p.runs) + row('Hat-tricks', p.hatTricks)) +
      card('RECORD', row('Matches', p.matches) + row('Wins', p.wins) + row('Draws', p.draws) + row('Losses', p.losses) + row('Titles', p.titles) + row('Honours', p.awards.length)) +
      '</div></div>';
  }

  function teamsPage() {
    return '<div class="desktop-page">' +
      hero('ARCHIVE', 'CLUB DIRECTORY', 'Club tally = trophies only. Individual awards never become club trophies.') +
      '<div class="desktop-grid4">' + teams().sort(function (a, b) { return b.titles - a.titles; }).map(function (t) {
        return card(tLink(t), '<div class="desktop-big">' + t.titles + '</div><div class="desktop-muted">championship trophies</div>' +
          row('Matches', t.matches) + row('Record', t.wins + '-' + t.draws + '-' + t.losses));
      }).join('') + '</div></div>';
  }

  function teamPage(abbr) {
    abbr = decodeURIComponent(abbr || '');
    var t = teams().find(function (x) { return String(x.abbr) === abbr; });
    if (!t) return simple('CLUB RECORD', 'Club not found. Open the club archive.');
    var honours = (t.trophies || []).map(function (z) {
      return row(esc(z.label || z.code || 'Honour'), esc((z.event || '') + ' ' + (z.season || '')));
    }).join('') || '<div class="desktop-muted">No trophies recorded.</div>';
    return '<div class="desktop-page">' +
      hero('CLUB RECORD', (t.name || t.abbr).toUpperCase(), 'Championship trophies only.') +
      '<div class="desktop-grid2">' +
      card('RECORD', row('Matches', t.matches) + row('Wins', t.wins) + row('Draws', t.draws) + row('Losses', t.losses) + row('Titles', t.titles) + row('For/Against', t.gf + ' / ' + t.ga)) +
      card('TROPHY CABINET', honours) +
      '</div></div>';
  }

  function comparePage() {
    var ps = players();
    var opts = ps.map(function (p) { return '<option value="' + esc(p.name) + '">' + esc(p.name) + '</option>'; }).join('');
    return '<div class="desktop-page">' +
      hero('PLAYER CENTRE', 'COMPARE PLAYERS', 'Select two registered players and compare archive totals.') +
      '<div class="desktop-card"><div class="desktop-form"><label>PLAYER A<select id="cmp-a">' + opts + '</select></label><label>PLAYER B<select id="cmp-b">' + opts + '</select></label></div><div id="cmp-out" class="desktop-compare"></div></div></div>';
  }

  function bindCompare() {
    var a = document.getElementById('cmp-a');
    var b = document.getElementById('cmp-b');
    var o = document.getElementById('cmp-out');
    if (!a || !b || !o) return;
    if (b.options.length > 1) b.selectedIndex = 1;
    function draw() {
      var ps = players();
      var pa = ps.find(function (p) { return p.name === a.value; }) || ps[0];
      var pb = ps.find(function (p) { return p.name === b.value; }) || ps[1];
      o.innerHTML = [pa, pb].filter(Boolean).map(function (p) {
        return card(esc(p.name), row('Goals', p.goals) + row('Assists', p.assists) + row('Runs', p.runs) + row('Matches', p.matches) + row('Wins', p.wins) + row('Titles', p.titles) + row('Honours', p.awards.length));
      }).join('');
    }
    a.onchange = draw;
    b.onchange = draw;
    draw();
  }

  function awardsPage() {
    var counts = {};
    sports().forEach(function (c) {
      (sp(c.id).tournaments || []).forEach(function (t) {
        Object.keys(t.aw || {}).forEach(function (k) {
          var label = (STATE.config.awardLabels && STATE.config.awardLabels[k]) || ({ ch: 'Champion', ru: 'Runner-up', gb: 'Golden Boot', goldenBoot: 'Golden Boot', ironwall: 'Iron Wall', playmaker: 'Best Playmaker', glove: 'Golden Glove', topScorer: 'Top Scorer' }[k] || k);
          counts[label] = (counts[label] || 0) + 1;
        });
      });
    });
    return '<div class="desktop-page">' +
      hero('ARCHIVE', 'AWARDS', 'Grouped award totals; player honours remain separate from club trophies.') +
      '<div class="desktop-card">' + Object.keys(counts).map(function (k) {
        return '<span class="desktop-chip">' + esc(k) + ' \u00d7' + counts[k] + '</span>';
      }).join('') + '</div></div>';
  }

  function rankingPage() {
    var rows = '';
    if (typeof globalRanks === 'function') {
      rows = globalRanks().map(function (r, i) {
        return row((i + 1) + '. ' + tLink(r), r.avgRank.toFixed(2) + ' avg \u00b7 ' + Math.round(r.totalScore));
      }).join('');
    } else {
      rows = teams().sort(function (a, b) { return b.titles - a.titles || b.wins - a.wins; }).map(function (t, i) {
        return row((i + 1) + '. ' + tLink(t), t.titles + ' titles \u00b7 ' + t.wins + ' wins');
      }).join('');
    }
    return '<div class="desktop-page">' + hero('ARCHIVE', 'RANKING', 'Club ranking across the loaded sports.') + card('TABLE', rows || '<div class="desktop-muted">No ranked clubs.</div>') + '</div>';
  }

  function recordsPage() {
    var rows = [];
    sports().forEach(function (c) {
      var top = leaders(c)[0];
      if (top) rows.push(row('Most ' + (c.scoring === 'cricket' ? 'runs' : 'goals') + ' \u00b7 ' + esc(c.name), pLink(top) + ' \u00b7 ' + (c.scoring === 'cricket' ? (top.runs || 0) : (top.goals || 0))));
    });
    var mostTitles = players().slice().sort(function (a, b) { return b.titles - a.titles; })[0];
    if (mostTitles) rows.push(row('Most titles', pLink(mostTitles) + ' \u00b7 ' + mostTitles.titles));
    return '<div class="desktop-page">' + hero('ARCHIVE', 'RECORDS', 'Computed from the current CSN archive.') + card('CURRENT MARKS', rows.join('')) + '</div>';
  }

  function statisticsPage() {
    var f = facts();
    var sportRows = sports().map(function (c) {
      var s = sp(c.id);
      return card(esc(c.name), row('Competitions', (s.tournaments || []).length) + row('Matches', (s.matches || []).length) + row('Clubs', Object.keys(s.teams || {}).length) + row('Players', Object.keys(s.players || {}).length));
    }).join('');
    return '<div class="desktop-page">' +
      hero('ARCHIVE', 'STATISTICS', 'Totals generated from the loaded season files.') +
      '<div class="desktop-stats"><div class="desktop-stat"><b>' + f.players + '</b><span>Players</span></div><div class="desktop-stat"><b>' + f.clubs + '</b><span>Clubs</span></div><div class="desktop-stat"><b>' + f.matches + '</b><span>Matches</span></div><div class="desktop-stat"><b>' + f.comps + '</b><span>Competitions</span></div><div class="desktop-stat"><b>' + f.goals + '</b><span>Goals</span></div><div class="desktop-stat"><b>' + f.runs + '</b><span>Runs</span></div></div>' +
      '<div class="desktop-grid3">' + sportRows + '</div></div>';
  }

  function newsPage() {
    var items = [];
    try { if (typeof generateNews === 'function') items = generateNews(); } catch (e) {}
    return '<div class="desktop-page">' +
      hero('NEWS DESK', 'LATEST NEWS', 'Headlines built from champions and recent results.') +
      card('BULLETIN', items.map(function (n) { return row(esc(n), ''); }).join('') || '<div class="desktop-muted">No headlines yet.</div>') +
      '</div>';
  }

  function aboutPage() {
    return '<div class="desktop-page">' +
      hero('CASPER', 'ABOUT CASPER', 'Competitive Athletics & Sports Promotion \u2014 one association, three sports, infinite legacy.') +
      '<div class="desktop-doc"><h3>Purpose</h3><p>CASPER maintains the long-term public archive for football, futsal and cricket competition history, statistics, clubs, players, awards and records.</p></div>' +
      '<div class="desktop-section-title">GOVERNANCE</div><div class="desktop-governance">' +
      [['CPC', "CASPER Players' Commission"], ['PFAC', 'Players\u2019 Futsal Association of CASPER'], ['PFBC', 'Players\u2019 Football Committee of CASPER'], ['PCAC', 'Players\u2019 Cricket Association of CASPER']].map(function (x) {
        return '<div class="desktop-card"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>';
      }).join('') + '</div></div>';
  }

  function docsPage() {
    return '<div class="desktop-page">' +
      hero('CASPER SERIALIZATION NETWORK', 'CSN DOCUMENTATION', 'In-site reference for the archive serialization format.') +
      '<div class="desktop-doc"><h3>CSN</h3><p>Competition Serialization Notation is the machine-readable archive format used by CASPER for seasons, competitions, matches, players, teams and awards.</p></div>' +
      '<div class="desktop-doc"><h3>Archive rules</h3><ul><li>Competition records are the source of truth.</li><li>Club trophies come from championship records.</li><li>Individual honours remain attached to players.</li><li>Football and futsal use goals; cricket uses runs.</li></ul></div></div>';
  }

  function sitemap() {
    var ids = ['home', 'news', 'archive', 'competitions', 'players', 'teams', 'awards', 'ranking', 'records', 'statistics', 'about', 'docs-csn'];
    return '<div class="desktop-page">' + hero('CASPER', 'SITE MAP', 'Single-page hash-routed desktop archive.') +
      '<div class="desktop-navgrid">' + ids.map(function (id) { return '<a href="#' + id + '">' + id.replace(/-/g, ' ').toUpperCase() + '</a>'; }).join('') + '</div></div>';
  }

  function simple(title, text) {
    return '<div class="desktop-page">' + hero('CASPER', title, text) + '</div>';
  }

  function route() {
    var h = (location.hash || '#home').slice(1);
    var parts = h.split('/');
    var v = parts[0] || 'home';
    var arg = parts.slice(1).join('/');
    if (typeof setActive === 'function') {
      var mark = v === 'player' ? 'players' : v === 'team' ? 'teams' : (v === 'competition' ? 'archive' : v);
      setActive(mark);
    }
    var html;
    if (v === 'player' && arg) html = playerPage(arg);
    else if (v === 'team' && arg) html = teamPage(arg);
    else if (v === 'competition' && arg) html = competitionPage(arg);
    else if (v === 'home' || !v) html = home();
    else if (v === 'archive' || v === 'competitions') html = archivePage();
    else if (v === 'players' || v === 'player-search') html = playersPage();
    else if (v === 'teams' || v === 'club-directory') html = teamsPage();
    else if (v === 'compare-players') html = comparePage();
    else if (v === 'awards') html = awardsPage();
    else if (v === 'ranking') html = rankingPage();
    else if (v === 'records') html = recordsPage();
    else if (v === 'statistics') html = statisticsPage();
    else if (v === 'news') html = newsPage();
    else if (v === 'about') html = aboutPage();
    else if (v === 'docs-csn' || v === 'downloads' || v === 'rules') html = docsPage();
    else if (v === 'site-map') html = sitemap();
    else html = simple(v.replace(/-/g, ' ').toUpperCase(), 'This CASPER archive view is available in the desktop hub.');
    var app = document.getElementById('app');
    if (app) app.innerHTML = html;
    if (v === 'compare-players') bindCompare();
  }

  window.CASPER_DESKTOP_RENDER = function () {
    if (typeof STATE === 'undefined') throw new Error('STATE missing');
    window.route = route;
    route();
  };
})();
