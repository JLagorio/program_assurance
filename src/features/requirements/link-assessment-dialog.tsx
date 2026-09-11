import { eventById, objectiveTone } from "@/lib/campaigns";
import { currentSession } from "@/lib/control-work";
import {
  linkVerification,
  unlinkedObjectives,
  useVerificationVersion,
} from "@/lib/requirement-verification";
import { resolvedObjectiveResult } from "@/lib/test-execution";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Id,
  Indicator,
  Input,
  RadioGroup,
  RadioGroupItem,
} from "@ledger/design-system";
import { useId, useState } from "react";

/** Search, compare and explicitly confirm one assessment relationship. */
export function LinkAssessmentDialog({
  requirementId,
  onClose,
}: {
  requirementId: string;
  onClose: () => void;
}) {
  useVerificationVersion();
  const id = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);
  const candidates = unlinkedObjectives(requirementId);
  const rows = candidates.filter((objective) =>
    `${objective.id} ${objective.statement} ${eventById.get(objective.event ?? "")?.name ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const chosen = candidates.find((objective) => objective.id === selected);
  const apply = () => {
    if (!chosen) return;
    try {
      linkVerification(requirementId, chosen.id, currentSession().name);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The assessment could not be linked.");
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent style={{ maxWidth: 720 }}>
        <DialogHeader>
          <DialogTitle>Link assessment objective</DialogTitle>
          <DialogDescription>
            Choose the objective that verifies {requirementId}, then confirm the link.
          </DialogDescription>
        </DialogHeader>
        <div className="shrink-0 px-250 py-150">
          <Input
            autoFocus
            type="search"
            aria-label="Find assessment objectives"
            placeholder="Search objectives or assessments"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="min-h-0 overflow-y-auto px-250 pb-200">
          <RadioGroup
            value={selected}
            onValueChange={setSelected}
            aria-label="Assessment objectives"
            className="gap-0 divide-y divide-default"
          >
            {rows.map((objective) => (
              <label
                key={objective.id}
                htmlFor={`${id}-${objective.id}`}
                className="flex cursor-pointer items-start gap-150 py-150"
              >
                <RadioGroupItem
                  id={`${id}-${objective.id}`}
                  value={objective.id}
                  className="mt-025 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-100">
                    <Id className="text-subtle">{objective.id}</Id>
                    <Indicator tone={objectiveTone(resolvedObjectiveResult(objective.id).result)}>
                      {resolvedObjectiveResult(objective.id).result}
                    </Indicator>
                  </span>
                  <span className="block whitespace-normal break-words pt-050 font-body">
                    {objective.statement}
                  </span>
                  <span className="block pt-050 font-body-small text-subtle">
                    {eventById.get(objective.event ?? "")?.name ?? "No assessment event"}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
          {!rows.length ? (
            <p className="py-200 font-body text-subtle">No objectives match this search.</p>
          ) : null}
          {error ? (
            <p role="alert" className="font-body-small text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <span className="me-auto font-body-small text-subtle">
            {chosen ? `${chosen.id} selected` : "Select an objective"}
          </span>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!chosen} onClick={apply}>
            Link objective
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
