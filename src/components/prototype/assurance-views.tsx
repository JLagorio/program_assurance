import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
  useEndOnHide,
} from "./record-preview";
import { ProductCollection } from "./product-collection";
import { useServerCollection, vocabularyOptions } from "./collection-question";
import { RecordSummaryPreview, type RecordSummaryField } from "./record-summary-preview";
import { LibrarySelect } from "./library-shared";
import { DueDate, EmptyMessage, MissingRecord, RecordActions, VersionName } from "./work-common";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Button,
  DataTable,
  DateTime,
  Editable,
  HeadingLevelProvider,
  Inspector,
  PageHeader,
  Person,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  defineColumns,
  toast,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows, useRow, type Row } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { Page } from "@/components/app/shell";
import { useSetPlannedCompletion } from "@/lib/due-dates";
import { type DataRecord } from "@/lib/records";
import {
  remediationStatuses,
  revisionStates,
  riskLevels,
  riskStatuses,
  severityLevels,
  type StatusVocabulary,
} from "@/lib/status";
import { registerViews } from "@/lib/register-views";
import { LevelIndicator, StatusBadge } from "@/components/app/status";
import { serverRead, useServerResult, type ServerRow } from "@/lib/server-table";
import {
  downloadJson,
  EntityEditor,
  EntitySection,
  ModelFacts,
  ModelTable,
  QueryState,
  RelationName,
  type DisplayColumn,
} from "./record-tools";
import { RecordTrail, TrailLink } from "./record-trail";
import { RetainedTabPanels } from "./program-shared";

const asRecords = (rows: unknown[] | undefined) => (rows ?? []) as DataRecord[];
/** A person: in a table, their avatar and name, sorted and found by the name; as a fact, the name. */
const party = (key = "owner_party_id", label = "Owner"): DisplayColumn => ({
  key,
  label,
  kind: "person",
  render: (row) => <RelationName table="parties" id={row[key] as string | null} />,
});
const program: DisplayColumn = {
  key: "program_id",
  label: "Program",
  render: (row) => <RelationName table="programs" id={row["program_id"] as string | null} />,
};
const status: DisplayColumn = { key: "status" };
/**
 * Where a remediation item stands for its dates: a completed item's dates read plainly, and a
 * cancelled or risk-accepted item's carry no due state, since its remediation will not happen.
 */
const remediationEnd = (itemStatus: unknown) => ({
  done: itemStatus === "completed",
  cancelled: itemStatus === "cancelled" || itemStatus === "risk_accepted",
});
/**
 * A commitment's planned completion, marked overdue or due until it is completed. Only the latest
 * commitment is still due: an earlier one was replaced by it, so its day reads plainly.
 */
const plannedCompletion = (itemStatus: unknown, latestId: string | undefined): DisplayColumn => ({
  key: "planned_completion_date",
  label: "Planned",
  // Wide enough for the day and where it stands ("Oct 4, 2026 · Due in 2 days") on one line.
  minWidth: 200,
  render: (row) => {
    const end = remediationEnd(itemStatus);
    return (
      <DueDate
        value={row["planned_completion_date"]}
        done={end.done || Boolean(row["actual_completion_date"])}
        cancelled={end.cancelled || row["id"] !== latestId}
      />
    );
  },
});
/**
 * The shown commitment's planned completion in its item's Details: a calendar day, set in place
 * while the commitment is a draft and saved as its next revision. A published commitment, or a
 * viewer, reads the day and where it stands until the item is completed. An unsaved day is asked
 * about before the page is left, as a form's draft is.
 */
