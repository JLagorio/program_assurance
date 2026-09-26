import { AlertCircle } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
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
  Diff,
  FieldSet,
  Prose,
  Stack,
  Text,
  defineColumns,
  toast,
  useDataTable,
} from "@ledger/design-system";
import { TextField } from "@/components/app/fields";
import { useFormFeedback } from "@/components/app/form-feedback";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useUpdateLibraryAssignment } from "@/lib/library-apply";
import { useRows, type Row } from "@/lib/models";
import type { StatusVocabulary } from "@/lib/status";
import { ProductCollection } from "./product-collection";
import { QueryState } from "./work-common";

type Outcome = "update" | "keep" | "dropped" | "seed";
/** What taking the version does to one narrative, in the order a reviewer reads them. */
const outcomes: StatusVocabulary<Outcome> = {
  update: { label: "Will take the new narrative", tone: "success", rank: 0 },
  keep: { label: "Kept: changed here", tone: "warning", rank: 1 },
  seed: { label: "New: will seed", tone: "information", rank: 2 },
  dropped: { label: "No longer covered; kept", tone: "warning", rank: 3 },
};

type Line = {
  id: string;
  control: string;
  /** The narrative the program has now; empty for a control the new version seeds. */
  now: string;
  /** The library's text in the version in use, where the program changed its copy. */
  library: string | null;
  /** The new version's text; null where the new version no longer covers the control. */
  next: string | null;
  outcome: Outcome;
};

/** One narrative's change, shown when its row opens: what the reader decides on, not two copies. */
function LineChange({ line, version }: { line: Line; version: number }) {
  const after = `Version ${version}`;
  if (line.outcome === "dropped")
    return (
      <Stack space="space.100">
        <Text as="p" color="color.text.subtle">
          {after} no longer covers this control. The narrative stays as it is.
        </Text>
        {line.now ? <Prose label="Narrative">{line.now}</Prose> : null}
      </Stack>
    );
  if (line.outcome === "keep")
    return (
      <Stack space="space.100">
        <Text as="p" color="color.text.subtle">
          The narrative was changed here, so it keeps its text and is marked for review. What the
          library changed:
        </Text>
        <Diff
          before={line.library ?? ""}
          after={line.next ?? ""}
          beforeLabel="Library now"
          afterLabel={after}
          label={`${line.control}, library change to ${after}`}
        />
      </Stack>
    );
  return (
    <Diff
      before={line.now}
      after={line.next ?? ""}
      beforeLabel="Now"
      afterLabel={after}
      label={`${line.control}, Now to ${after}`}
    />
  );
}

const changeColumns = defineColumns<Line>((c) => [
  c.text("control", { header: "Control", priority: 0, minWidth: 200 }),
  c.status("outcome", { header: "Outcome", width: 200, statuses: outcomes }),
]);

/** A narrative whose text the reader has something to read about. */
const changes = (line: Line) =>
  line.outcome === "seed" ||
  line.outcome === "keep" ||
  (line.outcome === "update" && line.now !== line.next);

/**
 * The changes by control, mounted once they have loaded so that every row whose narrative changes
 * starts open onto its difference; an unchanged row opens on request.
 */
function ChangesTable({ lines, version }: { lines: Line[]; version: number }) {
  const table = useDataTable({
    columns: changeColumns,
    data: lines,
    getRowId: (line) => line.id,
    label: "Changes by control",
    detail: (line) => <LineChange line={line} version={version} />,
    initialState: {
      expanded: Object.fromEntries(lines.filter(changes).map((line) => [line.id, true])),
    },
  });
  return (
    <ProductCollection
      table={table}
      sort={false}
      keepQuestion={false}
      searchLabel="Find control changes"
      empty={{
        illustration: "document",
        title: "No narratives to compare",
        description: "This version changes no narrative on this element.",
      }}
    />
  );
}

