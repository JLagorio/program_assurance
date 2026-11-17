// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// The program's record has no tab strip (Josef's decision of 2026-11-16): the side nav's work
// scope names its parts, and each part keeps the address its tab had (`?tab=`, the POA&M & risk
// address's hash telling POA&M from Risks, src/lib/program-parts.ts), so Back, a reload and every
// link that named a tab open the same part. Each part is a page of its own: its h1 is the part's
// name, beside the count the strip used to show (System, Requirements, Assessments, Evidence), and
// its browser title is `<part> — <program name> — Program Assurance`; it has no trail, and the
// program's header stays on the Overview alone, whose h1 is the program's name over its
// categorization and its one standing fact, its header ending with the program's action slot
// (`ProgramHeaderSlot` in program-slot: this reader's next step or who the program waits on, Edit
// program behind it; a program that records no roles keeps Edit program as its primary). A part
// keeps Edit program in its Actions menu. Each part is drawn the first time it is shown and kept
// while another is, so a register keeps its question, rows and selection (`RetainedParts` in
// program-shared).
// Library and Schedule are parts the side nav does not name: Library is in System's row of views;
// Schedule opens from the Overview's open tasks, its Lifecycle timeline and a gate in the Review
// queue.
//
// A program part's own collection of owned records takes the verb, the column and the filter
// through ProgramCollection's `assignOwner`, with an Owner column among its columns
// (`owner_party_id`, `kind: "person"`, whose names it reads once): the operational issues on
// Findings, the remediation items on POA&M and the risks on Risks; its Evidence is the evidence
// register's own. Such a collection holds its records whole, so No owner counts them all and
// Select all is the table's own. Reference: the POA&M and Risks parts in program-workspace.
//
// A register that sits under other collections on its part is named by its Section's id
// (`#program-<table>`), which brings it into view once its rows are read and moves focus to it,
// staying aligned while the collections above it load until the reader scrolls.

