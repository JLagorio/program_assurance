# V3 lane F: one store per fact

Read `SP/vanta/v3/COMMON.md` first and follow it. Your files:
- `SP/vanta/proto/mod-zzzz-v3-4facts.js` and `.css`
- `SP/vanta/v3/F/`

## Your findings (15)
B03, B04, C02, C03, C06, C07, C08, C09, C18, C19, C20, C22, C26, C27 and C28, in `SP/vanta/review/{B,C}/findings.json`.

Reviewer C's census, with the values it saw on each page, is in `review/C/` (`findings.json`, `path.json`, its scripts). The rule behind all of these: **a fact has one source, every page that shows it reads that source at draw time, and an action moves it everywhere.**

1. **Control status** (B03, C07, C20)
   - Baseline's status key, Cyber resiliency's objectives mapped, Posture, the Requirements count and Traceability read the same control-status and mapping source as Overview and Controls. That source is `PA.v2.chain.counts()` and `view(code)`, `PA.v2reqs` and `PA.v2host`.
   - Publishing results and mapping REQ-641 to SA-24 move all of them.
   - A control's preview and page show the assessment finding that set its status, and its campaign, never "No assessment has judged it" beside a determination.
   - Component inheritance shows in the Responsibility column, not as a Next step.
2. **Issues, risks and evidence** (B04, C08)
   - Posture's band counts open issues and risks from the live registers.
   - Accepting an evidence version moves Overview's tile, the assessor's request tracker, My work's assessor item and the Event log, which records each review.
3. **The setup checklist** (C02)
   - One checklist object, shown as one fraction everywhere: the Overview setup card, and any page header or badge that keeps it.
   - In V3, `getting-started` redirects to `overview`. Lane W moves the workspace steps to Settings later.
4. **Snapshots and the Activity page** (C03, C28)
   - Every control status snapshot, its row, preview, page and the Programs trend are taken the same way, inherited controls included. The trend reads those rows.
   - Draw the program's Activity page (`activity`; V3's core has a placeholder): the program's event log, its snapshots, reviews and decisions.
   - Settings' Event log becomes workspace-wide, with a program filter.
5. **People and owners** (C09, C19)
   - A person's page counts come from the registers' owner fields, and the total is the sum of the categories shown.
   - People & roles is one record per program, read by People, Overview's Team, ITCSC §11, SSP access and Permissions. It includes the gate deciders: Marcus Ryde is missing today.
6. **The workbook and the AI drafts** (C06, C18)
   - The SCTM workbook's sheets are built from the full registers, or named as the subsets they are ("Requirements behind 92 controls").
   - Operational issues and assessment findings stay apart.
   - Map a requirement offers only requirements in the register.
   - An approved Requirement drafter run joins the register (REQ-641–643) and Traceability at once.
7. **Words and repeats** (C22, C26, C27)
   - "Customer A" names the X800 program only. WS-X90's tailoring layer and its customer requirements document get WS-X90's own customer's name: choose one that fits GH.md's story and use it everywhere WS-X90's pages say Customer A (Baseline, ITCSC §6, Cyber T&E).
   - Each fact appears once per page: Findings' open-issue count, Authorization's ATO date, SSE's due date (Authorization and SSE are lane G's: publish what they need).
   - Count mismatches either agree or carry their definition.
8. **Traceability merges into Requirements** as its chain view. Redirect `traceability` there.

## Routes you own (WS-X90)
- Main pages: `overview`, `baseline`, `posture`, `resiliency`, `controls`, `requirements*`, `traceability*`, `sctm`, `evidence`.
- Records and registers: `findings`, `threats`, `event-log`, `activity`, `people`, `person-*`, `itcsc`, `ai-drafts`.
- Previews: the control preview and page (`a-tests-control`, `rec--a-tests-control--*`).
- WS-X90's row on `portfolio`.
- A cross-page text substitution for C22, limited to WS-X90's pages.

Publish, for every program you can answer (WS-X90 at least):
- `PA.v3.facts.controls(prog)` → `{ total, satisfied, partially_satisfied, other_than_satisfied, not_assessed, no_evidence, no_requirement, inherited, hybrid }`
- `issues(prog)` → `{ open, bySev, pastDue }`
- `risks(prog)` → `{ open, noOwner, bySev }`
- `poam(prog)` → `{ items, open, completed }`
- `evidence(prog)` → `{ total, accepted, pending, revise }`
- `requirements(prog)` → `{ total }`
- `setup(prog)` → `{ done, total, steps }`
- `people(prog)` → `[{ name, role, rmf }]`
- `snapshots(prog)`
- `techniques()`
- `customer()`

Lanes G, R and W read these.

## Walk and screenshots
- **Walk:** "One action, every page follows". Map REQ-641 to SA-24, accept an evidence version, publish a result set; after each, visit Overview, Controls, Baseline, Posture, Requirements and Activity.
- **Scenes:**
  - Baseline's key after publishing (v2 stuck, V3 moved);
  - Posture's band;
  - a person's page;
  - the SCTM sheet counts.
