export type ResponsiveColumn = {
  id: string;
  /** The column's width, or for a flexible column its least width. */
  width: number;
  priority?: number | undefined;
  action?: boolean | undefined;
  /**
   * The author left the column unsized, so it takes a share of the spare width; its `width` is
   * then its least. With no flexible column drawn, the identity takes the spare width.
   */
  flexible?: boolean | undefined;
};

/**
 * Layout only: never changes the reader's visibility, sorting, filters, pins or export. The
 * columns stay in the row in priority order, and the first that does not fit folds with every
 * column after it, so a lower-priority column never outlasts a higher one. The spare width goes to
 * the flexible columns drawn (`flexible`, which the renderer shares out); with none, it goes to the
 * identity, in `widths`.
 */
export function fitColumns(columns: readonly ResponsiveColumn[], available: number, leading = 0) {
  const widths = new Map(columns.map((column) => [column.id, column.width]));
  const ids = new Set(columns.map((column) => column.id));
  const ordered = columns
    .map((column, index) => ({ ...column, rank: column.priority ?? index + 10 }))
    .filter((column) => !column.action)
    .sort((a, b) => a.rank - b.rank);
  const identity = ordered[0];
  const flexibleOf = (drawn: ReadonlySet<string>) =>
    columns.filter((column) => column.flexible && !column.action && drawn.has(column.id));
  const total = columns.reduce((sum, column) => sum + column.width, leading);
  if (available <= 0 || total <= available) {
    const flexible = flexibleOf(ids);
    if (identity && available > total && flexible.length === 0)
      widths.set(identity.id, identity.width + available - total);
    return {
      ids,
      widths,
      collapsed: false,
      identity: identity?.id,
      flexible: flexible.map((column) => column.id),
    };
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
    // Priority is monotonic: the first column that does not fit folds, and so does every one after.
    if (used + column.width > budget) break;
    ids.add(column.id);
    used += column.width;
  }
  const collapsed = ids.size < columns.length;
  // An identity-only row can shrink without hiding a field, so it has no disclosure column.
  const remaining = budget + (collapsed ? 0 : 32) - used;
  const flexible = flexibleOf(ids);
  if (identity && remaining > 0 && flexible.length === 0)
    widths.set(identity.id, (widths.get(identity.id) ?? 0) + remaining);
  return {
    ids,
    widths,
    collapsed,
    identity: identity?.id,
    flexible: flexible.map((column) => column.id),
  };
}

/**
 * The widths of the flexible columns in a frame: each its least width and a share of what the
 * other drawn columns leave, in proportion to that least width. The renderer leaves the last one
 * without a width, so it also takes any rounding.
 */
export function shareSlack(
  layout: Pick<ReturnType<typeof fitColumns>, "ids" | "widths" | "collapsed" | "flexible">,
  frame: number,
  leading = 0,
): Map<string, number> {
  const flexible = layout.flexible;
  const shares = new Map<string, number>();
  const least = flexible.reduce((sum, id) => sum + (layout.widths.get(id) ?? 0), 0);
  const fixed = [...layout.ids]
    .filter((id) => !flexible.includes(id))
    .reduce((sum, id) => sum + (layout.widths.get(id) ?? 0), leading + (layout.collapsed ? 32 : 0));
  const slack = Math.max(0, frame - fixed - least);
  for (const id of flexible) {
    const width = layout.widths.get(id) ?? 0;
    shares.set(
      id,
      Math.floor(width + (least > 0 ? (slack * width) / least : slack / flexible.length)),
    );
  }
  return shares;
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

/** A column as a responsive table fits it: its width and rank, and the band the reader pinned it to. */
export type FitColumn = ResponsiveColumn & {
  pin?: "start" | "end" | false | undefined;
};

/** A fitted frame: which columns show and how wide, the columns that take the slack, and which pins give way. */
export type FrameFit = {
  layout: ReturnType<typeof fitColumns> & {
    /**
     * The columns that share the slack, in drawn order: the unsized ones drawn, or with none of
     * those the identity. The renderer draws them from the frame's width outside React (the last
     * without a width, so it takes the rest), so a frame that changes by a pixel changes nothing
     * that React draws. Empty while the identity is the one and it is pinned (a pin after it needs
     * its width for its offset) or under a group heading (a spanning heading sets the widths).
     */
    flexible: string[];
  };
  /** Which pins give way, as a JSON list of ids. */
  released: string;
  /** Everything the frame decides about the drawing, as one string: two widths with the same key draw the same table. */
  key: string;
};

/**
 * Layout only: fits `columns` (the visible ones, in drawn order, the start band first and the end
 * band last) to a frame `frame` pixels wide after `leading` pixels of leading columns. Pure, so a
 * resize can fit first and redraw only when the key changes: while no column folds or returns and
 * no pin gives way, the key stays, and the slack goes to the flexible column through CSS.
 */
export function fitFrame(
  columns: readonly FitColumn[],
  frame: number,
  leading = 0,
  { grouped = false }: { grouped?: boolean | undefined } = {},
): FrameFit {
  // Under a group heading the widths are the heading's: nothing flexes, the identity takes the slack.
  const fitted = fitColumns(
    grouped ? columns.map((column) => ({ ...column, flexible: false })) : columns,
    frame,
    leading,
  );
  const identity = columns.find((column) => column.id === fitted.identity);
  const flexible = fitted.flexible.length
    ? fitted.flexible
    : identity && !identity.pin && !grouped
      ? [identity.id]
      : [];
  const bands: PinnedColumn[] = columns
    .filter((column) => column.pin && fitted.ids.has(column.id))
    .map((column) => ({
      id: column.id,
      pin: column.pin as "start" | "end",
      width: fitted.widths.get(column.id) ?? 0,
      chrome: column.action,
    }));
  const released = JSON.stringify([...yieldPins(bands, frame, leading)]);
  const key = JSON.stringify([
    [...fitted.ids],
    fitted.collapsed,
    [...fitted.widths].filter(
      ([id]) => fitted.ids.has(id) && !(flexible.length === 1 && flexible[0] === id),
    ),
    flexible,
    released,
  ]);
  return { layout: { ...fitted, flexible }, released, key };
}
