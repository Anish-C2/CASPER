/* CASPER PLAYER PROFILE PATCH — DOM-only metadata enrichment. */
(function () {
  'use strict';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function clean(v) {
    return String(v || '').replace(/\(.*?\)/g, '').trim().toLowerCase();
  }

  function row(label, value) {
    return '<div class="desktop-row"><span>' + esc(label) + '</span><b>' + esc(value == null || value === '' ? '—' : value) + '</b></div>';
  }

  function patchPlayerPage() {
    if (typeof STATE === 'undefined' || !STATE.ready) return;
    var hash = (location.hash || '#home').slice(1);
    if (hash.indexOf('player/') !== 0) return;

    var title = document.querySelector('.desktop-hero h2');
    var registry = Array.prototype.find.call(document.querySelectorAll('.desktop-card'), function (card) {
      var h = card.querySelector('h3');
      return h && h.textContent.trim() === 'REGISTRY';
    });
    if (!title || !registry || registry.dataset.playerMetaPatched === '1') return;

    var name = title.textContent.trim();
    var info = (STATE.registry || {})[clean(name)];
    if (!info) return;

    registry.insertAdjacentHTML('beforeend',
      row('Nationality', info.nationality) +
      row('Position', info.position) +
      row('Preferred Foot', info.preferredFoot) +
      row('Birth Year', info.birthYear)
    );
    registry.dataset.playerMetaPatched = '1';
  }

  function schedule() {
    setTimeout(patchPlayerPage, 0);
    setTimeout(patchPlayerPage, 100);
    setTimeout(patchPlayerPage, 400);
  }

  window.addEventListener('hashchange', schedule);
  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    patchPlayerPage();
    if (tries > 120) clearInterval(timer);
  }, 50);
  schedule();
})();
