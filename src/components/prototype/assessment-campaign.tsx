import { campaignTabs, type CampaignTab } from "./assessment-tabs";
import { useRef, useState, type ReactNode } from "react";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Count,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HeadingLevelProvider,
  IconButton,
  Person,
  Prose,
  Section,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
  EmptyIllustration,
  DateTime,
  toast,
} from "@ledger/design-system";
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Eye,
  FileText,
  History,
  ListChecks,
  ListOrdered,
  ListTodo,
  MoreHorizontal,
  Target,
} from "lucide-react";
import { idSet, useModelSave, useRow, useRows, type Row, type TableName } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import { useConfirmation } from "@/components/app/confirmation";
import { StatusBadge } from "@/components/app/status";
import { revisionStates, stepDeterminations, testRunStatuses } from "@/lib/status";
import { productCreateLabel, productRecordNoun } from "@/lib/product-records";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { AssessmentTable } from "./assessment-table";
import { ModelFacts, RelationName, type DisplayColumn } from "./record-tools";
import {
  DetailFacts,
  DueDate,
  ModelForm,
  QueryState,
  SchemaLink,
  type FormTarget,
  type QueryStatus,
} from "./work-common";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Focus on an element that is not a control, once, when the control that had focus goes away. */
function focusLanding(target: HTMLElement) {
  if (!target.hasAttribute("tabindex")) {
    target.tabIndex = -1;
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
  }
  target.focus();
}

/** Authored text under its name, or a labelled Absent when there is none. */
function Described({ label, text }: { label: string; text: unknown }) {
  return <Prose label={label}>{typeof text === "string" && text.trim() ? text : <Absent />}</Prose>;
}

/** A pinned SSP revision by its version, never its id. */
function SspVersion({ id }: { id: string }) {
  const query = useRow("ssp_revisions", id);
  const label =
    query.data?.version_number !== undefined
      ? `SSP version ${query.data.version_number}`
      : query.isError
        ? "Pinned SSP revision"
        : "SSP revision";
  return (
    <SchemaLink table="ssp_revisions" id={id}>
      {label}
    </SchemaLink>
  );
}

