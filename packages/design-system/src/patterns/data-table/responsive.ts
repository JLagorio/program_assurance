export type ResponsiveColumn = {
  id: string;
  width: number;
  priority?: number | undefined;
  action?: boolean | undefined;
};

/** Layout only: never changes the reader's visibility, sorting, filters, pins or export. */
export function fitColumns(columns: ResponsiveColumn[], available: number, leading = 0) {
  const widths = new Map(columns.map((column) => [column.id, column.width]));
  const ids = new Set(columns.map((column) => column.id));
  const ordered = columns
    .map((column, index) => ({ ...column, rank: column.priority ?? index + 10 }))
    .filter((column) => !column.action)
    .sort((a, b) => a.rank - b.rank);
  const identity = ordered[0];
  const total = columns.reduce((sum, column) => sum + column.width, leading);
  if (available <= 0 || total <= available) {
    if (identity && available > total) widths.set(identity.id, identity.width + available - total);
    return { ids, widths, collapsed: false };
  }

  // Preserve the most important record identity and action menus; disclose the other fields.
  const actions = columns.filter((column) => column.action);
  const budget = Math.max(0, available - leading - 32);
  const actionWidth = actions.reduce((sum, column) => sum + column.width, 0);
  ids.clear();
  actions.forEach((column) => ids.add(column.id));
  let used = actionWidth;
  if (identity) {
    ids.add(identity.id);
    const width = Math.max(1, Math.min(identity.width, budget - actionWidth));
    widths.set(identity.id, width);
    used += width;
  }
  for (const column of ordered.slice(1)) {
    if (used + column.width <= budget) {
      ids.add(column.id);
      used += column.width;
    }
  }
  const collapsed = ids.size < columns.length;
  // An identity-only row can shrink without hiding a field, so it has no disclosure column.
  const remaining = budget + (collapsed ? 0 : 32) - used;
  if (identity && remaining > 0)
    widths.set(identity.id, (widths.get(identity.id) ?? 0) + remaining);
  return { ids, widths, collapsed };
}

/** A pinned column as the renderer draws it: its band, its drawn width, and whether it is chrome (the row actions), which never gives way. */
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
