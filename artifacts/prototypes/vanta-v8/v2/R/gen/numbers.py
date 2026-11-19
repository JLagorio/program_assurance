import json, re, statistics as st
from collections import Counter
R='/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/v2/R'; G='/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/gap'
def cat(r):
  if r.startswith('navigates'): return 'navigates'
  if r.startswith('dialog: next'): return 'dialog: next step'
  return r
ms={t:[x for x in json.load(open(f'{R}/flows/msr-{t}.json')) if 'route' in x] for t in ['v1','v2']}
orig_v2=json.load(open(f'{R}/flows/modalsweep2-v2.json'))
dialogs={
 "review_original_script": {"v1_as_reviewed": dict(Counter(x['result'] for x in json.load(open(f'{G}/flows/modalsweep2.json')))),
   "v2_same_script_unchanged": dict(Counter(x['result'] for x in orig_v2)),
   "note": "the unchanged script reads only .ak-toast, so v2's 'Not saved' messages (in #v2-toast) count as 'closes silently', and 13 selection-bar openers are hidden because nothing is pre-ticked"},
 "adapted_same_74": {t: dict(Counter(cat(x['result']) for x in ms[t])) for t in ms},
 "summary": {"v1": {"change_state": 10, "say_not_wired": 0, "toast_success_no_change": 27, "close_silently": 25},
             "v2": {"change_state": sum(1 for x in ms['v2'] if x['result'].startswith('changes state')), "say_not_wired": sum(1 for x in ms['v2'] if x['result']=='says not wired'), "toast_success_no_change": sum(1 for x in ms['v2'] if x['result']=='closes, toast only'), "close_silently": sum(1 for x in ms['v2'] if x['result'].startswith('closes silently')), "held_by_validation_first_press": sum(1 for x in ms['v2'] if (x.get('presses') or 0)>=2)}},
 "chain_verbs_from_register_headers_v2": {x['route']+' › '+x['title']: x['result'] for x in ms['v2'] if x['title'] in ('Plan an assessment','Create POA&M item','Create risk','Request acceptance','Link evidence','Create task','Assign a role','Add evidence','Create requirement','Import requirements','Add to assessment campaign','Set Ready','Publish assessment results','Change planned date')},
}
def psum(path):
  d=json.load(open(path)); full=[c['effect'] for x in d for c in x.get('controls',[]) if 'Open the full record' in c['key'] or c['txt']=='↗']
  return {"previews":len(d),"opened":sum(1 for x in d if not x.get('error')),"arrow_controls":len(full),"arrow_opens_page":sum(1 for e in full if e.startswith('nav:')),"arrow_does_nothing":sum(1 for e in full if e=='nothing'),"controls_clicked":sum(len(x.get('controls',[])) for x in d),"controls_doing_nothing":sum(1 for x in d for c in x.get('controls',[]) if c['effect']=='nothing'),"toast_only_controls":sum(1 for x in d for c in x.get('controls',[]) if c['effect'].startswith('toast:') and ';' not in c['effect'])}
previews={"review_v1": {"previews":54,"arrow_dead":46,"arrow_works":3},"adapted": {"v1": psum(f'{R}/flows/psr-v1.json'), "v2": psum(f'{R}/flows/psr-v2.json')},
  "note":"'controls doing nothing' in v2 are mostly the current tab (Overview), closed-menu items and two still-dead actions (Edit asset, Ask Priya Raghavan)"}
# noise
P=json.load(open(f'{R}/noise/pooled-rows.json')); d1,d2=P['v1'],P['v2']; common=list(d1)
med=lambda d,k: st.median(d[r][k] for r in common)
tot=lambda d,k: round(sum(d[r][k] for r in common),2)
tones={}
for t in ['v1','v2']:
  dd=json.load(open(f'{R}/noise/tones-{t}.json')); per=Counter(); words={}
  for r,l in dd.items():
    for k,w in l:
      if k.startswith('pill:'): words.setdefault(w,set()).add(k[5:])
  bytone={}
  for w,s in words.items():
    for tone in s: bytone.setdefault(tone,set()).add(w)
  tones[t]={"pill_words_per_tone":{k:len(v) for k,v in bytone.items()},"blue_pill_words":sorted(bytone.get('info',[])),"words_in_more_than_one_tone":sorted(w for w,s in words.items() if len(s-{'?'})>1)}
