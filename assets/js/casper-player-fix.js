/* Desktop player dossier + reliable archive navigation */
(function(){
  function injectStyle(){
    if(document.getElementById('casper-player-fix-style'))return;
    const s=document.createElement('style');s.id='casper-player-fix-style';s.textContent=`
      .player-dossier{display:block;max-width:1400px;margin:0 auto}
      .player-toolbar{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px}
      .player-toolbar .crumbs{font:10px Consolas;color:#6b6256}
      .player-toolbar .actions{display:flex;gap:4px;flex-wrap:wrap}
      .player-toolbar a{border:1px solid #b9a77d;background:#fffdf6;color:#142443;padding:5px 8px;font:700 10px Consolas}
      .player-toolbar a:hover{background:#f1df9e;text-decoration:none}
      .player-hero{display:grid;grid-template-columns:108px minmax(0,1fr) 235px;gap:8px;background:#fffdf6;border:1px solid #b9a77d;padding:8px;margin-bottom:7px}
      .player-mark{min-height:108px;background:#142443;color:#f1df9e;border:2px solid #b58c27;display:grid;place-items:center;text-align:center;font:700 22px Georgia,serif;padding:5px}
      .player-info h1{font:700 27px Georgia,serif;color:#142443;margin:0 0 4px;border-bottom:1px solid #d4c4a0;padding-bottom:4px}
      .player-info .idline{font:11px Consolas;color:#6b6256;margin-bottom:7px}
      .player-info .idline b{color:#142443}
      .player-meta{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #d4c4a0}
      .player-meta div{padding:6px;border-right:1px solid #d4c4a0}.player-meta div:last-child{border-right:0}
      .player-meta span{display:block;font-size:8px;color:#6b6256;text-transform:uppercase}.player-meta b{font-size:10px;color:#142443}
      .player-context{margin:7px 0 0;color:#5f574b;font:11px/1.45 Georgia,serif}
      .player-rank{border:1px solid #d4c4a0;padding:5px;background:#fbf7ec}
      .player-rank h3{margin:-5px -5px 5px;padding:5px;background:#f1dfb7;border-bottom:1px solid #b9a77d;color:#142443;font:700 12px Consolas}
      .player-rank .r{display:flex;justify-content:space-between;border-bottom:1px solid #e1d5bb;padding:5px 2px;font:10px Consolas}.player-rank .r:last-child{border-bottom:0}.player-rank b{color:#142443}
      .player-career{background:#fffdf6;border:1px solid #b9a77d;padding:6px;margin-bottom:7px}
      .player-career h2{font:700 14px Consolas;color:#142443;margin:0 0 5px}
      .player-stat-grid{display:grid;grid-template-columns:repeat(8,1fr);border:1px solid #d4c4a0}
      .player-stat{padding:7px 3px;text-align:center;border-right:1px solid #d4c4a0}.player-stat:last-child{border-right:0}.player-stat b{display:block;font:700 18px Georgia;color:#142443}.player-stat span{font-size:8px;color:#6b6256;text-transform:uppercase}
      .player-sports{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-bottom:7px}
      .player-sports .box{margin:0}.player-sports .sport-head{display:flex;justify-content:space-between;align-items:center;background:#f1dfb7;border-bottom:1px solid #b9a77d;margin:-5px -5px 5px;padding:5px;color:#142443;font:700 12px Consolas}.sport-head a{font-size:9px;color:#8c6f27}
      .player-bottom{display:grid;grid-template-columns:1.35fr 1fr;gap:7px}
      .player-bottom .box{margin:0}.player-bottom table{font-size:10px}
      .player-awards .news{padding:5px 2px;border-bottom:1px solid #e1d5bb;font:10px Consolas}.player-awards .news:last-child{border-bottom:0}
      .player-actions{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.player-actions a{border:1px solid #b9a77d;background:#fffdf6;color:#142443;padding:4px 7px;font:bold 9px Consolas}.player-actions a:hover{background:#f1df9e;text-decoration:none}
      @media(max-width:900px){.player-hero{grid-template-columns:90px minmax(0,1fr)}.player-rank{grid-column:1/-1}.player-stat-grid{grid-template-columns:repeat(4,1fr)}.player-stat:nth-child(4n){border-right:0}.player-stat:nth-child(n+5){border-top:1px solid #d4c4a0}.player-sports{grid-template-columns:1fr}.player-bottom{grid-template-columns:1fr}}
      @media(max-width:600px){.player-meta{grid-template-columns:repeat(2,1fr)}.player-meta div:nth-child(2n){border-right:0}.player-meta div:nth-child(n+3){border-top:1px solid #d4c4a0}}
    `;document.head.appendChild(s)
  }
  function linkForClub(code){return '<a href="#team/'+encodeURIComponent(code)+'">'+escapeHtml(String(code).toUpperCase())+'</a>'}
  window.renderPlayer=function(name){
    const key=decodeURIComponent(name).toLowerCase();const p=collectPlayers().find(x=>x.name.toLowerCase()===key);if(!p)return '<div class="box"><h3>Player not found</h3><a href="#players">Return to Players</a></div>';
    injectStyle();
    const info=regOf(p.name)||{};const ctx=STATE.config.playerContext&&STATE.config.playerContext[key];const comps=playerCompetitionRows(p.name);const by={futsal:[],football:[],cricket:[]};comps.forEach(r=>{if(by[r.sport.id])by[r.sport.id].push(r)});
    const all=collectPlayers();const rank=(field)=>all.slice().sort((a,b)=>(b[field]||0)-(a[field]||0)).findIndex(x=>x.name.toLowerCase()===key)+1;
    const sports=STATE.sportsCfg.sports.map(cfg=>{const rows=by[cfg.id]||[];const cricket=cfg.scoring==='cricket';const total=rows.reduce((s,r)=>({mp:s.mp+r.mp,g:s.g+r.g,a:s.a+r.a,runs:s.runs+r.runs,t:s.t+r.titles}),{mp:0,g:0,a:0,runs:0,t:0});const body=rows.map(r=>cricket?'<tr><td>'+escapeHtml(r.event)+'</td><td>'+r.mp+'</td><td>'+r.runs+'</td><td>'+r.w+'-'+r.d+'-'+r.l+'</td><td>'+r.titles+'</td></tr>':'<tr><td>'+escapeHtml(r.event)+'</td><td>'+r.mp+'</td><td>'+r.g+'</td><td>'+r.a+'</td><td>'+r.w+'-'+r.d+'-'+r.l+'</td><td>'+r.titles+'</td></tr>').join('');const foot=cricket?'<tr class="rank-gold"><td>Total</td><td>'+total.mp+'</td><td>'+total.runs+'</td><td></td><td>'+total.t+'</td></tr>':'<tr class="rank-gold"><td>Total</td><td>'+total.mp+'</td><td>'+total.g+'</td><td>'+total.a+'</td><td></td><td>'+total.t+'</td></tr>';return '<div class="box"><div class="sport-head"><span>'+escapeHtml(cfg.name)+'</span><a href="'+cfg.page+'">Open '+escapeHtml(cfg.name)+'</a></div>'+(rows.length?tableWrap(cricket?'<th>Competition</th><th>MP</th><th>Runs</th><th>W-D-L</th><th>Titles</th>':'<th>Competition</th><th>MP</th><th>G</th><th>A</th><th>W-D-L</th><th>Titles</th>',body+foot):'<p class="muted">No recorded rows.</p>')+'</div>'}).join('');
    const clubs=clubsOf(p).map(linkForClub).join(' · ')||'—';const awards=(p.awards||[]).map(a=>'<div class="news"><b>'+escapeHtml(a.season||'')+'</b> '+escapeHtml(a.label||'')+' · '+escapeHtml(a.event||'')+'</div>').join('')||'<p class="muted">No honours recorded.</p>';const last=lastMatchesFor(key).slice(0,10);const matches=last.length?tableWrap('<th>Sport</th><th>Event</th><th>Score</th><th>R</th>',last.map(x=>'<tr><td>'+escapeHtml(x.cfg.name)+'</td><td>'+escapeHtml(x.m.event||'')+'</td><td><b>'+x.score+'</b></td><td>'+x.letter+'</td></tr>').join('')):'<p class="muted">No matches recorded.</p>';
    const mark=escapeHtml(p.name.split(/\s+/).map(x=>x[0]).join('').slice(0,3).toUpperCase());
    const meta=[['Nationality',info.nationality],['Position',info.position],['Preferred foot',info.preferredFoot||info.foot],['Birth year',info.birthYear],['Status',info.status||'Active'],['Sports',(info.sports||Object.keys(p.bySport)).join(', ')]].map(x=>'<div><span>'+x[0]+'</span><b>'+escapeHtml(x[1]===undefined||x[1]===null||x[1]===''?'—':String(x[1]))+'</b></div>').join('');
    return '<div class="player-dossier"><div class="player-toolbar"><div class="crumbs">CASPER / PLAYERS / '+escapeHtml(p.name)+'</div><div class="actions"><a href="#players">← Players</a><a href="#teams">Clubs</a><a href="#awards">Awards</a><a href="#statistics">Statistics</a></div></div><div class="player-hero"><div class="player-mark">'+mark+'<br><small>'+escapeHtml((clubsOf(p)[0]||'CA').toUpperCase())+'</small></div><div class="player-info"><h1>'+escapeHtml(p.name.toUpperCase())+'</h1><div class="idline"><b>'+clubs+'</b>'+(info.id?' · '+escapeHtml(info.id):'')+'</div><div class="player-meta">'+meta+'</div>'+(ctx?'<p class="player-context">'+escapeHtml(ctx)+'</p>':'')+'</div><div class="player-rank"><h3>Player ranking</h3><div class="r"><span>Goals</span><b>#'+rank('goals')+'</b></div><div class="r"><span>Assists</span><b>#'+rank('assists')+'</b></div><div class="r"><span>Runs</span><b>#'+rank('runs')+'</b></div><div class="r"><span>Titles</span><b>#'+rank('titles')+'</b></div></div></div><div class="player-career"><h2>CAREER SUMMARY</h2><div class="player-stat-grid"><div class="player-stat"><b>'+p.matches+'</b><span>Matches</span></div><div class="player-stat"><b>'+p.goals+'</b><span>Goals</span></div><div class="player-stat"><b>'+p.assists+'</b><span>Assists</span></div><div class="player-stat"><b>'+p.runs+'</b><span>Runs</span></div><div class="player-stat"><b>'+p.titles+'</b><span>Titles</span></div><div class="player-stat"><b>'+p.hatTricks+'</b><span>Hat-tricks</span></div><div class="player-stat"><b>'+((p.awards||[]).length)+'</b><span>Awards</span></div><div class="player-stat"><b>'+pct(p.winRate)+'</b><span>Win %</span></div></div></div><div class="section-title"><span>SPORT RECORDS</span><i></i></div><div class="player-sports">'+sports+'</div><div class="player-bottom"><div class="box"><h3>Recent matches</h3>'+matches+'</div><div class="box player-awards"><h3>Awards & honours</h3>'+awards+'</div></div></div>';
  };
  function rerender(){if((location.hash||'').slice(1).split('/')[0]==='player')document.getElementById('app').innerHTML=renderPlayer(location.hash.slice(8));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rerender);else setTimeout(rerender,0);
})();
