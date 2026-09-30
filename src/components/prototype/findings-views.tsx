import {
  EmptyMessage,
  MissingRecord,
  RecordActions,
  VersionName,
  type QueryStatus,
} from "./work-common";
import { useMemo, useState } from "react";
import {
  Absent,
  Inspector,
  KeyValue,
  PageHeader,
  Prose,
  Shell,
  Skeleton,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  VisuallyHidden,
} from "@ledger/design-system";
import { useRow, useRows, type Row } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { Page } from "@/components/app/shell";
import type { DataRecord } from "@/lib/records";
import { ObservationsRegister } from "./observations-register";
import { RecordTrail, TrailLink } from "./record-trail";
import { EntityEditor, EntitySection, ModelFacts, QueryState, RelationName } from "./record-tools";

/** Authored text under its name, keeping its line breaks; a labelled Absent when there is none. */
function Described({ label, text }: { label: string; text: string | null | undefined }) {
  return (
    <Prose label={label} className="max-w-layout-measure">
      {text?.trim() ? text : <Absent label="Not recorded" />}
    </Prose>
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
  // The assessors by name, so the Assessor column sorts, filters and searches by who they are.
  const parties = useRows("parties", undefined, { columns: ["id", "name"] });
  const partyNames = useMemo(
    () => new Map((parties.data ?? []).map((party) => [party.id, party.name])),
    [parties.data],
  );
  const tab = routeTab ?? localTab;
  const setTab = (next: FindingsTab) => {
    setLocalTab(next);
    onTabChange?.(next);
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
        {/* Each register keeps its search, filters, sort and page while another tab is open. */}
        <TabsContent value="issues" keepMounted className="pt-200">
          <EntitySection
            fill
            table="operational_issues"
            title="Operational issues"
            description="An operational issue tracks a problem found in operation until it is closed."
            columns={[
              // On a phone the status stays beside the name, then the severity.
              { key: "title", label: "Operational issue" },
              {
                key: "program_id",
                label: "Program",
                priority: 3,
                render: (row) => <RelationName table="programs" id={row["program_id"] as string} />,
              },
              { key: "severity", label: "Severity", priority: 2, width: 120 },
              { key: "status", label: "Status", priority: 1, width: 120 },
            ]}
          />
        </TabsContent>
        <TabsContent value="observations" keepMounted className="pt-200">
          <ObservationsRegister fill />
        </TabsContent>
        <TabsContent value="findings" keepMounted className="pt-200">
          <EntitySection
            fill
            table="assessment_findings"
            title="Assessment findings"
            description="An assessment finding records a determination against a control statement or objective in an assessment's results."
            columns={[
              { key: "title", label: "Assessment finding" },
              { key: "determination", label: "Determination", priority: 1, width: 150 },
              {
                key: "assessor_party_id",
                label: "Assessor",
                kind: "person",
                value: (row) =>
                  typeof row["assessor_party_id"] === "string"
                    ? (partyNames.get(row["assessor_party_id"]) ?? null)
                    : null,
              },
              { key: "determined_at", label: "Determined" },
            ]}
            queries={[parties]}
          />
        </TabsContent>
        <TabsContent value="assets" keepMounted className="pt-200">
          <EntitySection
            fill
            table="inventory_items"
            title="System assets"
            description="An asset is a hardware or software item in a system's inventory."
            columns={[
              { key: "asset_id", label: "Asset ID" },
              { key: "name", label: "Asset" },
              {
                key: "system_id",
                label: "System",
                render: (row) => <RelationName table="systems" id={row["system_id"] as string} />,
              },
              { key: "description", label: "Description" },
            ]}
          />
        </TabsContent>
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
    <Stack space="space.250">
      <QueryState query={query} shape="record">
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
            <Described label="Assessment determination" text={row.description} />
            <Shell.Aside label="Assessment finding details">
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
            <EntitySection
              showHeading
              table="finding_observations"
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
    </Stack>
  );
}
export function IssueRecord({ id }: { id: string }) {
  const query = useRow("operational_issues", id);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const row = query.data;
  return (
    <Stack space="space.250">
      <QueryState query={query} shape="record">
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
            <Described label="Description" text={row.description} />
            <Shell.Aside label="Operational issue details">
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
            <EntitySection
              showHeading
              table="issue_observations"
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
    </Stack>
  );
}
export function AssetRecord({ id }: { id: string }) {
  const query = useRow("inventory_items", id);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  const row = query.data;
  return (
    <Stack space="space.250">
      <QueryState query={query} shape="record">
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
            <Described label="Description" text={row.description} />
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
    </Stack>
  );
}