rt={t:{r:v for r,v in json.load(open(f'{R}/noise/rowtone-{t}.json')).items() if v} for t in ['v1','v2']}
em={t:json.load(open(f'{R}/noise/empties-{t}.json')) for t in ['v1','v2']}
D1=json.load(open(f'{G}/noise/raw/metrics-desktop.json'))['res']; D2=json.load(open(f'{R}/noise/raw-v2/metrics-desktop.json'))['res']
def gad(D): 
  c=Counter()
  for r,x in D.items():
    if r.startswith('panel:') or x.get('meta') or not x.get('counts'): continue
    for k,v in x['counts'].items():
      if k.startswith('gadget'): c[k]+=v['all']
  return dict(c)
def banners(D):
  out={}
  for r,x in D.items():
    if r.startswith('panel:') or x.get('meta') or not x.get('counts'): continue
    b={k:v['all'] for k,v in x['counts'].items() if k.startswith('banner') and v['all']}
    if b: out[r]=b
  return out
def fonts(D):
  fs=set(); fw=set()
  for r,x in D.items():
    if r.startswith('panel:') or x.get('meta') or not x.get('fonts'): continue
    for e in x['fonts']['list']:
      k,n=e.rsplit('×',1); fs.add(k.split('/')[0]); fw.add(k)
  return len(fs),len(fw)
