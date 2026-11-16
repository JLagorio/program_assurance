// Which pins give way is one rule with a plain Table's, so it lives beside the Table.
import { PIN_SHARE, yieldPins, type PinnedColumn } from "../../components/table-pins";

export { PIN_SHARE, yieldPins, type PinnedColumn };

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
  /**
   * The column goes into each row's More fields whatever the width (DataTable's `fold`), and the
   * width it held goes to the identity. The identity and the row's actions never fold.
   */
  folded?: boolean | undefined;
};

/** What ranks a column: its `priority`, and whether it is the row's actions. */
type Ranked = { priority?: number | undefined; action?: boolean | undefined };

/**
 * The data columns in the order a row keeps them: by `priority`, lower first, and a column with
 * none after every prioritised one in its given order. The actions are left out.
 */
export function rankColumns<T extends Ranked>(columns: readonly T[]): T[] {
  return columns
    .map((column, index) => ({ column, rank: column.priority ?? index + 10 }))
    .filter(({ column }) => !column.action)
    .sort((a, b) => a.rank - b.rank)
    .map(({ column }) => column);
}

/**
 * The column that names a row: the lowest `priority`, else the first, never the actions. A
 * responsive row keeps it longest, the table draws it as the row's header, and its value names the
 * row's controls when the author gives no `rowLabel`.
 */
export const identityOf = <T extends Ranked>(columns: readonly T[]): T | undefined =>
  rankColumns(columns)[0];

/**
 * Layout only: never changes the reader's visibility, sorting, filters, pins or export. The
 * columns stay in the row in priority order, and the first that does not fit folds with every
 * column after it, so a lower-priority column never outlasts a higher one. The spare width goes to
 * the flexible columns drawn (`flexible`, which the renderer shares out); with none, it goes to the
 * identity, in `widths`. A `folded` column then leaves the row for its More fields, and the width
 * it held goes to the identity: no other column comes or goes because it folded.
 */
export function fitColumns(columns: readonly ResponsiveColumn[], available: number, leading = 0) {
  const fitted = fitByPriority(columns, available, leading);
  const identity = fitted.identity;
  const folded = columns.filter(
    (column) =>
      column.folded && !column.action && column.id !== identity && fitted.ids.has(column.id),
  );
  if (!identity || folded.length === 0) return fitted;
  const ids = new Set([...fitted.ids].filter((id) => !folded.some((column) => column.id === id)));
  const widths = new Map(fitted.widths);
  // The width the folded columns held, less the More fields control's where the row had none.
  const freed =
    folded.reduce((sum, column) => sum + (fitted.widths.get(column.id) ?? column.width), 0) -
    (fitted.collapsed ? 0 : 32);
  widths.set(identity, Math.max(1, (widths.get(identity) ?? 0) + freed));
  return {
    ...fitted,
    ids,
    widths,
    collapsed: true,
    flexible: fitted.flexible.filter((id) => ids.has(id)),
  };
}

/** The fit by width and priority alone, before any column the author folds leaves the row. */
function fitByPriority(columns: readonly ResponsiveColumn[], available: number, leading: number) {
  const widths = new Map(columns.map((column) => [column.id, column.width]));
  const ids = new Set(columns.map((column) => column.id));
  const ordered = rankColumns(columns);
  const identity = ordered[0];
  // The identity, where it is flexible, is the last of them: the renderer draws the last without a
  // width, so the name takes the spare width and the others keep their least (`shareSlack`).
  const flexibleOf = (drawn: ReadonlySet<string>) =>
    columns
      .filter((column) => column.flexible && !column.action && drawn.has(column.id))
      .sort((a, b) => Number(a.id === identity?.id) - Number(b.id === identity?.id));
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
 * The widths of the flexible columns in a frame. Where the identity is one of them, it takes what
 * the other drawn columns leave and the others keep their least width: names take the flexible
 * width. Otherwise each takes its least width and a share of what is left, in proportion to that
 * least width. The renderer leaves the last one without a width, so it also takes any rounding.
 */
export function shareSlack(
  layout: Pick<ReturnType<typeof fitColumns>, "ids" | "widths" | "collapsed" | "flexible"> & {
    identity?: string | undefined;
  },
  frame: number,
  leading = 0,
): Map<string, number> {
  const flexible = layout.flexible;
  const named = layout.identity !== undefined && flexible.includes(layout.identity);
  const shares = new Map<string, number>();
  const least = flexible.reduce((sum, id) => sum + (layout.widths.get(id) ?? 0), 0);
  const fixed = [...layout.ids]
    .filter((id) => !flexible.includes(id))
    .reduce((sum, id) => sum + (layout.widths.get(id) ?? 0), leading + (layout.collapsed ? 32 : 0));
  const slack = Math.max(0, frame - fixed - least);
  for (const id of flexible) {
    const width = layout.widths.get(id) ?? 0;
    if (named) {
      shares.set(id, id === layout.identity ? Math.floor(width + slack) : width);
      continue;
    }
    shares.set(
      id,
      Math.floor(width + (least > 0 ? (slack * width) / least : slack / flexible.length)),
    );
  }
  return shares;
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
