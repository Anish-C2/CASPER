/* CASPER DESKTOP BOOT — never leave the hub stuck on the loading banner. */
(function () {
  'use strict';
  var VERSION = '20260901e';

  function loadJson(path, fallback) {
    return fetch(path + (path.indexOf('?') >= 0 ? '&' : '?') + 'v=' + VERSION)
      .then(function (r) { return r.ok ? r.json() : fallback; })
      .catch(function () { return fallback; });
  }

  function tickClock() {
    var t = document.getElementById('casper-time');
    var d = document.getElementById('casper-date');
    var now = new Date();
    if (t) t.textContent = now.toLocaleTimeString('en-IN', { hour12: false });
    if (d) d.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function paintError(msg) {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '<div class="desktop-page"><div class="desktop-hero"><div class="desktop-kicker">CASPER</div><h2>ARCHIVE DID NOT FINISH LOADING</h2><p>' +
      String(msg || 'Unknown renderer error') +
      '</p><div class="desktop-actions"><a href="index.html">RELOAD HOME</a></div></div></div>';
  }

  function renderNow() {
    try {
      if (typeof window.CASPER_DESKTOP_RENDER === 'function') {
        window.CASPER_DESKTOP_RENDER();
        return document.getElementById('app') && document.getElementById('app').innerHTML.indexOf('LOADING CASPER ARCHIVE') === -1;
      }
    } catch (err) {
      paintError(err && err.message ? err.message : err);
      return true;
    }
    return false;
  }

  function boot() {
    var readyState = typeof STATE !== 'undefined' ? STATE : null;
    if (!readyState) {
      paintError('casper-core.js did not create STATE.');
      return;
    }

    Promise.all([
      loadJson('config.json', {}),
      loadJson('sports.json', { sports: [] }),
      loadJson('misc.json', {}),
      loadJson('player-registry.json', {})
    ]).then(function (pack) {
      readyState.config = pack[0] || {};
      readyState.sportsCfg = pack[1] || { sports: [] };
      readyState.misc = pack[2] || {};
      readyState.registry = Object.assign({}, pack[3] || {}, readyState.config.playerRegistry || {});
      var list = (readyState.sportsCfg.sports || []).slice();
      var chain = Promise.resolve();
      list.forEach(function (cfg) {
        chain = chain.then(function () {
          return fetch((cfg.manifest || '') + '?v=' + VERSION)
            .then(function (r) { return r.ok ? r.json() : []; })
            .catch(function () { return []; })
            .then(function (files) {
              if (!Array.isArray(files)) files = [];
              var tours = [];
              var filesChain = Promise.resolve();
              files.forEach(function (f) {
                filesChain = filesChain.then(function () {
                  return fetch((cfg.dataDir || 'data') + '/' + f + '?v=' + VERSION)
                    .then(function (r) { return r.ok ? r.text() : ''; })
                    .then(function (text) {
                      if (text && typeof parseCSN === 'function') {
                        var parsed = parseCSN(text);
                        if (parsed && parsed.length) tours.push.apply(tours, parsed);
                      }
                    })
                    .catch(function () {});
                });
              });
              return filesChain.then(function () {
                readyState.sports[cfg.id] = typeof buildSport === 'function'
                  ? buildSport(cfg, tours)
                  : { cfg: cfg, tournaments: tours, matches: [], players: {}, teams: {}, ranked: [] };
              });
            });
        });
      });
      return chain;
    }).then(function () {
      readyState.ready = true;
      var tick = document.getElementById('ticker-items');
      if (tick && typeof generateNews === 'function') {
        try { tick.textContent = generateNews().slice(0, 8).join('  |  '); }
        catch (e) { tick.textContent = 'CASPER archive online'; }
      } else if (tick) {
        tick.textContent = 'CASPER archive online';
      }
      tickClock();
      setInterval(tickClock, 1000);
      if (!renderNow()) {
        var n = 0;
        var id = setInterval(function () {
          n += 1;
          if (renderNow() || n > 40) clearInterval(id);
        }, 50);
      }
    }).catch(function (err) {
      paintError(err && err.message ? err.message : err);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
