import { ProductCollection } from "./product-collection";
import { RecordSummaryPreview } from "./record-summary-preview";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Absent,
  DataTable,
  defineColumns,
  useDataTable,
  type EmptyIllustrationKind,
} from "@ledger/design-system";
import { useNavigate } from "@tanstack/react-router";
import type { TableName } from "@/lib/models";
import { RecordLink, recordDestination, useDisplayedRecords } from "./record-preview";
import { productCollectionNoun, productRecordNoun } from "@/lib/product-records";
import { LevelIndicator, VocabularyValue } from "@/components/app/status";
import {
  neutralVocabulary,
  vocabularyFor,
  vocabularyKind,
  type StatusVocabulary,
} from "@/lib/status";
import type { QueryStatus } from "./work-common";

/*
 * The assessment registers on the kit's DataTable: one toolbar row (search, the chips named in
 * `filters`, then Sort, Columns, Settings and the actions), the kinds decided by the column's key,
 * the two empties drawn by the table. A column with a `key` sorts, searches and filters on that
 * field and, without `value`, is drawn by its kind: a status through its vocabulary, a date through
 * the provider, nothing as Absent. One without a key is drawn as given.
 */

export type AssessmentColumn<T> = {
  label: string;
  /** The cell, when the field's own drawing will not do (a link, a derived name). */
  value?: ((row: T) => ReactNode) | undefined;
  /** A fixed width. The name takes `minWidth` instead, so it shares the spare width. */
  width?: number;
  /** The readable minimum; the name's is 180. */
  minWidth?: number | undefined;
  /** The field behind the cell. With it the column sorts and searches; a status or a type also filters. */
  key?: keyof T & string;
  /** A person (an owner, an assessor) is drawn with their avatar, and faceted by name. */
  kind?: "text" | "status" | "date" | "number" | "person";
  /** A status or level column's vocabulary from `@/lib/status`; the model's own map unsaid. */
  statuses?: StatusVocabulary | undefined;
  /** In a narrow container, lower numbers stay in the row longer; the name is 0. */
  priority?: number | undefined;
};

export type AssessmentEmpty = {
  title?: string;
  description?: string;
  illustration?: EmptyIllustrationKind | false;
  /** A compact collection's icon, beside its one-line empty. */
  icon?: ReactNode;
  action?: ReactNode;
};

const STATUS_KEYS = /^(status|state|determination|severity|priority|decision)$/;
const DATE_KEYS = /_(at|on|date)$/;

const kindOf = <T,>(column: AssessmentColumn<T>): AssessmentColumn<T>["kind"] =>
  column.kind ??
  (column.statuses
    ? "status"
    : column.key && STATUS_KEYS.test(column.key)
      ? "status"
      : column.key && DATE_KEYS.test(column.key)
        ? "date"
        : "text");

const isNothing = (value: unknown) => value === null || value === undefined || value === "";

