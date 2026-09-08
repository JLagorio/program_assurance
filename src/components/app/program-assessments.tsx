import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  Badge,
  Block,
  Button,
  DataTable,
  Dialog,
  Empty,
  Fact,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  NativeSelect,
  PreviewSheet,
  Stack,
  Text,
  Textarea,
  TextLink,
  defineColumns,
  toast,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import {
  campaigns,
  eventsByCampaign,
  objectiveById,
  objectivesForEvent,
  type Campaign,
} from "@/lib/campaigns";
import {
  assessmentState,
  createAssessment,
  useAssessmentsVersion,
  type NewAssessment,
} from "@/lib/assessment-store";
import { ZodError } from "zod";
import { currentSession } from "@/lib/control-work";
import { assets, findings, findingProgram } from "@/lib/findings";
import { useAssuranceVersion } from "@/lib/assurance-record-store";
import { evidenceForProgram, useEvidenceVersion } from "@/lib/evidence-catalog";
import { requirementsForProgram, useRequirementsVersion } from "@/lib/requirements";
import { requirementsForObjective, useVerificationVersion } from "@/lib/requirement-verification";
import {
  campaignExecution,
  assessmentRunForProgram,
  completionBlockedBy,
  createTestRun,
  procedureById,
  proceduresForCampaign,
  recordStep,
  resolvedObjectiveResult,
  runVerdict,
  runsForCampaign,
  setRunState,
  useTestRuns,
  type StepResult,
  type TestRun,
} from "@/lib/test-execution";
import { RunRecordView } from "@/components/app/test-execution";
import { useRecordForm } from "@/lib/record-form";
import { statusTone } from "@/lib/spine";

const presets: Preset[] = [
  { id: "all", label: "All assessments" },
  { id: "planning", label: "Planning", filters: [{ id: "state", value: ["Planning"] }] },
  { id: "executing", label: "Executing", filters: [{ id: "state", value: ["Executing"] }] },
];
const errorText = (error: unknown) =>
  error instanceof ZodError
    ? error.issues.map((i) => i.message).join(" ")
    : error instanceof Error
      ? error.message
      : "The change could not be saved.";

