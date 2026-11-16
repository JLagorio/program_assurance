// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// The create and edit surface is a `Dialog` titled with the operation and the singular product
// noun. The trigger, the dialog title and the primary use the same words: Create task, Create
// organization, Create risk. `productRecordNoun` and `productCreateLabel` in product-records own
// the generic vocabulary, including the party subtype. Create makes a new record; Add or Link
// connects an existing one. A surface has one primary: the page header's, a dialog footer's or the
// preview's record header's, and a collection beside others creates through a secondary
// (Registers). Reference: CreateTaskDialog (src/components/prototype/create-task-dialog.tsx).
//
// `DialogContent` takes a `width` step (`medium` for a few fields, `large` for a form in two
// columns), never a pixel width. `DialogBody` (in a Sheet, `SheetBody`) is the one scrolling
// region; the form sits inside it and the footer stays outside, joined to the form through native
// form ownership (`form` on the submit button). In `DialogFooter`, Cancel is a `DialogClose`
// rendered as a subtle Button, before the operation's primary; a dialog whose choices apply as they
// are made (the tailoring decisions) has no draft to cancel, and its secondary is Close. A button
// says the operation, never OK, Submit or Save alone. Navigation styled as a button is a
// `LinkButton` or `LinkIconButton`, never a Button that navigates.
//
// Every control sits in a kit `Field`, which binds its label, hint and `FieldError` to the control
// and carries `required`, `invalid` and `disabled` to it; a form writes no ids or ARIA. The
// wrappers in fields take the field's `error` and a `controlRef`: `TextField` for text,
// `ChoiceField` (a Select) for a fixed list of values, `ComboboxField` for a set of records,
// `PartyField` for a person or organization; a moment is a `DateTimeField` and a day a
// `DatePicker`, never a native date input.
//
// The Field marks a required field; a placeholder never says optional. A length limit is the
// field's `characterLimit`: a count under the field (always under several lines, from near the
// limit under one) and a FieldError on submit that says how many characters fit; a form never sets
// `maxLength`, which cuts a paste off without a word. A choice that waits on another answer is
// `readOnly` with a description that says why (Choose a control first.), never `disabled`, so it
// keeps its Tab stop.
//
// The first field takes focus through `initialFocus` on the dialog or sheet content, never
// `autoFocus`. Focus returns to the opener on close, so the opener stays enabled and mounted while
// its surface is open; where it cannot, `finalFocus` names a stable element. Validate on submit
// with the primary enabled, then on change. Every issue marks its field with a FieldError that says
// what fixes it. One issue moves focus to its control; several show an `ErrorSummary` above the
// fields, which takes focus and leads to each control. `useFormFeedback` in form-feedback holds the
// attempt, the summary and that focus. A result that is not about one field (a failed save, choices
// that did not load, an unavailable context) is an `Alert` with an explicit role at the top of the
// body: `role="alert"` for a failure, `role="status"` or `role="note"` for a notice. The form never
// writes its own `role="alert"` paragraph. A primary that truly cannot run, such as for a viewer,
// keeps its place and explains itself with `disabledReason`.
//
// A dirty dismissal, a route change away from a draft and a destructive decision go through
// `useConfirmation` in confirmation (`discardChanges` for a draft), which renders the kit
// `AlertDialog`; never `window.confirm`. `useDraftGuard` in use-draft-guard owns a form's dirty and
// pending state: it asks before a dirty close or route change, and `start`, `finish` and `complete`
// bracket the save.
//
// A link a reader can remove has a danger row action and the same item in its preview's overflow
// menu, through a command in `src/lib` (requirement-links); `useRemovalFocus` in record-preview
// then moves focus to the collection's primary. Reference: the requirement Allocation, Control
// mappings and Evidence tabs. A pending save sets `pending` on the Dialog or Sheet, which cancels
// Escape, outside dismissal and every close control; the fields sit in `FieldSet disabled`, focus
// moves to the primary, which shows `isLoading` and is never also `disabled`, and the guard blocks
// navigation. A failed save ends the pending state, keeps the draft and focus, and only then says
// that retrying will not duplicate the record.
//
// Reload and tab-close protection is the browser's `beforeunload`, never a custom dialog.
//
// - Program setup is a page wizard;
//
// - The diagnostic schema inspector keeps addressable `/records/:collection/new` create pages.
// Product workflows use the Dialog default; the inspector shares its validation, labels and draft
// protection. - One supported property is an `Editable`; a filter or a reason at its button is a
// `Popover`. - Choosing records is a `PickerSheet`; it may collect one shared rationale when
// applying a selection, with dirty and pending protection. A PickerSheet whose candidates come from
// queries passes `state` as its DataTable does, so its footer never says there is nothing to choose
// from while they load or after they fail.
//
// A second step that authors specifications moves to a Dialog. A record's next step opens its
// PickerSheet over the record, from the step, rather than leading away to where the records are
// listed: a control's Map a requirement, which chooses many under one shared Relationship and
// Rationale, and its Add to assessment campaign, which chooses one campaign (`selectable` on one
// row at a time), both held by the region the step sits in so they outlive it (Record pages, the
// control's records). Linking related records is a `RecordBrowser`. Their internal preview belongs
// to the selection task. A RecordBrowser over a collection that can hold thousands of records reads
// it a page at a time (its `server`): the caller holds the browser's question, each opening asking
// from the first page, and reads the page that answers it through `useServerPage` in
// collection-question over a `serverRead`, with each filter's values as `filterOptions`; the
// browser keeps the records its choices need, so one chosen on another page is counted and linked
// with the rest, and a version the reader made and published from its actions returns chosen
// through `server.selected`. Reference: Add evidence in requirement-evidence. A linking form may
// supply an explicit operation label so its trigger, title and submit button all say the same Link
// operation.
//
// - The evidence version review is the modal preview above. - A record's Comments section writes a
// comment in an inline `Composer` at the top of the section, above its newest-first `Timeline`.
//
// Any other create or edit form is a Dialog, never a Sheet. An `AlertDialog` may open over the
// Dialog or Sheet that owns the decision; an independent record workflow navigates or replaces the
// current frame instead of stacking. Dirty and pending protection survive a change of surface.

