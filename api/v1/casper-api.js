/* CASPER Data API v1.1 — static public data API. */
(function(root){'use strict';
const BASE=new URL('../../',document.currentScript?document.currentScript.src:location.href),SPORT_PATH={futsal:'data/futsal',football:'data/football',cricket:'data/cricket'},cache=new Map();
function norm(v){return String(v==null?'':v).trim().toLowerCase()}
function source(sport,season){const s=norm(sport||'futsal');if(!SPORT_PATH[s])throw new Error('Unknown sport: '+sport);return new URL(SPORT_PATH[s]+'/Season_'+encodeURIComponent(season||'2026A')+'.csn',BASE).href}
async function text(sport,season){const u=source(sport,season);if(!cache.has(u))cache.set(u,fetch(u).then(r=>{if(!r.ok)throw new Error('CSN fetch failed: '+r.status);return r.text()}));return cache.get(u)}
async function sectorRegistry(){const u=new URL('../../sectors.json',BASE);if(!cache.has(u.href))cache.set(u.href,fetch(u).then(r=>{if(!r.ok)throw new Error('Sector registry failed: '+r.status);return r.json()}));return cache.get(u.href)}
function parsedText(v){if(typeof root.parseCSN!=='function')throw new Error('Load assets/casper-core.js before casper-api.js');return root.parseCSN(v)}
function blocks(v){const out=[];let s=-1,d=0;for(let i=0;i<v.length;i++){if(v[i]==='['&&d===0){s=i;d=1}else if(v[i]==='[')d++;else if(v[i]===']'&&d){d--;if(!d){out.push(v.slice(s,i+1).trim());s=-1}}}return out}
function matchRows(t){return(t.m||[]).map((m,i)=>Object.assign({tournamentId:t.meta.id,competition:t.meta.e,season:t.meta.s,index:i+1},m))}
function entityRows(t){return Object.keys(t.n||{}).map(id=>({id,name:t.n[id].name,player:t.n[id].player||'',tournamentId:t.meta.id,competition:t.meta.e,season:t.meta.s}))}
function contains(row,key,value){return !value||norm(row[key]).includes(norm(value))}
function filterRows(rows,f){f=f||{};return rows.filter(r=>contains(r,'season',f.season)&&contains(r,'competition',f.competition)&&contains(r,'tournamentId',f.competitionId)&&(!f.team||norm(r.home)===norm(f.team)||norm(r.away)===norm(f.team)||norm(r.id)===norm(f.team))&&(!f.player||[r.name,r.player,r.raw].some(x=>norm(x).includes(norm(f.player))))&&contains(r,'stage',f.stage))}
async function parsed(options){const f=options||{},ts=parsedText(await text(f.sport,f.season));return ts.filter(t=>contains(t.meta,'s',f.season)&&contains(t.meta,'e',f.competition)&&contains(t.meta,'id',f.competitionId))}
async function rawCSN(sport,season){return text(sport,season)}
async function filterCSN(options){const f=options||{},v=await text(f.sport,f.season),ts=parsedText(v),bs=blocks(v),selected=[];ts.forEach((t,i)=>{if(!contains(t.meta,'s',f.season)||!contains(t.meta,'e',f.competition)||!contains(t.meta,'id',f.competitionId))return;const rows=matchRows(t);if((f.team||f.player||f.stage)&&!filterRows(rows,f).length)return;selected.push(bs[i])});return selected.join('\n\n')+(selected.length?'\n':'')}
async function matches(o){const f=o||{};return(await parsed(f)).flatMap(matchRows).filter(r=>filterRows([r],f).length)}
async function teams(o){const ts=await parsed(o),m=new Map();ts.flatMap(entityRows).forEach(r=>{if(!m.has(norm(r.id)))m.set(norm(r.id),r)});return Array.from(m.values())}
async function players(o){const ts=await parsed(o),m=new Map();ts.forEach(t=>{entityRows(t).forEach(r=>{if(r.player){const k=norm(r.player),p=m.get(k)||{name:r.player,teams:[],competitions:[],seasons:[]};if(p.teams.indexOf(r.name)<0)p.teams.push(r.name);if(p.competitions.indexOf(r.competition)<0)p.competitions.push(r.competition);if(p.seasons.indexOf(r.season)<0)p.seasons.push(r.season);m.set(k,p)}});matchRows(t).forEach(r=>[r.gh,r.ga,r.ah,r.aa].flat().forEach(x=>{if(x&&x.name){const k=norm(x.name),p=m.get(k)||{name:x.name,teams:[],competitions:[],seasons:[]};[r.home,r.away].forEach(x=>{if(p.teams.indexOf(x)<0)p.teams.push(x)});if(p.competitions.indexOf(r.competition)<0)p.competitions.push(r.competition);if(p.seasons.indexOf(r.season)<0)p.seasons.push(r.season);m.set(k,p)}}))});const a=Array.from(m.values());return o&&o.player?a.filter(p=>norm(p.name).includes(norm(o.player))):a}
async function competitions(o){return(await parsed(o)).map(t=>Object.assign({},t.meta))}
async function awards(o){return(await parsed(o)).flatMap(t=>Object.keys(t.aw||{}).map(type=>({type,value:t.aw[type],tournamentId:t.meta.id,competition:t.meta.e,season:t.meta.s})))}
async function rankings(o){return(await parsed(o)).flatMap(t=>t.ranks||[])}
async function sectors(o){const data=await sectorRegistry(),a=data.sectors||[];const f=o||{};return a.filter(s=>(!f.sector||norm(s.id)===norm(f.sector)||norm(s.code)===norm(f.sector)||norm(s.name).includes(norm(f.sector)))&&(!f.sport||(s.sports||[]).map(norm).indexOf(norm(f.sport))>=0))}
async function all(o){const f=o||{};return{sectors:await sectors(f),sport:f.sport||null,season:f.season||null,competitions:await competitions(f),matches:await matches(f),teams:await teams(f),players:await players(f),awards:await awards(f),rankings:await rankings(f)}}
root.CASPER_API={version:'1.1',source,rawCSN,filterCSN,parsed,competitions,matches,teams,players,awards,rankings,sectors,all};
})(window);
