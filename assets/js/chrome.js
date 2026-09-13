/* CASPER chrome — compact left nav + search on every page. */
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
  function titleFor() {
    var mode = page().mode, sport = page().sport, sector = page().sector;
    if (mode === 'hub') return 'CASPER';
    if (mode === 'sport' && sport) return sport.charAt(0).toUpperCase() + sport.slice(1);
    if (mode === 'sectors') return 'Sectors';
    if (mode === 'sector' || mode === 'sector-render') return sector || 'Sector';
    if (mode === 'governance') return 'Governance';
    if (mode === 'join') return 'How to join';
    if (mode === 'api') return 'Data API';
    return 'CASPER';
  }
  function views() {
    return [
      ['home', 'Desk'], ['news', 'News'], ['competitions', 'Competitions'], ['live-scores', 'Live'],
      ['results', 'Results'], ['players', 'Players'], ['teams', 'Clubs'], ['awards', 'Awards'],
      ['ranking', 'Ranking'], ['tables', 'Tables'], ['records', 'Records'], ['statistics', 'Statistics'],
      ['archive', 'Archive'], ['about', 'About']
    ];
  }
  function paintSports() {
    var host = document.getElementById('p-sports');
    if (!host) return;
    var list = (typeof STATE !== 'undefined' && STATE.sportsCfg && STATE.sportsCfg.sports) || [
      { id: 'futsal', name: 'Futsal', page: 'sports/futsal.html' },
      { id: 'football', name: 'Football', page: 'sports/football.html' },
      { id: 'cricket', name: 'Cricket', page: 'sports/cricket.html' }
    ];
    host.innerHTML = list.map(function (c) {
      return '<li><a href="' + href((c && c.page) || ('sports/' + c.id + '.html')) + '">' + String(c.name || c.id) + '</a></li>';
    }).join('');
  }
  function paintTabs() {
    var host = document.getElementById('p-views');
    if (!host) return;
    var mode = page().mode;
    if (mode !== 'sport' && mode !== 'sector' && mode !== 'hub') { host.hidden = true; return; }
    host.hidden = false;
    var hash = (location.hash || '#home').slice(1).split('/')[0] || 'home';
    host.innerHTML = views().map(function (v) {
      var on = (v[0] === 'home' && (hash === 'home' || hash === '')) || v[0] === hash || (v[0] === 'teams' && hash === 'clubs');
      return '<li' + (on ? ' class="selected"' : '') + '><a href="#' + v[0] + '">' + v[1] + '</a></li>';
    }).join('');
  }
  function highlight() {
    var mode = page().mode;
    var path = location.pathname || '';
    document.querySelectorAll('#mw-panel [data-nav]').forEach(function (a) {
      var key = a.getAttribute('data-nav');
      var on = false;
      if (key === 'home' && mode === 'hub') on = true;
      if (key === 'sports' && mode === 'sport') on = true;
      if (key === 'sectors' && (mode === 'sectors' || mode === 'sector' || mode === 'sector-render' || path.indexOf('/sectors') !== -1)) on = true;
      if (key === 'governance' && (mode === 'governance' || path.indexOf('/governance') !== -1)) on = true;
      if (key === 'join' && (mode === 'join' || path.indexOf('/join') !== -1)) on = true;
      if (key === 'api' && (mode === 'api' || path.indexOf('/api') !== -1)) on = true;
      a.classList.toggle('on', on);
    });
    paintTabs();
    var h = document.getElementById('firstHeading');
    if (h && !h.dataset.lock) h.textContent = titleFor();
  }
  function bindSearch() {
    var form = document.getElementById('searchform');
    if (!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1';
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var q = ((form.search && form.search.value) || '').trim();
      if (!q) return;
      var mode = page().mode;
      if (mode === 'hub' || mode === 'sport' || mode === 'sector' || mode === 'sector-render') {
        location.hash = '#player/' + encodeURIComponent(q);
      } else {
        location.href = href('index.html') + '#player/' + encodeURIComponent(q);
      }
    });
  }
  function mount() {
    if (document.getElementById('mw-panel')) { paintSports(); highlight(); bindSearch(); return; }
    var existing = document.getElementById('app');
    var panel = document.createElement('div');
    panel.id = 'mw-panel';
    panel.innerHTML =
      '<div id="p-logo"><a href="' + href('index.html') + '" title="CASPER">CASPER</a></div>' +
      '<div class="portal"><h3>Pages</h3><ul>' +
        '<li><a data-nav="home" href="' + href('index.html') + '">Main</a></li>' +
        '<li><a data-nav="sports" href="' + href('sports/futsal.html') + '">Sports</a></li>' +
        '<li><a data-nav="sectors" href="' + href('sectors/index.html') + '">Sectors</a></li>' +
        '<li><a data-nav="governance" href="' + href('governance/index.html') + '">Governance</a></li>' +
        '<li><a data-nav="join" href="' + href('join/index.html') + '">Join</a></li>' +
        '<li><a data-nav="api" href="' + href('api/index.html') + '">API</a></li>' +
      '</ul></div>' +
      '<div class="portal"><h3>Sports</h3><ul id="p-sports"></ul></div>' +
      '<div class="portal"><h3>Archive</h3><ul>' +
        '<li><a href="' + href('index.html') + '#competitions">Competitions</a></li>' +
        '<li><a href="' + href('index.html') + '#archive">Seasons</a></li>' +
        '<li><a href="' + href('index.html') + '#statistics">Statistics</a></li>' +
      '</ul></div>';
    var head = document.createElement('div');
    head.id = 'mw-head';
    head.innerHTML =
      '<div id="p-personal"><ul>' +
        '<li><a href="' + href('join/index.html') + '">Join</a></li>' +
        '<li><a href="https://github.com/Anish-C2/CASPER">Source</a></li>' +
      '</ul></div>' +
      '<div id="p-search"><form id="searchform" action="#">' +
        '<input type="search" name="search" placeholder="Search">' +
        '<button type="submit">Go</button></form></div>';
    var content = document.getElementById('content');
    if (!content) {
      content = document.createElement('div');
      content.id = 'content';
      var heading = document.createElement('h1');
      heading.id = 'firstHeading';
      heading.textContent = titleFor();
      var bodyContent = document.createElement('div');
      bodyContent.id = 'bodyContent';
      if (existing) bodyContent.appendChild(existing);
      var tabs = document.createElement('div');
      tabs.id = 'p-namespaces';
      tabs.innerHTML = '<ul id="p-views"></ul>';
      content.appendChild(tabs);
      content.appendChild(heading);
      content.appendChild(bodyContent);
      document.body.insertBefore(content, document.body.firstChild);
    }
    var foot = document.createElement('div');
    foot.id = 'footer';
    foot.innerHTML = '<ul><li>Static archive. Tables built from CSN files.</li></ul>' +
      '<ul><li><a href="' + href('index.html') + '">Main</a></li>' +
      '<li><a href="' + href('governance/index.html') + '">Governance</a></li>' +
      '<li><a href="' + href('api/index.html') + '">API</a></li></ul>';
    document.body.insertBefore(head, document.body.firstChild);
    document.body.insertBefore(panel, document.body.firstChild);
    document.body.appendChild(foot);
    document.querySelectorAll('.ed-top, .ed-foot, .ed-desk, header.ed-top, footer.ed-foot').forEach(function (el) {
      el.style.display = 'none';
    });
    paintSports(); highlight(); bindSearch();
  }
  window.CASPER_CHROME = { href: href, paint: mount, highlight: highlight };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
  window.addEventListener('hashchange', highlight);
  var n = 0, t = setInterval(function () {
    n += 1; paintSports();
    if ((typeof STATE !== 'undefined' && STATE.ready) || n > 80) { paintSports(); highlight(); clearInterval(t); }
  }, 50);
})();
