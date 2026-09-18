import { ProductCollection, type ProductCollectionProps } from "./product-collection";
import { RecordSummaryPreview } from "./record-summary-preview";
import { useMemo, useState, type ReactNode, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  Badge,
  Button,
  KeyValue,
  Section,
  Stack,
  TextLink,
  Shell,
  Toolbar,
  type Tone,
  Absent,
  DataTable,
  defineColumns,
  useDataTable,
  type EmptyIllustrationKind,
} from "@ledger/design-system";
import { ProductRecordDialog } from "./product-record-dialog";
import { useWorkspace } from "@/components/app/workspace";
import { useRow, useRows, type TableName, type Filters } from "@/lib/models";
import { displayValue, labelFor, type DataRecord } from "@/lib/records";
import { productCreateLabel, productRecordNoun } from "@/lib/product-records";
import { QueryState, QueryState as SharedQueryState } from "./work-common";
export { QueryState } from "./work-common";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";

export function stateTone(value: unknown): Tone {
  return ["critical", "other_than_satisfied", "denied", "revoked"].includes(String(value))
    ? "danger"
    : ["high", "partially_satisfied", "in_progress", "changes_requested"].includes(String(value))
      ? "warning"
      : ["satisfied", "completed", "authorized", "accepted", "published"].includes(String(value))
        ? "success"
        : "neutral";
}
export function StateBadge({ value }: { value: unknown }) {
  return value === null || value === undefined ? (
    <Absent />
  ) : (
    <Badge tone={stateTone(value)} variant="secondary" size="xsmall">
      {labelFor(String(value))}
    </Badge>
  );
}
export function RelationName({ table, id }: { table: TableName; id: string | null | undefined }) {
  const query = useRow(table, id);
  if (!id) return <Absent />;
  const row = query.data as unknown as DataRecord | null;
  return (
    <SharedQueryState queries={[query]}>
      {row ? (
        String(row["name"] ?? row["title"] ?? row["code"] ?? row["source_id"] ?? row.id)
      ) : (
        <Absent />
      )}
    </SharedQueryState>
  );
}
export type DisplayColumn = {
  key: string;
  label?: string;
  render?: (row: DataRecord) => ReactNode;
  width?: number;
};
export type ModelTableEmpty = {
  title?: string;
  description?: string;
  illustration?: EmptyIllustrationKind | false;
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
const DATE_KEYS = /_(at|on)$/;
const NUMBER_KEYS = /_number$/;
/** A register of records on the kit's DataTable: the toolbar, the kinds decided by the key, the two empties. */
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
}) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<DataRecord | null>(null);
  const openPreview = onPreview ?? setPreview;
  // Status fields read as labels so the chips and the badges agree; renders and the row click see the record as it came.
  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const byIdRef = useRef(byId);
  byIdRef.current = byId;
  const statusKeys = useMemo(
    () => columns.map((column) => column.key).filter((key) => STATUS_KEYS.has(key)),
    [columns],
  );
  const data = useMemo(
    () =>
      rows.map((row) => {
        const next: DataRecord = { ...row };
        for (const key of statusKeys) {
          const value = row[key];
          if (typeof value === "string") next[key] = labelFor(value);
        }
        for (const column of columns)
          if (DATE_KEYS.test(column.key) && next[column.key] == null) delete next[column.key];
        return next;
      }),
    [rows, statusKeys, columns],
  );
  const tableColumns = useMemo(
    () =>
      defineColumns<DataRecord>((c) =>
        columns.map((column, index) => {
          const namedColumn = columns.findIndex(
            ({ key }) => key === "name" || key === "title" || key === "statement",
          );
          const primary = index === (namedColumn < 0 ? 0 : namedColumn);
          const raw = (row: DataRecord) => byIdRef.current.get(row.id) ?? row;
          const header = column.label ?? labelFor(column.key.replace(/_id$/, ""));
          const render = column.render;
          const size = column.width === undefined ? {} : { width: column.width };
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
            return c.id(column.key, {
              header,
              hideable: false,
              minWidth: 180,
              width: 220,
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
          if (STATUS_KEYS.has(column.key))
            return c.status(column.key, {
              header,
              width: 140,
              tone: (row) => stateTone(raw(row)[column.key]),
              ...size,
              ...(render ? { cell } : {}),
            });
          if (DATE_KEYS.test(column.key))
            return c.date(column.key, { header, width: 130, ...size, ...(render ? { cell } : {}) });
          if (NUMBER_KEYS.test(column.key))
            return c.number(column.key, {
              header,
              width: 110,
              ...size,
              ...(render ? { cell } : {}),
            });
          return c.text(column.key, { header, ...size, cell });
        }),
      ),
    [columns, model, openPreview, selectedId, preview?.id],
  );
  const chips =
    filters ??
    columns
      .filter(
        (column, index) =>
          index > 0 &&
          (STATUS_KEYS.has(column.key) || CHIP_KEYS.has(column.key) || /_type$/.test(column.key)),
      )
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
        onRowClick={(row) => void navigate(recordDestination(model, byId.get(row.id) ?? row))}
        empty={{
          illustration: message.illustration ?? "records",
          title: message.title ?? "Nothing recorded yet",
          description: message.description,
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
          fields={columns}
        />
      )}
    </>
  );
}
export function EntityEditor({
  table,
  existing,
  initialValues,
  onSaved,
  onCancel,
}: {
  table: TableName;
  existing?: DataRecord | undefined;
  initialValues?: Record<string, unknown> | undefined;
  onSaved?: (row: DataRecord) => void | Promise<void>;
  onCancel: () => void;
}) {
  return (
    <ProductRecordDialog
      table={table}
      existing={existing}
      initialValues={initialValues}
      onSaved={onSaved}
      onClose={onCancel}
    />
  );
}

