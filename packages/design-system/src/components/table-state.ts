import { useMemo, useState } from "react";

import { useLedgerLocale } from "../lib/locale";
import { clampPage, sortRows, type SortValue } from "./table-sort";

export type SortDir = "asc" | "desc";
type Readers<T> = Record<string, (row: T) => SortValue>;

/**
 * Column sort for a Table: one key at a time, the same header again flips it. `get` names the
 * raw value each sortable column reads off a row: an ISO day or instant, a number, a Date or the
 * text, never the label the cell formats, so "2 Sep" sorts before "14 Sep". Text collates in the
 * LedgerProvider's locale with numbers inside it read as numbers; an absent value (`null`,
 * `undefined`, `""`) sorts last in either direction. Keep `get` at module level so the memo
 * holds. Feed `dir(key)` and `toggle(key)` to Table.Header's `sort` and `onSort`.
 */
export function useSort<T, G extends Readers<T>>(
  rows: T[],
  get: G,
  initial?: { key: keyof G & string; dir: SortDir },
) {
  type Key = keyof G & string;
  const { locale } = useLedgerLocale();
  const [sort, setSort] = useState<{ key: Key; dir: SortDir } | null>(initial ?? null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const read = get[sort.key];
    if (!read) return rows;
    return sortRows(rows, read, sort.dir, locale);
  }, [rows, sort, get, locale]);
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
  const current = clampPage(page, rows.length, pageSize);
  const slice = useMemo(
    () => rows.slice((current - 1) * pageSize, current * pageSize),
    [rows, current, pageSize],
  );
  return { page: current, setPage, pageCount, rows: slice, pageSize, total: rows.length };
}