function PlannedCompletion({
  version,
  itemStatus,
  latest,
}: {
  version: Row<"poam_item_revisions">;
  /** The remediation item's status, which decides whether its dates are still due. */
  itemStatus: string;
  /** The commitment is the item's latest: an earlier one was replaced, so its day reads plainly. */
  latest: boolean;
}) {
  const workspace = useWorkspace();
  const setPlanned = useSetPlannedCompletion();
  const [day, setDay] = useState(version.planned_completion_date ?? "");
  const [draft, setDraft] = useState<string | null>(null);
  // A newer revision of the commitment (this save's own, read back, or another session's) shows
  // its day; a save made before it comes back is made at the revision that save returned.
  const [shown, setShown] = useState(version.revision);
  if (version.revision !== shown) {
    setShown(version.revision);
    setDay(version.planned_completion_date ?? "");
  }
  const savedRevision = useRef(0);
  const guard = useDraftGuard({
    dirty: draft !== null,
    // The day stays on the page; nothing closes it.
    onClose: () => {},
    description: "The planned completion date you were changing will be lost.",
  });
  const end = remediationEnd(itemStatus);
  if (workspace.role === "viewer" || version.state !== "draft")
    return (
      <DueDate
        value={version.planned_completion_date}
        done={end.done || Boolean(version.actual_completion_date)}
        cancelled={end.cancelled || !latest}
      />
    );
  return (
    <>
      <Editable.Date
        label="Planned completion"
        value={day}
        due={!end.cancelled && latest}
        complete={end.done || Boolean(version.actual_completion_date)}
        placeholder="No planned completion"
        onValueChange={setDay}
        onDraftChange={setDraft}
        save={async (next) => {
          const row = await setPlanned.mutateAsync({
            id: version.id,
            revision: Math.max(version.revision, savedRevision.current),
            day: next,
          });
          savedRevision.current = Math.max(savedRevision.current, row.revision);
        }}
      />
      {guard.confirmation}
    </>
  );
}
const versionColumns: DisplayColumn[] = [
  { key: "version_number", label: "Version" },
  { key: "state" },
  { key: "description" },
  { key: "published_at", label: "Published" },
];

/** The trail every POA&M and risk record starts from, back to the collection the record is in. */
function RegisterTrail({ current, tab }: { current: string; tab: RegisterTab }) {
  return (
    <RecordTrail current={current}>
      <TrailLink to="/register" search={{ tab }}>
        POA&M & risk register
      </TrailLink>
    </RecordTrail>
  );
}

/** A register's root: the page's own when it is the page, a block of a tab when it sits in one. */
function RegisterRoot({ page, children }: { page: boolean; children: ReactNode }) {
  return page ? <Page>{children}</Page> : <Stack space="space.200">{children}</Stack>;
}

/**
 * A risk as the register and its preview read it: the risk's own fields, which its Edit needs, its
 * program and owner by name, and its latest assessment's severity, likelihood and impact.
 */
type RiskRow = ServerRow<
  "risk_rows",
  | "id"
  | "tenant_id"
  | "title"
  | "program_id"
  | "scope_id"
  | "owner_party_id"
  | "status"
  | "revision"
  | "created_at"
  | "updated_at"
  | "program_name"
  | "owner_name"
  | "severity"
  | "likelihood"
  | "impact",
  "tenant_id" | "title" | "program_id" | "status" | "revision" | "created_at" | "updated_at"
>;

/**
 * The risks, a page at a time from the server, newest change first: each with its latest
 * assessment, which the sort and the filters reach as the Portfolio's tiles and matrix ask them.
 */
const riskRead = serverRead({
  source: "risk_rows",
  model: "risks",
  // A new assessment changes a risk's latest severity, likelihood and impact.
  models: ["risk_revisions"],
  columns: [
    "id",
    "tenant_id",
    "title",
    "program_id",
    "scope_id",
    "owner_party_id",
    "status",
    "revision",
    "created_at",
    "updated_at",
    "program_name",
    "owner_name",
    "severity",
    "likelihood",
    "impact",
  ],
  search: ["title", "program_name", "owner_name"],
  fields: {
    // The program and the owner sort, and are found, by their names.
    program_id: { column: "program_name", filter: false },
    owner_party_id: { column: "owner_name", filter: false },
    status: { labels: riskStatuses, sort: "status_rank" },
    severity: { labels: severityLevels, sort: "severity_rank" },
    likelihood: { labels: riskLevels, sort: "likelihood_rank" },
    impact: { labels: riskLevels, sort: "impact_rank" },
  },
  order: [{ column: "updated_at", ascending: false }],
});

/** A person the register names: their name, else why there is none. */
const riskOwner = (row: RiskRow) =>
  row.owner_name ? (
    <Person name={row.owner_name} />
  ) : (
    <Absent label={row.owner_party_id ? "Not available" : "Not recorded"} />
  );
const riskProgram = (row: RiskRow) => row.program_name ?? <Absent label="Not available" />;
/** A level of the latest assessment, drawn as its indicator; a risk with none is not assessed. */
const riskLevel = (levels: StatusVocabulary, key: "severity" | "likelihood" | "impact") =>
  function Level(row: RiskRow) {
    return <LevelIndicator levels={levels} value={row[key]} absentLabel="Not assessed" />;
  };

