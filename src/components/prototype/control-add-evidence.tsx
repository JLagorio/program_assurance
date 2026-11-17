// Add evidence, done on the program's record of a control (boards control--evidence and
// control-after of the November 2026 UX proposal). Where the control's next step is evidence, the
// record's slot opens it over the page rather than leading to the requirement's Evidence tab: the
// requirement's own Add evidence browser (`EvidenceLinkBrowser` in requirement-evidence), titled
// Add evidence and named for the requirement and the control ("REQ-064 · SI-2 Flaw Remediation"),
// over the published versions of the program's evidence and the workspace's unscoped artifacts
// that requirement does not cite yet, a page at a time, with Create evidence artifact and its
// Prepare evidence step (the boards' Upload). It links to the requirement that owes the evidence,
// the one the control's next step names (`controlNextStep` in next-steps), and a Requirement choice
// offers the control's other requirements where it has more than one, those that cite none first.
// Beside it, what that requirement covers of the control ("Covers 10 of 10 objectives"), which the
// evidence then counts for. One request links the chosen versions (`link_requirement_evidence`),
// and the record's reads read again: the control status, its objectives and its trace follow the
// requirement's evidence, so the record climbs (No evidence to Not assessed, Add to assessment
// campaign).
//
// Once an open campaign's plan holds what is left to judge of the control, the record waits on its
// assessment: `ControlAssessmentWait` says In assessment, the campaign, whom it waits on and when
// the campaign ends. The schema records no assessor of a campaign, so it names the program's lead
// assessor today, who publishes the campaign's results (else its assessors; `assessmentWait` in
// control-work). Not built: Remind, which the boards draw beside it; nothing records or sends one.

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DateTime, Inline, Meter, Person, Stack, Text, TextLink } from "@ledger/design-system";
import { ChoiceField } from "@/components/app/fields";
import { useWorkspace } from "@/components/app/workspace";
import { useAssuranceTrace } from "@/lib/assurance-trace";
import { useProgramControlObjectives } from "@/lib/control-objectives";
import { useControlNextStep } from "@/lib/control-status";
import { useAssessmentWait, useLatestRevisions } from "@/lib/control-work";
import { useRow, useRows } from "@/lib/models";
import { controlName, objectivesOf } from "@/lib/product-records";
import { coverageOf, coveredObjectives } from "@/lib/requirement-control-mappings";
import { programRoles, statusLabel } from "@/lib/status";
import { EvidenceLinkBrowser } from "./requirement-evidence";

/** Meter draws a mark an objective up to about twenty; past that the count stands alone. */
const METER_MAX = 20;

