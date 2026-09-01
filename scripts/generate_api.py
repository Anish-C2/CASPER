#!/usr/bin/env python3
"""Generate CASPER API JSON and precomputed analytics from CSN archives."""
import json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; OUT=ROOT/'api'/'v1'; OUT.mkdir(parents=True,exist_ok=True)
MATCH_RE=re.compile(r'([A-Za-z0-9_]+)-([A-Za-z0-9_]+):([0-9]+)-([0-9]+)(?:\(([^)]*)\))?#([A-Za-z0-9]+)')
TEAM_RE=re.compile(r'([A-Za-z0-9_]+)=([^,\n]+?)(?:\[([^\]]+)\])?(?=,|\n|$)')
def blocks(t):
 out=[];start=None;depth=0
 for i,c in enumerate(t):
  if c=='[':
   if depth==0:start=i+1
   depth+=1
  elif c==']' and depth:
   depth-=1
   if depth==0:out.append(t[start:i])
 return out
def section(t,name):
 m=re.search(r'\b'+re.escape(name)+r'\(',t)
 if not m:return None
 start=m.end();depth=1
 for i in range(start,len(t)):
  if t[i]=='(':depth+=1
  elif t[i]==')':
   depth-=1
   if depth==0:return t[start:i]
def header(b):
 r={}
 for line in b.split('n(',1)[0].splitlines():
  if '=' in line:
   k,v=line.split('=',1);r[k.strip()]=v.strip().rstrip(';')
 return r
def parse(b):
 h=header(b);c={'id':h.get('id'),'name':h.get('e'),'season':h.get('s'),'edition':h.get('ed'),'format':h.get('fmt'),'teams':h.get('t'),'status':h.get('sts'),'champion':None};ts=[];ms=[]
 n=section(b,'n')
 if n:
  for code,name,p in TEAM_RE.findall(n):ts.append({'id':code,'name':name.strip(),'player':p or None})
 mb=section(b,'m')
 if mb:
  for i,raw in enumerate([x.strip() for x in mb.split(';') if x.strip()],1):
   x=MATCH_RE.search(raw)
   if x:
    home,away,hs,as_,extra,rnd=x.groups();m={'id':f'{c["season"]}-{c["id"]}-{i:03d}','competition':c['id'],'home_team':home,'away_team':away,'home_score':int(hs),'away_score':int(as_),'round':rnd,'status':'completed'}
    if extra:
     p=re.search(r'p(\d+)-(\d+)',extra)
     if p:m['shootout']=f'{p.group(1)}-{p.group(2)}'
    ms.append(m)
 aw=section(b,'aw') or ''
 for part in aw.split(';'):
  if '=' in part:
   k,v=part.split('=',1)
   if k.strip()=='ch':c['champion']=v.strip()
 return c,ts,ms
def dump(name,obj): (OUT/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
def main():
 comps=[];teams={};players={};matches=[];seasons=set()
 for f in sorted(DATA.glob('*.csn')):
  for b in blocks(f.read_text(encoding='utf8')):
   c,ts,ms=parse(b)
   if not c['id'] or not c['name']:continue
   season=c['season'] or f.stem;seasons.add(season);comps.append(c)
   for t in ts:
    teams.setdefault(t['id'],{**t,'season':season,'matches':0,'wins':0,'draws':0,'losses':0,'goals_for':0,'goals_against':0,'titles':[]})
    if t['player']:
     pid=re.sub(r'[^a-z0-9]+','-',t['player'].lower()).strip('-');players.setdefault(pid,{'id':pid,'name':t['player'],'team':t['id'],'club':t['name'],'season':season})
   matches+=ms
   if c['champion'] in teams:teams[c['champion']]['titles'].append(c['name'])
 for m in matches:
  h,a=teams.get(m['home_team']),teams.get(m['away_team'])
  if not h or not a:continue
  h['matches']+=1;a['matches']+=1;h['goals_for']+=m['home_score'];h['goals_against']+=m['away_score'];a['goals_for']+=m['away_score'];a['goals_against']+=m['home_score']
  if m['home_score']>m['away_score']:h['wins']+=1;a['losses']+=1
  elif m['home_score']<m['away_score']:a['wins']+=1;h['losses']+=1
  else:h['draws']+=1;a['draws']+=1
 teamlist=list(teams.values())
 for t in teamlist:
  t['title_count']=len(t['titles']);t['goal_difference']=t['goals_for']-t['goals_against'];t['win_rate']=round(t['wins']/t['matches'],4) if t['matches'] else 0
 dump('seasons.json',{'seasons':[{'id':s,'name':s,'status':'completed'} for s in sorted(seasons)]})
 dump('competitions.json',{'competitions':comps});dump('teams.json',{'teams':teamlist});dump('players.json',{'players':list(players.values())});dump('matches.json',{'count':len(matches),'matches':matches})
 dump('analytics-teams.json',{'rankings':sorted([{'team':t['id'],'name':t['name'],'matches':t['matches'],'wins':t['wins'],'draws':t['draws'],'losses':t['losses'],'win_rate':t['win_rate'],'goals_for':t['goals_for'],'goals_against':t['goals_against'],'goal_difference':t['goal_difference'],'titles':t['title_count']} for t in teamlist],key=lambda x:(x['win_rate'],x['goal_difference'],x['titles']),reverse=True)})
 dump('analytics-competitions.json',{'competitions':[{'id':c['id'],'name':c['name'],'season':c['season'],'format':c['format'],'champion':c['champion'],'matches':sum(m['competition']==c['id'] for m in matches),'goals':sum(m['home_score']+m['away_score'] for m in matches if m['competition']==c['id'])} for c in comps]})
 dump('analytics.json',{'overview':{'seasons':len(seasons),'competitions':len(comps),'teams':len(teamlist),'players':len(players),'matches':len(matches),'goals':sum(m['home_score']+m['away_score'] for m in matches)},'team_rankings':'./analytics-teams.json','competition_rankings':'./analytics-competitions.json'})
 dump('stats.json',{'matches':len(matches),'competitions':len(comps),'teams':len(teamlist),'players':len(players),'goals':sum(m['home_score']+m['away_score'] for m in matches)})
 dump('index.json',{'name':'CASPER API','version':'1.0.0','data_source':'data/*.csn','endpoints':{'seasons':'./seasons.json','competitions':'./competitions.json','teams':'./teams.json','players':'./players.json','matches':'./matches.json','analytics':'./analytics.json','analytics_teams':'./analytics-teams.json','analytics_competitions':'./analytics-competitions.json','stats':'./stats.json'}})
if __name__=='__main__':main()
