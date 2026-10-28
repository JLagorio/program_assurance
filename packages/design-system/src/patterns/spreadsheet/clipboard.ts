import { selectionBounds, serializeTsv, type SpreadsheetClipboard } from "./model";
import type {
  SpreadsheetCell,
  SpreadsheetColumn,
  SpreadsheetProps,
  SpreadsheetRow,
  SpreadsheetSelection,
} from "./types";
/** Private local receipt. Plain system TSV stays interoperable; rich metadata stays within this mounted workbook. */
export function createClipboard({
  rows,
  columns,
  columnNumbers,
  selection,
  kind,
  sheetId,
  isCellLiteral,
  clipboardValue,
  displayValue,
  getClipboardStyle,
  canWrite,
}: {
  rows: readonly SpreadsheetRow[];
  columns: readonly SpreadsheetColumn[];
  columnNumbers: readonly number[];
  selection: SpreadsheetSelection;
  kind: "copy" | "cut";
  sheetId: string | undefined;
  isCellLiteral: SpreadsheetProps["isCellLiteral"];
  clipboardValue: SpreadsheetProps["clipboardValue"];
  displayValue: SpreadsheetProps["displayValue"];
  getClipboardStyle: SpreadsheetProps["getClipboardStyle"];
  canWrite: (cell: SpreadsheetCell) => boolean;
}): SpreadsheetClipboard {
  const range = selectionBounds(selection, rows, columns);
  if (!range) throw new Error("Select visible cells before copying.");
  const selectedRows = rows.slice(range.top, range.bottom + 1),
    selectedColumns = columns.slice(range.start, range.end + 1);
  const matrix = selectedRows.map((row) =>
    selectedColumns.map((column) => row.values[column.id] ?? ""),
  );
  const source = selectedRows.flatMap((row) =>
    selectedColumns.map((column) => ({
      rowId: row.id,
      columnId: column.id,
      value: row.values[column.id] ?? "",
    })),
  );
  if (kind === "cut" && source.some((cell) => !canWrite(cell)))
    throw new Error("The cut range includes a read-only cell. No cells were moved.");
  return {
    text: serializeTsv(matrix),
    source,
    kind,
    sheetId,
    literal: selectedRows.map((row) =>
      selectedColumns.map(
        (column) => isCellLiteral?.({ rowId: row.id, columnId: column.id }) ?? false,
      ),
    ),
    display: selectedRows.map((row) =>
      selectedColumns.map((column) => {
        const cell = { rowId: row.id, columnId: column.id };
        const raw = row.values[column.id] ?? "";
        return clipboardValue?.(cell, raw) ?? displayValue?.(cell, raw) ?? raw;
      }),
    ),
    styles: getClipboardStyle
      ? selectedRows.map((row) =>
          selectedColumns.map((column) =>
            structuredClone(getClipboardStyle({ rowId: row.id, columnId: column.id }) ?? null),
          ),
        )
      : undefined,
    rowNumbers: selectedRows.map((row, index) => row.rowNumber ?? range.top + index + 1),
    columnNumbers: columnNumbers.slice(range.start, range.end + 1),
  };
}
