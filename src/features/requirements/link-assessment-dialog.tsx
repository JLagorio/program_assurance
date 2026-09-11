import { EvidenceRecordDetails } from "@/features/evidence/evidence-record-details";
import { campaignById, eventById, objectiveTone, type TestObjective } from "@/lib/campaigns";
import { nodeById } from "@/lib/composition";
import { currentSession } from "@/lib/control-work";
import { evidenceById, useEvidenceVersion } from "@/lib/evidence-catalog";
import {
  linkVerification,
  objectiveEvidence,
  requirementsForObjective,
  unlinkedObjectives,
  useVerificationVersion,
} from "@/lib/requirement-verification";
import { resolvedObjectiveResult } from "@/lib/test-execution";
import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  defineColumns,
  KeyValue,
  RecordBrowser,
  Section,
  Stack,
} from "@ledger/design-system";
import { useMemo } from "react";

type ObjectiveRow = TestObjective & { assessment: string; campaign: string };
const columns = defineColumns<ObjectiveRow>((c) => [
  c.id("id", { header: "Objective", width: 104, hideable: false }),
  c.text("statement", { header: "Statement", minWidth: 260, hideable: false }),
  c.text("assessment", { header: "Assessment", width: 200 }),
  c.text("method", { header: "Method", width: 136 }),
  c.status("result", { header: "Result", width: 136, tone: (row) => objectiveTone(row.result) }),
]);

function ObjectiveDetails({ objective }: { objective: ObjectiveRow }) {
  const event = objective.event ? eventById.get(objective.event) : undefined;
  const evidence = objectiveEvidence(objective.id);
  const requirements = requirementsForObjective(objective.id);
  return (
    <Stack space="space.250">
      <div>
        <KeyValue wrap label="Result">
          <Badge tone={objectiveTone(objective.result)}>{objective.result}</Badge>
        </KeyValue>
        <KeyValue wrap label="Method">
          {objective.method}
        </KeyValue>
        <KeyValue wrap label="Assessment">
          {objective.assessment}
        </KeyValue>
        <KeyValue wrap label="Campaign">
          {objective.campaign || "Not recorded"}
        </KeyValue>
        <KeyValue wrap label="Team">
          {event?.team || "Not recorded"}
        </KeyValue>
        <KeyValue wrap label="Window">
          {event?.window || "Not recorded"}
        </KeyValue>
      </div>
      {event?.notes ? (
        <Section title="Assessment context">
          <p className="whitespace-pre-wrap break-words font-body">{event.notes}</p>
        </Section>
      ) : null}
      <Section title="Coverage">
        <KeyValue wrap label="Controls">
          {objective.controls?.join(", ") || "Not recorded"}
        </KeyValue>
        <KeyValue wrap label="CCIs">
          {objective.ccis.join(", ") || "Not recorded"}
        </KeyValue>
        <KeyValue wrap label="Elements">
          {objective.nodes?.map((id) => nodeById.get(id)?.name ?? id).join(", ") || "Not recorded"}
        </KeyValue>
        <KeyValue wrap label="Requirements">
          {requirements.join(", ") || "No requirements linked"}
        </KeyValue>
      </Section>
      <Section title="Evidence" count={evidence.length}>
        {evidence.map((id) => {
          const artifact = evidenceById(id);
          return artifact ? (
            <Collapsible key={id} className="border-b border-default py-100">
              <CollapsibleTrigger className="w-full text-left font-body text-brand hover:underline">
                {id}: {artifact.label}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-150">
                <EvidenceRecordDetails artifact={artifact} />
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <p key={id} className="py-100 font-body text-subtle">
              {id} — record unavailable
            </p>
          );
        })}
        {!evidence.length ? (
          <p className="font-body text-subtle">No evidence recorded for this objective.</p>
        ) : null}
      </Section>
    </Stack>
  );
}

/** Bulk relationship selection with inspection, scoped to the requirement's program. */
export function LinkAssessmentDialog({
  requirementId,
  onClose,
}: {
  requirementId: string;
  onClose: () => void;
}) {
  const version = useVerificationVersion();
  useEvidenceVersion();
  const records = useMemo(
    () =>
      unlinkedObjectives(requirementId).map((objective): ObjectiveRow => {
        const event = objective.event ? eventById.get(objective.event) : undefined;
        return {
          ...objective,
          result: resolvedObjectiveResult(objective.id).result,
          assessment: event?.name ?? "No assessment event",
          campaign: event ? (campaignById.get(event.campaign)?.name ?? "") : "",
        };
      }),
    [requirementId, version],
  );
  return (
    <RecordBrowser
      open
      onClose={onClose}
      title="Link assessment objectives"
      description={`Find and preview the objectives that verify ${requirementId}, then select the records to link.`}
      records={records}
      columns={columns}
      filters={["assessment", "method", "result"]}
      recordTitle={(record) => record.statement}
      renderPreview={(record) => <ObjectiveDetails objective={record} />}
      confirmLabel="Link objectives"
      onConfirm={(selected) => {
        for (const record of selected)
          linkVerification(requirementId, record.id, currentSession().name);
      }}
    />
  );
}
