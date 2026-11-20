# Lane E: assessments, findings, risks and the authorization

Read `SP/vanta/v3r/CONTEXT.md`, then `SP/vanta/v3r/MODEL.md`, and follow both. Your files: `SP/vanta/proto/mod-zzzz-v3-8e-assure.js` and `.css` (CSS prefix `k3e-`), and `SP/vanta/v3r/E/`. Build name `v3r-E`. The first wave has landed: lanes S (`component--<code>`, `system…`), C (`controls`, the control's panel `k3c-control`) and O (`overview`, the gate's panel) are in your build (build with every `mod-zzzz-v3-8*` module except lane D's, yours last); read their `notes.json` in `SP/vanta/v3r/<S|C|O>/` and look at their pages before you draw: yours must read as the same product.

## What Josef said
> there are too many tabs doing simliar things instead of starting with higher level records and then diving into record details to do things with those. … these issues are everywhere.

A reviewer then walked the last version (`SP/vanta/v3r/walk/walk.json`, job 10, and the overlaps in `inventory.json`): findings are drawn in five lists with five column sets; an assessment finding has no record of its own (its row opens the control, which says it has none); no determination could be recorded on one objective; "Flag" changed nothing; inside a campaign the program menu was replaced; the same campaigns are cards on one page, a table on another and again under Cyber T&E.

## Build
**1. `assessments`.**
- Rail: All · Control assessments · Cyber tests · Monitoring checks. (Cyber T&E, Continuous monitoring, Checks and Schedule are these categories: a monitoring check is an assessment that repeats, with its cadence and next run as columns.)
- Table, one shape for all: Assessment (name over what it covers), Kind, Status, Window or cadence, Progress (objectives judged of planned, a ring), Findings, Lead. One needs-attention card (results waiting to be published, checks failing, a window ending).
- **An assessment is a page** (it holds lists): the campaign's record keeps its tabs (Plan, Objectives, Requests, Results, Findings) **with the program menu still there** and Assessments marked. On it an assessor can **judge one objective**: open a control's objectives, record a determination with its method and a justification (the earlier lane R built the rules: `SP/vanta/v3/R/notes.json`); a result short of satisfied opens a finding at once. Publishing stays the lead assessor's.
- A monitoring check's page: its runs, what it covers, its failures as findings.

**2. `findings`: one list for everything found.**
- Rail by source: All · Operational issues · Assessment findings · Vulnerabilities · STIG rules. Chips: Open · Past due · On the POA&M · No owner.
- Table: Finding (what was found over where), Source, Severity or determination, Control, Component, Plan (its planned date and milestones reached, or None), Owner.
- **A finding's panel, for every kind** (an assessment finding gets its own, never the control's): what was found, by which assessment and objective; Control (opens lane C's panel), Component (links to its page); **Plan** (the POA&M item is this plan: Create plan, its milestones as rows with Add milestone, Change planned date, each saved); Risk (Create risk here, or link one); Deactivate with a reason. Its one next step.
- **The POA&M is a view:** the chip On the POA&M shows the findings that have a plan, with the plan's columns (planned date, milestones, resources), and More holds Export POA&M. Authorization's package names the same list.

**3. `risks`.** Tabs: Register · Threats (the ATT&CK techniques the risks name, each with its risks and countering controls: the old Threats page). The risk's panel: its assessment, its response and acceptance chain done there (the earlier lane R made Create risk ask for the response), techniques linked in place, the findings behind it.

**4. `authorization`: the record the AO decides on.** A page: its header says the decision in force; tabs Package (what it holds and whether each part is ready: the SSP revision, the assessment report, the POA&M, the risk assessment; each opens that document or list) · Decisions (IATT, ATO, their conditions, with Record decision for the authorizing official) · Conditions (count; each with its owner and due date, closed in place) · Monitoring (what ongoing authorization owes: reports, significant changes) · Sharing (who can open the package: the old Package room).

**5. Fold.** `cyber-te…`, `conmon…`, `checks…`, `schedule`, `poam…`, `threats…`, `package-room…`, the findings' old tabs (`findings-assessment`, `findings-assets`, `findings-vulns`, …) and the assessor's view open their new home.

## It works when (your walk asserts each)
1. Assessments → a rail kind filters in place → a campaign's row → its page with the program menu present.
2. On a campaign: open a control, record Other than satisfied on one objective with a justification: a finding exists, under Assessment findings and on the campaign's Findings tab, with its own panel.
3. From that finding's panel: Create plan with a planned date and one milestone; it is counted under On the POA&M; Create risk with a response; the risk is in the register and names the finding.
4. The control's panel (lane C) lists the finding and the risk; the component's Findings tab (lane S) lists it.
5. Publish the results as the lead assessor: the control's status follows everywhere it is read (Controls, Overview).
6. An operational issue's panel: Change planned date, Add milestone, Deactivate with a reason; each kept after a reload.
7. Risks → Threats: a technique lists its risks; Link a technique on a risk's panel adds it there.
8. Authorization: the package's parts say ready or not from their records (the POA&M part counts what Findings counts); a condition closed in place lowers Conditions' count; Sharing adds a person.
9. Every folded address lands; a created program shows its own or an empty register with its Add, never WS-X90's.

## Not yours
The control's panel (C), the component's page (S), gates on the Overview (O: an IATT or ATO step there opens your Authorization page), documents and evidence (lane D, beside you).
