/* CASPER STATISTICS / ARCHIVE OVERLAY — sport-isolated, CSN-driven. */
(function(){
'use strict';

function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]})}
function cfgs(){return (typeof STATE!=='undefined'&&STATE.sportsCfg&&STATE.sportsCfg.sports)||[]}
function sp(id){return (STATE.sports&&STATE.sports[id])||{matches:[],tournaments:[],players:{},teams:{}}}
function seasonal(t){return !!(t&&t.meta&&(t.meta.e==='Seasonal Awards'||t.meta.typ==='seasonal'))}
function comps(c){return (sp(c.id).tournaments||[]).filter(function(t){return !seasonal(t)})}
function matches(c){return sp(c.id).matches||[]}
function players(c){return Object.values(sp(c.id).players||{})}
function teams(c){return Object.values(sp(c.id).teams||{})}
function clean(n){return String(n||'').replace(/\(.*?\)/g,'').trim()}
function num(v){return Number(v)||0}
function pct(a,b){return b?((a/b)*100).toFixed(1)+'%':'0.0%'}
function ratio(a,b){return b?(a/b).toFixed(2):'0.00'}
function row(a,b){return '<div class="desktop-row"><span>'+a+'</span><b>'+b+'</b></div>'}
function card(t,b){return '<div class="desktop-card"><h3>'+t+'</h3>'+(b||'<div class="desktop-muted">No data loaded.</div>')+'</div>'}
function hero(k,t,p){return '<div class="desktop-hero"><div class="desktop-kicker">'+esc(k)+'</div><h2>'+esc(t)+'</h2><p>'+p+'</p></div>'}
function table(h,rs){return '<div class="table-wrap"><table class="wikitable"><thead><tr>'+h.map(function(x){return'<th>'+x+'</th>'}).join('')+'</tr></thead><tbody>'+(rs.length?rs.join(''):'<tr><td colspan="'+h.length+'">No records loaded.</td></tr>')+'</tbody></table></div>'}
function plink(n){return'<a class="desktop-link" href="#player/'+encodeURIComponent(n)+'">'+esc(n)+'</a>'}
function tlink(t){return'<a class="desktop-link" href="#team/'+encodeURIComponent(t.abbr||t.name)+'">'+esc(t.name||t.abbr)+'</a>'}
function clink(t){return'<a class="desktop-link" href="#competition/'+encodeURIComponent(t.meta&&t.meta.id||'')+'">'+esc(t.meta&&t.meta.e||t.meta&&t.meta.id||'Competition')+'</a>'}
function score(m){if(m.kind==='cricket')return num(m.sh)+'/'+num(m.hw)+' – '+num(m.sa)+'/'+num(m.aw);return num(m.sh)+'–'+num(m.sa)}
function result(m){if(m.kind==='cricket'){var a=num(m.sh),b=num(m.sa);return a>b?'H':b>a?'A':'D'}var a=num(m.sh),b=num(m.sa);return a>b?'H':b>a?'A':'D'}
function stats(c){
 var ms=matches(c),ps=players(c),isCricket=c.scoring==='cricket',s={matches:ms.length,competitions:comps(c).length,players:ps.length,clubs:teams(c).length,goals:0,assists:0,runs:0,hats:0,home:0,away:0,draws:0,clean:0,total:0,highest:0,biggest:0,pens:0,et:0};
 ps.forEach(function(p){if(isCricket)s.runs+=num(p.runs!=null?p.runs:p.goals);else{s.goals+=num(p.goals);s.assists+=num(p.assists)}s.hats+=num(p.hatTricks)});
 ms.forEach(function(m){var a=num(m.sh),b=num(m.sa),r=result(m),tot=a+b;s.total+=tot;s.highest=Math.max(s.highest,tot);s.biggest=Math.max(s.biggest,Math.abs(a-b));if(r==='H')s.home++;else if(r==='A')s.away++;else s.draws++;if(m.p)s.pens++;if(m.et)s.et;if(m.et)s.et++;if(!isCricket){if(b===0)s.clean++;if(a===0)s.clean++}});
 s.winRate=pct(s.home,s.matches);s.drawRate=pct(s.draws,s.matches);s.cleanRate=pct(s.clean,s.matches*2);s.scoreRate=ratio(s.total,s.matches);s.goalRate=ratio(s.goals,s.matches);s.assistRate=ratio(s.assists,s.matches);s.involvementRate=ratio(s.goals+s.assists,s.matches);s.runRate=ratio(s.runs,s.matches);s.marginRate=ratio(s.biggest,s.matches);return s;
}
function playerRows(c){
 var cr=c.scoring==='cricket',ps=players(c).map(function(p){return{name:clean(p.name),mp:num(p.matches),w:num(p.wins),d:num(p.draws),l:num(p.losses),g:num(p.goals),a:num(p.assists),runs:num(p.runs!=null?p.runs:p.goals),titles:num(p.titles),ht:num(p.hatTricks)}});
 ps.sort(function(a,b){return cr?(b.runs-a.runs||b.mp-a.mp||a.name.localeCompare(b.name)):(b.g-b.g+a.g-b.g)||b.g-a.g||b.a-a.a||a.name.localeCompare(b.name)});
 return ps;
}
function playerTable(c){
 var cr=c.scoring==='cricket',ps=playerRows(c),rs=ps.map(function(p,i){if(cr)return'<tr><td>'+(i+1)+'</td><td>'+plink(p.name)+'</td><td>'+p.mp+'</td><td>'+p.w+'</td><td>'+p.d+'</td><td>'+p.l+'</td><td>'+pct(p.w,p.mp)+'</td><td><b>'+p.runs+'</b></td><td>'+ratio(p.runs,p.mp)+'</td><td>'+p.titles+'</td></tr>';var ga=p.g+p.a;return'<tr><td>'+(i+1)+'</td><td>'+plink(p.name)+'</td><td>'+p.mp+'</td><td>'+p.w+'</td><td>'+p.d+'</td><td>'+p.l+'</td><td>'+pct(p.w,p.mp)+'</td><td>'+p.g+'</td><td>'+p.a+'</td><td><b>'+ga+'</b></td><td>'+ratio(p.g,p.mp)+'</td><td>'+ratio(p.a,p.mp)+'</td><td>'+p.titles+'</td><td>'+p.ht+'</td></tr>'});
 return cr?table(['#','Player','MP','W','D','L','Win%','Runs','Runs/MP','Titles'],rs):table(['#','Player','MP','W','D','L','Win%','G','A','G+A','G/MP','A/MP','Titles','HT'],rs);
}
function clubTable(c){
 var rs=teams(c).slice().sort(function(a,b){return num(b.titles)-num(a.titles)||num(b.wins)-num(a.wins)||num(b.gf)-num(a.gf)}).map(function(t,i){var p=num(t.matches),gd=num(t.gf)-num(t.ga);return'<tr><td>'+(i+1)+'</td><td>'+tlink(t)+'</td><td>'+p+'</td><td>'+num(t.wins)+'</td><td>'+num(t.draws)+'</td><td>'+num(t.losses)+'</td><td>'+num(t.gf)+'</td><td>'+num(t.ga)+'</td><td>'+gd+'</td><td>'+pct(num(t.wins),p)+'</td><td>'+num(t.cleanSheets)+'</td><td>'+num(t.titles)+'</td></tr>'});
 return table(['#','Club','P','W','D','L','GF','GA','GD','Win%','CS','Titles'],rs);
}
function matchTable(c){
 var rs=matches(c).slice().sort(function(a,b){return(num(b.sh)+num(b.sa))-(num(a.sh)+num(a.sa))}).map(function(m,i){var n=m.names||{},hn=n[m.home]&&n[m.home].name||m.home,an=n[m.away]&&n[m.away].name||m.away;return'<tr><td>'+(i+1)+'</td><td>'+esc(m.event||m.competition||'Archive')+'</td><td>'+esc(hn)+'</td><td><b>'+esc(score(m))+'</b></td><td>'+esc(an)+'</td><td>'+esc(m.stageLabel||m.stage||'—')+'</td></tr>'});
 return table(['#','Competition','Home','Score','Away','Stage'],rs.slice(0,75));
}
function competitionRows(){
 var out=[];cfgs().forEach(function(c){comps(c).forEach(function(t){var champ=t.aw&&t.aw.ch;var cn=champ&&t.n&&t.n[champ]&&t.n[champ].name||champ||'—';out.push('<tr><td>'+esc(c.name||c.id)+'</td><td>'+clink(t)+'</td><td>'+esc(t.meta&&t.meta.s||'—')+'</td><td>'+((t.m||[]).length)+'</td><td>'+esc(t.meta&&t.meta.sts||'—')+'</td><td>'+esc(cn)+'</td></tr>')})});return out}
