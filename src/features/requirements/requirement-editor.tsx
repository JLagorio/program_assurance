import {
  qualityGates,
  requirementStates,
  saveRequirementField,
  setRequirementField,
  verificationMethods,
  type Requirement,
} from "@/lib/requirements";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
} from "@ledger/design-system";
import { useId, useState } from "react";

/** Explicit record editing, separate from page and preview identity. Mount when requested. */
export function RequirementEditor({
  requirement,
  onClose,
}: {
  requirement: Requirement;
  onClose: () => void;
}) {
  const id = useId();
  const [owner, setOwner] = useState(requirement.owner);
  const [state, setState] = useState(requirement.state);
  const [method, setMethod] = useState(requirement.assessmentMethod ?? requirement.method);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const methods = requirement.assessmentMethod
    ? (["Examine", "Interview", "Test"] as const)
    : verificationMethods;
  const submit = async () => {
    const patch = {
      owner: owner.trim(),
      state,
      ...(requirement.assessmentMethod
        ? {
            assessmentMethod: method as "Examine" | "Interview" | "Test",
            method:
              method === "Examine"
                ? ("Inspection" as const)
                : method === "Interview"
                  ? ("Analysis" as const)
                  : ("Test" as const),
          }
        : { method: method as Requirement["method"] }),
    };
    const next = { ...requirement, ...patch };
    if (!owner.trim()) return setError("Enter an owner.");
    const unmet = qualityGates(next).find((gate) => !gate.met);
    if (state === "Approved" && unmet) return setError(`${unmet.label}: ${unmet.reason}`);
    setSaving(true);
    setError(null);
    try {
      await saveRequirementField(requirement.id, owner);
      setRequirementField(requirement.id, patch);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Changes could not be saved.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit requirement details</DialogTitle>
          <DialogDescription>{requirement.id}</DialogDescription>
        </DialogHeader>
        <form
          id={id}
          className="min-h-0 overflow-y-auto p-250"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Stack space="space.200">
            <>
              <Field>
                <FieldLabel htmlFor={`${id}-owner`}>Owner</FieldLabel>
                <Input
                  id={`${id}-owner`}
                  autoFocus
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-state`}>Lifecycle status</FieldLabel>
                <Select
                  value={state}
                  onValueChange={(value) => {
                    if (value) setState(value);
                  }}
                >
                  <SelectTrigger id={`${id}-state`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {requirementStates.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-method`}>Assessment method</FieldLabel>
                <Select
                  value={method}
                  onValueChange={(value) => {
                    if (value) setMethod(value);
                  }}
                >
                  <SelectTrigger id={`${id}-method`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
            {error ? (
              <p role="alert" className="font-body-small text-danger">
                {error}
              </p>
            ) : null}
          </Stack>
        </form>
        <DialogFooter>
          <Button disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={id} variant="primary" isLoading={saving}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
