# V3 lane P: a created program is real

Read `SP/vanta/v3/COMMON.md` first and follow it. Your files:
- `SP/vanta/proto/mod-zzzz-v3-2program.js` and `.css`
- `SP/vanta/v3/P/`

## Your findings: A01–A14 and A16–A25 (24, all in `SP/vanta/review/A/findings.json`)
Reviewer A created a blank program. Its walk is in `review/A/path.json` and its scripts in `review/A/`. Before you change anything, run its path again on v2: PRG-2301 "SP-70", system SYS-2301, wizard target authorization Sep 30, 2027, F-16 host on the quick path, then a second draft. What it shows, in groups:

1. **The wizard** (`program-new*`, `mod-program-new.js`)
   - A blank program starts empty: placeholders only, no Customer D, no X800 (A01, A18).
   - Element codes come from the system code typed (A01).
   - No tailoring is pre-applied; suggestions carry an explicit Add (A02).
   - The Systems step asks the ITCSC §7 NSS question and applies CNSSI 1253 when the answer is yes (A20).
   - No host is preselected (A20).
   - The next free system code is proposed, and checked as the program code is (A21).
2. **What the wizard wrote shows where it lives** (A07)
   - Composition: the system and its elements.
   - Baseline: the stack (the guide's View panel already draws it).
   - Controls: every control at No requirement.
   - Boundary: its elements.
   - People: the roles.
   - ITCSC: a draft from the wizard (§6, §7, §10, §11 filled), with Sign for the PM and the AO, done only once both have signed (A14).
3. **Every build page has its first action, and the chain can start** (A06, A11)
   - Composition: Create element. Interconnections: Add interconnection. Ports & protocols: Add port. Baseline: Tailor a control. Policies: Upload policy.
   - Requirements: Create requirement, then Map control.
   - Evidence: Upload evidence against a requirement.
   - The SSP: a page for the program's own revision 1, with a narrative to write per control and Publish once it is ready. Keep it simple and honest: say what Publish needs.
   - Assessments: Plan assessment, once the SSP is published.
   - Findings, POA&M and Risks: Create.
   - Authorization: Start package.
   - Each action writes a record (state under `v3.P.<program code>.…`) that its page lists afterwards, and the program's counts follow. Break the loops between the guide and the pages.
4. **The starter guide and Overview**
   - The guide's state is per program (A10).
   - Each step is derived from the record it names: requirements imported, ITCSC signed, mappings made. A file drop says what it read, or that it is not wired (A12).
   - Each step with an owner is a task in that person's My work, linked to the step (A17).
   - For a created program, Overview shows its control status band at 0, its life cycle, and the guide as a setup card. There is no second copy of the guide page (A19).
   - In V3, `getting-started` redirects to `overview`; `program-start` may become the created program's Overview. Your call; say which.
5. **The life cycle** (A08, A09)
   - Lifecycle dates count back from the wizard's target authorization date.
   - Categorize and Select read done, or awaiting signature, with the wizard's values and date.
6. **Hosts** (A05, A13, A24, A25)
   - A hybrid control reads the created program's own standing (No requirement) beside the provider's part.
   - The provider's preview names the created program, not WS-X90.
   - The start page's inherits card, Programs and Home count the host's inherited controls by the provider's status, as WS-X90's counts do.
   - The inherited figure states its rule, or the figures agree.
   - Host & providers offers Add provider.
7. **The shell** (A03, A04, A16, A22, A23)
   - With V3 on, the current program changes only from the switcher or a link that names a program. Set `PA.v3.keepProgram`; read the hubs layer's hashchange handler to see what it skips.
   - Switching between two created programs at the same address draws the new one (`PA.v3.refresh()`).
   - The SCTM workbook draws the current program's controls, or an empty state naming it.
   - ⌘K search finds created programs by name, code and system code (`PA.search` in `mod-v8-platform.js`).
   - The Programs row shows the system owner from the wizard's team step and opens a preview like the other rows.

## Routes you own
- `program-new*` and `program-start`.
- Every program page **while the current program is a created one**. Use `PA.v2hubs.progKey(route)`, plus lifecycle, boundary, hosts, sctm, activity and `rec--*`.
- Created programs' rows and cards on `portfolio` and `home`, and their search entries. For WS-X90's rows, return `orig()`.
- `my-work`: insert your guide tasks as rows; never redraw the page. Lane G also inserts rows there.

Publish `PA.v3.facts.program(code)`: the created program's records and counts, for other lanes.

## Walk and screenshots
- **Walk:** "Create a program and take it to its first assessment", from Create program to a planned assessment, with the counts following.
- **Scenes:**
  - a blank wizard's details step;
  - a created program's Composition (v2 empty, V3 its elements and Create element);
  - its Overview;
  - its Lifecycle against the target date.
