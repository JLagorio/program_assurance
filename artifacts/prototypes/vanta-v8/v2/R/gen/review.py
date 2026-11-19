import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = []
def f(i, st, v1, v2, ev): F.append({"id": i, "status": st, "v1": v1, "v2": v2, "evidence": ev})
J = "R/flows2/out-"  # job logs on v2 (walker that sees v2's #v2-toast)
# ───────── Flows B1–B17 ─────────
f("B1","partly","52 of 74 dialogs change nothing (27 toast a success, 25 close silently); 10 change state; no control can reach satisfied",
  "Same 74 openers: 13 change state, 49 close with 'Not saved: … isn't wired', 1 toasts a success with no change (program-start Invite by email), 0 close silently. The chain walks end to end by visible words from SA-24's preview: Map a requirement → Link evidence → Add to assessment campaign → Set Ready → Record determination → Publish (Other than satisfied, issue opened) → Create POA&M item → Create risk → Request acceptance → steps 1–2; Controls, Findings (45), POA&M (42), Risks (41), Overview follow. But the same verbs from the registers' own headers still change nothing: POA&M Create POA&M item, Risks Create risk, Schedule Create task, Requirements Create/Import, the campaign card's Plan an assessment, risks bar Request acceptance, campaign request Accept, SI-2 Add evidence, Traceability Link evidence, People Assign a role; preview verbs Accept evidence (Review queue), Generate (Reports), Create configuration (Products) still toast a success and change nothing",
  "R/flows/msr-v2.json and msr-v1.json (adapted modalsweep2, same 74 openers); R/flows2/out-chain.txt; R/flows/psr-v2.json")
f("B2","partly","11 of 11 My work rows land on their register unfiltered (Treat 2 critical risks → Risks All 40)",
  "10 of 11 land on exactly what they count or with the record open (CVE → Vulnerabilities with its issue preview; Resolve 17 → Past due 17; Remediate 3 → Due soon 3; Close out → Ready 88; Give an owner → No owner 40; Revise 54 → Needs revision 54; 88 wait → Pending review 88; quarterly audit → Task preview; offered finding → Offer preview). 'Treat 2 critical risks' still lands on Risks Register 40 / All 40 with no filter and no preview. Home's Open offer opens the offer",
  J+"j2b.txt, R/flows2/out-checks.txt (i.resolve17, i.treat2, b.home.openoffer)")
f("B3","fixed","↗ does nothing on 46 of 54 previews (review); 51 of 54 in R's adapted re-run on v1, 3 open a page",
  "↗ opens a page on 51 of 51 previews that carry it (52 of 54 opened; Offer and Deadline previews no longer open from the review's openers); the pages are drawn (Risk, POA&M item, Operational issue, Control AC-1, Asset)",
  "R/flows/psr-v2.json vs psr-v1.json; R/probe/shape-v2.json page:rec--*")
f("B4","fixed","SA-24's Map a requirement, header Map a requirement and Add a note do nothing; only SI-2 has a page; SI-2's Open assessment campaign opens the list",
  "SA-24 moves No requirement → No evidence → Not assessed → (campaign) → Other than satisfied through real dialogs from its preview; header Map a requirement opens a dialog asking which control; Add a note gone; every control has a page; SI-2's Open assessment campaign opens campaign-conmon",
  "R/flows2/out-chain.txt, "+J+"j3b.txt, R/flows2/out-checks.txt c.si2.campaign")
f("B5","fixed","SSP submit and Victor's reassignment reach no other screen",
  "After SSP 3 is submitted: My work moves it to Waiting on others ('SSP 3 waits on Joel Barrantes'), Review queue 148 → 149 lists 'SSP to approve', rail Review 149, Authorization row 'In review … Waits on Joel Barrantes'. After Reassign all: the access review names Nadia Fournier; People: Victor 'No open tasks'",
  "R/flows2/out-checks.txt h.queue/h.mywork; R/probe focus3 rail.afterSubmit; "+J+"j7f.txt, j8c.txt")
