/* CASPER GitHub clone counter — lifetime total from stored daily traffic. */
(function(){
  'use strict';

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function render(data){
    var strip = document.querySelector('.home-stat-strip');
    if(!strip || !data || !data.days) return false;

    var total = Object.keys(data.days).reduce(function(n, date){
      return n + Number(data.days[date].clones || 0);
    }, 0);

    var old = document.getElementById('github-clones-stat');
    if(old) old.remove();

    var el = document.createElement('div');
    el.className = 'desktop-stat';
    el.id = 'github-clones-stat';
    el.innerHTML = '<b>' + esc(total.toLocaleString('en-IN')) + '</b><span>GitHub clones</span>';
    strip.appendChild(el);
    return true;
  }

  function load(){
    fetch('data/github-clones.json', {cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('clone history unavailable'); return r.json(); })
      .then(function(data){
        var tries = 0;
        var timer = setInterval(function(){
          tries++;
          if(render(data) || tries > 100) clearInterval(timer);
        }, 100);
      })
      .catch(function(){ /* Keep the site working if history is unavailable. */ });
  }

  load();
})();
