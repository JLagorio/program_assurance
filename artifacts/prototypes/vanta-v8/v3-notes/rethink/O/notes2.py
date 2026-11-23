import json, sys
n=json.load(open('notes.json'))
walk_line, off_line = sys.argv[1], sys.argv[2]
n['files']=["vanta/proto/mod-zzzz-v3-8o-overview.js", "vanta/proto/mod-zzzz-v3-8o-overview.css", "vanta/proto/out/v3r2-O.html (the whole build)", "vanta/v3r/O/walk.mjs", "vanta/v3r/O/shots.mjs", "vanta/v3r/O/asks.json"]
n['pass2']={
 "1 navigation (one sidebar)": "Nothing of lane O read #rail. Every page of the lane marks Overview in the sidebar, the gate's page included (walked at 1440 and 390).",
 "2 no vertical tabs": "Lane O drew no rail. Its tabs are the kit's horizontal K.tabs (Overview · Team · Activity); Activity's kinds are chips; the walk asserts no side rail on any of its pages.",
 "3 row to page, eye to preview": "A step's row opens gate--<id>; the eye opens the gate's preview, which has Open gate. The next gate's name on the Overview and Details' Next gate are links to the page (they opened the preview). Old gate addresses (lifecycle-<step>, rec--a-work-gate--…, sse, lifecycle-outcomes) open the gate's page instead of the Overview with a panel. The return bar from a gate's page or preview comes back to the gate's page; the panel-reopening state (ov.reopen) is gone. a-people-person on Team and the event previews on Activity stay as they are (v2 kinds with no page).",
 "the gate's page": "Header: what the gate is (sub), More (Export the gate), and the decision as the one primary: Record decision for the holder of the deciding role; for anyone else Request decision, and Record as <holder> (the prototype acting as that person, said in the form). Body: the one next step; Deliverables as a table whose not-ready rows go to exactly the records that hold them back, with the return bar; Criteria as a table with Add criterion (a picker of the NIST SP 800-160 outcomes the gate does not hold, Write a criterion as its first line), Assess and Remove in the row, and what meets each; Actions once decided with actions. Side: Details, and a Decision card (decides, reviews first, requested, recorded by).",
 "numbers": "Checked on the whole build: Operational issues 43 → findings-issues, chip Open, 43 rows (count from fact findingCounts.bySource.issue); Risks without an owner 40 → risks chip No owner, 40 rows; Evidence waiting on review 88 → evidence chip, 1–50 of 88; Your tasks 4 → My work, Assigned to me 4; Requirements 14 → Controls chip No requirement, 14 rows; Connections 4 → system-connections, Without an agreement, 4 rows; Boundary → system-boundary--blk where the SCA review is; Details' baseline (name and count from fact baseline.total) → Controls, All 560; System → system on its default view.",
 "exports": "Export the lifecycle, Export the gate, Export the team and Export the activity are CSV files made by K.save; v2's export dialog is no longer used."
}
n['pages']=[
 {"route":"overview","what":"The program's record: lifecycle in place (increment, phase strip, the open phase's steps), next gate's checklist, one completion card, one needs-attention card, Details and Team."},
 {"route":"overview-team","what":"Roles in RMF's order with who holds each, then the people; Assign a role and Add a person in place; a person opens their panel."},
 {"route":"overview-activity","what":"The program's activity, newest first, with chips by kind; a row opens its event."},
 {"route":"gate--<id> (gate--pdr-2)","what":"A gate's page: the decision as the header's primary, what holds it back as rows to their records, criteria as a table with Add, a Decision card."},
 {"route":"preview k3o-gate (the eye on a step's row)","what":"The gate in short: facts, deliverables with their buttons, criteria with Assess, Open gate."},
 {"route":"k3o-noreq","what":"Stand-in only where lane C is not in the build; unused in the whole build."}]
for f in n['folded']:
    if f['old'].startswith('lifecycle-<step>'):
        f.update({"now":"gate--<id>","how":"page","kept":"Deliverables read from their records, criteria, who decides, request, decision, tracked actions, Add security outcomes (now Add criterion's picker).","dropped":"The gate's own activity list; lane G's step-by-step chain (ISSM, SCA, AO each recorded apart): the page records the decider's decision. The review-package preview opens from its row only."})
    if f['old'].startswith('lifecycle-outcomes'):
        f.update({"now":"gate--<next gate>","how":"page","kept":"A gate's security outcomes as its criteria table, one status per increment, assessed in the row (lane G's store); outcomes the gate does not hold are added from Add criterion.","dropped":"Security engineering's processes and CSA views, and the list of all 24 outcomes in one table."})
    if f['old'].startswith('lifecycle-iatt'):
        f['old']="lifecycle-iatt-N, lifecycle-ato-N, gate--iatt-N, gate--ato-N"