f("B6","fixed","New program keeps WS-X90's switcher, badges and links; gone once you leave (Programs All 9)",
  "Switcher names PRG-2301; starter guide opens its own empty Requirements, Sources, SSP revision 1 and Assessments; Programs All 10; Home lists it",
  J+"j1c.txt")
f("B7","fixed","Nine pairs of numbers disagree (menu Evidence 142 vs All 368; Requests 368 vs All 14; Checks 7 vs All 5; Open CVEs 1 vs 4; 4 campaigns·2 active vs Active 3; SI-2 Findings None vs 1; Acceptance Not requested vs Request sent; Version 2 ready vs 1 of 3; queue 96 vs Pending review 88)",
  "All nine agree or the repeating line is gone: menu Evidence 368 = All 368; tracker 368 = All 368; Checks All 7; Vulnerabilities 4; facts lines cut; SI-2 Findings 1 only; Acceptance '—' with 'Not requested yet'; 'items ready to submit 1 of 3'; the queue is one workspace-wide list (All 148). Counts follow the chain (Findings 45, POA&M 42, Risks 41, Short of satisfied 48). Left over (also in v1): Overview 'Your tasks 6' vs My work › Assigned to me 2 items",
  "R/flows/facts.json vs gap/flows/facts.json; R/flows2/out-chain.txt")
f("B8","fixed","10 (A2: 11) registers arrive with 2–3 rows ticked and the selection bar live",
  "0 of 11 registers arrive ticked (Controls, Evidence, Findings, Risks, POA&M, Checks, People, Review, Inventory, Schedule, campaign); the bar appears only after a choice",
  "R/probe/shape-v2.json preticked")
f("B9","partly","~17 header actions open nothing (Findings Create/Import, Controls Map/Export, Checks Run all/Create, Inventory Import/Add, Frameworks Import/Create, Data calls, Suppliers Import SBOM, Overview ⋯, Package room Edit, 7 Exports)",
  "Every one named now opens something: Map a requirement and Add asset are wired, Run all now runs, Review conflicts opens its quick view, Overview ⋯ cut, Edit → Open version 2; Create operational issue, Import scan, Import OSCAL, Create overlay, Import SBOM, Create check, the Exports open dialogs that end 'Not saved'/'does not import'. The registers' own primaries Create POA&M item and Create risk also end 'Not saved'",
  "R/flows/sweep2r-v2.partial.json (13 routes), R/flows/msr-v2.json, "+J+"j3b.txt")
f("B10","partly","22 dialogs close with Required fields empty; Upload › Add evidence with no file toasts 'Added, pending review'",
  "Required fields hold the primary and name the field (e.g. 'Title is required.', 'Why accept it is required.'); but Evidence › Add evidence › Upload › Add evidence with no file still closes with 'Added, pending review' (All stays 368), and the same rule now wrongly blocks Accept in Review evidence (see new)",
  J+"j4b.txt; R/flows/msr-v2.json trails")
f("B11","fixed","SSP fixes open the editor at the top; SI-2's campaign link opens the list; Home's Open offer opens Components",
  "Draft a rationale opens the editor with Categorization rationale focused and in view; SI-2 → campaign-conmon; Home's Open offer → Mission Computer › Findings with the offer's preview",
  J+"j7c.txt; R/flows2/out-checks.txt b/c")
f("B12","fixed","Issue and POA&M previews don't show the risk; the issue offers Create POA&M item though it has one",
  "Issue preview lists POA&M item 1 and Risk 1 ('Risk arising from REQ-100') and offers Open POA&M item; the POA&M item preview names its issue and risk",
  J+"j5b.txt; R/flows/psr-v2.json POA&M item preview")
f("B13","fixed","No Add person; Assign a role closes silently; onboarding rows can't be opened or completed",
  "People has Add person (Name checked before it closes); it adds the person and opens their onboarding with 9 tasks; a task row opens its preview and Mark complete moves 4 → 5 of 9. Assign a role still ends 'Not saved'",
  "R/flows2/out-checks.txt f.*")
