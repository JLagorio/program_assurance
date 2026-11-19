import json
N='/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/gap/noise'
V='/Users/joseflagorio/Development/program_assurance-ux-proposal/docs/products/vanta'
d=lambda r: f'{N}/raw/shots/d-{r}.png'
m=lambda r: f'{N}/raw/shots/m-{r}.png'
v=lambda p: f'{V}/images/ux/{p}'
F=[]
def f(id,sev,kind,screens,routes,we,va,fix,ours,vanta,judg=False):
    F.append(dict(id=id,screens=screens,routes=routes,kind=kind,we_do=we,vanta_does=va,severity=sev,fix=fix,ours=ours,vanta=vanta,judgment=judg))
f('N01','high','banner',
 ['Home','WS-X90 › Compliance › Policies','WS-X90 › System › Inventory','WS-X90 › Compliance › Baseline','WS-X90 › System › STIG checklists › Mission Computer · RHEL 9','Products › Products','Products › Components','Library › Data calls','Settings › Deadlines','Settings › Common control providers','WS-X90 › ITCSC','WS-X90 › System › Composition','WS-X90 › System › STIG checklists','WS-X90 › Compliance › Evidence','WS-X90 › Risk › Threats','WS-X90 › Analysis › Posture','WS-X90 › Analysis › Cyber resiliency','WS-X90 › Analysis › Security engineering','WS-X90 › Analysis › Inheritance','WS-X90 › Monitor › Continuous monitoring','WS-X90 › People','WS-X90 › Assess › Cyber T&E','Evidence record (E1)','Policy editor'],
 ['home','policies','inventory','baseline','stigs-mission-computer-rhel9','products','components','data-calls','deadlines','common-controls','itcsc','composition','stigs','evidence','threats','posture','resiliency','sse','inheritance','conmon','people','cyber-te','evidence-page-e1','policy-editor'],
 '24 of 65 product pages open with a full-width tinted box (amber, red or blue fill); Home has two. Most repeat a fact the page says again below: Policies "12 policies have no approver recorded" above the quick views; Inventory "20 assets have no owner" above 20 per-row Assign owner buttons.',
 'Callouts on 2 of the 13 pages looked at (Home, and one inside a card on Vulnerabilities). Each is a grey box where only the glyph is coloured, with one bordered button.',
 'cut to one per page, only for something that blocks work, and restyle as a grey callout whose glyph alone carries the tone',
 [d('home'),d('policies'),d('inventory'),d('baseline'),d('stigs-mission-computer-rhel9')],
 [v('home/getting-started-with-workspaces--02.png'),v('vulnerabilities/the-vulnerabilities-page--01.png'),'V/style.md §1 "Cards and summary cards": "A callout is a full-width grey box"'])
f('N02','high','colour meaning',
 ['WS-X90 › Compliance › Controls','WS-X90 › Compliance › Policies','WS-X90 › System › Ports & protocols','WS-X90 › System › Interconnections','WS-X90 › Analysis › Security engineering','WS-X90 › Analysis › Traceability','WS-X90 › Monitor › Schedule','WS-X90 › Risk › POA&M','WS-X90 › Authorize › Authorization','WS-X90 › Assess › Cyber T&E','Assessments › Expanded Control Set Assessment'],
 ['controls','policies','ppsm','interconnections','sse','traceability','schedule','poam','authorization','cyber-te','campaign'],
 'The blue (info) pill carries 14 different words: Active, Ready, In review, In progress, Planned, Validating, Current, IATT, Offer waiting, Not assessed, Not required, Not applicable, You are here, One. Six words change tone between pages: Not assessed is blue on Controls and Policies, amber on Interconnections, grey on Security engineering; In progress amber on POA&M, Schedule and Continuous monitoring, blue on Traceability; In review amber on Policies and Data calls, blue on Schedule and Security engineering; Draft both amber and grey on Authorization; Planned grey on six pages, blue on Cyber T&E; Current green on Evidence sources, blue on Authorization. Blue is also the link, the chosen quick view, the checkbox and every avatar.',
 'Each status glyph keeps one meaning (filled check done, dashed ring not started, clock pending, diamond-! needs remediation, square-✕ overdue), and the accent is never a status.',
 'rebuild the status map so each word has one tone everywhere: blue never a status; Not required, Not applicable and Planned grey; one neutral tone for In progress and In review',
 [d('controls'),d('ppsm'),d('policies'),d('campaign'),d('authorization')],
 ['V/style.md §1 "Pills, badges and tags": "The glyphs keep one meaning each"',v('policies/the-policies-page--01.png'),v('documents/documents-page--01.png')])