/** The register's columns, one list for every render: stepping through the preview rebuilds none. */
const riskColumns = defineColumns<RiskRow>((c) => [
  c.text("title", {
    header: "Risk",
    hideable: false,
    minWidth: 180,
    priority: 0,
    cell: (row) => (
      <RecordLink table="risks" record={row}>
        {row.title}
      </RecordLink>
    ),
  }),
  // In a narrow register the severity and the status stay beside the risk longest. The program
  // takes the width its names need, the owner a person's, and the risk the rest.
  c.text("program_id", { header: "Program", priority: 3, width: 200, cell: riskProgram }),
  c.person("owner_party_id", { header: "Owner", priority: 4, cell: riskOwner }),
  c.status("severity", {
    header: "Latest severity",
    width: 140,
    priority: 1,
    statuses: severityLevels,
    cell: riskLevel(severityLevels, "severity"),
  }),
  c.status("status", { header: "Status", width: 140, priority: 2, statuses: riskStatuses }),
  c.date("updated_at", { header: "Updated", priority: 5 }),
  c.status("likelihood", {
    header: "Likelihood",
    width: 140,
    priority: 6,
    statuses: riskLevels,
    cell: riskLevel(riskLevels, "likelihood"),
  }),
  c.status("impact", {
    header: "Impact",
    width: 140,
    priority: 7,
    statuses: riskLevels,
    cell: riskLevel(riskLevels, "impact"),
  }),
]);

/**
 * What the risk preview says of a risk, beside its name: the register's columns. The program and
 * the owner are read by their ids, which the preview's Edit saves, so a changed owner reads at once.
 */
const riskFields: RecordSummaryField<RiskRow>[] = [
  {
    key: "program_id",
    label: "Program",
    render: (row) => <RelationName table="programs" id={row.program_id} />,
  },
  {
    key: "owner_party_id",
    label: "Owner",
    render: (row) => <RelationName table="parties" id={row.owner_party_id} />,
  },
  { key: "severity", label: "Latest severity", statuses: severityLevels },
  { key: "status", label: "Status", statuses: riskStatuses },
  { key: "updated_at", label: "Updated", render: (row) => <DateTime value={row.updated_at} /> },
  { key: "likelihood", label: "Likelihood", statuses: riskLevels },
  { key: "impact", label: "Impact", statuses: riskLevels },
];

