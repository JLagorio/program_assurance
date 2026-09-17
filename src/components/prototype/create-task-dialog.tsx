import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useId, useRef, useState, type FormEvent } from "react";
import { useBlocker } from "@tanstack/react-router";
import {
  Box,
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Grid,
  Input,
  KeyValue,
  Stack,
  Textarea,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useRow, useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import {
  createTaskSchema,
  useCreateTask,
  type CreateTaskInput,
  type CreateTaskResult,
} from "@/lib/task-create";

type Option = { value: string; label: string };
function TaskChoice({
  label,
  value,
  options,
  onChange,
  required = false,
  disabled = false,
  description,
}: {
  label: string;
  value: string | null;
  options: Option[];
  onChange: (value: string | null) => void;
  required?: boolean;
  disabled?: boolean;
  description?: string | undefined;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        ) : null}
      </FieldLabel>
      <Combobox<Option>
        items={options}
        value={options.find((option) => option.value === value) ?? null}
        isItemEqualToValue={(item, selected) => item.value === selected.value}
        filter={(item, search) =>
          item.label.toLocaleLowerCase().includes(search.toLocaleLowerCase())
        }
        onValueChange={(item) => onChange(item?.value ?? null)}
        disabled={disabled}
      >
        <ComboboxInput
          id={id}
          aria-labelledby={`${id}-label`}
          aria-required={required}
          aria-describedby={description ? `${id}-help` : undefined}
          placeholder={required ? "Choose…" : "Choose (optional)…"}
          showClear={!required}
        />
        <ComboboxContent>
          <ComboboxEmpty>No matching records.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription id={`${id}-help`}>{description}</FieldDescription> : null}
    </Field>
  );
}