function archivePage(){
 var blocks=cfgs().map(function(c){var s=stats(c);return card(esc(String(c.name||c.id).toUpperCase())+' ARCHIVE',row('Matches',s.matches)+row('Competitions',s.competitions)+row('Players',s.players)+row('Clubs',s.clubs)+row('Goals',c.scoring==='cricket'?'N/A':s.goals)+row('Assists',c.scoring==='cricket'?'N/A':s.assists)+row('Runs',c.scoring==='cricket'?s.runs:'N/A')+row('Win rate',s.winRate))}).join('');
 return '<div class="desktop-page">'+hero('CASPER ARCHIVE','THE ARCHIVE INDEX','A directory of the complete loaded CASPER record. Every sport stays in its own statistical lane.')+'<div class="desktop-actions"><a href="#competitions">Competitions</a><a href="#results">Results</a><a href="#records">Records</a><a href="#history">History</a><a href="#statistics">Statistics</a></div><div class="desktop-grid3">'+blocks+'</div>'+card('ARCHIVE DIRECTORY','<div class="desktop-grid2"><div>'+row('Competition register','<a href="#competitions">Open competitions →</a>')+row('Historical seasons','<a href="#history">Open history →</a>')+'</div><div>'+row('Results ledger','<a href="#results">Open results →</a>')+row('Records desk','<a href="#records">Open records →</a>')+'</div></div>')+'</div>';
}
function competitionsPage(){
 var rs=competitionRows();return '<div class="desktop-page">'+hero('CASPER ARCHIVE','COMPETITION REGISTER','All non-seasonal competitions loaded from the CSN archive, grouped by sport and linked to their competition records.')+card('ALL COMPETITIONS',table(['Sport','Competition','Season','Matches','Status','Champion'],rs))+'</div>';
}
function historyPage(){
 var seasons={};
 cfgs().forEach(function(c){comps(c).forEach(function(t){var sid=String(t.meta&&t.meta.s||'Unknown');if(!seasons[sid])seasons[sid]={id:sid,rows:[],matches:0,comps:0,sports:{}};var q=seasons[sid];q.comps++;q.matches+=(t.m||[]).length;q.sports[c.name||c.id]=(q.sports[c.name||c.id]||0)+1;var ch=t.aw&&t.aw.ch;var cn=ch&&t.n&&t.n[ch]&&t.n[ch].name||ch||'—';q.rows.push(row((c.name||c.id)+' · '+(t.meta&&t.meta.e||t.meta&&t.meta.id||'Competition'),cn));})});
 Object.keys((STATE.seasonsIndex||{})).forEach(function(k){var x=STATE.seasonsIndex[k];if(!seasons[k])seasons[k]={id:k,rows:[],matches:0,comps:0,sports:{}};var q=seasons[k];if(x.name&&x.name!==k)q.name=x.name;q.notes=x.notes||q.notes;q.status=x.status||q.status;q.started=x.started||q.started;q.completed=x.completed||q.completed});
 var arr=Object.values(seasons).sort(function(a,b){return String(b.id).localeCompare(String(a.id),undefined,{numeric:true})});
 var blocks=arr.map(function(q){var sn=q.name||q.id;return card(esc(String(sn).toUpperCase()),row('Season',esc(q.id))+row('Status',esc(q.status||'Archived'))+row('Competitions',q.comps)+row('Matches',q.matches)+row('Sports',esc(Object.keys(q.sports).join(', ')||'—'))+(q.started?row('Started',esc(q.started)):'')+(q.completed?row('Completed',esc(q.completed)):'')+(q.notes?'<div class="desktop-doc"><p>'+esc(q.notes)+'</p></div>':'')+q.rows.join(''))}).join('');
 return '<div class="desktop-page">'+hero('CASPER HISTORY','SEASON HISTORY','A chronological index assembled from loaded competition seasons and the engine season registry.')+(blocks||card('HISTORY','No season records are currently loaded.'))+'</div>';
}
function statsPage(){
 var blocks=cfgs().map(function(c){var s=stats(c),cr=c.scoring==='cricket',p=playerRows(c);var attack=cr?row('Runs',s.runs)+row('Runs / match',s.runRate)+row('Highest match total',s.highest):row('Goals',s.goals)+row('Goals / match',s.goalRate)+row('Assists',s.assists)+row('Assists / match',s.assistRate)+row('Goal involvements / match',s.involvementRate);var ratios=row('Win rate',s.winRate)+row('Draw rate',s.drawRate)+row('Clean-sheet rate',s.cleanRate)+row('Biggest-margin / match',s.marginRate)+row('Average score / match',s.scoreRate);var records=row('Matches',s.matches)+row('Competitions',s.competitions)+row('Players',s.players)+row('Clubs',s.clubs)+row('Home wins',s.home)+row('Away wins',s.away)+row('Draws',s.draws)+row('Clean sheets',s.clean)+row('Penalties / shootouts',s.pens)+row('Extra-time',s.et);return '<section class="sport-stat-section"><div class="desktop-hero"><div class="desktop-kicker">'+esc(String(c.name||c.id).toUpperCase())+' / ISOLATED DATASET</div><h2>'+esc(String(c.name||c.id).toUpperCase())+' STATISTICS</h2><p>Nothing here is merged with another sport. Every ratio uses '+esc(String(c.name||c.id))+' matches only.</p></div><div class="desktop-grid3">'+card('COUNT LEDGER',records)+card(cr?'CRICKET SCORING':'ATTACKING OUTPUT',attack)+card('RATIO DESK',ratios)+'</div><h3>'+esc(String(c.name||c.id).toUpperCase())+' PLAYER PERFORMANCE</h3><div class="desktop-card">'+table(cr?['#','Player','MP','W','D','L','Win%','Runs','Runs/MP','Titles']:['#','Player','MP','W','D','L','Win%','G','A','G+A','G/MP','A/MP','Titles','HT'],p.map(function(x,i){return''}).filter(Boolean))+'</div><div class="desktop-card"><h3>PLAYER REGISTER</h3>'+playerTable(c)+'</div><h3>'+esc(String(c.name||c.id).toUpperCase())+' CLUB PERFORMANCE</h3><div class="desktop-card">'+clubTable(c)+'</div><h3>'+esc(String(c.name||c.id).toUpperCase())+' MATCH RECORD</h3><div class="desktop-card">'+matchTable(c)+'</div></section>'}).join('');
 return '<div class="desktop-page">'+hero('CASPER / STATISTICS','SPORT-BY-SPORT STATISTICS DESK','Football, futsal and cricket are deliberately isolated. No cross-sport match, goal, assist or run denominator is used.')+blocks+'</div>';
}
function custom(hash){var v=(hash||'').split('/')[0];if(v==='archive')return archivePage();if(v==='competitions')return competitionsPage();if(v==='history')return historyPage();if(v==='statistics')return statsPage();return null}
function install(){
 var prev=window.CASPER_DESKTOP_RENDER;if(typeof prev!=='function'||prev.__casperOverlay)return false;
 var wrap=function(){var h=(location.hash||'#home').slice(1),html=custom(h),app=document.getElementById('app');if(html&&app){app.innerHTML=html;if(window.CASPER_CHROME&&CASPER_CHROME.highlight)CASPER_CHROME.highlight();return;}return prev.apply(this,arguments)};wrap.__casperOverlay=true;window.CASPER_DESKTOP_RENDER=wrap;window.CASPER_ARCHIVE_OVERLAY={render:function(){var app=document.getElementById('app'),html=custom((location.hash||'#home').slice(1));if(app&&html)app.innerHTML=html}};return true;
}
var tries=0,t=setInterval(function(){tries++;if(install()||tries>160)clearInterval(t)},25);
window.addEventListener('hashchange',function(){setTimeout(function(){var h=(location.hash||'#home').slice(1),html=custom(h),app=document.getElementById('app');if(html&&app){app.innerHTML=html;if(window.CASPER_CHROME&&CASPER_CHROME.highlight)CASPER_CHROME.highlight()}},0)});
})();