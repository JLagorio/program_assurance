import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Count,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Grid,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { ArrowUpRight, ChevronDown, Pencil } from "lucide-react";
import { useRows, useRow, type Row } from "@/lib/models";
import { displayValue, labelFor, type DataRecord } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import { AssessmentBrowser } from "@/components/prototype/assessment-browser";
import { EvidenceBrowser } from "@/components/prototype/evidence-browser";
import { WorkTable } from "@/components/prototype/work-table";
import { ObservationsRegister } from "./observations-register";
import { RequirementsTable } from "./requirements-table";
import { ProgramSystemsTree } from "./program-systems-tree";
import { ProgramTimeline } from "./program-timeline";
import { ProgramSspAssembly } from "./ssp-assembly";
import type { SystemElement } from "@/lib/system-tree";
import type { RequirementTab } from "./requirement-record";
import {
  ProgramCollection,
  ProgramQueryState,
  ProgramRecordDialog,
  StatusValue,
} from "./program-shared";

export const programTabs = [
  "Overview",
  "System",
  "Library",
  "Requirements",
  "Controls",
  "Assessments",
  "Schedule",
  "Findings",
  "Evidence",
  "POA&M",
  "Risk",
  "Activity",
] as const;
export type ProgramTab = (typeof programTabs)[number];
export function programTab(value: unknown): ProgramTab {
  const text = String(value ?? "").toLowerCase();
  const alias: Record<string, ProgramTab> = {
    systems: "System",
    tasks: "Schedule",
    work: "Schedule",
    team: "Schedule",
    poams: "POA&M",
    requirements: "Requirements",
    assessment: "Assessments",
    risk: "Risk",
  };
  return programTabs.find((tab) => tab.toLowerCase() === text) ?? alias[text] ?? "Overview";
}
export function ProgramWorkspace({
  programId,
  tab = "Overview",
  view,
  requirementId,
  requirementTab,
}: {
  programId: string;
  tab?: ProgramTab | undefined;
  view?: string;
  requirementId?: string | undefined;
  requirementTab?: RequirementTab | undefined;
}) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const query = useRow("programs", programId);
  const systems = useRows("systems", { program_id: programId });
  const componentLinks = useRows("system_component_element_links");
  const requirements = useRows("engineering_requirements", { program_id: programId });
  const tasks = useRows("tasks", { program_id: programId });
  const issues = useRows("operational_issues", { program_id: programId });
  const risks = useRows("risks", { program_id: programId });
  const evidence = useRows("evidence_artifacts", { program_id: programId });
  const assessments = useRows("assessment_campaigns", { program_id: programId });
  const gates = useRows("lifecycle_gates", { program_id: programId });
  const parties = useRows("parties");
  const [editing, setEditing] = useState(false);
  const boundaries = useMemo(
    () =>
      ((systems.data ?? []) as SystemElement[]).filter(
        (system) => system.is_authorization_boundary,
      ),
    [systems.data],
  );
  const systemIds = useMemo(
    () => new Set((systems.data ?? []).map((system) => system.id)),
    [systems.data],
  );
  function select(next: ProgramTab) {
    void navigate({ to: "/programs/$programId", params: { programId }, search: { tab: next } });
  }
  if (!query.data && (query.isPending || query.error))
    return <ProgramQueryState loading={query.isPending} error={query.error} />;
  if (!query.data)
    return (
      <Stack>
        <PageHeader>
          <PageHeader.Title>Program not found</PageHeader.Title>
        </PageHeader>
        <TextLink render={<Link to="/programs" />}>Return to programs</TextLink>
      </Stack>
    );
  const program = query.data;
  const counts: Partial<Record<ProgramTab, number>> = {
    ...(systems.isSuccess && { System: systems.data.length }),
    ...(requirements.isSuccess && { Requirements: requirements.data.length }),
    ...(assessments.isSuccess && { Assessments: assessments.data.length }),
    ...(evidence.isSuccess && { Evidence: evidence.data.length }),
    ...(risks.isSuccess && { Risk: risks.data.length }),
  };
  const openTasks = tasks.data?.filter((task) => !["done", "cancelled"].includes(task.status));
  const openIssues = issues.data?.filter(
    (issue) => !["closed", "resolved", "cancelled"].includes(issue.status),
  );
  const openRisks = risks.data?.filter((risk) => risk.status !== "closed");
  return (
    <>
      <Stack space="space.200" className="min-w-0">
        {query.error && <ProgramQueryState loading={false} error={query.error} />}
        <PageHeader>
          <PageHeader.Lead render={<Breadcrumb />}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <Id>{program.code}</Id>
                </BreadcrumbPage>
              </BreadcrumbItem>
              {view && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{view}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </PageHeader.Lead>
          <div>
            <PageHeader.Title>{view ?? program.name}</PageHeader.Title>
            {view && <p className="text-subtle mt-050">{program.name}</p>}
          </div>
          <PageHeader.Actions>
            {workspace.role !== "viewer" && (
              <Button variant="secondary" iconBefore={<Pencil />} onClick={() => setEditing(true)}>
                Edit program
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />}>Views</Button>} />
              <DropdownMenuContent align="end">
                {(
                  [
                    ["System composition", "/programs/$programId/composition"],
                    ["Configuration baseline", "/programs/$programId/baseline"],
                    ["Traceability matrix", "/programs/$programId/sctm"],
                    ["Inheritance resolution", "/programs/$programId/inheritance"],
                    ["Authorization", "/programs/$programId/authorization"],
                    ["Program dashboard", "/programs/$programId/dashboard"],
                    ["Continuous monitoring", "/programs/$programId/conmon"],
                    ["Scanner ingestion", "/programs/$programId/ingestion"],
                    ["Cyber T&E phases", "/programs/$programId/te-phases"],
                    ["Program transfer", "/programs/$programId/export"],
                  ] as const
                ).map(([label, to]) => (
                  <DropdownMenuItem
                    key={to}
                    onClick={() => void navigate({ to, params: { programId } })}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </PageHeader.Actions>
        </PageHeader>
        <Tabs value={tab} onValueChange={(value) => select(programTab(value))} className="gap-150">
          <TabsList
            variant="line"
            className="w-full justify-start overflow-x-auto"
            aria-label="Program work"
          >
            {programTabs.map((name) => (
              <TabsTrigger key={name} value={name}>
                {name}
                {counts[name] !== undefined && <Count value={counts[name]!} max={9999} />}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tab}>
            <Stack space="space.300" className="min-w-0 pt-200">
              {view ? (
                <ProgramFocusedView
                  programId={programId}
                  view={view}
                  systemIds={systemIds}
                  systemsReady={systems.isSuccess}
                />
              ) : (
                <>
                  {tab === "Overview" && (
                    <>
                      <ProgramQueryState loading={gates.isPending} error={gates.error} />
                      {gates.isSuccess && (
                        <ProgramTimeline
                          gates={gates.data}
                          onOpenSchedule={() => select("Schedule")}
                        />
                      )}
                      <Grid
                        gap="space.100"
                        templateColumns={{
                          base: "minmax(0, 1fr)",
                          sm: "repeat(3, minmax(0, 1fr))",
                        }}
                      >
                        {(
                          [
                            {
                              label: "Open tasks",
                              tab: "Schedule",
                              value: openTasks?.length,
                              loading: tasks.isPending,
                              error: tasks.error,
                            },
                            {
                              label: "Open issues",
                              tab: "Findings",
                              value: openIssues?.length,
                              loading: issues.isPending,
                              error: issues.error,
                            },
                            {
                              label: "Open risks",
                              tab: "Risk",
                              value: openRisks?.length,
                              loading: risks.isPending,
                              error: risks.error,
                            },
                          ] as const
                        ).map((queue) => (
                          <button
                            key={queue.label}
                            type="button"
                            onClick={() => select(queue.tab)}
                            className="flex items-center gap-150 rounded-medium border border-default p-150 hover:bg-neutral-subtle-hovered"
                          >
                            <span className="font-heading-small font-semibold tabular-nums">
                              {queue.loading ? "…" : queue.error ? "Unavailable" : queue.value}
                            </span>
                            <span className="font-body-small">{queue.label}</span>
                            <ArrowUpRight className="ml-auto size-150 text-subtle" />
                          </button>
                        ))}
                      </Grid>
                      <Section title="Program summary">
                        <p className="whitespace-pre-wrap text-subtle">
                          {program.description ?? "No program description recorded."}
                        </p>
                      </Section>
                      <Section
                        title="System boundaries"
                        count={systems.isSuccess ? boundaries.length : undefined}
                        action={
                          <Button variant="subtle" size="small" onClick={() => select("System")}>
                            Open systems
                          </Button>
                        }
                      >
                        <ProgramQueryState loading={systems.isPending} error={systems.error} />
                        {systems.isSuccess &&
                          (boundaries.length ? (
                            <Stack space="space.150">
                              {boundaries.map((system) => (
                                <Inline key={system.id} spread="space-between" alignBlock="center">
                                  <TextLink
                                    render={
                                      <Link
                                        to="/programs/$programId/systems/$scopeId"
                                        params={{ programId, scopeId: system.id }}
                                      />
                                    }
                                  >
                                    {system.code} · {system.name}
                                  </TextLink>
                                  <StatusValue value={system.authorization_status} />
                                </Inline>
                              ))}
                            </Stack>
                          ) : (
                            <p className="text-subtle">
                              Add the systems governed by this program before selecting baselines or
                              recording implementation.
                            </p>
                          ))}
                      </Section>
                      <Section
                        title="Program work"
                        action={
                          <Button size="small" variant="subtle" onClick={() => select("Schedule")}>
                            Open schedule
                          </Button>
                        }
                      >
                        <WorkTable programId={programId} />
                      </Section>
                    </>
                  )}
                  {tab === "System" && <ProgramSystemsTree programId={programId} fill />}
                  {tab === "Library" &&
                    (systems.isSuccess ? (
                      <ProgramCollection
                        name="system_components"
                        fill
                        empty={{ title: "No components yet" }}
                        title="Recorded component references"
                        description="Existing component records retain their implementation links. Open the system tree to add or edit systems and components."
                        where={(row) => systemIds.has(String(row["system_id"]))}
                        columns={[
                          { key: "code", title: "Component" },
                          { key: "name", title: "Name" },
                          { key: "component_type", title: "Type" },
                          { key: "status", title: "Status" },
                          { key: "version", title: "Version" },
                        ]}
                        canCreate={false}
                        readOnly
                        onSelect={(row) => {
                          const elementId = componentLinks.data?.find(
                            (link) => link.id === row.id,
                          )?.system_element_id;
                          if (elementId)
                            void navigate({
                              to: "/programs/$programId/systems/$scopeId",
                              params: { programId, scopeId: elementId },
                            });
                          else
                            void navigate({
                              to: "/programs/$programId/components/$componentId",
                              params: { programId, componentId: row.id },
                            });
                        }}
                      />
                    ) : (
                      <ProgramQueryState loading={systems.isPending} error={systems.error} />
                    ))}
                  {tab === "Requirements" && (
                    <RequirementsTable
                      programId={programId}
                      fill
                      previewId={requirementId}
                      previewTab={requirementTab}
                      onPreview={(id) =>
                        void navigate({
                          to: "/programs/$programId",
                          params: { programId },
                          search: (previous) => ({
                            ...previous,
                            tab: "Requirements",
                            requirementId: id,
                          }),
                          resetScroll: false,
                          replace: !id,
                        })
                      }
                      onPreviewTabChange={(next) =>
                        void navigate({
                          to: "/programs/$programId",
                          params: { programId },
                          search: (previous) => ({
                            ...previous,
                            tab: "Requirements",
                            requirementId,
                            requirementTab: next,
                          }),
                          resetScroll: false,
                        })
                      }
                    />
                  )}
                  {tab === "Controls" && (
                    <ProgramControls
                      programId={programId}
                      systemIds={systemIds}
                      systemsReady={systems.isSuccess}
                    />
                  )}
                  {tab === "Assessments" && <AssessmentBrowser programId={programId} />}
                  {tab === "Schedule" && (
                    <>
                      <WorkTable programId={programId} />
                      <ProgramCollection
                        name="lifecycle_gates"
                        title="Lifecycle gates"
                        filters={{ program_id: programId }}
                        columns={[
                          { key: "title", title: "Gate" },
                          { key: "sequence_number", title: "Sequence" },
                          { key: "status", title: "Status" },
                          { key: "due_on", title: "Due" },
                        ]}
                        createLabel="Add gate"
                      />
                      <ProgramCollection
                        name="program_role_assignments"
                        empty={{ title: "No responsibilities assigned yet" }}
                        title="Program responsibilities"
                        filters={{ program_id: programId }}
                        columns={[
                          {
                            key: "role",
                            title: "Role",
                            render: (row) => labelFor(String(row["role"])),
                          },
                          {
                            key: "party_id",
                            title: "Party",
                            render: (row) =>
                              parties.data?.find((party) => party.id === row["party_id"])?.name ??
                              (parties.isPending ? "Loading…" : "Not available"),
                          },
                          { key: "starts_on", title: "Starts" },
                          { key: "ends_on", title: "Ends" },
                        ]}
                        createLabel="Assign responsibility"
                      />
                    </>
                  )}
                  {tab === "Findings" && (
                    <>
                      <ProgramCollection
                        name="operational_issues"
                        empty={{ title: "No findings yet" }}
                        title="Findings and operational issues"
                        description="Recorded deficiencies are separate from formal assessment determinations."
                        filters={{ program_id: programId }}
                        columns={[
                          { key: "title", title: "Finding" },
                          { key: "status", title: "Status" },
                          { key: "severity", title: "Severity" },
                          { key: "opened_at", title: "Opened" },
                        ]}
                        createLabel="Record finding"
                        onSelect={(row) =>
                          void navigate({ to: "/issues/$issueId", params: { issueId: row.id } })
                        }
                      />
                      <ObservationsRegister programId={programId} />
                    </>
                  )}
                  {tab === "Evidence" && <EvidenceBrowser programId={programId} />}
                  {tab === "POA&M" && <ProgramPoams programId={programId} />}
                  {tab === "Risk" && (
                    <ProgramCollection
                      name="risks"
                      fill
                      title="Risk register"
                      filters={{ program_id: programId }}
                      columns={[
                        { key: "title", title: "Risk" },
                        { key: "status", title: "Status" },
                        { key: "updated_at", title: "Updated" },
                      ]}
                      createLabel="Record risk"
                      onSelect={(row) =>
                        void navigate({ to: "/risks/$riskId", params: { riskId: row.id } })
                      }
                    />
                  )}
                  {tab === "Activity" && (
                    <ProgramCollection
                      name="activity_events"
                      fill
                      empty={{ title: "No activity yet" }}
                      title="Program activity"
                      filters={{ program_id: programId }}
                      columns={[
                        { key: "event_type", title: "Event" },
                        { key: "description", title: "Description" },
                        { key: "occurred_at", title: "Occurred" },
                      ]}
                      canCreate={false}
                    />
                  )}
                </>
              )}
            </Stack>
          </TabsContent>
        </Tabs>
      </Stack>
      {tab === "Overview" && !view && (
        <Shell.Aside label="Program properties">
          <Inspector.Group title="Program">
            <KeyValue label="Status">
              <StatusValue value={program.status} />
            </KeyValue>
            <KeyValue label="Code">{program.code}</KeyValue>
            <KeyValue label="Sponsor">
              {parties.data?.find((party) => party.id === program.sponsor_party_id)?.name ??
                (parties.isPending ? "Loading…" : "Not assigned")}
            </KeyValue>
            <KeyValue label="Starts">{program.starts_on ?? "Not scheduled"}</KeyValue>
            <KeyValue label="Ends">{program.ends_on ?? "Not scheduled"}</KeyValue>
            <KeyValue label="Updated">{new Date(program.updated_at).toLocaleString()}</KeyValue>
          </Inspector.Group>
          <Inspector.Group title="Assurance context">
            <p className="font-body-small text-subtle">
              Categorization, baselines, and authorization are recorded for each system boundary.
            </p>
          </Inspector.Group>
        </Shell.Aside>
      )}
      {editing && (
        <ProgramRecordDialog
          startEditing
          table="programs"
          row={program as DataRecord}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}

export function ProgramRequirements({ programId }: { programId: string }) {
  return <RequirementsTable programId={programId} />;
}
function ProgramControls({
  programId,
  systemsReady,
}: {
  programId: string;
  systemIds: Set<string>;
  systemsReady: boolean;
}) {
  return systemsReady ? (
    <ProgramSspAssembly programId={programId} />
  ) : (
    <ProgramQueryState loading error={null} />
  );
}
function ProgramPoams({ programId }: { programId: string }) {
  const navigate = useNavigate();
  const documents = useRows("poam_documents", { program_id: programId });
  const ids = new Set((documents.data ?? []).map((document) => document.id));
  return (
    <Stack space="space.300">
      <ProgramCollection
        name="poam_documents"
        empty={{ title: "No plans of action yet" }}
        title="Plans of action and milestones"
        filters={{ program_id: programId }}
        columns={[
          { key: "title", title: "Plan" },
          { key: "updated_at", title: "Updated" },
        ]}
        createLabel="Add POA&M plan"
      />
      <ProgramQueryState loading={documents.isPending} error={documents.error} />
      {documents.isSuccess && (
        <ProgramCollection
          name="poam_items"
          empty={{ title: "No remediation items yet" }}
          title="Remediation items"
          where={(row) => ids.has(String(row["poam_document_id"]))}
          initialValues={ids.size === 1 ? { poam_document_id: [...ids][0]! } : undefined}
          columns={[
            { key: "title", title: "Item" },
            { key: "status", title: "Status" },
            { key: "updated_at", title: "Updated" },
          ]}
          createLabel="Add remediation item"
          onSelect={(row) =>
            void navigate({ to: "/register/poam/$poamId", params: { poamId: row.id } })
          }
          canCreate={ids.size > 0}
          prerequisite="Remediation items belong to a plan of action. Add a POA&M plan first."
        />
      )}
    </Stack>
  );
}
function ProgramFocusedView({
  programId,
  view,
  systemIds,
  systemsReady,
}: {
  programId: string;
  view: string;
  systemIds: Set<string>;
  systemsReady: boolean;
}) {
  if (!systemsReady) return <ProgramQueryState loading error={null} />;
  const systemDefault = systemIds.size === 1 ? { system_id: [...systemIds][0]! } : undefined;
  if (view === "System composition") return <ProgramSystemsTree programId={programId} fill />;
  if (view === "Configuration baseline")
    return (
      <ProgramCollection
        name="configuration_baselines"
        fill
        title="Configuration baselines"
        where={(row) => systemIds.has(String(row["system_id"]))}
        initialValues={systemDefault}
        columns={[
          { key: "name", title: "Baseline" },
          { key: "version_number", title: "Version" },
          { key: "state", title: "State" },
          { key: "published_at", title: "Published" },
        ]}
        canCreate={systemIds.size > 0}
        createLabel="Add configuration baseline"
        prerequisite="A configuration baseline belongs to a system. Add a system first."
      />
    );
  if (view === "Authorization")
    return (
      <ProgramCollection
        name="authorization_packages"
        fill
        empty={{ title: "No authorization packages yet" }}
        title="Authorization packages"
        filters={{ program_id: programId }}
        initialValues={systemDefault}
        columns={[
          { key: "title", title: "Package" },
          { key: "updated_at", title: "Updated" },
        ]}
        canCreate={systemIds.size > 0}
        createLabel="Create authorization package"
        prerequisite="An authorization package covers a system. Add a system first."
      />
    );
  if (view === "Traceability matrix")
    return (
      <>
        <ProgramRequirements programId={programId} />
        <ProgramControls programId={programId} systemIds={systemIds} systemsReady={systemsReady} />
      </>
    );
  if (view === "Inheritance resolution")
    return (
      <ProgramCollection
        name="provider_capabilities"
        fill
        empty={{ title: "No provider capabilities yet" }}
        title="Provider capabilities"
        where={(row) => systemIds.has(String(row["providing_system_id"]))}
        initialValues={
          systemIds.size === 1 ? { providing_system_id: [...systemIds][0]! } : undefined
        }
        columns={[
          { key: "code", title: "Capability" },
          { key: "name", title: "Name" },
          { key: "description", title: "Description" },
        ]}
        createLabel="Add provider capability"
      />
    );
  if (view === "Continuous monitoring")
    return (
      <>
        <WorkTable programId={programId} />
        <ProgramCollection
          name="assessment_campaigns"
          empty={{ title: "No monitoring assessments yet" }}
          title="Monitoring assessments"
          filters={{ program_id: programId }}
          columns={[
            { key: "title", title: "Assessment" },
            { key: "status", title: "Status" },
            { key: "starts_at", title: "Starts" },
          ]}
          createLabel="Schedule assessment"
        />
      </>
    );
  if (view === "Scanner ingestion")
    return (
      <ProgramCollection
        name="ingestion_jobs"
        fill
        title="Ingestion jobs"
        filters={{ program_id: programId }}
        columns={[
          { key: "source_uri", title: "Source" },
          { key: "status", title: "Status" },
          { key: "started_at", title: "Started" },
        ]}
        createLabel="Record ingestion job"
      />
    );
  if (view === "Cyber T&E phases") return <AssessmentBrowser programId={programId} />;
  if (view === "Residual risk")
    return (
      <ProgramCollection
        name="risks"
        fill
        title="Risk register"
        filters={{ program_id: programId }}
        columns={[
          { key: "title", title: "Risk" },
          { key: "status", title: "Status" },
        ]}
        createLabel="Record risk"
      />
    );
  return (
    <ProgramControls programId={programId} systemIds={systemIds} systemsReady={systemsReady} />
  );
}
