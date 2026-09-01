function hashStr(s) {
  let h = 2166136261;
  String(s || '').toUpperCase().split('').forEach(c => { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); });
  return h >>> 0;
}
function clubPalette(key) {
  const palettes = [
    ['#0b1d36', '#c9a227', '#f4efe4'],
    ['#111111', '#c41e3a', '#f2f2f2'],
    ['#1e3d2f', '#d4b45a', '#eef6ee'],
    ['#3b0a45', '#e0b83a', '#f7f1ff'],
    ['#12263a', '#2e86ab', '#f5fbff'],
    ['#4a1c00', '#e8d5a3', '#fff8ea'],
    ['#1b1b1b', '#6aa84f', '#f3fff0'],
    ['#3e1f0a', '#8b1e1e', '#fff3e8'],
    ['#0f2744', '#f2c14e', '#ffffff'],
    ['#2c2c2c', '#9aa7b0', '#ffffff'],
    ['#5c0a0a', '#f0d790', '#fffaf0'],
    ['#163e2a', '#f7f3e8', '#c9a227']
  ];
  return palettes[hashStr(key) % palettes.length];
}
function crestSvg(abbr, name) {
  const a = String(abbr || 'CA').slice(0, 4).toUpperCase();
  const pal = clubPalette(abbr || name);
  const bg = pal[0], accent = pal[1], ink = pal[2];
  const id = 'g' + hashStr(a).toString(16);
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 92" role="img" aria-label="' + String(name || a).replace(/"/g, '') + '">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + accent + '"/><stop offset="1" stop-color="' + bg + '"/></linearGradient></defs>' +
    '<path d="M40 4 L72 16 V48 C72 68 58 84 40 88 C22 84 8 68 8 48 V16 Z" fill="url(#' + id + ')" stroke="' + accent + '" stroke-width="2"/>' +
    '<path d="M40 10 L66 20 V47 C66 64 55 77 40 81 C25 77 14 64 14 47 V20 Z" fill="' + bg + '" opacity=".92"/>' +
    '<circle cx="40" cy="36" r="16" fill="none" stroke="' + accent + '" stroke-width="2"/>' +
    '<text x="40" y="41" text-anchor="middle" font-family="Georgia,serif" font-size="' + (a.length > 3 ? 10 : 13) + '" font-weight="700" fill="' + ink + '">' + a + '</text>' +
    '</svg>';
}
function jerseySvg(name, abbr) {
  const pal = clubPalette(abbr || name);
  const bg = pal[0], accent = pal[1], ink = pal[2];
  const n = String(name || 'CASPER').slice(0, 10).toUpperCase();
  const num = (hashStr(name) % 19) + 1;
  return '<div class="jersey" style="background:' + bg + ';color:' + ink + ';border-color:' + accent + '">' +
    '<div class="nm">' + n + '</div><div class="num" style="color:' + accent + '">' + num + '</div>' +
    '<div class="nm">' + String(abbr || '').toUpperCase() + '</div></div>';
}
function markHtml(abbr, name, cls) {
  return '<span class="mark ' + (cls || '') + '" title="' + String(name || abbr) + '">' + crestSvg(abbr, name) + '</span>';
}
