import json, statistics as st
from collections import defaultdict, Counter
D=json.load(open('raw/metrics-desktop.json'))['res']; P=json.load(open('raw/metrics-phone.json'))['res']
TYPE={}
for r in 'home'.split(): TYPE[r]='home'
for r in 'my-work review-queue'.split(): TYPE[r]='inbox'
for r in 'overview getting-started itcsc posture resiliency sse traceability inheritance authorization conmon'.split(): TYPE[r]='overview'
for r in 'control-si2 evidence-page-e1 policy-page-ac-1 campaign component-mc person-joel-barrantes check-scan stigs-mission-computer-rhel9 data-calls-fisma frameworks-high integration-emass plan-cp-x'.split(): TYPE[r]='record'
for r in 'ssp policy-editor plan-cp program-new'.split(): TYPE[r]='editor'
for r in 'deadlines notifications event-log enclaves common-controls permissions'.split(): TYPE[r]='settings'
def cue(x,ab=True):
    return sum(v['above' if ab else 'all'] for k,v in x['counts'].items() if not k.startswith(('tab','frame')))
def kinds(x):
    return len({k.split(' (')[0] for k,v in x['counts'].items() if v['above']>0 and not k.startswith(('tab','frame'))})
rows=[]
for r,x in D.items():
    if r.startswith('panel:') or x.get('meta') or not x.get('counts'): continue
    t=TYPE.get(r,'register')
    a=x['above']; c=x['colours']['above']
    rows.append(dict(route=r,label=x['label'] or r,type=t,nav=x['nav'],inprog=x['inprog'],cues=cue(x),cuesAll=cue(x,False),kinds=kinds(x),
        gadgetKinds=len({k for k,v in x['counts'].items() if k.startswith('gadget') and v['above']>0}),
        pills=a['pills'],gadgets=a['gadgets'],cards=a['cards']+a['cardsNested'],banners=a['banners'],buttons=a['buttons'],tabs=a['tabs'],icons=a['icons'],
        marks=x['marks']['above'],marksAll=x['marks']['all'],fonts=x['fonts']['distinctAbove'],fontsAll=x['fonts']['distinct'],colours=c['togetherClustered'],coloursRaw=c['together'],hues=c['hues'],
        pix=(x.get('pixels') or {}).get('colourfulPct',0),firstRowPct=x['firstRowPct'],examples=x['examples'],pageH=x['scrollH'],shot=x['shot']))
KEYS=['cues','kinds','marks','pix','fonts']
for k in KEYS:
    vals=sorted(r[k] for r in rows)
    for r in rows:
        v=r[k]; r.setdefault('pct',{})[k]=round(100*(sum(1 for y in vals if y<v)+0.5*sum(1 for y in vals if y==v))/len(vals),1)
for r in rows: r['score']=round(sum(r['pct'].values())/len(KEYS),1)
rows.sort(key=lambda r:-r['score'])
print('%-28s %-8s %5s | %4s %3s %4s %5s %3s | %4s %4s %4s %4s %4s %4s | %4s %3s %4s'%('route','type','score','cues','knd','mark','pix','fnt','pill','gad','card','ban','btn','icon','row%','ex','tabs'))
for r in rows: print('%-28s %-8s %5.1f | %4d %3d %4d %5.2f %3d | %4d %4d %4d %4d %4d %4d | %4s %3d %4d'%(r['route'][:28],r['type'],r['score'],r['cues'],r['kinds'],r['marks'],r['pix'],r['fonts'],r['pills'],r['gadgets'],r['cards'],r['banners'],r['buttons'],r['icons'],r['firstRowPct'],r['examples'],r['tabs']))
json.dump(rows,open('raw/rows.json','w'),indent=1)
# per type medians
print('\nMEDIANS BY TYPE')
bt=defaultdict(list)
for r in rows: bt[r['type']].append(r)
for t,l in bt.items():
    m=lambda k: st.median([x[k] for x in l])
    print('%-9s n=%2d cues %5.1f kinds %4.1f marks %5.1f pix %4.2f fonts %4.1f pills %4.1f gadgets %4.1f cards %4.1f banners %3.1f buttons %4.1f icons %4.1f'%(t,len(l),m('cues'),m('kinds'),m('marks'),m('pix'),m('fonts'),m('pills'),m('gadgets'),m('cards'),m('banners'),m('buttons'),m('icons')))
# inventory
agg=defaultdict(lambda:{'all':0,'above':0,'pages':Counter()})
for r,x in D.items():
    if r.startswith('panel:') or x.get('meta') or not x.get('counts'): continue
    for k,v in x['counts'].items():
        if v['all']: agg[k]['all']+=v['all']; agg[k]['above']+=v['above']; agg[k]['pages'][r]+=v['all']
print('\nINVENTORY')
for k,v in sorted(agg.items(), key=lambda kv:-len(kv[1]['pages'])):
    print('%-30s pages %2d all %5d above %4d top: %s'%(k,len(v['pages']),v['all'],v['above'],', '.join(f'{a}:{b}' for a,b in v['pages'].most_common(8))))
# font sizes across product pages
fs=Counter(); fw=Counter()
for r,x in D.items():
    if r.startswith('panel:') or x.get('meta') or not x.get('fonts'): continue
    for e in x['fonts']['list']:
        k,n=e.rsplit('×',1); size,w=k.split('/'); fs[size]+=int(n); fw[k]+=int(n)
print('\nFONT SIZES', len(fs), sorted(fs.items(), key=lambda kv: float(kv[0][:-2])))
print('PAIRS', len(fw))
print('EXAMPLE markers total', sum(r['examples'] for r in rows), 'pages', sum(1 for r in rows if r['examples']), [ (r['route'],r['examples']) for r in rows if r['examples']])
print('banner pages', sum(1 for r in rows if r['banners']), 'of', len(rows))
