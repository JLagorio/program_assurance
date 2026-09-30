import { ProductCollection, type ProductCollectionProps } from "./product-collection";
import { RecordSummaryPreview } from "./record-summary-preview";
import { useMemo, useState, type ReactNode, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FileText, Link2, Plus } from "lucide-react";
import {
  Button,
  DateTime,
  KeyValue,
  Section,
  Skeleton,
  Text,
  TextLink,
  VisuallyHidden,
  Absent,
  DataTable,
  defineColumns,
  downloadText,
  useDataTable,
  type EmptyIllustrationKind,
} from "@ledger/design-system";
import { ProductRecordDialog } from "./product-record-dialog";
import { useWorkspace } from "@/components/app/workspace";
import { LevelIndicator, VocabularyValue } from "@/components/app/status";
import { useRow, useRows, type TableName, type Filters } from "@/lib/models";
import {
  displayValue,
  labelFor,
  systemColumns,
  type Collection,
  type DataRecord,
  type RecordValue,
} from "@/lib/records";
import {
  productCollectionNoun,
  productCreateLabel,
  productRecordNoun,
} from "@/lib/product-records";
import {
  neutralVocabulary,
  statusEntry,
  vocabularyFor,
  vocabularyForValue,
  vocabularyKind,
  type StatusVocabulary,
} from "@/lib/status";
import type { QueryStatus } from "./work-common";
export { QueryState } from "./work-common";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
  useEndOnHide,
} from "./record-preview";

/**
 * A stored value's status or level, looked up by the value alone.
 *
 * @deprecated Name the vocabulary: `<StatusBadge statuses={…} value={…} />` or
 * `<LevelIndicator levels={…} value={…} />` from `@/components/app/status`, with the maps in
 * `@/lib/status`, or `<FieldStatus table field value />` in an adapter that knows the field.
 */
export function StateBadge({ value }: { value: unknown }) {
  const text = value === null || value === undefined || value === "" ? null : String(value);
  return (
    <VocabularyValue
      values={vocabularyForValue(text) ?? neutralVocabulary([text])}
      value={text}
      size="xsmall"
    />
  );
}

/**
 * A related record's name: a Skeleton while it loads, "Could not load" when the lookup fails (the
 * region's alert says why), "Not available" when the record is missing or hidden, and Absent when
 * there is no relationship. Never a QueryState: one failure is reported once, for its region.
 */
export function RelationName({ table, id }: { table: TableName; id: string | null | undefined }) {
  const query = useRow(table, id);
  if (!id) return <Absent label="Not recorded" />;
  const row = query.data as unknown as DataRecord | null | undefined;
  if (row === undefined && query.isError)
    return <Text color="color.text.subtle">Could not load</Text>;
  if (row === undefined)
    return (
      <>
        <Skeleton shape="line" width={96} />
        <VisuallyHidden>Loading</VisuallyHidden>
      </>
    );
  if (row === null) return <Text color="color.text.subtle">Not available</Text>;
  const named = row["name"] ?? row["title"] ?? row["code"] ?? row["source_id"];
  if (named !== null && named !== undefined && named !== "") return <>{String(named)}</>;
  // A revision has no name of its own: it reads as its version, never as its id.
  const version = row["version_number"];
  if (typeof version === "number") return <>Version {version}</>;
  return <Text color="color.text.subtle">Unnamed {productRecordNoun(table)}</Text>;
}

export type DisplayColumn = {
  key: string;
  label?: string;
  render?: (row: DataRecord) => ReactNode;
  width?: number;
  /** The readable minimum; the identity column's is 180. */
  minWidth?: number | undefined;
  /** In a narrow container, lower numbers stay in the row longer; the identity is 0. */
  priority?: number | undefined;
  /**
   * The value the column sorts, filters, searches and exports by, when the row does not carry it
   * under `key`: a count of related records, a field of the latest revision. `render` still draws
   * the cell from the record as it came.
   */
  value?: ((row: DataRecord) => RecordValue | undefined) | undefined;
  /** The column's vocabulary from `@/lib/status`, for a status or level the model does not map
   * under `key` (a latest revision's severity): it sorts by rank and draws a badge or an indicator. */
  statuses?: StatusVocabulary | undefined;
  /**
   * What the column is, where neither the schema nor the key says: a derived count is a number. A
   * person (an assessor, an owner) is drawn with their avatar, and sorts, filters and searches by
   * the name `value` gives, never by the party's id.
   */
  kind?: "date" | "number" | "text" | "person" | undefined;
};
export type ModelTableEmpty = {
  title?: string;
  description?: string;
  illustration?: EmptyIllustrationKind | false;
  /** A compact collection's icon, beside its one-line empty. */
  icon?: ReactNode;
  action?: ReactNode;
};
const STATUS_KEYS = new Set([
  "status",
  "state",
  "severity",
  "determination",
  "decision",
  "priority",
]);
const CHIP_KEYS = new Set(["role", "method", "kind", "party_type"]);
const DATE_KEYS = /_(at|on|date)$/;
const NUMBER_KEYS = /_number$/;
const NUMBER_TYPES = /^(integer|bigint|smallint|numeric|real|double precision)/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:$|[T ])/;