import { ControlBaselineSummary, ProgramControlBaseline } from "./control-baseline";
import { ProgramInheritance } from "./program-inheritance";
import { ProgramViewRow, programViewPart, type ProgramViewName } from "./program-views";
import {
  DetailFacts,
  DueDate,
  EmptyMessage,
  MissingRecord,
  RecordActions,
  type QueryStatus,
} from "./work-common";
import { ProgramStandingFacts } from "./program-standing";
import { ProgramHeaderSlot } from "./program-slot";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Absent,
  AsideLayout,
  Badge,
  Count,
  DateTime,
  DropdownMenuItem,
  DropdownMenuLinkItem,
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
  TextLink,
  DataTable,
  defineColumns,
} from "@ledger/design-system";
import { useRows, useRow, type Row } from "@/lib/models";
import { useProductLookup } from "@/lib/product-items";
import { type DataRecord } from "@/lib/records";
import {
  authorizationStatuses,
  programRoles,
  programStatuses,
  riskLevels,
  riskStatuses,
  severityLevels,
  statusEntry,
  statusLabel,
} from "@/lib/status";
import { LevelIndicator, StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { Page } from "@/components/app/shell";
import { AssessmentBrowser } from "@/components/prototype/assessment-browser";
import { EvidenceBrowser } from "@/components/prototype/evidence-browser";
import { WorkTable } from "@/components/prototype/work-table";
import { ObservationsRegister } from "./observations-register";
import { AssuranceWorkbench } from "./assurance-workbench";
import { RequirementsTable } from "./requirements-table";
import { ProgramSystemsTree } from "./program-systems-tree";
import { ProgramLibrary } from "./program-library";
import { ProgramControlStatusView } from "./program-control-status";
import { ProgramControlStatusTray, ProgramOpenWork } from "./program-overview";
import { ProgramControlStatusTrend } from "./control-status-trend";
import { ProgramProductDeltaTrays, ProgramProductDeltaView } from "./product-delta";
import { ProgramComplianceView, ProgramRequirementsTrays } from "./compliance-matrix";
import { ProgramTimeline } from "./program-timeline";
import { ProgramActivity } from "./program-activity";
import { ProgramSspAssembly } from "./ssp-assembly";
import { ProgramTrail } from "./record-trail";
import { RelationName } from "./record-tools";
import { ProductCollection } from "./product-collection";
import { useCollectionTable } from "./collection-question";
import { RecordLink, useOpenRecord } from "./record-preview";
import { ProgramPosture } from "./program-posture";
import { ProgramResiliency } from "./program-resiliency";
import type { PostureReading } from "@/lib/program-posture";
import { lifecycleGateDue } from "@/lib/program-timeline";
import type { RequirementTab } from "./requirement-record";
import {
  ProgramCollection,
  ProgramQueryState,
  ProgramEditor,
  RetainedParts,
  type ProgramColumn,
} from "./program-shared";
import { programRiskTechniquesColumn } from "@/lib/register-views";
import { codedName, useProgramRiskTechniques } from "@/lib/risk-threats";
import { serverRead, useServerCountQueries } from "@/lib/server-table";
import {
  programParts,
  type ControlsView,
  type ProgramPart,
  type ProgramTab,
} from "@/lib/program-parts";
import { useProgramControlStatus } from "@/lib/control-status";

export type { ProgramTab, RetiredProgramTab } from "@/lib/program-parts";

/** The collections a part's header counts beyond its systems, which it reads anyway. */
type CountedCollection = "engineering_requirements" | "assessment_campaigns" | "evidence_artifacts";

/**
 * How many records of a collection the program holds: one HEAD request with the exact count, no
 * rows. A write to the collection counts again.
 */
function useProgramCount(source: CountedCollection, programId: string) {
  const read = useMemo(
    () => serverRead({ source, columns: ["id"], scope: { program_id: programId } }),
    [source, programId],
  );
  return useServerCountQueries(read, [{}])[0]!;
}

/**
 * A part's count once it is this program's: none while it loads, after a failure, or while another
 * program's count still stands in.
 */
const counted = (
  count: ReturnType<typeof useProgramCount>,
): count is ReturnType<typeof useProgramCount> & { data: number } =>
  count.isSuccess && !count.isPlaceholderData;

export function ProgramWorkspace({
  programId,
  part = "Overview",
  view,
  requirementId,
  requirementTab,
  postureReading,
  onPostureReading,
  controlsView = "Status",
}: {
  programId: string;
  /** The part the address names (`programPart`); the Overview unless it names another. */
  part?: ProgramPart | undefined;
  /** The Controls part's view the address names (`controlsView`): Status unless Implementation. */
  controlsView?: ControlsView | undefined;
  /** A focused view, which the page shows in place of the parts, named by its h1. */
  view?: ProgramViewName | undefined;
  requirementId?: string | undefined;
  requirementTab?: RequirementTab | undefined;
  /** What the Posture view counts, which the address keeps, and how it is chosen. */
  postureReading?: PostureReading | undefined;
  onPostureReading?: ((reading: PostureReading) => void) | undefined;
}) {
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const query = useRow("programs", programId);
  const systems = useRows("systems", { program_id: programId }, { columns: SHELL_SYSTEM_COLUMNS });
  // What a part's header counts: how many the program holds, counted on the server, never read.
  const requirementCount = useProgramCount("engineering_requirements", programId);
  const campaignCount = useProgramCount("assessment_campaigns", programId);
  const evidenceCount = useProgramCount("evidence_artifacts", programId);
  // The Controls part counts its baseline's controls, from the read its Status view draws.
  const controlStatus = useProgramControlStatus(!view && part === "Controls" ? programId : null);
  // What the Overview's open work reads: ids and statuses, not records.
  const tasks = useRows("tasks", { program_id: programId }, { columns: ["id", "status"] });
  const issues = useRows(
    "operational_issues",
    { program_id: programId },
    { columns: ["id", "status", "severity"] },
  );
  const risks = useRows("risks", { program_id: programId }, { columns: ["id", "status"] });
  const gates = useRows("lifecycle_gates", { program_id: programId });
  const parties = useRows("parties", undefined, { columns: ["id", "name"] });
  // Loaded with the program on every part, for the rail and the dialogs that read the same rows.
  useProgramReferences(programId);
  const [editing, setEditing] = useState(false);
  const boundaries = useMemo(
    () => (systems.data ?? []).filter((system) => system.is_authorization_boundary),
    [systems.data],
  );
  const systemIds = useMemo(
    () => new Set((systems.data ?? []).map((system) => system.id)),
    [systems.data],
  );
  if (!query.data && (query.isPending || query.error))
    return <ProgramQueryState queries={[query]} />;
  if (!query.data) return <MissingRecord backTo="/programs" kind="Program" />;
  const program = query.data;
  const counts: Partial<Record<ProgramPart, number>> = {
    ...(systems.isSuccess && { System: systems.data.length }),
    ...(counted(requirementCount) && { Requirements: requirementCount.data }),
    ...(counted(campaignCount) && { Assessments: campaignCount.data }),
    ...(counted(evidenceCount) && { Evidence: evidenceCount.data }),
    ...(controlStatus.data?.baseline && { Controls: controlStatus.data.total }),
  };
  // The Overview's open work: its three reads, said in one alert when one fails.
  const queues: QueryStatus[] = [tasks, issues, risks];
  const canEditProgram = workspace.role !== "viewer";
  const tabLink = (next: ProgramTab, question?: Record<string, unknown>, section?: string) => (
    <Link
      to="/programs/$programId"
      params={{ programId }}
      search={{ tab: next, ...question }}
      {...(section ? { hash: section } : {})}
    />
  );
  /** A part's content: drawn the first time the part is shown, and kept while another is. */
  const partContent = (name: ProgramPart): ReactNode => {
    switch (name) {
      case "Overview":
        return (
          // Overview beside the program's Details: the rail at its end where it fits, else a
          // closed disclosure above it whose row says the status. They leave with the tab.
          <AsideLayout aside={<ProgramDetailsAside program={program} />}>
            <Stack space="space.300" className="min-w-0">
              {/* The Overview's views lead its body, beside the program's Details. */}
              <ProgramViewRow programId={programId} part="Overview" />
              {queues.some((queue) => queue.isError) && <ProgramQueryState queries={queues} />}
              <ProgramOpenWork
                programId={programId}
                tasks={tasks}
                issues={issues}
                risks={risks}
                tabLink={tabLink}
              />
              <ProgramControlStatusTray programId={programId} programName={program.name} />
              <ProgramControlStatusTrend programId={programId} />
              <ProgramProductDeltaTrays programId={programId} />
              <ProgramRequirementsTrays programId={programId} />
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
              <ControlBaselineSummary programId={programId} />
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
                        "Create a system in System before selecting baselines or recording implementation.",
                    }}
                  >
                    {boundaries.map((system) => (
                      <Item
                        key={system.id}
                        id={<Id>{system.code}</Id>}
                        idWidth="wide"
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
            </Stack>
          </AsideLayout>
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
        // Status, where the program stands on each control, or Implementation, the SSP as work.
        return controlsView === "Implementation" ? (
          <ProgramSspAssembly programId={programId} band />
        ) : (
          <ProgramControlStatusView programId={programId} />
        );
      case "Assessments":
        return (
          // Campaigns, events, objectives and scopes under Section headings, with no tab strip.
          <AssessmentBrowser programId={programId} layout="sections" />
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
                // A day the gate falls due, overdue, due today or soon while it is still to decide.
                {
                  key: "due_on",
                  title: "Due",
                  minWidth: 200,
                  render: (row) => (
                    <DueDate
                      value={row["due_on"]}
                      {...lifecycleGateDue({
                        status: String(row["status"]),
                        decided_at:
                          typeof row["decided_at"] === "string" ? row["decided_at"] : null,
                      })}
                    />
                  ),
                },
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
                  // RMF's words for the role (ISSM, ISSO), which search, sort and the Role filter
                  // read as the cell shows them.
                  value: (row) => statusLabel(programRoles, row["role"]),
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
                { key: "owner_party_id", title: "Owner", kind: "person" },
                { key: "opened_at", title: "Opened" },
              ]}
              assignOwner
            />
            <ObservationsRegister programId={programId} />
          </>
        );
      case "Evidence":
        return <EvidenceBrowser programId={programId} />;
      case "POA&M":
        return <ProgramPoams programId={programId} />;
      case "Risks":
        return <ProgramRisks programId={programId} />;
    }
  };
  const viewPart = view ? programViewPart(view) : undefined;
  return (
    <>
      <Page>
        {/* The page is one failure region, and each of its parts another: an outage reads as one
            alert where it happened, whose Retry reloads every failed read in it. A focused view
            has no parts, so its blocks' failures read as the page's one alert. */}
        <ProgramQueryState queries={[query]} region>
          <PageHeader>
            {/* A focused view is a page of its own, named by its h1 and trailed up to the part
                that lists it. The Overview, the parts and a view the side nav names (Control
                baseline, the nav's Baseline) have no trail: the side nav names the program and
                marks them. */}
            {view && viewPart && <ProgramTrail programId={programId} part={viewPart} />}
            {view || part === "Overview" ? (
              // The program's name, then its facts line: its categorization and its standing as
              // one fact. A focused view is named by its h1 alone.
              <PageHeader.Heading>
                <PageHeader.Title>{view ?? program.name}</PageHeader.Title>
                {!view && (
                  <ProgramStandingFacts
                    programId={programId}
                    boundaries={boundaries}
                    gates={gates}
                  />
                )}
              </PageHeader.Heading>
            ) : (
              // A part is named by its h1, beside how many records it holds where it counts them.
              <PageHeader.Heading>
                {counts[part] !== undefined ? (
                  <Inline space="space.100" alignBlock="center" shouldWrap>
                    <PageHeader.Title>{part}</PageHeader.Title>
                    <Count value={counts[part]} max={9999} />
                  </Inline>
                ) : (
                  <PageHeader.Title>{part}</PageHeader.Title>
                )}
              </PageHeader.Heading>
            )}
            {!view && part === "Overview" ? (
              // The Overview's header ends with the program's action slot: this reader's next step
              // or who the program waits on, Edit program behind it (program-slot).
              <ProgramHeaderSlot programId={programId} onEdit={() => setEditing(true)} />
            ) : (
              <PageHeader.Actions>
                {view ? (
                  <RecordActions
                    table="programs"
                    editLabel="Edit program"
                    onEdit={() => setEditing(true)}
                  />
                ) : (
                  // A part keeps the program's edit in its Actions menu: the part's own primary is
                  // its collection's.
                  <RecordActions table="programs">
                    {canEditProgram && (
                      <DropdownMenuItem onClick={() => setEditing(true)}>
                        Edit program
                      </DropdownMenuItem>
                    )}
                  </RecordActions>
                )}
              </PageHeader.Actions>
            )}
          </PageHeader>
          {view ? (
            // Focused views use the full work area; program Details belong to Overview.
            <Stack space="space.300" className="min-w-0">
              {/* A view listed under Controls keeps the part's switch, itself marked current. */}
              {viewPart === "Controls" && (
                <ProgramViewRow programId={programId} part="Controls" current={view} />
              )}
              {view === "Traceability matrix" ? (
                <AssuranceWorkbench programId={programId} initialSheet="mappings" />
              ) : view === "Workbook" ? (
                <AssuranceWorkbench programId={programId} />
              ) : view === "Posture" ? (
                <ProgramPosture
                  programId={programId}
                  reading={postureReading}
                  onReadingChange={onPostureReading ?? (() => {})}
                />
              ) : view === "Product delta" ? (
                <ProgramProductDeltaView programId={programId} />
              ) : view === "Compliance matrix" ? (
                <ProgramComplianceView programId={programId} />
              ) : view === "Control baseline" ? (
                <ProgramControlBaseline programId={programId} />
              ) : view === "Cyber resiliency" ? (
                <ProgramResiliency programId={programId} />
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
            // Keyed by the program: its parts' retained state ends when another program opens.
            <RetainedParts key={programId} parts={programParts} value={part}>
              {(name) => (
                <>
                  {/* The part's views, first: each a page of its own that reads the part's work.
                      The Overview's lead its body, beside the program's Details. */}
                  {name !== "Overview" && (
                    <ProgramViewRow
                      programId={programId}
                      part={name}
                      current={name === "Controls" ? controlsView : undefined}
                    />
                  )}
                  {partContent(name)}
                </>
              )}
            </RetainedParts>
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
 * What the program's shell reads of its systems on every tab, the Overview's boundaries and the
 * rail's product variants among them: one read, never every column.
 */
const SHELL_SYSTEM_COLUMNS = [
  "id",
  "code",
  "name",
  "is_authorization_boundary",
  "authorization_status",
  // The header's categorization, from each boundary's recorded impacts.
  "confidentiality_impact",
  "integrity_impact",
  "availability_impact",
  "product_revision_id",
  "product_configuration_id",
] as const;

/**
 * What the program adopted: its catalog and profile choices, the profiles and the product variants
 * its boundaries come from. The Overview rail loads these references when it mounts: of the
 * catalogs and profiles, only the fields that name them.
 */
function useProgramReferences(programId: string) {
  const systems = useRows("systems", { program_id: programId }, { columns: SHELL_SYSTEM_COLUMNS });
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

/** The program's Details and References, shown only alongside the Overview tab. */
function ProgramDetailsAside({ program }: { program: Row<"programs"> }) {
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
      {/* A fact with nothing recorded is not drawn: no sponsor, no start or end day. */}
      <Inspector.Group title="Details">
        <DetailFacts
          facts={[
            ["Status", <StatusBadge statuses={programStatuses} value={program.status} />],
            ["Code", <Id>{program.code}</Id>],
            [
              "Business line",
              program.business_line_id && (
                <RelationName table="business_lines" id={program.business_line_id} />
              ),
            ],
            [
              "Sponsor",
              program.sponsor_party_id && (
                <RelationName table="parties" id={program.sponsor_party_id} />
              ),
            ],
            ["Starts", program.starts_on && <DateTime value={program.starts_on} />],
            ["Ends", program.ends_on && <DateTime value={program.ends_on} />],
            ["Updated", <DateTime value={program.updated_at} format="date" />],
          ]}
        />
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
              {references.data?.length ? (
                <KeyValue label="Program profiles" wrap>
                  <Stack space="space.050">
                    {references.data.map((choice) => {
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
              ) : null}
            </KeyValue.Group>
          ) : (
            <Empty size="compact">
              <EmptyHeader>
                <EmptyTitle>No references recorded</EmptyTitle>
                <EmptyDescription>
                  A program made outside setup records no baseline choice.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </ProgramQueryState>
      </Inspector.Group>
    </Shell.Aside>
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
  const openRecord = useOpenRecord();
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
      onRowClick={(row) => openRecord("risks", row)}
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
        prerequisite="Plan an assessment campaign first."
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
/** A risk that names no ATT&CK technique: one list, so its row reads the same on every render. */
const NO_TECHNIQUES: readonly { key: string; label: string }[] = [];

/**
 * The POA&M part: the program's POA&M plans and their remediation items, two collections under
 * their Section headings.
 */
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
            { key: "owner_party_id", title: "Owner", kind: "person" },
            { key: "updated_at", title: "Updated" },
          ]}
          canCreate={ids.size > 0}
          prerequisite="Remediation items belong to a POA&M plan. Create a POA&M plan first."
          assignOwner
        />
      )}
    </Stack>
  );
}

/**
 * The Risks part: the program's risks, its only collection. They list the ATT&CK techniques each
 * names, by identifier and name, with a filter on them, which a control's Risks count opens.
 */
function ProgramRisks({ programId }: { programId: string }) {
  // Read once for the program's risks; the columns stay the same while the reads do.
  const threats = useProgramRiskTechniques(programId);
  const techniques = threats.risks;
  const riskColumns = useMemo((): ProgramColumn[] => {
    const named = new Map(
      [...(techniques ?? [])].map(([riskId, list]) => [
        riskId,
        list.map((technique) => ({ key: technique.code, label: codedName(technique) })),
      ]),
    );
    return [
      { key: "title", title: "Risk" },
      { key: "status", title: "Status" },
      { key: "owner_party_id", title: "Owner", kind: "person" },
      {
        key: programRiskTechniquesColumn,
        title: "ATT&CK techniques",
        items: (row) => named.get(row.id) ?? NO_TECHNIQUES,
      },
      { key: "updated_at", title: "Updated" },
    ];
  }, [techniques]);
  return (
    <ProgramCollection
      name="risks"
      fill
      empty={{ title: "No risks yet" }}
      title="Risks"
      filters={{ program_id: programId }}
      columns={riskColumns}
      queries={threats.queries}
      assignOwner
    />
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
  if (view === "Inheritance")
    return <ProgramInheritance programId={programId} systemIds={systemIds} />;
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
