import { ProductCollection, type ProductCollectionProps } from "./product-collection";
import { useCollectionTable } from "./collection-question";
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
  Person,
  type EmptyIllustrationKind,
  type KeyValueLabelWidth,
} from "@ledger/design-system";
import { ProductRecordDialog } from "./product-record-dialog";
import { useWorkspace } from "@/components/app/workspace";
import { LevelIndicator, VocabularyValue } from "@/components/app/status";
import { linkedName } from "@/lib/link-name";
import { useRow, useRows, type TableName, type Filters } from "@/lib/models";
import {
  displayValue,
  labelFor,
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
 * region's alert says why), and Absent when there is no relationship ("Not recorded") or the record
 * is missing or hidden ("Not available"). Never a QueryState: one failure is reported once, for
 * its region.
 */
export function RelationName({ table, id }: { table: TableName; id: string | null | undefined }) {
  const query = useRow(table, id);
  if (!id) return <Absent />;
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
  if (row === null) return <Absent label="Not available" />;
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
   * What the column is: a derived count is a number, and a category (a method, a type) is a fixed
   * list of values, read in words and offered as a filter. It is declared here, never read from the
   * record schema, so a register or a record page opens without it: where a column leaves it out,
   * a status the model maps (or a `status`, `state`, `severity`, … key) is a status, and otherwise
   * its key decides (`_at`, `_on` and `_date` are dates, `_number` a number, `_type`, `kind`,
   * `method` and `role` a category, anything else text). A person (an assessor, an owner) is drawn
   * with their avatar, and sorts, filters and searches by their name, never by the party's id: the
   * name `value` gives, or, for a column keyed by a party id with no `value`, the name ModelTable
   * reads for it. `render` then draws the fact (ModelFacts) and the table draws the person.
   */
  kind?: "date" | "number" | "category" | "text" | "person" | undefined;
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

/**
 * What a stored field is: a status by its vocabulary, else by the schema where a surface that
 * loaded it passes it (a preview, a form), else by its name.
 */
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

/** A column's status vocabulary: the product's map, else the values it holds in words. */
function fieldVocabulary(
  table: string | undefined,
  key: string,
  values: unknown[],
): StatusVocabulary {
  const mapped = table ? vocabularyFor(table, key)?.values : undefined;
  if (mapped) return mapped;
  // An unmapped status keeps the words and tone its value has elsewhere.
  const known = neutralVocabulary(values);
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

/**
 * A register of records on the kit's DataTable: the toolbar, the columns' declared kinds, the two
 * empties. It reads no record schema: a column's kind is declared on it (`kind`, `statuses`) or
 * follows its key.
 */
export function ModelTable({
  model,
  rows,
  columns,
  onPreview,
  selectedId,
  onDisplayedRowsChange,
  empty,
  searchLabel,
  filters,
  actions,
  actionVariant,
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
  /** The search's placeholder and name, "Find" and the collection ("Find risks") unsaid; the table
   * is named by the collection it searches. */
  searchLabel?: string | undefined;
  /** Column keys to expose as chips; by default every status-like or type-like column. */
  filters?: string[];
  /** The toolbar's trailing actions: the create verb, small. */
  actions?: ReactNode;
  /** The create action's weight: ProductCollection's `actionVariant`. */
  actionVariant?: ProductCollectionProps<DataRecord>["actionVariant"];
  commands?: ProductCollectionProps<DataRecord>["commands"];
  /** Names the reader's column layout in this browser, and the collection's question in the
   * address (ProductCollection's `keepQuestion`). */
  view?: string | undefined;
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
  const primaryIndex = identityIndex(columns);
  const [preview, setPreview] = useState<DataRecord | null>(null);
  useEndOnHide(() => setPreview(null));
  const openPreview = onPreview ?? setPreview;
  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const byIdRef = useRef(byId);
  byIdRef.current = byId;
  // A person column named by a party id alone reads its people's names once, for the whole table.
  const peopleKeys = useMemo(
    () =>
      new Set(
        columns
          .filter((column) => column.kind === "person" && !column.value)
          .map((column) => column.key),
      ),
    [columns],
  );
  const people = useRows("parties", undefined, {
    columns: ["id", "name"],
    enabled: peopleKeys.size > 0,
  });
  const names = useMemo(
    () => new Map((people.data ?? []).map((party) => [party.id, party.name])),
    [people.data],
  );
  const kinds = useMemo(
    () =>
      new Map(
        columns.map((column) => [
          column.key,
          column.statuses ? "status" : (column.kind ?? fieldKind(model, undefined, column.key)),
        ]),
      ),
    [columns, model],
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
          } else if (peopleKeys.has(column.key)) {
            const id = row[column.key];
            const name = typeof id === "string" ? names.get(id) : undefined;
            if (name) next[column.key] = name;
            else delete next[column.key];
          }
          const value = next[column.key];
          const kind = kinds.get(column.key);
          if (kind === "category" && typeof value === "string") next[column.key] = labelFor(value);
          if (kind === "date" && next[column.key] == null) delete next[column.key];
        }
        return next;
      }),
    [rows, columns, kinds, peopleKeys, names],
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
                column.key,
                data.map((row) => row[column.key]),
              ),
          ]),
      ),
    [columns, kinds, model, data],
  );
  const nouns = noun ?? { one: productRecordNoun(model), other: productCollectionNoun(model) };
  const placeholder = searchLabel ?? `Find ${nouns.other}`;
  // The preview is the table's, so the columns are not rebuilt as the reader steps through rows.
  const tablePreview = useMemo(
    () => ({
      onPreview: (row: DataRecord) => openPreview(byIdRef.current.get(row.id) ?? row),
      activeId: selectedId ?? preview?.id ?? null,
    }),
    [openPreview, selectedId, preview?.id],
  );
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
            // A name, not a code: a readable minimum, so it shares the spare width with the unsized
            // columns. The table's preview puts the eye at its end.
            return c.text(column.key, {
              header,
              hideable: false,
              minWidth: 180,
              priority: 0,
              ...size,
              cell: (row) => (
                <RecordLink table={model} record={raw(row)}>
                  {render?.(raw(row)) ?? linkedName(model, raw(row), row[column.key])}
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
          // A date takes its kind's width, as every date column does.
          if (kind === "date")
            return c.date(column.key, { header, ...size, ...(render ? { cell } : {}) });
          if (kind === "number")
            return c.number(column.key, {
              header,
              width: 110,
              ...size,
              ...(render ? { cell } : {}),
            });
          // A person the table names draws with their avatar; `render` is then the fact's alone. A
          // person recorded whom the reader cannot see is not available, never "Not recorded".
          if (kind === "person")
            return c.person(column.key, {
              header,
              ...size,
              ...(peopleKeys.has(column.key)
                ? {
                    cell: (row: DataRecord) => {
                      const name = row[column.key];
                      return typeof name === "string" && name ? (
                        <Person name={name} />
                      ) : (
                        <Absent label={raw(row)[column.key] ? "Not available" : "Not recorded"} />
                      );
                    },
                  }
                : render
                  ? { cell }
                  : {}),
            });
          return c.text(column.key, { header, ...size, cell });
        }),
      ),
    [columns, primaryIndex, kinds, vocabularies, model, peopleKeys],
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
  const table = useCollectionTable({
    columns: tableColumns,
    data,
    getRowId: (row) => row.id,
    label: placeholder.replace(/^(Find|Search) /, "") || "Records",
    preview: tablePreview,
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
        queries={[...(queries ?? []), ...(peopleKeys.size ? [people] : [])]}
        noun={nouns}
        onRowClick={(row) => void navigate(recordDestination(model, byId.get(row.id) ?? row))}
        empty={{
          illustration: message.illustration ?? "records",
          title: message.title ?? "Nothing recorded yet",
          description: message.description,
          ...(message.icon ? { icon: message.icon } : {}),
          action: message.action ?? actions,
        }}
        searchLabel={placeholder}
        filters={chips.map((key) => (
          <DataTable.Filter key={key} table={table} column={key} />
        ))}
        action={actions}
        actionVariant={actionVariant}
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
  kind: declared,
  collection,
}: {
  /** The record's table, so the field's vocabulary decides a status. */
  table?: string | undefined;
  field: string;
  value: RecordValue | undefined;
  /** The fact's declared kind, as its column says it (DisplayColumn's `kind`). */
  kind?: DisplayColumn["kind"];
  /**
   * The record's schema, where the surface has loaded it for its own needs (a preview, a form): it
   * decides a field no kind is declared for. Without it, the field's name decides; a fact never
   * loads the schema itself.
   */
  collection?: Collection | undefined;
}) {
  if (value === null || value === undefined || value === "") return <Absent />;
  const kind = declared && declared !== "person" ? declared : fieldKind(table, collection, field);
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

/** Past this many characters a label no longer fits KeyValue's `default` label column. */
const LONG_LABEL = 14;

export function ModelFacts({
  record,
  fields,
  table,
  labelWidth,
}: {
  record: DataRecord;
  fields: (string | DisplayColumn)[];
  /** The record's table: its vocabularies format the values; a field's kind is its column's. */
  table?: TableName | undefined;
  /** The label column: the kit's `default`, or `wide` when a label is longer than fits. */
  labelWidth?: KeyValueLabelWidth | undefined;
}) {
  const columns = fields.map((field): DisplayColumn =>
    typeof field === "string" ? { key: field } : field,
  );
  const labels = columns.map((column) => column.label ?? labelFor(column.key.replace(/_id$/, "")));
  const width =
    labelWidth ?? (labels.some((label) => label.length > LONG_LABEL) ? "wide" : undefined);
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
              <FactValue table={table} field={column.key} value={value} kind={column.kind} />
            )}
          </KeyValue>
        );
      })}
    </KeyValue.Group>
  );
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
  links,
  readOnly = false,
  appendOnly = false,
  fill,
  showHeading = false,
  compact = showHeading,
  actionVariant = showHeading ? "secondary" : "primary",
  view,
  queries,
}: {
  table: TableName;
  /** The section's own heading, among a record body's other sections. */
  showHeading?: boolean;
  /**
   * The create action's weight (ProductCollection's `actionVariant`). A headed section is one of a
   * record body's sections, where the page header keeps the surface's one primary: its create
   * action is a small secondary unless it says otherwise. A tab whose only content is this
   * collection keeps the small primary.
   */
  actionVariant?: "primary" | "secondary" | undefined;
  /** Names the reader's column layout and the collection's question in the address: a register's. */
  view?: string | undefined;
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
  /**
   * The record a link table connects to the one the section sits on: `issue_observations` on an
   * issue links `observations`. Its add action then says Link and that record, and its empty
   * collection says what to link; without it the table holds records of its own, which are
   * created. Declared here, so the section opens without the record schema.
   */
  links?: TableName | undefined;
  /**
   * Nothing is added or edited here. Otherwise every member but a viewer writes: each table a
   * section writes grants its members insert, update and delete, and row-level security decides
   * each write.
   */
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
  const context = { ...filters, ...initialValues };
  const target = links;
  const addLabel =
    operation ??
    (target ? `Link ${productRecordNoun(target)}` : productCreateLabel(table, context));
  // The role says whether the reader may write; the form loads the schema it needs as it opens.
  const canAdd = !readOnly && workspace.role !== "viewer";
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
      <Button size={size} variant={actionVariant} iconBefore={<Plus />} onClick={() => open("new")}>
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
        view={view}
        actionVariant={actionVariant}
        onPreview={onOpen ?? setSelected}
        selectedId={selectedId ?? selected?.id}
        onDisplayedRowsChange={(rows) => {
          setDisplayed(rows);
          onDisplayedRowsChange?.(rows);
        }}
        searchLabel={`Find ${collectionName}`}
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
