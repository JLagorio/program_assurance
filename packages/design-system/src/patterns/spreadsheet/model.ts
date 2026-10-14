import type {
  SpreadsheetCell,
  SpreadsheetColumn,
  SpreadsheetEdit,
  SpreadsheetProps,
  SpreadsheetRow,
  SpreadsheetSelection,
} from "./types";

/** Spreadsheet coordinates are display addresses; persistent identity always uses ids. */
export function columnName(index: number): string {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    value--;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
}

export function parseAddress(value: string): { row: number; column: number } | null {
  const match = /^([a-z]+)([1-9]\d*)$/i.exec(value.trim());
  if (!match) return null;
  let column = 0;
  for (const letter of match[1]!.toUpperCase()) column = column * 26 + letter.charCodeAt(0) - 64;
  const row = Number(match[2]) - 1;
  return Number.isSafeInteger(row) && Number.isSafeInteger(column)
    ? { row, column: column - 1 }
    : null;
}

export function selectionBounds(
  selection: SpreadsheetSelection | null,
  rows: readonly SpreadsheetRow[],
  columns: readonly SpreadsheetColumn[],
) {
  if (!selection) return null;
  const r1 = rows.findIndex((row) => row.id === selection.anchor.rowId);
  const r2 = rows.findIndex((row) => row.id === selection.focus.rowId);
  const c1 = columns.findIndex((column) => column.id === selection.anchor.columnId);
  const c2 = columns.findIndex((column) => column.id === selection.focus.columnId);
  if (Math.min(r1, r2, c1, c2) < 0) return null;
  return {
    top: Math.min(r1, r2),
    bottom: Math.max(r1, r2),
    start: Math.min(c1, c2),
    end: Math.max(c1, c2),
  };
}

/** Excel-compatible quoted TSV, preserving tabs, newlines and quotes inside cells. */
export function serializeTsv(rows: readonly (readonly string[])[]): string {
  return rows
    .map((row) =>
      row
        .map((value) => (/\t|\r|\n|"/.test(value) ? `"${value.replaceAll('"', '""')}"` : value))
        .join("\t"),
    )
    .join("\r\n");
}

export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index]!;
    if (char === '"' && (quoted || value.length === 0)) {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index++;
      } else quoted = !quoted;
    } else if (!quoted && (char === "\t" || char === "\n" || char === "\r")) {
      row.push(value);
      value = "";
      if (char !== "\t") {
        rows.push(row);
        row = [];
        if (char === "\r" && text[index + 1] === "\n") index++;
      }
    } else value += char;
  }
  if (quoted) throw new Error("The pasted text has an unclosed quoted value.");
  if (row.length || value || !rows.length) rows.push([...row, value]);
  const width = rows.reduce((widest, entry) => Math.max(widest, entry.length), 0);
  return rows.map((entry) => Array.from({ length: width }, (_, index) => entry[index] ?? ""));
}

export function validateCell(column: SpreadsheetColumn, value: string): string | null {
  if (value === "" || value.startsWith("=")) return null;
  if (column.type === "number" && (!value.trim() || !Number.isFinite(Number(value))))
    return "Enter a number or a formula.";
  if (column.type === "boolean" && !["true", "false"].includes(value))
    return "Use true or false for this checkbox.";
  if (column.type === "choice" && !column.options?.some((option) => option.value === value))
    return "Choose one of the available values.";
  if (column.type === "date") {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
    if (!day || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== value)
      return "Enter a valid date as YYYY-MM-DD.";
  }
  return null;
}

/** Presentation can omit identities without renumbering workbook coordinates. */
export function spreadsheetView(
  rows: readonly SpreadsheetRow[],
  columns: readonly SpreadsheetColumn[],
  hiddenRowIds: readonly string[] = [],
  hiddenColumnIds: readonly string[] = [],
) {
  const hiddenRows = new Set(hiddenRowIds);
  const hiddenColumns = new Set(hiddenColumnIds);
  return {
    rows: rows
      .map((row, index) => (row.rowNumber === undefined ? { ...row, rowNumber: index + 1 } : row))
      .filter((row) => !hiddenRows.has(row.id)),
    columns: columns.filter((column) => !hiddenColumns.has(column.id)),
    columnNumbers: columns.flatMap((column, index) =>
      hiddenColumns.has(column.id) ? [] : [index],
    ),
  };
}

