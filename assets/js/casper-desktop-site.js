/* CASPER DESKTOP SITE loader — pulls the data renderer in two parts. */
(function () {
  function add(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  var v = '20260901h';
  add('assets/js/casper-desktop-p1.js?v=' + v)
    .then(function () { return add('assets/js/casper-desktop-p2.js?v=' + v); })
    .then(function () {
      if (typeof window.CASPER_DESKTOP_RENDER === 'function' && window.STATE && window.STATE.ready) {
        try { window.CASPER_DESKTOP_RENDER(); } catch (e) {}
      }
    })
    .catch(function (err) {
      var app = document.getElementById('app');
      if (app) app.innerHTML = '<div class="desktop-page"><div class="desktop-hero"><h2>ARCHIVE SCRIPT FAILED</h2><p>' + String(err) + '</p></div></div>';
    });
})();
