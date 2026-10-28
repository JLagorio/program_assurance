import { z } from "zod";
import { columnName, formulaReferences, type Sheet } from "@ledger/spreadsheet-core";
type CellIdentity = { rowId: string; columnId: string };
type WorkbookSelection = { anchor: CellIdentity; focus: CellIdentity };
type WorkbookFormulaReference = { label: string; selection: WorkbookSelection };

export const workbookViewSchema = z.object({
  activeSheet: z.string().min(1),
  view: z.enum(["grid", "matrix", "analysis"]),
  layout: z
    .object({
      columns: z
        .array(
          z.object({
            id: z.string(),
            width: z.number().min(40).max(1000).optional(),
            hidden: z.boolean().optional(),
          }),
        )
        .max(300),
      rows: z
        .array(
          z.object({
            id: z.string(),
            height: z.number().min(20).max(800).optional(),
            hidden: z.boolean().optional(),
          }),
        )
        .max(10000),
      frozenRows: z.number().int().min(0).max(1),
      frozenColumns: z.number().int().min(0).max(1),
    })
    .optional(),
  questions: z.record(
    z.object({
      search: z.string().max(10000),
      filterColumn: z.string(),
      sort: z.string(),
      descending: z.boolean(),
    }),
  ),
  analysis: z.record(z.object({ group: z.string(), measure: z.string() })).default({}),
});
/** Convert formula coordinates to identities; unrelated-sheet references never paint this grid. */
export function workbookFormulaReferences(sheet: Sheet, input: string): WorkbookFormulaReference[] {
  return formulaReferences(input).flatMap((reference) => {
    if (reference.sheet && reference.sheet.toLocaleLowerCase() !== sheet.name.toLocaleLowerCase())
      return [];
    const { start, end } = reference.range;
    const firstRow = sheet.rows[start.row];
    const lastRow = sheet.rows[end.row];
    const firstColumn = sheet.columns[start.column];
    const lastColumn = sheet.columns[end.column];
    if (!firstRow || !lastRow || !firstColumn || !lastColumn) return [];
    return [
      {
        label: reference.text,
        selection: {
          anchor: { rowId: firstRow.id, columnId: firstColumn.id },
          focus: { rowId: lastRow.id, columnId: lastColumn.id },
        },
      },
    ];
  });
}
export function workbookRangeReference(sheet: Sheet, selection: WorkbookSelection): string {
  const address = (cell: WorkbookSelection["anchor"]) => {
    const row = sheet.rows.findIndex((row) => row.id === cell.rowId);
    const column = sheet.columns.findIndex((column) => column.id === cell.columnId);
    if (row < 0 || column < 0) throw new Error("This cell is no longer in the sheet.");
    return `${columnName(column)}${row + 1}`;
  };
  const first = address(selection.anchor);
  const last = address(selection.focus);
  return first === last ? first : `${first}:${last}`;
}
