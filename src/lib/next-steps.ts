import type { AssuranceTrace } from "./assurance-trace";
import type { ProgramControlObjectives } from "./control-objectives";
import type { ControlStanding } from "./control-status";
import { coveredSomewhere } from "./requirement-control-mappings";

/*
 * What a reader does next. A control's status says where a program stands on it; its next step is
 * the one thing that moves it up the ladder, and names the record it is done on. A trace's gap, a
 * stage that holds no record, carries its fix the same way where the reader can make it, and a
 * control's Requirements stage is given its step while its requirements map it in part. Both are
 * derived here from what the reads already answer, so a screen decides nothing of its own: it
 * draws the step as a link to where it is done, or, for a step done on the control itself (Map a
 * requirement, Allocate requirements, Add to assessment campaign, Plan an assessment), as the
 * control that opens it there.
 */

type TraceRequirement = AssuranceTrace["requirements"][number];

/** A requirement a step names: enough to say it and to open it. */
export type StepRequirement = { id: string; code: string; programId: string };

/**
 * A system a step names: one of the program's systems whose control baseline selects the control
 * and on which it is not yet covered. Enough to say it ("Map on R210-STD-CUSA") and to work on it.
 */
export type StepSystem = { id: string; code: string; name: string };

/**
 * Where the program's requirements cover a control, objective by objective and system by system,
 * as its next step reads it: `program_control_objectives` (control-objectives).
 */
export type StepCoverage = Pick<
  ProgramControlObjectives,
  "objectives" | "systems" | "requirements"
>;

/** A product assessment a step names: enough to open it. */
export type StepAssessment = { id: string; title: string };

/** An assessment campaign a step names: enough to say it and to open it. */
export type StepCampaign = { id: string; title: string };

/**
 * What the program's open assessment campaigns hold of a control, as its next step reads it: the
 * campaign whose latest plan holds what is left to judge of it (`planned`), the whole control while
 * the program's assessors have judged none of it and the objectives nobody has judged once they
 * have judged some; and how many have a draft plan that does not hold that yet, which it could be
 * added to (`drafts`). From `useControlAssessment` in control-assessment.
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
   * objectives, or not on every system whose control baseline selects it: one of the program's
   * requirements is mapped to it. `rest` counts the objectives no such system covers yet where
   * some are covered already; the picker then opens with them chosen. Where every objective is
   * covered somewhere, `system` names the first system the control is short on, where a
   * requirement allocated there can take the mapping; the picker then opens on that system.
   */
  | { kind: "map_requirement"; rest?: number | undefined; system?: StepSystem | undefined }
  /**
   * The control is short on a system and none of the program's requirements is allocated there:
   * one is allocated to the system first, from its own Allocate requirements, over the page.
   */
  | { kind: "allocate_requirement"; system: StepSystem }
  /**
   * The requirements map every objective on every system and one is not covered there by a
   * requirement that cites evidence: the first requirement that cites none and owes evidence (it
   * covers such an objective on such a system), else the first that cites none, in the order
   * given. `null` until a read says which requirements map it.
   */
  | { kind: "link_evidence"; requirement: StepRequirement | null }
  /**
   * Evidence is cited, the program's assessors have not judged every objective the control counts
   * (none of them, or some: the program decides a control once all are judged), and no open
   * campaign's plan holds what is left: it is added to the draft plan of one of the program's
   * campaigns, which takes what the plan lacks.
   */
  | { kind: "assess" }
  /** The same, where no open campaign has a draft plan: an assessment is planned around it. */
  | { kind: "plan_assessment" }
  /**
   * The same, where an open campaign's plan holds what is left to judge (the whole control, while
   * none of it is judged): its assessment is under way there.
   */
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
 * it is with the product assessments behind one the product made, how many of its assessment
 * objectives the program's requirements map and how many its assessors have judged.
 */
export type StepStanding = Pick<ControlStanding, "status"> &
  Partial<
    Pick<
      ControlStanding,
      | "determinedBy"
      | "productAssessments"
      | "objectives"
      | "objectivesMapped"
      | "objectivesAssessed"
    >
  >;

/**
 * Whether the program's assessors have judged some of a control's objectives and not all: a
 * control at Not assessed whose findings decide nothing yet, since the program decides a control
 * once every objective it counts is judged.
 */
export function judgedInPart(standing: StepStanding): boolean {
  const { objectives = 0, objectivesAssessed = 0 } = standing;
  return objectivesAssessed > 0 && objectivesAssessed < objectives;
}

/**
 * The objectives no requirement maps yet, where the requirements map some of a control's and not
 * all; none otherwise, the whole control being what is left. Read from the status alone, which
 * counts an objective once it is covered on every system: where the control is counted on one
 * system, or on none, these are the objectives no system covers. `mappingStep` reads them system by
 * system.
 */