type FieldKind = "status" | "date" | "number" | "category" | "text";

/** What a stored field is, from the schema where it is known and from its name where it is not. */
function fieldKind(
  table: string | undefined,
  collection: Collection | undefined,
  key: string,
): FieldKind {
  if (table && vocabularyFor(table, key)) return "status";
  if (STATUS_KEYS.has(key)) return "status";
  const column = collection?.columns.find((item) => item.name === key);
  if (column) {
    if (column.type.startsWith("timestamp") || column.type === "date") return "date";
    if (NUMBER_TYPES.test(column.type)) return "number";
    if (column.choices.length) return "category";
    return "text";
  }
  if (DATE_KEYS.test(key)) return "date";
  if (NUMBER_KEYS.test(key)) return "number";
  if (CHIP_KEYS.has(key) || /_type$/.test(key)) return "category";
  return "text";
}

/** A field's status vocabulary: the product's map, else the schema's choices or the values in words. */
function fieldVocabulary(
  table: string | undefined,
  collection: Collection | undefined,
  key: string,
  values: unknown[],
): StatusVocabulary {
  const mapped = table ? vocabularyFor(table, key)?.values : undefined;
  if (mapped) return mapped;
  const choices = collection?.columns.find((item) => item.name === key)?.choices;
  // An unmapped status keeps the words and tone its value has elsewhere, in the schema's order.
  const known = neutralVocabulary(choices?.length ? choices : values);
  return Object.fromEntries(
    Object.entries(known).map(([value, entry]) => {
      const elsewhere = statusEntry(vocabularyForValue(value), value);
      return [value, elsewhere ? { ...elsewhere, rank: entry.rank } : entry];
    }),
  );
}

/** The order a collection reads in before the reader sorts it: sequence, then newest. */
export function defaultOrder<T extends Record<string, unknown>>(rows: T[]): T[] {
  const sample = rows[0];
  if (!sample) return rows;
  const by = (key: string, direction: 1 | -1) =>
    [...rows].sort((a, b) => {
      const left = a[key];
      const right = b[key];
      if (left === right) return 0;
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;
      return (left < right ? -1 : 1) * direction;
    });
  if ("sequence_number" in sample) return by("sequence_number", 1);
  if ("version_number" in sample) return by("version_number", -1);
  if ("updated_at" in sample) return by("updated_at", -1);
  if ("created_at" in sample) return by("created_at", -1);
  return rows;
}

/** The identity column: the name, title or statement, else the first. A preview's title names it,
 * so its facts leave it out. */
function identityIndex(columns: DisplayColumn[]) {
  const named = columns.findIndex(
    ({ key }) => key === "name" || key === "title" || key === "statement",
  );
  return named < 0 ? 0 : named;
}

