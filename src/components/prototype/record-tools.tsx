import { useMemo, useState, type ReactNode, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  Badge,
  Box,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Inline,
  Input,
  KeyValue,
  Section,
  Stack,
  Table,
  TextLink,
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

export function QueryState({
  query,
  children,
}: {
  query: { isPending: boolean; isError: boolean; error: Error | null; data?: unknown };
  children: ReactNode;
}) {
  return (
    <>
      {query.isError ? (
        <p role="alert" className="text-danger">
          {query.data !== undefined &&
            "Could not refresh records. Showing the last loaded records. "}
          {query.error?.message}
        </p>
      ) : query.isPending ? (
        <p role="status" className="text-subtle">
          Loading records…
        </p>
      ) : null}
      {(query.data !== undefined || (!query.isPending && !query.isError)) && children}
    </>
  );
}
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
    <span className="text-subtlest">Not recorded</span>
  ) : (
    <Badge tone={stateTone(value)} variant="secondary" size="xsmall">
      {labelFor(String(value))}
    </Badge>
  );
}
export function RelationName({ table, id }: { table: TableName; id: string | null | undefined }) {
  const query = useRow(table, id);
  if (!id) return <span className="text-subtlest">Not recorded</span>;
  if (query.isPending) return <span>Loading…</span>;
  if (query.isError) return <span role="alert">{query.error.message}</span>;
  const row = query.data as unknown as DataRecord | null;
  return (
    <>
      {row
        ? String(row["name"] ?? row["title"] ?? row["code"] ?? row["source_id"] ?? row.id)
        : "Unavailable record"}
    </>
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
  rows,
  columns,
  onOpen,
  empty,
  searchLabel = "Search records",
  filters,
  actions,
  view,
  fill,
}: {
  rows: DataRecord[];
  columns: DisplayColumn[];
  onOpen?: ((row: DataRecord) => void) | undefined;
  /** A string is the description under "Nothing recorded yet". */
  empty?: string | ModelTableEmpty;
  searchLabel?: string;
  /** Column keys to expose as chips; by default every status-like or type-like column. */
  filters?: string[];
  /** The toolbar's trailing actions: the create verb, small. */
  actions?: ReactNode;
  /** Names the reader's column layout in this browser. */
  view?: string;
  /** The register is the page's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
}) {
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
        return next;
      }),
    [rows, statusKeys],
  );
  const tableColumns = useMemo(
    () =>
      defineColumns<DataRecord>((c) =>
        columns.map((column, index) => {
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
          if (index === 0)
            return c.text(column.key, {
              header,
              hideable: false,
              minWidth: 200,
              ...size,
              cell: (row) =>
                onOpen ? (
                  <TextLink render={<button type="button" onClick={() => onOpen(raw(row))} />}>
                    {render?.(raw(row)) ?? displayValue(row[column.key])}
                  </TextLink>
                ) : (
                  cell(row)
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
    [columns, onOpen],
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
  const message: ModelTableEmpty =
    typeof empty === "string" ? { description: empty } : (empty ?? {});
  return (
    <DataTable
      table={table}
      fill={fill}
      onRowClick={onOpen ? (row) => onOpen(byId.get(row.id) ?? row) : undefined}
      empty={{
        illustration: message.illustration ?? "records",
        title: message.title ?? "Nothing recorded yet",
        description: message.description,
        action: message.action,
      }}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Search table={table} placeholder={searchLabel} />
          {chips.map((key) => (
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
  description,
  readOnly = false,
  appendOnly = false,
  fill,
}: {
  table: TableName;
  filters?: Filters;
  title: string;
  columns: DisplayColumn[];
  initialValues?: Record<string, unknown>;
  onOpen?: ((row: DataRecord) => void) | undefined;
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
        Add {title.toLowerCase()}
      </Button>
    ) : undefined;
  return (
    <Section title={title}>
      {description && <p className="text-subtle pb-150">{description}</p>}
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
          <Box padding="space.250" backgroundColor="elevation.surface.sunken">
            <Stack space="space.150">
              <ModelFacts record={selected} fields={columns} />
              <Inline space="space.150">
                {!readOnly &&
                  !appendOnly &&
                  workspace.role !== "viewer" &&
                  collection?.can_update &&
                  selected["state"] !== "published" &&
                  selected["tenant_id"] !== null && (
                    <Button onClick={() => setEditing(selected)}>Edit record</Button>
                  )}
                <Button onClick={() => setSelected(null)}>Close record</Button>
                <InspectLink table={table} id={selected.id} />
              </Inline>
            </Stack>
          </Box>
        )}
        <QueryState query={query}>
          <ModelTable
            rows={(query.data ?? []) as unknown as DataRecord[]}
            columns={columns}
            fill={fill}
            onOpen={onOpen ?? setSelected}
            searchLabel={`Search ${title.toLowerCase()}`}
            actions={add("small")}
            empty={{
              title: `No ${title.toLowerCase()} yet`,
              description: "Nothing has been recorded for this context.",
              action: add("medium"),
            }}
          />
        </QueryState>
      </Stack>
    </Section>
  );
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
