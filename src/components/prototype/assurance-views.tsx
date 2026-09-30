import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { LibrarySelect } from "./library-shared";
import { EmptyMessage, MissingRecord, RecordActions, VersionName } from "./work-common";
import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Button,
  HeadingLevelProvider,
  Inspector,
  PageHeader,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows, useRow, type Row } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { Page } from "@/components/app/shell";
import { type DataRecord } from "@/lib/records";
import { revisionStates, severityLevels } from "@/lib/status";
import { StatusBadge } from "@/components/app/status";
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
const party = (key = "owner_party_id", label = "Owner"): DisplayColumn => ({
  key,
  label,
  render: (row) => <RelationName table="parties" id={row[key] as string | null} />,
});
const program: DisplayColumn = {
  key: "program_id",
  label: "Program",
  render: (row) => <RelationName table="programs" id={row["program_id"] as string | null} />,
};
const status: DisplayColumn = { key: "status" };
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

export function RiskList({ headingScope = "page" }: { headingScope?: "page" | "section" }) {
  const workspace = useWorkspace(),
    navigate = useNavigate();
  const query = useRows("risks"),
    versions = useRows("risk_revisions");
  const [creating, setCreating] = useState(false);
  const rows = query.data;
  const latest = (id: string) =>
    versions.data
      ?.filter((row) => row.risk_id === id)
      .sort((a, b) => b.version_number - a.version_number)[0];
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
      <ModelTable
        model="risks"
        fill
        rows={asRecords(rows)}
        queries={[query, versions]}
        columns={[
          { key: "title", label: "Risk" },
          // In a narrow register the severity and the status stay beside the risk longest. The
          // program and owner take the width their names need, and the risk the rest.
          { ...program, priority: 3, width: 200 },
          { ...party(), priority: 4, width: 140 },
          {
            key: "severity",
            label: "Latest severity",
            priority: 1,
            // The latest assessment's severity: the column sorts by its rank and filters by it.
            value: (row) => latest(row.id)?.severity ?? null,
            statuses: severityLevels,
          },
          { ...status, priority: 2 },
          { key: "updated_at", label: "Updated", priority: 5 },
        ]}
        empty={{
          title: "No risks yet",
          description:
            "Record a risk when an identified threat or vulnerability requires assessment and treatment.",
          action:
            workspace.role !== "viewer" ? (
              <Button variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
                Create risk
              </Button>
            ) : undefined,
        }}
        searchLabel="Search risks"
        view="risk-register"
        commands={[
          {
            label: "Export risks",
            onSelect: () => downloadJson("risk-register.json", query.data),
            disabled: !query.data,
          },
        ]}
        actions={
          <>
            {workspace.role !== "viewer" && (
              <Button
                size="small"
                variant="primary"
                iconBefore={<Plus />}
                onClick={() => setCreating(true)}
              >
                Create risk
              </Button>
            )}
          </>
        }
      />
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
  const tab = routeTab ?? localTab;
  const select = (next: RiskTab) => {
    setLocalTab(next);
    onTabChange?.(next);
  };
  const record = query.data;
  const assessment =
    versions.data?.find((row) => row.id === selected) ??
    versions.data?.slice().sort((a, b) => b.version_number - a.version_number)[0];
  return (
    <Stack space="space.250">
      <QueryState query={query}>
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
            {tab === "overview" && (
              <Shell.Aside label="Risk details">
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
                          <RelationName table="scopes" id={row["scope_id"] as string | null} />
                        ),
                      },
                    ]}
                  />
                </Inspector.Group>
              </Shell.Aside>
            )}
          </>
        ) : (
          <MissingRecord backTo="/register" kind="Risk" />
        )}
      </QueryState>
    </Stack>
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

export function Register({
  tab: routeTab,
  onTabChange,
}: {
  /** The tab, when the route keeps it in the URL; local otherwise. */
  tab?: RegisterTab | undefined;
  onTabChange?: ((tab: RegisterTab) => void) | undefined;
} = {}) {
  const [localTab, setLocalTab] = useState<RegisterTab>("poam");
  const tab = routeTab ?? localTab;
  const select = (next: RegisterTab) => {
    setLocalTab(next);
    onTabChange?.(next);
  };
  const findings = useRows("assessment_findings"),
    links = useRows("finding_risks");
  const unrolled = findings.data?.filter(
    (row) =>
      !links.data?.some((link) => link.finding_id === row.id) && row.determination !== "satisfied",
  );
  return (
    <Stack space="space.200">
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
              {name === "unrolled" && (
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
                  searchLabel="Search findings"
                />
              )}
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
    </Stack>
  );
}
export function PoamRecord({ id }: { id: string }) {
  const query = useRow("poam_items", id),
    versions = useRows("poam_item_revisions", { poam_item_id: id });
  const [editing, setEditing] = useState<DataRecord | null>(null),
    [selected, setSelected] = useState<string | null>(null);
  const record = query.data;
  const version =
    versions.data?.find((row) => row.id === selected) ??
    versions.data?.slice().sort((a, b) => b.version_number - a.version_number)[0];
  return (
    <Stack space="space.250">
      <QueryState query={query}>
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
            <Shell.Aside label="Remediation item details">
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
                  ]}
                />
                {version && (
                  <LibrarySelect
                    label="Remediation commitment"
                    value={version.id}
                    options={(versions.data ?? []).map((item) => ({
                      value: item.id,
                      label: `Version ${item.version_number}`,
                    }))}
                    onChange={setSelected}
                  />
                )}
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
                { key: "planned_completion_date", label: "Planned" },
                { key: "actual_completion_date", label: "Completed" },
              ]}
            />
            <QueryState query={versions}>
              {version ? (
                <PoamVersion key={version.id} version={version} />
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
    </Stack>
  );
}
function PoamVersion({ version }: { version: Row<"poam_item_revisions"> }) {
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
            { key: "planned_completion_date", label: "Planned" },
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
          { key: "planned_date", label: "Planned" },
          { key: "completed_date", label: "Completed" },
          status,
        ]}
        readOnly={version.state === "published"}
      />
      <EntitySection
        showHeading
        table="poam_item_risks"
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
    <Stack space="space.250">
      <QueryState query={query}>
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
    </Stack>
  );
}
