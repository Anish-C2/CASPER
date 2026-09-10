/* CASPER HOME — editorial desk matching the archive layout. */
(function () {
  'use strict';

  var ICONS = {
    trophy: '<svg class="ed-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 4h8v3a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3"/><path d="M12 11v4M9 20h6M10 16h4"/></svg>',
    people: '<svg class="ed-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 19c.3-1.8 1.6-3.2 3.5-3.8"/></svg>',
    chart: '<svg class="ed-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19V5M4 19h16"/><path d="M8 15v-4M12 15V8M16 15v-7"/></svg>',
    file: '<svg class="ed-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/></svg>',
    globe: '<svg class="ed-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 3 2.5 13 0 16M12 4c-2.5 3-2.5 13 0 16"/></svg>'
  };
  var PHOTOS = {
    futsal: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=70',
    football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=70',
    cricket: 'https://images.unsplash.com/photo-1531415074968-64c28dca10b6?auto=format&fit=crop&w=900&q=70',
    trophy: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=700&q=70'
  };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c];
    });
  }
  function sportsCfg() {
    return ((typeof STATE !== 'undefined' && STATE.sportsCfg && STATE.sportsCfg.sports) || []);
  }
  function sportOf(id) {
    return (STATE.sports && STATE.sports[id]) || { matches: [], tournaments: [], players: {}, teams: {}, ranked: [] };
  }
  function isSeasonal(t) {
    return t && t.meta && (t.meta.e === 'Seasonal Awards' || t.meta.typ === 'seasonal');
  }
  function photoOf(id) { return PHOTOS[id] || PHOTOS.futsal; }
  function pageOf(cfg) { return (cfg && cfg.page) || ('sports/' + cfg.id + '.html'); }
  function blurb(cfg) { return (cfg && cfg.blurb) || (cfg && cfg.crown ? ('Crown: ' + cfg.crown) : ''); }
  function latestSeason() {
    var list = (STATE && STATE.seasons) || [];
    if (list.length) return list[list.length - 1];
    return Object.keys((STATE && STATE.seasonsIndex) || {})[0] || '2026A';
  }
  function holder(t, code) {
    var val = t.aw && t.aw[code];
    if (!val) return '';
    return (t.n && t.n[val] && t.n[val].name) || val;
  }
  function namesOf(m) {
    return {
      hn: m.names && m.names[m.home] ? m.names[m.home].name : m.home,
      an: m.names && m.names[m.away] ? m.names[m.away].name : m.away
    };
  }
  function scoreOf(m) {
    if (!m) return '\u2014';
    if (m.kind === 'cricket') return (m.sh + '/' + m.hw + ' \u2013 ' + m.sa + '/' + m.aw);
    var s = (m.sh + '\u2013' + m.sa);
    if (m.p) s += ' (p)';
    return s;
  }
  function facts() {
    var f = { players: 0, clubs: 0, matches: 0, comps: 0 };
    var people = {}, clubs = {};
    sportsCfg().forEach(function (c) {
      var s = sportOf(c.id);
      f.matches += (s.matches || []).length;
      f.comps += (s.tournaments || []).filter(function (t) { return !isSeasonal(t); }).length;
      Object.values(s.players || {}).forEach(function (p) { if (p && p.name) people[String(p.name).toLowerCase()] = 1; });
      Object.values(s.teams || {}).forEach(function (t) { if (t && (t.abbr || t.name)) clubs[String(t.abbr || t.name).toLowerCase()] = 1; });
    });
    Object.keys(STATE.registry || {}).forEach(function (k) {
      if (String(k).charAt(0) === '_') return;
      people[String((STATE.registry[k] && STATE.registry[k].name) || k).toLowerCase()] = 1;
    });
    f.players = Object.keys(people).length;
    f.clubs = Object.keys(clubs).length;
    return f;
  }
  function newsItems() {
    if (typeof generateNews === 'function') {
      try { return generateNews(); } catch (e) {}
    }
    var items = [];
    sportsCfg().forEach(function (c) {
      (sportOf(c.id).tournaments || []).forEach(function (t) {
        if (t.aw && t.aw.ch) items.push({ text: holder(t, 'ch') + ' crowned ' + (t.meta.e || t.meta.id) + ' champions', sport: c.id, season: t.meta && t.meta.s });
      });
    });
    return items;
  }
  function asNews(item) {
    if (typeof item === 'string') return { text: item, sport: 'futsal', season: latestSeason() };
    return item;
  }
  function firstChampion() {
    var found = null;
    sportsCfg().some(function (c) {
      return (sportOf(c.id).tournaments || []).some(function (t) {
        if (!t.aw || !t.aw.ch || isSeasonal(t)) return false;
        found = { event: t.meta.e || t.meta.id, holder: holder(t, 'ch'), season: t.meta.s || latestSeason(), sport: c.id };
        return true;
      });
    });
    return found;
  }
  function leagueBlock() {
    var pick = null;
    sportsCfg().some(function (c) {
      return (sportOf(c.id).tournaments || []).some(function (t) {
        var name = String((t.meta && (t.meta.e || t.meta.id)) || '');
        if (/premier|league|superleague/i.test(name) && !isSeasonal(t)) { pick = { cfg: c, t: t }; return true; }
        if (!pick && !isSeasonal(t)) pick = { cfg: c, t: t };
        return false;
      });
    });
    var rows = [];
    if (pick) {
      var teams = Object.values(pick.t.n || sportOf(pick.cfg.id).teams || {});
      rows = teams.filter(function (t) { return t && (t.matches || t.p || t.pts); }).sort(function (a, b) {
        return (b.pts || 0) - (a.pts || 0) || ((b.gf || 0) - (b.ga || 0)) - ((a.gf || 0) - (a.ga || 0));
      }).slice(0, 6);
    }
    if (!rows.length) {
      var any = sportsCfg()[0] ? Object.values(sportOf(sportsCfg()[0].id).teams || {}) : [];
      rows = any.sort(function (a, b) { return (b.pts || 0) - (a.pts || 0); }).slice(0, 6);
      pick = pick || { cfg: sportsCfg()[0] || { name: 'Archive' }, t: { meta: { e: 'Standings' } } };
    }
    return { title: ((pick && pick.cfg && pick.cfg.name) ? pick.cfg.name.toUpperCase() + ' \u00b7 ' : '') + ((pick && pick.t && pick.t.meta && pick.t.meta.e) || 'TABLE'), rows: rows };
  }
  function topScorers() {
    var rows = [];
    sportsCfg().forEach(function (c) {
      Object.values(sportOf(c.id).players || {}).forEach(function (p) {
        rows.push({ name: p.name, club: p.team || p.club || p.abbr || '', goals: p.goals || p.runs || 0 });
      });
    });
    rows.sort(function (a, b) { return b.goals - a.goals; });
    var seen = {};
    return rows.filter(function (r) {
      var k = String(r.name || '').toLowerCase();
      if (!k || seen[k]) return false;
      seen[k] = 1;
      return r.goals > 0;
    }).slice(0, 5);
  }
  function recentMatches() {
    var out = [];
    sportsCfg().forEach(function (c) {
      (sportOf(c.id).matches || []).forEach(function (m) { out.push({ cfg: c, m: m }); });
    });
    return out.slice(-5).reverse();
  }
  function seasonStatus() {
    var id = latestSeason();
    var rec = ((STATE.seasonsIndex || {})[id]) || {};
    var comps = 0, done = 0;
    sportsCfg().forEach(function (c) {
      (sportOf(c.id).tournaments || []).forEach(function (t) {
        if (isSeasonal(t)) return;
        if (t.meta && t.meta.s && t.meta.s !== id) return;
        comps++;
        if (/complete|completed|finished|done/i.test((t.meta && t.meta.sts) || '') || (t.aw && t.aw.ch)) done++;
      });
    });
    var pct = comps ? Math.round((done / comps) * 100) : (rec.status === 'completed' ? 100 : 0);
    return { id: id, status: rec.status || (pct >= 100 ? 'completed' : 'active'), pct: pct };
  }
  function isHome() {
    var h = (location.hash || '#home').slice(1).split('/')[0];
    return !h || h === 'home';
  }
  function paintNav() {
    var host = document.getElementById('ed-sports-menu');
    if (!host) return;
    var list = sportsCfg();
    if (!list.length) return;
    host.innerHTML = list.map(function (c) {
      return '<a href="' + esc(pageOf(c)) + '">' + esc(c.name) + '</a>';
    }).join('');
  }
  function html() {
    var f = facts();
    var sectorsN = (((STATE.sectorRegistry || {}).sectors) || []).length;
    var sportsN = sportsCfg().length;
    var season = seasonStatus();
    var champ = firstChampion();
    var news = newsItems().map(asNews).slice(0, 5);
    var league = leagueBlock();
    var scorers = topScorers();
    var matches = recentMatches();
    var sportNames = sportsCfg().map(function (c) { return c.name; }).join(', ');

    var shots = sportsCfg().map(function (c) {
      return '<a class="ed-shot" href="' + esc(pageOf(c)) + '" style="background-image:url(\'' + esc(photoOf(c.id)) + '\')"><div class="cap"><b>' + esc(c.name.toUpperCase()) + '</b><small>' + esc((blurb(c) || '').toUpperCase()) + '</small></div></a>';
    }).join('');

    var newsRows = news.map(function (n) {
      return '<a class="ed-news" href="#news"><img class="ed-thumb" alt="" src="' + esc(photoOf(n.sport)) + '"><div><b>' + esc(n.text || n.title) + '</b><time>' + esc(n.season || season.id) + '</time></div></a>';
    }).join('') || '<div class="ed-news"><div><b>Archive is live.</b><time>' + esc(season.id) + '</time></div></div>';

    var matchRows = matches.map(function (x) {
      var nm = namesOf(x.m);
      return '<div class="ed-match"><span>\u25b8</span><span class="ev">' + esc(x.m.event || x.cfg.name) + ' \u00b7 ' + esc(nm.hn) + ' vs ' + esc(nm.an) + '</span><span class="sc">' + esc(scoreOf(x.m)) + '</span><time>' + esc(x.m.date || season.id) + '</time></div>';
    }).join('') || '<div class="ed-match"><span></span><span class="ev">No matches loaded yet.</span></div>';

    var tableRows = league.rows.map(function (t, i) {
      var abbr = String(t.abbr || t.name || '?').slice(0, 3).toUpperCase();
      return '<tr><td>' + (i + 1) + '</td><td><span class="ed-club"><span class="ed-badge">' + esc(abbr.charAt(0)) + '</span>' + esc(t.name || t.abbr) + '</span></td><td class="n">' + (t.matches || t.p || 0) + '</td><td class="n">' + (t.wins || t.w || 0) + '</td><td class="n">' + (t.draws || t.d || 0) + '</td><td class="n">' + (t.losses || t.l || 0) + '</td><td class="n">' + ((t.gf || 0) - (t.ga || 0)) + '</td><td class="n">' + (t.pts || 0) + '</td></tr>';
    }).join('');

    var scorerRows = scorers.map(function (p, i) {
      return '<div class="ed-rank"><b>' + (i + 1) + '</b><span>' + esc(p.name) + (p.club ? ' (' + esc(p.club) + ')' : '') + '</span><em>' + p.goals + '</em></div>';
    }).join('') || '<div class="ed-rank"><b>\u2014</b><span>No scorers yet.</span></div>';

    var sportCards = sportsCfg().map(function (c) {
      return '<a class="ed-sport" href="' + esc(pageOf(c)) + '" style="background-image:url(\'' + esc(photoOf(c.id)) + '\')"><b>' + esc(c.name.toUpperCase()) + '</b><span>' + esc(blurb(c)) + '</span><span class="ed-go">\u2192</span></a>';
    }).join('');

    return '<div class="ed-wrap">' +
      '<section class="ed-hero">' +
        '<div class="ed-copy">' +
          '<div class="ed-kicker">SPORT CONNECTS WHAT DIVIDES.</div>' +
          '<h1>MORE<br>THAN A GAME.</h1>' +
          '<div class="ed-rule"></div>' +
          '<p>CASPER is a multi-sport competitive ecosystem uniting players, clubs and communities across ' + esc(sportNames || 'every sport on file') + ' \u2014 with structured sectors, official records, and a legacy that lasts.</p>' +
          '<div class="ed-actions"><a class="ed-btn solid" href="#competitions">EXPLORE COMPETITIONS \u2192</a><a class="ed-btn ghost" href="governance/index.html">OUR STORY</a></div>' +
          '<div class="ed-facts">' +
            '<div><b>' + sportsN + '</b><span>SPORTS</span></div>' +
            '<div><b>' + sectorsN + '</b><span>SECTORS</span></div>' +
            '<div><b>' + f.comps + '</b><span>COMPETITIONS</span></div>' +
            '<div><b>' + f.players + '</b><span>PLAYERS</span></div>' +
            '<div><b>1</b><span>ARCHIVE</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="ed-shots">' + shots + '</div>' +
        '<aside class="ed-aside">' +
          '<div class="ed-watermark"><small>\u265b</small>C</div>' +
          '<div class="ed-quote">\u201cRecords fade.<br>Legacies don\u2019t.\u201d</div>' +
          '<div class="ed-rule"></div>' +
          '<ul class="ed-points">' +
            '<li>' + ICONS.trophy + ' GLOBAL COMPETITIONS</li>' +
            '<li>' + ICONS.people + ' THRIVING COMMUNITY</li>' +
            '<li>' + ICONS.chart + ' OFFICIAL RECORDS</li>' +
            '<li>' + ICONS.file + ' STRUCTURED SECTORS</li>' +
            '<li>' + ICONS.globe + ' A LASTING LEGACY</li>' +
          '</ul>' +
          '<div class="ed-aside-foot">COMPETITIVE ATHLETICS<br>& SPORTS PROMOTION<br>EST. 2026</div>' +
        '</aside>' +
      '</section>' +
      '<section class="ed-mid">' +
        '<article class="ed-card"><div class="ed-hd"><h3>LATEST NEWS</h3><a href="#news">View All \u2192</a></div>' + newsRows + '</article>' +
        '<article class="ed-card ed-season">' +
          '<div class="ed-hd"><h3>' + esc(season.id) + ' SEASON <span class="ed-pill">\u25c6 ' + esc(String(season.status).toUpperCase()) + '</span></h3><a href="#archive">View Season \u2192</a></div>' +
          '<p>A DEFINING ERA. NEW CHAMPIONS. NEW STORIES.</p>' +
          '<div class="ed-season-nums">' +
            '<div><b>' + f.comps + '</b><span>COMPETITIONS</span></div>' +
            '<div><b>' + f.players + '</b><span>PLAYERS</span></div>' +
            '<div><b>' + f.clubs + '</b><span>CLUBS</span></div>' +
            '<div><b>' + sportsN + '</b><span>SPORTS</span></div>' +
            '<div><b>' + sectorsN + '</b><span>SECTORS</span></div>' +
          '</div>' +
          '<div class="ed-progress"><label><span>SEASON PROGRESS</span><span>' + season.pct + '%</span></label><div class="ed-bar"><i style="width:' + season.pct + '%"></i></div></div>' +
        '</article>' +
        '<article class="ed-card ed-feat">' +
          '<img alt="" src="' + esc(PHOTOS.trophy) + '">' +
          '<div><div class="ed-hd"><small>FEATURED</small><a href="#news">View \u2192</a></div>' +
          '<small>' + esc((champ && champ.event) || 'ARCHIVE') + '</small>' +
          '<h4>CHAMPIONS</h4>' +
          '<p>' + esc((champ && champ.holder) || 'The next champion is still being written.') + '</p></div>' +
        '</article>' +
      '</section>' +
      '<section class="ed-low">' +
        '<article class="ed-card"><div class="ed-hd"><h3>SPORTS</h3><a href="sports/futsal.html">Explore All \u2192</a></div><div class="ed-sports">' + sportCards + '</div></article>' +
        '<article class="ed-card"><div class="ed-hd"><h3>RECENT MATCHES</h3><a href="#results">View All \u2192</a></div>' + matchRows + '</article>' +
        '<article class="ed-card"><div class="ed-hd"><h3>' + esc(league.title) + '</h3><a href="#tables">View Table \u2192</a></div>' +
          '<table class="ed-table"><thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>' + tableRows + '</tbody></table>' +
        '</article>' +
        '<article class="ed-card"><div class="ed-hd"><h3>TOP PERFORMERS (' + esc(season.id) + ')</h3><a href="#ranking">View All \u2192</a></div>' +
          '<div class="ed-tabs"><button type="button" class="on">Top Scorers</button></div>' + scorerRows +
        '</article>' +
      '</section>' +
    '</div>';
  }
  function paint() {
    if (typeof STATE === 'undefined' || !STATE.ready) return false;
    paintNav();
    if ((window.CASPER_PAGE && window.CASPER_PAGE.mode) && window.CASPER_PAGE.mode !== 'hub') return false;
    if (!isHome()) return false;
    var app = document.getElementById('app');
    if (!app) return false;
    app.innerHTML = html();
    return true;
  }
  function wrap() {
    if (window.__CASPER_HOME_WRAP__) return true;
    var prev = window.CASPER_DESKTOP_RENDER;
    if (typeof prev !== 'function') return false;
    window.CASPER_DESKTOP_RENDER = function () {
      prev.apply(this, arguments);
      paint();
    };
    window.__CASPER_HOME_WRAP__ = true;
    return true;
  }
  var n = 0;
  var timer = setInterval(function () {
    n += 1;
    wrap();
    if ((typeof STATE !== 'undefined' && STATE.ready && paint()) || n > 120) clearInterval(timer);
  }, 40);
  window.addEventListener('hashchange', function () { setTimeout(paint, 0); });
})();
