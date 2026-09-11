import { TargetLink } from "@/components/app/requirements";
import {
  allocationStates,
  allocationStateTone,
  coverageTone,
  coverages,
  responsibilities,
  resolveTarget,
  setAllocationField,
  type Allocation,
} from "@/lib/requirements";
import {
  Badge,
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
  Textarea,
} from "@ledger/design-system";
import { useId, useState } from "react";

/** Record allocations remain readable at panel width; the register retains its table. */
export function RequirementAllocations({
  allocations,
  programId,
}: {
  allocations: Allocation[];
  programId: string;
}) {
  const [editing, setEditing] = useState<Allocation | null>(null);
  return (
    <>
      <div className="divide-y divide-default">
        {allocations.map((allocation) => (
          <article key={allocation.id} className="min-w-0 py-200">
            <div className="flex min-w-0 items-start justify-between gap-150">
              <div className="min-w-0 font-medium [&_a]:whitespace-normal [&_a]:text-start">
                <TargetLink allocation={allocation} programId={programId} />
              </div>
              <Button
                size="small"
                onClick={() => setEditing(allocation)}
                aria-label={`Edit allocation to ${resolveTarget(allocation).name}`}
              >
                Edit
              </Button>
            </div>
            <dl className="grid grid-cols-2 gap-150 pt-150 font-body-small">
              <div>
                <dt className="text-subtle">Responsibility</dt>
                <dd>{allocation.responsibility}</dd>
              </div>
              <div>
                <dt className="text-subtle">Coverage</dt>
                <dd>
                  <Badge size="xsmall" variant="secondary" tone={coverageTone[allocation.coverage]}>
                    {allocation.coverage}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-subtle">Owner</dt>
                <dd className="break-words">{allocation.owner || "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-subtle">Status</dt>
                <dd>
                  <Badge
                    size="xsmall"
                    variant="secondary"
                    tone={allocationStateTone[allocation.state]}
                  >
                    {allocation.state}
                  </Badge>
                </dd>
              </div>
            </dl>
            {allocation.scope ? (
              <p className="whitespace-pre-wrap break-words pt-150 font-body-small text-subtle">
                {allocation.scope}
              </p>
            ) : null}
          </article>
        ))}
        {!allocations.length ? (
          <p className="py-150 font-body text-subtle">No allocations yet.</p>
        ) : null}
      </div>
      {editing ? <AllocationEditor allocation={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}
function AllocationEditor({
  allocation,
  onClose,
}: {
  allocation: Allocation;
  onClose: () => void;
}) {
  const id = useId();
  const [values, setValues] = useState({
    owner: allocation.owner,
    scope: allocation.scope,
    responsibility: allocation.responsibility,
    coverage: allocation.coverage,
    state: allocation.state,
  });
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit allocation</DialogTitle>
          <DialogDescription>{resolveTarget(allocation).name}</DialogDescription>
        </DialogHeader>
        <form
          id={id}
          className="min-h-0 overflow-y-auto p-250"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              setAllocationField(allocation.id, values);
              onClose();
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : "The allocation could not be updated.",
              );
            }
          }}
        >
          <Stack space="space.200">
            <Field>
              <FieldLabel htmlFor={`${id}-owner`}>Owner</FieldLabel>
              <Input
                id={`${id}-owner`}
                autoFocus
                value={values.owner}
                onChange={(event) => setValues({ ...values, owner: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-responsibility`}>Responsibility</FieldLabel>
              <Select
                value={values.responsibility}
                onValueChange={(responsibility) => {
                  if (responsibility) setValues({ ...values, responsibility });
                }}
              >
                <SelectTrigger id={`${id}-responsibility`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {responsibilities.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-coverage`}>Coverage</FieldLabel>
              <Select
                value={values.coverage}
                onValueChange={(coverage) => {
                  if (coverage) setValues({ ...values, coverage });
                }}
              >
                <SelectTrigger id={`${id}-coverage`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {coverages.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-state`}>Allocation status</FieldLabel>
              <Select
                value={values.state}
                onValueChange={(state) => {
                  if (state) setValues({ ...values, state });
                }}
              >
                <SelectTrigger id={`${id}-state`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allocationStates.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-scope`}>Implementation responsibility</FieldLabel>
              <Textarea
                id={`${id}-scope`}
                rows={4}
                value={values.scope}
                onChange={(event) => setValues({ ...values, scope: event.target.value })}
              />
            </Field>
            {error ? (
              <p role="alert" className="font-body-small text-danger">
                {error}
              </p>
            ) : null}
          </Stack>
        </form>
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form={id} variant="primary">
            Save allocation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
