# Ledger spreadsheet core

Framework-independent workbook operations for Program Assurance, implemented
independently of Macro. No Macro source is included. Calculation uses published
`@ironcalc/wasm` 0.8.4 (MIT/Apache-2.0); XLSX uses ExcelJS 4.4.0 (MIT).

Cells use stable sheet, row and column IDs. A1 references are a calculation and
interchange representation, never a requirement/control identity. Record sheets
bind cells to `{ recordId, fieldId, revision }` and keep content literal. Formulas
belong in freeform sheets. The host owns authorization, source loading, reviewed
apply-back, persistence and audit events.

```ts
import { createWorkbook, applyOperation } from "@ledger/spreadsheet-core";
import { createCalculationClient } from "@ledger/spreadsheet-core/worker-client";

const initial = createWorkbook("Coverage analysis");
const workbook = applyOperation(initial, {
  type: "paste",
  sheetId: initial.sheets[0]!.id,
  start: { row: 0, column: 0 },
  values: [["2", "3", "=SUM(A1:B1)"]],
});
const calculation = createCalculationClient();
const result = await calculation.calculate(workbook);
// result.sheets[sheetId][rowId][columnId] = { type, value, display, error? }
calculation.dispose();
```

## Transactions and presentation

`applyOperation` validates each immutable transaction before returning a revision.
Typing, paste and fill enforce record column validation and read-only axes. Visual
formatting can decorate protected source cells without changing their data type.
The host must reconstruct record projections from authorized source records.
`createHistory` groups operations into local undo steps; it is not remote rollback.

`paste-cells` accepts an explicit stable-ID edit/style plan with `all`, `values` or
`formatting` mode. This supports filtered/hidden views without accidentally writing
intervening cells. The host plans formula translation, literal encoding and cut
source clearing before submitting one atomic batch. Style replacements preserve
destination bindings, notes and validation. Formatting-only paste preserves a
literal-text marker; record sheets prohibit pasted number-format/type overrides.
External TSV has no styling payload. Cut/copy metadata transfer is host-owned.

`set-conditional-formats` stores bounded numeric comparisons, literal text
contains/equality and blank rules. `conditionalCellStyle` returns a visual overlay;
later matching rules override earlier fields. It never executes user JavaScript
or changes values, number formats or source field types. Errors do not match.
Rules target stable row/column IDs, shrink on deletion, remap on sheet duplication
and do not automatically expand to new records. Supply current calculated values
for formula-aware appearance. Empty optional rules are omitted from snapshots.

Axis operations retain identities and rewrite direct A1 references, including
absolute, cross-sheet and whole-axis references. `INDIRECT`, structured, external
and 3-D references block structural mutations that cannot be safely rewritten.
Source structure remains source-managed. Duplicating a record sheet creates an
independent literal analysis copy with write-back bindings removed.

## Calculation, search and formula assistance

A worker retains one IronCalc model. After an acknowledged result, compatible
revisions send sparse cell/metadata deltas. Changed inputs update the model;
structural changes rebuild it. Presentation-only revisions reuse raw calculated
values and refresh number displays without engine evaluation. This avoids model
reconstruction, but input changes still evaluate through the upstream engine and
collect results; it is not a guarantee of fully localized dependency evaluation.
The main thread currently compares snapshots to construct deltas.

Request IDs, workbook revisions and acknowledged delta bases reject stale results.
Superseding/canceling an active calculation terminates it. Timeouts, worker errors
and lost state recover with a fresh snapshot (one resync retry). No calculated
result is written into authored source data. Clock/random formulas return explicit
errors because the pinned adapter has no shared clock/seed. Unsupported formulas
remain visible errors; there is no fallback JavaScript evaluator.

`findCells` searches literal authored input or current calculated display across
selected sheets, excluding hidden axes by default. Results use stable IDs and
canonical addresses. `replaceMatches` only replaces authored input, checks stale
matches and protections, and returns one atomic workbook revision. The host can
commit it with `history.replace`. Search/replacement text is not a regular expression.
`selectionStatistics` counts cells, populated values, numeric values and errors,
and provides sum/average/min/max. Pass explicit selected row/column IDs and current
results; text digits remain text.