/**
 * What taking a newer library version changes on one element: each contribution with the outcome
 * the command will produce and, when its row opens, what changes in its narrative; then the reason
 * the update is taken.
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
  const controls = useRows("controls", {}, { columns: ["id", "code", "title"] });
  const update = useUpdateLibraryAssignment();
  const formId = useId();
  const [open, setOpen] = useState(true);
  const [rationale, setRationale] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const requestId = useRef(crypto.randomUUID());
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const feedback = useFormFeedback<"rationale">();
  const guard = useDraftGuard({
    dirty: rationale.trim() !== "",
    onClose: () => setOpen(false),
    description: "Your reason for taking this library version will be lost.",
  });
  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);
  const lines = useMemo(() => {
    const controlById = new Map((controls.data ?? []).map((row) => [row.id, row]));
    const currentById = new Map((currentImplementations.data ?? []).map((row) => [row.id, row]));
    const matchNew = (implementation: Row<"defined_component_implementations">) =>
      (newImplementations.data ?? []).find(
        (candidate) =>
          candidate.control_id === implementation.control_id &&
          (candidate.control_part_id ?? null) === (implementation.control_part_id ?? null),
      );
    const controlName = (id: string | null) => {
      const control = id ? controlById.get(id) : undefined;
      return control ? `${control.code} · ${control.title}` : "Control";
    };
    const seen = new Set<string>();
    const out: Line[] = [];
    for (const contribution of contributions.data ?? []) {
      const origin = contribution.library_implementation_id
        ? currentById.get(contribution.library_implementation_id)
        : undefined;
      if (!origin) continue;
      const next = matchNew(origin);
      if (next) seen.add(next.id);
      const changedHere =
        contribution.description !== origin.description ||
        contribution.implementation_status !== origin.implementation_status;
      out.push({
        id: contribution.id,
        control: controlName(origin.control_id),
        now: contribution.description ?? "",
        library: origin.description ?? "",
        next: next?.description ?? null,
        outcome: !next ? "dropped" : changedHere ? "keep" : "update",
      });
    }
    for (const implementation of newImplementations.data ?? []) {
      if (seen.has(implementation.id) || !implementation.control_id) continue;
      out.push({
        id: implementation.id,
        control: controlName(implementation.control_id),
        now: "",
        library: null,
        next: implementation.description ?? "",
        outcome: "seed",
      });
    }
    return out.sort((a, b) => a.control.localeCompare(b.control, undefined, { numeric: true }));
  }, [contributions.data, currentImplementations.data, newImplementations.data, controls.data]);
  const queries = [contributions, currentImplementations, newImplementations, controls];
  const loading = queries.some((query) => query.data === undefined);
  const errors = new Map(
    feedback.submitted && !rationale.trim()
      ? [["rationale", "Explain why you are taking this version."] as const]
      : [],
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || loading) return;
    setFailure(null);
    if (
      !feedback.report(
        rationale.trim()
          ? []
          : [{ field: "rationale", message: "Explain why you are taking this version." }],
      )
    )
      return;
    // The field locks while the command runs; the primary stays focusable while it loads.
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      const result = await update.mutateAsync({
        assignmentId,
        newRevisionId: newRevision.revisionId,
        requestId: requestId.current,
        rationale: rationale.trim(),
      });
      const review = result.conflicting ? `, ${result.conflicting} to review` : "";
      toast.add({
        title: `${name} is on version ${newRevision.version}`,
        type: "success",
        description: `${result.updated} updated, ${result.keptLocal} kept, ${result.seeded} seeded${review}.`,
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${cause instanceof Error ? cause.message : "The request failed."} Your reason is kept, and taking the version again will not apply it twice.`,
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
        if (!next) onClose();
      }}
    >
      <DialogContent width="large" initialFocus={() => feedback.node("rationale") ?? true}>
        <DialogHeader>
          <DialogTitle>Take version {newRevision.version}</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              <Text as="p" color="color.text.subtle">
                Narratives the program left as seeded take the new text. Narratives changed here
                keep their text and are marked for review. Controls the new version covers for the
                first time are seeded into the boundary's draft SSP.
              </Text>
              <QueryState queries={queries}>
                <ChangesTable lines={lines} version={newRevision.version} />
              </QueryState>
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The update was not taken</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <FieldSet disabled={guard.busy}>
                <TextField
                  label="Why this update is taken"
                  value={rationale}
                  onChange={setRationale}
                  multiline
                  required
                  description="What changed in the library, and why it applies here."
                  error={errors.get("rationale")}
                  controlRef={feedback.ref("rationale")}
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
            disabledReason={loading ? "The changes to review are still loading." : undefined}
          >
            Take version {newRevision.version}
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
