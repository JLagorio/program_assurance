import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  Button,
  Count,
  DataTable,
  DateTime,
  Person,
  Prose,
  Section,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
  VisuallyHidden,
  defineColumns,
  toast,
  useLedgerLocale,
  type EmptyIllustrationKind,
  type FilterOption,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import {
  assessmentObjectiveRead,
  objectiveTarget,
  storedObjective,
  type ObjectiveRegisterRow,
} from "@/lib/assessment-objectives";
import { useRows, type Row } from "@/lib/models";
import { registerViews } from "@/lib/register-views";
import {
  useServerCountQueries,
  useServerResult,
  type ServerRead,
  type ServerResultQuestion,
} from "@/lib/server-table";
import { useWorkspace } from "@/components/app/workspace";
import { StatusBadge, LevelIndicator } from "@/components/app/status";
import { campaignStatuses, impactLevels } from "@/lib/status";
import { type DataRecord } from "@/lib/records";
import {
  productCollectionNoun,
  productCreateLabel,
  productRecordNoun,
} from "@/lib/product-records";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
  useEndOnHide,
  useOpenRecord,
} from "./record-preview";
import { AssessmentTable } from "./assessment-table";
import type { AssessmentKind } from "./assessment-tabs";
import { useServerCollection } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { ProgramCollection } from "./program-shared";
import { RelationName, downloadJson } from "./record-tools";
import { DetailFacts, ModelForm, QueryState, type FormTarget } from "./work-common";

type AssessmentRecordKind = Exclude<AssessmentKind, "Scopes">;
const tables: Record<AssessmentRecordKind, FormTarget["table"]> = {
  Campaigns: "assessment_campaigns",
  Events: "assessment_events",
  Objectives: "assessment_objectives",
};

type CampaignRow = Row<"assessment_campaigns"> & {
  /** The program's name; null when the reader cannot see it. */
  program: string | null;
  /** The owner's name; null when none is recorded or the reader cannot see them. */
  owner: string | null;
  events: number;
};

/** What a missing name reads as: none recorded, or one recorded that the reader cannot see. */
const hidden = (id: string | null | undefined) => (id ? "Not available" : "Not recorded");