export function RiskList({ headingScope = "page" }: { headingScope?: "page" | "section" }) {
  const workspace = useWorkspace(),
    navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<RiskRow | null>(null);
  // A preview belongs to its tab: it ends when the register's tab hides this collection.
  useEndOnHide(() => setPreview(null));
  const collection = useServerCollection<RiskRow>(riskRead, {
    columns: riskColumns,
    preview: useMemo(
      () => ({ onPreview: setPreview, activeId: preview?.id ?? null }),
      [preview?.id],
    ),
    label: "Risks",
    // Names the reader's column layout and the question's parameters in the address, which the
    // Portfolio's links ask: `risk-register.filters`.
    view: registerViews.risks,
    resizable: true,
    reorderable: true,
  });
  const { table } = collection;
  const displayed = useDisplayedRecords(table);
  const readResult = useServerResult(riskRead);
  const [exporting, setExporting] = useState(false);
  /** Every risk the question leaves, across its pages, as the register shows them. */
  const exportRisks = () => {
    setExporting(true);
    readResult({
      search: String(table.state.globalFilter ?? ""),
      sorting: table.state.sorting,
      filters: table.state.columnFilters,
    })
      .then((rows) => downloadJson("risk-register.json", rows))
      .catch((cause: unknown) =>
        toast.add({
          type: "error",
          title: "The risks were not exported",
          description: cause instanceof Error ? cause.message : "Try again.",
        }),
      )
      .finally(() => setExporting(false));
  };
  const create = (size: "small" | "medium") =>
    workspace.role !== "viewer" ? (
      <Button size={size} variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
        Create risk
      </Button>
    ) : undefined;
  return (
    <RegisterRoot page={headingScope === "page"}>
      {headingScope === "page" ? (
        <PageHeader>
          <PageHeader.Heading>
            <PageHeader.Title>Risk register</PageHeader.Title>
          </PageHeader.Heading>
        </PageHeader>
      ) : null}
      {creating && (
        <EntityEditor
          table="risks"
          onCancel={() => setCreating(false)}
          onSaved={(row) =>
            void navigate({ to: "/register/risks/$riskId", params: { riskId: row.id } })
          }
        />
      )}
      <ProductCollection
        {...collection}
        fill
        noun={{ one: "risk", other: "risks" }}
        onRowClick={(row) => void navigate(recordDestination("risks", row))}
        empty={{
          illustration: "records",
          title: "No risks yet",
          description:
            "Record a risk when an identified threat or vulnerability requires assessment and treatment.",
          action: create("medium"),
        }}
        searchLabel="Find risks"
        // Every question a link asks of the register has a chip the reader can see and clear: the
        // Open risks tile filters the status, a risk matrix cell the likelihood and the impact too.
        filters={
          <>
            <DataTable.Filter
              table={table}
              column="status"
              options={vocabularyOptions(riskStatuses)}
            />
            <DataTable.Filter
              table={table}
              column="severity"
              options={vocabularyOptions(severityLevels)}
            />
            <DataTable.Filter
              table={table}
              column="likelihood"
              options={vocabularyOptions(riskLevels)}
            />
            <DataTable.Filter
              table={table}
              column="impact"
              options={vocabularyOptions(riskLevels)}
            />
          </>
        }
        commands={[{ label: "Export risks", onSelect: exportRisks, disabled: exporting }]}
        action={create("small")}
      />
      {preview && (
        <RecordSummaryPreview
          model="risks"
          record={preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={riskFields}
        />
      )}
    </RegisterRoot>
  );
}

export const RISK_TABS = [
  "overview",
  "assessments",
  "responses",
  "evidence",
  "work",
  "activity",
] as const;
export type RiskTab = (typeof RISK_TABS)[number];
const riskTabLabels: Record<RiskTab, string> = {
  overview: "Overview",
  assessments: "Assessments",
  responses: "Responses",
  evidence: "Evidence",
  work: "Work",
  activity: "Activity",
};
/** The tab a URL names, when the route keeps it there. */
function riskTab(value: unknown): RiskTab | undefined {
  return RISK_TABS.find((tab) => tab === value);
}

export function RiskRecord({
  id,
  tab: routeTab,
  onTabChange,
}: {
  id: string;
  /** The tab, when the route keeps it in the URL; local otherwise. */
  tab?: RiskTab | undefined;
  onTabChange?: ((tab: RiskTab) => void) | undefined;
}) {
  const query = useRow("risks", id),
    versions = useRows("risk_revisions", { risk_id: id });
  const [editing, setEditing] = useState<DataRecord | null>(null),
    [localTab, setLocalTab] = useState<RiskTab>("overview"),
    [selected, setSelected] = useState<string | null>(null);
  // Where the route keeps the tab, the address owns it, so Back to an address with no tab shows the
  // first; otherwise the screen keeps its own.
  const tab = onTabChange ? (routeTab ?? "overview") : localTab;
  const select = (next: RiskTab) => {
    if (onTabChange) onTabChange(next);
    else setLocalTab(next);
  };
  const record = query.data;
  const assessment =
    versions.data?.find((row) => row.id === selected) ??
    versions.data?.slice().sort((a, b) => b.version_number - a.version_number)[0];
  return (
    <Page>
      <QueryState query={query} region>
        {record ? (
          <>
            <PageHeader>
              <RegisterTrail current={record.title} tab="risks" />
              <PageHeader.Heading>
                <PageHeader.Title>{record.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="risks"
                  id={id}
                  onEdit={() => setEditing(record as DataRecord)}
                  editLabel="Edit risk"
                />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor table="risks" existing={editing} onCancel={() => setEditing(null)} />
            )}
            {/* Keyed by the record: its tabs' retained state ends when another risk opens. */}
            <Tabs
              key={id}
              value={tab}
              onValueChange={(value) => select(riskTab(value) ?? "overview")}
            >
              <TabsList variant="line" aria-label="Risk sections">
                {RISK_TABS.map((value) => (
                  <TabsTrigger key={value} value={value}>
                    {riskTabLabels[value]}
                  </TabsTrigger>
                ))}
              </TabsList>
              <RetainedTabPanels tabs={RISK_TABS} value={tab} space="space.250">
                {(name) => (
                  <>
                    {name === "overview" && (
                      <>
                        {/* The Details, first in Overview: a rail beside it, or on a phone a
                            Details disclosure under the tabs. Only while Overview is shown, since
                            the panel stays mounted behind the other tabs. */}
                        {tab === "overview" && (
                          <Shell.Aside
                            label="Risk details"
                            summary={<StatusBadge statuses={riskStatuses} value={record.status} />}
                          >
                            <Inspector.Group title="Details">
                              <ModelFacts
                                table="risks"
                                record={record as DataRecord}
                                fields={[
                                  program,
                                  party(),
                                  "status",
                                  {
                                    key: "scope_id",
                                    label: "Scope",
                                    render: (row) => (
                                      <RelationName
                                        table="scopes"
                                        id={row["scope_id"] as string | null}
                                      />
                                    ),
                                  },
                                ]}
                              />
                            </Inspector.Group>
                          </Shell.Aside>
                        )}
                        <Section title="Latest assessment">
                          <QueryState query={versions}>
                            {assessment ? (
                              <ModelFacts
                                table="risk_revisions"
                                record={assessment as DataRecord}
                                fields={[
                                  { key: "version_number", label: "Version" },
                                  "state",
                                  "threat",
                                  "vulnerability",
                                  "likelihood",
                                  "impact",
                                  "severity",
                                  { key: "assessment_rationale", label: "Rationale" },
                                  { key: "assessed_at", label: "Assessed" },
                                ]}
                              />
                            ) : (
                              <EmptyMessage
                                compact
                                title="No risk assessment yet"
                                description="An assessment records the threat, the vulnerability, and how likely and severe the risk is."
                              />
                            )}
                          </QueryState>
                        </Section>
                      </>
                    )}
                    {name === "assessments" && (
                      <EntitySection
                        table="risk_revisions"
                        filters={{ risk_id: id }}
                        title="Risk assessments"
                        columns={[...versionColumns, { key: "severity" }]}
                      />
                    )}
                    {name === "responses" && (
                      <QueryState query={versions}>
                        {assessment ? (
                          <Stack space="space.250">
                            <LibrarySelect
                              label="Assessment version"
                              value={assessment.id}
                              options={(versions.data ?? []).map((item) => ({
                                value: item.id,
                                label: `Version ${item.version_number}`,
                              }))}
                              onChange={setSelected}
                            />
                            <Section
                              title={`Assessment version ${assessment.version_number}`}
                              action={<AssessmentEditor row={assessment} />}
                            >
                              <ModelFacts
                                table="risk_revisions"
                                record={assessment as DataRecord}
                                fields={[
                                  "state",
                                  "description",
                                  "threat",
                                  "vulnerability",
                                  "likelihood",
                                  "impact",
                                  "severity",
                                  { key: "assessment_rationale", label: "Rationale" },
                                ]}
                              />
                            </Section>
                            <EntitySection
                              table="risk_responses"
                              filters={{ risk_revision_id: assessment.id }}
                              title="Risk responses"
                              showHeading
                              columns={[
                                { key: "response_type" },
                                { key: "description" },
                                party(),
                                { key: "due_at", label: "Due" },
                                { key: "approved_at", label: "Approved" },
                              ]}
                              readOnly={assessment.state === "published"}
                            />
                          </Stack>
                        ) : (
                          <EmptyMessage
                            title="No assessment version"
                            description="Create an assessment version before recording its response."
                          />
                        )}
                      </QueryState>
                    )}
                    {name === "evidence" && (
                      <QueryState query={versions}>
                        {assessment ? (
                          <EntitySection
                            table="risk_observations"
                            links="observations"
                            filters={{ risk_revision_id: assessment.id }}
                            title="Supporting observations"
                            columns={[
                              {
                                key: "observation_id",
                                render: (row) => (
                                  <RelationName
                                    table="observations"
                                    id={row["observation_id"] as string}
                                  />
                                ),
                              },
                            ]}
                            readOnly={assessment.state === "published"}
                          />
                        ) : (
                          <EmptyMessage
                            title="No assessment evidence yet"
                            description="Observations support an assessment version; create one first."
                          />
                        )}
                      </QueryState>
                    )}
                    {name === "work" && (
                      <EntitySection
                        table="task_risks"
                        links="tasks"
                        filters={{ risk_id: id }}
                        title="Risk work"
                        columns={[
                          {
                            key: "task_id",
                            render: (row) => (
                              <RelationName table="tasks" id={row["task_id"] as string} />
                            ),
                          },
                        ]}
                      />
                    )}
                    {name === "activity" && (
                      <EntitySection
                        table="activity_events"
                        filters={{ risk_id: id }}
                        title="Activity"
                        columns={[
                          { key: "event_type" },
                          { key: "description" },
                          { key: "occurred_at", label: "Occurred" },
                        ]}
                        readOnly
                      />
                    )}
                  </>
                )}
              </RetainedTabPanels>
            </Tabs>
          </>
        ) : (
          <MissingRecord backTo="/register" kind="Risk" />
        )}
      </QueryState>
    </Page>
  );
}
/** The draft assessment's edit, in its section's action; the trigger stays while its dialog is open. */
function AssessmentEditor({ row }: { row: Row<"risk_revisions"> }) {
  const workspace = useWorkspace();
  const [editing, setEditing] = useState<DataRecord | null>(null);
  if (workspace.role === "viewer" || row.state !== "draft") return null;
  return (
    <>
      <Button size="small" onClick={() => setEditing(row as DataRecord)}>
        Edit risk assessment
      </Button>
      {editing && (
        <EntityEditor table="risk_revisions" existing={editing} onCancel={() => setEditing(null)} />
      )}
    </>
  );
}

