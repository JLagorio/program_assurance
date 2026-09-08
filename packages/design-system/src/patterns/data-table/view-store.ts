import type { RowData } from "@tanstack/react-table";
import { useEffect, useRef } from "react";

import { readView, writeView, clearView, reconcileStoredView } from "./view-state";
export { readView, writeView, clearView, viewKey } from "./view-state";
import type { DataTableInstance } from "./use-data-table";

/*
 * The reader's view: column order, widths, visibility, pins and density, per table, per browser. The URL
 * keeps the question (sort, filters, page); this keeps the layout. Read on mount and applied over
 * the author's defaults in one commit; written on every change of the four slices. A stored column
 * the table no longer has is dropped; a column the store does not know takes its default place.
 */

/** Reads the stored view on mount, applies it, and stores every change after that. */
export function useViewStore<TData extends RowData>(
  table: DataTableInstance<TData>,
  view: string | undefined,
) {
  const loaded = useRef<string | null>(null);
  const skipWrite = useRef(false);
  const { columnOrder, columnSizing, columnVisibility, columnPinning } = table.state;
  const density = table.options.meta?.density;

  useEffect(() => {
    loaded.current = null;
    skipWrite.current = true;
    if (!view) return;
    // A new view starts from the author's defaults; it must not inherit the previous view.
    table.resetColumnOrder();
    table.resetColumnSizing();
    table.resetColumnVisibility();
    table.resetColumnPinning();
    table.options.meta?.setDensity?.(table.options.meta.defaultDensity ?? "default");
    const raw = readView(view);
    if (raw) {
      const stored = reconcileStoredView(
        raw,
        table.getAllLeafColumns().map((column) => ({
          id: column.id,
          ...(column.columnDef.minSize === undefined ? {} : { minSize: column.columnDef.minSize }),
          ...(column.columnDef.maxSize === undefined ? {} : { maxSize: column.columnDef.maxSize }),
          ...(column.columnDef.meta?.kind === "actions" ? { trailing: true } : {}),
        })),
      );
      table.setColumnOrder(stored.order);
      table.setColumnSizing(stored.sizing);
      table.setColumnVisibility(stored.visibility);
      table.setColumnPinning(stored.pinning);
      if (stored.density) table.options.meta?.setDensity?.(stored.density);
    }
    loaded.current = view;
    // Runs once per view name; the table instance is stable.
  }, [view]);

  useEffect(() => {
    if (!view || loaded.current !== view) return;
    // The read effect schedules state updates; this render still contains the old snapshot.
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    writeView(view, {
      order: columnOrder,
      sizing: columnSizing,
      visibility: columnVisibility,
      pinning: { start: columnPinning.start, end: columnPinning.end },
      ...(density ? { density } : {}),
    });
  }, [view, columnOrder, columnSizing, columnVisibility, columnPinning, density]);
}

/** Back to the author's layout, and the store forgets the reader's. */
export function resetView<TData extends RowData>(table: DataTableInstance<TData>) {
  table.resetColumnOrder();
  table.resetColumnSizing();
  table.resetColumnVisibility();
  table.resetColumnPinning();
  table.options.meta?.setDensity?.(table.options.meta.defaultDensity ?? "default");
  const view = table.options.meta?.view;
  if (view) clearView(view);
}
