/* CASPER Data API v1
 * Static-site data API. Load after casper-core.js.
 *
 * Examples:
 *   CASPER_API.rawCSN('futsal', '2026A')
 *   CASPER_API.matches({ sport:'football', season:'2026A', team:'bbu' })
 *   CASPER_API.players({ sport:'football', player:'Anish' })
 *   CASPER_API.filterCSN({ sport:'futsal', season:'2026A', competition:'Finale' })
 */
(function (root) {
  'use strict';
  const BASE = new URL('../../', document.currentScript ? document.currentScript.src : location.href);
  const SPORT_PATH = { futsal:'data', football:'data/football', cricket:'data/cricket' };
  const cache = new Map();

  function norm(v){ return String(v == null ? '' : v).trim().toLowerCase(); }
  function cleanName(v){ return String(v || '').replace(/\(.*?\)/g,'').trim(); }
  function source(sport, season){
    const s = norm(sport || 'futsal');
    if (!SPORT_PATH[s]) throw new Error('Unknown sport: ' + sport);
    return new URL(SPORT_PATH[s] + '/Season_' + encodeURIComponent(season || '2026A') + '.csn', BASE).href;
  }
  async function text(sport, season){
    const url = source(sport, season);
    if (!cache.has(url)) cache.set(url, fetch(url).then(r => { if(!r.ok) throw new Error('CSN fetch failed: '+r.status); return r.text(); }));
    return cache.get(url);
  }
  function tournamentsFrom(textValue){
    if (typeof root.parseCSN !== 'function') throw new Error('Load assets/casper-core.js before casper-api.js');
    return root.parseCSN(textValue);
  }
  function rawBlocks(textValue){
    const out=[]; let start=-1, depth=0;
    for(let i=0;i<textValue.length;i++){
      const c=textValue[i];
      if(c==='[' && depth===0){ start=i; depth=1; }
      else if(c==='[' && depth>0) depth++;
      else if(c===']' && depth>0){ depth--; if(depth===0 && start>=0){ out.push(textValue.slice(start,i+1).trim()); start=-1; } }
    }
    return out;
  }
  function meta(t){ return Object.assign({}, t && t.meta || {}); }
  function matchRows(t){
    return (t.m || []).map((m,i)=>Object.assign({ tournamentId:t.meta.id, competition:t.meta.e, season:t.meta.s, index:i+1 }, m));
  }
  function entityRows(t){
    return Object.keys(t.n || {}).map(id => ({ id, name:t.n[id].name, player:t.n[id].player || '', tournamentId:t.meta.id, competition:t.meta.e, season:t.meta.s }));
  }
  function awardRows(t){
    return Object.keys(t.aw || {}).map(type => ({ type, value:t.aw[type], tournamentId:t.meta.id, competition:t.meta.e, season:t.meta.s }));
  }
  function rankRows(t){
    return (t.ranks || []).map(r => Object.assign({ tournamentId:t.meta.id, competition:t.meta.e, season:t.meta.s }, r));
  }
  function contains(row, key, value){ return !value || norm(row[key]).includes(norm(value)); }
  function applyFilters(rows, f){
    f=f||{};
    return rows.filter(r => contains(r,'season',f.season) && contains(r,'competition',f.competition) && contains(r,'tournamentId',f.competitionId) && (!f.team || norm(r.home)===norm(f.team) || norm(r.away)===norm(f.team) || norm(r.id)===norm(f.team)) && (!f.player || [r.name,r.player,r.raw].some(x=>norm(x).includes(norm(f.player)))) && contains(r,'stage',f.stage));
  }
  async function parsed(options){
    const f=options||{}; const txt=await text(f.sport,f.season); const ts=tournamentsFrom(txt);
    return ts.filter(t => contains(t.meta,'s',f.season) && contains(t.meta,'e',f.competition) && contains(t.meta,'id',f.competitionId));
  }
  async function rawCSN(sport,season){ return text(sport,season); }
  async function filterCSN(options){
    const f=options||{}; const txt=await text(f.sport,f.season); const ts=tournamentsFrom(txt); const blocks=rawBlocks(txt);
    const selected=[];
    ts.forEach((t,i)=>{
      if(!contains(t.meta,'s',f.season)||!contains(t.meta,'e',f.competition)||!contains(t.meta,'id',f.competitionId)) return;
      let block=blocks[i];
      if(f.player||f.team||f.stage){
        const rows=matchRows(t);
        const hasMatch=applyFilters(rows,f).length>0;
        const hasTeam=!f.team || entityRows(t).some(x=>norm(x.id)===norm(f.team)||norm(x.name)===norm(f.team));
        const hasPlayer=!f.player || entityRows(t).some(x=>norm(x.player).includes(norm(f.player))) || rows.some(x=>norm(x.raw).includes(norm(f.player)));
        if(!hasMatch && !hasTeam && !hasPlayer) return;
      }
      selected.push(block);
    });
    return selected.join('\n\n') + (selected.length?'\n':'');
  }
  async function matches(options){
    const ts=await parsed(options); return applyFilters(ts.flatMap(matchRows),options||{});
  }
  async function teams(options){
    const ts=await parsed(options); const rows=ts.flatMap(entityRows); const seen=new Map();
    rows.forEach(r=>{ const k=norm(r.id); if(!seen.has(k)) seen.set(k,r); });
    return Array.from(seen.values()).filter(r => !options?.player || norm(r.player).includes(norm(options.player)) || norm(r.name).includes(norm(options.player)));
  }
  async function players(options){
    const ts=await parsed(options); const out=new Map();
    ts.forEach(t=>{
      entityRows(t).forEach(r=>{ if(r.player){ const k=norm(r.player); out.set(k,{name:cleanName(r.player), teams:new Set([r.name]), competitions:new Set([r.competition]), seasons:new Set([r.season])}); }});
      matchRows(t).forEach(m=>{
        [m.gh,m.ga,m.ah,m.aa].flat().forEach(x=>{ if(x&&x.name){ const k=norm(x.name); const p=out.get(k)||{name:cleanName(x.name),teams:new Set(),competitions:new Set(),seasons:new Set()}; p.teams.add(m.home); p.teams.add(m.away); p.competitions.add(m.competition); p.seasons.add(m.season); out.set(k,p); }});
      });
    });
    return Array.from(out.values()).map(p=>Object.assign(p,{teams:Array.from(p.teams),competitions:Array.from(p.competitions),seasons:Array.from(p.seasons)})).filter(p=>!options?.player || norm(p.name).includes(norm(options.player)));
  }
  async function competitions(options){ const ts=await parsed(options); return ts.map(t=>meta(t)); }
  async function awards(options){ const ts=await parsed(options); return ts.flatMap(awardRows).filter(r=>!options?.player || norm(r.value).includes(norm(options.player))); }
  async function rankings(options){ const ts=await parsed(options); return ts.flatMap(rankRows).filter(r=>!options?.player || norm(r.name).includes(norm(options.player))); }
  async function all(options){
    const f=options||{}; return { sport:f.sport||'futsal', season:f.season||'2026A', competitions:await competitions(f), matches:await matches(f), teams:await teams(f), players:await players(f), awards:await awards(f), rankings:await rankings(f) };
  }
  root.CASPER_API = { version:'1.0', source, rawCSN, filterCSN, parsed, competitions, matches, teams, players, awards, rankings, all };
})(window);
