import { EmptyMessage, MissingRecord, type QueryStatus } from "./work-common";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Absent,
  Badge,
  Button,
  Count,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  HeadingLevelProvider,
  Id,
  Inline,
  Inspector,
  Item,
  KeyValue,
  PageHeader,
  Prose,
  Related,
  Section,
  Shell,
  Skeleton,
  Stack,
  Stat,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { ChevronDown } from "lucide-react";
import { useRows, useRow } from "@/lib/models";
import { useProductLookup } from "@/lib/product-items";
import { labelFor, type DataRecord } from "@/lib/records";
import { authorizationStatuses, programStatuses } from "@/lib/status";
import { StatusBadge } from "@/components/app/status";
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
import { RecordTrail, TrailLink } from "./record-trail";
import { RelationName } from "./record-tools";
import type { SystemElement } from "@/lib/system-tree";
import type { RequirementTab } from "./requirement-record";
import { ProgramCollection, ProgramQueryState, ProgramEditor } from "./program-shared";

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

/**
 * The program's focused views, each a page of its own under the program. A view that repeats a
 * tab ("Cyber T&E phases", the Assessment campaigns tab) or lands back on the Overview (the old
 * dashboard address) is not offered here.
 */
const programViews = [
  ["Configuration baseline", "/programs/$programId/baseline"],
  ["Traceability matrix", "/programs/$programId/sctm"],
  ["Inheritance resolution", "/programs/$programId/inheritance"],
  ["Authorization", "/programs/$programId/authorization"],
  ["Continuous monitoring", "/programs/$programId/conmon"],
  ["Scanner ingestion", "/programs/$programId/ingestion"],
  ["Program transfer", "/programs/$programId/export"],
] as const;

