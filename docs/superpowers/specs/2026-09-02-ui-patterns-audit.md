# UI patterns audit: the system-spine surfaces

Date: 2026-09-02. Scope: every surface built for the spine this week: the system tree, the preview sheet, requirement coverage, the Control set tab folded into the element record, the queue sheet, the persona switch, the wizard and the tailoring pane. Read against the kit as it stands in `packages/design-system` (primitives, components, patterns, shapes) and its stories.

The rule applied: a kit part used the way its story shows is fine; a raw element standing in for a kit part is a defect and was fixed; a real pattern the kit does not have is flagged below with a recommendation, and the decision (kit or bespoke) is Josef's.

## Fixed: raw stand-ins replaced by the kit part

| Where | Was | Now |
|---|---|---|
| Tree, Work column | hand-rolled two-segment bar (`bg-success-bold` spans) | `Progress.Stacked` |
| Tree, row actions | `Button` wrapping an icon | `IconButton` |
| Tree, sheet, coverage, control-set tab | `<span className="text-subtle">—</span>` | `Absent` |
| Sheet, coverage, switch, revision review | classed `<p>` and `<span>` for muted copy | `Text` |
| Sheet | `<button className="text-brand hover:underline">` to drill into a part | `Button variant="link"` |
| Sheet footer links | classed router `Link` | `Button variant="link" asChild` around the `Link` |
| Tree, sheet, coverage, control-set tab | `<colgroup>` plus `table-fixed` | `Table.Header width` (the kit: widths are a prop, not a class) |
| Sheet footer, element facts, revision facts | classed `div` and `span` layouts | `Inline`, `Stack`, `Grid as="dl"` |
| Coverage filter counts | `Box` holding a number | `Count` inside the `ToggleGroup` label |
| Controls-tab summary | a `dl` grid | `Item.Group` with `Item link`, each row opening the element's Control set tab |
| Persona switch | raw pill `<button>` with an inline shadow | `Button variant="secondary"` on `rounded-full` and `shadow-overlay` |
| Revision review | actions in the Block header overflowing onto the gates; the reviewer's note as a classed `<p>` | actions above the gates in the right column; `Alert` |

## Flagged: patterns the kit does not have (decision needed)

1. **Preview sheet or preview rail.** The kit's preview surface is `PreviewRail`, opened by the eye on `Table.Id`; `IndexPage` says the rail is the only inline detail surface. The tree opens a `Sheet` on row click (Josef, 2026-09-02: a peek panel, not the rail). Recommendation: **kit**. Add `PreviewSheet` to patterns: a `Sheet` whose header carries the Eyebrow "Preview" and the id, whose footer's first item is "Open the full record", actions on the right. Write the rule: rail beside an IndexPage table that leaves room; sheet over a full-width table (a tree, a board) and whenever the preview carries actions. Until then `NodePreviewSheet` is app-local.
2. **Tree grid.** `Tree` is a list; the spine needs rows with columns (ARIA treegrid: Jira plans, Asana subtasks, Airtable groups). `src/components/app/tree-cell.tsx` is the cell, on the kit Tree recipe and free of app knowledge. Recommendation: **kit**, as `Table.Tree`. Lift the file.
3. **Text links.** `text-brand hover:underline` on router `Link`s appears 107 times in 41 files; the kit has only `Button variant="link"`, which needs `asChild` around every `Link`. Recommendation: **kit**: a `TextLink` that is `asChild` by default, then one sweep. App-wide, not a spine problem.
4. **Column widths.** `<colgroup>` appears in 46 files while the kit says widths go on `Table.Header width`. Recommendation: **sweep**, no kit change.
5. **Filter counts.** `ToggleGroup` items take a label only; the coverage view puts a `Count` in the label. Recommendation: **kit**: a `count` on `ToggleGroup` items, as `Tabs.Tab` has.
6. **Facts strip.** Record headers hand-roll `<dl className="flex flex-wrap items-baseline gap-x-300 gap-y-075 …">` around `Fact` (four places). Recommendation: **kit**: a `Facts` container, or a `facts` prop on `RecordHeader`.
7. **Sheet modality.** The persona switch cannot be used while a sheet is open (Radix modal dismisses on outside pointer-down). Recommendation: **leave it**. The switch is prototype-only; a non-modal Sheet is worth adding only if the peek panel should stay open while the table is clicked, which is a product call.
8. **Persona switch.** Bespoke by decision: prototype-only, one line to delete, made of kit parts. **Not for the kit.**

