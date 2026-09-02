/* CASPER SPORT STATS — keep football and futsal player output separate. */
(function () {
  'use strict';

  function clean(name) {
    return String(name || '').replace(/\(.*?\)/g, '').trim().toLowerCase();
  }

  function sportPlayers(id) {
    var s = STATE.sports && STATE.sports[id];
    return (s && s.players) || {};
  }

  function statsFor(name) {
    var key = clean(name);
    var out = { futsalGoals: 0, footballGoals: 0, futsalAssists: 0, footballAssists: 0 };

    ['futsal', 'football'].forEach(function (sport) {
      var players = sportPlayers(sport);
      Object.keys(players).forEach(function (id) {
        var p = players[id];
        if (clean(p.name) !== key) return;
        if (sport === 'futsal') {
          out.futsalGoals += Number(p.goals || 0);
          out.futsalAssists += Number(p.assists || 0);
        } else {
          out.footballGoals += Number(p.goals || 0);
          out.footballAssists += Number(p.assists || 0);
        }
      });
    });
    return out;
  }

  function row(label, value) {
    return '<div class="desktop-row"><span>' + label + '</span><b>' + value + '</b></div>';
  }

  function playerNameFromCard(card) {
    var link = card.querySelector('h3 a[href^="#player/"]');
    if (!link) return '';
    return link.textContent.trim();
  }

  function patchPlayersPage() {
    document.querySelectorAll('.desktop-grid4 .desktop-card').forEach(function (card) {
      var name = playerNameFromCard(card);
      if (!name) return;
      var rows = card.querySelectorAll('.desktop-row');
      Array.prototype.forEach.call(rows, function (r) {
        var label = r.querySelector('span');
        if (label && label.textContent.trim() === 'G/A') {
          var s = statsFor(name);
          r.outerHTML = row('Futsal Goals', s.futsalGoals) +
            row('Football Goals', s.footballGoals) +
            row('Futsal Assists', s.futsalAssists) +
            row('Football Assists', s.footballAssists);
        }
      });
    });
  }

  function patchPlayerPage() {
    var output = Array.prototype.find.call(document.querySelectorAll('.desktop-card'), function (card) {
      var h = card.querySelector('h3');
      return h && h.textContent.trim() === 'OUTPUT';
    });
    if (!output) return;

    var title = document.querySelector('.desktop-hero h2');
    var name = title ? title.textContent.trim() : '';
    if (!name) return;
    var s = statsFor(name);
    var rows = output.querySelectorAll('.desktop-row');
    Array.prototype.forEach.call(rows, function (r) {
      var label = r.querySelector('span');
      if (!label) return;
      var text = label.textContent.trim();
      if (text === 'Goals') r.outerHTML = row('Futsal Goals', s.futsalGoals) + row('Football Goals', s.footballGoals);
      else if (text === 'Assists') r.outerHTML = row('Futsal Assists', s.futsalAssists) + row('Football Assists', s.footballAssists);
    });
  }

  function patch() {
    if (typeof STATE === 'undefined' || !STATE.ready) return;
    var hash = (location.hash || '#home').slice(1);
    if (hash === 'players') patchPlayersPage();
    else if (hash.indexOf('player/') === 0) patchPlayerPage();
  }

  function install() {
    var previous = window.CASPER_DESKTOP_RENDER;
    if (typeof previous !== 'function') return false;
    window.CASPER_DESKTOP_RENDER = function () {
      var result = previous.apply(this, arguments);
      setTimeout(patch, 0);
      return result;
    };
    return true;
  }

  var attempts = 0;
  var timer = setInterval(function () {
    attempts++;
    if (install() || attempts > 100) clearInterval(timer);
  }, 25);
  window.addEventListener('hashchange', function () { setTimeout(patch, 0); });
  window.CASPER_SPORT_STATS = { statsFor: statsFor, patch: patch };
})();
