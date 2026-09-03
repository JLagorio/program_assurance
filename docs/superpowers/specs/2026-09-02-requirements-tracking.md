# Requirements tracking: what to take from the traceability tools

Date: 2026-09-02. Josef's ask: look at Inflectra, PTC, ReqSuite and the RTM spreadsheet, take what helps track and manage requirements against controls, build it as reusable kit parts on the kit's names, and keep the text down. Companion to `2026-09-02-picker-sheet.md` and items 9–11 of `2026-09-02-ui-patterns-audit.md`, which the other agent has landed in the kit.

## Taken

| From | Idea | Ours already | Add |
|---|---|---|---|
| PTC, DOORS | A link goes **suspect** when its upstream changes, until a named person re-reviews it | `currency` Current / Suspect / Invalidated on SCTM rows, driven by configuration change | The same `currency` on allocations and derivations; a review action that clears it |
| ReqSuite | The model lists **what a record still needs** | The Next column on the control board; `undecidedFor` | The same list on a requirement: claim, method, criterion, allocation, applicability, test |
| RTM sheet, Inflectra | Verification is a **link to a test with a result per event**; "not covered" is a state | Test objectives and procedures per element and CCI; a requirement is Verified by a state field alone | Requirement → test objective; one bar per requirement row; the RTM as an export with a column per T&E event |
| Innoslate, QVscribe | Requirement **quality**, as rules | `successCriteria: "—"` is allowed today | The INCOSE rules as gates on Approve; unmet gates listed, never a score |
| Inflectra | Saved **questions** with counts | `ToggleGroup count`, `Item.Group` with `Count` | Nothing in the kit; a few named questions on the coverage view |
| Inflectra | Show and hide columns | Nothing | Decision below |

Left behind: the per-column filter row, outline numbers, the planning board (the board's Component lens is that view), relations as pseudo-children in the tree, a percentage per row.

## Kit additions

Each is one file, one story in an existing family, one row in the family's table, no `description` prop, no router, tone through `toneClasses`.

- **`Gates`** (components, in Status). A list of named conditions, each met or not, the reason shown only when unmet, an optional action per unmet gate. Replaces three app-local lists (`GateList` on control work, `RevisionGates` on a revision, the T&E entry and exit criteria) and carries the two new ones (requirement quality, what a requirement still needs). The blocked-reason vocabulary ActionBar already uses, as a list.
- **`Glance`** (patterns). The hover rung's body: id and one status on the eyebrow line, title, meta, at most four `KeyValue` rows. `ProgramPeek` and `RiskPeek` hand-roll this with a raw `dl` today. With `PreviewSheet` as the peek rung, a record is drawn by the same parts on every rung.
- **`Progress.Stacked` `appearance: "hatched"`** on a segment, for unknown and not covered. The control board's hatch, moved into the part so it is one decision.
- **Column choice** (decision). `DropdownMenu.Item isSelected` already exists, so a Columns menu is a documented use, not a new part. Whether the tree and the coverage view get one, or the columns are cut as the audit proposes, is Josef's call. My recommendation: cut first, menu later if asked for.

## Model additions (`src/lib`)

- `currency` on `Allocation` and `Derivation`, computed: a derivation is Suspect when its control's text changed with the framework edition or a control set revision dropped the control; an allocation is Suspect when its requirement was re-revised or its element changed (the baselines path already computes the element side). `reviewLink(id)` records reviewer and date and returns it to Current; re-opening sends an allocation back to Proposed.
- `verifiedBy` on `Requirement`: test objective ids, joined to `TestObjective.result` per event. `coverageOf(requirement)` returns met, not met, not run, not covered.
- `qualityGates(requirement)`: one shall, a measurable criterion, an owner, a source with a rationale, one subject. Approve is blocked with the first unmet gate as its reason.
- `needsOf(requirement)`: the unmet relations, each with its action.

## Surfaces

Every one carries its action; none is read-only.

- **Requirement record and peek**: `Gates` for quality (record) and needs (both); the Suspect flag at the row of each allocation and derivation with "Reviewed, still holds" beside it; the test objectives with results.
- **Coverage view**: the one bar per row (met, not met, not run, hatched not covered) in place of the Verified filter; the saved questions as the filter row's counts; Method and Owner columns dropped (audit proposal).
- **Tree**: a Suspect count on the row's Control set cell when any link under it is suspect.
- **Queue**: requirement items (a suspect link to review, a gate to meet) beside the revisions.
- **Export**: the RTM, one row per requirement × allocation × test objective, one result column per T&E event.
- **Picker adoption** (next.md, prototype): "Allocate a requirement", the tailoring pane's two Comboboxes and the applicability walk onto `PickerSheet`. **The peek stack in the URL** and **one preview body per record type** (next.md) land with the `Glance` work.

## Text density

A heading carries a count, never a sentence. A gate is a label; its reason appears only when unmet, small and subtle. A consequence sentence appears once, in the confirm dialog. A glance holds four facts, a peek three under the title, a row one status and one bar. Empty states are one line. No paragraph in a Block.

## Working alongside the other agent

- I add files under `components/`, `patterns/` and `stories/`; I touch a shared file only to add an export line. `tokens/`, `generated/`, `sheet.tsx`, `table.tsx` and anything in their next.md Kit list are theirs; a change I need there goes into next.md as a request.
- Storybook first, app second, screenshots for Josef, commit by explicit path, next.md ticked.

## Order

1. `Gates` in the kit; quality gates and needs on the requirement record and peek; the queue gains requirement items.
2. Hatched segment; requirement → test objective; the coverage bar; the RTM export.
3. `currency` on allocations and derivations; the row flags, the review action, the queue.
4. `Glance`; requirement, control and element glance bodies; hover on every id on the spine surfaces; program and risk peeks moved onto it; the peek stack in the URL.
5. Picker adoption.

## Calls made without asking, for Josef to overturn in one reading

1. Suspect is cleared only by a named review, never by time or by a later passing test.
2. Quality gates block Approve, not authoring; a Draft may fail every gate.
3. The coverage bar replaces the Verified filter rather than sitting beside it.
