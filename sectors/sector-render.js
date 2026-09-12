/* CASPER — standalone Sector renderer. Competition-, sport-, and owner-scoped; never reads career totals. */
(function(){
'use strict';
var root=(window.CASPER_PAGE&&window.CASPER_PAGE.root)||'../';
var sectorId=(window.CASPER_PAGE&&window.CASPER_PAGE.sector)||'sector-1';
var app=document.getElementById('sector-app')||document.getElementById('app');
var CACHE='?v=20260912fix';
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
function host(){return document.getElementById('sector-app')||document.getElementById('app');}
function empty(m){
  app=host();
  if(!app){console.error(m);return;}
  app.innerHTML='<div class="ed-wrap"><section class="ed-copy"><div class="ed-kicker">SECTOR</div><h1>ARCHIVE UNAVAILABLE</h1><p class="sector-muted">'+esc(m)+'</p><p><a href="index.html">Back to sectors</a></p></section></div>';
}
function get(p){return fetch(root+p+CACHE).then(function(r){if(!r.ok)throw Error('Could not load '+p);return r.json();});}
function sourceSport(path){var p=String(path||'').toLowerCase();if(p.indexOf('/futsal/')>=0||p.indexOf('futsal/')>=0||p.indexOf('futsal-')>=0)return 'futsal';if(p.indexOf('/football/')>=0||p.indexOf('football/')>=0||p.indexOf('football-')>=0)return 'football';if(p.indexOf('/cricket/')>=0||p.indexOf('cricket/')>=0||p.indexOf('cricket-')>=0)return 'cricket';return '';}
function resolveCSN(file){
  var f=String(file||'');
  if(!f)return '';
  if(/^https?:/i.test(f))return f;
  if(f.charAt(0)==='/')f=f.replace(/^\/+/, '');
  if(/^data\//.test(f))return root+f;
  return root+'data/sectors/'+sectorId+'/'+f;
}
function loadCSN(files){
  if(typeof parseCSN!=='function')return Promise.reject(Error('CSN parser did not load.'));
  var all=[];
  return (files||[]).reduce(function(p,f){
    return p.then(function(){
      var url=resolveCSN(f);
      return fetch(url+CACHE).then(function(r){
        if(!r.ok)throw Error('Could not load '+f);
        return r.text();
      }).then(function(t){
        var sport=sourceSport(f)||sourceSport(url);
        (parseCSN(t)||[]).forEach(function(tour){tour.__sourceSport=sport;all.push(tour);});
      });
    });
  },Promise.resolve()).then(function(){return all;});
}
function idsFor(sector,sport){
  var ids={};
  (sector.leagues||[]).forEach(function(l){
    if(String(l.sport||'').toLowerCase()===sport){
      if(l.id)ids[String(l.id).toLowerCase()]=1;
      if(l.sourceId)ids[String(l.sourceId).toLowerCase()]=1;
    }
  });
  (sector.competitionIds||[]).forEach(function(id){ids[String(id).toLowerCase()]=1;});
  return ids;
}
function clubsFor(sector){
  var c={};
  (sector.clubCodes||[]).forEach(function(x){c[String(x).toLowerCase()]=x;});
  return c;
}
function matchesFor(sector,tours,sport){
  var ids=idsFor(sector,sport),clubs=clubsFor(sector),hasClubs=Object.keys(clubs).length>0,hasIds=Object.keys(ids).length>0,out=[];
  tours.forEach(function(t){
    if(t.__sourceSport!==sport)return;
    var tid=String(t.meta&&t.meta.id||'').toLowerCase();
    if(hasIds&&!ids[tid])return;
    (t.m||[]).forEach(function(m){
      if(!hasClubs||(clubs[String(m.home).toLowerCase()]&&clubs[String(m.away).toLowerCase()]))out.push({m:m,t:t});
    });
  });
  return out;
}
function name(t,c){return t&&t.n&&t.n[c]&&t.n[c].name||c;}
function owner(t,c){var info=t&&t.n&&t.n[c];if(info&&info.player)return String(info.player).trim();var v=info&&info.name||c,m=String(v).match(/\[([^\]]+)\]\s*$/);return m?m[1].trim():String(v).trim();}
function addOwnerGoals(players,t,c,goals){var n=owner(t,c);if(n)players[n]=(players[n]||0)+(Number(goals)||0);}
function goals(matches){var total=0,players={};matches.forEach(function(x){var m=x.m;total+=(Number(m.sh)||0)+(Number(m.sa)||0);addOwnerGoals(players,x.t,m.home,m.sh);addOwnerGoals(players,x.t,m.away,m.sa);});return {total:total,players:players};}
function table(matches){var clubs={};matches.forEach(function(x){var m=x.m,h=m.home,a=m.away;clubs[h]||(clubs[h]={name:name(x.t,h),p:0,w:0,d:0,l:0,gf:0,ga:0});clubs[a]||(clubs[a]={name:name(x.t,a),p:0,w:0,d:0,l:0,gf:0,ga:0});clubs[h].gf+=Number(m.sh)||0;clubs[h].ga+=Number(m.sa)||0;clubs[a].gf+=Number(m.sa)||0;clubs[a].ga+=Number(m.sh)||0;if(m.sh>m.sa){clubs[h].w++;clubs[h].p+=3;clubs[a].l++;}else if(m.sa>m.sh){clubs[a].w++;clubs[a].p+=3;clubs[h].l++;}else{clubs[h].d++;clubs[a].d++;clubs[h].p++;clubs[a].p++;}});return Object.values(clubs).sort(function(a,b){return b.p-a.p||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.name.localeCompare(b.name);});}
function resultList(matches,cricket){return matches.slice().reverse().slice(0,10).map(function(x){var m=x.m,s=cricket?m.sh+'/'+m.hw+' – '+m.sa+'/'+m.aw:m.sh+'–'+m.sa;return '<div class="sector-row"><span><b>'+esc(name(x.t,m.home))+'</b> <span class="sector-muted">vs</span> <b>'+esc(name(x.t,m.away))+'</b></span><span class="sector-score">'+s+'</span><span class="sector-pill">'+esc((x.t.meta&&(x.t.meta.e||x.t.meta.id))||'')+'</span></div>';}).join('')||'<div class="sector-muted">No results logged.</div>';}
function standingsCard(matches,label,cricket){var rows=table(matches).map(function(c,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(c.name)+'</td><td>'+c.p+'</td><td>'+(c.gf-c.ga>0?'+':'')+(c.gf-c.ga)+'</td><td>'+c.gf+'</td></tr>';}).join('')||'<tr><td colspan="5" class="sector-muted">No matches logged.</td></tr>';return '<div class="sector-card"><h3>'+label+' Standings</h3><table class="sector-table"><thead><tr><th>#</th><th>Club</th><th>Pts</th><th>GD</th><th>'+(cricket?'Runs':'GF')+'</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+'<div class="sector-card"><h3>'+label+' Results</h3>'+resultList(matches,cricket)+'</div>';}
function scorerCard(label,g){var top=Object.keys(g.players).map(function(n){return {name:n,goals:g.players[n]};}).sort(function(a,b){return b.goals-a.goals||a.name.localeCompare(b.name);}).slice(0,8);return '<div class="sector-card"><h3>'+label+' · Top Scorers · Sector tally</h3>'+(top.length?'<table class="sector-table"><thead><tr><th>Player</th><th>Goals</th></tr></thead><tbody>'+top.map(function(p){return '<tr><td>'+esc(p.name)+'</td><td>'+p.goals+'</td></tr>';}).join('')+'</tbody></table>':'<div class="sector-muted">No goal-scoring clubs are logged in this '+label+' archive.</div>')+'</div>';}
function cricketCard(matches){var runs=0,wk=0,clubs={};matches.forEach(function(x){var m=x.m;runs+=(Number(m.sh)||0)+(Number(m.sa)||0);wk+=(Number(m.hw)||0)+(Number(m.aw)||0);clubs[m.home]||(clubs[m.home]={name:name(x.t,m.home),runs:0,wk:0});clubs[m.away]||(clubs[m.away]={name:name(x.t,m.away),runs:0,wk:0});clubs[m.home].runs+=Number(m.sh)||0;clubs[m.home].wk+=Number(m.aw)||0;clubs[m.away].runs+=Number(m.sa)||0;clubs[m.away].wk+=Number(m.hw)||0;});return {runs:runs,wk:wk,html:'<div class="sector-card"><h3>Cricket · Sector tally</h3><table class="sector-table"><thead><tr><th>Club</th><th>Runs</th><th>Wkts</th></tr></thead><tbody>'+Object.values(clubs).sort(function(a,b){return b.runs-a.runs;}).map(function(c){return '<tr><td>'+esc(c.name)+'</td><td>'+c.runs+'</td><td>'+c.wk+'</td></tr>';}).join('')+'</tbody></table><div class="sector-footer">Runs are team runs scored; wickets are wickets taken from the opponent.</div></div>'};}
function collectClubs(sector,tours){
  var clubNames={};
  var codes=sector.clubCodes&&sector.clubCodes.length?sector.clubCodes:null;
  if(codes){
    codes.forEach(function(c){tours.forEach(function(t){if(t.n&&t.n[c])clubNames[c]=t.n[c].name;});if(!clubNames[c])clubNames[c]=c;});
  }else{
    tours.forEach(function(t){if(!t.n)return;Object.keys(t.n).forEach(function(c){clubNames[c]=t.n[c]&&t.n[c].name||c;});});
  }
  return clubNames;
}
function render(sector,tours){
  app=host();
  if(!app)throw Error('Sector page container is missing.');
  var f=matchesFor(sector,tours,'futsal'),fb=matchesFor(sector,tours,'football'),cr=matchesFor(sector,tours,'cricket'),fg=goals(f),fbg=goals(fb),ck=cricketCard(cr),all=f.length+fb.length+cr.length;
  var clubNames=collectClubs(sector,tours);
  var leagues=(sector.leagues||[]).map(function(l){return '<div class="sector-league"><b>'+esc(l.name)+'</b><span class="sector-muted">'+esc(l.sport)+' · '+esc(l.season)+'</span></div>';}).join('')||'<div class="sector-muted">No leagues listed.</div>';
  var cards='';
  if((sector.sports||[]).indexOf('futsal')>=0)cards+='<section class="sector-sport"><h2>Futsal</h2>'+standingsCard(f,'Futsal',false)+scorerCard('Futsal',fg)+'</section>';
  if((sector.sports||[]).indexOf('football')>=0)cards+='<section class="sector-sport"><h2>Football</h2>'+standingsCard(fb,'Football',false)+scorerCard('Football',fbg)+'</section>';
  if((sector.sports||[]).indexOf('cricket')>=0)cards+='<section class="sector-sport"><h2>Cricket</h2>'+standingsCard(cr,'Cricket',true)+ck.html+'</section>';
  var stats='<div class="sector-stat"><b>'+Object.keys(clubNames).length+'</b><span>CLUBS</span></div><div class="sector-stat"><b>'+all+'</b><span>MATCHES</span></div><div class="sector-stat"><b>'+((sector.leagues||[]).length)+'</b><span>COMPETITIONS</span></div>';
  if((sector.sports||[]).indexOf('futsal')>=0)stats+='<div class="sector-stat"><b>'+fg.total+'</b><span>FUTSAL GOALS</span></div>';
  if((sector.sports||[]).indexOf('football')>=0)stats+='<div class="sector-stat"><b>'+fbg.total+'</b><span>FOOTBALL GOALS</span></div>';
  if((sector.sports||[]).indexOf('cricket')>=0)stats+='<div class="sector-stat"><b>'+ck.runs+'</b><span>CRICKET RUNS</span></div><div class="sector-stat"><b>'+ck.wk+'</b><span>CRICKET WICKETS</span></div>';
  app.innerHTML='<div class="sector-wrap"><div class="sector-top"><div><div class="ed-kicker">CASPER SECTOR · '+esc(sector.code||sectorId)+'</div><h1 class="sector-title">'+esc(sector.name||sectorId)+'</h1><p class="sector-desc">'+esc(sector.description||'Local competitive ecosystem.')+'</p></div><a class="sector-back" href="index.html">← All Sectors</a></div><div class="sector-stats">'+stats+'</div><div class="sector-card"><h3>Sector Leagues</h3>'+leagues+'</div><div class="sector-card"><h3>Sector Clubs</h3><div class="sector-clubs">'+Object.keys(clubNames).map(function(c){return '<div class="sector-club"><b>'+esc(clubNames[c])+'</b><span>'+esc(c)+'</span></div>';}).join('')+'</div></div>'+cards+'<div class="sector-footer">'+esc(sector.name||sectorId)+' · '+esc(sector.status||'Active')+' · '+esc((sector.seasons||[]).join(', '))+'</div></div>';
}
function attachManifest(sector,man){
  if(!sector.leagues&&man.leagues)sector.leagues=man.leagues;
  if(!sector.clubCodes&&man.clubCodes)sector.clubCodes=man.clubCodes;
  if(!sector.sports&&man.sports)sector.sports=man.sports;
  if(!sector.competitionIds&&man.competitions)sector.competitionIds=man.competitions;
  return sector;
}
function filesFrom(man){
  if(man.files&&man.files.length)return man.files;
  var src=man.sources||{};
  return Object.keys(src).map(function(k){return src[k];});
}
get('sectors.json').then(function(reg){
  var sector=(reg.sectors||[]).find(function(s){return s.id===sectorId;});
  if(!sector)throw Error('Sector not found: '+sectorId);
  var mp=(sector.archive&&sector.archive.manifest)||('data/sectors/'+sectorId+'/manifest.json');
  return get(mp).then(function(man){
    attachManifest(sector,man||{});
    return loadCSN(filesFrom(man||{})).then(function(tours){render(sector,tours);});
  });
}).catch(function(e){
  console.error(e);
  empty(e&&e.message?e.message:'Sector archive failed to load.');
});
})();
