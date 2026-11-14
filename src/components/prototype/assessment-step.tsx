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
} from "@ledger/design-system";
import { ChoiceField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  choiceRequests,
  useAddControlsToAssessmentPlan,
  useControlAssessment,
  useDraftPlanDetails,
  usePlanControlAssessment,
  usePlanSspOptions,
  type AssessmentCampaignPlan,
} from "@/lib/control-assessment";
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
  /** The plan holds the control already. */
  holds: boolean;
  /** The plan's SSP selects the control, which the plan needs to take it. */
  selects: boolean;
};

/** Why a campaign cannot take the control, or nothing when it can. */
const reasonOf = (row: CampaignChoice, code: string) =>
  row.holds ? `Holds ${code}` : !row.selects ? "Not in its SSP's control baseline" : undefined;

/**
 * Add to assessment campaign: choose one of the program's open campaigns that has a draft plan,
 * and the control becomes one of its objectives in one request, at the plan revision the reader
 * saw. A campaign whose plan holds the control already, or whose SSP does not select it, is marked
 * with why and cannot be chosen. Where no campaign has a draft plan, the empty state plans an
 * assessment around the control instead.
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
  const assessment = useControlAssessment(programId, control.id);
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
          holds: campaign.holds,
          selects: detail?.selects ?? false,
        };
      }),
    [drafts, details.data],
  );
  const counted = !!details.data;
  const columns = useMemo(
    () =>
      defineColumns<CampaignChoice>((c) => [
        c.text("title", {
          header: "Assessment campaign",
          priority: 0,
          minWidth: 220,
          hideable: false,
          // Why the campaign cannot take the control, once its plan's SSP has been read.
          badge: (row) => {
            const why = counted ? reasonOf(row, control.code) : undefined;
            return why ? (
              <Badge size="xsmall" variant="secondary" tone="neutral">
                {why}
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
    [counted, control.code],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    selectable: (row) => counted && !reasonOf(row, control.code),
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
      // One request: the control becomes one objective of the plan, or the plan is left as it was.
      const answer = await add.mutateAsync({
        planRevisionId: chosen.planId,
        expectedRevision: chosen.planRevision,
        requestId: requestFor([chosen.planId, control.id]),
        controlIds: [control.id],
      });
      toast.add(
        answer.added > 0
          ? { type: "success", title: `${control.code} added to ${chosen.title}` }
          : { type: "information", title: `${chosen.title} already holds ${control.code}` },
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
  const failed = reads.some((read) => read.isError && read.data === undefined);
  const loading = !failed && (!assessment.data || (drafts.length > 0 && !counted));
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
        <Text as="p" size="small" color="color.text.subtle">
          {`${control.code} becomes one objective of the campaign's draft plan, aimed at its statement.`}
        </Text>
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
 * to a published SSP of one of the program's systems, holding the control as its first objective.
 * One request writes all three, or none; planning again after a failure plans no second campaign.
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
  const formId = useId();
  const options = usePlanSspOptions(programId, control.id);
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
  const saved = useRef<string | null>(null);
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
  const unavailable = optionsFailed
    ? "The program's SSPs could not be loaded. Retry loading them first."
    : !options.data
      ? "The program's SSPs are still loading."
      : usable.length === 0
        ? `No published SSP of the program's systems selects ${control.code}.`
        : undefined;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || unavailable) return;
    setFailure(null);
    if (!feedback.report(issues) || !chosenSsp) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    const named = title.trim();
    try {
      await plan.mutateAsync({
        programId,
        sspRevisionId: chosenSsp,
        title: named,
        requestId: requestFor([chosenSsp, named, control.id]),
        controlIds: [control.id],
      });
      saved.current = named;
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
        if (saved.current)
          toast.add({ type: "success", title: `${control.code} planned in ${saved.current}` });
        onClose();
        if (saved.current) onDone();
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