f('N03','high','empty values',
 ['WS-X90 › Analysis › Traceability','WS-X90 › Risk › Risks','Products › Suppliers','WS-X90 › Compliance › Policies','WS-X90 › Compliance › Requirements','WS-X90 › Risk › POA&M'],
 ['traceability','risks','suppliers','policies','requirements','poam'],
 'An empty value is a dashed ring plus a word (None, Not recorded, No owner, Unassigned, Not requested). Above the fold: Traceability 43 rings and 22 such words (four columns of every row read "None"), Risks 34 and 24, Suppliers 26 and 18, Policies 20 and 19, Requirements 13 and 13.',
 'An empty value is an em dash: Risk register Treatment plan, Policies Renew by, Access reviews Date completed. Only the owner column keeps a dashed person glyph for nobody.',
 'cut the ring and the word for empty values: print a subtle "—" and keep the dashed ring only as a "not started" status',
 [d('traceability'),d('risks'),d('policies'),d('requirements'),d('suppliers')],
 [v('risk/managing-risks-and-risk-registers--01.png'),v('policies/the-policies-page--01.png'),v('access/access-reviews--01.png')])
f('N04','high','duplication',
 ['WS-X90 › Compliance › Checks','WS-X90 › Compliance › Controls','WS-X90 › System › Inventory','WS-X90 › Compliance › Controls › SI-2','Risk preview over WS-X90 › Risk › Risks','WS-X90 › Risk › Risks'],
 ['checks','controls','inventory','control-si2','panel:risks','risks'],
 'One fact is drawn two to four times. Checks: overdue is a red pill, a red date, a red flag icon and a red failing count in the same row. Controls: the Status pill and a glyph in Next step say the same thing. Inventory: "no owner" is a banner, an Assign owners button, an Assign owner dropdown in each of 20 rows and the selection bar. SI-2: Partial and Not set each appear twice. The risk preview shows Start reassessment twice. Risks: every row carries the same two grey pills (Reassess by Dec 12, Not requested).',
 'Tests: overdue is one pill in the row and one line in the Needs attention card. Risk register: two score chips a row and nothing else toned. Documents is Vanta\'s own exception (Overdue glyph, red date and Expired pill).',
 'merge each fact into one mark (the pill or the date, never both) and drop columns whose value is the same in every row',
 [d('checks'),d('controls'),d('inventory'),d('control-si2'),d('panel-risks'),d('risks')],
 [v('tests/deactivated-tests--01.png'),v('risk/managing-risks-and-risk-registers--01.png'),v('documents/documents-page--01.png')])
