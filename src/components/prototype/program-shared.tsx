import { ProductCollection } from "./product-collection";
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
  Absent,
  Button,
  DataTable,
  HeadingLevelProvider,
  KeyValue,
  Section,
  Stack,
  Text,
  defineColumns,
  useDataTable,
  type EmptyIllustrationKind,
} from "@ledger/design-system";
import { Plus, Pencil } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";
import { useRows, type TableName } from "@/lib/models";
import {
  displayValue,
  labelFor,
  recordTitle,
  titleColumn,
  type Collection,
  type DataRecord,
  type RecordValue,
} from "@/lib/records";
import {
  neutralVocabulary,
  vocabularyFor,
  vocabularyKind,
  type StatusVocabulary,
} from "@/lib/status";
import { LevelIndicator } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { ProductRecordDialog } from "./product-record-dialog";
import {
  productCollectionNoun,
  productCreateLabel,
  productRecordNoun,
} from "@/lib/product-records";
import { FactValue, RelationName } from "@/components/prototype/record-tools";

export type ProgramTableName = Parameters<typeof useRows>[0];
export type ProgramColumn = {
  key: string;
  title: string;
  /** Search, sort, and filter value when the cell is derived from related records. */
  value?: (row: DataRecord) => string | number | boolean | null;
  render?: (row: DataRecord) => ReactNode;
};

export { QueryState as ProgramQueryState } from "./work-common";
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
  records: DataRecord[];
  readOnly?: boolean;
};
const ProgramDialogNavigation = createContext<{
  openRecord: (target: ProgramDialogTarget) => void;
  target: ProgramDialogTarget | null;
} | null>(null);

/** Linked records share the panel host and retain the parent's mounted collection for Back. */
export function ProgramRecordDialog({
  onClose,
  ...initialTarget
}: ProgramDialogTarget & { onClose: () => void; onSelect: (row: DataRecord) => void }) {
  const [linked, setLinked] = useState<ProgramDialogTarget | null>(null);
  const openRecord = useCallback((target: ProgramDialogTarget) => setLinked(target), []);
  const navigation = useMemo(() => ({ openRecord, target: linked }), [openRecord, linked]);
  return (
    <ProgramDialogNavigation.Provider value={navigation}>
      <ProgramRecordDialogSurface {...initialTarget} onClose={onClose}>
        {initialTarget.children}
        {linked && (
          <ProgramRecordDialog
            {...linked}
            onClose={() => setLinked(null)}
            onSelect={(row) => setLinked((previous) => (previous ? { ...previous, row } : null))}
          />
        )}
      </ProgramRecordDialogSurface>
    </ProgramDialogNavigation.Provider>
  );
}

/* Columns a preview never lists: the row's machinery, and when it was first written. */
const PREVIEW_HIDDEN = new Set([
  "id",
  "tenant_id",
  "created_at",
  "created_by",
  "updated_by",
  "revision",
]);
const LONG_TEXT =
  /(^|_)(description|rationale|narrative|statement|message|notes|justification|plan)$/;
const IDENTIFIER = /^(code|source_id|asset_id|serial_number|version|version_number)$/;
const RELATION_KEY = /_id$/;

/** A fact's label: the column's words, a relation named for what it points at ("Owner", not "Owner party"). */
function factLabel(name: string) {
  // A date reads as the event: "Due", "Decided", "Updated", not "Due on" or "Decided at".
  return labelFor(name.replace(/_party_id$/, "").replace(/_(id|at|on)$/, ""));
}

/** The relation a column holds, when it names another public record by its id. */
function relationOf(collection: Collection, name: string) {
  return collection.relations.find(
    (item) =>
      item.target_schema === "public" &&
      item.columns.includes(name) &&
      item.target_columns[item.columns.indexOf(name)] === "id" &&
      name !== "tenant_id",
  );
}

/**
 * The facts a linked-record preview shows, in the order a reader asks: identifiers, the status,
 * who, the other related records, the dates, then the authored text, and when it last changed.
 * Never the row's machinery, the name already in the header, or the record the preview came from.
 */
