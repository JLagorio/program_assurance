import type { Row, RowData } from "@tanstack/react-table";

import { downloadText } from "../../lib/download";
import type { DataTableFeatures } from "./features";
import type { DataTableInstance } from "./use-data-table";

/*
 * Export. The rows the filters leave, in the sort the reader chose, every page, whatever is open or
 * folded: a tree's parts and a group's rows are all there, and a tree's rows say their level. The
 * columns the reader shows, in their order. A kind's value exports as text; a custom column exports
 * what its `text` says, or nothing; the actions column never exports. A CSV cell that a spreadsheet
 * would run as a formula is written as text.
 */

export type ExportedRows = { header: string[]; rows: string[][] };

export type ExportOptions = {
  /** A tree's first column: each row's level, 1 for the top. Its header, "Level" unsaid; `false` leaves it out. */
  level?: string | false | undefined;
};

export type CsvOptions = ExportOptions & {
  /**
   * Keep a value that starts with `=`, `+`, `-`, `@`, a tab or a return as it is. Off, so a
   * spreadsheet shows such a value (a name, a note) as text instead of running it as a formula;
   * a plain number stays a number either way.
   */
  keepFormulas?: boolean | undefined;
};

const text = (v: unknown): string =>
  v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);

/** The rows the filters leave, in the sort chosen, before any is folded or paged, in drawn order. */
function exportedRows<TData extends RowData>(table: DataTableInstance<TData>) {
  const out: { row: Row<DataTableFeatures, TData>; level: number }[] = [];
  const walk = (rows: Row<DataTableFeatures, TData>[], level: number) => {
    for (const row of rows) {
      // A group heading is not a record: its rows follow at the same level.
      if (row.getIsGrouped()) {
        walk(row.subRows, level);
        continue;
      }
      out.push({ row, level });
      if (row.subRows.length) walk(row.subRows, level + 1);
    }
  };
  walk(table.getSortedRowModel().rows, 1);
  return out;
}

/** The visible columns' labels and the rows' values as text. */
export function toRows<TData extends RowData>(
  table: DataTableInstance<TData>,
  { level = "Level" }: ExportOptions = {},
): ExportedRows {
  const columns = table.getVisibleLeafColumns().filter((c) => c.columnDef.meta?.kind !== "actions");
  const levels = Boolean(table.options.meta?.tree) && level !== false;
  const header = [
    ...(levels ? [level] : []),
    ...columns.map((c) => {
      const h = c.columnDef.header;
      return typeof h === "string" ? h : c.id;
    }),
  ];
  const rows = exportedRows(table).map(({ row, level: depth }) => [
    ...(levels ? [String(depth)] : []),
    ...columns.map((c) => {
      const exporter = c.columnDef.meta?.export;
      if (exporter) return text(exporter(row.original as never));
      return text(row.getValue(c.id));
    }),
  ]);
  return { header, rows };
}

/** A value a spreadsheet would run: it starts with a formula's sign, and it is not a plain number. */
const FORMULA = /^[=+\-@\t\r]/;
const NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const guard = (v: string) => (FORMULA.test(v) && !NUMBER.test(v) ? `'${v}` : v);

const quote = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** The same, as a CSV string with a header row. */
export function toCsv<TData extends RowData>(
  table: DataTableInstance<TData>,
  { keepFormulas = false, ...options }: CsvOptions = {},
): string {
  const { header, rows } = toRows(table, options);
  const cell = keepFormulas ? quote : (v: string) => quote(guard(v));
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

/**
 * Save the table as a CSV file: `toCsv` with a UTF-8 byte order mark, so a spreadsheet reads
 * accented and non-Latin names as they are. Returns false where there is no document.
 */
export function downloadCsv<TData extends RowData>(
  table: DataTableInstance<TData>,
  filename: string,
  options: CsvOptions = {},
): boolean {
  const name = /\.csv$/i.test(filename) ? filename : `${filename}.csv`;
  return downloadText(toCsv(table, options), name, { type: "text/csv;charset=utf-8", bom: true });
}