export const REGISTER_TABS = ["poam", "risks", "unrolled", "documents"] as const;
export type RegisterTab = (typeof REGISTER_TABS)[number];
const registerTabLabels: Record<RegisterTab, string> = {
  poam: "Remediation items",
  risks: "Risks",
  unrolled: "Unrolled findings",
  documents: "POA&M plans",
};
/** The tab a URL names, when the route keeps it there. */
function registerTab(value: unknown): RegisterTab | undefined {
  return REGISTER_TABS.find((tab) => tab === value);
}

/**
 * The assessment findings short of satisfied that no risk assessment records yet. Read when the
 * Unrolled findings tab is first shown, never with the register's other tabs.
 */
function UnrolledFindings() {
  const findings = useRows("assessment_findings"),
    links = useRows("finding_risks", undefined, { columns: ["id", "finding_id"] });
  const unrolled = findings.data?.filter(
    (row) =>
      !links.data?.some((link) => link.finding_id === row.id) && row.determination !== "satisfied",
  );
  return (
    <ModelTable
      model="assessment_findings"
      fill
      rows={asRecords(unrolled)}
      queries={[findings, links]}
      columns={[
        { key: "title" },
        { key: "determination" },
        { key: "determined_at", label: "Determined" },
      ]}
      empty={{
        illustration: "done",
        title: "Nothing unrolled",
        description: "No unresolved finding is awaiting a recorded risk relationship.",
      }}
      searchLabel="Find assessment findings"
    />
  );
}