function previewFields(collection: Collection, table: string, context: Record<string, unknown>) {
  const title = previewTitleKey(collection);
  const rank = (name: string) => {
    if (name === "updated_at") return 8;
    if (IDENTIFIER.test(name)) return 0;
    if (vocabularyFor(table, name)) return 1;
    if (/_party_id$/.test(name)) return 2;
    if (RELATION_KEY.test(name) && relationOf(collection, name)) return 3;
    if (/_(at|on|date)$/.test(name)) return 4;
    if (LONG_TEXT.test(name)) return 6;
    return 5;
  };
  return collection.columns
    .map((column) => column.name)
    .filter((name) => !PREVIEW_HIDDEN.has(name) && name !== title && !(name in context))
    .map((name, index) => ({ name, rank: rank(name), index }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ name }) => name);
}

/**
 * The column that names a record in its preview's header: a name, a title or a code. A version's
 * description is a fact, not its name: a revision is named by its number.
 */
function previewTitleKey(collection: Collection) {
  const key = titleColumn(collection);
  const versioned = collection.columns.some((column) => column.name === "version_number");
  return key === "id" || (key === "description" && versioned) ? undefined : key;
}

/** A preview's title: the record's name, else its version, else what it is; never its id. */
function previewTitle(row: DataRecord, collection: Collection, table: string) {
  const key = previewTitleKey(collection);
  const title = key ? recordTitle(row, collection) : row.id;
  if (title !== row.id) return title;
  if (typeof row["version_number"] === "number") return `Version ${row["version_number"]}`;
  return capitalize(productRecordNoun(table));
}

/** A noun at the start of a name: "Lifecycle gate", while "POA&M plan" keeps its case. */
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function ProgramRecordDialogSurface({
  table,
  row: initialRow,
  onClose,
  initialValues,
  children,
  startEditing = false,
  readOnly = false,
  records,
  onSelect,
}: ProgramDialogTarget & { onClose: () => void; onSelect: (row: DataRecord) => void }) {
  const workspace = useWorkspace();
  const collection = workspace.collections.find((item) => item.name === table);
  const [editing, setEditing] = useState(startEditing);
  const [saved, setSaved] = useState<DataRecord | null>(null);
  const row = saved?.id === initialRow?.id ? saved : initialRow;
  if (!collection) return null;
  const writable =
    !readOnly &&
    row?.["tenant_id"] === workspace.tenantId &&
    workspace.role !== "viewer" &&
    collection.can_update &&
    row?.["state"] !== "published";
  if (!row || editing)
    return (
      <ProductRecordDialog
        table={table}
        existing={row ?? undefined}
        initialValues={initialValues}
        onClose={() => (row ? setEditing(false) : onClose())}
        onSaved={(record) => {
          if (row) {
            setSaved(record);
            setEditing(false);
          } else onClose();
        }}
      />
    );
  const fields = previewFields(collection, table, initialValues ?? {});
  return (
    <RecordPreviewPanel
      title={previewTitle(row, collection, table)}
      label={`${capitalize(productRecordNoun(table))} preview`}
      defaultWidth={640}
      onClose={onClose}
      recordActions={
        writable && (
          <Button
            variant="primary"
            size="small"
            iconBefore={<Pencil />}
            onClick={() => setEditing(true)}
          >
            Edit {productRecordNoun(table)}
          </Button>
        )
      }
      navigation={
        <RecordPreviewActions table={table} record={row} rows={records} onSelect={onSelect} />
      }
    >
      {/* The record's name is the preview's h2; what follows sits under it. */}
      <HeadingLevelProvider level={3}>
        <Stack space="space.300">
          {fields.length > 0 && (
            <KeyValue.Group labelWidth={144}>
              {fields.map((name) => {
                const relation = RELATION_KEY.test(name) ? relationOf(collection, name) : undefined;
                const value = row[name];
                return (
                  <KeyValue key={name} label={factLabel(name)} wrap>
                    {relation && value ? (
                      <RelationName table={relation.target_table as TableName} id={String(value)} />
                    ) : LONG_TEXT.test(name) && typeof value === "string" && value ? (
                      <Text preserveLineBreaks>{value}</Text>
                    ) : (
                      <FactValue table={table} field={name} value={value} />
                    )}
                  </KeyValue>
                );
              })}
            </KeyValue.Group>
          )}
          <ProgramLinkedRecords table={table} row={row} />
          {children}
        </Stack>
      </HeadingLevelProvider>
    </RecordPreviewPanel>
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
  "likelihood",
  "impact",
  "lifecycle_status",
  "authorization_status",
  "implementation_status",
  "review_status",
]);
const CHIP_KEYS = new Set(["role", "method", "kind"]);
const DATE_KEYS = /_(at|on|date)$/;
const NUMBER_KEYS = /_number$/;