import { useConfirmation } from "@/components/app/confirmation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  DatePicker,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorSummary,
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
  Grid,
  Stack,
  Text,
  toast,
} from "@ledger/design-system";
import {
  ChoiceField,
  ComboboxField,
  ContextValue,
  PartyField,
  TextField,
} from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import { useRow, useRows } from "@/lib/models";
import { taskPriorities } from "@/lib/status";
import {
  createTaskSchema,
  useCreateTask,
  type CreateTaskInput,
  type CreateTaskResult,
} from "@/lib/task-create";

/** The form's fields in the order they appear, which is the order their issues are listed in. */
const taskFields = [
  "title",
  "program",
  "workstream",
  "description",
  "assignee",
  "due",
  "priority",
] as const;
type TaskField = (typeof taskFields)[number];
const fieldFor: Record<keyof CreateTaskInput, TaskField> = {
  title: "title",
  programId: "program",
  workstreamId: "workstream",
  description: "description",
  assigneePartyId: "assignee",
  dueOn: "due",
  priority: "priority",
};

/** Every issue with the values, one per field, in field order, and the parsed values when none. */
function validate(
  values: Record<keyof CreateTaskInput, unknown>,
  extra: readonly FormIssue<TaskField>[],
) {
  const parsed = createTaskSchema.safeParse(values);
  const found = new Map<TaskField, string>();
  for (const issue of extra) if (!found.has(issue.field)) found.set(issue.field, issue.message);
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      const field = fieldFor[issue.path[0] as keyof CreateTaskInput];
      if (field && !found.has(field)) found.set(field, issue.message);
    }
  const issues = taskFields.flatMap((field) => {
    const message = found.get(field);
    return message ? [{ field, message }] : [];
  });
  return { issues, data: parsed.success && !issues.length ? parsed.data : null };
}

/**
 * The reference create form. The ask and its responsible assignee are saved together, using real
 * workspace records: the kit Field binding with a FieldError per field, an ErrorSummary when
 * several fail, the Dialog's pending lock and the shared draft guard, and a form-level Alert for
 * a result that is not about one field.
 */
