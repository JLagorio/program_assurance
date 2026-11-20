# V3 lane G: gates read their records, and decisions reach every page

Read `SP/vanta/v3/COMMON.md` first and follow it. Your files:
- `SP/vanta/proto/mod-zzzz-v3-3gates.js` and `.css`
- `SP/vanta/v3/G/`

## Your findings (22)
A15, B01, B02, B05, B06, B07, B08, B09, B10, B11, B12, B13, B14, B15, B23, B26, B27, B29, B30, C01, C05 and C21, in `SP/vanta/review/{A,B,C}/findings.json`.

Reviewer B's walk is in `review/B/path.json`. Its click scripts in `review/B/` (`lib.mjs`, `a*.mjs`, `flow1*.mjs`) reproduce the decisions on Lifecycle. B07 was dropped on re-check: Submit for review needs a review comment first. Make that requirement visible where the button is, rather than leaving a button that seems to do nothing.

1. **A decision records only the decision** (A15, B02, B08)
   - Deliverables and criteria keep reading their records at draw time; recording a decision never flips them to Ready or met.
   - Approve is blocked while a deliverable or criterion is open. Approve with conditions and Not approved stay available.
   - Requesting a decision far before its due date warns.
   - The decider is a named person, chosen when the decision is requested. Only that person records it, or the record says "recorded as <name>", as risk acceptance does.
2. **Deliverables read their records** (B01, B12, B14, B26)
   - PDR's Interconnections deliverable reads Interconnections: Not ready, 2 expired · 2 unsigned. It opens the page on those agreements.
   - Boundary opens on Increment 2 · Block 1.1, with the SCA's boundary review shown and requestable.
   - Develop the SSP reads SSP revision 3: In progress, Draft.
   - "14 controls with no requirement" opens Controls filtered to No requirement.
3. **Conditions and steps** (B10, B11, B27, B30)
   - With conditions, the row reads Passed with conditions. Each condition is tracked, with an owner and a due day, on Lifecycle and in its owner's My work until closed.
   - Multi-step approvals record one step at a time and name the current holder, as risk acceptance does.
   - The AO, or the AODR, decides Develop the SSP and Select security controls; the SCA reviews.
   - My work's Waiting on others lists the decisions the user requested.
4. **One status per outcome per increment** (C01, B13, B30)
   - Lifecycle owns each gate's criteria, deliverables and decision. Security engineering merges into Lifecycle as the gate's security outcomes: draw that view, and `PA.v3.redirect("sse", …)` to it.
   - One vocabulary: Lifecycle's status words.
   - Drop the stale footnote.
5. **One authorization record per decision** (B05, B06, B09, B15, B23, B29, C05, C21)
   - Lifecycle's IATT and ATO steps write it. Authorization's decision history, Boundary and the package read it: Increment 1's IATT has one date, and Increment 2's planned IATT appears.
   - Authorization's decision types are ATO, ATO with conditions, IATT and DATO.
   - The SAR step records the SCA's risk recommendation, and the package shows it.
   - The ATO condition's progress, ConMon's trigger and the package's counts are derived from Findings and POA&M at draw time. Use lane F's `PA.v3.fact("issues")` and `fact("poam")` when they exist, with your own fallback.
   - Increment 1's annual SSP update and Increment 2's SSP are separate revisions. Each feeds its own package or IATT.
   - The SSP's categorization rationale comes from the signed ITCSC.
   - Package room becomes Authorization's Sharing tab (recipients, access requests, access log). Redirect `package-room` to it.

## Routes you own
- `lifecycle*`, `sse*`, `authorization*`, `package-room*`, `boundary*`, `interconnections*`, `ssps*`, `ssp-review`.
- The gate preview and the decide and request dialogs (`v2g-*`), for every program. Lane P owns a created program's dates and data.
- `conmon`: only the ATO condition's trigger text (lane W takes ConMon over later).
- `my-work`: insert your rows (conditions, requested decisions); never redraw the page. Lane P also inserts rows there.

Publish:
- `PA.v3.facts.authorizations(prog)`: `[{ id, inc, type, decided, by, atd, scope, conditions }]`
- `fact("conditions")`
- `fact("gate", id)`
- `fact("outcome", code, inc)`

## Walks and screenshots
- **Walk 1:** "Decide PDR: the gate reads its records". Open PDR, see what is open, try Approve (blocked), approve with conditions, then follow a condition to My work.
- **Walk 2:** "Increment 2's IATT reaches every page". Request and record the IATT, then see it on Authorization, Boundary and the package.
- **Scenes:**
  - PDR after Approve: v2 rewrites to Ready, V3 keeps its records;
  - Authorization's decision history;
  - Lifecycle with the security outcomes;
  - the decide dialog.