`FORMULA_FUNCTIONS`, `formulaSuggestions` and `formulaSignature` provide a small
curated catalog and quote-aware completion/signature context without loading WASM.
They are not an exhaustive list of IronCalc functions. `formulaReferences` reports
UTF-16 source spans and zero-based A1 cell/range coordinates, including quoted
sheet names; whole-axis references are not returned for overlay rendering.

## Interchange capability matrix

| Capability                                                    | Native JSON | XLSX                                                                               | CSV / TSV                                                    | Internal rich paste                              |
| ------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| Inputs and formulas                                           | Exact       | Supported formulas retain source; engine compatibility varies                      | Text fields; export policy chooses authored/displayed values | Planned input edits; host translates references  |
| Stable IDs, source bindings, revision                         | Exact       | Independent analysis copy; identities and bindings omitted                         | Omitted                                                      | Destination identities/bindings preserved        |
| Fonts, colors, borders, alignment, wrap, number formats       | Exact       | Common subset; complex borders/custom formats simplified with import warnings      | Omitted                                                      | Style replacement or formatting-only             |
| Row heights, column widths, hidden axes, frozen panes         | Exact       | Supported                                                                          | Omitted                                                      | Omitted                                          |
| Notes and literal list validation                             | Exact       | Supported; formula/range validation warns and is omitted                           | Omitted                                                      | Destination retained; source metadata not copied |
| Conditional rules                                             | Exact       | Supported numeric/text/blank rules round-trip; advanced rules warn and are omitted | Omitted                                                      | Not copied                                       |
| Merges, charts, pivots, defined names, macros, rich text runs | Not modeled | Not preserved; rich text imports as plain text                                     | Not modeled                                                  | Not modeled                                      |

Conditional XLSX export cannot retain explicit `false` font-emphasis overrides
with the pinned ExcelJS writer; it rejects such rules and directs the user to a
native snapshot. It also rejects scopes requiring over 4,096 disjoint rectangles.
Supported exported rules use safe native Excel expressions, not opaque metadata.
Import accepts those expressions and simple numeric `cellIs` rules. Unsupported
rule semantics and non-Cartesian scopes produce warnings. Rule IDs are regenerated
on XLSX import; their scopes and supported appearance are preserved.

`createWorkbookFileClient` runs XLSX work in a separate cancelable worker.
`importXlsx` returns fidelity warnings. JSON snapshots preserve modeled data, not
approval history or external authorization. CSV/TSV supports quoted multiline
fields; record exports escape formula-shaped text.

## Bounds and verification

Limits: 32 sheets, 20,000 rows, 256 columns, 200,000 populated cells per workbook,
20,000 cells per mutation, and 100 conditional rules per sheet (200,000 scoped
cells each). XLSX input is bounded to 10 MB compressed / 80 MB expanded with a
45-second file-worker deadline. Bounds are not a performance guarantee at every
combination, and formula/XLSX compatibility is not complete Excel parity.

Run `npm test -w packages/spreadsheet-core` and
`npm run typecheck -w packages/spreadsheet-core`. Tests load real WASM and XLSX,
compare retained versus fresh calculation after input/structure/spill changes,
and cover delta recovery, atomic rich paste, literals, conditional JSON/XLSX,
reference shifts, search/replacement and summaries.

With Vite running, `node scripts/test-spreadsheet-core-browser.mjs` checks both
browser workers, including retained deltas and cancel/recovery. Set `BROWSER` to
`chromium` (default), `firefox` or `webkit` after installing the corresponding
Playwright browser. `node scripts/test-assurance-workbench.mjs` additionally needs
local Supabase and uses a disposable workspace for review/apply, persistence,
interchange, mobile layout and lost-response recovery. Both default to
`http://localhost:8080`; set `APP_TEST_URL` to override.

Primary references:

- https://github.com/ironcalc/IronCalc/tree/main/bindings/wasm
- https://docs.ironcalc.com/programming/javascript-bindings.html
- https://github.com/exceljs/exceljs