n['inplace']=[
 {"on":"overview","can":"open a phase's steps, switch increment","how":"strip and select, state in K ov.view","shows":["address unchanged","survives redraw, Back and reload"]},
 {"on":"next gate checklist (overview), a gate's page and preview","can":"open exactly the records that hold a deliverable back, with the return bar","how":"K.task.start + the list's own view (S: sys.cview {f:'noagr'}; C: ctl.view {chip:'noreq'})","shows":["the records' pages keep the bar","Back to PDR returns to the Overview, or to the gate's page when it started there"]},
 {"on":"gate--<id>","can":"request the decision","how":"header primary for anyone but the holder; form","shows":["step reads In review","Decision card says who it waits on"]},
 {"on":"gate--<id>","can":"record the decision: Pass, Pass with actions, Not passed, with a rationale","how":"header primary: Record decision for the holder; Record as <holder> for anyone else, the form saying the prototype acts as that person","shows":["refused naming the deliverables not ready, then the criteria not met","the page reads decided with its actions","the toast links to the next gate's page","step status, strip count and next gate card on the Overview","line under the program switcher","Activity","lane G's facts gate, conditions"]},
 {"on":"gate--<id>, Criteria","can":"add a criterion: choose NIST SP 800-160 outcomes the gate does not hold (PDR, CDR), or write one","how":"K.pick with Write a criterion as its first line; K.form on the other gates","shows":["the criteria table and its n of m met","Pass waits on it","lane G's gate criteria (an outcome)"]},
 {"on":"gate--<id>, Criteria","can":"assess a criterion (Met, Partly met, Not met, what meets it); remove one added here","how":"row buttons; form; confirm","shows":["the row's status and What meets it","every gate that carries the outcome","fact outcome"]},
 {"on":"overview-team","can":"assign or reassign a role","how":"form","shows":["Team tab row","Overview's Team","the gate's Decision card and whose the header primary is","fact people"]},
 {"on":"overview-team","can":"add a person, with an optional role","how":"form","shows":["People rows","the Team tab's count","the pickers of Assign a role and of a decision's action owner"]},
 {"on":"overview, gate--<id>, overview-team, overview-activity","can":"export (lifecycle, gate, team, activity) as CSV","how":"More menu, K.save","shows":["a saved file, or the copy dialog where the view cannot save"]}]
n['walks']=[
 {"id":"O-w1","title":"From the Overview to what holds PDR back","steps":[
  {"route":"overview","do":"Open WS-X90. Read the Lifecycle section and the card under it.","see":"TMRR is open with its five steps listed. Next gate: PDR, due in 7 days, 2 of 5 deliverables ready, three rows with a number each.","was":"A strip that linked to a Lifecycle page, which drew the same strip again above a table."},
  {"route":"overview","do":"Choose EMD on the strip, then Increment 1 in the select, then Increment 2 again.","see":"Each phase's steps list under the strip and the address stays #overview. Increment 1 shows its decisions, fielded under the Sep 18, 2026 ATO.","was":"A separate Lifecycle page with increment pills and a Steps tab."},
  {"route":"overview","do":"On the checklist, press Open 4 connections.","see":"System's Connections tab on Without an agreement, 4 rows, and a bar at the bottom: Back to PDR · 4 connections without a current agreement.","was":"Interconnections opened with no way back but the browser's Back."},
  {"route":"system-connections","do":"Press Back to PDR.","see":"The Overview, with the checklist exactly as you left it.","was":"Browser Back, twice."},
  {"route":"overview","do":"Press Open the boundary. Request the SCA's review, then Record the review as Accepted. Press Back to PDR.","see":"Boundary reads ready with no button. The card, the PDR row and the line under the program switcher all say 3 of 5.","was":"Overview said 2 deliverables not ready, the menu 3 of 5 then 2 of 5, the gate showed three not ready."},
  {"route":"overview","do":"Press Open 14 controls. Click the first control.","see":"Controls on No requirement, 14 rows; the control's own page opens with Add requirement as its primary, the return bar still at the bottom.","was":"A full-window spreadsheet whose exit led to Controls, a third page."}]},
 {"id":"O-w2","title":"A gate is a page; its decider decides","steps":[
  {"route":"overview","do":"In the TMRR steps, hover PDR and press the eye; then close it and click the row.","see":"The eye opens the gate's preview over the Overview. The row opens PDR's own page: deliverables and criteria as tables, a Decision card at the side.","was":"A gate page reached from a separate Lifecycle page, with Record decision offered to whoever was signed in."},
  {"route":"gate--pdr-2","do":"Press Record as Marcus Ryde in the header. Choose Pass, write a rationale, press Record decision.","see":"The form says the prototype is acting as Marcus Ryde, and refuses: PDR cannot pass while Requirements, Connections and Boundary are not ready.","was":"Approve with conditions went through, recorded by Ingrid Solberg as Marcus Ryde, with no check."},
  {"route":"gate--pdr-2","do":"Close the form. In Deliverables click the Connections row.","see":"The four connections without an agreement, under Back to PDR; the bar returns to the gate's page.","was":"A link out of the gate with no way back."},
  {"route":"gate--pdr-2","do":"In Criteria press Assess on AR.7: Met, and say what meets it. Then Add criterion: choose AR.1.","see":"Criteria reads 3 of 4 met with the note in the row, then 3 of 5: AR.1 joins, not assessed. Remove takes it out again.","was":"A separate outcome preview; Add security outcomes was a button on the gate page."},
  {"route":"overview-team","do":"Open Overview › Team. On Chief engineer press Reassign and choose Ingrid Solberg.","see":"The role's row shows her; the Overview's Team shows her as Chief engineer.","was":"People & roles was its own menu page; the Overview's Team was a second list."},
  {"route":"gate--cdr-2","do":"On the Overview choose EMD and click CDR.","see":"CDR's page: Decides Ingrid Solberg · Chief engineer, and the header's primary is her own Record decision.","was":"The decider was a fixed name on each gate page."},
  {"route":"gate--pdr-2","do":"Once a gate's deliverables are all ready, record Pass with actions: one action, its owner and due day.","see":"The page reads Passed with actions with the action tracked; the toast links to the next gate; on the Overview the strip counts one more.","was":"The decision changed the gate page; the Overview and the menu line kept their own counts."}]}]
