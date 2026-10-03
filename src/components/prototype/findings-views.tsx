import {
  EmptyMessage,
  MissingRecord,
  RecordActions,
  VersionName,
  type QueryStatus,
} from "./work-common";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
import {
  Absent,
  Button,
  DataTable,
  DateTime,
  Inspector,
  KeyValue,
  PageHeader,
  Person,
  Prose,
  Shell,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  VisuallyHidden,
  defineColumns,
} from "@ledger/design-system";
import { useRow, type Row } from "@/lib/models";
import { registerViews } from "@/lib/register-views";
import { serverRead, type ServerRow } from "@/lib/server-table";
import { determinations, operationalIssueStatuses, severityLevels } from "@/lib/status";
import { LevelIndicator, StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { Page } from "@/components/app/shell";
import type { DataRecord } from "@/lib/records";
import { ObservationsRegister } from "./observations-register";
import { RetainedTabPanels } from "./program-shared";
import { ProductCollection } from "./product-collection";
import { useServerCollection, vocabularyOptions } from "./collection-question";
import { RecordLink, recordDestination, useDisplayedRecords, useEndOnHide } from "./record-preview";
import { RecordSummaryPreview, type RecordSummaryField } from "./record-summary-preview";
import { RecordTrail, TrailLink } from "./record-trail";
import { EntityEditor, EntitySection, ModelFacts, QueryState, RelationName } from "./record-tools";

/** Authored text under its name, keeping its line breaks; a labelled Absent when there is none. */
function Described({ label, text }: { label: string; text: string | null | undefined }) {
  return (
    <Prose label={label} className="max-w-layout-measure">
      {text?.trim() ? text : <Absent />}
    </Prose>
  );
}

/** A name the row cannot show: none recorded, or one recorded that the reader cannot see. */
const missing = (id: string | null | undefined) => (id ? "Not available" : "Not recorded");

/**
 * An operational issue as its register reads it: every column its preview's Edit seeds the form
 * from, and its program by name.
 */
type IssueRow = ServerRow<
  "operational_issue_rows",
  | "id"
  | "tenant_id"
  | "title"
  | "description"
  | "program_id"
  | "scope_id"
  | "owner_party_id"
  | "status"
  | "severity"
  | "opened_at"
  | "closed_at"
  | "closure_rationale"
  | "revision"
  | "updated_at"
  | "program_name",
  "tenant_id" | "title" | "program_id" | "status" | "revision" | "updated_at"
>;

/** The operational issues, a page at a time from the server, newest change first. */
const issueRead = serverRead({
  source: "operational_issue_rows",
  model: "operational_issues",
  columns: [
    "id",
    "tenant_id",
    "title",
    "description",
    "program_id",
    "scope_id",
    "owner_party_id",
    "status",
    "severity",
    "opened_at",
    "closed_at",
    "closure_rationale",
    "revision",
    "updated_at",
    "program_name",
  ],
  search: ["title", "program_name"],
  fields: {
    // The program sorts, and is found, by its name.
    program_id: { column: "program_name", filter: false },
    status: { labels: operationalIssueStatuses, sort: "status_rank" },
    severity: { labels: severityLevels, sort: "severity_rank" },
  },
  order: [{ column: "updated_at", ascending: false }],
});

/** The register's columns, one list for every render: stepping through the preview rebuilds none. */
const issueColumns = defineColumns<IssueRow>((c) => [
  c.text("title", {
    header: "Operational issue",
    hideable: false,
    minWidth: 180,
    priority: 0,
    cell: (row) => (
      <RecordLink table="operational_issues" record={row}>
        {row.title}
      </RecordLink>
    ),
  }),
  // On a phone the status stays beside the name, then the severity.
  c.text("program_id", {
    header: "Program",
    priority: 3,
    width: 200,
    cell: (row) => row.program_name ?? <Absent label={missing(row.program_id)} />,
  }),
  c.status("severity", {
    header: "Severity",
    width: 120,
    priority: 2,
    statuses: severityLevels,
    cell: (row) => <LevelIndicator levels={severityLevels} value={row.severity} />,
  }),
  c.status("status", {
    header: "Status",
    width: 120,
    priority: 1,
    statuses: operationalIssueStatuses,
  }),
]);

/** What the preview says of an issue: the register's columns, its program read by its id. */
const issueFields: RecordSummaryField<IssueRow>[] = [
  {
    key: "program_id",
    label: "Program",
    render: (row) => <RelationName table="programs" id={row.program_id} />,
  },
  { key: "severity", label: "Severity", statuses: severityLevels },
  { key: "status", label: "Status", statuses: operationalIssueStatuses },
];

/**
 * The workspace's operational issues, read a page at a time: the server pages, sorts, filters and
 * searches them, and the Portfolio's Open operational issues tile opens it on its status filter.
 */
function OperationalIssueRegister() {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<IssueRow | null>(null);
  useEndOnHide(() => setPreview(null));
  const collection = useServerCollection<IssueRow>(issueRead, {
    columns: issueColumns,
    preview: useMemo(
      () => ({ onPreview: setPreview, activeId: preview?.id ?? null }),
      [preview?.id],
    ),
    label: "Operational issues",
    view: registerViews.operationalIssues,
    resizable: true,
    reorderable: true,
  });
  const { table } = collection;
  const displayed = useDisplayedRecords(table);
  const create = (size: "small" | "medium") =>
    workspace.role !== "viewer" ? (
      <Button size={size} variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
        Create operational issue
      </Button>
    ) : undefined;
  return (
    <>
      {creating && (
        <EntityEditor
          table="operational_issues"
          operationLabel="Create operational issue"
          onCancel={() => setCreating(false)}
          onSaved={(row) => {
            setCreating(false);
            setPreview(row as IssueRow);
          }}
        />
      )}
      <ProductCollection
        {...collection}
        fill
        noun={{ one: "operational issue", other: "operational issues" }}
        onRowClick={(row) => void navigate(recordDestination("operational_issues", row))}
        empty={{
          illustration: "records",
          icon: <FileText />,
          title: "No operational issues yet",
          description:
            workspace.role !== "viewer"
              ? "An operational issue tracks a problem found in operation until it is closed."
              : "Nothing has been recorded here yet.",
          action: create("medium"),
        }}
        searchLabel="Find operational issues"
        filters={
          <>
            <DataTable.Filter
              table={table}
              column="severity"
              options={vocabularyOptions(severityLevels)}
            />
            <DataTable.Filter
              table={table}
              column="status"
              options={vocabularyOptions(operationalIssueStatuses)}
            />
          </>
        }
        action={create("small")}
      />
      {preview && (
        <RecordSummaryPreview
          model="operational_issues"
          record={preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={issueFields}
        />
      )}
    </>
  );
}

/**
 * An assessment finding as its register reads it: every column its preview's Edit seeds the form
 * from, and its assessor by name.
 */
type FindingRow = ServerRow<
  "assessment_finding_rows",
  | "id"
  | "tenant_id"
  | "assessment_results_revision_id"
  | "result_set_id"
  | "target_control_part_id"
  | "title"
  | "description"
  | "determination"
  | "assessor_party_id"
  | "determined_at"
  | "revision"
  | "updated_at"
  | "assessor_name",
  "tenant_id" | "title" | "determination" | "revision" | "updated_at"
>;

/** The assessment findings, a page at a time from the server, newest change first. */
const findingRead = serverRead({
  source: "assessment_finding_rows",
  model: "assessment_findings",
  columns: [
    "id",
    "tenant_id",
    "assessment_results_revision_id",
    "result_set_id",
    "target_control_part_id",
    "title",
    "description",
    "determination",
    "assessor_party_id",
    "determined_at",
    "revision",
    "updated_at",
    "assessor_name",
  ],
  search: ["title", "assessor_name"],
  fields: {
    determination: { labels: determinations, sort: "determination_rank" },
    // The assessor sorts, and is found, by their name.
    assessor_party_id: { column: "assessor_name", filter: false },
    determined_at: { filter: false },
  },
  order: [{ column: "updated_at", ascending: false }],
});

const findingColumns = defineColumns<FindingRow>((c) => [
  c.text("title", {
    header: "Assessment finding",
    hideable: false,
    minWidth: 180,
    priority: 0,
    cell: (row) => (
      <RecordLink table="assessment_findings" record={row}>
        {row.title}
      </RecordLink>
    ),
  }),
  c.status("determination", {
    header: "Determination",
    width: 150,
    priority: 1,
    statuses: determinations,
  }),
  c.person("assessor_party_id", {
    header: "Assessor",
    cell: (row) =>
      row.assessor_name ? (
        <Person name={row.assessor_name} />
      ) : (
        <Absent label={missing(row.assessor_party_id)} />
      ),
  }),
  c.date("determined_at", { header: "Determined" }),
]);

/** What the preview says of a finding: the register's columns, its assessor read by their id. */
const findingFields: RecordSummaryField<FindingRow>[] = [
  { key: "determination", label: "Determination", statuses: determinations },
  {
    key: "assessor_party_id",
    label: "Assessor",
    render: (row) => <RelationName table="parties" id={row.assessor_party_id} />,
  },
  {
    key: "determined_at",
    label: "Determined",
    render: (row) =>
      row.determined_at ? <DateTime value={row.determined_at} /> : <Absent label="Not recorded" />,
  },
];

/**
 * The workspace's assessment findings, read a page at a time: the Portfolio's Unsatisfied
 * assessment findings tile opens it on its determination filter.
 */
function AssessmentFindingRegister() {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<FindingRow | null>(null);
  useEndOnHide(() => setPreview(null));
  const collection = useServerCollection<FindingRow>(findingRead, {
    columns: findingColumns,
    preview: useMemo(
      () => ({ onPreview: setPreview, activeId: preview?.id ?? null }),
      [preview?.id],
    ),
    label: "Assessment findings",
    view: registerViews.assessmentFindings,
    resizable: true,
    reorderable: true,
  });
  const { table } = collection;
  const displayed = useDisplayedRecords(table);
  const create = (size: "small" | "medium") =>
    workspace.role !== "viewer" ? (
      <Button size={size} variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
        Create assessment finding
      </Button>
    ) : undefined;
  return (
    <>
      {creating && (
        <EntityEditor
          table="assessment_findings"
          operationLabel="Create assessment finding"
          onCancel={() => setCreating(false)}
          onSaved={(row) => {
            setCreating(false);
            setPreview(row as FindingRow);
          }}
        />
      )}
      <ProductCollection
        {...collection}
        fill
        noun={{ one: "assessment finding", other: "assessment findings" }}
        onRowClick={(row) => void navigate(recordDestination("assessment_findings", row))}
        empty={{
          illustration: "records",
          icon: <FileText />,
          title: "No assessment findings yet",
          description:
            workspace.role !== "viewer"
              ? "An assessment finding records a determination against a control statement or objective in an assessment's results."
              : "Nothing has been recorded here yet.",
          action: create("medium"),
        }}
        searchLabel="Find assessment findings"
        filters={
          <DataTable.Filter
            table={table}
            column="determination"
            options={vocabularyOptions(determinations)}
          />
        }
        action={create("small")}
      />
      {preview && (
        <RecordSummaryPreview
          model="assessment_findings"
          record={preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={findingFields}
        />
      )}
    </>
  );
}

/** The Findings & assets tabs, in order, by the value the URL keeps. */
export const FINDINGS_TABS = ["issues", "observations", "findings", "assets"] as const;
export type FindingsTab = (typeof FINDINGS_TABS)[number];

export function Findings({
  tab: routeTab,
  onTabChange,
}: {
  /** The tab, when the route keeps it in the URL; local otherwise. */
  tab?: FindingsTab | undefined;
  onTabChange?: ((tab: FindingsTab) => void) | undefined;
} = {}) {
  const [localTab, setLocalTab] = useState<FindingsTab>("issues");
  // Where the route keeps the tab, the address owns it, so Back to an address with no tab shows the
  // first; otherwise the screen keeps its own.
  const tab = onTabChange ? (routeTab ?? "issues") : localTab;
  const setTab = (next: FindingsTab) => {
    if (onTabChange) onTabChange(next);
    else setLocalTab(next);
  };
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Findings & assets</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Tabs value={tab} onValueChange={(value) => setTab(value as FindingsTab)}>
        <TabsList variant="line" aria-label="Findings and asset collections">
          <TabsTrigger value="issues">Operational issues</TabsTrigger>
          <TabsTrigger value="observations">Observations</TabsTrigger>
          <TabsTrigger value="findings">Assessment findings</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>
        {/* Each register keeps its search, filters, sort and page while another tab is open, and
            reads nothing until its tab is first shown. A hidden register's preview ends. */}
        <RetainedTabPanels tabs={FINDINGS_TABS} value={tab}>
          {(name) => (
            <>
              {name === "issues" && <OperationalIssueRegister />}
              {name === "observations" && <ObservationsRegister fill />}
              {name === "findings" && <AssessmentFindingRegister />}
              {name === "assets" && (
                <EntitySection
                  fill
                  table="inventory_items"
                  view={registerViews.systemAssets}
                  title="System assets"
                  description="An asset is a hardware or software item in a system's inventory."
                  columns={[
                    { key: "asset_id", label: "Asset ID" },
                    { key: "name", label: "Asset" },
                    {
                      key: "system_id",
                      label: "System",
                      render: (row) => (
                        <RelationName table="systems" id={row["system_id"] as string} />
                      ),
                    },
                    { key: "description", label: "Description" },
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

/** The results revision a finding belongs to: its version and state, or why they are missing. */
function ResultsRevision({
  query,
}: {
  query: QueryStatus & { data?: Row<"assessment_results_revisions"> | null | undefined };
}) {
  if (query.data)
    return (
      <ModelFacts
        record={query.data as DataRecord}
        table="assessment_results_revisions"
        fields={[
          { key: "version_number", label: "Results version" },
          { key: "state", label: "Results state" },
        ]}
      />
    );
  if (query.isError)
    return (
      <KeyValue label="Results version">
        <Text color="color.text.subtle">Could not load</Text>
      </KeyValue>
    );
  if (query.isPending && query.fetchStatus !== "idle")
    return (
      <KeyValue label="Results version">
        <Skeleton shape="line" width={96} />
        <VisuallyHidden>Loading</VisuallyHidden>
      </KeyValue>
    );
  return (
    <EmptyMessage
      compact
      title="Assessment results unavailable"
      description="This finding is read-only until its results revision is available."
    />
  );
}

export function FindingRecord({ id }: { id: string }) {
  const workspace = useWorkspace();
  const query = useRow("assessment_findings", id);
  const results = useRow(
    "assessment_results_revisions",
    query.data?.assessment_results_revision_id,
  );
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const row = query.data;
  const readOnly =
    workspace.role === "viewer" ||
    results.isPending ||
    results.isError ||
    results.data?.state !== "draft";
  return (
    <Page>
      <QueryState query={query} shape="record" region>
        {row ? (
          <>
            <PageHeader>
              <RecordTrail current={row.title}>
                <TrailLink to="/findings">Findings & assets</TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{row.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="assessment_findings"
                  id={id}
                  onEdit={() => setEditing(row as DataRecord)}
                  editLabel="Edit assessment finding"
                  readOnly={readOnly}
                />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor
                table="assessment_findings"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <Shell.Aside
              label="Assessment finding details"
              summary={
                row.determination ? (
                  <StatusBadge statuses={determinations} value={row.determination} />
                ) : undefined
              }
            >
              <Inspector.Group title="Details">
                <ModelFacts
                  record={row as DataRecord}
                  table="assessment_findings"
                  fields={[
                    { key: "determination", label: "Determination" },
                    { key: "determined_at", label: "Determined" },
                    {
                      key: "assessor_party_id",
                      label: "Assessor",
                      render: (record) => (
                        <RelationName
                          table="parties"
                          id={record["assessor_party_id"] as string | null}
                        />
                      ),
                    },
                    {
                      key: "target_control_part_id",
                      label: "Control statement or objective",
                      render: (record) => (
                        <RelationName
                          table="control_parts"
                          id={record["target_control_part_id"] as string}
                        />
                      ),
                    },
                    {
                      key: "result_set_id",
                      label: "Result set",
                      render: (record) => (
                        <RelationName table="result_sets" id={record["result_set_id"] as string} />
                      ),
                    },
                  ]}
                />
                <ResultsRevision query={results} />
              </Inspector.Group>
            </Shell.Aside>
            <Described label="Assessment determination" text={row.description} />
            <EntitySection
              showHeading
              table="finding_observations"
              links="observations"
              filters={{ finding_id: id }}
              initialValues={{ assessment_results_revision_id: row.assessment_results_revision_id }}
              title="Supporting observations"
              readOnly={readOnly}
              columns={[
                {
                  key: "observation_id",
                  label: "Observation",
                  render: (record) => (
                    <RelationName table="observations" id={record["observation_id"] as string} />
                  ),
                },
              ]}
            />
            <EntitySection
              showHeading
              table="finding_evidence"
              links="evidence_versions"
              filters={{ finding_id: id }}
              title="Evidence citations"
              readOnly={readOnly}
              columns={[
                {
                  key: "evidence_version_id",
                  label: "Evidence version",
                  render: (record) => (
                    <VersionName
                      table="evidence_versions"
                      id={record["evidence_version_id"] as string}
                    />
                  ),
                },
                { key: "claim", label: "Claim" },
                { key: "applicability_rationale", label: "Applicability rationale" },
              ]}
            />
            <EntitySection
              showHeading
              table="finding_risks"
              links="risk_revisions"
              filters={{ finding_id: id }}
              initialValues={{ assessment_results_revision_id: row.assessment_results_revision_id }}
              title="Linked risk assessments"
              readOnly={readOnly}
              columns={[
                {
                  key: "risk_revision_id",
                  label: "Risk assessment",
                  render: (record) => (
                    <VersionName table="risk_revisions" id={record["risk_revision_id"] as string} />
                  ),
                },
              ]}
            />
          </>
        ) : (
          <MissingRecord backTo="/findings" kind="Assessment finding" />
        )}
      </QueryState>
    </Page>
  );
}
export function IssueRecord({ id }: { id: string }) {
  const query = useRow("operational_issues", id);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const row = query.data;
  return (
    <Page>
      <QueryState query={query} shape="record" region>
        {row ? (
          <>
            <PageHeader>
              <RecordTrail current={row.title}>
                <TrailLink to="/findings">Findings & assets</TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{row.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="operational_issues"
                  id={id}
                  onEdit={() => setEditing(row as DataRecord)}
                  editLabel="Edit operational issue"
                />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor
                table="operational_issues"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <Shell.Aside
              label="Operational issue details"
              summary={<StatusBadge statuses={operationalIssueStatuses} value={row.status} />}
            >
              <Inspector.Group title="Details">
                <ModelFacts
                  record={row as DataRecord}
                  table="operational_issues"
                  fields={[
                    { key: "status", label: "Status" },
                    { key: "severity", label: "Severity" },
                    {
                      key: "owner_party_id",
                      label: "Owner",
                      render: (record) => (
                        <RelationName
                          table="parties"
                          id={record["owner_party_id"] as string | null}
                        />
                      ),
                    },
                    { key: "opened_at", label: "Opened" },
                    { key: "closed_at", label: "Closed" },
                    { key: "closure_rationale", label: "Closure rationale" },
                  ]}
                />
              </Inspector.Group>
            </Shell.Aside>
            <Described label="Description" text={row.description} />
            <EntitySection
              showHeading
              table="issue_observations"
              links="observations"
              filters={{ issue_id: id }}
              title="Observations"
              columns={[
                {
                  key: "observation_id",
                  label: "Observation",
                  render: (record) => (
                    <RelationName table="observations" id={record["observation_id"] as string} />
                  ),
                },
              ]}
            />
            <EntitySection
              showHeading
              table="issue_poams"
              links="poam_items"
              filters={{ issue_id: id }}
              title="Remediation items"
              columns={[
                {
                  key: "poam_item_id",
                  label: "Remediation item",
                  render: (record) => (
                    <RelationName table="poam_items" id={record["poam_item_id"] as string} />
                  ),
                },
              ]}
            />
            <EntitySection
              showHeading
              table="task_issues"
              links="tasks"
              filters={{ issue_id: id }}
              title="Tasks"
              columns={[
                {
                  key: "task_id",
                  label: "Task",
                  render: (record) => (
                    <RelationName table="tasks" id={record["task_id"] as string} />
                  ),
                },
              ]}
            />
          </>
        ) : (
          <MissingRecord backTo="/findings" kind="Operational issue" />
        )}
      </QueryState>
    </Page>
  );
}
export function AssetRecord({ id }: { id: string }) {
  const query = useRow("inventory_items", id);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const row = query.data;
  return (
    <Page>
      <QueryState query={query} shape="record" region>
        {row ? (
          <>
            <PageHeader>
              <RecordTrail current={row.name}>
                <TrailLink to="/findings">Findings & assets</TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{row.name}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="inventory_items"
                  id={id}
                  onEdit={() => setEditing(row as DataRecord)}
                  editLabel="Edit inventory item"
                />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor
                table="inventory_items"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <Shell.Aside label="Asset details">
              <Inspector.Group title="Details">
                <ModelFacts
                  record={row as DataRecord}
                  table="inventory_items"
                  fields={[
                    { key: "asset_id", label: "Asset ID" },
                    {
                      key: "system_id",
                      label: "System",
                      render: (record) => (
                        <RelationName table="systems" id={record["system_id"] as string} />
                      ),
                    },
                    { key: "manufacturer", label: "Manufacturer" },
                    { key: "model", label: "Model" },
                    { key: "serial_number", label: "Serial number" },
                  ]}
                />
              </Inspector.Group>
            </Shell.Aside>
            <Described label="Description" text={row.description} />
            <EntitySection
              showHeading
              table="inventory_components"
              filters={{ inventory_item_id: id }}
              initialValues={{ system_id: row.system_id }}
              title="Implemented components"
              columns={[
                {
                  key: "system_component_id",
                  label: "Component",
                  render: (record) => (
                    <RelationName
                      table="system_components"
                      id={record["system_component_id"] as string}
                    />
                  ),
                },
              ]}
            />
          </>
        ) : (
          <MissingRecord backTo="/findings" kind="Asset" />
        )}
      </QueryState>
    </Page>
  );
}
