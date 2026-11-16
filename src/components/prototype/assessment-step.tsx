// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// Add to assessment campaign is a `PickerSheet` that chooses one of the program's planned or active
// campaigns whose latest plan is a draft, with its status, draft plan, objectives and window, under
// a line that says what the plan takes of the control (AC-2 joins the campaign's draft plan as its
// 26 assessment objectives; a plan that holds some takes only the rest; for a control judged in
// part, AC-2 joins the campaign's draft plan as the 23 of its 26 assessment objectives nobody has
// judged): a campaign whose plan holds some of what the control takes says how many beside its name
// (Holds 12 of 26 objectives; for a control judged in part, Holds 5 of 23 left to judge, a short
// note, since a badge keeps its width while the name gives way) and stays choosable, and one whose
// plan holds all of it already (the control, or for a control judged in part every objective nobody
// has judged, as the step's Open assessment campaign reads `holds_unjudged`) or whose SSP does not
// select it is marked and not chosen (`AssessmentSurface` in assessment-step); with none, its empty
// state opens Plan an assessment in its place. Plan an assessment is a Dialog with Title (the
// control's code and assessment unsaid) and SSP, the latest published SSP of each of the program's
// systems that selects the control, preselected when there is one. Above them it says what it plans
// before its primary runs, as the picker's line does: Plans AC-2's 26 assessment objectives; for a
// control judged in part, Plans the 23 of AC-2's 26 assessment objectives nobody has judged; for a
// control that counts none, Plans AC-2 as one objective, aimed at its statement. The line is read
// as the Dialog opens, `plan_control_holdings` naming no plan (`usePlanTakes` in
// control-assessment): while that read loads, the line keeps its place and the primary waits with
// its reason (The objectives the plan will hold are still being counted.), and a failure is the
// Dialog's alert with Retry counting objectives, the primary saying it waits on that. Each writes
// the control as the assessment objectives it counts, the list `program_control_objectives` gives
// in its order, one plan objective each, titled by its label and text (AC-02a.[01] account types
// allowed for use within the system are defined and documented) and aimed at that objective, and a
// control that counts none as one objective aimed at its statement, titled by its code and title.
// Only what's left: of a control the program's assessors have judged in part (some of the
// objectives it counts and not all), each writes only the objectives nobody has judged, so AC-2
// with 3 of its 26 judged takes 23; a control nobody has judged, or one judged on every objective
// (a reassessment its step never offers), is written whole. A plan holds the control once it holds
// every objective the control counts, or its statement, as every plan written before plans took
// objectives does; an objective aimed at a heading holds the objectives under it, and a plan that
// holds some takes only the rest. Each is one request whose id is chosen once per choice:
// `add_controls_to_assessment_plan` at the plan revision the reader saw, refused once the plan
// changed or was published, and `plan_control_assessment`, a planned campaign with its first plan a
// draft on the chosen SSP, both through control-assessment; what each open campaign's plan holds of
// the control, and how many of its objectives the program's assessors have judged, which the step
// and the picker read, is one read, `plan_control_holdings` through `useControlAssessment`, what is
// taken said by `assessmentTakes` in control-assessment. A toast says what was added, the control
// by its code and title: 26 objectives of AC-2 Account Management added to Continuous monitoring
// FY2027, or 14 more objectives of AC-2 Account Management where the plan held some, and 9
// objectives of AC-8 System Use Notification planned in AC-8 assessment; for a control judged in
// part, 23 objectives of AC-2 Account Management nobody has judged added to Continuous monitoring
// FY2027 (18 more where the plan held 5 of them) or planned in AC-2 assessment; a control written
// as its statement is named with no count.

import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorSummary,
  FieldSet,
  PickerSheet,
  Stack,
  Text,
  defineColumns,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { ChoiceField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  assessmentTakes,
  campaignHolds,
  choiceRequests,
  useAddControlsToAssessmentPlan,
  useControlAssessment,
  useDraftPlanDetails,
  usePlanControlAssessment,
  usePlanSspOptions,
  usePlanTakes,
  type AddedObjectives,
  type AssessmentCampaignPlan,
  type AssessmentTakes,
  type PlanTakes,
} from "@/lib/control-assessment";
import { controlName } from "@/lib/product-records";
import { campaignStatuses } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import type { StepControl, StepSurfaceProps } from "./map-requirement";
import { focusWhereStepWas } from "./step-focus";
import { QueryState } from "./work-common";

