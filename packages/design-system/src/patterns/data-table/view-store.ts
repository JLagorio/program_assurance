import type { RowData } from "@tanstack/react-table";
import { useEffect, useLayoutEffect, useRef } from "react";

import { readView, writeView, clearView, reconcileStoredView } from "./view-state";
export { readView, writeView, clearView, viewKey } from "./view-state";
import type { DataTableInstance } from "./use-data-table";

/*
 * The reader's view: column order, widths, visibility, pins, wrapped columns, density and page
 * size, per table, per browser. This keeps the layout; `useTableQuery` keeps the question (search,
 * sort, filters, page) in the URL or the session. Read before the first paint and applied over the
 * author's defaults; written on every change of those slices. A stored column the table no longer
 * has is dropped; a column added since the layout was stored takes the author's place, visibility
 * and pin; a column the reader cannot hide shows. A layout stored under another author version is
 * discarded.
 */

/** Reads the stored view before the first paint, applies it, and stores every change after that. */
export function useViewStore<TData extends RowData>(
  table: DataTableInstance<TData>,
  view: string | undefined,
  version = 0,
) {
  const loaded = useRef<string | null>(null);
  const skipWrite = useRef(false);
  const { columnOrder, columnSizing, columnVisibility, columnPinning } = table.state;
  const density = table.options.meta?.density;
  const wrapped = table.options.meta?.wrapped;
  const pageSize =
    table.options.meta?.pageSize === undefined ? undefined : table.state.pagination.pageSize;
  const slot = view ? `${view}\u0000${version}` : null;

  // A layout effect, so the author's layout never paints for a frame before the reader's.
  useLayoutEffect(() => {
    loaded.current = null;
    skipWrite.current = true;
    if (!view) return;
    // A new view starts from the author's defaults; it must not inherit the previous view.
    table.resetColumnOrder();
    table.resetColumnSizing();
    table.resetColumnVisibility();
    table.resetColumnPinning();
    table.options.meta?.setDensity?.(table.options.meta.defaultDensity ?? "default");
    table.options.meta?.setWrapped?.([]);
    if (table.options.meta?.pageSize !== undefined) table.setPageSize(table.options.meta.pageSize);
    const raw = readView(view, version);
    if (raw) {
      const initial = table.initialState;
      const stored = reconcileStoredView(
        raw,
        table.getAllLeafColumns().map((column) => ({
          id: column.id,
          ...(column.columnDef.minSize === undefined ? {} : { minSize: column.columnDef.minSize }),
          ...(column.columnDef.maxSize === undefined ? {} : { maxSize: column.columnDef.maxSize }),
          ...(column.columnDef.meta?.kind === "actions" ? { trailing: true } : {}),
          ...(column.getCanHide() ? {} : { hideable: false }),
          ...(initial.columnVisibility?.[column.id] === false ? { visible: false } : {}),
          ...(initial.columnPinning?.start?.includes(column.id)
            ? { pin: "start" as const }
            : initial.columnPinning?.end?.includes(column.id)
              ? { pin: "end" as const }
              : {}),
        })),
      );
      table.setColumnOrder(stored.order);
      table.setColumnSizing(stored.sizing);
      table.setColumnVisibility(stored.visibility);
      table.setColumnPinning(stored.pinning);
      if (stored.density) table.options.meta?.setDensity?.(stored.density);
      if (stored.wrap?.length) table.options.meta?.setWrapped?.(stored.wrap);
      if (stored.pageSize && table.options.meta?.pageSizes?.includes(stored.pageSize))
        table.setPageSize(stored.pageSize);
    }
    loaded.current = slot;
    // Runs once per view name and version; the table instance is stable.
  }, [slot]);

  useEffect(() => {
    if (!view || loaded.current !== slot) return;
    // The read effect schedules state updates; this render still contains the old snapshot.
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    writeView(
      view,
      {
        known: table.getAllLeafColumns().map((column) => column.id),
        order: columnOrder,
        sizing: columnSizing,
        visibility: columnVisibility,
        pinning: { start: columnPinning.start, end: columnPinning.end },
        ...(density ? { density } : {}),
        ...(pageSize === undefined ? {} : { pageSize }),
        ...(wrapped?.length ? { wrap: [...wrapped] } : {}),
      },
      version,
    );
  }, [
    slot,
    columnOrder,
    columnSizing,
    columnVisibility,
    columnPinning,
    density,
    pageSize,
    wrapped,
  ]);
}

/** Back to the author's layout, and the store forgets the reader's. */
export function resetView<TData extends RowData>(table: DataTableInstance<TData>) {
  table.resetColumnOrder();
  table.resetColumnSizing();
  table.resetColumnVisibility();
  table.resetColumnPinning();
  table.options.meta?.setDensity?.(table.options.meta.defaultDensity ?? "default");
  table.options.meta?.setWrapped?.([]);
  if (table.options.meta?.pageSize !== undefined) table.setPageSize(table.options.meta.pageSize);
  const view = table.options.meta?.view;
  if (view) clearView(view);
}
