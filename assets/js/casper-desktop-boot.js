/* CASPER DESKTOP BOOT — the main repository has no responsive/mobile runtime. */
(function(){
'use strict';
async function loadJson(path,fallback){try{const r=await fetch(path+'?v=20260901');if(!r.ok)return fallback;return await r.json()}catch(e){return fallback}}
function tickClock(){const t=document.getElementById('casper-time'),d=document.getElementById('casper-date'),now=new Date();if(t)t.textContent=now.toLocaleTimeString('en-IN',{hour12:false});if(d)d.textContent=now.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
async function boot(){
  STATE.config=await loadJson('config.json',{});
  STATE.sportsCfg=await loadJson('sports.json',{sports:[]});
  STATE.misc=await loadJson('misc.json',{});
  STATE.registry=Object.assign({},await loadJson('player-registry.json',{}),STATE.config.playerRegistry||{});
  for(const cfg of STATE.sportsCfg.sports){
    let files=[];
    try{const man=await fetch(cfg.manifest+'?v=20260901');if(man.ok)files=await man.json()}catch(e){}
    const tours=[];
    for(const f of files){try{const r=await fetch(cfg.dataDir+'/'+f+'?v=20260901');if(r.ok)tours.push.apply(tours,parseCSN(await r.text()))}catch(e){}}
    STATE.sports[cfg.id]=buildSport(cfg,tours);
  }
  STATE.ready=true;
  const tick=document.getElementById('ticker-items');
  if(tick&&typeof generateNews==='function')tick.textContent=generateNews().slice(0,8).join('  |  ');
  tickClock();setInterval(tickClock,1000);
  if(typeof window.CASPER_DESKTOP_RENDER==='function')window.CASPER_DESKTOP_RENDER();
}
boot();
})();