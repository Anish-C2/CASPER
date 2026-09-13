/* CASPER boot — load catalogs, then render the current page. */
(function () {
  'use strict';

  function root() { return (window.CASPER_PAGE && window.CASPER_PAGE.root) || ''; }

  function paintError(msg) {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '<div class="desktop-page"><div class="desktop-hero"><div class="desktop-kicker">CASPER</div><h2>Archive did not finish loading</h2><p>' + String(msg || 'Unknown renderer error') + '</p><p><a href="' + root() + 'index.html">Reload main page</a></p></div></div>';
  }

  function renderNow() {
    try {
      if (typeof window.CASPER_DESKTOP_RENDER !== 'function') return false;
      if (window.CASPER_PAGE && window.CASPER_PAGE.mode === 'sector' && typeof window.CASPER_SCOPE_SECTOR === 'function') {
        window.CASPER_SCOPE_SECTOR();
      }
      window.CASPER_DESKTOP_RENDER();
      var app = document.getElementById('app');
      return !!(app && app.innerHTML.indexOf('LOADING') === -1);
    } catch (err) {
      paintError(err && err.message ? err.message : err);
      return true;
    }
  }

  function boot() {
    if (typeof STATE === 'undefined') { paintError('core.js did not create STATE.'); return; }
    if (!window.CASPER_ENGINE || typeof window.CASPER_ENGINE.loadAll !== 'function') {
      paintError('engine.js did not load.');
      return;
    }
    window.CASPER_ENGINE.loadAll(root(), STATE).then(function () {
      STATE.ready = true;
      if (!renderNow()) {
        var n = 0, id = setInterval(function () { n++; if (renderNow() || n > 40) clearInterval(id); }, 50);
      }
    }).catch(function (err) {
      paintError(err && err.message ? err.message : err);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