/** A campaign with a draft plan, as the picker offers it. */
type CampaignChoice = {
  id: string;
  title: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  planId: string;
  planTitle: string;
  /** The plan revision the reader saw, which the command is sent at. */
  planRevision: number;
  /** How many objectives the draft plan holds; none until they are counted. */
  objectives: number | null;
  /**
   * The plan holds what an assessment takes of the control already: every objective it counts, or
   * its statement; of a control judged in part, every objective nobody has judged.
   */
  holds: boolean;
  /** How many of the objectives an assessment takes of the control the plan holds. */
  held: number;
  /** The plan's SSP selects the control, which the plan needs to take it. */
  selects: boolean;
};

type Plural = ReturnType<typeof useLedgerLocale>["formatPlural"];
type Format = ReturnType<typeof useLedgerLocale>["formatNumber"];

/** Why a campaign cannot take the control, or nothing when it can. */
const reasonOf = (row: CampaignChoice, code: string) =>
  row.holds ? `Holds ${code}` : !row.selects ? "Not in its SSP's control baseline" : undefined;

/**
 * What a campaign's row says beside its name: why it cannot take the control, or, where its plan
 * holds some of the objectives an assessment takes of the control, how many, since choosing it adds
 * the rest ("Holds 12 of 26 objectives"; of a control judged in part, "Holds 5 of 23 left to
 * judge", the 23 the line above names). A badge keeps its width while the name gives way, so the
 * note stays short enough to leave the campaign's name readable in a phone's frame.
 */
const noteOf = (row: CampaignChoice, code: string, takes: AssessmentTakes, format: Format) =>
  reasonOf(row, code) ??
  (row.held > 0 && row.held < takes.objectives
    ? `Holds ${format(row.held)} of ${format(takes.objectives)} ${takes.unjudged ? "left to judge" : "objectives"}`
    : undefined);

/**
 * What joining a draft plan writes of the control, said above the campaigns to choose from: the
 * assessment objectives it counts, or, of a control its assessors have judged in part, the ones
 * nobody has judged.
 */
function joinsAs(code: string, counted: number, takes: AssessmentTakes, formatNumber: Format) {
  if (counted === 0)
    return `${code} becomes one objective of the campaign's draft plan, aimed at its statement.`;
  if (takes.unjudged)
    return takes.objectives === 1
      ? `${code} joins the campaign's draft plan as the one of its ${formatNumber(counted)} assessment objectives nobody has judged.`
      : `${code} joins the campaign's draft plan as the ${formatNumber(takes.objectives)} of its ${formatNumber(counted)} assessment objectives nobody has judged; a plan that holds some takes only the rest.`;
  if (counted === 1)
    return `${code} joins the campaign's draft plan as its one assessment objective.`;
  return `${code} joins the campaign's draft plan as its ${formatNumber(counted)} assessment objectives; a plan that holds some takes only the rest.`;
}

/**
 * What Plan an assessment plans of the control, said before its primary runs, as the picker's line
 * says what joining a draft plan writes: the assessment objectives it counts, or, of a control its
 * assessors have judged in part, the ones nobody has judged; of a control that counts none, its
 * statement.
 */
function plansAs(code: string, takes: PlanTakes, formatNumber: Format) {
  if (takes.counted === 0) return `Plans ${code} as one objective, aimed at its statement.`;
  if (takes.unjudged)
    return takes.objectives === 1
      ? `Plans the one of ${code}'s ${formatNumber(takes.counted)} assessment objectives nobody has judged.`
      : `Plans the ${formatNumber(takes.objectives)} of ${code}'s ${formatNumber(takes.counted)} assessment objectives nobody has judged.`;
  if (takes.counted === 1) return `Plans ${code}'s one assessment objective.`;
  return `Plans ${code}'s ${formatNumber(takes.counted)} assessment objectives.`;
}

