import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
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
  Stack,
  toast,
} from "@ledger/design-system";
import { ChoiceField, PartyField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import { useCollection, useColumnChoices } from "@/lib/collections";
import { useRow, useRows } from "@/lib/models";
import { requireIdentity } from "@/lib/database";
import { SaveOnceConflict, useSaveOnce } from "@/lib/save-once";
import { labelFor } from "@/lib/records";

type Fields = {
  title: string;
  statement: string;
  acceptanceCriteria: string;
  rationale: string;
  requirementType: string;
  ownerPartyId: string | null;
};
/** The form's fields in the order they appear, which is the order their issues are listed in. */
const detailFields = [
  "title",
  "requirementType",
  "ownerPartyId",
  "statement",
  "acceptanceCriteria",
  "rationale",
] as const;
type DetailField = (typeof detailFields)[number];
/** The longest title the form takes: a count shows near it, and a longer one is a field error, never cut. */
const TITLE_LIMIT = 1000;
const titleTooLong = `Use at most ${TITLE_LIMIT} characters for the title.`;

/** Adds authored content to an existing requirement identity without exposing storage lifecycle fields. */
export function AddRequirementDetailsDialog({
  programId,
  requirementId,
  onClose,
  onSaved,
}: {
  programId: string;
  requirementId: string;
  /** Called once the dialog has finished closing, after `onSaved` when the revision was created. */
  onClose: () => void;
  onSaved: () => void;
}) {
  const workspace = useWorkspace();
  const requirement = useRow("engineering_requirements", requirementId);
  const parties = useRows("parties");
  const save = useSaveOnce("requirement_revisions");
  const formId = useId();
  const feedback = useFormFeedback<DetailField>();
  const [open, setOpen] = useState(true);
  const [contentId] = useState(() => crypto.randomUUID());
  const [fields, setFields] = useState<Fields>({
    title: "",
    statement: "",
    acceptanceCriteria: "",
    rationale: "",
    requirementType: "",
    ownerPartyId: null,
  });
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const saved = useRef(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The requirement details you entered will be lost.",
  });
  const schema = useCollection("requirement_revisions");
  const types = useColumnChoices("requirement_revisions", "requirement_type").data ?? [];
  const roster = (parties.data ?? []).filter((party) => party.tenant_id === workspace.tenantId);
  const canWrite =
    workspace.role !== "viewer" &&
    !!schema.data?.can_insert &&
    requirement.data?.program_id === programId;
  const unavailable = canWrite
    ? undefined
    : workspace.role === "viewer"
      ? "An editor, admin, or owner can create a requirement revision."
      : requirement.isPending || schema.isPending
        ? "The requirement is still loading."
        : "Reload the requirement to add its details.";
  const change = <K extends keyof Fields>(field: K, value: Fields[K]) => {
    setFields((previous) => ({ ...previous, [field]: value }));
    setDirty(true);
  };
  const issues: FormIssue<DetailField>[] = [
    ...(!fields.title.trim()
      ? [{ field: "title" as const, message: "Enter a title." }]
      : fields.title.trim().length > TITLE_LIMIT
        ? [{ field: "title" as const, message: titleTooLong }]
        : []),
    ...(!types.includes(fields.requirementType)
      ? [{ field: "requirementType" as const, message: "Choose a requirement type." }]
      : []),
    ...(fields.ownerPartyId && !roster.some((party) => party.id === fields.ownerPartyId)
      ? [{ field: "ownerPartyId" as const, message: "Choose an owner from this workspace." }]
      : []),
    ...(!fields.statement.trim()
      ? [{ field: "statement" as const, message: "Enter the requirement statement." }]
      : []),
    ...(!fields.acceptanceCriteria.trim()
      ? [{ field: "acceptanceCriteria" as const, message: "Enter the acceptance criteria." }]
      : []),
  ];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || !canWrite) return;
    setFailure(null);
    if (!feedback.report(issues)) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    const authored = {
      engineering_requirement_id: requirementId,
      title: fields.title.trim(),
      statement: fields.statement.trim(),
      acceptance_criteria: fields.acceptanceCriteria.trim(),
      rationale: fields.rationale.trim() || null,
      requirement_type: fields.requirementType,
      owner_party_id: fields.ownerPartyId,
    };
    try {
      // A stable row ID makes retrying an uncertain response safe without creating a second record.
      try {
        await save.mutateAsync({
          id: contentId,
          values: authored,
          create: { version_number: 1, state: "draft" },
        });
      } catch (cause) {
        if (cause instanceof SaveOnceConflict && cause.reason === "different")
          throw new Error(
            "These requirement details were already saved with different values. Your current draft has been retained.",
          );
        throw cause;
      }
      await requireIdentity(workspace);
      saved.current = true;
      setDirty(false);
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${cause instanceof Error ? cause.message : "The requirement details could not be saved."} Your details are kept, and creating it again will not make a duplicate.`,
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
        if (saved.current) {
          onSaved();
          toast.add({
            type: "success",
            title: "Requirement revision created",
            description: `${requirement.data?.code ?? "The requirement"} · ${fields.title.trim()}`,
          });
        }
        onClose();
      }}
    >
      <DialogContent width="large" initialFocus={() => feedback.node("title") ?? true}>
        <DialogHeader>
          <DialogTitle>Create requirement revision</DialogTitle>
          <DialogDescription>{requirement.data?.code}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {unavailable && !requirement.isPending ? (
                <Alert role="note">
                  <AlertDescription>{unavailable}</AlertDescription>
                </Alert>
              ) : null}
              {parties.error ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The owners could not be loaded</AlertTitle>
                  <AlertDescription>{parties.error.message}</AlertDescription>
                  <AlertAction>
                    <Button size="small" onClick={() => void parties.refetch()}>
                      Retry loading owners
                    </Button>
                  </AlertAction>
                </Alert>
              ) : null}
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The requirement revision was not created</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy || !canWrite}>
                <Stack space="space.200">
                  <TextField
                    label="Title"
                    value={fields.title}
                    onChange={(value) => change("title", value)}
                    required
                    characterLimit={TITLE_LIMIT}
                    error={errors.get("title")}
                    controlRef={feedback.ref("title")}
                  />
                  <ChoiceField
                    label="Requirement type"
                    value={fields.requirementType || null}
                    options={types.map((type) => ({ value: type, label: labelFor(type) }))}
                    onChange={(value) => change("requirementType", value ?? "")}
                    required
                    placeholder="Choose requirement type"
                    error={errors.get("requirementType")}
                    controlRef={feedback.ref("requirementType")}
                  />
                  <PartyField
                    label="Owner"
                    value={fields.ownerPartyId}
                    parties={roster}
                    onChange={(value) => change("ownerPartyId", value)}
                    loading={parties.isPending && !parties.isError}
                    loadError={parties.isError}
                    onRetry={() => void parties.refetch()}
                    placeholder="Choose owner"
                    error={errors.get("ownerPartyId")}
                    controlRef={feedback.ref("ownerPartyId")}
                  />
                  <TextField
                    label="Statement"
                    value={fields.statement}
                    onChange={(value) => change("statement", value)}
                    multiline
                    rows={4}
                    required
                    error={errors.get("statement")}
                    controlRef={feedback.ref("statement")}
                  />
                  <TextField
                    label="Acceptance criteria"
                    value={fields.acceptanceCriteria}
                    onChange={(value) => change("acceptanceCriteria", value)}
                    multiline
                    rows={4}
                    required
                    error={errors.get("acceptanceCriteria")}
                    controlRef={feedback.ref("acceptanceCriteria")}
                  />
                  <TextField
                    label="Rationale"
                    value={fields.rationale}
                    onChange={(value) => change("rationale", value)}
                    multiline
                    rows={4}
                    controlRef={feedback.ref("rationale")}
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
            Create requirement revision
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
