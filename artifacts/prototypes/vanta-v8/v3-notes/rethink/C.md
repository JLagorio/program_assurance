# Lane C: controls and the baseline, one page

Read `SP/vanta/v3r/CONTEXT.md`, then `SP/vanta/v3r/MODEL.md`, and follow both. Your files: `SP/vanta/proto/mod-zzzz-v3-8c-controls.js` and `.css` (CSS prefix `k3c-`), and `SP/vanta/v3r/C/`. Build name `v3r-C`.

## What Josef said
> baseline makes sense but i hate the pill layout of all these controls. there has to be a more VANTA way to present this data. if im at the baseline and i click a family it takes me ot the controls page. idk i feel like controls + baseline are one in the same.

And of the component page: "if i want to edit the controls i cant. theres an open in controls button which is stupid." And: "the workbook is gone."

The baseline is not a page: it is **which controls are in the list, and where each came from.** Controls is Vanta's framework page (`SP/vanta/v3r/ref/framework-details-page--02.jpg`, `controls-page--02.jpg`): a rail of families, a completion card, the controls as rows, and a control opening in a panel where the work is done.

## Build
**1. `controls`: the list.**
- Header: Controls; primary `Add control` as a menu (From the catalog, Apply an overlay); More (Gap assessment, Export, Open the SSP at section 11).
- Two cards. **Completion:** Controls satisfied, percent, n of total, with three small bars that are filters: With a requirement, With evidence, Assessed. **Baseline:** the total, then its layers one line each in the order they apply (NIST SP 800-53 Rev 5 High 370; CNSSI 1253 +201 −17 → 554; Mission Assurance Overlay −5 → 549; Deployed Platform Overlay +1 → 550; F-16 SPO Tailoring −4 → 546; Program tailoring +14 → 560), each line a filter to the controls that layer added or removed, and `Edit baseline`.
- Rail: CONTROL FAMILIES: All controls, then the 18 families by code and name with counts. OUTSIDE THE BASELINE: Tailored out.
- Chips: All · No requirement · Needs evidence · Not assessed · Short of satisfied · Inherited, with counts.
- Filter row: search; Status, Source (the layer), Responsibility, Technique (the cyber resiliency technique a control supports: this is where the Cyber resiliency page went), Owner. At its end the view switch **List · Workbook**.
- Table: Control (code, name over one line of its statement), Status, Source, Responsibility, Components (how many carry it), Evidence (a ring: objectives with evidence of objectives), Owner. No tiles, no pills of codes. Paged, 50 a page.
- **A family is a filter on this page**, never a link to another one.

**2. The baseline's actions.**
- `Edit baseline`: the layers with a switch each, Add overlay (from the published overlays), and What changes (controls now and after, added and removed by code) before Apply. The earlier dialog's rule holds: a change waits while an assessment is open, and says so.
- `Add control → From the catalog`: the picker over the catalog's controls not in the baseline, then a rationale; it joins under Program tailoring. Every total follows (the cards here, the Overview's, `fact("controls")`).
- A control's More: Remove from the baseline (rationale); it moves to Tailored out, from where it can be restored.

**3. The control's side panel, `k3c-control`** (Vanta's control drawer: `SP/vanta/v3r/vanta/anatomy.md` section 3). Everything a person does to a control is done here, and it opens from every list that names a control (yours, a component's Controls tab, a requirement, a finding).
- Title, code, status. The statement, with the program's parameter values in place of the placeholders; a value is edited in place (this is where Baseline's Parameters tab went).
- Facts: Status, Source, Responsibility (change it: This system, Hybrid with a provider, Inherited from a provider; the provider's status then decides, as lane H's rules say: `PA.v2host`), Owner (assign).
- `K.next`: the one next step, done here: Map a requirement, Link evidence, Add to an assessment, Open its finding.
- Related cards, each `K.related` with its own Add and a remove on each row:
  - **Implementation:** one row a component that carries it: its status (Implemented, Partially, Planned, Not implemented) and narrative, edited in place; it is the text the SSP's section 11 prints (say which revision) with a link that opens the SSP editor at this control. Opened as `"AC-2@CN-109101"`, the panel leads with that component.
  - **Components:** where it is placed; Add component (S's `place`), remove.
  - **Requirements:** the requirements that map it; Add requirement (pick, or Create requirement); unmap.
  - **Evidence:** what its requirements cite; Add evidence (pick one of the program's evidence artifacts onto one of its requirements).
  - **Assessment:** objectives judged of objectives counted, the latest determination and its campaign; the earlier lane R's objective-level work is reached from here.
  - **Findings and risks** that name it.
- Open: the control's full record (the page v2 has, `rec--a-tests-control--<code>`), for its history and objectives at length.

**4. The workbook is Controls' second view.** `sctm` opens from the view switch in one click and returns to the list from its own switch; say on both that they are the same rows. A gate's SCTM deliverable and ⌘K open it too. Where the workbook's staged edits and the panel write the same field (an implementation's status, a responsibility, an owner), they write the same store.

**5. Fold.** `baseline…`, `resiliency…`, `posture…` open Controls (on the filter or view that holds what they showed). If the Posture matrix (components by families) is worth keeping, it is a third view, Coverage, drawn under this page's header; if not, say what was dropped. Publish the facts MODEL lists for you.

## It works when (your walk asserts each)
1. Controls → a family in the rail: the same page, filtered; its count equals its rows; the 18 families add up to All.
2. A chip (Needs evidence) and a search narrow further; a completion mini and a Baseline layer line filter too; Clear returns all.
3. Add control from the catalog with a rationale: the total reads one more on both cards and in `fact("controls")`; its Source reads Program tailoring. Remove a control: it is under Tailored out, the total one less; restore it.
4. Edit baseline: switch one overlay off, read What changes, apply: the layer lines, the total and the list follow. Switch it back.
5. Open AC-2's panel: write Mission Computer's implementation and set its status; close, reopen, reload the page: kept. `fact("impl", "AC-2", "CN-109101")` returns it.
6. In a panel: Add requirement (create one), Add evidence to it: the cards' counts follow and the control's status moves along its ladder (a control at No requirement reads No evidence once mapped, Not assessed once its requirement cites evidence).
7. Change a control's responsibility to Inherited from F-16 Block 70: its status reads the provider's, and the Inherited chip counts one more.
8. Edit a parameter value in the statement: the statement prints it after a redraw.
9. List → Workbook → edit a cell, review, apply → back to List in one click each way.
10. `baseline`, `baseline-params`, `resiliency` and `posture` land on Controls. A created program shows its own baseline or an empty Controls with Add control, never WS-X90's.

## Not yours
The component's page (lane S: link to `component--<code>`), the Overview (lane O), the Requirements and Evidence registers (second wave: you add and link through pickers, you do not redraw those pages).