/** A register of records on the kit's DataTable: the toolbar, the kinds from the schema, the two empties. */
export function ModelTable({
  model,
  rows,
  columns,
  onPreview,
  selectedId,
  onDisplayedRowsChange,
  empty,
  searchLabel = "Search records",
  filters,
  actions,
  commands,
  view,
  fill,
  queries,
  noun,
  compact,
}: {
  model: TableName;
  rows: DataRecord[];
  columns: DisplayColumn[];
  onPreview?: ((row: DataRecord) => void) | undefined;
  selectedId?: string | undefined;
  onDisplayedRowsChange?: ((rows: DataRecord[]) => void) | undefined;
  /** A string is the description under "Nothing recorded yet". */
  empty?: string | ModelTableEmpty;
  searchLabel?: string;
  /** Column keys to expose as chips; by default every status-like or type-like column. */
  filters?: string[];
  /** The toolbar's trailing actions: the create verb, small. */
  actions?: ReactNode;
  commands?: ProductCollectionProps<DataRecord>["commands"];
  /** Names the reader's column layout in this browser. */
  view?: string;
  /** The register is the page's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
  /** The queries the rows come from: while they load the toolbar stays and the rows are skeletons. */
  queries?: QueryStatus[] | undefined;
  /** What a row is, for the announced result ("8 of 24 risks"); the model's noun by default. */
  noun?: { one: string; other: string } | undefined;
  /** A few rows beside other content (a record body's section): ProductCollection's compact form. */
  compact?: boolean | undefined;
}) {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === model);
  const [preview, setPreview] = useState<DataRecord | null>(null);
  useEndOnHide(() => setPreview(null));
  const openPreview = onPreview ?? setPreview;
  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const byIdRef = useRef(byId);
  byIdRef.current = byId;
  const kinds = useMemo(
    () =>
      new Map(
        columns.map((column) => [
          column.key,
          column.statuses ? "status" : (column.kind ?? fieldKind(model, collection, column.key)),
        ]),
      ),
    [columns, model, collection],
  );
  // A derived value joins the row under its key, so the sort, the chips, the search and the export
  // see it. A category reads in words, so the chips, the search and the cells agree; statuses keep
  // their stored value and read through their vocabulary. Renders and the row click see the record
  // as it came.
  const data = useMemo(
    () =>
      defaultOrder(rows).map((row) => {
        const next: DataRecord = { ...row };
        for (const column of columns) {
          if (column.value) {
            const derived = column.value(row);
            if (derived === undefined) delete next[column.key];
            else next[column.key] = derived;
          }
          const value = next[column.key];
          const kind = kinds.get(column.key);
          if (kind === "category" && typeof value === "string") next[column.key] = labelFor(value);
          if (kind === "date" && next[column.key] == null) delete next[column.key];
        }
        return next;
      }),
    [rows, columns, kinds],
  );
  const vocabularies = useMemo(
    () =>
      new Map(
        columns
          .filter((column) => kinds.get(column.key) === "status")
          .map((column) => [
            column.key,
            column.statuses ??
              fieldVocabulary(
                model,
                collection,
                column.key,
                data.map((row) => row[column.key]),
              ),
          ]),
      ),
    [columns, kinds, model, collection, data],
  );
  const primaryIndex = identityIndex(columns);
  const tableColumns = useMemo(
    () =>
      defineColumns<DataRecord>((c) =>
        columns.map((column, index) => {
          const primary = index === primaryIndex;
          const raw = (row: DataRecord) => byIdRef.current.get(row.id) ?? row;
          const header = column.label ?? labelFor(column.key.replace(/_id$/, ""));
          const render = column.render;
          const size = {
            ...(column.width === undefined ? {} : { width: column.width }),
            ...(column.minWidth === undefined ? {} : { minWidth: column.minWidth }),
            ...(column.priority === undefined ? {} : { priority: column.priority }),
          };
          const plain = (row: DataRecord) => {
            const value = row[column.key];
            return value === null || value === undefined || value === "" ? (
              <Absent />
            ) : (
              displayValue(value)
            );
          };
          const cell = render ? (row: DataRecord) => render(raw(row)) : plain;
          if (primary)
            // A readable minimum, so the name shares the spare width with the unsized columns.
            return c.id(column.key, {
              header,
              hideable: false,
              minWidth: 180,
              priority: 0,
              ...size,
              preview: (row) => openPreview(raw(row)),
              active: (row) => row.id === (selectedId ?? preview?.id),
              cell: (row) => (
                <RecordLink table={model} record={raw(row)}>
                  {render?.(raw(row)) ?? displayValue(row[column.key])}
                </RecordLink>
              ),
            });
          const kind = kinds.get(column.key);
          if (kind === "status") {
            const statuses = vocabularies.get(column.key) ?? neutralVocabulary([]);
            const level = vocabularyKind(statuses) === "level";
            return c.status(column.key, {
              header,
              width: 140,
              statuses,
              ...size,
              ...(render
                ? { cell }
                : level
                  ? {
                      cell: (row: DataRecord) => (
                        <LevelIndicator
                          levels={statuses}
                          value={row[column.key] == null ? null : String(row[column.key])}
                        />
                      ),
                    }
                  : {}),
            });
          }
          if (kind === "date")
            return c.date(column.key, { header, width: 130, ...size, ...(render ? { cell } : {}) });
          if (kind === "number")
            return c.number(column.key, {
              header,
              width: 110,
              ...size,
              ...(render ? { cell } : {}),
            });
          if (kind === "person")
            return c.person(column.key, { header, ...size, ...(render ? { cell } : {}) });
          return c.text(column.key, { header, ...size, cell });
        }),
      ),
    [columns, primaryIndex, kinds, vocabularies, model, openPreview, selectedId, preview?.id],
  );
  const chips =
    filters ??
    columns
      .filter((column, index) => {
        const kind = kinds.get(column.key);
        return index > 0 && (kind === "status" || kind === "category");
      })
      .map((column) => column.key)
      .slice(0, 3);
  const table = useDataTable({
    columns: tableColumns,
    data,
    getRowId: (row) => row.id,
    label: searchLabel.replace(/^Search /, "") || "Records",
    pageSize: 20,
    resizable: true,
    reorderable: true,
    ...(view ? { view } : {}),
  });
  const displayed = useDisplayedRecords(table, onDisplayedRowsChange, byId);
  const message: ModelTableEmpty =
    typeof empty === "string" ? { description: empty } : (empty ?? {});
  return (
    <>
      <ProductCollection
        table={table}
        fill={fill}
        compact={compact}
        queries={queries ?? []}
        noun={noun ?? { one: productRecordNoun(model), other: productCollectionNoun(model) }}
        onRowClick={(row) => void navigate(recordDestination(model, byId.get(row.id) ?? row))}
        empty={{
          illustration: message.illustration ?? "records",
          title: message.title ?? "Nothing recorded yet",
          description: message.description,
          ...(message.icon ? { icon: message.icon } : {}),
          action: message.action ?? actions,
        }}
        searchLabel={searchLabel}
        filters={chips.map((key) => (
          <DataTable.Filter key={key} table={table} column={key} />
        ))}
        action={actions}
        commands={commands}
      />
      {preview && !onPreview && (
        <RecordSummaryPreview
          model={model}
          record={byId.get(preview.id) ?? preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={columns.filter((_, index) => index !== primaryIndex)}
        />
      )}
    </>
  );
}
export function EntityEditor({
  table,
  existing,
  initialValues,
  operationLabel,
  onSaved,
  onCancel,
}: {
  table: TableName;
  existing?: DataRecord | undefined;
  initialValues?: Record<string, unknown> | undefined;
  /** The operation the trigger, the dialog title and the primary share: "Link observation". */
  operationLabel?: string | undefined;
  onSaved?: (row: DataRecord) => void | Promise<void>;
  onCancel: () => void;
}) {
  return (
    <ProductRecordDialog
      table={table}
      existing={existing}
      initialValues={initialValues}
      operationLabel={operationLabel}
      onSaved={onSaved}
      onClose={onCancel}
    />
  );
}