/**
 * The order a collection reads in before the reader sorts it, as ModelTable reads: the recorded
 * sequence, else the newest version, else the latest change. Never the order of the ids.
 */
function readingOrder(rows: DataRecord[]) {
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

/** The record a collection belongs to, by the column it is filtered on, in the reader's words. */
const collectionOwners: Record<string, string> = {
  program_id: "program",
  system_id: "system",
  system_component_id: "component",
  implemented_requirement_id: "control",
  risk_id: "risk",
  risk_revision_id: "risk assessment",
  poam_item_id: "remediation item",
  poam_item_revision_id: "remediation commitment",
  poam_document_id: "POA&M plan",
  poam_revision_id: "POA&M plan version",
};

export function ProgramCollection({
  name,
  title,
  filters,
  where,
  columns,
  initialValues,
  canCreate = true,
  readOnly = false,
  extraActions,
  empty,
  prerequisite,
  fill,
  section = false,
}: {
  name: ProgramTableName;
  title: string;
  /** Name a collection only when the caller places several collections together. */
  section?: boolean;
  filters?: Record<string, string | number | null> | undefined;
  where?: (row: DataRecord) => boolean;
  columns: ProgramColumn[];
  initialValues?: Record<string, RecordValue> | undefined;
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
  const navigate = useNavigate();
  const displayedRef = useRef<DataRecord[]>([]);
  const query = useRows(name, filters);
  const workspace = useWorkspace();
  const [selected, setSelected] = useState<DataRecord | null | undefined>(undefined);
  const activeId =
    dialogNavigation?.target?.table === name ? dialogNavigation.target.row?.id : selected?.id;
  const collection = workspace.collections.find((item) => item.name === name);
  const records = useMemo(
    () => readingOrder(((query.data ?? []) as DataRecord[]).filter((row) => !where || where(row))),
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
        for (const column of columns) if (column.value) view[column.key] = column.value(row);
        for (const column of columns)
          if (DATE_KEYS.test(column.key) && view[column.key] == null) delete view[column.key];
        return view;
      }),
    [records, columns],
  );
  // Each status or level column reads through its vocabulary: the badge or indicator, the rank it
  // sorts by, the labels its filter and search use. A field the product has not mapped reads in
  // words, neutral.
  const vocabularies = useMemo(() => {
    const map = new Map<string, StatusVocabulary>();
    for (const column of columns)
      if (STATUS_KEYS.has(column.key) && !column.value)
        map.set(
          column.key,
          vocabularyFor(name, column.key)?.values ??
            neutralVocabulary(records.map((row) => row[column.key])),
        );
    return map;
  }, [columns, name, records]);
  const open = useCallback(
    (row: DataRecord) => {
      const record = byIdRef.current.get(row.id) ?? row;
      if (dialogNavigation)
        dialogNavigation.openRecord({
          table: name,
          row: record,
          initialValues: { ...filters, ...initialValues },
          readOnly,
          records: displayedRef.current,
        });
      else setSelected(record);
    },
    [dialogNavigation, name, filters, initialValues, readOnly],
  );
  const tableColumns = useMemo(
    () =>
      defineColumns<DataRecord>((c) =>
        columns.map((column, index) => {
          const namedColumn = columns.findIndex(({ key }) => key === "name" || key === "title");
          const primary = index === (namedColumn < 0 ? 0 : namedColumn);
          const raw = (row: DataRecord) => byIdRef.current.get(row.id) ?? row;
          const header = column.title;
          const render = column.render;
          const plain = (row: DataRecord) => {
            const value = row[column.key];
            return value === null || value === undefined || value === "" ? (
              <Absent label="Not recorded" />
            ) : (
              displayValue(value)
            );
          };
          const cell = render ? (row: DataRecord) => render(raw(row)) : plain;
          if (index === 0)
            return c.id(column.key, {
              header,
              hideable: false,
              minWidth: 160,
              priority: primary ? 0 : 1,
              preview: open,
              active: (row) => row.id === activeId,
              // The record's name is its one link: a code or version before the name only reads.
              cell: primary
                ? (row) => (
                    <RecordLink table={name} record={raw(row)}>
                      {render?.(raw(row)) ?? displayValue(row[column.key])}
                    </RecordLink>
                  )
                : cell,
            });
          const statuses = vocabularies.get(column.key);
          if (statuses) {
            const level = vocabularyKind(statuses) === "level";
            return c.status(column.key, {
              header,
              width: 140,
              statuses,
              ...(render
                ? { cell }
                : level
                  ? {
                      cell: (row: DataRecord) => {
                        const value = raw(row)[column.key];
                        return (
                          <LevelIndicator
                            levels={statuses}
                            value={typeof value === "string" ? value : null}
                          />
                        );
                      },
                    }
                  : {}),
            });
          }
          if (DATE_KEYS.test(column.key))
            return c.date(column.key, { header, width: 130, ...(render ? { cell } : {}) });
          if (NUMBER_KEYS.test(column.key))
            return c.number(column.key, { header, width: 110, ...(render ? { cell } : {}) });
          return c.text(column.key, {
            header,
            cell: primary
              ? (row) => (
                  <RecordLink table={name} record={raw(row)}>
                    {cell(row)}
                  </RecordLink>
                )
              : cell,
            ...(primary ? { priority: 0, minWidth: 180 } : {}),
          });
        }),
      ),
    [columns, open, name, activeId, vocabularies],
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
  const displayed = useDisplayedRecords(table, undefined, byId);
  displayedRef.current = displayed;
  const openCreate = () => {
    if (dialogNavigation)
      dialogNavigation.openRecord({
        table: name,
        row: null,
        records: [],
        initialValues: { ...filters, ...initialValues },
        readOnly,
      });
    else setSelected(null);
  };
  const allowCreate =
    !readOnly && canCreate && workspace.role !== "viewer" && Boolean(collection?.can_insert);
  const createActionLabel = productCreateLabel(name, { ...filters, ...initialValues });
  // The collection in running text: "SSP revisions" and "POA&M plans" keep their acronyms.
  const noun = productCollectionNoun(name, { ...filters, ...initialValues });
  // What the collection belongs to, named by the key it is filtered on: "for this system".
  const owner = dialogNavigation
    ? "record"
    : (Object.keys(filters ?? {})
        .map((key) => collectionOwners[key])
        .find(Boolean) ?? "record");
  const description =
    empty?.description ??
    (allowCreate
      ? `Create the first ${productRecordNoun(name)} for this ${owner}.`
      : !canCreate && prerequisite
        ? prerequisite
        : "Nothing has been recorded here yet.");
  const content = (
    <ProductCollection
      table={table}
      queries={[query]}
      fill={fill}
      searchLabel={`Find ${noun}`}
      // A collection inside a preview answers the task at hand; its question ends with it.
      keepQuestion={!dialogNavigation}
      filters={chips.map((key) => (
        <DataTable.Filter key={key} table={table} column={key} />
      ))}
      action={
        allowCreate ? (
          <Button size="small" variant="primary" iconBefore={<Plus />} onClick={openCreate}>
            {createActionLabel}
          </Button>
        ) : (
          extraActions
        )
      }
      onRowClick={(row) => void navigate(recordDestination(name, byId.get(row.id) ?? row))}
      empty={{
        illustration: empty?.illustration ?? collectionIllustration[name] ?? "records",
        title: empty?.title ?? `No ${noun} yet`,
        description,
        action: allowCreate ? (
          <Button variant="primary" iconBefore={<Plus />} onClick={openCreate}>
            {createActionLabel}
          </Button>
        ) : undefined,
      }}
    />
  );
  return (
    <>
      {section ? <Section title={title}>{content}</Section> : content}
      {selected !== undefined && (
        <ProgramRecordDialog
          table={name}
          readOnly={readOnly}
          row={selected}
          records={displayed}
          onSelect={setSelected}
          initialValues={{ ...filters, ...initialValues }}
          onClose={() => setSelected(undefined)}
        />
      )}
    </>
  );
}

/** A preview's related collections: each named by its own heading, under the record's title. */
function ProgramLinkedRecords({ table, row }: { table: ProgramTableName; row: DataRecord }) {
  const writable = row["state"] !== "published";
  if (table === "configuration_baselines")
    return (
      <>
        <ProgramCollection
          name="component_pins"
          section
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
        />
        <ProgramCollection
          name="parameter_pins"
          section
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
        />
      </>
    );
  if (table === "scopes")
    return (
      <ProgramCollection
        name="scope_baselines"
        section
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
      />
    );
  if (table === "ssp_revisions")
    return (
      <ProgramCollection
        name="implemented_requirements"
        section
        title="Control implementations"
        filters={{ ssp_revision_id: row.id }}
        columns={[
          { key: "description", title: "Implementation" },
          { key: "implementation_status", title: "Status" },
        ]}
        canCreate={writable}
        readOnly={!writable}
      />
    );
  if (table === "provider_capabilities")
    return (
      <ProgramCollection
        name="offered_implementations"
        section
        title="Offered implementations"
        filters={{ provider_capability_id: row.id }}
        columns={[
          { key: "name", title: "Offering" },
          { key: "description", title: "Description" },
          { key: "state", title: "State" },
        ]}
      />
    );
  if (table === "risks")
    return (
      <ProgramCollection
        name="risk_revisions"
        section
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
      />
    );
  if (table === "risk_revisions")
    return (
      <ProgramCollection
        name="risk_responses"
        section
        title="Risk responses"
        filters={{ risk_revision_id: row.id }}
        columns={[
          { key: "response_type", title: "Response" },
          { key: "description", title: "Description" },
          { key: "approved_at", title: "Approved" },
        ]}
        canCreate={writable}
        readOnly={!writable}
      />
    );
  if (table === "poam_documents")
    return (
      <ProgramCollection
        name="poam_revisions"
        section
        title="Plan revisions"
        filters={{ poam_document_id: row.id }}
        columns={[
          { key: "version_number", title: "Version" },
          { key: "state", title: "State" },
          { key: "published_at", title: "Published" },
        ]}
      />
    );
  if (table === "poam_items")
    return (
      <ProgramCollection
        name="poam_item_revisions"
        section
        title="Remediation commitments"
        filters={{ poam_item_id: row.id }}
        initialValues={{ poam_document_id: row["poam_document_id"] ?? null }}
        columns={[
          { key: "version_number", title: "Version" },
          { key: "description", title: "Description" },
          { key: "planned_completion_date", title: "Planned completion" },
          { key: "state", title: "State" },
        ]}
      />
    );
  if (table === "poam_item_revisions")
    return (
      <ProgramCollection
        name="poam_milestones"
        section
        title="Milestones"
        filters={{ poam_item_revision_id: row.id }}
        columns={[
          { key: "title", title: "Milestone" },
          { key: "planned_date", title: "Planned date" },
          { key: "completed_date", title: "Completed" },
        ]}
        canCreate={writable}
        readOnly={!writable}
      />
    );
  if (table === "authorization_packages")
    return (
      <ProgramCollection
        name="package_revisions"
        section
        title="Package revisions"
        filters={{ package_id: row.id }}
        columns={[
          { key: "version_number", title: "Version" },
          { key: "state", title: "State" },
          { key: "published_at", title: "Published" },
        ]}
      />
    );
  if (table === "lifecycle_gates")
    return (
      <ProgramCollection
        name="gate_criteria"
        section
        title="Gate criteria"
        filters={{ gate_id: row.id }}
        columns={[
          { key: "title", title: "Criterion" },
          { key: "required", title: "Required" },
          { key: "description", title: "Description" },
        ]}
      />
    );
  if (table === "ingestion_jobs")
    return (
      <ProgramCollection
        name="import_issues"
        section
        title="Import validation issues"
        filters={{ ingestion_job_id: row.id }}
        columns={[
          { key: "code", title: "Issue" },
          { key: "severity", title: "Severity" },
          { key: "message", title: "Message" },
        ]}
      />
    );
  return null;
}
