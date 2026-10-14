import { LIMITS, type CalculationResult, type Sheet } from "./types";

/** RFC-style quoted cells, including embedded separators, quotes and newlines. */
export function parseDelimited(text: string, separator: "," | "\t" = "\t"): string[][] {
  if (new TextEncoder().encode(text).byteLength > LIMITS.clipboardBytes)
    throw new Error("The pasted file exceeds 2 MB.");
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (!input) return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  let closed = false;
  let cells = 0;
  const push = () => {
    if (++cells > LIMITS.edits) throw new Error("Import at most 20,000 cells per batch.");
    if (value.length > LIMITS.inputLength) throw new Error("A cell exceeds 10,000 characters.");
    row.push(value);
    value = "";
    closed = false;
  };
  for (let index = 0; index < input.length; index++) {
    const char = input[index]!;
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          value += '"';
          index++;
        } else {
          quoted = false;
          closed = true;
        }
      } else value += char;
    } else if (char === separator) push();
    else if (char === "\n") {
      push();
      rows.push(row);
      row = [];
    } else if (char === '"' && value === "" && !closed) quoted = true;
    else if (closed) throw new Error("Unexpected text after a quoted cell.");
    else value += char;
  }
  if (quoted) throw new Error("A quoted cell was not closed.");
  if (value || row.length || !input.endsWith("\n")) {
    push();
    rows.push(row);
  }
  return rows;
}

export function escapeFormulaText(value: string): string {
  return /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? `'${value}` : value;
}

export function serializeDelimited(
  rows: string[][],
  separator: "," | "\t" = "\t",
  options: { escapeFormulas?: boolean } = {},
): string {
  return rows
    .map((row) =>
      row
        .map((source) => {
          const value = options.escapeFormulas ? escapeFormulaText(source) : source;
          return value.includes(separator) || /["\n\r]/.test(value)
            ? `"${value.replaceAll('"', '""')}"`
            : value;
        })
        .join(separator),
    )
    .join("\r\n");
}

/** Record exports are inert text. A freeform workbook may explicitly export source formulas. */
export function exportDelimited(
  sheet: Sheet,
  options: {
    separator?: "," | "\t";
    formulas?: boolean;
    headers?: boolean;
    results?: CalculationResult;
  } = {},
): string {
  const rows = sheet.rows.map((row) =>
    sheet.columns.map((column) => {
      const input = sheet.cells[row.id]?.[column.id]?.input ?? "";
      const result = options.results?.sheets[sheet.id]?.[row.id]?.[column.id];
      const value =
        options.formulas && sheet.mode !== "records" ? input : (result?.display ?? input);
      // Genuine numeric values remain numbers; formula-shaped record text is escaped.
      return !options.formulas || sheet.mode === "records"
        ? result?.type === "number"
          ? value
          : escapeFormulaText(value)
        : value;
    }),
  );
  if (options.headers) rows.unshift(sheet.columns.map((column) => escapeFormulaText(column.name)));
  return serializeDelimited(rows, options.separator ?? ",");
}
