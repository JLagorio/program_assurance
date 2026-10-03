import { ProductCollection } from "./product-collection";
import { useCollectionTable } from "./collection-question";
import { DueDate, QueryState } from "./work-common";
import {
  Activity,
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
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
  Person,
  Section,
  Stack,
  TabsContent,
  Text,
  defineColumns,
  type EmptyIllustrationKind,
  type StackProps,
} from "@ledger/design-system";
import { Plus, Pencil } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
  useEndOnHide,
} from "./record-preview";
import { useRows, type TableName } from "@/lib/models";
import {
  displayValue,
  labelFor,
  recordTitle,
  titleColumn,
  type Collection,
  type ColumnNames,
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
import { useCollection } from "@/lib/collections";
import { ProductRecordDialog } from "./product-record-dialog";
import {
  productCollectionNoun,
  productCreateLabel,
  productRecordNoun,
} from "@/lib/product-records";
import { FactValue, RelationName, defaultOrder } from "@/components/prototype/record-tools";
import { linkedName } from "@/lib/link-name";

export type ProgramTableName = Parameters<typeof useRows>[0];
export type ProgramColumn = {
  key: string;
  title: string;
  /** Search, sort, and filter value when the cell is derived from related records. */
  value?: (row: DataRecord) => string | number | boolean | null;
  render?: (row: DataRecord) => ReactNode;
  /** A date's readable minimum, for a cell that says more than the day ("Oct 4, 2026 · Due in 2
   * days"); a date otherwise takes its kind's width. */
  minWidth?: number | undefined;
  /**
   * A person (an owner, an assignee, a party) is drawn with their avatar and sorts, filters and
   * searches by the name `value` gives. Where `value` has no name for a person recorded (the people
   * still loading, or one the reader cannot see), `render` draws the cell, else it is not available,
   * never "Not recorded".
   */
  kind?: "person" | undefined;
};

export { QueryState as ProgramQueryState } from "./work-common";

/**
 * A retained panel's content: drawn while its tab is shown and in the render that hides it, then
 * left as it was while it stays hidden.
 */
const RetainedContent = memo(
  function RetainedContent({ children }: { hidden: boolean; children: ReactNode }) {
    return children;
  },
  (previous, next) => previous.hidden && next.hidden,
);

/**
 * A tab strip's panels, one per tab. Each is drawn the first time its tab is chosen and kept while
 * another is shown, so a register keeps its rows, scroll, selection and question. A hidden panel's
 * effects pause (React's Activity): it loads nothing, and its preview leaves the shell. Each panel
 * stacks its blocks `space`; the kit's TabsContent spaces it under the strip. Each panel is a
 * failure region, so its blocks' failures read as one alert at its top. When a link inside a
 * panel chooses another tab (an Overview tile, "Open schedule"), the panel it sat in hides and the
 * browser drops its focus, so focus moves to the chosen tab, as a click on the tab leaves it. A
 * hidden panel is drawn once as it hides and then left as it was: the record re-rendering (a read
 * settling, the address changing) re-renders only the panel the reader sees.
 */
export function RetainedTabPanels<T extends string>({
  tabs,
  value,
  space = "space.300",
  children,
}: {
  tabs: readonly T[];
  value: T;
  space?: StackProps["space"];
  /** A tab's content. */
  children: (tab: T) => ReactNode;
}) {
  const [visited, setVisited] = useState<readonly T[]>([value]);
  if (!visited.includes(value)) setVisited([...visited, value]);
  const shownPanel = useRef<HTMLDivElement | null>(null);
  const shownValue = useRef(value);
  useEffect(() => {
    if (shownValue.current === value) return;
    shownValue.current = value;
    const active = document.activeElement;
    const dropped =
      !active ||
      active === document.body ||
      !active.isConnected ||
      !!active.closest("[role=tabpanel][hidden]") ||
      active.checkVisibility?.() === false;
    if (!dropped) return;
    const labelledBy = shownPanel.current?.getAttribute("aria-labelledby");
    const tab = labelledBy ? document.getElementById(labelledBy) : null;
    tab?.focus();
  }, [value]);
  return (
    <>
      {tabs
        .filter((tab) => tab === value || visited.includes(tab))
        .map((tab) => (
          <TabsContent
            key={tab}
            value={tab}
            keepMounted
            // Hidden in the same render the tab changes, so two panels never show for a frame.
            hidden={tab !== value}
            ref={tab === value ? shownPanel : undefined}
          >
            <Activity mode={tab === value ? "visible" : "hidden"}>
              <Stack space={space} className="min-w-0">
                {/* The panel is a failure region: an outage reads as one alert at its top. */}
                <QueryState region>
                  <RetainedContent hidden={tab !== value}>{children(tab)}</RetainedContent>
                </QueryState>
              </Stack>
            </Activity>
          </TabsContent>
        ))}
    </>
  );
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
  records: DataRecord[];
  readOnly?: boolean;
  /**
   * The collection's identity column, for a record with no name of its own: a link row is named
   * by the record it links ("Dan Whitfield"), not by its type.
   */
  identity?: { key: string; read: (row: DataRecord) => unknown } | undefined;
  /** The collection's column titles, so the preview names each fact in the table's words. */
  labels?: Record<string, string> | undefined;
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
function previewTitleKey(collection: ColumnNames) {
  const key = titleColumn(collection);
  const versioned = collection.columns.some((column) => column.name === "version_number");
  return key === "id" || (key === "description" && versioned) ? undefined : key;
}

/** A preview's title: the record's name, else its version, else what it is; never its id. */
function previewTitle(row: DataRecord, collection: ColumnNames, table: string) {
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
  identity,
  labels,
}: ProgramDialogTarget & { onClose: () => void; onSelect: (row: DataRecord) => void }) {
  const workspace = useWorkspace();
  // The record schema names the preview's facts and the relations they point at. It loads when a
  // preview or a form first opens, and the surface waits on it as on any query.
  const schema = useCollection(table);
  const collection = schema.data ?? undefined;
  const [editing, setEditing] = useState(startEditing);
  const [saved, setSaved] = useState<DataRecord | null>(null);
  const row = saved?.id === initialRow?.id ? saved : initialRow;
  // Every member but a viewer writes the workspace's records of a program collection, and
  // row-level security decides each write: the role says it, so the edit keeps its place while
  // the schema loads.
  const writable =
    !readOnly &&
    row?.["tenant_id"] === workspace.tenantId &&
    workspace.role !== "viewer" &&
    row?.["state"] !== "published";
  // The form waits on the schema itself, with its fields loading and its primary in place.
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
  // A collection's rows carry every column, so the row's own fields name the record while the
  // schema loads, as the schema does once it lands: the title never changes under the reader.
  const names: ColumnNames = collection ?? {
    columns: Object.keys(row).map((name) => ({ name })),
  };
  // A record with no name of its own, such as an assignment, borrows its collection's identity
  // column, and that fact is not repeated under the title.
  const borrowed = previewTitleKey(names) ? undefined : identity?.read(row);
  const borrowedName = typeof borrowed === "string" && borrowed.trim() ? borrowed : undefined;
  const facts = collection
    ? previewFields(collection, table, initialValues ?? {})
        .filter((name) => !(borrowedName && name === identity?.key))
        .map((name) => ({
          name,
          relation: RELATION_KEY.test(name) ? relationOf(collection, name) : undefined,
        }))
    : [];
  return (
    <RecordPreviewPanel
      title={borrowedName ?? previewTitle(row, names, table)}
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
          {/* Skeleton lines while the schema loads, and its failure with Retry, in the panel. */}
          <QueryState queries={[schema]}>
            {facts.length > 0 && (
              <KeyValue.Group labelWidth="wide">
                {facts.map(({ name, relation }) => {
                  const value = row[name];
                  return (
                    <KeyValue key={name} label={labels?.[name] ?? factLabel(name)} wrap>
                      {relation && value ? (
                        <RelationName
                          table={relation.target_table as TableName}
                          id={String(value)}
                        />
                      ) : LONG_TEXT.test(name) && typeof value === "string" && value ? (
                        <Text preserveLineBreaks>{value}</Text>
                      ) : (
                        <FactValue
                          table={table}
                          field={name}
                          value={value}
                          collection={collection}
                        />
                      )}
                    </KeyValue>
                  );
                })}
              </KeyValue.Group>
            )}
          </QueryState>
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
  owner: ownerName,
}: {
  name: ProgramTableName;
  title: string;
  /**
   * What the collection belongs to, in the empty state's words ("for this program"), when its
   * `filters` do not say: a collection narrowed by `where` names its owner here.
   */
  owner?: string | undefined;
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
  useEndOnHide(() => setSelected(undefined));
  const activeId =
    dialogNavigation?.target?.table === name ? dialogNavigation.target.row?.id : selected?.id;
  const records = useMemo(
    () => defaultOrder(((query.data ?? []) as DataRecord[]).filter((row) => !where || where(row))),
    [query.data, where],
  );
  // Search, sort, and filters read the same derived values shown in cells. The dialog,
  // row click, and render callbacks still receive the unchanged database record.
  const byId = useMemo(() => new Map(records.map((row) => [row.id, row])), [records]);
  const byIdRef = useRef(byId);
  byIdRef.current = byId;
  // The preview names its record and its facts in this collection's words. A related record's id
  // is never a name: the identity column lends its words only through the value it displays.
  const identityColumn = columns.find(({ key }) => key === "name" || key === "title") ?? columns[0];
  const identity =
    identityColumn && (identityColumn.value || !RELATION_KEY.test(identityColumn.key))
      ? {
          key: identityColumn.key,
          read: identityColumn.value ?? ((row: DataRecord) => row[identityColumn.key]),
        }
      : undefined;
  const labels = Object.fromEntries(columns.map((column) => [column.key, column.title]));
  const previewWordsRef = useRef({ identity, labels });
  previewWordsRef.current = { identity, labels };
  // A caller's inline `columns` or `where` are new on every render of the page, so these rows are
  // too; useCollectionTable keeps rows whose values are unchanged, and with them the table's page.
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
          ...previewWordsRef.current,
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
              <Absent />
            ) : (
              displayValue(value)
            );
          };
          const cell = render ? (row: DataRecord) => render(raw(row)) : plain;
          // The first column carries the table's preview eye. A name there is a name, the record's
          // one link; a code or version before the name is an id that only reads.
          if (index === 0 && primary)
            return c.text(column.key, {
              header,
              hideable: false,
              minWidth: 180,
              priority: 0,
              cell: (row) => (
                <RecordLink table={name} record={raw(row)}>
                  {render?.(raw(row)) ?? linkedName(name, raw(row), row[column.key])}
                </RecordLink>
              ),
            });
          if (index === 0)
            return c.id(column.key, { header, hideable: false, minWidth: 160, priority: 1, cell });
          const statuses = vocabularies.get(column.key);
          if (statuses) {
            const level = vocabularyKind(statuses) === "level";
            return c.status(column.key, {
              header,
              width: 140,
              // The state a reader scans stays in the row after the name as a narrow frame folds.
              priority: 2,
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
          if (column.kind === "person")
            return c.person(column.key, {
              header,
              cell: (row: DataRecord) => {
                const person = row[column.key];
                if (typeof person === "string" && person) return <Person name={person} />;
                if (!raw(row)[column.key]) return <Absent />;
                return render ? render(raw(row)) : <Absent label="Not available" />;
              },
            });
          // A date takes its kind's width, as every date column does, with a readable minimum
          // where its cell says more than the day.
          if (DATE_KEYS.test(column.key))
            return c.date(column.key, {
              header,
              ...(render ? { cell } : {}),
              ...(column.minWidth === undefined ? {} : { minWidth: column.minWidth }),
            });
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
    [columns, name, vocabularies],
  );
  // The preview is the table's, so stepping through rows never rebuilds the columns.
  const preview = useMemo(
    () => ({ onPreview: open, activeId: activeId ?? null }),
    [open, activeId],
  );
  const chips = columns
    .filter(
      (column, index) =>
        index > 0 &&
        (STATUS_KEYS.has(column.key) || CHIP_KEYS.has(column.key) || /_type$/.test(column.key)),
    )
    .map((column) => column.key)
    .slice(0, 3);
  const table = useCollectionTable({
    columns: tableColumns,
    data: rows,
    getRowId: (row) => row.id,
    label: title,
    preview,
    view: `program-${name}`,
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
  // Every member but a viewer creates a program collection's records, and row-level security
  // decides each write: the role says it, so the collection does not load the record schema until
  // its create form or a preview opens.
  const allowCreate = !readOnly && canCreate && workspace.role !== "viewer";
  const createActionLabel = productCreateLabel(name, { ...filters, ...initialValues });
  // The collection in running text: "SSP revisions" and "POA&M plans" keep their acronyms.
  const noun = productCollectionNoun(name, { ...filters, ...initialValues });
  // What the collection belongs to, named by the key it is filtered on: "for this system".
  const owner = dialogNavigation
    ? "record"
    : (ownerName ??
      Object.keys(filters ?? {})
        .map((key) => collectionOwners[key])
        .find(Boolean) ??
      "record");
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
      // A named collection sits beside others on its tab: the compact shape, as EntitySection, and
      // a secondary create action, since the page header keeps the surface's one primary.
      compact={section}
      actionVariant={section ? "secondary" : "primary"}
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
          // Small, as in the toolbar: ProductCollection draws it medium in a centred first-record empty.
          <Button size="small" variant="primary" iconBefore={<Plus />} onClick={openCreate}>
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
          identity={identity}
          labels={labels}
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
          {
            key: "planned_completion_date",
            title: "Planned completion",
            // Overdue or due until the commitment or its remediation item is completed; an item
            // that will not be remediated has no due state.
            render: (revision) => (
              <DueDate
                value={revision["planned_completion_date"]}
                done={row["status"] === "completed" || Boolean(revision["actual_completion_date"])}
                cancelled={row["status"] === "cancelled" || row["status"] === "risk_accepted"}
              />
            ),
          },
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
          {
            key: "planned_date",
            title: "Planned date",
            // Overdue or due until the milestone or its commitment is completed.
            render: (milestone) => (
              <DueDate
                value={milestone["planned_date"]}
                done={
                  milestone["status"] === "completed" ||
                  Boolean(milestone["completed_date"]) ||
                  Boolean(row["actual_completion_date"])
                }
                cancelled={milestone["status"] === "cancelled"}
              />
            ),
          },
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
