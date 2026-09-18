import { EmptyMessage, MissingRecord } from "./work-common";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Absent,
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
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
import { useRows, useRow } from "@/lib/models";
import { useProductLookup } from "@/lib/product-items";
import { displayValue, labelFor, type DataRecord } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import { AssessmentBrowser } from "@/components/prototype/assessment-browser";
import { EvidenceBrowser } from "@/components/prototype/evidence-browser";
import { WorkTable } from "@/components/prototype/work-table";
import { ObservationsRegister } from "./observations-register";
import { RequirementsTable } from "./requirements-table";
import { ProgramSystemsTree } from "./program-systems-tree";
import { ProgramLibrary } from "./program-library";
import { ProgramTimeline } from "./program-timeline";
import { ProgramSspAssembly } from "./ssp-assembly";
import type { SystemElement } from "@/lib/system-tree";
import type { RequirementTab } from "./requirement-record";
import { ProgramCollection, ProgramQueryState, ProgramEditor, StatusValue } from "./program-shared";

export const programTabs = [
  "Overview",
  "System",
  "Library",
  "Requirements",
  "Controls",
  "Assessment campaigns",
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
    assessment: "Assessment campaigns",
    assessments: "Assessment campaigns",
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
  const references = useRows("program_reference_choices", { program_id: programId });
  const products = useProductLookup();
  const variants = useMemo(
    () =>
      (systems.data ?? [])
        .filter((system) => system.is_authorization_boundary && system.product_revision_id)
        .map((system) => ({ system, lineage: products.variant(system) })),
    [systems.data, products],
  );
  const catalogs = useRows("catalogs");
  const catalogRevisions = useRows("catalog_revisions");
  const profiles = useRows("profiles");
  const profileResolutions = useRows("profile_resolutions");
  const profileRevisions = useRows("profile_revisions");
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
    return <ProgramQueryState queries={[query]} />;
  if (!query.data) return <MissingRecord backTo="/programs" kind="Program" />;
  const program = query.data;
  const counts: Partial<Record<ProgramTab, number>> = {
    ...(systems.isSuccess && { System: systems.data.length }),
    ...(requirements.isSuccess && { Requirements: requirements.data.length }),
    ...(assessments.isSuccess && { "Assessment campaigns": assessments.data.length }),
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
        {query.error && <ProgramQueryState queries={[query]} />}
        <PageHeader>
          <PageHeader.Lead render={<Breadcrumb />}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {program.code} · {program.name}
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
          <PageHeader.Heading>
            <PageHeader.Title>{program.name}</PageHeader.Title>
          </PageHeader.Heading>
          <PageHeader.Actions>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />}>Actions</Button>} />
              <DropdownMenuContent align="end">
                {" "}
                {workspace.role !== "viewer" && (
                  <DropdownMenuItem onClick={() => setEditing(true)}>Edit program</DropdownMenuItem>
                )}
                {(
                  [
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
          <TabsList variant="line" aria-label="Program work">
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
                <ProgramQueryState queries={[systems]}>
                  <ProgramFocusedView
                    programId={programId}
                    view={view}
                    systemIds={systemIds}
                    systemsReady={systems.data !== undefined}
                  />
                </ProgramQueryState>
              ) : (
                <>
                  {tab === "Overview" && (
                    <>
                      <ProgramQueryState queries={[gates]} />
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
                          {program.description ?? <Absent />}
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
                        <ProgramQueryState queries={[systems]} />
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
                            <EmptyMessage
                              title="No systems yet"
                              description="Create a system before selecting baselines or recording implementation."
                            />
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
                        <Section title="Tasks">
                          <WorkTable programId={programId} />
                        </Section>
                      </Section>
                    </>
                  )}
                  {tab === "System" && <ProgramSystemsTree programId={programId} fill />}
                  {tab === "Library" && <ProgramLibrary programId={programId} fill />}
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
                    <ProgramQueryState queries={[systems]}>
                      <ProgramControls
                        programId={programId}
                        systemIds={systemIds}
                        systemsReady={systems.data !== undefined}
                      />
                    </ProgramQueryState>
                  )}
                  {tab === "Assessment campaigns" && <AssessmentBrowser programId={programId} />}
                  {tab === "Schedule" && (
                    <>
                      <Section title="Tasks">
                        <WorkTable programId={programId} />
                      </Section>
                      <ProgramCollection
                        name="lifecycle_gates"
                        section
                        title="Lifecycle gates"
                        filters={{ program_id: programId }}
                        columns={[
                          { key: "title", title: "Gate" },
                          { key: "sequence_number", title: "Sequence" },
                          { key: "status", title: "Status" },
                          { key: "due_on", title: "Due" },
                        ]}
                      />
                      <ProgramCollection
                        name="program_role_assignments"
                        section
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
                      />
                    </>
                  )}
                  {tab === "Findings" && (
                    <>
                      <ProgramCollection
                        name="operational_issues"
                        section
                        empty={{ title: "No operational issues yet" }}
                        title="Operational issues"
                        filters={{ program_id: programId }}
                        columns={[
                          { key: "title", title: "Operational issue" },
                          { key: "status", title: "Status" },
                          { key: "severity", title: "Severity" },
                          { key: "opened_at", title: "Opened" },
                        ]}
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
      {(tab === "Overview" || !!view) && (
        <Shell.Aside label="Program properties">
          <Inspector.Group title="Details">
            <KeyValue label="Status">
              <StatusValue value={program.status} />
            </KeyValue>
            <KeyValue label="Code">{program.code}</KeyValue>
            <KeyValue label="Sponsor">
              {parties.data?.find((party) => party.id === program.sponsor_party_id)?.name ??
                (parties.isPending ? "Loading…" : "Not assigned")}
            </KeyValue>
            <KeyValue label="Starts">{program.starts_on ?? <Absent />}</KeyValue>
            <KeyValue label="Ends">{program.ends_on ?? <Absent />}</KeyValue>
            <KeyValue label="Updated">{new Date(program.updated_at).toLocaleString()}</KeyValue>
          </Inspector.Group>
          <Inspector.Group title="References">
            <ProgramQueryState
              queries={[
                references,
                catalogRevisions,
                catalogs,
                profileResolutions,
                profileRevisions,
                profiles,
                ...products.queries,
              ]}
            >
              {references.data?.length || variants.length ? (
                <>
                  {references.data?.length ? (
                    <KeyValue label="Catalog" wrap>
                      {(() => {
                        const catalog = catalogRevisions.data?.find(
                          (row) => row.id === references.data?.[0]?.catalog_revision_id,
                        );
                        const stable = catalogs.data?.find((row) => row.id === catalog?.catalog_id);
                        if (!catalog) return <Absent />;
                        if (!stable && catalogs.isPending) return <Absent />;
                        return (
                          <TextLink
                            render={<Link to="/catalog" search={{ edition: catalog.id }} />}
                          >
                            {stable?.title ?? catalog.title} · {catalog.version}
                          </TextLink>
                        );
                      })()}
                    </KeyValue>
                  ) : null}
                  {variants.length ? (
                    <KeyValue label="Products" wrap>
                      <Stack space="space.050">
                        {variants.map(({ system, lineage }) =>
                          lineage ? (
                            <TextLink
                              key={system.id}
                              render={
                                <Link
                                  to="/library/products/$productKey"
                                  params={{ productKey: lineage.product.id }}
                                  search={{ version: lineage.revision.id }}
                                />
                              }
                            >
                              {lineage.label}
                            </TextLink>
                          ) : (
                            <span key={system.id} className="text-subtle">
                              <Absent />
                            </span>
                          ),
                        )}
                      </Stack>
                    </KeyValue>
                  ) : null}
                  <KeyValue label="Program profiles" wrap>
                    <Stack space="space.050">
                      {(references.data ?? []).map((choice) => {
                        const resolution = profileResolutions.data?.find(
                          (row) => row.id === choice.profile_resolution_id,
                        );
                        const revision = profileRevisions.data?.find(
                          (row) => row.id === resolution?.profile_revision_id,
                        );
                        const layered = !!resolution?.base_profile_resolution_id;
                        const record = profiles.data?.find(
                          (row) => row.id === revision?.profile_id,
                        );
                        if (revision && !record && profiles.isPending)
                          return (
                            <span key={choice.id} className="text-subtle">
                              <Absent />
                            </span>
                          );
                        return revision ? (
                          <Inline key={choice.id} space="space.075" alignBlock="center" shouldWrap>
                            <TextLink
                              render={
                                <Link
                                  to="/profiles/$profileId"
                                  params={{ profileId: revision.profile_id }}
                                />
                              }
                            >
                              {record?.title ?? revision.title} · {revision.version}
                            </TextLink>
                            {layered && (
                              <Badge size="xsmall" variant="secondary" tone="information">
                                Tailored
                              </Badge>
                            )}
                          </Inline>
                        ) : (
                          <span key={choice.id} className="text-subtle">
                            <Absent />
                          </span>
                        );
                      })}
                    </Stack>
                  </KeyValue>
                </>
              ) : (
                <Empty size="compact">
                  <EmptyHeader>
                    <EmptyTitle>No references recorded</EmptyTitle>
                    <EmptyDescription>
                      A program made outside the setup flow records no catalog or profile choice.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </ProgramQueryState>
          </Inspector.Group>
        </Shell.Aside>
      )}
      {editing && (
        <ProgramEditor
          table="programs"
          existing={program as DataRecord}
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
  return systemsReady ? <ProgramSspAssembly programId={programId} /> : null;
}
function ProgramPoams({ programId }: { programId: string }) {
  const navigate = useNavigate();
  const documents = useRows("poam_documents", { program_id: programId });
  const ids = new Set((documents.data ?? []).map((document) => document.id));
  return (
    <Stack space="space.300">
      <ProgramCollection
        name="poam_documents"
        section
        empty={{ title: "No plans of action yet" }}
        title="Plans of action and milestones"
        filters={{ program_id: programId }}
        columns={[
          { key: "title", title: "Plan" },
          { key: "updated_at", title: "Updated" },
        ]}
      />
      <ProgramQueryState queries={[documents]} />
      {documents.isSuccess && (
        <ProgramCollection
          name="poam_items"
          section
          empty={{ title: "No remediation items yet" }}
          title="Remediation items"
          where={(row) => ids.has(String(row["poam_document_id"]))}
          initialValues={ids.size === 1 ? { poam_document_id: [...ids][0]! } : undefined}
          columns={[
            { key: "title", title: "Item" },
            { key: "status", title: "Status" },
            { key: "updated_at", title: "Updated" },
          ]}
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
  if (!systemsReady) return null;
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
        prerequisite="An authorization package covers a system. Add a system first."
      />
    );
  if (view === "Traceability matrix")
    return (
      <>
        <Section title="Requirements">
          <ProgramRequirements programId={programId} />
        </Section>
        <Section title="Controls">
          <ProgramControls
            programId={programId}
            systemIds={systemIds}
            systemsReady={systemsReady}
          />
        </Section>
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
      />
    );
  if (view === "Continuous monitoring")
    return (
      <>
        <Section title="Tasks">
          <WorkTable programId={programId} />
        </Section>
        <ProgramCollection
          name="assessment_campaigns"
          section
          empty={{ title: "No monitoring assessments yet" }}
          title="Monitoring assessments"
          filters={{ program_id: programId }}
          columns={[
            { key: "title", title: "Assessment" },
            { key: "status", title: "Status" },
            { key: "starts_at", title: "Starts" },
          ]}
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
      />
    );
  return (
    <ProgramControls programId={programId} systemIds={systemIds} systemsReady={systemsReady} />
  );
}