export function ControlAddEvidence({
  programId,
  controlId,
  open,
  onOpenChange,
}: {
  programId: string;
  controlId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const workspace = useWorkspace();
  const control = useRow("controls", controlId);
  const trace = useAssuranceTrace({ kind: "control", id: controlId, programId });
  const requirements = trace.data?.requirements;
  // The requirement that owes evidence: the one the control's next step names.
  const { step } = useControlNextStep(programId, controlId, requirements);
  const named = step?.kind === "link_evidence" ? step.requirement?.id : undefined;
  // The control's requirements, the one the step names first, then those that cite none.
  const offered = useMemo(
    () =>
      [...(requirements ?? [])].sort(
        (a, b) =>
          Number(b.id === named) - Number(a.id === named) ||
          Number(a.evidence_count > 0) - Number(b.evidence_count > 0) ||
          a.code.localeCompare(b.code, undefined, { numeric: true }),
      ),
    [requirements, named],
  );
  const [chosen, setChosen] = useState<string | null>(null);
  // Each opening starts on the requirement that owes evidence.
  const [wasOpen, setWasOpen] = useState(false);
  // What the browser reads of the requirement is read once it first opens, and kept after.
  const [asked, setAsked] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setChosen(null);
      setAsked(true);
    }
  }
  const requirement = offered.find((row) => row.id === chosen) ?? offered[0];
  const requirementIds = useMemo(() => offered.map((row) => row.id), [offered]);
  const { revisions, latest } = useLatestRevisions(asked ? requirementIds : undefined);
  const coverage = useProgramControlObjectives(programId, controlId, { enabled: asked });
  const revisionId = requirement ? latest.get(requirement.id) : undefined;
  const links = useRows(
    "requirement_evidence",
    { requirement_revision_id: revisionId ?? "" },
    { columns: ["id", "evidence_version_id"], enabled: !!revisionId },
  );
  const mappings = useRows(
    "requirement_control_links",
    { control_id: controlId, requirement_revision_id: revisionId ?? "" },
    { columns: ["id", "control_part_id"], enabled: !!revisionId },
  );
  const linkedVersionIds = useMemo(
    () => links.data?.map((row) => row.evidence_version_id),
    [links.data],
  );
  // What the requirement covers of the control: the objectives its evidence counts for.
  const objectives = coverage.data?.objectives;
  const covered = useMemo(
    () =>
      objectives && mappings.data
        ? coveredObjectives(
            coverageOf(
              objectives,
              mappings.data.map((row) => row.control_part_id),
            ),
            objectives,
          )
        : undefined,
    [objectives, mappings.data],
  );
  // With no requirement to link to, the browser waits on nothing it cannot read, and says why it
  // links nothing when the reader confirms.
  const unmapped = trace.isSuccess && !requirement;
  const queries = [control, trace, revisions, coverage, ...(unmapped ? [] : [links, mappings])];
  const ready = !!control.data && !!revisionId && links.isSuccess;
  const name = control.data ? controlName(control.data) : "this control";
  if (workspace.role === "viewer") return null;
  return (
    <EvidenceLinkBrowser
      open={open}
      onClose={() => onOpenChange(false)}
      programId={programId}
      requirementRevisionId={revisionId ?? ""}
      linkedVersionIds={ready ? (linkedVersionIds ?? []) : unmapped ? [] : undefined}
      queries={queries}
      blocked={
        !requirement
          ? `No requirement maps ${control.data?.code ?? "this control"}: map one first.`
          : !ready
            ? "The requirement is still loading."
            : undefined
      }
      title="Add evidence"
      description={requirement ? `${requirement.code} · ${name}` : name}
      confirmLabel="Add evidence"
      context={
        <Stack space="space.150">
          {offered.length > 1 && requirement ? (
            <ChoiceField
              label="Requirement"
              value={requirement.id}
              onChange={(value) => value && setChosen(value)}
              options={offered.map((row) => ({
                value: row.id,
                label: `${row.code} · ${row.title}`,
              }))}
            />
          ) : null}
          {objectives && covered !== undefined && objectives.length > 0 ? (
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <Text weight="medium">Covers</Text>
              {objectives.length <= METER_MAX ? (
                <Meter value={covered} max={objectives.length} />
              ) : (
                <Text numeric>{objectivesOf(String(covered), String(objectives.length))}</Text>
              )}
              <Text color="color.text.subtle">objectives of {control.data?.code}</Text>
            </Inline>
          ) : null}
        </Stack>
      }
    />
  );
}

/**
 * A control under way in an assessment, where the record's slot says its standing: In assessment,
 * the campaign whose plan holds what is left to judge of it, whom it waits on and the day the
 * campaign ends. Nothing while no open campaign's plan holds it or while that is being read; the
 * reads' failures are said by the page's alert (`queries` of `useAssessmentWait`).
 */
export function ControlAssessmentWait({
  programId,
  controlId,
}: {
  programId: string;
  controlId: string;
}) {
  const { wait } = useAssessmentWait(programId, controlId);
  if (!wait) return null;
  const { campaign, waitingOn, role } = wait;
  return (
    <Inline space="space.100" alignBlock="center" shouldWrap>
      <Text weight="medium">In assessment</Text>
      <TextLink render={<Link to="/campaigns/$campaignId" params={{ campaignId: campaign.id }} />}>
        {campaign.title}
      </TextLink>
      {waitingOn.length > 0 && role && (
        <Inline space="space.050" alignBlock="center">
          <Text>Waiting on</Text>
          {waitingOn.map((holder) => (
            <Person key={holder.assignmentId} name={holder.name} />
          ))}
          <Text color="color.text.subtle">{statusLabel(programRoles, role).toLowerCase()}</Text>
        </Inline>
      )}
      {campaign.endsAt && (
        <Text color="color.text.subtle">
          ends <DateTime value={campaign.endsAt} format="date" />
        </Text>
      )}
    </Inline>
  );
}
