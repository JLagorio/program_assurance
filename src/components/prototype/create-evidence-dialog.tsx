import { productCreateLabel } from "@/lib/product-records";
import { useConfirmation } from "@/components/app/confirmation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  DateTimeField,
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
  FieldDescription,
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
import { useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import {
  createEvidenceSchema,
  useCreateEvidence,
  type CreateEvidenceInput,
  type CreateEvidenceResult,
} from "@/lib/evidence-create";

/** The form's fields in the order they appear, which is the order their issues are listed in. */
const evidenceFields = [
  "title",
  "kind",
  "owner",
  "program",
  "scope",
  "description",
  "externalUri",
  "collected",
  "provenance",
] as const;
type EvidenceField = (typeof evidenceFields)[number];
const fieldFor: Record<keyof CreateEvidenceInput, EvidenceField> = {
  title: "title",
  artifactKind: "kind",
  ownerPartyId: "owner",
  programId: "program",
  scopeId: "scope",
  description: "description",
  externalUri: "externalUri",
  collectedAt: "collected",
  provenance: "provenance",
};

/** Every issue with the values, one per field, in field order, and the parsed values when none. */
function validate(
  values: Record<keyof CreateEvidenceInput, unknown>,
  extra: readonly FormIssue<EvidenceField>[],
) {
  const parsed = createEvidenceSchema.safeParse(values);
  const found = new Map<EvidenceField, string>();
  for (const issue of extra) if (!found.has(issue.field)) found.set(issue.field, issue.message);
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      const field = fieldFor[issue.path[0] as keyof CreateEvidenceInput];
      if (field && !found.has(field)) found.set(field, issue.message);
    }
  const issues = evidenceFields.flatMap((field) => {
    const message = found.get(field);
    return message ? [{ field, message }] : [];
  });
  return { issues, data: parsed.success && !issues.length ? parsed.data : null };
}