/**
 * What a command added of the control, in a toast's words: how many of its objectives ("14 more
 * objectives of AC-2" where the plan held some), saying so where they are the ones nobody has
 * judged ("23 objectives of AC-2 nobody has judged"), or the control itself where it counts none
 * and was written as its statement.
 */
function addedOf(answer: AddedObjectives, code: string, formatPlural: Plural) {
  if (answer.counted === 0) return code;
  // What the command took of the control: every objective it counts, but the judged ones.
  const taken = answer.counted - answer.judged;
  const forms =
    answer.added < taken
      ? { one: "{count} more objective", other: "{count} more objectives" }
      : { one: "{count} objective", other: "{count} objectives" };
  return `${formatPlural(answer.added, forms)} of ${code}${answer.judged > 0 ? " nobody has judged" : ""}`;
}

/**
 * Add to assessment campaign: choose one of the program's open campaigns that has a draft plan,
 * and the control joins it in one request, at the plan revision the reader saw, as the assessment
 * objectives it counts, one plan objective each (a control that counts none as one aimed at its
 * statement); a control its assessors have judged in part joins as the objectives nobody has
 * judged. A campaign whose plan holds some of them says how many and takes the rest; one whose plan
 * holds them all already, or whose SSP does not select the control, is marked with why and cannot
 * be chosen. Where no campaign has a draft plan, the empty state plans an assessment around the
 * control instead.
 */
