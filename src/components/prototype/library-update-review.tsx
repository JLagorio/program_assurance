import { useBlocker } from "@tanstack/react-router";
import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useMemo, useRef, useState } from "react";
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
  Stack,
  Table,
  Textarea,
  toast,
} from "@ledger/design-system";
import { useRows, type Row } from "@/lib/models";
import { useUpdateLibraryAssignment } from "@/lib/library-apply";

type Outcome = "update" | "keep" | "dropped" | "seed";
const outcomeLabel: Record<Outcome, string> = {
  update: "Will take the new narrative",
  keep: "Kept: changed here",
  dropped: "No longer covered; kept",
  seed: "New: will seed",
};
const outcomeTone = {
  update: "success",
  keep: "warning",
  dropped: "warning",
  seed: "information",
} as const;

/**
 * What taking a newer library version changes on one element: each contribution beside the new
 * narrative with the outcome the command will produce, and the reason the update is taken.
 */
export function LibraryUpdateReview({
  name,
  assignmentId,
  systemComponentId,
  currentRevisionId,
  newRevision,
  onClose,
}: {
  name: string;
  assignmentId: string;
  systemComponentId: string;
  currentRevisionId: string;
  newRevision: { revisionId: string; version: number };
  onClose: () => void;
}) {
  const contributions = useRows("component_contributions", {
    system_component_id: systemComponentId,
  });
  const currentImplementations = useRows("defined_component_implementations", {
    component_definition_revision_id: currentRevisionId,
  });
  const newImplementations = useRows("defined_component_implementations", {
    component_definition_revision_id: newRevision.revisionId,
  });
  const controls = useRows("controls");
  const update = useUpdateLibraryAssignment();
  const { confirm: confirmDiscard, confirmation } = useConfirmation();
  const inFlight = useRef(false);
  const bypassClose = useRef(false);
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const lines = useMemo(() => {
    const controlById = new Map((controls.data ?? []).map((row) => [row.id, row]));
    const currentById = new Map((currentImplementations.data ?? []).map((row) => [row.id, row]));
    const matchNew = (implementation: Row<"defined_component_implementations">) =>
      (newImplementations.data ?? []).find(
        (candidate) =>
          candidate.control_id === implementation.control_id &&
          (candidate.control_part_id ?? null) === (implementation.control_part_id ?? null),
      );
    const seen = new Set<string>();
    const out: {
      id: string;
      control: string;
      now: string;
      next: string | null;
      outcome: Outcome;
    }[] = [];
    for (const contribution of contributions.data ?? []) {
      const origin = contribution.library_implementation_id
        ? currentById.get(contribution.library_implementation_id)
        : undefined;
      if (!origin) continue;
      const next = matchNew(origin);
      if (next) seen.add(next.id);
      const control = controlById.get(origin.control_id ?? "");
      const changedHere =
        contribution.description !== origin.description ||
        contribution.implementation_status !== origin.implementation_status;
      out.push({
        id: contribution.id,
        control: control ? `${control.code} · ${control.title}` : "Control",
        now: contribution.description,
        next: next?.description ?? null,
        outcome: !next ? "dropped" : changedHere ? "keep" : "update",
      });
    }
    for (const implementation of newImplementations.data ?? []) {
      if (seen.has(implementation.id) || !implementation.control_id) continue;
      const control = controlById.get(implementation.control_id);
      out.push({
        id: implementation.id,
        control: control ? `${control.code} · ${control.title}` : "Control",
        now: "",
        next: implementation.description,
        outcome: "seed",
      });
    }
    return out.sort((a, b) => a.control.localeCompare(b.control, undefined, { numeric: true }));
  }, [contributions.data, currentImplementations.data, newImplementations.data, controls.data]);
  const pending = [contributions, currentImplementations, newImplementations, controls].some(
    (query) => query.isPending,
  );
  const close = async () => {
    if (inFlight.current) return;
    if (
      !rationale ||
      (await confirmDiscard(
        discardChanges("Your reason for taking this library version has not been saved."),
      ))
    ) {
      bypassClose.current = true;
      onClose();
    }
  };
  useBlocker({
    shouldBlockFn: async () =>
      !bypassClose.current &&
      (inFlight.current ||
        (!!rationale &&
          !(await confirmDiscard(
            discardChanges("Your reason for taking this library version has not been saved."),
          )))),
    enableBeforeUnload: () => !bypassClose.current && (!!rationale || inFlight.current),
  });
  async function confirm() {
    if (inFlight.current || pending) return;
    if (!rationale.trim()) {
      setError("Explain why you are taking this version.");
      return;
    }
    inFlight.current = true;
    setError("");
    try {
      const result = await update.mutateAsync({
        assignmentId,
        newRevisionId: newRevision.revisionId,
        requestId: requestId.current,
        rationale: rationale.trim(),
      });
      toast.add({
        title: `${name} taken to version ${newRevision.version}`,
        type: "success",
        description: `${result.updated} narratives updated, ${result.keptLocal} kept as changed here, ${result.seeded} seeded, ${result.conflicting} to review.`,
      });
      bypassClose.current = true;
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The update could not be taken.");
    } finally {
      inFlight.current = false;
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          void close();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 960 }} showCloseButton={!update.isPending}>
        <DialogHeader>
          <DialogTitle>Take version {newRevision.version}</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void confirm();
          }}
        >
          <Stack space="space.200" className="min-h-0 flex-1 overflow-y-auto p-250">
            <p className="font-body-small text-subtle">
              Narratives the program left as seeded take the new text. Narratives changed here keep
              their text and are marked for review. Controls the new version covers for the first
              time are seeded into the boundary's draft SSP.
            </p>
            {pending ? (
              <p className="text-subtle">Comparing versions…</p>
            ) : (
              <div className="overflow-x-auto">
                <Table aria-label="Changes by control">
                  <thead>
                    <Table.Row>
                      <Table.Header width={200}>Control</Table.Header>
                      <Table.Header>Now</Table.Header>
                      <Table.Header>Version {newRevision.version}</Table.Header>
                      <Table.Header width={200}>Outcome</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <Table.Row key={line.id}>
                        <Table.Cell className="whitespace-normal">{line.control}</Table.Cell>
                        <Table.Cell className="whitespace-normal">
                          {line.now || <span className="text-subtle">—</span>}
                        </Table.Cell>
                        <Table.Cell className="whitespace-normal">
                          {line.next ?? <span className="text-subtle">Not covered</span>}
                        </Table.Cell>
                        <Table.Cell>
                          <Badge variant="secondary" size="xsmall" tone={outcomeTone[line.outcome]}>
                            {outcomeLabel[line.outcome]}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                    {!lines.length && (
                      <Table.Row>
                        <Table.Cell colSpan={4}>No narratives to compare.</Table.Cell>
                      </Table.Row>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="library-update-rationale">Why this update is taken</FieldLabel>
              <Textarea
                disabled={update.isPending}
                id="library-update-rationale"
                value={rationale}
                onChange={(event) => setRationale(event.target.value)}
                placeholder="What changed in the library and why it applies here"
              />
            </Field>
            {error && (
              <p role="alert" className="font-body-small text-danger">
                {error}
              </p>
            )}
          </Stack>
          <DialogFooter>
            <Button type="button" variant="subtle" disabled={update.isPending} onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" disabled={update.isPending || pending} type="submit">
              {update.isPending ? "Taking…" : `Take version ${newRevision.version}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      {confirmation}
    </Dialog>
  );
}
