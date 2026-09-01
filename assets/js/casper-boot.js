function renderPlayer(name){
  const key = decodeURIComponent(name).toLowerCase();
  const p = collectPlayers().find(x => x.name.toLowerCase() === key);
  if (!p) return '<p>Player not found. Use Players.</p>';
  const info = regOf(p.name) || {};
  const ctx = STATE.config.playerContext && STATE.config.playerContext[p.name.toLowerCase()];
  const last = lastMatchesFor(key);
  const all = collectPlayers();
  const rankOf = (fn) => all.slice().sort(fn).findIndex(x => x.name.toLowerCase() === key) + 1;
  const comps = playerCompetitionRows(p.name);
  const bySport = { futsal: [], football: [], cricket: [] };
  comps.forEach(r => { if (bySport[r.sport.id]) bySport[r.sport.id].push(r); });
  function sportTable(id, cricket){
    const list = bySport[id] || [];
    if (!list.length) return '<p class="muted">No ' + id + ' rows.</p>';
    const head = cricket ? '<th>Competition</th><th>MP</th><th>Runs</th><th>W-D-L</th><th>Titles</th>' : '<th>Competition</th><th>MP</th><th>G</th><th>A</th><th>W-D-L</th><th>Titles</th>';
    const body = list.map(r => cricket
      ? '<tr><td>' + escapeHtml(r.event) + '</td><td>' + r.mp + '</td><td>' + r.runs + '</td><td>' + r.w + '-' + r.d + '-' + r.l + '</td><td>' + r.titles + '</td></tr>'
      : '<tr><td>' + escapeHtml(r.event) + '</td><td>' + r.mp + '</td><td>' + r.g + '</td><td>' + r.a + '</td><td>' + r.w + '-' + r.d + '-' + r.l + '</td><td>' + r.titles + '</td></tr>').join('');
    const tot = list.reduce((s, r) => ({ mp: s.mp + r.mp, g: s.g + r.g, a: s.a + r.a, runs: s.runs + r.runs, titles: s.titles + r.titles }), { mp: 0, g: 0, a: 0, runs: 0, titles: 0 });
    const foot = cricket
      ? '<tr class="rank-gold"><td>Total</td><td>' + tot.mp + '</td><td>' + tot.runs + '</td><td></td><td>' + tot.titles + '</td></tr>'
      : '<tr class="rank-gold"><td>Total</td><td>' + tot.mp + '</td><td>' + tot.g + '</td><td>' + tot.a + '</td><td></td><td>' + tot.titles + '</td></tr>';
    return tableWrap(head, body + foot);
  }
  const finish = Math.min(99, (p.gpg || 0) * 28 + (p.hatTricks || 0) * 3);
  const defend = Math.min(99, p.matches ? (p.wins / p.matches) * 70 : 20);
  return '<div class="layout-player"><aside class="side box"><h3>Quick navigation</h3>' + navLinks() + '<h3>Search player</h3>' + searchBox() + '</aside>' +
    '<section class="stack"><div class="box"><div class="profile">' + jerseySvg(p.name, clubsOf(p)[0] || 'ca') +
    '<div><h2 class="pname">' + escapeHtml(p.name.toUpperCase()) + '</h2><p><b>' + escapeHtml(clubLabel(p)) + '</b>' + (info.id ? ' \u00b7 ' + escapeHtml(info.id) : '') + '</p><div class="kv">' +
    (info.position ? '<div><span>Position</span><b>' + escapeHtml(info.position) + '</b></div>' : '') +
    '<div><span>Status</span><b>' + escapeHtml(info.status || 'Archive active') + '</b></div><div><span>Sports</span><b>' + escapeHtml((info.sports || Object.keys(p.bySport)).join(', ')) + '</b></div></div>' +
    (ctx ? '<p class="muted">' + escapeHtml(ctx) + '</p>' : '') + '</div>' +
    '<div><h3>Career summary</h3><div class="banner"><div class="cell"><div class="n">' + p.matches + '</div><div class="l">Matches</div></div><div class="cell"><div class="n">' + p.goals + '</div><div class="l">Goals</div></div><div class="cell"><div class="n">' + (p.assists || 0) + '</div><div class="l">Assists</div></div><div class="cell"><div class="n">' + p.runs + '</div><div class="l">Runs</div></div></div><div class="banner"><div class="cell"><div class="n">' + p.titles + '</div><div class="l">Titles</div></div><div class="cell"><div class="n">' + (p.hatTricks || 0) + '</div><div class="l">Hat-tricks</div></div><div class="cell"><div class="n">' + (p.awards || []).length + '</div><div class="l">Awards</div></div><div class="cell"><div class="n">' + pct(p.winRate) + '</div><div class="l">Win %</div></div></div></div></div></div>' +
    '<div class="grid3"><div class="box"><h3>Futsal</h3>' + sportTable('futsal', false) + '</div><div class="box"><h3>Football</h3>' + sportTable('football', false) + '</div><div class="box"><h3>Cricket</h3>' + sportTable('cricket', true) + '</div></div>' +
    '<div class="grid2"><div class="box"><h3>Last matches</h3>' + (last.length ? tableWrap('<th>Sport</th><th>Event</th><th>Score</th><th>R</th>', last.map(x => '<tr><td>' + escapeHtml(x.cfg.name) + '</td><td>' + escapeHtml(x.m.event) + '</td><td>' + x.score + '</td><td>' + x.letter + '</td></tr>').join('')) : '<p class="muted">No matches.</p>') + '</div>' +
    '<div class="box"><h3>Season rows</h3>' + tableWrap('<th>Sport</th><th>MP</th><th>G</th><th>R</th><th>A</th><th>Titles</th>', ['futsal','football','cricket'].map(id => { const s = p.bySport[id] || {matches:0,goals:0,runs:0,assists:0,titles:0}; return '<tr><td>' + id + '</td><td>' + (s.matches||0) + '</td><td>' + (s.goals||0) + '</td><td>' + (s.runs||0) + '</td><td>' + (s.assists||0) + '</td><td>' + (s.titles||0) + '</td></tr>'; }).join('')) + '</div></div></section>' +
    '<aside class="stack"><div class="box"><h3>Player ranking</h3><div class="stats-line"><span>Goals</span><b>#' + rankOf((a,b)=>b.goals-a.goals) + '</b></div><div class="stats-line"><span>Assists</span><b>#' + rankOf((a,b)=>b.assists-a.assists) + '</b></div><div class="stats-line"><span>Runs</span><b>#' + rankOf((a,b)=>b.runs-a.runs) + '</b></div><div class="stats-line"><span>Titles</span><b>#' + rankOf((a,b)=>b.titles-a.titles) + '</b></div></div>' +
    '<div class="box"><h3>Awards & honours</h3>' + cabinetHtml(p.trophies && p.trophies.length ? p.trophies : p.awards) + '</div>' +
    '<div class="box"><h3>Career timeline</h3>' + (p.awards || []).map(a => '<div class="news"><b>' + escapeHtml(a.season || '') + '</b> ' + escapeHtml(a.label) + ' \u00b7 ' + escapeHtml(a.event || '') + '</div>').join('') + '</div>' +
    '<div class="box"><h3>Play style</h3>' + barRow('Finishing', finish) + barRow('Passing', 40 + (p.assists || 0) * 4) + barRow('Defending', defend) + '</div></aside></div>';
}
function route(){
  const hash = (location.hash || '#home').slice(1);
  const parts = hash.split('/');
  const view = parts[0], arg = parts.slice(1).join('/');
  setActive(['competition','player','team'].includes(view) ? (view === 'player' ? 'players' : view === 'team' ? 'teams' : 'competitions') : view);
  let html = '';
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
async function loadJson(path, fallback){
  try { const r = await fetch(path); if (!r.ok) return fallback; return await r.json(); }
  catch (e) { return fallback; }
}
function tickClock(){
  const t = document.getElementById('casper-time');
  const d = document.getElementById('casper-date');
  const now = new Date();
  if (t) t.textContent = now.toLocaleTimeString('en-IN', { hour12: false });
  if (d) d.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
async function boot(){
  STATE.config = await loadJson('config.json', {});
  STATE.sportsCfg = await loadJson('sports.json', { sports: [] });
  STATE.misc = await loadJson('misc.json', {});
  STATE.registry = Object.assign({}, await loadJson('player-registry.json', {}), STATE.config.playerRegistry || {});
  for (const cfg of STATE.sportsCfg.sports) {
    let files = [];
    try { const man = await fetch(cfg.manifest); if (man.ok) files = await man.json(); } catch (e) {}
    const tours = [];
    for (const f of files) {
      try { tours.push.apply(tours, parseCSN(await fetch(cfg.dataDir + '/' + f).then(r => r.text()))); } catch (e) {}
    }
    STATE.sports[cfg.id] = buildSport(cfg, tours);
  }
  paintChrome(); tickClock(); setInterval(tickClock, 1000); route();
  window.addEventListener('hashchange', route);
}
boot();
