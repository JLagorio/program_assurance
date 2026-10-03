import type { Column, Row, RowData } from "@tanstack/react-table";

import type { DataTableFeatures } from "./features";
import { identityOf } from "./responsive";

/*
 * A row's readable name: what its checkbox, grip, kebab, chevron, eye and More fields say after
 * their verb, and what a move or a drag announces. The author's `rowLabel` wins; else the tree's
 * `label`; else the value of the column that names the row (the identity: the lowest `priority`,
 * else the first) or of an `id` column. A row id is a key no reader knows (a UUID), so it is never
 * the name: a row with nothing readable keeps its controls' generic names.
 */

type F = DataTableFeatures;

/** A cell value a reader can hear as a name: text with something in it, or a finite number. */
const readable = (value: unknown): string | undefined => {
  if (typeof value === "string") return value.trim() ? value : undefined;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
};

/** The columns whose values can name a row, in the order they are tried, kept per column set. */
const naming = new WeakMap<object, Column<F, never, unknown>[]>();
function namingColumns<TData extends RowData>(table: Row<F, TData>["table"]) {
  const all = table.getAllLeafColumns() as unknown as Column<F, never, unknown>[];
  const kept = naming.get(all);
  if (kept) return kept;
  const ranked = all.map((column) => ({
    column,
    priority: column.columnDef.meta?.priority,
    action: column.columnDef.meta?.kind === "actions",
  }));
  const identity = identityOf(ranked)?.column;
  const columns = [
    ...(identity ? [identity] : []),
    ...all.filter((column) => column !== identity && column.columnDef.meta?.kind === "id"),
  ];
  naming.set(all, columns);
  return columns;
}

/** The row's readable name, or undefined when nothing in it can name it. */
export function rowNameOf<TData extends RowData>(row: Row<F, TData>): string | undefined {
  const meta = row.table.options.meta;
  const own = meta?.rowLabel?.(row.original as never);
  if (own) return own;
  const tree = meta?.tree?.label(row.original as never);
  if (tree) return tree;
  for (const column of namingColumns(row.table)) {
    const value = readable(row.getValue(column.id));
    if (value) return value;
  }
  return undefined;
}

/** What is said about a row that moves: its name, else its id. */
export const rowSpokenName = <TData extends RowData>(row: Row<F, TData>): string =>
  rowNameOf(row) ?? row.id;