/** Authored text under its name, or a labelled Absent when there is none. */
function Described({ label, text }: { label: string; text: unknown }) {
  return <Prose label={label}>{typeof text === "string" && text.trim() ? text : <Absent />}</Prose>;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Campaigns by title as a reader orders them, numbers by their value; one the reader cannot see last. */
const campaignTitles = new Intl.Collator(undefined, { numeric: true });
const campaignOrder = (a: string | null, b: string | null) =>
  a === b ? 0 : a === null ? 1 : b === null ? -1 : campaignTitles.compare(a, b);

/** A campaign's or event's window reads in days, as the registers show it. */
const day = (value: unknown) =>
  typeof value === "string" && value ? <DateTime value={value} format="date" /> : null;

/** No count to read: a register under a Section heading says no count. */
const NO_QUESTIONS: ServerResultQuestion[] = [];
/** The whole register, whatever the reader asks of it: a tab's count. */
const WHOLE_REGISTER: ServerResultQuestion[] = [{}];

/** Campaigns, their events, their objectives and, within a program, its assessment scopes: registers under one tab strip, each on the kit's table with its own search, chips and create action. Choosing a campaign's event count opens its events with the Campaign chip already set. */
export function AssessmentBrowser({
  programId,
  layout = "tabs",
  tab: routeTab,
  onTabChange,
}: {
  programId?: string;
  /**
   * How the collections share the surface. `tabs` is the Assessment campaigns page, a register
   * page that holds several collections under its one h1. `sections` is a program's Assessment
   * campaigns tab, where the program's own strip is the only one: the collections sit under
   * Section headings, each compact with a secondary create action, as on POA&M & risk.
   */
  layout?: "tabs" | "sections" | undefined;
  /** The tab the address names, where the route keeps it; with no `onTabChange` the tab is local. */
  tab?: AssessmentKind | undefined;
  /** Puts the chosen tab in the address, as a new history entry. */
  onTabChange?: ((tab: AssessmentKind) => void) | undefined;
}) {
  const workspace = useWorkspace();
  const { formatPlural } = useLedgerLocale();
  const sectioned = layout === "sections";
  const campaigns = useRows("assessment_campaigns", programId ? { program_id: programId } : {});
  // In a program, its campaigns' plans, events and objectives, joined on the server: never every
  // campaign's in the workspace.
  const inCampaigns = programId ? { "assessment_campaigns.program_id": programId } : {};
  // A plan is named by its title and its version, and placed in its campaign.
  const plans = useRows("assessment_plan_revisions", inCampaigns, {
    columns: ["id", "campaign_id", "version_number", "title"] as const,
  });
  const events = useRows("assessment_events", inCampaigns);
  // The objectives, a page at a time from their view: every campaign's, or the program's. They can
  // run to thousands (a plan holds one objective an assessment objective of each control it
  // assesses), so the server pages, sorts, filters, searches and counts them.
  const objectiveRead = useMemo(
    () => assessmentObjectiveRead(programId ? { program_id: programId } : {}),
    [programId],
  );
  // The tab counts the whole register, whatever the reader's question; under Section headings
  // nothing counts it.
  const [objectiveCount] = useServerCountQueries(
    objectiveRead,
    sectioned ? NO_QUESTIONS : WHOLE_REGISTER,
  );
  const programs = useRows("programs", undefined, { columns: ["id", "name"] as const });
  const parties = useRows("parties", undefined, { columns: ["id", "name"] as const });
  // A program's systems and their scopes, for its Scopes register: the workspace's page has none.
  const systems = useRows(
    "systems",
    { program_id: programId ?? null },
    { columns: ["id", "is_authorization_boundary"] as const, enabled: !!programId },
  );
  const scopes = useRows(
    "scopes",
    { system_id: (systems.data ?? []).map((system) => system.id) },
    { columns: ["id", "system_id"] as const, enabled: !!programId && systems.isSuccess },
  );
  const [localTab, setLocalTab] = useState<AssessmentKind>("Campaigns");
  // Where the route keeps the tab, the address owns it: each choice is a step in the history, and
  // an address without one is Campaigns. Scopes belongs to a program's browser; elsewhere a stale
  // "Scopes" reads as Campaigns.
  const tab = onTabChange
    ? routeTab && (programId || routeTab !== "Scopes")
      ? routeTab
      : "Campaigns"
    : localTab;
  const setTab = (next: AssessmentKind) => {
    if (onTabChange) onTabChange(next);
    else setLocalTab(next);
  };
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [form, setForm] = useState<FormTarget | null>(null);
  const [selection, setSelection] = useState<FormTarget | null>(null);
  useEndOnHide(() => setSelection(null));
  const [displayed, setDisplayed] = useState<Record<string, DataRecord[]>>({});
  // A campaign's event count opens the Events tab; its button leaves with the Campaigns panel, so
  // focus goes to the tab the reader is now on. Under Section headings it brings the Events
  // section into view and focus goes to it.
  const eventsTab = useRef<HTMLButtonElement>(null);
  const eventsSection = useRef<HTMLElement>(null);
  // A name the reader cannot see stays null, so it sorts last and its cell says Absent.
  const partyName = useCallback(
    (id: string | null | undefined) =>
      id ? (parties.data?.find((party) => party.id === id)?.name ?? null) : null,
    [parties.data],
  );
  const campaignRows = useMemo<CampaignRow[]>(
    () =>
      (campaigns.data ?? []).map((campaign) => ({
        ...campaign,
        program: programs.data?.find((program) => program.id === campaign.program_id)?.name ?? null,
        owner: partyName(campaign.owner_party_id),
        events: (events.data ?? []).filter((event) => event.campaign_id === campaign.id).length,
      })),
    [campaigns.data, programs.data, events.data, partyName],
  );
  const campaignName = (id: string | null | undefined) =>
    campaignRows.find((campaign) => campaign.id === id)?.title ?? null;
  const campaignTitle = (id: string | null | undefined) => campaignName(id) ?? "Not available";
  const planRows = (plans.data ?? []).filter((plan) =>
    campaignRows.some((campaign) => campaign.id === plan.campaign_id),
  );
  const planOf = (id: unknown) => planRows.find((plan) => plan.id === id);
  const eventRows = (events.data ?? [])
    .filter((event) => campaignRows.some((campaign) => campaign.id === event.campaign_id))
    .map((event) => ({
      ...event,
      campaign: campaignName(event.campaign_id),
      plan: planOf(event.plan_revision_id)?.version_number ?? null,
    }));
  // The Objectives' Campaign filter offers every campaign by its title: one page's rows are not
  // every campaign there is.
  const campaignOptions = useMemo<FilterOption[]>(
    () =>
      [...new Set(campaignRows.map((campaign) => campaign.title))]
        .sort(campaignOrder)
        .map((title) => ({ value: title })),
    [campaignRows],
  );
  const systemIds = useMemo(
    () => new Set((systems.data ?? []).map((system) => system.id)),
    [systems.data],
  );
  const inProgram = useCallback(
    (record: DataRecord) => systemIds.has(String(record["system_id"])),
    [systemIds],
  );
  const scopeRows = (scopes.data ?? []).filter((scope) => systemIds.has(scope.system_id));
  const firstBoundary = (systems.data ?? []).find((system) => system.is_authorization_boundary);
  const kinds: AssessmentKind[] = programId
    ? ["Campaigns", "Events", "Objectives", "Scopes"]
    : ["Campaigns", "Events", "Objectives"];
  const chosen = campaignId ? campaignTitle(campaignId) : null;
  const campaignFilter = chosen ? [{ id: "campaign", value: [chosen] }] : undefined;
  const counts: Partial<Record<AssessmentKind, number | undefined>> = {
    Campaigns: campaigns.data && campaignRows.length,
    Events: campaigns.data && events.data && eventRows.length,
    Objectives: objectiveCount?.data,
    Scopes: systems.data && scopes.data && scopeRows.length,
  };
  // The preview reads the record as the registers have it now, so an edit saved from it shows: an
  // objective as the register's page holds it.
  const live: Record<AssessmentRecordKind, DataRecord[]> = {
    Campaigns: campaignRows as unknown as DataRecord[],
    Events: eventRows as unknown as DataRecord[],
    Objectives: displayed["assessment_objectives"] ?? [],
  };
  const selectedKind = (Object.keys(tables) as AssessmentRecordKind[]).find(
    (kind) => tables[kind] === selection?.table,
  );
  const selected =
    selection?.existing &&
    ((selectedKind && live[selectedKind].find((row) => row.id === selection.existing!.id)) ??
      selection.existing);
  /** The record as stored, without the names the registers derive, for the edit form. */
  const stored = (record: DataRecord): DataRecord =>
    selection?.table === "assessment_objectives"
      ? (storedObjective(record as unknown as ObjectiveRegisterRow) as unknown as DataRecord)
      : (([campaigns, events] as const)
          .flatMap((query) => (query.data ?? []) as unknown as DataRecord[])
          .find((row) => row.id === record.id) ?? record);
  function edit(target: FormTarget) {
    // The preview stays open under the dialog, so closing the dialog returns to its Edit.
    if (form) return;
    setForm(target);
  }
  const inspect = (table: FormTarget["table"]) => (row: object) =>
    setSelection({ table, existing: row as DataRecord });
  const add = (kind: AssessmentRecordKind, size: "small" | "medium") =>
    workspace.role !== "viewer" ? (
      <Button
        // Among other collections under Section headings the create action is a small secondary.
        size={sectioned ? "small" : size}
        variant={sectioned ? "secondary" : "primary"}
        iconBefore={<Plus />}
        onClick={() =>
          edit({
            table: tables[kind],
            initialValues:
              kind === "Campaigns"
                ? programId
                  ? { program_id: programId }
                  : {}
                : kind === "Events" && campaignId
                  ? { campaign_id: campaignId }
                  : {},
          })
        }
      >
        {productCreateLabel(tables[kind])}
      </Button>
    ) : undefined;
  const planLink = (id: unknown, title?: string | null) =>
    typeof id === "string" && id ? (
      <RecordLink table="assessment_plan_revisions" record={{ id }}>
        {title ?? planOf(id)?.title ?? "Assessment plan revision"}
      </RecordLink>
    ) : null;
  const campaignLink = (id: unknown) =>
    typeof id === "string" && id ? (
      <TextLink render={<Link to="/campaigns/$campaignId" params={{ campaignId: id }} />}>
        {campaignTitle(id)}
      </TextLink>
    ) : null;
  const previewBody = (record: DataRecord): ReactNode => {
    if (selection?.table === "assessment_campaigns") {
      const row = record as unknown as CampaignRow;
      return (
        <>
          <Described label="Description" text={row.description} />
          <DetailFacts
            facts={[
              ["Status", <StatusBadge statuses={campaignStatuses} value={row.status} />],
              [
                "Program",
                row.program ? (
                  <TextLink
                    render={
                      <Link to="/programs/$programId" params={{ programId: row.program_id }} />
                    }
                  >
                    {row.program}
                  </TextLink>
                ) : (
                  <Absent label="Not available" />
                ),
              ],
              ["Owner", row.owner ?? <Absent label={hidden(row.owner_party_id)} />],
              ["Starts", day(row.starts_at)],
              ["Ends", day(row.ends_at)],
              ["Events", row.events],
            ]}
          />
        </>
      );
    }
    if (selection?.table === "assessment_events")
      return (
        <>
          <Described label="Description" text={record["description"]} />
          <DetailFacts
            facts={[
              [
                "Status",
                <StatusBadge statuses={campaignStatuses} value={String(record["status"] ?? "")} />,
              ],
              ["Campaign", campaignLink(record["campaign_id"])],
              ["Starts", day(record["starts_at"])],
              ["Ends", day(record["ends_at"])],
              ["Location", record["location"] as string | null],
              ["Assessment plan", planLink(record["plan_revision_id"])],
            ]}
          />
        </>
      );
    const objective = record as unknown as ObjectiveRegisterRow;
    return (
      <>
        <Described label="Statement" text={objective.description} />
        <DetailFacts
          facts={[
            ["Acceptance criterion", objective.acceptance_criterion],
            ["Campaign", campaignLink(objective.campaign_id)],
            ["Assessment plan", planLink(objective.plan_revision_id, objective.plan_title)],
          ]}
        />
      </>
    );
  };
  const campaignsTable = (
    <AssessmentTable<CampaignRow>
      model="assessment_campaigns"
      fill={!sectioned}
      compact={sectioned}
      label="Campaigns"
      view="assessment-campaigns"
      rows={campaignRows}
      queries={[campaigns, programs, parties, events]}
      filters={["status"]}
      actions={add("Campaigns", "small")}
      selectedId={selection?.table === "assessment_campaigns" ? selection.existing?.id : undefined}
      onDisplayedRowsChange={(rows) =>
        setDisplayed((previous) => ({
          ...previous,
          assessment_campaigns: rows as unknown as DataRecord[],
        }))
      }
      onPreview={inspect("assessment_campaigns")}
      empty={{
        illustration: "calendar",
        title: "No campaigns yet",
        description:
          "Schedule an assessment campaign to plan its events and record their objectives.",
        action: add("Campaigns", "medium"),
      }}
      // The name's 180 minimum and the status's 120 fit a phone's row together.
      columns={[
        { label: "Campaign", key: "title" },
        ...(programId
          ? []
          : [
              {
                label: "Program",
                key: "program" as const,
                value: (row: CampaignRow) => row.program ?? <Absent label="Not available" />,
                width: 180,
                priority: 3,
              },
            ]),
        {
          label: "Status",
          key: "status",
          statuses: campaignStatuses,
          width: 120,
          priority: 1,
        },
        {
          label: "Owner",
          key: "owner",
          kind: "person",
          value: (row) =>
            row.owner ? <Person name={row.owner} /> : <Absent label={hidden(row.owner_party_id)} />,
          width: 180,
          priority: 4,
        },
        { label: "Starts", key: "starts_at", width: 120, priority: 2 },
        { label: "Ends", key: "ends_at", width: 120, priority: 5 },
        {
          label: "Events",
          key: "events",
          kind: "number",
          width: 100,
          priority: 6,
          value: (row) =>
            row.events > 0 ? (
              <Button
                variant="link"
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  setCampaignId(row.id);
                  if (sectioned) {
                    requestAnimationFrame(() => {
                      eventsSection.current?.scrollIntoView({ block: "start" });
                      eventsSection.current?.focus({ preventScroll: true });
                    });
                    return;
                  }
                  setTab("Events");
                  requestAnimationFrame(() => eventsTab.current?.focus());
                }}
              >
                <VisuallyHidden>
                  {`Show ${formatPlural(row.events, { one: "{count} event", other: "{count} events" })} of ${row.title}`}
                </VisuallyHidden>
                <span aria-hidden>{row.events}</span>
              </Button>
            ) : (
              row.events
            ),
        },
      ]}
    />
  );
  const eventsTable = (
    <AssessmentTable
      model="assessment_events"
      selectedId={selection?.table === "assessment_events" ? selection.existing?.id : undefined}
      onDisplayedRowsChange={(rows) =>
        setDisplayed((previous) => ({
          ...previous,
          assessment_events: rows as DataRecord[],
        }))
      }
      key={campaignId ?? "all"}
      fill={!sectioned}
      compact={sectioned}
      label="Events"
      view="assessment-events"
      keepQuestion={`assessment-events-${campaignId ?? "all"}`}
      rows={eventRows}
      queries={[events, campaigns, plans]}
      filters={["campaign", "status"]}
      initialFilters={campaignFilter}
      actions={add("Events", "small")}
      empty={{
        illustration: "calendar",
        title: "No events yet",
        description: "Add an assessment event under a campaign to schedule its window.",
        action: add("Events", "medium"),
      }}
      columns={[
        { label: "Event", key: "title" },
        {
          label: "Campaign",
          key: "campaign",
          value: (row) => row.campaign ?? <Absent label="Not available" />,
          width: 190,
          priority: 3,
        },
        { label: "Plan version", key: "plan", kind: "number", width: 135, priority: 5 },
        {
          label: "Status",
          key: "status",
          statuses: campaignStatuses,
          width: 120,
          priority: 1,
        },
        { label: "Starts", key: "starts_at", width: 120, priority: 2 },
        { label: "Ends", key: "ends_at", width: 120, priority: 4 },
      ]}
      onPreview={inspect("assessment_events")}
    />
  );
  const objectivesTable = (
    <ObjectiveRegister
      key={campaignId ?? "all"}
      read={objectiveRead}
      sectioned={sectioned}
      // Opened from a campaign's event count, the register asks for that campaign's objectives,
      // under a question of its own.
      campaignFilter={campaignFilter}
      keepQuestion={
        campaignId
          ? `${registerViews.assessmentObjectives}-${campaignId}`
          : registerViews.assessmentObjectives
      }
      campaignOptions={campaignOptions}
      selectedId={selection?.table === "assessment_objectives" ? selection.existing?.id : undefined}
      onPreview={inspect("assessment_objectives")}
      onDisplayedRowsChange={(rows) =>
        setDisplayed((previous) => ({
          ...previous,
          assessment_objectives: rows as unknown as DataRecord[],
        }))
      }
      action={add("Objectives", "small")}
      empty={{
        illustration: "shield",
        title: "No objectives yet",
        description:
          "Record what each assessment plan sets out to show, and the control or requirement it targets.",
        action: add("Objectives", "medium"),
      }}
    />
  );
  const scopesTable = (
    <QueryState queries={[systems]}>
      <ProgramCollection
        name="scopes"
        fill={!sectioned}
        section={sectioned}
        title={sectioned ? "Scopes" : "Assessment scopes"}
        where={inProgram}
        initialValues={{ system_id: firstBoundary?.id ?? null }}
        columns={[
          { key: "code", title: "Scope" },
          { key: "name", title: "Name" },
          {
            key: "system_id",
            title: "System",
            render: (record) => <RelationName table="systems" id={String(record["system_id"])} />,
          },
          {
            key: "composition_node_id",
            title: "Element",
            render: (record) =>
              record["composition_node_id"] ? (
                <RelationName table="systems" id={String(record["composition_node_id"])} />
              ) : (
                <Text color="color.text.subtle">Whole system</Text>
              ),
          },
          ...(["confidentiality", "integrity", "availability"] as const).map((dimension) => ({
            key: `${dimension}_impact`,
            title:
              dimension === "confidentiality"
                ? "Conf."
                : dimension === "integrity"
                  ? "Integ."
                  : "Avail.",
            render: (record: DataRecord) => (
              <LevelIndicator
                levels={impactLevels}
                value={(record[`${dimension}_impact`] as string | null) ?? null}
              />
            ),
          })),
        ]}
        empty={{
          title: "No scopes yet",
          description: "Create a scope to categorize a subset of a system for assessment.",
        }}
      />
    </QueryState>
  );
  return (
    <Stack space={sectioned ? "space.300" : "space.200"}>
      {form && <ModelForm target={form} onClose={() => setForm(null)} />}
      {sectioned ? (
        <>
          <Section title="Campaigns">{campaignsTable}</Section>
          <Section title="Events" ref={eventsSection} tabIndex={-1}>
            {eventsTable}
          </Section>
          {/* The longest collection last, so the short ones are read without paging past it. */}
          {scopesTable}
          <Section title="Objectives">{objectivesTable}</Section>
        </>
      ) : (
        <Tabs value={tab} onValueChange={(value) => setTab(value as AssessmentKind)}>
          <TabsList variant="line" aria-label="Assessment collections">
            {kinds.map((name) => (
              <TabsTrigger
                value={name}
                key={name}
                {...(name === "Events" ? { ref: eventsTab } : {})}
              >
                {name}
                {/* Every strip counts the same way: 0 once the rows load, and up to 9999. */}
                {counts[name] !== undefined ? <Count value={counts[name]} max={9999} /> : null}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="Campaigns" keepMounted>
            {campaignsTable}
          </TabsContent>
          <TabsContent value="Events" keepMounted>
            {eventsTable}
          </TabsContent>
          <TabsContent value="Objectives" keepMounted>
            {objectivesTable}
          </TabsContent>
          {programId && (
            <TabsContent value="Scopes" keepMounted>
              {scopesTable}
            </TabsContent>
          )}
        </Tabs>
      )}
      {selected && selection && (
        <RecordPreviewPanel
          title={String(selected["title"])}
          label={`${capitalize(productRecordNoun(selection.table))} preview`}
          defaultWidth={640}
          onClose={() => setSelection(null)}
          recordActions={
            workspace.role !== "viewer" && (
              <Button
                size="small"
                variant="primary"
                onClick={() => edit({ table: selection.table, existing: stored(selected) })}
              >
                Edit {productRecordNoun(selection.table, selected)}
              </Button>
            )
          }
          navigation={
            <RecordPreviewActions
              table={selection.table}
              record={selected}
              rows={displayed[selection.table] ?? []}
              onSelect={(row) => setSelection({ table: selection.table, existing: row })}
            />
          }
        >
          <Stack space="space.250">{previewBody(selected)}</Stack>
        </RecordPreviewPanel>
      )}
    </Stack>
  );
}

/** An objective as its register draws it: its campaign's and its plan's titles under the ids the
 * columns, the Campaign filter and the address name them by. */
type ObjectiveRow = ObjectiveRegisterRow & { campaign: string; plan: string };

/** The register's rows from the page's, in the server's order. */
const objectiveRows = (page: ObjectiveRegisterRow[]): ObjectiveRow[] =>
  page.map((row) => ({ ...row, campaign: row.campaign_title, plan: row.plan_title }));

/**
 * The register's columns, built once for its opener: stepping through the preview rebuilds none.
 * An objective has no page of its own: its name opens its preview.
 */
const objectiveColumns = (open: (row: ObjectiveRow) => void) =>
  defineColumns<ObjectiveRow>((c) => [
    c.id("title", {
      header: "Objective",
      minWidth: 180,
      priority: 0,
      hideable: false,
      cell: (row) => (
        <RecordLink table="assessment_objectives" record={row} onPreview={() => open(row)}>
          {row.title}
        </RecordLink>
      ),
    }),
    c.text("description", {
      header: "Statement",
      cell: (row) => (row.description ? row.description : <Absent />),
    }),
    c.text("campaign", { header: "Campaign", width: 190 }),
    c.text("plan", { header: "Plan", width: 190 }),
    c.custom("target", {
      header: "Target",
      width: 170,
      // An assessment objective by its label (AC-08a.01), the control's statement as Control
      // statement, a requirement revision as Requirement revision.
      text: (row) => objectiveTarget(row)?.label ?? "",
      cell: (row) => {
        const target = objectiveTarget(row);
        return target ? (
          <RecordLink table={target.table} record={{ id: target.id }}>
            {target.label}
          </RecordLink>
        ) : (
          <Absent />
        );
      },
    }),
  ]);

const objectiveNoun = {
  one: productRecordNoun("assessment_objectives"),
  other: productCollectionNoun("assessment_objectives"),
};

/**
 * Every campaign's objectives, or a program's, a page at a time from the server, which pages,
 * sorts, filters, searches and counts them, in the campaigns' and their plans' order and each
 * plan's in the catalog's reading order unless the reader sorts. Its question lives in the address
 * under its view; its preview is its caller's, which steps across the pages; Export writes the
 * whole result. Under a Section heading (a program's tab) it is compact, with a secondary create.
 */
function ObjectiveRegister({
  read,
  sectioned,
  campaignFilter,
  keepQuestion,
  campaignOptions,
  selectedId,
  onPreview,
  onDisplayedRowsChange,
  action,
  empty,
}: {
  read: ServerRead;
  sectioned: boolean;
  /** The Campaign filter the register opens on, from a campaign's event count. */
  campaignFilter?: { id: string; value: unknown }[] | undefined;
  keepQuestion: string;
  campaignOptions: FilterOption[];
  selectedId?: string | undefined;
  onPreview: (row: ObjectiveRow) => void;
  onDisplayedRowsChange: (rows: ObjectiveRow[]) => void;
  action: ReactNode;
  empty: {
    illustration: EmptyIllustrationKind;
    title: string;
    description: string;
    action: ReactNode;
  };
}) {
  const openRecord = useOpenRecord();
  // The columns are built once: the name reaches the latest opener.
  const open = useRef(onPreview);
  open.current = onPreview;
  const columns = useMemo(() => objectiveColumns((row) => open.current(row)), []);
  const collection = useServerCollection<ObjectiveRow, ObjectiveRegisterRow>(read, {
    columns,
    rows: objectiveRows,
    preview: useMemo(
      () => ({ onPreview: (row: ObjectiveRow) => open.current(row), activeId: selectedId ?? null }),
      [selectedId],
    ),
    label: "Objectives",
    view: registerViews.assessmentObjectives,
    keepQuestion,
    resizable: true,
    reorderable: true,
    ...(campaignFilter ? { initialState: { columnFilters: campaignFilter } } : {}),
  });
  const { table } = collection;
  useDisplayedRecords(table, onDisplayedRowsChange);
  const readResult = useServerResult(read);
  const [exporting, setExporting] = useState(false);
  /** Every objective the question leaves, across its pages, as the register reads them. */
  const exportObjectives = () => {
    setExporting(true);
    readResult({
      search: String(table.state.globalFilter ?? ""),
      sorting: table.state.sorting,
      filters: table.state.columnFilters,
    })
      .then((rows) => downloadJson("assessment-objectives.json", rows))
      .catch((cause: unknown) =>
        toast.add({
          type: "error",
          title: "The objectives were not exported",
          description: cause instanceof Error ? cause.message : "Try again.",
        }),
      )
      .finally(() => setExporting(false));
  };
  return (
    <ProductCollection
      {...collection}
      fill={!sectioned}
      compact={sectioned}
      noun={objectiveNoun}
      // An objective has no page of its own: its row opens its preview, as its name does.
      onRowClick={(row) => openRecord("assessment_objectives", row, () => open.current(row))}
      searchLabel="Find objectives"
      empty={empty}
      filters={<DataTable.Filter table={table} column="campaign" options={campaignOptions} />}
      commands={[{ label: "Export objectives", onSelect: exportObjectives, disabled: exporting }]}
      action={action}
    />
  );
}