function AddToAssessmentPicker({
  programId,
  control,
  onClose,
  onDone,
  onPlan,
  finalFocus,
}: {
  programId: string;
  control: StepControl;
  onClose: () => void;
  /** The control was added: focus follows the step to what replaced it. */
  onDone: () => void;
  /** No campaign has a draft plan, and the reader plans an assessment instead. */
  onPlan: () => void;
  finalFocus: () => HTMLElement | boolean;
}) {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const assessment = useControlAssessment(programId, control.id);
  // How many assessment objectives the control counts, once read, and what a plan takes of them:
  // every one, or the ones nobody has judged of a control its assessors have judged in part.
  const counted = assessment.data?.objectives;
  const takes = useMemo(
    () => (assessment.data ? assessmentTakes(assessment.data) : undefined),
    [assessment.data],
  );
  const drafts = useMemo(
    () =>
      (assessment.data?.campaigns ?? []).filter(
        (
          campaign,
        ): campaign is AssessmentCampaignPlan & {
          plan: NonNullable<AssessmentCampaignPlan["plan"]>;
        } => campaign.plan?.state === "draft",
      ),
    [assessment.data],
  );
  const plans = useMemo(() => drafts.map((campaign) => campaign.plan), [drafts]);
  const details = useDraftPlanDetails(plans, control.id, { enabled: !!assessment.data });
  const rows = useMemo<CampaignChoice[]>(
    () =>
      drafts.map((campaign) => {
        const detail = details.data?.get(campaign.plan.id);
        // What the plan holds of what an assessment takes of the control.
        const holding = takes
          ? campaignHolds(campaign, takes)
          : { held: campaign.objectivesHeld, holds: campaign.holds };
        return {
          id: campaign.id,
          title: campaign.title,
          status: campaign.status,
          startsAt: campaign.startsAt,
          endsAt: campaign.endsAt,
          planId: campaign.plan.id,
          planTitle: campaign.plan.title,
          planRevision: campaign.plan.revision,
          objectives: detail?.objectives ?? null,
          holds: holding.holds,
          held: holding.held,
          selects: detail?.selects ?? false,
        };
      }),
    [drafts, details.data, takes],
  );
  const read = !!details.data && !!takes;
  const columns = useMemo(
    () =>
      defineColumns<CampaignChoice>((c) => [
        c.text("title", {
          header: "Assessment campaign",
          priority: 0,
          // Room for the name beside its note ("Holds 12 of 26 objectives", "Holds 5 of 23 left
          // to judge"); the later columns fold into the row's More fields first.
          minWidth: 360,
          hideable: false,
          // Why the campaign cannot take the control, or how much of it its plan holds, once its
          // plan's SSP has been read.
          badge: (row) => {
            const note = read && takes ? noteOf(row, control.code, takes, formatNumber) : undefined;
            return note ? (
              <Badge size="xsmall" variant="secondary" tone="neutral">
                {note}
              </Badge>
            ) : null;
          },
        }),
        c.status("status", {
          header: "Status",
          width: 120,
          priority: 1,
          statuses: campaignStatuses,
        }),
        c.text("planTitle", { header: "Draft plan", minWidth: 180, priority: 3 }),
        c.number("objectives", { header: "Objectives", width: 110, priority: 2 }),
        c.date("startsAt", { header: "Starts", priority: 4 }),
        c.date("endsAt", { header: "Ends", priority: 5 }),
      ]),
    [read, takes, control.code, formatNumber],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    selectable: (row) => read && !reasonOf(row, control.code),
    enableMultiRowSelection: false,
    label: "Assessment campaigns to add to",
  });
  const chosenId = Object.keys(table.state.rowSelection).find((id) => table.state.rowSelection[id]);
  const chosen = rows.find((row) => row.id === chosenId);
  const add = useAddControlsToAssessmentPlan();
  const [error, setError] = useState<string>();
  // An id chosen once for each choice, so adding it again after a lost answer adds nothing more.
  const [requestFor] = useState(() => choiceRequests());
  const guard = useDraftGuard({
    dirty: !!chosen,
    onClose,
    description: "The campaign you chose will be lost.",
  });
  async function addChosen() {
    if (!chosen || !guard.start()) return;
    setError(undefined);
    try {
      // One request: the plan takes the objectives of the control it does not hold yet (of a
      // control judged in part, those nobody has judged), or is left as it was.
      const answer = await add.mutateAsync({
        planRevisionId: chosen.planId,
        expectedRevision: chosen.planRevision,
        requestId: requestFor([chosen.planId, control.id]),
        controlIds: [control.id],
      });
      toast.add(
        answer.added > 0
          ? {
              type: "success",
              title: `${addedOf(answer, controlName(control), formatPlural)} added to ${chosen.title}`,
            }
          : { type: "information", title: `${chosen.title} already holds ${controlName(control)}` },
      );
      guard.finish();
      guard.complete();
      onDone();
    } catch (cause) {
      setError(
        `${causeText(cause, "The control could not be added.")} Your choice is kept; adding it again will not add it twice.`,
      );
      guard.finish();
    }
  }
  const reads = [...assessment.queries, ...details.queries];
  const failed = reads.some((query) => query.isError && query.data === undefined);
  const loading = !failed && (!assessment.data || (drafts.length > 0 && !read));
  return (
    <PickerSheet
      open
      onClose={() => void guard.close()}
      title="Add to assessment campaign"
      subtitle={`${control.code} · ${control.title}`}
      width="xlarge"
      table={table}
      state={failed ? "error" : loading ? "loading" : "ready"}
      search={{ placeholder: "Find assessment campaigns" }}
      toolbar={
        // What the plan takes of the control, once it is known how many objectives it counts and
        // how many its assessors have judged.
        counted === undefined || !takes ? undefined : (
          <Text as="p" size="small" color="color.text.subtle">
            {joinsAs(control.code, counted, takes, formatNumber)}
          </Text>
        )
      }
      finalFocus={finalFocus}
      pending={guard.busy}
      error={error}
      action={{
        label: chosen ? `Add to ${chosen.title}` : "Add to assessment campaign",
        onClick: () => void addChosen(),
        disabled: !chosen,
      }}
    >
      <QueryState queries={reads} region>
        <DataTable
          responsive
          table={table}
          state={loading ? "loading" : "ready"}
          empty={{
            illustration: "calendar",
            title: "No campaign has a draft plan",
            description: `${control.code} is added to the draft plan of one of the program's planned or active campaigns. Plan an assessment around it instead.`,
            action: (
              <Button size="small" variant="primary" onClick={onPlan}>
                Plan an assessment
              </Button>
            ),
          }}
        />
      </QueryState>
      {guard.confirmation}
    </PickerSheet>
  );
}

