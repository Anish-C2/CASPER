/* CASPER Sector Registry UI. A sector is a physical/local CASPER operating area. */
(function (root) {
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');}
  function load(){return fetch('sectors.json').then(function(r){if(!r.ok)throw new Error('Sector registry unavailable: '+r.status);return r.json();});}
  function card(s){
    var leagues=(s.leagues||[]).length, seasons=(s.seasons||[]).length, players=(s.playerIds||[]).length, clubs=(s.clubCodes||[]).length;
    return '<article class="sector-card"><div class="sector-head"><div><div class="sector-code">'+esc(s.code||s.id)+'</div><h3>'+esc(s.name)+'</h3><div class="sector-type">'+esc(s.type||'Operating Area')+'</div></div><span class="sector-status">'+esc(s.status||'Active')+'</span></div><p>'+esc(s.description||'CASPER operating sector.')+'</p><div class="sector-grid"><div><b>'+leagues+'</b><span>Leagues</span></div><div><b>'+seasons+'</b><span>Seasons</span></div><div><b>'+players+'</b><span>Players</span></div><div><b>'+clubs+'</b><span>Clubs</span></div></div><div class="sector-meta"><b>Sports</b> '+esc((s.sports||[]).join(' · ')||'Not configured')+'<br><b>League system</b> '+esc((s.leagues||[]).map(function(x){return x.name;}).join(' · ')||'Not configured')+'</div></article>';
  }
  async function render(){var rootEl=document.getElementById('sector-list');if(!rootEl)return;try{var data=await load();var items=data.sectors||[];rootEl.innerHTML=items.length?items.map(card).join(''):'<div class="sector-empty">No CASPER sectors have been registered yet.</div>';}catch(e){rootEl.innerHTML='<div class="sector-empty"><b>Sector registry error</b><br>'+esc(e.message)+'</div>';}}
  root.CASPER_SECTORS={load:load,render:render};
  document.addEventListener('DOMContentLoaded',render);
})(window);