export function Register({
  tab: routeTab,
  onTabChange,
}: {
  /** The tab, when the route keeps it in the URL; local otherwise. */
  tab?: RegisterTab | undefined;
  onTabChange?: ((tab: RegisterTab) => void) | undefined;
} = {}) {
  const [localTab, setLocalTab] = useState<RegisterTab>("poam");
  // Where the route keeps the tab, the address owns it, so Back to an address with no tab shows the
  // first; otherwise the screen keeps its own.
  const tab = onTabChange ? (routeTab ?? "poam") : localTab;
  const select = (next: RegisterTab) => {
    if (onTabChange) onTabChange(next);
    else setLocalTab(next);
  };
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>POA&M & risk register</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Tabs value={tab} onValueChange={(value) => select(registerTab(value) ?? "poam")}>
        <TabsList variant="line" aria-label="POA&M and risk collections">
          {REGISTER_TABS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {registerTabLabels[value]}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Each collection keeps its question, rows and scroll while another tab is open. */}
        <RetainedTabPanels tabs={REGISTER_TABS} value={tab}>
          {(name) => (
            <>
              {name === "poam" && (
                <EntitySection
                  fill
                  table="poam_items"
                  title="Remediation items"
                  columns={[
                    { key: "title" },
                    status,
                    party(),
                    {
                      key: "poam_document_id",
                      label: "POA&M plan",
                      render: (row) => (
                        <RelationName
                          table="poam_documents"
                          id={row["poam_document_id"] as string}
                        />
                      ),
                    },
                  ]}
                />
              )}
              {name === "risks" && <RiskList headingScope="section" />}
              {name === "unrolled" && <UnrolledFindings />}
              {name === "documents" && (
                <EntitySection
                  fill
                  table="poam_documents"
                  title="POA&M plans"
                  columns={[
                    { key: "title" },
                    program,
                    {
                      key: "scope_id",
                      render: (row) => (
                        <RelationName table="scopes" id={row["scope_id"] as string | null} />
                      ),
                    },
                  ]}
                />
              )}
            </>
          )}
        </RetainedTabPanels>
      </Tabs>
    </Page>
  );
}
export function PoamRecord({ id }: { id: string }) {
  const query = useRow("poam_items", id),
    versions = useRows("poam_item_revisions", { poam_item_id: id });
  const [editing, setEditing] = useState<DataRecord | null>(null),
    [selected, setSelected] = useState<string | null>(null);
  const record = query.data;
  // The latest commitment is the one still due; an earlier one was replaced by it.
  const latest = versions.data?.slice().sort((a, b) => b.version_number - a.version_number)[0];
  const version = versions.data?.find((row) => row.id === selected) ?? latest;
  return (
    <Page>
      <QueryState query={query} region>
        {record ? (
          <>
            <PageHeader>
              <RegisterTrail current={record.title} tab="poam" />
              <PageHeader.Heading>
                <PageHeader.Title>{record.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="poam_items"
                  id={id}
                  onEdit={() => setEditing(record as DataRecord)}
                  editLabel="Edit remediation item"
                />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor
                table="poam_items"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <Shell.Aside
              label="Remediation item details"
              summary={<StatusBadge statuses={remediationStatuses} value={record.status} />}
            >
              <Inspector.Group title="Details">
                <ModelFacts
                  table="poam_items"
                  record={record as DataRecord}
                  fields={[
                    party(),
                    "status",
                    {
                      key: "poam_document_id",
                      label: "POA&M plan",
                      render: (row) => (
                        <RelationName
                          table="poam_documents"
                          id={row["poam_document_id"] as string}
                        />
                      ),
                    },
                    // The commitment shown below is a fact of the rail like the others: its label
                    // beside the value, which is the chooser once there is more than one.
                    ...(version
                      ? [
                          {
                            key: "remediation_commitment",
                            label: "Remediation commitment",
                            render: () =>
                              (versions.data?.length ?? 0) > 1 ? (
                                <LibrarySelect
                                  inline
                                  label="Remediation commitment"
                                  value={version.id}
                                  options={(versions.data ?? []).map((item) => ({
                                    value: item.id,
                                    label: `Version ${item.version_number}`,
                                  }))}
                                  onChange={setSelected}
                                />
                              ) : (
                                `Version ${version.version_number}`
                              ),
                          },
                          // The shown commitment's planned completion, set in place while it is
                          // a draft.
                          {
                            key: "planned_completion_date",
                            label: "Planned completion",
                            render: () => (
                              <PlannedCompletion
                                key={version.id}
                                version={version}
                                itemStatus={record.status}
                                latest={version.id === latest?.id}
                              />
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </Inspector.Group>
            </Shell.Aside>
            <EntitySection
              showHeading
              table="poam_item_revisions"
              filters={{ poam_item_id: id }}
              initialValues={{ poam_document_id: record.poam_document_id }}
              title="Remediation commitments"
              columns={[
                ...versionColumns,
                plannedCompletion(record.status, latest?.id),
                { key: "actual_completion_date", label: "Completed" },
              ]}
            />
            <QueryState query={versions}>
              {version ? (
                <PoamVersion
                  key={version.id}
                  version={version}
                  itemStatus={record.status}
                  latest={version.id === latest?.id}
                />
              ) : (
                <EmptyMessage
                  compact
                  title="No remediation commitment yet"
                  description="A commitment records the plan, its resources and its milestones."
                />
              )}
            </QueryState>
          </>
        ) : (
          <MissingRecord backTo="/register" kind="Remediation item" />
        )}
      </QueryState>
    </Page>
  );
}
function PoamVersion({
  version,
  itemStatus,
  latest,
}: {
  version: Row<"poam_item_revisions">;
  /** The remediation item's status, which decides whether its dates are still due. */
  itemStatus: string;
  /** The commitment is the item's latest; an earlier one's milestones were replaced with it. */
  latest: boolean;
}) {
  const end = remediationEnd(itemStatus);
  const workspace = useWorkspace();
  const canEdit = workspace.role !== "viewer" && version.state === "draft";
  const [editing, setEditing] = useState<DataRecord | null>(null);
  return (
    <Stack space="space.250">
      <Section
        title={`Remediation commitment · version ${version.version_number}`}
        action={
          canEdit ? (
            <Button size="small" onClick={() => setEditing(version as DataRecord)}>
              Edit remediation commitment
            </Button>
          ) : (
            <StatusBadge statuses={revisionStates} value={version.state} size="xsmall" />
          )
        }
      >
        {editing && (
          <EntityEditor
            table="poam_item_revisions"
            existing={editing}
            onCancel={() => setEditing(null)}
          />
        )}
        <ModelFacts
          table="poam_item_revisions"
          record={version as DataRecord}
          fields={[
            "description",
            { key: "remediation_plan", label: "Plan" },
            "resources",
            // The planned completion is in the item's Details, beside the commitment it belongs to.
            { key: "actual_completion_date", label: "Completed" },
            { key: "completion_rationale", label: "Rationale" },
          ]}
        />
      </Section>
      <EntitySection
        showHeading
        table="poam_milestones"
        filters={{ poam_item_revision_id: version.id }}
        title="Milestones"
        columns={[
          { key: "sequence_number", label: "Sequence" },
          { key: "title" },
          party(),
          {
            key: "planned_date",
            label: "Planned",
            minWidth: 200,
            // Overdue or due until the milestone, or its remediation item, is completed; an
            // earlier commitment's milestones read plainly.
            render: (row) => (
              <DueDate
                value={row["planned_date"]}
                done={end.done || row["status"] === "completed" || Boolean(row["completed_date"])}
                cancelled={end.cancelled || !latest || row["status"] === "cancelled"}
              />
            ),
          },
          { key: "completed_date", label: "Completed" },
          status,
        ]}
        readOnly={version.state === "published"}
      />
      <EntitySection
        showHeading
        table="poam_item_risks"
        links="risk_revisions"
        filters={{ poam_item_revision_id: version.id }}
        title="Linked risk assessments"
        columns={[
          {
            key: "risk_revision_id",
            render: (row) => (
              <VersionName table="risk_revisions" id={row["risk_revision_id"] as string} />
            ),
          },
        ]}
        readOnly={version.state === "published"}
      />
    </Stack>
  );
}
export function PoamDocument({ id }: { id: string }) {
  const workspace = useWorkspace();
  const query = useRow("poam_documents", id);
  const [editingDocument, setEditingDocument] = useState(false);
  const [displayedRevisions, setDisplayedRevisions] = useState<DataRecord[]>([]);
  const [editingRevision, setEditingRevision] = useState(false);
  const [revision, setRevision] = useState<DataRecord | null>(null);
  return (
    <Page>
      <QueryState query={query} region>
        {query.data ? (
          <>
            <PageHeader>
              <RegisterTrail current={query.data.title} tab="documents" />
              <PageHeader.Heading>
                <PageHeader.Title>{query.data.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="poam_documents"
                  id={id}
                  onEdit={() => setEditingDocument(true)}
                />
              </PageHeader.Actions>
            </PageHeader>
            {editingDocument && (
              <EntityEditor
                table="poam_documents"
                existing={query.data as DataRecord}
                onCancel={() => setEditingDocument(false)}
              />
            )}
            <Shell.Aside label="POA&M plan details">
              <Inspector.Group title="Details">
                <ModelFacts
                  table="poam_documents"
                  record={query.data as DataRecord}
                  fields={[
                    program,
                    "description",
                    { key: "created_at", label: "Created" },
                    { key: "updated_at", label: "Updated" },
                  ]}
                />
              </Inspector.Group>
            </Shell.Aside>
            <EntitySection
              showHeading
              table="poam_revisions"
              filters={{ poam_document_id: id }}
              title="Plan revisions"
              columns={versionColumns}
              onOpen={(row) => {
                setRevision(row);
                setEditingRevision(false);
              }}
              selectedId={revision?.id}
              onDisplayedRowsChange={setDisplayedRevisions}
            />
            {revision && (
              <RecordPreviewPanel
                title={`Version ${String(revision["version_number"])}`}
                label="POA&M revision preview"
                defaultWidth={640}
                onClose={() => {
                  setRevision(null);
                  setEditingRevision(false);
                }}
                recordActions={
                  revision["state"] === "draft" &&
                  workspace.role !== "viewer" && (
                    <Button size="small" variant="primary" onClick={() => setEditingRevision(true)}>
                      Edit POA&M revision
                    </Button>
                  )
                }
                navigation={
                  <RecordPreviewActions
                    table="poam_revisions"
                    record={revision}
                    rows={displayedRevisions}
                    onSelect={(row) => {
                      setRevision(row);
                      setEditingRevision(false);
                    }}
                  />
                }
              >
                {/* The version is the preview's h2; what it includes sits under it. */}
                <HeadingLevelProvider level={3}>
                  <Stack space="space.200">
                    <ModelFacts
                      table="poam_revisions"
                      record={revision}
                      fields={[
                        { key: "version_number", label: "Version" },
                        "state",
                        { key: "published_at", label: "Published" },
                      ]}
                    />
                    <EntitySection
                      table="poam_revision_items"
                      filters={{ poam_revision_id: revision.id }}
                      initialValues={{ poam_document_id: id }}
                      title="Included remediation commitments"
                      operation="Link remediation commitment"
                      showHeading
                      columns={[
                        {
                          key: "poam_item_revision_id",
                          render: (row) => (
                            <VersionName
                              table="poam_item_revisions"
                              id={row["poam_item_revision_id"] as string}
                            />
                          ),
                        },
                      ]}
                      readOnly={revision["state"] === "published"}
                    />
                    {editingRevision && (
                      <EntityEditor
                        table="poam_revisions"
                        existing={revision}
                        onCancel={() => setEditingRevision(false)}
                      />
                    )}
                  </Stack>
                </HeadingLevelProvider>
              </RecordPreviewPanel>
            )}
          </>
        ) : (
          <MissingRecord backTo="/register" kind="POA&M plan" />
        )}
      </QueryState>
    </Page>
  );
}