/** The ask and its responsible assignee are saved together, using real workspace records. */
export function CreateTaskDialog({
  programId,
  workstreamId,
  onClose,
  onCreated,
}: {
  programId?: string | undefined;
  workstreamId?: string | undefined;
  onClose: () => void;
  onCreated?: ((result: CreateTaskResult) => void | Promise<void>) | undefined;
}) {
  const { confirm, confirmation } = useConfirmation();
  const workspace = useWorkspace();
  const id = useId();
  const [requestId] = useState(() => crypto.randomUUID());
  const [chosenProgram, setChosenProgram] = useState(programId ?? "");
  const [chosenWorkstream, setChosenWorkstream] = useState<string | null>(workstreamId ?? null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<CreateTaskInput["priority"]>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<CreateTaskResult | null>(null);
  const inFlight = useRef(false);
  const bypassBlock = useRef(false);
  const contextWorkstream = useRow("workstreams", workstreamId);
  const effectiveProgramId = programId ?? contextWorkstream.data?.program_id ?? chosenProgram;
  const effectiveWorkstreamId = workstreamId ?? chosenWorkstream;
  const programs = useRows("programs");
  const workstreams = useRows(
    "workstreams",
    { program_id: effectiveProgramId },
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
    workstreams.data?.some(
      (workstream) =>
        workstream.id === effectiveWorkstreamId && workstream.program_id === effectiveProgramId,
    );
  const invalidContext =
    (programId && ready && !contextProgram) ||
    (workstreamId &&
      ready &&
      (!contextWorkstream.data || contextWorkstream.data.program_id !== effectiveProgramId));
  const writable = workspace.role !== "viewer";
  const priorities =
    workspace.collections
      .find((collection) => collection.name === "tasks")
      ?.columns.find((column) => column.name === "priority")?.choices ?? [];
  useBlocker({
    shouldBlockFn: async () =>
      !bypassBlock.current &&
      (inFlight.current ||
        (dirty && !(await confirm(discardChanges("Discard this unsaved task?"))))),
    enableBeforeUnload: () => !bypassBlock.current && (dirty || inFlight.current),
  });
  function changed() {
    setDirty(true);
    setError("");
  }
  async function close() {
    if (inFlight.current) return;
    if (!dirty || (await confirm(discardChanges("Discard this unsaved task?")))) {
      bypassBlock.current = true;
      onClose();
    }
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
    setChosenProgram(value ?? "");
    setChosenWorkstream(null);
    changed();
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || saved || !writable) return;
    if (!ready || loadError || invalidContext || !validWorkstream) {
      setError("Load and choose a valid program and workstream before creating the task.");
      return;
    }
    let dueAt: string | null = null;
    if (due) {
      const date = new Date(due);
      if (!Number.isFinite(date.getTime())) {
        setError("Enter a valid due date and time.");
        return;
      }
      dueAt = date.toISOString();
    }
    const parsed = createTaskSchema.safeParse({
      programId: effectiveProgramId,
      workstreamId: effectiveWorkstreamId,
      title,
      description,
      assigneePartyId: assignee,
      dueAt,
      priority,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Complete the task details.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    let committed = false;
    try {
      const result = await create.mutateAsync({ requestId, values: parsed.data });
      committed = true;
      setSaved(result);
      setDirty(false);
      bypassBlock.current = true;
      await onCreated?.(result);
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The task could not be created.";
      setError(
        committed
          ? `The task was created, but the next view could not be opened. ${message}`
          : message,
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          close();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 620 }} showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>
            Describe the work and optionally assign the person or organization responsible.
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto" padding="space.250">
          <form id={`${id}-form`} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {loadError ? (
                <Stack space="space.100">
                  <p role="alert" className="text-danger">
                    {loadError.message}
                  </p>
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
                </Stack>
              ) : null}
              {!ready ? (
                <p role="status" className="text-subtle">
                  Loading workspace records…
                </p>
              ) : null}
              {invalidContext ? (
                <p role="alert" className="text-danger">
                  The contextual program or workstream is unavailable. Close this dialog and reload
                  the record.
                </p>
              ) : null}
              {!writable ? (
                <p role="alert" className="text-subtle">
                  An editor, admin, or owner can create a task.
                </p>
              ) : null}
              {/* Native fieldset keeps every form control disabled through the confirmed write. */}
              <fieldset disabled={busy || !writable || !!saved} className="min-w-0 border-0 p-0">
                <Stack space="space.150">
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
                  >
                    {programId || workstreamId ? (
                      <KeyValue label="Program" wrap>
                        {contextProgram?.name ??
                          (programs.isPending ? "Loading…" : "Unavailable program")}
                      </KeyValue>
                    ) : (
                      <TaskChoice
                        label="Program"
                        value={chosenProgram || null}
                        options={(programs.data ?? []).map((program) => ({
                          value: program.id,
                          label: `${program.code} · ${program.name}`,
                        }))}
                        onChange={chooseProgram}
                        required
                        disabled={!programs.data}
                      />
                    )}
                    {workstreamId ? (
                      <KeyValue label="Workstream" wrap>
                        {contextWorkstream.data?.title ??
                          (contextWorkstream.isPending ? "Loading…" : "Unavailable workstream")}
                      </KeyValue>
                    ) : (
                      <TaskChoice
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
                        disabled={!effectiveProgramId || !workstreams.data}
                        description={!effectiveProgramId ? "Choose a program first." : undefined}
                      />
                    )}
                  </Grid>
                  <Field>
                    <FieldLabel htmlFor={`${id}-title`}>
                      Task title
                      <span aria-hidden="true" className="text-danger">
                        {" "}
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      id={`${id}-title`}
                      aria-required
                      value={title}
                      onChange={(event) => {
                        setTitle(event.target.value);
                        changed();
                      }}
                      maxLength={1000}
                      autoFocus
                      placeholder="What needs doing"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${id}-description`}>Description</FieldLabel>
                    <Textarea
                      id={`${id}-description`}
                      value={description}
                      onChange={(event) => {
                        setDescription(event.target.value);
                        changed();
                      }}
                      maxLength={10000}
                    />
                  </Field>
                  <TaskChoice
                    label="Responsible assignee"
                    value={assignee}
                    options={(parties.data ?? []).map((party) => ({
                      value: party.id,
                      label: party.name,
                    }))}
                    onChange={(value) => {
                      setAssignee(value);
                      changed();
                    }}
                    disabled={!parties.data}
                    description="Leave unassigned or choose a real party from this workspace."
                  />
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
                  >
                    <Field>
                      <FieldLabel htmlFor={`${id}-due`}>Due date and time</FieldLabel>
                      <Input
                        id={`${id}-due`}
                        type="datetime-local"
                        value={due}
                        onChange={(event) => {
                          setDue(event.target.value);
                          changed();
                        }}
                        aria-describedby={`${id}-due-help`}
                      />
                      <FieldDescription id={`${id}-due-help`}>
                        Uses your local timezone.
                      </FieldDescription>
                    </Field>
                    <TaskChoice
                      label="Priority"
                      value={priority}
                      options={priorities.map((value) => ({ value, label: labelFor(value) }))}
                      onChange={(value) => {
                        setPriority(value as CreateTaskInput["priority"]);
                        changed();
                      }}
                    />
                  </Grid>
                </Stack>
              </fieldset>
              {error ? (
                <Box role="alert" className="font-body-small text-danger">
                  <p>{error}</p>
                  {!saved ? (
                    <p className="pt-100">
                      Your task details are retained. Retrying the same request will not create a
                      duplicate.
                    </p>
                  ) : null}
                </Box>
              ) : null}
            </Stack>
          </form>
        </Box>
        <DialogFooter>
          <Button variant="subtle" disabled={busy} onClick={close}>
            {saved ? "Close" : "Cancel"}
          </Button>
          {!saved ? (
            <Button
              type="submit"
              form={`${id}-form`}
              variant="primary"
              isLoading={busy}
              disabled={busy || !writable || !ready || !!loadError || !!invalidContext}
            >
              Create task
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
      {confirmation}
    </Dialog>
  );
}