PH1=json.load(open(f'{G}/noise/raw/metrics-phone.json'))['res']; PH2=json.load(open(f'{R}/noise/raw-v2/metrics-phone.json'))['res']
top1=sorted(common,key=lambda r:-d1[r]['pscore'])[:10]; top2=sorted(common,key=lambda r:-d2[r]['pscore'])[:10]
noise={
 "routes":len(common),
 "banners":{"pages_with_banner":{"v1":sum(1 for r in common if d1[r]['banners']),"v2":sum(1 for r in common if d2[r]['banners'])},"by_page_v2_incl_records":banners(D2),"tinted_banner_total_v1":sum(v.get('banner (toned)',0) for v in banners(D1).values()),"tinted_banner_total_v2":sum(v.get('banner (toned)',0) for v in banners(D2).values())},
 "tones":tones,
 "empty_values_above_fold":{t:{"dashed_rings":sum(v['rings'] for v in em[t].values() if v),"empty_words":sum(v['words'] for v in em[t].values() if v)} for t in em},
 "toned_cells_a_row":{t:{"tables":len(rt[t]),"typical_row_3_or_more":sum(1 for v in rt[t].values() if v['median']>=3),"some_row_3_or_more":sum(1 for v in rt[t].values() if v['max']>=3)} for t in rt},
 "gadgets_all":{"v1":gad(D1),"v2":gad(D2)},
 "type":{"v1":dict(zip(["font_sizes","size_weight_pairs"],fonts(D1))),"v2":dict(zip(["font_sizes","size_weight_pairs"],fonts(D2))),"median_pairs_above_fold":{"v1":med(d1,'fonts'),"v2":med(d2,'fonts')}},
 "cues_above_fold":{"median":{"v1":med(d1,'cues'),"v2":med(d2,'cues')},"total":{"v1":tot(d1,'cues'),"v2":tot(d2,'cues')}},
 "marks_above_fold_median":{"v1":med(d1,'marks'),"v2":med(d2,'marks')},
 "colourful_pixels_median_pct":{"v1":med(d1,'pix'),"v2":med(d2,'pix')},
 "pills_above_fold_median":{"v1":med(d1,'pills'),"v2":med(d2,'pills')},
 "examples_total":{"v1":tot(d1,'examples'),"v2":tot(d2,'examples')},
 "ten_heaviest":{"score":"the review's composite (cues, kinds, marks, colour %, font pairs as percentiles), pooled over v1 and v2 so the two builds share one scale",
   "v1":[{"route":r,"score":d1[r]['pscore'],"v2_score":d2[r]['pscore'],"cues":d1[r]['cues'],"v2_cues":d2[r]['cues']} for r in top1],
   "v2":[{"route":r,"score":d2[r]['pscore'],"v1_score":d1[r]['pscore'],"cues":d2[r]['cues'],"v1_cues":d1[r]['cues']} for r in top2],
   "median_score":{"v1":med(d1,'pscore'),"v2":med(d2,'pscore')},
   "note":"Controls' cues rose 70 → 88: with the donut, mini tiles and pre-ticked bar gone, the filter row and more table rows sit above the fold (first row 69% → 47% of the screen)"},
 "phone_390":{"first_row_pct_of_first_screen":{r:{"v1":(PH1.get(r) or {}).get('firstRowPct'),"v2":(PH2.get(r) or {}).get('firstRowPct')} for r in sorted(set(PH1)|set(PH2))}},
}
jobs={
 "j1 Start a program":"works as in v1; the created program becomes current, its starter guide opens its own pages, Programs All 10, on Home",
 "j2 A morning":"10 of 11 My work rows land filtered or with the record open; 'Treat 2 critical risks' still lands on All 40; the CVE row opens its issue",
 "j3 Control to satisfied":"SA-24 walks to Other than satisfied through preview dialogs (map, link, add, Set Ready, determination, publish); SI-2's campaign link opens the campaign",
 "j4 Evidence":"Upload › Add evidence with no file still says 'Added, pending review' and adds nothing; Accept in Review evidence is now blocked by a wrongly required field; Review queue Accept evidence still only toasts",
 "j5 Finding → POA&M → risk accepted":"walks from the new issue's preview: Create POA&M item (Items 42), Create risk (41), Request acceptance (Awaiting 1), steps 1–2 recorded; the POA&M and Risks headers' own Create say Not saved",
 "j6 Assessment campaign":"header Plan an assessment plans a campaign (Active 4); Publish results publishes increment 2; a request's Accept says Not saved; the card's Plan an assessment says Not saved",
 "j7 SSP → AO":"fixes land in place; after submit My work, Review (149), Authorization agree; package Submit waits on SSP 3 approval, saying so",
 "j8 A person":"Add person starts onboarding (9 tasks) and tasks complete; offboarding works; access review decisions move and Complete names what is owed",
}
regress={"page_errors":{"v1":0,"v2":0,"routes_checked":65,"widths":[390,1440]},"sideways_page_scroll":{"v1":0,"v2":0},
  "controls_that_worked_in_v1_and_not_in_v2":{"routes_compared":13,"controls_compared":272,"lost":0,"note":"the full 67-route control sweep could not finish: the machine slept and then ran at load ~160, so page loads timed out; 13 routes completed (Home, My work, Programs, Review, Frameworks, Suppliers, Data calls, Products, Integrations, Reports, Components, AI drafts, Notifications)"},
  "lost_information":["Evidence All 368: Status, Latest version, Renew by hidden while the rows shown agree","Requirements: State hidden"],
  "blocked_flow":["Evidence › Review evidence: Accept cannot be saved"]}
json.dump({"dialogs":dialogs,"previews":previews,"jobs":jobs,"noise":noise,"regressions":regress},open(f'{R}/numbers.json','w'),indent=1,ensure_ascii=False)
print(json.dumps(dialogs['summary']), json.dumps(previews['adapted']))
print(noise['banners']['pages_with_banner'], noise['type'], noise['toned_cells_a_row'], noise['empty_values_above_fold'])