/** The artifact and its first draft version, created together; a file is uploaded after saving. */
export function CreateEvidenceDialog({
  programId,
  onClose,
  onCreated,
  finalFocus,
}: {
  programId?: string | undefined;
  /** Called once the dialog has finished closing, after `onCreated` when the evidence was created. */
  onClose: () => void;
  /**
   * Where focus goes when the dialog closes, for an opener that goes away with the task. By
   * default it returns to the element that opened the dialog, which stays enabled while it is open.
   */
  finalFocus?: DialogContentProps["finalFocus"];
  onCreated?: ((result: CreateEvidenceResult) => void | Promise<void>) | undefined;
}) {
  const workspace = useWorkspace();
  const formId = useId();
  const [requestId] = useState(() => crypto.randomUUID());
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CreateEvidenceInput["artifactKind"] | null>(null);
  const [chosenProgram, setChosenProgram] = useState<string | null>(programId ?? null);
  const [scope, setScope] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [externalUri, setExternalUri] = useState("");
  const [collected, setCollected] = useState("");
  const [collectedEntryError, setCollectedEntryError] = useState<string | null>(null);
  const [provenance, setProvenance] = useState("");
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null);
  const [early, setEarly] = useState(false);
  const created = useRef<CreateEvidenceResult | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const feedback = useFormFeedback<EvidenceField>();
  const { confirm, confirmation } = useConfirmation();
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The evidence details you entered will be lost.",
  });
  const effectiveProgramId = programId ?? chosenProgram;
  const programs = useRows("programs");
  const parties = useRows("parties");
  const systems = useRows("systems", effectiveProgramId ? { program_id: effectiveProgramId } : {}, {
    enabled: !!effectiveProgramId,
  });
  const scopes = useRows("scopes", {}, { enabled: !!effectiveProgramId });
  const create = useCreateEvidence();
  const queries = [programs, parties, ...(effectiveProgramId ? [systems, scopes] : [])];
  const loadError = queries.find((query) => query.error)?.error;
  const ready = queries.every((query) => query.data !== undefined);
  const contextProgram = programs.data?.find((program) => program.id === effectiveProgramId);
  const availableScopes = (scopes.data ?? []).filter((row) =>
    systems.data?.some(
      (system) => system.id === row.system_id && system.program_id === effectiveProgramId,
    ),
  );
  const invalidContext = !!effectiveProgramId && ready && !contextProgram;
  const validScope = !scope || !scopes.data || availableScopes.some((row) => row.id === scope);
  const writable = workspace.role !== "viewer";
  const kinds =
    workspace.collections
      .find((collection) => collection.name === "evidence_artifacts")
      ?.columns.find((column) => column.name === "artifact_kind")?.choices ?? [];
  const values = {
    title,
    artifactKind: kind,
    programId: effectiveProgramId,
    scopeId: scope,
    ownerPartyId: owner,
    description,
    externalUri,
    collectedAt: collected || null,
    provenance,
  };
  const extra: FormIssue<EvidenceField>[] = validScope
    ? []
    : [{ field: "scope", message: "Choose a scope in this program." }];
  const check = validate(
    values,
    collectedEntryError ? [{ field: "collected", message: collectedEntryError }, ...extra] : extra,
  );
  // Validate on submit, then on change: each field's error follows the value once submitted.
  const errors = new Map(
    feedback.submitted ? check.issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const createLabel = productCreateLabel("evidence_artifacts");
  const unavailable = !writable
    ? "An editor, admin, or owner can create evidence."
    : invalidContext
      ? "Reload the record to create evidence in its program."
      : loadError
        ? "Load the workspace records before creating the evidence."
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
      scope &&
      !(await confirm({
        title: "Change program?",
        confirmLabel: "Change program",
        variant: "primary",
        description:
          "Changing the program clears the scope selection. The other evidence details will be kept.",
      }))
    )
      return;
    setChosenProgram(value);
    setScope(null);
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
    // The collected field holds Enter on a half-typed moment and reports it as its entry error, as
    // it does when focus leaves it, so `check` already counts it.
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
        title: "The evidence was not created",
        message: `${causeText(cause)} Your details are kept, and creating it again will not make duplicate evidence.`,
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
        title: "Evidence created",
        description: `Its preview could not be opened. ${causeText(cause, "")}`.trim(),
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
          <DialogTitle>{createLabel}</DialogTitle>
          <DialogDescription>
            Describe the artifact and its first draft version. You can upload a file after saving.
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
                    ? "The workspace records are still loading. Create the evidence once the choices appear."
                    : "Loading workspace records…"}
                </Text>
              ) : null}
              {invalidContext ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>This program is unavailable</AlertTitle>
                  <AlertDescription>Close this dialog and reload the record.</AlertDescription>
                </Alert>
              ) : null}
              {!writable ? (
                <Alert role="note">
                  <AlertDescription>
                    An editor, admin, or owner can create evidence.
                  </AlertDescription>
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
                    label="Artifact title"
                    value={title}
                    onChange={(value) => {
                      setTitle(value);
                      changed();
                    }}
                    required
                    error={errors.get("title")}
                    controlRef={feedback.ref("title")}
                  />
                  <Grid
                    gap="space.200"
                    templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
                  >
                    <ChoiceField
                      label="Kind"
                      required
                      value={kind}
                      options={kinds.map((value) => ({ value, label: labelFor(value) }))}
                      onChange={(value) => {
                        setKind(value as CreateEvidenceInput["artifactKind"] | null);
                        changed();
                      }}
                      placeholder="Choose a kind"
                      error={errors.get("kind")}
                      controlRef={feedback.ref("kind")}
                    />
                    <PartyField
                      label="Owner"
                      value={owner}
                      parties={parties.data ?? []}
                      loading={parties.isPending && !parties.isError}
                      loadError={parties.isError}
                      onRetry={() => void parties.refetch()}
                      onChange={(value) => {
                        setOwner(value);
                        changed();
                      }}
                      error={errors.get("owner")}
                      controlRef={feedback.ref("owner")}
                    />
                    {programId ? (
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
                        noun="programs"
                        loading={programs.isPending && !programs.isError}
                        loadError={programs.isError}
                        onRetry={() => void programs.refetch()}
                        onChange={(value) => void chooseProgram(value)}
                        placeholder="Choose a program"
                        error={errors.get("program")}
                        controlRef={feedback.ref("program")}
                      />
                    )}
                    <ComboboxField
                      label="Scope"
                      value={scope}
                      options={availableScopes.map((row) => ({
                        value: row.id,
                        label: `${row.code} · ${row.name}`,
                      }))}
                      disabled={!effectiveProgramId}
                      noun="scopes"
                      loading={
                        !!effectiveProgramId &&
                        ((scopes.isPending && !scopes.isError) ||
                          (systems.isPending && !systems.isError))
                      }
                      loadError={scopes.isError || systems.isError}
                      onRetry={() =>
                        void Promise.all([
                          scopes.isError ? scopes.refetch() : null,
                          systems.isError ? systems.refetch() : null,
                        ])
                      }
                      placeholder="Choose a scope"
                      description={
                        !effectiveProgramId
                          ? "Choose a program to select one of its scopes."
                          : undefined
                      }
                      onChange={(value) => {
                        setScope(value);
                        changed();
                      }}
                      error={errors.get("scope")}
                      controlRef={feedback.ref("scope")}
                    />
                  </Grid>
                  <TextField
                    label="Description"
                    value={description}
                    multiline
                    autoResize
                    onChange={(value) => {
                      setDescription(value);
                      changed();
                    }}
                    error={errors.get("description")}
                    controlRef={feedback.ref("description")}
                  />
                  <TextField
                    label="External reference"
                    value={externalUri}
                    maxLength={4000}
                    onChange={(value) => {
                      setExternalUri(value);
                      changed();
                    }}
                    description="An HTTP, HTTPS, or URN reference, if the artifact already exists elsewhere."
                    error={errors.get("externalUri")}
                    controlRef={feedback.ref("externalUri")}
                  />
                  <Field invalid={errors.has("collected") ? true : undefined}>
                    <FieldLabel>Collected date and time</FieldLabel>
                    <DateTimeField
                      ref={feedback.ref("collected")}
                      value={collected}
                      onValueChange={(value) => {
                        setCollected(value);
                        changed();
                      }}
                      onEntryError={setCollectedEntryError}
                    />
                    <FieldDescription>When the evidence was gathered, if known.</FieldDescription>
                    {/* The field shows its own entry error; only the schema's message is added. */}
                    {errors.has("collected") && errors.get("collected") !== collectedEntryError ? (
                      <FieldError>{errors.get("collected")}</FieldError>
                    ) : null}
                  </Field>
                  <TextField
                    label="Provenance"
                    value={provenance}
                    multiline
                    autoResize
                    onChange={(value) => {
                      setProvenance(value);
                      changed();
                    }}
                    description="Record how this evidence was obtained, if known."
                    error={errors.get("provenance")}
                    controlRef={feedback.ref("provenance")}
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
            {createLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
      {confirmation}
    </Dialog>
  );
}