type PlanField = "title" | "ssp";
const TITLE_LIMIT = 300;

/**
 * Plan an assessment: a new campaign of the program, planned, whose first plan is a draft pinned
 * to a published SSP of one of the program's systems, holding the control as the assessment
 * objectives it counts (its statement, where it counts none; the objectives nobody has judged, of a
 * control its assessors have judged in part). The Dialog says which before its primary runs, read
 * as it opens (`usePlanTakes`): while that read loads or after it fails the primary waits with its
 * reason, and a failure is the Dialog's alert with Retry. The toast says what was planned. One
 * request writes all three, or none; planning again after a failure plans no second campaign.
 */
function PlanAssessmentDialog({
  programId,
  control,
  onClose,
  onDone,
  finalFocus,
}: {
  programId: string;
  control: StepControl;
  onClose: () => void;
  /** The assessment was planned: focus follows the step to what replaced it. */
  onDone: () => void;
  finalFocus: () => HTMLElement | boolean;
}) {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const formId = useId();
  const options = usePlanSspOptions(programId, control.id);
  // What the plan will hold of the control, said before the primary runs.
  const taken = usePlanTakes(programId, control.id);
  const usable = useMemo(
    () => (options.data ?? []).filter((option) => option.selects),
    [options.data],
  );
  const plan = usePlanControlAssessment();
  const feedback = useFormFeedback<PlanField>();
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState(`${control.code} assessment`);
  const [sspId, setSspId] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  // The campaign planned and what its plan took of the control, which the toast says once closed.
  const saved = useRef<{ title: string; answer: AddedObjectives } | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  // One published SSP that selects the control is the answer already; with several, the reader's.
  const chosenSsp = sspId ?? (usable.length === 1 ? usable[0]!.id : null);
  const [requestFor] = useState(() => choiceRequests());
  const guard = useDraftGuard({
    dirty: title !== `${control.code} assessment` || sspId !== null,
    onClose: () => setOpen(false),
    description: "The assessment you started planning will be lost.",
  });
  const issues: FormIssue<PlanField>[] = [
    ...(!title.trim()
      ? [{ field: "title" as const, message: "Enter the assessment campaign's title." }]
      : title.trim().length > TITLE_LIMIT
        ? [{ field: "title" as const, message: "Shorten the title to 300 characters or fewer." }]
        : []),
    ...(!chosenSsp
      ? [{ field: "ssp" as const, message: "Choose the SSP the assessment's plan assesses." }]
      : []),
  ];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const optionsFailed = options.queries.some((query) => query.isError && query.data === undefined);
  // The reader is told what the plan will hold before it is planned: the primary waits on it.
  const counting = taken.data
    ? undefined
    : taken.query.isError
      ? "The objectives the plan will hold could not be counted. Retry counting them first."
      : "The objectives the plan will hold are still being counted.";
  const unavailable = optionsFailed
    ? "The program's SSPs could not be loaded. Retry loading them first."
    : !options.data
      ? "The program's SSPs are still loading."
      : usable.length === 0
        ? `No published SSP of the program's systems selects ${control.code}.`
        : counting;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || unavailable) return;
    setFailure(null);
    if (!feedback.report(issues) || !chosenSsp) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    const named = title.trim();
    try {
      const answer = await plan.mutateAsync({
        programId,
        sspRevisionId: chosenSsp,
        title: named,
        requestId: requestFor([chosenSsp, named, control.id]),
        controlIds: [control.id],
      });
      saved.current = { title: named, answer };
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${causeText(cause, "The assessment could not be planned.")} Your entries are kept, and planning again will not plan a second campaign.`,
      );
      guard.finish();
    }
  }
  return (
    <Dialog
      open={open}
      pending={guard.busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
      onOpenChangeComplete={(next) => {
        if (next) return;
        const planned = saved.current;
        if (planned)
          toast.add({
            type: "success",
            title: `${addedOf(planned.answer, controlName(control), formatPlural)} planned in ${planned.title}`,
          });
        onClose();
        if (planned) onDone();
      }}
    >
      <DialogContent
        width="medium"
        initialFocus={() => feedback.node("title") ?? true}
        finalFocus={finalFocus}
      >
        <DialogHeader>
          <DialogTitle>Plan an assessment</DialogTitle>
          <DialogDescription>
            {control.code} · {control.title}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {optionsFailed ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The program's SSPs could not be loaded</AlertTitle>
                  <AlertDescription>
                    {causeText(
                      options.queries.find((query) => query.error)?.error,
                      "The request failed.",
                    )}
                  </AlertDescription>
                  <AlertAction>
                    <Button
                      size="small"
                      onClick={() => {
                        for (const query of options.queries) void query.refetch();
                      }}
                    >
                      Retry loading SSPs
                    </Button>
                  </AlertAction>
                </Alert>
              ) : options.data && usable.length === 0 ? (
                <Alert role="note">
                  <AlertDescription>
                    {`An assessment plan assesses a published SSP, and no published SSP of the program's systems selects ${control.code}. Publish one that does before planning an assessment of it.`}
                  </AlertDescription>
                </Alert>
              ) : null}
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The assessment was not planned</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              {/* What the plan will hold of the control, once counted: while it is, the line keeps
                  its place, and a failure is this Dialog's alert with Retry. */}
              <QueryState queries={[taken.query]} retryLabel="Retry counting objectives">
                {taken.data && (
                  <Text as="p" size="small" color="color.text.subtle">
                    {plansAs(control.code, taken.data, formatNumber)}
                  </Text>
                )}
              </QueryState>
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy}>
                <Stack space="space.200">
                  <TextField
                    label="Title"
                    value={title}
                    onChange={setTitle}
                    required
                    characterLimit={TITLE_LIMIT}
                    description="The new assessment campaign's name. Its draft plan takes it too."
                    error={errors.get("title")}
                    controlRef={feedback.ref("title")}
                  />
                  <ChoiceField
                    label="SSP"
                    value={chosenSsp}
                    options={usable.map((option) => ({
                      value: option.id,
                      label: `${option.systemCode} · ${option.systemName} · Version ${option.versionNumber}`,
                    }))}
                    onChange={setSspId}
                    required
                    placeholder="Choose a published SSP"
                    description={`The plan assesses this SSP. Only a published SSP that selects ${control.code} is offered.`}
                    error={errors.get("ssp")}
                    controlRef={feedback.ref("ssp")}
                  />
                </Stack>
              </FieldSet>
            </Stack>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button
            ref={submitRef}
            type="submit"
            form={formId}
            variant="primary"
            isLoading={guard.busy}
            disabledReason={unavailable}
          >
            Plan an assessment
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}

/**
 * The control's step for evidence no assessor has determined, opened from its own record: Add to
 * assessment campaign opens the picker of the program's campaigns with a draft plan, and Plan an
 * assessment the form that plans a new one around the control, which the picker's empty state
 * opens too, in its place. It is held by the Details or the trace, not the step, so it stays open
 * while the step changes under it.
 */
export function AssessmentSurface({
  kind,
  programId,
  control,
  opener,
  slot,
  onClose,
}: StepSurfaceProps & { kind: "assess" | "plan_assessment" }) {
  const [planning, setPlanning] = useState(kind === "plan_assessment");
  const backToStep = () => (opener?.isConnected ? opener : true);
  const done = () => focusWhereStepWas(opener, slot);
  return planning ? (
    <PlanAssessmentDialog
      programId={programId}
      control={control}
      finalFocus={backToStep}
      onClose={onClose}
      onDone={done}
    />
  ) : (
    <AddToAssessmentPicker
      programId={programId}
      control={control}
      finalFocus={backToStep}
      onClose={onClose}
      onDone={done}
      onPlan={() => setPlanning(true)}
    />
  );
}