f("B14","fixed","Keep/Revoke don't move '11 of 18 decided' (only 5 accounts listed); Complete review does nothing",
  "Show all lists all 18 accounts; deciding an undecided one moves 11 → 12 of 18; Complete review names what is owed ('2 accounts without an owner · 7 not decided · 1 revoked account without a note or task')",
  "R/probe acc2.mjs output; R/flows2/out-checks.txt e.complete")
f("B15","fixed","Wizard says categorization is in step 2 and the baseline 'Chosen in step 3' (stepper: Systems 3, Baseline 4)",
  "Baseline and Team steps say 'step 3, Systems'; no step 2 / 'Chosen in step 3' reference remains",
  "R/flows2/out-checks.txt g.*")
f("B16","fixed","Home has no Create program","Home header: View my work · Create program","R/flows2/out-checks.txt b.home.header")
f("B17","partly","Control 'Open assessment findings' and 'Add a note…', Asset 'Edit asset', Inheritance 'Ask Priya Raghavan', Risk 'More', Gate 'Add security outcomes' (toast) do nothing",
  "Fixed: the control's two actions and the risk's More are gone. Still dead: Asset preview Edit asset, Inheritance source preview Ask Priya Raghavan; Lifecycle gate Add security outcomes still toasts 'The security outcome picker opens here'",
  "R/flows/psr-v2.json")
# ───────── Distance A1–A22 ─────────
f("A1","fixed","Nine blocks on the Overview (two title pills, description, facts row, completion card with mini tiles, Open work, lanes, SSP and setup cards, Team/Details/activity rail); page 1,514px",
  "One completion card (31%, 176 of 560, the status strip with its legend), Open work, one row of links (plans, assessments, setup) and a Details rail with the Team; one status beside the title; no description, Lifecycle label, mini tiles, lanes or activity; page 844px. The card's bar is the six-status strip N11 kept, not 'one green bar'",
  "R/probe/shape-v2.json overview; R/flows/facts.json overview")
f("A2","fixed","11 registers open with 2–3 rows ticked","0 of 11","R/probe/shape-v2.json preticked")
f("A3","partly","Facts line under the title on 19 pages (16 with numbers); Findings' 44 six times above the table, POA&M 41 three times, Risks 40 three times",
  "No product page has a facts line (0 of 50 nav pages). Counts still repeat above the table: Findings 44 five times (tab, two cards, big figure, All 44), POA&M 41 on Items tab and All, Risks 40 on Register tab, All and No owner",
  "R/distance/facts-v2.txt, columns-v2.txt (text above each table)")
f("A4","fixed","Amber/red filled banners on about 20 pages; Home stacks two","Tinted banners only in the two editors (SSP 3, policy editor 1); 11 pages carry one grey callout whose glyph has the tone; Home one","R/noise/raw-v2/metrics-desktop.json banner counts")
f("A5","partly","7–8 of 14 tables clipped at 1440 (Requirements 120px, Checks 56, POA&M 54, Inventory 54, Risks 45, Policies 42, Evidence 24, campaign 12); columns constant in every row",
  "0 of 14 clipped. Constant columns left: Risks Assessment 'Reassess by Dec 12', Acceptance '—', Owner '—' (25 rows); Policies Acknowledged '0 of 23'; Requirements and Controls Owner 'Unassigned'; Inventory Owner 'Assign owner' and Scope 'In SYS-WSX90'. Evidence's constant columns are cut only while the rows on screen agree (see new)",
  "R/distance/columns-v2.txt vs columns-v1.txt")
f("A6","fixed","Two cards (Where it stands, Next step) between facts and tabs; two ink primaries; red CVE callout","No card before the tabs; one ink primary (Add evidence); 7 tabs; the red callout gone","R/probe/shape-v2.json si2")
f("A7","fixed","Settings opens on Deadlines drawn as a register: seven-page strip, subtitle, two summary cards, five counted tabs, Proposed pills",
  "Left list of sections (Workspace, My account); no summary cards; On/Off the only pills; the category tabs carry no counts","R/probe/shape-v2.json settings")
