import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { LibrarySelect } from "./library-shared";
import { EmptyMessage, MissingRecord, RecordActions } from "./work-common";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Inspector,
  Button,
  Grid,
  Heading,
  Inline,
  PageHeader,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { Download, Plus } from "lucide-react";
import { useRows, useRow, type Row } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { labelFor, type DataRecord } from "@/lib/records";
import {
  downloadJson,
  EntityEditor,
  EntitySection,
  InspectLink,
  ModelFacts,
  ModelTable,
  QueryState,
  RelationName,
  StateBadge,
  type DisplayColumn,
} from "./record-tools";
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
    <Stack space="space.200">
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
          onSaved={(row) => void navigate({ to: "/risks/$riskId", params: { riskId: row.id } })}
        />
      )}
      <QueryState query={query}>
        <QueryState query={versions}>
          <ModelTable
            model="risks"
            fill
            rows={asRecords(rows)}
            columns={[
              { key: "title", label: "Risk" },
              program,
              party(),
              {
                key: "severity",
                label: "Latest severity",
                render: (row) => <StateBadge value={latest(row.id)?.severity} />,
              },
              status,
              { key: "updated_at", label: "Updated" },
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
        </QueryState>
      </QueryState>
    </Stack>
  );
}
export function RiskRecord({ id }: { id: string }) {
  const workspace = useWorkspace();
  const query = useRow("risks", id),
    versions = useRows("risk_revisions", { risk_id: id });
  const [editing, setEditing] = useState<DataRecord | null>(null),
    [tab, setTab] = useState("overview"),
    [selected, setSelected] = useState<string | null>(null);
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
              <PageHeader.Lead render={<Breadcrumb />}>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/register" />}>
                      POA&M & risk register
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{record.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </PageHeader.Lead>
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
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList variant="line" aria-label="Risk sections">
                {["overview", "assessments", "responses", "evidence", "work", "activity"].map(
                  (value) => (
                    <TabsTrigger key={value} value={value}>
                      {labelFor(value)}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
            </Tabs>
            {tab === "overview" && (
              <>
                <Shell.Aside label="Risk details">
                  <Inspector.Group title="Details">
                    <ModelFacts
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
                <Section title="Latest assessment">
                  <QueryState query={versions}>
                    {assessment ? (
                      <ModelFacts
                        record={assessment as DataRecord}
                        fields={[
                          "version_number",
                          "state",
                          "threat",
                          "vulnerability",
                          "likelihood",
                          "impact",
                          "severity",
                          "assessment_rationale",
                          "assessed_at",
                        ]}
                      />
                    ) : (
                      <EmptyMessage title="No risk assessment has been recorded" />
                    )}
                  </QueryState>
                </Section>
              </>
            )}
            {tab === "assessments" && (
              <EntitySection
                table="risk_revisions"
                filters={{ risk_id: id }}
                title="Risk assessments"
                columns={[...versionColumns, { key: "severity" }]}
              />
            )}
            {tab === "responses" && (
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
                    <Section title={`Assessment version ${assessment.version_number}`}>
                      <ModelFacts
                        record={assessment as DataRecord}
                        fields={[
                          "state",
                          "description",
                          "threat",
                          "vulnerability",
                          "likelihood",
                          "impact",
                          "severity",
                          "assessment_rationale",
                        ]}
                      />
                      <Box paddingBlockStart="space.150">
                        <AssessmentEditor row={assessment} />
                      </Box>
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
                        { key: "due_at" },
                        { key: "approved_at" },
                      ]}
                      readOnly={assessment.state === "published"}
                    />
                    <EntitySection
                      table="risk_observations"
                      filters={{ risk_revision_id: assessment.id }}
                      title="Supporting observations"
                      showHeading
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
                  </Stack>
                ) : (
                  <EmptyMessage
                    title="No assessment version"
                    description="Create an assessment version before recording its response."
                  />
                )}
              </QueryState>
            )}
            {tab === "evidence" && (
              <QueryState query={versions}>
                {assessment ? (
                  <EntitySection
                    table="risk_observations"
                    filters={{ risk_revision_id: assessment.id }}
                    title="Observation traceability"
                    columns={[
                      {
                        key: "observation_id",
                        render: (row) => (
                          <RelationName table="observations" id={row["observation_id"] as string} />
                        ),
                      },
                    ]}
                    readOnly={assessment.state === "published"}
                  />
                ) : (
                  <EmptyMessage title="No assessment evidence is recorded" />
                )}
              </QueryState>
            )}
            {tab === "work" && (
              <EntitySection
                table="task_risks"
                filters={{ risk_id: id }}
                title="Risk work"
                columns={[
                  {
                    key: "task_id",
                    render: (row) => <RelationName table="tasks" id={row["task_id"] as string} />,
                  },
                ]}
              />
            )}
            {tab === "activity" && (
              <EntitySection
                table="activity_events"
                filters={{ risk_id: id }}
                title="Activity"
                columns={[{ key: "event_type" }, { key: "description" }, { key: "occurred_at" }]}
                readOnly
              />
            )}
          </>
        ) : (
          <MissingRecord backTo="/register" kind="Risk" />
        )}
      </QueryState>
    </Stack>
  );
}
function AssessmentEditor({ row }: { row: Row<"risk_revisions"> }) {
  const workspace = useWorkspace();
  const [editing, setEditing] = useState<DataRecord | null>(null);
  return editing ? (
    <EntityEditor table="risk_revisions" existing={editing} onCancel={() => setEditing(null)} />
  ) : workspace.role !== "viewer" && row.state === "draft" ? (
    <Button onClick={() => setEditing(row as DataRecord)}>Edit risk assessment</Button>
  ) : null;
}
export function Register() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("poam");
  const items = useRows("poam_items"),
    findings = useRows("assessment_findings"),
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
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" aria-label="POA&M and risk collections">
          <TabsTrigger value="poam">POA&M</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="unrolled">Unrolled findings</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "poam" && (
        <EntitySection
          fill
          table="poam_items"
          title="POA&M items"
          columns={[
            { key: "title" },
            status,
            party(),
            {
              key: "poam_document_id",
              label: "Document",
              render: (row) => (
                <RelationName table="poam_documents" id={row["poam_document_id"] as string} />
              ),
            },
          ]}
        />
      )}
      {tab === "risks" && <RiskList headingScope="section" />}
      {tab === "unrolled" && (
        <QueryState query={findings}>
          <QueryState query={links}>
            <ModelTable
              model="assessment_findings"
              fill
              rows={asRecords(unrolled)}
              columns={[{ key: "title" }, { key: "determination" }, { key: "determined_at" }]}
              empty={{
                illustration: "done",
                title: "Nothing unrolled",
                description: "No unresolved finding is awaiting a recorded risk relationship.",
              }}
              searchLabel="Search findings"
            />
          </QueryState>
        </QueryState>
      )}
      {tab === "documents" && (
        <EntitySection
          fill
          table="poam_documents"
          title="POA&M documents"
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
    </Stack>
  );
}
export function PoamRecord({ id }: { id: string }) {
  const workspace = useWorkspace();
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
              <PageHeader.Lead render={<Breadcrumb />}>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/register" />}>
                      POA&M & risk register
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{record.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </PageHeader.Lead>
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
            <Shell.Aside label="Record details">
              <Inspector.Group title="Details">
                <ModelFacts
                  record={record as DataRecord}
                  fields={[
                    party(),
                    "status",
                    {
                      key: "poam_document_id",
                      label: "Document",
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
                    label="Remediation plan version"
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
              title="Remediation plan versions"
              columns={[
                ...versionColumns,
                { key: "planned_completion_date" },
                { key: "actual_completion_date" },
              ]}
            />
            <QueryState query={versions}>
              {version ? (
                <>
                  <PoamVersion key={version.id} version={version} />
                </>
              ) : (
                <EmptyMessage title="No remediation plan version has been recorded" />
              )}
            </QueryState>
          </>
        ) : (
          <MissingRecord backTo="/register" kind="POA&M commitment" />
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
        title={`Remediation plan · version ${version.version_number}`}
        action={
          canEdit ? (
            <Button onClick={() => setEditing(version as DataRecord)}>
              Edit remediation commitment
            </Button>
          ) : (
            <StateBadge value={version.state} />
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
          record={version as DataRecord}
          fields={[
            "description",
            "remediation_plan",
            "resources",
            "planned_completion_date",
            "actual_completion_date",
            "completion_rationale",
          ]}
        />
      </Section>
      <EntitySection
        showHeading
        table="poam_milestones"
        filters={{ poam_item_revision_id: version.id }}
        title="Milestones"
        columns={[
          { key: "sequence_number" },
          { key: "title" },
          party(),
          { key: "planned_date" },
          { key: "completed_date" },
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
              <RelationName table="risk_revisions" id={row["risk_revision_id"] as string} />
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
              <PageHeader.Lead render={<Breadcrumb />}>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/register" />}>
                      POA&M & risk register
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{query.data.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </PageHeader.Lead>
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
            <Shell.Aside label="POA&M document details">
              <Inspector.Group title="Details">
                <ModelFacts
                  record={query.data as DataRecord}
                  fields={[program, "description", "created_at", "updated_at"]}
                />
              </Inspector.Group>
            </Shell.Aside>
            <EntitySection
              showHeading
              table="poam_revisions"
              filters={{ poam_document_id: id }}
              title="Document revisions"
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
                <Stack space="space.200">
                  <ModelFacts
                    record={revision}
                    fields={["version_number", "state", "published_at"]}
                  />
                  <EntitySection
                    table="poam_revision_items"
                    filters={{ poam_revision_id: revision.id }}
                    initialValues={{ poam_document_id: id }}
                    title="Included commitment versions"
                    columns={[
                      {
                        key: "poam_item_revision_id",
                        render: (row) => (
                          <RelationName
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
              </RecordPreviewPanel>
            )}
          </>
        ) : (
          <MissingRecord backTo="/register" kind="POA&M document" />
        )}
      </QueryState>
    </Stack>
  );
}
