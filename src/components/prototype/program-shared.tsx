import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Badge,
  Box,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Inline,
  Input,
  KeyValue,
  PageHeader,
  Stack,
  TextLink,
  defineColumns,
  useDataTable,
  Absent,
  type EmptyIllustrationKind,
} from "@ledger/design-system";
import { Plus, Pencil } from "lucide-react";
import { useRows, type TableName } from "@/lib/models";
import {
  displayValue,
  labelFor,
  recordTitle,
  type DataRecord,
  type RecordValue,
} from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import {
  ProductRecordDialog,
  ProductRecordForm,
  type ProductEditorState,
} from "./product-record-dialog";
import { productRecordNoun } from "@/lib/product-records";
import { RelationName } from "@/components/prototype/record-tools";

export type ProgramTableName = Parameters<typeof useRows>[0];
export type ProgramColumn = {
  key: string;
  title: string;
  /** Search, sort, and filter value when the cell is derived from related records. */
  value?: (row: DataRecord) => string | number | boolean | null;
  render?: (row: DataRecord) => ReactNode;
};
export const programTone = (value: unknown) => {
  if (
    [
      "active",
      "authorized",
      "completed",
      "implemented",
      "accepted",
      "published",
      "closed",
    ].includes(String(value))
  )
    return "success" as const;
  if (["suspended", "partial", "in_progress", "blocked", "needs_revision"].includes(String(value)))
    return "warning" as const;
  if (["denied", "expired", "rejected"].includes(String(value))) return "danger" as const;
  return "neutral" as const;
};
export function StatusValue({ value }: { value: unknown }) {
  return value == null ? (
    <span className="text-subtle">Not recorded</span>
  ) : (
    <Badge tone={programTone(value)} variant="secondary" size="xsmall">
      {labelFor(String(value))}
    </Badge>
  );
}
export function ProgramQueryState({ loading, error }: { loading: boolean; error: unknown }) {
  if (error)
    return (
      <p role="alert" className="text-danger">
        {error instanceof Error ? error.message : "These program records could not be loaded."}
      </p>
    );
  if (loading)
    return (
      <p role="status" className="text-subtle">
        Loading program records…
      </p>
    );
  return null;
}
export function ProgramEditor({
  table,
  existing,
  initialValues,
  onClose,
  onSaved,
}: {
  table: ProgramTableName;
  existing?: DataRecord | undefined;
  initialValues?: Record<string, RecordValue> | undefined;
  onClose: () => void;
  onSaved?: (row: DataRecord) => void | Promise<void>;
}) {
  return (
    <ProductRecordDialog
      table={table}
      existing={existing}
      initialValues={initialValues}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

type ProgramDialogTarget = {
  table: ProgramTableName;
  row: DataRecord | null;
  initialValues?: Record<string, RecordValue> | undefined;
  children?: ReactNode;
  startEditing?: boolean;
  readOnly?: boolean;
};
const ProgramDialogNavigation = createContext<{
  openRecord: (target: ProgramDialogTarget) => void;
} | null>(null);

/** Linked records replace this dialog's content; they never open a dialog inside a dialog. */
export function ProgramRecordDialog({
  onClose,
  ...initialTarget
}: ProgramDialogTarget & { onClose: () => void }) {
  const [stack, setStack] = useState<ProgramDialogTarget[]>([]);
  const openRecord = useCallback(
    (target: ProgramDialogTarget) => setStack((previous) => [...previous, target]),
    [],
  );
  const navigation = useMemo(() => ({ openRecord }), [openRecord]);
  const target = stack.at(-1) ?? initialTarget;
  const close = () => {
    if (stack.length) setStack((previous) => previous.slice(0, -1));
    else onClose();
  };
  return (
    <ProgramDialogNavigation.Provider value={navigation}>
      <ProgramRecordDialogSurface
        key={`${target.table}/${target.row?.id ?? "new"}/${stack.length}`}
        {...target}
        onClose={close}
        hasParent={stack.length > 0}
      />
    </ProgramDialogNavigation.Provider>
  );
}

function ProgramRecordDialogSurface({
  table,
  row,
  onClose,
  initialValues,
  children,
  startEditing = false,
  readOnly = false,
  hasParent,
}: ProgramDialogTarget & { onClose: () => void; hasParent: boolean }) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === table);
  const [editing, setEditing] = useState(startEditing);
  const [busy, setBusy] = useState(false);
  const editorState = useRef<ProductEditorState | null>(null);
  const onEditorStateChange = useCallback((state: ProductEditorState) => {
    editorState.current = state;
    setBusy(state.busy);
  }, []);
  const close = () => {
    if (editorState.current?.busy) return;
    if (editorState.current) editorState.current.requestClose();
    else onClose();
  };
  if (!collection) return null;
  const writable =
    !readOnly &&
    row?.["tenant_id"] === workspace.tenantId &&
    workspace.role !== "viewer" &&
    collection.can_update &&
    row?.["state"] !== "published";
  const formOpen = !row || editing;
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          close();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 820 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>
            {formOpen
              ? `${row ? "Edit" : "Create"} ${productRecordNoun(table)}`
              : recordTitle(row, collection)}
          </DialogTitle>
        </DialogHeader>
        <Box padding="space.250" className="min-h-0 flex-1 overflow-y-auto">
          <Stack space="space.200">
            {hasParent && (
              <Inline>
                <Button variant="subtle" size="small" disabled={busy} onClick={close}>
                  Back to previous record
                </Button>
              </Inline>
            )}
            {formOpen ? (
              <ProductRecordForm
                table={table}
                existing={row ?? undefined}
                initialValues={initialValues}
                readOnly={readOnly}
                onStateChange={onEditorStateChange}
                onClose={onClose}
              />
            ) : (
              <>
                <Inline alignInline="end">
                  {writable && (
                    <Button
                      variant="secondary"
                      iconBefore={<Pencil />}
                      onClick={() => setEditing(true)}
                    >
                      Edit record
                    </Button>
                  )}
                </Inline>
                {collection.columns
                  .filter(
                    (column) =>
                      !["id", "tenant_id", "created_by", "updated_by"].includes(column.name),
                  )
                  .map((column) => (
                    <KeyValue key={column.name} label={labelFor(column.name)} wrap>
                      {(() => {
                        const relation = collection.relations.find(
                          (item) =>
                            item.target_schema === "public" &&
                            item.columns.includes(column.name) &&
                            item.target_columns[item.columns.indexOf(column.name)] === "id" &&
                            column.name !== "tenant_id",
                        );
                        return relation && row[column.name] ? (
                          <RelationName
                            table={relation.target_table as TableName}
                            id={String(row[column.name])}
                          />
                        ) : (
                          displayValue(row[column.name])
                        );
                      })()}
                    </KeyValue>
                  ))}
                <ProgramLinkedRecords table={table} row={row} />
                {children}
              </>
            )}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
/* Which kit picture a program register shows when it holds nothing: the shape of what it will hold. */
export const collectionIllustration: Record<string, EmptyIllustrationKind> = {
  systems: "tree",
  scopes: "tree",
  system_components: "tree",
  composition_nodes: "tree",
  provider_capabilities: "tree",
  component_pins: "tree",
  engineering_requirements: "shield",
  ssp_revisions: "shield",
  implemented_requirements: "shield",
  scope_baselines: "shield",
  configuration_baselines: "document",
  authorization_packages: "document",
  poam_documents: "document",
  parameter_pins: "document",
  lifecycle_gates: "tasks",
  poam_items: "tasks",
  program_role_assignments: "people",
  activity_events: "inbox",
  assessment_campaigns: "calendar",
  ingestion_jobs: "inbox",
};
const STATUS_KEYS = new Set([
  "status",
  "state",
  "severity",
  "determination",
  "decision",
  "priority",
  "lifecycle_status",
  "authorization_status",
  "implementation_status",
  "review_status",
]);
const CHIP_KEYS = new Set(["role", "method", "kind"]);
const DATE_KEYS = /_(at|on)$/;
const NUMBER_KEYS = /_number$/;

export function ProgramCollection({
  name,
  title,
  description,
  filters,
  where,
  columns,
  initialValues,
  onSelect,
  createLabel,
  canCreate = true,
  readOnly = false,
  extraActions,
  empty,
  prerequisite,
  fill,
}: {
  name: ProgramTableName;
  title: string;
  description?: string;
  filters?: Record<string, string | number | null> | undefined;
  where?: (row: DataRecord) => boolean;
  columns: ProgramColumn[];
  initialValues?: Record<string, RecordValue> | undefined;
  onSelect?: (row: DataRecord) => void;
  createLabel?: string;
  canCreate?: boolean;
  readOnly?: boolean;
  extraActions?: ReactNode;
  /** What the register says with no records; the picture, title and description have defaults by table. */
  empty?: { title?: string; description?: string; illustration?: EmptyIllustrationKind | false };
  /** What has to exist first. Shown as the empty state's description while `canCreate` is false. */
  prerequisite?: string;
  /** The register is the tab's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
}) {
  const dialogNavigation = useContext(ProgramDialogNavigation);
  const query = useRows(name, filters);
  const workspace = useWorkspace();
  const [selected, setSelected] = useState<DataRecord | null | undefined>(undefined);
  const collection = workspace.collections.find((item) => item.name === name);
  const records = useMemo(
    () => ((query.data ?? []) as DataRecord[]).filter((row) => !where || where(row)),
    [query.data, where],
  );
  // Search, sort, and filters read the same derived values shown in cells. The dialog,
  // row click, and render callbacks still receive the unchanged database record.
  const byId = useMemo(() => new Map(records.map((row) => [row.id, row])), [records]);
  const byIdRef = useRef(byId);
  byIdRef.current = byId;
  const rows = useMemo(
    () =>
      records.map((row) => {
        const view: DataRecord = { ...row };
        for (const column of columns) {
          if (column.value) view[column.key] = column.value(row);
          else if (STATUS_KEYS.has(column.key)) {
            const value = row[column.key];
            if (typeof value === "string") view[column.key] = labelFor(value);
          }
        }
        return view;
      }),
    [records, columns],
  );
  const open = useCallback(
    (row: DataRecord) => {
      const record = byIdRef.current.get(row.id) ?? row;
      if (onSelect) onSelect(record);
      else if (dialogNavigation)
        dialogNavigation.openRecord({
          table: name,
          row: record,
          initialValues: { ...filters, ...initialValues },
          readOnly,
        });
      else setSelected(record);
    },
    [onSelect, dialogNavigation, name, filters, initialValues, readOnly],
  );
  const tableColumns = useMemo(
    () =>
      defineColumns<DataRecord>((c) =>
        columns.map((column, index) => {
          const raw = (row: DataRecord) => byIdRef.current.get(row.id) ?? row;
          const header = column.title;
          const render = column.render;
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
              cell: (row) => (
                <TextLink render={<button type="button" onClick={() => open(row)} />}>
                  {render?.(raw(row)) ?? displayValue(row[column.key])}
                </TextLink>
              ),
            });
          if (STATUS_KEYS.has(column.key))
            return c.status(column.key, {
              header,
              width: 140,
              tone: (row) => programTone(raw(row)[column.key]),
              ...(render ? { cell } : {}),
            });
          if (DATE_KEYS.test(column.key))
            return c.date(column.key, { header, width: 130, ...(render ? { cell } : {}) });
          if (NUMBER_KEYS.test(column.key))
            return c.number(column.key, { header, width: 110, ...(render ? { cell } : {}) });
          return c.text(column.key, { header, cell });
        }),
      ),
    [columns, open],
  );
  const chips = columns
    .filter(
      (column, index) =>
        index > 0 &&
        (STATUS_KEYS.has(column.key) || CHIP_KEYS.has(column.key) || /_type$/.test(column.key)),
    )
    .map((column) => column.key)
    .slice(0, 3);
  const table = useDataTable({
    columns: tableColumns,
    data: rows,
    getRowId: (row) => row.id,
    label: title,
    view: `program-${name}`,
    pageSize: 20,
    resizable: true,
    reorderable: true,
  });
  const openCreate = () => {
    if (dialogNavigation)
      dialogNavigation.openRecord({
        table: name,
        row: null,
        initialValues: { ...filters, ...initialValues },
        readOnly,
      });
    else setSelected(null);
  };
  const allowCreate =
    !readOnly && canCreate && workspace.role !== "viewer" && Boolean(collection?.can_insert);
  const createVerb = createLabel ?? `Add ${title.toLowerCase()}`;
  // The table's name in running text: "SSP revisions" keeps its acronym, "Lifecycle gates" loses its capital.
  const noun = labelFor(name)
    .split(" ")
    .map((word) => (word === word.toUpperCase() ? word : word.toLowerCase()))
    .join(" ");
  return (
    <Stack space="space.150">
      <PageHeader>
        <div>
          <PageHeader.Title>{title}</PageHeader.Title>
          {description && <p className="text-subtle font-body-small mt-050">{description}</p>}
        </div>
      </PageHeader>
      <DataTable
        table={table}
        fill={fill}
        state={query.isError ? "error" : query.isPending ? "loading" : "ready"}
        error={
          query.error instanceof Error
            ? query.error.message
            : "These program records could not be loaded."
        }
        onRowClick={open}
        empty={{
          illustration: empty?.illustration ?? collectionIllustration[name] ?? "records",
          title: empty?.title ?? `No ${noun} yet`,
          description:
            empty?.description ??
            (!canCreate && prerequisite
              ? prerequisite
              : "Nothing has been recorded for this program yet."),
          action: allowCreate ? (
            <Button variant="primary" iconBefore={<Plus />} onClick={openCreate}>
              {createVerb}
            </Button>
          ) : undefined,
        }}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Search table={table} placeholder={`Find ${noun}`} width={240} />
            {chips.map((key) => (
              <DataTable.Filter key={key} table={table} column={key} />
            ))}
            <Inline className="ml-auto" space="space.100" alignBlock="center">
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
              {extraActions}
              {allowCreate && (
                <Button size="small" variant="primary" iconBefore={<Plus />} onClick={openCreate}>
                  {createVerb}
                </Button>
              )}
            </Inline>
          </Inline>
        }
      />
      {selected !== undefined && (
        <ProgramRecordDialog
          key={selected?.id ?? "new"}
          table={name}
          readOnly={readOnly}
          row={selected}
          initialValues={{ ...filters, ...initialValues }}
          onClose={() => setSelected(undefined)}
        />
      )}
    </Stack>
  );
}

function ProgramLinkedRecords({ table, row }: { table: ProgramTableName; row: DataRecord }) {
  const writable = row["state"] !== "published";
  if (table === "configuration_baselines")
    return (
      <>
        <ProgramCollection
          name="component_pins"
          title="Pinned components"
          filters={{ configuration_baseline_id: row.id }}
          initialValues={{ system_id: row["system_id"] ?? null }}
          columns={[
            {
              key: "system_component_id",
              title: "Component",
              render: (item) => (
                <RelationName table="system_components" id={String(item["system_component_id"])} />
              ),
            },
            { key: "version", title: "Version" },
            { key: "configuration_description", title: "Configuration" },
          ]}
          canCreate={writable}
          readOnly={!writable}
          createLabel="Pin component"
        />
        <ProgramCollection
          name="parameter_pins"
          title="Parameter values"
          filters={{ configuration_baseline_id: row.id }}
          columns={[
            {
              key: "parameter_id",
              title: "Parameter",
              render: (item) => (
                <RelationName table="parameters" id={String(item["parameter_id"])} />
              ),
            },
            { key: "value", title: "Value" },
            { key: "rationale", title: "Rationale" },
          ]}
          canCreate={writable}
          readOnly={!writable}
          createLabel="Set parameter value"
        />
      </>
    );
  if (table === "scopes")
    return (
      <ProgramCollection
        name="scope_baselines"
        title="Adopted control baselines"
        filters={{ scope_id: row.id }}
        columns={[
          {
            key: "profile_resolution_id",
            title: "Profile resolution",
            render: (item) => (
              <RelationName
                table="profile_resolutions"
                id={String(item["profile_resolution_id"])}
              />
            ),
          },
          { key: "adopted_at", title: "Adopted" },
          { key: "rationale", title: "Rationale" },
        ]}
        createLabel="Adopt baseline"
      />
    );
  if (table === "ssp_revisions")
    return (
      <ProgramCollection
        name="implemented_requirements"
        title="Control implementations"
        filters={{ ssp_revision_id: row.id }}
        columns={[
          { key: "description", title: "Implementation" },
          {
            key: "implementation_status",
            title: "Status",
            render: (item) => <StatusValue value={item["implementation_status"]} />,
          },
        ]}
        canCreate={writable}
        readOnly={!writable}
        createLabel="Add implementation"
      />
    );
  if (table === "provider_capabilities")
    return (
      <ProgramCollection
        name="offered_implementations"
        title="Offered implementations"
        filters={{ provider_capability_id: row.id }}
        columns={[
          { key: "name", title: "Offering" },
          { key: "description", title: "Description" },
          { key: "state", title: "State" },
        ]}
        createLabel="Add offering"
      />
    );
  if (table === "risks")
    return (
      <ProgramCollection
        name="risk_revisions"
        title="Risk assessments"
        filters={{ risk_id: row.id }}
        columns={[
          { key: "version_number", title: "Version" },
          { key: "description", title: "Description" },
          { key: "likelihood", title: "Likelihood" },
          { key: "impact", title: "Impact" },
          { key: "severity", title: "Severity" },
          { key: "state", title: "State" },
        ]}
        createLabel="Assess risk"
      />
    );
  if (table === "risk_revisions")
    return (
      <ProgramCollection
        name="risk_responses"
        title="Risk responses"
        filters={{ risk_revision_id: row.id }}
        columns={[
          { key: "response_type", title: "Response" },
          { key: "description", title: "Description" },
          { key: "approved_at", title: "Approved" },
        ]}
        canCreate={writable}
        readOnly={!writable}
        createLabel="Record response"
      />
    );
  if (table === "poam_documents")
    return (
      <ProgramCollection
        name="poam_revisions"
        title="Plan revisions"
        filters={{ poam_document_id: row.id }}
        columns={[
          { key: "version_number", title: "Version" },
          { key: "state", title: "State" },
          { key: "published_at", title: "Published" },
        ]}
        createLabel="Add plan revision"
      />
    );
  if (table === "poam_items")
    return (
      <ProgramCollection
        name="poam_item_revisions"
        title="Remediation revisions"
        filters={{ poam_item_id: row.id }}
        initialValues={{ poam_document_id: row["poam_document_id"] ?? null }}
        columns={[
          { key: "version_number", title: "Version" },
          { key: "description", title: "Description" },
          { key: "planned_completion_date", title: "Planned completion" },
          { key: "state", title: "State" },
        ]}
        createLabel="Plan remediation"
      />
    );
  if (table === "poam_item_revisions")
    return (
      <ProgramCollection
        name="poam_milestones"
        title="Milestones"
        filters={{ poam_item_revision_id: row.id }}
        columns={[
          { key: "title", title: "Milestone" },
          { key: "planned_date", title: "Planned date" },
          { key: "completed_date", title: "Completed" },
        ]}
        canCreate={writable}
        readOnly={!writable}
        createLabel="Add milestone"
      />
    );
  if (table === "authorization_packages")
    return (
      <ProgramCollection
        name="package_revisions"
        title="Package revisions"
        filters={{ package_id: row.id }}
        columns={[
          { key: "version_number", title: "Version" },
          { key: "state", title: "State" },
          { key: "published_at", title: "Published" },
        ]}
        createLabel="Add package revision"
      />
    );
  if (table === "lifecycle_gates")
    return (
      <ProgramCollection
        name="gate_criteria"
        title="Gate criteria"
        filters={{ gate_id: row.id }}
        columns={[
          { key: "title", title: "Criterion" },
          { key: "required", title: "Required" },
          { key: "description", title: "Description" },
        ]}
        createLabel="Add criterion"
      />
    );
  if (table === "ingestion_jobs")
    return (
      <ProgramCollection
        name="import_issues"
        title="Import validation issues"
        filters={{ ingestion_job_id: row.id }}
        columns={[
          { key: "code", title: "Issue" },
          { key: "severity", title: "Severity" },
          { key: "message", title: "Message" },
        ]}
        createLabel="Record validation issue"
      />
    );
  return null;
}