export function ModelFacts({
  record,
  fields,
}: {
  record: DataRecord;
  fields: (string | DisplayColumn)[];
}) {
  return (
    <Stack space="space.150">
      {fields.map((field) => {
        const column = typeof field === "string" ? { key: field } : field;
        return (
          <KeyValue
            key={column.key}
            label={column.label ?? labelFor(column.key.replace(/_id$/, ""))}
            wrap
          >
            {column.render ? column.render(record) : displayValue(record[column.key])}
          </KeyValue>
        );
      })}
    </Stack>
  );
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
  readOnly = false,
  appendOnly = false,
  fill,
  showHeading = false,
}: {
  table: TableName;
  showHeading?: boolean;
  filters?: Filters;
  title: string;
  columns: DisplayColumn[];
  initialValues?: Record<string, unknown>;
  onOpen?: ((row: DataRecord) => void) | undefined;
  selectedId?: string | undefined;
  onDisplayedRowsChange?: ((rows: DataRecord[]) => void) | undefined;
  description?: string;
  readOnly?: boolean;
  appendOnly?: boolean;
  /** The register is the page's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
}) {
  const workspace = useWorkspace();
  const query = useRows(table, filters);
  const [editing, setEditing] = useState<DataRecord | "new" | null>(null);
  const [selected, setSelected] = useState<DataRecord | null>(null);
  const [displayed, setDisplayed] = useState<DataRecord[]>([]);
  const collection = workspace.collections.find((item) => item.name === table);
  const canAdd = !readOnly && workspace.role !== "viewer" && Boolean(collection?.can_insert);
  const add = (size: "small" | "medium") =>
    canAdd ? (
      <Button
        size={size}
        variant="primary"
        iconBefore={<Plus />}
        disabled={editing === "new"}
        onClick={() => setEditing("new")}
      >
        {productCreateLabel(table, { ...filters, ...initialValues })}
      </Button>
    ) : undefined;
  const content = (
    <>
      <Stack space="space.200">
        {editing && (
          <EntityEditor
            key={editing === "new" ? "new" : editing.id}
            table={table}
            existing={editing === "new" ? undefined : editing}
            initialValues={{ ...filters, ...initialValues }}
            onSaved={(row) => {
              setSelected(row);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
        {selected && (
          <RecordPreviewPanel
            title={String(
              selected["name"] ?? selected["title"] ?? selected["code"] ?? productRecordNoun(table),
            )}
            label={`${productRecordNoun(table)} preview`}
            defaultWidth={560}
            onClose={() => setSelected(null)}
            recordActions={
              !readOnly &&
              !appendOnly &&
              workspace.role !== "viewer" &&
              collection?.can_update &&
              selected["state"] !== "published" &&
              selected["tenant_id"] !== null && (
                <Button size="small" variant="primary" onClick={() => setEditing(selected)}>
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
            <Stack space="space.150">
              <ModelFacts record={selected} fields={columns} />
            </Stack>
          </RecordPreviewPanel>
        )}
        <QueryState query={query}>
          <ModelTable
            model={table}
            rows={(query.data ?? []) as unknown as DataRecord[]}
            columns={columns}
            fill={fill}
            onPreview={onOpen ?? setSelected}
            selectedId={selectedId ?? selected?.id}
            onDisplayedRowsChange={(rows) => {
              setDisplayed(rows);
              onDisplayedRowsChange?.(rows);
            }}
            searchLabel={`Search ${title.toLowerCase()}`}
            actions={add("small")}
            empty={{
              title: `No ${title.toLowerCase()} yet`,
              description:
                description ??
                `Create ${productRecordNoun(table, initialValues)} to start this collection.`,
              action: add("medium"),
            }}
          />
        </QueryState>
      </Stack>
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
export function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
