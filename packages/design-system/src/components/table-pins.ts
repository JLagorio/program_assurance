/*
 * Which pinned columns give way in a narrow frame: one rule for a Table whose cells say their pins
 * and for a DataTable, which works out its own (responsive.ts and data-table.tsx read it from here).
 * Pure, so `node --test` covers it.
 */

/** A pinned column as the renderer draws it: its band, its drawn width, and whether it is chrome (the row actions, a checkbox column), which never gives way. */
export type PinnedColumn = {
  id: string;
  pin: "start" | "end";
  width: number;
  chrome?: boolean | undefined;
};

/** The share of the frame the pinned columns may take before pins give way. */
export const PIN_SHARE = 0.6;

/**
 * Layout only: which pinned columns to draw unpinned, so the columns held still take at most
 * `share` of the frame and the middle keeps room to scroll. Pins give way from the middle outward:
 * the end band first, from its innermost column, then the start band from its innermost column,
 * so the leading identity is the last to go. The leading columns (`leading`, their width) and the
 * chrome never give way. `columns` is each band in drawn order. Never changes the reader's pins,
 * the Columns menu or the export; the pins return as the frame widens.
 */
export function yieldPins(
  columns: readonly PinnedColumn[],
  frame: number,
  leading = 0,
  share = PIN_SHARE,
): ReadonlySet<string> {
  const released = new Set<string>();
  if (frame <= 0) return released;
  const limit = frame * share;
  let band = columns.reduce((sum, column) => sum + column.width, leading);
  const order = [
    ...columns.filter((column) => column.pin === "end" && !column.chrome),
    ...columns.filter((column) => column.pin === "start" && !column.chrome).reverse(),
  ];
  for (const column of order) {
    if (band <= limit) break;
    released.add(column.id);
    band -= column.width;
  }
  return released;
}
