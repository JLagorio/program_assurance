# Ledger spreadsheet core

Framework-independent workbook operations for Program Assurance. This package is
implemented independently of the Macro example. It imports no example code and
uses the published `@ironcalc/wasm` 0.8.4 (MIT/Apache-2.0) calculation engine and
ExcelJS 4.4.0 (MIT) XLSX reader/writer.

The workbook stores authored input and formatting under stable sheet, row and
column IDs. A1 addresses are a calculation and interchange representation, never
the identity of a requirement or control. Record sheets can bind cells to
`{ recordId, fieldId, revision }`. Their content is literal; formulas belong in
freeform analysis sheets. The host owns source loading, permissions, revisions,
reviewed apply-back, persistence and audit events.

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

`applyOperation` supports edit, paste, fill (relative formulas and numeric
series), format, clear, sheet lifecycle, row/column insertion/deletion, frozen
panes and column sizing. It validates the entire operation before returning a new
revision. Failed operations leave the input unchanged. Record column validation
and read-only rows/columns apply equally to typing, paste and fill. Snapshots
validate shape and preserve bound source content, including read-only header
values. The host must reconstruct record projections from authorized data.

Axis changes preserve row/column identities and rewrite direct A1 references,
including absolute references, cross-sheet references and whole-row/column
ranges. Dynamic `INDIRECT`, structured, external and 3-D references block
structural mutations because they cannot be safely rewritten. Record structure
is managed by the source, not by spreadsheet insert/delete. Duplicating a record
sheet creates an independent literal analysis snapshot and removes write-back
bindings.

`createHistory` groups a mutation into one undo step. Revisions remain monotonic
on undo/redo. This is local workbook history; it must not be used as a remote
record rollback mechanism. There is no CRDT transport or collaboration backend
in this package.

`createCalculationClient` runs the actual IronCalc engine in a Vite module
worker. New requests supersede older ones. A response must match both its
request ID and workbook revision. Timeouts terminate the worker, and later
requests start a fresh one. Calculated results are never written into source
cells. Clock/random functions return an explicit error because upstream 0.8.4
does not provide this adapter a shared clock/seed. Unsupported formulas remain
visible as errors; there is no fallback JavaScript evaluator.

`createWorkbookFileClient` from `/file-client` runs XLSX work in a separate
cancelable worker. `importXlsx` returns a workbook and explicit fidelity warnings.
Supported interchange includes cells, formulas, common formatting, column widths
and frozen panes. Merges, charts, pivots, names, macros, cell validation, comments,
links and advanced formats are not preserved. Native JSON snapshots preserve
stable identities and bindings; XLSX import creates an independent analysis copy.
CSV/TSV parsing supports quoted multiline fields, and record exports escape
formula-shaped text.

Limits are intentional: 32 sheets, 20,000 rows, 256 columns, 200,000 populated
cells per workbook and 20,000 cells per mutation. XLSX input is limited to 10 MB
compressed / 80 MB expanded directory size, with a 45-second worker deadline.
These are validation bounds, not a promise of spreadsheet performance at every
combination of those limits. Calculation currently rebuilds its engine model per
revision; incremental evaluation and large-workbook benchmarks remain follow-up
work. Formula and XLSX compatibility are not complete Excel parity.

Run `npm run test -w packages/spreadsheet-core` and
`npm run typecheck -w packages/spreadsheet-core`. Tests load the real published
WASM and independently create XLSX files, in addition to atomic edits, reference
shifts, serialization, CSV safety and worker failure/staleness coverage.

With the local Vite app running, `node scripts/test-spreadsheet-core-browser.mjs`
checks both real browser workers. `node scripts/test-assurance-workbench.mjs`
also requires local Supabase and uses a disposable workspace to check staged
record edits, atomic review/apply, analysis persistence, XLSX round trips,
390px layout and exact retry after a committed request loses its response.
Both scripts default to `http://localhost:8080`; set `APP_TEST_URL` to override.

Primary dependency references:

- https://github.com/ironcalc/IronCalc/tree/main/bindings/wasm
- https://docs.ironcalc.com/programming/javascript-bindings.html
- https://github.com/exceljs/exceljs
