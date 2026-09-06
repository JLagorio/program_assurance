/** Versioned, validated browser preferences; never trust a persisted object as table state. */
export type StoredView = {
  v: 1;
  order: string[];
  sizing: Record<string, number>;
  visibility: Record<string, boolean>;
  pinning: { start: string[]; end: string[] };
  density?: "default" | "compact" | undefined;
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
  const unique = (list: string[]) => [...new Set(list)];
  const start = unique(pinning["start"]);
  return {
    v: 1,
    order: unique(value["order"]),
    sizing: Object.fromEntries(Object.entries(value["sizing"])) as Record<string, number>,
    visibility: Object.fromEntries(Object.entries(value["visibility"])) as Record<string, boolean>,
    pinning: { start, end: unique(pinning["end"]).filter((id) => !start.includes(id)) },
    ...(value["density"] ? { density: value["density"] } : {}),
  };
}

/** Remove obsolete IDs, append new columns and clamp restored widths to current column constraints. */
export function reconcileStoredView(
  stored: StoredView,
  columns: { id: string; minSize?: number; maxSize?: number }[],
): StoredView {
  const known = new Map(columns.map((column) => [column.id, column]));
  const keep = (list: string[]) => list.filter((id) => known.has(id));
  const order = keep(stored.order);
  return {
    ...stored,
    order: [...order, ...columns.map((column) => column.id).filter((id) => !order.includes(id))],
    sizing: Object.fromEntries(
      Object.entries(stored.sizing)
        .filter(([id]) => known.has(id))
        .map(([id, size]) => {
          const column = known.get(id)!;
          return [id, Math.min(column.maxSize ?? 10000, Math.max(column.minSize ?? 1, size))];
        }),
    ),
    visibility: Object.fromEntries(
      Object.entries(stored.visibility).filter(([id]) => known.has(id)),
    ),
    pinning: { start: keep(stored.pinning.start), end: keep(stored.pinning.end) },
  };
}

const VERSION = 1;

export const viewKey = (view: string) => `ledger.table.${view}.view`;

export function readView(view: string): StoredView | null {
  try {
    const raw = localStorage.getItem(viewKey(view));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parseStoredView(parsed);
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
