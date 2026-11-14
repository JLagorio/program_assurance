import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  Button,
  Count,
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
  useLedgerLocale,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import {
  compareObjectives,
  objectiveTarget,
  useAssessmentObjectiveRows,
} from "@/lib/assessment-objectives";
import { useRows, type Row } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { StatusBadge, LevelIndicator } from "@/components/app/status";
import { campaignStatuses, impactLevels } from "@/lib/status";
import { type DataRecord } from "@/lib/records";
import { productCreateLabel, productRecordNoun } from "@/lib/product-records";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useEndOnHide,
} from "./record-preview";
import { AssessmentTable } from "./assessment-table";
import type { AssessmentKind } from "./assessment-tabs";
import { ProgramCollection } from "./program-shared";
import { RelationName } from "./record-tools";
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
  const plans = useRows("assessment_plan_revisions", inCampaigns);
  const events = useRows("assessment_events", inCampaigns);
  // The objectives come with their campaign, their target's words and their place in the catalog's
  // reading order, from their view.
  const objectives = useAssessmentObjectiveRows(programId ? { program_id: programId } : {});
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
  // Each campaign's objectives together, by the campaign's title, each plan's together, the newest
  // first (two plans alike by their id), and each plan's in the catalog's reading order: AC-08a.01
  // before AC-08a.02, a heading before the objectives under it, AC-2 before AC-10.
  const objectiveRows = (objectives.data ?? [])
    .filter((objective) => planRows.some((plan) => plan.id === objective.plan_revision_id))
    .map((objective) => {
      const plan = planOf(objective.plan_revision_id);
      return {
        ...objective,
        campaign: campaignName(plan?.campaign_id),
        plan: plan?.title ?? null,
        planVersion: plan?.version_number ?? 0,
      };
    })
    .sort(
      (a, b) =>
        campaignOrder(a.campaign, b.campaign) ||
        b.planVersion - a.planVersion ||
        a.plan_revision_id.localeCompare(b.plan_revision_id) ||
        compareObjectives(a, b),
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
    Objectives: campaigns.data && plans.data && objectives.data && objectiveRows.length,
    Scopes: systems.data && scopes.data && scopeRows.length,
  };
  // The preview reads the record as the registers have it now, so an edit saved from it shows.
  const live: Record<AssessmentRecordKind, DataRecord[]> = {
    Campaigns: campaignRows as unknown as DataRecord[],
    Events: eventRows as unknown as DataRecord[],
    Objectives: objectiveRows as unknown as DataRecord[],
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
    ([campaigns, events, objectives] as const)
      .flatMap((query) => (query.data ?? []) as unknown as DataRecord[])
      .find((row) => row.id === record.id) ?? record;
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
  const planLink = (id: unknown) =>
    typeof id === "string" && id ? (
      <RecordLink table="assessment_plan_revisions" record={{ id }}>
        {planOf(id)?.title ?? "Assessment plan revision"}
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
    return (
      <>
        <Described label="Statement" text={record["description"]} />
        <DetailFacts
          facts={[
            ["Acceptance criterion", record["acceptance_criterion"] as string | null],
            ["Campaign", campaignLink(planOf(record["plan_revision_id"])?.campaign_id)],
            ["Assessment plan", planLink(record["plan_revision_id"])],
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
    <AssessmentTable
      model="assessment_objectives"
      selectedId={selection?.table === "assessment_objectives" ? selection.existing?.id : undefined}
      onDisplayedRowsChange={(rows) =>
        setDisplayed((previous) => ({
          ...previous,
          assessment_objectives: rows as DataRecord[],
        }))
      }
      key={campaignId ?? "all"}
      fill={!sectioned}
      compact={sectioned}
      label="Objectives"
      view="assessment-objectives"
      keepQuestion={`assessment-objectives-${campaignId ?? "all"}`}
      rows={objectiveRows}
      queries={[objectives, plans, campaigns]}
      filters={["campaign"]}
      initialFilters={campaignFilter}
      actions={add("Objectives", "small")}
      empty={{
        illustration: "shield",
        title: "No objectives yet",
        description:
          "Record what each assessment plan sets out to show, and the control or requirement it targets.",
        action: add("Objectives", "medium"),
      }}
      columns={[
        { label: "Objective", key: "title" },
        { label: "Statement", key: "description" },
        {
          label: "Campaign",
          key: "campaign",
          value: (row) => row.campaign ?? <Absent label="Not available" />,
          width: 190,
        },
        {
          label: "Plan",
          key: "plan",
          value: (row) => row.plan ?? <Absent label="Not available" />,
          width: 190,
        },
        {
          label: "Target",
          // An assessment objective by its label (AC-08a.01), the control's statement as Control
          // statement, a requirement revision as Requirement revision.
          value: (row) => {
            const target = objectiveTarget(row);
            return target ? (
              <RecordLink table={target.table} record={{ id: target.id }}>
                {target.label}
              </RecordLink>
            ) : (
              <Absent />
            );
          },
          width: 170,
        },
      ]}
      onPreview={inspect("assessment_objectives")}
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
