import { DueDate, EmptyMessage, MissingRecord, type QueryStatus } from "./work-common";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  Stack,
  Stat,
  Tabs,
  TabsList,
  TabsTrigger,
  TextLink,
  DataTable,
  defineColumns,
} from "@ledger/design-system";
import { ChevronDown } from "lucide-react";
import { useRows, useRow, type Row } from "@/lib/models";
import { useProductLookup } from "@/lib/product-items";
import { labelFor, type DataRecord } from "@/lib/records";
import {
  authorizationStatuses,
  programStatuses,
  riskLevels,
  riskStatuses,
  severityLevels,
  statusEntry,
} from "@/lib/status";
import { LevelIndicator, StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { Page } from "@/components/app/shell";
import { AssessmentBrowser } from "@/components/prototype/assessment-browser";
import type { AssessmentKind } from "@/components/prototype/assessment-tabs";
import { EvidenceBrowser } from "@/components/prototype/evidence-browser";
import { WorkTable } from "@/components/prototype/work-table";
import { ObservationsRegister } from "./observations-register";
import { RequirementsTable } from "./requirements-table";
import { ProgramSystemsTree } from "./program-systems-tree";
import { ProgramLibrary } from "./program-library";
import { ProgramTimeline } from "./program-timeline";
import { ProgramActivity } from "./program-activity";
import { ProgramSspAssembly } from "./ssp-assembly";
import { RecordTrail, TrailLink } from "./record-trail";
import { RelationName } from "./record-tools";
import { ProductCollection } from "./product-collection";
import { useCollectionTable } from "./collection-question";
import { RecordLink, recordDestination } from "./record-preview";
import type { SystemElement } from "@/lib/system-tree";
import type { RequirementTab } from "./requirement-record";
import {
  ProgramCollection,
  ProgramQueryState,
  ProgramEditor,
  RetainedTabPanels,
} from "./program-shared";

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
  "POA&M & risk",
] as const;
export type ProgramTab = (typeof programTabs)[number];
/** Tab names the program no longer has, which still reach their content's tab. */
export type RetiredProgramTab = "POA&M" | "Risk" | "Activity";
/**
 * The tab an address names. A retired tab lands where its content went: POA&M and Risk in POA&M &
 * risk, Activity on the Overview, whose activity Timeline it now is; anything else is Overview.
 */
export function programTab(value: unknown): ProgramTab {
  const text = String(value ?? "").toLowerCase();
  const alias: Record<string, ProgramTab> = {
    systems: "System",
    tasks: "Schedule",
    work: "Schedule",
    team: "Schedule",
    "poa&m": "POA&M & risk",
    poam: "POA&M & risk",
    poams: "POA&M & risk",
    risk: "POA&M & risk",
    risks: "POA&M & risk",
    activity: "Overview",
    requirements: "Requirements",
    assessment: "Assessment campaigns",
    assessments: "Assessment campaigns",
  };
  return programTabs.find((tab) => tab.toLowerCase() === text) ?? alias[text] ?? "Overview";
}

/**
 * The program's focused views, each a page of its own under the program that shows what its name
 * says. A view that repeats a tab ("Cyber T&E phases", the Assessment campaigns tab) or lands back
 * on the Overview (the old dashboard address) is not offered here.
 */
const programViews = [
  ["Configuration baseline", "/programs/$programId/baseline"],
  ["Traceability matrix", "/programs/$programId/sctm"],
  ["Inheritance resolution", "/programs/$programId/inheritance"],
  ["Authorization", "/programs/$programId/authorization"],
  ["Residual risk", "/programs/$programId/risk"],
  ["Continuous monitoring", "/programs/$programId/conmon"],
  ["Scanner ingestion", "/programs/$programId/ingestion"],
  ["Program transfer", "/programs/$programId/export"],
] as const;

