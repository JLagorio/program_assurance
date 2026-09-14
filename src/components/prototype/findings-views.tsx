import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Button,
  Grid,
  PageHeader,
  Section,
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
        <PageHeader.Title>Findings & assets</PageHeader.Title>
        <PageHeader.Description>
          Trace assessor determinations, operational issues, and the system inventory they concern.
        </PageHeader.Description>
      </PageHeader>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
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
          onOpen={(row) =>
            void navigate({ to: "/findings/$findingId", params: { findingId: row.id } })
          }
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
          onOpen={(row) => void navigate({ to: "/issues/$issueId", params: { issueId: row.id } })}
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
          onOpen={(row) =>
            void navigate({ to: "/findings/assets/$assetId", params: { assetId: row.id } })
          }
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
      <TextLink render={<Link to="/findings" />}>Findings & assets</TextLink>
      <QueryState query={query}>
        {row ? (
          <>
            <PageHeader>
              <div>
                <PageHeader.Title>{row.title}</PageHeader.Title>
                <PageHeader.Description>
                  <StateBadge value={row.determination} />
                </PageHeader.Description>
              </div>
              <PageHeader.Actions>
                {!readOnly && (
                  <Button onClick={() => setEditing(row as DataRecord)}>Edit determination</Button>
                )}
                <InspectLink table="assessment_findings" id={id} />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor
                table="assessment_findings"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <Grid
              gap="space.400"
              templateColumns={{ base: "minmax(0,1fr)", lg: "minmax(0,1fr) 320px" }}
            >
              <Section title="Assessment determination">
                <ModelFacts
                  record={row as DataRecord}
                  fields={[
                    "description",
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
              </Section>
              <Section title="Assessment context">
                <QueryState query={results}>
                  {results.data ? (
                    <ModelFacts
                      record={results.data as DataRecord}
                      fields={["version_number", "state"]}
                    />
                  ) : (
                    <p>
                      The assessment results revision is unavailable. This finding is read-only.
                    </p>
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
                        <RelationName table="result_sets" id={record["result_set_id"] as string} />
                      ),
                    },
                  ]}
                />
              </Section>
            </Grid>
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
          <p>Finding not found.</p>
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
      <TextLink render={<Link to="/findings" />}>Findings & assets</TextLink>
      <QueryState query={query}>
        {row ? (
          <>
            <PageHeader>
              <div>
                <PageHeader.Title>{row.title}</PageHeader.Title>
                <PageHeader.Description>
                  <StateBadge value={row.status} />
                </PageHeader.Description>
              </div>
              <PageHeader.Actions>
                {workspace.role !== "viewer" && (
                  <Button onClick={() => setEditing(row as DataRecord)}>Edit issue</Button>
                )}
                <InspectLink table="operational_issues" id={id} />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor
                table="operational_issues"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <ModelFacts
              record={row as DataRecord}
              fields={[
                "description",
                "severity",
                "opened_at",
                "closed_at",
                "closure_rationale",
                {
                  key: "owner_party_id",
                  label: "Owner",
                  render: (record) => (
                    <RelationName table="parties" id={record["owner_party_id"] as string | null} />
                  ),
                },
              ]}
            />
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
          <p>Issue not found.</p>
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
      <TextLink render={<Link to="/findings" />}>Findings & assets</TextLink>
      <QueryState query={query}>
        {row ? (
          <>
            <PageHeader>
              <PageHeader.Title>{row.name}</PageHeader.Title>
              <PageHeader.Actions>
                {workspace.role !== "viewer" && (
                  <Button onClick={() => setEditing(row as DataRecord)}>Edit asset</Button>
                )}
                <InspectLink table="inventory_items" id={id} />
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <EntityEditor
                table="inventory_items"
                existing={editing}
                onCancel={() => setEditing(null)}
              />
            )}
            <ModelFacts
              record={row as DataRecord}
              fields={[
                "asset_id",
                "description",
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
          <p>Asset not found.</p>
        )}
      </QueryState>
    </Stack>
  );
}