export function objectivesLeft(standing: StepStanding): number | undefined {
  const { objectives = 0, objectivesMapped = 0 } = standing;
  return objectivesMapped > 0 && objectivesMapped < objectives
    ? objectives - objectivesMapped
    : undefined;
}

/** Whether a control's step can be said from its status alone, or waits on its coverage system by system. */
export function stepNeedsCoverage(
  standing: Pick<ControlStanding, "status" | "requirements" | "evidenced">,
): boolean {
  // Mapped somewhere and short somewhere: what is left, and on which system, is the coverage's.
  if (standing.status === "no_requirement") return standing.requirements > 0;
  // Two or more requirements without evidence: the coverage says which one owes it.
  if (standing.status === "no_evidence") return standing.requirements - standing.evidenced > 1;
  return false;
}

/**
 * What is left to map of a control at No requirement, read from where its requirements cover it on
 * each system that selects it: nothing covered anywhere, and the whole control is mapped; some of
 * its objectives covered on no such system, and those are (Map 3 more objectives); else the first
 * system it is short on, mapped on where a requirement of the program is allocated there (Map on
 * R210-STD-CUSA) and allocated to first where none is (Allocate to R210-STD-CUSA).
 */
export function mappingStep(
  coverage: StepCoverage,
): Extract<ControlNextStep, { kind: "map_requirement" | "allocate_requirement" }> {
  const covered = coverage.objectives.filter(coveredSomewhere).length;
  const anywhere =
    covered > 0 || coverage.systems.some((system) => system.mapped || system.objectivesMapped > 0);
  if (!anywhere) return { kind: "map_requirement" };
  const rest = coverage.objectives.length - covered;
  if (rest > 0) return { kind: "map_requirement", rest };
  const short = coverage.systems.find((system) => !system.mapped);
  if (!short) return { kind: "map_requirement" };
  const system = { id: short.id, code: short.code, name: short.name };
  return short.allocated > 0
    ? { kind: "map_requirement", system }
    : { kind: "allocate_requirement", system };
}

/**
 * The next step for a control at a status: the one thing that moves it up the ladder. A satisfied
 * control has none, whoever determined it. No requirement maps the control, or they map some of its
 * objectives, or they do not on every system whose control baseline selects it: the step maps the
 * rest, or maps on the system it is short on, or allocates a requirement there first, which
 * `coverage` (the control's objectives and systems, as `program_control_objectives` reads them)
 * says; without it, the step says what the status alone does. `requirements` are the requirements
 * that map the control, as its trace reads them; without them a control with no evidence still
 * says its step, and names no requirement. With `coverage`, the step names the requirement that
 * owes evidence: it cites none and covers an objective on a system where nothing evidences it.
 * Evidence no assessor has determined, or has determined on only some of the control's objectives,
 * goes into an assessment of what is left: the campaign whose plan holds it already, else the draft
 * plan of one of the program's open campaigns, else a new one planned around it; without `plans`
 * the step is to add it to a campaign. A determination short of
 * satisfied leads to what decided it: the program's assessment findings, or the product assessment
 * the program inherits it from.
 */
