import { useId, useRef, useState, type FormEvent, type RefObject } from "react";
import { AlertCircle } from "lucide-react";
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
  FieldSet,
  Stack,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { PartyField } from "@/components/app/fields";
import { useFormFeedback } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useRows } from "@/lib/models";
import { ownerAssignedText, useAssignOwner, type OwnedCollection } from "@/lib/owner-assign";

/**
 * Assign owner: one required Owner, a person or an organization, for the records chosen in a
 * register. It says how many are chosen and that the owner replaces any they have now, applies in
 * one request, and after a failure keeps the choice, since sending it again changes no record
 * twice. `useOwnerAssignment` in assign-owner opens it.
 */
export function AssignOwnerDialog({
  collection,
  noun,
  recordIds,
  finalFocus,
  onAssigned,
  onClose,
}: {
  collection: OwnedCollection;
  noun: { one: string; other: string };
  recordIds: readonly string[];
  finalFocus: RefObject<HTMLElement | null>;
  /** The owner is assigned: called before the Dialog closes. */
  onAssigned: () => void;
  /** Called once the Dialog has finished closing. */
  onClose: () => void;
}) {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const formId = useId();
  const [open, setOpen] = useState(true);
  const [owner, setOwner] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const feedback = useFormFeedback<"owner">();
  const guard = useDraftGuard({
    dirty: owner !== null,
    onClose: () => setOpen(false),
    description: "The owner you chose will not be assigned.",
  });
  const parties = useRows("parties");
  const assign = useAssignOwner();
  const issues = owner ? [] : [{ field: "owner" as const, message: "Choose an owner." }];
  const error = feedback.submitted ? issues[0]?.message : undefined;
  const unavailable = parties.isError
    ? "Load the people and organizations before assigning an owner."
    : undefined;
  const chosen = formatPlural(recordIds.length, {
    one: `{count} ${noun.one}`,
    other: `{count} ${noun.other}`,
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || unavailable) return;
    setFailure(null);
    if (!feedback.report(issues) || !owner) return;
    // The field locks while the request runs; the primary stays focusable while it loads.
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      const answer = await assign.mutateAsync({ collection, recordIds, ownerPartyId: owner });
      toast.add({
        type: "success",
        title: answer.assigned > 0 ? "Owner assigned" : "Owner unchanged",
        description: ownerAssignedText(answer, noun, formatNumber),
      });
      onAssigned();
      guard.finish();
      guard.complete();
    } catch (cause) {
      guard.finish();
      setFailure(
        `${causeText(cause)} Your choice is kept, and assigning it again changes no record twice.`,
      );
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
        if (!next) onClose();
      }}
    >
      <DialogContent
        width="medium"
        initialFocus={() => feedback.node("owner") ?? true}
        finalFocus={finalFocus}
      >
        <DialogHeader>
          <DialogTitle>Assign owner</DialogTitle>
          <DialogDescription>
            {chosen} selected. The owner replaces any owner they have now.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The owner was not assigned</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <FieldSet disabled={guard.busy}>
                <PartyField
                  label="Owner"
                  required
                  value={owner}
                  parties={parties.data ?? []}
                  onChange={setOwner}
                  loading={parties.isPending && !parties.isError}
                  loadError={parties.isError}
                  onRetry={() => void parties.refetch()}
                  error={error}
                  controlRef={feedback.ref("owner")}
                />
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
            Assign owner
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