export function CreateTaskDialog({
  programId,
  workstreamId,
  onClose,
  onCreated,
  finalFocus,
}: {
  programId?: string | undefined;
  workstreamId?: string | undefined;
  /** Called once the dialog has finished closing, after `onCreated` when the task was created. */
  onClose: () => void;
  /**
   * Where focus goes when the dialog closes, for an opener that goes away with the task. By
   * default it returns to the element that opened the dialog, which stays enabled while it is open.
   */
  finalFocus?: DialogContentProps["finalFocus"];
  onCreated?: ((result: CreateTaskResult) => void | Promise<void>) | undefined;
}) {
  const workspace = useWorkspace();
  const formId = useId();
  const [requestId] = useState(() => crypto.randomUUID());
  const [open, setOpen] = useState(true);
  const [chosenProgram, setChosenProgram] = useState<string | null>(programId ?? null);
  const [chosenWorkstream, setChosenWorkstream] = useState<string | null>(workstreamId ?? null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);
  // The day the task is due, as the DatePicker reports it: an ISO day, "" for none.
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<CreateTaskInput["priority"]>(null);
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null);
  const [early, setEarly] = useState(false);
  const created = useRef<CreateTaskResult | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const feedback = useFormFeedback<TaskField>();
  const { confirm, confirmation } = useConfirmation();
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The task details you entered will be lost.",
  });
  const contextWorkstream = useRow("workstreams", workstreamId);
  const effectiveProgramId = programId ?? contextWorkstream.data?.program_id ?? chosenProgram;
  const effectiveWorkstreamId = workstreamId ?? chosenWorkstream;
  const programs = useRows("programs");
  const workstreams = useRows(
    "workstreams",
    { program_id: effectiveProgramId ?? "" },
    { enabled: !!effectiveProgramId },
  );
  const parties = useRows("parties");
  const create = useCreateTask();
  const queries = [
    programs,
    parties,
    ...(effectiveProgramId ? [workstreams] : []),
    ...(workstreamId ? [contextWorkstream] : []),
  ];
  const loadError = queries.find((query) => query.error)?.error;
  const ready = queries.every((query) => query.data !== undefined);
  const contextProgram = programs.data?.find((program) => program.id === effectiveProgramId);
  const validWorkstream =
    !effectiveWorkstreamId ||
    !workstreams.data ||
    workstreams.data.some(
      (workstream) =>
        workstream.id === effectiveWorkstreamId && workstream.program_id === effectiveProgramId,
    );
  const invalidContext =
    (programId && ready && !contextProgram) ||
    (workstreamId &&
      ready &&
      (!contextWorkstream.data || contextWorkstream.data.program_id !== effectiveProgramId));
  const writable = workspace.role !== "viewer";
  // The status map's priorities, in its order from low to urgent.
  const priorities = Object.entries(taskPriorities)
    .sort(([, a], [, b]) => a.rank - b.rank)
    .map(([value, { label }]) => ({ value, label }));
  const values = {
    // An empty program reads as "Choose a program.", the schema's message for a missing id.
    programId: effectiveProgramId ?? "",
    workstreamId: effectiveWorkstreamId,
    title,
    description,
    assigneePartyId: assignee,
    dueOn: due || null,
    priority,
  };
  const extra: FormIssue<TaskField>[] = validWorkstream
    ? []
    : [{ field: "workstream", message: "Choose a workstream in this program." }];
  const check = validate(values, extra);
  // Validate on submit, then on change: each field's error follows the value once submitted.
  const errors = new Map(
    feedback.submitted ? check.issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const unavailable = !writable
    ? "An editor, admin, or owner can create a task."
    : invalidContext
      ? "Reload the record to create a task in it."
      : loadError
        ? "Load the workspace records before creating the task."
        : undefined;

  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);

  function changed() {
    setDirty(true);
  }
  async function chooseProgram(value: string | null) {
    if (value === chosenProgram) return;
    if (
      chosenWorkstream &&
      !(await confirm({
        title: "Change program?",
        confirmLabel: "Change program",
        variant: "primary",
        description:
          "Changing the program clears the workstream selection. The task details and assignee will be kept.",
      }))
    )
      return;
    setChosenProgram(value);
    setChosenWorkstream(null);
    changed();
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || unavailable) return;
    setFailure(null);
    if (!ready) {
      setEarly(true);
      return;
    }
    const attempt = check;
    if (!feedback.report(attempt.issues) || !attempt.data) return;
    // The fields lock while the save runs; the primary stays focusable while it loads.
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      created.current = await create.mutateAsync({ requestId, values: attempt.data });
      setDirty(false);
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure({
        title: "The task was not created",
        message: `${causeText(cause)} Your details are kept, and creating it again will not make a duplicate.`,
      });
      guard.finish();
    }
  }
  async function closed() {
    const result = created.current;
    try {
      if (result) await onCreated?.(result);
    } catch (cause) {
      toast.add({
        type: "error",
        title: "Task created",
        description: `The next view could not be opened. ${causeText(cause, "")}`.trim(),
      });
    } finally {
      onClose();
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
        if (!next) void closed();
      }}
    >
      <DialogContent
        width="large"
        initialFocus={() => feedback.node("title") ?? true}
        {...(finalFocus !== undefined ? { finalFocus } : {})}
      >
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>
            Describe the work and optionally assign the person or organization responsible.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {loadError ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The choices could not be loaded</AlertTitle>
                  <AlertDescription>{causeText(loadError)}</AlertDescription>
                  <AlertAction>
                    <Button
                      size="small"
                      onClick={() =>
                        void Promise.all(
                          queries.filter((query) => query.error).map((query) => query.refetch()),
                        )
                      }
                    >
                      Retry loading choices
                    </Button>
                  </AlertAction>
                </Alert>
              ) : !ready ? (
                // One status region, so a submission while loading is announced as a change.
                <Text as="p" role="status" color="color.text.subtle">
                  {early
                    ? "The workspace records are still loading. Create the task once the choices appear."
                    : "Loading workspace records…"}
                </Text>
              ) : null}
              {invalidContext ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>This program or workstream is unavailable</AlertTitle>
                  <AlertDescription>Close this dialog and reload the record.</AlertDescription>
                </Alert>
              ) : null}
              {!writable ? (
                <Alert role="note">
                  <AlertDescription>An editor, admin, or owner can create a task.</AlertDescription>
                </Alert>
              ) : null}
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>{failure.title}</AlertTitle>
                  <AlertDescription>{failure.message}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy || !writable}>
                <Stack space="space.200">
                  <TextField
                    label="Task title"
                    value={title}
                    onChange={(value) => {
                      setTitle(value);
                      changed();
                    }}
                    required
                    placeholder="What needs doing"
                    error={errors.get("title")}
                    controlRef={feedback.ref("title")}
                  />
                  <Grid
                    gap="space.200"
                    templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
                  >
                    {programId || workstreamId ? (
                      <ContextValue
                        label="Program"
                        value={contextProgram?.name}
                        query={programs}
                        noun="program"
                      />
                    ) : (
                      <ComboboxField
                        label="Program"
                        value={chosenProgram}
                        options={(programs.data ?? []).map((program) => ({
                          value: program.id,
                          label: `${program.code} · ${program.name}`,
                        }))}
                        onChange={(value) => void chooseProgram(value)}
                        required
                        noun="programs"
                        loading={programs.isPending && !programs.isError}
                        loadError={programs.isError}
                        onRetry={() => void programs.refetch()}
                        placeholder="Choose a program"
                        error={errors.get("program")}
                        controlRef={feedback.ref("program")}
                      />
                    )}
                    {workstreamId ? (
                      <ContextValue
                        label="Workstream"
                        value={contextWorkstream.data?.title}
                        query={contextWorkstream}
                        noun="workstream"
                      />
                    ) : (
                      <ComboboxField
                        label="Workstream"
                        value={chosenWorkstream}
                        options={(workstreams.data ?? []).map((workstream) => ({
                          value: workstream.id,
                          label: workstream.title,
                        }))}
                        onChange={(value) => {
                          setChosenWorkstream(value);
                          changed();
                        }}
                        readOnly={!effectiveProgramId}
                        noun="workstreams"
                        loading={
                          !!effectiveProgramId && workstreams.isPending && !workstreams.isError
                        }
                        loadError={workstreams.isError}
                        onRetry={() => void workstreams.refetch()}
                        placeholder="Choose a workstream"
                        description={!effectiveProgramId ? "Choose a program first." : undefined}
                        error={errors.get("workstream")}
                        controlRef={feedback.ref("workstream")}
                      />
                    )}
                  </Grid>
                  <TextField
                    label="Description"
                    value={description}
                    onChange={(value) => {
                      setDescription(value);
                      changed();
                    }}
                    multiline
                    autoResize
                    error={errors.get("description")}
                    controlRef={feedback.ref("description")}
                  />
                  <PartyField
                    label="Responsible assignee"
                    value={assignee}
                    parties={parties.data ?? []}
                    onChange={(value) => {
                      setAssignee(value);
                      changed();
                    }}
                    loading={parties.isPending && !parties.isError}
                    loadError={parties.isError}
                    onRetry={() => void parties.refetch()}
                    description="Leave unassigned or choose a real party from this workspace."
                    error={errors.get("assignee")}
                    controlRef={feedback.ref("assignee")}
                  />
                  <Grid
                    gap="space.200"
                    templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
                  >
                    {/* A task is due on a day, which reads the same day in every zone. */}
                    <Field invalid={errors.has("due") ? true : undefined}>
                      <FieldLabel>Due date</FieldLabel>
                      <DatePicker
                        ref={feedback.ref("due")}
                        value={due}
                        onValueChange={(value) => {
                          setDue(value);
                          changed();
                        }}
                      />
                      {errors.has("due") ? <FieldError>{errors.get("due")}</FieldError> : null}
                    </Field>
                    <ChoiceField
                      label="Priority"
                      value={priority}
                      options={priorities}
                      onChange={(value) => {
                        setPriority(value as CreateTaskInput["priority"]);
                        changed();
                      }}
                      placeholder="No priority"
                      emptyOption="No priority"
                      error={errors.get("priority")}
                      controlRef={feedback.ref("priority")}
                    />
                  </Grid>
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
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
      {confirmation}
    </Dialog>
  );
}
