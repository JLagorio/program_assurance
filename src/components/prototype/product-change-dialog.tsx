import { useId, useRef, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  CheckboxGroup,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorSummary,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Stack,
  toast,
} from "@ledger/design-system";
import { TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  ELEMENT_CHANGE_KINDS,
  ELEMENT_CHANGE_LABELS,
  ELEMENT_CHANGE_NEEDS_REASON,
  useDeclareElementChange,
  type ElementChangeKind,
} from "@/lib/product-assurance";

/** The element whose change is recorded: its identity, its revision and what is recorded now. */
export type ProductChangeTarget = {
  id: string;
  code: string;
  name: string;
  revision: number;
  product_change_kinds: string[] | null;
  product_change_rationale: string | null;
};

const fields = ["kinds", "rationale"] as const;
type ChangeField = (typeof fields)[number];

/**
 * Mark as modified: what a program changed in an element it inherited from a product (software,
 * firmware, hardware or data) and why. It is what makes the controls behind the element owe a new
 * assessment in the program. The element is saved at the revision the reader saw, and the same
 * declaration sent again changes nothing.
 */
export function ProductChangeDialog({
  element,
  onClose,
}: {
  element: ProductChangeTarget;
  onClose: () => void;
}) {
  const formId = useId();
  const [open, setOpen] = useState(true);
  const [kinds, setKinds] = useState<string[]>(element.product_change_kinds ?? []);
  const [rationale, setRationale] = useState(element.product_change_rationale ?? "");
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const feedback = useFormFeedback<ChangeField>();
  const declare = useDeclareElementChange();
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The change you entered will be lost.",
  });
  const issues: FormIssue<ChangeField>[] = [
    ...(kinds.length
      ? []
      : [{ field: "kinds" as const, message: "Choose at least one thing the program changed." }]),
    ...(rationale.trim()
      ? []
      : [{ field: "rationale" as const, message: ELEMENT_CHANGE_NEEDS_REASON }]),
  ];
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
      await declare.mutateAsync({
        systemId: element.id,
        expectedRevision: element.revision,
        kinds: kinds as ElementChangeKind[],
        rationale,
      });
      setDirty(false);
      toast.add({ type: "success", title: `${element.code} marked as modified` });
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(`${causeText(cause)} Your entry is kept.`);
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
        if (!next) onClose();
      }}
    >
      <DialogContent width="medium" initialFocus={() => feedback.node("kinds") ?? true}>
        <DialogHeader>
          <DialogTitle>Mark as modified</DialogTitle>
          <DialogDescription>
            {element.code} {element.name}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The change was not recorded</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy}>
                <Stack space="space.200">
                  <Field invalid={errors.has("kinds") ? true : undefined} required>
                    <CheckboxGroup
                      value={kinds}
                      onValueChange={(next) => {
                        setKinds(next);
                        setDirty(true);
                      }}
                    >
                      <FieldLegend variant="label">What the program changed</FieldLegend>
                      <FieldDescription>
                        The controls that stand on this element owe a new assessment in the program.
                      </FieldDescription>
                      {ELEMENT_CHANGE_KINDS.map((kind, index) => (
                        <Field key={kind} orientation="horizontal">
                          <Checkbox
                            value={kind}
                            {...(index === 0 ? { ref: feedback.ref("kinds") } : {})}
                          />
                          <FieldLabel>{ELEMENT_CHANGE_LABELS[kind]}</FieldLabel>
                        </Field>
                      ))}
                      {errors.has("kinds") ? <FieldError>{errors.get("kinds")}</FieldError> : null}
                    </CheckboxGroup>
                  </Field>
                  <TextField
                    label="Reason for the change"
                    value={rationale}
                    onChange={(value) => {
                      setRationale(value);
                      setDirty(true);
                    }}
                    multiline
                    autoResize
                    required
                    error={errors.get("rationale")}
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
          >
            Mark as modified
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
