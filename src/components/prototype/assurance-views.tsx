import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Button,
  Grid,
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

export function RiskList() {
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
      <PageHeader>
        <PageHeader.Title>Risk register</PageHeader.Title>
      </PageHeader>
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
            onOpen={(row) => void navigate({ to: "/risks/$riskId", params: { riskId: row.id } })}
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
            actions={
              <>
                <Button
                  size="small"
                  iconBefore={<Download />}
                  disabled={!query.data}
                  onClick={() => downloadJson("risk-register.json", query.data)}
                >
                  Export
                </Button>
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
      <TextLink render={<Link to="/register" />}>POA&M & risk register</TextLink>
      <QueryState query={query}>
        {record ? (
          <>
            <PageHeader>
              <div>
                <PageHeader.Title>{record.title}</PageHeader.Title>
                <PageHeader.Description>
                  <StateBadge value={record.status} />
                </PageHeader.Description>
              </div>
              <PageHeader.Actions>
                {workspace.role !== "viewer" && (
                  <Button onClick={() => setEditing(record as DataRecord)}>Edit risk</Button>
                )}
                <InspectLink table="risks" id={id} />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor table="risks" existing={editing} onCancel={() => setEditing(null)} />
            )}
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
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
              <Grid
                gap="space.400"
                templateColumns={{ base: "minmax(0,1fr)", lg: "minmax(0,1fr) 320px" }}
              >
                <Section title="Risk context">
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
                </Section>
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
                      <p className="text-subtle">No risk assessment has been recorded.</p>
                    )}
                  </QueryState>
                </Section>
              </Grid>
            )}
            {tab === "assessments" && (
              <EntitySection
                table="risk_revisions"
                filters={{ risk_id: id }}
                title="Risk assessments"
                columns={[...versionColumns, { key: "severity" }]}
                onOpen={(row) => {
                  setSelected(row.id);
                  setTab("responses");
                }}
              />
            )}
            {tab === "responses" && (
              <QueryState query={versions}>
                {assessment ? (
                  <Stack space="space.250">
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
                  <p>Create an assessment version before recording its response.</p>
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
                  <p>No assessment evidence is recorded.</p>
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
          <p>Risk not found in this workspace.</p>
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
    <Button onClick={() => setEditing(row as DataRecord)}>Edit assessment</Button>
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
        <PageHeader.Title>POA&M & risk register</PageHeader.Title>
        <PageHeader.Actions>
          <Button
            iconBefore={<Download />}
            disabled={!items.data}
            onClick={() => downloadJson("poam-register.json", items.data)}
          >
            Export POA&M records
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
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
          onOpen={(row) =>
            void navigate({ to: "/register/poam/$poamId", params: { poamId: row.id } })
          }
        />
      )}
      {tab === "risks" && <RiskList />}
      {tab === "unrolled" && (
        <QueryState query={findings}>
          <QueryState query={links}>
            <ModelTable
              fill
              rows={asRecords(unrolled)}
              columns={[{ key: "title" }, { key: "determination" }, { key: "determined_at" }]}
              onOpen={(row) =>
                void navigate({ to: "/findings/$findingId", params: { findingId: row.id } })
              }
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
          onOpen={(row) =>
            void navigate({ to: "/poam-documents/$documentId", params: { documentId: row.id } })
          }
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
      <TextLink render={<Link to="/register" />}>POA&M & risk register</TextLink>
      <QueryState query={query}>
        {record ? (
          <>
            <PageHeader>
              <div>
                <PageHeader.Title>{record.title}</PageHeader.Title>
                <PageHeader.Description>
                  <StateBadge value={record.status} />
                </PageHeader.Description>
              </div>
              <PageHeader.Actions>
                {workspace.role !== "viewer" && (
                  <Button onClick={() => setEditing(record as DataRecord)}>Edit commitment</Button>
                )}
                <InspectLink table="poam_items" id={id} />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor
                table="poam_items"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <ModelFacts
              record={record as DataRecord}
              fields={[
                party(),
                "status",
                {
                  key: "poam_document_id",
                  label: "Document",
                  render: (row) => (
                    <RelationName table="poam_documents" id={row["poam_document_id"] as string} />
                  ),
                },
              ]}
            />
            <EntitySection
              table="poam_item_revisions"
              filters={{ poam_item_id: id }}
              initialValues={{ poam_document_id: record.poam_document_id }}
              title="Remediation plan versions"
              columns={[
                ...versionColumns,
                { key: "planned_completion_date" },
                { key: "actual_completion_date" },
              ]}
              onOpen={(row) => setSelected(row.id)}
            />
            <QueryState query={versions}>
              {version ? (
                <PoamVersion key={version.id} version={version} />
              ) : (
                <p>No remediation plan version has been recorded.</p>
              )}
            </QueryState>
          </>
        ) : (
          <p>POA&M item not found.</p>
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
            <Button onClick={() => setEditing(version as DataRecord)}>Edit plan</Button>
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
  const [revision, setRevision] = useState<DataRecord | null>(null);
  return (
    <Stack space="space.250">
      <TextLink render={<Link to="/register" />}>POA&M register</TextLink>
      <QueryState query={query}>
        {query.data ? (
          <>
            <PageHeader>
              <PageHeader.Title>{query.data.title}</PageHeader.Title>
            </PageHeader>
            <EntitySection
              table="poam_revisions"
              filters={{ poam_document_id: id }}
              title="Document revisions"
              columns={versionColumns}
              onOpen={setRevision}
            />
            {revision && (
              <Stack space="space.200">
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
                {revision["state"] === "draft" && workspace.role !== "viewer" && (
                  <EntityEditor
                    table="poam_revisions"
                    existing={revision}
                    onCancel={() => setRevision(null)}
                  />
                )}
              </Stack>
            )}
          </>
        ) : (
          <p>Document not found.</p>
        )}
      </QueryState>
    </Stack>
  );
}
