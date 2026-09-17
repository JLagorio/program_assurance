import { useMemo, useRef, type ReactNode } from "react";
import {
  DataTable,
  Toolbar,
  defineColumns,
  useDataTable,
  type EmptyIllustrationKind,
} from "@ledger/design-system";
import { useNavigate } from "@tanstack/react-router";
import type { TableName } from "@/lib/models";
import { RecordLink, recordDestination, useDisplayedRecords } from "./record-preview";
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
  model,
  selectedId,
  onDisplayedRowsChange,
  columns,
  label,
  onPreview,
  onEdit,
  empty,
  filters = [],
  actions,
  initialFilters,
  view,
  search,
  fill,
}: {
  rows: T[];
  model?: TableName | undefined;
  selectedId?: string | undefined;
  onDisplayedRowsChange?: ((rows: T[]) => void) | undefined;
  columns: AssessmentColumn<T>[];
  label: string;
  onPreview?: ((row: T) => void) | undefined;
  /** Editing is an explicit row action, never a preview eye. */
  onEdit?: ((row: T) => void) | undefined;
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
  const navigate = useNavigate();
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
        for (const column of columns)
          if (column.key && kindOf(column) === "date" && next[column.key] == null)
            delete (next as Record<string, unknown>)[column.key];
        return next as T;
      }),
    [rows, statusKeys, columns],
  );
  const tableColumns = useMemo(
    () =>
      defineColumns<T>((c) => [
        ...columns.map((column, index) => {
          const raw = (row: T) => byIdRef.current.get(row.id) ?? row;
          const cell = (row: T) => column.value(raw(row));
          const size = column.width === undefined ? {} : { width: column.width };
          const first = index === 0 ? { hideable: false as const } : {};
          if (index === 0 && model)
            return c.id(column.key ?? "id", {
              header: column.label,
              minWidth: 220,
              ...size,
              hideable: false,
              preview: onPreview ? (row) => onPreview(raw(row)) : undefined,
              active: (row) => row.id === selectedId,
              cell: (row) => (
                <RecordLink table={model} record={raw(row)}>
                  {cell(row)}
                </RecordLink>
              ),
            });
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
        ...(onEdit
          ? [
              c.actions((row) => [
                {
                  label: "Edit record",
                  onSelect: () => onEdit(byIdRef.current.get(row.id) ?? row),
                },
              ]),
            ]
          : []),
      ]),
    [columns, model, onPreview, onEdit, selectedId],
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
  useDisplayedRecords(table, onDisplayedRowsChange, byId);
  const message: AssessmentEmpty = typeof empty === "string" ? { title: empty } : (empty ?? {});
  return (
    <DataTable
      responsive
      table={table}
      fill={fill}
      onRowClick={
        model
          ? (row) => void navigate(recordDestination(model, byId.get(row.id) ?? row))
          : undefined
      }
      empty={{
        illustration: message.illustration ?? "records",
        title: message.title ?? `No ${label.toLowerCase()} yet`,
        description: message.description,
        action: message.action,
      }}
      toolbar={
        <Toolbar
          search={String(table.state.globalFilter ?? "")}
          onSearch={(value) => table.setGlobalFilter(value)}
          placeholder={search ?? `Find ${label.toLowerCase()}`}
          filters={filters.map((key) => (
            <DataTable.Filter key={key} table={table} column={key} />
          ))}
          actions={actions}
        >
          <DataTable.Columns table={table} />
          <DataTable.Settings table={table} />
        </Toolbar>
      }
    />
  );
}
