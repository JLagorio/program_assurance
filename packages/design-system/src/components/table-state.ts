import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";
type Readers<T> = Record<string, (row: T) => string | number>;

/**
 * Column sort for a Table: one key at a time, the same header again flips it. `get` names the
 * value each sortable column reads off a row; keep it at module level so the memo holds. Feed
 * `dir(key)` and `toggle(key)` to Table.Header's `sort` and `onSort`.
 */
export function useSort<T, G extends Readers<T>>(
  rows: T[],
  get: G,
  initial?: { key: keyof G & string; dir: SortDir },
) {
  type Key = keyof G & string;
  const [sort, setSort] = useState<{ key: Key; dir: SortDir } | null>(initial ?? null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const read = get[sort.key];
    if (!read) return rows;
    return [...rows].sort((a, b) => {
      const av = read(a);
      const bv = read(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, get]);
  const dir = (key: Key): SortDir | false => (sort?.key === key ? sort.dir : false);
  const toggle = (key: Key) =>
    setSort((s) =>
      s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  return { rows: sorted, dir, toggle };
}

/** One page of a list, for Pagination. The page number clamps when the list shrinks. */
export function usePage<T>(rows: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const slice = useMemo(
    () => rows.slice((current - 1) * pageSize, current * pageSize),
    [rows, current, pageSize],
  );
  return { page: current, setPage, pageCount, rows: slice, pageSize, total: rows.length };
}
