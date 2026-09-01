/* CASPER data guard: rebuild club totals from championship records only. */
(function(){
  function trophyList(abbr){const out=[];(STATE.sportsCfg.sports||[]).forEach(c=>{const s=STATE.sports[c.id]||{};(s.tournaments||[]).forEach(t=>{if(t.meta.e==='Seasonal Awards'||!t.aw||t.aw.ch!==abbr)return;out.push({label:'Champion',event:t.meta.e||t.meta.id,season:t.meta.s||'',sport:c.name})})});return out}
  window.collectTeams=function(){const map={};(STATE.sportsCfg.sports||[]).forEach(c=>{const s=STATE.sports[c.id]||{};Object.values(s.teams||{}).forEach(t=>{if(!map[t.abbr])map[t.abbr]={abbr:t.abbr,name:t.name,player:t.player||'',matches:0,wins:0,draws:0,losses:0,gf:0,ga:0,titles:0,trophies:[],bySport:{}};const x=map[t.abbr];x.name=t.name||x.name;x.matches+=t.matches||0;x.wins+=t.wins||0;x.draws+=t.draws||0;x.losses+=t.losses||0;x.gf+=t.gf||0;x.ga+=t.ga||0;x.bySport[c.id]=t})});});Object.values(map).forEach(t=>{t.trophies=trophyList(t.abbr);t.titles=t.trophies.length});return Object.values(map)};
  setTimeout(()=>{if(window.route)window.route()},0);
})();