f('N05','high','colour per row',
 ['WS-X90 › Risk › POA&M','WS-X90 › Compliance › Checks','Assessments › Expanded Control Set Assessment','WS-X90 › System › STIG checklists','WS-X90 › Compliance › Policies','WS-X90 › Compliance › Plans','WS-X90 › Monitor › Schedule','WS-X90 › Analysis › Inheritance'],
 ['poam','checks','campaign','stigs','policies','ssps','schedule','inheritance'],
 'Of 44 tables measured (first 8 rows), 16 colour three or more cells in a typical row; Checks and POA&M colour four of eight. A POA&M row: amber In progress (on 33 of 41 rows), red Planned date, red Remediate-by date, amber "plan +42d".',
 'One or two toned cells a row: Tests 1, Controls 1, Access reviews 1, Risk register 2, Policies 2. Documents (3) and Vendors (4) are the busiest seen.',
 'restyle tables to at most two toned cells a row: the status and one date or severity, the rest in ink',
 [d('poam'),d('checks'),d('campaign'),d('stigs'),d('policies')],
 [v('tests/deactivated-tests--01.png'),v('controls/controls-page--01.png'),v('risk/managing-risks-and-risk-registers--01.png'),v('vendors/adding-and-managing-vendors--01.png')])
f('N06','medium','colour meaning',
 ['WS-X90 › Risk › POA&M','WS-X90 › ITCSC','Plans › WS-X90 System Security Plan (editor)','Assessments › Expanded Control Set Assessment','WS-X90 › System › Ports & protocols','WS-X90 › Authorize › Authorization'],
 ['poam','itcsc','ssp','campaign','ppsm','authorization'],
 'Amber marks neutral states and provenance: In progress (POA&M, Schedule, Continuous monitoring), Draft (Authorization, the editors\' headers) and the EXAMPLE tag, which appears 190 times on 49 of 65 pages (34 on ITCSC, 22 in the SSP editor), often inside column headers.',
 'Amber is due soon or in review, always with its clock or triangle glyph; Draft and Not started are grey.',
 'restyle In progress and Draft neutral, and EXAMPLE as a grey outlined tag (it stays: the data is synthetic)',
 [d('poam'),d('itcsc'),d('ssp'),d('campaign'),d('ppsm')],
 [v('tests/deactivated-tests--01.png'),v('policies/the-policies-page--01.png'),v('access/access-reviews--01.png')])
f('N07','medium','colour meaning',
 ['WS-X90 › Compliance › Baseline','WS-X90 › System › Interconnections','WS-X90 › ITCSC'],
 ['baseline','interconnections','itcsc'],
 'Red and green mark neutral changes: Baseline shows added controls (+370) in green, removed (−17) in red, and each layer\'s Apply switch in green. Red also prints plain sentences ("3 interfaces since approval", "WS-X90\'s system record holds no rationale", "Block 2.1 is in SSP 3 since …") and the required asterisk.',
 'The newest screens draw switches and radios in ink; green means passing or complete, red overdue or failing.',
 'restyle changes, switches and plain sentences in ink; keep red for late and failed, green for satisfied and done',
 [d('baseline'),d('interconnections'),d('itcsc')],
 ['V/style.md §1 "Brand and accent": "The newest screens use ink … for primaries, tab underlines, switches and radios"',v('risk/managing-risks-and-risk-registers--01.png')])
f('N08','medium','gadget',
 ['Programs','Products › Components','WS-X90 › Risk › Threats','WS-X90 › Risk › POA&M','Products › Products','Products › Suppliers','WS-X90 › Compliance › Baseline','WS-X90 › Analysis › Cyber resiliency'],
 ['portfolio','components','threats','poam','products','suppliers','baseline','resiliency'],
 'Gadgets sit in rows and repeat: a ring in all 9 rows of Programs beside the %, 23 rings on Components, bars in rows on Threats (32), POA&M (14), Products (13) and Suppliers (12), a four-colour stacked bar on each of Baseline\'s 18 family cards and 14 on Cyber resiliency. Seven gadget families are drawn under about 25 module-specific class names.',
 'Bars live inside summary cards (two or three a page), one donut at most, 16px rings only in framework cells; registers with no completion measure carry no gadget at all (Risk register, Vendors, Documents, Policies).',
 'cut gadgets from rows where the number sits beside them, and keep one strip or chart a page',
 [d('portfolio'),d('baseline'),d('poam'),d('threats'),d('components')],
 [v('controls/controls-page--01.png'),v('frameworks/iso-27701--01.png'),v('risk/managing-risks-and-risk-registers--01.png')])
