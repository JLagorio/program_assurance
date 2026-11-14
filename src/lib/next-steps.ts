import type { AssuranceTrace } from "./assurance-trace";
import type { ControlObjective } from "./control-objectives";
import type { ControlStanding } from "./control-status";

/*
 * What a reader does next. A control's status says where a program stands on it; its next step is
 * the one thing that moves it up the ladder, and names the record it is done on. A trace's gap, a
 * stage that holds no record, carries its fix the same way where the reader can make it. Both are
 * derived here from what the reads already answer, so a screen decides nothing of its own: it
 * draws the step as a link to where it is done, or, for a step done on the control itself (Map a
 * requirement, Add to assessment campaign, Plan an assessment), as the control that opens it there.
 */

type TraceRequirement = AssuranceTrace["requirements"][number];

/** A requirement a step names: enough to say it and to open it. */
export type StepRequirement = { id: string; code: string; programId: string };

/** A product assessment a step names: enough to open it. */
export type StepAssessment = { id: string; title: string };

/** An assessment campaign a step names: enough to say it and to open it. */
export type StepCampaign = { id: string; title: string };

/**
 * What the program's open assessment campaigns hold of a control, as its next step reads it: the
 * campaign whose latest plan holds it already (`planned`), and how many have a draft plan it could
 * be added to (`drafts`). From `useControlAssessment` in control-assessment.
 */
export type StepPlans = { planned: StepCampaign | null; drafts: number };

const stepRequirement = (requirement: TraceRequirement): StepRequirement => ({
  id: requirement.id,
  code: requirement.code,
  programId: requirement.program_id,
});

export type ControlNextStep =
  /**
   * No requirement maps the control, or the program's requirements map only some of its assessment
   * objectives: one of the program's requirements is mapped to it. `rest` counts the objectives no
   * requirement maps yet where some are mapped already; the picker then opens with them chosen.
   */
  | { kind: "map_requirement"; rest?: number | undefined }
  /**
   * The requirements map every objective and one is not covered by a requirement that cites
   * evidence: the first requirement that cites none and covers such an objective, else the first
   * that cites none, in the order given. `null` until a read says which requirements map it.
   */
  | { kind: "link_evidence"; requirement: StepRequirement | null }
  /**
   * Evidence is cited, no assessor has published a determination and no open campaign's plan
   * holds the control: it is added to the draft plan of one of the program's campaigns.
   */
  | { kind: "assess" }
  /** The same, where no open campaign has a draft plan: an assessment is planned around it. */
  | { kind: "plan_assessment" }
  /** The same, where an open campaign's plan holds the control: its assessment is under way there. */
  | { kind: "open_campaign"; campaign: StepCampaign }
  /** An assessor found the control short of satisfied: the findings say why. */
  | { kind: "review_findings" }
  /**
   * The product assessment the program's variants inherit the control from found it short of
   * satisfied: the assessment says why, and the one that decided it is named.
   */
  | { kind: "review_product_assessment"; assessment: StepAssessment };

/**
 * Where a program stands on a control, as its next step reads it: the status, whose determination
 * it is with the product assessments behind one the product made, and how many of its assessment
 * objectives the program's requirements map.
 */
export type StepStanding = Pick<ControlStanding, "status"> &
  Partial<
    Pick<ControlStanding, "determinedBy" | "productAssessments" | "objectives" | "objectivesMapped">
  >;

/**
 * The objectives no requirement maps yet, where the requirements map some of a control's and not
 * all; none otherwise, the whole control being what is left.
 */
export function objectivesLeft(standing: StepStanding): number | undefined {
  const { objectives = 0, objectivesMapped = 0 } = standing;
  return objectivesMapped > 0 && objectivesMapped < objectives
    ? objectives - objectivesMapped
    : undefined;
}

