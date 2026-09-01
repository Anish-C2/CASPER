/* CASPER DESKTOP SITE — CSN-driven archive. */
(function () {
  'use strict';
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pageSport() { return (window.CASPER_PAGE && window.CASPER_PAGE.sport) || null; }
  function sports() {
    var list = (STATE.sportsCfg && STATE.sportsCfg.sports) || [];
    var only = pageSport();
    return only ? list.filter(function (c) { return c.id === only; }) : list;
  }
  function sp(id) { return STATE.sports[id] || { matches: [], tournaments: [], players: {}, teams: {}, ranked: [] }; }
  function asArr(x) {
    if (!x) return [];
    if (Array.isArray(x)) return x;
    var o = [];
    if (x && x.forEach) x.forEach(function (v) { o.push(v); });
    return o;
  }
  function awardLabel(code) { return (STATE.config && STATE.config.awardLabels && STATE.config.awardLabels[code]) || code; }
  function prettyDate(raw) {
    var s = String(raw || '');
    return /^\d{8}$/.test(s) ? s.slice(0, 2) + '-' + s.slice(2, 4) + '-' + s.slice(4) : (s || '\u2014');
  }
  function clubName(sport, abbr) { var t = sport && sport.teams && sport.teams[abbr]; return (t && t.name) || abbr || '\u2014'; }
  function scoreOf(m) {
    if (!m) return '\u2014';
    var b = m.kind === 'cricket' ? (m.sh + '/' + m.hw + ' \u2013 ' + m.sa + '/' + m.aw) : (m.sh + '\u2013' + m.sa);
    if (m.p) b += ' (p ' + m.p[0] + '\u2013' + m.p[1] + ')';
    if (m.et) b += ' aet';
    return b;
  }
  function scorerText(list) { return (list || []).map(function (x) { return x.name + (x.n > 1 ? ' \u00d7' + x.n : ''); }).join(', '); }
  function isSeasonal(t) { return t && t.meta && (t.meta.e === 'Seasonal Awards' || t.meta.typ === 'seasonal');
  }
  function hero(k, t, p, a) {
    return '<div class="desktop-hero"><div class="desktop-kicker">' + esc(k) + '</div><h2>' + esc(t) + '</h2><p>' + p + '</p>' +
      (a ? '<div class="desktop-actions">' + a + '</div>' : '') + '</div>';
  }
  function row(a, b) { return '<div class="desktop-row"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function card(t, b) { return '<div class="desktop-card"><h3>' + t + '</h3>' + (b || '<div class="desktop-muted">No rows.</div>') + '</div>'; }
  function pLink(n) { return '<a class="desktop-link" href="#player/' + encodeURIComponent(n) + '">' + esc(n) + '</a>'; }
  function tLink(a, n) { return '<a class="desktop-link" href="#team/' + encodeURIComponent(a) + '">' + esc(n || a) + '</a>'; }
  function cLink(id, n) { return '<a class="desktop-link" href="#competition/' + encodeURIComponent(id) + '">' + esc(n || id) + '</a>'; }
  function simple(t, x) { return '<div class="desktop-page">' + hero('CASPER', t, x) + '</div>'; }
  function regOf(n) { return (STATE.registry || {})[String(n || '').toLowerCase()] || null; }
  function ctxOf(n) { return (STATE.config && STATE.config.playerContext && STATE.config.playerContext[String(n || '').toLowerCase()]) || ''; }
  function cleanName(n) { return String(n || '').replace(/\(.*?\)/g, '').trim(); }
  function resOf(m) { return (typeof resultOf === 'function') ? resultOf(m) : (m.p ? (m.p[0] > m.p[1] ? 'H' : 'A') : (m.sh === m.sa ? 'D' : (m.sh > m.sa ? 'H' : 'A'))); }
  function namesOf(m) {
    return {
      hn: m.names && m.names[m.home] ? m.names[m.home].name : m.home,
      an: m.names && m.names[m.away] ? m.names[m.away].name : m.away
    };
  }
  function tourneys() {
    var out = [];
    sports().forEach(function (c) { (sp(c.id).tournaments || []).forEach(function (t) { out.push({ cfg: c, t: t, sport: sp(c.id) }); }); });
    return out;
  }
  function comps() { return tourneys().filter(function (x) { return !isSeasonal(x.t); }); }
  function holderName(t, code) {
    var val = t.aw && t.aw[code];
    if (!val) return '';
    return (t.n && t.n[val] && t.n[val].name) || val;
  }
  function champOf(item) { return holderName(item.t, 'ch'); }
  function allMatches() {
    var out = [];
    sports().forEach(function (c) { (sp(c.id).matches || []).forEach(function (m) { out.push({ cfg: c, m: m }); }); });
    return out;
  }
  function playerMap() {
    var out = {};
    function bump(name) {
      var k = cleanName(name).toLowerCase();
      if (!k) return null;
      if (!out[k]) out[k] = { name: cleanName(name), teams: new Set(), matches: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, runs: 0, titles: 0, awards: [], hatTricks: 0, conceded: 0, cleanSheets: 0 };
      return out[k];
    }
    Object.keys(STATE.registry || {}).forEach(function (k) {
      if (k.charAt(0) === '_') return;
      var r = STATE.registry[k]; bump(r.name || k);
    });
    sports().forEach(function (c) {
      Object.values(sp(c.id).players || {}).forEach(function (p) {
        var x = bump(p.name); if (!x) return;
        x.matches += p.matches || 0; x.wins += p.wins || 0; x.draws += p.draws || 0; x.losses += p.losses || 0;
        if (c.scoring === 'cricket') x.runs += p.runs || p.goals || 0; else { x.goals += p.goals || 0; x.assists += p.assists || 0; }
        x.titles += p.titles || 0; x.hatTricks += p.hatTricks || 0; x.conceded += p.conceded || 0;
        asArr(p.teams).forEach(function (t) { x.teams.add(t); });
        x.awards = x.awards.concat(p.awards || []);
      });
    });
    allMatches().forEach(function (x) {
      var m = x.m;
      if (m.sa === 0 && m.names && m.names[m.home] && m.names[m.home].player) { var a = bump(m.names[m.home].player); if (a) a.cleanSheets++; }
      if (m.sh === 0 && m.names && m.names[m.away] && m.names[m.away].player) { var b = bump(m.names[m.away].player); if (b) b.cleanSheets++; }
    });
    return out;
  }
  function players() { return Object.values(playerMap()).sort(function (a, b) { return a.name.localeCompare(b.name); }); }
  function teamMap() {
    var out = {};
    sports().forEach(function (c) {
      Object.values(sp(c.id).teams || {}).forEach(function (t) {
        var k = t.abbr || t.name; if (!k) return;
        if (!out[k]) out[k] = { abbr: t.abbr, name: t.name, player: t.player, matches: 0, wins: 0, draws: 0, losses: 0, titles: 0, runnerUps: 0, gf: 0, ga: 0, cleanSheets: 0, trophies: [], form: [] };
        var x = out[k];
        x.name = t.name || x.name; x.player = t.player || x.player;
        x.matches += t.matches || 0; x.wins += t.wins || 0; x.draws += t.draws || 0; x.losses += t.losses || 0;
        x.titles += t.titles || 0; x.runnerUps += t.runnerUps || 0; x.gf += t.gf || 0; x.ga += t.ga || 0; x.cleanSheets += t.cleanSheets || 0;
        (t.trophies || []).forEach(function (z) { x.trophies.push(z); });
      });
    });
    allMatches().forEach(function (x) {
      var r = resOf(x.m);
      function mark(abbr, L) { if (out[abbr]) out[abbr].form.push(L); }
      if (r === 'H') { mark(x.m.home, 'W'); mark(x.m.away, 'L'); }
      else if (r === 'A') { mark(x.m.home, 'L'); mark(x.m.away, 'W'); }
      else { mark(x.m.home, 'D'); mark(x.m.away, 'D'); }
    });
    return out;
  }
  function teams() { return Object.values(teamMap()); }
  function facts() {
    var f = { players: players().length, clubs: teams().length, matches: 0, comps: 0, goals: 0, runs: 0, pens: 0, hats: 0 };
    sports().forEach(function (c) {
      var s = sp(c.id);
      f.matches += (s.matches || []).length;
      f.comps += (s.tournaments || []).filter(function (t) { return !isSeasonal(t); }).length;
      Object.values(s.players || {}).forEach(function (p) {
        if (c.scoring === 'cricket') f.runs += p.runs || p.goals || 0; else f.goals += p.goals || 0;
        f.hats += p.hatTricks || 0;
      });
      (s.matches || []).forEach(function (m) { if (m.p) f.pens++; });
    });
    return f;
  }
  function leaders(c, field, n) {
    field = field || (c.scoring === 'cricket' ? 'runs' : 'goals');
    return Object.values(sp(c.id).players || {}).map(function (p) {
      return Object.assign({}, p, { runs: p.runs || (c.scoring === 'cricket' ? p.goals : 0) || 0 });
    }).sort(function (a, b) { return (b[field] || 0) - (a[field] || 0); }).slice(0, n || 8);
  }
  function eventScorers() {
    var map = {};
    allMatches().forEach(function (x) {
      function add(list, f) {
        (list || []).forEach(function (g) {
          var k = cleanName(g.name); if (!k) return;
          if (!map[k]) map[k] = { name: k, goals: 0, assists: 0, hats: 0 };
          map[k][f] += g.n || 0;
          if (f === 'goals' && g.n >= 3) map[k].hats++;
        });
      }
      add(x.m.gh, 'goals'); add(x.m.ga, 'goals'); add(x.m.ah, 'assists'); add(x.m.aa, 'assists');
    });
    return Object.values(map).sort(function (a, b) { return b.goals - a.goals || b.assists - a.assists; });
  }
  function computedRecords() {
    var rows = ((STATE.misc && STATE.misc.records) || []).map(function (r) {
      return { label: r.label, value: r.value, holder: r.holder, context: r.context || '' };
    });
    var topP = players().slice().sort(function (a, b) { return b.goals - a.goals; })[0];
    var topA = players().slice().sort(function (a, b) { return b.assists - a.assists; })[0];
    var topT = players().slice().sort(function (a, b) { return b.titles - a.titles; })[0];
    var logged = eventScorers()[0];
    if (topP) rows.push({ label: 'All-time goals', value: String(topP.goals), holder: topP.name, context: 'Archive total' });
    if (logged) rows.push({ label: 'Named scorer (gh/ga)', value: String(logged.goals), holder: logged.name, context: 'Logged lines only' });
    if (topA && topA.assists) rows.push({ label: 'All-time assists', value: String(topA.assists), holder: topA.name, context: '' });
    if (topT) rows.push({ label: 'Most titles', value: String(topT.titles), holder: topT.name, context: '' });
    return rows;
  }
  function buildNews() {
    var items = [];
    sports().forEach(function (c) {
      var s = sp(c.id);
      if (typeof crownWinner === 'function') {
        var ch = crownWinner(c);
        if (ch) items.push(clubName(s, ch).toUpperCase() + ' HOLD THE ' + String(c.crown).toUpperCase());
      }
      (s.tournaments || []).forEach(function (t) {
        if (isSeasonal(t)) {
          Object.keys(t.aw || {}).forEach(function (k) { items.push('SEASONAL \u00b7 ' + k.toUpperCase() + ': ' + String(t.aw[k]).toUpperCase()); });
          return;
        }
        if (t.aw && t.aw.ch) items.push((t.meta.e || t.meta.id).toUpperCase() + ' CHAMPIONS: ' + String(holderName(t, 'ch')).toUpperCase());
        else if (/progress/i.test((t.meta && t.meta.sts) || '')) items.push((t.meta.e || '').toUpperCase() + ' IN PROGRESS \u00b7 ' + String(t.meta.sts).toUpperCase());
        if (t.nt) items.push((t.meta.e || t.meta.id).toUpperCase() + ': ' + String(t.nt).replace(/\s+/g, ' ').trim());
      });
      (s.matches || []).forEach(function (m) {
        var nm = namesOf(m);
        if (m.kind !== 'cricket' && Math.abs((m.sh || 0) - (m.sa || 0)) >= 5)
          items.push('THRASHING \u00b7 ' + (m.event || c.name).toUpperCase() + ': ' + nm.hn.toUpperCase() + ' ' + scoreOf(m) + ' ' + nm.an.toUpperCase());
        [].concat(m.gh || [], m.ga || []).forEach(function (g) {
          if (g.n >= 3) items.push('HAT-TRICK \u00b7 ' + String(g.name).toUpperCase() + ' \u00d7' + g.n + ' IN ' + String(m.event || '').toUpperCase());
        });
      });
    });
    var seen = {};
    return items.filter(function (x) { if (seen[x]) return false; seen[x] = 1; return true; });
  }
  window.generateNews = buildNews;
  function inProgress() { return tourneys().filter(function (x) { return /progress|ongoing|live/i.test((x.t.meta && x.t.meta.sts) || ''); }); }
  function seriesSummary(item) {
    var wins = {};
    (item.t.m || []).forEach(function (m) {
      var r = resOf(m);
      if (r === 'H') wins[m.home] = (wins[m.home] || 0) + 1;
      else if (r === 'A') wins[m.away] = (wins[m.away] || 0) + 1;
    });
    return Object.keys(item.t.n || {}).map(function (a) { return tLink(a, item.t.n[a].name) + ' ' + (wins[a] || 0); }).join('  \u00b7  ') + ' \u00b7 ' + (item.t.m || []).length + ' played';
  }
  function groupTable(t) {
    var clubs = {};
    Object.keys(t.n || {}).forEach(function (a) { clubs[a] = { abbr: a, name: t.n[a].name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    (t.m || []).filter(function (m) { return !m.stage || m.stage === 'GS'; }).forEach(function (m) {
      if (!clubs[m.home] || !clubs[m.away]) return;
      var h = clubs[m.home], a = clubs[m.away];
      h.p++; a.p++; h.gf += m.sh; h.ga += m.sa; a.gf += m.sa; a.ga += m.sh;
      var r = resOf(m);
      if (r === 'H') { h.w++; a.l++; h.pts += 3; } else if (r === 'A') { a.w++; h.l++; a.pts += 3; } else { h.d++; a.d++; h.pts++; a.pts++; }
    });
    return Object.values(clubs).sort(function (a, b) { return b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga); });
  }
  function home() {
    var f = facts();
    var sportCards = sports().map(function (c) {
      var p = leaders(c)[0], field = c.scoring === 'cricket' ? 'runs' : 'goals';
      var crown = (typeof crownWinner === 'function' && crownWinner(c)) ? clubName(sp(c.id), crownWinner(c)) : '\u2014';
      return card(esc(c.name), '<div class="desktop-big">' + sp(c.id).matches.length + '</div><div class="desktop-muted">matches \u00b7 ' + esc(c.crown) + '</div>' +
        row('Champion', esc(crown)) + row('Leader', p ? pLink(p.name) : '\u2014') + row(field === 'runs' ? 'Runs' : 'Goals', p ? (p[field] || 0) : 0));
    }).join('');
    var live = inProgress().map(function (x) {
      return card(esc(x.cfg.name) + ' \u00b7 LIVE', row(cLink(x.t.meta.id, x.t.meta.e), esc(x.t.meta.sts || '')) + row('Series', seriesSummary(x)));
    }).join('');
    var seasonal = tourneys().filter(function (x) { return isSeasonal(x.t); })[0];
    var season = '';
    if (seasonal) {
      season = '<div class="desktop-section"><div class="desktop-section-title">SEASON 2026A</div><div class="desktop-grid2">' +
        card('AWARDS', Object.keys(seasonal.t.aw || {}).map(function (k) { return row(esc(k), pLink(seasonal.t.aw[k])); }).join('')) +
        card('POINTS', (seasonal.t.ranks || []).map(function (r) { return row(r.rank + '. ' + pLink(r.name), (r.points != null ? r.points + ' pts' : '')); }).join('')) +
        '</div></div>';
    }
    return '<div class="desktop-page">' +
      hero('COMPETITIVE ATHLETICS & SPORTS PROMOTION', 'CASPER ARCHIVE',
        'Tables, news, records and honours generated from CSN season files.',
        '<a href="#archive">ARCHIVE</a><a href="#news">NEWS</a><a href="#statistics">STATS</a><a href="#live-scores">LIVE</a><a href="#results">RESULTS</a>') +
      '<div class="desktop-stats"><div class="desktop-stat"><b>' + f.players + '</b><span>Players</span></div><div class="desktop-stat"><b>' + f.clubs + '</b><span>Clubs</span></div><div class="desktop-stat"><b>' + f.matches + '</b><span>Matches</span></div><div class="desktop-stat"><b>' + f.comps + '</b><span>Competitions</span></div><div class="desktop-stat"><b>' + f.goals + '</b><span>Goals</span></div><div class="desktop-stat"><b>' + f.hats + '</b><span>Hats</span></div></div>' +
      (live ? '<div class="desktop-section"><div class="desktop-section-title">IN PROGRESS</div><div class="desktop-grid2">' + live + '</div></div>' : '') +
      '<div class="desktop-section"><div class="desktop-section-title">SPORT DESKS</div><div class="desktop-grid3">' + sportCards + '</div></div>' +
      season +
      '<div class="desktop-section"><div class="desktop-section-title">BULLETIN</div>' + card('AUTO NEWS', buildNews().slice(0, 14).map(function (n) { return row(esc(n), ''); }).join('')) + '</div></div>';
  }
  function archivePage() {
    return '<div class="desktop-page">' + hero('ARCHIVE', 'COMPETITION ARCHIVE', 'Loaded CSN competitions.') +
      card('ALL', comps().map(function (x) {
        return row(esc(x.cfg.name) + ' \u00b7 ' + cLink(x.t.meta.id, x.t.meta.e) + '<div class="desktop-muted">' + esc((x.t.meta.sts || '') + ' \u00b7 ' + (x.t.m || []).length + ' matches') + '</div>', esc(champOf(x) || 'Open'));
      }).join('')) + '</div>';
  }
  function competitionPage(id) {
    id = decodeURIComponent(id || '');
    var hit = tourneys().find(function (x) { return x.t.meta && x.t.meta.id === id; });
    if (!hit) return simple('COMPETITION', 'Not found.');
    var t = hit.t;
    var meta = ((STATE.config && STATE.config.metadataFields) || []).map(function (f) {
      var val = t.meta[f.key]; if (!val) return '';
      if (f.key === 'dos' || f.key === 'doc') val = prettyDate(val);
      return row(esc(f.label), esc(val));
    }).join('');
    var matches = (t.m || []).map(function (m, i) {
      var extra = [];
      if (scorerText(m.gh)) extra.push('GH ' + scorerText(m.gh));
      if (scorerText(m.ga)) extra.push('GA ' + scorerText(m.ga));
      if (scorerText(m.ah)) extra.push('AH ' + scorerText(m.ah));
      if (scorerText(m.aa)) extra.push('AA ' + scorerText(m.aa));
      var hn = t.n[m.home] ? t.n[m.home].name : m.home, an = t.n[m.away] ? t.n[m.away].name : m.away;
      return row(esc((m.stageLabel || m.stage || ('G' + (i + 1))) + ' \u00b7 ' + hn + ' vs ' + an) + (extra.length ? '<div class="desktop-muted">' + esc(extra.join(' \u00b7 ')) + '</div>' : ''), esc(scoreOf(m)));
    }).join('');
    var awards = Object.keys(t.aw || {}).map(function (code) { return row(esc(awardLabel(code)), esc(holderName(t, code))); }).join('');
    var table = groupTable(t).filter(function (r) { return r.p > 0; }).map(function (r, i) {
      return row((i + 1) + '. ' + tLink(r.abbr, r.name), r.pts + ' pts \u00b7 ' + r.w + '-' + r.d + '-' + r.l);
    }).join('');
    var squads = Object.keys(t.sq || {}).map(function (a) {
      var sq = t.sq[a];
      return row(tLink(a, t.n[a] ? t.n[a].name : a), esc((sq.start || []).join(', ') + (sq.bench && sq.bench.length ? ' | ' + sq.bench.join(', ') : '')));
    }).join('');
    var board = {};
    (t.m || []).forEach(function (m) {
      function add(list, f) { (list || []).forEach(function (g) { var k = cleanName(g.name); if (!k) return; if (!board[k]) board[k] = { g: 0, a: 0 }; board[k][f] += g.n || 0; }); }
      add(m.gh, 'g'); add(m.ga, 'g'); add(m.ah, 'a'); add(m.aa, 'a');
    });
    var boardRows = Object.keys(board).sort(function (a, b) { return board[b].g - board[a].g; }).map(function (n, i) {
      return row((i + 1) + '. ' + pLink(n), board[n].g + ' G \u00b7 ' + board[n].a + ' A');
    }).join('');
    return '<div class="desktop-page">' + hero(hit.cfg.name.toUpperCase(), String(t.meta.e || id).toUpperCase(), esc(t.nt || (t.meta.sts || ''))) +
      (/progress/i.test(t.meta.sts || '') ? card('SERIES', seriesSummary(hit)) : '') +
      '<div class="desktop-grid2">' + card('FILE CARD', meta) + card('AWARDS', awards + (t.ranks || []).map(function (r) { return row(r.rank + '. ' + pLink(r.name), r.points != null ? r.points + ' pts' : ''); }).join('')) + '</div>' +
      (squads ? card('SQUADS', squads) : '') + (table ? card('TABLE', table) : '') +
      '<div class="desktop-grid2">' + card('MATCHES', matches) + card('NAMED SCORERS', boardRows) + '</div></div>';
  }
  function playersPage() {
    return '<div class="desktop-page">' + hero('PLAYER CENTRE', 'PLAYER ARCHIVE', 'CSN totals plus registry players.') +
      '<div class="desktop-grid4">' + players().sort(function (a, b) { return b.goals - a.goals || b.titles - a.titles; }).map(function (p) {
        var info = regOf(p.name) || {};
        return card(pLink(p.name), row('ID', esc(info.id || '\u2014')) + row('Pos', esc(info.position || '\u2014')) + row('G/A', p.goals + '/' + p.assists) + row('Runs', p.runs) + row('W-D-L', p.wins + '-' + p.draws + '-' + p.losses) + row('Titles', p.titles));
      }).join('') + '</div></div>';
  }
  function playerPage(name) {
    name = decodeURIComponent(name || '');
    var p = players().find(function (x) { return String(x.name).toLowerCase() === name.toLowerCase(); });
    var info = regOf(name) || {};
    if (!p && !info.name) return simple('PLAYER', 'Not found.');
    var display = (p && p.name) || info.name || name;
    var last = [];
    allMatches().forEach(function (x) {
      var m = x.m, hp = m.names && m.names[m.home] ? m.names[m.home].player : '', ap = m.names && m.names[m.away] ? m.names[m.away].player : '';
      var hit = String(hp).toLowerCase() === display.toLowerCase() || String(ap).toLowerCase() === display.toLowerCase();
      [].concat(m.gh || [], m.ga || [], m.ah || [], m.aa || []).forEach(function (z) { if (cleanName(z.name).toLowerCase() === display.toLowerCase()) hit = true; });
      if (!hit) return;
      var nm = namesOf(m);
      last.push(row(esc(x.cfg.name + ' \u00b7 ' + (m.event || '') + ' \u00b7 ' + nm.hn + ' vs ' + nm.an), esc(scoreOf(m))));
    });
    return '<div class="desktop-page">' + hero('PLAYER RECORD', display.toUpperCase(), esc(ctxOf(display) || 'Archive totals.')) +
      '<div class="desktop-grid2">' +
      card('REGISTRY', row('ID', esc(info.id || '\u2014')) + row('Clubs', esc((info.clubs || []).join(', ') || '\u2014')) + row('Sports', esc((info.sports || []).join(', ') || '\u2014')) + row('Status', esc(info.status || 'Active'))) +
      card('OUTPUT', row('Goals', p ? p.goals : 0) + row('Assists', p ? p.assists : 0) + row('Runs', p ? p.runs : 0) + row('Hats', p ? p.hatTricks : 0) + row('Matches', p ? p.matches : 0) + row('W-D-L', p ? p.wins + '-' + p.draws + '-' + p.losses : '0-0-0') + row('Titles', p ? p.titles : 0) + row('CS', p ? p.cleanSheets : 0)) +
      '</div>' + card('HONOURS', ((p && p.awards) || []).map(function (a) { return row(esc(a.label || a.code), esc((a.event || '') + ' ' + (a.season || ''))); }).join('')) +
      card('MATCHES', last.slice(-12).reverse().join('')) + '</div>';
  }
  function teamsPage() {
    return '<div class="desktop-page">' + hero('ARCHIVE', 'CLUB DIRECTORY', 'Championship trophies only.') +
      '<div class="desktop-grid4">' + teams().sort(function (a, b) { return b.titles - a.titles; }).map(function (t) {
        return card(tLink(t.abbr, t.name), '<div class="desktop-big">' + t.titles + '</div><div class="desktop-muted">titles</div>' + row('Player', t.player ? pLink(t.player) : '\u2014') + row('W-D-L', t.wins + '-' + t.draws + '-' + t.losses) + row('Form', esc((t.form || []).slice(-6).join(' ') || '\u2014')));
      }).join('') + '</div></div>';
  }
  function teamPage(abbr) {
    abbr = decodeURIComponent(abbr || '');
    var t = teams().find(function (x) { return String(x.abbr) === abbr; });
    if (!t) return simple('CLUB', 'Not found.');
    var matches = allMatches().filter(function (x) { return x.m.home === abbr || x.m.away === abbr; }).slice(-12).reverse().map(function (x) {
      var nm = namesOf(x.m); return row(esc(x.cfg.name + ' \u00b7 ' + (x.m.event || '') + ' \u00b7 ' + nm.hn + ' vs ' + nm.an), esc(scoreOf(x.m)));
    }).join('');
    return '<div class="desktop-page">' + hero('CLUB RECORD', String(t.name).toUpperCase(), 'Owner: ' + (t.player || '\u2014')) +
      '<div class="desktop-grid2">' + card('RECORD', row('Matches', t.matches) + row('W-D-L', t.wins + '-' + t.draws + '-' + t.losses) + row('Titles', t.titles) + row('GF/GA', t.gf + '/' + t.ga) + row('CS', t.cleanSheets)) +
      card('TROPHIES', (t.trophies || []).map(function (z) { return row(esc(z.label || z.code), esc((z.event || '') + ' ' + (z.season || ''))); }).join('')) + '</div>' + card('RESULTS', matches) + '</div>';
  }
  function awardsPage() {
    var rows = [];
    tourneys().forEach(function (x) {
      Object.keys(x.t.aw || {}).forEach(function (code) {
        rows.push(row(esc(x.cfg.name) + ' \u00b7 ' + cLink(x.t.meta.id, x.t.meta.e) + ' \u00b7 ' + esc(awardLabel(code)), esc(holderName(x.t, code))));
      });
    });
    return '<div class="desktop-page">' + hero('ARCHIVE', 'AWARDS', 'Every CSN award block including seasonal honours.') + card('ROLL', rows.join('')) + '</div>';
  }
  function rankingPage() {
    var club = (typeof globalRanks === 'function' ? globalRanks() : teams().sort(function (a, b) { return b.titles - a.titles; })).map(function (r, i) {
      return row((i + 1) + '. ' + tLink(r.abbr, r.name), (r.avgRank != null ? Number(r.avgRank).toFixed(2) + ' avg \u00b7 ' : '') + Math.round(r.totalScore || r.titles || 0));
    }).join('');
    var seasonal = tourneys().filter(function (x) { return isSeasonal(x.t); })[0];
    var pts = seasonal ? (seasonal.t.ranks || []).map(function (r) { return row(r.rank + '. ' + pLink(r.name), r.points != null ? r.points + ' pts' : ''); }).join('') : '';
    return '<div class="desktop-page">' + hero('ARCHIVE', 'RANKING', 'Club rank plus official 2026A points.') +
      '<div class="desktop-grid2">' + card('CLUBS', club) + card('SEASON POINTS', pts) + '</div></div>';
  }
  function recordsPage() {
    return '<div class="desktop-page">' + hero('ARCHIVE', 'RECORDS', 'misc.json marks plus live CSN computations.') +
      card('MARKS', computedRecords().map(function (r) { return row(esc(r.label), esc(r.value + ' \u00b7 ' + r.holder) + (r.context ? '<div class="desktop-muted">' + esc(r.context) + '</div>' : '')); }).join('')) + '</div>';
  }
  function statisticsPage() {
    var f = facts();
    var named = eventScorers().map(function (p, i) { return row((i + 1) + '. ' + pLink(p.name), p.goals + ' G \u00b7 ' + p.assists + ' A \u00b7 ' + p.hats + ' HT'); }).join('');
    var wr = players().filter(function (p) { return p.matches >= 3; }).sort(function (a, b) { return (b.wins / p.matches) - (a.wins / a.matches); }).map(function (p, i) {
      return row((i + 1) + '. ' + pLink(p.name), ((p.wins / p.matches) * 100).toFixed(1) + '% \u00b7 ' + p.wins + '-' + p.draws + '-' + p.losses);
    }).join('');
    return '<div class="desktop-page">' + hero('ARCHIVE', 'STATISTICS', 'Generated from loaded season files.') +
      '<div class="desktop-stats"><div class="desktop-stat"><b>' + f.players + '</b><span>Players</span></div><div class="desktop-stat"><b>' + f.matches + '</b><span>Matches</span></div><div class="desktop-stat"><b>' + f.goals + '</b><span>Goals</span></div><div class="desktop-stat"><b>' + f.pens + '</b><span>Pens</span></div></div>' +
      '<div class="desktop-grid2">' + card('NAMED SCORERS', named) + card('WIN RATE 3+', wr) + '</div></div>';
  }
  function newsPage() { return '<div class="desktop-page">' + hero('NEWS DESK', 'AUTO-GENERATED NEWS', 'From champions, awards, hat-tricks, thrashings and live series.') + card('BULLETIN', buildNews().map(function (n) { return row(esc(n), ''); }).join('')) + '</div>'; }
  function resultsPage() {
    return '<div class="desktop-page">' + hero('RESULTS', 'FULL RESULTS', 'Every stored match.') + card('LIST', allMatches().slice().reverse().map(function (x) {
      var nm = namesOf(x.m);
      return row(esc(x.cfg.name + ' \u00b7 ' + (x.m.event || '') + ' \u00b7 ' + nm.hn + ' vs ' + nm.an), esc(scoreOf(x.m)));
    }).join('')) + '</div>';
  }
  function livePage() {
    var blocks = inProgress().map(function (x) {
      var lines = [row(cLink(x.t.meta.id, x.t.meta.e), esc(x.t.meta.sts || '')), row('Series', seriesSummary(x))];
      var board = {};
      (x.t.m || []).forEach(function (m, i) {
        lines.push(row('Game ' + (m.stage || (i + 1)), esc(scoreOf(m))));
        [].concat(m.gh || [], m.ga || []).forEach(function (g) { board[g.name] = (board[g.name] || 0) + g.n; });
      });
      return card(esc(x.cfg.name), lines.join('')) + card('SERIES SCORERS', Object.keys(board).sort(function (a, b) { return board[b] - board[a]; }).map(function (n) { return row(pLink(n), board[n]); }).join(''));
    }).join('');
    return '<div class="desktop-page">' + hero('LIVE', 'IN-PROGRESS SERIES', 'Open CSN competitions.') + (blocks || card('NONE', '<div class="desktop-muted">Nothing marked in progress.</div>')) + '</div>';
  }
  function aboutPage() {
    var note = (STATE.misc && STATE.misc.seasonNotes && STATE.misc.seasonNotes['2026A']) || '';
    var trophies = ((((STATE.misc || {}).pyramid || {}).trophies) || []).map(function (t) { return row(esc(t.name), esc(t.level || '')); }).join('');
    return '<div class="desktop-page">' + hero('CASPER', 'ABOUT CASPER', esc((STATE.config && STATE.config.about) || '')) +
      '<div class="desktop-doc"><h3>Season note</h3><p>' + esc(note) + '</p></div>' + card('PYRAMID', trophies) + '</div>';
  }
  function docsPage() {
    return '<div class="desktop-page">' + hero('CSN', 'DOCUMENTATION', 'Competition Serialization Notation.') +
      '<div class="desktop-doc"><p>News, tables and records are produced from CSN files. Club trophies come from championship records. gh/ga/ah/aa lines feed named scorer boards.</p></div></div>';
  }
  function route() {
    var h = (location.hash || '#home').slice(1), parts = h.split('/'), v = parts[0] || 'home', arg = parts.slice(1).join('/');
    if (typeof setActive === 'function') {
      setActive(v === 'player' ? 'players' : v === 'team' ? 'teams' : (v === 'competition' || v === 'results' || v === 'live-scores' ? 'archive' : v));
    }
    var html;
    if (v === 'player' && arg) html = playerPage(arg);
    else if (v === 'team' && arg) html = teamPage(arg);
    else if (v === 'competition' && arg) html = competitionPage(arg);
    else if (v === 'home' || !v) html = home();
    else if (v === 'archive' || v === 'competitions') html = archivePage();
    else if (v === 'players') html = playersPage();
    else if (v === 'teams') html = teamsPage();
    else if (v === 'awards') html = awardsPage();
    else if (v === 'ranking') html = rankingPage();
    else if (v === 'records') html = recordsPage();
    else if (v === 'statistics') html = statisticsPage();
    else if (v === 'news') html = newsPage();
    else if (v === 'results') html = resultsPage();
    else if (v === 'live-scores') html = livePage();
    else if (v === 'about') html = aboutPage();
    else if (v === 'docs-csn' || v === 'downloads' || v === 'rules') html = docsPage();
    else html = simple(v.replace(/-/g, ' ').toUpperCase(), 'Desktop archive view.');
    var app = document.getElementById('app');
    if (app) app.innerHTML = html;
  }
  window.CASPER_DESKTOP_RENDER = function () {
    if (typeof STATE === 'undefined') throw new Error('STATE missing');
    window.route = route;
    route();
  };
})();