## Where the data is driving the UI

Josef, 2026-09-02: "some of the data is starting to drive the UI". Three places, each with the rule it should follow.

- **The tree has ten columns**, one per store that had something to say: kind, C, I, A, requirements, controls, work, control set, actions. Rule for a list row: the name, one status, the number the reader sorts by, at most one bar, actions; everything else in the peek. Proposal: fold C/I/A into the Control set cell ("v2 pending approval · H-H-L") and Kind into the name's hint, leaving seven. Not done: Josef said the tree reads well, so it is his call.
- **The record header of a categorized element carries fourteen facts** on two lines: the node's eight plus the triad, controls, overlays and only-here. Rule: at most six facts under the title; the rest in the rail, which already has them. Proposal: for a categorized element drop Scopes, Requirements and Controls reached from the strip. Not done.
- **Requirement coverage has eight columns.** Method and Owner are record fields, not coverage facts. Proposal: drop them; they are on the requirement record. Not done.

The general rule: a screen is shaped by the reader's question, and the model supplies only the answer to that question. When a column, fact or block exists because the store has the field, it goes.

## The fold, for the record

The scope record (`/programs/$programId/systems/$scopeId`) is gone as a page. A categorized element's record (`/programs/$programId/components/$componentId`) carries an Overview tab and a Control set tab; the strip under the title shows the triad, the set's size and the revision in force and proposed; the rail gains Categorization and Environment. The old URL redirects to the element's record, `?tab=Revisions` and `?tab=Control set` to the Control set tab. The queue, the preview sheet, the Controls-tab summary and the component record's scope list all link to the element record now. The tab body lives in `src/components/app/scope-control-set.tsx`.

## Decisions and what landed (2026-09-02, evening)

Josef: "tackle any and all of this that's valid." Every flagged pattern was valid and went to the kit; the prototype already uses each one. What the spine surfaces should do now is in the last column.

| # | Flag | Decision | In the kit | In the prototype now |
|---|---|---|---|---|
| 1 | Preview sheet or rail | **kit** | `PreviewSheet` in patterns: Sheet with the Preview eyebrow and the id, the footer's first item opens the full record, `links` follow, `actions` on the right. Rule in Patterns.mdx ("Rail or sheet"). | `NodePreviewSheet` renders `PreviewSheet`. Its body is still app-local, which is right. |
| 2 | Tree grid | **kit** | `Table.Tree`, the cell lifted from `tree-cell.tsx`; indent on `space.200`. Docs say `role="treegrid"` on the Table, `aria-level` and `aria-expanded` on the rows. | `system-tree.tsx` uses `Table.Tree`; `tree-cell.tsx` is deleted. `kit/no-kit-shadow` names `TreeCell` as a legacy name so a copy cannot return. |
| 3 | Text links | **kit + sweep** | `TextLink`, `asChild` by default; `size` inherits unless set, `weight="medium"` for a link that stands alone. `Button variant="link"` is an action that reads as text. Lint `ledger/prefer-text-link`. | 147 classed Links, 2 `Button link asChild` and 9 `<button className="text-brand hover:underline">` swept by codemod; one status-coloured link (control-matrix) is `TextLink` with `text-danger`/`text-subtle` on top. Zero hand-classed links remain. |
| 4 | Column widths | **sweep** | `Table.Id` gains `width` for tables with no header row. Lint `ledger/no-colgroup`. | 100 colgroups by codemod, 19 by hand (percentages as `style`, conditional columns as conditional headers, header-less tables put `width` on the cells, `SctmCols` folded into `SctmHead`). Zero remain. |
| 5 | Filter counts | **kit** | `ToggleGroup` items take `count`, rendered as a Count after the label. | `requirement-coverage.tsx` passes `count`. |
| 6 | Facts strip | **kit** | `Fact.Group` is the `dl`; `RecordHeader` gains `facts`, rendered as a Fact.Group under the title on a rule. Rule of six in the docs. | The two record headers use `facts`; the two Section strips use `Fact.Group`. The categorized element still shows fourteen (see "Where the data is driving the UI"). |
| 7 | Sheet modality | **leave it** | Nothing. | Nothing. Listed in `docs/next.md` as a product call. |
| 8 | Persona switch | **bespoke** | Nothing. | Unchanged. |

Package commit 77232ad; prototype commit follows. The tracking list for everything after this is `docs/next.md`.
