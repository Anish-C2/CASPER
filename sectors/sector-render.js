/* CASPER — standalone sector archive renderer. It intentionally reads ONLY the sector archive. */
(function(){
  'use strict';
  var root=(window.CASPER_PAGE&&window.CASPER_PAGE.root)||'../';
  var sectorId=(window.CASPER_PAGE&&window.CASPER_PAGE.sector)||'sector-1';
  var app=document.getElementById('sector-app');
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  function empty(msg){app.innerHTML='<div class="sector-wrap"><div class="sector-card"><div class="sector-muted">'+esc(msg)+'</div></div></div>';}
  function load(path){return fetch(root+path+'?v=20260910sector').then(function(r){if(!r.ok)throw Error('Could not load '+path);return r.json();});}
  function parseFiles(files){var all=[],p=Promise.resolve();(files||[]).forEach(function(f){p=p.then(function(){return fetch(root+'data/sectors/'+sectorId+'/'+f+'?v=20260910sector').then(function(r){return r.ok?r.text():'';}).then(function(text){if(text&&typeof parseCSN==='function')all.push.apply(all,parseCSN(text)||[]);});});});return p.then(function(){return all;});}
  function score(m){if(m.kind==='cricket')return m.sh+'/'+m.hw+' – '+m.sa+'/'+m.aw;return m.sh+'–'+m.sa;}
  function result(m){if(m.p)return m.p[0]>m.p[1]?'H':m.p[0]<m.p[1]?'A':'D';return m.sh>m.sa?'H':m.sh<m.sa?'A':'D';}
  function nameOf(t,code){return t&&t.n&&t.n[code]&&t.n[code].name||code;}
  function render(sector,tours){
    var comps=tours.filter(function(t){return t.meta&&t.meta.id;});
    var clubSet={};(sector.clubCodes||[]).forEach(function(c){clubSet[String(c).toLowerCase()]=c;});
    var matches=[];comps.forEach(function(t){(t.m||[]).forEach(function(m){if(clubSet[String(m.home).toLowerCase()]&&clubSet[String(m.away).toLowerCase()])matches.push({m:m,t:t});});});
    var clubs={};
    (sector.clubCodes||[]).forEach(function(code){clubs[code]={code:code,name:code.toUpperCase(),p:0,w:0,d:0,l:0,gf:0,ga:0};});
    comps.forEach(function(t){Object.keys(t.n||{}).forEach(function(c){if(clubSet[String(c).toLowerCase()])clubs[clubSet[String(c).toLowerCase()]].name=t.n[c].name||c;});});
    matches.forEach(function(x){var m=x.m,h=clubSet[String(m.home).toLowerCase()],a=clubSet[String(m.away).toLowerCase()];if(!clubs[h]||!clubs[a])return;clubs[h].gf+=m.sh||0;clubs[h].ga+=m.sa||0;clubs[a].gf+=m.sa||0;clubs[a].ga+=m.sh||0;var r=result(m);if(r==='H'){clubs[h].w++;clubs[a].l++;clubs[h].p+=3;}else if(r==='A'){clubs[a].w++;clubs[h].l++;clubs[a].p+=3;}else{clubs[h].d++;clubs[a].d++;clubs[h].p++;clubs[a].p++;}});
    var standings=Object.values(clubs).sort(function(a,b){return b.p-a.p||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.name.localeCompare(b.name);});
    var scorers={};
    matches.forEach(function(x){var m=x.m;[].concat(m.gh||[],m.ga||[]).forEach(function(g){var k=String(g.name||'').replace(/\(.*?\)/g,'').trim();if(!k)return;if(!scorers[k])scorers[k]={name:k,goals:0};scorers[k].goals+=Number(g.n)||0;});});
    var top=Object.values(scorers).sort(function(a,b){return b.goals-a.goals||a.name.localeCompare(b.name);}).slice(0,8);
    var goalTotal=top.reduce(function(s,p){return s+p.goals;},0);
    var leagueHtml=(sector.leagues||[]).map(function(l){return '<div class="sector-league"><b>'+esc(l.name)+'</b><span class="sector-muted">'+esc(l.sport||'')+' · '+esc(l.season||'')+'</span></div>';}).join('')||'<div class="sector-muted">No leagues registered.</div>';
    var clubHtml=standings.map(function(c){return '<div class="sector-club"><b>'+esc(c.name)+'</b><span>'+esc(c.code)+' · '+(c.w+c.d+c.l)+' matches</span></div>';}).join('')||'<div class="sector-muted">No clubs registered.</div>';
    var resultHtml=matches.slice().reverse().slice(0,10).map(function(x){var m=x.m;return '<div class="sector-row"><span><b>'+esc(nameOf(x.t,m.home))+'</b> <span class="sector-muted">vs</span> <b>'+esc(nameOf(x.t,m.away))+'</b></span><span class="sector-score">'+esc(score(m))+'</span><span class="sector-pill">'+esc((x.t.meta&&x.t.meta.e)||x.t.meta.id)+'</span></div>';}).join('')||'<div class="sector-empty sector-muted">No results logged yet.</div>';
    var scorerHtml=top.map(function(p,i){return '<tr><td>'+esc(p.name)+'</td><td>'+p.goals+'</td></tr>';}).join('')||'<tr><td colspan="2" class="sector-muted">No goal events are logged in this sector yet.</td></tr>';
    var tableHtml=standings.map(function(c,i){return '<tr><td>'+((i+1))+'</td><td>'+esc(c.name)+'</td><td>'+c.p+'</td><td>'+(c.gf-c.ga>0?'+':'')+(c.gf-c.ga)+'</td><td>'+c.gf+'</td></tr>';}).join('');
    app.innerHTML='<div class="sector-wrap">'+
      '<div class="sector-top"><div><div class="sector-kicker">CASPER SECTOR · '+esc(sector.code||sectorId)+'</div><h1 class="sector-title">'+esc(sector.name||sectorId)+'</h1><p class="sector-desc">'+esc(sector.description||'Local competitive ecosystem.')+'</p></div><a class="sector-back" href="index.html">← All Sectors</a></div>'+
      '<div class="sector-stats"><div class="sector-stat"><b>'+standings.length+'</b><span>CLUBS</span></div><div class="sector-stat"><b>'+matches.length+'</b><span>MATCHES</span></div><div class="sector-stat"><b>'+comps.length+'</b><span>COMPETITIONS</span></div><div class="sector-stat"><b>'+matches.reduce(function(s,x){return s+(x.m.sh||0)+(x.m.sa||0);},0)+'</b><span>SCORES</span></div><div class="sector-stat"><b>'+goalTotal+'</b><span>LOGGED GOALS</span></div></div>'+ 
      '<div class="sector-grid"><div><div class="sector-card"><h3>Standings</h3><table class="sector-table"><thead><tr><th>#</th><th>Club</th><th>Pts</th><th>GD</th><th>GF</th></tr></thead><tbody>'+tableHtml+'</tbody></table></div><div class="sector-card"><h3>Recent Results</h3>'+resultHtml+'</div></div><div><div class="sector-card"><h3>Sector Leagues</h3>'+leagueHtml+'</div><div class="sector-card"><h3>Clubs</h3><div class="sector-clubs">'+clubHtml+'</div></div><div class="sector-card"><h3>Top Scorers · Sector tally</h3><table class="sector-table"><thead><tr><th>Player</th><th>Goals</th></tr></thead><tbody>'+scorerHtml+'</tbody></table><div class="sector-footer">Only goal events logged inside this sector archive are counted. Career totals are not used.</div></div></div></div>'+ 
      '<div class="sector-footer">'+esc(sector.name||sectorId)+' · '+esc(sector.status||'Active')+' · '+esc((sector.seasons||[]).join(', '))+'</div></div>';
  }
  Promise.all([load('sectors.json')]).then(function(p){var reg=p[0]||{},sector=(reg.sectors||[]).find(function(s){return s.id===sectorId;});if(!sector)throw Error('Sector not found: '+sectorId);var manifestPath=(sector.archive&&sector.archive.manifest)||('data/sectors/'+sectorId+'/manifest.json');return load(manifestPath).then(function(manifest){return parseFiles(manifest.files||manifest.seasons||[]).then(function(tours){render(sector,tours);});});}).catch(function(e){empty(e.message||'Sector archive failed to load.');});
})();