f("A8","fixed","Rail current item blue on light blue; switcher blue-bordered","Rail current item ink on grey like the menu; switcher neutral","R/probe/shape-v2.json shell")
f("A9","fixed","Program menu 25 items with icons, 1,420px tall, five groups open","11 items visible, no icons, 887px, groups folded but the current one","R/probe/shape-v2.json shell")
f("A10","fixed","304px of navigation (on purpose); win the width back through A5 and A9","Navs kept by choice; width won back: no table clipped at 1440 (A5), menu 887px (A9)","as A5, A9")
f("A11","fixed","Seven framed tables stacked, first with two rows ticked; 2,331px","One table with a Kind column and filter, nothing ticked; 1,327px","R/probe/shape-v2.json queue")
f("A12","fixed","Second Urgent row squeezed into a 79px column, 140px tall at 1440","367px wide, one line (20px)","R/probe/shape-v2.json mywork")
f("A13","fixed","Each row a bordered box with Jira status chip, severity, red '8d late'","Rows unboxed (0 bordered), no chips, no red text; key and dates as grey meta","R/probe/last-v2.json mywork")
f("A14","fixed","Subtitle, quick views, Next gate two red/amber lines with flags, '+2 controls' / '1 behind' pills, rings","No subtitle, 0 rings, 0 pills in rows","R/probe/last-v2.json portfolio; noise metrics portfolio")
f("A15","fixed","Assessment mode keeps the full program menu; tracker 368 vs All 14","Menu in mode: ‹ WS-X90, Requests 368, Findings 245, Controls, All assessments; tracker 368 = All 368","R/probe/shape-v2.json campaign")
f("A16","partly","~110 pills and per-table sync bars in the SSP editor","Pills 110 → 6, rings 58 → 5 (one-line table bars per L2, not re-measured); per-section guidance not borrowed","R/probe/shape-v2.json ssp")
f("A17","fixed","Third column 'What you're creating'","Gone from the start and review steps","R/probe/last-v2.json wizard")
f("A18","fixed","Panel action an ink primary; control preview summarises counts; risk preview Start reassessment twice","Panel action a secondary (white); control preview lists Requirements, Evidence, Findings, risks each with + add; Start reassessment once","R/probe/shape-v2.json panel; last-v2.json riskPreview")
f("A19","not fixed","Launcher answers 'which controls lack evidence?' with No results","Same: 'No results for “which controls lack evidence?”'","R/probe/shape-v2.json launcher")
f("A20","fixed","Suppliers stacks area tabs, page tabs, chips, filters","Area strip then the title; page tabs gone; one quick-view row","R/distance/columns-v2.txt suppliers")
f("A21","fixed","Every connector card carries IN THE APP (7)","0","R/probe/shape-v2.json integrations")
f("A22","fixed","↗ does nothing on Risks, Findings, Controls (AC-1), POA&M","Each opens a drawn record page (rec--a-risk-risk…, rec--a-risk-issue…, rec--a-tests-control--AC-1, rec--a-risk-poam…)","R/flows/psr-v2.json; R/probe/shape-v2.json")
# ───────── Noise N01–N19 ─────────
f("N01","partly","24 of 65 product pages open with a tinted banner (27 incl. records); Home two",
  "13 pages carry a banner (11 of them above the fold): 11 a single grey callout, none on a register; the SSP editor (3) and policy editor (1) keep tinted ones","R/noise/raw-v2/metrics-desktop.json")
f("N02","fixed","Blue pill carries 14 words; 6 words change tone between pages","Blue pill carries 0 words; 0 words in more than one tone (Not assessed, In progress, In review, Draft, Planned all grey)","R/noise/tones-v2.json vs tones-v1.json")
f("N03","partly","Above the fold 258 dashed rings, 190 empty words (Traceability 43/22, Risks 34/24, Suppliers 26/18, Policies 20/19, Requirements 13/13)",
  "141 rings, 50 words (Traceability 1/1, Risks 11/0, Suppliers 10/0, Policies 11/8, Requirements 0/11 'Unassigned', Controls 3/10)","R/noise/empties-v2.json vs empties-v1.json")
