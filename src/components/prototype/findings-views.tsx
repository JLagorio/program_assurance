import { EmptyMessage, MissingRecord, RecordActions } from "./work-common";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Inspector,
  Button,
  Grid,
  PageHeader,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { useRow } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import type { DataRecord } from "@/lib/records";
import { ObservationsRegister } from "./observations-register";
import {
  EntityEditor,
  EntitySection,
  InspectLink,
  ModelFacts,
  QueryState,
  RelationName,
  StateBadge,
} from "./record-tools";
export function Findings() {
  const [tab, setTab] = useState("issues");
  const navigate = useNavigate();
  return (
    <Stack space="space.200">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Findings & assets</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" aria-label="Findings and asset collections">
          <TabsTrigger value="issues">Operational issues</TabsTrigger>
          <TabsTrigger value="observations">Observations</TabsTrigger>
          <TabsTrigger value="findings">Assessment findings</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "observations" && <ObservationsRegister fill />}
      {tab === "findings" && (
        <EntitySection
          fill
          table="assessment_findings"
          title="Findings"
          columns={[
            { key: "title" },
            { key: "determination" },
            {
              key: "assessor_party_id",
              label: "Assessor",
              render: (row) => (
                <RelationName table="parties" id={row["assessor_party_id"] as string | null} />
              ),
            },
            { key: "determined_at", label: "Determined" },
          ]}
        />
      )}
      {tab === "issues" && (
        <EntitySection
          fill
          table="operational_issues"
          title="Operational issues"
          columns={[
            { key: "title" },
            {
              key: "program_id",
              render: (row) => <RelationName table="programs" id={row["program_id"] as string} />,
            },
            { key: "severity" },
            { key: "status" },
          ]}
        />
      )}
      {tab === "assets" && (
        <EntitySection
          fill
          table="inventory_items"
          title="System assets"
          columns={[
            { key: "asset_id" },
            { key: "name" },
            {
              key: "system_id",
              render: (row) => <RelationName table="systems" id={row["system_id"] as string} />,
            },
            { key: "description" },
          ]}
        />
      )}
    </Stack>
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
    <Stack space="space.250">
      <QueryState query={query}>
        {row ? (
          <>
            <PageHeader>
              <PageHeader.Lead render={<Breadcrumb />}>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/findings" />}>
                      Findings & assets
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{row.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </PageHeader.Lead>
              <PageHeader.Heading>
                <PageHeader.Title>{row.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="assessment_findings"
                  id={id}
                  onEdit={() => setEditing(row as DataRecord)}
                  editLabel="Edit determination"
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
            <>
              <Section title="Assessment determination">
                <p>{row.description || <Absent />}</p>
              </Section>
              <Shell.Aside label="Finding details">
                <Inspector.Group title="Details">
                  <ModelFacts
                    record={row as DataRecord}
                    fields={[
                      "determination",
                      "determined_at",
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
                    ]}
                  />
                  <QueryState query={results}>
                    {results.data ? (
                      <ModelFacts
                        record={results.data as DataRecord}
                        fields={["version_number", "state"]}
                      />
                    ) : (
                      <EmptyMessage
                        compact
                        title="Assessment results unavailable"
                        description="This finding is read-only until its results revision is available."
                      />
                    )}
                  </QueryState>
                  <ModelFacts
                    record={row as DataRecord}
                    fields={[
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
                          <RelationName
                            table="result_sets"
                            id={record["result_set_id"] as string}
                          />
                        ),
                      },
                    ]}
                  />
                </Inspector.Group>
              </Shell.Aside>
            </>
            <EntitySection
              table="finding_observations"
              filters={{ finding_id: id }}
              initialValues={{ assessment_results_revision_id: row.assessment_results_revision_id }}
              title="Supporting observations"
              readOnly={readOnly}
              columns={[
                {
                  key: "observation_id",
                  render: (record) => (
                    <RelationName table="observations" id={record["observation_id"] as string} />
                  ),
                },
              ]}
            />
            <EntitySection
              table="finding_evidence"
              filters={{ finding_id: id }}
              title="Evidence citations"
              readOnly={readOnly}
              columns={[
                {
                  key: "evidence_version_id",
                  render: (record) => (
                    <RelationName
                      table="evidence_versions"
                      id={record["evidence_version_id"] as string}
                    />
                  ),
                },
                { key: "claim" },
                { key: "applicability_rationale" },
              ]}
            />
            <EntitySection
              table="finding_risks"
              filters={{ finding_id: id }}
              initialValues={{ assessment_results_revision_id: row.assessment_results_revision_id }}
              title="Linked risk assessments"
              readOnly={readOnly}
              columns={[
                {
                  key: "risk_revision_id",
                  render: (record) => (
                    <RelationName
                      table="risk_revisions"
                      id={record["risk_revision_id"] as string}
                    />
                  ),
                },
              ]}
            />
          </>
        ) : (
          <MissingRecord backTo="/findings" kind="Finding" />
        )}
      </QueryState>
    </Stack>
  );
}
export function IssueRecord({ id }: { id: string }) {
  const workspace = useWorkspace();
  const query = useRow("operational_issues", id);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const row = query.data;
  return (
    <Stack space="space.250">
      <QueryState query={query}>
        {row ? (
          <>
            <PageHeader>
              <PageHeader.Lead render={<Breadcrumb />}>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/findings" />}>
                      Findings & assets
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{row.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </PageHeader.Lead>
              <PageHeader.Heading>
                <PageHeader.Title>{row.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="operational_issues"
                  id={id}
                  onEdit={() => setEditing(row as DataRecord)}
                  editLabel="Edit issue"
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
            <Section title="Description">
              <p>{row.description || <Absent />}</p>
            </Section>
            <Shell.Aside label="Record details">
              <Inspector.Group title="Details">
                <ModelFacts
                  record={row as DataRecord}
                  fields={[
                    "severity",
                    "opened_at",
                    "closed_at",
                    "closure_rationale",
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
                  ]}
                />
              </Inspector.Group>
            </Shell.Aside>
            <EntitySection
              table="issue_observations"
              filters={{ issue_id: id }}
              title="Issue observations"
              columns={[
                {
                  key: "observation_id",
                  render: (record) => (
                    <RelationName table="observations" id={record["observation_id"] as string} />
                  ),
                },
              ]}
            />
            <EntitySection
              table="issue_poams"
              filters={{ issue_id: id }}
              title="Remediation commitments"
              columns={[
                {
                  key: "poam_item_id",
                  render: (record) => (
                    <RelationName table="poam_items" id={record["poam_item_id"] as string} />
                  ),
                },
              ]}
            />
            <EntitySection
              table="task_issues"
              filters={{ issue_id: id }}
              title="Assigned work"
              columns={[
                {
                  key: "task_id",
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
    </Stack>
  );
}
export function AssetRecord({ id }: { id: string }) {
  const workspace = useWorkspace();
  const query = useRow("inventory_items", id);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const row = query.data;
  return (
    <Stack space="space.250">
      <QueryState query={query}>
        {row ? (
          <>
            <PageHeader>
              <PageHeader.Lead render={<Breadcrumb />}>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/findings" />}>
                      Findings & assets
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{row.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </PageHeader.Lead>
              <PageHeader.Heading>
                <PageHeader.Title>{row.name}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="inventory_items"
                  id={id}
                  onEdit={() => setEditing(row as DataRecord)}
                  editLabel="Edit asset"
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
            <Section title="Description">
              <p>{row.description || <Absent />}</p>
            </Section>
            <Shell.Aside label="Record details">
              <Inspector.Group title="Details">
                <ModelFacts
                  record={row as DataRecord}
                  fields={[
                    "asset_id",
                    {
                      key: "system_id",
                      label: "System",
                      render: (record) => (
                        <RelationName table="systems" id={record["system_id"] as string} />
                      ),
                    },
                    "manufacturer",
                    "model",
                    "serial_number",
                  ]}
                />
              </Inspector.Group>
            </Shell.Aside>
            <EntitySection
              table="inventory_components"
              filters={{ inventory_item_id: id }}
              initialValues={{ system_id: row.system_id }}
              title="Implemented components"
              columns={[
                {
                  key: "system_component_id",
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
    </Stack>
  );
}