export function AssessmentCampaign({
  campaign,
  overview,
  tab,
  onTab,
}: {
  campaign: Row<"assessment_campaigns">;
  overview?: ReactNode;
  tab: CampaignTab;
  onTab: (tab: CampaignTab) => void;
}) {
  const workspace = useWorkspace();
  const plans = useRows("assessment_plan_revisions", { campaign_id: campaign.id });
  const events = useRows("assessment_events", { campaign_id: campaign.id });
  // A plan's content is read through the campaign's plans, joined on the server: never every
  // plan's objectives, activities and scheduled tasks in the workspace.
  const inCampaign = { "assessment_plan_revisions.campaign_id": campaign.id };
  const objectives = useRows("assessment_objectives", inCampaign);
  const activities = useRows("assessment_activities", inCampaign);
  const scheduled = useRows("scheduled_assessment_tasks", inCampaign);
  const procedures = useRows("procedures");
  const revisions = useRows("procedure_revisions");
  const runs = useRows("test_runs");
  const parties = useRows("parties", undefined, { columns: ["id", "name"] });
  const [form, setForm] = useState<FormTarget | null>(null);
  const [selection, setSelection] = useState<FormTarget | null>(null);
  const [displayed, setDisplayed] = useState<Record<string, DataRecord[]>>({});
  // A name the reader cannot see stays null, so it sorts last and its cell says Absent.
  const partyName = (id: string | null | undefined) =>
    id ? (parties.data?.find((party) => party.id === id)?.name ?? null) : null;
  const planRows = [...(plans.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const planTitle = (id: string | null | undefined) =>
    planRows.find((plan) => plan.id === id)?.title ?? null;
  const inPlans = (id: string | null | undefined) => planRows.some((plan) => plan.id === id);
  const objectiveRows = (objectives.data ?? [])
    .filter((row) => inPlans(row.plan_revision_id))
    .map((row) => ({ ...row, plan: planTitle(row.plan_revision_id) }));
  const activityRows = (activities.data ?? [])
    .filter((row) => inPlans(row.plan_revision_id))
    .map((row) => ({
      ...row,
      plan: planTitle(row.plan_revision_id),
      methodLabel: labelFor(row.method),
    }));
  const scheduledRows = (scheduled.data ?? [])
    .filter((row) => inPlans(row.plan_revision_id))
    .map((row) => ({ ...row, owner: partyName(row.owner_party_id) }));
  const runRows = (runs.data ?? [])
    .filter(
      (row) =>
        inPlans(row.plan_revision_id) ||
        events.data?.some((event) => event.id === row.assessment_event_id),
    )
    .map((row) => ({
      ...row,
      procedure:
        revisions.data?.find((revision) => revision.id === row.procedure_revision_id)?.title ??
        null,
      assessor: partyName(row.assessor_party_id),
    }));
  const procedureRows = (procedures.data ?? [])
    .filter(
      (row) =>
        row.program_id === campaign.program_id ||
        row.program_id === null ||
        runRows.some((run) =>
          revisions.data?.some(
            (revision) =>
              revision.id === run.procedure_revision_id && revision.procedure_id === row.id,
          ),
        ),
    )
    .map((row) => ({
      ...row,
      versions: (revisions.data ?? []).filter((revision) => revision.procedure_id === row.id)
        .length,
    }));
  const revisionRows = (revisions.data ?? [])
    .filter((row) => procedureRows.some((procedure) => procedure.id === row.procedure_id))
    .map((row) => ({ ...row, methodLabel: labelFor(row.method) }));
  const writable = workspace.role !== "viewer";
  const draftPlan = planRows.find((row) => row.state === "draft");
  // The preview reads the stored record, so an edit saved under it shows and the edit form gets no
  // derived names.
  const stored: Partial<Record<TableName, DataRecord[] | undefined>> = {
    assessment_plan_revisions: plans.data as DataRecord[] | undefined,
    assessment_events: events.data as DataRecord[] | undefined,
    assessment_objectives: objectives.data as DataRecord[] | undefined,
    assessment_activities: activities.data as DataRecord[] | undefined,
    scheduled_assessment_tasks: scheduled.data as DataRecord[] | undefined,
    procedures: procedures.data as DataRecord[] | undefined,
    procedure_revisions: revisions.data as DataRecord[] | undefined,
    test_runs: runs.data as DataRecord[] | undefined,
  };
  const selected =
    selection?.existing &&
    (stored[selection.table]?.find((row) => row.id === selection.existing!.id) ??
      selection.existing);
  function edit(target: FormTarget) {
    // The preview stays open under the dialog, so closing it returns to the preview's action.
    if (form) return;
    setForm(target);
  }
  const inspect = (table: TableName) => (row: object) =>
    setSelection({ table, existing: row as DataRecord });
  const keep = (table: TableName) => (rows: object[]) =>
    setDisplayed((previous) => ({ ...previous, [table]: rows as DataRecord[] }));
  /** Why a plan's content cannot be created yet, in the words of what to do first. */
  const planReason = (planContent: boolean) =>
    plans.isPending
      ? "The assessment plans are still loading."
      : plans.isError
        ? "The assessment plans could not be loaded."
        : planContent && !draftPlan
          ? "Create a draft assessment plan revision first."
          : !planContent && !planRows[0]
            ? "Create an assessment plan revision first."
            : undefined;
  function add(target: FormTarget) {
    const planContent = [
      "assessment_objectives",
      "assessment_activities",
      "scheduled_assessment_tasks",
    ].includes(target.table);
    const needsPlan =
      planContent || target.table === "assessment_events" || target.table === "test_runs";
    const plan = planContent ? draftPlan : planRows[0];
    const reason = needsPlan ? planReason(planContent) : undefined;
    const contextual =
      needsPlan && plan
        ? { ...target, initialValues: { plan_revision_id: plan.id, ...target.initialValues } }
        : target;
    return writable ? (
      <Button
        size="small"
        variant="primary"
        {...(reason ? { disabledReason: reason } : {})}
        onClick={() => edit(contextual)}
      >
        {productCreateLabel(target.table)}
      </Button>
    ) : undefined;
  }
  /** The empty line for a plan's content: what it is, and the plan it waits for. */
  const planEmpty = (what: string) =>
    draftPlan
      ? what
      : writable
        ? `${what} It belongs to a draft assessment plan revision: create one under Assessment plans first.`
        : `${what} It belongs to a draft assessment plan revision.`;
  // Counted once the rows it reads are here: a load that failed has no count, never 0.
  const runsReady = !!runs.data && !!plans.data && !!events.data;
  const noun = (table: TableName) => capitalize(productRecordNoun(table));
  return (
    <Stack space="space.200">
      {form && <ModelForm target={form} onClose={() => setForm(null)} />}
      <Tabs value={tab} onValueChange={(value) => onTab(value as CampaignTab)}>
        <TabsList variant="line" aria-label="Campaign sections">
          {campaignTabs.map((name) => (
            <TabsTrigger value={name} key={name}>
              {name}
              {/* Every strip counts the same way: 0 once the rows load, and up to 9999. */}
              {name === "Runs" && runsReady ? <Count value={runRows.length} max={9999} /> : null}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Each tab is a failure region: an outage reads as one alert at its top, whose Retry
            reloads every failed read in it. */}
        <TabsContent value="Overview">
          <QueryState region>{overview}</QueryState>
        </TabsContent>
        <TabsContent value="Execution" keepMounted>
          <QueryState region>
            <Stack space="space.300">
              <Section title="Assessment plans">
                <AssessmentTable
                  queries={[plans]}
                  actions={add({
                    table: "assessment_plan_revisions",
                    initialValues: {
                      campaign_id: campaign.id,
                      version_number: (planRows[0]?.version_number ?? 0) + 1,
                    },
                  })}
                  model="assessment_plan_revisions"
                  selectedId={
                    selection?.table === "assessment_plan_revisions"
                      ? selection.existing?.id
                      : undefined
                  }
                  onDisplayedRowsChange={keep("assessment_plan_revisions")}
                  compact
                  label="Assessment plans"
                  empty={{
                    icon: <FileText />,
                    description:
                      "An assessment plan revision pins the SSP it assesses and holds the objectives, activities and tasks.",
                  }}
                  rows={planRows}
                  columns={[
                    { key: "title", label: "Plan" },
                    { key: "version_number", label: "Version", kind: "number", width: 100 },
                    {
                      key: "state",
                      label: "State",
                      statuses: revisionStates,
                      width: 130,
                      priority: 1,
                    },
                    {
                      label: "SSP revision",
                      value: (row) => <SspVersion id={row.ssp_revision_id} />,
                      width: 145,
                    },
                  ]}
                  onPreview={inspect("assessment_plan_revisions")}
                />
              </Section>
              <Section title="Events">
                <AssessmentTable
                  queries={[events, plans]}
                  actions={add({
                    table: "assessment_events",
                    initialValues: { campaign_id: campaign.id },
                  })}
                  model="assessment_events"
                  selectedId={
                    selection?.table === "assessment_events" ? selection.existing?.id : undefined
                  }
                  onDisplayedRowsChange={keep("assessment_events")}
                  compact
                  label="Events"
                  empty={{
                    icon: <CalendarDays />,
                    illustration: "calendar",
                    description: planRows[0]
                      ? "An event schedules a window of assessment work in this campaign."
                      : "An event schedules a window of assessment work under an assessment plan revision: create one under Assessment plans first.",
                  }}
                  rows={events.data ?? []}
                  columns={[
                    { key: "title", label: "Event" },
                    { key: "status", label: "Status", width: 130, priority: 1 },
                    { key: "starts_at", label: "Starts", width: 140 },
                    { key: "ends_at", label: "Ends", width: 140 },
                  ]}
                  onPreview={inspect("assessment_events")}
                />
              </Section>
              <Section title="Objectives">
                <AssessmentTable
                  queries={[plans, objectives]}
                  actions={add({ table: "assessment_objectives" })}
                  model="assessment_objectives"
                  selectedId={
                    selection?.table === "assessment_objectives"
                      ? selection.existing?.id
                      : undefined
                  }
                  onDisplayedRowsChange={keep("assessment_objectives")}
                  compact
                  label="Objectives"
                  empty={{
                    icon: <Target />,
                    illustration: "shield",
                    description: planEmpty("An objective says what the plan sets out to show."),
                  }}
                  rows={objectiveRows}
                  columns={[
                    { key: "title", label: "Objective" },
                    { key: "acceptance_criterion", label: "Acceptance criterion" },
                    {
                      key: "plan",
                      label: "Plan",
                      value: (row) => row.plan ?? <Absent label="Not available" />,
                      width: 180,
                    },
                  ]}
                  onPreview={inspect("assessment_objectives")}
                />
              </Section>
              <Section title="Activities">
                <AssessmentTable
                  queries={[plans, activities]}
                  actions={add({ table: "assessment_activities" })}
                  model="assessment_activities"
                  selectedId={
                    selection?.table === "assessment_activities"
                      ? selection.existing?.id
                      : undefined
                  }
                  onDisplayedRowsChange={keep("assessment_activities")}
                  compact
                  label="Activities"
                  empty={{
                    icon: <ListChecks />,
                    description: planEmpty(
                      "An activity records how an objective is examined, interviewed or tested.",
                    ),
                  }}
                  rows={activityRows}
                  columns={[
                    { key: "title", label: "Activity" },
                    { key: "methodLabel", label: "Method", width: 140 },
                    {
                      key: "plan",
                      label: "Plan",
                      value: (row) => row.plan ?? <Absent label="Not available" />,
                      width: 180,
                    },
                  ]}
                  onPreview={inspect("assessment_activities")}
                />
              </Section>
              <Section title="Scheduled assessment tasks">
                <AssessmentTable
                  queries={[plans, scheduled, parties]}
                  actions={add({ table: "scheduled_assessment_tasks" })}
                  model="scheduled_assessment_tasks"
                  selectedId={
                    selection?.table === "scheduled_assessment_tasks"
                      ? selection.existing?.id
                      : undefined
                  }
                  onDisplayedRowsChange={keep("scheduled_assessment_tasks")}
                  compact
                  label="Scheduled assessment tasks"
                  empty={{
                    icon: <ListTodo />,
                    illustration: "tasks",
                    description: planEmpty("A scheduled task assigns assessment work to an owner."),
                  }}
                  rows={scheduledRows}
                  columns={[
                    { key: "title", label: "Task" },
                    { key: "status", label: "Status", width: 130, priority: 1 },
                    {
                      key: "owner",
                      label: "Owner",
                      kind: "person",
                      value: (row) =>
                        row.owner ? (
                          <Person name={row.owner} />
                        ) : (
                          <Absent label={row.owner_party_id ? "Not available" : "Not recorded"} />
                        ),
                      width: 180,
                    },
                    // A calendar day, overdue once it is before the reader's today while the task
                    // is still to do; a completed task's day reads plainly. Wide enough for the day
                    // and where it stands ("Oct 4, 2026 · Due in 2 days") on one line.
                    {
                      key: "due_on",
                      label: "Due",
                      minWidth: 200,
                      value: (row) => <ScheduledDue due={row.due_on} status={row.status} />,
                    },
                  ]}
                  onPreview={inspect("scheduled_assessment_tasks")}
                />
              </Section>
            </Stack>
          </QueryState>
        </TabsContent>
        <TabsContent value="Procedures" keepMounted>
          <QueryState region>
            <Stack space="space.300">
              <Section title="Procedures">
                <AssessmentTable
                  queries={[procedures, revisions, runs, events, plans]}
                  actions={add({
                    table: "procedures",
                    initialValues: { program_id: campaign.program_id },
                  })}
                  model="procedures"
                  selectedId={
                    selection?.table === "procedures" ? selection.existing?.id : undefined
                  }
                  onDisplayedRowsChange={keep("procedures")}
                  compact
                  label="Procedures"
                  empty={{
                    icon: <ClipboardList />,
                    description:
                      "A procedure describes a repeatable test; its revisions hold the method and the steps.",
                  }}
                  rows={procedureRows}
                  columns={[
                    { key: "title", label: "Procedure" },
                    { key: "description", label: "Description" },
                    { key: "versions", label: "Versions", kind: "number", width: 112 },
                  ]}
                  onPreview={inspect("procedures")}
                />
              </Section>
              <Section title="Procedure revisions">
                <AssessmentTable
                  queries={[procedures, revisions, runs, events, plans]}
                  actions={add({ table: "procedure_revisions" })}
                  model="procedure_revisions"
                  selectedId={
                    selection?.table === "procedure_revisions" ? selection.existing?.id : undefined
                  }
                  onDisplayedRowsChange={keep("procedure_revisions")}
                  compact
                  label="Procedure revisions"
                  empty={{
                    icon: <History />,
                    description:
                      "A revision fixes a procedure's method, preconditions and steps for the runs that use it.",
                  }}
                  rows={revisionRows}
                  columns={[
                    { key: "title", label: "Revision" },
                    { key: "version_number", label: "Version", kind: "number", width: 100 },
                    { key: "methodLabel", label: "Method", width: 140 },
                    {
                      key: "state",
                      label: "State",
                      statuses: revisionStates,
                      width: 130,
                      priority: 1,
                    },
                  ]}
                  onPreview={inspect("procedure_revisions")}
                />
              </Section>
            </Stack>
          </QueryState>
        </TabsContent>
        <TabsContent value="Runs" keepMounted>
          <QueryState region>
            <AssessmentTable
              model="test_runs"
              fill
              queries={[runs, events, plans, revisions, parties]}
              actions={add({ table: "test_runs" })}
              selectedId={selection?.table === "test_runs" ? selection.existing?.id : undefined}
              onDisplayedRowsChange={keep("test_runs")}
              label="Test runs"
              empty={{
                illustration: "tasks",
                description: planRows[0]
                  ? "A test run records one execution of a procedure revision against a configuration baseline."
                  : "A test run executes a procedure under an assessment plan revision: create one on the Execution tab first.",
              }}
              rows={runRows}
              columns={[
                { key: "title", label: "Run" },
                {
                  key: "procedure",
                  label: "Procedure revision",
                  value: (row) => row.procedure ?? <Absent label="Not available" />,
                },
                {
                  key: "status",
                  label: "Status",
                  statuses: testRunStatuses,
                  width: 125,
                  priority: 1,
                },
                {
                  key: "assessor",
                  label: "Assessor",
                  kind: "person",
                  value: (row) =>
                    row.assessor ? (
                      <Person name={row.assessor} />
                    ) : (
                      <Absent label={row.assessor_party_id ? "Not available" : "Not recorded"} />
                    ),
                  width: 170,
                },
                { key: "completed_at", label: "Completed", width: 140 },
              ]}
              onPreview={inspect("test_runs")}
            />
          </QueryState>
        </TabsContent>
        <TabsContent value="Regression" keepMounted>
          <QueryState queries={[runs, events, plans]} region>
            <RegressionComparison runs={runRows} />
          </QueryState>
        </TabsContent>
      </Tabs>
      {selection && selected && (
        <CampaignInspector
          target={{ table: selection.table, existing: selected }}
          onEdit={edit}
          renderFrame={({ content, actions }) => (
            <RecordPreviewPanel
              title={String(selected["title"] ?? noun(selection.table))}
              label={`${noun(selection.table)} preview`}
              defaultWidth={640}
              onClose={() => setSelection(null)}
              recordActions={actions}
              navigation={
                <RecordPreviewActions
                  table={selection.table}
                  record={selected}
                  rows={displayed[selection.table] ?? []}
                  onSelect={(row) => setSelection({ table: selection.table, existing: row })}
                />
              }
            >
              {/* The preview's record title is its h2; its sections sit under it. */}
              <HeadingLevelProvider level={3}>{content}</HeadingLevelProvider>
            </RecordPreviewPanel>
          )}
        />
      )}
    </Stack>
  );
}

type InspectorFrame = (frame: { content: ReactNode; actions: ReactNode }) => ReactNode;

/** A window's start or end reads in days, as the tables show it. */
const day = (key: string, label: string): DisplayColumn => ({
  key,
  label,
  render: (row) =>
    typeof row[key] === "string" && row[key] ? (
      <DateTime value={row[key] as string} format="date" />
    ) : (
      <Absent />
    ),
});
/**
 * When a scheduled assessment task is due, and where it stands: overdue, due today and due soon
 * say so beside the day until it is completed; a cancelled task's day has no state.
 */
function ScheduledDue({ due, status }: { due: unknown; status: unknown }) {
  return <DueDate value={due} done={status === "completed"} cancelled={status === "cancelled"} />;
}
const owner: DisplayColumn = {
  key: "owner_party_id",
  label: "Owner",
  render: (row) => <RelationName table="parties" id={row["owner_party_id"] as string | null} />,
};
/** The facts each assessment record reads by, in the order a reader asks. */
const inspectorFacts: Partial<Record<TableName, DisplayColumn[]>> = {
  assessment_plan_revisions: [
    { key: "state", label: "State" },
    { key: "version_number", label: "Version" },
    {
      key: "ssp_revision_id",
      label: "SSP revision",
      render: (row) => <SspVersion id={String(row["ssp_revision_id"])} />,
    },
    { key: "published_at", label: "Published" },
  ],
  assessment_events: [
    { key: "status", label: "Status" },
    day("starts_at", "Starts"),
    day("ends_at", "Ends"),
    { key: "location", label: "Location" },
  ],
  assessment_objectives: [{ key: "acceptance_criterion", label: "Acceptance criterion" }],
  assessment_activities: [{ key: "method", label: "Method" }],
  scheduled_assessment_tasks: [
    { key: "status", label: "Status" },
    owner,
    day("starts_at", "Starts"),
    {
      key: "due_on",
      label: "Due",
      render: (row) => <ScheduledDue due={row["due_on"]} status={row["status"]} />,
    },
  ],
  procedures: [owner],
};

function CampaignInspector({
  target,
  onEdit,
  renderFrame,
}: {
  target: FormTarget;
  onEdit: (target: FormTarget) => void;
  renderFrame: InspectorFrame;
}) {
  const workspace = useWorkspace();
  const record = target.existing!;
  if (target.table === "procedure_revisions")
    return (
      <ProcedureInspector
        revision={record as Row<"procedure_revisions">}
        onEdit={onEdit}
        renderFrame={renderFrame}
      />
    );
  if (target.table === "test_runs")
    return <RunInspector id={record.id} onEdit={onEdit} renderFrame={renderFrame} />;
  const writable = workspace.role !== "viewer";
  const draft = record["state"] !== "published";
  const relatedAction =
    target.table === "procedures"
      ? {
          label: "Create procedure revision",
          onClick: () =>
            onEdit({ table: "procedure_revisions", initialValues: { procedure_id: record.id } }),
        }
      : target.table === "assessment_events"
        ? {
            label: productCreateLabel("test_runs"),
            onClick: () =>
              onEdit({
                table: "test_runs",
                initialValues: {
                  assessment_event_id: record.id,
                  plan_revision_id: record["plan_revision_id"] ?? null,
                },
              }),
          }
        : null;
  const planContentTables =
    target.table === "assessment_plan_revisions"
      ? ([
          "assessment_objectives",
          "assessment_activities",
          "scheduled_assessment_tasks",
          "assessment_subjects",
        ] as const)
      : [];
  return renderFrame({
    actions: writable && (
      <>
        {draft ? (
          <Button size="small" variant="primary" onClick={() => onEdit(target)}>
            Edit {productRecordNoun(target.table)}
          </Button>
        ) : relatedAction ? (
          <Button size="small" variant="primary" onClick={relatedAction.onClick}>
            {relatedAction.label}
          </Button>
        ) : null}
        {draft && (relatedAction || planContentTables.length > 0) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <IconButton
                  icon={<MoreHorizontal />}
                  label="More actions"
                  size="small"
                  variant="subtle"
                />
              }
            />
            <DropdownMenuContent align="end">
              {relatedAction && (
                <DropdownMenuItem onClick={relatedAction.onClick}>
                  {relatedAction.label}
                </DropdownMenuItem>
              )}
              {planContentTables.map((table) => (
                <DropdownMenuItem
                  key={table}
                  onClick={() => onEdit({ table, initialValues: { plan_revision_id: record.id } })}
                >
                  {productCreateLabel(table)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </>
    ),
    content: (
      <Stack space="space.250">
        {"description" in record && (
          <Described
            label={target.table === "assessment_objectives" ? "Statement" : "Description"}
            text={record["description"]}
          />
        )}
        {(inspectorFacts[target.table]?.length ?? 0) > 0 && (
          <ModelFacts
            record={record}
            table={target.table}
            fields={inspectorFacts[target.table] ?? []}
          />
        )}
        {target.table === "assessment_activities" && (
          <ActivitySteps activity={record as Row<"assessment_activities">} onEdit={onEdit} />
        )}
      </Stack>
    ),
  });
}

function ActivitySteps({
  activity,
  onEdit,
}: {
  activity: Row<"assessment_activities">;
  onEdit: (target: FormTarget) => void;
}) {
  const workspace = useWorkspace();
  const steps = useRows("activity_steps", { activity_id: activity.id });
  const plan = useRow("assessment_plan_revisions", activity.plan_revision_id);
  const editable = workspace.role !== "viewer" && plan.data?.state === "draft";
  return (
    <Section title="Activity steps">
      <AssessmentTable<Row<"activity_steps">>
        queries={[steps, plan]}
        sort={false}
        actions={
          editable ? (
            <Button
              size="small"
              variant="primary"
              onClick={() =>
                onEdit({
                  table: "activity_steps",
                  initialValues: {
                    activity_id: activity.id,
                    plan_revision_id: activity.plan_revision_id,
                  },
                })
              }
            >
              Create activity step
            </Button>
          ) : undefined
        }
        model="activity_steps"
        readOnly={!editable}
        compact
        label="Activity steps"
        empty={{
          icon: <ListOrdered />,
          description: editable
            ? "A step says what to do and what to expect, in order."
            : "No steps were recorded for this activity.",
        }}
        rows={[...(steps.data ?? [])].sort((a, b) => a.sequence_number - b.sequence_number)}
        columns={[
          {
            key: "sequence_number",
            label: "Step",
            value: (row) => `Step ${row.sequence_number}`,
            width: 90,
          },
          { key: "instruction", label: "Instruction" },
          { key: "expected_result", label: "Expected" },
        ]}
        {...(editable
          ? {
              onEdit: (row) => onEdit({ table: "activity_steps", existing: row as DataRecord }),
            }
          : {})}
      />
    </Section>
  );
}

function ProcedureInspector({
  revision,
  onEdit,
  renderFrame,
}: {
  revision: Row<"procedure_revisions">;
  onEdit: (target: FormTarget) => void;
  renderFrame: InspectorFrame;
}) {
  const workspace = useWorkspace();
  const steps = useRows("procedure_steps", { procedure_revision_id: revision.id });
  const editable = workspace.role !== "viewer" && revision.state === "draft";
  return renderFrame({
    actions: editable && (
      <Button
        size="small"
        variant="primary"
        onClick={() => onEdit({ table: "procedure_revisions", existing: revision as DataRecord })}
      >
        Edit procedure revision
      </Button>
    ),
    content: (
      <Stack space="space.250">
        <Described label="Description" text={revision.description} />
        <DetailFacts
          facts={[
            ["State", <StatusBadge statuses={revisionStates} value={revision.state} />],
            ["Version", revision.version_number],
            ["Method", labelFor(revision.method)],
            ["Preconditions", revision.preconditions],
            ["Acceptance criterion", revision.acceptance_criterion],
          ]}
        />
        <Section title="Steps">
          <AssessmentTable<Row<"procedure_steps">>
            queries={[steps]}
            sort={false}
            actions={
              editable ? (
                <Button
                  size="small"
                  variant="primary"
                  onClick={() =>
                    onEdit({
                      table: "procedure_steps",
                      initialValues: { procedure_revision_id: revision.id },
                    })
                  }
                >
                  Create procedure step
                </Button>
              ) : undefined
            }
            model="procedure_steps"
            readOnly={!editable}
            compact
            label="Procedure steps"
            empty={{
              icon: <ListOrdered />,
              description: editable
                ? "A step says what to do and what to expect, in order."
                : "No steps were recorded for this revision.",
            }}
            rows={[...(steps.data ?? [])].sort((a, b) => a.sequence_number - b.sequence_number)}
            columns={[
              {
                key: "sequence_number",
                label: "Step",
                value: (row) => `Step ${row.sequence_number}`,
                width: 90,
              },
              { key: "instruction", label: "Instruction" },
              { key: "expected_result", label: "Expected result" },
            ]}
            {...(editable
              ? {
                  onEdit: (row) =>
                    onEdit({ table: "procedure_steps", existing: row as DataRecord }),
                }
              : {})}
          />
        </Section>
      </Stack>
    ),
  });
}

function RunInspector({
  id,
  onEdit,
  renderFrame,
}: {
  id: string;
  onEdit: (target: FormTarget) => void;
  renderFrame: InspectorFrame;
}) {
  const workspace = useWorkspace();
  const query = useRow("test_runs", id);
  const run = query.data;
  const results = useRows("step_results", { test_run_id: id });
  const steps = useRows(
    "procedure_steps",
    run ? { procedure_revision_id: run.procedure_revision_id } : {},
    { enabled: !!run },
  );
  const save = useModelSave("test_runs");
  const { confirm, confirmation } = useConfirmation();
  const [error, setError] = useState("");
  const body = useRef<HTMLElement>(null);
  const editable =
    workspace.role !== "viewer" && run && !["completed", "aborted"].includes(run.status);
  /** A completed run loses the actions Complete run sat among: focus goes to the preview's title. */
  const landOnTitle = () =>
    requestAnimationFrame(() => {
      let frame = body.current?.parentElement ?? null;
      while (frame && !frame.querySelector(":scope > [data-record-preview-header]"))
        frame = frame.parentElement;
      const title = frame?.querySelector<HTMLElement>(
        ":scope > [data-record-preview-header] :is(h1, h2, h3)",
      );
      const target = title ?? body.current;
      if (target) focusLanding(target);
    });
  const stepRows = [...(steps.data ?? [])]
    .sort((a, b) => a.sequence_number - b.sequence_number)
    .map((step) => {
      const result = results.data?.find((item) => item.procedure_step_id === step.id);
      return {
        ...step,
        determination: result?.determination ?? null,
        observed: result?.observed_behavior ?? null,
      };
    });
  async function complete() {
    if (!run || save.isPending) return;
    const confirmed = await confirm({
      title: "Complete this test run?",
      description:
        "A completed run records when it finished and can no longer be edited, nor its step results changed.",
      confirmLabel: "Complete run",
      variant: "primary",
    });
    if (!confirmed) return;
    setError("");
    try {
      await save.mutateAsync({
        id: run.id,
        revision: run.revision,
        values: { status: "completed", completed_at: new Date().toISOString() },
      });
      toast.add({ title: `${run.title} completed`, type: "success" });
      landOnTitle();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The run could not be completed.");
    }
  }
  return renderFrame({
    actions: editable && (
      <>
        {confirmation}
        <Button
          size="small"
          variant="primary"
          isLoading={save.isPending}
          onClick={() => void complete()}
        >
          Complete run
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <IconButton
                icon={<MoreHorizontal />}
                label="More actions"
                size="small"
                variant="subtle"
                disabled={save.isPending}
              />
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={save.isPending}
              onClick={() => onEdit({ table: "test_runs", existing: run as DataRecord })}
            >
              Edit test run
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    ),
    content: (
      <QueryState queries={[query]}>
        {run ? (
          <Stack space="space.250" ref={body}>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DetailFacts
              facts={[
                ["Status", <StatusBadge statuses={testRunStatuses} value={run.status} />],
                [
                  "Procedure revision",
                  <SchemaLink table="procedure_revisions" id={run.procedure_revision_id}>
                    <RelationName table="procedure_revisions" id={run.procedure_revision_id} />
                  </SchemaLink>,
                ],
                [
                  "Configuration baseline",
                  <SchemaLink table="configuration_baselines" id={run.configuration_baseline_id}>
                    <RelationName
                      table="configuration_baselines"
                      id={run.configuration_baseline_id}
                    />
                  </SchemaLink>,
                ],
                [
                  "Assessor",
                  run.assessor_party_id ? (
                    <RelationName table="parties" id={run.assessor_party_id} />
                  ) : null,
                ],
                ["Started", run.started_at ? <DateTime value={run.started_at} /> : null],
                ["Completed", run.completed_at ? <DateTime value={run.completed_at} /> : null],
                ["Conclusion", run.conclusion],
              ]}
            />
            <Section title="Step results">
              <AssessmentTable<(typeof stepRows)[number]>
                queries={[steps, results]}
                sort={false}
                model="procedure_steps"
                readOnly={!editable}
                compact
                label="Step results"
                empty={{
                  icon: <ListChecks />,
                  description: "The procedure revision this run follows has no steps recorded.",
                }}
                rows={stepRows}
                columns={[
                  {
                    key: "sequence_number",
                    label: "Step",
                    value: (row) => `Step ${row.sequence_number}`,
                    width: 90,
                  },
                  { key: "instruction", label: "Instruction" },
                  {
                    key: "determination",
                    label: "Determination",
                    statuses: stepDeterminations,
                    width: 145,
                    priority: 1,
                  },
                  { key: "observed", label: "Observed" },
                ]}
                {...(editable
                  ? {
                      onEdit: (row) => {
                        const existing = results.data?.find(
                          (item) => item.procedure_step_id === row.id,
                        );
                        onEdit(
                          existing
                            ? { table: "step_results", existing: existing as DataRecord }
                            : {
                                table: "step_results",
                                initialValues: {
                                  test_run_id: run.id,
                                  procedure_revision_id: run.procedure_revision_id,
                                  procedure_step_id: row.id,
                                  ...(run.assessor_party_id
                                    ? { assessor_party_id: run.assessor_party_id }
                                    : {}),
                                },
                              },
                        );
                      },
                    }
                  : {})}
              />
            </Section>
            <Section title="Observations">
              <RunObservations
                run={run}
                results={results}
                steps={steps.data ?? []}
                onEdit={onEdit}
              />
            </Section>
          </Stack>
        ) : (
          <Empty frame="none">
            <EmptyMedia aria-hidden>
              <EmptyIllustration kind="search" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Test run not found</EmptyTitle>
              <EmptyDescription>
                This run is unavailable in the current workspace. Close the preview to return to the
                runs.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </QueryState>
    ),
  });
}

function RunObservations({
  run,
  results,
  steps,
  onEdit,
}: {
  run: Row<"test_runs">;
  results: QueryStatus & { data?: Row<"step_results">[] | undefined };
  steps: Row<"procedure_steps">[];
  onEdit: (target: FormTarget) => void;
}) {
  const recorded = results.data ?? [];
  // Only the observations made at this run's step results, read on the server: never every
  // observation in the workspace. It waits for the results; none recorded asks for nothing.
  const observations = useRows(
    "observations",
    { step_result_id: idSet(recorded.map((result) => result.id)) },
    { enabled: results.data !== undefined, keepPrevious: true },
  );
  const workspace = useWorkspace();
  const rows = (observations.data ?? [])
    .filter(
      (row) => row.step_result_id && recorded.some((result) => result.id === row.step_result_id),
    )
    .map((row) => ({ ...row, methodLabel: labelFor(row.method) }));
  const writable = workspace.role !== "viewer";
  return (
    <AssessmentTable
      model="observations"
      queries={[observations, results]}
      readOnly={!writable}
      onEdit={
        writable
          ? (row) => onEdit({ table: "observations", existing: row as DataRecord })
          : undefined
      }
      actions={
        writable && recorded.length > 0 ? (
          // A collection under the run preview's header, which keeps the one primary.
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="small" variant="secondary" iconAfter={<ChevronDown />}>
                  Create observation
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {recorded.map((result) => {
                const step = steps.find((item) => item.id === result.procedure_step_id);
                return (
                  <DropdownMenuItem
                    key={result.id}
                    {...(step?.instruction ? { description: step.instruction } : {})}
                    onClick={() =>
                      onEdit({
                        table: "observations",
                        initialValues: {
                          step_result_id: result.id,
                          ...(run.assessment_event_id
                            ? { assessment_event_id: run.assessment_event_id }
                            : {}),
                          ...(run.assessor_party_id
                            ? { observer_party_id: run.assessor_party_id }
                            : {}),
                        },
                      })
                    }
                  >
                    {step ? `For step ${step.sequence_number}` : "For a step result"}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : undefined
      }
      compact
      label="Observations"
      empty={{
        icon: <Eye />,
        description: recorded.length
          ? "An observation records what the assessor saw at a step."
          : "Observations are recorded against step results: record a step's result first.",
      }}
      rows={rows}
      columns={[
        { key: "title", label: "Observation" },
        { key: "methodLabel", label: "Method", width: 110 },
        { key: "observed_at", label: "Observed", width: 135 },
      ]}
    />
  );
}

function RegressionComparison({ runs }: { runs: Row<"test_runs">[] }) {
  const results = useRows("step_results");
  const steps = useRows("procedure_steps");
  const completed = runs
    .filter((run) => run.status === "completed" && run.completed_at)
    .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!));
  const groups = new Map<string, Row<"test_runs">[]>();
  completed.forEach((run) => {
    const key = `${run.procedure_revision_id}/${run.configuration_baseline_id}`;
    groups.set(key, [...(groups.get(key) ?? []), run]);
  });
  const comparisons = [...groups.values()].flatMap((group) => {
    const current = group[0],
      previous = group[1];
    if (!current || !previous) return [];
    const currentResults = (results.data ?? []).filter(
      (result) => result.test_run_id === current.id,
    );
    const previousResults = (results.data ?? []).filter(
      (result) => result.test_run_id === previous.id,
    );
    return [
      ...new Set([...currentResults, ...previousResults].map((result) => result.procedure_step_id)),
    ].map((stepId) => {
      const step = steps.data?.find((item) => item.id === stepId);
      return {
        id: `${current.id}/${stepId}`,
        stepId,
        step: step ? `Step ${step.sequence_number}: ${step.instruction}` : "Procedure step",
        previousRun: previous.title,
        currentRun: current.title,
        before:
          previousResults.find((result) => result.procedure_step_id === stepId)?.determination ??
          null,
        after:
          currentResults.find((result) => result.procedure_step_id === stepId)?.determination ??
          null,
      };
    });
  });
  return (
    // The tab names the collection: the table starts it, and its columns say which runs compare.
    <Stack space="space.200">
      <AssessmentTable
        queries={[results, steps]}
        label="Run comparisons"
        empty={{
          title: "No comparable completed runs",
          description:
            "A comparison of the two latest completed runs appears once two runs of the same procedure revision and configuration baseline are completed.",
        }}
        rows={comparisons}
        columns={[
          {
            key: "step",
            label: "Step",
            value: (row) => (
              <SchemaLink table="procedure_steps" id={row.stepId}>
                {row.step}
              </SchemaLink>
            ),
          },
          { key: "previousRun", label: "Previous run" },
          { key: "before", label: "Previous determination", statuses: stepDeterminations },
          { key: "currentRun", label: "Latest run" },
          { key: "after", label: "Latest determination", statuses: stepDeterminations },
        ]}
      />
    </Stack>
  );
}