export function controlNextStep(
  standing: StepStanding,
  requirements?: readonly TraceRequirement[] | undefined,
  plans?: StepPlans | undefined,
  coverage?: StepCoverage | undefined,
): ControlNextStep | null {
  switch (standing.status) {
    case "no_requirement": {
      if (coverage) return mappingStep(coverage);
      const rest = objectivesLeft(standing);
      return rest ? { kind: "map_requirement", rest } : { kind: "map_requirement" };
    }
    case "no_evidence": {
      const bare = requirements?.filter((requirement) => requirement.evidence_count === 0) ?? [];
      // A requirement that owes evidence, where the coverage says which: evidence on one whose
      // objectives are evidenced already, on every system it covers them on, moves nothing.
      const owed = new Set(
        (coverage?.requirements ?? [])
          .filter((requirement) => requirement.owes)
          .map((requirement) => requirement.id),
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

/** The steps done on the control itself, each opening where it is done rather than leading away. */
export type InPlaceStepKind =
  "map_requirement" | "allocate_requirement" | "assess" | "plan_assessment";

/** A step done on the control itself, which opens where it is done rather than leading away. */
export const isInPlaceStep = (
  step: ControlNextStep | TraceGapFix,
): step is Extract<ControlNextStep | TraceGapFix, { kind: InPlaceStepKind }> =>
  step.kind === "map_requirement" ||
  step.kind === "allocate_requirement" ||
  step.kind === "assess" ||
  step.kind === "plan_assessment";

/** A step in the words of its link: what the reader does, and on which record. */
export function nextStepLabel(step: ControlNextStep | TraceGapFix): string {
  switch (step.kind) {
    case "map_requirement":
      if ("system" in step && step.system) return `Map on ${step.system.code}`;
      return "rest" in step && step.rest
        ? step.rest === 1
          ? "Map 1 more objective"
          : `Map ${step.rest} more objectives`
        : "Map a requirement";
    case "allocate_requirement":
      return `Allocate to ${step.system.code}`;
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

/**
 * The fix for a trace's gap: the stage that holds no record, and what fills it; or, for a control
 * its requirements map in part or its assessors have judged in part, the step its Details carry,
 * in the stage that holds them.
 */
export type TraceGapFix =
  /**
   * A control no requirement of the program maps; or one they map some objectives of (`rest`), or
   * not on every system that selects it (`system`), as its next step says.
   */
  | {
      stage: "requirement";
      kind: "map_requirement";
      rest?: number | undefined;
      system?: StepSystem | undefined;
    }
  /** A control short on a system none of the program's requirements is allocated to. */
  | { stage: "requirement"; kind: "allocate_requirement"; system: StepSystem }
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
  /**
   * A control whose evidence no assessor has determined, or has judged on only some of its
   * objectives, and no open campaign's plan holds what is left.
   */
  | { stage: "finding"; kind: "assess" }
  /** The same, where no open campaign has a draft plan to add it to. */
  | { stage: "finding"; kind: "plan_assessment" }
  /**
   * A control whose evidence an open campaign's plan holds (what is left to judge of it, for one
   * judged in part) and no assessor has determined yet: nothing the reader can close, and the
   * campaign where it is assessed is named instead.
   */
  | { stage: "finding"; kind: "open_campaign"; campaign: StepCampaign };

/** Whether a gap's entry is a fix the reader makes, rather than words that say why it is empty. */
export const isReaderFix = (fix: TraceGapFix) =>
  fix.kind !== "decided_by_product" && fix.kind !== "open_campaign";

/**
 * The gaps of a trace that its record's reader can close, each with the stage it fills. A control
 * read inside a program offers a requirement where none maps it, where its requirements cite no
 * evidence, evidence for the first of them, and, where no assessor has determined that evidence,
 * an assessment that holds the control (beside the findings of one judged in part, an assessment
 * of the rest); a requirement offers a control and evidence of its own;
 * and an operational issue that names no requirement offers one, since the link is the issue's
 * own, made on its page. A stage with nothing wrong in it (no operational issue, no risk) is not a
 * gap, and otherwise a record further down the chain closes nothing upstream from its own page:
 * evidence, a finding, a risk and a remediation item offer nothing.
 *
 * `standing` is where the program stands on a control, as the program's control status reads it.
 * A control the program's product variants inherit with a determination (`determinedBy`
 * "product") is decided by the product assessment, not missing a requirement: its requirements
 * stage names that assessment, the one that decided it first, and offers no requirement. A control
 * its requirements map in part (some objectives, or not on every system that selects it) stands at
 * No requirement with requirements in the stage: the stage is given `step`, the control's next
 * step as its Details read it (Map 3 more objectives, Map on R210-STD-CUSA, Allocate to
 * R210-STD-CUSA), which the trace draws where the stage can draw an action beside its records, and
 * its Evidence stage still offers evidence for the first that cites none. Its
 * Assessment findings stage waits on `plans`, what the program's open campaigns hold of it: the
 * campaign whose plan holds it already is named, else the control is added to a draft plan or an
 * assessment is planned around it. A control its assessors have judged in part (some objectives,
 * not all: `judgedInPart`) stands at Not assessed with findings in the stage: the stage carries the
 * same step beside them, the one its Details carry, which assesses what is left (the campaign whose
 * plan holds the rest, a draft plan, or a new plan).
 */
export function traceGapFixes(
  trace: Pick<AssuranceTrace, "focus" | "controls" | "requirements" | "evidence" | "findings">,
  programId?: string | null | undefined,
  standing?: StepStanding | null | undefined,
  plans?: StepPlans | null | undefined,
  step?: ControlNextStep | null | undefined,
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
    } else {
      // Mapped in part: the requirements stage holds what maps it and offers what is left.
      if (
        standing?.status === "no_requirement" &&
        (step?.kind === "map_requirement" || step?.kind === "allocate_requirement")
      )
        fixes.push({ stage: "requirement", ...step });
      if (trace.evidence.length === 0) {
        const bare = trace.requirements.find((requirement) => requirement.evidence_count === 0);
        if (bare)
          fixes.push({
            stage: "evidence",
            kind: "link_evidence",
            requirement: stepRequirement(bare),
          });
      } else if (
        standing?.status === "not_assessed" &&
        plans &&
        // An empty stage, or one that holds the findings of a control judged in part, which decide
        // nothing until the rest is judged: the step assesses what is left.
        (trace.findings.length === 0 || judgedInPart(standing))
      ) {
        fixes.push({ stage: "finding", ...assessStep(plans) });
      }
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
