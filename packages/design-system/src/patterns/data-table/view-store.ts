import type { RowData } from "@tanstack/react-table";
import { useEffect, useRef } from "react";

import type { Density } from "../../mode/density";
import type { DataTableInstance } from "./use-data-table";

/*
 * The reader's view: column order, widths, visibility, pins and density, per table, per browser. The URL
 * keeps the question (sort, filters, page); this keeps the layout. Read on mount and applied over
 * the author's defaults in one commit; written on every change of the four slices. A stored column
 * the table no longer has is dropped; a column the store does not know takes its default place.
 */

const VERSION = 1;

export const viewKey = (view: string) => `ledger.table.${view}.view`;

type StoredView = {
  v: number;
  order: string[];
  sizing: Record<string, number>;
  visibility: Record<string, boolean>;
  pinning: { start: string[]; end: string[] };
  density?: Density | undefined;
};

export function readView(view: string): StoredView | null {
  try {
    const raw = localStorage.getItem(viewKey(view));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || (parsed as StoredView).v !== VERSION) return null;
    return parsed as StoredView;
  } catch {
    return null;
  }
}

export function writeView(view: string, value: Omit<StoredView, "v">): void {
  try {
    localStorage.setItem(viewKey(view), JSON.stringify({ v: VERSION, ...value }));
  } catch {
    // storage unavailable: the layout lives for the page
  }
}

export function clearView(view: string): void {
  try {
    localStorage.removeItem(viewKey(view));
  } catch {
    // nothing to clear
  }
}

/** Reads the stored view on mount, applies it, and stores every change after that. */
export function useViewStore<TData extends RowData>(
  table: DataTableInstance<TData>,
  view: string | undefined,
) {
  const loaded = useRef(false);
  const { columnOrder, columnSizing, columnVisibility, columnPinning } = table.state;
  const density = table.options.meta?.density;

  useEffect(() => {
    if (!view) return;
    const stored = readView(view);
    const known = new Set(table.getAllLeafColumns().map((c) => c.id));
    if (stored) {
      const keep = (ids: string[]) => ids.filter((id) => known.has(id));
      const order = keep(stored.order);
      if (order.length) {
        // columns the store does not know take their default place, after the stored ones
        const rest = [...known].filter((id) => !order.includes(id));
        table.setColumnOrder([...order, ...rest]);
      }
      table.setColumnSizing(
        Object.fromEntries(Object.entries(stored.sizing).filter(([id]) => known.has(id))),
      );
      table.setColumnVisibility(
        Object.fromEntries(Object.entries(stored.visibility).filter(([id]) => known.has(id))),
      );
      table.setColumnPinning({ start: keep(stored.pinning.start), end: keep(stored.pinning.end) });
      if (stored.density) table.options.meta?.setDensity?.(stored.density);
    }
    loaded.current = true;
    // runs once per table and view name; the table instance is stable
  }, [view]);

  useEffect(() => {
    if (!view || !loaded.current) return;
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
  table.resetColumnOrder(true);
  table.resetColumnSizing(true);
  table.resetColumnVisibility(true);
  table.resetColumnPinning(true);
  table.options.meta?.setDensity?.(table.options.meta.defaultDensity ?? "default");
  const view = table.options.meta?.view;
  if (view) clearView(view);
}