export function ProgramAssessments({
  programId,
  initialAssessmentId,
  initialRunId,
  elementId,
  onAssessmentChange,
  onRunChange,
  onRaiseFinding,
}: {
  programId: string;
  initialAssessmentId?: string | undefined;
  initialRunId?: string | undefined;
  elementId?: string | undefined;
  onAssessmentChange?: ((id: string | null) => void) | undefined;
  onRunChange?: ((id: string | null) => void) | undefined;
  onRaiseFinding?: ((assessmentId: string) => void) | undefined;
}) {
  const version = useAssessmentsVersion();
  const runLog = useTestRuns();
  useVerificationVersion();
  useAssuranceVersion();
  const [selected, setSelectedState] = useState<string | null>(initialAssessmentId ?? null);
  const [runId, setRunIdState] = useState<string | null>(initialRunId ?? null);
  const runRecordRef = useRef<HTMLDivElement>(null);
  const setSelected = useCallback(
    (id: string | null) => {
      setSelectedState(id);
      setRunIdState(null);
      onAssessmentChange?.(id);
    },
    [onAssessmentChange],
  );
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [adding, setAdding] = useState(false);
  const [starting, setStarting] = useState(false);
  const setRunId = useCallback(
    (id: string | null) => {
      setRunIdState(id);
      onRunChange?.(id);
    },
    [onRunChange],
  );
  const [recording, setRecording] = useState<string | null>(null);
  const rows = useMemo(
    () =>
      campaigns
        .filter((c) => c.program === programId)
        .map((c) => {
          const execution = campaignExecution(c.id);
          return {
            ...c,
            state: assessmentState(c),
            objectives: execution.objectives,
            result: `${execution.met} met · ${execution.notMet} not met`,
            runs: runsForCampaign(c.id).length,
          };
        }),
    // Assessment plans and run records mutate behind their store subscriptions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, version, runLog],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.id("id", {
          header: "Assessment",
          pin: "start",
          width: 135,
          hideable: false,
          preview: (r) => setSelected(r.id),
          active: (r) => selectedRef.current === r.id,
          cell: (r) => (
            <TextLink>
              <button type="button" onClick={() => setSelected(r.id)}>
                <Id>{r.id}</Id>
              </button>
            </TextLink>
          ),
        }),
        c.text("name", { header: "Assessment plan", minWidth: 260, hideable: false }),
        c.status("state", { header: "Status", width: 125, tone: (r) => statusTone(r.state) }),
        c.text("lead", { header: "Owner", width: 170 }),
        c.text("scope", { header: "Scope", width: 270 }),
        c.text("target", { header: "Target date", width: 135 }),
        c.text("result", { header: "Results", width: 170 }),
      ]),
    [setSelected],
  );
  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (r) => r.id,
    label: "Program assessments",
    view: `program-assessments-${programId}`,
    resizable: true,
    reorderable: true,
  });
  const campaign = campaigns.find((c) => c.id === selected && c.program === programId) ?? null;
  const assessmentRuns = campaign ? runsForCampaign(campaign.id) : [];
  const run = campaign ? assessmentRunForProgram(programId, campaign.id, runId) : null;
  const selectedRunId = run?.id;
  useEffect(() => {
    if (!runId || !selectedRunId) return;
    const frame = requestAnimationFrame(() =>
      runRecordRef.current?.scrollIntoView({ block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [runId, selectedRunId]);
  const procedure = run ? (procedureById.get(run.procedure) ?? null) : null;
  const eventFindingIds = new Set(
    campaign ? eventsByCampaign(campaign.id).flatMap((e) => e.findings) : [],
  );
  const assessmentFindings = campaign
    ? findings.filter(
        (f) =>
          findingProgram(f) === programId &&
          (f.assessmentId === campaign.id || eventFindingIds.has(f.id)),
      )
    : [];
  const newButton = (
    <Button size="small" variant="primary" iconBefore={<Plus />} onClick={() => setAdding(true)}>
      New assessment
    </Button>
  );
  return (
    <>
      <DataTable
        table={table}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Search table={table} placeholder="Find an assessment" />
            <DataTable.Presets
              table={table}
              presets={presets}
              variant="menu"
              aria-label="Saved views"
            />
            <DataTable.Filter table={table} column="state" />
            <DataTable.Filter table={table} column="lead" />
            <Inline className="ml-auto" space="space.100" alignBlock="center">
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
              {newButton}
            </Inline>
          </Inline>
        }
        empty={
          rows.length
            ? {
                title: "No matching assessments",
                description: "Clear a filter or try another search.",
              }
            : {
                title: "No assessments planned",
                description:
                  "Plan an assessment against the program's requirements, with an objective, procedure and acceptance criterion.",
                action: newButton,
              }
        }
      />
      <PreviewSheet
        open={!!campaign}
        onClose={() => {
          setSelected(null);
        }}
        id={campaign?.id ?? ""}
        title={campaign?.name ?? ""}
        openTo={
          <Link to="/campaigns/$campaignId" params={{ campaignId: campaign?.id ?? "" }}>
            Open assessment record
          </Link>
        }
        subtitle={campaign?.scope}
        facts={
          campaign ? (
            <>
              <Fact label="Owner">{campaign.lead}</Fact>
              <Fact label="Target">{campaign.target}</Fact>
              <Fact label="Runs">{assessmentRuns.length}</Fact>
            </>
          ) : undefined
        }
        actions={
          campaign ? (
            <Inline space="space.100">
              <Button variant="primary" size="small" onClick={() => setStarting(true)}>
                {run?.state === "Complete" ? "Start retest" : "Start run"}
              </Button>
              {onRaiseFinding ? (
                <Button size="small" onClick={() => onRaiseFinding(campaign.id)}>
                  Raise finding
                </Button>
              ) : null}
            </Inline>
          ) : undefined
        }
      >
        {campaign ? (
          <Stack space="space.200">
            <Block title="Objectives and requirements">
              <Stack space="space.150">
                {eventsByCampaign(campaign.id)
                  .flatMap((event) => objectivesForEvent(event.id))
                  .map((o) => (
                    <div key={o.id}>
                      <Inline space="space.100" alignBlock="center">
                        <Id>{o.id}</Id>
                        <Badge
                          variant="secondary"
                          tone={
                            resolvedObjectiveResult(o.id).result === "Met"
                              ? "success"
                              : resolvedObjectiveResult(o.id).result === "Not met"
                                ? "danger"
                                : "neutral"
                          }
                        >
                          {resolvedObjectiveResult(o.id).result}
                        </Badge>
                      </Inline>
                      <Text as="p" size="small" className="pt-050">
                        {o.statement}
                      </Text>
                      <Inline className="pt-050" space="space.100" shouldWrap>
                        {requirementsForObjective(o.id).map((id) => (
                          <TextLink key={id}>
                            <Link
                              to="/programs/$programId/requirements/$requirementId"
                              params={{ programId, requirementId: id }}
                              search={{ element: elementId }}
                            >
                              {id}
                            </Link>
                          </TextLink>
                        ))}
                      </Inline>
                    </div>
                  ))}
              </Stack>
            </Block>
            {assessmentFindings.length ? (
              <Block title="Findings" count={assessmentFindings.length}>
                <Stack space="space.100">
                  {assessmentFindings.map((f) => (
                    <TextLink key={f.id}>
                      <Link
                        to="/programs/$programId"
                        params={{ programId }}
                        search={{ tab: "Findings", findingId: f.id, element: elementId }}
                      >
                        {f.id} · {f.title}
                      </Link>
                    </TextLink>
                  ))}
                </Stack>
              </Block>
            ) : null}
            {run ? (
              <>
                <Field label="Run history">
                  <NativeSelect value={run.id} onChange={(e) => setRunId(e.target.value)}>
                    {assessmentRuns.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} · {r.build} · {r.state}
                        {r.retestOf ? ` · retest of ${r.retestOf}` : ""}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <div ref={runRecordRef}>
                  <RunRecordView
                    run={run}
                    procedure={procedure}
                    verdict={runVerdict(run.id)}
                    blockedReason={completionBlockedBy(run.id)}
                    onComplete={() => {
                      try {
                        setRunState(run.id, "Complete");
                        toast.success("Assessment run completed");
                      } catch (e) {
                        toast.error(errorText(e));
                      }
                    }}
                  />
                </div>
                {run.state !== "Complete" && procedure ? (
                  <Block title="Record an observation">
                    <Inline space="space.100" shouldWrap>
                      {procedure.steps.map((s) => (
                        <Button key={s.id} size="small" onClick={() => setRecording(s.id)}>
                          Record step {s.n}
                        </Button>
                      ))}
                    </Inline>
                  </Block>
                ) : null}
              </>
            ) : (
              <Empty
                title={runId ? "Run not found in this assessment" : "Ready to execute"}
                description={
                  runId
                    ? "Choose a run belonging to this assessment."
                    : "Start a run against a named build, then record observations and supporting evidence for each procedure step."
                }
                action={
                  runId && assessmentRuns.length ? (
                    <Button size="small" onClick={() => setRunId(null)}>
                      Show latest run
                    </Button>
                  ) : undefined
                }
              />
            )}
          </Stack>
        ) : null}
      </PreviewSheet>
      {adding ? (
        <NewAssessmentDialog
          programId={programId}
          onClose={() => setAdding(false)}
          onCreated={(c) => {
            setAdding(false);
            setSelected(c.id);
          }}
        />
      ) : null}
      {starting && campaign ? (
        <StartRunDialog
          campaign={campaign}
          previous={run}
          onClose={() => setStarting(false)}
          onStarted={(r) => {
            setRunId(r.id);
            setStarting(false);
          }}
        />
      ) : null}
      {recording && run ? (
        <RecordStepDialog
          programId={programId}
          run={run}
          stepId={recording}
          onClose={() => setRecording(null)}
        />
      ) : null}
    </>
  );
}

function NewAssessmentDialog({
  programId,
  onClose,
  onCreated,
}: {
  programId: string;
  onClose: () => void;
  onCreated: (campaign: Campaign) => void;
}) {
  useRequirementsVersion();
  const { form, values, formId, formRef } = useRecordForm(
    {
      title: "",
      owner: currentSession().name,
      scope: "",
      requirement: "",
      asset: "",
      objective: "",
      method: "Test" as NewAssessment["method"],
      action: "",
      expected: "",
      start: "",
      end: "",
    },
    (v) => ({
      title: v.title,
      owner: v.owner,
      scope: v.scope,
      objective: v.objective,
      action: v.action,
      expected: v.expected,
      start: v.start,
      end: v.end,
    }),
  );
  const specs = [
    { name: "title", label: "Assessment name" },
    { name: "owner", label: "Owner" },
    { name: "scope", label: "System boundary and scope" },
    { name: "objective", label: "Assessment objective" },
    { name: "action", label: "Procedure action" },
    { name: "expected", label: "Acceptance criterion" },
    { name: "start", label: "Start date" },
    { name: "end", label: "End date" },
  ] as const;
  return (
    <Dialog
      open
      onClose={onClose}
      title="New assessment"
      description="Plan what will be assessed, how it will be checked, and what constitutes a passing result."
      width="large"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId}>
            Create assessment
          </Button>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit({
            save: () => {
              try {
                onCreated(createAssessment({ program: programId, ...values }));
                toast.success("Assessment created");
              } catch (error) {
                toast.error(errorText(error));
              }
            },
          });
        }}
      >
        <Stack space="space.150">
          {specs.map(({ name, label }) => (
            <form.Field key={name} name={name}>
              {(field) => (
                <Field
                  label={label}
                  isRequired
                  error={
                    field.state.meta.errors.length ? field.state.meta.errors.join(" ") : undefined
                  }
                >
                  {["scope", "objective", "action", "expected"].includes(name) ? (
                    <Textarea
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      name={name}
                      rows={2}
                    />
                  ) : (
                    <Input
                      type={name === "start" || name === "end" ? "date" : "text"}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      name={name}
                    />
                  )}
                </Field>
              )}
            </form.Field>
          ))}
          <Grid templateColumns={{ sm: "1fr 1fr" }} gap="space.150">
            <Field label="Requirement">
              <NativeSelect
                value={values.requirement}
                onChange={(e) => form.setFieldValue("requirement", e.target.value)}
              >
                <option value="">No linked requirement</option>
                {requirementsForProgram(programId).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.text}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Assessment subject">
              <NativeSelect
                value={values.asset}
                onChange={(e) => form.setFieldValue("asset", e.target.value)}
              >
                <option value="">Program scope</option>
                {assets
                  .filter((a) => a.program === programId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </NativeSelect>
            </Field>
          </Grid>
          <Field label="Method">
            <NativeSelect
              value={values.method}
              onChange={(e) =>
                form.setFieldValue("method", e.target.value as NewAssessment["method"])
              }
            >
              {["Examine", "Interview", "Test"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </NativeSelect>
          </Field>
        </Stack>
      </form>
    </Dialog>
  );
}

function StartRunDialog({
  campaign,
  previous,
  onClose,
  onStarted,
}: {
  campaign: Campaign;
  previous: TestRun | null;
  onClose: () => void;
  onStarted: (run: TestRun) => void;
}) {
  const procedures = proceduresForCampaign(campaign.id);
  const { form, values, formId, formRef } = useRecordForm(
    {
      procedure: previous?.procedure ?? procedures[0]?.id ?? "",
      operator: currentSession().name,
      build: "",
    },
    (v) => ({ procedure: v.procedure, operator: v.operator, build: v.build }),
  );
  return (
    <Dialog
      open
      onClose={onClose}
      title={previous?.state === "Complete" ? "Start retest" : "Start assessment run"}
      description="Each run keeps its own tested build and evidence. Previous results remain in the run history."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" form={formId} type="submit">
            Start run
          </Button>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit({
            save: () => {
              try {
                const objective = objectiveById.get(
                  procedureById.get(values.procedure)?.objective ?? "",
                );
                if (!objective?.event) throw new Error("The procedure needs an assessment event.");
                onStarted(
                  createTestRun({
                    ...values,
                    event: objective.event,
                    ...(previous?.state === "Complete" && previous.procedure === values.procedure
                      ? { retestOf: previous.id }
                      : {}),
                  }),
                );
              } catch (error) {
                toast.error(errorText(error));
              }
            },
          });
        }}
      >
        <Stack space="space.150">
          <form.Field name="procedure">
            {(field) => (
              <Field
                label="Procedure"
                isRequired
                error={field.state.meta.errors.join(" ") || undefined}
              >
                <NativeSelect
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                >
                  {procedures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} · {p.title}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
          </form.Field>
          {(["operator", "build"] as const).map((name) => (
            <form.Field key={name} name={name}>
              {(field) => (
                <Field
                  label={name === "operator" ? "Operator" : "Tested build or configuration"}
                  isRequired
                  error={field.state.meta.errors.join(" ") || undefined}
                >
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
          ))}
        </Stack>
      </form>
    </Dialog>
  );
}

function RecordStepDialog({
  programId,
  run,
  stepId,
  onClose,
}: {
  programId: string;
  run: TestRun;
  stepId: string;
  onClose: () => void;
}) {
  useEvidenceVersion();
  const existing = run.records.find((r) => r.step === stepId);
  const { form, values, formId, formRef } = useRecordForm(
    {
      result: existing?.result ?? ("Pass" as StepResult),
      observed: existing?.observed === "—" ? "" : (existing?.observed ?? ""),
      evidence: existing?.evidence[0] ?? "",
    },
    (v) => ({ observed: v.observed, evidence: v.evidence }),
  );
  const available = evidenceForProgram(programId);
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Record ${stepId}`}
      description={procedureById.get(run.procedure)?.steps.find((s) => s.id === stepId)?.action}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId}>
            Save observation
          </Button>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit({
            save: () => {
              try {
                if (!available.some((a) => a.id === values.evidence))
                  throw new Error("Select supporting evidence from this program.");
                recordStep(run.id, stepId, {
                  result: values.result,
                  observed: values.observed.trim(),
                  evidence: [...new Set([values.evidence, ...(existing?.evidence.slice(1) ?? [])])],
                  at: new Date().toISOString(),
                });
                onClose();
                toast.success("Observation recorded");
              } catch (error) {
                toast.error(errorText(error));
              }
            },
          });
        }}
      >
        <Stack space="space.150">
          <Field label="Result">
            <NativeSelect
              value={values.result}
              onChange={(e) => form.setFieldValue("result", e.target.value as StepResult)}
            >
              {["Pass", "Fail", "Inconclusive"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </NativeSelect>
          </Field>
          <form.Field name="observed">
            {(field) => (
              <Field
                label="What was observed"
                isRequired
                error={field.state.meta.errors.join(" ") || undefined}
              >
                <Textarea
                  rows={4}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="evidence">
            {(field) => (
              <Field
                label="Supporting evidence"
                isRequired
                hint={
                  available.length
                    ? undefined
                    : "Add an artifact in the program's Evidence tab first."
                }
                error={field.state.meta.errors.join(" ") || undefined}
              >
                <NativeSelect
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                >
                  <option value="">Choose evidence</option>
                  {available.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} · {a.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
          </form.Field>
        </Stack>
      </form>
    </Dialog>
  );
}
