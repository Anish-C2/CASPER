const PAGE = window.CASPER_PAGE || { mode: 'hub', sport: null };
const STATE = { config: {}, sportsCfg: { sports: [] }, misc: {}, sports: {}, ready: false };
const STAGE = { F: 'Final', SF: 'Semi-final', QF: 'Quarter-final', R16: 'Round of 16', R32: 'Round of 32', R64: 'Round of 64', '3P': 'Third Place', TP: 'Third Place', GS: 'Group Stage', FINAL: 'Final', SEMI: 'Semi-final', QUARTER: 'Quarter-final' };
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}
function parseCSN(text) {
  if (!text || typeof text !== 'string') return [];
  let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  cleaned = cleaned.split('\n').map(line => line.trim().startsWith('#') ? '' : line).join('\n');
  const tournaments = [];
  let i = 0, len = cleaned.length;
  const skipWS = () => { while (i < len && /\s/.test(cleaned[i])) i++; };
  const peek = () => cleaned[i];
  const next = () => cleaned[i++];
  function parseValue() {
    skipWS();
    if (peek() === '(') {
      next();
      let depth = 1, start = i;
      while (i < len && depth > 0) {
        if (cleaned[i] === '(') depth++;
        else if (cleaned[i] === ')') depth--;
        if (depth > 0) i++;
      }
      const inner = cleaned.slice(start, i).trim();
      if (peek() === ')') next();
      return { type: 'func', body: inner };
    }
    let val = '';
    while (i < len && cleaned[i] !== ';' && cleaned[i] !== ']') val += cleaned[i++];
    return { type: 'val', body: val.trim() };
  }
  function parseGoalList(s) {
    const out = [];
    if (!s) return out;
    s.split('+').forEach(part => {
      part = part.trim(); if (!part) return;
      const m = part.match(/^(.+)\*(\d+)$/);
      if (m) out.push({ name: m[1].trim(), n: parseInt(m[2], 10) });
      else out.push({ name: part, n: 1 });
    });
    return out;
  }
  function oversToBalls(ov) {
    const n = Number(ov); if (!isFinite(n)) return 0;
    const whole = Math.floor(n + 1e-9);
    return whole * 6 + Math.round((n - whole) * 10);
  }
  function parseMatch(raw) {
    let work = raw.trim(); if (!work) return null;
    let stageFromHash = null;
    const hashM = work.match(/#([A-Za-z0-9]+)\s*$/);
    if (hashM) { stageFromHash = hashM[1].toUpperCase(); work = work.slice(0, hashM.index).trim(); }
    const extras = { et: false, p: null, y: null, r: null, gh: [], ga: [], ah: [], aa: [] };
    const paren = work.match(/^(.*)\(([^)]*)\)\s*$/);
    let extraStr = null;
    if (paren) { work = paren[1].trim(); extraStr = paren[2]; }
    let match = null;
    const cric = work.match(/^([a-zA-Z0-9]+)-([a-zA-Z0-9]+):(\d+)\s*\/\s*(\d+)(?:\(([^)]+)\))?-(\d+)\s*\/\s*(\d+)(?:\(([^)]+)\))?$/);
    const goal = work.match(/^([a-zA-Z0-9]+)-([a-zA-Z0-9]+):(\d+)-(\d+)$/);
    if (cric) {
      const hb = cric[5] ? (/^\d+b$/i.test(cric[5]) ? parseInt(cric[5], 10) : oversToBalls(cric[5])) : null;
      const ab = cric[8] ? (/^\d+b$/i.test(cric[8]) ? parseInt(cric[8], 10) : oversToBalls(cric[8])) : null;
      match = { kind: 'cricket', home: cric[1], away: cric[2], sh: +cric[3], sa: +cric[6], hw: +cric[4], aw: +cric[7], hb, ab, ho: cric[5] || null, ao: cric[8] || null, raw };
    } else if (goal) match = { kind: 'goals', home: goal[1], away: goal[2], sh: +goal[3], sa: +goal[4], raw };
    else return null;
    if (extraStr) {
      extraStr.split(',').forEach(e => {
        e = e.trim();
        if (e === 'et') extras.et = true;
        else if (/^p\d+-\d+$/.test(e)) { const pm = e.match(/p(\d+)-(\d+)/); extras.p = [+pm[1], +pm[2]]; }
        else if (/^y\d+-\d+$/.test(e)) { const ym = e.match(/y(\d+)-(\d+)/); extras.y = [+ym[1], +ym[2]]; }
        else if (/^r\d+-\d+$/.test(e)) { const rm = e.match(/r(\d+)-(\d+)/); extras.r = [+rm[1], +rm[2]]; }
        else if (e.startsWith('gh=')) extras.gh = parseGoalList(e.slice(3));
        else if (e.startsWith('ga=')) extras.ga = parseGoalList(e.slice(3));
        else if (e.startsWith('ah=')) extras.ah = parseGoalList(e.slice(3));
        else if (e.startsWith('aa=')) extras.aa = parseGoalList(e.slice(3));
        else if (STAGE[e.toUpperCase()]) { match.stage = e.toUpperCase(); match.stageLabel = STAGE[e.toUpperCase()]; }
      });
    }
    Object.assign(match, extras);
    if (!match.stage && stageFromHash) { match.stage = stageFromHash; match.stageLabel = STAGE[stageFromHash] || stageFromHash; }
    return match;
  }
  function parseTournament() {
    const t = { meta: {}, n: {}, grp: {}, m: [], aw: {}, sq: {}, ranks: [], nt: '' };
    skipWS(); if (peek() !== '[') return null; next();
    while (i < len) {
      skipWS();
      if (peek() === ']') { next(); break; }
      if (peek() === ';' || peek() === ',') { next(); continue; }
      let key = '';
      while (i < len && /[a-zA-Z0-9_]/.test(cleaned[i])) key += cleaned[i++];
      if (!key) { next(); continue; }
      skipWS();
      let val;
      if (peek() === '=') { next(); skipWS(); val = parseValue(); }
      else if (peek() === '(') val = parseValue();
      else continue;
      if (peek() === ';') next();
      if (val.type === 'val') t.meta[key] = val.body;
      else {
        const body = val.body;
        if (key === 'n') {
          body.split(',').forEach(p => {
            p = p.trim(); if (!p) return;
            const m = p.match(/^([^=]+)=([^\[\]]+)(?:\[([^\]]*)\])?/);
            if (m) t.n[m[1].trim()] = { name: m[2].trim(), player: (m[3] || '').trim() };
          });
        } else if (key === 'm') {
          body.split(';').forEach(raw => { const match = parseMatch(raw); if (match) t.m.push(match); });
        } else if (key === 'aw') {
          body.split(';').forEach(pair => {
            pair = pair.trim(); if (!pair) return;
            const eq = pair.indexOf('=');
            if (eq > 0) t.aw[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
          });
        } else if (key === 'sq') {
          body.split(';').forEach(line => {
            line = line.trim(); if (!line) return;
            const m = line.match(/^([^=]+)=(.*)$/); if (!m) return;
            const parts = m[2].split('|');
            t.sq[m[1].trim()] = { start: (parts[0] || '').split(',').map(s => s.trim()).filter(Boolean), bench: (parts[1] || '').split(',').map(s => s.trim()).filter(Boolean) };
          });
        } else if (key === 'grp') {
          body.split(';').forEach(g => {
            g = g.trim(); if (!g) return;
            const m = g.match(/^([A-Za-z0-9]+)>(.*)/);
            if (m) t.grp[m[1].trim()] = m[2].split(',').map(s => s.trim()).filter(Boolean);
          });
        } else if (key === 'ranks' || key === 'vote') {
          body.split(',').forEach((part, idx) => {
            part = part.trim(); if (!part) return;
            let rank = idx + 1, name = part, points = null;
            const m1 = part.match(/^(\d+)\s*=\s*(.+)$/);
            if (m1) { rank = parseInt(m1[1], 10); name = m1[2].trim(); }
            const pts = name.match(/^(.+?)\s*[:=]\s*(\d+)\s*$/);
            if (pts) { name = pts[1].trim(); points = parseInt(pts[2], 10); }
            t.ranks.push({ rank, name, points });
          });
        } else if (key === 'nt') t.nt = body.trim();
        else t.meta[key] = body;
      }
    }
    return t;
  }
  while (i < len) {
    skipWS(); if (i >= len) break;
    if (peek() === '[') { const t = parseTournament(); if (t && t.meta.id) tournaments.push(t); }
    else i++;
  }
  return tournaments;
}
function emptyTeam(abbr, info) {
  return { abbr, name: info ? info.name : abbr, player: info ? info.player : '', matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0, titles: 0, runnerUps: 0, thirds: 0, cleanSheets: 0, biggestWin: 0, trophies: [], runsFor: 0, runsAg: 0, wktsLost: 0, wktsTook: 0, ballsFaced: 0, ballsBowled: 0, sportPts: 0 };
}
function emptyPlayer(name) {
  return { name, teams: new Set(), clubNames: new Set(), matches: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, conceded: 0, titles: 0, hatTricks: 0, awards: [], trophies: [] };
}
function resultOf(m) {
  if (m.p) return m.p[0] > m.p[1] ? 'H' : 'A';
  if (m.sh > m.sa) return 'H';
  if (m.sa > m.sh) return 'A';
  return 'D';
}
function oversToBallsSafe(ov) {
  const n = Number(ov); if (!isFinite(n)) return 6;
  const whole = Math.floor(n + 1e-9);
  return whole * 6 + Math.round((n - whole) * 10);
}
function buildSport(cfg, tournaments) {
  const teams = {}, players = {}, matches = [];
  const ensureT = (abbr, info) => { if (!teams[abbr]) teams[abbr] = emptyTeam(abbr, info); if (info && info.name) { teams[abbr].name = info.name; teams[abbr].player = info.player || teams[abbr].player; } return teams[abbr]; };
  const ensureP = (name) => {
    if (!name) return null;
    const key = name.toLowerCase().replace(/\(.*?\)/g, '').trim();
    const display = name.replace(/\(.*?\)/g, '').trim();
    if (!players[key]) players[key] = emptyPlayer(display);
    return players[key];
  };
  tournaments.forEach(t => {
    Object.keys(t.n).forEach(abbr => ensureT(abbr, t.n[abbr]));
    Object.keys(t.sq || {}).forEach(abbr => {
      const sq = t.sq[abbr] || {};
      [].concat(sq.start || [], sq.bench || []).forEach(nm => {
        const p = ensureP(nm); if (!p) return;
        p.teams.add(abbr); if (teams[abbr]) p.clubNames.add(teams[abbr].name);
      });
    });
    Object.keys(t.n).forEach(abbr => {
      if (t.n[abbr].player) {
        const p = ensureP(t.n[abbr].player);
        if (p) { p.teams.add(abbr); p.clubNames.add(t.n[abbr].name); }
      }
    });
    const quotaBalls = oversToBallsSafe(t.meta.ov || t.meta.overs || (cfg.scoring === 'cricket' ? '1' : '20'));
    const allOutW = parseInt(t.meta.wk || t.meta.wickets || (cfg.scoring === 'cricket' ? '1' : '10'), 10);
    t.m.forEach(m => {
      const th = ensureT(m.home, t.n[m.home]);
      const ta = ensureT(m.away, t.n[m.away]);
      th.matches++; ta.matches++;
      const res = resultOf(m);
      if (res === 'H') { th.wins++; ta.losses++; th.pts += cfg.winPts; th.biggestWin = Math.max(th.biggestWin, m.sh - m.sa); }
      else if (res === 'A') { ta.wins++; th.losses++; ta.pts += cfg.winPts; ta.biggestWin = Math.max(ta.biggestWin, m.sa - m.sh); }
      else { th.draws++; ta.draws++; th.pts += 1; ta.pts += 1; }
      th.gf += m.sh; ta.gf += m.sa; th.ga += m.sa; ta.ga += m.sh;
      if (m.kind === 'cricket') {
        th.runsFor += m.sh; ta.runsFor += m.sa; th.runsAg += m.sa; ta.runsAg += m.sh;
        th.wktsLost += m.hw; ta.wktsLost += m.aw; th.wktsTook += m.aw; ta.wktsTook += m.hw;
        const hFace = (m.hw >= allOutW) ? quotaBalls : (m.hb != null ? m.hb : quotaBalls);
        const aFace = (m.aw >= allOutW) ? quotaBalls : (m.ab != null ? m.ab : quotaBalls);
        th.ballsFaced += hFace; ta.ballsFaced += aFace; th.ballsBowled += aFace; ta.ballsBowled += hFace;
      } else {
        if (m.sa === 0) th.cleanSheets++;
        if (m.sh === 0) ta.cleanSheets++;
      }
      function applyList(list, field, teamAbbr) {
        (list || []).forEach(item => {
          const p = ensureP(item.name); if (!p) return;
          p[field] += item.n; p.teams.add(teamAbbr);
          if (teams[teamAbbr]) p.clubNames.add(teams[teamAbbr].name);
          if (field === 'goals' && item.n >= 3) p.hatTricks++;
        });
      }
      applyList(m.gh, 'goals', m.home); applyList(m.ga, 'goals', m.away);
      applyList(m.ah, 'assists', m.home); applyList(m.aa, 'assists', m.away);
      const ph = t.n[m.home] && t.n[m.home].player ? ensureP(t.n[m.home].player) : null;
      const pa = t.n[m.away] && t.n[m.away].player ? ensureP(t.n[m.away].player) : null;
      if (ph && !(m.gh && m.gh.length)) { ph.goals += m.sh; if (m.sh >= 3) ph.hatTricks++; }
      if (pa && !(m.ga && m.ga.length)) { pa.goals += m.sa; if (m.sa >= 3) pa.hatTricks++; }
      if (ph) ph.conceded += m.sa;
      if (pa) pa.conceded += m.sh;
      [ph, pa].forEach((p, idx) => {
        if (!p) return;
        p.matches++;
        if (res === 'D') p.draws++;
        else if ((res === 'H' && idx === 0) || (res === 'A' && idx === 1)) p.wins++;
        else p.losses++;
      });
      matches.push(Object.assign({}, m, { event: t.meta.e || t.meta.id, season: t.meta.s || '', tourney: t.meta.id, names: t.n }));
    });
    function addTrophy(holder, code, label) {
      const item = { code, label, event: t.meta.e || t.meta.id, season: t.meta.s || '', tourney: t.meta.id };
      if (teams[holder]) {
        teams[holder].trophies.push(item);
        if (code === 'ch') teams[holder].titles++;
        if (code === 'ru') teams[holder].runnerUps++;
        if (code === '3p') teams[holder].thirds++;
        if (teams[holder].player) {
          const p = ensureP(teams[holder].player);
          if (p) { p.trophies.push(item); if (code === 'ch') p.titles++; p.awards.push(item); }
        }
      } else {
        const p = ensureP(holder);
        if (p) { p.trophies.push(item); p.awards.push(item); if (code === 'ch' || /tsar|crown/i.test(code + label)) p.titles++; }
      }
    }
    Object.keys(t.aw).forEach(code => {
      const label = (STATE.config.awardLabels && STATE.config.awardLabels[code]) || code;
      addTrophy(t.aw[code], code, label);
    });
    (t.ranks || []).forEach(r => {
      const p = ensureP(r.name);
      if (p) p.awards.push({ code: 'rank', label: 'Season rank ' + r.rank + (r.points != null ? ' (' + r.points + ' pts)' : ''), event: t.meta.e || 'Seasonal', season: t.meta.s || '', tourney: t.meta.id });
    });
  });
  Object.values(teams).forEach(tm => {
    tm.gd = tm.gf - tm.ga;
    tm.winRate = tm.matches ? tm.wins / tm.matches : 0;
    tm.gpg = tm.matches ? tm.gf / tm.matches : 0;
    if (cfg.scoring === 'cricket') {
      const rrF = tm.ballsFaced ? tm.runsFor / (tm.ballsFaced / 6) : 0;
      const rrA = tm.ballsBowled ? tm.runsAg / (tm.ballsBowled / 6) : 0;
      tm.nrr = rrF - rrA;
    } else tm.nrr = 0;
    tm.sportPts = tm.titles * 100 + tm.runnerUps * 40 + tm.thirds * 15 + tm.pts + tm.wins * 2 + tm.gd * 0.15 + tm.nrr * 2;
  });
  Object.values(players).forEach(p => {
    p.winRate = p.matches ? p.wins / p.matches : 0;
    p.gpg = p.matches ? p.goals / p.matches : 0;
    p.gd = p.goals - p.conceded;
  });
  const ranked = Object.values(teams).sort((a, b) => b.sportPts - a.sportPts || b.titles - a.titles || b.winRate - a.winRate || b.gd - a.gd);
  ranked.forEach((tm, i) => { tm.rank = i + 1; });
  return { cfg, tournaments, teams, players, matches, ranked };
}
function teamName(sportState, abbr) {
  const t = sportState && sportState.teams && sportState.teams[abbr];
  return t ? t.name : abbr;
}
function crownWinner(cfg) {
  if (!cfg) return null;
  const sp = STATE.sports[cfg.id]; if (!sp) return null;
  const needle = (cfg.crown || '').toLowerCase();
  const hit = sp.tournaments.find(t => (t.meta.e || '').toLowerCase() === needle) || sp.tournaments.find(t => (t.meta.e || '').toLowerCase().includes(needle));
  if (hit && hit.aw && hit.aw.ch) return hit.aw.ch;
  return null;
}
function globalRanks() {
  const byAbbr = {};
  STATE.sportsCfg.sports.forEach(cfg => {
    const sp = STATE.sports[cfg.id]; if (!sp) return;
    Object.values(sp.teams).forEach(tm => {
      if (!byAbbr[tm.abbr]) byAbbr[tm.abbr] = { abbr: tm.abbr, name: tm.name, ranks: {}, scores: {}, titles: {} };
      byAbbr[tm.abbr].name = tm.name || byAbbr[tm.abbr].name;
      byAbbr[tm.abbr].ranks[cfg.id] = tm.rank;
      byAbbr[tm.abbr].scores[cfg.id] = tm.sportPts;
      byAbbr[tm.abbr].titles[cfg.id] = tm.titles;
    });
  });
  return Object.values(byAbbr).map(row => {
    const ids = STATE.sportsCfg.sports.map(s => s.id);
    const present = ids.filter(id => row.ranks[id] != null);
    const avg = present.length ? present.reduce((s, id) => s + row.ranks[id], 0) / present.length : 99;
    const totalScore = ids.reduce((s, id) => s + (row.scores[id] || 0), 0);
    const crowns = present.filter(id => crownWinner(STATE.sportsCfg.sports.find(s => s.id === id)) === row.abbr).length;
    return Object.assign({}, row, { sportsPlayed: present.length, avgRank: avg, totalScore, crowns });
  }).sort((a, b) => a.avgRank - b.avgRank || b.totalScore - a.totalScore);
}
function unitOf(cfg) { return (cfg && cfg.unit) || (cfg && cfg.scoring === 'cricket' ? 'Runs' : 'Goals'); }
