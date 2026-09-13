/* CASPER sector directory. */
(function (root) {
  'use strict';
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function siteRoot() {
    return (window.CASPER_PAGE && window.CASPER_PAGE.root != null) ? window.CASPER_PAGE.root : '../';
  }
  function loadJson(path, fallback) {
    return fetch(siteRoot() + path).then(function (r) { return r.ok ? r.json() : fallback; }).catch(function () { return fallback; });
  }
  function playersFor(sector, registry) {
    var names = [];
    Object.keys(registry || {}).forEach(function (k) {
      if (String(k).charAt(0) === '_') return;
      var r = registry[k] || {};
      var secs = (r.sectors || []).slice(0, 2);
      if (secs.indexOf(sector.id) >= 0 || (sector.playerIds || []).indexOf(r.id) >= 0) names.push(r.name || k);
    });
    names.sort();
    return names;
  }
  function card(s, registry) {
    var people = playersFor(s, registry);
    var p = people.length || (s.playerIds || []).length;
    return '<h2>' + esc(s.name) + '</h2>' +
      '<p><i>' + esc(s.code || s.id) + '</i> · ' + esc(s.type || 'Operating area') + ' · ' + esc(s.status || 'Active') + '</p>' +
      '<p>' + esc(s.description || 'CASPER operating sector.') + '</p>' +
      '<table class="wikitable"><tbody>' +
      '<tr><th>Leagues</th><td>' + (s.leagues || []).length + '</td></tr>' +
      '<tr><th>Seasons</th><td>' + (s.seasons || []).length + '</td></tr>' +
      '<tr><th>Players</th><td>' + p + (people.length ? ' (' + esc(people.join(', ')) + ')' : '') + '</td></tr>' +
      '<tr><th>Clubs</th><td>' + (s.clubCodes || []).length + '</td></tr>' +
      '<tr><th>Sports</th><td>' + esc((s.sports || []).join(', ') || 'Not configured') + '</td></tr>' +
      '</tbody></table>' +
      '<p><a href="sector.html?id=' + encodeURIComponent(s.id) + '">Open sector archive</a></p>';
  }
  function render() {
    var el = document.getElementById('sector-list');
    if (!el) return;
    Promise.all([loadJson('sectors.json', { sectors: [] }), loadJson('player-registry.json', {})]).then(function (pack) {
      var items = pack[0].sectors || [];
      el.innerHTML = items.length ? items.map(function (s) { return card(s, pack[1]); }).join('') : '<p>No CASPER sectors have been registered yet.</p>';
    }).catch(function (e) {
      el.innerHTML = '<p>Sector registry error: ' + esc(e.message) + '</p>';
    });
  }
  root.CASPER_SECTORS = { render: render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})(window);
