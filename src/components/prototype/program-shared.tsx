import { useLocation } from "@tanstack/react-router";
import { ProductCollection } from "./product-collection";
import { useCollectionTable } from "./collection-question";
import { DueDate, QueryState, type QueryStatus } from "./work-common";
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
  ButtonGroup,
  ButtonGroupSeparator,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HeadingLevelProvider,
  IconButton,
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
import { ChevronDown, Plus, Pencil } from "lucide-react";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useOpenRecord,
  useDisplayedRecords,
  useEndOnHide,
} from "./record-preview";
import { idSet, useRows, type TableName } from "@/lib/models";
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
  productColumnLabel,
  productCreateLabel,
  productRecordNoun,
} from "@/lib/product-records";
import {
  FactValue,
  RelationName,
  defaultOrder,
  useLinkedNames,
} from "@/components/prototype/record-tools";
import { linkedName } from "@/lib/link-name";
import { useGateCriterionSources } from "@/lib/gate-criteria";
import { isOwnedCollection, NO_OWNER } from "@/lib/owner-assign";
import { AddSecurityOutcomes, CriterionSource } from "./gate-criteria-outcomes";
import { ownerFilterOptions, useOwnerAssignment } from "./assign-owner";

export type ProgramTableName = Parameters<typeof useRows>[0];
export type ProgramColumn = {
  key: string;
  title: string;
  /** Search, sort, and filter value when the cell is derived from related records. */
  value?: (row: DataRecord) => string | number | boolean | null;
  render?: (row: DataRecord) => ReactNode;
  /** A readable minimum: for a date whose cell says more than the day ("Oct 4, 2026 · Due in 2
   * days"), which otherwise takes its kind's width, and for words that say nothing once cut (a
   * process's name). */
  minWidth?: number | undefined;
  /**
   * A person (an owner, an assignee, a party) is drawn with their avatar and sorts, filters and
   * searches by the name `value` gives. Where `value` has no name for a person recorded (the people
   * still loading, or one the reader cannot see), `render` draws the cell, else it is not available,
   * never "Not recorded".
   */
  kind?: "person" | undefined;
  /**
   * The column names another record by its id (a verification's procedure, a pin's component):
   * the table that record is in. The collection reads those names once, so the row sorts, searches
   * and names its controls by the record, never by its id; `render` still draws the cell.
   */
  names?: TableName | undefined;
  /**
   * Several values in one cell, read beside the rows (a risk's ATT&CK techniques): the record's
   * items, each once, in the order they show. The column is a list, whose filter lists each value
   * once and finds a row by any of them, the collection's search finds a row by any of them too,
   * and it is one of the toolbar's filters. A row with none reads "No" and the column's title.
   * Keep the items the same while the reads behind them are (memoize the columns on them).
   */
  items?: ((row: DataRecord) => readonly { key: string; label: string }[]) | undefined;
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
function factLabel(table: string, name: string) {
  // The product's own words for a column come first, as a form names it: "Security outcome".
  const named = productColumnLabel(table, name);
  if (named) return named;
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
                    <KeyValue key={name} label={labels?.[name] ?? factLabel(table, name)} wrap>
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

/** The Owner column of a collection whose records carry an owner. */
const OWNER_KEY = "owner_party_id";

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
  createMenu,
  queries,
  empty,
  prerequisite,
  fill,
  section = false,
  owner: ownerName,
  assignOwner = false,
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
  /**
   * The collection's other ways to create its record, as a labelled icon menu joined to the create
   * action: "More ways to create a gate criterion", holding Add security outcomes. It shows where
   * the create action does, under the same role check.
   */
  createMenu?:
    { label: string; items: readonly { label: string; onSelect: () => void }[] } | undefined;
  /**
   * The reads a column's `value` draws from beside the rows (the process a criterion was drawn
   * from): the collection waits on them and says their failure with its own.
   */
  queries?: readonly QueryStatus[] | undefined;
  /** What the register says with no records; the picture, title and description have defaults by table. */
  empty?: { title?: string; description?: string; illustration?: EmptyIllustrationKind | false };
  /** What has to exist first. Shown as the empty state's description while `canCreate` is false. */
  prerequisite?: string;
  /** The register is the tab's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
  /**
   * The records carry an owner, which a reader who may edit gives several of them at once: the
   * table is selectable for them, Assign owner is the verb in its selection bar, and its Owner
   * column (`owner_party_id`, a person) is the last of its filters, every person and organization
   * by name and then No owner with how many of the records nobody owns. Only for a collection
   * whose records carry an owner (`OWNED_COLLECTIONS`), and one that draws the Owner column.
   */
  assignOwner?: boolean | undefined;
}) {
  const dialogNavigation = useContext(ProgramDialogNavigation);
  const openRecord = useOpenRecord();
  const displayedRef = useRef<DataRecord[]>([]);
  const query = useRows(name, filters);
  const workspace = useWorkspace();
  // The collection assigns owners where its records carry one and it draws their Owner column.
  const ownerCollection =
    assignOwner && isOwnedCollection(name) && columns.some(({ key }) => key === OWNER_KEY)
      ? name
      : undefined;
  // A person column named by a party id alone reads its people's names once, for the whole table
  // and for the Owner filter, which lists every person and organization.
  const peopleKeys = columns
    .filter((column) => column.kind === "person" && !column.value && !column.names)
    .map((column) => column.key)
    .join("\n");
  const people = useRows("parties", undefined, {
    columns: ["id", "name"],
    enabled: peopleKeys !== "",
  });
  const personNames = useMemo(
    () => new Map((people.data ?? []).map((party) => [party.id, party.name])),
    [people.data],
  );
  // A link that names this collection's section (the Overview's trays, `#program-risks`) brings
  // it into view once its rows are read and moves focus to it, as a count that filters a section
  // on its own tab does; once for each arrival, not on every refetch. The collections above it on
  // the tab may still be loading and grow, so it stays aligned while the page settles, until the
  // reader scrolls, presses a key or touches the page, or three seconds pass.
  const hash = useLocation({ select: (location) => location.hash });
  const sectionRef = useRef<HTMLElement>(null);
  const arrived = useRef<string | null>(null);
  const loaded = query.data !== undefined;
  useEffect(() => {
    const target = `program-${name}`;
    if (hash !== target) {
      arrived.current = null;
      return;
    }
    const node = sectionRef.current;
    if (!section || !loaded || !node || arrived.current === hash) return;
    arrived.current = hash;
    const align = () => node.scrollIntoView({ block: "start" });
    align();
    node.focus({ preventScroll: true });
    const observer = new ResizeObserver(align);
    observer.observe(document.body);
    const inputs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    const stop = () => {
      observer.disconnect();
      window.clearTimeout(timer);
      for (const input of inputs) window.removeEventListener(input, stop);
    };
    const timer = window.setTimeout(stop, 3000);
    for (const input of inputs) window.addEventListener(input, stop, { passive: true });
    return stop;
  }, [hash, loaded, name, section]);
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
  // A column that names another record by its id reads that record's names once.
  const naming = columns.find((column) => column.names && !column.value);
  const namingKey = naming?.key;
  const linkedIds = useMemo(
    () =>
      namingKey ? idSet(records.map((row) => row[namingKey] as string | null | undefined)) : [],
    [namingKey, records],
  );
  const linked = useLinkedNames(naming?.names, linkedIds);
  const linkNames = linked.names;
  // A caller's inline `columns` or `where` are new on every render of the page, so these rows are
  // too; useCollectionTable keeps rows whose values are unchanged, and with them the table's page.
  const rows = useMemo(
    () =>
      records.map((row) => {
        const view: DataRecord = { ...row };
        for (const column of columns)
          if (column.value) view[column.key] = column.value(row);
          // A list's labels, as one value: the row reads as changed when its items do, so the
          // table's sort, search and filter read them again.
          else if (column.items)
            view[column.key] = column
              .items(row)
              .map((item) => item.label)
              .join("\n");
        if (namingKey) {
          // The linked record's name; one the reader cannot see leaves the row unnamed.
          const id = row[namingKey];
          const name = typeof id === "string" ? linkNames.get(id) : undefined;
          if (name) view[namingKey] = name;
          else delete view[namingKey];
        }
        // A person by their name, which the row sorts and is found by; none recorded stays empty.
        for (const key of peopleKeys ? peopleKeys.split("\n") : []) {
          const id = row[key];
          const person = typeof id === "string" ? personNames.get(id) : undefined;
          if (person) view[key] = person;
          else delete view[key];
        }
        for (const column of columns)
          if (DATE_KEYS.test(column.key) && view[column.key] == null) delete view[column.key];
        return view;
      }),
    [records, columns, namingKey, linkNames, peopleKeys, personNames],
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
                <RecordLink table={name} record={raw(row)} onPreview={() => open(raw(row))}>
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
          const items = column.items;
          if (items)
            return c.list(column.key, {
              header,
              width: 240,
              searchable: true,
              items: (row: DataRecord) => items(raw(row)),
              empty: () => <Absent label={`No ${header}`} />,
            });
          if (column.kind === "person")
            return c.person(column.key, {
              header,
              // The Owner filter lists the records nobody owns under No owner, its last value; the
              // value the row sorts, searches and exports by stays empty.
              ...(ownerCollection && column.key === OWNER_KEY ? { emptyLabel: NO_OWNER } : {}),
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
                  <RecordLink table={name} record={raw(row)} onPreview={() => open(raw(row))}>
                    {cell(row)}
                  </RecordLink>
                )
              : cell,
            ...(primary
              ? { priority: 0, minWidth: 180 }
              : column.minWidth === undefined
                ? {}
                : { minWidth: column.minWidth }),
          });
        }),
      ),
    [columns, name, vocabularies, open, ownerCollection],
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
        (STATUS_KEYS.has(column.key) ||
          CHIP_KEYS.has(column.key) ||
          /_type$/.test(column.key) ||
          column.items !== undefined),
    )
    .map((column) => column.key)
    .slice(0, 3);
  // Every member but a viewer gives the records an owner, and row-level security decides each
  // write, as it does a create.
  const assigning = ownerCollection !== undefined && !readOnly && workspace.role !== "viewer";
  const table = useCollectionTable({
    columns: tableColumns,
    data: rows,
    getRowId: (row) => row.id,
    label: title,
    preview,
    view: `program-${name}`,
    resizable: true,
    reorderable: true,
    // A reader who may edit chooses records to give them one owner together.
    selectable: assigning,
  });
  const displayed = useDisplayedRecords(table, undefined, byId);
  displayedRef.current = displayed;
  const owners = useOwnerAssignment({
    table,
    collection: assigning ? ownerCollection : undefined,
    noun: { one: productRecordNoun(name), other: productCollectionNoun(name) },
  });
  // The Owner filter's values: everyone by name, then No owner with how many records nobody owns.
  const unowned = records.filter((row) => !row[OWNER_KEY]).length;
  const ownerOptions = useMemo(
    () =>
      ownerFilterOptions(
        (people.data ?? []).map((party) => party.name),
        unowned,
      ),
    [people.data, unowned],
  );
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
  // The create action, small in the toolbar and in the empty state. A collection with other ways
  // to create its record joins them to it as a labelled icon menu. ProductCollection draws a lone
  // Button in the collection's weight; it cannot reach into a group or a menu trigger's render,
  // so a group is written in that weight: a secondary where the collection sits among others.
  const createButton = (variant: "primary" | "secondary") => (
    <Button size="small" variant={variant} iconBefore={<Plus />} onClick={openCreate}>
      {createActionLabel}
    </Button>
  );
  const createWeight = section ? "secondary" : "primary";
  const createAction = createMenu ? (
    <ButtonGroup aria-label={createActionLabel}>
      {createButton(createWeight)}
      <ButtonGroupSeparator isDecorative />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              label={createMenu.label}
              icon={<ChevronDown />}
              size="small"
              variant={createWeight}
            />
          }
        />
        <DropdownMenuContent align="end">
          {createMenu.items.map((item) => (
            <DropdownMenuItem key={item.label} onClick={item.onSelect}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  ) : (
    createButton("primary")
  );
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
      queries={[query, ...linked.queries, ...(peopleKeys ? [people] : []), ...(queries ?? [])]}
      fill={fill}
      // A named collection sits beside others on its tab: the compact shape, as EntitySection, and
      // a secondary create action, since the page header keeps the surface's one primary.
      compact={section}
      actionVariant={section ? "secondary" : "primary"}
      searchLabel={`Find ${noun}`}
      // A collection inside a preview answers the task at hand; its question ends with it.
      keepQuestion={!dialogNavigation}
      filters={[
        ...chips.map((key) => <DataTable.Filter key={key} table={table} column={key} />),
        // The Owner, last, where the collection assigns owners.
        ...(ownerCollection
          ? [
              <DataTable.Filter
                key={OWNER_KEY}
                table={table}
                column={OWNER_KEY}
                options={ownerOptions}
              />,
            ]
          : []),
      ]}
      selection={owners.selection}
      action={allowCreate ? createAction : extraActions}
      // A record with no page opens its preview, as its name and its eye do.
      onRowClick={(row) => {
        const record = byId.get(row.id) ?? row;
        openRecord(name, record, () => open(record));
      }}
      empty={{
        illustration: empty?.illustration ?? collectionIllustration[name] ?? "records",
        title: empty?.title ?? `No ${noun} yet`,
        description,
        // Small, as in the toolbar: ProductCollection draws it medium in a centred first-record empty.
        action: allowCreate ? createAction : undefined,
      }}
    />
  );
  return (
    <>
      {section ? (
        // Its view's name, so a link can bring the collection into view (the Overview's trays).
        <Section id={`program-${name}`} ref={sectionRef} tabIndex={-1} title={title}>
          {content}
        </Section>
      ) : (
        content
      )}
      {owners.dialog}
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
              names: "system_components",
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
              names: "parameters",
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
            names: "profile_resolutions",
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
  if (table === "lifecycle_gates") return <GateCriteria gate={row} />;
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

/**
 * A gate's criteria: written one at a time, or drawn from the security outcomes of the system
 * life cycle processes (NIST SP 800-160 Vol. 1) through Add security outcomes, the collection's
 * second way to create. Source names the process a criterion was drawn from.
 */
function GateCriteria({ gate }: { gate: DataRecord }) {
  const [adding, setAdding] = useState(false);
  const sources = useGateCriterionSources(gate.id);
  const drawn = sources.data;
  const columns = useMemo<ProgramColumn[]>(
    () => [
      { key: "title", title: "Criterion" },
      {
        // After the criterion, so a narrow frame folds the description before it, and wide
        // enough to read a process's name whole.
        key: "source",
        title: "Source",
        minWidth: 220,
        // The process's name, which the rows sort, search and export by.
        value: (row) => drawn?.byCriterion.get(row.id)?.process ?? null,
        render: (row) => <CriterionSource criterion={row} sources={drawn} />,
      },
      { key: "required", title: "Required" },
      { key: "description", title: "Description" },
    ],
    [drawn],
  );
  const createMenu = useMemo(
    () => ({
      label: "More ways to create a gate criterion",
      items: [{ label: "Add security outcomes", onSelect: () => setAdding(true) }],
    }),
    [],
  );
  return (
    <>
      <ProgramCollection
        name="gate_criteria"
        section
        title="Gate criteria"
        filters={{ gate_id: gate.id }}
        columns={columns}
        queries={[sources]}
        createMenu={createMenu}
      />
      {adding && (
        <AddSecurityOutcomes gate={gate} sources={sources} onClose={() => setAdding(false)} />
      )}
    </>
  );
}
