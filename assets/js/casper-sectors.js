/* CASPER Sectors — archive dimension shared across sports and seasons. */
(function () {
  'use strict';
  function key(v) { return String(v == null ? '' : v).trim().toLowerCase(); }
  function sectorOf(t) { return (t.meta && (t.meta.sector || t.meta.sec || t.meta.prd || t.meta.region || t.meta.zone)) || 'Unassigned'; }
  function loadText(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('Archive fetch failed: ' + r.status); return r.text(); }); }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;'); }
  async function build() {
    var sports = await fetch('sports.json').then(function (r) { return r.json(); });
    var sectors = {};
    await Promise.all((sports.sports || []).map(async function (s) {
      var manifest = await fetch(s.manifest).then(function (r) { return r.json(); });
      var files = Array.isArray(manifest) ? manifest : (manifest.files || manifest.archives || []);
      if (!files.length && !Array.isArray(manifest) && manifest.file) files = [manifest.file];
      if (!files.length && !Array.isArray(manifest) && manifest.season) files = ['Season_' + manifest.season + '.csn'];
      await Promise.all(files.map(async function (file) {
        var path = typeof file === 'string' ? file : file.path || file.file || file.name;
        if (!path) return;
        var url = path.indexOf('/') >= 0 ? path : s.dataDir + '/' + path;
        var ts = parseCSN(await loadText(url));
        ts.forEach(function (t) {
          var sector = sectorOf(t), k = key(sector);
          if (!sectors[k]) sectors[k] = { name: sector, sports: {}, seasons: {}, competitions: [] };
          var x = sectors[k];
          x.sports[s.id] = s.name;
          x.seasons[t.meta.s || t.meta.season || 'Unknown'] = 1;
          x.competitions.push({ sport: s.name, season: t.meta.s || t.meta.season || 'Unknown', name: t.meta.e || t.meta.event || 'Unnamed competition', id: t.meta.id || '' });
        });
      }));
    }));
    return Object.keys(sectors).map(function (k) { var x = sectors[k]; return { name:x.name, sports:Object.values(x.sports), seasons:Object.keys(x.seasons), competitions:x.competitions }; }).sort(function(a,b){ return a.name.localeCompare(b.name); });
  }
  window.CASPER_SECTORS = { build: build, sectorOf: sectorOf };
  window.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('sector-list'); if (!root) return;
    build().then(function (items) {
      root.innerHTML = items.length ? items.map(function (s) { return '<section class="panel"><h3>' + esc(s.name) + '</h3><div>Sports: ' + esc(s.sports.join(', ')) + ' · Seasons: ' + esc(s.seasons.join(', ')) + '</div><table><thead><tr><th>Sport</th><th>Season</th><th>Competition</th><th>ID</th></tr></thead><tbody>' + s.competitions.map(function(c){ return '<tr><td>' + esc(c.sport) + '</td><td>' + esc(c.season) + '</td><td>' + esc(c.name) + '</td><td>' + esc(c.id || '—') + '</td></tr>'; }).join('') + '</tbody></table></section>'; }).join('') : '<div class="panel">No sectors are currently encoded in the archive.</div>';
    }).catch(function (e) { root.innerHTML = '<div class="panel"><b>Sector archive error</b><p>' + esc(e.message) + '</p></div>'; });
  });
})();