/**
 * The next step for a control at a status: the one thing that moves it up the ladder. A satisfied
 * control has none, whoever determined it. No requirement maps the control, or they map some of its
 * objectives and the step maps the rest. `requirements` are the requirements that map the control,
 * as its trace reads them; without them a control with no evidence still says its step, and names
 * no requirement. Where some of its objectives are covered by evidence already, `objectives` (the
 * control's, as `program_control_objectives` reads them) name the requirement whose evidence
 * covers one that is not. Evidence no assessor has determined goes into an assessment: the
 * campaign whose plan holds the control already, else the draft plan of one of the program's open
 * campaigns, else a new one planned around it; without `plans` the step is to add it to a campaign.
 * A determination short of satisfied leads to what decided it: the program's assessment findings,
 * or the product assessment the program inherits it from.
 */
export function controlNextStep(
  standing: StepStanding,
  requirements?: readonly TraceRequirement[] | undefined,
  plans?: StepPlans | undefined,
  objectives?: readonly ControlObjective[] | undefined,
): ControlNextStep | null {
  switch (standing.status) {
    case "no_requirement": {
      const rest = objectivesLeft(standing);
      return rest ? { kind: "map_requirement", rest } : { kind: "map_requirement" };
    }
    case "no_evidence": {
      const bare = requirements?.filter((requirement) => requirement.evidence_count === 0) ?? [];
      // A requirement that covers an objective nothing evidences, where one does: evidence on a
      // requirement whose objectives are evidenced already moves nothing.
      const owed = new Set(
        (objectives ?? [])
          .filter((objective) => !objective.evidenced)
          .flatMap((objective) => objective.requirements.map((requirement) => requirement.id)),
      );
      const named = bare.find((requirement) => owed.has(requirement.id)) ?? bare[0];
      return { kind: "link_evidence", requirement: named ? stepRequirement(named) : null };
    }
    case "not_assessed":
      return assessStep(plans);
    case "other_than_satisfied":
    case "partially_satisfied": {
      const decided =
        standing.determinedBy === "product" ? standing.productAssessments?.[0] : undefined;
      return decided
        ? {
            kind: "review_product_assessment",
            assessment: { id: decided.id, title: decided.title },
          }
        : { kind: "review_findings" };
    }
    case "satisfied":
      return null;
  }
}

/** Where evidence nobody has determined goes: the campaign that holds it, a draft plan, or a new plan. */
function assessStep(
  plans: StepPlans | undefined,
): Extract<ControlNextStep, { kind: "assess" | "plan_assessment" | "open_campaign" }> {
  if (plans?.planned) return { kind: "open_campaign", campaign: plans.planned };
  return plans && plans.drafts === 0 ? { kind: "plan_assessment" } : { kind: "assess" };
}

/** A step done on the control itself, which opens where it is done rather than leading away. */
export const isInPlaceStep = (
  step: ControlNextStep | TraceGapFix,
): step is Extract<
  ControlNextStep | TraceGapFix,
  { kind: "map_requirement" | "assess" | "plan_assessment" }
> => step.kind === "map_requirement" || step.kind === "assess" || step.kind === "plan_assessment";

/** A step in the words of its link: what the reader does, and on which record. */
export function nextStepLabel(step: ControlNextStep | TraceGapFix): string {
  switch (step.kind) {
    case "map_requirement":
      return "rest" in step && step.rest
        ? step.rest === 1
          ? "Map 1 more objective"
          : `Map ${step.rest} more objectives`
        : "Map a requirement";
    case "link_evidence":
      return step.requirement ? `Link evidence to ${step.requirement.code}` : "Link evidence";
    case "map_control":
      return "Map control";
    case "assess":
      return "Add to assessment campaign";
    case "plan_assessment":
      return "Plan an assessment";
    case "open_campaign":
      return "Open assessment campaign";
    case "review_findings":
      return "Open assessment findings";
    case "review_product_assessment":
      return "Open product assessment";
    case "decided_by_product":
      return `Decided by ${step.assessment.title}`;
    case "link_requirement":
      return "Link requirement";
  }
}

/** An operational issue a step names: enough to open it. */
export type StepIssue = { id: string };

