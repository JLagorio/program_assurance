import { campaignTabs, type CampaignTab } from "./assessment-tabs";
import { displayDate } from "./work-format";
import { useState, type ReactNode } from "react";
import {
  Button,
  Count,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Inline,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
  EmptyIllustration,
} from "@ledger/design-system";
import { MoreHorizontal } from "lucide-react";
import { useModelSave, useRow, useRows, type Row } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import { productCreateLabel, productRecordNoun } from "@/lib/product-records";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
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
  const objectives = useRows("assessment_objectives");
  const activities = useRows("assessment_activities");
  const scheduled = useRows("scheduled_assessment_tasks");
  const procedures = useRows("procedures");
  const revisions = useRows("procedure_revisions");
  const runs = useRows("test_runs");
  const parties = useRows("parties");
  const [form, setForm] = useState<FormTarget | null>(null);
  const [selection, setSelection] = useState<FormTarget | null>(null);
  const [displayed, setDisplayed] = useState<Record<string, DataRecord[]>>({});
  const planRows = [...(plans.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const objectiveRows = (objectives.data ?? []).filter((row) =>
    planRows.some((plan) => plan.id === row.plan_revision_id),
  );
  const activityRows = (activities.data ?? []).filter((row) =>
    planRows.some((plan) => plan.id === row.plan_revision_id),
  );
  const scheduledRows = (scheduled.data ?? []).filter((row) =>
    planRows.some((plan) => plan.id === row.plan_revision_id),
  );
  const runRows = (runs.data ?? []).filter(
    (row) =>
      planRows.some((plan) => plan.id === row.plan_revision_id) ||
      events.data?.some((event) => event.id === row.assessment_event_id),
  );
  const procedureRows = (procedures.data ?? []).filter(
    (row) =>
      row.program_id === campaign.program_id ||
      row.program_id === null ||
      runRows.some((run) =>
        revisions.data?.some(
          (revision) =>
            revision.id === run.procedure_revision_id && revision.procedure_id === row.id,
        ),
      ),
  );
  const revisionRows = (revisions.data ?? []).filter((row) =>
    procedureRows.some((procedure) => procedure.id === row.procedure_id),
  );
  const writable = workspace.role !== "viewer";
  function edit(target: FormTarget) {
    if (form) return;
    setSelection(null);
    setForm(target);
  }
  function inspect(target: FormTarget) {
    if (!form) setSelection(target);
  }
  function add(label: string, target: FormTarget) {
    const planContent = [
      "assessment_objectives",
      "assessment_activities",
      "scheduled_assessment_tasks",
    ].includes(target.table);
    const needsPlan =
      planContent || target.table === "assessment_events" || target.table === "test_runs";
    const plan = planContent ? planRows.find((row) => row.state === "draft") : planRows[0];
    const contextual =
      needsPlan && plan
        ? { ...target, initialValues: { plan_revision_id: plan.id, ...target.initialValues } }
        : target;
    return writable ? (
      <Button
        size="small"
        disabled={!!form || plans.isPending || plans.isError || (needsPlan && !plan)}
        onClick={() => edit(contextual)}
      >
        {productCreateLabel(target.table)}
      </Button>
    ) : undefined;
  }
  const selected = selection?.existing;
  return (
    <Stack space="space.200">
      {form && <ModelForm target={form} onClose={() => setForm(null)} />}
      <Tabs value={tab} onValueChange={(value) => onTab(value as CampaignTab)}>
        <TabsList variant="line" activateOnFocus aria-label="Campaign sections">
          {campaignTabs.map((name) => (
            <TabsTrigger value={name} key={name}>
              {name}
              {name === "Runs" &&
              !runs.isPending &&
              !plans.isPending &&
              !events.isPending &&
              !runs.isError &&
              !plans.isError &&
              !events.isError ? (
                <Count value={runRows.length} />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="Overview">{overview}</TabsContent>
        <TabsContent value="Execution">
          <Stack space="space.300" className="pt-200">
            <Section title="Campaign">
              <p className="whitespace-pre-wrap pb-150 text-subtle">
                {campaign.description || "No campaign description recorded."}
              </p>
              <RecordActions
                table="assessment_campaigns"
                id={campaign.id}
                onEdit={() =>
                  edit({ table: "assessment_campaigns", existing: campaign as DataRecord })
                }
              />
            </Section>
            <Section
              title="Assessment plans"
              action={add("Add plan revision", {
                table: "assessment_plan_revisions",
                initialValues: {
                  campaign_id: campaign.id,
                  version_number: (planRows[0]?.version_number ?? 0) + 1,
                },
              })}
            >
              <QueryState queries={[plans]}>
                <AssessmentTable
                  model="assessment_plan_revisions"
                  selectedId={
                    selection?.table === "assessment_plan_revisions"
                      ? selection.existing?.id
                      : undefined
                  }
                  onDisplayedRowsChange={(rows) =>
                    setDisplayed((previous) => ({
                      ...previous,
                      assessment_plan_revisions: rows as DataRecord[],
                    }))
                  }
                  label="Assessment plans"
                  rows={planRows}
                  columns={[
                    { key: "title", label: "Plan", value: (row) => row.title },
                    {
                      key: "version_number",
                      label: "Version",
                      value: (row) => row.version_number,
                      width: 85,
                    },
                    {
                      label: "State",
                      value: (row) => <StatusBadge value={row.state} />,
                      width: 130,
                    },
                    {
                      label: "SSP revision",
                      value: (row) => (
                        <SchemaLink table="ssp_revisions" id={row.ssp_revision_id}>
                          Pinned SSP
                        </SchemaLink>
                      ),
                      width: 145,
                    },
                  ]}
                  onPreview={(row) =>
                    inspect({ table: "assessment_plan_revisions", existing: row as DataRecord })
                  }
                />
              </QueryState>
            </Section>
            <Section
              title="Events"
              action={add("Add event", {
                table: "assessment_events",
                initialValues: { campaign_id: campaign.id },
              })}
            >
              <QueryState queries={[events]}>
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
                  label="Events"
                  rows={events.data ?? []}
                  columns={[
                    { key: "title", label: "Event", value: (row) => row.title },
                    {
                      label: "State",
                      value: (row) => <StatusBadge value={row.status} />,
                      width: 130,
                    },
                    {
                      key: "starts_at",
                      label: "Starts",
                      value: (row) => displayDate(row.starts_at),
                      width: 140,
                    },
                    {
                      key: "ends_at",
                      label: "Ends",
                      value: (row) => displayDate(row.ends_at),
                      width: 140,
                    },
                  ]}
                  onPreview={(row) =>
                    inspect({ table: "assessment_events", existing: row as DataRecord })
                  }
                />
              </QueryState>
            </Section>
            <Section
              title="Objectives"
              action={add("Add objective", { table: "assessment_objectives" })}
            >
              <QueryState queries={[plans, objectives]}>
                <AssessmentTable
                  model="assessment_objectives"
                  selectedId={
                    selection?.table === "assessment_objectives"
                      ? selection.existing?.id
                      : undefined
                  }
                  onDisplayedRowsChange={(rows) =>
                    setDisplayed((previous) => ({
                      ...previous,
                      assessment_objectives: rows as DataRecord[],
                    }))
                  }
                  label="Objectives"
                  rows={objectiveRows}
                  columns={[
                    { key: "title", label: "Objective", value: (row) => row.title },
                    {
                      key: "acceptance_criterion",
                      label: "Acceptance criterion",
                      value: (row) => row.acceptance_criterion ?? "Not recorded",
                    },
                    {
                      label: "Plan",
                      value: (row) =>
                        planRows.find((plan) => plan.id === row.plan_revision_id)?.title,
                      width: 180,
                    },
                  ]}
                  onPreview={(row) =>
                    inspect({ table: "assessment_objectives", existing: row as DataRecord })
                  }
                />
              </QueryState>
            </Section>
            <Section
              title="Activities"
              action={add("Add activity", { table: "assessment_activities" })}
            >
              <QueryState queries={[plans, activities]}>
                <AssessmentTable
                  model="assessment_activities"
                  selectedId={
                    selection?.table === "assessment_activities"
                      ? selection.existing?.id
                      : undefined
                  }
                  onDisplayedRowsChange={(rows) =>
                    setDisplayed((previous) => ({
                      ...previous,
                      assessment_activities: rows as DataRecord[],
                    }))
                  }
                  label="Activities"
                  rows={activityRows}
                  columns={[
                    { key: "title", label: "Activity", value: (row) => row.title },
                    { label: "Method", value: (row) => labelFor(row.method), width: 140 },
                    {
                      label: "Plan",
                      value: (row) =>
                        planRows.find((plan) => plan.id === row.plan_revision_id)?.title,
                      width: 180,
                    },
                  ]}
                  onPreview={(row) =>
                    inspect({ table: "assessment_activities", existing: row as DataRecord })
                  }
                />
              </QueryState>
            </Section>
            <Section
              title="Scheduled assessment tasks"
              action={add("Add assessment task", { table: "scheduled_assessment_tasks" })}
            >
              <QueryState queries={[plans, scheduled, parties]}>
                <AssessmentTable
                  model="scheduled_assessment_tasks"
                  selectedId={
                    selection?.table === "scheduled_assessment_tasks"
                      ? selection.existing?.id
                      : undefined
                  }
                  onDisplayedRowsChange={(rows) =>
                    setDisplayed((previous) => ({
                      ...previous,
                      scheduled_assessment_tasks: rows as DataRecord[],
                    }))
                  }
                  label="Scheduled assessment tasks"
                  rows={scheduledRows}
                  columns={[
                    { key: "title", label: "Task", value: (row) => row.title },
                    {
                      label: "State",
                      value: (row) => <StatusBadge value={row.status} />,
                      width: 130,
                    },
                    {
                      label: "Owner",
                      value: (row) =>
                        row.owner_party_id
                          ? (parties.data?.find((party) => party.id === row.owner_party_id)?.name ??
                            "Unavailable person")
                          : "Not recorded",
                      width: 180,
                    },
                    {
                      key: "due_at",
                      label: "Due",
                      value: (row) => displayDate(row.due_at),
                      width: 140,
                    },
                  ]}
                  onPreview={(row) =>
                    inspect({ table: "scheduled_assessment_tasks", existing: row as DataRecord })
                  }
                />
              </QueryState>
            </Section>
          </Stack>
        </TabsContent>
        <TabsContent value="Procedures">
          <Stack space="space.300" className="pt-200">
            <Section
              title="Procedures"
              action={add("Add procedure", {
                table: "procedures",
                initialValues: { program_id: campaign.program_id },
              })}
            >
              <QueryState queries={[procedures, revisions, runs, events, plans]}>
                <AssessmentTable
                  model="procedures"
                  selectedId={
                    selection?.table === "procedures" ? selection.existing?.id : undefined
                  }
                  onDisplayedRowsChange={(rows) =>
                    setDisplayed((previous) => ({ ...previous, procedures: rows as DataRecord[] }))
                  }
                  label="Procedures"
                  rows={procedureRows}
                  columns={[
                    { key: "title", label: "Procedure", value: (row) => row.title },
                    {
                      key: "description",
                      label: "Description",
                      value: (row) => row.description ?? "Not recorded",
                    },
                    {
                      label: "Versions",
                      value: (row) =>
                        revisionRows.filter((revision) => revision.procedure_id === row.id).length,
                      width: 95,
                    },
                  ]}
                  onPreview={(row) => inspect({ table: "procedures", existing: row as DataRecord })}
                />
              </QueryState>
            </Section>
            <Section
              title="Procedure revisions"
              action={add("Add procedure revision", { table: "procedure_revisions" })}
            >
              <QueryState queries={[procedures, revisions, runs, events, plans]}>
                <AssessmentTable
                  model="procedure_revisions"
                  selectedId={
                    selection?.table === "procedure_revisions" ? selection.existing?.id : undefined
                  }
                  onDisplayedRowsChange={(rows) =>
                    setDisplayed((previous) => ({
                      ...previous,
                      procedure_revisions: rows as DataRecord[],
                    }))
                  }
                  label="Procedure revisions"
                  rows={revisionRows}
                  columns={[
                    { key: "title", label: "Revision", value: (row) => row.title },
                    {
                      key: "version_number",
                      label: "Version",
                      value: (row) => row.version_number,
                      width: 90,
                    },
                    { label: "Method", value: (row) => labelFor(row.method), width: 140 },
                    {
                      label: "State",
                      value: (row) => <StatusBadge value={row.state} />,
                      width: 130,
                    },
                  ]}
                  onPreview={(row) =>
                    inspect({ table: "procedure_revisions", existing: row as DataRecord })
                  }
                />
              </QueryState>
            </Section>
          </Stack>
        </TabsContent>
        <TabsContent value="Runs">
          <Section title="Recorded runs" action={add("Add test run", { table: "test_runs" })}>
            <div className="pt-200">
              <QueryState queries={[runs, events, plans, revisions, parties]}>
                <AssessmentTable
                  model="test_runs"
                  selectedId={selection?.table === "test_runs" ? selection.existing?.id : undefined}
                  onDisplayedRowsChange={(rows) =>
                    setDisplayed((previous) => ({ ...previous, test_runs: rows as DataRecord[] }))
                  }
                  label="Test runs"
                  rows={runRows}
                  columns={[
                    { key: "title", label: "Run", value: (row) => row.title },
                    {
                      label: "Procedure revision",
                      value: (row) =>
                        revisions.data?.find(
                          (revision) => revision.id === row.procedure_revision_id,
                        )?.title ?? "Unavailable procedure",
                    },
                    {
                      label: "State",
                      value: (row) => <StatusBadge value={row.status} />,
                      width: 125,
                    },
                    {
                      label: "Assessor",
                      value: (row) =>
                        row.assessor_party_id
                          ? (parties.data?.find((party) => party.id === row.assessor_party_id)
                              ?.name ?? "Unavailable person")
                          : "Not recorded",
                      width: 170,
                    },
                    {
                      key: "completed_at",
                      label: "Completed",
                      value: (row) => displayDate(row.completed_at),
                      width: 140,
                    },
                  ]}
                  onPreview={(row) => inspect({ table: "test_runs", existing: row as DataRecord })}
                />
              </QueryState>
            </div>
          </Section>
        </TabsContent>
        <TabsContent value="Regression">
          <QueryState queries={[runs, events, plans]}>
            <RegressionComparison runs={runRows} />
          </QueryState>
        </TabsContent>
      </Tabs>
      {selection && selected && !form && (
        <CampaignInspector
          target={selection}
          onEdit={edit}
          renderFrame={({ content, actions }) => (
            <RecordPreviewPanel
              title={String(selected["title"] ?? labelFor(selection.table))}
              label="Assessment preview"
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
              {content}
            </RecordPreviewPanel>
          )}
        />
      )}
    </Stack>
  );
}

type InspectorFrame = (frame: { content: ReactNode; actions: ReactNode }) => ReactNode;

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
            label: "Record test run",
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
        {draft && relatedAction && (
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
              <DropdownMenuItem onClick={relatedAction.onClick}>
                {relatedAction.label}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </>
    ),
    content: (
      <Stack space="space.250">
        <p className="whitespace-pre-wrap">
          {String(record["description"] ?? "No description recorded.")}
        </p>
        <DetailFacts
          facts={Object.entries(record)
            .filter(([key]) =>
              [
                "state",
                "status",
                "version_number",
                "starts_at",
                "ends_at",
                "due_at",
                "acceptance_criterion",
                "location",
                "method",
              ].includes(key),
            )
            .map(([key, value]) => [
              labelFor(key),
              value === null ? null : ["status", "state"].includes(key) ? (
                <StatusBadge value={String(value)} />
              ) : key.endsWith("_at") ? (
                displayDate(String(value))
              ) : (
                String(value)
              ),
            ])}
        />
        {target.table === "assessment_plan_revisions" && writable && draft && (
          <Section title="Plan contents">
            <Inline space="space.100" shouldWrap>
              {(
                [
                  "assessment_objectives",
                  "assessment_activities",
                  "scheduled_assessment_tasks",
                  "assessment_subjects",
                ] as const
              ).map((table) => (
                <Button
                  size="small"
                  key={table}
                  onClick={() => onEdit({ table, initialValues: { plan_revision_id: record.id } })}
                >
                  {productCreateLabel(table)}
                </Button>
              ))}
            </Inline>
          </Section>
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
    <Section
      title="Activity steps"
      action={
        editable ? (
          <Button
            size="small"
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
    >
      <QueryState queries={[steps, plan]}>
        <AssessmentTable<Row<"activity_steps">>
          model="activity_steps"
          label="Activity steps"
          rows={[...(steps.data ?? [])].sort((a, b) => a.sequence_number - b.sequence_number)}
          columns={[
            {
              key: "sequence_number",
              label: "Step",
              value: (row) => row.sequence_number,
              width: 70,
            },
            { key: "instruction", label: "Instruction", value: (row) => row.instruction },
            {
              key: "expected_result",
              label: "Expected",
              value: (row) => row.expected_result ?? "Not recorded",
            },
          ]}
          {...(editable
            ? {
                onEdit: (row) => onEdit({ table: "activity_steps", existing: row as DataRecord }),
              }
            : {})}
        />
      </QueryState>
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
        Edit revision
      </Button>
    ),
    content: (
      <Stack space="space.250">
        <DetailFacts
          facts={[
            ["State", <StatusBadge value={revision.state} />],
            ["Version", revision.version_number],
            ["Method", labelFor(revision.method)],
            ["Preconditions", revision.preconditions],
            ["Acceptance criterion", revision.acceptance_criterion],
          ]}
        />
        <Section
          title="Steps"
          action={
            editable ? (
              <Button
                size="small"
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
        >
          <QueryState queries={[steps]}>
            <AssessmentTable<Row<"procedure_steps">>
              model="procedure_steps"
              label="Procedure steps"
              rows={[...(steps.data ?? [])].sort((a, b) => a.sequence_number - b.sequence_number)}
              columns={[
                {
                  key: "sequence_number",
                  label: "Step",
                  value: (row) => row.sequence_number,
                  width: 65,
                },
                { key: "instruction", label: "Instruction", value: (row) => row.instruction },
                {
                  key: "expected_result",
                  label: "Expected result",
                  value: (row) => row.expected_result ?? "Not recorded",
                },
              ]}
              {...(editable
                ? {
                    onEdit: (row) =>
                      onEdit({ table: "procedure_steps", existing: row as DataRecord }),
                  }
                : {})}
            />
          </QueryState>
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
  const [error, setError] = useState("");
  const editable =
    workspace.role !== "viewer" && run && !["completed", "aborted"].includes(run.status);
  async function complete() {
    if (!run || save.isPending) return;
    setError("");
    try {
      await save.mutateAsync({
        id: run.id,
        revision: run.revision,
        values: { status: "completed", completed_at: new Date().toISOString() },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The run could not be completed.");
    }
  }
  return renderFrame({
    actions: editable && (
      <>
        <Button
          size="small"
          variant="primary"
          disabled={save.isPending}
          onClick={() => void complete()}
        >
          {save.isPending ? "Saving…" : "Complete run"}
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
              Edit run
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    ),
    content: (
      <QueryState queries={[query]}>
        {run ? (
          <Stack space="space.250">
            <DetailFacts
              facts={[
                ["State", <StatusBadge value={run.status} />],
                [
                  "Procedure revision",
                  <SchemaLink table="procedure_revisions" id={run.procedure_revision_id}>
                    Pinned procedure
                  </SchemaLink>,
                ],
                [
                  "Configuration baseline",
                  <SchemaLink table="configuration_baselines" id={run.configuration_baseline_id}>
                    Pinned baseline
                  </SchemaLink>,
                ],
                ["Started", displayDate(run.started_at)],
                ["Completed", displayDate(run.completed_at)],
                ["Conclusion", run.conclusion],
              ]}
            />
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
            <Section title="Step results">
              <QueryState queries={[steps, results]}>
                <AssessmentTable<Row<"procedure_steps">>
                  model="procedure_steps"
                  label="Step results"
                  rows={[...(steps.data ?? [])].sort(
                    (a, b) => a.sequence_number - b.sequence_number,
                  )}
                  columns={[
                    {
                      key: "sequence_number",
                      label: "Step",
                      value: (row) => row.sequence_number,
                      width: 60,
                    },
                    { key: "instruction", label: "Instruction", value: (row) => row.instruction },
                    {
                      label: "Determination",
                      value: (row) => {
                        const result = results.data?.find(
                          (item) => item.procedure_step_id === row.id,
                        );
                        return result ? (
                          <StatusBadge value={result.determination} />
                        ) : (
                          "Not recorded"
                        );
                      },
                      width: 145,
                    },
                    {
                      label: "Observed",
                      value: (row) =>
                        results.data?.find((item) => item.procedure_step_id === row.id)
                          ?.observed_behavior ?? "Not recorded",
                    },
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
              </QueryState>
            </Section>
            <Section title="Observations">
              <RunObservations
                run={run}
                results={results.data ?? []}
                steps={steps.data ?? []}
                resultsReady={!results.isPending && !results.isError}
                onEdit={onEdit}
              />
            </Section>
          </Stack>
        ) : (
          <Empty>
            <EmptyMedia aria-hidden>
              <EmptyIllustration kind="search" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Run not found</EmptyTitle>
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
  resultsReady,
  onEdit,
}: {
  run: Row<"test_runs">;
  results: Row<"step_results">[];
  steps: Row<"procedure_steps">[];
  resultsReady: boolean;
  onEdit: (target: FormTarget) => void;
}) {
  const observations = useRows("observations");
  const workspace = useWorkspace();
  const rows = (observations.data ?? []).filter(
    (row) => row.step_result_id && results.some((result) => result.id === row.step_result_id),
  );
  return (
    <Stack space="space.150">
      {resultsReady ? (
        <QueryState queries={[observations]}>
          <AssessmentTable
            model="observations"
            label="Observations"
            rows={rows}
            columns={[
              {
                label: "Observation",
                value: (row) => (
                  <SchemaLink table="observations" id={row.id}>
                    {row.title}
                  </SchemaLink>
                ),
              },
              { label: "Method", value: (row) => labelFor(row.method), width: 110 },
              {
                key: "observed_at",
                label: "Observed",
                value: (row) => displayDate(row.observed_at),
                width: 135,
              },
            ]}
          />
        </QueryState>
      ) : (
        <p className="text-subtle">Step results must load before observations can be shown.</p>
      )}
      {workspace.role !== "viewer" && resultsReady && results.length > 0 && (
        <Inline space="space.100" shouldWrap>
          {results.map((result) => (
            <Button
              key={result.id}
              size="small"
              onClick={() =>
                onEdit({
                  table: "observations",
                  initialValues: {
                    step_result_id: result.id,
                    ...(run.assessment_event_id
                      ? { assessment_event_id: run.assessment_event_id }
                      : {}),
                    ...(run.assessor_party_id ? { observer_party_id: run.assessor_party_id } : {}),
                  },
                })
              }
            >
              Record observation for step{" "}
              {steps.find((step) => step.id === result.procedure_step_id)?.sequence_number ??
                result.procedure_step_id}
            </Button>
          ))}
        </Inline>
      )}
    </Stack>
  );
}

function RegressionComparison({ runs }: { runs: Row<"test_runs">[] }) {
  const results = useRows("step_results");
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
    ].map((stepId) => ({
      id: `${current.id}/${stepId}`,
      current,
      previous,
      stepId,
      before: previousResults.find((result) => result.procedure_step_id === stepId)?.determination,
      after: currentResults.find((result) => result.procedure_step_id === stepId)?.determination,
    }));
  });
  return (
    <Stack space="space.200" className="pt-200">
      <p className="text-subtle">
        Compare the two most recent completed runs with the same procedure revision and
        configuration baseline. Missing step results remain unrecorded.
      </p>
      <QueryState queries={[results]}>
        <AssessmentTable
          label="Run comparisons"
          empty="No comparable completed runs"
          rows={comparisons}
          columns={[
            {
              label: "Step",
              value: (row) => (
                <SchemaLink table="procedure_steps" id={row.stepId}>
                  Procedure step
                </SchemaLink>
              ),
            },
            { key: "previous", label: "Previous run", value: (row) => row.previous.title },
            { label: "Previous determination", value: (row) => <StatusBadge value={row.before} /> },
            { key: "current", label: "Latest run", value: (row) => row.current.title },
            { label: "Latest determination", value: (row) => <StatusBadge value={row.after} /> },
          ]}
        />
      </QueryState>
    </Stack>
  );
}