f('N09','medium','gadget',
 ['WS-X90 › Compliance › Controls'],['controls'],
 'Controls opens with an Assignment donut at 0% (560 of 560 unassigned: one grey ring) beside a card with three mini tiles. At 390px the donut fills the first screen and no control row shows.',
 'Vanta\'s Controls page has the same donut, but with data in two segments (6% assigned), beside one completion card.',
 'cut the donut while one segment holds everything; say "No owner 560" as a quick view or a Needs attention row',
 [d('controls'),m('controls')],[v('controls/controls-page--01.png')])
f('N10','medium','type',
 ['Plans › Contingency Plan (editor)','Policy editor','WS-X90 › Overview','Programs'],['plan-cp','policy-editor','overview','portfolio'],
 '31 font sizes and 53 size/weight pairs across the product pages; five body sizes between 12 and 14px (12, 12.5, 13, 13.5, 14) all in heavy use. A median 12 pairs above the fold; 23 on the Contingency plan editor, 20 on the policy editor, 16 on the Overview.',
 'About 7–8 pairs: 14 regular body, 14 medium names, 13 grey secondary and headers, 12–13 pills, 20–22 sections, 26–28 titles, 32–36 numbers.',
 'restyle to Ledger\'s scale: one body size, one secondary size, no half-pixel sizes',
 [d('plan-cp'),d('policy-editor'),d('overview')],['V/style.md §1 "Type"',v('controls/controls-page--01.png')],True)
f('N11','medium','duplication',
 ['WS-X90 › Overview','WS-X90 › Compliance › Controls'],['overview','controls'],
 'The program Overview repeats Controls\' "Controls satisfied" card with the same three mini tiles (Mapped 546, With evidence 313, Assessed 223), adds a six-colour strip with its legend, two labels beside the title (ATO with conditions, Lifecycle: Planned), a Team card and a Details card: 16 font pairs and 4 EXAMPLE tags above the fold.',
 'Home shows one card a framework (a % and one bar); a framework record shows one completion card with two mini tiles.',
 'cut the mini tiles and the Team card from the Overview, and keep the strip as its one chart',
 [d('overview'),d('controls')],[v('home/getting-started-with-workspaces--02.png'),v('frameworks/iso-27701--01.png')])
f('N12','medium','tabs',
 ['Products › Components › Mission Computer','Settings › Deadlines','Settings › Event log','Settings › Roles & permissions','WS-X90 › Compliance › Controls › SI-2','Library › Integrations › eMASS'],
 ['component-mc','deadlines','event-log','permissions','control-si2','integration-emass'],
 'Mission Computer shows 12 tabs in two stacked strips (the section\'s Products, Components, Suppliers above its own nine, each with a count); Deadlines 11, Event log 11, Roles & permissions 10, SI-2 and eMASS 8.',
 'A risk scenario has four tabs (Overview, Impacted assets, Approval history 0, Comments) and no second strip.',
 'merge to at most seven tabs (the pattern contract\'s own limit), never two strips, counts only where they mean work',
 [d('component-mc'),d('control-si2'),d('deadlines')],[v('risk/completing-risk-assessments--02.png')])
f('N13','medium','toolbar',
 ['WS-X90 › Compliance › Policies','WS-X90 › System › STIG checklists › Mission Computer · RHEL 9','WS-X90 › Risk › Risks'],
 ['policies','stigs-mission-computer-rhel9','risks'],
 'Policies: six quick views, seven filters, a checkbox and Sort, with Columns and Settings pushed to a second line; at 390px the first table row starts at 83% of the first screen. The STIG record stacks two rows of quick views (status, then CAT). Risks\' selection bar repeats the header\'s Export.',
 'Four quick views at most (Vendors) and filters as borderless triggers; Documents also wraps its filters, but no page stacks two rows of chips.',
 'cut to five quick views and four filters plus Add filter, on one line',
 [d('policies'),m('policies'),d('stigs-mission-computer-rhel9'),d('risks')],[v('vendors/adding-and-managing-vendors--01.png'),v('documents/documents-page--01.png')])
