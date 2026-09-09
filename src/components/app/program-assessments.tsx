import {
  FieldLabel,
  FieldError,
  FieldDescription,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Block,
  Box,
  Button,
  DataTable,
  defineColumns,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Empty,
  Fact,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  PreviewSheet,
  Stack,
  Text,
  Textarea,
  TextLink,
  toast,
  type Preset,
  useDataTable,
} from "@ledger/design-system";
import { RunRecordView } from "@/components/app/test-execution";
import {
  assessmentState,
  createAssessment,
  useAssessmentsVersion,
  type NewAssessment,
} from "@/lib/assessment-store";
import { useAssuranceVersion } from "@/lib/assurance-record-store";
import {
  campaigns,
  eventsByCampaign,
  objectiveById,
  objectivesForEvent,
  type Campaign,
} from "@/lib/campaigns";
import { currentSession } from "@/lib/control-work";
import { evidenceForProgram, useEvidenceVersion } from "@/lib/evidence-catalog";
import { assets, findingProgram, findings } from "@/lib/findings";
import { useRecordForm } from "@/lib/record-form";
import { requirementsForObjective, useVerificationVersion } from "@/lib/requirement-verification";
import { requirementsForProgram, useRequirementsVersion } from "@/lib/requirements";
import { statusTone } from "@/lib/spine";
import {
  assessmentRunForProgram,
  campaignExecution,
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
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useId, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ZodError } from "zod";

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
  const fieldId = useId();

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
  const idItems = assessmentRuns.map((r) => ({
    value: r.id,
    label: (
      <>
        {r.id} · {r.build} · {r.state}
        {r.retestOf ? ` · retest of ${r.retestOf}` : ""}
      </>
    ),
  }));
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
                <Field>
                  <FieldLabel
                    id={`${fieldId}-run-history-1-label`}
                    htmlFor={`${fieldId}-run-history-1`}
                  >
                    {"Run history"}
                  </FieldLabel>
                  <Select<string>
                    items={idItems}
                    value={run.id}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return setRunId(value);
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-run-history-1`}
                      aria-labelledby={`${fieldId}-run-history-1-label`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-run-history-1-label`}>
                      {idItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
  const fieldId = useId();

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
  const requirementItems = [
    { value: "", label: "No linked requirement" },
    ...requirementsForProgram(programId).map((r) => ({
      value: r.id,
      label: (
        <>
          {r.id} · {r.text}
        </>
      ),
    })),
  ];
  const assetItems = [
    { value: "", label: "Program scope" },
    ...assets.filter((a) => a.program === programId).map((a) => ({ value: a.id, label: a.name })),
  ];
  const methodItems = ["Examine", "Interview", "Test"].map((m) => ({ value: m, label: m }));
  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent
        style={{ maxWidth: ({ medium: 520, large: 860 } as const)["large"] }}
        className="top-200 translate-y-0 sm:top-600"
      >
        <DialogHeader>
          <DialogTitle>New assessment</DialogTitle>
          <DialogDescription>
            Plan what will be assessed, how it will be checked, and what constitutes a passing
            result.
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
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
                  {(field) => {
                    const fieldError2 = field.state.meta.errors.length
                      ? field.state.meta.errors.join(" ")
                      : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError2)}>
                        <FieldLabel
                          id={`${fieldId}-field-2-${encodeURIComponent(String(name))}-label`}
                          htmlFor={`${fieldId}-field-2-${encodeURIComponent(String(name))}`}
                        >
                          {label}
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        </FieldLabel>
                        {["scope", "objective", "action", "expected"].includes(name) ? (
                          <Textarea
                            id={`${fieldId}-field-2-${encodeURIComponent(String(name))}`}
                            aria-labelledby={`${fieldId}-field-2-${encodeURIComponent(String(name))}-label`}
                            aria-required={true}
                            aria-invalid={Boolean(fieldError2)}
                            aria-describedby={
                              fieldError2
                                ? `${fieldId}-field-2-${encodeURIComponent(String(name))}-message`
                                : undefined
                            }
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            name={name}
                            rows={2}
                          />
                        ) : (
                          <Input
                            id={`${fieldId}-field-2-${encodeURIComponent(String(name))}`}
                            aria-labelledby={`${fieldId}-field-2-${encodeURIComponent(String(name))}-label`}
                            aria-required={true}
                            aria-invalid={Boolean(fieldError2)}
                            aria-describedby={
                              fieldError2
                                ? `${fieldId}-field-2-${encodeURIComponent(String(name))}-message`
                                : undefined
                            }
                            type={name === "start" || name === "end" ? "date" : "text"}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            name={name}
                          />
                        )}
                        {fieldError2 ? (
                          <FieldError
                            id={`${fieldId}-field-2-${encodeURIComponent(String(name))}-message`}
                          >
                            {fieldError2}
                          </FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
              ))}
              <Grid templateColumns={{ sm: "1fr 1fr" }} gap="space.150">
                <Field>
                  <FieldLabel
                    id={`${fieldId}-requirement-3-label`}
                    htmlFor={`${fieldId}-requirement-3`}
                  >
                    {"Requirement"}
                  </FieldLabel>
                  <Select<string>
                    items={requirementItems}
                    value={values.requirement}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return form.setFieldValue("requirement", value);
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-requirement-3`}
                      aria-labelledby={`${fieldId}-requirement-3-label`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-requirement-3-label`}>
                      {requirementItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-assessment-subject-4-label`}
                    htmlFor={`${fieldId}-assessment-subject-4`}
                  >
                    {"Assessment subject"}
                  </FieldLabel>
                  <Select<string>
                    items={assetItems}
                    value={values.asset}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return form.setFieldValue("asset", value);
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-assessment-subject-4`}
                      aria-labelledby={`${fieldId}-assessment-subject-4-label`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-assessment-subject-4-label`}>
                      {assetItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Grid>
              <Field>
                <FieldLabel id={`${fieldId}-method-5-label`} htmlFor={`${fieldId}-method-5`}>
                  {"Method"}
                </FieldLabel>
                <Select<string>
                  items={methodItems}
                  value={values.method}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return form.setFieldValue("method", value as NewAssessment["method"]);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-method-5`}
                    aria-labelledby={`${fieldId}-method-5-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-method-5-label`}>
                    {methodItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </Stack>
          </form>
        </Box>
        <DialogFooter>
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" form={formId}>
              Create assessment
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
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
  const fieldId = useId();

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
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
        <DialogHeader>
          <DialogTitle>
            {previous?.state === "Complete" ? "Start retest" : "Start assessment run"}
          </DialogTitle>
          <DialogDescription>
            Each run keeps its own tested build and evidence. Previous results remain in the run
            history.
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
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
                    if (!objective?.event)
                      throw new Error("The procedure needs an assessment event.");
                    onStarted(
                      createTestRun({
                        ...values,
                        event: objective.event,
                        ...(previous?.state === "Complete" &&
                        previous.procedure === values.procedure
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
                {(field) => {
                  const valueItems = procedures.map((p) => ({
                    value: p.id,
                    label: (
                      <>
                        {p.id} · {p.title}
                      </>
                    ),
                  }));
                  const fieldError6 = field.state.meta.errors.join(" ") || undefined;
                  return (
                    <Field data-invalid={Boolean(fieldError6)}>
                      <FieldLabel
                        id={`${fieldId}-procedure-6-label`}
                        htmlFor={`${fieldId}-procedure-6`}
                      >
                        {"Procedure"}
                        <span aria-hidden="true" className="text-danger">
                          {" "}
                          *
                        </span>
                      </FieldLabel>
                      <Select<string>
                        items={valueItems}
                        value={field.state.value}
                        onValueChange={(value) => {
                          if (value === null) return;
                          return field.handleChange(value);
                        }}
                      >
                        <SelectTrigger
                          id={`${fieldId}-procedure-6`}
                          aria-labelledby={`${fieldId}-procedure-6-label`}
                          aria-required={true}
                          aria-invalid={Boolean(fieldError6)}
                          aria-describedby={
                            fieldError6 ? `${fieldId}-procedure-6-message` : undefined
                          }
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent aria-labelledby={`${fieldId}-procedure-6-label`}>
                          {valueItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldError6 ? (
                        <FieldError id={`${fieldId}-procedure-6-message`}>{fieldError6}</FieldError>
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>
              {(["operator", "build"] as const).map((name) => (
                <form.Field key={name} name={name}>
                  {(field) => {
                    const fieldError7 = field.state.meta.errors.join(" ") || undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError7)}>
                        <FieldLabel
                          id={`${fieldId}-field-7-${encodeURIComponent(String(name))}-label`}
                          htmlFor={`${fieldId}-field-7-${encodeURIComponent(String(name))}`}
                        >
                          {name === "operator" ? "Operator" : "Tested build or configuration"}
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        </FieldLabel>
                        <Input
                          id={`${fieldId}-field-7-${encodeURIComponent(String(name))}`}
                          aria-labelledby={`${fieldId}-field-7-${encodeURIComponent(String(name))}-label`}
                          aria-required={true}
                          aria-invalid={Boolean(fieldError7)}
                          aria-describedby={
                            fieldError7
                              ? `${fieldId}-field-7-${encodeURIComponent(String(name))}-message`
                              : undefined
                          }
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                        />
                        {fieldError7 ? (
                          <FieldError
                            id={`${fieldId}-field-7-${encodeURIComponent(String(name))}-message`}
                          >
                            {fieldError7}
                          </FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
              ))}
            </Stack>
          </form>
        </Box>
        <DialogFooter>
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" form={formId} type="submit">
              Start run
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
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
  const fieldId = useId();

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
  const resultItems = ["Pass", "Fail", "Inconclusive"].map((v) => ({ value: v, label: v }));
  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
        <DialogHeader>
          <DialogTitle>{`Record ${stepId}`}</DialogTitle>
          <DialogDescription>
            {procedureById.get(run.procedure)?.steps.find((s) => s.id === stepId)?.action}
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
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
                      evidence: [
                        ...new Set([values.evidence, ...(existing?.evidence.slice(1) ?? [])]),
                      ],
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
              <Field>
                <FieldLabel id={`${fieldId}-result-8-label`} htmlFor={`${fieldId}-result-8`}>
                  {"Result"}
                </FieldLabel>
                <Select<string>
                  items={resultItems}
                  value={values.result}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return form.setFieldValue("result", value as StepResult);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-result-8`}
                    aria-labelledby={`${fieldId}-result-8-label`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-result-8-label`}>
                    {resultItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <form.Field name="observed">
                {(field) => {
                  const fieldError9 = field.state.meta.errors.join(" ") || undefined;
                  return (
                    <Field data-invalid={Boolean(fieldError9)}>
                      <FieldLabel
                        id={`${fieldId}-what-was-observed-9-label`}
                        htmlFor={`${fieldId}-what-was-observed-9`}
                      >
                        {"What was observed"}
                        <span aria-hidden="true" className="text-danger">
                          {" "}
                          *
                        </span>
                      </FieldLabel>
                      <Textarea
                        id={`${fieldId}-what-was-observed-9`}
                        aria-labelledby={`${fieldId}-what-was-observed-9-label`}
                        aria-required={true}
                        aria-invalid={Boolean(fieldError9)}
                        aria-describedby={
                          fieldError9 ? `${fieldId}-what-was-observed-9-message` : undefined
                        }
                        rows={4}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {fieldError9 ? (
                        <FieldError id={`${fieldId}-what-was-observed-9-message`}>
                          {fieldError9}
                        </FieldError>
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>
              <form.Field name="evidence">
                {(field) => {
                  const valueItems2 = [
                    { value: "", label: "Choose evidence" },
                    ...available.map((a) => ({
                      value: a.id,
                      label: (
                        <>
                          {a.id} · {a.label}
                        </>
                      ),
                    })),
                  ];
                  const fieldError10 = field.state.meta.errors.join(" ") || undefined;
                  const fieldHint10 = available.length
                    ? undefined
                    : "Add an artifact in the program's Evidence tab first.";
                  return (
                    <Field data-invalid={Boolean(fieldError10)}>
                      <FieldLabel
                        id={`${fieldId}-supporting-evidence-10-label`}
                        htmlFor={`${fieldId}-supporting-evidence-10`}
                      >
                        {"Supporting evidence"}
                        <span aria-hidden="true" className="text-danger">
                          {" "}
                          *
                        </span>
                      </FieldLabel>
                      <Select<string>
                        items={valueItems2}
                        value={field.state.value}
                        onValueChange={(value) => {
                          if (value === null) return;
                          return field.handleChange(value);
                        }}
                      >
                        <SelectTrigger
                          id={`${fieldId}-supporting-evidence-10`}
                          aria-labelledby={`${fieldId}-supporting-evidence-10-label`}
                          aria-required={true}
                          aria-invalid={Boolean(fieldError10)}
                          aria-describedby={
                            fieldError10 || fieldHint10
                              ? `${fieldId}-supporting-evidence-10-message`
                              : undefined
                          }
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent aria-labelledby={`${fieldId}-supporting-evidence-10-label`}>
                          {valueItems2.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldError10 ? (
                        <FieldError id={`${fieldId}-supporting-evidence-10-message`}>
                          {fieldError10}
                        </FieldError>
                      ) : fieldHint10 ? (
                        <FieldDescription id={`${fieldId}-supporting-evidence-10-message`}>
                          {fieldHint10}
                        </FieldDescription>
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>
            </Stack>
          </form>
        </Box>
        <DialogFooter>
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" form={formId}>
              Save observation
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
