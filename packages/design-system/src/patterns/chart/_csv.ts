import type { ChartTwin } from "./_types";

/*
 * The table twin as a CSV, and the file's name. RFC 4180: CRLF between lines, a cell with a comma,
 * a quote or a line break quoted. A text cell a spreadsheet would run as a formula (it starts with
 * `=`, `+`, `-`, `@`, a tab or a return) starts with an apostrophe instead, so a name typed into
 * the register is read as text; a plain number stays a number. The same rules as DataTable's
 * export. Pure, with no runtime imports, so `node --test` covers it.
 */

const FORMULA = /^[=+\-@\t\r]/;
const NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

/** One CSV cell: guarded against formulas, quoted when it must be. */
export const csvCell = (value: string): string => {
  const safe = FORMULA.test(value) && !NUMBER.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** The table twin as CSV: its headings, then a line per row, numbers raw and text as the table prints it. */
export function twinCsv(twin: ChartTwin): string {
  const head = twin.columns.map((c) => csvCell(c.label)).join(",");
  const rows = twin.rows.map((r) => r.cells.map((c) => csvCell(c.csv)).join(","));
  return [head, ...rows].join("\r\n");
}

/** A file name from a title: its letters and digits in any script, lower case, dashes between, the extension. */
export const fileName = (title: string, ext: string): string =>
  `${
    title
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "chart"
  }.${ext}`;
