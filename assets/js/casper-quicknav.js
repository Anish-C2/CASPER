/* CASPER Quick Navigation — dense archive desk pages */
(function(){
  function esc(v){ return escapeHtml(String(v == null ? '' : v)); }
  function score(m){ return m.kind === 'cricket' ? (m.sh + '/' + m.hw + ' – ' + m.sa + '/' + m.aw) : (m.sh + '–' + m.sa); }
  function matchRows(limit){
    const rows=[];
    STATE.sportsCfg.sports.forEach(cfg=>{
      const sp=STATE.sports[cfg.id]; if(!sp) return;
      sp.matches.forEach(m=>{
        const hn=m.names&&m.names[m.home]?m.names[m.home].name:m.home;
        const an=m.names&&m.names[m.away]?m.names[m.away].name:m.away;
        const sc=[].concat(m.gh||[],m.ga||[]).map(x=>x.name+(x.n>1?' ×'+x.n:'')).join(', ');
        rows.push('<tr><td>'+esc(cfg.name)+'</td><td>'+esc(m.event||'')+'</td><td>'+esc(hn)+' vs '+esc(an)+'</td><td>'+score(m)+'</td><td>'+esc(m.stageLabel||m.stage||'')+'</td><td>'+esc(sc)+'</td></tr>');
      });
    });
    return limit ? rows.slice(-limit).reverse().join('') : rows.reverse().join('');
  }
  function allTournamentRows(){
    return allTourneys().filter(x=>x.t.meta.e!=='Seasonal Awards').map(x=>'<tr><td>'+esc(x.sport.name)+'</td><td><a href="#competition/'+encodeURIComponent(x.t.meta.id)+'">'+esc(x.t.meta.e||x.t.meta.id)+'</a></td><td>'+x.t.m.length+'</td><td>'+esc(x.t.meta.s||'')+'</td><td>'+esc(x.t.meta.sts||'')+'</td></tr>').join('');
  }
  function rankingRows(kind){
    const list=collectPlayers().slice().sort((a,b)=>{
      if(kind==='assists') return b.assists-a.assists||b.goals-a.goals;
      return b.goals-a.goals||b.assists-a.assists;
    });
    return list.map((p,i)=>'<tr class="'+(i===0?'rank-gold':'')+'"><td>'+(i+1)+'</td><td><a href="#player/'+encodeURIComponent(p.name)+'">'+esc(p.name)+'</a></td><td>'+esc(clubLabel(p))+'</td><td class="num">'+(kind==='assists'?p.assists:p.goals)+'</td><td class="num">'+p.matches+'</td><td class="num">'+p.titles+'</td></tr>').join('');
  }
  function cleanSheetRows(){
    const map={};
    STATE.sportsCfg.sports.forEach(cfg=>{
      if(cfg.scoring==='cricket') return;
      const sp=STATE.sports[cfg.id]; if(!sp) return;
      Object.values(sp.teams).forEach(t=>{ if(!map[t.abbr]) map[t.abbr]={name:t.name,cs:0,m:0}; });
      sp.matches.forEach(m=>{
        if(m.sa===0&&map[m.home]) map[m.home].cs++;
        if(m.sh===0&&map[m.away]) map[m.away].cs++;
        if(map[m.home]) map[m.home].m++;
        if(map[m.away]) map[m.away].m++;
      });
    });
    return Object.values(map).sort((a,b)=>b.cs-a.cs||a.name.localeCompare(b.name)).map((t,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(t.name)+'</td><td class="num">'+t.cs+'</td><td class="num">'+t.m+'</td></tr>').join('');
  }
  function awardRows(labelMatch){
    const rows=[];
    allTourneys().forEach(({t,sport})=>Object.keys(t.aw||{}).forEach(code=>{
      const label=labelAward(code);
      if(!labelMatch || label.toLowerCase().includes(labelMatch)) rows.push('<tr><td>'+esc(sport.name)+'</td><td><a href="#competition/'+encodeURIComponent(t.meta.id)+'">'+esc(t.meta.e||t.meta.id)+'</a></td><td>'+esc(label)+'</td><td>'+esc(t.n[t.aw[code]]?t.n[t.aw[code]].name:t.aw[code])+'</td></tr>');
    }));
    return rows.join('');
  }
  function page(title,sub,body){
    return '<div class="box"><h2>'+esc(title)+'</h2><p class="muted">'+esc(sub||'')+'</p></div>'+body;
  }
  function twoCol(a,b){ return '<div class="grid2">'+a+b+'</div>'; }
  function renderFixturesPage(){
    const rows=[];
    allTourneys().forEach(({t,sport})=>{
      if(/progress|upcoming|remain/i.test(String(t.meta.sts||'')) || !t.aw.ch) rows.push('<tr><td>'+esc(sport.name)+'</td><td><a href="#competition/'+encodeURIComponent(t.meta.id)+'">'+esc(t.meta.e||t.meta.id)+'</a></td><td>'+esc(t.meta.sts||'Open')+'</td><td>'+t.m.length+'</td></tr>');
    });
    return page("Today's Fixtures","Open or unfinished competitions currently represented in the archive.",'<div class="box"><h3>Fixtures / open series</h3>'+tableWrap('<th>Sport</th><th>Competition</th><th>Status</th><th>Matches logged</th>',rows.join('')||'<tr><td colspan="4">No open fixture block. Next fixture will appear when serialized into CSN.</td></tr>')+'</div>');
  }
  function renderResultsPage(){ return page('Recent Results','Latest completed matches across Football, Futsal and Cricket.','<div class="box"><h3>Match archive</h3>'+tableWrap('<th>Sport</th><th>Event</th><th>Match</th><th>Score</th><th>Stage</th><th>Scorers</th>',matchRows())+'</div>'); }
  function renderLeagueTablesPage(){
    return page('League Tables','Every competition table generated directly from the archive.','<div class="grid2">'+allTourneys().filter(x=>x.t.meta.e!=='Seasonal Awards').map(({t,sport})=>'<div class="box"><h3>'+esc(sport.name)+' · '+esc(t.meta.e||t.meta.id)+'</h3>'+tableWrap('<th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>For</th><th>Ag</th><th>Diff</th><th>Pts</th>',calcTable(t,sport).map((r,i)=>'<tr class="'+(i===0?'rank-gold':'')+'"><td>'+(i+1)+'</td><td><a href="#team/'+encodeURIComponent(r.abbr)+'">'+esc(r.name)+'</a></td><td>'+r.p+'</td><td>'+r.w+'</td><td>'+r.d+'</td><td>'+r.l+'</td><td>'+r.gf+'</td><td>'+r.ga+'</td><td>'+((r.gd>0?'+':'')+r.gd)+'</td><td>'+r.pts+'</td></tr>').join(''))+'</div>').join('')+'</div>');
  }
  function renderTopPage(kind){
    const title=kind==='assists'?'Top Assists':'Top Scorers';
    return page(title,'Cross-sport player leaderboard. Goals are used for football/futsal; cricket runs remain on the Runs table.','<div class="box"><h3>'+esc(title)+'</h3>'+tableWrap('<th>#</th><th>Player</th><th>Clubs</th><th>'+(kind==='assists'?'A':'G')+'</th><th>M</th><th>Titles</th>',rankingRows(kind))+'</div>');
  }
  function renderCleanSheets(){ return page('Clean Sheets','Team clean sheets calculated from completed football/futsal match scores.','<div class="box">'+tableWrap('<th>#</th><th>Club</th><th>Clean sheets</th><th>Matches</th>',cleanSheetRows())+'</div>'); }
  function renderAwardDesk(kind){
    const label=kind==='golden-glove'?'Golden Glove':'Fair Play';
    const rows=awardRows(kind==='golden-glove'?'golden glove':'fair play');
    return page(label,'Award records issued by CASPER competitions.','<div class="box"><h3>'+esc(label)+' archive</h3>'+tableWrap('<th>Sport</th><th>Event</th><th>Award</th><th>Holder</th>',rows||'<tr><td colspan="4">No matching award has been serialized yet.</td></tr>')+'</div>');
  }
  function renderSearchPage(){ return page('Player Search','Search the registered CASPER player archive.','<div class="box"><h3>Search CASPER</h3>'+searchBox()+'</div><div class="box"><h3>Player Registry</h3>'+tableWrap('<th>#</th><th>Player</th><th>Clubs</th><th>G</th><th>R</th><th>A</th><th>M</th>',collectPlayers().sort((a,b)=>a.name.localeCompare(b.name)).map((p,i)=>'<tr><td>'+(i+1)+'</td><td><a href="#player/'+encodeURIComponent(p.name)+'">'+esc(p.name)+'</a></td><td>'+esc(clubLabel(p))+'</td><td>'+p.goals+'</td><td>'+p.runs+'</td><td>'+p.assists+'</td><td>'+p.matches+'</td></tr>').join(''))+'</div>'); }
  function renderComparePage(parts){
    const names=[decodeURIComponent(parts[1]||''),decodeURIComponent(parts[2]||'')];
    const players=names.map(n=>collectPlayers().find(p=>p.name.toLowerCase()===n.toLowerCase())).filter(Boolean);
    const form='<div class="box"><h3>Compare two players</h3><form onsubmit="event.preventDefault();location.hash=\'#compare-players/\'+encodeURIComponent(this.a.value)+\'/\'+encodeURIComponent(this.b.value)"><input class="search" name="a" placeholder="Player A"><input class="search" name="b" placeholder="Player B"><button class="oldbutton" type="submit">Compare</button></form></div>';
    if(players.length<2) return page('Compare Players','Select two registered players to compare career output.',form+'<div class="box"><p class="muted">Use exact registered player names.</p></div>');
    const a=players[0],b=players[1];
    return page('Compare Players',a.name+' vs '+b.name,form+'<div class="box">'+tableWrap('<th>Metric</th><th>'+esc(a.name)+'</th><th>'+esc(b.name)+'</th>',[['Matches',a.matches,b.matches],['Goals',a.goals,b.goals],['Assists',a.assists,b.assists],['G+A',a.goals+a.assists,b.goals+b.assists],['Runs',a.runs,b.runs],['Wins',a.wins,b.wins],['Titles',a.titles,b.titles],['Awards',(a.awards||[]).length,(b.awards||[]).length]].map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>').join(''))+'</div>');
  }
  function renderSimple(title,sub,content){ return page(title,sub,'<div class="box"><h3>'+esc(title)+'</h3>'+content+'</div>'); }
  function renderTransfers(){ return renderSimple('Transfer Center','Registry and club movement desk.','<p>No separate transfer ledger is currently serialized in CSN. Player club history remains available through the registry and player dossiers.</p><p><a href="#players">Open Players</a> · <a href="#teams">Open Club Directory</a></p>'); }
  function renderShop(){ return renderSimple('CASPER Shop','Archive merchandise desk.','<p>The CASPER archive currently has no active commerce catalogue. Records remain public and free to browse.</p>'); }
  function renderDownloads(){
    const links=STATE.sportsCfg.sports.map(cfg=>'<tr><td>'+esc(cfg.name)+'</td><td><a href="'+cfg.manifest+'">Manifest</a></td><td>'+esc(cfg.dataDir)+'</td></tr>').join('');
    return page('Downloads','Public archive manifests and data entry points.','<div class="box"><h3>Archive manifests</h3>'+tableWrap('<th>Sport</th><th>Manifest</th><th>Data directory</th>',links)+'</div>');
  }
  function renderRules(){ return renderSimple('Rules & Formats','CASPER archive format and competition rules.','<p><b>CSN</b> is the canonical competition serialization format used to generate the archive.</p><p>Competition tables, results, rankings, player records, awards and news are derived from serialized data rather than manually duplicated page content.</p><p>Sport formats are defined in <code>sports.json</code> and each competition carries its own metadata.</p>'); }
  function renderHow(){ return renderSimple('How CASPER Works','From CSN to public archive.','<ol><li>CASPER loads the configured sport manifests.</li><li>CSN competition files are parsed into the common archive model.</li><li>Matches are used to calculate tables, records and player statistics.</li><li>The same data powers the homepage, player dossiers, club pages and competition pages.</li><li>Hash navigation keeps the portal fast while preserving a static GitHub Pages deployment.</li></ol>'); }
  function renderContact(){ return renderSimple('Contact Us','CASPER administration desk.','<p>For archive corrections, new serialized competitions or site issues, contact the CASPER administrator through the project repository.</p><p><a href="https://github.com/Anish-C2/CASPER">CASPER on GitHub</a></p>'); }
  function renderSitemap(){ const links=[['Home','#home'],['News','#news'],['Archive','#archive'],['Competitions','#competitions'],['Players','#players'],['Teams','#teams'],['Awards','#awards'],['Ranking','#ranking'],['Records','#records'],['Statistics','#statistics'],['Live Scores','#live-scores'],['Fixtures','#fixtures'],['Results','#results'],['League Tables','#league-tables'],['Top Scorers','#top-scorers'],['Top Assists','#top-assists'],['Clean Sheets','#clean-sheets'],['Golden Glove','#golden-glove'],['Fair Play','#fair-play'],['Club Directory','#club-directory'],['Player Search','#player-search'],['Compare Players','#compare-players'],['Transfer Center','#transfer-center'],['CASPER Store','#shop'],['Downloads','#downloads'],['Rules & Formats','#rules'],['How CASPER Works','#how-casper-works'],['Contact Us','#contact'],['Site Map','#site-map']]; return page('Site Map','Every promised quick-navigation destination.','<div class="grid3">'+links.map(x=>'<div class="box"><a href="'+x[1]+'">» '+esc(x[0])+'</a></div>').join('')+'</div>'); }
  function renderLive(){ return renderSimple('Live Scores','CASPER is an archive-first static portal.','<p class="muted">No live feed is currently configured. Active or unfinished competitions are listed under Fixtures.</p><p><a href="#fixtures">Open Fixtures</a></p>'); }
  function quickRoute(){
    const hash=(location.hash||'#home').slice(1), parts=hash.split('/'), view=parts[0];
    if(view==='live-scores') return renderLive();
    if(view==='fixtures') return renderFixturesPage();
    if(view==='results') return renderResultsPage();
    if(view==='league-tables') return renderLeagueTablesPage();
    if(view==='top-scorers') return renderTopPage('scorers');
    if(view==='top-assists') return renderTopPage('assists');
    if(view==='clean-sheets') return renderCleanSheets();
    if(view==='golden-glove') return renderAwardDesk('golden-glove');
    if(view==='fair-play') return renderAwardDesk('fair-play');
    if(view==='club-directory') return renderTeams();
    if(view==='player-search') return renderSearchPage();
    if(view==='compare-players') return renderComparePage(parts);
    if(view==='transfer-center') return renderTransfers();
    if(view==='shop') return renderShop();
    if(view==='downloads') return renderDownloads();
    if(view==='rules') return renderRules();
    if(view==='how-casper-works') return renderHow();
    if(view==='contact') return renderContact();
    if(view==='site-map') return renderSitemap();
    return null;
  }
  const originalNav=window.navLinks;
  window.navLinks=function(){
    const rows=[['#live-scores','Live Scores'],['#fixtures','Fixtures'],['#results','Results'],['#league-tables','League Tables'],['#top-scorers','Top Scorers'],['#top-assists','Assist Leaders'],['#clean-sheets','Clean Sheets'],['#golden-glove','Golden Glove'],['#fair-play','Fair Play Table'],['#club-directory','Club Directory'],['#player-search','Player Search'],['#compare-players','Compare Players'],['#transfer-center','Transfer Center'],['#shop','CASPER Store'],['#downloads','Downloads'],['#rules','Rules & Formats'],['#how-casper-works','How CASPER Works'],['#contact','Contact Us'],['#site-map','Site Map']];
    return rows.map(x=>'<a class="row" href="'+x[0]+'">» '+x[1]+'</a>').join('');
  };
  const originalRoute=window.route;
  window.route=function(){
    const quick=quickRoute();
    if(quick!==null){
      const hash=(location.hash||'#home').slice(1), view=hash.split('/')[0];
      setActive(view==='club-directory'?'teams':view==='player-search'||view==='compare-players'?'players':view==='golden-glove'||view==='fair-play'?'awards':view==='top-scorers'||view==='top-assists'?'players':view==='league-tables'||view==='fixtures'||view==='results'?'archive':view);
      document.getElementById('app').innerHTML=quick;
      return;
    }
    return originalRoute();
  };
  function install(){
    if(window.STATE&&STATE.sportsCfg&&STATE.sportsCfg.sports&&STATE.sportsCfg.sports.length){
      window.route();
      document.querySelectorAll('aside a.row').forEach(a=>a.addEventListener('click',function(){ setTimeout(window.route,0); }));
    } else setTimeout(install,100);
  }
  install();
})();
