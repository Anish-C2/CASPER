/* CASPER HUB — one index.html, hash-routed views, no extra HTML pages. */
(function(){
  'use strict';
  var hooked=false;
  function esc(v){
    return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];});
  }
  function sports(){return (window.STATE&&STATE.sportsCfg&&STATE.sportsCfg.sports)||[];}
  function sp(id){return (STATE.sports&&STATE.sports[id])||{matches:[],tournaments:[],teams:{},players:{},ranked:[]};}
  function players(){try{return collectPlayers()||[];}catch(e){return [];}}
  function teams(){try{return collectTeams()||[];}catch(e){return [];}}
  function pl(p){return '<a href="#player/'+encodeURIComponent(p.name)+'">'+esc(p.name)+'</a>';}
  function tl(t){return '<a href="#team/'+encodeURIComponent(t.abbr)+'">'+esc(t.name)+'</a>';}
  function score(m){return m.kind==='cricket'?(m.sh+'/'+m.hw+' – '+m.sa+'/'+m.aw):(m.sh+'–'+m.sa);}
  function clubNames(p){return p&&p.clubNames&&p.clubNames.size?[].slice.call(p.clubNames).join(', '):(p&&p.club?String(p.club):'—');}
  function allMatches(){var a=[];sports().forEach(function(c){sp(c.id).matches.forEach(function(m){a.push({c:c,m:m});});});return a.reverse();}
  function allComps(){var a=[];sports().forEach(function(c){sp(c.id).tournaments.forEach(function(t){if(t.meta&&t.meta.e!=='Seasonal Awards')a.push({c:c,t:t});});});return a.reverse();}
  function leaders(id,field,n){return Object.values(sp(id).players||{}).sort(function(a,b){return (b[field]||0)-(a[field]||0)||String(a.name).localeCompare(String(b.name));}).slice(0,n);}
  function trophyList(abbr){
    var a=[];
    sports().forEach(function(c){sp(c.id).tournaments.forEach(function(t){
      if(t.meta&&t.meta.e!=='Seasonal Awards'&&t.aw&&t.aw.ch===abbr)a.push({label:'Champion',event:t.meta.e||t.meta.id,season:t.meta.s||'',sport:c.name});
    });});
    return a;
  }
  function compactAwards(p){
    var m={};
    (p.awards||[]).forEach(function(a){var k=String(a.label||a.name||'Award');m[k]=(m[k]||0)+1;});
    return Object.keys(m).sort().map(function(k){return '<span class="hub-chip">'+esc(k)+' ×'+m[k]+'</span>';}).join('')||'<span class="hub-muted">No individual honours recorded.</span>';
  }
  function injectStyle(){
    if(document.getElementById('casper-hub-style'))return;
    var s=document.createElement('style');s.id='casper-hub-style';
    s.textContent=''+
      'html,body{min-height:100%;}'+
      'body{min-height:100vh;display:flex;flex-direction:column;}'+
      'main#app{flex:1 0 auto;}'+
      'footer.site{margin-top:auto;}'+
      '.hub-home{max-width:1480px;margin:0 auto;padding:8px;}'+
      '.hub-hero{display:grid;grid-template-columns:1.5fr 1fr;gap:8px;}'+
      '.hub-hero-main,.hub-card,.hub-view,.hub-panel{background:#fffdf6;border:1px solid #b9a77d;box-sizing:border-box;}'+
      '.hub-hero-main{padding:18px;background:linear-gradient(135deg,#142443,#22385b);color:#fff;}'+
      '.hub-eyebrow{font:700 10px Consolas,monospace;letter-spacing:1.2px;color:#e7d59d;}'+
      '.hub-hero-main h2{font:700 34px Georgia,serif;margin:5px 0;}'+
      '.hub-hero-main p{font:13px Georgia,serif;line-height:1.55;max-width:800px;}'+
      '.hub-side{display:grid;grid-template-columns:1fr 1fr;gap:7px;}'+
      '.hub-card{padding:10px;}'+
      '.hub-card h3,.hub-panel h3{margin:0 0 7px;color:#142443;font:700 12px Consolas,monospace;letter-spacing:.2px;}'+
      '.hub-big{font:700 25px Georgia,serif;color:#142443;}'+
      '.hub-small{font:9px Consolas,monospace;color:#6b6256;text-transform:uppercase;}'+
      '.hub-links,.hub-index,.hub-chips{display:flex;flex-wrap:wrap;gap:6px;}'+
      '.hub-links{margin-top:11px;}'+
      '.hub-links a,.hub-index a{padding:7px 9px;border:1px solid #b9a77d;background:#fffdf6;color:#142443;text-decoration:none;font:700 10px Consolas,monospace;}'+
      '.hub-links a:hover,.hub-index a:hover{background:#f1dfb7;}'+
      '.hub-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:8px 0;}'+
      '.hub-stat{padding:10px;text-align:center;background:#f1dfb7;border:1px solid #b9a77d;}'+
      '.hub-stat b{display:block;font:700 22px Georgia,serif;color:#142443;}'+
      '.hub-stat span{font:8px Consolas,monospace;color:#6b6256;text-transform:uppercase;}'+
      '.hub-title{display:flex;align-items:center;gap:8px;margin:14px 0 7px;font:700 12px Consolas,monospace;color:#142443;}'+
      '.hub-title i{height:1px;background:#b9a77d;flex:1;}'+
      '.hub-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}'+
      '.hub-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}'+
      '.hub-row,.hub-rank{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid #e1d5bb;font:10px Consolas,monospace;}'+
      '.hub-row:last-child,.hub-rank:last-child{border-bottom:0;}'+
      '.hub-rankname{flex:1;font:10px Georgia,serif;color:#142443;}'+
      '.hub-no{width:20px;text-align:center;color:#8c6f27;font-weight:700;}'+
      '.hub-rankscore{color:#142443;font-weight:700;}'+
      '.hub-result{display:grid;grid-template-columns:70px 1fr auto;gap:7px;align-items:center;padding:7px 0;border-bottom:1px solid #e1d5bb;}'+
      '.hub-tag{font:8px Consolas,monospace;color:#6b6256;text-transform:uppercase;}'+
      '.hub-match{font:10px Georgia,serif;color:#142443;}'+
      '.hub-score{font:700 14px Georgia,serif;color:#142443;white-space:nowrap;}'+
      '.hub-view{padding:13px;margin-top:8px;}'+
      '.hub-view h2{margin:0 0 12px;color:#142443;font:700 20px Georgia,serif;border-bottom:1px solid #b9a77d;padding-bottom:7px;}'+
      '.hub-view h4{margin:10px 0 5px;color:#142443;font:700 11px Consolas,monospace;}'+
      '.hub-note{padding:10px;background:#f7f1e3;border:1px solid #d4c4a0;font:11px Georgia,serif;color:#5f574b;}'+
      '.hub-clubs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}'+
      '.hub-club{padding:10px;border:1px solid #d4c4a0;background:#fffdf6;}'+
      '.hub-club b{display:block;font:700 12px Georgia,serif;color:#142443;}'+
      '.hub-club span{display:block;margin-top:4px;font:9px Consolas,monospace;color:#6b6256;}'+
      '.hub-chip{display:inline-block;padding:6px 8px;background:#f1dfb7;border:1px solid #b9a77d;font:700 9px Consolas,monospace;color:#142443;}'+
      '.hub-muted{color:#6b6256;font:10px Consolas,monospace;}'+
      '.hub-section{padding:11px;border-top:1px solid #d4c4a0;}'+
      '.hub-section:first-child{border-top:0;}'+
      '.hub-section-title{font:700 11px Consolas,monospace;color:#142443;margin-bottom:7px;}'+
      '.hub-form{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}'+
      '.hub-form label{display:block;font:700 9px Consolas,monospace;color:#6b6256;margin-bottom:4px;}'+
      '.hub-form select,.hub-form input{width:100%;box-sizing:border-box;padding:8px;border:1px solid #b9a77d;background:#fffdf6;color:#142443;font:11px Consolas,monospace;}'+
      '.hub-compare{display:grid;grid-template-columns:1fr 1fr;gap:8px;}'+
      '.hub-compare-card{padding:12px;background:#f7f1e3;border:1px solid #d4c4a0;}'+
      '.hub-compare-card h3{font:700 18px Georgia,serif;color:#142443;border-bottom:1px solid #d4c4a0;padding-bottom:6px;}'+
      '.hub-metric{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e1d5bb;font:10px Consolas,monospace;}'+
      '.hub-metric b{color:#142443;}'+
      '.hub-doc{background:#fffdf6;border:1px solid #d4c4a0;padding:11px;margin-bottom:7px;}'+
      '.hub-doc h3{font:700 14px Georgia,serif;color:#142443;margin:0 0 6px;}'+
      '.hub-code{background:#142443;color:#f1dfb7;padding:10px;overflow:auto;font:10px Consolas,monospace;white-space:pre-wrap;}'+
      '.hub-governance{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}'+
      '@media(max-width:950px){.hub-hero,.hub-grid2{grid-template-columns:1fr;}.hub-grid3,.hub-governance{grid-template-columns:1fr 1fr;}.hub-clubs{grid-template-columns:repeat(2,1fr);}}'+
      '@media(max-width:600px){.hub-stats,.hub-grid3,.hub-governance,.hub-clubs,.hub-compare,.hub-form{grid-template-columns:1fr;}.hub-side{grid-template-columns:1fr;}.hub-result{grid-template-columns:58px 1fr;}.hub-score{grid-column:2;}}';
    document.head.appendChild(s);
  }
  function factData(){
    var ps=players(),ts=teams(),ms=allMatches(),cs=allComps(),goals=0,runs=0;
    sports().forEach(function(c){Object.values(sp(c.id).players||{}).forEach(function(p){goals+=Number(p.goals||0);runs+=Number(p.runs||0);});});
    return {players:ps.length,clubs:ts.length,matches:ms.length,comps:cs.length,goals:goals,runs:runs};
  }
  function home(){
    var f=factData();
    return '<div class="hub-home">'+
      '<div class="hub-hero"><div class="hub-hero-main"><div class="hub-eyebrow">COMPETITIVE ATHLETICS & SPORTS PROMOTION</div><h2>CASPER ARCHIVE</h2><p>The central public record for CASPER football, futsal and cricket. Competition history, clubs, players, rankings, records and CSN documentation — all inside one navigable archive.</p><div class="hub-links"><a href="#archive">BROWSE ARCHIVE</a><a href="#players">PLAYER ARCHIVE</a><a href="#teams">CLUB ARCHIVE</a><a href="#docs-csn">CSN DOCUMENTATION</a></div></div><div class="hub-side"><div class="hub-card"><h3>ARCHIVE STATUS</h3><div class="hub-big">ONLINE</div><div class="hub-small">CSN data source</div></div><div class="hub-card"><h3>SPORTS</h3><div class="hub-big">'+sports().length+'</div><div class="hub-small">active desks</div></div><div class="hub-card"><h3>PLAYERS</h3><div class="hub-big">'+f.players+'</div><div class="hub-small">registered</div></div><div class="hub-card"><h3>CLUBS</h3><div class="hub-big">'+f.clubs+'</div><div class="hub-small">archive total</div></div></div></div>'+
      '<div class="hub-stats"><div class="hub-stat"><b>'+f.matches+'</b><span>Matches</span></div><div class="hub-stat"><b>'+f.comps+'</b><span>Competitions</span></div><div class="hub-stat"><b>'+f.goals+'</b><span>Goals</span></div><div class="hub-stat"><b>'+f.runs+'</b><span>Runs</span></div></div>'+
      section('SPORT DESKS',sportCards())+section('PLAYER LEADERS',leaderCards())+section('RECENT RESULTS',recentCards())+section('ARCHIVE SNAPSHOT',archiveCards())+
      section('CASPER INDEX','<div class="hub-index">'+indexLinks()+'</div>')+
      '</div>';
  }
  function section(t,b){return '<div class="hub-title"><span>'+t+'</span><i></i></div>'+b;}
  function sportCards(){return '<div class="hub-grid3">'+sports().map(function(c){var s=sp(c.id),field=c.scoring==='cricket'?'runs':'goals',p=leaders(c.id,field,1)[0],last=s.tournaments.filter(function(t){return t.meta.e!=='Seasonal Awards';}).slice(-1)[0];return '<div class="hub-card"><h3>'+esc(c.name)+'</h3><div class="hub-big">'+s.matches.length+'</div><div class="hub-small">matches · '+s.tournaments.filter(function(t){return t.meta.e!=='Seasonal Awards';}).length+' competitions</div><div class="hub-row"><span>Leader</span><b>'+(p?pl(p):'—')+'</b></div><div class="hub-row"><span>'+(c.scoring==='cricket'?'Runs':'Goals')+'</span><b>'+(p?(p[field]||0):0)+'</b></div><div class="hub-row"><span>Latest competition</span><b>'+(last?esc(last.meta.e||last.meta.id):'—')+'</b></div></div>';}).join('')+'</div>';}
  function leaderCards(){return '<div class="hub-grid3">'+sports().map(function(c){var field=c.scoring==='cricket'?'runs':'goals';return '<div class="hub-card"><h3>'+esc(c.name)+' · '+(field==='runs'?'RUNS':'GOALS')+'</h3>'+leaders(c.id,field,6).map(function(p,i){return '<div class="hub-rank"><span class="hub-no">'+(i+1)+'</span><span class="hub-rankname">'+pl(p)+'<br><small>'+esc(clubNames(p))+'</small></span><b class="hub-rankscore">'+(p[field]||0)+'</b></div>';}).join('')+'</div>';}).join('')+'</div>';}
  function recentCards(){return '<div class="hub-grid3">'+sports().map(function(c){return '<div class="hub-card"><h3>'+esc(c.name)+' · RECENT</h3>'+allMatches().filter(function(x){return x.c.id===c.id;}).slice(0,5).map(function(x){var m=x.m,hn=m.names&&m.names[m.home]?m.names[m.home].name:m.home,an=m.names&&m.names[m.away]?m.names[m.away].name:m.away;return '<div class="hub-result"><span class="hub-tag">'+esc(m.stageLabel||m.stage||'Result')+'</span><span class="hub-match">'+esc(hn)+' vs '+esc(an)+'</span><b class="hub-score">'+score(m)+'</b></div>';}).join('')||'<div class="hub-note">No results recorded.</div>'+'</div>';}).join('')+'</div>';}
  function archiveCards(){return '<div class="hub-grid2"><div class="hub-card"><h3>LATEST COMPETITIONS</h3>'+allComps().slice(0,8).map(function(x){return '<div class="hub-row"><span>'+esc(x.c.name)+'</span><b><a href="#competition/'+encodeURIComponent(x.t.meta.id)+'">'+esc(x.t.meta.e||x.t.meta.id)+'</a></b></div>';}).join('')+'</div><div class="hub-card"><h3>GLOBAL CLUB RANKING</h3>'+globalRanks().slice(0,8).map(function(r,i){return '<div class="hub-rank"><span class="hub-no">'+(i+1)+'</span><span class="hub-rankname">'+tl({abbr:r.abbr,name:r.name})+'</span><b class="hub-rankscore">'+Number(r.avgRank||0).toFixed(2)+'</b></div>';}).join('')+'</div></div>';}
  function indexLinks(){return [['live-scores','LIVE SCORES'],['fixtures','FIXTURES'],['results','RESULTS'],['league-tables','LEAGUE TABLES'],['top-scorers','GOALS BY SPORT'],['top-assists','ASSISTS BY SPORT'],['clean-sheets','CLEAN SHEETS'],['player-search','PLAYER SEARCH'],['compare-players','COMPARE PLAYERS'],['club-directory','CLUB DIRECTORY'],['awards','AWARDS'],['ranking','GLOBAL RANKING'],['records','RECORDS'],['statistics','STATISTICS'],['news','NEWS'],['about','ABOUT'],['downloads','DOWNLOADS'],['rules','RULES & FORMATS'],['docs-csn','CSN DOCUMENTATION'],['site-map','SITE MAP']].map(function(x){return '<a href="#'+x[0]+'">'+x[1]+'</a>';}).join('');}
  function page(title,body){return '<div class="hub-home"><section class="hub-view"><h2>'+title+'</h2>'+body+'</section></div>';}
  function resultsPage(){return page('MATCH CENTRE · RESULTS','<div class="hub-grid3">'+allMatches().map(function(x){var m=x.m,hn=m.names&&m.names[m.home]?m.names[m.home].name:m.home,an=m.names&&m.names[m.away]?m.names[m.away].name:m.away;return '<div class="hub-card"><h3>'+esc(x.c.name)+'</h3><div class="hub-small">'+esc(m.event||'')+' · '+esc(m.stageLabel||m.stage||'')+'</div><p><b>'+esc(hn)+'</b> vs <b>'+esc(an)+'</b></p><div class="hub-big">'+score(m)+'</div></div>';}).join('')+'</div>');}
  function standingsPage(){return page('MATCH CENTRE · LEAGUE TABLES','<div class="hub-grid3">'+sports().map(function(c){return '<div class="hub-card"><h3>'+esc(c.name)+'</h3>'+(sp(c.id).ranked||[]).slice(0,12).map(function(t,i){return '<div class="hub-rank"><span class="hub-no">'+(i+1)+'</span><span class="hub-rankname">'+tl(t)+'</span><b class="hub-rankscore">'+(t.pts||0)+'</b></div>';}).join('')+'</div>';}).join('')+'</div>');}
  function playerStatsPage(field,title){return page(title,'<div class="hub-grid3">'+sports().map(function(c){return '<div class="hub-card"><h3>'+esc(c.name)+'</h3>'+leaders(c.id,field,12).map(function(p,i){return '<div class="hub-rank"><span class="hub-no">'+(i+1)+'</span><span class="hub-rankname">'+pl(p)+'<br><small>'+esc(clubNames(p))+'</small></span><b class="hub-rankscore">'+(p[field]||0)+'</b></div>';}).join('')+'</div>';}).join('')+'</div>');}
  function cleanPage(){return page('PLAYER CENTRE · CLEAN SHEETS','<div class="hub-grid3">'+sports().map(function(c){return '<div class="hub-card"><h3>'+esc(c.name)+'</h3>'+Object.values(sp(c.id).teams||{}).sort(function(a,b){return (b.cleanSheets||0)-(a.cleanSheets||0);}).slice(0,12).map(function(t,i){return '<div class="hub-rank"><span class="hub-no">'+(i+1)+'</span><span class="hub-rankname">'+tl(t)+'</span><b class="hub-rankscore">'+(t.cleanSheets||0)+'</b></div>';}).join('')+'</div>';}).join('')+'</div>');}
  function playerSearchPage(){var ps=players().sort(function(a,b){return String(a.name).localeCompare(String(b.name));});return page('PLAYER CENTRE · PLAYER SEARCH','<div class="hub-panel"><div class="hub-form"><div><label>PLAYER SEARCH</label><input id="hub-player-filter" placeholder="Player name…"></div><div><label>OPEN RECORD</label><div class="hub-note">Type a name to filter the archive below.</div></div></div><div id="hub-player-list" class="hub-clubs">'+ps.map(function(p){return '<div class="hub-club" data-player="'+esc(String(p.name).toLowerCase())+'"><b>'+pl(p)+'</b><span>'+esc(clubNames(p))+' · '+(p.goals||0)+' goals · '+(p.runs||0)+' runs</span></div>';}).join('')+'</div></div>');}
  function comparePage(){
    var ps=players().slice().sort(function(a,b){return String(a.name).localeCompare(String(b.name));});
    var opts='<option value="">Select player</option>'+ps.map(function(p){return '<option value="'+esc(p.name)+'">'+esc(p.name)+'</option>';}).join('');
    return page('PLAYER CENTRE · COMPARE PLAYERS','<div class="hub-panel"><div class="hub-form"><div><label>PLAYER A</label><select id="cmp-a">'+opts+'</select></div><div><label>PLAYER B</label><select id="cmp-b">'+opts+'</select></div></div><div id="cmp-output" class="hub-note">Choose two players to compare their CASPER records.</div></div>');
  }
  function compareRender(){
    var a=document.getElementById('cmp-a'),b=document.getElementById('cmp-b'),out=document.getElementById('cmp-output');if(!a||!b||!out)return;
    var ps=players(),A=ps.find(function(p){return p.name===a.value;}),B=ps.find(function(p){return p.name===b.value;});
    if(!A||!B){out.className='hub-note';out.innerHTML='Choose two players to compare their CASPER records.';return;}
    var metrics=[['Matches','matches'],['Goals','goals'],['Assists','assists'],['Runs','runs'],['Titles','titles'],['Win %','winRate']];
    function card(p){return '<div class="hub-compare-card"><h3>'+esc(p.name)+'</h3><div class="hub-small">'+esc(clubNames(p))+'</div>'+metrics.map(function(m){var v=m[1]==='winRate'?(typeof pct==='function'?pct(p[m[1]]):((p[m[1]]||0)*100).toFixed(1)+'%'):(p[m[1]]||0);return '<div class="hub-metric"><span>'+m[0]+'</span><b>'+esc(v)+'</b></div>';}).join('')+'<h4>HONOURS</h4><div class="hub-chips">'+compactAwards(p)+'</div></div>';}
    out.className='hub-compare';out.innerHTML=card(A)+card(B);
  }
  function clubsPage(){return page('ARCHIVE · CLUB DIRECTORY','<div class="hub-clubs">'+teams().sort(function(a,b){return (b.titles||0)-(a.titles||0)||String(a.name).localeCompare(String(b.name));}).map(function(t){var trophies=trophyList(t.abbr);return '<div class="hub-club"><b>'+tl(t)+'</b><span>'+trophies.length+' club trophies · '+(t.matches||0)+' matches</span></div>';}).join('')+'</div>');}
  function awardsPage(){
    var m={};allComps().forEach(function(x){Object.keys(x.t.aw||{}).forEach(function(k){var label=typeof labelAward==='function'?labelAward(k):k;m[label]=(m[label]||0)+1;});});
    return page('ARCHIVE · AWARDS','<div class="hub-note">Awards are archived separately from club trophies. Individual honours never increase a club trophy count.</div><div class="hub-chips" style="margin-top:8px">'+Object.keys(m).sort(function(a,b){return m[b]-m[a];}).map(function(k){return '<span class="hub-chip">'+esc(k)+' ×'+m[k]+'</span>';}).join('')+'</div>');
  }
  function rankingPage(){return page('ARCHIVE · GLOBAL RANKING','<div class="hub-grid3">'+globalRanks().map(function(r,i){return '<div class="hub-card"><div class="hub-rank"><span class="hub-no">'+(i+1)+'</span><span class="hub-rankname">'+tl({abbr:r.abbr,name:r.name})+'</span><b class="hub-rankscore">'+Number(r.avgRank||0).toFixed(2)+'</b></div></div>';}).join('')+'</div><div class="hub-note" style="margin-top:8px">Global ranking is club-based. Player honours are not club trophies.</div>');}
  function recordsPage(){var f=factData();return page('ARCHIVE · RECORDS','<div class="hub-tableless">'+[['Matches',f.matches],['Players',f.players],['Clubs',f.clubs],['Competitions',f.comps],['Goals',f.goals],['Runs',f.runs]].map(function(x){return '<div class="hub-card"><div class="hub-big">'+x[1]+'</div><div class="hub-small">'+x[0]+'</div></div>';}).join('')+'</div>');}
  function statsPage(){return page('ARCHIVE · STATISTICS','<div class="hub-grid3">'+sports().map(function(c){var s=sp(c.id),field=c.scoring==='cricket'?'runs':'goals',total=Object.values(s.players||{}).reduce(function(n,p){return n+(p[field]||0);},0);return '<div class="hub-card"><h3>'+esc(c.name)+'</h3><div class="hub-row"><span>Matches</span><b>'+s.matches.length+'</b></div><div class="hub-row"><span>Competitions</span><b>'+s.tournaments.filter(function(t){return t.meta.e!=='Seasonal Awards';}).length+'</b></div><div class="hub-row"><span>Clubs</span><b>'+Object.keys(s.teams||{}).length+'</b></div><div class="hub-row"><span>'+String(field).toUpperCase()+'</span><b>'+total+'</b></div></div>';}).join('')+'</div>');}
  function aboutPage(){return page('CASPER · ABOUT','<div class="hub-grid2"><div class="hub-card"><h3>CASPER</h3><p>Competitive Athletics & Sports Promotion is the umbrella association and public archive covering football, futsal and cricket.</p><p>CASPER preserves competitive records through CSN, its structured Competition Serialization Notation.</p></div><div class="hub-card"><h3>GOVERNANCE</h3><p>The CASPER Players’ Commission (CPC) represents player interests across the association.</p><p>CPC works with sport-specific player bodies and committees.</p></div></div>'+section('PLAYER & SPORT BODIES','<div class="hub-governance"><div class="hub-card"><h3>CPC</h3><p>CASPER Players’ Commission</p><span class="hub-small">Umbrella player body</span></div><div class="hub-card"><h3>PFAC</h3><p>Players’ Futsal Association of CASPER</p><span class="hub-small">Futsal player body</span></div><div class="hub-card"><h3>PFBC</h3><p>Players’ Football Body of CASPER</p><span class="hub-small">Football player body</span></div><div class="hub-card"><h3>PCAC</h3><p>Players’ Cricket Association of CASPER</p><span class="hub-small">Cricket player body</span></div></div>'));}
  function docsPage(){return page('CASPER · CSN DOCUMENTATION','<div class="hub-doc"><h3>What is CSN?</h3><p>CSN — Competition Serialization Notation — is CASPER’s structured record format for competitions, matches, teams, players, results, awards and metadata.</p></div><div class="hub-doc"><h3>Core structure</h3><div class="hub-code">[id=competition-id; e=Event Name; s=Season; typ=competition; sts=Completed;\n teams(...);\n mt(...);\n aw(...);\n nt(...)]</div></div><div class="hub-doc"><h3>Design rules</h3><p>CSN is intended to be deterministic, archive-friendly and easy for CASPER tooling to parse. The website reads CSN archives and derives statistics instead of maintaining duplicate hand-written tables.</p></div><div class="hub-doc"><h3>Sports</h3><p>Futsal, football and cricket use the same archive philosophy while retaining sport-specific scoring fields.</p></div>');}
  function downloadsPage(){return page('CASPER · DOWNLOADS','<div class="hub-grid2"><div class="hub-card"><h3>CSN DOCUMENTATION</h3><p>Read the built-in CSN specification and examples.</p><div class="hub-links"><a href="#docs-csn">OPEN CSN DOCS →</a></div></div><div class="hub-card"><h3>ARCHIVE DATA</h3><p>The live site is generated from the serialized archive files stored in the repository.</p></div></div>');}
  function rulesPage(){return page('CASPER · RULES & FORMATS','<div class="hub-grid2"><div class="hub-card"><h3>COMPETITIONS</h3><p>Each competition is serialized into CSN and contributes to the relevant sport archive.</p></div><div class="hub-card"><h3>CLUB TROPHIES</h3><p>Club honours count trophies won by the club. Individual player awards never become club trophies.</p></div></div>');}
  function newsPage(){var ms=allMatches().slice(0,12);return page('CASPER · NEWS','<div class="hub-card">'+ms.map(function(x){var m=x.m,hn=m.names&&m.names[m.home]?m.names[m.home].name:m.home,an=m.names&&m.names[m.away]?m.names[m.away].name:m.away;return '<div class="hub-row"><span>'+esc(x.c.name)+' · '+esc(m.event||'Match')+'<br><small>'+esc(hn)+' vs '+esc(an)+'</small></span><b>'+score(m)+'</b></div>';}).join('')+'</div>');}
  function siteMapPage(){return page('CASPER · SITE MAP','<div class="hub-index">'+indexLinks()+'</div>');}
  function genericPage(title,text){return page(title,'<div class="hub-note">'+text+'</div>');}
  function renderHub(){
    var id=(location.hash||'#home').slice(1).split('/')[0];
    var views={
      home:home,results:resultsPage,'live-scores':resultsPage,fixtures:function(){return page('MATCH CENTRE · FIXTURES','<div class="hub-note">Future fixtures will appear here as they are added to the CSN archive.</div>');},'league-tables':standingsPage,
      'top-scorers':function(){return playerStatsPage('goals','PLAYER CENTRE · GOALS BY SPORT');},'top-assists':function(){return playerStatsPage('assists','PLAYER CENTRE · ASSISTS BY SPORT');},'clean-sheets':cleanPage,'player-search':playerSearchPage,'compare-players':comparePage,'club-directory':clubsPage,awards:awardsPage,ranking:rankingPage,records:recordsPage,statistics:statsPage,news:newsPage,about:aboutPage,downloads:downloadsPage,rules:rulesPage,'docs-csn':docsPage,'site-map':siteMapPage,
      archive:function(){return page('ARCHIVE','<div class="hub-grid3"><div class="hub-card"><h3>PLAYERS</h3><p>Browse registered competitors.</p><div class="hub-links"><a href="#players">OPEN PLAYERS →</a></div></div><div class="hub-card"><h3>CLUBS</h3><p>Browse club records and trophy counts.</p><div class="hub-links"><a href="#teams">OPEN CLUBS →</a></div></div><div class="hub-card"><h3>COMPETITIONS</h3><p>Browse serialized competitions.</p><div class="hub-links"><a href="#competitions">OPEN COMPETITIONS →</a></div></div></div>');},
      players:function(){var ps=players().sort(function(a,b){return (b.goals||0)-(a.goals||0);});return page('PLAYER ARCHIVE','<div class="hub-clubs">'+ps.map(function(p){return '<div class="hub-club"><b>'+pl(p)+'</b><span>'+esc(clubNames(p))+' · '+(p.goals||0)+' goals · '+(p.assists||0)+' assists · '+(p.runs||0)+' runs · '+(p.titles||0)+' titles</span><div class="hub-chips" style="margin-top:6px">'+compactAwards(p)+'</div></div>';}).join('')+'</div>');},
      teams:function(){return clubsPage();},
      competitions:function(){return page('COMPETITIONS','<div class="hub-clubs">'+allComps().map(function(x){return '<div class="hub-club"><b><a href="#competition/'+encodeURIComponent(x.t.meta.id)+'">'+esc(x.t.meta.e||x.t.meta.id)+'</a></b><span>'+esc(x.c.name)+' · '+esc(x.t.meta.s||'')+'</span></div>';}).join('')+'</div>');}
    };
    if(!views[id])return false;
    injectStyle();
    document.getElementById('app').innerHTML=views[id]();
    if(typeof setActive==='function')setActive(id==='players'?'players':id==='teams'?'teams':id==='competitions'?'competitions':id==='awards'||id==='ranking'||id==='records'||id==='statistics'?'archive':id);
    if(id==='compare-players')bindCompare();
    if(id==='player-search')bindPlayerSearch();
    window.scrollTo(0,0);
    return true;
  }
  function bindCompare(){var a=document.getElementById('cmp-a'),b=document.getElementById('cmp-b');if(a&&b){a.addEventListener('change',compareRender);b.addEventListener('change',compareRender);}}
  function bindPlayerSearch(){var i=document.getElementById('hub-player-filter');if(!i)return;i.addEventListener('input',function(){var q=i.value.toLowerCase();document.querySelectorAll('[data-player]').forEach(function(el){el.style.display=el.getAttribute('data-player').indexOf(q)>=0?'':'none';});});}
  function hook(){
    if(hooked)return;hooked=true;injectStyle();
    var old=window.route;
    window.route=function(){if(renderHub())return;return old&&old.apply(this,arguments);};
    window.addEventListener('hashchange',function(e){if(renderHub())e.stopImmediatePropagation();},true);
    var tries=0;function bootHook(){if(window.STATE&&STATE.sportsCfg&&STATE.sportsCfg.sports&&STATE.sportsCfg.sports.length){renderHub();}else if(tries++<100)setTimeout(bootHook,100);}bootHook();
  }
  hook();
})();