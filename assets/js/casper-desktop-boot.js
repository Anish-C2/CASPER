/* CASPER DESKTOP BOOT — catalog-driven engine, unlimited sectors/seasons. */
(function () {
  'use strict';
  var VERSION = '20260910engine';
  function root() { return (window.CASPER_PAGE && window.CASPER_PAGE.root) || ''; }
  function tickClock() {
    var t = document.getElementById('casper-time'), d = document.getElementById('casper-date'), now = new Date();
    if (t) t.textContent = now.toLocaleTimeString('en-IN', { hour12: false });
    if (d) d.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function paintError(msg) {
    var app = document.getElementById('app'); if (!app) return;
    app.innerHTML = '<div class="desktop-page"><div class="desktop-hero"><div class="desktop-kicker">CASPER</div><h2>ARCHIVE DID NOT FINISH LOADING</h2><p>' + String(msg || 'Unknown renderer error') + '</p><div class="desktop-actions"><a href="' + root() + 'index.html">RELOAD HOME</a></div></div></div>';
  }
  function renderNow() {
    try {
      if (typeof window.CASPER_DESKTOP_RENDER === 'function') {
        if (window.CASPER_PAGE && window.CASPER_PAGE.mode === 'sector' && typeof window.CASPER_SCOPE_SECTOR === 'function') window.CASPER_SCOPE_SECTOR();
        window.CASPER_DESKTOP_RENDER();
        return document.getElementById('app') && document.getElementById('app').innerHTML.indexOf('LOADING CASPER ARCHIVE') === -1;
      }
    } catch (err) { paintError(err && err.message ? err.message : err); return true; }
    return false;
  }
  function boot() {
    var readyState = typeof STATE !== 'undefined' ? STATE : null;
    if (!readyState) { paintError('casper-core.js did not create STATE.'); return; }
    if (typeof window.CASPER_ENGINE === 'undefined' || typeof window.CASPER_ENGINE.loadAll !== 'function') {
      paintError('casper-engine.js did not load.');
      return;
    }
    window.CASPER_ENGINE.loadAll(root(), readyState).then(function () {
      readyState.ready = true;
      if (window.CASPER_PAGE && window.CASPER_PAGE.mode === 'sector' && typeof window.CASPER_SCOPE_SECTOR === 'function') window.CASPER_SCOPE_SECTOR();
      var tick = document.getElementById('ticker-items');
      if (tick && typeof generateNews === 'function') { try { tick.textContent = generateNews().slice(0, 8).join('  |  '); } catch (e) { tick.textContent = 'CASPER archive online'; } }
      else if (tick) tick.textContent = 'CASPER archive online';
      tickClock(); setInterval(tickClock, 1000);
      if (!renderNow()) { var n = 0, id = setInterval(function () { n++; if (renderNow() || n > 40) clearInterval(id); }, 50); }
    }).catch(function (err) { paintError(err && err.message ? err.message : err); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
