import { useMemo, useRef, type ReactNode } from "react";
import {
  DataTable,
  Inline,
  defineColumns,
  useDataTable,
  type EmptyIllustrationKind,
} from "@ledger/design-system";
import { labelFor } from "@/lib/records";
import { statusTone } from "./work-format";

/*
 * The assessment registers on the kit's DataTable: one toolbar row (search, the chips named in
 * `filters`, then Columns, Settings and the actions), the kinds decided by the column's key, the
 * two empties drawn by the table. A column with a `key` sorts, searches and filters on that
 * field; one without is drawn as given.
 */

export type AssessmentColumn<T> = {
  label: string;
  value: (row: T) => ReactNode;
  width?: number;
  /** The field behind the cell. With it the column sorts and searches; a status or a type also filters. */
  key?: keyof T & string;
  kind?: "text" | "status" | "date" | "number";
};

export type AssessmentEmpty = {
  title?: string;
  description?: string;
  illustration?: EmptyIllustrationKind | false;
  action?: ReactNode;
};

const STATUS_KEYS = /^(status|state|determination|severity|priority|decision)$/;
const DATE_KEYS = /_(at|on)$/;

const kindOf = <T,>(column: AssessmentColumn<T>): AssessmentColumn<T>["kind"] =>
  column.kind ??
  (column.key && STATUS_KEYS.test(column.key)
    ? "status"
    : column.key && DATE_KEYS.test(column.key)
      ? "date"
      : "text");

export function AssessmentTable<T extends { id: string }>({
  rows,
  columns,
  label,
  onSelect,
  empty,
  filters = [],
  actions,
  initialFilters,
  view,
  search,
  fill,
}: {
  rows: T[];
  columns: AssessmentColumn<T>[];
  label: string;
  onSelect?: ((row: T) => void) | undefined;
  /** A string is the empty state's title. */
  empty?: string | AssessmentEmpty | undefined;
  /** Column keys to expose as filter chips. */
  filters?: (keyof T & string)[] | undefined;
  /** The toolbar's trailing actions: the create verb, small. */
  actions?: ReactNode;
  /** Column filters the table starts with. */
  initialFilters?: { id: string; value: unknown }[] | undefined;
  /** Names the reader's column layout in this browser. */
  view?: string | undefined;
  /** The search field's placeholder. */
  search?: string | undefined;
  /** The register is the page's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
}) {
  // The table reads labels for status fields so the chips and the badges agree; the cells and
  // the row click still see the record as it came.
  const statusKeys = useMemo(
    () => columns.filter((column) => column.key && kindOf(column) === "status").map((c) => c.key!),
    [columns],
  );
  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const byIdRef = useRef(byId);
  byIdRef.current = byId;
  const data = useMemo(
    () =>
      rows.map((row) => {
        const next = { ...row } as T & Record<string, unknown>;
        for (const key of statusKeys) {
          const value = row[key];
          if (typeof value === "string") (next as Record<string, unknown>)[key] = labelFor(value);
        }
        return next as T;
      }),
    [rows, statusKeys],
  );
  const tableColumns = useMemo(
    () =>
      defineColumns<T>((c) =>
        columns.map((column, index) => {
          const raw = (row: T) => byIdRef.current.get(row.id) ?? row;
          const cell = (row: T) => column.value(raw(row));
          const size = column.width === undefined ? {} : { width: column.width };
          const first = index === 0 ? { hideable: false as const } : {};
          if (!column.key)
            return c.custom(`column_${index}`, { header: column.label, cell, ...size });
          const key = column.key;
          const kind = kindOf(column);
          if (kind === "status")
            return c.status(key, {
              header: column.label,
              cell,
              tone: (row) => statusTone(String(raw(row)[key] ?? "")),
              ...size,
              ...first,
            });
          if (kind === "date")
            return c.date(key, { header: column.label, cell, ...size, ...first });
          if (kind === "number")
            return c.number(key, { header: column.label, cell, ...size, ...first });
          return c.text(key, { header: column.label, cell, ...size, ...first });
        }),
      ),
    [columns],
  );
  const table = useDataTable({
    columns: tableColumns,
    data,
    getRowId: (row) => row.id,
    label,
    pageSize: 20,
    resizable: true,
    reorderable: true,
    ...(view ? { view } : {}),
    ...(initialFilters ? { initialState: { columnFilters: initialFilters } } : {}),
  });
  const message: AssessmentEmpty = typeof empty === "string" ? { title: empty } : (empty ?? {});
  return (
    <DataTable
      table={table}
      fill={fill}
      onRowClick={onSelect ? (row) => onSelect(byId.get(row.id) ?? row) : undefined}
      empty={{
        illustration: message.illustration ?? "records",
        title: message.title ?? `No ${label.toLowerCase()} yet`,
        description: message.description,
        action: message.action,
      }}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Search table={table} placeholder={search ?? `Find ${label.toLowerCase()}`} />
          {filters.map((key) => (
            <DataTable.Filter key={key} table={table} column={key} />
          ))}
          <Inline className="ml-auto" space="space.100" alignBlock="center">
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
            {actions}
          </Inline>
        </Inline>
      }
    />
  );
}
