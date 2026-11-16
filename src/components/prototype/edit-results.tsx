// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// Its overflow menu, in either preview, holds Edit assessment results (`ResultsMoreActions` in
// edit-results): a Dialog of the same name with Title and Description over the values and the
// revision the reader opened it at, which saves them at the next revision (`editAssessmentResults`
// in assessment-results); a dirty Cancel asks first, a pending save holds the Dialog, and results
// changed since they were opened, published or gone are refused inside it, the draft kept, in words
// that say why. Published results no longer change: the item keeps its place and says so, and
// published results opened afresh offer nothing.

import { useId, useRef, useState, type FormEvent } from "react";
import { AlertCircle, MoreHorizontal } from "lucide-react";
import {
  Alert,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ErrorSummary,
  FieldSet,
  IconButton,
  Stack,
  toast,
} from "@ledger/design-system";
import { TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  RESULTS_EDIT_MISSING,
  RESULTS_EDIT_PUBLISHED,
  useEditAssessmentResults,
  type ResultsEdit,
} from "@/lib/assessment-results";
import { useRow } from "@/lib/models";
import { currentOpener } from "./opener";

/*
 * Edit assessment results: a draft results revision's title and description, from the overflow
 * menu of its preview's record header, beside the one primary, Publish assessment results (the
 * campaign's Assessment results and the Review queue). Its findings are recorded elsewhere, and
 * published results no longer change. The draft is saved at the revision the reader opened it at.
 */

/**
 * The overflow menu of a draft results preview's record header: Edit assessment results. The
 * results revision is read as the preview opens (the read Publish assessment results makes), for
 * the values and the revision the form starts from. The item keeps its place and says why while
 * that read loads, when it fails, and once the results are published, here or in another session.
 * Render it only for a reader who may write; key it by the results, so another record's preview
 * starts again.
 */
export function ResultsMoreActions({ resultsId }: { resultsId: string }) {
  const results = useRow("assessment_results_revisions", resultsId);
  const [editing, setEditing] = useState<ResultsEdit | null>(null);
  const row = results.data;
  const waits =
    row?.state === "published"
      ? RESULTS_EDIT_PUBLISHED
      : row === null
        ? RESULTS_EDIT_MISSING
        : results.isError
          ? "The assessment results could not be read."
          : !row
            ? "Reading the assessment results…"
            : undefined;
  return (
    <>
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
          <DropdownMenuItem
            onClick={() => {
              if (!row || waits) return;
              setEditing({
                id: row.id,
                revision: row.revision,
                title: row.title,
                description: row.description,
              });
            }}
            {...(waits ? { disabledReason: waits } : {})}
          >
            Edit assessment results
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editing && <EditResultsDialog results={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

type ResultsField = "title" | "description";

/**
 * Edit assessment results, a Dialog with Title and Description over the values and the revision
 * the reader opened it at. A dirty close and a route change ask first, and a pending save holds the
 * Dialog. The save is refused, in words that say why and with the draft kept, when the results
 * changed since they were opened, were published or are gone; one sent again after an answer that
 * was lost finds the results already so and changes nothing. Focus returns to the control that
 * opened it, the overflow menu's trigger.
 */
export function EditResultsDialog({
  results,
  onClose,
}: {
  results: ResultsEdit;
  /** Called once the Dialog has finished closing, saved or not. */
  onClose: () => void;
}) {
  const formId = useId();
  const [open, setOpen] = useState(true);
  const [opener] = useState(currentOpener);
  const [title, setTitle] = useState(results.title);
  const [description, setDescription] = useState(results.description ?? "");
  const [failure, setFailure] = useState<string | null>(null);
  // The title the results were saved under, for the toast once the Dialog has closed.
  const saved = useRef<string | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const feedback = useFormFeedback<ResultsField>();
  const edit = useEditAssessmentResults();
  const dirty = title !== results.title || description !== (results.description ?? "");
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The changes you made to these assessment results will be lost.",
  });
  const issues: FormIssue<ResultsField>[] = title.trim()
    ? []
    : [{ field: "title", message: "Enter a title." }];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy) return;
    setFailure(null);
    if (!feedback.report(issues)) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      await edit.mutateAsync({ ...results, title, description });
      saved.current = title.trim();
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(`${causeText(cause)} Your changes are kept.`);
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
          toast.add({
            type: "success",
            title: "Assessment results saved",
            description: saved.current,
          });
        onClose();
      }}
    >
      <DialogContent
        width="medium"
        initialFocus={() => feedback.node("title") ?? true}
        finalFocus={() => (opener?.isConnected ? opener : true)}
      >
        <DialogHeader>
          <DialogTitle>Edit assessment results</DialogTitle>
          <DialogDescription>{results.title}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The assessment results were not saved</AlertTitle>
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
                    error={errors.get("title")}
                    controlRef={feedback.ref("title")}
                  />
                  <TextField
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    multiline
                    autoResize
                    rows={4}
                    controlRef={feedback.ref("description")}
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
          >
            Edit assessment results
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