caps={"O-s1":("The Overview is the program's record","One header, three tabs, the lifecycle in place, the next gate, Details and Team; one sidebar with the ten places."),
 "O-s2":("No Lifecycle page","A phase chosen on the strip lists its steps under it, on the Overview. A step's row opens its gate's page; the eye previews it."),
 "O-s3":("The next gate, opened up","Each deliverable not ready says why as a number, with one button; ready ones are quiet. One count: 2 of 5."),
 "O-s4":("The records that hold it back, and the way back","Requirements opens Controls on its 14 with no requirement, under a return bar. Before, it opened the workbook with no way back."),
 "O-s5":("A gate is a page","The decision is the header's one primary; what holds the gate back and its criteria are tables worked in place. Before: a dialog anyone could record.")}
n['shots']=[{"id":k,"title":v[0],"caption":v[1],"was":f"v3r/O/shots/{k}-was.png","now":f"v3r/O/shots/{k}-now.png"} for k,v in caps.items()]
n['checks']={"node --check":"ok","build":"out/v3r2-O.html, the whole build (60 modules)","offcheck":off_line,"walk":walk_line,"scenes":"was from out/prototype-v19.html (V3 on), now from out/v3r2-O.html, same five names"}
n['open']=[
 "The kit's record page keeps two columns at every width (.k3-rec .k3-aside outranks its narrow rule): at 390 the side cards covered the body. Lane O's CSS fixes it for a gate's page only; every other lane's record page needs the kit's fix (asks.json).",
 "Connections are made ready on lane S's pages; the walk still signs the four agreements in data. The 14 controls are mapped through lane C's control pages in the walk, one page each.",
 "Lane G's step-by-step approval chain (ISSM, then SCA, then AO, each recorded apart) is not on the page: Record decision writes the decider's decision and marks the earlier steps 'Recorded with the decision'. 'Reviews first' names come from lane G's constants; only the decider follows Team.",
 "Deliverables and criteria are parsed from lane G's gate page HTML; a change to that markup breaks the rows (the counts fall back to lane G's fact).",
 "Add criterion's picker has outcomes only for PDR and CDR of Increment 2 (v2's own list, read from its dialog); every other gate writes a criterion.",
 "Not passed leaves the step open as lane G does; Request decision afterwards clears it. Checked by hand, not in the walk.",
 "Program settings in More opens the workspace's Settings: no program settings page exists.",
 "Activity shows the 30 newest events v2 draws of 299, with no paging; Export the activity saves the rows shown.",
 "A created program: its gate's page has counts and criteria it can add, but no deliverable rows (lane G publishes none for it); Team assignments made there do not reach lane P's own People page.",
 "The ITCSC's team, Authorization's Sharing and the SSP's access list still keep their own people lists (see 'people lists').",
 "The steps table and the gate's tables at 390 scroll sideways inside their frames; the page itself does not."]
json.dump(n, open('notes.json','w'), indent=1, ensure_ascii=False)
a=json.load(open('asks.json'))
have=[x['what'][:40] for x in a['asks']]
new=[
 {"of":"kit CSS","what":".k3-rec .k3-aside { grid-template-columns: minmax(0, 1fr) 320px } (line 254) outranks the narrow rule at line 212, so every record page drawn by recPage keeps two columns at 390 and the side cards cover the body. Add the same rule under @media (max-width: 1080px) for .k3-rec .k3-aside.","worked around":"Lane O's CSS does it for a gate's page only (.k3-rec:has(#k3o-crit))."},
 {"of":"kit","what":"recPage gives every record page the class k3-rec only: a lane cannot scope CSS to its own record page. Add the kind as a class (k3-rec k3o-gate).","worked around":":has(#k3o-crit) in lane O's CSS."},
 {"of":"core vocabulary (core.js toneOf)","what":"'Ready' is a neutral word in the pill vocabulary, so K.status('Ready', 'ok') draws the same grey ring as 'Not ready'.","worked around":"The gate's Deliverables table draws its own state mark (.k3o-rs) beside the word."}]
a['asks']=[x for x in a['asks'] if not x['what'].startswith(".k3-title inherits") and not x['what'].startswith("K.task.start cannot carry")]+new
json.dump(a, open('asks.json','w'), indent=1, ensure_ascii=False)
print("notes and asks written")
