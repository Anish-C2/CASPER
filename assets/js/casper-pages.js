function calcTable(t, cfg){
  const table = {};
  Object.keys(t.n).forEach(abbr => { table[abbr] = { abbr, name: t.n[abbr].name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, runs: 0, wkts: 0, ballsF: 0, ballsB: 0, nrr: 0 }; });
  const quota = oversToBallsSafe(t.meta.ov || '1'), allOut = parseInt(t.meta.wk || '1', 10);
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
    r.nrr = (r.ballsF ? r.runs / (r.ballsF / 6) : 0) - (r.ballsB ? r.ga / (r.ballsB / 6) : 0);
  });
  return Object.values(table).sort((x, y) => y.pts - x.pts || y.nrr - x.nrr || y.gd - x.gd || y.gf - x.gf);
}
function renderCompetition(id){
  let found = null, sport = null;
  STATE.sportsCfg.sports.forEach(cfg => {
    const t = (STATE.sports[cfg.id] || { tournaments: [] }).tournaments.find(x => x.meta.id === id);
    if (t) { found = t; sport = STATE.sports[cfg.id]; }
  });
  if (!found) return '<p>Not found.</p>';
  const cfg = sport.cfg, stand = calcTable(found, cfg);
  const extraH = cfg.scoring === 'cricket' ? '<th>Runs</th><th>Wkts</th><th>NRR</th>' : '<th>Goals</th><th>Ag</th><th>Diff</th>';
  const srows = stand.map((r, i) => {
    const extra = cfg.scoring === 'cricket' ? ('<td>' + r.runs + '</td><td>' + r.wkts + '</td><td>' + r.nrr.toFixed(3) + '</td>') : ('<td>' + r.gf + '</td><td>' + r.ga + '</td><td>' + (r.gd > 0 ? '+' : '') + r.gd + '</td>');
    return '<tr><td>' + (i + 1) + '</td><td><a href="#team/' + encodeURIComponent(r.abbr) + '">' + escapeHtml(r.name) + '</a></td><td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.d + '</td><td>' + r.l + '</td>' + extra + '<td>' + r.pts + '</td></tr>';
  }).join('');
  const mrows = found.m.map(m => {
    const hn = found.n[m.home] ? found.n[m.home].name : m.home;
    const an = found.n[m.away] ? found.n[m.away].name : m.away;
    const score = m.kind === 'cricket' ? (m.sh + '/' + m.hw + ' \u2013 ' + m.sa + '/' + m.aw) : (m.sh + '\u2013' + m.sa);
    const scorers = [].concat(m.gh || [], m.ga || []).map(x => x.name + (x.n > 1 ? ' \u00d7' + x.n : '')).join(', ');
    return '<tr><td>' + escapeHtml(m.stageLabel || m.stage || '') + '</td><td>' + escapeHtml(hn) + ' vs ' + escapeHtml(an) + '</td><td>' + score + '</td><td>' + escapeHtml(scorers) + '</td></tr>';
  }).join('');
  const awards = Object.keys(found.aw || {}).map(code => '<tr><td>' + escapeHtml(labelAward(code)) + '</td><td>' + escapeHtml(found.n[found.aw[code]] ? found.n[found.aw[code]].name : found.aw[code]) + '</td></tr>').join('');
  return '<div class="grid2"><div class="box"><h3>' + escapeHtml(found.meta.e || found.meta.id) + ' \u00b7 ' + escapeHtml(cfg.name) + '</h3>' +
    tableWrap('<th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th>' + extraH + '<th>Pts</th>', srows) + '</div>' +
    '<div class="box"><h3>Awards</h3>' + (awards ? tableWrap('<th>Award</th><th>Holder</th>', awards) : '<p class="muted">No awards block.</p>') + '</div></div>' +
    '<div class="box"><h3>Matches</h3>' + tableWrap('<th>Stage</th><th>Match</th><th>Score</th><th>Scorers</th>', mrows) + '</div>';
}
function renderPlayers(){
  const list = collectPlayers().sort((a, b) => b.goals - a.goals || b.runs - a.runs || a.name.localeCompare(b.name));
  const rows = list.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td>' + escapeHtml(clubLabel(p)) + '</td><td>' + p.goals + '</td><td>' + p.runs + '</td><td>' + (p.assists || 0) + '</td><td>' + p.matches + '</td><td>' + p.wins + '-' + p.draws + '-' + p.losses + '</td><td>' + pct(p.winRate) + '</td><td>' + p.titles + '</td><td>' + (p.hatTricks || 0) + '</td><td>' + (p.awards || []).length + '</td></tr>').join('');
  return '<div class="box"><h3>Players</h3>' + tableWrap('<th>#</th><th>Player</th><th>Clubs</th><th>Goals</th><th>Runs</th><th>A</th><th>M</th><th>W-D-L</th><th>Win%</th><th>Titles</th><th>HT</th><th>Awards</th>', rows) + '</div>';
}
function lastMatchesFor(name){
  const out = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    sp.matches.forEach(m => {
      const hp = m.names && m.names[m.home] ? m.names[m.home].player : '';
      const ap = m.names && m.names[m.away] ? m.names[m.away].player : '';
      const named = [].concat(m.gh || [], m.ga || [], m.ah || [], m.aa || []).some(x => String(x.name).toLowerCase() === name);
      if (String(hp).toLowerCase() !== name && String(ap).toLowerCase() !== name && !named) return;
      const side = String(hp).toLowerCase() === name || (m.gh || []).some(x => String(x.name).toLowerCase() === name) ? 'H' : 'A';
      const res = resultOf(m);
      const letter = res === 'D' ? 'D' : ((res === 'H' && side === 'H') || (res === 'A' && side === 'A') ? 'W' : 'L');
      out.push({ cfg, m, letter, score: m.kind === 'cricket' ? (m.sh + '/' + m.hw + '-' + m.sa + '/' + m.aw) : (m.sh + '-' + m.sa) });
    });
  });
  return out.slice(-8).reverse();
}
function barRow(label, n){
  n = Math.max(0, Math.min(99, Math.round(n)));
  return '<div class="bar"><span>' + label + '</span><span><i style="width:' + n + '%"></i></span><b>' + n + '</b></div>';
}
function cabinetHtml(items){
  if (!items || !items.length) return '<p class="muted">No honours yet.</p>';
  return '<div class="cabinet">' + items.map(t => '<div class="trophy' + (t.code === 'ch' ? ' gold' : '') + '"><b>' + escapeHtml(t.label) + '</b><br><span class="muted">' + escapeHtml((t.event || '') + ' ' + (t.season || '')) + '</span></div>').join('') + '</div>';
}
function collectTeams(){
  if (PAGE.mode !== 'hub') return Object.values((currentSport() || { teams: {} }).teams);
  const map = {};
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    Object.values(sp.teams).forEach(t => {
      if (!map[t.abbr]) map[t.abbr] = { abbr: t.abbr, name: t.name, player: t.player, matches: 0, wins: 0, draws: 0, losses: 0, titles: 0, gf: 0, ga: 0, trophies: [], rank: t.rank, bySport: {} };
      map[t.abbr].name = t.name;
      map[t.abbr].matches += t.matches; map[t.abbr].wins += t.wins; map[t.abbr].titles += t.titles;
      map[t.abbr].gf += t.gf; map[t.abbr].ga += t.ga;
      map[t.abbr].trophies = map[t.abbr].trophies.concat(t.trophies || []);
      map[t.abbr].bySport[cfg.id] = t;
    });
  });
  return Object.values(map);
}
function renderTeams(){
  const rows = collectTeams().sort((a, b) => (b.titles || 0) - (a.titles || 0) || (a.rank || 99) - (b.rank || 99)).map(t =>
    '<tr><td>' + (t.rank || '\u2014') + '</td><td><a href="#team/' + encodeURIComponent(t.abbr) + '">' + escapeHtml(t.name) + '</a></td><td>' + escapeHtml(t.player || '') + '</td><td>' + t.matches + '</td><td>' + t.wins + '</td><td>' + t.gf + '</td><td>' + t.titles + '</td><td>' + (t.trophies || []).length + '</td></tr>').join('');
  return '<div class="box"><h3>Clubs</h3>' + tableWrap('<th>#</th><th>Club</th><th>Listed player</th><th>P</th><th>W</th><th>For</th><th>Titles</th><th>Honours</th>', rows) + '</div>';
}
function renderTeam(abbr){
  abbr = decodeURIComponent(abbr);
  const t = collectTeams().find(x => x.abbr === abbr);
  if (!t) return '<p>Club not found.</p>';
  const owners = Object.keys(STATE.registry || {}).filter(k => (STATE.registry[k].clubs || []).indexOf(abbr) >= 0).map(k => STATE.registry[k].name || k);
  const blocks = STATE.sportsCfg.sports.map(cfg => {
    const row = t.bySport && t.bySport[cfg.id];
    if (!row) return '';
    return '<div class="box"><h3>' + escapeHtml(cfg.name) + '</h3>' + tableWrap('<th>Rank</th><th>P</th><th>W-D-L</th><th>' + unitOf(cfg) + '</th><th>Diff</th><th>Win%</th><th>Titles</th>',
      '<tr><td>' + row.rank + '</td><td>' + row.matches + '</td><td>' + row.wins + '-' + row.draws + '-' + row.losses + '</td><td>' + row.gf + '</td><td>' + (row.gd > 0 ? '+' : '') + row.gd + '</td><td>' + pct(row.winRate) + '</td><td>' + row.titles + '</td></tr>') + '</div>';
  }).join('');
  return '<div class="layout-player"><aside class="side box"><h3>Navigate</h3>' + navLinks() + '</aside><section class="stack"><div class="box"><h2 class="pname">' + escapeHtml(t.name) + '</h2><p>Owners / listed: ' + (owners.length ? owners.map(n => '<a href="#player/' + encodeURIComponent(n) + '">' + escapeHtml(n) + '</a>').join(', ') : escapeHtml(t.player || '\u2014')) + '</p></div>' + blocks + '</section><aside class="box"><h3>Trophy cabinet</h3>' + cabinetHtml(t.trophies) + '</aside></div>';
}
function renderAwards(){
  const rows = [];
  allTourneys().forEach(({ t, sport }) => {
    Object.keys(t.aw || {}).forEach(code => {
      rows.push('<tr><td>' + escapeHtml(sport.name) + '</td><td><a href="#competition/' + encodeURIComponent(t.meta.id) + '">' + escapeHtml(t.meta.e || '') + '</a></td><td>' + escapeHtml(labelAward(code)) + '</td><td>' + escapeHtml(t.n[t.aw[code]] ? t.n[t.aw[code]].name : t.aw[code]) + '</td></tr>');
    });
  });
  return '<div class="box"><h3>Awards</h3>' + tableWrap('<th>Sport</th><th>Event</th><th>Award</th><th>Holder</th>', rows.join('')) + '</div>';
}
function renderRanking(){
  return '<div class="box"><h3>Global club ranking</h3>' +
    tableWrap('<th>#</th><th>Club</th>' + STATE.sportsCfg.sports.map(s => '<th>' + escapeHtml(s.name) + '</th>').join('') + '<th>Avg</th><th>Score</th>',
      globalRanks().map((r, i) => '<tr class="' + (i === 0 ? 'rank-gold' : '') + '"><td>' + (i + 1) + '</td><td><a href="#team/' + encodeURIComponent(r.abbr) + '">' + escapeHtml(r.name) + '</a></td>' +
        STATE.sportsCfg.sports.map(s => '<td>' + (r.ranks[s.id] != null ? r.ranks[s.id] : '\u2014') + '</td>').join('') +
        '<td>' + r.avgRank.toFixed(2) + '</td><td>' + Math.round(r.totalScore) + '</td></tr>').join('')) + '</div>';
}
function computedRecords(){
  const out = (STATE.misc.records || []).map(r => '<tr><td>' + escapeHtml(r.label) + '</td><td>' + escapeHtml(r.value) + '</td><td>' + escapeHtml(r.holder) + '</td><td>' + escapeHtml(r.context || '') + '</td></tr>');
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    const top = Object.values(sp.players).sort((a, b) => b.goals - a.goals)[0];
    if (top) out.push('<tr><td>Most ' + unitOf(cfg).toLowerCase() + ' \u00b7 ' + escapeHtml(cfg.name) + '</td><td>' + top.goals + '</td><td>' + escapeHtml(top.name) + '</td><td>Archive total</td></tr>');
  });
  return out.join('');
}
function renderRecords(){ return '<div class="box"><h3>Records</h3>' + tableWrap('<th>Record</th><th>Value</th><th>Holder</th><th>Context</th>', computedRecords()) + '</div>'; }
function renderStatistics(){
  const f = archiveFacts();
  const people = collectPlayers().sort((a, b) => b.goals - a.goals);
  const sportRows = STATE.sportsCfg.sports.map(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return '';
    const output = Object.values(sp.teams).reduce((s, t) => s + t.gf, 0);
    const titles = Object.values(sp.teams).reduce((s, t) => s + t.titles, 0);
    return '<tr><td>' + escapeHtml(cfg.name) + '</td><td>' + sp.tournaments.length + '</td><td>' + sp.matches.length + '</td><td>' + Object.keys(sp.teams).length + '</td><td>' + Object.keys(sp.players).length + '</td><td>' + unitOf(cfg) + '</td><td>' + output + '</td><td>' + titles + '</td><td>' + escapeHtml(cfg.crown) + '</td></tr>';
  }).join('');
  return '<div class="stack"><div class="box"><h3>Archive totals</h3><div class="banner">' +
    [['Clubs', f.clubs], ['Players', f.players], ['Competitions', f.tours], ['Matches', f.matches], ['Goals', f.goals], ['Runs', f.runs], ['Clean sheets', f.cs], ['Pens', f.pens], ['Hat-tricks', f.ht], ['Awards', f.awards]].map(x => '<div class="cell"><div class="n">' + x[1] + '</div><div class="l">' + x[0] + '</div></div>').join('') +
    '</div></div><div class="box"><h3>By sport</h3>' + tableWrap('<th>Sport</th><th>Comps</th><th>Matches</th><th>Clubs</th><th>Players</th><th>Unit</th><th>Output</th><th>Titles</th><th>Crown</th>', sportRows) + '</div>' +
    championsBoard() +
    '<div class="box"><h3>Player output</h3>' + tableWrap('<th>Player</th><th>Clubs</th><th>G</th><th>R</th><th>A</th><th>M</th><th>Win%</th><th>Titles</th><th>HT</th>', people.map(p => '<tr><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td>' + escapeHtml(clubLabel(p)) + '</td><td>' + p.goals + '</td><td>' + p.runs + '</td><td>' + p.assists + '</td><td>' + p.matches + '</td><td>' + pct(p.winRate) + '</td><td>' + p.titles + '</td><td>' + p.hatTricks + '</td></tr>').join('')) + '</div></div>';
}
function renderNews(){ return '<div class="box"><h3>News desk</h3>' + generateNews().map(n => '<div class="news">' + escapeHtml(n) + '</div>').join('') + '</div>'; }
function renderAbout(){ return '<div class="box"><h3>About</h3><p>' + escapeHtml(STATE.config.about || '') + '</p><p class="muted">A player may own more than one club. Edit clubs[] in player-registry.json.</p></div>'; }
