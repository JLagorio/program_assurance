/* The pure half of `useSort` and `usePage`: no React, so the node tests can run it. */

/** A raw value a sortable column reads off a row: an ISO day or instant, epoch milliseconds, a Date, a number or text, never the formatted label. `null`, `undefined` and `""` are absent. */
export type SortValue = string | number | Date | null | undefined;

const absent = (value: SortValue): value is null | undefined | "" =>
  value === null || value === undefined || value === "";

const numeric = (value: SortValue): number | undefined =>
  typeof value === "number" ? value : value instanceof Date ? value.getTime() : undefined;

/**
 * Two raw values in ascending order: numbers and Dates by value, text by the locale's collation
 * with numbers inside it read as numbers ("CTRL-9" before "CTRL-10"). ISO days and instants sort
 * as text in time order. Absent values are not compared here; `sortRows` puts them last.
 */
export function compareValues(a: SortValue, b: SortValue, collator: Intl.Collator): number {
  const an = numeric(a);
  const bn = numeric(b);
  if (an !== undefined && bn !== undefined) return an - bn;
  return collator.compare(String(a), String(b));
}

/** The rows in the column's order: ascending or descending, with absent values last either way, and ties kept in their given order. */
export function sortRows<T>(
  rows: readonly T[],
  read: (row: T) => SortValue,
  dir: "asc" | "desc",
  locale: string,
): T[] {
  const collator = new Intl.Collator(locale, { numeric: true });
  const sign = dir === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index, value: read(row) }))
    .sort((a, b) => {
      const aAbsent = absent(a.value);
      const bAbsent = absent(b.value);
      if (aAbsent || bAbsent) return aAbsent === bAbsent ? a.index - b.index : aAbsent ? 1 : -1;
      return sign * compareValues(a.value, b.value, collator) || a.index - b.index;
    })
    .map(({ row }) => row);
}

/** The page a list of `total` rows can show: `page` clamped between 1 and the last page. */
export function clampPage(page: number, total: number, pageSize: number): number {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(1, page), pageCount);
}