export function AssessmentTable<T extends { id: string }>({
  rows,
  model,
  selectedId,
  onDisplayedRowsChange,
  columns,
  label,
  onPreview,
  onEdit,
  readOnly = false,
  empty,
  filters = [],
  actions,
  initialFilters,
  view,
  keepQuestion,
  search,
  fill,
  queries,
  sort,
  compact,
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
  readOnly?: boolean;
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
  /** Where the reader's question (search, sort, filters, page) is kept for the session: the
   * `view` unsaid; a key of its own when the table's starting filters change. */
  keepQuestion?: string | false | undefined;
  /** The search field's placeholder. */
  search?: string | undefined;
  /** The register is the page's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
  /** The queries the rows come from: while they load the toolbar stays and the rows are skeletons;
   * a failure is one alert with Retry. */
  queries?: QueryStatus[] | undefined;
  /** The sort menu; off where the order is the meaning (steps in sequence). */
  sort?: boolean | undefined;
  /** A few rows beside other content (a section of a tab, a preview): ProductCollection's
   * compact form, with a one-line empty beside `empty.icon`. */
  compact?: boolean | undefined;
}) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<T | null>(null);
  const openPreview = onPreview ?? setPreview;
  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const byIdRef = useRef(byId);
  byIdRef.current = byId;
  // A missing date leaves the row, so the kit's date column shows Absent and sorts it last. The
  // cells and the row click still see the record as it came.
  const data = useMemo(
    () =>
      rows.map((row) => {
        const next = { ...row } as T & Record<string, unknown>;
        for (const column of columns)
          if (column.key && kindOf(column) === "date" && next[column.key] == null)
            delete (next as Record<string, unknown>)[column.key];
        return next as T;
      }),
    [rows, columns],
  );
  const vocabularies = useMemo(
    () =>
      new Map(
        columns
          .filter((column) => column.key && kindOf(column) === "status")
          .map((column) => {
            const key = column.key!;
            return [
              key,
              column.statuses ??
                (model ? vocabularyFor(model, key)?.values : undefined) ??
                neutralVocabulary(rows.map((row) => row[key])),
            ] as const;
          }),
      ),
    [columns, model, rows],
  );
  /** A column's cell from the record as it came: the caller's drawing, else the field by kind. */
  const cellOf = useCallback(
    (column: AssessmentColumn<T>) => (row: T) => {
      if (column.value) return column.value(row);
      const value = column.key ? row[column.key] : undefined;
      if (isNothing(value)) return <Absent label="Not recorded" />;
      const statuses = column.key ? vocabularies.get(column.key) : undefined;
      if (statuses) return <VocabularyValue values={statuses} value={String(value)} />;
      return String(value);
    },
    [vocabularies],
  );
  const namedColumn = columns.findIndex(({ key }) => key === "name" || key === "title");
  const primaryIndex = namedColumn < 0 ? 0 : namedColumn;
  const tableColumns = useMemo(
    () =>
      defineColumns<T>((c) => [
        ...columns.map((column, index) => {
          const raw = (row: T) => byIdRef.current.get(row.id) ?? row;
          const draw = cellOf(column);
          const cell = (row: T) => draw(raw(row));
          const size = {
            ...(column.width === undefined ? {} : { width: column.width }),
            ...(column.minWidth === undefined ? {} : { minWidth: column.minWidth }),
            ...(column.priority === undefined ? {} : { priority: column.priority }),
          };
          const primary = index === primaryIndex;
          const first = primary ? { hideable: false as const, priority: 0 } : {};
          if (primary && model)
            // A readable minimum, so the name shares the spare width with the unsized columns.
            return c.id(column.key ?? "id", {
              header: column.label,
              minWidth: 180,
              priority: 0,
              ...size,
              hideable: false,
              preview: (row) => openPreview(raw(row)),
              active: (row) => row.id === (selectedId ?? preview?.id),
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
          if (kind === "status") {
            const statuses = vocabularies.get(key) ?? neutralVocabulary([]);
            const level = vocabularyKind(statuses) === "level";
            return c.status(key, {
              header: column.label,
              statuses,
              ...(column.value
                ? { cell }
                : level
                  ? {
                      cell: (row: T) => {
                        const value = raw(row)[key];
                        return (
                          <LevelIndicator
                            levels={statuses}
                            value={isNothing(value) ? null : String(value)}
                          />
                        );
                      },
                    }
                  : {}),
              ...size,
              ...first,
            });
          }
          const drawn = column.value ? { cell } : {};
          if (kind === "date")
            return c.date(key, { header: column.label, ...drawn, ...size, ...first });
          if (kind === "number")
            return c.number(key, { header: column.label, ...drawn, ...size, ...first });
          if (kind === "person")
            return c.person(key, { header: column.label, ...drawn, ...size, ...first });
          return c.text(key, { header: column.label, cell, ...size, ...first });
        }),
        ...(onEdit
          ? [
              c.actions((row) => [
                {
                  label: model ? `Edit ${productRecordNoun(model)}` : `Edit ${label.toLowerCase()}`,
                  onSelect: () => onEdit(byIdRef.current.get(row.id) ?? row),
                },
              ]),
            ]
          : []),
      ]),
    [
      columns,
      cellOf,
      vocabularies,
      model,
      openPreview,
      onEdit,
      selectedId,
      preview?.id,
      label,
      primaryIndex,
    ],
  );
  const primaryColumn = columns[primaryIndex];
  const noun = model ? productRecordNoun(model) : label.toLowerCase();
  // A row's name as the reader sees it ("Step 2", the title), never its id.
  const nameOf = (record: T) => {
    const drawn = primaryColumn?.value?.(record);
    if (typeof drawn === "string" && drawn) return drawn;
    const value = primaryColumn?.key ? record[primaryColumn.key] : undefined;
    return isNothing(value) ? noun.charAt(0).toUpperCase() + noun.slice(1) : String(value);
  };
  const table = useDataTable({
    columns: tableColumns,
    data,
    getRowId: (row) => row.id,
    rowLabel: (row: T) => nameOf(byIdRef.current.get(row.id) ?? row),
    label,
    pageSize: 20,
    resizable: true,
    reorderable: true,
    ...(view ? { view } : {}),
    ...(initialFilters ? { initialState: { columnFilters: initialFilters } } : {}),
  });
  const displayed = useDisplayedRecords(table, onDisplayedRowsChange, byId);
  const message: AssessmentEmpty = typeof empty === "string" ? { title: empty } : (empty ?? {});
  const others = columns.filter((_, index) => index !== primaryIndex);
  return (
    <>
      <ProductCollection
        table={table}
        fill={fill}
        queries={queries ?? []}
        keepQuestion={keepQuestion ?? true}
        compact={compact}
        {...(sort === undefined ? {} : { sort })}
        noun={{
          one: noun,
          other: model ? productCollectionNoun(model) : label.toLowerCase(),
        }}
        onRowClick={
          model
            ? (row) => void navigate(recordDestination(model, byId.get(row.id) ?? row))
            : undefined
        }
        empty={{
          illustration: message.illustration ?? "records",
          title: message.title ?? `No ${label.toLowerCase()} yet`,
          description: message.description,
          ...(message.icon ? { icon: message.icon } : {}),
          action: message.action ?? actions,
        }}
        searchLabel={search ?? `Find ${label.toLowerCase()}`}
        filters={filters.map((key) => (
          <DataTable.Filter key={key} table={table} column={key} />
        ))}
        action={actions}
      />
      {preview && model && !onPreview && (
        <RecordSummaryPreview
          model={model}
          readOnly={readOnly}
          onEdit={onEdit ? () => onEdit(byId.get(preview.id) ?? preview) : undefined}
          record={byId.get(preview.id) ?? preview}
          // A drawn name (a step's "Step 2") titles the preview; a record with a name finds it.
          {...(primaryColumn?.value ? { title: nameOf(byId.get(preview.id) ?? preview) } : {})}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          // The preview reads as the row does: the same labels and the same drawing per field.
          fields={others.map((column, index) => ({
            key: column.key ?? `column_${index}`,
            label: column.label,
            render: cellOf(column),
          }))}
        />
      )}
    </>
  );
}