/** The fix for a trace's gap: the stage that holds no record, and what fills it. */
export type TraceGapFix =
  /** A control no requirement of the program maps. */
  | { stage: "requirement"; kind: "map_requirement" }
  /**
   * A control no requirement of the program maps and every product variant of the program
   * inherits with a determination: nothing is missing, and the product assessment that decided it
   * is named instead of a fix.
   */
  | { stage: "requirement"; kind: "decided_by_product"; assessment: StepAssessment }
  /** An operational issue that names no requirement, and whose evidence supports none. */
  | { stage: "requirement"; kind: "link_requirement"; issue: StepIssue }
  /** A requirement that cites no evidence: the one the trace is about, or a control's first. */
  | { stage: "evidence"; kind: "link_evidence"; requirement: StepRequirement }
  /** A requirement that maps no control. */
  | { stage: "control"; kind: "map_control"; requirement: StepRequirement }
  /** A control whose evidence no assessor has determined and no open campaign's plan holds. */
  | { stage: "finding"; kind: "assess" }
  /** The same, where no open campaign has a draft plan to add it to. */
  | { stage: "finding"; kind: "plan_assessment" }
  /**
   * A control whose evidence an open campaign's plan holds and no assessor has determined yet:
   * nothing the reader can close, and the campaign where it is assessed is named instead.
   */
  | { stage: "finding"; kind: "open_campaign"; campaign: StepCampaign };

/** Whether a gap's entry is a fix the reader makes, rather than words that say why it is empty. */
export const isReaderFix = (fix: TraceGapFix) =>
  fix.kind !== "decided_by_product" && fix.kind !== "open_campaign";

/**
 * The gaps of a trace that its record's reader can close, each with the stage it fills. A control
 * read inside a program offers a requirement where none maps it, where its requirements cite no
 * evidence, evidence for the first of them, and, where no assessor has determined that evidence,
 * an assessment that holds the control; a requirement offers a control and evidence of its own;
 * and an operational issue that names no requirement offers one, since the link is the issue's
 * own, made on its page. A stage with nothing wrong in it (no operational issue, no risk) is not a
 * gap, and otherwise a record further down the chain closes nothing upstream from its own page:
 * evidence, a finding, a risk and a remediation item offer nothing.
 *
 * `standing` is where the program stands on a control, as the program's control status reads it.
 * A control the program's product variants inherit with a determination (`determinedBy`
 * "product") is decided by the product assessment, not missing a requirement: its requirements
 * stage names that assessment, the one that decided it first, and offers no requirement. Its
 * Assessment findings stage waits on `plans`, what the program's open campaigns hold of it: the
 * campaign whose plan holds it already is named, else the control is added to a draft plan or an
 * assessment is planned around it.
 */
export function traceGapFixes(
  trace: Pick<AssuranceTrace, "focus" | "controls" | "requirements" | "evidence" | "findings">,
  programId?: string | null | undefined,
  standing?: StepStanding | null | undefined,
  plans?: StepPlans | null | undefined,
): TraceGapFix[] {
  const fixes: TraceGapFix[] = [];
  if (trace.focus.kind === "control") {
    if (!programId) return fixes;
    if (trace.requirements.length === 0) {
      const decided =
        standing?.determinedBy === "product" ? standing.productAssessments?.[0] : undefined;
      fixes.push(
        decided
          ? {
              stage: "requirement",
              kind: "decided_by_product",
              assessment: { id: decided.id, title: decided.title },
            }
          : { stage: "requirement", kind: "map_requirement" },
      );
    } else if (trace.evidence.length === 0) {
      const bare = trace.requirements.find((requirement) => requirement.evidence_count === 0);
      if (bare)
        fixes.push({
          stage: "evidence",
          kind: "link_evidence",
          requirement: stepRequirement(bare),
        });
    } else if (standing?.status === "not_assessed" && trace.findings.length === 0 && plans) {
      fixes.push({ stage: "finding", ...assessStep(plans) });
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
  if (trace.focus.kind === "issue" && trace.requirements.length === 0)
    fixes.push({ stage: "requirement", kind: "link_requirement", issue: { id: trace.focus.id } });
  return fixes;
}