f("N04","partly","One fact drawn 2–4 times (Checks overdue ×4; Controls status + glyph; Inventory no owner ×4; SI-2 Partial/Not set twice; risk preview Start reassessment twice; Risks two constant pills)",
  "Checks overdue once (toned cells 4 → 1 a row); Controls Next step without glyph; SI-2 Partial once, Not set gone; Start reassessment once; Inventory banner gone but 'Assign owners' plus 'Assign owner' in all 20 rows; Risks 'Reassess by Dec 12' still in all 25 rows","R/noise/rowtone-v2.json; R/probe/last-v2.json; R/distance/columns-v2.txt")
f("N05","fixed","16 of 44 tables colour ≥3 cells in a typical row; 29 in some row","0 of 41 in a typical row; 2 in some row (Frameworks max 3, STIG checklists max 4)","R/noise/rowtone-v2.json")
f("N06","fixed","Amber for In progress, Draft and 190 amber EXAMPLE tags on 49 pages","In progress and Draft grey; EXAMPLE a grey outlined tag (179 on 49 pages, kept by design)","R/noise/tones-v2.json; R/probe/shape-v2.json example")
f("N07","partly","Baseline +370 green, −17 red; red plain sentences on Interconnections/ITCSC; red asterisk","Baseline changes in ink; red asterisk gone; ITCSC still prints sentences in red ('3 interfaces since approval', 'WS-X90's system record holds no rationale', 'Block 2.1 is in SSP 3 since …')","R/probe/shape-v2.json baseline; R/noise/tones-v2.json")
f("N08","partly","161 gadgets; rings in all 9 Programs rows, 23 on Components; bars in rows on Threats 32, POA&M 14, Products 13, Suppliers 12; 18 stacked bars on Baseline, 14 on Cyber resiliency",
  "83 gadgets; Programs 0, Threats 0, Products bars 0, Baseline 1, Cyber resiliency 0; still in rows: Components 23 rings, POA&M 14 bars, Suppliers 12 bars","R/noise/raw-v2/metrics-desktop.json")
f("N09","fixed","0% Assignment donut on Controls; at 390 no row on the first screen (first row at 174%)","Donut gone; at 390 the first row starts at 68% of the first screen","R/noise/raw-v2 metrics (desktop, phone)")
f("N10","partly","31 font sizes, 53 size/weight pairs; median 12 pairs above the fold (Contingency plan 23, policy editor 20, Overview 16)",
  "16 sizes, 22 pairs; median 7 (budget 8); still over: Contingency plan 12, Checks 9, Overview 9; half-pixel sizes left (12.5px on 400 elements, 10.4, 11.2, 8.8)","R/noise/an-v2/analyse.txt")
f("N11","fixed","Overview repeats Controls' card with three mini tiles, a six-colour strip, two labels, Team and Details cards","Mini tiles, Lifecycle label and Team card cut; the strip kept as the one chart; Team in the Details rail","R/probe/shape-v2.json overview")
f("N12","fixed","Mission Computer 12 tabs in two strips; Deadlines 11, Event log 11, Roles & permissions 10, SI-2 and eMASS 8 (area strips included)",
  "One strip each: Mission Computer 7 (6 + More), SI-2 7, Deadlines 5 without counts, Event log 5, Roles & permissions 4, eMASS 4","R/probe/shape-v2.json tabs")
f("N13","partly","Policies 6 quick views + 7 filters on two lines; STIG record two quick-view rows; Risks' selection bar repeats Export",
  "Policies 5 quick views + 4 filters + Add filter; STIG record one row (CAT is a filter); Risks' selection bar still repeats the header's Export","R/probe/shape-v2.json policiesToolbar; stig.mjs output")
f("N14","fixed","SSP editor: ring, sync icon, dot and amber chip per section; coloured avatars, blue count, amber Draft; 22 EXAMPLE",
  "Rings 58 → 5, pills 110 → 6; counts grey; 22 EXAMPLE tags (grey) remain","R/probe/shape-v2.json ssp")
