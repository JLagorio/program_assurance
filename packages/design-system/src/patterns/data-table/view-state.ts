/** Versioned, validated browser preferences; never trust a persisted object as table state. */
export type StoredView = {
  v: 1;
  /** The author's version of the layout it was stored under; `0` when absent. */
  author?: number | undefined;
  /** Every column the table had when the layout was stored, so a column added since takes the author's defaults. Absent in a layout stored before it was recorded. */
  known?: string[] | undefined;
  order: string[];
  sizing: Record<string, number>;
  visibility: Record<string, boolean>;
  pinning: { start: string[]; end: string[] };
  density?: "default" | "compact" | undefined;
  pageSize?: number | undefined;
  /** The columns the reader wraps. */
  wrap?: string[] | undefined;
};
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const ids = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((id) => typeof id === "string" && id.length > 0);

/** Invalid records are discarded together, avoiding partial application of corrupt preferences. */
export function parseStoredView(value: unknown): StoredView | null {
  if (
    !record(value) ||
    value["v"] !== 1 ||
    !ids(value["order"]) ||
    !record(value["sizing"]) ||
    !record(value["visibility"]) ||
    !record(value["pinning"])
  )
    return null;
  const pinning = value["pinning"];
  if (!ids(pinning["start"]) || !ids(pinning["end"])) return null;
  if (
    !Object.values(value["sizing"]).every(
      (size) => typeof size === "number" && Number.isFinite(size) && size >= 1 && size <= 10000,
    )
  )
    return null;
  if (!Object.values(value["visibility"]).every((visible) => typeof visible === "boolean"))
    return null;
  if (
    value["density"] !== undefined &&
    value["density"] !== "default" &&
    value["density"] !== "compact"
  )
    return null;
  const size = value["pageSize"];
  if (
    size !== undefined &&
    !(typeof size === "number" && Number.isInteger(size) && size >= 1 && size <= 1000)
  )
    return null;
  const author = value["author"];
  if (
    author !== undefined &&
    !(typeof author === "number" && Number.isInteger(author) && author >= 0)
  )
    return null;
  const known = value["known"];
  if (known !== undefined && !ids(known)) return null;
  const wrap = value["wrap"];
  if (wrap !== undefined && !ids(wrap)) return null;
  const unique = (list: string[]) => [...new Set(list)];
  const start = unique(pinning["start"]);
  return {
    v: 1,
    ...(typeof author === "number" && author > 0 ? { author } : {}),
    ...(known === undefined ? {} : { known: unique(known) }),
    order: unique(value["order"]),
    sizing: Object.fromEntries(Object.entries(value["sizing"])) as Record<string, number>,
    visibility: Object.fromEntries(Object.entries(value["visibility"])) as Record<string, boolean>,
    pinning: { start, end: unique(pinning["end"]).filter((id) => !start.includes(id)) },
    ...(value["density"] ? { density: value["density"] } : {}),
    ...(typeof size === "number" ? { pageSize: size } : {}),
    ...(wrap === undefined ? {} : { wrap: unique(wrap) }),
  };
}

/** A column as the table has it now, in the author's order, with the author's defaults. */
export type ViewColumn = {
  id: string;
  minSize?: number | undefined;
  maxSize?: number | undefined;
  /** The row's actions: last and pinned to the end whatever the store says. */
  trailing?: boolean | undefined;
  /** `false`: the reader cannot hide it, so it shows whatever the store says. */
  hideable?: boolean | undefined;
  /** The author's default: `false` starts hidden. */
  visible?: boolean | undefined;
  /** The author's default pin. */
  pin?: "start" | "end" | undefined;
};

/** Puts `id` into `list` at its place in the author's order: after the nearest column before it that `list` holds. */
function atAuthorPlace(list: string[], id: string, author: readonly string[]) {
  const before = author.slice(0, Math.max(0, author.indexOf(id))).reverse();
  const anchor = before.find((other) => list.includes(other));
  const at = anchor === undefined ? 0 : list.indexOf(anchor) + 1;
  return [...list.slice(0, at), id, ...list.slice(at)];
}

/**
 * Remove obsolete IDs, clamp restored widths to current column constraints, and give each column
 * the store has not seen its author's place, visibility and pin. A column the reader cannot hide
 * shows whatever the store says.
 */
export function reconcileStoredView(stored: StoredView, columns: ViewColumn[]): StoredView {
  const known = new Map(columns.map((column) => [column.id, column]));
  const author = columns.map((column) => column.id);
  const keep = (list: string[]) => list.filter((id) => known.has(id));
  // A trailing column (the row's actions) is last and pinned to the end whatever the store says.
  const trailing = columns.filter((column) => column.trailing).map((column) => column.id);
  const held = (list: string[]) => list.filter((id) => !trailing.includes(id));
  // Columns added since the layout was stored. A layout stored before `known` was recorded knows them all.
  const seen = stored.known ? new Set(stored.known) : null;
  const unseen = columns.filter((column) => seen !== null && !seen.has(column.id));
  let order = held(keep(stored.order));
  for (const id of author)
    if (!order.includes(id) && !trailing.includes(id)) order = atAuthorPlace(order, id, author);
  const visibility = Object.fromEntries(
    Object.entries(stored.visibility).filter(([id]) => known.has(id)),
  );
  for (const column of unseen) if (column.visible === false) visibility[column.id] = false;
  for (const column of columns) if (column.hideable === false) delete visibility[column.id];
  let start = held(keep(stored.pinning.start));
  let end = held(keep(stored.pinning.end));
  for (const column of unseen) {
    if (column.trailing || !column.pin) continue;
    if (column.pin === "start") start = atAuthorPlace(start, column.id, author);
    else end = atAuthorPlace(end, column.id, author);
  }
  return {
    ...stored,
    order: [...order, ...trailing],
    sizing: Object.fromEntries(
      Object.entries(stored.sizing)
        .filter(([id]) => known.has(id))
        .map(([id, size]) => {
          const column = known.get(id)!;
          return [id, Math.min(column.maxSize ?? 10000, Math.max(column.minSize ?? 1, size))];
        }),
    ),
    visibility,
    pinning: { start, end: [...new Set([...end, ...trailing])] },
    ...(stored.wrap ? { wrap: keep(stored.wrap) } : {}),
  };
}

const VERSION = 1;

export const viewKey = (view: string) => `ledger.table.${view}.view`;

/** The reader's stored layout for `view`, or `null`: none, corrupt, or stored under another author `version`. */
export function readView(view: string, version = 0): StoredView | null {
  try {
    const raw = localStorage.getItem(viewKey(view));
    if (!raw) return null;
    const parsed = parseStoredView(JSON.parse(raw) as unknown);
    return parsed && (parsed.author ?? 0) === version ? parsed : null;
  } catch {
    return null;
  }
}

export function writeView(view: string, value: Omit<StoredView, "v">, version = 0): void {
  try {
    const { author: _author, ...layout } = value;
    localStorage.setItem(
      viewKey(view),
      JSON.stringify({ v: VERSION, ...(version > 0 ? { author: version } : {}), ...layout }),
    );
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