f('N14','medium','editor',
 ['Plans › WS-X90 System Security Plan (editor)','Plans › Contingency Plan (editor)'],['ssp','plan-cp'],
 'The SSP editor\'s Contents marks each of about 24 sections with a progress ring, a sync icon, sometimes a coloured dot, and an amber count chip beside a grey total; the top bar adds four coloured avatar rings, a blue comment count and an amber Draft pill; 22 EXAMPLE tags.',
 'Vanta\'s editor screens carry little colour (0.48% and 0.36% colourful pixels on the policy builder and the system description generator); their section lists were not studied closely here.',
 'cut per-section markers except where a section needs action, and make the counts grey',
 [d('ssp'),d('plan-cp')],[v('policies/using-ai-change-summaries-in-vanta--01.png'),v('documents/system-description-generator--03.png')],True)
f('N15','medium','buttons',
 ['WS-X90 › Compliance › Controls › SI-2','Risk preview over WS-X90 › Risk › Risks'],['control-si2','panel:risks'],
 'SI-2 shows two black buttons (Add evidence, Open assessment campaign) and a red-filled callout inside its Next step card. The risk preview\'s header holds Start reassessment and Request acceptance, and its Assessment card repeats Start reassessment.',
 'One ink primary a surface; secondaries outlined; a section\'s action is a small outlined button or "+".',
 'merge to one primary per surface and drop the copy inside the card',
 [d('control-si2'),d('panel-risks')],[v('risk/completing-risk-assessments--02.png'),'V/style.md §1 "Buttons"'])
f('N16','medium','defect',['My work'],['my-work'],
 'At 1440px the second Urgent item\'s title wraps one word a line in a narrow column ("Resolve / 16 / more / operational …") and its avatar overlaps the text.',
 'Each item is one line: icon, title, grey meta, avatars at the end.',
 'rebuild the row so the title takes the free width',[d('my-work')],[v('my-work/my-work-page--01.png')])
f('N17','low','colour meaning',['Programs','WS-X90 › Compliance › Checks','WS-X90 › Overview'],['portfolio','checks','overview'],
 'Initials avatars are blue text on a blue tint on 22 pages, so nearly every register row carries brand blue.',
 'Vanta also tints avatars with its accent (lavender); style.md §3(d) lists the lavender tints among what not to copy.',
 'restyle avatars neutral so blue stays for links and selection',[d('portfolio'),d('checks')],[v('my-work/my-work-page--01.png'),'V/style.md §3 (d) "What not to copy"'],True)
f('N18','low','tabs',['Products › Components › Mission Computer','Settings › Enclaves & markings'],['component-mc','enclaves'],
 'The section tab strip begins with the section\'s name in grey, so the first word reads twice ("Products" then the "Products" tab; "Settings" then "Deadlines …").',
 'Tabs begin with the first tab under the page title (Common controls, Controls).',
 'cut the label; the rail already names the section',[d('component-mc'),d('enclaves')],[v('controls/controls-page--01.png')])
f('N19','low','context',['All product pages'],['(65 routes)'],
 'Colour area is at Vanta\'s level: colourful pixels in the page area are a median 0.46% (middle half 0.26–0.76%) over 65 pages, hue families a median 3. Only Posture (12%, a one-hue heatmap), Enclaves & markings (2.75%, the DoD marking colours) and the campaign record (1.88%, its request tracker) go past Vanta\'s range, and all three colours carry meaning.',
 'Median 0.64% (middle half 0.46–1.04%) over 26 whole-page screenshots; hue families a median 2.',
 'keep the amount of colour; cut the number of separate marks (N03–N05) and give each tone one meaning (N02)',
 [d('posture'),d('enclaves'),d('campaign')],[v('controls/controls-page--01.png'),v('tests/deactivated-tests--01.png'),v('access/access-reviews--01.png')])