/**
 * A stored fact as the reader reads it: nothing is Absent, a status or level through its
 * vocabulary, a date or a moment through DateTime (the provider's locale and zone, no seconds),
 * and anything else as the record browser shows it.
 */
export function FactValue({
  table,
  field,
  value,
}: {
  /** The record's table, so the field's vocabulary and schema type decide; by name without it. */
  table?: string | undefined;
  field: string;
  value: RecordValue | undefined;
}) {
  const workspace = useWorkspace();
  if (value === null || value === undefined || value === "") return <Absent label="Not recorded" />;
  const collection = table ? workspace.collections.find((item) => item.name === table) : undefined;
  const kind = fieldKind(table, collection, field);
  if (kind === "status" && typeof value === "string") {
    const values =
      (table ? vocabularyFor(table, field)?.values : undefined) ??
      vocabularyForValue(value) ??
      neutralVocabulary([value]);
    return <VocabularyValue values={values} value={value} />;
  }
  if (kind === "date" && typeof value === "string" && ISO_DATE.test(value))
    return <DateTime value={value} />;
  if (kind === "category" && typeof value === "string") return labelFor(value);
  return displayValue(value);
}

/** Past this many characters a label no longer fits KeyValue's default 104px column. */
const LONG_LABEL = 14;

export function ModelFacts({
  record,
  fields,
  table,
  labelWidth,
}: {
  record: DataRecord;
  fields: (string | DisplayColumn)[];
  /** The record's table: its vocabularies and column types format the values. */
  table?: TableName | undefined;
  /** The label column; by default 104, or 160 when a label is longer than fits. */
  labelWidth?: number | undefined;
}) {
  const columns = fields.map((field): DisplayColumn =>
    typeof field === "string" ? { key: field } : field,
  );
  const labels = columns.map((column) => column.label ?? labelFor(column.key.replace(/_id$/, "")));
  const width = labelWidth ?? (labels.some((label) => label.length > LONG_LABEL) ? 160 : undefined);
  if (!columns.length) return null;
  return (
    <KeyValue.Group {...(width === undefined ? {} : { labelWidth: width })}>
      {columns.map((column, index) => {
        const value = column.value ? column.value(record) : record[column.key];
        return (
          <KeyValue key={column.key} label={labels[index]!} wrap>
            {column.render ? (
              column.render(record)
            ) : column.statuses ? (
              <VocabularyValue
                values={column.statuses}
                value={value === null || value === undefined ? null : String(value)}
              />
            ) : (
              <FactValue table={table} field={column.key} value={value} />
            )}
          </KeyValue>
        );
      })}
    </KeyValue.Group>
  );
}