f("N15","fixed","SI-2 two black buttons and a red callout in Next step; risk preview Start reassessment twice","SI-2 one ink primary, no red callout; Start reassessment once","R/probe/shape-v2.json si2; last-v2.json")
f("N16","fixed","Second Urgent title wraps one word a line (79px)","367px, one line","R/probe/shape-v2.json mywork")
f("N17","fixed","Blue initials avatars on 22 pages","Avatars ink on grey (pill words: no blue; V reports 1,142 → 0)","R/noise/tones-v2.json; R/probe/shape-v2.json shell")
f("N18","fixed","Section tab strip starts with the section's name ('Products' then 'Products' tab)","Suppliers strip 'Products | Components | Suppliers' then the title; no grey label","R/distance/columns-v2.txt suppliers")
f("N19","fixed","Colourful pixels median 0.46% (Vanta 0.64%)","Median 0.26%; hue families median 3 → 3; colour stays inside meaning","R/noise/pooled-rows.json")
new = [
 {"where":"Evidence › a pending artifact › Accept → Review evidence","what":"Accepting evidence is blocked: with Accept chosen, Save review refuses with 'What to reviseto send back is required.' The dialog guard turned the send-back-only field into a required one (and garbled its label). v1 closed with 'Review saved'. Evidence can no longer be accepted from the Evidence register.","severity":"high","how to see it":"#evidence → Time source comparison test report → Accept → Save review"},
 {"where":"Registers vs previews (POA&M, Risks, Schedule, Requirements, Assessments card, campaign request, SI-2, Traceability, People)","what":"One verb, two outcomes: the chain works from previews, but the same verb on the register's own header or bar ends 'Not saved: … isn't wired' (49 of the 74 dialogs end so). Assessments has two 'Plan an assessment' buttons: the header's plans a campaign (Active 3 → 4), the card's says Not saved.","severity":"medium","how to see it":"#poam → Create POA&M item → fill Title → Not saved; #assessments → the campaign card's Plan an assessment"},
 {"where":"Evidence register (All 368); Requirements","what":"Columns come and go with the rows on screen: the constant-column rule hides Status, Latest version and Renew by on All 368 (the six rows shown happen to agree) and shows them on Needs revision; Requirements loses State. A reader of the whole register sees no evidence status.","severity":"medium","how to see it":"#evidence: headers Evidence | Kind | Owner; press Needs revision 54: Status, Latest version, Renew by return"},
 {"where":"program-start › Invite by email","what":"New toast-only success: closes with 'Invitation sent to …' and nothing changes (v1 held the dialog). Preview verbs that only toast a success remain from v1: Review queue Accept evidence, Reports Generate, Products Create configuration, gate Add security outcomes.","severity":"low","how to see it":"#program-start → Invite people → fill → Send"},
]
out = {"reviewer":"R","state":"final","judged":{"v2":"SP/vanta/v2/R/v2-snap.html = out/prototype.html md5 3677abb9… (built 21:11). At 21:26 prototype.html was rebuilt (md5 a927b98e…): only mod-zz-compare*.js (the Before & after page) changed, so product screens are as judged.","v1":"SP/vanta/v2/R/v1-snap.html = out/prototype-v1.html; its tones, row-tone and empties outputs are byte-identical to the review's"},
       "method":"The review's scripts copied into R/ and pointed at the snapshots. Adapted only where v2 changed the instrument: v2's messages go to #v2-toast (the originals read .ak-toast), v2 keeps state in sessionStorage (cleared per item), openers whose words changed found by data-modal or words, selection-bar verbs after ticking one row, Required fields filled before judging. Same adapted sweeps re-run on v1 for a like-for-like before/after.",
       "counts":{"fixed":sum(1 for x in F if x["status"]=="fixed"),"partly":sum(1 for x in F if x["status"]=="partly"),"not fixed":sum(1 for x in F if x["status"]=="not fixed"),"regressed":sum(1 for x in F if x["status"]=="regressed")},
       "findings":F,"new":new}
json.dump(out, open(os.path.join(R,"review.json"),"w"), indent=1, ensure_ascii=False)
print(out["counts"], len(F))
