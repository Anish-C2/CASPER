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
function tableWrap(head, rows) { return '<table><thead><tr>' + head + '</tr></thead><tbody>' + (rows || '') + '</tbody></table>'; }
function pct(x) { return ((x || 0) * 100).toFixed(1) + '%'; }
function clubList(p, sp) {
  if (p.clubNames && p.clubNames.size) return [...p.clubNames].join(', ');
  if (!sp) return [...(p.teams || [])].join(', ');
  return [...(p.teams || [])].map(a => teamName(sp, a)).join(', ');
}
function cabinetHtml(items) {
  if (!items || !items.length) return '<p class="muted">No trophies in the loaded archive.</p>';
  return '<div class="cabinet">' + items.map(t => {
    const gold = t.code === 'ch' || /tsar|crown|champion/i.test(t.label || '');
    return '<div class="trophy' + (gold ? ' gold' : '') + '"><div class="t">' + escapeHtml(t.label) + '</div><div class="s">' + escapeHtml((t.event || '') + ' ' + (t.season || '')) + '</div></div>';
  }).join('') + '</div>';
}
function generateNews() {
  const items = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    const ch = crownWinner(cfg);
    if (ch) items.push({ k: 100, html: '<b>' + escapeHtml(cfg.name) + ' crown</b>' + escapeHtml(teamName(sp, ch)) + ' hold the ' + escapeHtml(cfg.crown) + '.' });
    sp.tournaments.forEach(t => {
      if (t.aw.ch) items.push({ k: 80, html: '<b>' + escapeHtml(t.meta.e || t.meta.id) + ' ' + escapeHtml(t.meta.s || '') + '</b>Champion: ' + escapeHtml(t.n[t.aw.ch] ? t.n[t.aw.ch].name : t.aw.ch) + (t.aw.ru && t.n[t.aw.ru] ? ' \u00b7 runner-up ' + escapeHtml(t.n[t.aw.ru].name) : '') + '.' });
    });
    sp.matches.slice(-8).reverse().forEach(m => {
      const hn = m.names && m.names[m.home] ? m.names[m.home].name : m.home;
      const an = m.names && m.names[m.away] ? m.names[m.away].name : m.away;
      const res = resultOf(m);
      const winner = res === 'H' ? hn : res === 'A' ? an : 'Draw';
      const score = m.kind === 'cricket' ? (m.sh + '/' + m.hw + ' vs ' + m.sa + '/' + m.aw) : (m.sh + '\u2013' + m.sa);
      const hats = [].concat(m.gh || [], m.ga || []).filter(x => x.n >= 3).map(x => x.name + ' hat-trick');
      items.push({ k: 40, html: '<b>' + escapeHtml(m.event) + (m.stageLabel ? ' ' + m.stageLabel : '') + '</b>' + escapeHtml(hn) + ' ' + score + ' ' + escapeHtml(an) + '. ' + (res === 'D' ? 'Draw.' : escapeHtml(winner) + ' won.') + (hats.length ? ' ' + hats.join(', ') + '.' : '') });
    });
    const top = Object.values(sp.players).sort((a, b) => b.goals - a.goals)[0];
    if (top && top.goals) items.push({ k: 60, html: '<b>' + escapeHtml(cfg.name) + ' scoring lead</b>' + escapeHtml(top.name) + ' leads with ' + top.goals + ' ' + unitOf(cfg).toLowerCase() + ' from ' + top.matches + ' matches (' + top.gpg.toFixed(2) + ' per match).' });
  });
  items.sort((a, b) => b.k - a.k);
  return items.slice(0, 18);
}
function renderNews() {
  const items = generateNews();
  return '<h1>News</h1><p class="muted">Auto-written from the archive whenever CSN files change. No hand-written headlines.</p>' + items.map(i => '<div class="news">' + i.html + '</div>').join('');
}
function renderGlobalBlock() {
  const rows = globalRanks().map((r, i) => {
    const bits = STATE.sportsCfg.sports.map(s => '<td>' + (r.ranks[s.id] != null ? r.ranks[s.id] : '\u2014') + '</td>').join('');
    return '<tr class="' + (i === 0 ? 'rank-gold' : '') + '"><td>' + (i + 1) + '</td><td><a href="#team/' + encodeURIComponent(r.abbr) + '">' + escapeHtml(r.name) + '</a></td>' + bits + '<td><b>' + r.avgRank.toFixed(2) + '</b></td><td>' + r.sportsPlayed + '</td><td>' + r.crowns + '</td></tr>';
  }).join('');
  const heads = STATE.sportsCfg.sports.map(s => '<th>' + escapeHtml(s.name) + '</th>').join('');
  return '<div class="panel"><h2>Global club ranking</h2><p class="muted">Average rank = mean of a club\'s ranks in sports it actually played.</p>' + tableWrap('<th>#</th><th>Club</th>' + heads + '<th>Avg rank</th><th>Sports</th><th>Crowns</th>', rows) + '</div>';
}
function leaderBox(title, rows) {
  return '<div class="panel"><h2>' + title + '</h2>' + rows + '</div>';
}
function renderLeaders(sp) {
  const unit = unitOf(sp.cfg);
  const scorers = Object.values(sp.players).sort((a, b) => b.goals - a.goals || b.assists - a.assists).slice(0, 8);
  const wr = Object.values(sp.players).filter(p => p.matches >= 3).sort((a, b) => b.winRate - a.winRate).slice(0, 8);
  const titled = Object.values(sp.teams).sort((a, b) => b.titles - a.titles || b.trophies.length - a.trophies.length).slice(0, 8);
  const srows = tableWrap('<th>#</th><th>Player</th><th>' + unit + '</th><th>A</th><th>M</th><th>Per M</th>', scorers.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td><b>' + p.goals + '</b></td><td>' + p.assists + '</td><td>' + p.matches + '</td><td>' + p.gpg.toFixed(2) + '</td></tr>').join(''));
  const wrows = tableWrap('<th>#</th><th>Player</th><th>Win%</th><th>W-D-L</th>', wr.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td><b>' + pct(p.winRate) + '</b></td><td>' + p.wins + '-' + p.draws + '-' + p.losses + '</td></tr>').join(''));
  const trows = tableWrap('<th>#</th><th>Club</th><th>Titles</th><th>Trophies</th><th>Win%</th>', titled.map((t, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#team/' + encodeURIComponent(t.abbr) + '">' + escapeHtml(t.name) + '</a></td><td><b>' + t.titles + '</b></td><td>' + t.trophies.length + '</td><td>' + pct(t.winRate) + '</td></tr>').join(''));
  return '<div class="leaders">' + leaderBox(unit + ' leaders', srows) + leaderBox('Win rate (min 3 M)', wrows) + leaderBox('Trophy haul', trows) + '</div>';
}
function renderHome() {
  if (PAGE.mode === 'hub') {
    const cards = STATE.sportsCfg.sports.map(cfg => {
      const sp = STATE.sports[cfg.id];
      const ch = crownWinner(cfg);
      const n = ch && sp ? teamName(sp, ch) : 'unawarded';
      const m = sp ? sp.matches.length : 0;
      const g = sp ? Object.values(sp.teams).reduce((s, t) => s + t.gf, 0) : 0;
      return '<div class="panel"><h2>' + escapeHtml(cfg.name) + '</h2><p class="muted">Crown: ' + escapeHtml(cfg.crown) + '</p><p>Champion: <b>' + escapeHtml(n) + '</b></p><p>' + m + ' matches \u00b7 ' + g + ' ' + unitOf(cfg).toLowerCase() + '</p><p><a href="' + cfg.page + '">Open archive</a></p></div>';
    }).join('');
    const holders = {};
    STATE.sportsCfg.sports.forEach(cfg => { const ch = crownWinner(cfg); if (ch) holders[ch] = (holders[ch] || 0) + 1; });
    const need = STATE.sportsCfg.sports.length;
    const trebleClub = Object.keys(holders).find(k => holders[k] === need);
    const trebleBits = STATE.sportsCfg.sports.map(cfg => {
      const ch = crownWinner(cfg); const sp = STATE.sports[cfg.id];
      return '<tr><td>' + escapeHtml(cfg.name) + '</td><td>' + escapeHtml(cfg.crown) + '</td><td>' + escapeHtml(ch && sp ? teamName(sp, ch) : 'unawarded') + '</td></tr>';
    }).join('');
    return '<h1>CASPER</h1><p class="muted">' + escapeHtml(STATE.config.about || '') + '</p><div class="treble-box"><h2>The Great CASPER Treble</h2><p>Win Finale, SuperCup and Titan Cup in one season. Read from CSN awards.</p><table><tr><th>Sport</th><th>Crown</th><th>Holder</th></tr>' + trebleBits + '</table><p><b>' + (trebleClub ? escapeHtml(trebleClub) + ' complete the Treble.' : 'Vacant.') + '</b></p></div><div class="grid">' + cards + '</div><h2>Desk</h2>' + generateNews().slice(0, 8).map(i => '<div class="news">' + i.html + '</div>').join('') + renderGlobalBlock();
  }
  const sp = currentSport();
  if (!sp) return '<p class="muted">No archive loaded.</p>';
  const unit = unitOf(sp.cfg);
  const players = Object.values(sp.players);
  const goals = players.reduce((s, p) => s + p.goals, 0);
  const crown = crownWinner(sp.cfg);
  const rows = sp.ranked.map(t => '<tr class="' + (t.rank === 1 ? 'rank-gold' : '') + '"><td>' + t.rank + '</td><td><a href="#team/' + encodeURIComponent(t.abbr) + '">' + escapeHtml(t.name) + '</a></td><td>' + escapeHtml(t.player || '') + '</td><td>' + t.matches + '</td><td>' + t.wins + '</td><td>' + t.draws + '</td><td>' + t.losses + '</td><td>' + pct(t.winRate) + '</td><td>' + t.gf + '</td><td>' + t.ga + '</td><td>' + (t.gd > 0 ? '+' : '') + t.gd + '</td><td>' + t.gpg.toFixed(2) + '</td><td>' + t.cleanSheets + '</td><td>' + t.titles + '</td><td>' + t.trophies.length + '</td></tr>').join('');
  return '<h1>' + escapeHtml(sp.cfg.name) + '</h1><div class="grid-stats"><div class="cell"><div class="n">' + sp.tournaments.length + '</div><div class="l">Competitions</div></div><div class="cell"><div class="n">' + Object.keys(sp.teams).length + '</div><div class="l">Clubs</div></div><div class="cell"><div class="n">' + players.length + '</div><div class="l">Players</div></div><div class="cell"><div class="n">' + sp.matches.length + '</div><div class="l">Matches</div></div><div class="cell"><div class="n">' + goals + '</div><div class="l">' + unit + '</div></div><div class="cell"><div class="n">' + escapeHtml(crown ? teamName(sp, crown) : '\u2014') + '</div><div class="l">' + escapeHtml(sp.cfg.crown) + '</div></div></div>' + renderLeaders(sp) + '<div class="panel"><h2>' + escapeHtml(sp.cfg.name) + ' table</h2>' + tableWrap('<th>#</th><th>Club</th><th>Player</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Win%</th><th>' + unit + '</th><th>Ag</th><th>Diff</th><th>Per M</th><th>CS</th><th>Titles</th><th>Trophies</th>', rows) + '</div><h2>Latest</h2>' + generateNews().filter(i => i.html.indexOf(sp.cfg.name) >= 0 || true).slice(0, 6).map(i => '<div class="news">' + i.html + '</div>').join('') + renderGlobalBlock();
}
function allTourneys() {
  if (PAGE.mode === 'hub') return STATE.sportsCfg.sports.flatMap(s => (STATE.sports[s.id] || { tournaments: [] }).tournaments.map(t => ({ t, sport: s })));
  const sp = currentSport(); return sp ? sp.tournaments.map(t => ({ t, sport: sp.cfg })) : [];
}
function renderArchive() {
  const list = allTourneys();
  if (!list.length) return '<h1>Archive</h1><p class="muted">No competitions loaded.</p>';
  const rows = list.map(({ t, sport }) => {
    const gf = t.m.reduce((s, m) => s + m.sh + m.sa, 0);
    return '<tr><td>' + escapeHtml(sport.name) + '</td><td><a href="#competition/' + encodeURIComponent(t.meta.id) + '">' + escapeHtml(t.meta.e || t.meta.id) + '</a></td><td>' + escapeHtml(t.meta.s || '') + '</td><td>' + escapeHtml(t.meta.sts || '') + '</td><td>' + Object.keys(t.n).length + '</td><td>' + t.m.length + '</td><td>' + gf + '</td><td>' + Object.keys(t.aw).length + '</td><td>' + escapeHtml(t.aw.ch && STATE.sports[sport.id] ? teamName(STATE.sports[sport.id], t.aw.ch) : '\u2014') + '</td></tr>';
  }).join('');
  return '<h1>Archive</h1>' + tableWrap('<th>Sport</th><th>Competition</th><th>Season</th><th>Status</th><th>Clubs</th><th>Matches</th><th>Score events</th><th>Awards</th><th>Champion</th>', rows);
}
function calcTable(t, cfg) {
  const table = {};
  Object.keys(t.n).forEach(abbr => { table[abbr] = { abbr, name: t.n[abbr].name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, runs: 0, wkts: 0, ballsF: 0, ballsB: 0, nrr: 0 }; });
  const quota = oversToBallsSafe(t.meta.ov || '1'); const allOut = parseInt(t.meta.wk || '1', 10);
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
function renderCompetition(id) {
  let found = null, sport = null;
  STATE.sportsCfg.sports.forEach(cfg => {
    const t = (STATE.sports[cfg.id] || { tournaments: [] }).tournaments.find(x => x.meta.id === id);
    if (t) { found = t; sport = STATE.sports[cfg.id]; }
  });
  if (!found) return '<p>Competition not found.</p>';
  const cfg = sport.cfg; const unit = unitOf(cfg);
  const stand = calcTable(found, cfg);
  const srows = stand.map((r, i) => {
    const extra = cfg.scoring === 'cricket' ? ('<td>' + r.runs + '</td><td>' + r.wkts + '</td><td>' + r.nrr.toFixed(3) + '</td>') : ('<td>' + r.gf + '</td><td>' + r.ga + '</td><td>' + (r.gd > 0 ? '+' : '') + r.gd + '</td>');
    return '<tr><td>' + (i + 1) + '</td><td><a href="#team/' + encodeURIComponent(r.abbr) + '">' + escapeHtml(r.name) + '</a></td><td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.d + '</td><td>' + r.l + '</td>' + extra + '<td><b>' + r.pts + '</b></td></tr>';
  }).join('');
  const shead = cfg.scoring === 'cricket' ? '<th>#</th><th>Team</th><th>P</th><th>W</th><th>T</th><th>L</th><th>Runs</th><th>Wkts lost</th><th>NRR</th><th>Pts</th>' : '<th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>' + unit + '</th><th>Ag</th><th>Diff</th><th>Pts</th>';
  const mrows = found.m.map(m => {
    const hn = found.n[m.home] ? found.n[m.home].name : m.home;
    const an = found.n[m.away] ? found.n[m.away].name : m.away;
    const score = m.kind === 'cricket' ? (m.sh + '/' + m.hw + (m.ho ? ' (' + m.ho + ')' : '') + ' \u2013 ' + m.sa + '/' + m.aw + (m.ao ? ' (' + m.ao + ')' : '')) : (m.sh + '\u2013' + m.sa + (m.p ? ' (' + m.p[0] + '\u2013' + m.p[1] + ' pens)' : ''));
    const gline = [].concat(m.gh || [], m.ga || []).map(x => x.name + ' \u00d7' + x.n);
    return '<tr><td>' + escapeHtml(m.stageLabel || m.stage || '') + '</td><td>' + escapeHtml(hn) + ' vs ' + escapeHtml(an) + '</td><td>' + escapeHtml(score) + '</td><td>' + escapeHtml(gline.join(', ') || '\u2014') + '</td></tr>';
  }).join('');
  const awItems = Object.keys(found.aw).map(k => ({ code: k, label: (STATE.config.awardLabels && STATE.config.awardLabels[k]) || k, event: found.meta.e, season: found.meta.s }));
  let squad = '';
  Object.keys(found.sq || {}).forEach(abbr => {
    const sq = found.sq[abbr];
    squad += '<p><b>' + escapeHtml(teamName(sport, abbr)) + '</b> start: ' + escapeHtml((sq.start || []).join(', ')) + ' \u00b7 bench: ' + escapeHtml((sq.bench || []).join(', ') || '\u2014') + '</p>';
  });
  return '<h1>' + escapeHtml(found.meta.e || found.meta.id) + '</h1><p class="muted">' + escapeHtml(found.meta.s || '') + ' \u00b7 ' + escapeHtml(found.meta.sts || '') + ' \u00b7 ' + found.m.length + ' matches \u00b7 ' + Object.keys(found.n).length + ' clubs</p>' + squad + '<div class="panel"><h2>Table</h2>' + tableWrap(shead, srows) + '</div><div class="panel"><h2>Matches</h2>' + tableWrap('<th>Stage</th><th>Match</th><th>Score</th><th>Named scorers</th>', mrows) + '</div><div class="panel"><h2>Trophy cabinet</h2>' + cabinetHtml(awItems.map(a => Object.assign(a, { event: found.n[found.aw[a.code]] ? found.n[found.aw[a.code]].name + ' \u00b7 ' + a.label : a.label }))) + '</div>';
}
function collectPlayers() {
  if (PAGE.mode !== 'hub') return Object.values((currentSport() || { players: {} }).players).map(p => Object.assign({}, p, { _sp: currentSport() }));
  const map = {};
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    Object.values(sp.players).forEach(p => {
      const k = p.name.toLowerCase();
      if (!map[k]) map[k] = { name: p.name, goals: 0, assists: 0, matches: 0, wins: 0, draws: 0, losses: 0, titles: 0, hatTricks: 0, conceded: 0, awards: [], trophies: [], teams: new Set(), clubNames: new Set(), _sp: null };
      map[k].goals += p.goals; map[k].assists += p.assists; map[k].matches += p.matches; map[k].wins += p.wins; map[k].draws += p.draws; map[k].losses += p.losses; map[k].titles += p.titles; map[k].hatTricks += p.hatTricks; map[k].conceded += p.conceded;
      map[k].awards = map[k].awards.concat(p.awards || []); map[k].trophies = map[k].trophies.concat(p.trophies || []);
      (p.teams || []).forEach && p.teams.forEach(t => map[k].teams.add(t));
      (p.clubNames || []).forEach && p.clubNames.forEach(t => map[k].clubNames.add(t));
    });
  });
  Object.values(map).forEach(p => { p.winRate = p.matches ? p.wins / p.matches : 0; p.gpg = p.matches ? p.goals / p.matches : 0; p.gd = p.goals - p.conceded; });
  return Object.values(map);
}
function renderPlayers() {
  const sp = currentSport();
  const unit = sp ? unitOf(sp.cfg) : 'G/R';
  const list = collectPlayers().sort((a, b) => b.goals - a.goals || b.winRate - a.winRate || a.name.localeCompare(b.name));
  const rows = list.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td>' + escapeHtml(clubList(p, p._sp || sp)) + '</td><td><b>' + p.goals + '</b></td><td>' + (p.assists || 0) + '</td><td>' + p.matches + '</td><td>' + p.wins + '-' + p.draws + '-' + p.losses + '</td><td>' + pct(p.winRate) + '</td><td>' + (p.gpg ? p.gpg.toFixed(2) : '0.00') + '</td><td>' + (p.gd > 0 ? '+' : '') + (p.gd || 0) + '</td><td>' + (p.hatTricks || 0) + '</td><td>' + p.titles + '</td><td>' + (p.awards || []).length + '</td></tr>').join('');
  return '<h1>Players</h1><p class="muted">Futsal/cricket goals and runs are the club player\'s team output unless a match lists named scorers.</p>' + tableWrap('<th>#</th><th>Player</th><th>Clubs</th><th>' + unit + '</th><th>A</th><th>M</th><th>W-D-L</th><th>Win%</th><th>Per M</th><th>Diff</th><th>HT</th><th>Titles</th><th>Awards</th>', rows);
}
function renderPlayer(name) {
  const key = decodeURIComponent(name);
  const p = collectPlayers().find(x => x.name.toLowerCase() === key.toLowerCase());
  if (!p) return '<p>Player not found.</p>';
  const ctx = STATE.config.playerContext && STATE.config.playerContext[p.name.toLowerCase()];
  const unit = currentSport() ? unitOf(currentSport().cfg) : 'Goals / runs';
  return '<h1>' + escapeHtml(p.name) + '</h1>' + (ctx ? '<p>' + escapeHtml(ctx) + '</p>' : '') + '<p class="muted">Clubs: ' + escapeHtml(clubList(p, currentSport())) + '</p><div class="grid-stats"><div class="cell"><div class="n">' + p.goals + '</div><div class="l">' + unit + '</div></div><div class="cell"><div class="n">' + (p.assists || 0) + '</div><div class="l">Assists</div></div><div class="cell"><div class="n">' + p.matches + '</div><div class="l">Matches</div></div><div class="cell"><div class="n">' + pct(p.winRate) + '</div><div class="l">Win%</div></div><div class="cell"><div class="n">' + p.wins + '-' + p.draws + '-' + p.losses + '</div><div class="l">W-D-L</div></div><div class="cell"><div class="n">' + (p.gpg ? p.gpg.toFixed(2) : '0.00') + '</div><div class="l">Per match</div></div><div class="cell"><div class="n">' + (p.gd > 0 ? '+' : '') + (p.gd || 0) + '</div><div class="l">Diff</div></div><div class="cell"><div class="n">' + (p.hatTricks || 0) + '</div><div class="l">Hat-tricks</div></div><div class="cell"><div class="n">' + p.titles + '</div><div class="l">Titles</div></div><div class="cell"><div class="n">' + (p.awards || []).length + '</div><div class="l">Awards</div></div></div><div class="panel"><h2>Trophy cabinet</h2>' + cabinetHtml(p.trophies && p.trophies.length ? p.trophies : p.awards) + '</div>';
}
function collectTeams() {
  if (PAGE.mode !== 'hub') return Object.values((currentSport() || { teams: {} }).teams);
  const map = {};
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    Object.values(sp.teams).forEach(t => {
      if (!map[t.abbr]) map[t.abbr] = { abbr: t.abbr, name: t.name, player: t.player, matches: 0, wins: 0, draws: 0, losses: 0, titles: 0, gf: 0, ga: 0, trophies: [], rank: t.rank };
      map[t.abbr].name = t.name; map[t.abbr].matches += t.matches; map[t.abbr].wins += t.wins; map[t.abbr].draws += t.draws; map[t.abbr].losses += t.losses; map[t.abbr].titles += t.titles; map[t.abbr].gf += t.gf; map[t.abbr].ga += t.ga; map[t.abbr].trophies = map[t.abbr].trophies.concat(t.trophies || []);
    });
  });
  Object.values(map).forEach(t => { t.winRate = t.matches ? t.wins / t.matches : 0; t.gd = t.gf - t.ga; });
  return Object.values(map);
}
function renderTeams() {
  const list = collectTeams().sort((a, b) => (a.rank || 99) - (b.rank || 99) || b.titles - a.titles);
  const rows = list.map(t => '<tr><td>' + (t.rank || '\u2014') + '</td><td><a href="#team/' + encodeURIComponent(t.abbr) + '">' + escapeHtml(t.name) + '</a></td><td>' + escapeHtml(t.player || '') + '</td><td>' + t.matches + '</td><td>' + t.wins + '-' + (t.draws || 0) + '-' + (t.losses || 0) + '</td><td>' + pct(t.winRate || 0) + '</td><td>' + t.gf + '</td><td>' + t.ga + '</td><td>' + ((t.gf - t.ga) > 0 ? '+' : '') + (t.gf - t.ga) + '</td><td>' + t.titles + '</td><td>' + (t.trophies || []).length + '</td></tr>').join('');
  return '<h1>Teams</h1>' + tableWrap('<th>Rank</th><th>Club</th><th>Main player</th><th>P</th><th>W-D-L</th><th>Win%</th><th>F</th><th>A</th><th>Diff</th><th>Titles</th><th>Trophies</th>', rows);
}
function renderTeam(abbr) {
  abbr = decodeURIComponent(abbr);
  const chunks = []; let name = abbr; let allTrop = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp || !sp.teams[abbr]) return;
    const t = sp.teams[abbr]; name = t.name; allTrop = allTrop.concat(t.trophies || []);
    chunks.push('<div class="panel"><h2>' + escapeHtml(cfg.name) + '</h2><div class="grid-stats"><div class="cell"><div class="n">' + t.rank + '</div><div class="l">Rank</div></div><div class="cell"><div class="n">' + t.matches + '</div><div class="l">P</div></div><div class="cell"><div class="n">' + t.wins + '-' + t.draws + '-' + t.losses + '</div><div class="l">W-D-L</div></div><div class="cell"><div class="n">' + pct(t.winRate) + '</div><div class="l">Win%</div></div><div class="cell"><div class="n">' + t.gf + '</div><div class="l">' + unitOf(cfg) + '</div></div><div class="cell"><div class="n">' + t.ga + '</div><div class="l">Against</div></div><div class="cell"><div class="n">' + (t.gd > 0 ? '+' : '') + t.gd + '</div><div class="l">Diff</div></div><div class="cell"><div class="n">' + t.gpg.toFixed(2) + '</div><div class="l">Per match</div></div><div class="cell"><div class="n">' + t.cleanSheets + '</div><div class="l">Clean sheets</div></div><div class="cell"><div class="n">' + t.titles + '</div><div class="l">Titles</div></div></div></div>');
  });
  if (!chunks.length) return '<p>Team not found.</p>';
  return '<h1>' + escapeHtml(name) + '</h1>' + chunks.join('') + '<div class="panel"><h2>Trophy cabinet</h2>' + cabinetHtml(allTrop) + '</div>' + renderGlobalBlock();
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
  return '<h1>Awards</h1><p class="muted">Every CSN aw() row, including seasonal named honours.</p>' + (rows.length ? tableWrap('<th>Sport</th><th>Competition</th><th>Season</th><th>Award</th><th>Holder</th>', rows.join('')) : '<p class="muted">No awards loaded.</p>');
}
function renderRanking() {
  const sportBlock = (PAGE.mode === 'hub' || !currentSport()) ? '' : ('<div class="panel"><h2>' + escapeHtml(currentSport().cfg.name) + ' ranking</h2>' + tableWrap('<th>#</th><th>Club</th><th>Model</th><th>Titles</th><th>Win%</th><th>Diff</th>', currentSport().ranked.map(t => '<tr class="' + (t.rank === 1 ? 'rank-gold' : '') + '"><td>' + t.rank + '</td><td><a href="#team/' + encodeURIComponent(t.abbr) + '">' + escapeHtml(t.name) + '</a></td><td>' + t.sportPts.toFixed(1) + '</td><td>' + t.titles + '</td><td>' + pct(t.winRate) + '</td><td>' + (t.gd > 0 ? '+' : '') + t.gd + '</td></tr>').join('')) + '</div>');
  return '<h1>Ranking</h1>' + sportBlock + renderGlobalBlock();
}
function renderRecords() {
  const recs = (STATE.misc.records || []).map(r => '<tr><td>' + escapeHtml(r.label) + '</td><td>' + escapeHtml(r.value) + '</td><td>' + escapeHtml(r.holder) + '</td><td>' + escapeHtml(r.context || '') + '</td></tr>').join('');
  const dyn = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    let best = 0, pair = '', blow = 0, blowP = '';
    sp.matches.forEach(m => {
      const tot = m.sh + m.sa; if (tot > best) { best = tot; pair = (m.names && m.names[m.home] ? m.names[m.home].name : m.home) + ' ' + m.sh + '\u2013' + m.sa + ' ' + (m.names && m.names[m.away] ? m.names[m.away].name : m.away) + ' \u00b7 ' + m.event; }
      const margin = Math.abs(m.sh - m.sa); if (margin > blow) { blow = margin; blowP = m.event + ' ' + m.sh + '\u2013' + m.sa; }
    });
    const topP = Object.values(sp.players).sort((a, b) => b.goals - a.goals)[0];
    if (best) dyn.push('<tr><td>Highest scoring ' + escapeHtml(cfg.name) + ' match</td><td>' + best + '</td><td>\u2014</td><td>' + escapeHtml(pair) + '</td></tr>');
    if (blow) dyn.push('<tr><td>Biggest ' + escapeHtml(cfg.name) + ' winning margin</td><td>' + blow + '</td><td>\u2014</td><td>' + escapeHtml(blowP) + '</td></tr>');
    if (topP) dyn.push('<tr><td>Most ' + unitOf(cfg).toLowerCase() + ' in ' + escapeHtml(cfg.name) + '</td><td>' + topP.goals + '</td><td>' + escapeHtml(topP.name) + '</td><td>' + topP.matches + ' matches</td></tr>');
  });
  return '<h1>Records</h1>' + tableWrap('<th>Record</th><th>Value</th><th>Holder</th><th>Context</th>', recs + dyn.join(''));
}
function renderStatistics() {
  const rows = STATE.sportsCfg.sports.map(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return '';
    const g = Object.values(sp.teams).reduce((s, t) => s + t.gf, 0);
    return '<tr><td>' + escapeHtml(cfg.name) + '</td><td>' + sp.tournaments.length + '</td><td>' + Object.keys(sp.teams).length + '</td><td>' + Object.keys(sp.players).length + '</td><td>' + sp.matches.length + '</td><td>' + g + '</td><td>' + (sp.matches.length ? (g / sp.matches.length).toFixed(2) : '0') + '</td><td>' + unitOf(cfg) + '</td></tr>';
  }).join('');
  return '<h1>Statistics</h1>' + tableWrap('<th>Sport</th><th>Competitions</th><th>Clubs</th><th>Players</th><th>Matches</th><th>Output</th><th>Per match</th><th>Unit</th>', rows) + renderGlobalBlock();
}
function renderAbout() {
  return '<h1>About</h1><p>' + escapeHtml(STATE.config.about || '') + '</p><p class="muted">Pages are generated from sports.json, config.json and CSN. Futsal crown event is Finale.</p>';
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
  else if (view === 'news') html = renderNews();
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
  headerPaint(); route(); window.addEventListener('hashchange', route);
}
boot();
