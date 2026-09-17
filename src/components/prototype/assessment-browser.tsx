import { displayDate } from "./work-format";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Button,
  Count,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useRows } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { type DataRecord } from "@/lib/records";
import { productCreateLabel } from "@/lib/product-records";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { AssessmentTable } from "./assessment-table";
import { ProgramCollection } from "./program-shared";
import { RelationName } from "./record-tools";
import { ImpactBadge } from "./system-assurance-details";
import type { Impact } from "@/lib/system-assurance";
import {
  DetailFacts,
  ModelForm,
  QueryState,
  SchemaLink,
  StatusBadge,
  type FormTarget,
} from "./work-common";

type AssessmentKind = "Campaigns" | "Events" | "Objectives" | "Scopes";
type AssessmentRecordKind = Exclude<AssessmentKind, "Scopes">;
const tables: Record<AssessmentRecordKind, FormTarget["table"]> = {
  Campaigns: "assessment_campaigns",
  Events: "assessment_events",
  Objectives: "assessment_objectives",
};
const nouns: Record<AssessmentRecordKind, string> = {
  Campaigns: "campaign",
  Events: "event",
  Objectives: "objective",
};

/** Campaigns, their events, their objectives and, within a program, its assessment scopes: registers under one tab strip, each on the kit's table with its own search, chips and create action. Choosing a campaign opens its events with the Campaign chip already set. */
export function AssessmentBrowser({ programId }: { programId?: string }) {
  const workspace = useWorkspace();
  const campaigns = useRows("assessment_campaigns", programId ? { program_id: programId } : {});
  const plans = useRows("assessment_plan_revisions");
  const events = useRows("assessment_events");
  const objectives = useRows("assessment_objectives");
  const programs = useRows("programs");
  const parties = useRows("parties");
  const systems = useRows("systems", programId ? { program_id: programId } : {});
  const scopes = useRows("scopes");
  const [tab, setTab] = useState<AssessmentKind>("Campaigns");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [form, setForm] = useState<FormTarget | null>(null);
  const [selection, setSelection] = useState<FormTarget | null>(null);
  const [displayed, setDisplayed] = useState<Record<string, DataRecord[]>>({});
  const campaignRows = campaigns.data ?? [];
  const campaignTitle = (id: string | null | undefined) =>
    campaignRows.find((campaign) => campaign.id === id)?.title ?? "Unavailable campaign";
  const planRows = (plans.data ?? []).filter((plan) =>
    campaignRows.some((campaign) => campaign.id === plan.campaign_id),
  );
  const eventRows = (events.data ?? [])
    .filter((event) => campaignRows.some((campaign) => campaign.id === event.campaign_id))
    .map((event) => ({
      ...event,
      campaign: campaignTitle(event.campaign_id),
      plan: String(
        planRows.find((plan) => plan.id === event.plan_revision_id)?.version_number ??
          "Unavailable",
      ),
    }));
  const objectiveRows = (objectives.data ?? [])
    .filter((objective) => planRows.some((plan) => plan.id === objective.plan_revision_id))
    .map((objective) => {
      const plan = planRows.find((item) => item.id === objective.plan_revision_id);
      return {
        ...objective,
        campaign: campaignTitle(plan?.campaign_id),
        plan: plan?.title ?? "Unavailable plan",
      };
    });
  const systemIds = new Set((systems.data ?? []).map((system) => system.id));
  const scopeRows = (scopes.data ?? []).filter((scope) => systemIds.has(scope.system_id));
  const firstBoundary = (systems.data ?? []).find((system) => system.is_authorization_boundary);
  const kinds: AssessmentKind[] = programId
    ? ["Campaigns", "Events", "Objectives", "Scopes"]
    : ["Campaigns", "Events", "Objectives"];
  const chosen = campaignId ? campaignTitle(campaignId) : null;
  const campaignFilter = chosen ? [{ id: "campaign", value: [chosen] }] : undefined;
  const selected = selection?.existing;
  function edit(target: FormTarget) {
    setSelection(null);
    setForm(target);
  }
  const add = (kind: AssessmentRecordKind, size: "small" | "medium") =>
    workspace.role !== "viewer" ? (
      <Button
        size={size}
        variant="primary"
        iconBefore={<Plus />}
        disabled={!!form}
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
  return (
    <Stack space="space.200">
      {form && <ModelForm target={form} onClose={() => setForm(null)} />}
      <QueryState
        queries={[campaigns, plans, events, objectives, programs, parties, systems, scopes]}
      >
        <Tabs value={tab} onValueChange={(value) => setTab(value as AssessmentKind)}>
          <TabsList variant="line" activateOnFocus aria-label="Assessment collections">
            {kinds.map((name) => (
              <TabsTrigger value={name} key={name}>
                {name}
                <Count
                  value={
                    name === "Campaigns"
                      ? campaignRows.length
                      : name === "Events"
                        ? eventRows.length
                        : name === "Objectives"
                          ? objectiveRows.length
                          : scopeRows.length
                  }
                />
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="Campaigns" className="pt-200">
            <AssessmentTable
              model="assessment_campaigns"
              fill
              label="Campaigns"
              view="assessment-campaigns"
              rows={campaignRows}
              filters={["status"]}
              actions={add("Campaigns", "small")}
              empty={{
                illustration: "calendar",
                title: "No campaigns yet",
                description:
                  "Schedule an assessment campaign to plan its events and record their objectives.",
                action: add("Campaigns", "medium"),
              }}
              columns={[
                { label: "Campaign", key: "title", value: (row) => row.title },
                ...(programId
                  ? []
                  : [
                      {
                        label: "Program",
                        value: (row: (typeof campaignRows)[number]) =>
                          programs.data?.find((program) => program.id === row.program_id)?.name ??
                          "Unavailable program",
                        width: 180,
                      },
                    ]),
                {
                  label: "State",
                  key: "status",
                  value: (row) => <StatusBadge value={row.status} />,
                  width: 130,
                },
                {
                  label: "Lead",
                  value: (row) =>
                    row.owner_party_id
                      ? (parties.data?.find((party) => party.id === row.owner_party_id)?.name ??
                        "Unavailable person")
                      : "Not recorded",
                  width: 180,
                },
                {
                  label: "Starts",
                  key: "starts_at",
                  value: (row) => displayDate(row.starts_at),
                  width: 120,
                },
                {
                  label: "Ends",
                  key: "ends_at",
                  value: (row) => displayDate(row.ends_at),
                  width: 120,
                },
                {
                  label: "Events",
                  value: (row) => (
                    <Button
                      variant="link"
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        setCampaignId(row.id);
                        setTab("Events");
                      }}
                    >
                      Show{" "}
                      {(events.data ?? []).filter((event) => event.campaign_id === row.id).length}{" "}
                      events
                    </Button>
                  ),
                  width: 90,
                },
                {
                  label: "Open",
                  value: (row) => (
                    <TextLink
                      render={<Link to="/campaigns/$campaignId" params={{ campaignId: row.id }} />}
                    >
                      Open campaign
                    </TextLink>
                  ),
                  width: 145,
                },
              ]}
            />
          </TabsContent>
          <TabsContent value="Events" className="pt-200">
            <AssessmentTable
              model="assessment_events"
              selectedId={
                selection?.table === "assessment_events" ? selection.existing?.id : undefined
              }
              onDisplayedRowsChange={(rows) =>
                setDisplayed((previous) => ({
                  ...previous,
                  assessment_events: rows as DataRecord[],
                }))
              }
              key={campaignId ?? "all"}
              fill
              label="Events"
              view="assessment-events"
              rows={eventRows}
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
                { label: "Event", key: "title", value: (row) => row.title },
                { label: "Campaign", key: "campaign", value: (row) => row.campaign, width: 190 },
                { label: "Plan version", key: "plan", value: (row) => row.plan, width: 115 },
                {
                  label: "State",
                  key: "status",
                  value: (row) => <StatusBadge value={row.status} />,
                  width: 130,
                },
                {
                  label: "Starts",
                  key: "starts_at",
                  value: (row) => displayDate(row.starts_at),
                  width: 120,
                },
                {
                  label: "Ends",
                  key: "ends_at",
                  value: (row) => displayDate(row.ends_at),
                  width: 120,
                },
              ]}
              onPreview={(row) => {
                if (!form)
                  setSelection({ table: "assessment_events", existing: row as DataRecord });
              }}
            />
          </TabsContent>
          <TabsContent value="Objectives" className="pt-200">
            <AssessmentTable
              model="assessment_objectives"
              selectedId={
                selection?.table === "assessment_objectives" ? selection.existing?.id : undefined
              }
              onDisplayedRowsChange={(rows) =>
                setDisplayed((previous) => ({
                  ...previous,
                  assessment_objectives: rows as DataRecord[],
                }))
              }
              key={campaignId ?? "all"}
              fill
              label="Objectives"
              view="assessment-objectives"
              rows={objectiveRows}
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
                { label: "Objective", key: "title", value: (row) => row.title },
                {
                  label: "Statement",
                  key: "description",
                  value: (row) => row.description ?? "Not recorded",
                },
                { label: "Campaign", key: "campaign", value: (row) => row.campaign, width: 190 },
                { label: "Plan", key: "plan", value: (row) => row.plan, width: 190 },
                {
                  label: "Target",
                  value: (row) =>
                    row.target_control_part_id ? (
                      <SchemaLink table="control_parts" id={row.target_control_part_id}>
                        Control statement
                      </SchemaLink>
                    ) : row.requirement_revision_id ? (
                      <SchemaLink table="requirement_revisions" id={row.requirement_revision_id}>
                        Requirement revision
                      </SchemaLink>
                    ) : (
                      "Not recorded"
                    ),
                  width: 170,
                },
              ]}
              onPreview={(row) => {
                if (!form)
                  setSelection({ table: "assessment_objectives", existing: row as DataRecord });
              }}
            />
          </TabsContent>
          {programId && (
            <TabsContent value="Scopes" className="pt-200">
              <ProgramCollection
                name="scopes"
                fill
                title="Assessment scopes"
                where={(record) => systemIds.has(String(record["system_id"]))}
                initialValues={{ system_id: firstBoundary?.id ?? null }}
                columns={[
                  { key: "code", title: "Scope" },
                  { key: "name", title: "Name" },
                  {
                    key: "system_id",
                    title: "System",
                    render: (record) => (
                      <RelationName table="systems" id={String(record["system_id"])} />
                    ),
                  },
                  {
                    key: "composition_node_id",
                    title: "Element",
                    render: (record) =>
                      record["composition_node_id"] ? (
                        <RelationName table="systems" id={String(record["composition_node_id"])} />
                      ) : (
                        <span className="text-subtle">Whole system</span>
                      ),
                  },
                  ...(["confidentiality", "integrity", "availability"] as const).map(
                    (dimension) => ({
                      key: `${dimension}_impact`,
                      title:
                        dimension === "confidentiality"
                          ? "Conf."
                          : dimension === "integrity"
                            ? "Integ."
                            : "Avail.",
                      render: (record: DataRecord) => (
                        <ImpactBadge
                          value={(record[`${dimension}_impact`] as Impact | null) ?? null}
                        />
                      ),
                    }),
                  ),
                ]}
                createLabel="Add scope"
                empty={{
                  title: "No scopes yet",
                  description: "Add a scope to categorize a subset of a system for assessment.",
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </QueryState>
      {selected && selection && !form && (
        <RecordPreviewPanel
          title={String(selected["title"])}
          label="Assessment preview"
          defaultWidth={640}
          onClose={() => setSelection(null)}
          recordActions={
            workspace.role !== "viewer" && (
              <Button size="small" variant="primary" onClick={() => edit(selection)}>
                Edit record
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
          <Stack space="space.250">
            <Section title="Details">
              <p className="whitespace-pre-wrap pb-200">
                {String(selected["description"] ?? "No description recorded.")}
              </p>
              <DetailFacts
                facts={
                  selection.table === "assessment_events"
                    ? [
                        ["State", <StatusBadge value={String(selected["status"])} />],
                        ["Starts", displayDate(selected["starts_at"] as string | null)],
                        ["Ends", displayDate(selected["ends_at"] as string | null)],
                        ["Location", selected["location"] as string | null],
                        [
                          "Assessment plan",
                          <SchemaLink
                            table="assessment_plan_revisions"
                            id={String(selected["plan_revision_id"])}
                          >
                            Open plan revision
                          </SchemaLink>,
                        ],
                      ]
                    : [
                        ["Acceptance criterion", selected["acceptance_criterion"] as string | null],
                        [
                          "Plan",
                          <SchemaLink
                            table="assessment_plan_revisions"
                            id={String(selected["plan_revision_id"])}
                          >
                            Open plan revision
                          </SchemaLink>,
                        ],
                      ]
                }
              />
            </Section>
          </Stack>
        </RecordPreviewPanel>
      )}
    </Stack>
  );
}
