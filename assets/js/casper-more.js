function playerCompetitionRows(name){
  const key = String(name).toLowerCase();
  const rows = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    sp.tournaments.forEach(t => {
      let mp = 0, g = 0, a = 0, w = 0, d = 0, l = 0, runs = 0;
      const clubCodes = Object.keys(t.n || {}).filter(abbr => String((t.n[abbr].player || '')).toLowerCase() === key);
      t.m.forEach(m => {
        const listedH = t.n[m.home] && String(t.n[m.home].player || '').toLowerCase() === key;
        const listedA = t.n[m.away] && String(t.n[m.away].player || '').toLowerCase() === key;
        const scoredH = (m.gh || []).some(x => String(x.name).toLowerCase() === key);
        const scoredA = (m.ga || []).some(x => String(x.name).toLowerCase() === key);
        const asH = (m.ah || []).some(x => String(x.name).toLowerCase() === key);
        const asA = (m.aa || []).some(x => String(x.name).toLowerCase() === key);
        const side = listedH || scoredH || asH ? 'H' : (listedA || scoredA || asA ? 'A' : null);
        if (!side) return;
        mp++;
        const res = resultOf(m);
        if (res === 'D') d++;
        else if ((res === 'H' && side === 'H') || (res === 'A' && side === 'A')) w++;
        else l++;
        if (m.kind === 'cricket') runs += side === 'H' ? m.sh : m.sa;
        (side === 'H' ? (m.gh||[]) : (m.ga||[])).forEach(x => { if (String(x.name).toLowerCase() === key) g += x.n; });
        (side === 'H' ? (m.ah||[]) : (m.aa||[])).forEach(x => { if (String(x.name).toLowerCase() === key) a += x.n; });
        if (m.kind !== 'cricket' && !(side === 'H' ? (m.gh||[]) : (m.ga||[])).length && (listedH || listedA)) g += side === 'H' ? m.sh : m.sa;
      });
      const titles = Object.keys(t.aw || {}).filter(code => {
        const val = String(t.aw[code] || '').toLowerCase();
        return val === key || clubCodes.indexOf(t.aw[code]) >= 0;
      }).length;
      if (mp || titles) rows.push({ sport: cfg, event: t.meta.e || t.meta.id, season: t.meta.s || '', mp, g, a, runs, w, d, l, titles });
    });
  });
  return rows;
}
function featuredSport(cfg){
  const sp = STATE.sports[cfg.id];
  if (!sp) return '<div class="box feat"><h3>' + escapeHtml(cfg.name) + '</h3><p class="muted">No archive</p></div>';
  const ch = crownWinner(cfg);
  const last = sp.tournaments.filter(t => (t.meta.e || '').toLowerCase() !== 'seasonal awards').slice(-1)[0];
  let body = '';
  if (cfg.id === 'football' && sp.teams.bbu && sp.teams.rsa) {
    const a = sp.teams.bbu, b = sp.teams.rsa;
    body = '<div class="score">' + a.gf + ' \u2013 ' + b.gf + '</div><p><b>' + escapeHtml(a.name) + '</b> vs <b>' + escapeHtml(b.name) + '</b></p><p class="muted">' + escapeHtml((last && last.meta.sts) || '') + '</p>';
  } else if (ch) {
    body = '<p><b>' + escapeHtml(teamName(sp, ch)) + '</b></p><p class="muted">' + escapeHtml(cfg.crown) + ' champions</p>';
  }
  const titles = Object.values(sp.teams).reduce((s, t) => s + t.titles, 0);
  return '<div class="box feat"><h3>' + escapeHtml((last && last.meta.e) || cfg.name) + '</h3>' + body +
    '<p class="muted">' + sp.tournaments.length + ' competitions \u00b7 ' + sp.matches.length + ' matches \u00b7 ' + titles + ' titles</p><p><a href="' + cfg.page + '">Open ' + escapeHtml(cfg.name) + '</a></p></div>';
}
function miniTable(cfg){
  const sp = STATE.sports[cfg.id]; if (!sp) return '';
  const unit = unitOf(cfg);
  const extra = cfg.scoring === 'cricket' ? '<th>NRR</th>' : '<th>Diff</th>';
  const rows = sp.ranked.map((t, i) => {
    const diff = cfg.scoring === 'cricket' ? t.nrr.toFixed(2) : ((t.gd > 0 ? '+' : '') + t.gd);
    return '<tr class="' + (i === 0 ? 'rank-gold' : '') + '"><td>' + t.rank + '</td><td><a href="#team/' + encodeURIComponent(t.abbr) + '">' + escapeHtml(t.name) + '</a></td><td>' + t.matches + '</td><td>' + t.wins + '</td><td>' + t.gf + '</td><td>' + diff + '</td><td>' + t.titles + '</td></tr>';
  }).join('');
  return '<div class="box"><h3>' + escapeHtml(cfg.name) + ' table</h3>' + tableWrap('<th>#</th><th>Club</th><th>P</th><th>W</th><th>' + unit + '</th>' + extra + '<th>Titles</th>', rows) + '</div>';
}
function championsBoard(){
  const rows = allTourneys().filter(x => x.t.meta.e !== 'Seasonal Awards').map(({ t, sport }) => {
    const ch = t.aw.ch ? (t.n[t.aw.ch] ? t.n[t.aw.ch].name : t.aw.ch) : '\u2014';
    return '<tr><td>' + escapeHtml(sport.name) + '</td><td><a href="#competition/' + encodeURIComponent(t.meta.id) + '">' + escapeHtml(t.meta.e || t.meta.id) + '</a></td><td>' + t.m.length + '</td><td>' + escapeHtml(ch) + '</td><td>' + escapeHtml(t.meta.sts || '') + '</td></tr>';
  }).join('');
  return '<div class="box"><h3>Every competition</h3><div class="scroll">' + tableWrap('<th>Sport</th><th>Competition</th><th>M</th><th>Champion</th><th>Status</th>', rows) + '</div></div>';
}
function recentResults(n){
  const rows = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    sp.matches.forEach(m => {
      const hn = m.names && m.names[m.home] ? m.names[m.home].name : m.home;
      const an = m.names && m.names[m.away] ? m.names[m.away].name : m.away;
      const score = m.kind === 'cricket' ? (m.sh + '/' + m.hw + ' \u2013 ' + m.sa + '/' + m.aw) : (m.sh + '\u2013' + m.sa);
      rows.push('<tr><td>' + escapeHtml(cfg.name) + '</td><td>' + escapeHtml(m.event || '') + '</td><td>' + escapeHtml(hn) + ' vs ' + escapeHtml(an) + '</td><td>' + score + '</td><td>' + escapeHtml(m.stageLabel || m.stage || '') + '</td></tr>');
    });
  });
  return tableWrap('<th>Sport</th><th>Event</th><th>Match</th><th>Score</th><th>Stage</th>', rows.slice(-n).reverse().join(''));
}
function sideRecord(){
  const f = archiveFacts();
  return '<h3>CASPER record</h3>' +
    [['Clubs', f.clubs], ['Players', f.players], ['Competitions', f.tours], ['Matches', f.matches],
     ['Goals', f.goals], ['Runs', f.runs], ['Clean sheets', f.cs], ['Penalties', f.pens],
     ['Hat-tricks', f.ht], ['Awards issued', f.awards]].map(x => '<div class="stats-line"><span>' + x[0] + '</span><b>' + x[1] + '</b></div>').join('');
}
function renderHubHome(){
  const people = collectPlayers();
  const scorers = people.slice().sort((a, b) => b.goals - a.goals).slice(0, 8);
  const runs = people.slice().sort((a, b) => b.runs - a.runs).slice(0, 8);
  const assists = people.slice().sort((a, b) => b.assists - a.assists).slice(0, 8);
  const titles = people.slice().sort((a, b) => b.titles - a.titles || b.goals - a.goals).slice(0, 8);
  return '<div class="layout"><aside class="side box"><h3>Quick navigation</h3>' + navLinks() + '<h3>Search player</h3>' + searchBox() + sideRecord() + '</aside><section class="stack">' +
    '<div class="hero3">' + STATE.sportsCfg.sports.map(featuredSport).join('') + '</div>' +
    '<div class="grid3">' + STATE.sportsCfg.sports.map(miniTable).join('') + '</div>' +
    championsBoard() +
    '<div class="box"><h3>Latest results</h3>' + recentResults(10) + '</div>' +
    '<div class="grid3"><div class="box"><h3>Top goals</h3>' + tableWrap('<th>#</th><th>Player</th><th>G</th><th>M</th>', scorers.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td>' + p.goals + '</td><td>' + p.matches + '</td></tr>').join('')) + '</div>' +
    '<div class="box"><h3>Top runs</h3>' + tableWrap('<th>#</th><th>Player</th><th>R</th><th>M</th>', runs.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td>' + p.runs + '</td><td>' + p.matches + '</td></tr>').join('')) + '</div>' +
    '<div class="box"><h3>Top assists</h3>' + tableWrap('<th>#</th><th>Player</th><th>A</th>', assists.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td>' + p.assists + '</td></tr>').join('')) + '</div></div></section>' +
    '<aside class="stack"><div class="box"><h3>Global club rank</h3>' + globalRanks().map((r, i) => '<div class="stats-line"><span>' + (i + 1) + '. <a href="#team/' + encodeURIComponent(r.abbr) + '">' + escapeHtml(r.name) + '</a></span><b>' + r.avgRank.toFixed(2) + '</b></div>').join('') + '</div>' +
    '<div class="box"><h3>Most titles</h3>' + titles.map((p, i) => '<div class="stats-line"><span>' + (i + 1) + '. <a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></span><b>' + p.titles + '</b></div>').join('') + '</div>' +
    '<div class="box"><h3>Headline news</h3>' + generateNews().slice(0, 8).map(n => '<div class="news">' + escapeHtml(n) + '</div>').join('') + '</div></aside></div>';
}
function renderHome(){
  if (PAGE.mode === 'hub') return renderHubHome();
  const sp = currentSport();
  if (!sp) return '<p class="muted">No archive.</p>';
  return featuredSport(sp.cfg) + miniTable(sp.cfg) + championsBoard() + '<div class="box"><h3>Results</h3>' + recentResults(16) + '</div>';
}
function renderArchive(){ return championsBoard(); }
