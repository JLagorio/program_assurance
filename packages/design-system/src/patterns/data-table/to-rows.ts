import type { RowData } from "@tanstack/react-table";

import type { DataTableInstance } from "./use-data-table";

/*
 * Export. The rows the filters leave, in the sort the reader chose, every page; the columns the
 * reader shows, in their order. A kind's value exports as text; a custom column exports what its
 * `text` says, or nothing; the actions column never exports.
 */

export type ExportedRows = { header: string[]; rows: string[][] };

const text = (v: unknown): string =>
  v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);

/** The visible columns' labels and the rows' values as text. */
export function toRows<TData extends RowData>(table: DataTableInstance<TData>): ExportedRows {
  const columns = table.getVisibleLeafColumns().filter((c) => c.columnDef.meta?.kind !== "actions");
  const header = columns.map((c) => {
    const h = c.columnDef.header;
    return typeof h === "string" ? h : c.id;
  });
  const rows = table.getPrePaginatedRowModel().rows.map((row) =>
    columns.map((c) => {
      const exporter = c.columnDef.meta?.export;
      if (exporter) return text(exporter(row.original as never));
      return text(row.getValue(c.id));
    }),
  );
  return { header, rows };
}

const escape = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** The same, as a CSV string with a header row. */
export function toCsv<TData extends RowData>(table: DataTableInstance<TData>): string {
  const { header, rows } = toRows(table);
  return [header, ...rows].map((r) => r.map(escape).join(",")).join("\r\n");
}
