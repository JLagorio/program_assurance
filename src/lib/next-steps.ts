import type { AssuranceTrace } from "./assurance-trace";
import type { ControlStatus } from "./control-status";

/*
 * What a reader does next. A control's status says where a program stands on it; its next step is
 * the one thing that moves it up the ladder, and names the record it is done on. A trace's gap, a
 * stage that holds no record, carries its fix the same way where the reader can make it. Both are
 * derived here from what the reads already answer, so a screen decides nothing of its own: it
 * draws the step as a link to where it is done.
 */

type TraceRequirement = AssuranceTrace["requirements"][number];

/** A requirement a step names: enough to say it and to open it. */
export type StepRequirement = { id: string; code: string; programId: string };

const stepRequirement = (requirement: TraceRequirement): StepRequirement => ({
  id: requirement.id,
  code: requirement.code,
  programId: requirement.program_id,
});

export type ControlNextStep =
  /** No requirement maps the control: one is written or mapped among the program's requirements. */
  | { kind: "map_requirement" }
  /**
   * A requirement maps the control and none cites evidence: the first of them, in the order
   * given. `null` until a read says which requirements map the control.
   */
  | { kind: "link_evidence"; requirement: StepRequirement | null }
  /** Evidence is cited and no assessor has published a determination. */
  | { kind: "assess" }
  /** An assessor found the control short of satisfied: the findings say why. */
  | { kind: "review_findings" };

/**
 * The next step for a control at a status: the one thing that moves it up the ladder. A satisfied
 * control has none. `requirements` are the requirements that map the control, as its trace reads
 * them; without them a control with no evidence still says its step, and names no requirement.
 */
export function controlNextStep(
  status: ControlStatus,
  requirements?: readonly TraceRequirement[] | undefined,
): ControlNextStep | null {
  switch (status) {
    case "no_requirement":
      return { kind: "map_requirement" };
    case "no_evidence": {
      const bare = requirements?.find((requirement) => requirement.evidence_count === 0);
      return { kind: "link_evidence", requirement: bare ? stepRequirement(bare) : null };
    }
    case "not_assessed":
      return { kind: "assess" };
    case "other_than_satisfied":
    case "partially_satisfied":
      return { kind: "review_findings" };
    case "satisfied":
      return null;
  }
}

/** A step in the words of its link: what the reader does, and on which record. */
export function nextStepLabel(step: ControlNextStep | TraceGapFix): string {
  switch (step.kind) {
    case "map_requirement":
      return "Map a requirement";
    case "link_evidence":
      return step.requirement ? `Link evidence to ${step.requirement.code}` : "Link evidence";
    case "map_control":
      return "Map control";
    case "assess":
      return "Open assessment campaigns";
    case "review_findings":
      return "Open assessment findings";
  }
}

/** The fix for a trace's gap: the stage that holds no record, and what fills it. */
export type TraceGapFix =
  /** A control no requirement of the program maps. */
  | { stage: "requirement"; kind: "map_requirement" }
  /** A requirement that cites no evidence: the one the trace is about, or a control's first. */
  | { stage: "evidence"; kind: "link_evidence"; requirement: StepRequirement }
  /** A requirement that maps no control. */
  | { stage: "control"; kind: "map_control"; requirement: StepRequirement };

/**
 * The gaps of a trace that its record's reader can close, each with the stage it fills. A control
 * read inside a program offers a requirement where none maps it and, where its requirements cite
 * no evidence, evidence for the first of them; a requirement offers a control and evidence of its
 * own. A stage with nothing wrong in it (no operational issue, no risk) is not a gap, and a record
 * further down the chain closes nothing upstream from its own page.
 */
export function traceGapFixes(
  trace: Pick<AssuranceTrace, "focus" | "controls" | "requirements" | "evidence">,
  programId?: string | null | undefined,
): TraceGapFix[] {
  const fixes: TraceGapFix[] = [];
  if (trace.focus.kind === "control") {
    if (!programId) return fixes;
    if (trace.requirements.length === 0) {
      fixes.push({ stage: "requirement", kind: "map_requirement" });
    } else if (trace.evidence.length === 0) {
      const bare = trace.requirements.find((requirement) => requirement.evidence_count === 0);
      if (bare)
        fixes.push({
          stage: "evidence",
          kind: "link_evidence",
          requirement: stepRequirement(bare),
        });
    }
  }
  if (trace.focus.kind === "requirement") {
    const own = trace.requirements.find((requirement) => requirement.id === trace.focus.id);
    if (!own) return fixes;
    if (trace.controls.length === 0)
      fixes.push({ stage: "control", kind: "map_control", requirement: stepRequirement(own) });
    if (trace.evidence.length === 0)
      fixes.push({ stage: "evidence", kind: "link_evidence", requirement: stepRequirement(own) });
  }
  return fixes;
}
