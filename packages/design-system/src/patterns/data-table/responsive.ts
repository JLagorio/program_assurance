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