/** A headline count: a skeleton while it loads, an Absent that says so when it cannot. */
function openCount(query: QueryStatus, value: number | undefined): ReactNode {
  if (value !== undefined) return value;
  // The tile's note says why; the value says only that there is no number.
  if (query.isError) return <Absent label="Not available" />;
  return <Skeleton shape="heading" width={40} />;
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
  const programName = `${program.code} · ${program.name}`;
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
  const queues = [
    { label: "Open tasks", query: tasks, value: openTasks?.length },
    { label: "Open issues", query: issues, value: openIssues?.length },
    { label: "Open risks", query: risks, value: openRisks?.length },
  ];
  const canEditProgram = workspace.role !== "viewer";
  const tabLink = (next: ProgramTab) => (
    <Link to="/programs/$programId" params={{ programId }} search={{ tab: next }} />
  );
  return (
    <>
      <Stack space="space.200" className="min-w-0">
        {query.error && <ProgramQueryState queries={[query]} />}
        <PageHeader>
          <RecordTrail current={view ?? programName}>
            <TrailLink to="/programs">Programs</TrailLink>
            {view && (
              <TrailLink to="/programs/$programId" params={{ programId }}>
                {programName}
              </TrailLink>
            )}
          </RecordTrail>
          <PageHeader.Heading>
            <PageHeader.Title>{program.name}</PageHeader.Title>
          </PageHeader.Heading>
          <PageHeader.Actions>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />}>Actions</Button>} />
              <DropdownMenuContent align="end">
                {canEditProgram && (
                  <>
                    <DropdownMenuItem onClick={() => setEditing(true)}>
                      Edit program
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Views</DropdownMenuLabel>
                  {programViews.map(([label, to]) => (
                    <DropdownMenuLinkItem
                      key={to}
                      closeOnClick
                      render={<Link to={to} params={{ programId }} />}
                    >
                      {label}
                    </DropdownMenuLinkItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </PageHeader.Actions>
        </PageHeader>
        {view ? (
          // A focused view is a page under the program, not one of its tabs: the trail leads back.
          <Stack space="space.300" className="min-w-0">
            {view === "Traceability matrix" ? (
              // The SSP register owns its systems read and its failure: no second alert around it.
              <ProgramTraceability programId={programId} />
            ) : (
              <ProgramQueryState queries={[systems]}>
                <ProgramFocusedView
                  programId={programId}
                  view={view}
                  systemIds={systemIds}
                  systemsReady={systems.data !== undefined}
                />
              </ProgramQueryState>
            )}
          </Stack>
        ) : (
          <Tabs
            value={tab}
            onValueChange={(value) => select(programTab(value))}
            className="gap-150"
          >
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
                {tab === "Overview" && (
                  <>
                    {queues.some((queue) => queue.query.isError) && (
                      <ProgramQueryState queries={queues.map((queue) => queue.query)} />
                    )}
                    <Stat.Grid
                      cols={3}
                      role="group"
                      aria-label="Open work"
                      aria-busy={queues.some(
                        (queue) => queue.value === undefined && !queue.query.isError,
                      )}
                    >
                      {queues.map((queue) => (
                        <Stat.Tile
                          key={queue.label}
                          label={queue.label}
                          value={openCount(queue.query, queue.value)}
                          note={
                            queue.value === undefined && queue.query.isError
                              ? "Could not load"
                              : queue.value === 0
                                ? "Nothing open"
                                : undefined
                          }
                        />
                      ))}
                    </Stat.Grid>
                    <ProgramQueryState queries={[gates]}>
                      <ProgramTimeline programId={programId} gates={gates.data ?? []} />
                    </ProgramQueryState>
                    <Section title="Program summary">
                      {program.description ? (
                        <Prose>{program.description}</Prose>
                      ) : (
                        <EmptyMessage
                          compact
                          title="No summary yet"
                          {...(canEditProgram
                            ? { description: "Edit the program to describe its mission and scope." }
                            : {})}
                        />
                      )}
                    </Section>
                    <ProgramQueryState queries={[systems]}>
                      {/* A sibling of the Overview's sections, so it heads its own part of the outline. */}
                      <HeadingLevelProvider level={2}>
                        <Related
                          title="System boundaries"
                          count={boundaries.length}
                          size="default"
                          action={
                            <TextLink size="small" render={tabLink("System")}>
                              Open systems
                            </TextLink>
                          }
                          empty={{
                            title: "No systems yet",
                            description:
                              "Create a system on the System tab before selecting baselines or recording implementation.",
                          }}
                        >
                          {boundaries.map((system) => (
                            <Item
                              key={system.id}
                              id={<Id>{system.code}</Id>}
                              idWidth={104}
                              title={system.name}
                              link={
                                <Link
                                  to="/programs/$programId/systems/$scopeId"
                                  params={{ programId, scopeId: system.id }}
                                />
                              }
                              trailing={
                                <StatusBadge
                                  statuses={authorizationStatuses}
                                  value={system.authorization_status}
                                  size="xsmall"
                                />
                              }
                            />
                          ))}
                        </Related>
                      </HeadingLevelProvider>
                    </ProgramQueryState>
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
                {tab === "Controls" && <ProgramSspAssembly programId={programId} />}
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
                          // Search, sort and the Role filter read the words the cell shows.
                          value: (row) => labelFor(String(row["role"])),
                        },
                        {
                          key: "party_id",
                          title: "Party",
                          value: (row) =>
                            parties.data?.find((party) => party.id === row["party_id"])?.name ??
                            null,
                          render: (row) => (
                            <RelationName
                              table="parties"
                              id={typeof row["party_id"] === "string" ? row["party_id"] : null}
                            />
                          ),
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
                    empty={{
                      title: "No activity yet",
                      description:
                        "Changes to this program's records appear here as the team works.",
                    }}
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
              </Stack>
            </TabsContent>
          </Tabs>
        )}
      </Stack>
      {(tab === "Overview" || !!view) && (
        <Shell.Aside label="Program properties">
          <Inspector.Group title="Details">
            <KeyValue.Group>
              <KeyValue label="Status">
                <StatusBadge statuses={programStatuses} value={program.status} />
              </KeyValue>
              <KeyValue label="Code">
                <Id>{program.code}</Id>
              </KeyValue>
              <KeyValue label="Sponsor">
                <RelationName table="parties" id={program.sponsor_party_id} />
              </KeyValue>
              <KeyValue label="Starts" wrap>
                <DateTime value={program.starts_on} absentLabel="Not recorded" />
              </KeyValue>
              <KeyValue label="Ends" wrap>
                <DateTime value={program.ends_on} absentLabel="Not recorded" />
              </KeyValue>
              <KeyValue label="Updated" wrap>
                <DateTime value={program.updated_at} format="date" />
              </KeyValue>
            </KeyValue.Group>
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
                <KeyValue.Group>
                  {references.data?.length ? (
                    <KeyValue label="Catalog" wrap>
                      {(() => {
                        const catalog = catalogRevisions.data?.find(
                          (row) => row.id === references.data?.[0]?.catalog_revision_id,
                        );
                        const stable = catalogs.data?.find((row) => row.id === catalog?.catalog_id);
                        if (!catalog) return <Absent label="Not recorded" />;
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
                            <Absent key={system.id} label="Not available" />
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
                          <Absent key={choice.id} label="Not available" />
                        );
                      })}
                    </Stack>
                  </KeyValue>
                </KeyValue.Group>
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
/**
 * Requirements, then the SSP's controls. Neither table fills the window: the controls sit below a
 * page of requirements, so the page scrolls to them.
 */
function ProgramTraceability({ programId }: { programId: string }) {
  return (
    <>
      <Section title="Requirements">
        <ProgramRequirements programId={programId} />
      </Section>
      <Section title="Controls">
        <ProgramSspAssembly programId={programId} fill={false} />
      </Section>
    </>
  );
}
function ProgramPoams({ programId }: { programId: string }) {
  const documents = useRows("poam_documents", { program_id: programId });
  const ids = new Set((documents.data ?? []).map((document) => document.id));
  return (
    <Stack space="space.300">
      <ProgramCollection
        name="poam_documents"
        section
        empty={{ title: "No POA&M plans yet" }}
        title="POA&M plans"
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
          prerequisite="Remediation items belong to a POA&M plan. Create a POA&M plan first."
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
        prerequisite="A configuration baseline belongs to a system. Create a system first."
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
        prerequisite="An authorization package covers a system. Create a system first."
      />
    );
  if (view === "Traceability matrix") return <ProgramTraceability programId={programId} />;
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
  return <ProgramSspAssembly programId={programId} />;
}