export type SpreadsheetClipboard = {
  text: string;
  display: string[][];
  literal?: boolean[][] | undefined;
  rowNumbers: number[];
  columnNumbers: number[];
  source: SpreadsheetEdit[];
  kind: "copy" | "cut";
  sheetId: string | undefined;
};

/** Build one atomic write intent. A cut is not destructive until every destination is accepted. */
export function spreadsheetPaste({
  rows,
  columns,
  columnNumbers,
  selection,
  text,
  clipboard,
  valuesOnly = false,
  sheetId,
  translateInput,
  preparePasteValue,
  valueAt,
  canWrite,
}: {
  rows: readonly SpreadsheetRow[];
  columns: readonly SpreadsheetColumn[];
  columnNumbers: readonly number[];
  selection: SpreadsheetSelection;
  text: string;
  clipboard: SpreadsheetClipboard | null;
  valuesOnly?: boolean | undefined;
  sheetId?: string | undefined;
  translateInput?: SpreadsheetProps["translateInput"];
  preparePasteValue?: SpreadsheetProps["preparePasteValue"];
  valueAt: (cell: SpreadsheetCell) => string;
  canWrite: (cell: SpreadsheetCell) => boolean;
}): { edits: SpreadsheetEdit[]; cut: boolean } {
  const range = selectionBounds(selection, rows, columns);
  if (!range) throw new Error("Select visible cells before pasting.");
  const origin = clipboard?.text === text ? clipboard : null;
  const cells = valuesOnly && origin ? origin.display : parseTsv(text);
  const width = cells[0]?.length ?? 0;
  const single = cells.length === 1 && width === 1 && origin?.kind !== "cut";
  const endRow = single ? range.bottom : range.top + cells.length - 1;
  const endColumn = single ? range.end : range.start + width - 1;
  if (endRow >= rows.length || endColumn >= columns.length)
    throw new Error(
      "The pasted range is larger than this sheet. Add rows or columns before pasting.",
    );
  const edits = new Map<string, SpreadsheetEdit>();
  const key = (cell: SpreadsheetCell) => JSON.stringify([cell.rowId, cell.columnId]);
  if (origin?.kind === "cut") {
    if (origin.sheetId !== sheetId)
      throw new Error(
        "Paste cut cells into their original sheet. Use Copy to transfer cells between sheets.",
      );
    for (const source of origin.source) {
      if (!canWrite(source))
        throw new Error("The cut range includes a read-only cell. No cells were moved.");
      if (valueAt(source) !== source.value)
        throw new Error("The cut cells changed. Cut them again before pasting.");
      edits.set(key(source), { ...source, value: "" });
    }
  }
  for (let row = range.top; row <= endRow; row++) {
    for (let column = range.start; column <= endColumn; column++) {
      const sourceRow = single ? 0 : row - range.top;
      const sourceColumn = single ? 0 : column - range.start;
      const cell = { rowId: rows[row]!.id, columnId: columns[column]!.id };
      if (!canWrite(cell))
        throw new Error("The pasted range includes a read-only cell. No cells were changed.");
      let input = cells[sourceRow]![sourceColumn]!;
      if (valuesOnly || origin?.literal?.[sourceRow]?.[sourceColumn])
        input = preparePasteValue
          ? preparePasteValue(cell, input)
          : input.startsWith("=")
            ? `'${input}`
            : input;
      else if (origin?.kind === "copy" && translateInput)
        input = translateInput(
          input,
          { row: origin.rowNumbers[sourceRow]! - 1, column: origin.columnNumbers[sourceColumn]! },
          { row: (rows[row]!.rowNumber ?? row + 1) - 1, column: columnNumbers[column]! },
        );
      edits.set(key(cell), { ...cell, value: input });
    }
  }
  return { edits: [...edits.values()], cut: origin?.kind === "cut" };
}

