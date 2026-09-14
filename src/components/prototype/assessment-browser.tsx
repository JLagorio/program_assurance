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
import { AssessmentTable } from "./assessment-table";
import {
  DetailFacts,
  ModelForm,
  QueryState,
  RecordActions,
  SchemaLink,
  StatusBadge,
  type FormTarget,
} from "./work-common";

type AssessmentKind = "Campaigns" | "Events" | "Objectives";
const tables: Record<AssessmentKind, FormTarget["table"]> = {
  Campaigns: "assessment_campaigns",
  Events: "assessment_events",
  Objectives: "assessment_objectives",
};
const nouns: Record<AssessmentKind, string> = {
  Campaigns: "campaign",
  Events: "event",
  Objectives: "objective",
};

/** Campaigns, their events and their objectives: three registers under one tab strip, each on the kit's table with its own search, chips and create action. Choosing a campaign opens its events with the Campaign chip already set. */
export function AssessmentBrowser({ programId }: { programId?: string }) {
  const workspace = useWorkspace();
  const campaigns = useRows("assessment_campaigns", programId ? { program_id: programId } : {});
  const plans = useRows("assessment_plan_revisions");
  const events = useRows("assessment_events");
  const objectives = useRows("assessment_objectives");
  const programs = useRows("programs");
  const parties = useRows("parties");
  const [tab, setTab] = useState<AssessmentKind>("Campaigns");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [form, setForm] = useState<FormTarget | null>(null);
  const [selection, setSelection] = useState<FormTarget | null>(null);
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
  const chosen = campaignId ? campaignTitle(campaignId) : null;
  const campaignFilter = chosen ? [{ id: "campaign", value: [chosen] }] : undefined;
  const selected = selection?.existing;
  function edit(target: FormTarget) {
    setSelection(null);
    setForm(target);
  }
  const add = (kind: AssessmentKind, size: "small" | "medium") =>
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
        Add {nouns[kind]}
      </Button>
    ) : undefined;
  return (
    <Stack space="space.200">
      {form && <ModelForm target={form} onClose={() => setForm(null)} />}
      <QueryState queries={[campaigns, plans, events, objectives, programs, parties]}>
        <Tabs value={tab} onValueChange={(value) => setTab(value as AssessmentKind)}>
          <TabsList className="w-full justify-start" variant="line" activateOnFocus>
            {(["Campaigns", "Events", "Objectives"] as const).map((name) => (
              <TabsTrigger value={name} key={name}>
                {name}
                <Count
                  value={
                    name === "Campaigns"
                      ? campaignRows.length
                      : name === "Events"
                        ? eventRows.length
                        : objectiveRows.length
                  }
                />
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="Campaigns" className="pt-200">
            <AssessmentTable
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
                  value: (row) =>
                    (events.data ?? []).filter((event) => event.campaign_id === row.id).length,
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
              onSelect={(row) => {
                setCampaignId(row.id);
                setTab("Events");
              }}
            />
          </TabsContent>
          <TabsContent value="Events" className="pt-200">
            <AssessmentTable
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
              onSelect={(row) => {
                if (!form)
                  setSelection({ table: "assessment_events", existing: row as DataRecord });
              }}
            />
          </TabsContent>
          <TabsContent value="Objectives" className="pt-200">
            <AssessmentTable
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
              onSelect={(row) => {
                if (!form)
                  setSelection({ table: "assessment_objectives", existing: row as DataRecord });
              }}
            />
          </TabsContent>
        </Tabs>
      </QueryState>
      {selected && selection && !form && (
        <Shell.Panel title={String(selected["title"])} onClose={() => setSelection(null)}>
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
            <RecordActions
              table={selection.table}
              id={selected.id}
              onEdit={() => edit(selection)}
            />
          </Stack>
        </Shell.Panel>
      )}
    </Stack>
  );
}