/**
 * The record a link table points at, beside the one the section sits on: `issue_observations` on
 * an issue links an observation. A table with a name, a title or an authored required field is a
 * record of its own, which is created, not linked.
 */
function linkTarget(collection: Collection | undefined, context: Record<string, unknown>) {
  if (!collection) return undefined;
  if (collection.columns.some((column) => column.name === "name" || column.name === "title"))
    return undefined;
  // Tenant-scoped keys are composite, (tenant_id, x_id): the relation's own column is the rest.
  const own = (columns: string[]) => columns.filter((column) => !systemColumns.has(column));
  const relations = collection.relations.filter((relation) => {
    const columns = own(relation.columns);
    return relation.target_schema === "public" && columns.length === 1 && !(columns[0]! in context);
  });
  if (relations.length !== 1) return undefined;
  const keys = new Set(collection.relations.flatMap((relation) => relation.columns));
  const authored = collection.columns.some(
    (column) =>
      !systemColumns.has(column.name) &&
      !keys.has(column.name) &&
      column.required &&
      column.default === null,
  );
  return authored ? undefined : relations[0]!.target_table;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** A collection title inside a sentence: lower case, except an acronym ("POA&M items"). */
function inSentence(title: string) {
  return /^[A-Z0-9&]{2,}\b/.test(title) ? title : title.charAt(0).toLowerCase() + title.slice(1);
}

/** A workflow-specific section keeps typed relationships in the prototype rather than redirecting to admin lists. */
export function EntitySection({
  table,
  filters = {},
  title,
  columns,
  initialValues,
  onOpen,
  selectedId,
  onDisplayedRowsChange,
  description,
  operation,
  readOnly = false,
  appendOnly = false,
  fill,
  showHeading = false,
  compact = showHeading,
  queries,
}: {
  table: TableName;
  /** The section's own heading, among a record body's other sections. */
  showHeading?: boolean;
  /**
   * A few rows beside other content: a one-line empty beside an icon and a lean toolbar
   * (ProductCollection's `compact`). A headed section is compact unless it says otherwise; a tab
   * whose only content is this collection is not.
   */
  compact?: boolean | undefined;
  filters?: Filters;
  title: string;
  columns: DisplayColumn[];
  initialValues?: Record<string, unknown>;
  onOpen?: ((row: DataRecord) => void) | undefined;
  selectedId?: string | undefined;
  onDisplayedRowsChange?: ((rows: DataRecord[]) => void) | undefined;
  /** The empty collection's explanation, for a reader who can add to it. */
  description?: string;
  /**
   * What the add action does, on its trigger, the dialog's title and its primary. A link table
   * says Link and the record it points at ("Link observation"); a record table says Create.
   */
  operation?: string | undefined;
  readOnly?: boolean;
  appendOnly?: boolean;
  /** The register is the page's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
  /** The lookups the columns read (the people a `person` column names), so the collection loads,
   * and fails, with them. */
  queries?: QueryStatus[] | undefined;
}) {
  const workspace = useWorkspace();
  const query = useRows(table, filters);
  const [editing, setEditing] = useState<DataRecord | "new" | null>(null);
  const [selected, setSelected] = useState<DataRecord | null>(null);
  const [displayed, setDisplayed] = useState<DataRecord[]>([]);
  // The control that opened the dialog; it takes focus back when the dialog closes.
  const opener = useRef<HTMLElement | null>(null);
  const collection = workspace.collections.find((item) => item.name === table);
  const context = { ...filters, ...initialValues };
  const target = linkTarget(collection, context);
  const addLabel =
    operation ??
    (target ? `Link ${productRecordNoun(target)}` : productCreateLabel(table, context));
  const canAdd = !readOnly && workspace.role !== "viewer" && Boolean(collection?.can_insert);
  const open = (next: DataRecord | "new") => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditing(next);
  };
  const close = (then?: () => void) => {
    setEditing(null);
    const back = opener.current;
    opener.current = null;
    requestAnimationFrame(() => {
      if (back?.isConnected) back.focus();
      // A preview opened after a save starts from the opener, so closing it comes back there.
      then?.();
    });
  };
  const add = (size: "small" | "medium") =>
    canAdd ? (
      <Button size={size} variant="primary" iconBefore={<Plus />} onClick={() => open("new")}>
        {addLabel}
      </Button>
    ) : undefined;
  const collectionName = inSentence(title);
  // A record's own name; a link row reads as the record it points at, the section's first column.
  const previewTitle = (row: DataRecord): ReactNode => {
    const named = row["name"] ?? row["title"] ?? row["code"];
    if (named !== null && named !== undefined && named !== "") return String(named);
    const first = columns[0];
    if (first?.render) return first.render(row);
    return capitalize(productRecordNoun(table, row));
  };
  const content = (
    <>
      {editing && (
        <EntityEditor
          key={editing === "new" ? "new" : editing.id}
          table={table}
          existing={editing === "new" ? undefined : editing}
          initialValues={context}
          operationLabel={editing === "new" ? addLabel : undefined}
          onSaved={(row) => close(() => setSelected(row))}
          onCancel={() => close()}
        />
      )}
      {selected && (
        <RecordPreviewPanel
          title={previewTitle(selected)}
          label={`${capitalize(productRecordNoun(table))} preview`}
          defaultWidth={560}
          onClose={() => setSelected(null)}
          recordActions={
            !readOnly &&
            !appendOnly &&
            workspace.role !== "viewer" &&
            collection?.can_update &&
            selected["state"] !== "published" &&
            selected["tenant_id"] !== null && (
              <Button size="small" variant="primary" onClick={() => open(selected)}>
                Edit {productRecordNoun(table, selected)}
              </Button>
            )
          }
          navigation={
            <RecordPreviewActions
              table={table}
              record={selected}
              rows={displayed}
              onSelect={setSelected}
            />
          }
        >
          <ModelFacts
            record={selected}
            fields={columns.filter((_, index) => index !== identityIndex(columns))}
            table={table}
          />
        </RecordPreviewPanel>
      )}
      <ModelTable
        model={table}
        rows={(query.data ?? []) as unknown as DataRecord[]}
        queries={[query, ...(queries ?? [])]}
        columns={columns}
        fill={fill}
        compact={compact}
        onPreview={onOpen ?? setSelected}
        selectedId={selectedId ?? selected?.id}
        onDisplayedRowsChange={(rows) => {
          setDisplayed(rows);
          onDisplayedRowsChange?.(rows);
        }}
        searchLabel={`Search ${collectionName}`}
        actions={add("small")}
        empty={{
          title: `No ${collectionName} yet`,
          description: canAdd
            ? (description ??
              (target && !operation
                ? `Link the first ${productRecordNoun(target)} to this record.`
                : `${addLabel} to start this collection.`))
            : "Nothing has been recorded here yet.",
          // A link is drawn as a link, a record of its own as a document.
          icon: target ? <Link2 /> : <FileText />,
          action: add(compact ? "small" : "medium"),
        }}
      />
    </>
  );
  return showHeading ? <Section title={title}>{content}</Section> : content;
}
export function InspectLink({ table, id }: { table: TableName; id?: string }) {
  return (
    <TextLink
      render={
        id ? (
          <Link to="/records/$collection/$recordId" params={{ collection: table, recordId: id }} />
        ) : (
          <Link to="/records/$collection" params={{ collection: table }} />
        )
      }
    >
      Inspect backend record{!id ? "s" : ""}
    </TextLink>
  );
}
/** Save data as a JSON file, through the kit's download helper. */
export function downloadJson(filename: string, data: unknown) {
  downloadText(JSON.stringify(data, null, 2), filename, { type: "application/json" });
}
