function sportSwitch(){
  const cur = PAGE.mode === 'hub' ? 'hub' : PAGE.sport;
  return '<div class="pills"><a href="index.html"' + (cur === 'hub' ? ' class="on"' : '') + '>CASPER</a>' +
    STATE.sportsCfg.sports.map(s => '<a href="' + s.page + '"' + (cur === s.id ? ' class="on"' : '') + '>' + escapeHtml(s.name) + '</a>').join('') + '</div>';
}
function currentSport(){ return PAGE.mode === 'hub' ? null : (STATE.sports[PAGE.sport] || null); }
function pct(x){ return ((x || 0) * 100).toFixed(1) + '%'; }
function tableWrap(head, rows){ return '<table><thead><tr>' + head + '</tr></thead><tbody>' + (rows || '') + '</tbody></table>'; }
function regOf(name){ return (STATE.registry || {})[String(name || '').toLowerCase()] || null; }
function clubsOf(p){
  const r = regOf(p.name);
  if (r && r.clubs && r.clubs.length) return r.clubs.slice();
  return [...(p.teams || [])];
}
function clubLabel(p){
  const names = [];
  clubsOf(p).forEach(code => {
    STATE.sportsCfg.sports.forEach(cfg => {
      const t = STATE.sports[cfg.id] && STATE.sports[cfg.id].teams[code];
      if (t && names.indexOf(t.name) < 0) names.push(t.name + ' (' + code.toUpperCase() + ')');
    });
    if (!names.length) names.push(String(code).toUpperCase());
  });
  return names.join(' \u00b7 ') || '\u2014';
}
function labelAward(code){ return (STATE.config.awardLabels && STATE.config.awardLabels[code]) || code; }
function allTourneys(){
  const out = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    if (PAGE.mode !== 'hub' && cfg.id !== PAGE.sport) return;
    const sp = STATE.sports[cfg.id];
    if (!sp) return;
    sp.tournaments.forEach(t => out.push({ t, sport: cfg, sp }));
  });
  return out;
}
function generateNews(){
  const items = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    const ch = crownWinner(cfg);
    if (ch) items.push(teamName(sp, ch).toUpperCase() + ' HOLD THE ' + String(cfg.crown).toUpperCase() + ' (' + cfg.name.toUpperCase() + ')');
    sp.tournaments.forEach(t => {
      if (t.aw && t.aw.ch) {
        const holder = t.n[t.aw.ch] ? t.n[t.aw.ch].name : t.aw.ch;
        items.push((t.meta.e || t.meta.id).toUpperCase() + ' CHAMPIONS: ' + String(holder).toUpperCase());
      }
    });
    sp.matches.slice(-2).reverse().forEach(m => {
      const hn = m.names && m.names[m.home] ? m.names[m.home].name : m.home;
      const an = m.names && m.names[m.away] ? m.names[m.away].name : m.away;
      const score = m.kind === 'cricket' ? (m.sh + '/' + m.hw + '-' + m.sa + '/' + m.aw) : (m.sh + '-' + m.sa);
      items.push((m.event || cfg.name).toUpperCase() + ': ' + hn.toUpperCase() + ' ' + score + ' ' + an.toUpperCase());
    });
  });
  return items;
}
function paintChrome(){
  const wrap = document.getElementById('sport-switch-slot');
  if (wrap) wrap.innerHTML = sportSwitch();
  const tick = document.getElementById('ticker-items');
  if (tick) tick.textContent = generateNews().slice(0, 8).join('  |  ');
}
function setActive(view){
  document.querySelectorAll('nav.main a').forEach(a => a.classList.toggle('active', a.getAttribute('data-view') === view));
}
function navLinks(){
  const rows = [
    ['#home', 'Home'], ['#news', 'News'], ['#players', 'Players'], ['#teams', 'Clubs'],
    ['#awards', 'Awards'], ['#ranking', 'Rankings'], ['#records', 'Records'],
    ['#statistics', 'Full statistics'], ['#archive', 'All competitions']
  ];
  return rows.map(x => '<a class="row" href="' + x[0] + '">\u00bb ' + x[1] + '</a>').join('');
}
function searchBox(){
  return '<form onsubmit="event.preventDefault();location.hash=\'#player/\'+encodeURIComponent(this.q.value)"><input class="search" name="q" placeholder="Player name..."></form>';
}
function archiveFacts(){
  let matches = 0, tours = 0, pens = 0, et = 0, cs = 0, ht = 0, goals = 0, runs = 0, awards = 0;
  const clubs = new Set(), players = new Set();
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    tours += sp.tournaments.length;
    matches += sp.matches.length;
    Object.values(sp.teams).forEach(t => clubs.add(t.abbr));
    Object.values(sp.players).forEach(p => { players.add(p.name.toLowerCase()); ht += cfg.scoring === 'cricket' ? 0 : (p.hatTricks || 0); });
    sp.tournaments.forEach(t => { awards += Object.keys(t.aw || {}).length; });
    sp.matches.forEach(m => {
      if (m.p) pens++;
      if (m.et) et++;
      if (m.kind === 'cricket') runs += m.sh + m.sa;
      else {
        goals += m.sh + m.sa;
        if (m.sh === 0 || m.sa === 0) cs++;
      }
    });
  });
  return { clubs: clubs.size, players: players.size, matches, tours, pens, et, cs, ht, goals, runs, awards };
}
function collectPlayers(){
  const map = {};
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    Object.values(sp.players).forEach(p => {
      const k = p.name.toLowerCase();
      if (!map[k]) map[k] = { name: p.name, goals: 0, runs: 0, assists: 0, matches: 0, wins: 0, draws: 0, losses: 0, titles: 0, hatTricks: 0, conceded: 0, awards: [], trophies: [], teams: new Set(), clubNames: new Set(), bySport: {} };
      if (cfg.scoring === 'cricket') map[k].runs += p.goals;
      else { map[k].goals += p.goals; map[k].assists += p.assists; }
      map[k].matches += p.matches;
      map[k].wins += p.wins; map[k].draws += p.draws; map[k].losses += p.losses;
      map[k].titles += p.titles;
      map[k].hatTricks += cfg.scoring === 'cricket' ? 0 : p.hatTricks;
      map[k].awards = map[k].awards.concat(p.awards || []);
      map[k].trophies = map[k].trophies.concat(p.trophies || []);
      p.teams.forEach(t => map[k].teams.add(t));
      p.clubNames.forEach(t => map[k].clubNames.add(t));
      map[k].bySport[cfg.id] = Object.assign({}, p, { runs: cfg.scoring === 'cricket' ? p.goals : 0, goals: cfg.scoring === 'cricket' ? 0 : p.goals });
    });
  });
  Object.values(map).forEach(p => {
    p.winRate = p.matches ? p.wins / p.matches : 0;
    p.gpg = p.matches ? p.goals / p.matches : 0;
    const r = regOf(p.name);
    if (r && r.clubs) r.clubs.forEach(c => p.teams.add(c));
  });
  return Object.values(map);
}