# ranking (measured composite; see report §1)
rows=json.load(open(N+'/raw/rows.json'))
CUT={
 'campaign':['the Team column (every row "Ready" in a blue pill)','Assessor and Determination as two pills: show one status a row','amber due dates unless overdue','EXAMPLE tag in the column header (restyle grey)'],
 'overview':['the three mini tiles (they repeat Controls)','the Lifecycle label beside the ATO pill: one status in the title','the description sentence','the Team card (People owns it)'],
 'controls':['the Assignment donut at 0%','the three mini tiles','the glyphs in Next step (the pill says it)','blue for Not assessed'],
 'policies':['the banner (a quick view says it)','Control status as a pill: use glyph and ink word','dashed rings for Not recorded and 0 of 23: use "—"','filters beyond four, and the second toolbar line'],
 'checks':['the flag icon and the red failing count beside the Overdue pill','the eye icon in every row','red counts in the category rail stay; EXAMPLE tags in rows go grey'],
 'portfolio':['the ring in every row (the % is beside it)','the second line under Next gate','flag icons on late dates'],
 'baseline':['the four-colour stack on each of 18 family cards','green/red for added/removed counts','green Apply switches (ink)','the banner (one line in the header)'],
 'ppsm':['blue pills for Not required and Not applicable (grey or "—")','EXAMPLE tags in two column headers (grey)'],
 'stigs-mission-computer-rhel9':['one of the two quick-view rows (CAT as a filter)','the Open pill in a list already filtered to Open','the blue banner (a line in the header)'],
 'ssp':['the ring and sync icon on every section','amber count chips (grey)','coloured rings around collaborator avatars','22 EXAMPLE tags (grey)'],
}
ranking=[dict(rank=i+1,route=r['route'],label=r['label'],type=r['type'],score=r['score'],cues_above=r['cues'],cue_kinds=r['kinds'],coloured_marks=r['marks'],colourful_pixels_pct=r['pix'],font_pairs=r['fonts'],cut=CUT.get(r['route'],[]),shot=r['shot']) for i,r in enumerate(rows[:10])]
out=dict(findings=F,ranking_top10=ranking,
 budget=dict(register='at most 2 summary cards (completion + Needs attention), only when the register has a completion measure; bars only inside them; no per-row gadgets; at most 2 toned cells a row; empty = "—"; no banner; at most 5 quick views and 4 filters on one line; 1 primary + at most 1 secondary + ⋯',
  record='title + at most 1 status pill + at most 6 facts as labels over values; at most 1 card above the tabs; no tinted callouts; at most 7 tabs in one strip; 1 primary; each fact once',
  overview='one band of at most 4 numbers or 2 cards, plus one chart; colour only inside that chart; no card repeated from another page',
  home='one card a program (%, green bar, N of M); at most 1 grey callout; no pills',
  inbox='rows only: icon, title, grey meta, avatar; one state word; ticket keys grey; no tags',
  editor='colour only for the save state, open comments and sections that need action; at most 8 font pairs; 1 primary',
  settings='lists and rules; On/Off the only pills; at most 7 tabs; no charts',
  panel='1 pill in the header, 1 primary, at most 4 tabs, at most 3 cards, no action repeated',
  everywhere='8 font size/weight pairs; one tone per status word; blue only for links and selection; tinted fills only inside pills'),
 notes='Counts in metrics.json; screenshots under raw/shots (d- = 1440x900, m- = 390x844). Vanta images stay on this machine.')
json.dump(out,open(N+'/findings.json','w'),indent=1,ensure_ascii=False)
print(len(F),'findings;', 'top10', [r['route'] for r in ranking])
