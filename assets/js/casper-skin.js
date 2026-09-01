function sportSwitch(){
  const cur = PAGE.mode === 'hub' ? 'hub' : PAGE.sport;
  return '<div class="pills"><a href="index.html"' + (cur === 'hub' ? ' class="on"' : '') + '>CASPER</a>' +
    STATE.sportsCfg.sports.map(s => '<a href="' + s.page + '"' + (cur === s.id ? ' class="on"' : '') + '>' + escapeHtml(s.name) + '</a>').join('') + '</div>';
}
function navLinks(){
  const rows = [
    ['#home', 'Live Scores'], ['#home', 'Fixtures'], ['#archive', 'Results'], ['#home', 'League Tables'],
    ['#players', 'Top Scorers'], ['#players', 'Assist Leaders'], ['#records', 'Clean Sheets'],
    ['#awards', 'Golden Glove'], ['#awards', 'Fair Play Table'], ['#teams', 'Club Directory'],
    ['#players', 'Player Search'], ['#players', 'Compare Players'], ['#about', 'Transfer Center'],
    ['#about', 'CASPER Store'], ['#about', 'Downloads'], ['#about', 'Rules & Formats'],
    ['#about', 'How CASPER Works'], ['#about', 'Contact Us'], ['#about', 'Site Map']
  ];
  return rows.map(x => '<a class="row" href="' + x[0] + '">\u00bb ' + x[1] + '</a>').join('');
}
function formatOf(cfg){
  const sp = STATE.sports[cfg.id];
  if (!sp || !sp.tournaments.length) return cfg.unit || cfg.name;
  const t = sp.tournaments[0];
  return t.meta.ven || t.meta.fmt || cfg.unit || cfg.name;
}
function welcomeBlock(){
  const about = STATE.config.about || 'CASPER is a competition archive and historical record system.';
  return '<div class="grid2"><div class="box welcome"><h3>Welcome to CASPER</h3><p>' + escapeHtml(about) + '</p><p class="tiny">One Association. Three Sports. Infinite Legacy.</p></div><div class="box"><h3>Sports we cover</h3><table>' +
    STATE.sportsCfg.sports.map(cfg => {
      const sp = STATE.sports[cfg.id];
      return '<tr><td><b><a href="' + cfg.page + '">' + escapeHtml(cfg.name) + '</a></b></td><td>' + escapeHtml(formatOf(cfg)) + '</td><td>' + ((sp && sp.matches.length) || 0) + ' matches</td><td>' + escapeHtml(cfg.crown) + '</td></tr>';
    }).join('') + '</table></div></div>';
}
function statsStrip(){
  const f = archiveFacts();
  const cells = [['Clubs', f.clubs], ['Players', f.players], ['Comps', f.tours], ['Matches', f.matches], ['Goals', f.goals], ['Runs', f.runs], ['CS', f.cs], ['Pens', f.pens], ['HT', f.ht], ['Awards', f.awards]];
  return '<div class="box"><h3>CASPER statistics</h3><div class="banner">' + cells.map(x => '<div class="cell"><div class="n">' + x[1] + '</div><div class="l">' + x[0] + '</div></div>').join('') + '</div></div>';
}
function featuredBig(){
  return '<div class="hero3">' + STATE.sportsCfg.sports.map(cfg => {
    const html = featuredSport(cfg);
    const extra = '<p class="tiny"><a href="' + cfg.page + '#archive">Table</a> \u00b7 <a href="' + cfg.page + '#archive">Results</a> \u00b7 <a href="' + cfg.page + '#players">Top scorers</a> \u00b7 <a href="' + cfg.page + '#statistics">Stats</a></p>';
    return html.replace('</div>', extra + '</div>');
  }).join('') + '</div>';
}
function upcomingBox(){
  const rows = allTourneys().map(({ t, sport }) => {
    const sts = (t.meta.sts || '').toLowerCase();
    const open = sts.indexOf('progress') >= 0 || sts.indexOf('upcoming') >= 0 || !t.aw.ch;
    return { t, sport, open };
  }).filter(x => x.open);
  if (!rows.length) return '<div class="box"><h3>Upcoming / open</h3><p class="muted">No open competition. Archive is complete except unfinished series.</p></div>';
  return '<div class="box"><h3>Upcoming tournaments</h3>' + tableWrap('<th>Sport</th><th>Competition</th><th>Status</th>', rows.map(x => '<tr><td>' + escapeHtml(x.sport.name) + '</td><td><a href="#competition/' + encodeURIComponent(x.t.meta.id) + '">' + escapeHtml(x.t.meta.e || x.t.meta.id) + '</a></td><td>' + escapeHtml(x.t.meta.sts || 'Open') + '</td></tr>').join('')) + '</div>';
}
function recentList(n){
  const items = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    sp.matches.forEach(m => {
      const hn = m.names && m.names[m.home] ? m.names[m.home].name : m.home;
      const score = m.kind === 'cricket' ? (m.sh + '/' + m.hw + '-' + m.sa + '/' + m.aw) : (m.sh + '-' + m.sa);
      items.push('<div class="stats-line"><span>' + escapeHtml(cfg.name) + ' \u00b7 ' + escapeHtml(hn) + '</span><b>' + score + '</b></div>');
    });
  });
  return items.slice(-n).reverse().join('');
}
function fixturesBox(){
  const rows = [];
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    sp.tournaments.forEach(t => {
      const sts = String(t.meta.sts || '');
      if (/progress|upcoming|remain/i.test(sts)) {
        rows.push('<div class="stats-line"><span>' + escapeHtml(cfg.name) + ' \u00b7 ' + escapeHtml(t.meta.e || t.meta.id) + '</span><b>' + escapeHtml(sts) + '</b></div>');
      }
    });
  });
  return rows.join('') || '<p class="muted">No fixture listed. Next match is written into CSN when played.</p>';
}
function renderHubHome(){
  const people = collectPlayers();
  const scorers = people.slice().sort((a, b) => b.goals - a.goals).slice(0, 8);
  const runs = people.slice().sort((a, b) => b.runs - a.runs).slice(0, 8);
  const assists = people.slice().sort((a, b) => b.assists - a.assists).slice(0, 8);
  return '<div class="layout">' +
    '<aside class="side">' +
      '<div class="box"><h3>Quick navigation</h3>' + navLinks() + '</div>' +
      '<div class="box"><h3>CASPER login</h3><p class="muted">Public archive. Search a registered player.</p>' + searchBox() + '</div>' +
      '<div class="box"><h3>Today\'s fixtures</h3>' + fixturesBox() + '</div>' +
      '<div class="box"><h3>Recent results</h3>' + recentList(8) + '</div>' +
    '</aside>' +
    '<section>' +
      welcomeBlock() +
      statsStrip() +
      featuredBig() +
      '<div class="grid3">' + STATE.sportsCfg.sports.map(miniTable).join('') + '</div>' +
      '<div class="grid3">' +
        '<div class="box"><h3>Top assists</h3>' + tableWrap('<th>#</th><th>Player</th><th class="num">A</th>', assists.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td class="num">' + p.assists + '</td></tr>').join('')) + '</div>' +
        '<div class="box"><h3>CASPER rankings</h3>' + tableWrap('<th>#</th><th>Club</th><th class="num">Avg</th>', globalRanks().slice(0, 8).map((r, i) => '<tr class="' + (i === 0 ? 'rank-gold' : '') + '"><td>' + (i + 1) + '</td><td><a href="#team/' + encodeURIComponent(r.abbr) + '">' + escapeHtml(r.name) + '</a></td><td class="num">' + r.avgRank.toFixed(2) + '</td></tr>').join('')) + '</div>' +
        upcomingBox() +
      '</div>' +
      championsBoard() +
      '<div class="grid2"><div class="box"><h3>Top goals</h3>' + tableWrap('<th>#</th><th>Player</th><th class="num">G</th><th class="num">M</th>', scorers.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td class="num">' + p.goals + '</td><td class="num">' + p.matches + '</td></tr>').join('')) + '</div>' +
      '<div class="box"><h3>Top runs</h3>' + tableWrap('<th>#</th><th>Player</th><th class="num">R</th><th class="num">M</th>', runs.map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td class="num">' + p.runs + '</td><td class="num">' + p.matches + '</td></tr>').join('')) + '</div></div>' +
    '</section>' +
    '<aside>' +
      '<div class="box"><h3>Announcements</h3>' + generateNews().slice(0, 6).map(n => '<div class="news">' + escapeHtml(n) + '</div>').join('') + '</div>' +
      '<div class="box"><h3>CASPER calendar</h3>' + fixturesBox() + '</div>' +
      '<div class="box"><h3>Top goalscorers</h3>' + tableWrap('<th>#</th><th>Player</th><th class="num">G</th>', scorers.slice(0, 6).map((p, i) => '<tr><td>' + (i + 1) + '</td><td><a href="#player/' + encodeURIComponent(p.name) + '">' + escapeHtml(p.name) + '</a></td><td class="num">' + p.goals + '</td></tr>').join('')) + '</div>' +
      '<div class="box"><h3>CASPER shop</h3><p class="muted">Archive merch is not open. Records stay free.</p></div>' +
      '<div class="box"><h3>Connect with CASPER</h3><p class="tiny"><a href="#about">About</a> \u00b7 <a href="#news">News desk</a> \u00b7 <a href="#statistics">Full statistics</a></p></div>' +
    '</aside></div>';
}
