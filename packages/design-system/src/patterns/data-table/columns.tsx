import type { RowData } from "@tanstack/react-table";
import { format, isValid, parseISO } from "date-fns";
import type { ReactNode } from "react";

import { Badge, type Tone } from "../../components/badge";
import { Person } from "../../components/avatar";
import { Absent } from "../../components/typography";
import type { RowAction } from "./features";
import { createDataTableColumnHelper, type DataTableColumn } from "./use-data-table";

/*
 * Column kinds. A kind decides what the column is (its alignment, its sort, its filter, its
 * minimum width and the part that draws it), so a route names the field and the kind and cannot
 * get the conventions wrong. Every kind takes `cell` to draw the value its own way while keeping
 * the kind's behaviour, and `sortable: false` to take the sort off.
 */

/** The minimum a column of each kind can shrink to. */
/** A column's `width` also sets its minimum; a column with no width keeps the kind's minimum. */
const minOf = (width: number | undefined, fallback: number) => width ?? fallback;

export const minWidths = {
  id: 92,
  text: 120,
  number: 96,
  date: 112,
  status: 120,
  person: 160,
  actions: 40,
  custom: 96,
} as const;

type Shared<TData> = {
  header?: string | undefined;
  /** Pixels. Content decisions are props, not classes. */
  width?: number | undefined;
  minWidth?: number | undefined;
  sortable?: boolean | undefined;
  /** Sort by something other than the value: a rank for a status, a number behind a bar. */
  sortBy?: ((row: TData) => string | number) | undefined;
  /** The author's default pin. A pinned column needs a `width`. */
  pin?: "start" | "end" | undefined;
  /** `false` keeps the column on screen whatever the reader chooses. */
  hideable?: boolean | undefined;
  resizable?: boolean | undefined;
  /** Draw the cell yourself; the kind still sets alignment, sort and filter. An absent value is `Absent`. */
  cell?: ((row: TData) => ReactNode) | undefined;
};

type Key<TData extends RowData> = keyof TData & string;

/** Reads the field. The accessor is a function rather than a key so the column's value type stays `unknown` and the kinds stay generic. */
const read =
  <TData extends RowData>(key: Key<TData>) =>
  (row: TData): unknown =>
    row[key];

const isAbsent = (v: unknown) => v === null || v === undefined || v === "";

const compare = (a: string | number, b: string | number) =>
  typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a).localeCompare(String(b), undefined, { numeric: true });

/** A total under a number column: over the rows the filters leave, before pagination. */
export type Footer = "sum" | "mean" | "min" | "max" | "count";

const totals: Record<Footer, (values: number[]) => number> = {
  sum: (v) => v.reduce((a, b) => a + b, 0),
  mean: (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0),
  min: (v) => (v.length ? Math.min(...v) : 0),
  max: (v) => (v.length ? Math.max(...v) : 0),
  count: (v) => v.length,
};

/** The shared options every kind passes through. */
const shared = <TData extends RowData>(
  o: Pick<Shared<TData>, "pin" | "hideable" | "resizable">,
) => ({
  ...(o.hideable === undefined ? {} : { enableHiding: o.hideable }),
  ...(o.resizable === undefined ? {} : { enableResizing: o.resizable }),
});

/** The kind's sort, or the row's `sortBy` value when the column gives one. */
const sortOf = <TData extends RowData>(
  kind: "alphanumeric" | "basic" | "datetime" | "text",
  sortBy: ((row: TData) => string | number) | undefined,
) =>
  sortBy
    ? (a: { original: TData }, b: { original: TData }) =>
        compare(sortBy(a.original), sortBy(b.original))
    : kind;

const numberFormats = {
  integer: new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }),
  decimal: new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
  percent: new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 }),
};

const dateFormats = { short: "d MMM yyyy", medium: "d MMM yyyy, HH:mm" } as const;

/** An ISO date renders on the short or medium pattern; anything else renders as given. */
function formatDate(value: unknown, pattern: keyof typeof dateFormats): ReactNode {
  if (typeof value !== "string") return isAbsent(value) ? <Absent /> : String(value);
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, dateFormats[pattern]) : value;
}

