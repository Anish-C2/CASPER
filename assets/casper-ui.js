function sportSwitch() {
  const cur = PAGE.mode === 'hub' ? 'hub' : PAGE.sport;
  const links = ['<a href="index.html"' + (cur === 'hub' ? ' class="on"' : '') + '>CASPER</a>'].concat(
    STATE.sportsCfg.sports.map(s => '<a href="' + s.page + '"' + (cur === s.id ? ' class="on"' : '') + '>' + escapeHtml(s.name) + '</a>')
  );
  return '<div class="sport-switch">' + links.join('') + '</div>';
}
function currentSport() { return PAGE.mode === 'hub' ? null : (STATE.sports[PAGE.sport] || null); }
function headerPaint() {
  const cfg = currentSport() ? currentSport().cfg : { name: 'CASPER' };
  document.title = (PAGE.mode === 'hub' ? 'CASPER' : ('CASPER ' + cfg.name)) + ' \u2014 Archive';
  const tag = document.getElementById('site-tagline');
  if (tag) tag.textContent = STATE.sportsCfg.tagline || STATE.config.tagline || '';
  const name = document.getElementById('site-name');
  if (name) name.innerHTML = PAGE.mode === 'hub' ? 'CASPER' : '<a href="index.html" style="color:inherit;text-decoration:none">CASPER</a> ' + escapeHtml(cfg.name);
  const wrap = document.getElementById('sport-switch-slot');
  if (wrap) wrap.innerHTML = sportSwitch();
}
function setActive(view) {
  document.querySelectorAll('#main-nav a').forEach(a => a.classList.toggle('active', a.getAttribute('data-view') === view));
}
function tableWrap(head, rows) {
  return '<table><thead><tr>' + head + '</tr></thead><tbody>' + (rows || '') + '</tbody></table>';
}
function renderGlobalBlock() {
  const rows = globalRanks().map((r, i) => {
    const bits = STATE.sportsCfg.sports.map(s => '<td>' + (r.ranks[s.id] != null ? r.ranks[s.id] : '\u2014') + '</td>').join('');
    return '<tr class="' + (i === 0 ? 'rank-gold' : '') + '"><td>' + (i + 1) + '</td><td>' + escapeHtml(r.name) + '</td>' + bits + '<td><b>' + r.avgRank.toFixed(2) + '</b></td><td>' + r.sportsPlayed + '</td><td>' + r.crowns + '</td></tr>';
  }).join('');
  const heads = STATE.sportsCfg.sports.map(s => '<th>' + escapeHtml(s.name) + ' rank</th>').join('');
  return '<div class="panel"><h2><i class="fa-solid fa-globe i"></i>Global club ranking</h2><p class="muted">Sport ranks come from each archive. Average rank is the mean of ranks in sports a club actually played.</p>' + tableWrap('<th>World #</th><th>Club</th>' + heads + '<th>Avg rank</th><th>Sports</th><th>Crowns</th>', rows) + '</div>';
}
function renderHubHome() {
  const cards = STATE.sportsCfg.sports.map(cfg => {
    const sp = STATE.sports[cfg.id];
    const ch = crownWinner(cfg);
    const n = ch && sp ? teamName(sp, ch) : '\u2014';
    const m = sp ? sp.matches.length : 0;
    return '<div class="panel"><h2>' + escapeHtml(cfg.name) + '</h2><p class="muted">' + escapeHtml(cfg.crown) + ' \u00b7 ' + m + ' matches</p><p>Champion: <b>' + escapeHtml(n) + '</b></p><p><a href="' + cfg.page + '">Open ' + escapeHtml(cfg.name) + '</a></p></div>';
  }).join('');
  const trebleBits = STATE.sportsCfg.sports.map(cfg => {
    const ch = crownWinner(cfg);
    const sp = STATE.sports[cfg.id];
    const name = ch && sp ? teamName(sp, ch) : 'unawarded';
    return '<tr><td>' + escapeHtml(cfg.name) + '</td><td>' + escapeHtml(cfg.crown) + '</td><td>' + escapeHtml(name) + '</td></tr>';
  }).join('');
  const holders = {};
  STATE.sportsCfg.sports.forEach(cfg => { const ch = crownWinner(cfg); if (ch) holders[ch] = (holders[ch] || 0) + 1; });
  const need = STATE.sportsCfg.sports.length;
  const trebleClub = Object.keys(holders).find(k => holders[k] === need);
  const trebleLine = trebleClub ? (teamName(Object.values(STATE.sports)[0], trebleClub) + ' hold the Great CASPER Treble.') : 'The Great CASPER Treble is vacant.';
  return '<h1>CASPER</h1><p class="muted">' + escapeHtml(STATE.config.about || STATE.sportsCfg.tagline || '') + '</p><div class="treble-box"><h2>The Great CASPER Treble</h2><p>One club must win the crown event named in sports.json in every sport. Champions come from CSN aw(ch=\u2026).</p><table><tr><th>Sport</th><th>Crown event</th><th>Champion</th></tr>' + trebleBits + '</table><p><b>' + escapeHtml(trebleLine) + '</b></p></div><div class="grid">' + cards + '</div>' + renderGlobalBlock();
}
function renderHome() {
  if (PAGE.mode === 'hub') return renderHubHome();
  const sp = currentSport();
  if (!sp) return '<p class="muted">No archive loaded.</p>';
  const players = Object.values(sp.players);
  const crown = crownWinner(sp.cfg);
  const rows = sp.ranked.map(t => '<tr class="' + (t.rank === 1 ? 'rank-gold' : '') + '"><td>' + t.rank + '</td><td><a href="#team/' + encodeURIComponent(t.abbr) + '">' + escapeHtml(t.name) + '</a></td><td>' + escapeHtml(t.player || '') + '</td><td>' + t.matches + '</td><td>' + t.wins + '</td><td>' + t.draws + '</td><td>' + t.losses + '</td><td>' + t.gf + '</td><td>' + t.ga + '</td><td>' + (t.gd > 0 ? '+' : '') + t.gd + '</td><td>' + t.titles + '</td><td><b>' + t.rank + '</b></td></tr>').join('');
  return '<h1>' + escapeHtml(sp.cfg.name) + ' dashboard</h1><div class="grid-stats"><div class="cell"><div class="n">' + sp.tournaments.length + '</div><div class="l">Competitions</div></div><div class="cell"><div class="n">' + Object.keys(sp.teams).length + '</div><div class="l">Clubs</div></div><div class="cell"><div class="n">' + players.length + '</div><div class="l">Players</div></div><div class="cell"><div class="n">' + sp.matches.length + '</div><div class="l">Matches</div></div><div class="cell"><div class="n">' + escapeHtml(crown ? teamName(sp, crown) : '\u2014') + '</div><div class="l">' + escapeHtml(sp.cfg.crown) + '</div></div></div><div class="panel"><h2>' + escapeHtml(sp.cfg.name) + ' ranking</h2>' + tableWrap('<th>#</th><th>Club</th><th>Player</th><th>P</th><th>W</th><th>D</th><th>L</th><th>F</th><th>A</th><th>Diff</th><th>Titles</th><th>Rank</th>', rows) + '<p class="muted">Computed from CSN. Nothing in this table is typed into the HTML.</p></div>' + renderGlobalBlock();
}
function allTourneys() {
  if (PAGE.mode === 'hub') return STATE.sportsCfg.sports.flatMap(s => (STATE.sports[s.id] || { tournaments: [] }).tournaments.map(t => ({ t, sport: s })));
  const sp = currentSport();
  return sp ? sp.tournaments.map(t => ({ t, sport: sp.cfg })) : [];
}
function renderArchive() {
  const list = allTourneys();
  if (!list.length) return '<h1>Archive</h1><p class="muted">No CSN competitions loaded.</p>';
  const rows = list.map(({ t, sport }) => '<tr><td>' + escapeHtml(sport.name) + '</td><td><a href="#competition/' + encodeURIComponent(t.meta.id) + '">' + escapeHtml(t.meta.e || t.meta.id) + '</a></td><td>' + escapeHtml(t.meta.s || '') + '</td><td>' + escapeHtml(t.meta.sts || '') + '</td><td>' + t.m.length + '</td><td>' + escapeHtml(t.aw.ch ? teamName(STATE.sports[sport.id], t.aw.ch) : '\u2014') + '</td></tr>').join('');
  return '<h1>Archive</h1>' + tableWrap('<th>Sport</th><th>Competition</th><th>Season</th><th>Status</th><th>Matches</th><th>Champion</th>', rows);
}
function calcTable(t, cfg) {
  const table = {};
  Object.keys(t.n).forEach(abbr => { table[abbr] = { abbr, name: t.n[abbr].name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, runs: 0, wkts: 0, ballsF: 0, ballsB: 0, nrr: 0 }; });
  const quota = oversToBallsSafe(t.meta.ov || t.meta.overs || '1');
  const allOut = parseInt(t.meta.wk || '1', 10);
  t.m.forEach(m => {
    if (!table[m.home] || !table[m.away]) return;
    const a = table[m.home], b = table[m.away];
    a.p++; b.p++; a.gf += m.sh; b.gf += m.sa; a.ga += m.sa; b.ga += m.sh;
    if (m.kind === 'cricket') {
      a.runs += m.sh; b.runs += m.sa; a.wkts += m.hw; b.wkts += m.aw;
      const af = m.hw >= allOut ? quota : (m.hb != null ? m.hb : quota);
      const bf = m.aw >= allOut ? quota : (m.ab != null ? m.ab : quota);
      a.ballsF += af; b.ballsF += bf; a.ballsB += bf; b.ballsB += af;
    }
    const res = resultOf(m);
    if (res === 'H') { a.w++; b.l++; a.pts += cfg.winPts; }
    else if (res === 'A') { b.w++; a.l++; b.pts += cfg.winPts; }
    else { a.d++; b.d++; a.pts++; b.pts++; }
  });
  Object.values(table).forEach(r => {
    r.gd = r.gf - r.ga;
    const rrF = r.ballsF ? r.runs / (r.ballsF / 6) : 0;
    const rrAg = r.ballsB ? r.ga / (r.ballsB / 6) : 0;
    r.nrr = rrF - rrAg;
  });
  return Object.values(table).sort((x, y) => y.pts - x.pts || (y.nrr - x.nrr) || (y.gd - x.gd) || y.gf - x.gf);
}
function renderCompetition(id) {
  let found = null, sport = null;
  STATE.sportsCfg.sports.forEach(cfg => {
    const t = (STATE.sports[cfg.id] || { tournaments: [] }).tournaments.find(x => x.meta.id === id);
    if (t) { found = t; sport = STATE.sports[cfg.id]; }
  });
  if (!found) return '<p>Competition not found.</p>';
  const cfg = sport.cfg;
  const stand = calcTable(found, cfg);
  const srows = stand.map((r, i) => {
    const extra = cfg.scoring === 'cricket' ? ('<td>' + r.runs + '</td><td>' + r.wkts + '</td><td>' + r.nrr.toFixed(3) + '</td>') : ('<td>' + r.gf + '</td><td>' + r.ga + '</td><td>' + (r.gd > 0 ? '+' : '') + r.gd + '</td>');
    return '<tr><td>' + (i + 1) + '</td><td><a href="#team/' + encodeURIComponent(r.abbr) + '">' + escapeHtml(r.name) + '</a></td><td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.d + '</td><td>' + r.l + '</td>' + extra + '<td><b>' + r.pts + '</b></td></tr>';
  }).join('');
  const shead = cfg.scoring === 'cricket' ? '<th>#</th><th>Team</th><th>P</th><th>W</th><th>T</th><th>L</th><th>Runs</th><th>Wkts</th><th>NRR</th><th>Pts</th>' : '<th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th>';
  const mrows = found.m.map(m => {
    const hn = found.n[m.home] ? found.n[m.home].name : m.home;
    const an = found.n[m.away] ? found.n[m.away].name : m.away;
    let score = m.kind === 'cricket' ? (m.sh + '/' + m.hw + (m.ho ? ' (' + m.ho + ')' : '') + ' \u2013 ' + m.sa + '/' + m.aw + (m.ao ? ' (' + m.ao + ')' : '')) : (m.sh + '\u2013' + m.sa + (m.p ? ' (' + m.p[0] + '\u2013' + m.p[1] + ' pens)' : ''));
    const gline = [].concat((m.gh || []).map(x => x.name + ' \u00d7' + x.n), (m.ga || []).map(x => x.name + ' \u00d7' + x.n));
    return '<tr><td>' + escapeHtml(m.stageLabel || m.stage || '') + '</td><td>' + escapeHtml(hn) + ' vs ' + escapeHtml(an) + '</td><td>' + escapeHtml(score) + '</td><td>' + escapeHtml(gline.join(', ') || '\u2014') + '</td></tr>';
  }).join('');
  const awRows = Object.keys(found.aw).map(k => {
    const label = (STATE.config.awardLabels && STATE.config.awardLabels[k]) || k;
    const val = found.aw[k];
    const name = found.n[val] ? found.n[val].name : val;
    return '<tr><td>' + escapeHtml(label) + '</td><td>' + escapeHtml(name) + '</td></tr>';
  }).join('');
  let squad = '';
  Object.keys(found.sq || {}).forEach(abbr => {
    const sq = found.sq[abbr];
    squad += '<p><b>' + escapeHtml(teamName(sport, abbr)) + '</b> start: ' + escapeHtml((sq.start || []).join(', ')) + ' \u00b7 bench: ' + escapeHtml((sq.bench || []).join(', ') || '\u2014') + '</p>';
  });
  return '<h1>' + escapeHtml(found.meta.e || found.meta.id) + '</h1><p class="muted">' + escapeHtml(found.meta.s || '') + ' \u00b7 ' + escapeHtml(found.meta.sts || '') + ' \u00b7 ' + escapeHtml(cfg.name) + '</p>' + squad + '<div class="panel"><h2>Table</h2>' + tableWrap(shead, srows) + '</div><div class="panel"><h2>Matches</h2>' + tableWrap('<th>Stage</th><th>Match</th><th>Score</th><th>Named scorers</th>', mrows) + '</div><div class="panel"><h2>Awards</h2>' + (awRows ? tableWrap('<th>Award</th><th>Holder</th>', awRows) : '<p class="muted">No aw() block in this file.</p>') + '</div>';
}
function collectPlayers() {
  if (PAGE.mode !== 'hub') return Object.values((currentSport() || { players: {} }).players);
  const map = {};
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    Object.values(sp.players).forEach(p => {
      const k = p.name.toLowerCase();
      if (!map[k]) map[k] = { name: p.name, goals: 0, assists: 0, matches: 0, titles: 0, awards: [], teams: new Set() };
      map[k].goals += p.goals; map[k].assists += p.assists; map[k].matches += p.matches; map[k].titles += p.titles;
      map[k].awards = map[k].awards.concat(p.awards); p.teams.forEach(t => map[k].teams.add(t));
    });
  });
  return Object.values(map);
}
function renderPlayers() {
  const list = collectPlayers().sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name));
  const rows = list.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td>' + escapeHtml([...(p.teams || [])].join(', ')) + '</td><td>' + p.goals + '</td><td>' + (p.assists || 0) + '</td><td>' + p.matches + '</td><td>' + p.titles + '</td><td>' + (p.awards || []).length + '</td></tr>').join('');
  return '<h1>Players</h1><p class="muted">From CSN names, squads and named scorers/assists.</p>' + tableWrap('<th>#</th><th>Player</th><th>Clubs</th><th>Goals</th><th>Assists</th><th>M</th><th>Titles</th><th>Awards</th>', rows);
}
function renderPlayer(name) {
  const key = decodeURIComponent(name);
  const p = collectPlayers().find(x => x.name.toLowerCase() === key.toLowerCase());
  if (!p) return '<p>Player not found.</p>';
  const ctx = STATE.config.playerContext && STATE.config.playerContext[p.name.toLowerCase()];
  const aw = (p.awards || []).map(a => '<tr><td>' + escapeHtml(a.label) + '</td><td>' + escapeHtml(a.event) + '</td><td>' + escapeHtml(a.season) + '</td></tr>').join('');
  return '<h1>' + escapeHtml(p.name) + '</h1>' + (ctx ? '<p>' + escapeHtml(ctx) + '</p>' : '') + '<div class="grid-stats"><div class="cell"><div class="n">' + p.goals + '</div><div class="l">Goals</div></div><div class="cell"><div class="n">' + (p.assists || 0) + '</div><div class="l">Assists</div></div><div class="cell"><div class="n">' + p.matches + '</div><div class="l">Matches</div></div><div class="cell"><div class="n">' + p.titles + '</div><div class="l">Titles</div></div></div><div class="panel"><h2>Awards</h2>' + (aw ? tableWrap('<th>Award</th><th>Event</th><th>Season</th>', aw) : '<p class="muted">No award rows yet.</p>') + '</div>';
}
function collectTeams() {
  if (PAGE.mode !== 'hub') return Object.values((currentSport() || { teams: {} }).teams);
  const map = {};
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    Object.values(sp.teams).forEach(t => {
      if (!map[t.abbr]) map[t.abbr] = { abbr: t.abbr, name: t.name, player: t.player, matches: 0, wins: 0, titles: 0, gf: 0, ga: 0, rank: t.rank };
      map[t.abbr].name = t.name; map[t.abbr].matches += t.matches; map[t.abbr].wins += t.wins; map[t.abbr].titles += t.titles; map[t.abbr].gf += t.gf; map[t.abbr].ga += t.ga;
    });
  });
  return Object.values(map);
}
function renderTeams() {
  const list = collectTeams().sort((a, b) => (a.rank || 99) - (b.rank || 99) || b.titles - a.titles);
  const rows = list.map(t => '<tr><td>' + (t.rank || '\u2014') + '</td><td><a href="#team/' + encodeURIComponent(t.abbr) + '">' + escapeHtml(t.name) + '</a></td><td>' + escapeHtml(t.player || '') + '</td><td>' + t.matches + '</td><td>' + t.wins + '</td><td>' + t.gf + '</td><td>' + t.ga + '</td><td>' + t.titles + '</td></tr>').join('');
  return '<h1>Teams</h1>' + tableWrap('<th>Rank</th><th>Club</th><th>Main player</th><th>P</th><th>W</th><th>F</th><th>A</th><th>Titles</th>', rows);
}
function renderTeam(abbr) {
  abbr = decodeURIComponent(abbr);
  const chunks = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp || !sp.teams[abbr]) return;
    const t = sp.teams[abbr];
    chunks.push('<div class="panel"><h2>' + escapeHtml(cfg.name) + '</h2><p>Rank <b>' + t.rank + '</b> \u00b7 P ' + t.matches + ' W ' + t.wins + ' D ' + t.draws + ' L ' + t.losses + ' \u00b7 F ' + t.gf + ' A ' + t.ga + ' \u00b7 titles ' + t.titles + '</p></div>');
  });
  const name = ((Object.values(STATE.sports).map(s => s.teams[abbr]).find(Boolean)) || {}).name || abbr;
  if (!chunks.length) return '<p>Team not found.</p>';
  return '<h1>' + escapeHtml(name) + '</h1>' + chunks.join('') + renderGlobalBlock();
}
function renderAwards() {
  const rows = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    if (PAGE.mode !== 'hub' && cfg.id !== PAGE.sport) return;
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    sp.tournaments.forEach(t => {
      Object.keys(t.aw).forEach(code => {
        const label = (STATE.config.awardLabels && STATE.config.awardLabels[code]) || code;
        const val = t.aw[code];
        const name = t.n[val] ? t.n[val].name + (t.n[val].player ? ' (' + t.n[val].player + ')' : '') : val;
        rows.push('<tr><td>' + escapeHtml(cfg.name) + '</td><td>' + escapeHtml(t.meta.e || t.meta.id) + '</td><td>' + escapeHtml(t.meta.s || '') + '</td><td>' + escapeHtml(label) + '</td><td>' + escapeHtml(name) + '</td></tr>');
      });
    });
  });
  return '<h1>Awards</h1><p class="muted">Every row is an aw() entry. Labels come from config.json.</p>' + (rows.length ? tableWrap('<th>Sport</th><th>Competition</th><th>Season</th><th>Award</th><th>Holder</th>', rows.join('')) : '<p class="muted">No awards in loaded files.</p>');
}
function renderRanking() {
  const sportBlock = (PAGE.mode === 'hub' || !currentSport()) ? '' : ('<div class="panel"><h2>' + escapeHtml(currentSport().cfg.name) + ' ranking</h2>' + tableWrap('<th>#</th><th>Club</th><th>Model pts</th><th>Titles</th><th>Win%</th>', currentSport().ranked.map(t => '<tr class="' + (t.rank === 1 ? 'rank-gold' : '') + '"><td>' + t.rank + '</td><td><a href="#team/' + encodeURIComponent(t.abbr) + '">' + escapeHtml(t.name) + '</a></td><td>' + t.sportPts.toFixed(1) + '</td><td>' + t.titles + '</td><td>' + (t.winRate * 100).toFixed(1) + '</td></tr>').join('')) + '</div>');
  return '<h1>Ranking</h1>' + sportBlock + renderGlobalBlock();
}
function renderRecords() {
  const recs = (STATE.misc.records || []).map(r => '<tr><td>' + escapeHtml(r.label) + '</td><td>' + escapeHtml(r.value) + '</td><td>' + escapeHtml(r.holder) + '</td><td>' + escapeHtml(r.context || '') + '</td></tr>').join('');
  const dyn = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    let best = 0, pair = '';
    sp.matches.forEach(m => { const tot = m.sh + m.sa; if (tot > best) { best = tot; pair = m.home + ' ' + m.sh + '\u2013' + m.sa + ' ' + m.away + ' \u00b7 ' + m.event; } });
    if (best) dyn.push('<tr><td>Highest scoring ' + escapeHtml(cfg.name) + ' match</td><td>' + best + '</td><td>\u2014</td><td>' + escapeHtml(pair) + '</td></tr>');
  });
  return '<h1>Records</h1><p class="muted">misc.json plus values computed from matches.</p>' + tableWrap('<th>Record</th><th>Value</th><th>Holder</th><th>Context</th>', recs + dyn.join(''));
}
function renderStatistics() {
  const rows = STATE.sportsCfg.sports.map(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return '';
    return '<tr><td>' + escapeHtml(cfg.name) + '</td><td>' + sp.tournaments.length + '</td><td>' + Object.keys(sp.teams).length + '</td><td>' + Object.keys(sp.players).length + '</td><td>' + sp.matches.length + '</td><td>' + Object.values(sp.teams).reduce((s, t) => s + t.gf, 0) + '</td></tr>';
  }).join('');
  return '<h1>Statistics</h1>' + tableWrap('<th>Sport</th><th>Competitions</th><th>Clubs</th><th>Players</th><th>Matches</th><th>Goals / runs</th>', rows) + renderGlobalBlock();
}
function renderAbout() {
  return '<h1>About</h1><p>' + escapeHtml(STATE.config.about || '') + '</p><p class="muted">Generated from sports.json, config.json and CSN manifests. Scores and rankings are not hard-coded in the HTML.</p>';
}
function route() {
  const hash = (location.hash || '#home').slice(1);
  const parts = hash.split('/');
  const view = parts[0], arg = parts.slice(1).join('/');
  setActive(['competition', 'player', 'team'].includes(view) ? (view === 'player' ? 'players' : view === 'team' ? 'teams' : 'competitions') : view);
  let html;
  if (view === 'home' || !view) html = renderHome();
  else if (view === 'archive' || view === 'competitions') html = renderArchive();
  else if (view === 'competition' && arg) html = renderCompetition(arg);
  else if (view === 'players') html = renderPlayers();
  else if (view === 'player' && arg) html = renderPlayer(arg);
  else if (view === 'teams') html = renderTeams();
  else if (view === 'team' && arg) html = renderTeam(arg);
  else if (view === 'awards') html = renderAwards();
  else if (view === 'ranking') html = renderRanking();
  else if (view === 'records') html = renderRecords();
  else if (view === 'statistics') html = renderStatistics();
  else if (view === 'about') html = renderAbout();
  else html = renderHome();
  document.getElementById('app').innerHTML = html;
}
async function loadJson(path, fallback) {
  try { const r = await fetch(path); if (!r.ok) return fallback; return await r.json(); } catch (e) { return fallback; }
}
async function boot() {
  STATE.config = await loadJson('config.json', {});
  STATE.sportsCfg = await loadJson('sports.json', { sports: [] });
  STATE.misc = await loadJson('misc.json', {});
  for (const cfg of STATE.sportsCfg.sports) {
    let files = [];
    try { const man = await fetch(cfg.manifest); if (man.ok) files = await man.json(); } catch (e) { files = []; }
    const tours = [];
    for (const f of files) {
      try { const txt = await fetch(cfg.dataDir + '/' + f).then(r => r.text()); tours.push.apply(tours, parseCSN(txt)); } catch (e) {}
    }
    STATE.sports[cfg.id] = buildSport(cfg, tours);
  }
  headerPaint();
  route();
  window.addEventListener('hashchange', route);
}
boot();
