import { cellAddress } from "./address";
import { applyOperation } from "./workbook";
import {
  LIMITS,
  type CalculatedCell,
  type CalculationResult,
  type Sheet,
  type Workbook,
  type CellEdit,
} from "./types";

function valueAt(
  sheet: Sheet,
  rowId: string,
  columnId: string,
  results?: CalculationResult,
): CalculatedCell {
  const calculated = results?.sheets[sheet.id]?.[rowId]?.[columnId];
  if (calculated) return calculated;
  const cell = sheet.cells[rowId]?.[columnId];
  const input = cell?.input ?? "";
  if (!input) return { type: "blank", value: null, display: "" };
  const column = sheet.columns.find((column) => column.id === columnId);
  const literal =
    cell?.style?.format === "text" ||
    (sheet.mode === "records" && column?.type !== "number" && column?.type !== "boolean");
  if (
    !literal &&
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(input) &&
    Number.isFinite(Number(input))
  )
    return { type: "number", value: Number(input), display: input };
  return { type: "text", value: input, display: input };
}

export type SelectionStatistics = {
  cells: number;
  nonEmpty: number;
  numbers: number;
  sum: number;
  average: number | null;
  min: number | null;
  max: number | null;
  errors: number;
};
/** Supply current calculation results to include formula/spill values. Text digits are not numbers. */
export function selectionStatistics(
  sheet: Sheet,
  rowIds: readonly string[],
  columnIds: readonly string[],
  results?: CalculationResult,
): SelectionStatistics {
  const rows = new Set(sheet.rows.map((row) => row.id));
  const columns = new Set(sheet.columns.map((column) => column.id));
  if (
    rowIds.length * columnIds.length > LIMITS.cells ||
    new Set(rowIds).size !== rowIds.length ||
    new Set(columnIds).size !== columnIds.length ||
    rowIds.some((id) => !rows.has(id)) ||
    columnIds.some((id) => !columns.has(id))
  )
    throw new Error("Choose a bounded selection of existing cells.");
  const stats: SelectionStatistics = {
    cells: rowIds.length * columnIds.length,
    nonEmpty: 0,
    numbers: 0,
    sum: 0,
    average: null,
    min: null,
    max: null,
    errors: 0,
  };
  for (const rowId of rowIds)
    for (const columnId of columnIds) {
      const cell = valueAt(sheet, rowId, columnId, results);
      if (cell.type !== "blank") stats.nonEmpty++;
      if (cell.type === "error") stats.errors++;
      if (cell.type === "number" && typeof cell.value === "number") {
        stats.numbers++;
        stats.sum += cell.value;
        stats.min = stats.min === null ? cell.value : Math.min(stats.min, cell.value);
        stats.max = stats.max === null ? cell.value : Math.max(stats.max, cell.value);
      }
    }
  if (stats.numbers) stats.average = stats.sum / stats.numbers;
  return stats;
}
export type FindOptions = {
  query: string;
  matchCase?: boolean;
  wholeCell?: boolean;
  searchIn?: "input" | "display";
  sheetIds?: readonly string[];
  includeHidden?: boolean;
  limit?: number;
};
export type FindMatch = {
  sheetId: string;
  rowId: string;
  columnId: string;
  address: string;
  input: string;
  text: string;
  readonly: boolean;
  searchIn: "input" | "display";
};
function matches(
  text: string,
  query: string,
  options: Pick<FindOptions, "matchCase" | "wholeCell">,
): boolean {
  const value = options.matchCase ? text : text.toLocaleLowerCase("en-US");
  const needle = options.matchCase ? query : query.toLocaleLowerCase("en-US");
  return options.wholeCell ? value === needle : value.includes(needle);
}
/** Literal substring search, never user-authored regular expressions. Order is sheet/row/column. */
export function findCells(
  workbook: Workbook,
  options: FindOptions,
  results?: CalculationResult,
): { matches: FindMatch[]; truncated: boolean } {
  if (options.searchIn === "display" && results && results.revision !== workbook.revision)
    throw new Error("Wait for current calculation before searching displayed values.");
  if (typeof options.query !== "string" || options.query.length > LIMITS.inputLength)
    throw new Error("Find text exceeds the cell limit.");
  const found: FindMatch[] = [];
  if (!options.query) return { matches: found, truncated: false };
  const limit = options.limit ?? LIMITS.edits;
  if (!Number.isInteger(limit) || limit < 1 || limit > LIMITS.edits)
    throw new Error("Invalid find result limit.");
  const scope = options.sheetIds && new Set(options.sheetIds);
  const searchIn = options.searchIn ?? "input";
  for (const sheet of workbook.sheets) {
    if (scope && !scope.has(sheet.id)) continue;
    for (let r = 0; r < sheet.rows.length; r++) {
      const row = sheet.rows[r]!;
      if (!options.includeHidden && row.hidden) continue;
      const entries =
        searchIn === "display"
          ? { ...sheet.cells[row.id], ...results?.sheets[sheet.id]?.[row.id] }
          : sheet.cells[row.id];
      if (!entries) continue;
      for (let c = 0; c < sheet.columns.length; c++) {
        const column = sheet.columns[c]!;
        if ((!options.includeHidden && column.hidden) || !(column.id in entries)) continue;
        const input = sheet.cells[row.id]?.[column.id]?.input ?? "";
        const text =
          searchIn === "display" ? valueAt(sheet, row.id, column.id, results).display : input;
        if (!matches(text, options.query, options)) continue;
        if (found.length === limit) return { matches: found, truncated: true };
        found.push({
          sheetId: sheet.id,
          rowId: row.id,
          columnId: column.id,
          address: cellAddress({ row: r, column: c }),
          input,
          text,
          readonly: !!(row.readonly || column.readonly),
          searchIn,
        });
      }
    }
  }
  return { matches: found, truncated: false };
}
/** All replacements are checked before returning. The caller commits this result as one history entry. */
export function replaceMatches(
  workbook: Workbook,
  found: readonly FindMatch[],
  query: string,
  replacement: string,
  options: Pick<FindOptions, "matchCase" | "wholeCell"> = {},
): Workbook {
  if (
    !query ||
    typeof replacement !== "string" ||
    query.length > LIMITS.inputLength ||
    replacement.length > LIMITS.inputLength ||
    found.length > LIMITS.edits
  )
    throw new Error("Choose a bounded, nonempty replacement.");
  const bySheet = new Map<string, CellEdit[]>();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    options.wholeCell ? `^${escaped}$` : escaped,
    options.matchCase ? "g" : "gi",
  );
  const seen = new Set<string>();
  for (const match of found) {
    if (match.searchIn === "display")
      throw new Error("Replace authored input, not calculated display values.");
    const sheet = workbook.sheets.find((sheet) => sheet.id === match.sheetId);
    const input = sheet?.cells[match.rowId]?.[match.columnId]?.input ?? "";
    const key = JSON.stringify([match.sheetId, match.rowId, match.columnId]);
    if (!sheet || input !== match.input || !matches(input, query, options) || seen.has(key))
      throw new Error("The found cells changed. Find again before replacing.");
    seen.add(key);
    const edits = bySheet.get(sheet.id) ?? [];
    edits.push({
      rowId: match.rowId,
      columnId: match.columnId,
      value: input.replace(pattern, () => replacement),
    });
    bySheet.set(sheet.id, edits);
  }
  let next = workbook;
  for (const [sheetId, edits] of bySheet)
    next = applyOperation(next, { type: "edit", sheetId, edits });
  return next === workbook ? workbook : { ...next, revision: workbook.revision + 1 };
}
