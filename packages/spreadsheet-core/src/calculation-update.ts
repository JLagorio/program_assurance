import type { Cell, Sheet, Workbook } from "./types";
import { validateWorkbook } from "./workbook";

export type CalculationDelta = {
  workbookId: string;
  baseRevision: number;
  revision: number;
  name: string;
  sheets: {
    sheetId: string;
    metadata?: Omit<Sheet, "cells">;
    cells: { rowId: string; columnId: string; cell: Cell | null }[];
  }[];
};
export class CalculationResyncError extends Error {}
const metadata = ({ cells: _cells, ...sheet }: Sheet) => sheet;
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Undefined requests a full snapshot for a different workbook or structural mutation. */
export function createCalculationDelta(
  previous: Workbook,
  next: Workbook,
): CalculationDelta | undefined {
  if (
    previous.id !== next.id ||
    previous.sheets.length !== next.sheets.length ||
    previous.sheets.some((sheet, i) => {
      const other = next.sheets[i]!;
      return (
        sheet.id !== other.id ||
        sheet.name !== other.name ||
        sheet.mode !== other.mode ||
        !equal(
          sheet.rows.map((row) => row.id),
          other.rows.map((row) => row.id),
        ) ||
        !equal(
          sheet.columns.map((column) => column.id),
          other.columns.map((column) => column.id),
        )
      );
    })
  )
    return;
  const sheets: CalculationDelta["sheets"] = [];
  for (let i = 0; i < next.sheets.length; i++) {
    const before = previous.sheets[i]!;
    const after = next.sheets[i]!;
    const cells: CalculationDelta["sheets"][number]["cells"] = [];
    for (const rowId of new Set([...Object.keys(before.cells), ...Object.keys(after.cells)]))
      for (const columnId of new Set([
        ...Object.keys(before.cells[rowId] ?? {}),
        ...Object.keys(after.cells[rowId] ?? {}),
      ])) {
        const cell = after.cells[rowId]?.[columnId];
        if (!equal(before.cells[rowId]?.[columnId], cell))
          cells.push({ rowId, columnId, cell: cell ?? null });
      }
    const changedMetadata = !equal(metadata(before), metadata(after));
    if (cells.length || changedMetadata)
      sheets.push({
        sheetId: after.id,
        cells,
        ...(changedMetadata ? { metadata: metadata(after) } : {}),
      });
  }
  return {
    workbookId: next.id,
    baseRevision: previous.revision,
    revision: next.revision,
    name: next.name,
    sheets,
  };
}

export function applyCalculationDelta(
  previous: Workbook | undefined,
  delta: CalculationDelta,
): Workbook {
  if (!previous || previous.id !== delta.workbookId || previous.revision !== delta.baseRevision)
    throw new CalculationResyncError("Calculation session needs a fresh workbook snapshot.");
  const next = structuredClone(previous);
  next.revision = delta.revision;
  next.name = delta.name;
  const seen = new Set<string>();
  for (const patch of delta.sheets) {
    const index = next.sheets.findIndex((sheet) => sheet.id === patch.sheetId);
    if (index < 0 || seen.has(patch.sheetId))
      throw new CalculationResyncError("Calculation delta targets an unavailable sheet.");
    seen.add(patch.sheetId);
    const previousSheet = next.sheets[index]!;
    const sheet = patch.metadata
      ? { ...patch.metadata, cells: previousSheet.cells }
      : previousSheet;
    if (sheet.id !== patch.sheetId)
      throw new CalculationResyncError("Calculation delta has inconsistent sheet identity.");
    next.sheets[index] = sheet;
    for (const { rowId, columnId, cell } of patch.cells) {
      if (cell) (sheet.cells[rowId] ??= {})[columnId] = structuredClone(cell);
      else if (sheet.cells[rowId]) {
        delete sheet.cells[rowId]![columnId];
        if (!Object.keys(sheet.cells[rowId]!).length) delete sheet.cells[rowId];
      }
    }
  }
  validateWorkbook(next);
  return next;
}