export function ProgramWorkspace({
  programId,
  tab: tabName = "Overview",
  view,
  requirementId,
  requirementTab,
  assessmentTab,
}: {
  programId: string;
  /** The tab; a retired name shows the tab its content moved to. */
  tab?: ProgramTab | RetiredProgramTab | undefined;
  view?: string;
  requirementId?: string | undefined;
  requirementTab?: RequirementTab | undefined;
  /** The Assessment campaigns tab's own tab, which the address keeps. */
  assessmentTab?: AssessmentKind | undefined;
}) {
  const tab = programTab(tabName);
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const query = useRow("programs", programId);
  const systems = useRows("systems", { program_id: programId });
  // What the tab strip counts and the Overview's open work reads: ids and statuses, not records.
  const requirements = useRows(
    "engineering_requirements",
    { program_id: programId },
    { columns: ["id"] },
  );
  const tasks = useRows("tasks", { program_id: programId }, { columns: ["id", "status"] });
  const issues = useRows(
    "operational_issues",
    { program_id: programId },
    { columns: ["id", "status"] },
  );
  const risks = useRows("risks", { program_id: programId }, { columns: ["id", "status"] });
  const evidence = useRows("evidence_artifacts", { program_id: programId }, { columns: ["id"] });
  const assessments = useRows(
    "assessment_campaigns",
    { program_id: programId },
    { columns: ["id"] },
  );
  const gates = useRows("lifecycle_gates", { program_id: programId });
  const parties = useRows("parties", undefined, { columns: ["id", "name"] });
  // Loaded with the program on every tab, for the rail and the dialogs that read the same rows.
  useProgramReferences(programId);
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
  // The Assessment campaigns tab's own tab, as it was last shown: its panel is retained, so
  // choosing that tab again shows it as the reader left it.
  const shownAssessmentTab = useRef(assessmentTab);
  useEffect(() => {
    if (tab === "Assessment campaigns" && !view) shownAssessmentTab.current = assessmentTab;
  }, [tab, view, assessmentTab]);
  function select(next: ProgramTab) {
    void navigate({
      to: "/programs/$programId",
      params: { programId },
      // The tab joins the address's other parameters, so each collection keeps the question it
      // asks there. A preview belongs to its tab, so the requirement preview ends with it.
      search: (current) => ({
        ...current,
        tab: next,
        requirementId: undefined,
        requirementTab: undefined,
        assessmentTab: next === "Assessment campaigns" ? shownAssessmentTab.current : undefined,
      }),
    });
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
  };
  const openTasks = tasks.data?.filter((task) => !["done", "cancelled"].includes(task.status));
  const openIssues = issues.data?.filter(
    (issue) => !["closed", "resolved", "cancelled"].includes(issue.status),
  );
  const openRisks = risks.data?.filter((risk) => risk.status !== "closed");
  const queues: {
    label: string;
    query: QueryStatus;
    value: number | undefined;
    tab: ProgramTab;
  }[] = [
    { label: "Open tasks", query: tasks, value: openTasks?.length, tab: "Schedule" },
    { label: "Open issues", query: issues, value: openIssues?.length, tab: "Findings" },
    { label: "Open risks", query: risks, value: openRisks?.length, tab: "POA&M & risk" },
  ];
  const canEditProgram = workspace.role !== "viewer";
  const tabLink = (next: ProgramTab) => (
    <Link to="/programs/$programId" params={{ programId }} search={{ tab: next }} />
  );
  /** A tab's content: drawn the first time the tab is chosen, and kept while another is shown. */
  const tabContent = (name: ProgramTab): ReactNode => {
    switch (name) {
      case "Overview":
        return (
          <>
            {/* The program's Details, first on Overview: the rail beside it, or on a phone a
                closed disclosure above it whose row says the status. Kept to Overview, since the
                panel stays mounted while another tab shows. */}
            {tab === "Overview" && <ProgramDetailsAside program={program} />}
            {queues.some((queue) => queue.query.isError) && (
              <ProgramQueryState queries={queues.map((queue) => queue.query)} />
            )}
            <Stat.Grid
              cols={3}
              role="group"
              aria-label="Open work"
              aria-busy={queues.some((queue) => queue.value === undefined && !queue.query.isError)}
            >
              {queues.map((queue) => {
                const failed = queue.value === undefined && queue.query.isError;
                return (
                  <Stat.Tile
                    key={queue.label}
                    label={queue.label}
                    // A queue opens the tab that holds it.
                    link={tabLink(queue.tab)}
                    value={failed ? <Absent label="Not available" /> : (queue.value ?? null)}
                    isLoading={queue.value === undefined && !failed}
                    note={
                      failed ? "Could not load" : queue.value === 0 ? "Nothing open" : undefined
                    }
                  />
                );
              })}
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
                  countMax={9999}
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
            <ProgramActivity programId={programId} />
          </>
        );
      case "System":
        return <ProgramSystemsTree programId={programId} fill />;
      case "Library":
        return <ProgramLibrary programId={programId} fill />;
      case "Requirements":
        return (
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
        );
      case "Controls":
        return <ProgramSspAssembly programId={programId} />;
      case "Assessment campaigns":
        return (
          <AssessmentBrowser
            programId={programId}
            tab={assessmentTab}
            // Each tab is a step in the history, as the program's own tabs are.
            onTabChange={(next) =>
              void navigate({
                to: "/programs/$programId",
                params: { programId },
                search: (previous) => ({
                  ...previous,
                  tab: "Assessment campaigns",
                  assessmentTab: next,
                }),
                resetScroll: false,
              })
            }
          />
        );
      case "Schedule":
        return (
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
                  kind: "person",
                  value: (row) =>
                    parties.data?.find((party) => party.id === row["party_id"])?.name ?? null,
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
        );
      case "Findings":
        return (
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
        );
      case "Evidence":
        return <EvidenceBrowser programId={programId} />;
      case "POA&M & risk":
        return <ProgramPoamsAndRisks programId={programId} />;
    }
  };
  return (
    <>
      <Page>
        {/* The page is one failure region, and each of its tabs another: an outage reads as one
            alert where it happened, whose Retry reloads every failed read in it. A focused view
            has no tabs, so its blocks' failures read as the page's one alert. */}
        <ProgramQueryState queries={[query]} region>
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
                <DropdownMenuTrigger
                  render={<Button iconAfter={<ChevronDown />}>Actions</Button>}
                />
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
                  <DropdownMenuSeparator />
                  {/* The schema record, last, as on every record's Actions menu. */}
                  <DropdownMenuLinkItem
                    closeOnClick
                    render={
                      <Link
                        to="/records/$collection/$recordId"
                        params={{ collection: "programs", recordId: program.id }}
                      />
                    }
                  >
                    Inspect record
                  </DropdownMenuLinkItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PageHeader.Actions>
          </PageHeader>
          {/* A focused view has no tabs: the program's Details follow the header. */}
          {view && <ProgramDetailsAside program={program} />}
          {view ? (
            // A focused view is a page under the program, not one of its tabs: the trail leads back.
            <Stack space="space.300" className="min-w-0">
              {view === "Traceability matrix" ? (
                <ProgramTraceabilityMatrix programId={programId} />
              ) : view === "Residual risk" ? (
                <ProgramResidualRisk programId={programId} />
              ) : view === "Continuous monitoring" ? (
                <ProgramMonitoring programId={programId} />
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
            // Keyed by the program: its tabs' retained state ends when another program opens.
            <Tabs key={programId} value={tab} onValueChange={(value) => select(programTab(value))}>
              <TabsList variant="line" aria-label="Program work">
                {programTabs.map((name) => (
                  <TabsTrigger key={name} value={name}>
                    {name}
                    {counts[name] !== undefined && <Count value={counts[name]!} max={9999} />}
                  </TabsTrigger>
                ))}
              </TabsList>
              <RetainedTabPanels tabs={programTabs} value={tab}>
                {(name) => tabContent(name)}
              </RetainedTabPanels>
            </Tabs>
          )}
        </ProgramQueryState>
      </Page>
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

/**
 * What the program adopted: its catalog and profile choices, the profiles and the product variants
 * its boundaries come from. The rail names them, so the workspace loads them with the program on
 * every tab: of the catalogs and profiles, only the fields that name them.
 */
function useProgramReferences(programId: string) {
  const systems = useRows("systems", { program_id: programId });
  const references = useRows("program_reference_choices", { program_id: programId });
  const products = useProductLookup();
  const variants = useMemo(
    () =>
      (systems.data ?? [])
        .filter((system) => system.is_authorization_boundary && system.product_revision_id)
        .map((system) => ({ system, lineage: products.variant(system) })),
    [systems.data, products],
  );
  const catalogs = useRows("catalogs", undefined, { columns: ["id", "title"] });
  const catalogRevisions = useRows("catalog_revisions", undefined, {
    columns: ["id", "catalog_id", "title", "version"],
  });
  const profiles = useRows("profiles", undefined, { columns: ["id", "title"] });
  const profileResolutions = useRows("profile_resolutions", undefined, {
    columns: ["id", "profile_revision_id", "base_profile_resolution_id"],
  });
  const profileRevisions = useRows("profile_revisions", undefined, {
    columns: ["id", "profile_id", "title", "version"],
  });
  return {
    references,
    products,
    variants,
    catalogs,
    catalogRevisions,
    profiles,
    profileResolutions,
    profileRevisions,
  };
}

/**
 * The program's Details and References rail, on the Overview and on every focused view of the
 * program (Program transfer included), so each shows the same facts in the same words.
 */
export function ProgramDetailsAside({ program }: { program: Row<"programs"> }) {
  const {
    references,
    products,
    variants,
    catalogs,
    catalogRevisions,
    profiles,
    profileResolutions,
    profileRevisions,
  } = useProgramReferences(program.id);
  return (
    <Shell.Aside
      label="Program details"
      summary={<StatusBadge statuses={programStatuses} value={program.status} />}
    >
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
            <DateTime value={program.starts_on} />
          </KeyValue>
          <KeyValue label="Ends" wrap>
            <DateTime value={program.ends_on} />
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
                    if (!catalog) return <Absent />;
                    return (
                      <TextLink render={<Link to="/catalog" search={{ edition: catalog.id }} />}>
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
                    const record = profiles.data?.find((row) => row.id === revision?.profile_id);
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
  );
}

type TraceRow = {
  id: string;
  requirementId: string;
  program_id: string;
  requirement: string;
  control: string;
  relationship: string;
  appliesTo: string;
};

/**
 * The requirement-to-control matrix: one row per mapping from a requirement's current revision to
 * a control, with the relationship and the system it is scoped to. The name opens the requirement.
 */
function ProgramTraceabilityMatrix({ programId }: { programId: string }) {
  const navigate = useNavigate();
  const requirements = useRows(
    "engineering_requirements",
    { program_id: programId },
    { columns: ["id", "code"] as const },
  );
  const revisions = useRows("requirement_revisions", undefined, {
    columns: ["id", "engineering_requirement_id", "version_number", "title"] as const,
  });
  const links = useRows("requirement_control_links", undefined, {
    columns: [
      "id",
      "requirement_revision_id",
      "control_id",
      "relationship_type",
      "system_id",
    ] as const,
  });
  const controls = useRows("controls", undefined, { columns: ["id", "code", "title"] as const });
  const systems = useRows(
    "systems",
    { program_id: programId },
    { columns: ["id", "code", "name"] as const },
  );
  const rows = useMemo<TraceRow[]>(() => {
    const requirementById = new Map((requirements.data ?? []).map((row) => [row.id, row]));
    const current = new Map<string, { id: string; version: number; title: string }>();
    for (const revision of revisions.data ?? []) {
      if (!requirementById.has(revision.engineering_requirement_id)) continue;
      const held = current.get(revision.engineering_requirement_id);
      if (!held || held.version < revision.version_number)
        current.set(revision.engineering_requirement_id, {
          id: revision.id,
          version: revision.version_number,
          title: revision.title,
        });
    }
    const requirementOf = new Map(
      [...current].map(([requirementId, revision]) => [revision.id, requirementId]),
    );
    const controlById = new Map((controls.data ?? []).map((row) => [row.id, row]));
    const systemById = new Map((systems.data ?? []).map((row) => [row.id, row]));
    return (links.data ?? [])
      .flatMap((link) => {
        const requirementId = requirementOf.get(link.requirement_revision_id);
        const requirement = requirementId ? requirementById.get(requirementId) : undefined;
        if (!requirementId || !requirement) return [];
        const control = controlById.get(link.control_id);
        const system = link.system_id ? systemById.get(link.system_id) : undefined;
        return [
          {
            id: link.id,
            requirementId,
            program_id: programId,
            requirement: `${requirement.code} · ${current.get(requirementId)?.title ?? ""}`,
            control: control ? `${control.code} · ${control.title}` : "Control unavailable",
            relationship: labelFor(link.relationship_type),
            appliesTo: link.system_id
              ? system
                ? `${system.code} · ${system.name}`
                : "System unavailable"
              : "Every system",
          },
        ];
      })
      .sort(
        (a, b) =>
          a.requirement.localeCompare(b.requirement, undefined, { numeric: true }) ||
          a.control.localeCompare(b.control, undefined, { numeric: true }),
      );
  }, [requirements.data, revisions.data, links.data, controls.data, systems.data, programId]);
  const columns = useMemo(
    () =>
      defineColumns<TraceRow>((c) => [
        // A mapping reads as its two ends: the requirement and the control stay in the row on a
        // phone, and the relationship and scope take a width that fits them, not a share.
        c.text("requirement", {
          header: "Requirement",
          minWidth: 160,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink
              table="engineering_requirements"
              record={{ id: row.requirementId, program_id: row.program_id }}
            >
              {row.requirement}
            </RecordLink>
          ),
        }),
        c.text("control", { header: "Control", minWidth: 140, priority: 1 }),
        c.text("relationship", { header: "Relationship", width: 140, priority: 2 }),
        c.text("appliesTo", { header: "Applies to", width: 160, priority: 3 }),
      ]),
    [],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Traceability matrix",
    view: "program-traceability-matrix",
    resizable: true,
    reorderable: true,
  });
  return (
    <ProductCollection
      table={table}
      fill
      queries={[requirements, revisions, links, controls, systems]}
      searchLabel="Find a requirement or control"
      filters={[<DataTable.Filter key="relationship" table={table} column="relationship" />]}
      onRowClick={(row) =>
        void navigate(
          recordDestination("engineering_requirements", {
            id: row.requirementId,
            program_id: row.program_id,
          }),
        )
      }
      empty={{
        illustration: "shield",
        title: "No requirement is mapped to a control yet",
        description: "Map a requirement to the controls it satisfies on its Control mappings tab.",
      }}
    />
  );
}

type ResidualRow = {
  id: string;
  title: string;
  status: string;
  program_id: string;
  likelihood: string | null;
  impact: string | null;
  severity: string | null;
  assessed_at: string | null;
};

type LatestAssessment = Pick<
  Row<"risk_revisions">,
  "risk_id" | "version_number" | "likelihood" | "impact" | "severity" | "assessed_at"
>;

/** Each risk at its latest assessment: likelihood, impact and the severity that remains. */
function ProgramResidualRisk({ programId }: { programId: string }) {
  const navigate = useNavigate();
  const risks = useRows(
    "risks",
    { program_id: programId },
    { columns: ["id", "title", "status", "program_id"] as const },
  );
  const assessments = useRows("risk_revisions", undefined, {
    columns: [
      "id",
      "risk_id",
      "version_number",
      "likelihood",
      "impact",
      "severity",
      "assessed_at",
    ] as const,
  });
  const rows = useMemo<ResidualRow[]>(() => {
    const latest = new Map<string, LatestAssessment>();
    for (const assessment of assessments.data ?? []) {
      const held = latest.get(assessment.risk_id);
      if (!held || held.version_number < assessment.version_number)
        latest.set(assessment.risk_id, assessment);
    }
    const rank = (value: string | null) => statusEntry(severityLevels, value)?.rank ?? -1;
    return (risks.data ?? [])
      .map((risk) => {
        const assessment = latest.get(risk.id);
        return {
          ...risk,
          likelihood: assessment?.likelihood ?? null,
          impact: assessment?.impact ?? null,
          severity: assessment?.severity ?? null,
          assessed_at: assessment?.assessed_at ?? null,
        };
      })
      .sort((a, b) => rank(b.severity) - rank(a.severity) || a.title.localeCompare(b.title));
  }, [risks.data, assessments.data]);
  const columns = useMemo(
    () =>
      defineColumns<ResidualRow>((c) => [
        c.text("title", {
          header: "Risk",
          minWidth: 180,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink table="risks" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.status("severity", {
          header: "Residual severity",
          width: 140,
          priority: 1,
          statuses: severityLevels,
          cell: (row) => <LevelIndicator levels={severityLevels} value={row.severity} />,
        }),
        c.status("likelihood", {
          header: "Likelihood",
          width: 110,
          priority: 2,
          statuses: riskLevels,
          cell: (row) => <LevelIndicator levels={riskLevels} value={row.likelihood} />,
        }),
        c.status("impact", {
          header: "Impact",
          width: 110,
          priority: 3,
          statuses: riskLevels,
          cell: (row) => <LevelIndicator levels={riskLevels} value={row.impact} />,
        }),
        c.status("status", { header: "Status", width: 110, priority: 4, statuses: riskStatuses }),
        c.date("assessed_at", { header: "Assessed", priority: 5 }),
      ]),
    [],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Residual risk",
    view: "program-residual-risk",
    resizable: true,
    reorderable: true,
  });
  return (
    <ProductCollection
      table={table}
      fill
      queries={[risks, assessments]}
      searchLabel="Find a risk"
      filters={[
        <DataTable.Filter key="severity" table={table} column="severity" />,
        <DataTable.Filter key="status" table={table} column="status" />,
      ]}
      onRowClick={(row) => void navigate(recordDestination("risks", row))}
      empty={{
        illustration: "shield",
        title: "No risks yet",
        description: "Risks recorded for this program appear here with their latest assessment.",
      }}
    />
  );
}

/** The recurring assessments that keep the authorization current, across the program's plans. */
function ProgramMonitoring({ programId }: { programId: string }) {
  const campaigns = useRows(
    "assessment_campaigns",
    { program_id: programId },
    { columns: ["id"] as const },
  );
  const plans = useRows("assessment_plan_revisions", undefined, {
    columns: ["id", "campaign_id"] as const,
  });
  const planIds = useMemo(() => {
    const ids = new Set((campaigns.data ?? []).map((campaign) => campaign.id));
    return new Set(
      (plans.data ?? []).filter((plan) => ids.has(plan.campaign_id)).map((plan) => plan.id),
    );
  }, [campaigns.data, plans.data]);
  const where = useCallback(
    (row: DataRecord) => planIds.has(String(row["plan_revision_id"])),
    [planIds],
  );
  // The plans the schedule is scoped by: a failed refresh keeps the schedule under the page's alert.
  return (
    <ProgramQueryState queries={[campaigns, plans]}>
      <ProgramCollection
        name="scheduled_assessment_tasks"
        fill
        title="Monitoring schedule"
        where={where}
        initialValues={planIds.size === 1 ? { plan_revision_id: [...planIds][0]! } : undefined}
        columns={[
          { key: "title", title: "Scheduled assessment" },
          { key: "status", title: "Status" },
          { key: "starts_at", title: "Starts" },
          // A calendar day, overdue once it is before the reader's today while the assessment is
          // still to do; a completed one's day reads plainly, a cancelled one's with no state.
          {
            key: "due_on",
            title: "Due",
            minWidth: 200,
            render: (row) => (
              <DueDate
                value={row["due_on"]}
                done={row["status"] === "completed"}
                cancelled={row["status"] === "cancelled"}
              />
            ),
          },
        ]}
        canCreate={planIds.size > 0}
        prerequisite="A scheduled assessment belongs to an assessment plan. Plan an assessment campaign first."
        empty={{
          title: "No monitoring scheduled yet",
          illustration: "calendar",
          ...(planIds.size > 0
            ? {
                description:
                  "Schedule the recurring assessments that keep this program's authorization current.",
              }
            : {}),
        }}
      />
    </ProgramQueryState>
  );
}
/**
 * The POA&M & risk tab: the program's POA&M plans and their remediation items, then its risks,
 * three collections under their Section headings.
 */
function ProgramPoamsAndRisks({ programId }: { programId: string }) {
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
      <ProgramCollection
        name="risks"
        section
        empty={{ title: "No risks yet" }}
        title="Risks"
        filters={{ program_id: programId }}
        columns={[
          { key: "title", title: "Risk" },
          { key: "status", title: "Status" },
          { key: "updated_at", title: "Updated" },
        ]}
      />
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
  if (view === "Configuration baseline")
    return (
      <ProgramCollection
        name="configuration_baselines"
        fill
        title="Configuration baselines"
        owner="program"
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
  if (view === "Inheritance resolution")
    return (
      <ProgramCollection
        name="provider_capabilities"
        fill
        empty={{ title: "No provider capabilities yet" }}
        title="Provider capabilities"
        owner="program"
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
  return <ProgramSspAssembly programId={programId} />;
}
