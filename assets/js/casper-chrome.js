/* CASPER editorial chrome — shared header wiring, sport desk, path helpers. */
(function () {
  'use strict';

  function page() { return window.CASPER_PAGE || { mode: 'hub', sport: null, root: '' }; }
  function root() { return page().root || ''; }
  function href(path) {
    if (path == null || path === '') return root() || '#';
    var s = String(path);
    if (/^https?:/i.test(s) || s.charAt(0) === '#' || s.indexOf('mailto:') === 0) return s;
    return root() + s.replace(/^\//, '');
  }
  window.CASPER_HREF = href;

  function paintSportsMenu() {
    var host = document.getElementById('ed-sports-menu');
    if (!host) return;
    var list = (typeof STATE !== 'undefined' && STATE.sportsCfg && STATE.sportsCfg.sports) || [];
    if (!list.length) return;
    host.innerHTML = list.map(function (c) {
      var url = href((c && c.page) || ('sports/' + c.id + '.html'));
      return '<a href="' + url + '">' + String(c.name || c.id) + '</a>';
    }).join('');
  }

  function paintDesk() {
    var host = document.getElementById('ed-desk');
    if (!host) return;
    var mode = page().mode;
    if (mode !== 'sport' && mode !== 'sector') {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    var views = [
      ['home', 'Desk'],
      ['news', 'News'],
      ['competitions', 'Competitions'],
      ['live-scores', 'Live'],
      ['results', 'Results'],
      ['players', 'Players'],
      ['teams', 'Clubs'],
      ['awards', 'Awards'],
      ['ranking', 'Ranking'],
      ['tables', 'Tables'],
      ['records', 'Records'],
      ['statistics', 'Statistics'],
      ['archive', 'Archive'],
      ['about', 'About']
    ];
    var hash = (location.hash || '#home').slice(1).split('/')[0] || 'home';
    host.innerHTML = views.map(function (v) {
      var on = false;
      if (v[0] === 'home' && (hash === 'home' || hash === '')) on = true;
      else if (v[0] === hash) on = true;
      else if (v[0] === 'teams' && hash === 'clubs') on = true;
      return '<a href="#' + v[0] + '" data-view="' + v[0] + '"' + (on ? ' class="on"' : '') + '>' + v[1] + '</a>';
    }).join('');
  }

  function highlight() {
    var mode = page().mode;
    var sport = page().sport;
    var path = location.pathname || '';
    var hash = (location.hash || '#home').slice(1).split('/')[0] || 'home';
    document.querySelectorAll('.ed-nav [data-nav]').forEach(function (a) {
      var key = a.getAttribute('data-nav');
      var on = false;
      if (key === 'home' && mode === 'hub' && (hash === 'home' || hash === '')) on = true;
      if (key === 'sports' && mode === 'sport') on = true;
      if (key === sport) on = true;
      if (key === 'sectors' && (mode === 'sectors' || mode === 'sector' || mode === 'sector-render' || path.indexOf('/sectors') !== -1)) on = true;
      if (key === 'governance' && (mode === 'governance' || path.indexOf('/governance') !== -1)) on = true;
      if (key === 'join' && (mode === 'join' || path.indexOf('/join') !== -1)) on = true;
      if (key === 'api' && (mode === 'api' || path.indexOf('/api') !== -1)) on = true;
      if (key === 'competitions' && mode === 'hub' && (hash === 'competitions' || hash === 'archive')) on = true;
      if (key === 'archive' && mode === 'hub' && hash === 'archive') on = true;
      a.classList.toggle('on', on);
    });
    paintDesk();
  }

  function bindSearch() {
    var form = document.getElementById('ca-search-form');
    if (!form || form.dataset.edBound === '1') return;
    form.dataset.edBound = '1';
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var q = ((form.q && form.q.value) || '').trim();
      if (!q) return;
      var mode = page().mode;
      if (mode === 'hub' || mode === 'sport' || mode === 'sector' || mode === 'sector-render') {
        location.hash = '#player/' + encodeURIComponent(q);
      } else {
        location.href = href('index.html') + '#player/' + encodeURIComponent(q);
      }
    });
  }

  function boot() {
    paintSportsMenu();
    paintDesk();
    highlight();
    bindSearch();
  }

  window.CASPER_CHROME = { href: href, paint: boot, highlight: highlight, paintDesk: paintDesk };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('hashchange', highlight);
  var n = 0;
  var t = setInterval(function () {
    n += 1;
    if (typeof STATE !== 'undefined' && STATE.sportsCfg) paintSportsMenu();
    if ((typeof STATE !== 'undefined' && STATE.ready) || n > 80) {
      paintSportsMenu();
      highlight();
      clearInterval(t);
    }
  }, 50);
})();
