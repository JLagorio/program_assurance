# Lane A: controls, after Drata

Read `COMMON.md` and `RECS.md` in this folder first. You write `SP/vanta/proto/mod-zzzz-v4-1ctl.js` and `.css` (prefix `dra-`) and your folder `v4dr/A/`.

Recommendations you own: 1, 2, 3, 4, 5, 6, 28. You also use the kit's 19 to 22 and 25 on your screens. Lane K is writing the kit (`PA.drk`) at the same time. Its function names are fixed in COMMON, so call them from the start. If a call draws plainly at first, that is K still styling.

## Start by reading the current screens (V3 on)

- `mod-zzzz-v3-8c-controls.js` draws Controls: the list `controls`, and the control record `K.recRoute("k3c-control", code)` with its panel `k3c-control`. Read its header comment: it lists every store a control reads and writes. Reuse those accessors, so your after screens show the same WS-X90 numbers as the current ones.
- Open the build with V3 on, go to `controls`, and open a control's page. Note what is there today.
- Pick the control for the record pair: one on WS-X90 with requirements, evidence, some objectives judged and some not, and at least one component whose implementation statement was changed from the library implementation. V3 knows "Changed here" (search the modules for "Changed here", `description_changed` and `system_component_changes`). AC-2 or SI-2 are likely; choose by the data.

## The after screens (new routes, your module)

1. **`dr-controls`: the controls register after.**
   - The code column is `D.idChip(code, D.tone(status))`, so the status column goes (rec 2).
   - Keep `K.toolbar` with saved views. Put `D.facetToggle` in its `right` and open `D.facets` beside the table: Family, Status, Responsibility, Owner, Source, Scope (rec 21).
   - Choosing rows shows `D.selbar` with "Select all N", Assign owner, Mark out of scope, and Add review (rec 22).
   - Mark out of scope asks for a rationale in a `K.dialog` and applies it to every chosen row. A tailored-out control stays in the list, filtered by Scope, with its rationale in a column (rec 4).
2. **`dr-control--<code>`: the control record after.**
   - `D.head` with the id chip, the status word beside the title, and the facts strip: owner (pencil), frameworks or baseline layers, components (rec 20).
   - Tabs: Overview, Requirements, Evidence, Assessment, Findings, Risks, History. A tab with problems shows `problem` counts, such as Evidence 2 stale or Findings 1 open (rec 3).
   - On Overview, `D.stages`: n of m objectives satisfied, and four cards (Requirements: objectives mapped; Evidence: objectives evidenced; Assessment: objectives judged; Remediation: open POA&M). The uncounted line covers objectives judged by inheritance, sources in error, and components that don't carry it (rec 1).
   - The status ladder stays the word beside the title. The cards explain it; they do not replace it.
   - `D.card` for Info (statement, parameters, owner) with its own Edit (rec 25).
   - An Implementations card, one row per component. The changed one reads "Changed from library" with a Compare button, which opens `D.openCompare` (the library implementation against this component's statement, field by field) and writes the chosen fields back (rec 5).
   - A Review and approval card on the implementation statement: the stages (Prepare for reviewers → Needs approval → Changes requested → Approved), the approvers (the program's ISSO and ISSM from the people data), a deadline, Send to reviewers, and the reset rules shown as one line each. Adding evidence asks "Send to reviewers" or "Still working" (rec 6).
   - `D.suggest` cards on the Requirements tab, offering requirements to map, each with a confidence word, a rationale and its source, and Map, Dismiss and Undo. Then one `D.proposal`, an agent's proposed change, with Approve and Decline, and a line saying how much the assistant may do alone, chosen in a setting (rec 28).
   - Use `D.sunken` on Overview.
3. **The pairs in your notes.**
   - Controls register: current `controls`, after `dr-controls`.
   - Control record: current is the control's V3 page, after `dr-control--<code>`.
   - Compare with library: current is the component implementation as V3 shows "Changed here"; after is `dr-control--<code>` with `click` opening the compare dialog.
   - Review and approval: current is where V3 shows the statement's review, if anywhere; else `new: true`.
   - Each pair has numbered changes, citing Drata images from `docs/products/drata/images/index.json` (the control record images are under `images/ux/controls/`; search `screen` for "Readiness", "Compare with Drata's template", "approval").

## Checks

COMMON's checks. Your walk also:
- chooses three rows, uses Select all, marks two controls out of scope with a reason, and sees them stay listed with the reason;
- applies one field in Compare, and sees the statement change;
- sends to reviewers, and sees the stage move;
- maps a suggestion and undoes it.

Hand back as COMMON says.