export function columnKinds<TData extends RowData>() {
  const helper = createDataTableColumnHelper<TData>();

  const text = (
    key: Key<TData>,
    {
      header,
      width,
      minWidth,
      sortable = true,
      sortBy,
      pin,
      hideable,
      resizable,
      cell,
      wrap = false,
    }: Shared<TData> & { wrap?: boolean | undefined } = {},
  ) =>
    helper.accessor(read<TData>(key), {
      id: key,
      header: header ?? key,
      ...(width === undefined ? {} : { size: width }),
      minSize: minOf(width, minWidth ?? minWidths.text),
      enableSorting: sortable,
      sortFn: sortOf("alphanumeric", sortBy),
      filterFn: "matches",
      ...shared({ pin, hideable, resizable }),
      meta: { pin, kind: "text", align: "start", wrap },
      cell: ({ row, getValue }) => {
        if (cell) return cell(row.original);
        const v = getValue();
        return isAbsent(v) ? <Absent /> : String(v);
      },
    });

  const id = (
    key: Key<TData>,
    {
      header = "ID",
      width = minWidths.id,
      minWidth,
      sortable = true,
      sortBy,
      pin,
      hideable,
      resizable,
      cell,
      preview,
      active,
      glance,
      tone = "brand",
    }: Shared<TData> & {
      /** The eye on hover opens the row's preview surface. */
      preview?: ((row: TData) => void) | undefined;
      /** The row whose preview is open. */
      active?: ((row: TData) => boolean) | undefined;
      /** Hover on the id shows this glance: facts only, no actions. */
      glance?: ((row: TData) => ReactNode) | undefined;
      tone?: "brand" | "subtle" | undefined;
    } = {},
  ) =>
    helper.accessor(read<TData>(key), {
      id: key,
      header,
      size: width,
      minSize: minOf(width, minWidth ?? minWidths.id),
      enableSorting: sortable,
      sortFn: sortOf("alphanumeric", sortBy),
      filterFn: "matches",
      ...shared({ pin, hideable, resizable }),
      meta: { pin, kind: "id", align: "start", tone, preview, active, glance },
      cell: ({ row, getValue }) => (cell ? cell(row.original) : String(getValue())),
    });

  const number = (
    key: Key<TData>,
    {
      header,
      width,
      minWidth,
      sortable = true,
      sortBy,
      pin,
      hideable,
      resizable,
      cell,
      format: fmt = "integer",
      footer,
    }: Shared<TData> & {
      format?: keyof typeof numberFormats | ((value: number) => string) | undefined;
      /** A total in the footer: sum, mean, min, max, count, or your own over the rows shown. */
      footer?: Footer | ((rows: TData[]) => ReactNode) | undefined;
    } = {},
  ) =>
    helper.accessor(read<TData>(key), {
      ...(footer
        ? {
            footer: ({ table }) => {
              const rows = table.getPrePaginatedRowModel().rows.map((r) => r.original);
              if (typeof footer === "function") return footer(rows);
              const values = rows
                .map((r): unknown => r[key])
                .filter((v): v is number => typeof v === "number");
              const total = totals[footer](values);
              return typeof fmt === "function" ? fmt(total) : numberFormats[fmt].format(total);
            },
          }
        : {}),
      id: key,
      header: header ?? key,
      ...(width === undefined ? {} : { size: width }),
      minSize: minOf(width, minWidth ?? minWidths.number),
      enableSorting: sortable,
      sortFn: sortOf("basic", sortBy),
      filterFn: "inNumberRange",
      enableGlobalFilter: false,
      ...shared({ pin, hideable, resizable }),
      meta: { pin, kind: "number", align: "end" },
      cell: ({ row, getValue }) => {
        if (cell) return cell(row.original);
        const v = getValue();
        if (typeof v !== "number") return isAbsent(v) ? <Absent /> : String(v);
        return typeof fmt === "function" ? fmt(v) : numberFormats[fmt].format(v);
      },
    });

  const date = (
    key: Key<TData>,
    {
      header,
      width,
      minWidth,
      sortable = true,
      sortBy,
      pin,
      hideable,
      resizable,
      cell,
      format: fmt = "short",
    }: Shared<TData> & { format?: keyof typeof dateFormats | undefined } = {},
  ) =>
    helper.accessor(read<TData>(key), {
      id: key,
      header: header ?? key,
      ...(width === undefined ? {} : { size: width }),
      minSize: minOf(width, minWidth ?? minWidths.date),
      enableSorting: sortable,
      sortFn: sortOf("datetime", sortBy),
      filterFn: "dateRange",
      enableGlobalFilter: false,
      ...shared({ pin, hideable, resizable }),
      meta: { pin, kind: "date", align: "start" },
      cell: ({ row, getValue }) => (cell ? cell(row.original) : formatDate(getValue(), fmt)),
    });

  const status = (
    key: Key<TData>,
    {
      header,
      width,
      minWidth,
      sortable = true,
      sortBy,
      pin,
      hideable,
      resizable,
      cell,
      tone,
    }: Shared<TData> & { tone: (row: TData) => Tone },
  ) =>
    helper.accessor(read<TData>(key), {
      id: key,
      header: header ?? key,
      ...(width === undefined ? {} : { size: width }),
      minSize: minOf(width, minWidth ?? minWidths.status),
      enableSorting: sortable,
      sortFn: sortOf("alphanumeric", sortBy),
      filterFn: "matches",
      ...shared({ pin, hideable, resizable }),
      meta: { pin, kind: "status", align: "start" },
      cell: ({ row, getValue }) => {
        if (cell) return cell(row.original);
        const v = getValue();
        return isAbsent(v) ? <Absent /> : <Badge tone={tone(row.original)}>{String(v)}</Badge>;
      },
    });

  const person = (
    key: Key<TData>,
    {
      header,
      width,
      minWidth,
      sortable = true,
      sortBy,
      pin,
      hideable,
      resizable,
      cell,
    }: Shared<TData> = {},
  ) =>
    helper.accessor(read<TData>(key), {
      id: key,
      header: header ?? key,
      ...(width === undefined ? {} : { size: width }),
      minSize: minOf(width, minWidth ?? minWidths.person),
      enableSorting: sortable,
      sortFn: sortOf("text", sortBy),
      filterFn: "matches",
      ...shared({ pin, hideable, resizable }),
      meta: { pin, kind: "person", align: "start" },
      cell: ({ row, getValue }) => {
        if (cell) return cell(row.original);
        const v = getValue();
        return isAbsent(v) ? <Absent /> : <Person name={String(v)} />;
      },
    });

  /** The overflow menu, always the last column: a kebab on row hover and focus. */
  const actions = (rowActions: (row: TData) => RowAction[]) =>
    helper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      size: minWidths.actions,
      minSize: minWidths.actions,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      meta: { kind: "actions", align: "end", actions: rowActions },
    });

  /** Anything else: a bar, an icon, a composed cell. `sort` reads the value the column sorts by; without it the column does not sort. */
  const custom = (
    columnId: string,
    {
      header,
      width,
      minWidth,
      align = "start",
      cell,
      sort,
    }: {
      header?: ReactNode | undefined;
      width?: number | undefined;
      minWidth?: number | undefined;
      align?: "start" | "end" | undefined;
      cell: (row: TData) => ReactNode;
      sort?: ((row: TData) => string | number) | undefined;
    },
  ): DataTableColumn<TData> =>
    sort
      ? helper.accessor(sort, {
          id: columnId,
          header: typeof header === "string" ? header : () => header ?? columnId,
          ...(width === undefined ? {} : { size: width }),
          minSize: minOf(width, minWidth ?? minWidths.custom),
          enableSorting: true,
          sortFn: "alphanumeric",
          enableGlobalFilter: false,
          meta: { kind: "custom", align },
          cell: ({ row }) => cell(row.original),
        })
      : helper.display({
          id: columnId,
          header: typeof header === "string" ? header : () => header ?? columnId,
          ...(width === undefined ? {} : { size: width }),
          minSize: minOf(width, minWidth ?? minWidths.custom),
          enableSorting: false,
          meta: { kind: "custom", align },
          cell: ({ row }) => cell(row.original),
        });

  /** A heading over several columns: a second header row. */
  const group = (header: string, columns: ReadonlyArray<DataTableColumn<TData>>) =>
    helper.group({ id: header, header, columns });

  return { id, text, number, date, status, person, actions, custom, group };
}

export type ColumnKinds<TData extends RowData> = ReturnType<typeof columnKinds<TData>>;

/** The columns of a record type, by kind. Keep the call at module level so the memo holds. */
export function defineColumns<TData extends RowData>(
  build: (c: ColumnKinds<TData>) => ReadonlyArray<DataTableColumn<TData>>,
): DataTableColumn<TData>[] {
  return [...build(columnKinds<TData>())];
}