/** Measure actual word wrapping; total text width alone can underestimate line count. */
export function wrappedLineCount(
  text: string,
  availableWidth: number,
  measure: (text: string) => number,
): number {
  const available = Math.max(1, availableWidth);
  let count = 0;
  for (const paragraph of text.split(/\r?\n/)) {
    let lines = 1;
    let width = 0;
    for (const word of paragraph.match(/\S+|\s+/gu) ?? []) {
      const wordWidth = measure(word);
      if (wordWidth <= available) {
        if (width && width + wordWidth > available) {
          lines++;
          width = 0;
        }
        width += wordWidth;
      } else {
        for (const character of word) {
          const characterWidth = measure(character);
          if (width && width + characterWidth > available) {
            lines++;
            width = 0;
          }
          width += characterWidth;
        }
      }
    }
    count += lines;
  }
  return count;
}

/** Repeat a source block along one axis. Values/formulas only; no inferred series or styles. */
export function spreadsheetFill({
  rows,
  columns,
  columnNumbers,
  source,
  target,
  translateInput,
  isCellLiteral,
  preparePasteValue,
  canWrite,
}: {
  rows: readonly SpreadsheetRow[];
  columns: readonly SpreadsheetColumn[];
  columnNumbers: readonly number[];
  source: SpreadsheetSelection;
  target: SpreadsheetSelection;
  translateInput?: SpreadsheetProps["translateInput"];
  isCellLiteral?: SpreadsheetProps["isCellLiteral"];
  preparePasteValue?: SpreadsheetProps["preparePasteValue"];
  canWrite: (cell: SpreadsheetCell) => boolean;
}): SpreadsheetEdit[] {
  const from = selectionBounds(source, rows, columns);
  const to = selectionBounds(target, rows, columns);
  if (!from || !to) throw new Error("The fill selection is no longer visible.");
  if (
    to.top > from.top ||
    to.bottom < from.bottom ||
    to.start > from.start ||
    to.end < from.end ||
    !(
      (to.top === from.top && to.bottom === from.bottom) ||
      (to.start === from.start && to.end === from.end)
    )
  )
    throw new Error("Extend the fill in one direction from its source cells.");
  // Validate every cell before translating or constructing a write intent.
  for (let row = to.top; row <= to.bottom; row++)
    for (let column = to.start; column <= to.end; column++)
      if (!canWrite({ rowId: rows[row]!.id, columnId: columns[column]!.id }))
        throw new Error("The fill range includes a read-only cell. No cells were changed.");
  const repeat = (index: number, start: number, end: number) =>
    start + ((((index - start) % (end - start + 1)) + (end - start + 1)) % (end - start + 1));
  const edits: SpreadsheetEdit[] = [];
  for (let row = to.top; row <= to.bottom; row++) {
    for (let column = to.start; column <= to.end; column++) {
      if (row >= from.top && row <= from.bottom && column >= from.start && column <= from.end)
        continue;
      const sourceRow = repeat(row, from.top, from.bottom);
      const sourceColumn = repeat(column, from.start, from.end);
      const input = rows[sourceRow]!.values[columns[sourceColumn]!.id] ?? "";
      const cell = { rowId: rows[row]!.id, columnId: columns[column]!.id };
      const literal = isCellLiteral?.({
        rowId: rows[sourceRow]!.id,
        columnId: columns[sourceColumn]!.id,
      });
      const next = literal
        ? preparePasteValue
          ? preparePasteValue(cell, input)
          : input.startsWith("=")
            ? `'${input}`
            : input
        : (translateInput?.(
            input,
            {
              row: (rows[sourceRow]!.rowNumber ?? sourceRow + 1) - 1,
              column: columnNumbers[sourceColumn]!,
            },
            { row: (rows[row]!.rowNumber ?? row + 1) - 1, column: columnNumbers[column]! },
          ) ?? input);
      edits.push({ ...cell, value: next });
    }
  }
  return edits;
}
